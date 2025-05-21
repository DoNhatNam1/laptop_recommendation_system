from typing import Dict, Any
import traceback
import numpy as np
import json

def calculate_criteria_totals(comparison_matrices, criteria_weights):
    """
    Calculate column sums for each criterion comparison matrix
    
    Args:
        comparison_matrices: Results from stage2 with matrices
        criteria_weights: Dictionary of criteria weights
        
    Returns:
        Dictionary containing matrices and column sums
    """
    try:
        print("\n=== STAGE 3: CALCULATE CRITERIA TOTALS ===")
        
        # Extract data from stage2 result
        matrices = comparison_matrices.get("matrices", {})
        laptop_names = comparison_matrices.get("laptop_names", [])
        laptop_ids = comparison_matrices.get("laptop_ids", [])
        original_matrices = comparison_matrices.get("original_matrices", {})
        
        # Log stage input
        print(f"Received {len(matrices)} criteria matrices for {len(laptop_names)} laptops")
        print(f"Processing criteria: {', '.join(matrices.keys())}")
        
        # Check for valid input data
        if not matrices or not laptop_names:
            return {
                "status": "error",
                "message": "Không tìm thấy ma trận hoặc thông tin laptop"
            }
        
        # Dictionary to store column sums
        column_sums = {}
        
        # Ensure original_matrices exists for next stages
        if not original_matrices:
            original_matrices = {}
        
        # Process each criterion matrix
        for criterion, matrix_data in matrices.items():
            print(f"\nXử lý tiêu chí: {criterion}")
            
            # Extract matrix correctly based on structure
            matrix = None
            
            if isinstance(matrix_data, dict) and "matrix" in matrix_data:
                matrix = matrix_data["matrix"]
            else:
                matrix = matrix_data
                
            # Skip empty matrices
            if not matrix:
                print(f"WARNING: Ma trận rỗng cho tiêu chí {criterion}")
                continue
                
            # Convert to numpy array for calculations
            try:
                matrix_np = np.array(matrix, dtype=float)
                
                # Save original matrix if not already present
                if criterion not in original_matrices:
                    original_matrices[criterion] = matrix_np.tolist()
                
                # Calculate column sums
                col_sums = np.sum(matrix_np, axis=0)
                column_sums[criterion] = col_sums.tolist()
                
                # Log results
                print(f"Ma trận so sánh cho {criterion}:")
                for i, row in enumerate(matrix_np):
                    laptop_name = laptop_names[i] if i < len(laptop_names) else f"Laptop {i}"
                    print(f"  {laptop_name}: {[round(v, 3) for v in row]}")
                    
                print(f"Tổng cột cho {criterion}: {[round(v, 3) for v in col_sums]}")
                
            except Exception as e:
                print(f"ERROR: Không thể xử lý ma trận cho {criterion}: {e}")
                traceback.print_exc()
        
        # Log summary
        print("\nKết quả Stage 3:")
        for criterion, sums in column_sums.items():
            print(f"  {criterion}: {[round(v, 3) for v in sums]}")
        
        # Create result structure with all data from stage2
        result = {
            "status": "success",
            "stage": "stage3",
            # Data from stage3
            "column_sums": column_sums,
            # Data passed from stage2
            "matrices": matrices,
            "original_matrices": original_matrices,
            "laptop_names": laptop_names,
            "laptop_ids": laptop_ids,
            "laptops": comparison_matrices.get("laptops", []),
            "laptop_details": comparison_matrices.get("laptop_details", {}),
            "criteria_weights": criteria_weights
        }
        
        return result
        
    except Exception as e:
        print(f"Stage 3 Exception: {str(e)}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Lỗi khi tính tổng cột tiêu chí: {str(e)}"
        }