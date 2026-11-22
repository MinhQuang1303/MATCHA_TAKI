import { useEffect } from 'react';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import ProductImage from './ProductImage.jsx';
import { useCart } from '../context/CartContext.jsx';
import { formatCurrency } from '../utils/formatCurrency.js';

export default function CartDrawer({ isOpen, onClose, onCheckout }) {
  const {
    cartItems,
    cartCount,
    cartTotal,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  useEffect(() => {
    if (!isOpen) return undefined;

    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', closeOnEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function confirmClearCart() {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ món trong giỏ?')) clearCart();
  }

  return (
    <div
      className="cart-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <header className="cart-header">
          <div>
            <span className="cart-overline">GẤU & TÁO ĐANG CHỌN MÓN</span>
            <h2 id="cart-title">Giỏ hàng <span>({cartCount})</span></h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Đóng giỏ hàng">
            <X size={20} />
          </button>
        </header>

        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <span className="cart-empty-icon"><ShoppingBag size={26} /></span>
            <h3>Giỏ hàng đang trống nè!</h3>
            <p>Gấu & Táo đang đợi bạn chọn một ly matcha thật ngon.</p>
            <button type="button" className="button button-primary" onClick={onClose}>
              Tiếp tục chọn món
            </button>
          </div>
        ) : (
          <>
            <div className="cart-list">
              {cartItems.map((item) => (
                <article className="cart-item" key={item.itemKey}>
                  <ProductImage product={item.product} className="cart-product-image" />
                  <div className="cart-item-main">
                    <div className="cart-item-top">
                      <div>
                        <h3>{item.product.name}</h3>
                        <span>Size {item.size} · {item.size === 'M' ? '360ml' : '500ml'}</span>
                      </div>
                      <button
                        type="button"
                        className="remove-item"
                        onClick={() => removeFromCart(item.productId, item.size)}
                        aria-label={`Xóa ${item.product.name}, size ${item.size}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="cart-item-bottom">
                      <div className="quantity-control" aria-label={`Số lượng ${item.product.name}`}>
                        <button
                          type="button"
                          aria-label={`Giảm số lượng ${item.product.name}`}
                          disabled={item.quantity <= 1}
                          onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                        >
                          <Minus size={13} />
                        </button>
                        <span aria-live="polite">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={`Tăng số lượng ${item.product.name}`}
                          disabled={item.quantity >= 99}
                          onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <strong>{formatCurrency(item.lineTotal)}</strong>
                    </div>
                    <small className="cart-unit-price">{formatCurrency(item.unitPrice)} / ly · Giá demo</small>
                  </div>
                </article>
              ))}
            </div>

            <div className="cart-footer">
              <button type="button" className="clear-cart" onClick={confirmClearCart}>
                <Trash2 size={15} /> Xóa toàn bộ giỏ
              </button>
              <div className="cart-summary-row"><span>Tạm tính</span><strong>{formatCurrency(cartTotal)}</strong></div>
              <p>Phí giao hàng chưa được tính.</p>
              <button type="button" className="button button-primary checkout-button" onClick={onCheckout}>
                Tiến hành thanh toán <ArrowRight size={17} />
              </button>
              <span className="demo-caption">Đơn hàng và thanh toán chỉ được mô phỏng.</span>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
