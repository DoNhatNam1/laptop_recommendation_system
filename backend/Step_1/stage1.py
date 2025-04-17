from .utils import build_matrix_from_comparisons

# Thứ tự tiêu chí cố định - chỉ sử dụng khi cần sắp xếp các tiêu chí
ORDER_LABEL_ROW = ["Hiệu năng", "Giá thành", "Màn hình", "Thời lượng pin", "Thiết kế", "Độ bền"]
ORDER_LABEL_COL = ["Hiệu năng", "Giá thành", "Màn hình", "Thời lượng pin", "Thiết kế", "Độ bền"]

def get_comparison_matrix(user_data):
    """Lấy ma trận so sánh từ dữ liệu người dùng"""
    if "comparisons" in user_data and user_data["comparisons"]:
        # Xác định các tiêu chí từ dữ liệu so sánh (nếu không đủ 6 tiêu chí hoặc khác tên)
        matrix, criteria_list = build_matrix_from_comparisons(
            user_data["comparisons"], 
            ORDER_LABEL_ROW, 
            ORDER_LABEL_COL
        )
        return matrix, criteria_list
    else:
        return None, None

def process_user_request_stage1(user_data):
    """Stage 1 - Khởi tạo và hiển thị ma trận"""
    if not user_data:
        return {"error": "Không có dữ liệu yêu cầu từ người dùng"}
    
    matrix, criteria_order = get_comparison_matrix(user_data)
    
    if matrix is None:
        return {"error": "Không thể xây dựng ma trận từ dữ liệu so sánh"}
    
    matrix_data = [[round(val, 3) for val in row] for row in matrix]
    
    # Kiểm tra tính hợp lệ của ma trận (đối xứng nghịch đảo)
    is_valid = True
    validation_issues = []
    n = len(matrix)
    
    for i in range(n):
        for j in range(i+1, n):
            if abs(matrix[i][j] * matrix[j][i] - 1.0) > 0.01:
                is_valid = False
                validation_issues.append(f"Vấn đề với {criteria_order[i]} và {criteria_order[j]}: {matrix[i][j]} * {matrix[j][i]} != 1")
    
    return {
        "status": "success",
        "stage": "stage1",
        "matrix": {
            "criteria_order": criteria_order,
            "criteria_count": len(criteria_order),
            "data": matrix_data
        },
        "validation": {
            "is_valid": is_valid,
            "issues": validation_issues
        }
    }