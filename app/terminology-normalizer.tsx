"use client";

import { useEffect } from "react";

const replacements: Array<[RegExp, string]> = [
  [/\bPedreiros\b/g, "Prestadores de serviços"],
  [/\bpedreiros\b/g, "prestadores de serviços"],
  [/\bPedreiro\b/g, "Prestador de serviços"],
  [/\bpedreiro\b/g, "prestador de serviços"],
];

function normalizeText(value: string) {
  return replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}

function normalizeTextNodes(root: Node) {
  if (typeof document === "undefined") return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();

  while (current) {
    const parentTag = current.parentElement?.tagName;
    if (parentTag !== "SCRIPT" && parentTag !== "STYLE" && current.nodeValue) {
      const normalized = normalizeText(current.nodeValue);
      if (normalized !== current.nodeValue) current.nodeValue = normalized;
    }
    current = walker.nextNode();
  }
}

export function TerminologyNormalizer() {
  useEffect(() => {
    normalizeTextNodes(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          if (mutation.target.nodeValue) {
            const normalized = normalizeText(mutation.target.nodeValue);
            if (normalized !== mutation.target.nodeValue) mutation.target.nodeValue = normalized;
          }
          continue;
        }

        mutation.addedNodes.forEach((node) => normalizeTextNodes(node));
      }
    });

    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
