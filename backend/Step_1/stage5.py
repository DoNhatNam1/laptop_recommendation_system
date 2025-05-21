from typing import Dict, Any, List
import traceback
import numpy as np

def calculate_consistency_vector(matrix: List[List[float]], weights: List[float]) -> List[float]:
    """
    Tính vector nhất quán từ ma trận so sánh và trọng số
    
    Parameters:
    - matrix: Ma trận so sánh
    - weights: Trọng số các tiêu chí
    
    Returns:
    - Vector nhất quán
    """
    if not matrix or not weights or len(matrix) != len(weights):
        return []
    
    n = len(matrix)
    weighted_sum = [0.0] * n
    
    # Tính tổng có trọng số
    for i in range(n):
        for j in range(n):
            weighted_sum[i] += matrix[i][j] * weights[j]
    
    # Tính vector nhất quán
    consistency_vector = [0.0] * n
    for i in range(n):
        if weights[i] != 0:
            consistency_vector[i] = weighted_sum[i] / weights[i]
        else:
            consistency_vector[i] = 0.0
    
    return consistency_vector

def calculate_consistency_vector_stage(stage4_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Stage 5 - Tính vector nhất quán
    
    Parameters:
    - stage4_result: Kết quả từ Stage 4 chứa trọng số các tiêu chí
    
    Returns:
    - Dictionary chứa vector nhất quán
    """
    try:
        # Kiểm tra đầu vào
        if "status" in stage4_result and stage4_result["status"] == "error":
            return stage4_result
        
        matrix = stage4_result.get("matrix")
        weights = stage4_result.get("weights")
        criteria_order = stage4_result.get("criteria_order")
        
        if matrix is None or weights is None or criteria_order is None:
            return {
                "status": "error",
                "message": "Không tìm thấy ma trận, trọng số hoặc danh sách tiêu chí từ Stage 4"
            }
        
        # Xử lý đặc biệt cho ma trận kích thước nhỏ (1x1 hoặc 2x2)
        n = len(matrix)
        if n <= 2:
            consistency_vector = [n] * n
            
            # Tạo bảng kết quả cho mỗi tiêu chí
            criteria_consistency = []
            for i, criterion in enumerate(criteria_order):
                criteria_consistency.append({
                    "criterion": criterion,
                    "weight": round(weights[i], 3),
                    "consistency_value": n
                })
                
            result = {
                "status": "success",
                "stage": "stage5",
                "matrix": matrix,
                "matrix_data": stage4_result.get("matrix_data", []),
                "criteria_order": criteria_order,
                "criteria_count": n,
                "column_sums": stage4_result.get("column_sums", []),
                "normalized_matrix": stage4_result.get("normalized_matrix"),
                "normalized_matrix_data": stage4_result.get("normalized_matrix_data", []),
                "weights": weights,
                "weights_formatted": stage4_result.get("weights_formatted", []),
                "consistency_vector": consistency_vector,
                "consistency_vector_by_criterion": criteria_consistency,
                "validation": stage4_result.get("validation", {})
            }
            
            return result
        
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
        
        # Kết hợp kết quả
        result = {
            "status": "success",
            "stage": "stage5",
            "matrix": matrix,
            "matrix_data": stage4_result.get("matrix_data", []),
            "criteria_order": criteria_order,
            "criteria_count": n,
            "column_sums": stage4_result.get("column_sums", []),
            "normalized_matrix": stage4_result.get("normalized_matrix"),
            "normalized_matrix_data": stage4_result.get("normalized_matrix_data", []),
            "weights": weights,
            "weights_formatted": stage4_result.get("weights_formatted", []),
            "consistency_vector": consistency_vector,
            "consistency_vector_by_criterion": criteria_consistency,
            "validation": stage4_result.get("validation", {})
        }
        
        return result
        
    except Exception as e:
        print(f"ERROR stage5 - {str(e)}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Lỗi khi tính vector nhất quán: {str(e)}"
        }