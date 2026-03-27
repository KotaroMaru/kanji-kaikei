"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UsersIcon, BanknoteIcon, ChartBarIcon, CogIcon, SakuraIcon } from "./Icons";

const tabs = [
  { href: "/members",    label: "名簿",   Icon: UsersIcon },
  { href: "/expenses",   label: "費用",   Icon: BanknoteIcon },
  { href: "/accounting", label: "会計",   Icon: ChartBarIcon },
  { href: "/settings",   label: "設定",   Icon: CogIcon },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Header */}
      <header
        className="sticky top-0 z-10 shadow-sm"
        style={{
          background: "linear-gradient(135deg, #c43570 0%, #e04d8a 60%, #ec77a9 100%)",
        }}
      >
        <div className="container mx-auto max-w-2xl px-4">
          <div className="flex items-center gap-3 h-14">
            {/* Sakura decoration */}
            <div className="flex items-center gap-1.5">
              <SakuraIcon className="w-6 h-6 text-white/80" />
              <SakuraIcon className="w-4 h-4 text-white/50" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide leading-tight">
                送別会会計
              </h1>
              <p className="text-xs text-white/60 leading-none">Graduation Party</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-sakura-100 sticky top-14 z-10 shadow-sm">
        <div className="container mx-auto max-w-2xl px-2">
          <nav className="flex">
            {tabs.map(({ href, label, Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "text-sakura-600 border-b-2 border-sakura-600"
                      : "text-slate-400 hover:text-sakura-400"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
