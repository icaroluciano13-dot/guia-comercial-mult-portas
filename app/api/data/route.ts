import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { employeeData } from "../../../db/schema";
import { getSessionUser } from "../auth/_lib";

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function emptyResponse() {
  return jsonResponse({ state: null });
}

export async function GET(request: Request) {
  try {
    return await readData(request);
  } catch {
    return jsonResponse({ error: "Não foi possível carregar os dados deste funcionário." }, 503);
  }
}

async function readData(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return jsonResponse({ error: "Sessão expirada." }, 401);

  const db = await getDb();
  const [record] = await db.select({ stateJson: employeeData.stateJson }).from(employeeData).where(eq(employeeData.userId, user.id)).limit(1);
  if (!record) return emptyResponse();

  try {
    const state = JSON.parse(record.stateJson) as unknown;
    return Response.json({ state: state && typeof state === "object" ? state : null }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return emptyResponse();
  }
}

export async function PUT(request: Request) {
  try {
    return await writeData(request);
  } catch {
    return jsonResponse({ error: "Não foi possível salvar os dados deste funcionário." }, 503);
  }
}

async function writeData(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return jsonResponse({ error: "Sessão expirada." }, 401);

  let body: { state?: unknown };
  try {
    const parsed = await request.json() as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return jsonResponse({ error: "Dados inválidos." }, 400);
    }
    body = parsed as typeof body;
  } catch {
    return jsonResponse({ error: "Dados inválidos." }, 400);
  }

  if (!body.state || typeof body.state !== "object" || Array.isArray(body.state)) {
    return jsonResponse({ error: "Os dados do funcionário precisam estar em um objeto." }, 400);
  }

  const stateJson = JSON.stringify(body.state);
  if (stateJson.length > 400_000) return jsonResponse({ error: "Os dados salvos ultrapassaram o limite." }, 413);

  const db = await getDb();
  await db.insert(employeeData).values({
    userId: user.id,
    stateJson,
    updatedAt: new Date().toISOString(),
  }).onConflictDoUpdate({
    target: employeeData.userId,
    set: { stateJson, updatedAt: new Date().toISOString() },
  }).run();

  return jsonResponse({ ok: true });
}
