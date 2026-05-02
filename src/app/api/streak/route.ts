import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import DailyEntry from '@/models/DailyEntry';
import { differenceInDays, format } from 'date-fns';

export async function GET() {
  try {
    await connectToDatabase();
    
    const entries = await DailyEntry.find({
      $or: [
        { highlight: { $ne: '' } },
        { activities: { $ne: '' } },
        { kadai: { $ne: '' } }
      ]
    }).sort({ date: -1 });

    if (entries.length === 0) {
      return NextResponse.json({ streak: 0 });
    }

    let streak = 0;
    let currentDate = new Date(); // Start checking from today
    currentDate.setHours(0,0,0,0);

    // If there is no entry for today or yesterday, streak is broken
    const latestEntryDate = new Date(entries[0].date + 'T00:00:00');
    latestEntryDate.setHours(0,0,0,0);
    
    const diffToLatest = differenceInDays(currentDate, latestEntryDate);
    
    if (diffToLatest > 1) {
      return NextResponse.json({ streak: 0 });
    }

    // Calculate streak
    let lastCheckedDate = currentDate;
    
    for (const entry of entries) {
      const entryDate = new Date(entry.date + 'T00:00:00');
      entryDate.setHours(0,0,0,0);
      
      const diff = differenceInDays(lastCheckedDate, entryDate);
      
      if (diff === 0 || diff === 1) {
        if (diff === 1 || (diff === 0 && streak === 0)) {
           streak++;
        }
        lastCheckedDate = entryDate;
      } else {
        break; // Gap of more than 1 day, streak broken
      }
    }

    return NextResponse.json({ streak });
  } catch (error) {
    console.error('Error calculating streak:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
