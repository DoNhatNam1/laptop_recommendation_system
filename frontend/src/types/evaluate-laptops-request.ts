export interface Laptop {
  id: string | number;
  name: string;
  price: number;
  cpu: string;
  ram: string;
  storage: string;
  screen_size: number;
  battery: string;
  weight: number;
  
  // Optional properties
  gpu?: string;
  screen?: string;
  screen_name?: string;
  performance?: string;
  design?: string;
  usage?: string;
}

export interface SelectedLaptop {
  id: string | number;
  name: string;
}

export interface LaptopComparison {
  row: string;      // First laptop name
  column: string;   // Second laptop name
  value: number | string;  // Comparison value (can be fraction like "1/2" or number)
}

// Base request interface with common properties
export interface EvaluateLaptopsBaseRequest {
  criteria_weights: Record<string, number>;  // Maps criteria names to weights
  filtered_laptops: Laptop[];
  evaluationMethod: "auto" | "manual";
}

// Auto evaluation request
export interface EvaluateLaptopsAutoRequest extends EvaluateLaptopsBaseRequest {
  evaluationMethod: "auto";
  // No additional fields needed
}

// Manual evaluation request
export interface EvaluateLaptopsManualRequest extends EvaluateLaptopsBaseRequest {
  evaluationMethod: "manual";
  selectedLaptops: SelectedLaptop[];
  // Key is criterion name, value is array of comparisons
  laptopComparisons: Record<string, LaptopComparison[]>;
}

// Union type for all request types
export type EvaluateLaptopsRequest = 
  EvaluateLaptopsAutoRequest | 
  EvaluateLaptopsManualRequest;