import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildFairMessage,
  fairClientProfiles,
  fairInterestOptions,
  fairToneOptions,
} from "../app/lib/fair-message.mjs";
import { normalizeEmployeeState } from "../app/api/data/state-contract.mjs";

test("monta um convite personalizado e pronto para WhatsApp", () => {
  const message = buildFairMessage({
    profileId: "quote",
    clientName: "Carlos",
    consultantName: "Ícaro",
    interest: "Porta de alumínio",
    channel: "WhatsApp",
    tone: "welcoming",
    eventDate: "sábado, 29/08",
    eventTime: "das 9h às 17h",
    city: "Araraquara",
    discount: "até 60% OFF",
    includeEmojis: true,
  });

  for (const expected of ["Carlos", "Ícaro", "orçamento de porta de alumínio", "sábado, 29/08", "das 9h às 17h", "Araraquara", "até 60% OFF", "portas e janelas de aço, alumínio e madeira"]) {
    assert.match(message, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
  assert.match(message, /😊|💥/);
  assert.match(message, /\?$/);
});

test("gera convite neutro sem depender dos campos opcionais", () => {
  const message = buildFairMessage({
    clientName: "   ",
    consultantName: null,
    interest: undefined,
    channel: "WhatsApp",
  });

  assert.match(message, /^Oi! Tudo bem\?/);
  assert.match(message, /equipe da Mult Portas/);
  assert.match(message, /Quero te fazer um convite especial/);
  assert.doesNotMatch(message, /undefined|null|nan|\[nome\]|\[produto\]|\[consultor\]/i);
  assert.doesNotMatch(message, / {2,}/);
  assert.match(message, /\?$/);
});

test("mantém os 42 cenários de perfil, tom e canal completos e cordiais", () => {
  assert.equal(fairClientProfiles.length, 7);
  assert.equal(fairToneOptions.length, 3);
  assert.ok(fairInterestOptions.length >= 5);

  for (const profile of fairClientProfiles) {
    for (const tone of fairToneOptions) {
      for (const channel of ["WhatsApp", "Áudio"]) {
        const message = buildFairMessage({
          profileId: profile.id,
          tone: tone.id,
          channel,
          clientName: "Cliente",
          consultantName: "Consultor",
          interest: "porta de madeira",
        });
        assert.ok(message.length > 260 && message.length < 1200, `${profile.id}/${tone.id}/${channel} deve ter tamanho utilizável`);
        assert.match(message, /Feirão SUPER PROMO MULT PORTAS/);
        assert.match(message, /Araraquara/);
        assert.match(message, /60%/);
        assert.match(message, /\?$/);
        assert.doesNotMatch(message, /undefined|null|nan|\[object Object\]|menor preço|última chance|você sumiu/i);
        if (channel === "Áudio") {
          assert.doesNotMatch(message, /😊|💥/);
          assert.doesNotMatch(message, /\n/);
          assert.match(message, /sábado, dia 29/);
          assert.match(message, /60% de desconto/);
        }
      }
    }
  }
});

test("adapta a abertura ao contexto sem cobrar ou inventar histórico", () => {
  const expectedByProfile = new Map([
    ["neutral", /convite especial/i],
    ["quote", /orçamento que conversamos/i],
    ["store-visit", /receber você na loja/i],
    ["reengagement", /rotina pode ficar corrida/i],
    ["construction", /obra ou reforma/i],
    ["price", /comparando opções e valores/i],
    ["returning", /último atendimento/i],
  ]);

  for (const [profileId, expected] of expectedByProfile) {
    const message = buildFairMessage({ profileId, channel: "WhatsApp", tone: "welcoming" });
    assert.match(message, expected);
    assert.doesNotMatch(message, /não respondeu|estou aguardando|perdeu|acabando|garantido/i);
  }
});

test("salva e normaliza a personalização do Feirão por funcionário", () => {
  const state = normalizeEmployeeState({
    messages: {
      fair: {
        profileId: "price",
        clientName: "  Carlos  ",
        consultantName: "  Ícaro  ",
        interest: "  porta de alumínio  ",
        channel: "Áudio",
        tone: "persuasive",
        eventDate: "  domingo, 30/08  ",
        eventTime: "  das 10h às 16h  ",
        city: "  Matão  ",
        discount: "  até 50% OFF  ",
        includeEmojis: false,
      },
    },
  });

  assert.deepEqual(state.messages.fair, {
    profileId: "price",
    clientName: "Carlos",
    consultantName: "Ícaro",
    interest: "porta de alumínio",
    channel: "Áudio",
    tone: "persuasive",
    eventDate: "domingo, 30/08",
    eventTime: "das 10h às 16h",
    city: "Matão",
    discount: "até 50% OFF",
    includeEmojis: false,
  });

  const legacy = normalizeEmployeeState({ messages: {} });
  assert.deepEqual(legacy.messages.fair, {
    profileId: "neutral",
    clientName: "",
    consultantName: "",
    interest: "",
    channel: "WhatsApp",
    tone: "welcoming",
    eventDate: "sábado, 29/08",
    eventTime: "das 9h às 17h",
    city: "Araraquara",
    discount: "até 60% OFF",
    includeEmojis: true,
  });
});

test("expõe uma aba acessível com personalização, prévia e modelos prontos", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(page, /id: "fair", label: "Convite Feirão"/);
  assert.match(page, /section === "fair"/);
  assert.match(page, /aria-pressed=\{fairProfileId === profile\.id\}/);
  assert.match(page, /Nome do cliente \(opcional\)/);
  assert.match(page, /Interesse ou produto \(opcional\)/);
  assert.match(page, /WhatsApp/);
  assert.match(page, /Áudio/);
  assert.match(page, /Sete convites prontos/);
  assert.match(page, /copyMessage\(fairMessage/);
  assert.match(css, /\.fair-layout/);
  assert.match(css, /\.fair-template-grid/);
});
