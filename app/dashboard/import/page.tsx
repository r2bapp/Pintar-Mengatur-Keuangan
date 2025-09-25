"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileUpload } from "@/components/ui/file-upload"
import { ArrowLeft, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { Footer } from "@/components/footer"

interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

export default function ImportPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
      return
    }
  }, [user, loading, router])

  const downloadTemplate = () => {
    // Create Excel template
    const templateData = [
      ["Tanggal", "Jenis", "Kategori", "Sub Kategori", "Jumlah", "Keterangan"],
      ["2025-01-01", "income", "Gaji", "Gaji Pokok", "5000000", "Gaji bulan Januari"],
      ["2025-01-02", "expense", "Makan", "Sarapan", "25000", "Sarapan di warung"],
      ["2025-01-03", "savings", "Tabungan Pribadi", "", "1000000", "Tabungan bulanan"],
    ]

    // Convert to CSV for simplicity
    const csvContent = templateData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "template-transaksi.csv"
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success("Template berhasil diunduh!")
  }

  const handleFileUpload = async (file: File) => {
    if (!user) {
      toast.error("Sesi tidak ditemukan")
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      const fileExtension = file.name.split(".").pop()?.toLowerCase()

      if (fileExtension === "xlsx" || fileExtension === "xls") {
        await handleExcelImport(file)
      } else {
        toast.error("Format file tidak didukung. Gunakan file Excel (.xlsx atau .xls)")
      }
    } catch (error) {
      console.error("Import error:", error)
      toast.error("Gagal mengimpor file")
    } finally {
      setImporting(false)
    }
  }

  const handleExcelImport = async (file: File) => {
    try {
      // Dynamic import XLSX
      const XLSX = await import("xlsx")

      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      // Skip header row
      const rows = jsonData.slice(1) as any[]

      let successCount = 0
      let failedCount = 0
      const errors: string[] = []

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length < 5) continue

        try {
          const [date, type, category, subcategory, amount, description] = row

          // Validate required fields
          if (!date || !type || !category || !amount) {
            errors.push(`Baris ${i + 2}: Data tidak lengkap`)
            failedCount++
            continue
          }

          // Validate type
          if (!["income", "expense", "savings", "debt"].includes(type)) {
            errors.push(`Baris ${i + 2}: Jenis transaksi tidak valid (${type})`)
            failedCount++
            continue
          }

          // Validate amount
          const numAmount = Number(amount)
          if (isNaN(numAmount) || numAmount <= 0) {
            errors.push(`Baris ${i + 2}: Jumlah tidak valid (${amount})`)
            failedCount++
            continue
          }

          // Insert transaction
          const { error } = await supabase.from("transactions").insert({
            user_id: user.id,
            date: new Date(date).toISOString().split("T")[0],
            type: type,
            category: category,
            subcategory: subcategory || null,
            amount: numAmount,
            description: description || null,
          })

          if (error) {
            errors.push(`Baris ${i + 2}: ${error.message}`)
            failedCount++
          } else {
            successCount++
          }
        } catch (error: any) {
          errors.push(`Baris ${i + 2}: ${error.message}`)
          failedCount++
        }
      }

      setImportResult({
        success: successCount,
        failed: failedCount,
        errors: errors.slice(0, 10), // Show only first 10 errors
      })

      if (successCount > 0) {
        toast.success(`Berhasil mengimpor ${successCount} transaksi`)
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} transaksi gagal diimpor`)
      }
    } catch (error: any) {
      console.error("Excel import error:", error)
      toast.error("Gagal membaca file Excel: " + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
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
                  <h1 className="text-xl font-bold text-white">Import Data</h1>
                  <p className="text-sm text-sage-100">Upload file Excel untuk import transaksi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Instructions */}
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center space-x-2 text-navy-800">
                <FileSpreadsheet className="h-5 w-5" />
                <span>Panduan Import Data</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-navy-100 rounded-full p-1 mt-0.5">
                    <span className="text-navy-600 text-xs font-bold px-1">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-navy-800">Download Template</p>
                    <p className="text-sm text-gray-600">Unduh template Excel untuk format yang benar</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-navy-100 rounded-full p-1 mt-0.5">
                    <span className="text-navy-600 text-xs font-bold px-1">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-navy-800">Isi Data</p>
                    <p className="text-sm text-gray-600">
                      Isi data transaksi sesuai format: Tanggal, Jenis, Kategori, Sub Kategori, Jumlah, Keterangan
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-navy-100 rounded-full p-1 mt-0.5">
                    <span className="text-navy-600 text-xs font-bold px-1">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-navy-800">Upload File</p>
                    <p className="text-sm text-gray-600">Upload file Excel (.xlsx atau .xls) yang sudah diisi</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                  className="bg-transparent border-navy-300 text-navy-600 hover:bg-navy-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center space-x-2 text-navy-800">
                <Upload className="h-5 w-5" />
                <span>Upload File Excel</span>
              </CardTitle>
              <CardDescription>Pilih file Excel (.xlsx atau .xls) yang berisi data transaksi</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <FileUpload
                onFileSelect={handleFileUpload}
                accept=".xlsx,.xls"
                maxSize={10 * 1024 * 1024} // 10MB
              />

              {importing && (
                <div className="mt-4 flex items-center justify-center space-x-2 text-navy-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-navy-600"></div>
                  <span>Mengimpor data...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Import Results */}
          {importResult && (
            <Card className="border-gray-200 shadow-lg">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center space-x-2 text-navy-800">
                  {importResult.success > 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span>Hasil Import</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                      <div className="text-sm text-green-700">Berhasil diimpor</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                      <div className="text-sm text-red-700">Gagal diimpor</div>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-800 mb-2">Error yang ditemukan:</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {importResult.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                      {importResult.failed > importResult.errors.length && (
                        <p className="text-xs text-yellow-600 mt-2">
                          Dan {importResult.failed - importResult.errors.length} error lainnya...
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <Button onClick={() => router.push("/dashboard")} className="bg-navy-600 hover:bg-navy-700">
                      Kembali ke Dashboard
                    </Button>
                    <Button onClick={() => setImportResult(null)} variant="outline" className="bg-transparent">
                      Import Lagi
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
