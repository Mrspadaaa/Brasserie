/**
 * Critique tour 4 (c), voie g3, tour 3 (critique Opus, n° 2, 3, 5, 7, 8, 9) : la gouttière DROITE de 76 px du tour 2 rognait toutes les listes
 * (Opérations « à payer · 25 … », Stocks « ZZ TE… », bande vide à 1280). Remède standard d'un bouton flottant : marge BASSE seulement (le dernier élément
 * défile au-dessus du +), largeur pleine rendue aux listes. CT4C-7 (montant « En caisse » non couvert) reste tenu par `synthese.css`.
 * jsdom ne mesure pas la mise en page : les règles se lisent dans les feuilles ; la mesure réelle est au banc (`voies/g3/bench-t3.mjs`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const lire = (p: string) => fs.readFileSync(path.resolve(__dirname, '../../', p), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const nav = lire('src/components/navigation/navigation.css');
const operations = lire('src/ui/finance/operations.css');
const payer = lire('src/ui/finance/payer/payer.css');

/** Règles (sélecteur + corps) qui posent une gouttière droite (padding-right ou right en rem) sur le sélecteur donné. */
function gouttiere(css: string, selecteur: RegExp): string[] {
  const out: string[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  for (let m = re.exec(css); m; m = re.exec(css)) {
    if (selecteur.test(m[1]) && /(padding-right|(^|[;\s])right)\s*:\s*[\d.]+rem/.test(m[2])) out.push(m[1].trim() + ' { ' + m[2].trim() + ' }');
  }
  return out;
}

describe('CT4C tour 3 : plus de gouttière droite pour le + (marge basse seule)', () => {
  it('Stocks › Articles (390 et 1280) : les lignes et les en-têtes de rayon gardent toute la largeur', () => {
    expect(gouttiere(nav, /stock-liste/)).toEqual([]);
  });

  it('Clients › Prix : « Il manque ces données » garde toute la largeur', () => {
    expect(gouttiere(nav, /prx-manque/)).toEqual([]);
  });

  it('Opérations à 390 : la liste garde toute la largeur (échéance, nom du tiers, montants)', () => {
    expect(gouttiere(nav, /\.ops\b/)).toEqual([]);
    expect(gouttiere(operations, /\.ops\b/).filter((r) => /fab-floating/.test(r) && !/max-height/.test(r))).toEqual([]);
  });

  it('Synthèse couchée : la scène (colonne « Matériel à part ») garde toute la largeur', () => {
    expect(gouttiere(nav, /syn-scene/)).toEqual([]);
  });

  it('la marge basse existe encore : le dernier élément défile au-dessus du + (4,5 rem = 56 + 16)', () => {
    const base = lire('src/ui/floating-actions.css');
    expect(base).toMatch(/data-floating-actions-gap="page"\]\s*\{\s*padding-bottom:\s*calc\(4\.5rem/);
  });

  it('CT4C-7 tenu : la carte « En caisse » garde sa réserve à droite (synthese.css)', () => {
    expect(gouttiere(lire('src/ui/finance/synthese.css'), /syn-caisse/).length).toBeGreaterThan(0);
  });

  it('Payer l’Atelier : « Solde atelier · ancienne année » passe à la ligne au lieu de « … » (390)', () => {
    expect(payer).toMatch(/\.pay-qui b\s*\{[^}]*white-space:\s*normal/);
    expect(payer).not.toMatch(/\.pay-qui b\s*\{[^}]*text-overflow:\s*ellipsis/);
  });

  it('Payer l’Atelier à 844×340 : la feuille se compacte (paysage bas) pour montrer la pièce cochée au premier écran', () => {
    const m = /@media\s*\(orientation:\s*landscape\)\s*and\s*\(max-height:\s*520px\)\s*\{([\s\S]*?)\n\}/.exec(payer);
    expect(m, 'bloc paysage bas').not.toBeNull();
    const bloc = m![1];
    expect(bloc).toMatch(/\.pay-it\s*\{[^}]*min-height:\s*(4\d|5[0-5])px/);
    expect(bloc).toMatch(/\.pay-who/);
  });
});
