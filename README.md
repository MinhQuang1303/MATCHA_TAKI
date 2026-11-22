# TAKI Matcha – Gấu & Táo

Website React, Vite, Tailwind CSS, Lucide React và CSS responsive. Menu, giỏ hàng, checkout mô phỏng và lịch sử đơn hoạt động hoàn toàn ở frontend; không có backend, tài khoản hay thanh toán thật.

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

- Menu mặc định nằm trong [`src/products.js`](./src/products.js). Mỗi món có `id`, `name`, `description`, `category`, `image`, `priceM`, `priceL`, `featured` và `available`; `visible` mặc định bật và được lưu khi quản lý menu.
- Giá hiện tại là **giá demo**, không phải giá bán chính thức. Có thể chỉnh trực tiếp `src/products.js` hoặc dùng nút **Quản lý Menu** trên website.
- Mười hai món đề xuất được đánh dấu `suggested: true`. Đặt `SHOW_SUGGESTED_PRODUCTS` thành `false` trong `src/products.js` để ẩn chúng.
- Ảnh món đề xuất và món Kem Muối Hồng là ảnh minh họa SVG, có nhãn minh họa trên menu. Thay ảnh bằng cách sửa đường dẫn `image` tương ứng trong dữ liệu. Sáu ảnh WebP có sẵn là ảnh tham khảo từ menu ban đầu.
- Link Facebook, Zalo và đặt hàng được cấu hình trong [`src/siteConfig.js`](./src/siteConfig.js); để chuỗi trống nếu chưa có link chính thức. Khi chưa cấu hình, trang hiển thị “Đang cập nhật”.

## Quản lý Menu trên website

- Nút bánh răng mở bảng quản lý ngay trong website. Thêm/sửa/xóa, tìm kiếm, cập nhật giá, danh mục, tình trạng còn hàng và ẩn/hiện món đều cập nhật menu tức thì.
- Menu chỉnh trong website chỉ được lưu trên trình duyệt hiện tại bằng `localStorage` (khóa `taki-menu-products-v1`); không có đăng nhập, phân quyền hoặc đồng bộ giữa thiết bị. Đây không phải trang Admin bảo mật.
- Ảnh tải lên được nén rồi lưu trong IndexedDB của trình duyệt. Chỉ đường dẫn/thông tin món được lưu trong `localStorage`, giới hạn dữ liệu menu là 2 MB; ảnh đầu vào tối đa 12 MB.
- **Xuất JSON** tạo tệp có kèm dữ liệu ảnh tải lên để sao lưu hoặc nhập trên thiết bị khác. **Nhập JSON** sẽ thay thế menu đang lưu sau khi xác nhận.
- **Xuất bộ deploy** tạo `taki-menu-deploy.zip`, gồm `src/products.js`, các ảnh trong `public/images/` và hướng dẫn. Giải nén tại thư mục gốc dự án, kiểm tra `npm run build`, rồi commit/push các thay đổi để công khai menu.
- Bộ deploy tự tăng `MENU_VERSION`, nhờ đó menu cục bộ phiên bản cũ không che khuất dữ liệu mới sau khi website được cập nhật. Nếu sửa menu mặc định thủ công trong mã nguồn, hãy tăng phiên bản này trong `src/products.js`.
- **Khôi phục mặc định** đưa menu về 18 món ban đầu. Thao tác này không xóa lịch sử đơn demo.

## Giỏ hàng và đơn demo

- Giỏ hàng phân biệt cùng món theo size, giới hạn số lượng 99 ly mỗi món và lưu tại `localStorage` trên trình duyệt hiện tại.
- Checkout kiểm tra tên, số điện thoại và địa chỉ khi chọn giao hàng; phí giao hàng demo là 0đ và chưa tính phí thực tế.
- COD và chuyển khoản đều chỉ là lựa chọn mô phỏng. Không tạo QR, không gửi đơn đến cửa hàng, không có giao dịch thật.
- Đơn demo và lịch sử chỉ lưu trên thiết bị hiện tại. Có thể mở lịch sử ở liên kết cuối trang và xóa toàn bộ sau xác nhận.
- Nếu cần xóa dữ liệu trải nghiệm, xóa khóa `taki-demo-store-v1` trong `localStorage` của trình duyệt.

## Đưa lên GitHub Pages

### Cách tự động bằng GitHub Actions

1. Đẩy mã nguồn lên repository GitHub, nhánh `main`.
2. Trong **Settings → Pages**, chọn **GitHub Actions** tại mục Build and deployment. Đây là bước bật Pages một lần cho repository.
3. Workflow `.github/workflows/deploy.yml` sẽ build và publish khi có push lên `main`. Không cần cấu hình secrets.
4. Thay đổi từ nút **Quản lý Menu** chưa được công khai tự động. Xuất bộ deploy, cập nhật mã nguồn/ảnh rồi push để Actions đưa menu mới lên website.

### Cách chạy lệnh deploy

1. Đảm bảo Git đã cấu hình `origin` trỏ tới repository GitHub.
2. Chạy `npm install` và `npm run deploy`.
3. Trong **Settings → Pages**, chọn deploy từ nhánh `gh-pages`, thư mục `/(root)`.

Vite đang dùng base `/MATCHA_TAKI/`, khớp với tên repository để chạy trên GitHub project page. Nếu đổi tên repository, cập nhật `base` trong `vite.config.js` tương ứng.
