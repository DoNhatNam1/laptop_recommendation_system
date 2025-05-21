from typing import Dict, Any, List
import traceback

def get_random_index(n: int) -> float:
    """
    Lấy Random Index (RI) cho ma trận kích thước n
    
    Parameters:
    - n: Kích thước ma trận
    
    Returns:
    - Random Index (RI)
    """
    # Bảng RI cho các kích thước ma trận khác nhau
    ri_table = {
        1: 0.00, 2: 0.00, 3: 0.58, 4: 0.90, 5: 1.12,
        6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49
    }
    
    return ri_table.get(n, 1.49)  # Default to 1.49 for n > 10

def calculate_consistency_ratio(stage7_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Stage 8 - Tính Consistency Ratio (CR) và đánh giá tính nhất quán
    
    Parameters:
    - stage7_result: Kết quả từ Stage 7 chứa CI
    
    Returns:
    - Dictionary chứa CR và đánh giá nhất quán
    """
    try:
        # Kiểm tra đầu vào
        if "status" in stage7_result and stage7_result["status"] == "error":
            return stage7_result
        
        CI = stage7_result.get("CI")
        matrix = stage7_result.get("matrix")
        
        if CI is None or matrix is None:
            return {
                "status": "error",
                "message": "Không tìm thấy CI hoặc ma trận từ Stage 7"
            }
        
        # Xử lý đặc biệt cho ma trận kích thước nhỏ (1x1 hoặc 2x2)
        n = len(matrix)
        if n <= 2:
            result = {
                **stage7_result,
                "RI": 0,
                "CR": 0,
                "is_consistent": True,
                "formula": "CR = CI / RI = 0 (với ma trận kích thước ≤ 2)",
                "calculation": "0 / 0 = 0 (được định nghĩa là 0)",
                "message": "Ma trận luôn nhất quán khi chỉ có 1-2 tiêu chí."
            }
            
            # Kết quả cuối cùng
            final_result = prepare_final_result(result)
            return final_result
        
        # Lấy Random Index (RI)
        RI = get_random_index(n)
        
        # Tính CR
        CR = CI / RI if RI > 0 else 0
        
        # Đánh giá nhất quán
        is_consistent = CR < 0.1
        
        # Tạo thông báo
        if is_consistent:
            message = f"Ma trận nhất quán (CR = {CR:.3f} < 0.1)."
        else:
            message = f"Ma trận KHÔNG nhất quán (CR = {CR:.3f} > 0.1). Cần xem xét lại các đánh giá."
        
        # Định dạng công thức và tính toán
        formula = "CR = CI / RI"
        calculation = f"{round(CI, 3)} / {round(RI, 3)} = {round(CR, 3)}"
        
        # Kết hợp kết quả
        result = {
            **stage7_result,
            "RI": round(RI, 3),
            "CR": round(CR, 3),
            "is_consistent": is_consistent,
            "formula": formula,
            "calculation": calculation,
            "message": message
        }
        
        # Kết quả cuối cùng
        final_result = prepare_final_result(result)
        return final_result
        
    except Exception as e:
        print(f"ERROR stage8 - {str(e)}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Lỗi khi tính Consistency Ratio: {str(e)}"
        }

def prepare_final_result(result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Chuẩn bị kết quả cuối cùng với định dạng tốt hơn
    """
    # Tạo consistency object
    consistency = {
        "vector": result.get("consistency_vector", []),
        "lambda_max": result.get("lambda_max", 0),
        "CI": result.get("CI", 0),
        "RI": result.get("RI", 0),
        "CR": result.get("CR", 0),
        "is_consistent": result.get("is_consistent", False),
        "message": result.get("message", "")
    }
    
    # Tạo weights object
    weights = {
        "values": result.get("weights", []),
        "formatted": result.get("weights_formatted", [])
    }
    
    # Tạo ma trận object
    matrix_obj = {
        "criteria_order": result.get("criteria_order", []),
        "data": result.get("matrix_data", [])
    }
    
    # Chuẩn bị kết quả cuối cùng
    final_result = {
        "status": "success",
        "step": "step1_complete",
        "matrix": matrix_obj,
        "column_sums": result.get("column_sums", []),
        "normalized_matrix": result.get("normalized_matrix_data", []),
        "weights": weights,
        "consistency": consistency
    }
    
    # Trả về kết quả cuối cùng
    return final_result