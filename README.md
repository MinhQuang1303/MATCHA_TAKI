# TAKI Matcha

Website menu TAKI Matcha xây dựng bằng React, Vite, Tailwind CSS và CSS responsive. Không dùng backend, cơ sở dữ liệu, đăng nhập hay thanh toán; sản phẩm và thông tin liên hệ được chỉnh trực tiếp trong mã nguồn.

## Chạy trên máy

```bash
npm install
npm run dev
```

Mở địa chỉ Vite in trong terminal. Tạo bản build để kiểm tra bằng:

```bash
npm run build
npm run preview
```

## Sửa menu và thông tin liên hệ

- Danh sách sản phẩm nằm trong [`src/products.js`](./src/products.js). Mỗi món có `id`, `name`, `description`, `category`, `image`, `priceM`, `priceL`, `featured` và `available`.
- Giá chưa xác nhận để `null`; trang sẽ hiển thị “Liên hệ giá”.
- Mười hai món đề xuất được đánh dấu `suggested: true`. Đặt `SHOW_SUGGESTED_PRODUCTS` thành `false` trong `src/products.js` để ẩn chúng.
- Ảnh món đề xuất và món Kem Muối Hồng là ảnh minh họa SVG, có nhãn minh họa trên menu. Thay ảnh bằng cách sửa đường dẫn `image` tương ứng trong dữ liệu. Sáu ảnh WebP có sẵn là ảnh tham khảo từ menu ban đầu.
- Link Facebook, Zalo và đặt hàng được cấu hình trong [`src/siteConfig.js`](./src/siteConfig.js); để chuỗi trống nếu chưa có link chính thức. Khi chưa cấu hình, trang hiển thị “Đang cập nhật”.

## Đưa lên GitHub Pages

### Cách tự động bằng GitHub Actions

1. Đẩy mã nguồn lên repository GitHub, nhánh `main`.
2. Trong **Settings → Pages**, chọn **GitHub Actions** tại mục Build and deployment.
3. Workflow `.github/workflows/deploy.yml` sẽ build và publish khi có push lên `main`. Không cần cấu hình secrets.

### Cách chạy lệnh deploy

1. Đảm bảo Git đã cấu hình `origin` trỏ tới repository GitHub.
2. Chạy `npm install` và `npm run deploy`.
3. Trong **Settings → Pages**, chọn deploy từ nhánh `gh-pages`, thư mục `/(root)`.

Vite dùng đường dẫn tương đối cho asset nên các ảnh, CSS và JavaScript hoạt động ở cả project page lẫn domain riêng.
