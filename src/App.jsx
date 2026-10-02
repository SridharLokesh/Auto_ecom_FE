 //VITE_API_URL=https://backend-focus-seu6.onrender.com/api 
// THE ABOVE LINE IS USED TO CONNECT  THE DEPLOYED BACK IN .ENV FILE WE HAVE TO REPLACE IT ;

import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Suspense, lazy, useState, useCallback } from "react";

import { useAuth }          from "./hooks/useAuth";
import { useCart }          from "./hooks/useCart";
import { useWishlist }      from "./hooks/useWishlist";
import { useNotifications } from "./hooks/useNotifications";

import Navbar      from "./components/Navbar";
import Footer      from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";

const HomePage          = lazy(() => import("./pages/HomePage"));
const LoginPage         = lazy(() => import("./pages/LoginPage"));
const RegisterPage      = lazy(() => import("./pages/RegisterPage"));
const ProductsPage      = lazy(() => import("./pages/ProductsPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const CartPage          = lazy(() => import("./pages/CartPage"));
const WishlistPage      = lazy(() => import("./pages/WishlistPage"));
const CheckoutPage      = lazy(() => import("./pages/CheckoutPage"));
const ProfilePage       = lazy(() => import("./pages/ProfilePage"));
const InvoicePage       = lazy(() => import("./pages/InvoicePage"));
const BecomeDealerPage  = lazy(() => import("./pages/BecomeDealerPage"));
const DealerDashboard   = lazy(() => import("./pages/DealerDashboard"));
const AdminDashboard    = lazy(() => import("./pages/AdminDashboard"));
const CustomerCarePage  = lazy(() => import("./pages/CustomerCarePage"));
const NotFoundPage      = lazy(() => import("./pages/NotFoundPage"));

function PageSpinner() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#0a1f44] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function RequireAuth({ children, roles, user, isLoggedIn }) {
  const location = useLocation();
  if (!isLoggedIn)
    return <Navigate to={`/login?redirect=${location.pathname}`} replace />;
  if (roles && !roles.includes(user?.role))
    return <Navigate to="/" replace />;
  return children;
}

function GuestOnly({ children, isLoggedIn, authLoading }) {
  if (authLoading) return <PageSpinner />;
  if (isLoggedIn)  return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const auth         = useAuth();
  const { user, isLoggedIn, loading: authLoading } = auth;
  const cartHook     = useCart(isLoggedIn, user?.role);
  const wishlistHook = useWishlist(isLoggedIn, user?.role);
  const notifHook    = useNotifications(isLoggedIn);

  // ── Sub-pill visibility bridge ─────────────────────────────────────
  // ProductsPage reports whether its sub-category pills are on screen.
  // Navbar reads this to decide whether to show the sticky sub bar.
  // true  = pills visible on page → don't show sticky sub bar
  // false = pills scrolled out   → show sticky sub bar
  const [subPillsVisible, setSubPillsVisible] = useState(true);
  const handleSubPillsVisibility = useCallback((visible) => setSubPillsVisible(visible), []);

  const sharedProps = { auth, cartHook, wishlistHook, notifHook };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { background: "#1e293b", color: "#f8fafc", borderRadius: "12px", fontSize: "14px", fontWeight: 500 },
          success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
          error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />

      <div className="flex flex-col min-h-screen">
        <ScrollToTop />

        {/* Pass subPillsVisible so Navbar knows when to show sticky sub bar */}
        <Navbar {...sharedProps} subPillsVisible={subPillsVisible} />

        <main className="flex-1 pt-[116px] md:pt-[148px]">
          <Suspense fallback={<PageSpinner />}>
            <Routes>
              <Route path="/" element={<HomePage {...sharedProps} />} />

              {/* /products/category/:cat MUST be before /products/:id */}
              <Route path="/products"
                element={<ProductsPage {...sharedProps} onSubPillsVisibilityChange={handleSubPillsVisibility} />}
              />
              <Route path="/products/category/:cat"
                element={<ProductsPage {...sharedProps} onSubPillsVisibilityChange={handleSubPillsVisibility} />}
              />
              <Route path="/products/:id"
                element={<ProductDetailPage {...sharedProps} />}
              />

              <Route path="/become-dealer" element={<BecomeDealerPage />} />
              <Route path="/customer-care" element={<CustomerCarePage />} />
              <Route path="/orders"        element={<Navigate to="/profile?tab=orders" replace />} />

              <Route path="/login"
                element={<GuestOnly isLoggedIn={isLoggedIn} authLoading={authLoading}><LoginPage auth={auth} /></GuestOnly>}
              />
              <Route path="/register"
                element={<GuestOnly isLoggedIn={isLoggedIn} authLoading={authLoading}><RegisterPage auth={auth} /></GuestOnly>}
              />

              <Route path="/cart"
                element={<RequireAuth roles={["user"]} user={user} isLoggedIn={isLoggedIn}><CartPage {...sharedProps} /></RequireAuth>}
              />
              <Route path="/wishlist"
                element={<RequireAuth roles={["user"]} user={user} isLoggedIn={isLoggedIn}><WishlistPage {...sharedProps} /></RequireAuth>}
              />
              <Route path="/checkout"
                element={<RequireAuth roles={["user"]} user={user} isLoggedIn={isLoggedIn}><CheckoutPage {...sharedProps} /></RequireAuth>}
              />
              <Route path="/profile"
                element={<RequireAuth roles={["user"]} user={user} isLoggedIn={isLoggedIn}><ProfilePage auth={auth} /></RequireAuth>}
              />
              <Route path="/invoice"
                element={<RequireAuth roles={["user"]} user={user} isLoggedIn={isLoggedIn}><InvoicePage auth={auth} /></RequireAuth>}
              />
              <Route path="/dealer"
                element={<RequireAuth roles={["dealer"]} user={user} isLoggedIn={isLoggedIn}><DealerDashboard auth={auth} /></RequireAuth>}
              />
              <Route path="/dealer/inventory"
                element={<RequireAuth roles={["dealer"]} user={user} isLoggedIn={isLoggedIn}><DealerDashboard auth={auth} initialTab="inventory" /></RequireAuth>}
              />
              <Route path="/admin"
                element={<RequireAuth roles={["admin"]} user={user} isLoggedIn={isLoggedIn}><AdminDashboard auth={auth} /></RequireAuth>}
              />
              <Route path="/admin/inventory"
                element={<RequireAuth roles={["admin"]} user={user} isLoggedIn={isLoggedIn}><AdminDashboard auth={auth} initialTab="inventory" /></RequireAuth>}
              />
              <Route path="/admin/fulfillment-nodes"
                element={<RequireAuth roles={["admin"]} user={user} isLoggedIn={isLoggedIn}><AdminDashboard auth={auth} initialTab="fulfillment" /></RequireAuth>}
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>
    </>
  );
}