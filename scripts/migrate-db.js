const pg = require("pg");
const fs = require("fs");
const path = require("path");

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

    const pool = new pg.Pool({
        connectionString,
        max: 1,
    });

    try {
        console.log("Running SQL Migration: Adding & Backfilling section column in document_chunks...");

        await pool.query(`
            ALTER TABLE document_chunks
            ADD COLUMN IF NOT EXISTS section TEXT;
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_document_chunks_section
            ON document_chunks(section);
        `);

        const updateResult = await pool.query(`
            UPDATE document_chunks
            SET section = (regexp_match(content, '\\[SECTION:\\s*([^\\]]+)\\]', 'i'))[1]
            WHERE (section IS NULL OR TRIM(section) = '')
              AND content ~* '\\[SECTION:';
        `);

        console.log(`✅ SQL Migration completed successfully! Updated ${updateResult.rowCount} rows.`);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
