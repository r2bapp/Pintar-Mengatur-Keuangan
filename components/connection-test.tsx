"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Settings } from "lucide-react"
import { supabase, testSupabaseConnection } from "@/lib/supabase"

interface ConnectionStatus {
  config: "checking" | "connected" | "error"
  database: "checking" | "connected" | "error"
  auth: "checking" | "connected" | "error"
  tables: "checking" | "connected" | "error"
  message?: string
  details?: string[]
}

export function ConnectionTest() {
  const [status, setStatus] = useState<ConnectionStatus>({
    config: "checking",
    database: "checking",
    auth: "checking",
    tables: "checking",
  })
  const [testing, setTesting] = useState(false)

  const testConnection = async () => {
    setTesting(true)
    setStatus({
      config: "checking",
      database: "checking",
      auth: "checking",
      tables: "checking",
      message: undefined,
      details: [],
    })

    const currentDetails: string[] = []

    try {
      // Test 1: Configuration validation
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xsebrzwamtkilhdipuih.supabase.co"
      const key =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzZWJyendhbXRraWxoZGlwdWihIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MDYxMDAsImV4cCI6MjA2MzM4MjEwMH0.NEW_ANON_KEY_FOR_XSEBRZWAMTKILHDIPUIH"

      if (!url || !url.includes("supabase.co")) {
        setStatus((prev) => ({
          ...prev,
          config: "error",
          message: "Invalid Supabase URL. Check NEXT_PUBLIC_SUPABASE_URL.",
        }))
        currentDetails.push("❌ URL tidak valid atau tidak ditemukan")
        return
      }

      if (!key || key.split(".").length !== 3) {
        setStatus((prev) => ({
          ...prev,
          config: "error",
          message: "Invalid API Key format. Check NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        }))
        currentDetails.push("❌ Format API Key tidak valid")
        return
      }

      setStatus((prev) => ({ ...prev, config: "connected" }))
      currentDetails.push("✅ Konfigurasi valid")

      // Test 2: Basic database connection
      const connectionTestResult = await testSupabaseConnection()

      if (!connectionTestResult.success) {
        setStatus((prev) => ({
          ...prev,
          database: "error",
          message: connectionTestResult.error,
        }))
        currentDetails.push(`❌ Koneksi database: ${connectionTestResult.error}`)
        return
      }

      setStatus((prev) => ({ ...prev, database: "connected" }))
      currentDetails.push("✅ Koneksi database berhasil")

      // Test 3: Auth service
      const { data: authTest, error: authError } = await supabase.auth.getSession()

      if (authError) {
        setStatus((prev) => ({
          ...prev,
          auth: "error",
          message: authError.message,
        }))
        currentDetails.push(`❌ Auth service: ${authError.message}`)
        return
      }

      setStatus((prev) => ({ ...prev, auth: "connected" }))
      currentDetails.push("✅ Auth service aktif")

      // Test 4: Tables accessibility
      const { data: tablesTest, error: tablesError } = await supabase.from("transactions").select("count").limit(1)

      if (tablesError) {
        setStatus((prev) => ({
          ...prev,
          tables: "error",
          message: tablesError.message,
        }))
        currentDetails.push(`❌ Akses tabel: ${tablesError.message}`)
        return
      }

      setStatus((prev) => ({ ...prev, tables: "connected" }))
      currentDetails.push("✅ Semua tabel dapat diakses")

      setStatus((prev) => ({ ...prev, details: currentDetails }))
    } catch (error: any) {
      console.error("Connection test error:", error)
      setStatus((prev) => ({
        ...prev,
        config: "error", // Set config to error if a general error occurs during initial checks
        message: error.message,
        details: [...currentDetails, `❌ Error umum: ${error.message}`],
      }))
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  const getStatusIcon = (statusValue: string) => {
    switch (statusValue) {
      case "connected":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600 animate-pulse" />
    }
  }

  const getStatusText = (statusValue: string) => {
    switch (statusValue) {
      case "connected":
        return "✅ OK"
      case "error":
        return "❌ Error"
      default:
        return "🔄 Testing..."
    }
  }

  const allConnected =
    status.config === "connected" &&
    status.database === "connected" &&
    status.auth === "connected" &&
    status.tables === "connected"

  return (
    <Card className="w-full max-w-2xl mx-auto border-2 border-navy-200">
      <CardHeader className="bg-navy-50">
        <CardTitle className="flex items-center justify-between text-navy-800">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Status Koneksi Supabase</span>
          </div>
          <Button variant="ghost" size="sm" onClick={testConnection} disabled={testing}>
            <RefreshCw className={`h-4 w-4 ${testing ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Konfigurasi</span>
            <div className="flex items-center space-x-2">
              {getStatusIcon(status.config)}
              <span className="text-sm">{getStatusText(status.config)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Database</span>
            <div className="flex items-center space-x-2">
              {getStatusIcon(status.database)}
              <span className="text-sm">{getStatusText(status.database)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Authentication</span>
            <div className="flex items-center space-x-2">
              {getStatusIcon(status.auth)}
              <span className="text-sm">{getStatusText(status.auth)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Tables</span>
            <div className="flex items-center space-x-2">
              {getStatusIcon(status.tables)}
              <span className="text-sm">{getStatusText(status.tables)}</span>
            </div>
          </div>
        </div>

        {status.message && (
          <div
            className={`p-3 rounded-lg border ${
              allConnected ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`}
          >
            <p className={`text-sm font-medium ${allConnected ? "text-green-700" : "text-red-700"}`}>
              {status.message}
            </p>
          </div>
        )}

        {status.details && status.details.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Detail Test:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              {status.details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          </div>
        )}

        {allConnected && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-700">🎉 Semua koneksi berhasil! Aplikasi siap digunakan.</p>
            </div>
          </div>
        )}

        {!allConnected && !testing && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">⚠️ Ada masalah dengan koneksi. Periksa konfigurasi Supabase Anda.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
