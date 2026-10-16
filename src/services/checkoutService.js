import api from '../utils/api';

/* ── Checkout API client — Phase 4 ──────────────────────────────────────
   POST /api/checkout/validate  { latitude, longitude }
   POST /api/checkout/release   { checkoutSessionId }
   POST /api/checkout/order     { checkoutSessionId, shippingAddress, paymentMethod }
──────────────────────────────────────────────────────────────────────── */

/* ── Error messages ─────────────────────────────────────────────────── */
// Maps backend error codes to plain, user-facing copy (§17). Any
// unmapped/unexpected code falls back to a generic message rather than
// showing a raw server error.
export const CHECKOUT_ERROR_MESSAGES = {
  INSUFFICIENT_STOCK: 'Some products are no longer available in the required quantity.',
  NO_NEARBY_FULFILLMENT: "We couldn't find a nearby fulfillment location for all items.",
  OUTSIDE_SERVICE_RADIUS: 'Some products cannot currently be delivered to your location.',
  NODE_NOT_IN_OFFER: 'Some products are no longer available from their seller at this location.',
  PRODUCT_UNAVAILABLE: 'One or more products are no longer available.',
  EMPTY_CART: 'Your cart is empty.',
  CHECKOUT_SESSION_EXPIRED: 'Your checkout session has expired. Please try again.',
  RESERVATION_FAILED: 'Inventory changed while you were checking out. Please review your cart and try again.',
  INVALID_LOCATION: 'We need your location to check delivery availability.',
  ADDRESS_LOCATION_UNAVAILABLE: "We couldn't locate this address. Please select a different address or use your current location.",
  ADDRESS_NOT_FOUND: 'The selected address was not found. Please select another address.',
};

export const describeCheckoutError = (code) => CHECKOUT_ERROR_MESSAGES[code] || 'Something went wrong during checkout. Please try again.';

/**
 * validateCheckout({ addressId } | { latitude, longitude })
 * → success: { success:true, checkoutSessionId, expiresAt, fulfillmentPlan, summary }
 * → failure: throws an Error with `.code` set to the backend's error code,
 *   so callers can branch on it (or just show `describeCheckoutError`).
 */
export const validateCheckout = async ({ addressId, latitude, longitude }) => {
  try {
    const body = addressId ? { addressId } : { latitude, longitude };
    const { data } = await api.post('/checkout/validate', body);
    return data;
  } catch (err) {
    const body = err.response?.data;
    const error = new Error(body?.message || describeCheckoutError(body?.code));
    error.code = body?.code || 'UNKNOWN_ERROR';
    error.unfulfilledItems = body?.unfulfilledItems;
    throw error;
  }
};

/** releaseCheckout({ checkoutSessionId }) — idempotent; safe to call more than once. */
export const releaseCheckout = async ({ checkoutSessionId }) => {
  const { data } = await api.post('/checkout/release', { checkoutSessionId });
  return data;
};

/**
 * createOrderFromCheckout({ checkoutSessionId, shippingAddress, paymentMethod })
 * → success: { order }
 * → failure: throws an Error
 */
export const createOrderFromCheckout = async ({ checkoutSessionId, shippingAddress, paymentMethod }) => {
  const { data } = await api.post('/checkout/order', {
    checkoutSessionId,
    shippingAddress,
    paymentMethod,
  });
  return data;
};

export default { validateCheckout, releaseCheckout, describeCheckoutError, CHECKOUT_ERROR_MESSAGES, createOrderFromCheckout };