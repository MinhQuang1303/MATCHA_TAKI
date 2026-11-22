import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  EyeOff,
  FileJson,
  ImagePlus,
  PackageCheck,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import JSZip from 'jszip';
import ProductImage, { getImageUrl } from './ProductImage.jsx';
import { useProducts } from '../context/ProductsContext.jsx';
import { MENU_VERSION, SHOW_SUGGESTED_PRODUCTS } from '../products.js';
import { getProductImage } from '../utils/productImageStore.js';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const EMPTY_DRAFT = {
  id: '',
  name: '',
  description: '',
  category: '',
  image: 'images/product-placeholder.svg',
  priceM: '',
  priceL: '',
  featured: false,
  available: true,
  visible: true,
  suggested: false,
};

function normalizeText(text) {
  return text.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}

function makeProductId(name, products) {
  const base = normalizeText(name)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70) || 'mon-moi';
  let id = base;
  let suffix = 2;
  while (products.some((product) => product.id === id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  return id;
}

function toDraft(product) {
  return product
    ? { ...product, priceM: String(product.priceM), priceL: String(product.priceL) }
    : { ...EMPTY_DRAFT };
}

function downloadFile(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
}

function imageExtension(blob) {
  if (blob.type === 'image/png') return 'png';
  if (blob.type === 'image/jpeg') return 'jpg';
  return 'webp';
}

function safeFilename(value) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
}

function ToggleField({ checked, onChange, title, description }) {
  return (
    <label className="manager-toggle">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="manager-toggle-track"><span /></span>
      <span><b>{title}</b><small>{description}</small></span>
    </label>
  );
}

export default function MenuManager({ onClose }) {
  const {
    products,
    saveProduct,
    deleteProduct,
    importProducts,
    restoreDefaultProducts,
    exportMenuData,
  } = useProducts();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState('');
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState('');
  const imageInput = useRef(null);
  const importInput = useRef(null);

  const filteredProducts = useMemo(() => {
    const query = normalizeText(search.trim());
    if (!query) return products;
    return products.filter((product) => (
      normalizeText(`${product.name} ${product.category} ${product.description}`).includes(query)
    ));
  }, [products, search]);

  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(selectedImage);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedImage]);

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', closeOnEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  function resetForm() {
    setEditingId('');
    setDraft({ ...EMPTY_DRAFT });
    setSelectedImage(null);
    if (imageInput.current) imageInput.current.value = '';
  }

  function startEditing(product) {
    setEditingId(product.id);
    setDraft(toDraft(product));
    setSelectedImage(null);
    if (imageInput.current) imageInput.current.value = '';
    setMessage(null);
  }

  function updateDraft(event) {
    const { name, value, checked, type } = event.target;
    setDraft((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  async function submitProduct(event) {
    event.preventDefault();
    const name = draft.name.trim();
    const category = draft.category.trim();
    const description = draft.description.trim();
    const priceM = Number(draft.priceM);
    const priceL = Number(draft.priceL);
    if (!name || name.length > 80) {
      setMessage({ type: 'error', text: 'Tên món cần từ 1 đến 80 ký tự.' });
      return;
    }
    if (!category || category.length > 60) {
      setMessage({ type: 'error', text: 'Hãy nhập danh mục, tối đa 60 ký tự.' });
      return;
    }
    if (description.length > 500) {
      setMessage({ type: 'error', text: 'Mô tả không được quá 500 ký tự.' });
      return;
    }
    if (!Number.isSafeInteger(priceM) || priceM < 1 || priceM > 10000000
      || !Number.isSafeInteger(priceL) || priceL < 1 || priceL > 10000000) {
      setMessage({ type: 'error', text: 'Giá M và L cần là số nguyên từ 1 đến 10.000.000đ.' });
      return;
    }

    const id = editingId || makeProductId(name, products);
    const product = {
      ...draft,
      id,
      name,
      description,
      category,
      priceM,
      priceL,
    };
    setBusy('save');
    setMessage(null);
    try {
      const result = await saveProduct(product, selectedImage);
      const action = editingId ? 'Đã cập nhật' : 'Đã thêm';
      setMessage({
        type: 'success',
        text: `${action} “${name}”.${result.warnings.length ? ` ${result.warnings.join(' ')}` : ''}`,
      });
      resetForm();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Không thể lưu món này.' });
    } finally {
      setBusy('');
    }
  }

  async function removeProduct(product) {
    if (!window.confirm(`Xóa “${product.name}” khỏi menu trên thiết bị này? Món trong giỏ cũng sẽ được đồng bộ.`)) return;
    setBusy(`delete:${product.id}`);
    setMessage(null);
    try {
      const warnings = await deleteProduct(product.id);
      if (editingId === product.id) resetForm();
      setMessage({
        type: 'success',
        text: `Đã xóa “${product.name}”.${warnings.length ? ` ${warnings.join(' ')}` : ''}`,
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Không thể xóa món này.' });
    } finally {
      setBusy('');
    }
  }

  async function exportJson() {
    setBusy('export-json');
    setMessage(null);
    try {
      const data = await exportMenuData();
      downloadFile(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
        'taki-menu.json',
      );
      setMessage({ type: 'success', text: 'Đã xuất JSON kèm dữ liệu ảnh tải lên, có thể nhập lại trên thiết bị khác.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Không thể xuất dữ liệu menu.' });
    } finally {
      setBusy('');
    }
  }

  async function exportDeployBundle() {
    setBusy('export-bundle');
    setMessage(null);
    try {
      const zip = new JSZip();
      const assets = new Map();
      const pathByImage = new Map();
      const deployProducts = [];

      for (const product of products) {
        let imagePath = product.image;
        let blob;
        if (product.image.startsWith('idb:')) {
          const imageId = product.image.slice(4);
          blob = await getProductImage(imageId);
          if (!(blob instanceof Blob)) throw new Error(`Không tìm thấy ảnh tải lên của “${product.name}”.`);
          imagePath = pathByImage.get(product.image);
          if (!imagePath) {
            imagePath = `images/menu-${safeFilename(product.id)}.${imageExtension(blob)}`;
            pathByImage.set(product.image, imagePath);
          }
        } else {
          imagePath = pathByImage.get(product.image) || product.image;
        }

        if (!assets.has(imagePath)) {
          if (!blob) {
            const response = await fetch(getImageUrl(imagePath));
            if (!response.ok) throw new Error(`Không tải được ảnh ${imagePath} để xuất bộ dữ liệu.`);
            blob = await response.blob();
          }
          assets.set(imagePath, blob);
        }
        deployProducts.push({ ...product, image: imagePath });
      }

      for (const [path, blob] of assets) zip.file(`public/${path}`, blob);
      const deployVersion = `${MENU_VERSION}-${Date.now()}`;
      const productsSource = [
        `export const MENU_VERSION = ${JSON.stringify(deployVersion)};`,
        `export const SHOW_SUGGESTED_PRODUCTS = ${SHOW_SUGGESTED_PRODUCTS};`,
        '',
        `export const products = ${JSON.stringify(deployProducts, null, 2)};`,
        '',
      ].join('\n');
      zip.file('src/products.js', productsSource);
      zip.file(
        'HUONG-DAN.txt',
        '1. Sao lưu dự án hiện tại trước khi thay đổi.\n'
        + '2. Giải nén tại thư mục gốc dự án để thay src/products.js và chép các ảnh vào public/images/.\n'
        + '3. Chạy npm run build, kiểm tra website rồi commit/push lên nhánh main để GitHub Actions deploy.\n'
        + 'Ảnh trong menu dùng đường dẫn tương đối images/...; không cần ảnh trong localStorage hoặc IndexedDB sau khi cập nhật mã nguồn.\n',
      );
      const archive = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });
      downloadFile(archive, 'taki-menu-deploy.zip');
      setMessage({ type: 'success', text: 'Đã xuất bộ dữ liệu nguồn và ảnh để cập nhật dự án, sau đó deploy GitHub Pages.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Không thể tạo bộ dữ liệu deploy.' });
    } finally {
      setBusy('');
    }
  }

  async function importJson(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Tệp JSON cần nhỏ hơn 50 MB.' });
      return;
    }
    if (!window.confirm('Nhập menu sẽ thay toàn bộ menu đang lưu trên thiết bị này. Tiếp tục?')) return;

    setBusy('import');
    setMessage(null);
    try {
      const parsed = JSON.parse(await file.text());
      const result = await importProducts(parsed);
      setMessage({
        type: 'success',
        text: `Đã nhập ${parsed.products?.length ?? parsed.length ?? 0} món.${result.warnings.length ? ` ${result.warnings.join(' ')}` : ''}`,
      });
      resetForm();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Tệp JSON không hợp lệ hoặc menu không thể lưu.' });
    } finally {
      setBusy('');
    }
  }

  async function restoreDefaults() {
    if (!window.confirm('Khôi phục menu 18 món mặc định? Menu tùy chỉnh sẽ bị thay thế.')) return;
    setBusy('restore');
    setMessage(null);
    try {
      const warnings = await restoreDefaultProducts();
      resetForm();
      setMessage({
        type: 'success',
        text: `Đã khôi phục menu mặc định.${warnings.length ? ` ${warnings.join(' ')}` : ''}`,
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Không thể khôi phục menu mặc định.' });
    } finally {
      setBusy('');
    }
  }

  const categories = [...new Set(products.map((product) => product.category))];
  const editingProduct = products.find((product) => product.id === editingId);

  return (
    <div
      className="menu-manager-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="menu-manager-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-manager-title"
      >
        <header className="menu-manager-header">
          <div className="menu-manager-title">
            <span className="menu-manager-icon"><Settings size={19} /></span>
            <div>
              <span className="manager-overline">TAKI MATCHA · QUẢN LÝ CỤC BỘ</span>
              <h2 id="menu-manager-title">Quản lý Menu</h2>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Đóng quản lý Menu">
            <X size={20} />
          </button>
        </header>

        <div className="manager-local-notice">
          <span>Chỉ lưu trên thiết bị này, không có đăng nhập hay phân quyền. Muốn công khai thay đổi, hãy xuất bộ dữ liệu nguồn rồi cập nhật GitHub Pages.</span>
        </div>

        <div className="manager-toolbar">
          <div className="manager-file-actions">
            <button type="button" onClick={exportJson} disabled={Boolean(busy)}>
              <FileJson size={16} /> Xuất JSON
            </button>
            <button type="button" onClick={() => importInput.current?.click()} disabled={Boolean(busy)}>
              <Upload size={16} /> Nhập JSON
            </button>
            <button type="button" className="manager-primary-action" onClick={exportDeployBundle} disabled={Boolean(busy)}>
              <PackageCheck size={16} /> Xuất bộ deploy
            </button>
            <button type="button" onClick={restoreDefaults} disabled={Boolean(busy)}>
              <RotateCcw size={16} /> Khôi phục mặc định
            </button>
            <input
              ref={importInput}
              className="visually-hidden"
              type="file"
              accept="application/json,.json"
              onChange={importJson}
            />
          </div>
          {message && (
            <div className={`manager-message ${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>
              {message.type === 'success' ? <Check size={15} /> : <X size={15} />}
              <span>{message.text}</span>
            </div>
          )}
        </div>

        <div className="menu-manager-content">
          <aside className="manager-list-pane">
            <div className="manager-list-heading">
              <div><h3>Danh sách món</h3><span>{filteredProducts.length} / {products.length} món</span></div>
              <button type="button" className="manager-add-button" onClick={() => { resetForm(); setMessage(null); }}>
                <Plus size={16} /> Thêm món
              </button>
            </div>
            <label className="manager-search">
              <Search size={17} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm tên hoặc danh mục..."
                aria-label="Tìm món trong bảng quản lý"
              />
            </label>
            <div className="manager-product-list">
              {filteredProducts.map((product) => (
                <article className={`manager-product-row ${editingId === product.id ? 'selected' : ''}`} key={product.id}>
                  <button
                    className="manager-product-select"
                    type="button"
                    onClick={() => startEditing(product)}
                    aria-label={`Sửa ${product.name}`}
                  >
                    <ProductImage product={product} className="manager-product-thumb" />
                    <span className="manager-product-copy">
                      <b>{product.name}</b>
                      <small>{product.category} · M {Number(product.priceM).toLocaleString('vi-VN')}đ</small>
                      <span className="manager-badges">
                        {!product.visible && <i><EyeOff size={11} /> Đang ẩn</i>}
                        {!product.available && <i>Hết hàng</i>}
                        {product.suggested && <i>Món đề xuất</i>}
                      </span>
                    </span>
                    <Pencil size={14} />
                  </button>
                  <button
                    className="manager-delete-button"
                    type="button"
                    disabled={busy === `delete:${product.id}` || Boolean(busy && busy !== `delete:${product.id}`)}
                    onClick={() => removeProduct(product)}
                    aria-label={`Xóa ${product.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </article>
              ))}
              {filteredProducts.length === 0 && (
                <div className="manager-list-empty">
                  <Search size={21} />
                  <span>{products.length ? 'Không tìm thấy món phù hợp.' : 'Menu đang trống. Hãy thêm món mới.'}</span>
                </div>
              )}
            </div>
          </aside>

          <form className="manager-editor" onSubmit={submitProduct}>
            <div className="manager-editor-heading">
              <div>
                <span className="manager-step">{editingId ? 'CHỈNH SỬA THÔNG TIN' : 'THÊM VÀO MENU'}</span>
                <h3>{editingId ? `Sửa ${editingProduct?.name || 'món nước'}` : 'Tạo món nước mới'}</h3>
              </div>
              {editingId && <button type="button" className="manager-cancel-edit" onClick={resetForm}>Món mới <Plus size={14} /></button>}
            </div>

            <div className="manager-image-field">
              <div className="manager-image-preview">
                {previewUrl
                  ? <img src={previewUrl} alt="Xem trước ảnh sản phẩm vừa chọn" />
                  : <ProductImage product={{ ...draft, name: draft.name || 'Sản phẩm mới' }} className="manager-image-saved" loading="eager" />}
              </div>
              <div className="manager-image-controls">
                <b>Ảnh sản phẩm</b>
                <span>Ảnh sẽ được nén và lưu trong kho ảnh của trình duyệt, không chiếm dung lượng localStorage.</span>
                <input
                  ref={imageInput}
                  className="visually-hidden"
                  type="file"
                  accept={IMAGE_TYPES.join(',')}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (!IMAGE_TYPES.includes(file.type)) {
                      setMessage({ type: 'error', text: 'Chỉ nhận ảnh JPEG, PNG hoặc WebP.' });
                      event.target.value = '';
                      return;
                    }
                    setSelectedImage(file);
                    setMessage(null);
                  }}
                />
                <button type="button" className="manager-upload-button" onClick={() => imageInput.current?.click()}>
                  <ImagePlus size={16} /> Chọn ảnh từ thiết bị
                </button>
                <small>JPEG, PNG hoặc WebP · tối đa 12 MB trước khi nén</small>
                {selectedImage && (
                  <button
                    type="button"
                    className="manager-remove-image"
                    onClick={() => { setSelectedImage(null); if (imageInput.current) imageInput.current.value = ''; }}
                  >
                    <X size={13} /> Bỏ ảnh mới chọn
                  </button>
                )}
              </div>
            </div>

            <label className="manager-field">
              Tên món
              <input name="name" value={draft.name} onChange={updateDraft} maxLength="80" placeholder="Ví dụ: Matcha Dừa" required />
            </label>
            <label className="manager-field">
              Mô tả
              <textarea name="description" value={draft.description} onChange={updateDraft} maxLength="500" rows="3" placeholder="Mô tả ngắn gọn hương vị món nước..." />
            </label>
            <label className="manager-field">
              Danh mục
              <input
                name="category"
                list="manager-category-options"
                value={draft.category}
                onChange={updateDraft}
                maxLength="60"
                placeholder="Chọn hoặc nhập danh mục mới"
                required
              />
              <datalist id="manager-category-options">
                {categories.map((category) => <option key={category} value={category} />)}
              </datalist>
              <small>Danh mục mới được thêm khi lưu món và dùng làm bộ lọc menu.</small>
            </label>
            <div className="manager-price-grid">
              <label className="manager-field">
                Giá size M <small>360ml</small>
                <input name="priceM" type="number" inputMode="numeric" min="1" max="10000000" step="1" value={draft.priceM} onChange={updateDraft} placeholder="30000" required />
              </label>
              <label className="manager-field">
                Giá size L <small>500ml</small>
                <input name="priceL" type="number" inputMode="numeric" min="1" max="10000000" step="1" value={draft.priceL} onChange={updateDraft} placeholder="35000" required />
              </label>
            </div>
            <div className="manager-toggle-grid">
              <ToggleField
                checked={draft.available}
                onChange={(event) => setDraft((current) => ({ ...current, available: event.target.checked }))}
                title="Còn hàng"
                description={draft.available ? 'Khách có thể thêm vào giỏ.' : 'Đang tạm hết món.'}
              />
              <ToggleField
                checked={draft.visible}
                onChange={(event) => setDraft((current) => ({ ...current, visible: event.target.checked }))}
                title="Hiện trên menu"
                description={draft.visible ? 'Đang hiển thị công khai.' : 'Ẩn khỏi menu khách xem.'}
              />
            </div>
            <div className="manager-editor-actions">
              <button type="button" className="manager-secondary-button" onClick={resetForm} disabled={Boolean(busy)}>Làm mới</button>
              <button type="submit" className="manager-save-button" disabled={Boolean(busy)}>
                <Check size={16} /> {busy === 'save' ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Thêm món vào menu'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
