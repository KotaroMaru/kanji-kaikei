"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { Group, Member, Expense } from "@/lib/types";

type MemberWithGroup = Member & { groups: Group };

function getMemberAmount(member: MemberWithGroup): number {
  if (!member.is_attending) return 0;
  return member.custom_amount !== null ? member.custom_amount : member.groups?.amount ?? 0;
}

export default function SummaryContent() {
  const [members, setMembers] = useState<MemberWithGroup[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const [{ data: membersData }, { data: expensesData }] = await Promise.all([
      supabase.from("members").select("*, groups(*)").order("created_at"),
      supabase.from("expenses").select("*").order("created_at"),
    ]);
    setMembers((membersData as MemberWithGroup[]) ?? []);
    setExpenses(expensesData ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
    const ch1 = supabase
      .channel("summary-members")
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, fetchData)
      .subscribe();
    const ch2 = supabase
      .channel("summary-expenses")
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, fetchData)
      .subscribe();
    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [fetchData, supabase]);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const attendingMembers = members.filter((m) => m.is_attending);
  const expectedCollection = attendingMembers.reduce((s, m) => s + getMemberAmount(m), 0);
  const diff = expectedCollection - totalExpenses;
  const paidAmount = members
    .filter((m) => m.is_attending && m.is_paid)
    .reduce((s, m) => s + getMemberAmount(m), 0);
  const paidCount = attendingMembers.filter((m) => m.is_paid).length;
  const paymentProgress = expectedCollection > 0 ? (paidAmount / expectedCollection) * 100 : 0;

  const paidByMap: Record<string, number> = {};
  expenses.forEach((e) => {
    paidByMap[e.paid_by] = (paidByMap[e.paid_by] ?? 0) + e.amount;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alert */}
      {totalExpenses > 0 && (
        <div
          className={`rounded-xl p-4 text-sm font-medium ${
            diff >= 0
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-600"
          }`}
        >
          {diff >= 0
            ? `予算が ¥${diff.toLocaleString()} 余っています`
            : `予算が ¥${Math.abs(diff).toLocaleString()} 不足しています`}
        </div>
      )}

      {/* Main Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">総費用</div>
          <div className="text-3xl font-bold text-slate-800">
            ¥{totalExpenses.toLocaleString()}
          </div>
        </div>
        <div className="h-px bg-slate-100" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-slate-500 mb-1">回収予定額</div>
            <div className="text-xl font-bold text-blue-600">
              ¥{expectedCollection.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">差額</div>
            <div className={`text-xl font-bold ${diff >= 0 ? "text-green-600" : "text-red-500"}`}>
              {diff >= 0 ? "+" : ""}¥{diff.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">支払い状況</h2>
        <div className="flex items-end justify-between">
          <div>
            <span className="text-2xl font-bold text-slate-800">{paidCount}</span>
            <span className="text-slate-400 text-sm"> / {attendingMembers.length}人</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-semibold text-slate-800">
              ¥{paidAmount.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400"> / ¥{expectedCollection.toLocaleString()}</span>
          </div>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(paymentProgress, 100)}%` }}
          />
        </div>
        <div className="text-xs text-slate-500 text-right">
          {paymentProgress.toFixed(0)}% 回収済み
        </div>
      </div>

      {/* Paid By Breakdown */}
      {Object.keys(paidByMap).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">立替者別精算</h2>
          <div className="space-y-1">
            {Object.entries(paidByMap).map(([person, amount]) => (
              <div
                key={person}
                className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
              >
                <span className="text-sm text-slate-700">{person}</span>
                <span className="text-sm font-semibold text-slate-800">
                  ¥{amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalExpenses === 0 && expectedCollection === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">
          費用・参加者を登録すると会計サマリーが表示されます
        </div>
      )}
    </div>
  );
}
