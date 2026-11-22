import { ArrowRight, Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { formatCurrency } from '../utils/formatCurrency.js';

const paymentLabels = {
  cod: 'Tiền mặt khi nhận (COD demo)',
  'transfer-demo': 'Chuyển khoản (demo)',
};

const deliveryLabels = {
  pickup: 'Nhận tại quán',
  delivery: 'Giao tận nơi (mô phỏng)',
};

export default function OrderSuccessPage({ orderId, onNavigate }) {
  const { orders } = useCart();
  const order = orders.find((entry) => entry.id === orderId);

  if (!order) {
    return (
      <main className="success-page">
        <section className="success-card missing-order">
          <span className="success-icon"><ShoppingBag size={27} /></span>
          <h1>Chưa tìm thấy đơn hàng</h1>
          <p>Đơn demo có thể đã được xóa khỏi lịch sử trên thiết bị này.</p>
          <button className="button button-primary" type="button" onClick={() => onNavigate('orders')}>
            Xem lịch sử đơn hàng <ArrowRight size={17} />
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="success-page">
      <section className="success-card">
        <span className="simulation-stamp">ĐƠN HÀNG MÔ PHỎNG</span>
        <div className="success-icon"><Heart size={28} fill="currentColor" /></div>
        <span className="section-kicker">GẤU & TÁO · TAKI MATCHA</span>
        <h1>Cảm ơn bạn đã mua hàng của Gấu và Táo! 💚</h1>
        <p className="success-message">
          Gấu & Táo cảm ơn bạn đã chọn TAKI Matcha. Hy vọng chút xanh ngọt ngào này sẽ khiến ngày của bạn thêm vui và dễ thương hơn!
        </p>
        <p className="success-quote">Một ly matcha nhỏ, một niềm vui xinh. Cảm ơn bạn vì đã dành tình yêu cho Gấu & Táo.</p>

        <div className="order-detail-card">
          <div className="order-detail-heading">
            <div><span>MÃ ĐƠN DEMO</span><strong>{order.id}</strong></div>
            <span className="order-status">{order.status}</span>
          </div>
          <div className="order-meta">
            <span>Thời gian</span>
            <b>{new Date(order.createdAt).toLocaleString('vi-VN')}</b>
            <span>Người nhận</span><b>{order.customer.name}</b>
            <span>Điện thoại</span><b>{order.customer.phone}</b>
            <span>Hình thức nhận</span><b>{deliveryLabels[order.deliveryMethod] || 'Mô phỏng'}</b>
            {order.deliveryMethod === 'delivery' && <><span>Địa chỉ</span><b>{order.customer.address}</b></>}
            <span>Thanh toán</span><b>{paymentLabels[order.paymentMethod] || 'Demo'}</b>
          </div>
          <div className="order-detail-items">
            {order.items.map((item, index) => (
              <div className="order-detail-item" key={`${item.productId}-${item.size}-${index}`}>
                <span>{item.name} · Size {item.size} × {item.quantity}</span>
                <b>{formatCurrency(item.lineTotal)}</b>
              </div>
            ))}
          </div>
          <div className="order-detail-total"><span>Tổng cộng</span><strong>{formatCurrency(order.total)}</strong></div>
        </div>
        <p className="demo-warning" role="note">Đơn hàng này chỉ được lưu trên thiết bị hiện tại. Cửa hàng chưa nhận được đơn và không có giao dịch thật.</p>
        <div className="success-actions">
          <button className="button button-primary" type="button" onClick={() => onNavigate('home')}>
            Về trang chủ <ArrowRight size={17} />
          </button>
          <button className="button button-soft" type="button" onClick={() => onNavigate('orders')}>
            Xem lịch sử đơn
          </button>
        </div>
      </section>
    </main>
  );
}
