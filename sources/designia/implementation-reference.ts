// SOURCE: /lib/calc.ts
import {
  ITEMS,
  SEGMENTS,
  SegmentId,
  getDiscipline,
  Discipline,
  SENIORITY,
  SeniorityLevel,
  LEVELS,
} from "./data";

export type Scores = Record<string, number>; // code -> 0..5 (0 = sem resposta)

export function segmentAverage(scores: Scores, seg: SegmentId): number | null {
  const vals = ITEMS.filter((i) => i.segment === seg)
    .map((i) => scores[i.code] || 0)
    .filter((v) => v > 0);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function simpleIndex(scores: Scores): number | null {
  const vals = Object.values(scores).filter((v) => v > 0);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function weightedIndex(
  scores: Scores,
  discipline: Discipline,
): number | null {
  const disc = getDiscipline(discipline);
  if (!disc) return simpleIndex(scores);
  let num = 0;
  let den = 0;
  for (const seg of SEGMENTS) {
    const avg = segmentAverage(scores, seg.id);
    if (avg == null) continue;
    const w = disc.weights[seg.id];
    num += avg * w;
    den += w;
  }
  if (den === 0) return null;
  return num / den;
}

export function levelOf(idx: number) {
  const n = Math.max(1, Math.min(5, Math.round(idx)));
  return LEVELS.find((l) => l.n === n)!;
}

export function priorities(scores: Scores, discipline: Discipline) {
  const disc = getDiscipline(discipline);
  const answered = ITEMS.filter((i) => (scores[i.code] || 0) > 0);
  const ranked = answered
    .map((i) => {
      const w = disc ? disc.weights[i.segment] : 1;
      const score = scores[i.code];
      return { item: i, score, w, ratio: score / w };
    })
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 3);
  return ranked.map((r) => {
    const next = Math.min(5, r.score + 1);
    const nextDesc = r.item.levels[next - 1];
    return { ...r, next, nextDesc };
  });
}

export function seniorityFeedback(
  idx: number,
  seniority: SeniorityLevel,
  answered: number,
) {
  if (answered < 10) return null;
  const faixa = SENIORITY.find((s) => s.id === seniority);
  if (!faixa) return null;
  if (idx < faixa.min) {
    return {
      status: "abaixo" as const,
      text: `MRA-IA ${fmt(idx)} está abaixo da faixa esperada de ${seniority} (${fmt(faixa.min)}–${fmt(faixa.max)}). Trate isso como mapa do seu PDI.`,
    };
  }
  if (idx > faixa.max) {
    return {
      status: "acima" as const,
      text: `MRA-IA ${fmt(idx)} está acima da faixa de ${seniority} (${fmt(faixa.min)}–${fmt(faixa.max)}). Considere assumir a multiplicação: padrões, playbooks e mentoria.`,
    };
  }
  return {
    status: "dentro" as const,
    text: `MRA-IA ${fmt(idx)} está dentro da faixa esperada de ${seniority} (${fmt(faixa.min)}–${fmt(faixa.max)}).`,
  };
}

export function fmt(n: number | null | undefined, digits = 2) {
  if (n == null || isNaN(n)) return "—";
  return n.toFixed(digits).replace(".", ",");
}

export function answeredCount(scores: Scores) {
  return Object.values(scores).filter((v) => v > 0).length;
}

// SOURCE: /lib/data.ts
// Dados estáticos da Roda de Maturidade

export type SegmentId = "S1" | "S2" | "S3" | "S4" | "S5" | "S6";

export type Segment = {
  id: SegmentId;
  code: string;
  title: string;
  short: string;
  color: string;
  bg: string;
  description: string;
};

export const SEGMENTS: Segment[] = [
  {
    id: "S1",
    code: "S1",
    title: "Fundamentos & Conexões",
    short: "Fundamentos",
    color: "#7C5CFF",
    bg: "#F2EEFF",
    description:
      "A base: sair do clique em botão para o conversacional, conectar as ferramentas do dia a dia (MCPs), navegar nas bases de dados e usar contexto com eficiência.",
  },
  {
    id: "S2",
    code: "S2",
    title: "Pensamento Crítico & Qualidade",
    short: "Pensamento Crítico",
    color: "#FE3E6D",
    bg: "#FFF0F4",
    description:
      "O raciocínio que a IA exige: revisar resultados com senso crítico, priorizar onde ela vale a pena, cuidar de ética e dados de cliente num banco, manter rigor de método.",
  },
  {
    id: "S3",
    code: "S3",
    title: "Research com IA",
    short: "Research",
    color: "#00B8A9",
    bg: "#E9FAF8",
    description:
      "A descoberta: recrutar, criar roteiros quali e quanti, configurar formulários, cruzar fontes, manter banco de transcrições e fechar o ciclo dos testes de usabilidade.",
  },
  {
    id: "S4",
    code: "S4",
    title: "Criação, Automação & Impacto",
    short: "Criação & Impacto",
    color: "#FF9F1C",
    bg: "#FFF5E6",
    description:
      "Do insight à operação: propor soluções a partir de pesquisa, explorar caminhos para públicos diferentes, automatizar tarefas, criar alertas de UX e medir impacto no comportamento.",
  },
  {
    id: "S5",
    code: "S5",
    title: "Craft & Encantamento",
    short: "Craft",
    color: "#2D9CDB",
    bg: "#EAF5FC",
    description:
      "A qualidade da execução: telas no padrão do produto, design system, estados, microinterações, acessibilidade e momentos que encantam o cliente.",
  },
  {
    id: "S6",
    code: "S6",
    title: "Medição & Evidência de Valor",
    short: "Medição",
    color: "#43A047",
    bg: "#EAF7EC",
    description:
      "Os três pilares de medição: tempo contra baseline pré-IA, qualidade dos artefatos gerados e retrabalho/retenção. Mais adoção do time e evidência para o negócio.",
  },
];

export const LEVELS = [
  {
    n: 1,
    name: "Ad hoc",
    persona: "Explorador(a)",
    desc: "Uso isolado ou inexistente. IA é curiosidade; a interação ainda acontece por botões e menus.",
  },
  {
    n: 2,
    name: "Experimentação",
    persona: "Revisor(a) passivo(a)",
    desc: "Usa IA em tarefas pontuais e trata a saída como rascunho que corrige na mão. Sem método.",
  },
  {
    n: 3,
    name: "Operacional",
    persona: "Operador(a) crítico(a)",
    desc: "IA integrada ao fluxo regular de trabalho, com revisão crítica e critério de uso.",
  },
  {
    n: 4,
    name: "Otimizado",
    persona: "Engenheiro(a) de contexto",
    desc: "Arquiteta contexto e conexões (dados, exemplos, restrições) para resultados confiáveis; cruza fontes e automatiza.",
  },
  {
    n: 5,
    name: "Transformador",
    persona: "Orquestrador(a)",
    desc: "Desenha sistemas e fluxos com IA que servem o time inteiro; a IA redefine como o design opera.",
  },
];

export type Item = {
  code: string; // "1.1"
  segment: SegmentId;
  title: string;
  description: string;
  levels: [string, string, string, string, string];
};

export const ITEMS: Item[] = [
  // S1
  {
    code: "1.1",
    segment: "S1",
    title: "Do botão ao conversacional",
    description:
      "Como você interage com as ferramentas: navegando por menus ou conduzindo o trabalho por conversa.",
    levels: [
      "Uso ferramentas só por botões e menus; IA é curiosidade ocasional.",
      "Uso o chat para perguntas pontuais (textos, resumos), sem método.",
      "O conversacional é minha interface principal para tarefas recorrentes de trabalho.",
      "Conduzo fluxos inteiros por conversa, combinando instruções, arquivos e iterações sucessivas.",
      "IA é parceira contínua de trabalho: sessões estruturadas, com padrões e rituais próprios do time.",
    ],
  },
  {
    code: "1.2",
    segment: "S1",
    title: "Conexões & MCPs",
    description:
      "Capacidade de conectar a IA às ferramentas reais do fluxo: Figma, tickets, analytics, planilhas.",
    levels: [
      "Não sei o que é MCP / nunca conectei nada.",
      "Já conectei um MCP com ajuda; uso esporádico.",
      "Uso MCPs no dia a dia para acessar Figma, tickets ou analytics pela conversa.",
      "Combino múltiplos MCPs numa mesma tarefa (ex.: analytics + tickets + Figma juntos).",
      "Proponho e configuro novas conexões para o time; MCPs fazem parte do fluxo padrão.",
    ],
  },
  {
    code: "1.3",
    segment: "S1",
    title: "Autonomia com bases de dados",
    description:
      "Quanto você consulta, visualiza e explora dados internos sem depender de analistas.",
    levels: [
      "Dependo de outras áreas para qualquer dado.",
      "Consulto dashboards prontos, com apoio da IA para interpretar.",
      "Me viro nas bases: peço à IA consultas e visualizações sobre dados internos.",
      "Cruzo fontes (base, pesquisa, tickets) via IA para responder perguntas de design.",
      "Crio análises reutilizáveis para o time; dado é insumo contínuo de decisão.",
    ],
  },
  {
    code: "1.4",
    segment: "S1",
    title: "Uso inteligente de contexto e tokens",
    description:
      "Engenharia de contexto: escolher os insumos certos (arquivos, exemplos, instruções) e gastar tokens com eficiência.",
    levels: [
      "Colo tudo no chat sem critério; o contexto estoura ou falta.",
      "Percebo quando o contexto atrapalha, mas resolvo na tentativa e erro.",
      "Seleciono e estruturo o contexto de forma econômica: só o que a tarefa precisa.",
      "Aplico técnicas de context engineering (chunking, exemplos few-shot, instruções de sistema) conscientemente.",
      "Crio padrões e playbooks de contexto para o time, otimizando qualidade e custo.",
    ],
  },
  {
    code: "1.5",
    segment: "S1",
    title: "Repertório de ferramentas",
    description:
      "Domínio do cardápio: escolher entre ferramentas simples e complexas e combiná-las conforme a tarefa.",
    levels: [
      "Uma ferramenta só, no uso mais básico.",
      "Experimento ferramentas novas, mas sem critério de escolha.",
      "Sei escolher a ferramenta certa (simples ou complexa) para cada tarefa.",
      "Combino ferramentas em fluxos (ex.: transcrição → análise → protótipo).",
      "Avalio e introduzo novas ferramentas para o time, com critério claro de valor.",
    ],
  },
  // S2
  {
    code: "2.1",
    segment: "S2",
    title: "Revisão crítica de resultados",
    description:
      "Postura diante da saída da IA: aceitar pronto, corrigir o óbvio ou desafiar o resultado.",
    levels: [
      "Aceito a saída da IA como pronta.",
      "Reviso por cima e corrijo o óbvio.",
      "Verifico fatos, fontes e vieses antes de usar; sei identificar alucinação.",
      "Uso a IA contra ela mesma: peço contra-argumentos, interpretações alternativas e teste dos meus próprios vieses.",
      "Temos critérios de qualidade definidos e compartilhados; revisão sistemática por amostragem.",
    ],
  },
  {
    code: "2.2",
    segment: "S2",
    title: "Priorização com IA",
    description:
      "Escolher os temas onde a IA gera mais valor e usar a própria IA para priorizar o trabalho.",
    levels: [
      "Uso IA no que aparece na frente, sem critério.",
      "Percebo onde a IA ajuda mais, mas não priorizo formalmente.",
      "Escolho conscientemente onde aplicar IA, pesando custo × impacto.",
      "Uso IA para priorizar o próprio trabalho: clusterizar demandas, ranquear oportunidades.",
      "A priorização do time é assistida por IA, com critérios explícitos e revisão periódica.",
    ],
  },
  {
    code: "2.3",
    segment: "S2",
    title: "Ética, privacidade e dados de cliente",
    description:
      "Uso responsável no contexto de banco: anonimização, LGPD, políticas internas e vieses que excluem perfis.",
    levels: [
      "Não penso em risco ao colar dados no chat.",
      "Sei que há riscos, mas não sigo regras claras.",
      "Sigo diretrizes: anonimizo dados de clientes e respeito LGPD e políticas internas.",
      "Avalio vieses e riscos das saídas (ex.: exclusão de perfis de cliente) antes de aplicar.",
      "Contribuo para as diretrizes de uso responsável e ajudo a monitorar o cumprimento no time.",
    ],
  },
  {
    code: "2.4",
    segment: "S2",
    title: "Rigor metodológico com IA",
    description:
      "Onde a IA entra na pesquisa sem comprometer validade, amostra e evidência primária.",
    levels: [
      "A IA substitui o método (ex.: “pesquisa” sem participante real).",
      "Uso IA em partes do método sem avaliar o efeito na validade.",
      "Sei onde a IA entra sem comprometer validade: amostra, roteiro, análise.",
      "Triangulo resultados de IA com dados primários e fontes independentes.",
      "Limitações e confiabilidade documentadas; nosso método com IA é auditável.",
    ],
  },
  {
    code: "2.5",
    segment: "S2",
    title: "Transparência e rastreabilidade",
    description:
      "Deixar claro o que foi feito com IA e permitir refazer o caminho: prompts, fontes e critérios registrados.",
    levels: [
      "Não indico o que foi feito com IA.",
      "Menciono informalmente quando usei IA.",
      "Registro prompts e fontes das análises importantes; dá para refazer o caminho.",
      "Versiono contextos e critérios; qualquer colega reproduz a análise.",
      "Rastreabilidade é padrão do time e alimenta a melhoria contínua.",
    ],
  },
  // S3
  {
    code: "3.1",
    segment: "S3",
    title: "Planejamento e recrutamento",
    description:
      "Uso de IA para desenhar plano de pesquisa, screener, critérios e recrutamento a partir da base.",
    levels: [
      "Tudo manual.",
      "IA ajuda em textos pontuais (convite, screener).",
      "Uso IA para desenhar plano, screener e critérios de recrutamento.",
      "IA cruza a base de clientes para sugerir perfis e segmentos a recrutar.",
      "Recrutamento assistido de ponta a ponta, com triagem e agendamento automatizados.",
    ],
  },
  {
    code: "3.2",
    segment: "S3",
    title: "Roteiros quali & quanti e formulários",
    description:
      "Co-criação de roteiros, questionários e formulários com IA, revisando viés de pergunta.",
    levels: [
      "Escrevo tudo do zero.",
      "IA gera rascunhos que reescrevo por completo.",
      "Co-crio roteiros e questionários com IA, revisando vieses de pergunta.",
      "IA adapta roteiros por segmento/hipótese e configura os formulários automaticamente.",
      "Biblioteca viva de roteiros do time, gerada e mantida com IA.",
    ],
  },
  {
    code: "3.3",
    segment: "S3",
    title: "Análise e cruzamento de fontes",
    description:
      "Cruzar pesquisa, tickets, analytics e base interna para achar padrões que uma fonte só não mostra.",
    levels: [
      "Análise manual, cada fonte isolada.",
      "IA resume uma fonte por vez (ex.: só a transcrição).",
      "Uso IA para analisar e cruzar 2+ fontes (pesquisa + tickets + analytics).",
      "Cruzamentos sistemáticos revelam padrões: jobs to be done, dores por segmento.",
      "Síntese contínua: novas evidências atualizam o entendimento automaticamente.",
    ],
  },
  {
    code: "3.4",
    segment: "S3",
    title: "Banco de transcrições e linguagem do cliente",
    description:
      "Transformar transcrições em ativo consultável: falas, termos e linguagem real do cliente.",
    levels: [
      "Transcrições espalhadas, sem reuso.",
      "Guardo as transcrições, mas a busca é manual.",
      "Banco organizado e consultável por IA: falas, termos, linguagem do cliente.",
      "Uso o banco para mapear jobs to be done, vocabulário e evolução de percepções.",
      "O banco alimenta UX writing, telas e novos estudos do time inteiro.",
    ],
  },
  {
    code: "3.5",
    segment: "S3",
    title: "Testes de usabilidade com IA",
    description:
      "Da transcrição da sessão aos achados estruturados, e dos achados às alterações na tela.",
    levels: [
      "Testes e análises 100% manuais.",
      "IA transcreve e resume as sessões.",
      "Da transcrição saem achados estruturados e recomendações priorizadas.",
      "Do achado à alteração: a IA propõe mudanças de tela a partir das sessões.",
      "Ciclo fechado: teste → análise → proposta → novo teste, com IA em todas as etapas.",
    ],
  },
  // S4
  {
    code: "4.1",
    segment: "S4",
    title: "Propostas de solução a partir de pesquisa",
    description:
      "Gerar propostas de fluxo e tela a partir de achados, jobs to be done e análises de interação.",
    levels: [
      "Proponho soluções sem conexão direta com dados.",
      "IA inspira (referências, ideias); a conexão com a pesquisa é informal.",
      "Gero propostas a partir de achados e jobs to be done, com o racional documentado.",
      "Propostas nascem de análises internas e externas de interação (comportamento real).",
      "Pesquisa → proposta → protótipo em fluxo contínuo assistido por IA.",
    ],
  },
  {
    code: "4.2",
    segment: "S4",
    title: "Exploração de múltiplos caminhos",
    description:
      "Usar IA para testar mais abordagens e desenhos diferentes para públicos e segmentos distintos.",
    levels: [
      "Uma solução por problema.",
      "Peço variações à IA de vez em quando.",
      "Exploro sistematicamente abordagens alternativas antes de decidir.",
      "Desenho variações para públicos/segmentos diferentes e testo mais hipóteses.",
      "Exploração ampla + teste rápido é o padrão de decisão do time.",
    ],
  },
  {
    code: "4.3",
    segment: "S4",
    title: "Automação de tarefas e alertas de UX",
    description:
      "Automatizar o que consome tempo e criar alertas a partir de sinais como tickets de uma área.",
    levels: [
      "Nenhuma automação.",
      "Automatizo tarefas pequenas, ad hoc.",
      "Automatizo tarefas repetitivas que consomem tempo (notas de sessão, relatórios).",
      "Alertas ativos: tickets/reclamações sobre uma área disparam aviso de problema de tela.",
      "Monitoramento contínuo de UX, com alertas e sugestões automáticas.",
    ],
  },
  {
    code: "4.4",
    segment: "S4",
    title: "Compartilhamento e organização de resultados",
    description:
      "Como os resultados circulam: formato padrão e repositório de insights consultável por IA.",
    levels: [
      "Resultados ficam comigo ou em arquivos soltos.",
      "Compartilho sob demanda, em formatos inconsistentes.",
      "Uso IA para organizar e publicar resultados em formato padrão e consultável.",
      "Repositório vivo de insights: qualquer pessoa consulta por IA.",
      "O conhecimento circula sozinho: resumos automáticos e onboarding de contexto por IA.",
    ],
  },
  {
    code: "4.5",
    segment: "S4",
    title: "Medição de impacto do design",
    description:
      "Ligar alterações de design a mudanças de comportamento, com leitura por segmento.",
    levels: [
      "Não meço impacto das alterações.",
      "Olho métricas depois de grandes lançamentos, manualmente.",
      "Uso IA para medir mudanças de comportamento após alterações de design.",
      "Ligo alterações a métricas e evidências de pesquisa; leio efeitos por segmento.",
      "Impacto de design monitorado continuamente, retroalimentando as prioridades.",
    ],
  },
  // S5
  {
    code: "5.1",
    segment: "S5",
    title: "Construção de telas com IA",
    description: "Gerar telas de alta fidelidade dentro do padrão visual do produto.",
    levels: [
      "Construo telas 100% manualmente.",
      "Uso IA em partes isoladas (ícones, textos, imagens de apoio).",
      "Gero primeiras versões de telas com IA e refino até o padrão do produto.",
      "Gero telas já no padrão do design system (tokens, componentes) e itero variações rapidamente.",
      "Fluxo tela → código: telas geradas com IA viram protótipos navegáveis/handoff com qualidade validada.",
    ],
  },
  {
    code: "5.2",
    segment: "S5",
    title: "Design system com IA",
    description:
      "Criar, documentar e auditar componentes com IA para manter consistência em escala.",
    levels: [
      "Não uso IA no design system.",
      "IA ajuda a documentar componentes pontualmente.",
      "Uso IA para criar variantes, documentar padrões e revisar inconsistências.",
      "Auditorias assistidas: IA varre telas e arquivos apontando desvios de padrão e valores fora do token.",
      "Design system vivo: componentes, documentação e auditoria mantidos continuamente com IA.",
    ],
  },
  {
    code: "5.3",
    segment: "S5",
    title: "Refinamento, estados e microinterações",
    description:
      "O acabamento: estados vazios, erro, loading, motion e detalhes de interação de cada fluxo.",
    levels: [
      "Entrego o caminho feliz; estados e detalhes ficam para depois.",
      "IA sugere estados e edge cases quando eu peço.",
      "Uso IA para mapear sistematicamente estados, edge cases e microcopy de cada fluxo.",
      "Prototipo microinterações e motion com IA e testo variações de acabamento.",
      "Craft como padrão: checklists de qualidade assistidos por IA em toda entrega do time.",
    ],
  },
  {
    code: "5.4",
    segment: "S5",
    title: "Acessibilidade e inclusão",
    description:
      "IA para revisar contraste, hierarquia, linguagem simples e a experiência de todos os perfis.",
    levels: [
      "Acessibilidade não entra na rotina.",
      "Verifico o básico (contraste) quando lembro.",
      "Uso IA para auditar acessibilidade (WCAG, linguagem simples) nas minhas entregas.",
      "Testo com IA cenários de perfis diversos (baixa visão, baixa literacia financeira) antes de lançar.",
      "Acessibilidade auditada continuamente com IA em todo o time; padrão inegociável.",
    ],
  },
  {
    code: "5.5",
    segment: "S5",
    title: "Encantamento do cliente",
    description:
      "Usar IA para achar momentos de encantamento, personalizar e elevar a experiência.",
    levels: [
      "Foco só no funcional.",
      "Encantamento aparece ad hoc, sem apoio de dados.",
      "Uso IA para identificar momentos da jornada com potencial de encantar (falas, dores, picos de emoção).",
      "Desenho experiências personalizadas por segmento e momento com apoio de IA, e valido o efeito.",
      "Encantamento sistemático: o time monitora percepções e projeta momentos memoráveis continuamente.",
    ],
  },
  // S6
  {
    code: "6.1",
    segment: "S6",
    title: "Tempo e velocidade (PILAR 1)",
    description:
      "Tempo até o primeiro wireframe, variações de layout e síntese de pesquisa, comparado a um baseline pré-IA.",
    levels: [
      "Não sei se a IA me faz ganhar ou perder tempo.",
      "Tenho a sensação de que acelera, mas nunca medi.",
      "Meço o tempo das tarefas onde uso IA e comparo com como era antes.",
      "Tenho baseline pré-IA registrado das tarefas-chave e acompanho a variação por ciclo.",
      "Tempo por tarefa é indicador acompanhado pelo time, com metas e revisão periódica.",
    ],
  },
  {
    code: "6.2",
    segment: "S6",
    title: "Qualidade e coerência (PILAR 2)",
    description:
      "Se os artefatos gerados por IA atendem ao design system, à clareza de linguagem e à acessibilidade.",
    levels: [
      "Avalio a qualidade “no olho”, caso a caso.",
      "Percebo problemas de padrão, mas sem critério consistente.",
      "Uso um checklist de qualidade (padrão visual, clareza, acessibilidade) nos artefatos gerados por IA.",
      "Revisão heurística estruturada e pontuada, comparando saída de IA e produção humana.",
      "Critérios de qualidade do time definidos e monitorados; resultados retroalimentam o contexto dado à IA.",
    ],
  },
  {
    code: "6.3",
    segment: "S6",
    title: "Retrabalho e retenção (PILAR 3)",
    description:
      "Com que frequência os conceitos gerados por IA são mantidos, modificados ou descartados.",
    levels: [
      "Não acompanho o que aproveito ou descarto.",
      "Sei informalmente que descarto muita coisa.",
      "Acompanho a taxa de aproveitamento: o que mantenho, ajusto ou jogo fora.",
      "Uso o padrão de descarte para diagnosticar e corrigir o contexto/instrução que gerou o problema.",
      "Retenção é indicador do time e orienta onde investir em contexto, ferramenta e treino.",
    ],
  },
  {
    code: "6.4",
    segment: "S6",
    title: "Adoção e literacia do time",
    description:
      "Quantas pessoas usam, com que confiança, em quais tarefas, e se o time sabe onde a IA não deve entrar.",
    levels: [
      "Não sabemos quem usa o quê.",
      "Sabemos informalmente que algumas pessoas usam mais.",
      "Mapeamos adoção e confiança por pessoa e por tipo de tarefa.",
      "Acompanhamos a evolução da literacia do time e agimos nos gaps (dupla, workshop, mentoria).",
      "Literacia em IA é meta de desenvolvimento do time, com acompanhamento e evidência de evolução.",
    ],
  },
  {
    code: "6.5",
    segment: "S6",
    title: "Evidência de valor para o negócio",
    description:
      "Transformar os três pilares em argumento para stakeholders: velocidade, qualidade e capacidade de entrega.",
    levels: [
      "Nunca levamos números sobre IA para fora do time.",
      "Contamos casos isolados, sem dados.",
      "Apresento ganhos com dados de tempo, qualidade e retenção.",
      "A evidência sustenta decisões: priorização, investimento em ferramenta, mudança de processo.",
      "Reporte contínuo de valor da IA no design, integrado aos indicadores da área.",
    ],
  },
];

export type Discipline =
  | "Product Designer"
  | "Content Designer"
  | "UX Researcher"
  | "Generalista / Design Ops";

export const DISCIPLINES: {
  id: Discipline;
  focus: string;
  weights: Record<SegmentId, number>;
}[] = [
  {
    id: "Product Designer",
    focus:
      "Resolve o problema de ponta a ponta: da descoberta ao craft da tela. Peso maior em criação, automação e qualidade de execução.",
    weights: { S1: 1, S2: 1, S3: 0.8, S4: 1.1, S5: 1.3, S6: 0.8 },
  },
  {
    id: "Content Designer",
    focus:
      "Linguagem é o produto. Peso maior em pensamento crítico, clareza e consistência do que a IA escreve dentro do design system.",
    weights: { S1: 1.1, S2: 1.3, S3: 0.8, S4: 1, S5: 1.1, S6: 0.7 },
  },
  {
    id: "UX Researcher",
    focus:
      "Evidência antes de solução. Peso maior em research com IA, rigor de método, ética e triangulação de fontes.",
    weights: { S1: 1, S2: 1.3, S3: 1.7, S4: 0.8, S5: 0.5, S6: 0.7 },
  },
  {
    id: "Generalista / Design Ops",
    focus:
      "Atua nas três frentes ou em operação de design. Todos os segmentos pesam igual.",
    weights: { S1: 1, S2: 1, S3: 1, S4: 1, S5: 1, S6: 1 },
  },
];

export type SeniorityLevel =
  | "Júnior"
  | "Pleno"
  | "Sênior"
  | "Lead"
  | "Staff"
  | "GM"
  | "Head";

export const SENIORITY: {
  id: SeniorityLevel;
  essence: string;
  min: number;
  max: number;
}[] = [
  {
    id: "Júnior",
    essence: "Executa o processo sob supervisão. Escopo local e bem definido.",
    min: 1.5,
    max: 2.4,
  },
  {
    id: "Pleno",
    essence:
      "Propriedade sobre o processo e o craft básico. Autonomia no escopo local.",
    min: 2.5,
    max: 3.2,
  },
  {
    id: "Sênior",
    essence:
      "Protagonista na decisão e referência de craft local. Impacto mensurável na squad.",
    min: 3.3,
    max: 3.9,
  },
  {
    id: "Lead",
    essence:
      "Líder formal de pessoas, gestor de processo e mentoria. Destrava o time.",
    min: 3.5,
    max: 4.2,
  },
  {
    id: "Staff",
    essence:
      "Mestre técnico da visão e estrategista de domínio. Resolve o que transcende times.",
    min: 4,
    max: 4.6,
  },
  {
    id: "GM",
    essence:
      "Patrocinador executivo e arquiteto da estrutura. Governança e alocação em escala.",
    min: 4,
    max: 4.8,
  },
  {
    id: "Head",
    essence:
      "Guardião da visão de design (3–5 anos) e do legado da função na companhia.",
    min: 4.2,
    max: 5,
  },
];

// Tabela de leveling por dimensão
export const LEVELING_ROWS: {
  dim: string;
  cells: Record<SeniorityLevel, string>;
}[] = [
  {
    dim: "Vetor de impacto (pilar Cora)",
    cells: {
      Júnior: "Aprende com apoio. Usa IA em tarefas simples e supervisionadas.",
      Pleno: "Autonomia no escopo local. IA integrada às próprias tarefas.",
      Sênior: "Protagonismo técnico. Referência de uso de IA na squad.",
      Lead: "Orquestra pessoas e processos com IA; mentora o time.",
      Staff: "Maestria e visão: define o como da IA em múltiplos produtos.",
      GM: "Governança e estrutura: investimento, times e escala de IA.",
      Head: "Visão de 3–5 anos do design com IA e legado da função.",
    },
  },
  {
    dim: "Escopo de atuação",
    cells: {
      Júnior: "Tarefa.",
      Pleno: "Escopo local definido.",
      Sênior: "Squad e múltiplas squads.",
      Lead: "Time, estrutura e roadmap da área.",
      Staff: "Global: problemas que transcendem times.",
      GM: "Organização e função.",
      Head: "Board e companhia.",
    },
  },
  {
    dim: "Execução e qualidade (craft) com IA",
    cells: {
      Júnior:
        "Segue os padrões da squad; revisa toda saída de IA antes de usar.",
      Pleno:
        "Aplica padrões com propriedade; usa IA no fluxo com controle de qualidade próprio.",
      Sênior:
        "Identifica gaps no design system e resolve problemas que atravessam a squad com apoio de IA.",
      Lead:
        "Destrava entregas orquestrando pessoas, processos e ferramentas de IA.",
      Staff:
        "Cria padrões, prompts e sistemas de IA que resolvem problemas em múltiplos produtos.",
      GM: "Define a estrutura de qualidade do time de design e negocia execução com outras áreas.",
      Head: "Define o padrão de excelência da função e o nível de encantamento esperado.",
    },
  },
  {
    dim: "Estratégia e impacto no negócio",
    cells: {
      Júnior: "Entende a métrica da squad; ainda não conecta IA a resultado.",
      Pleno:
        "Conecta o próprio uso de IA a uma métrica de squad e valida hipóteses pontuais.",
      Sênior:
        "Mostra correção de rota baseada em dados e impacto mensurável (tempo, qualidade, retenção).",
      Lead: "Aloca pessoas e esforço de IA onde há mais alavancagem; destrava resultado.",
      Staff:
        "Define novas métricas de sucesso e propõe mudança de direção em um domínio.",
      GM: "Gere investimento e visão executiva de IA ao longo do ano em múltiplos times.",
      Head: "Traduz IA em vantagem competitiva de longo prazo para a companhia.",
    },
  },
  {
    dim: "Liderança e influência",
    cells: {
      Júnior: "Comunica o que fez com IA e pede ajuda cedo.",
      Pleno: "Comunica com clareza e resolve conflitos internos da squad.",
      Sênior: "Influencia parceiros multidisciplinares; mentora pontualmente em IA.",
      Lead: "Desenvolve e mentora pessoas; cuida do crescimento formal em IA.",
      Staff:
        "Resolve fricções crônicas entre áreas e formaliza modelos de colaboração com IA.",
      GM: "Faz desenho organizacional e lidera outros líderes.",
      Head: "Patrocínio C-level da agenda de IA em design.",
    },
  },
  {
    dim: "Visão sistêmica",
    cells: {
      Júnior: "Foca na própria entrega.",
      Pleno: "Busca eficiência pessoal com IA.",
      Sênior: "Lidera uma iniciativa de IA que melhora o processo do time de design.",
      Lead: "Otimiza operação, plano de carreira e roadmap com IA.",
      Staff:
        "Implementa mudança de escala que impacta vários times; dono do problema sistêmico.",
      GM: "Define a estrutura e a sucessão da organização de design.",
      Head: "Define o legado e o modelo operacional da função.",
    },
  },
  {
    dim: "Desenvolvimento e abertura",
    cells: {
      Júnior: "Transforma feedback em ação simples e visível.",
      Pleno: "Transforma feedback em prática recorrente.",
      Sênior: "Transforma um gap em força e vira ponto focal do tema no time.",
      Lead: "Cria espaço e ritual para o time evoluir em IA.",
      Staff: "Multiplica aprendizado em escala (playbooks, guildas, formações).",
      GM: "Institucionaliza o desenvolvimento de IA na organização.",
      Head: "Sustenta a cultura de aprendizado da função no longo prazo.",
    },
  },
  {
    dim: "S1 · Fundamentos & Conexões",
    cells: {
      Júnior: "Usa o conversacional em tarefas simples com apoio.",
      Pleno: "Domina o conversacional nas tarefas recorrentes; usa MCPs já configurados.",
      Sênior: "Combina MCPs; consulta bases com autonomia; usa contexto com eficiência.",
      Lead: "Garante acesso a ferramentas, MCPs e bases para o time.",
      Staff: "Propõe e configura novas conexões e playbooks de contexto.",
      GM: "Negocia investimento em ferramentas com base em valor demonstrado.",
      Head: "Define a arquitetura de ferramentas de IA do design na companhia.",
    },
  },
  {
    dim: "S2 · Pensamento Crítico & Qualidade",
    cells: {
      Júnior: "Confere as saídas antes de usar; conhece as regras de privacidade.",
      Pleno: "Revisa criticamente; sinaliza alucinação e viés; segue as diretrizes.",
      Sênior:
        "Prioriza onde IA vale a pena; triangula com dado primário; assume rastreabilidade.",
      Lead: "Define critérios de revisão do time e cobra o uso responsável.",
      Staff: "Cria as diretrizes de qualidade e uso responsável em escala.",
      GM: "Estabelece a governança de ética, privacidade e qualidade num contexto de banco.",
      Head: "Responde pela postura da companhia sobre IA em design.",
    },
  },
  {
    dim: "S3 · Research com IA",
    cells: {
      Júnior: "Ajuda em transcrição e organização de material.",
      Pleno: "Co-cria roteiros e formulários; analisa uma fonte com qualidade.",
      Sênior: "Cruza pesquisa, tickets e analytics; fecha o ciclo achado → proposta.",
      Lead: "Garante que a pesquisa assistida alimente as decisões do time.",
      Staff:
        "Desenha sistemas de descoberta: banco de transcrições vivo e síntese contínua.",
      GM: "Conecta evidência a decisão de investimento.",
      Head: "Define como a companhia aprende com o cliente usando IA.",
    },
  },
  {
    dim: "S4 · Criação, Automação & Impacto",
    cells: {
      Júnior: "Gera variações a partir de um briefing claro.",
      Pleno: "Gera propostas a partir de achados; automatiza tarefas pequenas do próprio fluxo.",
      Sênior: "Prototipa a partir de comportamento real; mede impacto das próprias entregas.",
      Lead: "Prioriza as automações de maior alavancagem para o time.",
      Staff: "Constrói alertas de UX e monitoramento contínuo entre produtos.",
      GM: "Usa impacto medido para defender design no negócio.",
      Head: "Define a agenda de automação da função.",
    },
  },
  {
    dim: "S5 · Craft & Encantamento",
    cells: {
      Júnior: "Entrega telas ou textos no padrão, com revisão do par.",
      Pleno:
        "Entrega no padrão do produto com IA acelerando; cobre estados e acessibilidade básica.",
      Sênior: "Audita consistência e acessibilidade; craft é referência para os pares.",
      Lead: "Garante tempo e ferramenta para craft acontecer.",
      Staff: "Constrói o design system vivo com IA e as auditorias contínuas.",
      GM: "Define o padrão de qualidade e encantamento da organização.",
      Head: "Responde pelo nível de craft percebido pelo cliente.",
    },
  },
  {
    dim: "S6 · Medição & Evidência de Valor",
    cells: {
      Júnior: "Percebe onde a IA acelera e onde atrapalha.",
      Pleno: "Relata o que descarta e por quê.",
      Sênior: "Mede tempo, qualidade e retenção contra um baseline e ajusta o fluxo.",
      Lead: "Acompanha os três pilares como indicador do time.",
      Staff: "Instrumenta a medição em escala e transforma número em processo.",
      GM: "Leva a evidência de valor de IA para o negócio.",
      Head: "Define a régua de valor de IA no design da companhia.",
    },
  },
];

// Duplo diamante
export const PHASES = [
  { id: "Entender", alt: "Descobrir" },
  { id: "Observar", alt: "Definir" },
  { id: "Desenvolver", alt: "Desenvolver" },
  { id: "Testar", alt: "Entregar" },
] as const;

export const USE_TYPES = [
  { id: "Assistido", color: "#8D99AE" },
  { id: "Copiloto", color: "#FE3E6D" },
  { id: "First", color: "#7A1030" },
  { id: "Entendimento", color: "#4C6FFF" },
  { id: "Operacional", color: "#6B7085" },
  { id: "Ideação", color: "#7C5CFF" },
  { id: "Alinhamento", color: "#FF9F1C" },
  { id: "Documentação", color: "#2D9CDB" },
  { id: "Análise", color: "#00B8A9" },
  { id: "Resultado", color: "#FE3E6D" },
];

export const SEED_DIAMOND: Array<{
  phase: string;
  type: string;
  what: string;
  tool?: string;
  tool2?: string;
  notes?: string;
}> = [
  {
    phase: "Entender",
    type: "Entendimento",
    what: "Pesquisona de cartão · leitura cruzada de tickets",
    tool: "ChatGPT",
    tool2: "Zendesk MCP",
    notes:
      "Cruzamento de 1.200 tickets com transcrições para mapear dores recorrentes antes do campo.",
  },
  {
    phase: "Entender",
    type: "Análise",
    what: "Síntese de benchmarks de fatura em bancos BR",
    tool: "Perplexity",
    notes: "Comparativo de UX de fatura em 8 bancos; usado como insumo para hipóteses.",
  },
  {
    phase: "Entender",
    type: "Operacional",
    what: "Recrutamento assistido por segmento",
    tool: "Base interna",
    tool2: "ChatGPT",
    notes: "Perfis cruzados com uso real do cartão; agendamento semi-automático.",
  },
  {
    phase: "Observar",
    type: "Ideação",
    what: "Co-criação do roteiro quali",
    tool: "Claude",
    notes: "Roteiro co-criado com revisão de viés de pergunta por segmento.",
  },
  {
    phase: "Observar",
    type: "Análise",
    what: "Transcrição e tagging de 18 sessões",
    tool: "Dovetail",
    tool2: "ChatGPT",
    notes: "Transcrição automática + categorização por job to be done.",
  },
  {
    phase: "Observar",
    type: "Documentação",
    what: "Mapa de jobs to be done · Vira Fatura",
    tool: "Figjam",
    tool2: "ChatGPT",
  },
  {
    phase: "Desenvolver",
    type: "Ideação",
    what: "Exploração de 4 fluxos para converter em fatura",
    tool: "Figma",
    tool2: "ChatGPT",
    notes:
      "Fluxos alternativos por perfil (novo cliente, cliente recorrente, baixa literacia financeira).",
  },
  {
    phase: "Desenvolver",
    type: "Copiloto",
    what: "Microcopy e estados gerados no padrão do DS",
    tool: "Claude",
    tool2: "Cora DS",
  },
  {
    phase: "Desenvolver",
    type: "Alinhamento",
    what: "Alinhamento com Risco e Jurídico sobre linguagem",
    tool: "Loop",
    notes: "Resumo da conversa compartilhado em áudio/texto estruturado.",
  },
  {
    phase: "Testar",
    type: "Operacional",
    what: "Protótipo navegável a partir das telas",
    tool: "Figma Make",
    notes: "Protótipo de alta fidelidade gerado em 2 dias para teste moderado.",
  },
  {
    phase: "Testar",
    type: "Análise",
    what: "Análise do teste de usabilidade (12 sessões)",
    tool: "Dovetail",
    tool2: "ChatGPT",
    notes: "Achados estruturados + recomendações priorizadas por severidade.",
  },
  {
    phase: "Testar",
    type: "Resultado",
    what: "Relatório final e recomendações para o squad",
    tool: "Notion",
    tool2: "ChatGPT",
  },
];

export function segmentOf(code: string): SegmentId {
  return ("S" + code.split(".")[0]) as SegmentId;
}

export function getItem(code: string) {
  return ITEMS.find((i) => i.code === code);
}

export function getSegment(id: SegmentId) {
  return SEGMENTS.find((s) => s.id === id)!;
}

export function getDiscipline(id: string) {
  return DISCIPLINES.find((d) => d.id === id);
}

// SOURCE: /lib/hierarchy.ts
// Hierarquia gestor → geridos.
// Casamento por substring (case-insensitive). O e-mail do gestor pode conter
// "ferre" (ex.: joao.ferreira@cora.com.br); os geridos são identificados pelo
// person_name que a pessoa digita ao preencher a roda (ex.: "Bruna Alves" bate
// com "bruna").
//
// Regra especial: se "all" aparecer na lista de geridos, o gestor vê todo
// mundo que respondeu.

export type ManagerRule = {
  managerMatch: string; // substring no e-mail
  manages: string[]; // substrings no person_name, ou ["all"]
  label: string; // como aparece no cabeçalho da aba
};

export const MANAGER_RULES: ManagerRule[] = [
  {
    managerMatch: "leticia",
    manages: ["all"],
    label: "Toda a área",
  },
  {
    managerMatch: "ferre",
    manages: ["bruna", "felipe castro", "fernanda", "thaise"],
    label: "Seu time",
  },
  {
    managerMatch: "aura",
    manages: ["julia"],
    label: "Seu time",
  },
  {
    managerMatch: "portella",
    manages: ["paulino", "rafael"],
    label: "Seu time",
  },
];

export function findManagerRule(email: string | null): ManagerRule | null {
  if (!email) return null;
  const e = email.toLowerCase();
  // "leticia" ganha prioridade (vê todo mundo) mesmo se bater outra regra
  const all = MANAGER_RULES.find(
    (r) => r.manages.includes("all") && e.includes(r.managerMatch),
  );
  if (all) return all;
  return MANAGER_RULES.find((r) => e.includes(r.managerMatch)) ?? null;
}

// Decide se um person_name pertence aos geridos da regra
export function isManagedBy(personName: string, rule: ManagerRule): boolean {
  if (rule.manages.includes("all")) return true;
  const n = personName.toLowerCase();
  return rule.manages.some((frag) => n.includes(frag.toLowerCase()));
}
