/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  User, Lock, MapPin, Plus, Edit2, Trash2, Eye, EyeOff,
  ShoppingBag, Package, RotateCcw, MapPinned, ChevronDown,
  ChevronRight, ArrowLeft, Truck, CheckCircle, Clock, XCircle,
  Star, X, Check, AlertCircle, RefreshCcw, Info, FileText,
  Search, Download, ChevronUp,
} from "lucide-react";
import api from "../utils/api";
import toast from "react-hot-toast";
import { generateInvoice } from "../utils/generateInvoice"; // ← NEW

/* ─── Input ─────────────────────────────────────────────────────── */
function Input({ label, value, onChange, type = "text", placeholder, readOnly }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`input-field ${readOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
      />
    </div>
  );
}

/* ─── Star Picker ────────────────────────────────────────────────── */
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button"
            onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(n)}
            className="transition-transform hover:scale-110 focus:outline-none">
            <Star className="w-9 h-9 transition-colors"
              style={{
                fill: (hovered || value) >= n ? "#de1c0e" : "transparent",
                color: (hovered || value) >= n ? "#de1c0e" : "#d1d5db",
                strokeWidth: 1.5,
              }} />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 h-6">
        {value > 0 && (
          <>
            <span className="text-xl font-black text-gray-900">{value} / 5</span>
            <span className="text-sm font-bold" style={{ color: "#de1c0e" }}>— {labels[value]}</span>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Star Display ───────────────────────────────────────────────── */
function StarDisplay({ value = 0 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className="w-4 h-4"
          style={{
            fill: value >= n ? "#de1c0e" : "transparent",
            color: value >= n ? "#de1c0e" : "#d1d5db",
            strokeWidth: 1.5,
          }} />
      ))}
    </div>
  );
}

/* ─── Review Modal ───────────────────────────────────────────────── */
function ReviewModal({ productId, productTitle, onClose, onSuccess, isEdit = false, existingRating = 0, existingComment = "" }) {
  const [rating, setRating] = useState(isEdit ? existingRating : 0);
  const [comment, setComment] = useState(isEdit ? existingComment : "");
  const [submitting, setSubmitting] = useState(false);
  const [ratingErr, setRatingErr] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setRatingErr(true); return; }
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/products/${productId}/reviews`, { rating, comment });
        toast.success("Review updated successfully!");
      } else {
        await api.post(`/products/${productId}/reviews`, { rating, comment });
        toast.success("Review submitted successfully!");
      }
      onSuccess(productId);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save review";
      if (msg.toLowerCase().includes("already reviewed") || msg.toLowerCase().includes("already rated")) {
        toast.success("Your review for this product is already saved.");
        onSuccess(productId);
        onClose();
        return;
      }
      toast.error(msg);
    } finally { setSubmitting(false); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up"
        style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10" style={{ background: "#0a1f44" }}>
          <div>
            <h3 className="font-black text-white text-base">{isEdit ? "Edit Your Review" : "Rate & Review"}</h3>
            <p className="text-blue-200 text-xs mt-0.5 max-w-xs truncate">{productTitle}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Your Rating <span style={{ color: "#de1c0e" }}>*</span>
            </label>
            <StarPicker value={rating} onChange={(v) => { setRating(v); setRatingErr(false); }} />
            {ratingErr && (
              <p className="text-xs mt-2 flex items-center gap-1 justify-center" style={{ color: "#de1c0e" }}>
                <AlertCircle className="w-3.5 h-3.5" /> Please select a rating
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Your Review <span className="font-normal text-gray-400">(optional but helpful)</span>
            </label>
            <textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              placeholder="Describe quality, fitment, installation experience and your vehicle model..."
              className="input-field text-sm resize-none leading-relaxed" />
            <p className="text-xs text-gray-400 text-right mt-1">{comment.length} / 1000</p>
          </div>
          <div className="rounded-xl p-3 text-xs space-y-1" style={{ background: "#e8f0fe", color: "#0a1f44" }}>
            <p className="font-bold mb-1">Helpful review tips:</p>
            <p>• Mention your vehicle model (e.g. TVS Apache 160)</p>
            <p>• Describe fitment, quality and installation ease</p>
            <p>• Keep it honest and constructive</p>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-3 text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3 text-sm">
              {submitting ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  <Check className="w-4 h-4" /> {isEdit ? "Update Review" : "Submit Review"}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Return Modal ───────────────────────────────────────────────── */
const RETURN_REASONS = [
  "Received wrong item",
  "Item damaged or defective",
  "Item not as described",
  "Wrong size or fitment",
  "Changed my mind",
  "Better price available elsewhere",
  "Other",
];

function ReturnModal({ order, onClose, onSuccess }) {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const deliveryDate = new Date(order.deliveredAt || order.updatedAt);
  const daysSince = Math.floor((Date.now() - deliveryDate) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, 7 - daysSince);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalReason = reason === "Other" ? customReason.trim() : reason;
    if (!finalReason) { toast.error("Please select or enter a return reason"); return; }
    setSubmitting(true);
    try {
      await api.put(`/orders/${order._id}/return`, { reason: finalReason });
      toast.success("Return request submitted! We will process it within 3–5 business days.");
      onSuccess(order._id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit return request");
    } finally { setSubmitting(false); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ background: "#0a1f44" }}>
          <div>
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Request a Return
            </h3>
            <p className="text-blue-200 text-xs mt-0.5">
              Order #{order._id?.slice(-8).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div
            className="flex items-start gap-2 rounded-xl p-3 text-xs"
            style={{
              background: daysRemaining <= 2 ? "#fff0ef" : "#e8f0fe",
              color: daysRemaining <= 2 ? "#de1c0e" : "#0a1f44",
            }}
          >
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {daysRemaining === 0
                  ? "Return window expires today!"
                  : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left in return window`}
              </p>
              <p className="mt-0.5 font-normal opacity-80">
                Returns accepted within 7 days of delivery. Delivered on{" "}
                {deliveryDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Items in this return</label>
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {order.orderItems?.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                  {item.image && (
                    <img src={item.image} alt={item.title}
                      className="w-10 h-10 object-cover rounded-lg bg-gray-100 flex-shrink-0"
                      onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{item.title}</p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Reason for return <span style={{ color: "#de1c0e" }}>*</span>
            </label>
            <div className="space-y-2">
              {RETURN_REASONS.map((r) => (
                <label key={r}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                    ${reason === r ? "border-[#0a1f44]" : "border-gray-200 hover:border-gray-300"}`}
                  style={reason === r ? { background: "#e8f0fe" } : {}}>
                  <input type="radio" name="reason" value={r} checked={reason === r}
                    onChange={() => setReason(r)} className="accent-[#0a1f44]" />
                  <span className="text-sm text-gray-700">{r}</span>
                </label>
              ))}
            </div>
            {reason === "Other" && (
              <textarea rows={2} value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                maxLength={300} placeholder="Please describe your reason..."
                className="input-field text-sm resize-none mt-3" />
            )}
          </div>

          <p className="text-xs text-gray-400">
            Once approved, a pickup will be arranged within 2–3 business days. Refund processed within 5–7 business days after pickup.
          </p>
        </div>

        <div className="flex gap-3 px-6 py-4 flex-shrink-0 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 py-3 text-sm">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary flex-1 py-3 text-sm"
          >
            {submitting ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              <span className="flex items-center gap-2 justify-center">
                <RefreshCcw className="w-4 h-4" /> Submit Return Request
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Invoice Lookup Modal ───────────────────────────────────────── */
// ↑ Now accepts `user` prop to pass into generateInvoice
function InvoiceModal({ orders, user, onClose }) {
  const [orderId, setOrderId] = useState("");
  const [result, setResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [downloading, setDownloading] = useState(false);  // ← NEW

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = orderId.trim().toLowerCase();
    if (!q) { toast.error("Enter an Order ID"); return; }
    setSearching(true);
    setTimeout(() => {
      const found = orders.find(
        (o) =>
          o._id.toLowerCase().includes(q) ||
          o._id.slice(-8).toLowerCase() === q
      );
      setResult({ found: !!found, order: found || null });
      setSearching(false);
    }, 400);
  };

  // ── REAL download handler ──────────────────────────────────────────
  const handleDownload = async (order) => {
    setDownloading(true);
    try {
      await generateInvoice(order, user);
      toast.success(`Invoice #${order._id.slice(-8).toUpperCase()} downloaded!`);
    } catch (err) {
      console.error("Invoice generation error:", err);
      toast.error("Failed to generate invoice. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const STATUS_CFG_LOCAL = {
    Placed:     { label: "Order Placed",    color: "bg-blue-100 text-blue-700",     icon: Clock },
    Processing: { label: "Processing",      color: "bg-yellow-100 text-yellow-700", icon: Package },
    Shipped:    { label: "Shipped",          color: "bg-indigo-100 text-indigo-700", icon: Truck },
    Delivered:  { label: "Delivered",        color: "bg-green-100 text-green-700",   icon: CheckCircle },
    Cancelled:  { label: "Cancelled",        color: "bg-red-100 text-red-700",       icon: XCircle },
    Returned:   { label: "Return Requested", color: "bg-gray-100 text-gray-600",     icon: RotateCcw },
    Refunded:   { label: "Refunded",         color: "bg-blue-100 text-blue-700",     icon: CheckCircle },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: "90vh" }}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ background: "#0a1f44" }}>
          <div>
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <FileText className="w-4 h-4" /> Invoice Generator
            </h3>
            <p className="text-blue-200 text-xs mt-0.5">Enter your Order ID to download invoice</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={orderId}
              onChange={(e) => { setOrderId(e.target.value); setResult(null); }}
              placeholder="Enter Order ID (e.g. A1B2C3D4)"
              className="input-field flex-1 text-sm"
            />
            <button type="submit" disabled={searching} className="btn-primary px-4 py-2 text-sm flex-shrink-0">
              {searching
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                : <Search className="w-4 h-4" />}
            </button>
          </form>

          {result && !result.found && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              <p>No order found for <strong>"{orderId}"</strong>. Please check the ID and try again.</p>
            </div>
          )}

          {result && result.found && (() => {
            const order = result.order;
            const cfg = STATUS_CFG_LOCAL[order.orderStatus] || STATUS_CFG_LOCAL.Placed;
            const StatusIcon = cfg.icon;
            const isDelivered = order.orderStatus === "Delivered";

            return (
              <div className="border-2 border-gray-100 rounded-2xl overflow-hidden">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Order ID</p>
                      <p className="text-sm font-mono font-bold text-gray-900">
                        #{order._id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" /> {cfg.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                    <span className="font-bold text-gray-900">
                      ₹{order.totalPrice?.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {order.orderItems?.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                        <span className="truncate">{item.title}</span>
                        <span className="text-gray-400 flex-shrink-0">×{item.quantity}</span>
                      </div>
                    ))}
                    {order.orderItems?.length > 3 && (
                      <p className="text-xs text-gray-400 pl-3.5">+{order.orderItems.length - 3} more items</p>
                    )}
                  </div>
                </div>

                <div className="px-4 pb-4">
                  {isDelivered ? (
                    <button
                      onClick={() => handleDownload(order)}
                      disabled={downloading}
                      className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {downloading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Generating PDF…
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" /> Download Invoice
                        </>
                      )}
                    </button>
                  ) : (
                    <div
                      className="flex items-start gap-2 rounded-xl p-3 text-xs"
                      style={{ background: "#e8f0fe", color: "#0a1f44" }}
                    >
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>
                        Invoice will be available once the order is delivered.
                        Current status: <strong>{cfg.label}</strong>.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {!result && (
            <div className="text-xs text-gray-400 space-y-1">
              <p className="font-semibold text-gray-500">Tips:</p>
              <p>• Use the last 8 characters of your Order ID</p>
              <p>• Find your Order ID in "All Orders" or confirmation email</p>
              <p>• Invoice is available only after delivery</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary w-full py-2.5 text-sm">Close</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Return Status Tracker ──────────────────────────────────────── */
const RETURN_STEPS = [
  { key: "ReturnRequested", label: "Return Requested", icon: RotateCcw,   desc: "We've received your request" },
  { key: "ReturnAccepted",  label: "Return Accepted",  icon: CheckCircle, desc: "Your return has been approved" },
  { key: "Picked",          label: "Picked Up",         icon: Truck,       desc: "Item collected by courier" },
  { key: "Refunded",        label: "Refund Initiated",  icon: RefreshCcw,  desc: "Refund sent to original payment method" },
  { key: "Completed",       label: "Refund Done",       icon: CheckCircle, desc: "Amount credited to your account" },
];

function ReturnStatusTracker({ order }) {
  const returnStatus = order.returnStatus || "ReturnRequested";
  const currentIdx = RETURN_STEPS.findIndex((s) => s.key === returnStatus);
  const activeIdx = currentIdx === -1 ? 0 : currentIdx;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Return Progress</p>
      <div className="relative">
        <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-gray-100" />
        <div
          className="absolute left-3.5 top-0 w-0.5 bg-[#0a1f44] transition-all duration-700"
          style={{ height: `${(activeIdx / (RETURN_STEPS.length - 1)) * 100}%` }}
        />
        <div className="space-y-3">
          {RETURN_STEPS.map((step, i) => {
            const StepIcon = step.icon;
            const done = i <= activeIdx;
            const isActive = i === activeIdx;
            return (
              <div key={step.key} className="flex items-start gap-3 relative">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 transition-all
                    ${done ? "bg-[#0a1f44] border-[#0a1f44]" : "bg-white border-gray-200"}`}
                >
                  <StepIcon className={`w-3.5 h-3.5 ${done ? "text-white" : "text-gray-300"}`} />
                </div>
                <div className="pb-1">
                  <p className={`text-sm font-semibold ${done ? "text-gray-900" : "text-gray-400"}`}>
                    {step.label}
                    {isActive && (
                      <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "#e8f0fe", color: "#0a1f44" }}>
                        Current
                      </span>
                    )}
                  </p>
                  <p className={`text-xs mt-0.5 ${done ? "text-gray-500" : "text-gray-300"}`}>
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Constants ─────────────────────────────────────────────────── */
const STATUS_CFG = {
  Placed:     { color: "bg-blue-100 text-blue-700",     icon: Clock },
  Processing: { color: "bg-yellow-100 text-yellow-700", icon: Package },
  Shipped:    { color: "bg-indigo-100 text-indigo-700", icon: Truck },
  Delivered:  { color: "bg-green-100 text-green-700",   icon: CheckCircle },
  Cancelled:  { color: "bg-red-100 text-red-700",       icon: XCircle },
  Returned:   { color: "bg-gray-100 text-gray-600",     icon: RotateCcw },
  Refunded:   { color: "bg-blue-100 text-blue-700",     icon: CheckCircle },
};

const TRACK_STEPS = ["Placed", "Processing", "Shipped", "Delivered"];

const TABS = {
  PROFILE:   "profile",
  ORDERS:    "orders",
  TRACKING:  "tracking",
  HISTORY:   "history",
  RETURNS:   "returns",
  ADDRESS:   "address",
  INVOICE:   "invoice",
};
const ORDER_TABS = [TABS.ORDERS, TABS.TRACKING, TABS.HISTORY, TABS.RETURNS, TABS.INVOICE];

const TAB_URL = {
  [TABS.PROFILE]:  "/profile",
  [TABS.ORDERS]:   "/profile?tab=orders",
  [TABS.TRACKING]: "/profile?tab=tracking",
  [TABS.HISTORY]:  "/profile?tab=history",
  [TABS.RETURNS]:  "/profile?tab=returns",
  [TABS.ADDRESS]:  "/profile?tab=address",
  [TABS.INVOICE]:  "/profile?tab=invoice",
};

const PAGE_TITLES = {
  [TABS.PROFILE]:  "My Profile",
  [TABS.ORDERS]:   "All Orders",
  [TABS.TRACKING]: "Order Tracking",
  [TABS.HISTORY]:  "Order History",
  [TABS.RETURNS]:  "Return Status",
  [TABS.ADDRESS]:  "Saved Address",
  [TABS.INVOICE]:  "Generate Invoice",
};

const SIDEBAR = [
  { label: "My Profile",    icon: User,      tab: TABS.PROFILE },
  {
    label: "My Orders",
    icon: ShoppingBag,
    children: [
      { label: "All Orders",       icon: ShoppingBag, tab: TABS.ORDERS },
      { label: "Order Tracking",   icon: Truck,       tab: TABS.TRACKING },
      { label: "Order History",    icon: Package,     tab: TABS.HISTORY },
      { label: "Return Status",    icon: RotateCcw,   tab: TABS.RETURNS },
      { label: "Generate Invoice", icon: FileText,    tab: TABS.INVOICE },
    ],
  },
  { label: "Saved Address", icon: MapPinned, tab: TABS.ADDRESS },
];

const ADDR_BLANK = { label: "Home", street: "", city: "", state: "", pincode: "" };

const urlToTab = (search) => {
  const t = new URLSearchParams(search).get("tab");
  return Object.values(TABS).includes(t) ? t : TABS.PROFILE;
};

/* ─── Address Form ───────────────────────────────────────────────── */
function AddressForm({ addrForm, setAddrForm, onSave, onCancel, saving, editingAddr }) {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-5">
      <h3 className="text-sm font-bold text-gray-800 mb-3">
        {editingAddr ? "Edit Address" : "Add New Address"}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Label</label>
          <select value={addrForm.label}
            onChange={(e) => setAddrForm((p) => ({ ...p, label: e.target.value }))}
            className="input-field">
            {["Home", "Office", "Other"].map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
        {[
          { key: "street",  label: "Street *",  ph: "Street address" },
          { key: "city",    label: "City *",    ph: "City" },
          { key: "state",   label: "State",     ph: "State" },
          { key: "pincode", label: "Pincode *", ph: "6-digit pincode" },
        ].map(({ key, label, ph }) => (
          <div key={key}>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{label}</label>
            <input type="text" value={addrForm[key]}
              onChange={(e) => setAddrForm((p) => ({ ...p, [key]: e.target.value }))}
              placeholder={ph} className="input-field" />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        <button onClick={onSave} disabled={saving} className="btn-primary px-4 py-2 text-sm">
          {saving ? "Saving..." : "Save Address"}
        </button>
        <button onClick={onCancel} className="btn-ghost border border-gray-200 px-4 py-2 text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ─── Address List ───────────────────────────────────────────────── */
function AddressList({ addressList, onEdit, onDelete, onAdd, showAddrForm, addrForm, setAddrForm, saveAddress, setShowAddrForm, editingAddr, saving }) {
  return (
    <>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#0a1f44]" />
          Saved Address
          <span className="text-sm font-normal text-gray-400">({addressList.length}/10)</span>
        </h2>
        {addressList.length < 10 && (
          <button onClick={onAdd} className="flex items-center gap-1 text-sm text-[#0a1f44] font-semibold hover:underline">
            <Plus className="w-4 h-4" /> Add New
          </button>
        )}
      </div>
      {showAddrForm && (
        <AddressForm addrForm={addrForm} setAddrForm={setAddrForm}
          onSave={saveAddress} onCancel={() => setShowAddrForm(false)}
          saving={saving} editingAddr={editingAddr} />
      )}
      {addressList.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
          <MapPin className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No saved address yet</p>
          {!showAddrForm && (
            <button onClick={onAdd} className="mt-3 btn-primary px-5 py-2 text-sm">Add Address</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addressList.map((addr) => (
            <div key={addr._id}
              className="border-2 border-gray-100 hover:border-blue-200 rounded-2xl p-4 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  addr.label === "Home"   ? "bg-blue-100 text-[#0a1f44]"
                  : addr.label === "Office" ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"}`}>
                  {addr.label}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => onEdit(addr)}
                    className="p-1.5 text-gray-400 hover:text-[#0a1f44] hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDelete(addr._id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-700">{addr.street}</p>
              <p className="text-sm text-gray-500 mt-1">
                {addr.city}{addr.state ? `, ${addr.state}` : ""} — {addr.pincode}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
export default function ProfilePage({ auth }) {
  const { user, updateUser } = auth;
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(() => urlToTab(location.search));
  const [ordersOpen, setOrdersOpen] = useState(() => ORDER_TABS.includes(urlToTab(location.search)));

  useEffect(() => {
    const tab = urlToTab(location.search);
    setActiveTab(tab);
    if (ORDER_TABS.includes(tab)) setOrdersOpen(true);
  }, [location.search]);

  const [profile, setProfile] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    secondaryPhone: user?.secondaryPhone || "",
  });

  const [pwdForm, setPwdForm] = useState({ current: "", next: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);

  const [addressList, setAddressList] = useState([]);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editingAddr, setEditingAddr] = useState(null);
  const [addrForm, setAddrForm] = useState(ADDR_BLANK);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersFetched, setOrdersFetched] = useState(false);

  const [reviewModal, setReviewModal] = useState(null);
  const [returnModal, setReturnModal] = useState(null);
  const [invoiceModal, setInvoiceModal] = useState(false);

  // ── Per-order invoice downloading state (for inline buttons) ──────
  const [downloadingOrderId, setDownloadingOrderId] = useState(null); // ← NEW

  const [reviewedProducts, setReviewedProducts] = useState(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/user/profile")
      .then(({ data }) => {
        setProfile({
          name: data.name || "",
          phone: data.phone || "",
          secondaryPhone: data.secondaryPhone || "",
        });
        setAddressList(data.addresses || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (ORDER_TABS.includes(activeTab) && !ordersFetched) {
      setOrdersLoading(true);
      api.get("/orders/my")
        .then(async ({ data }) => {
          setOrders(data);
          setOrdersFetched(true);
          const deliveredOrders = data.filter((o) => o.orderStatus === "Delivered");
          const uniqueProductIds = [...new Set(
            deliveredOrders.flatMap((o) => o.orderItems || [])
              .map((i) => i.product?._id || i.product)
              .filter(Boolean)
          )];
          if (uniqueProductIds.length === 0) return;
          const alreadyReviewedSet = new Set();
          await Promise.allSettled(
            uniqueProductIds.map(async (pid) => {
              try {
                const { data: prod } = await api.get(`/products/${pid}`);
                const hasReview = (prod.reviews || []).some(
                  (r) => r.user === user?._id || r.user?._id === user?._id
                );
                if (hasReview) alreadyReviewedSet.add(pid);
              } catch { }
            })
          );
          if (alreadyReviewedSet.size > 0) {
            setReviewedProducts((prev) => new Set([...prev, ...alreadyReviewedSet]));
          }
        })
        .catch(() => {})
        .finally(() => setOrdersLoading(false));
    }
  }, [activeTab, ordersFetched, user?._id]);

  const saveProfile = async () => {
    if (!profile.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const { data } = await api.put("/user/profile", profile);
      updateUser(data);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (!pwdForm.current) { toast.error("Enter your current password"); return; }
    if (pwdForm.next !== pwdForm.confirm) { toast.error("Passwords do not match"); return; }
    if (pwdForm.next.length < 6) { toast.error("Minimum 6 characters required"); return; }
    setSaving(true);
    try {
      await api.put("/user/password", { currentPassword: pwdForm.current, newPassword: pwdForm.next });
      toast.success("Password updated!");
      setPwdForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally { setSaving(false); }
  };

  const saveAddress = async () => {
    if (!addrForm.street.trim() || !addrForm.city.trim() || !addrForm.pincode.trim()) {
      toast.error("Street, City and Pincode are required");
      return;
    }
    if (!/^\d{6}$/.test(addrForm.pincode)) {
      toast.error("Pincode must be exactly 6 digits");
      return;
    }
    setSaving(true);
    try {
      let updatedList;
      if (editingAddr) {
        updatedList = addressList.map((a) =>
          a._id === editingAddr ? { ...a, ...addrForm } : a
        );
      } else {
        if (addressList.length >= 10) {
          toast.error("Maximum 10 addresses allowed");
          return;
        }
        updatedList = [...addressList, addrForm];
      }
      const { data } = await api.put("/user/addresses", { addresses: updatedList });
      setAddressList(data.addresses || data.address || []);
      toast.success(editingAddr ? "Address updated!" : "Address added!");
      setShowAddrForm(false);
      setEditingAddr(null);
      setAddrForm(ADDR_BLANK);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save address");
    } finally { setSaving(false); }
  };

  const deleteAddress = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      const updatedList = addressList.filter((a) => a._id !== id);
      const { data } = await api.put("/user/addresses", { addresses: updatedList });
      setAddressList(data.addresses || data.address || []);
      toast.success("Address deleted");
    } catch {
      toast.error("Failed to delete address");
    }
  };

  const startEdit = (addr) => {
    setAddrForm({
      label:   addr.label,
      street:  addr.street,
      city:    addr.city,
      state:   addr.state,
      pincode: addr.pincode,
    });
    setEditingAddr(addr._id);
    setShowAddrForm(true);
    setTimeout(
      () => document.getElementById("addr-form-anchor")?.scrollIntoView({ behavior: "smooth" }),
      50
    );
  };

  const cancelOrder = async (id) => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      await api.put(`/orders/${id}/cancel`);
      setOrders((prev) =>
        prev.map((o) => o._id === id ? { ...o, orderStatus: "Cancelled" } : o)
      );
      toast.success("Order cancelled");
    } catch { toast.error("Failed to cancel order"); }
  };

  const handleReturnSuccess = (orderId) => {
    setOrders((prev) =>
      prev.map((o) =>
        o._id === orderId ? { ...o, orderStatus: "Returned", returnStatus: "ReturnRequested" } : o
      )
    );
  };

  const handleReviewSuccess = useCallback((productId) => {
    setReviewedProducts((prev) => new Set([...prev, productId]));
  }, []);

  // ── Real inline invoice download ───────────────────────────────────
  const handleInlineInvoiceDownload = async (order) => {
    if (downloadingOrderId) return; // prevent double-click
    setDownloadingOrderId(order._id);
    try {
      await generateInvoice(order, user);
      toast.success(`Invoice #${order._id.slice(-8).toUpperCase()} downloaded!`);
    } catch (err) {
      console.error("Invoice generation error:", err);
      toast.error("Failed to generate invoice. Please try again.");
    } finally {
      setDownloadingOrderId(null);
    }
  };

  const handleTabClick = (tab) => {
    if (tab === TABS.INVOICE) {
      setInvoiceModal(true);
      return;
    }
    navigate(TAB_URL[tab] ?? "/profile");
  };

  const addrListProps = {
    addressList,
    onEdit:        startEdit,
    onDelete:      deleteAddress,
    onAdd: () => {
      setAddrForm(ADDR_BLANK);
      setEditingAddr(null);
      setShowAddrForm(true);
    },
    showAddrForm,
    addrForm,
    setAddrForm,
    saveAddress,
    setShowAddrForm,
    editingAddr,
    saving,
  };

  const filteredOrders =
    activeTab === TABS.HISTORY
      ? orders.filter((o) => ["Delivered", "Cancelled"].includes(o.orderStatus))
      : activeTab === TABS.RETURNS
        ? orders.filter((o) => ["Returned", "Refunded"].includes(o.orderStatus))
        : activeTab === TABS.TRACKING
          ? orders.filter((o) => ["Placed", "Processing", "Shipped"].includes(o.orderStatus))
          : orders;

  const showReturnsBanner = [TABS.ORDERS, TABS.RETURNS].includes(activeTab);

  /* ── Order list renderer ── */
  const renderOrders = () => {
    if (ordersLoading)
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-32 animate-pulse bg-gray-100 rounded-2xl" />
          ))}
        </div>
      );

    if (filteredOrders.length === 0)
      return (
        <div className="card p-12 text-center">
          <Package className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-700 mb-1">No orders found</h2>
          <p className="text-gray-400 text-sm mb-5">Order genuine TVS parts to see them here</p>
          <button onClick={() => navigate("/products")} className="btn-primary px-8">Browse Parts</button>
        </div>
      );

    return (
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const cfg = STATUS_CFG[order.orderStatus] || STATUS_CFG.Placed;
          const StatusIcon = cfg.icon;
          const currentIdx = TRACK_STEPS.indexOf(order.orderStatus);
          const isDelivered = order.orderStatus === "Delivered";
          const isHistory   = activeTab === TABS.HISTORY;
          const isReturnTab = activeTab === TABS.RETURNS;

          const deliveryDate      = new Date(order.deliveredAt || order.updatedAt);
          const daysSince         = Math.floor((Date.now() - deliveryDate) / (1000 * 60 * 60 * 24));
          const withinReturn      = isDelivered && daysSince <= 7;
          const daysRemaining     = Math.max(0, 7 - daysSince);
          const isReturnRequested = order.orderStatus === "Returned" || order.orderStatus === "Refunded";
          const isDownloadingThis = downloadingOrderId === order._id; // ← NEW

          return (
            <div key={order._id} className="card p-5">
              {/* Meta row */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Order ID</p>
                  <p className="text-sm font-mono font-bold text-gray-800">
                    #{order._id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Ordered On</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Total</p>
                  <p className="text-sm font-black text-gray-900">
                    ₹{order.totalPrice?.toLocaleString("en-IN")}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.color}`}>
                  <StatusIcon className="w-3.5 h-3.5" /> {order.orderStatus}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-2 mb-4">
                {order.orderItems?.map((item, i) => {
                  const pid = item.product?._id || item.product;
                  const alreadyReviewed = reviewedProducts.has(pid);

                  return (
                    <div key={i}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors bg-white">
                      <button
                        onClick={() => pid && navigate(`/products/${pid}`)}
                        className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden
                                   hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#0a1f44]/30"
                        title="View product">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        ) : (
                          <Package className="w-6 h-6 text-gray-300 m-auto mt-3" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => pid && navigate(`/products/${pid}`)}
                          className="text-sm font-semibold text-gray-800 hover:text-[#0a1f44] hover:underline text-left truncate block w-full transition-colors"
                          title="View product">
                          {item.title}
                        </button>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Qty: {item.quantity} &nbsp;·&nbsp; ₹{item.price?.toLocaleString("en-IN")}
                        </p>
                        {withinReturn && daysRemaining <= 2 && daysRemaining > 0 && (
                          <p className="text-xs font-semibold mt-0.5" style={{ color: "#de1c0e" }}>
                            Return window closes in {daysRemaining} day{daysRemaining === 1 ? "" : "s"}
                          </p>
                        )}
                      </div>

                      {/* Rate & Review */}
                      {isDelivered && (
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          {alreadyReviewed ? (
                            <button
                              onClick={async () => {
                                try {
                                  const { data: prod } = await api.get(`/products/${pid}`);
                                  const existingReview = (prod.reviews || []).find(
                                    (r) => r.user === user?._id || r.user?._id === user?._id
                                  );
                                  setReviewModal({
                                    productId: pid, productTitle: item.title, isEdit: true,
                                    existingRating:  existingReview?.rating  || 0,
                                    existingComment: existingReview?.comment || "",
                                  });
                                } catch {
                                  setReviewModal({ productId: pid, productTitle: item.title, isEdit: true, existingRating: 0, existingComment: "" });
                                }
                              }}
                              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all hover:border-[#de1c0e] hover:text-[#de1c0e]"
                              style={{ borderColor: "#0a1f44", color: "#0a1f44" }}>
                              <Star className="w-3 h-3" /> Edit Review
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                try {
                                  const { data: prod } = await api.get(`/products/${pid}`);
                                  const existingReview = (prod.reviews || []).find(
                                    (r) => r.user === user?._id || r.user?._id === user?._id
                                  );
                                  if (existingReview) {
                                    setReviewedProducts((prev) => new Set([...prev, pid]));
                                    setReviewModal({
                                      productId: pid, productTitle: item.title, isEdit: true,
                                      existingRating:  existingReview.rating  || 0,
                                      existingComment: existingReview.comment || "",
                                    });
                                  } else {
                                    setReviewModal({ productId: pid, productTitle: item.title, isEdit: false, existingRating: 0, existingComment: "" });
                                  }
                                } catch {
                                  setReviewModal({ productId: pid, productTitle: item.title, isEdit: false, existingRating: 0, existingComment: "" });
                                }
                              }}
                              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all hover:border-[#de1c0e] hover:text-[#de1c0e]"
                              style={{ borderColor: "#0a1f44", color: "#0a1f44" }}>
                              <Star className="w-3 h-3" /> Rate &amp; Review
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Delivered footer ── */}
              {isDelivered && (
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl"
                    style={{ background: "#e8f0fe", color: "#0a1f44" }}>
                    <CheckCircle className="w-4 h-4" />
                    Delivered
                    {order.deliveredAt && (
                      <span className="font-normal text-gray-500">
                        on {new Date(order.deliveredAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {!isReturnRequested && (
                      withinReturn ? (
                        <button
                          onClick={() => setReturnModal(order)}
                          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border-2 transition-all hover:border-[#de1c0e] hover:text-[#de1c0e]"
                          style={{ borderColor: "#de1c0e", color: "#de1c0e" }}>
                          <RotateCcw className="w-3.5 h-3.5" />
                          Return{daysRemaining <= 3 && daysRemaining > 0 && (
                            <span className="ml-1 font-normal">({daysRemaining}d left)</span>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Return window expired
                        </span>
                      )
                    )}
                    {isReturnRequested && (
                      <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl"
                        style={{ background: "#fde8e7", color: "#de1c0e" }}>
                        <RotateCcw className="w-3.5 h-3.5" /> Return Requested
                      </span>
                    )}

                    {/* ── REAL Invoice Download Button ── */}
                    <button
                      onClick={() => handleInlineInvoiceDownload(order)}
                      disabled={isDownloadingThis}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border-2 transition-all hover:bg-[#0a1f44] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ borderColor: "#0a1f44", color: "#0a1f44" }}>
                      {isDownloadingThis ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Generating…
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" /> Invoice
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

                {/* Phase 5 — fulfillment groups: this is still one order, but
                  it may ship from more than one location. Shown only when
                  there's more than one group (single-group orders don't
                  need this extra note). */}
              {order.fulfillmentGroups?.length > 1 && (
                <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-100 space-y-1.5">
                  <p className="text-xs font-bold text-[#0a1f44]">
                    This order ships from {order.fulfillmentGroups.length} locations
                  </p>
                  {order.fulfillmentGroups.map((g, i) => (
                    <p key={g._id || i} className="text-xs text-gray-500">
                      Shipment {i + 1}: {g.items?.length || 0} item{g.items?.length === 1 ? "" : "s"} · {g.status}
                    </p>
                  ))}
                </div>
              )}

              {/* Return status tracker */}
              {isReturnTab && isReturnRequested && (
                <ReturnStatusTracker order={order} />
              )}

              {/* Progress tracker — active orders only */}
              {["Placed", "Processing", "Shipped"].includes(order.orderStatus) && (
                <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
                  {TRACK_STEPS.map((step, i) => {
                    const done = i <= currentIdx;
                    return (
                      <div key={step} className="flex items-center gap-1 flex-shrink-0">
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
                            ${done ? "bg-[#0a1f44] text-white" : "bg-gray-100 text-gray-400"}`}>
                          {done ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {step}
                        </div>
                        {i < TRACK_STEPS.length - 1 && (
                          <div className={`w-5 h-0.5 rounded-full ${i < currentIdx ? "bg-[#0a1f44]" : "bg-gray-200"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Cancel */}
              {order.orderStatus === "Placed" && (
                <button onClick={() => cancelOrder(order._id)}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold hover:underline transition-colors">
                  Cancel Order
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  /* ── Tab content ── */
  const renderContent = () => {
    switch (activeTab) {
      case TABS.PROFILE:
        return (
          <>
            <div className="card p-4 sm:p-6">
              <h2 className="text-lg font-black text-gray-900 mb-5 flex items-center gap-2">
                <User className="w-5 h-5 text-[#0a1f44]" /> Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Full Name" value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value.replace(/[^a-zA-Z\s]/g, "") }))}
                  placeholder="Your full name" />
                <Input label="Email Address" value={user?.email || ""} readOnly type="email" />
                <Input label="Primary Phone" value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 15) }))}
                  placeholder="+91 XXXXX XXXXX" />
                <Input label="Secondary Phone" value={profile.secondaryPhone}
                  onChange={(e) => setProfile((p) => ({ ...p, secondaryPhone: e.target.value.replace(/\D/g, "").slice(0, 15) }))}
                  placeholder="Optional" />
              </div>
              <button onClick={saveProfile} disabled={saving} className="btn-primary mt-5 px-6 py-2.5 text-sm">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>

            <div className="card p-4 sm:p-6">
              <h2 className="text-lg font-black text-gray-900 mb-5 flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#0a1f44]" /> Change Password
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Current Password", key: "current" },
                  { label: "New Password",      key: "next" },
                  { label: "Confirm New",        key: "confirm" },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
                    <div className="relative">
                      <input type={showPwd ? "text" : "password"} value={pwdForm[key]}
                        onChange={(e) => setPwdForm((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder="••••••" className="input-field pr-10" />
                      <button type="button" onClick={() => setShowPwd((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={savePassword} disabled={saving} className="btn-primary mt-5 px-6 py-2.5 text-sm">
                {saving ? "Updating..." : "Update Password"}
              </button>
            </div>

            <div className="card p-4 sm:p-6">
              <div id="addr-form-anchor" />
              <AddressList {...addrListProps} />
            </div>
          </>
        );

      case TABS.ADDRESS:
        return (
          <div className="card p-4 sm:p-6">
            <div id="addr-form-anchor" />
            <AddressList {...addrListProps} />
          </div>
        );

      case TABS.ORDERS:
      case TABS.TRACKING:
      case TABS.HISTORY:
      case TABS.RETURNS:
        return (
          <div className="space-y-4">
            {showReturnsBanner && (
              <div className="card p-4 flex flex-wrap items-start gap-4 border-l-4" style={{ borderLeftColor: "#de1c0e" }}>
                <RotateCcw className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#de1c0e" }} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm mb-1">How Returns Work</h3>
                  <div className="grid sm:grid-cols-3 gap-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: "#0a1f44" }}>1</span>
                      Request return within 7 days of delivery
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: "#0a1f44" }}>2</span>
                      Pickup arranged in 2–3 business days
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: "#0a1f44" }}>3</span>
                      Refund processed in 5–7 business days
                    </div>
                  </div>
                </div>
              </div>
            )}
            {renderOrders()}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="page-wrapper min-h-screen bg-gray-50">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-4 mb-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#0a1f44] flex items-center justify-center text-white text-xl font-black flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>

          <div className="card overflow-hidden">
            {SIDEBAR.map((item) => {
              const Icon = item.icon;
              if (item.children) {
                const anyChildActive = item.children.some((c) => c.tab === activeTab);
                return (
                  <div key={item.label}>
                    <button
                      onClick={() => setOrdersOpen((o) => !o)}
                      className={`w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 transition-colors
                        ${anyChildActive ? "bg-gray-100" : "hover:bg-gray-50"}`}>
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${anyChildActive ? "text-[#0a1f44]" : "text-gray-700"}`} />
                        <span className={`text-sm font-semibold ${anyChildActive ? "text-[#0a1f44]" : "text-gray-700"}`}>
                          {item.label}
                        </span>
                      </div>
                      {ordersOpen
                        ? <ChevronDown className="w-4 h-4 text-gray-500" />
                        : <ChevronRight className="w-4 h-4 text-gray-500" />}
                    </button>
                    {ordersOpen && (
                      <div className="bg-gray-50">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const isActive = activeTab === child.tab;
                          const isInvoiceItem = child.tab === TABS.INVOICE;
                          return (
                            <button
                              key={child.label}
                              onClick={() => handleTabClick(child.tab)}
                              className={`w-full flex items-center gap-3 px-8 py-3 text-sm border-b border-gray-100 transition-colors text-left
                                ${isActive && !isInvoiceItem
                                  ? "bg-[#0a1f44] text-white font-semibold"
                                  : "text-gray-600 hover:bg-gray-100"}`}>
                              <ChildIcon className="w-4 h-4 flex-shrink-0" />
                              {child.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.label}
                  onClick={() => handleTabClick(item.tab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm border-b border-gray-100 transition-colors text-left
                    ${isActive ? "bg-[#0a1f44] text-white font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-5">
          <div className="card p-4 sm:p-5 flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                {PAGE_TITLES[activeTab]}
              </h1>
              <p className="text-sm text-gray-500 mt-1">Manage your account information and orders</p>
            </div>
          </div>
          {renderContent()}
        </div>
      </div>

      {/* Modals */}
      {reviewModal && (
        <ReviewModal
          productId={reviewModal.productId}
          productTitle={reviewModal.productTitle}
          isEdit={reviewModal.isEdit || false}
          existingRating={reviewModal.existingRating || 0}
          existingComment={reviewModal.existingComment || ""}
          onClose={() => setReviewModal(null)}
          onSuccess={handleReviewSuccess}
        />
      )}
      {returnModal && (
        <ReturnModal
          order={returnModal}
          onClose={() => setReturnModal(null)}
          onSuccess={handleReturnSuccess}
        />
      )}
      {invoiceModal && (
        <InvoiceModal
          orders={orders}
          user={user}
          onClose={() => setInvoiceModal(false)}
        />
      )}
    </div>
  );
}