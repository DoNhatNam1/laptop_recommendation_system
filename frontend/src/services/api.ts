import axios from 'axios';
import {
  // Import new type definitions
  ProcessComparisonsRequest,
  ProcessComparisonsResponse,
  EvaluateLaptopsRequest,
  EvaluateLaptopsResponse,
  EvaluateLaptopsSuccessResponse,
  RankedLaptop,
  ConsistencyInfo,
  Laptop,
  AlternativePriorityItem
} from '../types';

interface LaptopsByUsage {
  laptops: Laptop[];
  // Add any other properties that might be in the response
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const apiService = {
  /**
   * Process criteria comparisons and get the result directly
   * @param data Comparison request data
   * @returns Processed comparison result
   */
  processComparisons: async (data: ProcessComparisonsRequest): Promise<ProcessComparisonsResponse> => {
    try {
      const response = await api.post('/process-comparisons', data);
      return response.data;
    } catch (error) {
      console.error("API - Error processing comparisons:", error);
      throw error;
    }
  },

  /**
   * Evaluate laptops and get ranking results directly
   * @param data Evaluation request data with laptop details and criteria
   * @returns Laptop evaluation results with rankings
   */
  evaluateLaptops: async (data: EvaluateLaptopsRequest): Promise<EvaluateLaptopsResponse> => {
    try {
      const response = await api.post('/evaluate-laptops', data);
      return response.data;
    } catch (error) {
      console.error("API - Error evaluating laptops:", error);
      throw error;
    }
  },

  getLaptopsByUsage: async (params: any): Promise<LaptopsByUsage> => {
    try {
      const response = await api.get('/laptops-by-usage', {
        params: params,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      return response.data;
    } catch (error: unknown) {
      throw error;
    }
  },

  /**
   * Check API server status
   * @returns Status information
   */
  checkApiStatus: async (): Promise<{status: string, message: string}> => {
    try {
      const response = await api.get('/status');
      return response.data;
    } catch (error) {
      console.error("API - Error checking API status:", error);
      throw error;
    }
  },

  /**
   * Check if matrix results are consistent
   * @param response The response from processComparisons
   * @returns True if matrix is consistent (CR < 0.1)
   */
  isMatrixConsistent: (response: ProcessComparisonsResponse): boolean => {
    if (response.status === "error") return false;
    if ('consistency' in response) {
      return response.consistency.is_consistent;
    }
    return false;
  },

  /**
   * Check if all matrices in laptop evaluation are consistent
   * @param response The response from evaluateLaptops
   * @returns True if all matrices are consistent
   */
  areAllMatricesConsistent: (response: EvaluateLaptopsResponse): boolean => {
    if (response.status === "error") return false;
    
    // Check for overall consistency issues
    if ('consistency_issue' in response && response.consistency_issue) {
      return false;
    }
    
    // Kiểm tra consistency_status (cơ chế mới)
    if ('consistency_status' in response && response.consistency_status) {
      return Object.values(response.consistency_status)
        .every(status => status === true);
    }
    
    // Fall back to alternatives_consistency
    if ('alternatives_consistency' in response && response.alternatives_consistency) {
      return Object.values(response.alternatives_consistency)
        .every(check => check.is_consistent);
    }
    
    return true;
  },

  /**
   * Get top ranked laptops from evaluation results
   * @param response Evaluation response
   * @param limit Maximum number of laptops to return
   * @returns Array of top ranked laptops
   */
  getTopRankedLaptops: (response: EvaluateLaptopsResponse, limit = 3): RankedLaptop[] => {
    if (response.status === "error" || !('ranked_laptops' in response)) {
      return [];
    }
    
    return response.ranked_laptops.slice(0, limit);
  },

  /**
   * Kiểm tra nhất quán của ma trận tiêu chí cụ thể
   * @param response Kết quả đánh giá laptop
   * @param criterion Tên tiêu chí cần kiểm tra
   * @returns True nếu ma trận tiêu chí nhất quán, false nếu không nhất quán hoặc không tìm thấy
   */
  isCriterionConsistent: (response: EvaluateLaptopsResponse, criterion: string): boolean => {
    if (response.status === "error") return false;
    
    // Check consistency_status (new structure)
    if ('consistency_status' in response && 
        typeof response.consistency_status === 'object' && 
        response.consistency_status !== null && 
        criterion in response.consistency_status) {
      return response.consistency_status[criterion];
    }
    
    return true; // Assume consistent if not found
  },
  
  /**
   * Lấy thông tin nhất quán của một tiêu chí
   * @param response Kết quả đánh giá laptop
   * @param criterion Tên tiêu chí
   * @returns Thông tin nhất quán hoặc null nếu không tìm thấy
   */
  getConsistencyInfo: (response: EvaluateLaptopsResponse, criterion: string): ConsistencyInfo | null => {
    if (response.status === "error") return null;
    
    // Nếu không có alternatives_consistency, tạo từ thông tin riêng lẻ
    if ('consistency_status' in response && 
        typeof response.consistency_status === 'object' &&
        response.consistency_status !== null &&
        'lambda_max' in response &&
        'ci_values' in response &&
        'cr_results' in response &&
        'ri_values' in response &&
        criterion in response.consistency_status) {
      
      const successResponse = response as EvaluateLaptopsSuccessResponse;
      
      return {
        is_consistent: successResponse.consistency_status[criterion],
        CR: successResponse.cr_results[criterion], 
        CI: successResponse.ci_values[criterion],
        RI: successResponse.ri_values[criterion],
        lambda_max: successResponse.lambda_max[criterion],
        consistency_vector: successResponse.consistency_vectors?.[criterion],
        message: successResponse.consistency_status[criterion]
          ? `Ma trận nhất quán (CR = ${successResponse.cr_results[criterion].toFixed(3)})`
          : `Ma trận không nhất quán (CR = ${successResponse.cr_results[criterion].toFixed(3)} > 0.1)`
      };
    }
    
    return null;
  },
  
  /**
   * Lấy ma trận so sánh gốc cho một tiêu chí
   * @param response Kết quả đánh giá laptop
   * @param criterion Tên tiêu chí
   * @returns Ma trận so sánh hoặc null nếu không tìm thấy
   */
  getComparisonMatrix: (response: EvaluateLaptopsResponse, criterion: string): number[][] | null => {
    if (response.status === "error") return null;
    
    // Sử dụng original_matrices
    if ('original_matrices' in response && response.original_matrices) {
      return response.original_matrices[criterion] || null;
    }
    
    return null;
  },

  /**
   * Lấy ma trận chuẩn hóa cho một tiêu chí
   * @param response Kết quả đánh giá laptop
   * @param criterion Tên tiêu chí
   * @returns Ma trận chuẩn hóa hoặc null nếu không tìm thấy
   */
  getNormalizedMatrix: (response: EvaluateLaptopsResponse, criterion: string): number[][] | null => {
    if (response.status === "error" || 
        !('normalized_matrices' in response) || 
        !response.normalized_matrices) { // Thêm kiểm tra null/undefined
      return null;
    }
    
    return response.normalized_matrices[criterion] || null;
  },

  /**
   * Lấy vector ưu tiên (priority vector) cho một tiêu chí
   * @param response Kết quả đánh giá laptop
   * @param criterion Tên tiêu chí
   * @returns Vector ưu tiên hoặc null nếu không tìm thấy
   */
  getPriorityVector: (response: EvaluateLaptopsResponse, criterion: string): number[] | null => {
    if (response.status === "error") return null;
    
    // Kiểm tra sự tồn tại của alternative_priority_tables
    if ('alternative_priority_tables' in response && 
        response.alternative_priority_tables && 
        criterion in response.alternative_priority_tables) {
      return response.alternative_priority_tables[criterion].map(item => item.weight);
    }
    
    // Thử từ criteria_priority_tables nếu có
    if ('criteria_priority_tables' in response && 
        response.criteria_priority_tables && 
        criterion in response.criteria_priority_tables) {
      return response.criteria_priority_tables[criterion].map(item => item.weight);
    }
    
    return null;
  },
  
  /**
   * Lấy bảng trọng số phương án cho một tiêu chí
   * @param response Kết quả đánh giá laptop
   * @param criterion Tên tiêu chí
   * @returns Bảng trọng số phương án hoặc null nếu không tìm thấy
   */
  getPriorityTable: (response: EvaluateLaptopsResponse, criterion: string): AlternativePriorityItem[] | null => {
    if (response.status === "error") return null;
    
    // Thử lấy từ alternative_priority_tables (cấu trúc mới)
    if ('alternative_priority_tables' in response && response.alternative_priority_tables) {
      return response.alternative_priority_tables[criterion] || null;
    }
    
    // Thử lấy từ criteria_priority_tables (cấu trúc mới)
    if ('criteria_priority_tables' in response && response.criteria_priority_tables) {
      return response.criteria_priority_tables[criterion] || null;
    }
    
    return null;
  },
  
  /**
   * Tạo thông báo tổng quan về tính nhất quán của các ma trận
   * @param response Kết quả đánh giá laptop
   * @returns Thông báo tổng quan về tính nhất quán
   */
  getConsistencySummary: (response: EvaluateLaptopsResponse): string => {
    if (response.status === "error") {
      return "Có lỗi trong quá trình đánh giá, không thể kiểm tra tính nhất quán";
    }
    
    // Chỉ sử dụng consistency_status (không dùng alternatives_consistency)
    if ('consistency_status' in response && response.consistency_status) {
      const inconsistentCriteria = Object.entries(response.consistency_status)
        .filter(([_, isConsistent]) => !isConsistent)
        .map(([criterion, _]) => criterion);
      
      if (inconsistentCriteria.length === 0) {
        return "Tất cả ma trận phương án đều nhất quán (CR < 0.1)";
      }
      
      return `Các ma trận phương án sau không nhất quán: ${inconsistentCriteria.join(', ')}`;
    }
    
    // Nếu không có thông tin về tính nhất quán
    return "Không có thông tin về độ nhất quán của các ma trận phương án";
  }
};

export default apiService;