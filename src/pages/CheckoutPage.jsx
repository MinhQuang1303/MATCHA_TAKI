import { useState } from 'react';
import { ArrowLeft, ArrowRight, MapPin, Store } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { formatCurrency } from '../utils/formatCurrency.js';

const initialCustomer = { name: '', phone: '', address: '', note: '' };

function validateCustomer(customer, deliveryMethod) {
  const errors = {};
  const phoneDigits = customer.phone.replace(/\D/g, '');

  if (customer.name.trim().length < 2) errors.name = 'Vui lòng nhập họ tên (ít nhất 2 ký tự).';
  if (phoneDigits.length < 9 || phoneDigits.length > 11) errors.phone = 'Số điện thoại cần có từ 9 đến 11 chữ số.';
  if (deliveryMethod === 'delivery' && customer.address.trim().length < 6) {
    errors.address = 'Vui lòng nhập địa chỉ nhận hàng đầy đủ.';
  }

  return errors;
}

export default function CheckoutPage({ onNavigate }) {
  const { cartItems, cartCount, cartTotal, placeOrder } = useCart();
  const [customer, setCustomer] = useState(initialCustomer);
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  function updateCustomer(event) {
    const { name, value } = event.target;
    setCustomer((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setSubmitError('');
  }

  function submitOrder(event) {
    event.preventDefault();
    const nextErrors = validateCustomer(customer, deliveryMethod);
    setErrors(nextErrors);
    setSubmitError('');
    if (Object.keys(nextErrors).length) return;

    const result = placeOrder({ customer, paymentMethod, deliveryMethod });
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }

    onNavigate(`success/${result.order.id}`);
  }

  if (cartItems.length === 0) {
    return (
      <main className="checkout-page">
        <div className="checkout-empty">
          <span><Store size={25} /></span>
          <h1>Chưa có món trong giỏ</h1>
          <p>Chọn một ly matcha yêu thích trước khi đến bước thanh toán demo nhé.</p>
          <button className="button button-primary" type="button" onClick={() => onNavigate('home')}>
            Quay lại menu <ArrowRight size={17} />
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <button className="back-link" type="button" onClick={() => onNavigate('home')}>
        <ArrowLeft size={17} /> Tiếp tục chọn món
      </button>
      <div className="checkout-heading">
        <span className="section-kicker">GẤU & TÁO · TAKI MATCHA</span>
        <h1>Hoàn tất <em>đơn demo</em></h1>
        <p>Để Gấu & Táo chuẩn bị một chút xanh, một chút thương cho bạn.</p>
      </div>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={submitOrder} noValidate>
          <section className="checkout-card">
            <div className="checkout-card-heading">
              <span>01</span><div><h2>Thông tin của bạn</h2><p>Chỉ lưu trên thiết bị này.</p></div>
            </div>
            <label className="form-field">
              Họ và tên
              <input
                autoComplete="name"
                name="name"
                value={customer.name}
                onChange={updateCustomer}
                placeholder="Tên người nhận"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'checkout-name-error' : undefined}
              />
              {errors.name && <small id="checkout-name-error" className="field-error">{errors.name}</small>}
            </label>
            <label className="form-field">
              Số điện thoại
              <input
                autoComplete="tel"
                inputMode="tel"
                name="phone"
                value={customer.phone}
                onChange={updateCustomer}
                placeholder="Số điện thoại liên hệ"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'checkout-phone-error' : undefined}
              />
              {errors.phone && <small id="checkout-phone-error" className="field-error">{errors.phone}</small>}
            </label>
          </section>

          <section className="checkout-card">
            <div className="checkout-card-heading">
              <span>02</span><div><h2>Hình thức nhận món</h2><p>Chọn cách bạn muốn nhận đơn demo.</p></div>
            </div>
            <div className="choice-grid">
              <label className={`choice-card ${deliveryMethod === 'pickup' ? 'is-selected' : ''}`}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="pickup"
                  checked={deliveryMethod === 'pickup'}
                  onChange={() => { setDeliveryMethod('pickup'); setErrors((current) => ({ ...current, address: '' })); }}
                />
                <Store size={19} /><span><b>Nhận tại quán</b><small>Phí demo: 0đ</small></span>
              </label>
              <label className={`choice-card ${deliveryMethod === 'delivery' ? 'is-selected' : ''}`}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="delivery"
                  checked={deliveryMethod === 'delivery'}
                  onChange={() => setDeliveryMethod('delivery')}
                />
                <MapPin size={19} /><span><b>Giao tận nơi</b><small>Phí demo: 0đ</small></span>
              </label>
            </div>
            {deliveryMethod === 'delivery' && (
              <label className="form-field address-field">
                Địa chỉ nhận hàng
                <textarea
                  autoComplete="street-address"
                  name="address"
                  rows="3"
                  value={customer.address}
                  onChange={updateCustomer}
                  placeholder="Số nhà, đường, phường/xã, tỉnh/thành"
                  aria-invalid={Boolean(errors.address)}
                  aria-describedby={errors.address ? 'checkout-address-error' : undefined}
                />
                {errors.address && <small id="checkout-address-error" className="field-error">{errors.address}</small>}
              </label>
            )}
            <label className="form-field">
              Ghi chú <span className="optional-label">(không bắt buộc)</span>
              <textarea
                name="note"
                rows="2"
                value={customer.note}
                onChange={updateCustomer}
                placeholder="Lời nhắn cho Gấu & Táo"
              />
            </label>
          </section>

          <section className="checkout-card">
            <div className="checkout-card-heading">
              <span>03</span><div><h2>Phương thức thanh toán demo</h2><p>Không phát sinh giao dịch thật.</p></div>
            </div>
            <div className="payment-options">
              <label className={`payment-option ${paymentMethod === 'cod' ? 'is-selected' : ''}`}>
                <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                <span><b>Tiền mặt khi nhận (COD demo)</b><small>Chỉ là lựa chọn mô phỏng</small></span>
              </label>
              <label className={`payment-option ${paymentMethod === 'transfer-demo' ? 'is-selected' : ''}`}>
                <input type="radio" name="paymentMethod" value="transfer-demo" checked={paymentMethod === 'transfer-demo'} onChange={() => setPaymentMethod('transfer-demo')} />
                <span><b>Chuyển khoản (demo)</b><small>Không tạo QR, không chuyển tiền</small></span>
              </label>
            </div>
          </section>

          {submitError && <p className="checkout-error" role="alert">{submitError}</p>}
          <p className="demo-warning" role="note">
            Đây là website trải nghiệm. Đơn hàng và thanh toán chỉ được mô phỏng, không được gửi đến cửa hàng và không phát sinh giao dịch thực tế.
          </p>
          <button className="button button-primary submit-order" type="submit">
            Xác nhận đơn mô phỏng <ArrowRight size={17} />
          </button>
        </form>

        <aside className="checkout-summary">
          <div className="summary-title"><h2>Đơn hàng của bạn</h2><span>{cartCount} ly</span></div>
          <div className="summary-items">
            {cartItems.map((item) => (
              <div className="summary-item" key={item.itemKey}>
                <ProductImage product={item.product} className="summary-image" />
                <div><b>{item.product.name}</b><span>Size {item.size} · {item.quantity} ly</span></div>
                <strong>{formatCurrency(item.lineTotal)}</strong>
              </div>
            ))}
          </div>
          <div className="summary-line"><span>Tạm tính</span><b>{formatCurrency(cartTotal)}</b></div>
          <div className="summary-line"><span>Phí giao hàng demo</span><b>0đ</b></div>
          <p className="shipping-note">Phí vận chuyển thực tế chưa được tính.</p>
          <div className="summary-total"><span>Tổng cộng <small>(giá demo)</small></span><strong>{formatCurrency(cartTotal)}</strong></div>
        </aside>
      </div>
    </main>
  );
}
