// @vitest-environment jsdom
/**
 * Voie c48-fix (24.11), ajout du pilote : E47-5 rouvert en ligne (tour 49) et E49-1. Tests écrits AVANT le correctif (lancés rouges).
 * Les articles sont dans l'ORDRE DE LA PAGE, comme le carnet les garde : l'écran (fiche, résumé de la carte) doit mettre l'essentiel d'abord
 * quel que soit l'ordre de stockage. Aucun réseau, aucun Gemini ; pièces fictives qui reprennent les noms des pages du banc (marmite 50 L,
 * frigo KS240L). Aucune donnée personnelle.
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { valeursEnFrancais, lireCarnet, type Article, type CarnetDoc } from '../../src/domain/carnets/modele';
import { ID_VENTILATION, fixtureCarnets } from '../../src/domain/carnets/fixture';
import { tableau } from '../../src/domain/carnets/comparer';
import { valeursLues, VALEURS_VUES_MAX } from '../../src/ui/carnets/CarteArticle';
import { TableauCarnet, colonnesCarnet, enteteCourt } from '../../src/ui/carnets/TableauCarnet';
import type { ContenuCarnetV } from '../../src/ui/carnets/EtatIA';

afterEach(() => cleanup());

const v = (valeur: string | number, unite?: string) => ({ valeur, ...(unite ? { unite } : {}), origine: 'page' as const });
const noms = (r: Record<string, unknown>) => Object.keys(r);

/* La marmite telle que l'app l'a gardée : l'ordre de la page, la vitesse du moteur et l'épaisseur devant le volume et l'inox (FB-1, K-t1_5). */
const MARMITE = {
  'Vitesse de rotation': v('28 U/min'), 'Épaisseur de paroi': v(1, 'mm'), Dimensions: v('455 x 370 mm'), 'Diamètre intérieur': v(455, 'mm'), Hauteur: v(370, 'mm'),
  'Numéro d\'article': v('40003'), Moteur: v('220 V – 0,09 kW'), 'Robinet de vidange en bas': v('oui'), Matière: v('Acier inox AISI 304'), Volume: v(50, 'L'), Induction: v('non')
};
/* Le frigo KS240L : numéros au milieu, classe et consommation loin, « Couleur » deux fois, une supposition de la page (FK-0, FK-1). */
const FRIGO = {
  'Type de réfrigérateur': v('Kühlschrank ohne Gefrierfach'), Largeur: v(54, 'cm'), Hauteur: v(143.5, 'cm'), Profondeur: v(55, 'cm'), 'Réf. du fabricant': v('109971'),
  'Numéro d\'article': v('49548562'), Couleur: v('Argent'), 'Couleur exacte': v('Argent'), 'Niveau sonore (max.)': v(39, 'dB'), 'Classe d\'efficacité énergétique': v('E'),
  'Est probablement équipé d\'un adaptateur secteur': v('Oui'), Volume: v(242, 'l'), 'Consommation annuelle': v(104, 'kWh'), Réfrigérant: v('R600a')
};

describe('E47-5 (rouvert) : l\'essentiel d\'abord, à l\'écran, quel que soit l\'ordre gardé', () => {
  const marmite = valeursEnFrancais(MARMITE);
  const frigo = valeursEnFrancais(FRIGO);

  it('marmite : volume, matière et induction sont dans les 5 premières lignes (elles étaient 9e, 8e et 11e sur 11)', () => {
    const tete = noms(marmite).slice(0, 5);
    for (const n of ['Volume', 'Matière', 'Induction']) expect(tete, n).toContain(n);
  });
  it('marmite : la vitesse de rotation et l\'épaisseur de paroi ne passent pas devant le volume et la matière', () => {
    const o = noms(marmite);
    for (const decisive of ['Volume', 'Matière']) for (const accessoire of ['Vitesse de rotation', 'Épaisseur de paroi']) expect(o.indexOf(decisive), `${decisive} avant ${accessoire}`).toBeLessThan(o.indexOf(accessoire));
  });
  it('marmite : le résumé de la carte (3 lignes) ne commence pas par « Vitesse de rotation · Épaisseur de paroi · Dimensions »', () => {
    const resume = valeursLues(marmite).slice(0, VALEURS_VUES_MAX).join(' · ');
    expect(resume).not.toMatch(/Vitesse de rotation/);
    expect(resume).toMatch(/50/);
    expect(resume).toMatch(/inox/i);
  });
  it('frigo : la classe énergétique et la consommation passent avant les numéros', () => {
    const o = noms(frigo);
    for (const e of ['Classe d\'efficacité énergétique', 'Consommation annuelle']) for (const num of ['Réf. du fabricant', 'Numéro d\'article']) expect(o.indexOf(e), `${e} avant ${num}`).toBeLessThan(o.indexOf(num));
  });
  it('frigo : les numéros sont tout en bas', () => {
    expect(noms(frigo).slice(-2).sort()).toEqual(['Numéro d\'article', 'Réf. du fabricant'].sort());
  });
  it('frigo : « Couleur exacte » qui répète « Couleur » (Argent deux fois) n\'est qu\'une ligne', () => {
    const o = noms(frigo);
    expect(o).toContain('Couleur');
    expect(o).not.toContain('Couleur exacte');
  });
  it('frigo : « Couleur exacte » qui dit autre chose que « Couleur » reste (rien n\'est perdu)', () => {
    const o = noms(valeursEnFrancais({ Couleur: v('Argent'), 'Couleur exacte': v('RAL 9006') }));
    expect(o).toContain('Couleur exacte');
  });
  it('frigo : « Est probablement équipé d\'un adaptateur secteur : Oui » (une supposition de la page) n\'est pas gardée', () => {
    expect(noms(frigo).some(n => /probablement/i.test(n))).toBe(false);
  });
  it('ce que le brasseur a écrit lui-même (origine « vous ») n\'est jamais touché ni retiré', () => {
    const r = valeursEnFrancais({ ...FRIGO, 'Couleur exacte': { valeur: 'Argent', origine: 'vous' as const } });
    expect(noms(r)).toContain('Couleur exacte');
  });
});

describe('E49-1 : l\'en-tête de colonne du tableau dit la mesure ET l\'unité, entiers', () => {
  const lieu = (nom: string, unite: string) => enteteCourt({ nom, unite });
  it('« Hauteur » en cm : l\'en-tête n\'est pas « cm » seul', () => {
    const e = lieu('Hauteur', 'cm');
    expect(e).toMatch(/hauteur/i);
    expect(e).toMatch(/cm/);
  });
  it('« Diamètre intérieur » en mm, « Poids » en kg, « Volume » en l : la grandeur et l\'unité', () => {
    expect(lieu('Diamètre intérieur', 'mm')).toMatch(/diam[èe]tre/i);
    expect(lieu('Diamètre intérieur', 'mm')).toMatch(/mm/);
    expect(lieu('Poids', 'kg')).toMatch(/poids/i);
    expect(lieu('Volume', 'l')).toMatch(/volume/i);
  });
  it('une unité qui dit déjà la grandeur reste seule (débit en m³/h, prix en CHF : règle du tour 3)', () => {
    expect(enteteCourt({ nom: 'débit', unite: 'm³/h' })).toBe('m³/h');
  });
  it('rendu : la colonne « Hauteur cm » du tableau du carnet nomme sa grandeur, à l\'écran (pas seulement dans un title)', () => {
    const base = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION)!)!;
    const art = (id: string, hauteur: number): Article => ({ id, nom: `Machine ${id}`, domaine: 'exemple.test', url: `https://exemple.test/${id}`, lecture: 'lue', valeurs: { Hauteur: v(hauteur, 'cm') } });
    const c = { ...base, carnet: { ...base.carnet, criteres: [], facons: [], notes: [], photos: [], choix: undefined, sortie: undefined, archive: undefined, articles: [art('A1', 143.5), art('A2', 37)] } } as CarnetDoc;
    const t = tableau(c)!;
    const k = c.carnet as unknown as ContenuCarnetV;
    expect(colonnesCarnet(t as never).some(x => x.nom === 'Hauteur')).toBe(true);
    const { container } = render(<TableauCarnet carnet={k} titre={c.title} tableau={t as never} aRelire={[]} sep={null} onOuvrir={() => undefined} />);
    const entetes = [...container.querySelectorAll('[role=columnheader]')].map(e => e.textContent ?? '');
    expect(entetes.some(e => /hauteur/i.test(e) && /cm/.test(e)), entetes.join(' | ')).toBe(true);
  });
});

/* (le bloc est écrit AVANT le titre : seul le repli y passe) Garde-fou du repli « bloc de prix » (C48-1, banc 35 hopfenshop) : une fourchette de variantes n'est le prix de personne ; un bloc de produits liés non plus. */
import { lirePage } from '../../functions/src/lireLien';
describe('C48-1 : le repli « bloc de prix » ne lit jamais une fourchette ni un produit lié', () => {
  const page = (corps: string) => `<!doctype html><html><head><title>Citra</title></head><body><main>${corps}<h1>Citra houblon</h1><p>Houblon en pellets, variété américaine aux arômes d'agrumes et de fruits tropicaux, plusieurs conditionnements.</p></main></body></html>`;
  const U = new URL('https://boutique-exemple.test/produit/citra/');
  it('« CHF4.00 – CHF285.00 » (le prix dépend de la variante) : aucun prix lu', () => {
    const p = lirePage(page('<div class="product-price"><span class="amount">CHF4.00</span> – <span class="amount">CHF285.00</span></div>'), U, 1);
    expect(p.prix).toBeUndefined();
  });
  it('le prix d\'un produit lié (liste « related ») n\'est pas celui du produit', () => {
    const p = lirePage(page('<section class="related-products"><div class="product-price">CHF 8.00</div></section>'), U, 1);
    expect(p.prix).toBeUndefined();
  });
  it('un prix unique dans le bloc d\'achat est lu', () => {
    const p = lirePage(page('<div class="product-price">CHF 12.50</div>'), U, 1);
    expect(p.prix).toBe(12.5);
  });
});
