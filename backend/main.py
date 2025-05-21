from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import traceback
from typing import Dict, Any, List
import numpy as np
from datetime import datetime

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure Flask JSON encoder to properly handle Unicode characters
app.config['JSON_AS_ASCII'] = False
app.json.ensure_ascii = False  # This ensures Vietnamese characters aren't escaped

# Define paths
DB_PATH = 'data/laptops.db'
MIGRATION_STATUS_PATH = 'data/migration_status.json'

# Import Step 1 modules
from Step_1 import (
    build_comparison_matrix,
    calculate_column_sums,
    normalize_comparison_matrix,
    calculate_weights,
    calculate_consistency_vector,
    calculate_lambda_max,
    calculate_consistency_index,
    calculate_consistency_ratio
)

# Import Step 2 modules
from Step_2 import (
    filter_laptops, 
    build_comparison_matrices, 
    calculate_criteria_totals,
    normalize_comparison_matrices, 
    calculate_criteria_weights,
    calculate_lambda_max as step2_calculate_lambda_max, 
    check_consistency_ratio, 
    calculate_final_scores
)
from Step_2.stage1 import get_db_connection, filter_laptops as step2_filter_laptops

# Simple database interaction functions
def get_laptops_by_usage_from_db(filters=None):
    """Get laptops from DB with filtering"""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Xây dựng câu query với các điều kiện lọc
            query = "SELECT * FROM laptops"
            conditions = []
            params = []
            
            if filters:
                # Lọc theo usage
                if filters.get('usage') and filters['usage'] != 'all':
                    conditions.append("usage = %s")
                    params.append(filters['usage'])
                
                # Lọc theo khoảng giá
                if filters.get('fromBudget'):
                    conditions.append("price >= %s")
                    params.append(int(filters['fromBudget']))
                if filters.get('toBudget'):
                    conditions.append("price <= %s")
                    params.append(int(filters['toBudget']))
                
                # Lọc theo hiệu năng
                if filters.get('performance'):
                    conditions.append("performance = %s")
                    params.append(filters['performance'])
                
                # Lọc theo thiết kế
                if filters.get('design'):
                    conditions.append("design = %s")
                    params.append(filters['design'])
                
                # Lọc theo kích thước màn hình
                if filters.get('fromScreenSize'):
                    conditions.append("screen >= %s")
                    params.append(float(filters['fromScreenSize']))
                if filters.get('toScreenSize'):
                    conditions.append("screen <= %s")
                    params.append(float(filters['toScreenSize']))
            
            # Thêm các điều kiện vào câu query
            if conditions:
                query += " WHERE " + " AND ".join(conditions)
            
            print(f"[DB] Executing query: {query} with params: {params}")
            cursor.execute(query, params)
            
            laptops = []
            for row in cursor.fetchall():
                # Chuyển row từ tuple sang dictionary
                columns = [desc[0] for desc in cursor.description]
                laptop = dict(zip(columns, row))
                laptops.append(laptop)
            
            return {
                "status": "success",
                "laptops": laptops
            }
        
    except Exception as e:
        print(f"Error getting laptops by usage: {str(e)}")
        return {
            "status": "error", 
            "message": f"Database error: {str(e)}",
            "laptops": []
        }

# =================== API Endpoints ===================

@app.route('/api/status', methods=['GET'])
def check_status():
    """Check if the API is running"""
    return jsonify({
        "status": "online",
        "message": "API is running",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0"
    })

@app.route('/api/migration-status', methods=['GET'])
def check_migration_status():
    """Check database migration status"""
    try:
        if os.path.exists(MIGRATION_STATUS_PATH):
            with open(MIGRATION_STATUS_PATH, 'r', encoding='utf-8') as f:
                migration_data = json.load(f)
                return jsonify(migration_data)
        else:
            return jsonify({
                "status": "unknown",
                "message": "Migration status file not found"
            })
    except Exception as e:
        print(f"Error checking migration status: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error checking migration status: {str(e)}"
        })

@app.route('/api/laptops-by-usage', methods=['GET'])
def get_laptops_by_usage():
    """Get laptops with filtering"""
    try:
        # Lấy tham số lọc từ URL
        filters = {
            'usage': request.args.get('usage'),
            'fromBudget': request.args.get('fromBudget'),
            'toBudget': request.args.get('toBudget'),
            'performance': request.args.get('performance'),
            'design': request.args.get('design'),
            'fromScreenSize': request.args.get('fromScreenSize'),
            'toScreenSize': request.args.get('toScreenSize')
        }
        
        # Loại bỏ các tham số None
        filters = {k: v for k, v in filters.items() if v is not None}
        
        print(f"Filtering laptops with params: {filters}")
        
        # Lấy laptop đã lọc từ database
        result = get_laptops_by_usage_from_db(filters)
        
        # Log kết quả
        laptop_count = len(result.get("laptops", []))
        print(f"Found {laptop_count} matching laptops")
        
        return jsonify(result)
    except Exception as e:
        print(f"Error retrieving laptops by usage: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error retrieving laptops by usage: {str(e)}"
        }), 500

# =================== Step 1: Process Criteria Comparisons ===================

@app.route('/api/process-comparisons', methods=['POST'])
def process_comparisons_endpoint():
    """Process criteria comparisons and filter laptops"""
    try:
        # Get data from request
        data = request.json
        
        if not data:
            return jsonify({"status": "error", "message": "No input data provided"}), 400
            
        print("\n=== STEP 1: PROCESSING CRITERIA COMPARISONS ===")
        
        # Stage 1: Build comparison matrix
        print("Stage 1: Building comparison matrix")
        stage1_result = build_comparison_matrix(data)
        if stage1_result.get("status") == "error":
            return jsonify(stage1_result), 400
            
        # Stage 2: Calculate column sums
        print("Stage 2: Calculating column sums")
        stage2_result = calculate_column_sums(stage1_result)
        if stage2_result.get("status") == "error":
            return jsonify(stage2_result), 400
            
        # Stage 3: Normalize comparison matrix
        print("Stage 3: Normalizing comparison matrix")
        stage3_result = normalize_comparison_matrix(stage2_result)
        if stage3_result.get("status") == "error":
            return jsonify(stage3_result), 400
            
        # Stage 4: Calculate weights
        print("Stage 4: Calculating weights")
        stage4_result = calculate_weights(stage3_result)
        if stage4_result.get("status") == "error":
            return jsonify(stage4_result), 400
            
        # Stage 5: Calculate consistency vector
        print("Stage 5: Calculating consistency vector")
        stage5_result = calculate_consistency_vector(stage4_result)
        if stage5_result.get("status") == "error":
            return jsonify(stage5_result), 400
            
        # Stage 6: Calculate lambda max
        print("Stage 6: Calculating lambda max")
        stage6_result = calculate_lambda_max(stage5_result)
        if stage6_result.get("status") == "error":
            return jsonify(stage6_result), 400
            
        # Stage 7: Calculate consistency index
        print("Stage 7: Calculating consistency index")
        stage7_result = calculate_consistency_index(stage6_result)
        if stage7_result.get("status") == "error":
            return jsonify(stage7_result), 400
            
        # Stage 8: Calculate consistency ratio
        print("Stage 8: Calculating consistency ratio")
        stage8_result = calculate_consistency_ratio(stage7_result)
        if stage8_result.get("status") == "error":
            return jsonify(stage8_result), 400
        
        # Return the final result
        return jsonify(stage8_result)
        
    except Exception as e:
        print(f"Error processing comparisons: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": f"Error processing comparisons: {str(e)}"
        }), 500

# =================== Step 2: Evaluate Laptops ===================

@app.route('/api/evaluate-laptops', methods=['POST'])
def evaluate_laptops_endpoint():
    """Evaluate laptops directly"""
    try:
        # Get data from request
        data = request.json
        
        if not data:
            return jsonify({
                "status": "error", 
                "message": "No input data provided"
            }), 400
        
        # Extract data from request
        criteria_weights = data.get('criteria_weights', {})
        filtered_laptops = data.get('filtered_laptops', [])
        evaluation_method = data.get('evaluationMethod', 'auto')
        laptop_comparisons = data.get('laptopComparisons', {})
        selected_laptops = data.get('selectedLaptops', [])
        
        # Prepare input data
        input_data = {
            "filtered_laptops": filtered_laptops,
            "selectedLaptops": selected_laptops,
            "evaluationMethod": evaluation_method,
            "laptopComparisons": laptop_comparisons
        }
        
        print("\n=== STEP 2: EVALUATING LAPTOPS ===")
        
        # Stage 1: Build comparison matrices
        print("Stage 1: Building comparison matrices")
        matrices_result = build_comparison_matrices(input_data, criteria_weights, 
                                                  laptop_comparisons if evaluation_method == "manual" else None)
        if matrices_result.get("status") == "error":
            return jsonify(matrices_result), 400
            
        # Stage 2: Calculate criteria totals
        print("Stage 2: Calculating criteria totals")
        totals_result = calculate_criteria_totals(matrices_result, criteria_weights)
        if totals_result.get("status") == "error":
            return jsonify(totals_result), 400
            
        # Stage 3: Normalize comparison matrices
        print("Stage 3: Normalizing comparison matrices")
        normalize_result = normalize_comparison_matrices(totals_result)
        if normalize_result.get("status") == "error":
            return jsonify(normalize_result), 400
            
        # Stage 4: Calculate weights
        print("Stage 4: Calculating criteria weights")
        weights_result = calculate_criteria_weights(normalize_result)
        if weights_result.get("status") == "error":
            return jsonify(weights_result), 400
            
        # Stage 5: Calculate Lambda Max
        print("Stage 5: Calculating lambda max")
        lambda_result = step2_calculate_lambda_max(weights_result)
        if lambda_result.get("status") == "error":
            return jsonify(lambda_result), 400
            
        # Stage 6: Check consistency
        print("Stage 6: Checking consistency ratio")
        consistency_result = check_consistency_ratio(lambda_result)
        if consistency_result.get("status") == "error":
            return jsonify(consistency_result), 400
            
        # Stage 7: Calculate final scores and ranking
        print("Stage 7: Calculating final scores")
        final_result = calculate_final_scores(consistency_result)
        
        # Return the final result
        return jsonify(final_result)
        
    except Exception as e:
        print(f"Error evaluating laptops: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "status": "error", 
            "message": f"Error evaluating laptops: {str(e)}"
        }), 500

# =================== Main Entry Point ===================

if __name__ == '__main__':
    # Đọc cấu hình từ biến môi trường
    import os
    
    # Thiết lập các biến với giá trị mặc định
    debug_mode = os.environ.get('DEBUG', 'False').lower() == 'true'
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 5000))
    
    # Logging thông tin khởi động
    print(f"Starting application with: DEBUG={debug_mode}, HOST={host}, PORT={port}")
    
    # Khởi động ứng dụng với cấu hình từ biến môi trường
    app.run(debug=debug_mode, host=host, port=port)