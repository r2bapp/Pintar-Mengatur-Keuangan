"use client"

import type { ChartConfig } from "@/components/ui/chart"
import { Pie } from "recharts" // Import Pie component

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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartXAxis,
  ChartYAxis,
  CartesianGrid,
  LineChart, // Corrected import
  RechartsPieChart, // Corrected import
  RechartsLegend, // Corrected import
  Cell, // Corrected import
  Dot, // Corrected import
  Line, // Corrected import for Line component within LineChart
} from "@/components/ui/chart" // Import chart components

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
    img.crossOrigin = "anonymous" // Important for CORS
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      ctx?.drawImage(img, 0, 0)
      resolve(canvas.toDataURL("image/png")) // Or 'image/jpeg'
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
    // Preload logo for PDF export
    getImageDataUrl("/logo.png")
      .then(setLogoDataUrl)
      .catch((error) => console.error("Failed to load logo for PDF:", error))
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
      return
    }

    if (user) {
      fetchReportData()
    }
  }, [user, loading, selectedPeriod, customStartDate, customEndDate, router])

  const fetchReportData = async () => {
    if (!user) return

    setReportLoading(true)
    setAiRecommendations(null) // Clear AI recommendations on new data fetch
    try {
      let startDate: Date
      let endDate: Date = new Date()

      // Determine date range based on selected period
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

      // Ensure endDate is set to the end of the day for accurate filtering
      endDate.setHours(23, 59, 59, 999)

      // Fetch transactions
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDate.toISOString().split("T")[0])
        .lte("date", endDate.toISOString().split("T")[0])
        .order("date", { ascending: true })

      if (error) throw error

      setRawTransactions(transactions || [])

      // Process data for charts
      processMonthlyData(transactions || [], startDate, endDate)
      processCategoryData(transactions || [])
      calculateTotalStats(transactions || [])
    } catch (error) {
      console.error("Error fetching report data:", error)
      toast.error("Gagal memuat data laporan")
    } finally {
      setReportLoading(false)
    }
  }

  const processMonthlyData = (transactions: any[], startDate: Date, endDate: Date) => {
    const monthlyMap = new Map<string, MonthlyData>()

    // Initialize months
    const current = new Date(startDate)
    while (current <= endDate) {
      const monthKey = current.toISOString().slice(0, 7) // YYYY-MM
      const monthName = current.toLocaleDateString("id-ID", { month: "short", year: "numeric" })
      monthlyMap.set(monthKey, {
        month: monthName,
        income: 0,
        expense: 0,
        savings: 0,
        balance: 0,
      })
      current.setMonth(current.getMonth() + 1)
    }

    // Aggregate transactions by month
    transactions.forEach((transaction) => {
      const monthKey = transaction.date.slice(0, 7)
      const monthData = monthlyMap.get(monthKey)
      if (monthData) {
        const amount = Number(transaction.amount)
        switch (transaction.type) {
          case "income":
            monthData.income += amount
            break
          case "expense":
            monthData.expense += amount
            break
          case "savings":
            monthData.savings += amount
            break
        }
        monthData.balance = monthData.income - monthData.expense
      }
    })

    setMonthlyData(Array.from(monthlyMap.values()))
  }

  const processCategoryData = (transactions: any[]) => {
    const expenseMap = new Map<string, number>()
    const incomeMap = new Map<string, number>()

    let totalExpense = 0
    let totalIncome = 0

    transactions.forEach((transaction) => {
      const amount = Number(transaction.amount)
      const category = transaction.subcategory || transaction.category

      if (transaction.type === "expense") {
        expenseMap.set(category, (expenseMap.get(category) || 0) + amount)
        totalExpense += amount
      } else if (transaction.type === "income") {
        incomeMap.set(category, (incomeMap.get(category) || 0) + amount)
        totalIncome += amount
      }
    })

    // Convert to array and calculate percentages
    const colors = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))",
      "hsl(var(--chart-6))",
      "#ef4444", // Fallback colors
      "#f97316",
      "#eab308",
      "#22c55e",
    ]

    const expenseCategories = Array.from(expenseMap.entries())
      .map(([category, amount], index) => ({
        category,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)

    const incomeCategories = Array.from(incomeMap.entries())
      .map(([category, amount], index) => ({
        category,
        amount,
        percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)

    setExpenseCategories(expenseCategories)
    setIncomeCategories(incomeCategories)
  }

  const calculateTotalStats = (transactions: any[]) => {
    const stats = transactions.reduce(
      (acc, transaction) => {
        const amount = Number(transaction.amount)
        switch (transaction.type) {
          case "income":
            acc.totalIncome += amount
            break
          case "expense":
            acc.totalExpense += amount
            break
          case "savings":
            acc.totalSavings += amount
            break
        }
        return acc
      },
      { totalIncome: 0, totalExpense: 0, totalSavings: 0, netBalance: 0 },
    )

    stats.netBalance = stats.totalIncome - stats.totalExpense
    setTotalStats(stats)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const fetchAiRecommendations = async () => {
    if (!user || !profile) {
      toast.error("Profil pengguna tidak ditemukan untuk rekomendasi AI.")
      return
    }

    setAiLoading(true)
    setAiRecommendations(null)
    try {
      const response = await fetch("/api/ai-recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile,
          totalStats,
          monthlyData,
          expenseCategories,
          incomeCategories,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setAiRecommendations(data.recommendations)
      toast.success("Rekomendasi AI berhasil dimuat!")
    } catch (error: any) {
      console.error("Error fetching AI recommendations:", error)
      toast.error("Gagal memuat rekomendasi AI: " + error.message)
    } finally {
      setAiLoading(false)
    }
  }

  const exportToPDF = useCallback(async () => {
    try {
      const jsPDF = (await import("jspdf")).default
      const autoTable = (await import("jspdf-autotable")).default

      const doc = new jsPDF()

      // Add logo if available
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, "PNG", 20, 10, 20, 20) // x, y, width, height
      }

      // Header
      doc.setFontSize(20)
      doc.setTextColor(36, 59, 83) // Navy color
      doc.text("KeuanganPintar Pro", logoDataUrl ? 45 : 20, 20) // Adjust text position if logo is present

      doc.setFontSize(16)
      doc.text("Laporan Keuangan", logoDataUrl ? 45 : 20, 30)

      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text(`Periode: ${getPeriodText()}`, 20, 40)
      doc.text(`Nama: ${profile?.full_name || "User"}`, 20, 50)
      doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`, 20, 60)

      // Summary Stats
      doc.setFontSize(14)
      doc.setTextColor(36, 59, 83)
      doc.text("Ringkasan Keuangan", 20, 80)

      const summaryData = [
        ["Total Pemasukan", formatCurrency(totalStats.totalIncome)],
        ["Total Pengeluaran", formatCurrency(totalStats.totalExpense)],
        ["Total Tabungan", formatCurrency(totalStats.totalSavings)],
        ["Saldo Bersih", formatCurrency(totalStats.netBalance)],
      ]

      autoTable(doc, {
        startY: 85,
        head: [["Kategori", "Jumlah"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [36, 59, 83] },
        styles: { fontSize: 10 },
      })

      // Monthly Data
      if (monthlyData.length > 0) {
        doc.setFontSize(14)
        doc.setTextColor(36, 59, 83)
        doc.text("Tren Bulanan", 20, doc.lastAutoTable.finalY + 20)

        const monthlyTableData = monthlyData.map((month) => [
          month.month,
          formatCurrency(month.income),
          formatCurrency(month.expense),
          formatCurrency(month.savings),
          formatCurrency(month.balance),
        ])

        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 25,
          head: [["Bulan", "Pemasukan", "Pengeluaran", "Tabungan", "Saldo"]],
          body: monthlyTableData,
          theme: "grid",
          headStyles: { fillColor: [36, 59, 83] },
          styles: { fontSize: 9 },
        })
      }

      // Expense Categories
      if (expenseCategories.length > 0) {
        doc.addPage()
        doc.setFontSize(14)
        doc.setTextColor(36, 59, 83)
        doc.text("Kategori Pengeluaran", 20, 20)

        const expenseTableData = expenseCategories.map((cat) => [
          cat.category,
          formatCurrency(cat.amount),
          `${cat.percentage.toFixed(1)}%`,
        ])

        autoTable(doc, {
          startY: 25,
          head: [["Kategori", "Jumlah", "Persentase"]],
          body: expenseTableData,
          theme: "grid",
          headStyles: { fillColor: [36, 59, 83] },
          styles: { fontSize: 10 },
        })
      }

      // Transaction Details
      if (rawTransactions.length > 0) {
        doc.addPage()
        doc.setFontSize(14)
        doc.setTextColor(36, 59, 83)
        doc.text("Detail Transaksi", 20, 20)

        const transactionData = rawTransactions
          .slice(0, 50)
          .map((trans) => [
            new Date(trans.date).toLocaleDateString("id-ID"),
            trans.type === "income"
              ? "Pemasukan"
              : trans.type === "expense"
                ? "Pengeluaran"
                : trans.type === "savings"
                  ? "Tabungan"
                  : "Hutang/Piutang",
            trans.subcategory || trans.category,
            formatCurrency(Number(trans.amount)),
            trans.description || "-",
          ])

        autoTable(doc, {
          startY: 25,
          head: [["Tanggal", "Jenis", "Kategori", "Jumlah", "Keterangan"]],
          body: transactionData,
          theme: "grid",
          headStyles: { fillColor: [36, 59, 83] },
          styles: { fontSize: 8 },
          columnStyles: {
            4: { cellWidth: 40 },
          },
        })

        if (rawTransactions.length > 50) {
          doc.setFontSize(10)
          doc.setTextColor(100, 100, 100)
          doc.text(`*Menampilkan 50 dari ${rawTransactions.length} transaksi`, 20, doc.lastAutoTable.finalY + 10)
        }
      }

      // AI Recommendations
      if (aiRecommendations) {
        doc.addPage()
        doc.setFontSize(14)
        doc.setTextColor(36, 59, 83)
        doc.text("Rekomendasi AI", 20, 20)

        const recommendationsText = doc.splitTextToSize(aiRecommendations, 170) // Max width 170mm
        doc.setFontSize(10)
        doc.setTextColor(50, 50, 50)
        doc.text(recommendationsText, 20, 30)
      }

      // Save PDF
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
      // Dynamic import untuk mengurangi bundle size
      const XLSX = await import("xlsx")

      // Create workbook
      const wb = XLSX.utils.book_new()

      // Summary Sheet
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

      // Set column widths
      summaryWS["!cols"] = [
        { wch: 25 }, // Column A
        { wch: 20 }, // Column B
      ]

      XLSX.utils.book_append_sheet(wb, summaryWS, "Ringkasan")

      // Monthly Data Sheet
      if (monthlyData.length > 0) {
        const monthlySheetData = [
          ["Bulan", "Pemasukan", "Pengeluaran", "Tabungan", "Saldo"],
          ...monthlyData.map((month) => [month.month, month.income, month.expense, month.savings, month.balance]),
        ]

        const monthlyWS = XLSX.utils.aoa_to_sheet(monthlySheetData)
        monthlyWS["!cols"] = [
          { wch: 15 }, // Bulan
          { wch: 15 }, // Pemasukan
          { wch: 15 }, // Pengeluaran
          { wch: 15 }, // Tabungan
          { wch: 15 }, // Saldo
        ]
        XLSX.utils.book_append_sheet(wb, monthlyWS, "Tren Bulanan")
      }

      // Expense Categories Sheet
      if (expenseCategories.length > 0) {
        const expenseSheetData = [
          ["Kategori", "Jumlah", "Persentase"],
          ...expenseCategories.map((cat) => [cat.category, cat.amount, cat.percentage]),
        ]

        const expenseWS = XLSX.utils.aoa_to_sheet(expenseSheetData)
        expenseWS["!cols"] = [
          { wch: 20 }, // Kategori
          { wch: 15 }, // Jumlah
          { wch: 12 }, // Persentase
        ]
        XLSX.utils.book_append_sheet(wb, expenseWS, "Kategori Pengeluaran")
      }

      // Income Categories Sheet
      if (incomeCategories.length > 0) {
        const incomeSheetData = [
          ["Kategori", "Jumlah", "Persentase"],
          ...incomeCategories.map((cat) => [cat.category, cat.amount, cat.percentage]),
        ]

        const incomeWS = XLSX.utils.aoa_to_sheet(incomeSheetData)
        incomeWS["!cols"] = [
          { wch: 20 }, // Kategori
          { wch: 15 }, // Jumlah
          { wch: 12 }, // Persentase
        ]
        XLSX.utils.book_append_sheet(wb, incomeWS, "Kategori Pemasukan")
      }

      // Transactions Sheet
      if (rawTransactions.length > 0) {
        const transactionSheetData = [
          ["Tanggal", "Jenis", "Kategori", "Sub Kategori", "Jumlah", "Keterangan"],
          ...rawTransactions.map((trans) => [
            trans.date,
            trans.type === "income"
              ? "Pemasukan"
              : trans.type === "expense"
                ? "Pengeluaran"
                : trans.type === "savings"
                  ? "Tabungan"
                  : "Hutang/Piutang",
            trans.category,
            trans.subcategory || "",
            Number(trans.amount),
            trans.description || "",
          ]),
        ]

        const transactionWS = XLSX.utils.aoa_to_sheet(transactionSheetData)
        transactionWS["!cols"] = [
          { wch: 12 }, // Tanggal
          { wch: 12 }, // Jenis
          { wch: 20 }, // Kategori
          { wch: 20 }, // Sub Kategori
          { wch: 15 }, // Jumlah
          { wch: 30 }, // Keterangan
        ]
        XLSX.utils.book_append_sheet(wb, transactionWS, "Detail Transaksi")
      }

      // AI Recommendations Sheet
      if (aiRecommendations) {
        const aiRecsSheetData = [["Rekomendasi AI"], [""], [aiRecommendations]]
        const aiRecsWS = XLSX.utils.aoa_to_sheet(aiRecsSheetData)
        aiRecsWS["!cols"] = [{ wch: 100 }] // Adjust width for recommendations
        XLSX.utils.book_append_sheet(wb, aiRecsWS, "Rekomendasi AI")
      }

      // Save Excel file with better filename
      const fileName = `Laporan-Keuangan-${getPeriodText().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.xlsx`

      // Use writeFile with better options
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat laporan...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Sesi tidak ditemukan</p>
          <Button onClick={() => router.push("/")} className="bg-navy-600 hover:bg-navy-700">
            Kembali ke Login
          </Button>
        </div>
      </div>
    )
  }

  const monthlyChartConfig = {
    income: {
      label: "Pemasukan",
      color: "hsl(var(--chart-1))",
    },
    expense: {
      label: "Pengeluaran",
      color: "hsl(var(--chart-4))",
    },
    balance: {
      label: "Saldo",
      color: "hsl(var(--chart-3))",
    },
  }

  const expenseChartConfig = expenseCategories.reduce((acc, cat, index) => {
    acc[cat.category.replace(/\s+/g, "-").toLowerCase()] = {
      label: cat.category,
      color: cat.color,
    }
    return acc
  }, {} as ChartConfig)

  const incomeChartConfig = incomeCategories.reduce((acc, cat, index) => {
    acc[cat.category.replace(/\s+/g, "-").toLowerCase()] = {
      label: cat.category,
      color: cat.color,
    }
    return acc
  }, {} as ChartConfig)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-navy-gradient shadow-sm border-b border-navy-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="text-white hover:bg-navy-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <div className="flex items-center space-x-2">
                <div className="bg-white/10 p-2 rounded-lg shadow-md">
                  <img src="/logo.png" alt="KeuanganPintar Pro" className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Laporan Keuangan</h1>
                  <p className="text-sm text-sage-100">Analisis dan insight keuangan Anda</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToJSON}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Period Selection */}
        <div className="mb-8">
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center space-x-2 text-navy-800">
                <Calendar className="h-5 w-5" />
                <span>Periode Laporan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
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
                <SelectTrigger className="w-full md:w-64 border-gray-300 focus:border-navy-500">
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
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="flex-1">
                    <label htmlFor="startDate" className="sr-only">
                      Tanggal Mulai
                    </label>
                    <Input
                      id="startDate"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full border-gray-300 focus:border-navy-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="endDate" className="sr-only">
                      Tanggal Akhir
                    </label>
                    <Input
                      id="endDate"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full border-gray-300 focus:border-navy-500"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-sage-50 border-b">
              <CardTitle className="text-sm font-medium text-navy-700">Total Pemasukan</CardTitle>
              <TrendingUp className="h-4 w-4 text-sage-600" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-sage-600">{formatCurrency(totalStats.totalIncome)}</div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-rose-50 border-b">
              <CardTitle className="text-sm font-medium text-navy-700">Total Pengeluaran</CardTitle>
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-rose-500">{formatCurrency(totalStats.totalExpense)}</div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-navy-50 border-b">
              <CardTitle className="text-sm font-medium text-navy-700">Total Tabungan</CardTitle>
              <Brain className="h-4 w-4 text-navy-600" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-navy-600">{formatCurrency(totalStats.totalSavings)}</div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gold-50 border-b">
              <CardTitle className="text-sm font-medium text-navy-700">Saldo Bersih</CardTitle>
              <DollarSign className="h-4 w-4 text-gold-600" />
            </CardHeader>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${totalStats.netBalance >= 0 ? "text-sage-600" : "text-rose-500"}`}>
                {formatCurrency(totalStats.netBalance)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Trend Chart */}
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center space-x-2 text-navy-800">
                <BarChart3 className="h-5 w-5" />
                <span>Tren Bulanan</span>
              </CardTitle>
              <CardDescription>Perbandingan pemasukan dan pengeluaran per bulan</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {monthlyData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Belum ada data untuk periode ini</p>
                </div>
              ) : (
                <ChartContainer config={monthlyChartConfig} className="min-h-[300px]">
                  <LineChart
                    data={monthlyData}
                    margin={{
                      left: 12,
                      right: 12,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <ChartXAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} />
                    <ChartYAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value: number) => formatCurrency(value)}
                      tickMargin={8}
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                    <RechartsLegend /> {/* Use RechartsLegend */}
                    <Line
                      dataKey="income"
                      type="monotone"
                      stroke="var(--color-income)"
                      strokeWidth={2}
                      dot={<Dot r={4} fill="var(--color-income)" stroke="var(--color-income)" />}
                      activeDot={<Dot r={6} fill="var(--color-income)" stroke="var(--color-income)" />}
                    />
                    <Line
                      dataKey="expense"
                      type="monotone"
                      stroke="var(--color-expense)"
                      strokeWidth={2}
                      dot={<Dot r={4} fill="var(--color-expense)" stroke="var(--color-expense)" />}
                      activeDot={<Dot r={6} fill="var(--color-expense)" stroke="var(--color-expense)" />}
                    />
                    <Line
                      dataKey="balance"
                      type="monotone"
                      stroke="var(--color-balance)"
                      strokeWidth={2}
                      dot={<Dot r={4} fill="var(--color-balance)" stroke="var(--color-balance)" />}
                      activeDot={<Dot r={6} fill="var(--color-balance)" stroke="var(--color-balance)" />}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Expense Categories Chart */}
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center space-x-2 text-navy-800">
                <LucidePieChart className="h-5 w-5" />
                <span>Kategori Pengeluaran</span>
              </CardTitle>
              <CardDescription>Breakdown pengeluaran berdasarkan kategori</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {expenseCategories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Belum ada data pengeluaran</p>
                </div>
              ) : (
                <ChartContainer config={expenseChartConfig} className="min-h-[300px]">
                  <RechartsPieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          nameKey="category"
                          valueKey="amount"
                          formatter={(value: number) => formatCurrency(value)}
                        />
                      }
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
                    <RechartsLegend layout="vertical" verticalAlign="middle" align="right" />
                  </RechartsPieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Income Categories Chart */}
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center space-x-2 text-navy-800">
                <LucidePieChart className="h-5 w-5" />
                <span>Kategori Pemasukan</span>
              </CardTitle>
              <CardDescription>Breakdown pemasukan berdasarkan kategori</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {incomeCategories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Belum ada data pemasukan</p>
                </div>
              ) : (
                <ChartContainer config={incomeChartConfig} className="min-h-[300px]">
                  <RechartsPieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          nameKey="category"
                          valueKey="amount"
                          formatter={(value: number) => formatCurrency(value)}
                        />
                      }
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
                    <RechartsLegend layout="vertical" verticalAlign="middle" align="right" />
                  </RechartsPieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* AI Recommendations Card */}
          <Card className="lg:col-span-2 border-gray-200 shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-navy-800">
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
            <CardContent className="p-6">
              {aiLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Menganalisis data dan membuat rekomendasi...</p>
                </div>
              )}
              {!aiLoading && aiRecommendations && (
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p className="whitespace-pre-wrap">{aiRecommendations}</p>
                </div>
              )}
              {!aiLoading && !aiRecommendations && (
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
