export interface CriterionWeight {
    criterion: string;
    weight: number;
    percentage: number;
  }
  
  export interface ConsistencyData {
    vector: number[];
    lambda_max: number;
    CI: number;
    RI: number;
    CR: number;
    is_consistent: boolean;
    message: string;
  }
  
  export interface ProcessComparisonsBaseResponse {
    status: string;
    step?: string;
  }
  
  export interface ProcessComparisonsSuccessResponse extends ProcessComparisonsBaseResponse {
    status: "success";
    step: "step1_complete";
    
    // Matrix data
    matrix: {
      criteria_order: string[];
      data: number[][];
    };
    
    column_sums: number[];
    normalized_matrix: number[][];
    
    // Weight results
    weights: {
      values: number[];
      formatted: CriterionWeight[];
    };
    
    // Consistency analysis
    consistency: ConsistencyData;
  }
  
  export interface ProcessComparisonsErrorResponse extends ProcessComparisonsBaseResponse {
    status: "error";
    message: string;
  }
  
  export type ProcessComparisonsResponse = 
    ProcessComparisonsSuccessResponse | 
    ProcessComparisonsErrorResponse;
  
  // Helper function to check if matrix is consistent
  export function isMatrixConsistent(response: ProcessComparisonsResponse): boolean {
    if (response.status === "error") return false;
    return response.consistency?.is_consistent ?? false;
  }