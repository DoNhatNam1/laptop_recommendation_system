import * as fs from "fs";
import * as XLSX from "xlsx";
import * as path from "path";

interface Comparison {
  row: string;
  column: string;
  value: string | number;
}

interface LaptopComparisons {
  [criterion: string]: Comparison[];
}

interface MatrixData {
  [row: string]: {
    [column: string]: number;
  };
}

/**
 * Tạo ma trận số từ mảng so sánh
 * @param comparisons - Mảng các so sánh cặp
 * @returns Ma trận với các giá trị đã tính
 */
function createMatrixFromComparisons(comparisons: Comparison[]): { matrix: MatrixData; labels: string[] } {
  // Tìm tất cả các nhãn duy nhất
  const labels = new Set<string>();
  comparisons.forEach((comp) => {
    labels.add(comp.row);
    labels.add(comp.column);
  });
  const uniqueLabels = Array.from(labels);

  // Tạo ma trận với giá trị 1 ở đường chéo chính
  const matrix: MatrixData = {};
  uniqueLabels.forEach((row) => {
    matrix[row] = {};
    uniqueLabels.forEach((col) => {
      matrix[row][col] = row === col ? 1 : 0;
    });
  });

  // Điền giá trị vào ma trận
  comparisons.forEach((comp) => {
    const { row, column, value } = comp;

    // Chuyển đổi phân số thành số thực
    let numValue: number;
    if (typeof value === "string" && value.includes("/")) {
      const [numerator, denominator] = value.split("/").map(Number);
      numValue = numerator / denominator;
    } else {
      numValue = Number(value);
    }

    matrix[row][column] = numValue;

    // Điền giá trị nghịch đảo vào ô đối xứng
    const reciprocalValue = 1 / numValue;
    matrix[column][row] = reciprocalValue;
  });

  return { matrix, labels: uniqueLabels };
}

/**
 * Tạo worksheet từ ma trận so sánh
 * @param matrix - Ma trận dữ liệu
 * @param labels - Các nhãn (hàng/cột)
 * @returns Worksheet đã được định dạng
 */
function createWorksheetFromMatrix(matrix: MatrixData, labels: string[]): XLSX.WorkSheet {
  // Chuẩn bị dữ liệu cho Excel
  const data: (string | number)[][] = [];

  // Hàng đầu tiên: tiêu đề các cột
  const headerRow = [""];
  labels.forEach((label) => {
    headerRow.push(label);
  });
  data.push(headerRow);

  // Các hàng dữ liệu
  labels.forEach((row) => {
    const dataRow: (string | number)[] = [row];
    labels.forEach((col) => {
      dataRow.push(matrix[row][col]);
    });
    data.push(dataRow);
  });

  // Tạo worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Định dạng số
  for (let i = 1; i <= labels.length; i++) {
    const colLetter = XLSX.utils.encode_col(i);
    for (let r = 1; r <= labels.length; r++) {
      const cellRef = colLetter + (r + 1);
      if (!ws[cellRef]) continue;

      // Định dạng số
      if (typeof ws[cellRef].v === "number") {
        ws[cellRef].z = ws[cellRef].v === Math.round(ws[cellRef].v) ? "0" : "0.000";
      }
    }
  }

  return ws;
}

/**
 * Chuyển đổi dữ liệu thành Excel
 * @param inputData - Dữ liệu đầu vào (cả 2 định dạng)
 * @param outputPath - Đường dẫn file Excel đầu ra
 */
function convertToExcel(inputData: any, outputPath: string): void {
  // Tạo workbook
  const wb = XLSX.utils.book_new();

  if ("laptopComparisons" in inputData) {
    // Trường hợp 1: Nhiều ma trận so sánh laptop theo từng tiêu chí
    const laptopComparisons = inputData.laptopComparisons;
    
    console.log("Phát hiện định dạng so sánh laptop theo từng tiêu chí");
    console.log(`Số tiêu chí: ${Object.keys(laptopComparisons).length}`);
    
    // Xử lý từng tiêu chí
    for (const criterion in laptopComparisons) {
      const comparisons = laptopComparisons[criterion];
      const { matrix, labels } = createMatrixFromComparisons(comparisons);
      
      // Tạo worksheet
      const ws = createWorksheetFromMatrix(matrix, labels);
      
      // Thêm worksheet vào workbook với tên là tên tiêu chí
      XLSX.utils.book_append_sheet(wb, ws, criterion);
    }
  } else if ("comparisons" in inputData || (Array.isArray(inputData) && inputData.length > 0 && "row" in inputData[0])) {
    // Trường hợp 2: Ma trận so sánh tiêu chí
    console.log("Phát hiện định dạng so sánh tiêu chí");
    
    // Lấy mảng comparisons
    const comparisons = "comparisons" in inputData ? inputData.comparisons : inputData;
    
    // Tạo ma trận
    const { matrix, labels } = createMatrixFromComparisons(comparisons);
    
    // Tạo worksheet
    const ws = createWorksheetFromMatrix(matrix, labels);
    
    // Thêm worksheet vào workbook
    XLSX.utils.book_append_sheet(wb, ws, "Tiêu chí");
  } else {
    console.error("Định dạng dữ liệu không được hỗ trợ!");
    process.exit(1);
  }

  // Ghi file Excel
  XLSX.writeFile(wb, outputPath);
  console.log(`Đã xuất file Excel thành công: ${outputPath}`);
}

/**
 * Hàm main để xử lý tham số dòng lệnh
 */
function main(): void {
  // Mặc định sẽ đọc file inputfile.json trong thư mục hiện tại
  const defaultInputPath = path.join(__dirname, "inputfile.json");
  
  // Tạo thư mục output nếu chưa tồn tại
  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    // Kiểm tra xem file input có tồn tại không
    if (!fs.existsSync(defaultInputPath)) {
      console.error(`File không tồn tại: ${defaultInputPath}`);
      process.exit(1);
    }
    
    // Đọc và phân tích file JSON
    const inputData = JSON.parse(fs.readFileSync(defaultInputPath, 'utf8'));
    
    // Xác định loại file output dựa trên nội dung
    let outputFileName: string;
    if ("laptopComparisons" in inputData) {
      outputFileName = "laptop_matrix.xlsx";
    } else if ("comparisons" in inputData || (Array.isArray(inputData) && inputData.length > 0 && "row" in inputData[0])) {
      outputFileName = "criteria_matrix.xlsx";
    } else {
      outputFileName = "matrix.xlsx";
    }
    
    // Tạo đường dẫn đầy đủ cho file output
    const outputPath = path.join(outputDir, outputFileName);
    
    // Chuyển đổi dữ liệu sang Excel
    convertToExcel(inputData, outputPath);
  } catch (error) {
    console.error("Lỗi:", error);
    process.exit(1);
  }
}

// Chạy chương trình nếu được gọi trực tiếp
if (require.main === module) {
  main();
}

export { convertToExcel };