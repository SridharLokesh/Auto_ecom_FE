// components/AdminSettingsCustomerCare.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Plus, X, ArrowUp, ArrowDown, ChevronDown, Check } from 'lucide-react';
import ReactDOM from 'react-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  CollapseCard, ColorPicker, BgTypePicker,
  ImageUploadZone, BgPreview, resolveUrl,
} from '../utils/settingsShared';

/* ─────────────────── Portal Dropdown (inlined) ─────────────────── */
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
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const listRef    = useRef(null);
  const coords     = useDropdownPortal(open, setOpen, triggerRef, listRef);
  const selected   = options.find(o => o.value === value);

  const menu = open && ReactDOM.createPortal(
    <ul
      ref={listRef}
      role="listbox"
      style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width, minWidth: coords.width, zIndex: 99999 }}
      className="bg-white border border-gray-200 rounded-xl shadow-xl py-1 max-h-64 overflow-y-auto"
    >
      {options.map(o => {
        const active = o.value === value;
        return (
          <li key={o.value} role="option" aria-selected={active}
            onMouseDown={e => { e.preventDefault(); onChange(o.value); setOpen(false); }}
            className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer select-none transition-colors
              ${active ? 'bg-[#0a1f44] text-white' : 'text-gray-700 hover:bg-[#e8edf5] hover:text-[#0a1f44]'}`}>
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
      <button ref={triggerRef} type="button" onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox" aria-expanded={open}
        className={`input-field flex items-center justify-between gap-2 w-full cursor-pointer text-sm transition-colors
          ${open ? 'border-[#0a1f44] ring-2 ring-[#0a1f44]/10' : ''}`}>
        <span className="truncate text-left">{selected?.label ?? 'Select…'}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {menu}
    </>
  );
}

/* ─────────────────── constants ─────────────────── */
const CHANNEL_ICON_OPTIONS = [
  'Phone','Mail','MessageCircle','Wrench',
  'Headphones','Globe','MapPin','Clock','Star','Shield',
].map(ic => ({ label: ic, value: ic }));

const FAQ_MAX = 20;

const SEED = {
  heroTitle:        '24 × 7 Customer Support',
  heroSubtitle:     'Expert help for genuine TVS parts, orders, delivery and service — any time, any day.',
  heroBgColor:      '#0a1f44',
  channelsTitle:    'Contact Us',
  channelsSubtitle: 'Choose the channel that works best for you',
  channels: [
    { icon: 'Phone',         title: 'Call Support',       primary: '1800-258-6454',         secondary: 'Toll-free · 24 × 7',         desc: 'Speak directly with a TVS parts specialist' },
    { icon: 'Mail',          title: 'Email Support',      primary: 'parts@tvsmotors.com',   secondary: 'Reply within 2–4 hours',     desc: 'Send your query, order ID or invoice' },
    { icon: 'MessageCircle', title: 'Live Chat',          primary: 'Available on Website',  secondary: 'Avg. response: 2 minutes',   desc: 'Instant help from a support agent' },
    { icon: 'Wrench',        title: 'Service Centre',     primary: 'Locate Nearest Centre', secondary: '4,000+ centres across India', desc: 'For installation, repair and diagnostics' },
  ],
  faqTitle:    'Frequently Asked Questions',
  faqSubtitle: 'Quick answers to common queries about TVS parts & orders',
  faqs: [
    { q: 'How do I check if a part is compatible with my TVS bike?', a: 'Use the model search on our website. Enter your bike model and compatible parts will be listed. You can also call our helpline for expert guidance.' },
    { q: 'Are all parts on this store genuine TVS parts?',           a: 'Yes. Every part sold here is 100% genuine, sourced directly from TVS Motor Company.' },
    { q: 'How do I track my parts order?',                           a: 'Go to My Orders in your profile. Each order shows real-time tracking — Placed, Processing, Shipped, or Delivered.' },
    { q: 'What is the return policy for spare parts?',               a: 'We offer a 10-day return policy for unused, unopened parts in original packaging.' },
    { q: 'Can I cancel my order?',                                   a: 'Orders can be cancelled before they are shipped. Go to My Orders and click "Cancel Order".' },
  ],
  formTitle:    'Send Us a Message',
  formSubtitle: 'Fill the form and our team will respond within 2–4 hours',
  formEmail:    'parts@tvsmotors.com',
  ctaTitle:     'Still need help?',
  ctaSubtitle:  'Our senior technical team handles escalated queries with priority turnaround.',
  ctaBgType:    'color',
  ctaBgColor:   '#0a1f44',
  ctaBgImage:   '',
  ctaPhone:     '1800-258-6454',
  ctaEmail:     'parts@tvsmotors.com',
  ctaHours:     '24 × 7 × 365',
};

const isValidEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/* ═══════════════ COMPONENT ═══════════════ */
export default function AdminSettingsCustomerCare() {
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const [heroTitle,    setHeroTitle]    = useState(SEED.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(SEED.heroSubtitle);
  const [heroBgColor,  setHeroBgColor]  = useState(SEED.heroBgColor);

  const [channelsTitle,    setChannelsTitle]    = useState(SEED.channelsTitle);
  const [channelsSubtitle, setChannelsSubtitle] = useState(SEED.channelsSubtitle);
  const [channels, setChannels] = useState(SEED.channels);

  const [faqTitle,    setFaqTitle]    = useState(SEED.faqTitle);
  const [faqSubtitle, setFaqSubtitle] = useState(SEED.faqSubtitle);
  const [faqs, setFaqs] = useState(SEED.faqs);

  const [formTitle,    setFormTitle]    = useState(SEED.formTitle);
  const [formSubtitle, setFormSubtitle] = useState(SEED.formSubtitle);
  const [formEmail,    setFormEmail]    = useState(SEED.formEmail);

  const [ctaTitle,     setCtaTitle]     = useState(SEED.ctaTitle);
  const [ctaSubtitle,  setCtaSubtitle]  = useState(SEED.ctaSubtitle);
  const [ctaBgType,    setCtaBgType]    = useState(SEED.ctaBgType);
  const [ctaBgColor,   setCtaBgColor]   = useState(SEED.ctaBgColor);
  const [ctaBgPreview, setCtaBgPreview] = useState(null);
  const [ctaBgFile,    setCtaBgFile]    = useState(null);
  const [ctaPhone,     setCtaPhone]     = useState(SEED.ctaPhone);
  const [ctaEmail,     setCtaEmail]     = useState(SEED.ctaEmail);
  const [ctaHours,     setCtaHours]     = useState(SEED.ctaHours);

  // ── extracted so it can be called on mount AND after save ──
  const applyData = useCallback((cc) => {
    if (!cc) return;
    if (cc.heroTitle)        setHeroTitle(cc.heroTitle);
    if (cc.heroSubtitle)     setHeroSubtitle(cc.heroSubtitle);
    if (cc.heroBgColor)      setHeroBgColor(cc.heroBgColor);
    if (cc.channelsTitle)    setChannelsTitle(cc.channelsTitle);
    if (cc.channelsSubtitle) setChannelsSubtitle(cc.channelsSubtitle);
    if (cc.channels?.length) setChannels(cc.channels);
    if (cc.faqTitle)         setFaqTitle(cc.faqTitle);
    if (cc.faqSubtitle)      setFaqSubtitle(cc.faqSubtitle);
    if (cc.faqs?.length)     setFaqs(cc.faqs);
    if (cc.formTitle)        setFormTitle(cc.formTitle);
    if (cc.formSubtitle)     setFormSubtitle(cc.formSubtitle);
    if (cc.formEmail)        setFormEmail(cc.formEmail);
    if (cc.ctaTitle)         setCtaTitle(cc.ctaTitle);
    if (cc.ctaSubtitle)      setCtaSubtitle(cc.ctaSubtitle);
    if (cc.ctaBgType)        setCtaBgType(cc.ctaBgType);
    if (cc.ctaBgColor)       setCtaBgColor(cc.ctaBgColor);
    if (cc.ctaBgImage)       setCtaBgPreview(resolveUrl(cc.ctaBgImage));
    if (cc.ctaPhone)         setCtaPhone(cc.ctaPhone);
    if (cc.ctaEmail)         setCtaEmail(cc.ctaEmail);
    if (cc.ctaHours)         setCtaHours(cc.ctaHours);
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/site-settings');
      applyData(data?.customerCare);
    } catch { /* keep seeds */ }
  }, [applyData]);

  useEffect(() => {
    (async () => {
      await fetchSettings();
      setLoading(false);
    })();
  }, [fetchSettings]);

  const handleCtaBgFile = (file) => {
    if (!file.type.startsWith('image/')) { toast.error('Images only'); return; }
    if (file.size > 4 * 1024 * 1024)    { toast.error('Max 4 MB');    return; }
    const reader = new FileReader();
    reader.onload = ev => { setCtaBgPreview(ev.target.result); setCtaBgFile(file); };
    reader.readAsDataURL(file);
  };

  const addChannel    = () => setChannels(c => [...c, { icon: 'Phone', title: '', primary: '', secondary: '', desc: '' }]);
  const removeChannel = (i) => setChannels(c => c.filter((_, idx) => idx !== i));
  const updateChannel = (i, f, v) => setChannels(c => c.map((x, idx) => idx === i ? { ...x, [f]: v } : x));
  const moveChannel   = (i, dir) => setChannels(c => {
    const arr = [...c]; const t = i + dir;
    if (t < 0 || t >= arr.length) return c;
    [arr[i], arr[t]] = [arr[t], arr[i]]; return arr;
  });

  const addFaq = () => {
    if (faqs.length >= FAQ_MAX) { toast.error(`Maximum ${FAQ_MAX} FAQs allowed`); return; }
    setFaqs(f => [...f, { q: '', a: '' }]);
  };
  const removeFaq = (i) => setFaqs(f => f.filter((_, idx) => idx !== i));
  const updateFaq = (i, field, v) => setFaqs(fs => fs.map((x, idx) => idx === i ? { ...x, [field]: v } : x));
  const moveFaq   = (i, dir) => setFaqs(f => {
    const arr = [...f]; const t = i + dir;
    if (t < 0 || t >= arr.length) return f;
    [arr[i], arr[t]] = [arr[t], arr[i]]; return arr;
  });

  const save = async () => {
    if (!heroTitle.trim())        { toast.error('Hero title required');      return; }
    if (!isValidEmail(formEmail)) { toast.error('Enter a valid form email'); return; }
    if (!isValidEmail(ctaEmail))  { toast.error('Enter a valid CTA email');  return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('section',          'customerCare');
      fd.append('heroTitle',        heroTitle);
      fd.append('heroSubtitle',     heroSubtitle);
      fd.append('heroBgColor',      heroBgColor);
      fd.append('channelsTitle',    channelsTitle);
      fd.append('channelsSubtitle', channelsSubtitle);
      fd.append('channels',         JSON.stringify(channels));
      fd.append('faqTitle',         faqTitle);
      fd.append('faqSubtitle',      faqSubtitle);
      fd.append('faqs',             JSON.stringify(faqs.filter(f => f.q.trim())));
      fd.append('formTitle',        formTitle);
      fd.append('formSubtitle',     formSubtitle);
      fd.append('formEmail',        formEmail);
      fd.append('ctaTitle',         ctaTitle);
      fd.append('ctaSubtitle',      ctaSubtitle);
      fd.append('ctaBgType',        ctaBgType);
      fd.append('ctaBgColor',       ctaBgColor);
      fd.append('ctaPhone',         ctaPhone);
      fd.append('ctaEmail',         ctaEmail);
      fd.append('ctaHours',         ctaHours);
      if (ctaBgFile) fd.append('ctaBgImage', ctaBgFile);

      const { data } = await api.post('/admin/site-settings', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Customer care settings saved!');
      setCtaBgFile(null);

      // Re-apply from server response so UI reflects exactly what was persisted
      applyData(data?.settings?.customerCare);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse max-w-2xl">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100" />)}
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h3 className="font-black text-gray-900 text-lg">24 × 7 Customer Support</h3>
        <p className="text-xs text-gray-400 mt-0.5">Edit every visible section. The contact form subjects list is static.</p>
      </div>

      {/* ── Hero ── */}
      <CollapseCard title="Hero Section">
        <div className="space-y-3">
          <div>
            <label className="label">Title *</label>
            <input type="text" value={heroTitle} onChange={e => setHeroTitle(e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="label">Subtitle</label>
            <textarea rows={2} value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)}
              className="input-field text-sm resize-none" />
          </div>
          <ColorPicker label="Background Color" value={heroBgColor} onChange={setHeroBgColor} />
          <div>
            <label className="label">Preview</label>
            <BgPreview bgType="color" bgColor={heroBgColor}>
              <p className="font-black text-sm">{heroTitle}</p>
              <p className="text-[11px] text-white/75 mt-1 line-clamp-2">{heroSubtitle}</p>
            </BgPreview>
          </div>
        </div>
      </CollapseCard>

      {/* ── Support Channels ── */}
      <CollapseCard title="Support Channels" badge={channels.length}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Section Title</label>
              <input type="text" value={channelsTitle} onChange={e => setChannelsTitle(e.target.value)} className="input-field text-sm" />
            </div>
            <div>
              <label className="label">Section Subtitle</label>
              <input type="text" value={channelsSubtitle} onChange={e => setChannelsSubtitle(e.target.value)} className="input-field text-sm" />
            </div>
          </div>

          {channels.map((ch, i) => (
            <div key={i} className="border-2 border-gray-100 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Channel {i + 1}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveChannel(i, -1)} disabled={i === 0}
                    className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20"><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => moveChannel(i, 1)} disabled={i === channels.length - 1}
                    className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20"><ArrowDown className="w-3.5 h-3.5" /></button>
                  <button onClick={() => removeChannel(i)} className="p-1 text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="label text-[11px]">Icon</label>
                  <PortalDropdown
                    value={ch.icon}
                    onChange={v => updateChannel(i, 'icon', v)}
                    options={CHANNEL_ICON_OPTIONS}
                  />
                </div>
                <div>
                  <label className="label text-[11px]">Card Title</label>
                  <input type="text" value={ch.title} onChange={e => updateChannel(i, 'title', e.target.value)}
                    className="input-field text-sm" placeholder="e.g. Call Support" />
                </div>
                <div>
                  <label className="label text-[11px]">Primary (large text)</label>
                  <input type="text" value={ch.primary} onChange={e => updateChannel(i, 'primary', e.target.value)}
                    className="input-field text-sm" placeholder="e.g. 1800-258-6454" />
                </div>
                <div>
                  <label className="label text-[11px]">Secondary (small text)</label>
                  <input type="text" value={ch.secondary} onChange={e => updateChannel(i, 'secondary', e.target.value)}
                    className="input-field text-sm" placeholder="e.g. Toll-free · 24 × 7" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label text-[11px]">Description</label>
                  <input type="text" value={ch.desc} onChange={e => updateChannel(i, 'desc', e.target.value)}
                    className="input-field text-sm" />
                </div>
              </div>
            </div>
          ))}

          <button onClick={addChannel}
            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-500 font-semibold hover:border-[#0a1f44] hover:text-[#0a1f44] transition-all flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add Channel
          </button>
        </div>
      </CollapseCard>

      {/* ── FAQs ── */}
      <CollapseCard title="FAQs" badge={faqs.length} defaultOpen={false}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">FAQ Section Title</label>
              <input type="text" value={faqTitle} onChange={e => setFaqTitle(e.target.value)} className="input-field text-sm" />
            </div>
            <div>
              <label className="label">FAQ Subtitle</label>
              <input type="text" value={faqSubtitle} onChange={e => setFaqSubtitle(e.target.value)} className="input-field text-sm" />
            </div>
          </div>

          {faqs.map((faq, i) => (
            <div key={i} className="border-2 border-gray-100 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">FAQ {i + 1}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveFaq(i, -1)} disabled={i === 0}
                    className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20"><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => moveFaq(i, 1)} disabled={i === faqs.length - 1}
                    className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20"><ArrowDown className="w-3.5 h-3.5" /></button>
                  <button onClick={() => removeFaq(i)} className="p-1 text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div>
                <label className="label text-[11px]">Question</label>
                <input type="text" value={faq.q} onChange={e => updateFaq(i, 'q', e.target.value)}
                  className="input-field text-sm" placeholder="Question?" />
              </div>
              <div>
                <label className="label text-[11px]">Answer</label>
                <textarea rows={2} value={faq.a} onChange={e => updateFaq(i, 'a', e.target.value)}
                  className="input-field text-sm resize-none" placeholder="Answer…" />
              </div>
            </div>
          ))}

          <button onClick={addFaq} disabled={faqs.length >= FAQ_MAX}
            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-500 font-semibold hover:border-[#0a1f44] hover:text-[#0a1f44] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-500">
            <Plus className="w-4 h-4" />
            {faqs.length >= FAQ_MAX ? `Limit reached (${FAQ_MAX} max)` : 'Add FAQ'}
          </button>
          {faqs.length > 0 && (
            <p className="text-xs text-gray-400 text-right">{faqs.length} / {FAQ_MAX} FAQs</p>
          )}
        </div>
      </CollapseCard>

      {/* ── Contact Form Labels ── */}
      <CollapseCard title="Contact Form Labels" defaultOpen={false}>
        <div className="space-y-3">
          <div>
            <label className="label">Section Title</label>
            <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="label">Section Subtitle</label>
            <input type="text" value={formSubtitle} onChange={e => setFormSubtitle(e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="label">Display / Reply-to Email *</label>
            <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)}
              className={`input-field text-sm ${formEmail && !isValidEmail(formEmail) ? 'border-red-400' : ''}`}
              placeholder="parts@tvsmotors.com" />
            <p className="text-xs text-gray-400 mt-1">Shown in the "Or email us at…" line below the form.</p>
          </div>
        </div>
      </CollapseCard>

      {/* ── Bottom CTA Card ── */}
      <CollapseCard title='Bottom CTA Card ("Still need help?")' defaultOpen={false}>
        <div className="space-y-3">
          <div>
            <label className="label">Title</label>
            <input type="text" value={ctaTitle} onChange={e => setCtaTitle(e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="label">Subtitle</label>
            <textarea rows={2} value={ctaSubtitle} onChange={e => setCtaSubtitle(e.target.value)}
              className="input-field text-sm resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Phone</label>
              <input type="text" value={ctaPhone} onChange={e => setCtaPhone(e.target.value)} className="input-field text-sm" />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="text" value={ctaEmail} onChange={e => setCtaEmail(e.target.value)}
                className={`input-field text-sm ${ctaEmail && !isValidEmail(ctaEmail) ? 'border-red-400' : ''}`} />
            </div>
            <div>
              <label className="label">Support Hours</label>
              <input type="text" value={ctaHours} onChange={e => setCtaHours(e.target.value)} className="input-field text-sm" />
            </div>
          </div>
          <div>
            <label className="label">Background Type</label>
            <BgTypePicker value={ctaBgType} onChange={setCtaBgType} />
          </div>
          {ctaBgType === 'color' && (
            <ColorPicker label="Background Color" value={ctaBgColor} onChange={setCtaBgColor} />
          )}
          {ctaBgType === 'image' && (
            <ImageUploadZone
              label="Background Image"
              preview={ctaBgPreview}
              onFileChange={handleCtaBgFile}
              hint="Recommended 1400×400px. Covers the full CTA card. Max 4 MB."
            />
          )}
          <div>
            <label className="label">Preview</label>
            <BgPreview bgType={ctaBgType} bgColor={ctaBgColor} bgPreview={ctaBgPreview}>
              <p className="font-black text-sm">{ctaTitle}</p>
              <p className="text-[11px] text-white/75 mt-0.5 line-clamp-2">{ctaSubtitle}</p>
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {[{ icon: '📞', label: 'Toll-Free', value: ctaPhone },
                  { icon: '📧', label: 'Email',     value: ctaEmail },
                  { icon: '🕐', label: 'Hours',     value: ctaHours }].map(({ icon, label, value }) => (
                  <div key={label} className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-center">
                    <p className="text-sm leading-none">{icon}</p>
                    <p className="text-[9px] text-blue-200 mt-0.5">{label}</p>
                    <p className="text-xs font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </BgPreview>
          </div>
        </div>
      </CollapseCard>

      {/* Save */}
      <button onClick={save} disabled={saving}
        className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2">
        {saving
          ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
          : <><Save className="w-4 h-4" /> Save Helpline Settings</>}
      </button>
    </div>
  );
}