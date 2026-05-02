'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    const res = await fetch('/api/expenses');
    const data = await res.json();
    setExpenses(data);
  };

  const handleAdd = async (e: any) => {
    e.preventDefault();
    await fetch('/api/expenses', {
      method: 'POST',
      body: JSON.stringify({ amount: Number(amount), description })
    });
    setAmount('');
    setDescription('');
    fetchExpenses();
  };

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="max-w-3xl mx-auto py-20 px-8">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-serif text-[#2c2c2c] mb-2">Expenses</h1>
          <p className="text-[#8C7A6B]">Total spent: <strong className="text-[#2c2c2c] text-xl">${total.toFixed(2)}</strong></p>
        </div>
        <Link href="/" className="text-[#8C7A6B] hover:text-[#2c2c2c] transition-colors">
          Back to Diary
        </Link>
      </div>

      <form onSubmit={handleAdd} className="bg-white/50 backdrop-blur-xl border border-white/40 p-6 rounded-2xl shadow-xl mb-10 flex space-x-4">
        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-32 bg-white/60 border-none rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#EBE5DA] text-[#2c2c2c]"
        />
        <input
          type="text"
          placeholder="Description"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="flex-1 bg-white/60 border-none rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#EBE5DA] text-[#2c2c2c]"
        />
        <button type="submit" className="bg-[#2c2c2c] text-[#EBE5DA] px-6 py-3 rounded-xl hover:bg-[#1a1a1a] transition-colors">
          Log
        </button>
      </form>

      <div className="space-y-4">
        {expenses.map(exp => (
          <div key={exp._id} className="bg-white/40 p-5 rounded-2xl flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-[#EBE5DA] p-3 rounded-xl text-[#2c2c2c] font-bold text-lg">
                ${exp.amount.toFixed(2)}
              </div>
              <div>
                <h3 className="text-[#2c2c2c] font-medium">{exp.description}</h3>
                <p className="text-[#8C7A6B] text-xs uppercase tracking-widest">{exp.category} • {exp.source === 'whatsapp-ai' ? '🤖 WhatsApp AI' : 'Manual'}</p>
              </div>
            </div>
            <p className="text-[#8C7A6B] text-sm">{new Date(exp.date).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
