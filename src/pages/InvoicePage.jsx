import { useState, useEffect } from 'react';
import { Search, Download, Package, Truck, CheckCircle, Clock, XCircle, Printer, FileText } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import TVS_logo from '../assets/TVS_logo.png';

const STATUS_STEPS = ['Placed', 'Processing', 'Packed', 'Shipped', 'Delivered'];

const STATUS_CONFIG = {
  Placed:     { icon: Clock,        color: '#0a1f44', bg: '#e8edf5' },
  Processing: { icon: Package,      color: '#0a1f44', bg: '#e8edf5' },
  Packed:     { icon: Package,      color: '#0a1f44', bg: '#e8edf5' },
  Shipped:    { icon: Truck,        color: '#0a1f44', bg: '#e8edf5' },
  Delivered:  { icon: CheckCircle,  color: '#fff',    bg: '#0a1f44' },
  Cancelled:  { icon: XCircle,      color: '#fff',    bg: '#de1c0e' },
};

/* Fallback branding for items with no dealer (platform / admin-owned products) */
const PLATFORM_BRANDING = {
  isPlatform: true,
  businessName: 'TVS AutoParts',
  logo: null,
  gstin: '',
  address: 'Chennai, Tamil Nadu - India',
  phone: '1800-258-6454',
  email: 'support@tvsautoparts.com',
  bankName: '', accountNumber: '', ifsc: '', upiId: '',
  footerNote: 'Thank you for shopping with TVS AutoParts!',
  invoicePrefix: 'TVS',
};

const resolveUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
  return `${base}${path}`;
};

/* Group order items by dealer id (or 'platform' when no dealer) */
function groupItemsByDealer(orderItems) {
  const groups = new Map();
  for (const item of orderItems) {
    const dealerId = item.dealer?._id || item.dealer || 'platform';
    if (!groups.has(dealerId)) groups.set(dealerId, []);
    groups.get(dealerId).push(item);
  }
  return groups;
}

export default function InvoicePage({ auth }) {
  const { user } = auth;
  const [query,   setQuery]   = useState('');
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(false);

  // dealerId -> invoice settings (fetched once per order lookup)
  const [dealerBranding, setDealerBranding] = useState({});
  const [brandingLoading, setBrandingLoading] = useState(false);

  const search = async () => {
    const q = query.trim();
    if (!q) { toast.error('Enter an invoice or order number'); return; }
    setLoading(true);
    try {
      const { data: myOrders } = await api.get('/orders/my');
      const found = myOrders.find(
        o => o.invoiceNumber?.toLowerCase() === q.toLowerCase() || o._id === q
      );
      if (found) {
        setOrder(found);
        await loadBrandingForOrder(found);
      } else {
        toast.error('No order found with that invoice number');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Search failed'); }
    finally { setLoading(false); }
  };

  const loadBrandingForOrder = async (ord) => {
    setBrandingLoading(true);
    const groups = groupItemsByDealer(ord.orderItems);
    const dealerIds = [...groups.keys()].filter(id => id !== 'platform');

    const branding = { platform: PLATFORM_BRANDING };
    await Promise.all(dealerIds.map(async (dealerId) => {
      try {
        const { data } = await api.get(`/dealer/invoice-settings/public/${dealerId}`);
        branding[dealerId] = data;
      } catch {
        // fall back to whatever populate() gave us, or a generic label
        const fallbackItem = ord.orderItems.find(i => (i.dealer?._id || i.dealer) === dealerId);
        branding[dealerId] = {
          ...PLATFORM_BRANDING,
          isPlatform: false,
          businessName: fallbackItem?.dealer?.businessName || 'Dealer',
        };
      }
    }));

    setDealerBranding(branding);
    setBrandingLoading(false);
  };

  const handleDownload = (invoiceNumber) => {
    const prev = document.title;
    document.title = `Invoice-${invoiceNumber}`;
    window.print();
    document.title = prev;
  };

  const currentStep = order ? STATUS_STEPS.indexOf(order.orderStatus) : -1;
  const scfg = order ? (STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.Placed) : null;
  const StatusIcon = scfg?.icon;

  const dealerGroups = order ? groupItemsByDealer(order.orderItems) : new Map();

  return (
    <div className="page-wrapper max-w-3xl">
      <h1 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
        <FileText className="w-6 h-6" style={{ color: '#0a1f44' }} />
        Invoice & Order Tracking
      </h1>

      {/* Search */}
      <div className="card p-5 mb-6 no-print">
        <label className="label">Enter Invoice / Order Number</label>
        <div className="flex gap-3">
          <input type="text" value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="e.g. TVS-INV-XXXXXX-XXXX"
            className="input-field flex-1 text-sm font-mono" />
          <button onClick={search} disabled={loading} className="btn-primary px-5 text-sm">
            {loading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
              : <Search className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Find your invoice number in the order confirmation email or in My Profile &gt; Orders.
        </p>
      </div>

      {order && (
        <>
          {/* Status banner */}
          {scfg && StatusIcon && (
            <div className="flex items-center gap-3 rounded-2xl p-4 mb-5 no-print"
              style={{ background: scfg.bg }}>
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                <StatusIcon className="w-5 h-5" style={{ color: scfg.color === '#fff' ? '#0a1f44' : scfg.color }} />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: scfg.color === '#fff' ? 'white' : scfg.color }}>
                  Order {order.orderStatus}
                </p>
                {order.trackingNumber && (
                  <p className="text-xs mt-0.5" style={{ color: scfg.color === '#fff' ? 'rgba(255,255,255,0.8)' : '#374151' }}>
                    Tracking: <span className="font-mono font-bold">{order.trackingNumber}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Progress tracker */}
          {!['Cancelled', 'Returned'].includes(order.orderStatus) && (
            <div className="card p-5 mb-5 no-print">
              <h3 className="font-bold text-gray-900 text-sm mb-4">Order Progress</h3>
              <div className="flex items-center">
                {STATUS_STEPS.map((step, idx) => {
                  const done   = idx <= currentStep;
                  const active = idx === currentStep;
                  return (
                    <div key={step} className="flex-1 flex flex-col items-center">
                      <div className="flex items-center w-full">
                        {idx > 0 && (
                          <div className="h-0.5 flex-1"
                            style={{ background: idx <= currentStep ? '#0a1f44' : '#e5e7eb' }} />
                        )}
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            background: done ? '#0a1f44' : '#e5e7eb',
                            color: done ? 'white' : '#9ca3af',
                            outline: active ? '3px solid #e8edf5' : 'none',
                          }}>
                          {done && !active ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                        </div>
                        {idx < STATUS_STEPS.length - 1 && (
                          <div className="h-0.5 flex-1"
                            style={{ background: done && idx < currentStep ? '#0a1f44' : '#e5e7eb' }} />
                        )}
                      </div>
                      <p className="text-xs mt-2 font-semibold"
                        style={{ color: active ? '#0a1f44' : done ? '#374151' : '#9ca3af' }}>
                        {step}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Invoice(s) — one branded block per dealer (delivered only) */}
          {order.orderStatus === 'Delivered' ? (
            brandingLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-8">
                {[...dealerGroups.entries()].map(([dealerId, items]) => (
                  <DealerInvoiceBlock
                    key={dealerId}
                    dealerId={dealerId}
                    items={items}
                    order={order}
                    user={user}
                    branding={dealerBranding[dealerId] || PLATFORM_BRANDING}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="card p-5">
              <h3 className="font-bold text-gray-900 mb-1">Order Summary</h3>
              <p className="text-sm text-gray-500 mb-4">
                Invoice will be available once your order is delivered.
              </p>
              <div className="space-y-2">
                {order.orderItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <img src={item.image} alt={item.title}
                      className="w-10 h-10 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                      onError={e => e.currentTarget.style.display = 'none'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.title}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-sm text-gray-900 flex-shrink-0">
                      Rs.{(item.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-black text-gray-900 mt-3 pt-3 border-t border-gray-100">
                <span>Total</span>
                <span>Rs.{order.totalPrice?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── One dealer's branded invoice block — its own header, items, and totals ── */
function DealerInvoiceBlock({ dealerId, items, order, user, branding, onDownload }) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const invoiceNumber = branding.isPlatform
    ? order.invoiceNumber
    : `${branding.invoicePrefix || 'INV'}-${order.invoiceNumber?.split('-').slice(-2).join('-') || order._id.slice(-8).toUpperCase()}`;

  const logoUrl = branding.logo ? resolveUrl(branding.logo) : null;

  return (
    <div>
      <div className="flex gap-3 mb-4 no-print">
        <button onClick={() => onDownload(invoiceNumber)} className="btn-primary text-sm px-5 py-2.5">
          <Download className="w-4 h-4" /> Download Invoice
        </button>
        <button onClick={() => window.print()} className="btn-secondary text-sm px-5 py-2.5">
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      <div className="card p-6 md:p-8 space-y-6 print:shadow-none print:border-0">
        {/* Invoice header — dealer's own branding */}
        <div className="flex items-start justify-between">
          <div>
            {logoUrl
              ? <img src={logoUrl} alt={branding.businessName} className="h-10 object-contain mb-2"
                  onError={e => { e.currentTarget.style.display = 'none'; }} />
              : branding.isPlatform
                ? <img src={TVS_logo} alt="TVS" className="h-10 object-contain mb-2" />
                : <p className="font-black text-gray-900 text-lg mb-1">{branding.businessName}</p>}
            <p className="text-xs text-gray-500">{branding.businessName}</p>
            <p className="text-xs text-gray-400">{branding.address}</p>
            {branding.gstin && <p className="text-xs text-gray-400">GSTIN: {branding.gstin}</p>}
            <p className="text-xs text-gray-400">
              {branding.email}{branding.phone ? ` | ${branding.phone}` : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-gray-900">INVOICE</p>
            <p className="font-mono text-sm text-gray-500 mt-1">{invoiceNumber}</p>
            <p className="text-xs text-gray-400 mt-1">
              Date: {new Date(order.deliveredAt || order.updatedAt).toLocaleDateString('en-IN')}
            </p>
            {!branding.isPlatform && (
              <p className="text-xs text-gray-300 mt-1">Sold by {branding.businessName}</p>
            )}
          </div>
        </div>

        <hr className="border-gray-100" />

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="label">Bill To</p>
            <p className="font-bold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-600">{user.phone}</p>
          </div>
          <div>
            <p className="label">Ship To</p>
            <p className="text-sm text-gray-700">
              {[order.shippingAddress?.street, order.shippingAddress?.city,
                order.shippingAddress?.state, order.shippingAddress?.pincode]
                .filter(Boolean).join(', ')}
            </p>
          </div>
        </div>

        {/* Items table — only this dealer's items */}
        <table className="w-full text-sm">
          <thead style={{ background: '#e8edf5' }}>
            <tr className="text-xs text-gray-500 uppercase">
              <th className="text-left px-3 py-2 rounded-l-lg">Item</th>
              <th className="text-center px-3 py-2">Qty</th>
              <th className="text-right px-3 py-2">Unit Price</th>
              <th className="text-right px-3 py-2 rounded-r-lg">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-gray-50">
                <td className="px-3 py-2.5">
                  <p className="font-semibold text-gray-800">{item.title}</p>
                  {item.color && <p className="text-xs text-gray-400">Color: {item.color}</p>}
                </td>
                <td className="px-3 py-2.5 text-center">{item.quantity}</td>
                <td className="px-3 py-2.5 text-right">Rs.{item.price?.toLocaleString('en-IN')}</td>
                <td className="px-3 py-2.5 text-right font-bold">
                  Rs.{(item.price * item.quantity)?.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals — this dealer's subtotal only */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>Rs.{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex justify-between font-black text-gray-900 text-base">
              <span>Total</span>
              <span>Rs.{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Payment</span>
              <span className="font-semibold">{order.paymentMethod}</span>
            </div>
          </div>
        </div>

        {/* Bank / UPI details, if the dealer provided them */}
        {(branding.bankName || branding.upiId) && (
          <>
            <hr className="border-gray-100" />
            <div className="text-xs text-gray-500 space-y-0.5">
              <p className="font-bold text-gray-600 uppercase tracking-wide mb-1">Payment Details</p>
              {branding.bankName && <p>Bank: {branding.bankName}{branding.accountNumber ? ` · A/C ${branding.accountNumber}` : ''}{branding.ifsc ? ` · IFSC ${branding.ifsc}` : ''}</p>}
              {branding.upiId && <p>UPI: {branding.upiId}</p>}
            </div>
          </>
        )}

        <hr className="border-gray-100" />
        <div className="text-center">
          <p className="text-xs text-gray-400">{branding.footerNote}</p>
          {!branding.isPlatform && (
            <p className="text-xs text-gray-300 mt-1">Fulfilled via TVS AutoParts marketplace</p>
          )}
        </div>
      </div>
    </div>
  );
}