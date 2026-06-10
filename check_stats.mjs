import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  try {
    const { rows } = await sql`SELECT * FROM stats`;
    console.log('STATS:', rows);
  } catch (e) {
    console.error(e);
  }
}
main();
