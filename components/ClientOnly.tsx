"use client";

import { useEffect, useState } from "react";

export default function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        読み込み中...
      </div>
    );
  }

  return <>{children}</>;
}
