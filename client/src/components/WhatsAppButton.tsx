import { SiWhatsapp } from "react-icons/si";

export default function WhatsAppButton() {
  const openWhatsApp = () => {
    const phone = "5511999999999";
    const message = encodeURIComponent("Olá! Gostaria de agendar uma consulta no Essence SPA.");
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  return (
    <button
      onClick={openWhatsApp}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-105"
      aria-label="Contato via WhatsApp"
      data-testid="button-whatsapp-float"
    >
      <SiWhatsapp className="h-7 w-7" />
    </button>
  );
}
