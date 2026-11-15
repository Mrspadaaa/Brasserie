/** Données de démonstration : celles du jeu de départ (CR-00n) et celles des bancs (DEMO-…). Une pastille « démo » les marque. */
export const estDemo = (id: string): boolean => /^(DEMO|CR-00\d)/.test(id);
