/**
 * Banc permanent de la lecture des liens du Carnet (D446, 23.11) : les liens réels du banc, leur vérité écrite (page ouverte dans
 * Chrome, champ par champ) et la page telle que le serveur l'a reçue (agent `LaffineeCarnet/1.0`). Rejouable SANS réseau ni app :
 * `lireLien` lit chaque page capturée par un `fetch` simulé qui rejoue les réponses enregistrées (statuts, redirections, défi
 * Cloudflare). Comme le banc des factures (skill banc-lecture) : on le mesure avant et après chaque changement.
 *
 *   npx tsx scripts/banc-liens.ts [--etiquette avant] [--detail] [--seul 3,17]
 *
 * Sortie : le tableau par lien (= juste, ✗ faux, · absent honnête, ? manquant), les taux par champ et le nombre d'inventions ;
 * `banc-liens/mesures/<etiquette>.json` garde tout. Aucun appel Gemini ici : la cascade IA est mesurée à part (budget, journal).
 * Les cours de change sont simulés (taux fixes) : le banc ne dépend ni du jour ni du réseau.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { lireLien } from '../functions/src/lireLien';

/** Cours fixes du banc (ordre de grandeur du 23.11) : le banc ne dépend ni du jour ni du réseau. */
const COURS_FIXES: Record<string, number> = { EUR: 0.93, GBP: 1.06, AUD: 0.52, USD: 0.8 };
const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const BANC = path.join(ROOT, 'work/missions/2026-11-23-carnet-en-ligne/banc-liens');

type Saut = { url: string; status?: number; cf?: string | null; type?: string | null; loc?: string | null; erreur?: string; ms?: number };
type Capture = { n: number; lien: string; sauts: Saut[] };
export interface Verite {
  n: number; lien: string; genres: string[]; acces: 'ouvert' | 'bloque'; statut?: string;
  nom: { exact: string | null; doitContenir: string[] };
  prix: number | null; prixInconnu?: boolean; devise: string | null; ttc: boolean | null; prixTTC?: number; prixDes?: boolean;
  photo: boolean; caract: Array<{ nom: string; valeur: string }>; dispo: string | null;
  livraisonCH: { prix: number; devise: string } | 'gratuite' | 'refusee' | null;
}

export function verites(): Verite[] {
  const lire = (f: string) => fs.existsSync(path.join(BANC, f)) ? JSON.parse(fs.readFileSync(path.join(BANC, f), 'utf8')) as Verite[] : [];
  return [...lire('verite-base.json'), ...lire('verite-ajout.json')].sort((a, b) => a.n - b.n);
}
function captures(): Map<number, Capture> {
  const m = new Map<number, Capture>();
  for (const f of ['capture.json', 'capture-ajout.json']) {
    const p = path.join(BANC, 'pages', f);
    if (!fs.existsSync(p)) continue;
    for (const c of (JSON.parse(fs.readFileSync(p, 'utf8')).pages as Capture[])) if (c) m.set(c.n, c);
  }
  return m;
}

/** Un `fetch` qui rejoue la capture d'un lien : chaque adresse rend son statut enregistré ; robots.txt absent (404, permis). */
export function fetchRejoue(c: Capture, n: number): typeof fetch {
  const html = (() => { const f = path.join(BANC, 'pages', `${String(n).padStart(2, '0')}.html.gz`); return fs.existsSync(f) ? zlib.gunzipSync(fs.readFileSync(f)) : null; })();
  const sansDiese = (u: string) => u.replace(/#.*$/, '');
  return (async (input: string | URL | Request) => {
    const u = sansDiese(String(input instanceof Request ? input.url : input));
    if (new URL(u).pathname === '/robots.txt') return new Response('', { status: 404 });
    const i = c.sauts.findIndex((s) => sansDiese(s.url) === u);
    const s = i >= 0 ? c.sauts[i] : undefined;
    if (!s) return new Response('', { status: 404 });
    if (s.erreur) throw Object.assign(new TypeError('fetch failed'), { cause: { code: s.erreur } });
    const h = new Headers();
    if (s.type) h.set('content-type', s.type);
    if (s.cf) h.set('cf-mitigated', s.cf);
    if (s.loc) h.set('location', s.loc);
    const dernier = i === c.sauts.length - 1;
    return new Response(dernier && html && s.status !== 204 ? html : null, { status: s.status ?? 500, headers: h });
  }) as typeof fetch;
}

const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[\s ]+/g, ' ').trim();
const proche = (a: number | undefined, b: number | undefined) => a !== undefined && b !== undefined && Math.abs(a - b) <= Math.max(0.01, b * 0.005);
const chiffres = (t: string) => (norm(t).match(/\d+(?:[.,]\d+)?/g) ?? []).map((x) => x.replace(',', '.').replace(/\.0+$/, ''));

type Note = '=' | '✗' | '·' | '?' | '';
export interface Ligne { sansJsonLd?: boolean; n: number; genres: string[]; statut: string; nom: Note; prix: Note; photo: Note; caract: Note; ttc: Note; livraison: Note; inventions: string[]; ms: number; lu: unknown }

/** Note une lecture contre sa vérité. « = » juste et rempli, « · » absent honnête, « ? » manquant, « ✗ » faux (= invention). */
export function noter(v: Verite, l: any, ms = 0): Ligne {
  const inventions: string[] = [];
  const nomLu: string | undefined = l?.nom;
  let nom: Note;
  if (!v.nom.exact && !v.nom.doitContenir.length) nom = nomLu ? '✗' : '·';
  else if (!nomLu) nom = '?';
  else nom = v.nom.doitContenir.every((m) => norm(nomLu).includes(norm(m))) ? '=' : '✗';
  if (nom === '✗' && (!v.nom.exact && !v.nom.doitContenir.length)) inventions.push('nom');

  let prix: Note;
  const p = l?.prix as number | undefined, dev = l?.devise as string | undefined, ht = l?.taxe === 'ht';
  if (v.prix === null) prix = v.prixInconnu ? (p === undefined ? '?' : '') : p === undefined ? '·' : '✗';
  else if (p === undefined) prix = '?';
  else {
    const devOk = !v.devise || dev === v.devise;
    // Prix HT publié : juste s'il est dit HT, ou si le TTC publié est rendu (prixTTC écrit, sinon HT × (1 + un taux de TVA courant)).
    const ttcPossibles = v.prixTTC !== undefined ? [v.prixTTC] : [0.081, 0.077, 0.026, 0.19, 0.2].map((t) => Math.round(v.prix! * (1 + t) * 100) / 100);
    // Variantes à prix différents : « dès » le plus bas des variantes est juste (jamais une variante choisie à sa place).
    const vars = (v as any).variantes as Array<{ prix: number }> | null | undefined;
    const desJuste = l?.prixDes === true && Array.isArray(vars) && vars.length > 1 && proche(p, Math.min(...vars.map((x) => x.prix)));
    const ok = desJuste || (v.ttc === false ? (ht && proche(p, v.prix)) || (!ht && ttcPossibles.some((t) => proche(p, t))) : proche(p, v.prix) && !ht);
    prix = devOk && ok ? '=' : '✗';
  }
  if (prix === '✗') inventions.push(`prix ${p} ${dev ?? ''}${ht ? ' HT' : ''}`);

  const photos: string[] = l?.photos ?? (l?.photo ? [l.photo] : []);
  const fausses = photos.filter((u) => /no-?image|placeholder|blank\.(?:gif|png)|spacer/i.test(u) || !/^https:\/\//.test(u));
  let photo: Note = v.photo ? (photos.length && !fausses.length ? '=' : photos.length ? '✗' : '?') : photos.length ? '✗' : '·';
  if (photo === '✗') inventions.push('photo');

  const valeurs: Array<{ nom: string; valeur: string; unite?: string }> = l?.valeurs ?? [];
  let caract: Note = '';
  if (v.caract.length) {
    const trouve = v.caract.filter((c) => {
      const attendus = chiffres(c.valeur);
      return valeurs.some((x) => {
        const texte = `${x.nom} ${x.valeur} ${x.unite ?? ''}`;
        const lus = chiffres(texte);
        return attendus.length ? attendus.every((a) => lus.includes(a)) : norm(texte).includes(norm(c.valeur));
      });
    }).length;
    caract = trouve * 2 >= v.caract.length ? '=' : '?';
  } else if (valeurs.length) caract = '·';

  let ttc: Note = '';
  if (v.ttc === false && p !== undefined) ttc = prix === '=' ? '=' : '✗';

  let livraison: Note = '';
  const liv = l?.livraison as { prix?: number; devise?: string; gratuite?: boolean; refusee?: boolean } | undefined;
  if (v.livraisonCH === null) livraison = liv ? '' : '·';
  else if (!liv) livraison = '?';
  else if (v.livraisonCH === 'gratuite') livraison = liv.gratuite || liv.prix === 0 ? '=' : '✗';
  else if (v.livraisonCH === 'refusee') livraison = liv.refusee ? '=' : '✗';
  else livraison = proche(liv.prix, v.livraisonCH.prix) && liv.devise === v.livraisonCH.devise ? '=' : '✗';
  if (livraison === '✗') inventions.push('livraison');

  return { n: v.n, genres: v.genres, statut: l?.statut ?? '?', nom, prix, photo, caract, ttc, livraison, inventions, ms, lu: l };
}

export function taux(lignes: Ligne[], verite: Map<number, Verite>) {
  const pct = (a: number, b: number) => `${a}/${b} (${b ? Math.round((a / b) * 100) : 0} %)`;
  const avec = (f: (v: Verite) => boolean) => lignes.filter((l) => f(verite.get(l.n)!));
  const prixAttendu = avec((v) => v.prix !== null), photoAttendue = avec((v) => v.photo), caractAttendues = avec((v) => v.caract.length > 0);
  const ttcFaux = avec((v) => v.ttc === false), livraisons = avec((v) => v.livraisonCH !== null);
  return {
    liens: lignes.length,
    prixSansJsonLd: pct(prixAttendu.filter((l) => l.sansJsonLd && l.prix === '=').length, prixAttendu.filter((l) => l.sansJsonLd).length),
    nom: pct(lignes.filter((l) => l.nom === '=' || l.nom === '·').length, lignes.length),
    prixAffiche: pct(prixAttendu.filter((l) => l.prix === '=').length, prixAttendu.length),
    photoAffichee: pct(photoAttendue.filter((l) => l.photo === '=').length, photoAttendue.length),
    caracteristiques: pct(caractAttendues.filter((l) => l.caract === '=').length, caractAttendues.length),
    htDit: pct(ttcFaux.filter((l) => l.ttc === '=').length, ttcFaux.length),
    livraisonCH: pct(livraisons.filter((l) => l.livraison === '=').length, livraisons.length),
    inventions: lignes.reduce((s, l) => s + l.inventions.length, 0),
    liensAvecInvention: lignes.filter((l) => l.inventions.length).map((l) => `${l.n}:${l.inventions.join('+')}`)
  };
}

async function main() {
  const args = process.argv.slice(2);
  const val = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const etiquette = val('--etiquette') ?? 'courant';
  const seul = val('--seul')?.split(',').map(Number);
  const vs = verites().filter((v) => !seul || seul.includes(v.n));
  const caps = captures();
  const lignes: Ligne[] = [];
  await Promise.all(vs.map(async (v) => {
    const c = caps.get(v.n);
    if (!c) { lignes.push(noter(v, { statut: 'non-capture' })); return; }
    const t0 = performance.now();
    const l = await lireLien(v.lien, { fetchPage: fetchRejoue(c, v.n), maintenant: 0, cours: async (d: string) => (COURS_FIXES[d] ? { taux: COURS_FIXES[d], date: '2026-11-23' } : null) });
    const html = (() => { const f = path.join(BANC, 'pages', String(v.n).padStart(2, '0') + '.html.gz'); return fs.existsSync(f) ? zlib.gunzipSync(fs.readFileSync(f)).toString('utf8') : ''; })();
    const sansJsonLd = ![...html.matchAll(/<script[^>]*ld\+json[^>]*>([\s\S]*?)<\/script>/g)].some((m) => /"price"/.test(m[1]));
    lignes.push({ ...noter(v, l, Math.round(performance.now() - t0)), sansJsonLd });
  }));
  lignes.sort((a, b) => a.n - b.n);
  const parN = new Map(vs.map((v) => [v.n, v]));
  console.log('n  | statut       | nom | prix | photo | caract | HT | livr. | inventions');
  for (const l of lignes) {
    console.log(`${String(l.n).padStart(2)} | ${l.statut.padEnd(12)} |  ${l.nom || ' '}  |  ${l.prix || ' '}   |   ${l.photo || ' '}   |   ${l.caract || ' '}    | ${l.ttc || ' '}  |   ${l.livraison || ' '}   | ${l.inventions.join(', ')}`);
    if (args.includes('--detail')) console.log('     ', JSON.stringify(l.lu).slice(0, 600));
  }
  const t = taux(lignes, parN);
  console.log(`\nBANC LIENS ${etiquette} :`, JSON.stringify(t, null, 1));
  fs.mkdirSync(path.join(BANC, 'mesures'), { recursive: true });
  fs.writeFileSync(path.join(BANC, 'mesures', `${etiquette}.json`), JSON.stringify({ le: new Date().toISOString(), taux: t, lignes }, null, 1));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main().catch((e) => { console.error(e); process.exit(1); });
