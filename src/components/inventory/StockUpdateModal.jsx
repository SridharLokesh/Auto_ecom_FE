import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * StockUpdateModal — edit onHand / damaged / blocked for one inventory row.
 * Reused by Dealer + Admin screens. `reserved` is intentionally read-only
 * (reservation arrives in Phase 2).
 */
export default function StockUpdateModal({ item, saving, onSave, onClose }) {
  const [form, setForm] = useState({ onHand: 0, damaged: 0, blocked: 0 });

  useEffect(() => {
    if (item) setForm({
      onHand: Number(item.onHand || 0),
      damaged: Number(item.damaged || 0),
      blocked: Number(item.blocked || 0),
    });
  }, [item]);

  if (!item) return null;

  const product = item.product || {};
  const node = item.fulfillmentNode || {};
  const set = (k) => (e) => {
    const raw = e.target.value;
    setForm((f) => ({ ...f, [k]: raw === '' ? '' : Math.max(0, Math.floor(Number(raw) || 0)) }));
  };

  const available = Math.max(0, (Number(form.onHand) || 0) - (Number(form.damaged) || 0) - (Number(form.blocked) || 0));

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm text-gray-900 focus:border-[#0a1f44] outline-none transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h3 className="font-black text-gray-900 truncate">Edit Stock</h3>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
              {product.title || '—'} · {node.name || '—'} · <span className="font-mono">{item.sku}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current state */}
        <div className="grid grid-cols-4 gap-2 mb-5 text-center">
          {[
            { k: 'On Hand', v: item.onHand, c: 'text-gray-700' },
            { k: 'Reserved', v: item.reserved, c: 'text-gray-500' },
            { k: 'Damaged', v: item.damaged, c: 'text-red-500' },
            { k: 'Blocked', v: item.blocked, c: 'text-amber-500' },
          ].map(({ k, v, c }) => (
            <div key={k} className="bg-gray-50 rounded-xl py-2">
              <p className="text-[10px] uppercase font-bold text-gray-400">{k}</p>
              <p className={`text-sm font-black ${c}`}>{Number(v || 0).toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">On Hand</label>
            <input type="number" min="0" value={form.onHand} onChange={set('onHand')} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Damaged</label>
            <input type="number" min="0" value={form.damaged} onChange={set('damaged')} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Blocked</label>
            <input type="number" min="0" value={form.blocked} onChange={set('blocked')} className={inputCls} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between bg-[#e8eef7] rounded-xl px-4 py-3">
          <span className="text-xs font-bold text-gray-600 uppercase">Available after update</span>
          <span className={`font-black text-lg ${available > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {available.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 btn-secondary text-sm py-2.5">Cancel</button>
          <button
            onClick={() => onSave(form)}
            disabled={saving}
            className="flex-1 btn-primary bg-[#0a1f44] text-sm py-2.5">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}