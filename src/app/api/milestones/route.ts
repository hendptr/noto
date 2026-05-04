import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Milestone from '@/models/Milestone';

export async function GET() {
  await connectToDatabase();
  const milestones = await Milestone.find().sort({ date: 1 });
  return NextResponse.json(milestones);
}

export async function POST(req: Request) {
  await connectToDatabase();
  const data = await req.json();
  const newMilestone = new Milestone({
    title: data.title,
    date: new Date(data.date),
    description: data.description,
    reminders: data.reminders || [1]
  });
  await newMilestone.save();
  return NextResponse.json(newMilestone);
}
