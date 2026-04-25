import { NextRequest, NextResponse } from 'next/server';
import { addLike } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { artworkId } = await req.json();
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

    const success = await addLike(artworkId, ip);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json({ error: 'Failed to add like' }, { status: 500 });
  }
}
