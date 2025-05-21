from typing import Dict, Any, List, Tuple
import traceback
from fractions import Fraction

def build_matrix_from_comparisons(comparisons: List[Dict[str, Any]]) -> Tuple[List[List[float]], List[str]]:
    """
    Xây dựng ma trận so sánh từ danh sách các so sánh cặp
    
    Parameters:
    - comparisons: Danh sách các so sánh cặp
    
    Returns:
    - Tuple gồm ma trận so sánh và danh sách tiêu chí theo thứ tự
    """
    if not comparisons:
        return [], []
    
    # Tập hợp các tiêu chí duy nhất
    unique_criteria = set()
    for comparison in comparisons:
        row = comparison.get("row", "")
        col = comparison.get("column", "")
        if row and col:
            unique_criteria.add(row)
            unique_criteria.add(col)
    
    # Sắp xếp tiêu chí để đảm bảo thứ tự nhất quán
    criteria_order = sorted(list(unique_criteria))
    
    # Số lượng tiêu chí
    n = len(criteria_order)
    
    # Khởi tạo ma trận với tất cả giá trị 1 (giá trị mặc định)
    matrix = [[1.0 for _ in range(n)] for _ in range(n)]
    
    # Điền giá trị từ danh sách so sánh
    for comparison in comparisons:
        row_name = comparison.get("row", "")
        col_name = comparison.get("column", "")
        value = comparison.get("value", "1")
        
        # Chuyển đổi giá trị thành số thực
        if isinstance(value, (int, float)):
            float_value = float(value)
        elif isinstance(value, str):
            # Xử lý trường hợp giá trị dạng phân số (ví dụ: "1/3")
            if "/" in value:
                try:
                    float_value = float(Fraction(value))
                except (ValueError, ZeroDivisionError):
                    print(f"WARNING: Không thể chuyển đổi giá trị '{value}' thành số thực. Sử dụng 1.0")
                    float_value = 1.0
            else:
                try:
                    float_value = float(value)
                except ValueError:
                    print(f"WARNING: Không thể chuyển đổi giá trị '{value}' thành số thực. Sử dụng 1.0")
                    float_value = 1.0
        else:
            print(f"WARNING: Không thể chuyển đổi giá trị '{value}' thành số thực. Sử dụng 1.0")
            float_value = 1.0
        
        # Tìm vị trí của tiêu chí trong ma trận
        if row_name in criteria_order and col_name in criteria_order:
            row_idx = criteria_order.index(row_name)
            col_idx = criteria_order.index(col_name)
            
            # Đặt giá trị vào ma trận
            matrix[row_idx][col_idx] = float_value
            
            # Đặt giá trị đối xứng (nghịch đảo)
            if float_value != 0:
                matrix[col_idx][row_idx] = 1.0 / float_value
    
    return matrix, criteria_order

def build_comparison_matrix(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Stage 1 - Xây dựng ma trận so sánh từ dữ liệu người dùng
    
    Parameters:
    - user_data: Dữ liệu đầu vào từ người dùng chứa comparisons
    
    Returns:
    - Dictionary chứa ma trận so sánh và thông tin liên quan
    """
    try:
        if not user_data:
            return {
                "status": "error",
                "message": "Không có dữ liệu đầu vào từ người dùng"
            }
        
        # Lấy danh sách so sánh từ dữ liệu người dùng
        comparisons = user_data.get("comparisons", [])
        
        if not comparisons:
            return {
                "status": "error",
                "message": "Không tìm thấy dữ liệu so sánh trong đầu vào"
            }
        
        # Xây dựng ma trận từ các so sánh
        matrix, criteria_order = build_matrix_from_comparisons(comparisons)
        
        if not matrix or not criteria_order:
            return {
                "status": "error",
                "message": "Không thể xây dựng ma trận từ dữ liệu so sánh"
            }
        
        # Chuẩn bị định dạng ma trận để hiển thị
        matrix_data = [[round(val, 3) for val in row] for row in matrix]
        
        # Kiểm tra tính hợp lệ của ma trận (đối xứng nghịch đảo)
        is_valid = True
        validation_issues = []
        n = len(matrix)
        
        for i in range(n):
            for j in range(i+1, n):
                if abs(matrix[i][j] * matrix[j][i] - 1.0) > 0.01:
                    is_valid = False
                    validation_issues.append(f"Vấn đề với {criteria_order[i]} và {criteria_order[j]}: {matrix[i][j]} * {matrix[j][i]} != 1")
        
        return {
            "status": "success",
            "stage": "stage1",
            "matrix": matrix,
            "matrix_data": matrix_data,
            "criteria_order": criteria_order,
            "criteria_count": len(criteria_order),
            "validation": {
                "is_valid": is_valid,
                "issues": validation_issues
            }
        }
        
    except Exception as e:
        print(f"ERROR stage1 - {str(e)}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Lỗi khi xây dựng ma trận so sánh: {str(e)}"
        }