import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Circle,
  DollarSign,
  Hexagon,
  Monitor,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

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
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
    },
  },
};

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

function CriteriaSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("performance");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form fields
  const [usage, setUsage] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [performance, setPerformance] = useState<string | null>(null);
  const [design, setDesign] = useState<string | null>(null);
  const [screenSize, setScreenSize] = useState<string | null>(null);

  // Get usage from URL parameters
  useEffect(() => {
    const usageParam = searchParams.get('usage');
    if (usageParam) {
      setUsage(usageParam);
    } else {
      setErrorMessage("Vui lòng quay lại trang trước để chọn mục đích sử dụng");
    }
  }, [searchParams]);

  useEffect(() => {
    // Tự động xóa thông báo lỗi sau 5 giây
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Validate if all selections are made
  const validateForm = () => {
    const isPerformanceTabValid = budget !== null && performance !== null;
    const isDesignTabValid = design !== null && screenSize !== null;

    return isPerformanceTabValid && isDesignTabValid;
  };

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Map budget ranges based on selection
  const getBudgetRange = (budgetSelection: string | null): [number, number] => {
    switch (budgetSelection) {
      case "low":
        return [5000000, 15000000];
      case "mid":
        return [15000000, 25000000];
      case "high":
        return [25000000, 50000000];
      default:
        return [0, 0];
    }
  };

  // Map screen size ranges based on selection
  const getScreenSizeRange = (
    screenSelection: string | null
  ): [number, number] => {
    switch (screenSelection) {
      case "small":
        return [10, 13];
      case "medium":
        return [13, 14.9];
      case "large":
        return [15, 17];
      default:
        return [0, 0];
    }
  };

  // Map performance to API value
  const getPerformanceValue = (perfSelection: string | null): string => {
    switch (perfSelection) {
      case "gaming":
        return "powerful";
      case "office":
        return "smooth";
      default:
        return "smooth";
    }
  };

  // Map design to API value
  const getDesignValue = (designSelection: string | null): string => {
    switch (designSelection) {
      case "thin":
        return "lightweight";
      case "premium":
        return "premium";
      default:
        return "standard";
    }
  };

  // Animation for selection change
  const handleSelection = (type: string, value: string) => {
    switch (type) {
      case "budget":
        setBudget(value);
        break;
      case "performance":
        setPerformance(value);
        break;
      case "design":
        setDesign(value);
        break;
      case "screenSize":
        setScreenSize(value);
        break;
    }
  };

  // Handle next button click with animation timing
  const handleNext = () => {
    if (activeTab === "performance" && budget && performance) {
      setTimeout(() => setActiveTab("design"), 200);
    } else if (activeTab === "design" && validateForm()) {
      const [fromBudget, toBudget] = getBudgetRange(budget);
      const [fromScreenSize, toScreenSize] = getScreenSizeRange(screenSize);

      if (!usage) {
        setErrorMessage(
          "Không tìm thấy thông tin mục đích sử dụng. Vui lòng quay lại trang trước."
        );
        return;
      }

      if (!budget || !performance || !design || !screenSize) {
        setErrorMessage("Vui lòng chọn đầy đủ các tiêu chí.");
        return;
      }

      // Create URL parameters
      const params = new URLSearchParams();
      params.append('usage', usage);
      params.append('fromBudget', fromBudget.toString());
      params.append('toBudget', toBudget.toString());
      params.append('performance', getPerformanceValue(performance));
      params.append('design', getDesignValue(design));
      params.append('fromScreenSize', fromScreenSize.toString());
      params.append('toScreenSize', toScreenSize.toString());
      
      // Navigate to custom criteria page with URL parameters
      navigate(`/custom-criteria?${params.toString()}`);
    } else if (activeTab === "performance" && (!budget || !performance)) {
      setErrorMessage(
        "Vui lòng chọn hiệu năng và ngân sách trước khi tiếp tục."
      );
    }
  };

  // Progress percentage for the progress bar - adjusted for 2 steps
  const progressPercentage = () => {
    if (activeTab === "performance") return budget && performance ? 50 : 0;
    if (activeTab === "design") return design && screenSize ? 100 : 50;
    return 0;
  };

  // Get the usage display name
  const getUsageDisplayName = () => {
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

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 via-white to-indigo-50"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 left-0 -translate-y-1/2 rounded-full w-96 h-96 bg-gradient-to-br from-indigo-200 to-indigo-400 filter blur-3xl opacity-20 -translate-x-1/3"></div>
        <div className="absolute bottom-0 right-0 translate-y-1/2 rounded-full w-80 h-80 bg-gradient-to-tr from-purple-200 to-purple-400 filter blur-3xl opacity-20 translate-x-1/3"></div>
        <div className="absolute inset-0 bg-grid-slate-100/[0.05] bg-[length:20px_20px]"></div>
      </div>

      <div className="max-w-4xl mx-auto">
        <motion.div variants={itemVariants} className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            Tiêu chí lựa chọn
          </h1>
          <p className="text-slate-600">
            Mục đích sử dụng:{" "}
            <span className="font-medium">{getUsageDisplayName()}</span>
          </p>
        </motion.div>

        {/* Error Message */}
        {errorMessage && (
          <motion.div variants={itemVariants} className="mb-6">
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>Lỗi</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Progress Bar */}
        <motion.div
          className="h-2 mb-6 overflow-hidden bg-gray-200 rounded-full"
          variants={itemVariants}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage()}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Rest of your component remains unchanged */}
        {/* ... */}

        {/* Tabs container */}
        <motion.div variants={itemVariants}>
          <Tabs
            defaultValue="performance"
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            {/* Tab buttons */}
            <TabsList className="w-full mb-6 border bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100/50">
              <TabsTrigger 
                value="performance" 
                className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                Hiệu năng & Ngân sách
              </TabsTrigger>
              <TabsTrigger 
                value="design"
                className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                Thiết kế & Màn hình
              </TabsTrigger>
            </TabsList>

            {/* Performance tab content */}
            <TabsContent value="performance">
              <AnimatePresence mode="wait">
                <motion.div
                  key="performance"
                  variants={staggerContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-6"
                >
                  {/* Budget selection */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium text-gray-800">Ngân sách của bạn</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <motion.div variants={cardVariants}>
                        <Card
                          className={`cursor-pointer border-2 transition-all ${
                            budget === "low"
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-slate-100 hover:border-indigo-200"
                          }`}
                          onClick={() => handleSelection("budget", "low")}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 text-indigo-500 bg-indigo-100 rounded-full">
                              <DollarSign className="w-6 h-6" />
                            </div>
                            <CardTitle className="mb-1 text-base">Tiết kiệm</CardTitle>
                            <CardDescription>5 - 15 triệu</CardDescription>
                          </CardContent>
                        </Card>
                      </motion.div>

                      <motion.div variants={cardVariants}>
                        <Card
                          className={`cursor-pointer border-2 transition-all ${
                            budget === "mid"
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-slate-100 hover:border-indigo-200"
                          }`}
                          onClick={() => handleSelection("budget", "mid")}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 text-indigo-500 bg-indigo-100 rounded-full">
                              <DollarSign className="w-6 h-6" />
                            </div>
                            <CardTitle className="mb-1 text-base">Trung bình</CardTitle>
                            <CardDescription>15 - 25 triệu</CardDescription>
                          </CardContent>
                        </Card>
                      </motion.div>

                      <motion.div variants={cardVariants}>
                        <Card
                          className={`cursor-pointer border-2 transition-all ${
                            budget === "high"
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-slate-100 hover:border-indigo-200"
                          }`}
                          onClick={() => handleSelection("budget", "high")}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 text-indigo-500 bg-indigo-100 rounded-full">
                              <DollarSign className="w-6 h-6" />
                            </div>
                            <CardTitle className="mb-1 text-base">Cao cấp</CardTitle>
                            <CardDescription>25 - 50 triệu</CardDescription>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </div>
                  </div>

                  {/* Performance selection */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium text-gray-800">Yêu cầu hiệu năng</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <motion.div variants={cardVariants}>
                        <Card
                          className={`cursor-pointer border-2 transition-all ${
                            performance === "office"
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-slate-100 hover:border-indigo-200"
                          }`}
                          onClick={() => handleSelection("performance", "office")}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-4">
                              <div className="flex items-center justify-center w-12 h-12 mt-1 text-indigo-500 bg-indigo-100 rounded-full shrink-0">
                                <Circle className="w-6 h-6" />
                              </div>
                              <div className="flex-1">
                                <CardTitle className="mb-1 text-base">
                                  Văn phòng cơ bản
                                </CardTitle>
                                <CardDescription className="text-sm">
                                  Phù hợp cho các công việc nhẹ như văn phòng, duyệt web, xem phim
                                </CardDescription>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>

                      <motion.div variants={cardVariants}>
                        <Card
                          className={`cursor-pointer border-2 transition-all ${
                            performance === "gaming"
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-slate-100 hover:border-indigo-200"
                          }`}
                          onClick={() => handleSelection("performance", "gaming")}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-4">
                              <div className="flex items-center justify-center w-12 h-12 mt-1 text-indigo-500 bg-indigo-100 rounded-full shrink-0">
                                <Sparkles className="w-6 h-6" />
                              </div>
                              <div className="flex-1">
                                <CardTitle className="mb-1 text-base">
                                  Gaming & Đồ họa
                                </CardTitle>
                                <CardDescription className="text-sm">
                                  Phù hợp cho chơi game, đồ họa, thiết kế và xử lý tác vụ nặng
                                </CardDescription>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            {/* Design tab content */}
            <TabsContent value="design">
              <AnimatePresence mode="wait">
                <motion.div
                  key="design"
                  variants={staggerContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-6"
                >
                  {/* Design selection */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium text-gray-800">Thiết kế quan trọng với bạn?</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <motion.div variants={cardVariants}>
                        <Card
                          className={`cursor-pointer border-2 transition-all ${
                            design === "thin"
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-slate-100 hover:border-indigo-200"
                          }`}
                          onClick={() => handleSelection("design", "thin")}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 text-indigo-500 bg-indigo-100 rounded-full">
                              <Hexagon className="w-6 h-6" />
                            </div>
                            <CardTitle className="mb-1 text-base">Mỏng nhẹ</CardTitle>
                            <CardDescription>
                              Ưu tiên máy mỏng, nhẹ, dễ mang đi
                            </CardDescription>
                          </CardContent>
                        </Card>
                      </motion.div>

                      <motion.div variants={cardVariants}>
                        <Card
                          className={`cursor-pointer border-2 transition-all ${
                            design === "premium"
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-slate-100 hover:border-indigo-200"
                          }`}
                          onClick={() => handleSelection("design", "premium")}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 text-indigo-500 bg-indigo-100 rounded-full">
                              <Sparkles className="w-6 h-6" />
                            </div>
                            <CardTitle className="mb-1 text-base">Cao cấp</CardTitle>
                            <CardDescription>
                              Ưu tiên chất liệu cao cấp và thiết kế sang trọng
                            </CardDescription>
                          </CardContent>
                        </Card>
                      </motion.div>

                      <motion.div variants={cardVariants}>
                        <Card
                          className={`cursor-pointer border-2 transition-all ${
                            design === "standard"
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-slate-100 hover:border-indigo-200"
                          }`}
                          onClick={() => handleSelection("design", "standard")}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 text-indigo-500 bg-indigo-100 rounded-full">
                              <Circle className="w-6 h-6" />
                            </div>
                            <CardTitle className="mb-1 text-base">Cân đối</CardTitle>
                            <CardDescription>
                              Cân bằng giữa hiệu năng và thiết kế
                            </CardDescription>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </div>
                  </div>

                  {/* Screen size selection */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium text-gray-800">Kích thước màn hình</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <motion.div variants={cardVariants}>
                        <Card
                          className={`cursor-pointer border-2 transition-all ${
                            screenSize === "small"
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-slate-100 hover:border-indigo-200"
                          }`}
                          onClick={() => handleSelection("screenSize", "small")}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 text-indigo-500 bg-indigo-100 rounded-full">
                              <Monitor className="w-5 h-5" />
                            </div>
                            <CardTitle className="mb-1 text-base">Nhỏ gọn</CardTitle>
                            <CardDescription>10" - 13"</CardDescription>
                          </CardContent>
                        </Card>
                      </motion.div>

                      <motion.div variants={cardVariants}>
                        <Card
                          className={`cursor-pointer border-2 transition-all ${
                            screenSize === "medium"
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-slate-100 hover:border-indigo-200"
                          }`}
                          onClick={() => handleSelection("screenSize", "medium")}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 text-indigo-500 bg-indigo-100 rounded-full">
                              <Monitor className="w-6 h-6" />
                            </div>
                            <CardTitle className="mb-1 text-base">Trung bình</CardTitle>
                            <CardDescription>13" - 14.9"</CardDescription>
                          </CardContent>
                        </Card>
                      </motion.div>

                      <motion.div variants={cardVariants}>
                        <Card
                          className={`cursor-pointer border-2 transition-all ${
                            screenSize === "large"
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-slate-100 hover:border-indigo-200"
                          }`}
                          onClick={() => handleSelection("screenSize", "large")}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 text-indigo-500 bg-indigo-100 rounded-full">
                              <Monitor className="w-7 h-7" />
                            </div>
                            <CardTitle className="mb-1 text-base">Lớn</CardTitle>
                            <CardDescription>15" - 17"</CardDescription>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </motion.div>

        <CardFooter className="flex justify-between p-4 border-t">
          {activeTab === "design" ? (
            <Button
              variant="outline"
              onClick={() => setActiveTab("performance")}
              className="flex items-center gap-2"
            >
              <ChevronLeft size={16} />
              Quay lại
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ChevronLeft size={16} />
              Quay lại
            </Button>
          )}

          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Button
              onClick={handleNext}
              disabled={
                (activeTab === "performance" &&
                  (!budget || !performance)) ||
                (activeTab === "design" && (!design || !screenSize))
              }
              className={`flex items-center gap-2 ${
                (activeTab === "performance" &&
                  (!budget || !performance)) ||
                (activeTab === "design" && (!design || !screenSize))
                  ? "opacity-50 cursor-not-allowed bg-gray-400"
                  : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              }`}
            >
              {activeTab === "design" && validateForm() ? (
                <>
                  Tiếp tục so sánh tiêu chí
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  Tiếp theo
                  <ChevronRight size={16} />
                </>
              )}
            </Button>
          </motion.div>
        </CardFooter>
      </div>
    </motion.div>
  );
}

export default CriteriaSelection;