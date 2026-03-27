"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { Expense } from "@/lib/types";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; amount: number; paid_by: string }) => Promise<void>;
  expense?: Expense | null;
}

export default function ExpenseModal({ isOpen, onClose, onSave, expense }: ExpenseModalProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        setTitle(expense.title);
        setAmount(String(expense.amount));
        setPaidBy(expense.paid_by);
      } else {
        setTitle("");
        setAmount("");
        setPaidBy("");
      }
    }
  }, [isOpen, expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || !paidBy.trim()) return;
    setLoading(true);
    try {
      await onSave({ title: title.trim(), amount: Number(amount), paid_by: paidBy.trim() });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sakura-400 focus:border-transparent";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={expense ? "費用を編集" : "費用を追加"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">タイトル</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="飲食代"
            autoFocus
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">金額</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">¥</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="15000"
              min={0}
              className={`${inputClass} pl-7`}
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">立替者</label>
          <input
            type="text"
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            placeholder="田中 幹事"
            className={inputClass}
            required
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-sakura-600 rounded-lg hover:bg-sakura-700 transition-colors disabled:opacity-50"
          >
            {loading ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
