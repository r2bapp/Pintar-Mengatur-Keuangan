import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
// No AuthProvider import needed here anymore

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "KeuanganPintar Pro - Aplikasi Keuangan Terlengkap",
  description: "Kelola keuangan keluarga, pribadi, UMKM, dan bisnis dengan mudah dan profesional",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
