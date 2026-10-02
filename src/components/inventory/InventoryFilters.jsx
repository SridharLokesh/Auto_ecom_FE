import { Search, X } from 'lucide-react';

/**
 * InventoryFilters — shared filter bar for Dealer + Admin inventory.
 *
 * Props:
 *   filters     { dealer, product, fulfillmentNode, sku, isActive }
 *   dealers[]   dealer options (admin only)
 *   products[]  product options (admin only — dealer search uses text)
 *   nodes[]     fulfillment-node options
 *   setFilter(key, value)
 *   onSearch()  trigger fetch
 */
const selectCls =
  'w-full px-3 py-2 rounded-xl border-2 border-gray-200 bg-white text-sm text-gray-900 focus:border-[#0a1f44] outline-none transition-colors';

export default function InventoryFilters({ filters = {}, dealers = [], products = [], nodes = [], setFilter, onSearch, showDealerFilter = false }) {
  return (
    <div className="card p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {showDealerFilter && (
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Dealer</label>
            <select
              value={filters.dealer || ''}
              onChange={(e) => setFilter('dealer', e.target.value)}
              className={selectCls}>
              <option value="">All Dealers</option>
              {dealers.map((d) => (
                <option key={d._id} value={d._id}>{d.businessName || d.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Product</label>
          <select
            value={filters.product || ''}
            onChange={(e) => setFilter('product', e.target.value)}
            className={selectCls}>
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>{p.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Node</label>
          <select
            value={filters.fulfillmentNode || ''}
            onChange={(e) => setFilter('fulfillmentNode', e.target.value)}
            className={selectCls}>
            <option value="">All Nodes</option>
            {nodes.map((n) => (
              <option key={n._id} value={n._id}>{n.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">SKU</label>
          <input
            type="text"
            placeholder="Search SKU…"
            value={filters.sku || ''}
            onChange={(e) => setFilter('sku', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            className={selectCls}
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Status</label>
          <select
            value={filters.isActive || ''}
            onChange={(e) => setFilter('isActive', e.target.value)}
            className={selectCls}>
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={onSearch} className="btn-primary bg-[#0a1f44] text-xs px-4 py-2">
          <Search className="w-3.5 h-3.5" /> Apply Filters
        </button>
        {(filters.dealer || filters.product || filters.fulfillmentNode || filters.sku || filters.isActive) && (
          <button
            onClick={() => {
              setFilter('dealer', '');
              setFilter('product', '');
              setFilter('fulfillmentNode', '');
              setFilter('sku', '');
              setFilter('isActive', '');
              onSearch();
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-3.5 h-3.5" /> Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}