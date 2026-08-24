import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildProviderMessage, providerMessageExamples } from "../app/lib/provider-message.mjs";
import { GUIDE_STATE_VERSION, normalizeEmployeeState } from "../app/api/data/state-contract.mjs";

test("monta uma apresentação completa para o prestador", () => {
  const message = buildProviderMessage({
    contactName: "Carlos",
    senderName: "Marina",
    providerType: "Empreiteiro ou construtor",
    region: "Araraquara e região",
    objective: "apoiar as obras que você atende com portas e esquadrias",
    question: "posso te enviar uma apresentação curta do nosso trabalho",
    channel: "WhatsApp",
    tone: "Consultivo",
  });

  for (const expected of ["Carlos", "Marina", "empreiteiro ou construtor", "Araraquara e região", "41 anos", "85 cidades", "posso te enviar uma apresentação curta do nosso trabalho?"]) {
    assert.match(message, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
  assert.doesNotMatch(message, /undefined|\[object Object\]/);
});

test("gera mensagens utilizáveis em todos os canais e tons", () => {
  for (const channel of ["WhatsApp", "Áudio"]) {
    for (const tone of ["Consultivo", "Direto", "Próximo"]) {
      const message = buildProviderMessage({ channel, tone });
      assert.ok(message.length > 80 && message.length < 1_400, `${channel}/${tone} deve ser concisa`);
      assert.match(message, /Mult Portas/);
      assert.match(message, /\?$/);
      assert.doesNotMatch(message, /undefined|\[object Object\]/);
    }
  }
  assert.equal(providerMessageExamples.length, 4);
  assert.ok(providerMessageExamples.every((example) => example.message.includes("Mult Portas")));
});

test("persiste o planejador de prestadores sem misturar os dados do cliente", () => {
  const state = normalizeEmployeeState({
    messages: {
      audience: "Prestador",
      name: "Cliente preservado",
      provider: {
        name: "Carlos",
        type: "Instalador de portas ou esquadrias",
        region: "Matão",
        objective: "manter contato para futuras indicações",
        question: "posso enviar nosso portfólio?",
      },
    },
  });

  assert.equal(state.schemaVersion, GUIDE_STATE_VERSION);
  assert.equal(state.messages.audience, "Prestador");
  assert.equal(state.messages.name, "Cliente preservado");
  assert.deepEqual(state.messages.provider, {
    name: "Carlos",
    type: "Instalador de portas ou esquadrias",
    region: "Matão",
    objective: "manter contato para futuras indicações",
    question: "posso enviar nosso portfólio?",
  });

  const legacy = normalizeEmployeeState({ messages: { name: "João" } });
  assert.equal(legacy.messages.audience, "Cliente");
  assert.equal(legacy.messages.name, "João");
  assert.deepEqual(legacy.messages.provider, { name: "", type: "", region: "", objective: "", question: "" });
});

test("expõe o modo separado de prestadores com seleção acessível", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const moduleSource = await readFile(new URL("../app/lib/provider-message.mjs", import.meta.url), "utf8");

  assert.match(page, /Prestador \/ parceiro/);
  assert.match(page, /aria-pressed=\{messageAudience === "Prestador"\}/);
  assert.match(page, /providerMessageExamples/);
  assert.doesNotMatch(moduleSource, /GPT|OpenAI/i);
});
