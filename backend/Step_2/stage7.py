from typing import Dict, Any
import numpy as np
import traceback

def log_matrix(stage_name, matrix_name, matrix_data):
    """Log ma trận với định dạng dễ đọc"""
    print(f"\n[{stage_name}] Ma trận {matrix_name}:")
    
    if isinstance(matrix_data, np.ndarray):
        for row in matrix_data:
            print(f"  {row}")
    elif isinstance(matrix_data, list):
        for row in matrix_data:
            print(f"  {row}")
    else:
        print(f"  Không phải ma trận: {type(matrix_data)}")
        try:
            print(f"  Giá trị: {matrix_data}")
        except:
            print("  Không thể in giá trị")

def log_input_output(stage_name, input_data, output_data=None):
    """Log input và output của stage"""
    print(f"\n{'='*20} {stage_name} LOG {'='*20}")
    
    # Log keys của input
    print(f"[{stage_name}] INPUT KEYS: {list(input_data.keys() if isinstance(input_data, dict) else [])}")
    
    # Log cấu trúc matrices nếu có
    if isinstance(input_data, dict):
        if "matrices" in input_data:
            print(f"[{stage_name}] INPUT matrices KEYS: {list(input_data['matrices'].keys())}")
            for matrix_key, matrix_data in input_data["matrices"].items():
                if isinstance(matrix_data, dict) and "matrix" in matrix_data:
                    print(f"[{stage_name}] matrices[{matrix_key}] là dict có key 'matrix'")
                else:
                    print(f"[{stage_name}] matrices[{matrix_key}] type: {type(matrix_data)}")
                    
        # Log original_matrices
        if "original_matrices" in input_data:
            print(f"[{stage_name}] INPUT original_matrices KEYS: {list(input_data['original_matrices'].keys())}")
            for matrix_key, matrix_data in input_data["original_matrices"].items():
                print(f"[{stage_name}] original_matrices[{matrix_key}] type: {type(matrix_data)}")
                if isinstance(matrix_data, np.ndarray):
                    print(f"[{stage_name}] original_matrices[{matrix_key}] shape: {matrix_data.shape}")
    
    # Log output keys nếu có
    if output_data:
        print(f"\n[{stage_name}] OUTPUT KEYS: {list(output_data.keys() if isinstance(output_data, dict) else [])}")
        
    print(f"{'='*20} END {stage_name} LOG {'='*20}\n")

def check_consistency_ratio(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Kiểm tra tính nhất quán của các ma trận so sánh tiêu chí
    
    Args:
        input_data: Results from stage6 with lambda max values
        
    Returns:
        Dictionary containing consistency analysis or error if not consistent
    """
    try:
        print("\n=== STAGE 7: CONSISTENCY RATIO CHECK ===")
        
        # Extract data from stage6
        lambda_max_values = input_data.get("lambda_max", {})
        laptop_names = input_data.get("laptop_names", [])
        criteria_weights = input_data.get("criteria_weights", {})
        priority_vectors = input_data.get("priority_vectors", {})
        laptop_count = len(laptop_names)
        
        # Check required data
        if not lambda_max_values:
            print("ERROR: Missing lambda max values from previous stage")
            return {
                "status": "error",
                "message": "Không nhận được giá trị lambda max từ giai đoạn trước"
            }
        
        # Random Index (RI) for different matrix sizes
        random_index = {
            1: 0.0, 2: 0.0, 3: 0.58, 4: 0.9, 5: 1.12,
            6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49,
            11: 1.51, 12: 1.48, 13: 1.56, 14: 1.57, 15: 1.59
        }
        
        # Initialize results
        cr_values = {}
        ci_values = {}
        consistency_status = {}
        inconsistent_criteria = []
        
        # Consistency threshold and numerical tolerance
        CR_THRESHOLD = 0.1
        EPSILON = 1e-10  # Small value for floating-point comparisons
        
        # Log input summary
        print(f"Checking consistency for {len(lambda_max_values)} criteria matrices")
        print(f"Number of laptops: {laptop_count}")
        
        # Check consistency for each criterion
        for criterion, lambda_max in lambda_max_values.items():
            print(f"\nChecking consistency for criterion: {criterion}")
            
            # Get matrix size (n)
            n = laptop_count
            
            # Handle numerical precision - if lambda_max is very close to n, consider it equal
            if abs(lambda_max - n) < EPSILON:
                lambda_max = float(n)  # Avoid tiny negative values
            
            # Calculate Consistency Index (CI)
            ci = (lambda_max - n) / (n - 1) if n > 1 else 0
            
            # Fix CI for numerical precision
            if abs(ci) < EPSILON:
                ci = 0.0
            
            # Get Random Index (RI)
            ri = random_index.get(n, 1.60)  # Default 1.60 for n > 15
            
            # Calculate Consistency Ratio (CR)
            cr = ci / ri if ri != 0 else 0
            
            # Fix CR for numerical precision
            if abs(cr) < EPSILON:
                cr = 0.0
            
            # Store results
            ci_values[criterion] = round(ci, 6)
            cr_values[criterion] = round(cr, 6)
            
            # Check consistency
            if cr < -EPSILON or cr > CR_THRESHOLD:  # Use epsilon for negative check
                consistency_status[criterion] = False
                inconsistent_criteria.append(criterion)
                print(f"WARNING: Matrix for {criterion} is NOT consistent: CR = {cr:.6f} {'< 0' if cr < 0 else '> 0.1'}")
            else:
                consistency_status[criterion] = True
                print(f"Matrix for {criterion} is consistent: CR = {cr:.6f} <= 0.1")
                
            # Log details
            print(f"  Lambda Max: {lambda_max:.6f}")
            print(f"  n: {n}")
            print(f"  CI: {ci:.6f}")
            print(f"  RI: {ri:.4f}")
            print(f"  CR: {cr:.6f}")
        
        # Prepare result based on consistency check
        if inconsistent_criteria:
            # Create error message with detailed inconsistency information
            error_message = f"Phát hiện {len(inconsistent_criteria)} tiêu chí không nhất quán: {', '.join(inconsistent_criteria)}. " + \
                           "Vui lòng điều chỉnh lại ma trận so sánh cho các tiêu chí này."
            
            print("\nCONSISTENCY CHECK FAILED:")
            print(error_message)
            
            return {
                "status": "error",
                "message": error_message,
                "cr_values": cr_values,
                "ci_values": ci_values,
                "inconsistent_criteria": inconsistent_criteria,
                "consistency_status": consistency_status,
                "stage": "stage7"
            }
        else:
            print("\nCONSISTENCY CHECK PASSED: All matrices are consistent")
            
            # Create full result with data from previous stages
            result = {
                "status": "success",
                "stage": "stage7",
                "message": "Tất cả ma trận đánh giá đều có tính nhất quán tốt",
                "cr_values": cr_values,
                "ci_values": ci_values,
                "consistency_status": consistency_status,
                "priority_vectors": priority_vectors,
                "lambda_max": lambda_max_values,
                "normalized_matrices": input_data.get("normalized_matrices", {}),
                "original_matrices": input_data.get("original_matrices", {}),
                "column_sums": input_data.get("column_sums", {}),
                "matrices": input_data.get("matrices", {}),
                "laptop_names": laptop_names,
                "laptop_ids": input_data.get("laptop_ids", []),
                "laptops": input_data.get("laptops", []),
                "laptop_details": input_data.get("laptop_details", {}),
                "criteria_weights": criteria_weights
            }
            
            return result
        
    except Exception as e:
        print(f"Stage 7 Exception: {str(e)}")
        traceback.print_exc()
        return {"status": "error", "message": f"Lỗi khi kiểm tra tính nhất quán: {str(e)}"}