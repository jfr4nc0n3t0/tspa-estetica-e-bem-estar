import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import heroImage from "@assets/generated_images/spa_treatment_room_interior.png";

const COPY_REVEAL_STEP_MS = 500;
const COPY_REVEAL_DURATION_MS = COPY_REVEAL_STEP_MS * 3 + 600 + 50;
const VIDEO_CROSSFADE_TRIGGER_SECONDS = 1.35;
const VIDEO_CROSSFADE_DURATION_MS = 1000;

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const activeVideoRef = useRef(0);
  const isCrossfadingVideoRef = useRef(false);
  const crossfadeTimerRef = useRef<number | null>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [hasWideScreen, setHasWideScreen] = useState(
    () => window.matchMedia("(min-width: 1024px)").matches,
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [isCopyVisible, setIsCopyVisible] = useState(false);
  const [isRevealComplete, setIsRevealComplete] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateScreenSize = () => setHasWideScreen(mediaQuery.matches);

    updateScreenSize();
    mediaQuery.addEventListener("change", updateScreenSize);
    return () => mediaQuery.removeEventListener("change", updateScreenSize);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (isRevealComplete) return;
    if (
      prefersReducedMotion ||
      !section ||
      section.getBoundingClientRect().top < -1
    ) {
      setIsCopyVisible(true);
      setIsRevealComplete(true);
      return;
    }

    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousRootScrollBehavior = root.style.scrollBehavior;
    const previousRevealLock = root.dataset.heroRevealLocked;

    const preventScroll = (event: Event) => event.preventDefault();
    const preventScrollByKeyboard = (event: KeyboardEvent) => {
      const scrollKeys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "];
      const target = event.target as HTMLElement | null;
      if (
        scrollKeys.includes(event.key) &&
        !target?.closest("input, textarea, select, [contenteditable='true']")
      ) {
        event.preventDefault();
      }
    };

    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    root.style.scrollBehavior = "auto";
    root.dataset.heroRevealLocked = "true";
    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });
    window.addEventListener("keydown", preventScrollByKeyboard);

    const animationFrame = window.requestAnimationFrame(() => setIsCopyVisible(true));
    const revealTimer = window.setTimeout(
      () => setIsRevealComplete(true),
      COPY_REVEAL_DURATION_MS,
    );

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(revealTimer);
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      window.removeEventListener("keydown", preventScrollByKeyboard);
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
      root.style.scrollBehavior = previousRootScrollBehavior;
      if (previousRevealLock === undefined) {
        delete root.dataset.heroRevealLocked;
      } else {
        root.dataset.heroRevealLocked = previousRevealLock;
      }
    };
  }, [isRevealComplete, prefersReducedMotion]);

  useEffect(() => {
    const videos = videoRefs.current.filter(
      (video): video is HTMLVideoElement => video !== null,
    );

    if (prefersReducedMotion || !hasWideScreen) {
      videos.forEach((video) => video.pause());
      activeVideoRef.current = 0;
      isCrossfadingVideoRef.current = false;
      setActiveVideoIndex(0);
    } else {
      activeVideoRef.current = 0;
      isCrossfadingVideoRef.current = false;
      setActiveVideoIndex(0);
      videos.forEach((video, index) => {
        video.pause();
        video.currentTime = 0;
        video.playbackRate = 0.72;
        video.defaultPlaybackRate = 0.72;
        if (index === 0) void video.play().catch(() => undefined);
      });
    }

    return () => {
      if (crossfadeTimerRef.current !== null) {
        window.clearTimeout(crossfadeTimerRef.current);
        crossfadeTimerRef.current = null;
      }
      videos.forEach((video) => video.pause());
      isCrossfadingVideoRef.current = false;
    };
  }, [hasWideScreen, prefersReducedMotion]);

  const crossfadeToNextVideo = (videoIndex: number, ended = false) => {
    if (
      !hasWideScreen ||
      prefersReducedMotion ||
      isCrossfadingVideoRef.current ||
      activeVideoRef.current !== videoIndex
    ) {
      return;
    }

    const currentVideo = videoRefs.current[videoIndex];
    const nextVideoIndex = (videoIndex + 1) % 2;
    const nextVideo = videoRefs.current[nextVideoIndex];
    if (!currentVideo || !nextVideo) return;

    const remainingTime = currentVideo.duration - currentVideo.currentTime;
    if (!ended && (!Number.isFinite(remainingTime) || remainingTime > VIDEO_CROSSFADE_TRIGGER_SECONDS)) {
      return;
    }

    isCrossfadingVideoRef.current = true;
    nextVideo.currentTime = 0;
    nextVideo.playbackRate = 0.72;
    nextVideo.defaultPlaybackRate = 0.72;

    void nextVideo.play().then(() => {
      activeVideoRef.current = nextVideoIndex;
      setActiveVideoIndex(nextVideoIndex);
      crossfadeTimerRef.current = window.setTimeout(() => {
        currentVideo.pause();
        currentVideo.currentTime = 0;
        crossfadeTimerRef.current = null;
        isCrossfadingVideoRef.current = false;
      }, VIDEO_CROSSFADE_DURATION_MS);
    }).catch(() => {
      currentVideo.currentTime = 0;
      void currentVideo.play().catch(() => undefined);
      isCrossfadingVideoRef.current = false;
    });
  };

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    }
  };

  const getRevealStyle = (index: number) => ({
    transitionDelay: isCopyVisible ? `${index * COPY_REVEAL_STEP_MS}ms` : "0ms",
  });

  const getRevealClassName = (className: string) =>
    `hero-copy-item ${isCopyVisible ? "hero-copy-item-visible" : ""} ${className}`;

  const scrollToAbout = () => {
    if (isRevealComplete) scrollToSection("#sobre");
  };

  return (
    <section
      ref={sectionRef}
      id="inicio"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-stone-950 px-4 pb-16 pt-20 sm:px-6"
      data-testid="section-hero"
    >
      <div
        className="hero-background-motion absolute inset-0 bg-cover bg-center bg-no-repeat lg:hidden"
        style={{ backgroundImage: `url(${heroImage})` }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 lg:hidden"
        aria-hidden="true"
      />
      {[0, 1].map((videoIndex) => (
        <video
          key={videoIndex}
          ref={(video) => {
            videoRefs.current[videoIndex] = video;
          }}
          className={`absolute inset-0 hidden h-full w-full object-cover object-[66%_center] md:object-center lg:block ${
            activeVideoIndex === videoIndex ? "opacity-100" : "opacity-0"
          } ${prefersReducedMotion ? "transition-none" : "transition-opacity duration-1000 ease-in-out"}`}
          style={{ filter: "brightness(0.82) saturate(0.9)" }}
          muted
          playsInline
          preload={hasWideScreen ? "auto" : "none"}
          onTimeUpdate={() => crossfadeToNextVideo(videoIndex)}
          onEnded={() => crossfadeToNextVideo(videoIndex, true)}
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src="/videos/headspa-hero.mp4" type="video/mp4" />
        </video>
      ))}
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <span
          className={getRevealClassName("mb-5 inline-block text-sm font-medium tracking-widest text-white/90 drop-shadow-md sm:mb-6 sm:text-base")}
          style={getRevealStyle(0)}
        >
          Refúgio do Corpo e da Alma
        </span>
        <h1
          className={getRevealClassName("mb-7 font-serif text-3xl font-bold leading-snug text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.75)] sm:mb-6 sm:leading-tight sm:text-5xl lg:text-6xl xl:text-7xl")}
          style={getRevealStyle(1)}
        >
          Seu momento de equilíbrio<br />
          <span className="text-primary-foreground">começa aqui</span>
        </h1>
        <p
          className={getRevealClassName("mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white drop-shadow-md sm:mb-10 sm:text-lg md:text-xl")}
          style={getRevealStyle(2)}
        >
          Massagens, cuidados estéticos e experiências relaxantes para desacelerar, renovar as energias e cuidar de você por inteiro.
        </p>

        <div
          className={getRevealClassName("flex items-center justify-center")}
          style={getRevealStyle(3)}
        >
          <Button
            variant="outline"
            size="default"
            onClick={() => scrollToSection("#servicos")}
            disabled={!isRevealComplete}
            className="h-auto rounded-full border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20 hover:text-white sm:text-base"
            data-testid="button-experiencias-hero"
          >
            Conheça Nossos Serviços
          </Button>
        </div>
      </div>

      <button
        onClick={scrollToAbout}
        disabled={!isRevealComplete}
        className={`absolute bottom-5 left-1/2 -translate-x-1/2 text-white/80 transition-all hover:text-white motion-safe:animate-bounce sm:bottom-8 ${
          isRevealComplete ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-label="Ir para a próxima seção"
        data-testid="button-scroll-down"
      >
        <ChevronDown className="h-8 w-8" />
      </button>
    </section>
  );
}
