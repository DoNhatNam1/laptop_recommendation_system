+------------------+                  +--------------------+
| CLIENT-SIDE      |                  | SERVER-SIDE        |
+------------------+                  +--------------------+
| 1. Cấu hình      |   JSON Request   | 1. Nhận input      |
|    - Usage       | -------------→   |                    |
|    - Budget      |                  | 2. Xác định nhóm   |
|    - Preferences |                  |    khách hàng &    |
|                  |                  |    loại laptop     |
|                  |                  |                    |
|                  |                  | 3. Lấy ma trận     |
|                  |                  |    trọng số đã     |
|                  |                  |    định nghĩa      |
|                  |                  |                    |
|                  |                  | 4. Lọc laptop      |
|                  |                  |    phù hợp từ DB   |
|                  |                  |                    |
| 5. Hiển thị kết  |   JSON Response  | 5. Tính điểm       |
|    quả gợi ý     | ←-------------   |    AHP cho mỗi     |
|    - Top laptops |                  |    laptop          |
|    - So sánh     |                  |                    |
|    - Mua hàng    |                  | 6. Sắp xếp &       |
+------------------+                  |    trả kết quả     |
                                      +--------------------+