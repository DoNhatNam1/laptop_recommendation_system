# Import từ stage1 - thứ tự tiêu chí cố định
from .stage1 import ORDER_LABEL_ROW, ORDER_LABEL_COL, get_comparison_matrix

# Import các giai đoạn (stages)
from .stage1 import process_user_request_stage1
from .stage2 import process_user_request_stage2
from .stage3 import process_user_request_stage3
from .stage4 import process_user_request_stage4
from .stage5 import process_user_request_stage5
from .stage6 import process_user_request_stage6
from .stage7 import process_user_request_stage7
from .stage8 import process_user_request_stage8

# Import các function tiện ích
from .utils import (
    build_matrix_from_comparisons,
    calculate_matrix_column_sums,
    normalize_matrix,
    calculate_criteria_weights,
    calculate_consistency_ratio,
    calculate_consistency_vector,
    calculate_lambda_max,
    calculate_consistency_index,
    get_random_index,
    calculate_all_consistency_metrics
)

# Alias cho giai đoạn cuối - Khi cần kết quả đầy đủ cuối cùng
process_user_request_complete = process_user_request_stage8

# Thêm hỗ trợ cho phân loại sử dụng laptop
def get_laptop_category(user_data):
    """Xác định loại laptop dựa trên dữ liệu người dùng"""
    # Lấy thông tin từ user_data để xác định loại laptop
    # Có thể dựa vào trọng số tiêu chí và các thông số khác
    usage = user_data.get("usage", "office")
    
    # Đơn giản, gán trực tiếp từ usage
    laptop_categories = {
        "office": "văn phòng",
        "gaming": "gaming",
        "design": "thiết kế đồ họa",
        "portable": "di động"
    }
    
    return laptop_categories.get(usage, "văn phòng")

# Các hàm được cung cấp cho các module khác
__all__ = [
    # Hằng số
    'ORDER_LABEL_ROW',
    'ORDER_LABEL_COL',
    
    # API các giai đoạn
    'process_user_request_stage1',
    'process_user_request_stage2',
    'process_user_request_stage3',
    'process_user_request_stage4',
    'process_user_request_stage5',
    'process_user_request_stage6',
    'process_user_request_stage7',
    'process_user_request_stage8',
    'process_user_request_complete',
    
    # Chức năng xây dựng ma trận và phân loại
    'get_comparison_matrix',
    'get_laptop_category',
    'build_matrix_from_comparisons',
    
    # Các hàm tiện ích
    'calculate_matrix_column_sums',
    'normalize_matrix',
    'calculate_criteria_weights',
    'calculate_consistency_ratio',
    'calculate_consistency_vector',
    'calculate_lambda_max',
    'calculate_consistency_index',
    'get_random_index',
    'calculate_all_consistency_metrics'
]