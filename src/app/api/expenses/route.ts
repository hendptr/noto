import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Expense from '@/models/Expense';

export async function GET() {
  await connectToDatabase();
  const expenses = await Expense.find().sort({ date: -1 });
  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  await connectToDatabase();
  const data = await req.json();
  const newExpense = new Expense({
    amount: data.amount,
    description: data.description,
    category: data.category || 'Uncategorized',
    source: 'manual'
  });
  await newExpense.save();
  return NextResponse.json(newExpense);
}
