import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

// role is passed so dealers/admins never trigger wishlist API calls
export const useWishlist = (isLoggedIn, role) => {
  const [wishlist, setWishlist] = useState({ products: [] });
  const [loading,  setLoading]  = useState(false);

  // Only regular customers have a wishlist
  const canUseWishlist = isLoggedIn && role === 'user';

  const fetchWishlist = useCallback(async () => {
    if (!canUseWishlist) return;
    try {
      const { data } = await api.get('/wishlist');
      setWishlist(data);
    } catch {}
  }, [canUseWishlist]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = useCallback(async (productId) => {
    setLoading(true);
    try {
      const { data } = await api.post('/wishlist/add', { productId });
      setWishlist(data);
      toast.success('Added to wishlist! ❤️');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to wishlist');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeFromWishlist = useCallback(async (productId) => {
    try {
      const { data } = await api.delete(`/wishlist/remove/${productId}`);
      setWishlist(data);
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Failed to remove');
    }
  }, []);

  const isInWishlist = useCallback(
    (productId) => wishlist.products?.some((p) => (p._id || p) === productId),
    [wishlist]
  );

  const wishlistCount = wishlist.products?.length || 0;

  return {
    wishlist,
    loading,
    wishlistCount,
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  };
};