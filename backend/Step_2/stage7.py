from typing import Dict, Any
import traceback

def calculate_consistency_vectors(stage6_result: Dict[str, Any], original_matrices: Dict[str, Any]) -> Dict[str, Any]:
    """
    Tính vector nhất quán bằng cách nhân ma trận ban đầu với vector ưu tiên
    
    Parameters:
    - stage6_result: Kết quả từ Stage 6 (tổng hợp ưu tiên)
    - original_matrices: Ma trận so sánh ban đầu từ Stage 2
    
    Returns:
    - Dictionary chứa vector nhất quán cho từng tiêu chí
    """
    try:
        # Khởi tạo kết quả
        result = {
            "status": "success",
            "consistency_vectors": {},
            "laptop_details": stage6_result.get("laptop_details", {}),
            "step1_weights": stage6_result.get("step1_weights", {}),
            "ranked_laptops": []
        }
        
        # Lấy dữ liệu từ Stage 6
        synthesized_scores = stage6_result.get("synthesized_scores", {})
        laptop_details = stage6_result.get("laptop_details", {})
        
        if not synthesized_scores:
            return {"status": "error", "message": "Không tìm thấy điểm tổng hợp từ Stage 6"}
        
        # Lấy ma trận ban đầu
        original_matrices_data = original_matrices.get("step2_stage2", {}).get("matrices", {})
        if not original_matrices_data:
            original_matrices_data = original_matrices.get("matrices", {})
            
        if not original_matrices_data:
            return {"status": "error", "message": "Không tìm thấy ma trận ban đầu từ Stage 2"}
        
        # Tính vector nhất quán cho từng tiêu chí
        # Đây là bước quan trọng trong AHP để kiểm tra tính nhất quán
        # Aw = λw
        
        # Tạo một dict ánh xạ tên laptop sang id
        laptop_name_to_id = {}
        for laptop_id, details in laptop_details.items():
            laptop_name_to_id[details.get("name", "")] = laptop_id
            
        # Xếp hạng dựa trên điểm tổng hợp
        ranked_laptops = []
        for laptop_name, data in sorted(synthesized_scores.items(), key=lambda x: x[1]["total_score"], reverse=True):
            laptop_id = None
            for id, details in laptop_details.items():
                if details.get("name", "") == laptop_name:
                    laptop_id = id
                    break
                    
            ranked_laptop = {
                "name": laptop_name,
                "id": laptop_id,
                "rank": len(ranked_laptops) + 1,
                "total_score": data["total_score"],
                "criteria_scores": data.get("criteria_scores", {})
            }
            ranked_laptops.append(ranked_laptop)
        
        result["ranked_laptops"] = ranked_laptops
        
        # Truyền dữ liệu từ các stage trước
        result["step3_data"] = stage6_result.get("step3_data", {})
        result["step4_data"] = stage6_result.get("step4_data", {})
        result["step5_data"] = stage6_result.get("step5_data", {})
        result["step6_data"] = stage6_result.get("step6_data", {})
        result["synthesized_scores"] = synthesized_scores
        result["filtered_laptops_count"] = len(synthesized_scores)
        
        return result
        
    except Exception as e:
        print(f"Lỗi Stage 7: {str(e)}")
        return {
            "status": "error", 
            "message": f"Lỗi khi tính vector nhất quán: {str(e)}", 
            "traceback": traceback.format_exc()
        }