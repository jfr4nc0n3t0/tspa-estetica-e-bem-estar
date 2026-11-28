import { ArrowUpRight, X } from "lucide-react";
import { brl, firstVisitPhoto, headSpaServices } from "@/data/services";
import { agendarUrl } from "@/lib/contact";

/**
 * Convite flutuante de primeira visita. Aparece depois da abertura do site; some perto do rodapé
 * e quando o convite fixo da seção Cuidados está na tela. Fechado no X, só volta ao recarregar a página
 * (nada é guardado no navegador).
 */
export default function FirstVisitBanner({ shown, onClose }: { shown: boolean; onClose: () => void }) {
  const essencial = headSpaServices[0];
  return (
    <aside
      aria-label="Convite para a primeira visita"
      aria-hidden={!shown}
      className={`fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 rounded-[1.25rem] border border-border bg-card p-3.5 shadow-xl shadow-black/15 transition-all duration-500 md:inset-x-auto md:bottom-6 md:left-6 md:w-[22rem] ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
      data-testid="banner-primeira-visita"
    >
      <button
        type="button"
        onClick={onClose}
        tabIndex={shown ? 0 : -1}
        aria-label="Fechar convite"
        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      <a href={agendarUrl(essencial.name)} tabIndex={shown ? 0 : -1} className="group block">
        <span className="flex items-center gap-3 pr-7">
          <img src={firstVisitPhoto} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-xl object-cover md:h-16 md:w-16" />
          <span className="min-w-0">
            <span className="block text-[0.65rem] font-medium uppercase tracking-[0.2em] text-taupe">Primeira vez no TSpa?</span>
            <span className="mt-0.5 block font-serif text-xl leading-tight text-foreground">Comece pelo {essencial.name}</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              {essencial.duration} · <strong className="font-semibold text-foreground">{brl(essencial.price)}</strong>
            </span>
            {/* Computador: chamada em texto, ao lado da foto */}
            <span className="mt-1 hidden items-center gap-1 text-sm font-medium text-primary md:inline-flex">
              Quero conhecer
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </span>
        </span>
        {/* Celular: frase e botão largo */}
        <span className="mt-2 block pr-2 text-sm text-muted-foreground md:hidden">
          O ritual que mais encanta quem chega.
        </span>
        <span className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground transition group-hover:bg-primary/90 md:hidden">
          Quero conhecer
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </a>
    </aside>
  );
}
