// Note les réponses de reponses/<config>/NN.json contre banc-liens/verite-ajout.json (liens 26 à 63).
// Les liens 1 à 25 n'ont pas de vérité écrite champ par champ (seulement des captures et le tableau du RAPPORT) : non notés ici.
// Aucun appel Gemini. Les photos sont vérifiées par le réseau (HEAD/GET public), résultat gardé dans photos-verif.json.
// Usage : node score.mjs   → écrit scores.json et affiche le tableau.
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const BANC = path.join(ICI, '..', '..');
const VERITE = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(BANC, 'verite-ajout.json'), 'utf8')).map((v) => [v.n, v]));
const nn = (n) => String(n).padStart(2, '0');
const CFGS = ['lite', 'f38', 'f38s', 'hyd', 'neon'];

const lire = (cfg, n) => { const f = path.join(ICI, 'reponses', cfg, nn(n) + '.json'); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; };
const pageHtml = (n) => ['pages', 'outils/chrome', 'outils/jina'].map((d) => { const f = path.join(BANC, d, nn(n) + '.html.gz'); return fs.existsSync(f) ? zlib.gunzipSync(fs.readFileSync(f)).toString('utf8') : ''; }).join('\n');

// nombres lus dans une page : « 2'190.00 », « 2 190,00 », « 2.190,00 » → 2190 ; comparaison à 0,5 % près
function nombres(texte) {
  const t = texte.replace(/&nbsp;|&#160;| | /g, ' ').replace(/(\d)[' ’](?=\d{3}\b)/g, '$1');
  const s = new Set();
  for (const m of t.matchAll(/\d+(?:[.,]\d+)*/g)) {
    const brut = m[0];
    s.add(brut.replace(',', '.'));
    const sansMille = brut.replace(/[.,](?=\d{3}(?:\D|$))/g, '');
    s.add(sansMille.replace(',', '.'));
    const v = Number(sansMille.replace(',', '.'));
    if (Number.isFinite(v)) s.add(String(v));
  }
  return s;
}
const prixDansPage = (p, ens) => [...ens].some((x) => { const v = Number(x); return Number.isFinite(v) && Math.abs(v - p) <= Math.abs(p) * 0.005 + 0.005; });
const normaliser = (s) => String(s ?? '').toLowerCase().replace(/[  ]/g, ' ').replace(/(\d),(\d)/g, '$1.$2').replace(/\s+/g, ' ');

// caractéristique de la vérité retrouvée dans les paires du modèle
function retrouvee(vc, paires) {
  const t = normaliser(paires.map((p) => `${p?.nom ?? ''} ${p?.valeur ?? ''}`).join(' | '));
  const nums = normaliser(vc.valeur).match(/\d+(?:\.\d+)?/g) || [];
  if (nums.length) return nums.every((x) => new RegExp(`(^|[^\\d.])${x.replace('.', '\\.')}([^\\d]|\\.(?!\\d)|$)`).test(t));
  const mots = normaliser(vc.valeur).split(/[^a-zà-ÿ0-9]+/).filter((w) => w.length > 2);
  return mots.length > 0 && mots.filter((w) => t.includes(w)).length / mots.length >= 0.6;
}

const cachePhotos = fs.existsSync(path.join(ICI, 'photos-verif.json')) ? JSON.parse(fs.readFileSync(path.join(ICI, 'photos-verif.json'), 'utf8')) : {};
async function verifierPhoto(url) {
  if (cachePhotos[url]) return cachePhotos[url];
  let etat = 'inconnu';
  for (const methode of ['HEAD', 'GET']) {
    const ctl = new AbortController(); const m = setTimeout(() => ctl.abort(), 10_000);
    try {
      const r = await fetch(url, { method: methode, redirect: 'follow', signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36', Range: 'bytes=0-0' } });
      if (r.status === 200 || r.status === 206) { etat = /^image\//i.test(r.headers.get('content-type') || '') ? 'image' : 'pas-image'; break; }
      if (r.status === 404 || r.status === 410) { etat = 'absente'; break; }
      etat = `http-${r.status}`;
    } catch (e) { etat = e?.cause?.code === 'ENOTFOUND' ? 'absente' : 'injoignable'; } finally { clearTimeout(m); }
  }
  cachePhotos[url] = etat; return etat;
}

const lignes = [];
for (const cfg of CFGS) {
  for (let n = 26; n <= 63; n++) {
    const r = lire(cfg, n);
    if (!r) continue;
    const v = VERITE[n]; const j = r.json || {};
    const html = pageHtml(n); const ens = nombres(html); const htmlN = normaliser(html);
    const L = { cfg, n, ms: r.ms, http: r.http, chf: r.chf, entree: r.entree, sortie: r.sortie, inventions: [] };
    // prix
    const p = typeof j.prix === 'number' ? j.prix : null;
    L.prixModele = p; L.deviseModele = j.devise ?? null;
    L.prixJuste = p != null && v.prix != null && Math.abs(p - v.prix) <= Math.abs(v.prix) * 0.005 + 0.005 && (!j.devise || !v.devise || String(j.devise).toUpperCase() === v.devise);
    if (p === 0) L.inventions.push('prix 0');
    else if (p != null && !prixDansPage(p, ens)) L.inventions.push(`prix ${p} absent de la page`);
    if (typeof j.ttc === 'boolean' && v.ttc != null) L.ttcJuste = j.ttc === v.ttc;
    // frais vers la Suisse (vérité : seulement quand livraisonCH est connue)
    if (v.livraisonCH) {
      const f = normaliser(j.fraisSuisse);
      const att = v.livraisonCH === 'refusee' ? /refus|impossible|pas de livraison|ne livre|not (?:ship|deliver)|non livr/ : v.livraisonCH === 'gratuite' ? /gratuit|free|kostenlos|0[.,]00|offert/ : v.livraisonCH.prix != null ? new RegExp(String(v.livraisonCH.prix).replace('.', '[.,]')) : null;
      L.fraisJuste = att ? att.test(f) : null;
    }
    // photo
    const urls = (Array.isArray(j.photos) ? j.photos : []).filter((u) => typeof u === 'string' && /^https?:/.test(u)).slice(0, 3);
    const etats = [];
    for (const u of urls) { const dansPage = htmlN.includes(normaliser(u).replace(/^https?:/, '')) || htmlN.includes(path.basename(new URL(u).pathname).toLowerCase()); const e = await verifierPhoto(u); etats.push({ u, etat: e, dansPage }); if (e === 'absente' && !dansPage) L.inventions.push(`photo introuvable ${u.slice(0, 80)}`); }
    L.photos = etats;
    const bonnes = etats.filter((x) => x.etat === 'image' || x.dansPage);
    L.photoJuste = v.photo ? bonnes.length > 0 : urls.length === 0;
    // caractéristiques
    const paires = Array.isArray(j.caracteristiques) ? j.caracteristiques : [];
    const vcs = v.caract || [];
    if (vcs.length) { L.caractTrouvees = vcs.filter((vc) => retrouvee(vc, paires)).length; L.caractAttendues = vcs.length; L.caractJuste = L.caractTrouvees >= Math.ceil(vcs.length / 2); }
    for (const c of paires) {
      const nb = normaliser(c?.valeur).match(/\d+(?:\.\d+)?/g) || [];
      const manque = nb.filter((x) => !prixDansPage(Number(x), ens) && !ens.has(x));
      if (nb.length && manque.length) L.inventions.push(`caractéristique « ${String(c?.nom).slice(0, 30)} : ${String(c?.valeur).slice(0, 40)} » : ${manque.join(',')} absent de la page`);
    }
    L.nbPaires = paires.length;
    lignes.push(L);
  }
}
fs.writeFileSync(path.join(ICI, 'photos-verif.json'), JSON.stringify(cachePhotos, null, 1));
fs.writeFileSync(path.join(ICI, 'scores.json'), JSON.stringify(lignes, null, 1));

const pct = (a, b) => (b ? `${a}/${b} (${Math.round((100 * a) / b)} %)` : 'n/a');
const mediane = (v) => { const s = [...v].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : NaN; };
const p90 = (v) => { const s = [...v].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.ceil(0.9 * s.length) - 1)] : NaN; };
const sec = (ms) => (Number.isFinite(ms) ? (ms / 1000).toFixed(1) + ' s' : 'n/a');
const communs = [...new Set(lignes.filter((l) => l.cfg === 'lite').map((l) => l.n))].filter((n) => ['f38', 'hyd'].every((c) => lignes.some((l) => l.cfg === c && l.n === n))).sort((a, b) => a - b);
console.log('liens communs lite/3.8/Hydrogen :', communs.join(','));
const sortie = {};
for (const cfg of ['lite', 'f38', 'hyd', 'neon']) {
  const tous = lignes.filter((l) => l.cfg === cfg);
  const ok = tous.filter((l) => l.http === 200);
  const com = tous.filter((l) => communs.includes(l.n));
  const car = com.filter((l) => l.caractAttendues);
  const ligne = {
    cfg, appels: tous.length, erreurs: tous.length - ok.length, communs: com.length,
    prix: pct(com.filter((l) => l.prixJuste).length, com.length),
    photo: pct(com.filter((l) => l.photoJuste).length, com.length),
    caract: pct(car.filter((l) => l.caractJuste).length, car.length),
    inventions: com.reduce((a, l) => a + l.inventions.length, 0),
    inventionsTous: tous.reduce((a, l) => a + l.inventions.length, 0),
    med: sec(mediane(ok.map((l) => l.ms))), p90: sec(p90(ok.map((l) => l.ms))),
    chfLien: tous.reduce((a, l) => a + l.chf, 0) / tous.length
  };
  sortie[cfg] = ligne; console.log(JSON.stringify(ligne));
}
fs.writeFileSync(path.join(ICI, 'synthese.json'), JSON.stringify({ communs, sortie }, null, 1));
for (const l of lignes) if (l.inventions.length) console.log('INVENTION', l.cfg, l.n, l.inventions.join(' ; '));
for (const l of lignes) if (!l.prixJuste || !l.photoJuste || l.caractJuste === false) console.log('RATE', l.cfg, String(l.n), 'prix', l.prixJuste ? 'ok' : `${l.prixModele}${l.deviseModele ?? ''} vs ${VERITE[l.n].prix}`, '| photo', l.photoJuste ? 'ok' : JSON.stringify(l.photos.map((x) => x.etat)), '| caract', l.caractJuste === undefined ? '-' : `${l.caractTrouvees}/${l.caractAttendues}`);
