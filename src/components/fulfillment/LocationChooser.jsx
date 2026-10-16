import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, Loader2, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

/**
 * LocationChooser — lets the customer pick WHERE to check availability from.
 *
 * Order (top → bottom):
 *   1. Saved addresses as radio buttons — selecting one applies it immediately
 *   2. "Add new address" (inline form, saved to the customer's profile)
 *   3. "Use my current location" (browser location, asked only on tap)
 *
 * Nothing is requested from the browser until the customer chooses to.
 *
 * onSelect receives either
 *   { addressId, label }                  — saved address
 *   { latitude, longitude, label }        — current location
 *
 * Props:
 *   autoSelectDefault — apply the default address as soon as addresses load
 *   embedded          — render without its own card border (used inside split layouts)
 */
const BLANK = { label: 'Home', street: '', city: '', state: '', pincode: '' };

const addressLine = (a) => [a.street, a.city].filter(Boolean).join(', ');
const addressLabel = (a) => `${a.label || 'Address'} — ${a.city || a.pincode || ''}`.trim();

export default function LocationChooser({ onSelect, onClose, autoSelectDefault = false, embedded = false }) {
  const [status, setStatus] = useState('loading'); // loading | ready | loggedOut | error
  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const autoRan = useRef(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/user/profile')
      .then(({ data }) => {
        if (cancelled) return;
        const list = Array.isArray(data?.addresses) ? data.addresses : [];
        setAddresses(list);
        const preferred = list.find((a) => a.isDefault) || list[0];
        setStatus('ready');
        if (preferred) {
          setSelectedId(preferred._id);
          if (autoSelectDefault && !autoRan.current) {
            autoRan.current = true;
            onSelect({ addressId: preferred._id, label: addressLabel(preferred) });
          }
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus(err.response?.status === 401 ? 'loggedOut' : 'error');
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chooseAddress = (addr) => {
    setSelectedId(addr._id);
    setNotice('');
    onSelect({ addressId: addr._id, label: addressLabel(addr) });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setNotice('Location is not available in this browser. Please select a saved address.');
      return;
    }
    setLocating(true);
    setNotice('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setSelectedId(null);
        onSelect({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          label: 'Your current location',
        });
      },
      () => {
        setLocating(false);
        setNotice('Location permission was denied. Please select one of your saved addresses instead.');
      },
      { timeout: 8000 }
    );
  };

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const saveNewAddress = async () => {
    const street = form.street.trim();
    const city = form.city.trim();
    const state = form.state.trim();
    const pincode = form.pincode.trim();
    if (!street || !city || !pincode) {
      toast.error('Street, City and Pincode are required');
      return;
    }
    if (!/^\d{6}$/.test(pincode)) {
      toast.error('Pincode must be exactly 6 digits');
      return;
    }
    if (addresses.length >= 10) {
      toast.error('Maximum 10 addresses allowed');
      return;
    }
    setSaving(true);
    try {
      const next = [...addresses, { label: form.label || 'Home', street, city, state, pincode }];
      const { data } = await api.put('/user/addresses', { addresses: next });
      const saved = Array.isArray(data?.addresses) ? data.addresses : next;
      setAddresses(saved);
      setAdding(false);
      setForm(BLANK);
      toast.success('Address added!');
      const created = saved[saved.length - 1];
      if (created?._id) chooseAddress(created); // check availability for it right away
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#0a1f44]';

  return (
    <div className={embedded ? 'w-full text-xs' : 'w-full max-w-sm bg-white border border-gray-200 rounded-xl p-3 text-xs shadow-sm'}>
      <div className="flex items-center justify-between mb-2">
        <p className="font-bold text-gray-800">Select delivery location</p>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close"
            className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {status === 'loading' && (
        <p className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading your addresses…
        </p>
      )}

      {status === 'loggedOut' && (
        <p className="text-gray-600">
          Please <Link to="/login" className="text-[#0a1f44] font-semibold hover:underline">log in</Link> to
          check availability near you.
        </p>
      )}

      {status === 'error' && (
        <p className="text-gray-500">Could not load your addresses right now. Please try again.</p>
      )}

      {status === 'ready' && (
        <div className="space-y-2">
          {/* 1 — saved addresses (radio buttons) */}
          {addresses.length > 0 ? (
            <div className="space-y-1.5">
              {addresses.map((a) => (
                <label key={a._id}
                  className={`flex gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                    selectedId === a._id ? 'border-[#0a1f44] bg-blue-50/40' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <input type="radio" name="availability-address" checked={selectedId === a._id}
                    onChange={() => chooseAddress(a)} className="mt-0.5 accent-[#0a1f44]" />
                  <span className="text-gray-700">
                    <span className="font-semibold">{a.label || 'Address'}</span>
                    <span className="block text-gray-500">{addressLine(a)}{a.pincode ? ` — ${a.pincode}` : ''}</span>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            !adding && (
              <p className="text-gray-500">
                You have no saved addresses yet. Add one below, or use your current location.
              </p>
            )
          )}

          {/* 2 — add new address */}
          {adding ? (
            <div className="border border-gray-200 rounded-lg p-2.5 space-y-2 bg-gray-50/60">
              <p className="font-semibold text-gray-700">New address</p>
              <select value={form.label} onChange={setField('label')} className={inputCls}>
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
              <input value={form.street} onChange={setField('street')} placeholder="Street / Area *" className={inputCls} />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.city} onChange={setField('city')} placeholder="City *" className={inputCls} />
                <input value={form.state} onChange={setField('state')} placeholder="State" className={inputCls} />
              </div>
              <input value={form.pincode} onChange={setField('pincode')} placeholder="Pincode (6 digits) *"
                inputMode="numeric" maxLength={6} className={inputCls} />
              <div className="flex gap-2">
                <button type="button" onClick={saveNewAddress} disabled={saving}
                  className="flex-1 py-1.5 rounded-lg bg-[#0a1f44] text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-1.5">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save address
                </button>
                <button type="button" onClick={() => { setAdding(false); setForm(BLANK); }} disabled={saving}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-[#0a1f44]/40 text-[#0a1f44] font-semibold hover:bg-blue-50/50">
              <Plus className="w-3.5 h-3.5" /> Add new address
            </button>
          )}

          {/* 3 — current location */}
          <button type="button" onClick={useCurrentLocation} disabled={locating}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-60">
            {locating
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Getting your location…</>
              : <><Navigation className="w-3.5 h-3.5" /> Use my current location</>}
          </button>

          {notice && (
            <p className="text-amber-700 flex gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" />{notice}</p>
          )}
        </div>
      )}
    </div>
  );
}