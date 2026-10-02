import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

// role is passed so dealers/admins never trigger cart API calls
export const useCart = (isLoggedIn, role) => {
  const [cart,    setCart]    = useState({ items: [], totalPrice: 0 });
  const [loading, setLoading] = useState(false);

  // Only regular customers have a cart
  const canUseCart = isLoggedIn && role === 'user';

  const fetchCart = useCallback(async () => {
    if (!canUseCart) return;
    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } catch {}
  }, [canUseCart]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (productId, quantity = 1, color) => {
    setLoading(true);
    try {
      const { data } = await api.post('/cart/add', { productId, quantity, color });
      setCart(data);
      toast.success('Added to cart! 🛒');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQuantity = useCallback(async (productId, quantity) => {
    try {
      const { data } = await api.put('/cart/update', { productId, quantity });
      setCart(data);
    } catch {
      toast.error('Failed to update cart');
    }
  }, []);

  const removeFromCart = useCallback(async (productId) => {
    try {
      const { data } = await api.delete(`/cart/remove/${productId}`);
      setCart(data);
      toast.success('Removed from cart');
    } catch {
      toast.error('Failed to remove item');
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      await api.delete('/cart/clear');
      setCart({ items: [], totalPrice: 0 });
    } catch {}
  }, []);

  const cartCount = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return {
    cart,
    loading,
    cartCount,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };
};