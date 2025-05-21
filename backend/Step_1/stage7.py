from typing import Dict, Any, List
import traceback

def calculate_consistency_index(lambda_max: float, n: int) -> float:
    """
    Tính Consistency Index (CI)
    
    Parameters:
    - lambda_max: Giá trị riêng lớn nhất
    - n: Kích thước ma trận
    
    Returns:
    - Consistency Index (CI)
    """
    if n <= 1:
        return 0.0
    
    return (lambda_max - n) / (n - 1)

def calculate_consistency_index_stage(stage6_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Stage 7 - Tính Consistency Index (CI)
    
    Parameters:
    - stage6_result: Kết quả từ Stage 6 chứa lambda max
    
    Returns:
    - Dictionary chứa CI
    """
    try:
        # Kiểm tra đầu vào
        if "status" in stage6_result and stage6_result["status"] == "error":
            return stage6_result
        
        lambda_max = stage6_result.get("lambda_max")
        matrix = stage6_result.get("matrix")
        
        if lambda_max is None or matrix is None:
            return {
                "status": "error",
                "message": "Không tìm thấy lambda max hoặc ma trận từ Stage 6"
            }
        
        # Xử lý đặc biệt cho ma trận kích thước nhỏ (1x1 hoặc 2x2)
        n = len(matrix)
        if n <= 2:
            CI = 0
            
            result = {
                **stage6_result,
                "CI": CI,
                "formula": "(λmax - n) / (n - 1) = 0 (với ma trận kích thước ≤ 2)",
                "calculation": f"({n} - {n}) / ({n} - 1) = 0",
                "message": f"Ma trận {n}x{n} luôn nhất quán với CI = 0."
            }
            
            return result
        
        # Tính CI
        CI = calculate_consistency_index(lambda_max, n)
        
        # Định dạng công thức và tính toán
        formula = "(λmax - n) / (n - 1)"
        calculation = f"({round(lambda_max, 3)} - {n}) / ({n} - 1) = {round(CI, 3)}"
        
        # Kết hợp kết quả
        result = {
            **stage6_result,
            "CI": round(CI, 3),
            "formula": formula,
            "calculation": calculation,
            "message": f"Đã tính toán CI = {round(CI, 3)}"
        }
        
        return result
        
    except Exception as e:
        print(f"ERROR stage7 - {str(e)}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Lỗi khi tính Consistency Index: {str(e)}"
        }