from .stage1 import get_comparison_matrix
from .stage6 import process_user_request_stage6
from .utils import calculate_consistency_index

def process_user_request_stage7(user_data):
    """Stage 7 - Tính Consistency Index (CI)"""
    # Tái sử dụng kết quả từ stage6
    stage6_result = process_user_request_stage6(user_data)
    
    if "error" in stage6_result:
        return stage6_result
    
    # Lấy ma trận từ stage1 hoặc tính toán lại nếu cần
    matrix, criteria_order = get_comparison_matrix(user_data)
    
    # Xử lý đặc biệt cho ma trận 1x1 hoặc 2x2
    n = len(matrix)
    if n <= 2:
        # Với ma trận 1x1 và 2x2, CI luôn bằng 0
        
        # Kết hợp kết quả từ stage6 và thêm kết quả mới cho ma trận nhỏ
        result = stage6_result.copy()
        result["stage"] = "stage7"
        result["CI"] = 0
        result["formula"] = "(λmax - n) / (n - 1) = 0 (với ma trận kích thước ≤ 2)"
        result["calculation"] = f"({n} - {n}) / ({n} - 1) = 0"
        result["message"] = f"Ma trận {n}x{n} luôn nhất quán với CI = 0."
        
        return result
    
    # Lấy lambda_max từ stage6
    lambda_max = float(stage6_result["lambda_max"])
    
    # Tính CI
    CI = calculate_consistency_index(lambda_max, n)
    
    # Kết hợp kết quả từ stage6 và thêm kết quả mới
    result = stage6_result.copy()
    result["stage"] = "stage7"
    result["CI"] = round(float(CI), 3)
    result["formula"] = "(λmax - n) / (n - 1)"
    result["calculation"] = f"({round(float(lambda_max), 3)} - {n}) / ({n} - 1) = {round(float(CI), 3)}"
    result["message"] = f"Đã tính toán CI = {round(float(CI), 3)}"
    
    return result