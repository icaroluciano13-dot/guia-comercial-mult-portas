type RuntimeEnv = {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
};

type CoachRequest = {
  scenario?: {
    level?: string;
    tag?: string;
    title?: string;
    context?: string;
    objective?: string;
    opening?: string;
    signals?: string[];
    avoid?: string[];
  };
  history?: Array<{ role?: "customer" | "seller"; text?: string }>;
  sellerMessage?: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function extractText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const data = payload as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };
  if (typeof data.output_text === "string") return data.output_text;
  return (data.output ?? [])
    .flatMap((item) => item.content ?? [])
    .map((item) => item.text ?? "")
    .join("\n");
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = text.trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function cleanList(value: unknown, fallback: string) {
  if (!Array.isArray(value)) return [fallback];
  const cleaned = value.filter((item): item is string => typeof item === "string" && item.trim()).slice(0, 3);
  return cleaned.length ? cleaned : [fallback];
}

async function getRuntime(): Promise<RuntimeEnv> {
  try {
    const cloudflare = await import("cloudflare:workers");
    return cloudflare.env as unknown as RuntimeEnv;
  } catch {
    const processEnv = (globalThis as typeof globalThis & { process?: { env?: RuntimeEnv } }).process?.env;
    return processEnv ?? {};
  }
}

export async function POST(request: Request) {
  let body: CoachRequest;
  try {
    body = await request.json() as CoachRequest;
  } catch {
    return jsonResponse({ error: "Corpo inválido." }, 400);
  }

  const runtime = await getRuntime();
  const apiKey = runtime.OPENAI_API_KEY?.trim();
  const sellerMessage = body.sellerMessage?.trim() ?? "";
  const scenario = body.scenario ?? {};
  if (!sellerMessage || !scenario.title) return jsonResponse({ error: "Cenário e resposta são obrigatórios." }, 400);
  if (!apiKey) return jsonResponse({ error: "Treinador generativo ainda não configurado." }, 503);

  const history = (body.history ?? [])
    .filter((item) => item.role && item.text)
    .slice(-10)
    .map((item) => (item.role === "customer" ? "Cliente: " : "Vendedor: ") + String(item.text).slice(0, 700))
    .join("\n");

  const instructions = [
    "Você é o treinador de vendas da Mult Portas Araraquara. Simule um cliente realista em português do Brasil e avalie a resposta do vendedor.",
    "Sua prioridade é reagir ao conteúdo exato da última mensagem, não repetir uma fala pronta por rodada.",
    "",
    "Regras comerciais obrigatórias:",
    "- Não invente preço, medida, estoque, prazo, código ou disponibilidade.",
    "- Quando faltar confirmação, recomende registrar \"A confirmar\" e consultar a fonte correta.",
    "- Valor deve ser comparado com o que está incluso, nunca com desconto automático.",
    "- O vendedor deve descobrir ambiente, objetivo, medida, quantidade e prazo antes de indicar.",
    "- O atendimento deve terminar com uma próxima ação clara, sem pressão ou urgência falsa.",
    "- Considere as soluções e marcas já estudadas (Dalcomad, Destak, Casmavi, Aluan, Brasil Esquadrias, CRV, Lucasa e Riobras), mas não force uma marca sem diagnóstico.",
    "",
    "Responda SOMENTE com um objeto JSON válido, sem markdown, com estes campos:",
    "{\"score\": número inteiro de 0 a 10, \"summary\": \"avaliação curta e específica para a última mensagem\", \"strengths\": [\"até 3 acertos observáveis\"], \"improvements\": [\"até 3 ajustes práticos\"], \"nextMove\": \"próxima ação comercial específica\", \"customerReply\": \"uma única resposta natural e curta do cliente, respondendo ao que o vendedor acabou de dizer\", \"coachNote\": \"leitura do treinador sobre o que mudou nesta rodada\", \"customerMood\": \"tom atual do cliente\", \"customerNeed\": \"informação ou ação que falta agora\"}",
    "",
    "O cliente não deve resolver tudo de uma vez: avance a conversa um passo por rodada. Se o vendedor perguntar algo, responda diretamente antes de fazer a próxima pergunta. Se ele trouxer ambiente, medida, prazo, preço, comparação, pagamento, instalação ou evidência, reconheça esse detalhe na resposta. Varie a linguagem e não repita a mesma pergunta só porque é outra rodada. A avaliação deve ser prática, respeitosa e específica. Não repita o texto do vendedor.",
  ].join("\n");

  const input = [
    "Cenário: " + scenario.title,
    "Nível: " + (scenario.level ?? "não informado"),
    "Contexto: " + (scenario.context ?? "não informado"),
    "Objetivo: " + (scenario.objective ?? "conduzir o diagnóstico e definir próximo passo"),
    "Sinais esperados: " + (scenario.signals ?? []).join(", "),
    "Evitar: " + (scenario.avoid ?? []).join(", "),
    "",
    "Histórico recente:",
    history || "Ainda não há histórico.",
    "",
    "Nova resposta do vendedor:",
    sellerMessage.slice(0, 1200),
  ].join("\n");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: runtime.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
        instructions,
        input,
        max_output_tokens: 600,
      }),
    });
    if (!response.ok) return jsonResponse({ error: "O treinador generativo não respondeu." }, 502);
    const raw = extractText(await response.json());
    const parsed = parseJsonObject(raw);
    if (!parsed || typeof parsed.customerReply !== "string") return jsonResponse({ error: "Resposta do treinador inválida." }, 502);

    return jsonResponse({
      mode: "ia",
      score: Math.max(0, Math.min(10, Math.round(Number(parsed.score) || 0))),
      summary: typeof parsed.summary === "string" ? parsed.summary : "Continue conduzindo com clareza.",
      strengths: cleanList(parsed.strengths, "Você manteve a conversa aberta."),
      improvements: cleanList(parsed.improvements, "Defina o próximo passo com o cliente."),
      nextMove: typeof parsed.nextMove === "string" ? parsed.nextMove : "Faça uma pergunta de diagnóstico.",
      customerReply: parsed.customerReply.slice(0, 700),
      coachNote: typeof parsed.coachNote === "string" ? parsed.coachNote.slice(0, 500) : "O treinador está acompanhando a mudança desta rodada.",
      customerMood: typeof parsed.customerMood === "string" ? parsed.customerMood.slice(0, 180) : "Aberto a continuar",
      customerNeed: typeof parsed.customerNeed === "string" ? parsed.customerNeed.slice(0, 240) : "um próximo passo claro",
    });
  } catch {
    return jsonResponse({ error: "Não foi possível consultar o treinador." }, 502);
  } finally {
    clearTimeout(timeoutId);
  }
}
