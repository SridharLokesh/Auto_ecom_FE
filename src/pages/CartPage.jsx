import { useNavigate } from "react-router-dom";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ArrowRight,
  ShoppingBag,
  Wrench,
  Lock,
  BadgeCheck,
  Truck,
} from "lucide-react";
import CartFulfillmentPanel from "../components/fulfillment/CartFulfillmentPanel";

export default function CartPage({ cartHook }) {
  const navigate = useNavigate();
  const { cart, updateCartItem, removeFromCart } = cartHook || {};

  const items = cart?.items || [];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;

  if (items.length === 0)
    return (
      <div className="page-wrapper min-h-screen flex items-center justify-center">
        <div className="text-center py-20">
          <div
            className="w-20 h-20 bg-gray-100 rounded-full flex items-center
                        justify-center mx-auto mb-4"
          >
            <ShoppingCart className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-2xl font-black text-gray-700 mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-400 mb-6">
            Browse genuine TVS parts and add them to your cart
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
      <h1 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
        <ShoppingCart className="w-6 h-6 text-[#0a1f44]" />
        Shopping Cart
        <span className="text-sm font-normal text-gray-400 ml-1">
          ({items.length} {items.length === 1 ? "item" : "items"})
        </span>
      </h1>
      
      <CartFulfillmentPanel items={items} />
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => {
            const product = item.product;
            if (!product) return null;
            return (
              <div
                key={item._id || product._id}
                className="card p-4 flex gap-4"
              >
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-20 h-20 object-cover rounded-xl bg-gray-100
                             flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/products/${product._id}`)}
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/80";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#0a1f44] font-bold flex items-center gap-1 mb-0.5">
                    <Wrench className="w-3 h-3" /> {product.brand}
                  </p>
                  <p
                    className="text-sm font-semibold text-gray-800 line-clamp-2
                               cursor-pointer hover:text-[#0a1f44] transition-colors"
                    onClick={() => navigate(`/products/${product._id}`)}
                  >
                    {product.title}
                  </p>
                  {item.color && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Variant: {item.color}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-gray-900">
                        ₹{item.price?.toLocaleString("en-IN")}
                      </span>
                      {product.originalPrice > item.price && (
                        <span className="text-xs text-gray-400 line-through">
                          ₹{product.originalPrice?.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Qty control */}
                      <div
                        className="flex items-center border-2 border-gray-200
                                      rounded-xl overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            updateCartItem(product._id, item.quantity - 1)
                          }
                          className="p-1.5 hover:bg-gray-100 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateCartItem(product._id, item.quantity + 1)
                          }
                          className="p-1.5 hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(product._id)}
                        className="p-1.5 text-red-400 hover:text-red-600
                                   hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-36">
            <h2 className="text-lg font-black text-gray-900 mb-4">
              Order Summary
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({items.length} items)</span>
                <span className="font-semibold text-gray-900">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charges</span>
                <span
                  className={`font-semibold ${shipping === 0 ? "text-green-600" : "text-gray-900"}`}
                >
                  {shipping === 0 ? "FREE" : `₹${shipping}`}
                </span>
              </div>
              {subtotal < 999 && (
                <p className="text-xs text-[#0a1f44] bg-blue-50 px-3 py-2 rounded-lg font-medium">
                  Add ₹{(999 - subtotal).toLocaleString("en-IN")} more for FREE
                  delivery
                </p>
              )}
              <div
                className="border-t border-gray-100 pt-3 flex justify-between
                              font-black text-gray-900"
              >
                <span>Total Amount</span>
                <span className="text-lg">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate("/checkout")}
              className="btn-primary w-full py-3 mt-5 text-sm"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/products")}
              className="w-full mt-3 flex items-center justify-center gap-2
                         border-2 border-gray-200 hover:border-[#0a1f44]
                         text-gray-600 font-semibold py-2.5 rounded-xl
                         transition-all text-sm"
            >
              <ShoppingBag className="w-4 h-4" /> Continue Shopping
            </button>

            {/* Trust */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
              {[
                { label: "Secure Checkout", icon: Lock },
                { label: "OEM Certified Parts", icon: BadgeCheck },
                { label: "Fast Dispatch", icon: Truck },
              // eslint-disable-next-line no-unused-vars
              ].map(({ label, icon: Icon }) => (
                <p
                  key={label}
                  className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5"
                >
                  <Icon className="w-3.5 h-3.5 text-gray-400" />
                  {label}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
