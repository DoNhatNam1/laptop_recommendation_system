from typing import Dict, Any, List
import traceback
import numpy as np

def check_consistency(stage7_result: Dict[str, Any], matrices_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Kiểm tra tính nhất quán của các ma trận so sánh bằng CR (Consistency Ratio)
    
    Parameters:
    - stage7_result: Kết quả từ Stage 7
    - matrices_result: Ma trận so sánh từ Stage 2
    
    Returns:
    - Dictionary chứa kết quả kiểm tra nhất quán
    """
    try:
        # Debug thông tin đầu vào
        print(f"DEBUG stage8 - Đầu vào: {type(stage7_result)}")
        
        # Kiểm tra đầu vào
        if not matrices_result or "matrices" not in matrices_result:
            print("ERROR stage8 - Không tìm thấy ma trận so sánh")
            return {"status": "error", "message": "Không tìm thấy ma trận so sánh"}
            
        if not stage7_result:
            print("ERROR stage8 - Không tìm thấy kết quả từ Stage 7")
            return {"status": "error", "message": "Không tìm thấy kết quả từ Stage 7"}
        
        # Lấy thông tin về ma trận và priority vectors
        matrices = matrices_result.get("matrices", {})
        criteria = matrices_result.get("criteria", [])
        laptop_ids = matrices_result.get("laptop_ids", [])
        priority_vectors = stage7_result.get("priority_vectors", {})
        
        if not matrices or not criteria or not laptop_ids:
            print("ERROR stage8 - Dữ liệu ma trận không đầy đủ")
            return {"status": "error", "message": "Dữ liệu ma trận không đầy đủ"}
        
        # Khởi tạo kết quả
        result = {
            "status": "success",
            "consistency_checks": {},
            "ranked_laptops": stage7_result.get("ranked_laptops", []),
            "laptop_details": stage7_result.get("laptop_details", {}),
            "synthesized_scores": stage7_result.get("synthesized_scores", {}),
            "step1_weights": stage7_result.get("step1_weights", {}),
            "filtered_laptops_count": stage7_result.get("filtered_laptops_count", 0)
        }
        
        # Kiểm tra tính nhất quán cho từng tiêu chí
        for criterion in criteria:
            try:
                print(f"DEBUG stage8 - Kiểm tra tính nhất quán cho {criterion}")
                matrix = matrices.get(criterion, [])
                
                if not matrix:
                    print(f"ERROR stage8 - Không tìm thấy ma trận cho tiêu chí {criterion}")
                    continue
                
                # Lấy priority vector từ kết quả
                priorities = []
                for laptop_id in laptop_ids:
                    laptop_name = matrices_result.get("laptop_details", {}).get(laptop_id, {}).get("name", f"Laptop {laptop_id}")
                    laptop_priority = 0
                    
                    # Tìm priority trong Stage 7
                    for name, scores in stage7_result.get("synthesized_scores", {}).items():
                        if name == laptop_name:
                            laptop_priority = scores.get("criteria_scores", {}).get(criterion, 0)
                            break
                    
                    priorities.append(laptop_priority)
                
                if not priorities or all(p == 0 for p in priorities):
                    print(f"WARNING stage8 - Không tìm thấy priority vector hợp lệ cho {criterion}")
                    continue
                
                # Chuyển đổi sang mảng numpy
                priorities = np.array(priorities)
                matrix_np = np.array(matrix)
                
                # Tính vector nhất quán: A * w
                consistency_vector = np.matmul(matrix_np, priorities)
                
                # Tính λmax (lambda max)
                lambda_values = []
                for i, priority in enumerate(priorities):
                    if priority > 0:
                        lambda_values.append(consistency_vector[i] / priority)
                
                lambda_max = np.mean(lambda_values) if lambda_values else 0
                
                # Tính Consistency Index (CI)
                n = len(priorities)
                ci = (lambda_max - n) / (n - 1) if n > 1 else 0
                
                # Tính Consistency Ratio (CR)
                ri_values = {1: 0, 2: 0, 3: 0.58, 4: 0.9, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49}
                ri = ri_values.get(n, 1.5)  # Giá trị mặc định nếu n > 10
                cr = ci / ri if ri > 0 else 0
                
                # Kiểm tra tính nhất quán cho từng tiêu chí
                is_consistent = cr <= 0.1  # CR ≤ 10% được coi là nhất quán
                
                # Lưu kết quả
                result["consistency_checks"][criterion] = {
                    "lambda_max": lambda_max,
                    "ci": ci,
                    "cr": cr,
                    "is_consistent": is_consistent
                }
                
                # Trả về lỗi nếu CR > 0.1 để xác nhận tính không nhất quán
                if not is_consistent:
                    print(f"ERROR stage8 - Ma trận cho tiêu chí {criterion} không nhất quán (CR = {cr:.4f})")
                    return {
                        "status": "error", 
                        "message": f"Ma trận so sánh cho tiêu chí '{criterion}' không nhất quán (CR = {cr:.4f} > 0.1). Vui lòng kiểm tra lại dữ liệu.",
                        "criterion": criterion,
                        "cr": cr
                    }
                
            except Exception as e:
                print(f"ERROR stage8 - Lỗi khi kiểm tra tính nhất quán cho {criterion}: {str(e)}")
                print(traceback.format_exc())
                continue
        
        # Kiểm tra xem có tiêu chí nào được kiểm tra không
        if not result["consistency_checks"]:
            print("ERROR stage8 - Không thể kiểm tra tính nhất quán cho bất kỳ tiêu chí nào")
            return {"status": "error", "message": "Không thể kiểm tra tính nhất quán cho bất kỳ tiêu chí nào"}
        
        # Copy các trường dữ liệu khác từ stage7_result
        for key in ["step3_data", "step4_data", "step5_data", "step6_data"]:
            if key in stage7_result:
                result[key] = stage7_result[key]
        
        return result
        
    except Exception as e:
        print(f"Stage 8 Exception: {str(e)}")
        print(traceback.format_exc())
        return {"status": "error", "message": f"Lỗi khi kiểm tra tính nhất quán: {str(e)}"}