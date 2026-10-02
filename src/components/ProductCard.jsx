import { Heart, ShoppingCart, Star, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23f3f4f6'/%3E%3Crect x='110' y='60' width='80' height='60' rx='6' fill='%23d1d5db'/%3E%3Ccircle cx='130' cy='155' r='12' fill='%23d1d5db'/%3E%3Ccircle cx='170' cy='155' r='12' fill='%23d1d5db'/%3E%3Ctext x='150' y='185' text-anchor='middle' font-family='sans-serif' font-size='11' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function ProductCard({ product, auth, cartHook, wishlistHook }) {
  const navigate = useNavigate();
  const { isLoggedIn, user } = auth || {};
  const { addToCart, cartLoading } = cartHook || {};
  const { addToWishlist, removeFromWishlist, isInWishlist } = wishlistHook || {};

  if (!product) return null;

  // Only regular customers (and guests) can use cart & wishlist
  // Dealers and admins are view-only
  const isCustomer = isLoggedIn && user?.role === "user";
  const canShop    = !isLoggedIn || isCustomer;

  const inWishlist = isInWishlist?.(product._id) || false;
  const discount =
    product.discount ||
    (product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0);

  const goDetail = () => navigate(`/products/${product._id}`);

  const handleCart = (e) => {
    e.stopPropagation();
    if (!isLoggedIn) { navigate("/login"); return; }
    addToCart?.(product._id, 1, product.color);
  };

  const handleWish = (e) => {
    e.stopPropagation();
    if (!isLoggedIn) { navigate("/login"); return; }
    inWishlist ? removeFromWishlist?.(product._id) : addToWishlist?.(product._id);
  };

  return (
    <div
      onClick={goDetail}
      className="card cursor-pointer overflow-hidden group
                 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Image */}
      <div className="relative bg-gray-50 overflow-hidden">
        <img
          src={product.image || FALLBACK_IMG}
          alt={product.title}
          className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-[#de1c0e] text-white text-xs font-bold px-2 py-0.5 rounded-lg">
            {discount}% OFF
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <span className="absolute bottom-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            Only {product.stock} left!
          </span>
        )}

        {/* Wishlist button — customers and guests only */}
        {canShop && (
          <button
            onClick={handleWish}
            onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); if (!isLoggedIn) { navigate("/login"); return; } inWishlist ? removeFromWishlist?.(product._id) : addToWishlist?.(product._id); }}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full shadow-md z-10
                        flex items-center justify-center transition-all
                        ${inWishlist ? "bg-red-500 text-white" : "bg-white text-gray-400 hover:text-red-500"}`}
          >
            <Heart className={`w-4 h-4 ${inWishlist ? "fill-current" : ""}`} />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        {/* Brand */}
        <p className="text-xs text-[#0a1f44] font-bold uppercase tracking-wide mb-0.5 flex items-center gap-1">
          <Wrench className="w-3 h-3" /> {product.brand}
        </p>

        {/* Title — always 2 lines tall */}
        <h3
          className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-2"
          style={{ minHeight: "2.6rem" }}
        >
          {product.title}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="flex items-center gap-0.5 bg-green-100 text-green-800 text-xs font-bold px-1.5 py-0.5 rounded">
            {product.rating}
            <Star className="w-3 h-3 fill-current text-yellow-500" />
          </span>
          {product.numReviews > 0 && (
            <span className="text-xs text-gray-400">({product.numReviews})</span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="text-base font-extrabold text-gray-900">
            ₹{product.price?.toLocaleString("en-IN")}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-xs text-gray-400 line-through">
              ₹{product.originalPrice?.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* Add to Cart — customers and guests only */}
        {canShop ? (
          <button
            onClick={handleCart}
            onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); if (!isLoggedIn) { navigate("/login"); return; } if (product.stock === 0 || cartLoading) return; addToCart?.(product._id, 1, product.color); }}
            disabled={product.stock === 0 || cartLoading}
            className="w-full flex items-center justify-center gap-1.5 relative z-10
                       bg-[#0a1f44] hover:bg-[#0d2657]
                       disabled:bg-gray-200 disabled:cursor-not-allowed
                       text-white disabled:text-gray-400
                       text-xs font-semibold py-2 rounded-xl
                       transition-colors active:scale-95"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </button>
        ) : (
          <button
            onClick={goDetail}
            className="w-full flex items-center justify-center gap-1.5 relative z-10
                       border-2 border-gray-200 text-gray-500
                       text-xs font-semibold py-2 rounded-xl
                       transition-colors hover:border-[#0a1f44] hover:text-[#0a1f44]"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
}