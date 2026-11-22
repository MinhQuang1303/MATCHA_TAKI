import { useState } from 'react';
import { ArrowLeft, ChevronDown, ClipboardList, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { formatCurrency } from '../utils/formatCurrency.js';

export default function OrdersPage({ onNavigate }) {
  const { orders, clearOrders } = useCart();
  const [expandedOrder, setExpandedOrder] = useState('');

  function confirmClearHistory() {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử đơn demo trên thiết bị này?')) {
      clearOrders();
    }
  }

  return (
    <main className="orders-page">
      <button className="back-link" type="button" onClick={() => onNavigate('home')}>
        <ArrowLeft size={17} /> Về trang chủ
      </button>
      <div className="orders-heading">
        <span className="section-kicker">CHỈ LƯU TRÊN THIẾT BỊ NÀY</span>
        <h1>Đơn hàng <em>của tôi</em></h1>
        <p>Lịch sử trải nghiệm, không phải xác nhận đơn từ cửa hàng.</p>
      </div>

      {orders.length === 0 ? (
        <section className="orders-empty">
          <span><ClipboardList size={25} /></span>
          <h2>Chưa có đơn demo nào</h2>
          <p>Những đơn mô phỏng bạn tạo sẽ xuất hiện ở đây.</p>
          <button type="button" className="button button-primary" onClick={() => onNavigate('home')}>
            Khám phá menu
          </button>
        </section>
      ) : (
        <>
          <div className="orders-list-heading">
            <span>{orders.length} đơn mô phỏng</span>
            <button type="button" onClick={confirmClearHistory}><Trash2 size={15} /> Xóa lịch sử</button>
          </div>
          <div className="orders-list">
            {orders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              return (
                <article className="history-card" key={order.id}>
                  <button
                    className="history-summary"
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedOrder(isExpanded ? '' : order.id)}
                  >
                    <span className="history-icon"><ClipboardList size={19} /></span>
                    <span className="history-main">
                      <b>{order.id}</b>
                      <small>{new Date(order.createdAt).toLocaleString('vi-VN')} · {order.items.length} loại món</small>
                    </span>
                    <span className="history-total">{formatCurrency(order.total)}</span>
                    <span className="history-expand"><ChevronDown size={18} /></span>
                  </button>
                  <div className="history-status"><span /> {order.status} · Chưa gửi tới cửa hàng</div>
                  {isExpanded && (
                    <div className="history-details">
                      <p><b>Người nhận:</b> {order.customer.name} · {order.customer.phone}</p>
                      <p><b>Hình thức nhận:</b> {order.deliveryMethod === 'delivery' ? 'Giao tận nơi (demo)' : 'Nhận tại quán'}</p>
                      {order.deliveryMethod === 'delivery' && order.customer.address && <p><b>Địa chỉ:</b> {order.customer.address}</p>}
                      {order.items.map((item, index) => (
                        <div className="history-item" key={`${item.productId}-${item.size}-${index}`}>
                          <span>{item.name} · Size {item.size} × {item.quantity}</span>
                          <b>{formatCurrency(item.lineTotal)}</b>
                        </div>
                      ))}
                      <div className="history-item history-item-total"><span>Tổng cộng</span><b>{formatCurrency(order.total)}</b></div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
