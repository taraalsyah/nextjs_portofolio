import { vectorPool } from "@/lib/vector-db";

export async function GET() {
    try {
        const result = await vectorPool.query("SELECT NOW()");

        return Response.json({
            success: true,
            database: "PostgreSQL",
            time: result.rows[0].now,
        });
    } catch (error) {
        console.error("Vector DB error:", error);

        return Response.json(
            {
                success: false,
                error: "PostgreSQL connection failed",
            },
            { status: 500 }
        );
    }
}