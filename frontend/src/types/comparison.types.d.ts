export interface Comparison {
  row: string;
  column: string;
  value: string | number;
  completed?: boolean;
  selectedCriteria?: string;
}


export interface ApiComparison {
  row: string;
  column: string;
  value: string | number;
  completed?: boolean;
}

export interface ComparisonRequest {
  usage: string;
  fromBudget?: number;
  toBudget?: number;
  performance?: string;
  design?: string;
  fromScreenSize?: number;
  toScreenSize?: number;
  comparisons: ApiComparison[];
}