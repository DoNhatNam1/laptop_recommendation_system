from .usage_classifier import get_comparison_matrix

def initialize_step1(user_data):
    """
    Khởi tạo quá trình AHP bước 1
    """
    matrix, criteria_list = get_comparison_matrix(user_data)
    
    if matrix is None:
        return None, None, "Không thể tạo ma trận từ dữ liệu người dùng"
    
    return matrix, criteria_list, None

def normalize_user_data(user_data):
    """
    Chuẩn hóa dữ liệu người dùng
    """
    # Cơ bản trả về dữ liệu đầu vào, có thể thêm xử lý chuẩn hóa sau
    return user_data

def extract_matrix_from_comparisons(comparisons):
    """
    Xây dựng ma trận từ danh sách comparisons đã chuẩn hóa
    """
    # Tìm tất cả các tiêu chí duy nhất từ comparisons
    criteria = set()
    for comp in comparisons:
        criteria.add(comp["row"])
        criteria.add(comp["column"])
    
    # Sắp xếp để đảm bảo thứ tự nhất quán
    criteria_list = sorted(list(criteria))
    criteria_to_index = {criterion: i for i, criterion in enumerate(criteria_list)}
    
    # Tạo ma trận với kích thước phù hợp
    n = len(criteria_list)
    matrix = [[0 for _ in range(n)] for _ in range(n)]
    
    # Điền giá trị vào ma trận
    for comp in comparisons:
        row_criterion = comp["row"]
        col_criterion = comp["column"]
        value = comp["value"]
        
        row_idx = criteria_to_index[row_criterion]
        col_idx = criteria_to_index[col_criterion]
        matrix[row_idx][col_idx] = value
    
    # Kiểm tra và hoàn thiện ma trận
    for i in range(n):
        if matrix[i][i] == 0:  # Đảm bảo đường chéo là 1
            matrix[i][i] = 1
    
    # Đảm bảo tính đối xứng nghịch đảo
    for i in range(n):
        for j in range(n):
            if i != j:  # Bỏ qua đường chéo
                if matrix[i][j] != 0 and matrix[j][i] == 0:
                    matrix[j][i] = 1 / matrix[i][j]
    
    return matrix, criteria_list

def process_user_request(user_request):
    """
    Xử lý yêu cầu người dùng để xác định ma trận AHP
    """
    if not user_request:
        return None, None, "Thiếu dữ liệu yêu cầu"
    
    try:
        if "comparisons" in user_request:
            # Sử dụng ma trận do người dùng cung cấp
            matrix, criteria_order = extract_matrix_from_comparisons(user_request["comparisons"])
            return matrix, criteria_order, None
        else:
            # Không có ma trận comparisons
            return None, None, "Thiếu ma trận comparisons trong yêu cầu"
    except Exception as e:
        return None, None, f"Lỗi xử lý yêu cầu: {str(e)}"