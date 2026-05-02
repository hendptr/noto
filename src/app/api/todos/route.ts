import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Todo from '@/models/Todo';

export async function GET() {
  await connectToDatabase();
  const todos = await Todo.find().sort({ dueDate: 1 });
  return NextResponse.json(todos);
}

export async function POST(req: Request) {
  await connectToDatabase();
  const data = await req.json();
  const newTodo = new Todo({
    task: data.task,
    dueDate: new Date(data.dueDate),
    recurrence: data.recurrence || 'none',
    reminders: data.reminders || [{ time: new Date(data.dueDate), sent: false }]
  });
  await newTodo.save();
  return NextResponse.json(newTodo);
}
