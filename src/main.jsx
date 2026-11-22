import { useEffect, useMemo, useState } from 'react';
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
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import { products, SHOW_SUGGESTED_PRODUCTS } from './products.js';
import { contactInfo } from './siteConfig.js';
import './style.css';

const categories = ['Tất cả', ...new Set(products.map((product) => product.category))];
const fallbackImage = `${import.meta.env.BASE_URL}images/product-placeholder.svg`;

function getImageUrl(path) {
  return `${import.meta.env.BASE_URL}${path}`;
}

function formatPrice(price) {
  return price == null ? 'Liên hệ giá' : `${Number(price).toLocaleString('vi-VN')}đ`;
}

function normalizeText(text) {
  return text
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

function ProductImage({ product, className = '', loading = 'lazy' }) {
  const [image, setImage] = useState(getImageUrl(product.image));
  const [isLoading, setIsLoading] = useState(true);

  return (
    <span className={`image-frame ${className}-frame`}>
      <img
        className={className}
        src={image}
        alt={`Ảnh minh họa ${product.name} của TAKI`}
        loading={loading}
        onLoad={() => setIsLoading(false)}
        onError={(event) => {
          if (image !== fallbackImage) setImage(fallbackImage);
          else {
            event.currentTarget.style.visibility = 'hidden';
            setIsLoading(false);
          }
        }}
      />
      {isLoading && (
        <span className="image-loading" role="status" aria-label="Đang tải ảnh">
          <span />
        </span>
      )}
    </span>
  );
}

function ProductCard({ product, index, size, onOpen }) {
  const price = size === 'M' ? product.priceM : product.priceL;

  return (
    <article className="product-card">
      <button
        className="product-image-button"
        type="button"
        onClick={() => onOpen(product)}
        aria-label={`Xem chi tiết ${product.name}`}
      >
        <ProductImage product={product} className="product-image" />
        <span className="product-index">{String(index + 1).padStart(2, '0')}</span>
        {product.featured && (
          <span className="product-badge featured-badge"><Sparkles size={13} /> Nổi bật</span>
        )}
        {product.suggested && (
          <span className="product-badge suggestion-badge">Món gợi ý</span>
        )}
        <span className="image-caption">Ảnh minh họa</span>
      </button>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="product-footer">
          <div className="product-price">
            <span>Size {size} · {size === 'M' ? '360ml' : '500ml'}</span>
            <strong>{formatPrice(price)}</strong>
          </div>
          <button
            className="detail-button"
            type="button"
            onClick={() => onOpen(product)}
            aria-label={`Xem chi tiết ${product.name}`}
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductDialog({ product, size, onClose }) {
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
          <div className="dialog-size">
            <span>Size {size} · {size === 'M' ? '360ml' : '500ml'}</span>
            <strong>{formatPrice(price)}</strong>
          </div>
          <div className="dialog-note"><Check size={16} /> Giá sẽ được cập nhật khi có thông tin chính thức.</div>
        </div>
      </section>
    </div>
  );
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

function App() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [size, setSize] = useState('M');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showTopButton, setShowTopButton] = useState(false);

  const visibleProducts = useMemo(() => {
    const query = normalizeText(search.trim());

    return products.filter((product) => (
      product.available
      && (SHOW_SUGGESTED_PRODUCTS || !product.suggested)
      && (category === 'Tất cả' || product.category === category)
      && (!query || normalizeText(`${product.name} ${product.description}`).includes(query))
    ));
  }, [category, search]);

  useEffect(() => {
    function updateScrollButton() {
      setShowTopButton(window.scrollY > 420);
    }

    updateScrollButton();
    window.addEventListener('scroll', updateScrollButton, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollButton);
  }, []);

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
        <a className="header-order" href={contactInfo.orderUrl || '#contact'}>
          <ShoppingBag size={16} /> Đặt hàng
        </a>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <span className="hero-kicker"><span /> PHA MỖI ĐƠN BẰNG CẢ SỰ YÊU THƯƠNG</span>
            <h1>TAKI <span>MATCHA</span></h1>
            <p className="hero-tagline">Matcha đậm vị – Pha mỗi đơn bằng cả sự yêu thương</p>
            <p className="hero-description">
              Một chút xanh dịu dàng, một chút ngọt ngào — chọn vị bạn thương và thưởng thức theo cách riêng.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#menu">Khám phá Menu <ArrowDown size={17} /></a>
              <a className="button button-quiet" href={contactInfo.orderUrl || '#contact'}>Đặt hàng ngay <ChevronRight size={17} /></a>
            </div>
            <div className="hero-note"><Leaf size={15} /> Mỗi ly là một khoảnh khắc xanh</div>
          </div>
          <div className="hero-art" aria-label="Ảnh minh họa ly Matcha Latte TAKI">
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <div className="hero-disc" />
            <ProductImage product={products[0]} className="hero-drink" loading="eager" />
            <div className="hero-sticker"><span>PHA TƯƠI</span><Leaf size={17} /><strong>TAKI</strong></div>
            <div className="hero-caption">MATCHA<br /><span>TIME</span><b>✳</b></div>
          </div>
          <span className="hero-side-note">MATCHA · MADE WITH LOVE</span>
        </section>

        <section className="menu-section" id="menu">
          <div className="section-heading">
            <span className="section-kicker"><Leaf size={15} /> MENU NHÀ TAKI <Leaf size={15} /></span>
            <h2>MATCHA <em>SERIES</em></h2>
            <p>Chọn vị yêu thích, TAKI chăm chút phần còn lại.</p>
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
            <div className="size-picker" role="group" aria-label="Chọn kích cỡ">
              <span>Kích cỡ</span>
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
                  size={size}
                  onOpen={setSelectedProduct}
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
            <span className="section-kicker"><Sparkles size={15} /> CHUYỆN NHÀ TAKI</span>
            <h2>Chậm một chút,<br /><em>thưởng vị xanh.</em></h2>
            <p>
              TAKI Matcha mong mỗi ly nước là một khoảng nghỉ nhỏ trong ngày — đậm vị matcha,
              dịu dàng vừa đủ và được pha bằng tất cả sự yêu thương.
            </p>
            <p className="about-footnote">Hương vị có thể thay đổi đôi chút theo lựa chọn của bạn.</p>
            <a className="text-link" href="#menu">Chọn món yêu thích <ChevronRight size={17} /></a>
          </div>
        </section>

        <section className="closing-note">
          <div><Heart size={20} /></div>
          <p>Cảm ơn bạn đã ghé thăm góc nhỏ xanh của TAKI.</p>
          <span>HẸN GẶP BẠN TRONG MỘT LY MATCHA</span>
        </section>
      </main>

      <footer className="site-footer" id="contact">
        <div className="footer-main">
          <div className="footer-brand-block">
            <a className="footer-brand" href="#home">TAKI <Leaf size={22} /></a>
            <span>MATCHA ĐẬM VỊ</span>
            <p>Pha mỗi đơn bằng cả sự yêu thương.</p>
          </div>
          <div className="footer-location">
            <span className="footer-label">GỬI LỜI CHÀO ĐẾN TAKI</span>
            <p><MapPin size={17} /> Đồng Tháp</p>
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
          <span>© {new Date().getFullYear()} TAKI MATCHA</span>
          <span>Được pha bằng sự yêu thương <Heart size={13} /></span>
        </div>
      </footer>

      {selectedProduct && (
        <ProductDialog
          product={selectedProduct}
          size={size}
          onClose={() => setSelectedProduct(null)}
        />
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

createRoot(document.getElementById('root')).render(<App />);
