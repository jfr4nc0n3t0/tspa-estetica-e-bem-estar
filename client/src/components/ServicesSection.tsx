import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Sparkles } from "lucide-react";

import relaxingMassageImg from "@assets/stock_images/relaxing_back_massag_e4667eea.jpg";
import drainageImg from "@assets/stock_images/lymphatic_drainage_m_f1921d3f.jpg";
import modelingImg from "@assets/modeladora_1766783752585.jpeg";
import therapeuticImg from "@assets/image_1766783818873.png";
import cleansingImg from "@assets/stock_images/facial_cleansing_ski_d9bbf67e.jpg";
import hydrationImg from "@assets/stock_images/facial_hydration_mas_2644cfa8.jpg";
import clayMaskImg from "@assets/WhatsApp_Image_2025-12-26_at_18.12.46_1766783677163.jpeg";
import packageImg from "@assets/stock_images/spa_wellness_package_e0a465e6.jpg";

const massageServices = [
  {
    id: 1,
    name: "Massagem Relaxante",
    duration: "60 min",
    description: "Indicada para aliviar estresse, ansiedade e tensão muscular. Utiliza óleos aromáticos e manobras lentas, promovendo relaxamento profundo e bem-estar.",
    price: "R$ 100",
    bonus: "inclui escalda pés",
    image: relaxingMassageImg,
  },
  {
    id: 2,
    name: "Drenagem Linfática",
    duration: "60 min",
    description: "Técnica com movimentos suaves e ritmados que auxiliam na redução de inchaço, retenção de líquidos e melhora da circulação.",
    price: "R$ 120",
    image: drainageImg,
  },
  {
    id: 3,
    name: "Massagem Modeladora",
    duration: "50 min",
    description: "Massagem com manobras mais intensas, focada em abdômen, cintura, coxas e glúteos, auxiliando na melhora do contorno corporal.",
    price: "R$ 110",
    image: modelingImg,
  },
  {
    id: 4,
    name: "Massagem Terapêutica / Liberação Miofascial",
    duration: "60 min",
    description: "Indicada para dores musculares, tensões crônicas e desconfortos nas costas, pescoço e lombar.",
    price: "R$ 130",
    image: therapeuticImg,
  },
];

const facialServices = [
  {
    id: 1,
    name: "Limpeza de Pele Express",
    duration: "40 min",
    description: "Higienização profunda, esfoliação e aplicação de máscara revitalizante, deixando a pele mais limpa e renovada.",
    price: "R$ 80",
    image: cleansingImg,
  },
  {
    id: 2,
    name: "Hidratação Facial Profunda",
    duration: "30 min",
    description: "Tratamento indicado para peles secas ou opacas, devolvendo maciez, viço e conforto à pele.",
    price: "R$ 70",
    image: hydrationImg,
  },
  {
    id: 3,
    name: "Revitalização com Máscara de Argila",
    duration: "30 min",
    description: "Auxilia no equilíbrio da pele, promove ação calmante e devolve luminosidade natural.",
    price: "R$ 65",
    image: clayMaskImg,
  },
];

const packages = [
  {
    id: 1,
    name: "Plano Quinzenal",
    sessions: "2 sessões/mês",
    duration: "60 min cada",
    description: "Pode escolher entre massagem relaxante, drenagem linfática ou modeladora. (Não inclui massagem terapêutica)",
    price: "R$ 190",
    highlight: false,
    image: relaxingMassageImg,
  },
  {
    id: 2,
    name: "Plano Mensal",
    sessions: "4 sessões/mês",
    duration: "60 min cada",
    description: "Pode escolher entre massagem relaxante, drenagem linfática ou modeladora. (Não inclui massagem terapêutica)",
    price: "R$ 320",
    highlight: true,
    image: drainageImg,
  },
  {
    id: 3,
    name: "Plano Trimestral",
    sessions: "12 sessões (3 meses)",
    duration: "60 min cada",
    description: "Pode escolher entre massagem relaxante, drenagem linfática ou modeladora. (Não inclui massagem terapêutica)",
    price: "R$ 870",
    highlight: false,
    image: modelingImg,
  },
  {
    id: 4,
    name: "Combo Bem-estar",
    sessions: "Massagem + Hidratação Facial",
    duration: "90 min total",
    description: "Massagem relaxante (60 min) + hidratação facial (30 min). Uma combinação para relaxar o corpo e cuidar da pele em uma única sessão.",
    price: "R$ 140",
    highlight: true,
    image: packageImg,
  },
];

function ServiceCard({ service }: { service: typeof massageServices[0] }) {
  return (
    <Card className="overflow-hidden group" data-testid={`card-service-${service.id}`}>
      <div className="relative h-48 overflow-hidden">
        <img
          src={service.image}
          alt={service.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="font-semibold text-white text-lg">{service.name}</h3>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{service.duration}</span>
          {service.bonus && (
            <Badge variant="secondary" className="text-xs">
              {service.bonus}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          {service.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary">{service.price}</span>
        </div>
      </div>
    </Card>
  );
}

function PackageCard({ pkg }: { pkg: typeof packages[0] }) {
  return (
    <Card
      className={`overflow-hidden group ${pkg.highlight ? "ring-2 ring-primary" : ""}`}
      data-testid={`card-package-${pkg.id}`}
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={pkg.image}
          alt={pkg.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        {pkg.highlight && (
          <Badge className="absolute top-3 right-3">
            Popular
          </Badge>
        )}
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="font-semibold text-white text-lg">{pkg.name}</h3>
        </div>
      </div>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="outline" className="text-xs">
            {pkg.sessions}
          </Badge>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="text-xs">{pkg.duration}</span>
          </div>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          {pkg.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">{pkg.price}</span>
        </div>
      </div>
    </Card>
  );
}

export default function ServicesSection() {
  return (
    <section
      id="servicos"
      className="py-16 md:py-24 lg:py-32"
      data-testid="section-servicos"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-primary text-sm font-medium tracking-widest uppercase mb-4">
            Nossos Serviços
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Tratamentos Exclusivos
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Oferecemos uma variedade de tratamentos para cuidar do seu corpo e mente.
          </p>
        </div>

        <div className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="h-6 w-6 text-primary" />
            <h3 className="text-2xl font-serif font-bold text-foreground">Massagens</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {massageServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>

        <div className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="h-6 w-6 text-primary" />
            <h3 className="text-2xl font-serif font-bold text-foreground">Tratamentos Faciais</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {facialServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="h-6 w-6 text-primary" />
            <h3 className="text-2xl font-serif font-bold text-foreground">Pacotes e Planos</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
