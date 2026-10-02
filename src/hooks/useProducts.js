import { useState, useCallback } from "react";
import api from "../utils/api";

export const useProducts = () => {
  const [products,      setProducts]      = useState([]);
  const [product,       setProduct]       = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [pagination,    setPagination]    = useState({ total: 0, page: 1, pages: 1 });

  // fetchProducts — stable reference ([] deps).
  // Cleans out undefined/null/empty values so they never reach the query string.
  // Backend buildQuery accepts: category, search, sort, page, limit
  const fetchProducts = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const clean = {};
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== "") clean[k] = v;
      }
      const qs = new URLSearchParams(clean).toString();
      const { data } = await api.get(`/products${qs ? `?${qs}` : ""}`);
      setProducts(data.products || []);
      setPagination({
        total: data.total ?? 0,
        page:  data.page  ?? 1,
        pages: data.pages ?? 1,
      });
    } catch (err) {
      console.error("fetchProducts error:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // fetchProduct — single product by id
  const fetchProduct = useCallback(async (id) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/products/${id}`);
      setProduct(data);
      return data;
    } catch (err) {
      console.error("fetchProduct error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // searchProducts — navbar live search, uses /products/search?q=
  const searchProducts = useCallback(async (query) => {
    if (!query || query.trim().length < 1) { setSearchResults([]); return; }
    try {
      const { data } = await api.get(
        `/products/search?q=${encodeURIComponent(query.trim())}`
      );
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      setSearchResults([]);
    }
  }, []);

  const clearSearch = useCallback(() => setSearchResults([]), []);

  return {
    products,
    product,
    loading,
    searchResults,
    pagination,
    fetchProducts,
    fetchProduct,
    searchProducts,
    clearSearch,
  };
};