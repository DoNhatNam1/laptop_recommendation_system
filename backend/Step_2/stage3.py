from typing import Dict, List, Any

def calculate_criteria_totals(matrices_result: Dict[str, Any], weights: Dict[str, float]) -> Dict[str, Any]:
    """
    Tính tổng điểm từng tiêu chí dựa trên ma trận so sánh
    
    Parameters:
    - matrices_result: Kết quả từ Stage 2 chứa ma trận so sánh
    - weights: Trọng số của các tiêu chí từ Step 1
    
    Returns:
    - Dictionary chứa tổng điểm theo từng tiêu chí
    """
    try:
        # Debug thông tin đầu vào
        print(f"DEBUG stage3 - Đầu vào: {type(matrices_result)}")
        print(f"DEBUG stage3 - Keys: {matrices_result.keys() if isinstance(matrices_result, dict) else 'not dict'}")
        
        # Khởi tạo kết quả
        result = {
            "status": "success",
            "criteria_totals": {},
            "laptop_details": {}
        }
        
        # Lấy dữ liệu từ Stage 2
        matrices = matrices_result.get("matrices", {})
        laptop_details = matrices_result.get("laptop_details", {})
        laptop_ids = matrices_result.get("laptop_ids", [])
        
        if not matrices or not laptop_details:
            print("ERROR stage3 - Không tìm thấy ma trận hoặc thông tin laptop")
            return {"status": "error", "message": "Không tìm thấy ma trận hoặc thông tin laptop"}
        
        print(f"DEBUG stage3 - Đã tìm thấy {len(matrices)} ma trận và {len(laptop_details)} laptop")
        print(f"DEBUG stage3 - Criteria: {list(matrices.keys())}")
        
        # Sao chép laptop_details vào kết quả
        result["laptop_details"] = laptop_details
        
        # Tính tổng điểm cho từng tiêu chí
        for criterion, matrix in matrices.items():
            if criterion in weights:
                weight = weights[criterion]
                
                # Lấy danh sách tên laptop
                laptop_names = [laptop_details.get(id, {}).get("name", f"Laptop {id}") for id in laptop_ids]
                
                # Tính tổng cột cho mỗi laptop
                column_sums = {}
                laptop_scores = {}
                
                for col_idx, laptop_id in enumerate(laptop_ids):
                    name = laptop_details.get(laptop_id, {}).get("name", f"Laptop {laptop_id}")
                    
                    # Tính tổng cột
                    col_sum = 0
                    for row_idx in range(len(matrix)):
                        col_sum += matrix[row_idx][col_idx]
                    
                    column_sums[name] = round(col_sum, 2)
                    
                    # Tính priority
                    priority = 1/col_sum if col_sum > 0 else 0
                    weighted_score = priority * weight
                    
                    laptop_scores[name] = {
                        "column_sum": round(col_sum, 2),
                        "priority": priority,
                        "weight": weight,
                        "weighted_score": round(weighted_score, 4)
                    }
                
                # Lưu thông tin tiêu chí
                result["criteria_totals"][criterion] = {
                    "weight": weight,
                    "column_sums": column_sums,
                    "laptop_scores": laptop_scores
                }
        
        return result
        
    except Exception as e:
        import traceback
        print(f"Stage 3 Exception: {str(e)}")
        print(traceback.format_exc())
        return {"status": "error", "message": f"Lỗi khi tính tổng điểm tiêu chí: {str(e)}"}