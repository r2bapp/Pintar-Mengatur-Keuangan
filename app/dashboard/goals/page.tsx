"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress" // Assuming Progress component exists or will be added
import { ArrowLeft, Target, Plus, Edit, Trash2, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { Footer } from "@/components/footer"

interface FinancialGoal {
  id: string
  user_id: string
  goal_type: string
  target_amount: number
  current_amount: number
  target_date: string | null
  created_at: string
}

export default function FinancialGoalsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [formLoading, setFormLoading] = useState(false)
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null)
  const [formData, setFormData] = useState({
    goal_type: "",
    target_amount: "",
    current_amount: "",
    target_date: "",
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
      return
    }
    if (user) {
      fetchGoals()
    }
  }, [user, loading, router])

  const fetchGoals = async () => {
    if (!user) return
    setFormLoading(true)
    try {
      const { data, error } = await supabase
        .from("financial_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setGoals(data || [])
    } catch (error) {
      console.error("Error fetching goals:", error)
      toast.error("Gagal memuat tujuan keuangan")
    } finally {
      setFormLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const formatCurrencyInput = (value: string) => {
    const number = value.replace(/\D/g, "")
    return new Intl.NumberFormat("id-ID").format(Number.parseInt(number) || 0)
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, field: "target_amount" | "current_amount") => {
    const value = e.target.value.replace(/\D/g, "")
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error("Sesi tidak ditemukan")
      router.push("/")
      return
    }

    const targetAmount = Number.parseFloat(formData.target_amount.replace(/\D/g, ""))
    const currentAmount = Number.parseFloat(formData.current_amount.replace(/\D/g, "") || "0")

    if (!formData.goal_type || isNaN(targetAmount) || targetAmount <= 0) {
      toast.error("Mohon lengkapi jenis tujuan dan jumlah target yang valid.")
      return
    }

    setFormLoading(true)
    try {
      if (editingGoal) {
        // Update existing goal
        const { error } = await supabase
          .from("financial_goals")
          .update({
            goal_type: formData.goal_type,
            target_amount: targetAmount,
            current_amount: currentAmount,
            target_date: formData.target_date || null,
          })
          .eq("id", editingGoal.id)

        if (error) throw error
        toast.success("Tujuan berhasil diperbarui!")
      } else {
        // Add new goal
        const { error } = await supabase.from("financial_goals").insert({
          user_id: user.id,
          goal_type: formData.goal_type,
          target_amount: targetAmount,
          current_amount: currentAmount,
          target_date: formData.target_date || null,
        })

        if (error) throw error
        toast.success("Tujuan baru berhasil ditambahkan!")
      }

      setFormData({ goal_type: "", target_amount: "", current_amount: "", target_date: "" })
      setEditingGoal(null)
      fetchGoals()
    } catch (error: any) {
      console.error("Error saving goal:", error)
      toast.error("Gagal menyimpan tujuan: " + error.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (goal: FinancialGoal) => {
    setEditingGoal(goal)
    setFormData({
      goal_type: goal.goal_type,
      target_amount: goal.target_amount.toString(),
      current_amount: goal.current_amount.toString(),
      target_date: goal.target_date || "",
    })
  }

  const handleDelete = async (goalId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tujuan ini?")) return
    setFormLoading(true)
    try {
      const { error } = await supabase.from("financial_goals").delete().eq("id", goalId)
      if (error) throw error
      toast.success("Tujuan berhasil dihapus!")
      fetchGoals()
    } catch (error: any) {
      console.error("Error deleting goal:", error)
      toast.error("Gagal menghapus tujuan: " + error.message)
    } finally {
      setFormLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat tujuan keuangan...</p>
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
                className="text-gold-900 hover:bg-navy-500"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <div className="flex items-center space-x-2">
                <div className="bg-white/10 p-2 rounded-lg shadow-md">
                  <img src="/logo.png" alt="KeuanganPintar Pro" className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-navy-900">Tujuan Keuangan</h1>
                  <p className="text-sm text-navy-900">Rencanakan dan capai impian finansial Anda</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Add/Edit Goal Form */}
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center space-x-2 text-navy-800">
                <Target className="h-5 w-5" />
                <span>{editingGoal ? "Edit Tujuan Keuangan" : "Tambah Tujuan Baru"}</span>
              </CardTitle>
              <CardDescription>
                {editingGoal ? "Perbarui detail tujuan Anda" : "Tetapkan tujuan finansial baru Anda"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="goal_type">Jenis Tujuan *</Label>
                    <Input
                      id="goal_type"
                      type="text"
                      placeholder="Contoh: Beli Rumah, Dana Pendidikan"
                      value={formData.goal_type}
                      onChange={handleInputChange}
                      required
                      disabled={formLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target_amount">Jumlah Target (Rp) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                      <Input
                        id="target_amount"
                        type="text"
                        placeholder="0"
                        value={formatCurrencyInput(formData.target_amount)}
                        onChange={(e) => handleAmountChange(e, "target_amount")}
                        className="pl-10"
                        required
                        disabled={formLoading}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_amount">Jumlah Saat Ini (Rp)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                      <Input
                        id="current_amount"
                        type="text"
                        placeholder="0"
                        value={formatCurrencyInput(formData.current_amount)}
                        onChange={(e) => handleAmountChange(e, "current_amount")}
                        className="pl-10"
                        disabled={formLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target_date">Tanggal Target</Label>
                    <Input
                      id="target_date"
                      type="date"
                      value={formData.target_date}
                      onChange={handleInputChange}
                      disabled={formLoading}
                    />
                  </div>
                </div>
                <div className="flex space-x-4">
                  <Button type="submit" className="flex-1 bg-navy-600 hover:bg-navy-700" disabled={formLoading}>
                    {formLoading ? "Menyimpan..." : editingGoal ? "Perbarui Tujuan" : "Tambah Tujuan"}
                  </Button>
                  {editingGoal && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingGoal(null)
                        setFormData({ goal_type: "", target_amount: "", current_amount: "", target_date: "" })
                      }}
                      disabled={formLoading}
                    >
                      Batal Edit
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* List of Goals */}
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center space-x-2 text-navy-800">
                <Target className="h-5 w-5" />
                <span>Daftar Tujuan Anda</span>
              </CardTitle>
              <CardDescription>Semua tujuan finansial yang sedang Anda kejar</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {goals.length === 0 ? (
                <div className="text-center py-8">
                  <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Target className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-4">Belum ada tujuan keuangan yang ditetapkan.</p>
                  <Button onClick={() => setEditingGoal(null)} className="bg-navy-600 hover:bg-navy-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Tujuan Pertama
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {goals.map((goal) => {
                    const progress = Math.min(100, (goal.current_amount / goal.target_amount) * 100)
                    const isCompleted = goal.current_amount >= goal.target_amount
                    return (
                      <Card key={goal.id} className="border-gray-200">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-navy-800">{goal.goal_type}</h3>
                            <div className="flex items-center space-x-2">
                              {isCompleted && <CheckCircle className="h-5 w-5 text-green-600" />}
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(goal)}>
                                <Edit className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(goal.id)}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Target:</span> {formatCurrency(goal.target_amount)}
                            </div>
                            <div>
                              <span className="font-medium">Terkumpul:</span> {formatCurrency(goal.current_amount)}
                            </div>
                            {goal.target_date && (
                              <div>
                                <span className="font-medium">Tanggal Target:</span>{" "}
                                {new Date(goal.target_date).toLocaleDateString("id-ID")}
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-gray-500 text-right">{progress.toFixed(1)}% tercapai</p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
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
