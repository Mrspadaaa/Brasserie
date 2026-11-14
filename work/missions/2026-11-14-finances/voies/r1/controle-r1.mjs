// controle-r1.mjs <port> : voie r1, correctifs du test d'écran (Synthèse et Annuel). Une ligne par point, puis R1 OK ou R1 ECHEC.
// Bancs : ?dev-local&finance-demo=reel (états de la vraie app) et ?dev-local&finance-demo (brasserie complète, stock au 31 déc. inconnu). 390 tactile, clair.
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
const PORT = process.argv[2] ?? '3000';
const norm = (s) => (s ?? '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
const lignes = [], echecs = [];
const point = (n, ok, texte) => { lignes.push(`${ok ? 'ok  ' : 'KO  '} P${n} ${texte}`); if (!ok) echecs.push(n); };

const { browser, page } = await ouvrir({ largeur: 390, hauteur: 1000, mobile: true, echelle: 1 });
/** Clique le premier élément visible dont le texte (espaces normalisés) passe le filtre. */
const clic = (sel, filtre, dans = 'document') => page.evaluate((sel, filtre, dans) => {
  const racine = dans === 'document' ? document : document.querySelector(dans);
  const e = [...(racine?.querySelectorAll(sel) ?? [])].filter(b => b.offsetParent && new RegExp(filtre).test(b.textContent.replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim()));
  if (!e.length) return false; e[0].click(); return true;
}, sel, filtre, dans);
const demarrer = async (banc) => {
  await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo${banc === 'reel' ? '=reel' : ''}`); await calme(page, 1200);
  await page.evaluate(() => localStorage.setItem('laffinee.theme', 'clair')); await page.reload(); await calme(page, 1500);
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find(e => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1000);
};
const onglet = async (nom) => { await page.evaluate((nom) => [...document.querySelectorAll('[role=tab],button')].find(e => e.offsetParent && e.textContent.trim().startsWith(nom))?.click(), nom); await calme(page, 900); };
const nombres = (t) => [...norm(t).matchAll(/(\d[\d ]*),(\d\d)/g)].map(m => Number(m[1].replace(/ /g, '') + m[2]));

try {
  /* ---------- Synthèse, banc reel, novembre ---------- */
  await demarrer('reel'); await onglet('Synthèse');
  const leg = await page.evaluate(() => {
    const fond = (e) => getComputedStyle(e).backgroundColor;
    const col = [...document.querySelectorAll('.syn-col')].find(c => c.querySelector('.syn-hc')?.textContent.startsWith('Dépensé'));
    const payes = [...(col?.querySelectorAll('.syn-pile .syn-s:not(.syn-ap)') ?? [])].map(fond);
    const item = [...document.querySelectorAll('.syn-leg > span')].find(s => /^\s*payé/.test(s.textContent));
    const pastille = [...(item?.querySelectorAll('i') ?? [])].map(fond);
    return { payes: [...new Set(payes)].sort(), pastille: [...new Set(pastille)].sort() };
  });
  point(9, leg.payes.length > 0 && JSON.stringify(leg.payes) === JSON.stringify(leg.pastille), `légende « payé » = les couleurs des charges payées dessinées (segments ${leg.payes.join(' / ')} ; pastille ${leg.pastille.join(' / ') || 'aucune'})`);

  const okMat = await clic('.syn-pile-mat', '');
  await calme(page, 1200);
  const ops = await page.evaluate(() => document.body.innerText);
  point(1, okMat && /Local et travaux/.test(ops) && !/Aucune opération/.test(ops), `« Matériel à part » ouvre Opérations sur la pièce (touché : ${okMat} ; « Local et travaux » : ${/Local et travaux/.test(ops)} ; « Aucune opération » : ${/Aucune opération/.test(ops)})`);

  // P12 : la fiche de la vente dit « 10 pièces ». Opérations, novembre : la vente est la ligne « Bière ».
  await demarrer('reel'); await onglet('Opérations');
  const okVente = await page.evaluate(() => { const t = [...document.querySelectorAll('main *, [role=tabpanel] *, body *')].filter(e => e.offsetParent && e.children.length === 0 && /Bière · 75 cl/.test(e.textContent)); if (!t.length) return false; t[0].click(); return true; });
  await calme(page, 1000);
  const fiche = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  point(12, okVente && /10 pièces/.test(fiche) && !/10 pièce(?!s)/.test(fiche), `fiche de la vente : « 10 pièces » (ligne touchée : ${okVente} ; texte : ${(fiche.match(/10 pièces?/) ?? ['absent'])[0]})`);

  /* ---------- Synthèse d'un mois sans rien (P10) ---------- */
  await demarrer('reel'); await onglet('Synthèse');
  await clic('.syn-seg button', '^sept\\.');
  await calme(page, 900);
  const vide = await page.evaluate(() => {
    const r = (e) => e.getBoundingClientRect();
    const cols = [...document.querySelectorAll('.syn-col')];
    const entre = cols.find(c => c.querySelector('.syn-hc')?.textContent.startsWith('Entré'));
    const boite = entre ? [...entre.children].find(e => getComputedStyle(e).borderTopStyle === 'dashed') : null;
    const texte = [...document.querySelectorAll('.syn-scene *')].find(e => e.children.length === 0 && /Aucune écriture/.test(e.textContent));
    const dedans = !!boite && !!texte && r(texte).left >= r(boite).left - 1 && r(texte).right <= r(boite).right + 1 && r(texte).top >= r(boite).top - 1 && r(texte).bottom <= r(boite).bottom + 1;
    return { entete: entre?.querySelector('.syn-hc')?.textContent ?? '', boite: !!boite, hauteur: boite ? Math.round(r(boite).height) : 0, texte: !!texte, dedans };
  });
  point(10, vide.boite && vide.hauteur > 60 && /0,00/.test(vide.entete) && vide.dedans, `mois vide : colonne Entré en pointillé (${vide.hauteur} px), « 0,00 » écrit (« ${norm(vide.entete)} »), phrase dans la colonne : ${vide.dedans}`);

  /* ---------- Annuel, banc reel ---------- */
  await demarrer('reel'); await onglet('Annuel');
  const tete = await page.evaluate(() => {
    const r = (e) => e.getBoundingClientRect();
    const scene = document.querySelector('.ann-scene'); if (!scene) return null;
    const cols = [...scene.querySelectorAll('.ann-col')];
    const droite = cols[1], gauche = cols[0];
    const pile = droite.querySelector('.ann-pile');
    const ferme = [...pile.children].filter(e => !/ann-hachA/.test(e.className)).map(e => e.textContent);
    const hc = droite.querySelector('.ann-hc')?.textContent ?? '';
    const hors = [...droite.children].filter(e => e !== pile && !e.classList.contains('ann-hc')).map(e => ({ texte: e.textContent, hachure: getComputedStyle(e).backgroundImage !== 'none' }));
    const entree = gauche.querySelector('.ann-pile-entree');
    return {
      hc, ferme, hors, haut: !!entree?.textContent.includes('?') && /résultat/.test(entree?.textContent ?? ''),
      flottant: !!gauche.querySelector('.ann-trou-txt'), etiquettes: scene.querySelectorAll('.ann-stock-q').length, scene: scene.textContent,
      deltaHaut: Math.abs(r(gauche).top - r(droite).top), deltaPile: Math.abs(r(entree).top - r(pile).top)
    };
  });
  if (!tete) point(2, false, 'scène Annuel absente');
  else {
    const entete = nombres(tete.hc).pop();
    const somme = tete.ferme.flatMap(t => nombres(t)).reduce((n, x) => n + x, 0);
    // l'écart de haut (≤ 5 px) est celui de l'échelle : 5 695,00 contre 5 765,40 sur 286 px ; // chaque segment ferme dit « libellé montant » : le dernier nombre du texte est son montant ; l'usure compte aussi.
    const sommeSeg = tete.ferme.map(t => nombres(t).pop() ?? 0).reduce((n, x) => n + x, 0);
    void somme;
    const part = tete.hors.find(h => /à classer/i.test(h.texte) && nombres(h.texte).includes(550000));
    point(2, entete === sommeSeg && !!part && part.hachure, `tête = colonne ferme (en-tête ${entete} ; segments pleins ${sommeSeg}) ; « à classer 5 500,00 » écrit à part, hachuré : ${!!part && part.hachure}`);
    point(8, tete.haut && !tete.flottant && tete.etiquettes === 1 && !/perte avant stock/.test(tete.scene) && tete.deltaHaut < 5 && tete.deltaPile < 8,
      `résultat « ? » dans le haut de l’Entré : ${tete.haut} ; rien de flottant : ${!tete.flottant} ; étiquettes pointillées : ${tete.etiquettes} ; « perte avant stock » : ${/perte avant stock/.test(tete.scene)} ; décalage des colonnes ${tete.deltaHaut.toFixed(1)} / piles ${tete.deltaPile.toFixed(1)} px`);
  }
  // Mois par mois : la pièce est « à classer », pas « en charge ».
  await clic('.ann-tool', ''); await calme(page, 700);
  const mois = await page.evaluate(() => (document.querySelector('.ann-mm')?.textContent ?? '').replace(/\s+/g, ' '));
  point(2, /à classer/i.test(mois) && /5 500,00/.test(mois) && !/compte en charge/.test(mois), `Mois par mois dit « à classer 5 500,00 » et plus « compte en charge » (« ${mois.slice(mois.indexOf('Matériel') < 0 ? 0 : mois.indexOf('Matériel'), 220)} »)`);
  await page.keyboard.press('Escape'); await calme(page, 500);
  // Étape 8 : dépensé ferme, à classer à part.
  await page.evaluate(() => [...document.querySelectorAll('.ann-row')].find(b => /Impôts Fribourg/.test(b.textContent))?.click()); await calme(page, 700);
  const e8 = await page.evaluate(() => (document.querySelector('.ann-etape')?.textContent ?? '').replace(/[  ]/g, ' ').replace(/\s+/g, ' '));
  point(8, /dépensé 265,40/.test(e8) && /à classer/.test(e8) && /5 500,00/.test(e8) && !/5 765,40/.test(e8), `étape 8 : dépensé ferme 265,40, « à classer 5 500,00 » à part, plus 5 765,40 (« ${(e8.match(/ventes[^±]*±[^.]{0,80}/) ?? [''])[0].slice(0, 160)} »)`);

  // P3 : Annuel › TVA : une feuille remplie.
  await demarrer('reel'); await onglet('Annuel');
  const okTva = await clic('.ann-row', '^TVA');
  await calme(page, 900);
  const tva = await page.evaluate(() => (document.querySelector('[role=dialog]')?.textContent ?? document.body.innerText).replace(/[  ]/g, ' ').replace(/\s+/g, ' '));
  point(3, okTva && /seuil/i.test(tva) && /CHF/.test(tva) && /%/.test(tva), `TVA ouvre une feuille remplie (touchée : ${okTva} ; « ${tva.slice(0, 200)} »)`);

  // P7 : « Stock au 31 déc. ? » mène à l'étape 3 (brasserie complète : pas de pièce à classer, le stock est le seul manque).
  await demarrer('plein'); await onglet('Annuel');
  const okStock = await clic('.ann-scene button.ann-stock-q', 'Stock au 31 déc');
  await calme(page, 800);
  const n = await page.evaluate(() => document.querySelector('.ann-etape')?.getAttribute('data-etape') ?? null);
  point(7, okStock && n === '3', `« Stock au 31 déc. ? › » ouvre l’étape 3 « Inventaires » (puce touchée : ${okStock} ; étape vue : ${n})`);
} catch (e) { echecs.push('exception'); lignes.push('KO  exception : ' + (e?.stack ?? e)); }
await browser.close();
console.log(lignes.join('\n'));
console.log(echecs.length ? `R1 ECHEC (points ${[...new Set(echecs)].join(', ')})` : 'R1 OK');
process.exit(0);
