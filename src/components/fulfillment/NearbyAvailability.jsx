import { useState } from 'react';
import { MapPin, Zap, Loader2 } from 'lucide-react';
import { getNearbyInventory } from '../../services/fulfillmentService';

/**
 * NearbyAvailability — customer-facing nearby availability.
 * Uses the browser's own geolocation as the minimal location mechanism.
 *
 * PRIVACY: shows ONLY the distance of nearby dealers from the customer.
 * No dealer name, node name, stock count, price or any other dealer detail
 * is ever rendered here.
 */

const MAX_DISTANCES_SHOWN = 3;

// 15 -> "15", 15.04 -> "15", 24.6 -> "24.6"
const formatKm = (km) => {
  const rounded = Math.round(Number(km) * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

// Extract a clean, ascending list of distances (numbers only) from API rows.
const toDistances = (rows) =>
  (Array.isArray(rows) ? rows : [])
    .map((row) => Number(row?.distanceKm))
    .filter((d) => Number.isFinite(d) && d >= 0)
    .sort((a, b) => a - b)
    .slice(0, MAX_DISTANCES_SHOWN);

export default function NearbyAvailability({ productId, quantity = 1 }) {
  const [state, setState] = useState('idle'); // idle | locating | loading | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const checkAvailability = () => {
    if (!navigator.geolocation) {
      setState('error');
      setErrorMsg('Location is not available in this browser.');
      return;
    }
    setState('locating');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setState('loading');
        try {
          const data = await getNearbyInventory({
            productId,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            quantity,
          });
          setResult(data);
          setState('done');
        } catch (err) {
          setErrorMsg(err.response?.data?.message || 'Could not check availability right now.');
          setState('error');
        }
      },
      () => {
        setErrorMsg('Location permission was denied.');
        setState('error');
      },
      { timeout: 8000 }
    );
  };

  if (state === 'idle') {
    return (
      <button
        onClick={checkAvailability}
        className="flex items-center gap-2 text-xs font-semibold text-[#0a1f44] hover:underline w-fit">
        <MapPin className="w-3.5 h-3.5" /> Check availability near you
      </button>
    );
  }

  if (state === 'locating' || state === 'loading') {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        {state === 'locating' ? 'Getting your location…' : 'Checking nearby dealers…'}
      </div>
    );
  }

  if (state === 'error') {
    return <p className="text-xs text-gray-400">{errorMsg}</p>;
  }

  // Serviceable dealers first; if none, fall back to dealers outside the
  // service area. Either way ONLY the distance is shown.
  const eligibleRows = Array.isArray(result?.candidates) ? result.candidates : [];
  const hasEligible = eligibleRows.length > 0;
  const distances = toDistances(hasEligible ? eligibleRows : result?.alternatives);
  const expressEligible = hasEligible && Boolean(eligibleRows[0]?.expressEligible);

  if (distances.length > 0) {
    return (
      <div
        className={`text-xs rounded-xl px-3 py-2 w-fit space-y-1 border ${
          hasEligible ? 'bg-green-50 border-green-100' : 'bg-blue-50 border-blue-100'
        }`}>
        {distances.map((km, idx) => (
          <p
            key={idx}
            className={`flex items-center gap-1 ${
              idx === 0
                ? hasEligible ? 'font-semibold text-green-700' : 'font-semibold text-blue-700'
                : 'text-gray-600'
            }`}>
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            Product available around {formatKm(km)} kms away
          </p>
        ))}
        {expressEligible && (
          <p className="text-amber-600 font-semibold flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Express eligible
          </p>
        )}
      </div>
    );
  }

  // No dealers found at all
  return <p className="text-xs text-gray-500">Currently unavailable for nearby fulfillment.</p>;
}