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

const theme = new URLSearchParams(location.search).get('theme');
if (theme === 'clair' || theme === 'cave') document.documentElement.dataset.theme = theme;

const depart = lireRoute(location.hash) ?? routeDePage(document.body.dataset.route ?? 'ma-biere');
const racine = document.getElementById('parcours')!;
createRoot(racine).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <EtatParcoursProvider initial={etatDeDepart(depart)}>
        <NavigationParcours depart={depart} comparerDefaut={COMPARER_CARTE}>
          <Coquille />
        </NavigationParcours>
      </EtatParcoursProvider>
    </MotionConfig>
  </StrictMode>,
);
