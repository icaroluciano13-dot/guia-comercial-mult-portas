import assert from "node:assert/strict";
import test from "node:test";
import { GUIDE_STATE_VERSION, normalizeEmployeeState, summarizeEmployeeState } from "../app/api/data/state-contract.mjs";

test("a new employee state is complete, versioned and fully zeroed", () => {
  const state = normalizeEmployeeState(null);
  assert.equal(state.schemaVersion, GUIDE_STATE_VERSION);
  assert.deepEqual(state.metrics, {
    leads: 0,
    quotes: 0,
    officialQuotes: 0,
    incompleteQuotes: 0,
    followups: 0,
    closed: 0,
    ticket: 0,
  });
  assert.deepEqual(state.followups, []);
  assert.deepEqual(state.factory, []);
  assert.deepEqual(state.training.scoreHistory, []);
  assert.equal(summarizeEmployeeState(state).learningIndex, 0);
});

test("employee state is bounded and ignores unknown or unsafe fields", () => {
  const state = normalizeEmployeeState({
    secret: "must-not-survive",
    metrics: { quotes: -4, closed: "3", ticket: Number.POSITIVE_INFINITY },
    followups: [{ id: "one", client: " Cliente ", next: " Retornar ", priority: "Urgente", done: false, password: "x" }],
    training: {
      scoreHistory: [-3, 6.4, 99],
      skillHistory: [{ acolhimento: 20, diagnostico: -2 }],
      scenarioStats: { "__proto__": { attempts: 50 }, safe: { attempts: 2, best: 9, lastScore: 8 } },
    },
    factory: [{ manufacturer: "OUTRA", description: " Porta " }],
    drawerChecks: { "__proto__": ["x"], item: ["medida"] },
  });

  assert.equal("secret" in state, false);
  assert.equal(state.metrics.quotes, 0);
  assert.equal(state.metrics.closed, 3);
  assert.equal(state.metrics.ticket, 0);
  assert.deepEqual(state.training.scoreHistory, [0, 6, 10]);
  assert.equal(state.training.skillHistory[0].acolhimento, 10);
  assert.equal(state.training.skillHistory[0].diagnostico, 0);
  assert.equal(Object.hasOwn(state.training.scenarioStats, "__proto__"), false);
  assert.equal(Object.hasOwn(state.drawerChecks, "__proto__"), false);
  assert.equal(state.factory[0].manufacturer, "DALCOMAD");
  assert.deepEqual(state.followups[0], {
    id: "one",
    client: "Cliente",
    status: "Aguardando retorno",
    next: "Retornar",
    priority: "Média",
    done: false,
  });
});

test("learning summary is deterministic and account-scoped", () => {
  const summary = summarizeEmployeeState({
    metrics: { quotes: 7, closed: 2 },
    followups: [{ id: "1", client: "A", next: "B", done: false }],
    training: {
      rounds: 12,
      best: 9,
      scenarios: ["a", "b", "c"],
      scoreHistory: [6, 8],
      skillHistory: [
        { acolhimento: 8, diagnostico: 4, precisao: 6, valor: 7, proximoPasso: 5 },
        { acolhimento: 9, diagnostico: 5, precisao: 7, valor: 7, proximoPasso: 6 },
      ],
    },
  });
  assert.equal(summary.averageScore, 7);
  assert.equal(summary.quotes, 7);
  assert.equal(summary.pendingFollowUps, 1);
  assert.equal(summary.weakestSkill, "diagnostico");
  assert.equal(summary.learningIndex, 62);
});
