'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, Pencil, Check, X, Plus, Receipt, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Utilities', 'Other'];

const CATEGORY_META: Record<string, { emoji: string; bg: string; text: string; border: string }> = {
  Food:      { emoji: '🍽️', bg: 'bg-orange-50',  text: 'text-orange-600', border: 'border-orange-100' },
  Transport: { emoji: '🚌', bg: 'bg-blue-50',    text: 'text-blue-600',   border: 'border-blue-100'   },
  Shopping:  { emoji: '🛍️', bg: 'bg-pink-50',    text: 'text-pink-600',   border: 'border-pink-100'   },
  Utilities: { emoji: '⚡', bg: 'bg-purple-50',  text: 'text-purple-600', border: 'border-purple-100' },
  Other:     { emoji: '📦', bg: 'bg-stone-50',   text: 'text-stone-500',  border: 'border-stone-100'  },
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);

  const [amount, setAmount]     = useState('');
  const [description, setDesc]  = useState('');
  const [currency, setCurrency] = useState('JPY');
  const [category, setCategory] = useState('Food');
  const [date, setDate]         = useState(todayStr);

  const [editingId, setEditingId]       = useState<string | null>(null);
  const [editAmount, setEditAmount]     = useState('');
  const [editDesc, setEditDesc]         = useState('');
  const [editCurrency, setEditCurrency] = useState('JPY');
  const [editCategory, setEditCategory] = useState('Food');
  const [editDate, setEditDate]         = useState('');
  const [deletingId, setDeletingId]     = useState<string | null>(null);

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    const res = await fetch('/api/expenses');
    setExpenses(await res.json());
  };

  const handleAdd = async (e: any) => {
    e.preventDefault();
    await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(amount), description, currency, category, date }),
    });
    setAmount(''); setDesc(''); setDate(todayStr());
    fetchExpenses();
  };

  const startEdit = (exp: any) => {
    setEditingId(exp._id);
    setEditAmount(String(exp.amount));
    setEditDesc(exp.description);
    setEditCurrency(exp.currency);
    setEditCategory(exp.category);
    setEditDate(new Date(exp.date).toISOString().slice(0, 10));
  };

  const handleSaveEdit = async (id: string) => {
    await fetch(`/api/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(editAmount), description: editDesc, currency: editCurrency, category: editCategory, date: editDate }),
    });
    setEditingId(null);
    fetchExpenses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    setDeletingId(id);
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    fetchExpenses();
  };

  const totalIDR = expenses.filter(e => e.currency === 'IDR').reduce((s, e) => s + e.amount, 0);
  const totalJPY = expenses.filter(e => e.currency === 'JPY').reduce((s, e) => s + e.amount, 0);

  const grouped = expenses.reduce((acc: any, exp: any) => {
    const key = new Date(exp.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(exp);
    return acc;
  }, {});

  const fieldCls = 'w-full bg-white border border-[#EBE5DA] rounded-xl px-4 py-3 text-sm text-[#2c2c2c] placeholder-[#C4BCB3] focus:outline-none focus:ring-2 focus:ring-[#8C7A6B]/20 focus:border-[#8C7A6B] transition-all';

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#2C2C2C]">
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">

        {/* ── Header ── */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-16">
          <div>
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#8C7A6B] hover:text-[#2c2c2c] transition-colors mb-6">
              <ChevronLeft className="w-3.5 h-3.5" /> Diary
            </Link>
            <h1 className="text-5xl font-serif text-[#1a1a1a] tracking-tight mb-6">Expenses</h1>
            <div className="flex flex-wrap gap-8 bg-white border border-[#EBE5DA] rounded-2xl px-6 py-4 shadow-sm">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8C7A6B] mb-1">Total JPY</p>
                <p className="text-2xl font-serif text-[#2c2c2c] tabular-nums">¥ {totalJPY.toLocaleString()}</p>
              </div>
              <div className="w-px bg-[#EBE5DA]" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8C7A6B] mb-1">Total IDR</p>
                <p className="text-2xl font-serif text-[#2c2c2c] tabular-nums">Rp {totalIDR.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </header>

        {/* ── Add Form ── */}
        <div className="bg-white border border-[#EBE5DA] rounded-3xl shadow-sm p-8 mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-full bg-[#8C7A6B] flex items-center justify-center text-white">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#2c2c2c]">Log New Spending</h2>
          </div>

          <form onSubmit={handleAdd} className="space-y-6">
            {/* Currency + Amount — big focal area */}
            <div className="bg-[#FDFCF8] border border-[#EBE5DA] rounded-2xl p-5">
              <div className="flex flex-col md:flex-row items-center gap-4">
                {/* Currency pill toggle */}
                <div className="flex bg-white border border-[#EBE5DA] rounded-xl p-1 shrink-0">
                  {(['JPY', 'IDR'] as const).map(cur => (
                    <button
                      key={cur}
                      type="button"
                      onClick={() => setCurrency(cur)}
                      className={clsx(
                        'px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all',
                        currency === cur
                          ? 'bg-[#2c2c2c] text-white shadow-sm'
                          : 'text-[#8C7A6B] hover:text-[#2c2c2c]'
                      )}
                    >
                      {cur === 'JPY' ? '¥ JPY' : 'Rp IDR'}
                    </button>
                  ))}
                </div>

                {/* Large amount input */}
                <div className="flex-1 w-full relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-serif text-[#C4BCB3]">
                    {currency === 'JPY' ? '¥' : 'Rp'}
                  </span>
                  <input
                    type="number" step="1" placeholder="0" required
                    value={amount} onChange={e => setAmount(e.target.value)}
                    className="w-full bg-transparent border-none px-14 py-2 text-4xl font-serif text-[#1a1a1a] placeholder-[#EBE5DA] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-[0.2em] ml-1">Description</label>
                <input
                  type="text" placeholder="Where did it go?" required
                  value={description} onChange={e => setDesc(e.target.value)}
                  className={`${fieldCls} h-12`}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-[0.2em] ml-1">Date</label>
                <input
                  type="date" required value={date} onChange={e => setDate(e.target.value)}
                  className={`${fieldCls} h-12`}
                />
              </div>
            </div>

            {/* Category picker */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-[0.2em] ml-1">Category</label>
              <div className="grid grid-cols-5 gap-2">
                {CATEGORIES.map(c => {
                  const m = CATEGORY_META[c];
                  const selected = category === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      title={c}
                      className={clsx(
                        'flex flex-col items-center justify-center gap-1 h-16 rounded-2xl border text-xl transition-all',
                        selected
                          ? 'bg-[#2c2c2c] border-[#2c2c2c] shadow-md scale-[1.04]'
                          : `${m.bg} ${m.border} hover:scale-[1.02] opacity-70 hover:opacity-100`
                      )}
                    >
                      {m.emoji}
                      {selected && <span className="text-[8px] font-black uppercase tracking-wider text-white">{c}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#2c2c2c] text-[#FDFCF8] h-12 rounded-xl hover:bg-[#1a1a1a] transition-all active:scale-[0.98] font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#2c2c2c]/10"
            >
              <Receipt className="w-4 h-4" /> Log Expense
            </button>
          </form>
        </div>

        {/* ── Expense History ── */}
        <main className="space-y-14">
          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-32 border-2 border-dashed border-[#EBE5DA] rounded-3xl">
              <p className="text-4xl mb-4">💸</p>
              <p className="text-[#C4BCB3] text-lg font-serif italic">No expenses recorded yet.</p>
              <p className="text-[10px] text-[#C4BCB3] mt-2 uppercase tracking-widest font-bold">Start by logging one above</p>
            </div>
          )}

          {Object.keys(grouped).map((dateLabel, idx) => {
            const dayExps: any[] = grouped[dateLabel];
            const dayJPY = dayExps.filter(e => e.currency === 'JPY').reduce((s, e) => s + e.amount, 0);
            const dayIDR = dayExps.filter(e => e.currency === 'IDR').reduce((s, e) => s + e.amount, 0);

            return (
              <section key={dateLabel}>
                {/* Date header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-[#EBE5DA] px-4 py-1.5 rounded-full">
                    <h2 className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-[0.2em] whitespace-nowrap">{dateLabel}</h2>
                  </div>
                  <div className="h-px bg-[#EBE5DA] flex-grow" />
                  <div className="flex gap-4 text-xs font-bold text-[#2c2c2c] tabular-nums">
                    {dayJPY > 0 && <span>¥{dayJPY.toLocaleString()}</span>}
                    {dayIDR > 0 && <span>Rp{dayIDR.toLocaleString()}</span>}
                  </div>
                </div>

                <div className="space-y-3">
                  {dayExps.map((exp: any) => {
                    const m = CATEGORY_META[exp.category] || CATEGORY_META.Other;
                    const isEditing = editingId === exp._id;

                    if (isEditing) {
                      return (
                        <div key={exp._id} className="bg-white border-2 border-[#8C7A6B] rounded-3xl p-6 space-y-4 shadow-lg">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8C7A6B]">Edit Transaction</h4>
                            <button onClick={() => setEditingId(null)} className="text-[#C4BCB3] hover:text-[#2c2c2c] transition-colors p-1.5 rounded-full hover:bg-[#EBE5DA]">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <select value={editCurrency} onChange={e => setEditCurrency(e.target.value)} className={fieldCls}>
                              <option value="JPY">¥ JPY</option>
                              <option value="IDR">Rp IDR</option>
                            </select>
                            <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className={`${fieldCls} font-serif`} placeholder="Amount" />
                            <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)} className={fieldCls} placeholder="Description" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className={fieldCls}>
                              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_META[c].emoji} {c}</option>)}
                            </select>
                            <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className={fieldCls} />
                            <button onClick={() => handleSaveEdit(exp._id)} className="flex items-center justify-center gap-2 bg-[#2c2c2c] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#1a1a1a] transition-all active:scale-95 h-12">
                              <Check className="w-4 h-4" /> Save
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={exp._id} className="bg-white border border-[#EBE5DA] rounded-2xl px-5 py-4 flex items-center justify-between group hover:shadow-md hover:border-[#d4ccc2] transition-all duration-200">
                        <div className="flex items-center gap-4">
                          <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center text-xl border transition-transform duration-300 group-hover:scale-110', m.bg, m.border)}>
                            {m.emoji}
                          </div>
                          <div>
                            <p className="font-medium text-[#2c2c2c] group-hover:text-[#1a1a1a] transition-colors">{exp.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={clsx('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border', m.bg, m.text, m.border)}>
                                {exp.category}
                              </span>
                              {exp.source === 'whatsapp-ai' && (
                                <span className="text-[9px] font-bold text-[#8C7A6B] bg-[#EBE5DA] px-2 py-0.5 rounded-md">🤖 AI</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <p className="text-xl font-serif text-[#2c2c2c] tabular-nums">
                            <span className="text-xs font-bold mr-0.5 text-[#8C7A6B]">{exp.currency === 'JPY' ? '¥' : 'Rp'}</span>
                            {exp.amount.toLocaleString()}
                          </p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <button onClick={() => startEdit(exp)} className="w-8 h-8 flex items-center justify-center text-[#8C7A6B] hover:text-[#2c2c2c] hover:bg-[#EBE5DA] rounded-lg transition-all" title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(exp._id)} disabled={deletingId === exp._id} className="w-8 h-8 flex items-center justify-center text-[#C4BCB3] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </main>
      </div>
    </div>
  );
}
