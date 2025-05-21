import json
import re
import os
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Tạo kết nối đến PostgreSQL database."""
    db_host = os.environ.get('POSTGRES_HOST', 'localhost')
    db_port = os.environ.get('POSTGRES_PORT', '5432')
    db_name = os.environ.get('POSTGRES_DB', 'laptop_db')
    db_user = os.environ.get('POSTGRES_USER', 'admin')
    db_password = os.environ.get('POSTGRES_PASSWORD', 'secure_password')
    
    print(f"[DATABASE] Kết nối đến database: {db_host}:{db_port}/{db_name}")
    conn = psycopg2.connect(
        host=db_host,
        port=db_port,
        dbname=db_name,
        user=db_user,
        password=db_password
    )
    return conn

def initialize_database(laptops_data=None):
    """
    Khởi tạo database và import dữ liệu từ JSON nếu cần.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Tạo bảng nếu chưa tồn tại
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS laptops (
                    id VARCHAR(50) PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    usage VARCHAR(20) NOT NULL,
                    price INTEGER NOT NULL,
                    cpu VARCHAR(50) NOT NULL,
                    gpu VARCHAR(50),
                    screen NUMERIC(4, 1) NOT NULL,
                    screen_name VARCHAR(50) NOT NULL,
                    battery INTEGER NOT NULL,
                    storage VARCHAR(20) NOT NULL,
                    ram VARCHAR(20) NOT NULL,
                    design VARCHAR(20) NOT NULL,
                    build_quality VARCHAR(20) NOT NULL,
                    performance VARCHAR(20) NOT NULL
                )
            """)
            
            # Kiểm tra xem đã có dữ liệu chưa
            cursor.execute("SELECT COUNT(*) FROM laptops")
            count = cursor.fetchone()[0]
            print(f"[DATABASE] Số lượng laptop hiện có trong DB: {count}")
            
            # Nếu chưa có dữ liệu và laptops_data được cung cấp, thì import
            if count == 0 and laptops_data:
                print(f"[DATABASE] Importing {len(laptops_data)} laptops to database...")
                for laptop in laptops_data:
                    cursor.execute("""
                        INSERT INTO laptops 
                        (id, name, usage, price, cpu, gpu, screen, screen_name, battery,
                        storage, ram, design, build_quality, performance)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        laptop.get('id', ''),
                        laptop.get('name', ''),
                        laptop.get('usage', ''),
                        laptop.get('price', 0),
                        laptop.get('cpu', ''),
                        laptop.get('gpu', ''),
                        laptop.get('screen', 0),
                        laptop.get('screenName', ''),
                        laptop.get('battery', 0),
                        laptop.get('storage', ''),
                        laptop.get('ram', ''),
                        laptop.get('design', ''),
                        laptop.get('build_quality', ''),
                        laptop.get('performance', '')
                    ))
            
            conn.commit()
            
    except Exception as e:
        conn.rollback()
        print(f"[DATABASE_ERROR] Error initializing database: {str(e)}")
        raise
    finally:
        conn.close()

def load_laptops():
    """Tải danh sách laptop từ PostgreSQL database"""
    print("\n[LOAD_LAPTOPS] Bắt đầu tải dữ liệu laptop từ database")
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT * FROM laptops")
            laptops = cursor.fetchall()
            
            # Chuyển từ RealDictRow thành dictionary
            result = [dict(laptop) for laptop in laptops]
            print(f"[LOAD_LAPTOPS] Đã tải {len(result)} laptop từ database")
            
            # Log các laptop đầu tiên để debug
            if result:
                print(f"[LOAD_LAPTOPS] Mẫu laptop đầu tiên: {result[0]['name']}")
                print(f"[LOAD_LAPTOPS] Các thuộc tính laptop mẫu: {list(result[0].keys())}")
                
            return result
    except Exception as e:
        print(f"[LOAD_LAPTOPS_ERROR] Lỗi đọc dữ liệu từ database: {e}")
        
        # Fallback: Đọc từ file JSON nếu kết nối database thất bại
        try:
            base_dir = Path(__file__).parent.parent
            laptops_path = base_dir / "consistent_laptops.json"
            print(f"[LOAD_LAPTOPS] Fallback: Đọc dữ liệu từ file JSON: {laptops_path}")
            
            with open(laptops_path, 'r', encoding='utf-8') as f:
                json_data = json.load(f)
                print(f"[LOAD_LAPTOPS] Đã đọc {len(json_data)} laptop từ file JSON")
                
                # Log laptop đầu tiên từ JSON
                if json_data:
                    print(f"[LOAD_LAPTOPS] Mẫu laptop đầu tiên từ JSON: {json_data[0].get('name', 'N/A')}")
                
                return json_data
        except Exception as json_err:
            print(f"[LOAD_LAPTOPS_ERROR] Lỗi đọc file JSON: {json_err}")
            return []

def filter_laptops(user_data, weights_data=None):
    """
    Lọc laptop dựa trên thông tin người dùng từ API
    
    Parameters:
    - user_data: Dữ liệu từ người dùng (usage, budget, etc.)
    - weights_data: Kết quả trọng số từ Step 1 (có thể là None)
    
    Returns:
    - Dictionary chứa trạng thái, thông báo và danh sách laptop đã lọc
    """
    try:
        print(f"\n[FILTER_LAPTOPS] ==== BẮT ĐẦU LỌC LAPTOP ====")
        print(f"[FILTER_LAPTOPS] Dữ liệu người dùng: {user_data}")
        
        if weights_data:
            print(f"[FILTER_LAPTOPS] Trọng số tiêu chí: {weights_data.get('criteria_weights', {})}")
            print(f"[FILTER_LAPTOPS] CR: {weights_data.get('consistency', {}).get('CR', 'N/A')}")
        
        # Kiểm tra CR từ kết quả Step_1 nếu có
        if weights_data and weights_data.get('consistency') and weights_data['consistency'].get('CR', 0) > 0.1:
            print(f"[FILTER_LAPTOPS] CR > 0.1, cần đánh giá lại")
            return {
                "status": "error",
                "message": "Độ nhất quán CR > 0.1. Vui lòng thực hiện lại bước 1.",
                "filtered_laptops": []
            }
            
        # Lấy thông tin từ user_data
        usage = user_data.get('usage', 'all')
        fromBudget = user_data.get('fromBudget', 0)
        toBudget = user_data.get('toBudget', 100000000)
        performance = user_data.get('performance', '')
        design = user_data.get('design', '')
        fromScreenSize = user_data.get('fromScreenSize', 0)
        toScreenSize = user_data.get('toScreenSize', 30)
        
        print(f"[FILTER_LAPTOPS] Bộ lọc: usage={usage}, budget={fromBudget}-{toBudget}, "
              f"performance={performance}, design={design}, "
              f"screen={fromScreenSize}-{toScreenSize}")
        
        # Tải dữ liệu laptop
        all_laptops = load_laptops()
        print(f"[FILTER_LAPTOPS] Tổng số laptop trước khi lọc: {len(all_laptops)}")
        
        # Log một số laptop đầu để kiểm tra
        if all_laptops and len(all_laptops) > 0:
            print(f"[FILTER_LAPTOPS] Mẫu dữ liệu laptop đầu tiên:")
            first_laptop = all_laptops[0]
            for key, value in first_laptop.items():
                print(f"  - {key}: {value}")
        
        # Áp dụng bộ lọc
        filtered_laptops = []
        
        # Biến đếm để theo dõi lý do loại bỏ
        rejected_by_usage = 0
        rejected_by_budget = 0
        rejected_by_screen = 0
        rejected_by_performance = 0
        rejected_by_design = 0
        
        for laptop in all_laptops:
            matches = True
            
            # Lọc theo usage
            if usage and usage != "all":
                if laptop.get("usage", "") != usage:
                    matches = False
                    rejected_by_usage += 1
                    continue
            
            # Lọc theo budget
            price = laptop.get("price", 0)
            if price < fromBudget or price > toBudget:
                matches = False
                rejected_by_budget += 1
                continue
            
            # Lọc theo screen size
            screen = laptop.get("screen", 0)
            if screen < fromScreenSize or screen > toScreenSize:
                matches = False
                rejected_by_screen += 1
                continue
            
            # Lọc theo performance (basic, smooth, high)
            if performance and not check_performance_match(laptop, performance):
                matches = False
                rejected_by_performance += 1
                continue
                
            # Lọc theo design (lightweight, business, gaming, premium, convertible)
            if design and laptop.get("design", "") != design:
                matches = False
                rejected_by_design += 1
                continue
            
            if matches:
                # Thêm laptop vào danh sách lọc và tính điểm cho các tiêu chí
                laptop_with_scores = laptop.copy()
                
                # Tính điểm cho từng tiêu chí để chuẩn bị cho AHP
                laptop_with_scores["performance_score"] = calculate_performance_score(laptop)
                laptop_with_scores["price_score"] = calculate_price_score(laptop)
                laptop_with_scores["display_score"] = calculate_display_score(laptop)
                laptop_with_scores["battery_score"] = calculate_battery_score(laptop)
                laptop_with_scores["design_score"] = calculate_design_score(laptop)
                laptop_with_scores["build_quality_score"] = calculate_build_quality_score(laptop)
                
                filtered_laptops.append(laptop_with_scores)
        
        # Log kết quả lọc
        print(f"[FILTER_LAPTOPS] ==== KẾT QUẢ LỌC ====")
        print(f"[FILTER_LAPTOPS] Tổng số laptop phù hợp: {len(filtered_laptops)}")
        print(f"[FILTER_LAPTOPS] Loại bỏ vì không đúng usage: {rejected_by_usage}")
        print(f"[FILTER_LAPTOPS] Loại bỏ vì không đúng ngân sách: {rejected_by_budget}")
        print(f"[FILTER_LAPTOPS] Loại bỏ vì không đúng kích thước màn hình: {rejected_by_screen}")
        print(f"[FILTER_LAPTOPS] Loại bỏ vì không đáp ứng hiệu năng: {rejected_by_performance}")
        print(f"[FILTER_LAPTOPS] Loại bỏ vì không đúng thiết kế: {rejected_by_design}")
        
        # Log một số laptop sau khi lọc
        if filtered_laptops:
            print(f"\n[FILTER_LAPTOPS] Danh sách laptop phù hợp:")
            for idx, laptop in enumerate(filtered_laptops[:3]):  # Chỉ hiển thị 3 laptop đầu tiên
                print(f"  {idx+1}. {laptop.get('name', 'N/A')} - {laptop.get('price', 0):,} VND")
                print(f"     CPU: {laptop.get('cpu', 'N/A')}")
                print(f"     Điểm hiệu năng: {laptop.get('performance_score', 0)}")
                print(f"     Điểm giá: {laptop.get('price_score', 0)}")
        else:
            print("[FILTER_LAPTOPS] Không tìm thấy laptop phù hợp")
        
        return {
            "status": "success",
            "message": f"Đã lọc được {len(filtered_laptops)} laptop phù hợp",
            "filtered_laptops": filtered_laptops,
            "filters_applied": {
                "usage": usage,
                "budget": f"{fromBudget}-{toBudget}",
                "performance": performance,
                "design": design,
                "screen_size": f"{fromScreenSize}-{toScreenSize}\""
            }
        }
    
    except Exception as e:
        print(f"[FILTER_LAPTOPS_ERROR] Lỗi khi lọc laptop: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Lỗi khi lọc laptop: {str(e)}",
            "filtered_laptops": []
        }

def calculate_performance_score(laptop):
    """Tính điểm hiệu năng dựa trên CPU và GPU"""
    score = 50  # Điểm cơ bản
    
    cpu = laptop.get("cpu", "").lower()
    gpu = laptop.get("gpu", "").lower()
    
    # Điểm CPU
    if "i9" in cpu or "ryzen 9" in cpu:
        score += 25
    elif "i7" in cpu or "ryzen 7" in cpu or "m2 pro" in cpu:
        score += 20
    elif "i5" in cpu or "ryzen 5" in cpu or "m2" in cpu:
        score += 15
    elif "i3" in cpu or "ryzen 3" in cpu or "m1" in cpu:
        score += 10
    
    # Điểm GPU
    if "rtx 40" in gpu:
        score += 25
    elif "rtx 30" in gpu or "gpu 19-core" in gpu:
        score += 20
    elif "rtx 20" in gpu or "gtx 16" in gpu:
        score += 15
    elif "gtx" in gpu or "gpu 8-core" in gpu:
        score += 10
    elif "iris xe" in gpu or "radeon" in gpu:
        score += 5
    
    return min(score, 100)  # Tối đa 100 điểm

def calculate_price_score(laptop):
    """Tính điểm giá (đảo ngược: giá càng thấp điểm càng cao)"""
    price = laptop.get("price", 0)
    max_price = 70000000  # Giá tối đa tham chiếu
    
    # Công thức: điểm càng cao khi giá càng thấp
    score = max(0, 100 - (price * 100 / max_price))
    
    return score

def calculate_display_score(laptop):
    """Tính điểm màn hình dựa trên thông tin màn hình"""
    score = 50  # Điểm cơ bản
    
    screen_name = laptop.get("screenName", "").lower()
    
    # Điểm theo độ phân giải
    if "4k" in screen_name or "uhd" in screen_name:
        score += 20
    elif "2k" in screen_name or "qhd" in screen_name or "retina" in screen_name:
        score += 15
    elif "fhd" in screen_name:
        score += 10
    
    # Điểm theo công nghệ màn hình
    if "oled" in screen_name or "amoled" in screen_name:
        score += 15
    elif "ips" in screen_name:
        score += 10
    
    # Điểm theo tần số quét
    if "240hz" in screen_name:
        score += 15
    elif "165hz" in screen_name:
        score += 12
    elif "144hz" in screen_name:
        score += 10
    
    # Điểm theo tính năng bổ sung
    if "touch" in screen_name:
        score += 5
        
    return min(score, 100)  # Tối đa 100 điểm

def calculate_battery_score(laptop):
    """Tính điểm pin dựa trên thời lượng pin (tính bằng giây)"""
    battery_seconds = laptop.get("battery", 0)
    battery_hours = battery_seconds / 3600  # Chuyển từ giây sang giờ
    
    # 20 giờ pin = 100 điểm
    score = min(100, battery_hours * 5)
    
    return score

def calculate_design_score(laptop):
    """Tính điểm thiết kế dựa trên loại thiết kế"""
    design_map = {
        "premium": 95,
        "lightweight": 90,
        "convertible": 85,
        "business": 80,
        "standard": 70,
        "gaming": 65
    }
    return design_map.get(laptop.get("design", "standard"), 70)

def calculate_build_quality_score(laptop):
    """Tính điểm độ bền dựa trên build_quality"""
    build_map = {
        "military-grade": 95,
        "premium": 90,
        "high": 80,
        "medium": 60,
        "low": 40
    }
    return build_map.get(laptop.get("build_quality", "medium"), 60)

def check_performance_match(laptop, performance_requirement):
    """Kiểm tra xem laptop có đáp ứng yêu cầu hiệu năng không"""
    cpu = laptop.get("cpu", "").lower()
    gpu = laptop.get("gpu", "").lower()
    
    if performance_requirement == "basic":
        # Yêu cầu cơ bản: i3, Ryzen 3, M1 hoặc tương đương
        return True  # Mọi laptop đều đáp ứng yêu cầu cơ bản
        
    elif performance_requirement == "smooth":
        # Yêu cầu mượt mà: i5/i7, Ryzen 5/7, M1/M2 hoặc tương đương
        if ("i3" in cpu or "celeron" in cpu or "pentium" in cpu) and "iris xe" not in gpu and "rtx" not in gpu and "gtx" not in gpu:
            return False
        return True
        
    elif performance_requirement == "high":
        # Yêu cầu cao: i7/i9, Ryzen 7/9, M2 Pro hoặc card đồ họa rời tốt
        if ("i3" in cpu or "i5" in cpu or "ryzen 3" in cpu or "ryzen 5" in cpu) and ("rtx 30" not in gpu and "rtx 40" not in gpu):
            return False
        if "rtx" not in gpu and "gtx 16" not in gpu and "m2 pro" not in cpu and "m2 max" not in cpu:
            return False
        return True
    
    return True  # Mặc định khớp nếu không xác định được

def get_laptops_by_usage(usage=None):
    """Lấy danh sách laptop theo usage từ database"""
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            query = "SELECT * FROM laptops"
            params = []
            
            if usage and usage.lower() != 'all':
                query += " WHERE usage = %s"
                params.append(usage)
            
            cursor.execute(query, params)
            laptops = cursor.fetchall()
            
            # Chuyển đổi sang format mong muốn
            result = {}
            for laptop in laptops:
                laptop_dict = dict(laptop)
                usage_type = laptop_dict['usage']
                
                if usage_type not in result:
                    result[usage_type] = {
                        "usage": usage_type,
                        "laptops": []
                    }
                
                result[usage_type]['laptops'].append(laptop_dict)
            
            return {"data": result, "status": "success"}
            
    except Exception as e:
        print(f"Error getting laptops by usage: {str(e)}")
        return {"data": {}, "error": str(e), "status": "error"}