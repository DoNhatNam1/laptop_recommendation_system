from typing import Dict, Any
import traceback

def check_consistency_ratio(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate CR (Consistency Ratio) for each criterion matrix
    
    Args:
        input_data: Dictionary with lambda_max values from stage6
        
    Returns:
        Dictionary with input_data plus CR results and consistency status
    """
    try:
        print("\n=== STAGE 7: CHECKING CONSISTENCY RATIO ===")
        
        # Extract lambda_max values from previous stage
        lambda_max = input_data.get("lambda_max", {})
        original_matrices = input_data.get("original_matrices", {})
        
        # Log dữ liệu đầu vào để kiểm tra
        print(f"[STAGE 7] INPUT KEYS: {list(input_data.keys())}")
        print(f"[STAGE 7] lambda_max available: {bool(lambda_max)}")
        
        # Standard RI values (Random Index)
        ri_values = {
            1: 0.0, 2: 0.0, 3: 0.58, 4: 0.9, 5: 1.12,
            6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49,
            11: 1.51, 12: 1.48, 13: 1.56, 14: 1.57, 15: 1.59
        }
        
        # Result containers
        ci_values = {}
        cr_results = {}
        consistency_status = {}
        inconsistent_criteria = []
        
        # Calculate CR for each criterion
        for criterion, lambda_max_value in lambda_max.items():
            # Get matrix size from original matrix
            if criterion in original_matrices:
                matrix_size = len(original_matrices[criterion])
            else:
                # Fallback if can't determine size
                print(f"Warning: Original matrix for criterion {criterion} not found")
                matrix_size = len(input_data.get("laptop_names", [])) or 3  # Better fallback
            
            # Calculate CI (Consistency Index)
            ci = (lambda_max_value - matrix_size) / (matrix_size - 1) if matrix_size > 1 else 0
            
            # Get RI value for this size
            ri = ri_values.get(matrix_size, 1.59)  # Default to 1.59 if size > 15
            
            # Calculate CR (Consistency Ratio)
            cr = ci / ri if ri > 0 else 0
            
            # Check consistency (CR should be < 0.1 for n > 2)
            is_consistent = True
            if matrix_size > 2 and cr >= 0.1:
                is_consistent = False
                inconsistent_criteria.append(criterion)
            
            # Store results
            ci_values[criterion] = float(ci)
            cr_results[criterion] = float(cr)
            consistency_status[criterion] = is_consistent
            
            # Log results
            print(f"Criterion: {criterion}")
            print(f"  Matrix size = {matrix_size}")
            print(f"  λ_max = {lambda_max_value:.4f}")
            print(f"  CI = {ci:.4f}")
            print(f"  RI = {ri:.4f}")
            print(f"  CR = {cr:.4f}")
            print(f"  {'Consistent' if is_consistent else 'Not consistent'}")
        
        # Prepare consistency message
        consistency_message = ""
        overall_consistent = len(inconsistent_criteria) == 0
        
        if not overall_consistent:
            criteria_list = ", ".join(inconsistent_criteria)
            consistency_message = f"Cảnh báo: Các ma trận tiêu chí sau không nhất quán (CR ≥ 0.1): {criteria_list}"
            print(f"WARNING: {consistency_message}")
        else:
            consistency_message = "Tất cả các ma trận đều nhất quán (CR < 0.1)"
            print(f"INFO: {consistency_message}")
        
        # Prepare output - add new calculated values
        output_data = input_data.copy()
        output_data["ci_values"] = ci_values
        output_data["cr_results"] = cr_results
        output_data["consistency_status"] = consistency_status
        output_data["overall_consistent"] = overall_consistent
        output_data["inconsistent_criteria"] = inconsistent_criteria
        output_data["consistency_message"] = consistency_message
        
        # Also add ri_values for each criterion to include in final result
        output_data["ri_values"] = {criterion: ri_values.get(len(original_matrices.get(criterion, [])), 1.59) 
                                   for criterion in lambda_max.keys()}
        
        # Đảm bảo giữ lại dữ liệu quan trọng từ các stage trước
        important_keys = [
            "alternative_priority_tables", "criteria_priority_tables", 
            "alternative_priorities", "priority_vectors", 
            "consistency_vectors"
        ]
        
        for key in important_keys:
            if key in input_data and key not in output_data:
                output_data[key] = input_data[key]
                print(f"[STAGE 7] Giữ lại dữ liệu quan trọng: {key}")
        
        # Log dữ liệu đầu ra để kiểm tra
        print(f"[STAGE 7] OUTPUT KEYS: {list(output_data.keys())}")
        
        return output_data
        
    except Exception as e:
        print(f"Stage 7 Exception: {str(e)}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Error checking consistency ratio: {str(e)}"
        }