import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { MENU_VERSION, products as defaultProducts } from '../products.js';
import {
  compressProductImage,
  dataUrlToImageBlob,
  deleteProductImage,
  getProductImage,
  imageBlobToDataUrl,
  saveProductImage,
} from '../utils/productImageStore.js';

const ProductsContext = createContext(null);
const STORAGE_KEY = 'taki-menu-products-v1';
const MAX_MENU_STORAGE_BYTES = 2 * 1024 * 1024;
const MAX_PRODUCT_COUNT = 300;
const DEFAULT_IMAGE = 'images/product-placeholder.svg';
const initialProducts = defaultProducts.map((product) => ({ ...product, visible: true }));

function createId() {
  return globalThis.crypto?.randomUUID?.()
    || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeProducts(source) {
  if (!Array.isArray(source) || source.length > MAX_PRODUCT_COUNT) {
    throw new Error(`Menu cần là danh sách tối đa ${MAX_PRODUCT_COUNT} món.`);
  }

  const ids = new Set();
  return source.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`Thông tin món thứ ${index + 1} không hợp lệ.`);
    }

    const id = typeof entry.id === 'string' ? entry.id.trim() : '';
    const name = typeof entry.name === 'string' ? entry.name.trim() : '';
    const description = typeof entry.description === 'string' ? entry.description.trim() : '';
    const category = typeof entry.category === 'string' ? entry.category.trim() : '';
    const image = typeof entry.image === 'string' && entry.image.trim()
      ? entry.image.trim()
      : DEFAULT_IMAGE;
    const validImage = (
      /^idb:[A-Za-z0-9._-]+$/.test(image)
      || (
        /^images\/[A-Za-z0-9._/-]+$/.test(image)
        && !image.split('/').some((part) => part === '.' || part === '..')
      )
    );

    if (!/^[a-z0-9-]{1,90}$/.test(id) || ids.has(id)) {
      throw new Error(`Mã món thứ ${index + 1} không hợp lệ hoặc bị trùng.`);
    }
    if (!name || name.length > 80) throw new Error(`Tên món thứ ${index + 1} cần từ 1 đến 80 ký tự.`);
    if (description.length > 500) throw new Error(`Mô tả món "${name}" không được quá 500 ký tự.`);
    if (!category || category.length > 60) throw new Error(`Danh mục món "${name}" không hợp lệ.`);
    if (!validImage) throw new Error(`Đường dẫn ảnh món "${name}" không hợp lệ.`);

    for (const field of ['priceM', 'priceL']) {
      if (!Number.isSafeInteger(entry[field]) || entry[field] < 1 || entry[field] > 10000000) {
        throw new Error(`Giá size ${field === 'priceM' ? 'M' : 'L'} của "${name}" cần là số nguyên từ 1 đến 10.000.000.`);
      }
    }

    for (const field of ['available', 'visible', 'featured', 'suggested']) {
      if (entry[field] !== undefined && typeof entry[field] !== 'boolean') {
        throw new Error(`Trạng thái "${field}" của "${name}" không hợp lệ.`);
      }
    }

    ids.add(id);
    return {
      id,
      name,
      description,
      category,
      image,
      priceM: entry.priceM,
      priceL: entry.priceL,
      featured: entry.featured ?? false,
      available: entry.available ?? true,
      visible: entry.visible ?? true,
      suggested: entry.suggested ?? false,
    };
  });
}

function readProducts() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialProducts;

    const saved = JSON.parse(raw);
    if (Array.isArray(saved)) return normalizeProducts(saved);
    if (saved?.version !== MENU_VERSION) {
      console.info('Phiên bản menu cục bộ đã cũ; đang dùng menu mặc định của website.');
      window.localStorage.removeItem(STORAGE_KEY);
      return initialProducts;
    }
    return normalizeProducts(saved.products);
  } catch (error) {
    console.error('Không thể đọc menu TAKI đã lưu. Đang dùng menu mặc định.', error);
    return initialProducts;
  }
}

function persistProducts(nextProducts) {
  const serialized = JSON.stringify({ version: MENU_VERSION, products: nextProducts });
  const bytes = new TextEncoder().encode(serialized).length;
  if (bytes > MAX_MENU_STORAGE_BYTES) {
    throw new Error('Dữ liệu menu vượt quá giới hạn 2 MB. Hãy rút gọn mô tả hoặc số lượng món.');
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Không thể lưu menu TAKI vào localStorage.', error);
    throw new Error('Không đủ dung lượng lưu menu trên trình duyệt. Hãy giải phóng dung lượng rồi thử lại.');
  }
}

function uploadedImageIds(items) {
  return new Set(items.flatMap((product) => (
    product.image.startsWith('idb:') ? [product.image.slice(4)] : []
  )));
}

async function removeUnusedImages(previous, next) {
  const retained = uploadedImageIds(next);
  const unused = [...uploadedImageIds(previous)].filter((id) => !retained.has(id));
  const results = await Promise.allSettled(unused.map(deleteProductImage));
  return results.some((result) => result.status === 'rejected')
    ? ['Một số ảnh cũ chưa được dọn khỏi kho ảnh của trình duyệt.']
    : [];
}

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(readProducts);

  const commitProducts = useCallback(async (nextProducts, newlySavedImageIds = []) => {
    const normalized = normalizeProducts(nextProducts);
    try {
      persistProducts(normalized);
    } catch (error) {
      const cleanup = await Promise.allSettled(newlySavedImageIds.map(deleteProductImage));
      if (cleanup.some((result) => result.status === 'rejected')) {
        console.error('Không thể dọn ảnh tải lên sau khi lưu menu thất bại.');
      }
      throw error;
    }

    setProducts(normalized);
    return removeUnusedImages(products, normalized);
  }, [products]);

  const saveProduct = useCallback(async (draft, imageFile = null) => {
    let uploadedId = '';
    let image = draft.image || DEFAULT_IMAGE;

    if (imageFile) {
      const compressed = await compressProductImage(imageFile);
      uploadedId = createId();
      await saveProductImage(uploadedId, compressed);
      image = `idb:${uploadedId}`;
    }

    const nextProduct = { ...draft, image };
    const index = products.findIndex((product) => product.id === nextProduct.id);
    const nextProducts = index < 0
      ? [...products, nextProduct]
      : products.map((product, productIndex) => (productIndex === index ? nextProduct : product));

    const warnings = await commitProducts(nextProducts, uploadedId ? [uploadedId] : []);
    return { warnings };
  }, [commitProducts, products]);

  const deleteProduct = useCallback(async (id) => {
    const nextProducts = products.filter((product) => product.id !== id);
    if (nextProducts.length === products.length) return [];
    return commitProducts(nextProducts);
  }, [commitProducts, products]);

  const importProducts = useCallback(async (importData) => {
    const source = Array.isArray(importData) ? importData : importData?.products;
    const prepared = normalizeProducts(source);
    const sourceEntries = Array.isArray(source) ? source : [];
    const newlySavedImageIds = [];

    try {
      const nextProducts = [];
      for (let index = 0; index < prepared.length; index += 1) {
        const entry = sourceEntries[index];
        let product = prepared[index];
        if (entry.imageData) {
          const compressed = await compressProductImage(dataUrlToImageBlob(entry.imageData));
          const id = createId();
          await saveProductImage(id, compressed);
          newlySavedImageIds.push(id);
          product = { ...product, image: `idb:${id}` };
        } else if (product.image.startsWith('idb:')) {
          throw new Error(`Ảnh của "${product.name}" không có dữ liệu đính kèm trong JSON.`);
        }
        nextProducts.push(product);
      }

      const warnings = await commitProducts(nextProducts, newlySavedImageIds);
      return { warnings };
    } catch (error) {
      const cleanup = await Promise.allSettled(newlySavedImageIds.map(deleteProductImage));
      if (cleanup.some((result) => result.status === 'rejected')) {
        console.error('Không thể dọn ảnh nhập thử sau khi nhập menu thất bại.');
      }
      throw error;
    }
  }, [commitProducts]);

  const restoreDefaultProducts = useCallback(
    () => commitProducts(initialProducts.map((product) => ({ ...product }))),
    [commitProducts],
  );

  const exportMenuData = useCallback(async () => {
    const portableProducts = [];
    for (const product of products) {
      const portable = { ...product };
      if (product.image.startsWith('idb:')) {
        const blob = await getProductImage(product.image.slice(4));
        if (!(blob instanceof Blob)) {
          throw new Error(`Không tìm thấy ảnh đã tải lên của "${product.name}".`);
        }
        portable.image = `images/upload-${product.id}.webp`;
        portable.imageData = await imageBlobToDataUrl(blob);
      }
      portableProducts.push(portable);
    }

    return {
      format: 'taki-menu',
      version: 1,
      exportedAt: new Date().toISOString(),
      products: portableProducts,
    };
  }, [products]);

  const value = useMemo(() => ({
    products,
    saveProduct,
    deleteProduct,
    importProducts,
    restoreDefaultProducts,
    exportMenuData,
  }), [
    deleteProduct,
    exportMenuData,
    importProducts,
    products,
    restoreDefaultProducts,
    saveProduct,
  ]);

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) throw new Error('useProducts phải được dùng bên trong ProductsProvider.');
  return context;
}
