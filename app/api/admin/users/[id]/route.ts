import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { employeeData, employeeUsers } from "../../../../../db/schema";
import { adminNotFound, getAdminSession } from "../../_lib";

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAdminSession(request))) return adminNotFound();

    const { id } = await context.params;
    const userId = Number.parseInt(id, 10);
    if (!Number.isInteger(userId) || userId <= 0) return adminNotFound();

    const db = getDb();
    const [row] = await db
      .select({
        id: employeeUsers.id,
        username: employeeUsers.username,
        displayName: employeeUsers.displayName,
        branch: employeeUsers.branch,
        createdAt: employeeUsers.createdAt,
        stateJson: employeeData.stateJson,
        dataUpdatedAt: employeeData.updatedAt,
      })
      .from(employeeUsers)
      .leftJoin(employeeData, eq(employeeData.userId, employeeUsers.id))
      .where(eq(employeeUsers.id, userId))
      .limit(1);

    if (!row) return adminNotFound();

    let state: unknown = null;
    if (row.stateJson) {
      try {
        const parsed = JSON.parse(row.stateJson) as unknown;
        state = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
      } catch {
        state = null;
      }
    }

    return jsonResponse({
      user: {
        id: row.id,
        username: row.username,
        displayName: row.displayName,
        branch: row.branch,
        createdAt: row.createdAt,
        dataUpdatedAt: row.dataUpdatedAt,
      },
      state,
    });
  } catch (error) {
    console.error("admin_user_data_failed", { message: error instanceof Error ? error.message : String(error) });
    return jsonResponse({ error: "Não foi possível abrir os dados da conta." }, 503);
  }
}
