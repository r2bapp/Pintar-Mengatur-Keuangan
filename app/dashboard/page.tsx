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
} from "lucide-react" // Added Target, Bot
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { ProfileCompletion } from "@/components/profile-completion"
import { Footer } from "@/components/footer"

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
  const { user, profile, loading, refetch, signOut } = useAuth() // Use signOut from useAuth
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
      // Check if profile needs completion
      if (!profile.full_name || profile.full_name.trim() === "") {
        setShowProfileCompletion(true)
        setDataLoading(false)
        return
      }

      fetchTransactions()
    }
  }, [user, profile, loading, router])

  const fetchTransactions = async () => {
    if (!user) return

    setDataLoading(true)
    try {
      // Get current month transactions
      const currentDate = new Date()
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", firstDay.toISOString().split("T")[0])
        .lte("date", lastDay.toISOString().split("T")[0])
        .order("created_at", { ascending: false })

      if (error) throw error

      setTransactions(data || [])

      // Calculate stats
      const income = data?.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0) || 0
      const expense = data?.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0) || 0
      const savings = data?.filter((t) => t.type === "savings").reduce((sum, t) => sum + Number(t.amount), 0) || 0

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
    await signOut() // Use signOut from useAuth hook
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleAddTransaction = () => {
    router.push("/dashboard/transactions")
  }

  const handleViewReports = () => {
    router.push("/dashboard/reports")
  }

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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

  // Show profile completion if needed
  if (showProfileCompletion) {
    return <ProfileCompletion onComplete={handleProfileCompletionComplete} />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-navy-gradient shadow-lg border-b border-navy-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 p-2 rounded-lg shadow-md">
                <img src="/logo.png" alt="KeuanganPintar Pro" className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">KeuanganPintar Pro</h1>
                <p className="text-sm text-sage-100">
                  Selamat datang, {profile?.full_name || user?.email?.split("@")[0] || "User"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleRefresh} className="text-white hover:bg-navy-700">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-white hover:bg-navy-700">
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-sage-50 border-b">
              <CardTitle className="text-sm font-medium text-navy-700">Total Pemasukan</CardTitle>
              <TrendingUp className="h-4 w-4 text-sage-600" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-sage-600">{formatCurrency(stats.totalIncome)}</div>
              <p className="text-xs text-muted-foreground">Bulan ini</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-rose-50 border-b">
              <CardTitle className="text-sm font-medium text-navy-700">Total Pengeluaran</CardTitle>
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-rose-500">{formatCurrency(stats.totalExpense)}</div>
              <p className="text-xs text-muted-foreground">Bulan ini</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-navy-50 border-b">
              <CardTitle className="text-sm font-medium text-navy-700">Saldo Saat Ini</CardTitle>
              <Wallet className="h-4 w-4 text-navy-600" />
            </CardHeader>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${stats.currentBalance >= 0 ? "text-sage-600" : "text-rose-500"}`}>
                {formatCurrency(stats.currentBalance)}
              </div>
              <p className="text-xs text-muted-foreground">Pemasukan - Pengeluaran</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gold-50 border-b">
              <CardTitle className="text-sm font-medium text-navy-700">Tabungan</CardTitle>
              <Brain className="h-4 w-4 text-gold-600" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gold-600">{formatCurrency(stats.totalSavings)}</div>
              <p className="text-xs text-muted-foreground">Total tabungan</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Transactions */}
          <Card className="lg:col-span-2 border-gray-200 shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-navy-800">Transaksi Terbaru</CardTitle>
                  <CardDescription>
                    {transactions.length > 0 ? `${transactions.length} transaksi bulan ini` : "Belum ada transaksi"}
                  </CardDescription>
                </div>
                <Button size="sm" onClick={handleAddTransaction} className="bg-navy-600 hover:bg-navy-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Transaksi
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Wallet className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-4">Belum ada transaksi bulan ini</p>
                  <Button onClick={handleAddTransaction} className="bg-navy-600 hover:bg-navy-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Transaksi Pertama
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-full ${
                            transaction.type === "income"
                              ? "bg-sage-100"
                              : transaction.type === "expense"
                                ? "bg-rose-100"
                                : transaction.type === "savings"
                                  ? "bg-navy-100"
                                  : "bg-gold-100"
                          }`}
                        >
                          {transaction.type === "income" ? (
                            <TrendingUp className="h-4 w-4 text-sage-600" />
                          ) : transaction.type === "expense" ? (
                            <TrendingDown className="h-4 w-4 text-rose-500" />
                          ) : transaction.type === "savings" ? (
                            <Brain className="h-4 w-4 text-navy-600" />
                          ) : (
                            <BarChart3 className="h-4 w-4 text-gold-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-navy-800">{transaction.subcategory || transaction.category}</p>
                          <p className="text-sm text-gray-600">{transaction.description || "Tidak ada keterangan"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            transaction.type === "income"
                              ? "text-sage-600"
                              : transaction.type === "expense"
                                ? "text-rose-500"
                                : transaction.type === "savings"
                                  ? "text-navy-600"
                                  : "text-gold-600"
                          }`}
                        >
                          {transaction.type === "expense" ? "-" : "+"}
                          {formatCurrency(Number(transaction.amount))}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                    </div>
                  ))}
                  {transactions.length > 5 && (
                    <div className="text-center pt-4">
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
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-navy-800">Aksi Cepat</CardTitle>
              <CardDescription>Fitur yang sering digunakan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-6">
              <Button className="w-full justify-start bg-navy-600 hover:bg-navy-700" onClick={handleAddTransaction}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Transaksi
              </Button>
              <Button className="w-full justify-start bg-sage-600 hover:bg-sage-700" onClick={handleViewReports}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Lihat Laporan
              </Button>
              <Button
                className="w-full justify-start bg-gold-600 hover:bg-gold-700"
                onClick={() => router.push("/dashboard/goals")} // Link to Financial Goals
              >
                <Target className="h-4 w-4 mr-2" />
                Tujuan Keuangan
              </Button>
              <Button
                className="w-full justify-start bg-transparent border-gray-300 text-navy-600 hover:bg-navy-50"
                variant="outline"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
              <Button
                className="w-full justify-start bg-gold-600 hover:bg-gold-700"
                onClick={() => router.push("/dashboard/import")}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message for New Users */}
        {transactions.length === 0 && (
          <Card className="mt-8 bg-gradient-to-r from-navy-50 to-sage-50 border-navy-200 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="bg-gold-gradient rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <Wallet className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-navy-900 mb-2">Selamat datang di KeuanganPintar Pro!</h3>
                <p className="text-gray-600 mb-4 max-w-md mx-auto">
                  Mulai kelola keuangan Anda dengan menambahkan transaksi pertama. Data akan tersimpan secara real-time
                  dan dapat diakses kapan saja.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={handleAddTransaction} className="bg-navy-gradient hover:bg-navy-800 shadow-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Transaksi Pertama
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleViewReports}
                    className="border-navy-300 text-navy-600 hover:bg-navy-50 bg-transparent"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Lihat Laporan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  )
}
