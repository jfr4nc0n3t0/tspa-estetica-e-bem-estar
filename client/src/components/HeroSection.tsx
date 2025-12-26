import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import heroImage from "@assets/generated_images/spa_treatment_room_interior.png";

export default function HeroSection() {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const openWhatsApp = () => {
    const phone = "5511999999999";
    const message = encodeURIComponent("Olá! Gostaria de agendar uma consulta no Essence SPA.");
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      data-testid="section-hero"
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center">
        <span className="inline-block text-white/80 text-sm md:text-base font-medium tracking-widest uppercase mb-4 md:mb-6">
          Fisioterapia & Bem-Estar
        </span>
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6">
          Descubra a Arte do<br />
          <span className="text-primary-foreground">Equilíbrio e Relaxamento</span>
        </h1>
        <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed">
          Experiências exclusivas de fisioterapia e SPA que combinam técnicas terapêuticas 
          com tratamentos relaxantes para restaurar seu corpo e mente.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={openWhatsApp}
            className="rounded-full px-8 py-6 text-lg font-semibold gap-2 bg-green-600 hover:bg-green-700 border-green-700"
            data-testid="button-whatsapp-hero"
          >
            <SiWhatsapp className="h-5 w-5" />
            Agende pelo WhatsApp
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => scrollToSection("#servicos")}
            className="rounded-full px-8 py-6 text-lg font-semibold bg-white/10 backdrop-blur-md text-white border-white/30 hover:bg-white/20 hover:text-white"
            data-testid="button-experiencias-hero"
          >
            Conheça Nossos Serviços
          </Button>
        </div>
      </div>

      <button
        onClick={() => scrollToSection("#sobre")}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 hover:text-white transition-colors animate-bounce"
        aria-label="Rolar para baixo"
        data-testid="button-scroll-down"
      >
        <ChevronDown className="h-8 w-8" />
      </button>
    </section>
  );
}
