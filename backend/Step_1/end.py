import numpy as np
from .utils import (
    calculate_matrix_column_sums,
    normalize_matrix,
    calculate_criteria_weights,
    calculate_all_consistency_metrics
)

def finalize_step1(matrix, criteria_order):
    """
    Hoàn thành các tính toán của Step 1 và trả về kết quả đầy đủ
    """
    try:
        # Thực hiện tất cả các tính toán cần thiết
        col_sums = calculate_matrix_column_sums(matrix)
        normalized_matrix = normalize_matrix(matrix)
        weights = calculate_criteria_weights(normalized_matrix)
        
        # Tính toán các chỉ số nhất quán
        consistency_metrics = calculate_all_consistency_metrics(matrix, weights)
        
        # Định dạng kết quả trọng số
        criteria_weights = []
        for i, criterion in enumerate(criteria_order):
            if i < len(weights):
                criteria_weights.append({
                    "criterion": criterion,
                    "weight": round(weights[i], 3)
                })
        
        # Sắp xếp kết quả theo trọng số giảm dần
        criteria_weights.sort(key=lambda x: x["weight"], reverse=True)
        
        # Chuẩn bị kết quả cuối cùng
        result = {
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
                "vector": consistency_metrics["consistency_vector"],
                "lambda_max": consistency_metrics["lambda_max"],
                "CI": consistency_metrics["CI"],
                "RI": consistency_metrics["RI"],
                "CR": consistency_metrics["CR"],
                "is_consistent": consistency_metrics["is_consistent"],
                "message": consistency_metrics["message"]
            }
        }
        
        return result
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Lỗi trong quá trình finalize_step1: {str(e)}"
        }

def format_final_result(result):
    """
    Định dạng kết quả cuối cùng để hiển thị
    """
    if "weights" not in result or "formatted" not in result["weights"]:
        return result
    
    # Thêm % vào kết quả trọng số
    for item in result["weights"]["formatted"]:
        item["weight_percent"] = f"{item['weight'] * 100:.1f}%"
        
    return result

def complete_step1_process(user_data):
    """
    Xử lý hoàn chỉnh Step 1 - Thực hiện tất cả các stage và trả về kết quả cuối cùng
    """
    from .start import initialize_step1
    from .process import process_user_request_complete
    
    # Thay vì gọi initialize_step1 với stage="stage4", 
    # gọi trực tiếp process_user_request_complete
    result = process_user_request_complete(user_data)
    
    # Kiểm tra nếu kết quả là lỗi
    if result.get("status") != "success":
        return result
        
    # Lấy dữ liệu cần thiết từ kết quả cuối cùng
    if "category" in result:
        category_key = result["category"]["key"]
        customer_group_key = result["customer_group"]["key"]
    else:
        # Dùng giá trị mặc định nếu không có
        category_key = user_data.get("usage", "office") 
        customer_group_key = "average"
        
    weights_data = result.get("weights", {})
    
    # Tạo kết quả hoàn chỉnh, tập trung vào trọng số cuối cùng
    from .usage_classifier import get_laptop_category_info
    
    final_result = {
        "status": "success",
        "step": "step1_complete",
        "category": {
            "key": category_key,
            "name": get_laptop_category_info(category_key).get("name", "")
        },
        "customer_group": {
            "key": customer_group_key
        },
        "criteria_weights": weights_data.get("formatted", []),
        "message": "Đã hoàn thành Step 1: Xác định trọng số các tiêu chí"
    }
    
    return final_result