const pg = require("pg");
const fs = require("fs");
const path = require("path");

// Load .env manually
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

async function runReindexReport() {
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
        console.log("==========================================");
        console.log("    DATABASE RE-INDEXING & CLEANUP AUDIT  ");
        console.log("==========================================");

        // 1. Inspect existing documents and chunks count
        const docsRes = await pool.query(`
            SELECT d.id as document_id, d.file_name, d.title, COUNT(dc.id) as total_chunks
            FROM documents d
            LEFT JOIN document_chunks dc ON d.id = dc.document_id
            GROUP BY d.id, d.file_name, d.title
            ORDER BY d.id DESC;
        `);

        console.log("\nExisting Documents in Database:");
        console.table(docsRes.rows);

        // 2. Identify duplicate file_names
        const dupRes = await pool.query(`
            SELECT file_name, COUNT(*) as total_uploads, ARRAY_AGG(id ORDER BY id DESC) as document_ids
            FROM documents
            GROUP BY file_name
            HAVING COUNT(*) > 1;
        `);

        if (dupRes.rows.length > 0) {
            console.log("\nDuplicate Document Uploads Found:");
            console.table(dupRes.rows);
        } else {
            console.log("\nNo duplicate file_name uploads found.");
        }

        console.log("\n✅ Database Audit Completed!");
        console.log("To re-index existing documents cleanly:");
        console.log("1. Send a POST request to /api/documents/upload with your PDF file to create new clean section chunks.");
        console.log("2. Or execute deletion of old chunk IDs from document_chunks table.");

    } catch (error) {
        console.error("❌ Re-indexing audit failed:", error);
    } finally {
        await pool.end();
    }
}

runReindexReport();
