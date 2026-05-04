import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import DailyEntry from '@/models/DailyEntry';
import Expense from '@/models/Expense';
import { subDays, format } from 'date-fns';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Get last 30 days
    const now = new Date();
    const thirtyDaysAgoDate = subDays(now, 30);
    const thirtyDaysAgoStr = format(thirtyDaysAgoDate, 'yyyy-MM-dd');
    
    const entries = await DailyEntry.find({
      date: { $gte: thirtyDaysAgoStr }
    }).sort({ date: 1 });

    const expenses = await Expense.find({
      date: { $gte: thirtyDaysAgoDate }
    });

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

    // Expense stats
    const totalJPY = expenses.filter(e => e.currency === 'JPY').reduce((s, e) => s + e.amount, 0);
    const totalIDR = expenses.filter(e => e.currency === 'IDR').reduce((s, e) => s + e.amount, 0);

    const categoryBreakdown = expenses.reduce((acc: any, exp: any) => {
      const cat = exp.category || 'Other';
      if (!acc[cat]) acc[cat] = { JPY: 0, IDR: 0, count: 0 };
      acc[cat][exp.currency] += exp.amount;
      acc[cat].count += 1;
      return acc;
    }, {});

    const averageHappiness = daysWithHappiness > 0 ? (totalHappiness / daysWithHappiness).toFixed(1) : 0;

    return NextResponse.json({ 
      chartData, 
      averageHappiness,
      bestDay,
      expenses: {
        totalJPY,
        totalIDR,
        categoryBreakdown: Object.entries(categoryBreakdown).map(([name, data]: any) => ({
          name,
          ...data
        })).sort((a, b) => b.JPY - a.JPY)
      }
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
