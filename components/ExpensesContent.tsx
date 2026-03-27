"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { Expense } from "@/lib/types";
import ExpenseModal from "./ExpenseModal";
import { PencilIcon, TrashIcon, PlusIcon } from "./Icons";
import Toast from "./Toast";
import { useToast } from "@/lib/useToast";

export default function ExpensesContent() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const { toasts, showToast, removeToast } = useToast();
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      showToast("データの取得に失敗しました", "error");
    } else {
      setExpenses(data ?? []);
    }
    setLoading(false);
  }, [supabase, showToast]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("expenses-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData, supabase]);

  const handleSave = async (data: { title: string; amount: number; paid_by: string }) => {
    if (editingExpense) {
      await supabase.from("expenses").update(data).eq("id", editingExpense.id);
    } else {
      await supabase.from("expenses").insert(data);
    }
    await fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この費用を削除しますか？")) return;
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      showToast("削除に失敗しました", "error");
      fetchData();
    }
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Total */}
      <div className="bg-white rounded-xl shadow-sm border border-sakura-100 p-5 text-center">
        <div className="text-xs text-slate-500 mb-1">費用合計</div>
        <div className="text-3xl font-bold text-slate-800">¥{total.toLocaleString()}</div>
        <div className="text-xs text-slate-400 mt-1">{expenses.length}件の費用</div>
      </div>

      {/* Add Button */}
      <button
        onClick={() => { setEditingExpense(null); setModalOpen(true); }}
        className="w-full py-3 rounded-xl border-2 border-dashed border-sakura-200 text-sakura-500 text-sm font-medium hover:bg-sakura-50 transition-colors flex items-center justify-center gap-1.5"
      >
        <PlusIcon className="w-4 h-4" />
        費用を追加
      </button>

      {/* Expense List */}
      {expenses.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-sakura-100 overflow-hidden">
          <div className="divide-y divide-slate-50">
            {expenses.map((expense) => (
              <div key={expense.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800">{expense.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>立替: {expense.paid_by}</span>
                    <span>·</span>
                    <span>
                      {new Date(expense.created_at).toLocaleDateString("ja-JP", {
                        month: "numeric",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">
                    ¥{expense.amount.toLocaleString()}
                  </span>
                  <button
                    onClick={() => { setEditingExpense(expense); setModalOpen(true); }}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-sakura-500 hover:bg-sakura-50 transition-colors"
                    title="編集"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="削除"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400 text-sm">
          費用がありません。上のボタンから追加してください。
        </div>
      )}

      <ExpenseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        expense={editingExpense}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
