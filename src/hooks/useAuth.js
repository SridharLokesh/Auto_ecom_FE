import { useState, useCallback } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";

const USER_KEY = "tvs_user";

export function useAuth() {
  const [user,    setUser]    = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const isLoggedIn = !!user;
  const isAdmin    = user?.role === "admin";

  /* ── LOGIN ──
     Backend /auth/login expects { email, password, loginType }
     loginType: "user" | "dealer" | "admin"
     Backend uses loginType to validate role match and returns 403 if mismatched.
  */
  const login = useCallback(async (email, password, loginType = "user") => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", {
        email,
        password,
        loginType,
      });

      localStorage.setItem(USER_KEY, JSON.stringify(data));
      setUser(data);
      toast.success(`Welcome back, ${data.name}! 👋`);
      return data;
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.message;

      if (status === 403) {
        toast.error(msg || "Access denied. Check you are using the correct login tab.", { duration: 5000 });
      } else if (status === 401) {
        toast.error(msg || "Incorrect email or password.");
      } else {
        toast.error(msg || "Login failed. Please try again.");
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── REGISTER ── */
  const register = useCallback(async (name, email, password, phone) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
        phone,
      });
      localStorage.setItem(USER_KEY, JSON.stringify(data));
      setUser(data);
      toast.success(`Account created! Welcome, ${data.name}! 🎉`);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed.";
      toast.error(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── LOGOUT ── */
  const logout = useCallback(() => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
    toast.success("Logged out successfully");
  }, []);

  /* ── UPDATE USER in localStorage after profile edit ── */
  const updateUser = useCallback(
    (updatedData) => {
      const merged = { ...user, ...updatedData };
      localStorage.setItem(USER_KEY, JSON.stringify(merged));
      setUser(merged);
    },
    [user],
  );

  return {
    user,
    loading,
    isLoggedIn,
    isAdmin,
    login,
    register,
    logout,
    updateUser,
  };
}