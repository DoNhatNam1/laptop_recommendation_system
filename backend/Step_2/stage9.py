from typing import Dict, Any
import traceback

def rank_laptops(stage8_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Xếp hạng laptop dựa trên điểm tổng hợp từ các giai đoạn trước
    
    Parameters:
    - stage8_result: Kết quả từ Stage 8 (kiểm tra nhất quán)
    
    Returns:
    - Dictionary chứa danh sách laptop đã xếp hạng
    """
    try:
        # Debug thông tin đầu vào
        print(f"DEBUG stage9 - Đầu vào: {type(stage8_result)}")
        
        # Kiểm tra đầu vào
        if "status" in stage8_result and stage8_result["status"] == "error":
            print(f"ERROR stage9 - Nhận kết quả lỗi từ stage8: {stage8_result.get('message', 'Unknown error')}")
            return stage8_result
            
        # Khởi tạo kết quả
        result = {
            "status": "success",
            "ranked_laptops": [],
            "weights": stage8_result.get("step1_weights", {}).get("values", {})
        }
        
        # Lấy dữ liệu từ Stage 8
        synthesized_scores = stage8_result.get("synthesized_scores", {})
        laptop_details = stage8_result.get("laptop_details", {})
        
        if not synthesized_scores:
            print("ERROR stage9 - Không tìm thấy điểm tổng hợp")
            return {"status": "error", "message": "Không tìm thấy điểm tổng hợp"}
        
        print(f"DEBUG stage9 - Đã tìm thấy {len(synthesized_scores)} laptop")
        
        # Xếp hạng laptop
        ranked_laptops = []
        
        # Sắp xếp theo điểm tổng hợp giảm dần
        for laptop_name, data in sorted(synthesized_scores.items(), key=lambda x: x[1]["total_score"], reverse=True):
            # Tìm laptop_id từ tên
            laptop_id = None
            laptop_details_full = None
            
            for id, details in laptop_details.items():
                if details.get("name") == laptop_name:
                    laptop_id = id
                    laptop_details_full = details
                    break
            
            # Chuẩn bị thông tin laptop đã xếp hạng
            ranked_laptop = {
                "id": laptop_id,
                "name": laptop_name,
                "rank": len(ranked_laptops) + 1,
                "total_score": round(data["total_score"], 4)
            }
            
            # Kết hợp thông tin chi tiết về laptop vào kết quả
            if laptop_details_full:
                for key, value in laptop_details_full.items():
                    if key not in ranked_laptop:
                        ranked_laptop[key] = value
            
            ranked_laptops.append(ranked_laptop)
        
        # Cập nhật kết quả
        result["ranked_laptops"] = ranked_laptops
        result["filtered_laptops_count"] = len(ranked_laptops)
        result["title"] = "Kết quả xếp hạng laptop (Final Ranking)"
        
        return result
        
    except Exception as e:
        print(f"Stage 9 Exception: {str(e)}")
        print(traceback.format_exc())
        return {"status": "error", "message": f"Lỗi khi xếp hạng laptop: {str(e)}"}