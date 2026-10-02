// components/AdminSettingsNavbar.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { Save, Upload, Info, CheckCircle } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PRESET_COLORS, CollapseCard, resolveUrl } from '../utils/settingsShared';

const LOGO_W = 120;
const LOGO_H = 40;

export default function AdminSettingsNavbar() {
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  const [promoText,    setPromoText]    = useState('Genuine TVS Parts & Accessories — Free shipping above ₹999 — 1 Year Warranty on all parts');
  const [promoVisible, setPromoVisible] = useState(true);
  const [promoColor,   setPromoColor]   = useState('#de1c0e');

  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile,    setLogoFile]    = useState(null);
  const logoRef = useRef(null);

  const applyData = useCallback((n) => {
    if (!n) return;
    if (n.promoText    != null) setPromoText(n.promoText);
    if (n.promoVisible != null) setPromoVisible(n.promoVisible);
    if (n.promoColor)           setPromoColor(n.promoColor);
    if (n.logoLight)            setLogoPreview(resolveUrl(n.logoLight));
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/site-settings');
      applyData(data?.navbar);
    } catch { /* use defaults */ }
  }, [applyData]);

  useEffect(() => {
    (async () => {
      await fetchSettings();
      setLoading(false);
    })();
  }, [fetchSettings]);

  const onLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Images only'); return; }
    if (file.size > 2 * 1024 * 1024)    { toast.error('Max 2 MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => { setLogoPreview(ev.target.result); setLogoFile(file); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('section',      'navbar');
      fd.append('promoText',    promoText);
      fd.append('promoVisible', String(promoVisible));
      fd.append('promoColor',   promoColor);
      if (logoFile) fd.append('logoLight', logoFile);

      const { data } = await api.post('/admin/site-settings', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Navbar settings saved!');
      setLogoFile(null);
      applyData(data?.settings?.navbar);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse max-w-2xl">
      {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-100" />)}
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h3 className="font-black text-gray-900 text-lg">Navbar Settings</h3>
        <p className="text-xs text-gray-400 mt-0.5">Edit the logo and the scrolling promo strip at the top.</p>
      </div>

      {/* ── Promo Strip ── */}
      <CollapseCard title="Promo Strip">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Strip visibility</span>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setPromoVisible(v => !v)}
              className={`w-10 h-5 rounded-full transition-colors relative ${promoVisible ? 'bg-[#0a1f44]' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${promoVisible ? 'left-5' : 'left-0.5'}`} />
            </div>
            <span className="text-xs font-semibold text-gray-600">{promoVisible ? 'Visible' : 'Hidden'}</span>
          </label>
        </div>

        <div>
          <label className="label">Promo Text</label>
          <input
            type="text"
            value={promoText}
            onChange={e => setPromoText(e.target.value)}
            maxLength={200}
            placeholder="Use  —  as separator between items"
            className="input-field text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">{promoText.length}/200 · Use — as separator</p>
        </div>

        <div>
          <label className="label">Strip Background Color</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {PRESET_COLORS.map(({ hex, name }) => (
              <button
                key={hex}
                type="button"
                title={name}
                onClick={() => setPromoColor(hex)}
                className="relative w-7 h-7 rounded-full border-2 transition-all focus:outline-none flex-shrink-0"
                style={{
                  backgroundColor: hex,
                  borderColor: promoColor === hex ? '#000' : 'transparent',
                  boxShadow: promoColor === hex ? `0 0 0 2px white, 0 0 0 4px ${hex}` : 'none',
                }}
              >
                {promoColor === hex && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
          {promoColor && (
            <p className="text-xs text-gray-400 mt-1.5">
              Selected: <span className="font-semibold text-gray-600">{PRESET_COLORS.find(c => c.hex === promoColor)?.name ?? promoColor}</span>
            </p>
          )}
        </div>

        <div>
          <label className="label">Live Preview</label>
          {promoVisible ? (
            <div className="rounded-xl overflow-hidden">
              <div
                className="text-white py-2 px-4 text-center text-xs font-medium truncate"
                style={{ background: promoColor }}
              >
                {promoText || 'Your promo text will appear here'}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-3 text-center text-xs text-gray-400">
              Strip is hidden — toggle above to show
            </div>
          )}
        </div>
      </CollapseCard>

      {/* ── Navbar Logo ── */}
      <CollapseCard title="Navbar Logo">
        <div className="flex flex-wrap items-start gap-5">
          <button
            type="button"
            onClick={() => logoRef.current?.click()}
            className="flex flex-col items-center justify-center w-36 h-22 border-2 border-dashed border-gray-200 rounded-2xl hover:border-[#0a1f44] hover:bg-blue-50 transition-all gap-2 flex-shrink-0 px-3 py-4"
          >
            <Upload className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-500 text-center leading-tight">Click to upload<br/>PNG / SVG / WebP</span>
          </button>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogoChange} />

          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">
              Preview — {LOGO_W}×{LOGO_H}px
            </p>
            <div
              className="bg-white border border-gray-200 rounded-xl p-3 inline-flex items-center justify-center"
              style={{ minWidth: LOGO_W + 24, minHeight: LOGO_H + 24 }}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Navbar logo" style={{ width: LOGO_W, height: LOGO_H, objectFit: 'contain' }} />
              ) : (
                <div
                  style={{ width: LOGO_W, height: LOGO_H }}
                  className="border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center"
                >
                  <span className="text-xs text-gray-400">No logo</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Shown in: Navbar (light background)</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Always rendered at <strong>{LOGO_W}×{LOGO_H}px</strong> with <code>object-fit: contain</code>.
            Use a transparent-background PNG or SVG. Max 2 MB.
          </p>
        </div>

        {logoFile && (
          <div className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className="text-xs text-green-700 font-medium">New logo ready — click Save to apply</span>
          </div>
        )}
      </CollapseCard>

      {/* Save */}
      <button
        onClick={save}
        disabled={saving}
        className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2"
      >
        {saving
          ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
          : <><Save className="w-4 h-4" />Save Navbar Settings</>}
      </button>
    </div>
  );
}