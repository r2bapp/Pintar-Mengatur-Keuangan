import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { NextResponse } from "next/server"

export async function GET() {
  // Expose whether AI is enabled to clients without leaking the key
  const enabled = Boolean(process.env.OPENAI_API_KEY)
  return NextResponse.json({ enabled })
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "AI is not configured. Set OPENAI_API_KEY in your environment." },
        { status: 500 },
      )
    }

    const { profile, totalStats, monthlyData, expenseCategories, incomeCategories } = await req.json()

    if (!profile || !totalStats || !monthlyData || !expenseCategories || !incomeCategories) {
      return NextResponse.json({ error: "Missing financial data" }, { status: 400 })
    }

    const userType = profile.user_type || "personal"
    const fullName = profile.full_name || "Pengguna"

    const prompt = `
Anda adalah penasihat keuangan yang bijaksana dan membantu. Berdasarkan data keuangan berikut untuk pengguna bernama ${fullName} dengan kategori ${userType}, berikan 3-5 rekomendasi yang ringkas, mudah dipahami, dan dapat ditindaklanjuti untuk meningkatkan kesehatan keuangan, mengelola pengeluaran, dan meningkatkan tabungan.

Profil Pengguna:
- Nama: ${fullName}
- Tipe Pengguna: ${userType}

Ringkasan Keuangan (Periode Terpilih):
- Total Pemasukan: Rp ${Number(totalStats.totalIncome).toLocaleString("id-ID")}
- Total Pengeluaran: Rp ${Number(totalStats.totalExpense).toLocaleString("id-ID")}
- Total Tabungan: Rp ${Number(totalStats.totalSavings).toLocaleString("id-ID")}
- Saldo Bersih: Rp ${Number(totalStats.netBalance).toLocaleString("id-ID")}

Tren Bulanan (Pemasukan vs. Pengeluaran):
${monthlyData
  .map(
    (d: any) =>
      `- ${d.month}: Pemasukan Rp ${Number(d.income).toLocaleString("id-ID")}, Pengeluaran Rp ${Number(d.expense).toLocaleString("id-ID")}, Saldo Rp ${Number(d.balance).toLocaleString("id-ID")}`,
  )
  .join("\n")}

Kategori Pengeluaran Teratas:
${expenseCategories
  .map(
    (c: any) => `- ${c.category}: Rp ${Number(c.amount).toLocaleString("id-ID")} (${Number(c.percentage).toFixed(1)}%)`,
  )
  .join("\n")}

Kategori Pemasukan Teratas:
${incomeCategories
  .map(
    (c: any) => `- ${c.category}: Rp ${Number(c.amount).toLocaleString("id-ID")} (${Number(c.percentage).toFixed(1)}%)`,
  )
  .join("\n")}

Rekomendasi Keuangan Anda (3-5 poin):
    `

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.7,
      maxTokens: 500,
    })

    return NextResponse.json({ recommendations: text })
  } catch (error: any) {
    console.error("Error generating AI recommendations:", error)
    return NextResponse.json({ error: error.message || "Failed to generate AI recommendations" }, { status: 500 })
  }
}
