import { useState, useEffect, useCallback } from 'react';
import { orderAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import OrderCard from '../../components/OrderCard';
import toast from 'react-hot-toast';
import './Shopkeeper.css';

const STATUSES = ['All', 'Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];

const IncomingOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const { socket } = useSocket();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = filter !== 'All' ? { status: filter } : {};
      const { data } = await orderAPI.getShopOrders(params);
      setOrders(data.orders);
    } catch (err) { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Real-time new order
  useEffect(() => {
    if (!socket) return;
    const handleNewOrder = (data) => {
      toast.success(data.message, { icon: '🔔', duration: 5000 });
      setOrders((prev) => [data.order, ...prev]);
    };
    const handleUpdated = (data) => {
      setOrders((prev) => prev.map((o) => (o._id === data.order._id ? data.order : o)));
    };
    socket.on('new_order', handleNewOrder);
    socket.on('order_updated', handleUpdated);
    return () => { socket.off('new_order', handleNewOrder); socket.off('order_updated', handleUpdated); };
  }, [socket]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, { order_status: newStatus });
      toast.success(`Order marked as ${newStatus}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
  };

  return (
    <div className="shopkeeper-page container fade-in">
      <div className="page-section-header">
        <h1 className="page-title">Incoming Orders</h1>
        <p className="page-subtitle">Manage and update order statuses in real-time</p>
      </div>

      <div className="category-tabs" style={{ marginBottom: 24 }}>
        {STATUSES.map((s) => (
          <button key={s} className={`category-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="orders-list">{[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 200, marginBottom: 16, borderRadius: 16 }} />)}</div>
      ) : orders.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">📋</div><h3>No orders</h3><p>{filter !== 'All' ? `No ${filter} orders` : 'Orders will appear here in real-time'}</p></div>
      ) : (
        <div className="orders-list" style={{ maxWidth: 700 }}>
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} isShopkeeper onStatusUpdate={handleStatusUpdate} />
          ))}
        </div>
      )}
    </div>
  );
};

export default IncomingOrders;
