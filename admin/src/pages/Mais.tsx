import { useEffect, useState } from "react";
import { Copy, Droplets, LogOut, Plus, UserRound, UsersRound } from "lucide-react";
import { Sheet } from "../components/Sheet";
import { useToast } from "../components/Toast";
import { Badge, Button, Card, Field, Input, PageHeader, SectionTitle, Segmented, Select, Switch } from "../components/ui";
import { useAppData } from "../lib/appData";
import { friendlyError } from "../lib/errors";
import { brl, minutesToTime } from "../lib/format";
import { run, supabase } from "../lib/supabase";
import { applyTheme, getThemePref, type ThemePref } from "../lib/theme";
import type { Professional, Service } from "../lib/types";

const SITE_FORM = "https://tspa.com.br/agendar";
const HOURS = Array.from({ length: 48 }, (_, i) => minutesToTime(i * 30));

export default function Mais() {
  const { settings, services, professionals, email, refreshSettings, refreshServices, refreshProfessionals } = useAppData();
  const toast = useToast();
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  const [editingPro, setEditingPro] = useState<Professional | "new" | null>(null);
  const [theme, setTheme] = useState<ThemePref>(getThemePref());
  const [open, setOpen] = useState(settings.open_time.slice(0, 5));
  const [close, setClose] = useState(settings.close_time.slice(0, 5));
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setOpen(settings.open_time.slice(0, 5));
    setClose(settings.close_time.slice(0, 5));
  }, [settings]);

  async function updateSettings(patch: Partial<{ open_time: string; close_time: string; room2_enabled: boolean }>, message: string) {
    try {
      await run(supabase.from("settings").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", 1));
      await refreshSettings();
      toast(message);
    } catch (err) {
      toast(friendlyError(err), "error");
    }
  }

  function saveHours() {
    if (close <= open) return toast("O fechamento precisa ser depois da abertura.", "error");
    updateSettings({ open_time: open, close_time: close }, "Horário de funcionamento salvo.");
  }

  async function sample(action: "load" | "clear") {
    const question =
      action === "load"
        ? "Carregar dados de exemplo? Eles aparecem com “(exemplo)” e podem ser apagados depois sem afetar seus dados reais."
        : "Apagar todos os dados de exemplo? Seus dados reais continuam intactos.";
    if (!window.confirm(question)) return;
    setBusy(action);
    try {
      await run(supabase.rpc(action === "load" ? "load_sample_data" : "clear_sample_data"));
      await refreshServices();
      toast(action === "load" ? "Dados de exemplo carregados." : "Dados de exemplo apagados.");
    } catch (err) {
      toast(friendlyError(err), "error");
    } finally {
      setBusy(null);
    }
  }

  const links = [
    { label: "Link da bio do Instagram", url: `${SITE_FORM}?origem=instagram` },
    { label: "Link para o Google", url: `${SITE_FORM}?origem=google` },
    { label: "Link geral do site", url: SITE_FORM },
  ];

  return (
    <>
      <PageHeader title="Mais" subtitle="Serviços, ajustes e conta" />

      <SectionTitle action={<Button size="sm" variant="secondary" onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Serviço</Button>}>
        Serviços
      </SectionTitle>
      <Card className="divide-y divide-border/70">
        {services.length === 0 && <p className="px-4 py-4 text-sm text-muted-foreground">Nenhum serviço cadastrado.</p>}
        {services.map((s) => (
          <button key={s.id} type="button" onClick={() => setEditing(s)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50">
            <div className="min-w-0 flex-1">
              <p className={s.active ? "truncate font-medium" : "truncate font-medium text-muted-foreground line-through"}>{s.name}</p>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {s.duration_min} min
                {!s.needs_professional && (
                  <>
                    · <Droplets className="h-3.5 w-3.5" /> sem profissional
                  </>
                )}
              </p>
            </div>
            {Number(s.price) === 0 ? <Badge className="bg-taupe/10 text-taupe">definir preço</Badge> : <span className="tabular-nums">{brl(s.price)}</span>}
          </button>
        ))}
      </Card>

      <SectionTitle action={<Button size="sm" variant="secondary" onClick={() => setEditingPro("new")}><Plus className="h-4 w-4" /> Profissional</Button>}>
        Profissionais
      </SectionTitle>
      <Card className="divide-y divide-border/70">
        {professionals.length === 0 && <p className="px-4 py-4 text-sm text-muted-foreground">Nenhuma profissional cadastrada.</p>}
        {professionals.map((p) => (
          <button key={p.id} type="button" onClick={() => setEditingPro(p)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50">
            <UsersRound className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className={p.active ? "flex-1 truncate font-medium" : "flex-1 truncate font-medium text-muted-foreground line-through"}>{p.name}</span>
            {!p.active && <Badge>desativada</Badge>}
          </button>
        ))}
      </Card>
      <p className="mt-2 text-xs text-muted-foreground">
        Cada profissional faz um atendimento por vez. Com mais de uma, elas podem atender ao mesmo tempo em salas diferentes.
      </p>

      <SectionTitle>Horário de funcionamento</SectionTitle>
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Abre às">
            <Select value={open} onChange={(e) => setOpen(e.target.value)}>
              {HOURS.map((h) => <option key={h}>{h}</option>)}
            </Select>
          </Field>
          <Field label="Fecha às">
            <Select value={close} onChange={(e) => setClose(e.target.value)}>
              {[...HOURS.slice(1), "23:59"].map((h) => <option key={h}>{h}</option>)}
            </Select>
          </Field>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">A agenda é dividida em blocos de 30 minutos.</p>
        <Button className="mt-3" size="sm" onClick={saveHours} disabled={open === settings.open_time.slice(0, 5) && close === settings.close_time.slice(0, 5)}>
          Salvar horário
        </Button>
      </Card>

      <SectionTitle>Salas</SectionTitle>
      <Card className="p-4">
        <Switch
          checked={settings.room2_enabled}
          onChange={(v) => updateSettings({ room2_enabled: v }, v ? "Sala 2 ativada." : "Sala 2 desativada.")}
          label="Sala 2 ativa"
          description="Ligada, a Sala 2 recebe atendimentos ao mesmo tempo que a Sala 1: um serviço sem profissional (ex.: ofurô ou sauna) ou o atendimento de outra profissional."
        />
      </Card>

      <SectionTitle>Formulário de interesse</SectionTitle>
      <Card className="divide-y divide-border/70">
        {links.map((l) => (
          <div key={l.url} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{l.label}</p>
              <p className="truncate text-xs text-muted-foreground">{l.url}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Copiar ${l.label}`}
              onClick={() => navigator.clipboard.writeText(l.url).then(() => toast("Link copiado."), () => toast(l.url))}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </Card>

      <SectionTitle>Aparência</SectionTitle>
      <Segmented
        value={theme}
        onChange={(v) => {
          setTheme(v);
          applyTheme(v);
        }}
        options={[
          { value: "system", label: "Automático" },
          { value: "light", label: "Claro" },
          { value: "dark", label: "Escuro" },
        ]}
      />

      <SectionTitle>Dados de exemplo</SectionTitle>
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">
          Para testar o painel com clientes, agendamentos, despesas e leads fictícios. Tudo aparece com “(exemplo)”.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" loading={busy === "load"} onClick={() => sample("load")}>Carregar exemplos</Button>
          <Button size="sm" variant="danger" loading={busy === "clear"} onClick={() => sample("clear")}>Apagar exemplos</Button>
        </div>
      </Card>

      <SectionTitle>Conta</SectionTitle>
      <Card className="flex items-center gap-3 p-4">
        <UserRound className="h-5 w-5 text-muted-foreground" />
        <p className="min-w-0 flex-1 truncate text-sm">{email}</p>
        <Button size="sm" variant="outline" onClick={() => supabase.auth.signOut()}>
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </Card>

      <p className="mt-10 text-center font-serif text-lg italic text-muted-foreground">Seu corpo também merece descanso.</p>

      <ServiceSheet service={editing === "new" ? null : editing} open={editing !== null} onClose={() => setEditing(null)} onSaved={refreshServices} />
      <ProfessionalSheet
        professional={editingPro === "new" ? null : editingPro}
        open={editingPro !== null}
        onClose={() => setEditingPro(null)}
        onSaved={refreshProfessionals}
        activeCount={professionals.filter((p) => p.active).length}
      />
    </>
  );
}

function ServiceSheet({ service, open, onClose, onSaved }: { service: Service | null; open: boolean; onClose: () => void; onSaved: () => Promise<void> }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", duration_min: "60", price: "", needs_professional: true, active: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm({
      name: service?.name ?? "",
      duration_min: String(service?.duration_min ?? 60),
      price: service ? String(service.price) : "",
      needs_professional: service?.needs_professional ?? true,
      active: service?.active ?? true,
    });
  }, [open, service]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function save() {
    const duration = Number(form.duration_min);
    const price = Number(form.price.replace(",", ".") || 0);
    if (form.name.trim().length < 2) return setError("Digite o nome do serviço.");
    if (!duration || duration < 10 || duration > 480) return setError("Duração entre 10 e 480 minutos.");
    if (Number.isNaN(price) || price < 0) return setError("Preço inválido.");
    setSaving(true);
    setError(null);
    const payload = { name: form.name.trim(), duration_min: duration, price, needs_professional: form.needs_professional, active: form.active };
    try {
      if (service) await run(supabase.from("services").update(payload).eq("id", service.id));
      else await run(supabase.from("services").insert(payload));
      await onSaved();
      toast("Serviço salvo.");
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!service || !window.confirm(`Excluir “${service.name}”? Os agendamentos antigos continuam com o nome do serviço. Se preferir, só desative.`)) return;
    setSaving(true);
    try {
      await run(supabase.from("services").delete().eq("id", service.id));
      await onSaved();
      toast("Serviço excluído.");
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={service ? "Serviço" : "Novo serviço"}
      footer={
        <div className="flex gap-2">
          {service && <Button variant="danger" onClick={remove} disabled={saving}>Excluir</Button>}
          <Button className="ml-auto min-w-28" onClick={save} loading={saving}>Salvar</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Nome">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex.: Ofurô" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duração (min)">
            <Input inputMode="numeric" value={form.duration_min} onChange={(e) => set("duration_min", e.target.value.replace(/\D/g, ""))} />
          </Field>
          <Field label="Preço (R$)">
            <Input inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0,00" />
          </Field>
        </div>
        <div className="space-y-3 rounded-xl bg-muted/60 px-4 py-3">
          <Switch
            checked={form.needs_professional}
            onChange={(v) => set("needs_professional", v)}
            label="Precisa de profissional"
            description="Desligue para serviços como ofurô ou sauna, que acontecem sem ninguém atendendo e podem ocupar a Sala 2 ao mesmo tempo."
          />
          <Switch checked={form.active} onChange={(v) => set("active", v)} label="Ativo" description="Serviços inativos não aparecem para novos agendamentos." />
        </div>
        {error && <p className="rounded-xl bg-danger/10 px-3.5 py-3 text-sm text-danger">{error}</p>}
      </div>
    </Sheet>
  );
}

function ProfessionalSheet({ professional, open, onClose, onSaved, activeCount }: {
  professional: Professional | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
  activeCount: number;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setName(professional?.name ?? "");
    setActive(professional?.active ?? true);
  }, [open, professional]);

  // Não deixa ficar sem nenhuma profissional ativa
  const lastActive = Boolean(professional?.active) && activeCount <= 1;

  async function save() {
    if (name.trim().length < 2) return setError("Digite o nome.");
    if (!active && lastActive) return setError("É preciso ter pelo menos uma profissional ativa.");
    setSaving(true);
    setError(null);
    try {
      const payload = { name: name.trim(), active };
      if (professional) await run(supabase.from("professionals").update(payload).eq("id", professional.id));
      else await run(supabase.from("professionals").insert(payload));
      await onSaved();
      toast("Profissional salva.");
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!professional) return;
    if (lastActive) return setError("É preciso ter pelo menos uma profissional ativa.");
    if (!window.confirm(`Excluir ${professional.name}?`)) return;
    setSaving(true);
    try {
      await run(supabase.from("professionals").delete().eq("id", professional.id));
      await onSaved();
      toast("Profissional excluída.");
      onClose();
    } catch (err) {
      const e = err as { code?: string };
      setError(e.code === "23503" ? "Ela já tem atendimentos na agenda. Desative em vez de excluir, assim o histórico fica guardado." : friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={professional ? "Profissional" : "Nova profissional"}
      footer={
        <div className="flex gap-2">
          {professional && <Button variant="danger" onClick={remove} disabled={saving}>Excluir</Button>}
          <Button className="ml-auto min-w-28" onClick={save} loading={saving}>Salvar</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Nome">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Ana Paula" />
        </Field>
        <div className="rounded-xl bg-muted/60 px-4 py-3">
          <Switch
            checked={active}
            onChange={setActive}
            label="Ativa"
            description="Profissionais desativadas não aparecem para novos agendamentos, mas o histórico continua."
          />
        </div>
        {error && <p className="rounded-xl bg-danger/10 px-3.5 py-3 text-sm text-danger">{error}</p>}
      </div>
    </Sheet>
  );
}
