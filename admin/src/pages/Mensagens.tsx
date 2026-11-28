import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Sheet } from "../components/Sheet";
import { useConfirm } from "../components/Confirm";
import { useToast } from "../components/Toast";
import { Badge, Button, Card, PageHeader, SectionTitle, Spinner, Textarea } from "../components/ui";
import { useAppData } from "../lib/appData";
import { friendlyError } from "../lib/errors";
import { getMessageOverrides, MESSAGE_GROUPS, MESSAGES, sampleOf, templateOf, type MessageDef } from "../lib/messages";
import { run, supabase } from "../lib/supabase";

const GROUP_HINT: Record<string, string> = {
  Leads: "Abertas pelo botão de WhatsApp no quadro de leads.",
  Agenda: "Abertas pelo botão de WhatsApp dentro do agendamento.",
  Clientes: "Abertas na lista e na ficha das clientes.",
  Site: "O que a visitante manda para o TSpa ao tocar nos botões de WhatsApp do site. Mudanças aparecem no site em alguns minutos.",
};

/** Mais → Mensagens: os textos que o painel e o site preparam no WhatsApp. */
export default function Mensagens() {
  const { refreshMessages } = useAppData();
  const [ready, setReady] = useState<boolean | null>(null);
  const [editing, setEditing] = useState<MessageDef | null>(null);
  const [, setVersion] = useState(0);

  useEffect(() => {
    refreshMessages().then(setReady, () => setReady(false));
  }, [refreshMessages]);

  const overrides = getMessageOverrides();

  return (
    <div>
      <Link href="/mais" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Mais
      </Link>
      <PageHeader title="Mensagens" subtitle="Os textos que o painel e o site preparam no WhatsApp" />

      {ready === null && <Spinner />}
      {ready === false && (
        <p className="rounded-xl bg-ochre/10 px-4 py-3 text-sm">
          Para editar os textos, rode antes o arquivo <strong>admin/supabase/mensagens.sql</strong> no SQL Editor do Supabase.
          Até lá, o painel continua usando os textos originais.
        </p>
      )}

      {ready &&
        MESSAGE_GROUPS.map((group) => (
          <section key={group}>
            <SectionTitle>{group}</SectionTitle>
            <p className="-mt-1.5 mb-2.5 px-1 text-xs text-muted-foreground">{GROUP_HINT[group]}</p>
            <Card className="divide-y divide-border/70">
              {MESSAGES.filter((m) => m.group === group).map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setEditing(m)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {m.title}
                      {overrides[m.key] !== undefined && <Badge className="bg-ochre/15 text-ochre">editado</Badge>}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">{sampleOf(m, templateOf(m.key)).replace(/\n+/g, " ")}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                </button>
              ))}
            </Card>
          </section>
        ))}

      <MessageSheet
        def={editing}
        onClose={() => setEditing(null)}
        onSaved={async () => {
          await refreshMessages();
          setVersion((v) => v + 1);
        }}
      />
    </div>
  );
}

function MessageSheet({ def, onClose, onSaved }: { def: MessageDef | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const toast = useToast();
  const confirm = useConfirm();
  const area = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const edited = def ? getMessageOverrides()[def.key] !== undefined : false;

  useEffect(() => {
    if (def) setBody(templateOf(def.key));
  }, [def]);

  if (!def) return null;

  const known = new Set(def.vars.map((v) => v.name));
  const unknown = Array.from(new Set(Array.from(body.matchAll(/\{(\w+)\}/g), (m) => m[1]).filter((n) => !known.has(n))));

  function insert(name: string) {
    const el = area.current;
    const token = `{${name}}`;
    if (!el) return setBody((b) => b + token);
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  async function save() {
    if (!def) return;
    const text = body.trim();
    if (!text) return toast("A mensagem não pode ficar vazia.", "error");
    setSaving(true);
    try {
      const original = def.body.trim();
      if (text === original) await run(supabase.from("message_templates").delete().eq("key", def.key));
      else await run(supabase.from("message_templates").upsert({ key: def.key, body: text, updated_at: new Date().toISOString() }));
      await onSaved();
      toast("Mensagem salva.");
      onClose();
    } catch (err) {
      toast(friendlyError(err), "error");
    } finally {
      setSaving(false);
    }
  }

  async function restore() {
    if (!def) return;
    const ok = await confirm({
      title: "Voltar ao texto original?",
      message: "O texto que vocês escreveram é apagado e a mensagem volta a ser a original.",
      confirmLabel: "Voltar ao original",
    });
    if (!ok) return;
    setSaving(true);
    try {
      await run(supabase.from("message_templates").delete().eq("key", def.key));
      await onSaved();
      toast("Texto original de volta.");
      onClose();
    } catch (err) {
      toast(friendlyError(err), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={def.title}
      footer={
        <div className="flex items-center gap-3">
          {edited ? (
            <button type="button" onClick={restore} disabled={saving} className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
              Voltar ao texto original
            </button>
          ) : body.trim() !== def.body.trim() ? (
            <button type="button" onClick={() => setBody(def.body)} className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
              Desfazer mudanças
            </button>
          ) : null}
          <Button className="ml-auto min-w-28" onClick={save} loading={saving}>
            Salvar
          </Button>
        </div>
      }
    >
      <p className="-mt-2 mb-4 text-sm text-muted-foreground">{def.where}</p>

      <label className="mb-1.5 block text-sm font-medium text-foreground/80" htmlFor="message-body">Texto</label>
      <Textarea id="message-body" ref={area} rows={7} value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[9.5rem] leading-relaxed" />
      {unknown.length > 0 && (
        <p className="mt-1.5 text-xs text-danger">
          {unknown.map((n) => `{${n}}`).join(", ")} não é uma informação conhecida e vai aparecer assim mesmo na mensagem.
        </p>
      )}

      {def.vars.length > 0 && (
        <>
          <p className="mb-1.5 mt-4 text-sm font-medium text-foreground/80">Toque para inserir</p>
          <div className="flex flex-wrap gap-1.5">
            {def.vars.map((v) => (
              <button
                key={v.name}
                type="button"
                onClick={() => insert(v.name)}
                className="rounded-full border border-dashed border-primary/60 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10"
              >
                + {v.label}
              </button>
            ))}
          </div>
          {/\[[^\]]*\{/.test(body) && (
            <p className="mt-2 text-xs text-muted-foreground">
              O trecho entre [colchetes] some quando a informação dentro dele não existe (por exemplo, lead sem interesse escolhido).
            </p>
          )}
        </>
      )}

      <p className="mb-1.5 mt-5 text-sm font-medium text-foreground/80">Como vai chegar</p>
      <div className="rounded-2xl bg-[#e6ddcf] p-3 dark:bg-[#2a2c24]">
        <div className="whitespace-pre-wrap rounded-xl rounded-bl-sm bg-white px-3 py-2 text-sm leading-relaxed text-[#2b2a28] shadow-sm dark:bg-[#3a3d33] dark:text-white/90">
          {sampleOf(def, body) || " "}
        </div>
      </div>
    </Sheet>
  );
}
