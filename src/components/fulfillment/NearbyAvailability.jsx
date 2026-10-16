import { useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { getNearbyInventory } from '../../services/fulfillmentService';
import LocationChooser from './LocationChooser';
import AvailabilityResult from './AvailabilityResult';
import { availabilityTone } from '../../utils/availabilityUtils';

/**
 * NearbyAvailability — customer-facing nearby availability.
 *
 * Tapping "Check availability near you" opens a card split into two halves:
 *   LEFT  — choose the location: saved addresses (radio buttons), add a
 *           new address, or use the current location
 *   RIGHT — the result for the chosen location
 *
 * The browser's location is asked ONLY if the customer taps
 * "Use my current location" — never on page load.
 *
 * PRIVACY: shows ONLY the distance of nearby dealers from the customer
 * (or "Express eligible"). No dealer name, stock, price or other detail.
 */

export default function NearbyAvailability({ productId, quantity = 1 }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState('idle'); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const requestId = useRef(0); // ignore stale responses when the selection changes quickly

  const runCheck = async (location) => {
    const myRequest = ++requestId.current;
    setLocationLabel(location.label || '');
    setState('loading');
    try {
      const payload = location.addressId
        ? { addressId: location.addressId }
        : { latitude: location.latitude, longitude: location.longitude };
      const data = await getNearbyInventory({ productId, quantity, ...payload });
      if (myRequest !== requestId.current) return;
      setResult(data);
      setState('done');
    } catch (err) {
      if (myRequest !== requestId.current) return;
      setErrorMsg(err.response?.data?.message || 'Could not check availability right now.');
      setState('error');
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-xs font-semibold text-[#0a1f44] hover:underline w-fit">
        <MapPin className="w-3.5 h-3.5" /> Check availability near you
      </button>
    );
  }

  // ── Right half: the result (shared with checkout) ─────────────────
  let resultPanel;
  let panelTone = 'bg-blue-50';

  if (state === 'idle') {
    resultPanel = (
      <p className="text-gray-500">Select an address to see how far this product is from you.</p>
    );
  } else if (state === 'loading') {
    resultPanel = (
      <p className="flex items-center gap-2 text-gray-500">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking nearby dealers…
      </p>
    );
  } else if (state === 'error') {
    resultPanel = <p className="text-gray-500">{errorMsg}</p>;
  } else {
    panelTone = availabilityTone(result) === 'green' ? 'bg-green-50' : 'bg-blue-50';
    resultPanel = <AvailabilityResult result={result} />;
  }

  return (
    <div className="grid md:grid-cols-2 w-full max-w-2xl rounded-xl border border-gray-200 overflow-hidden text-xs">
      {/* LEFT half — choose location */}
      <div className="p-3 bg-white">
        <LocationChooser
          embedded
          autoSelectDefault
          onSelect={runCheck}
          onClose={() => setOpen(false)}
        />
      </div>

      {/* RIGHT half — result */}
      <div className={`p-3 border-t md:border-t-0 md:border-l border-gray-200 ${panelTone}`}>
        <p className="font-bold text-gray-800 mb-2">Availability</p>
        {resultPanel}
        {state === 'done' && locationLabel && (
          <p className="text-[11px] text-gray-400 mt-3">Based on: {locationLabel}</p>
        )}
      </div>
    </div>
  );
}