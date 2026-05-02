'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('IDR');
  const [category, setCategory] = useState('Food');

  const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Utilities', 'Other'];

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
      body: JSON.stringify({ amount: Number(amount), description, currency, category })
    });
    setAmount('');
    setDescription('');
    fetchExpenses();
  };

  // Calculate totals
  const totalIDR = expenses.filter(e => e.currency === 'IDR').reduce((sum, exp) => sum + exp.amount, 0);
  const totalJPY = expenses.filter(e => e.currency === 'JPY').reduce((sum, exp) => sum + exp.amount, 0);

  // Group by Date
  const groupedExpenses = expenses.reduce((groups: any, exp: any) => {
    const dateStr = new Date(exp.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(exp);
    return groups;
  }, {});

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'Food': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Transport': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Shopping': return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'Utilities': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-20 px-8">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-serif text-[#2c2c2c] mb-2">Expenses</h1>
          <div className="flex space-x-6 text-[#8C7A6B]">
            <p>Total IDR: <strong className="text-[#2c2c2c] text-xl">Rp {totalIDR.toLocaleString()}</strong></p>
            <p>Total JPY: <strong className="text-[#2c2c2c] text-xl">¥ {totalJPY.toLocaleString()}</strong></p>
          </div>
        </div>
        <Link href="/" className="text-[#8C7A6B] hover:text-[#2c2c2c] transition-colors font-medium">
          Back to Diary
        </Link>
      </div>

      <form onSubmit={handleAdd} className="bg-white/50 backdrop-blur-xl border border-white/40 p-6 rounded-2xl shadow-xl mb-12 flex flex-wrap gap-4 items-center">
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="bg-white/60 border-none rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#EBE5DA] text-[#2c2c2c] w-24"
        >
          <option value="IDR">IDR</option>
          <option value="JPY">JPY</option>
        </select>
        
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
          className="flex-1 min-w-[200px] bg-white/60 border-none rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#EBE5DA] text-[#2c2c2c]"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-white/60 border-none rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#EBE5DA] text-[#2c2c2c] w-36"
        >
          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>

        <button type="submit" className="bg-[#2c2c2c] text-[#EBE5DA] px-6 py-3 rounded-xl hover:bg-[#1a1a1a] transition-colors font-medium">
          Log
        </button>
      </form>

      <div className="space-y-10">
        {Object.keys(groupedExpenses).map(dateStr => {
          const dayExpenses = groupedExpenses[dateStr];
          const dayIDR = dayExpenses.filter((e:any) => e.currency === 'IDR').reduce((sum:any, exp:any) => sum + exp.amount, 0);
          const dayJPY = dayExpenses.filter((e:any) => e.currency === 'JPY').reduce((sum:any, exp:any) => sum + exp.amount, 0);

          return (
            <div key={dateStr}>
              <div className="flex justify-between items-center mb-4 border-b border-[#EBE5DA] pb-2">
                <h2 className="text-[#8C7A6B] font-serif text-lg tracking-wide">{dateStr}</h2>
                <div className="text-sm font-medium text-[#2c2c2c] space-x-3">
                  {dayIDR > 0 && <span>Rp {dayIDR.toLocaleString()}</span>}
                  {dayJPY > 0 && <span>¥ {dayJPY.toLocaleString()}</span>}
                </div>
              </div>
              
              <div className="space-y-3">
                {dayExpenses.map((exp: any) => (
                  <div key={exp._id} className="bg-white/60 border border-white/80 p-4 rounded-xl flex justify-between items-center hover:bg-white/80 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="bg-[#EBE5DA] w-12 h-12 flex items-center justify-center rounded-xl text-[#2c2c2c] font-bold text-sm tracking-tighter">
                        {exp.currency === 'IDR' ? 'Rp' : '¥'}
                      </div>
                      <div>
                        <h3 className="text-[#2c2c2c] font-medium text-lg leading-none mb-1">{exp.description}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-widest font-bold ${getCategoryColor(exp.category)}`}>
                            {exp.category}
                          </span>
                          {exp.source === 'whatsapp-ai' && (
                            <span className="text-[#8C7A6B] text-[10px] uppercase tracking-widest">🤖 Bot</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-xl font-serif text-[#2c2c2c]">
                      {exp.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
