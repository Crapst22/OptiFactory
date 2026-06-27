import type { Metadata } from "next"
import { Dongle, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { Toaster } from "sonner"

const dongleSans = Dongle({
  variable: "--font-dongle-sans",
  weight: ["300", "400", "700"],
  subsets: ["latin"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "OptiFactory - Optimización de Operaciones",
  description:
    "Plataforma educativa moderna para modelar, resolver, comprender y analizar problemas de Programación Lineal",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${dongleSans.variable} ${jetbrainsMono.variable} h-full antialiased`}>
        <ThemeProvider>
          <div className="min-h-full flex flex-col">
            {children}
          </div>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
