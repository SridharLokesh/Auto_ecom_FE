// components/AdminSettingsDealerPage.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { Save, Plus, X, ArrowUp, ArrowDown, ChevronDown, Check } from 'lucide-react';
import ReactDOM from 'react-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  CollapseCard, ColorPicker,
  BgTypePicker, ImageUploadZone, BgPreview, resolveUrl,
} from '../utils/settingsShared';

/* ─────────────────── Portal Dropdown ─────────────────── */
function useDropdownPortal(open, setOpen, triggerRef, listRef) {
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect       = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const listHeight = 256;
    const openUp     = spaceBelow < listHeight && rect.top > listHeight;
    setCoords({
      top:   openUp ? rect.top - listHeight - 4 : rect.bottom + 4,
      left:  rect.left,
      width: rect.width,
    });
  }, [triggerRef]);

  useEffect(() => {
    if (!open) return;
    updateCoords();
    const onScroll = (e) => {
      if (listRef.current && (listRef.current === e.target || listRef.current.contains(e.target))) return;
      setOpen(false);
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', updateCoords);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [open, setOpen, updateCoords, listRef]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        listRef.current    && !listRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, setOpen, triggerRef, listRef]);

  return coords;
}

function PortalDropdown({ value, onChange, options }) {
  const [open, setOpen]   = useState(false);
  const triggerRef        = useRef(null);
  const listRef           = useRef(null);
  const coords            = useDropdownPortal(open, setOpen, triggerRef, listRef);
  const selected          = options.find(o => o.value === value);

  const menu = open && ReactDOM.createPortal(
    <ul
      ref={listRef}
      role="listbox"
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        width: coords.width,
        minWidth: coords.width,
        zIndex: 99999,
      }}
      className="bg-white border border-gray-200 rounded-xl shadow-xl py-1 max-h-64 overflow-y-auto"
    >
      {options.map(o => {
        const active = o.value === value;
        return (
          <li
            key={o.value}
            role="option"
            aria-selected={active}
            onMouseDown={e => { e.preventDefault(); onChange(o.value); setOpen(false); }}
            className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer select-none transition-colors
              ${active ? 'bg-[#0a1f44] text-white' : 'text-gray-700 hover:bg-[#e8edf5] hover:text-[#0a1f44]'}`}
          >
            <span className="flex-1">{o.label}</span>
            {active && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
          </li>
        );
      })}
    </ul>,
    document.body
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`input-field flex items-center justify-between gap-2 w-full cursor-pointer text-sm transition-colors
          ${open ? 'border-[#0a1f44] ring-2 ring-[#0a1f44]/10' : ''}`}
      >
        <span className="truncate text-left">{selected?.label ?? 'Select…'}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {menu}
    </>
  );
}

/* ─────────────────── constants ─────────────────── */
const ICON_OPTIONS = [
  'TrendingUp','Shield','Store','Users','Star','Zap',
  'Award','Package','Truck','Headphones','CheckCircle','Globe',
].map(ic => ({ label: ic, value: ic }));

/* ═══════════════ MAIN COMPONENT ═══════════════ */
export default function AdminSettingsDealerPage() {
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  /* Hero */
  const [heroTitle,     setHeroTitle]     = useState('Become a TVS Dealer');
  const [heroSubtitle,  setHeroSubtitle]  = useState("Partner with India's leading two-wheeler brand. Sell genuine TVS parts and grow your business.");
  const [heroBgType,    setHeroBgType]    = useState('color');
  const [heroBgColor,   setHeroBgColor]   = useState('#0a1f44');
  const [heroBgPreview, setHeroBgPreview] = useState(null);
  const [heroBgFile,    setHeroBgFile]    = useState(null);

  /* Badge strip */
  const [heroBadges, setHeroBadges] = useState([
    { text: 'No Joining Fee' },
    { text: '4,000+ Partners Across India' },
    { text: 'Your Own Dashboard' },
  ]);

  /* Why partner section */
  const [whyTitle,    setWhyTitle]    = useState('Why Partner With Us?');
  const [whySubtitle, setWhySubtitle] = useState('Everything you need to build a successful parts dealership');

  /* Benefit cards */
  const [benefits, setBenefits] = useState([
    { icon: 'TrendingUp', title: 'Earn More Revenue',    desc: 'Access TVS customer base and earn consistent income from spare parts sales.' },
    { icon: 'Shield',     title: 'Official Partnership', desc: 'Become an authorised TVS dealer with official credentials and branding.' },
    { icon: 'Store',      title: 'Your Own Dashboard',   desc: 'Manage products, track orders and monitor revenue all in one place.' },
    { icon: 'Users',      title: 'Dedicated Support',    desc: 'Priority support from our dealer relations team and training materials.' },
  ]);

  // ── extracted so it can be called on mount AND after save ──
  const applyData = useCallback((d) => {
    if (!d) return;
    if (d.heroTitle)          setHeroTitle(d.heroTitle);
    if (d.heroSubtitle)       setHeroSubtitle(d.heroSubtitle);
    if (d.heroBgType)         setHeroBgType(d.heroBgType);
    if (d.heroBgColor)        setHeroBgColor(d.heroBgColor);
    if (d.heroBgImage)        setHeroBgPreview(resolveUrl(d.heroBgImage));
    if (d.heroBadges?.length) setHeroBadges(d.heroBadges);
    if (d.whyTitle)           setWhyTitle(d.whyTitle);
    if (d.whySubtitle)        setWhySubtitle(d.whySubtitle);
    if (d.benefits?.length)   setBenefits(d.benefits);
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/site-settings');
      applyData(data?.dealerPage);
    } catch { /* keep defaults */ }
  }, [applyData]);

  useEffect(() => {
    (async () => {
      await fetchSettings();
      setLoading(false);
    })();
  }, [fetchSettings]);

  /* hero bg image handler */
  const handleHeroBgFile = (file) => {
    if (!file.type.startsWith('image/')) { toast.error('Images only'); return; }
    if (file.size > 4 * 1024 * 1024)    { toast.error('Max 4 MB');    return; }
    const reader = new FileReader();
    reader.onload = ev => { setHeroBgPreview(ev.target.result); setHeroBgFile(file); };
    reader.readAsDataURL(file);
  };

  /* badges */
  const addBadge    = () => setHeroBadges(b => [...b, { text: '' }]);
  const removeBadge = (i) => setHeroBadges(b => b.filter((_, idx) => idx !== i));
  const updateBadge = (i, val) => setHeroBadges(b => b.map((x, idx) => idx === i ? { text: val } : x));

  /* benefits */
  const addBenefit    = () => setBenefits(b => [...b, { icon: 'Star', title: 'New Benefit', desc: 'Description.' }]);
  const removeBenefit = (i) => setBenefits(b => b.filter((_, idx) => idx !== i));
  const updateBenefit = (i, field, val) => setBenefits(b => b.map((x, idx) => idx === i ? { ...x, [field]: val } : x));
  const moveBenefit   = (i, dir) => {
    setBenefits(b => {
      const arr = [...b]; const t = i + dir;
      if (t < 0 || t >= arr.length) return b;
      [arr[i], arr[t]] = [arr[t], arr[i]]; return arr;
    });
  };

  /* save */
  const save = async () => {
    if (!heroTitle.trim()) { toast.error('Hero title is required'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('section',      'dealerPage');
      fd.append('heroTitle',    heroTitle);
      fd.append('heroSubtitle', heroSubtitle);
      fd.append('heroBgType',   heroBgType);
      fd.append('heroBgColor',  heroBgColor);
      fd.append('heroBadges',   JSON.stringify(heroBadges.filter(b => b.text.trim())));
      fd.append('whyTitle',     whyTitle);
      fd.append('whySubtitle',  whySubtitle);
      fd.append('benefits',     JSON.stringify(benefits));
      if (heroBgFile) fd.append('heroBgImage', heroBgFile);

      const { data } = await api.post('/admin/site-settings', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Dealer page saved!');
      setHeroBgFile(null);

      // Re-apply from server response so UI reflects exactly what was persisted
      applyData(data?.settings?.dealerPage);
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
        <h3 className="font-black text-gray-900 text-lg">Become a Dealer Page</h3>
        <p className="text-xs text-gray-400 mt-0.5">Edit hero, badge strip and benefit cards. The application form and How It Works steps are not editable here.</p>
      </div>

      {/* ── Hero ── */}
      <CollapseCard title="Hero Section">
        <div className="space-y-3">
          <div>
            <label className="label">Hero Title *</label>
            <input type="text" value={heroTitle} onChange={e => setHeroTitle(e.target.value)}
              className="input-field text-sm" placeholder="Become a TVS Dealer" />
          </div>
          <div>
            <label className="label">Hero Subtitle</label>
            <textarea rows={2} value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)}
              className="input-field text-sm resize-none" />
          </div>
          <div>
            <label className="label">Background Type</label>
            <BgTypePicker value={heroBgType} onChange={setHeroBgType} />
          </div>
          {heroBgType === 'color' && (
            <ColorPicker label="Background Color" value={heroBgColor} onChange={setHeroBgColor} />
          )}
          {heroBgType === 'image' && (
            <ImageUploadZone
              label="Background Image"
              preview={heroBgPreview}
              onFileChange={handleHeroBgFile}
              hint="Recommended 1400×500px. Image fills the hero. Max 4 MB."
            />
          )}
          <div>
            <label className="label">Preview</label>
            <BgPreview bgType={heroBgType} bgColor={heroBgColor} bgPreview={heroBgPreview}>
              <p className="font-black text-sm">{heroTitle || 'Hero Title'}</p>
              <p className="text-[11px] text-white/75 mt-1 line-clamp-2">{heroSubtitle}</p>
            </BgPreview>
          </div>
        </div>
      </CollapseCard>

      {/* ── Badge Strip ── */}
      <CollapseCard title="Hero Badge Strip" badge={heroBadges.length}>
        <p className="text-xs text-gray-500">Pill badges shown inside the hero section.</p>
        <div className="space-y-2">
          {heroBadges.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="text" value={b.text} onChange={e => updateBadge(i, e.target.value)}
                placeholder="Badge text e.g. No Joining Fee"
                className="input-field text-sm flex-1" />
              <button onClick={() => removeBadge(i)} className="p-1.5 text-red-400 hover:text-red-600 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={addBadge}
          className="flex items-center gap-1.5 text-xs text-[#0a1f44] font-semibold hover:underline">
          <Plus className="w-3.5 h-3.5" />Add Badge
        </button>
      </CollapseCard>

      {/* ── Why Partner ── */}
      <CollapseCard title="Why Partner — Section Labels">
        <div className="space-y-3">
          <div>
            <label className="label">Section Title</label>
            <input type="text" value={whyTitle} onChange={e => setWhyTitle(e.target.value)}
              className="input-field text-sm" />
          </div>
          <div>
            <label className="label">Section Subtitle</label>
            <input type="text" value={whySubtitle} onChange={e => setWhySubtitle(e.target.value)}
              className="input-field text-sm" />
          </div>
        </div>
      </CollapseCard>

      {/* ── Benefit Cards ── */}
      <CollapseCard title="Benefit Cards" badge={benefits.length}>
        <div className="space-y-3">
          {benefits.map((b, i) => (
            <div key={i} className="border-2 border-gray-100 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Card {i + 1}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveBenefit(i, -1)} disabled={i === 0}
                    className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20"><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => moveBenefit(i, 1)} disabled={i === benefits.length - 1}
                    className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20"><ArrowDown className="w-3.5 h-3.5" /></button>
                  <button onClick={() => removeBenefit(i)} className="p-1 text-red-400 hover:text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label text-[11px]">Icon</label>
                  <PortalDropdown
                    value={b.icon}
                    onChange={v => updateBenefit(i, 'icon', v)}
                    options={ICON_OPTIONS}
                  />
                </div>
                <div>
                  <label className="label text-[11px]">Card Title</label>
                  <input type="text" value={b.title} onChange={e => updateBenefit(i, 'title', e.target.value)}
                    className="input-field text-sm" placeholder="Earn More Revenue" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label text-[11px]">Description</label>
                  <textarea rows={2} value={b.desc} onChange={e => updateBenefit(i, 'desc', e.target.value)}
                    className="input-field text-sm resize-none" placeholder="Short description…" />
                </div>
              </div>
            </div>
          ))}

          <button onClick={addBenefit}
            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-500 font-semibold hover:border-[#0a1f44] hover:text-[#0a1f44] transition-all flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />Add Benefit Card
          </button>
        </div>
      </CollapseCard>

      {/* Save */}
      <button onClick={save} disabled={saving}
        className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2">
        {saving
          ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
          : <><Save className="w-4 h-4" />Save Dealer Page Settings</>}
      </button>
    </div>
  );
}