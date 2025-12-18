import { Button } from "@/components/ui/button";
import { ChevronDown, Home, Heart, Shield } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

export default function HeroSection() {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const openWhatsApp = () => {
    const phone = "5583999999999";
    const message = encodeURIComponent("Olá! Gostaria de agendar um atendimento de fisioterapia domiciliar com a Dra. Thauany Santos.");
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-secondary via-secondary/90 to-primary/20"
      data-testid="section-hero"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(163_100%_39%/0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(163_100%_39%/0.1),transparent_50%)]" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 lg:px-8 text-center py-20">
        <div className="inline-flex items-center gap-2 bg-primary/20 text-primary-foreground/90 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Home className="h-4 w-4" />
          <span>Atendimento Domiciliar Especializado</span>
        </div>
        
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6">
          Fisioterapia no<br />
          <span className="text-primary">Conforto do Seu Lar</span>
        </h1>
        
        <p className="text-lg md:text-xl text-white/85 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed">
          Tratamento fisioterapêutico personalizado com atendimento domiciliar. 
          Cuidado profissional, humanizado e focado na sua recuperação.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Button
            size="lg"
            onClick={openWhatsApp}
            className="rounded-full px-8 py-6 text-lg font-semibold gap-2 bg-primary hover:bg-primary/90"
            data-testid="button-whatsapp-hero"
          >
            <SiWhatsapp className="h-5 w-5" />
            Agende Seu Atendimento
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => scrollToSection("#servicos")}
            className="rounded-full px-8 py-6 text-lg font-semibold bg-white/10 backdrop-blur-md text-white border-white/30 hover:bg-white/20 hover:text-white"
            data-testid="button-servicos-hero"
          >
            Conheça os Serviços
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 text-white/90">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold">Atendimento</p>
              <p className="text-sm text-white/70">Domiciliar</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 text-white/90">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold">Cuidado</p>
              <p className="text-sm text-white/70">Humanizado</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 text-white/90">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold">Profissional</p>
              <p className="text-sm text-white/70">Qualificada</p>
            </div>
          </div>
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
