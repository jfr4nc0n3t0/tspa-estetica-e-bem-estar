import { CheckCircle, Award, GraduationCap, Stethoscope } from "lucide-react";

const credentials = [
  "Graduada em Fisioterapia",
  "Especialista em Fisioterapia Domiciliar",
  "Atendimento Humanizado e Personalizado",
  "Foco na Reabilitação e Qualidade de Vida",
];

const highlights = [
  {
    icon: GraduationCap,
    title: "Formação",
    description: "Profissional qualificada com formação em fisioterapia"
  },
  {
    icon: Stethoscope,
    title: "Especialização",
    description: "Atendimento domiciliar especializado"
  },
  {
    icon: Award,
    title: "Experiência",
    description: "Dedicação ao cuidado dos pacientes"
  },
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
            <div className="bg-gradient-to-br from-primary/20 to-secondary/30 rounded-2xl p-8 md:p-12">
              <div className="grid grid-cols-1 gap-6">
                {highlights.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-4 bg-background/80 backdrop-blur-sm rounded-xl p-4"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <span className="inline-block text-primary text-sm font-medium tracking-widest uppercase mb-4">
              Sobre
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Thauany Santos
            </h2>
            <p className="text-lg text-primary font-medium mb-4">
              Fisioterapia HomeCare
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Sou fisioterapeuta especializada em atendimento domiciliar, 
              comprometida em levar tratamento de qualidade diretamente ao 
              conforto do seu lar. Acredito que cada paciente é único e merece 
              um cuidado personalizado.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Minha missão é proporcionar reabilitação eficaz, prevenção de 
              lesões e melhora da qualidade de vida, sempre com um atendimento 
              humanizado e focado nas necessidades individuais de cada pessoa.
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
