// D441 (CAL-UN-SEUL-AXE) et CAL-GRILLE-SUR-GRADUATIONS : la lecture partagée par le test sur fixture et la preuve en ligne. Sans `cle` (en ligne),
// les barres ne se jugent pas (leurs dates ne sont pas lues) : seules les colonnes de la frise et les lignes contre la bande.
import type { Page } from '@playwright/test';

/** Les fautes d'axe et de grille, lues à l'écran. */
export const fautesAxe = (page: Page, ou: string, cle: string | null = null) => page.evaluate(([cle, ou]) => {
  const f: string[] = [];
  const jour = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 864e5;
  const cells = [...document.querySelectorAll('[data-bande-semaines] [data-lundi]')].map((e) => ({ l: e.getAttribute('data-lundi')!, r: e.getBoundingClientRect() }));
  const wMax = Math.max(0, ...cells.map((c) => c.r.width));
  const pleines = cells.filter((c) => c.r.width > wMax - 0.6);
  if (pleines.length < 1) return [`${ou} : bande illisible`];
  const ref = pleines[Math.floor(pleines.length / 2)], pj = ref.r.width / 7;
  /* le x d'une date : dans la cellule de sa semaine quand la bande la montre entière (les bords sont arrondis au dixième de px), sinon prolongé */
  const X = (iso: string) => { const j = jour(iso), c = pleines.find((q) => j >= jour(q.l) && j < jour(q.l) + 7); if (c) return c.r.left + (j - jour(c.l)) * (c.r.width / 7);
    /* hors des semaines de la bande (au-delà de l'horizon de la courbe) : prolongé depuis la plus proche, au pas moyen de toutes */
    const p0 = pleines[0], p1 = pleines[pleines.length - 1], moy = pleines.length > 1 ? (p1.r.left - p0.r.left) / (jour(p1.l) - jour(p0.l)) : pj;
    return j < jour(p0.l) ? p0.r.left + (j - jour(p0.l)) * moy : p1.r.left + (j - jour(p1.l)) * moy; };
  const courbe = document.querySelector('.ent-cb')?.getBoundingClientRect();
  const frise = document.querySelector('[data-frise]')!.getBoundingClientRect();
  const g = Math.max(courbe?.left ?? 0, frise.left), d = Math.min(courbe?.right ?? 1e9, frise.right);
  /* D441 : les colonnes de la frise, chacune au x de son début sur la bande */
  const cols = (document.querySelector('[data-frise]')?.getAttribute('data-colonnes') ?? '').split(' ').filter(Boolean).map((c) => c.split('/')[0]);
  const w = Number(document.querySelector('[data-frise]')?.getAttribute('data-largeur-colonne'));
  cols.forEach((c, k) => { const x = frise.left + k * w; if (x > g + 1 && x < d - 1 && Math.abs(X(c) - x) > 1.5) f.push(`${ou} : colonne du ${c} à ${x.toFixed(1)}, sur la bande à ${X(c).toFixed(1)}`); });
  const donnees = cle === null ? [] : JSON.parse(localStorage.getItem(cle) ?? '[]') as Array<{ id: string; data: { fenetre?: { du: string; au: string } } }>;
  let vues = 0;
  for (const x of donnees.filter((x) => x.id.startsWith('P-ZZ-'))) {
    const el = document.querySelector(`[data-frise] [data-chose$="${x.id}"]`), b = el?.getBoundingClientRect();
    if (!el || !b || b.width < 1 || !x.data.fenetre) continue;
    const a = X(x.data.fenetre.du), z = X(new Date((jour(x.data.fenetre.au) + 1) * 864e5).toISOString().slice(0, 10));
    /* une chose trop courte pour sa barre est une marque de taille fixe : elle se juge par son centre */
    if (el.hasAttribute('data-marque')) { const c = (a + z) / 2; if (c > g + 3 && c < d - 3) { vues++; if (Math.abs((b.left + b.right) / 2 - c) > 2.5) f.push(`${ou} : marque ${x.id} centrée à ${((b.left + b.right) / 2).toFixed(1)}, ses dates au ${c.toFixed(1)} sur la bande`); } continue; }
    if (a > g + 3 && a < d - 3) { vues++; if (Math.abs(b.left - a) > 2.5) f.push(`${ou} : ${x.id} commence à ${b.left.toFixed(1)}, son ${x.data.fenetre.du} est à ${a.toFixed(1)} sur la bande`); }
    if (z > g + 3 && z < d - 3) { vues++; if (Math.abs(b.right - z) > 2.5) f.push(`${ou} : ${x.id} finit à ${b.right.toFixed(1)}, la fin du ${x.data.fenetre.au} est à ${z.toFixed(1)} sur la bande`); }
  }
  if (cle !== null && !vues) f.push(`${ou} : aucun bout de barre à juger`);
  /* CAL-GRILLE-SUR-GRADUATIONS : les graduations = les centres des noms posés (S.., initiale de mois, chiffre de jour) */
  const grads = [...document.querySelectorAll('[data-bande-semaines] .ent-sem, [data-bande-semaines] .ent-bd-j')].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0).map((r) => r.left + r.width / 2);
  const lignes = [...document.querySelectorAll('[data-frise] .cal-axe-l')].map((e) => e.getBoundingClientRect().left).filter((x) => x >= frise.left - 0.5 && x <= frise.right + 0.5);
  if (!lignes.length) f.push(`${ou} : aucune ligne de colonne posée sur les graduations (${grads.length} graduations)`);
  else {
    for (const x of grads) if (!lignes.some((l) => Math.abs(l - x) <= 1)) f.push(`${ou} : la graduation à ${x.toFixed(1)} n'a pas sa ligne`);
    for (const l of lignes) if (!grads.some((x) => Math.abs(l - x) <= 1)) f.push(`${ou} : la ligne à ${l.toFixed(1)} n'est sur aucune graduation`);
  }
  return f;
}, [cle, ou] as const);

