import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, Wrench } from "lucide-react";

export default function WishlistPage({  cartHook, wishlistHook }) {
  const navigate = useNavigate();
  const { wishlist, removeFromWishlist } = wishlistHook || {};
  const { addToCart } = cartHook || {};

  const products = wishlist?.products || [];
  const MAX = 25;

  const handleMoveToCart = (product) => {
    addToCart?.(product._id, 1, product.color);
    removeFromWishlist?.(product._id);
  };

  if (products.length === 0)
    return (
      <div className="page-wrapper min-h-screen flex items-center justify-center">
        <div className="text-center py-20">
          <div
            className="w-20 h-20 bg-gray-100 rounded-full flex items-center
                        justify-center mx-auto mb-4"
          >
            <Heart className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-2xl font-black text-gray-700 mb-2">
            Wishlist is empty
          </h2>
          <p className="text-gray-400 mb-6">
            Save parts you want to buy later — up to {MAX} items
          </p>
          <button
            onClick={() => navigate("/products")}
            className="btn-primary px-8 py-3"
          >
            Browse Parts
          </button>
        </div>
      </div>
    );

  return (
    <div className="page-wrapper min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-current" />
            My Wishlist
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {products.length} / {MAX} items saved
          </p>
        </div>
        {/* Progress bar */}
        <div className="hidden sm:block text-right">
          <p className="text-xs text-gray-400 mb-1 font-medium">
            {MAX - products.length} slots remaining
          </p>
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0a1f44] rounded-full transition-all"
              style={{ width: `${(products.length / MAX) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((product) => {
          if (!product?._id) return null;
          const discount =
            product.discount ||
            (product.originalPrice > product.price
              ? Math.round(
                  ((product.originalPrice - product.price) /
                    product.originalPrice) *
                    100,
                )
              : 0);

          return (
            <div key={product._id} className="card overflow-hidden group">
              {/* Image */}
              <div className="relative bg-gray-50">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-44 object-cover cursor-pointer
                             group-hover:scale-105 transition-transform duration-300"
                  onClick={() => navigate(`/products/${product._id}`)}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/200x180?text=No+Image";
                  }}
                />
                {discount > 0 && (
                  <span
                    className="absolute top-2 left-2 bg-[#0a1f44] text-white
                                   text-xs font-bold px-2 py-0.5 rounded-lg"
                  >
                    {discount}% OFF
                  </span>
                )}
                {/* Remove from wishlist */}
                <button
                  onClick={() => removeFromWishlist?.(product._id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white
                             rounded-full flex items-center justify-center shadow-md
                             hover:bg-red-600 transition-colors"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-xs text-[#0a1f44] font-bold flex items-center gap-1 mb-0.5">
                  <Wrench className="w-3 h-3" /> {product.brand}
                </p>
                <p
                  className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2
                             cursor-pointer hover:text-[#0a1f44] transition-colors"
                  onClick={() => navigate(`/products/${product._id}`)}
                >
                  {product.title}
                </p>
                <p className="font-black text-gray-900 text-sm mb-3">
                  ₹{product.price?.toLocaleString("en-IN")}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleMoveToCart(product)}
                    className="flex-1 flex items-center justify-center gap-1 btn-primary
                               text-xs py-2"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Move to Cart
                  </button>
                  <button
                    onClick={() => removeFromWishlist?.(product._id)}
                    className="p-2 text-gray-400 hover:text-red-500
                               hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
