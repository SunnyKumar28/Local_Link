import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { orderAPI, productAPI } from '../../services/api';
import { HiCube, HiClipboardList, HiTrendingUp, HiCurrencyRupee } from 'react-icons/hi';
import toast from 'react-hot-toast';
import './Shopkeeper.css';

const ShopkeeperDashboard = () => {
  const { user, shop } = useAuth();
  const { socket, isConnected } = useSocket();
  const [stats, setStats] = useState({ products: 0, orders: 0, pending: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, ordersRes] = await Promise.all([
          productAPI.getMyInventory(),
          orderAPI.getShopOrders(),
        ]);
        const orders = ordersRes.data.orders;
        const pending = orders.filter((o) => o.order_status === 'Pending').length;
        const revenue = orders
          .filter((o) => o.order_status === 'Delivered')
          .reduce((sum, o) => sum + o.totalAmount, 0);
        setStats({
          products: prodRes.data.count,
          orders: orders.length,
          pending,
          revenue,
        });
        setRecentOrders(orders.slice(0, 5));
      } catch (err) {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNewOrder = (data) => {
      toast.success(data.message, { icon: '🔔', duration: 5000 });
      setRecentOrders((prev) => [data.order, ...prev].slice(0, 5));
      setStats((prev) => ({
        ...prev,
        orders: prev.orders + 1,
        pending: prev.pending + 1,
      }));
    };
    socket.on('new_order', handleNewOrder);
    return () => { socket.off('new_order', handleNewOrder); };
  }, [socket]);

  const statCards = [
    { icon: <HiCube />, label: 'Products', value: stats.products, color: '#6c5ce7' },
    { icon: <HiClipboardList />, label: 'Total Orders', value: stats.orders, color: '#0984e3' },
    { icon: <HiTrendingUp />, label: 'Pending', value: stats.pending, color: '#fdcb6e' },
    { icon: <HiCurrencyRupee />, label: 'Revenue', value: `₹${stats.revenue.toFixed(0)}`, color: '#00b894' },
  ];

  return (
    <div className="shopkeeper-page container fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Welcome, <span className="highlight">{user?.name}</span></h1>
          <p className="page-subtitle">{shop?.name || 'Your Shop'} — Dashboard</p>
        </div>
        <div className={`live-indicator ${isConnected ? 'live' : ''}`}>
          <span className="live-dot" />
          {isConnected ? 'Live' : 'Offline'}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card card">
            <div className="stat-icon" style={{ color: s.color, background: `${s.color}15` }}>
              {s.icon}
            </div>
            <div className="stat-info">
              <span className="stat-value">{loading ? '...' : s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/shopkeeper/inventory" className="btn btn-primary">
          <HiCube /> Manage Inventory
        </Link>
        <Link to="/shopkeeper/orders" className="btn btn-secondary">
          <HiClipboardList /> View All Orders
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="recent-section">
        <h2 className="section-title">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No orders yet</h3>
            <p>Orders will appear here in real-time</p>
          </div>
        ) : (
          <div className="recent-orders-list">
            {recentOrders.map((order) => (
              <div key={order._id} className="recent-order-row card">
                <div className="ro-left">
                  <span className="ro-id">#{order._id?.slice(-6).toUpperCase()}</span>
                  <span className="ro-customer">{order.customer?.name}</span>
                </div>
                <div className="ro-right">
                  <span className="ro-amount">₹{order.totalAmount?.toFixed(0)}</span>
                  <span className={`badge badge-${order.order_status.toLowerCase()}`}>
                    {order.order_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopkeeperDashboard;
