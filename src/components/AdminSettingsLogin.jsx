// components/AdminSettingsLogin.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Save, Upload, Info } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { CollapseCard, resolveUrl } from '../utils/settingsShared';

/* ═══════════════ MAIN COMPONENT ═══════════════ */
export default function AdminSettingsLogin() {
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const fileRef = useRef(null);

  /* Logo — shared across Login + Register pages, fixed 120×40px */
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile,    setLogoFile]    = useState(null);

  /* Login page text */
  const [loginHeading,  setLoginHeading]  = useState('Sign in to your account');
  const [loginSubtitle, setLoginSubtitle] = useState('Access genuine TVS parts and accessories');

  /* Register page text */
  const [registerHeading,  setRegisterHeading]  = useState('Create your account');
  const [registerSubtitle, setRegisterSubtitle] = useState('Join TVS Motors — Official Parts Store');

  const applyData = useCallback((d) => {
    if (!d) return;
    if (d.logoImage)         setLogoPreview(resolveUrl(d.logoImage));
    if (d.loginHeading)      setLoginHeading(d.loginHeading);
    if (d.loginSubtitle)     setLoginSubtitle(d.loginSubtitle);
    if (d.registerHeading)   setRegisterHeading(d.registerHeading);
    if (d.registerSubtitle)  setRegisterSubtitle(d.registerSubtitle);
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/site-settings');
      applyData(data?.authPage);
    } catch { /* keep defaults */ }
  }, [applyData]);

  useEffect(() => {
    (async () => {
      await fetchSettings();
      setLoading(false);
    })();
  }, [fetchSettings]);

  /* logo upload handler */
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Images only'); e.target.value = ''; return; }
    if (file.size > 2 * 1024 * 1024)    { toast.error('Max 2 MB');    e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = ev => { setLogoPreview(ev.target.result); setLogoFile(file); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  /* save */
  const save = async () => {
    if (!loginHeading.trim() || !registerHeading.trim()) {
      toast.error('Heading fields cannot be empty');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('section',          'authPage');
      fd.append('loginHeading',     loginHeading);
      fd.append('loginSubtitle',    loginSubtitle);
      fd.append('registerHeading',  registerHeading);
      fd.append('registerSubtitle', registerSubtitle);
      if (logoFile) fd.append('logoImage', logoFile);

      const { data } = await api.post('/admin/site-settings', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Login & Register page saved!');
      setLogoFile(null);

      // Re-sync from server response so UI reflects exactly what was persisted
      applyData(data?.settings?.authPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse max-w-2xl">
      {[1, 2].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-100" />)}
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h3 className="font-black text-gray-900 text-lg">Login & Register Page</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Controls the logo and welcome text shown on both the Login and Register screens.
        </p>
      </div>

      {/* ── Logo ── */}
      <CollapseCard title="Brand Logo">
        <div className="flex flex-wrap items-start gap-6">
          {/* Upload zone */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center w-44 h-24 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#0a1f44] hover:bg-blue-50 transition-all gap-1.5 flex-shrink-0"
          >
            <Upload className="w-4 h-4 text-gray-400" />
            <span className="text-[11px] text-gray-500 text-center leading-tight px-1">
              Click to upload<br/>PNG / SVG / WebP
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />

          {/* Live preview — fixed 120×40px, matches real render */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Preview — 120×40px</p>
            <div className="w-[120px] h-[40px] border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-white overflow-hidden">
              {logoPreview
                ? <img src={logoPreview} alt="logo preview" className="w-full h-full object-contain" />
                : <span className="text-[11px] text-gray-400">No logo</span>}
            </div>
            <p className="text-xs text-gray-400 mt-2">Shown in: Login &amp; Register (white card)</p>
          </div>
        </div>

        <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3 mt-4">
          <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Always rendered at <strong>120×40px</strong> with <code className="bg-blue-100 px-1 rounded">object-fit: contain</code>. Use a transparent-background PNG or SVG. Max 2 MB.
          </p>
        </div>
      </CollapseCard>

      {/* ── Login page text ── */}
      <CollapseCard title="Login Page Text">
        <div className="space-y-3">
          <div>
            <label className="label">Heading</label>
            <input type="text" value={loginHeading} onChange={e => setLoginHeading(e.target.value)}
              className="input-field text-sm" placeholder="Sign in to your account" />
          </div>
          <div>
            <label className="label">Subtitle</label>
            <input type="text" value={loginSubtitle} onChange={e => setLoginSubtitle(e.target.value)}
              className="input-field text-sm" placeholder="Access genuine TVS parts and accessories" />
          </div>
        </div>
      </CollapseCard>

      {/* ── Register page text ── */}
      <CollapseCard title="Register Page Text">
        <div className="space-y-3">
          <div>
            <label className="label">Heading</label>
            <input type="text" value={registerHeading} onChange={e => setRegisterHeading(e.target.value)}
              className="input-field text-sm" placeholder="Create your account" />
          </div>
          <div>
            <label className="label">Subtitle</label>
            <input type="text" value={registerSubtitle} onChange={e => setRegisterSubtitle(e.target.value)}
              className="input-field text-sm" placeholder="Join TVS Motors — Official Parts Store" />
          </div>
        </div>
      </CollapseCard>

      {/* Save */}
      <button onClick={save} disabled={saving}
        className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2">
        {saving
          ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
          : <><Save className="w-4 h-4" />Save Login & Register Settings</>}
      </button>
    </div>
  );
}