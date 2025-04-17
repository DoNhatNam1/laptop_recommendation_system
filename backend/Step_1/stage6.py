from .stage1 import get_comparison_matrix
from .stage5 import process_user_request_stage5
from .utils import calculate_lambda_max

def process_user_request_stage6(user_data):
    """Stage 6 - Tính lambda_max (giá trị riêng lớn nhất)"""
    # Tái sử dụng kết quả từ stage5
    stage5_result = process_user_request_stage5(user_data)
    
    if "error" in stage5_result:
        return stage5_result
    
    # Lấy ma trận từ stage1 hoặc tính toán lại nếu cần
    matrix, criteria_order = get_comparison_matrix(user_data)
    
    # Xử lý đặc biệt cho ma trận 1x1 hoặc 2x2
    n = len(matrix)
    if n <= 2:
        # Với ma trận 1x1 và 2x2, lambda_max = n
        
        # Kết hợp kết quả từ stage5 và thêm kết quả mới cho ma trận nhỏ
        result = stage5_result.copy()
        result["stage"] = "stage6"
        result["lambda_max"] = n
        result["message"] = f"Với ma trận {n}x{n}, λmax luôn bằng {n}."
        
        return result
    
    # Lấy vector nhất quán từ stage5
    consistency_vector = [float(val) for val in stage5_result["consistency_vector"]["values"]]
    
    # Tính lambda_max
    lambda_max = calculate_lambda_max(consistency_vector)
    
    # Kết hợp kết quả từ stage5 và thêm kết quả mới
    result = stage5_result.copy()
    result["stage"] = "stage6"
    result["lambda_max"] = round(float(lambda_max), 3)
    result["formula"] = "λmax = (Σλi) / n = " + \
                       f"{' + '.join([f'{round(val, 3)}' for val in consistency_vector])} / {n}"
    result["calculation"] = f"{round(sum(consistency_vector), 3)} / {n} = {round(float(lambda_max), 3)}"
    result["message"] = f"Đã tính toán λmax = {round(float(lambda_max), 3)}"
    
    return result