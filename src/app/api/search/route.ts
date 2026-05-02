import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import DailyEntry from '@/models/DailyEntry';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q) {
      return NextResponse.json({ entries: [] });
    }

    await connectToDatabase();
    
    // Create a case-insensitive regex for the search query
    const regex = new RegExp(q, 'i');

    const entries = await DailyEntry.find({
      $or: [
        { highlight: regex },
        { kadai: regex },
        { activities: regex },
        { 'customColumns.content': regex },
        { 'customColumns.category': regex }
      ]
    }).sort({ date: -1 }).limit(20);

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error searching diary:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
