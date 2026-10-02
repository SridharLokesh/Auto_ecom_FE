import { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  Phone, Mail, Headphones, MessageCircle,
  ChevronDown, ChevronUp, Clock, Shield, Star,
  Wrench, Globe, MapPin, CheckCircle, Check,
} from 'lucide-react';
import api from '../utils/api';
import { resolveUrl } from '../utils/settingsShared';

/* ── icon map for channel icons stored as strings ── */
const ICON_MAP = { Phone, Mail, MessageCircle, Wrench, Headphones, Globe, MapPin, Clock, Star, Shield };

const SUBJECTS = [
  'Part Compatibility Query','Order Issue','Payment Problem',
  'Return / Refund','Warranty Claim','Dealer / Reseller Enquiry',
  'Account Issue','Other',
];

const DEFAULT = {
  heroTitle:        '24 × 7 Customer Support',
  heroSubtitle:     'Expert help for genuine TVS parts, orders, delivery and service — any time, any day.',
  heroBgColor:      '#0a1f44',
  channelsTitle:    'Contact Us',
  channelsSubtitle: 'Choose the channel that works best for you',
  channels: [
    { icon: 'Phone',         title: 'Call Support',      primary: '1800-258-6454',        secondary: 'Toll-free · 24 × 7',       desc: 'Speak directly with a TVS parts specialist' },
    { icon: 'Mail',          title: 'Email Support',     primary: 'parts@tvsmotors.com',  secondary: 'Reply within 2–4 hours',   desc: 'Send your query, order ID or invoice' },
    { icon: 'MessageCircle', title: 'Live Chat',         primary: 'Available on Website', secondary: 'Avg. response: 2 minutes', desc: 'Instant help from a support agent' },
    { icon: 'Wrench',        title: 'Service Centre',    primary: 'Locate Nearest Centre',secondary: '4,000+ centres across India', desc: 'For installation, repair and diagnostics' },
  ],
  faqTitle:    'Frequently Asked Questions',
  faqSubtitle: 'Quick answers to common queries about TVS parts & orders',
  faqs: [
    { q: 'How do I check if a part is compatible with my TVS bike?', a: 'Use the model search on our website. Enter your bike model and compatible parts will be listed. You can also call our helpline for expert guidance.' },
    { q: 'Are all parts on this store genuine TVS parts?',            a: 'Yes. Every part sold here is 100% genuine, sourced directly from TVS Motor Company.' },
    { q: 'How do I track my parts order?',                            a: 'Go to My Orders in your profile. Each order shows real-time tracking — Placed, Processing, Shipped, or Delivered.' },
    { q: 'What is the return policy for spare parts?',                a: 'We offer a 10-day return policy for unused, unopened parts in original packaging.' },
    { q: 'Can I cancel my order?',                                    a: 'Orders can be cancelled before they are shipped. Go to My Orders and click "Cancel Order".' },
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

/* ── Portal Dropdown ── */
function SelectDropdown({ value, onChange, options, placeholder = 'Select…', error = false }) {
  const [open, setOpen]     = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef          = useRef(null);
  const listRef             = useRef(null);

  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect       = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const listHeight = 256;
    const openUp     = spaceBelow < listHeight && rect.top > listHeight;
    setCoords({ top: openUp ? rect.top - listHeight - 4 : rect.bottom + 4, left: rect.left, width: rect.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    updateCoords();
    const onScroll = (e) => {
      if (listRef.current && (listRef.current === e.target || listRef.current.contains(e.target))) return;
      setOpen(false);
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', updateCoords);
    return () => { window.removeEventListener('scroll', onScroll, true); window.removeEventListener('resize', updateCoords); };
  }, [open, updateCoords]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target) && listRef.current && !listRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const dropdown = open && ReactDOM.createPortal(
    <ul ref={listRef} role="listbox"
      style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width, minWidth: coords.width, zIndex: 99999 }}
      className="bg-white border border-gray-200 rounded-xl shadow-xl py-1 max-h-64 overflow-y-auto">
      {options.map(opt => {
        const active = opt === value;
        return (
          <li key={opt} role="option" aria-selected={active}
            onMouseDown={e => { e.preventDefault(); onChange(opt); setOpen(false); }}
            className={`flex items-center justify-between px-3 py-2.5 text-sm cursor-pointer select-none transition-colors
              ${active ? 'bg-[#0a1f44] text-white' : 'text-gray-700 hover:bg-[#e8edf5] hover:text-[#0a1f44]'}`}>
            <span className="flex-1">{opt}</span>
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
        className={`flex items-center justify-between gap-2 w-full px-3 py-2.5 text-sm bg-white rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[#0a1f44]/20
          ${error ? 'border-red-400 text-red-500' : open ? 'border-[#0a1f44] ring-2 ring-[#0a1f44]/10 text-[#0a1f44]' : 'border-gray-200 text-gray-700 hover:border-[#0a1f44]'}`}>
        <span className={`truncate text-left ${!value ? 'text-gray-400' : ''}`}>{value || placeholder}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {dropdown}
    </>
  );
}

/* ── Page ── */
export default function CustomerCarePage() {
  const [s, setS]           = useState(DEFAULT);
  const [openFaq, setOpenFaq]     = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });

  // Fetch dynamic content from site-settings
  useEffect(() => {
    api.get('/admin/site-settings')
      .then(({ data }) => { if (data?.customerCare) setS(prev => ({ ...prev, ...data.customerCare })); })
      .catch(() => {});
  }, []);

  const ctaStyle = s.ctaBgType === 'image' && s.ctaBgImage
    ? { backgroundImage: `url(${resolveUrl(s.ctaBgImage)})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: s.ctaBgColor || '#0a1f44' };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setContactForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="text-white py-16 px-4" style={{ background: s.heroBgColor || '#0a1f44' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Headphones className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">{s.heroTitle}</h1>
          <p className="text-blue-200 text-base md:text-lg max-w-xl mx-auto">{s.heroSubtitle}</p>
          <div className="flex flex-wrap justify-center gap-3 mt-8 text-sm">
            {[{ icon: Clock, text: '24 × 7 Available' }, { icon: Shield, text: 'Secure & Confidential' }, { icon: Star, text: '4.9 ★ Rated Support' }]
              .map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-full backdrop-blur-sm text-white">
                  <Icon className="w-4 h-4 text-blue-300" />
                  <span className="text-sm font-medium">{text}</span>
                </div>
              ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-14">
        {/* Support Channels */}
        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">{s.channelsTitle}</h2>
          <p className="text-gray-500 text-sm text-center mb-8">{s.channelsSubtitle}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(s.channels || []).map(({ icon, title, primary, secondary, desc }) => {
              const Icon = ICON_MAP[icon] || Phone;
              return (
                <div key={title} className="bg-white border-2 border-gray-100 rounded-2xl p-5 hover:border-[#0a1f44] hover:shadow-md transition-all">
                  <div className="w-11 h-11 bg-[#0a1f44] rounded-xl flex items-center justify-center mb-4 shadow-sm">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 text-sm">{title}</h3>
                  <p className="text-sm font-semibold text-[#0a1f44]">{primary}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{secondary}</p>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* FAQ + Contact Form */}
        <div className="grid lg:grid-cols-2 gap-10">
          {/* FAQ */}
          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-2">{s.faqTitle}</h2>
            <p className="text-gray-500 text-sm mb-6">{s.faqSubtitle}</p>
            <div className="space-y-2">
              {(s.faqs || []).map((faq, i) => (
                <div key={i} className="border-2 border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-semibold text-gray-800 pr-3">{faq.q}</span>
                    {openFaq === i
                      ? <ChevronUp   className="w-4 h-4 text-[#0a1f44] flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-gray-400  flex-shrink-0" />}
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 pt-2 text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Contact Form */}
          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-2">{s.formTitle}</h2>
            <p className="text-gray-500 text-sm mb-6">{s.formSubtitle}</p>
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 sm:p-6">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[#0a1f44] rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-500 text-sm">Our support team will get back to you within 2–4 business hours at your registered email.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Your Name</label>
                      <input type="text" required value={contactForm.name}
                        onChange={e => setContactForm(p => ({ ...p, name: e.target.value.replace(/[^a-zA-Z\s]/g, '') }))}
                        placeholder="Full name" className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Email Address</label>
                      <input type="email" required value={contactForm.email}
                        onChange={e => setContactForm(p => ({ ...p, email: e.target.value.replace(/\s/g, '').toLowerCase() }))}
                        placeholder="you@example.com" className="input-field text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Subject</label>
                    <SelectDropdown value={contactForm.subject}
                      onChange={v => setContactForm(p => ({ ...p, subject: v }))}
                      options={SUBJECTS} placeholder="Select a topic…" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Message</label>
                    <textarea required rows={5} value={contactForm.message}
                      onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                      placeholder="Describe your issue in detail (include order ID if applicable)…"
                      className="input-field resize-none text-sm" />
                  </div>
                  <button type="submit" className="btn-primary w-full py-3 text-sm">Send Message</button>
                  <p className="text-xs text-gray-400 text-center">
                    Or email us at <span className="text-[#0a1f44] font-semibold">{s.formEmail}</span>
                  </p>
                </form>
              )}
            </div>
          </section>
        </div>

        {/* Bottom CTA */}
        <section className="rounded-3xl p-8 md:p-10 text-white relative overflow-hidden" style={ctaStyle}>
          {s.ctaBgType === 'image' && s.ctaBgImage && <div className="absolute inset-0 bg-black/40" />}
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <h3 className="text-2xl font-black mb-2">{s.ctaTitle}</h3>
            <p className="text-blue-200 text-sm mb-8">{s.ctaSubtitle}</p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { icon: '📞', label: 'Toll-Free',     value: s.ctaPhone },
                { icon: '📧', label: 'Email',         value: s.ctaEmail },
                { icon: '🕐', label: 'Support Hours', value: s.ctaHours },
              ].map(({ icon, label, value }) => (
                <div key={label} className="bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-center min-w-[140px] sm:min-w-[160px]">
                  <p className="text-xl mb-1">{icon}</p>
                  <p className="text-xs text-blue-300 font-medium mb-0.5">{label}</p>
                  <p className="text-sm font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}