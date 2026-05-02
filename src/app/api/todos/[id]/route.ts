import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Todo from '@/models/Todo';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const { id } = await params;
  const data = await req.json();
  const updated = await Todo.findByIdAndUpdate(
    id,
    {
      $set: {
        task: data.task,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        recurrence: data.recurrence,
        customDays: data.customDays || [],
      }
    },
    { new: true }
  );
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const { id } = await params;
  await Todo.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
