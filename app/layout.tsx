import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "送別会会計管理",
  description: "送別会の会計・名簿・費用管理アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
          {children}
        </main>
      </body>
    </html>
  );
}
