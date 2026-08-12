import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { employeeData, employeeUsers } from "../../../../db/schema";
import { adminNotFound, getAdminSession } from "../_lib";
import { hashPassword, userPayload } from "../../auth/_lib";
import { parseEmployeeProfile } from "./_validation";

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

export async function POST(request: Request) {
  try {
    if (!(await getAdminSession(request))) return adminNotFound();

    let body: unknown;
    try {
      body = await request.json() as unknown;
    } catch {
      return jsonResponse({ error: "Não foi possível ler os dados do funcionário." }, 400);
    }

    const parsed = parseEmployeeProfile(body, { passwordRequired: true });
    if (!parsed.value) return jsonResponse({ error: parsed.error }, 400);

    const db = getDb();
    const [existing] = await db
      .select({ id: employeeUsers.id })
      .from(employeeUsers)
      .where(eq(employeeUsers.usernameNormalized, parsed.value.usernameNormalized))
      .limit(1);
    if (existing) return jsonResponse({ error: "Esse usuário já está cadastrado." }, 409);

    const passwordData = await hashPassword(parsed.value.password);
    const [user] = await db.insert(employeeUsers).values({
      username: parsed.value.username,
      usernameNormalized: parsed.value.usernameNormalized,
      displayName: parsed.value.displayName,
      branch: parsed.value.branch,
      passwordHash: `${passwordData.salt}.${passwordData.hash}`,
    }).returning();

    if (!user) return jsonResponse({ error: "Não foi possível criar o funcionário." }, 500);
    return jsonResponse({ user: userPayload(user) }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/unique|constraint/i.test(message)) return jsonResponse({ error: "Esse usuário já está cadastrado." }, 409);
    console.error("admin_user_create_failed", { message });
    return jsonResponse({ error: "Não foi possível criar o funcionário." }, 503);
  }
}
