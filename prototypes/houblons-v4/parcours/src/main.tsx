// Démarrage de la maquette. Chaque page construite porte sa route (body data-route) : elle démarre sur cette
// route, dans l'état du parcours à cette étape. Paramètre d'adresse : ?theme=clair|cave.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import './styles.css';
import { Coquille } from './coquille/Coquille';
import { NavigationParcours } from './coquille/navigation';
import { lireRoute } from './coquille/routes';
import { EtatParcoursProvider } from './etat/EtatParcours';
import { COMPARER_CARTE, etatDeDepart, routeDePage } from './etat/etapes';
import type { EtatParcours, RecetteParcours } from './etat/types';
import { MOMENTS } from '../../src/engine';
import { classeEbullition } from './etat/quand';
import { H } from './donnees/cas';

/** Cas d'essai du rail (pages cas-ebu45.html, cas-ebu120.html) : la même recette, ébullition de n minutes ; un
 * ajout d'ébullition plus long que l'ébullition passe à son début. */
function avecEbullition(e: EtatParcours, min: number): EtatParcours {
  const duree = (a: RecetteParcours['additions'][number]) => a.minutes ?? MOMENTS[a.moment]?.minutes ?? null;
  const r = (x: RecetteParcours): RecetteParcours => ({ ...x, boilMin: min, additions: x.additions.map((a) => { const d = duree(a); return d != null && d > min ? { ...a, minutes: min, moment: classeEbullition(min) } : a; }) });
  return { ...e, recette: r(e.recette), brouillon: e.brouillon ? { ...e.brouillon, recette: r(e.brouillon.recette) } : null };
}

const theme = new URLSearchParams(location.search).get('theme');
if (theme === 'clair' || theme === 'cave') document.documentElement.dataset.theme = theme;

const depart = lireRoute(location.hash) ?? routeDePage(document.body.dataset.route ?? 'ma-biere');
const ebullition = Number(document.body.dataset.ebullition) || null;
/** Cas d'essai k3 : Nugget à 60′, puis Cascade à 10′ et Galaxy à 5′ (20 g chacun), proches sur la frise. */
function avecTroisHoublons(e: EtatParcours): EtatParcours {
  const ajouts = [
    { id: 'k3-cascade', hopKey: H.cascade, moment: 'b10' as const, minutes: 10, grams: 20 },
    { id: 'k3-galaxy', hopKey: H.galaxy, moment: 'b5' as const, minutes: 5, grams: 20 },
  ];
  return { ...e, recette: { ...e.recette, additions: [...e.recette.additions, ...ajouts] } };
}
const cas = document.body.dataset.cas;
const racine = document.getElementById('parcours')!;
createRoot(racine).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <EtatParcoursProvider initial={cas === 'k3' ? avecTroisHoublons(etatDeDepart(depart)) : ebullition ? avecEbullition(etatDeDepart(depart), ebullition) : etatDeDepart(depart)}>
        <NavigationParcours depart={depart} comparerDefaut={COMPARER_CARTE}>
          <Coquille />
        </NavigationParcours>
      </EtatParcoursProvider>
    </MotionConfig>
  </StrictMode>,
);
