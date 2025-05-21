import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Cpu, 
  DollarSign, 
  Monitor, 
  Battery, 
  Palette, 
  Shield,
  Disc,
  Weight,
  InfoIcon,
  ArrowLeft,
  ArrowRight,
  HelpCircle
} from "lucide-react";

import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { toast } from "./ui/use-toast";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
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
  },
};

// Tiêu chí cơ bản cho mỗi mục đích sử dụng
const CRITERIA_BY_USAGE = {
  office: [
    { id: "performance", name: "Hiệu năng", description: "Tốc độ xử lý và khả năng đa nhiệm", icon: Cpu, color: "bg-blue-500" },
    { id: "price", name: "Giá", description: "Chi phí mua laptop", icon: DollarSign, color: "bg-green-500" },
    { id: "display", name: "Màn hình", description: "Chất lượng hiển thị và độ phân giải", icon: Monitor, color: "bg-purple-500" },
    { id: "battery", name: "Pin", description: "Thời lượng sử dụng khi không cắm sạc", icon: Battery, color: "bg-amber-500" },
    { id: "design", name: "Thiết kế", description: "Kiểu dáng và chất liệu", icon: Palette, color: "bg-rose-500" },
    { id: "durability", name: "Độ bền", description: "Khả năng chịu đựng theo thời gian", icon: Shield, color: "bg-teal-500" },
  ],
  gaming: [
    { id: "performance", name: "Hiệu năng", description: "Sức mạnh xử lý CPU", icon: Cpu, color: "bg-blue-500" },
    { id: "graphics", name: "Card đồ họa", description: "Khả năng xử lý đồ họa game", icon: Disc, color: "bg-indigo-500" },
    { id: "display", name: "Màn hình", description: "Tần số quét và chất lượng hiển thị", icon: Monitor, color: "bg-purple-500" },
    { id: "cooling", name: "Tản nhiệt", description: "Khả năng làm mát khi chơi game", icon: Disc, color: "bg-orange-500" },
    { id: "price", name: "Giá", description: "Chi phí mua laptop", icon: DollarSign, color: "bg-green-500" },
    { id: "durability", name: "Độ bền", description: "Khả năng chịu đựng qua thời gian", icon: Shield, color: "bg-teal-500" },
  ],
  mobility: [
    { id: "battery", name: "Pin", description: "Thời lượng sử dụng khi di chuyển", icon: Battery, color: "bg-amber-500" },
    { id: "weight", name: "Trọng lượng", description: "Độ nhẹ và di động", icon: Weight, color: "bg-cyan-500" },
    { id: "performance", name: "Hiệu năng", description: "Khả năng xử lý khi di chuyển", icon: Cpu, color: "bg-blue-500" },
    { id: "price", name: "Giá", description: "Chi phí mua laptop", icon: DollarSign, color: "bg-green-500" },
    { id: "display", name: "Màn hình", description: "Kích thước và chất lượng hiển thị", icon: Monitor, color: "bg-purple-500" },
    { id: "durability", name: "Độ bền", description: "Khả năng chịu va đập", icon: Shield, color: "bg-teal-500" },
  ],
};

function CustomCriteriaSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [availableCriteria, setAvailableCriteria] = useState<any[]>([]);
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Extract parameters from URL instead of location state
  const usage = searchParams.get('usage') || '';
  
  // Lấy thông tin từ URL parameters
  useEffect(() => {
    // Kiểm tra xem có đủ dữ liệu đầu vào hay không
    const requiredFields = ['usage', 'fromBudget', 'toBudget', 'fromScreenSize', 
                           'toScreenSize', 'performance', 'design'];
    const missingFields = requiredFields.filter(field => !searchParams.get(field));
    
    if (missingFields.length > 0) {
      console.error("Thiếu thông tin cần thiết:", missingFields);
      navigate('/criteria', { 
        state: { 
          error: "Thiếu thông tin cần thiết để tiến hành chọn tiêu chí. Vui lòng thực hiện lại." 
        }
      });
      return;
    }
    
    // Lấy tiêu chí dựa vào mục đích sử dụng
    const criteriaList = CRITERIA_BY_USAGE[usage as keyof typeof CRITERIA_BY_USAGE] || CRITERIA_BY_USAGE.office;
    setAvailableCriteria(criteriaList);
    
    // Mặc định chọn 3 tiêu chí đầu tiên
    setSelectedCriteria(criteriaList.slice(0, 3).map(c => c.id));
  }, [searchParams, navigate, usage]);
  
  const handleCriteriaToggle = (criteriaId: string) => {
    setSelectedCriteria(prev => {
      if (prev.includes(criteriaId)) {
        // Nếu đã có thì xóa đi, nhưng kiểm tra để đảm bảo còn ít nhất 2 tiêu chí
        const newSelection = prev.filter(id => id !== criteriaId);
        if (newSelection.length < 2) {
          toast({
            title: "Cần ít nhất 2 tiêu chí",
            description: "Vui lòng chọn ít nhất 2 tiêu chí để tiếp tục",
            variant: "destructive"
          });
          return prev;
        }
        return newSelection;
      } else {
        // Nếu chưa có thì thêm vào, nhưng kiểm tra để đảm bảo không quá 6 tiêu chí
        if (prev.length >= 6) {
          toast({
            title: "Đã đạt giới hạn tiêu chí",
            description: "Bạn chỉ có thể chọn tối đa 6 tiêu chí",
            variant: "destructive"
          });
          return prev;
        }
        return [...prev, criteriaId];
      }
    });
    setError(null);
  };
  
  // Tính số lượng phép so sánh cặp dựa trên số tiêu chí đã chọn
  const getComparisonCount = () => {
    const n = selectedCriteria.length;
    return n > 1 ? (n * (n - 1)) / 2 : 0;
  };
  
  const handleContinue = () => {
    if (selectedCriteria.length < 2) {
      setError("Vui lòng chọn ít nhất 2 tiêu chí để so sánh");
      return;
    }
    
    if (selectedCriteria.length > 6) {
      setError("Vui lòng chọn tối đa 6 tiêu chí để so sánh");
      return;
    }
    
    // Lấy tên tiêu chí tương ứng với ID đã chọn
    const selectedCriteriaNames = selectedCriteria.map(id => {
      const criterion = availableCriteria.find(c => c.id === id);
      return criterion ? criterion.name : id;
    });
    
    // Create URL parameters object for next page
    const params = new URLSearchParams(searchParams);
    
    // Add selected criteria names as a comma-separated list
    params.set('criteria', selectedCriteriaNames.join(','));
    
    // Navigate to pairwise comparison with URL parameters
    navigate(`/criteria-pairwise?${params.toString()}`);
  };
  
  // Lấy tên mục đích sử dụng để hiển thị
  const getUsageTitle = () => {
    switch (usage) {
      case "office":
        return "Học tập & Văn phòng";
      case "gaming":
        return "Gaming & Đồ họa";
      case "mobility":
        return "Di chuyển nhiều";
      default:
        return "Chưa xác định";
    }
  };

  // Handle going back to previous step while preserving parameters
  const handleBack = () => {
    navigate(`/criteria?${searchParams.toString()}`);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative min-h-screen px-4 py-8 overflow-hidden bg-gradient-to-b from-slate-50 to-white"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 right-0 -translate-y-1/2 rounded-full w-96 h-96 bg-gradient-to-br from-indigo-200 to-indigo-400 filter blur-3xl opacity-20 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 rounded-full w-80 h-80 bg-gradient-to-tr from-blue-200 to-blue-400 filter blur-3xl opacity-20 -translate-x-1/3"></div>
        <div className="absolute inset-0 bg-grid-slate-100/[0.05] bg-[length:20px_20px]"></div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        <motion.div variants={itemVariants} className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-800">
            Bước 2: Chọn tiêu chí so sánh
          </h1>
          <p className="text-slate-600">
            Mục đích sử dụng:{" "}
            <span className="font-medium text-indigo-600">
              {getUsageTitle()}
            </span>
          </p>

          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="h-2.5 w-2.5 rounded-full bg-indigo-500"></div>
            <div className="w-16 h-1 bg-indigo-500 rounded-full"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-indigo-500"></div>
            <div className="w-16 h-1 bg-indigo-300 rounded-full"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-indigo-300"></div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">
                Tiêu chí đã chọn: {selectedCriteria.length}/6
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-6 h-6 p-0">
                      <HelpCircle className="w-4 h-4 text-gray-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Chọn từ 2-6 tiêu chí quan trọng nhất với bạn khi mua laptop</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="font-semibold text-indigo-600">
              {getComparisonCount()} phép so sánh
            </span>
          </div>
          <Progress value={(selectedCriteria.length / 6) * 100} className="h-3" />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="mb-6 border-none shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-center text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">
                Chọn tiêu chí quan trọng với bạn
              </CardTitle>
              <CardDescription className="text-center text-gray-600">
                Chọn từ 2-6 tiêu chí để so sánh độ quan trọng
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                {availableCriteria.map((criteria) => {
                  const Icon = criteria.icon;
                  const isSelected = selectedCriteria.includes(criteria.id);
                  
                  return (
                    <motion.div 
                      key={criteria.id}
                      variants={itemVariants}
                      whileHover={{ y: -3, transition: { duration: 0.2 } }}
                      className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer ${
                        isSelected 
                          ? "border-indigo-400 bg-indigo-50" 
                          : "border-gray-200 bg-white"
                      } transition-colors`}
                      onClick={() => handleCriteriaToggle(criteria.id)}
                    >
                      <div className={`${criteria.color} text-white p-2 rounded-full flex-shrink-0`}>
                        <Icon size={20} />
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-800">{criteria.name}</div>
                          {isSelected && (
                            <Badge variant="outline" className="ml-auto text-xs text-indigo-700 bg-indigo-100 border-indigo-200">
                              Đã chọn
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{criteria.description}</p>
                      </div>
                      
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => handleCriteriaToggle(criteria.id)}
                        className="mt-1 ml-auto"
                      />
                    </motion.div>
                  );
                })}
              </div>
              
              <div className="p-4 mt-6 text-sm rounded-lg bg-blue-50">
                <div className="flex items-center gap-2 mb-2 text-blue-700">
                  <InfoIcon className="w-5 h-5" />
                  <span className="font-medium">Hướng dẫn</span>
                </div>
                <ul className="ml-5 space-y-1 text-blue-600 list-disc">
                  <li>Chọn ít nhất 2 tiêu chí để so sánh</li>
                  <li>Tối đa 6 tiêu chí để quá trình so sánh không quá phức tạp</li>
                  <li>Số lượng phép so sánh phụ thuộc vào số tiêu chí bạn chọn</li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between py-4 border-t border-gray-100">
              <Button
                onClick={handleBack}
                variant="outline"
                className="gap-2 bg-white hover:bg-gray-50"
              >
                <ArrowLeft size={16} />
                Quay lại
              </Button>

              <Button
                onClick={handleContinue}
                disabled={selectedCriteria.length < 2}
                className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                Tiếp tục so sánh
                <ArrowRight size={16} />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="text-center">
          <p className="text-sm text-gray-500">
            Bạn sẽ thực hiện <span className="font-medium text-indigo-600">{getComparisonCount()} phép so sánh cặp</span> để đánh giá độ quan trọng
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default CustomCriteriaSelection;