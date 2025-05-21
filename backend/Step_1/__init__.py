from .stage1 import build_comparison_matrix
from .stage2 import calculate_column_sums
from .stage3 import normalize_comparison_matrix
from .stage4 import calculate_weights
from .stage5 import calculate_consistency_vector_stage as calculate_consistency_vector
from .stage6 import calculate_lambda_max_stage as calculate_lambda_max
from .stage7 import calculate_consistency_index_stage as calculate_consistency_index
from .stage8 import calculate_consistency_ratio

# Định nghĩa phần trăm tiến độ cho mỗi giai đoạn
STAGE_PROGRESS = {
    "start": 0,
    "stage1": 10,
    "stage2": 20,
    "stage3": 30,
    "stage4": 40,
    "stage5": 50,
    "stage6": 60,
    "stage7": 70,
    "stage8": 100
}

__all__ = [
    'build_comparison_matrix',
    'calculate_column_sums',
    'normalize_comparison_matrix',
    'calculate_weights',
    'calculate_consistency_vector',
    'calculate_lambda_max',
    'calculate_consistency_index',
    'calculate_consistency_ratio',
    'STAGE_PROGRESS'
]