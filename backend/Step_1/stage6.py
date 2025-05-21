from typing import Dict, Any, List
import traceback

def calculate_lambda_max(consistency_vector: List[float]) -> float:
    """
    Tính lambda max (giá trị riêng lớn nhất) từ vector nhất quán
    
    Parameters:
    - consistency_vector: Vector nhất quán
    
    Returns:
    - Giá trị lambda max
    """
    if not consistency_vector:
        return 0.0
    
    return sum(consistency_vector) / len(consistency_vector)

def calculate_lambda_max_stage(stage5_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Stage 6 - Tính lambda max (giá trị riêng lớn nhất)
    
    Parameters:
    - stage5_result: Kết quả từ Stage 5 chứa vector nhất quán
    
    Returns:
    - Dictionary chứa lambda max
    """
    try:
        # Kiểm tra đầu vào
        if "status" in stage5_result and stage5_result["status"] == "error":
            return stage5_result
        
        consistency_vector = stage5_result.get("consistency_vector")
        matrix = stage5_result.get("matrix")
        
        if consistency_vector is None or matrix is None:
            return {
                "status": "error",
                "message": "Không tìm thấy vector nhất quán hoặc ma trận từ Stage 5"
            }
        
        # Xử lý đặc biệt cho ma trận kích thước nhỏ (1x1 hoặc 2x2)
        n = len(matrix)
        if n <= 2:
            lambda_max = n
            
            result = {
                **stage5_result,
                "lambda_max": lambda_max,
                "formula": f"λmax = {n} (với ma trận {n}x{n})",
                "calculation": f"λmax = {n}",
                "message": f"Với ma trận {n}x{n}, λmax luôn bằng {n}."
            }
            
            return result
        
        # Tính lambda_max
        lambda_max = calculate_lambda_max(consistency_vector)
        
        # Định dạng công thức và tính toán
        formula = "λmax = (Σλi) / n = " + \
                  f"{' + '.join([f'{round(val, 3)}' for val in consistency_vector])} / {n}"
        calculation = f"{round(sum(consistency_vector), 3)} / {n} = {round(lambda_max, 3)}"
        
        # Kết hợp kết quả
        result = {
            **stage5_result,
            "lambda_max": round(lambda_max, 3),
            "formula": formula,
            "calculation": calculation,
            "message": f"Đã tính toán λmax = {round(lambda_max, 3)}"
        }
        
        return result
        
    except Exception as e:
        print(f"ERROR stage6 - {str(e)}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Lỗi khi tính lambda max: {str(e)}"
        }