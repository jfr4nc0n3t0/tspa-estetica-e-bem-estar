import { useEffect, useState } from "react";
import { nameKey, phoneKey } from "./format";
import { supabase } from "./supabase";

export type DuplicateMatch = { id: string; name: string; whatsapp: string | null; by: "whatsapp" | "nome" };

/**
 * Procura, enquanto a pessoa digita, outra cliente com o mesmo WhatsApp ou o mesmo nome.
 * O banco também bloqueia; isto só avisa antes de salvar.
 */
export function useClientDuplicate(name: string, whatsapp: string, excludeId: string | null, enabled = true) {
  const [match, setMatch] = useState<DuplicateMatch | null>(null);

  useEffect(() => {
    const phone = phoneKey(whatsapp);
    const nk = nameKey(name);
    const checkPhone = phone.length >= 10;
    const checkName = nk.length >= 2 && !/["\\]/.test(nk);
    if (!enabled || (!checkPhone && !checkName)) {
      setMatch(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      const filters: string[] = [];
      if (checkPhone) filters.push(`whatsapp.ilike.*${phone.slice(-8)}*`);
      if (checkName) filters.push(`name_key.eq."${nk}"`);
      let query = supabase.from("client_list").select("id, name, whatsapp, name_key").or(filters.join(",")).limit(10);
      if (excludeId) query = query.neq("id", excludeId);
      const { data } = await query;
      if (cancelled) return;
      const list = (data ?? []) as { id: string; name: string; whatsapp: string | null; name_key: string }[];
      const byPhone = checkPhone ? list.find((c) => c.whatsapp && phoneKey(c.whatsapp) === phone) : undefined;
      const byName = checkName ? list.find((c) => c.name_key === nk) : undefined;
      const found = byPhone ?? byName;
      setMatch(found ? { id: found.id, name: found.name, whatsapp: found.whatsapp, by: byPhone ? "whatsapp" : "nome" } : null);
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [name, whatsapp, excludeId, enabled]);

  return match;
}
