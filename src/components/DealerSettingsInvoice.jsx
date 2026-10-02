// components/DealerSettingsInvoice.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Save, Upload, Info, FileText, Landmark } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const EMPTY = {
  businessName: '', gstin: '', address: '', phone: '', email: '',
  bankName: '', accountNumber: '', ifsc: '', upiId: '',
  footerNote: 'Thank you for your business!', invoicePrefix: 'INV',
};

const resolveUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
  return `${base}${path}`;
};

export default function DealerSettingsInvoice() {
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState(EMPTY);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile,    setLogoFile]    = useState(null);
  const fileRef = useRef(null);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await api.get('/dealer/invoice-settings');
      setForm(f => ({ ...f, ...data }));
      if (data.logo) setLogoPreview(resolveUrl(data.logo));
    } catch { /* keep defaults */ }
  }, []);

  useEffect(() => { (async () => { await fetchSettings(); setLoading(false); })(); }, [fetchSettings]);

  const setF = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

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

  const save = async () => {
    if (!form.businessName.trim()) { toast.error('Business name is required'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
      if (logoFile) fd.append('logo', logoFile);

      const { data } = await api.put('/dealer/invoice-settings', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Invoice settings saved!');
      setForm(f => ({ ...f, ...data.invoiceSettings }));
      if (data.invoiceSettings?.logo) setLogoPreview(resolveUrl(data.invoiceSettings.logo));
      setLogoFile(null);
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
        <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#0a1f44]" /> Invoice Settings
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          This is how your business appears on the invoice customers receive for your products.
          Each dealer in a multi-dealer order gets their own separately branded invoice.
        </p>
      </div>

      {/* Logo */}
      <div className="card p-5 space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Business Logo</p>
        <div className="flex flex-wrap items-start gap-6">
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center w-44 h-24 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#0a1f44] hover:bg-blue-50 transition-all gap-1.5 flex-shrink-0">
            <Upload className="w-4 h-4 text-gray-400" />
            <span className="text-[11px] text-gray-500 text-center leading-tight px-1">Click to upload<br/>PNG / SVG / WebP</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Preview</p>
            <div className="w-[140px] h-[48px] border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-white overflow-hidden">
              {logoPreview
                ? <img src={logoPreview} alt="logo preview" className="w-full h-full object-contain" />
                : <span className="text-[11px] text-gray-400">No logo</span>}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3">
          <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">Transparent-background PNG recommended. Max 2 MB.</p>
        </div>
      </div>

      {/* Business details */}
      <div className="card p-5 space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Business Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="label">Business Name *</label>
            <input type="text" value={form.businessName} onChange={setF('businessName')} className="input-field text-sm" placeholder="e.g. Sri Balaji Auto Parts" />
          </div>
          <div>
            <label className="label">GSTIN</label>
            <input type="text" value={form.gstin} onChange={setF('gstin')} className="input-field text-sm font-mono" placeholder="e.g. 33ABCDE1234F1Z5" />
          </div>
          <div>
            <label className="label">Invoice Prefix</label>
            <input type="text" value={form.invoicePrefix} onChange={setF('invoicePrefix')} maxLength={10} className="input-field text-sm font-mono uppercase" placeholder="e.g. SBA" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Business Address</label>
            <input type="text" value={form.address} onChange={setF('address')} className="input-field text-sm" placeholder="Shop No, Street, City, State, Pincode" />
          </div>
          <div>
            <label className="label">Contact Phone</label>
            <input type="text" value={form.phone} onChange={setF('phone')} className="input-field text-sm" placeholder="e.g. 98765 43210" />
          </div>
          <div>
            <label className="label">Contact Email</label>
            <input type="email" value={form.email} onChange={setF('email')} className="input-field text-sm" placeholder="e.g. contact@yourbusiness.com" />
          </div>
        </div>
      </div>

      {/* Bank / UPI details */}
      <div className="card p-5 space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5" /> Bank / UPI Details <span className="font-normal text-gray-300 normal-case">(optional, shown on invoice)</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Bank Name</label>
            <input type="text" value={form.bankName} onChange={setF('bankName')} className="input-field text-sm" />
          </div>
          <div>
            <label className="label">Account Number</label>
            <input type="text" value={form.accountNumber} onChange={setF('accountNumber')} className="input-field text-sm font-mono" />
          </div>
          <div>
            <label className="label">IFSC Code</label>
            <input type="text" value={form.ifsc} onChange={setF('ifsc')} className="input-field text-sm font-mono uppercase" />
          </div>
          <div>
            <label className="label">UPI ID</label>
            <input type="text" value={form.upiId} onChange={setF('upiId')} className="input-field text-sm font-mono" placeholder="e.g. yourbusiness@upi" />
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="card p-5 space-y-3">
        <label className="label">Invoice Footer Note</label>
        <input type="text" value={form.footerNote} onChange={setF('footerNote')} className="input-field text-sm" placeholder="e.g. Thank you for your business!" />
      </div>

      {/* Live preview */}
      <div className="card p-5">
        <label className="label">Live Preview</label>
        <div className="rounded-2xl border border-gray-100 p-5 mt-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              {logoPreview
                ? <img src={logoPreview} alt="logo" className="h-10 object-contain mb-2" />
                : <p className="font-black text-gray-900">{form.businessName || 'Your Business Name'}</p>}
              <p className="text-xs text-gray-500">{form.address || 'Business address'}</p>
              {form.gstin && <p className="text-xs text-gray-400">GSTIN: {form.gstin}</p>}
              <p className="text-xs text-gray-400">{form.email || 'contact@business.com'} {form.phone && `| ${form.phone}`}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-gray-900">INVOICE</p>
              <p className="font-mono text-xs text-gray-500">{form.invoicePrefix || 'INV'}-XXXXXX</p>
            </div>
          </div>
          <hr className="border-gray-100 mb-3" />
          <p className="text-xs text-gray-400 text-center">{form.footerNote}</p>
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 bg-[#0a1f44]">
        {saving
          ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
          : <><Save className="w-4 h-4" />Save Invoice Settings</>}
      </button>
    </div>
  );
}