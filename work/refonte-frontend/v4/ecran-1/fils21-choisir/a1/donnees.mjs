// Lot 21 · série a · le VRAI profil simulé (moteur profil-simule, fils21-choisir/donnees/profils-simules.json),
// découpé pour chaque page : la page ne calcule rien, elle lit la grille, les paires et les cas du moteur.
// Le stub de la série est retiré (19.10, 23 h 45, consigne du pilote).
import fs from 'node:fs';
import { VRAI_PROFILS } from './reel.mjs';

export const P = JSON.parse(fs.readFileSync(VRAI_PROFILS, 'utf8'));
export const CHEMIN = 'fils21-choisir/donnees/profils-simules.json';
// Les houblons de la grille, par nom (data-houblon) : clé du moteur.
export const CLE = Object.fromEntries([...new Set(P.grille.map((g) => g.nom + '|' + g.houblon))].map((x) => x.split('|')));
// Une tranche : les entrées de grille, de paires et de cas que la page lit, plus le socle commun.
export function tranche({ grille = () => false, paires = () => false, cas = () => false } = {}) {
  const T = {
    version: P.version, mention: P.mention, mentionRapport: P.mentionRapport, ordre: P.style.ordre, format: P.formatGrille,
    style: { code: P.style.code, nom: P.style.nom, attendu: P.style.attendu, citation: P.style.citation, zone: Object.fromEntries(Object.entries(P.style.zone).map(([f, z]) => [f, z.bande])) },
    biere: { titre: P.biere.titre, degustation: P.biere.degustation, avant: P.biere.avant },
    grille: P.grille.filter(grille), paires: P.grillePaires.filter(paires), cas: P.cas.filter(cas),
  };
  // Les renvois « §n » utilisés par la tranche, résolus.
  const refs = new Set(JSON.stringify(T).match(/§\d+/g) || []);
  for (const r of [...refs]) for (const s of (P.textes[r] || '').match(/§\d+/g) || []) refs.add(s);
  T.textes = Object.fromEntries([...refs].map((r) => [r, P.textes[r]]));
  return T;
}
