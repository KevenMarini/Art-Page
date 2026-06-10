import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const setVal = searchParams.get('val') || '215';
    
    await sql`UPDATE stats SET value = ${parseInt(setVal)} WHERE key = 'visitor_count'`;
    return NextResponse.json({ success: true, newCount: setVal });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
