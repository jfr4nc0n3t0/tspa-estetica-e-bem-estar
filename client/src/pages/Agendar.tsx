import { useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronDown } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import logoImage from "@assets/tspa_refugio_mark.png";
import { experiences, facialServices, feetRitual, headSpaServices, massageServices } from "@/data/services";
import { whatsappUrl } from "@/lib/contact";

// Formulário de interesse: também é o link da bio do Instagram (tspa.com.br/agendar?origem=instagram).
// O envio vai para /api/leads, que grava o lead no painel administrativo.

const SOURCES = ["instagram", "whatsapp", "indicacao", "google", "site", "outro"] as const;
type Source = (typeof SOURCES)[number];

const HOW_FOUND: { value: Source; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "indicacao", label: "Indicação de alguém" },
  { value: "google", label: "Google" },
  { value: "outro", label: "Outro" },
];

const INTEREST_GROUPS = [
  { label: "Head Spa", items: headSpaServices.map((s) => s.name) },
  { label: "Massagens", items: massageServices.map((s) => s.name) },
  { label: "Cuidados faciais", items: facialServices.map((s) => s.name) },
  { label: "Rituais e experiências", items: [...feetRitual.map((s) => s.name), ...experiences.map((e) => e.name)] },
];

const NOT_SURE = "Ainda não sei, quero ajuda para escolher";

function sourceFromUrl(): Source | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("origem")?.toLowerCase();
  return SOURCES.includes(value as Source) ? (value as Source) : null;
}

function useMeta() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Agende seu momento | TSpa · Refúgio do Corpo e da Alma";
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const previousDescription = description?.content;
    const previousCanonical = canonical?.href;
    description?.setAttribute("content", "Deixe seu nome e WhatsApp e o TSpa chama você para encontrar o melhor horário. Head Spa, massagens e rituais em João Pessoa.");
    canonical?.setAttribute("href", "https://tspa.com.br/agendar");
    return () => {
      document.title = previousTitle;
      if (previousDescription) description?.setAttribute("content", previousDescription);
      if (previousCanonical) canonical?.setAttribute("href", previousCanonical);
    };
  }, []);
}

const fieldClass =
  "w-full rounded-2xl border border-sand bg-white/80 px-4 py-3.5 text-[16px] text-foreground placeholder:text-marfim/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function Agendar() {
  useMeta();
  const [urlSource] = useState(sourceFromUrl);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [howFound, setHowFound] = useState<Source | "">("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // armadilha para robôs
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef(Date.now());

  // Várias escolhas; "Ainda não sei" não combina com as outras
  function toggleInterest(item: string) {
    setInterests((current) => {
      if (current.includes(item)) return current.filter((i) => i !== item);
      if (item === NOT_SURE) return [NOT_SURE];
      return [...current.filter((i) => i !== NOT_SURE), item];
    });
  }
  const interest = interests.join(", ");
  // O botão só libera com nome, WhatsApp com DDD e o aceite da LGPD marcado
  const canSubmit = name.trim().length >= 2 && whatsapp.replace(/\D/g, "").length >= 10 && consent;
  const chosen = interests.filter((i) => i !== NOT_SURE).join(", ");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError("Conte como podemos te chamar.");
    if (whatsapp.replace(/\D/g, "").length < 10) return setError("Digite o WhatsApp com DDD.");
    if (!consent) return setError("Para continuar, marque o aceite de uso dos seus dados.");

    setStatus("sending");
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          whatsapp,
          interest: interest || undefined,
          source: urlSource ?? (howFound || "site"),
          consent,
          website,
          elapsedMs: Date.now() - startedAt.current,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? "Não conseguimos enviar agora. Tente de novo ou chame no WhatsApp.");
      }
      setStatus("sent");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Não conseguimos enviar agora.");
    }
  }

  return (
    <main className="min-h-[100svh] bg-nude px-5 py-10 md:py-16">
      <div className="mx-auto max-w-md">
        <a href="/" className="mx-auto block w-fit" aria-label="Voltar para o site do TSpa">
          <img src={logoImage} alt="TSpa — Refúgio do Corpo e da Alma" className="w-28" />
        </a>

        {status === "sent" ? (
          <section className="mt-12 text-center" aria-live="polite">
            <p className="text-xs uppercase tracking-[0.3em] text-taupe">Recebemos seu contato</p>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-foreground md:text-5xl">Respire. A gente já te chama.</h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Em breve entramos em contato pelo WhatsApp para encontrar o melhor horário para você.
            </p>
            <a
              href={whatsappUrl(`Olá! Acabei de deixar meu contato no site do TSpa${chosen ? ` e tenho interesse em ${chosen}` : ""}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary/40 px-6 py-3.5 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
            >
              <SiWhatsapp className="h-4 w-4" aria-hidden="true" />
              Prefere falar agora? Chame no WhatsApp
            </a>
            <a href="/#servicos" className="mt-6 block text-sm text-muted-foreground underline-offset-4 hover:underline">
              Conhecer os cuidados do TSpa
            </a>
          </section>
        ) : (
          <>
            <header className="mt-10 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-taupe">Desacelere</p>
              <h1 className="mt-4 font-serif text-4xl leading-tight text-foreground md:text-5xl">Um tempo para você.</h1>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Deixe seu nome e WhatsApp. A gente chama você para encontrar o melhor horário.
              </p>
            </header>

            <form onSubmit={onSubmit} className="mt-10 space-y-5" noValidate>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground/80">Seu nome</span>
                <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={100} required />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground/80">WhatsApp com DDD</span>
                <input
                  className={fieldClass}
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(83) 99999-0000"
                  maxLength={20}
                  required
                />
              </label>

              <div>
                <span id="interest-label" className="mb-2 block text-sm font-medium text-foreground/80">
                  O que você gostaria de viver? <span className="font-normal text-muted-foreground">(opcional)</span>
                </span>
                <InterestSelect selected={interests} onToggle={toggleInterest} onClear={() => setInterests([])} />
              </div>

              {!urlSource && (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground/80">Como conheceu o TSpa?</span>
                  <span className="relative block">
                    <select
                      className={`${fieldClass} appearance-none pr-12`}
                      value={howFound}
                      onChange={(e) => setHowFound(e.target.value as Source | "")}
                    >
                      <option value="">Prefiro não dizer</option>
                      {HOW_FOUND.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-marfim" aria-hidden="true" />
                  </span>
                </label>
              )}

              {/* Campo invisível: pessoas não veem; robôs costumam preencher */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>
                  Site
                  <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} name="website" />
                </label>
              </div>

              <label className="flex items-start gap-3 rounded-2xl bg-white/60 p-4 text-sm leading-relaxed text-foreground/80">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#67664A]"
                  required
                />
                <span>
                  Autorizo o TSpa a usar meu nome e WhatsApp apenas para falar comigo sobre agendamentos, conforme a Lei Geral de
                  Proteção de Dados (LGPD). Posso pedir a exclusão dos meus dados quando quiser, pelo WhatsApp.
                </span>
              </label>

              {error && (
                <p className="rounded-2xl bg-taupe/10 px-4 py-3 text-sm text-taupe" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!canSubmit || status === "sending"}
                className="w-full rounded-full bg-primary px-7 py-4 text-base font-medium text-primary-foreground transition hover:bg-forest disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-primary"
              >
                {status === "sending" ? "Enviando…" : "Enviar meu contato"}
              </button>
              {!canSubmit && (
                <p className="-mt-2 text-center text-xs text-muted-foreground">
                  Preencha nome, WhatsApp com DDD e marque o aceite para enviar.
                </p>
              )}
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Prefere falar direto?{" "}
              <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">
                Chame no WhatsApp
              </a>
            </p>
          </>
        )}
      </div>
    </main>
  );
}

/** Caixa de seleção múltipla: abre uma lista com caixinhas de marcar, agrupadas por tipo de cuidado. */
function InterestSelect({ selected, onToggle, onClear }: { selected: string[]; onToggle: (item: string) => void; onClear: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fecha ao tocar fora ou apertar Esc
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const summary =
    selected.length === 0 ? "Escolha um ou mais cuidados" : selected.length <= 2 ? selected.join(", ") : `${selected.length} cuidados escolhidos`;

  const option = (item: string) => (
    <label key={item} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-foreground hover:bg-nude/70">
      <input type="checkbox" checked={selected.includes(item)} onChange={() => onToggle(item)} className="h-4 w-4 shrink-0 accent-[#67664A]" />
      {item}
    </label>
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby="interest-label"
        className={`${fieldClass} flex items-center justify-between gap-3 pr-4 text-left ${selected.length ? "" : "text-marfim/70"}`}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-marfim transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          aria-labelledby="interest-label"
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-sand bg-[#FAF8F5] shadow-[0_18px_40px_-18px_rgba(60,40,20,0.35)]"
        >
          <div className="max-h-72 overflow-y-auto p-2">
            {INTEREST_GROUPS.map((group) => (
              <div key={group.label} className="pb-1">
                <p className="px-3 pb-1 pt-2 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-taupe">{group.label}</p>
                {group.items.map(option)}
              </div>
            ))}
            <div className="mt-1 border-t border-sand/70 pt-1">{option(NOT_SURE)}</div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-sand/70 px-4 py-2.5">
            <button type="button" onClick={onClear} disabled={!selected.length} className="text-sm text-muted-foreground disabled:opacity-40">
              Limpar
            </button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-forest">
              Pronto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
