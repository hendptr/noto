'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { ArrowLeft, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';

export default function InsightsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/insights')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#2C2C2C] p-4 md:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Navigation */}
        <nav className="flex items-center justify-between border-b border-[#EBE5DA] pb-8">
          <Link href="/" className="text-[#8C7A6B] hover:text-[#2C2C2C] transition-colors flex items-center font-bold uppercase tracking-widest text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Diary
          </Link>
          <div className="flex items-center text-[#1a1a1a]">
            <BarChart2 className="w-6 h-6 mr-2 text-[#8C7A6B]" />
            <h1 className="text-2xl font-serif tracking-tight">Insights</h1>
          </div>
        </nav>

        {loading ? (
          <div className="flex justify-center py-32">
            <div className="w-8 h-8 border-2 border-[#EBE5DA] border-t-[#8C7A6B] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-16">
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 rounded-3xl border border-[#EBE5DA] bg-white text-center shadow-sm">
                <p className="text-xs font-bold text-[#8C7A6B] uppercase tracking-widest mb-4">Average Happiness</p>
                <p className="text-6xl font-serif text-[#1a1a1a]">{data?.averageHappiness}</p>
                <p className="text-sm text-[#8C7A6B] mt-2 italic">over the last 30 days</p>
              </div>

              {data?.bestDay ? (
                <div className="p-8 rounded-3xl border border-[#EBE5DA] bg-gradient-to-br from-[#FDFCF8] to-[#EBE5DA]/30 shadow-sm flex flex-col justify-center">
                  <p className="text-xs font-bold text-[#8C7A6B] uppercase tracking-widest mb-4">A Great Day</p>
                  <p className="text-sm font-bold text-[#1a1a1a] mb-2">{format(new Date(data.bestDay.date + 'T00:00:00'), 'MMMM d, yyyy')}</p>
                  <p className="text-lg font-serif text-[#2c2c2c] italic line-clamp-3">"{ (data.bestDay.highlight || data.bestDay.activities).replace(/<[^>]*>?/gm, '') }"</p>
                </div>
              ) : (
                <div className="p-8 rounded-3xl border border-[#EBE5DA] bg-[#FDFCF8] shadow-sm flex items-center justify-center text-[#8C7A6B] text-sm uppercase tracking-widest font-bold">
                  Keep writing to unlock more insights
                </div>
              )}
            </div>

            {/* Happiness Chart */}
            <div className="space-y-8">
              <div className="flex items-center">
                <span className="w-8 h-[1px] bg-[#EBE5DA] mr-4"></span>
                <h3 className="text-xs font-bold text-[#8C7A6B] uppercase tracking-widest">Happiness Trends</h3>
              </div>
              <div className="h-80 w-full bg-white p-6 rounded-3xl border border-[#EBE5DA] shadow-sm">
                {data?.chartData && data.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.chartData} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBE5DA" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#C4BCB3', fontSize: 12, fontWeight: 600 }}
                        dy={10}
                      />
                      <YAxis 
                        domain={[0, 10]} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#C4BCB3', fontSize: 12, fontWeight: 600 }} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#2C2C2C', borderRadius: '12px', border: 'none', color: '#FDFCF8' }}
                        itemStyle={{ color: '#FDFCF8', fontWeight: 'bold' }}
                        cursor={{ stroke: '#EBE5DA', strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="happiness" 
                        stroke="#8C7A6B" 
                        strokeWidth={4} 
                        dot={{ r: 4, fill: '#8C7A6B', strokeWidth: 0 }} 
                        activeDot={{ r: 6, fill: '#1a1a1a', strokeWidth: 0 }} 
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#C4BCB3] text-sm font-bold uppercase tracking-widest">
                    Not enough data to display chart
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
