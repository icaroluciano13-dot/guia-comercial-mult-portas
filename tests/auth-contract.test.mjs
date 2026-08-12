import assert from "node:assert/strict";
import test from "node:test";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("auth-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
}

function executionContext() {
  return {
    waitUntil() {},
    passThroughOnException() {},
  };
}

async function requestJson(worker, path, init = {}) {
  const response = await worker.fetch(
    new Request(`http://localhost${path}`, init),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    executionContext(),
  );
  const raw = await response.text();
  assert.ok(raw.trim(), `${path} returned an empty response`);
  return { response, body: JSON.parse(raw) };
}

test("auth and employee-data errors always return JSON", async () => {
  const worker = await loadWorker();
  const jsonHeaders = { "Content-Type": "application/json" };

  const invalidRegister = await requestJson(worker, "/api/auth/register", {
    method: "POST",
    headers: jsonHeaders,
    body: "null",
  });
  assert.equal(invalidRegister.response.status, 400);
  assert.equal(invalidRegister.body.error, "Não foi possível ler o cadastro.");

  const invalidLogin = await requestJson(worker, "/api/auth/login", {
    method: "POST",
    headers: jsonHeaders,
    body: "[]",
  });
  assert.equal(invalidLogin.response.status, 400);
  assert.equal(invalidLogin.body.error, "Não foi possível ler o login.");

  const unauthenticatedData = await requestJson(worker, "/api/data");
  assert.equal(unauthenticatedData.response.status, 401);
  assert.equal(unauthenticatedData.body.error, "Sessão expirada.");

  const logout = await requestJson(worker, "/api/auth/logout", { method: "POST" });
  assert.equal(logout.response.status, 200);
  assert.equal(logout.body.ok, true);
  assert.match(logout.response.headers.get("set-cookie") ?? "", /mp_employee_session=;/);
});

test("GitHub Pages API preflight returns credentialed CORS headers", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(
    new Request("https://guia-comercial-mult-portas.eletrovale-cont.chatgpt.site/api/auth/login", {
      method: "OPTIONS",
      headers: { Origin: "https://icaroluciano13-dot.github.io" },
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    executionContext(),
  );

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://icaroluciano13-dot.github.io");
  assert.equal(response.headers.get("access-control-allow-credentials"), "true");
  assert.match(response.headers.get("access-control-allow-methods") ?? "", /POST/);
  assert.match(response.headers.get("access-control-allow-methods") ?? "", /PATCH/);
  assert.match(response.headers.get("access-control-allow-methods") ?? "", /DELETE/);
});

test("cross-origin logout remains JSON and sets cross-site cookies", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(
    new Request("https://guia-comercial-mult-portas.eletrovale-cont.chatgpt.site/api/auth/logout", {
      method: "POST",
      headers: { Origin: "https://icaroluciano13-dot.github.io" },
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    executionContext(),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://icaroluciano13-dot.github.io");
  assert.equal(response.headers.get("access-control-allow-credentials"), "true");
  assert.match(response.headers.get("set-cookie") ?? "", /SameSite=None/);
  assert.deepEqual(JSON.parse(await response.text()), { ok: true });
});

test("admin policy explicitly allows GitHub Pages and keeps the password server-side", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../app/api/admin/_lib.ts", import.meta.url), "utf8");
  assert.match(source, /https:\/\/icaroluciano13-dot\.github\.io/);
  assert.match(source, /ADMIN_PASSWORD\s*=\s*runtimeEnv\.ADMIN_PASSWORD/);
  assert.match(source, /export function isAdminRequest/);
});

test("admin login rejects an unapproved web origin", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(
    new Request("https://guia-comercial-mult-portas.eletrovale-cont.chatgpt.site/api/auth/login", {
      method: "POST",
      headers: {
        Origin: "https://example.invalid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: "admin", password: "admin" }),
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    executionContext(),
  );

  assert.equal(response.status, 401);
  assert.deepEqual(JSON.parse(await response.text()), { error: "Usuário ou senha incorretos." });
});

test("admin profile management exposes protected create, edit and delete routes", async () => {
  const { readFile } = await import("node:fs/promises");
  const collectionRoute = await readFile(new URL("../app/api/admin/users/route.ts", import.meta.url), "utf8");
  const itemRoute = await readFile(new URL("../app/api/admin/users/[id]/route.ts", import.meta.url), "utf8");
  assert.match(collectionRoute, /export async function POST/);
  assert.match(collectionRoute, /getAdminSession/);
  assert.match(itemRoute, /export async function PATCH/);
  assert.match(itemRoute, /export async function DELETE/);
  assert.match(itemRoute, /employeeSessions/);
  assert.match(itemRoute, /employeeData/);
  assert.match(itemRoute, /getAdminSession/);
});

test("employee authentication UI stays separate from the guide workspace", async () => {
  const { readFile } = await import("node:fs/promises");
  const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const authSource = await readFile(new URL("../app/auth-screen.tsx", import.meta.url), "utf8");
  assert.match(pageSource, /from ["']\.\/auth-screen["']/);
  assert.doesNotMatch(pageSource, /function AuthScreen\(/);
  assert.match(authSource, /export function AuthScreen/);
  assert.match(authSource, /className="auth-shell"/);
});
