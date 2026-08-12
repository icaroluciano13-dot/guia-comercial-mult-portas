import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const artifactDir = new URL("../dist-pages/", import.meta.url);

async function readArtifactText() {
  const root = artifactDir.pathname;
  const assetNames = await readdir(join(root, "assets"));
  const files = [join(root, "index.html"), ...assetNames
    .filter((name) => /\.(?:js|css)$/.test(name))
    .map((name) => join(root, "assets", name))];
  return (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
}

test("GitHub Pages artifact keeps the employee access and complete menu", async () => {
  const html = await readFile(new URL("../dist-pages/index.html", import.meta.url), "utf8");
  const artifact = await readArtifactText();

  assert.match(html, /\/guia-comercial-mult-portas\//);
  for (const label of [
    "Visão geral",
    "Roteiro de venda",
    "Ser um bom vendedor",
    "Treino IA",
    "Timing",
    "Mensagem rápida",
    "Requisição fábrica",
    "Catálogo rápido",
  ]) {
    assert.match(artifact, new RegExp(label));
  }

  for (const label of ["Usuário de login", "Cadastrar perfil", "Criar meu perfil", "São Carlos", "Sair do Guia"]) {
    assert.match(artifact, new RegExp(label));
  }

  assert.match(artifact, /mult-portas-guia-profiles-v1/);
  assert.match(artifact, /mult-portas-guia-catalog-checks-v1/);
  assert.doesNotMatch(artifact, /Ex\.?\s*:\s*icaro/i);
  assert.doesNotMatch(artifact, /Icaro Oliveira|Ícaro Oliveira|Oliveira/i);
  assert.doesNotMatch(artifact, /ChatGPT|GPT/i);
  assert.doesNotMatch(artifact, /user-chip[^<]{0,80}>Í</i);
});
