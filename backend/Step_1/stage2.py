from .stage1 import get_comparison_matrix, process_user_request_stage1
from .utils import calculate_matrix_column_sums

def process_user_request_stage2(user_data):
    """Stage 2 - Tính tổng cột"""
    # Tái sử dụng kết quả từ stage1
    stage1_result = process_user_request_stage1(user_data)
    
    if "error" in stage1_result:
        return stage1_result
    
    # Lấy ma trận từ stage1 hoặc tính toán lại nếu cần
    matrix, criteria_order = get_comparison_matrix(user_data)
    
    # Tính toán tổng cột
    col_sums = calculate_matrix_column_sums(matrix)
    
    # Kết hợp kết quả từ stage1 và thêm kết quả mới
    result = {
        "status": "success",
        "stage": "stage2",
        "matrix": stage1_result["matrix"],  # Tái sử dụng từ stage1
        "column_sums": [round(sum_val, 3) for sum_val in col_sums],
        "validation": stage1_result.get("validation", {})  # Tái sử dụng từ stage1 nếu có
    }
    
    return result