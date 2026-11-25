import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PhotoCarouselProps = {
  images: string[];
  /** Used in the accessible labels of the controls, e.g. the service name. */
  label: string;
  className?: string;
  /** Extra overlays (badges, etc.) drawn over the photos. */
  children?: ReactNode;
  intervalMs?: number;
};

/** Crossfading photo gallery: rotates automatically, pauses on hover, with arrows and dots. */
export default function PhotoCarousel({
  images,
  label,
  className = "",
  children,
  intervalMs = 5000,
}: PhotoCarouselProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (images.length < 2 || paused) return;
    const id = window.setTimeout(() => setActive((i) => (i + 1) % images.length), intervalMs);
    return () => window.clearTimeout(id);
  }, [active, images.length, paused, intervalMs]);

  const go = (delta: number) => setActive((i) => (i + delta + images.length) % images.length);

  return (
    <div
      className={`group/carousel relative overflow-hidden bg-muted ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {images.map((src, index) => (
        <img
          key={src}
          src={src}
          alt=""
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-[1200ms] group-hover/carousel:scale-[1.03] ${
            index === active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" aria-hidden="true" />
      {children}

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label={`Imagem anterior de ${label}`}
            onClick={(event) => {
              event.preventDefault();
              go(-1);
            }}
            className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-background/80 text-foreground opacity-0 backdrop-blur transition focus-visible:opacity-100 group-hover/carousel:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`Próxima imagem de ${label}`}
            onClick={(event) => {
              event.preventDefault();
              go(1);
            }}
            className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-background/80 text-foreground opacity-0 backdrop-blur transition focus-visible:opacity-100 group-hover/carousel:opacity-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Mostrar imagem ${index + 1} de ${label}`}
                aria-current={active === index ? "true" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  setActive(index);
                }}
                className={`h-1.5 rounded-full transition-all ${active === index ? "w-6 bg-white" : "w-1.5 bg-white/55"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
