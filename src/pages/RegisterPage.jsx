import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import TVS_Logo from "../assets/TVS_logo_white.png";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function Field({ label, id, type = "text", icon: Icon, placeholder, error, value, onChange }) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-gray-700 mb-1 block">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={id}
          className={`input-field pl-10 ${error ? "input-error" : ""}`}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <span>⚠</span>{error}
        </p>
      )}
    </div>
  );
}

export default function RegisterPage({ auth }) {
  const { register, loading } = auth;
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [showPassword, setShowPassword]           = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (key) => (e) => {
    let value = e.target.value;
    if (key === "name")  value = value.replace(/[^a-zA-Z\s'-]/g, "");
    if (key === "email") value = value.replace(/\s/g, "").toLowerCase();
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handlePhone = (phone) => {
    setForm((prev) => ({ ...prev, phone }));
    setErrors((prev) => ({ ...prev, phone: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    else if (form.name.trim().length < 2) e.name = "Name must be at least 2 characters";
    if (!form.email) e.email = "Email is required";
    else if (!EMAIL_RE.test(form.email)) e.email = "Enter a valid email (e.g. you@example.com)";
    if (form.phone && form.phone.replace(/\D/g, "").length < 8)
      e.phone = "Enter a valid phone number";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Minimum 6 characters required";
    if (!form.confirm) e.confirm = "Please confirm your password";
    else if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const userData = await register(form.name.trim(), form.email, form.password, form.phone);
    if (userData) navigate("/", { replace: true });
  };

  const phoneBorder = errors.phone ? "2px solid #f87171" : "2px solid #e5e7eb";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-6
                 bg-gradient-to-br from-slate-900 via-[#0a1f44] to-slate-800"
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-3">
            <img src={TVS_Logo} alt="TVS Motors" className="w-full h-12 object-contain" />
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-white/20 mb-6">
          <Link
            to="/login"
            className="flex-1 py-2.5 text-center text-sm font-semibold text-white/60
                       hover:text-white hover:bg-white/10 transition-colors"
          >
            Login
          </Link>
          <div className="flex-1 py-2.5 text-center text-sm font-bold bg-white text-[#0a1f44]">
            Register
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-2xl p-4">
          <h2 className="text-base font-extrabold text-gray-900 mb-0.5">
            Create your account
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Join TVS Motors — Official Parts Store
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-3">

            {/* Full Name */}
            <Field
              label="Full Name *"
              id="name"
              icon={User}
              placeholder="e.g. Rahul Sharma"
              error={errors.name}
              value={form.name}
              onChange={handleChange("name")}
            />

            {/* Email */}
            <Field
              label="Email Address *"
              id="email"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              error={errors.email}
              value={form.email}
              onChange={handleChange("email")}
            />

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">
                Phone Number{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <PhoneInput
                country="in"
                value={form.phone}
                onChange={handlePhone}
                enableSearch
                countryCodeEditable={false}
                placeholder="Enter phone number"
                inputProps={{ name: "phone", autoComplete: "tel" }}
                containerStyle={{ width: "100%" }}
                inputStyle={{
                  width: "100%",
                  height: "34px",
                  paddingLeft: "58px",
                  borderRadius: "10px",
                  border: phoneBorder,
                  fontSize: "12px",
                  backgroundColor: "#ffffff",
                }}
                buttonStyle={{
                  borderTopLeftRadius: "10px",
                  borderBottomLeftRadius: "10px",
                  border: phoneBorder,
                  borderRight: "none",
                  backgroundColor: "#f9fafb",
                  paddingLeft: "6px",
                  paddingRight: "4px",
                }}
                dropdownStyle={{ borderRadius: "10px" }}
              />
              {errors.phone && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠</span> {errors.phone}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange("password")}
                  placeholder="Min 6 characters"
                  autoComplete="new-password"
                  className={`input-field pl-10 pr-10 ${errors.password ? "input-error" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠</span> {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirm}
                  onChange={handleChange("confirm")}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className={`input-field pl-10 pr-10 ${errors.confirm ? "input-error" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirm && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠</span> {errors.confirm}
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
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create Account <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-3">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-[#0a1f44] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}