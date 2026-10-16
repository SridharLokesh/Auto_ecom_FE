import { useEffect, useState } from 'react';
import { MapPin, Zap, Loader2, PackageCheck, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';
import { getCartFulfillmentPlan } from '../../services/fulfillmentService';
import LocationChooser from './LocationChooser';

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
  // Where availability is checked from: a saved address (default address is
  // picked automatically — no browser location prompt) or current location.
  const [loc, setLoc] = useState(null); // { addressId?, latitude?, longitude?, label }
  const [locState, setLocState] = useState('loading'); // loading | ready | needs
  const [choosing, setChoosing] = useState(false);
  const [plan, setPlan] = useState(null);
  const [planState, setPlanState] = useState('idle'); // idle | loading | done | error
  const [planError, setPlanError] = useState('');

  // A cheap signature that changes whenever quantities/items change, so
  // the plan effect below re-runs on every cart mutation (§16).
  const cartSignature = items.map((i) => `${i.product?._id}:${i.quantity}`).join('|');

  // On mount: use the customer's default saved address. No browser prompt.
  useEffect(() => {
    let cancelled = false;
    api.get('/user/profile')
      .then(({ data }) => {
        if (cancelled) return;
        const list = Array.isArray(data?.addresses) ? data.addresses : [];
        const preferred = list.find((a) => a.isDefault) || list[0];
        if (preferred) {
          setLoc({ addressId: preferred._id, label: `${preferred.label || 'Address'} — ${preferred.city || preferred.pincode || ''}`.trim() });
          setLocState('ready');
        } else {
          setLocState('needs');
        }
      })
      .catch(() => { if (!cancelled) setLocState('needs'); });
    return () => { cancelled = true; };
  }, []);

  // Recalculate whenever the location changes OR the cart changes.
  useEffect(() => {
    if (!loc) return;
    let cancelled = false;
    setPlanState('loading');
    setPlanError('');
    getCartFulfillmentPlan(loc)
      .then((data) => { if (!cancelled) { setPlan(data); setPlanState('done'); } })
      .catch((err) => {
        if (cancelled) return;
        setPlanError(err.response?.data?.message || '');
        setPlanState('error');
      });
    return () => { cancelled = true; };
  }, [loc, cartSignature]);

  const handleSelect = (selection) => { setLoc(selection); setLocState('ready'); setChoosing(false); };

  const locationBar = loc && (
    <div className="flex items-center justify-between gap-3 text-xs text-gray-500">
      <span className="flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5" /> Based on: {loc.label}
      </span>
      <button type="button" onClick={() => setChoosing(true)}
        className="font-semibold text-[#0a1f44] hover:underline whitespace-nowrap">
        Change location
      </button>
    </div>
  );

  const productName = (productId) =>
    items.find((i) => String(i.product?._id) === String(productId))?.product?.title || 'An item';

  if (locState === 'loading') {
    return (
      <div className="card p-4 mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Checking fulfillment near you…
      </div>
    );
  }

  // No saved address yet, or the customer tapped "Change location".
  if (locState === 'needs' || choosing) {
    return (
      <div className="card p-4 mb-4">
        <LocationChooser
          onSelect={handleSelect}
          onClose={loc ? () => setChoosing(false) : undefined}
        />
      </div>
    );
  }

  if (planState === 'loading' || planState === 'idle') {
    return (
      <div className="card p-4 mb-4 space-y-2">
        {locationBar}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Checking fulfillment…
        </div>
      </div>
    );
  }

  if (planState === 'error' || !plan) {
    return (
      <div className="card p-4 mb-4 space-y-2">
        {locationBar}
        <p className="text-sm text-gray-400">
          {planError || 'Could not check fulfillment availability right now.'}
        </p>
      </div>
    );
  }

  const { groups = [], unfulfilledItems = [] } = plan;

  return (
    <div className="card p-4 mb-4 space-y-3">
      {locationBar}
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