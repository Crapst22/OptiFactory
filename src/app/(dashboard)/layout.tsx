"use client"

import { Sidebar, MobileNav } from "@/components/layout/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b flex items-center px-4 gap-4 shrink-0 bg-background">
          <MobileNav />
          <div className="flex-1" />
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}
