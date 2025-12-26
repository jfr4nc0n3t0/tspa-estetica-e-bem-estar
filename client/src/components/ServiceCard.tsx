import { Card } from "@/components/ui/card";
import { Clock, Sparkles } from "lucide-react";
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
  image: string;
  duration: string;
  benefits: string[];
  price?: string;
}

export default function ServiceCard({
  title,
  description,
  image,
  duration,
  benefits,
  price,
}: ServiceCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openWhatsApp = () => {
    const phone = "5583988896935";
    const message = encodeURIComponent(`Olá! Gostaria de agendar o serviço: ${title}`);
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  return (
    <>
      <Card
        className="group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg"
        onClick={() => setIsOpen(true)}
        data-testid={`card-service-${title.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <div className="aspect-video overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="p-6">
          <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
            {description}
          </p>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{duration}</span>
            </div>
            {price && (
              <span className="text-primary font-semibold">{price}</span>
            )}
          </div>
        </div>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg" data-testid={`modal-service-${title.toLowerCase().replace(/\s+/g, "-")}`}>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">{title}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-video rounded-lg overflow-hidden">
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Duração: {duration}</span>
              </div>
              {price && (
                <span className="text-primary font-semibold text-lg">{price}</span>
              )}
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
              className="w-full rounded-full gap-2 bg-green-600 hover:bg-green-700"
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
