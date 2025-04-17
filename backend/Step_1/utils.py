import numpy as np

def build_matrix_from_comparisons(comparisons, row_order=None, col_order=None):
    """Xây dựng ma trận từ các so sánh cặp, hỗ trợ ma trận kích thước động"""
    # Trích xuất tất cả các tiêu chí độc nhất từ comparisons
    criteria = set()
    for comparison in comparisons:
        criteria.add(comparison["row"])
        criteria.add(comparison["column"])
    
    criteria = list(criteria)
    
    # Sắp xếp lại theo thứ tự được chỉ định nếu có
    if row_order:
        ordered_criteria = [c for c in row_order if c in criteria]
        # Thêm các tiêu chí chưa có trong order
        for c in criteria:
            if c not in ordered_criteria:
                ordered_criteria.append(c)
        criteria = ordered_criteria
    
    n = len(criteria)
    matrix = [[1.0 for _ in range(n)] for _ in range(n)]
    
    # Xây dựng dictionary ánh xạ tên tiêu chí đến chỉ số
    criteria_index = {criteria[i]: i for i in range(n)}
    
    # Điền các giá trị vào ma trận
    for comparison in comparisons:
        row_idx = criteria_index[comparison["row"]]
        col_idx = criteria_index[comparison["column"]]
        
        value = comparison["value"]
        # Xử lý giá trị phân số (nếu có)
        if isinstance(value, str) and "/" in value:
            num, denom = map(float, value.split("/"))
            value = num / denom
        else:
            value = float(value)
        
        matrix[row_idx][col_idx] = value
        matrix[col_idx][row_idx] = 1.0 / value
    
    return matrix, criteria

def calculate_matrix_column_sums(matrix):
    """Tính tổng cột cho ma trận"""
    col_sums = [0] * len(matrix[0])
    for j in range(len(matrix[0])):
        for i in range(len(matrix)):
            col_sums[j] += matrix[i][j]
    return col_sums

def normalize_matrix(matrix):
    """Chuẩn hóa ma trận dựa trên tổng cột"""
    col_sums = calculate_matrix_column_sums(matrix)
    n = len(matrix)
    normalized = [[0] * n for _ in range(n)]
    
    for i in range(n):
        for j in range(n):
            normalized[i][j] = matrix[i][j] / col_sums[j]
    
    return normalized

def calculate_criteria_weights(normalized_matrix):
    """Tính trọng số các tiêu chí bằng trung bình hàng của ma trận chuẩn hóa"""
    n = len(normalized_matrix)
    weights = [0] * n
    
    for i in range(n):
        row_sum = sum(normalized_matrix[i])
        weights[i] = row_sum / n
    
    return weights

def calculate_consistency_vector(matrix, weights):
    """Tính vector nhất quán λ"""
    n = len(matrix)
    weighted_sum = [0] * n
    
    # Nhân ma trận với vector trọng số
    for i in range(n):
        for j in range(n):
            weighted_sum[i] += matrix[i][j] * weights[j]
    
    # Chia weighted_sum cho trọng số tương ứng
    consistency_vector = [weighted_sum[i] / weights[i] if weights[i] != 0 else 0 for i in range(n)]
    
    return consistency_vector

def calculate_lambda_max(consistency_vector):
    """Tính giá trị riêng lớn nhất λmax"""
    return sum(consistency_vector) / len(consistency_vector) if consistency_vector else 0

def calculate_consistency_index(lambda_max, n):
    """Tính Consistency Index (CI)"""
    return (lambda_max - n) / (n - 1) if n > 1 else 0

def get_random_index(n):
    """Lấy chỉ số ngẫu nhiên (RI) dựa trên kích thước ma trận"""
    random_indices = {
        1: 0.00, 2: 0.00, 3: 0.58, 4: 0.90, 5: 1.12,
        6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49
    }
    return random_indices.get(n, 1.50)  # Giá trị mặc định là 1.50 cho n > 10

def calculate_consistency_ratio(matrix):
    """Tính Consistency Ratio (CR)"""
    n = len(matrix)
    
    # Xử lý trường hợp đặc biệt
    if n <= 2:
        return 0  # Ma trận 1x1 hoặc 2x2 luôn nhất quán
        
    normalized_matrix = normalize_matrix(matrix)
    weights = calculate_criteria_weights(normalized_matrix)
    consistency_vector = calculate_consistency_vector(matrix, weights)
    lambda_max = calculate_lambda_max(consistency_vector)
    ci = calculate_consistency_index(lambda_max, n)
    ri = get_random_index(n)
    
    if ri == 0:
        return 0
    
    return ci / ri

def calculate_all_consistency_metrics(matrix):
    """Tính tất cả các chỉ số nhất quán"""
    n = len(matrix)
    
    # Xử lý ma trận 1x1 hoặc 2x2 (luôn nhất quán)
    if n <= 2:
        return {
            "lambda_max": n,
            "CI": 0,
            "RI": 0,
            "CR": 0,
            "is_consistent": True
        }
    
    normalized_matrix = normalize_matrix(matrix)
    weights = calculate_criteria_weights(normalized_matrix)
    consistency_vector = calculate_consistency_vector(matrix, weights)
    lambda_max = calculate_lambda_max(consistency_vector)
    ci = calculate_consistency_index(lambda_max, n)
    ri = get_random_index(n)
    cr = ci / ri if ri > 0 else 0
    
    return {
        "lambda_max": lambda_max,
        "CI": ci,
        "RI": ri,
        "CR": cr,
        "is_consistent": cr < 0.1
    }