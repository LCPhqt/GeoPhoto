# 📶 Hướng dẫn Chia sẻ ảnh trong mạng LAN

## 📋 Tổng quan

Hướng dẫn này giúp bạn chia sẻ ảnh cho bạn bè **trong cùng mạng WiFi/LAN** (cùng nhà, cùng trường, cùng văn phòng).

---

## ✅ Điều kiện

- Cả hai máy phải **kết nối cùng một WiFi** hoặc cùng mạng LAN
- Máy chạy ứng dụng GeoPhoto phải bật Backend và Frontend
- Firewall cho phép port 5173 và 8080

---

## 🚀 Các bước thực hiện

### Bước 1: Lấy địa chỉ IP của máy chạy ứng dụng

Mở PowerShell và chạy:

```powershell
ipconfig | Select-String "IPv4"
```

**Kết quả ví dụ:**
```
IPv4 Address. . . . . . . . . . . : 192.168.1.18
```

👉 Ghi nhớ IP này (ví dụ: `192.168.1.18`)

---

### Bước 2: Chạy Backend

Mở Terminal 1:

```powershell
cd D:\_StudyCode\Thay_Binh\GeoPhoto\backend
mvn spring-boot:run
```

Đợi đến khi thấy:
```
Started GeoPhotoApplication in X.XXX seconds
```

---

### Bước 3: Chạy Frontend

Mở Terminal 2:

```powershell
cd D:\_StudyCode\Thay_Binh\GeoPhoto\frontend
npm run dev
```

Kết quả:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.18:5173/   ← URL cho máy khác
```

---

### Bước 4: Truy cập ứng dụng

| Máy | URL truy cập |
|-----|--------------|
| Máy chạy ứng dụng | `http://localhost:5173` |
| Máy khác trong LAN | `http://192.168.1.18:5173` |

---

### Bước 5: Tạo link chia sẻ

1. Đăng nhập vào ứng dụng
2. Vào **Thư viện ảnh** hoặc **Album**
3. Click nút **Share (🔗)** trên ảnh/album muốn chia sẻ
4. Điền thông tin (tùy chọn):
   - Tiêu đề
   - Mô tả
   - Mật khẩu bảo vệ
   - Thời hạn hết hạn
5. Click **"Tạo link chia sẻ"**

---

### Bước 6: Gửi link cho bạn bè

⚠️ **QUAN TRỌNG**: Khi copy link, **PHẢI thay `localhost` bằng IP của máy bạn**

```
❌ SAI:   http://localhost:5173/share/abc123xy
✅ ĐÚNG:  http://192.168.1.18:5173/share/abc123xy
```

Gửi link đã sửa cho bạn bè qua Zalo, Messenger, Email...

---

### Bước 7: Bạn bè xem ảnh

Bạn bè chỉ cần:
1. Mở link trên trình duyệt
2. Nhập mật khẩu (nếu có)
3. Xem ảnh!

---

## 🔥 Cấu hình Firewall (nếu cần)

Nếu bạn bè không thể truy cập, có thể Firewall đang chặn. Chạy PowerShell **với quyền Admin**:

```powershell
# Cho phép Frontend (port 5173)
New-NetFirewallRule -DisplayName "GeoPhoto Frontend" -Direction Inbound -Port 5173 -Protocol TCP -Action Allow

# Cho phép Backend (port 8080)
New-NetFirewallRule -DisplayName "GeoPhoto Backend" -Direction Inbound -Port 8080 -Protocol TCP -Action Allow
```

---

## ❓ Câu hỏi thường gặp

### Q: Làm sao biết IP của máy tôi?
**A:** Chạy `ipconfig | Select-String "IPv4"` trong PowerShell

### Q: Bạn tôi báo "Không thể kết nối"?
**A:** Kiểm tra:
- Cả hai có cùng WiFi không?
- Backend và Frontend đang chạy?
- Firewall đã mở port chưa?

### Q: Link chỉ hiện trang trắng?
**A:** Đảm bảo đã thay `localhost` bằng IP thực

### Q: Ảnh không hiển thị?
**A:** Backend phải đang chạy. Kiểm tra Terminal 1 có lỗi không.

### Q: Muốn chia sẻ cho người ở xa (khác WiFi)?
**A:** Xem file `HUONGDAN_CHIASE_INTERNET.md` (dùng ngrok)

---

## 📊 Sơ đồ hoạt động

```
┌─────────────────────────────────────────────────────────────┐
│                      MẠNG LAN/WiFi                          │
│                                                             │
│  ┌─────────────────────┐      ┌─────────────────────┐      │
│  │   MÁY CHẠY APP      │      │   MÁY BẠN BÈ        │      │
│  │                     │      │                     │      │
│  │  Backend :8080      │◄────►│  Truy cập qua IP    │      │
│  │  Frontend :5173     │      │  192.168.1.18:5173  │      │
│  │                     │      │                     │      │
│  │  IP: 192.168.1.18   │      │                     │      │
│  └─────────────────────┘      └─────────────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Ví dụ thực tế

### Tình huống: Bạn muốn chia sẻ ảnh du lịch cho bạn cùng phòng

1. **Bạn** (máy chạy app):
   - Chạy Backend + Frontend
   - IP của bạn: `192.168.1.50`
   - Tạo link chia sẻ: `http://localhost:5173/share/xyz789`
   - Sửa thành: `http://192.168.1.50:5173/share/xyz789`
   - Gửi link cho bạn bè

2. **Bạn bè** (máy khác):
   - Mở link: `http://192.168.1.50:5173/share/xyz789`
   - Xem ảnh thành công! 🎉

---

## 🎯 Checklist

- [ ] Đã lấy IP máy chạy app
- [ ] Backend đang chạy (port 8080)
- [ ] Frontend đang chạy (port 5173)
- [ ] Cùng mạng WiFi/LAN
- [ ] Đã mở Firewall (nếu cần)
- [ ] Đã thay `localhost` → IP thực trong link
- [ ] Bạn bè có thể truy cập!

---

*Tài liệu này dành cho việc chia sẻ trong mạng LAN. Để chia sẻ qua Internet, xem hướng dẫn khác.*
