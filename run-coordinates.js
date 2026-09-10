import { readFileSync } from "node:fs";
import pg from "pg";

const dbUrl = "postgresql://postgres.kxcrfzxzrizdzsjsuqyi:HolaJP29062018.@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

const sql = readFileSync(new URL("./supabase/add-coordinates.sql", import.meta.url), "utf8");

const client = new pg.Client({ connectionString: dbUrl });
await client.connect();
console.log("Conectado a la base de datos");
await client.query(sql);
console.log("Migración ejecutada correctamente");
await client.end();
