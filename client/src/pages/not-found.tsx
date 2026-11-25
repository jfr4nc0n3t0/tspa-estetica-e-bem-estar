import { useEffect } from "react";
import logoImage from "@assets/tspa_refugio_mark.png";

export default function NotFound() {
  useEffect(() => {
    // Keep missing pages out of search results.
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    document.title = "Página não encontrada | TSpa";
    return () => meta.remove();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-nude px-6 text-center">
      <img src={logoImage} alt="TSpa" className="w-24" />
      <p className="mt-10 text-xs uppercase tracking-[0.3em] text-taupe">Página não encontrada</p>
      <h1 className="mt-4 font-serif text-4xl text-foreground md:text-5xl">Respire. Vamos voltar ao início.</h1>
      <a
        href="/"
        className="mt-10 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition hover:bg-forest"
      >
        Ir para a página inicial
      </a>
    </main>
  );
}
