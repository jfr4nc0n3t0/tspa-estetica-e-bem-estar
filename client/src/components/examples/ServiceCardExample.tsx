import ServiceCard from "../ServiceCard";
import massageImage from "@assets/generated_images/therapeutic_massage_treatment.png";

export default function ServiceCardExample() {
  return (
    <div className="max-w-sm">
      <ServiceCard
        title="Massagem Terapêutica"
        description="Técnica especializada que combina movimentos profundos e precisos para aliviar tensões musculares."
        image={massageImage}
        duration="60 min"
        price="R$ 180"
        benefits={[
          "Alívio de dores musculares",
          "Redução do estresse",
          "Melhora da circulação",
        ]}
      />
    </div>
  );
}
