from flask import Flask, request, jsonify
from flask_cors import CORS
from flask.json.provider import DefaultJSONProvider
import json
import os
from collections import defaultdict
from Step_1.process import (
    process_user_request_stage1,
    process_user_request_stage2,
    process_user_request_stage3,
    process_user_request_stage4,
    process_user_request_complete,
    process_user_request_stage5,
    process_user_request_stage6,
    process_user_request_stage7,
    process_user_request_stage8
)
from Step_2.stage1 import filter_laptops, initialize_database, get_db_connection
from Step_2.stage2 import build_comparison_matrices
from Step_2.stage3 import calculate_criteria_totals
from Step_2.stage4 import normalize_comparison_matrices
from Step_2.stage5 import calculate_priority_vectors
from Step_2.stage6 import synthesize_priorities
from Step_2.stage7 import calculate_consistency_vectors  
from Step_2.stage8 import check_consistency 
from Step_2.stage9 import rank_laptops
from Step_1.process import calculate_weights
import uuid
import threading
import logging
import traceback
from typing import Dict, Any

# Tạo custom JSON provider class thay cho custom JSON encoder
class CustomJSONProvider(DefaultJSONProvider):
    def dumps(self, obj, **kwargs):
        kwargs.setdefault('ensure_ascii', False)  # Đảm bảo hỗ trợ Unicode
        return super().dumps(obj, **kwargs)

    def default(self, obj):
        try:
            return super().default(obj)
        except TypeError:
            return str(obj)
        
host = os.environ.get('HOST', '0.0.0.0')
port = int(os.environ.get('PORT', 5000))
flask_env = os.environ.get('FLASK_ENV', 'production')
debug_mode = flask_env != 'production'

# Khởi tạo Flask app với cấu hình JSON đúng
app = Flask(__name__)

# Đặt JSON provider class mới (phương pháp được khuyến nghị từ Flask 2.2+)
app.json = CustomJSONProvider(app)

# Đặt MIME type với UTF-8
app.config['JSONIFY_MIMETYPE'] = 'application/json; charset=utf-8'

# Cấu hình CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})

db_host = os.environ.get('POSTGRES_HOST', 'postgres')
db_port = os.environ.get('POSTGRES_PORT', '5432')
db_name = os.environ.get('POSTGRES_DB', 'laptop_db')
db_user = os.environ.get('POSTGRES_USER', 'admin')
db_password = os.environ.get('POSTGRES_PASSWORD', 'secure_password')

db_uri = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

# Cấu hình ứng dụng
app.config.update(
    SECRET_KEY=os.environ.get('SECRET_KEY', 'default-secret-key'),
    JSONIFY_PRETTYPRINT_REGULAR=True,
    SQLALCHEMY_DATABASE_URI=db_uri,  # Nếu sử dụng SQLAlchemy
    SQLALCHEMY_TRACK_MODIFICATIONS=False  # Nếu sử dụng SQLAlchemy
)

# Định nghĩa đường dẫn đến file log
log_file = 'laptop_recommendation.log'

# Thiết lập logging
logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Dictionary lưu trạng thái và kết quả của các task
processing_tasks = {}

# Cập nhật hàm trả về JSON để đảm bảo UTF-8
def custom_jsonify(data):
    """Hàm trả về JSON với header đúng và xử lý encoding"""
    response = jsonify(data)
    response.headers['Content-Type'] = 'application/json; charset=utf-8'
    return response

def process_comparisons_task(task_id: str, data: Dict[str, Any]):
    """
    Hàm xử lý quy trình đánh giá laptop trong một thread riêng
    """
    try:
        # Cập nhật trạng thái
        processing_tasks[task_id]["status"] = "processing"
        processing_tasks[task_id]["progress"] = 5
        
        # Step 1: Tính trọng số tiêu chí
        print("=== Bắt đầu Step 1: Tính trọng số tiêu chí ===")
        step1_result = process_user_request_complete(data)
        processing_tasks[task_id]["progress"] = 20
        
        # Kiểm tra CR của ma trận tiêu chí - Tìm kiếm cả ở cấp cao nhất và trong "consistency"
        cr_value = None
        if 'CR' in step1_result:
            cr_value = step1_result['CR']
        elif 'consistency' in step1_result and 'CR' in step1_result['consistency']:
            cr_value = step1_result['consistency']['CR']
        
        if cr_value is not None and cr_value > 0.1:
            # Đánh dấu lỗi và dừng xử lý
            processing_tasks[task_id]["status"] = "error"
            processing_tasks[task_id]["message"] = (
                f"Ma trận tiêu chí không nhất quán (CR = {cr_value:.3f} > 0.1). "
                "Vui lòng điều chỉnh lại đánh giá các tiêu chí."
            )
            processing_tasks[task_id]["progress"] = 50  # Dừng ở 50% thay vì 100%
            processing_tasks[task_id]["error_type"] = "inconsistent_matrix"
            processing_tasks[task_id]["error_details"] = {
                "CR": cr_value,
                "threshold": 0.1,
                "step": "Step_1"
            }
            return  # Dừng xử lý ngay tại đây, không tiếp tục Step_2
        
        # Lưu kết quả trọng số tiêu chí
        criteria_weights = {}
        if "weights" in step1_result and "formatted" in step1_result["weights"]:
            for item in step1_result["weights"]["formatted"]:
                criteria_weights[item["criterion"]] = item["weight"]
        
        processing_tasks[task_id]["progress"] = 30
        
        # Tiếp tục với Step 2 nếu CR hợp lệ
        print("=== Bắt đầu Step 2: Đánh giá laptop ===")
        
        # Step 2 - Stage 1: Lọc laptop
        print("=== Bắt đầu Step 2 - Stage 1: Lọc laptop ===")
        stage1_result = filter_laptops(data, {'weights': criteria_weights})
        processing_tasks[task_id]["progress"] = 40
        
        if stage1_result.get('status') != "success":
            processing_tasks[task_id]["status"] = "error"
            processing_tasks[task_id]["message"] = f"Không tìm thấy laptop phù hợp. {stage1_result.get('message', '')}"
            processing_tasks[task_id]["progress"] = 100
            return
        
        # Step 2 - Stage 2: Xây dựng ma trận so sánh
        print("=== Bắt đầu Step 2 - Stage 2: Xây dựng ma trận so sánh ===")
        matrices_result = build_comparison_matrices(stage1_result, criteria_weights)
        processing_tasks[task_id]["progress"] = 50
        
        if matrices_result.get('status') != "success":
            processing_tasks[task_id]["status"] = "error" 
            processing_tasks[task_id]["message"] = "Không thể tạo ma trận so sánh"
            processing_tasks[task_id]["progress"] = 100
            return
        
        # Step 2 - Stage 3: Tính tổng điểm tiêu chí
        print("=== Bắt đầu Step 2 - Stage 3: Tính tổng điểm tiêu chí ===")
        stage3_result = calculate_criteria_totals(matrices_result, criteria_weights)
        stage3_result["step1_weights"] = {
            "title": "Trọng số các tiêu chí (từ Step 1)",
            "values": criteria_weights
        }
        processing_tasks[task_id]["progress"] = 60
        
        # Step 2 - Stage 4: Chuẩn hóa ma trận
        print("=== Bắt đầu Step 2 - Stage 4: Chuẩn hóa ma trận ===")
        stage4_result = normalize_comparison_matrices(stage3_result)
        processing_tasks[task_id]["progress"] = 70
        
        # Step 2 - Stage 5: Tính vector ưu tiên
        print("=== Bắt đầu Step 2 - Stage 5: Tính vector ưu tiên ===")
        stage5_result = calculate_priority_vectors(stage4_result)
        processing_tasks[task_id]["progress"] = 75
        
        # Step 2 - Stage 6: Tổng hợp ưu tiên
        print("=== Bắt đầu Step 2 - Stage 6: Tổng hợp ưu tiên ===")
        stage6_result = synthesize_priorities(stage5_result)
        processing_tasks[task_id]["progress"] = 80
        
        # Step 2 - Stage 7: Tính vector nhất quán
        print("=== Bắt đầu Step 2 - Stage 7: Tính vector nhất quán ===")
        stage7_result = calculate_consistency_vectors(stage6_result, matrices_result)
        processing_tasks[task_id]["progress"] = 85
        
        # Step 2 - Stage 8: Kiểm tra tính nhất quán
        print("=== Bắt đầu Step 2 - Stage 8: Kiểm tra tính nhất quán ===")
        stage8_result = check_consistency(stage7_result, matrices_result)
        
        # Kiểm tra kết quả từ stage8
        if stage8_result.get("status") == "error":
            processing_tasks[task_id]["status"] = "error"
            processing_tasks[task_id]["message"] = stage8_result.get("message", "Lỗi kiểm tra tính nhất quán")
            processing_tasks[task_id]["progress"] = 100
            return
            
        processing_tasks[task_id]["progress"] = 90
        
        # Step 2 - Stage 9: Xếp hạng laptop
        print("=== Bắt đầu Step 2 - Stage 9: Xếp hạng laptop ===")
        final_result = rank_laptops(stage8_result)
        
        # Cập nhật kết quả cuối cùng
        if final_result.get("status") == "error":
            processing_tasks[task_id]["status"] = "error"
            processing_tasks[task_id]["message"] = final_result.get("message", "Lỗi không xác định")
        else:
            processing_tasks[task_id]["status"] = "completed"
            processing_tasks[task_id]["result"] = final_result
        
        processing_tasks[task_id]["progress"] = 100
        
    except Exception as e:
        error_msg = f"Lỗi khi thực hiện quy trình: {str(e)}"
        print(error_msg)
        print(traceback.format_exc())
        
        processing_tasks[task_id]["status"] = "error"
        processing_tasks[task_id]["message"] = error_msg
        processing_tasks[task_id]["progress"] = 100

@app.route('/api/status')
def status():
    return jsonify({"status": "ok", "service": "backend"})

@app.route('/api/migration-status', methods=['GET'])
def migration_status():
    """Check if database is properly migrated"""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Kiểm tra xem bảng laptops có tồn tại không
            cursor.execute("""
                SELECT EXISTS (
                   SELECT FROM information_schema.tables 
                   WHERE table_name = 'laptops'
                );
            """)
            table_exists = cursor.fetchone()[0]
            
            # Đếm số lượng laptop
            if table_exists:
                cursor.execute("SELECT COUNT(*) FROM laptops")
                count = cursor.fetchone()[0]
                
                return jsonify({
                    "status": "success",
                    "database_ready": True,
                    "table_exists": True,
                    "laptop_count": count
                })
            else:
                return jsonify({
                    "status": "warning",
                    "database_ready": False,
                    "table_exists": False,
                    "laptop_count": 0
                })
    except Exception as e:
        return jsonify({
            "status": "error",
            "database_ready": False,
            "error": str(e)
        }), 500

@app.route('/api/process-comparisons', methods=['POST'])
def process_comparisons():
    """API endpoint để xử lý toàn bộ quy trình đánh giá laptop"""
    try:
        # Tạo task ID
        task_id = str(uuid.uuid4())
        
        # Lấy dữ liệu từ request
        data = request.json
        
        # Khởi tạo task
        processing_tasks[task_id] = {
            "status": "pending",
            "progress": 0,
            "message": "Đang khởi tạo quy trình đánh giá",
            "result": None
        }
        
        # Bắt đầu quy trình xử lý trong thread riêng
        thread = threading.Thread(target=process_comparisons_task, args=(task_id, data))
        thread.start()
        
        # Trả về task ID để client có thể kiểm tra tiến độ
        return custom_jsonify({
            "status": "pending",
            "message": "Quy trình đánh giá đã được bắt đầu",
            "taskId": task_id
        })
        
    except Exception as e:
        print(f"Exception in process_comparisons: {str(e)}")
        return custom_jsonify({
            "status": "error",
            "message": f"Lỗi khi bắt đầu quy trình: {str(e)}"
        }), 500

@app.route('/api/processing-status/<task_id>', methods=['GET'])
def get_processing_status(task_id):
    """Lấy trạng thái xử lý của một task"""
    if task_id not in processing_tasks:
        return jsonify({
            "status": "not_found",
            "message": "Không tìm thấy task với ID này"
        }), 404
    
    task = processing_tasks[task_id]
    response = {
        "status": task["status"],
        "progress": task["progress"],
        "message": task.get("message", "Đang xử lý...")
    }
    
    # Thêm thông tin lỗi nếu có
    if task["status"] == "error" and "error_type" in task:
        response["error_type"] = task["error_type"]
        response["error_details"] = task.get("error_details", {})
    
    return jsonify(response)

@app.route('/api/processing-result/<task_id>', methods=['GET'])
def get_processing_result(task_id):
    """Lấy kết quả xử lý của một task"""
    if task_id not in processing_tasks:
        return jsonify({
            "status": "not_found",
            "message": "Không tìm thấy task với ID này"
        }), 404
    
    task = processing_tasks[task_id]
    
    # Kiểm tra nếu task lỗi, trả về thông báo lỗi
    if task["status"] == "error":
        return jsonify({
            "status": "error",
            "message": task.get("message", "Có lỗi xảy ra trong quá trình xử lý"),
            "error_type": task.get("error_type", "unknown_error"),
            "error_details": task.get("error_details", {})
        }), 400
    
    # Kiểm tra nếu task chưa hoàn thành
    if task["status"] != "completed":
        return jsonify({
            "status": "pending",
            "message": "Task đang được xử lý, chưa có kết quả"
        }), 202
    
    # Trả về kết quả nếu có
    if "result" in task:
        return jsonify(task["result"])
    else:
        return jsonify({
            "status": "no_result",
            "message": "Task hoàn thành nhưng không có kết quả"
        }), 204

# API endpoints cho Step 1
@app.route('/api/test-step1-stage1', methods=['POST'])
def test_step1_stage1():
    data = request.json
    result = process_user_request_stage1(data)
    return custom_jsonify(result)

@app.route('/api/test-step1-stage2', methods=['POST']) 
def test_step1_stage2():
    data = request.json
    result = process_user_request_stage2(data)
    return custom_jsonify(result)

@app.route('/api/test-step1-stage3', methods=['POST'])
def test_step1_stage3():
    data = request.json
    result = process_user_request_stage3(data)
    return custom_jsonify(result)

@app.route('/api/test-step1-stage4', methods=['POST'])
def test_step1_stage4():
    data = request.json
    result = process_user_request_stage4(data)
    return custom_jsonify(result)

@app.route('/api/test-step1-stage5', methods=['POST'])
def test_step1_stage5():
    data = request.json
    result = process_user_request_stage5(data)
    return custom_jsonify(result)

@app.route('/api/test-step1-stage6', methods=['POST'])
def test_step1_stage6():
    data = request.json
    result = process_user_request_stage6(data)
    return custom_jsonify(result)

@app.route('/api/test-step1-stage7', methods=['POST'])
def test_step1_stage7():
    data = request.json
    result = process_user_request_stage7(data)
    return custom_jsonify(result)

@app.route('/api/test-step1-stage8', methods=['POST'])
def test_step1_stage8():
    data = request.json
    result = process_user_request_stage8(data)
    return custom_jsonify(result)

@app.route('/api/test/test-step2-stage1', methods=['POST'])
def test_filter_only():
    """API endpoint để test riêng chức năng lọc laptop (Stage 1 của Step 2)"""
    try:
        # Lấy dữ liệu từ request
        data = request.json
        
        print("Bắt đầu xử lý Step 1...")
        # Tính trọng số AHP từ dữ liệu so sánh cặp
        step1_result = process_user_request_complete(data)
        
        # Chuyển đổi trọng số từ định dạng Step 1 sang định dạng dictionary đơn giản
        formatted_weights = {}
        if 'weights' in step1_result:
            # Thử trích xuất từ định dạng formatted trước
            if 'formatted' in step1_result['weights']:
                for item in step1_result['weights']['formatted']:
                    formatted_weights[item['criterion']] = item['weight']
            # Nếu không có formatted, sử dụng các khóa trực tiếp
            else:
                formatted_weights = step1_result['weights']
        
        print("Bắt đầu xử lý Stage 1 (Lọc laptop)...")
        # Lọc laptop dựa trên tiêu chí đã chọn
        stage1_result = filter_laptops(data, {'weights': formatted_weights})
        
        # Trả về kết quả lọc laptop với cấu trúc rõ ràng hơn
        return custom_jsonify({
            "status": "success",
            "step1_weights": {
                "title": "Trọng số các tiêu chí (từ Step 1)",
                "values": formatted_weights,
                "description": "Trọng số này được tính từ ma trận so sánh cặp ở Step 1"
            },
            "step2_stage1": {
                "filters_applied": stage1_result.get('filters_applied', {}),
                "filtered_laptops_count": len(stage1_result.get('filtered_laptops', [])),
                "status": stage1_result.get('status', "unknown")
            },
            "filtered_laptops": stage1_result.get('filtered_laptops', [])
        })
        
    except Exception as e:
        import traceback
        print(f"Exception in filter-only: {str(e)}")
        print(traceback.format_exc())
        return custom_jsonify({
            "status": "error",
            "message": f"Lỗi khi lọc laptop: {str(e)}"
        }), 500


@app.route('/api/test-step2-stage2', methods=['POST'])
def test_step2_stage2():
    """API endpoint để test Stage 2 của Step 2 (xây dựng ma trận so sánh)"""
    try:
        # Lấy dữ liệu từ request
        data = request.json
        
        print("=== Bắt đầu Step 1: Tính trọng số tiêu chí ===")
        weights_result = calculate_weights(data.get("comparisons", []))
        
        print("=== Bắt đầu Step 2 - Stage 1: Lọc laptop ===")
        filtered_result = filter_laptops(data, weights_result)
        
        if filtered_result.get('status') != "success":
            return custom_jsonify(filtered_result)
            
        print("=== Bắt đầu Step 2 - Stage 2: Xây dựng ma trận so sánh ===")
        matrices_result = build_comparison_matrices(filtered_result, weights_result.get("weights", {}))
        
        # Tạo kết quả tối ưu với title
        optimized_result = {
            "status": matrices_result.get("status", "error"),
            "title": "Ma trận so sánh laptop (Comparison Matrices)",
            "criteria_count": len(matrices_result.get("criteria", [])),
            "laptop_count": len(matrices_result.get("laptop_ids", [])),
            "criteria": matrices_result.get("criteria", [])
        }
        
        # Thêm tên laptop để dễ theo dõi
        laptop_names = {}
        for laptop_id, details in matrices_result.get("laptop_details", {}).items():
            laptop_names[laptop_id] = details.get("name", f"Laptop {laptop_id}")
        
        optimized_result["laptop_names"] = laptop_names
        
        # Thêm mẫu ma trận cho tiêu chí đầu tiên
        first_criterion = matrices_result.get("criteria", [""])[0] if matrices_result.get("criteria") else ""
        
        if first_criterion and first_criterion in matrices_result.get("matrices", {}):
            optimized_result["sample_matrix"] = {
                "criterion": first_criterion,
                "matrix": matrices_result.get("matrices", {}).get(first_criterion, [])
            }
        
        return custom_jsonify(optimized_result)
        
    except Exception as e:
        import traceback
        print(f"Test Stage 2 Exception: {str(e)}")
        print(traceback.format_exc())
        return custom_jsonify({"status": "error", "message": f"Lỗi khi thực hiện quy trình: {str(e)}"})

@app.route('/api/test-step2-stage3', methods=['POST'])
def test_step2_stage3():
    """API endpoint để test Stage 3 của Step 2 (tính tổng điểm tiêu chí)"""
    try:
        # Lấy dữ liệu từ request
        data = request.json
        
        print("=== Bắt đầu Step 1: Tính trọng số tiêu chí ===")
        weights_result = calculate_weights(data.get("comparisons", []))
        
        print("=== Bắt đầu Step 2 - Stage 1: Lọc laptop ===")
        filtered_result = filter_laptops(data, weights_result)
            
        print("=== Bắt đầu Step 2 - Stage 2: Xây dựng ma trận so sánh ===")
        matrices_result = build_comparison_matrices(filtered_result, weights_result.get("weights", {}))
        
        print("=== Bắt đầu Step 2 - Stage 3: Tính tổng điểm tiêu chí ===")
        stage3_result = calculate_criteria_totals(matrices_result, weights_result.get("weights", {}))
        
        # Thêm step1_weights vào kết quả
        step1_weights = {
            "title": "Trọng số các tiêu chí (từ Step 1)",
            "values": weights_result.get("weights", {})
        }
        
        # Tạo kết quả tối ưu với title
        optimized_result = {
            "status": stage3_result.get("status", "error"),
            "title": "Tổng điểm theo tiêu chí (Criteria Totals)",
            "criteria_weights": step1_weights,
            "criteria_totals": {}
        }
        
        # Lấy thông tin tổng điểm theo tiêu chí
        for criterion, data in stage3_result.get("criteria_totals", {}).items():
            optimized_result["criteria_totals"][criterion] = {
                "weight": data.get("weight", 0),
                "column_sums": data.get("column_sums", {})
            }
        
        return custom_jsonify(optimized_result)
        
    except Exception as e:
        import traceback
        print(f"Test Stage 3 Exception: {str(e)}")
        print(traceback.format_exc())
        return custom_jsonify({"status": "error", "message": f"Lỗi khi thực hiện quy trình: {str(e)}"})

@app.route('/api/test-step2-stage4', methods=['POST'])
def test_step2_stage4():
    """API endpoint để test Stage 4 của Step 2 (chuẩn hóa ma trận)"""
    try:
        data = request.json
        
        # Chạy các stage trước
        weights_result = calculate_weights(data.get("comparisons", []))
        filtered_result = filter_laptops(data, weights_result)
        matrices_result = build_comparison_matrices(filtered_result, weights_result.get("weights", {}))
        stage3_result = calculate_criteria_totals(matrices_result, weights_result.get("weights", {}))
        
        # Thêm step1_weights vào kết quả
        stage3_result["step1_weights"] = {
            "title": "Trọng số các tiêu chí (từ Step 1)",
            "values": weights_result.get("weights", {})
        }
        
        print("=== Bắt đầu Step 2 - Stage 4: Chuẩn hóa ma trận ===")
        stage4_result = normalize_comparison_matrices(stage3_result)
        
        # Tạo kết quả tối ưu với title
        optimized_result = {
            "status": stage4_result.get("status", "error"),
            "title": "Ma trận chuẩn hóa (Normalized Matrices)",
            "criteria_weights": stage4_result.get("step1_weights", {}),
            "normalized_matrices": {}
        }
        
        # Chọn thông tin cần thiết từ normalized_matrices
        for criterion, scores in stage4_result.get("normalized_matrices", {}).items():
            optimized_result["normalized_matrices"][criterion] = {}
            
            for laptop_name, data in scores.items():
                optimized_result["normalized_matrices"][criterion][laptop_name] = {
                    "normalized_priority": data.get("normalized_priority", 0),
                    "weighted_score": data.get("weighted_score", 0)
                }
        
        return custom_jsonify(optimized_result)
        
    except Exception as e:
        import traceback
        print(f"Test Stage 4 Exception: {str(e)}")
        print(traceback.format_exc())
        return custom_jsonify({"status": "error", "message": f"Lỗi khi thực hiện quy trình: {str(e)}"})

@app.route('/api/test-step2-stage5', methods=['POST'])
def test_step2_stage5():
    """API endpoint để test Stage 5 của Step 2 (tính vector ưu tiên)"""
    try:
        data = request.json
        
        # Chạy các stage trước
        weights_result = calculate_weights(data.get("comparisons", []))
        filtered_result = filter_laptops(data, weights_result)
        matrices_result = build_comparison_matrices(filtered_result, weights_result.get("weights", {}))
        stage3_result = calculate_criteria_totals(matrices_result, weights_result.get("weights", {}))
        stage3_result["step1_weights"] = {
            "title": "Trọng số các tiêu chí (từ Step 1)",
            "values": weights_result.get("weights", {})
        }
        stage4_result = normalize_comparison_matrices(stage3_result)
        
        print("=== Bắt đầu Step 2 - Stage 5: Tính vector ưu tiên ===")
        stage5_result = calculate_priority_vectors(stage4_result)
        
        # Tạo kết quả tối ưu với title
        optimized_result = {
            "status": stage5_result.get("status", "error"),
            "title": "Vector ưu tiên (Priority Vectors)",
            "criteria_weights": stage5_result.get("step1_weights", {}),
            "priority_vectors": stage5_result.get("priority_vectors", {})
        }
        
        return custom_jsonify(optimized_result)
        
    except Exception as e:
        import traceback
        print(f"Test Stage 5 Exception: {str(e)}")
        print(traceback.format_exc())
        return custom_jsonify({"status": "error", "message": f"Lỗi khi thực hiện quy trình: {str(e)}"})

@app.route('/api/test-step2-stage6', methods=['POST'])
def test_step2_stage6():
    """API endpoint để test Stage 6 của Step 2 (tổng hợp ưu tiên)"""
    try:
        data = request.json
        
        # Chạy các stage trước
        weights_result = calculate_weights(data.get("comparisons", []))
        filtered_result = filter_laptops(data, weights_result)
        matrices_result = build_comparison_matrices(filtered_result, weights_result.get("weights", {}))
        stage3_result = calculate_criteria_totals(matrices_result, weights_result.get("weights", {}))
        stage3_result["step1_weights"] = {
            "title": "Trọng số các tiêu chí (từ Step 1)",
            "values": weights_result.get("weights", {})
        }
        stage4_result = normalize_comparison_matrices(stage3_result)
        stage5_result = calculate_priority_vectors(stage4_result)
        
        print("=== Bắt đầu Step 2 - Stage 6: Tổng hợp ưu tiên ===")
        stage6_result = synthesize_priorities(stage5_result)
        
        # Tạo kết quả tối ưu với title
        optimized_result = {
            "status": stage6_result.get("status", "error"),
            "title": "Tổng hợp ưu tiên (Synthesized Priorities)",
            "criteria_weights": stage6_result.get("step1_weights", {}),
            "synthesized_scores": {}
        }
        
        # Hiển thị điểm tổng hợp theo thứ tự giảm dần
        sorted_laptops = sorted(
            stage6_result.get("synthesized_scores", {}).items(),
            key=lambda x: x[1]["total_score"], 
            reverse=True
        )
        
        for laptop_name, data in sorted_laptops:
            optimized_result["synthesized_scores"][laptop_name] = {
                "total_score": round(data.get("total_score", 0), 4),
                "criteria_scores": {
                    criterion: round(score, 4) 
                    for criterion, score in data.get("criteria_scores", {}).items()
                }
            }
        
        return custom_jsonify(optimized_result)
        
    except Exception as e:
        import traceback
        print(f"Test Stage 6 Exception: {str(e)}")
        print(traceback.format_exc())
        return custom_jsonify({"status": "error", "message": f"Lỗi khi thực hiện quy trình: {str(e)}"})

@app.route('/api/test-step2-stage7', methods=['POST'])
def test_step2_stage7():
    """API endpoint để test Stage 7 của Step 2 (tính vector nhất quán)"""
    try:
        data = request.json
        
        # Chạy các stage trước
        weights_result = calculate_weights(data.get("comparisons", []))
        filtered_result = filter_laptops(data, weights_result)
        matrices_result = build_comparison_matrices(filtered_result, weights_result.get("weights", {}))
        stage3_result = calculate_criteria_totals(matrices_result, weights_result.get("weights", {}))
        stage3_result["step1_weights"] = {
            "title": "Trọng số các tiêu chí (từ Step 1)",
            "values": weights_result.get("weights", {})
        }
        stage4_result = normalize_comparison_matrices(stage3_result)
        stage5_result = calculate_priority_vectors(stage4_result)
        stage6_result = synthesize_priorities(stage5_result)
        
        print("=== Bắt đầu Step 2 - Stage 7: Tính vector nhất quán ===")
        stage7_result = calculate_consistency_vectors(stage6_result, matrices_result)
        
        # Tạo kết quả tối ưu với title
        optimized_result = {
            "status": stage7_result.get("status", "error"),
            "title": "Vector nhất quán (Consistency Vectors)",
            "criteria_weights": stage7_result.get("step1_weights", {}),
            "synthesized_scores": stage7_result.get("synthesized_scores", {}),
            "consistency_vectors": stage7_result.get("consistency_vectors", {})
        }
        
        return custom_jsonify(optimized_result)
        
    except Exception as e:
        import traceback
        print(f"Test Stage 7 Exception: {str(e)}")
        print(traceback.format_exc())
        return custom_jsonify({"status": "error", "message": f"Lỗi khi thực hiện quy trình: {str(e)}"})

@app.route('/api/test-step2-stage8', methods=['POST'])
def test_step2_stage8():
    """API endpoint để test Stage 8 của Step 2 (xếp hạng laptop)"""
    try:
        data = request.json
        
        # Chạy các stage trước
        weights_result = calculate_weights(data.get("comparisons", []))
        filtered_result = filter_laptops(data, weights_result)
        matrices_result = build_comparison_matrices(filtered_result, weights_result.get("weights", {}))
        stage3_result = calculate_criteria_totals(matrices_result, weights_result.get("weights", {}))
        stage3_result["step1_weights"] = {
            "title": "Trọng số các tiêu chí (từ Step 1)",
            "values": weights_result.get("weights", {})
        }
        stage4_result = normalize_comparison_matrices(stage3_result)
        stage5_result = calculate_priority_vectors(stage4_result)
        stage6_result = synthesize_priorities(stage5_result)
        stage7_result = calculate_consistency_vectors(stage6_result, matrices_result)
        
        print("=== Bắt đầu Step 2 - Stage 8: Xếp hạng laptop ===")
        stage8_result = rank_laptops(stage7_result)
        
        # Tạo kết quả tối ưu với title
        optimized_result = {
            "status": stage8_result.get("status", "error"),
            "title": "Xếp hạng laptop (Laptop Ranking)",
            "criteria_weights": stage8_result.get("step1_weights", {}),
            "ranked_laptops": stage8_result.get("ranked_laptops", []),
            "sensitivity_data": {
                "criteria_influence": {}
            }
        }
        
        # Thêm thông tin tác động của tiêu chí đối với top laptop
        criteria_influence = stage8_result.get("sensitivity_data", {}).get("criteria_influence", {})
        
        # Chỉ lấy thông tin tác động cho laptop hạng nhất
        top_laptop = stage8_result.get("ranked_laptops", [{}])[0] if stage8_result.get("ranked_laptops") else {}
        top_laptop_name = top_laptop.get("name", "")
        
        for criterion, influences in criteria_influence.items():
            for laptop_influence in influences:
                if laptop_influence.get("name") == top_laptop_name:
                    optimized_result["sensitivity_data"]["criteria_influence"][criterion] = laptop_influence
                    break
        
        return custom_jsonify(optimized_result)
        
    except Exception as e:
        import traceback
        print(f"Test Stage 8 Exception: {str(e)}")
        print(traceback.format_exc())
        return custom_jsonify({"status": "error", "message": f"Lỗi khi thực hiện quy trình: {str(e)}"})

@app.route('/api/test-step2-stage9', methods=['POST'])
def test_step2_stage9():
    """API endpoint để test Stage 9 của Step 2 (báo cáo cuối cùng)"""
    try:
        data = request.json
        
        # Chạy các stage trước
        weights_result = calculate_weights(data.get("comparisons", []))
        filtered_result = filter_laptops(data, weights_result)
        matrices_result = build_comparison_matrices(filtered_result, weights_result.get("weights", {}))
        stage3_result = calculate_criteria_totals(matrices_result, weights_result.get("weights", {}))
        stage3_result["step1_weights"] = {
            "title": "Trọng số các tiêu chí (từ Step 1)",
            "values": weights_result.get("weights", {})
        }
        stage4_result = normalize_comparison_matrices(stage3_result)
        stage5_result = calculate_priority_vectors(stage4_result)
        stage6_result = synthesize_priorities(stage5_result)
        stage7_result = calculate_consistency_vectors(stage6_result, matrices_result)
        stage8_result = rank_laptops(stage7_result)
        
        if stage8_result.get('status') != "success":
            return custom_jsonify(stage8_result)
        
        print("=== Bắt đầu Step 2 - Stage 9: Tạo báo cáo cuối cùng ===")
        stage9_result = rank_laptops(stage8_result)
        
        # Kết quả cuối cùng không cần tối ưu vì đã được tối ưu trong hàm generate_final_report
        return custom_jsonify(stage9_result)
        
    except Exception as e:
        import traceback
        print(f"Test Stage 9 Exception: {str(e)}")
        print(traceback.format_exc())
        return custom_jsonify({"status": "error", "message": f"Lỗi khi thực hiện quy trình: {str(e)}"})

@app.route('/api/laptops-by-usage', methods=['GET'])
def get_laptops_by_usage():
    """API endpoint để lấy danh sách laptop được nhóm theo usage"""
    try:
        # Đường dẫn đến file laptops.json
        laptops_file_path = os.path.join(os.path.dirname(__file__), 'laptops.json')
        
        # Đọc file JSON
        with open(laptops_file_path, 'r', encoding='utf-8') as file:
            laptops_data = json.load(file)
        
        # Nhóm laptop theo usage
        laptops_by_usage = defaultdict(list)
        
        for laptop in laptops_data:
            usage = laptop.get('usage', 'unknown')
            # Tạo một bản sao của laptop để giữ nguyên dữ liệu gốc
            laptop_info = laptop.copy()
            laptops_by_usage[usage].append(laptop_info)
        
        # Định dạng kết quả theo yêu cầu
        result = {}
        for usage, laptops in laptops_by_usage.items():
            result[usage] = {
                "usage": usage,
                "laptops": laptops
            }
        
        return custom_jsonify(result)
        
    except Exception as e:
        print(f"Error getting laptops by usage: {str(e)}")
        print(traceback.format_exc())
        return custom_jsonify({"status": "error", "message": f"Lỗi khi lấy danh sách laptop: {str(e)}"})
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)