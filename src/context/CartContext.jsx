import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useProducts } from './ProductsContext.jsx';

const CartContext = createContext(null);
const STORAGE_KEY = 'taki-demo-store-v1';
const MAX_QUANTITY = 99;
const emptyStore = { cart: [], orders: [] };

function normalizeCart(entries, productById) {
  if (!Array.isArray(entries)) return [];

  const quantities = new Map();
  for (const entry of entries) {
    const product = entry && productById.get(entry.productId);
    if (!product?.available) continue;
    if (entry.size !== 'M' && entry.size !== 'L') continue;
    if (!Number.isInteger(entry.quantity) || entry.quantity < 1) continue;
    const price = entry.size === 'M' ? product.priceM : product.priceL;
    if (!Number.isFinite(price) || price <= 0) continue;

    const key = `${entry.productId}:${entry.size}`;
    quantities.set(key, Math.min(MAX_QUANTITY, (quantities.get(key) || 0) + entry.quantity));
  }

  return Array.from(quantities, ([key, quantity]) => {
    const [productId, size] = key.split(':');
    return { productId, size, quantity };
  });
}

function isValidOrder(order) {
  return Boolean(
    order
    && typeof order.id === 'string'
    && typeof order.createdAt === 'string'
    && Number.isFinite(Date.parse(order.createdAt))
    && order.customer
    && typeof order.customer.name === 'string'
    && typeof order.customer.phone === 'string'
    && ['pickup', 'delivery'].includes(order.deliveryMethod)
    && ['cod', 'transfer-demo'].includes(order.paymentMethod)
    && Array.isArray(order.items)
    && order.items.every((item) => (
      item
      && typeof item.productId === 'string'
      && typeof item.name === 'string'
      && typeof item.image === 'string'
      && (item.size === 'M' || item.size === 'L')
      && Number.isInteger(item.quantity)
      && item.quantity > 0
      && Number.isFinite(item.unitPrice)
      && Number.isFinite(item.lineTotal)
    ))
    && Number.isFinite(order.total)
  );
}

function readStore(productById) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      console.error('Dữ liệu TAKI lưu cục bộ không hợp lệ.');
      return emptyStore;
    }

    return {
      cart: normalizeCart(parsed.cart, productById),
      orders: Array.isArray(parsed.orders) ? parsed.orders.filter(isValidOrder) : [],
    };
  } catch (error) {
    console.error('Không thể đọc dữ liệu demo của TAKI từ localStorage.', error);
    return emptyStore;
  }
}

function createOrderId() {
  const token = globalThis.crypto?.randomUUID?.()
    || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `TAKI-${token.slice(0, 8).toUpperCase()}`;
}

export function CartProvider({ children }) {
  const { products } = useProducts();
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const [store, setStore] = useState(() => readStore(productById));
  const [notice, setNotice] = useState('');
  const noticeTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  const notify = useCallback((message) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(''), 3500);
  }, []);

  const saveStore = useCallback((nextStore, requirePersistence = false) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStore));
      setStore(nextStore);
      return true;
    } catch (error) {
      console.error('Không thể lưu dữ liệu demo của TAKI vào localStorage.', error);
      notify('Trình duyệt không lưu được dữ liệu. Vui lòng kiểm tra dung lượng hoặc cài đặt lưu trữ.');
      if (!requirePersistence) setStore(nextStore);
      return false;
    }
  }, [notify]);

  useEffect(() => {
    const cart = normalizeCart(store.cart, productById);
    if (JSON.stringify(cart) !== JSON.stringify(store.cart)) {
      saveStore({ ...store, cart });
    }
  }, [productById, saveStore, store]);

  const cartItems = useMemo(() => store.cart.flatMap((entry) => {
    const product = productById.get(entry.productId);
    if (!product?.available) return [];

    const unitPrice = entry.size === 'M' ? product.priceM : product.priceL;
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) return [];

    return [{
      ...entry,
      product,
      unitPrice,
      lineTotal: unitPrice * entry.quantity,
      itemKey: `${entry.productId}:${entry.size}`,
    }];
  }), [productById, store.cart]);

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems],
  );
  const cartTotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.lineTotal, 0),
    [cartItems],
  );

  const addToCart = useCallback((product, size) => {
    const currentProduct = product && productById.get(product.id);
    if (!currentProduct?.available) {
      notify('Món này hiện đang tạm hết, bạn chọn món khác nhé.');
      return false;
    }
    if (size !== 'M' && size !== 'L') {
      notify('Vui lòng chọn size M hoặc L.');
      return false;
    }

    const price = size === 'M' ? currentProduct.priceM : currentProduct.priceL;
    if (!Number.isFinite(price) || price <= 0) {
      notify('Giá món này chưa được cập nhật, chưa thể thêm vào giỏ.');
      return false;
    }

    const key = `${currentProduct.id}:${size}`;
    const existing = store.cart.find((entry) => `${entry.productId}:${entry.size}` === key);
    if (existing?.quantity >= MAX_QUANTITY) {
      notify(`Mỗi món chỉ có thể thêm tối đa ${MAX_QUANTITY} ly.`);
      return false;
    }

    const cart = existing
      ? store.cart.map((entry) => (
        `${entry.productId}:${entry.size}` === key
          ? { ...entry, quantity: Math.min(MAX_QUANTITY, entry.quantity + 1) }
          : entry
      ))
      : [...store.cart, { productId: currentProduct.id, size, quantity: 1 }];

    const saved = saveStore({ ...store, cart });
    if (saved) notify('Gấu & Táo đã thêm một chút ngọt ngào vào giỏ hàng của bạn! 🍵');
    return saved;
  }, [notify, productById, saveStore, store]);

  const updateQuantity = useCallback((productId, size, quantity) => {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      notify(`Số lượng cần từ 1 đến ${MAX_QUANTITY} ly.`);
      return false;
    }

    const key = `${productId}:${size}`;
    if (!store.cart.some((entry) => `${entry.productId}:${entry.size}` === key)) return false;
    const cart = store.cart.map((entry) => (
      `${entry.productId}:${entry.size}` === key ? { ...entry, quantity } : entry
    ));
    return saveStore({ ...store, cart });
  }, [notify, saveStore, store]);

  const removeFromCart = useCallback((productId, size) => {
    const key = `${productId}:${size}`;
    const cart = store.cart.filter((entry) => `${entry.productId}:${entry.size}` !== key);
    if (cart.length === store.cart.length) return false;
    return saveStore({ ...store, cart });
  }, [saveStore, store]);

  const clearCart = useCallback(() => saveStore({ ...store, cart: [] }), [saveStore, store]);

  const placeOrder = useCallback(({ customer, paymentMethod, deliveryMethod }) => {
    const name = customer?.name?.trim();
    const phone = customer?.phone?.trim();
    if (!cartItems.length) return { ok: false, error: 'Giỏ hàng đang trống.' };
    if (!name || !phone) return { ok: false, error: 'Vui lòng nhập họ tên và số điện thoại.' };
    if (deliveryMethod === 'delivery' && !customer?.address?.trim()) {
      return { ok: false, error: 'Vui lòng nhập địa chỉ nhận hàng.' };
    }
    if (!['pickup', 'delivery'].includes(deliveryMethod)) {
      return { ok: false, error: 'Vui lòng chọn hình thức nhận hàng.' };
    }
    if (!['cod', 'transfer-demo'].includes(paymentMethod)) {
      return { ok: false, error: 'Vui lòng chọn phương thức thanh toán.' };
    }

    const order = {
      id: createOrderId(),
      createdAt: new Date().toISOString(),
      customer: {
        name,
        phone,
        address: customer.address?.trim() || '',
        note: customer.note?.trim() || '',
      },
      items: cartItems.map((item) => ({
        productId: item.productId,
        name: item.product.name,
        image: item.product.image,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
      total: cartTotal,
      paymentMethod,
      deliveryMethod,
      deliveryFee: 0,
      status: 'Đơn hàng mô phỏng',
    };

    const saved = saveStore({ cart: [], orders: [order, ...store.orders] }, true);
    return saved
      ? { ok: true, order }
      : { ok: false, error: 'Không thể lưu đơn hàng demo. Giỏ hàng được giữ nguyên.' };
  }, [cartItems, cartTotal, saveStore, store]);

  const clearOrders = useCallback(() => (
    saveStore({ ...store, orders: [] })
  ), [saveStore, store]);

  const value = useMemo(() => ({
    cartItems,
    cartCount,
    cartTotal,
    orders: store.orders,
    notice,
    notify,
    dismissNotice: () => setNotice(''),
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    clearOrders,
    placeOrder,
  }), [
    addToCart,
    cartCount,
    cartItems,
    cartTotal,
    clearCart,
    clearOrders,
    notice,
    notify,
    placeOrder,
    removeFromCart,
    store.orders,
    updateQuantity,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart phải được dùng bên trong CartProvider.');
  return context;
}
