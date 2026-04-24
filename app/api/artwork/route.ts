import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getArtworks, deleteArtwork } from '@/lib/db';

export async function GET() {
  try {
    const artworks = await getArtworks();
    return NextResponse.json(artworks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch artworks' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const url = searchParams.get('url');

  if (!id || !url) {
    return NextResponse.json({ error: 'Missing id or url' }, { status: 400 });
  }

  try {
    // 1. Delete from Vercel Blob
    await del(url);

    // 2. Delete from Postgres
    await deleteArtwork(parseInt(id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete artwork' }, { status: 500 });
  }
}
