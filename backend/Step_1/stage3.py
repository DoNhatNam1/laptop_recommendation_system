from .stage1 import get_comparison_matrix
from .stage2 import process_user_request_stage2
from .utils import normalize_matrix

def process_user_request_stage3(user_data):
    """Stage 3 - Chuẩn hóa ma trận"""
    # Tái sử dụng kết quả từ stage2
    stage2_result = process_user_request_stage2(user_data)
    
    if "error" in stage2_result:
        return stage2_result
    
    # Lấy ma trận từ stage1 hoặc tính toán lại nếu cần
    matrix, criteria_order = get_comparison_matrix(user_data)
    
    # Chuẩn hóa ma trận
    normalized_matrix = normalize_matrix(matrix)
    
    # Kết hợp kết quả từ stage2 và thêm kết quả mới
    result = {
        "status": "success",
        "stage": "stage3",
        "matrix": stage2_result["matrix"],  # Tái sử dụng từ stage2
        "column_sums": stage2_result["column_sums"],  # Tái sử dụng từ stage2
        "normalized_matrix": [[round(val, 3) for val in row] for row in normalized_matrix],
        "validation": stage2_result.get("validation", {})  # Tái sử dụng từ stage2 nếu có
    }
    
    return result