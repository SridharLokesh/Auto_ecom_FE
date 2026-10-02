import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield } from "lucide-react";
import TVS_Logo from "../assets/TVS_logo_white.png";
import api from "../utils/api";
import { resolveUrl } from "../utils/settingsShared";

export default function LoginPage({ auth }) {
  const { login, loading } = auth;
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const from = params.get("redirect") || location.state?.from?.pathname || "/";

  const [form,    setForm]    = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [errors,  setErrors]  = useState({});

  const [pageText, setPageText] = useState({
    logo:     TVS_Logo,
    heading:  "Sign in to your account",
    subtitle: "Access genuine TVS parts and accessories",
  });

  useEffect(() => {
    api.get('/admin/site-settings')
      .then(({ data }) => {
        const a = data?.authPage;
        if (a) {
          setPageText({
            logo:     resolveUrl(a.logoImage) || TVS_Logo,
            heading:  a.loginHeading  || "Sign in to your account",
            subtitle: a.loginSubtitle || "Access genuine TVS parts and accessories",
          });
        }
      })
      .catch(() => { /* keep defaults */ });
  }, []);

  const handleChange = (key) => (e) => {
    let val = e.target.value;
    if (key === "email") val = val.replace(/\s/g, "").toLowerCase();
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((er) => ({ ...er, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email address";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6)
      e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await login(form.email, form.password);
    if (!result) return;

    if (result.role === "admin")       navigate("/admin",  { replace: true });
    else if (result.role === "dealer") navigate("/dealer", { replace: true });
    else navigate(from === "/login" ? "/" : from, { replace: true });
  };

  return (
    <div
      className="min-h-screen px-4 pt-6 pb-12
                 bg-gradient-to-br from-slate-900 via-[#0a1f44] to-slate-800
                 flex items-start justify-center"
    >
      <div className="w-full max-w-md">

        {/* Logo — fixed 120×40px, matches admin preview exactly */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-3">
            <div className="w-[120px] h-[40px] flex items-center justify-center mx-auto">
              <img
                src={pageText.logo}
                alt="TVS Motors"
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.src = TVS_Logo; }}
              />
            </div>
          </Link>
        </div>

        {/* Login / Register top tabs */}
        <div className="flex rounded-xl overflow-hidden border border-white/20 mb-6">
          <button
            className="flex-1 py-2.5 text-center text-sm font-bold bg-white text-[#0a1f44]"
          >
            Login
          </button>
          <Link
            to="/register"
            className="flex-1 py-2.5 text-center text-sm font-semibold
                       text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            Register
          </Link>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-2xl p-4">
          <h2 className="text-base font-extrabold text-gray-900 mb-0.5">
            {pageText.heading}
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            {pageText.subtitle}
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-3">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4
                                 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`input-field pl-10 ${errors.email ? "input-error" : ""}`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <span className="font-bold">⚠</span> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4
                                 text-gray-400 pointer-events-none" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange("password")}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`input-field pl-10 pr-10 ${errors.password ? "input-error" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-gray-700 transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <span className="font-bold">⚠</span> {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2 text-sm mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent
                                   rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-4 space-y-2">

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2
                            border border-gray-100">
              <span className="text-xs text-gray-500">New customer?</span>
              <Link
                to="/register"
                className="text-xs font-bold text-[#0a1f44] hover:underline"
              >
                Create account →
              </Link>
            </div>

            <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2
                            border border-blue-100">
              <span className="text-xs text-gray-500">Want to become a dealer?</span>
              <Link
                to="/become-dealer"
                className="text-xs font-bold text-[#0a1f44] hover:underline"
              >
                Apply here →
              </Link>
            </div>

            <p className="text-xs text-gray-400 flex items-center justify-center gap-1 pt-0.5">
              <Shield className="w-3 h-3" /> Secure 256-bit SSL encrypted login
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}