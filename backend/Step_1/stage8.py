from .stage1 import get_comparison_matrix
from .utils import (
    normalize_matrix, 
    calculate_criteria_weights, 
    calculate_consistency_vector, 
    calculate_lambda_max,
    calculate_consistency_index,
    get_random_index,
    calculate_all_consistency_metrics
)

def process_user_request_stage8(user_data):
    """Stage 8 - Tính Consistency Ratio (CR) và kiểm tra tính nhất quán"""
    if not user_data:
        return {"error": "Không có dữ liệu yêu cầu từ người dùng"}
    
    matrix, criteria_order = get_comparison_matrix(user_data)
    
    if matrix is None:
        return {"error": "Không thể xây dựng ma trận từ dữ liệu so sánh"}
    
    # Ma trận nhỏ (1x1 hoặc 2x2) luôn nhất quán
    n = len(matrix)
    if n <= 2:
        # Tạo dữ liệu trả về cho ma trận nhỏ
        weights = [1/n] * n
        
        criteria_weights = []
        for i, criterion in enumerate(criteria_order):
            criteria_weights.append({
                "criterion": criterion,
                "weight": 1/n,
                "percentage": round(100/n, 1)
            })
        
        return {
            "status": "success",
            "stage": "stage8",
            "matrix": {
                "criteria_order": criteria_order,
                "criteria_count": n,
                "data": [[round(val, 3) for val in row] for row in matrix]
            },
            "weights": {
                "values": weights,
                "formatted": criteria_weights
            },
            "consistency": {
                "lambda_max": n,
                "CI": 0,
                "RI": 0,
                "CR": 0,
                "is_consistent": True,
                "message": "Ma trận luôn nhất quán khi chỉ có 1-2 tiêu chí."
            }
        }
    
    # Tính toán tất cả các chỉ số nhất quán
    normalized_matrix = normalize_matrix(matrix)
    weights = calculate_criteria_weights(normalized_matrix)
    
    # Tính CI và các chỉ số liên quan
    consistency_vector = calculate_consistency_vector(matrix, weights)
    lambda_max = calculate_lambda_max(consistency_vector)
    CI = calculate_consistency_index(lambda_max, n)
    RI = get_random_index(n)
    CR = CI / RI if RI > 0 else 0
    
    # Đánh giá nhất quán
    is_consistent = CR < 0.1
    
    # Tạo thông báo
    if is_consistent:
        message = f"Ma trận nhất quán (CR = {CR:.3f} < 0.1)."
    else:
        message = f"Ma trận KHÔNG nhất quán (CR = {CR:.3f} > 0.1). Cần xem xét lại các đánh giá."
    
    # Format trọng số
    criteria_weights = []
    for i, criterion in enumerate(criteria_order):
        if i < len(weights):
            criteria_weights.append({
                "criterion": criterion,
                "weight": round(weights[i], 3),
                "percentage": round(weights[i] * 100, 1)
            })
    
    # Định dạng kết quả tập trung vào CR
    return {
        "status": "success",
        "stage": "stage8",
        "matrix": {
            "criteria_order": criteria_order,
            "criteria_count": n,
            "data": [[round(val, 3) for val in row] for row in matrix]
        },
        "normalized_matrix": [[round(val, 3) for val in row] for row in normalized_matrix],
        "weights": {
            "values": [round(val, 3) for val in weights],
            "formatted": criteria_weights
        },
        "consistency": {
            "lambda_max": round(float(lambda_max), 3),
            "CI": round(float(CI), 3),
            "RI": round(float(RI), 3),
            "CR": round(float(CR), 3),
            "is_consistent": is_consistent,
            "message": message
        }
    }