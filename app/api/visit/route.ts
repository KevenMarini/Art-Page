import { NextResponse } from 'next/server';
import { incrementVisitorCount, getVisitorCount } from '@/lib/db';

export async function POST() {
  try {
    await incrementVisitorCount();
    const count = await getVisitorCount();
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Error in visit API:', error);
    return NextResponse.json({ error: 'Failed to track visit' }, { status: 500 });
  }
}
