// Voie q2 : captures de l'apport (m5ap-a) sur le banc local, côte à côte avec la maquette. Rien n'est enregistré : jamais de clic sur « Enregistrer ».
// Usage (racine du dépôt) : node work/missions/2026-11-14-finances/voies/q2/capturer.mjs [clair|cave|tous] [390|1280|tous]
// Sorties dans voies/q2/cap/ : ouvert-<thème>-<l>.png (état ouvert), joint-<thème>-<l>.png (montant, motif, justificatif joint),
// preleve-<thème>-<l>.png (l'autre sens), cote-<thème>-<l>.png (maquette à gauche, app à droite, états ouvert puis joint).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = process.cwd();
const VOIE = path.join(RACINE, 'work/missions/2026-11-14-finances/voies/q2');
const CAP = path.join(VOIE, 'cap');
const MAQUETTE = path.join(RACINE, 'work/missions/2026-11-14-finances/voies/m5/m5ap-a/m5ap-a.png');
fs.mkdirSync(CAP, { recursive: true });
const L = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const URL_BANC = 'http://localhost:3000/?dev-local&finance-demo';
const themes = process.argv[2] && process.argv[2] !== 'tous' ? [process.argv[2]] : ['clair', 'cave'];
const largeurs = process.argv[3] && process.argv[3] !== 'tous' ? [Number(process.argv[3])] : [390, 1280];

// Un vrai PNG (un dégradé 64 × 48), écrit dans le dossier de la voie : le justificatif de la capture.
import zlib from 'node:zlib';
const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const morceau = (type, data) => { const t = Buffer.from(type), l = Buffer.alloc(4), k = Buffer.alloc(4); l.writeUInt32BE(data.length); k.writeUInt32BE(crc(Buffer.concat([t, data]))); return Buffer.concat([l, t, data, k]); };
const W = 64, H = 48, brut = Buffer.alloc((W * 3 + 1) * H, 0);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const ligne = y % 8 === 4 && x > 6 && x < 58, o = y * (W * 3 + 1) + 1 + x * 3; brut[o] = ligne ? 150 : 246; brut[o + 1] = ligne ? 150 : 246; brut[o + 2] = ligne ? 160 : 240; }
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
const FICHIER = path.join(CAP, 'releve-banque.png');
fs.writeFileSync(FICHIER, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), morceau('IHDR', ihdr), morceau('IDAT', zlib.deflateSync(brut)), morceau('IEND', Buffer.alloc(0))]));

const notes = [];
for (const theme of themes) for (const largeur of largeurs) {
  const mobile = largeur < 700;
  const { browser, page, journal } = await L.ouvrir({ largeur, hauteur: mobile ? 844 : 900, mobile });
  const cle = `${theme}-${largeur}`;
  const cliquer = (texte, aria = false) => page.evaluate((texte, aria) => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const e = [...document.querySelectorAll('button,[role="button"],[role="tab"],[role="radio"],a,[role="menuitem"]')]
      .filter((x) => x.getClientRects().length > 0).find((x) => norm(aria ? x.getAttribute('aria-label') : x.innerText).includes(texte));
    if (!e) return false; e.click(); return true;
  }, texte, aria);
  const etape = async (texte, aria = false) => { if (!(await cliquer(texte, aria))) throw new Error(`« ${texte} » absent`); await L.calme(page, 700); };
  try {
    await page.goto(URL_BANC, { waitUntil: 'domcontentloaded' });
    await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await L.calme(page, 1200);
    await etape('Finances'); await etape('Opérations'); await etape('Apport ou prélèvement privé');
    await page.screenshot({ path: path.join(CAP, `ouvert-${cle}.png`) });
    // Le geste : montant sur la flèche, motif, justificatif joint.
    const montant = await page.$('input[aria-label="Montant (CHF)"],textarea[aria-label="Montant (CHF)"]');
    await montant.click({ clickCount: 3 }); await montant.type('500'); await page.keyboard.press('Tab');
    const motif = await page.$('input[aria-label="Motif"],textarea[aria-label="Motif"]');
    await motif.click(); await motif.type('Apport pour le malt de décembre');
    const fichier = await page.$('input[aria-label="Justificatif : fichier ou PDF"]');
    await fichier.uploadFile(FICHIER); await L.calme(page, 700);
    await page.screenshot({ path: path.join(CAP, `joint-${cle}.png`) });
    await etape('Dans l’autre sens');
    await page.screenshot({ path: path.join(CAP, `preleve-${cle}.png`) });
    notes.push(`${cle} : ok`);
  } catch (e) { notes.push(`${cle} : ECHEC ${e.message}`); await page.screenshot({ path: path.join(CAP, `echec-${cle}.png`) }).catch(() => {}); }
  const erreurs = journal.erreurs.length;
  if (erreurs) notes.push(`${cle} : ${erreurs} erreur(s) de page : ${journal.erreurs.slice(0, 2).join(' | ').slice(0, 300)}`);
  await browser.close();
}

// Côte à côte : la maquette (m5ap-a.png) à gauche, l'app à droite, pour l'état ouvert puis l'état joint.
const { browser, page } = await L.ouvrir({ largeur: 1700, hauteur: 1700, mobile: false, echelle: 1, externe: 'laisser' });
const url = (f) => pathToFileURL(f).href;
for (const theme of themes) for (const largeur of largeurs) {
  const cle = `${theme}-${largeur}`;
  for (const etat of ['ouvert', 'joint']) {
    const f = path.join(CAP, `${etat}-${cle}.png`);
    if (!fs.existsSync(f)) continue;
    const html = `<body style="margin:0;background:#888;display:flex;gap:16px;align-items:flex-start;padding:12px;font:14px sans-serif;color:#fff">
      <figure style="margin:0"><figcaption>maquette m5ap-a (clair, 390)</figcaption><img src="${url(MAQUETTE)}" style="height:1500px"></figure>
      <figure style="margin:0"><figcaption>app — ${etat} — ${theme} — ${largeur}</figcaption><img src="${url(f)}" style="height:${largeur < 700 ? 1500 : 900}px"></figure></body>`;
    const tmp = path.join(CAP, '_cote.html'); fs.writeFileSync(tmp, html);
    await page.goto(url(tmp)); await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(CAP, `cote-${etat}-${cle}.png`), fullPage: true });
    fs.unlinkSync(tmp);
  }
}
await browser.close();
console.log(notes.join('\n'));
console.log(notes.some((n) => /ECHEC/.test(n)) ? 'CAPTURES ECHEC' : 'CAPTURES OK');
