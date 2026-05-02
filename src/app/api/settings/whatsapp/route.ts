import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Settings from '@/models/Settings';

export async function GET() {
  await connectToDatabase();
  let settings = await Settings.findOne({ id: 'global' });
  if (!settings) {
    settings = new Settings({ id: 'global' });
    await settings.save();
  }
  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  await connectToDatabase();
  const data = await req.json();
  const settings = await Settings.findOneAndUpdate(
    { id: 'global' },
    { whatsappNumber: data.whatsappNumber },
    { new: true, upsert: true }
  );
  return NextResponse.json(settings);
}
