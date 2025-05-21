export interface Comparison {
  row: string;        // First criterion name (e.g., "Hiệu năng")
  column: string;     // Second criterion name (e.g., "Giá")
  value: number | string; // Comparison value (e.g., 7 or "1/5")
}

export interface ProcessComparisonsRequest {
  // Laptop filtering parameters
  usage: string;               // "office", "gaming", etc.
  fromBudget?: number;         // Min price (e.g., 15000000)
  toBudget?: number;           // Max price (e.g., 25000000)
  performance?: string;        // "smooth", "powerful", etc.
  design?: string;             // "lightweight", "premium", etc.
  fromScreenSize?: number;     // Min screen size (e.g., 13)
  toScreenSize?: number;       // Max screen size (e.g., 14.9)
  
  // Pairwise comparison data
  comparisons: Comparison[];
}