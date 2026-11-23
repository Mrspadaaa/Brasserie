// Le Carnet pour les tests Playwright : la fixture du banc carnet.mjs (19 projets du Planning, carnets « ZZ TEST — … »), l'ouverture par
// l'onglet Brassins › Atelier, et les lectures du DOM que les règles de DEFAUTS-RECURRENTS comparent (texte rogné, chevauchement).
// La fixture est fabriquée par le code de l'app (esbuild + node, ~10 s) : une seule fois par jour, gardée dans os.tmpdir() (écriture
// atomique : les workers parallèles se partagent le même fichier). Données simulées ; l'IA est la réponse simulée de `?dev-local`.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, type Page } from '@playwright/test';
// @ts-expect-error module JavaScript des bancs, sans types
import { fixtureCarnet } from '../../scripts/parcours/fixtures/carnet.mjs';

export const CLE_FIXTURE = 'parcours-carnet:fixture';
export const CLE_CACHE = 'parcours-carnet:cache';
export const URL_CARNET = '/?dev-local&finance-demo=parcours-carnet';
const RACINE = process.cwd();
/** Le jour des tests : figé (horloge de la page et fixture), pour que les captures de référence ne changent pas d'un jour à l'autre. */
export const JOUR_FIXE = '2026-11-23';

export type Fixture = { entrees: any[]; ids: Record<string, any> };

/** La fixture du jour, lue du cache disque ou fabriquée (une fois). */
export function lireFixtureCarnet(auj = JOUR_FIXE): Fixture {
  const dossier = path.join(os.tmpdir(), 'affinee-e2e');
  fs.mkdirSync(dossier, { recursive: true });
  const f = path.join(dossier, `fixture-carnet-${auj}.json`);
  if (!fs.existsSync(f)) {
    const fx = fixtureCarnet(RACINE, auj);
    const tmp = `${f}.${process.pid}.${Date.now()}`;
    fs.writeFileSync(tmp, JSON.stringify(fx));
    fs.renameSync(tmp, f);
  }
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}

/** Pose la fixture avant le code de la page (une fois par contexte : un rechargement relit ce que les gestes ont écrit). */
export async function poserFixtureCarnet(page: Page, theme: 'clair' | 'cave' = 'clair', entrees?: any[]) {
  const fx = lireFixtureCarnet();
  await page.clock.setFixedTime(new Date(`${JOUR_FIXE}T10:00:00+01:00`));
  await page.addInitScript(([k, j, t]) => {
    if (!localStorage.getItem(k)) localStorage.setItem(k, j);
    localStorage.setItem('laffinee.theme', t);
  }, [CLE_FIXTURE, JSON.stringify(entrees ?? fx.entrees), theme] as const);
  return fx;
}

export const surListe = (page: Page) => page.locator('[data-carnets]').first().getAttribute('data-vue');

/** Démarre l'app sur la fixture (sans aller au Carnet). */
export async function demarrer(page: Page) {
  await page.goto(URL_CARNET);
  await expect(page.locator('nav button').first()).toBeVisible({ timeout: 90_000 });
}

/** Ouvre l'app sur la fixture et va à la liste du Carnet par Brassins › Atelier (la porte de DEFAUTS CARNET-PLANNING). */
export async function ouvrirCarnet(page: Page) {
  await demarrer(page);
  await page.locator('nav button').filter({ hasText: 'Brassins' }).first().tap();
  await page.getByRole('button', { name: /^Atelier/ }).first().tap();
  await expect.poll(() => surListe(page), { timeout: 30_000, message: 'la liste du Carnet s’affiche' }).toBe('liste');
}

/** Ouvre un carnet de la liste par son titre. */
export async function ouvrirUnCarnet(page: Page, titre: string | RegExp) {
  await page.locator('[data-carnets]').getByText(titre).first().tap();
  await expect.poll(() => surListe(page), { timeout: 15_000, message: `le carnet « ${titre} » s’ouvre` }).toBe('carnet');
}

/**
 * Les textes rognés EN SILENCE : un élément dont le texte dépasse sa boîte alors qu'il la coupe sans le dire (overflow caché sans « … »),
 * ou un texte de bouton ou de ligne dont une partie sort de la boîte d'un ancêtre qui la masque (la puce « 3 mois » coupée au bord de sa rangée).
 * Un titre qui finit par « … » (text-overflow: ellipsis) dit qu'il continue : il n'est pas compté.
 */
export function textesRognes(page: Page, racine = '[data-carnets]') {
  return page.evaluate((sel) => {
    const out: string[] = [];
    const r0 = document.querySelector(sel); if (!r0) return ['racine absente'];
    const dit = (e: HTMLElement) => (e.innerText ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);
    for (const e of r0.querySelectorAll<HTMLElement>('*')) {
      const r = e.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) continue;
      const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      if (![...e.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim()) || e.clientWidth <= 2) continue; // 1×1 : texte pour lecteur d'écran
      const clamp = (cs as any).webkitLineClamp && (cs as any).webkitLineClamp !== 'none';
      const coupeX = ['hidden', 'clip'].includes(cs.overflowX) && cs.textOverflow !== 'ellipsis' && e.scrollWidth - e.clientWidth > 1;
      const coupeY = ['hidden', 'clip'].includes(cs.overflowY) && !clamp && e.scrollHeight - e.clientHeight > 1;
      if (coupeX || coupeY) out.push(`« ${dit(e)} » coupé par lui-même (${e.scrollWidth}×${e.scrollHeight} dans ${e.clientWidth}×${e.clientHeight})`);
      // coupé par le bord d'un ancêtre qui masque (horizontalement : la verticale défile)
      for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
        const ca = getComputedStyle(a); if (!['hidden', 'clip'].includes(ca.overflowX)) continue; // un conteneur qui défile dit qu'il défile ; un conteneur qui masque coupe en silence
        const ra = a.getBoundingClientRect();
        if ((r.right > ra.right + 1 && r.left < ra.right - 1) || (r.left < ra.left - 1 && r.right > ra.left + 1)) { out.push(`« ${dit(e)} » coupé par le bord de son conteneur (${Math.round(r.left)}–${Math.round(r.right)} dans ${Math.round(ra.left)}–${Math.round(ra.right)})`); break; }
      }
    }
    if (document.documentElement.scrollWidth > innerWidth + 1) out.push(`la page défile en largeur (${document.documentElement.scrollWidth} > ${innerWidth})`);
    return out;
  }, racine);
}

/** Les chevauchements : deux éléments de texte (boutons, titres, textes) dont les boîtes visibles se recouvrent de plus de 2 px des deux côtés. */
export function chevauchements(page: Page, racine = '[data-carnets]') {
  return page.evaluate((sel) => {
    const r0 = document.querySelector(sel); if (!r0) return ['racine absente'];
    type B = { e: HTMLElement; r: DOMRect; t: string };
    const boites: B[] = [];
    for (const e of r0.querySelectorAll<HTMLElement>('button,a,[role=button],[role=tab],h1,h2,h3,p,span,label,time,li,input,textarea')) {
      const r = e.getBoundingClientRect(); if (!(r.width > 4 && r.height > 4)) continue;
      const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0' || cs.position === 'fixed') continue;
      if (e.closest('[aria-hidden="true"]')) continue;
      let colle = false; for (let a: HTMLElement | null = e; a; a = a.parentElement) { const ps = getComputedStyle(a).position; if (ps === 'fixed' || ps === 'sticky') { colle = true; break; } }
      if (colle) continue;
      const t = (e.innerText ?? '').replace(/\s+/g, ' ').trim() || (e as HTMLInputElement).placeholder || '';
      if (!t) continue;
      boites.push({ e, r, t: t.slice(0, 30) });
    }
    const out: string[] = [];
    for (let i = 0; i < boites.length; i++) for (let j = i + 1; j < boites.length; j++) {
      const a = boites[i], b = boites[j];
      if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
      const dx = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), dy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (dx > 2 && dy > 2) out.push(`« ${a.t} » × « ${b.t} » (${Math.round(dx)}×${Math.round(dy)} px)`);
    }
    return out;
  }, racine);
}
