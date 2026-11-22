import { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  Coffee,
  Facebook,
  Heart,
  Leaf,
  MapPin,
  MessageCircle,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import CartDrawer from './components/CartDrawer.jsx';
import MenuManager from './components/MenuManager.jsx';
import ProductImage from './components/ProductImage.jsx';
import { CartProvider, useCart } from './context/CartContext.jsx';
import { ProductsProvider, useProducts } from './context/ProductsContext.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderSuccessPage from './pages/OrderSuccessPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import { products as defaultProducts, SHOW_SUGGESTED_PRODUCTS } from './products.js';
import { contactInfo } from './siteConfig.js';
import { formatCurrency } from './utils/formatCurrency.js';
import './style.css';

function normalizeText(text) {
  return text
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

function readRoute() {
  const [page, ...rest] = window.location.hash.replace(/^#\/?/, '').split('/');
  if (page === 'checkout' || page === 'orders') return { page, orderId: '' };
  if (page === 'success') return { page, orderId: rest.join('/') };
  return { page: 'home', orderId: '' };
}

function ConfiguredLink({ href, icon: Icon, children }) {
  if (!href) {
    return (
      <span className="contact-link unavailable" aria-disabled="true">
        <Icon size={18} />
        <span>{children}<small>Đang cập nhật</small></span>
      </span>
    );
  }

  return (
    <a className="contact-link" href={href} target="_blank" rel="noreferrer">
      <Icon size={18} />
      <span>{children}</span>
    </a>
  );
}

function ProductCard({ product, index, size, onSizeChange, onOpen, onAdd }) {
  const price = size === 'M' ? product.priceM : product.priceL;

  return (
    <article className={`product-card ${product.available ? '' : 'is-unavailable'}`}>
      <button
        className="product-image-button"
        type="button"
        onClick={() => onOpen(product)}
        aria-label={`Xem chi tiết ${product.name}`}
      >
        <ProductImage product={product} className="product-image" />
        <span className="product-index">{String(index + 1).padStart(2, '0')}</span>
        {product.featured && (
          <span className="product-badge featured-badge"><Sparkles size={13} /> Best Seller</span>
        )}
        {product.suggested && (
          <span className="product-badge suggestion-badge">Món mới</span>
        )}
        {!product.available && <span className="product-badge sold-out-badge">Tạm hết</span>}
        <span className="image-caption">Ảnh minh họa</span>
      </button>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="product-size-options" role="group" aria-label={`Chọn size cho ${product.name}`}>
          {['M', 'L'].map((option) => (
            <button
              type="button"
              key={option}
              className={size === option ? 'is-selected' : ''}
              aria-pressed={size === option}
              onClick={() => onSizeChange(option)}
            >
              {option}<small>{option === 'M' ? '360ml' : '500ml'}</small>
            </button>
          ))}
          <strong>{formatCurrency(price)}</strong>
        </div>
        <div className="product-footer">
          <span className="price-demo-label">Giá demo</span>
          <button
            className="detail-button"
            type="button"
            onClick={() => onOpen(product)}
            aria-label={`Xem chi tiết ${product.name}`}
          >
            <ChevronRight size={19} />
          </button>
        </div>
        <button
          className="product-add-button"
          type="button"
          disabled={!product.available}
          onClick={() => onAdd(product, size)}
        >
          <ShoppingBag size={15} /> {product.available ? 'Thêm vào giỏ' : 'Tạm hết'}
        </button>
      </div>
    </article>
  );
}

function ProductDialog({ product, size, onSizeChange, onClose, onAdd }) {
  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const price = size === 'M' ? product.priceM : product.priceL;

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className="product-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <button className="dialog-close" type="button" onClick={onClose} aria-label="Đóng">
          <X size={20} />
        </button>
        <ProductImage product={product} className="dialog-image" loading="eager" />
        <div className="dialog-copy">
          <span className="product-category">{product.category} · Ảnh minh họa</span>
          <h2 id="dialog-title">{product.name}</h2>
          <p>{product.description}</p>
          <div className="dialog-size-options" role="group" aria-label="Chọn size">
            {['M', 'L'].map((option) => (
              <button
                type="button"
                key={option}
                className={size === option ? 'is-selected' : ''}
                aria-pressed={size === option}
                onClick={() => onSizeChange(option)}
              >
                Size {option} · {option === 'M' ? '360ml' : '500ml'}
              </button>
            ))}
          </div>
          <div className="dialog-size">
            <span>Giá demo · Size {size}</span>
            <strong>{formatCurrency(price)}</strong>
          </div>
          <div className="dialog-note"><Check size={16} /> Giá chỉ dùng cho trải nghiệm, chưa phải giá bán chính thức.</div>
          <button
            className="product-add-button dialog-add-button"
            type="button"
            disabled={!product.available}
            onClick={() => onAdd(product, size)}
          >
            <ShoppingBag size={16} /> {product.available ? 'Thêm vào giỏ' : 'Tạm hết'}
          </button>
        </div>
      </section>
    </div>
  );
}

function HomePage({ onAddToCart }) {
  const { products } = useProducts();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [size, setSize] = useState('M');
  const [sizesByProduct, setSizesByProduct] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const publicProducts = products.filter((product) => product.visible !== false);
  const categories = ['Tất cả', ...new Set(publicProducts.map((product) => product.category))];
  const heroProduct = products.find((product) => product.id === 'matcha-latte') || defaultProducts[0];
  const activeProduct = selectedProduct && products.find((product) => product.id === selectedProduct.id);

  useEffect(() => {
    if (selectedProduct && (!activeProduct || activeProduct.visible === false)) {
      setSelectedProduct(null);
    }
  }, [activeProduct, selectedProduct]);

  const visibleProducts = useMemo(() => {
    const query = normalizeText(search.trim());

    return publicProducts.filter((product) => (
      (SHOW_SUGGESTED_PRODUCTS || !product.suggested)
      && (category === 'Tất cả' || product.category === category)
      && (!query || normalizeText(`${product.name} ${product.description}`).includes(query))
    ));
  }, [category, publicProducts, search]);

  function chooseSize(productId, nextSize) {
    setSizesByProduct((current) => ({ ...current, [productId]: nextSize }));
  }

  function addProduct(product, selectedSize) {
    onAddToCart(product, selectedSize);
    setSelectedProduct(null);
  }

  return (
    <>
      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <span className="hero-kicker"><span /> CHÚT XANH, CHÚT THƯƠNG</span>
            <h1>TAKI <span>MATCHA</span></h1>
            <p className="hero-tagline">Matcha đậm vị – Ngọt ngào từ Gấu & Táo.</p>
            <p className="hero-description">
              Giữa những ngày tất bật, đôi khi chỉ cần một ly matcha thơm ngon cũng đủ khiến mọi thứ trở nên dịu dàng hơn.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#menu">Khám phá menu <ArrowDown size={17} /></a>
              <a className="button button-quiet" href="#menu">Đặt món ngay <ChevronRight size={17} /></a>
            </div>
            <div className="hero-note"><Leaf size={15} /> Gấu & Táo pha chút xanh, gửi bạn chút lành.</div>
          </div>
          <div className="hero-art" aria-label="Ảnh minh họa ly Matcha Latte TAKI">
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <div className="hero-disc" />
            <ProductImage product={heroProduct} className="hero-drink" loading="eager" />
            <div className="hero-sticker"><span>PHA TƯƠI</span><Leaf size={17} /><strong>TAKI</strong></div>
            <div className="hero-caption">GẤU<br /><span>&</span><b>TÁO</b></div>
          </div>
          <span className="hero-side-note">MATCHA · MADE WITH LOVE</span>
        </section>

        <section className="menu-section" id="menu">
          <div className="section-heading">
            <span className="section-kicker"><Leaf size={15} /> MENU NHÀ TAKI <Leaf size={15} /></span>
            <h2>MATCHA <em>SERIES</em></h2>
            <p>Gấu chọn matcha, Táo thêm ngọt ngào, TAKI gửi đến bạn.</p>
          </div>

          <div className="demo-price-notice">
            <Sparkles size={16} />
            <span>Giá hiển thị là giá demo, chưa phải giá bán chính thức.</span>
          </div>

          <div className="menu-tools">
            <label className="search-field">
              <Search size={19} />
              <input
                type="search"
                placeholder="Tìm món bạn yêu thích..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Tìm kiếm sản phẩm"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} aria-label="Xóa tìm kiếm">
                  <X size={17} />
                </button>
              )}
            </label>
            <div className="size-picker" role="group" aria-label="Chọn size mặc định">
              <span>Size mặc định</span>
              {['M', 'L'].map((option) => (
                <button
                  type="button"
                  key={option}
                  className={size === option ? 'is-selected' : ''}
                  aria-pressed={size === option}
                  onClick={() => setSize(option)}
                >
                  {option}<small>{option === 'M' ? '360ml' : '500ml'}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="category-list" role="group" aria-label="Lọc theo danh mục">
            {categories.map((option) => (
              <button
                type="button"
                key={option}
                className={category === option ? 'is-active' : ''}
                aria-pressed={category === option}
                onClick={() => setCategory(option)}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="results-line" aria-live="polite">
            <span>{visibleProducts.length} thức uống</span>
            {SHOW_SUGGESTED_PRODUCTS && <span className="suggestion-key"><span /> Có món đang ở dạng gợi ý</span>}
          </div>

          {visibleProducts.length > 0 ? (
            <div className="product-grid">
              {visibleProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  size={sizesByProduct[product.id] || size}
                  onSizeChange={(nextSize) => chooseSize(product.id, nextSize)}
                  onOpen={setSelectedProduct}
                  onAdd={addProduct}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span><Coffee size={24} /></span>
              <h3>Chưa tìm thấy món phù hợp</h3>
              <p>Thử một từ khóa khác hoặc chọn lại danh mục nhé.</p>
              <button type="button" onClick={() => { setSearch(''); setCategory('Tất cả'); }}>
                Xem tất cả món
              </button>
            </div>
          )}
        </section>

        <section className="about-section" id="about">
          <div className="about-art">
            <div className="about-ring"><Leaf size={34} strokeWidth={1.2} /></div>
            <span className="about-vertical">A LITTLE GREEN MOMENT</span>
          </div>
          <div className="about-copy">
            <span className="section-kicker"><Sparkles size={15} /> CÂU CHUYỆN NHỎ CỦA GẤU & TÁO</span>
            <h2>Chút xanh,<br /><em>chút thương.</em></h2>
            <p>
              Giữa những ngày tất bật, đôi khi chỉ cần một ly matcha thơm ngon cũng đủ khiến mọi thứ trở nên dịu dàng hơn.
            </p>
            <p>
              Từ vị matcha đậm đà, lớp sữa béo thơm đến những tầng hương vị ngọt ngào, Gấu & Táo muốn gửi đến bạn một chút bình yên qua từng ly TAKI.
            </p>
            <p>Gấu thích vị matcha đậm đà, Táo yêu những điều ngọt ngào — một chút xanh, một chút thương được hòa quyện thành TAKI.</p>
            <p className="about-footnote">
              Chúng mình hy vọng mỗi khi bạn ghé qua, dù chỉ là một khoảnh khắc ngắn ngủi, bạn cũng sẽ tìm thấy chút niềm vui trong ngày.
              Một chút xanh cho ngày thêm tươi, một chút ngọt cho lòng thêm vui.
            </p>
            <a className="text-link" href="#menu">Chọn món yêu thích <ChevronRight size={17} /></a>
          </div>
        </section>

        <section className="closing-note">
          <div><Heart size={20} /></div>
          <p>Hôm nay bạn đã tự thưởng cho mình một ly matcha chưa?</p>
          <span>MỘT LY MATCHA NHỎ, MỘT NIỀM VUI XINH</span>
        </section>
      </main>

      {activeProduct && activeProduct.visible !== false && (
        <ProductDialog
          product={activeProduct}
          size={sizesByProduct[activeProduct.id] || size}
          onSizeChange={(nextSize) => chooseSize(activeProduct.id, nextSize)}
          onClose={() => setSelectedProduct(null)}
          onAdd={addProduct}
        />
      )}
    </>
  );
}

function SiteFooter({ onNavigate }) {
  return (
    <footer className="site-footer" id="contact">
      <div className="footer-main">
        <div className="footer-brand-block">
          <a className="footer-brand" href="#home">TAKI <Leaf size={22} /></a>
          <span>TAKI MATCHA · GẤU & TÁO</span>
          <p>Một chút xanh, một chút thương.</p>
          <button className="footer-history-link" type="button" onClick={() => onNavigate('orders')}>
            Xem lịch sử đơn demo
          </button>
        </div>
        <div className="footer-location">
          <span className="footer-label">GỬI LỜI CHÀO ĐẾN TAKI</span>
          <p><MapPin size={17} /> Thanh Hóa · Đồng Tháp</p>
          <p className="footer-thanks">Rất vui khi được đồng hành cùng khoảnh khắc của bạn.</p>
        </div>
        <div className="footer-contact">
          <span className="footer-label">KẾT NỐI VỚI TAKI</span>
          <ConfiguredLink href={contactInfo.facebookUrl} icon={Facebook}>Facebook</ConfiguredLink>
          <ConfiguredLink href={contactInfo.zaloUrl} icon={MessageCircle}>Zalo</ConfiguredLink>
          <ConfiguredLink href={contactInfo.orderUrl} icon={ShoppingBag}>Liên hệ đặt hàng</ConfiguredLink>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} TAKI MATCHA · DEMO</span>
        <span>Cảm ơn bạn đã mua hàng của Gấu và Táo! <Heart size={13} /></span>
      </div>
      <p className="footer-demo-notice">Website trải nghiệm. Đơn hàng chỉ lưu trên thiết bị, không gửi đến cửa hàng.</p>
    </footer>
  );
}

function App() {
  const { cartCount, addToCart, notice, dismissNotice } = useCart();
  const [route, setRoute] = useState(readRoute);
  const [cartOpen, setCartOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [showTopButton, setShowTopButton] = useState(false);

  const navigate = useCallback((page) => {
    window.location.hash = page === 'home' ? 'home' : `/${page}`;
    setCartOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const closeCart = useCallback(() => setCartOpen(false), []);

  useEffect(() => {
    function handleHashChange() {
      const nextRoute = readRoute();
      setRoute(nextRoute);
      if (nextRoute.page !== 'home') window.scrollTo(0, 0);
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    function updateScrollButton() {
      setShowTopButton(route.page === 'home' && window.scrollY > 420);
    }

    updateScrollButton();
    window.addEventListener('scroll', updateScrollButton, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollButton);
  }, [route.page]);

  function handleAddToCart(product, size) {
    const added = addToCart(product, size);
    if (added) setCartOpen(true);
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#home" aria-label="TAKI Matcha - trang chủ">
          <span className="brand-mark"><Leaf size={22} strokeWidth={1.8} /></span>
          <span className="brand-name">TAKI<small>MATCHA ĐẬM VỊ</small></span>
        </a>
        <nav className="main-nav" aria-label="Điều hướng chính">
          <a href="#home">Trang chủ</a>
          <a href="#menu">Menu</a>
          <a href="#about">Giới thiệu</a>
          <a href="#contact">Liên hệ</a>
        </nav>
        <div className="header-actions">
          <a className="header-order" href="#menu">Đặt món</a>
          <button
            className="menu-manager-trigger"
            type="button"
            onClick={() => { setCartOpen(false); setManagerOpen(true); }}
            aria-label="Quản lý Menu"
          >
            <Settings size={17} /><span>Quản lý Menu</span>
          </button>
          <button
            className="header-cart"
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Mở giỏ hàng, ${cartCount} ly`}
          >
            <ShoppingBag size={18} /><span>Giỏ hàng</span>
            <b className="cart-count-badge">{cartCount}</b>
          </button>
        </div>
      </header>

      {route.page === 'home' && <HomePage onAddToCart={handleAddToCart} />}
      {route.page === 'checkout' && <CheckoutPage onNavigate={navigate} />}
      {route.page === 'success' && <OrderSuccessPage orderId={route.orderId} onNavigate={navigate} />}
      {route.page === 'orders' && <OrdersPage onNavigate={navigate} />}

      <SiteFooter onNavigate={navigate} />

      <CartDrawer
        isOpen={cartOpen}
        onClose={closeCart}
        onCheckout={() => navigate('checkout')}
      />

      {managerOpen && <MenuManager onClose={() => setManagerOpen(false)} />}

      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>
          <button type="button" onClick={dismissNotice} aria-label="Đóng thông báo"><X size={16} /></button>
        </div>
      )}
      {showTopButton && (
        <button
          className="back-to-top"
          type="button"
          aria-label="Cuộn lên đầu trang"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUp size={19} />
        </button>
      )}
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <ProductsProvider>
    <CartProvider>
      <App />
    </CartProvider>
  </ProductsProvider>,
);
