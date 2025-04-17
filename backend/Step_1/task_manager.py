import time
import threading
import uuid
from typing import Dict, Any, Optional

# Lưu trữ các task trong bộ nhớ (trong production nên dùng Redis/DB)
tasks = {}

def generate_task_id() -> str:
    """Tạo ID duy nhất cho task mới"""
    return str(uuid.uuid4())

def create_task(data: Dict[str, Any]) -> str:
    """
    Khởi tạo một task mới và trả về task_id
    """
    task_id = generate_task_id()
    tasks[task_id] = {
        "task_id": task_id,
        "status": "processing",
        "progress": 0,
        "created_at": time.time(),
        "updated_at": time.time(),
        "data": data,
        "current_step": "Khởi tạo...",
        "result": None,
        "error": None
    }
    return task_id

def get_task(task_id: str) -> Optional[Dict[str, Any]]:
    """
    Lấy thông tin task từ task_id
    """
    return tasks.get(task_id)

def update_task(task_id: str, **kwargs) -> bool:
    """
    Cập nhật thông tin task
    """
    if task_id not in tasks:
        return False
    
    for key, value in kwargs.items():
        tasks[task_id][key] = value
    
    tasks[task_id]["updated_at"] = time.time()
    return True

def start_processing_task(task_id: str, process_func):
    """
    Bắt đầu xử lý task trong một thread riêng biệt
    """
    task_data = tasks.get(task_id, {}).get("data", {})
    
    def process_thread():
        try:
            process_func(task_id, task_data)
        except Exception as e:
            update_task(
                task_id,
                status="failed",
                error=str(e),
                progress=100
            )
    
    thread = threading.Thread(target=process_thread)
    thread.daemon = True
    thread.start()