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

export const providerCompanyTypeOptions = [
  "Construção civil e empreendimentos",
  "Reformas e manutenção predial",
  "Arquitetura e projetos",
  "Engenharia e obras",
  "Instalação de portas e esquadrias",
  "Administração de condomínios",
  "Marcenaria e interiores",
  "Revenda de materiais de construção",
];

export const providerGoalOptions = [
  "me apresentar e abrir uma possível parceria",
  "apoiar as obras que você atende com portas e esquadrias",
  "manter contato para futuras indicações",
  "conhecer melhor suas demandas e obras",
  "facilitar cotações para seus clientes",
  "apresentar nosso portfólio e atendimento",
];

export const providerCompanyGoalOptions = [
  "apresentar a Mult Portas e avaliar uma possível parceria",
  "apoiar as obras da empresa com portas e esquadrias",
  "facilitar cotações e especificações para os projetos",
  "disponibilizar nosso portfólio para futuras demandas",
  "estabelecer um canal comercial para compras e indicações",
  "conhecer melhor as demandas atendidas pela empresa",
];

export const providerQuestionOptions = [
  "você atende obras em Araraquara ou cidades da região?",
  "você costuma indicar portas e esquadrias aos seus clientes?",
  "posso te enviar uma apresentação curta do nosso trabalho?",
  "qual é a melhor forma de mantermos contato?",
  "você tem alguma obra em andamento que precise de cotação?",
];

export const providerCompanyQuestionOptions = [
  "com quem posso conversar sobre compras e especificações para as obras?",
  "posso encaminhar uma apresentação institucional e nosso portfólio?",
  "a empresa atende projetos em Araraquara e cidades da região?",
  "há alguma obra em andamento para a qual possamos preparar uma cotação?",
  "qual é o melhor canal para mantermos este contato comercial?",
];

export const providerMessageExamples = [
  {
    id: "provider-bricklayer",
    tag: "Pedreiro · primeiro contato",
    title: "Uma conversa mais próxima",
    message: "Oi, [nome]! Tudo certo? Aqui é [seu nome], da Mult Portas. Vi que você trabalha com obras na região e achei que seria legal a gente se conhecer. Trabalhamos com portas e esquadrias e podemos ajudar nas cotações dos seus clientes. Você atende obras em Araraquara ou também nas cidades próximas?",
  },
  {
    id: "provider-builder",
    tag: "Pedreiro ou empreiteiro",
    title: "Apoio para as obras",
    message: "Oi, [nome]! Tudo certo? Aqui é [seu nome], da Mult Portas. A gente trabalha com portas e esquadrias para várias etapas da obra e também ajuda a conferir as opções antes da cotação. Queria deixar nosso contato para quando você ou algum cliente precisar. Posso te mandar uma apresentação curta?",
  },
  {
    id: "provider-installer",
    tag: "Instalador ou marceneiro",
    title: "Contato profissional",
    message: "Oi, [nome]! Tudo certo? Aqui é [seu nome], da Mult Portas. Estou conhecendo profissionais da região que trabalham com instalação e acabamento de portas. A ideia é manter um contato profissional para futuras demandas e indicações. Posso te enviar uma apresentação curta do nosso trabalho?",
  },
  {
    id: "provider-renovation",
    tag: "Profissional de reformas",
    title: "Contato para futuras demandas",
    message: "Oi, [nome]! Tudo certo? Aqui é [seu nome], da Mult Portas. Vi que você trabalha com reformas e pensei que nosso contato poderia ajudar nas próximas obras. Temos portas e esquadrias de várias linhas e ajudamos a organizar a cotação. Você costuma indicar esse material para seus clientes?",
  },
];

export const providerCompanyMessageExamples = [
  {
    id: "company-institutional",
    tag: "Empresa · apresentação institucional",
    title: "Contato comercial formal",
    message: "Olá, [empresa ou contato]. Tudo bem? Meu nome é [seu nome] e faço parte da equipe comercial da Mult Portas. Atuamos há 41 anos no mercado de portas e esquadrias e atendemos 85 cidades da região. Gostaria de apresentar nossa empresa e avaliar uma possível parceria. Posso encaminhar uma apresentação institucional e nosso portfólio?",
  },
  {
    id: "company-builder",
    tag: "Construtora ou incorporadora",
    title: "Apoio para obras e projetos",
    message: "Olá, [empresa ou contato]. Tudo bem? Meu nome é [seu nome] e represento a Mult Portas. Trabalhamos com portas e esquadrias para diferentes etapas da obra, com apoio na especificação e na cotação. Gostaria de conhecer as demandas atendidas pela empresa. Com quem posso conversar sobre compras e especificações para as obras?",
  },
  {
    id: "company-office",
    tag: "Arquitetura ou engenharia",
    title: "Parceria em especificação",
    message: "Olá, [empresa ou contato]. Tudo bem? Sou [seu nome], da equipe comercial da Mult Portas. Nosso portfólio reúne diferentes linhas de portas e esquadrias, e nossa equipe pode apoiar a seleção e a conferência técnica para cada projeto. Há alguma obra em andamento para a qual possamos preparar uma cotação?",
  },
  {
    id: "company-maintenance",
    tag: "Reformas ou manutenção",
    title: "Canal comercial para demandas",
    message: "Olá, [empresa ou contato]. Tudo bem? Meu nome é [seu nome] e faço parte da Mult Portas. Estou entrando em contato para disponibilizar nosso atendimento em futuras demandas de portas e esquadrias. Atendemos Araraquara e diversas cidades da região. Qual é o melhor canal para mantermos este contato comercial?",
  },
];

export function buildProviderMessage(input = {}) {
  const profile = input.profile === "Empresa" ? "Empresa" : "Pedreiro";
  const contactName = cleanText(input.contactName, 120);
  const senderName = cleanText(input.senderName, 120);
  const providerType = cleanText(input.providerType, 160) || (profile === "Empresa" ? "construção civil e obras" : "serviços da construção");
  const region = cleanText(input.region, 160);
  const objective = cleanText(input.objective, 240) || (profile === "Empresa" ? "apresentar a Mult Portas e avaliar uma possível parceria" : "me apresentar e abrir uma possível parceria");
  const question = asQuestion(input.question, profile === "Empresa" ? "com quem posso conversar sobre compras e especificações para as obras" : "você costuma atender obras que precisam de portas ou esquadrias");
  const channel = input.channel === "Áudio" ? "Áudio" : "WhatsApp";
  const tone = ["Consultivo", "Direto", "Próximo"].includes(input.tone) ? input.tone : "Consultivo";

  const professionalLabel = `${providerType.charAt(0).toLocaleLowerCase("pt-BR")}${providerType.slice(1)}`;
  const lowerQuestion = `${question.charAt(0).toLocaleLowerCase("pt-BR")}${question.slice(1)}`;
  const capitalizedQuestion = `${question.charAt(0).toLocaleUpperCase("pt-BR")}${question.slice(1)}`;
  const objectiveSentence = `${profile === "Empresa" ? "O objetivo deste contato é" : "A ideia é"} ${objective}${/[.!?]$/.test(objective) ? "" : "."}`;

  if (profile === "Empresa") {
    const greeting = contactName ? `Olá, ${contactName}. Tudo bem?` : "Olá! Tudo bem?";
    const sender = senderName ? `Meu nome é ${senderName} e faço parte da equipe comercial da Mult Portas.` : "Falo em nome da equipe comercial da Mult Portas.";
    const professional = region
      ? `Identifiquei que sua empresa atua com ${professionalLabel} em ${region}.`
      : `Identifiquei que sua empresa atua com ${professionalLabel}.`;
    const proof = [];
    if (input.includeCompany !== false) proof.push("A Mult Portas atua há 41 anos e atende 85 cidades da região.");
    if (input.includePortfolio !== false) proof.push("Nosso portfólio reúne portas e esquadrias para diferentes etapas e perfis de obra.");
    if (input.includeSupport !== false) proof.push("Nossa equipe apoia a especificação e a conferência técnica de cada solução.");
    const trust = proof.join(" ");

    if (tone === "Direto") return [greeting, sender, professional, objectiveSentence, trust, capitalizedQuestion].filter(Boolean).join(" ");
    if (tone === "Próximo") return [greeting, sender, professional, "Acreditamos que pode haver uma boa sinergia entre nossas empresas.", objectiveSentence, trust, `Se for conveniente, ${lowerQuestion}`].filter(Boolean).join(" ");
    return [greeting, sender, professional, objectiveSentence, trust, `Para direcionarmos este contato, ${lowerQuestion}`].filter(Boolean).join(" ");
  }

  const greeting = contactName ? `Oi, ${contactName}! Tudo certo?` : "Oi! Tudo certo?";
  const sender = senderName ? `Aqui é ${senderName}, da Mult Portas.` : "Aqui é o pessoal da Mult Portas.";
  const professional = region
    ? `Vi que você trabalha como ${professionalLabel} em ${region}.`
    : `Vi que você trabalha como ${professionalLabel}.`;
  const proof = [];
  if (input.includeCompany !== false) proof.push("A Mult Portas já está há 41 anos no mercado e atende 85 cidades da região.");
  if (input.includePortfolio !== false) proof.push("A gente trabalha com portas e esquadrias para diferentes etapas da obra.");
  if (input.includeSupport !== false) proof.push("Também ajudamos a conferir as opções e especificações antes da cotação.");
  const trust = proof.join(" ");

  if (channel === "Áudio" && tone === "Consultivo") return [greeting, sender, professional, "Queria conhecer melhor seu trabalho.", objectiveSentence, trust, `Para começar, ${lowerQuestion}`].filter(Boolean).join(" ");
  if (tone === "Direto") return [greeting, sender, professional, objectiveSentence, trust, capitalizedQuestion].filter(Boolean).join(" ");
  if (tone === "Próximo") return [greeting, sender, professional, "Achei que seria legal a gente se conhecer e manter contato.", objectiveSentence, trust, `Se fizer sentido, ${lowerQuestion}`].filter(Boolean).join(" ");
  return [greeting, sender, professional, "Queria conhecer melhor seu trabalho.", objectiveSentence, trust, `Para começar, ${lowerQuestion}`].filter(Boolean).join(" ");
}
