import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    await sql`UPDATE stats SET value = 0 WHERE key = 'visitor_count'`;
    return NextResponse.json({ success: true, message: 'Visitor count reset to 0' });
  } catch (error) {
    console.error('Error resetting visitor count:', error);
    return NextResponse.json({ error: 'Failed to reset' }, { status: 500 });
  }
}
