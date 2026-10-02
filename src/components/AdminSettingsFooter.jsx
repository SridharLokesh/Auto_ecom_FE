import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Save, Plus, Upload, Info, CheckCircle,
  Link2, Phone, Mail, MapPin, ChevronDown, ChevronUp, X, GripVertical,
} from 'lucide-react';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { resolveUrl, CollapseCard, ColorPicker } from '../utils/settingsShared';

const LOGO_W = 120;
const LOGO_H = 40;

const SEED_COLUMNS = [
  { id: 'col-brand', type: 'brand', title: 'Brand', enabled: true },
  {
    id: 'col-about', type: 'links', title: 'About TVS', enabled: true,
    items: [
      { label: 'Founded in 1978',              href: '' },
      { label: 'Headquartered in Hosur, TN',   href: '' },
      { label: 'ISO 9001:2015 Certified',      href: '' },
      { label: '1 Year Warranty on All Parts', href: '' },
      { label: 'Pan-India Dealer Network',     href: '' },
    ],
  },
  {
    id: 'col-help', type: 'links', title: 'Help & Support', enabled: true,
    items: [
      { label: 'Customer Support', href: '/customer-care'        },
      { label: 'Track My Order',   href: '/profile?tab=tracking' },
      { label: 'Return Policy',    href: '/customer-care'        },
      { label: 'Warranty Claims',  href: '/customer-care'        },
      { label: 'Become a Dealer',  href: '/become-dealer'        },
    ],
  },
  {
    id: 'col-contact', type: 'contact', title: 'Contact Us', enabled: true,
    phone: '1800-258-6454',       phoneNote:   'Toll-free · 24×7',
    email: 'parts@tvsmotors.com', emailNote:   'Reply within 4 hours',
    address: 'TVS Motor Company', addressNote: 'Hosur, Tamil Nadu, India',
  },
];

const SEED_SOCIALS = { facebook: '#', twitter: '#', instagram: '#', youtube: '#' };
const SEED_TAGLINE = 'Official online store for genuine TVS spare parts, accessories and lubricants. Quality assured. Warranty backed.';
const SEED_BOTTOM  = { certified: 'OEM Certified Parts', secure: 'Secure Checkout', warranty: '1 Year Warranty' };

export default function AdminSettingsFooter() {
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const [columns,     setColumns]     = useState(SEED_COLUMNS);
  const [socials,     setSocials]     = useState(SEED_SOCIALS);
  const [tagline,     setTagline]     = useState(SEED_TAGLINE);
  const [bottom,      setBottom]      = useState(SEED_BOTTOM);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile,    setLogoFile]    = useState(null);
  const [bgColor,     setBgColor]     = useState('#0a1f44');

  const logoRef = useRef(null);

  const applyData = useCallback((f) => {
    if (!f) return;
    if (f.tagline) setTagline(f.tagline);
    if (f.socials) setSocials({ ...SEED_SOCIALS, ...f.socials });
    if (f.bottom)  setBottom({ ...SEED_BOTTOM,   ...f.bottom });
    if (f.logo)    setLogoPreview(resolveUrl(f.logo));
    if (f.bgColor) setBgColor(f.bgColor);

    if (Array.isArray(f.columns) && f.columns.length > 0) {
      setColumns(
        f.columns.map(sc => {
          const seed = SEED_COLUMNS.find(d => d.id === sc.id) ?? {};
          return { ...seed, ...sc, items: sc.items ?? seed.items ?? [] };
        })
      );
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/site-settings');
      applyData(data?.footer);
    } catch { /* keep seeds */ }
  }, [applyData]);

  useEffect(() => {
    (async () => {
      await fetchSettings();
      setLoading(false);
    })();
  }, [fetchSettings]);

  /* ── Logo ── */
  const onLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Images only'); return; }
    if (file.size > 2 * 1024 * 1024)    { toast.error('Max 2 MB');    return; }
    const reader = new FileReader();
    reader.onload = ev => { setLogoPreview(ev.target.result); setLogoFile(file); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  /* ── Column helpers ── */
  const toggleCol      = (id)             => setColumns(cs => cs.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
  const updateColTitle = (id, val)        => setColumns(cs => cs.map(c => c.id === id ? { ...c, title: val } : c));
  const updateContact  = (id, field, val) => setColumns(cs => cs.map(c => c.id === id ? { ...c, [field]: val } : c));
  const addLinkItem    = (id)             => setColumns(cs => cs.map(c => c.id === id ? { ...c, items: [...(c.items || []), { label: '', href: '' }] } : c));
  const updateLinkItem = (cid, i, f, v)  => setColumns(cs => cs.map(c => c.id === cid ? { ...c, items: c.items.map((it, idx) => idx === i ? { ...it, [f]: v } : it) } : c));
  const removeLinkItem = (cid, i)        => setColumns(cs => cs.map(c => c.id === cid ? { ...c, items: c.items.filter((_, idx) => idx !== i) } : c));

  const addColumn = () => {
    const id = `col-${Date.now()}`;
    setColumns(cs => [...cs, { id, type: 'links', title: 'New Column', enabled: true, items: [] }]);
  };
  const removeColumn = (id) => {
    const col = columns.find(c => c.id === id);
    if (col?.type === 'brand' || col?.type === 'contact') {
      toast.error('Brand and Contact columns cannot be removed'); return;
    }
    if (!window.confirm('Remove this column?')) return;
    setColumns(cs => cs.filter(c => c.id !== id));
  };
  const moveColumn = (idx, dir) => {
    setColumns(cs => {
      const arr = [...cs]; const t = idx + dir;
      if (t < 0 || t >= arr.length) return cs;
      [arr[idx], arr[t]] = [arr[t], arr[idx]];
      return arr;
    });
  };

  /* ── Save ── */
  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('section', 'footer');
      fd.append('columns', JSON.stringify(columns));
      fd.append('socials', JSON.stringify(socials));
      fd.append('tagline', tagline);
      fd.append('bottom',  JSON.stringify(bottom));
      fd.append('bgColor', bgColor);                  // ✅ send color
      if (logoFile) fd.append('footerLogo', logoFile);

      const { data } = await api.post('/admin/site-settings', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Footer settings saved!');
      setLogoFile(null);
      applyData(data?.settings?.footer);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse max-w-2xl">
      {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100" />)}
    </div>
  );

  const enabledCount = columns.filter(c => c.enabled).length;

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h3 className="font-black text-gray-900 text-lg">Footer Settings</h3>
        <p className="text-xs text-gray-400 mt-0.5">{enabledCount} of {columns.length} columns enabled</p>
      </div>

      {/* ── Background Color ── */}
      <CollapseCard title="Footer Background Color">
        <ColorPicker label="Background Color" value={bgColor} onChange={setBgColor} />
        {/* live mini-preview */}
        <div className="rounded-2xl overflow-hidden mt-1">
          <div className="p-4 text-center" style={{ backgroundColor: bgColor }}>
            <p className="text-xs text-white/60 font-medium">Footer background preview</p>
          </div>
        </div>
      </CollapseCard>

      {/* ── Footer Logo ── */}
      <CollapseCard title="Footer Logo">
        <div className="flex flex-wrap items-start gap-5">
          <button type="button" onClick={() => logoRef.current?.click()}
            className="flex flex-col items-center justify-center w-36 h-20 border-2 border-dashed border-gray-200 rounded-2xl hover:border-[#0a1f44] hover:bg-blue-50 transition-all gap-2 flex-shrink-0 px-3">
            <Upload className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-500 text-center leading-tight">Click to upload<br/>PNG / SVG / WebP</span>
          </button>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogoChange} />

          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Preview</p>
            <div className="rounded-xl p-3 inline-flex items-center justify-center"
              style={{ minWidth: LOGO_W + 24, minHeight: LOGO_H + 24, backgroundColor: bgColor }}>
              {logoPreview
                ? <img src={logoPreview} alt="Footer logo"
                    style={{ width: LOGO_W, height: LOGO_H, objectFit: 'contain' }} />
                : <div style={{ width: LOGO_W, height: LOGO_H }}
                    className="border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-white/40">No logo</span>
                  </div>
              }
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Rendered at <strong>{LOGO_W}×{LOGO_H}px</strong>. Use a white/light version for dark backgrounds. Max 2 MB.
          </p>
        </div>

        {logoFile && (
          <div className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-700 font-medium">New logo ready — click Save to apply</span>
          </div>
        )}
      </CollapseCard>

      {/* ── Brand Tagline ── */}
      <CollapseCard title="Brand Tagline">
        <div>
          <label className="label">Tagline text</label>
          <textarea rows={3} value={tagline} onChange={e => setTagline(e.target.value)}
            className="input-field text-sm resize-none" placeholder="Short brand description…" />
          <p className="text-xs text-gray-400 mt-1">{tagline.length}/300 characters</p>
        </div>
      </CollapseCard>

      {/* ── Social Links ── */}
      <CollapseCard title="Social Media Links">
        {[
          { key: 'facebook',  Icon: FaFacebook,  label: 'Facebook URL'    },
          { key: 'twitter',   Icon: FaTwitter,   label: 'Twitter / X URL' },
          { key: 'instagram', Icon: FaInstagram, label: 'Instagram URL'   },
          { key: 'youtube',   Icon: FaYoutube,   label: 'YouTube URL'     },
        ].map(({ key, Icon, label }) => (
          <div key={key}>
            <label className="label flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" />{label}</label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input type="url" value={socials[key] || ''}
                onChange={e => setSocials(s => ({ ...s, [key]: e.target.value }))}
                placeholder="https://..." className="input-field text-sm pl-8" />
            </div>
          </div>
        ))}
      </CollapseCard>

      {/* ── Columns ── */}
      <CollapseCard title="Footer Columns" badge={columns.length}>
        <div className="space-y-4">
          {columns.map((col, idx) => (
            <div key={col.id}
              className={`border-2 rounded-2xl transition-all ${col.enabled ? 'border-gray-200' : 'border-gray-100 opacity-50'}`}>

              {/* header */}
              <div className="flex items-center gap-2 p-3 flex-wrap sm:flex-nowrap">
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button onClick={() => moveColumn(idx, -1)} disabled={idx === 0}
                    className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => moveColumn(idx, 1)} disabled={idx === columns.length - 1}
                    className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <input type="text" value={col.title || ''}
                  onChange={e => updateColTitle(col.id, e.target.value)}
                  className="input-field text-sm font-semibold flex-1 py-1.5 min-w-0"
                  placeholder="Column title" />

                <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 whitespace-nowrap
                  ${col.type === 'brand'   ? 'bg-blue-100 text-blue-600' :
                    col.type === 'contact' ? 'bg-purple-100 text-purple-600' :
                                             'bg-gray-100 text-gray-500'}`}>
                  {col.type}
                </span>

                <div onClick={() => toggleCol(col.id)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer flex-shrink-0
                    ${col.enabled ? 'bg-[#0a1f44]' : 'bg-gray-200'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all
                    ${col.enabled ? 'left-4' : 'left-0.5'}`} />
                </div>

                {col.type !== 'brand' && col.type !== 'contact' && (
                  <button onClick={() => removeColumn(col.id)}
                    className="p-1 text-red-400 hover:text-red-600 flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* body */}
              <div className="px-4 pb-4 space-y-3">
                {col.type === 'brand' && (
                  <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
                    Shows the footer logo, tagline, and social links — edit those in the sections above.
                  </p>
                )}

                {col.type === 'contact' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { field: 'phone',       label: 'Phone',        Icon: Phone  },
                      { field: 'phoneNote',   label: 'Phone note',   Icon: null   },
                      { field: 'email',       label: 'Email',        Icon: Mail   },
                      { field: 'emailNote',   label: 'Email note',   Icon: null   },
                      { field: 'address',     label: 'Address',      Icon: MapPin },
                      { field: 'addressNote', label: 'Address note', Icon: null   },
                    ].map(({ field, label, Icon }) => (
                      <div key={field}>
                        <label className="label text-[11px] flex items-center gap-1">
                          {Icon && <Icon className="w-3 h-3" />}{label}
                        </label>
                        <input type="text" value={col[field] || ''}
                          onChange={e => updateContact(col.id, field, e.target.value)}
                          className="input-field text-xs py-1.5" />
                      </div>
                    ))}
                  </div>
                )}

                {col.type === 'links' && (
                  <div className="space-y-2">
                    {(col.items || []).map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        <input type="text" value={item.label || ''}
                          onChange={e => updateLinkItem(col.id, i, 'label', e.target.value)}
                          placeholder="Label" className="input-field text-xs py-1.5 flex-1 min-w-0" />
                        <input type="text" value={item.href || ''}
                          onChange={e => updateLinkItem(col.id, i, 'href', e.target.value)}
                          placeholder="Link (optional)" className="input-field text-xs py-1.5 flex-1 min-w-0" />
                        <button onClick={() => removeLinkItem(col.id, i)}
                          className="p-1 text-red-400 hover:text-red-600 flex-shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addLinkItem(col.id)}
                      className="flex items-center gap-1.5 text-xs text-[#0a1f44] font-semibold hover:underline pt-1">
                      <Plus className="w-3.5 h-3.5" />Add item
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          <button onClick={addColumn}
            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-500
                       font-semibold hover:border-[#0a1f44] hover:text-[#0a1f44] transition-all
                       flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />Add Column
          </button>
        </div>
      </CollapseCard>

      {/* ── Bottom Trust Badges ── */}
      <CollapseCard title="Bottom Trust Badges" defaultOpen={false}>
        {[
          { key: 'certified', label: '🔧 Badge 1' },
          { key: 'secure',    label: '🔒 Badge 2' },
          { key: 'warranty',  label: '🛡️ Badge 3' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="label">{label}</label>
            <input type="text" value={bottom[key] || ''}
              onChange={e => setBottom(b => ({ ...b, [key]: e.target.value }))}
              className="input-field text-sm" />
          </div>
        ))}
      </CollapseCard>

      {/* ── Save ── */}
      <button onClick={save} disabled={saving}
        className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2">
        {saving
          ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
          : <><Save className="w-4 h-4" />Save Footer Settings</>}
      </button>
    </div>
  );
}