"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, User, GraduationCap, ShoppingCart, Building2, TrendingUp, Briefcase } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { Footer } from "@/components/footer"

const userTypes = [
  {
    id: "family",
    title: "Keuangan Keluarga",
    description: "Kelola keuangan rumah tangga dengan fitur lengkap untuk keluarga",
    icon: Users,
    color: "bg-blue-500",
  },
  {
    id: "personal",
    title: "Keuangan Pribadi",
    description: "Catat pemasukan, pengeluaran, dan tabungan pribadi",
    icon: User,
    color: "bg-green-500",
  },
  {
    id: "student",
    title: "Siswa/Mahasiswa",
    description: "Kelola uang saku, biaya kuliah, dan pengeluaran harian",
    icon: GraduationCap,
    color: "bg-purple-500",
  },
  {
    id: "trader",
    title: "Pedagang",
    description: "Catat modal, stok, penjualan, dan keuntungan harian",
    icon: ShoppingCart,
    color: "bg-orange-500",
  },
  {
    id: "umkm",
    title: "UMKM",
    description: "Laporan keuangan lengkap untuk usaha kecil menengah",
    icon: Building2,
    color: "bg-red-500",
  },
  {
    id: "entrepreneur",
    title: "Pengusaha",
    description: "Analisis omzet, arus kas, dan laporan laba rugi",
    icon: TrendingUp,
    color: "bg-indigo-500",
  },
  {
    id: "business",
    title: "Pebisnis",
    description: "Fitur lengkap multi-divisi dengan proyeksi pertumbuhan",
    icon: Briefcase,
    color: "bg-pink-500",
  },
]

interface ProfileCompletionProps {
  onComplete: () => void
}

export function ProfileCompletion({ onComplete }: ProfileCompletionProps) {
  const { user, profile, updateProfile } = useAuth() // Use updateProfile from useAuth
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || "",
    userType: profile?.user_type || "personal",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fullName.trim()) {
      toast.error("Nama lengkap wajib diisi")
      return
    }

    setLoading(true)
    try {
      const success = await updateProfile({
        full_name: formData.fullName.trim(),
        user_type: formData.userType as any,
        email: user?.email || "",
      })

      if (success) {
        toast.success("Profil berhasil dilengkapi!")
        onComplete()
      } else {
        toast.error("Gagal melengkapi profil")
      }
    } catch (error) {
      console.error("Profile completion error:", error)
      toast.error("Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <Card>
            <CardHeader className="text-center">
              <div className="bg-navy-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <img src="/logo.png" alt="KeuanganPintar Pro" className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl">Lengkapi Profil Anda</CardTitle>
              <CardDescription>
                Selamat datang! Mari lengkapi profil Anda untuk pengalaman yang lebih personal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nama Lengkap *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Masukkan nama lengkap Anda"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>

                {/* User Type Selection */}
                <div className="space-y-3">
                  <Label>Kategori Keuangan *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {userTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <Card
                          key={type.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            formData.userType === type.id ? "ring-2 ring-blue-500 shadow-md" : ""
                          }`}
                          onClick={() => setFormData({ ...formData, userType: type.id })}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center space-x-3">
                              <div className={`${type.color} p-2 rounded-lg`}>
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium text-sm">{type.title}</h3>
                                <p className="text-xs text-gray-600">{type.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Menyimpan..." : "Lengkapi Profil"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}
