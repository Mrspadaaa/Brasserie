#!/usr/bin/env node
// D132 (24.10, soir), sur flb5b : « La matrice nettoyée flb5b · de flb5 est très bien mais le footer doit être aussi avec tout
// ces informations comme 4 · Les cartes de famille · flu2b. Attention car la carte du houblons doit bien contenir de façon
// exhaustive TOUTES ses informations. » Le pied de flu2b : ♡ ⊘ et « Comparer », puis « Styles › Huiles › Sources › Substituts › ».
//
// Ce contrôle joue une fiche ouverte à 390 × 844 et refuse :
//   P1 un pied sans ses quatre replis (Styles, Huiles, Sources, Substituts), sans « Comparer » ou sans ♡ ⊘ ;
//   P2 une information du houblon (pack-fiches.json) absente du texte visible, au premier plan ou après un toucher sur chaque
//      repli du pied : nom, α et β de chaque fiche, huile totale et ses composés, origine, rôle, styles, sources, stock, dose
//      dans ma recette, IBU par gramme à 60′, familles citées et leurs mots précis, mots hors des 12 familles, remplaçants.
// Le houblon : [data-houblon-ouvert], [data-houblon-fiche], --houblon=<nom>, ou le premier nom du pack lu en tête de page.
// Usage : node controle-fiche-exhaustive.mjs <page.html> [--houblon=<nom>]
// Sortie : « EXHAUSTIVE OK (…) » ou « EXHAUSTIVE ECHEC (…) ».
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const page = args.find((a) => !a.startsWith('--'));
const voulu = (args.find((a) => a.startsWith('--houblon=')) ?? '').slice(10);
if (!page || !fs.existsSync(path.resolve(RACINE, page))) { console.log('Usage : node controle-fiche-exhaustive.mjs <page.html> [--houblon=<nom>]'); process.exit(2); }

const pack = JSON.parse(fs.readFileSync(path.join(RACINE, 'prototypes/houblons-v4/data/pack-fiches.json'), 'utf8')).fichesHoublons;
const norm = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u00a0\u202f]/g, ' ').toLowerCase().replace(/\s+/g, ' ').trim();
const fr = (n) => String(n).replace('.', ',');
// Notre table de traduction (flu2b, « notre traduction ») : le mot d'origine ou sa traduction suffit.
const TRAD = { 'white wine': 'vin blanc', fruity: 'fruite', grape: 'raisin', gooseberry: 'groseille a maquereau', pineapple: 'ananas',
  woody: 'boise', resinous: 'resineux', resiny: 'resineux', coffee: 'cafe', onion: 'oignon', neutral: 'neutre', delicate: 'delicat',
  lemon: 'citron', grass: 'herbe', vanilla: 'vanille', tabacco: 'tabac', mild: 'doux' };
const COURT = { citrus: 'agrumes', tropical: 'tropicaux', stoneFruit: 'noyau', pomeFruit: 'pepins', berries: 'baies', melon: 'melon',
  floral: 'floral', herbal: 'herbace', resin: 'resineux', spice: 'epice', green: 'vegetal', earthy: 'terreux' };
const HUILE = { myrcene: 'myrcen', humulene: 'humulen', caryophyllene: 'caryophyllen', farnesene: 'farnesen', linalool: 'linalo', geraniol: 'geraniol' };
const ABREGE = { 'beer maverick': 'bm', hopsteiner: 'hs', 'yakima chief': 'ych' };
const ROLE = { aroma: 'arome', bittering: 'amer', dual: 'double usage' };

const nav = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await nav.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await p.goto(pathToFileURL(path.resolve(RACINE, page)).href, { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise((r) => setTimeout(r, 600));
const lu = await p.evaluate(() => {
  const cle = document.querySelector('[data-houblon-ouvert]')?.getAttribute('data-houblon-ouvert')
    ?? document.querySelector('[data-houblon-fiche]')?.getAttribute('data-houblon-fiche') ?? null;
  const nom = (e) => `${e.innerText || ''} ${e.getAttribute('aria-label') || ''} ${e.getAttribute('title') || ''}`.replace(/\s+/g, ' ').trim();
  const boutons = [...document.querySelectorAll('button, [role="button"], a, summary')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).map(nom);
  const gout = !!document.querySelector('[data-gout], [data-role="gout"]') || boutons.some((b) => /♡|aime|cœur|coeur/i.test(b)) && boutons.some((b) => /⊘|exclu|écart/i.test(b));
  return { cle, boutons, gout, tete: (document.body.innerText || '').slice(0, 400) };
});
const fiche = (lu.cle && pack.find((h) => h.key === lu.cle))
  || (voulu && pack.find((h) => norm(h.name) === norm(voulu) || h.key === voulu))
  || [...pack].sort((a, b) => b.name.length - a.name.length).find((h) => norm(lu.tete).includes(norm(h.name)));
if (!fiche) { await nav.close(); console.log(`EXHAUSTIVE ECHEC (aucun houblon du pack reconnu en tête de page ; --houblon=<nom> ; tête lue : « ${lu.tete.replace(/\s+/g, ' ').slice(0, 160)} »)`); process.exit(1); }

const ecarts = [];
const REPLIS = ['Styles', 'Huiles', 'Sources', 'Substituts'];
const manquent = REPLIS.filter((r) => !lu.boutons.some((b) => new RegExp(`^${r}\\b`, 'i').test(b)));
if (manquent.length) ecarts.push(`P1 pied sans ${manquent.join(', ')} (le pied de flu2b)`);
if (!lu.boutons.some((b) => /comparer/i.test(b))) ecarts.push('P1 pied sans « Comparer »');
if (!lu.gout) ecarts.push('P1 pied sans ♡ ⊘');

// Le texte visible, au repos puis après un toucher sur chaque repli du pied (et un second pour le refermer si besoin).
let texte = norm(await p.evaluate(() => document.body.innerText));
for (const r of REPLIS) {
  const fait = await p.evaluate((r) => {
    const b = [...document.querySelectorAll('button, [role="button"], summary')].find((e) => new RegExp(`^${r}\\b`, 'i').test((e.innerText || e.getAttribute('aria-label') || '').trim()));
    if (!b) return false; b.click(); return true;
  }, r);
  if (!fait) continue;
  await new Promise((res) => setTimeout(res, 350));
  texte += ' ' + norm(await p.evaluate(() => document.body.innerText));
}
await nav.close();

const a = (t) => texte.includes(norm(t));
const plage = (x) => x.min === x.max ? new RegExp(`\\b${fr(x.min)}\\b`) : new RegExp(`\\b${fr(x.min)}\\s*%?\\s*(?:–|-|a)\\s*${fr(x.max)}\\b`);
const mot = (m) => { const n = norm(m); return a(n) || (TRAD[n] && a(TRAD[n])); };
const besoins = [];
const exiger = (cat, items) => { const absents = items.filter((i) => !i.ok); besoins.push(cat); if (absents.length) ecarts.push(`P2 ${cat} : ${absents.map((i) => i.dit).join(', ')}`); };

exiger('nom', [{ dit: fiche.name, ok: a(fiche.name) }]);
for (const [cat, bloc] of [['α', fiche.alpha], ['β', fiche.beta], ['huile totale', fiche.huiles?.totale]]) {
  if (bloc?.sources?.length) exiger(cat, bloc.sources.map((s) => ({ dit: `${s.source} ${fr(s.min)}–${fr(s.max)}`, ok: plage(s).test(texte) })));
}
const comp = Object.entries(fiche.huiles?.composants ?? {}).filter(([k, v]) => HUILE[k] && v);
if (comp.length) exiger('composés des huiles', comp.map(([k]) => ({ dit: k, ok: texte.includes(HUILE[k]) })));
if (fiche.origin) exiger('origine', [{ dit: fiche.origin, ok: a(fiche.origin) }]);
const role = fiche.role?.value ?? fiche.role;
if (typeof role === 'string' && ROLE[role]) exiger('rôle', [{ dit: ROLE[role], ok: texte.includes(ROLE[role]) }]);
const styles = [...new Set((fiche.usage ?? []).flatMap((u) => u.styles ?? []))];
if (styles.length) exiger('styles', styles.map((s) => ({ dit: s, ok: a(s) })));
const sources = new Set();
for (const b of [fiche.alpha, fiche.beta, fiche.huiles?.totale]) for (const s of b?.sources ?? []) sources.add(s.source);
for (const u of fiche.usage ?? []) if (u.source) sources.add(u.source.split(/[,—]/)[0].trim());
exiger('sources', [...sources].map((s) => ({ dit: s, ok: a(s) || (ABREGE[norm(s)] && new RegExp(`\\b${ABREGE[norm(s)]}\\b`).test(texte)) })));
if (fiche.stock) exiger('stock', [{ dit: fiche.stock.grams > 0 ? `${fr(fiche.stock.grams)} g` : `${fiche.stock.etat} (ou 0 g)`, ok: new RegExp(`\\b${fr(fiche.stock.grams)}\\s*g\\b`).test(texte) || fiche.stock.grams <= 0 && a(fiche.stock.etat) }]);
if (fiche.dansRecette?.length) exiger('dans ma recette', [{ dit: fiche.dansRecette.map((d) => `${fr(d.grams)} g`).join(' ou '), ok: fiche.dansRecette.some((d) => new RegExp(`\\b${fr(d.grams)}\\s*g\\b`).test(texte)) }]);
const b60 = fiche.ibuParGramme?.moments?.find((m) => m.code === 'b60')?.ibuPerGram?.value;
if (b60 != null) exiger('IBU par gramme à 60′', [{ dit: fr(b60), ok: new RegExp(`\\b${fr(b60)}0*\\b`).test(texte) }]);
const cites = (fiche.aromes ?? []).filter((x) => x.level > 0);
exiger('familles citées', cites.map((x) => ({ dit: x.name, ok: a(x.name) || texte.includes(COURT[x.family] ?? '\u0000') })));
const precis = [];
for (const x of cites) for (const m of new Set(x.mots.flatMap((s) => s.mots).map(norm))) {
  const t = TRAD[m] ?? m;
  if (t === norm(x.name) || t === COURT[x.family] || x.family === 'floral' && t === 'floral') continue;
  precis.push({ dit: `${COURT[x.family]} · ${m}`, ok: mot(m) });
}
if (precis.length) exiger('mots précis des familles', precis);
const hors = [...new Map((fiche.motsSansFamille ?? []).map((x) => [TRAD[norm(x.mot)] ?? norm(x.mot), x.mot])).values()];
if (hors.length) exiger('mots hors des 12', hors.map((m) => ({ dit: m, ok: mot(m) })));
const remp = fiche.substitutsCalcules?.remplacants?.slice(0, 4) ?? [];
if (remp.length) exiger('remplaçants', remp.map((r) => ({ dit: r.name, ok: a(r.name) })));

console.log(ecarts.length
  ? `EXHAUSTIVE ECHEC ${fiche.name} (${ecarts.join(' ; ')})`
  : `EXHAUSTIVE OK ${fiche.name} (pied de flu2b ; ${besoins.length} catégories : ${besoins.join(', ')})`);
process.exit(ecarts.length ? 1 : 0);
