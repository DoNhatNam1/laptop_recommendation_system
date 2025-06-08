from typing import Dict, Any
import traceback
import numpy as np

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

def calculate_final_scores(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Tính điểm xếp hạng cuối cùng cho các laptop
    
    Args:
        input_data: Kết quả từ stage7 với priority vectors và trọng số tiêu chí
        
    Returns:
        Dictionary chứa laptop đã xếp hạng
    """
    try:
        print("\n=== STAGE 8: CALCULATE FINAL SCORES ===")
        
        # Log để kiểm tra dữ liệu đầu vào
        print(f"[STAGE 8] INPUT KEYS: {list(input_data.keys())}")
        print(f"[STAGE 8] Has alternative_priority_tables: {bool(input_data.get('alternative_priority_tables'))}")
        print(f"[STAGE 8] Has criteria_priority_tables: {bool(input_data.get('criteria_priority_tables'))}")
        print(f"[STAGE 8] Has consistency_vectors: {bool(input_data.get('consistency_vectors'))}")
        
        # Extract data from stage7
        priority_vectors = input_data.get("priority_vectors", {})
        criteria_weights = input_data.get("criteria_weights", {})
        laptop_names = input_data.get("laptop_names", [])
        laptop_ids = input_data.get("laptop_ids", [])
        laptop_details = input_data.get("laptop_details", {})
        laptops = input_data.get("laptops", [])
        laptop_count = len(laptop_names)
        
        print(f"Calculating final scores for {len(laptop_names)} laptops")
        print(f"Using {len(priority_vectors)} priority vectors and {len(criteria_weights)} criteria weights")
        
        # Create mapping between laptop index and ID
        laptop_index_to_id = {}
        for i, laptop_id in enumerate(laptop_ids):
            laptop_index_to_id[i] = laptop_id
        
        # Initialize arrays for calculation
        final_scores = [0] * laptop_count
        
        # Calculate weighted sum of priority vectors
        for criterion, weight in criteria_weights.items():
            # Skip if criterion not in priority vectors
            if criterion not in priority_vectors:
                print(f"WARNING: Criterion '{criterion}' not found in priority vectors, skipping")
                continue
            
            # Get priority vector for this criterion
            priority = priority_vectors[criterion]
            
            # Apply weight and add to final scores
            for i in range(laptop_count):
                if i < len(priority):
                    final_scores[i] += priority[i] * weight
            
            print(f"Criterion {criterion} (weight={weight:.4f}): {[round(p, 4) for p in priority]}")
            print(f"Weighted: {[round(p * weight, 4) for p in priority]}")
        
        print(f"\nFinal scores: {[round(score, 6) for score in final_scores]}")
        
        # Create ranked laptop list
        ranked_laptops = []
        for i, score in enumerate(final_scores):
            laptop_id = laptop_index_to_id.get(i, f"laptop-{i}")
            laptop_name = laptop_names[i] if i < len(laptop_names) else f"Laptop {i+1}"
            
            # Get laptop details
            details = {}
            if laptop_id in laptop_details:
                details = laptop_details[laptop_id]
            elif i < len(laptops):
                details = laptops[i]
            
            # Create laptop object with all details and score
            laptop = {
                "id": laptop_id,
                "name": laptop_name,
                "score": float(score),  # Convert to Python float for JSON
                "rank": 0  # Will be set after sorting
            }
            
            # Add all details from the original laptop object
            if details:
                for key, value in details.items():
                    if key not in laptop:
                        laptop[key] = value
            
            ranked_laptops.append(laptop)
        
        # Sort laptops by score (descending)
        ranked_laptops.sort(key=lambda x: x["score"], reverse=True)
        
        # Assign ranks
        for i, laptop in enumerate(ranked_laptops):
            laptop["rank"] = i + 1
        
        # Create result structure
        result = {
            "status": "success",
            "stage": "stage8",
            "message": "Laptop ranking completed successfully",
            "ranked_laptops": ranked_laptops,
            "laptop_count": len(ranked_laptops),
            
            # Include all previous data
            "alternative_priority_tables": input_data.get("alternative_priority_tables", {}),
            "column_sums": input_data.get("column_sums", {}),
            "normalized_matrices": input_data.get("normalized_matrices", {}),
            
            # Thêm dữ liệu nhất quán
            "lambda_max": input_data.get("lambda_max", {}),
            "consistency_vectors": input_data.get("consistency_vectors", {}),
            "ci_values": input_data.get("ci_values", {}),
            "cr_results": input_data.get("cr_results", {}),
            "consistency_status": input_data.get("consistency_status", {}),
            "ri_values": input_data.get("ri_values", {})
        }
        
        # Đảm bảo giữ lại tất cả dữ liệu quan trọng từ các stage trước
        important_keys = [
            "criteria_priority_tables",
            "original_matrices",
        ]
        
        for key in important_keys:
            if key in input_data and key not in result:
                result[key] = input_data[key]
                print(f"[STAGE 8] Giữ lại dữ liệu quan trọng: {key}")
        
        print(f"\nStage 8 completed: Ranked {len(result['ranked_laptops'])} laptops")
        print(f"[STAGE 8] OUTPUT KEYS: {list(result.keys())}")
        
        return result
        
    except Exception as e:
        print(f"Stage 8 Exception: {str(e)}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Error calculating final scores: {str(e)}",
            "ranked_laptops": [] 
        }