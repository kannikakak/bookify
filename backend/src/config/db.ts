import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const parseBoolean = (value: string | undefined, fallback = false) => {
  if (value === undefined) {
    return fallback;
  }

  return value.trim().toLowerCase() === "true";
};

const getEnv = (keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key];

    if (value !== undefined && value.trim() !== "") {
      return value;
    }
  }

  return undefined;
};

const isHostedRuntime = () =>
  Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID || process.env.RENDER_EXTERNAL_URL);

export const getDbConfig = () => {
  const host = getEnv(["DB_HOST", "MYSQL_HOST", "DATABASE_HOST"]);
  const port = getEnv(["DB_PORT", "MYSQL_PORT", "DATABASE_PORT"]);
  const user = getEnv(["DB_USER", "MYSQL_USER", "DATABASE_USER"]);
  const password = getEnv(["DB_PASSWORD", "MYSQL_PASSWORD", "DATABASE_PASSWORD"]);
  const database = getEnv(["DB_NAME", "MYSQL_DATABASE", "DATABASE_NAME", "Database_name"]);

  if (isHostedRuntime()) {
    const missing = [
      ["DB_HOST", host],
      ["DB_PORT", port],
      ["DB_USER", user],
      ["DB_PASSWORD", password],
      ["DB_NAME", database]
    ]
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      throw new Error(`Missing required database environment variables: ${missing.join(", ")}`);
    }
  }

  return {
    host: host ?? "localhost",
    port: Number(port ?? 3306),
    user: user ?? "root",
    password: password ?? "",
    database: database ?? "bookify_db"
  };
};

export const buildSslConfig = () => {
  const ca = getEnv(["DB_SSL_CA", "MYSQL_SSL_CA", "DATABASE_SSL_CA", "CA_CERTIFICATE", "CA_certificate"])
    ?.replace(/\\n/g, "\n");
  const sslEnabled = parseBoolean(process.env.DB_SSL, Boolean(ca));

  if (!sslEnabled) {
    return undefined;
  }

  const rejectUnauthorized = parseBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, true);

  return {
    rejectUnauthorized,
    ...(ca ? { ca } : {})
  };
};

const dbConfig = getDbConfig();

export const pool = mysql.createPool({
  ...dbConfig,
  ssl: buildSslConfig(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
