// Laptop with score and ranking
export interface RankedLaptop {
  id: string | number;
  name: string;
  score: number;
  rank: number;
  
  // Original laptop properties (preserved in response)
  price?: number;
  cpu?: string;
  ram?: string;
  storage?: string;
  screen_size?: number;
  screen?: string;
  screen_name?: string;
  battery?: string;
  weight?: number;
  gpu?: string;
  performance?: string;
  design?: string;
  usage?: string;
}

// Alternative Priority Table Item
export interface AlternativePriorityItem {
  laptop_id: string | number;
  laptop_name: string;
  weight: number;
}

// Enhanced Consistency information
export interface ConsistencyInfo {
  is_consistent: boolean;
  CR: number;
  CI: number;
  RI: number;
  lambda_max: number;
  consistency_vector?: number[];
  message: string;
}

// Base response interface
export interface EvaluateLaptopsBaseResponse {
  status: string;
  message?: string;
}

// Successful response
export interface EvaluateLaptopsSuccessResponse extends EvaluateLaptopsBaseResponse {
  status: "success";
  message: string;
  stage: string;
  laptop_count: number;
  ranked_laptops: RankedLaptop[];
  criteria_weights: Record<string, number>;
  
  // Ma trận so sánh và kết quả đánh giá
  original_matrices: Record<string, number[][]>;
  column_sums: Record<string, number[]>;
  normalized_matrices: Record<string, number[][]>;
  
  // Trọng số phương án theo từng tiêu chí
  alternative_priority_tables: Record<string, AlternativePriorityItem[]>;
  criteria_priority_tables?: Record<string, AlternativePriorityItem[]>;
  
  // Thông tin đánh giá tính nhất quán
  lambda_max: Record<string, number>;
  ci_values: Record<string, number>;
  cr_results: Record<string, number>;
  ri_values: Record<string, number>;
  consistency_status: Record<string, boolean>;
  consistency_vectors: Record<string, number[]>;
}

// Failure response (CR > 0.1)
export interface EvaluateLaptopsFailureResponse extends EvaluateLaptopsBaseResponse {
  status: "error" | "success";  // API might return "success" even with consistency issues
  message: string;  
  
  // Information about which criterion failed
  failed_criterion?: string;
  
  // Specific consistency issue details
  consistency_issue?: {
    criterion: string;
    is_consistent: false;
    CR: number; 
    message: string;
  };
  
  // Thêm các trường mà bạn chắc chắn tồn tại trong cả success và failure response
  alternative_priority_tables: Record<string, AlternativePriorityItem[]>;
  criteria_priority_tables?: Record<string, AlternativePriorityItem[]>;
  original_matrices?: Record<string, number[][]>;
  normalized_matrices?: Record<string, number[][]>;
  
  // Thêm các trường nhất quán
  consistency_status?: Record<string, boolean>;
  lambda_max?: Record<string, number>;
  ci_values?: Record<string, number>;
  cr_results?: Record<string, number>;
  ri_values?: Record<string, number>;
}

// Union type for all possible responses
export type EvaluateLaptopsResponse = 
  EvaluateLaptopsSuccessResponse | 
  EvaluateLaptopsFailureResponse;

// Helper function to check if response indicates consistency failure
export function hasConsistencyFailure(response: EvaluateLaptopsResponse): boolean {
  if (response.status === "error") return true;
  
  // Check if any criteria have consistency issues
  if ('consistency_status' in response && response.consistency_status) {  // Thêm kiểm tra null/undefined
    return Object.values(response.consistency_status).some(status => status === false);
  }
  
  return false;
}

// Helper function to check if all alternative matrices are consistent
export function areAllAlternativesConsistent(response: EvaluateLaptopsResponse): boolean {
  if (response.status === "error" || 
      !('consistency_status' in response) || 
      !response.consistency_status) {  // Thêm kiểm tra null/undefined
    return false;
  }
  
  // Bây giờ TypeScript biết rằng consistency_status chắc chắn không phải undefined
  return Object.values(response.consistency_status).every(status => status === true);
}

// Helper function to get formatted consistency message
export function getAlternativeConsistencyMessage(response: EvaluateLaptopsResponse): string {
  if (response.status === "error" || 
      !('consistency_status' in response) || 
      !response.consistency_status) {  // Thêm kiểm tra null/undefined
    return "Không có thông tin về độ nhất quán của ma trận phương án";
  }
  
  const consistencyStatus = response.consistency_status;
  const inconsistentCriteria = Object.entries(consistencyStatus)
    .filter(([_, isConsistent]) => !isConsistent)
    .map(([criterion, _]) => criterion);
  
  if (inconsistentCriteria.length === 0) {
    return "Tất cả ma trận phương án đều nhất quán (CR < 0.1)";
  }
  
  return `Các ma trận phương án sau không nhất quán: ${inconsistentCriteria.join(', ')}`;
}

// Helper function to get consistency info for a specific criterion
export function getCriterionConsistencyInfo(response: EvaluateLaptopsResponse, criterion: string): ConsistencyInfo | null {
  if (response.status === "error" || !('cr_results' in response)) {
    return null;
  }
  
  const successResponse = response as EvaluateLaptopsSuccessResponse;
  
  if (
    criterion in successResponse.consistency_status && 
    criterion in successResponse.cr_results && 
    criterion in successResponse.ci_values && 
    criterion in successResponse.lambda_max && 
    criterion in successResponse.ri_values
  ) {
    return {
      is_consistent: successResponse.consistency_status[criterion],
      CR: successResponse.cr_results[criterion],
      CI: successResponse.ci_values[criterion],
      RI: successResponse.ri_values[criterion],
      lambda_max: successResponse.lambda_max[criterion],
      consistency_vector: successResponse.consistency_vectors[criterion],
      message: successResponse.consistency_status[criterion] 
        ? `Ma trận nhất quán (CR = ${successResponse.cr_results[criterion].toFixed(3)})` 
        : `Ma trận không nhất quán (CR = ${successResponse.cr_results[criterion].toFixed(3)} > 0.1)`
    };
  }
  
  return null;
}