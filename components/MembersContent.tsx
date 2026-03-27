"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { Group, MemberWithGroup } from "@/lib/types";
import Toast from "./Toast";
import { useToast } from "@/lib/useToast";

function getMemberAmount(member: MemberWithGroup): number {
  if (!member.is_attending) return 0;
  if (member.custom_amount !== null) return member.custom_amount;
  return member.groups?.amount ?? 0;
}

export default function MembersContent() {
  const [members, setMembers] = useState<MemberWithGroup[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const { toasts, showToast, removeToast } = useToast();
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const [{ data: membersData, error: mErr }, { data: groupsData, error: gErr }] =
      await Promise.all([
        supabase.from("members").select("*, groups(*)").order("created_at"),
        supabase.from("groups").select("*").order("created_at"),
      ]);
    if (mErr || gErr) {
      showToast("データの取得に失敗しました", "error");
    } else {
      setMembers((membersData as MemberWithGroup[]) ?? []);
      setGroups(groupsData ?? []);
    }
    setLoading(false);
  }, [supabase, showToast]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("members-view")
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData, supabase]);

  const handleToggle = async (
    id: string,
    field: "is_attending" | "is_paid",
    value: boolean
  ) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
    const { error } = await supabase
      .from("members")
      .update({ [field]: value })
      .eq("id", id);
    if (error) {
      showToast("更新に失敗しました", "error");
      fetchData();
    }
  };

  const attendingMembers = members.filter((m) => m.is_attending);
  const paidCount = attendingMembers.filter((m) => m.is_paid).length;

  const groupedMembers = groups.map((group) => ({
    group,
    members: members.filter((m) => m.group_id === group.id),
  }));
  const ungrouped = members.filter((m) => !m.group_id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="bg-white rounded-xl shadow-sm border border-sakura-100 p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-sakura-600">{members.length}</div>
            <div className="text-xs text-slate-500 mt-0.5">登録人数</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-700">{attendingMembers.length}</div>
            <div className="text-xs text-slate-500 mt-0.5">出席人数</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{paidCount}</div>
            <div className="text-xs text-slate-500 mt-0.5">支払済み</div>
          </div>
        </div>
      </div>

      {/* Grouped lists */}
      {groupedMembers.map(
        ({ group, members: groupMembers }) =>
          groupMembers.length > 0 && (
            <MemberSection
              key={group.id}
              title={group.name}
              badge={`¥${group.amount.toLocaleString()}`}
              members={groupMembers}
              onToggle={handleToggle}
            />
          )
      )}

      {ungrouped.length > 0 && (
        <MemberSection
          title="グループ未設定"
          members={ungrouped}
          onToggle={handleToggle}
        />
      )}

      {members.length === 0 && (
        <div className="text-center py-16 text-slate-400 text-sm">
          参加者がいません。設定ページから追加してください。
        </div>
      )}

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

function MemberSection({
  title,
  badge,
  members,
  onToggle,
}: {
  title: string;
  badge?: string;
  members: MemberWithGroup[];
  onToggle: (id: string, field: "is_attending" | "is_paid", value: boolean) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-sakura-100 overflow-hidden">
      <div className="px-4 py-2.5 bg-sakura-50 border-b border-sakura-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-sakura-700">{title}</h2>
        {badge && (
          <span className="text-xs text-sakura-600 bg-white px-2 py-0.5 rounded-full border border-sakura-200 font-medium">
            {badge}
          </span>
        )}
      </div>
      <div className="divide-y divide-slate-50">
        {members.map((member) => {
          const amount = getMemberAmount(member);
          return (
            <div
              key={member.id}
              className={`px-4 py-3 flex items-center gap-3 transition-opacity ${
                !member.is_attending ? "opacity-40" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-medium text-slate-800">{member.name}</span>
                  {member.is_paid && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                      支払済
                    </span>
                  )}
                  {!member.is_attending && (
                    <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">
                      欠席
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {member.is_attending ? (
                    <>
                      ¥{amount.toLocaleString()}
                      {member.custom_amount !== null && (
                        <span className="ml-1 text-sakura-500">（個別設定）</span>
                      )}
                    </>
                  ) : (
                    "欠席のため0円"
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => onToggle(member.id, "is_attending", !member.is_attending)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    member.is_attending
                      ? "bg-sakura-100 text-sakura-700 hover:bg-sakura-200"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {member.is_attending ? "出席" : "欠席"}
                </button>
                <button
                  onClick={() => onToggle(member.id, "is_paid", !member.is_paid)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    member.is_paid
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {member.is_paid ? "済" : "未払"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
