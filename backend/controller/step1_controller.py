import traceback
from typing import Dict, Any

# Import Step_1 stages
from Step_1 import (
    build_comparison_matrix,
    calculate_column_sums,
    normalize_comparison_matrix,
    calculate_weights,
    calculate_consistency_vector,
    calculate_lambda_max,
    calculate_consistency_index,
    calculate_consistency_ratio,
    STAGE_PROGRESS
)

class Step1Controller:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.debug_mode = config.get("debug", True)
    
    def process(self, input_data: Dict[str, Any], task_id: str = None, processing_tasks: Dict = None) -> Dict[str, Any]:
        """
        Process Step 1: Calculate criteria weights using AHP
        """
        try:
            if self.debug_mode:
                print("\n=== STEP 1: CALCULATE CRITERIA WEIGHTS ===")
            
            # Process each stage
            
            # Stage 1: Build comparison matrix
            if processing_tasks and task_id:
                processing_tasks[task_id]["progress"] = STAGE_PROGRESS["stage1"]
                processing_tasks[task_id]["message"] = "Building comparison matrix..."
                
            stage1_result = build_comparison_matrix(input_data)
            
            if stage1_result.get("status") == "error":
                return stage1_result
                
            # Stage 2: Calculate column sums
            if processing_tasks and task_id:
                processing_tasks[task_id]["progress"] = STAGE_PROGRESS["stage2"]
                processing_tasks[task_id]["message"] = "Calculating column sums..."
                
            stage2_result = calculate_column_sums(stage1_result)
            
            if stage2_result.get("status") == "error":
                return stage2_result
                
            # Stage 3: Normalize comparison matrix
            if processing_tasks and task_id:
                processing_tasks[task_id]["progress"] = STAGE_PROGRESS["stage3"]
                processing_tasks[task_id]["message"] = "Normalizing matrix..."
                
            stage3_result = normalize_comparison_matrix(stage2_result)
            
            if stage3_result.get("status") == "error":
                return stage3_result
                
            # Stage 4: Calculate weights
            if processing_tasks and task_id:
                processing_tasks[task_id]["progress"] = STAGE_PROGRESS["stage4"]
                processing_tasks[task_id]["message"] = "Calculating criteria weights..."
                
            stage4_result = calculate_weights(stage3_result)
            
            if stage4_result.get("status") == "error":
                return stage4_result
                
            # Stage 5: Calculate consistency vector
            if processing_tasks and task_id:
                processing_tasks[task_id]["progress"] = STAGE_PROGRESS["stage5"]
                processing_tasks[task_id]["message"] = "Calculating consistency vector..."
                
            stage5_result = calculate_consistency_vector(stage4_result)
            
            if stage5_result.get("status") == "error":
                return stage5_result
                
            # Stage 6: Calculate lambda max
            if processing_tasks and task_id:
                processing_tasks[task_id]["progress"] = STAGE_PROGRESS["stage6"]
                processing_tasks[task_id]["message"] = "Calculating lambda max..."
                
            stage6_result = calculate_lambda_max(stage5_result)
            
            if stage6_result.get("status") == "error":
                return stage6_result
                
            # Stage 7: Calculate Consistency Index (CI)
            if processing_tasks and task_id:
                processing_tasks[task_id]["progress"] = STAGE_PROGRESS["stage7"]
                processing_tasks[task_id]["message"] = "Calculating Consistency Index..."
                
            stage7_result = calculate_consistency_index(stage6_result)
            
            if stage7_result.get("status") == "error":
                return stage7_result
                
            # Stage 8: Calculate Consistency Ratio (CR)
            if processing_tasks and task_id:
                processing_tasks[task_id]["progress"] = STAGE_PROGRESS["stage8"]
                processing_tasks[task_id]["message"] = "Calculating Consistency Ratio..."
                
            stage8_result = calculate_consistency_ratio(stage7_result)
            
            if stage8_result.get("status") == "error":
                return stage8_result
            
            return stage8_result
            
        except Exception as e:
            print(f"Step 1 Controller Exception: {str(e)}")
            traceback.print_exc()
            return {"status": "error", "message": f"Error in Step 1: {str(e)}"}
    
    def _handle_missing_fields(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle missing fields in the input data by providing defaults
        """
        # Default empty criteria weights
        if "criteria_weights" not in input_data:
            input_data["criteria_weights"] = {}
            
        # Default evaluation method
        if "evaluationMethod" not in input_data:
            input_data["evaluationMethod"] = "auto"
            
        # Default empty laptops list
        if "filtered_laptops" not in input_data:
            input_data["filtered_laptops"] = []
            
        return input_data