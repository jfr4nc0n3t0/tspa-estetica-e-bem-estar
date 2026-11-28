/**
 * Mensagens de clientes, exatamente como chegaram (WhatsApp e comentários do Instagram).
 * Não corrigir nem resumir: só os nomes ficam de fora.
 * `highlights` são trechos da própria mensagem que ficam em negrito; precisam existir no texto, letra por letra.
 */
export type Testimonial = {
  id: string;
  text: string;
  /** Horário da mensagem, como aparece no print */
  time?: string;
  /** Cuidado citado na própria mensagem */
  tag?: string;
  highlights: string[];
};

export const INSTAGRAM_FEEDBACK_POST = "https://www.instagram.com/p/DfcdY0DFaDI/";

/** A mensagem em destaque, sobre a foto do espaço */
export const featuredTestimonial: Testimonial = {
  id: "refugio-para-a-alma",
  text: "Amei demais meu momento... Uma pausa necessária depois de dias intensos, um refúgio para a alma, literalmente. 🥹🤍\n\nGostei de tudo, desde o acolhimento pelo WhatsApp até o aconchego do seu espaço. Cada detalhe me convidava ao relaxamento. Relaxei tanto que saí de lá leve como uma pluma, rsrs.\n\nObrigada por todo o cuidado, desde a recepção até o atendimento. Me senti verdadeiramente cuidada e, sem dúvidas, vou voltar mais vezes. Porque eu necessito e MUITO!\n\nParabéns por toda a dedicação! 👏🏽🥰",
  time: "16:09",
  highlights: ["um refúgio para a alma, literalmente.", "Relaxei tanto que saí de lá leve como uma pluma"],
};

export const testimonials: Testimonial[] = [
  {
    id: "melhores-presentes",
    text: "Amiga, amei a experiência! Foi maravilhoso aproveitar esse momento de cuidado e relaxamento porque eu tava precisando demaissss, um dos melhores presentes que ganhei, hahaha. O ambiente lindo e aconchegante, saí de lá leve! Obrigada pelo carinho e parabéns por tudo, desejo muito sucesso pra vocês! 🤍",
    time: "10:18",
    tag: "Presente",
    highlights: ["um dos melhores presentes que ganhei"],
  },
  {
    id: "massagem-limpeza",
    text: "Muito bom! Adorei o ambiente, a música, o chá e a massagem foi maravilhosa\nA limpeza de pele ficou excelente!!",
    time: "21:02",
    tag: "Massagem · Limpeza de pele",
    highlights: ["a massagem foi maravilhosa"],
  },
  {
    id: "dores-aliviadas",
    text: "Bom dia!\n\nMuito boa a experiência, as dores foram aliviadas e a profissional que fez o procedimento conhece e sabe o que está fazendo realmente.\n\nVoltarei mais vezes, pode ter certeza.",
    time: "11:17",
    highlights: ["as dores foram aliviadas"],
  },
  {
    id: "toda-certeza",
    text: "Olá, bom dia!\n\nFoi maravilhoso, amei o resultado e a experiência. Voltarei mais vezes, com toda certeza 🥰",
    time: "08:43",
    highlights: ["Voltarei mais vezes, com toda certeza"],
  },
  {
    id: "conexao",
    text: "Foi uma experiência muito especial! Um momento de cuidado, tranquilidade e conexão comigo mesma. Gostei muito de poder desacelerar. Obrigada pelo carinho e pela atenção ! ✨🤎",
    time: "15:52",
    highlights: ["conexão comigo mesma"],
  },
  {
    id: "verdadeiro-relaxamento",
    text: "Olá!\nAmbiente e atendimento maravilhosos. Foi uma experiência de verdadeiro relaxamento.\nAgradeço",
    time: "18:53",
    highlights: ["verdadeiro relaxamento"],
  },
  {
    id: "amei-tudo",
    text: "AMEI TUDO",
    highlights: [],
  },
];

/** Comentários públicos no post de feedbacks do Instagram */
export const instagramComments = [
  "Esse lugar nos acolhe com tanta suavidade que esquecemos do mundo lá fora, amooo😍",
  "Concordo com todosss, que lugar aconchegante e sem falar da competência da profissional. Já quero voltar mais vezes e vivenciar mais experiências. 👏🏽🤍",
  "Realmente, concordo com todos. Ambiente acolhedor, profissional sem igual e experiências que valem a pena. 🤍",
];
