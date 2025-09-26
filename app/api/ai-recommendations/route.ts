import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { xai } from "@ai-sdk/xai"

/**
 * Generates AI financial recommendations with AI SDK.
 * Uses OpenAI if OPENAI_API_KEY is present, otherwise falls back to xAI Grok (XAI_API_KEY).
 * If neither key is configured, returns a 500 with a clear message. [^2]
 */
export async function POST(req: Request) {
  try {
    const { profile, totalStats, monthlyData, expenseCategories, incomeCategories } = await req.json()

    if (!profile || !totalStats || !monthlyData || !expenseCategories || !incomeCategories) {
      return NextResponse.json({ error: "Missing financial data" }, { status: 400 })
    }

    const useOpenAI = !!process.env.OPENAI_API_KEY
    const useXAI = !!process.env.XAI_API_KEY

    if (!useOpenAI && !useXAI) {
      return NextResponse.json(
        {
          error:
            "AI provider key missing. Set OPENAI_API_KEY or XAI_API_KEY in your environment to enable recommendations.",
          howToFix:
            "On Vercel, add the key in Project Settings > Environment Variables, then redeploy. Locally, set it before `next dev`.",
        },
        { status: 500 },
      )
    }

    const model = useOpenAI ? openai("gpt-4o") : xai("grok-3")

    const fullName = profile.full_name || "Pengguna"
    const userType = profile.user_type || "personal"

    const prompt = `
Anda adalah penasihat keuangan berbahasa Indonesia yang bijaksana dan to the point.
Berikan 3–5 rekomendasi yang spesifik, aplikatif, dan bernilai bagi ${fullName} (tipe ${userType}).
Gunakan poin-poin, sertakan angka target/batas jika relevan.

Ringkasan:
- Total Pemasukan: Rp ${Number(totalStats.totalIncome || 0).toLocaleString("id-ID")}
- Total Pengeluaran: Rp ${Number(totalStats.totalExpense || 0).toLocaleString("id-ID")}
- Total Tabungan: Rp ${Number(totalStats.totalSavings || 0).toLocaleString("id-ID")}
- Saldo Bersih: Rp ${Number(totalStats.netBalance || 0).toLocaleString("id-ID")}

Tren Bulanan (bulan: pemasukan/pengeluaran/saldo):
${monthlyData
  .map(
    (m: any) =>
      `- ${m.month}: Rp ${Number(m.income).toLocaleString("id-ID")} / Rp ${Number(m.expense).toLocaleString("id-ID")} / Rp ${Number(m.balance).toLocaleString("id-ID")}`,
  )
  .join("\n")}

Kategori Pengeluaran Teratas:
${expenseCategories.map((c: any) => `- ${c.category}: Rp ${Number(c.amount).toLocaleString("id-ID")} (${Number(c.percentage).toFixed(1)}%)`).join("\n")}

Kategori Pemasukan Teratas:
${incomeCategories.map((c: any) => `- ${c.category}: Rp ${Number(c.amount).toLocaleString("id-ID")} (${Number(c.percentage).toFixed(1)}%)`).join("\n")}

Output:
- 3–5 poin rekomendasi terstruktur (gunakan bullet point).
- Hindari jargon. Maks 120 kata total.
`

    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.6,
      maxTokens: 500,
    })

    return NextResponse.json({ recommendations: text })
  } catch (error: any) {
    console.error("Error generating AI recommendations:", error)
    return NextResponse.json({ error: error?.message || "Failed to generate AI recommendations" }, { status: 500 })
  }
}
