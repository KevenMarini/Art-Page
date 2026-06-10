import { NextResponse } from 'next/server';
import { updateArtworkPositions } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const { items } = await request.json();
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items array' }, { status: 400 });
    }
    
    await updateArtworkPositions(items);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reorder artworks' }, { status: 500 });
  }
}
