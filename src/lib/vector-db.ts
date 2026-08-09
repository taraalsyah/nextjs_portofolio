import pg from "pg";

const globalForVectorDB = globalThis as unknown as {
    vectorPool: pg.Pool | undefined;
};

export const vectorPool =
    globalForVectorDB.vectorPool ??
    new pg.Pool({
        connectionString: process.env.VECTOR_DATABASE_URL,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    });

if (process.env.NODE_ENV !== "production") {
    globalForVectorDB.vectorPool = vectorPool;
}