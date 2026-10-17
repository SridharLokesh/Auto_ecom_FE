
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  MapPin,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
  createFulfillmentNode,
  getFulfillmentNodes,
  updateFulfillmentNode,
} from '../../services/fulfillmentNodeService';

import toast from 'react-hot-toast';
import LocationMapPicker from '../../components/LocationMapPicker';
import api from '../../utils/api';

/**
 * Admin Fulfillment Nodes — view and manage the physical node network.
 * Admin has full CRUD. Dealers manage only their own nodes via /dealer.
 */

const NODE_TYPES = [
  'DEALER',
  'DARK_STORE',
  'WAREHOUSE',
  'REGIONAL_HUB',
  'PARTNER_STORE',
];

const EMPTY_NODE = {
  name: '',
  type: 'DEALER',
  dealer: '',
  address: {
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  },
  expressEnabled: false,
  serviceRadiusKm: 15,
  isActive: true,
  coordinates: '',
};

const inputCls =
  'w-full px-3 py-2 rounded-xl border-2 border-gray-200 bg-white text-sm text-gray-900 focus:border-[#0a1f44] outline-none transition-colors';

const labelCls =
  'text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block';

const fmtCoord = (loc) => {
  if (!loc?.coordinates || !Array.isArray(loc.coordinates)) {
    return '—';
  }

  return loc.coordinates
    .map((coordinate) => Number(coordinate).toFixed(5))
    .join(', ');
};

export default function AdminFulfillmentNodes() {
  const [nodes, setNodes] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_NODE);

  const fetchNodes = useCallback(
    async (pg = page, q = search) => {
      setLoading(true);

      try {
        const params = { page: pg, limit: 20 };

        if (q) params.search = q;

        const data = await getFulfillmentNodes(params);

        setNodes(data.nodes || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      } catch (err) {
        toast.error(
          err.response?.data?.message || 'Failed to load nodes'
        );
      } finally {
        setLoading(false);
      }
    },
    [page, search]
  );

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  useEffect(() => {
    api
      .get('/dealer/all')
      .then((response) =>
        setDealers(response.data?.dealers || response.data || [])
      )
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setForm({
      ...EMPTY_NODE,
      address: { ...EMPTY_NODE.address },
    });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (node) => {
    setForm({
      name: node.name || '',
      type: node.type || 'DEALER',
      dealer: node.dealer?._id || node.dealer || '',
      address: {
        ...EMPTY_NODE.address,
        ...(node.address || {}),
      },
      expressEnabled: node.expressEnabled || false,
      serviceRadiusKm: node.serviceRadiusKm ?? 15,
      isActive: node.isActive !== false,
      coordinates: Array.isArray(node.location?.coordinates)
        ? node.location.coordinates.join(', ')
        : '',
    });

    setEditId(node._id);
    setShowForm(true);
  };

  const setAddr = (key) => (event) => {
    setForm((current) => ({
      ...current,
      address: {
        ...current.address,
        [key]: event.target.value,
      },
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Node name is required');
      return;
    }

    setSaving(true);

    try {
      const coordsRaw = form.coordinates.trim();
      let location;

      if (coordsRaw) {
        const parts = coordsRaw
          .split(',')
          .map((value) => Number(value.trim()));

        if (
          parts.length !== 2 ||
          parts.some((number) => !Number.isFinite(number)) ||
          parts[0] < -180 ||
          parts[0] > 180 ||
          parts[1] < -90 ||
          parts[1] > 90
        ) {
          toast.error(
            'Enter valid coordinates in longitude, latitude order.'
          );
          return;
        }

        // Preserve the existing backend GeoJSON format:
        // [longitude, latitude]
        location = {
          type: 'Point',
          coordinates: parts,
        };
      }

      const payload = {
        name: form.name.trim(),
        type: form.type,
        dealer: form.dealer || null,
        address: form.address,
        expressEnabled: form.expressEnabled,
        serviceRadiusKm: Number(form.serviceRadiusKm),
        isActive: form.isActive,
        location,
      };

      if (editId) {
        await updateFulfillmentNode(editId, payload);
        toast.success('Node updated');
      } else {
        await createFulfillmentNode(payload);
        toast.success('Node created');
      }

      setShowForm(false);
      fetchNodes(page, '');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {total} nodes · page {page} of {pages}
        </p>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

            <input
              type="text"
              placeholder="Search node name…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  setPage(1);
                  fetchNodes(1, event.target.value);
                }
              }}
              className={`${inputCls} pl-9 sm:w-56`}
            />
          </div>

          <button
            onClick={openCreate}
            className="btn-primary bg-[#0a1f44] text-sm px-4 py-2.5 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Node
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs text-gray-500 uppercase">
                <th className="text-left px-4 py-3">Node Name</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Dealer</th>
                <th className="text-left px-4 py-3">City</th>
                <th className="text-left px-4 py-3">State</th>
                <th className="text-left px-4 py-3">Pincode</th>
                <th className="text-left px-4 py-3">Coordinates</th>
                <th className="text-center px-4 py-3">Express</th>
                <th className="text-right px-4 py-3">Radius</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                [...Array(5)].map((_, index) => (
                  <tr key={index}>
                    <td colSpan={11}>
                      <div className="h-10 bg-gray-100 rounded-lg animate-pulse m-2" />
                    </td>
                  </tr>
                ))
              ) : nodes.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="text-center py-14 text-gray-400"
                  >
                    <MapPin className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    No fulfillment nodes found.
                  </td>
                </tr>
              ) : (
                nodes.map((node) => (
                  <tr
                    key={node._id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {node.name}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          node.type === 'DEALER'
                            ? 'bg-[#e8eef7] text-[#0a1f44]'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {node.type}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {node.dealer?.businessName ||
                        node.dealer?.name ||
                        '—'}
                    </td>

                    <td className="px-4 py-3">
                      {node.address?.city || '—'}
                    </td>

                    <td className="px-4 py-3">
                      {node.address?.state || '—'}
                    </td>

                    <td className="px-4 py-3">
                      {node.address?.pincode || '—'}
                    </td>

                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {fmtCoord(node.location)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {node.expressEnabled ? '⚡' : '—'}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {node.serviceRadiusKm} km
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          node.isActive !== false
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {node.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(node)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-[#0a1f44] hover:bg-[#e8eef7] transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-sm text-gray-500 font-semibold">
            Page {page} of {pages} · {total} nodes
          </span>

          <button
            onClick={() => setPage(Math.min(pages, page + 1))}
            disabled={page >= pages}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Node form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-black text-gray-900">
                  {editId
                    ? 'Edit Fulfillment Node'
                    : 'Add Fulfillment Node'}
                </h3>

                <p className="text-xs text-gray-500 mt-0.5">
                  Select the location on the map to fill in its coordinates automatically.
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="Close form"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Node Name *</label>

                <input
                  className={inputCls}
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="e.g. Chennai Dealer Warehouse"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Node Type</label>

                  <select
                    className={inputCls}
                    value={form.type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        type: event.target.value,
                      }))
                    }
                  >
                    {NODE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Dealer</label>

                  <select
                    className={inputCls}
                    value={form.dealer}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        dealer: event.target.value,
                      }))
                    }
                  >
                    <option value="">— Platform owned —</option>

                    {dealers.map((dealer) => (
                      <option key={dealer._id} value={dealer._id}>
                        {dealer.businessName || dealer.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Street</label>

                  <input
                    className={inputCls}
                    value={form.address.street}
                    onChange={setAddr('street')}
                  />
                </div>

                <div>
                  <label className={labelCls}>City</label>

                  <input
                    className={inputCls}
                    value={form.address.city}
                    onChange={setAddr('city')}
                  />
                </div>

                <div>
                  <label className={labelCls}>State</label>

                  <input
                    className={inputCls}
                    value={form.address.state}
                    onChange={setAddr('state')}
                  />
                </div>

                <div>
                  <label className={labelCls}>Pincode</label>

                  <input
                    className={inputCls}
                    value={form.address.pincode}
                    onChange={setAddr('pincode')}
                  />
                </div>
              </div>

              {/* Map location selector */}
              <div>
                <label className={labelCls}>
                  Dealer Location
                </label>

                <LocationMapPicker
                  value={form.coordinates}
                  onChange={(coordinates) =>
                    setForm((current) => ({
                      ...current,
                      coordinates,
                    }))
                  }
                />
              </div>

              {/* Keep manual entry available as a fallback */}
              <div>
                <label className={labelCls}>
                  Coordinates (longitude, latitude)
                </label>

                <input
                  className={inputCls}
                  value={form.coordinates}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      coordinates: event.target.value,
                    }))
                  }
                  placeholder="Select a map location or enter coordinates"
                />

                <p className="mt-1 text-xs text-gray-400">
                  Selecting a location on the map fills this field automatically.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>
                    Service Radius (km)
                  </label>

                  <input
                    type="number"
                    min="0"
                    className={inputCls}
                    value={form.serviceRadiusKm}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        serviceRadiusKm: event.target.value,
                      }))
                    }
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700 font-semibold pt-6">
                  <input
                    type="checkbox"
                    checked={form.expressEnabled}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        expressEnabled: event.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-[#0a1f44]"
                  />
                  Express enabled
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-700 font-semibold pt-6">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-[#0a1f44]"
                  />
                  Active
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 btn-secondary text-sm py-2.5"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 btn-primary bg-[#0a1f44] text-sm py-2.5 disabled:opacity-60"
              >
                {saving
                  ? 'Saving…'
                  : editId
                    ? 'Save Changes'
                    : 'Create Node'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
