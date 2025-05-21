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

def normalize_comparison_matrices(input_data):
    """
    Chuẩn hóa ma trận so sánh và tính vector ưu tiên
    
    Args:
        input_data: Kết quả từ stage3 với ma trận và tổng cột
        
    Returns:
        Dictionary chứa ma trận đã chuẩn hóa và vector ưu tiên
    """
    try:
        print("\n=== STAGE 4: NORMALIZE COMPARISON MATRICES ===")
        
        # Extract data from stage3 result
        matrices = input_data.get("matrices", {})
        column_sums = input_data.get("column_sums", {})
        original_matrices = input_data.get("original_matrices", {})
        laptop_names = input_data.get("laptop_names", [])
        laptop_count = len(laptop_names)
        
        # Check for valid input data
        if not matrices or not column_sums:
            print("ERROR: Missing required data from previous stage")
            return {
                "status": "error", 
                "message": "Không nhận được ma trận hoặc tổng cột từ giai đoạn trước"
            }
        
        # Log the input summary
        print(f"Nhận được {len(matrices)} ma trận cho {laptop_count} laptop")
        print(f"Tiêu chí: {', '.join(matrices.keys())}")
        
        # Prepare result structures
        normalized_matrices = {}
        
        # Process each criterion matrix
        for criterion, matrix_data in matrices.items():
            print(f"\nXử lý tiêu chí: {criterion}")
            
            # Extract matrix - handle different formats
            matrix = None
            
            # Case: matrix_data is a dict with 'matrix' key
            if isinstance(matrix_data, dict) and "matrix" in matrix_data:
                matrix = np.array(matrix_data["matrix"], dtype=float)
            # Case: matrix_data is the matrix itself
            elif isinstance(matrix_data, (list, np.ndarray)):
                matrix = np.array(matrix_data, dtype=float)
            # Case: matrix is in original_matrices
            elif criterion in original_matrices:
                matrix = np.array(original_matrices[criterion], dtype=float)
                
            # If still no matrix, create identity matrix
            if matrix is None:
                print(f"WARNING: Không tìm thấy ma trận cho {criterion}, sử dụng ma trận đơn vị")
                matrix = np.ones((laptop_count, laptop_count))
            
            # Get column sums for this criterion
            if criterion not in column_sums:
                print(f"WARNING: Không tìm thấy tổng cột cho {criterion}, tính lại")
                col_sum = np.sum(matrix, axis=0)
            else:
                col_sum = np.array(column_sums[criterion], dtype=float)
            
            # Create normalized matrix
            normalized = np.zeros((laptop_count, laptop_count))
            for i in range(laptop_count):
                for j in range(laptop_count):
                    if col_sum[j] != 0:
                        normalized[i, j] = matrix[i, j] / col_sum[j]
                    else:
                        normalized[i, j] = 1/laptop_count  # Equal priority if column sum is zero
            
            # Store results
            normalized_matrices[criterion] = normalized.tolist()
            
            # Log the results
            print(f"Ma trận chuẩn hóa cho {criterion}:")
            for i, row in enumerate(normalized):
                name = laptop_names[i] if i < len(laptop_names) else f"Laptop {i+1}"
                print(f"  {name}: {[round(v, 3) for v in row]}")
        
        # Create result structure combining data from stages 2-3
        result = {
            "status": "success",
            "stage": "stage4",
            # Data from stage4
            "normalized_matrices": normalized_matrices,
            # Data from previous stages
            "matrices": matrices,
            "column_sums": column_sums,
            "original_matrices": original_matrices,
            "laptop_names": laptop_names,
            "laptops": input_data.get("laptops", []),
            "laptop_ids": input_data.get("laptop_ids", []),
            "laptop_details": input_data.get("laptop_details", {}),
            "criteria_weights": input_data.get("criteria_weights", {})
        }
        
        print("\nKết quả Stage 4:")
        print(f"  Đã chuẩn hóa {len(normalized_matrices)} ma trận")
        
        return result
        
    except Exception as e:
        print(f"Stage 4 Exception: {str(e)}")
        traceback.print_exc()
        return {"status": "error", "message": f"Lỗi khi chuẩn hóa ma trận: {str(e)}"}

def calculate_criteria_scores(normalized_data):
    """
    Tính điểm cuối cùng cho từng laptop dựa trên ma trận đã chuẩn hóa
    """
    try:
        print("\n=== CALCULATE FINAL SCORES ===")
        print(f"Keys in normalized_data: {list(normalized_data.keys())}")
        
        # Lấy dữ liệu đã chuẩn hóa
        priority_vectors = normalized_data.get("priority_vectors", {})
        criteria_weights = normalized_data.get("criteria_weights", {})
        laptop_names = normalized_data.get("laptop_names", [])
        laptop_details = normalized_data.get("laptop_details", {})
        
        if not priority_vectors or not criteria_weights:
            print("ERROR: Không tìm thấy vector ưu tiên hoặc trọng số tiêu chí")
            return {
                "status": "error", 
                "message": "Không tìm thấy dữ liệu cần thiết để tính điểm"
            }
        
        # Dictionary lưu điểm cho mỗi laptop
        laptop_scores = {}
        
        # Tìm mapping giữa laptop_names và laptop_details
        laptop_id_map = {}
        for laptop_id, details in laptop_details.items():
            name = details.get("name")
            if name in laptop_names:
                laptop_id_map[name] = laptop_id
        
        # Tính điểm cho mỗi laptop
        for laptop_name in laptop_names:
            laptop_id = laptop_id_map.get(laptop_name, f"laptop-{laptop_names.index(laptop_name)+1}")
            
            # Tính điểm
            total_score = 0
            criteria_scores = {}
            weighted_scores = {}
            
            for criterion, weight in criteria_weights.items():
                if criterion in priority_vectors:
                    # Lấy điểm ưu tiên từ priority_vector
                    priority_score = priority_vectors[criterion].get(laptop_name, 0)
                    
                    # Tính điểm có trọng số
                    weighted_score = priority_score * weight
                    
                    # Lưu điểm
                    criteria_scores[criterion] = priority_score
                    weighted_scores[criterion] = weighted_score
                    total_score += weighted_score
                    
                    print(f"  {laptop_name} - {criterion}: priority={priority_score:.4f}, weight={weight:.4f}, weighted={weighted_score:.4f}")
            
            # Lưu điểm tổng
            laptop_scores[laptop_id] = {
                "id": laptop_id,
                "name": laptop_name,
                "total_score": total_score,
                "criteria_scores": criteria_scores,
                "weighted_scores": weighted_scores
            }
            
            print(f"Laptop {laptop_name} (ID: {laptop_id}): Total score = {total_score:.4f}")
        
        # BỎ phần tạo ranked_laptops ở đây
        
        # Trả về kết quả với laptop_scores
        result = {
            "status": "success",
            "stage": "stage4",
            "laptop_scores": laptop_scores,
            "criteria_weights": criteria_weights,
            "laptop_names": laptop_names,
            "laptop_details": laptop_details,
            "priority_vectors": normalized_data.get("priority_vectors", {}),
            "normalized_matrices": normalized_data.get("normalized_matrices", {}),
            "laptop_ids": normalized_data.get("laptop_ids", [])
        }
        
        return result
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        traceback.print_exc()
        return {
            "status": "error", 
            "message": f"Lỗi khi tính điểm cuối cùng: {str(e)}"
        }