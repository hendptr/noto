import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import DailyEntry from '@/models/DailyEntry';

// GET entry for a specific date
export async function GET(
  req: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    await connectToDatabase();
    const entry = await DailyEntry.findOne({ date });
    return NextResponse.json({ entry });
  } catch (error) {
    console.error('Error fetching entry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST to create or update an entry for a specific date
export async function POST(
  req: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    const data = await req.json();
    await connectToDatabase();

    // Upsert: Create if not exists, update if exists
    const entry = await DailyEntry.findOneAndUpdate(
      { date },
      { ...data, date },
      { new: true, upsert: true }
    );

    return NextResponse.json({ entry });
  } catch (error) {
    console.error('Error saving entry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
