"use client";

import { useEffect, useState } from "react";

export interface ToastItem {
  id: string;
  message: string;
  type: "error" | "success" | "info";
}

interface ToastProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((t) => (
        <ToastBubble key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastBubble({
  toast,
  onRemove,
}: {
  toast: ToastItem;
  onRemove: (id: string) => void;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, 2800);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const bg =
    toast.type === "error"
      ? "bg-red-500"
      : toast.type === "success"
      ? "bg-green-600"
      : "bg-sakura-600";

  return (
    <div
      className={`${bg} text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg pointer-events-auto transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      {toast.message}
    </div>
  );
}
