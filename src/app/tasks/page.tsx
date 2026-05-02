'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TasksPage() {
  const [todos, setTodos] = useState<any[]>([]);
  const [task, setTask] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurrence, setRecurrence] = useState('none');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    const res = await fetch('/api/todos');
    const data = await res.json();
    setTodos(data);
  };

  const handleAdd = async (e: any) => {
    e.preventDefault();
    await fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify({ task, dueDate, recurrence })
    });
    setTask('');
    fetchTodos();
  };

  return (
    <div className="max-w-3xl mx-auto py-20 px-8">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-serif text-[#2c2c2c] mb-2">Reminders</h1>
          <p className="text-[#8C7A6B]">Manage your tasks and schedule WhatsApp notifications.</p>
        </div>
        <Link href="/" className="text-[#8C7A6B] hover:text-[#2c2c2c] transition-colors">
          Back to Diary
        </Link>
      </div>

      <form onSubmit={handleAdd} className="bg-white/50 backdrop-blur-xl border border-white/40 p-6 rounded-2xl shadow-xl mb-10 space-y-4">
        <input
          type="text"
          placeholder="e.g. Health Log or Buy Groceries"
          required
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className="w-full bg-white/60 border-none rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#EBE5DA] text-[#2c2c2c]"
        />
        <div className="flex space-x-4">
          <input
            type="datetime-local"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="flex-1 bg-white/60 border-none rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#EBE5DA] text-[#2c2c2c]"
          />
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
            className="bg-white/60 border-none rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#EBE5DA] text-[#2c2c2c]"
          >
            <option value="none">Does not repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="mon-fri">Mon-Fri</option>
          </select>
          <button type="submit" className="bg-[#2c2c2c] text-[#EBE5DA] px-6 py-3 rounded-xl hover:bg-[#1a1a1a] transition-colors">
            Add
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {todos.map(todo => (
          <div key={todo._id} className="bg-white/40 p-5 rounded-2xl flex justify-between items-center">
            <div>
              <h3 className="text-[#2c2c2c] font-medium text-lg">{todo.task}</h3>
              <p className="text-[#8C7A6B] text-sm">
                {new Date(todo.dueDate).toLocaleString()} 
                {todo.recurrence !== 'none' && <span className="ml-2 px-2 py-0.5 bg-[#EBE5DA] rounded-full text-xs uppercase tracking-wider">{todo.recurrence}</span>}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs uppercase tracking-widest font-bold ${todo.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {todo.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
