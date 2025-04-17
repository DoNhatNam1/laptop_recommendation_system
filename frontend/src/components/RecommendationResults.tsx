import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import {
  ArrowLeft,
  Award,
  Cpu,
  Monitor,
  HardDrive,
  Battery,
  PieChart,
  Zap,
  Weight,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { ProcessingResult } from "@/types";

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
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
};

function RecommendationResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    // Lấy kết quả từ state của location
    if (location.state?.result) {
      setResult(location.state.result);
    } else {
      // Hoặc lấy từ localStorage nếu đã lưu
      const savedResult = localStorage.getItem("recommendation_result");
      if (savedResult) {
        try {
          setResult(JSON.parse(savedResult));
        } catch (error) {
          console.error("Error parsing result from localStorage:", error);
          navigate("/");
        }
      } else {
        // Nếu không có kết quả, điều hướng về trang chủ
        navigate("/");
      }
    }
  }, [location.state, navigate]);

  // Lưu kết quả vào localStorage khi có kết quả
  useEffect(() => {
    if (result) {
      localStorage.setItem("recommendation_result", JSON.stringify(result));
    }
  }, [result]);

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 text-center">
          <h2 className="mb-4 text-xl font-semibold">Đang tải kết quả...</h2>
          <Progress value={30} className="w-80" />
        </div>
      </div>
    );
  }

  // Phân loại laptop theo thiết kế và hiệu năng
  const laptopCategories = {
    all: result.ranked_laptops,
    performance: result.ranked_laptops.filter(
      (l) => l.performance === "powerful"
    ),
    balanced: result.ranked_laptops.filter((l) => l.performance === "smooth"),
    lightweight: result.ranked_laptops.filter(
      (l) => l.design === "lightweight"
    ),
    durable: result.ranked_laptops.filter((l) => l.build_quality === "high"),
  };

  // Hiển thị các laptop được chọn dựa trên tab hiện tại
  const displayLaptops =
    laptopCategories[activeTab as keyof typeof laptopCategories] ||
    laptopCategories.all;

  // Format giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Format thời lượng pin
  const formatBattery = (batteryMah: number) => {
    if (batteryMah >= 1000) {
      return `${(batteryMah / 1000).toFixed(0)} Wh`;
    }
    return `${batteryMah} mAh`;
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen p-4 md:p-8 bg-gradient-to-b from-slate-50 to-white"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div variants={itemVariants} className="mb-8 text-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="absolute gap-1 mb-6 left-4 top-4"
          >
            <ArrowLeft size={16} />
            <span>Quay lại</span>
          </Button>

          <h1 className="mb-2 text-3xl font-bold text-gray-800">
            Laptop phù hợp với bạn
          </h1>
          <p className="text-slate-600">
            Đã tìm thấy {result.filtered_laptops_count} laptop phù hợp với yêu
            cầu của bạn
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-8">
          <Card className="border-none shadow-md bg-indigo-50">
            <CardHeader>
              <CardTitle className="text-lg text-indigo-800">
                Mức độ ưu tiên các yếu tố
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-sm text-gray-500">
                Đây là mức độ ưu tiên của các yếu tố dựa trên sự so sánh của
                bạn.
              </p>
              <div className="flex flex-wrap gap-4 md:gap-8">
                <div className="flex-grow min-w-[300px]">
                  <div className="space-y-2">
                    {Object.entries(result.weights).map(
                      ([criterion, weight]) => (
                        <div key={criterion} className="flex items-center">
                          <span className="w-24 text-sm font-medium text-gray-700">
                            {criterion}
                          </span>
                          <div className="flex-1">
                            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full bg-indigo-600 rounded-full"
                                style={{ width: `${weight * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="w-16 text-sm font-medium text-right text-indigo-700">
                            {(weight * 100).toFixed(1)}%
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-block">
                                  <Info className="inline w-4 h-4 cursor-help" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-sm">
                                  Mức độ ưu tiên càng cao, yếu tố này càng ảnh
                                  hưởng nhiều đến kết quả gợi ý
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-4">
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="performance">Hiệu năng cao</TabsTrigger>
              <TabsTrigger value="balanced">Cân bằng</TabsTrigger>
              <TabsTrigger value="lightweight">Mỏng nhẹ</TabsTrigger>
              <TabsTrigger value="durable">Bền bỉ</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {displayLaptops.map((laptop, index) => (
                  <Card
                    key={laptop.id || index}
                    className={`overflow-hidden transition-all hover:shadow-lg ${
                      index === 0 ? "ring-2 ring-indigo-500" : ""
                    }`}
                  >
                    {index === 0 && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-1.5 px-3 text-xs font-medium rounded-bl-lg flex items-center gap-1">
                        <Award size={14} />
                        Phù hợp nhất
                      </div>
                    )}

                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      <img
                        // src={`assets/laptop-images/${laptop.id}.jpg`}
                        src={`https://png.pngtree.com/png-vector/20230218/ourmid/pngtree-laptop-icon-png-image_6606927.png`}
                        alt={laptop.name}
                        className="object-contain w-full h-full transition-transform hover:scale-105"
                      />
                    </div>

                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{laptop.name}</CardTitle>
                        <Badge
                          variant={index === 0 ? "default" : "secondary"}
                          className="ml-2"
                        >
                          {(laptop.total_score * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <CardDescription className="text-base font-semibold text-green-600">
                        {formatPrice(laptop.price)}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pb-4 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-start gap-1.5">
                          <Cpu size={14} className="mt-0.5 text-gray-500" />
                          <span className="text-gray-600">{laptop.cpu}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <Cpu size={14} className="mt-0.5 text-gray-500" />
                          <span className="text-gray-600">{laptop.ram}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <Monitor size={14} className="mt-0.5 text-gray-500" />
                          <span className="text-gray-600">
                            {laptop.screenName}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <HardDrive
                            size={14}
                            className="mt-0.5 text-gray-500"
                          />
                          <span className="text-gray-600">
                            {laptop.storage}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <Battery size={14} className="mt-0.5 text-gray-500" />
                          <span className="text-gray-600">
                            {formatBattery(laptop.battery)}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <Weight size={14} className="mt-0.5 text-gray-500" />
                          <span className="text-gray-600">
                            {laptop.design === "lightweight"
                              ? "Mỏng nhẹ"
                              : "Tiêu chuẩn"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Badge
                          variant="outline"
                          className={`
                          ${
                            laptop.performance === "powerful"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-green-50 text-green-700 border-green-200"
                          }
                        `}
                        >
                          <Zap size={12} className="mr-1" />
                          {laptop.performance === "powerful"
                            ? "Hiệu năng cao"
                            : "Hiệu năng ổn định"}
                        </Badge>

                        <Badge
                          variant="outline"
                          className={`
                          ${
                            laptop.build_quality === "high"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-orange-50 text-orange-700 border-orange-200"
                          }
                        `}
                        >
                          {laptop.build_quality === "high"
                            ? "Độ bền cao"
                            : "Độ bền trung bình"}
                        </Badge>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-0">
                      <Button className="w-full gap-2" variant="outline">
                        <PieChart size={16} />
                        Xem chi tiết
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {displayLaptops.length === 0 && (
                <div className="py-12 text-center rounded-lg bg-gray-50">
                  <p className="text-gray-500">
                    Không tìm thấy laptop phù hợp trong danh mục này
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex justify-center mt-12 mb-8"
        >
          {/* Thay thế bằng div chứa hai nút */}
          <div className="flex gap-4">
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft size={16} />
              Quay lại trang chủ
            </Button>

            {/* Thêm nút mới để điều hướng đến trang danh sách laptop */}
            <Button
              onClick={() =>
                navigate("/laptops", { state: { result: result } })
              }
              variant="default"
              className="gap-2"
            >
              <Monitor size={16} />
              Xem tất cả laptop
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default RecommendationResults;
