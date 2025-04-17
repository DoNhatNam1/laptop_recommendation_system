import json
from pathlib import Path
from .utils import build_matrix_from_comparisons

# Thứ tự tiêu chí cố định cho hiển thị Excel và biểu đồ
ORDER_LABEL_ROW = ["Hiệu năng", "Giá thành", "Màn hình", "Thời lượng pin", "Thiết kế", "Độ bền"]
ORDER_LABEL_COL = ["Hiệu năng", "Giá thành", "Màn hình", "Thời lượng pin", "Thiết kế", "Độ bền"]

def create_matrix_from_comparisons(user_data, row_order=None, col_order=None):
    """Wrapper cho hàm build_matrix_from_comparisons"""
    if "comparisons" not in user_data:
        return None, None
    
    return build_matrix_from_comparisons(user_data["comparisons"], row_order, col_order)

def get_comparison_matrix(user_data):
    """
    Lấy ma trận so sánh từ dữ liệu người dùng
    """
    if "comparisons" in user_data and user_data["comparisons"]:
        # Nếu client gửi ma trận comparisons, sử dụng nó
        matrix, criteria_list = build_matrix_from_comparisons(
            user_data["comparisons"], 
            ORDER_LABEL_ROW, 
            ORDER_LABEL_COL
        )
        return matrix, criteria_list
    else:
        # Trường hợp không có dữ liệu
        return None, None

def get_laptop_category_info(category):
    """
    Trả về thông tin chi tiết về loại laptop
    """
    category_info = {
        "office_laptop": {
            "name": "Laptop văn phòng",
            "description": "Dành cho công việc văn phòng, học tập",
            "customer_groups": ["business_users", "students"]
        },
        "gaming_laptop": {
            "name": "Laptop gaming",
            "description": "Dành cho chơi game, giải trí",
            "customer_groups": ["hardcore_gamers", "casual_gamers"]
        },
        "design_laptop": {
            "name": "Laptop thiết kế",
            "description": "Dành cho đồ họa, thiết kế, video",
            "customer_groups": ["professional_designers", "content_creators"]
        }
    }
    return category_info.get(category, category_info["office_laptop"])

def get_all_laptop_categories():
    """
    Lấy tất cả các loại laptop
    """
    return ["office_laptop", "gaming_laptop", "design_laptop"]

def get_laptop_category(usage):
    """
    Xác định loại laptop dựa trên mục đích sử dụng
    """
    category_mapping = {
        "office": "office_laptop",
        "programming": "office_laptop",
        "gaming": "gaming_laptop",
        "design": "design_laptop",
        "video": "design_laptop",
        "mobility": "portable_laptop",
        "multitasking": "design_laptop"
    }
    return category_mapping.get(usage, "office_laptop")

def process_user_request(user_request):
    """
    Xử lý yêu cầu người dùng
    """
    if not user_request:
        return {"error": "Không có dữ liệu yêu cầu từ người dùng"}
    
    usage = user_request.get("usage")
    criteria = user_request.get("criteria", [])
    
    laptop_category = get_laptop_category(usage)
    category_info = get_laptop_category_info(laptop_category)
    
    customer_groups_info = []
    for group in category_info["customer_groups"]:
        matrix, criteria_order = get_criteria_weights_by_customer_group(laptop_category, group)
        customer_groups_info.append({
            "key": group,
            "criteria_order": criteria_order
        })
    
    result = {
        "user_preferences": user_request,
        "determined_category": {
            "key": laptop_category,
            "name": category_info["name"],
            "customer_groups": customer_groups_info
        }
    }
    
    return result

def determine_laptop_category_and_customer_group(user_data):
    """
    Trả về mục đích sử dụng laptop và loại khách hàng
    """
    laptop_category = "office_laptop"
    customer_group = "business_users"
    
    if "usage" in user_data:
        usage = user_data["usage"]
        if usage == "gaming":
            laptop_category = "gaming_laptop"
            customer_group = "hardcore_gamers"
        elif usage == "design":
            laptop_category = "design_laptop"
            customer_group = "professional_designers"
    
    return laptop_category, customer_group

def get_criteria_weights_by_customer_group(laptop_category, customer_group):
    """
    Giả lập hàm get_criteria_weights_by_customer_group để tương thích với code cũ
    """
    criteria = ORDER_LABEL_ROW
    return [[1 for _ in range(len(criteria))] for _ in range(len(criteria))], criteria