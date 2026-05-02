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
  return NextResponse.json({ dashboardNote: settings.dashboardNote || '' });
}

export async function POST(req: Request) {
  await connectToDatabase();
  const { dashboardNote } = await req.json();
  const settings = await Settings.findOneAndUpdate(
    { id: 'global' },
    { dashboardNote },
    { new: true, upsert: true }
  );
  return NextResponse.json({ dashboardNote: settings.dashboardNote });
}
