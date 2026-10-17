/* eslint-disable no-unused-vars */
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star, ShoppingCart, Heart, Truck, Shield, RotateCcw,
  ChevronLeft, Minus, Plus, CheckCircle, Package, Wrench,
  PenLine, X, Check, ChevronDown, ChevronUp, AlertCircle,
  User, ThumbsUp,
} from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import NearbyAvailability from "../components/fulfillment/NearbyAvailability";
import api from "../utils/api";
import toast from "react-hot-toast";

/* ════════════════════════════════════════════════════════
   REVIEW SUB-COMPONENTS
════════════════════════════════════════════════════════ */

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
            <Star className="w-10 h-10 transition-colors" style={{
              fill: (hovered || value) >= n ? "#de1c0e" : "transparent",
              color: (hovered || value) >= n ? "#de1c0e" : "#d1d5db", strokeWidth: 1.5,
            }} />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-black text-gray-900">{value > 0 ? `${value} / 5` : ""}</span>
        <span className="text-sm font-bold" style={{ color: value > 0 ? "#de1c0e" : "#9ca3af" }}>
          {labels[value]}
        </span>
      </div>
    </div>
  );
}

function StarDisplay({ value = 0, size = "w-4 h-4" }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={size} style={{
          fill: value >= n ? "#de1c0e" : value >= n - 0.5 ? "#de1c0e" : "transparent",
          color: value >= n - 0.5 ? "#de1c0e" : "#d1d5db",
          opacity: value >= n - 0.5 ? 1 : 0.45, strokeWidth: 1.5,
        }} />
      ))}
    </div>
  );
}

function RatingBar({ star, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-2 text-right shrink-0">{star}</span>
      <Star className="w-3 h-3 shrink-0" style={{ fill: "#de1c0e", color: "#de1c0e" }} />
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: "#de1c0e" }} />
      </div>
      <span className="text-xs text-gray-400 w-5 text-right shrink-0">{count}</span>
    </div>
  );
}

function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false);
  const long = (review.comment?.length || 0) > 220;
  const text = long && !expanded ? review.comment.slice(0, 220) + "…" : review.comment;
  const date = new Date(review.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
  return (
    <div className="py-5 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: "#0a1f44" }}>
            {review.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{review.name}</p>
            <p className="text-xs text-gray-400">{date}</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: "#e8f0fe", color: "#0a1f44" }}>
          <Check className="w-3 h-3" /> Verified Purchase
        </span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <StarDisplay value={review.rating} size="w-4 h-4" />
        <span className="text-sm font-black" style={{ color: "#de1c0e" }}>{review.rating} / 5</span>
        <span className="text-sm font-semibold text-gray-700">— {labels[review.rating]}</span>
      </div>
      {review.comment ? (
        <>
          <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
          {long && (
            <button onClick={() => setExpanded((e) => !e)}
              className="mt-1 text-xs font-semibold flex items-center gap-1"
              style={{ color: "#0a1f44" }}>
              {expanded
                ? <><ChevronUp className="w-3.5 h-3.5" /> Read less</>
                : <><ChevronDown className="w-3.5 h-3.5" /> Read more</>}
            </button>
          )}
        </>
      ) : (
        <p className="text-xs text-gray-400 italic">No written comment</p>
      )}
    </div>
  );
}

function ReviewModal({ productId, productTitle, onClose, onSuccess, isEdit = false, existingRating = 0, existingComment = "" }) {
  const [rating,     setRating]     = useState(isEdit ? existingRating : 0);
  const [comment,    setComment]    = useState(isEdit ? existingComment : "");
  const [submitting, setSubmitting] = useState(false);
  const [ratingErr,  setRatingErr]  = useState(false);

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
      onSuccess(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save review");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
          style={{ background: "#0a1f44" }}>
          <div>
            <h3 className="font-black text-white text-base">{isEdit ? "Edit Your Review" : "Rate & Review"}</h3>
            <p className="text-blue-200 text-xs mt-0.5 max-w-xs truncate">{productTitle}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1">
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

function ReviewsSection({ product, auth, refreshProduct }) {
  const { user, isLoggedIn } = auth || {};
  const [showModal,   setShowModal]   = useState(false);
  const [modalConfig, setModalConfig] = useState({ isEdit: false, existingRating: 0, existingComment: "" });
  const [eligibility, setEligibility] = useState(null);
  const [checking,    setChecking]    = useState(false);
  const [showAll,     setShowAll]     = useState(false);

  const reviews   = product?.reviews || [];
  const total     = reviews.length;
  const avgRating = product?.rating || 0;

  const dist = [5, 4, 3, 2, 1].map((s) => ({
    star: s, count: reviews.filter((r) => r.rating === s).length,
  }));

  const checkEligibility = useCallback(async () => {
    if (!isLoggedIn || user?.role !== "user") { setEligibility("not_user"); return; }
    setChecking(true);
    try {
      const { data: myOrders } = await api.get("/orders/my");
      const existingReview = reviews.find((r) => r.user === user._id || r.user?._id === user._id);
      if (existingReview) {
        setModalConfig({ isEdit: true, existingRating: existingReview.rating || 0, existingComment: existingReview.comment || "" });
        setEligibility("already_reviewed"); setChecking(false); return;
      }
      const deliveredOrders = myOrders.filter((o) => o.orderStatus === "Delivered");
      const purchased = deliveredOrders.some((o) =>
        o.orderItems?.some((i) => i.product === product._id || i.product?._id === product._id));
      if (!purchased) {
        const ordered = myOrders.some((o) =>
          o.orderItems?.some((i) => i.product === product._id || i.product?._id === product._id));
        setEligibility(ordered ? "not_delivered" : "not_purchased");
      } else { setEligibility("eligible"); }
    } catch { setEligibility("not_purchased"); }
    finally { setChecking(false); }
  }, [isLoggedIn, user, product._id, reviews]);

  useEffect(() => {
    if (isLoggedIn && product?._id) checkEligibility();
  }, [isLoggedIn, product?._id]); // eslint-disable-line

  const visibleReviews = showAll ? reviews : reviews.slice(0, 4);

  const WriteReviewCTA = () => {
    if (!isLoggedIn)
      return (
        <div className="rounded-xl p-3 text-sm flex items-start gap-2 border"
          style={{ background: "#e8f0fe", borderColor: "#0a1f44", color: "#0a1f44" }}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p><a href="/login" className="font-bold underline">Log in</a> to rate and review this product</p>
        </div>
      );
    if (checking)
      return (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          Checking your purchase history...
        </div>
      );
    if (eligibility === "eligible")
      return (
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm px-5 py-2.5">
          <PenLine className="w-4 h-4" /> Rate &amp; Review
        </button>
      );
    if (eligibility === "already_reviewed")
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl"
            style={{ background: "#e8f0fe", color: "#0a1f44" }}>
            <CheckCircle className="w-3.5 h-3.5" /> Reviewed
          </span>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl border-2 transition-all hover:border-[#de1c0e] hover:text-[#de1c0e]"
            style={{ borderColor: "#0a1f44", color: "#0a1f44" }}>
            <PenLine className="w-3.5 h-3.5" /> Edit Review
          </button>
        </div>
      );
    if (eligibility === "not_delivered")
      return (
        <div className="rounded-xl p-3 text-sm flex items-start gap-2 border"
          style={{ background: "#e8f0fe", borderColor: "#0a1f44", color: "#0a1f44" }}>
          <Package className="w-4 h-4 shrink-0 mt-0.5" />
          <p>You can review this product once your order is <strong>delivered</strong></p>
        </div>
      );
    if (eligibility === "not_purchased")
      return (
        <div className="rounded-xl p-3 text-sm flex items-start gap-2 border"
          style={{ background: "#fff0ef", borderColor: "#de1c0e", color: "#de1c0e" }}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>Only customers who have <strong>purchased and received</strong> this product can submit a review</p>
        </div>
      );
    return null;
  };

  return (
    <div className="card overflow-hidden mt-6">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-black text-gray-900">
          Ratings &amp; Reviews
          {total > 0 && <span className="ml-2 text-sm font-normal text-gray-400">({total} {total === 1 ? "review" : "reviews"})</span>}
        </h2>
        <WriteReviewCTA />
      </div>
      {total === 0 ? (
        <div className="py-14 text-center px-6">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#e8f0fe" }}>
            <Star className="w-7 h-7" style={{ color: "#0a1f44" }} />
          </div>
          <p className="font-bold text-gray-700 mb-1">No reviews yet</p>
          <p className="text-sm text-gray-400">Be the first to review after receiving your order</p>
        </div>
      ) : (
        <div className="p-6">
          <div className="grid sm:grid-cols-2 gap-6 pb-6 border-b border-gray-100 mb-6">
            <div className="flex flex-col items-center justify-center gap-2">
              <p className="text-6xl font-black text-gray-900 leading-none">{avgRating.toFixed(1)}</p>
              <p className="text-lg font-bold" style={{ color: "#de1c0e" }}>out of 5</p>
              <StarDisplay value={avgRating} size="w-6 h-6" />
              <p className="text-sm text-gray-400">{total} verified {total === 1 ? "rating" : "ratings"}</p>
            </div>
            <div className="space-y-2.5 flex flex-col justify-center">
              {dist.map(({ star, count }) => <RatingBar key={star} star={star} count={count} total={total} />)}
            </div>
          </div>
          <div>
            {visibleReviews.map((review) => <ReviewCard key={review._id} review={review} />)}
          </div>
          {total > 4 && (
            <button onClick={() => setShowAll((s) => !s)}
              className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold border-2 border-gray-200
                         hover:border-[#0a1f44] text-gray-600 hover:text-[#0a1f44] transition-all
                         flex items-center justify-center gap-1.5">
              {showAll
                ? <><ChevronUp className="w-4 h-4" /> Show fewer reviews</>
                : <><ChevronDown className="w-4 h-4" /> View all {total} reviews</>}
            </button>
          )}
        </div>
      )}
      {showModal && (
        <ReviewModal productId={product._id} productTitle={product.title}
          isEdit={modalConfig.isEdit} existingRating={modalConfig.existingRating}
          existingComment={modalConfig.existingComment}
          onClose={() => setShowModal(false)}
          onSuccess={() => { refreshProduct(); setTimeout(() => checkEligibility(), 600); }} />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════ */
export default function ProductDetailPage({ auth, cartHook, wishlistHook }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const { isLoggedIn, user } = auth || {};
  const { addToCart, cartLoading } = cartHook || {};
  const { addToWishlist, removeFromWishlist, isInWishlist } = wishlistHook || {};

  // Only regular customers (and guests) can shop
  const isCustomer  = isLoggedIn && user?.role === "user";
  const canShop     = !isLoggedIn || isCustomer;

  const { product, loading, fetchProduct } = useProducts();
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("specs");

  useEffect(() => {
    if (id) { fetchProduct(id); window.scrollTo(0, 0); }
  }, [id]); // eslint-disable-line

  const refreshProduct = useCallback(() => {
    if (id) fetchProduct(id);
  }, [id, fetchProduct]);

  const inWishlist = isInWishlist?.(product?._id) || false;
  const discount =
    product?.discount ||
    (product?.originalPrice > product?.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0);

  const handleCart = () => {
    if (!isLoggedIn) { navigate("/login"); return; }
    addToCart?.(product._id, qty, product.color);
  };
  const handleBuy = () => {
    if (!isLoggedIn) { navigate("/login"); return; }
    addToCart?.(product._id, qty, product.color);
    navigate("/cart");
  };
  const handleWish = () => {
    if (!isLoggedIn) { navigate("/login"); return; }
    inWishlist ? removeFromWishlist?.(product._id) : addToWishlist?.(product._id);
  };

  if (loading || !product)
    return (
      <div className="page-wrapper">
        <div className="grid md:grid-cols-2 gap-8 animate-pulse">
          <div className="bg-gray-200 rounded-2xl h-96" />
          <div className="space-y-4 pt-4">
            {[90, 70, 40, 100, 60].map((w, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      </div>
    );

  const specs = [
    { label: "Brand",    value: product.brand    },
    { label: "Model",    value: product.model    },
    { label: "Category", value: product.category },
    { label: "Color",    value: product.color    },
    product.ram     && { label: "RAM",     value: product.ram     },
    product.storage && { label: "Storage", value: product.storage },
    product.battery && { label: "Battery", value: product.battery },
    product.display && { label: "Display", value: product.display },
    product.camera  && { label: "Camera",  value: product.camera  },
    product.network && { label: "Network", value: product.network },
  ].filter(Boolean);

  return (
    <div className="page-wrapper">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#0a1f44] mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="card p-5 md:p-8 grid md:grid-cols-2 gap-8 mb-6">
        {/* Image */}
        <div className="relative">
          <div className="bg-gray-50 rounded-2xl flex items-center justify-center p-8 min-h-64 border border-gray-100">
            <img
              src={product.image || "https://via.placeholder.com/400x300?text=No+Image"}
              alt={product.title} className="max-h-72 object-contain w-full"
              onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/400x300?text=No+Image"; }}
            />
          </div>
          {discount > 0 && (
            <span className="absolute top-4 left-4 bg-[#de1c0e] text-white font-bold text-sm px-3 py-1 rounded-xl">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-bold text-[#0a1f44] uppercase tracking-wider mb-1 flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5" /> {product.brand} · {product.category}
            </p>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-snug">{product.title}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 bg-green-500 text-white text-sm font-bold px-2.5 py-1 rounded-lg">
              {Number(product.rating || 0).toFixed(1)}
              <Star className="w-3.5 h-3.5 fill-current" />
            </span>
            <span className="text-sm text-gray-500">{product.numReviews || 0} ratings</span>
            {product.stock > 0 && product.stock < 10 ? (
              <span className="flex items-center gap-1 text-sm text-red-600 font-semibold">
                Low stock ({product.stock} left)
              </span>
            ) : product.stock >= 10 ? (
              <span className="flex items-center gap-1 text-sm text-green-600 font-semibold">
                <CheckCircle className="w-4 h-4" /> In Stock ({product.stock})
              </span>
            ) : (
              <span className="text-sm text-red-500 font-semibold">Out of Stock</span>
            )}
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-black text-gray-900">₹{product.price?.toLocaleString("en-IN")}</span>
            {product.originalPrice > product.price && (
              <>
                <span className="text-lg text-gray-400 line-through">₹{product.originalPrice?.toLocaleString("en-IN")}</span>
                <span className="text-green-600 font-bold text-sm">
                  Save ₹{(product.originalPrice - product.price).toLocaleString("en-IN")}
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-gray-400 -mt-3">Inclusive of all taxes · GST applicable</p>

          {/* Qty — only for shoppers */}
          {canShop && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">Qty:</span>
              <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-gray-100 transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 font-bold text-sm">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(product.stock || 1, q + 1))} className="px-3 py-2 hover:bg-gray-100 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          {/* Phase 2 — location-aware availability (informational only) */}
          {canShop && <NearbyAvailability productId={product._id} quantity={qty} />} 

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {canShop ? (
              <>
                <button onClick={handleCart} disabled={product.stock === 0 || cartLoading}
                  className="flex-1 btn-primary py-3 text-sm">
                  <ShoppingCart className="w-4 h-4" />
                  {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                </button>
                <button onClick={handleBuy} disabled={product.stock === 0}
                  className="flex-1 inline-flex items-center justify-center gap-2
                             bg-red-700 hover:bg-red-600 disabled:bg-gray-200
                             text-white font-semibold py-3 rounded-xl
                             transition-colors text-sm active:scale-95">
                  <Package className="w-4 h-4" /> Buy Now
                </button>
                {/* Wishlist */}
                <button onClick={handleWish}
                  className={`p-3 rounded-xl border-2 transition-all
                    ${inWishlist ? "border-red-400 bg-red-50 text-red-500" : "border-gray-200 text-gray-400 hover:border-red-300"}`}>
                  <Heart className={`w-5 h-5 ${inWishlist ? "fill-current" : ""}`} />
                </button>
              </>
            ) : (
              /* Dealer / Admin — view only */
              <div className="flex-1 flex items-center gap-2 bg-blue-50 border border-blue-100
                              rounded-xl px-4 py-3 text-sm text-[#0a1f44] font-semibold">
                <Package className="w-4 h-4 flex-shrink-0" />
                <span>
                  {user?.role === "dealer" ? "Dealer account — browse only" : "Admin account — browse only"}
                </span>
              </div>
            )}
          </div>

          {/* Perks */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
            {[
              { icon: Truck,     text: "Free Delivery", sub: "Above ₹999"    },
              { icon: RotateCcw, text: "10-Day Return",  sub: "Unused parts"  },
              { icon: Shield,    text: "1 Yr Warranty",  sub: "OEM certified" },
            ].map(({ icon: Icon, text, sub }) => (
              <div key={text} className="flex flex-col items-center gap-1 bg-gray-50 rounded-xl p-2 text-center">
                <Icon className="w-5 h-5 text-[#0a1f44]" />
                <span className="text-xs font-semibold text-gray-800">{text}</span>
                <span className="text-xs text-gray-400">{sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Specs / Description tabs */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-100">
          {["specs", "description"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-semibold capitalize transition-colors
                ${activeTab === tab ? "text-[#0a1f44] border-b-2 border-[#0a1f44] bg-blue-50/30" : "text-gray-500 hover:text-gray-700"}`}>
              {tab === "specs" ? "Specifications" : "Description"}
            </button>
          ))}
        </div>
        <div className="p-6">
          {activeTab === "specs" ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {specs.map(({ label, value }) => (
                <div key={label} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-sm font-semibold text-gray-500 w-24 flex-shrink-0">{label}</span>
                  <span className="text-sm text-gray-900 font-medium">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 leading-relaxed">
              {product.description || "No description available for this part."}
            </p>
          )}
        </div>
      </div>

      {/* Ratings & Reviews */}
      <ReviewsSection product={product} auth={auth} refreshProduct={refreshProduct} />
    </div>
  );
}
