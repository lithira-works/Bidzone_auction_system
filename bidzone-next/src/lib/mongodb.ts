import mongoose from "mongoose";
import { assertMongoEnv, getMongoUri } from "@/lib/env";

/**
 * Cached connection to avoid opening multiple connections during
 * Next.js hot-reloads in development.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cached;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  assertMongoEnv();

  if (!cached.promise) {
    const uri = getMongoUri()!;
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        /* Generous timeouts — Atlas over slow/high-latency links can take >8s on cold start */
        serverSelectionTimeoutMS: 20_000,
        connectTimeoutMS: 20_000,
        socketTimeoutMS: 45_000,
        /* Skip IPv6 DNS attempts — avoids multi-second resolution stalls on Windows */
        family: 4,
        maxPoolSize: 10,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    /* Critical: clear the failed promise so the NEXT request retries a fresh
       connection instead of re-awaiting the same rejected promise forever. */
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export function isDbConnectionError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === 'MongooseServerSelectionError' || err.name === 'MongoServerSelectionError')
  )
}

export default connectToDatabase;
