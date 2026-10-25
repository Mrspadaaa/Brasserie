// Le client asynchrone des calculs lourds de la maquette (#165, D65 § Recommandation 2) : la table des calculs que le
// serveur rend (proposer, suggerer, remplacants, substitutes, leviers levure), et le client que les écrans appellent,
// par le crochet useCalcul (useCalcul.ts). Serveur : le fil principal (premier temps de D65). Un worker persistant (T7)
// servira la même table par postMessage (contrat de src/domain/hopIndex/v4/client.ts), sans toucher aux écrans.
// Mode différé, pour éprouver les écrans sans réponse immédiate : `?calcul=differe` dans l'adresse, ou
// configurerCalcul({ differer: true }) ; chaque réponse arrive alors dans une tâche suivante, comme d'un worker.
import { creerClient, servirSurFilPrincipal, type ClientCalculs, type OptionsFilPrincipal } from '../../../../../src/domain/hopIndex/v4/client';
import type { SubstitutionOptions } from '../../../../../src/domain/hopIndex/v4';
import { leviersLevure, proposer, remplacants, suggerer } from './index';
import { moteur, siDonneesChangent } from './donnees';
import { enPrechauffage, memo } from './mesure';

/** La table servie : fonctions pures et synchrones, arguments et résultats en données simples (clonables). */
// L'échelle du style est un gros objet dérivé de son code : la clé lit le code.
const cleSubstitutes = (cle: string, o: SubstitutionOptions) => JSON.stringify([cle, { ...o, style: o.style?.code ?? null }]);

export const CALCULS = {
  proposer,
  suggerer,
  remplacants,
  /** substitutes du moteur des données injectées (pas celui des fixtures). */
  substitutes: memo('substitutes', cleSubstitutes, (cle: string, options: SubstitutionOptions) => moteur().substitutes(cle, options), 64),
  leviers: leviersLevure,
};
export type CalculsParcours = typeof CALCULS;

const OPTIONS_CLIENT = {
  cles: { substitutes: cleSubstitutes },
};

const differeParAdresse = () => typeof location !== 'undefined' && /[?&]calcul=differe(&|$)/.test(location.search);

let courant: ClientCalculs<CalculsParcours> = creer({ differer: differeParAdresse() });
function creer(o: Pick<OptionsFilPrincipal, 'differer'>): ClientCalculs<CalculsParcours> {
  return creerClient(servirSurFilPrincipal(CALCULS, { differer: o.differer, prechauffage: enPrechauffage }), OPTIONS_CLIENT);
}
siDonneesChangent(() => courant.vider());

/** Le client courant des calculs lourds. */
export const calcul = (): ClientCalculs<CalculsParcours> => courant;
/** Remplace le serveur : fil principal immédiat (défaut) ou différé (réponses dans une tâche suivante). */
export function configurerCalcul(o: { differer?: boolean } = {}): void { courant = creer({ differer: !!o.differer }); }
