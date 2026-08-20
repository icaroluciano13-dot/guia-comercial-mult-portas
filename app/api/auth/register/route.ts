import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { employeeUsers } from "../../../../db/schema";
import {
  createSession,
  hashPassword,
  normalizeUsername,
  userPayload,
} from "../_lib";
import { rejectUntrustedMutation } from "../../_security";
import { clearedAdminCookie } from "../../admin/_lib";

const allowedBranches = new Set(["Araraquara", "São Carlos"]);

export async function POST(request: Request) {
  try {
    return await handleRegister(request);
  } catch (error) {
    console.error("auth_register_failed", { message: error instanceof Error ? error.message : String(error) });
    return Response.json({ error: "O cadastro não conseguiu acessar o armazenamento. Tente novamente em alguns segundos." }, { status: 503 });
  }
}

async function handleRegister(request: Request) {
  const originError = rejectUntrustedMutation(request);
  if (originError) return originError;

  let body: { displayName?: string; username?: string; branch?: string; password?: string };
  try {
    const parsed = await request.json() as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return Response.json({ error: "Não foi possível ler o cadastro." }, { status: 400 });
    }
    body = parsed as typeof body;
  } catch {
    return Response.json({ error: "Não foi possível ler o cadastro." }, { status: 400 });
  }

  const displayName = body.displayName?.trim() ?? "";
  const username = body.username?.trim() ?? "";
  const usernameNormalized = normalizeUsername(username);
  const branch = body.branch?.trim() ?? "";
  const password = body.password ?? "";

  if (displayName.length < 2 || displayName.length > 80) {
    return Response.json({ error: "Informe o nome completo do funcionário." }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) {
    return Response.json({ error: "O usuário deve ter de 3 a 40 caracteres, sem espaços." }, { status: 400 });
  }
  if (usernameNormalized === "admin") {
    return Response.json({ error: "Esse usuário já está cadastrado." }, { status: 409 });
  }
  if (!allowedBranches.has(branch)) {
    return Response.json({ error: "Selecione Araraquara ou São Carlos." }, { status: 400 });
  }
  if (password.length < 8 || password.length > 120) {
    return Response.json({ error: "A senha deve ter pelo menos 8 caracteres." }, { status: 400 });
  }

  const db = await getDb();
  const [existing] = await db.select({ id: employeeUsers.id }).from(employeeUsers).where(eq(employeeUsers.usernameNormalized, usernameNormalized)).limit(1);
  if (existing) return Response.json({ error: "Esse usuário já está cadastrado." }, { status: 409 });

  const passwordData = await hashPassword(password);
  try {
    const [user] = await db.insert(employeeUsers).values({
      username,
      usernameNormalized,
      displayName,
      branch,
      passwordHash: passwordData.encoded,
    }).returning({ id: employeeUsers.id, username: employeeUsers.username, displayName: employeeUsers.displayName, branch: employeeUsers.branch });

    if (!user) return Response.json({ error: "Não foi possível concluir o cadastro." }, { status: 500 });
    try {
      const session = await createSession(request, user.id);
      const headers = new Headers({ "Cache-Control": "no-store" });
      headers.append("Set-Cookie", session.cookie);
      headers.append("Set-Cookie", clearedAdminCookie(request));
      return Response.json({ user: userPayload(user) }, { status: 201, headers });
    } catch (error) {
      // Do not leave an account behind when session creation fails halfway through.
      await db.delete(employeeUsers).where(eq(employeeUsers.id, user.id));
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/unique|constraint/i.test(message)) {
      return Response.json({ error: "Esse usuário já está cadastrado." }, { status: 409 });
    }
    throw error;
  }
}
