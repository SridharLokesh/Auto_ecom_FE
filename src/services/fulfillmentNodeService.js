import api from '../utils/api';

/* ── FulfillmentNode API client ─────────────────────────────────────────
   GET  /api/fulfillment-nodes
   GET  /api/fulfillment-nodes/:id
   POST /api/fulfillment-nodes
   PUT  /api/fulfillment-nodes/:id
────────────────────────────────────────────────────────────────────────── */

export const getFulfillmentNodes = async (params = {}) => {
  const { data } = await api.get('/fulfillment-nodes', { params });
  return data;
};

export const getFulfillmentNode = async (id) => {
  const { data } = await api.get(`/fulfillment-nodes/${id}`);
  return data;
};

export const createFulfillmentNode = async (payload) => {
  const { data } = await api.post('/fulfillment-nodes', payload);
  return data;
};

export const updateFulfillmentNode = async (id, payload) => {
  const { data } = await api.put(`/fulfillment-nodes/${id}`, payload);
  return data;
};

export default {
  getFulfillmentNodes,
  getFulfillmentNode,
  createFulfillmentNode,
  updateFulfillmentNode,
};