import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const testimonials = [
  {
    id: 1,
    name: "Maria Clara",
    text: "Ambiente maravilhoso e atendimento impecável. Me senti renovada após a sessão de massagem relaxante. Recomendo demais!",
    rating: 5,
  },
  {
    id: 2,
    name: "Juliana Ferreira",
    text: "Profissional extremamente competente e atenciosa. Os tratamentos estéticos fizeram toda a diferença na minha autoestima.",
    rating: 5,
  },
  {
    id: 3,
    name: "Carla Mendes",
    text: "Melhor experiência de spa que já tive. O ambiente é acolhedor e os resultados são visíveis desde a primeira sessão.",
    rating: 5,
  },
  {
    id: 4,
    name: "Ana Paula",
    text: "Thauany é uma profissional incrível! Cuidado e atenção em cada detalhe. Saio sempre renovada das sessões.",
    rating: 5,
  },
  {
    id: 5,
    name: "Fernanda Lima",
    text: "Excelente atendimento e resultados surpreendentes. O TSpa se tornou meu lugar favorito para cuidar de mim mesma.",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section
      id="depoimentos"
      className="py-16 md:py-24 lg:py-32 bg-muted/30"
      data-testid="section-depoimentos"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <span className="inline-block text-primary text-sm font-medium tracking-widest uppercase mb-4">
            Depoimentos
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            O Que Dizem Nossos Clientes
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            A satisfação de quem confia no nosso trabalho é nossa maior recompensa.
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 4000,
              stopOnInteraction: false,
              stopOnMouseEnter: true,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {testimonials.map((testimonial) => (
              <CarouselItem
                key={testimonial.id}
                className="pl-4 md:basis-1/2 lg:basis-1/3"
              >
                <Card
                  className="p-6 md:p-8 h-full"
                  data-testid={`card-testimonial-${testimonial.id}`}
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-primary text-primary"
                      />
                    ))}
                  </div>
                  <p className="text-foreground leading-relaxed mb-6">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <span className="font-medium text-foreground">
                      {testimonial.name}
                    </span>
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-center gap-4 mt-8">
            <CarouselPrevious
              className="static translate-y-0"
              data-testid="button-carousel-prev"
            />
            <CarouselNext
              className="static translate-y-0"
              data-testid="button-carousel-next"
            />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
