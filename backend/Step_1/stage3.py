from typing import Dict, Any, List
import traceback

def normalize_matrix(matrix: List[List[float]], column_sums: List[float] = None) -> List[List[float]]:
    """
    Chuẩn hóa ma trận so sánh theo tổng cột
    
    Parameters:
    - matrix: Ma trận so sánh
    - column_sums: Tổng cột (tùy chọn)
    
    Returns:
    - Ma trận đã chuẩn hóa
    """
    if not matrix or len(matrix) == 0:
        return []
    
    n = len(matrix)
    normalized = [[0.0 for _ in range(n)] for _ in range(n)]
    
    # Nếu không có tổng cột, tính toán
    if column_sums is None:
        column_sums = [0.0] * n
        for j in range(n):
            for i in range(n):
                column_sums[j] += matrix[i][j]
    
    # Chuẩn hóa ma trận
    for i in range(n):
        for j in range(n):
            if column_sums[j] != 0:
                normalized[i][j] = matrix[i][j] / column_sums[j]
            else:
                normalized[i][j] = 0.0
    
    return normalized

def normalize_comparison_matrix(stage2_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Stage 3 - Chuẩn hóa ma trận so sánh
    
    Parameters:
    - stage2_result: Kết quả từ Stage 2 chứa ma trận và tổng cột
    
    Returns:
    - Dictionary chứa ma trận đã chuẩn hóa
    """
    try:
        # Kiểm tra đầu vào
        if "status" in stage2_result and stage2_result["status"] == "error":
            return stage2_result
        
        matrix = stage2_result.get("matrix")
        criteria_order = stage2_result.get("criteria_order")
        column_sums = stage2_result.get("column_sums")
        
        if matrix is None or criteria_order is None:
            return {
                "status": "error",
                "message": "Không tìm thấy ma trận hoặc danh sách tiêu chí từ Stage 2"
            }
        
        # Chuẩn hóa ma trận
        normalized_matrix = normalize_matrix(matrix, column_sums)
        
        # Chuẩn bị định dạng ma trận chuẩn hóa
        normalized_matrix_data = [[round(val, 3) for val in row] for row in normalized_matrix]
        
        # Kết hợp kết quả
        result = {
            "status": "success",
            "stage": "stage3",
            "matrix": matrix,
            "matrix_data": stage2_result.get("matrix_data", []),
            "criteria_order": criteria_order,
            "criteria_count": len(criteria_order),
            "column_sums": stage2_result.get("column_sums", []),
            "normalized_matrix": normalized_matrix,
            "normalized_matrix_data": normalized_matrix_data,
            "validation": stage2_result.get("validation", {})
        }
        
        return result
        
    except Exception as e:
        print(f"ERROR stage3 - {str(e)}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Lỗi khi chuẩn hóa ma trận: {str(e)}"
        }