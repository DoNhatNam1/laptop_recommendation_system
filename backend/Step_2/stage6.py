from typing import Dict, Any, List
import numpy as np
import traceback

def step2_calculate_lambda_max(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate λ_max and vector nhất quán for each criterion
    
    Args:
        input_data: Dictionary containing original matrices and priority vectors
        
    Returns:
        Dictionary with input_data plus lambda_max and consistency_vectors
    """
    try:
        print("\n=== STAGE 6: CALCULATING LAMBDA MAX AND CONSISTENCY VECTORS ===")
        
        # Extract necessary data
        original_matrices = input_data.get("original_matrices", {})
        priority_vectors = input_data.get("priority_vectors", {})
        laptop_names = input_data.get("laptop_names", [])
        
        # Prepare output structures
        lambda_max_values = {}
        consistency_vectors = {}
        
        # Process each criterion
        for criterion, matrix in original_matrices.items():
            if criterion not in priority_vectors:
                print(f"Warning: No priority vector for criterion {criterion}")
                continue
            
            priority = priority_vectors[criterion]
            matrix_size = len(matrix)
            
            # Convert to numpy arrays
            A = np.array(matrix)
            w = np.array(priority).reshape(-1, 1)  # Column vector
            
            # Calculate weighted sum vector: A·w
            weighted_sum = np.dot(A, w)
            
            # Calculate ratio vector for each component: (A·w)/w
            ratio_vector = []
            for i in range(len(w)):
                if w[i][0] > 0:  # Avoid division by zero
                    ratio_vector.append(weighted_sum[i][0] / w[i][0])
                else:
                    ratio_vector.append(matrix_size)  # Fallback if weight is zero
            
            # Calculate λ_max as average of ratio vector
            lambda_max = sum(ratio_vector) / len(ratio_vector) if ratio_vector else matrix_size
            
            # Store results
            lambda_max_values[criterion] = float(lambda_max)
            consistency_vectors[criterion] = ratio_vector
            
            # Log vector nhất quán và lambda max
            print(f"\nVector nhất quán cho {criterion}:")
            for i, value in enumerate(ratio_vector):
                laptop_name = laptop_names[i] if i < len(laptop_names) else f"Laptop {i+1}"
                print(f"  {laptop_name}: {value:.4f}")
            
            print(f"  λ max: {lambda_max:.4f}")
        
        # Prepare output - add new calculated values
        output_data = input_data.copy()
        output_data["lambda_max"] = lambda_max_values
        output_data["consistency_vectors"] = consistency_vectors
        
        print("\nStage 6 hoàn thành: Đã tính vector nhất quán và lambda max")
        
        return output_data
        
    except Exception as e:
        print(f"Stage 6 Exception: {str(e)}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Error calculating Lambda Max: {str(e)}"
        }

def synthesize_priorities(stage5_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Chuẩn bị dữ liệu từ stage 5 để tính điểm tổng hợp ở các stage tiếp theo
    
    Parameters:
    - stage5_result: Kết quả từ Stage 5
    
    Returns:
    - Dictionary chứa thông tin cần thiết cho stage tiếp theo
    """
    try:
        print("\n=== STAGE 6: PREPARE DATA FOR SYNTHESIS ===")
        
        # Gọi hàm tính Lambda Max và vector nhất quán
        result = step2_calculate_lambda_max(stage5_result)
        
        # Chỉ log thông tin, không tính xếp hạng hay CI/CR
        print(f"\n[STAGE 6] Đã chuẩn bị dữ liệu với {len(result.get('priority_vectors', {}))} vector ưu tiên")
        print(f"[STAGE 6] Đã tính vector nhất quán cho {len(result.get('consistency_vectors', {}))} tiêu chí")
        
        # Đảm bảo chuyển các trọng số PA từ stage 5 sang
        if "criteria_priority_tables" in stage5_result:
            result["criteria_priority_tables"] = stage5_result["criteria_priority_tables"]
            print(f"[STAGE 6] Đã chuyển bảng trọng số PA cho {len(result['criteria_priority_tables'])} tiêu chí")
        
        return result
        
    except Exception as e:
        print(f"Stage 6 Exception: {str(e)}")
        traceback.print_exc()
        return {"status": "error", "message": f"Lỗi khi chuẩn bị dữ liệu: {str(e)}"}