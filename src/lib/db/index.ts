import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

type PostgresClient = ReturnType<typeof postgres>;

const globalForDb = globalThis as typeof globalThis & {
  __chalkdustPostgresClient?: PostgresClient;
};

const maxConnections =
  Number(process.env.POSTGRES_MAX_CONNECTIONS) ||
  (process.env.NODE_ENV === "production" ? 10 : 1);

const client =
  globalForDb.__chalkdustPostgresClient ??
  postgres(connectionString, {
    max: maxConnections,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__chalkdustPostgresClient = client;
}

export const db = drizzle(client, { schema });
