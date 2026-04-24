import { sql } from '@vercel/postgres';

export interface Artwork {
  id?: number;
  title: string;
  url: string;
  category: 'Featured' | 'Initial' | 'Pro' | 'Elite';
  created_at?: Date;
}

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS artworks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      category TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
}

export async function getArtworks() {
  try {
    await initDb(); // Ensure table exists
    const { rows } = await sql<Artwork>`SELECT * FROM artworks ORDER BY created_at DESC`;
    return rows;
  } catch (error) {
    console.error('Database fetch error:', error);
    return []; // Return empty array if table is just being created
  }
}

export async function addArtwork(artwork: Omit<Artwork, 'id' | 'created_at'>) {
  await sql`
    INSERT INTO artworks (title, url, category)
    VALUES (${artwork.title}, ${artwork.url}, ${artwork.category})
  `;
}

export async function deleteArtwork(id: number) {
  await sql`DELETE FROM artworks WHERE id = ${id}`;
}
