"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Wallet, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { Footer } from "@/components/footer"

// Categories based on user type
const categoryOptions = {
  family: {
    income: ["Gaji", "Bonus", "Pasif Income", "Piutang", "Lainnya"],
    expense: ["Listrik", "Air", "Gas", "Hutang", "Biaya Sekolah", "Belanja", "Transport", "Lainnya"],
    savings: ["Tabungan Keluarga", "Dana Darurat", "Dana Cadangan"],
    debt: ["Hutang Bank", "Piutang", "Lainnya"],
  },
  personal: {
    income: ["Gaji", "Freelance", "Bonus", "Investasi", "Lainnya"],
    expense: ["Makan", "Transport", "Hiburan", "Belanja", "Tagihan", "Lainnya"],
    savings: ["Tabungan Pribadi", "Investasi", "Dana Darurat"],
    debt: ["Hutang Pribadi", "Piutang", "Lainnya"],
  },
  student: {
    income: ["Uang Saku", "Part Time", "Beasiswa", "Lainnya"],
    expense: ["Biaya Kuliah", "Buku", "Internet", "Makan", "Kost", "Transport", "Lainnya"],
    savings: ["Tabungan", "Dana Darurat"],
    debt: ["Utang Teman", "Utang Keluarga", "Pinjaman"],
  },
  trader: {
    income: ["Hasil Penjualan", "Keuntungan", "Lainnya"],
    expense: ["Modal Awal", "Stok Belanja", "Operasional", "Transport", "Lainnya"],
    savings: ["Tabungan Usaha", "Dana Cadangan"],
    debt: ["Hutang Supplier", "Piutang Customer"],
  },
  umkm: {
    income: ["Penjualan", "Pendapatan Lain", "Investasi"],
    expense: ["Bahan Baku", "Biaya Operasional", "Gaji Karyawan", "Sewa", "Listrik", "Transport", "Lainnya"],
    savings: ["Tabungan Usaha", "Dana Pengembangan"],
    debt: ["Hutang Bank", "Hutang Supplier", "Piutang Customer"],
  },
  entrepreneur: {
    income: ["Omzet", "Investasi", "Pendapatan Lain"],
    expense: ["Beban Produksi", "Gaji Karyawan", "Pajak", "Operasional", "Marketing", "Lainnya"],
    savings: ["Tabungan Bisnis", "Dana Ekspansi"],
    debt: ["Hutang Bank", "Piutang", "Investasi"],
  },
  business: {
    income: ["Omzet", "ROI", "Investasi", "Dividen"],
    expense: ["Beban Produksi", "Gaji", "Pajak", "Operasional", "R&D", "Marketing", "Lainnya"],
    savings: ["Tabungan Perusahaan", "Dana Investasi", "Dana Ekspansi"],
    debt: ["Hutang Bank", "Obligasi", "Piutang", "Investasi"],
  },
}

export default function AddTransactionPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    type: "income" as "income" | "expense" | "savings" | "debt",
    category: "",
    subcategory: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    if (!loading && !user) {
      toast.error("Sesi telah berakhir, silakan login kembali")
      router.push("/")
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error("Sesi tidak ditemukan, silakan login kembali")
      router.push("/")
      return
    }

    if (!formData.category || !formData.amount) {
      toast.error("Mohon lengkapi semua field yang wajib diisi")
      return
    }

    const amount = Number.parseFloat(formData.amount.replace(/\D/g, ""))
    if (isNaN(amount) || amount <= 0) {
      toast.error("Jumlah harus berupa angka yang valid dan lebih dari 0")
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: formData.type,
        category: formData.category,
        subcategory: formData.subcategory || null,
        amount: amount,
        description: formData.description || null,
        date: formData.date,
      })

      if (error) throw error

      toast.success("Transaksi berhasil ditambahkan!")
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Error adding transaction:", error)
      toast.error("Gagal menambahkan transaksi: " + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (value: string) => {
    const number = value.replace(/\D/g, "")
    return new Intl.NumberFormat("id-ID").format(Number.parseInt(number) || 0)
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    setFormData({ ...formData, amount: value })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sesi Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-4">Silakan login kembali untuk melanjutkan.</p>
          <Button onClick={() => router.push("/")} className="w-full">
            Kembali ke Login
          </Button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-yellow-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profil Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-4">Terjadi masalah dengan profil Anda. Silakan logout dan login kembali.</p>
          <div className="space-y-2">
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Kembali ke Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut()
                router.push("/")
              }}
              className="w-full bg-transparent"
            >
              Logout dan Login Ulang
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const userCategories = categoryOptions[profile.user_type as keyof typeof categoryOptions] || categoryOptions.personal
  const availableCategories = userCategories[formData.type] || []

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            <div className="flex items-center space-x-2">
              <div className="bg-white/10 p-2 rounded-lg shadow-md">
                <img src="/logo.png" alt="KeuanganPintar Pro" className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Tambah Transaksi</h1>
                <p className="text-sm text-gray-600">Catat transaksi keuangan Anda</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="h-5 w-5" />
                <span>Form Transaksi Baru</span>
              </CardTitle>
              <CardDescription>Isi detail transaksi yang ingin Anda catat</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Transaction Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">Jenis Transaksi *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, type: value, category: "", subcategory: "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis transaksi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">💰 Pemasukan</SelectItem>
                      <SelectItem value="expense">💸 Pengeluaran</SelectItem>
                      <SelectItem value="savings">🧠 Tabungan</SelectItem>
                      <SelectItem value="debt">📊 Hutang/Piutang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value, subcategory: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Category */}
                {formData.category === "Lainnya" && (
                  <div className="space-y-2">
                    <Label htmlFor="subcategory">Kategori Khusus *</Label>
                    <Input
                      id="subcategory"
                      type="text"
                      placeholder="Masukkan kategori khusus"
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      required
                    />
                  </div>
                )}

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Jumlah (Rp) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                    <Input
                      id="amount"
                      type="text"
                      placeholder="0"
                      value={formatCurrency(formData.amount)}
                      onChange={handleAmountChange}
                      className="pl-10"
                      required
                    />
                  </div>
                  {formData.amount && (
                    <p className="text-sm text-blue-600 font-medium">
                      Rp {new Intl.NumberFormat("id-ID").format(Number.parseInt(formData.amount) || 0)}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Keterangan</Label>
                  <Textarea
                    id="description"
                    placeholder="Tambahkan keterangan (opsional)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex space-x-4">
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting ? "Menyimpan..." : "Simpan Transaksi"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                    disabled={submitting}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}
