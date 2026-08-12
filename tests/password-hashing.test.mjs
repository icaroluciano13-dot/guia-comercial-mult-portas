import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("password hashing stays within the published Worker limit", async () => {
  const source = await readFile(new URL("../app/api/auth/_lib.ts", import.meta.url), "utf8");
  assert.match(source, /PASSWORD_HASH_ITERATIONS\s*=\s*100_000/);
  assert.match(source, /iterations:\s*PASSWORD_HASH_ITERATIONS/);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode("test-password"),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode("test-salt"),
      iterations: 100_000,
      hash: "SHA-256",
    },
    key,
    256,
  );

  assert.equal(new Uint8Array(derived).byteLength, 32);
});
