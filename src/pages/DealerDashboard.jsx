import { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, Package, ShoppingBag, TrendingUp, Plus,
  Edit3, Trash2, X, Upload, ChevronDown, AlertTriangle,
  CheckCircle, Truck, Clock, RefreshCw, IndianRupee,
  Star, BarChart3, Store, Image, FileText, Boxes,
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import DealerSettingsInvoice from '../components/DealerSettingsInvoice';
import DealerInventory from './dealer/Inventory';

/* ─────────────────────────────────────────────────────────────────────
   Default categories — shown instantly while DB loads.
   Admin edits via dashboard; dealer always sees the live list.
───────────────────────────────────────────────────────────────────── */
const DEFAULT_CATEGORIES = [
  { name: "Engine Parts",   slug: "engine",      subCategories: [
      "Piston","Crankshaft","Cylinder","Carburetor","Oil Filter","Air Filter","Spark Plug","Timing Chain",
    ].map(n => ({ name: n, slug: n.toLowerCase().replace(/\s+/g,'-'), isActive: true })) },
  { name: "Brakes",         slug: "brakes",      subCategories: [
      "Brake Pads","Brake Disc","Brake Drum","Brake Cable","Master Cylinder","Caliper",
    ].map(n => ({ name: n, slug: n.toLowerCase().replace(/\s+/g,'-'), isActive: true })) },
  { name: "Electricals",    slug: "electricals", subCategories: [
      "Battery","Bulb","Switch","Wiring Harness","CDI Unit","Rectifier","Horn","Indicator",
    ].map(n => ({ name: n, slug: n.toLowerCase().replace(/\s+/g,'-'), isActive: true })) },
  { name: "Body Parts",     slug: "body",        subCategories: [
      "Fairing","Mudguard","Fuel Tank","Seat","Headlight","Tail Light","Mirrors","Handle",
    ].map(n => ({ name: n, slug: n.toLowerCase().replace(/\s+/g,'-'), isActive: true })) },
  { name: "Tyres & Wheels", slug: "tyres",       subCategories: [
      "Front Tyre","Rear Tyre","Tube","Rim","Spoke Set","Wheel Bearing",
    ].map(n => ({ name: n, slug: n.toLowerCase().replace(/\s+/g,'-'), isActive: true })) },
  { name: "Lubricants",     slug: "lubricants",  subCategories: [
      "Engine Oil","Gear Oil","Brake Fluid","Grease","Chain Lube","Coolant",
    ].map(n => ({ name: n, slug: n.toLowerCase().replace(/\s+/g,'-'), isActive: true })) },
  { name: "Suspension",     slug: "suspension",  subCategories: [
      "Fork Oil","Fork Seal","Shock Absorber","Spring","Bushing",
    ].map(n => ({ name: n, slug: n.toLowerCase().replace(/\s+/g,'-'), isActive: true })) },
  { name: "Accessories",    slug: "accessories", subCategories: [
      "Phone Mount","Bag","Cover","Lock","Helmet","Gloves",
    ].map(n => ({ name: n, slug: n.toLowerCase().replace(/\s+/g,'-'), isActive: true })) },
  { name: "Other",          slug: "other",       subCategories: [
      { name: "General", slug: "general", isActive: true },
    ] },
];

function mergeCategories(defaults, dbCats) {
  const map = new Map(defaults.map(c => [c.slug, { ...c }]));
  dbCats.forEach(dbCat => {
    const slug = dbCat.slug?.toLowerCase();
    if (map.has(slug)) {
      // If DB has sub-categories defined, use them; otherwise keep defaults
      const merged = {
        ...map.get(slug),
        name: dbCat.name,
      };
      if (dbCat.subCategories && dbCat.subCategories.length > 0) {
        merged.subCategories = dbCat.subCategories.filter(s => s.isActive !== false);
      }
      map.set(slug, merged);
    } else {
      map.set(slug, { name: dbCat.name, slug, subCategories: dbCat.subCategories || [] });
    }
  });
  return Array.from(map.values());
}

/* Module-level cache */
let _catCache   = null;
let _catPromise = null;
function loadCategories() {
  if (_catCache) return Promise.resolve(_catCache);
  if (_catPromise) return _catPromise;

  _catPromise = api
    .get("/categories")
    .then(({ data }) => {
      _catCache =
        Array.isArray(data) && data.length > 0
          ? mergeCategories(DEFAULT_CATEGORIES, data)
          : DEFAULT_CATEGORIES;

      return _catCache;
    })
    .catch(() => {
      _catCache = DEFAULT_CATEGORIES;
      return _catCache;
    });

  return _catPromise;
}
const STATUS_BADGE = {
  Placed:     'bg-gray-100 text-[#0a1f44]',
  Processing: 'bg-gray-100 text-[#0a1f44]',
  Packed:     'bg-gray-100 text-[#0a1f44]',
  Shipped:    'bg-[#0a1f44] text-white',
  Delivered:  'bg-[#0a1f44]/10 text-[#0a1f44]',
  Cancelled:  'bg-red-50 text-red-500',
  Returned:   'bg-red-50 text-red-500',
};

const EMPTY_FORM = {
  title: '', brand: 'TVS', category: '', subCategory: '',
  price: '', originalPrice: '', stock: '', discount: '',
  description: '', tags: '', image: '', imageFile: null,
  features: '', compatibility: '', partNumber: '', color: '',
};

export default function DealerDashboard({ auth, initialTab }) {
  const { user } = auth;
  const [tab,         setTab]         = useState(initialTab || 'overview');
  const [stats,       setStats]       = useState(null);
  const [products,    setProducts]    = useState([]);
  const [orders,      setOrders]      = useState([]);
  const [loadingP,    setLoadingP]    = useState(false);
  const [loadingO,    setLoadingO]    = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [editId,      setEditId]      = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [preview,     setPreview]     = useState('');
  const [orderFilter, setOrderFilter] = useState('');

  // DB-driven categories (starts with defaults, updated after fetch)
  const [categories,  setCategories]  = useState(DEFAULT_CATEGORIES);

  const fileRef = useRef(null);

  /* ── Load categories once ── */
  useEffect(() => {
    loadCategories().then(cats => {
      setCategories(cats);
      // Set default form category to first category
      if (!form.category && cats.length > 0) {
        setForm(f => ({ ...f, category: cats[0].name }));
      }
    });
  }, [form.category]);

  /* ── Sub-categories for selected category ── */
  const selectedCatObj = categories.find(c => c.name === form.category || c.slug === form.category?.toLowerCase());
  const activeSubs = (selectedCatObj?.subCategories || []).filter(s => s.isActive !== false);

  const fetchStats = useCallback(async () => {
    try { const { data } = await api.get('/dealer/stats'); setStats(data); } catch (err) { console.error('Failed to fetch stats:', err); }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoadingP(true);
    try {
      const { data } = await api.get(`/products?dealer=${user._id}&limit=100`);
      setProducts(data.products || []);
    } catch { toast.error('Failed to load products'); }
    finally { setLoadingP(false); }
  }, [user._id]);

  const fetchOrders = useCallback(async (status = '') => {
    setLoadingO(true);
    try {
      const q = status ? `?status=${status}` : '';
      const { data } = await api.get(`/orders/dealer${q}`);
      setOrders(data);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoadingO(false); }
  }, []);

  useEffect(() => { fetchStats(); fetchProducts(); fetchOrders(); }, [fetchStats, fetchProducts, fetchOrders]);

  /* ── Form helpers ── */
  const setF = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const openAdd = () => {
    const defaultCat = categories[0]?.name || '';
    setForm({ ...EMPTY_FORM, category: defaultCat });
    setEditId(null); setPreview(''); setShowForm(true);
  };

  const openEdit = (p) => {
    setForm({
      title: p.title, brand: p.brand || 'TVS', category: p.category,
      subCategory: p.subCategory || '', price: p.price, originalPrice: p.originalPrice || '',
      stock: p.stock, discount: p.discount || 0, description: p.description || '',
      tags: (p.tags || []).join(', '), image: p.image || '',
      features: (p.features || []).join(', '), compatibility: (p.compatibility || []).join(', '),
      partNumber: p.partNumber || '', color: p.color || '', imageFile: null,
    });
    setPreview(p.image || ''); setEditId(p._id); setShowForm(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(p => ({ ...p, imageFile: file }));
    setPreview(URL.createObjectURL(file));
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.price || !form.stock) {
      toast.error('Title, price and stock are required'); return;
    }
    if (!form.category) {
      toast.error('Please select a category'); return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'imageFile') { if (v) fd.append('imageFile', v); }
        else fd.append(k, v ?? '');
      });

      if (editId) {
        await api.put(`/products/${editId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product updated!');
      } else {
        await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product added!');
      }
      setShowForm(false); fetchProducts(); fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally { setSaving(false); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try { await api.delete(`/products/${id}`); toast.success('Deleted'); fetchProducts(); fetchStats(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const updateOrderStatus = async (orderId, status, trackingNumber) => {
    try {
      await api.put(`/orders/${orderId}/dealer-status`, { status, trackingNumber });
      toast.success(`Order marked as ${status}`);
      fetchOrders(orderFilter); fetchStats();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const statCards = [
    { label: 'Total Products', value: stats?.totalProducts || 0,                                    icon: Package,     color: 'bg-[#0a1f44]' },
    { label: 'Total Orders',   value: stats?.totalOrders   || 0,                                    icon: ShoppingBag, color: 'bg-[#0a1f44]' },
    { label: 'Live Orders',    value: stats?.liveOrders    || 0,                                    icon: Clock,       color: 'bg-[#0a1f44]' },
    { label: 'Revenue Earned', value: `₹${(stats?.revenue || 0).toLocaleString('en-IN')}`,         icon: IndianRupee, color: 'bg-[#0a1f44]' },
  ];

  return (
    <div className="page-wrapper space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Store className="w-6 h-6 text-[#0a1f44]" /> Dealer Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {user.businessName || user.name} ·{' '}
            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{user.dealerId}</span>
          </p>
        </div>
        {tab === 'products' && (
          <button onClick={openAdd} className="btn-primary bg-[#0a1f44] text-sm px-4 py-2.5 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
        {[
          { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
          { id: 'products',  label: 'Products',  icon: Package },
          { id: 'inventory', label: 'Inventory', icon: Boxes },
          { id: 'orders',    label: 'Orders',    icon: ShoppingBag },
          { id: 'invoice',   label: 'Invoice',   icon: FileText },
        ].map(({ id, label, icon: Icon }) => (  // eslint-disable-line no-unused-vars
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all
              ${tab === id ? 'bg-white shadow text-[#0a1f44]' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(({ label, value, icon: IconComponent, color }) => (  // eslint-disable-line no-unused-vars
              <div key={label} className="card p-5">
                <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <p className="text-xl font-black text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-[#0a1f44]" /> Products by Category
              </h3>
              {stats?.categoryStats?.length ? stats.categoryStats.map(({ _id, count }) => (
                <div key={_id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700">{_id}</span>
                  <span className="text-sm font-bold text-[#0a1f44]">{count}</span>
                </div>
              )) : <p className="text-sm text-gray-400">No products yet</p>}
            </div>

            <div className="card p-5">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-[#0a1f44]" /> Low Stock Alert
              </h3>
              {stats?.lowStock?.length ? stats.lowStock.map(p => (
                <div key={p._id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700 truncate max-w-[200px]">{p.title}</span>
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{p.stock} left</span>
                </div>
              )) : <p className="text-sm text-gray-400">All products have sufficient stock</p>}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#0a1f44]" /> Order Status Breakdown
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(stats?.statusBreakdown || {}).map(([status, count]) => (
                <div key={status} className={`rounded-xl p-3 text-center ${STATUS_BADGE[status] || 'bg-gray-100 text-gray-600'}`}>
                  <p className="text-xl font-black">{count}</p>
                  <p className="text-xs mt-0.5">{status}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4">Recent Orders</h3>
            {stats?.recentOrders?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                      <th className="text-left pb-2">Invoice</th>
                      <th className="text-left pb-2">Customer</th>
                      <th className="text-left pb-2">Amount</th>
                      <th className="text-left pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map(o => (
                      <tr key={o._id} className="border-b border-gray-50">
                        <td className="py-2 font-mono text-xs text-gray-500">{o.invoiceNumber}</td>
                        <td className="py-2 text-gray-700">{o.user?.name}</td>
                        <td className="py-2 font-bold">₹{o.totalPrice?.toLocaleString('en-IN')}</td>
                        <td className="py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[o.orderStatus]}`}>
                            {o.orderStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-sm text-gray-400">No orders yet</p>}
          </div>
        </div>
      )}

      {/* ── PRODUCTS ── */}
      {tab === 'products' && (
        <div>
          {loadingP ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold">No products yet</p>
              <button onClick={openAdd} className="btn-primary bg-[#0a1f44] mt-4 text-sm px-5 py-2.5 flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" /> Add your first product
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(p => (
                <div key={p._id} className="card overflow-hidden group">
                  <div className="relative bg-gray-50">
                    <img
                      src={p.image || 'https://via.placeholder.com/300x200?text=No+Image'}
                      alt={p.title} className="w-full h-36 object-cover"
                      onError={e => { e.currentTarget.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
                    />
                    {p.stock === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-white text-xs font-bold px-3 py-1 rounded-full">Out of Stock</span>
                      </div>
                    )}
                    {p.stock > 0 && p.stock <= 5 && (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                        Only {p.stock} left
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">
                      {p.category}{p.subCategory ? ` › ${p.subCategory}` : ''}
                    </p>
                    <h4 className="text-sm font-bold text-gray-900 line-clamp-2 mb-1">{p.title}</h4>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-black text-gray-900">₹{p.price?.toLocaleString('en-IN')}</span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Star className="w-3 h-3 text-[#0a1f44] fill-current" />
                        {p.rating?.toFixed(1) || '0'} ({p.numReviews})
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 border-2 border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-[#0a1f44] hover:border-[#0a1f44] hover:text-white transition-all">
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => deleteProduct(p._id)}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 border-2 border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── INVENTORY (Phase 1) ── */}
      {tab === 'inventory' && <DealerInventory user={user} />}

      {/* ── ORDERS ── */}
      {tab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['', 'Placed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
              <button key={s} onClick={() => { setOrderFilter(s); fetchOrders(s); }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border
                  ${orderFilter === s ? 'bg-[#0a1f44] text-white border-[#0a1f44]' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>

          {loadingO ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold">No orders found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <OrderCard key={order._id} order={order} dealerId={user._id} onUpdate={updateOrderStatus} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── INVOICE SETTINGS ── */}
      {tab === 'invoice' && <DealerSettingsInvoice />}

      {/* ── PRODUCT FORM MODAL ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-6">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">{editId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveProduct} className="p-6 space-y-4">
              {/* Image upload */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Product Image</label>
                <div className="flex gap-4 items-start">
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                    {preview
                      ? <img src={preview} alt="preview" className="w-full h-full object-cover" />
                      : <Image className="w-6 h-6 text-gray-300" />}
                  </div>
                  <div className="flex-1 space-y-2">
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-[#0a1f44] hover:text-[#0a1f44] w-full justify-center transition-colors">
                      <Upload className="w-4 h-4" /> Upload Image
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    <input type="url" value={form.image} onChange={setF('image')}
                      placeholder="Or paste image URL…" className="input-field text-sm"
                      onBlur={() => { if (form.image && !form.imageFile) setPreview(form.image); }} />
                  </div>
                </div>
              </div>

              {/* Title + Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Title *</label>
                  <input type="text" value={form.title} onChange={setF('title')} className="input-field text-sm" placeholder="Product title" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Brand</label>
                  <input type="text" value={form.brand} onChange={setF('brand')} className="input-field text-sm" />
                </div>
              </div>

              {/* Category — DB-driven dropdown */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Category *
                  </label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={e => {
                        const newCat = e.target.value;
                        setForm(p => ({ ...p, category: newCat, subCategory: '' }));
                      }}
                      className="input-field text-sm appearance-none cursor-pointer pr-9"
                      required
                    >
                      <option value="">Select category…</option>
                      {categories.map(c => (
                        <option key={c.slug} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Sub-category — shown only when selected cat has subs */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Sub-Category
                    {activeSubs.length === 0 && <span className="ml-1 font-normal text-gray-300">(none for this category)</span>}
                  </label>
                  <div className="relative">
                    <select
                      value={form.subCategory}
                      onChange={setF('subCategory')}
                      disabled={activeSubs.length === 0}
                      className="input-field text-sm appearance-none cursor-pointer pr-9 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {activeSubs.length === 0 ? 'No sub-categories' : 'Select sub-category…'}
                      </option>
                      {activeSubs.map(s => (
                        <option key={s.slug} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Price + MRP + Stock + Discount */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { k: 'price',         label: 'Price (₹) *'  },
                  { k: 'originalPrice', label: 'MRP (₹)'      },
                  { k: 'stock',         label: 'Stock *'       },
                  { k: 'discount',      label: 'Discount (%)'  },
                ].map(({ k, label }) => (
                  <div key={k}>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{label}</label>
                    <input type="number" value={form[k]} onChange={setF(k)} className="input-field text-sm" min="0" />
                  </div>
                ))}
              </div>

              {/* Part Number + Color */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Part Number</label>
                  <input type="text" value={form.partNumber} onChange={setF('partNumber')} className="input-field text-sm" placeholder="e.g. TVS-ENG-001" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Color</label>
                  <input type="text" value={form.color} onChange={setF('color')} className="input-field text-sm" placeholder="e.g. Black" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Description</label>
                <textarea rows={3} value={form.description} onChange={setF('description')} className="input-field text-sm resize-none" />
              </div>

              {/* Compatibility + Tags */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Compatible With <span className="font-normal text-gray-400">(comma-separated)</span>
                  </label>
                  <input type="text" value={form.compatibility} onChange={setF('compatibility')} className="input-field text-sm" placeholder="TVS Apache, Jupiter…" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Tags <span className="font-normal text-gray-400">(comma-separated)</span>
                  </label>
                  <input type="text" value={form.tags} onChange={setF('tags')} className="input-field text-sm" placeholder="engine, oem…" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 py-3 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 py-3 text-sm bg-[#0a1f44]">
                  {saving
                    ? <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</span>
                    : editId ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Order Card sub-component ── */
function OrderCard({ order, dealerId, onUpdate }) {
  const [tracking, setTracking] = useState(order.trackingNumber || '');
  const myItems = order.orderItems.filter(i => i.dealer?.toString() === dealerId?.toString());

  return (
    <div className="card p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-gray-500">{order.invoiceNumber}</p>
          <p className="font-bold text-gray-900 text-sm mt-0.5">{order.user?.name}</p>
          <p className="text-xs text-gray-400">{order.user?.email} · {order.user?.phone}</p>
        </div>
        <div className="text-right">
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${STATUS_BADGE[order.orderStatus] || 'bg-gray-100 text-gray-600'}`}>
            {order.orderStatus}
          </span>
          <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      <div className="space-y-2">
        {myItems.map((item, i) => (
          <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2">
            <img src={item.image || 'https://via.placeholder.com/48'} alt={item.title}
              className="w-10 h-10 rounded-lg object-cover"
              onError={e => { e.currentTarget.src = 'https://via.placeholder.com/48'; }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{item.title}</p>
              <p className="text-xs text-gray-500">Qty: {item.quantity} · ₹{item.price?.toLocaleString('en-IN')}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        {[order.shippingAddress?.street, order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.pincode]
          .filter(Boolean).join(', ')}
      </p>

      {['Placed', 'Processing', 'Packed'].includes(order.orderStatus) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {order.orderStatus === 'Placed' && (
            <button onClick={() => onUpdate(order._id, 'Processing')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e8edf5] text-[#0a1f44] rounded-xl text-xs font-bold hover:bg-[#d0daf0] transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Start Processing
            </button>
          )}
          {order.orderStatus === 'Processing' && (
            <button onClick={() => onUpdate(order._id, 'Packed')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e8edf5] text-[#0a1f44] rounded-xl text-xs font-bold hover:bg-[#d0daf0] transition-colors">
              <CheckCircle className="w-3.5 h-3.5" /> Mark as Packed
            </button>
          )}
          {order.orderStatus === 'Packed' && (
            <div className="flex items-center gap-2 flex-1">
              <input type="text" value={tracking} onChange={e => setTracking(e.target.value)}
                placeholder="Tracking number (optional)" className="input-field text-xs py-1.5 flex-1" />
              <button onClick={() => onUpdate(order._id, 'Shipped', tracking)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a1f44] text-white rounded-xl text-xs font-bold hover:bg-[#0d2657] transition-colors whitespace-nowrap">
                <Truck className="w-3.5 h-3.5" /> Ship Order
              </button>
            </div>
          )}
        </div>
      )}

      {order.trackingNumber && (
        <p className="text-xs text-gray-500">
          Tracking: <span className="font-mono font-semibold">{order.trackingNumber}</span>
        </p>
      )}
    </div>
  );
}