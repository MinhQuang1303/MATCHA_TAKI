import { useEffect, useState } from 'react';
import { getProductImage } from '../utils/productImageStore.js';

const fallbackImage = `${import.meta.env.BASE_URL}images/product-placeholder.svg`;

export function getImageUrl(path) {
  return `${import.meta.env.BASE_URL}${path}`;
}

export default function ProductImage({ product, className = '', loading = 'lazy' }) {
  const [image, setImage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    setImage('');
    setIsLoading(true);

    if (product.image.startsWith('idb:')) {
      getProductImage(product.image.slice(4))
        .then((blob) => {
          if (!(blob instanceof Blob)) throw new Error('Ảnh không còn trong kho trên thiết bị.');
          objectUrl = URL.createObjectURL(blob);
          if (active) setImage(objectUrl);
          else URL.revokeObjectURL(objectUrl);
        })
        .catch((error) => {
          console.error(`Không thể tải ảnh của "${product.name}".`, error);
          if (active) setImage(fallbackImage);
        });
    } else {
      setImage(getImageUrl(product.image));
    }

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [product.image, product.name]);

  return (
    <span className={`image-frame ${className}-frame`}>
      {image && (
        <img
          className={className}
          src={image}
          alt={`Ảnh minh họa ${product.name} của TAKI`}
          loading={loading}
          onLoad={() => setIsLoading(false)}
          onError={(event) => {
            if (image !== fallbackImage) {
              setImage(fallbackImage);
              setIsLoading(true);
            } else {
              event.currentTarget.style.visibility = 'hidden';
              setIsLoading(false);
            }
          }}
        />
      )}
      {isLoading && (
        <span className="image-loading" role="status" aria-label="Đang tải ảnh">
          <span />
        </span>
      )}
    </span>
  );
}
