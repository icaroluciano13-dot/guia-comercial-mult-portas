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

export const FAIR_VARIATION_COUNT = 144;

function normalizeVariation(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return ((Math.trunc(numeric) % FAIR_VARIATION_COUNT) + FAIR_VARIATION_COUNT) % FAIR_VARIATION_COUNT;
}

function pickVariant(options, index) {
  return options[((index % options.length) + options.length) % options.length];
}

export function nextFairVariation(currentVariation, randomValue = 0) {
  const current = normalizeVariation(currentVariation);
  const numericRandom = Number(randomValue);
  const safeRandom = Number.isFinite(numericRandom) ? Math.abs(Math.trunc(numericRandom)) : 0;
  const offset = (safeRandom % (FAIR_VARIATION_COUNT - 1)) + 1;
  return (current + offset) % FAIR_VARIATION_COUNT;
}

function buildGreeting(clientName, includeEmojis, variation) {
  const options = clientName
    ? [
      `Oi, ${clientName}! Tudo bem?`,
      `Olá, ${clientName}! Como você está?`,
      `Oi, ${clientName}! Espero que esteja tudo bem.`,
      `Olá, ${clientName}! Tudo certo por aí?`,
      `Oi, ${clientName}! Passando para compartilhar um convite.`,
      `Olá, ${clientName}! Separei uma informação para você.`,
    ]
    : [
      "Oi! Tudo bem?",
      "Olá! Como você está?",
      "Oi! Espero que esteja tudo bem.",
      "Olá! Tudo certo por aí?",
      "Oi! Passando para compartilhar um convite.",
      "Olá! Separei uma informação para você.",
    ];
  return `${pickVariant(options, variation)}${includeEmojis ? " 😊" : ""}`;
}

function buildSender(consultantName, variation) {
  const options = consultantName
    ? [
      `Aqui é ${consultantName}, da Mult Portas.`,
      `Quem fala é ${consultantName}, da Mult Portas.`,
      `Sou ${consultantName}, do atendimento da Mult Portas.`,
      `${consultantName} aqui, da Mult Portas.`,
    ]
    : [
      "Aqui é da equipe da Mult Portas.",
      "Quem fala é a equipe da Mult Portas.",
      "Somos do atendimento da Mult Portas.",
      "Aqui é o pessoal da Mult Portas.",
    ];
  return pickVariant(options, Math.floor(variation / 6));
}

function profileHook(profileId, interest, variation) {
  const lowerInterest = interest ? interest.toLocaleLowerCase("pt-BR") : "";
  const interestText = lowerInterest ? ` de ${lowerInterest}` : "";
  const index = (variation + Math.floor(variation / 4)) % 4;
  switch (profileId) {
    case "quote":
      return pickVariant(interest ? [
        `Lembrei do seu orçamento${interestText} e achei importante te avisar.`,
        `Quis retomar com cuidado o orçamento${interestText} que conversamos.`,
        `Como já falamos sobre ${lowerInterest}, pensei que este convite poderia ajudar.`,
        `Pensei no seu orçamento${interestText} ao preparar este convite.`,
      ] : [
        "Lembrei do orçamento que conversamos e achei importante te avisar.",
        "Quis retomar com cuidado o orçamento que conversamos.",
        "Como já falamos sobre uma cotação, pensei que este convite poderia ajudar.",
        "Pensei no seu orçamento ao preparar este convite.",
      ], index);
    case "store-visit":
      return pickVariant(interest ? [
        `Foi muito bom receber você na loja e conversar sobre ${lowerInterest}.`,
        `Lembrei da sua visita e do interesse em ${lowerInterest}.`,
        `Como você já conheceu nossas opções de ${lowerInterest}, quis te avisar.`,
        `Depois da sua visita, achei que este convite poderia ser útil para comparar ${lowerInterest}.`,
      ] : [
        "Foi muito bom receber você na loja e mostrar nossas opções.",
        "Lembrei da sua visita e quis compartilhar este convite.",
        "Como você já conheceu algumas opções na loja, quis te avisar.",
        "Depois da sua visita, achei que este convite poderia ser útil para comparar com calma.",
      ], index);
    case "reengagement":
      return pickVariant([
        "Sei que a rotina pode ficar corrida, então passei apenas para deixar um convite que pode ser útil, sem cobrança.",
        "Talvez esse assunto tenha ficado para outro momento, e está tudo bem. Trouxe apenas um convite que pode ajudar.",
        "Passando de forma leve para compartilhar uma oportunidade, sem compromisso e sem cobrar resposta.",
        "Se o projeto ainda estiver nos planos, este convite pode ser um jeito simples de retomar quando for melhor para você.",
      ], index);
    case "construction":
      return pickVariant(interest ? [
        `Como você está cuidando da obra ou reforma, lembrei do seu interesse em ${lowerInterest}.`,
        `Pensando na sua obra ou reforma, separei esta informação sobre ${lowerInterest}.`,
        `Como a escolha de ${lowerInterest} faz parte do seu projeto, quis compartilhar este convite.`,
        `Este convite pode ajudar a comparar ${lowerInterest} para a sua obra com mais calma.`,
      ] : [
        "Como você está cuidando da obra ou reforma, lembrei de você.",
        "Pensando na sua obra ou reforma, separei esta informação.",
        "Como algumas escolhas ainda podem fazer parte do seu projeto, quis compartilhar este convite.",
        "Este convite pode ajudar a comparar opções para a sua obra com mais calma.",
      ], index);
    case "price":
      return pickVariant([
        "Como você está comparando opções e valores, achei importante te avisar desta condição.",
        "Pensando no cuidado com o orçamento, quis compartilhar esta oportunidade para você comparar.",
        "Como preço é um ponto importante na decisão, achei que valia te passar esta informação.",
        "Separei este convite para ajudar você a avaliar opções e condições sem pressa.",
      ], index);
    case "returning":
      return pickVariant([
        "Já faz um tempo desde nosso último atendimento e eu queria te fazer um convite especial.",
        "Faz um tempo que a gente não se fala, então lembrei de você ao preparar este convite.",
        "Quis retomar nosso contato de um jeito simples e compartilhar uma novidade da Mult Portas.",
        "Como você já conhece nosso atendimento, achei que valia fazer este convite com carinho.",
      ], index);
    default:
      return pickVariant([
        "Quero te fazer um convite especial.",
        "Passei para compartilhar um convite da Mult Portas.",
        "Separei uma informação que pode ajudar na sua escolha.",
        "Tenho um convite rápido e queria deixar você à vontade para conhecer.",
      ], index);
  }
}

function toneClosing(tone, interest, variation) {
  const interestText = interest ? ` de ${interest.toLocaleLowerCase("pt-BR")}` : "";
  const index = Math.floor(variation / 24) % 6;
  if (tone === "direct") {
    return pickVariant(interest ? [
      `Se quiser, posso adiantar algumas opções${interestText} antes da sua visita. Você pretende passar por aqui?`,
      `Posso te enviar a localização e algumas referências${interestText}. Quer receber?`,
      `Se a condição fizer sentido, posso ajudar a comparar as opções${interestText}. Você quer mais detalhes?`,
      `Para facilitar, posso te passar a localização e orientar sobre ${interest.toLocaleLowerCase("pt-BR")}. Posso enviar?`,
      `Se quiser conferir pessoalmente, eu te passo os dados de chegada. Pretende visitar o Feirão?`,
      `Posso resumir as opções${interestText} antes de você decidir. Quer que eu envie?`,
    ] : [
      "Se quiser aproveitar, posso adiantar algumas opções antes da sua visita. Você pretende passar por aqui?",
      "Posso te enviar a localização e algumas referências. Quer receber?",
      "Se a condição fizer sentido, posso ajudar a comparar as opções. Você quer mais detalhes?",
      "Para facilitar, posso te passar a localização e orientar sobre as opções. Posso enviar?",
      "Se quiser conferir pessoalmente, eu te passo os dados de chegada. Pretende visitar o Feirão?",
      "Posso resumir as opções antes de você decidir. Quer que eu envie?",
    ], index);
  }
  if (tone === "persuasive") {
    return pickVariant(interest ? [
      `Pode ser um bom momento para comparar opções${interestText} e buscar uma condição mais interessante para sua obra, sem compromisso. Quer que eu deixe algumas alternativas separadas para você?`,
      `Comparar as opções${interestText} durante o Feirão pode deixar a escolha mais clara. Quer que eu te envie a localização?`,
      `Você pode aproveitar a visita para avaliar acabamento, composição e condição${interestText} com calma. Quer que eu te ajude a organizar essa comparação?`,
      `Se ${interest.toLocaleLowerCase("pt-BR")} ainda estiver nos seus planos, vale conhecer as alternativas e decidir sem pressão. Posso te passar os detalhes?`,
      `O Feirão pode facilitar a comparação${interestText} em um só momento. Quer que eu te mostre por onde começar?`,
      `Será uma oportunidade para tirar dúvidas e comparar opções${interestText} antes de decidir. Quer receber a localização?`,
    ] : [
      "Pode ser um bom momento para comparar opções e buscar uma condição mais interessante para sua obra, sem compromisso. Quer que eu deixe algumas alternativas separadas para você?",
      "Comparar as opções durante o Feirão pode deixar a escolha mais clara. Quer que eu te envie a localização?",
      "Você pode aproveitar a visita para avaliar acabamento, composição e condição com calma. Quer que eu te ajude a organizar essa comparação?",
      "Se o projeto ainda estiver nos seus planos, vale conhecer as alternativas e decidir sem pressão. Posso te passar os detalhes?",
      "O Feirão pode facilitar a comparação em um só momento. Quer que eu te mostre por onde começar?",
      "Será uma oportunidade para tirar dúvidas e comparar opções antes de decidir. Quer receber a localização?",
    ], index);
  }
  return pickVariant([
    "Preparamos tudo para receber você com calma e ajudar no que precisar. Quer que eu te envie a localização?",
    "Se fizer sentido para você, será um prazer receber você por aqui. Quer que eu te mande a localização?",
    "Fique à vontade para olhar tudo no seu tempo. Posso te passar os detalhes do Feirão?",
    "A equipe estará pronta para orientar com calma. Quer que eu te envie a localização?",
    "Se quiser conhecer as opções sem compromisso, vai ser um prazer receber você. Posso te mandar a localização?",
    "Estou por aqui para ajudar no que precisar. Quer receber os detalhes do evento?",
  ], index);
}

function spokenDate(value) {
  const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return value.replace(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/, (match, day, month, year) => {
    const monthName = months[Number(month) - 1];
    if (!monthName) return `dia ${match}`;
    const normalizedYear = year && year.length === 2 ? `20${year}` : year;
    return `dia ${Number(day)} de ${monthName}${normalizedYear ? ` de ${normalizedYear}` : ""}`;
  });
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
  const variation = normalizeVariation(input.variation);

  const greeting = buildGreeting(clientName, includeEmojis, variation);
  const sender = buildSender(consultantName, variation);
  const hook = profileHook(profileId, interest, variation);
  const productLine = pickVariant(interest ? [
    `Pode ser uma boa oportunidade para olhar as opções de ${interest.toLocaleLowerCase("pt-BR")} com calma.`,
    `Assim, dá para comparar materiais e alternativas de ${interest.toLocaleLowerCase("pt-BR")} no seu tempo.`,
    `Você poderá conhecer opções de ${interest.toLocaleLowerCase("pt-BR")} e tirar dúvidas antes de decidir.`,
    `A ideia é facilitar a avaliação de ${interest.toLocaleLowerCase("pt-BR")} sem compromisso.`,
  ] : [
    "Pode ser uma boa oportunidade para comparar as opções com calma.",
    "Assim, dá para comparar materiais e alternativas no seu tempo.",
    "Você poderá conhecer as opções e tirar dúvidas antes de decidir.",
    "A ideia é facilitar a sua avaliação sem compromisso.",
  ], variation + Math.floor(variation / 3));
  const closing = toneClosing(tone, interest, variation);
  const eventVariant = Math.floor(variation / 2) % 4;

  if (channel === "Áudio") {
    const spokenEventDate = spokenDate(eventDate);
    const spokenEventDiscount = spokenDiscount(discount);
    const eventLine = pickVariant([
      `Neste ${spokenEventDate}, teremos o ${eventName}, ${eventTime}, em ${city}, com ${spokenEventDiscount} em portas e janelas de aço, alumínio e madeira, além de condições especiais.`,
      `O ${eventName} acontece ${spokenEventDate}, ${eventTime}, em ${city}. Teremos ${spokenEventDiscount} em portas e janelas de aço, alumínio e madeira, além de condições especiais.`,
      `A Mult Portas realiza o ${eventName} ${spokenEventDate}, ${eventTime}, em ${city}, com ${spokenEventDiscount} em portas e janelas de aço, alumínio e madeira e condições especiais.`,
      `O convite é para o ${eventName}, ${spokenEventDate}, ${eventTime}, em ${city}. A condição principal será ${spokenEventDiscount} em portas e janelas de aço, alumínio e madeira, além de condições especiais.`,
    ], eventVariant);
    return [greeting, sender, hook, eventLine, productLine, closing].join(" ");
  }

  const eventPrefixes = includeEmojis ? ["💥 ", "📍 ", "✨ ", ""] : ["", "", "", ""];
  const eventLine = `${eventPrefixes[eventVariant]}${pickVariant([
    `Neste ${eventDate}, teremos o ${eventName}, ${eventTime}, em ${city}, com ${discount} em portas e janelas de aço, alumínio e madeira, além de condições especiais.`,
    `O ${eventName} acontece ${eventDate}, ${eventTime}, em ${city}. Teremos ${discount} em portas e janelas de aço, alumínio e madeira, além de condições especiais.`,
    `A Mult Portas realiza o ${eventName} ${eventDate}, ${eventTime}, em ${city}, com ${discount} em portas e janelas de aço, alumínio e madeira e condições especiais.`,
    `O convite é para o ${eventName}, ${eventDate}, ${eventTime}, em ${city}. A condição principal será ${discount} em portas e janelas de aço, alumínio e madeira, além de condições especiais.`,
  ], eventVariant)}`;
  return [
    `${greeting}\n${sender}`,
    hook,
    eventLine,
    productLine,
    closing,
  ].join("\n\n");
}
