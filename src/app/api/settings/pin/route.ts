import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Pin from '@/models/Pin';

export async function PUT(req: Request) {
  try {
    const { oldPin, newPin } = await req.json();
    await connectToDatabase();

    const storedPin = await Pin.findOne();
    if (!storedPin) {
      return NextResponse.json({ error: 'System error: PIN not initialized' }, { status: 500 });
    }

    if (oldPin !== storedPin.pin) {
      return NextResponse.json({ error: 'Incorrect current PIN' }, { status: 401 });
    }

    storedPin.pin = newPin;
    await storedPin.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating PIN:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
