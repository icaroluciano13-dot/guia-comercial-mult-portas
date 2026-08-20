const PENDING_VALUE = "A confirmar";

export const dalcomadKitCombinations = Object.freeze([
  Object.freeze({ line: "ECO", finish: "PET/PVC TX", color: "CINZA URBAN", swatch: "#596367" }),
  Object.freeze({ line: "ECO", finish: "PET/PVC TX", color: "BRANCO DIAMANTE", swatch: "#f2f3ef" }),
  Object.freeze({ line: "ECO", finish: "PET/PVC TX", color: "CURUPIXA", swatch: "#b8753f" }),
  Object.freeze({ line: "STANDART", finish: "MELAMÍNICO", color: "UNI WHITE", swatch: "#ecece6" }),
  Object.freeze({ line: "STANDART", finish: "MELAMÍNICO", color: "FREIJO", swatch: "#806248" }),
  Object.freeze({ line: "STANDART", finish: "MELAMÍNICO", color: "CURUPIXA", swatch: "#ad6d3c" }),
  Object.freeze({ line: "SENSE", finish: "RENOLIT", color: "BLACK SP", swatch: "#252628" }),
  Object.freeze({ line: "SENSE", finish: "RENOLIT", color: "CINZA GREY", swatch: "#a8acae" }),
  Object.freeze({ line: "SENSE", finish: "RENOLIT", color: "BRANCO POLAR", swatch: "#f4f3ed" }),
  Object.freeze({ line: "SENSE", finish: "RENOLIT", color: "SIRUS CREAM", swatch: "#d4d0c5" }),
]);

/** @param {"line" | "finish" | "color"} key */
export function uniqueDalcomadKitValues(key) {
  return Array.from(new Set(dalcomadKitCombinations.map((item) => item[key])));
}

export const dalcomadKitLines = Object.freeze(uniqueDalcomadKitValues("line"));
export const dalcomadKitFinishes = Object.freeze(uniqueDalcomadKitValues("finish"));
export const dalcomadKitColors = Object.freeze(uniqueDalcomadKitValues("color"));
export const dalcomadKitSwatches = Object.freeze(Object.fromEntries(dalcomadKitCombinations.map((item) => [item.color, item.swatch])));

/**
 * @param {"line" | "finish" | "color"} key
 * @param {{ line?: string, finish?: string }} selection
 */
export function availableDalcomadKitValues(key, selection = {}) {
  const matches = dalcomadKitCombinations.filter((item) => {
    const lineMatches = key === "line" || !selection.line || selection.line === PENDING_VALUE || item.line === selection.line;
    const finishMatches = key !== "color" || !selection.finish || selection.finish === PENDING_VALUE || item.finish === selection.finish;
    return lineMatches && finishMatches;
  });
  return Array.from(new Set(matches.map((item) => item[key])));
}

/** @param {{ line?: string, finish?: string, color?: string }} selection */
export function isKnownDalcomadKitCombination(selection) {
  const values = [selection.line, selection.finish, selection.color];
  if (values.some((value) => !value || value === PENDING_VALUE)) return true;
  return dalcomadKitCombinations.some((item) => item.line === selection.line && item.finish === selection.finish && item.color === selection.color);
}

function normalizedText(value) {
  return typeof value === "string" ? value.trim().toLocaleUpperCase("pt-BR") : "";
}

function allowedValue(value, options, aliases = {}) {
  const normalized = normalizedText(value);
  const resolved = aliases[normalized] ?? normalized;
  return resolved === "A CONFIRMAR" ? PENDING_VALUE : options.includes(resolved) ? resolved : "";
}

/**
 * Migrates earlier spellings and generic color names to the labels shown on
 * the Dalcomad sample boards supplied for this request.
 * @param {{ line?: string, finish?: string, color?: string }} selection
 * @param {{ finish?: string, color?: string }} legacy
 */
export function normalizeDalcomadKitSelection(selection = {}, legacy = {}) {
  const line = allowedValue(selection.line, dalcomadKitLines, {
    STANDER: "STANDART",
    STANDARD: "STANDART",
    SENCE: "SENSE",
  });
  const expectedFinish = line && line !== PENDING_VALUE
    ? dalcomadKitCombinations.find((item) => item.line === line)?.finish ?? ""
    : "";
  const finish = expectedFinish || allowedValue(selection.finish || legacy.finish, dalcomadKitFinishes, {
    PET: "PET/PVC TX",
    "PET/PVC": "PET/PVC TX",
    "PET PVC TX": "PET/PVC TX",
    MELAMINICO: "MELAMÍNICO",
  });
  const rawColor = normalizedText(selection.color || legacy.color);
  const whiteByLine = line === "STANDART" ? "UNI WHITE" : line === "SENSE" ? "BRANCO POLAR" : "BRANCO DIAMANTE";
  const color = allowedValue(rawColor, dalcomadKitColors, {
    BRANCO: whiteByLine,
    "BRANCO TX": whiteByLine,
    PRETO: "BLACK SP",
    "UNI WHITE (BRANCO)": "UNI WHITE",
    "FREIJÓ": "FREIJO",
    "CURUPIXÁ": "CURUPIXA",
    "CIRUS CREAM": "SIRUS CREAM",
  });
  const colorMatchesLine = !line || line === PENDING_VALUE || !color || color === PENDING_VALUE || dalcomadKitCombinations.some((item) => item.line === line && item.color === color);

  return {
    line,
    finish,
    color: colorMatchesLine ? color : "",
  };
}
