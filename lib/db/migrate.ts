import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from './index';

async function runMigrations() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  console.log('Migrations complete.');
}

runMigrations().catch(console.error);
