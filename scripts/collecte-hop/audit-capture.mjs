// Voie c3g (#180) : audit de capture, hors ligne, sur le cache.
// Pour chaque fiche de src/data/hopSources/*.json dont la page (une page = une fiche) est dans le cache, on compare :
//   - « publié »  : le mot clé d'analyse est présent dans la page, suivi d'un nombre ;
//   - « capturé » : la fiche porte une valeur (valeur, min ou max) pour ce champ.
// Taux de capture d'un champ = fiches capturées parmi les pages qui le publient. Aucun réseau, aucune écriture dans le cache.
// Usage : node scripts/collecte-hop/audit-capture.mjs [--source=id] [--detail=champ] [--json=chemin] [--md=chemin] [--avant=chemin.json]
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lignes } from './c3c-commun.mjs';

const racine = resolve(fileURLToPath(import.meta.url), '..', '..', '..');
const CACHE = resolve(process.env.HOP_SOURCE_CACHE || 'C:/Users/mrspa/Documents/Brasserie/.codex-remote-attachments/hop-index/public-sources');
const DOSSIER = resolve(racine, 'src/data/hopSources');
const sha = s => createHash('sha256').update(s).digest('hex');

/** Un mot clé = un champ d'analyse. `cle` : motif du nom du champ dans fiche.champs. */
const NB = String.raw`\d+(?:[.,]\d+)?`;
export const CHAMPS = [
  { id: 'alpha', mot: String.raw`(?<![/\w-])(?<!of )(?:alpha|α)(?:[- ]?acids?)?(?![- ]?(?:humulene|pinene|terpineol|selinene|cadinene|copaene|muurolene|bisabolol|\/|-?\s*beta))`, cle: /^alpha(?!ferme)/i },
  { id: 'beta', mot: String.raw`(?<![/\w-])(?<!of )(?:beta|β)(?:[- ]?acids?)?(?![- ]?(?:pinene|myrcene|farnesene|caryophyllene|selinene|damascenone|eudesmol|ocimene|\/))`, cle: /^beta(?!pinene|ferme)/i },
  { id: 'cohumulone', mot: String.raw`co-?humulone`, cle: /cohumulone/i },
  { id: 'colupulone', mot: String.raw`colupulone`, cle: /colupulone/i },
  { id: 'huile totale', mot: String.raw`(?<!of )(?<!(?:myrcene|humulene|caryophyllene|farnesene|linalool|geraniol) )(?:total[- ]oils?|oil content|(?:essential )?oils? ?\(?(?:ml|mL)|total essential oil)`, cle: /^huile_?totale|^totaloil/i },
  { id: 'myrcène', mot: String.raw`myrcene`, cle: /myrcene/i },
  { id: 'humulène', mot: String.raw`(?<![/\w])(?:[αa]lpha[- ]?|α-?)?humulen[e]?(?![\s/-]*(?:epoxide|caryophyll))`, cle: /^humulene/i },
  { id: 'caryophyllène', mot: String.raw`(?<!/)caryophyllen[e]?(?![\s-]*(?:oxide|epoxide))`, cle: /^caryophyllene/i },
  { id: 'farnésène', mot: String.raw`farnesen[e]?`, cle: /^farnesene/i },
  { id: 'linalol', mot: String.raw`linalo{1,2}l?`, cle: /^linalo/i },
  { id: 'géraniol', mot: String.raw`geraniol`, cle: /geraniol/i },
  { id: 'β-pinène', mot: String.raw`(?:(?:beta|β)[- ]?)?pinene`, cle: /pinene/i },
  { id: 'sélinène', mot: String.raw`(?:(?:beta|β)[- ]?)?selinene`, cle: /selinene/i },
  { id: 'xanthohumol', mot: String.raw`xanthohumol`, cle: /xanthohumol/i },
  { id: 'polyphénols', mot: String.raw`polyphenols?\b(?!\s*xanthohumol)`, cle: /polyphenol/i },
  { id: 'thiols', mot: String.raw`(?:thiols?|4mmp|3mh|3sh)`, cle: /thiol|4mmp|3mh/i },
  { id: 'HSI / conservation', mot: String.raw`(?:\bhsi\b|storage stability|storage index|hop storage)`, cle: /^(hsi|conservation)/i },
];
const suivi = n => String.raw`[^\d;]{0,${n}}?(?<![\w.])(?:<|≤|up to |less than |max\.? |min\.? |~)?${NB}(?:\s*%?\s*(?:-|–|to)\s*${NB})?`;
// Fenêtre « mot clé … nombre » : 50 caractères ; 12 pour la conservation (« Storage Stability Very good Updated 2026 » n'est pas une valeur).
const regex = CHAMPS.map(c => new RegExp(String.raw`(?<![A-Za-z])${c.mot}${suivi(c.id.startsWith('HSI') ? 12 : 50)}`, 'i'));

// Une valeur chiffrée, un zéro publié seul, ou une valeur qualitative écrite (« low » pour l'impact thiol de Hopsteiner).
export const aUneValeur = c => !!c && typeof c === 'object' && ([c.valeur, c.min, c.max].some(x => typeof x === 'number' && Number.isFinite(x)) || c.zeroPublie === true || (typeof c.valeur === 'string' && c.valeur !== ''));

/** Texte lisible d'une page du cache : HTML visible, PDF (pdftotext -raw), PDF base64. null si absente. */
export function textePage(url, cache = CACHE) {
  const chemin = resolve(cache, sha(url));
  const pdfBrut = octets => {
    const dossier = mkdtempSync(join(tmpdir(), 'c3g-pdf-'));
    try { const f = join(dossier, 'x.pdf'); writeFileSync(f, octets); return execFileSync('pdftotext', ['-raw', '-enc', 'UTF-8', f, '-'], { encoding: 'utf8', maxBuffer: 1 << 26 }); }
    catch { return ''; } finally { rmSync(dossier, { recursive: true, force: true }); }
  };
  if (existsSync(chemin + '.pdf')) return { texte: pdfBrut(readFileSync(chemin + '.pdf')), type: 'pdf' };
  if (!existsSync(chemin) || !existsSync(chemin + '.json')) return null;
  const recu = JSON.parse(readFileSync(chemin + '.json', 'utf8')), brut = readFileSync(chemin, 'utf8');
  if (recu.encoding === 'base64') return { texte: pdfBrut(Buffer.from(brut, 'base64')), type: 'pdf' };
  if (/^\s*(\{|\[)/.test(brut) && !/<html/i.test(brut.slice(0, 2000))) return { texte: brut, type: 'json' };
  return { texte: lignes(brut).join('\n'), type: 'html' };
}

/** Champs publiés dans un texte : { idChamp: extrait }. */
export function publies(texte) {
  const plat = texte.replace(/\s+/g, ' ');
  const sortie = {};
  // Un « 0 » ou « 0 - 0 » seul est le remplissage par défaut des pages (« Myrcene 0 ») : l'inconnu, pas une valeur publiée.
  const nul = s => { const t = /(\d+(?:[.,]\d+)?)(?:\s*%?\s*(?:-|–|to)\s*(\d+(?:[.,]\d+)?))?$/.exec(s); return !!t && [t[1], t[2]].filter(Boolean).every(x => parseFloat(x.replace(',', '.')) === 0); };
  CHAMPS.forEach((c, i) => {
    for (const m of plat.matchAll(new RegExp(regex[i].source, 'gi'))) if (!nul(m[0])) { sortie[c.id] = m[0].slice(0, 120); break; }
  });
  return sortie;
}

export function auditSource(id, { cache = CACHE, dossier = DOSSIER } = {}) {
  const doc = JSON.parse(readFileSync(resolve(dossier, `${id}.json`), 'utf8'));
  const parUrl = new Map();
  for (const f of doc.fiches) parUrl.set(f.url, (parUrl.get(f.url) ?? 0) + 1);
  const res = { id, fiches: doc.fiches.length, auditees: 0, horsCache: 0, partagees: 0, parChamp: Object.fromEntries(CHAMPS.map(c => [c.id, { publie: 0, capture: 0, manques: [] }])), extras: Object.fromEntries(CHAMPS.map(c => [c.id, 0])) };
  for (const f of doc.fiches) {
    if (!f.url || parUrl.get(f.url) > 1) { res.partagees++; continue; }
    const page = textePage(f.url, cache);
    if (!page) { res.horsCache++; continue; }
    res.auditees++;
    const pub = publies(page.texte);
    for (const c of CHAMPS) {
      const cles = Object.keys(f.champs ?? {}).filter(k => c.cle.test(k));
      const ok = cles.some(k => aUneValeur(f.champs[k]));
      if (pub[c.id]) { res.parChamp[c.id].publie++; if (ok) res.parChamp[c.id].capture++; else res.parChamp[c.id].manques.push({ nom: f.nom, url: f.url, extrait: pub[c.id] }); }
      else if (ok) res.extras[c.id]++;
    }
  }
  return res;
}

const pct = (a, b) => (b ? `${Math.round((1000 * a) / b) / 10} %` : '—');

export function tableauMd(resultats, avant = null) {
  const sortie = [];
  for (const r of resultats) {
    sortie.push(`### ${r.id}`, '', `${r.fiches} fiches ; ${r.auditees} pages auditées${r.horsCache ? `, ${r.horsCache} hors cache` : ''}${r.partagees ? `, ${r.partagees} fiches sur une page partagée (hors audit page à page)` : ''}.`, '');
    sortie.push(avant ? '| champ | pages qui le publient | fiches qui l\'ont | taux | avant |' : '| champ | pages qui le publient | fiches qui l\'ont | taux |', avant ? '|---|---:|---:|---:|---:|' : '|---|---:|---:|---:|');
    for (const c of CHAMPS) {
      const x = r.parChamp[c.id]; if (!x.publie && !r.extras[c.id]) continue;
      const a = avant?.find(y => y.id === r.id)?.parChamp?.[c.id];
      sortie.push(`| ${c.id} | ${x.publie} | ${x.capture} | ${pct(x.capture, x.publie)} |${avant ? ` ${a ? `${a.capture}/${a.publie} (${pct(a.capture, a.publie)})` : '—'} |` : ''}`);
    }
    sortie.push('');
  }
  return sortie.join('\n');
}

function principal() {
  const arg = n => process.argv.find(a => a.startsWith(`--${n}=`))?.split('=').slice(1).join('=');
  const dossier = arg('dossier') ? resolve(arg('dossier')) : DOSSIER;
  const ids = arg('source') ? [arg('source')] : readdirSync(dossier).filter(f => f.endsWith('.json') && !/^beeranalytics/.test(f)).map(f => f.replace(/\.json$/, ''));
  const resultats = ids.map(id => auditSource(id, { dossier }));
  const detail = arg('detail');
  if (detail) for (const r of resultats) for (const m of r.parChamp[detail]?.manques.slice(0, 8) ?? []) console.log(`${r.id} | ${m.nom} | ${m.url}\n    ${m.extrait}`);
  const avant = arg('avant') ? JSON.parse(readFileSync(arg('avant'), 'utf8')) : null;
  const md = tableauMd(resultats, avant);
  if (arg('json')) writeFileSync(arg('json'), JSON.stringify(resultats.map(r => ({ ...r, parChamp: Object.fromEntries(Object.entries(r.parChamp).map(([k, v]) => [k, { publie: v.publie, capture: v.capture, manques: v.manques.length }])) })), null, 2) + '\n');
  if (arg('md')) writeFileSync(arg('md'), md + '\n');
  if (!detail) console.log(md);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) principal();
