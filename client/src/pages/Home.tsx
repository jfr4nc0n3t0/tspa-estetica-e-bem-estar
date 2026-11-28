import { useEffect, useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ManifestoSection from "@/components/ManifestoSection";
import AboutSection from "@/components/AboutSection";
import ServicesSection from "@/components/ServicesSection";
import RitualsSection from "@/components/RitualsSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import PackagesSection from "@/components/PackagesSection";
import GiftSection from "@/components/GiftSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import LocationSection from "@/components/LocationSection";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import FirstVisitBanner from "@/components/FirstVisitBanner";
import { useScrollZone } from "@/lib/useScrollZone";

export default function Home() {
  // Elementos flutuantes: o convite de primeira visita tem a vez; no celular, o WhatsApp aparece quando ele não está aberto.
  // Fechar o convite vale só até recarregar a página.
  const zone = useScrollZone();
  const [bannerClosed, setBannerClosed] = useState(false);
  const inMiddle = zone.pastHero && !zone.nearFooter;
  const bannerShown = inMiddle && !bannerClosed && !zone.inviteOnScreen;

  // Vindo de outra página com link para uma seção (ex.: /#servicos), rola até ela depois de montar
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "instant" }));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <ManifestoSection />
        <AboutSection />
        <ServicesSection />
        <RitualsSection />
        <PackagesSection />
        <GiftSection />
        <TestimonialsSection />
        <HowItWorksSection />
        <LocationSection />
      </main>
      <Footer />
      <FirstVisitBanner shown={bannerShown} onClose={() => setBannerClosed(true)} />
      <FloatingWhatsApp shown={inMiddle && !bannerShown} />
    </div>
  );
}
