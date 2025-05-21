from typing import Dict, Any, List
import traceback

def calculate_matrix_column_sums(matrix: List[List[float]]) -> List[float]:
    """
    Tính tổng các cột của ma trận
    
    Parameters:
    - matrix: Ma trận đầu vào
    
    Returns:
    - Danh sách tổng cột
    """
    if not matrix or len(matrix) == 0:
        return []
    
    n = len(matrix)
    col_sums = [0.0] * n
    
    for j in range(n):
        for i in range(n):
            col_sums[j] += matrix[i][j]
            
    return col_sums

def calculate_column_sums(stage1_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Stage 2 - Tính tổng cột của ma trận so sánh
    
    Parameters:
    - stage1_result: Kết quả từ Stage 1 chứa ma trận so sánh
    
    Returns:
    - Dictionary chứa ma trận và tổng cột
    """
    try:
        # Kiểm tra đầu vào
        if "status" in stage1_result and stage1_result["status"] == "error":
            return stage1_result
        
        matrix = stage1_result.get("matrix")
        criteria_order = stage1_result.get("criteria_order")
        
        if matrix is None or criteria_order is None:
            return {
                "status": "error",
                "message": "Không tìm thấy ma trận hoặc danh sách tiêu chí từ Stage 1"
            }
        
        # Tính tổng cột
        col_sums = calculate_matrix_column_sums(matrix)
        
        # Kết hợp kết quả
        result = {
            "status": "success",
            "stage": "stage2",
            "matrix": matrix,
            "matrix_data": stage1_result.get("matrix_data", []),
            "criteria_order": criteria_order,
            "criteria_count": len(criteria_order),
            "column_sums": [round(sum_val, 3) for sum_val in col_sums],
            "validation": stage1_result.get("validation", {})
        }
        
        return result
        
    except Exception as e:
        print(f"ERROR stage2 - {str(e)}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Lỗi khi tính tổng cột: {str(e)}"
        }