import { defineConfig } from "drizzle-kit";
import path from "path";

const rawUrl = process.env.DATABASE_URL?.trim();
if (!rawUrl) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

/** Avoid accidental newlines / double pastes breaking the host check. */
const databaseUrl = rawUrl.split(/\s+/)[0];

function parsePostgresUrl(urlString: string): {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
} {
  const u = new URL(urlString);
  const database = u.pathname.replace(/^\//, "") || "";
  if (!u.hostname) throw new Error("Invalid DATABASE_URL: missing host");
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 5432,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database,
  };
}

/**
 * Render (and similar) require TLS. drizzle-kit only applies `ssl` when you do *not*
 * use `url` — if `url` is set it builds `new Pool({ connectionString })` and drops ssl.
 */
function needsSsl(): boolean {
  if (/sslmode=disable/i.test(databaseUrl)) return false;
  return (
    /\.render\.com\b/i.test(databaseUrl) ||
    /sslmode=require|sslmode=verify-full/i.test(databaseUrl)
  );
}

const ssl = needsSsl();
const parsed = parsePostgresUrl(databaseUrl);

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: ssl
    ? {
        host: parsed.host,
        port: parsed.port,
        user: parsed.user,
        password: parsed.password,
        database: parsed.database,
        // drizzle-kit maps "require" to `{ rejectUnauthorized: false }` → TLS on
        ssl: "require",
      }
    : { url: databaseUrl },
});
