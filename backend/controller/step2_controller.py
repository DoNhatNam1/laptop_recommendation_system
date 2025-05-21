import traceback
import time
import numpy as np
from typing import Dict, List, Any, Optional, Union

# Import all stages with correct function names
from Step_2.stage1 import filter_laptops
from Step_2.stage2 import build_comparison_matrices
from Step_2.stage3 import calculate_criteria_totals
from Step_2.stage4 import normalize_comparison_matrices
from Step_2.stage5 import calculate_criteria_weights
from Step_2.stage6 import calculate_lambda_max
from Step_2.stage7 import check_consistency_ratio
from Step_2.stage8 import calculate_final_scores

# Import progress constants
from Step_2 import STAGE_PROGRESS

class Step2Controller:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.debug_mode = config.get("debug", True)
        self.consistency_threshold = config.get("consistency_threshold", 0.1)
    
    def filter_laptops(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process Step 2 - Stage 1: Filter laptops based on criteria weights
        """
        try:
            if self.debug_mode:
                print("\n=== STEP 2 - STAGE 1: FILTER LAPTOPS ===")
            
            # Extract weights if they're in a nested format
            criteria_weights = data.get("weights", {})
            if not criteria_weights and "criteria_weights" in data:
                criteria_weights = data["criteria_weights"]
            
            # Run filter_laptops function
            result = filter_laptops(data, {"weights": criteria_weights})
            
            if self.debug_mode and result.get("status") == "success":
                print(f"Filtered {len(result.get('filtered_laptops', []))} laptops")
                
            return result
            
        except Exception as e:
            print(f"Step 2 Filter Exception: {str(e)}")
            traceback.print_exc()
            return {"status": "error", "message": f"Error filtering laptops: {str(e)}"}
    
    def process(self, step1_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process Step 2: AHP evaluation methodology
        """
        try:
            if self.debug_mode:
                print("\n=== STEP 2: AHP LAPTOP EVALUATION ===")
            
            # Initialize result tracking
            result = {
                "status": "success",
                "message": "AHP processing completed successfully",
                "stage_processing_times": {},
            }
            
            # First filter the laptops
            filtered_result = self.filter_laptops(step1_result)
            if filtered_result.get("status") == "error":
                return filtered_result
                
            # Run through all remaining stages in sequence
            stages = [
                ("stage2", self._run_stage2),
                ("stage3", self._run_stage3),
                ("stage4", self._run_stage4),
                ("stage5", self._run_stage5),
                ("stage6", self._run_stage6),
                ("stage7", self._run_stage7),
                ("stage8", self._run_stage8)
            ]
            
            current_result = filtered_result
            
            for stage_name, stage_func in stages:
                stage_start = time.time()
                
                try:
                    current_result = stage_func(current_result)
                    if current_result.get("status") == "error":
                        return current_result
                        
                    result["stage_processing_times"][stage_name] = time.time() - stage_start
                    
                    if self.debug_mode:
                        print(f"Stage {stage_name} completed in {result['stage_processing_times'][stage_name]:.2f}s")
                        
                except Exception as e:
                    print(f"Stage {stage_name} Exception: {str(e)}")
                    traceback.print_exc()
                    return {"status": "error", "message": f"Error in Stage {stage_name}: {str(e)}"}
            
            # Combine final result
            result.update({
                "laptop_scores": current_result.get("laptop_scores", {}),
                "laptop_rankings": current_result.get("laptop_rankings", []),
                "laptop_details": current_result.get("laptop_details", {}),
                "criteria_weights": current_result.get("criteria_weights", {}),
                "consistency": {
                    "overall_consistent": current_result.get("overall_consistent", False),
                    "inconsistent_criteria": current_result.get("inconsistent_criteria", []),
                    "consistency_message": current_result.get("consistency_message", "")
                }
            })
            
            return result
            
        except Exception as e:
            print(f"Step 2 Controller Exception: {str(e)}")
            traceback.print_exc()
            return {"status": "error", "message": f"Error in Step 2: {str(e)}"}
    
    def evaluate_laptops(self, data: Dict[str, Any], task_id: str, processing_tasks: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process Step 2: Evaluate laptops using AHP (async with task tracking)
        """
        try:
            # Extract info from data
            filtered_laptops = data.get("filtered_laptops", [])
            criteria_weights = data.get("criteria_weights", {})
            evaluation_method = data.get("evaluationMethod", "auto")
            
            # Prepare filtered result
            filtered_result = {
                "status": "success",
                "filtered_laptops": filtered_laptops,
                "evaluationMethod": evaluation_method
            }
            
            # Process selectedLaptops if available (for manual evaluation)
            if evaluation_method == "manual" and "selectedLaptops" in data:
                selected_ids = [str(laptop.get("id")) for laptop in data["selectedLaptops"]]
                
                if selected_ids:
                    print(f"Using {len(selected_ids)} selected laptops for manual evaluation")
                    
                    # Convert IDs to string for consistent comparison
                    for laptop in filtered_laptops:
                        if "id" in laptop and not isinstance(laptop["id"], str):
                            laptop["id"] = str(laptop["id"])
                    
                    # Filter to only selected laptops
                    selected_laptops = [laptop for laptop in filtered_laptops 
                                      if laptop.get("id") in selected_ids]
                    
                    filtered_result["filtered_laptops"] = selected_laptops
            
            # Stage 2: Build comparison matrices
            processing_tasks[task_id]["progress"] = STAGE_PROGRESS.get("matrices", 20)
            processing_tasks[task_id]["message"] = "Building comparison matrices..."
            
            if evaluation_method == "manual" and "laptopComparisons" in data:
                print("=== MANUAL EVALUATION ===")
                # Use manual evaluation
                stage2_result = build_comparison_matrices(
                    filtered_result,
                    criteria_weights,
                    data["laptopComparisons"]
                )
            else:
                # Use automatic evaluation
                print("=== AUTOMATIC EVALUATION ===")
                stage2_result = build_comparison_matrices(filtered_result, criteria_weights)
    
            # Check stage 2 result
            if stage2_result.get("status") == "error":
                return stage2_result
            
            # Keep original data for reference
            stage2_result["original_laptops"] = filtered_laptops
            
            # Stage 3: Calculate criteria totals
            processing_tasks[task_id]["progress"] = STAGE_PROGRESS.get("totals", 30)
            processing_tasks[task_id]["message"] = "Calculating criteria totals..."
            stage3_result = calculate_criteria_totals(stage2_result, criteria_weights)
            stage3_result["step1_weights"] = {
                "title": "Criteria weights (from Step 1)",
                "values": criteria_weights
            }
            stage3_result["original_laptops"] = filtered_laptops
            
            if stage3_result.get("status") == "error":
                return stage3_result
            
            # Stage 4: Normalize matrices
            processing_tasks[task_id]["progress"] = STAGE_PROGRESS.get("normalize", 40)
            processing_tasks[task_id]["message"] = "Normalizing matrices..."
            stage4_result = normalize_comparison_matrices(stage3_result)
            stage4_result["original_laptops"] = filtered_laptops
            
            if stage4_result.get("status") == "error":
                return stage4_result
            
            # Stage 5: Calculate criteria weights
            processing_tasks[task_id]["progress"] = STAGE_PROGRESS.get("weights", 50)
            processing_tasks[task_id]["message"] = "Calculating criteria weights..."
            stage5_result = calculate_criteria_weights(stage4_result)
            stage5_result["original_laptops"] = filtered_laptops
            
            if stage5_result.get("status") == "error":
                return stage5_result
            
            # Ensure data is complete for stage 6
            if "normalized_matrices" not in stage5_result and "normalized_matrices" in stage4_result:
                stage5_result["normalized_matrices"] = stage4_result["normalized_matrices"]
            if "matrices" not in stage5_result and "matrices" in stage4_result:
                stage5_result["matrices"] = stage4_result["matrices"]
            
            # Stage 6: Calculate lambda max
            processing_tasks[task_id]["progress"] = STAGE_PROGRESS.get("lambda", 70)
            processing_tasks[task_id]["message"] = "Calculating lambda max..."
            stage6_result = calculate_lambda_max(stage5_result)
            stage6_result["original_laptops"] = filtered_laptops
            
            if stage6_result.get("status") == "error":
                return stage6_result
            
            # Stage 7: Calculate consistency ratio
            processing_tasks[task_id]["progress"] = STAGE_PROGRESS.get("consistency", 80)
            processing_tasks[task_id]["message"] = "Checking consistency ratio (CR)..."
            stage7_result = check_consistency_ratio(stage6_result)
            stage7_result["original_laptops"] = filtered_laptops
            
            # Check and handle consistency issues
            if stage7_result.get("status") == "error":
                return stage7_result
    
            # Check and handle warnings for inconsistent criteria
            if not stage7_result.get("overall_consistent", True):
                print(f"WARNING: {stage7_result.get('consistency_message')}")
                
                # Save warning information in task
                processing_tasks[task_id]["has_consistency_warning"] = True
                processing_tasks[task_id]["warning_message"] = stage7_result.get("consistency_message")
                processing_tasks[task_id]["inconsistent_criteria"] = stage7_result.get("inconsistent_criteria", [])
                processing_tasks[task_id]["consistency_results"] = stage7_result.get("consistency_results", {})
            
            # Stage 8: Final calculation and ranking
            processing_tasks[task_id]["progress"] = STAGE_PROGRESS.get("scores", 90)
            processing_tasks[task_id]["message"] = "Calculating final scores and ranking laptops..."
            final_result = calculate_final_scores(stage7_result)
            
            if final_result.get("status") == "error":
                return final_result
            
            return final_result
            
        except Exception as e:
            print(f"Step 2 Evaluation Exception: {str(e)}")
            traceback.print_exc()
            return {"status": "error", "message": f"Error evaluating laptops: {str(e)}"}
    
    def evaluate_laptops_direct(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process Step 2: Evaluate laptops using AHP (synchronous without task tracking)
        """
        try:
            # Extract info from data
            criteria_weights = data.get("criteria_weights", {})
            filtered_laptops = data.get("filtered_laptops", [])
            evaluation_method = data.get("evaluationMethod", "auto")
            
            # Prepare filtered result
            filtered_result = {
                "status": "success",
                "filtered_laptops": filtered_laptops,
                "evaluationMethod": evaluation_method
            }
            
            # Process selectedLaptops if available (for manual evaluation)
            if evaluation_method == "manual" and "selectedLaptops" in data:
                selected_ids = [str(laptop.get("id")) for laptop in data["selectedLaptops"]]
                
                if selected_ids:
                    print(f"Using {len(selected_ids)} selected laptops for manual evaluation")
                    
                    # Convert IDs to string for consistent comparison
                    for laptop in filtered_laptops:
                        if "id" in laptop and not isinstance(laptop["id"], str):
                            laptop["id"] = str(laptop["id"])
                    
                    # Filter to only selected laptops
                    selected_laptops = [laptop for laptop in filtered_laptops 
                                      if laptop.get("id") in selected_ids]
                    
                    filtered_result["filtered_laptops"] = selected_laptops
            
            # Stage 2: Build comparison matrices
            print("\n=== STAGE 2: BUILD COMPARISON MATRICES ===")
            
            if evaluation_method == "manual" and "laptopComparisons" in data:
                print("=== MANUAL EVALUATION ===")
                # Use manual evaluation
                stage2_result = build_comparison_matrices(
                    filtered_result,
                    criteria_weights,
                    data["laptopComparisons"]
                )
            else:
                # Use automatic evaluation
                print("=== AUTOMATIC EVALUATION ===")
                stage2_result = build_comparison_matrices(filtered_result, criteria_weights)
    
            # Check stage 2 result
            if stage2_result.get("status") == "error":
                return stage2_result
            
            # Keep original data for reference
            stage2_result["original_laptops"] = filtered_laptops
            
            # Stage 3: Calculate criteria totals
            print("\n=== STAGE 3: CALCULATE CRITERIA TOTALS ===")
            stage3_result = calculate_criteria_totals(stage2_result, criteria_weights)
            stage3_result["step1_weights"] = {
                "title": "Criteria weights (from Step 1)",
                "values": criteria_weights
            }
            stage3_result["original_laptops"] = filtered_laptops
            
            if stage3_result.get("status") == "error":
                return stage3_result
            
            # Stage 4: Normalize matrices
            print("\n=== STAGE 4: NORMALIZE COMPARISON MATRICES ===")
            stage4_result = normalize_comparison_matrices(stage3_result)
            stage4_result["original_laptops"] = filtered_laptops
            
            if stage4_result.get("status") == "error":
                return stage4_result
            
            # Stage 5: Calculate criteria weights
            print("\n=== STAGE 5: CALCULATE CRITERIA WEIGHTS ===")
            stage5_result = calculate_criteria_weights(stage4_result)
            stage5_result["original_laptops"] = filtered_laptops
            
            if stage5_result.get("status") == "error":
                return stage5_result
            
            # Ensure data is complete for stage 6
            if "normalized_matrices" not in stage5_result and "normalized_matrices" in stage4_result:
                stage5_result["normalized_matrices"] = stage4_result["normalized_matrices"]
            if "matrices" not in stage5_result and "matrices" in stage4_result:
                stage5_result["matrices"] = stage4_result["matrices"]
            
            # Stage 6: Calculate lambda max
            print("\n=== STAGE 6: CALCULATE LAMBDA MAX ===")
            stage6_result = calculate_lambda_max(stage5_result)
            stage6_result["original_laptops"] = filtered_laptops
            
            if stage6_result.get("status") == "error":
                return stage6_result
            
            # Stage 7: Calculate consistency ratio
            print("\n=== STAGE 7: CHECK CONSISTENCY RATIO ===")
            stage7_result = check_consistency_ratio(stage6_result)
            stage7_result["original_laptops"] = filtered_laptops
            
            # Check and handle consistency issues
            if stage7_result.get("status") == "error":
                return stage7_result
    
            # Prepare warning info for inconsistent matrices
            warning_info = None
            if not stage7_result.get("overall_consistent", True):
                warning_info = {
                    "warning_message": stage7_result.get("consistency_message"),
                    "inconsistent_criteria": stage7_result.get("inconsistent_criteria", [])
                }
                print(f"WARNING: {warning_info['warning_message']}")
            
            # Stage 8: Final calculation and ranking
            print("\n=== STAGE 8: CALCULATE FINAL SCORES AND RANKING ===")
            final_result = calculate_final_scores(stage7_result)
            
            if final_result.get("status") == "error":
                return final_result
            
            # Add warning if present
            if warning_info:
                final_result["consistency_warning"] = warning_info
            
            return final_result
            
        except Exception as e:
            print(f"Step 2 Direct Evaluation Exception: {str(e)}")
            traceback.print_exc()
            return {"status": "error", "message": f"Error evaluating laptops: {str(e)}"}
    
    # Stage methods - corrected to match actual function names
    def _run_stage2(self, stage1_result: Dict[str, Any]) -> Dict[str, Any]:
        """Run Stage 2: Build comparison matrices"""
        criteria_weights = stage1_result.get("criteria_weights", {})
        return build_comparison_matrices(stage1_result, criteria_weights)
    
    def _run_stage3(self, stage2_result: Dict[str, Any]) -> Dict[str, Any]:
        """Run Stage 3: Calculate criteria totals"""
        criteria_weights = stage2_result.get("criteria_weights", {})
        return calculate_criteria_totals(stage2_result, criteria_weights)
    
    def _run_stage4(self, stage3_result: Dict[str, Any]) -> Dict[str, Any]:
        """Run Stage 4: Normalize comparison matrices"""
        return normalize_comparison_matrices(stage3_result)
    
    def _run_stage5(self, stage4_result: Dict[str, Any]) -> Dict[str, Any]:
        """Run Stage 5: Calculate criteria weights"""
        return calculate_criteria_weights(stage4_result)
    
    def _run_stage6(self, stage5_result: Dict[str, Any]) -> Dict[str, Any]:
        """Run Stage 6: Calculate lambda max"""
        return calculate_lambda_max(stage5_result)
    
    def _run_stage7(self, stage6_result: Dict[str, Any]) -> Dict[str, Any]:
        """Run Stage 7: Check consistency ratio"""
        return check_consistency_ratio(stage6_result)
    
    def _run_stage8(self, stage7_result: Dict[str, Any]) -> Dict[str, Any]:
        """Run Stage 8: Calculate final scores"""
        return calculate_final_scores(stage7_result)