// Vérifie les pièces piégées d'un dossier (voie t-pieges, D381).
//   node verifier.mjs <dossier>   ->  « PIÈGES OK n/n » (code 0) ou « PIÈGES ÉCHEC k/n » + motifs (code 1)
// Pour chaque pièce : les couleurs du masque redonnent toutes les lignes de la vérité, dans l'ordre ; chaque article a au moins
// une ligne ; total = somme exacte ; articles piégés présents (suite identique, remises, arrondi, articles multi-lignes).
// Écrit pieges.json (pièces, tailles, nombre d'articles, total).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const MIN_PX = 20; // une couleur de masque compte à partir de 20 pixels (les vraies lignes en ont des milliers)

function decoderPng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('pas un PNG');
  let off = 8, w = 0, h = 0, depth = 0, ctype = 0, interlace = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString('latin1', off + 4, off + 8), data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9]; interlace = data[12]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (depth !== 8 || interlace !== 0 || (ctype !== 2 && ctype !== 6)) throw new Error('PNG non géré (profondeur ' + depth + ', type ' + ctype + ')');
  const bpp = ctype === 6 ? 4 : 3, stride = w * bpp;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride;
    for (let i = 0; i < stride; i++) {
      const x = raw[src + i];
      const a = i >= bpp ? px[dst + i - bpp] : 0, b = y > 0 ? px[dst - stride + i] : 0, c = i >= bpp && y > 0 ? px[dst - stride + i - bpp] : 0;
      let v;
      if (f === 0) v = x; else if (f === 1) v = x + a; else if (f === 2) v = x + b; else if (f === 3) v = x + ((a + b) >> 1);
      else { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      px[dst + i] = v & 255;
    }
  }
  return { w, h, bpp, px };
}

function tailleJpeg(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error('pas un JPEG');
  let off = 2;
  while (off < buf.length) {
    if (buf[off] !== 0xff) { off++; continue; }
    const m = buf[off + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: buf.readUInt16BE(off + 5), w: buf.readUInt16BE(off + 7) };
    off += 2 + buf.readUInt16BE(off + 2);
  }
  throw new Error('taille JPEG introuvable');
}

function verifierPiece(dossier, nom) {
  const erreurs = [];
  const err = (m) => erreurs.push(m);
  const v = JSON.parse(fs.readFileSync(path.join(dossier, nom + '.verite.json'), 'utf8'));
  const jpgP = path.join(dossier, nom + '.jpg'), mP = path.join(dossier, nom + '.masque.png');
  if (!fs.existsSync(jpgP) || fs.statSync(jpgP).size < 1000) err('jpg absent ou vide');
  if (!fs.existsSync(mP)) err('masque absent');
  if (erreurs.length) return { erreurs, v };
  const j = tailleJpeg(fs.readFileSync(jpgP));
  const m = decoderPng(fs.readFileSync(mP));
  if (j.w !== m.w || j.h !== m.h) err('taille image ' + j.w + 'x' + j.h + ' différente du masque ' + m.w + 'x' + m.h);
  if (v.image && (v.image.largeur !== m.w || v.image.hauteur !== m.h)) err('taille déclarée ' + v.image.largeur + 'x' + v.image.hauteur + ' ≠ masque');

  // --- masque : couleurs -> lignes ---
  const L = v.lignes.length;
  const compte = new Map();
  for (let y = 0; y < m.h; y++) {
    for (let x = 0; x < m.w; x++) {
      const i = (y * m.w + x) * m.bpp, key = (m.px[i] << 16) | (m.px[i + 1] << 8) | m.px[i + 2];
      if (key === 0) continue;
      let e = compte.get(key);
      if (!e) { e = { n: 0, sy: 0 }; compte.set(key, e); }
      e.n++; e.sy += y;
    }
  }
  const vues = [];
  for (const [key, e] of compte) {
    if (e.n < MIN_PX) continue;
    const r = (key >> 16) & 255, g = (key >> 8) & 255, b = key & 255;
    if (b !== 0) { err('couleur de masque étrangère rgb(' + r + ',' + g + ',' + b + ') sur ' + e.n + ' px'); continue; }
    vues.push({ n: r | (g << 8), y: e.sy / e.n, px: e.n });
  }
  vues.sort((a, b) => a.n - b.n);
  const attendu = L;
  if (vues.length !== attendu) err('masque : ' + vues.length + ' lignes lues, ' + attendu + ' attendues');
  for (let i = 0; i < vues.length; i++) {
    if (vues[i].n !== i + 1) { err('masque : ligne ' + (i + 1) + ' manquante ou numéro inattendu ' + vues[i].n); break; }
    if (i > 0 && vues[i].y <= vues[i - 1].y) { err('masque : lignes ' + i + ' et ' + (i + 1) + ' dans le désordre'); break; }
  }

  // --- vérité : articles et lignes ---
  const A = v.articles.length;
  if (v.lignes.some((x) => x !== null && (!Number.isInteger(x) || x < 0 || x >= A))) err('lignes : rang d\'article invalide');
  const par = new Array(A).fill(0);
  let prec = -1;
  v.lignes.forEach((x) => { if (x !== null) { par[x]++; if (x < prec) err('lignes : articles dans le désordre'); prec = x; } });
  par.forEach((n, r) => { if (n === 0) err('article ' + r + ' sans ligne'); else if (v.articlesLignes && v.articlesLignes[r] !== n) err('article ' + r + ' : ' + n + ' lignes, ' + v.articlesLignes[r] + ' déclarées'); });
  let somme = 0;
  v.articles.forEach((a, r) => {
    if (!a.name || typeof a.quantity !== 'number' || !a.unit || typeof a.price !== 'number' || typeof a.amountTTC !== 'number') err('article ' + r + ' incomplet');
    if (Math.abs(Math.round(a.quantity * a.price * 100) - Math.round(a.amountTTC * 100)) > 1) err('article ' + r + ' : quantité × prix ≠ montant');
    somme += Math.round(a.amountTTC * 100);
  });
  if (somme !== Math.round(v.totalTTC * 100)) err('total ' + v.totalTTC + ' ≠ somme ' + somme / 100);
  if (v.fournisseur !== 'Brasserie Fictive SA') err('fournisseur inattendu');

  // --- pièges attendus ---
  const p = v.params || {};
  const noms = v.articles.map((a) => a.name);
  if (!v.articles.some((a) => a.name === 'ARRONDI' && a.amountTTC !== 0)) err('ligne d\'arrondi absente ou nulle');
  if (!v.articles.some((a) => a.amountTTC < 0 && a.name !== 'ARRONDI')) err('aucune remise négative');
  if (p.run) {
    const idx = noms.map((n, i) => (n === 'BIERE BLONDE 33CL' ? i : -1)).filter((i) => i >= 0);
    if (idx.length < p.run.len || idx[idx.length - 1] - idx[0] !== idx.length - 1) err('suite de lignes identiques absente ou rompue');
    else if (idx.length !== p.run.len) err('suite identique : ' + idx.length + ' au lieu de ' + p.run.len);
    else if (v.articles[idx[0]].price !== 2.5) err('suite identique : prix ≠ 2.50');
  } else if (p.preset) err('pas de suite identique déclarée'); // une pièce au hasard peut n'avoir aucune suite
  if (p.preset) {
    if (p.kind === 'ticket') {
      if (v.image.hauteur <= 3 * p.W) err('ticket : hauteur ≤ 3 × largeur');
      if (A < 120 || A > 150) err('ticket : ' + A + ' articles (120 à 150 attendus)');
    } else if (nom === 'facture-zebre') {
      const nl = v.lignes.filter((x) => x !== null).length;
      if (nl !== 300) err('facture : ' + nl + ' lignes de tableau au lieu de 300');
    }
    if (p.forceEvery) { // un article multi-lignes au moins tous les 10 articles
      const multi = v.articlesLignes.map((n, i) => (n >= 2 ? i : -1)).filter((i) => i >= 0);
      if (multi[0] > 9) err('premier article multi-lignes trop tard');
      for (let i = 1; i < multi.length; i++) if (multi[i] - multi[i - 1] > 10) err('plus de 10 articles sans multi-lignes (' + multi[i - 1] + ' à ' + multi[i] + ')');
    }
  }
  if (!v.articlesLignes.some((n) => n >= 2)) err('aucun article sur plusieurs lignes');
  return { erreurs, v, m };
}

function main() {
  const dossier = process.argv[2];
  if (!dossier) { console.error('usage : verifier.mjs <dossier>'); process.exit(2); }
  const noms = fs.readdirSync(dossier).filter((f) => f.endsWith('.verite.json')).map((f) => f.replace('.verite.json', '')).sort();
  if (noms.length === 0) { console.log('PIÈGES ÉCHEC 0/0 : aucune pièce'); process.exit(1); }
  const liste = []; let ok = 0;
  for (const nom of noms) {
    let r;
    try { r = verifierPiece(dossier, nom); } catch (e) { r = { erreurs: ['exception : ' + e.message], v: null }; }
    if (r.erreurs.length === 0) ok++;
    else console.log('ÉCHEC ' + nom + ' : ' + r.erreurs.slice(0, 4).join(' ; '));
    liste.push({ nom, ok: r.erreurs.length === 0, largeur: r.v && r.v.image && r.v.image.largeur, hauteur: r.v && r.v.image && r.v.image.hauteur,
      articles: r.v ? r.v.articles.length : null, lignes: r.v ? r.v.lignes.length : null, totalTTC: r.v ? r.v.totalTTC : null, erreurs: r.erreurs });
  }
  fs.writeFileSync(path.join(dossier, 'pieges.json'), JSON.stringify({ n: noms.length, ok, pieces: liste }, null, 1));
  console.log(ok === noms.length ? 'PIÈGES OK ' + ok + '/' + noms.length : 'PIÈGES ÉCHEC ' + ok + '/' + noms.length);
  process.exit(ok === noms.length ? 0 : 1);
}
main();
