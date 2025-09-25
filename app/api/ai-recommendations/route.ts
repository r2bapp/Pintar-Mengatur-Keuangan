import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { profile, totalStats, monthlyData, expenseCategories, incomeCategories } = await req.json()

    if (!profile || !totalStats || !monthlyData || !expenseCategories || !incomeCategories) {
      return NextResponse.json({ error: "Missing financial data" }, { status: 400 })
    }

    const userType = profile.user_type || "personal"
    const fullName = profile.full_name || "Pengguna"

    const prompt = `
      Anda adalah penasihat keuangan yang bijaksana dan membantu. Berdasarkan data keuangan berikut untuk pengguna bernama ${fullName} dengan kategori ${userType}, berikan 3-5 rekomendasi yang ringkas, mudah dipahami, dan dapat ditindaklanjuti untuk meningkatkan kesehatan keuangan, mengelola pengeluaran, dan meningkatkan tabungan.

      **Profil Pengguna:**
      - Nama: ${fullName}
      - Tipe Pengguna: ${userType}

      **Ringkasan Keuangan (Periode Terpilih):**
      - Total Pemasukan: Rp ${totalStats.totalIncome.toLocaleString("id-ID")}
      - Total Pengeluaran: Rp ${totalStats.totalExpense.toLocaleString("id-ID")}
      - Total Tabungan: Rp ${totalStats.totalSavings.toLocaleString("id-ID")}
      - Saldo Bersih: Rp ${totalStats.netBalance.toLocaleString("id-ID")}

      **Tren Bulanan (Pemasukan vs. Pengeluaran):**
      ${monthlyData
        .map(
          (data: any) =>
            `- ${data.month}: Pemasukan Rp ${data.income.toLocaleString("id-ID")}, Pengeluaran Rp ${data.expense.toLocaleString("id-ID")}, Saldo Rp ${data.balance.toLocaleString("id-ID")}`,
        )
        .join("\n")}

      **Kategori Pengeluaran Teratas:**
      ${expenseCategories
        .map(
          (cat: any) => `- ${cat.category}: Rp ${cat.amount.toLocaleString("id-ID")} (${cat.percentage.toFixed(1)}%)`,
        )
        .join("\n")}

      **Kategori Pemasukan Teratas:**
      ${incomeCategories
        .map(
          (cat: any) => `- ${cat.category}: Rp ${cat.amount.toLocaleString("id-ID")} (${cat.percentage.toFixed(1)}%)`,
        )
        .join("\n")}

      **Rekomendasi Keuangan Anda (3-5 poin):**
    `

    const { text } = await generateText({
      model: openai("gpt-4o"), // Menggunakan model GPT-4o dari OpenAI
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 500,
    })

    return NextResponse.json({ recommendations: text })
  } catch (error: any) {
    console.error("Error generating AI recommendations:", error)
    return NextResponse.json({ error: error.message || "Failed to generate AI recommendations" }, { status: 500 })
  }
}
