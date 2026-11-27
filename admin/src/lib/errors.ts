/** Transforma erros do Supabase/rede em mensagens claras em português. */
export function friendlyError(err: unknown): string {
  const e = (err ?? {}) as { code?: string; message?: string; details?: string };
  const msg = e.message ?? String(err);

  if (e.code === "23P01" || msg.includes("exclusion constraint")) {
    if (msg.includes("room_overlap")) return "Essa sala já tem um atendimento nesse horário.";
    if (msg.includes("professional_overlap")) return "Essa profissional já tem um atendimento nesse horário.";
    return "Esse horário entra em conflito com outro atendimento.";
  }
  if (e.code === "P0001") return msg;
  if (e.code === "23505" && msg.includes("clients_phone_unique")) return "Já existe uma cliente com esse WhatsApp.";
  if (e.code === "23505" && msg.includes("clients_name_unique")) return "Já existe uma cliente com esse nome. Se for outra pessoa, inclua o sobrenome.";
  if (e.code === "23503") return "Este registro está ligado a outros dados e não pode ser removido.";
  if (msg.includes("professional_required")) return "Escolha a profissional deste atendimento.";
  if (e.code === "23514") return "Algum campo está com valor inválido. Confira e tente de novo.";
  if (e.code === "42501" || msg.includes("row-level security")) {
    return "Sem permissão. Confira se o seu e-mail está cadastrado como dona no Supabase.";
  }
  if (msg === "Invalid login credentials") return "E-mail ou senha incorretos.";
  if (msg.includes("Email not confirmed")) return "E-mail ainda não confirmado no Supabase.";
  if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
    return "Sem conexão com o servidor. Confira a internet e tente de novo.";
  }
  return msg || "Algo deu errado. Tente de novo.";
}
