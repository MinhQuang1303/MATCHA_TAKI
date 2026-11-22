const DATABASE_NAME = 'taki-menu-images-v1';
const STORE_NAME = 'images';
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
let databasePromise;

function openDatabase() {
  if (!globalThis.indexedDB) {
    return Promise.reject(new Error('Trình duyệt này không hỗ trợ IndexedDB để lưu ảnh.'));
  }
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => {
      databasePromise = null;
      reject(request.error || new Error('Không thể mở kho ảnh trên thiết bị.'));
    };
    request.onblocked = () => {
      databasePromise = null;
      reject(new Error('Kho ảnh đang được dùng ở một thẻ khác. Hãy tải lại trang rồi thử lại.'));
    };
  });

  return databasePromise;
}

function runTransaction(mode, action) {
  return openDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const result = action(transaction.objectStore(STORE_NAME));
    transaction.oncomplete = () => resolve(result && result.result);
    transaction.onerror = () => reject(transaction.error || new Error('Không thể truy cập kho ảnh.'));
    transaction.onabort = () => reject(transaction.error || new Error('Thao tác với kho ảnh đã bị hủy.'));
  }));
}

export async function compressProductImage(file) {
  if (!(file instanceof Blob) || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Chỉ nhận ảnh JPEG, PNG hoặc WebP.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Ảnh tải lên cần nhỏ hơn 12 MB.');
  }

  let drawable;
  let bitmap;
  let releaseDrawable = () => {};
  if (typeof createImageBitmap === 'function') {
    try {
      bitmap = await createImageBitmap(file);
      drawable = bitmap;
    } catch {
      drawable = null;
    }
  }
  if (!drawable) {
    const objectUrl = URL.createObjectURL(file);
    try {
      drawable = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Không thể đọc ảnh này.'));
        image.src = objectUrl;
      });
      releaseDrawable = () => URL.revokeObjectURL(objectUrl);
    } catch {
      URL.revokeObjectURL(objectUrl);
      throw new Error('Không thể đọc ảnh này. Hãy chọn một ảnh JPEG, PNG hoặc WebP khác.');
    }
  }

  try {
    const width = drawable.width || drawable.naturalWidth;
    const height = drawable.height || drawable.naturalHeight;
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Trình duyệt không thể xử lý ảnh này.');
    context.drawImage(drawable, 0, 0, canvas.width, canvas.height);

    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Không thể nén ảnh. Hãy thử chọn ảnh khác.'));
      }, 'image/webp', 0.84);
    });
  } finally {
    bitmap?.close();
    releaseDrawable();
  }
}

export function saveProductImage(id, blob) {
  return runTransaction('readwrite', (store) => store.put(blob, id));
}

export function getProductImage(id) {
  return runTransaction('readonly', (store) => store.get(id));
}

export function deleteProductImage(id) {
  return runTransaction('readwrite', (store) => store.delete(id));
}

export function dataUrlToImageBlob(dataUrl) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)$/.exec(dataUrl || '');
  if (!match) throw new Error('Ảnh trong JSON phải là ảnh JPEG, PNG hoặc WebP dạng base64.');

  const estimatedSize = Math.floor(match[2].length * 3 / 4);
  if (estimatedSize > MAX_UPLOAD_BYTES) throw new Error('Ảnh trong JSON vượt quá giới hạn 12 MB.');

  let binary;
  try {
    binary = atob(match[2].replace(/\s/g, ''));
  } catch {
    throw new Error('Dữ liệu ảnh trong JSON không hợp lệ.');
  }

  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: match[1] });
}

export function imageBlobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Không thể mã hóa ảnh để xuất JSON.'));
    };
    reader.onerror = () => reject(reader.error || new Error('Không thể đọc ảnh để xuất JSON.'));
    reader.readAsDataURL(blob);
  });
}
