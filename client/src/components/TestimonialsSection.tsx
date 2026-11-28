import { useState, type ReactNode } from "react";
import { ArrowUpRight, CheckCheck, Heart } from "lucide-react";
import ambiencePhoto from "@assets/ambiente-luminaria.jpg";
import {
  INSTAGRAM_FEEDBACK_POST,
  featuredTestimonial,
  instagramComments,
  testimonials,
  type Testimonial,
} from "@/data/testimonials";
import { agendarUrl } from "@/lib/contact";
import Reveal from "./Reveal";

/** No celular, o mural começa com estas mensagens e o resto abre em "Ver mais mensagens". */
const MOBILE_VISIBLE = 3;

/** Texto da mensagem com os trechos de `highlights` em negrito (o texto em si não muda). */
function withHighlights({ text, highlights }: Testimonial) {
  const parts: ReactNode[] = [];
  let rest = text;
  for (const piece of highlights) {
    const at = rest.indexOf(piece);
    if (at < 0) continue;
    parts.push(rest.slice(0, at));
    parts.push(
      <strong key={piece} className="font-bold text-forest">
        {piece}
      </strong>,
    );
    rest = rest.slice(at + piece.length);
  }
  parts.push(rest);
  return parts;
}

function Bubble({ item, big = false, className = "" }: { item: Testimonial; big?: boolean; className?: string }) {
  return (
    <figure
      className={`relative break-inside-avoid rounded-[1.25rem] rounded-bl-md bg-card shadow-[0_14px_34px_-18px_rgba(0,0,0,0.55)] after:absolute after:-left-1.5 after:bottom-0 after:h-3.5 after:w-3.5 after:bg-card after:[clip-path:polygon(100%_0,100%_100%,0_100%)] ${
        big ? "px-6 pb-3 pt-5" : "px-[1.125rem] pb-2.5 pt-4"
      } ${className}`}
    >
      <blockquote className={`whitespace-pre-line leading-relaxed text-foreground ${big ? "text-base" : "text-[0.93rem]"}`}>
        {withHighlights(item)}
      </blockquote>
      <figcaption className="mt-1.5 flex items-center justify-end gap-2">
        {item.tag && (
          <span className="mr-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.14em] text-primary">
            {item.tag}
          </span>
        )}
        {item.time && (
          <span className="inline-flex items-center gap-1 text-[0.7rem] text-muted-foreground/80">
            {item.time}
            <CheckCheck className="h-3.5 w-3.5 text-sky-600/60" aria-label="lida" />
          </span>
        )}
      </figcaption>
    </figure>
  );
}

/** Depoimentos: mensagens de clientes exatamente como chegaram, sem nomes. */
export default function TestimonialsSection() {
  const [showAll, setShowAll] = useState(false);

  return (
    <section id="depoimentos" className="relative scroll-mt-16 overflow-hidden bg-forest py-24 text-white md:py-32" data-testid="section-depoimentos">
      <div
        className="pointer-events-none absolute -bottom-1/3 -right-40 h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle,hsl(var(--sand)/0.12),transparent_65%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <Reveal className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10">
          <div>
            <span className="inline-flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-sand">
              <span className="h-px w-8 bg-sand/60" aria-hidden="true" />
              Quem já viveu
            </span>
            <h2 className="mt-4 font-serif text-4xl leading-[1.05] text-white md:text-6xl">
              Do jeito que <em className="text-sand">chegou</em>
              <br className="hidden md:block" /> no nosso WhatsApp.
            </h2>
          </div>
          <p className="max-w-sm text-[0.95rem] leading-relaxed text-white/70">
            O que nossas clientes escreveram depois de viver a experiência TSpa.
          </p>
        </Reveal>

        <div className="mt-12 grid items-start gap-5 lg:grid-cols-[5fr_7fr] lg:gap-7">
          <Reveal>
            {/* Foto da luminária no alto; a mensagem começa logo abaixo da luz e o fundo segue escuro como a foto */}
            <div className="relative overflow-hidden rounded-[1.75rem] bg-[#2b2520] px-4 pb-4 pt-56 md:px-7 md:pb-7 md:pt-72">
              <img
                src={ambiencePhoto}
                alt=""
                loading="lazy"
                className="absolute inset-x-0 top-0 h-[22rem] w-full object-cover object-[50%_52%] brightness-[1.45] contrast-[1.05] saturate-[1.1] md:h-[27rem]"
              />
              <div
                className="absolute inset-x-0 top-0 h-[22rem] bg-gradient-to-b from-transparent from-50% to-[#2b2520] md:h-[27rem]"
                aria-hidden="true"
              />
              <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1 text-xs font-medium text-forest backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600/80" aria-hidden="true" />
                Mensagem recebida
              </span>
              <Bubble item={featuredTestimonial} big className="relative" />
            </div>
          </Reveal>

          <div className="columns-1 gap-[1.125rem] md:columns-2">
            {testimonials.map((item, index) => (
              <Bubble
                key={item.id}
                item={item}
                className={`mb-[1.125rem] md:even:ml-5 ${index % 2 === 1 ? "ml-5" : ""} ${
                  !showAll && index >= MOBILE_VISIBLE ? "max-md:hidden" : ""
                }`}
              />
            ))}
            {!showAll && testimonials.length > MOBILE_VISIBLE && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="w-full rounded-full border border-sand/40 py-2.5 text-sm font-medium text-sand md:hidden"
              >
                Ver mais mensagens ({testimonials.length - MOBILE_VISIBLE})
              </button>
            )}
          </div>
        </div>

        <Reveal className="mt-10">
          <div className="grid gap-6 rounded-[1.75rem] bg-white/[0.05] p-6 text-white ring-1 ring-white/10 md:grid-cols-[13rem_1fr] md:items-center md:gap-8 md:p-8">
            <div>
              <h3 className="font-serif text-3xl leading-tight">E nos comentários do Instagram</h3>
              <a
                href={INSTAGRAM_FEEDBACK_POST}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm text-sand underline-offset-4 hover:underline"
              >
                Ver o post completo
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <ul className="grid gap-5 md:grid-cols-3">
              {instagramComments.map((comment) => (
                <li key={comment} className="flex gap-3 text-sm leading-relaxed text-white/85">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-sand/50 text-sand" aria-hidden="true">
                    <Heart className="h-3.5 w-3.5" />
                  </span>
                  <p>{comment}</p>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <div className="mt-8 flex justify-center">
          <a
            href={agendarUrl()}
            className="inline-flex items-center gap-1.5 rounded-full bg-nude px-6 py-3 text-sm font-medium text-forest transition hover:bg-white"
          >
            Quero viver essa experiência
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
