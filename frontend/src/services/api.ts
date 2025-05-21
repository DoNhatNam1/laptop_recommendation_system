import axios from 'axios';
import {
  // Import new type definitions
  ProcessComparisonsRequest,
  ProcessComparisonsResponse,
  EvaluateLaptopsRequest,
  EvaluateLaptopsResponse,
  RankedLaptop,                          
  Laptop // Import Laptop type
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
    
    // Check consistency_checks if present
    if ('consistency_checks' in response && response.consistency_checks) {
      return Object.values(response.consistency_checks)
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
  }
};

export default apiService;