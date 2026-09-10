import { readFileSync } from "node:fs";
import pg from "pg";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("Falta DATABASE_URL en .env.local");
  console.error("Crea una cadena estilo: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres");
  process.exit(1);
}

const sql = readFileSync(new URL("./supabase/activity-participants.sql", import.meta.url), "utf8");

const client = new pg.Client({ connectionString: dbUrl });
await client.connect();
console.log("Conectado a la base de datos");
await client.query(sql);
console.log("Migración ejecutada correctamente");
await client.end();
