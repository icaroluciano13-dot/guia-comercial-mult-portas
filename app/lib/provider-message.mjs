function cleanText(value, maxLength = 240) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";
}

function asQuestion(value, fallback) {
  const question = cleanText(value, 240) || fallback;
  return /[?!…]$/.test(question) ? question : `${question}?`;
}

export const providerTypeOptions = [
  "Pedreiro ou profissional de obras",
  "Empreiteiro ou construtor",
  "Instalador de portas ou esquadrias",
  "Arquiteto ou designer",
  "Engenheiro",
  "Marceneiro",
  "Serralheiro ou vidraceiro",
  "Profissional de reformas",
];

export const providerGoalOptions = [
  "me apresentar e abrir uma possível parceria",
  "apoiar as obras que você atende com portas e esquadrias",
  "manter contato para futuras indicações",
  "conhecer melhor suas demandas e obras",
  "facilitar cotações para seus clientes",
  "apresentar nosso portfólio e atendimento",
];

export const providerQuestionOptions = [
  "você atende obras em Araraquara ou cidades da região?",
  "você costuma indicar portas e esquadrias aos seus clientes?",
  "posso te enviar uma apresentação curta do nosso trabalho?",
  "qual é a melhor forma de mantermos contato?",
  "você tem alguma obra em andamento que precise de cotação?",
];

export const providerMessageExamples = [
  {
    id: "provider-general",
    tag: "Apresentação inicial",
    title: "Prestador de serviços",
    message: "Oi, [nome]! Tudo bem? Aqui é [seu nome], da Mult Portas. Trabalhamos com portas e esquadrias e atendemos Araraquara e cidades da região. Estou entrando em contato para conhecer melhor seu trabalho e abrir uma possível parceria. Você costuma atender obras que precisam desse tipo de material?",
  },
  {
    id: "provider-builder",
    tag: "Pedreiro ou empreiteiro",
    title: "Apoio para as obras",
    message: "Oi, [nome]! Tudo bem? Aqui é [seu nome], da Mult Portas. Vi que você trabalha com obras na região e queria me apresentar. Podemos ajudar seus clientes com portas, janelas e esquadrias, desde a escolha até a cotação. Você atende obras em Araraquara ou também nas cidades próximas?",
  },
  {
    id: "provider-installer",
    tag: "Instalador ou marceneiro",
    title: "Contato profissional",
    message: "Oi, [nome]! Tudo bem? Aqui é [seu nome], da Mult Portas. Estou conhecendo profissionais da região que trabalham com instalação e acabamento de portas. A ideia é manter um contato profissional para futuras demandas e indicações. Posso te enviar uma apresentação curta do nosso trabalho?",
  },
  {
    id: "provider-specifier",
    tag: "Arquiteto ou engenheiro",
    title: "Parceria em especificação",
    message: "Oi, [nome]! Tudo bem? Aqui é [seu nome], da Mult Portas. Trabalhamos com diferentes linhas de portas e esquadrias e podemos apoiar a escolha e a cotação para cada projeto. Gostaria de conhecer melhor seu trabalho e deixar nosso contato para futuras demandas. Qual é a melhor forma de mantermos contato?",
  },
];

export function buildProviderMessage(input = {}) {
  const contactName = cleanText(input.contactName, 120);
  const senderName = cleanText(input.senderName, 120);
  const providerType = cleanText(input.providerType, 160) || "prestador de serviços da construção";
  const region = cleanText(input.region, 160);
  const objective = cleanText(input.objective, 240) || "me apresentar e abrir uma possível parceria";
  const question = asQuestion(input.question, "você costuma atender obras que precisam de portas ou esquadrias");
  const channel = input.channel === "Áudio" ? "Áudio" : "WhatsApp";
  const tone = ["Consultivo", "Direto", "Próximo"].includes(input.tone) ? input.tone : "Consultivo";

  const greeting = contactName ? `Oi, ${contactName}! Tudo bem?` : "Olá! Tudo bem?";
  const sender = senderName ? `Aqui é ${senderName}, da Mult Portas.` : "Aqui é a equipe comercial da Mult Portas.";
  const professionalLabel = `${providerType.charAt(0).toLocaleLowerCase("pt-BR")}${providerType.slice(1)}`;
  const professional = region
    ? `Vi que você trabalha como ${professionalLabel} em ${region}.`
    : `Vi que você trabalha como ${professionalLabel}.`;
  const proof = [];
  if (input.includeCompany !== false) proof.push("A empresa tem 41 anos de mercado e atende 85 cidades da região.");
  if (input.includePortfolio !== false) proof.push("Trabalhamos com portas e esquadrias para diferentes etapas da obra.");
  if (input.includeSupport !== false) proof.push("Também ajudamos na escolha da solução e na conferência das especificações.");
  const trust = proof.join(" ");

  const lowerQuestion = `${question.charAt(0).toLocaleLowerCase("pt-BR")}${question.slice(1)}`;
  if (channel === "Áudio") {
    if (tone === "Direto") return [greeting, sender, professional, `A ideia é ${objective}.`, trust, question].filter(Boolean).join(" ");
    if (tone === "Próximo") return [greeting, sender, professional, "Achei que faria sentido a gente se conhecer.", `A ideia é ${objective}.`, trust, `Se fizer sentido, ${lowerQuestion}`].filter(Boolean).join(" ");
    return [greeting, sender, professional, `Queria conhecer melhor seu trabalho e também ${objective}.`, trust, `Para começarmos, ${lowerQuestion}`].filter(Boolean).join(" ");
  }

  if (tone === "Direto") return [greeting, sender, professional, `Estou entrando em contato para ${objective}.`, trust, question].filter(Boolean).join(" ");
  if (tone === "Próximo") return [greeting, sender, professional, "Achei que poderia ser interessante a gente se conhecer e manter contato.", `A ideia é ${objective}.`, trust, `Se fizer sentido, ${lowerQuestion}`].filter(Boolean).join(" ");
  return [greeting, sender, professional, `Quero conhecer melhor seu trabalho e também ${objective}.`, trust, `Para começarmos, ${lowerQuestion}`].filter(Boolean).join(" ");
}
