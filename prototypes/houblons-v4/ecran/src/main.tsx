import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import './styles.css';
import { Ecran, type Etat } from './Ecran';

// Variantes de l'écran (étape 8 : trois partis). L'option de build --variante choisit laquelle.
const VARIANTES = { essai: Ecran } as const;

// Paramètres d'adresse, utiles en dev et en file:// : ?theme=cave|clair, ?etat=a|b|radar.
const params = new URLSearchParams(location.search);
const theme = params.get('theme');
if (theme === 'clair' || theme === 'cave') document.documentElement.dataset.theme = theme;
const etat = (params.get('etat') ?? document.body.dataset.etat ?? 'a') as Etat;
const Variante = VARIANTES[__ECRAN__.variante as keyof typeof VARIANTES];
const racine = document.getElementById('ecran')!;

if (!Variante) {
  // Visible à l'écran et levée comme erreur de page, que capture.mjs signale.
  racine.textContent = `Variante inconnue : ${__ECRAN__.variante}`;
  throw new Error(`Variante inconnue : ${__ECRAN__.variante}`);
}
createRoot(racine).render(
  <StrictMode>
    {/* Mouvement réduit respecté (docs/ux-boosters.md) : la valeur par défaut de Motion l'ignore. */}
    <MotionConfig reducedMotion="user">
      <Variante etat={etat} />
    </MotionConfig>
  </StrictMode>,
);
