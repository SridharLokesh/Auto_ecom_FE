import { Package } from 'lucide-react';

/**
 * InventoryTable — shared table for Dealer + Admin inventory screens.
 *
 * Props:
 *   inventory[]    row list (already includes `available` from the API)
 *   loading        boolean → skeletons
 *   showDealer     show the Dealer column (admin view)
 *   showActions    row action buttons (edit / toggle) — hide for read-only
 *   onEdit(item)   open the stock-update modal
 *   onToggle(item) activate / deactivate row
 */
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

export default function InventoryTable({
  inventory = [],
  loading = false,
  showDealer = false,
  showActions = true,
  onEdit,
  onToggle,
  emptyTitle = 'No inventory found',
  emptyHint = 'No inventory rows match the current filters.',
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!inventory.length) {
    return (
      <div className="text-center py-16 card">
        <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 font-semibold">{emptyTitle}</p>
        <p className="text-sm text-gray-400 mt-1">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-xs text-gray-500 uppercase">
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-left px-4 py-3">SKU</th>
              <th className="text-right px-4 py-3">On Hand</th>
              <th className="text-right px-4 py-3">Reserved</th>
              <th className="text-right px-4 py-3">Damaged</th>
              <th className="text-right px-4 py-3">Blocked</th>
              <th className="text-right px-4 py-3">Available</th>
              <th className="text-left px-4 py-3">Node</th>
              {showDealer && <th className="text-left px-4 py-3">Dealer</th>}
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Last Updated</th>
              {showActions && <th className="text-left px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => {
              const available = Number(item.available ?? 0);
              const product = item.product || {};
              const node = item.fulfillmentNode || {};
              const dealer = item.dealer || {};
              const active = item.isActive !== false;
              const low = available > 0 && available <= 5;

              return (
                <tr key={item._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 max-w-[220px]">
                      {product.image && (
                        <img
                          src={product.image}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{product.title || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="font-mono text-xs text-gray-500">{item.sku || '—'}</span></td>
                  <td className="px-4 py-3 text-right font-semibold">{fmt(item.onHand)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{fmt(item.reserved)}</td>
                  <td className="px-4 py-3 text-right text-red-500">{fmt(item.damaged)}</td>
                  <td className="px-4 py-3 text-right text-amber-500">{fmt(item.blocked)}</td>
                  <td className={`px-4 py-3 text-right font-black ${available <= 0 ? 'text-red-500' : low ? 'text-amber-500' : 'text-green-600'}`}>
                    {fmt(available)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700 truncate max-w-[140px]">{node.name || '—'}</p>
                    <p className="text-xs text-gray-400">{node.address?.city || ''}</p>
                  </td>
                  {showDealer && (
                    <td className="px-4 py-3">
                      <p className="text-gray-700 truncate max-w-[140px]">{dealer.businessName || dealer.name || '—'}</p>
                      <p className="text-xs text-gray-400">{dealer.dealerId || ''}</p>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {item.lastUpdatedAt ? new Date(item.lastUpdatedAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                  {showActions && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit(item)}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-[#0a1f44] hover:bg-[#e8eef7] transition-colors">
                          Edit Stock
                        </button>
                        <button
                          onClick={() => onToggle(item)}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors">
                          {active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}