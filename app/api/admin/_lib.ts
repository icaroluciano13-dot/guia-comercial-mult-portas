import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { adminSessions } from "../../../db/schema";
import { digest, getCookie, makeToken } from "../auth/_lib";

export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "admin";
export const ADMIN_COOKIE = "mp_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

// The administrative account is restricted to the owner identity forwarded by Sites.
const OWNER_EMAIL = "eletrovale.cont@gmail.com";

export function isOwnerRequest(request: Request) {
  return (request.headers.get("oai-authenticated-user-email") ?? "").trim().toLocaleLowerCase("pt-BR") === OWNER_EMAIL;
}

export function adminSessionCookie(request: Request, token: string, maxAge = ADMIN_SESSION_MAX_AGE) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function clearedAdminCookie(request: Request) {
  return adminSessionCookie(request, "", 0);
}

export async function createAdminSession(request: Request) {
  const token = makeToken();
  const db = getDb();
  await db.insert(adminSessions).values({
    tokenHash: await digest(token),
    expiresAt: new Date(Date.now() + ADMIN_SESSION_MAX_AGE * 1000).toISOString(),
  }).run();
  return { token, cookie: adminSessionCookie(request, token) };
}

export async function getAdminSession(request: Request) {
  if (!isOwnerRequest(request)) return false;
  const token = getCookie(request, ADMIN_COOKIE);
  if (!token) return false;

  const db = getDb();
  const tokenHash = await digest(token);
  const [row] = await db
    .select({ id: adminSessions.id, expiresAt: adminSessions.expiresAt })
    .from(adminSessions)
    .where(eq(adminSessions.tokenHash, tokenHash))
    .limit(1);

  if (!row) return false;
  if (Date.parse(row.expiresAt) <= Date.now()) {
    await db.delete(adminSessions).where(eq(adminSessions.id, row.id));
    return false;
  }

  return true;
}

export async function deleteAdminSession(request: Request) {
  const token = getCookie(request, ADMIN_COOKIE);
  if (!token) return;
  const db = getDb();
  await db.delete(adminSessions).where(eq(adminSessions.tokenHash, await digest(token)));
}

export function adminNotFound() {
  return Response.json({ error: "Não encontrado." }, { status: 404, headers: { "Cache-Control": "no-store" } });
}
