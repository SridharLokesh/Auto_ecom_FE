import api from '../utils/api';

/* ── Fulfillment API client — Phase 2/3 ────────────────────────────────
   Read-only discovery/planning. Never reserves or deducts stock.
   GET  /api/fulfillment/nearby-inventory
   POST /api/fulfillment/select
   POST /api/fulfillment/cart-plan
──────────────────────────────────────────────────────────────────────── */

// Location = a saved `addressId` OR explicit `latitude` + `longitude`.
export const getNearbyInventory = async ({ productId, addressId, latitude, longitude, quantity = 1 }) => {
  const { data } = await api.get('/fulfillment/nearby-inventory', {
    params: { productId, addressId, latitude, longitude, quantity },
  });
  return data;
};

export const selectFulfillment = async ({ productId, quantity = 1, customerLocation, fulfillmentMode = 'STANDARD' }) => {
  const { data } = await api.post('/fulfillment/select', {
    productId, quantity, customerLocation, fulfillmentMode,
  });
  return data;
};

/**
 * getCartFulfillmentPlan({ addressId } | { latitude, longitude })
 * Phase 3: the backend loads YOUR actual cart from the database — it
 * never trusts item/price/dealer info from the client. Only your
 * location needs to be sent.
 * → { isFulfillable, groups: [...], unfulfilledItems: [...], generatedAt }
 */
export const getCartFulfillmentPlan = async ({ addressId, latitude, longitude }) => {
  const body = addressId ? { addressId } : { latitude, longitude };
  const { data } = await api.post('/fulfillment/cart-plan', body);
  return data;
};

export default { getNearbyInventory, selectFulfillment, getCartFulfillmentPlan };