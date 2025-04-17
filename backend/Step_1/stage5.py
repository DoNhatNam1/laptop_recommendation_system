from .stage1 import get_comparison_matrix
from .stage4 import process_user_request_stage4
from .utils import calculate_consistency_vector

def process_user_request_stage5(user_data):
    """Stage 5 - Tính vector nhất quán λ"""
    # Tái sử dụng kết quả từ stage4
    stage4_result = process_user_request_stage4(user_data)
    
    if "error" in stage4_result:
        return stage4_result
    
    # Lấy ma trận từ stage1 hoặc tính toán lại nếu cần
    matrix, criteria_order = get_comparison_matrix(user_data)
    
    # Xử lý đặc biệt cho ma trận 1x1 hoặc 2x2
    n = len(matrix)
    if n <= 2:
        weights = stage4_result["weights"]["values"]
        consistency_vector = [n] * n
        
        # Tạo bảng kết quả cho mỗi tiêu chí
        criteria_consistency = []
        for i, criterion in enumerate(criteria_order):
            criteria_consistency.append({
                "criterion": criterion,
                "weight": round(weights[i], 3),
                "consistency_value": n
            })
        
        # Kết hợp kết quả từ stage4 và thêm kết quả mới cho ma trận nhỏ
        result = stage4_result.copy()
        result["stage"] = "stage5"
        result["consistency_vector"] = {
            "values": [n] * n,
            "by_criterion": criteria_consistency
        }
        result["message"] = "Vector nhất quán là hằng số cho ma trận kích thước ≤ 2."
        
        return result
    
    # Lấy trọng số từ stage4
    weights = [float(w) for w in stage4_result["weights"]["values"]]
    
    # Tính vector nhất quán
    consistency_vector = calculate_consistency_vector(matrix, weights)
    
    # Tạo bảng kết quả cho mỗi tiêu chí
    criteria_consistency = []
    for i, criterion in enumerate(criteria_order):
        if i < len(weights):
            criteria_consistency.append({
                "criterion": criterion,
                "weight": round(weights[i], 3),
                "consistency_value": round(consistency_vector[i], 3)
            })
    
    # Kết hợp kết quả từ stage4 và thêm kết quả mới
    result = stage4_result.copy()
    result["stage"] = "stage5"
    result["consistency_vector"] = {
        "values": [round(val, 3) for val in consistency_vector],
        "by_criterion": criteria_consistency
    }
    result["message"] = "Đã tính toán vector nhất quán λ."
    
    return result