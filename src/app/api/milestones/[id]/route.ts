import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Milestone from '@/models/Milestone';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const { id } = await params;
  await Milestone.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const { id } = await params;
  const data = await req.json();
  const updated = await Milestone.findByIdAndUpdate(id, {
    title: data.title,
    date: new Date(data.date),
    description: data.description,
    reminders: data.reminders
  }, { new: true });
  return NextResponse.json(updated);
}
