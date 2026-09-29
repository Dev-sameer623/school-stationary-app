import fs from "node:fs";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const databaseDir = path.join(process.cwd(), ".pgdata");
const port = Number(process.env.PGPORT ?? 5432);

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "stationery",
  password: "stationery",
  port,
  persistent: true,
});

if (!fs.existsSync(path.join(databaseDir, "PG_VERSION"))) {
  console.log("Initialising local PostgreSQL data directory...");
  await pg.initialise();
}

await pg.start();

try {
  await pg.createDatabase("stationery");
  console.log("Created database stationery");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!/already exists/i.test(message)) {
    throw error;
  }
}

console.log(`PostgreSQL is ready on port ${port}`);
console.log(
  'DATABASE_URL="postgresql://stationery:stationery@localhost:' +
    port +
    '/stationery"',
);

await new Promise(() => {});
