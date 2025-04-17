import { RankedLaptop } from './laptop.types';
import { Comparison } from './comparison.types';

export interface ProcessingTask {
  message: string;
  status: string;
  taskId: string;
}

export interface ProcessingStatus {
  message: string;
  progress: number;
  status: string;
}

export interface ProcessingResult {
  filtered_laptops_count: number;
  ranked_laptops: RankedLaptop[];
  status: string;
  title: string;
  weights: Record<string, number>;
}

export interface ComparisonRequest {
  usage: string;
  fromBudget?: number;
  toBudget?: number;
  performance?: string;
  design?: string;
  fromScreenSize?: number;
  toScreenSize?: number;
  comparisons: Comparison[];
}