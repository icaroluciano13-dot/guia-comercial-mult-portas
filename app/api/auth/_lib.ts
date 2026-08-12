import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { employeeSessions, employeeUsers } from "../../../db/schema";

export const SESSION_COOKIE = "mp_employee_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
export const PASSWORD_HASH_ITERATIONS = 100_000;

export type EmployeeUser = {
  id: number;
  username: string;
  displayName: string;
  branch: string;
};

function encodeBytes(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function normalizeUsername(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

export function makeToken() {
  return encodeBytes(crypto.getRandomValues(new Uint8Array(32)));
}

export async function digest(value: string) {
  const result = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return encodeBytes(new Uint8Array(result));
}

export async function hashPassword(password: string, salt = makeToken()) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: PASSWORD_HASH_ITERATIONS, hash: "SHA-256" }, key, 256);
  const hash = encodeBytes(new Uint8Array(derived));
  return { salt, hash };
}

export async function verifyPassword(password: string, storedValue: string) {
  const [salt, expectedHash] = storedValue.split(".");
  if (!salt || !expectedHash) return false;
  const actualHash = (await hashPassword(password, salt)).hash;
  return actualHash === expectedHash;
}

export function getCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") ?? "";
  for (const piece of header.split(";")) {
    const [key, ...value] = piece.trim().split("=");
    if (key === name) return value.join("=");
  }
  return null;
}

export function sessionCookie(request: Request, token: string, maxAge = SESSION_MAX_AGE) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function clearedSessionCookie(request: Request) {
  return sessionCookie(request, "", 0);
}

export async function getSessionUser(request: Request): Promise<EmployeeUser | null> {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;

  const tokenHash = await digest(token);
  const db = await getDb();
  const [row] = await db
    .select({
      id: employeeUsers.id,
      username: employeeUsers.username,
      displayName: employeeUsers.displayName,
      branch: employeeUsers.branch,
      expiresAt: employeeSessions.expiresAt,
      sessionId: employeeSessions.id,
    })
    .from(employeeSessions)
    .innerJoin(employeeUsers, eq(employeeSessions.userId, employeeUsers.id))
    .where(and(eq(employeeSessions.tokenHash, tokenHash)))
    .limit(1);

  if (!row) return null;
  if (Date.parse(row.expiresAt) <= Date.now()) {
    await db.delete(employeeSessions).where(eq(employeeSessions.id, row.sessionId));
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    branch: row.branch,
  };
}

export async function createSession(request: Request, userId: number) {
  const token = makeToken();
  const db = await getDb();
  await db.insert(employeeSessions).values({
    userId,
    tokenHash: await digest(token),
    expiresAt: new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString(),
  }).run();
  return { token, cookie: sessionCookie(request, token) };
}

export async function deleteSession(request: Request) {
  const token = getCookie(request, SESSION_COOKIE);
  if (token) {
    const db = await getDb();
    await db.delete(employeeSessions).where(eq(employeeSessions.tokenHash, await digest(token)));
  }
}

export function userPayload(user: EmployeeUser) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    branch: user.branch,
  };
}
