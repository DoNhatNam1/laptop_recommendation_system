import json
import os
from pathlib import Path
from Step_2.stage1 import get_db_connection, initialize_database

def run_migration():
    """
    Thực hiện migration: tạo schema và import dữ liệu
    """
    try:
        # Đọc dữ liệu từ file JSON
        base_dir = Path(__file__).parent
        laptops_path = base_dir / "consistent_laptops.json"
        
        with open(laptops_path, 'r', encoding='utf-8') as f:
            laptops_data = json.load(f)
            
        # Khởi tạo database và import dữ liệu
        initialize_database(laptops_data)
        print(f"Migration completed successfully. Imported {len(laptops_data)} laptops.")
        
    except Exception as e:
        print(f"Migration failed: {str(e)}")
        
if __name__ == "__main__":
    run_migration()