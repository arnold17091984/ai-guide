import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// ============================================================
// Database client (lazy initialization)
// ============================================================
// Uses a getter to avoid connecting at build/import time.
// The connection is created on first access, then cached.

declare global {
  // eslint-disable-next-line no-var
  var _pgClient: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var _drizzle: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

function createPgClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
      "Add it to .env.local for local development.",
    );
  }

  return postgres(connectionString, {
    max: process.env.NODE_ENV === "production" ? 10 : 3,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

function getDb() {
  if (globalThis._drizzle) return globalThis._drizzle;

  const pgClient =
    process.env.NODE_ENV === "development"
      ? (globalThis._pgClient ??= createPgClient())
      : createPgClient();

  const instance = drizzle(pgClient, { schema });

  if (process.env.NODE_ENV === "development") {
    globalThis._drizzle = instance;
  }

  return instance;
}

// Proxy that lazily initializes on first property access
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    const real = getDb();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export type Database = ReturnType<typeof drizzle<typeof schema>>;
