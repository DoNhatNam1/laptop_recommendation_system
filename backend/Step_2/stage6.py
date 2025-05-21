import numpy as np
import traceback
from typing import Dict, Any, List

def calculate_lambda_max(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate lambda max for each criterion matrix
    
    Args:
        input_data: Results from stage5 with priority vectors
        
    Returns:
        Dictionary containing lambda max values for each criterion
    """
    try:
        print("\n=== STAGE 6: CALCULATE LAMBDA MAX ===")
        
        # Extract data from stages 2-5
        priority_vectors = input_data.get("priority_vectors", {})
        original_matrices = input_data.get("original_matrices", {})
        laptop_names = input_data.get("laptop_names", [])
        criteria_weights = input_data.get("criteria_weights", {})
        
        # Check required data
        if not priority_vectors or not original_matrices:
            print("ERROR: Missing required data from previous stages")
            return {
                "status": "error",
                "message": "Không nhận được vector ưu tiên hoặc ma trận gốc từ các giai đoạn trước"
            }
        
        # Log input summary
        print(f"Đã nhận {len(priority_vectors)} vector ưu tiên và {len(original_matrices)} ma trận gốc")
        print(f"Tiêu chí: {', '.join(criteria_weights.keys())}")
        
        # Calculate lambda max for each criterion
        lambda_max_values = {}
        consistency_vectors = {}
        
        for criterion, priority_vector in priority_vectors.items():
            print(f"\nXử lý tiêu chí: {criterion}")
            
            # Skip if criterion not in original matrices
            if criterion not in original_matrices:
                print(f"WARNING: Không tìm thấy ma trận gốc cho {criterion}, bỏ qua")
                continue
                
            # Get original matrix
            original = original_matrices[criterion]
            
            # Convert to numpy arrays
            priority_np = np.array(priority_vector, dtype=float)
            original_np = np.array(original, dtype=float)
            
            # Print original matrix for debugging
            print(f"  Original matrix (first row): {original_np[0]}")
            
            # Calculate weighted sum vector (Ax) - FIXED
            weighted_sum = np.zeros_like(priority_np)
            for i in range(len(priority_np)):
                weighted_sum[i] = sum(original_np[i][j] * priority_np[j] for j in range(len(priority_np)))
            
            # Calculate consistency vector (Ax/x)
            consistency_vector = np.zeros_like(priority_np)
            for i in range(len(priority_np)):
                if priority_np[i] > 0.000001:  # Avoid division by zero with better threshold
                    consistency_vector[i] = weighted_sum[i] / priority_np[i]
                else:
                    consistency_vector[i] = 0
                    
            # Print intermediate values for debugging
            print(f"  Priority Vector: {[round(v, 4) for v in priority_np]}")
            print(f"  Weighted Sum Vector: {[round(v, 4) for v in weighted_sum]}")
            print(f"  Consistency Vector: {[round(v, 4) for v in consistency_vector]}")
            
            # Calculate lambda max (average of consistency vector)
            # Filter out zeros and extreme values
            valid_values = consistency_vector[(consistency_vector > 0) & (consistency_vector < 100)]
            if len(valid_values) > 0:
                lambda_max = float(np.mean(valid_values))
            else:
                # If matrix is perfectly consistent or we have no valid values
                lambda_max = float(len(priority_np))
            
            # Store results
            lambda_max_values[criterion] = lambda_max
            consistency_vectors[criterion] = consistency_vector.tolist()
            
            # Log the results
            print(f"Vector ưu tiên cho {criterion}: {[round(v, 4) for v in priority_np]}")
            print(f"Vector nhất quán cho {criterion}: {[round(v, 4) for v in consistency_vector]}")
            print(f"Lambda max cho {criterion}: {round(lambda_max, 4)}")
        
        # Log summary
        print("\nKết quả Stage 6:")
        for criterion, lambda_max in lambda_max_values.items():
            print(f"  {criterion}: Lambda Max = {round(lambda_max, 4)}")
        
        # Create result structure combining data from stages 2-5
        result = {
            "status": "success",
            "stage": "stage6",
            # Data from stage6
            "lambda_max": lambda_max_values,
            "consistency_vectors": consistency_vectors,
            # Data from previous stages
            "priority_vectors": priority_vectors,
            "normalized_matrices": input_data.get("normalized_matrices", {}),
            "original_matrices": original_matrices,
            "column_sums": input_data.get("column_sums", {}),
            "matrices": input_data.get("matrices", {}),
            "laptop_names": laptop_names,
            "laptop_ids": input_data.get("laptop_ids", []),
            "laptops": input_data.get("laptops", []),
            "laptop_details": input_data.get("laptop_details", {}),
            "criteria_weights": criteria_weights
        }
        
        print(f"\nStage 6 hoàn thành: Đã tính Lambda Max cho {len(lambda_max_values)} tiêu chí")
        
        return result
        
    except Exception as e:
        print(f"Stage 6 Exception: {str(e)}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Lỗi khi tính Lambda Max: {str(e)}"
        }

def synthesize_priorities(stage5_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Tổng hợp ưu tiên của các tiêu chí để xếp hạng laptop
    
    Parameters:
    - stage5_result: Kết quả từ Stage 5
    
    Returns:
    - Dictionary chứa điểm tổng hợp cho từng laptop
    """
    try:
        print("\n=== STAGE 6: SYNTHESIZE PRIORITIES ===")
        
        # Log input và debug
        print(f"[STAGE 6] INPUT KEYS: {list(stage5_result.keys())}")
        
        # Khởi tạo kết quả
        result = {
            "status": "success",
            "stage": "stage6",
            "synthesized_scores": {},
            "laptop_details": stage5_result.get("laptop_details", {})
        }
        
        # Get priority vectors - check multiple possible locations
        priority_vectors = stage5_result.get("priority_vectors", {})
        
        # If no priority_vectors found directly, try to build them from normalized_matrices
        if not priority_vectors and "normalized_matrices" in stage5_result:
            print("DEBUG stage6 - Building priority vectors from normalized matrices")
            normalized_matrices = stage5_result.get("normalized_matrices", {})
            priority_vectors = {}
            
            for criterion, data in normalized_matrices.items():
                priority_vectors[criterion] = {}
                for laptop_name, scores in data.items():
                    priority_vectors[criterion][laptop_name] = scores.get("normalized_priority", 0)
        
        # If still no priority_vectors, try to use the priority_vectors directly from stage5_result
        if not priority_vectors and all(k in stage5_result for k in ["Hiệu năng", "Giá", "Màn hình", "Thiết kế", "Pin"]):
            print("DEBUG stage6 - Using criteria keys directly as priority vectors")
            priority_vectors = {k: v for k, v in stage5_result.items() 
                             if k in ["Hiệu năng", "Giá", "Màn hình", "Thiết kế", "Pin"]}
        
        # Get criteria weights
        weights = {}
        # First try step1_weights (older format)
        if "step1_weights" in stage5_result and "values" in stage5_result["step1_weights"]:
            weights = stage5_result["step1_weights"]["values"]
        # Then try criteria_weights (newer format)
        elif "criteria_weights" in stage5_result:
            weights = stage5_result["criteria_weights"]
        # Last resort, use normalized_weights
        elif "normalized_weights" in stage5_result:
            weights = stage5_result["normalized_weights"]
        
        if not priority_vectors:
            print("ERROR stage6 - Không tìm thấy vector ưu tiên")
            return {"status": "error", "message": "Không tìm thấy vector nhất quán hoặc ma trận từ Stage 5"}
        
        print(f"DEBUG stage6 - Đã tìm thấy {len(priority_vectors)} vector ưu tiên")
        print(f"DEBUG stage6 - Criteria: {list(priority_vectors.keys())}")
        
        # Get laptop names using multiple methods
        laptop_names = []
        
        # Method 1: Try to get from priority_vectors
        if priority_vectors:
            first_criterion = next(iter(priority_vectors))
            if first_criterion in priority_vectors:
                if isinstance(priority_vectors[first_criterion], dict):
                    laptop_names = list(priority_vectors[first_criterion].keys())
        
        # Method 2: If not found, try from laptop_details
        if not laptop_names and "laptop_details" in stage5_result:
            laptop_details = stage5_result["laptop_details"]
            laptop_names = [details.get("name", f"Laptop {id}") for id, details in laptop_details.items()]
        
        # Method 3: Last resort, try from laptop_names
        if not laptop_names:
            laptop_names = stage5_result.get("laptop_names", [])
        
        # Calculate synthesized scores for each laptop
        for laptop_name in laptop_names:
            total_score = 0
            criteria_scores = {}
            
            # Sum weighted priority for each criterion
            for criterion, criterion_priorities in priority_vectors.items():
                # Get weight for this criterion
                weight = weights.get(criterion, 0.2)  # Default equal weight if missing
                
                # Get priority for this laptop
                priority = 0
                if isinstance(criterion_priorities, dict):
                    priority = criterion_priorities.get(laptop_name, 0)
                    if isinstance(priority, dict):
                        priority = priority.get("normalized_priority", 0)
                
                # Calculate weighted score
                weighted_score = priority * weight
                criteria_scores[criterion] = weighted_score
                total_score += weighted_score
            
            # Store synthesized score
            result["synthesized_scores"][laptop_name] = {
                "total_score": round(total_score, 4),
                "criteria_scores": {k: round(v, 4) for k, v in criteria_scores.items()}
            }
        
        # Copy additional attributes
        for key in ["step1_weights", "priority_vectors"]:
            if key in stage5_result:
                result[key] = stage5_result[key]
                
        # Add stage data for later stages
        result["step5_data"] = {
            "priority_vectors": priority_vectors,
            "criteria_weights": weights
        }
        
        # Log output
        print(f"[STAGE 6] OUTPUT KEYS: {list(result.keys())}")
        print(f"[STAGE 6] Synthesized scores for {len(result['synthesized_scores'])} laptops")
        
        return result
        
    except Exception as e:
        print(f"Stage 6 Exception: {str(e)}")
        traceback.print_exc()
        return {"status": "error", "message": f"Lỗi khi tổng hợp ưu tiên: {str(e)}"}