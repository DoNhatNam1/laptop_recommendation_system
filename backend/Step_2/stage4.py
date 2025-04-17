from typing import Dict, Any
import traceback

def normalize_comparison_matrices(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Chuẩn hóa ma trận so sánh
    
    Parameters:
    - input_data: Kết quả từ stage trước (stage3 hoặc stage2 nếu bỏ qua stage3)
    
    Returns:
    - Dictionary chứa ma trận đã được chuẩn hóa
    """
    try:
        # Debug thông tin đầu vào
        print(f"DEBUG stage4 - Đầu vào: {type(input_data)}")
        print(f"DEBUG stage4 - Keys: {input_data.keys() if isinstance(input_data, dict) else 'not dict'}")
        
        # Khởi tạo kết quả
        result = {
            "status": "success",
            "normalized_matrices": {},
            "laptop_details": input_data.get("laptop_details", {})
        }
        
        # Kiểm tra nếu có criteria_totals (từ stage3)
        criteria_totals = input_data.get("criteria_totals", {})
        
        # Nếu không có criteria_totals, có thể đang nhận dữ liệu trực tiếp từ stage2
        if not criteria_totals:
            # Lấy dữ liệu từ stage2
            matrices = input_data.get("matrices", {})
            laptop_details = input_data.get("laptop_details", {})
            laptop_ids = input_data.get("laptop_ids", [])
            
            if not matrices or not laptop_ids:
                print("ERROR stage4 - Không tìm thấy ma trận hoặc danh sách laptop IDs")
                return {"status": "error", "message": "Không tìm thấy dữ liệu ma trận cần thiết"}
                
            # Tính criteria_totals từ dữ liệu stage2
            print("DEBUG stage4 - Tự tính tổng điểm tiêu chí từ ma trận")
            criteria_totals = {}
            
            for criterion, matrix in matrices.items():
                laptop_scores = {}
                column_sums = {}
                
                # Tính tổng cột
                for col_idx, laptop_id in enumerate(laptop_ids):
                    name = laptop_details.get(laptop_id, {}).get("name", f"Laptop {col_idx+1}")
                    
                    # Tính tổng cột
                    col_sum = sum(matrix[row_idx][col_idx] for row_idx in range(len(matrix)))
                    column_sums[name] = round(col_sum, 2)
                    
                    # Tính priority
                    priority = 1/col_sum if col_sum > 0 else 0
                    
                    laptop_scores[name] = {
                        "column_sum": round(col_sum, 2),
                        "priority": priority,
                        "weight": 1.0,  # Giả sử weight = 1 vì không có từ stage1
                        "weighted_score": priority
                    }
                
                criteria_totals[criterion] = {
                    "weight": 1.0,  # Giả sử weight = 1
                    "column_sums": column_sums,
                    "laptop_scores": laptop_scores
                }
        
        print(f"DEBUG stage4 - Xử lý {len(criteria_totals)} tiêu chí")
        
        # Chuẩn hóa điểm cho từng tiêu chí
        for criterion, criterion_data in criteria_totals.items():
            laptop_scores = criterion_data.get("laptop_scores", {})
            
            # Tổng priority của tất cả laptop cho tiêu chí này
            total_priority = sum(data.get("priority", 0) for data in laptop_scores.values())
            
            # Chuẩn hóa priority
            normalized_scores = {}
            for laptop_name, data in laptop_scores.items():
                priority = data.get("priority", 0)
                normalized_score = priority / total_priority if total_priority > 0 else 0
                weight = data.get("weight", 1.0)
                
                normalized_scores[laptop_name] = {
                    "original_priority": priority,
                    "normalized_priority": round(normalized_score, 4),
                    "weight": weight,
                    "weighted_score": round(normalized_score * weight, 4)
                }
            
            result["normalized_matrices"][criterion] = normalized_scores
        
        # Sao chép các thuộc tính bổ sung
        if "step1_weights" in input_data:
            result["step1_weights"] = input_data["step1_weights"]
        
        # Lưu dữ liệu gốc để truyền cho các stage sau
        result["original_data"] = {
            "laptop_details": input_data.get("laptop_details", {}),
            "criteria_totals": criteria_totals
        }
        
        return result
        
    except Exception as e:
        print(f"Stage 4 Exception: {str(e)}")
        print(traceback.format_exc())
        return {"status": "error", "message": f"Lỗi khi chuẩn hóa ma trận: {str(e)}"}