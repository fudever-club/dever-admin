# 🛡️ FU-DEVER Admin Command Dashboard

<p align="center">
  <img src="public/icons/layout/fu-dever-logo.png" alt="FU-DEVER Logo" width="96" height="96" />
</p>

<p align="center">
  <b>Bảng điều khiển & Trung tâm quản trị tối cao hệ sinh thái FU-DEVER</b><br />
  <i>Đại học FPT Đà Nẵng · "WORK HARD - PLAY HARD"</i>
</p>

<p align="center">
  <a href="https://admin.fudever.com"><img src="https://img.shields.io/badge/Production-admin.fudever.com-0066CC?style=for-the-badge&logo=vercel&logoColor=white" alt="Production Domain" /></a>
  <a href="https://github.com/fudever-club/dever-admin"><img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repo" /></a>
  <img src="https://img.shields.io/badge/Next.js-14_App_Router-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 14" />
  <img src="https://img.shields.io/badge/Ant_Design-5.0-0170FE?style=for-the-badge&logo=ant-design&logoColor=white" alt="Ant Design" />
  <img src="https://img.shields.io/badge/Telegram_Bot-Integrated-24A1DE?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram Bot" />
</p>

---

## 🌐 Tổng Quan Phân Hệ (Overview)

`dever-admin` là nền tảng quản trị dành riêng cho Ban Chủ Nhiệm, Trưởng Ban Chuyên Môn và Quản trị viên CLB FU-DEVER nhằm điều hành toàn bộ dữ liệu hệ sinh thái:
- **Executive Overview Analytics:** Thống kê tổng quan số lượng thành viên, sự kiện mở, bài viết cần duyệt và bài tập LeetCode theo thời gian thực.
- **Quy trình Duyệt Tech Blog (Review Queue):** Đọc bài viết Markdown, xem thông tin tác giả, phản hồi ý kiến góp ý (*Review Notes*) và duyệt xuất bản với 1 cú click.
- **Quản lý Sự kiện & Workshop:** Tạo lịch hoạt động, gắn link Google Form đăng ký/check-in, cập nhật trạng thái sự kiện.
- **Quản lý Thành viên & Phân quyền:** Quản lý chức vụ, ban chuyên môn, cấp quyền Admin và kích hoạt tài khoản.
- **Quản lý Dự án, Album & Kho tài liệu:** Quản lý dự án mã nguồn mở, cẩm nang PE và slide workshop FPTU.

---

## ✨ Tính Năng Nổi Bật (Key Features)

- 📊 **Live Realtime Metrics:** Nạp số liệu trực tiếp từ các endpoint API backend với Skeleton pulse loading và cơ chế Error Retry thông minh.
- 📝 **Quy Trình Duyệt Bài Viết 3 Bước:**
  - Lọc theo Tab trạng thái (`Chờ duyệt`, `Cần chỉnh sửa`, `Bản nháp`, `Tất cả`).
  - Hộp thoại xem trước Markdown, trường nhập lời nhắn phản hồi cho tác giả.
  - Phím tắt `ESC` đóng nhanh hộp thoại, nút duyệt tức thì gửi thông báo tự động qua Telegram bot.
- 👥 **Quản lý Thành viên Toàn Diện:** Tra cứu nhanh, lọc theo Ban (Kỹ Thuật, Chuyên Môn, Truyền Thông), cập nhật hồ sơ và chức vụ.
- 🛡️ **Role-Based Access Control (RBAC):** Bảo vệ các route quản trị nghiêm ngặt, tự động điều hướng người dùng chưa đăng nhập.

---

## 💻 Cài Đặt & Chạy Cục Bộ (Local Development)

### Yêu cầu:
- Node.js 20+ và npm / yarn / pnpm
- Dịch vụ Backend đang chạy trên cổng `5000`

### 1. Cài đặt dependencies:
```bash
git clone https://github.com/fudever-club/dever-admin.git
cd dever-admin
npm ci
```

### 2. Cấu hình biến môi trường:
Tạo file `.env.local`:
```env
NEXT_PUBLIC_API_SERVER=http://localhost:5000
NEXT_PUBLIC_LANDING_URL=http://localhost:3000
NEXT_PUBLIC_CLIENT_URL=http://localhost:3002
NEXT_PUBLIC_ADMIN_URL=http://localhost:3003
NEXT_PUBLIC_CLIENT_APP_URL=http://localhost:3002
```

### 3. Khởi chạy ứng dụng:
```bash
npm run dev -- -p 3003
```
Mở trình duyệt tại: `http://localhost:3003/vi/sign-in`

---

## 🧪 Kiểm Thử & Đóng Gói (Quality Checks)

```bash
# Kiểm tra linter
npm run lint

# Đóng gói Production
npm run build
```

---

## 📄 Bản Quyền & Giấy Phép (License)

Dự án được phát triển và duy trì bởi **Ban Kỹ Thuật Câu lạc bộ Lập trình FU-DEVER** - Đại học FPT Đà Nẵng.  
Phát hành theo giấy phép [MIT License](LICENSE).
