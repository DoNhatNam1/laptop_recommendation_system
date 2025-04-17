from typing import Dict, Any, List
import traceback

def build_comparison_matrices(filtered_result: Dict[str, Any], weights: Dict[str, float] = None) -> Dict[str, Any]:
    """
    Xây dựng các ma trận so sánh cho từng tiêu chí
    
    Parameters:
    - filtered_result: Kết quả từ stage 1 (danh sách laptop đã lọc)
    - weights: Trọng số các tiêu chí từ Step 1 (tùy chọn)
    
    Returns:
    - Dictionary chứa ma trận so sánh cho từng tiêu chí
    """
    # Sử dụng weights nếu được truyền vào, nếu không thì bỏ qua
    if weights is None:
        weights = filtered_result.get("weights", {})
    
    try:
        # Debug thông tin đầu vào
        filtered_laptops = filtered_result.get("filtered_laptops", [])
        laptop_count = len(filtered_laptops)
        print(f"DEBUG stage2 - Số laptop đầu vào: {laptop_count}")
        
        if not filtered_laptops:
            print("ERROR stage2 - Không tìm thấy laptop đã lọc")
            return {"status": "error", "message": "Không tìm thấy laptop đã lọc"}
        
        # Xác định tiêu chí để so sánh
        criteria = ["Hiệu năng", "Giá", "Màn hình", "Pin", "Thiết kế", "Độ bền"]
        
        # Khởi tạo kết quả
        result = {
            "status": "success",
            "matrices": {},
            "laptop_details": {},
            "laptop_ids": [],
            "criteria": criteria
        }
        
        # Chuẩn bị thông tin cho từng laptop
        laptop_ids = []
        for laptop in filtered_laptops:
            laptop_id = laptop.get("id")
            if not laptop_id:
                print(f"WARNING stage2 - Laptop không có ID: {laptop}")
                continue
                
            laptop_ids.append(laptop_id)
                
            # Lưu thông tin laptop
            result["laptop_details"][laptop_id] = {
                "name": laptop.get("name", f"Laptop {laptop_id}"),
                "price": laptop.get("price", 0),
                "cpu": laptop.get("cpu", ""),
                "ram": laptop.get("ram", ""),
                "storage": laptop.get("storage", ""),
                "screen": laptop.get("screen", 0),
                "screenName": laptop.get("screenName", ""),
                "battery": laptop.get("battery", 0),
                "design": laptop.get("design", ""),
                "build_quality": laptop.get("build_quality", ""),
                "performance": laptop.get("performance", "basic")
            }
        
        if not laptop_ids:
            print("ERROR stage2 - Không tìm thấy laptop IDs hợp lệ")
            return {"status": "error", "message": "Không tìm thấy laptop IDs hợp lệ"}
        
        # Lưu danh sách laptop IDs
        result["laptop_ids"] = laptop_ids
        laptop_count = len(laptop_ids)
        print(f"DEBUG stage2 - Số laptop hợp lệ: {laptop_count}")
        
        # Xây dựng ma trận so sánh cho từng tiêu chí
        for criterion in criteria:
            try:
                print(f"DEBUG stage2 - Xây dựng ma trận cho tiêu chí: {criterion}")
                
                # Tạo ma trận có kích thước nxn (n là số laptop)
                matrix = [[1.0 for _ in range(laptop_count)] for _ in range(laptop_count)]
                
                # Xây dựng ma trận so sánh
                for i in range(laptop_count):
                    laptop_i_id = laptop_ids[i]
                    laptop_i = result["laptop_details"][laptop_i_id]
                    
                    for j in range(laptop_count):
                        if i == j:
                            # Giá trị chéo chính bằng 1 (laptop so với chính nó)
                            matrix[i][j] = 1.0
                            continue
                        
                        laptop_j_id = laptop_ids[j]
                        laptop_j = result["laptop_details"][laptop_j_id]
                        
                        # Tính giá trị so sánh
                        comparison_value = compare_laptops(laptop_i, laptop_j, criterion)
                        
                        # Kiểm tra giá trị hợp lệ
                        if not isinstance(comparison_value, (int, float)) or comparison_value <= 0:
                            print(f"WARNING stage2 - Giá trị so sánh không hợp lệ cho {criterion}: {comparison_value}, sử dụng giá trị mặc định 1.0")
                            comparison_value = 1.0
                            
                        matrix[i][j] = comparison_value
                
                # Kiểm tra tính nhất quán thô và sửa ma trận nếu cần
                for i in range(laptop_count):
                    for j in range(laptop_count):
                        if i != j:
                            # Đảm bảo a_ij = 1/a_ji (tính đối xứng)
                            if abs(matrix[i][j] * matrix[j][i] - 1.0) > 0.01:
                                # Đảm bảo tính đối xứng
                                matrix[j][i] = 1.0 / matrix[i][j]
                
                # Lưu ma trận
                result["matrices"][criterion] = matrix
                
            except Exception as e:
                print(f"ERROR stage2 - Lỗi khi xây dựng ma trận cho tiêu chí {criterion}: {str(e)}")
                print(traceback.format_exc())
                
                # Tạo ma trận đơn vị nếu có lỗi (để đảm bảo có ma trận cho tiêu chí)
                result["matrices"][criterion] = [[1.0 if i == j else 1.0 for j in range(laptop_count)] for i in range(laptop_count)]
                continue
        
        if not result["matrices"]:
            print("ERROR stage2 - Không thể xây dựng ma trận cho bất kỳ tiêu chí nào")
            return {"status": "error", "message": "Không thể xây dựng ma trận so sánh"}
        
        print(f"DEBUG stage2 - Đã xây dựng ma trận thành công cho {len(result['matrices'])} tiêu chí")
        return result
        
    except Exception as e:
        print(f"Stage 2 Exception: {str(e)}")
        print(traceback.format_exc())
        return {"status": "error", "message": f"Lỗi khi xây dựng ma trận so sánh: {str(e)}"}

def compare_laptops(laptop_i: Dict[str, Any], laptop_j: Dict[str, Any], criterion: str) -> float:
    """
    So sánh hai laptop dựa trên một tiêu chí cụ thể
    
    Returns:
    - Giá trị so sánh (>1 nếu laptop_i tốt hơn laptop_j, <1 nếu ngược lại, =1 nếu ngang nhau)
    """
    try:
        if criterion == "Hiệu năng":
            # So sánh hiệu năng dựa trên trường performance
            performance_map = {
                "basic": 1,
                "smooth": 2,
                "advanced": 3,
                "extreme": 4
            }
            perf_i = performance_map.get(str(laptop_i.get("performance", "basic")).lower(), 1)
            perf_j = performance_map.get(str(laptop_j.get("performance", "basic")).lower(), 1)
            
            if perf_i == perf_j:
                # Xem xét CPU nếu mức hiệu năng như nhau
                cpu_i = str(laptop_i.get("cpu", "")).lower()
                cpu_j = str(laptop_j.get("cpu", "")).lower()
                
                # Đánh giá CPU dựa trên tên
                if "i9" in cpu_i or "ryzen 9" in cpu_i:
                    perf_i += 0.5
                elif "i7" in cpu_i or "ryzen 7" in cpu_i:
                    perf_i += 0.3
                
                if "i9" in cpu_j or "ryzen 9" in cpu_j:
                    perf_j += 0.5
                elif "i7" in cpu_j or "ryzen 7" in cpu_j:
                    perf_j += 0.3
                    
                # Xem xét RAM nếu CPU tương đương
                if perf_i == perf_j:
                    ram_i = parse_ram_size(laptop_i.get("ram", ""))
                    ram_j = parse_ram_size(laptop_j.get("ram", ""))
                    if ram_i > 0 and ram_j > 0:
                        return ram_i / ram_j
            
            if perf_i > 0 and perf_j > 0:
                return perf_i / perf_j
            return 1.0
            
        elif criterion == "Giá":
            # Giá thấp hơn sẽ tốt hơn (tỷ lệ nghịch)
            price_i = float(laptop_i.get("price", 0))
            price_j = float(laptop_j.get("price", 0))
            
            if price_i > 0 and price_j > 0:
                return price_j / price_i  # Giá thấp hơn được xếp hạng cao hơn
            return 1.0
            
        elif criterion == "Màn hình":
            # So sánh kích thước và chất lượng màn hình
            screen_i = float(laptop_i.get("screen", 0))
            screen_j = float(laptop_j.get("screen", 0))
            
            # Xem xét cả chất lượng màn hình
            screen_name_i = str(laptop_i.get("screenName", "")).lower()
            screen_name_j = str(laptop_j.get("screenName", "")).lower()
            
            quality_i = 1.0
            quality_j = 1.0
            
            # Tăng điểm cho màn hình chất lượng cao
            if "oled" in screen_name_i or "amoled" in screen_name_i:
                quality_i = 1.5
            elif "ips" in screen_name_i:
                quality_i = 1.2
            
            # Tăng điểm cho độ phân giải cao
            if "4k" in screen_name_i or "uhd" in screen_name_i:
                quality_i *= 1.3
            elif "2.8k" in screen_name_i or "2.5k" in screen_name_i or "wqhd" in screen_name_i:
                quality_i *= 1.2
            elif "2k" in screen_name_i or "qhd" in screen_name_i:
                quality_i *= 1.1
                
            if "oled" in screen_name_j or "amoled" in screen_name_j:
                quality_j = 1.5
            elif "ips" in screen_name_j:
                quality_j = 1.2
                
            # Tăng điểm cho độ phân giải cao
            if "4k" in screen_name_j or "uhd" in screen_name_j:
                quality_j *= 1.3
            elif "2.8k" in screen_name_j or "2.5k" in screen_name_j or "wqhd" in screen_name_j:
                quality_j *= 1.2
            elif "2k" in screen_name_j or "qhd" in screen_name_j:
                quality_j *= 1.1
                
            # Tính điểm tổng hợp
            screen_score_i = screen_i * quality_i
            screen_score_j = screen_j * quality_j
            
            if screen_score_i > 0 and screen_score_j > 0:
                return screen_score_i / screen_score_j
            return 1.0
            
        elif criterion == "Pin":
            # So sánh dung lượng pin
            battery_i = float(laptop_i.get("battery", 0))
            battery_j = float(laptop_j.get("battery", 0))
            
            if battery_i > 0 and battery_j > 0:
                return battery_i / battery_j
            return 1.0
            
        elif criterion == "Thiết kế":
            # So sánh thiết kế
            design_map = {
                "heavyweight": 1,
                "bulky": 1.2,
                "standard": 2,
                "gaming": 2.5,
                "business": 3,
                "modular": 3.2,
                "convertible": 3.5,
                "lightweight": 4,
                "premium": 4.5
            }
            
            design_i = design_map.get(str(laptop_i.get("design", "standard")).lower(), 2)
            design_j = design_map.get(str(laptop_j.get("design", "standard")).lower(), 2)
            
            if design_i > 0 and design_j > 0:
                return design_i / design_j
            return 1.0
            
        elif criterion == "Độ bền":
            # So sánh độ bền
            build_map = {
                "low": 1,
                "medium": 2,
                "high": 3,
                "premium": 4,
                "military-grade": 5
            }
            
            build_i = build_map.get(str(laptop_i.get("build_quality", "medium")).lower(), 2)
            build_j = build_map.get(str(laptop_j.get("build_quality", "medium")).lower(), 2)
            
            if build_i > 0 and build_j > 0:
                return build_i / build_j
            return 1.0
            
        else:
            # Tiêu chí không được hỗ trợ
            return 1.0
            
    except Exception as e:
        print(f"ERROR compare_laptops - {criterion}: {str(e)}")
        print(traceback.format_exc())
        return 1.0  # Trả về 1.0 nếu có lỗi (bằng nhau)

def parse_ram_size(ram_str: str) -> float:
    """
    Phân tích chuỗi RAM để lấy kích thước (GB)
    Ví dụ: "16GB DDR4" -> 16.0
    """
    try:
        ram_str = str(ram_str).upper()
        if "GB" in ram_str:
            parts = ram_str.split("GB")[0].strip()
            return float(parts)
        else:
            # Cố gắng lấy số đầu tiên trong chuỗi
            import re
            numbers = re.findall(r'\d+', ram_str)
            if numbers:
                return float(numbers[0])
        return 0
    except Exception:
        return 0