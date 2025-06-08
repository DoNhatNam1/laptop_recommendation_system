import numpy as np
import traceback
from typing import Dict, Any, List

def calculate_alternative_priorities(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Tính toán trọng số phương án (alternative priorities) cho từng phương án (laptop)
    theo từng tiêu chí đánh giá
    
    Args:
        input_data: Kết quả từ stage4 với các ma trận đã được chuẩn hóa
        
    Returns:
        Dictionary chứa trọng số phương án cho mỗi tiêu chí
    """
    try:
        print("\n=== STAGE 5: CALCULATE ALTERNATIVE PRIORITIES ===")
        
        # Extract data from stage4
        normalized_matrices = input_data.get("normalized_matrices", {})
        laptop_names = input_data.get("laptop_names", [])
        laptop_ids = input_data.get("laptop_ids", [])
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
        
        # Calculate alternative priorities for each criterion
        alternative_priorities = {}
        
        # Cấu trúc để lưu trữ trọng số phương án theo định dạng bảng
        alternative_priority_tables = {}
        
        for criterion, normalized_matrix in normalized_matrices.items():
            print(f"\nTiêu chí: {criterion}")
            
            # Convert to numpy array if needed
            if not isinstance(normalized_matrix, np.ndarray):
                normalized_matrix = np.array(normalized_matrix, dtype=float)
                
            # Calculate alternative priorities (row average of normalized matrix)
            priority_vector = np.mean(normalized_matrix, axis=1)
            
            # Store in result
            alternative_priorities[criterion] = priority_vector.tolist()
            
            # Tạo bảng trọng số phương án (PA) cho tiêu chí này
            priority_table = []
            for i, weight in enumerate(priority_vector):
                if i < len(laptop_names):
                    laptop_name = laptop_names[i]
                    laptop_id = laptop_ids[i] if i < len(laptop_ids) else f"laptop-{i}"
                    
                    priority_table.append({
                        "laptop_name": laptop_name,
                        "laptop_id": laptop_id,
                        "weight": float(round(weight, 4))
                    })
                
            # Sắp xếp bảng theo trọng số giảm dần
            priority_table = sorted(priority_table, key=lambda x: x["weight"], reverse=True)
            alternative_priority_tables[criterion] = priority_table
            
            # Log trọng số phương án theo định dạng bảng
            print(f"\nTrọng số PA cho {criterion}:")
            print(f"{'Laptop':<30} {'Trọng số (PA)':<15}")
            print("-" * 45)
            for entry in priority_table:
                print(f"{entry['laptop_name']:<30} {entry['weight']:<15.4f}")
        
        # Create result structure 
        result = {
            "status": "success",
            "stage": "stage5",
            # Data from stage5
            "priority_vectors": alternative_priorities,  # Giữ tên cũ để tương thích ngược
            "alternative_priorities": alternative_priorities,  # Tên mới, rõ ràng hơn
            "criteria_priority_tables": alternative_priority_tables,  # Giữ tên cũ
            "alternative_priority_tables": alternative_priority_tables,  # Tên mới
            # Data from previous stages
            "normalized_matrices": normalized_matrices,
            "column_sums": input_data.get("column_sums", {}),
            "matrices": input_data.get("matrices", {}),
            "original_matrices": input_data.get("original_matrices", {}),
            "laptop_names": laptop_names,
            "laptop_ids": input_data.get("laptop_ids", []),
            "laptops": input_data.get("laptops", []),
            "laptop_details": input_data.get("laptop_details", {}),
            "criteria_weights": criteria_weights  # Trọng số tiêu chí (từ đầu vào)
        }
        
        print(f"\nStage 5 hoàn thành: Đã tính toán trọng số phương án cho {len(alternative_priorities)} tiêu chí")
        
        return result
        
    except Exception as e:
        print(f"Stage 5 Exception: {str(e)}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Lỗi khi tính trọng số phương án: {str(e)}"
        }