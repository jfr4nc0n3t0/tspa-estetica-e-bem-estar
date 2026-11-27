import { useEffect, useState } from "react";
import { Bell, BellOff, Send } from "lucide-react";
import { useToast } from "../components/Toast";
import { Button, Card, Field, Select, cx } from "../components/ui";
import { useAppData } from "../lib/appData";
import { friendlyError } from "../lib/errors";
import { minutesToTime } from "../lib/format";
import { disablePush, enablePush, getPushState, sendTestPush, type PushState } from "../lib/push";
import { run, supabase } from "../lib/supabase";

const SUMMARY_TIMES = Array.from({ length: 13 }, (_, i) => minutesToTime(6 * 60 + i * 30)); // 06:00 … 12:00
const BEFORE_OPTIONS = [15, 30, 60, 120];

const STATE_TEXT: Record<PushState, string> = {
  on: "Ativadas neste aparelho.",
  off: "Desativadas neste aparelho.",
  denied: "Bloqueadas nas configurações do celular ou do navegador. Libere as notificações do painel por lá e volte aqui.",
  "ios-install": "No iPhone, instale o painel primeiro: no Safari, toque em Compartilhar → Adicionar à Tela de Início, e abra o painel pelo ícone.",
  unsupported: "Este navegador não recebe notificações. No celular, use o painel instalado na tela de início.",
  "not-configured": "As notificações ainda não foram configuradas no servidor (veja admin/NOTIFICACOES.md).",
};

/** Mais → Notificações: ativar neste aparelho, horário do resumo e antecedência do lembrete. */
export function NotificationsSettings() {
  const { settings, refreshSettings } = useAppData();
  const toast = useToast();
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState<"toggle" | "test" | null>(null);

  useEffect(() => {
    getPushState().then(setState, () => setState("unsupported"));
  }, []);

  async function toggle() {
    setBusy("toggle");
    try {
      if (state === "on") {
        await disablePush();
        toast("Notificações desativadas neste aparelho.");
      } else {
        await enablePush();
        toast("Notificações ativadas.");
      }
    } catch (err) {
      toast(err instanceof Error && !("code" in err) ? err.message : friendlyError(err), "error");
    } finally {
      setState(await getPushState().catch(() => "unsupported" as const));
      setBusy(null);
    }
  }

  async function test() {
    setBusy("test");
    try {
      await sendTestPush();
      toast("Teste enviado. Deve chegar em alguns segundos.");
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), "error");
    } finally {
      setBusy(null);
    }
  }

  async function save(patch: { notify_daily_time?: string; notify_before_min?: number }, message: string) {
    try {
      await run(supabase.from("settings").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", 1));
      await refreshSettings();
      toast(message);
    } catch (err) {
      toast(friendlyError(err), "error");
    }
  }

  const canToggle = state === "on" || state === "off";

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span
          className={cx(
            "grid h-10 w-10 shrink-0 place-items-center rounded-full",
            state === "on" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
          aria-hidden="true"
        >
          {state === "on" ? <Bell className="h-[18px] w-[18px]" /> : <BellOff className="h-[18px] w-[18px]" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Avisos dos atendimentos</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{state ? STATE_TEXT[state] : "Verificando…"}</p>
        </div>
      </div>

      {canToggle && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant={state === "on" ? "secondary" : "primary"} onClick={toggle} loading={busy === "toggle"}>
            {state === "on" ? "Desativar neste aparelho" : "Ativar neste aparelho"}
          </Button>
          {state === "on" && (
            <Button size="sm" variant="ghost" onClick={test} loading={busy === "test"}>
              <Send className="h-4 w-4" /> Enviar teste
            </Button>
          )}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/70 pt-4">
        <Field label="Resumo do dia às">
          <Select
            value={settings.notify_daily_time.slice(0, 5)}
            onChange={(e) => save({ notify_daily_time: e.target.value }, `Resumo do dia às ${e.target.value}.`)}
          >
            {SUMMARY_TIMES.map((t) => <option key={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Lembrete antes">
          <Select
            value={settings.notify_before_min}
            onChange={(e) => save({ notify_before_min: Number(e.target.value) }, "Lembrete atualizado.")}
          >
            {BEFORE_OPTIONS.map((m) => (
              <option key={m} value={m}>{m < 60 ? `${m} minutos` : m === 60 ? "1 hora" : `${m / 60} horas`}</option>
            ))}
          </Select>
        </Field>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        O aviso mostra o horário, o primeiro nome da cliente e o serviço. Vale para todos os aparelhos ativados.
      </p>
    </Card>
  );
}
