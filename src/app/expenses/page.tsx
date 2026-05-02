'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, Pencil, Check, X, CreditCard, Receipt, Wallet, ArrowRight, Plus } from 'lucide-react';
import clsx from 'clsx';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Utilities', 'Other'];

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; emoji: string; iconBg: string }> = {
  Food:      { bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200', iconBg: 'bg-orange-100', emoji: '🍽️' },
  Transport: { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   iconBg: 'bg-blue-100',   emoji: '🚌' },
  Shopping:  { bg: 'bg-pink-50',    text: 'text-pink-700',   border: 'border-pink-200',   iconBg: 'bg-pink-100',   emoji: '🛍️' },
  Utilities: { bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-purple-200', iconBg: 'bg-purple-100', emoji: '⚡' },
  Other:     { bg: 'bg-stone-50',   text: 'text-stone-600',  border: 'border-stone-200',  iconBg: 'bg-stone-100',  emoji: '📦' },
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const inputCls = 'bg-white border border-[#EBE5DA] rounded-xl px-4 py-3 text-sm text-[#2c2c2c] placeholder-[#C4BCB3] focus:outline-none focus:ring-2 focus:ring-[#8C7A6B]/20 focus:border-[#8C7A6B] transition-all shadow-sm';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);

  // Add form state
  const [amount, setAmount]       = useState('');
  const [description, setDesc]    = useState('');
  const [currency, setCurrency]   = useState('JPY');
  const [category, setCategory]   = useState('Food');
  const [date, setDate]           = useState(todayStr);

  // Edit state
  const [editingId, setEditingId]             = useState<string | null>(null);
  const [editAmount, setEditAmount]           = useState('');
  const [editDesc, setEditDesc]               = useState('');
  const [editCurrency, setEditCurrency]       = useState('JPY');
  const [editCategory, setEditCategory]       = useState('Food');
  const [editDate, setEditDate]               = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const cancelEdit = () => setEditingId(null);

  const handleSaveEdit = async (id: string) => {
    await fetch(`/api/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(editAmount),
        description: editDesc,
        currency: editCurrency,
        category: editCategory,
        date: editDate,
      }),
    });
    setEditingId(null);
    fetchExpenses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
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

  return (
    <div className="min-h-screen bg-[#FDFCF8] selection:bg-[#8C7A6B]/20">
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        {/* Header Section */}
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-5xl font-serif text-[#1a1a1a] tracking-tight mb-4">Expenses</h1>
            <div className="flex flex-wrap gap-8">
              <div className="group cursor-default">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8C7A6B] mb-1 group-hover:text-[#2c2c2c] transition-colors">Total JPY</p>
                <p className="text-3xl font-serif text-[#2c2c2c] tabular-nums">¥ {totalJPY.toLocaleString()}</p>
              </div>
              <div className="group cursor-default">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8C7A6B] mb-1 group-hover:text-[#2c2c2c] transition-colors">Total IDR</p>
                <p className="text-3xl font-serif text-[#2c2c2c] tabular-nums">Rp {totalIDR.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <Link href="/" className="text-sm text-[#8C7A6B] hover:text-[#2c2c2c] transition-all font-bold uppercase tracking-widest border-b border-transparent hover:border-[#2c2c2c] pb-1">
            Diary
          </Link>
        </header>

        {/* Add Expense Form - High End UI */}
        <div className="bg-white border border-[#EBE5DA] rounded-[2.5rem] shadow-xl shadow-[#8C7A6B]/5 p-8 mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-[#8C7A6B] flex items-center justify-center text-white">
              <Plus className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#2c2c2c]">Log New Spending</h2>
          </div>
          
          <form onSubmit={handleAdd} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-3 space-y-1">
                <label className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-[0.2em] ml-1">Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)} className={`w-full ${inputCls} h-[52px]`}>
                  <option value="JPY">¥ JPY (Yen)</option>
                  <option value="IDR">Rp IDR (Rupiah)</option>
                </select>
              </div>
              <div className="md:col-span-4 space-y-1">
                <label className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-[0.2em] ml-1">Amount</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C4BCB3] font-medium">
                    {currency === 'JPY' ? '¥' : 'Rp'}
                  </div>
                  <input
                    type="number" step="1" placeholder="0" required
                    value={amount} onChange={e => setAmount(e.target.value)}
                    className={`w-full ${inputCls} h-[52px] pl-12 text-lg font-serif`}
                  />
                </div>
              </div>
              <div className="md:col-span-5 space-y-1">
                <label className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-[0.2em] ml-1">Description</label>
                <input
                  type="text" placeholder="Where did it go?" required
                  value={description} onChange={e => setDesc(e.target.value)}
                  className={`w-full ${inputCls} h-[52px]`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 space-y-1">
                <label className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-[0.2em] ml-1">Category</label>
                <div className="grid grid-cols-5 gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={clsx(
                        "h-[52px] rounded-xl text-lg flex items-center justify-center transition-all border",
                        category === c 
                          ? "bg-[#2c2c2c] text-white border-[#2c2c2c] shadow-lg shadow-[#2c2c2c]/10 scale-105" 
                          : "bg-white text-[#8C7A6B] border-[#EBE5DA] hover:border-[#8C7A6B]"
                      )}
                      title={c}
                    >
                      {CATEGORY_STYLES[c].emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-4 space-y-1">
                <label className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-[0.2em] ml-1">Transaction Date</label>
                <input
                  type="date" required value={date} onChange={e => setDate(e.target.value)}
                  className={`w-full ${inputCls} h-[52px]`}
                />
              </div>
              <div className="md:col-span-3 flex items-end">
                <button type="submit" className="w-full bg-[#2c2c2c] text-[#FDFCF8] h-[52px] rounded-xl hover:bg-[#1a1a1a] transition-all active:scale-95 font-bold text-sm shadow-xl shadow-[#2c2c2c]/20 uppercase tracking-[0.2em]">
                  Log Expense
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Expense History */}
        <main className="space-y-16">
          {Object.keys(grouped).map(dateLabel => {
            const dayExps: any[] = grouped[dateLabel];
            const dayJPY = dayExps.filter(e => e.currency === 'JPY').reduce((s, e) => s + e.amount, 0);
            const dayIDR = dayExps.filter(e => e.currency === 'IDR').reduce((s, e) => s + e.amount, 0);

            return (
              <section key={dateLabel} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Date Header */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-[#EBE5DA] px-4 py-1.5 rounded-full">
                     <h2 className="text-xs font-black text-[#8C7A6B] uppercase tracking-[0.2em] whitespace-nowrap">{dateLabel}</h2>
                  </div>
                  <div className="h-px bg-[#EBE5DA] flex-grow" />
                  <div className="flex gap-4 text-sm font-bold text-[#2c2c2c] tabular-nums">
                    {dayJPY > 0 && <span>¥{dayJPY.toLocaleString()}</span>}
                    {dayIDR > 0 && <span>Rp{dayIDR.toLocaleString()}</span>}
                  </div>
                </div>

                <div className="space-y-4">
                  {dayExps.map((exp: any) => {
                    const style = CATEGORY_STYLES[exp.category] || CATEGORY_STYLES.Other;
                    const isEditing = editingId === exp._id;

                    if (isEditing) {
                      return (
                        <div key={exp._id} className="bg-white border-2 border-[#8C7A6B] rounded-[2rem] p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-300">
                           <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-widest text-[#8C7A6B]">Edit Transaction</h4>
                            <button onClick={cancelEdit} className="text-[#C4BCB3] hover:text-[#2c2c2c] transition-colors"><X className="w-5 h-5" /></button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <select value={editCurrency} onChange={e => setEditCurrency(e.target.value)} className={`md:col-span-3 ${inputCls}`}>
                              <option value="JPY">¥ JPY</option>
                              <option value="IDR">Rp IDR</option>
                            </select>
                            <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className={`md:col-span-4 ${inputCls} font-serif`} />
                            <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)} className={`md:col-span-5 ${inputCls}`} />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className={`md:col-span-5 ${inputCls}`}>
                              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_STYLES[c].emoji} {c}</option>)}
                            </select>
                            <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className={`md:col-span-4 ${inputCls}`} />
                            <button onClick={() => handleSaveEdit(exp._id)} className="md:col-span-3 flex items-center justify-center gap-2 bg-[#2c2c2c] text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-[#1a1a1a] transition-all active:scale-95">
                              <Check className="w-4 h-4" /> Save
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={exp._id} className="bg-white border border-[#EBE5DA] rounded-3xl p-5 flex items-center justify-between group hover:shadow-lg hover:shadow-[#8C7A6B]/5 transition-all duration-300 hover:-translate-y-0.5">
                        <div className="flex items-center gap-5">
                          <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform duration-500 group-hover:scale-110 shadow-inner", style.iconBg)}>
                            {style.emoji}
                          </div>
                          <div>
                            <p className="text-[#2c2c2c] font-medium text-lg tracking-tight group-hover:text-[#8C7A6B] transition-colors">{exp.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={clsx("text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg border", style.bg, style.text, style.border)}>
                                {exp.category}
                              </span>
                              {exp.source === 'whatsapp-ai' && (
                                <span className="text-[10px] text-[#8C7A6B] font-bold uppercase tracking-[0.2em] bg-[#FDFCF8] px-2 py-1 rounded-lg border border-[#EBE5DA]">
                                  🤖 Bot
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                             <p className="text-2xl font-serif text-[#2c2c2c] tabular-nums tracking-tight">
                              <span className="text-sm font-sans font-black mr-1 text-[#8C7A6B]">{exp.currency === 'JPY' ? '¥' : 'Rp'}</span>
                              {exp.amount.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <button
                              onClick={() => startEdit(exp)}
                              className="w-10 h-10 flex items-center justify-center text-[#8C7A6B] hover:text-[#2c2c2c] hover:bg-[#EBE5DA] rounded-xl transition-all"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(exp._id)}
                              disabled={deletingId === exp._id}
                              className="w-10 h-10 flex items-center justify-center text-[#C4BCB3] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
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
          
          {expenses.length === 0 && (
            <div className="text-center py-32 border-2 border-dashed border-[#EBE5DA] rounded-[3rem]">
              <p className="text-[#C4BCB3] text-lg font-serif italic">No expenses recorded yet.</p>
              <p className="text-[#C4BCB3] text-sm mt-2 uppercase tracking-widest font-bold">Start by logging one above</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
