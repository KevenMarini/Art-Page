import { NextResponse } from 'next/server';
import { addArtwork, initDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

const INITIAL_ARTWORKS = [
  { url: '/ArtPhotos/WhatsApp Image 2025-05-03 at 11.05.06_f1f3be12.jpg', title: 'Elephant Study', category: 'Featured' },
  { url: '/ArtPhotos/3.jpg', title: 'Elegance in Lines', category: 'Initial' },
  { url: '/ArtPhotos/4.jpg', title: 'Dancing Ganesha', category: 'Initial' },
  { url: '/ArtPhotos/5.jpg', title: 'Ganesha Enthroned', category: 'Initial' },
  { url: '/ArtPhotos/7.jpg', title: 'Symmetrical Floral', category: 'Initial' },
  { url: '/ArtPhotos/8.jpg', title: 'Parrot Duo', category: 'Initial' },
  { url: '/ArtPhotos/9.jpg', title: 'Blooming Vines', category: 'Initial' },
  { url: '/ArtPhotos/11.jpg', title: 'Rustic Still Life', category: 'Initial' },
  { url: '/ArtPhotos/12.jpg', title: 'Harvest Shadows', category: 'Initial' },
  { url: '/ArtPhotos/13.jpg', title: 'Vine-Ripened', category: 'Initial' },
  { url: '/ArtPhotos/6.jpg', title: 'Solitary Bird', category: 'Pro' },
  { url: '/ArtPhotos/10.jpg', title: 'Quiet Reflection', category: 'Pro' },
  { url: '/ArtPhotos/14.jpg', title: 'Morning Song', category: 'Pro' },
  { url: '/ArtPhotos/15.jpg', title: 'Majestic Stag', category: 'Pro' },
  { url: '/ArtPhotos/16.jpg', title: 'Curious Kitten', category: 'Pro' },
  { url: '/ArtPhotos/17.jpg', title: 'Cheerful Pug', category: 'Pro' },
  { url: '/ArtPhotos/19.jpg', title: 'Lying Tiger', category: 'Pro' },
  { url: '/ArtPhotos/18.jpg', title: 'Macaw in Monochrome', category: 'Elite' },
  { url: '/ArtPhotos/20.jpg', title: 'Pouncing Tiger', category: 'Elite' },
  { url: '/ArtPhotos/21.jpg', title: 'Innocent Smile', category: 'Elite' },
  { url: '/ArtPhotos/22.jpg', title: 'Peony in Bloom', category: 'Elite' },
  { url: '/ArtPhotos/23.jpg', title: 'The Young Explorer', category: 'Elite' },
  { url: '/ArtPhotos/24.jpg', title: 'The Vengeful Spirit', category: 'Elite' },
  { url: '/ArtPhotos/25.jpg', title: 'The Invincible Hero', category: 'Elite' },
  { url: '/ArtPhotos/26.jpg', title: 'Noble Steed', category: 'Elite' },
];

export async function GET() {
  try {
    await initDb();
    await clearArtworks(); // Wipe database first
    
    for (const art of INITIAL_ARTWORKS) {
      await addArtwork(art as any);
    }

    revalidatePath('/');
    return NextResponse.json({ message: 'Database seeded successfully with ' + INITIAL_ARTWORKS.length + ' artworks!' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
