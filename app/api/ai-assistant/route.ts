import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { supabase } from "@/lib/supabase" // Import Supabase client

export async function POST(req: Request) {
  try {
    const { prompt, userId, userProfile } = await req.json()

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Fetch recent transactions for context
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(5) // Get last 5 transactions for context

    if (transactionsError) {
      console.error("Error fetching transactions for AI:", transactionsError)
      // Continue without transactions if there's an error
    }

    const transactionSummary = transactions
      ?.map(
        (t) =>
          `- ${t.type === "income" ? "Pemasukan" : "Pengeluaran"} ${t.category}: Rp${t.amount} (${t.description || "Tidak ada keterangan"}) pada ${new Date(t.date).toLocaleDateString("id-ID")}`,
      )
      .join("\n")

    const systemPrompt = `Anda adalah asisten keuangan pribadi yang cerdas dan membantu. Berikan saran yang relevan dan personal berdasarkan profil pengguna dan data transaksi mereka.
    
    Profil Pengguna:
    - Nama Lengkap: ${userProfile?.full_name || "Tidak diketahui"}
    - Tipe Pengguna: ${userProfile?.user_type || "personal"}
    - Email: ${userProfile?.email || "Tidak diketahui"}

    Transaksi Terbaru (5 transaksi terakhir):
    ${transactionSummary || "Tidak ada transaksi terbaru."}

    Berikan saran yang ringkas, mudah dimengerti, dan dapat ditindaklanjuti. Sesuaikan gaya bahasa Anda dengan konteks keuangan Indonesia. Jika pertanyaan tidak relevan dengan keuangan, arahkan kembali pengguna ke topik keuangan.
    `

    const { text } = await generateText({
      model: openai("gpt-4o"), // Using gpt-4o as per instructions [^2]
      system: systemPrompt,
      prompt: prompt,
    })

    return new Response(JSON.stringify({ response: text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("AI Assistant API error:", error)
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
