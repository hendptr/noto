import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Expense from '@/models/Expense';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const { id } = await params;
  const data = await req.json();
  const updated = await Expense.findByIdAndUpdate(
    id,
    {
      $set: {
        amount: Number(data.amount),
        description: data.description,
        category: data.category,
        currency: data.currency,
        date: data.date ? new Date(data.date) : undefined,
      }
    },
    { new: true }
  );
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const { id } = await params;
  await Expense.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
