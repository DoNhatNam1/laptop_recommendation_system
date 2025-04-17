export interface Laptop {
    battery: number;
    build_quality: string;
    cpu: string;
    design: string;
    gpu: string;
    id: string;
    name: string;
    price: number;
    ram: string;
    screen: number;
    screenName: string;
    storage: string;
    usage: string;
  }
  
  export interface RankedLaptop extends Laptop {
    performance: string;
    rank: number;
    total_score: number;
  }
  
  export interface LaptopsByUsage {
    gaming?: {
      laptops: Laptop[];
      usage: string;
    };
    mobility?: {
      laptops: Laptop[];
      usage: string;
    };
    office?: {
      laptops: Laptop[];
      usage: string;
    };
  }