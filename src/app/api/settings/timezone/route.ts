import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Settings from '@/models/Settings';

export async function GET() {
  await connectToDatabase();
  const settings = await Settings.findOne({ id: 'global' });
  return NextResponse.json({ timezone: settings?.timezone || 'Asia/Tokyo' });
}

export async function POST(req: Request) {
  await connectToDatabase();
  const { timezone } = await req.json();
  if (!timezone) return NextResponse.json({ error: 'Missing timezone' }, { status: 400 });

  await Settings.findOneAndUpdate(
    { id: 'global' },
    { timezone },
    { upsert: true }
  );
  return NextResponse.json({ timezone });
}
