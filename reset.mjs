import { sql } from '@vercel/postgres';

async function resetVisitorCount() {
  try {
    await sql`UPDATE stats SET value = 0 WHERE key = 'visitor_count'`;
    console.log('Successfully reset visitor count to 0.');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting visitor count:', error);
    process.exit(1);
  }
}

resetVisitorCount();
