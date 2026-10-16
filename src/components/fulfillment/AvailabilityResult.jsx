import { MapPin, Zap } from 'lucide-react';
import { formatKm, summarizeAvailability } from '../../utils/availabilityUtils';

/**
 * AvailabilityResult — the ONE place that decides how a nearby-inventory
 * API response is shown to a customer. Used by the product details page
 * AND checkout, so both always read exactly the same.
 *
 *   Express available  → "Express eligible"
 *   otherwise          → "Product available around N kms away" (nearest first)
 *   no dealer found    → "Currently unavailable for nearby fulfillment."
 *
 * PRIVACY: distances only — no dealer name, stock, price or other detail.
 */
export default function AvailabilityResult({ result }) {
  const { hasEligible, distances, express } = summarizeAvailability(result);

  if (express) {
    return (
      <p className="text-amber-600 font-semibold flex items-center gap-1 text-sm">
        <Zap className="w-4 h-4" /> Express eligible
      </p>
    );
  }

  if (distances.length > 0) {
    return (
      <div className="space-y-1.5">
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
      </div>
    );
  }

  return <p className="text-gray-500">Currently unavailable for nearby fulfillment.</p>;
}