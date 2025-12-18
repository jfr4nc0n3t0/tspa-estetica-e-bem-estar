import { MapPin, Clock, Phone, Home } from "lucide-react";

const businessHours = [
  { day: "Segunda a Sexta", hours: "7h às 19h" },
  { day: "Sábado", hours: "8h às 14h" },
  { day: "Domingo", hours: "Sob demanda" },
];

export default function LocationSection() {
  return (
    <section
      id="localizacao"
      className="py-16 md:py-24 lg:py-32 bg-background"
      data-testid="section-localizacao"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <span className="inline-block text-primary text-sm font-medium tracking-widest uppercase mb-4">
            Atendimento
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Área de Atendimento
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Atendimento domiciliar em João Pessoa e região metropolitana.
            Levo o cuidado até você!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="aspect-square md:aspect-video lg:aspect-square rounded-2xl overflow-hidden shadow-lg">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126847.47422917765!2d-34.94584582929688!3d-7.119477349999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7ace839022b7a35%3A0x7ace839022b7a35!2sJo%C3%A3o%20Pessoa%2C%20PB!5e0!3m2!1spt-BR!2sbr!4v1702838458714!5m2!1spt-BR!2sbr"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Área de atendimento - João Pessoa e região"
            />
          </div>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg mb-1">
                  Atendimento Domiciliar
                </h3>
                <p className="text-muted-foreground">
                  João Pessoa e região metropolitana
                  <br />
                  Cabedelo, Bayeux, Santa Rita
                  <br />
                  Conde e praias próximas
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg mb-2">
                  Horário de Atendimento
                </h3>
                <div className="space-y-1">
                  {businessHours.map((schedule) => (
                    <div
                      key={schedule.day}
                      className="flex justify-between gap-4 text-muted-foreground"
                    >
                      <span>{schedule.day}</span>
                      <span className="font-medium">{schedule.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg mb-1">
                  Telefone / WhatsApp
                </h3>
                <p className="text-muted-foreground">
                  <a
                    href="tel:+5583999999999"
                    className="hover:text-primary transition-colors"
                  >
                    (83) 99999-9999
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg mb-1">
                  Como Funciona
                </h3>
                <p className="text-muted-foreground">
                  Agende seu atendimento pelo WhatsApp.
                  <br />
                  Vou até você com todo o equipamento necessário
                  <br />
                  para realizar o tratamento no conforto do seu lar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
