// CAL-ECHELLE-SUIT-CADRE et CAL-GRAIN-SUIT-DUREE : la lecture de l'en-tête et ses fautes, partagées par le test sur fixture et la preuve en ligne.
import type { Page } from '@playwright/test';

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const court = (iso: string) => `${Number(iso.slice(8, 10))} ${MOIS[Number(iso.slice(5, 7)) - 1]}`;
const dimanche = (lundi: string) => new Date(Date.parse(`${lundi}T00:00:00Z`) + 6 * 864e5).toISOString().slice(0, 10);

/** Ce que l'en-tête dit de la fenêtre : graduations (dans le cadre ou grises), bords du cadre, son étiquette, la pastille. */
export const lireEchelle = (page: Page) => page.evaluate(() => {
  const cadre = document.querySelector('.ent-cadre')!.getBoundingClientRect();
  const grads = [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')].map((e) => {
    const r = e.getBoundingClientRect();
    return { n: Number(e.getAttribute('data-semaine')), lundi: e.getAttribute('data-lundi') ?? '', hors: e.hasAttribute('data-hors'), l: r.left, r: r.right, texte: (e.textContent ?? '').trim() };
  }).filter((g) => g.r - g.l > 0.5);
  const bande = document.querySelector('[data-bande-semaines]');
  const jours = [...document.querySelectorAll('[data-bande-semaines] [data-jour]')].map((e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, hors: !!e.closest('[data-hors]') }; }).filter((j) => j.x > 0);
  return {
    cadre: { l: cadre.left, r: cadre.right }, grads, grain: bande?.getAttribute('data-grain') ?? null, jours,
    etiquette: (document.querySelector('[data-cadre-etiquette]')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
    pastille: ((document.querySelector('[data-ent-cle]') as HTMLElement | null)?.innerText ?? '').replace(/\s+/g, ' ').trim()
  };
});

export function fautesEchelle(l: Awaited<ReturnType<typeof lireEchelle>>, ou: string): string[] {
  const f: string[] = [], dans = l.grads.filter((g) => !g.hors);
  if (!dans.length) return [`${ou} : aucune graduation dans le cadre`];
  const a = dans[0], b = dans[dans.length - 1];
  if (Math.abs(a.l - l.cadre.l) > 3 || Math.abs(b.r - l.cadre.r) > 3) f.push(`${ou} : cadre ${Math.round(l.cadre.l)}–${Math.round(l.cadre.r)} ≠ graduations S${a.n}–S${b.n} ${Math.round(a.l)}–${Math.round(b.r)}`);
  for (const g of l.grads) if (g.hors && g.l + 1 > l.cadre.l && g.r - 1 < l.cadre.r) f.push(`${ou} : S${g.n} grise dans le cadre`);
  /* D434 : les dates du cadre, du lundi de la première semaine au dimanche de la dernière ; aucun « S<n> » répété */
  const deb = court(a.lundi), fin = court(dimanche(b.lundi));
  if (!l.etiquette.includes(deb.split(' ')[0]) || !l.etiquette.includes(fin.split(' ')[0]) || !l.etiquette.includes(fin.split(' ')[1])) f.push(`${ou} : étiquette « ${l.etiquette} » ≠ ${deb} – ${fin}`);
  if (/\bS\d+/.test(l.etiquette)) f.push(`${ou} : étiquette « ${l.etiquette} » dit des semaines (D434 : des dates)`);
  /* CAL-GRAIN-SUIT-DUREE : le grain suit le nombre de semaines du cadre ; en jours, des chiffres de jours dans le cadre */
  const voulu = dans.length <= 3 ? 'jour' : dans.length >= 52 ? 'mois' : 'semaine';
  if (l.grain !== voulu) f.push(`${ou} : ${dans.length} sem. dans le cadre, grain « ${l.grain} » au lieu de « ${voulu} »`);
  if (voulu === 'jour' && !l.jours.some((j) => !j.hors && j.x > l.cadre.l && j.x < l.cadre.r)) f.push(`${ou} : grain jour sans aucun jour dans le cadre`);
  /* D433 : la semaine du creux est dans le cadre, ou rien à venir dedans : 0 « dans le cadre » */
  const s = /\bS(\d+)/.exec(l.pastille);
  if (/dans le cadre/.test(l.pastille)) { if (!/^0\b/.test(l.pastille)) f.push(`${ou} : pastille « ${l.pastille} » : rien dans le cadre mais pas 0`); }
  else if (!s || !dans.some((g) => g.n === Number(s[1]))) f.push(`${ou} : pastille « ${l.pastille} » hors du cadre S${a.n}–S${b.n}`);
  return f;
}

