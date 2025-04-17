# Hệ thống tư vấn mua laptop theo nhu cầu (AHP)

## Giới thiệu

Hệ thống này giúp người dùng lựa chọn laptop phù hợp với nhu cầu sử dụng của mình bằng phương pháp **AHP (Analytic Hierarchy Process)**. Khi khách hàng truy cập website, họ sẽ chọn **Mục đích sử dụng** (Usage) để xác định nhóm laptop phù hợp. Nếu khách hàng không xác định thêm mức độ ưu tiên cho các tiêu chí khác (Giá, Hiệu năng, Thiết kế, Pin, v.v.), thì **Mục đích sử dụng** sẽ được mặc định ưu tiên hàng đầu.

---

## 1. Mục đích sử dụng (Usage)

**Mục đích sử dụng** xác định nhóm laptop phù hợp với nhu cầu cơ bản của khách hàng. Ví dụ:

- **Học tập & Văn phòng**: Ưu tiên laptop có giá phải chăng, thiết kế nhẹ, thời lượng pin tốt, và hiệu năng đủ dùng cho công việc văn phòng và học trực tuyến.
- **Lập trình**: Ưu tiên laptop có hiệu năng mạnh, CPU/RAM đủ để chạy các IDE và xử lý đa nhiệm.
- **Đồ họa**: Ưu tiên laptop có màn hình sắc nét, hiệu năng mạnh, thời lượng pin lâu và thiết kế phù hợp với công việc sáng tạo.
- **Gaming**: Ưu tiên laptop có GPU mạnh, hiệu năng cao, tần số quét màn hình tốt và hệ thống tản nhiệt hiệu quả.
- **Di chuyển nhiều**: Ưu tiên laptop mỏng nhẹ, thời lượng pin cao, dễ dàng mang theo.

---

## Cập nhật bảng thông số laptop

| Tên Laptop | Mục đích sử dụng | Giá (VNĐ) | Thiết kế & Độ bền | CPU | GPU | Màn hình | Pin |
|------------|------------------|-----------|--------------------|-----|-----|----------|-----|
| HP 15s fq2717TU | Văn phòng, học tập | 12 triệu | Nhựa, mỏng nhẹ | Intel Core i3-1115G4 | Intel UHD | 15.6" FHD | 6h |
| Acer Aspire 3 A315 | Học tập, văn phòng | 14 triệu | Nhựa, cơ bản | AMD Ryzen 5 5500U | Radeon Vega | 15.6" FHD | 7h |
| MacBook Air M2 (2023) | Học tập, văn phòng, di chuyển | 28 triệu | Mỏng nhẹ, build kim loại | Apple M2 | GPU 8-core | 13.6" Retina | 15h |
| Dell XPS 13 Plus | Lập trình, doanh nhân | 35 triệu | Mỏng nhẹ, cao cấp | Intel Core i7-1360P | Intel Iris Xe | 13.4" FHD+ | 12h |
| Lenovo ThinkPad X1 Carbon Gen 11 | Doanh nhân, bền bỉ | 40 triệu | Siêu bền (chuẩn quân đội) | Intel Core i7-1355U | Intel Iris Xe | 14" 2.2K IPS | 14h |
| Asus ROG Strix G16 | Gaming, đồ họa | 39 triệu | Hầm hố, gaming | Intel Core i7-13650HX | RTX 4060 8GB | 16" 165Hz | 6h |
| Acer Nitro 5 (2023) | Gaming, sinh viên | 25 triệu | Hầm hố, tản nhiệt lớn | Intel Core i5-12500H | RTX 3050 4GB | 15.6" 144Hz | 5h |
| MacBook Pro 16" M3 Pro | Đồ họa, lập trình, đa nhiệm | 60 triệu | Mỏng nhẹ, build nhôm | Apple M3 Pro 12-core | GPU 18-core | 16.2" Liquid Retina XDR | 18h |

---

## 🛠 Cách khách hàng chọn lựa trên website tư vấn laptop

1️⃣ **Mục đích sử dụng (Bắt buộc chọn)**

- 🎓 Học tập & Văn phòng (Word, Excel, Zoom, lướt web)
- 💻 Lập trình (Code, Docker, máy ảo, AI)
- 🎨 Thiết kế đồ họa (Photoshop, AutoCAD, Premiere)
- 🎮 Gaming (Game AAA, eSports, FPS cao)
- ✈️ Di chuyển nhiều (Mỏng nhẹ, pin lâu)
- 🔥 Đa nhiệm & làm việc chuyên sâu (RAM nhiều, CPU/GPU mạnh)

2️⃣ **Ngân sách (Budget) (Bắt buộc chọn)**

- 💰 Dưới 15 triệu (Laptop giá rẻ, văn phòng cơ bản)
- 💰 15 - 25 triệu (Laptop tầm trung, gaming entry-level)
- 💰 25 - 40 triệu (Laptop cao cấp, đồ họa, gaming)
- 💰 Trên 40 triệu (MacBook, laptop flagship)

3️⃣ **Thiết kế & Độ bền (Tùy chọn)**

- 🏢 Siêu bền (ThinkPad, Latitude, EliteBook - build kim loại, chống sốc)
- 💼 Mỏng nhẹ (MacBook Air, LG Gram, Dell XPS, Surface Laptop)
- 🛠 Hầm hố, mạnh mẽ (Gaming laptop, máy trạm - Lenovo Legion, Asus ROG, MSI Katana)

4️⃣ **Hiệu năng (CPU & GPU) (Tùy chọn)**

- 🚀 Hiệu năng cao (Intel Core i7/i9, Ryzen 7/9, Apple M2 Pro/Max)
- ⚡ Card đồ họa mạnh (RTX 3050/4060/4070 trở lên, M2 Max)
- 🔋 Máy chạy mượt, pin lâu (M1/M2, chip U-series)

5️⃣ **Kích thước màn hình (Tùy chọn)**

- 📏 13 - 14 inch (Mỏng nhẹ, di động)
- 📏 15 - 16 inch (Cân bằng giữa di động & trải nghiệm)
- 📏 Trên 16 inch (Màn hình lớn, gaming, đồ họa)

---

## 2. Sắp xếp thứ tự ưu tiên (Priority Setting)

Nếu khách hàng có nhu cầu tùy chỉnh thêm, họ có thể sắp xếp mức độ ưu tiên cho các tiêu chí khác:

- **Giá cả (Price)**
- **Hiệu năng (Performance)**
- **Thiết kế & Độ bền (Design & Durability)**
- **Thời lượng pin (Battery Life)**
- **Màn hình (Display Quality & Size)**

**Ví dụ:**

- **Sinh viên:** Ưu tiên: Giá > Pin > Hiệu năng > Màn hình > Thiết kế.
- **Designer:** Ưu tiên: Màn hình > Hiệu năng > Thiết kế > Giá > Pin.
- **Lập trình viên:** Ưu tiên: Hiệu năng > Pin > Màn hình > Giá > Thiết kế.

Nếu khách hàng không chọn mức độ ưu tiên cụ thể cho các tiêu chí, thì **Mục đích sử dụng** sẽ là yếu tố chủ đạo để hệ thống đưa ra đề xuất.

---

## 3. Quy trình hoạt động của hệ thống

1. **Khách hàng truy cập website** và chọn **Mục đích sử dụng** phù hợp với nhu cầu của họ.
2. Hệ thống gán nhóm laptop phù hợp theo **Mục đích sử dụng**.
3. Nếu khách hàng muốn tinh chỉnh thêm, họ có thể chọn mức độ ưu tiên cho các tiêu chí khác (Giá, Hiệu năng, v.v.).
4. Thuật toán AHP sẽ thực hiện:
   - **Xây dựng ma trận so sánh cặp** giữa các tiêu chí dựa trên mức độ ưu tiên.
   - **Tính trọng số** cho từng tiêu chí.
   - **Tính điểm tổng hợp** cho từng laptop dựa trên dữ liệu thông số và trọng số.
5. Hệ thống hiển thị **Top 3 - 5 laptop** phù hợp nhất kèm theo bảng so sánh và liên kết mua hàng.

---

## 4. Kết luận

- **Mục đích sử dụng** được đặt làm ưu tiên mặc định, giúp định hướng nhóm sản phẩm phù hợp ngay từ đầu.
- **Sắp xếp thứ tự ưu tiên** cho phép người dùng tinh chỉnh các yếu tố khác để đạt được kết quả tư vấn chính xác hơn.
- Kết hợp AHP với lựa chọn này giúp đưa ra quyết định toàn diện, vượt qua bộ lọc thông thường chỉ dựa trên các tiêu chí độc lập.

---

## Liên hệ

Nếu có bất kỳ câu hỏi hay đóng góp nào, vui lòng liên hệ qua email hoặc GitHub.

- **Email:** example@email.com  
- **GitHub:** [github.com/username/laptop-recommendation-system](https://github.com/username/laptop-recommendation-system)
