import { CheckCircle } from "lucide-react";
import aboutImage from "@assets/generated_images/physiotherapist_professional_portrait.png";

const credentials = [
  "Graduada em Fisioterapia",
  "Especialista em Terapias Manuais",
  "Certificada em SPA Therapy",
  "Atendimento Humanizado",
];

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
                alt="Dra. Thauany Santos - Fisioterapeuta"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground p-6 rounded-xl shadow-lg hidden md:block">
              <p className="text-3xl font-bold">SPA</p>
              <p className="text-sm opacity-90">& Fisioterapia</p>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <span className="inline-block text-primary text-sm font-medium tracking-widest uppercase mb-4">
              Sobre Nós
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Thauany Santos
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Com dedicação à fisioterapia e terapias holísticas, 
              criei este espaço com a missão de proporcionar um ambiente onde saúde 
              e bem-estar se encontram em perfeita harmonia.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Nossa filosofia é tratar cada pessoa de forma única, combinando técnicas 
              terapêuticas avançadas com tratamentos relaxantes que promovem a recuperação 
              física e o equilíbrio mental. Aqui, você encontra um ambiente acolhedor 
              e profissionais dedicados ao seu bem-estar.
            </p>

            <div className="space-y-3">
              {credentials.map((credential, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3"
                  data-testid={`text-credential-${index}`}
                >
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{credential}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
