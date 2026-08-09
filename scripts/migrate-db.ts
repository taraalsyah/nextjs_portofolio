import pg from "pg";
import fs from "fs";
import path from "path";

// Load .env manually if needed
try {
    const envPath = path.join(__dirname, "../.env");
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, "utf8");
        for (const line of envConfig.split("\n")) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
                const [key, ...valueParts] = trimmed.split("=");
                process.env[key.trim()] = valueParts.join("=").trim().replace(/^["']|["']$/g, '');
            }
        }
    }
} catch (e) {
    // Ignore error
}

async function runMigration() {
    const connectionString = process.env.VECTOR_DATABASE_URL;

    if (!connectionString) {
        console.error("VECTOR_DATABASE_URL is not defined in environment.");
        process.exit(1);
    }

    const isSslRequired =
        process.env.NODE_ENV === "production" ||
        connectionString.includes("sslmode=require") ||
        connectionString.includes("neon.tech");

    const pool = new pg.Pool({
        connectionString,
        ssl: isSslRequired ? { rejectUnauthorized: false } : undefined,
        max: 1,
    });

    try {
        console.log("🚀 Running SQL Migration: Initializing PostgreSQL Vector Schema...");

        const schemaSqlPath = path.join(__dirname, "../prisma/migrations/vector_schema_setup.sql");
        const sqlContent = fs.readFileSync(schemaSqlPath, "utf8");

        await pool.query(sqlContent);

        console.log("✅ PostgreSQL/pgvector Schema Migration completed successfully!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
