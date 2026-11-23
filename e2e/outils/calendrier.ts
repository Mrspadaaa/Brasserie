// Le Calendrier pour les tests Playwright : la fixture (celle des bancs du parcours), l'ouverture, le menu de période, et les lectures
// du DOM que les règles de DEFAUTS-RECURRENTS comparent. Les lectures sont reprises de scripts/parcours/geste.mjs (CAL-ECHELLE-COHERENTE,
// CAL-FRISE-ETIQUETTES, CAL-AN-390), qui reste le banc de référence tant que tout n'est pas porté.
import { expect, type Page } from '@playwright/test';
// @ts-expect-error module JavaScript des bancs, sans types
import { fixtureCalendrier, lundiDe, ajouter } from '../../scripts/parcours/fixtures/calendrier.mjs';

export const CLE_FIXTURE = 'parcours-calendrier:fixture';
export const CLE_CACHE = 'parcours-calendrier:cache';
export const URL_CALENDRIER = '/?dev-local&finance-demo=parcours-calendrier';
export const ECHELLES = ['6 sem.', '3 mois', '6 mois', 'An'] as const;

type Entree = { name: string; id: string; data: any };

/**
 * La fixture du banc geste.mjs (`fixtureGeste`) : la fixture du parcours Calendrier (données simulées), plus un passé de 14 semaines (caisse
 * ouverte plus tôt, cinq paiements passés : tirer le début a un passé à montrer) et « ZZ TEST Geste », des travaux de deux semaines.
 */
export function fixtureFrise(auj: string): Entree[] {
  const L = lundiDe(auj), s = (n: number, j = 0) => ajouter(L, n * 7 + j);
  const fx = fixtureCalendrier(auj) as { entrees: Entree[] };
  const PASSE = 14, pr = fx.entrees.find((e) => e.name === 'financialProfiles')!;
  pr.data.openingCash.date = s(-PASSE); pr.data.historyCompleteFrom = s(-PASSE);
  for (const [k, n, c, d] of [[1, -PASSE + 1, 30000, 'out'], [2, -PASSE + 3, 80000, 'in'], [3, -PASSE + 5, 45000, 'out'], [4, -3, 60000, 'in'], [5, -2, 25000, 'out']] as const) {
    fx.entrees.push({ name: 'transactions', id: 'T-ZZ-P' + k, data: { id: 'T-ZZ-P' + k, description: 'ZZ passé ' + k, date: s(n, 1), amountCents: c, kind: d === 'in' ? 'sale' : 'purchase', status: 'paid' } });
    fx.entrees.push({ name: 'financialPayments', id: 'PAY-ZZ-P' + k, data: { id: 'PAY-ZZ-P' + k, transactionId: 'T-ZZ-P' + k, date: s(n, 1), amountCents: c, direction: d, method: 'card', recordedAt: s(n, 1) + 'T10:00:00.000Z' } });
  }
  fx.entrees.push({ name: 'financialPlans', id: 'P-ZZ-GESTE', data: { id: 'P-ZZ-GESTE', title: 'ZZ TEST Geste', date: s(3), amountCents: 5000, direction: 'out', category: 'renovation', source: 'manual', status: 'active', createdAt: `${ajouter(auj, -30)}T08:00:00.000Z`, fenetre: { du: s(3), au: s(4, 6), joursActifs: 4 } } });
  return fx.entrees;
}

/** Pose la fixture avant le code de la page (une fois par contexte : un rechargement relit ce que les gestes ont écrit), thème clair. */
/** Aujourd'hui à Zurich (le fuseau de l'app et des projets) : en UTC, peu après minuit, c'était encore la veille et la fixture partait d'une semaine trop tôt. */
export const aujourdhuiZurich = (): string => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });

export async function poserFixture(page: Page, auj = aujourdhuiZurich()) {
  await page.addInitScript(([kf, j]) => {
    if (!localStorage.getItem(kf)) localStorage.setItem(kf, j);
    localStorage.setItem('laffinee.theme', 'clair');
  }, [CLE_FIXTURE, JSON.stringify(fixtureFrise(auj))] as const);
}

/** Ouvre l'app sur la fixture et va au Calendrier par son onglet. */
export async function ouvrirCalendrier(page: Page) {
  await page.goto(URL_CALENDRIER);
  await expect(page.locator('nav button').first()).toBeVisible({ timeout: 90_000 });
  const cal = page.locator('[data-calendrier]');
  if (!(await cal.count())) {
    await page.getByRole('button', { name: 'Calendrier', exact: true })
      .or(page.getByRole('tab', { name: 'Calendrier', exact: true }))
      .or(page.getByRole('link', { name: 'Calendrier', exact: true })).first().tap();
  }
  await expect(cal).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.ent-cadre')).toBeAttached();
}

export const boutonPeriode = (page: Page) => page.getByRole('button', { name: /période, liste, tri et filtre$/ });

/** Le menu de période (« 6 sem. » … « An », « 2 sem. ») : un toucher l'ouvre, un toucher choisit, le menu se ferme. */
export async function choisirPeriode(page: Page, nom: string) {
  await boutonPeriode(page).tap();
  const menu = page.getByRole('dialog', { name: 'Période et vue' });
  await menu.getByRole('group', { name: 'Période' }).getByRole('button', { name: nom, exact: true }).tap();
  await expect(menu).toBeHidden();
  await page.waitForTimeout(350); // la frise se redessine sur deux images (mesure de la largeur, puis rendu)
}

/** La période de l'app (pastille de l'en-tête : « ‹ Nov. › », « 30.08–05.09 ») : tout son texte, celui que le brasseur lit. */
export const periodeApp = (page: Page) => page.locator('[data-periode-pastille]').first().innerText({ timeout: 10_000 }).then((t) => t.replace(/\s+/g, ' ').trim());

/** Le cadre de la courbe : bords et milieu vertical (la courbe mise dans la vue). */
export function boiteCadre(page: Page) {
  return page.evaluate(() => {
    const cb = document.querySelector('.ent-cbz .ent-cb') ?? document.querySelector('.ent-cb'), c = document.querySelector('.ent-cadre');
    if (!cb || !c) return null;
    cb.scrollIntoView({ block: 'center' });
    const a = cb.getBoundingClientRect(), r = c.getBoundingClientRect();
    return { l: r.left, r: r.right, y: a.top + a.height / 2, courbeL: a.left };
  });
}

export type Coherence = { erreur?: string; pt: string | null; label: string; etiquette: { a: number; anA: number | null; b: number; anB: number | null } | null; points: number[]; grad: number[]; empilees: string[] };

/** CAL-ECHELLE-COHERENTE : étiquette du cadre, points de courbe dans le cadre, graduations visibles, pastille de l'app, étiquettes empilées. */
export function lireCoherence(page: Page): Promise<Coherence> {
  return page.evaluate(() => {
    const cb = document.querySelector('.ent-cbz .ent-cb') ?? document.querySelector('.ent-cb'), cadre = document.querySelector('.ent-cadre');
    const pt = (document.querySelector('[data-periode-pastille]') as HTMLElement | null)?.innerText.replace(/\s+/g, ' ').trim() ?? null;
    if (!cb || !cadre) return { erreur: 'courbe ou cadre introuvable', pt, label: '', etiquette: null, points: [], grad: [], empilees: [] };
    cb.scrollIntoView({ block: 'center' });
    const c = cadre.getBoundingClientRect();
    const dans = (e: Element) => { const r = e.getBoundingClientRect(), x = r.left + r.width / 2; return x >= c.left - 0.5 && x <= c.right + 0.5; };
    const num = (e: Element) => Number(e.getAttribute('data-point-semaine') ?? e.getAttribute('data-semaine'));
    const points = [...cb.querySelectorAll('[data-point-semaine]')].filter(dans).map(num);
    const grad = [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.left + r.width / 2 >= 0 && r.left + r.width / 2 <= innerWidth; }).map(num);
    const label = (document.querySelector('[data-cadre-etiquette]')?.textContent ?? '').replace(/\s+/g, ' ').trim();
    // « S47 – S52 », « S47 – S45 2027 », « S47 2025 – S52 2026 » (le début dit son année hors de l'année en cours)
    const me = /^S(\d+)(?: (\d{4}))?(?: – S(\d+)(?: (\d{4}))?)?/.exec(label);
    const etiquette = me ? { a: Number(me[1]), anA: me[2] ? Number(me[2]) : null, b: Number(me[3] ?? me[1]), anB: me[4] ? Number(me[4]) : null } : null;
    const tx = [...cb.querySelectorAll('text')].filter((e) => (e.textContent ?? '').trim()).map((e) => { const r = e.getBoundingClientRect(); return { t: (e.textContent ?? '').trim().slice(0, 18), l: r.left, r: r.right, h: r.top, b: r.bottom }; }).filter((r) => r.r - r.l > 0);
    const empilees: string[] = [];
    for (let i = 0; i < tx.length; i++) for (let j = i + 1; j < tx.length; j++) {
      const a = tx[i], b = tx[j], w = Math.min(a.r, b.r) - Math.max(a.l, b.l), h = Math.min(a.b, b.b) - Math.max(a.h, b.h);
      if (w > 2 && h > 2 && (w * h) / Math.min((a.r - a.l) * (a.b - a.h), (b.r - b.l) * (b.b - b.h)) > 0.3) empilees.push(`${a.t}/${b.t}`);
    }
    return { pt, label, etiquette, points, grad, empilees };
  });
}

/** Les écarts à CAL-ECHELLE-COHERENTE (vide si tout dit la même période) ; `pt0` : la période de l'app au départ (CAL-PERIODE-APP-FIXE). */
export function ecartsCoherence(c: Coherence, pt0?: string | null): string[] {
  if (c.erreur) return [c.erreur];
  const pbl: string[] = [], pbs = (l: number[]) => (l.length ? `S${l[0]}–S${l[l.length - 1]} (${l.length})` : 'aucune');
  if (pt0 !== undefined && c.pt !== pt0) pbl.push(`la période de l'app a changé : « ${pt0} » → « ${c.pt} »`);
  if (c.etiquette && (c.points[0] !== c.etiquette.a || c.points[c.points.length - 1] !== c.etiquette.b)) pbl.push(`étiquette « ${c.label} » ≠ dessin du cadre ${pbs(c.points)}`);
  if (!c.etiquette && !/\d{4}|janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc/i.test(c.label)) pbl.push(`étiquette illisible (« ${c.label} »)`);
  if (!c.points.length) pbl.push('aucun point de courbe dans le cadre');
  if (c.grad.length && c.grad.join() !== c.points.join()) pbl.push(`graduations ${pbs(c.grad)} ≠ dessin du cadre ${pbs(c.points)}`);
  if (c.empilees.length) pbl.push(`étiquettes de courbe empilées : ${c.empilees.slice(0, 3).join(', ')}`);
  return pbl;
}

/** Attente web-first : la frise finit par dire une seule période (le rendu suit le geste en une ou deux images). */
export async function attendreCoherence(page: Page, pt0?: string | null, quand = '') {
  let derniere: Coherence | null = null;
  await expect.poll(async () => { derniere = await lireCoherence(page); return ecartsCoherence(derniere, pt0); }, { message: `CAL-ECHELLE-COHERENTE ${quand}`, timeout: 4_000 }).toEqual([]);
  return derniere as unknown as Coherence;
}

/** CAL-FRISE-ETIQUETTES : étiquettes de la courbe contre poignées, étiquette du cadre, entre elles, bord de la courbe ; « S47 » dit une fois. */
export function fautesEtiquettes(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const vis = (e: Element) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 ? r : null; };
    const svg = document.querySelector('.ent-cb svg.ent-svg'), sr = svg ? svg.getBoundingClientRect() : null;
    type B = { k: string; tx: string; l: number; r: number; t: number; b: number };
    const bx = (r: DOMRect) => ({ l: r.left, r: r.right, t: r.top, b: r.bottom });
    const et: B[] = [];
    for (const [sel, k] of [['[data-nom-courbe]', 'nom'], ['[data-niveau-courbe]', 'niveau'], ['[data-sous-zero="repere"]', 'zéro'], ['[data-mise-de-cote="etiquette"]', 'mise'], ['.ent-cb .ent-mois', 'mois']]) {
      for (const e of document.querySelectorAll(sel)) { if (e.closest('.ent-nom-cache')) continue; const r = vis(e); if (r) et.push({ k, tx: (e.textContent || '').replace(/\s+/g, ' ').trim(), ...bx(r) }); }
    }
    const cad = [...document.querySelectorAll('[data-cadre-etiquette]')].map((e) => { const r = vis(e); return r ? { k: 'cadre', tx: (e.textContent || '').replace(/\s+/g, ' ').trim(), ...bx(r) } : null; }).filter(Boolean) as B[];
    const pog = [...document.querySelectorAll('[data-poignee]')].map((e) => { const i = e.querySelector('i'); const r = i ? vis(i) : null; return r ? { k: 'poignée ' + e.getAttribute('data-poignee'), tx: '', ...bx(r) } : null; }).filter(Boolean) as B[];
    const grad = [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')].map((e) => ({ r: vis(e), t: (e.textContent || '').trim() })).filter((g) => g.r && g.r.right > 0 && g.r.left < innerWidth && /^S\d+$/.test(g.t)).map((g) => g.t);
    const fautes: string[] = [];
    const croise = (a: B, b: B) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > 1 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 1;
    const nom = (a: B) => `« ${a.tx || a.k} »`;
    for (let i = 0; i < et.length; i++) {
      const a = et[i];
      for (const q of pog) if (croise(a, q)) fautes.push(`${nom(a)} croise la ${q.k}`);
      for (const c of cad) if (croise(a, c)) fautes.push(`${nom(a)} croise l'étiquette du cadre « ${c.tx} »`);
      for (let j = i + 1; j < et.length; j++) if (croise(a, et[j])) fautes.push(`${nom(a)} croise ${nom(et[j])}`);
      if (sr && (a.l < sr.left - 0.5 || a.r > sr.right + 0.5)) fautes.push(`${nom(a)} sort de la courbe`);
    }
    for (const c of cad) if (/^S\d+$/.test(c.tx) && grad.includes(c.tx)) fautes.push(`« ${c.tx} » écrit deux fois (cadre et graduation)`);
    // L-3 (T10-M5-2 : « A·A·Achats ±13 ») : un même nom posé deux fois au même endroit (moins de 4 px de hauteur l'un de l'autre)
    for (let i = 0; i < et.length; i++) for (let j = i + 1; j < et.length; j++) if (et[i].tx && et[i].tx === et[j].tx && Math.abs(et[i].t - et[j].t) < 4) fautes.push(`« ${et[i].tx} » écrit deux fois`);
    return [...new Set(fautes)];
  });
}

/**
 * CAL-AN-390 : dans une zone (en-tête du Calendrier, frise, fiche), aucun texte rogné (« … », ellipsis, débordement coupé) ni chevauché.
 * Les textes réservés aux lecteurs d'écran (.sr-only) ne se voient pas ; la zone est l'élément nommé, jamais un ancêtre commun.
 */
export function fautesTextes(page: Page, zone: 'entete' | 'frise' | 'fiche'): Promise<string[] | null> {
  return page.evaluate((z) => {
    const zones: Record<string, Element | null> = { entete: document.querySelector('[data-calendrier-entete]'), frise: document.querySelector('[data-frise]'), fiche: document.querySelector('[data-detail]') };
    const r0 = zones[z]; if (!r0) return null;
    const fautes: string[] = [], boites: { t: string; l: number; r: number; h: number; b: number }[] = [];
    const cache = (e: Element) => { for (let a: Element | null = e; a && a !== r0.parentElement; a = a.parentElement) { if (a.classList?.contains('sr-only')) return true; const s = getComputedStyle(a); if (s.visibility === 'hidden' || s.display === 'none' || s.opacity === '0' || (s.position === 'absolute' && /rect\(0/.test(s.clip))) return true; } return false; };
    const feuilles = [...r0.querySelectorAll('*')].filter((e) => !e.children.length && (e.textContent || '').trim() && !e.closest('svg title, .ent-nom-cache, [aria-hidden="true"]') && !(e instanceof SVGTitleElement) && !cache(e));
    for (const e of feuilles) {
      const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1 || r.right < 0 || r.left > innerWidth) continue;
      const t = (e.textContent || '').replace(/\s+/g, ' ').trim();
      if (/…|\.\.\./.test(t)) fautes.push(`« ${t.slice(0, 24)} » écrit avec « … »`);
      const rg = document.createRange(); rg.selectNodeContents(e); const rt = rg.getBoundingClientRect();
      for (let a: Element | null = e; a && a !== r0.parentElement; a = a.parentElement) {
        if (!(a instanceof HTMLElement)) continue;
        const s = getComputedStyle(a), rogne = s.textOverflow === 'ellipsis' || s.overflowX === 'hidden' || s.overflowX === 'clip';
        if (!rogne || a.clientWidth <= 0) continue;
        const ra = a.getBoundingClientRect(), dehors = Math.max(rt.right - ra.right, ra.left - rt.left);
        if ((a === e && a.scrollWidth > a.clientWidth + 1) || dehors > 1) { fautes.push(`« ${t.slice(0, 24)} » rogné (${a === e ? `${a.scrollWidth} > ${a.clientWidth} px` : `${Math.round(dehors)} px hors de`} ${a.tagName.toLowerCase()}.${String(a.className).split(' ')[0]})`); break; }
      }
      if (e.closest('svg') && !(e instanceof SVGTextElement || e instanceof SVGTSpanElement)) continue;
      boites.push({ t, l: r.left, r: r.right, h: r.top, b: r.bottom });
    }
    for (let i = 0; i < boites.length; i++) for (let j = i + 1; j < boites.length; j++) { const a = boites[i], b = boites[j]; if (Math.min(a.r, b.r) - Math.max(a.l, b.l) > -2 && Math.min(a.b, b.b) - Math.max(a.h, b.h) > 3) fautes.push(`« ${a.t.slice(0, 18)} » croise ou touche « ${b.t.slice(0, 18)} »`); }
    return [...new Set(fautes)];
  }, zone);
}

/** Les rangées de la frise (CAL-AN-390, REPRISE-4) : période d'un bloc, jamais « S47–S47 », aucun picto d'étape sur une autre barre. */
export function fautesRangees(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const fautes: string[] = [];
    for (const e of document.querySelectorAll('[data-frise] .cal-conf')) {
      const NBSP = String.fromCharCode(160), WJ = String.fromCharCode(0x2060);
      const t = e.textContent ?? '', lu = t.split(WJ).join('').split(NBSP).join(' ');
      if (/\b(S\d+)\s*–\s*\1\b/.test(lu)) fautes.push(`« ${lu} » : la même semaine deux fois`);
      const mot = /^(prévu|confirmé|à encaisser|à payer)\s/.exec(t), fin = t.indexOf(' · ') > 0 ? t.indexOf(' · ') : t.length;
      const n = e.firstChild, bloc = e.querySelector('.cal-conf-p'); if (!mot || !n || n.nodeType !== 3) continue;
      const rg = document.createRange();
      if (bloc) rg.selectNodeContents(bloc); else { rg.setStart(n, mot[0].length); rg.setEnd(n, Math.min(fin, (n as Text).length)); }
      const tops = new Set([...rg.getClientRects()].filter((r) => r.width > 1).map((r) => Math.round(r.top)));
      if (tops.size > 1) fautes.push(`« ${lu} » : la période coupée sur ${tops.size} lignes`);
    }
    const barres = [...document.querySelectorAll('[data-frise] [data-chose]')];
    for (const j of document.querySelectorAll('[data-frise] .cal-jalon')) {
      const r = j.getBoundingClientRect(); if (r.width < 1) continue;
      const mienne = j.closest('[data-chose]');
      const autre = barres.find((b) => { if (b === mienne || b.contains(j)) return false; const q = b.getBoundingClientRect(); return Math.min(r.right, q.right) - Math.max(r.left, q.left) > 1 && Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top) > -1; });
      if (autre) fautes.push(`picto ${j.getAttribute('data-jalon')} de « ${(mienne?.getAttribute('aria-label') ?? '').split(',')[0]} » sur la barre « ${(autre.getAttribute('aria-label') ?? '').split(',')[0]} »`);
    }
    return [...new Set(fautes)];
  });
}

/** Les lundis des semaines de la frise (data-lundi), dans l'ordre. */
export const lundis = (page: Page) => page.locator('[data-bande-semaines] [data-lundi]').evaluateAll((l) => l.map((e) => e.getAttribute('data-lundi') ?? ''));

/** La date d'une chose dans le magasin de la fixture (ce que l'app a écrit). */
export const dateChose = (page: Page, id: string) => page.evaluate(([k, id]) => JSON.parse(localStorage.getItem(k) ?? '[]').find((x: any) => x.id === id)?.data?.date ?? null, [CLE_CACHE, id] as const);

/** Semaine absolue (nombre de semaines depuis l'époque) du début d'une étiquette « S47 2025 – … ». */
export function semaineAbsolue(e: { a: number; anA: number | null; anB: number | null }) {
  const an = e.anA ?? e.anB ?? new Date().getFullYear(), j4 = Date.UTC(an, 0, 4), l1 = j4 - ((new Date(j4).getUTCDay() + 6) % 7) * 864e5;
  return Math.round(l1 / (7 * 864e5)) + e.a - 1;
}

export { ajouter };
