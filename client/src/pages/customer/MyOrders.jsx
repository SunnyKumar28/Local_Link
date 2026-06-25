import { useState, useEffect, useCallback } from 'react';
import { orderAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import OrderCard from '../../components/OrderCard';
import toast from 'react-hot-toast';
import './Customer.css';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await orderAPI.getMyOrders();
      setOrders(data.orders);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (!socket) return;
    const handleStatusUpdate = (data) => {
      toast.success(data.message, { icon: '📦' });
      setOrders((prev) =>
        prev.map((o) => (o._id === data.order._id ? data.order : o))
      );
    };
    socket.on('order_status_update', handleStatusUpdate);
    return () => { socket.off('order_status_update', handleStatusUpdate); };
  }, [socket]);

  return (
    <div className="customer-page container fade-in">
      <div className="page-section-header">
        <h1 className="page-title">My Orders</h1>
        <p className="page-subtitle">Track your orders in real-time</p>
      </div>
      {loading ? (
        <div className="orders-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 200, marginBottom: 16, borderRadius: 16 }} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No orders yet</h3>
          <p>Browse shops and place your first order!</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
