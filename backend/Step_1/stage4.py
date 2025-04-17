from .stage1 import get_comparison_matrix
from .stage3 import process_user_request_stage3
from .utils import calculate_criteria_weights, calculate_consistency_ratio

def process_user_request_stage4(user_data):
    """Stage 4 - Tính trọng số tiêu chí"""
    # Tái sử dụng kết quả từ stage3
    stage3_result = process_user_request_stage3(user_data)
    
    if "error" in stage3_result:
        return stage3_result
    
    # Lấy ma trận từ stage1 hoặc tính toán lại nếu cần
    matrix, criteria_order = get_comparison_matrix(user_data)
    
    # Xử lý đặc biệt cho ma trận 1x1 hoặc 2x2
    n = len(matrix)
    if n <= 2:
        weights = [1/n] * n
        criteria_weights = []
        for i, criterion in enumerate(criteria_order):
            criteria_weights.append({
                "criterion": criterion,
                "weight": round(weights[i], 3),
                "percentage": round(weights[i] * 100, 1)
            })
        
        # Kết hợp kết quả từ stage3 và thêm kết quả mới cho ma trận nhỏ
        result = {
            "status": "success",
            "stage": "stage4",
            "matrix": stage3_result["matrix"],  # Tái sử dụng từ stage3
            "column_sums": stage3_result["column_sums"],  # Tái sử dụng từ stage3
            "normalized_matrix": stage3_result["normalized_matrix"],  # Tái sử dụng từ stage3
            "weights": {
                "values": weights,
                "formatted": criteria_weights
            },
            "message": "Các tiêu chí có trọng số bằng nhau khi số tiêu chí ≤ 2.",
            "validation": stage3_result.get("validation", {})  # Tái sử dụng từ stage3 nếu có
        }
        
        return result
    
    # Tính trọng số từ ma trận chuẩn hóa
    normalized_matrix = []
    for row in stage3_result["normalized_matrix"]:
        normalized_matrix.append([float(val) for val in row])
    
    weights = calculate_criteria_weights(normalized_matrix)
    
    # Kiểm tra nhất quán nhanh
    cr = calculate_consistency_ratio(matrix)
    is_consistent = cr < 0.1
    
    # Tạo warning nếu ma trận không nhất quán
    warning = None
    if not is_consistent:
        warning = f"Ma trận không nhất quán (CR = {cr:.3f} > 0.1), kết quả có thể không tin cậy."
    
    # Format trọng số
    criteria_weights = []
    for i, criterion in enumerate(criteria_order):
        if i < len(weights):
            criteria_weights.append({
                "criterion": criterion,
                "weight": round(weights[i], 3),
                "percentage": round(weights[i] * 100, 1)
            })
    
    # Kết hợp kết quả từ stage3 và thêm kết quả mới
    result = {
        "status": "success",
        "stage": "stage4",
        "matrix": stage3_result["matrix"],  # Tái sử dụng từ stage3
        "column_sums": stage3_result["column_sums"],  # Tái sử dụng từ stage3
        "normalized_matrix": stage3_result["normalized_matrix"],  # Tái sử dụng từ stage3
        "weights": {
            "values": [round(val, 3) for val in weights],
            "formatted": criteria_weights
        },
        "consistency_check": {
            "cr": round(cr, 3),
            "is_consistent": is_consistent,
            "warning": warning
        },
        "validation": stage3_result.get("validation", {})  # Tái sử dụng từ stage3 nếu có
    }
    
    return result