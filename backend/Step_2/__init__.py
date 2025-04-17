from .stage1 import filter_laptops
from .stage2 import build_comparison_matrices
from .stage3 import calculate_criteria_totals
from .stage4 import normalize_comparison_matrices
from .stage5 import calculate_priority_vectors
from .stage6 import synthesize_priorities
from .stage7 import calculate_consistency_vectors
from .stage8 import check_consistency
from .stage9 import rank_laptops

# Định nghĩa phần trăm tiến độ cho mỗi giai đoạn
STAGE_PROGRESS = {
    "start": 50,  # Bắt đầu Step_2 từ 50%
    "filter": 70,
    "score": 90, 
    "complete": 100
}

__all__ = [
    'filter_laptops',
    'build_comparison_matrices',
    'calculate_criteria_totals',
    'normalize_comparison_matrices',
    'calculate_priority_vectors',
    'calculate_consistency_vectors',
    'synthesize_priorities',
    'rank_laptops',
    'check_consistency',
    'STAGE_PROGRESS'
]