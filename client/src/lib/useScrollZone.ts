import { useEffect, useState } from "react";

/** Em que parte da página a pessoa está, para os elementos flutuantes (WhatsApp, convite). */
export type ScrollZone = {
  /** Já passou da abertura do site */
  pastHero: boolean;
  /** O rodapé (que tem o contato) está chegando na tela */
  nearFooter: boolean;
  /** O convite de primeira visita da seção Cuidados está na tela */
  inviteOnScreen: boolean;
};

export function useScrollZone(): ScrollZone {
  const [zone, setZone] = useState<ScrollZone>({ pastHero: false, nearFooter: false, inviteOnScreen: false });

  useEffect(() => {
    const update = () => {
      const vh = window.innerHeight;
      const footer = document.querySelector("footer")?.getBoundingClientRect();
      const invite = document.getElementById("convite-primeira-visita")?.getBoundingClientRect();
      const next: ScrollZone = {
        pastHero: window.scrollY > vh * 0.7,
        nearFooter: footer ? footer.top < vh - 40 : false,
        inviteOnScreen: invite ? invite.bottom > 0 && invite.top < vh : false,
      };
      setZone((prev) =>
        prev.pastHero === next.pastHero && prev.nearFooter === next.nearFooter && prev.inviteOnScreen === next.inviteOnScreen ? prev : next,
      );
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return zone;
}
