import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import apiService from "@/services/api";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import {
  ArrowLeft,
  Cpu,
  Filter,
  HardDrive,
  Laptop,
  Monitor,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Zap,
  X,
  Battery,
  Weight,
  DollarSign,
  Info,
} from "lucide-react";
import { LaptopsByUsage, ProcessingResult } from "@/types";

function LaptopListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [recommendationResult, setRecommendationResult] =
    useState<ProcessingResult | null>(null);
  const [allLaptops, setAllLaptops] = useState<any[]>([]);
  const [filteredLaptops, setFilteredLaptops] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  // @ts-ignore
  const [selectedLaptop, setSelectedLaptop] = useState<any>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sortOrder, setSortOrder] = useState<
    "recommended" | "price-low" | "price-high" | "performance"
  >("recommended");

  // Filter settings
  const [priceRange, setPriceRange] = useState<[number, number]>([
    5000000, 50000000,
  ]);
  const [screenSizes, setScreenSizes] = useState<string[]>(["all"]);
  const [performanceFilter, setPerformanceFilter] = useState<string[]>(["all"]);
  const [designFilter, setDesignFilter] = useState<string[]>(["all"]);

  // Comparison feature
  const [compareMode, setCompareMode] = useState(false);
  const [comparedLaptops, setComparedLaptops] = useState<any[]>([]);
  const [_result, setResult] = useState<ProcessingResult | null>(null);
  // Animation references
  const { ref: filterRef } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const springTransition = { type: "spring", stiffness: 80, damping: 12 };

  const animationVariants = useRef({
    containerVariants: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05, ease: "easeOut" },
      },
    },

    itemVariants: {
      hidden: { opacity: 1, y: 0 },
      visible: {
        opacity: 1,
        y: 1,
        transition: springTransition,
      },
    },

    cardVariants: {
      hidden: { opacity: 0, scale: 0.95, y: 20 },
      visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: "spring", stiffness: 100, damping: 15 },
      },
      hover: {
        y: -5,
        boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.25)",
        transition: { type: "spring", stiffness: 300, damping: 15 },
      },
    },
  });

  useEffect(() => {
    // Có thể cập nhật animation variants tùy vào điều kiện nếu cần
    animationVariants.current.itemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          type: "spring",
          stiffness: 80,
          damping: 12,
        },
      },
    };
  }, [showFilters]);

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

  // Get all available laptop data
  useEffect(() => {
    const fetchLaptops = async () => {
      setIsLoading(true);
      try {
        // Nhận dữ liệu từ API
        const response = await apiService.getLaptopsByUsage();
        console.log("API response:", response);

        // Dữ liệu trả về là một object với key là các category (gaming, mobility, office)
        // Mỗi category chứa một mảng laptop và một trường usage
        let allLaptops: any[] = [];

        // Lấy tất cả laptop từ các category
        if (response && typeof response === "object") {
          // Duyệt qua từng category (gaming, mobility, office)
          Object.keys(response).forEach((category) => {
            const categoryData = response[category as keyof LaptopsByUsage];
            if (categoryData && Array.isArray(categoryData.laptops)) {
              // Thêm các laptop từ category này vào mảng chính
              allLaptops = [...allLaptops, ...categoryData.laptops];
            }
          });
        }

        console.log(
          `Đã tìm thấy tổng cộng ${allLaptops.length} laptop từ tất cả các category`
        );
        setAllLaptops(allLaptops);

        // Cập nhật danh sách laptop đã lọc ban đầu
        setFilteredLaptops(allLaptops);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu laptop:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Lấy kết quả recommendation từ navigation state hoặc localStorage
    if (location.state?.result) {
      console.log("Lấy kết quả từ location state", location.state.result);
      setRecommendationResult(location.state.result);
      // Lưu kết quả vào localStorage để sử dụng sau này
      localStorage.setItem(
        "recommendation_result",
        JSON.stringify(location.state.result)
      );
    } else {
      const savedResult = localStorage.getItem("recommendation_result");
      if (savedResult) {
        try {
          console.log("Lấy kết quả từ localStorage");
          setRecommendationResult(JSON.parse(savedResult));
        } catch (error) {
          console.error("Lỗi khi phân tích kết quả từ localStorage:", error);
        }
      }
    }

    fetchLaptops();
  }, [location.state]);

  // Apply filters whenever filter settings change
  useEffect(() => {
    if (!allLaptops.length) return;

    let filtered = [...allLaptops];

    // Apply price filter
    filtered = filtered.filter(
      (laptop) => laptop.price >= priceRange[0] && laptop.price <= priceRange[1]
    );

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((laptop) => {
        // Tìm kiếm trên nhiều trường thông tin
        return (
          // Thông tin cơ bản
          laptop.name?.toLowerCase().includes(query) ||
          laptop.id?.toLowerCase().includes(query) ||
          // Thông tin cấu hình
          laptop.cpu?.toLowerCase().includes(query) ||
          laptop.gpu?.toLowerCase().includes(query) ||
          laptop.ram?.toLowerCase().includes(query) ||
          laptop.storage?.toLowerCase().includes(query) ||
          laptop.screenName?.toLowerCase().includes(query) ||
          // Thông tin phân loại
          laptop.usage?.toLowerCase().includes(query) ||
          laptop.design?.toLowerCase().includes(query) ||
          // Tìm theo khoảng giá (nếu người dùng nhập như "20 triệu", "dưới 15tr", v.v.)
          ((query.includes("triệu") || query.includes("tr")) &&
            (((query.includes("dưới") ||
              query.includes("duoi") ||
              query.includes("<")) &&
              laptop.price <
                parseFloat(query.replace(/[^\d.]/g, "")) * 1000000) ||
              ((query.includes("trên") ||
                query.includes("tren") ||
                query.includes(">")) &&
                laptop.price >
                  parseFloat(query.replace(/[^\d.]/g, "")) * 1000000) ||
              (laptop.price <
                parseFloat(query.replace(/[^\d.]/g, "")) * 1000000 + 5000000 &&
                laptop.price >
                  parseFloat(query.replace(/[^\d.]/g, "")) * 1000000 -
                    5000000))) ||
          // Tìm theo thương hiệu tách từ tên laptop
          // Lấy từ đầu tiên trong tên laptop và so sánh với query
          laptop.name?.toLowerCase().split(" ")[0].includes(query)
        );
      });
    }

    // Apply screen size filter
    if (!screenSizes.includes("all")) {
      filtered = filtered.filter((laptop) => {
        // Đảm bảo screen là một con số
        const screenSize =
          typeof laptop.screen === "number"
            ? laptop.screen
            : typeof laptop.screen === "string"
            ? parseFloat(laptop.screen)
            : 0;

        return screenSizes.some((size) => {
          if (size === "small") return screenSize < 13.5;
          if (size === "medium") return screenSize >= 13.5 && screenSize < 15;
          if (size === "large") return screenSize >= 15;
          return true;
        });
      });
    }

    // Apply performance filter
    if (!performanceFilter.includes("all")) {
      filtered = filtered.filter((laptop) =>
        performanceFilter.includes(laptop.performance)
      );
    }

    // Apply design filter
    if (!designFilter.includes("all")) {
      filtered = filtered.filter((laptop) =>
        designFilter.includes(laptop.design)
      );
    }

    // Apply tab filter
    if (activeTab === "recommended" && recommendationResult) {
      try {
        console.log("Recommendation result:", recommendationResult);

        if (Array.isArray(recommendationResult.ranked_laptops)) {
          // Lấy danh sách ID từ recommendation result
          const recommendedIds = recommendationResult.ranked_laptops.map(
            (l) => l.id
          );
          console.log("Recommended laptop IDs:", recommendedIds);
          console.log(
            "Available laptop IDs:",
            filtered.map((l) => l.id)
          );

          // Debug: Kiểm tra xem có bao nhiêu laptop khớp với recommendations
          const matchingLaptops = filtered.filter((laptop) =>
            recommendedIds.includes(laptop.id)
          );
          console.log(
            `Found ${matchingLaptops.length} matching laptops out of ${recommendedIds.length} recommendations`
          );

          // Thử matching ít nghiêm ngặt hơn (case-insensitive)
          if (matchingLaptops.length === 0) {
            console.log("Trying case-insensitive matching...");
            const matchingWithCaseInsensitive = filtered.filter((laptop) =>
              recommendedIds.some(
                (id) => id.toLowerCase() === (laptop.id || "").toLowerCase()
              )
            );

            if (matchingWithCaseInsensitive.length > 0) {
              console.log(
                `Found ${matchingWithCaseInsensitive.length} matches with case-insensitive comparison`
              );
              filtered = matchingWithCaseInsensitive;
            } else {
              // Nếu vẫn không tìm thấy, sử dụng dữ liệu từ recommendation trực tiếp
              console.log("Creating mock laptops from recommendation data");

              // Tạo laptop objects từ recommendation data
              const mockedLaptops = recommendationResult.ranked_laptops.map(
                (laptop) => ({
                  ...laptop,
                  // Đảm bảo có các trường cần thiết
                  usage:
                    laptop.design === "lightweight" ? "mobility" : "office",
                })
              );

              filtered = mockedLaptops;
            }
          } else {
            filtered = matchingLaptops;
          }
        } else {
          console.error(
            "Unexpected structure of recommendationResult:",
            recommendationResult
          );
        }

        console.log(`After recommendation filter: ${filtered.length} laptops`);
      } catch (error) {
        console.error("Error filtering recommended laptops:", error);
      }

      // Đảm bảo luôn có laptop để hiển thị trong tab recommended
      if (filtered.length === 0 && allLaptops.length > 0) {
        console.warn("Fallback to recommended laptops by filtering criteria");

        // Tạo một danh sách khuyến nghị từ tất cả laptop dựa trên tiêu chí đơn giản
        filtered = [...allLaptops]
          // Ưu tiên laptop mỏng nhẹ (như trong recommendation của bạn)
          .filter((laptop) => laptop.design === "lightweight")
          // Giới hạn 5 kết quả
          .slice(0, 5);
      }
    } else if (activeTab === "gaming") {
      filtered = filtered.filter((laptop) => laptop.usage.includes("gaming"));
    } else if (activeTab === "business") {
      filtered = filtered.filter((laptop) => laptop.usage.includes("office"));
    } else if (activeTab === "lightweight") {
      filtered = filtered.filter((laptop) => laptop.design === "lightweight");
    }

    // Apply sorting
    if (sortOrder === "price-low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "price-high") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortOrder === "performance") {
      filtered.sort((a, b) => {
        if (a.performance === "powerful" && b.performance !== "powerful")
          return -1;
        if (a.performance !== "powerful" && b.performance === "powerful")
          return 1;
        return 0;
      });
    } else if (sortOrder === "recommended" && recommendationResult) {
      // Sort by recommendation score if available
      const scoreMap = new Map();
      recommendationResult.ranked_laptops.forEach((laptop, index) => {
        scoreMap.set(laptop.id, {
          score: laptop.total_score,
          rank: index,
        });
      });

      filtered.sort((a, b) => {
        const aScore = scoreMap.get(a.id);
        const bScore = scoreMap.get(b.id);

        // If both have scores, sort by score
        if (aScore && bScore) {
          return bScore.score - aScore.score;
        }

        // If only one has a score, prioritize the one with a score
        if (aScore) return -1;
        if (bScore) return 1;

        // If neither has a score, keep original order
        return 0;
      });
    }

    setFilteredLaptops(filtered);
  }, [
    allLaptops,
    priceRange,
    searchQuery,
    screenSizes,
    performanceFilter,
    designFilter,
    activeTab,
    sortOrder,
    recommendationResult,
  ]);

  // Format price to VND
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Format battery capacity
  const formatBattery = (batteryMah: number) => {
    if (batteryMah >= 1000) {
      return `${(batteryMah / 1000).toFixed(0)} Wh`;
    }
    return `${batteryMah} mAh`;
  };

  // Add or remove laptop from compare list
  const toggleCompare = (laptop: any) => {
    if (comparedLaptops.some((l) => l.id === laptop.id)) {
      setComparedLaptops(comparedLaptops.filter((l) => l.id !== laptop.id));
    } else {
      if (comparedLaptops.length < 3) {
        setComparedLaptops([...comparedLaptops, laptop]);
      }
    }
  };

  // Calculate recommendation score if available
  const getRecommendationScore = (laptop: any) => {
    if (!recommendationResult) return null;

    const found = recommendationResult.ranked_laptops.find(
      (l) => l.id === laptop.id
    );
    return found ? found.total_score : null;
  };

  return (
    <motion.div
      variants={animationVariants.current.containerVariants}
      className="min-h-screen bg-gradient-to-b from-slate-50 to-white"
    >
      {/* Header Section with Search and Filters */}
      <motion.div
        variants={animationVariants.current.itemVariants}
        className="sticky top-0 z-10 flex flex-col justify-between w-full p-4 bg-white border-b md:px-6 lg:px-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <ArrowLeft size={18} />
            </Button>
            <h1 className="text-xl font-bold md:text-2xl">Danh sách laptop</h1>
            <Badge variant="outline" className="ml-2 text-xs">
              {filteredLaptops.length} kết quả
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {recommendationResult && (
              <Badge
                variant="secondary"
                className="hidden gap-1 px-3 py-1 text-xs text-indigo-700 bg-indigo-100 md:flex"
              >
                <Sparkles size={14} />
                Đã có gợi ý dựa trên sở thích của bạn
              </Badge>
            )}
            <div className="relative flex items-center">
              <Search className="absolute w-4 h-4 text-gray-400 left-3" />
              <Input
                placeholder="Tìm kiếm laptop..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[180px] md:w-[300px] rounded-full bg-slate-50"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 h-7 w-7"
                  onClick={() => setSearchQuery("")}
                >
                  <X size={14} />
                </Button>
              )}
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              <span className="hidden md:inline">Bộ lọc</span>
            </Button>
            <Select
              value={sortOrder}
              onValueChange={(value) => setSortOrder(value as any)}
            >
              <SelectTrigger className="w-[130px] md:w-[180px]">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-white border shadow-lg">
                <SelectItem value="recommended">Độ phù hợp</SelectItem>
                <SelectItem value="price-low">Giá thấp đến cao</SelectItem>
                <SelectItem value="price-high">Giá cao đến thấp</SelectItem>
                <SelectItem value="performance">Hiệu năng cao nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center pb-1 mt-4 overflow-x-auto">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="flex w-full overflow-x-auto">
              <TabsTrigger value="all" className="flex-shrink-0">
                Tất cả
              </TabsTrigger>
              {recommendationResult && (
                <TabsTrigger
                  value="recommended"
                  className="flex items-center flex-shrink-0 gap-1"
                >
                  <Star size={14} className="text-amber-500" />
                  Đề xuất cho bạn
                </TabsTrigger>
              )}
              <TabsTrigger value="gaming" className="flex-shrink-0">
                Gaming & Đồ họa
              </TabsTrigger>
              <TabsTrigger value="business" className="flex-shrink-0">
                Văn phòng & Học tập
              </TabsTrigger>
              <TabsTrigger value="lightweight" className="flex-shrink-0">
                Mỏng nhẹ
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 ml-4">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="w-8 h-8 p-0 rounded-full"
              onClick={() => setView("grid")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              className="w-8 h-8 p-0 rounded-full"
              onClick={() => setView("list")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </Button>

            <Button
              variant={compareMode ? "default" : "outline"}
              size="sm"
              className="hidden gap-1 px-2 ml-2 text-xs md:flex"
              onClick={() => setCompareMode(!compareMode)}
            >
              <SlidersHorizontal size={14} />
              So sánh
              {comparedLaptops.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {comparedLaptops.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Advanced filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              ref={filterRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <motion.div
                variants={animationVariants.current.itemVariants}
                className="grid grid-cols-1 gap-6 p-4 mt-4 border border-indigo-100 rounded-lg shadow-md bg-indigo-50 md:grid-cols-3"
              >
                {/* Price range filter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium ">Khoảng giá</Label>
                    <div className="text-sm font-medium text-indigo-600">
                      {formatPrice(priceRange[0])} -{" "}
                      {formatPrice(priceRange[1])}
                    </div>
                  </div>
                  <Slider
                    defaultValue={[5000000, 50000000]}
                    min={5000000}
                    max={50000000}
                    step={1000000}
                    value={priceRange}
                    onValueChange={(value) =>
                      setPriceRange(value as [number, number])
                    }
                    className="py-1 bg-white rounded-lg shadow-sm"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>5 triệu</span>
                    <span>50 triệu</span>
                  </div>
                </div>

                {/* Screen size filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Kích thước màn hình
                  </Label>
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Badge
                      variant={
                        screenSizes.includes("all") ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => setScreenSizes(["all"])}
                    >
                      Tất cả
                    </Badge>
                    <Badge
                      variant={
                        screenSizes.includes("small") ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        if (screenSizes.includes("all")) {
                          setScreenSizes(["small"]);
                        } else if (screenSizes.includes("small")) {
                          setScreenSizes(
                            screenSizes.filter((s) => s !== "small")
                          );
                          if (screenSizes.length === 1) setScreenSizes(["all"]);
                        } else {
                          setScreenSizes([
                            ...screenSizes.filter((s) => s !== "all"),
                            "small",
                          ]);
                        }
                      }}
                    >
                      Nhỏ (dưới 13.5")
                    </Badge>
                    <Badge
                      variant={
                        screenSizes.includes("medium") ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        if (screenSizes.includes("all")) {
                          setScreenSizes(["medium"]);
                        } else if (screenSizes.includes("medium")) {
                          setScreenSizes(
                            screenSizes.filter((s) => s !== "medium")
                          );
                          if (screenSizes.length === 1) setScreenSizes(["all"]);
                        } else {
                          setScreenSizes([
                            ...screenSizes.filter((s) => s !== "all"),
                            "medium",
                          ]);
                        }
                      }}
                    >
                      Vừa (13.5" - 14.9")
                    </Badge>
                    <Badge
                      variant={
                        screenSizes.includes("large") ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        if (screenSizes.includes("all")) {
                          setScreenSizes(["large"]);
                        } else if (screenSizes.includes("large")) {
                          setScreenSizes(
                            screenSizes.filter((s) => s !== "large")
                          );
                          if (screenSizes.length === 1) setScreenSizes(["all"]);
                        } else {
                          setScreenSizes([
                            ...screenSizes.filter((s) => s !== "all"),
                            "large",
                          ]);
                        }
                      }}
                    >
                      Lớn (từ 15" trở lên)
                    </Badge>
                  </div>
                </div>

                {/* Performance filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Hiệu năng</Label>
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Badge
                      variant={
                        performanceFilter.includes("all")
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => setPerformanceFilter(["all"])}
                    >
                      Tất cả
                    </Badge>
                    <Badge
                      variant={
                        performanceFilter.includes("powerful")
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        if (performanceFilter.includes("all")) {
                          setPerformanceFilter(["powerful"]);
                        } else if (performanceFilter.includes("powerful")) {
                          setPerformanceFilter(
                            performanceFilter.filter((p) => p !== "powerful")
                          );
                          if (performanceFilter.length === 1)
                            setPerformanceFilter(["all"]);
                        } else {
                          setPerformanceFilter([
                            ...performanceFilter.filter((p) => p !== "all"),
                            "powerful",
                          ]);
                        }
                      }}
                    >
                      Mạnh mẽ
                    </Badge>
                    <Badge
                      variant={
                        performanceFilter.includes("smooth")
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        if (performanceFilter.includes("all")) {
                          setPerformanceFilter(["smooth"]);
                        } else if (performanceFilter.includes("smooth")) {
                          setPerformanceFilter(
                            performanceFilter.filter((p) => p !== "smooth")
                          );
                          if (performanceFilter.length === 1)
                            setPerformanceFilter(["all"]);
                        } else {
                          setPerformanceFilter([
                            ...performanceFilter.filter((p) => p !== "all"),
                            "smooth",
                          ]);
                        }
                      }}
                    >
                      Cân bằng
                    </Badge>
                  </div>
                </div>

                {/* More filters can be added here */}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Comparison bar (when compareMode is true) */}
      <AnimatePresence>
        {compareMode && comparedLaptops.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 z-20 w-full bg-white border-t shadow-lg"
          >
            <div className="container flex items-center justify-between p-3 mx-auto">
              <div className="flex items-center gap-4">
                <span className="font-medium">
                  So sánh {comparedLaptops.length} laptop:
                </span>
                <div className="flex gap-2">
                  {comparedLaptops.map((laptop) => (
                    <div
                      key={laptop.id}
                      className="flex items-center px-3 py-1 text-sm border rounded-full"
                    >
                      <span className="truncate max-w-[150px]">
                        {laptop.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-5 h-5 ml-1"
                        onClick={() => toggleCompare(laptop)}
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setComparedLaptops([])}
                >
                  Xóa tất cả
                </Button>
                <Button
                  disabled={comparedLaptops.length < 2}
                  onClick={() => {
                    // Navigate to comparison page
                    navigate("/compare", {
                      state: { laptops: comparedLaptops },
                    });
                  }}
                >
                  So sánh ngay
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="container p-4 mx-auto md:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 rounded-full border-t-indigo-600 animate-spin"></div>
              <p className="text-gray-500">Đang tải danh sách laptop...</p>
            </div>
          </div>
        ) : filteredLaptops.length === 0 ? (
          <motion.div
            variants={animationVariants.current.itemVariants}
            className="flex flex-col items-center justify-center min-h-[400px] text-center"
          >
            <div className="p-6 mb-4 text-indigo-700 bg-indigo-100 rounded-full">
              <Search size={32} />
            </div>
            <h2 className="mb-2 text-xl font-semibold">
              Không tìm thấy laptop nào
            </h2>
            <p className="max-w-md text-gray-500">
              Không có laptop nào phù hợp với bộ lọc của bạn. Vui lòng thử lại
              với tiêu chí khác.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setPriceRange([5000000, 50000000]);
                setScreenSizes(["all"]);
                setPerformanceFilter(["all"]);
                setDesignFilter(["all"]);
                setActiveTab("all");
              }}
              className="mt-6"
            >
              Xóa tất cả bộ lọc
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Grid View */}
            {view === "grid" && (
              <motion.div
                variants={animationVariants.current.containerVariants}
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {filteredLaptops.map((laptop, index) => {
                  const score = getRecommendationScore(laptop);
                  const isRecommended = score !== null;

                  return (
                    <motion.div
                      key={laptop.id}
                      variants={animationVariants.current.cardVariants}
                      whileHover="hover"
                      custom={index}
                      transition={{ delay: index * 0.05 }}
                      className="relative overflow-hidden"
                    >
                      <Card className="h-full overflow-hidden transition-all border hover:border-indigo-200">
                        {isRecommended && (
                          <div className="absolute top-0 right-0 flex items-center gap-1 px-2 py-1 text-xs font-medium text-white rounded-bl-lg bg-gradient-to-r from-indigo-600 to-purple-600">
                            <Star size={12} fill="white" stroke="none" />
                            <span>{(score! * 100).toFixed(0)}% phù hợp</span>
                          </div>
                        )}

                        {compareMode && (
                          <div className="absolute z-10 top-2 left-2">
                            <Checkbox
                              checked={comparedLaptops.some(
                                (l) => l.id === laptop.id
                              )}
                              onCheckedChange={() => toggleCompare(laptop)}
                              disabled={
                                comparedLaptops.length >= 3 &&
                                !comparedLaptops.some((l) => l.id === laptop.id)
                              }
                            />
                          </div>
                        )}

                        <div className="relative h-48 overflow-hidden bg-white hover:bg-gray-50">
                          <img
                          // src={`assets/laptop-images/${laptop.id}.jpg`}
                            src="https://png.pngtree.com/png-vector/20230218/ourmid/pngtree-laptop-icon-png-image_6606927.png"
                            alt={laptop.name}
                            className="object-contain w-full h-full transition-transform hover:scale-105"
                          />
                        </div>

                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg font-bold line-clamp-2">
                              {laptop.name}
                            </CardTitle>
                          </div>
                          <CardDescription className="text-base font-medium text-green-600">
                            {formatPrice(laptop.price)}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="pb-4 space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-start gap-1.5">
                              <Cpu size={14} className="mt-0.5 text-gray-500" />
                              <span className="text-gray-600 line-clamp-1">
                                {laptop.cpu}
                              </span>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <Monitor
                                size={14}
                                className="mt-0.5 text-gray-500"
                              />
                              <span className="text-gray-600 line-clamp-1">
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
                              <Battery
                                size={14}
                                className="mt-0.5 text-gray-500"
                              />
                              <span className="text-gray-600">
                                {formatBattery(laptop.battery)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Badge
                              variant="outline"
                              className={`
                                ${
                                  laptop.performance === "powerful"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-green-50 text-green-700 border-green-200"
                                }
                                text-xs
                              `}
                            >
                              <Zap size={10} className="mr-1" />
                              {laptop.performance === "powerful"
                                ? "Hiệu năng cao"
                                : "Hiệu năng ổn định"}
                            </Badge>
                          </div>
                        </CardContent>

                        <CardFooter className="pt-0">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                className="w-full gap-2"
                                variant="outline"
                                onClick={() => setSelectedLaptop(laptop)}
                              >
                                Xem chi tiết
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl bg-white">
                              <DialogHeader>
                                <DialogTitle className="text-xl">
                                  {laptop.name}
                                </DialogTitle>
                                <DialogDescription>
                                  {isRecommended ? (
                                    <div className="flex items-center gap-1 text-indigo-600">
                                      <Star
                                        size={14}
                                        fill="currentColor"
                                        stroke="none"
                                      />
                                      <span>
                                        Phù hợp {(score! * 100).toFixed(0)}% với
                                        tiêu chí của bạn
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500">
                                      Thông tin chi tiết laptop
                                    </span>
                                  )}
                                </DialogDescription>
                              </DialogHeader>

                              <div className="grid gap-6 mt-4 md:grid-cols-2">
                                <div>
                                  <div className="overflow-hidden bg-white border rounded-lg">
                                    <img
                                    // src={`assets/laptop-images/${laptop.id}.jpg`}
                                      src="https://png.pngtree.com/png-vector/20230218/ourmid/pngtree-laptop-icon-png-image_6606927.png"
                                      alt={laptop.name}
                                      className="object-contain w-full h-full transition-transform hover:scale-105"
                                    />
                                  </div>

                                  <div className="mt-4 text-2xl font-bold text-green-600">
                                    {formatPrice(laptop.price)}
                                  </div>

                                  <div className="flex flex-wrap gap-2 mt-3">
                                    <Badge
                                      variant="outline"
                                      className="gap-1 text-sm"
                                    >
                                      <DollarSign size={12} />
                                      {laptop.price < 15000000
                                        ? "Giá rẻ"
                                        : laptop.price < 25000000
                                        ? "Tầm trung"
                                        : "Cao cấp"}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="gap-1 text-sm"
                                    >
                                      <Laptop size={12} />
                                      {laptop.design === "lightweight"
                                        ? "Mỏng nhẹ"
                                        : "Tiêu chuẩn"}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase">
                                      Cấu hình
                                    </h3>
                                    <div className="space-y-3">
                                      <div className="flex">
                                        <div className="w-32 text-gray-600">
                                          CPU
                                        </div>
                                        <div className="flex-1 font-medium">
                                          {laptop.cpu}
                                        </div>
                                      </div>
                                      <div className="flex">
                                        <div className="w-32 text-gray-600">
                                          RAM
                                        </div>
                                        <div className="flex-1 font-medium">
                                          {laptop.ram}
                                        </div>
                                      </div>
                                      <div className="flex">
                                        <div className="w-32 text-gray-600">
                                          Lưu trữ
                                        </div>
                                        <div className="flex-1 font-medium">
                                          {laptop.storage}
                                        </div>
                                      </div>
                                      <div className="flex">
                                        <div className="w-32 text-gray-600">
                                          Màn hình
                                        </div>
                                        <div className="flex-1 font-medium">
                                          {laptop.screenName}
                                        </div>
                                      </div>
                                      <div className="flex">
                                        <div className="w-32 text-gray-600">
                                          Card đồ họa
                                        </div>
                                        <div className="flex-1 font-medium">
                                          {laptop.gpu}
                                        </div>
                                      </div>
                                      <div className="flex">
                                        <div className="w-32 text-gray-600">
                                          Pin
                                        </div>
                                        <div className="flex-1 font-medium">
                                          {formatBattery(laptop.battery)}
                                        </div>
                                      </div>
                                      <div className="flex">
                                        <div className="w-32 text-gray-600">
                                          Trọng lượng
                                        </div>
                                        <div className="flex-1 font-medium">
                                          {laptop.weight} kg
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {isRecommended && (
                                    <div className="p-3 rounded-lg bg-indigo-50">
                                      <h3 className="mb-2 text-sm font-semibold text-indigo-700">
                                        Điểm phù hợp theo tiêu chí
                                      </h3>
                                      <div className="space-y-2">
                                        {Object.entries(
                                          recommendationResult!.weights
                                        ).map(([criterion]) => {
                                          // Giả lập điểm phù hợp cho từng tiêu chí
                                          const criterionScore =
                                            Math.random() * 0.6 + 0.4; // 40-100%
                                          return (
                                            <div
                                              key={criterion}
                                              className="flex items-center text-sm"
                                            >
                                              <span className="w-24 text-indigo-800">
                                                {criterion}
                                              </span>
                                              <div className="flex-1 mx-2">
                                                <div className="h-1.5 overflow-hidden rounded-full bg-indigo-100">
                                                  <div
                                                    className="h-full bg-indigo-600 rounded-full"
                                                    style={{
                                                      width: `${
                                                        criterionScore * 100
                                                      }%`,
                                                    }}
                                                  ></div>
                                                </div>
                                              </div>
                                              <span className="font-medium text-indigo-700">
                                                {(criterionScore * 100).toFixed(
                                                  0
                                                )}
                                                %
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <DialogFooter className="flex justify-between mt-6 gap-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => toggleCompare(laptop)}
                                  disabled={
                                    comparedLaptops.length >= 3 &&
                                    !comparedLaptops.some(
                                      (l) => l.id === laptop.id
                                    )
                                  }
                                >
                                  {comparedLaptops.some(
                                    (l) => l.id === laptop.id
                                  )
                                    ? "Hủy so sánh"
                                    : "Thêm vào so sánh"}
                                </Button>
                                <Button>Đặt mua</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* List View */}
            {view === "list" && (
              <motion.div
                variants={animationVariants.current.containerVariants}
                className="space-y-4"
              >
                {filteredLaptops.map((laptop, index) => {
                  const score = getRecommendationScore(laptop);
                  const isRecommended = score !== null;

                  return (
                    <motion.div
                      key={laptop.id}
                      variants={animationVariants.current.itemVariants}
                      custom={index}
                      className="relative overflow-hidden"
                    >
                      <Card className="overflow-hidden transition-all border hover:border-indigo-200">
                        <div className="flex flex-col md:flex-row">
                          {compareMode && (
                            <div className="absolute z-10 top-4 left-4">
                              <Checkbox
                                checked={comparedLaptops.some(
                                  (l) => l.id === laptop.id
                                )}
                                onCheckedChange={() => toggleCompare(laptop)}
                                disabled={
                                  comparedLaptops.length >= 3 &&
                                  !comparedLaptops.some(
                                    (l) => l.id === laptop.id
                                  )
                                }
                              />
                            </div>
                          )}

                          {isRecommended && (
                            <div className="absolute top-0 right-0 flex items-center gap-1 px-2 py-1 text-xs font-medium text-white rounded-bl-lg bg-gradient-to-r from-indigo-600 to-purple-600">
                              <Star size={12} fill="white" stroke="none" />
                              <span>{(score! * 100).toFixed(0)}% phù hợp</span>
                            </div>
                          )}

                          <div className="relative w-full max-w-[180px] h-[140px] md:h-auto overflow-hidden bg-white p-4">
                            <img
                            // src={`assets/laptop-images/${laptop.id}.jpg`}
                              src="https://png.pngtree.com/png-vector/20230218/ourmid/pngtree-laptop-icon-png-image_6606927.png"
                              alt={laptop.name}
                              className="object-contain w-full h-full transition-transform hover:scale-105"
                            />
                          </div>

                          <div className="flex-1 p-4">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                              <div>
                                <h3 className="mb-1 text-lg font-bold">
                                  {laptop.name}
                                </h3>
                                <p className="text-lg font-medium text-green-600">
                                  {formatPrice(laptop.price)}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
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
                                      laptop.design === "lightweight"
                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                        : "bg-orange-50 text-orange-700 border-orange-200"
                                    }
                                  `}
                                >
                                  <Weight size={12} className="mr-1" />
                                  {laptop.design === "lightweight"
                                    ? "Mỏng nhẹ"
                                    : "Tiêu chuẩn"}
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 mt-3 text-sm gap-x-4 gap-y-2 md:grid-cols-3">
                              <div className="flex items-start gap-1.5">
                                <Cpu
                                  size={14}
                                  className="mt-0.5 text-gray-500 flex-shrink-0"
                                />
                                <span className="text-gray-600">
                                  {laptop.cpu}
                                </span>
                              </div>
                              <div className="flex items-start gap-1.5">
                                <HardDrive
                                  size={14}
                                  className="mt-0.5 text-gray-500 flex-shrink-0"
                                />
                                <span className="text-gray-600">
                                  {laptop.ram} / {laptop.storage}
                                </span>
                              </div>
                              <div className="flex items-start gap-1.5">
                                <Monitor
                                  size={14}
                                  className="mt-0.5 text-gray-500 flex-shrink-0"
                                />
                                <span className="text-gray-600">
                                  {laptop.screenName}
                                </span>
                              </div>
                              <div className="flex items-start gap-1.5">
                                <Battery
                                  size={14}
                                  className="mt-0.5 text-gray-500 flex-shrink-0"
                                />
                                <span className="text-gray-600">
                                  {formatBattery(laptop.battery)}
                                </span>
                              </div>
                              <div className="flex items-start gap-1.5">
                                <Weight
                                  size={14}
                                  className="mt-0.5 text-gray-500 flex-shrink-0"
                                />
                                <span className="text-gray-600">
                                  {laptop.weight} kg
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => toggleCompare(laptop)}
                                disabled={
                                  comparedLaptops.length >= 3 &&
                                  !comparedLaptops.some(
                                    (l) => l.id === laptop.id
                                  )
                                }
                              >
                                <SlidersHorizontal size={14} />
                                {comparedLaptops.some((l) => l.id === laptop.id)
                                  ? "Hủy so sánh"
                                  : "So sánh"}
                              </Button>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1"
                                    onClick={() => setSelectedLaptop(laptop)}
                                  >
                                    <Info size={14} />
                                    Xem chi tiết
                                  </Button>
                                </DialogTrigger>
                              </Dialog>

                              <Button size="sm">Đặt mua</Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

export default LaptopListPage;
