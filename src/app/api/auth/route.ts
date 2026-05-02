import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Pin from '@/models/Pin';

export async function POST(req: Request) {
  try {
    const { pin } = await req.json();
    await connectToDatabase();

    // Check if any PIN exists in the DB
    let storedPin = await Pin.findOne();
    
    // If no PIN exists, create the default one
    if (!storedPin) {
      storedPin = await Pin.create({ pin: '0609' });
    }

    if (pin === storedPin.pin) {
      const response = NextResponse.json({ success: true });
      // Set an HTTP-only cookie for authentication
      response.cookies.set({
        name: 'auth_token',
        value: 'authenticated',
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: 'lax',
      });
      return response;
    }

    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
