import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-8 flex justify-center">
          <AlertCircle className="text-white" size={80} />
        </div>
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-xl text-primary-100 mb-2">Page Not Found</p>
        <p className="text-primary-200 mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/dashboard"
          className="inline-block bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
