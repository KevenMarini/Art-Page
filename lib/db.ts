import { sql } from '@vercel/postgres';

export interface Category {
  id: number;
  name: string;
  position: number;
}

export interface Artwork {
  id?: number;
  title: string;
  url: string;
  category: string;
  position?: number;
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
  // Categories table
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      position INTEGER DEFAULT 0
    );
  `;

  // Seed default categories if empty
  const { rows: existingCats } = await sql`SELECT COUNT(*) FROM categories`;
  if (existingCats[0].count === '0') {
    await sql`
      INSERT INTO categories (name, position) 
      VALUES ('Featured', 1), ('Initial', 2), ('Pro', 3), ('Elite', 4)
      ON CONFLICT (name) DO NOTHING;
    `;
  }

  // Artworks table
  await sql`
    CREATE TABLE IF NOT EXISTS artworks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      category TEXT NOT NULL,
      position INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Add position to artworks if it doesn't exist (for migration)
  await sql`
    ALTER TABLE artworks ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
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

// Categories Functions
export async function getCategories() {
  try {
    await initDb();
    const { rows } = await sql<Category>`
      SELECT * FROM categories ORDER BY position ASC, id ASC
    `;
    return rows;
  } catch (error) {
    console.error('Database fetch error (categories):', error);
    return [];
  }
}

export async function addCategory(name: string) {
  const { rows } = await sql`SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM categories`;
  const nextPos = rows[0].next_pos;
  await sql`
    INSERT INTO categories (name, position)
    VALUES (${name}, ${nextPos})
  `;
}

export async function deleteCategory(id: number) {
  // Also delete artworks inside this category? Or move them? The user didn't specify.
  // We'll just delete the category and let artworks keep the text name (since we didn't add a foreign key)
  await sql`DELETE FROM categories WHERE id = ${id}`;
}

export async function updateCategoryName(id: number, oldName: string, newName: string) {
  await sql`UPDATE categories SET name = ${newName} WHERE id = ${id}`;
  await sql`UPDATE artworks SET category = ${newName} WHERE category = ${oldName}`;
}

export async function updateCategoryPositions(items: { id: number; position: number }[]) {
  // Simple approach: run multiple updates
  for (const item of items) {
    await sql`UPDATE categories SET position = ${item.position} WHERE id = ${item.id}`;
  }
}

// Artwork Functions
export async function getArtworks() {
  try {
    await initDb(); // Ensure tables exist
    const { rows } = await sql<Artwork>`
      SELECT a.*, COUNT(l.id)::int as likes_count
      FROM artworks a
      LEFT JOIN likes l ON a.id = l.artwork_id
      GROUP BY a.id
      ORDER BY a.position ASC, a.created_at DESC
    `;
    return rows;
  } catch (error) {
    console.error('Database fetch error:', error);
    return [];
  }
}

export async function updateArtworkPositions(items: { id: number; position: number }[]) {
  for (const item of items) {
    await sql`UPDATE artworks SET position = ${item.position} WHERE id = ${item.id}`;
  }
}

export async function addArtwork(artwork: Omit<Artwork, 'id' | 'created_at' | 'likes_count'>) {
  const { rows } = await sql`SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM artworks WHERE category = ${artwork.category}`;
  const nextPos = rows[0].next_pos;

  await sql`
    INSERT INTO artworks (title, url, category, position)
    VALUES (${artwork.title}, ${artwork.url}, ${artwork.category}, ${nextPos})
  `;
}

export async function deleteArtwork(id: number) {
  await sql`DELETE FROM artworks WHERE id = ${id}`;
}

export async function clearArtworks() {
  await sql`DELETE FROM artworks`;
}

export async function addLike(artworkId: number, ip: string) {
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

export async function deleteComment(id: number) {
  await sql`DELETE FROM comments WHERE id = ${id}`;
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
