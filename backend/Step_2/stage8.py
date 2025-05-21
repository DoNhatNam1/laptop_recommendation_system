import numpy as np
import traceback
from typing import Dict, Any, List

def calculate_final_scores(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate final scores and ranking of laptops
    
    Args:
        input_data: Results from stage7 with priority vectors and consistency check
        
    Returns:
        Dictionary containing final scores and rankings
    """
    try:
        print("\n=== STAGE 8: CALCULATE FINAL SCORES AND RANKINGS ===")
        
        # Extract data from previous stages
        priority_vectors = input_data.get("priority_vectors", {})
        criteria_weights = input_data.get("criteria_weights", {})
        laptop_names = input_data.get("laptop_names", [])
        laptop_ids = input_data.get("laptop_ids", [])
        laptops = input_data.get("laptops", [])
        laptop_details = input_data.get("laptop_details", {})
        
        # Check required data
        if not priority_vectors or not criteria_weights:
            print("ERROR: Missing required data from previous stages")
            return {
                "status": "error",
                "message": "Không nhận được vector ưu tiên hoặc trọng số tiêu chí từ các giai đoạn trước"
            }
        
        # Log input summary
        print(f"Calculating final scores for {len(laptop_names)} laptops")
        print(f"Using {len(priority_vectors)} priority vectors and {len(criteria_weights)} criteria weights")
        
        # Create mapping between laptop index and ID
        laptop_index_to_id = {}
        for i, laptop_id in enumerate(laptop_ids):
            laptop_index_to_id[i] = laptop_id
        
        # Initialize arrays for calculation
        laptop_count = len(laptop_names)
        final_scores = np.zeros(laptop_count)
        
        # Calculate weighted sum of priority vectors
        for criterion, weight in criteria_weights.items():
            # Skip if criterion not in priority vectors
            if criterion not in priority_vectors:
                print(f"WARNING: No priority vector for {criterion}, skipping")
                continue
                
            # Get priority vector
            priority = priority_vectors[criterion]
            
            # Convert to numpy array if needed
            if not isinstance(priority, np.ndarray):
                priority = np.array(priority, dtype=float)
                
            # If lengths don't match, skip
            if len(priority) != laptop_count:
                print(f"WARNING: Priority vector length mismatch for {criterion}, skipping")
                continue
                
            # Add weighted priority to final scores
            final_scores += priority * weight
        
        # Create result list with scores
        result_laptops = []
        
        for i in range(laptop_count):
            laptop_id = laptop_index_to_id.get(i)
            
            # Skip if no ID (shouldn't happen)
            if not laptop_id:
                continue
                
            # Get laptop details
            laptop = {}
            
            # Find the laptop in the original laptops list
            for l in laptops:
                if str(l.get("id")) == str(laptop_id):
                    laptop = l
                    break
                    
            # Create result entry with only original laptop properties
            # (removing derived scores as requested)
            result_entry = {
                "id": laptop_id,
                "name": laptop_names[i] if i < len(laptop_names) else f"Laptop {i+1}",
                "score": float(final_scores[i]),
                # Include only original laptop properties
                "price": laptop.get("price"),
                "cpu": laptop.get("cpu"),
                "ram": laptop.get("ram"),
                "storage": laptop.get("storage"),
                "gpu": laptop.get("gpu"),
                "screen_size": laptop.get("screen_size"),
                "screen": laptop.get("screen"),
                "screen_name": laptop.get("screen_name"),
                "battery": laptop.get("battery"),
                "weight": laptop.get("weight"),
                "usage": laptop.get("usage"),
                "design": laptop.get("design"),
                "performance": laptop.get("performance")
            }
            
            # Remove None values
            result_entry = {k: v for k, v in result_entry.items() if v is not None}
            
            result_laptops.append(result_entry)
        
        # Sort by score (descending)
        result_laptops.sort(key=lambda x: x["score"], reverse=True)
        
        # Add ranks
        for i, laptop in enumerate(result_laptops):
            laptop["rank"] = i + 1
        
        # Log top 3 laptops
        print("\nTop 3 laptops:")
        for laptop in result_laptops[:min(3, len(result_laptops))]:
            print(f"  {laptop['rank']}. {laptop['name']} - Score: {laptop['score']:.4f}")
        
        # Create the final result
        result = {
            "status": "success",
            "stage": "stage8",
            "message": "Laptop ranking completed successfully",
            "ranked_laptops": result_laptops,
            "laptop_count": len(result_laptops),
            "criteria_weights": criteria_weights
        }
        
        print(f"\nStage 8 completed: Ranked {len(result_laptops)} laptops")
        
        return result
        
    except Exception as e:
        print(f"Stage 8 Exception: {str(e)}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Lỗi khi tính điểm xếp hạng: {str(e)}"
        }