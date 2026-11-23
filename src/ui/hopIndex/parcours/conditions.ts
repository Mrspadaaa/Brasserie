// Conditions par défaut des ajouts proposés (dose, jours de contact, jour de début, levure supposée) : des règles du
// parcours, pas des données du brasseur. Venues de `prototypes/houblons-v4/parcours/src/donnees/cas.ts` (T12, #170), qui les
// réexporte.
export const CONDITIONS = {
  doseGL: 4,
  jours: 3,
  jourDebut: { dryActive: 2, dryPost: 7 } as const,
  levure: 'fermentis-us05',
};
