/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin, CreditCard, CheckCircle, ChevronRight,
  Wrench, Lock, BadgeCheck, Truck,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/api";
import CheckoutAddressPicker from "../components/CheckoutAddressPicker";

import { 
  validateCheckout, 
  releaseCheckout, 
  describeCheckoutError,
  createOrderFromCheckout
 } from "../services/checkoutService";

const STEPS = ["Address", "Payment", "Review"];

const PAYMENT_OPTS = [
  { value: "COD",        label: "Cash on Delivery",     desc: "Pay when parts arrive",          icon: "💵" },
  { value: "UPI",        label: "UPI Payment",           desc: "PhonePe, GPay, Paytm",           icon: "📱" },
  { value: "Card",       label: "Credit / Debit Card",   desc: "Visa, Mastercard, RuPay",        icon: "💳" },
  { value: "NetBanking", label: "Net Banking",            desc: "All major banks supported",      icon: "🏦" },
];

export default function CheckoutPage({ auth, cartHook }) {
  const { user } = auth || {};
  const { cart, clearCart } = cartHook || {};
  const navigate = useNavigate();

  const [step,            setStep]            = useState(1);
  const [addresses,       setAddresses]       = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod,   setPaymentMethod]   = useState("COD");
  const [placing,         setPlacing]         = useState(false);

  const items    = cart?.items || [];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal >= 999 ? 0 : 99;
  const total    = subtotal + shipping;

  useEffect(() => {
    api.get("/user/profile")
      .then(({ data }) => {
        const addrs = data.addresses || [];
        setAddresses(addrs);
        const def = addrs.find((a) => a.isDefault) || addrs[0];
        if (def) setSelectedAddress(def);
      })
      .catch(() => {});
  }, []);

   const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error("Please select a delivery address"); return; }
    setPlacing(true);

    // Phase 4/5 — confirm inventory is still actually available near the
    // customer, put a short hold on it, then convert that hold into a
    // real order (Phase 5's integrity-checked path derives quantity/
    // price/dealer from the server-side reservation, never from this
    // request body). If location isn't available in this browser/
    // session, we don't hard-block checkout — fall back to the legacy
    // order-creation flow instead.
    // The nearest dealer is found from the selected delivery address (its
    // saved coordinates, or located once from its text). The browser is
    // never asked for location here.
    let checkoutSessionId = null;
    try {
      const result = await validateCheckout({ addressId: selectedAddress._id });
      checkoutSessionId = result.checkoutSessionId;
    } catch (err) {
      toast.error(err.message || describeCheckoutError(err.code));
      if (err.code === "ADDRESS_LOCATION_UNAVAILABLE") setStep(1); // pick another address / use current location
      setPlacing(false);
      return;
    }

    // Fulfillment-aware checkout is mandatory. Never fall back to the legacy
    // /orders endpoint because that endpoint does not reserve node inventory.
    try {
      await createOrderFromCheckout({
        checkoutSessionId,
        shippingAddress: selectedAddress,
        paymentMethod,
      });
      await clearCart?.();
      toast.success("Order placed successfully! 🎉");
      navigate("/profile?tab=orders");
    } catch (err) {
      // Order creation failed — free the hold immediately rather than
      // making the customer wait out the reservation TTL to retry.
      releaseCheckout({ checkoutSessionId }).catch(() => {});
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) { navigate("/cart"); return null; }

  return (
    <div className="page-wrapper min-h-screen">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Checkout</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
              ${step === i + 1 ? "bg-[#0a1f44] text-white"
                : step > i + 1 ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-400"}`}>
              {step > i + 1
                ? <CheckCircle className="w-4 h-4" />
                : <span className="w-4 h-4 flex items-center justify-center font-black">{i + 1}</span>}
              {s}
            </div>
            {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main steps */}
        <div className="lg:col-span-2">
          {/* Step 1 — Address */}
          {step === 1 && (
            <div className="card p-6">
              <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#0a1f44]" /> Delivery Address
              </h2>
              <CheckoutAddressPicker
                addresses={addresses}
                onAddressesChange={setAddresses}
                selectedAddress={selectedAddress}
                onSelect={setSelectedAddress}
                items={items}
              />
              <button onClick={() => selectedAddress && setStep(2)} disabled={!selectedAddress}
                className="btn-primary w-full py-3 mt-5">
                Continue to Payment
              </button>
            </div>
          )}

          {/* Step 2 — Payment */}
          {step === 2 && (
            <div className="card p-6">
              <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#0a1f44]" /> Payment Method
              </h2>
              <div className="space-y-3">
                {PAYMENT_OPTS.map(({ value, label, desc, icon }) => (
                  <label key={value}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${paymentMethod === value
                        ? "border-[#0a1f44] bg-blue-50/40"
                        : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="payment" value={value}
                      checked={paymentMethod === value}
                      onChange={() => setPaymentMethod(value)}
                      className="accent-[#0a1f44]" />
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(1)}
                  className="flex-1 border-2 border-gray-200 hover:border-gray-300
                             text-gray-600 font-semibold py-3 rounded-xl transition-all text-sm">
                  ← Back
                </button>
                <button onClick={() => setStep(3)} className="flex-1 btn-primary py-3">
                  Review Order →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="card p-6">
              <h2 className="text-lg font-black text-gray-900 mb-4">Review Your Order</h2>
              <div className="space-y-3 mb-5">
                {items.map((item) => (
                  <div key={item._id} className="flex items-center gap-3">
                    <img src={item.product?.image} alt=""
                      className="w-12 h-12 object-cover rounded-xl bg-gray-100 flex-shrink-0"
                      onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {item.product?.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        Qty: {item.quantity} × ₹{item.price?.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span className="font-black text-sm text-gray-900">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-5 border border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>Deliver to</span>
                  <span className="text-right text-xs max-w-48 font-medium text-gray-800">
                    {selectedAddress?.street}, {selectedAddress?.city}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Payment</span>
                  <span className="font-semibold text-gray-800">{paymentMethod}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)}
                  className="flex-1 border-2 border-gray-200 hover:border-gray-300
                             text-gray-600 font-semibold py-3 rounded-xl transition-all text-sm">
                  ← Back
                </button>
                <button onClick={handlePlaceOrder} disabled={placing}
                  className="flex-1 btn-primary py-3 text-sm disabled:opacity-60">
                  {placing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Placing…
                    </span>
                  ) : `Place Order · ₹${total.toLocaleString("en-IN")}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-36">
            <h3 className="font-black text-gray-900 mb-4">Price Details</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Parts ({items.length})</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className={shipping === 0 ? "text-green-600 font-semibold" : ""}>
                  {shipping === 0 ? "FREE" : `₹${shipping}`}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between
                              font-black text-gray-900 text-base">
                <span>Total</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>
            {subtotal < 999 && (
              <p className="text-xs text-[#0a1f44] mt-3 bg-blue-50 px-3 py-2 rounded-lg font-medium">
                Add ₹{(999 - subtotal).toLocaleString("en-IN")} more for free delivery
              </p>
            )}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
              {[
                { label: "Secure Checkout",    icon: Lock },
                { label: "OEM Certified Parts",icon: BadgeCheck },
                { label: "Fast Dispatch",      icon: Truck },
              ].map(({ label, icon: Icon }) => (
                <p key={label}
                  className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-gray-400" /> {label}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}