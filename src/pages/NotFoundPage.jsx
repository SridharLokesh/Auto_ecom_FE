import { Link } from 'react-router-dom';
import { Home, Search, AlertCircle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{ background: '#e8edf5' }}>
        <AlertCircle className="w-10 h-10" style={{ color: '#de1c0e' }} />
      </div>
      <p className="text-7xl font-black mb-2" style={{ color: '#e8edf5' }}>404</p>
      <h1 className="text-2xl font-black text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-gray-500 text-sm mb-8 max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link to="/" className="btn-primary text-sm px-5 py-2.5">
          <Home className="w-4 h-4" /> Go Home
        </Link>
        <Link to="/products" className="btn-secondary text-sm px-5 py-2.5">
          <Search className="w-4 h-4" /> Browse Products
        </Link>
      </div>
    </div>
  );
}
