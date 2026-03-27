"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { Group, MemberWithGroup, Expense } from "@/lib/types";
import Toast from "./Toast";
import { useToast } from "@/lib/useToast";

function getEffectiveAmount(member: MemberWithGroup, groups: Group[]): number {
  if (!member.is_attending) return 0;
  if (member.custom_amount !== null) return member.custom_amount;
  const g = groups.find((g) => g.id === member.group_id);
  return g?.amount ?? 0;
}

// ─── インライン編集セル（グループ金額用）────────────────────────────────
function EditableAmountCell({
  value,
  onSave,
}: {
  value: number;
  onSave: (v: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  const commit = async () => {
    setEditing(false);
    const num = Number(draft);
    if (!isNaN(num) && num !== value) {
      await onSave(num);
    }
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-sm font-medium text-slate-700 hover:text-sakura-600 hover:bg-sakura-50 px-2.5 py-1 rounded-lg transition-colors border border-transparent hover:border-sakura-200"
        title="クリックして編集"
      >
        {value.toLocaleString()}円
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      type="number"
      min={0}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
      className="w-28 border border-sakura-400 rounded-lg px-2.5 py-1 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sakura-400 text-right"
    />
  );
}

// ─── 個人金額 input ──────────────────────────────────────────────────────
function MemberAmountInput({
  member,
  groupAmount,
  onSave,
}: {
  member: MemberWithGroup;
  groupAmount: number;
  onSave: (memberId: string, amount: number | null) => Promise<void>;
}) {
  const [draft, setDraft] = useState(
    member.custom_amount !== null ? String(member.custom_amount) : ""
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(member.custom_amount !== null ? String(member.custom_amount) : "");
  }, [member.custom_amount]);

  const commit = async () => {
    const trimmed = draft.trim();
    if (trimmed === "") {
      if (member.custom_amount !== null) await onSave(member.id, null);
    } else {
      const num = Number(trimmed);
      if (!isNaN(num) && num !== member.custom_amount) {
        await onSave(member.id, num);
      }
    }
  };

  const hasCustom = draft.trim() !== "";

  return (
    <input
      ref={inputRef}
      type="number"
      min={0}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") inputRef.current?.blur(); }}
      placeholder={String(groupAmount)}
      className={`w-24 border rounded-lg px-2.5 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-sakura-400 transition-colors ${
        hasCustom
          ? "border-sakura-300 bg-white text-slate-800"
          : "border-slate-200 bg-slate-100 text-slate-400"
      }`}
    />
  );
}

// ─── メインコンポーネント ────────────────────────────────────────────────
export default function AccountingContent() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<MemberWithGroup[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { toasts, showToast, removeToast } = useToast();
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const [
      { data: groupsData },
      { data: membersData },
      { data: expensesData },
    ] = await Promise.all([
      supabase.from("groups").select("*").order("created_at"),
      supabase.from("members").select("*, groups(*)").order("created_at"),
      supabase.from("expenses").select("*").order("created_at"),
    ]);
    setGroups(groupsData ?? []);
    setMembers((membersData as MemberWithGroup[]) ?? []);
    setExpenses(expensesData ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
    const ch1 = supabase
      .channel("accounting-groups")
      .on("postgres_changes", { event: "*", schema: "public", table: "groups" }, fetchData)
      .subscribe();
    const ch2 = supabase
      .channel("accounting-members")
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, fetchData)
      .subscribe();
    const ch3 = supabase
      .channel("accounting-expenses")
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, fetchData)
      .subscribe();
    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
      supabase.removeChannel(ch3);
    };
  }, [fetchData, supabase]);

  const handleGroupAmountSave = async (groupId: string, amount: number) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, amount } : g))
    );
    const { error } = await supabase
      .from("groups")
      .update({ amount })
      .eq("id", groupId);
    if (error) {
      showToast("グループ金額の更新に失敗しました", "error");
      fetchData();
    }
  };

  const handleMemberAmountSave = async (memberId: string, amount: number | null) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, custom_amount: amount } : m))
    );
    const { error } = await supabase
      .from("members")
      .update({ custom_amount: amount })
      .eq("id", memberId);
    if (error) {
      showToast("金額の更新に失敗しました", "error");
      fetchData();
    }
  };

  // ─── 会計計算 ────────────────────────────────────────────────────────
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const attendingMembers = members.filter((m) => m.is_attending);
  const expectedCollection = attendingMembers.reduce(
    (s, m) => s + getEffectiveAmount(m, groups),
    0
  );
  const diff = expectedCollection - totalExpenses;
  const paidAmount = members
    .filter((m) => m.is_attending && m.is_paid)
    .reduce((s, m) => s + getEffectiveAmount(m, groups), 0);
  const paidCount = attendingMembers.filter((m) => m.is_paid).length;
  const paymentProgress =
    expectedCollection > 0 ? (paidAmount / expectedCollection) * 100 : 0;

  const groupedMembers = groups.map((group) => ({
    group,
    members: members.filter((m) => m.group_id === group.id),
  }));
  const ungroupedMembers = members.filter((m) => !m.group_id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        読み込み中...
      </div>
    );
  }

  const sectionLabel = "text-xs font-semibold text-sakura-700 uppercase tracking-wide mb-2 px-1";

  return (
    <div className="space-y-6">

      {/* ─── 上部: グループ金額テーブル ─────────────────────────────── */}
      {groups.length > 0 && (
        <section>
          <p className={sectionLabel}>グループ金額</p>
          <div className="bg-white rounded-xl shadow-sm border border-sakura-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sakura-100 bg-sakura-50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-sakura-600">
                    グループ名
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-sakura-600">
                    一人あたり金額
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {groups.map((group) => (
                  <tr key={group.id}>
                    <td className="px-4 py-3 text-sm text-slate-700">{group.name}</td>
                    <td className="px-4 py-3 text-right">
                      <EditableAmountCell
                        value={group.amount}
                        onSave={(v) => handleGroupAmountSave(group.id, v)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-2 text-xs text-slate-400 border-t border-slate-50">
              金額部分をクリックすると直接編集できます
            </p>
          </div>
        </section>
      )}

      {/* ─── 中部: 個人別金額 ────────────────────────────────────────── */}
      {members.length > 0 && (
        <section>
          <p className={sectionLabel}>個人別金額</p>
          <div className="space-y-3">
            {groupedMembers.map(
              ({ group, members: groupMembers }) =>
                groupMembers.length > 0 && (
                  <div
                    key={group.id}
                    className="bg-white rounded-xl shadow-sm border border-sakura-100 overflow-hidden"
                  >
                    <div className="px-4 py-2.5 bg-sakura-50 border-b border-sakura-100">
                      <span className="text-sm font-semibold text-sakura-700">
                        {group.name}
                      </span>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {groupMembers.map((member) => (
                        <div
                          key={member.id}
                          className={`px-4 py-2.5 flex items-center gap-3 ${
                            !member.is_attending ? "opacity-40" : ""
                          }`}
                        >
                          <span className="flex-1 text-sm text-slate-700">
                            {member.name}
                            {!member.is_attending && (
                              <span className="ml-1.5 text-xs text-slate-400">（欠席）</span>
                            )}
                          </span>
                          <MemberAmountInput
                            member={member}
                            groupAmount={group.amount}
                            onSave={handleMemberAmountSave}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )
            )}
            {ungroupedMembers.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-sakura-100 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                  <span className="text-sm font-medium text-slate-500">グループ未設定</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {ungroupedMembers.map((member) => (
                    <div
                      key={member.id}
                      className={`px-4 py-2.5 flex items-center gap-3 ${
                        !member.is_attending ? "opacity-40" : ""
                      }`}
                    >
                      <span className="flex-1 text-sm text-slate-700">
                        {member.name}
                        {!member.is_attending && (
                          <span className="ml-1.5 text-xs text-slate-400">（欠席）</span>
                        )}
                      </span>
                      <MemberAmountInput
                        member={member}
                        groupAmount={0}
                        onSave={handleMemberAmountSave}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <p className="mt-1.5 px-1 text-xs text-slate-400">
            グレー＝グループ金額を使用　／　ピンク枠＝個人金額を設定中。空欄で保存するとグループ金額に戻ります。
          </p>
        </section>
      )}

      {groups.length === 0 && members.length === 0 && (
        <div className="text-center py-16 text-slate-400 text-sm">
          設定ページでグループとメンバーを追加してください
        </div>
      )}

      {/* ─── 下部: 会計サマリー ──────────────────────────────────────── */}
      {(totalExpenses > 0 || expectedCollection > 0) && (
        <section>
          <p className={sectionLabel}>会計サマリー</p>

          {/* Budget alert */}
          {totalExpenses > 0 && (
            <div
              className={`rounded-xl p-4 text-sm font-medium mb-3 ${
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

          {/* Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-sakura-100 p-5 space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-slate-500 mb-1">総費用</div>
                <div className="text-xl font-bold text-slate-800">
                  ¥{totalExpenses.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">回収予定</div>
                <div className="text-xl font-bold text-sakura-600">
                  ¥{expectedCollection.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">差額</div>
                <div
                  className={`text-xl font-bold ${
                    diff >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {diff >= 0 ? "+" : ""}¥{diff.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="pt-2 border-t border-sakura-50 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  支払い進捗（{paidCount} / {attendingMembers.length}人）
                </span>
                <span>
                  ¥{paidAmount.toLocaleString()} / ¥{expectedCollection.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-sakura-100 rounded-full h-2.5">
                <div
                  className="bg-sakura-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                />
              </div>
              <div className="text-xs text-slate-400 text-right">
                {paymentProgress.toFixed(0)}% 回収済み
              </div>
            </div>
          </div>
        </section>
      )}

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
