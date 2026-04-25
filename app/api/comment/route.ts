import { NextRequest, NextResponse } from 'next/server';
import { addComment, getComments } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { artworkId, name, text } = await req.json();
    if (!name || !text) {
      return NextResponse.json({ error: 'Name and text are required' }, { status: 400 });
    }
    await addComment(artworkId, name, text);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Comment error:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const artworkId = searchParams.get('artworkId');
    if (!artworkId) {
      return NextResponse.json({ error: 'artworkId is required' }, { status: 400 });
    }
    const comments = await getComments(parseInt(artworkId));
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Fetch comments error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}
