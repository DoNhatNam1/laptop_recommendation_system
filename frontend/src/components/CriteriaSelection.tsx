import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

const scaleUpVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
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

const iconPulse = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.1, 1],
    transition: {
      repeat: Infinity,
      repeatType: "mirror" as "mirror",
      duration: 2,
    },
  },
};

function CriteriaSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("performance");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form fields
  const [usage, setUsage] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [performance, setPerformance] = useState<string | null>(null);
  const [design, setDesign] = useState<string | null>(null);
  const [screenSize, setScreenSize] = useState<string | null>(null);

  // Get usage from previous screen
  useEffect(() => {
    if (location.state?.usage) {
      setUsage(location.state.usage);
    } else {
      setErrorMessage("Vui lòng quay lại trang trước để chọn mục đích sử dụng");
    }
  }, [location.state]);

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

      // Navigate to the next page with all parameters
      navigate("/criteria-pairwise", {
        state: {
          usage,
          fromBudget,
          toBudget,
          performance: getPerformanceValue(performance),
          design: getDesignValue(design),
          fromScreenSize,
          toScreenSize,
        },
      });
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

        <motion.div variants={scaleUpVariants}>
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="performance"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-600 data-[state=active]:bg-white data-[state=active]:text-indigo-600">
                      1
                    </span>
                    <span>Hiệu năng & Giá</span>
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="design"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-600 data-[state=active]:bg-white data-[state=active]:text-indigo-600">
                      2
                    </span>
                    <span>Thiết kế & Màn hình</span>
                  </span>
                </TabsTrigger>
              </TabsList>

              <div className="relative overflow-hidden min-h-[550px]">
                <AnimatePresence mode="wait">
                  {/* Tab 1: Performance and Budget */}
                  {activeTab === "performance" && (
                    <motion.div
                      key="performance"
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute w-full"
                    >
                      <TabsContent
                        value="performance"
                        className="p-4 m-0 space-y-4"
                      >
                        <CardContent className="pt-6">
                          <div className="mb-6 text-center">
                            <CardTitle className="mb-2 text-xl text-gray-800">
                              Hiệu năng & Giá cả
                            </CardTitle>
                            <CardDescription>
                              Chọn mức hiệu năng và ngân sách phù hợp
                            </CardDescription>
                          </div>

                          <div className="mb-8">
                            <h3 className="mb-4 text-sm font-medium">
                              Hiệu năng mong muốn:
                            </h3>
                            <motion.div
                              variants={staggerContainerVariants}
                              className="grid gap-4 md:grid-cols-2"
                            >
                              <motion.div
                                variants={itemVariants}
                                whileHover={{
                                  y: -3,
                                  transition: { duration: 0.2 },
                                }}
                                onClick={() =>
                                  handleSelection("performance", "office")
                                }
                                className="cursor-pointer"
                              >
                                <div
                                  className={`flex items-start gap-3 rounded-lg border-2 p-4 ${
                                    performance === "office"
                                      ? "border-indigo-500 bg-indigo-50/70"
                                      : "border-gray-200 bg-white"
                                  } shadow-sm hover:border-indigo-300 hover:bg-indigo-50/50`}
                                >
                                  <motion.div
                                    initial="initial"
                                    animate={
                                      performance === "office"
                                        ? "pulse"
                                        : "initial"
                                    }
                                    variants={iconPulse}
                                    className="flex-shrink-0 p-2 mt-1 text-indigo-600 bg-indigo-100 rounded-full"
                                  >
                                    <Circle size={20} />
                                  </motion.div>
                                  <div>
                                    <div className="mb-1 text-base font-medium leading-none">
                                      Cân đối hiệu năng
                                    </div>
                                    <p className="text-sm text-gray-500">
                                      Đáp ứng tốt các tác vụ văn phòng, trình
                                      duyệt, học tập
                                    </p>
                                  </div>
                                  {performance === "office" && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="ml-auto"
                                    >
                                      <div className="p-1 text-white bg-indigo-500 rounded-full">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="3"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>

                              <motion.div
                                variants={itemVariants}
                                whileHover={{
                                  y: -3,
                                  transition: { duration: 0.2 },
                                }}
                                onClick={() =>
                                  handleSelection("performance", "gaming")
                                }
                                className="cursor-pointer"
                              >
                                <div
                                  className={`flex items-start gap-3 rounded-lg border-2 p-4 ${
                                    performance === "gaming"
                                      ? "border-red-500 bg-red-50/70"
                                      : "border-gray-200 bg-white"
                                  } shadow-sm hover:border-red-300 hover:bg-red-50/50`}
                                >
                                  <motion.div
                                    initial="initial"
                                    animate={
                                      performance === "gaming"
                                        ? "pulse"
                                        : "initial"
                                    }
                                    variants={iconPulse}
                                    className="flex-shrink-0 p-2 mt-1 text-red-600 bg-red-100 rounded-full"
                                  >
                                    <Sparkles size={20} />
                                  </motion.div>
                                  <div>
                                    <div className="mb-1 text-base font-medium leading-none">
                                      Hiệu năng mạnh
                                    </div>
                                    <p className="text-sm text-gray-500">
                                      Xử lý tốt các game, đồ họa nặng, đa nhiệm
                                      mạnh mẽ
                                    </p>
                                  </div>
                                  {performance === "gaming" && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="ml-auto"
                                    >
                                      <div className="p-1 text-white bg-red-500 rounded-full">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="3"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>
                            </motion.div>
                          </div>

                          <div>
                            <h3 className="mb-4 text-sm font-medium">
                              Ngân sách của bạn:
                            </h3>
                            <motion.div
                              variants={staggerContainerVariants}
                              className="grid gap-4 md:grid-cols-3"
                            >
                              <motion.div
                                variants={itemVariants}
                                whileHover={{
                                  y: -3,
                                  transition: { duration: 0.2 },
                                }}
                                onClick={() => handleSelection("budget", "low")}
                                className="cursor-pointer"
                              >
                                <div
                                  className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 ${
                                    budget === "low"
                                      ? "border-green-500 bg-green-50/70"
                                      : "border-gray-200 bg-white"
                                  } shadow-sm hover:border-green-300 hover:bg-green-50/50`}
                                >
                                  <motion.div
                                    initial="initial"
                                    animate={
                                      budget === "low" ? "pulse" : "initial"
                                    }
                                    variants={iconPulse}
                                    className="rounded-full bg-green-100 p-2.5 text-green-600"
                                  >
                                    <DollarSign size={24} />
                                  </motion.div>
                                  <div className="text-lg font-medium">
                                    5 - 15 triệu
                                  </div>
                                  {budget === "low" && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute top-2 right-2"
                                    >
                                      <div className="p-1 text-white bg-green-500 rounded-full">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="3"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>

                              <motion.div
                                variants={itemVariants}
                                whileHover={{
                                  y: -3,
                                  transition: { duration: 0.2 },
                                }}
                                onClick={() => handleSelection("budget", "mid")}
                                className="cursor-pointer"
                              >
                                <div
                                  className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 ${
                                    budget === "mid"
                                      ? "border-yellow-500 bg-yellow-50/70"
                                      : "border-gray-200 bg-white"
                                  } shadow-sm hover:border-yellow-300 hover:bg-yellow-50/50`}
                                >
                                  <motion.div
                                    initial="initial"
                                    animate={
                                      budget === "mid" ? "pulse" : "initial"
                                    }
                                    variants={iconPulse}
                                    className="rounded-full bg-yellow-100 p-2.5 text-yellow-600 relative"
                                  >
                                    <DollarSign size={24} />
                                    <DollarSign
                                      size={24}
                                      className="absolute top-2.5 left-5"
                                    />
                                  </motion.div>
                                  <div className="text-lg font-medium">
                                    15 - 25 triệu
                                  </div>
                                  {budget === "mid" && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute top-2 right-2"
                                    >
                                      <div className="p-1 text-white bg-yellow-500 rounded-full">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="3"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>

                              <motion.div
                                variants={itemVariants}
                                whileHover={{
                                  y: -3,
                                  transition: { duration: 0.2 },
                                }}
                                onClick={() =>
                                  handleSelection("budget", "high")
                                }
                                className="cursor-pointer"
                              >
                                <div
                                  className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 ${
                                    budget === "high"
                                      ? "border-purple-500 bg-purple-50/70"
                                      : "border-gray-200 bg-white"
                                  } shadow-sm hover:border-purple-300 hover:bg-purple-50/50`}
                                >
                                  <motion.div
                                    initial="initial"
                                    animate={
                                      budget === "high" ? "pulse" : "initial"
                                    }
                                    variants={iconPulse}
                                    className="rounded-full bg-purple-100 p-2.5 text-purple-600 relative"
                                  >
                                    <DollarSign size={24} />
                                    <DollarSign
                                      size={24}
                                      className="absolute top-2.5 left-5"
                                    />
                                    <DollarSign
                                      size={24}
                                      className="absolute top-2.5 left-10"
                                    />
                                  </motion.div>
                                  <div className="text-lg font-medium">
                                    25 - 50 triệu
                                  </div>
                                  {budget === "high" && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute top-2 right-2"
                                    >
                                      <div className="p-1 text-white bg-purple-500 rounded-full">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="3"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>
                            </motion.div>
                          </div>
                        </CardContent>
                      </TabsContent>
                    </motion.div>
                  )}

                  {/* Tab 2: Design and Screen */}
                  {activeTab === "design" && (
                    <motion.div
                      key="design"
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute w-full"
                    >
                      <TabsContent value="design" className="p-4 m-0 space-y-4">
                        <CardContent className="pt-6">
                          <div className="mb-6 text-center">
                            <CardTitle className="mb-2 text-xl text-gray-800">
                              Thiết kế & Màn hình
                            </CardTitle>
                            <CardDescription>
                              Chọn kiểu thiết kế và kích thước màn hình mong
                              muốn
                            </CardDescription>
                          </div>

                          <div className="mb-8">
                            <h3 className="mb-4 text-sm font-medium">
                              Thiết kế:
                            </h3>
                            <motion.div
                              variants={staggerContainerVariants}
                              className="grid gap-4 md:grid-cols-3"
                            >
                              <motion.div
                                variants={itemVariants}
                                whileHover={{
                                  y: -3,
                                  transition: { duration: 0.2 },
                                }}
                                onClick={() =>
                                  handleSelection("design", "thin")
                                }
                                className="cursor-pointer"
                              >
                                <div
                                  className={`relative flex flex-col items-center gap-3 rounded-lg border-2 p-5 ${
                                    design === "thin"
                                      ? "border-indigo-500 bg-indigo-50/70"
                                      : "border-gray-200 bg-white"
                                  } shadow-sm hover:border-indigo-300 hover:bg-indigo-50/50`}
                                >
                                  <motion.div
                                    className="flex items-center justify-center h-12"
                                    initial="initial"
                                    animate={
                                      design === "thin" ? "pulse" : "initial"
                                    }
                                    variants={iconPulse}
                                  >
                                    <div className="h-1 bg-indigo-800 rounded-full w-36"></div>
                                  </motion.div>
                                  <div className="text-lg font-medium">
                                    Mỏng nhẹ
                                  </div>
                                  <p className="text-sm text-center text-gray-500">
                                    Thiết kế mỏng, nhẹ, dễ mang theo
                                  </p>
                                  {design === "thin" && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute top-2 right-2"
                                    >
                                      <div className="p-1 text-white bg-indigo-500 rounded-full">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="3"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>

                              <motion.div
                                variants={itemVariants}
                                whileHover={{
                                  y: -3,
                                  transition: { duration: 0.2 },
                                }}
                                onClick={() =>
                                  handleSelection("design", "standard")
                                }
                                className="cursor-pointer"
                              >
                                <div
                                  className={`relative flex flex-col items-center gap-3 rounded-lg border-2 p-5 ${
                                    design === "standard"
                                      ? "border-blue-500 bg-blue-50/70"
                                      : "border-gray-200 bg-white"
                                  } shadow-sm hover:border-blue-300 hover:bg-blue-50/50`}
                                >
                                  <motion.div
                                    className="flex items-center justify-center h-12"
                                    initial="initial"
                                    animate={
                                      design === "standard"
                                        ? "pulse"
                                        : "initial"
                                    }
                                    variants={iconPulse}
                                  >
                                    <div className="h-2 bg-blue-800 rounded-full w-36"></div>
                                  </motion.div>
                                  <div className="text-lg font-medium">
                                    Tiêu chuẩn
                                  </div>
                                  <p className="text-sm text-center text-gray-500">
                                    Thiết kế cân bằng, không quá nặng hay nhẹ
                                  </p>
                                  {design === "standard" && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute top-2 right-2"
                                    >
                                      <div className="p-1 text-white bg-blue-500 rounded-full">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="3"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>

                              <motion.div
                                variants={itemVariants}
                                whileHover={{
                                  y: -3,
                                  transition: { duration: 0.2 },
                                }}
                                onClick={() =>
                                  handleSelection("design", "premium")
                                }
                                className="cursor-pointer"
                              >
                                <div
                                  className={`relative flex flex-col items-center gap-3 rounded-lg border-2 p-5 ${
                                    design === "premium"
                                      ? "border-purple-500 bg-purple-50/70"
                                      : "border-gray-200 bg-white"
                                  } shadow-sm hover:border-purple-300 hover:bg-purple-50/50`}
                                >
                                  <motion.div
                                    className="flex items-center justify-center h-12"
                                    initial="initial"
                                    animate={
                                      design === "premium" ? "pulse" : "initial"
                                    }
                                    variants={iconPulse}
                                  >
                                    <Hexagon
                                      className="text-purple-800"
                                      size={36}
                                    />
                                  </motion.div>
                                  <div className="text-lg font-medium">
                                    Cao cấp
                                  </div>
                                  <p className="text-sm text-center text-gray-500">
                                    Chất liệu cao cấp, thiết kế sang trọng
                                  </p>
                                  {design === "premium" && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute top-2 right-2"
                                    >
                                      <div className="p-1 text-white bg-purple-500 rounded-full">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="3"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>
                            </motion.div>
                          </div>

                          <div>
                            <h3 className="mb-4 text-sm font-medium">
                              Kích thước màn hình:
                            </h3>
                            <motion.div
                              variants={staggerContainerVariants}
                              className="grid gap-4 md:grid-cols-3"
                            >
                              <motion.div
                                variants={itemVariants}
                                whileHover={{
                                  y: -3,
                                  transition: { duration: 0.2 },
                                }}
                                onClick={() =>
                                  handleSelection("screenSize", "small")
                                }
                                className="cursor-pointer"
                              >
                                <div
                                  className={`relative flex flex-col items-center gap-3 rounded-lg border-2 p-5 ${
                                    screenSize === "small"
                                      ? "border-teal-500 bg-teal-50/70"
                                      : "border-gray-200 bg-white"
                                  } shadow-sm hover:border-teal-300 hover:bg-teal-50/50`}
                                >
                                  <motion.div
                                    className="flex-shrink-0 p-3 text-teal-600 bg-teal-100 rounded-md"
                                    initial="initial"
                                    animate={
                                      screenSize === "small"
                                        ? "pulse"
                                        : "initial"
                                    }
                                    variants={iconPulse}
                                  >
                                    <Monitor className="w-5 h-5" />
                                  </motion.div>
                                  <div className="text-lg font-medium">
                                    Nhỏ gọn
                                  </div>
                                  <p className="text-sm text-center text-gray-500">
                                    10 - 13 inch
                                  </p>
                                  {screenSize === "small" && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute top-2 right-2"
                                    >
                                      <div className="p-1 text-white bg-teal-500 rounded-full">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="3"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>

                              <motion.div
                                variants={itemVariants}
                                whileHover={{
                                  y: -3,
                                  transition: { duration: 0.2 },
                                }}
                                onClick={() =>
                                  handleSelection("screenSize", "medium")
                                }
                                className="cursor-pointer"
                              >
                                <div
                                  className={`relative flex flex-col items-center gap-3 rounded-lg border-2 p-5 ${
                                    screenSize === "medium"
                                      ? "border-cyan-500 bg-cyan-50/70"
                                      : "border-gray-200 bg-white"
                                  } shadow-sm hover:border-cyan-300 hover:bg-cyan-50/50`}
                                >
                                  <motion.div
                                    className="flex-shrink-0 p-3 rounded-md text-cyan-600 bg-cyan-100"
                                    initial="initial"
                                    animate={
                                      screenSize === "medium"
                                        ? "pulse"
                                        : "initial"
                                    }
                                    variants={iconPulse}
                                  >
                                    <Monitor className="w-6 h-6" />
                                  </motion.div>
                                  <div className="text-lg font-medium">
                                    Trung bình
                                  </div>
                                  <p className="text-sm text-center text-gray-500">
                                    13 - 14.9 inch
                                  </p>
                                  {screenSize === "medium" && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute top-2 right-2"
                                    >
                                      <div className="p-1 text-white rounded-full bg-cyan-500">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="3"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>

                              <motion.div
                                variants={itemVariants}
                                whileHover={{
                                  y: -3,
                                  transition: { duration: 0.2 },
                                }}
                                onClick={() =>
                                  handleSelection("screenSize", "large")
                                }
                                className="cursor-pointer"
                              >
                                <div
                                  className={`relative flex flex-col items-center gap-3 rounded-lg border-2 p-5 ${
                                    screenSize === "large"
                                      ? "border-blue-500 bg-blue-50/70"
                                      : "border-gray-200 bg-white"
                                  } shadow-sm hover:border-blue-300 hover:bg-blue-50/50`}
                                >
                                  <motion.div
                                    className="flex-shrink-0 p-3 text-blue-600 bg-blue-100 rounded-md"
                                    initial="initial"
                                    animate={
                                      screenSize === "large"
                                        ? "pulse"
                                        : "initial"
                                    }
                                    variants={iconPulse}
                                  >
                                    <Monitor className="w-7 h-7" />
                                  </motion.div>
                                  <div className="text-lg font-medium">Lớn</div>
                                  <p className="text-sm text-center text-gray-500">
                                    15 inch trở lên
                                  </p>
                                  {screenSize === "large" && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute top-2 right-2"
                                    >
                                      <div className="p-1 text-white bg-blue-500 rounded-full">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="3"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>
                            </motion.div>
                          </div>
                        </CardContent>
                      </TabsContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

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
            </Tabs>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default CriteriaSelection;
