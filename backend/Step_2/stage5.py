import numpy as np
import traceback
from typing import Dict, Any, List

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

def calculate_criteria_weights(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate priority vectors (local weights) for each criterion
    
    Args:
        input_data: Results from stage4 with normalized matrices
        
    Returns:
        Dictionary containing priority vectors for each criterion
    """
    try:
        print("\n=== STAGE 5: CALCULATE CRITERIA PRIORITY VECTORS ===")
        
        # Extract data from stage4
        normalized_matrices = input_data.get("normalized_matrices", {})
        laptop_names = input_data.get("laptop_names", [])
        criteria_weights = input_data.get("criteria_weights", {})
        
        # Check for normalized matrices
        if not normalized_matrices:
            print("ERROR: Missing normalized matrices from previous stage")
            return {
                "status": "error",
                "message": "Không nhận được ma trận chuẩn hóa từ giai đoạn trước"
            }
        
        # Log input summary
        print(f"Đã nhận {len(normalized_matrices)} ma trận chuẩn hóa cho {len(laptop_names)} laptop")
        print(f"Tiêu chí: {', '.join(criteria_weights.keys())}")
        
        # Calculate priority vectors for each criterion
        priority_vectors = {}
        
        for criterion, normalized_matrix in normalized_matrices.items():
            print(f"\nXử lý tiêu chí: {criterion}")
            
            # Convert to numpy array
            if not isinstance(normalized_matrix, np.ndarray):
                normalized_matrix = np.array(normalized_matrix, dtype=float)
                
            # Calculate priority vector (row average of normalized matrix)
            priority_vector = np.mean(normalized_matrix, axis=1)
            
            # Store in result
            priority_vectors[criterion] = priority_vector.tolist()
            
            # Log priority vector for this criterion
            print(f"Vector ưu tiên cho {criterion}:")
            for i, weight in enumerate(priority_vector):
                name = laptop_names[i] if i < len(laptop_names) else f"Laptop {i+1}"
                print(f"  {name}: {round(weight, 4)}")
        
        # Create result structure combining data from stages 3-4
        result = {
            "status": "success",
            "stage": "stage5",
            # Data from stage5
            "priority_vectors": priority_vectors,
            # Data from previous stages
            "normalized_matrices": normalized_matrices,
            "column_sums": input_data.get("column_sums", {}),
            "matrices": input_data.get("matrices", {}),
            "original_matrices": input_data.get("original_matrices", {}),
            "laptop_names": laptop_names,
            "laptop_ids": input_data.get("laptop_ids", []),
            "laptops": input_data.get("laptops", []),
            "laptop_details": input_data.get("laptop_details", {}),
            "criteria_weights": criteria_weights
        }
        
        print(f"\nStage 5 hoàn thành: Đã tính toán vector ưu tiên cho {len(priority_vectors)} tiêu chí")
        
        return result
        
    except Exception as e:
        print(f"Stage 5 Exception: {str(e)}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Lỗi khi tính vector ưu tiên: {str(e)}"
        }