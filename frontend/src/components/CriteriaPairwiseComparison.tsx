import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { toast } from "./ui/use-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "./ui/card";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Scale,
  CheckCircle,
  BarChart3,
  Edit,
  ArrowRight,
  Save,
  Eye,
  XCircle,
  Clock,
  Calculator,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import apiService from "@/services/api";
import { Comparison, ComparisonRequest } from "@/types";

// Define criteria based on usage
const CRITERIA_BY_USAGE = {
  office: [
    "Hiệu năng",
    "Giá",
    "Màn hình",
    "Pin",
    "Thiết kế",
    "Độ bền",
  ],
  gaming: [
    "Hiệu năng",
    "Card đồ họa",
    "Màn hình",
    "Tản nhiệt",
    "Giá",
    "Độ bền",
  ],
  mobility: [
    "Pin",
    "Trọng lượng",
    "Hiệu năng",
    "Giá",
    "Màn hình",
    "Độ bền",
  ],
};

// Define importance levels
const IMPORTANCE_LEVELS = [
  { label: "Quan trọng hơn một chút", value: 2 },
  { label: "Quan trọng hơn", value: 3 },
  { label: "Khá quan trọng hơn", value: 4 },
  { label: "Mạnh hơn hẳn", value: 5 },
  { label: "Rất mạnh", value: 7 },
  { label: "Cực kỳ quan trọng", value: 9 },
];

// Define common fractions
const COMMON_FRACTIONS = [
  { label: "3/2", value: "3/2" },
  { label: "5/2", value: "5/2" },
  { label: "7/2", value: "7/2" },
  { label: "9/5", value: "9/5" },
  { label: "11/5", value: "11/5" },
  { label: "27/10", value: "27/10" },
];

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

// Decorative background
const BackgroundDecoration = () => (
  <div className="absolute inset-0 overflow-hidden -z-10">
    {/* Top right decorative circle */}
    <div className="absolute top-0 right-0 -translate-y-1/2 rounded-full w-96 h-96 bg-gradient-to-br from-indigo-200 to-indigo-400 filter blur-3xl opacity-20 translate-x-1/3"></div>

    {/* Bottom left decorative blob */}
    <div className="absolute bottom-0 left-0 translate-y-1/2 rounded-full w-80 h-80 bg-gradient-to-tr from-blue-200 to-blue-400 filter blur-3xl opacity-20 -translate-x-1/3"></div>

    {/* Grid pattern background */}
    <div className="absolute inset-0 bg-grid-slate-100/[0.05] bg-[length:20px_20px]"></div>

    {/* Center decorative scale icon */}
    <div className="absolute top-1/2 left-[10%] transform -translate-y-1/2 text-indigo-100 opacity-10 hidden lg:block">
      <Scale className="w-40 h-40" />
    </div>

    <div className="absolute top-[30%] right-[10%] transform -translate-y-1/2 text-blue-100 opacity-10 hidden lg:block">
      <BarChart3 className="w-32 h-32" />
    </div>
  </div>
);

// Generate comparison pairs
function generateComparisonPairs(criteria: string[]): Comparison[] {
  const pairs: Comparison[] = [];

  for (let i = 0; i < criteria.length; i++) {
    for (let j = i + 1; j < criteria.length; j++) {
      pairs.push({
        row: criteria[i],
        column: criteria[j],
        value: 1,
        completed: false,
      });
    }
  }

  return pairs;
}

// Get color for criteria
function getCriteriaColor(criteriaName: string): string {
  const colorMap: Record<string, string> = {
    "Hiệu năng": "bg-blue-500",
    "Card đồ họa": "bg-indigo-500",
    "Giá": "bg-green-500",
    "Màn hình": "bg-purple-500",
    "Pin": "bg-amber-500",
    "Thiết kế": "bg-rose-500",
    "Độ bền": "bg-teal-500",
    "Tản nhiệt": "bg-orange-500",
    "Trọng lượng": "bg-cyan-500",
    Ram: "bg-violet-500",
    "Bàn phím": "bg-fuchsia-500",
  };

  return colorMap[criteriaName] || "bg-gray-500";
}

function CriteriaPairwiseComparison() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const [processingMessage, setProcessingMessage] =
    useState<string>("Đang khởi tạo...");
  const { usage } = state;
  const [criteria, setCriteria] = useState<string[]>([]);
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customValue, setCustomValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentChoice, setCurrentChoice] = useState<string | number | null>(
    null
  );
  const [selectionMade, setSelectionMade] = useState(false);
  const [selectedCriteria, setSelectedCriteria] = useState<string | null>(null);
  const [showImportanceSelection, setShowImportanceSelection] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValueIndex, setEditingValueIndex] = useState<number | null>(
    null
  );
  const [tempEditValue, setTempEditValue] = useState<string>("");

  // Thêm state theo dõi tiến trình
  const [processingState, setProcessingState] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [processingTimer, setProcessingTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [taskId, setTaskId] = useState<string | null>(null);

useEffect(() => {
  // Kiểm tra xem có đủ dữ liệu đầu vào hay không
  const requiredFields = ['usage', 'fromBudget', 'toBudget', 'fromScreenSize', 'toScreenSize', 'performance', 'design'];
  const missingFields = requiredFields.filter(field => state[field] === undefined || state[field] === null);
  
  if (missingFields.length > 0) {
    console.error("Thiếu thông tin cần thiết:", missingFields);
    navigate('/', { 
      state: { 
        error: "Thiếu thông tin cần thiết để tiến hành so sánh. Vui lòng thực hiện lại từ đầu." 
      }
    });
  }
}, [state, navigate]);
  

useEffect(() => {
  if (!taskId) return;
  
  console.log(`⏳ Bắt đầu polling với taskId: ${taskId}`);


  // Timer chính để polling API
  const pollingTimer = setInterval(async () => {
    try {
      console.log(`🔄 Đang kiểm tra trạng thái cho taskId: ${taskId}`);
      const statusResult = await apiService.checkProcessingStatus(taskId);
      console.log(`📊 Kết quả trạng thái:`, statusResult);
      
      // Cập nhật UI với thông tin từ API - không so sánh với giá trị mô phỏng nữa
      if (statusResult && typeof statusResult.progress === 'number') {
        setProcessingProgress(statusResult.progress);
        console.log(`⏱️ Tiến trình API: ${statusResult.progress}%`);
        
        if (statusResult.message) {
          setProcessingMessage(statusResult.message);
        } else {
          // Cập nhật thông báo theo tiến trình thực từ API
          if (statusResult.progress < 30) {
            setProcessingMessage("Đang phân tích dữ liệu so sánh...");
          } else if (statusResult.progress < 60) {
            setProcessingMessage("Đang tính toán độ nhất quán...");
          } else if (statusResult.progress < 85) {
            setProcessingMessage("Đang xếp hạng laptop phù hợp...");
          } else {
            setProcessingMessage("Đang hoàn thiện kết quả...");
          }
        }
      }
      
      // Xử lý các trạng thái
      if (statusResult && statusResult.status === "completed") {
        console.log("✅ Xử lý hoàn tất!");
        clearInterval(pollingTimer);
        
        // Set 100% khi hoàn thành
        setProcessingProgress(100);
        setProcessingMessage("Đã hoàn thành phân tích!");
        
        try {
          // Lấy kết quả từ API
          const finalResult = await apiService.getProcessingResult(taskId);
          console.log(`📋 Kết quả cuối cùng:`, finalResult);
          
          // Cập nhật UI và chuyển hướng
          setProcessingState("success");
          setResult(finalResult);
          
          setTimeout(() => {
            navigate("/recommendations", { state: { result: finalResult } });
          }, 1500);
          
        } catch (resultError) {
          console.error("❌ Lỗi khi lấy kết quả:", resultError);
          setProcessingState("error");
          setProcessingError("Không thể lấy kết quả xử lý. Vui lòng thử lại sau.");
        }
        
        setLoading(false);
        setIsSubmitting(false);
        
      } else if (statusResult && statusResult.status === "error") {
        // Xử lý lỗi
        clearInterval(pollingTimer);
        
        setProcessingState("error");
        setProcessingError(statusResult.message || "Có lỗi xảy ra trong quá trình xử lý");
        setLoading(false);
        setIsSubmitting(false);
      }
      
    } catch (error) {
      console.error("❌ Lỗi kiểm tra trạng thái:", error);
      clearInterval(pollingTimer);
      
      setProcessingState("error");
      setProcessingError("Không thể kết nối đến máy chủ để kiểm tra tiến độ");
      setLoading(false);
      setIsSubmitting(false);
    }
  }, 1000);
  
  // Lưu timer vào state để tham chiếu
  setProcessingTimer(pollingTimer);
  
  // Cleanup khi component unmount hoặc taskId thay đổi
  return () => {
    if (pollingTimer) clearInterval(pollingTimer);
  };
  
}, [taskId, navigate]);
  useEffect(() => {
    if (usage) {
      const usageCriteria =
        CRITERIA_BY_USAGE[usage as keyof typeof CRITERIA_BY_USAGE] ||
        CRITERIA_BY_USAGE.office;
      setCriteria(usageCriteria);
      setComparisons(generateComparisonPairs(usageCriteria));
    }
  }, [usage]);

  useEffect(() => {
    // Clean up timer when component unmounts
    return () => {
      if (processingTimer) {
        clearInterval(processingTimer);
      }
    };
  }, [processingTimer]);

  const currentComparison = comparisons[currentIndex] || null;

  // Function to get usage title for display
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

  const handleCriteriaSelection = (criteria: string) => {
    setSelectedCriteria(criteria);
    setShowImportanceSelection(true);
  };

  // Thêm hàm xử lý auto-fill data vào component CriteriaPairwiseComparison
const handleAutoFillTestData = () => {
  // Dữ liệu test từ file HTTP
  const testData = [
    { row: "Hiệu năng", column: "Giá", value: 3 },
    { row: "Hiệu năng", column: "Màn hình", value: "5/2" },
    { row: "Hiệu năng", column: "Pin", value: 2 },
    { row: "Hiệu năng", column: "Thiết kế", value: 4 },
    { row: "Hiệu năng", column: "Độ bền", value: "7/2" },
    { row: "Giá", column: "Màn hình", value: "3/2" },
    { row: "Giá", column: "Pin", value: "5/2" },
    { row: "Giá", column: "Thiết kế", value: 3 },
    { row: "Giá", column: "Độ bền", value: 3 },
    { row: "Màn hình", column: "Pin", value: "9/5" },
    { row: "Màn hình", column: "Thiết kế", value: "11/5" },
    { row: "Màn hình", column: "Độ bền", value: "5/2" },
    { row: "Pin", column: "Thiết kế", value: "27/10" },
    { row: "Pin", column: "Độ bền", value: 2 },
    { row: "Thiết kế", column: "Độ bền", value: "3/2" },
  ];

  // Cập nhật state comparisons với dữ liệu test
  const updatedComparisons = [...comparisons].map((comparison) => {
    // Tìm dữ liệu test tương ứng
    const testItem = testData.find(
      (item) =>
        (item.row === comparison.row && item.column === comparison.column) ||
        (item.row === comparison.column && item.column === comparison.row)
    );

    if (testItem) {
      // Nếu tìm được item tương ứng
      if (testItem.row === comparison.row && testItem.column === comparison.column) {
        // Nếu đúng thứ tự row/column
        return {
          ...comparison,
          value: testItem.value,
          completed: true,
          selectedCriteria: testItem.row, // Giả định tiêu chí đầu tiên quan trọng hơn
        };
      } else {
        // Nếu thứ tự row/column bị đảo ngược
        // Đảo ngược value
        const invertedValue = 
          typeof testItem.value === "string" && testItem.value.includes("/") 
            ? (() => {
                const [numerator, denominator] = testItem.value.split("/").map(Number);
                return `${denominator}/${numerator}`;
              })()
            : typeof testItem.value === "number"
            ? `1/${testItem.value}`
            : testItem.value;

        return {
          ...comparison,
          value: invertedValue,
          completed: true,
          selectedCriteria: testItem.row,
        };
      }
    }
    return comparison;
  });

  // Cập nhật state
  setComparisons(updatedComparisons);
  setError(null);
};

// Thêm hàm này dưới hàm handleAutoFillTestData
const handleInconsistentTestData = () => {
  // Dữ liệu test không nhất quán với các mâu thuẫn có chủ đích
  const inconsistentTestData = [
    { row: "Hiệu năng", column: "Giá", value: 5 },
    { row: "Giá", column: "Màn hình", value: 4 },
    { row: "Màn hình", column: "Hiệu năng", value: 3 },
    { row: "Hiệu năng", column: "Pin", value: 7 },
    { row: "Hiệu năng", column: "Thiết kế", value: 4 },
    { row: "Hiệu năng", column: "Độ bền", value: "7/2" },
    { row: "Giá", column: "Pin", value: "5/2" },
    { row: "Giá", column: "Thiết kế", value: 3 },
    { row: "Giá", column: "Độ bền", value: 10 },     // Thay đổi từ 6 thành 10
    { row: "Màn hình", column: "Pin", value: "9/5" },
    { row: "Màn hình", column: "Thiết kế", value: "11/5" },
    { row: "Màn hình", column: "Độ bền", value: "5/2" },
    { row: "Pin", column: "Thiết kế", value: "27/10" },
    { row: "Pin", column: "Độ bền", value: "3/2" },  // Thay đổi từ 2 thành "3/2"
    { row: "Thiết kế", column: "Độ bền", value: "3/2" }
  ];

  // Cập nhật state comparisons với dữ liệu không nhất quán
  const updatedComparisons = [...comparisons].map((comparison) => {
    // Tìm dữ liệu test tương ứng
    const testItem = inconsistentTestData.find(
      (item) =>
        (item.row === comparison.row && item.column === comparison.column) ||
        (item.row === comparison.column && item.column === comparison.row)
    );

    if (testItem) {
      // Nếu tìm được item tương ứng
      if (testItem.row === comparison.row && testItem.column === comparison.column) {
        // Nếu đúng thứ tự row/column
        return {
          ...comparison,
          value: testItem.value,
          completed: true,
          selectedCriteria: testItem.row,
        };
      } else {
        // Nếu thứ tự row/column bị đảo ngược
        // Đảo ngược value
        const invertedValue = 
          typeof testItem.value === "string" && testItem.value.includes("/") 
            ? (() => {
                const [numerator, denominator] = testItem.value.split("/").map(Number);
                return `${denominator}/${numerator}`;
              })()
            : typeof testItem.value === "number"
            ? `1/${testItem.value}`
            : testItem.value;

        return {
          ...comparison,
          value: invertedValue,
          completed: true,
          selectedCriteria: testItem.row,
        };
      }
    }
    return comparison;
  });

  // Cập nhật state
  setComparisons(updatedComparisons);
  setError(null);
  
  // Thông báo cho người dùng
  toast({
    title: "Dữ liệu không nhất quán đã được áp dụng",
    description: "Các đánh giá này cố ý tạo ra sự mâu thuẫn để kiểm tra CR > 0.1",
    variant: "warning",
    duration: 3000
  });
};

  const handleSelectImportanceLevel = (value: string | number) => {
    if (!currentComparison || !selectedCriteria) return;

    setCurrentChoice(value);
    setSelectionMade(true);

    setTimeout(() => {
      const updatedComparisons = [...comparisons];
      updatedComparisons[currentIndex] = {
        ...currentComparison,
        value,
        completed: true,
        selectedCriteria,
      };

      setComparisons(updatedComparisons);
      setSelectionMade(false);

      if (editingIndex !== null) {
        // Nếu đang trong chế độ chỉnh sửa, không tự động next
        return;
      }

      if (currentIndex < comparisons.length - 1) {
        setTimeout(() => {
          setCurrentIndex(currentIndex + 1);
          setCustomValue("");
          setCurrentChoice(null);
          setSelectedCriteria(null);
          setShowImportanceSelection(false);
        }, 300);
      } else {
        setSelectedCriteria(null);
        setShowImportanceSelection(false);
      }
    }, 500);
  };

  const handleCustomValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomValue(e.target.value);
  };

  const handleApplyCustomValue = () => {
    if (!customValue.trim()) {
      setError("Vui lòng nhập giá trị");
      return;
    }

    const fractionRegex = /^(\d+)\/(\d+)$/;
    const numberRegex = /^\d+(\.\d+)?$/;
    let validValue: string | number = customValue.trim();

    if (customValue.match(fractionRegex)) {
      const [numerator, denominator] = customValue.split("/").map(Number);
      if (denominator === 0) {
        setError("Mẫu số không được bằng 0");
        return;
      }
      const value = numerator / denominator;
      if (value <= 1) {
        setError("Giá trị so sánh phải lớn hơn 1");
        return;
      }
    } else if (customValue.match(numberRegex)) {
      const value = parseFloat(customValue);
      if (value <= 1) {
        setError("Giá trị so sánh phải lớn hơn 1");
        return;
      }
      validValue = value;
    } else {
      setError("Vui lòng nhập số hoặc phân số hợp lệ (ví dụ: 3 hoặc 5/2)");
      return;
    }

    handleSelectImportanceLevel(validValue);
    setError(null);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCustomValue("");
      setError(null);
      setCurrentChoice(null);
      setSelectedCriteria(null);
      setShowImportanceSelection(false);
    }
  };

  const handleNext = () => {
    if (editingIndex !== null) {
      setEditingIndex(null);
      setShowImportanceSelection(false);
      setSelectedCriteria(null);
      return;
    }

    // Logic cũ cho Next
    if (
      currentIndex < comparisons.length - 1 &&
      comparisons[currentIndex].completed
    ) {
      setCurrentIndex(currentIndex + 1);
      setCustomValue("");
      setError(null);
      setCurrentChoice(null);
      setSelectedCriteria(null);
      setShowImportanceSelection(false);
    } else if (!comparisons[currentIndex].completed) {
      setError(
        "Vui lòng chọn mức độ quan trọng trước khi chuyển sang so sánh tiếp theo"
      );
    }
  };

  const handleSubmit = async () => {
    const incompleteComparisons = comparisons.filter((c) => !c.completed);
    if (incompleteComparisons.length > 0) {
      setError(
        `Còn ${incompleteComparisons.length} cặp so sánh chưa hoàn thành`
      );
      return;
    }
  
    setIsSubmitting(true);
    setLoading(true);
    setError(null);
    setProcessingState('processing');
    setProcessingProgress(0);
  
    try {
      // Lấy các giá trị đã chuyển đổi trực tiếp từ state
      // KHÔNG cần chuyển đổi lại từ 'budget' và 'screenSize'
      const { fromBudget, toBudget, fromScreenSize, toScreenSize, usage, performance, design } = state;
  
      // Chuẩn bị comparisons theo định dạng API
      const apiComparisons = comparisons.map(
        ({ row, column, value, selectedCriteria }) => {
          // Xử lý value dựa trên loại dữ liệu và cách chọn
          let formattedValue: string | number = value;
          
          // Trường hợp 1: value là phân số dạng string (ví dụ: "3/2")
          if (typeof value === 'string' && value.includes('/')) {
            const [numerator, denominator] = value.split('/').map(Number);
            
            if (selectedCriteria === column) {
              // Đảo ngược phân số: "3/2" -> "2/3"
              formattedValue = `${denominator}/${numerator}`;
            } else {
              // Giữ nguyên giá trị
              formattedValue = value;
            }
          }
          // Trường hợp 2: value là số dạng string hoặc number
          else {
            const numValue = Number(value);
            
            if (selectedCriteria === column) {
              // Đảo ngược: 3 -> "1/3"
              if (numValue === 1) {
                formattedValue = "1";
              } else {
                formattedValue = `1/${numValue}`;
              }
            } else {
              // Giữ nguyên dạng string
              formattedValue = value.toString();
            }
          }
          
          // Trả về object với value đã được xử lý đúng định dạng
          return {
            row,
            column,
            value: formattedValue
          };
        }
      );
  
// Đảm bảo kiểu dữ liệu gửi đi khớp với API
const dataToSend: ComparisonRequest = {
  usage,
  fromBudget: Number(fromBudget),
  toBudget: Number(toBudget),
  performance,
  design,
  fromScreenSize: Number(fromScreenSize),
  toScreenSize: Number(toScreenSize),
  comparisons: apiComparisons
};

const response = await apiService.processComparisons(dataToSend);
  
      // Lưu taskId để polling
      setTaskId(response.taskId);
    } catch (error) {
      console.error("Error submitting comparisons:", error);
      setError("Có lỗi xảy ra khi gửi dữ liệu. Vui lòng thử lại.");
      setLoading(false);
      setIsSubmitting(false);
      setProcessingState('error');
      setProcessingError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    }
  };
  
  // Hàm dọn dẹp khi component unmount
  useEffect(() => {
    return () => {
      if (processingTimer) {
        clearInterval(processingTimer);
      }
    };
  }, [processingTimer]);

  const getComparisonDisplayValue = (comparison: Comparison) => {
    // Nếu là phân số string
    if (
      typeof comparison.value === "string" &&
      comparison.value.includes("/")
    ) {
      return comparison.value;
    }
    // Nếu là số
    if (typeof comparison.value === "number") {
      // Nếu là số nguyên
      if (Number.isInteger(comparison.value)) {
        return comparison.value.toString();
      }
      // Số thập phân
      return comparison.value.toFixed(2);
    }
    return comparison.value.toString();
  };

  const handleStartDirectEdit = (
    index: number,
    currentValue: string | number
  ) => {
    setEditingValueIndex(index);
    setTempEditValue(currentValue.toString());
  };

  const handleSaveDirectEdit = (index: number) => {
    // Validate giá trị
    const fractionRegex = /^(\d+)\/(\d+)$/;
    const numberRegex = /^\d+(\.\d+)?$/;
    let validValue: string | number = tempEditValue.trim();
    let isValid = false;

    if (tempEditValue.match(fractionRegex)) {
      const [numerator, denominator] = tempEditValue.split("/").map(Number);
      if (denominator !== 0 && numerator / denominator > 1) {
        isValid = true;
      }
    } else if (tempEditValue.match(numberRegex)) {
      const value = parseFloat(tempEditValue);
      if (value > 1) {
        validValue = value;
        isValid = true;
      }
    }

    if (isValid) {
      const updatedComparisons = [...comparisons];
      updatedComparisons[index] = {
        ...updatedComparisons[index],
        value: validValue,
      };
      setComparisons(updatedComparisons);
      setEditingValueIndex(null);
    } else {
      alert("Vui lòng nhập giá trị hợp lệ lớn hơn 1 (ví dụ: 3 hoặc 5/2)");
    }
  };

  const handleCancelDirectEdit = () => {
    setEditingValueIndex(null);
  };

  // Công thức đúng - tính % đã hoàn thành
  const completedPercentage = comparisons.length
    ? Math.round(
        (comparisons.filter((c) => c.completed).length / comparisons.length) *
          100
      )
    : 0;

  const isFormValid =
    comparisons.every((c) => c.completed) && !loading && !isSubmitting;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative min-h-screen px-4 py-8 overflow-hidden bg-gradient-to-b from-slate-50 to-white"
    >
      <BackgroundDecoration />

      <div className="relative z-10 max-w-3xl mx-auto">
        <motion.div variants={itemVariants} className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-800">
            Bước 3: So sánh tiêu chí
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
            <div className="w-16 h-1 bg-indigo-500 rounded-full"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-indigo-500"></div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-700">
              Tiến độ: {currentIndex + 1}/{comparisons.length}
            </span>
            <span className="font-semibold text-indigo-600">
              {completedPercentage}% hoàn thành
            </span>
          </div>
          <div className="w-full h-3 overflow-hidden bg-gray-200 rounded-full">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
              initial={{ width: "0%" }}
              animate={{ width: `${completedPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>

        {completedPercentage > 0 && !result && (
          <motion.div
            variants={itemVariants}
            className="flex justify-center mb-6"
          >
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 bg-white shadow-md hover:bg-gray-50"
                >
                  <Eye size={16} />
                  Xem danh sách so sánh (
                  {Math.round(
                    (comparisons.filter((c) => c.completed).length /
                      comparisons.length) *
                      100
                  )}
                  %)
                </Button>
              </DialogTrigger>

              {/* Điều chỉnh style và kích thước dialog */}
              <DialogContent className="max-w-7xl w-[95vw] max-h-[85vh] overflow-y-auto bg-white/95 backdrop-blur-lg border-indigo-100">
                <DialogHeader className="mb-2">
                  <DialogTitle className="text-2xl font-bold text-center text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">
                    Danh sách so sánh
                  </DialogTitle>
                  <p className="mt-2 text-center text-gray-600">
                    Bạn có thể sửa giá trị đã đánh giá bằng cách nhấn vào giá
                    trị đó
                  </p>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-4 px-4 py-4">
                  {comparisons.map((comp, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-lg p-4 ${
                        comp.completed
                          ? "bg-white shadow-sm hover:bg-gray-50"
                          : "bg-gray-50 opacity-60"
                      } transition-colors`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-500">
                          So sánh {idx + 1}
                        </span>
                        {comp.completed ? (
                          <Badge
                            variant="outline"
                            className="text-green-700 border-green-200 bg-green-50"
                          >
                            Đã đánh giá
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 border-amber-200"
                          >
                            Chưa đánh giá
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                        <div className="flex flex-wrap items-center min-w-0 gap-2">
                          {comp.completed ? (
                            <>
                              <Badge
                                className={`px-3 py-1.5 text-sm font-bold text-white ${getCriteriaColor(
                                  comp.selectedCriteria || ""
                                )} mr-1 truncate max-w-[120px]`}
                              >
                                {comp.selectedCriteria}
                              </Badge>
                              <ArrowRight className="w-4 h-4 mx-1" />
                              <Badge
                                className={`px-3 py-1.5 text-sm font-bold text-white ${getCriteriaColor(
                                  comp.selectedCriteria === comp.row
                                    ? comp.column
                                    : comp.row
                                )} opacity-80 truncate max-w-[120px]`}
                              >
                                {comp.selectedCriteria === comp.row
                                  ? comp.column
                                  : comp.row}
                              </Badge>
                            </>
                          ) : (
                            <>
                              <Badge
                                className={`px-3 py-1.5 text-sm font-bold text-white ${getCriteriaColor(
                                  comp.row
                                )} mr-1 truncate max-w-[120px]`}
                              >
                                {comp.row}
                              </Badge>
                              <ArrowRight className="w-4 h-4 mx-1" />
                              <Badge
                                className={`px-3 py-1.5 text-sm font-bold text-white ${getCriteriaColor(
                                  comp.column
                                )} opacity-80 truncate max-w-[120px]`}
                              >
                                {comp.column}
                              </Badge>
                            </>
                          )}
                        </div>

                        {comp.completed ? (
                          <div className="flex items-center gap-2 ml-auto">
                            {editingValueIndex === idx ? (
                              <>
                                <Input
                                  value={tempEditValue}
                                  onChange={(e) =>
                                    setTempEditValue(e.target.value)
                                  }
                                  className="w-20 text-sm font-medium h-9"
                                  autoFocus
                                />
                                <div className="flex items-center">
                                  <Button
                                    onClick={() => handleSaveDirectEdit(idx)}
                                    variant="ghost"
                                    size="sm"
                                    className="w-8 h-8 p-0"
                                  >
                                    <Save className="w-4 h-4 text-green-600" />
                                    <span className="sr-only">Lưu</span>
                                  </Button>
                                  <Button
                                    onClick={handleCancelDirectEdit}
                                    variant="ghost"
                                    size="sm"
                                    className="w-8 h-8 p-0"
                                  >
                                    <XCircle className="w-4 h-4 text-red-600" />
                                    <span className="sr-only">Hủy</span>
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() =>
                                    handleStartDirectEdit(idx, comp.value)
                                  }
                                  className="text-sm font-medium hover:text-indigo-600 hover:underline min-w-[36px] text-right"
                                >
                                  {getComparisonDisplayValue(comp)}{" "}
                                  {typeof comp.value === "number" &&
                                    comp.value > 1 &&
                                    "lần"}
                                </button>
                                <Button
                                  onClick={() =>
                                    handleStartDirectEdit(idx, comp.value)
                                  }
                                  variant="ghost"
                                  size="sm"
                                  className="w-8 h-8 p-0"
                                >
                                  <Edit className="w-4 h-4" />
                                  <span className="sr-only">Sửa</span>
                                </Button>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="ml-auto text-sm text-gray-400">—</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
        )}

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

        {currentComparison && !result && (
          <motion.div
            variants={itemVariants}
            key={`comparison-${currentIndex}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="mb-6 overflow-hidden border-none shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-gray-100">
                <CardTitle className="text-center text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">
                  So sánh cặp tiêu chí {currentIndex + 1}/{comparisons.length}
                </CardTitle>
                <CardDescription className="text-center text-gray-600">
                  {!showImportanceSelection
                    ? "Chọn tiêu chí nào quan trọng hơn"
                    : `Đánh giá mức độ quan trọng của ${selectedCriteria}`}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6">
                {!showImportanceSelection ? (
                  // Bước 1: Chọn tiêu chí nào quan trọng hơn
                  <div>
                    <div className="flex items-center justify-center gap-10 mb-8">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          onClick={() =>
                            handleCriteriaSelection(currentComparison.row)
                          }
                          className={`px-6 py-8 h-auto flex flex-col gap-3 ${
                            selectedCriteria === currentComparison.row
                              ? "ring-4 ring-indigo-300"
                              : ""
                          }`}
                          variant="outline"
                        >
                          <Badge
                            className={`px-4 py-2 text-base font-bold text-white ${getCriteriaColor(
                              currentComparison.row
                            )} shadow-md`}
                          >
                            {currentComparison.row}
                          </Badge>
                          <span className="text-sm font-medium">
                            Quan trọng hơn
                          </span>
                        </Button>
                      </motion.div>

                      <div className="flex flex-col items-center">
                        <div className="p-2 mb-2 bg-gray-200 rounded-full">
                          <Scale className="w-6 h-6 text-gray-500" />
                        </div>
                        <div className="text-lg font-semibold text-gray-600">
                          hoặc
                        </div>
                      </div>

                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          onClick={() =>
                            handleCriteriaSelection(currentComparison.column)
                          }
                          className={`px-6 py-8 h-auto flex flex-col gap-3 ${
                            selectedCriteria === currentComparison.column
                              ? "ring-4 ring-indigo-300"
                              : ""
                          }`}
                          variant="outline"
                        >
                          <Badge
                            className={`px-4 py-2 text-base font-bold text-white ${getCriteriaColor(
                              currentComparison.column
                            )} shadow-md`}
                          >
                            {currentComparison.column}
                          </Badge>
                          <span className="text-sm font-medium">
                            Quan trọng hơn
                          </span>
                        </Button>
                      </motion.div>
                    </div>

                    <p className="italic text-center text-gray-600">
                      Chọn một trong hai tiêu chí bạn cho là quan trọng hơn
                    </p>
                  </div>
                ) : (
                  // Bước 2: Chọn mức độ quan trọng
                  <div>
                    <div className="flex items-center justify-center gap-8 mb-10">
                      <motion.div className="relative">
                        <Badge
                          className={`px-5 py-3 text-base font-bold text-white ${getCriteriaColor(
                            selectedCriteria || ""
                          )} shadow-lg`}
                        >
                          {selectedCriteria}
                        </Badge>
                        {selectionMade && currentChoice && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute -top-2 -right-2 bg-green-500 rounded-full p-0.5"
                          >
                            <CheckCircle className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </motion.div>

                      <div className="flex flex-col items-center">
                        <div className="text-lg font-semibold text-gray-800">
                          quan trọng hơn
                        </div>
                      </div>

                      <motion.div>
                        <Badge
                          className={`px-5 py-3 text-base font-bold text-white ${getCriteriaColor(
                            selectedCriteria === currentComparison.row
                              ? currentComparison.column
                              : currentComparison.row
                          )} shadow-lg opacity-70`}
                        >
                          {selectedCriteria === currentComparison.row
                            ? currentComparison.column
                            : currentComparison.row}
                        </Badge>
                      </motion.div>
                    </div>

                    <p className="mb-8 text-lg text-center text-gray-800">
                      <span className="font-bold text-indigo-700">
                        {selectedCriteria}
                      </span>
                      {" quan trọng hơn "}
                      <span className="font-medium text-gray-600">
                        {selectedCriteria === currentComparison.row
                          ? currentComparison.column
                          : currentComparison.row}
                      </span>
                      {" bao nhiêu lần?"}
                    </p>

                    <div className="mb-8">
                      <h4 className="mb-3 text-sm font-medium text-center text-gray-500">
                        Các phân số thông dụng:
                      </h4>
                      <div className="flex flex-wrap justify-center gap-3">
                        {COMMON_FRACTIONS.map((fraction) => (
                          <motion.div
                            key={fraction.value}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              variant={
                                currentChoice === fraction.value
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() =>
                                handleSelectImportanceLevel(fraction.value)
                              }
                              className={`text-base h-10 ${
                                currentChoice === fraction.value
                                  ? "bg-indigo-600 hover:bg-indigo-700"
                                  : ""
                              }`}
                            >
                              {fraction.label}
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-8">
                      <h4 className="mb-3 text-sm font-medium text-center text-gray-500">
                        Chọn mức độ quan trọng:
                      </h4>
                      <div className="flex flex-wrap justify-center gap-3">
                        {IMPORTANCE_LEVELS.map((level) => (
                          <motion.div
                            key={level.value}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              onClick={() =>
                                handleSelectImportanceLevel(level.value)
                              }
                              className={`text-base ${
                                currentChoice === level.value
                                  ? "bg-indigo-600 hover:bg-indigo-700"
                                  : ""
                              }`}
                              variant={
                                currentChoice === level.value
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {level.value}
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8">
                      <h4 className="mb-3 text-sm font-medium text-center text-gray-500">
                        Hoặc nhập giá trị tùy chỉnh:
                      </h4>
                      <div className="flex justify-center gap-3">
                        <Input
                          value={customValue}
                          onChange={handleCustomValueChange}
                          placeholder="Nhập giá trị tùy chỉnh"
                          className="max-w-xs bg-white"
                        />
                        <Button
                          onClick={handleApplyCustomValue}
                          variant="outline"
                          className="bg-white hover:bg-gray-50"
                        >
                          Áp dụng
                        </Button>
                      </div>
                      <p className="mt-2 text-sm text-center text-gray-500">
                        Có thể nhập số hoặc phân số lớn hơn 1 (ví dụ: 3, 5/2)
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex justify-between py-4 border-t border-gray-100">
                <Button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  variant="outline"
                  className="gap-2 bg-white hover:bg-gray-50"
                >
                  <ChevronLeft size={16} />
                  Trước
                </Button>

                <div className="py-2">
                  <div className="flex space-x-1">
                    {Array.from({
                      length: Math.min(5, comparisons.length),
                    }).map((_, idx) => {
                      const actualIdx = currentIndex - 2 + idx;
                      if (actualIdx < 0 || actualIdx >= comparisons.length)
                        return (
                          <span
                            key={idx}
                            className="w-2 h-2 bg-transparent rounded-full"
                          ></span>
                        );

                      return (
                        <span
                          key={idx}
                          className={`w-2 h-2 rounded-full ${
                            actualIdx === currentIndex
                              ? "bg-indigo-600"
                              : comparisons[actualIdx]?.completed
                              ? "bg-indigo-300"
                              : "bg-gray-300"
                          }`}
                        ></span>
                      );
                    })}
                  </div>
                </div>

                {!showImportanceSelection ? (
                  <Button
                    disabled={!selectedCriteria}
                    onClick={() => setShowImportanceSelection(true)}
                    className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  >
                    Tiếp tục
                    <ChevronRight size={16} />
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={
                      currentIndex === comparisons.length - 1 ||
                      !comparisons[currentIndex].completed
                    }
                    className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  >
                    Tiếp
                    <ChevronRight size={16} />
                  </Button>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        )}

{!result && (
  <motion.div
    variants={itemVariants}
    className="flex flex-col items-center justify-between gap-4 mt-8 md:flex-row"
  >
    <Button
      onClick={() => navigate("/criteria")}
      variant="outline"
      className="gap-2 pl-3 bg-white hover:bg-gray-50"
    >
      <ArrowLeft size={16} />
      Quay lại các tiêu chí
    </Button>

    {/* Thêm button test data */}
    <Button
      onClick={handleAutoFillTestData}
      className="gap-2 bg-amber-500 hover:bg-amber-600"
    >
      <Eye className="w-4 h-4" />
      Tự động điền dữ liệu test
    </Button>

    {/* Thêm button dữ liệu không nhất quán */}
    <Button
      onClick={handleInconsistentTestData}
      className="gap-2 bg-red-500 hover:bg-red-600"
    >
      <Eye className="w-4 h-4" />
      Tự động điền dữ liệu không nhất quán
    </Button>

    <Button
      onClick={handleSubmit}
      className={`gap-2 ${
        isFormValid
          ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          : "bg-gray-300 cursor-not-allowed"
      }`}
      disabled={
        loading || isSubmitting || comparisons.some((c) => !c.completed)
      }
      size="lg"
    >
      {isSubmitting ? (
        <>
          <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
          Đang phân tích...
        </>
      ) : (
        "Hoàn thành so sánh"
      )}
    </Button>
  </motion.div>
)}

        {processingState !== "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="mb-6"
          >
            <Card className="mb-6 overflow-hidden border-none shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-gray-100">
                <CardTitle className="text-center text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">
                  So sánh cặp tiêu chí {currentIndex + 1}/{comparisons.length}
                </CardTitle>
                <CardDescription className="text-center text-gray-600">
                  {!showImportanceSelection
                    ? "Chọn tiêu chí nào quan trọng hơn"
                    : `Đánh giá mức độ quan trọng của ${selectedCriteria}`}
                </CardDescription>

                {/* Thêm dòng này để hiển thị criteria */}
                {criteria.length > 0 && (
                  <div className="hidden">Tiêu chí: {criteria.join(", ")}</div>
                )}
              </CardHeader>

              <CardContent className="pt-6">
                {processingState === "processing" && (
                  <div className="flex flex-col items-center">
                    <div className="w-full mb-6">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-500">
                          {processingMessage}
                        </span>
                        <span className="text-sm font-medium text-indigo-600">
                          {Math.round(processingProgress)}%
                        </span>
                      </div>
                      <div className="w-full h-4 overflow-hidden bg-gray-100 rounded-full">
                        <motion.div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                          initial={{ width: "0%" }}
                          animate={{ width: `${processingProgress}%` }}
                          transition={{ ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    <div className="grid w-full grid-cols-1 gap-6 mb-6 md:grid-cols-3">
                      <div className="flex items-center gap-3 p-4 rounded-lg shadow-sm bg-indigo-50">
                        <div className="p-2 bg-indigo-100 rounded-full">
                          <Calculator className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-grow">
                          <h4 className="text-sm font-medium text-indigo-800">
                            Phân tích dữ liệu
                          </h4>
                          <div className="h-1 bg-gray-200 rounded-full mt-1.5">
                            <motion.div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{
                                width: processingProgress < 33 ? `${(processingProgress * 3)}%` : '100%'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                                            
                      <div className="flex items-center gap-3 p-4 rounded-lg shadow-sm bg-violet-50">
                        <div className="p-2 rounded-full bg-violet-100">
                          <Scale className="w-5 h-5 text-violet-600" />
                        </div>
                        <div className="flex-grow">
                          <h4 className="text-sm font-medium text-violet-800">
                            Tính độ nhất quán
                          </h4>
                          <div className="h-1 bg-gray-200 rounded-full mt-1.5">
                            <motion.div
                              className="h-full rounded-full bg-violet-500"
                              style={{
                                width: processingProgress < 33 ? '0%' : 
                                      processingProgress < 66 ? `${(processingProgress - 33) * 3}%` : 
                                      '100%'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                                            
                      <div className="flex items-center gap-3 p-4 rounded-lg shadow-sm bg-purple-50">
                        <div className="p-2 bg-purple-100 rounded-full">
                          <Loader2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-grow">
                          <h4 className="text-sm font-medium text-purple-800">
                            Tìm laptop phù hợp
                          </h4>
                          <div className="h-1 bg-gray-200 rounded-full mt-1.5">
                            <motion.div
                              className="h-full bg-purple-500 rounded-full"
                              style={{
                                width: processingProgress < 66 ? '0%' : `${(processingProgress - 66) * 3}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "linear",
                      }}
                      className="p-3 mb-6 text-indigo-500 bg-indigo-100 rounded-full"
                    >
                      <Clock className="w-10 h-10" />
                    </motion.div>

                    <p className="max-w-lg mx-auto text-center text-gray-600">
                      Hệ thống đang tính toán độ phù hợp của các laptop dựa trên
                      sở thích của bạn.
                      <br />
                      Quá trình này sẽ hoàn thành trong giây lát...
                    </p>
                  </div>
                )}

                {processingState === "success" && (
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 10,
                      }}
                      className="p-4 mb-6 bg-green-100 rounded-full"
                    >
                      <CheckCircle className="w-12 h-12 text-green-500" />
                    </motion.div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-800">
                      Phân tích hoàn tất!
                    </h3>
                    <p className="mb-6 text-center text-gray-600">
                      Đã tìm được các laptop phù hợp dựa trên sở thích của bạn.
                      <br />
                      Đang chuyển hướng đến trang gợi ý...
                    </p>

                    <div className="flex items-center justify-center w-full gap-2 text-sm text-indigo-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang chuyển hướng...</span>
                    </div>
                  </div>
                )}

                {processingState === "error" && (
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 10,
                      }}
                      className="p-4 mb-6 bg-red-100 rounded-full"
                    >
                      <XCircle className="w-12 h-12 text-red-500" />
                    </motion.div>
                    <h3 className="mb-2 text-xl font-semibold text-red-600">
                      Có lỗi xảy ra!
                    </h3>
                    <p className="mb-6 text-center text-gray-700">
                      {processingError ||
                        "Không thể hoàn tất phân tích. Vui lòng thử lại."}
                    </p>
                    <Alert variant="destructive" className="mb-6">
                      <AlertDescription>
                        {processingError?.includes("mâu thuẫn")
                          ? "Hệ thống phát hiện các đánh giá có sự mâu thuẫn với nhau. Ví dụ: Nếu A quan trọng hơn B, và B quan trọng hơn C, thì A phải quan trọng hơn C. Hãy xem lại các so sánh để đảm bảo tính logic."
                          : "Đã xảy ra lỗi khi xử lý dữ liệu. Vui lòng thử lại sau."}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex justify-center py-6 border-t border-gray-100">
                {processingState === "processing" ? (
                  <p className="text-sm italic text-gray-500">
                    Đang xử lý, vui lòng đợi...
                  </p>
                ) : processingState === "success" ? (
                  <Button
                    onClick={() => navigate("/recommendations")}
                    className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    <CheckCircle size={18} />
                    Đi đến trang gợi ý laptop
                  </Button>
                ) : (
                  <div className="flex gap-4">
                    <Button
                      onClick={() => navigate("/")}
                      variant="outline"
                      className="gap-2"
                    >
                      <ArrowLeft size={16} />
                      Quay lại trang chủ
                    </Button>
                    <Button
                      onClick={() => {
                        setProcessingState("idle");
                        setProcessingProgress(0);
                        setProcessingError(null);
                      }}
                      className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Scale size={16} />
                      Thử so sánh lại
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default CriteriaPairwiseComparison;
