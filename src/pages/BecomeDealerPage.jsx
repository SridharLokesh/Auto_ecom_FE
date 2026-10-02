import { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import {
  MapPin, Phone, Mail, User, Building,
  CheckCircle, ChevronDown, ArrowRight, Store,
  Shield, TrendingUp, Users, Check,
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { resolveUrl } from '../utils/settingsShared';

const ICON_MAP = { TrendingUp, Shield, Store, Users };

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh','Puducherry',
];

const DEFAULT_SETTINGS = {
  heroTitle:    'Become a TVS Dealer',
  heroSubtitle: "Partner with India's leading two-wheeler brand. Sell genuine TVS parts and grow your business.",
  heroBgType:   'color',
  heroBgColor:  '#0a1f44',
  heroBgImage:  '',
  heroBadges:   [
    { text: 'No Joining Fee' },
    { text: '4,000+ Partners Across India' },
    { text: 'Your Own Dashboard' },
  ],
  whyTitle:    'Why Partner With Us?',
  whySubtitle: 'Everything you need to build a successful parts dealership',
  benefits: [
    { icon: 'TrendingUp', title: 'Earn More Revenue',    desc: 'Access TVS customer base and earn consistent income from spare parts sales.' },
    { icon: 'Shield',     title: 'Official Partnership', desc: 'Become an authorised TVS dealer with official credentials and branding.' },
    { icon: 'Store',      title: 'Your Own Dashboard',   desc: 'Manage products, track orders and monitor revenue all in one place.' },
    { icon: 'Users',      title: 'Dedicated Support',    desc: 'Priority support from our dealer relations team and training materials.' },
  ],
};

const nameRegex  = /^[A-Za-z\s]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9]{10,15}$/;

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
    const listHeight = 208;
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
      style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width, zIndex: 99999 }}
      className="bg-white border border-gray-200 rounded-xl shadow-lg py-1 max-h-52 overflow-y-auto">
      {options.map(opt => {
        const active = opt === value;
        return (
          <li key={opt} role="option" aria-selected={active}
            onMouseDown={e => { e.preventDefault(); onChange(opt); setOpen(false); }}
            className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors
              ${active ? 'bg-[#0a1f44] text-white' : 'text-gray-700 hover:bg-[#e8edf5] hover:text-[#0a1f44]'}`}>
            <span>{opt}</span>
            {active && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
          </li>
        );
      })}
    </ul>,
    document.body
  );

  return (
    <div>
      <button ref={triggerRef} type="button" onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox" aria-expanded={open}
        className={`flex items-center justify-between gap-2 w-full px-3 py-2.5 text-sm bg-white rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[#0a1f44]/20
          ${error ? 'border-red-400 text-red-600' : open ? 'border-[#0a1f44] text-[#0a1f44]' : 'border-gray-200 text-gray-700 hover:border-[#0a1f44]'}`}>
        <span className={`truncate ${!value ? 'text-gray-400' : ''}`}>{value || placeholder}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {dropdown}
    </div>
  );
}

/* ── Page ── */
export default function BecomeDealerPage() {
  const [s, setS] = useState(DEFAULT_SETTINGS);   // page settings from API
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', businessName: '', businessLocation: '', state: '', message: '' });
  const [errors, setErrors] = useState({});

  // Fetch dynamic content from site-settings
  useEffect(() => {
    api.get('/admin/site-settings')
      .then(({ data }) => { if (data?.dealerPage) setS(prev => ({ ...prev, ...data.dealerPage })); })
      .catch(() => {});
  }, []);

  const heroStyle = s.heroBgType === 'image' && s.heroBgImage
    ? { backgroundImage: `url(${resolveUrl(s.heroBgImage)})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: s.heroBgColor || '#0a1f44' };

  const set = (k) => (e) => {
    let value = e.target.value;
    if (k === 'name' || k === 'businessName') { if (!/^[A-Za-z\s]*$/.test(value)) return; }
    if (k === 'phone') { if (!/^\+?[0-9]*$/.test(value)) return; }
    setForm(p => ({ ...p, [k]: value }));
    setErrors(p => ({ ...p, [k]: '' }));
  };
  const setField = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()         || !nameRegex.test(form.name))        e.name             = 'Valid name required';
    if (!form.email.trim()        || !emailRegex.test(form.email))       e.email            = 'Valid email required';
    if (!form.phone.trim()        || !phoneRegex.test(form.phone))       e.phone            = 'Valid phone required (10-15 digits)';
    if (!form.businessName.trim() || !nameRegex.test(form.businessName)) e.businessName     = 'Valid business name required';
    if (!form.businessLocation.trim())                                    e.businessLocation = 'Required';
    if (!form.state)                                                      e.state            = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/dealer/request', form);
      setSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="text-white py-16 px-4 relative" style={heroStyle}>
        {s.heroBgType === 'image' && s.heroBgImage && <div className="absolute inset-0 bg-black/40" />}
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="w-16 h-16 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-white/10">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3">{s.heroTitle}</h1>
          <p className="text-blue-200 text-base md:text-lg max-w-xl mx-auto">{s.heroSubtitle}</p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {(s.heroBadges || []).filter(b => b.text).map(b => (
              <div key={b.text} className="flex items-center gap-2 border border-white/20 px-4 py-2 rounded-full text-sm bg-white/10">
                <CheckCircle className="w-4 h-4 text-white flex-shrink-0" />
                <span>{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-14">
        {/* Benefits */}
        <section>
          <h2 className="text-2xl font-black text-gray-900 text-center mb-2">{s.whyTitle}</h2>
          <p className="text-gray-500 text-sm text-center mb-8">{s.whySubtitle}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(s.benefits || []).map(({ icon, title, desc }) => {
              const Icon = ICON_MAP[icon] || Store;
              return (
                <div key={title} className="card p-5 hover:shadow-md transition-shadow hover:border-[#0a1f44]/30 border-2 border-gray-100">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-[#0a1f44]">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 text-sm">{title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Steps — static, not CMS-managed */}
        <section className="rounded-3xl p-8 bg-[#e8edf5]">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Apply Online',  desc: 'Fill the form with your business details' },
              { step: '02', title: 'Review',        desc: 'Our team reviews your application in 3-5 days' },
              { step: '03', title: 'Get Approved',  desc: 'Receive your Dealer ID and login credentials' },
              { step: '04', title: 'Start Selling', desc: 'List products, manage orders and grow' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white mx-auto mb-3 bg-[#0a1f44]">{step}</div>
                <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Form */}
        <section className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-2">Apply Now</h2>
          <p className="text-gray-500 text-sm text-center mb-8">
            Already a dealer?{' '}
            <Link to="/login?type=dealer" className="font-bold hover:underline text-[#0a1f44]">Login as Dealer</Link>
          </p>
          <div className="card p-6 md:p-8 border-2 border-gray-100">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-[#e8edf5]">
                  <CheckCircle className="w-8 h-8 text-[#0a1f44]" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Application Submitted!</h3>
                <p className="text-gray-500 text-sm mb-1">Confirmation sent to <strong>{form.email}</strong></p>
                <p className="text-gray-400 text-xs mb-6">Our dealer relations team will contact you within 3-5 business days.</p>
                <Link to="/" className="btn-primary px-6 py-2.5 text-sm">Back to Home <ArrowRight className="w-4 h-4" /></Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                      <input type="text" value={form.name} onChange={set('name')} placeholder="Your full name"
                        className={`input-field pl-10 text-sm ${errors.name ? 'input-error' : ''}`} />
                    </div>
                    {errors.name && <p className="text-xs mt-1 text-red-600">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="label">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                      <input type="email" value={form.email} onChange={set('email')} placeholder="business@example.com"
                        className={`input-field pl-10 text-sm ${errors.email ? 'input-error' : ''}`} />
                    </div>
                    {errors.email && <p className="text-xs mt-1 text-red-600">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="label">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                      <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 XXXXX XXXXX"
                        className={`input-field pl-10 text-sm ${errors.phone ? 'input-error' : ''}`} />
                    </div>
                    {errors.phone && <p className="text-xs mt-1 text-red-600">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="label">Business Name *</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                      <input type="text" value={form.businessName} onChange={set('businessName')} placeholder="Your shop / company"
                        className={`input-field pl-10 text-sm ${errors.businessName ? 'input-error' : ''}`} />
                    </div>
                    {errors.businessName && <p className="text-xs mt-1 text-red-600">{errors.businessName}</p>}
                  </div>
                  <div>
                    <label className="label">Business Location *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                      <input type="text" value={form.businessLocation} onChange={set('businessLocation')} placeholder="City, Area"
                        className={`input-field pl-10 text-sm ${errors.businessLocation ? 'input-error' : ''}`} />
                    </div>
                    {errors.businessLocation && <p className="text-xs mt-1 text-red-600">{errors.businessLocation}</p>}
                  </div>
                  <div>
                    <label className="label">State *</label>
                    <SelectDropdown value={form.state} onChange={v => setField('state', v)}
                      options={INDIAN_STATES} placeholder="Select state..." error={!!errors.state} />
                    {errors.state && <p className="text-xs mt-1 text-red-600">{errors.state}</p>}
                  </div>
                </div>
                <div>
                  <label className="label">Additional Message <span className="font-normal text-gray-400">(optional)</span></label>
                  <textarea rows={3} value={form.message} onChange={set('message')}
                    placeholder="Tell us about your business or experience with TVS products..."
                    className="input-field resize-none text-sm" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
                  {loading
                    ? <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</span>
                    : <span className="flex items-center gap-2 justify-center">Submit Application <ArrowRight className="w-4 h-4" /></span>}
                </button>
                <p className="text-xs text-gray-400 text-center">
                  By submitting you agree to our team. We will Contact you within 3-5 business days.
                </p>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}