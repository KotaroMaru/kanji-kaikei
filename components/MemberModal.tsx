"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { Group, Member } from "@/lib/types";

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    group_id: string;
    custom_amount: number | null;
  }) => Promise<void>;
  groups: Group[];
  member?: Member | null;
}

export default function MemberModal({
  isOpen,
  onClose,
  onSave,
  groups,
  member,
}: MemberModalProps) {
  const [name, setName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (member) {
        setName(member.name);
        setGroupId(member.group_id ?? "");
        if (member.custom_amount !== null) {
          setUseCustom(true);
          setCustomAmount(String(member.custom_amount));
        } else {
          setUseCustom(false);
          setCustomAmount("");
        }
      } else {
        setName("");
        setGroupId(groups[0]?.id ?? "");
        setCustomAmount("");
        setUseCustom(false);
      }
    }
  }, [isOpen, member, groups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !groupId) return;
    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        group_id: groupId,
        custom_amount: useCustom && customAmount !== "" ? Number(customAmount) : null,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={member ? "参加者を編集" : "参加者を追加"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">名前</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="山田 太郎"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">グループ</label>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}（¥{g.amount.toLocaleString()}）
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <input
              type="checkbox"
              checked={useCustom}
              onChange={(e) => setUseCustom(e.target.checked)}
              className="rounded"
            />
            個別の金額を設定する
          </label>
          {useCustom && (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">¥</span>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="3000"
                min={0}
                className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
