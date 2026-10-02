import { useState } from 'react';
import { MapPin, Zap, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { getNearbyInventory } from '../../services/fulfillmentService';

/**
 * NearbyAvailability — Phase 2 minimal customer-facing availability (§27–28).
 * Uses the browser's own geolocation as the minimal location mechanism.
 * Never shows a fabricated delivery ETA — only distance + express eligibility.
 * 
 * Enhanced to show nearby alternatives when products aren't available in service area.
 */

const getReasonLabel = (reason) => {
  const labels = {
    ELIGIBLE: 'Available',
    OUTSIDE_SERVICE_RADIUS: 'Outside service area',
    NO_AVAILABLE_STOCK: 'Out of stock',
    NO_ACTIVE_OFFER: 'Not offered here',
    INACTIVE_NODE: 'Node temporarily closed',
    INACTIVE_INVENTORY: 'Temporarily unavailable',
    NODE_NOT_IN_OFFER: 'Not in offer list',
  };
  return labels[reason] || 'Not available';
};

const getReasonColor = (reason) => {
  switch (reason) {
    case 'OUTSIDE_SERVICE_RADIUS':
      return 'bg-amber-50 border-amber-200 text-amber-700';
    case 'NO_AVAILABLE_STOCK':
      return 'bg-orange-50 border-orange-200 text-orange-700';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-700';
  }
};

export default function NearbyAvailability({ productId, quantity = 1 }) {
  const [state, setState] = useState('idle'); // idle | locating | loading | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showAlternatives, setShowAlternatives] = useState(false);

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
        {state === 'locating' ? 'Getting your location…' : 'Checking nearby sellers…'}
      </div>
    );
  }

  if (state === 'error') {
    return <p className="text-xs text-gray-400">{errorMsg}</p>;
  }

  const best = result?.candidates?.[0];
  const hasAlternatives = result?.alternatives && result.alternatives.length > 0;

  // Show eligible candidate if available
  if (best) {
    return (
      <div className="text-xs bg-green-50 border border-green-100 rounded-xl px-3 py-2 w-fit space-y-0.5">
        <p className="font-semibold text-green-700 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" /> Available from a nearby seller
        </p>
        <p className="text-gray-600">Approximately {best.distanceKm} km away</p>
        {best.expressEligible && (
          <p className="text-amber-600 font-semibold flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Express eligible
          </p>
        )}
      </div>
    );
  }

  // No eligible candidates but show alternatives if available
  if (hasAlternatives) {
    return (
      <div className="w-full max-w-sm space-y-2">
        <div className="text-xs bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 space-y-1">
          <p className="font-semibold text-blue-700 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Available nearby but not in service area
          </p>
          <p className="text-gray-600 text-xs">
            We found {result.alternatives.length} nearby {result.alternatives.length === 1 ? 'location' : 'locations'} with this product.
          </p>
        </div>

        {/* Alternatives List */}
        <div className="space-y-2">
          {showAlternatives ? (
            <>
              {result.alternatives.slice(0, 3).map((alt, idx) => (
                <div
                  key={idx}
                  className={`text-xs border rounded-lg px-2.5 py-2 space-y-1 ${getReasonColor(alt.reason)}`}>
                  <p className="font-semibold flex items-center justify-between">
                    <span>{alt.dealerName}</span>
                    <span>{alt.distanceKm} km</span>
                  </p>
                  <p className="text-xs">{alt.nodeName}</p>
                  <p className="font-medium">{getReasonLabel(alt.reason)}</p>
                  {alt.reason === 'NO_AVAILABLE_STOCK' && alt.availableQuantity > 0 && (
                    <p className="text-xs">
                      {alt.availableQuantity} in stock (exceeds delivery zone)
                    </p>
                  )}
                  {alt.reason === 'OUTSIDE_SERVICE_RADIUS' && alt.availableQuantity > 0 && (
                    <p className="text-xs">
                      {alt.availableQuantity} in stock • Standard delivery not available here
                    </p>
                  )}
                </div>
              ))}
              
              {result.alternatives.length > 3 && (
                <p className="text-xs text-gray-500 text-center py-1">
                  +{result.alternatives.length - 3} more {result.alternatives.length - 3 === 1 ? 'location' : 'locations'}
                </p>
              )}
              
              <button
                onClick={() => setShowAlternatives(false)}
                className="w-full flex items-center justify-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 py-1.5">
                <ChevronUp className="w-3.5 h-3.5" /> Hide alternatives
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAlternatives(true)}
              className="w-full flex items-center justify-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
              <ChevronDown className="w-3.5 h-3.5" /> View {result.alternatives.length} nearby {result.alternatives.length === 1 ? 'option' : 'options'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // No candidates and no alternatives
  return <p className="text-xs text-gray-500">Currently unavailable for nearby fulfillment.</p>;
}