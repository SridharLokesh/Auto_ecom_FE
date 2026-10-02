// OrdersPage.jsx — redirects to ProfilePage orders tab
// This file is kept for any legacy imports; the actual route in App.jsx
// redirects /orders → /profile?tab=orders
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OrdersPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/profile?tab=orders", { replace: true });
  }, [navigate]);
  return null;
}