import { useEffect, useState } from 'react';
import { MapPin, Zap, Loader2, PackageCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { getCartFulfillmentPlan } from '../../services/fulfillmentService';

/**
 * CartFulfillmentPanel — Phase 3 (§14)
 *
 * Shows the cart-level fulfillment plan: which location(s) will fulfill
 * the order, and which items (if any) currently can't be fulfilled near
 * the customer. Recalculates whenever the cart contents or the customer's
 * location changes (§16) — never reuses a stale plan silently.
 *
 * Only human-readable names/counts are shown — no internal database IDs
 * (§14). The backend loads the cart itself; this component only ever
 * sends the customer's coordinates.
 */
export default function CartFulfillmentPanel({ items }) {
  const [coords, setCoords] = useState(null);
  const [locState, setLocState] = useState('idle'); // idle | locating | denied | ready
  const [plan, setPlan] = useState(null);
  const [planState, setPlanState] = useState('idle'); // idle | loading | done | error

  // A cheap signature that changes whenever quantities/items change, so
  // the plan effect below re-runs on every cart mutation (§16).
  const cartSignature = items.map((i) => `${i.product?._id}:${i.quantity}`).join('|');

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocState('denied');
      return;
    }
    setLocState('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocState('ready');
      },
      () => setLocState('denied'),
      { timeout: 8000 }
    );
  };

  useEffect(() => { requestLocation(); }, []); // ask once on mount

  // Recalculate whenever location becomes available OR the cart changes.
  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    setPlanState('loading');
    getCartFulfillmentPlan(coords)
      .then((data) => { if (!cancelled) { setPlan(data); setPlanState('done'); } })
      .catch(() => { if (!cancelled) setPlanState('error'); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, cartSignature]);

  const productName = (productId) =>
    items.find((i) => String(i.product?._id) === String(productId))?.product?.title || 'An item';

  if (locState === 'idle' || locState === 'locating') {
    return (
      <div className="card p-4 mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Checking fulfillment near you…
      </div>
    );
  }

  if (locState === 'denied') {
    return (
      <div className="card p-4 mb-4 flex items-center justify-between gap-3 text-sm">
        <span className="text-gray-500 flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Enable location to see fulfillment availability near you.
        </span>
        <button
          onClick={requestLocation}
          className="flex items-center gap-1 text-xs font-semibold text-[#0a1f44] hover:underline whitespace-nowrap">
          <RefreshCw className="w-3.5 h-3.5" /> Try again
        </button>
      </div>
    );
  }

  if (planState === 'loading' || planState === 'idle') {
    return (
      <div className="card p-4 mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Checking fulfillment…
      </div>
    );
  }

  if (planState === 'error' || !plan) {
    return (
      <div className="card p-4 mb-4 text-sm text-gray-400">
        Could not check fulfillment availability right now.
      </div>
    );
  }

  const { groups = [], unfulfilledItems = [] } = plan;

  return (
    <div className="card p-4 mb-4 space-y-3">
      {groups.length === 1 && unfulfilledItems.length === 0 && (
        <p className="text-sm font-semibold text-green-700 flex items-center gap-2">
          <PackageCheck className="w-4 h-4" /> Available near you — fulfilled from {groups[0].nodeName}
          {groups[0].expressEnabled && (
            <span className="text-amber-600 flex items-center gap-1 font-semibold">
              <Zap className="w-3.5 h-3.5" /> Express eligible
            </span>
          )}
        </p>
      )}

      {groups.length > 1 && (
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">
            Your order will be fulfilled from {groups.length} locations
          </p>
          <div className="space-y-1.5">
            {groups.map((g) => (
              <div key={g.fulfillmentNodeId} className="text-xs text-gray-600 flex items-center gap-2">
                <PackageCheck className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <span className="font-medium text-gray-800">{g.nodeName}</span>
                <span>· {g.items.length} item{g.items.length === 1 ? '' : 's'}</span>
                {g.expressEnabled && <Zap className="w-3.5 h-3.5 text-amber-500" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {groups.length === 0 && unfulfilledItems.length > 0 && (
        <p className="text-sm font-semibold text-amber-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> None of your items are currently available near your location.
        </p>
      )}

      {unfulfilledItems.length > 0 && groups.length > 0 && (
        <div className="pt-2 border-t border-amber-100">
          <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Some items are unavailable near your location:
          </p>
          <ul className="text-xs text-gray-500 list-disc list-inside space-y-0.5">
            {unfulfilledItems.map((u) => (
              <li key={u.productId}>{productName(u.productId)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}