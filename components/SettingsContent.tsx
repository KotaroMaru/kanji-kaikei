"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { Group, Member } from "@/lib/types";
import GroupModal from "./GroupModal";
import Toast from "./Toast";
import { useToast } from "@/lib/useToast";
import { PencilIcon, TrashIcon, PlusIcon } from "./Icons";

export default function SettingsContent() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [newMemberName, setNewMemberName] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const { toasts, showToast, removeToast } = useToast();
  const supabase = createClient();
  const newMemberInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    const [{ data: groupsData }, { data: membersData }] = await Promise.all([
      supabase.from("groups").select("*").order("created_at"),
      supabase.from("members").select("*").order("created_at"),
    ]);
    setGroups(groupsData ?? []);
    setMembers(membersData ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── グループ管理 ──────────────────────────────────────────────────────

  const handleGroupSave = async (data: { name: string }) => {
    if (editingGroup) {
      const { error } = await supabase
        .from("groups")
        .update({ name: data.name })
        .eq("id", editingGroup.id);
      if (error) { showToast("更新に失敗しました", "error"); return; }
      setGroups((prev) =>
        prev.map((g) => (g.id === editingGroup.id ? { ...g, name: data.name } : g))
      );
    } else {
      const { data: inserted, error } = await supabase
        .from("groups")
        .insert({ name: data.name, amount: 0 })
        .select()
        .single();
      if (error || !inserted) { showToast("追加に失敗しました", "error"); return; }
      setGroups((prev) => [...prev, inserted]);
    }
  };

  const handleGroupDelete = async (group: Group) => {
    const count = members.filter((m) => m.group_id === group.id).length;
    if (count > 0) {
      alert(
        `「${group.name}」には ${count}人 の参加者がいます。\n先に参加者のグループを変更するか削除してください。`
      );
      return;
    }
    if (!confirm(`グループ「${group.name}」を削除しますか？`)) return;
    const { error } = await supabase.from("groups").delete().eq("id", group.id);
    if (error) { showToast("削除に失敗しました", "error"); return; }
    setGroups((prev) => prev.filter((g) => g.id !== group.id));
  };

  // ─── メンバー管理 ──────────────────────────────────────────────────────

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newMemberName.trim();
    if (!name) return;
    setAddingMember(true);
    const { data: inserted, error } = await supabase
      .from("members")
      .insert({ name, group_id: null })
      .select()
      .single();
    setAddingMember(false);
    if (error || !inserted) { showToast("追加に失敗しました", "error"); return; }
    setMembers((prev) => [...prev, inserted]);
    setNewMemberName("");
    newMemberInputRef.current?.focus();
  };

  const handleMemberGroupChange = async (memberId: string, groupId: string | null) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, group_id: groupId } : m))
    );
    const { error } = await supabase
      .from("members")
      .update({ group_id: groupId })
      .eq("id", memberId);
    if (error) {
      showToast("更新に失敗しました", "error");
      fetchData();
    }
  };

  const handleMemberDelete = async (member: Member) => {
    if (!confirm(`「${member.name}」を削除しますか？`)) return;
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    const { error } = await supabase.from("members").delete().eq("id", member.id);
    if (error) {
      showToast("削除に失敗しました", "error");
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ─── セクション1: グループ管理 ───────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">グループ管理</h2>
          <button
            onClick={() => { setEditingGroup(null); setGroupModalOpen(true); }}
            className="flex items-center gap-1 text-sm font-medium text-sakura-600 hover:text-sakura-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            追加
          </button>
        </div>

        {groups.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-sakura-100 overflow-hidden">
            <div className="divide-y divide-slate-50">
              {groups.map((group) => {
                const count = members.filter((m) => m.group_id === group.id).length;
                return (
                  <div key={group.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-slate-800">{group.name}</span>
                      <span className="ml-2 text-xs text-slate-400">{count}人</span>
                    </div>
                    <button
                      onClick={() => { setEditingGroup(group); setGroupModalOpen(true); }}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-sakura-500 hover:bg-sakura-50 transition-colors"
                      title="編集"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleGroupDelete(group)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="削除"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-sakura-200 py-8 text-center text-slate-400 text-sm">
            グループがありません
          </div>
        )}
      </section>

      {/* ─── セクション2: メンバー管理 ───────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">メンバー管理</h2>

        {/* Inline add form */}
        <form onSubmit={handleAddMember} className="flex gap-2 mb-3">
          <input
            ref={newMemberInputRef}
            type="text"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            placeholder="名前を入力"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sakura-400 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={addingMember || !newMemberName.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-sakura-600 rounded-lg hover:bg-sakura-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
          >
            <PlusIcon className="w-4 h-4" />
            追加
          </button>
        </form>

        {members.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-sakura-100 overflow-hidden">
            <div className="divide-y divide-slate-50">
              {members.map((member) => (
                <div key={member.id} className="px-4 py-2.5 flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-800 flex-1 min-w-0 truncate">
                    {member.name}
                  </span>
                  <select
                    value={member.group_id ?? ""}
                    onChange={(e) =>
                      handleMemberGroupChange(member.id, e.target.value || null)
                    }
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-sakura-400 bg-white max-w-[140px]"
                  >
                    <option value="">未設定</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleMemberDelete(member)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                    title="削除"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-sakura-200 py-8 text-center text-slate-400 text-sm">
            メンバーがいません
          </div>
        )}
      </section>

      <GroupModal
        isOpen={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        onSave={handleGroupSave}
        group={editingGroup}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
