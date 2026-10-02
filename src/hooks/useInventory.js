import { useCallback, useEffect, useState } from 'react';
import { getInventory, updateInventoryItem } from '../services/inventoryService';
import toast from 'react-hot-toast';

/**
 * useInventory — shared data hook for the Dealer + Admin inventory screens.
 *
 * @param {Object}  opts
 * @param {string}  opts.scope   'my' | 'all' (dealer → own, admin → all)
 * @param {boolean} opts.active  auto-fetch on mount
 *
 * Returns inventory list, pagination, summary cards, filters, loading,
 * and an `updateStock` mutation used by the StockUpdateModal.
 */
export function useInventory({ scope = 'all', active = true } = {}) {
  const [inventory, setInventory] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // `enabled` gates auto-fetching on filter/page changes. Starts equal to
  // `active`, but flips true the first time `activate()` is called — this
  // lets screens that pass `active: false` (e.g. a tab that shouldn't fetch
  // until it's actually opened) still auto-refetch on every subsequent
  // filter or pagination change once they've kicked things off.
  const [enabled, setEnabled] = useState(active);
  const activate = useCallback(() => setEnabled(true), []);

  const [filters, setFilters] = useState({
    dealer: '',
    product: '',
    fulfillmentNode: '',
    sku: '',
    isActive: '',
    limit: 20,
  });

  const setFilter = useCallback((key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }, []);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: filters.limit || 20,
      };
      if (filters.dealer)        params.dealer = filters.dealer;
      if (filters.product)       params.product = filters.product;
      if (filters.fulfillmentNode) params.fulfillmentNode = filters.fulfillmentNode;
      if (filters.sku)           params.sku = filters.sku;
      if (filters.isActive)      params.isActive = filters.isActive;

      const data =
        scope === 'my' && filters.dealer
          ? await getInventory(params) // backend hard-scopes to the dealer anyway
          : await getInventory(params);

      setInventory(data.inventory || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setSummary(data.summary || null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [scope, page, filters]);

  useEffect(() => {
    if (enabled) fetchInventory();
  }, [fetchInventory, enabled]);

  const resetFilters = useCallback(() => {
    setFilters((f) => ({
      dealer: '',
      product: '',
      fulfillmentNode: '',
      sku: '',
      isActive: '',
      limit: f.limit || 20,
    }));
    setPage(1);
  }, []);

  const updateStock = useCallback(
    async (id, payload) => {
      setSaving(true);
      try {
        await updateInventoryItem(id, payload);
        toast.success('Inventory updated');
        await fetchInventory();
        return { ok: true };
      } catch (err) {
        toast.error(err.response?.data?.message || 'Update failed');
        return { ok: false, error: err.response?.data?.message };
      } finally {
        setSaving(false);
      }
    },
    [fetchInventory]
  );

  return {
    inventory,
    total,
    page,
    pages,
    summary,
    loading,
    saving,
    filters,
    setFilter,
    resetFilters,
    setPage,
    fetchInventory,
    updateStock,
    activate,
  };
}

export default useInventory;