import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const envPath = path.join(rootDir, ".env");
const schemaPath = path.join(rootDir, "prisma", "schema.prisma");

let databaseUrl = process.env.DATABASE_URL || "";

if (!databaseUrl && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  const match = envContent.match(/^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m);
  if (match && match[1]) {
    databaseUrl = match[1].trim();
  }
}

const isPostgres =
  databaseUrl.startsWith("postgresql://") ||
  databaseUrl.startsWith("postgres://");
const targetProvider = isPostgres ? "postgresql" : "sqlite";

if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, "utf8");
  const updated = schema.replace(
    /provider\s*=\s*"(sqlite|postgresql)"/,
    `provider = "${targetProvider}"`
  );
  if (updated !== schema) {
    fs.writeFileSync(schemaPath, updated, "utf8");
    console.log(`[sync-prisma-provider] Provider disetel ke "${targetProvider}"`);
  }
}
