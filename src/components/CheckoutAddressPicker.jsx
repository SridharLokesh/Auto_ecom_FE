import { useEffect, useState } from 'react';
import { MapPin, Navigation, Loader2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { getNearbyInventory } from '../services/fulfillmentService';
import AvailabilityResult from './fulfillment/AvailabilityResult';
import { availabilityTone } from '../utils/availabilityUtils';

/**
 * CheckoutAddressPicker — delivery address step of checkout.
 *
 * Same layout as the product details page — the card is split in half:
 *   LEFT  — exactly ONE saved address selected at a time (radio buttons),
 *           then "Add new address", then "Use my current location"
 *           (detects the place, fills the new-address form to confirm, then
 *           saves it as a normal address with exact coordinates).
 *   RIGHT — availability of every cart item for the selected address,
 *           rendered by the SAME component as the product page
 *           (AvailabilityResult), so both always read identically.
 *
 * The browser's location is asked only when the customer taps that button.
 *
 * Props:
 *   addresses, onAddressesChange(list)   — saved addresses (owned by the page)
 *   selectedAddress, onSelect(address)   — the single selected address
 *   items                                — cart items (for product names)
 */
const BLANK = { label: 'Home', street: '', city: '', state: '', pincode: '' };

// Best-effort: turn GPS coordinates into address fields. Silent on failure.
const reverseGeocode = async ({ latitude, longitude }) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${latitude}&lon=${longitude}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return null;
    const a = (await res.json())?.address || {};
    const pin = String(a.postcode || '').replace(/\s/g, '');
    return {
      street: [a.house_number, a.road || a.neighbourhood || a.suburb].filter(Boolean).join(' '),
      city: a.city || a.town || a.village || a.county || a.state_district || '',
      state: a.state || '',
      pincode: /^\d{6}$/.test(pin) ? pin : '',
    };
  } catch {
    return null;
  }
};

export default function CheckoutAddressPicker({
  addresses, onAddressesChange, selectedAddress, onSelect, items = [],
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [pendingCoords, setPendingCoords] = useState(null); // set when started from "current location"
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState('');
  const [availability, setAvailability] = useState({ state: 'idle', rows: [] }); // idle | loading | done

  const cartSignature = items.map((i) => `${i.product?._id}:${i.quantity}`).join('|');
  const selectedId = selectedAddress?._id;

  // Availability of EVERY cart item for the selected address — same API and
  // same display as the product details page. Recalculated on address/cart change.
  useEffect(() => {
    if (!selectedId) { setAvailability({ state: 'idle', rows: [] }); return; }
    let cancelled = false;
    setAvailability({ state: 'loading', rows: [] });

    const lines = items.filter((i) => i.product?._id);
    Promise.all(
      lines.map((i) =>
        getNearbyInventory({ productId: i.product._id, quantity: i.quantity, addressId: selectedId })
          .then((result) => ({ id: i.product._id, title: i.product.title || 'Item', result }))
          .catch((err) => ({
            id: i.product._id,
            title: i.product.title || 'Item',
            error: err.response?.data?.message || 'Could not check availability right now.',
          }))
      )
    ).then((rows) => {
      if (!cancelled) setAvailability({ state: 'done', rows });
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, cartSignature]);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const closeForm = () => { setAdding(false); setForm(BLANK); setPendingCoords(null); };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setNotice('Location is not available in this browser. Please add your address manually.');
      setAdding(true);
      return;
    }
    setLocating(true);
    setNotice('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        const found = await reverseGeocode(coords);
        setPendingCoords(coords);
        setForm({ ...BLANK, label: 'Other', ...(found || {}) });
        setAdding(true);
        setLocating(false);
        setNotice(found
          ? 'We detected your location. Please confirm or correct the address below, then save.'
          : 'We got your location but could not read the address. Please fill in the details below.');
      },
      () => {
        setLocating(false);
        setNotice('Location permission was denied. Please select a saved address or add a new one.');
      },
      { timeout: 8000 }
    );
  };

  const saveNewAddress = async () => {
    const street = form.street.trim();
    const city = form.city.trim();
    const state = form.state.trim();
    const pincode = form.pincode.trim();
    if (!street || !city || !pincode) { toast.error('Street, City and Pincode are required'); return; }
    if (!/^\d{6}$/.test(pincode)) { toast.error('Pincode must be exactly 6 digits'); return; }
    if (addresses.length >= 10) { toast.error('Maximum 10 addresses allowed'); return; }

    setSaving(true);
    try {
      const fresh = { label: form.label || 'Home', street, city, state, pincode };
      if (pendingCoords) Object.assign(fresh, pendingCoords); // exact GPS point for dealer matching
      const { data } = await api.put('/user/addresses', { addresses: [...addresses, fresh] });
      const saved = Array.isArray(data?.addresses) ? data.addresses : [...addresses, fresh];
      onAddressesChange(saved);
      const created = saved[saved.length - 1];
      if (created) onSelect(created); // exactly this one is now selected
      toast.success('Address added!');
      setNotice('');
      closeForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#0a1f44]';

  return (
    <div className="grid md:grid-cols-2 rounded-xl border border-gray-200 overflow-hidden">
      {/* LEFT half — choose the delivery address */}
      <div className="p-4 bg-white space-y-4">
      {/* 1 — saved addresses (one selected at a time) */}
      {addresses.length > 0 ? (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <label key={addr._id}
              className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                ${selectedId === addr._id
                  ? 'border-[#0a1f44] bg-blue-50/40'
                  : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="address"
                checked={selectedId === addr._id}
                onChange={() => onSelect(addr)}
                className="mt-1 accent-[#0a1f44]" />
              <div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                  ${addr.label === 'Home' ? 'bg-blue-100 text-[#0a1f44]' : 'bg-gray-100 text-gray-700'}`}>
                  {addr.label}
                </span>
                <p className="text-sm text-gray-700 mt-1">{addr.street}, {addr.city}</p>
                <p className="text-sm text-gray-500">{addr.state} — {addr.pincode}</p>
              </div>
            </label>
          ))}
        </div>
      ) : (
        !adding && (
          <div className="text-center py-6">
            <MapPin className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No saved addresses yet. Add one below or use your current location.</p>
          </div>
        )
      )}

      {/* 2 — add new address */}
      {adding ? (
        <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/60">
          <p className="text-sm font-bold text-gray-800">
            {pendingCoords ? 'Confirm your current location address' : 'New address'}
          </p>
          <select value={form.label} onChange={setField('label')} className={inputCls}>
            <option value="Home">Home</option>
            <option value="Work">Work</option>
            <option value="Other">Other</option>
          </select>
          <input value={form.street} onChange={setField('street')} placeholder="Street / Area *" className={inputCls} />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.city} onChange={setField('city')} placeholder="City *" className={inputCls} />
            <input value={form.state} onChange={setField('state')} placeholder="State" className={inputCls} />
          </div>
          <input value={form.pincode} onChange={setField('pincode')} placeholder="Pincode (6 digits) *"
            inputMode="numeric" maxLength={6} className={inputCls} />
          <div className="flex gap-3">
            <button type="button" onClick={saveNewAddress} disabled={saving}
              className="flex-1 py-2 rounded-lg bg-[#0a1f44] text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save &amp; use this address
            </button>
            <button type="button" onClick={closeForm} disabled={saving}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 font-semibold hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => { setNotice(''); setAdding(true); }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-[#0a1f44]/40 text-[#0a1f44] text-sm font-semibold hover:bg-blue-50/50">
          <Plus className="w-4 h-4" /> Add new address
        </button>
      )}

      {/* 3 — current location */}
      <button type="button" onClick={useCurrentLocation} disabled={locating}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60">
        {locating
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Getting your location…</>
          : <><Navigation className="w-4 h-4" /> Use my current location</>}
      </button>

      {notice && (
        <p className="text-xs text-amber-700 flex gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" />{notice}</p>
      )}
      </div>

      {/* RIGHT half — availability (same display as the product page) */}
      <div className={`p-4 border-t md:border-t-0 md:border-l border-gray-200 ${
        availability.state === 'done' && availability.rows.length > 0 &&
        availability.rows.every((r) => r.result && availabilityTone(r.result) === 'green')
          ? 'bg-green-50' : 'bg-blue-50'}`}>
        <p className="font-bold text-gray-800 text-sm mb-3">Availability</p>

        {!selectedId && (
          <p className="text-xs text-gray-500">Select an address to see how far your items are from you.</p>
        )}
        {selectedId && availability.state === 'loading' && (
          <p className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking nearby dealers…
          </p>
        )}
        {selectedId && availability.state === 'done' && (
          <div className="space-y-3 text-xs max-h-80 overflow-y-auto pr-1">
            {availability.rows.map((row) => (
              <div key={row.id}>
                <p className="font-semibold text-gray-800 mb-1 truncate">{row.title}</p>
                {row.error
                  ? <p className="text-gray-500">{row.error}</p>
                  : <AvailabilityResult result={row.result} />}
              </div>
            ))}
            {selectedAddress && (
              <p className="text-[11px] text-gray-400 pt-1">
                Based on: {selectedAddress.label || 'Address'} — {selectedAddress.city || selectedAddress.pincode}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}