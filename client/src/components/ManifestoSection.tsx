import Reveal from "./Reveal";

const lines = [
  ["Da correria", "para a calma."],
  ["Da tensão", "para o descanso."],
  ["Do excesso", "para a leveza."],
];

/** Brand concept: TSpa as a space of transition. */
export default function ManifestoSection() {
  return (
    <section className="bg-nude py-24 md:py-32" data-testid="section-manifesto">
      <div className="mx-auto max-w-5xl px-5 text-center md:px-8">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.4em] text-taupe">Refúgio do corpo e da alma</p>
        </Reveal>
        <div className="mt-10 space-y-3">
          {lines.map(([from, to], index) => (
            <Reveal key={from} delay={index * 180}>
              <p className="font-serif text-3xl leading-tight text-foreground sm:text-4xl md:text-5xl">
                <span className="text-marfim">{from}</span> <em>{to}</em>
              </p>
            </Reveal>
          ))}
        </div>
        <Reveal delay={600}>
          <p className="mx-auto mt-10 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            O TSpa é um espaço de transição — pensado para que você sinta essa mudança desde o primeiro contato.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
