import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ManifestoSection from "@/components/ManifestoSection";
import AboutSection from "@/components/AboutSection";
import ServicesSection from "@/components/ServicesSection";
import RitualsSection from "@/components/RitualsSection";
import PlansSection from "@/components/PlansSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import LocationSection from "@/components/LocationSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <ManifestoSection />
        <AboutSection />
        <ServicesSection />
        <RitualsSection />
        <PlansSection />
        <HowItWorksSection />
        <LocationSection />
      </main>
      <Footer />
    </div>
  );
}
