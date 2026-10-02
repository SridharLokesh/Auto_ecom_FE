import api from '../utils/api';

/* ── DealerOffer API client ─────────────────────────────────────────────
   GET  /api/dealer-offers/product/:productId
   GET  /api/dealer-offers/dealer/:dealerId
   POST /api/dealer-offers
   PUT  /api/dealer-offers/:id
────────────────────────────────────────────────────────────────────────── */

export const getOffersForProduct = async (productId) => {
  const { data } = await api.get(`/dealer-offers/product/${productId}`);
  return data;
};

export const getOffersForDealer = async (dealerId) => {
  const { data } = await api.get(`/dealer-offers/dealer/${dealerId}`);
  return data;
};

export const createDealerOffer = async (payload) => {
  const { data } = await api.post('/dealer-offers', payload);
  return data;
};

export const updateDealerOffer = async (id, payload) => {
  const { data } = await api.put(`/dealer-offers/${id}`, payload);
  return data;
};

export default {
  getOffersForProduct,
  getOffersForDealer,
  createDealerOffer,
  updateDealerOffer,
};