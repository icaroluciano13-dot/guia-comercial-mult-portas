import assert from "node:assert/strict";
import test from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { createWorkbookArchive, downloadWorkbook } from "../app/lib/xlsx-export.mjs";

test("Excel export is valid OOXML, keeps numeric prices and neutralizes formula text", () => {
  const archive = createWorkbookArchive({
    title: "Requisição & teste",
    subject: "Validação",
    author: "Mult Portas",
    createdAt: "2026-08-13T12:00:00.000Z",
    sheets: [
      {
        name: "Requisições",
        rows: [
          ["Produto", "Preço"],
          ["Porta <teste>", 1299.9],
          ["=HYPERLINK(\"https://example.invalid\")", 0],
        ],
        columnWidths: [30, 18],
        currencyColumns: [1],
        autoFilter: true,
      },
      { name: "Listas", rows: [["Campo", "Valor"], ["Cor", "Branco"]] },
    ],
  });
  const files = unzipSync(archive);
  const requiredFiles = [
    "[Content_Types].xml",
    "_rels/.rels",
    "docProps/core.xml",
    "docProps/app.xml",
    "xl/workbook.xml",
    "xl/_rels/workbook.xml.rels",
    "xl/styles.xml",
    "xl/worksheets/sheet1.xml",
    "xl/worksheets/sheet2.xml",
  ];
  requiredFiles.forEach((name) => assert.ok(files[name], `${name} ausente`));

  const worksheet = strFromU8(files["xl/worksheets/sheet1.xml"]);
  assert.match(worksheet, /<dimension ref="A1:B3"\/>/);
  assert.match(worksheet, /<autoFilter ref="A1:B3"\/>/);
  assert.match(worksheet, /Porta &lt;teste&gt;/);
  assert.match(worksheet, /<c r="B2" s="3"><v>1299\.9<\/v><\/c>/);
  assert.match(worksheet, /t="inlineStr"><is><t xml:space="preserve">=HYPERLINK/);
  assert.doesNotMatch(worksheet, /<f>/);
  assert.match(strFromU8(files["docProps/core.xml"]), /Requisição &amp; teste/);
});

test("Excel export removes invalid XML controls and preserves valid Unicode", () => {
  const archive = createWorkbookArchive({
    sheets: [{ name: "Kits", rows: [["Observação"], ["Kit\u0000 Dalcomad 🚪"]] }],
  });
  const worksheet = strFromU8(unzipSync(archive)["xl/worksheets/sheet1.xml"]);
  assert.doesNotMatch(worksheet, /\u0000/);
  assert.match(worksheet, /Kit Dalcomad 🚪/);
});

test("Excel download keeps the user click synchronous and exposes the correct file", () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  const originalCreateObjectURL = globalThis.URL.createObjectURL;
  const originalRevokeObjectURL = globalThis.URL.revokeObjectURL;
  const events = [];
  let createdBlob;
  let revokeDelay = 0;
  const anchor = {
    href: "",
    download: "",
    rel: "",
    style: {},
    click() { events.push("click"); },
    remove() { events.push("remove"); },
  };

  try {
    globalThis.document = {
      createElement(tag) {
        assert.equal(tag, "a");
        events.push("create");
        return anchor;
      },
      body: {
        appendChild(value) {
          assert.equal(value, anchor);
          events.push("append");
        },
      },
    };
    globalThis.window = {
      setTimeout(callback, delay) {
        revokeDelay = delay;
        callback();
        return 1;
      },
    };
    globalThis.URL.createObjectURL = (blob) => {
      createdBlob = blob;
      events.push("url");
      return "blob:requisicao-dalcomad";
    };
    globalThis.URL.revokeObjectURL = (url) => {
      assert.equal(url, "blob:requisicao-dalcomad");
      events.push("revoke");
    };

    const result = downloadWorkbook({
      filename: "Requisicao_Kit_Porta_Dalcomad",
      sheets: [{ name: "Requisições", rows: [["Fabricante"], ["DALCOMAD"]] }],
    });

    assert.deepEqual(events, ["url", "create", "append", "click", "remove", "revoke"]);
    assert.equal(anchor.download, "Requisicao_Kit_Porta_Dalcomad.xlsx");
    assert.equal(anchor.href, "blob:requisicao-dalcomad");
    assert.equal(createdBlob.type, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    assert.ok(result.byteLength > 0);
    assert.equal(result.filename, anchor.download);
    assert.equal(revokeDelay, 60_000);
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
    globalThis.URL.createObjectURL = originalCreateObjectURL;
    globalThis.URL.revokeObjectURL = originalRevokeObjectURL;
  }
});

test("Dalcomad request exposes only Kit Porta combinations from the approved list", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const options = source.slice(source.indexOf("const dalcomadKitColors"), source.indexOf("const factoryWizardSteps"));
  const wizard = source.slice(source.indexOf("const factoryWizardSteps"), source.indexOf("const defaultFactoryItems"));

  assert.match(options, /\["BRANCO", "BRANCO TX", "CINZA URBAN", "FREIJÓ", "PRETO", "MOGNO"\]/);
  assert.match(options, /\["ECO", "STANDER", "SENCE"\]/);
  assert.match(options, /\["PET", "MELAMÍNICO", "RENOLIT"\]/);
  assert.match(options, /descriptions: \["KIT PORTA"\]/);
  assert.match(options, /openings: \["ABRIR"\]/);
  assert.doesNotMatch(options, /CORRER|PIVOTANTE|CAMARÃO|JANELA|VENEZIANA|VITRÔ|OUTRO \/ DIGITAR|EUROMAX|CONSTRUMAX/);
  assert.doesNotMatch(wizard, /key: "description"|key: "opening"/);
  assert.match(wizard, /key: "priceWithoutLock"/);
  assert.match(wizard, /key: "priceWithLock"/);
  assert.match(source, /description: "KIT PORTA",\s+opening: "ABRIR",\s+\.\.\.factoryWizardDraft,/s);
  assert.match(source, /import \{ downloadWorkbook \} from "\.\/lib\/xlsx-export\.mjs"/);
  assert.doesNotMatch(source, /await import\("\.\/lib\/xlsx-export\.mjs"\)/);
});
