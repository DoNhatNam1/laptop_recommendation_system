from typing import Dict, Any
import traceback

def calculate_priority_vectors(stage4_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Tính vector ưu tiên từ ma trận chuẩn hóa
    
    Parameters:
    - stage4_result: Kết quả từ Stage 4
    
    Returns:
    - Dictionary chứa vector ưu tiên
    """
    try:
        # Debug thông tin đầu vào
        print(f"DEBUG stage5 - Đầu vào: {type(stage4_result)}")
        print(f"DEBUG stage5 - Keys: {stage4_result.keys() if isinstance(stage4_result, dict) else 'not dict'}")
        
        # Khởi tạo kết quả
        result = {
            "status": "success",
            "priority_vectors": {},
            "laptop_details": stage4_result.get("laptop_details", {})
        }
        
        # Lấy dữ liệu từ Stage 4
        normalized_matrices = stage4_result.get("normalized_matrices", {})
        
        if not normalized_matrices:
            print("ERROR stage5 - Không tìm thấy ma trận chuẩn hóa")
            return {"status": "error", "message": "Không tìm thấy ma trận chuẩn hóa"}
        
        print(f"DEBUG stage5 - Đã tìm thấy {len(normalized_matrices)} ma trận chuẩn hóa")
        print(f"DEBUG stage5 - Criteria: {list(normalized_matrices.keys())}")
        
        # Tính vector ưu tiên cho từng tiêu chí
        for criterion, normalized_scores in normalized_matrices.items():
            priority_vector = {}
            
            # Lưu các giá trị chuẩn hóa làm vector ưu tiên
            for laptop_name, data in normalized_scores.items():
                priority_vector[laptop_name] = {
                    "normalized_priority": data.get("normalized_priority", 0),
                    "weighted_score": data.get("weighted_score", 0)
                }
            
            result["priority_vectors"][criterion] = priority_vector
        
        # Sao chép các thuộc tính bổ sung
        if "step1_weights" in stage4_result:
            result["step1_weights"] = stage4_result["step1_weights"]
            
        # Lưu dữ liệu gốc để truyền cho các stage sau
        result["original_data"] = {
            "laptop_details": stage4_result.get("laptop_details", {}),
            "normalized_matrices": normalized_matrices
        }
        
        # Truyền dữ liệu từ các stage trước
        if "original_data" in stage4_result:
            result["previous_stages"] = stage4_result["original_data"]
        
        return result
        
    except Exception as e:
        print(f"Stage 5 Exception: {str(e)}")
        print(traceback.format_exc())
        return {"status": "error", "message": f"Lỗi khi tính vector ưu tiên: {str(e)}"}