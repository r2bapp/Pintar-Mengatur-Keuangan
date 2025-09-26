"use client"

import dynamic from "next/dynamic"
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
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { Footer } from "@/components/footer"
import type { ChartConfig } from "@/components/ui/chart"

// Lazy-load heavy charts to improve initial load time
const MonthlyTrendChart = dynamic(() => import("@/components/charts/monthly-trend-chart"), { ssr: false })
const PieBreakdownChart = dynamic(() => import("@/components/charts/pie-breakdown"), { ssr: false })

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

// Format YYYY-MM-DD using local time (avoid UTC shift)
const formatDateLocal = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function ReportsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
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

  const [monthlyChartConfig] = useState<ChartConfig>({
    income: { label: "Pemasukan", color: "hsl(var(--chart-1))" },
    expense: { label: "Pengeluaran", color: "hsl(var(--chart-4))" },
    balance: { label: "Saldo", color: "hsl(var(--chart-3))" },
  })

  const [expenseChartConfig, setExpenseChartConfig] = useState<ChartConfig>({})
  const [incomeChartConfig, setIncomeChartConfig] = useState<ChartConfig>({})

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
    try {
      let startDate: Date
      let endDate: Date = new Date()

      // Determine date range
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

      endDate.setHours(23, 59, 59, 999)

      // Use local date formatting to avoid UTC shifts
      const from = formatDateLocal(startDate)
      const to = formatDateLocal(endDate)

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: true })

      if (error) throw error

      const list = transactions || []
      setRawTransactions(list)
      processMonthlyData(list, startDate, endDate)
      processCategoryData(list)
      calculateTotalStats(list)
    } catch (error) {
      console.error("Error fetching report data:", error)
      toast.error("Gagal memuat data laporan")
    } finally {
      setReportLoading(false)
    }
  }

  const processMonthlyData = (transactions: any[], startDate: Date, endDate: Date) => {
    const monthlyMap = new Map<string, MonthlyData>()
    const current = new Date(startDate)

    // Initialize months
    while (current <= endDate) {
      const monthKey = current.toISOString().slice(0, 7) // YYYY-MM (safe for grouping)
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

    // Aggregate by month
    for (const t of transactions) {
      const dateStr: string = typeof t.date === "string" ? t.date : formatDateLocal(new Date(t.date))
      const monthKey = dateStr.slice(0, 7)
      const monthData = monthlyMap.get(monthKey)
      if (!monthData) continue

      const amount = Number(t.amount) || 0
      switch (t.type) {
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

    setMonthlyData(Array.from(monthlyMap.values()))
  }

  const processCategoryData = (transactions: any[]) => {
    const expenseMap = new Map<string, number>()
    const incomeMap = new Map<string, number>()

    let totalExpense = 0
    let totalIncome = 0

    for (const t of transactions) {
      const amount = Number(t.amount) || 0
      const category = t.subcategory || t.category || "Lainnya"

      if (t.type === "expense") {
        expenseMap.set(category, (expenseMap.get(category) || 0) + amount)
        totalExpense += amount
      } else if (t.type === "income") {
        incomeMap.set(category, (incomeMap.get(category) || 0) + amount)
        totalIncome += amount
      }
    }

    const colors = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))",
      "hsl(var(--chart-6))",
      "#2f855a",
      "#38a169",
      "#48bb78",
      "#68d391",
    ]

    const expenseArr: CategoryData[] = Array.from(expenseMap.entries())
      .map(([category, amount], index) => ({
        category,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)

    const incomeArr: CategoryData[] = Array.from(incomeMap.entries())
      .map(([category, amount], index) => ({
        category,
        amount,
        percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)

    setExpenseCategories(expenseArr)
    setIncomeCategories(incomeArr)

    // Update chart configs
    setExpenseChartConfig(
      expenseArr.reduce((acc, cat) => {
        acc[cat.category.replace(/\s+/g, "-").toLowerCase()] = {
          label: cat.category,
          color: cat.color,
        }
        return acc
      }, {} as ChartConfig),
    )

    setIncomeChartConfig(
      incomeArr.reduce((acc, cat) => {
        acc[cat.category.replace(/\s+/g, "-").toLowerCase()] = {
          label: cat.category,
          color: cat.color,
        }
        return acc
      }, {} as ChartConfig),
    )
  }

  const calculateTotalStats = (transactions: any[]) => {
    const stats = transactions.reduce(
      (acc, t) => {
        const amount = Number(t.amount) || 0
        switch (t.type) {
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

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }, [])

  const exportToPDF = () => {
    toast.info("Fitur ekspor ke PDF belum tersedia.")
  }

  const exportToExcel = () => {
    toast.info("Fitur ekspor ke Excel belum tersedia.")
  }

  const exportToJSON = () => {
    toast.info("Fitur ekspor ke JSON belum tersedia.")
  }

  if (loading || reportLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-700 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat laporan...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Sesi tidak ditemukan</p>
          <Button onClick={() => router.push("/")} className="bg-emerald-700 hover:bg-emerald-800">
            Kembali ke Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-green-gradient shadow-sm border-b">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                <span className="hidden xs:inline">Kembali</span>
              </Button>
              <div className="flex items-center gap-2 min-w-0">
                <div className="bg-white/10 p-1.5 sm:p-2 rounded-lg shadow-md shrink-0">
                  <img src="/logo.png" alt="KeuanganPintar Pro" className="h-5 w-5" />
                </div>
                <div className="truncate">
                  <h1 className="text-base sm:text-xl font-bold text-white leading-tight">Laporan Keuangan</h1>
                  <p className="text-xs sm:text-sm text-white/80 truncate">Analisis dan insight keuangan Anda</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 shrink-0"
              >
                <FileText className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">PDF</span>
                <span className="sm:hidden">PDF</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 shrink-0"
              >
                <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Excel</span>
                <span className="sm:hidden">XLSX</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToJSON}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 shrink-0"
              >
                <Download className="h-4 w-4 mr-1.5" />
                <span>JSON</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 w-full max-w-7xl">
        {/* Period Selection */}
        <div className="mb-6 sm:mb-8">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-muted/30 border-b px-3 sm:px-6 py-3">
              <CardTitle className="flex items-center gap-2 text-emerald-900 text-sm sm:text-base">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Periode Laporan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
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
                  <SelectTrigger className="w-full sm:w-64">
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
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 w-full">
                    <Input
                      id="startDate"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                    <Input
                      id="endDate"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-emerald-50 border-b px-3 sm:px-4 py-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-emerald-900">Total Pemasukan</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-700" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-emerald-800">
                {formatCurrency(totalStats.totalIncome)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-rose-50 border-b px-3 sm:px-4 py-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-emerald-900">Total Pengeluaran</CardTitle>
              <TrendingDown className="h-4 w-4 text-rose-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-rose-600">
                {formatCurrency(totalStats.totalExpense)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-emerald-50 border-b px-3 sm:px-4 py-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-emerald-900">Total Tabungan</CardTitle>
              <Brain className="h-4 w-4 text-emerald-700" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-emerald-800">
                {formatCurrency(totalStats.totalSavings)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-emerald-50 border-b px-3 sm:px-4 py-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-emerald-900">Saldo Bersih</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-700" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div
                className={`text-xl sm:text-2xl font-bold ${totalStats.netBalance >= 0 ? "text-emerald-800" : "text-rose-600"}`}
              >
                {formatCurrency(totalStats.netBalance)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Monthly Trend Chart */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-muted/30 border-b px-3 sm:px-6 py-3">
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <BarChart3 className="h-5 w-5" />
                <span>Tren Bulanan</span>
              </CardTitle>
              <CardDescription>Perbandingan pemasukan dan pengeluaran per bulan</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {monthlyData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Belum ada data untuk periode ini</p>
                </div>
              ) : (
                <MonthlyTrendChart
                  data={monthlyData}
                  config={monthlyChartConfig}
                  formatCurrency={formatCurrency}
                  className="min-h-[300px]"
                />
              )}
            </CardContent>
          </Card>

          {/* Expense Categories Chart */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-muted/30 border-b px-3 sm:px-6 py-3">
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <LucidePieChart className="h-5 w-5" />
                <span>Kategori Pengeluaran</span>
              </CardTitle>
              <CardDescription>Breakdown pengeluaran berdasarkan kategori</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {expenseCategories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Belum ada data pengeluaran</p>
                </div>
              ) : (
                <PieBreakdownChart
                  data={expenseCategories}
                  config={expenseChartConfig}
                  formatCurrency={formatCurrency}
                  className="min-h-[300px]"
                />
              )}
            </CardContent>
          </Card>

          {/* Income Categories Chart */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-muted/30 border-b px-3 sm:px-6 py-3">
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <LucidePieChart className="h-5 w-5" />
                <span>Kategori Pemasukan</span>
              </CardTitle>
              <CardDescription>Breakdown pemasukan berdasarkan kategori</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {incomeCategories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Belum ada data pemasukan</p>
                </div>
              ) : (
                <PieBreakdownChart
                  data={incomeCategories}
                  config={incomeChartConfig}
                  formatCurrency={formatCurrency}
                  className="min-h-[300px]"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}
