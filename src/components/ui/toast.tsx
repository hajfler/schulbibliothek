"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = React.createContext<ToastContextValue>({ addToast: () => {} });

export function useToast() {
  return React.useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const icons = {
    success: <CheckCircle size={18} className="text-[#34C759]" />,
    error: <XCircle size={18} className="text-[#FF3B30]" />,
    warning: <AlertCircle size={18} className="text-[#FF9500]" />,
    info: <Info size={18} className="text-[#007AFF]" />,
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg",
        "bg-white border border-[#E5E5EA] min-w-[280px] max-w-sm",
        "animate-in slide-in-from-right-8 fade-in duration-300"
      )}
    >
      {icons[toast.type]}
      <p className="text-[14px] font-medium text-[#1C1C1E] flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-[#C7C7CC] hover:text-[#8E8E93] transition-colors"
      >
        <X size={15} />
      </button>
    </div>
  );
}
