from .stage1 import filter_laptops
from .stage2 import build_comparison_matrices
from .stage3 import calculate_criteria_totals
from .stage4 import normalize_comparison_matrices
from .stage5 import calculate_criteria_weights
from .stage6 import calculate_lambda_max
from .stage7 import check_consistency_ratio
from .stage8 import calculate_final_scores

# Định nghĩa phần trăm tiến độ cho mỗi giai đoạn
STAGE_PROGRESS = {
    "start": 50,  # Bắt đầu Step_2 từ 50%
    "filter": 60,  # stage1: lọc laptop
    "matrices": 65, # stage2: xây dựng ma trận so sánh
    "totals": 70,   # stage3: tính tổng tiêu chí
    "normalize": 75, # stage4: chuẩn hóa ma trận
    "weights": 80,   # stage5: tính trọng số tiêu chí
    "lambda_max": 85, # stage6: tính lambda max
    "consistency": 90, # stage7: kiểm tra tính nhất quán (CR)
    "ranking": 95,     # stage8: tính điểm tổng hợp và xếp hạng
    "complete": 100
}

__all__ = [
    'filter_laptops',
    'build_comparison_matrices',
    'calculate_criteria_totals',
    'normalize_comparison_matrices',
    'calculate_criteria_weights',
    'calculate_lambda_max',
    'check_consistency_ratio',
    'calculate_final_scores',
    'STAGE_PROGRESS'
]