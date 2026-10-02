import { useState, useEffect, useCallback } from 'react';
import { Boxes, ChevronLeft, ChevronRight, IndianRupee, AlertTriangle, Ban } from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import { getFulfillmentNodes } from '../../services/fulfillmentNodeService';
import InventoryTable from '../../components/inventory/InventoryTable';
import InventoryFilters from '../../components/inventory/InventoryFilters';
import StockUpdateModal from '../../components/inventory/StockUpdateModal';
import api from '../../utils/api';
import toast from 'react-hot-toast';

/**
 * Dealer Inventory — the "My Inventory" tab of the Dealer Dashboard.
 * Dealers see and manage ONLY their own inventory (backend-enforced).
 */
export default function DealerInventory({ user }) {
  const {
    inventory, total, page, pages, summary, loading, saving,
    filters, setFilter, setPage, fetchInventory, updateStock,
  } = useInventory({ scope: 'my' });

  const [nodes, setNodes] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    getFulfillmentNodes({ limit: 100 })
      .then((d) => setNodes(d.nodes || []))
      .catch(() => {});
    api.get(`/products?dealer=${user._id}&limit=100`)
      .then((d) => setMyProducts(d.data.products || []))
      .catch(() => {});
  }, [user._id]);

  const handleSave = useCallback(async (form) => {
    if (!editItem) return;
    const res = await updateStock(editItem._id, {
      onHand: Number(form.onHand),
      damaged: Number(form.damaged),
      blocked: Number(form.blocked),
    });
    if (res.ok) setEditItem(null);
  }, [editItem, updateStock]);

  const handleToggle = useCallback(async (item) => {
    const res = await updateStock(item._id, { isActive: item.isActive === false });
    if (!res.ok) toast.error('Could not update status');
  }, [updateStock]);

  const summaryCards = [
    { label: 'Total SKUs', value: summary?.totalSkus ?? 0, icon: Boxes, color: 'bg-[#0a1f44]' },
    { label: 'Total Units', value: summary?.totalUnits ?? 0, icon: Boxes, color: 'bg-[#0a1f44]' },
    { label: 'Available Units', value: summary?.availableUnits ?? 0, icon: IndianRupee, color: 'bg-[#0a1f44]' },
    { label: 'Damaged', value: summary?.damagedUnits ?? 0, icon: AlertTriangle, color: 'bg-[#0a1f44]' },
    { label: 'Blocked', value: summary?.blockedUnits ?? 0, icon: Ban, color: 'bg-[#0a1f44]' },
  ];

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {summaryCards.map(({ label, value, icon: Icon, color }) => (  // eslint-disable-line no-unused-vars
          <div key={label} className="card p-4">
            <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center mb-2`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-lg font-black text-gray-900">{Number(value).toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-gray-500 font-semibold">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters (toggle) */}
      <div>
        <button
          onClick={() => setShowFilters((s) => !s)}
          className="text-xs font-bold text-[#0a1f44] bg-[#e8eef7] rounded-xl px-4 py-2 hover:bg-[#d5e2f7] transition-colors">
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {showFilters && (
        <InventoryFilters
          filters={filters}
          products={myProducts}
          nodes={nodes}
          setFilter={setFilter}
          onSearch={fetchInventory}
        />
      )}

      {/* Table */}
      <InventoryTable
        inventory={inventory}
        loading={loading}
        showDealer={false}
        onEdit={setEditItem}
        onToggle={handleToggle}
        emptyTitle="No inventory yet"
        emptyHint="Inventory rows are created automatically from your products. Add a product first, or run the inventory migration."
      />

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-500 font-semibold">
            Page {page} of {pages} · {total} rows
          </span>
          <button
            onClick={() => setPage(Math.min(pages, page + 1))}
            disabled={page >= pages}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {editItem && (
        <StockUpdateModal
          item={editItem}
          saving={saving}
          onSave={handleSave}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  );
}