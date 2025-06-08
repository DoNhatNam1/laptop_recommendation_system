import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Pie } from "react-chartjs-2";

// Extend the jsPDF type to include properties added by jspdf-autotable
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
      [key: string]: any;
    };
  }
}
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { base64String } from "@/lib/base64String";
import { Button } from "./ui/button";
import { RotateCcw } from "lucide-react";
ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement
);

interface ResultData {
  ranked_laptops: {
    id: string | number;
    name: string;
    cpu: string;
    ram: string;
    screen?: string;
    screen_name?: string;
    screen_size?: number;
    battery: string;
    price: number;
    storage: string;
    weight?: number;
    score: number;
    rank: number;
  }[];
  criteria_weights: Record<string, number>;
  laptop_count: number;

  // Các trường dữ liệu ma trận đã cập nhật
  original_matrices?: Record<string, number[][]>;
  normalized_matrices?: Record<string, number[][]>;
  column_sums?: Record<string, number[]>;

  // Trọng số phương án - cấu trúc mới
  alternative_priority_tables?: Record<string, AlternativePriorityItem[]>;
  criteria_priority_tables?: Record<string, AlternativePriorityItem[]>;

  // Các thông tin nhất quán - cấu trúc mới tách rời
  consistency_status?: Record<string, boolean>;
  consistency_vectors?: Record<string, number[]>;
  lambda_max?: Record<string, number>;
  ci_values?: Record<string, number>;
  cr_results?: Record<string, number>;
  ri_values?: Record<string, number>;
}

// Định nghĩa interface cho AlternativePriorityItem nếu chưa có
interface AlternativePriorityItem {
  laptop_id: string | number;
  laptop_name: string;
  weight: number;
}

function RecommendationResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  // useEffect(() => {
  //   if (result) {
  //     console.log("=========== DEBUG DỮ LIỆU AHP ===========");
  //     console.log("Full result:", result);
  //     console.log("Criteria weights:", result.criteria_weights);
  //     console.log("Original matrices:", result.original_matrices);
  //     console.log("Normalized matrices:", result.normalized_matrices);
  //     console.log(
  //       "Alternative priority tables:",
  //       result.alternative_priority_tables
  //     );
  //     console.log("Column sums:", result.column_sums);
  //     console.log("Consistency status:", result.consistency_status);

  //     // Log chi tiết từng tiêu chí
  //     if (result.criteria_weights) {
  //       Object.keys(result.criteria_weights).forEach((criterion) => {
  //         console.log(`\n===== CHI TIẾT TIÊU CHÍ: ${criterion} =====`);
  //         console.log(`Matrix:`, result.original_matrices?.[criterion]);
  //         console.log(`Normalized:`, result.normalized_matrices?.[criterion]);
  //         console.log(
  //           `Priority items:`,
  //           result.alternative_priority_tables?.[criterion]
  //         );
  //         console.log(`Column sums:`, result.column_sums?.[criterion]);
  //         console.log(`Consistency:`, getConsistencyInfo(result, criterion));
  //       });
  //     }
  //   }
  // }, [result]);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const resultFromCookie = Cookies.get("evaluationResults");
        if (resultFromCookie) {
          const parsedResult = JSON.parse(resultFromCookie);
          if (parsedResult && parsedResult.ranked_laptops?.length > 0) {
            setResult(parsedResult);
            setLoading(false);
            return;
          }
        }
        const savedResult = localStorage.getItem("recommendation_result");
        if (savedResult) {
          const parsedResult = JSON.parse(savedResult);
          if (parsedResult && parsedResult.ranked_laptops?.length > 0) {
            setResult(parsedResult);
            setLoading(false);
            return;
          }
        }
        setError(
          "Không tìm thấy kết quả đánh giá. Vui lòng thực hiện đánh giá laptop trước."
        );
        setLoading(false);
      } catch (err) {
        setError("Đã xảy ra lỗi khi tải kết quả đánh giá");
        setLoading(false);
      }
    };
    loadResults();
  }, [location.state, navigate]);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const criteriaPairwiseResult = Cookies.get("processComparisonResponse");
  let criteriaPairwiseData: any = null;
  if (criteriaPairwiseResult) {
    try {
      criteriaPairwiseData = JSON.parse(criteriaPairwiseResult);
    } catch (e) {
      criteriaPairwiseData = null;
    }
  }

  const getMedal = (rank: number) => {
    if (rank === 1)
      return (
        <span style={{ color: "#FFD700", fontWeight: 700, fontSize: 18 }}>
          🥇
        </span>
      );
    if (rank === 2)
      return (
        <span style={{ color: "#C0C0C0", fontWeight: 700, fontSize: 18 }}>
          🥈
        </span>
      );
    if (rank === 3)
      return (
        <span style={{ color: "#CD7F32", fontWeight: 700, fontSize: 18 }}>
          🥉
        </span>
      );
    return (
      <span
        style={{
          color: "#64748b",
          fontWeight: 700,
          fontSize: 16,
          marginRight: 4,
        }}
      >
        #{rank}
      </span>
    );
  };

  const exportToExcel = () => {
    if (!result?.ranked_laptops) return;

    // Sheet 1: Bảng xếp hạng laptop
    const ws1 = XLSX.utils.json_to_sheet(
      result.ranked_laptops.map((l) => ({
        Hạng: l.rank,
        "Tên laptop": l.name,
        CPU: l.cpu,
        RAM: l.ram,
        "Lưu trữ": l.storage,
        "Màn hình": l.screen_name || l.screen || "",
        Pin: l.battery || "",
        "Trọng lượng": l.weight ? `${l.weight}kg` : "",
        Giá: formatPrice(l.price),
        Điểm: l.score.toFixed(4),
      }))
    );

    // Sheet 2: Chi tiết AHP từng tiêu chí
    const ahpSheets: { [key: string]: XLSX.WorkSheet } = {};
    if (result.criteria_weights) {
      Object.keys(result.criteria_weights).forEach((criterion) => {
        const matrix = result.original_matrices?.[criterion];
        const normalized = result.normalized_matrices?.[criterion];
        const priorityItems = result.alternative_priority_tables?.[criterion];
        const priorities = priorityItems?.map((item) => item.weight);
        const columnSums = result.column_sums?.[criterion];
        const consistency = getConsistencyInfo(result, criterion);

        // Ma trận so sánh
        let rows: any[] = [];
        if (matrix) {
          rows.push(["Ma trận so sánh"]);
          matrix.forEach((row: number[]) => {
            rows.push(row.map((cell) => Number(cell.toFixed(4))));
          });
        }

        // Tổng cột
        if (columnSums) {
          rows.push([]);
          rows.push([
            "Tổng cột",
            ...columnSums.map((v: number) => Number(v.toFixed(4))),
          ]);
        }

        // Ma trận chuẩn hóa
        if (normalized) {
          rows.push([]);
          rows.push(["Ma trận chuẩn hóa"]);
          normalized.forEach((row: number[]) => {
            rows.push(row.map((cell) => Number(cell.toFixed(4))));
          });
        }

        // Vector ưu tiên
        if (priorities) {
          rows.push([]);
          rows.push([
            "Vector ưu tiên",
            ...priorities.map((v: number) => Number(v.toFixed(4))),
          ]);
        }

        // Thông tin nhất quán
        if (consistency) {
          rows.push([]);
          rows.push([
            "CI",
            consistency.CI ?? "",
            "CR",
            consistency.CR ?? "",
            "RI",
            consistency.RI ?? "",
            "λmax",
            consistency.lambda_max ?? "",
            "Nhất quán",
            consistency.is_consistent ? "✔️" : "❌",
          ]);
          rows.push(["Message", consistency.message ?? ""]);
        }

        ahpSheets[criterion] = XLSX.utils.aoa_to_sheet(rows);
      });
    }

    // THÊM MỚI: Sheet Chi tiết AHP phân tích phương án
    let wsAHPDetails: XLSX.WorkSheet | undefined = undefined;
    if (result.alternative_priority_tables) {
      const detailRows: any[] = [];

      // Tiêu đề chính
      detailRows.push(["CHI TIẾT PHÂN TÍCH AHP TỪNG TIÊU CHÍ"]);
      detailRows.push([]);

      // Duyệt qua từng tiêu chí
      Object.keys(result.alternative_priority_tables).forEach(
        (criterion, index) => {
          // Nếu không phải tiêu chí đầu tiên, thêm dòng trống để ngăn cách
          if (index > 0) {
            detailRows.push([]);
            detailRows.push([]);
          }

          // Tiêu đề tiêu chí
          detailRows.push([`CHI TIẾT AHP CHO TIÊU CHÍ: ${criterion}`]);

          // Lấy dữ liệu cho tiêu chí hiện tại
          const matrix = result.original_matrices?.[criterion];
          const columnSums = result.column_sums?.[criterion];
          const normalized = result.normalized_matrices?.[criterion];
          const priorityItems = result.alternative_priority_tables?.[criterion];
          const consistencyVector = result.consistency_vectors?.[criterion];
          const lambdaMax = result.lambda_max?.[criterion];
          const CI = result.ci_values?.[criterion];
          const CR = result.cr_results?.[criterion];
          const RI = result.ri_values?.[criterion];
          const isConsistent = result.consistency_status?.[criterion];

          // Thông tin độ nhất quán
          detailRows.push([]);
          detailRows.push(["THÔNG TIN ĐỘ NHẤT QUÁN"]);
          detailRows.push(["λmax", "CI", "RI", "CR", "Trạng thái"]);
          detailRows.push([
            lambdaMax?.toFixed(4) || "N/A",
            CI?.toFixed(4) || "N/A",
            RI?.toFixed(2) || "N/A",
            CR?.toFixed(4) || "N/A",
            isConsistent ? "✅ Nhất quán" : "❌ Không nhất quán",
          ]);
          detailRows.push([
            "Ghi chú:",
            isConsistent
              ? `Ma trận nhất quán (CR = ${CR?.toFixed(4) || "N/A"})`
              : `Ma trận không nhất quán (CR = ${
                  CR?.toFixed(4) || "N/A"
                } > 0.1)`,
          ]);
          detailRows.push([
            "Yêu cầu:",
            "CR < 0.1 để đảm bảo tính nhất quán",
            `CR = CI/RI, trong đó CI = (λmax - n)/(n - 1)`,
          ]);

          // Ma trận so sánh gốc
          if (matrix && priorityItems) {
            detailRows.push([]);
            detailRows.push(["MA TRẬN SO SÁNH GỐC"]);

            // Tiêu đề ma trận
            const headerRow = [""];
            priorityItems.forEach((item) => {
              headerRow.push(item.laptop_name);
            });
            detailRows.push(headerRow);

            // Dữ liệu ma trận
            matrix.forEach((row, idx) => {
              const dataRow = [
                priorityItems[idx]?.laptop_name || `Laptop ${idx + 1}`,
              ];
              row.forEach((cell) => {
                dataRow.push(cell.toFixed(4));
              });
              detailRows.push(dataRow);
            });

            // Tổng cột
            if (columnSums) {
              const sumRow = ["Tổng cột"];
              columnSums.forEach((sum) => {
                sumRow.push(sum.toFixed(4));
              });
              detailRows.push(sumRow);
            }
          }

          // Ma trận chuẩn hóa
          if (normalized && priorityItems) {
            detailRows.push([]);
            detailRows.push(["MA TRẬN CHUẨN HÓA"]);

            // Tiêu đề ma trận
            const headerRow = [""];
            priorityItems.forEach((item) => {
              headerRow.push(item.laptop_name);
            });
            headerRow.push("Trọng số");
            detailRows.push(headerRow);

            // Dữ liệu ma trận
            normalized.forEach((row, idx) => {
              const dataRow = [
                priorityItems[idx]?.laptop_name || `Laptop ${idx + 1}`,
              ];
              row.forEach((cell) => {
                dataRow.push(cell.toFixed(4));
              });
              dataRow.push(priorityItems[idx]?.weight.toFixed(4) || "N/A");
              detailRows.push(dataRow);
            });
          }

          // Vector nhất quán
          if (consistencyVector && priorityItems) {
            detailRows.push([]);
            detailRows.push(["VECTOR NHẤT QUÁN"]);
            detailRows.push(["Laptop", "Trọng số (w)", "Vector nhất quán (λ)"]);

            priorityItems.forEach((item, idx) => {
              detailRows.push([
                item.laptop_name,
                item.weight.toFixed(4),
                consistencyVector[idx].toFixed(4),
              ]);
            });

            detailRows.push([
              "λmax:",
              `Giá trị trung bình của vector nhất quán = ${
                lambdaMax?.toFixed(4) || "N/A"
              }`,
            ]);
          }

          // Vector ưu tiên
          if (priorityItems) {
            detailRows.push([]);
            detailRows.push([`VECTOR ƯU TIÊN CHO TIÊU CHÍ ${criterion}`]);
            detailRows.push(["Laptop", "Trọng số", "Phần trăm"]);

            // Sắp xếp theo trọng số giảm dần
            const sortedItems = [...priorityItems].sort(
              (a, b) => b.weight - a.weight
            );

            sortedItems.forEach((item) => {
              detailRows.push([
                item.laptop_name,
                item.weight.toFixed(4),
                (item.weight * 100).toFixed(2) + "%",
              ]);
            });
          }
        }
      );

      // Tạo worksheet từ dữ liệu
      wsAHPDetails = XLSX.utils.aoa_to_sheet(detailRows);

      // Định dạng các ô
      const mergeRanges = [];
      // Tiêu đề chính
      mergeRanges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } });

      // Áp dụng merge cells
      wsAHPDetails["!merges"] = mergeRanges;

      // Định dạng độ rộng cột
      const wscols = [
        { wch: 20 }, // Cột đầu rộng hơn để chứa tên laptop
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
      ];
      wsAHPDetails["!cols"] = wscols;
    }

    // Sheet: So sánh cặp tiêu chí (nếu có)
    let wsCriteria: XLSX.WorkSheet | undefined = undefined;
    if (criteriaPairwiseData && criteriaPairwiseData.status === "success") {
      const rows: any[] = [];

      // Ma trận so sánh
      if (criteriaPairwiseData.matrix) {
        rows.push(["Ma trận so sánh tiêu chí"]);
        rows.push(["", ...criteriaPairwiseData.matrix.criteria_order]);
        criteriaPairwiseData.matrix.data.forEach((row: number[], i: number) => {
          rows.push([
            criteriaPairwiseData.matrix.criteria_order[i],
            ...row.map((cell) => Number(cell.toFixed(4))),
          ]);
        });
      }

      // Tổng cột
      if (criteriaPairwiseData.column_sums) {
        rows.push([]);
        rows.push([
          "Tổng cột",
          ...criteriaPairwiseData.column_sums.map((v: number) =>
            Number(v.toFixed(4))
          ),
        ]);
      }

      // Ma trận chuẩn hóa
      if (criteriaPairwiseData.normalized_matrix) {
        rows.push([]);
        rows.push(["Ma trận chuẩn hóa"]);
        rows.push(["", ...criteriaPairwiseData.matrix.criteria_order]);
        criteriaPairwiseData.normalized_matrix.forEach(
          (row: number[], i: number) => {
            rows.push([
              criteriaPairwiseData.matrix.criteria_order[i],
              ...row.map((cell) => Number(cell.toFixed(4))),
            ]);
          }
        );
      }

      // Trọng số tiêu chí
      if (criteriaPairwiseData.weights?.formatted) {
        rows.push([]);
        rows.push(["Trọng số tiêu chí"]);
        rows.push(["Tiêu chí", "Trọng số", "Phần trăm"]);
        criteriaPairwiseData.weights.formatted.forEach((w: any) => {
          rows.push([w.criterion, w.weight, w.percentage]);
        });
      }

      // Vector ưu tiên
      if (criteriaPairwiseData.consistency?.vector) {
        rows.push([]);
        rows.push([
          "Vector ưu tiên",
          ...criteriaPairwiseData.consistency.vector.map((v: number) =>
            Number(v.toFixed(4))
          ),
        ]);
      }

      // Thông tin nhất quán
      if (criteriaPairwiseData.consistency) {
        const c = criteriaPairwiseData.consistency;
        rows.push([]);
        rows.push([
          "CI",
          c.CI ?? "",
          "CR",
          c.CR ?? "",
          "RI",
          c.RI ?? "",
          "λmax",
          c.lambda_max ?? "",
          "Nhất quán",
          c.is_consistent ? "✔️" : "❌",
        ]);
        rows.push(["Message", c.message ?? ""]);
      }

      wsCriteria = XLSX.utils.aoa_to_sheet(rows);
    }

    // Tạo workbook và thêm các sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "Laptop Ranking");

    // Thêm sheet chi tiết AHP nếu có
    if (wsAHPDetails) {
      XLSX.utils.book_append_sheet(wb, wsAHPDetails, "Chi tiết AHP");
    }

    Object.keys(ahpSheets).forEach((criterion) => {
      XLSX.utils.book_append_sheet(
        wb,
        ahpSheets[criterion],
        `AHP - ${criterion}`
      );
    });
    if (wsCriteria) {
      XLSX.utils.book_append_sheet(wb, wsCriteria, "Criteria Comparison");
    }

    XLSX.writeFile(wb, "laptop_recommendations_with_ahp.xlsx");
  };

  const exportToPDF = async () => {
    if (!result?.ranked_laptops) return;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Thêm font Roboto_Regular vào VFS
    doc.addFileToVFS("Roboto-Regular.ttf", `${base64String}`);
    doc.addFont("Roboto-Regular.ttf", "Roboto-Regular", "normal");
    doc.setFont("Roboto-Regular");

    doc.text("Kết quả xếp hạng laptop", 14, 16);

    // Bảng xếp hạng
    const tableColumn = [
      "Rank",
      "Tên laptop",
      "CPU",
      "RAM",
      "Drive",
      "Màn hình",
      "Pin",
      "TLg",
      "Giá",
      "Score",
    ];
    const tableRows = result.ranked_laptops.map((l) => [
      l.rank,
      l.name,
      l.cpu,
      l.ram,
      l.storage,
      l.screen_name || l.screen || "",
      l.battery || "",
      l.weight ? `${l.weight}kg` : "",
      formatPrice(l.price),
      l.score.toFixed(4),
    ]);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 22,
      styles: { font: "Roboto-Regular", fontSize: 10 },
    });

    let currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 40;

    // Thêm phần dữ liệu so sánh cặp tiêu chí từ criteriaPairwiseData
    if (criteriaPairwiseData && criteriaPairwiseData.status === "success") {
      // Thêm trang mới nếu không đủ chỗ
      if (currentY > 200) {
        doc.addPage();
        currentY = 20;
      }

      // Tiêu đề
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Ma trận so sánh cặp tiêu chí", 14, currentY);
      currentY += 8;

      // Ma trận so sánh cặp
      if (
        criteriaPairwiseData.matrix &&
        criteriaPairwiseData.matrix.criteria_order
      ) {
        doc.setFontSize(11);

        autoTable(doc, {
          head: [["", ...criteriaPairwiseData.matrix.criteria_order]],
          body: criteriaPairwiseData.matrix.data.map(
            (row: number[], idx: number) => [
              criteriaPairwiseData.matrix.criteria_order[idx],
              ...row.map((cell: number) => cell.toFixed(3)),
            ]
          ),
          startY: currentY,
          styles: { font: "Roboto-Regular", fontSize: 9 },
          theme: "grid",
        });
        currentY =
          doc.lastAutoTable?.finalY !== undefined
            ? doc.lastAutoTable.finalY + 8
            : currentY + 30;
      }

      // Tổng cột
      doc.setFontSize(11);
      doc.text("Tổng cột:", 14, currentY);
      if (criteriaPairwiseData.column_sums) {
        autoTable(doc, {
          body: [
            criteriaPairwiseData.column_sums.map((sum: number) =>
              sum.toFixed(3)
            ),
          ],
          startY: currentY + 2,
          styles: { font: "Roboto-Regular", fontSize: 9 },
          theme: "grid" as "grid",
        });
        currentY =
          doc.lastAutoTable?.finalY !== undefined
            ? doc.lastAutoTable.finalY + 8
            : currentY + 10;
      }

      // Ma trận chuẩn hóa
      doc.text("Ma trận chuẩn hóa:", 14, currentY);
      if (
        criteriaPairwiseData.normalized_matrix &&
        criteriaPairwiseData.matrix.criteria_order
      ) {
        autoTable(doc, {
          head: [["", ...criteriaPairwiseData.matrix.criteria_order]],
          body: criteriaPairwiseData.normalized_matrix.map(
            (row: number[], idx: number) => [
              criteriaPairwiseData.matrix.criteria_order[idx],
              ...row.map((cell: number) => cell.toFixed(3)),
            ]
          ),
          startY: currentY + 2,
          styles: { font: "Roboto-Regular", fontSize: 9 },
          theme: "grid",
        });
        currentY = doc.lastAutoTable?.finalY
          ? doc.lastAutoTable.finalY + 8
          : currentY + 30;
      }

      // Trọng số tiêu chí
      doc.text("Trọng số các tiêu chí:", 14, currentY);
      if (
        criteriaPairwiseData.weights &&
        criteriaPairwiseData.weights.formatted
      ) {
        autoTable(doc, {
          head: [["Tiêu chí", "Weights", "Percentage"]],
          body: criteriaPairwiseData.weights.formatted.map(
            (w: { criterion: string; weight: number; percentage: number }) => [
              w.criterion,
              w.weight.toFixed(4),
              w.percentage.toFixed(2),
            ]
          ),
          startY: currentY + 2,
          styles: { font: "Roboto-Regular", fontSize: 9 },
          theme: "grid",
        });
        currentY = doc.lastAutoTable?.finalY
          ? doc.lastAutoTable.finalY + 8
          : currentY + 20;

        // Thêm biểu đồ Pie Chart cho trọng số
        if (criteriaPairwiseData.weights.formatted.length > 0) {
          // Tạo Pie Chart bằng chart.js ẩn
          const canvas = document.createElement("canvas");
          canvas.width = 400;
          canvas.height = 300;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            // Define the chart data structure
            interface PieChartDataset {
              data: number[];
              backgroundColor: string[];
            }

            interface PieChartData {
              labels: string[];
              datasets: PieChartDataset[];
            }

            interface PieChartOptions {
              responsive: boolean;
              plugins: {
                legend: {
                  position: "right" | "left" | "top" | "bottom" | "center";
                };
              };
            }

            interface PieChartConfiguration {
              type: "pie";
              data: PieChartData;
              options: PieChartOptions;
            }

            const chart = new ChartJS(
              ctx as any,
              {
                type: "pie",
                data: {
                  labels: criteriaPairwiseData.weights.formatted.map(
                    (w: {
                      criterion: string;
                      weight: number;
                      percentage: number;
                    }) => w.criterion
                  ),
                  datasets: [
                    {
                      data: criteriaPairwiseData.weights.formatted.map(
                        (w: {
                          criterion: string;
                          weight: number;
                          percentage: number;
                        }) => w.percentage
                      ),
                      backgroundColor: [
                        "#3498db",
                        "#e74c3c",
                        "#2ecc71",
                        "#f1c40f",
                        "#9b59b6",
                        "#1abc9c",
                        "#d35400",
                        "#34495e",
                        "#16a085",
                        "#c0392b",
                      ],
                    },
                  ],
                },
                options: {
                  responsive: false,
                  plugins: { legend: { position: "right" } },
                },
              } as PieChartConfiguration
            );

            // Đợi chart vẽ xong
            await new Promise((resolve) => setTimeout(resolve, 500));
            const imgData = canvas.toDataURL("image/png");
            chart.destroy();

            // Kiểm tra không gian còn lại, thêm trang mới nếu cần
            if (currentY > 180) {
              doc.addPage();
              currentY = 20;
            }

            doc.text("Biểu đồ trọng số các tiêu chí:", 14, currentY);
            doc.addImage(imgData, "PNG", 20, currentY + 5, 170, 80);
            currentY += 95;
          }
        }
      }

      // Thông tin nhất quán
      if (criteriaPairwiseData.consistency) {
        const c = criteriaPairwiseData.consistency;
        doc.setFontSize(10);
        doc.text(`Thông tin nhất quán:`, 14, currentY);
        doc.text(
          `CI: ${c.CI?.toFixed(4) ?? "-"}   CR: ${
            c.CR?.toFixed(4) ?? "-"
          }   RI: ${c.RI ?? "-"}   λmax: ${c.lambda_max?.toFixed(4) ?? "-"}`,
          14,
          currentY + 5
        );
        doc.text(
          `Nhất quán: ${c.is_consistent ? "✔️ Có" : "❌ Không"} - ${
            c.message ?? ""
          }`,
          14,
          currentY + 10
        );
        currentY += 20;
      }

      // Thêm trang mới sau phần phân tích tiêu chí
      doc.addPage();
      currentY = 20;
    }

    // Tóm tắt độ nhất quán
    doc.setFontSize(14);
    doc.text("Tóm tắt độ nhất quán:", 14, currentY);
    doc.setFontSize(10);
    doc.text(getConsistencySummary(result), 14, currentY + 6);
    currentY += 20;

    // PHẦN CẬP NHẬT: Thêm chi tiết AHP từng tiêu chí dựa vào alternative_priority_tables
    if (result.alternative_priority_tables) {
      doc.setFontSize(16);
      doc.text("Chi tiết phân tích AHP từng tiêu chí", 14, currentY);
      currentY += 10;

      // Lặp qua từng tiêu chí để tạo phân tích chi tiết
      for (const criterion of Object.keys(result.alternative_priority_tables)) {
        // Thêm trang mới nếu gần hết trang
        if (currentY > 200) {
          doc.addPage();
          currentY = 20;
        }

        // Lấy dữ liệu cho tiêu chí hiện tại
        const matrix = result.original_matrices?.[criterion];
        const columnSums = result.column_sums?.[criterion];
        const normalized = result.normalized_matrices?.[criterion];
        const priorityItems = result.alternative_priority_tables?.[criterion];
        const consistencyVector = result.consistency_vectors?.[criterion];
        const lambdaMax = result.lambda_max?.[criterion];
        const CI = result.ci_values?.[criterion];
        const CR = result.cr_results?.[criterion];
        const RI = result.ri_values?.[criterion];
        const isConsistent = result.consistency_status?.[criterion];

        // Tiêu đề tiêu chí
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(`Chi tiết AHP cho tiêu chí: ${criterion}`, 14, currentY);
        currentY += 8;

        // Thông tin độ nhất quán
        doc.setFontSize(11);
        doc.text("Thông tin độ nhất quán:", 14, currentY);
        currentY += 5;

        autoTable(doc, {
          head: [["λmax", "CI", "RI", "CR", "Trạng thái"]],
          body: [
            [
              lambdaMax?.toFixed(4) || "N/A",
              CI?.toFixed(4) || "N/A",
              RI?.toFixed(2) || "N/A",
              CR?.toFixed(4) || "N/A",
              isConsistent ? "✅ Nhất quán" : "❌ Không nhất quán",
            ],
          ],
          startY: currentY,
          styles: { font: "Roboto-Regular", fontSize: 9 },
          theme: "grid",
          headStyles: { fillColor: [219, 234, 254] }, // #dbeafe
          bodyStyles: {
            textColor: isConsistent ? [22, 163, 74] : [220, 38, 38], // green or red
          },
        });

        currentY = doc.lastAutoTable?.finalY
          ? doc.lastAutoTable.finalY + 8
          : currentY + 15;

        // Ghi chú về nhất quán
        doc.setFontSize(9);
        doc.text(
          `Ghi chú: CR = CI/RI, trong đó CI = (λmax - n)/(n - 1)`,
          14,
          currentY
        );
        doc.text(
          `Yêu cầu: CR < 0.1 để đảm bảo tính nhất quán.`,
          14,
          currentY + 4
        );
        currentY += 10;

        // Ma trận so sánh gốc
        if (matrix && priorityItems) {
          doc.setFontSize(11);
          doc.text("Ma trận so sánh gốc:", 14, currentY);
          currentY += 5;

          // Chuẩn bị dữ liệu cho ma trận
          const laptopNames = priorityItems.map((item) => item.laptop_name);
          const matrixRows = matrix.map((row, idx) =>
            [priorityItems[idx]?.laptop_name || `Laptop ${idx + 1}`].concat(
              row.map((cell) => cell.toFixed(3))
            )
          );

          autoTable(doc, {
            head: [["", ...laptopNames]],
            body: matrixRows,
            startY: currentY,
            styles: { font: "Roboto-Regular", fontSize: 8 },
            theme: "grid",
          });

          currentY = doc.lastAutoTable?.finalY
            ? doc.lastAutoTable.finalY + 8
            : currentY + 25;

          // Tổng cột
          if (columnSums) {
            doc.setFontSize(10);
            doc.text("Tổng cột:", 14, currentY);
            currentY += 5;

            autoTable(doc, {
              head: [
                ["Tổng cột", ...laptopNames.map((_, i) => `Col ${i + 1}`)],
              ],
              body: [["", ...columnSums.map((sum) => sum.toFixed(3))]],
              startY: currentY,
              styles: { font: "Roboto-Regular", fontSize: 8 },
              theme: "grid",
              headStyles: { fillColor: [219, 234, 254] },
            });

            currentY = doc.lastAutoTable?.finalY
              ? doc.lastAutoTable.finalY + 8
              : currentY + 15;
          }
        }

        // Ma trận chuẩn hóa
        if (normalized && priorityItems) {
          // Thêm trang mới nếu gần hết trang
          if (currentY > 200) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFontSize(11);
          doc.text("Ma trận chuẩn hóa:", 14, currentY);
          currentY += 5;

          // Chuẩn bị dữ liệu cho ma trận chuẩn hóa
          const laptopNames = priorityItems.map((item) => item.laptop_name);
          const normalizedRows = normalized.map((row, idx) =>
            [priorityItems[idx]?.laptop_name || `Laptop ${idx + 1}`]
              .concat(row.map((cell) => cell.toFixed(4)))
              .concat([priorityItems[idx].weight.toFixed(4)])
          );

          autoTable(doc, {
            head: [["", ...laptopNames, "Trọng số"]],
            body: normalizedRows,
            startY: currentY,
            styles: { font: "Roboto-Regular", fontSize: 8 },
            theme: "grid",
          });

          currentY = doc.lastAutoTable?.finalY
            ? doc.lastAutoTable.finalY + 8
            : currentY + 25;
        }

        // Vector nhất quán
        if (consistencyVector && priorityItems) {
          // Thêm trang mới nếu gần hết trang
          if (currentY > 200) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFontSize(11);
          doc.text("Vector nhất quán:", 14, currentY);
          currentY += 5;

          const consistencyRows = priorityItems.map((item, idx) => [
            item.laptop_name,
            item.weight.toFixed(4),
            consistencyVector[idx].toFixed(4),
          ]);

          autoTable(doc, {
            head: [["Laptop", "Trọng số (w)", "Vector nhất quán (λ)"]],
            body: consistencyRows,
            startY: currentY,
            styles: { font: "Roboto-Regular", fontSize: 9 },
            theme: "grid",
          });

          currentY = doc.lastAutoTable?.finalY
            ? doc.lastAutoTable.finalY + 8
            : currentY + 20;

          doc.setFontSize(9);
          doc.text(
            `λmax: Giá trị trung bình của vector nhất quán = ${
              lambdaMax?.toFixed(4) || "N/A"
            }`,
            14,
            currentY
          );
          currentY += 5;
        }

        // Vector ưu tiên - bảng trọng số theo thứ hạng
        if (priorityItems) {
          // Thêm trang mới nếu gần hết trang
          if (currentY > 180) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFontSize(11);
          doc.text(`Vector ưu tiên cho tiêu chí ${criterion}:`, 14, currentY);
          currentY += 5;

          // Sắp xếp theo trọng số giảm dần
          const sortedItems = [...priorityItems].sort(
            (a, b) => b.weight - a.weight
          );
          const priorityRows = sortedItems.map((item) => [
            item.laptop_name,
            item.weight.toFixed(4),
            (item.weight * 100).toFixed(2) + "%",
          ]);

          autoTable(doc, {
            head: [["Laptop", "Trọng số", "Phần trăm"]],
            body: priorityRows,
            startY: currentY,
            styles: { font: "Roboto-Regular", fontSize: 9 },
            theme: "grid",
          });

          currentY = doc.lastAutoTable?.finalY
            ? doc.lastAutoTable.finalY + 8
            : currentY + 20;

          // Biểu đồ tròn vector ưu tiên
          try {
            // Tạo Pie Chart cho vector ưu tiên
            const canvas = document.createElement("canvas");
            canvas.width = 400;
            canvas.height = 200;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              const chart = new ChartJS(ctx as any, {
                type: "pie",
                data: {
                  labels: sortedItems.map((item) => item.laptop_name),
                  datasets: [
                    {
                      data: sortedItems.map((item) => item.weight),
                      backgroundColor: [
                        "#3b82f6",
                        "#ef4444",
                        "#22c55e",
                        "#eab308",
                        "#a855f7",
                        "#ec4899",
                        "#0ea5e9",
                        "#f97316",
                        "#14b8a6",
                        "#8b5cf6",
                      ],
                    },
                  ],
                },
                options: {
                  responsive: false,
                  plugins: {
                    legend: {
                      position: "right",
                      labels: { font: { size: 10 }, boxWidth: 10 },
                    },
                  },
                },
              });

              // Đợi chart vẽ xong
              await new Promise((resolve) => setTimeout(resolve, 500));
              const imgData = canvas.toDataURL("image/png");
              chart.destroy();

              // Thêm trang mới nếu không đủ không gian
              if (currentY > 180) {
                doc.addPage();
                currentY = 20;
              }

              doc.addImage(imgData, "PNG", 25, currentY, 140, 70);
              currentY += 80;
            }
          } catch (err) {
            console.error("Lỗi khi tạo biểu đồ:", err);
          }
        }

        // Thêm trang mới cho tiêu chí tiếp theo
        doc.addPage();
        currentY = 20;
      }
    }

    doc.save("laptop_recommendations.pdf");
  };

  const getConsistencySummary = (result: ResultData) => {
    if (!result.consistency_status || !result.cr_results) {
      return "Không có thông tin về độ nhất quán.";
    }

    const criteria = Object.keys(result.consistency_status);
    const consistentCount = criteria.filter(
      (c) => result.consistency_status![c]
    ).length;
    const inconsistentCount = criteria.length - consistentCount;

    let summary = `${consistentCount}/${criteria.length} tiêu chí đạt độ nhất quán (CR < 0.1). `;

    if (inconsistentCount === 0) {
      summary += "Tất cả các ma trận đều nhất quán.";
    } else {
      const inconsistentCriteria = criteria.filter(
        (c) => !result.consistency_status![c]
      );
      summary += `Các tiêu chí không nhất quán: ${inconsistentCriteria.join(
        ", "
      )}.`;
    }

    // Thông tin CR trung bình
    const avgCR =
      Object.values(result.cr_results).reduce((sum, cr) => sum + cr, 0) /
      criteria.length;
    summary += ` CR trung bình: ${avgCR.toFixed(4)}.`;

    return summary;
  };

  const getConsistencyInfo = (result: ResultData, criterion: string) => {
    if (!result.consistency_status || !result.cr_results) return null;

    return {
      is_consistent: result.consistency_status[criterion],
      CR: result.cr_results[criterion],
      CI: result.ci_values?.[criterion] || 0,
      RI: result.ri_values?.[criterion] || 1.12,
      lambda_max: result.lambda_max?.[criterion] || 0,
      consistency_vector: result.consistency_vectors?.[criterion],
      message: result.consistency_status[criterion]
        ? `Ma trận nhất quán (CR = ${result.cr_results[criterion].toFixed(3)})`
        : `Ma trận không nhất quán (CR = ${result.cr_results[criterion].toFixed(
            3
          )} > 0.1)`,
    };
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Đang tải kết quả...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: "red", padding: 24, textAlign: "center" }}>
        {error}
        <br />
        <button
          style={{
            marginTop: 16,
            padding: "8px 16px",
            borderRadius: 4,
            background: "#2563eb",
            color: "#fff",
            border: "none",
          }}
          onClick={() => navigate("/laptop-selection")}
        >
          Quay lại trang đánh giá laptop
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "32px auto", padding: 16 }}>
      {loading ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "70vh",
          }}
        >
          <div style={{ fontSize: 22, marginBottom: 16, color: "#334155" }}>
            Đang tải kết quả đánh giá...
          </div>
          <div className="spinner"></div>
        </div>
      ) : error ? (
        <div
          style={{
            textAlign: "center",
            margin: "48px auto",
            fontSize: 18,
            color: "#ef4444",
          }}
        >
          {error}
          <div style={{ marginTop: 16 }}>
            <button
              style={{
                padding: "10px 16px",
                backgroundColor: "#2563eb",
                border: "none",
                borderRadius: 6,
                color: "white",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
              onClick={() => navigate("/laptop-selection")}
            >
              Quay lại trang đánh giá laptop
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Header và các nút điều khiển */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <h1
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: "#0f172a",
                margin: 0,
              }}
            >
              Kết quả đánh giá laptop
            </h1>
            <div style={{ display: "flex", gap: 12 }}>
              <Button
                onClick={exportToExcel}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#22c55e",
                  border: "none",
                  borderRadius: 6,
                  color: "white",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Xuất Excel
              </Button>
              <Button
                onClick={exportToPDF}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#ef4444",
                  border: "none",
                  borderRadius: 6,
                  color: "white",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Xuất PDF
              </Button>

              <Button
                onClick={() => navigate("/")}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 ml-auto"
              >
                <RotateCcw className="w-4 h-4" />
                Bắt đầu lại
              </Button>
            </div>
          </div>

          {/* Tóm tắt độ nhất quán */}
          {result && (
            <div
              style={{
                padding: 16,
                background: "#f0f9ff",
                borderRadius: 8,
                marginBottom: 32,
                border: "1px solid #bae6fd",
                fontSize: 15,
              }}
            >
              <div
                style={{ fontWeight: 600, color: "#0369a1", marginBottom: 8 }}
              >
                Tóm tắt độ nhất quán:
              </div>
              <div>{getConsistencySummary(result)}</div>
            </div>
          )}

          {/* Danh sách laptop xếp hạng */}
          <div style={{ marginBottom: 32 }}>
            {result?.ranked_laptops?.map((laptop, idx) => (
              <div
                key={laptop.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  background:
                    idx === 0
                      ? "linear-gradient(90deg,#fef9c3 0%,#fef08a 100%)"
                      : idx === 1
                      ? "linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 100%)"
                      : idx === 2
                      ? "linear-gradient(90deg,#fef3c7 0%,#fde68a 100%)"
                      : "#f8fafc",
                  borderRadius: 12,
                  boxShadow:
                    idx === 0 ? "0 2px 12px #fde04744" : "0 1px 4px #e2e8f044",
                  marginBottom: 18,
                  padding: 18,
                  border: idx === 0 ? "2px solid #facc15" : "1px solid #e2e8f0",
                  transition: "all .2s",
                }}
              >
                <div
                  style={{ minWidth: 48, textAlign: "center", marginRight: 16 }}
                >
                  {getMedal(laptop.rank)}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontWeight: 700, fontSize: 18, color: "#0f172a" }}
                  >
                    {laptop.name}
                  </div>
                  <div
                    style={{ color: "#334155", fontSize: 14, margin: "2px 0" }}
                  >
                    CPU: {laptop.cpu} | RAM: {laptop.ram} | Lưu trữ:{" "}
                    {laptop.storage}
                    {laptop.screen_name && (
                      <> | Màn hình: {laptop.screen_name}</>
                    )}
                    {laptop.battery && <> | Pin: {laptop.battery}</>}
                    {laptop.weight && <> | {laptop.weight}kg</>}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 15 }}>
                    <span style={{ color: "#2563eb", fontWeight: 600 }}>
                      {formatPrice(laptop.price)}
                    </span>
                    <span
                      style={{
                        marginLeft: 16,
                        color: "#059669",
                        fontWeight: 600,
                      }}
                    >
                      Điểm: {laptop.score.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Biểu đồ trọng số tiêu chí */}
          <div
            style={{
              marginBottom: 32,
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: 20,
              background: "#f9fafb",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 17,
                marginBottom: 16,
                color: "#0f172a",
              }}
            >
              Trọng số các tiêu chí
            </div>

            {result?.criteria_weights && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <div style={{ width: 300, height: 300 }}>
                  <Pie
                    data={{
                      labels: Object.keys(result.criteria_weights),
                      datasets: [
                        {
                          data: Object.values(result.criteria_weights),
                          backgroundColor: [
                            "#3b82f6",
                            "#ef4444",
                            "#22c55e",
                            "#eab308",
                            "#a855f7",
                            "#ec4899",
                          ],
                        },
                      ],
                    }}
                    options={{
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const value = context.raw as number;
                              return `${(value * 100).toFixed(2)}%`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>

                <div>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      margin: "0 0 8px 0",
                      color: "#0f172a",
                    }}
                  >
                    Bảng trọng số tiêu chí
                  </h3>
                  <table
                    style={{
                      borderCollapse: "collapse",
                      width: "100%",
                      background: "#fff",
                      border: "1px solid #94a3b8",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#f1f5f9" }}>
                        <th
                          style={{
                            padding: "8px 16px",
                            textAlign: "left",
                            border: "1px solid #94a3b8",
                          }}
                        >
                          Tiêu chí
                        </th>
                        <th
                          style={{
                            padding: "8px 16px",
                            textAlign: "right",
                            border: "1px solid #94a3b8",
                          }}
                        >
                          Trọng số
                        </th>
                        <th
                          style={{
                            padding: "8px 16px",
                            textAlign: "right",
                            border: "1px solid #94a3b8",
                          }}
                        >
                          Phần trăm
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(result.criteria_weights)
                        .sort(
                          ([_, a], [__, b]) => (b as number) - (a as number)
                        )
                        .map(([criterion, weight], index) => (
                          <tr
                            key={criterion}
                            style={{
                              background: index % 2 === 0 ? "#fff" : "#f8fafc",
                            }}
                          >
                            <td
                              style={{
                                padding: "8px 16px",
                                border: "1px solid #94a3b8",
                              }}
                            >
                              {criterion}
                            </td>
                            <td
                              style={{
                                padding: "8px 16px",
                                textAlign: "right",
                                border: "1px solid #94a3b8",
                              }}
                            >
                              {(weight as number).toFixed(4)}
                            </td>
                            <td
                              style={{
                                padding: "8px 16px",
                                textAlign: "right",
                                border: "1px solid #94a3b8",
                                fontWeight: 600,
                                color: "#0369a1",
                              }}
                            >
                              {((weight as number) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Biểu đồ trọng số phương án (laptop) theo tiêu chí */}
          {result?.alternative_priority_tables && (
            <div
              style={{
                marginBottom: 32,
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: 20,
                background: "#f9fafb",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 17,
                  marginBottom: 16,
                  color: "#0f172a",
                }}
              >
                Trọng số các phương án (laptop) theo từng tiêu chí
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(450px, 1fr))",
                  gap: 20,
                }}
              >
                {Object.entries(result.alternative_priority_tables).map(
                  ([criterion, priorityItems]) => (
                    <div key={criterion} style={{ marginBottom: 24 }}>
                      <h4
                        style={{
                          marginBottom: 12,
                          fontSize: 16,
                          fontWeight: 500,
                        }}
                      >
                        {criterion}
                      </h4>
                      <div style={{ height: 280 }}>
                        <Pie
                          data={{
                            labels: priorityItems.map(
                              (item) => item.laptop_name
                            ),
                            datasets: [
                              {
                                label: "Trọng số",
                                data: priorityItems.map((item) => item.weight),
                                backgroundColor: [
                                  "#3b82f6",
                                  "#ef4444",
                                  "#22c55e",
                                  "#eab308",
                                  "#a855f7",
                                  "#ec4899",
                                  "#0ea5e9",
                                  "#f97316",
                                  "#14b8a6",
                                  "#8b5cf6",
                                ],
                              },
                            ],
                          }}
                          options={{
                            plugins: {
                              tooltip: {
                                callbacks: {
                                  label: (context) => {
                                    const value = context.raw as number;
                                    return `${(value * 100).toFixed(2)}%`;
                                  },
                                },
                              },
                              legend: {
                                position: "right",
                                labels: {
                                  font: {
                                    size: 11,
                                  },
                                  boxWidth: 12,
                                },
                              },
                            },
                          }}
                        />
                      </div>

                      {/* Bảng trọng số phương án */}
                      <div style={{ overflowX: "auto", marginTop: 12 }}>
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: 13,
                            border: "1px solid #94a3b8",
                          }}
                        >
                          <thead>
                            <tr style={{ background: "#f1f5f9" }}>
                              <th
                                style={{
                                  padding: "6px 10px",
                                  textAlign: "left",
                                  border: "1px solid #94a3b8",
                                }}
                              >
                                Laptop
                              </th>
                              <th
                                style={{
                                  padding: "6px 10px",
                                  textAlign: "right",
                                  border: "1px solid #94a3b8",
                                }}
                              >
                                Trọng số
                              </th>
                              <th
                                style={{
                                  padding: "6px 10px",
                                  textAlign: "right",
                                  border: "1px solid #94a3b8",
                                }}
                              >
                                Phần trăm
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {priorityItems
                              .sort((a, b) => b.weight - a.weight)
                              .map((item) => (
                                <tr key={item.laptop_id}>
                                  <td
                                    style={{
                                      padding: "6px 10px",
                                      border: "1px solid #94a3b8",
                                    }}
                                  >
                                    {item.laptop_name}
                                  </td>
                                  <td
                                    style={{
                                      padding: "6px 10px",
                                      textAlign: "right",
                                      border: "1px solid #94a3b8",
                                    }}
                                  >
                                    {item.weight.toFixed(4)}
                                  </td>
                                  <td
                                    style={{
                                      padding: "6px 10px",
                                      textAlign: "right",
                                      border: "1px solid #94a3b8",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {(item.weight * 100).toFixed(2)}%
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Chi tiết AHP từng tiêu chí */}
          <div
            style={{
              marginBottom: 30,
              fontWeight: 700,
              fontSize: 20,
              color: "#0f172a",
            }}
          >
            Chi tiết phân tích AHP từng tiêu chí
          </div>

          {result?.alternative_priority_tables &&
            Object.keys(result.alternative_priority_tables).map((criterion) => {
              // Lấy dữ liệu cho tiêu chí hiện tại
              const matrix = result.original_matrices?.[criterion];
              const columnSums = result.column_sums?.[criterion];
              const normalized = result.normalized_matrices?.[criterion];
              const priorityItems =
                result.alternative_priority_tables?.[criterion];
              const consistencyVector = result.consistency_vectors?.[criterion];
              const lambdaMax = result.lambda_max?.[criterion];
              const CI = result.ci_values?.[criterion];
              const CR = result.cr_results?.[criterion];
              const RI = result.ri_values?.[criterion];
              const isConsistent = result.consistency_status?.[criterion];

              return (
                <div
                  key={criterion}
                  style={{
                    marginBottom: 30,
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: 20,
                    background: "#f9fafb",
                  }}
                >
                  <h3
                    style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}
                  >
                    Chi tiết AHP cho tiêu chí: {criterion}
                  </h3>

                  {/* Thông tin về độ nhất quán */}
                  <div
                    style={{
                      marginBottom: 20,
                      padding: 12,
                      backgroundColor: isConsistent ? "#f0fdf4" : "#fef2f2",
                      borderRadius: 6,
                      borderLeft: `4px solid ${
                        isConsistent ? "#22c55e" : "#ef4444"
                      }`,
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        border: "2px solid #94a3b8",
                      }}
                    >
                      <thead>
                        <tr style={{ background: "#dbeafe" }}>
                          <th
                            style={{
                              padding: "10px 12px",
                              border: "1px solid #94a3b8",
                              textAlign: "center",
                            }}
                          >
                            λ<sub>max</sub>
                          </th>
                          <th
                            style={{
                              padding: "10px 12px",
                              border: "1px solid #94a3b8",
                              textAlign: "center",
                            }}
                          >
                            CI
                          </th>
                          <th
                            style={{
                              padding: "10px 12px",
                              border: "1px solid #94a3b8",
                              textAlign: "center",
                            }}
                          >
                            RI
                          </th>
                          <th
                            style={{
                              padding: "10px 12px",
                              border: "1px solid #94a3b8",
                              textAlign: "center",
                            }}
                          >
                            CR
                          </th>
                          <th
                            style={{
                              padding: "10px 12px",
                              border: "1px solid #94a3b8",
                              textAlign: "center",
                            }}
                          >
                            Trạng thái
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td
                            style={{
                              padding: "10px 12px",
                              border: "1px solid #94a3b8",
                              textAlign: "center",
                              fontSize: 16,
                            }}
                          >
                            {lambdaMax?.toFixed(4) || "N/A"}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              border: "1px solid #94a3b8",
                              textAlign: "center",
                              fontSize: 16,
                            }}
                          >
                            {CI?.toFixed(4) || "N/A"}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              border: "1px solid #94a3b8",
                              textAlign: "center",
                              fontSize: 16,
                            }}
                          >
                            {RI?.toFixed(2) || "N/A"}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              border: "1px solid #94a3b8",
                              textAlign: "center",
                              fontSize: 16,
                              fontWeight: 700,
                              color: CR && CR < 0.1 ? "#16a34a" : "#dc2626",
                            }}
                          >
                            {CR?.toFixed(4) || "N/A"}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              border: "1px solid #94a3b8",
                              textAlign: "center",
                              fontSize: 16,
                              color: isConsistent ? "#16a34a" : "#dc2626",
                              fontWeight: 700,
                            }}
                          >
                            {isConsistent
                              ? "✅ Nhất quán"
                              : "❌ Không nhất quán"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div
                      style={{
                        padding: "8px 12px",
                        fontSize: 14,
                        marginTop: 8,
                      }}
                    >
                      <p style={{ margin: "4px 0", fontWeight: 500 }}>
                        {isConsistent
                          ? `Ma trận nhất quán (CR = ${
                              CR?.toFixed(4) || "N/A"
                            })`
                          : `Ma trận không nhất quán (CR = ${
                              CR?.toFixed(4) || "N/A"
                            } > 0.1)`}
                      </p>
                      <p style={{ margin: "4px 0" }}>
                        <span style={{ fontWeight: 500 }}>Công thức:</span> CR =
                        CI/RI, trong đó CI = (λ<sub>max</sub> - n)/(n - 1)
                      </p>
                      <p style={{ margin: "4px 0" }}>
                        Yêu cầu: CR &lt; 0.1 để đảm bảo tính nhất quán.
                      </p>
                    </div>
                  </div>

                  {/* Ma trận so sánh gốc */}
                  {matrix && priorityItems && (
                    <div style={{ marginBottom: 20 }}>
                      <h4
                        style={{
                          marginBottom: 8,
                          fontSize: 16,
                          fontWeight: 500,
                          backgroundColor: "#f0f9ff",
                          padding: "6px 12px",
                          borderRadius: 4,
                        }}
                      >
                        Ma trận so sánh gốc:
                      </h4>
                      <div style={{ overflowX: "auto" }}>
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            border: "2px solid #94a3b8",
                          }}
                        >
                          <thead>
                            <tr style={{ background: "#f1f5f9" }}>
                              <th
                                style={{
                                  padding: "8px 12px",
                                  border: "1px solid #94a3b8",
                                  minWidth: 120,
                                  position: "sticky",
                                  left: 0,
                                  background: "#f1f5f9",
                                  zIndex: 1,
                                }}
                              ></th>
                              {priorityItems.map((item) => (
                                <th
                                  key={item.laptop_id}
                                  style={{
                                    padding: "8px 12px",
                                    border: "1px solid #94a3b8",
                                    minWidth: 120,
                                  }}
                                >
                                  {item.laptop_name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {matrix.map((row, i) => (
                              <tr
                                key={i}
                                style={{
                                  background: i % 2 === 0 ? "#fff" : "#f8fafc",
                                }}
                              >
                                <th
                                  style={{
                                    padding: "8px 12px",
                                    border: "1px solid #94a3b8",
                                    textAlign: "left",
                                    fontWeight: 500,
                                    position: "sticky",
                                    left: 0,
                                    background:
                                      i % 2 === 0 ? "#fff" : "#f8fafc",
                                    zIndex: 1,
                                  }}
                                >
                                  {priorityItems[i]?.laptop_name ||
                                    `Laptop ${i + 1}`}
                                </th>
                                {row.map((cell, j) => (
                                  <td
                                    key={j}
                                    style={{
                                      padding: "8px 12px",
                                      border: "1px solid #94a3b8",
                                      textAlign: "center",
                                    }}
                                  >
                                    {cell.toFixed(4)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                            {/* Hiển thị tổng cột */}
                            {columnSums && (
                              <tr
                                style={{
                                  background: "#dbeafe",
                                  fontWeight: "bold",
                                }}
                              >
                                <th
                                  style={{
                                    padding: "8px 12px",
                                    border: "1px solid #94a3b8",
                                    textAlign: "left",
                                    fontWeight: 600,
                                    position: "sticky",
                                    left: 0,
                                    background: "#dbeafe",
                                    zIndex: 1,
                                  }}
                                >
                                  Tổng cột
                                </th>
                                {columnSums.map((sum, i) => (
                                  <td
                                    key={i}
                                    style={{
                                      padding: "8px 12px",
                                      border: "1px solid #94a3b8",
                                      textAlign: "center",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {sum.toFixed(4)}
                                  </td>
                                ))}
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Ma trận chuẩn hóa */}
                  {normalized && priorityItems && (
                    <div style={{ marginBottom: 20 }}>
                      <h4
                        style={{
                          marginBottom: 8,
                          fontSize: 16,
                          fontWeight: 500,
                          backgroundColor: "#f0f9ff",
                          padding: "6px 12px",
                          borderRadius: 4,
                        }}
                      >
                        Ma trận chuẩn hóa:
                      </h4>
                      <div style={{ overflowX: "auto" }}>
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            border: "2px solid #94a3b8",
                          }}
                        >
                          <thead>
                            <tr style={{ background: "#f1f5f9" }}>
                              <th
                                style={{
                                  padding: "8px 12px",
                                  border: "1px solid #94a3b8",
                                  minWidth: 120,
                                  position: "sticky",
                                  left: 0,
                                  background: "#f1f5f9",
                                  zIndex: 1,
                                }}
                              ></th>
                              {priorityItems.map((item) => (
                                <th
                                  key={item.laptop_id}
                                  style={{
                                    padding: "8px 12px",
                                    border: "1px solid #94a3b8",
                                    minWidth: 120,
                                  }}
                                >
                                  {item.laptop_name}
                                </th>
                              ))}
                              <th
                                style={{
                                  padding: "8px 12px",
                                  border: "1px solid #94a3b8",
                                  background: "#dbeafe",
                                }}
                              >
                                Trọng số
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {normalized.map((row, i) => (
                              <tr
                                key={i}
                                style={{
                                  background: i % 2 === 0 ? "#fff" : "#f8fafc",
                                }}
                              >
                                <th
                                  style={{
                                    padding: "8px 12px",
                                    border: "1px solid #94a3b8",
                                    textAlign: "left",
                                    fontWeight: 500,
                                    position: "sticky",
                                    left: 0,
                                    background:
                                      i % 2 === 0 ? "#fff" : "#f8fafc",
                                    zIndex: 1,
                                  }}
                                >
                                  {priorityItems[i]?.laptop_name ||
                                    `Laptop ${i + 1}`}
                                </th>
                                {row.map((cell, j) => (
                                  <td
                                    key={j}
                                    style={{
                                      padding: "8px 12px",
                                      border: "1px solid #94a3b8",
                                      textAlign: "center",
                                    }}
                                  >
                                    {cell.toFixed(4)}
                                  </td>
                                ))}
                                <td
                                  style={{
                                    padding: "8px 12px",
                                    border: "1px solid #94a3b8",
                                    textAlign: "center",
                                    fontWeight: 600,
                                    background: "#dbeafe",
                                  }}
                                >
                                  {priorityItems[i].weight.toFixed(4)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Vector nhất quán */}
                  {consistencyVector && priorityItems && (
                    <div style={{ marginBottom: 20 }}>
                      <h4
                        style={{
                          marginBottom: 8,
                          fontSize: 16,
                          fontWeight: 500,
                          backgroundColor: "#f0f9ff",
                          padding: "6px 12px",
                          borderRadius: 4,
                        }}
                      >
                        Vector nhất quán:
                      </h4>
                      <div style={{ overflowX: "auto" }}>
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            border: "2px solid #94a3b8",
                          }}
                        >
                          <thead>
                            <tr style={{ background: "#f1f5f9" }}>
                              <th
                                style={{
                                  padding: "8px 12px",
                                  border: "1px solid #94a3b8",
                                  width: "40%",
                                }}
                              >
                                Laptop
                              </th>
                              <th
                                style={{
                                  padding: "8px 12px",
                                  border: "1px solid #94a3b8",
                                  width: "30%",
                                }}
                              >
                                Trọng số (w)
                              </th>
                              <th
                                style={{
                                  padding: "8px 12px",
                                  border: "1px solid #94a3b8",
                                  width: "30%",
                                }}
                              >
                                Vector nhất quán (λ)
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {consistencyVector.map((value, i) => (
                              <tr
                                key={i}
                                style={{
                                  background: i % 2 === 0 ? "#fff" : "#f8fafc",
                                }}
                              >
                                <td
                                  style={{
                                    padding: "8px 12px",
                                    border: "1px solid #94a3b8",
                                  }}
                                >
                                  {priorityItems[i]?.laptop_name ||
                                    `Laptop ${i + 1}`}
                                </td>
                                <td
                                  style={{
                                    padding: "8px 12px",
                                    border: "1px solid #94a3b8",
                                    textAlign: "center",
                                  }}
                                >
                                  {priorityItems[i]?.weight.toFixed(4) || "-"}
                                </td>
                                <td
                                  style={{
                                    padding: "8px 12px",
                                    border: "1px solid #94a3b8",
                                    textAlign: "center",
                                  }}
                                >
                                  {value.toFixed(4)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div
                        style={{
                          padding: "8px 12px",
                          fontSize: 14,
                          marginTop: 8,
                          background: "#f8fafc",
                          border: "1px solid #94a3b8",
                          borderRadius: 4,
                        }}
                      >
                        <p style={{ margin: "4px 0" }}>
                          <span style={{ fontWeight: 500 }}>Ghi chú:</span>{" "}
                          Vector nhất quán λ được tính bằng cách nhân ma trận
                          gốc với vector trọng số và chia cho trọng số tương
                          ứng.
                        </p>
                        <p style={{ margin: "4px 0" }}>
                          <span style={{ fontWeight: 500 }}>
                            λ<sub>max</sub>:
                          </span>{" "}
                          Là giá trị trung bình của các phần tử trong vector
                          nhất quán: {lambdaMax?.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Vector ưu tiên */}
                  {priorityItems && (
                    <div style={{ marginBottom: 20 }}>
                      <h4
                        style={{
                          marginBottom: 8,
                          fontSize: 16,
                          fontWeight: 500,
                          backgroundColor: "#f0f9ff",
                          padding: "6px 12px",
                          borderRadius: 4,
                        }}
                      >
                        Vector ưu tiên cho tiêu chí {criterion}:
                      </h4>

                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 20 }}
                      >
                        {/* Bảng trọng số */}
                        <div style={{ flex: "1", minWidth: "300px" }}>
                          <div style={{ overflowX: "auto" }}>
                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                border: "2px solid #94a3b8",
                              }}
                            >
                              <thead>
                                <tr style={{ background: "#f1f5f9" }}>
                                  <th
                                    style={{
                                      padding: "8px 12px",
                                      border: "1px solid #94a3b8",
                                    }}
                                  >
                                    Laptop
                                  </th>
                                  <th
                                    style={{
                                      padding: "8px 12px",
                                      border: "1px solid #94a3b8",
                                      textAlign: "center",
                                    }}
                                  >
                                    Trọng số
                                  </th>
                                  <th
                                    style={{
                                      padding: "8px 12px",
                                      border: "1px solid #94a3b8",
                                      textAlign: "center",
                                    }}
                                  >
                                    Phần trăm
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {priorityItems
                                  .sort((a, b) => b.weight - a.weight)
                                  .map((item) => (
                                    <tr key={item.laptop_id}>
                                      <td
                                        style={{
                                          padding: "8px 12px",
                                          border: "1px solid #94a3b8",
                                        }}
                                      >
                                        {item.laptop_name}
                                      </td>
                                      <td
                                        style={{
                                          padding: "8px 12px",
                                          border: "1px solid #94a3b8",
                                          textAlign: "center",
                                        }}
                                      >
                                        {item.weight.toFixed(4)}
                                      </td>
                                      <td
                                        style={{
                                          padding: "8px 12px",
                                          border: "1px solid #94a3b8",
                                          textAlign: "center",
                                          fontWeight: 500,
                                        }}
                                      >
                                        {(item.weight * 100).toFixed(2)}%
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Biểu đồ tròn */}
                        <div
                          style={{ flex: "1", minWidth: "300px", height: 250 }}
                        >
                          <Pie
                            data={{
                              labels: priorityItems.map(
                                (item) => item.laptop_name
                              ),
                              datasets: [
                                {
                                  data: priorityItems.map(
                                    (item) => item.weight
                                  ),
                                  backgroundColor: [
                                    "#3b82f6",
                                    "#ef4444",
                                    "#22c55e",
                                    "#eab308",
                                    "#a855f7",
                                    "#ec4899",
                                    "#0ea5e9",
                                    "#f97316",
                                    "#14b8a6",
                                    "#8b5cf6",
                                  ],
                                },
                              ],
                            }}
                            options={{
                              plugins: {
                                tooltip: {
                                  callbacks: {
                                    label: (context) => {
                                      const value = context.raw as number;
                                      return `${(value * 100).toFixed(2)}%`;
                                    },
                                  },
                                },
                                legend: {
                                  position: "right",
                                  labels: {
                                    font: {
                                      size: 11,
                                    },
                                    boxWidth: 12,
                                  },
                                },
                              },
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </>
      )}
    </div>
  );
}

export default RecommendationResults;
