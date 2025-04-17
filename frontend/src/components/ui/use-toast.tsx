// src/components/ui/use-toast/index.tsx

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "warning" | "destructive";
  duration?: number;
}

export const toast = (options: ToastOptions) => {
  const toastContainer = document.getElementById("toast-container");
  
  if (!toastContainer) {
    // Tạo container nếu chưa có
    const container = document.createElement("div");
    container.id = "toast-container";
    container.style.position = "fixed";
    container.style.top = "20px";
    container.style.right = "20px";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "10px";
    container.style.zIndex = "9999";
    document.body.appendChild(container);
  }
  
  // Tạo toast element
  const toastElement = document.createElement("div");
  toastElement.className = `toast-item ${options.variant || "default"}`;
  toastElement.style.padding = "16px";
  toastElement.style.borderRadius = "8px";
  toastElement.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
  toastElement.style.background = options.variant === "warning" ? "#FEF3C7" : 
                                  options.variant === "destructive" ? "#FEE2E2" : 
                                  "#FFFFFF";
  toastElement.style.border = "1px solid";
  toastElement.style.borderColor = options.variant === "warning" ? "#F59E0B" : 
                                  options.variant === "destructive" ? "#EF4444" : 
                                  "#E5E7EB";
  
  toastElement.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 4px; color: ${
      options.variant === "warning" ? "#B45309" : 
      options.variant === "destructive" ? "#B91C1C" : 
      "#1F2937"
    }">${options.title || ""}</div>
    <div style="color: ${
      options.variant === "warning" ? "#92400E" : 
      options.variant === "destructive" ? "#991B1B" : 
      "#4B5563"
    }">${options.description || ""}</div>
  `;
  
  document.getElementById("toast-container")?.appendChild(toastElement);
  
  // Auto remove
  setTimeout(() => {
    toastElement.style.opacity = "0";
    toastElement.style.transform = "translateX(100%)";
    toastElement.style.transition = "all 0.3s ease-out";
    setTimeout(() => {
      toastElement.remove();
    }, 300);
  }, options.duration || 3000);
};

// Hook để sử dụng toast trong components
export function useToast() {
  return { toast };
}