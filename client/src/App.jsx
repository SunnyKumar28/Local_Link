import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import ProductBrowse from './pages/customer/ProductBrowse';
import MyOrders from './pages/customer/MyOrders';
import ShopkeeperDashboard from './pages/shopkeeper/ShopkeeperDashboard';
import InventoryManager from './pages/shopkeeper/InventoryManager';
import IncomingOrders from './pages/shopkeeper/IncomingOrders';
import './App.css';

const HomeRedirect = () => {
  const { isAuthenticated, isShopkeeper } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return isShopkeeper
    ? <Navigate to="/shopkeeper/dashboard" replace />
    : <Navigate to="/customer/browse" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Customer Routes */}
      <Route path="/customer/browse" element={<ProtectedRoute role="Customer"><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/customer/shop/:shopId" element={<ProtectedRoute role="Customer"><ProductBrowse /></ProtectedRoute>} />
      <Route path="/customer/orders" element={<ProtectedRoute role="Customer"><MyOrders /></ProtectedRoute>} />

      {/* Shopkeeper Routes */}
      <Route path="/shopkeeper/dashboard" element={<ProtectedRoute role="Shopkeeper"><ShopkeeperDashboard /></ProtectedRoute>} />
      <Route path="/shopkeeper/inventory" element={<ProtectedRoute role="Shopkeeper"><InventoryManager /></ProtectedRoute>} />
      <Route path="/shopkeeper/orders" element={<ProtectedRoute role="Shopkeeper"><IncomingOrders /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="app">
            <Navbar />
            <main className="app-main">
              <AppRoutes />
            </main>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1a25',
                color: '#f0f0f5',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                fontSize: '0.9rem',
              },
              success: { iconTheme: { primary: '#00b894', secondary: '#1a1a25' } },
              error: { iconTheme: { primary: '#e17055', secondary: '#1a1a25' } },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
