import aboutImage from "@assets/thau_1766782638523.jpeg";

export default function AboutSection() {
  return (
    <section
      id="sobre"
      className="py-16 md:py-24 lg:py-32 bg-background"
      data-testid="section-sobre"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
              <img
                src={aboutImage}
                alt="Thauany Santos - Fisioterapeuta"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground p-6 rounded-xl shadow-lg hidden md:block">
              <p className="text-3xl font-bold">2021</p>
              <p className="text-sm opacity-90">Formação em Fisioterapia</p>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <span className="inline-block text-primary text-sm font-medium tracking-widest uppercase mb-4">
              Sobre Mim
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Thauany Santos
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Sou fisioterapeuta formada desde 2021, com atuação dedicada ao cuidado integral 
              do corpo e ao bem-estar físico e funcional. Ao longo da minha trajetória 
              profissional, construí experiência em diferentes contextos da fisioterapia — 
              hospitalar, clínica e atendimento domiciliar — o que me proporcionou um olhar 
              amplo, humano e individualizado para cada pessoa que atendo.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Possuo formação complementar em terapia manual e reabilitação, áreas que 
              aprofundaram minha compreensão sobre dor, movimento, recuperação e prevenção 
              de disfunções musculoesqueléticas. Além disso, atuo como instrutora de Pilates, 
              integrando fortalecimento, consciência corporal e equilíbrio como parte 
              essencial do processo terapêutico.
            </p>
            <div className="bg-muted/50 p-6 rounded-xl border border-border">
              <p className="text-foreground leading-relaxed italic">
                "O TSpa nasce da união entre ciência, escuta e acolhimento. Cada atendimento 
                é pensado de forma personalizada, respeitando os limites do corpo e promovendo 
                não apenas alívio de dores, mas também bem-estar, relaxamento e qualidade de 
                vida. Aqui, o cuidado vai além da técnica: é uma experiência de atenção, 
                presença e conexão com o próprio corpo."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
