import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import DailyEntry from '@/models/DailyEntry';
import { subDays, format } from 'date-fns';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Get last 30 days
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    
    const entries = await DailyEntry.find({
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 });

    let totalHappiness = 0;
    let daysWithHappiness = 0;
    let bestDay = null;
    let highestHappiness = 0;

    const chartData = entries.map(entry => {
      if (entry.happiness) {
        totalHappiness += entry.happiness;
        daysWithHappiness++;
        
        if (entry.happiness > highestHappiness && (entry.highlight || entry.activities)) {
          highestHappiness = entry.happiness;
          bestDay = { date: entry.date, highlight: entry.highlight, activities: entry.activities };
        }
      }
      return {
        date: entry.date.slice(5), // MM-DD for chart
        happiness: entry.happiness || null
      };
    });

    const averageHappiness = daysWithHappiness > 0 ? (totalHappiness / daysWithHappiness).toFixed(1) : 0;

    return NextResponse.json({ 
      chartData, 
      averageHappiness,
      bestDay
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
