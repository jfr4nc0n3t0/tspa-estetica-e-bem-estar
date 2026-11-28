/**
 * Mensagens editáveis (Mais → Mensagens). O texto original fica aqui; o banco (message_templates)
 * guarda só o que a dona mudou. As mensagens "site_…" são lidas pelo site, que tem uma cópia
 * dos mesmos textos originais em client/src/lib/messages.ts: mudou um original aqui, mude lá também.
 *
 * No texto: {nome}, {servico}… viram os dados reais. Um trecho entre colchetes some quando
 * alguma informação dentro dele está vazia: "Recebemos o seu interesse[ em {interesse}]."
 */

export type MessageGroup = "Leads" | "Agenda" | "Clientes" | "Site";

export type MessageVar = { name: string; label: string; sample: string };

export type MessageDef = {
  key: string;
  group: MessageGroup;
  title: string;
  /** Onde a mensagem aparece */
  where: string;
  body: string;
  vars: MessageVar[];
};

const NOME: MessageVar = { name: "nome", label: "nome", sample: "Ana" };
const SERVICO: MessageVar = { name: "servico", label: "serviço", sample: "Head Spa Ritual" };
const DIA: MessageVar = { name: "dia", label: "dia", sample: "sexta-feira, 05/12" };
const HORA: MessageVar = { name: "hora", label: "hora", sample: "15:00" };
const INTERESSE: MessageVar = { name: "interesse", label: "interesse", sample: "Head Spa Imersão" };
const DATA: MessageVar = { name: "data", label: "data do aniversário", sample: "12/12" };

export const MESSAGES: MessageDef[] = [
  {
    key: "lead_primeiro_contato",
    group: "Leads",
    title: "Primeiro contato",
    where: "Botão de WhatsApp de um lead em “Novos”",
    body: "Olá, {nome}! Aqui é do TSpa 🌿 Recebemos o seu interesse[ em {interesse}]. Posso te ajudar a encontrar um horário para você desacelerar?",
    vars: [NOME, INTERESSE],
  },
  {
    key: "lead_retomar",
    group: "Leads",
    title: "Retomar conversa",
    where: "Botão de WhatsApp de um lead que já está “Em contato”",
    body: "Oi, {nome}! Aqui é do TSpa 🌿 Passando para saber se você ainda quer reservar o seu momento de cuidado[ ({interesse})]. Se quiser, te mando os horários livres desta semana.",
    vars: [NOME, INTERESSE],
  },
  {
    key: "agenda_confirmacao",
    group: "Agenda",
    title: "Confirmação de horário",
    where: "Botão “Confirmar” no agendamento",
    body: "Olá, {nome}! Tudo bem? Aqui é do TSpa 🌿\n\nPassando para confirmar o seu momento de cuidado:\n• {servico}\n• {dia} às {hora}\n\nPodemos confirmar? Se precisar remarcar, é só me avisar por aqui.",
    vars: [NOME, SERVICO, DIA, HORA],
  },
  {
    key: "agenda_pos_atendimento",
    group: "Agenda",
    title: "Depois do atendimento",
    where: "Botão “Como foi?” no agendamento concluído",
    body: "Olá, {nome}! Aqui é do TSpa 🌿\n\nObrigada por ter vindo. Como você se sentiu depois do {servico}? Se quiser, conta pra gente, adoramos saber.\n\nAté a próxima pausa!",
    vars: [NOME, SERVICO],
  },
  {
    key: "cliente_conversa",
    group: "Clientes",
    title: "Conversa avulsa",
    where: "Botão de WhatsApp na ficha da cliente",
    body: "Olá, {nome}! Aqui é do TSpa 🌿",
    vars: [NOME],
  },
  {
    key: "cliente_aniversario",
    group: "Clientes",
    title: "Aniversário (no dia)",
    where: "Destaque de aniversário na lista de clientes, no dia",
    body: "Feliz aniversário, {nome}! 🌿\n\nHoje o dia é todo seu. Desejamos um novo ciclo leve, com mais pausas, descanso e cuidado com você.\n\nCom carinho, TSpa.",
    vars: [NOME],
  },
  {
    key: "cliente_aniversario_chegando",
    group: "Clientes",
    title: "Aniversário chegando",
    where: "Destaque de aniversário, antes do dia",
    body: "Olá, {nome}! Aqui é do TSpa 🌿\n\nVimos que o seu aniversário está chegando ({data}) e queremos comemorar com você. Que tal reservar um momento de cuidado só seu?",
    vars: [NOME, DATA],
  },
  {
    key: "cliente_aniversario_passou",
    group: "Clientes",
    title: "Aniversário que já passou",
    where: "Destaque de aniversário, depois do dia (no mesmo mês)",
    body: "Olá, {nome}! Aqui é do TSpa 🌿\n\nO seu aniversário foi dia {data} e não podíamos deixar passar: feliz aniversário! Que tal comemorar com um momento de cuidado só seu?",
    vars: [NOME, DATA],
  },
  {
    key: "cliente_saudade",
    group: "Clientes",
    title: "Sentimos sua falta",
    where: "Análises → Vale uma mensagem (cliente que não vem há mais de 60 dias)",
    body: "Olá, {nome}! Aqui é do TSpa 🌿\n\nSentimos sua falta por aqui. Que tal reservar um momento de cuidado nesta semana? Se quiser, te mando os horários livres.",
    vars: [NOME],
  },
  {
    key: "cliente_pacote_vencendo",
    group: "Clientes",
    title: "Pacote perto de vencer",
    where: "Análises → Pacotes que vencem nos próximos 30 dias",
    body: "Olá, {nome}! Aqui é do TSpa 🌿\n\nPassando para lembrar que o seu pacote de {servico} ainda tem {sessoes} e vale até {data}. Vamos agendar?",
    vars: [NOME, SERVICO, { name: "sessoes", label: "sessões restantes", sample: "2 sessões" }, { name: "data", label: "validade", sample: "15/12" }],
  },
  {
    key: "site_whatsapp",
    group: "Site",
    title: "Botão de WhatsApp",
    where: "O que a visitante manda ao tocar em WhatsApp no site",
    body: "Olá! Vim pelo site do TSpa e gostaria de agendar um momento.",
    vars: [],
  },
  {
    key: "site_vale_presente",
    group: "Site",
    title: "Pedido de vale-presente",
    where: "O que a visitante manda ao tocar em “Presentear”",
    body: "Olá! Vim pelo site do TSpa e gostaria de um vale-presente de {valor} ({cuidado}).",
    vars: [
      { name: "valor", label: "valor", sample: "R$ 270" },
      { name: "cuidado", label: "cuidado", sample: "Ritual Conexão" },
    ],
  },
  {
    key: "site_vale_presente_livre",
    group: "Site",
    title: "Montar um presente",
    where: "O que a visitante manda ao tocar em “Montar um presente” (qualquer cuidado ou valor)",
    body: "Olá! Vim pelo site do TSpa e gostaria de dar um vale-presente.",
    vars: [],
  },
  {
    key: "site_formulario_enviado",
    group: "Site",
    title: "Depois do formulário",
    where: "Botão de WhatsApp que aparece depois de enviar o formulário de interesse",
    body: "Olá! Acabei de deixar meu contato no site do TSpa[ e tenho interesse em {interesse}].",
    vars: [INTERESSE],
  },
];

export const MESSAGE_GROUPS: MessageGroup[] = ["Leads", "Agenda", "Clientes", "Site"];

const byKey = new Map(MESSAGES.map((m) => [m.key, m]));

/** Textos mudados pela dona, carregados pelo painel ao abrir (chave → texto). */
let overrides: Record<string, string> = {};

export function setMessageOverrides(next: Record<string, string>) {
  overrides = next;
}

export function getMessageOverrides() {
  return overrides;
}

/** Troca {variáveis} pelos valores. Trechos [entre colchetes] somem se alguma variável dentro deles estiver vazia. */
export function fillTemplate(body: string, vars: Record<string, string | null | undefined>) {
  const value = (name: string) => (vars[name] ?? "").toString().trim();
  const withoutEmpty = body.replace(/\[([^[\]]*)\]/g, (_, inner: string) => {
    const names = Array.from(inner.matchAll(/\{(\w+)\}/g), (m) => m[1]);
    return names.some((n) => !value(n)) ? "" : inner;
  });
  return withoutEmpty.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? value(name) : match));
}

/** Texto atual (mudado ou original) de uma mensagem. */
export function templateOf(key: string) {
  return overrides[key] ?? byKey.get(key)?.body ?? "";
}

/** Mensagem pronta para enviar. */
export function message(key: string, vars: Record<string, string | null | undefined>) {
  return fillTemplate(templateOf(key), vars);
}

/** Exemplo preenchido, para a prévia na tela de edição. */
export function sampleOf(def: MessageDef, body: string) {
  return fillTemplate(body, Object.fromEntries(def.vars.map((v) => [v.name, v.sample])));
}
