from typing import Dict, Any
import traceback

def synthesize_priorities(stage5_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Tổng hợp các ưu tiên từ các tiêu chí khác nhau
    
    Parameters:
    - stage5_result: Kết quả từ Stage 5
    
    Returns:
    - Dictionary chứa điểm tổng hợp cho từng laptop
    """
    try:
        # Debug thông tin đầu vào
        print(f"DEBUG stage6 - Đầu vào: {type(stage5_result)}")
        print(f"DEBUG stage6 - Keys: {stage5_result.keys() if isinstance(stage5_result, dict) else 'not dict'}")
        
        # Khởi tạo kết quả
        result = {
            "status": "success",
            "synthesized_scores": {},
            "laptop_details": stage5_result.get("laptop_details", {})
        }
        
        # Lấy dữ liệu từ Stage 5
        priority_vectors = stage5_result.get("priority_vectors", {})
        weights = stage5_result.get("step1_weights", {}).get("values", {})
        
        if not priority_vectors:
            print("ERROR stage6 - Không tìm thấy vector ưu tiên")
            return {"status": "error", "message": "Không tìm thấy vector ưu tiên"}
        
        print(f"DEBUG stage6 - Đã tìm thấy {len(priority_vectors)} vector ưu tiên")
        print(f"DEBUG stage6 - Criteria: {list(priority_vectors.keys())}")
        
        # Lấy danh sách laptop từ vector ưu tiên đầu tiên
        first_criterion = next(iter(priority_vectors))
        laptop_names = list(priority_vectors[first_criterion].keys())
        
        # Tính điểm tổng hợp cho mỗi laptop
        for laptop_name in laptop_names:
            total_score = 0
            criteria_scores = {}
            
            for criterion, priority_data in priority_vectors.items():
                if laptop_name in priority_data:
                    weighted_score = priority_data[laptop_name].get("weighted_score", 0)
                    total_score += weighted_score
                    criteria_scores[criterion] = weighted_score
            
            result["synthesized_scores"][laptop_name] = {
                "total_score": round(total_score, 4),
                "criteria_scores": criteria_scores
            }
        
        # Sao chép các thuộc tính bổ sung
        if "step1_weights" in stage5_result:
            result["step1_weights"] = stage5_result["step1_weights"]
        
        # Lưu dữ liệu gốc để truyền cho các stage sau
        result["original_data"] = {
            "laptop_details": stage5_result.get("laptop_details", {}),
            "synthesized_scores": result["synthesized_scores"]
        }
        
        # Truyền dữ liệu từ các stage trước
        if "previous_stages" in stage5_result:
            result["previous_stages"] = stage5_result["previous_stages"]
        if "original_data" in stage5_result:
            result["stage5_data"] = stage5_result["original_data"]
        
        return result
        
    except Exception as e:
        print(f"Stage 6 Exception: {str(e)}")
        print(traceback.format_exc())
        return {"status": "error", "message": f"Lỗi khi tổng hợp ưu tiên: {str(e)}"}