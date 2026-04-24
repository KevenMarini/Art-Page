import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { addArtwork, initDb } from '@/lib/db';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const title = formData.get('title') as string;
  const category = formData.get('category') as any;

  if (!file || !title || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Ensure DB is initialized (useful for first run)
    await initDb();

    // 1. Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
    });

    // 2. Save metadata to Postgres
    await addArtwork({
      title,
      url: blob.url,
      category,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
