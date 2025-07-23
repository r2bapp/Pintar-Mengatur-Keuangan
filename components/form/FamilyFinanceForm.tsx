import { supabase } from '../../lib/supabaseClient';
import { useState } from 'react';

type Entry = {
  type: 'income' | 'expense';
  category: string;
  amount: number;
};

export default function FamilyFinanceForm() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income');

 const addEntry = async () => {
  if (!category || !amount) return;

  const newEntry = {
    type,
    category,
    amount: parseFloat(amount),
    role: 'keluarga', // untuk identifikasi jenis
    user_id: 'guest', // nanti diganti dari auth
  };

  const { error } = await supabase.from('transactions').insert([newEntry]);

  if (error) {
    alert("Gagal menyimpan data");
    return;
  }

  setEntries([...entries, newEntry]);
  setCategory('');
  setAmount('');
};


  const totalIncome = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Form Keuangan Keluarga</h2>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <select
          className="border p-2 rounded w-full"
          value={type}
          onChange={(e) => setType(e.target.value as 'income' | 'expense')}
        >
          <option value="income">Pemasukan</option>
          <option value="expense">Pengeluaran</option>
        </select>

        <input
          className="border p-2 rounded w-full"
          type="text"
          placeholder="Kategori (misal: Gaji, Listrik)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <input
          className="border p-2 rounded w-full"
          type="number"
          placeholder="Jumlah (Rp)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={addEntry}
        >
          Tambah
        </button>
      </div>

      <div className="mt-4">
        <h3 className="font-bold">Ringkasan</h3>
        <p>Total Pemasukan: <span className="text-green-600 font-semibold">Rp {totalIncome.toLocaleString()}</span></p>
        <p>Total Pengeluaran: <span className="text-red-600 font-semibold">Rp {totalExpense.toLocaleString()}</span></p>
        <p>Saldo Bersih: <span className="font-semibold">Rp {(totalIncome - totalExpense).toLocaleString()}</span></p>
      </div>

      <div className="mt-6">
        <h3 className="font-bold mb-2">Catatan</h3>
        <table className="w-full text-left border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Tipe</th>
              <th className="p-2 border">Kategori</th>
              <th className="p-2 border">Jumlah (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={i} className="border-t">
                <td className="p-2 border">{e.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</td>
                <td className="p-2 border">{e.category}</td>
                <td className="p-2 border">Rp {e.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
