'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, Pencil, Check, X, Bell, Calendar, Repeat, Plus, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';

const DAYS = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

const RECURRENCE_OPTIONS = [
  { value: 'none',    label: 'Does not repeat' },
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'mon-fri', label: 'Mon – Fri' },
  { value: 'custom',  label: 'Custom days…' },
];

function recurrenceLabel(todo: any) {
  if (todo.recurrence === 'custom' && todo.customDays?.length) {
    return DAYS.filter(d => todo.customDays.includes(d.value)).map(d => d.label).join(', ');
  }
  return RECURRENCE_OPTIONS.find(o => o.value === todo.recurrence)?.label || todo.recurrence;
}

const fieldCls = 'w-full bg-white border border-[#EBE5DA] rounded-xl px-4 py-3 text-sm text-[#2c2c2c] placeholder-[#C4BCB3] focus:outline-none focus:ring-2 focus:ring-[#8C7A6B]/20 focus:border-[#8C7A6B] transition-all';

export default function TasksPage() {
  const [todos, setTodos] = useState<any[]>([]);

  const [task, setTask]             = useState('');
  const [dueDate, setDueDate]       = useState('');
  const [recurrence, setRecurrence] = useState('none');
  const [customDays, setCustomDays] = useState<number[]>([]);

  const [editingId, setEditingId]           = useState<string | null>(null);
  const [editTask, setEditTask]             = useState('');
  const [editDueDate, setEditDueDate]       = useState('');
  const [editRecurrence, setEditRecurrence] = useState('none');
  const [editCustomDays, setEditCustomDays] = useState<number[]>([]);
  const [deletingId, setDeletingId]         = useState<string | null>(null);

  useEffect(() => { fetchTodos(); }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      setTodos(await res.json());
    } catch (err) {
      console.error('Failed to fetch todos:', err);
    }
  };

  const toggleDay = (day: number, list: number[], setList: (v: number[]) => void) =>
    setList(list.includes(day) ? list.filter(d => d !== day) : [...list, day]);

  const handleAdd = async (e: any) => {
    e.preventDefault();
    await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, dueDate, recurrence, customDays }),
    });
    setTask(''); setDueDate(''); setRecurrence('none'); setCustomDays([]);
    fetchTodos();
  };

  const startEdit = (todo: any) => {
    setEditingId(todo._id);
    setEditTask(todo.task);
    setEditDueDate(new Date(todo.dueDate).toISOString().slice(0, 16));
    setEditRecurrence(todo.recurrence);
    setEditCustomDays(todo.customDays || []);
  };

  const handleSaveEdit = async (id: string) => {
    await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: editTask, dueDate: editDueDate, recurrence: editRecurrence, customDays: editCustomDays }),
    });
    setEditingId(null);
    fetchTodos();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this reminder?')) return;
    setDeletingId(id);
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    fetchTodos();
  };

  const pending   = todos.filter(t => t.status === 'pending').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const completed = todos.filter(t => t.status === 'completed').sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  const DayPicker = ({ list, setList }: { list: number[]; setList: (v: number[]) => void }) => (
    <div className="flex flex-wrap gap-2 mt-3">
      {DAYS.map(d => (
        <button
          key={d.value}
          type="button"
          onClick={() => toggleDay(d.value, list, setList)}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all',
            list.includes(d.value)
              ? 'bg-[#2c2c2c] text-white border-[#2c2c2c] scale-105'
              : 'bg-white text-[#8C7A6B] border-[#EBE5DA] hover:border-[#8C7A6B]'
          )}
        >
          {d.label}
        </button>
      ))}
    </div>
  );

  const TodoCard = ({ todo }: { todo: any }) => {
    const isEditing = editingId === todo._id;
    const dateObj   = new Date(todo.dueDate);
    const isOverdue = todo.status === 'pending' && dateObj < new Date();

    if (isEditing) {
      return (
        <div className="bg-white border-2 border-[#8C7A6B] rounded-3xl p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8C7A6B] flex items-center gap-2">
              <Pencil className="w-3 h-3" /> Edit Reminder
            </h4>
            <button onClick={() => setEditingId(null)} className="text-[#C4BCB3] hover:text-[#2c2c2c] transition-colors p-1.5 rounded-full hover:bg-[#EBE5DA]">
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            type="text" value={editTask} onChange={e => setEditTask(e.target.value)}
            className={`${fieldCls} text-base font-medium`}
            placeholder="What needs to be done?"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-[0.2em] ml-1">Due Date & Time</label>
              <input type="datetime-local" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} className={fieldCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-[0.2em] ml-1">Repeat</label>
              <select value={editRecurrence} onChange={e => setEditRecurrence(e.target.value)} className={fieldCls}>
                {RECURRENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {editRecurrence === 'custom' && (
            <div className="bg-[#FDFCF8] border border-[#EBE5DA] rounded-xl p-4">
              <p className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-[0.2em]">Repeat on:</p>
              <DayPicker list={editCustomDays} setList={setEditCustomDays} />
            </div>
          )}

          <button
            onClick={() => handleSaveEdit(todo._id)}
            className="w-full flex items-center justify-center gap-2 bg-[#2c2c2c] text-white h-11 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#1a1a1a] transition-all active:scale-[0.98]"
          >
            <Check className="w-4 h-4" /> Save Changes
          </button>
        </div>
      );
    }

    return (
      <div className={clsx(
        'bg-white border border-[#EBE5DA] rounded-2xl px-5 py-4 flex items-center justify-between group hover:shadow-md hover:border-[#d4ccc2] transition-all duration-200',
        todo.status === 'completed' && 'opacity-55'
      )}>
        <div className="flex items-center gap-4">
          {/* Status icon */}
          <div className={clsx(
            'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-110',
            todo.status === 'completed'
              ? 'bg-green-50 text-green-600 border-green-100'
              : isOverdue
                ? 'bg-red-50 text-red-500 border-red-100'
                : 'bg-[#FDFCF8] text-[#8C7A6B] border-[#EBE5DA]'
          )}>
            {todo.status === 'completed'
              ? <Check className="w-5 h-5" />
              : <Bell className={clsx('w-5 h-5', isOverdue && 'animate-pulse')} />
            }
          </div>

          <div>
            <h3 className={clsx(
              'font-medium text-[#2c2c2c] transition-colors',
              todo.status === 'completed' && 'line-through text-[#8C7A6B]'
            )}>
              {todo.task}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={clsx(
                'flex items-center text-[10px] font-bold uppercase tracking-wider',
                isOverdue ? 'text-red-500' : 'text-[#8C7A6B]'
              )}>
                <Calendar className="w-3 h-3 mr-1" />
                {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </span>
              {todo.recurrence !== 'none' && (
                <span className="flex items-center text-[10px] font-bold text-[#8C7A6B] uppercase tracking-wider bg-[#EBE5DA] px-2 py-0.5 rounded-md">
                  <Repeat className="w-2.5 h-2.5 mr-1" />
                  {recurrenceLabel(todo)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            {todo.status === 'pending' && (
              <button onClick={() => startEdit(todo)} className="w-8 h-8 flex items-center justify-center text-[#8C7A6B] hover:text-[#2c2c2c] hover:bg-[#EBE5DA] rounded-lg transition-all" title="Edit">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={() => handleDelete(todo._id)} disabled={deletingId === todo._id} className="w-8 h-8 flex items-center justify-center text-[#C4BCB3] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className={clsx(
            'px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest',
            todo.status === 'completed'
              ? 'bg-green-100 text-green-700'
              : isOverdue
                ? 'bg-red-100 text-red-600'
                : 'bg-amber-100 text-amber-700'
          )}>
            {isOverdue && todo.status === 'pending' ? 'overdue' : todo.status}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#2C2C2C]">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">

        {/* ── Header ── */}
        <header className="mb-16">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#8C7A6B] hover:text-[#2c2c2c] transition-colors mb-6">
            <ChevronLeft className="w-3.5 h-3.5" /> Diary
          </Link>
          <h1 className="text-5xl font-serif text-[#1a1a1a] tracking-tight mb-2">Reminders</h1>
          <p className="text-[#8C7A6B] font-medium tracking-wide text-sm">Sync with WhatsApp · stay on track.</p>
        </header>

        {/* ── Add Form ── */}
        <div className="bg-white border border-[#EBE5DA] rounded-3xl shadow-sm p-8 mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-full bg-[#8C7A6B] flex items-center justify-center text-white">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#2c2c2c]">New Reminder</h2>
          </div>

          <form onSubmit={handleAdd} className="space-y-5">
            {/* Task input — big and prominent */}
            <div className="bg-[#FDFCF8] border border-[#EBE5DA] rounded-2xl px-5 py-4">
              <input
                type="text"
                placeholder="What do you need to remember?"
                required
                value={task}
                onChange={e => setTask(e.target.value)}
                className="w-full bg-transparent border-none text-xl font-serif text-[#1a1a1a] placeholder-[#D4CEC8] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5 space-y-1.5">
                <label className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-[0.2em] ml-1">Due Date & Time</label>
                <input
                  type="datetime-local" required value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className={`${fieldCls} h-12`}
                />
              </div>
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-[0.2em] ml-1">Repeat</label>
                <select value={recurrence} onChange={e => setRecurrence(e.target.value)} className={`${fieldCls} h-12`}>
                  {RECURRENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="md:col-span-3 flex items-end">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-[#2c2c2c] text-[#FDFCF8] h-12 rounded-xl hover:bg-[#1a1a1a] transition-all active:scale-[0.98] font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#2c2c2c]/10"
                >
                  <Plus className="w-3.5 h-3.5" /> Create
                </button>
              </div>
            </div>

            {recurrence === 'custom' && (
              <div className="bg-[#FDFCF8] border border-[#EBE5DA] rounded-xl p-4 animate-in slide-in-from-top-2 duration-200">
                <p className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-[0.2em]">Repeat on:</p>
                <DayPicker list={customDays} setList={setCustomDays} />
              </div>
            )}
          </form>
        </div>

        {/* ── Task List ── */}
        <main className="space-y-14">
          {/* Pending */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-[0.3em] whitespace-nowrap">
                Next Up <span className="text-[#C4BCB3]">({pending.length})</span>
              </h2>
              <div className="h-px bg-[#EBE5DA] flex-grow" />
            </div>

            {pending.length > 0 ? (
              <div className="space-y-3">
                {pending.map(todo => <TodoCard key={todo._id} todo={todo} />)}
              </div>
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-[#EBE5DA] rounded-3xl">
                <p className="text-3xl mb-3">☕</p>
                <p className="text-[#C4BCB3] font-medium font-serif italic">All clear. Enjoy your day.</p>
              </div>
            )}
          </section>

          {/* Completed */}
          {completed.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-[0.3em] whitespace-nowrap">
                  Done <span className="text-[#C4BCB3]">({completed.length})</span>
                </h2>
                <div className="h-px bg-[#EBE5DA] flex-grow" />
              </div>
              <div className="space-y-3">
                {completed.map(todo => <TodoCard key={todo._id} todo={todo} />)}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
