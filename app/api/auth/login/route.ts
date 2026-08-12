import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { employeeUsers } from "../../../../db/schema";
import { ADMIN_PASSWORD, ADMIN_USERNAME, createAdminSession, isAdminRequest } from "../../admin/_lib";
import {
  createSession,
  normalizeUsername,
  userPayload,
  verifyPassword,
} from "../_lib";

export async function POST(request: Request) {
  try {
    return await handleLogin(request);
  } catch (error) {
    console.error("auth_login_failed", { message: error instanceof Error ? error.message : String(error) });
    return Response.json({ error: "O login não conseguiu acessar o armazenamento. Tente novamente em alguns segundos." }, { status: 503 });
  }
}

async function handleLogin(request: Request) {
  let body: { username?: string; password?: string };
  try {
    const parsed = await request.json() as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return Response.json({ error: "Não foi possível ler o login." }, { status: 400 });
    }
    body = parsed as typeof body;
  } catch {
    return Response.json({ error: "Não foi possível ler o login." }, { status: 400 });
  }

  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";
  if (!username || !password) return Response.json({ error: "Informe usuário e senha." }, { status: 400 });

  if (username.toLocaleLowerCase("pt-BR") === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    if (!isAdminRequest(request)) return Response.json({ error: "Usuário ou senha incorretos." }, { status: 401 });
    const session = await createAdminSession(request);
    return Response.json({ admin: true }, { headers: { "Set-Cookie": session.cookie, "Cache-Control": "no-store" } });
  }

  const db = await getDb();
  const [user] = await db.select().from(employeeUsers).where(eq(employeeUsers.usernameNormalized, normalizeUsername(username))).limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return Response.json({ error: "Usuário ou senha incorretos." }, { status: 401 });
  }

  const session = await createSession(request, user.id);
  return Response.json({ user: userPayload(user) }, { headers: { "Set-Cookie": session.cookie, "Cache-Control": "no-store" } });
}
