import pg from "pg";

const globalForVectorDB = globalThis as unknown as {
    vectorPool: pg.Pool | undefined;
};

// Neon PostgreSQL strictly requires SSL. `node-postgres` (pg) does not automatically infer SSL from query parameters in connection strings.
const isSslRequired =
    process.env.NODE_ENV === "production" ||
    process.env.VECTOR_DATABASE_URL?.includes("sslmode=require") ||
    process.env.VECTOR_DATABASE_URL?.includes("neon.tech");

export const vectorPool =
    globalForVectorDB.vectorPool ??
    new pg.Pool({
        connectionString: process.env.VECTOR_DATABASE_URL,
        ssl: isSslRequired ? { rejectUnauthorized: false } : undefined,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    });

if (process.env.NODE_ENV !== "production") {
    globalForVectorDB.vectorPool = vectorPool;
}