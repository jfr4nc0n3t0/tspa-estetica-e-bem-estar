import { firstName, fmt } from "./format";

/** Link wa.me. Aceita números com ou sem 55, com ou sem máscara. */
export function waLink(phoneNumber: string | null | undefined, message: string) {
  const digits = (phoneNumber ?? "").replace(/\D/g, "");
  const full = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
}

export function confirmationMessage(clientName: string, serviceName: string, startsAt: string) {
  const day = fmt(startsAt, "EEEE, dd/MM");
  const hour = fmt(startsAt, "HH:mm");
  return (
    `Olá, ${firstName(clientName)}! Tudo bem? Aqui é do TSpa 🌿\n\n` +
    `Passando para confirmar o seu momento de cuidado:\n` +
    `• ${serviceName}\n• ${day} às ${hour}\n\n` +
    `Podemos confirmar? Se precisar remarcar, é só me avisar por aqui.`
  );
}

export function leadMessage(name: string, interest: string | null) {
  const about = interest ? ` em ${interest}` : "";
  return (
    `Olá, ${firstName(name)}! Aqui é do TSpa 🌿 ` +
    `Recebemos o seu interesse${about}. Posso te ajudar a encontrar um horário para você desacelerar?`
  );
}

export function clientMessage(name: string) {
  return `Olá, ${firstName(name)}! Aqui é do TSpa 🌿`;
}

export function birthdayMessage(name: string) {
  return (
    `Feliz aniversário, ${firstName(name)}! 🌿\n\n` +
    `Hoje o dia é todo seu. Desejamos um novo ciclo leve, com mais pausas, descanso e cuidado com você.\n\n` +
    `Com carinho, TSpa.`
  );
}

/** Aniversário neste mês, mas não hoje: "está chegando" ou "foi dia..." */
export function birthdayMonthMessage(name: string, birthday: string) {
  const day = Number(birthday.slice(8, 10));
  const date = `${String(day).padStart(2, "0")}/${birthday.slice(5, 7)}`;
  const upcoming = day > new Date().getDate();
  return upcoming
    ? `Olá, ${firstName(name)}! Aqui é do TSpa 🌿\n\nVimos que o seu aniversário está chegando (${date}) e queremos comemorar com você. Que tal reservar um momento de cuidado só seu?`
    : `Olá, ${firstName(name)}! Aqui é do TSpa 🌿\n\nO seu aniversário foi dia ${date} e não podíamos deixar passar: feliz aniversário! Que tal comemorar com um momento de cuidado só seu?`;
}
