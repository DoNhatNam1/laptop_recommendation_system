import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { motion } from 'framer-motion';
import {
  Check,
  Cpu,
  DollarSign,
  Monitor,
  Battery,
  Palette, 
  Shield,
  ChevronLeft,
  ThumbsUp,
  Share,
  RefreshCw,
  Info,
  ArrowLeft,
  Database,
  Weight,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { ScrollArea } from "./ui/scroll-area";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { 
      type: "spring",
      stiffness: 100 
    }
  }
};

// Format price
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND', 
    maximumFractionDigits: 0 
  }).format(price);
};

// Interface for Laptop
interface RankedLaptop {
  id: string;
  name: string;
  price: number;
  cpu: string;
  ram: string;
  storage: string;
  screen: string;
  screen_name?: string;
  battery?: string;
  score: number;
  rank: number;
  weight?: number;
  gpu?: string;
}

// Interface for result data
interface ResultData {
  status: string;
  message: string;
  criteria_weights: Record<string, number>;
  ranked_laptops: RankedLaptop[];
  laptop_count: number;
  stage: string;
}

// Criteria type with icon mapping
type CriterionKey = "Hiệu năng" | "Giá" | "Màn hình" | "Pin" | "Thiết kế" | "Độ bền";

// Map criteria to icons
const CRITERIA_ICONS: Record<CriterionKey, any> = {
  "Hiệu năng": Cpu,
  "Giá": DollarSign,
  "Màn hình": Monitor,
  "Pin": Battery,
  "Thiết kế": Palette,
  "Độ bền": Shield
};

// Component for RecommendationResults
function RecommendationResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      try {
        // 1. Ưu tiên lấy kết quả từ state của route (từ LaptopSelectionAndRating)
        if (location.state?.result) {
          console.log("Đã tìm thấy kết quả từ route state:", location.state.result);
          setResult(location.state.result);
          setLoading(false);
          return;
        }

        // 2. Thử lấy từ cookie nếu không có trong state
        const resultFromCookie = Cookies.get("evaluationResults");
        if (resultFromCookie) {
          try {
            const parsedResult = JSON.parse(resultFromCookie);
            if (parsedResult && parsedResult.ranked_laptops?.length > 0) {
              console.log("Đã tìm thấy kết quả từ cookie:", parsedResult);
              setResult(parsedResult);
              setLoading(false);
              return;
            } else {
              console.warn("Kết quả từ cookie không hợp lệ hoặc rỗng");
            }
          } catch (err) {
            console.error("Lỗi khi phân tích kết quả từ cookie:", err);
          }
        }

        // 3. Thử lấy từ localStorage như một backup
        const savedResult = localStorage.getItem("recommendation_result");
        if (savedResult) {
          try {
            const parsedResult = JSON.parse(savedResult);
            if (parsedResult && parsedResult.ranked_laptops?.length > 0) {
              console.log("Đã tìm thấy kết quả từ localStorage:", parsedResult);
              setResult(parsedResult);
              setLoading(false);
              return;
            } else {
              console.warn("Kết quả từ localStorage không hợp lệ hoặc rỗng");
            }
          } catch (err) {
            console.error("Lỗi khi phân tích kết quả từ localStorage:", err);
          }
        }

        // 4. Không tìm thấy kết quả ở đâu, hiển thị lỗi
        console.error("Không tìm thấy kết quả đánh giá từ bất kỳ nguồn nào");
        setError("Không tìm thấy kết quả đánh giá. Vui lòng thực hiện đánh giá laptop trước.");
        setLoading(false);
      } catch (err) {
        console.error("Lỗi không xác định khi tải kết quả:", err);
        setError("Đã xảy ra lỗi khi tải kết quả đánh giá");
        setLoading(false);
      }
    };

    loadResults();
  }, [location.state, navigate]);

  // Hiển thị trạng thái loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 border-4 rounded-full border-slate-200 border-t-blue-500 animate-spin"></div>
        <p className="font-medium text-slate-600">
          Đang tải kết quả đánh giá...
        </p>
      </div>
    );
  }

  // Hiển thị lỗi nếu có
  if (error) {
    return (
      <div className="max-w-2xl p-6 mx-auto my-8 border border-red-200 rounded-lg bg-red-50">
        <h2 className="mb-3 text-xl font-semibold text-red-700">Lỗi</h2>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => navigate('/laptop-selection')}
          className="px-4 py-2 mt-4 text-white transition-colors bg-blue-500 rounded-md hover:bg-blue-600"
        >
          Quay lại trang đánh giá laptop
        </button>
      </div>
    );
  }

  // Sort criteria by weight (descending)
  const sortedCriteria = result?.criteria_weights 
    ? Object.entries(result.criteria_weights)
        .sort(([, weightA], [, weightB]) => weightB - weightA)
    : [];
  
  // Get max score for normalization in chart
  const maxScore = result?.ranked_laptops?.[0]?.score || 0;

  // Render normal view
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Kết quả xếp hạng laptop
              </h1>
              <p className="mt-1 text-slate-500">
                {result?.laptop_count} laptop được xếp hạng theo {sortedCriteria.length} tiêu chí
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  // Xóa tất cả cookie liên quan
                  Cookies.remove("evaluationResults");
                  Cookies.remove("criteriaWeights");
                  Cookies.remove("criteriaList");
                  
                  // Xóa dữ liệu localStorage
                  localStorage.removeItem("recommendation_result");
                  
                  // Điều hướng về trang chủ
                  navigate('/');
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Bắt đầu mới
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Main content */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Left sidebar: Criteria weights and info */}
          <motion.div variants={itemVariants} className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Trọng số tiêu chí</CardTitle>
                <CardDescription>Mức độ quan trọng của từng tiêu chí trong đánh giá</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sortedCriteria.map(([criterion, weight], index) => {
                  const Icon = CRITERIA_ICONS[criterion as CriterionKey] || Info;
                  const weightPercent = (weight * 100).toFixed(1);
                  
                  return (
                    <div key={criterion} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-slate-600" />
                          <span className="font-medium text-slate-700">
                            {criterion}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">
                          {weightPercent}%
                        </span>
                      </div>
                      <Progress value={Number(weightPercent)} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
              <CardFooter>
                <Alert className="bg-slate-50">
                  <Info className="w-4 h-4" />
                  <AlertTitle>Cách xếp hạng</AlertTitle>
                  <AlertDescription className="text-xs text-slate-500">
                    Xếp hạng được tính dựa trên thuật toán AHP (Analytic Hierarchy Process), đánh giá đa tiêu chí dựa trên trọng số và đặc điểm của từng laptop.
                  </AlertDescription>
                </Alert>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Right content: Laptop rankings */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Top laptop được đề xuất</CardTitle>
                <CardDescription>Xếp hạng dựa trên mức độ phù hợp với nhu cầu của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[70vh]">
                  <div className="space-y-5">
                    {result?.ranked_laptops?.map((laptop, index) => {
                      // Calculate score percentage
                      const scorePercent = Math.round((laptop.score / maxScore) * 100);
                      
                      // Add medal for top 3
                      const getMedalColor = (rank: number) => {
                        if (rank === 1) return "bg-yellow-100 text-yellow-700 border-yellow-300";
                        if (rank === 2) return "bg-slate-100 text-slate-700 border-slate-300";
                        if (rank === 3) return "bg-amber-50 text-amber-700 border-amber-200";
                        return "bg-slate-50 text-slate-600 border-slate-200";
                      };

                      // Get medal label
                      const getMedalLabel = (rank: number) => {
                        if (rank === 1) return "Tốt nhất";
                        if (rank === 2) return "Thứ 2";
                        if (rank === 3) return "Thứ 3";
                        return `Hạng ${rank}`;
                      };

                      return (
                        <div 
                          key={laptop.id} 
                          className={`relative border rounded-lg overflow-hidden transition-all ${
                            index === 0 ? "border-yellow-300 ring-1 ring-yellow-300" : "border-slate-200"
                          }`}
                        >
                          {/* Rank badge */}
                          <Badge className={`absolute top-0 right-0 m-3 ${getMedalColor(laptop.rank)}`}>
                            {getMedalLabel(laptop.rank)}
                          </Badge>
                          
                          {/* Main content */}
                          <div className="grid grid-cols-1 md:grid-cols-3 md:gap-4">
                            {/* Left column: Basic info */}
                            <div className="p-4">
                              <h3 className="text-lg font-semibold text-slate-800">{laptop.name}</h3>
                              <p className="mt-1 text-xl font-bold text-blue-600">{formatPrice(laptop.price)}</p>
                              
                              {/* Score bar */}
                              <div className="mt-3">
                                <div className="flex justify-between mb-1 text-sm">
                                  <span className="font-medium text-slate-700">Điểm đánh giá</span>
                                  <span className="text-slate-600">{scorePercent}%</span>
                                </div>
                                <Progress 
                                  value={scorePercent} 
                                  className={`h-2 ${index === 0 ? "bg-yellow-100" : "bg-slate-100"}`} 
                                />
                              </div>
                            </div>

                            {/* Middle column: Specs */}
                            <div className="p-4 border-t bg-slate-50 md:border-t-0 md:border-l border-slate-200">
                              <h4 className="mb-2 font-medium text-slate-700">Thông số kỹ thuật</h4>
                              <div className="grid grid-cols-2 text-sm gap-y-2">
                                <div className="flex items-center gap-1">
                                  <Cpu className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="text-slate-600">{laptop.cpu}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Database className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="text-slate-600">
                                    {laptop.ram} / {laptop.storage}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Monitor className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="text-slate-600">
                                    {laptop.screen}" {laptop.screen_name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Battery className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="text-slate-600">{laptop.battery}</span>
                                </div>
                                {laptop.weight && (
                                  <div className="flex items-center gap-1">
                                    <Weight className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="text-slate-600">{laptop.weight} kg</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right column: Strengths */}
                            <div className="p-4 border-t bg-slate-50 md:border-t-0 md:border-l border-slate-200">
                              <h4 className="mb-2 font-medium text-slate-700">Điểm mạnh</h4>
                              <div className="space-y-1.5">
                                {index === 0 && (
                                  <>
                                    <div className="flex items-center gap-1.5 text-sm">
                                      <div className="bg-green-100 text-green-600 p-0.5 rounded-full">
                                        <Check className="w-3 h-3" />
                                      </div>
                                      <span className="text-slate-600">Cân bằng các tiêu chí</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm">
                                      <div className="bg-green-100 text-green-600 p-0.5 rounded-full">
                                        <Check className="w-3 h-3" />
                                      </div>
                                      <span className="text-slate-600">Hiệu năng tốt với giá cạnh tranh</span>
                                    </div>
                                  </>
                                )}
                                
                                {laptop.cpu.includes("Ryzen 7") || laptop.cpu.includes("i7") ? (
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <div className="bg-green-100 text-green-600 p-0.5 rounded-full">
                                      <Check className="w-3 h-3" />
                                    </div>
                                    <span className="text-slate-600">CPU hiệu năng cao</span>
                                  </div>
                                ) : null}

                                {Number(laptop.battery?.replace(/[^0-9]/g, '')) > 40000 ? (
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <div className="bg-green-100 text-green-600 p-0.5 rounded-full">
                                      <Check className="w-3 h-3" />
                                    </div>
                                    <span className="text-slate-600">Pin trâu</span>
                                  </div>
                                ) : null}

                                {(laptop.screen_name?.toLowerCase().includes("oled") || laptop.screen_name?.toLowerCase().includes("qhd")) ? (
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <div className="bg-green-100 text-green-600 p-0.5 rounded-full">
                                      <Check className="w-3 h-3" />
                                    </div>
                                    <span className="text-slate-600">Màn hình chất lượng cao</span>
                                  </div>
                                ) : null}

                                {laptop.storage?.includes("1TB") ? (
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <div className="bg-green-100 text-green-600 p-0.5 rounded-full">
                                      <Check className="w-3 h-3" />
                                    </div>
                                    <span className="text-slate-600">Dung lượng lưu trữ lớn</span>
                                  </div>
                                ) : null}

                                {laptop.weight && laptop.weight < 1.3 ? (
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <div className="bg-green-100 text-green-600 p-0.5 rounded-full">
                                      <Check className="w-3 h-3" />
                                    </div>
                                    <span className="text-slate-600">Siêu nhẹ, dễ dàng di chuyển</span>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Share className="w-4 h-4 mr-1" />
                        Chia sẻ kết quả
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tính năng sẽ có trong phiên bản sắp tới</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default RecommendationResults;