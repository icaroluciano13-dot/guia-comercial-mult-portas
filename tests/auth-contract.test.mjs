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
