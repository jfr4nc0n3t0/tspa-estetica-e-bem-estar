import { MapPin, Clock, Phone, Car } from "lucide-react";

const businessHours = [
  { day: "Segunda a Sexta", hours: "8h às 20h" },
  { day: "Sábado", hours: "9h às 18h" },
  { day: "Domingo", hours: "Fechado" },
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
            Localização
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Venha Nos Visitar
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Estamos localizados em um ambiente tranquilo e de fácil acesso,
            prontos para receber você.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="aspect-square md:aspect-video lg:aspect-square rounded-2xl overflow-hidden shadow-lg">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.1975980395507!2d-46.65512492378619!3d-23.563272578798697!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce59c8da0aa315%3A0xd59f9431f2c9776a!2sAv.%20Paulista%2C%20S%C3%A3o%20Paulo%20-%20SP!5e0!3m2!1spt-BR!2sbr!4v1702838458714!5m2!1spt-BR!2sbr"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização do TSpa Estética & Bem-Estar"
            />
          </div>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg mb-1">
                  Endereço
                </h3>
                <p className="text-muted-foreground">
                  R. Enfermeira Ana Maria Barbosa, 1109
                  <br />
                  J. Cidade Universitária, João Pessoa - PB
                  <br />
                  CEP: 58052-270
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg mb-2">
                  Horário de Funcionamento
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
                  Telefone
                </h3>
                <p className="text-muted-foreground">
                  <a
                    href="tel:+5583988896935"
                    className="hover:text-primary transition-colors"
                  >
                    (83) 98889-6935
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
