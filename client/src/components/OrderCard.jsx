import './OrderCard.css';

const statusFlow = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered'];

const OrderCard = ({ order, onStatusUpdate, isShopkeeper = false }) => {
  const getStatusClass = (status) => {
    return `badge badge-${status.toLowerCase()}`;
  };

  const getNextStatus = (current) => {
    const idx = statusFlow.indexOf(current);
    if (idx >= 0 && idx < statusFlow.length - 1) {
      return statusFlow[idx + 1];
    }
    return null;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const nextStatus = getNextStatus(order.order_status);

  return (
    <div className="order-card card fade-in">
      <div className="order-card-header">
        <div className="order-id">
          <span className="order-hash">#</span>
          {order._id?.slice(-8).toUpperCase()}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className={`badge ${order.payment_status === 'Paid' ? 'badge-confirmed' : order.payment_status === 'Failed' ? 'badge-cancelled' : 'badge-pending'}`}>
            💵 {order.payment_status || 'Pending'}
          </span>
          <span className={getStatusClass(order.order_status)}>
            {order.order_status}
          </span>
        </div>
      </div>

      <div className="order-card-meta">
        {isShopkeeper && order.customer && (
          <div className="order-meta-row">
            <span className="meta-label">Customer</span>
            <span className="meta-value">{order.customer.name} ({order.customer.phone || 'N/A'})</span>
          </div>
        )}
        {!isShopkeeper && order.shop && (
          <div className="order-meta-row">
            <span className="meta-label">Shop</span>
            <span className="meta-value">{order.shop.name}</span>
          </div>
        )}
        <div className="order-meta-row">
          <span className="meta-label">Date</span>
          <span className="meta-value">{formatDate(order.createdAt)}</span>
        </div>
      </div>

      {order.deliveryAddress && (
        <div className="order-meta-row" style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--border-color)' }}>
          <span className="meta-label">Delivery Address</span>
          <span className="meta-value" style={{ fontWeight: 'normal', fontSize: '0.8rem' }}>{order.deliveryAddress}</span>
        </div>
      )}

      {order.notes && (
        <div className="order-meta-row" style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--border-color)' }}>
          <span className="meta-label">Notes</span>
          <span className="meta-value" style={{ fontStyle: 'italic', fontWeight: 'normal', fontSize: '0.8rem', color: 'var(--text-muted)' }}>"{order.notes}"</span>
        </div>
      )}

      <div className="order-items-list">
        {order.items?.map((item, idx) => (
          <div key={idx} className="order-item-row">
            <span className="item-name">{item.name}</span>
            <span className="item-qty">×{item.quantity}</span>
            <span className="item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="order-card-footer">
        <div className="order-total">
          <span className="total-label">Total</span>
          <span className="total-amount">₹{order.totalAmount?.toFixed(2)}</span>
        </div>

        {isShopkeeper && nextStatus && order.order_status !== 'Cancelled' && (
          <div className="order-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onStatusUpdate(order._id, nextStatus)}
            >
              Mark as {nextStatus}
            </button>
            {order.order_status === 'Pending' && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => onStatusUpdate(order._id, 'Cancelled')}
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>

      {/* Status progress bar */}
      {order.order_status !== 'Cancelled' && (
        <div className="order-progress">
          {statusFlow.map((s, idx) => {
            const currentIdx = statusFlow.indexOf(order.order_status);
            return (
              <div
                key={s}
                className={`progress-step ${idx <= currentIdx ? 'completed' : ''} ${idx === currentIdx ? 'current' : ''}`}
              >
                <div className="step-dot" />
                <span className="step-label">{s}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderCard;
