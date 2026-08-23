import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function runMigration() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('❌ Erro: DATABASE_URL não configurada no .env ou .env.local');
    process.exit(1);
  }

  console.log('⏳ Executando migrations no Neon PostgreSQL...');
  const sql = neon(url);
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  console.log('✅ Migrations aplicadas com sucesso no banco de dados Neon!');
}

runMigration().catch((err) => {
  console.error('❌ Falha ao aplicar migrations:', err);
  process.exit(1);
});
