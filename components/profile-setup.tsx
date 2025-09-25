"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Users, User, GraduationCap, ShoppingCart, Building2, TrendingUp, Briefcase } from "lucide-react"
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

interface ProfileSetupProps {
  onComplete: () => void
}

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const { user } = useAuth()
  const [selectedUserType, setSelectedUserType] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedUserType || !fullName.trim()) {
      toast.error("Mohon lengkapi semua field")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from("user_profiles").insert({
        id: user.id,
        email: user.email || "",
        full_name: fullName.trim(),
        user_type: selectedUserType as any,
      })

      if (error) throw error

      toast.success("Profil berhasil dibuat!")
      onComplete()
    } catch (error: any) {
      console.error("Profile creation error:", error)
      toast.error("Gagal membuat profil: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Lengkapi Profil Anda</CardTitle>
              <CardDescription>Pilih kategori keuangan dan lengkapi informasi profil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* User Type Selection */}
                <div>
                  <Label className="text-base font-medium">Pilih Kategori Keuangan</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                    {userTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <Card
                          key={type.id}
                          className={`cursor-pointer transition-all hover:shadow-lg ${
                            selectedUserType === type.id ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-md"
                          }`}
                          onClick={() => setSelectedUserType(type.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <div className={`${type.color} p-2 rounded-lg`}>
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-sm">{type.title}</h3>
                                <p className="text-xs text-gray-600 mt-1">{type.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>

                {/* Full Name Input */}
                <div>
                  <Label htmlFor="fullName">Nama Lengkap</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Masukkan nama lengkap Anda"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading || !selectedUserType || !fullName.trim()}>
                  {loading ? "Menyimpan..." : "Simpan Profil"}
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
