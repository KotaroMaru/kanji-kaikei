"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { Group } from "@/lib/types";

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string }) => Promise<void>;
  group?: Group | null;
}

export default function GroupModal({ isOpen, onClose, onSave, group }: GroupModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(group ? group.name : "");
    }
  }, [isOpen, group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSave({ name: name.trim() });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={group ? "グループを編集" : "グループを追加"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">グループ名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 高校生バイト"
            autoFocus
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sakura-400 focus:border-transparent"
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
