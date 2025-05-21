import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check,
  Cpu,
  DollarSign,
  Monitor,
  Battery,
  Palette,
  Shield,
  Laptop2,
  ArrowLeft,
  ArrowRight,
  ThumbsUp,
  Info,
  AlertTriangle,
  Database,
} from "lucide-react";
import Cookies from "js-cookie";

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
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { toast } from "./ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import apiService from "@/services/api";

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
      stiffness: 100,
    },
  },
};

// Define type for criteria keys
type CriterionKey =
  | "Hiệu năng"
  | "Giá"
  | "Màn hình"
  | "Pin"
  | "Thiết kế"
  | "Độ bền";

// Ánh xạ tiêu chí sang icon
const CRITERIA_ICONS: Record<CriterionKey, React.ElementType> = {
  "Hiệu năng": Cpu,
  Giá: DollarSign,
  "Màn hình": Monitor,
  Pin: Battery,
  "Thiết kế": Palette,
  "Độ bền": Shield,
};

// Thang điểm cho pairwise comparison
const RATING_SCALE = [
  { value: 9, label: "Cực kỳ tốt hơn" },
  { value: 7, label: "Rất tốt hơn" },
  { value: 5, label: "Tốt hơn" },
  { value: 3, label: "Hơi tốt hơn" },
  { value: 1, label: "Ngang nhau" },
  { value: 1 / 3, label: "Hơi kém hơn", display: "1/3" },
  { value: 1 / 5, label: "Kém hơn", display: "1/5" },
  { value: 1 / 7, label: "Rất kém hơn", display: "1/7" },
  { value: 1 / 9, label: "Cực kỳ kém hơn", display: "1/9" },
];

interface FormatPriceOptions {
  style: "currency";
  currency: string;
  maximumFractionDigits: number;
}

// Define interface types
interface Laptop {
  id: string;
  name: string;
  price: number;
  cpu: string;
  ram: string;
  screen: string;
  screenName?: string;
  battery?: string;
  storage?: string;
  weight?: number;
}

interface ManualRatings {
  [criterion: string]: (number | null)[][];
}

interface RatingProgress {
  completed: number;
  total: number;
  percentage: number;
}

interface RatingProgressMap {
  [criterion: string]: RatingProgress;
}

interface Pair {
  rowIndex: number;
  colIndex: number;
}

type RatingMode = "auto" | "manual";

interface ToastOptions {
  title: string;
  description: string;
  variant?: "default" | "destructive";
}

// Utility functions
function formatPrice(price: number): string {
  const options: FormatPriceOptions = {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  };

  return new Intl.NumberFormat("vi-VN", options).format(price);
}


// Component
function LaptopSelectionAndRating() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const routeState = location.state || {};

  const weightsParam = searchParams.get("weights");

  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredLaptops, setFilteredLaptops] = useState<Laptop[]>([]);
  const [selectedLaptops, setSelectedLaptops] = useState<Laptop[]>([]);
  const [activeTab, setActiveTab] = useState("selection");
  const [ratingMode, setRatingMode] = useState<RatingMode>("auto");
  const [manualRatings, setManualRatings] = useState<ManualRatings>({});
  const [ratingProgress, setRatingProgress] = useState<RatingProgressMap>({});
  const [activeCriterion, setActiveCriterion] = useState<string>("");
  const [currentPair, setCurrentPair] = useState<Pair>({
    rowIndex: 0,
    colIndex: 1,
  });
  const [showModeConfirmDialog, setShowModeConfirmDialog] = useState(false);
  const [pendingRatingMode, setPendingRatingMode] = useState<RatingMode | null>(
    null
  );

  // Replace memoized criteriaWeights and criteriaOrder with state variables
  const [criteriaWeights, setCriteriaWeights] = useState<
    Record<string, number>
  >(
    weightsParam ? JSON.parse(weightsParam) : {} // Initialize with URL param
  );

  const [criteriaOrder, setCriteriaOrder] = useState<string[]>(
    weightsParam
      ? Object.keys(JSON.parse(weightsParam))
      : ["Hiệu năng", "Giá", "Màn hình", "Pin", "Thiết kế", "Độ bền"]
  );

  // Fetch the initial data
  useEffect(() => {
    // Kiểm tra xem người dùng đã hoàn thành bước so sánh tiêu chí chưa
    const criteriaWeightsCookie = Cookies.get("criteriaWeights");
    const criteriaListCookie = Cookies.get("criteriaList");

    // Nếu thiếu bất kỳ cookie cần thiết nào, redirect về trang chủ
    if (!criteriaWeightsCookie || !criteriaListCookie) {
      console.warn("Thiếu dữ liệu tiêu chí bắt buộc, chuyển hướng về trang chủ");

      // Chuyển hướng về trang chủ với thông báo lỗi
      navigate("/", {
        state: {
          error: "Bạn cần hoàn thành bước so sánh tiêu chí trước khi xem gợi ý laptop.",
          redirectFrom: "laptop-selection"
        }
      });
      return; // Ngăn useEffect tiếp tục thực hiện
    }

    // Đọc dữ liệu từ cookies
    try {
      // Parse weights từ cookie và set vào state
      const cookieWeights = JSON.parse(criteriaWeightsCookie);
      setCriteriaWeights(cookieWeights);

      // Parse criteriaList từ cookie và set vào state
      const cookieCriteriaList = JSON.parse(criteriaListCookie);
      setCriteriaOrder(cookieCriteriaList);
    } catch (e) {
      console.error("Lỗi khi parse dữ liệu cookie:", e);
      navigate("/", {
        state: {
          error: "Dữ liệu tiêu chí không hợp lệ. Vui lòng thực hiện lại từ đầu.",
          redirectFrom: "laptop-selection"
        }
      });
      return;
    }

    // Tiếp tục code hiện tại để fetch laptop...
    const fetchLaptops = async () => {
      try {
        setLoading(true);

        // Chuẩn bị tham số
        const params = {
          usage: searchParams.get('usage') || 'general',
          fromBudget: searchParams.get('fromBudget') || '',
          toBudget: searchParams.get('toBudget') || '',
          performance: searchParams.get('performance') || '',
          design: searchParams.get('design') || '',
          fromScreenSize: searchParams.get('fromScreenSize') || '',
          toScreenSize: searchParams.get('toScreenSize') || ''
        };

        // Loại bỏ các tham số rỗng
        const filteredParams = Object.fromEntries(
          Object.entries(params).filter(([_, value]) => value !== '')
        );

        console.log("Fetching laptops with params:", filteredParams);

        // Gọi API thông qua apiService
        const data = await apiService.getLaptopsByUsage(filteredParams);

        if (data && data.laptops && Array.isArray(data.laptops)) {
          console.log("Successfully fetched laptops:", data.laptops.length);

          // Normalize the data to match our Laptop interface
          const normalizedLaptops = data.laptops.map(laptop => ({
            id: String(laptop.id),
            name: laptop.name,
            price: laptop.price,
            cpu: laptop.cpu,
            ram: laptop.ram,
            // Ensure screen is always a string, using screen_size if screen is undefined
            screen: laptop.screen || String(laptop.screen_size || ""),
            // Map screen_name to screenName with camelCase
            screenName: laptop.screen_name,
            // Keep other fields as is
            battery: String(laptop.battery || ""),
            storage: laptop.storage || ""
          }));

          setFilteredLaptops(normalizedLaptops);

          // Mặc định chọn 3 laptop đầu tiên
          const defaultSelected = normalizedLaptops.slice(0, Math.min(3, normalizedLaptops.length));
          setSelectedLaptops(defaultSelected);

          // Khởi tạo cấu trúc đánh giá thủ công
          initializeManualRatings(defaultSelected, criteriaOrder);
        } else {
          setError("Không tìm thấy laptop phù hợp");
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching laptops:", err);
        setError("Không thể kết nối đến máy chủ");
        setLoading(false);
      }
    };

    fetchLaptops();
  }, []);

  // Initialize manual ratings structure
  const initializeManualRatings = (
    laptops: Laptop[],
    criteria: string[]
  ): void => {
    const newRatings: ManualRatings = {};
    const newProgress: RatingProgressMap = {};

    // Tạo cấu trúc cho từng tiêu chí
    criteria.forEach((criterion: string) => {
      newRatings[criterion] = [];

      // Tạo ma trận nxn cho mỗi tiêu chí (n là số laptop)
      for (let i = 0; i < laptops.length; i++) {
        newRatings[criterion][i] = [];
        for (let j = 0; j < laptops.length; j++) {
          if (i === j) {
            // Giá trị chéo chính là 1 (so sánh với chính nó)
            newRatings[criterion][i][j] = 1;
          } else {
            // Các giá trị khác chưa đánh giá
            newRatings[criterion][i][j] = null;
          }
        }
      }

      // Tính số phép so sánh cần thực hiện cho tiêu chí này
      const totalComparisons: number =
        (laptops.length * (laptops.length - 1)) / 2;
      newProgress[criterion] = {
        completed: 0,
        total: totalComparisons,
        percentage: 0,
      };
    });

    setManualRatings(newRatings);
    setRatingProgress(newProgress);
  };

  // Handle toggling laptop selection
  const handleToggleLaptop = (laptop: Laptop): void => {
    setSelectedLaptops((prev: Laptop[]) => {
      const isSelected: boolean = prev.some((item) => item.id === laptop.id);

      if (isSelected) {
        // Kiểm tra số lượng tối thiểu - thay đổi từ 2 thành 3
        if (prev.length <= 3) {
          toast({
            title: "Không thể bỏ chọn",
            description: "Cần chọn ít nhất 3 laptop để so sánh",
            variant: "destructive",
          } as ToastOptions);
          return prev;
        }

        // Bỏ chọn laptop
        const newSelected: Laptop[] = prev.filter(
          (item) => item.id !== laptop.id
        );

        // Cập nhật lại cấu trúc đánh giá thủ công
        if (ratingMode === "manual") {
          initializeManualRatings(newSelected, criteriaOrder);
        }

        return newSelected;
      } else {
        // Bỏ giới hạn tối đa (trước đây là 6)
        // Thêm laptop vào danh sách đã chọn
        const newSelected: Laptop[] = [...prev, laptop];

        // Cập nhật lại cấu trúc đánh giá thủ công
        if (ratingMode === "manual") {
          initializeManualRatings(newSelected, criteriaOrder);
        }

        return newSelected;
      }
    });
  };

  // Proceed to rating screen
  const handleProceedToRating = () => {
    if (selectedLaptops.length < 3) {
      toast({
        title: "Chưa đủ laptop",
        description: "Vui lòng chọn ít nhất 3 laptop để tiếp tục",
        variant: "destructive",
      } as ToastOptions);
      return;
    }

    setActiveTab("rating");

    // Nếu là chế độ thủ công, bắt đầu với tiêu chí đầu tiên
    if (ratingMode === "manual" && criteriaOrder.length > 0) {
      setActiveCriterion(criteriaOrder[0]);
      setCurrentPair({ rowIndex: 0, colIndex: 1 });
    }
  };

  // Handle rating mode change
  const handleRatingModeChange = (mode: RatingMode): void => {
    if (mode === ratingMode) return;

    // Nếu đã có đánh giá thủ công và đang chuyển sang tự động, hiện dialog xác nhận
    if (ratingMode === "manual" && mode === "auto" && isAnyRatingCompleted()) {
      setPendingRatingMode(mode);
      setShowModeConfirmDialog(true);
    } else {
      // Nếu không, chuyển trực tiếp
      applyRatingModeChange(mode);
    }
  };

  // Check if any ratings have been completed
  const isAnyRatingCompleted = () => {
    for (const criterion of criteriaOrder) {
      if (ratingProgress[criterion]?.completed > 0) {
        return true;
      }
    }
    return false;
  };

  // Apply rating mode change
  const applyRatingModeChange = (mode: RatingMode): void => {
    setRatingMode(mode);

    if (mode === "manual") {
      // Khởi tạo cấu trúc đánh giá khi chuyển sang chế độ thủ công
      initializeManualRatings(selectedLaptops, criteriaOrder);
      toast({
        title: "Chế độ đánh giá thủ công",
        description: "Bạn sẽ cần đánh giá từng cặp laptop cho mỗi tiêu chí",
      } as ToastOptions);
    } else {
      toast({
        title: "Chế độ đánh giá tự động",
        description: "Hệ thống sẽ tự đánh giá laptop dựa trên thuật toán",
      } as ToastOptions);
    }
  };

  // Xác nhận thay đổi chế độ đánh giá từ dialog
  const handleConfirmModeChange = () => {
    if (pendingRatingMode) {
      applyRatingModeChange(pendingRatingMode);
      setPendingRatingMode(null);
    }
    setShowModeConfirmDialog(false);
  };

  // Rate a laptop pair
  const handleRateLaptopPair = (
    criterion: string,
    rowIndex: number,
    colIndex: number,
    value: number
  ): void => {
    // Cập nhật ma trận đánh giá
    setManualRatings((prev: ManualRatings) => {
      const newRatings: ManualRatings = { ...prev };

      // Cập nhật giá trị và giá trị đối xứng
      newRatings[criterion][rowIndex][colIndex] = value;
      newRatings[criterion][colIndex][rowIndex] =
        typeof value === "number" ? 1 / value : 1;

      return newRatings;
    });

    // Cập nhật tiến độ đánh giá
    setRatingProgress((prev: RatingProgressMap) => {
      const newProgress: RatingProgressMap = { ...prev };

      // Tính số phép so sánh đã hoàn thành
      let completed: number = 0;
      for (let i: number = 0; i < selectedLaptops.length; i++) {
        for (let j: number = i + 1; j < selectedLaptops.length; j++) {
          if (manualRatings[criterion][i][j] !== null) {
            completed++;
          }
        }
      }

      const total: number = newProgress[criterion].total;
      newProgress[criterion] = {
        completed: completed + 1, // +1 cho phép so sánh vừa thực hiện
        total,
        percentage: Math.min(Math.round(((completed + 1) / total) * 100), 100),
      };

      return newProgress;
    });

    // Chuyển sang cặp tiếp theo
    moveToNextPair(criterion);
  };

  // Move to next laptop pair
  const moveToNextPair = (criterion: string): void => {
    const n: number = selectedLaptops.length;
    let { rowIndex, colIndex }: Pair = currentPair;

    // Tìm cặp tiếp theo chưa được đánh giá
    let foundNext: boolean = false;

    // Bắt đầu từ vị trí hiện tại và tìm cặp tiếp theo
    for (let i: number = rowIndex; i < n; i++) {
      // Xác định cột bắt đầu
      let startJ: number = i === rowIndex ? colIndex + 1 : i + 1;

      for (let j: number = startJ; j < n; j++) {
        if (manualRatings[criterion][i][j] === null) {
          setCurrentPair({ rowIndex: i, colIndex: j });
          foundNext = true;
          break;
        }
      }

      if (foundNext) break;
    }

    // Nếu không tìm thấy cặp tiếp theo (đã hoàn thành tiêu chí hiện tại)
    if (!foundNext) {
      // Kiểm tra xem đã hoàn thành tất cả các tiêu chí chưa
      const currentIndex: number = criteriaOrder.indexOf(criterion);
      if (currentIndex < criteriaOrder.length - 1) {
        // Chuyển sang tiêu chí tiếp theo
        const nextCriterion: string = criteriaOrder[currentIndex + 1];
        setActiveCriterion(nextCriterion);
        setCurrentPair({ rowIndex: 0, colIndex: 1 });

        toast({
          title: "Đã hoàn thành tiêu chí",
          description: `Chuyển sang đánh giá tiêu chí: ${nextCriterion}`,
        } as ToastOptions);
      } else {
        // Đã hoàn thành tất cả các tiêu chí
        toast({
          title: "Đã hoàn thành",
          description: "Bạn đã đánh giá tất cả các cặp laptop",
          variant: "default",
        } as ToastOptions);
      }
    }
  };

  // Thêm state này trong đoạn khai báo các state của component, sau các state hiện có
const [ratingDialogValue, setRatingDialogValue] = useState<{
  isOpen: boolean;
  criterion: string | null;
  rowIndex: number | null;
  colIndex: number | null;
}>({
  isOpen: false,
  criterion: null,
  rowIndex: null,
  colIndex: null,
});

// Thêm các hàm này vào phần các function trong component
// Mở dialog để chọn giá trị đánh giá
const openRatingDialog = (criterion: string, rowIndex: number, colIndex: number) => {
  setRatingDialogValue({
    isOpen: true,
    criterion,
    rowIndex,
    colIndex
  });
};

// Reset giá trị dialog về mặc định và đóng dialog
const resetRatingDialog = () => {
  setRatingDialogValue({
    isOpen: false,
    criterion: null,
    rowIndex: null,
    colIndex: null
  });
};

  // Check if all ratings are complete
  const isRatingComplete = () => {
    if (ratingMode === "auto") return true;

    // Kiểm tra từng tiêu chí
    for (const criterion of criteriaOrder) {
      if (
        !ratingProgress[criterion] ||
        ratingProgress[criterion].percentage < 100
      ) {
        return false;
      }
    }

    return true;
  };

  // Sửa lại hàm formatManualRatingsForAPI
  const formatManualRatingsForAPI = (_criterion: string, matrix: (number | null)[][]): any[] => {
    const result = [];
    
    for (let i = 0; i < matrix.length; i++) {
      for (let j = i + 1; j < matrix[i].length; j++) {
        // Kiểm tra matrix[i][j] không null và selectedLaptops[i], selectedLaptops[j] tồn tại
        if (matrix[i][j] !== null && 
            i < selectedLaptops.length && 
            j < selectedLaptops.length) {
            
          // Đảm bảo các đối tượng laptop tồn tại và có thuộc tính name
          const laptopA = selectedLaptops[i];
          const laptopB = selectedLaptops[j];
          
          if (laptopA && laptopB && laptopA.name && laptopB.name) {
            // Định dạng theo mẫu API: row/column sử dụng tên laptop thay vì index
            result.push({
                row: laptopA.name,
                column: laptopB.name,
                // Chuyển đổi giá trị sang string định dạng phân số nếu là phân số
                value: matrix[i][j] !== null ? 
                  (Number(matrix[i][j]) < 1 ? 
                    `1/${Math.round(1/Number(matrix[i][j]))}` : 
                    matrix[i][j]) : 
                  "1"
            });
          }
        }
      }
    }
    
    return result;
  };

  // Cập nhật handleComplete để lưu kết quả vào cookies và sử dụng API đúng cách
  const handleComplete = async () => {
    if (ratingMode === "manual" && !isRatingComplete()) {
      toast({
        title: "Chưa hoàn thành đánh giá",
        description: "Vui lòng đánh giá tất cả các cặp laptop trước khi tiếp tục",
        variant: "destructive",
      } as ToastOptions);
      return;
    }

    setLoading(true);

    try {
      // Chuẩn bị dữ liệu theo định dạng API yêu cầu
      const requestData: any = {
        criteria_weights: criteriaWeights,
        filtered_laptops: filteredLaptops,
        evaluationMethod: ratingMode,
      };

      // Nếu là đánh giá thủ công, thêm các thông tin bắt buộc
      if (ratingMode === "manual") {
        // Thêm danh sách laptop đã chọn với chỉ id và name
        requestData.selectedLaptops = selectedLaptops.map(laptop => ({
          id: laptop.id,
          name: laptop.name
        }));
        
        // Định dạng lại ma trận so sánh theo mẫu API
        const laptopComparisons: Record<string, any[]> = {};
        
        criteriaOrder.forEach((criterion) => {
          laptopComparisons[criterion] = formatManualRatingsForAPI(
            criterion, manualRatings[criterion]
          );
        });
        
        requestData.laptopComparisons = laptopComparisons;
      }

      // Log data gửi đi để debug
      console.log("Submitting data to API:", requestData);

      // Gửi request đến API
      const response = await fetch("/api/evaluate-laptops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      // Kiểm tra xem response có thành công không
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("API response:", data);

      // Kiểm tra xem API đã trả về kết quả đầy đủ chưa hay chỉ là task_id
      if (data.status === "success" && data.ranked_laptops) {
        // API đã trả về kết quả đầy đủ ngay lập tức
        handleApiResults(data);
      } else if (data.task_id) {
        // API chỉ trả về task_id, cần phải poll để lấy kết quả
        await pollForResults(data.task_id);
      } else {
        // Trường hợp không xác định
        setError(data.message || "Có lỗi xảy ra khi xử lý đánh giá");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error submitting ratings:", err);
      setError("Không thể kết nối đến máy chủ");
      setLoading(false);
    }
  };

  // Hàm mới: Poll API để kiểm tra kết quả theo task_id
  const pollForResults = async (taskId: string) => {
    // Hiển thị thông báo đang xử lý
    toast({
      title: "Đang xử lý",
      description: "Hệ thống đang xếp hạng laptop, vui lòng đợi...",
      duration: 3000,
    });

    // Số lần tối đa thử lấy kết quả (mỗi lần cách nhau 1 giây)
    const maxAttempts = 20; 
    let attempts = 0;

    const checkResult = async () => {
      if (attempts >= maxAttempts) {
        setError("Quá thời gian chờ kết quả xử lý");
        setLoading(false);
        return;
      }

      attempts++;
      
      try {
        // Gọi API kiểm tra trạng thái của task
        const response = await fetch(`/api/task-status/${taskId}`);
        const data = await response.json();

        if (data.status === "success" && data.result) {
          // Nếu có kết quả, xử lý và điều hướng
          handleApiResults(data.result);
        } else if (data.status === "processing") {
          // Nếu vẫn đang xử lý, đợi 1 giây và thử lại
          setTimeout(checkResult, 1000);
        } else {
          // Nếu có lỗi
          setError(data.message || "Có lỗi xảy ra khi xử lý đánh giá");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error checking task status:", err);
        setError("Không thể kết nối đến máy chủ khi kiểm tra kết quả");
        setLoading(false);
      }
    };

    // Bắt đầu poll
    await checkResult();
  };

  // Hàm mới: Xử lý kết quả API và điều hướng
  const handleApiResults = (data: any) => {
    // Xử lý và chuẩn hóa dữ liệu 
    const normalizedResult = {
      status: data.status,
      ranked_laptops: data.ranked_laptops || [],
      weights: data.criteria_weights || criteriaWeights, 
      laptop_count: data.laptop_count || filteredLaptops.length,
      message: data.message,
      stage: data.stage
    };
    
    console.log("Normalized result data:", normalizedResult);

    // Lưu kết quả vào localStorage để backup
    localStorage.setItem("recommendation_result", JSON.stringify(normalizedResult));

    // Lưu kết quả vào cookie
    Cookies.set("evaluationResults", JSON.stringify(normalizedResult), {
      expires: 1,
      path: "/",
    });

    // Chuyển đến trang kết quả
    navigate("/recommendations", {
      state: {
        ...routeState,
        result: normalizedResult,
        ratingMode,
        selectedLaptopCount: selectedLaptops.length,
        manualEvaluation: ratingMode === "manual",
        criteriaWeights: criteriaWeights,
      },
    });
  };

  // Thêm hàm handleAutoSuggest vào cùng vị trí với các hàm khác trong component

  // Auto-suggest ratings for the current criterion
  const handleAutoSuggest = () => {
    if (!activeCriterion || ratingMode !== "manual") return;

    // Xác nhận từ người dùng
    if (
      !window.confirm(
        `Bạn có muốn hệ thống tự động gợi ý đánh giá cho tiêu chí ${activeCriterion}? Bạn có thể điều chỉnh lại sau.`
      )
    ) {
      return;
    }

    // Lấy thông tin của các laptop đã chọn
    const laptops = selectedLaptops;
    const criterion = activeCriterion;

    // Hàm phân tích và trích xuất giá trị số từ các thông số laptop
    const extractNumericValue = (value: string | undefined | null): number => {
      if (!value) return 0;
      // Trích xuất số từ chuỗi
      const match = value.match(/\d+(\.\d+)?/);
      return match ? parseFloat(match[0]) : 0;
    };

    // Hàm phân tích CPU score dựa trên tên CPU
    const getCpuScore = (cpuName: string | undefined): number => {
      if (!cpuName) return 50;
      
      const score = 
        cpuName.includes("Ryzen 9") || cpuName.includes("i9") ? 95 :
        cpuName.includes("Ryzen 7") || cpuName.includes("i7") ? 85 :
        cpuName.includes("Ryzen 5") || cpuName.includes("i5") ? 70 :
        cpuName.includes("Ryzen 3") || cpuName.includes("i3") ? 55 : 50;
        
      // Thêm điểm cho thế hệ CPU (số càng cao càng tốt)
      const genMatch = cpuName.match(/\d{4,5}/);
      const generation = genMatch ? parseInt(genMatch[0].substring(0, 1)) : 0;
      
      return score + (generation * 2);
    };
    
    // Tính điểm cho từng laptop theo tiêu chí hiện tại
    const getScoreForCriterion = (laptop: Laptop, criterionName: string): number => {
      switch (criterionName) {
        case "Hiệu năng":
          const cpuScore = getCpuScore(laptop.cpu);
          const ramSizeMatch = laptop.ram?.match(/\d+/);
          const ramScore = ramSizeMatch ? parseInt(ramSizeMatch[0]) : 8;
          const isDDR5 = laptop.ram?.toLowerCase().includes("ddr5") ? 1.2 : 1;
          
          return cpuScore * 0.6 + (ramScore * isDDR5 * 3);
          
        case "Giá":
          // Giá thấp hơn thì tốt hơn -> điểm cao hơn (nghịch đảo)
          return laptop.price ? 2000000000 / laptop.price : 1;
          
        case "Màn hình":
          const screenSize = parseFloat(laptop.screen || "14") || 14;
          const resolution = 
            (laptop.screenName || "").toLowerCase().includes("4k") ? 3 :
            (laptop.screenName || "").toLowerCase().includes("2k") || 
            (laptop.screenName || "").toLowerCase().includes("qhd") ? 2 :
            (laptop.screenName || "").toLowerCase().includes("fhd") ? 1.5 : 1;
          const isOLED = (laptop.screenName || "").toLowerCase().includes("oled") ? 1.5 : 1;
          
          return screenSize * resolution * isOLED;
          
        case "Pin":
          // Trích xuất dung lượng pin (mAh)
          const batteryCapacity = extractNumericValue(laptop.battery);
          return batteryCapacity / 1000; // Chia để có số điểm hợp lý
          
        case "Thiết kế":
          // Trọng lượng nhẹ hơn thì tốt hơn -> nghịch đảo
          return laptop.weight ? 3 / laptop.weight : 1;
          
        case "Độ bền":
          // Đối với độ bền, ưu tiên các thương hiệu "bền"
          const brand = laptop.name.toLowerCase();
          const durabilityScore =
            brand.includes("thinkpad") || brand.includes("dell") ? 9 :
            brand.includes("hp") || brand.includes("lenovo") ? 7 :
            brand.includes("asus") ? 6 :
            brand.includes("acer") ? 5 : 4;
            
          return durabilityScore;
          
        default:
          return 1;
      }
    };

    // Tính điểm cho tất cả laptop theo tiêu chí hiện tại
    const scores = laptops.map(laptop => ({
      id: laptop.id,
      name: laptop.name,
      score: getScoreForCriterion(laptop, criterion)
    }));
    
    console.log(`Điểm ${criterion} của các laptop:`, scores);

    // Tạo ma trận so sánh mới
    const newMatrix: (number | null)[][] = [];
    for (let i = 0; i < laptops.length; i++) {
      newMatrix[i] = [];
      for (let j = 0; j < laptops.length; j++) {
        if (i === j) {
          newMatrix[i][j] = 1; // Đường chéo chính luôn = 1
        } else {
          // Tính tỷ lệ điểm giữa 2 laptop
          let ratio = scores[i].score / scores[j].score;
          
          // Áp dụng hiệu chỉnh cho tiêu chí Giá (để so sánh trực quan hơn)
          if (criterion === "Giá") {
            const priceDiff = Math.abs(laptops[i].price - laptops[j].price);
            if (priceDiff < 1000000) ratio = ratio > 1 ? 1 : ratio; // Chênh lệch ít hơn 1 triệu đồng
            else if (priceDiff < 3000000) ratio = ratio > 1 ? Math.min(ratio, 2) : Math.max(ratio, 1/2); // Chênh lệch 1-3 triệu
            else if (priceDiff < 5000000) ratio = ratio > 1 ? Math.min(ratio, 3) : Math.max(ratio, 1/3); // Chênh lệch 3-5 triệu
          }

          // Giới hạn trong thang điểm AHP (1/9 đến 9)
          if (ratio > 9) ratio = 9;
          else if (ratio < 1/9) ratio = 1/9;

          // Làm tròn đến giá trị thang đánh giá gần nhất
          const ratingValues = [9, 7, 5, 3, 2, 1, 1/2, 1/3, 1/5, 1/7, 1/9];
          let closest = 1;
          let minDiff = Math.abs(ratio - 1);

          for (const val of ratingValues) {
            const diff = Math.abs(ratio - val);
            if (diff < minDiff) {
              minDiff = diff;
              closest = val;
            }
          }

          // Nếu tỷ lệ gần với 1, coi như bằng nhau
          if (ratio >= 0.8 && ratio <= 1.25) closest = 1;

          newMatrix[i][j] = closest;
        }
      }
    }

    // Log ma trận để debug
    console.log(`Ma trận so sánh ${criterion} được gợi ý:`, newMatrix);

    // Cập nhật ma trận đánh giá
    setManualRatings((prev) => {
      const updated = { ...prev };
      updated[criterion] = newMatrix;
      return updated;
    });

    // Cập nhật tiến độ - đánh dấu đã hoàn thành 100% cho tiêu chí này
    setRatingProgress((prev) => {
      const updated = { ...prev };
      updated[criterion] = {
        completed: updated[criterion].total,
        total: updated[criterion].total,
        percentage: 100,
      };
      return updated;
    });

    toast({
      title: "Gợi ý hoàn tất",
      description: `Đã tự động gợi ý đánh giá cho tiêu chí ${criterion}`,
      variant: "default",
    } as ToastOptions);

    // Chuyển đến tiêu chí tiếp theo nếu có
    const currentIndex = criteriaOrder.indexOf(criterion);
    if (currentIndex < criteriaOrder.length - 1) {
      const nextCriterion = criteriaOrder[currentIndex + 1];
      setActiveCriterion(nextCriterion);
      setCurrentPair({ rowIndex: 0, colIndex: 1 });
    }
  };

  // Render component UI
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen p-4 bg-gradient-to-br from-slate-50 to-slate-100 md:p-8"
    >
      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-16 h-16 border-4 rounded-full border-slate-200 border-t-blue-500 animate-spin"></div>
          <p className="font-medium text-slate-600">
            Đang tải dữ liệu laptop...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <motion.div variants={itemVariants} className="max-w-2xl mx-auto my-8">
          <Alert variant="destructive" className="mb-8">
            <AlertTriangle className="w-5 h-5" />
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <Button onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </motion.div>
      )}

      {/* Main content when not loading and no error */}
      {!loading && !error && (
        <div className="max-w-6xl mx-auto">
          <motion.div variants={itemVariants}>
            <div className="flex flex-col mb-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  Lựa chọn và đánh giá laptop
                </h1>
                <p className="mt-1 text-slate-500">
                  Chọn các laptop bạn quan tâm và đánh giá chúng
                </p>
              </div>

              <div className="mt-4 md:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại tiêu chí
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Tabs for selection and rating */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="selection"
                disabled={
                  activeTab === "rating" &&
                  ratingMode === "manual" &&
                  !isRatingComplete()
                }
              >
                <Laptop2 className="w-4 h-4 mr-2" />
                Chọn laptop
              </TabsTrigger>
              <TabsTrigger value="rating" disabled={selectedLaptops.length < 3}>
                <ThumbsUp className="w-4 h-4 mr-2" />
                Đánh giá
              </TabsTrigger>
            </TabsList>

            {/* Laptop selection tab */}
            <TabsContent value="selection" className="mt-6">
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Chọn laptop ({selectedLaptops.length})</span>
                      <Badge
                        variant={
                          selectedLaptops.length >= 3 ? "default" : "outline"
                        }
                      >
                        {selectedLaptops.length >= 3
                          ? `${selectedLaptops.length} laptop đã chọn`
                          : "Cần chọn ít nhất 3 laptop"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Chọn ít nhất 3 laptop để tiến hành so sánh
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[50vh]">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {filteredLaptops.map((laptop) => {
                          const isSelected = selectedLaptops.some(
                            (l) => l.id === laptop.id
                          );

                          return (
                            <Card
                              key={laptop.id}
                              className={`
                                cursor-pointer transition-all duration-200 
                                ${
                                  isSelected
                                    ? "ring-2 ring-blue-500 bg-blue-50"
                                    : "hover:bg-slate-50"
                                }
                              `}
                              onClick={() => handleToggleLaptop(laptop)}
                            >
                              <CardContent className="flex items-start gap-4 p-4">
                                <div className="min-w-[24px] pt-1">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() =>
                                      handleToggleLaptop(laptop)
                                    }
                                  />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium text-slate-800">
                                    {laptop.name}
                                  </h3>
                                  <p className="mt-1 text-xl font-semibold text-blue-600">
                                    {formatPrice(laptop.price)}
                                  </p>
                                  <div className="grid grid-cols-2 mt-2 text-sm gap-x-4 gap-y-2 text-slate-600">
                                    <div className="flex items-center gap-1">
                                      <Cpu className="h-3.5 w-3.5 text-slate-400" />
                                      <span>{laptop.cpu}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Monitor className="h-3.5 w-3.5 text-slate-400" />
                                      <span>
                                        {laptop.screen}" {laptop.screenName}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Database className="h-3.5 w-3.5 text-slate-400" />
                                      <span>
                                        {laptop.ram} / {laptop.storage}
                                      </span>
                                    </div>
                                    {laptop.battery && (
                                      <div className="flex items-center gap-1">
                                        <Battery className="h-3.5 w-3.5 text-slate-400" />
                                        <span>{laptop.battery}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-6 border-t">
                    <Button variant="outline" onClick={() => navigate(-1)}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Quay lại
                    </Button>
                    <Button
                      onClick={handleProceedToRating}
                      disabled={selectedLaptops.length < 3}
                    >
                      Tiếp tục
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Rating tab */}
            <TabsContent value="rating" className="mt-6">
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Đánh giá laptop</span>
                      <div className="flex gap-2">
                        <Badge
                          variant={
                            ratingMode === "auto" ? "default" : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => handleRatingModeChange("auto")}
                        >
                          Tự động
                        </Badge>
                        <Badge
                          variant={
                            ratingMode === "manual" ? "default" : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => handleRatingModeChange("manual")}
                        >
                          Thủ công
                        </Badge>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      {ratingMode === "auto"
                        ? "Hệ thống sẽ tự động đánh giá các laptop dựa trên thuộc tính kỹ thuật"
                        : "Đánh giá từng cặp laptop cho mỗi tiêu chí để có kết quả chính xác nhất"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {ratingMode === "auto" ? (
                      <div className="space-y-6">
                        <Alert>
                          <Info className="w-5 h-5" />
                          <AlertTitle>Chế độ đánh giá tự động</AlertTitle>
                          <AlertDescription>
                            Hệ thống sẽ tự động đánh giá các laptop dựa trên
                            thuộc tính kỹ thuật như CPU, RAM, màn hình... và
                            trọng số các tiêu chí bạn đã nhập.
                          </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-3">
                          {selectedLaptops.map((laptop) => (
                            <Card key={laptop.id} className="bg-slate-50">
                              <CardContent className="p-4">
                                <h3 className="font-medium text-slate-800">
                                  {laptop.name}
                                </h3>
                                <p className="mt-1 text-blue-600">
                                  {formatPrice(laptop.price)}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-2">
                          {criteriaOrder.map((criterion) => {
                            const Icon =
                              CRITERIA_ICONS[criterion as CriterionKey] || Info;
                            const weight = criteriaWeights[criterion] || 0;

                            return (
                              <div
                                key={criterion}
                                className="flex items-center gap-3 p-3 border rounded-lg"
                              >
                                <div
                                  className={`p-2 rounded-full bg-slate-100`}
                                >
                                  <Icon className="w-5 h-5 text-slate-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">{criterion}</div>
                                  <div className="text-sm text-slate-500">
                                    Trọng số: {(weight * 100).toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Manual rating UI */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {criteriaOrder.map((criterion) => {
                            const Icon =
                              CRITERIA_ICONS[criterion as CriterionKey] || Info;
                            const isActive = criterion === activeCriterion;
                            const progress =
                              ratingProgress[criterion]?.percentage || 0;

                            return (
                              <Badge
                                key={criterion}
                                variant={isActive ? "default" : "outline"}
                                className={`
                                  cursor-pointer px-3 py-1 
                                  ${isActive ? "bg-blue-500" : ""} 
                                  ${
                                    progress === 100
                                      ? "border-green-500 text-green-700"
                                      : ""
                                  }
                                `}
                                onClick={() => setActiveCriterion(criterion)}
                              >
                                <Icon className="h-3.5 w-3.5 mr-1" />
                                {criterion}
                                {progress > 0 && (
                                  <span className="ml-2 text-xs">
                                    {progress}%
                                    {progress === 100 && (
                                      <Check className="inline h-3 w-3 ml-0.5" />
                                    )}
                                  </span>
                                )}
                              </Badge>
                            );
                          })}

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="px-2 h-7"
                                  onClick={handleAutoSuggest}
                                  disabled={!activeCriterion}
                                >
                                  <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                                  Gợi ý tự động
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Gợi ý đánh giá tự động cho tiêu chí hiện tại
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        {activeCriterion ? (
                          <div className="space-y-6">
                            <Alert className="border-blue-200 bg-blue-50">
                              <Info className="w-4 h-4" />
                              <AlertTitle>Bảng ma trận so sánh cho tiêu chí: <span className="font-bold">{activeCriterion}</span></AlertTitle>
                              <AlertDescription>
                                So sánh các laptop theo hàng với các laptop theo cột. Chọn giá trị để thể hiện laptop ở hàng tốt hơn/kém hơn laptop ở cột bao nhiêu lần.
                              </AlertDescription>
                            </Alert>

                            {/* Hiển thị tiến độ */}
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium">Ma trận so sánh</h3>
                                <p className="text-sm text-slate-500">Điền các ô còn trống, các ô đối xứng sẽ tự động cập nhật</p>
                              </div>
                              <div className="text-sm text-slate-600">
                                Hoàn thành: {ratingProgress[activeCriterion]?.completed || 0}/{ratingProgress[activeCriterion]?.total || 0}
                              </div>
                            </div>
                            
                            <Progress
                              value={ratingProgress[activeCriterion]?.percentage || 0}
                              className="h-2"
                            />

                            {/* Matrix table */}
                            <div className="overflow-auto">
                              <table className="min-w-full border-collapse">
                                <thead>
                                  <tr className="bg-slate-100">
                                    <th className="p-2 font-medium text-left border text-slate-700">
                                      {activeCriterion} 
                                    </th>
                                    {selectedLaptops.map((laptop, index) => (
                                      <th key={laptop.id} className="p-2 font-medium text-center border text-slate-700">
                                        <div className="flex flex-col items-center">
                                          <span className="inline-flex items-center justify-center w-6 h-6 mb-1 text-blue-700 bg-blue-100 rounded-full">
                                            {String.fromCharCode(65 + index)} {/* A, B, C, etc. */}
                                          </span>
                                          <span className="text-xs">{laptop.name.length > 15 ? `${laptop.name.substring(0, 15)}...` : laptop.name}</span>
                                        </div>
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedLaptops.map((rowLaptop, rowIndex) => (
                                    <tr key={rowLaptop.id} className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                      <td className="p-2 font-medium border">
                                        <div className="flex items-center gap-2">
                                          <span className="inline-flex items-center justify-center w-6 h-6 text-blue-700 bg-blue-100 rounded-full">
                                            {String.fromCharCode(65 + rowIndex)} {/* A, B, C, etc. */}
                                          </span>
                                          <span>{rowLaptop.name}</span>
                                        </div>
                                      </td>
                                      {selectedLaptops.map((colLaptop, colIndex) => {
                                        const value = manualRatings[activeCriterion]?.[rowIndex]?.[colIndex];
                                        const isEditable = rowIndex !== colIndex && rowIndex < colIndex;
                                        const cellClass = rowIndex === colIndex 
                                          ? "bg-slate-100 text-center font-medium" 
                                          : isEditable
                                            ? "bg-white cursor-pointer hover:bg-blue-50" 
                                            : "bg-slate-50";

                                        // Format the display value
                                        const displayValue = rowIndex === colIndex 
                                          ? "1" 
                                          : typeof value === "number" 
                                            ? value < 1 
                                              ? `1/${Math.round(1/value)}` 
                                              : value.toString()
                                            : "?";

                                        return (
                                          <td 
                                            key={`${rowLaptop.id}-${colLaptop.id}`}
                                            className={`p-2 border ${cellClass}`}
                                            onClick={() => {
                                              if (isEditable) {
                                                // Show a selection dialog or dropdown
                                                openRatingDialog(activeCriterion, rowIndex, colIndex);
                                              }
                                            }}
                                          >
                                            {isEditable ? (
                                              <div className={`w-full h-full flex items-center justify-center rounded ${value === null ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-700'}`}>
                                                {displayValue}
                                              </div>
                                            ) : (
                                              <div className="w-full text-center text-slate-600">
                                                {displayValue}
                                              </div>
                                            )}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Legend */}
                            <div className="mt-4">
                              <h4 className="mb-2 text-sm font-medium">Thang điểm:</h4>
                              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
                                {RATING_SCALE.map((rating) => (
                                  <div key={rating.value} className="flex items-center gap-1 text-sm">
                                    <span className="flex items-center justify-center w-8 h-6 border border-blue-100 rounded bg-blue-50">
                                      {rating.display || rating.value}
                                    </span>
                                    <span className="text-slate-600">{rating.label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Alert>
                            <Info className="w-4 h-4" />
                            <AlertTitle>Chọn một tiêu chí</AlertTitle>
                            <AlertDescription>
                              Vui lòng chọn một tiêu chí từ danh sách trên để bắt đầu đánh giá.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("selection")}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Chọn laptop
                    </Button>
                    <Button
                      onClick={handleComplete}
                      disabled={ratingMode === "manual" && !isRatingComplete()}
                    >
                      Hoàn thành
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Confirmation dialog for rating mode change */}
      <Dialog
        open={showModeConfirmDialog}
        onOpenChange={setShowModeConfirmDialog}
      >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Thay đổi chế độ đánh giá</DialogTitle>
            <DialogDescription>
              Bạn đã thực hiện một số đánh giá thủ công. Thay đổi chế độ sẽ
              khiến các đánh giá này bị mất. Bạn có chắc chắn muốn tiếp tục?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModeConfirmDialog(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleConfirmModeChange}>
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Thêm Dialog để chọn giá trị so sánh */}
      <Dialog open={!!ratingDialogValue.isOpen} onOpenChange={(open) => !open && resetRatingDialog()}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>So sánh laptop cho tiêu chí {ratingDialogValue.criterion}</DialogTitle>
            <DialogDescription>
              Chọn mức độ chênh lệch giữa laptop {String.fromCharCode(65 + (ratingDialogValue.rowIndex ?? 0))} và laptop {String.fromCharCode(65 + (ratingDialogValue.colIndex ?? 0))}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="pb-2 font-medium text-center border-b">
                Laptop {String.fromCharCode(65 + (ratingDialogValue.rowIndex ?? 0))} tốt hơn
              </p>
              {RATING_SCALE.slice(0, 4).map((rating) => (
                <Button
                  key={`dialog-a-${rating.value}`}
                  variant="outline"
                  className="justify-between w-full"
                  onClick={() => {
                    if (ratingDialogValue.criterion && ratingDialogValue.rowIndex !== null && ratingDialogValue.colIndex !== null) {
                      handleRateLaptopPair(
                        ratingDialogValue.criterion,
                        ratingDialogValue.rowIndex,
                        ratingDialogValue.colIndex,
                        rating.value
                      );
                      resetRatingDialog();
                    }
                  }}
                >
                  <span>{rating.label}</span>
                  <span className="px-2 rounded bg-blue-50">{rating.display || rating.value}</span>
                </Button>
              ))}
            </div>
            
            <div className="space-y-2">
              <p className="pb-2 font-medium text-center border-b">
                Laptop {String.fromCharCode(65 + (ratingDialogValue.colIndex ?? 0))} tốt hơn
              </p>
              <Button
                variant="outline"
                className="justify-between w-full"
                onClick={() => {
                  if (ratingDialogValue.criterion && ratingDialogValue.rowIndex !== null && ratingDialogValue.colIndex !== null) {
                    handleRateLaptopPair(
                      ratingDialogValue.criterion,
                      ratingDialogValue.rowIndex,
                      ratingDialogValue.colIndex,
                      1
                    );
                    resetRatingDialog();
                  }
                }}
              >
                <span>Ngang nhau</span>
                <span className="px-2 rounded bg-gray-50">1</span>
              </Button>
              
              {RATING_SCALE.slice(5).map((rating) => (
                <Button
                  key={`dialog-b-${rating.value}`}
                  variant="outline"
                  className="justify-between w-full"
                  onClick={() => {
                    if (ratingDialogValue.criterion && ratingDialogValue.rowIndex !== null && ratingDialogValue.colIndex !== null) {
                      handleRateLaptopPair(
                        ratingDialogValue.criterion,
                        ratingDialogValue.rowIndex,
                        ratingDialogValue.colIndex,
                        rating.value
                      );
                      resetRatingDialog();
                    }
                  }}
                >
                  <span>{rating.label}</span>
                  <span className="px-2 rounded bg-indigo-50">{rating.display || rating.value}</span>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export default LaptopSelectionAndRating;