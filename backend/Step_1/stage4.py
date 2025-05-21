from typing import Dict, Any, List
import traceback

def calculate_criteria_weights(normalized_matrix: List[List[float]]) -> List[float]:
    """
    Tính trọng số các tiêu chí từ ma trận đã chuẩn hóa
    
    Parameters:
    - normalized_matrix: Ma trận đã chuẩn hóa
    
    Returns:
    - Danh sách trọng số các tiêu chí
    """
    if not normalized_matrix or len(normalized_matrix) == 0:
        return []
    
    n = len(normalized_matrix)
    weights = [0.0] * n
    
    # Tính trung bình các hàng
    for i in range(n):
        row_sum = sum(normalized_matrix[i])
        weights[i] = row_sum / n
    
    return weights

def calculate_weights(stage3_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Stage 4 - Tính trọng số các tiêu chí
    
    Parameters:
    - stage3_result: Kết quả từ Stage 3 chứa ma trận đã chuẩn hóa
    
    Returns:
    - Dictionary chứa trọng số các tiêu chí
    """
    try:
        # Kiểm tra đầu vào
        if "status" in stage3_result and stage3_result["status"] == "error":
            return stage3_result
        
        normalized_matrix = stage3_result.get("normalized_matrix")
        criteria_order = stage3_result.get("criteria_order")
        
        if normalized_matrix is None or criteria_order is None:
            return {
                "status": "error",
                "message": "Không tìm thấy ma trận chuẩn hóa hoặc danh sách tiêu chí từ Stage 3"
            }
        
        # Tính trọng số
        weights = calculate_criteria_weights(normalized_matrix)
        
        # Xử lý đặc biệt cho ma trận kích thước nhỏ (1x1 hoặc 2x2)
        n = len(normalized_matrix)
        if n <= 2:
            weights = [1/n] * n
        
        # Định dạng trọng số
        criteria_weights = []
        for i, criterion in enumerate(criteria_order):
            if i < len(weights):
                criteria_weights.append({
                    "criterion": criterion,
                    "weight": round(weights[i], 3),
                    "percentage": round(weights[i] * 100, 1)
                })
        
        # Sắp xếp trọng số theo thứ tự giảm dần
        criteria_weights.sort(key=lambda x: x["weight"], reverse=True)
        
        # Kết hợp kết quả
        result = {
            "status": "success",
            "stage": "stage4",
            "matrix": stage3_result.get("matrix"),
            "matrix_data": stage3_result.get("matrix_data", []),
            "criteria_order": criteria_order,
            "criteria_count": n,
            "column_sums": stage3_result.get("column_sums", []),
            "normalized_matrix": normalized_matrix,
            "normalized_matrix_data": stage3_result.get("normalized_matrix_data", []),
            "weights": weights,
            "weights_formatted": criteria_weights,
            "validation": stage3_result.get("validation", {})
        }
        
        return result
        
    except Exception as e:
        print(f"ERROR stage4 - {str(e)}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Lỗi khi tính trọng số: {str(e)}"
        }