import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, token, fetchProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token && isAuthenticated()) {
      fetchProfile().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader className="animate-spin text-primary-600" size={40} />
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  return children;
}
