'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, Pencil, Check, X, Bell, Calendar, Repeat } from 'lucide-react';
import clsx from 'clsx';

const DAYS = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
];

const RECURRENCE_OPTIONS = [
  { value: 'none',        label: 'Does not repeat' },
  { value: 'daily',       label: 'Daily' },
  { value: 'weekly',      label: 'Weekly' },
  { value: 'mon-fri',     label: 'Mon – Fri' },
  { value: 'custom',      label: 'Custom days…' },
];

function recurrenceLabel(todo: any) {
  if (todo.recurrence === 'custom' && todo.customDays?.length) {
    return DAYS.filter(d => todo.customDays.includes(d.value)).map(d => d.label).join(', ');
  }
  return RECURRENCE_OPTIONS.find(o => o.value === todo.recurrence)?.label || todo.recurrence;
}

const inputCls = 'bg-white border border-[#EBE5DA] rounded-xl px-4 py-3 text-sm text-[#2c2c2c] placeholder-[#C4BCB3] focus:outline-none focus:ring-2 focus:ring-[#8C7A6B]/20 focus:border-[#8C7A6B] transition-all shadow-sm';

export default function TasksPage() {
  const [todos, setTodos] = useState<any[]>([]);

  // Add form
  const [task, setTask]               = useState('');
  const [dueDate, setDueDate]         = useState('');
  const [recurrence, setRecurrence]   = useState('none');
  const [customDays, setCustomDays]   = useState<number[]>([]);

  // Edit state
  const [editingId, setEditingId]           = useState<string | null>(null);
  const [editTask, setEditTask]             = useState('');
  const [editDueDate, setEditDueDate]       = useState('');
  const [editRecurrence, setEditRecurrence] = useState('none');
  const [editCustomDays, setEditCustomDays] = useState<number[]>([]);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { fetchTodos(); }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      const data = await res.json();
      setTodos(data);
    } catch (err) {
      console.error('Failed to fetch todos:', err);
    }
  };

  const toggleDay = (day: number, list: number[], setList: (v: number[]) => void) => {
    setList(list.includes(day) ? list.filter(d => d !== day) : [...list, day]);
  };

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

  const cancelEdit = () => setEditingId(null);

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
    if (!confirm('Are you sure you want to delete this reminder?')) return;
    setDeletingId(id);
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    fetchTodos();
  };

  const pending   = todos.filter(t => t.status === 'pending').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const completed = todos.filter(t => t.status === 'completed').sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  const DayPicker = ({ list, setList }: { list: number[]; setList: (v: number[]) => void }) => (
    <div className="flex gap-2 flex-wrap mt-2">
      {DAYS.map(d => (
        <button
          key={d.value}
          type="button"
          onClick={() => toggleDay(d.value, list, setList)}
          className={clsx(
            "w-9 h-9 rounded-full text-xs font-bold transition-all duration-300 border",
            list.includes(d.value)
              ? "bg-[#2c2c2c] text-[#FDFCF8] border-[#2c2c2c] scale-110 shadow-md"
              : "bg-white text-[#8C7A6B] border-[#EBE5DA] hover:border-[#8C7A6B]"
          )}
        >
          {d.label}
        </button>
      ))}
    </div>
  );

  const TodoCard = ({ todo }: { todo: any }) => {
    const isEditing = editingId === todo._id;

    if (isEditing) {
      return (
        <div className="bg-white border-2 border-[#8C7A6B] rounded-3xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#8C7A6B] flex items-center">
              <Pencil className="w-3 h-3 mr-2" /> Edit Reminder
            </h4>
            <button onClick={cancelEdit} className="text-[#C4BCB3] hover:text-[#2c2c2c] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <input
            type="text" value={editTask} onChange={e => setEditTask(e.target.value)}
            className={`w-full ${inputCls} text-lg font-medium`} placeholder="What needs to be done?"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#8C7A6B] uppercase tracking-wider ml-1">Due Date & Time</label>
              <input
                type="datetime-local" value={editDueDate} onChange={e => setEditDueDate(e.target.value)}
                className={`w-full ${inputCls}`}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#8C7A6B] uppercase tracking-wider ml-1">Recurrence</label>
              <select value={editRecurrence} onChange={e => setEditRecurrence(e.target.value)} className={`w-full ${inputCls}`}>
                {RECURRENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          {editRecurrence === 'custom' && (
            <div className="bg-[#FDFCF8] p-4 rounded-2xl border border-[#EBE5DA]">
              <p className="text-[10px] text-[#8C7A6B] mb-3 uppercase tracking-widest font-bold">Repeat on these days:</p>
              <DayPicker list={editCustomDays} setList={setEditCustomDays} />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={() => handleSaveEdit(todo._id)} className="flex-1 flex items-center justify-center gap-2 bg-[#2c2c2c] text-white px-6 py-3.5 rounded-2xl text-sm font-bold hover:bg-[#1a1a1a] transition-all active:scale-95 shadow-lg shadow-[#2c2c2c]/20">
              <Check className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>
      );
    }

    const dateObj = new Date(todo.dueDate);
    const isOverdue = todo.status === 'pending' && dateObj < new Date();

    return (
      <div className={clsx(
        "bg-white border border-[#EBE5DA] rounded-3xl px-6 py-5 flex justify-between items-center group transition-all duration-300 hover:shadow-lg hover:shadow-[#8C7A6B]/5 hover:-translate-y-0.5",
        todo.status === 'completed' && "opacity-60 bg-[#FDFCF8]"
      )}>
        <div className="flex items-center gap-5">
          <div className={clsx(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
            todo.status === 'completed' ? "bg-green-50 text-green-600" : isOverdue ? "bg-red-50 text-red-500" : "bg-[#FDFCF8] text-[#8C7A6B]"
          )}>
            {todo.status === 'completed' ? <Check className="w-6 h-6" /> : <Bell className={clsx("w-6 h-6", isOverdue && "animate-pulse")} />}
          </div>
          <div>
            <h3 className={clsx(
              "text-[#2c2c2c] font-medium text-lg tracking-tight transition-all",
              todo.status === 'completed' && "line-through text-[#8C7A6B]"
            )}>
              {todo.task}
            </h3>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <div className={clsx(
                "flex items-center text-xs font-medium",
                isOverdue ? "text-red-500" : "text-[#8C7A6B]"
              )}>
                <Calendar className="w-3 h-3 mr-1.5" />
                {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </div>
              {todo.recurrence !== 'none' && (
                <div className="flex items-center text-xs font-bold text-[#8C7A6B] uppercase tracking-widest bg-[#EBE5DA]/50 px-2.5 py-0.5 rounded-full">
                  <Repeat className="w-3 h-3 mr-1.5" />
                  {recurrenceLabel(todo)}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2">
            {todo.status === 'pending' && (
              <button 
                onClick={() => startEdit(todo)} 
                className="w-10 h-10 flex items-center justify-center text-[#8C7A6B] hover:text-[#2c2c2c] hover:bg-[#EBE5DA] rounded-xl transition-all" 
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={() => handleDelete(todo._id)} 
              disabled={deletingId === todo._id} 
              className="w-10 h-10 flex items-center justify-center text-[#C4BCB3] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" 
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className={clsx(
            "px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-black transition-all",
            todo.status === 'completed' ? "bg-green-100 text-green-700 shadow-sm shadow-green-200" : "bg-amber-100 text-amber-700 shadow-sm shadow-amber-200"
          )}>
            {todo.status}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] selection:bg-[#8C7A6B]/20">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-5xl font-serif text-[#1a1a1a] tracking-tight mb-2">Reminders</h1>
            <p className="text-[#8C7A6B] font-medium tracking-wide">Sync with WhatsApp · stay on track.</p>
          </div>
          <Link href="/" className="text-sm text-[#8C7A6B] hover:text-[#2c2c2c] transition-all font-bold uppercase tracking-widest border-b border-transparent hover:border-[#2c2c2c] pb-1">
            Diary
          </Link>
        </header>

        {/* Add Form */}
        <form onSubmit={handleAdd} className="bg-white border border-[#EBE5DA] rounded-[2.5rem] shadow-xl shadow-[#8C7A6B]/5 p-8 mb-16 space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#8C7A6B] uppercase tracking-[0.2em] ml-1">What's on your mind?</label>
            <input
              type="text" placeholder="e.g. Call mom, Finish the report..." required
              value={task} onChange={e => setTask(e.target.value)}
              className={`w-full ${inputCls} text-lg`}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5 space-y-1">
              <label className="text-[10px] font-bold text-[#8C7A6B] uppercase tracking-[0.2em] ml-1">Due Date</label>
              <input
                type="datetime-local" required value={dueDate} onChange={e => setDueDate(e.target.value)}
                className={`w-full ${inputCls}`}
              />
            </div>
            <div className="md:col-span-4 space-y-1">
              <label className="text-[10px] font-bold text-[#8C7A6B] uppercase tracking-[0.2em] ml-1">Frequency</label>
              <select value={recurrence} onChange={e => setRecurrence(e.target.value)} className={`w-full ${inputCls}`}>
                {RECURRENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-3 flex items-end">
              <button type="submit" className="w-full bg-[#2c2c2c] text-[#FDFCF8] h-[50px] rounded-xl hover:bg-[#1a1a1a] transition-all active:scale-95 font-bold text-sm shadow-lg shadow-[#2c2c2c]/20">
                Create
              </button>
            </div>
          </div>
          {recurrence === 'custom' && (
            <div className="pt-2 animate-in slide-in-from-top-2 duration-300">
              <p className="text-[10px] text-[#8C7A6B] mb-3 uppercase tracking-[0.2em] font-bold">Select Repeat Days:</p>
              <DayPicker list={customDays} setList={setCustomDays} />
            </div>
          )}
        </form>

        <main className="space-y-16">
          {/* Pending Section */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-xs font-black text-[#8C7A6B] uppercase tracking-[0.3em] whitespace-nowrap">
                Next Up ({pending.length})
              </h2>
              <div className="h-px bg-[#EBE5DA] flex-grow" />
            </div>
            
            {pending.length > 0 ? (
              <div className="space-y-4">
                {pending.map(todo => <TodoCard key={todo._id} todo={todo} />)}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-[#EBE5DA] rounded-[2rem]">
                <p className="text-[#C4BCB3] font-medium italic">All tasks completed. Time to relax.</p>
              </div>
            )}
          </section>

          {/* Completed Section */}
          {completed.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-xs font-black text-[#8C7A6B] uppercase tracking-[0.3em] whitespace-nowrap">
                  Archive ({completed.length})
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
