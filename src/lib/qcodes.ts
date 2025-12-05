export type QCodeCategory = 'communication' | 'signal' | 'station' | 'technical';

export interface QCode {
  code: string;
  meaning: string;
  category: QCodeCategory;
}

export const Q_CODES: QCode[] = [
  // Communication
  { code: 'QRA', meaning: 'O nome da minha estação é...', category: 'communication' },
  { code: 'QRZ', meaning: 'Quem me está a chamar?', category: 'communication' },
  { code: 'QSL', meaning: 'Confirmo receção', category: 'communication' },
  { code: 'QSO', meaning: 'Posso comunicar com... diretamente', category: 'communication' },
  { code: 'QSP', meaning: 'Pode retransmitir para...?', category: 'communication' },
  { code: 'QRK', meaning: 'Qual é a inteligibilidade do meu sinal?', category: 'communication' },
  { code: 'QSA', meaning: 'Qual é a força do meu sinal?', category: 'communication' },
  { code: 'QRU', meaning: 'Não tenho nada para si', category: 'communication' },
  { code: 'QTC', meaning: 'Tenho mensagens para transmitir', category: 'communication' },

  // Signal Quality
  { code: 'QRM', meaning: 'Interferência de outras estações', category: 'signal' },
  { code: 'QRN', meaning: 'Interferência atmosférica (estática)', category: 'signal' },
  { code: 'QSB', meaning: 'O seu sinal está com desvanecimento (fading)', category: 'signal' },
  { code: 'QRS', meaning: 'Transmita mais devagar', category: 'signal' },
  { code: 'QRQ', meaning: 'Transmita mais rápido', category: 'signal' },
  { code: 'QSD', meaning: 'A sua manipulação é defeituosa', category: 'signal' },
  { code: 'QRI', meaning: 'A tonalidade da sua emissão é...', category: 'signal' },

  // Station Operations
  { code: 'QTH', meaning: 'A minha localização é...', category: 'station' },
  { code: 'QSY', meaning: 'Mude para outra frequência', category: 'station' },
  { code: 'QRX', meaning: 'Aguarde, chamarei novamente às...', category: 'station' },
  { code: 'QRT', meaning: 'Pare de transmitir / Vou desligar', category: 'station' },
  { code: 'QRV', meaning: 'Estou pronto para receber', category: 'station' },
  { code: 'QRG', meaning: 'A minha frequência exata é...', category: 'station' },
  { code: 'QTR', meaning: 'A hora exata é...', category: 'station' },
  { code: 'QSX', meaning: 'Estou a escutar em...', category: 'station' },
  { code: 'QSZ', meaning: 'Envie cada grupo ou palavra mais de uma vez', category: 'station' },

  // Technical / Power
  { code: 'QRP', meaning: 'Operação com baixa potência (< 5W)', category: 'technical' },
  { code: 'QRO', meaning: 'Operação com alta potência', category: 'technical' },
  { code: 'QRH', meaning: 'A sua frequência varia', category: 'technical' },
  { code: 'QRJ', meaning: 'Estou a recebê-lo muito fraco', category: 'technical' },
  { code: 'QRL', meaning: 'Estou ocupado / Esta frequência está ocupada?', category: 'technical' },
  { code: 'QRR', meaning: 'Estou pronto para operação automática', category: 'technical' },
  { code: 'QRW', meaning: 'Informe... que o chamo em...', category: 'technical' },
  { code: 'QRY', meaning: 'O seu número de turno é...', category: 'technical' },
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
      qcode.meaning.toLowerCase().includes(normalizedQuery);

    const matchesCategory = !category || qcode.category === category;

    return matchesQuery && matchesCategory;
  });
}

export function getQCodesByCategory(category: QCodeCategory): QCode[] {
  return Q_CODES.filter((qcode) => qcode.category === category);
}
