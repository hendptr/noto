'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, Pencil, Check, X, Plus, ChevronLeft, Calendar, Bell, Info } from 'lucide-react';
import clsx from 'clsx';
import { format, differenceInDays } from 'date-fns';

const fieldCls = 'w-full bg-white border border-[#EBE5DA] rounded-xl px-4 py-3 text-sm text-[#2c2c2c] placeholder-[#C4BCB3] focus:outline-none focus:ring-2 focus:ring-[#8C7A6B]/20 focus:border-[#8C7A6B] transition-all';

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDesc] = useState('');
  const [reminders, setReminders] = useState<number[]>([1, 3, 7]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editReminders, setEditReminders] = useState<number[]>([]);

  useEffect(() => { fetchMilestones(); }, []);

  const fetchMilestones = async () => {
    const res = await fetch('/api/milestones');
    const data = await res.json();
    setMilestones(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/milestones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, date, description, reminders }),
    });
    setTitle(''); setDate(''); setDesc(''); setReminders([1, 3, 7]);
    fetchMilestones();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this milestone?')) return;
    await fetch(`/api/milestones/${id}`, { method: 'DELETE' });
    fetchMilestones();
  };

  const handleSaveEdit = async (id: string) => {
    await fetch(`/api/milestones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, date: editDate, description: editDesc, reminders: editReminders }),
    });
    setEditingId(null);
    fetchMilestones();
  };

  const startEdit = (m: any) => {
    setEditingId(m._id);
    setEditTitle(m.title);
    setEditDate(format(new Date(m.date), 'yyyy-MM-dd'));
    setEditDesc(m.description || '');
    setEditReminders(m.reminders || []);
  };

  const toggleReminder = (day: number, current: number[], setter: (v: number[]) => void) => {
    if (current.includes(day)) {
      setter(current.filter(d => d !== day));
    } else {
      setter([...current, day].sort((a, b) => a - b));
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#2C2C2C]">
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        
        {/* Header */}
        <header className="mb-16">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#8C7A6B] hover:text-[#2c2c2c] transition-colors mb-6">
            <ChevronLeft className="w-3.5 h-3.5" /> Diary
          </Link>
          <h1 className="text-5xl font-serif text-[#1a1a1a] tracking-tight mb-2">Milestones</h1>
          <p className="text-[#8C7A6B] font-medium tracking-wide text-sm">Track important dates and countdowns.</p>
        </header>

        {/* Add Form */}
        <div className="bg-white border border-[#EBE5DA] rounded-3xl shadow-sm p-8 mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-full bg-[#8C7A6B] flex items-center justify-center text-white">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#2c2c2c]">New Milestone</h2>
          </div>

          <form onSubmit={handleAdd} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-[0.2em] ml-1">Event Title</label>
                <input type="text" placeholder="e.g. Visa Expiry, Flight Home" required value={title} onChange={e => setTitle(e.target.value)} className={fieldCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-[0.2em] ml-1">Date</label>
                <input type="date" required value={date} onChange={e => setDate(e.target.value)} className={fieldCls} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-[0.2em] ml-1">Details / Notes</label>
              <textarea placeholder="Don't forget to bring... or do..." value={description} onChange={e => setDesc(e.target.value)} className={`${fieldCls} h-24 resize-none`} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-[0.2em] ml-1">WhatsApp Reminders (Days Before)</label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 5, 7, 14, 30].map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleReminder(day, reminders, setReminders)}
                    className={clsx(
                      'px-4 py-2 rounded-xl text-xs font-bold transition-all border',
                      reminders.includes(day) ? 'bg-[#2c2c2c] text-white border-[#2c2c2c]' : 'bg-white text-[#8C7A6B] border-[#EBE5DA] hover:border-[#8C7A6B]'
                    )}
                  >
                    H-{day}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full bg-[#2c2c2c] text-[#FDFCF8] h-12 rounded-xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#1a1a1a] transition-all shadow-lg shadow-[#2c2c2c]/10">
              Create Milestone
            </button>
          </form>
        </div>

        {/* Milestone List */}
        <div className="space-y-6">
          {milestones.length === 0 && !loading && (
             <div className="text-center py-16 border-2 border-dashed border-[#EBE5DA] rounded-3xl">
                <p className="text-3xl mb-3">📅</p>
                <p className="text-[#C4BCB3] font-medium font-serif italic">No milestones yet.</p>
             </div>
          )}

          {milestones.map(m => {
            const isEditing = editingId === m._id;
            const daysLeft = differenceInDays(new Date(m.date), new Date());
            
            if (isEditing) {
              return (
                <div key={m._id} className="bg-white border-2 border-[#8C7A6B] rounded-3xl p-6 space-y-4 shadow-lg animate-in fade-in zoom-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className={fieldCls} />
                    <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className={fieldCls} />
                  </div>
                  <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className={`${fieldCls} h-20 resize-none`} />
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 5, 7, 14, 30].map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleReminder(day, editReminders, setEditReminders)}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
                          editReminders.includes(day) ? 'bg-[#2c2c2c] text-white border-[#2c2c2c]' : 'bg-white text-[#8C7A6B] border-[#EBE5DA]'
                        )}
                      >
                        H-{day}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEdit(m._id)} className="flex-1 bg-[#2c2c2c] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#1a1a1a] transition-all">Save</button>
                    <button onClick={() => setEditingId(null)} className="px-6 border border-[#EBE5DA] rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#FDFCF8] transition-all">Cancel</button>
                  </div>
                </div>
              );
            }

            return (
              <div key={m._id} className="bg-white border border-[#EBE5DA] rounded-3xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:shadow-md transition-all duration-300">
                <div className="space-y-4 flex-grow">
                  <div className="flex items-center gap-4">
                    <div className={clsx(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm",
                      daysLeft < 7 ? "bg-red-50 text-red-500 border border-red-100" : "bg-[#FDFCF8] text-[#8C7A6B] border border-[#EBE5DA]"
                    )}>
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif text-[#1a1a1a]">{m.title}</h3>
                      <p className="text-xs font-bold text-[#8C7A6B] uppercase tracking-widest">
                        {format(new Date(m.date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  {m.description && (
                    <div className="bg-[#FDFCF8] border border-[#EBE5DA] p-4 rounded-2xl flex items-start gap-3">
                      <Info className="w-4 h-4 text-[#8C7A6B] mt-0.5" />
                      <p className="text-sm text-[#5a5a5a] italic">{m.description}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {m.reminders.map((r: number) => (
                      <span key={r} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBE5DA] text-[#8C7A6B] text-[10px] font-bold uppercase tracking-wider">
                        <Bell className="w-2.5 h-2.5" /> H-{r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center justify-between md:items-end gap-4 min-w-[120px]">
                  <div className="text-right">
                    <p className="text-4xl font-serif text-[#1a1a1a] tabular-nums">{daysLeft}</p>
                    <p className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-widest">days left</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(m)} className="p-2 hover:bg-[#EBE5DA] rounded-xl text-[#8C7A6B] transition-colors"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(m._id)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl text-[#C4BCB3] transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
