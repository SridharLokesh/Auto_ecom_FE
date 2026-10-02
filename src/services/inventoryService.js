import api from '../utils/api';

/* ── Inventory API client ───────────────────────────────────────────────
   GET   /api/inventory                 (dealer/admin) list + filters
   GET   /api/inventory/product/:id     (dealer/admin)
   GET   /api/inventory/dealer/:id      (dealer/admin)
   GET   /api/inventory/node/:id        (dealer/admin)
   POST  /api/inventory                 (dealer/admin)
   PUT   /api/inventory/:id             (dealer/admin) — onHand/damaged/blocked/isActive
────────────────────────────────────────────────────────────────────────── */

export const getInventory = async (params = {}) => {
  const { data } = await api.get('/inventory', { params });
  return data;
};

export const getProductInventory = async (productId) => {
  const { data } = await api.get(`/inventory/product/${productId}`);
  return data;
};

export const getDealerInventory = async (dealerId, params = {}) => {
  const { data } = await api.get(`/inventory/dealer/${dealerId}`, { params });
  return data;
};

export const getNodeInventory = async (nodeId, params = {}) => {
  const { data } = await api.get(`/inventory/node/${nodeId}`, { params });
  return data;
};

export const createInventoryItem = async (payload) => {
  const { data } = await api.post('/inventory', payload);
  return data;
};

export const updateInventoryItem = async (id, payload) => {
  const { data } = await api.put(`/inventory/${id}`, payload);
  return data;
};

export default {
  getInventory,
  getProductInventory,
  getDealerInventory,
  getNodeInventory,
  createInventoryItem,
  updateInventoryItem,
};