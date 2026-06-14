"use client";

import { createContext, useContext, useState, useCallback } from "react";

export interface Toast {
  id: string;
  type: "success" | "error";
  message: string;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (type: Toast["type"], message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: Toast["type"], message: string) => {
      const id = typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now());
      setToasts((prev) => [{ id, type, message }, ...prev]);
      if (type === "success") {
        setTimeout(() => removeToast(id), 3000);
      }
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const { addToast } = useContext(ToastContext);
  return {
    success: (message: string) => addToast("success", message),
    error: (message: string) => addToast("error", message),
  };
}

export function useToasts() {
  return useContext(ToastContext);
}
