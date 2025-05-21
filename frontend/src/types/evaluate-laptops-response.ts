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
  
  // Consistency information
  export interface ConsistencyInfo {
    is_consistent: boolean;
    CR: number;
    message: string;
  }
  
  // Base response interface
  export interface EvaluateLaptopsBaseResponse {
    status: string;
    message?: string;
  }
  
  // Successful response (CR < 0.1)
  export interface EvaluateLaptopsSuccessResponse extends EvaluateLaptopsBaseResponse {
    status: "success";
    message: string;  // e.g. "Laptop ranking completed successfully"
    ranked_laptops: RankedLaptop[];
    laptop_count: number;
    criteria_weights: Record<string, number>;
    stage: string;
    
    // For manual evaluation, consistency checks for each criterion
    consistency_checks?: Record<string, ConsistencyInfo>;
  }
  
  // Failure response (CR > 0.1)
  export interface EvaluateLaptopsFailureResponse extends EvaluateLaptopsBaseResponse {
    status: "error" | "success";  // API might return "success" even with consistency issues
    message: string;  // e.g. "Matrix is inconsistent for criterion: Hiệu năng"
    
    // Information about which criterion failed
    failed_criterion?: string;
    
    // Specific consistency issue details
    consistency_issue?: {
      criterion: string;
      is_consistent: false;
      CR: number; 
      message: string;  // e.g. "Ma trận KHÔNG nhất quán (CR = 0.463 > 0.1)"
    };
  }
  
  // Union type for all possible responses
  export type EvaluateLaptopsResponse = 
    EvaluateLaptopsSuccessResponse | 
    EvaluateLaptopsFailureResponse;
  
  // Helper function to check if response indicates consistency failure
  export function hasConsistencyFailure(response: EvaluateLaptopsResponse): boolean {
    if (response.status === "error") return true;
    
    // Check for consistency_checks with failures
    if ('consistency_checks' in response) {
      const checks = response.consistency_checks || {};
      return Object.values(checks).some(check => !check.is_consistent);
    }
    
    // Check for consistency_issue
    return !!('consistency_issue' in response && response.consistency_issue);
  }