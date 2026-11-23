import { registerSW } from 'virtual:pwa-register';
import { demarrerMiseAJour } from './miseAJour';

/** Seul importeur de `virtual:pwa-register` (fourni par vite-plugin-pwa au build) ; chargé à la demande par `precacheHorsLigne`. */
export function enregistrerPwa(): void {
  demarrerMiseAJour(registerSW);
}
