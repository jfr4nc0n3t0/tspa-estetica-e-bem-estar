import { firstName, fmt } from "./format";
import { message } from "./messages";

/** Link wa.me. Aceita números com ou sem 55, com ou sem máscara. */
export function waLink(phoneNumber: string | null | undefined, message: string) {
  const digits = (phoneNumber ?? "").replace(/\D/g, "");
  const full = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
}

export function confirmationMessage(clientName: string, serviceName: string, startsAt: string) {
  return message("agenda_confirmacao", {
    nome: firstName(clientName),
    servico: serviceName,
    dia: fmt(startsAt, "EEEE, dd/MM"),
    hora: fmt(startsAt, "HH:mm"),
  });
}

/** Depois do atendimento: "Como você se sentiu?" */
export function afterVisitMessage(clientName: string, serviceName: string) {
  return message("agenda_pos_atendimento", { nome: firstName(clientName), servico: serviceName });
}

/** Lead novo recebe o primeiro contato; quem já está em contato recebe o texto de retomar a conversa. */
export function leadMessage(name: string, interest: string | null, followUp = false) {
  return message(followUp ? "lead_retomar" : "lead_primeiro_contato", { nome: firstName(name), interesse: interest });
}

export function clientMessage(name: string) {
  return message("cliente_conversa", { nome: firstName(name) });
}

export function birthdayMessage(name: string) {
  return message("cliente_aniversario", { nome: firstName(name) });
}

/** Aniversário neste mês, mas não hoje: "está chegando" ou "foi dia..." */
export function birthdayMonthMessage(name: string, birthday: string) {
  const day = Number(birthday.slice(8, 10));
  const date = `${String(day).padStart(2, "0")}/${birthday.slice(5, 7)}`;
  const upcoming = day > new Date().getDate();
  return message(upcoming ? "cliente_aniversario_chegando" : "cliente_aniversario_passou", { nome: firstName(name), data: date });
}
