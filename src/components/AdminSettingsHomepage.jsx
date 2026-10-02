// components/AdminSettingsHomepage.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Save, Upload, Info, CheckCircle, Plus, Trash2,
  ArrowUp, ArrowDown, Image as ImageIcon, Palette, GripVertical, X,
  Truck, Shield, RotateCcw, Headphones, Wrench, Zap, CircleDot,
  Wind, Droplets, Gauge, Star, Package, Clock, ThumbsUp, Award,
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PRESET_COLORS, CollapseCard, resolveUrl } from '../utils/settingsShared';

const MIN_BANNERS = 2;
const MAX_BANNERS = 5;
const MIN_BADGES  = 3;
const MAX_BADGES  = 6;

/* ── icon library shared by Trust Badges (must match icons imported on HomePage.jsx) ── */
const ICON_LIBRARY = {
  Truck, Shield, RotateCcw, Headphones, Wrench, Zap, CircleDot,
  Wind, Droplets, Gauge, Star, Package, Clock, ThumbsUp, Award,
};
const ICON_KEYS = Object.keys(ICON_LIBRARY);

/* ─────────────────── defaults (mirror current hardcoded HomePage.jsx content) ─────────────────── */
const DEFAULT_BANNERS = [
  { title: 'Genuine TVS Engine Parts', subtitle: 'OEM-certified parts for peak performance', btn: 'Shop Engine Parts', catSlug: 'engine-parts', bgType: 'gradient', bgFrom: '#0a1f44', bgTo: '#334155', bgImage: null },
  { title: 'Brake & Safety Components', subtitle: 'Stop safely with certified TVS brake systems', btn: 'Shop Brakes', catSlug: 'brakes', bgType: 'gradient', bgFrom: '#0f172a', bgTo: '#0a1f44', bgImage: null },
  { title: 'TVS Accessories Sale', subtitle: 'Personalise your ride — up to 40% off', btn: 'Shop Accessories', catSlug: 'accessories', bgType: 'gradient', bgFrom: '#0d2657', bgTo: '#1e293b', bgImage: null },
];

const DEFAULT_BADGES = [
  { icon: 'Truck',      title: 'Free Delivery',  sub: 'Orders above ₹999',   bg: '#eff6ff', ic: '#0a1f44' },
  { icon: 'Shield',     title: '100% Genuine',   sub: 'OEM certified parts', bg: '#f8fafc', ic: '#0a1f44' },
  { icon: 'RotateCcw',  title: '10-Day Returns', sub: 'Hassle-free policy',  bg: '#f9fafb', ic: '#0a1f44' },
  { icon: 'Headphones', title: '24×7 Support',   sub: '1800-258-6454',       bg: '#eff6ff', ic: '#0a1f44' },
];

const DEFAULT_SECTIONS = {
  categoriesTitle:    'Shop by Category',
  categoriesSubtitle: 'Genuine parts for every TVS model',
  featuredTitle:       'Featured Parts',
  featuredSubtitle:    'Top-selling genuine TVS components',
  recommendedTitle:    'Recommended For You',
  recommendedSubtitle: 'Parts picked based on popular models',
  promoBadge:       'TVS Assured Quality',
  promoHeadingLine1:'Every Part. Every Ride.',
  promoHeadingLine2:'Guaranteed.',
  promoDescription: 'All parts carry a 1-year manufacturer warranty and pass 200+ quality checks.',
  promoButtonText:  'Browse All Parts',
};

const EMPTY_BANNER = { title: '', subtitle: '', btn: 'Shop Now', catSlug: '', bgType: 'gradient', bgFrom: '#0a1f44', bgTo: '#334155', bgImage: null };
const EMPTY_BADGE  = { icon: 'Star', title: '', sub: '', bg: '#eff6ff', ic: '#0a1f44' };

let keySeed = 0;
const nextKey = () => `k_${Date.now()}_${keySeed++}`;

const hydrateBanner = (b) => ({
  ...EMPTY_BANNER, ...b, _key: nextKey(), imageFile: null,
  imagePreview: b?.bgImage ? resolveUrl(b.bgImage) : null,
});
const hydrateBadge = (b) => ({ ...EMPTY_BADGE, ...b, _key: nextKey() });

export default function AdminSettingsHomepage() {
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const [banners, setBanners]       = useState(() => DEFAULT_BANNERS.map(hydrateBanner));
  const [badges, setBadges]         = useState(() => DEFAULT_BADGES.map(hydrateBadge));
  const [sections, setSections]     = useState(DEFAULT_SECTIONS);
  const [categories, setCategories] = useState([]);

  const applyData = useCallback((n) => {
    if (!n) return;
    if (Array.isArray(n.banners) && n.banners.length > 0) setBanners(n.banners.map(hydrateBanner));
    if (Array.isArray(n.badges)  && n.badges.length > 0)  setBadges(n.badges.map(hydrateBadge));
    if (n.sections) setSections(s => ({ ...s, ...n.sections }));
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/site-settings');
      applyData(data?.homepage);
    } catch { /* use defaults */ }
  }, [applyData]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get('/categories/admin/all');
      setCategories(Array.isArray(data) ? data : []);
    } catch { /* dropdown falls back to free text */ }
  }, []);

  useEffect(() => {
    (async () => {
      await Promise.all([fetchSettings(), fetchCategories()]);
      setLoading(false);
    })();
  }, [fetchSettings, fetchCategories]);

  /* ── banner helpers ── */
  const updateBanner = (key, patch) => setBanners(bs => bs.map(b => (b._key === key ? { ...b, ...patch } : b)));
  const addBanner = () => {
    if (banners.length >= MAX_BANNERS) { toast.error(`Max ${MAX_BANNERS} banners`); return; }
    setBanners(bs => [...bs, hydrateBanner({ ...EMPTY_BANNER })]);
  };
  const removeBanner = (key) => {
    if (banners.length <= MIN_BANNERS) { toast.error(`Minimum ${MIN_BANNERS} banners required`); return; }
    setBanners(bs => bs.filter(b => b._key !== key));
  };
  const moveBanner = (idx, dir) => {
    const t = idx + dir;
    if (t < 0 || t >= banners.length) return;
    setBanners(bs => { const arr = [...bs]; [arr[idx], arr[t]] = [arr[t], arr[idx]]; return arr; });
  };
  const onImageChange = (key) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Images only'); return; }
    if (file.size > 3 * 1024 * 1024)    { toast.error('Max 3 MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => updateBanner(key, { imagePreview: ev.target.result, imageFile: file, bgType: 'image' });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  /* ── badge helpers ── */
  const updateBadge = (key, patch) => setBadges(bs => bs.map(b => (b._key === key ? { ...b, ...patch } : b)));
  const addBadge = () => {
    if (badges.length >= MAX_BADGES) { toast.error(`Max ${MAX_BADGES} badges`); return; }
    setBadges(bs => [...bs, hydrateBadge({ ...EMPTY_BADGE })]);
  };
  const removeBadge = (key) => {
    if (badges.length <= MIN_BADGES) { toast.error(`Minimum ${MIN_BADGES} badges required`); return; }
    setBadges(bs => bs.filter(b => b._key !== key));
  };
  const moveBadge = (idx, dir) => {
    const t = idx + dir;
    if (t < 0 || t >= badges.length) return;
    setBadges(bs => { const arr = [...bs]; [arr[idx], arr[t]] = [arr[t], arr[idx]]; return arr; });
  };

  /* ── section text helper ── */
  const setSectionField = (key) => (e) => setSections(s => ({ ...s, [key]: e.target.value }));

  const save = async () => {
    if (banners.length < MIN_BANNERS || banners.length > MAX_BANNERS) { toast.error(`Keep between ${MIN_BANNERS} and ${MAX_BANNERS} banners`); return; }
    if (badges.length < MIN_BADGES || badges.length > MAX_BADGES)     { toast.error(`Keep between ${MIN_BADGES} and ${MAX_BADGES} trust badges`); return; }
    for (const b of banners) {
      if (!b.title.trim()) { toast.error('Every banner needs a title'); return; }
      if (b.bgType === 'image' && !b.imageFile && !b.bgImage) { toast.error(`"${b.title}" — upload a background image or switch to gradient`); return; }
    }
    for (const b of badges) {
      if (!b.title.trim()) { toast.error('Every trust badge needs a title'); return; }
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('section', 'homepage');

      const bannerPayload = banners.map(b => ({
        title: b.title, subtitle: b.subtitle, btn: b.btn, catSlug: b.catSlug,
        bgType: b.bgType, bgFrom: b.bgFrom, bgTo: b.bgTo, bgImage: b.bgImage,
        bgImageKey: b.imageFile ? b._key : null,
      }));
      const badgePayload = badges.map(({ icon, title, sub, bg, ic }) => ({ icon, title, sub, bg, ic }));

      fd.append('banners', JSON.stringify(bannerPayload));
      fd.append('badges', JSON.stringify(badgePayload));
      fd.append('sections', JSON.stringify(sections));

      banners.forEach(b => { if (b.imageFile) fd.append(`bannerImage_${b._key}`, b.imageFile); });

      const { data } = await api.post('/admin/site-settings', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Home page settings saved!');
      applyData(data?.settings?.homepage);
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
        <h3 className="font-black text-gray-900 text-lg">Home Page Settings</h3>
        <p className="text-xs text-gray-400 mt-0.5">Every section on the home page is editable from here.</p>
      </div>

      {/* ═══ HERO BANNERS ═══ */}
      <CollapseCard title={`Hero Banners (${banners.length}/${MAX_BANNERS})`} defaultOpen>
        <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Minimum <strong>{MIN_BANNERS}</strong>, maximum <strong>{MAX_BANNERS}</strong>. Each can use a colour gradient or an uploaded image.
          </p>
        </div>
        <div className="space-y-4">
          {banners.map((b, idx) => (
            <BannerEditor
              key={b._key}
              banner={b}
              index={idx}
              total={banners.length}
              categories={categories}
              onChange={patch => updateBanner(b._key, patch)}
              onImageChange={onImageChange(b._key)}
              onMove={dir => moveBanner(idx, dir)}
              onRemove={() => removeBanner(b._key)}
              canRemove={banners.length > MIN_BANNERS}
            />
          ))}
        </div>
        <button type="button" onClick={addBanner} disabled={banners.length >= MAX_BANNERS}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500
                     hover:border-[#0a1f44] hover:text-[#0a1f44] hover:bg-blue-50 transition-all
                     flex items-center justify-center gap-2 text-sm font-semibold
                     disabled:opacity-40 disabled:cursor-not-allowed">
          <Plus className="w-4 h-4" /> Add Banner
        </button>
      </CollapseCard>

      {/* ═══ TRUST BADGES ═══ */}
      <CollapseCard title={`Trust Badges (${badges.length}/${MAX_BADGES})`}>
        <p className="text-xs text-gray-400 -mt-1">The 4 icon strip shown under the hero banner.</p>
        <div className="space-y-3">
          {badges.map((b, idx) => (
            <BadgeEditor
              key={b._key}
              badge={b}
              index={idx}
              total={badges.length}
              onChange={patch => updateBadge(b._key, patch)}
              onMove={dir => moveBadge(idx, dir)}
              onRemove={() => removeBadge(b._key)}
              canRemove={badges.length > MIN_BADGES}
            />
          ))}
        </div>
        <button type="button" onClick={addBadge} disabled={badges.length >= MAX_BADGES}
          className="w-full py-2.5 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500
                     hover:border-[#0a1f44] hover:text-[#0a1f44] hover:bg-blue-50 transition-all
                     flex items-center justify-center gap-2 text-sm font-semibold
                     disabled:opacity-40 disabled:cursor-not-allowed">
          <Plus className="w-4 h-4" /> Add Badge
        </button>
      </CollapseCard>

      {/* ═══ SECTION HEADINGS ═══ */}
      <CollapseCard title="Section Headings">
        <p className="text-xs text-gray-400 -mt-1">Titles shown above the Categories, Featured Parts, and Recommended sections.</p>

        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Shop by Category</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="label">Title</label><input type="text" value={sections.categoriesTitle} onChange={setSectionField('categoriesTitle')} className="input-field text-sm" /></div>
            <div><label className="label">Subtitle</label><input type="text" value={sections.categoriesSubtitle} onChange={setSectionField('categoriesSubtitle')} className="input-field text-sm" /></div>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Featured Parts</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="label">Title</label><input type="text" value={sections.featuredTitle} onChange={setSectionField('featuredTitle')} className="input-field text-sm" /></div>
            <div><label className="label">Subtitle</label><input type="text" value={sections.featuredSubtitle} onChange={setSectionField('featuredSubtitle')} className="input-field text-sm" /></div>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recommended For You</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="label">Title</label><input type="text" value={sections.recommendedTitle} onChange={setSectionField('recommendedTitle')} className="input-field text-sm" /></div>
            <div><label className="label">Subtitle</label><input type="text" value={sections.recommendedSubtitle} onChange={setSectionField('recommendedSubtitle')} className="input-field text-sm" /></div>
          </div>
        </div>
      </CollapseCard>

      {/* ═══ GUARANTEE / PROMO BANNER ═══ */}
      <CollapseCard title="Guarantee Banner">
        <p className="text-xs text-gray-400 -mt-1">The full-width navy block between Featured Parts and Recommended.</p>
        <div>
          <label className="label">Badge Label</label>
          <input type="text" value={sections.promoBadge} onChange={setSectionField('promoBadge')} className="input-field text-sm" placeholder="e.g. TVS Assured Quality" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">Heading — Line 1</label><input type="text" value={sections.promoHeadingLine1} onChange={setSectionField('promoHeadingLine1')} className="input-field text-sm" /></div>
          <div><label className="label">Heading — Line 2</label><input type="text" value={sections.promoHeadingLine2} onChange={setSectionField('promoHeadingLine2')} className="input-field text-sm" /></div>
        </div>
        <div>
          <label className="label">Description</label>
          <input type="text" value={sections.promoDescription} onChange={setSectionField('promoDescription')} className="input-field text-sm" />
        </div>
        <div>
          <label className="label">Button Text</label>
          <input type="text" value={sections.promoButtonText} onChange={setSectionField('promoButtonText')} className="input-field text-sm" />
        </div>

        <div>
          <label className="label">Live Preview</label>
          <div className="rounded-2xl bg-[#0a1f44] text-white px-5 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-blue-300" />
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">{sections.promoBadge || 'Badge label'}</span>
              </div>
              <h3 className="text-lg md:text-xl font-black mb-1.5 leading-tight">
                {sections.promoHeadingLine1 || 'Heading line 1'}<br />{sections.promoHeadingLine2 || 'Heading line 2'}
              </h3>
              <p className="text-blue-200 text-xs">{sections.promoDescription || 'Description text'}</p>
            </div>
            <span className="flex-shrink-0 bg-white text-[#0a1f44] font-black px-5 py-2 rounded-xl text-xs whitespace-nowrap">
              {sections.promoButtonText || 'Button text'}
            </span>
          </div>
        </div>
      </CollapseCard>

      <button onClick={save} disabled={saving} className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2">
        {saving
          ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
          : <><Save className="w-4 h-4" />Save Home Page Settings</>}
      </button>
    </div>
  );
}

/* ─────────────────── banner editor ─────────────────── */
function BannerEditor({ banner, index, total, categories, onChange, onImageChange, onMove, onRemove, canRemove }) {
  const isGradient = banner.bgType === 'gradient';
  const previewStyle = isGradient
    ? { background: `linear-gradient(to right, ${banner.bgFrom}, ${banner.bgTo})` }
    : banner.imagePreview
      ? { backgroundImage: `url(${banner.imagePreview})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { background: '#e5e7eb' };

  return (
    <div className="border border-gray-100 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-900">Banner {index + 1}{banner.title ? ` — ${banner.title}` : ''}</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={onRemove} disabled={!canRemove} title={canRemove ? 'Remove banner' : `Minimum ${MIN_BANNERS} banners required`}
            className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed">
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="label">Title *</label>
          <input type="text" value={banner.title} onChange={e => onChange({ title: e.target.value })} maxLength={60} className="input-field text-sm" placeholder="e.g. Genuine TVS Engine Parts" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Subtitle</label>
          <input type="text" value={banner.subtitle} onChange={e => onChange({ subtitle: e.target.value })} maxLength={100} className="input-field text-sm" placeholder="e.g. OEM-certified parts for peak performance" />
        </div>
        <div>
          <label className="label">Button Text</label>
          <input type="text" value={banner.btn} onChange={e => onChange({ btn: e.target.value })} maxLength={30} className="input-field text-sm" />
        </div>
        <div>
          <label className="label">Links To Category</label>
          {categories.length > 0 ? (
            <select value={banner.catSlug} onChange={e => onChange({ catSlug: e.target.value })} className="input-field text-sm">
              <option value="">Select category…</option>
              {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              {banner.catSlug && !categories.some(c => c.slug === banner.catSlug) && <option value={banner.catSlug}>{banner.catSlug} (custom)</option>}
            </select>
          ) : (
            <input type="text" value={banner.catSlug} onChange={e => onChange({ catSlug: e.target.value })} className="input-field text-sm" placeholder="e.g. engine-parts" />
          )}
        </div>
      </div>

      <div>
        <label className="label">Background</label>
        <div className="flex gap-2 mt-1">
          <button type="button" onClick={() => onChange({ bgType: 'gradient' })}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${isGradient ? 'border-[#0a1f44] bg-blue-50 text-[#0a1f44]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
            <Palette className="w-3.5 h-3.5" /> Colour Gradient
          </button>
          <button type="button" onClick={() => onChange({ bgType: 'image' })}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${!isGradient ? 'border-[#0a1f44] bg-blue-50 text-[#0a1f44]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
            <ImageIcon className="w-3.5 h-3.5" /> Upload Image
          </button>
        </div>
      </div>

      {isGradient ? (
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Gradient Start</label><ColorSwatchPicker value={banner.bgFrom} onChange={hex => onChange({ bgFrom: hex })} /></div>
          <div><label className="label">Gradient End</label><ColorSwatchPicker value={banner.bgTo} onChange={hex => onChange({ bgTo: hex })} /></div>
        </div>
      ) : (
        <div className="flex flex-wrap items-start gap-5">
          <button type="button" onClick={() => document.getElementById(`bg-input-${banner._key}`)?.click()}
            className="flex flex-col items-center justify-center w-36 h-22 border-2 border-dashed border-gray-200 rounded-2xl hover:border-[#0a1f44] hover:bg-blue-50 transition-all gap-2 flex-shrink-0 px-3 py-4">
            <Upload className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-500 text-center leading-tight">Click to upload<br/>JPG / PNG / WebP</span>
          </button>
          <input id={`bg-input-${banner._key}`} type="file" accept="image/*" className="hidden" onChange={onImageChange} />
          <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-2 flex-1 min-w-[180px]">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">Recommended <strong>1600×500px</strong>. Max 3 MB.</p>
          </div>
        </div>
      )}

      {banner.imageFile && (
        <div className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          <span className="text-xs text-green-700 font-medium">New image ready — click Save to apply</span>
        </div>
      )}

      <div>
        <label className="label">Live Preview</label>
        <div className="relative rounded-2xl overflow-hidden shadow-sm">
          <div style={previewStyle} className="min-h-40 flex items-center px-6 py-6 relative">
            {!isGradient && <div className="absolute inset-0 bg-black/30" />}
            <div className="relative z-10 max-w-md">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full mb-3">
                <div className="w-1.5 h-1.5 bg-blue-300 rounded-full" />
                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Official TVS Parts</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white mb-2 leading-tight">{banner.title || 'Banner title'}</h1>
              <p className="text-blue-200 text-sm mb-4">{banner.subtitle || 'Banner subtitle'}</p>
              <span className="inline-flex items-center gap-2 bg-white text-[#0a1f44] font-bold px-4 py-2 rounded-xl text-xs shadow-md">{banner.btn || 'Shop Now'} →</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Links to: <span className="font-semibold text-gray-600">/products/category/{banner.catSlug || '…'}</span></p>
      </div>
    </div>
  );
}

/* ─────────────────── trust badge editor ─────────────────── */
function BadgeEditor({ badge, index, total, onChange, onMove, onRemove, canRemove }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const Icon = ICON_LIBRARY[badge.icon] || Star;

  return (
    <div className="border border-gray-100 rounded-2xl p-3">
      <div className="flex items-start gap-3">
        {/* icon picker trigger */}
        <div className="relative flex-shrink-0">
          <button type="button" onClick={() => setPickerOpen(o => !o)}
            className="w-11 h-11 rounded-xl flex items-center justify-center border border-gray-200 hover:border-[#0a1f44]"
            style={{ backgroundColor: badge.bg }}>
            <Icon className="w-5 h-5" style={{ color: badge.ic }} />
          </button>
          {pickerOpen && (
            <div className="absolute z-10 top-12 left-0 bg-white border border-gray-200 rounded-2xl shadow-lg p-2 grid grid-cols-5 gap-1 w-56">
              {ICON_KEYS.map(key => {
                const OptIcon = ICON_LIBRARY[key];
                return (
                  <button key={key} type="button"
                    onClick={() => { onChange({ icon: key }); setPickerOpen(false); }}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 ${badge.icon === key ? 'bg-blue-50 ring-2 ring-[#0a1f44]' : ''}`}
                    title={key}>
                    <OptIcon className="w-4 h-4 text-gray-600" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input type="text" value={badge.title} onChange={e => onChange({ title: e.target.value })}
            placeholder="Title (e.g. Free Delivery)" className="input-field text-sm" />
          <input type="text" value={badge.sub} onChange={e => onChange({ sub: e.target.value })}
            placeholder="Subtitle (e.g. Orders above ₹999)" className="input-field text-sm" />
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={onRemove} disabled={!canRemove} title={canRemove ? 'Remove badge' : `Minimum ${MIN_BADGES} badges required`}
            className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-2 pl-14">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Background</span>
          <ColorSwatchPicker value={badge.bg} onChange={hex => onChange({ bg: hex })} small />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Icon Colour</span>
          <ColorSwatchPicker value={badge.ic} onChange={hex => onChange({ ic: hex })} small />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── reusable color swatch picker ─────────────────── */
function ColorSwatchPicker({ value, onChange, small = false }) {
  const size = small ? 'w-5 h-5' : 'w-6 h-6';
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {PRESET_COLORS.map(({ hex, name }) => (
        <button key={hex} type="button" title={name} onClick={() => onChange(hex)}
          className={`relative ${size} rounded-full border-2 transition-all focus:outline-none flex-shrink-0`}
          style={{
            backgroundColor: hex,
            borderColor: value === hex ? '#000' : 'transparent',
            boxShadow: value === hex ? `0 0 0 2px white, 0 0 0 4px ${hex}` : 'none',
          }}>
          {value === hex && (
            <span className="absolute inset-0 flex items-center justify-center">
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          )}
        </button>
      ))}
      <label className={`relative ${size} rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer flex-shrink-0 overflow-hidden`}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
        <X className="w-2.5 h-2.5 text-gray-400" />
      </label>
    </div>
  );
}