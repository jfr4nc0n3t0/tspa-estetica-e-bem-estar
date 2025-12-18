import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Mail, Clock, Send } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

export default function ContactSection() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    mensagem: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Mensagem enviada!",
      description: "Retornaremos em breve. Obrigado pelo contato!",
    });

    setFormData({ nome: "", email: "", telefone: "", mensagem: "" });
    setIsSubmitting(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openWhatsApp = () => {
    const phone = "5583988896935";
    const message = encodeURIComponent(
      "Olá! Gostaria de mais informações sobre o TSpa Estética & Bem-Estar.",
    );
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  return (
    <section
      id="contato"
      className="py-16 md:py-24 lg:py-32 bg-muted/30"
      data-testid="section-contato"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <span className="inline-block text-primary text-sm font-medium tracking-widest uppercase mb-4">
            Contato
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Entre em Contato
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Tire suas dúvidas ou agende sua visita. Estamos prontos para
            atendê-lo.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
          <Card className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Seu nome"
                  required
                  className="mt-2"
                  data-testid="input-nome"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    required
                    className="mt-2"
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    name="telefone"
                    type="tel"
                    value={formData.telefone}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                    className="mt-2"
                    data-testid="input-telefone"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="mensagem">Mensagem</Label>
                <Textarea
                  id="mensagem"
                  name="mensagem"
                  value={formData.mensagem}
                  onChange={handleChange}
                  placeholder="Como podemos ajudá-lo?"
                  rows={4}
                  required
                  className="mt-2 resize-none"
                  data-testid="input-mensagem"
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-full gap-2"
                disabled={isSubmitting}
                data-testid="button-enviar"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? "Enviando..." : "Enviar Mensagem"}
              </Button>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Respondemos em até 2 horas</span>
              </div>
            </form>
          </Card>

          <div className="space-y-6">
            <Card className="p-6 md:p-8">
              <h3 className="font-semibold text-foreground text-lg mb-4">
                Prefere um atendimento mais rápido?
              </h3>
              <p className="text-muted-foreground mb-6">
                Entre em contato diretamente pelo WhatsApp e receba atendimento
                imediato da nossa equipe.
              </p>
              <Button
                onClick={openWhatsApp}
                className="w-full rounded-full gap-2 bg-green-600 hover:bg-green-700"
                size="lg"
                data-testid="button-whatsapp-contato"
              >
                <SiWhatsapp className="h-5 w-5" />
                Conversar no WhatsApp
              </Button>
            </Card>

            <Card className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg mb-1">
                    E-mail
                  </h3>
                  <a
                    href="mailto:contato@essencespa.com.br"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    contato@essencespa.com.br
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
