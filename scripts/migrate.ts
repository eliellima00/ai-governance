import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.DIRECT_URL ||
    process.env.POSTGRES_URL;

  let client: Client;

  if (databaseUrl) {
    console.log('🔌 Conectando ao PostgreSQL via DATABASE_URL...');
    client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
  } else if (process.env.POSTGRES_PASSWORD) {
    const projectRef = 'pscshqpycpuklxxvvfdj';
    console.log(`🔌 Conectando ao PostgreSQL do Supabase (projeto ${projectRef})...`);
    client = new Client({
      host: `db.${projectRef}.supabase.co`,
      port: 5432,
      user: 'postgres',
      password: process.env.POSTGRES_PASSWORD,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    });
  } else {
    console.error(`
❌ Nenhuma credencial direta do PostgreSQL encontrada.

Para executar as migrações automáticas, o PostgreSQL precisa da string de conexão ou da senha do banco:

Opção 1: Defina a variável DATABASE_URL:
  DATABASE_URL="postgresql://postgres:[SUA_SENHA]@db.pscshqpycpuklxxvvfdj.supabase.co:5432/postgres"

Opção 2: Defina a variável POSTGRES_PASSWORD com a senha do banco Supabase:
  POSTGRES_PASSWORD="[SUA_SENHA]"

Onde encontrar no Supabase:
  Project Settings > Database > Connection string > URI
    `);
    process.exit(1);
  }

  try {
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso ao PostgreSQL do Supabase!');

    const sqlPath = path.join(process.cwd(), 'supabase-schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('🚀 Executando criação de tabelas, índices e políticas de segurança...');
    await client.query(sqlContent);

    console.log('🎉 Migração concluída com sucesso!');
    console.log('Tabelas criadas:');
    console.log('  - projects');
    console.log('  - project_criteria');
    console.log('  - project_actions');
    console.log('  - project_artifacts');
    console.log('  - project_meeting_logs');
    console.log('  - governance_settings');

    await client.end();
  } catch (err: any) {
    console.error('❌ Erro durante a execução da migração:', err.message);
    try {
      await client.end();
    } catch (_) {}
    process.exit(1);
  }
}

runMigration();
