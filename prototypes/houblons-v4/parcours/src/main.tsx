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
import { MOMENTS } from '../../../../src/domain/hopIndex/v4';
import { classeEbullition } from './etat/quand';
import { H } from './donnees/cas';
import { configurerDonnees } from './moteur';
import { lancerTypicite } from './moteur/donnees';

/** Cas d'essai du rail (pages cas-ebu45.html, cas-ebu120.html ; cas-ebu200.html pour l'étape) : la même recette, ébullition de n minutes ; un
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
/** Cas d'essai k3, celui de sa base v4.10 (consolide/cas-k3.html) : Nugget 42,5 g à 60′, Motueka 10 g à 10′,
 * Cascade 20 g au whirlpool (80 °C, 20 min), Citra cryo 40 g à froid en fermentation (J+3, 3 j de contact). */
function casK3(e: EtatParcours): EtatParcours {
  const ajouts: RecetteParcours['additions'] = [
    { id: 'k3-motueka', hopKey: 'beermaverick-motueka', moment: 'b10', minutes: 10, grams: 10 },
    { id: 'k3-cascade', hopKey: H.cascade, moment: 'wp', tempC: 80, minutes: 20, grams: 20 },
    { id: 'k3-citra-cryo', hopKey: 'beermaverick-citra:cryo', moment: 'dryActive', day: 3, jours: 3, grams: 40 },
  ];
  const nugget = e.recette.additions.map((a) => (a.hopKey === H.nugget ? { ...a, grams: 42.5 } : a));
  return { ...e, recette: { ...e.recette, additions: [...nugget, ...ajouts] } };
}
/** Cas d'essai k2, celui de sa base (consolide/cas-k2.html) : la même recette, sans houblon. */
const casK2 = (e: EtatParcours): EtatParcours => ({ ...e, recette: { ...e.recette, additions: [] } });
const cas = document.body.dataset.cas;
// D40 bis : sa page cas-k2 est une bière sans houblon et sans dégustation (« 1 au style · 11 non situées ») : la dégustation
// du 18.10 appartient à la bière brassée avec Nugget.
if (cas === 'k2') configurerDonnees({ degustation: null });
// D120 (t2) : la typicité du style est le défaut de Suggérer ; la maquette n'a pas l'étape de l'app (EtapeHoublons, qui lance le chargement) : elle charge la table ici, avant tout geste.
// Une seule ligne, hors des fichiers de la voie : sans elle les états « East Kent Goldings en tête du stout » (picto-épice, gr5-cran) ne peuvent pas repasser.
void lancerTypicite();
const depart0 = etatDeDepart(depart);
const racine = document.getElementById('parcours')!;
createRoot(racine).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <EtatParcoursProvider initial={cas === 'k3' ? casK3(depart0) : cas === 'k2' ? casK2(depart0) : ebullition ? avecEbullition(depart0, ebullition) : depart0}>
        <NavigationParcours depart={depart} comparerDefaut={COMPARER_CARTE}>
          <Coquille />
        </NavigationParcours>
      </EtatParcoursProvider>
    </MotionConfig>
  </StrictMode>,
);
