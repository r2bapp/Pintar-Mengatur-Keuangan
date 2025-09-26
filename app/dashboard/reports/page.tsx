"use client"

import type { ChartConfig } from "@/components/ui/chart"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Brain,
  Calendar,
  BarChart3,
  LucidePieChart,
  DollarSign,
  FileText,
  FileSpreadsheet,
  Download,
  Lightbulb,
  RefreshCw,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { Footer } from "@/components/footer"
import { ChartContainer } from "@/components/ui/chart"
import { CardsSkeleton, ListSkeleton, ChartSkeleton } from "@/components/loading-skeletons"

// Recharts core imports (rendered client-side)
import {
  CartesianGrid,
  LineChart,
  XAxis,
  YAxis,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Line,
  Dot,
  Tooltip,
} from "recharts"

interface MonthlyData {
  month: string
  income: number
  expense: number
  savings: number
  balance: number
}

interface CategoryData {
  category: string
  amount: number
  percentage: number
  color: string
}

// Helper to load image as data URL for PDF
const getImageDataUrl = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      ctx?.drawImage(img, 0, 0)
      resolve(canvas.toDataURL("image/png"))
    }
    img.onerror = reject
    img.src = url
  })
}

export default function ReportsPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [reportLoading, setReportLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("current-month")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [expenseCategories, setExpenseCategories] = useState<CategoryData[]>([])
  const [incomeCategories, setIncomeCategories] = useState<CategoryData[]>([])
  const [rawTransactions, setRawTransactions] = useState<any[]>([])
  const [totalStats, setTotalStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    totalSavings: 0,
    netBalance: 0,
  })
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const [aiRecommendations, setAiRecommendations] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const getPeriodText = () => {
    switch (selectedPeriod) {
      case "current-month":
        return "Bulan Ini"
      case "last-3-months":
        return "3 Bulan Terakhir"
      case "last-6-months":
        return "6 Bulan Terakhir"
      case "current-year":
        return "Tahun Ini"
      case "custom":
        return `Kustom: ${customStartDate || "..."} hingga ${customEndDate || "..."}`
      default:
        return "Periode Terpilih"
    }
  }

  useEffect(() => {
    getImageDataUrl("/logo.png")
      .then(setLogoDataUrl)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
      return
    }
    if (user) {
      fetchReportData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, selectedPeriod, customStartDate, customEndDate])

  const fetchReportData = async () => {
    if (!user) return
    setReportLoading(true)
    setAiRecommendations(null)

    try {
      let startDate: Date
      let endDate: Date = new Date()

      switch (selectedPeriod) {
        case "current-month":
          startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
          break
        case "last-3-months":
          startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 2, 1)
          break
        case "last-6-months":
          startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 5, 1)
          break
        case "current-year":
          startDate = new Date(endDate.getFullYear(), 0, 1)
          break
        case "custom":
          if (!customStartDate || !customEndDate) {
            toast.error("Mohon lengkapi tanggal mulai dan akhir untuk periode kustom.")
            setReportLoading(false)
            return
          }
          startDate = new Date(customStartDate)
          endDate = new Date(customEndDate)
          break
        default:
          startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
      }

      // Normalize to local date-only strings to match Supabase DATE columns
      const startStr = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
        .toISOString()
        .slice(0, 10)
      const endStr = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).toISOString().slice(0, 10)

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startStr)
        .lte("date", endStr)
        .order("date", { ascending: true })

      if (error) throw error
      const rows = transactions || []

      setRawTransactions(rows)
      processMonthlyData(rows, startDate, endDate)
      processCategoryData(rows)
      calculateTotalStats(rows)
    } catch (error) {
      console.error("Error fetching report data:", error)
      toast.error("Gagal memuat data laporan")
    } finally {
      setReportLoading(false)
    }
  }

  const processMonthlyData = (transactions: any[], startDate: Date, endDate: Date) => {
    const monthlyMap = new Map<string, MonthlyData>()

    // Build month buckets inclusive
    const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    const last = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
    while (cur <= last) {
      const monthKey = cur.toISOString().slice(0, 7) // YYYY-MM
      const monthName = cur.toLocaleDateString("id-ID", { month: "short", year: "numeric" })
      monthlyMap.set(monthKey, { month: monthName, income: 0, expense: 0, savings: 0, balance: 0 })
      cur.setMonth(cur.getMonth() + 1)
    }

    transactions.forEach((t) => {
      const monthKey = String(t.date).slice(0, 7)
      const m = monthlyMap.get(monthKey)
      if (!m) return
      const amt = Number(t.amount) || 0
      if (t.type === "income") m.income += amt
      if (t.type === "expense") m.expense += amt
      if (t.type === "savings") m.savings += amt
      m.balance = m.income - m.expense
    })

    setMonthlyData(Array.from(monthlyMap.values()))
  }

  const processCategoryData = (transactions: any[]) => {
    const expenseMap = new Map<string, number>()
    const incomeMap = new Map<string, number>()
    let totalExpense = 0
    let totalIncome = 0

    transactions.forEach((t) => {
      const amt = Number(t.amount) || 0
      const category = t.subcategory || t.category || "Lainnya"
      if (t.type === "expense") {
        expenseMap.set(category, (expenseMap.get(category) || 0) + amt)
        totalExpense += amt
      } else if (t.type === "income") {
        incomeMap.set(category, (incomeMap.get(category) || 0) + amt)
        totalIncome += amt
      }
    })

    const palette = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))",
      "hsl(var(--chart-6))",
      "#1f5e21",
      "#2f9d72",
      "#66b3a1",
      "#4ebf8f",
    ]

    const expenseCategories = Array.from(expenseMap.entries())
      .map(([category, amount], idx) => ({
        category,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        color: palette[idx % palette.length],
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)

    const incomeCategories = Array.from(incomeMap.entries())
      .map(([category, amount], idx) => ({
        category,
        amount,
        percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0,
        color: palette[idx % palette.length],
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)

    setExpenseCategories(expenseCategories)
    setIncomeCategories(incomeCategories)
  }

  const calculateTotalStats = (rows: any[]) => {
    const s = rows.reduce(
      (acc, t) => {
        const amt = Number(t.amount) || 0
        if (t.type === "income") acc.totalIncome += amt
        if (t.type === "expense") acc.totalExpense += amt
        if (t.type === "savings") acc.totalSavings += amt
        return acc
      },
      { totalIncome: 0, totalExpense: 0, totalSavings: 0, netBalance: 0 },
    )
    s.netBalance = s.totalIncome - s.totalExpense
    setTotalStats(s)
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)

  const fetchAiRecommendations = async () => {
    if (!user || !profile) {
      toast.error("Profil pengguna tidak ditemukan untuk rekomendasi AI.")
      return
    }
    setAiLoading(true)
    setAiRecommendations(null)
    try {
      const res = await fetch("/api/ai-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, totalStats, monthlyData, expenseCategories, incomeCategories }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`)
      }
      setAiRecommendations(data.recommendations)
      toast.success("Rekomendasi AI berhasil dimuat!")
    } catch (err: any) {
      toast.error(
        err?.message?.includes("key") || err?.message?.includes("OPENAI")
          ? "Kunci API AI belum disetel. Tambahkan OPENAI_API_KEY atau XAI_API_KEY lalu deploy ulang."
          : `Gagal memuat rekomendasi AI: ${err.message}`,
      )
    } finally {
      setAiLoading(false)
    }
  }

  const exportToPDF = useCallback(async () => {
    try {
      const jsPDF = (await import("jspdf")).default
      const autoTable = (await import("jspdf-autotable")).default
      const doc = new jsPDF()

      if (logoDataUrl) doc.addImage(logoDataUrl, "PNG", 20, 10, 20, 20)

      doc.setFontSize(18)
      doc.setTextColor(36, 59, 50)
      doc.text("KeuanganPintar Pro", logoDataUrl ? 45 : 20, 20)
      doc.setFontSize(14)
      doc.text("Laporan Keuangan", logoDataUrl ? 45 : 20, 30)

      doc.setFontSize(11)
      doc.setTextColor(90, 110, 90)
      doc.text(`Periode: ${getPeriodText()}`, 20, 40)
      doc.text(`Nama: ${profile?.full_name || "User"}`, 20, 48)
      doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`, 20, 56)

      doc.setFontSize(13)
      doc.setTextColor(36, 59, 50)
      doc.text("Ringkasan Keuangan", 20, 72)

      const summaryData = [
        ["Total Pemasukan", formatCurrency(totalStats.totalIncome)],
        ["Total Pengeluaran", formatCurrency(totalStats.totalExpense)],
        ["Total Tabungan", formatCurrency(totalStats.totalSavings)],
        ["Saldo Bersih", formatCurrency(totalStats.netBalance)],
      ]

      autoTable(doc, {
        startY: 77,
        head: [["Kategori", "Jumlah"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [31, 94, 33] },
        styles: { fontSize: 10 },
      })

      if (monthlyData.length > 0) {
        doc.setFontSize(13)
        doc.setTextColor(36, 59, 50)
        doc.text("Tren Bulanan", 20, (doc as any).lastAutoTable.finalY + 16)

        const monthlyTableData = monthlyData.map((m) => [
          m.month,
          formatCurrency(m.income),
          formatCurrency(m.expense),
          formatCurrency(m.savings),
          formatCurrency(m.balance),
        ])

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 21,
          head: [["Bulan", "Pemasukan", "Pengeluaran", "Tabungan", "Saldo"]],
          body: monthlyTableData,
          theme: "grid",
          headStyles: { fillColor: [31, 94, 33] },
          styles: { fontSize: 9 },
        })
      }

      if (expenseCategories.length > 0) {
        doc.addPage()
        doc.setFontSize(13)
        doc.setTextColor(36, 59, 50)
        doc.text("Kategori Pengeluaran", 20, 20)

        const expenseTableData = expenseCategories.map((c) => [
          c.category,
          formatCurrency(c.amount),
          `${c.percentage.toFixed(1)}%`,
        ])

        autoTable(doc, {
          startY: 25,
          head: [["Kategori", "Jumlah", "Persentase"]],
          body: expenseTableData,
          theme: "grid",
          headStyles: { fillColor: [31, 94, 33] },
          styles: { fontSize: 10 },
        })
      }

      if (rawTransactions.length > 0) {
        doc.addPage()
        doc.setFontSize(13)
        doc.setTextColor(36, 59, 50)
        doc.text("Detail Transaksi", 20, 20)

        const transactionData = rawTransactions
          .slice(0, 50)
          .map((t) => [
            new Date(t.date).toLocaleDateString("id-ID"),
            t.type === "income"
              ? "Pemasukan"
              : t.type === "expense"
                ? "Pengeluaran"
                : t.type === "savings"
                  ? "Tabungan"
                  : "Hutang/Piutang",
            t.subcategory || t.category,
            formatCurrency(Number(t.amount)),
            t.description || "-",
          ])

        autoTable(doc, {
          startY: 25,
          head: [["Tanggal", "Jenis", "Kategori", "Jumlah", "Keterangan"]],
          body: transactionData,
          theme: "grid",
          headStyles: { fillColor: [31, 94, 33] },
          styles: { fontSize: 8 },
          columnStyles: { 4: { cellWidth: 40 } },
        })

        if (rawTransactions.length > 50) {
          doc.setFontSize(10)
          doc.setTextColor(110, 120, 110)
          doc.text(
            `*Menampilkan 50 dari ${rawTransactions.length} transaksi`,
            20,
            (doc as any).lastAutoTable.finalY + 10,
          )
        }
      }

      if (aiRecommendations) {
        doc.addPage()
        doc.setFontSize(13)
        doc.setTextColor(36, 59, 50)
        doc.text("Rekomendasi AI", 20, 20)
        const recText = doc.splitTextToSize(aiRecommendations, 170)
        doc.setFontSize(10)
        doc.setTextColor(60, 70, 60)
        doc.text(recText, 20, 30)
      }

      const fileName = `Laporan-Keuangan-${getPeriodText().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`
      doc.save(fileName)
      toast.success("Laporan PDF berhasil diunduh!")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Gagal membuat PDF. Pastikan browser mendukung fitur ini.")
    }
  }, [logoDataUrl, profile?.full_name, totalStats, monthlyData, expenseCategories, rawTransactions, aiRecommendations])

  const exportToExcel = async () => {
    try {
      const XLSX = await import("xlsx")
      const wb = XLSX.utils.book_new()

      const summaryData = [
        ["Laporan Keuangan - KeuanganPintar Pro"],
        [`Periode: ${getPeriodText()}`],
        [`Nama: ${profile?.full_name || "User"}`],
        [`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`],
        [],
        ["RINGKASAN KEUANGAN"],
        ["Kategori", "Jumlah"],
        ["Total Pemasukan", totalStats.totalIncome],
        ["Total Pengeluaran", totalStats.totalExpense],
        ["Total Tabungan", totalStats.totalSavings],
        ["Saldo Bersih", totalStats.netBalance],
      ]
      const summaryWS = XLSX.utils.aoa_to_sheet(summaryData)
      summaryWS["!cols"] = [{ wch: 28 }, { wch: 22 }]
      XLSX.utils.book_append_sheet(wb, summaryWS, "Ringkasan")

      if (monthlyData.length > 0) {
        const monthlySheetData = [
          ["Bulan", "Pemasukan", "Pengeluaran", "Tabungan", "Saldo"],
          ...monthlyData.map((m) => [m.month, m.income, m.expense, m.savings, m.balance]),
        ]
        const monthlyWS = XLSX.utils.aoa_to_sheet(monthlySheetData)
        monthlyWS["!cols"] = [{ wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }]
        XLSX.utils.book_append_sheet(wb, monthlyWS, "Tren Bulanan")
      }

      if (expenseCategories.length > 0) {
        const expenseSheetData = [
          ["Kategori", "Jumlah", "Persentase"],
          ...expenseCategories.map((c) => [c.category, c.amount, c.percentage]),
        ]
        const expenseWS = XLSX.utils.aoa_to_sheet(expenseSheetData)
        expenseWS["!cols"] = [{ wch: 22 }, { wch: 16 }, { wch: 14 }]
        XLSX.utils.book_append_sheet(wb, expenseWS, "Kategori Pengeluaran")
      }

      if (incomeCategories.length > 0) {
        const incomeSheetData = [
          ["Kategori", "Jumlah", "Persentase"],
          ...incomeCategories.map((c) => [c.category, c.amount, c.percentage]),
        ]
        const incomeWS = XLSX.utils.aoa_to_sheet(incomeSheetData)
        incomeWS["!cols"] = [{ wch: 22 }, { wch: 16 }, { wch: 14 }]
        XLSX.utils.book_append_sheet(wb, incomeWS, "Kategori Pemasukan")
      }

      if (rawTransactions.length > 0) {
        const transactionSheetData = [
          ["Tanggal", "Jenis", "Kategori", "Sub Kategori", "Jumlah", "Keterangan"],
          ...rawTransactions.map((t) => [
            t.date,
            t.type === "income"
              ? "Pemasukan"
              : t.type === "expense"
                ? "Pengeluaran"
                : t.type === "savings"
                  ? "Tabungan"
                  : "Hutang/Piutang",
            t.category,
            t.subcategory || "",
            Number(t.amount),
            t.description || "",
          ]),
        ]
        const transactionWS = XLSX.utils.aoa_to_sheet(transactionSheetData)
        transactionWS["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 36 }]
        XLSX.utils.book_append_sheet(wb, transactionWS, "Detail Transaksi")
      }

      const fileName = `Laporan-Keuangan-${getPeriodText().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.xlsx`
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbout], { type: "application/octet-stream" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success("Laporan Excel berhasil diunduh!")
    } catch (error) {
      console.error("Error generating Excel:", error)
      toast.error("Gagal membuat Excel. Coba lagi atau gunakan browser yang berbeda.")
    }
  }

  const exportToJSON = () => {
    if (rawTransactions.length === 0) {
      toast.error("Tidak ada data transaksi untuk diunduh.")
      return
    }

    const dataToExport = {
      profile,
      totalStats,
      monthlyData,
      expenseCategories,
      incomeCategories,
      rawTransactions,
      aiRecommendations,
      reportPeriod: getPeriodText(),
      generatedAt: new Date().toISOString(),
    }

    const fileName = `Transaksi-Keuangan-${getPeriodText().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.json`
    const jsonString = JSON.stringify(dataToExport, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Data JSON berhasil diunduh!")
  }

  if (loading || reportLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-navy-gradient sticky top-0 z-20 shadow-sm border-b border-navy-200">
          <div className="container mx-auto px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/dashboard")}
                  className="text-white hover:bg-black/10"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Kembali</span>
                </Button>
                <h1 className="text-white text-base sm:text-lg font-semibold">Laporan Keuangan</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-3 py-6 space-y-6">
          <CardsSkeleton count={4} />
          <ChartSkeleton />
          <ListSkeleton rows={6} />
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Sesi tidak ditemukan</p>
          <Button onClick={() => router.push("/")} className="bg-navy-600 hover:bg-navy-700">
            Kembali ke Login
          </Button>
        </div>
      </div>
    )
  }

  const monthlyChartConfig: ChartConfig = {
    income: { label: "Pemasukan", color: "hsl(var(--chart-1))" },
    expense: { label: "Pengeluaran", color: "hsl(var(--chart-4))" },
    balance: { label: "Saldo", color: "hsl(var(--chart-3))" },
  }

  const expenseChartConfig = expenseCategories.reduce((acc, cat) => {
    acc[cat.category.replace(/\s+/g, "-").toLowerCase()] = { label: cat.category, color: cat.color }
    return acc
  }, {} as ChartConfig)

  const incomeChartConfig = incomeCategories.reduce((acc, cat) => {
    acc[cat.category.replace(/\s+/g, "-").toLowerCase()] = { label: cat.category, color: cat.color }
    return acc
  }, {} as ChartConfig)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header: mobile-first, sticky */}
      <header className="bg-navy-gradient sticky top-0 z-20 shadow-sm border-b border-navy-200">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="text-white hover:bg-black/10"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Kembali</span>
              </Button>
              <div className="flex items-center gap-2">
                <div className="bg-white/10 p-1.5 rounded-md">
                  <img src="/logo.png" alt="KeuanganPintar Pro" className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-semibold text-white leading-tight">Laporan Keuangan</h1>
                  <p className="text-xs sm:text-sm text-sage-100">Analisis & insight keuangan Anda</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                className="flex-1 sm:flex-none bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <FileText className="h-4 w-4 mr-1.5" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                className="flex-1 sm:flex-none bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToJSON}
                className="flex-1 sm:flex-none bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Download className="h-4 w-4 mr-1.5" />
                JSON
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Period Selection */}
        <div className="mb-6 sm:mb-8">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b py-3 sm:py-4">
              <CardTitle className="flex items-center gap-2 text-navy-800 text-base sm:text-lg">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Periode Laporan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Select
                  value={selectedPeriod}
                  onValueChange={(value) => {
                    setSelectedPeriod(value)
                    if (value !== "custom") {
                      setCustomStartDate("")
                      setCustomEndDate("")
                    }
                  }}
                >
                  <SelectTrigger className="w-full sm:w-64 border-gray-300 focus:border-primary">
                    <SelectValue placeholder="Pilih periode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current-month">Bulan Ini</SelectItem>
                    <SelectItem value="last-3-months">3 Bulan Terakhir</SelectItem>
                    <SelectItem value="last-6-months">6 Bulan Terakhir</SelectItem>
                    <SelectItem value="current-year">Tahun Ini</SelectItem>
                    <SelectItem value="custom">Rentang Kustom</SelectItem>
                  </SelectContent>
                </Select>

                {selectedPeriod === "custom" && (
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                    <Input
                      id="startDate"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full border-gray-300 focus:border-primary"
                    />
                    <Input
                      id="endDate"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full border-gray-300 focus:border-primary"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-sage-50 border-b">
              <CardTitle className="text-sm font-medium text-navy-700">Total Pemasukan</CardTitle>
              <TrendingUp className="h-4 w-4 text-sage-600" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-xl sm:text-2xl font-bold text-sage-600">
                {formatCurrency(totalStats.totalIncome)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-rose-50 border-b">
              <CardTitle className="text-sm font-medium text-navy-700">Total Pengeluaran</CardTitle>
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-xl sm:text-2xl font-bold text-rose-500">
                {formatCurrency(totalStats.totalExpense)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-navy-50 border-b">
              <CardTitle className="text-sm font-medium text-navy-700">Total Tabungan</CardTitle>
              <Brain className="h-4 w-4 text-navy-600" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-xl sm:text-2xl font-bold text-navy-600">
                {formatCurrency(totalStats.totalSavings)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gold-50 border-b">
              <CardTitle className="text-sm font-medium text-navy-700">Saldo Bersih</CardTitle>
              <DollarSign className="h-4 w-4 text-gold-600" />
            </CardHeader>
            <CardContent className="p-4">
              <div
                className={`text-xl sm:text-2xl font-bold ${totalStats.netBalance >= 0 ? "text-sage-600" : "text-rose-500"}`}
              >
                {formatCurrency(totalStats.netBalance)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Monthly Trend Chart */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center gap-2 text-navy-800">
                <BarChart3 className="h-5 w-5" />
                <span>Tren Bulanan</span>
              </CardTitle>
              <CardDescription>Perbandingan pemasukan dan pengeluaran per bulan</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {monthlyData.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">Belum ada data untuk periode ini</p>
                </div>
              ) : (
                <ChartContainer config={monthlyChartConfig} className="w-full">
                  <LineChart data={monthlyData} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => new Intl.NumberFormat("id-ID", { notation: "compact" }).format(v)}
                      tickMargin={8}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: 8, borderColor: "hsl(var(--border))" }}
                    />
                    <Legend />
                    <Line
                      dataKey="income"
                      stroke="var(--color-income)"
                      strokeWidth={2}
                      dot={<Dot r={3.5} fill="var(--color-income)" stroke="var(--color-income)" />}
                      activeDot={<Dot r={5} fill="var(--color-income)" stroke="var(--color-income)" />}
                      type="monotone"
                    />
                    <Line
                      dataKey="expense"
                      stroke="var(--color-expense)"
                      strokeWidth={2}
                      dot={<Dot r={3.5} fill="var(--color-expense)" stroke="var(--color-expense)" />}
                      activeDot={<Dot r={5} fill="var(--color-expense)" stroke="var(--color-expense)" />}
                      type="monotone"
                    />
                    <Line
                      dataKey="balance"
                      stroke="var(--color-balance)"
                      strokeWidth={2}
                      dot={<Dot r={3.5} fill="var(--color-balance)" stroke="var(--color-balance)" />}
                      activeDot={<Dot r={5} fill="var(--color-balance)" stroke="var(--color-balance)" />}
                      type="monotone"
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Expense Categories Chart */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center gap-2 text-navy-800">
                <LucidePieChart className="h-5 w-5" />
                <span>Kategori Pengeluaran</span>
              </CardTitle>
              <CardDescription>Breakdown pengeluaran berdasarkan kategori</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {expenseCategories.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">Belum ada data pengeluaran</p>
                </div>
              ) : (
                <ChartContainer config={expenseChartConfig} className="w-full">
                  <RechartsPieChart>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: 8, borderColor: "hsl(var(--border))" }}
                    />
                    <Pie
                      data={expenseCategories}
                      dataKey="amount"
                      nameKey="category"
                      innerRadius={60}
                      outerRadius={100}
                      label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend layout="vertical" verticalAlign="middle" align="right" />
                  </RechartsPieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Income Categories Chart */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center gap-2 text-navy-800">
                <LucidePieChart className="h-5 w-5" />
                <span>Kategori Pemasukan</span>
              </CardTitle>
              <CardDescription>Breakdown pemasukan berdasarkan kategori</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {incomeCategories.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">Belum ada data pemasukan</p>
                </div>
              ) : (
                <ChartContainer config={incomeChartConfig} className="w-full">
                  <RechartsPieChart>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: 8, borderColor: "hsl(var(--border))" }}
                    />
                    <Pie
                      data={incomeCategories}
                      dataKey="amount"
                      nameKey="category"
                      innerRadius={60}
                      outerRadius={100}
                      label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {incomeCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend layout="vertical" verticalAlign="middle" align="right" />
                  </RechartsPieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card className="lg:col-span-2 border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-navy-800">
                  <Lightbulb className="h-5 w-5 text-gold-600" />
                  <span>Rekomendasi AI</span>
                </CardTitle>
                <Button
                  onClick={fetchAiRecommendations}
                  disabled={aiLoading || reportLoading || !user || !profile}
                  size="sm"
                  className="bg-gold-600 hover:bg-gold-700 text-white"
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Memuat...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Dapatkan Rekomendasi
                    </>
                  )}
                </Button>
              </div>
              <CardDescription>Saran keuangan yang dipersonalisasi berdasarkan data Anda</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {aiLoading ? (
                <div className="space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                </div>
              ) : aiRecommendations ? (
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p className="whitespace-pre-wrap">{aiRecommendations}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Klik "Dapatkan Rekomendasi" untuk melihat saran AI.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}
