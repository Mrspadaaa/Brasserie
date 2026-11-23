// c7 (26.10, #187) : les deux marques des variétés ajoutées (catalogue plein), sur la carte du rail, la ligne d'ajout et la fiche. Tout ce module est chargé
// à la demande (marques.tsx) : hors du morceau des outils (budget B5), et seulement quand un écran affiche un houblon.
// - « peu de données » : moins de deux sources, ou pas d'α ; la variété reste proposée, jamais exclue, mais ne passe pas devant une variété
//   documentée à égalité (D175, côté moteur) ;
// - l'astérisque d'origine non répertoriée : le stock porte « Cascade CHE », la fiche est celle de Cascade (US). Au toucher : « fiche de
//   Cascade (US) ; origine CHE non répertoriée » (règle du 26.10). Seuls les articles du stock écrivent une origine.
import { useState } from 'react';
import { hopRef } from '../parcours/v4';
import { origineDuNom } from '../../../domain/hopIndex/v4/donneesApp';

/** Code d'origine (en minuscules) → pays, en français comme le catalogue. Le premier code d'un pays est celui qu'on écrit à l'écran (« US », « CHE »). */
const PAYS: Readonly<Record<string, string>> = {
  us: 'États-Unis', de: 'Allemagne', gr: 'Allemagne', uk: 'Royaume-Uni', nz: 'Nouvelle-Zélande', au: 'Australie', cz: 'Tchéquie', si: 'Slovénie',
  fr: 'France', ca: 'Canada', za: 'Afrique du Sud', pl: 'Pologne', jp: 'Japon', che: 'Suisse', ch: 'Suisse', ar: 'Argentine',
};
/** Le code court qu'on écrit pour un pays (« US », « CHE ») ; un pays sans code connu s'écrit en toutes lettres. */
export const codeDuPays = (pays: string): string => Object.keys(PAYS).find((k) => PAYS[k] === pays)?.toUpperCase() ?? pays;

/** La phrase d'une origine non répertoriée pour ce houblon, sinon null : un code que la table connaît, différent de l'origine du catalogue. */
export function origineNonRepertoriee(cle: string): { code: string; texte: string } | null {
  const ref = hopRef(cle);
  for (const article of ref?.stock?.items ?? []) {
    const pays = PAYS[origineDuNom(article)?.ecrit.toLowerCase() ?? ''];
    if (!pays || pays === ref!.catalogue.origin) continue;
    const code = codeDuPays(pays), { name, origin } = ref!.catalogue;
    return { code, texte: `fiche de ${name}${origin ? ` (${codeDuPays(origin)})` : ''} ; origine ${code} non répertoriée` };
  }
  return null;
}

/** Rien à marquer ? */
export const marquesDe = (cle: string) => {
  const peu = !!hopRef(cle)?.catalogue.peuDeDonnees, origine = origineNonRepertoriee(cle);
  return peu || origine ? { peu, origine } : null;
};

/** Les marques d'un houblon, en fragment pour une rangée `flex-wrap` : « * » (au toucher, sa phrase sur toute la ligne) et « peu de données ». */
export default function MarquesVue({ cle }: { cle: string }) {
  const [ouvert, setOuvert] = useState(false);
  const m = marquesDe(cle);
  if (!m) return null;
  // Ni l'appui long de la ligne (fiche) ni son toucher ne prennent ces marques.
  const stop = { onPointerDown: (e: React.PointerEvent) => e.stopPropagation() };
  return (
    <>
      {m.origine && <button type="button" data-role="origine-non-repertoriee" aria-expanded={ouvert} aria-label={m.origine.texte} {...stop}
        onClick={(e) => { e.stopPropagation(); setOuvert(!ouvert); }} className="shrink-0 w-6 h-6 -mx-1 font-semibold text-base leading-none text-cave-50">*</button>}
      {m.peu && <span data-role="peu-de-donnees" className="shrink-0 whitespace-nowrap text-xs italic text-cave-400">peu de données</span>}
      {m.origine && ouvert && <span role="note" data-role="origine-note" {...stop} className="basis-full text-sm leading-snug text-cave-200">* {m.origine.texte}</span>}
    </>
  );
}
