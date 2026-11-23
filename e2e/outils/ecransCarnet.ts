// Les écrans du Carnet, chacun atteint AU DOIGT depuis une page neuve sur la fixture (jour figé) : sert aux épreuves de mise en page
// (texte rogné, chevauchement) et aux captures de référence. `racine` : la zone mesurée (la feuille du + est hors du Carnet).
import { expect, type Page } from '@playwright/test';
import { ouvrirCarnet, ouvrirUnCarnet } from './carnet';

export type Ecran = { id: string; racine: string; aller: (page: Page) => Promise<void> };

const retour = (page: Page) => page.waitForTimeout(450); // les transitions finissent (captures et mesures stables)

export const ECRANS: Ecran[] = [
  { id: 'liste', racine: '[data-carnets]', aller: async (p) => { await ouvrirCarnet(p); await retour(p); } },
  { id: 'liste-bas', racine: '[data-carnets]', aller: async (p) => { await ouvrirCarnet(p); await p.locator('.cn-defile').first().evaluate((e) => { e.scrollTop = e.scrollHeight; }); await retour(p); } },
  { id: 'carnet-frigo', racine: '[data-carnets]', aller: async (p) => { await ouvrirCarnet(p); await ouvrirUnCarnet(p, 'Frigo + congel'); await retour(p); } },
  { id: 'chambre-froide', racine: '[data-carnets]', aller: async (p) => { await ouvrirCarnet(p); await ouvrirUnCarnet(p, /ZZ TEST — Chambre froide/); await retour(p); } },
  { id: 'prix-en-euros', racine: '[data-carnets]', aller: async (p) => { await ouvrirCarnet(p); await ouvrirUnCarnet(p, /ZZ TEST — Prix en euros/); await retour(p); } },
  { id: 'ventilation', racine: '[data-carnets]', aller: async (p) => { await ouvrirCarnet(p); await ouvrirUnCarnet(p, /ZZ TEST — Ventilation/); await retour(p); } },
  { id: 'frigo-choisi', racine: '[data-carnets]', aller: async (p) => { await ouvrirCarnet(p); await ouvrirUnCarnet(p, /ZZ TEST — Frigo de garde/); await retour(p); } },
  { id: 'comparer', racine: '[data-carnets]', aller: async (p) => {
    await ouvrirCarnet(p); await ouvrirUnCarnet(p, /ZZ TEST — Ventilation/);
    await p.getByRole('button', { name: /^Comparer/ }).first().tap();
    await expect(p.locator('.cn-tableau-comparer')).toBeVisible({ timeout: 15_000 }); await retour(p);
  } },
  { id: 'fiche-article', racine: '[data-carnets]', aller: async (p) => {
    await ouvrirCarnet(p); await ouvrirUnCarnet(p, /ZZ TEST — Chambre froide/);
    await p.locator('[data-carnets] button.cn-tab-ligne[role=row]').filter({ hasText: /Chambre froide - 1800/ }).first().tap();
    await expect(p.locator('.cn-carac')).toBeVisible({ timeout: 15_000 }); await retour(p);
  } },
  { id: 'menu-plus', racine: 'body', aller: async (p) => {
    await ouvrirCarnet(p); await p.getByRole('button', { name: 'Actions rapides' }).tap();
    await expect(p.getByRole('menuitem', { name: /^Nouvelle idée/ })).toBeVisible(); await retour(p);
  } },
  { id: 'menu-note', racine: '.cn-feuille', aller: async (p) => {
    await ouvrirCarnet(p); await ouvrirUnCarnet(p, 'Frigo + congel');
    await p.getByRole('button', { name: /^Note :/ }).first().tap();
    await expect(p.getByRole('menuitem', { name: 'Supprimer', exact: true })).toBeVisible(); await retour(p);
  } }
];
