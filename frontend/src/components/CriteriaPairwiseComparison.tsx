import React, { useState, useEffect, useRef } from "react"; // Add useRef import
import { useNavigate, useSearchParams } from "react-router-dom";
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
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import apiService from "@/services/api";
import { ProcessComparisonsRequest, ProcessComparisonsResponse } from "@/types";
import Cookies from "js-cookie";

// Define criteria based on usage
const CRITERIA_BY_USAGE = {
  office: ["Hiệu năng", "Giá", "Màn hình", "Pin", "Thiết kế", "Độ bền"],
  gaming: [
    "Hiệu năng",
    "Card đồ họa",
    "Màn hình",
    "Tản nhiệt",
    "Giá",
    "Độ bền",
  ],
  mobility: ["Pin", "Trọng lượng", "Hiệu năng", "Giá", "Màn hình", "Độ bền"],
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

// Define the comparison interface
interface Comparison {
  row: string;
  column: string;
  value: number | string;
  completed?: boolean;
  selectedCriteria?: string;
}

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
    Giá: "bg-green-500",
    "Màn hình": "bg-purple-500",
    Pin: "bg-amber-500",
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const processingMessage = "Đang khởi tạo...";

  // Extract parameters from URL instead of location state
  const urlParams = {
    usage: searchParams.get("usage") || "",
    fromBudget: searchParams.get("fromBudget") || "",
    toBudget: searchParams.get("toBudget") || "",
    performance: searchParams.get("performance") || "",
    design: searchParams.get("design") || "",
    fromScreenSize: searchParams.get("fromScreenSize") || "",
    toScreenSize: searchParams.get("toScreenSize") || ""
  };

  // Get custom criteria from URL if available
  const criteriaParam = searchParams.get("criteria");
  const criteriaLabels = criteriaParam ? criteriaParam.split(",") : [];

  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customValue, setCustomValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentChoice, setCurrentChoice] = useState<string | number | null>(
    null
  );
  const [selectedCriteria, setSelectedCriteria] = useState<string | null>(null);
  const [showImportanceSelection, setShowImportanceSelection] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValueIndex, setEditingValueIndex] = useState<number | null>(
    null
  );
  const [tempEditValue, setTempEditValue] = useState<string>("");

  // State for direct API approach
  const [processingState, setProcessingState] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // State for review dialog
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  const firstRenderRef = useRef(true);
  const hasInitializedCriteria = useRef(false); // Ref to track if criteria has been initialized

  useEffect(() => {
    // Only run validation on the first render
    if (!firstRenderRef.current) return;
    
    // Validate required URL parameters, but only for essential ones
    if (!searchParams.get("usage")) {
      console.error("Thiếu thông tin cần thiết: usage");
      navigate("/", {
        state: {
          error: "Thiếu thông tin cần thiết để tiến hành so sánh. Vui lòng thực hiện lại từ đầu.",
        },
      });
      return;
    }

    // Mark the first render as complete
    firstRenderRef.current = false;
  }, [searchParams, navigate]);

  useEffect(() => {
    // Only run once on component mount
    if (hasInitializedCriteria.current) return;
    
    // Thay vì gán vào state, tạo biến local và sử dụng trực tiếp
    let criteriaToUse: string[];
    
    if (criteriaLabels && criteriaLabels.length >= 2) {
      // Use custom criteria from URL parameters
      criteriaToUse = criteriaLabels;
    } else {
      // Fallback to predefined criteria by usage
      criteriaToUse = CRITERIA_BY_USAGE[urlParams.usage as keyof typeof CRITERIA_BY_USAGE] || 
                      CRITERIA_BY_USAGE.office;
    }
    
    // Khởi tạo comparisons trực tiếp từ criteriaToUse
    setComparisons(generateComparisonPairs(criteriaToUse));

    // Mark as initialized so it won't run again
    hasInitializedCriteria.current = true;
  }, []);  // Empty dependency array - will only run once on mount

  const currentComparison = comparisons[currentIndex] || null;

  // Function to get usage title for display
  const getUsageTitle = () => {
    switch (urlParams.usage) {
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

  // Test data functions
  const handleAutoFillTestData = () => {
    // Test data from complete-full.http
    const testData = [
      { row: "Hiệu năng", column: "Giá", value: 3, selectedCriteria: "Hiệu năng" },
      { row: "Hiệu năng", column: "Màn hình", value: "5/2", selectedCriteria: "Hiệu năng" },
      { row: "Hiệu năng", column: "Pin", value: 2, selectedCriteria: "Hiệu năng" },
      { row: "Hiệu năng", column: "Thiết kế", value: 4, selectedCriteria: "Hiệu năng" },
      { row: "Hiệu năng", column: "Độ bền", value: "7/2", selectedCriteria: "Hiệu năng" },
      { row: "Giá", column: "Màn hình", value: "3/2", selectedCriteria: "Giá" },
      { row: "Giá", column: "Pin", value: "5/2", selectedCriteria: "Giá" },
      { row: "Giá", column: "Thiết kế", value: 3, selectedCriteria: "Giá" },
      { row: "Giá", column: "Độ bền", value: 3, selectedCriteria: "Giá" },
      { row: "Màn hình", column: "Pin", value: "9/5", selectedCriteria: "Màn hình" },
      { row: "Màn hình", column: "Thiết kế", value: "11/5", selectedCriteria: "Màn hình" },
      { row: "Màn hình", column: "Độ bền", value: "5/2", selectedCriteria: "Màn hình" },
      { row: "Pin", column: "Thiết kế", value: "27/10", selectedCriteria: "Pin" },
      { row: "Pin", column: "Độ bền", value: 2, selectedCriteria: "Pin" },
      { row: "Thiết kế", column: "Độ bền", value: "3/2", selectedCriteria: "Thiết kế" },
    ];

    // Create a mapping to find all test data applicable to each comparison
    const updatedComparisons = comparisons.map((comparison) => {
      // Try to find a direct match
      const directMatch = testData.find(
        test => test.row === comparison.row && test.column === comparison.column
      );
      
      if (directMatch) {
        return {
          ...comparison,
          value: directMatch.value,
          completed: true,
          selectedCriteria: directMatch.selectedCriteria
        };
      }

      // Try to find a reverse match and invert the value
      const reverseMatch = testData.find(
        test => test.row === comparison.column && test.column === comparison.row
      );

      if (reverseMatch) {
        // Invert the value
        let invertedValue;
        if (typeof reverseMatch.value === "string" && reverseMatch.value.includes("/")) {
          const [numerator, denominator] = reverseMatch.value.split("/").map(Number);
          invertedValue = `${denominator}/${numerator}`;
        } else if (typeof reverseMatch.value === "number") {
          invertedValue = `1/${reverseMatch.value}`;
        } else {
          invertedValue = 1; // Default fallback
        }

        return {
          ...comparison,
          value: invertedValue,
          completed: true,
          selectedCriteria: comparison.row // When inverted, the selectedCriteria changes
        };
      }

      // If no match found, keep the original comparison
      return comparison;
    });

    setComparisons(updatedComparisons);
    setError(null);
    
    toast({
      title: "Dữ liệu mẫu đã được áp dụng",
      description: "Tất cả các đánh giá đã được hoàn thành tự động",
      variant: "default",
    });
  };

  const handleInconsistentTestData = () => {
    // Inconsistent test data from inconsistent-matrices.http
    const inconsistentTestData = [
      { row: "Hiệu năng", column: "Giá", value: 7, selectedCriteria: "Hiệu năng" },
      { row: "Hiệu năng", column: "Màn hình", value: "1/5", selectedCriteria: "Màn hình" },
      { row: "Hiệu năng", column: "Pin", value: 9, selectedCriteria: "Hiệu năng" },
      { row: "Hiệu năng", column: "Thiết kế", value: 4, selectedCriteria: "Hiệu năng" },
      { row: "Hiệu năng", column: "Độ bền", value: "1/3", selectedCriteria: "Độ bền" },
      { row: "Giá", column: "Màn hình", value: "1/8", selectedCriteria: "Màn hình" },
      { row: "Giá", column: "Pin", value: "5/2", selectedCriteria: "Giá" },
      { row: "Giá", column: "Thiết kế", value: 3, selectedCriteria: "Giá" },
      { row: "Giá", column: "Độ bền", value: 6, selectedCriteria: "Giá" },
      { row: "Màn hình", column: "Pin", value: 9, selectedCriteria: "Màn hình" },
      { row: "Màn hình", column: "Thiết kế", value: "7/2", selectedCriteria: "Màn hình" },
      { row: "Màn hình", column: "Độ bền", value: 8, selectedCriteria: "Màn hình" },
      { row: "Pin", column: "Thiết kế", value: "1/6", selectedCriteria: "Thiết kế" },
      { row: "Pin", column: "Độ bền", value: "1/4", selectedCriteria: "Độ bền" },
      { row: "Thiết kế", column: "Độ bền", value: 5, selectedCriteria: "Thiết kế" }
    ];

    // Map and update comparisons with inconsistent data
    const updatedComparisons = comparisons.map((comparison) => {
      // Try to find a direct match
      const directMatch = inconsistentTestData.find(
        test => test.row === comparison.row && test.column === comparison.column
      );
      
      if (directMatch) {
        return {
          ...comparison,
          value: directMatch.value,
          completed: true,
          selectedCriteria: directMatch.selectedCriteria
        };
      }

      // Try to find a reverse match and invert the value
      const reverseMatch = inconsistentTestData.find(
        test => test.row === comparison.column && test.column === comparison.row
      );

      if (reverseMatch) {
        // Invert the value
        let invertedValue;
        if (typeof reverseMatch.value === "string" && reverseMatch.value.includes("/")) {
          const [numerator, denominator] = reverseMatch.value.split("/").map(Number);
          invertedValue = `${denominator}/${numerator}`;
        } else if (typeof reverseMatch.value === "number") {
          invertedValue = `1/${reverseMatch.value}`;
        } else {
          invertedValue = 1; // Default fallback
        }

        return {
          ...comparison,
          value: invertedValue,
          completed: true,
          selectedCriteria: comparison.row // When inverted, the selectedCriteria changes
        };
      }

      // If no match found, keep the original comparison
      return comparison;
    });

    setComparisons(updatedComparisons);
    setError(null);
    
    toast({
      title: "Dữ liệu không nhất quán đã được áp dụng",
      description: "Các đánh giá này cố ý tạo ra mâu thuẫn để kiểm tra CR > 0.1",
      variant: "warning",
      duration: 3000
    });
  };

  const handleSelectImportanceLevel = (value: string | number) => {
    if (!currentComparison || !selectedCriteria) return;

    setCurrentChoice(value);

    setTimeout(() => {
      const updatedComparisons = [...comparisons];
      updatedComparisons[currentIndex] = {
        ...currentComparison,
        value,
        completed: true,
        selectedCriteria,
      };

      setComparisons(updatedComparisons);

      if (editingIndex !== null) {
        // Don't auto-advance if in edit mode
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

  // Updated submit handler using direct API
  const handleSubmit = async () => {
    if (currentIndex < comparisons.length - 1) {
      toast({
        title: "Chưa hoàn thành",
        description: "Vui lòng hoàn thành tất cả các so sánh trước khi tiếp tục.",
        variant: "destructive",
      });
      return;
    }

    if (processingState === "processing") return;

    setProcessingState("processing");
    setError(null);

    try {
      // Format the comparisons for API
      const formattedComparisons = comparisons.map((comparison) => ({
        row: comparison.row,
        column: comparison.column,
        value: typeof comparison.value === "string" ? comparison.value : comparison.value.toString(),
        selected_criterion: comparison.selectedCriteria,
      }));

      // Prepare the request payload
      const payload: ProcessComparisonsRequest = {
        comparisons: formattedComparisons,
        usage: searchParams.get("usage") || "general",
      };

      // Submit to API
      const response: ProcessComparisonsResponse = await apiService.processComparisons(payload);

      if (response.status === "success") {
        if (response.consistency && response.consistency.is_consistent) {
          // Success! Update state and prepare to navigate
          setProcessingState("success");
          
          setTimeout(() => {
            // Tạo URL params mới, giữ lại TẤT CẢ tham số lọc từ URL hiện tại
            const params = new URLSearchParams(searchParams.toString());
            
            // CHỈ lưu dữ liệu vào cookies, KHÔNG thêm vào URL
            if (response.weights && response.weights.formatted) {
              const weightsObject: Record<string, number> = {};
              response.weights.formatted.forEach(item => {
                weightsObject[item.criterion] = item.weight;
              });
              
              // Chỉ lưu vào cookies, không đưa vào URL
              Cookies.set('criteriaWeights', JSON.stringify(weightsObject), { expires: 1, path: '/' });
            }
            
            // Extract danh sách tiêu chí và chỉ lưu vào cookies
            const criteriaList = comparisons
              .map(comp => comp.row)
              .filter((value, index, self) => self.indexOf(value) === index);
            
            // Chỉ lưu vào cookies
            Cookies.set('criteriaList', JSON.stringify(criteriaList), { expires: 1, path: '/' });
            
            // Lưu thêm thông tin vào cookies
            Cookies.set('processComparisonResponse', JSON.stringify(response), { expires: 1, path: '/' });
            
            // XÓA các tham số không cần thiết khỏi URL nếu có
            params.delete('weights');
            params.delete('criteria');
            
            // Chuyển đến trang tiếp theo với URL ngắn gọn hơn
            navigate(`/laptop-selection?${params.toString()}`);
          }, 1500);
        } else {
          // Matrix is inconsistent but response was successful
          setProcessingState("error");
          setProcessingError(
            response.consistency?.message ||
            "Ma trận đánh giá không nhất quán. Vui lòng xem lại các so sánh của bạn."
          );
        }
      } else {
        // Error response
        setProcessingState("error");
        setProcessingError(
          response.message || "Có lỗi xảy ra khi gửi dữ liệu. Vui lòng thử lại."
        );
      }
    } catch (error) {
      console.error("Error submitting comparisons:", error);
      setProcessingState("error");
      setProcessingError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getComparisonDisplayValue = (comparison: Comparison) => {
    // If it's a fraction string
    if (
      typeof comparison.value === "string" &&
      comparison.value.includes("/")
    ) {
      return comparison.value;
    }
    // If it's a number
    if (typeof comparison.value === "number") {
      // If it's an integer
      if (Number.isInteger(comparison.value)) {
        return comparison.value.toString();
      }
      // If it's a decimal
      return comparison.value.toFixed(2);
    }
    return comparison.value.toString();
  };

  // Edit functions
  const handleStartDirectEdit = (
    index: number,
    currentValue: string | number
  ) => {
    setEditingValueIndex(index);
    setTempEditValue(currentValue.toString());
  };

  const handleSaveDirectEdit = (index: number) => {
    // Validate value
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

  // Calculate percentage completed
  const completedPercentage = comparisons.length
    ? Math.round(
        (comparisons.filter((c) => c.completed).length / comparisons.length) *
          100
      )
    : 0;

  const isFormValid =
    comparisons.every((c) => c.completed) && processingState !== "processing" && !isSubmitting;

  // Thêm useEffect để mô phỏng tiến độ
  useEffect(() => {
    if (processingState === "processing") {
      const timer = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) clearInterval(timer);
          return Math.min(prev + 10, 90);
        });
      }, 300);
      return () => clearInterval(timer);
    } else {
      setProcessingProgress(0);
    }
  }, [processingState]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative min-h-screen p-4 bg-gradient-to-br from-slate-50 to-slate-100 md:p-8"
    >
      <BackgroundDecoration />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-6 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-800">
            Bước 3: So sánh cặp tiêu chí
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

        {/* Progress indicator */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Tiến độ so sánh
            </span>
            <Badge
                variant="default"
                className={`${
                  completedPercentage === 100
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-indigo-100 text-indigo-800 border-indigo-200"
                }`}
              >
              {completedPercentage}% hoàn thành
            </Badge>
          </div>
          <div className="h-3 bg-gray-200 rounded-full">
            <div
              className={`h-3 rounded-full ${
                completedPercentage === 100
                  ? "bg-gradient-to-r from-green-400 to-green-600"
                  : "bg-gradient-to-r from-indigo-500 to-purple-600"
              }`}
              style={{ width: `${completedPercentage}%` }}
            ></div>
          </div>
        </motion.div>

        {/* Error message */}
        {error && (
          <motion.div
            variants={itemVariants}
            className="mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Processing state */}
        {processingState === "processing" && (
          <Card className="mb-6 border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="relative mb-6">
                  <div className="flex items-center justify-center w-24 h-24 border-4 border-indigo-100 rounded-full">
                    <div
                      className="absolute top-0 left-0 w-24 h-24 border-4 rounded-full border-t-indigo-600"
                      style={{ animation: "spin 1s linear infinite" }}
                    ></div>
                    <span className="text-xl font-bold text-indigo-700">
                      {processingProgress}%
                    </span>
                  </div>
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-800">
                  {processingMessage}
                </h3>
                <p className="text-gray-500">
                  Vui lòng đợi trong giây lát, hệ thống đang xử lý dữ liệu so
                  sánh của bạn.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error processing state */}
        {processingState === "error" && (
          <Card className="mb-6 border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="flex items-center justify-center w-20 h-20 mb-6 text-red-600 bg-red-100 rounded-full">
                  <XCircle size={40} />
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-800">
                  Phát hiện vấn đề về tính nhất quán
                </h3>
                <p className="mb-6 text-gray-700">{processingError}</p>
                <div className="w-full p-4 mb-6 text-left border border-red-200 rounded-lg bg-red-50">
                  <p className="text-red-800">
                    <strong>Gợi ý:</strong> Hãy kiểm tra lại các đánh giá để đảm
                    bảo tính nhất quán. Ví dụ, nếu A quan trọng gấp 3 lần B và B
                    quan trọng gấp 2 lần C, thì A phải quan trọng gấp khoảng 6
                    lần C.
                  </p>
                </div>
                <Button
                  onClick={() => setProcessingState("idle")}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Quay lại chỉnh sửa so sánh
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success processing state */}
        {processingState === "success" && (
          <Card className="mb-6 border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="flex items-center justify-center w-20 h-20 mb-6 text-green-600 bg-green-100 rounded-full">
                  <CheckCircle size={40} />
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-800">
                  Phân tích hoàn tất
                </h3>
                <p className="mb-6 text-gray-500">
                  Đang chuyển đến trang kết quả laptop phù hợp...
                </p>
                <div className="w-12 h-12 border-4 rounded-full border-t-green-600 border-r-green-600 border-b-green-100 border-l-green-100 animate-spin"></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main comparison card */}
        {processingState === "idle" && currentComparison && (
          <motion.div
            variants={itemVariants}
            key={`comparison-${currentIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-none shadow-xl">
              <CardHeader className="pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    So sánh {currentIndex + 1}/{comparisons.length}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      Đã hoàn thành:{" "}
                      {comparisons.filter((c) => c.completed).length}/
                      {comparisons.length}
                    </span>
                  </div>
                </div>
                <CardDescription>
                  Chọn tiêu chí quan trọng hơn và mức độ quan trọng
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6">
                {/* Main comparison section */}
                <div className="flex flex-col space-y-6">
                  {/* Criteria selection */}
                  <div className="flex flex-col space-y-6 md:flex-row md:space-x-4 md:space-y-0">
                    {/* First criteria */}
                    <div
                      className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedCriteria === currentComparison.row
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-indigo-300"
                      }`}
                      onClick={() =>
                        handleCriteriaSelection(currentComparison.row)
                      }
                    >
                      <div className="flex items-center mb-2 space-x-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getCriteriaColor(
                            currentComparison.row
                          )}`}
                        >
                          <span className="text-lg font-bold">
                            {currentComparison.row.charAt(0)}
                          </span>
                        </div>
                        <div className="text-lg font-semibold">
                          {currentComparison.row}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">
                        {selectedCriteria === currentComparison.row
                          ? "Đã chọn là quan trọng hơn"
                          : "Chọn nếu tiêu chí này quan trọng hơn"}
                      </p>
                    </div>

                    {/* VS symbol */}
                    <div className="flex items-center justify-center">
                      <div className="px-4 py-2 font-semibold text-gray-600 bg-gray-100 rounded-full">
                        VS
                      </div>
                    </div>

                    {/* Second criteria */}
                    <div
                      className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedCriteria === currentComparison.column
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-indigo-300"
                      }`}
                      onClick={() =>
                        handleCriteriaSelection(currentComparison.column)
                      }
                    >
                      <div className="flex items-center mb-2 space-x-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getCriteriaColor(
                            currentComparison.column
                          )}`}
                        >
                          <span className="text-lg font-bold">
                            {currentComparison.column.charAt(0)}
                          </span>
                        </div>
                        <div className="text-lg font-semibold">
                          {currentComparison.column}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">
                        {selectedCriteria === currentComparison.column
                          ? "Đã chọn là quan trọng hơn"
                          : "Chọn nếu tiêu chí này quan trọng hơn"}
                      </p>
                    </div>
                  </div>

                  {/* Importance level selection */}
                  {showImportanceSelection && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="pt-4 border-t border-gray-100"
                    >
                      <h4 className="mb-3 font-medium text-gray-800">
                        {selectedCriteria === currentComparison.row
                          ? `${currentComparison.row} quan trọng hơn ${currentComparison.column} như thế nào?`
                          : `${currentComparison.column} quan trọng hơn ${currentComparison.row} như thế nào?`}
                      </h4>

                      <div className="grid grid-cols-2 gap-2 mb-4 md:grid-cols-3">
                        {IMPORTANCE_LEVELS.map((level) => (
                          <motion.button
                            key={level.value}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() =>
                              handleSelectImportanceLevel(level.value)
                            }
                            className={`py-2 px-4 rounded-lg border ${
                              currentChoice === level.value
                                ? "bg-indigo-100 border-indigo-400 font-medium"
                                : "bg-white border-gray-200 hover:border-indigo-300"
                            }`}
                          >
                            <div className="mb-1 font-semibold">
                              {level.value}
                            </div>
                            <div className="text-xs text-gray-500">
                              {level.label}
                            </div>
                          </motion.button>
                        ))}
                      </div>

                      <div className="mb-4">
                        <h5 className="mb-2 text-sm font-medium text-gray-700">
                          Hoặc sử dụng các giá trị trung gian
                        </h5>
                        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                          {COMMON_FRACTIONS.map((fraction) => (
                            <motion.button
                              key={fraction.value}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() =>
                                handleSelectImportanceLevel(fraction.value)
                              }
                              className={`py-1.5 px-3 rounded border text-sm ${
                                currentChoice === fraction.value
                                  ? "bg-indigo-100 border-indigo-400 font-medium"
                                  : "bg-white border-gray-200 hover:border-indigo-300"
                              }`}
                            >
                              {fraction.value}
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-end space-x-2">
                        <div className="flex-grow space-y-1">
                          <label className="text-sm font-medium text-gray-700">
                            Hoặc nhập giá trị tùy chọn
                          </label>
                          <Input
                            placeholder="Ví dụ: 3 hoặc 5/2"
                            value={customValue}
                            onChange={handleCustomValueChange}
                            className="focus:border-indigo-500"
                          />
                        </div>
                        <Button
                          onClick={handleApplyCustomValue}
                          size="sm"
                          variant="outline"
                          className="mb-px"
                        >
                          Áp dụng
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Completed status */}
                  {!showImportanceSelection && currentComparison.completed && (
                    <div className="flex items-center p-4 mt-4 space-x-2 border border-green-200 rounded-lg bg-green-50">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-800">
                        Đã hoàn thành so sánh này
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex justify-between pt-4 border-t border-gray-100">
                <div>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/custom-criteria?${searchParams}`)}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft size={16} /> Quay lại
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft size={16} /> Trước
                  </Button>

                  {currentIndex < comparisons.length - 1 ? (
                    <Button
                      onClick={handleNext}
                      disabled={!currentComparison.completed}
                      className="flex items-center gap-1"
                    >
                      Tiếp <ChevronRight size={16} />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={!isFormValid}
                      className="flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                    >
                      Hoàn thành <ArrowRight size={16} />
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {/* Completed comparisons summary */}
        {processingState === "idle" && completedPercentage > 0 && (
          <motion.div variants={itemVariants} className="mt-8">
            <h3 className="mb-3 font-medium text-gray-700">
              So sánh đã hoàn thành
            </h3>

            <div className="overflow-hidden bg-white border border-gray-100 rounded-lg shadow">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b border-gray-200">
                        #
                      </th>
                      <th className="px-5 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b border-gray-200">
                        Tiêu chí 1
                      </th>
                      <th className="px-5 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b border-gray-200">
                        Tiêu chí 2
                      </th>
                      <th className="px-5 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b border-gray-200">
                        Kết quả
                      </th>
                      <th className="px-5 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b border-gray-200">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisons
                      .filter((c) => c.completed)
                      .map((comparison, index) => (
                        <tr key={index}>
                          <td className="px-5 py-4 text-sm border-b border-gray-100">
                            {index + 1}
                          </td>
                          <td className="px-5 py-4 text-sm border-b border-gray-100">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${getCriteriaColor(
                                  comparison.row
                                )}`}
                              >
                                <span className="text-xs font-bold">
                                  {comparison.row.charAt(0)}
                                </span>
                              </div>
                              <span>{comparison.row}</span>
                              {comparison.selectedCriteria ===
                                comparison.row && (
                                <Badge className="ml-1 text-green-800 bg-green-100 border-green-200">
                                  Quan trọng hơn
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm border-b border-gray-100">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${getCriteriaColor(
                                  comparison.column
                                )}`}
                              >
                                <span className="text-xs font-bold">
                                  {comparison.column.charAt(0)}
                                </span>
                              </div>
                              <span>{comparison.column}</span>
                              {comparison.selectedCriteria ===
                                comparison.column && (
                                <Badge className="ml-1 text-green-800 bg-green-100 border-green-200">
                                  Quan trọng hơn
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm border-b border-gray-100">
                            {editingValueIndex === index ? (
                              <div className="flex items-center space-x-1">
                                <Input
                                  className="w-20 h-8 text-sm"
                                  value={tempEditValue}
                                  onChange={(e) =>
                                    setTempEditValue(e.target.value)
                                  }
                                />
                                <Button
                                  size="sm"
                                  className="w-8 h-8 p-0"
                                  onClick={() => handleSaveDirectEdit(index)}
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-8 h-8 p-0"
                                  onClick={handleCancelDirectEdit}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="font-medium">
                                {getComparisonDisplayValue(comparison)}x
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4 text-sm border-b border-gray-100">
                            {editingValueIndex !== index && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-gray-500 hover:text-indigo-600"
                                onClick={() =>
                                  handleStartDirectEdit(index, comparison.value)
                                }
                              >
                                <Edit className="w-4 h-4 mr-1" /> Sửa
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Developer tools for testing */}
        <div className="flex pt-6 mt-6 space-x-3 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoFillTestData}
            className="text-xs"
          >
            Auto-fill Test Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleInconsistentTestData}
            className="text-xs text-red-500 border-red-200"
          >
            Test Inconsistent Data
          </Button>
        </div>

        {/* Review Dialog (for testing purposes) */}
        <Dialog
          open={showReviewDialog}
          onOpenChange={setShowReviewDialog}
        >
          <DialogContent className="relative z-50 max-w-2xl p-6 mx-auto bg-white rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-gray-800">
                Xem lại dữ liệu so sánh
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4">
              <h4 className="mb-2 font-medium text-gray-700 text-md">
                Dữ liệu đã điền tự động:
              </h4>
              <div className="overflow-hidden rounded-lg shadow bg-gray-50">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase border-b">
                          Tiêu chí 1
                        </th>
                        <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase border-b">
                          Tiêu chí 2
                        </th>
                        <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase border-b">
                          Giá trị
                        </th>
                        <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase border-b">
                          Quan trọng hơn
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisons.map((comparison, index) => (
                        <tr
                          key={index}
                          className={
                            comparison.completed
                              ? "bg-green-50 hover:bg-green-100"
                              : "hover:bg-indigo-50"
                          }
                        >
                          <td className="px-4 py-3 text-sm border-b">
                            {comparison.row}
                          </td>
                          <td className="px-4 py-3 text-sm border-b">
                            {comparison.column}
                          </td>
                          <td className="px-4 py-3 text-sm border-b">
                            {getComparisonDisplayValue(comparison)}x
                          </td>
                          <td className="px-4 py-3 text-sm border-b">
                            {comparison.selectedCriteria === comparison.row
                              ? "✓"
                              : comparison.selectedCriteria === comparison.column
                              ? "✗"
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2 mt-4">
              <Button
                onClick={() => setShowReviewDialog(false)}
                variant="outline"
                className="text-gray-700"
              >
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
}

export default CriteriaPairwiseComparison;
