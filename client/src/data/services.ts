// Every service photo lives in attached_assets/services/<service-id>/NN.jpg.
// The first file (01.jpg) is the card cover; the rest rotate in the gallery.
const servicePhotos = import.meta.glob<string>("@assets/services/*/*.jpg", {
  eager: true,
  import: "default",
});

function photosOf(serviceId: string): string[] {
  return Object.keys(servicePhotos)
    .filter((path) => path.includes(`/services/${serviceId}/`))
    .sort()
    .map((path) => servicePhotos[path]);
}

/**
 * Picks photos by file name (without ".jpg") from each service folder.
 * Experiences use hand-picked photos so that no photo repeats between experience cards.
 */
function pick(...items: [serviceId: string, fileName: string][]): string[] {
  return items.map(([id, name]) => {
    const path = Object.keys(servicePhotos).find((p) => p.endsWith(`/services/${id}/${name}.jpg`));
    if (!path) throw new Error(`Foto "${name}" não encontrada em ${id}`);
    return servicePhotos[path];
  });
}

export type Session = {
  id: string;
  name: string;
  duration: string;
  characteristic: string;
  phrase: string;
  images: string[];
  note?: string;
};

export type Experience = {
  id: string;
  name: string;
  combination: string;
  characteristic: string;
  phrase: string;
  images: string[];
};

export const massageServices: Session[] = [
  {
    id: "massagem-relaxante",
    name: "Massagem Relaxante",
    duration: "60 min",
    characteristic: "Movimentos suaves e envolventes",
    phrase: "Uma pausa para o corpo e para a mente, que ajuda a aliviar as tensões do dia e proporciona relaxamento, leveza e bem-estar.",
    images: photosOf("massagem-relaxante"),
  },
  {
    id: "drenagem-linfatica",
    name: "Drenagem Linfática",
    duration: "60 min",
    characteristic: "Cuidado delicado e específico",
    phrase: "Movimentos suaves para uma experiência agradável de bem-estar e sensação de leveza.",
    images: photosOf("drenagem-linfatica"),
  },
  {
    id: "liberacao-miofascial",
    name: "Liberação Miofascial",
    duration: "60 min",
    characteristic: "Atenção às regiões de maior tensão",
    phrase: "Técnicas manuais que favorecem a mobilidade, aliviam desconfortos e proporcionam sensação de liberdade ao corpo.",
    images: photosOf("liberacao-miofascial"),
  },
];

export const facialServices: Session[] = [
  {
    id: "hidratacao-facial",
    name: "Hidratação Facial",
    duration: "50 min",
    characteristic: "Viço, conforto e luminosidade",
    phrase: "Cuidados selecionados ajudam a hidratar a pele e deixam uma aparência mais saudável e revitalizada.",
    images: photosOf("hidratacao-facial"),
  },
  {
    id: "limpeza-de-pele",
    name: "Limpeza de Pele",
    duration: "60 min",
    characteristic: "Higienização e cuidado equilibrado",
    phrase: "Um ritual para renovar a pele e recuperar sua aparência saudável, limpa e revitalizada.",
    images: photosOf("limpeza-de-pele"),
  },
];

export const feetRitual: Session[] = [
  {
    id: "ritual-dos-pes",
    name: "Ritual dos Pés",
    duration: "30 min",
    characteristic: "Uma pausa acolhedora para os pés",
    phrase: "Um ritual delicado para desacelerar, aliviar a sensação de cansaço e preparar o corpo para um momento de descanso.",
    images: photosOf("ritual-dos-pes"),
    note: "Disponível como complemento de outro serviço.",
  },
];

export const headSpaServices: Session[] = [
  {
    id: "head-spa-essencial",
    name: "Head Spa Essencial",
    duration: "30 min",
    characteristic: "Para experimentar o Head Spa",
    phrase: "Cuidados no couro cabeludo e movimentos relaxantes para simplesmente desligar.",
    images: photosOf("head-spa-essencial"),
  },
  {
    id: "head-spa-imersao",
    name: "Head Spa Imersão",
    duration: "45 min",
    characteristic: "Cuidado da cabeça ao pescoço",
    phrase: "Uma experiência ampliada para deixar a correria do lado de fora e aproveitar uma pausa mais completa.",
    images: photosOf("head-spa-imersao"),
  },
  {
    id: "head-spa-ritual",
    name: "Head Spa Ritual",
    duration: "60 min",
    characteristic: "A experiência mais completa",
    phrase: "Um ritual prolongado de cuidado e relaxamento para transformar o atendimento em uma verdadeira pausa da rotina.",
    images: photosOf("head-spa-ritual"),
  },
];

export const experiences: Experience[] = [
  {
    id: "ritual-leveza",
    name: "Ritual Leveza",
    combination: "Massagem Relaxante + Ritual dos Pés",
    characteristic: "Relaxamento dos pés ao corpo",
    phrase: "Comece pelos pés e termine com o corpo relaxado. Uma combinação para desacelerar, aliviar tensões e sair mais leve.",
    images: pick(
      ["ritual-dos-pes", "02-massagem-no-balde-vista-de-cima"],
      ["massagem-relaxante", "01-massagem-pescoco-mascara-jade"],
      ["ritual-dos-pes", "03-massagem-nos-pes-com-oleo"],
    ),
  },
  {
    id: "ritual-pele-renovada",
    name: "Ritual Pele Renovada",
    combination: "Limpeza de Pele + Hidratação Facial",
    characteristic: "Um cuidado facial completo",
    phrase: "Um cuidado para renovar e devolver vitalidade à pele, transformando o tratamento facial em um momento de autocuidado.",
    images: pick(
      ["limpeza-de-pele", "01-pele-com-produto-e-lupa"],
      ["hidratacao-facial", "01-pinceis-aplicando-no-rosto"],
      ["limpeza-de-pele", "02-extracao-com-lupa"],
      ["hidratacao-facial", "02-pincel-na-testa-close"],
    ),
  },
  {
    id: "ritual-desacelerar",
    name: "Ritual Desacelerar",
    combination: "Head Spa Imersão + Ritual dos Pés",
    characteristic: "Uma pausa da cabeça aos pés",
    phrase: "Uma experiência sensorial que une acolhimento e descanso para ajudar você a diminuir o ritmo.",
    images: pick(
      ["head-spa-imersao", "01-mascara-jade-arco-de-agua"],
      ["ritual-dos-pes", "04-preparo-do-balde-com-pedras"],
      ["head-spa-imersao", "02-colocando-mascara-jade"],
    ),
  },
  {
    id: "ritual-conexao",
    name: "Ritual Conexão",
    combination: "Head Spa Imersão + Massagem Relaxante",
    characteristic: "Relaxamento que continua pelo corpo",
    phrase: "Uma experiência para se reconectar com você, começando pela cabeça e seguindo pelo corpo.",
    images: pick(
      ["head-spa-imersao", "03-escova-led-couro-cabeludo"],
      ["massagem-relaxante", "02-massagem-rosto-mascara-jade"],
      ["head-spa-imersao", "04-agua-do-arco-nos-cabelos"],
      ["head-spa-imersao", "05-mascara-jade-maos-ao-fundo"],
    ),
  },
  {
    id: "ritual-tspa",
    name: "Ritual TSpa",
    combination: "Head Spa Ritual + Massagem Relaxante + Ritual dos Pés",
    characteristic: "A experiência TSpa mais completa",
    phrase: "Uma jornada de relaxamento para quem deseja reservar um tempo exclusivamente para si.",
    images: pick(
      ["head-spa-ritual", "01-agua-no-pescoco-arco-dourado"],
      ["ritual-dos-pes", "01-pes-na-agua-com-massagem"],
      ["head-spa-ritual", "02-vapor-led-sobre-mascara"],
      ["head-spa-ritual", "03-escova-led-com-vapor"],
      ["head-spa-ritual", "05-preparo-pinceis-e-pedra"],
    ),
  },
];

export const plans = [
  {
    id: "pausa-tspa",
    name: "Pausa TSpa",
    cadence: "Mensal",
    frequency: "1 atendimento por mês",
    benefit: "5% de benefício",
    phrase: "Um momento de cuidado para incluir na rotina, mês a mês.",
  },
  {
    id: "ritmo-tspa",
    name: "Ritmo TSpa",
    cadence: "Quinzenal",
    frequency: "2 atendimentos por mês",
    benefit: "5% de benefício",
    phrase: "Duas pausas no mês para cultivar o bem-estar com regularidade.",
  },
  {
    id: "ciclo-tspa",
    name: "Ciclo TSpa",
    cadence: "Trimestral",
    frequency: "1 atendimento por mês, durante 3 meses",
    benefit: "8% de benefício",
    phrase: "Um ciclo de cuidado contínuo, no seu ritmo.",
  },
  {
    id: "essencia-tspa",
    name: "Essência TSpa",
    cadence: "Semestral",
    frequency: "1 atendimento por mês, durante 6 meses",
    benefit: "10% de benefício",
    phrase: "Mais tempo para fazer do autocuidado parte da rotina.",
  },
];
