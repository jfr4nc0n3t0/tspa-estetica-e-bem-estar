import { Card } from "@/components/ui/card";
import { Clock, Sparkles, LucideIcon } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SiWhatsapp } from "react-icons/si";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  duration: string;
  benefits: string[];
}

export default function ServiceCard({
  title,
  description,
  icon: Icon,
  duration,
  benefits,
}: ServiceCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openWhatsApp = () => {
    const phone = "5583999999999";
    const message = encodeURIComponent(`Olá! Gostaria de agendar uma sessão de ${title} com a Dra. Thauany Santos.`);
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  return (
    <>
      <Card
        className="group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg p-6"
        onClick={() => setIsOpen(true)}
        data-testid={`card-service-${title.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
          {description}
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{duration}</span>
        </div>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg" data-testid={`modal-service-${title.toLowerCase().replace(/\s+/g, "-")}`}>
          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="font-serif text-2xl">{title}</DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Duração: {duration}</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Benefícios
              </h4>
              <ul className="space-y-1">
                {benefits.map((benefit, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            <Button
              onClick={openWhatsApp}
              className="w-full rounded-full gap-2"
              data-testid="button-whatsapp-modal"
            >
              <SiWhatsapp className="h-5 w-5" />
              Agendar este Serviço
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
