// Le client asynchrone des calculs lourds de la maquette (#165, D65 § Recommandation 2) : la table des calculs
// (calculs.ts) et le client que les écrans appellent, par le crochet useCalcul (useCalcul.ts).
// Serveurs (#171) :
// - page servie par HTTP(S), navigateur avec worker : le WORKER PERSISTANT (calcul.worker.ts, transport de
//   src/ui/hopIndex/hopToolsTransport.ts), un seul pour la session, alimenté par les données injectées. Il sert les
//   préchauffages et les recalculs ; une première ouverture sans résultat préchauffé reste servie sur le fil principal
//   (repli synchrone, option b) : aucun écran ne naît vide, aucun état d'attente ;
// - page file:// (maquette publiée, contrôles), worker indisponible ou en panne : le fil principal, comme avant ;
// - `?calcul=immediat` : le fil principal, même servi par HTTP (captures comparées) ;
// - `?recalcul=worker` (avec le worker) : un recalcul absent des réponses gardées part au worker et l'écran garde son
//   dernier résultat ; sans lui (défaut), il est calculé sur le fil principal comme avant (useCalcul.ts dit pourquoi) ;
// - `?calcul=differe` : le fil principal, chaque réponse dans une tâche suivante et sans repli synchrone (T6b : éprouve
//   un écran sans réponse immédiate). configurerCalcul({ differer: true }) fait de même.
import { creerClient, servirSurFilPrincipal, type ClientCalculs, type OptionsFilPrincipal } from '../../../../../src/domain/hopIndex/v4/client';
import { servirParWorker, type ServeurWorker } from '../../../../../src/ui/hopIndex/hopToolsTransport';
import { CALCULS, type CalculsParcours } from './calculs';
import { OPTIONS_CLIENT, poserClient } from '../../../../../src/ui/hopIndex/parcours/calcul';
import { donneesClonables, siDonneesChangent } from './donnees';
import { enPrechauffage } from './mesure';

export { CALCULS, type CalculsParcours } from './calculs';

type Mode = 'immediat' | 'differe' | 'worker';
const modeParAdresse = (): Mode => {
  if (typeof location === 'undefined' || typeof window === 'undefined') return 'immediat';
  const m = /[?&]calcul=(differe|immediat|worker)(&|$)/.exec(location.search)?.[1] as Mode | undefined;
  if (m) return m;
  return /^https?:$/.test(location.protocol) && typeof Worker !== 'undefined' ? 'worker' : 'immediat';
};

const filPrincipal = (differer: boolean) => servirSurFilPrincipal(CALCULS, { differer, prechauffage: enPrechauffage });

let transport: ServeurWorker<CalculsParcours> | null = null;
function creer(mode: Mode): ClientCalculs<CalculsParcours> {
  transport?.fermer?.();
  transport = null;
  if (mode === 'worker') {
    const repli = filPrincipal(false) as ReturnType<typeof filPrincipal> & { servirTout: NonNullable<ReturnType<typeof filPrincipal>['servirTout']> };
    transport = servirParWorker<CalculsParcours>({
      creer: () => new Worker(new URL('./calcul.worker.ts', import.meta.url)) as never,
      repli,
      donnees: donneesClonables,
      surRepli: (raison) => console.warn(`[t7] calculs sur le fil principal : ${raison}`),
    });
    return creerClient(transport, OPTIONS_CLIENT);
  }
  return creerClient(filPrincipal(mode === 'differe'), OPTIONS_CLIENT);
}

let asynchrones = typeof location !== 'undefined' && typeof window !== 'undefined' && /[?&]recalcul=worker(&|$)/.test(location.search);
let courant: ClientCalculs<CalculsParcours> = creer(modeParAdresse());
// T13 : les écrans de l'app (fiche, Suggérer…) lisent le client par src/ui/hopIndex/parcours/calcul.ts : la maquette y pose le sien.
poserClient(courant, asynchrones);
siDonneesChangent(() => { courant.vider(); transport?.alimenter(donneesClonables()); });
/** true : les recalculs d'un écran ouvert passent au worker (useCalcul). Défaut : false. */
export const recalculsAsynchrones = (): boolean => asynchrones;
/** Le client courant des calculs lourds. */
export const calcul = (): ClientCalculs<CalculsParcours> => courant;
/** Qui sert les calculs : 'worker', 'repli' (worker tombé : fil principal), 'immediat' ou 'differe'. */
export const serveurCalcul = (): string => transport ? transport.etat : courant.immediat ? 'immediat' : 'differe';
/** Remplace le serveur : fil principal immédiat (défaut), différé (réponses dans une tâche suivante) ou worker. */
export function configurerCalcul(o: { differer?: boolean; worker?: boolean; recalculsAsynchrones?: boolean } = {}): void {
  asynchrones = !!o.recalculsAsynchrones;
  courant = creer(o.worker ? 'worker' : o.differer ? 'differe' : 'immediat');
  poserClient(courant, asynchrones);
}
