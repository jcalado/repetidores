export type QCodeCategory = 'communication' | 'signal' | 'station' | 'technical';

export interface QCode {
  code: string;
  question: string;
  answer: string;
  category: QCodeCategory;
}

export const Q_CODES: QCode[] = [
  // Communication
  { code: 'QRA', question: 'Qual é o nome da sua estação?', answer: 'O nome da minha estação é...', category: 'communication' },
  { code: 'QRK', question: 'Qual é a inteligibilidade dos meus sinais?', answer: 'A inteligibilidade dos seus sinais é...', category: 'communication' },
  { code: 'QRU', question: 'Tem algo para mim?', answer: 'Não tenho nada para si.', category: 'communication' },
  { code: 'QRZ', question: 'Quem me está a chamar?', answer: 'Está a ser chamado por...', category: 'communication' },
  { code: 'QSA', question: 'Qual é a força do meu sinal?', answer: 'A força do seu sinal é...', category: 'communication' },
  { code: 'QSL', question: 'Pode confirmar a receção?', answer: 'Confirmo a receção.', category: 'communication' },
  { code: 'QSO', question: 'Pode comunicar com... diretamente?', answer: 'Posso comunicar com... diretamente.', category: 'communication' },
  { code: 'QSP', question: 'Pode retransmitir para...?', answer: 'Vou retransmitir para...', category: 'communication' },
  { code: 'QTC', question: 'Quantas mensagens tem para transmitir?', answer: 'Tenho ... mensagens para transmitir.', category: 'communication' },

  // Signal Quality
  { code: 'QRI', question: 'Qual é o tom da minha emissão?', answer: 'O tom da sua emissão é...', category: 'signal' },
  { code: 'QRM', question: 'Está a sofrer interferência?', answer: 'Estou a sofrer interferência de outras estações.', category: 'signal' },
  { code: 'QRN', question: 'Está a sofrer estática?', answer: 'Estou a sofrer interferência atmosférica.', category: 'signal' },
  { code: 'QRQ', question: 'Devo transmitir mais rápido?', answer: 'Transmita mais rápido.', category: 'signal' },
  { code: 'QRS', question: 'Devo transmitir mais devagar?', answer: 'Transmita mais devagar.', category: 'signal' },
  { code: 'QSB', question: 'O meu sinal tem desvanecimento?', answer: 'O seu sinal tem desvanecimento (fading).', category: 'signal' },
  { code: 'QSD', question: 'A minha manipulação é defeituosa?', answer: 'A sua manipulação é defeituosa.', category: 'signal' },

  // Station Operations
  { code: 'QRG', question: 'Qual é a minha frequência exata?', answer: 'A sua frequência exata é...', category: 'station' },
  { code: 'QRT', question: 'Devo parar de transmitir?', answer: 'Pare de transmitir.', category: 'station' },
  { code: 'QRV', question: 'Está pronto?', answer: 'Estou pronto.', category: 'station' },
  { code: 'QRX', question: 'Quando me chamará novamente?', answer: 'Chamo-o novamente às...', category: 'station' },
  { code: 'QSX', question: 'Quer escutar em...?', answer: 'Estou a escutar em...', category: 'station' },
  { code: 'QSY', question: 'Devo mudar de frequência?', answer: 'Mude para outra frequência.', category: 'station' },
  { code: 'QSZ', question: 'Devo enviar cada palavra mais de uma vez?', answer: 'Envie cada palavra mais de uma vez.', category: 'station' },
  { code: 'QTH', question: 'Qual é a sua localização?', answer: 'A minha localização é...', category: 'station' },
  { code: 'QTR', question: 'Que horas são?', answer: 'A hora exata é...', category: 'station' },

  // Technical / Power
  { code: 'QRH', question: 'A minha frequência varia?', answer: 'A sua frequência varia.', category: 'technical' },
  { code: 'QRJ', question: 'Está a receber-me bem?', answer: 'Estou a recebê-lo muito fraco.', category: 'technical' },
  { code: 'QRL', question: 'Esta frequência está ocupada?', answer: 'Estou ocupado / esta frequência está ocupada.', category: 'technical' },
  { code: 'QRO', question: 'Devo aumentar a potência?', answer: 'Aumente a potência (alta potência).', category: 'technical' },
  { code: 'QRP', question: 'Devo diminuir a potência?', answer: 'Diminua a potência (baixa potência, <5W).', category: 'technical' },
  { code: 'QRR', question: 'Está pronto para operação automática?', answer: 'Estou pronto para operação automática.', category: 'technical' },
  { code: 'QRW', question: 'Devo informar... que o chama em...?', answer: 'Informe... que o chamo em...', category: 'technical' },
  { code: 'QRY', question: 'Qual é o meu número de turno?', answer: 'O seu número de turno é...', category: 'technical' },
];

export const CATEGORY_LABELS: Record<QCodeCategory, string> = {
  communication: 'Comunicação',
  signal: 'Qualidade do Sinal',
  station: 'Operação de Estação',
  technical: 'Técnico',
};

export function searchQCodes(query: string, category?: QCodeCategory | null): QCode[] {
  const normalizedQuery = query.toLowerCase().trim();

  return Q_CODES.filter((qcode) => {
    const matchesQuery =
      !normalizedQuery ||
      qcode.code.toLowerCase().includes(normalizedQuery) ||
      qcode.question.toLowerCase().includes(normalizedQuery) ||
      qcode.answer.toLowerCase().includes(normalizedQuery);

    const matchesCategory = !category || qcode.category === category;

    return matchesQuery && matchesCategory;
  });
}

export function getQCodesByCategory(category: QCodeCategory): QCode[] {
  return Q_CODES.filter((qcode) => qcode.category === category);
}
