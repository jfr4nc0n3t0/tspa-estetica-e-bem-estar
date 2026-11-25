import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import heroImage from "@assets/hero-head-spa.jpg";
import { whatsappUrl } from "@/lib/contact";

const STEP_MS = 220;

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const reveal = (index: number, className: string) => ({
    className: `hero-copy-item ${isVisible ? "hero-copy-item-visible" : ""} ${className}`,
    style: { transitionDelay: `${index * STEP_MS}ms` },
  });

  return (
    <section
      id="inicio"
      className="relative flex min-h-[100svh] items-end overflow-hidden bg-forest md:items-center"
      data-testid="section-hero"
    >
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={heroImage}
          alt="Cliente relaxando durante uma sessão de Head Spa no TSpa, em João Pessoa"
          width={1920}
          height={1080}
          loading="eager"
          decoding="async"
          {...{ fetchpriority: "high" }}
          className="hero-photo h-full w-full object-cover object-[68%_center]"
        />
      </div>
      {/* Warm gradient: darker where the text sits, open where the photo breathes */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-[hsl(57_20%_9%/0.88)] via-[hsl(57_20%_9%/0.35)] to-[hsl(57_20%_9%/0.45)] md:bg-gradient-to-r md:from-[hsl(57_20%_9%/0.82)] md:via-[hsl(57_20%_9%/0.45)] md:to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-24 pt-32 md:px-8 md:pb-0 md:pt-20">
        <div className="max-w-xl">
          <p {...reveal(0, "text-xs font-medium uppercase tracking-[0.35em] text-sand")}>
            Refúgio do corpo e da alma
          </p>
          <h1
            {...reveal(
              1,
              "mt-5 font-serif text-[2.6rem] font-medium leading-[1.05] text-white sm:text-6xl lg:text-7xl",
            )}
          >
            Desacelere.
            <br />
            <em className="font-normal text-nude">O resto pode esperar.</em>
          </h1>
          <p {...reveal(2, "mt-6 max-w-md text-base leading-relaxed text-white/85 md:text-lg")}>
            Experiências de relaxamento que aliviam tensões e restauram corpo e mente —
            Head Spa, massagens e cuidados faciais em João Pessoa.
          </p>
          <div {...reveal(3, "mt-9 flex flex-col gap-3 sm:flex-row sm:items-center")}>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-nude px-7 py-3.5 text-sm font-medium text-forest shadow-lg transition hover:bg-white"
              data-testid="button-agendar-hero"
            >
              <SiWhatsapp className="h-4 w-4" aria-hidden="true" />
              Agendar meu momento
            </a>
            <a
              href="#servicos"
              className="inline-flex items-center justify-center rounded-full border border-white/40 px-7 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/10"
              data-testid="button-experiencias-hero"
            >
              Ver menu de cuidados
            </a>
          </div>
        </div>
      </div>

      <a
        href="#sobre"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-white/70 transition hover:text-white motion-safe:animate-bounce md:block"
        aria-label="Ir para a próxima seção"
        data-testid="button-scroll-down"
      >
        <ChevronDown className="h-7 w-7" />
      </a>
    </section>
  );
}
