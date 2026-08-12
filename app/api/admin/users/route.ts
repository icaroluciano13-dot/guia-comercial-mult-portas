import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { employeeData, employeeUsers } from "../../../../db/schema";
import { adminNotFound, getAdminSession } from "../_lib";

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  try {
    if (!(await getAdminSession(request))) return adminNotFound();

    const db = getDb();
    const users = await db
      .select({
        id: employeeUsers.id,
        username: employeeUsers.username,
        displayName: employeeUsers.displayName,
        branch: employeeUsers.branch,
        createdAt: employeeUsers.createdAt,
        dataUpdatedAt: employeeData.updatedAt,
      })
      .from(employeeUsers)
      .leftJoin(employeeData, eq(employeeData.userId, employeeUsers.id))
      .orderBy(desc(employeeUsers.id));

    return jsonResponse({ users });
  } catch (error) {
    console.error("admin_users_failed", { message: error instanceof Error ? error.message : String(error) });
    return jsonResponse({ error: "Não foi possível carregar as contas." }, 503);
  }
}
