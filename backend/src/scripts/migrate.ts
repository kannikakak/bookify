import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, "../db/migrations");

const run = async () => {
  const database = process.env.DB_NAME ?? "bookify_db";

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    multipleStatements: true
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    await connection.query(`USE \`${database}\``);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        run_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const migrationFiles = (await fs.readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort((left, right) => left.localeCompare(right));

    for (const file of migrationFiles) {
      const [rows] = await connection.query<mysql.RowDataPacket[]>(
        "SELECT name FROM migrations WHERE name = ? LIMIT 1",
        [file]
      );

      if (rows.length > 0) {
        console.log(`Skipping ${file}`);
        continue;
      }

      const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
      await connection.query(sql);
      await connection.query("INSERT INTO migrations (name) VALUES (?)", [file]);
      console.log(`Applied ${file}`);
    }

    console.log("Migrations finished.");
  } finally {
    await connection.end();
  }
};

run().catch((error) => {
  console.error("Migration failed.");
  console.error(error);
  process.exit(1);
});

