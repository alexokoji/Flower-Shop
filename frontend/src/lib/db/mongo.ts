import { MongoClient, Db, Collection, Document } from "mongodb";

/**
 * MongoDB connection.
 *
 * SERVER ONLY. `MONGODB_URI` holds database credentials, so it must never be
 * prefixed NEXT_PUBLIC_ and this module must never be imported from a client
 * component — the driver is a TCP client that cannot run in a browser anyway.
 *
 * Next.js hot-reloads modules in development, which would open a new pool on
 * every edit and exhaust Atlas connection limits, so the client is cached on
 * `globalThis` there. In production the module is evaluated once per instance.
 */

const URI = process.env.MONGODB_URI ?? "";
const DB_NAME = process.env.MONGODB_DB ?? "xperience";

if (!URI && process.env.NODE_ENV !== "test") {
  // Fail loudly at import time rather than on the first query in a request.
  console.error(
    "[db] MONGODB_URI is not set. Copy .env.example to .env.local and fill in the connection string."
  );
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function createClient(): Promise<MongoClient> {
  if (!URI) throw new Error("MONGODB_URI is not configured.");
  const client = new MongoClient(URI, {
    // Keep the pool small: serverless instances are many and short-lived.
    maxPoolSize: 10,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 10_000,
    retryWrites: true,
  });
  return client.connect();
}

export function clientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) global._mongoClientPromise = createClient();
    return global._mongoClientPromise;
  }
  if (!global._mongoClientPromise) global._mongoClientPromise = createClient();
  return global._mongoClientPromise;
}

export async function db(): Promise<Db> {
  const client = await clientPromise();
  return client.db(DB_NAME);
}

/** Typed handle to a collection. */
export async function coll<T extends Document>(name: string): Promise<Collection<T>> {
  const database = await db();
  return database.collection<T>(name);
}

/** True when the database is reachable — used by /api/health. */
export async function ping(): Promise<boolean> {
  try {
    const database = await db();
    await database.command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}
