from .task_manager import update_task
from .process import map_criteria_name

# Định nghĩa các bước xử lý và phần trăm tương ứng
PROCESSING_STEPS = [
    {"threshold": 10, "message": "Khởi tạo ma trận so sánh..."},
    {"threshold": 25, "message": "Tính toán vector riêng..."},
    {"threshold": 40, "message": "Chuẩn hóa các trọng số..."},
    {"threshold": 60, "message": "Tính độ nhất quán CR..."},
    {"threshold": 75, "message": "Đánh giá các tiêu chí..."},
    {"threshold": 90, "message": "Tìm kiếm laptop phù hợp..."},
    {"threshold": 100, "message": "Hoàn tất xử lý dữ liệu..."}
]

def process_with_real_api(task_id, data):
    """
    Xử lý dữ liệu thực tế từ Step 1 và Step 2
    """
    try:
        # Import các hàm cần thiết
        from Step_1.process import process_user_request_complete
        from Step_2 import filter_laptops, calculate_ahp_scores, sort_and_finalize_results, STAGE_PROGRESS
        
        # Cập nhật tiến trình bắt đầu
        update_task(task_id, progress=10, current_step="Khởi tạo ma trận so sánh...")
        
        # Chuẩn hóa tên các tiêu chí sử dụng hàm map_criteria_name
        normalized_data = data.copy()
        if "comparisons" in normalized_data:
            for comp in normalized_data["comparisons"]:
                comp["column"] = map_criteria_name(comp["column"])
                comp["row"] = map_criteria_name(comp["row"])
        
        # STEP 1: Tính toán trọng số tiêu chí
        update_task(task_id, progress=30, current_step="Tính toán trọng số tiêu chí...")
        step1_result = process_user_request_complete(normalized_data)
        
        # Kiểm tra kết quả Step 1
        if step1_result.get("status") == "error":
            update_task(
                task_id, 
                progress=100, 
                status="failed", 
                error=step1_result.get("message", "Lỗi trong quá trình tính toán trọng số"),
                result=step1_result
            )
            return
        
        # Cập nhật tiến trình Step 1 hoàn tất
        update_task(task_id, progress=50, current_step="Đã xác định trọng số các tiêu chí...")
        
        # STEP 2: Lọc danh sách laptop phù hợp
        update_task(task_id, progress=STAGE_PROGRESS["filter"], current_step="Đang lọc laptop phù hợp...")
        filter_result = filter_laptops(normalized_data, step1_result)
        
        if filter_result.get("status") == "error":
            update_task(
                task_id, 
                progress=100, 
                status="failed", 
                error=filter_result.get("message", "Lỗi trong quá trình lọc laptop"),
                result=filter_result
            )
            return
        
        # Tiếp tục với tính toán điểm AHP
        update_task(task_id, progress=STAGE_PROGRESS["score"], current_step="Đang tính điểm cho từng laptop...")
        score_result = calculate_ahp_scores(filter_result.get("filtered_laptops", []), step1_result)
        
        if score_result.get("status") == "error":
            update_task(
                task_id, 
                progress=100, 
                status="failed", 
                error=score_result.get("message", "Lỗi trong quá trình tính điểm laptop"),
                result=score_result
            )
            return
            
        # Hoàn tất kết quả
        update_task(task_id, progress=STAGE_PROGRESS["complete"]-5, current_step="Đang tổng hợp kết quả cuối cùng...")
        final_result = sort_and_finalize_results(score_result, normalized_data)
        
        # Cập nhật kết quả cuối cùng
        update_task(
            task_id,
            progress=STAGE_PROGRESS["complete"],
            status="completed",
            result=final_result,
            current_step="Đã tìm thấy laptop phù hợp nhất!"
        )
        
    except Exception as e:
        print(f"Error in process_with_real_api: {str(e)}")
        update_task(
            task_id,
            status="failed",
            error=str(e),
            progress=100
        )