import axios from 'axios';
import {
  ComparisonRequest,
  LaptopsByUsage,
  ProcessingResult,
  ProcessingStatus,
  ProcessingTask
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const apiService = {
  processComparisons: async (data: ComparisonRequest): Promise<ProcessingTask> => {
    const response = await api.post('/process-comparisons', data);
    return response.data;
  },

  checkProcessingStatus: async (taskId: string): Promise<ProcessingStatus> => {
    try {
      console.log(`API - Checking status for taskId: ${taskId}`);
      const response = await api.get(`/processing-status/${taskId}`);
      console.log("API - Processing status raw response:", response);

      // Đảm bảo response luôn có progress
      if (response.data && response.data.status) {
        if (!response.data.progress && response.data.progress !== 0) {
          if (response.data.status === "completed") {
            response.data.progress = 100;
          } else if (response.data.status === "processing") {
            // Nếu không có giá trị progress, mặc định là 50%
            response.data.progress = 50;
          } else if (response.data.status === "error") {
            response.data.progress = 0;
          }
        }
      }
      
      return response.data;
    } catch (error) {
      console.error("API - Error checking status:", error);
      throw error;
    }
  },

  getProcessingResult: async (taskId: string): Promise<ProcessingResult> => {
    const response = await api.get(`/processing-result/${taskId}`);
    return response.data;
  },

  getLaptopsByUsage: async (): Promise<LaptopsByUsage> => {
    const response = await api.get('/laptops-by-usage');
    return response.data;
  }
};

export default apiService;