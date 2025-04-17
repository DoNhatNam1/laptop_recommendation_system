import numpy as np
from .usage_classifier import (
    ORDER_LABEL_ROW,
    ORDER_LABEL_COL
)
from .start import initialize_step1
from .utils import (
    calculate_matrix_column_sums,
    normalize_matrix,
    calculate_criteria_weights,
    calculate_consistency_ratio,
    build_matrix_from_comparisons,
    calculate_consistency_vector,
    calculate_lambda_max,
    calculate_consistency_index,
    get_random_index
)

# Định nghĩa thứ tự tiêu chí tiêu chuẩn cho hiển thị
DISPLAY_CRITERIA_ORDER = ["Hiệu năng", "Giá", "Màn hình", "Pin", "Thiết kế", "Độ bền"]
EXCEL_CRITERIA_ORDER = ["Hiệu năng", "Giá", "Màn hình", "Pin", "Thiết kế", "Độ bền"]

def map_criteria_name(criterion):
    """
    Chuẩn hóa tên tiêu chí để so sánh
    """
    mapping = {
        "hiệu năng": "Hiệu năng",
        "giá": "Giá",
        "giá thành": "Giá",
        "màn hình": "Màn hình",
        "pin": "Pin",
        "thời lượng pin": "Pin",
        "thiết kế": "Thiết kế", 
        "độ bền": "Độ bền"
    }
    return mapping.get(criterion.lower(), criterion)

def create_display_matrix(matrix, criteria_order):
    """
    Tạo ma trận hiển thị theo thứ tự tiêu chí cố định
    """
    # Tạo bảng ánh xạ giữa tiêu chí và index
    criteria_map = {}
    for i, criterion in enumerate(criteria_order):
        std_name = map_criteria_name(criterion)
        criteria_map[std_name] = i
    
    # Tạo ma trận hiển thị với thứ tự cố định
    display_matrix = []
    display_criteria = []
    
    # Tạo hàng cho mỗi tiêu chí trong thứ tự hiển thị
    for display_criterion in DISPLAY_CRITERIA_ORDER:
        # Tìm tiêu chí tương ứng trong danh sách gốc
        matching_found = False
        for original_criterion in criteria_order:
            if map_criteria_name(original_criterion) == display_criterion:
                idx = criteria_map[display_criterion]
                row = []
                # Thêm các giá trị theo thứ tự hiển thị
                for col_criterion in DISPLAY_CRITERIA_ORDER:
                    col_idx = -1
                    for j, orig_col in enumerate(criteria_order):
                        if map_criteria_name(orig_col) == col_criterion:
                            col_idx = j
                            break
                    
                    if col_idx >= 0:
                        row.append(matrix[idx][col_idx])
                    else:
                        row.append(1.0)  # Giá trị mặc định
                
                display_matrix.append(row)
                display_criteria.append(display_criterion)
                matching_found = True
                break
        
        # Nếu không tìm thấy tiêu chí trong ma trận gốc, thêm hàng giả
        if not matching_found:
            display_matrix.append([1.0] * len(DISPLAY_CRITERIA_ORDER))
            display_criteria.append(display_criterion)
    
    return display_matrix, display_criteria

def format_matrix_for_display(matrix, criteria_order, column_sums=None):
    """Định dạng ma trận để hiển thị"""
    # Định dạng theo thứ tự gốc
    original_format = {
        "criteria": criteria_order,
        "rows": []
    }
    
    # Định dạng ma trận gốc
    for i, row in enumerate(matrix):
        if i < len(criteria_order):
            row_data = {
                "criterion": criteria_order[i],
                "values": [round(float(val), 3) for val in row]
            }
            original_format["rows"].append(row_data)
    
    # Thêm tổng cột cho định dạng gốc nếu có
    if column_sums is not None:
        original_format["column_sums"] = [round(float(val), 3) for val in column_sums]
    
    # Tạo danh sách comparisons từ ma trận gốc
    comparisons = []
    for i, row_criterion in enumerate(criteria_order):
        for j, col_criterion in enumerate(criteria_order):
            if i < len(matrix) and j < len(matrix[i]):
                comparison = {
                    "row": row_criterion, 
                    "column": col_criterion,
                    "value": matrix[i][j]
                }
                comparisons.append(comparison)
    
    # Tạo ma trận với thứ tự cố định
    fixed_matrix, _ = build_matrix_from_comparisons(
        comparisons, 
        ORDER_LABEL_ROW, 
        ORDER_LABEL_COL
    )
    
    # Định dạng ma trận thứ tự cố định
    excel_format = {
        "criteria": ORDER_LABEL_ROW,
        "rows": []
    }
    
    for i, row in enumerate(fixed_matrix):
        if i < len(ORDER_LABEL_ROW):
            row_data = {
                "criterion": ORDER_LABEL_ROW[i],
                "values": [round(float(val), 3) for val in row]
            }
            excel_format["rows"].append(row_data)
    
    # Thêm tổng cột cho định dạng Excel
    if column_sums is not None:
        # Tính tổng cột cho ma trận thứ tự cố định
        fixed_column_sums = calculate_matrix_column_sums(fixed_matrix)
        excel_format["column_sums"] = [round(float(val), 3) for val in fixed_column_sums]
    
    # Kết hợp cả hai định dạng
    result = {
        "original": original_format,
        "excel_format": excel_format
    }
    
    return result

def process_user_request_stage1(user_data):
    """Stage 1 - Khởi tạo và hiển thị ma trận"""
    if not user_data:
        return {"error": "Không có dữ liệu yêu cầu từ người dùng"}
    
    matrix, criteria_order, error = initialize_step1(user_data)
    
    if error:
        return {"error": error}
    
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
        "matrix": {
            "criteria_order": criteria_order,
            "data": matrix_data
        },
        "validation": {
            "is_valid": is_valid,
            "issues": validation_issues
        }
    }

def process_user_request_stage2(user_data):
    """Stage 2 - Tính tổng cột"""
    if not user_data:
        return {"error": "Không có dữ liệu yêu cầu từ người dùng"}
    
    matrix, criteria_order, error = initialize_step1(user_data)
    
    if error:
        return {"error": error}
    
    col_sums = calculate_matrix_column_sums(matrix)
    
    return {
        "status": "success",
        "matrix": {
            "criteria_order": criteria_order,
            "data": [[round(val, 3) for val in row] for row in matrix]
        },
        "column_sums": [round(val, 3) for val in col_sums]
    }

def process_user_request_stage3(user_data):
    """Stage 3 - Chuẩn hóa ma trận"""
    if not user_data:
        return {"error": "Không có dữ liệu yêu cầu từ người dùng"}
    
    matrix, criteria_order, error = initialize_step1(user_data)
    
    if error:
        return {"error": error}
    
    col_sums = calculate_matrix_column_sums(matrix)
    normalized_matrix = normalize_matrix(matrix)
    
    return {
        "status": "success",
        "matrix": {
            "criteria_order": criteria_order,
            "data": [[round(val, 3) for val in row] for row in matrix]
        },
        "column_sums": [round(val, 3) for val in col_sums],
        "normalized_matrix": [[round(val, 3) for val in row] for row in normalized_matrix]
    }

def process_user_request_stage4(user_data):
    """Stage 4 - Tính trọng số tiêu chí"""
    if not user_data:
        return {"error": "Không có dữ liệu yêu cầu từ người dùng"}
    
    matrix, criteria_order, error = initialize_step1(user_data)
    
    if error:
        return {"error": error}
    
    col_sums = calculate_matrix_column_sums(matrix)
    normalized_matrix = normalize_matrix(matrix)
    weights = calculate_criteria_weights(normalized_matrix)
    
    # Tính CR
    cr = calculate_consistency_ratio(matrix)
    is_consistent = cr < 0.1
    
    # Thêm cảnh báo nếu ma trận không nhất quán
    warning = None
    if not is_consistent:
        warning = f"Ma trận không nhất quán (CR={cr:.3f}), kết quả có thể không chính xác"
    
    # Định dạng kết quả trọng số
    criteria_weights = []
    for i, criterion in enumerate(criteria_order):
        if i < len(weights):
            criteria_weights.append({
                "criterion": criterion,
                "weight": round(weights[i], 3)
            })
    
    return {
        "status": "success",
        "matrix": {
            "criteria_order": criteria_order,
            "data": [[round(val, 3) for val in row] for row in matrix]
        },
        "column_sums": [round(val, 3) for val in col_sums],
        "normalized_matrix": [[round(val, 3) for val in row] for row in normalized_matrix],
        "weights": {
            "values": [round(val, 3) for val in weights],
            "formatted": criteria_weights
        },
        "consistency": {
            "cr": round(cr, 3),
            "is_consistent": is_consistent,
            "warning": warning
        }
    }

def process_user_request_stage5(user_data):
    """Stage 5 - Tính vector nhất quán"""
    if not user_data:
        return {"error": "Không có dữ liệu yêu cầu từ người dùng"}
    
    matrix, criteria_order, error = initialize_step1(user_data)
    
    if error:
        return {"error": error}
    
    # Thực hiện các tính toán từ stage 1-4
    normalized_matrix = normalize_matrix(matrix)
    weights = calculate_criteria_weights(normalized_matrix)
    
    # Tính vector nhất quán
    consistency_vector = calculate_consistency_vector(matrix, weights)
    
    # Định dạng kết quả tập trung vào vector nhất quán
    criteria_consistency = []
    for i, criterion in enumerate(criteria_order):
        if i < len(consistency_vector):
            criteria_consistency.append({
                "criterion": criterion,
                "weight": round(float(weights[i]), 3),
                "consistency_value": round(float(consistency_vector[i]), 3)
            })
    
    return {
        "status": "success",
        "stage": "stage5",
        "consistency_vector": {
            "values": [round(float(val), 3) for val in consistency_vector],
            "by_criterion": criteria_consistency
        },
        "message": "Đã tính toán vector nhất quán λ"
    }

def process_user_request_stage6(user_data):
    """Stage 6 - Tính lambda_max (giá trị riêng lớn nhất)"""
    if not user_data:
        return {"error": "Không có dữ liệu yêu cầu từ người dùng"}
    
    matrix, criteria_order, error = initialize_step1(user_data)
    
    if error:
        return {"error": error}
    
    # Thực hiện các tính toán từ stage 1-5
    normalized_matrix = normalize_matrix(matrix)
    weights = calculate_criteria_weights(normalized_matrix)
    consistency_vector = calculate_consistency_vector(matrix, weights)
    
    # Tính lambda_max
    lambda_max = calculate_lambda_max(consistency_vector)
    
    # Định dạng kết quả tập trung vào lambda_max
    return {
        "status": "success",
        "stage": "stage6",
        "consistency_vector": [round(float(val), 3) for val in consistency_vector],
        "lambda_max": round(float(lambda_max), 3),
        "message": f"Đã tính toán λmax = {round(float(lambda_max), 3)}"
    }

def process_user_request_stage7(user_data):
    """Stage 7 - Tính Consistency Index (CI)"""
    if not user_data:
        return {"error": "Không có dữ liệu yêu cầu từ người dùng"}
    
    matrix, criteria_order, error = initialize_step1(user_data)
    
    if error:
        return {"error": error}
    
    # Thực hiện các tính toán từ stage 1-6
    normalized_matrix = normalize_matrix(matrix)
    weights = calculate_criteria_weights(normalized_matrix)
    consistency_vector = calculate_consistency_vector(matrix, weights)
    lambda_max = calculate_lambda_max(consistency_vector)
    
    # Tính CI
    n = len(matrix)
    CI = calculate_consistency_index(lambda_max, n)
    
    # Định dạng kết quả tập trung vào CI
    return {
        "status": "success",
        "stage": "stage7",
        "lambda_max": round(float(lambda_max), 3),
        "n": n,
        "CI": round(float(CI), 3),
        "formula": "(λmax - n) / (n - 1)",
        "calculation": f"({round(float(lambda_max), 3)} - {n}) / ({n} - 1) = {round(float(CI), 3)}",
        "message": f"Đã tính toán CI = {round(float(CI), 3)}"
    }

def process_user_request_stage8(user_data):
    """Stage 8 - Tính Consistency Ratio (CR) và kiểm tra tính nhất quán"""
    if not user_data:
        return {"error": "Không có dữ liệu yêu cầu từ người dùng"}
    
    matrix, criteria_order, error = initialize_step1(user_data)
    
    if error:
        return {"error": error}
    
    # Tính toán tất cả các chỉ số nhất quán
    normalized_matrix = normalize_matrix(matrix)
    weights = calculate_criteria_weights(normalized_matrix)
    
    # Tính CI và các chỉ số liên quan
    consistency_vector = calculate_consistency_vector(matrix, weights)
    lambda_max = calculate_lambda_max(consistency_vector)
    n = len(matrix)
    CI = calculate_consistency_index(lambda_max, n)
    RI = get_random_index(n)
    CR = CI / RI if RI > 0 else 0
    
    # Đánh giá nhất quán - đảm bảo dùng Python bool
    is_consistent = bool(CR < 0.1)
    
    # Tạo thông báo
    if is_consistent:
        message = f"Ma trận nhất quán (CR = {CR:.3f} < 0.1)."
    else:
        message = f"Ma trận KHÔNG nhất quán (CR = {CR:.3f} > 0.1). Cần xem xét lại các đánh giá."
    
    # Định dạng kết quả tập trung vào CR
    return {
        "status": "success",
        "stage": "stage8",
        "CI": round(float(CI), 3),
        "RI": round(float(RI), 3),
        "CR": round(float(CR), 3),
        "formula": "CR = CI / RI",
        "calculation": f"{round(float(CI), 3)} / {round(float(RI), 3)} = {round(float(CR), 3)}",
        "is_consistent": is_consistent,
        "message": message
    }

def process_user_request_complete(user_data):
    """API hoàn chỉnh cho Step 1"""
    return process_user_request_stage4(user_data)

def calculate_weights(comparisons):
    """
    Tính toán trọng số các tiêu chí dựa trên ma trận so sánh cặp
    
    Parameters:
    - comparisons: Danh sách các so sánh cặp từ người dùng
    
    Returns:
    - Dictionary chứa trạng thái và trọng số các tiêu chí
    """
    try:
        # Xây dựng ma trận từ comparisons
        matrix, criteria_order, error = initialize_step1({"comparisons": comparisons})
        
        if error:
            return {"status": "error", "message": error}
        
        # Chuẩn hóa ma trận
        normalized_matrix = normalize_matrix(matrix)
        
        # Tính trọng số
        weights_array = calculate_criteria_weights(normalized_matrix)
        
        # Tính CR để kiểm tra tính nhất quán
        cr = calculate_consistency_ratio(matrix)
        is_consistent = cr < 0.1
        
        # Chuyển đổi trọng số thành dictionary
        weights = {}
        for i, criterion in enumerate(criteria_order):
            weights[criterion] = round(float(weights_array[i]), 3)
        
        return {
            "status": "success",
            "weights": weights,
            "consistency": {
                "cr": round(float(cr), 3),
                "is_consistent": is_consistent,
                "message": "Ma trận nhất quán" if is_consistent else "Ma trận không nhất quán"
            }
        }
    except Exception as e:
        return {"status": "error", "message": f"Lỗi khi tính trọng số: {str(e)}"}