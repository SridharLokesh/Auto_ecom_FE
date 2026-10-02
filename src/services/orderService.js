import api from '../utils/api';

/* ── Order API client — Phase 5 ─────────────────────────────────────────
   POST /api/orders/from-checkout  { checkoutSessionId, shippingAddress, paymentMethod }
──────────────────────────────────────────────────────────────────────── */

/**
 * createOrderFromCheckout({ checkoutSessionId, shippingAddress, paymentMethod })
 * → { success, message, order } — quantity/price/dealer are always
 *   derived server-side from the checkout session's reservations; this
 *   only ever sends the session id + non-financial delivery details.
 */
export const createOrderFromCheckout = async ({ checkoutSessionId, shippingAddress, paymentMethod = 'COD' }) => {
  const { data } = await api.post('/orders/from-checkout', { checkoutSessionId, shippingAddress, paymentMethod });
  return data;
};

export default { createOrderFromCheckout };