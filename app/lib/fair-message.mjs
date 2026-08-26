function cleanText(value, maxLength = 240) {
  if (typeof value !== "string") return "";
  const cleaned = value.trim().replace(/\s+/g, " ").slice(0, maxLength);
  return /^(undefined|null|nan)$/i.test(cleaned) ? "" : cleaned;
}

const fairDefaults = {
  eventName: "Feirão SUPER PROMO MULT PORTAS",
  eventDate: "sábado, 29/08",
  eventTime: "das 9h às 17h",
  city: "Araraquara",
  discount: "até 60% OFF",
};

export const fairClientProfiles = [
  { id: "neutral", label: "Neutro", shortLabel: "Neutro", description: "Convite versátil, sem presumir contato anterior." },
  { id: "quote", label: "Já pediu orçamento", shortLabel: "Orçamento", description: "Retoma a cotação com cuidado e sem cobrança." },
  { id: "store-visit", label: "Visitou a loja", shortLabel: "Visitou a loja", description: "Reconhece a visita e convida para comparar opções." },
  { id: "reengagement", label: "Contato sem resposta", shortLabel: "Retomada leve", description: "Reabre a conversa sem dizer que o cliente sumiu." },
  { id: "construction", label: "Em obra ou reforma", shortLabel: "Obra / reforma", description: "Conecta o Feirão ao momento do projeto." },
  { id: "price", label: "Focado em preço", shortLabel: "Foco em preço", description: "Valoriza a condição sem prometer o menor preço." },
  { id: "returning", label: "Cliente antigo", shortLabel: "Cliente antigo", description: "Retoma o relacionamento de forma próxima." },
];

export const fairToneOptions = [
  { id: "welcoming", label: "Acolhedor", description: "Recebe com carinho e deixa o cliente à vontade." },
  { id: "direct", label: "Direto", description: "Vai ao ponto sem perder a educação." },
  { id: "persuasive", label: "Persuasivo", description: "Mostra valor e facilita o próximo passo, sem pressão." },
];

export const fairInterestOptions = [
  "portas de aço",
  "portas de alumínio",
  "portas de madeira",
  "janelas",
  "itens para a obra",
  "opções do orçamento",
];

function profileHook(profileId, interest) {
  const interestText = interest ? ` de ${interest.toLocaleLowerCase("pt-BR")}` : "";
  switch (profileId) {
    case "quote":
      return interest
        ? `Lembrei do seu orçamento${interestText} e achei importante te avisar.`
        : "Lembrei do orçamento que conversamos e achei importante te avisar.";
    case "store-visit":
      return interest
        ? `Foi muito bom receber você na loja e conversar sobre ${interest.toLocaleLowerCase("pt-BR")}.`
        : "Foi muito bom receber você na loja e mostrar nossas opções.";
    case "reengagement":
      return "Sei que a rotina pode ficar corrida, então passei apenas para deixar um convite que pode ser útil, sem cobrança.";
    case "construction":
      return interest
        ? `Como você está cuidando da obra ou reforma, lembrei do seu interesse em ${interest.toLocaleLowerCase("pt-BR")}.`
        : "Como você está cuidando da obra ou reforma, lembrei de você.";
    case "price":
      return "Como você está comparando opções e valores, achei importante te avisar desta condição.";
    case "returning":
      return "Já faz um tempo desde nosso último atendimento e eu queria te fazer um convite especial.";
    default:
      return "Quero te fazer um convite especial.";
  }
}

function toneClosing(tone, interest) {
  const interestText = interest ? ` de ${interest.toLocaleLowerCase("pt-BR")}` : "";
  if (tone === "direct") {
    return interest
      ? `Se quiser, posso adiantar algumas opções${interestText} antes da sua visita. Você pretende passar por aqui?`
      : "Se quiser aproveitar, posso adiantar algumas opções antes da sua visita. Você pretende passar por aqui?";
  }
  if (tone === "persuasive") {
    return interest
      ? `Pode ser um bom momento para comparar opções${interestText} e buscar uma condição mais interessante para sua obra, sem compromisso. Quer que eu deixe algumas alternativas separadas para você?`
      : "Pode ser um bom momento para comparar opções e buscar uma condição mais interessante para sua obra, sem compromisso. Quer que eu deixe algumas alternativas separadas para você?";
  }
  return "Preparamos tudo para receber você com calma e ajudar no que precisar. Quer que eu te envie a localização?";
}

function spokenDate(value) {
  return value.replace(/\b(\d{1,2})\/\d{1,2}\b/, "dia $1");
}

function spokenDiscount(value) {
  return value.replace(/\s*OFF\b/i, " de desconto");
}

export function buildFairMessage(input = {}) {
  const profileId = fairClientProfiles.some((profile) => profile.id === input.profileId) ? input.profileId : "neutral";
  const tone = fairToneOptions.some((option) => option.id === input.tone) ? input.tone : "welcoming";
  const channel = input.channel === "Áudio" ? "Áudio" : "WhatsApp";
  const clientName = cleanText(input.clientName, 120);
  const consultantName = cleanText(input.consultantName, 120);
  const interest = cleanText(input.interest, 160);
  const eventName = cleanText(input.eventName, 160) || fairDefaults.eventName;
  const eventDate = cleanText(input.eventDate, 80) || fairDefaults.eventDate;
  const eventTime = cleanText(input.eventTime, 80) || fairDefaults.eventTime;
  const city = cleanText(input.city, 120) || fairDefaults.city;
  const discount = cleanText(input.discount, 80) || fairDefaults.discount;
  const includeEmojis = channel === "WhatsApp" && input.includeEmojis !== false;

  const greeting = clientName
    ? `Oi, ${clientName}! Tudo bem?${includeEmojis ? " 😊" : ""}`
    : `Oi! Tudo bem?${includeEmojis ? " 😊" : ""}`;
  const sender = consultantName ? `Aqui é ${consultantName}, da Mult Portas.` : "Aqui é da equipe da Mult Portas.";
  const hook = profileHook(profileId, interest);
  const productLine = interest
    ? `Pode ser uma boa oportunidade para olhar as opções de ${interest.toLocaleLowerCase("pt-BR")} com calma.`
    : "Pode ser uma boa oportunidade para comparar as opções com calma.";
  const closing = toneClosing(tone, interest);

  if (channel === "Áudio") {
    const eventLine = `Neste ${spokenDate(eventDate)}, teremos o ${eventName}, ${eventTime}, em ${city}, com ${spokenDiscount(discount)} em portas e janelas de aço, alumínio e madeira, além de condições especiais.`;
    return [greeting, sender, hook, eventLine, productLine, closing].join(" ");
  }

  const eventLine = `${includeEmojis ? "💥 " : ""}Neste ${eventDate}, teremos o ${eventName}, ${eventTime}, em ${city}, com ${discount} em portas e janelas de aço, alumínio e madeira, além de condições especiais.`;
  return [
    `${greeting}\n${sender}`,
    hook,
    eventLine,
    productLine,
    closing,
  ].join("\n\n");
}
