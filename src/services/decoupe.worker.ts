// LO-2 : le plan de découpe d'une photo, calculé HORS du fil de la page. C'est le même `planifierImage` que celui de la page (mêmes pixels, même résultat),
// joué dans un Worker avec OffscreenCanvas : la réduction, le papier, l'angle et les rangées (0,5 à 0,9 s sur un PC, davantage sur un téléphone) ne gèlent plus l'onglet.
// Reçoit `{ id, fichier, force }` (le fichier est copié, pas transféré : la page le garde), répond `{ id, plan }` ou `{ id, erreur }`.
import { planifierImage, type PlanImage } from './decoupe';

export interface DemandePlan { id: number; fichier: Blob; force: boolean }
export type ReponsePlan = { id: number; plan: PlanImage | null } | { id: number; erreur: string };

self.onmessage = async (message: MessageEvent<DemandePlan>) => {
  const { id, fichier, force } = message.data;
  let reponse: ReponsePlan;
  try {
    const image = await createImageBitmap(fichier);
    try { reponse = { id, plan: await planifierImage(image, force) }; } finally { image.close(); }
  } catch (erreur) {
    reponse = { id, erreur: erreur instanceof Error ? erreur.message : String(erreur) };
  }
  (self as unknown as { postMessage(m: ReponsePlan): void }).postMessage(reponse);
};
