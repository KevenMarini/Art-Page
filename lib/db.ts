import { sql } from '@vercel/postgres';

export interface Artwork {
  id?: number;
  title: string;
  url: string;
  category: 'Featured' | 'Initial' | 'Pro' | 'Elite';
  created_at?: Date;
  likes_count?: number;
}

export interface Comment {
  id: number;
  artwork_id: number;
  name: string;
  text: string;
  created_at: Date;
}

export async function initDb() {
  // Artworks table
  await sql`
    CREATE TABLE IF NOT EXISTS artworks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      category TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Likes table
  await sql`
    CREATE TABLE IF NOT EXISTS likes (
      id SERIAL PRIMARY KEY,
      artwork_id INTEGER REFERENCES artworks(id) ON DELETE CASCADE,
      ip TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Comments table
  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      artwork_id INTEGER REFERENCES artworks(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Stats table for visitor count
  await sql`
    CREATE TABLE IF NOT EXISTS stats (
      key TEXT PRIMARY KEY,
      value INTEGER DEFAULT 0
    );
  `;

  // Initialize visitor count if not exists
  await sql`
    INSERT INTO stats (key, value)
    VALUES ('visitor_count', 0)
    ON CONFLICT (key) DO NOTHING;
  `;
}

export async function getArtworks() {
  try {
    await initDb(); // Ensure tables exist
    const { rows } = await sql<Artwork>`
      SELECT a.*, COUNT(l.id)::int as likes_count
      FROM artworks a
      LEFT JOIN likes l ON a.id = l.artwork_id
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `;
    return rows;
  } catch (error) {
    console.error('Database fetch error:', error);
    return [];
  }
}

export async function addLike(artworkId: number, ip: string) {
  // Check if IP already liked this artwork to prevent spam (optional)
  const { rows } = await sql`SELECT id FROM likes WHERE artwork_id = ${artworkId} AND ip = ${ip}`;
  if (rows.length === 0) {
    await sql`INSERT INTO likes (artwork_id, ip) VALUES (${artworkId}, ${ip})`;
    return true;
  }
  return false;
}

export async function getUserLikes(ip: string) {
  const { rows } = await sql`SELECT artwork_id FROM likes WHERE ip = ${ip}`;
  return rows.map(row => row.artwork_id as number);
}

export async function addComment(artworkId: number, name: string, text: string) {
  await sql`
    INSERT INTO comments (artwork_id, name, text)
    VALUES (${artworkId}, ${name}, ${text})
  `;
}

export async function getComments(artworkId: number) {
  const { rows } = await sql<Comment>`
    SELECT * FROM comments 
    WHERE artwork_id = ${artworkId} 
    ORDER BY created_at DESC
  `;
  return rows;
}

export async function addArtwork(artwork: Omit<Artwork, 'id' | 'created_at' | 'likes_count'>) {
  await sql`
    INSERT INTO artworks (title, url, category)
    VALUES (${artwork.title}, ${artwork.url}, ${artwork.category})
  `;
}

export async function deleteArtwork(id: number) {
  await sql`DELETE FROM artworks WHERE id = ${id}`;
}

export async function clearArtworks() {
  await sql`DELETE FROM artworks`;
}

export async function incrementVisitorCount() {
  await sql`
    UPDATE stats SET value = value + 1 WHERE key = 'visitor_count'
  `;
}

export async function getVisitorCount() {
  const { rows } = await sql`SELECT value FROM stats WHERE key = 'visitor_count'`;
  return rows[0]?.value || 0;
}

export async function deleteComment(id: number) {
  await sql`DELETE FROM comments WHERE id = ${id}`;
}
