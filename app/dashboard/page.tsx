"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Brain,
  Plus,
  LogOut,
  BarChart3,
  RefreshCw,
  Upload,
  Target,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { ProfileCompletion } from "@/components/profile-completion"
import { Footer } from "@/components/footer"
import { CardsSkeleton, ListSkeleton } from "@/components/loading-skeletons"

interface Transaction {
  id: string
  category: string
  subcategory: string | null
  type: "income" | "expense" | "savings" | "debt"
  amount: number
  description: string | null
  date: string
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, loading, refetch, signOut } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    totalSavings: 0,
    currentBalance: 0,
  })
  const [dataLoading, setDataLoading] = useState(true)
  const [showProfileCompletion, setShowProfileCompletion] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
      return
    }
    if (user && profile) {
      if (!profile.full_name || profile.full_name.trim() === "") {
        setShowProfileCompletion(true)
        setDataLoading(false)
        return
      }
      fetchTransactions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, loading])

  const fetchTransactions = async () => {
    if (!user) return
    setDataLoading(true)
    try {
      const currentDate = new Date()
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      const startStr = firstDay.toISOString().slice(0, 10)
      const endStr = lastDay.toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startStr)
        .lte("date", endStr)
        .order("created_at", { ascending: false })

      if (error) throw error

      const rows = data || []
      setTransactions(rows)

      const income = rows.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0)
      const expense = rows.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0)
      const savings = rows.filter((t) => t.type === "savings").reduce((sum, t) => sum + Number(t.amount), 0)

      setStats({
        totalIncome: income,
        totalExpense: expense,
        totalSavings: savings,
        currentBalance: income - expense,
      })
    } catch (error) {
      console.error("Error fetching transactions:", error)
      toast.error("Gagal memuat transaksi")
    } finally {
      setDataLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)

  const handleAddTransaction = () => router.push("/dashboard/transactions")
  const handleViewReports = () => router.push("/dashboard/reports")
  const handleRefresh = () => {
    fetchTransactions()
    toast.success("Data berhasil diperbarui")
  }
  const handleProfileCompletionComplete = () => {
    setShowProfileCompletion(false)
    refetch()
    fetchTransactions()
  }

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-navy-gradient sticky top-0 z-20 shadow-sm border-b border-navy-200">
          <div className="container mx-auto px-3 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-white text-base sm:text-lg font-semibold">KeuanganPintar Pro</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-3 py-6 space-y-6">
          <CardsSkeleton count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
              <div className="rounded-lg border bg-card p-4">
                <div className="h-5 w-40 bg-muted rounded animate-pulse mb-4" />
                <ListSkeleton rows={5} />
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="h-5 w-36 bg-muted rounded animate-pulse mb-4" />
              <div className="space-y-3">
                <div className="h-10 w-full bg-muted rounded animate-pulse" />
                <div className="h-10 w-full bg-muted rounded animate-pulse" />
                <div className="h-10 w-full bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-xl font-semibold text-navy-900 mb-2">Sesi Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-4">Silakan login kembali untuk melanjutkan.</p>
          <Button onClick={() => router.push("/")} className="w-full bg-navy-600 hover:bg-navy-700">
            Kembali ke Halaman Login
          </Button>
        </div>
      </div>
    )
  }

  if (showProfileCompletion) {
    return <ProfileCompletion onComplete={handleProfileCompletionComplete} />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-navy-gradient shadow-lg border-b border-navy-200 sticky top-0 z-20">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg">
                <img src="/logo.png" alt="KeuanganPintar Pro" className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">KeuanganPintar Pro</h1>
                <p className="text-xs sm:text-sm text-sage-100">
                  Selamat datang, {profile?.full_name || user?.email?.split("@")[0] || "User"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" size="sm" onClick={handleRefresh} className="text-white hover:bg-black/10">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-white hover:bg-black/10">
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-sage-50 border-b">
              <CardTitle className="text-sm font-medium text-navy-700">Total Pemasukan</CardTitle>
              <TrendingUp className="h-4 w-4 text-sage-600" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-xl sm:text-2xl font-bold text-sage-600">{formatCurrency(stats.totalIncome)}</div>
              <p className="text-xs text-muted-foreground">Bulan ini</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-rose-50 border-b">
              <CardTitle className="text-sm font-medium text-navy-700">Total Pengeluaran</CardTitle>
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-xl sm:text-2xl font-bold text-rose-500">{formatCurrency(stats.totalExpense)}</div>
              <p className="text-xs text-muted-foreground">Bulan ini</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-navy-50 border-b">
              <CardTitle className="text-sm font-medium text-navy-700">Saldo Saat Ini</CardTitle>
              <Wallet className="h-4 w-4 text-navy-600" />
            </CardHeader>
            <CardContent className="p-4">
              <div
                className={`text-xl sm:text-2xl font-bold ${stats.currentBalance >= 0 ? "text-sage-600" : "text-rose-500"}`}
              >
                {formatCurrency(stats.currentBalance)}
              </div>
              <p className="text-xs text-muted-foreground">Pemasukan - Pengeluaran</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gold-50 border-b">
              <CardTitle className="text-sm font-medium text-navy-700">Tabungan</CardTitle>
              <Brain className="h-4 w-4 text-gold-600" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-xl sm:text-2xl font-bold text-gold-600">{formatCurrency(stats.totalSavings)}</div>
              <p className="text-xs text-muted-foreground">Total tabungan</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Transactions */}
          <Card className="lg:col-span-2 border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-navy-800">Transaksi Terbaru</CardTitle>
                  <CardDescription>
                    {transactions.length > 0 ? `${transactions.length} transaksi bulan ini` : "Belum ada transaksi"}
                  </CardDescription>
                </div>
                <Button size="sm" onClick={handleAddTransaction} className="bg-navy-600 hover:bg-navy-700">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Tambah Transaksi
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {transactions.length === 0 ? (
                <div className="text-center py-10">
                  <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Wallet className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-4">Belum ada transaksi bulan ini</p>
                  <Button onClick={handleAddTransaction} className="bg-navy-600 hover:bg-navy-700">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Tambah Transaksi Pertama
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            t.type === "income"
                              ? "bg-sage-100"
                              : t.type === "expense"
                                ? "bg-rose-100"
                                : t.type === "savings"
                                  ? "bg-navy-100"
                                  : "bg-gold-100"
                          }`}
                        >
                          {t.type === "income" ? (
                            <TrendingUp className="h-4 w-4 text-sage-600" />
                          ) : t.type === "expense" ? (
                            <TrendingDown className="h-4 w-4 text-rose-500" />
                          ) : t.type === "savings" ? (
                            <Brain className="h-4 w-4 text-navy-600" />
                          ) : (
                            <BarChart3 className="h-4 w-4 text-gold-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-navy-800">{t.subcategory || t.category}</p>
                          <p className="text-xs sm:text-sm text-gray-600">{t.description || "Tidak ada keterangan"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            t.type === "income"
                              ? "text-sage-600"
                              : t.type === "expense"
                                ? "text-rose-500"
                                : t.type === "savings"
                                  ? "text-navy-600"
                                  : "text-gold-600"
                          }`}
                        >
                          {t.type === "expense" ? "-" : "+"}
                          {formatCurrency(Number(t.amount))}
                        </p>
                        <p className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString("id-ID")}</p>
                      </div>
                    </div>
                  ))}
                  {transactions.length > 5 && (
                    <div className="text-center pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-navy-200 text-navy-600 hover:bg-navy-50 bg-transparent"
                      >
                        Lihat Semua Transaksi ({transactions.length})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-navy-800">Aksi Cepat</CardTitle>
              <CardDescription>Fitur yang sering digunakan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6">
              <Button className="w-full justify-start bg-navy-600 hover:bg-navy-700" onClick={handleAddTransaction}>
                <Plus className="h-4 w-4 mr-1.5" />
                Tambah Transaksi
              </Button>
              <Button className="w-full justify-start bg-sage-600 hover:bg-sage-700" onClick={handleViewReports}>
                <BarChart3 className="h-4 w-4 mr-1.5" />
                Lihat Laporan
              </Button>
              <Button
                className="w-full justify-start bg-gold-600 hover:bg-gold-700"
                onClick={() => router.push("/dashboard/goals")}
              >
                <Target className="h-4 w-4 mr-1.5" />
                Tujuan Keuangan
              </Button>
              <Button
                className="w-full justify-start bg-transparent border-gray-300 text-navy-600 hover:bg-navy-50"
                variant="outline"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Refresh Data
              </Button>
              <Button
                className="w-full justify-start bg-gold-600 hover:bg-gold-700"
                onClick={() => router.push("/dashboard/import")}
              >
                <Upload className="h-4 w-4 mr-1.5" />
                Import Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}
