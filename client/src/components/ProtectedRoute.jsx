import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — guards routes by authentication and role.
 * @param {string} role - Required role ('Customer' | 'Shopkeeper') or undefined for any authenticated user
 */
const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    // Redirect to correct dashboard based on role
    if (user?.role === 'Customer') {
      return <Navigate to="/customer/browse" replace />;
    }
    return <Navigate to="/shopkeeper/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
