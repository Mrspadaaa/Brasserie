// Coquille de la maquette : Ma bière au fond (la page de la recette), l'outil de la route par-dessus en plein
// écran, la fiche en feuille. Elle tient le brouillon en accord avec la route : une route d'outil suppose son
// brouillon ; revenir hors de l'outil l'abandonne (la recette reste intacte).
import { useEffect, useRef } from 'react';
import { JeuPictos } from '@app/ui/hopIndex/Pictos';
import { useParcours } from '../etat/EtatParcours';
import { brouillonPour } from '../etat/etapes';
import MaBiere from '../ecrans/ma-biere';
import Biere from '../ecrans/biere';
import Fiche from '../ecrans/fiche';
import Suggerer from '../ecrans/suggerer';
import Comparer from '../ecrans/comparer';
import Dryhopper from '../ecrans/dryhopper';
import Levure from '../ecrans/levure';
import Substituer from '../ecrans/substituer';
import { bannisDe, directionDe, objectifsDe, voiesDe, type Groupe } from '../ecrans/suggerer/voies';
import { horsDesFamilles } from '../ecrans/suggerer/hors16d';
import { ROUE } from '@app/ui/hopIndex/familyTokens';
import { lireBiere, remplacants, style } from '../moteur';
import { calcul } from '../moteur/client';
import { prechauffer } from '../moteur/prechauffage';
import type { AjoutParcours, RecetteParcours } from '../etat/types';
import type { SubstitutionOptions } from '../../../../../src/domain/hopIndex/v4';

/** La demande de Substituer pour un ajout (u4 : au moment et à la dose de l'ajout, au style, tout le classement, en ordre
 * de catalogue) : les mêmes options, dans le même ordre, que optionsDe de ecrans/substituer/donnees.ts (même clé). */
/** Les mots hors des familles des houblons des voies (D130), que Suggérer compose à son ouverture : lus une fois au repos,
 * ils sont ensuite servis par le cache des mots (moteur/v4.ts). */
const motsDesVoies = (groupes: Groupe[]) => { horsDesFamilles(groupes.flatMap((g) => g.lignes.flatMap((l) => l.houblons.map((h) => h.cle)))); };
const optionsSubstituer = (recette: RecetteParcours, a: AjoutParcours): SubstitutionOptions =>
  ({ moment: a.moment, grams: a.grams, recipe: recette, style: style(recette.styleCode), stockFirst: false });
import { useNavigation } from './navigation';
import { estOutil } from './routes';

export function Coquille() {
  const { route } = useNavigation();
  const { etat, dispatch } = useParcours();
  const etatRef = useRef(etat); etatRef.current = etat;
  // À chaque changement de route seulement (pas à chaque geste) : le brouillon suit la route.
  useEffect(() => {
    const e = etatRef.current;
    const b = brouillonPour(route, e);
    if (b === 'garder') return;
    if (b) dispatch({ type: 'brouillon/ouvrir', brouillon: b });
    else if (e.brouillon) dispatch({ type: 'brouillon/abandonner' });
  }, [route, dispatch]);

  // Au repos sur Ma bière : préchauffer ce qu'un toucher ouvre, Suggérer et Substituer (performance, t2 n° 1 et 8 ; #171,
  // option a). Mêmes appels que ces écrans à leur ouverture : voies de Suggérer sur la recette et la visée ; substitutes
  // de chaque ajout en ordre de catalogue (Substituer, remplaçants de la fiche) ; remplaçants de chaque ajout, 6 au plus.
  const surMaBiere = route.ecran === 'ma-biere' || route.ecran === 'biere';
  useEffect(() => {
    if (!surMaBiere) return;
    const { recette, visee } = etat;
    const c = calcul();
    const substitutes = recette.additions.map((a) => () => c.prechauffer('substitutes', a.hopKey, optionsSubstituer(recette, a)));
    // Fil principal : une petite tâche par moment de repos, comme avant.
    if (c.immediat) {
      return prechauffer([
        () => motsDesVoies(voiesDe(recette, objectifsDe(recette, lireBiere(recette), visee), ROUE, bannisDe(visee))),
        ...recette.additions.map((a) => () => remplacants(recette, a.id, 6)),
        ...substitutes,
      ]);
    }
    // Worker (#171) : les requêtes partent d'une seule tâche (le fil principal ne calcule rien) ; le client garde les
    // réponses, qu'un toucher lit sans attendre. Les voies reçues, une tâche au repos compose la liste de Suggérer sur
    // le fil principal (ses caches légers : houblons, mots), comme le faisait le préchauffage d'avant.
    let annule = false;
    const fin = prechauffer([() => {
      const objectifs = objectifsDe(recette, lireBiere(recette), visee), direction = directionDe(objectifs);
      void Promise.all([c.prechauffer('proposer', recette, direction), c.prechauffer('leviers', recette, direction)]).then(() => {
        const proposes = c.lireGarde('proposer', recette, direction), leviers = c.lireGarde('leviers', recette, direction);
        if (annule || !proposes || !leviers) return;
        prechauffer([() => motsDesVoies(voiesDe(recette, objectifs, ROUE, bannisDe(visee), 4, { proposes, leviers }))]);
      });
      for (const f of substitutes) void f();
    }]);
    return () => { annule = true; fin(); };
  }, [surMaBiere, etat.recette, etat.visee]); // eslint-disable-line react-hooks/exhaustive-deps

  const outil = (() => {
    switch (route.ecran) {
      case 'biere': return <Biere />;
      case 'suggerer': return <Suggerer />;
      case 'comparer': return <Comparer houblons={route.houblons} />;
      case 'dryhopper': return etat.brouillon ? <Dryhopper ajoutId={route.ajout} /> : null;
      case 'levure': return etat.brouillon ? <Levure ajoutId={route.ajout} /> : null;
      case 'substituer': return etat.brouillon ? <Substituer houblon={route.houblon} /> : null;
      default: return null;
    }
  })();
  return (
    <>
      <JeuPictos />
      {/* Sous un outil plein écran, Ma bière n'est pas montée : ses titres, ses mots et ses houblons ne doivent pas
          se lire avec l'outil (contrôles du dépôt, lecteurs d'écran). Elle se remonte au retour, recalculée. */}
      {!estOutil(route) && <MaBiere />}
      {route.ecran === 'fiche' && <Fiche houblon={route.houblon} />}
      {outil}
    </>
  );
}
