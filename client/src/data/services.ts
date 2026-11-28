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
 * Ponto de foco de cada foto (CSS object-position), para o corte do card manter o que importa:
 * as fotos horizontais viram retrato no card e, cortadas pelo centro, perdiam as mãos e o rosto.
 * Fotos sem entrada aqui são cortadas pelo centro.
 */
const photoFocusByFile: Record<string, string> = {
  "massagem-relaxante/01-massagem-pescoco-mascara-jade": "72% 50%",
  "massagem-relaxante/02-massagem-rosto-mascara-jade": "64% 50%",
  "limpeza-de-pele/01-pele-com-produto-e-lupa": "64% 50%",
  "limpeza-de-pele/02-extracao-com-lupa": "38% 50%",
  "limpeza-de-pele/03-terapeuta-cuidando-da-pele": "48% 50%",
  "head-spa-ritual/01-agua-no-pescoco-arco-dourado": "50% 35%",
};

const focusByUrl = new Map(
  Object.entries(servicePhotos).flatMap(([path, url]) => {
    const key = Object.keys(photoFocusByFile).find((k) => path.endsWith(`/services/${k}.jpg`));
    return key ? [[url, photoFocusByFile[key]] as const] : [];
  }),
);

/** Ponto de foco da foto (pela URL), ou undefined para cortar pelo centro */
export const photoFocus = (url: string) => focusByUrl.get(url);

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

/** Foto do convite de primeira visita (Head Spa): rosto relaxado no centro, funciona pequena */
export const firstVisitPhoto = pick(["head-spa-imersao", "01-mascara-jade-arco-de-agua"])[0];

export type Session = {
  id: string;
  name: string;
  duration: string;
  characteristic: string;
  phrase: string;
  images: string[];
  /** Preço avulso, em reais */
  price: number;
  /** Preço quando vem junto de outro cuidado (Ritual dos Pés) */
  addOnPrice?: number;
  /** Selo "Novidade" no card */
  isNew?: boolean;
};

export type Experience = {
  id: string;
  name: string;
  /** Duração total (soma dos serviços que compõem o ritual) */
  duration: string;
  combination: string;
  characteristic: string;
  phrase: string;
  images: string[];
  /** Preço do ritual, em reais */
  price: number;
  /** Soma dos cuidados feitos separados. Só existe quando o ritual tem economia de verdade. */
  separatePrice?: number;
};

export const massageServices: Session[] = [
  {
    id: "massagem-relaxante",
    price: 130,
    name: "Massagem Relaxante",
    duration: "60 min",
    characteristic: "Movimentos suaves e envolventes",
    phrase: "Uma pausa para o corpo e para a mente, que ajuda a aliviar as tensões do dia e proporciona relaxamento, leveza e bem-estar.",
    images: photosOf("massagem-relaxante"),
  },
  {
    id: "drenagem-linfatica",
    price: 150,
    name: "Drenagem Linfática",
    duration: "60 min",
    characteristic: "Cuidado delicado e específico",
    phrase: "Movimentos suaves para uma experiência agradável de bem-estar e sensação de leveza.",
    images: photosOf("drenagem-linfatica"),
  },
  {
    id: "liberacao-miofascial",
    price: 150,
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
    price: 110,
    name: "Hidratação Facial",
    duration: "50 min",
    characteristic: "Viço, conforto e luminosidade",
    phrase: "Cuidados selecionados ajudam a hidratar a pele e deixam uma aparência mais saudável e revitalizada.",
    images: photosOf("hidratacao-facial"),
  },
  {
    id: "limpeza-de-pele",
    price: 120,
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
    price: 55,
    addOnPrice: 35,
    name: "Ritual dos Pés",
    duration: "30 min",
    characteristic: "Uma pausa acolhedora para os pés",
    phrase: "Um ritual delicado para desacelerar, aliviar a sensação de cansaço e preparar o corpo para um momento de descanso.",
    images: photosOf("ritual-dos-pes"),
  },
];

export const headSpaServices: Session[] = [
  {
    id: "head-spa-essencial",
    price: 130,
    isNew: true,
    name: "Head Spa Essencial",
    duration: "30 min",
    characteristic: "Para experimentar o Head Spa",
    phrase: "Cuidados no couro cabeludo e movimentos relaxantes para simplesmente desligar.",
    images: photosOf("head-spa-essencial"),
  },
  {
    id: "head-spa-imersao",
    price: 170,
    isNew: true,
    name: "Head Spa Imersão",
    duration: "45 min",
    characteristic: "Cuidado da cabeça ao pescoço",
    phrase: "Uma experiência ampliada para deixar a correria do lado de fora e aproveitar uma pausa mais completa.",
    images: photosOf("head-spa-imersao"),
  },
  {
    id: "head-spa-ritual",
    price: 230,
    isNew: true,
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
    price: 165,
    duration: "1h30",
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
    price: 205,
    separatePrice: 230,
    duration: "1h50",
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
    price: 205,
    duration: "1h15",
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
    price: 270,
    separatePrice: 300,
    duration: "1h45",
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
    price: 345,
    separatePrice: 395,
    duration: "2h30",
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

/** Formata um valor em reais sem centavos: 1020 → "R$ 1.020" */
export const brl = (value: number) => `R$ ${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

export type Package = {
  id: string;
  name: string;
  /** Ritmo das sessões */
  cadence: string;
  sessions: number;
  /** Prazo para usar as sessões */
  months: number;
  discount: number;
  /** Mimo extra do pacote */
  bonus?: string;
  phrase: string;
  /** Exemplos de valor: preço avulso somado → preço do pacote */
  examples: { service: string; full: number; price: number }[];
};

/** Pacotes pagos de uma vez, com prazo para usar (podem ser parcelados no cartão) */
export const packages: Package[] = [
  {
    id: "ciclo-tspa",
    name: "Ciclo TSpa",
    cadence: "Uma por mês",
    sessions: 3,
    months: 3,
    discount: 10,
    phrase: "Um ciclo de cuidado contínuo, no seu ritmo.",
    examples: [
      { service: "Massagem Relaxante", full: 390, price: 350 },
      { service: "Head Spa Imersão", full: 510, price: 460 },
    ],
  },
  {
    id: "ritmo-tspa",
    name: "Ritmo TSpa",
    cadence: "Uma a cada 15 dias",
    sessions: 4,
    months: 2,
    discount: 12,
    phrase: "Duas pausas no mês para cultivar o bem-estar com regularidade.",
    examples: [
      { service: "Massagem Relaxante", full: 520, price: 460 },
      { service: "Head Spa Imersão", full: 680, price: 600 },
    ],
  },
  {
    id: "essencia-tspa",
    name: "Essência TSpa",
    cadence: "Uma por mês",
    sessions: 6,
    months: 6,
    discount: 15,
    bonus: "1 Ritual dos Pés de presente",
    phrase: "Mais tempo para fazer do autocuidado parte da rotina.",
    examples: [
      { service: "Massagem Relaxante", full: 780, price: 660 },
      { service: "Head Spa Imersão", full: 1020, price: 870 },
    ],
  },
];

/** Sugestões de vale-presente (qualquer cuidado também vira presente): transferível, vale 30 dias a partir da data do presente */
export const giftCards = [
  { id: "vale-130", label: "O primeiro presente", price: 130, item: "Head Spa Essencial · 30 min" },
  { id: "vale-270", label: "Da cabeça ao corpo", price: 270, item: "Ritual Conexão · Head Spa + massagem" },
  { id: "vale-345", label: "O presente especial", price: 345, item: "Ritual TSpa · a experiência completa" },
];
