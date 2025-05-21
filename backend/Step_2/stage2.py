from typing import Dict, Any, List, Union
import traceback
import numpy as np
import uuid  # Thêm import uuid
from fractions import Fraction

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

def parse_comparison_value(value: Union[str, int, float]) -> float:
    """
    Phân tích giá trị so sánh có thể là chuỗi phân số như "1/2" hoặc một số
    
    Args:
        value: Giá trị cần phân tích (có thể là chuỗi, số nguyên hoặc số thực)
    
    Returns:
        Giá trị số thực tương ứng
    """
    if isinstance(value, (int, float)):
        return float(value)
    elif isinstance(value, str):
        if "/" in value:
            try:
                return float(Fraction(value))
            except ValueError:
                print(f"Định dạng phân số không hợp lệ: {value}")
                return 1.0
        else:
            try:
                return float(value)
            except ValueError:
                print(f"Định dạng số không hợp lệ: {value}")
                return 1.0
    return 1.0

def get_criteria_metric(criterion: str):
    """
    Trả về hàm metric cho một tiêu chí nhất định
    
    Args:
        criterion: Tên tiêu chí
    
    Returns:
        Hàm metric tương ứng với tiêu chí
    """
    criteria_metrics = {
        "Hiệu năng": lambda laptop: float(laptop.get("performance_score", 50)),
        "Giá": lambda laptop: 100 - min(100, laptop.get("price", 0) / 50000000 * 100),  # Đảo ngược: giá rẻ hơn thì tốt hơn
        "Màn hình": lambda laptop: float(laptop.get("display_score", 50)),
        "Pin": lambda laptop: min(100, float(str(laptop.get("battery", "0")).replace("mAh", "")) / 100000 * 100),
        "Thiết kế": lambda laptop: float(laptop.get("design_score", 50)),
        "Độ bền": lambda laptop: float(laptop.get("build_quality_score", 50))
    }
    
    return criteria_metrics.get(criterion, lambda laptop: 50.0)

def build_comparison_matrices(data: Dict[str, Any], weights: Dict[str, float], manual_comparisons=None) -> Dict[str, Any]:
    """
    Xây dựng ma trận so sánh cho từng tiêu chí
    
    Args:
        data: Dữ liệu đầu vào chứa danh sách laptop đã lọc
        weights: Từ điển trọng số các tiêu chí
        manual_comparisons: Tùy chọn so sánh thủ công do người dùng cung cấp
    
    Returns:
        Từ điển chứa các ma trận và dữ liệu liên quan
    """
    try:
        print("\n=== STAGE 2: BUILD COMPARISON MATRICES ===")
        
        # Always initialize this first to avoid the variable reference error
        original_matrices = {}
        
        # Extract laptop information
        laptops = data.get("filtered_laptops", [])
        evaluation_method = data.get("evaluationMethod", "auto")
        
        if not laptops:
            return {
                "status": "error",
                "message": "Không có laptop nào để so sánh"
            }
            
        # Print statistics
        print(f"Số lượng laptop: {len(laptops)}")
        print(f"Trọng số tiêu chí: {weights}")
        print(f"Phương pháp đánh giá: {evaluation_method}")
        
        # Extract laptop names and IDs
        laptop_names = []
        laptop_ids = []
        laptop_details = {}
        
        for laptop in laptops:
            name = laptop.get("name", f"Laptop {laptop.get('id', 'unknown')}")
            laptop_id = str(laptop.get("id", f"id-{len(laptop_names)}"))
            
            laptop_names.append(name)
            laptop_ids.append(laptop_id)
            laptop_details[laptop_id] = laptop
            
        print(f"Danh sách laptop: {laptop_names}")
        
        # Dictionary to store comparison matrices
        matrices = {}
        
        # Handle manual evaluation with provided comparisons
        if evaluation_method == "manual" and manual_comparisons:
            print("=== XÂY DỰNG MA TRẬN TỪ ĐÁNH GIÁ THỦ CÔNG ===")
            
            for criterion, comparisons in manual_comparisons.items():
                print(f"\nXử lý tiêu chí: {criterion}")
                
                # Check if criterion is in weights
                if criterion not in weights:
                    print(f"WARNING: Không tìm thấy trọng số cho tiêu chí {criterion}, sử dụng giá trị mặc định")
                    
                # Initialize comparison matrix with ones (diagonal)
                n = len(laptop_names)
                matrix = np.ones((n, n))
                
                # Create lookup for laptop name to index
                laptop_indices = {name: idx for idx, name in enumerate(laptop_names)}
                
                # Fill matrix with comparison values
                for comparison in comparisons:
                    row_name = comparison.get("row", "")
                    col_name = comparison.get("column", "")
                    value = comparison.get("value", 1)
                    
                    if row_name in laptop_indices and col_name in laptop_indices:
                        i = laptop_indices[row_name]
                        j = laptop_indices[col_name]
                        
                        # Parse value (can be fraction like "1/2")
                        parsed_value = parse_comparison_value(value)
                        
                        # Fill matrix[i][j] and its reciprocal matrix[j][i]
                        matrix[i][j] = parsed_value
                        matrix[j][i] = 1.0 / parsed_value
                    else:
                        print(f"WARNING: Không tìm thấy laptop {row_name} hoặc {col_name}")
                
                # Store matrix for this criterion
                matrices[criterion] = {
                    "matrix": matrix.tolist(),
                    "laptop_names": laptop_names
                }
                
                # Save original matrix for calculation
                original_matrices[criterion] = matrix.copy()
                
                # Log matrix for debugging
                print(f"Ma trận so sánh cho {criterion}:")
                for i, row in enumerate(matrix):
                    print(f"  {laptop_names[i]}: {row}")
                
        # Handle automatic evaluation
        else:
            print("=== XÂY DỰNG MA TRẬN TỰ ĐỘNG ===")
            
            # Define criteria metrics (functions to extract relevant values from laptops)
            criteria_metrics = {
                "Hiệu năng": lambda laptop: float(laptop.get("performance_score", 50)),
                "Giá": lambda laptop: 100 - min(100, laptop.get("price", 0) / 50000000 * 100),  # Đảo ngược: giá rẻ hơn thì tốt hơn
                "Màn hình": lambda laptop: float(laptop.get("display_score", 50)),
                "Pin": lambda laptop: min(100, float(str(laptop.get("battery", "0")).replace("mAh", "")) / 100000 * 100),
                "Thiết kế": lambda laptop: float(laptop.get("design_score", 50)),
                "Độ bền": lambda laptop: float(laptop.get("build_quality_score", 50))
            }
            
            # Process each criterion
            for criterion in weights.keys():
                print(f"\nXử lý tiêu chí: {criterion}")
                
                # Initialize matrix for this criterion
                n = len(laptop_names)
                matrix = np.ones((n, n))
                
                # Calculate scores for each laptop
                try:
                    scores = []
                    metric_fn = get_criteria_metric(criterion)
                    
                    for laptop in laptops:
                        try:
                            score = metric_fn(laptop)
                            scores.append(score)
                        except Exception as e:
                            print(f"ERROR: Không thể tính điểm {criterion} cho laptop {laptop.get('name')}: {e}")
                            # Use default score
                            scores.append(50.0)
                    
                    print(f"Điểm {criterion} cho các laptop: {scores}")
                    
                    # Calculate comparison ratios between laptops
                    for i in range(n):
                        for j in range(n):
                            if i == j:
                                matrix[i][j] = 1.0  # Equal comparison for same laptop
                            else:
                                # Avoid division by zero
                                if scores[j] == 0:
                                    matrix[i][j] = 9.0  # Max value if compared to zero
                                else:
                                    # Calculate ratio with bounds
                                    ratio = scores[i] / scores[j]
                                    # Scale ratio to Saaty scale (1-9)
                                    if ratio > 1:
                                        matrix[i][j] = min(9, 1 + 8 * (ratio - 1) / max(8, ratio - 1))
                                    else:
                                        matrix[i][j] = ratio  # Values < 1 stay as they are
                    
                    # Store matrix for this criterion
                    matrices[criterion] = {
                        "matrix": matrix.tolist(),
                        "laptop_names": laptop_names,
                        "scores": scores
                    }
                    
                    # Save original matrix for calculation
                    original_matrices[criterion] = matrix.copy()
                    
                    # Log matrix for debugging
                    print(f"Ma trận so sánh cho {criterion}:")
                    for i, row in enumerate(matrix):
                        print(f"  {laptop_names[i]}: {row}")
                        
                except Exception as criterion_error:
                    print(f"ERROR: Không thể xây dựng ma trận cho {criterion}: {criterion_error}")
                    traceback.print_exc()
        
        # Create result structure
        result = {
            "status": "success",
            "stage": "stage2",
            "matrices": matrices,
            "original_matrices": {k: v.tolist() for k, v in original_matrices.items()},
            "laptop_names": laptop_names,
            "laptop_ids": laptop_ids,
            "laptops": laptops,
            "laptop_details": laptop_details,
            "criteria_weights": weights
        }
        
        return result
    
    except Exception as e:
        error_msg = f"Lỗi khi xây dựng ma trận so sánh: {str(e)}"
        print(f"ERROR - Stage 2: {error_msg}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": error_msg
        }

def normalize_ratio_to_saaty_scale(ratio):
    """Chuẩn hóa tỷ lệ sang thang Saaty (1-9)"""
    abs_ratio = abs(ratio)
    
    if abs_ratio < 1:
        return 1.0 / normalize_ratio_to_saaty_scale(1.0 / abs_ratio)
    
    if abs_ratio < 1.1: return 1.0
    elif abs_ratio < 1.5: return 2.0
    elif abs_ratio < 2.0: return 3.0
    elif abs_ratio < 2.5: return 4.0
    elif abs_ratio < 3.0: return 5.0
    elif abs_ratio < 4.0: return 6.0
    elif abs_ratio < 5.0: return 7.0
    elif abs_ratio < 7.0: return 8.0
    else: return 9.0

# Trong stage2.py, thêm hàm trích xuất giá trị số từ chuỗi
def extract_numeric_value(value_str):
    """Trích xuất giá trị số từ chuỗi (ví dụ: '32000mAh' -> 32000)"""
    import re
    if isinstance(value_str, (int, float)):
        return float(value_str)
    
    if isinstance(value_str, str):
        # Tìm tất cả số trong chuỗi
        numbers = re.findall(r'\d+\.?\d*', value_str)
        if numbers:
            return float(numbers[0])
    
    # Giá trị mặc định
    return 0.0