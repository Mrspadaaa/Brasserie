// V3 (Chasse Carnet, 21.11) : Comparer, correctifs seulement. Un contrôle par id, rouge sur `--ref en-ligne/2026-11-21-tour8`, vert sur l'arbre.
//   CRB-2 la rangée prix existe toujours (« prix ? », jamais 0) · CRB-5 aucune pastille de rang sans critère · CRB-13 dispo, vendeur, pays ·
//   CRB-14 l'ordre des lignes · CRU-6 aucune valeur texte en mono · CRB-3 (part sans carte) les valeurs se voient à 390 ·
//   CRU-5 le fil ne redit pas le titre · CRU-11 l'échelle 18 / 14 / 12 · CRU-13 l'ombre de bord seulement s'il reste une suite.
// La mise en cartes (D1) n'est pas ici : elle attend le choix du brasseur.
// Données : « ZZ TEST — Chambre froide » (2 articles sans prix, 10 valeurs en texte) et « Ventilation » (prix, 5 articles) de la fixture du banc.
import { TITRE_CHAMBRE, ouvrirChambre, ouvrirComparer, lireComparer } from './_chambre.mjs';

/** Ce que l'écran de Comparer montre, mesuré (jamais lu dans le code). */
const mesurer = (c) => c.p.evaluate((titre) => {
  const n = (x) => String(x ?? '').replace(/\s+/g, ' ').trim();
  const page = document.querySelector('.cn-comparer');
  const zone = document.querySelector('.cn-tableau-zone');
  const cadre = document.querySelector('.cn-tableau-cadre');
  const tete = [...document.querySelectorAll('.cn-comparer thead th')];
  const cellules = [...document.querySelectorAll('.cn-comparer tbody tr')].flatMap((tr) => [...tr.querySelectorAll('td')].map((td) => {
    const f = td.querySelector('span') ?? td; const r = td.getBoundingClientRect(); const cs = getComputedStyle(f);
    return { ligne: n(tr.querySelector('th')?.innerText), texte: n(td.innerText), mono: /mono|plex/i.test(cs.fontFamily), alignement: getComputedStyle(td).textAlign, gauche: Math.round(r.left), droite: Math.round(r.right), largeur: Math.round(r.width) };
  }));
  const tailles = new Set();
  if (page) {
    const w = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
    for (let t = w.nextNode(); t; t = w.nextNode()) {
      if (!n(t.textContent)) continue;
      const e = t.parentElement; const r = e.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) continue;
      const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || e.closest('.cn-cache')) continue;
      tailles.add(parseFloat(cs.fontSize));
    }
  }
  const ombre = cadre ? getComputedStyle(cadre, '::after').content : 'none';
  return {
    largeurEcran: innerWidth,
    retour: n(document.querySelector('.cn-comparer .cn-retour')?.innerText),
    titreVu: [...document.querySelectorAll('.cn-comparer *')].filter((e) => e.children.length === 0 && n(e.innerText) === titre && e.getBoundingClientRect().width > 0).length,
    rangs: tete.flatMap((th) => [...th.querySelectorAll('b')].map((b) => n(b.innerText))).filter((x) => /^\d+(re|e)$/.test(x)),
    libelles: [...document.querySelectorAll('.cn-comparer tbody th')].map((th) => n(th.innerText)),
    cellules, tailles: [...tailles].sort((a, b) => a - b),
    zone: zone ? { client: zone.clientWidth, defile: zone.scrollWidth, gauche: Math.round(zone.getBoundingClientRect().left), droite: Math.round(zone.getBoundingClientRect().right) } : null,
    ombre: ombre !== 'none' && ombre !== 'normal', suite: !!cadre?.hasAttribute('data-suite')
  };
}, TITRE_CHAMBRE);

const sans = (s) => String(s).replace(/\s+(CHF|EUR)\s*$/i, '').toLowerCase();
const place = (libelles, re) => libelles.findIndex((l) => re.test(sans(l)));

/** Les contrôles par id sur le Comparer de la Chambre froide, à la largeur courante (`l` = « 390 » ou « 1280 »). */
async function controlesChambre(c, l) {
  await ouvrirChambre(c); await ouvrirComparer(c); await c.sleep(500); await c.cap(`v3-chambre-comparer`);
  const m = await mesurer(c);
  const ligne = (re) => m.cellules.filter((x) => re.test(sans(x.ligne)));
  // Un contrôle par id : chacun se joue même si un autre échoue (rouge id par id sur tour8) ; les échecs se rendent ensemble.
  const echecs = [];
  const essai = (fn) => { try { fn(); } catch (e) { echecs.push(String(e.message)); } };
  // CRB-2 : la 1re ligne est le prix, et chaque cellule dit « prix ? » (rien n'est connu)
  essai(() => {
  if (!/^prix/i.test(m.libelles[0] ?? '')) throw new Error(`CRB-2 : la 1re ligne est « ${m.libelles[0] ?? 'aucune'} », pas le prix (lignes : ${m.libelles.join(' | ')})`);
  const prix = ligne(/^prix/);
  if (!prix.length || prix.some((x) => !/prix\s*\?|^\s*\?\s*$/i.test(x.texte))) throw new Error(`CRB-2 : la rangée prix devrait dire « prix ? » : ${JSON.stringify(prix.map((x) => x.texte))}`);
  if (prix.some((x) => /^0(\D|$)/.test(x.texte))) throw new Error('CRB-2 : un prix inconnu est lu 0');
  c.ok(`CRB-2 rangée prix (${l})`, `ligne 1 « ${m.libelles[0]} », cellules ${JSON.stringify(prix.map((x) => x.texte))}`);
  });
  // CRB-5 : aucune pastille de rang (« 1re », « 2e ») dans les en-têtes tant qu'aucun critère ni prix ne classe
  essai(() => {
  if (m.rangs.length) throw new Error(`CRB-5 : ${m.rangs.length} pastille(s) de rang sans critère : ${m.rangs.join(', ')}`);
  c.ok(`CRB-5 aucune pastille de rang sans critère (${l})`, 'aucune « 1re / 2e » dans l\'en-tête');
  });
  // CRB-13 : dispo, vendeur, pays en lignes
  essai(() => {
  const manque = ['dispo', 'vendeur', 'pays'].filter((x) => place(m.libelles, new RegExp(`^${x}`)) < 0);
  if (manque.length) throw new Error(`CRB-13 : lignes absentes : ${manque.join(', ')} (lignes : ${m.libelles.join(' | ')})`);
  c.ok(`CRB-13 dispo, vendeur, pays (${l})`, 'trois lignes présentes');
  });
  // CRB-14 : prix, volume, dimensions, porte, livraison, puis le groupe ; couleur en bas
  essai(() => {
  const ordre = [['prix', /^prix/], ['volume', /^volume/], ['dimensions', /^dimensions du produit/], ['dimensions int.', /^dimensions int/], ['porte', /porte/], ['livraison', /^dispo/], ['groupe', /^(exécution|performance|épaisseur)/], ['couleur', /^couleur/]];
  const rangs = ordre.map(([nom, re]) => [nom, place(m.libelles, re)]);
  const mal = rangs.filter(([, i]) => i < 0).map(([nom]) => nom);
  if (mal.length) throw new Error(`CRB-14 : lignes introuvables : ${mal.join(', ')} (${m.libelles.join(' | ')})`);
  const desordre = rangs.slice(1).filter(([, i], k) => i < rangs[k][1]);
  if (desordre.length || rangs.at(-1)[1] !== m.libelles.length - 1) throw new Error(`CRB-14 : ordre ${rangs.map(([n, i]) => `${n}@${i}`).join(' ')} ; lignes : ${m.libelles.join(' | ')}`);
  c.ok(`CRB-14 ordre des lignes (${l})`, m.libelles.map((x) => x.slice(0, 14)).join(' > '));
  });
  // CRU-6 : un mot en police du texte à gauche, une mesure en mono
  essai(() => {
  const mots = ['blanc RAL 9010', 'A+', 'groupe frigorifique inclus', 'en stock', 'Froid Exemple', 'CH'];
  const fautes = m.cellules.filter((x) => mots.includes(x.texte) && (x.mono || x.alignement !== 'left'));
  const mesures = m.cellules.filter((x) => /^(4,06 m³|2,6 m³|80 mm|800 mm|1900 mm)$/.test(x.texte) && !x.mono);
  if (fautes.length) throw new Error(`CRU-6 : ${fautes.length} valeur(s) texte en mono ou à droite : ${fautes.slice(0, 4).map((x) => `« ${x.texte} » (${x.mono ? 'mono' : 'texte'}, ${x.alignement})`).join(' ; ')}`);
  if (mesures.length) throw new Error(`CRU-6 : une mesure n'est plus en mono : ${mesures.map((x) => x.texte).join(', ')}`);
  c.ok(`CRU-6 aucune valeur texte en mono (${l})`, `${m.cellules.filter((x) => mots.includes(x.texte)).length} valeurs texte en police du texte, à gauche ; les mesures en mono`);
  });
  // CRB-3 (la part sans carte) : toutes les valeurs se voient dans l'écran, les deux articles à la fois, sans défiler à droite
  essai(() => {
  const hors = m.cellules.filter((x) => x.droite > m.largeurEcran + 1 || x.gauche < 0 || x.largeur < 40);
  if (hors.length || m.zone.defile > m.zone.client + 2) throw new Error(`CRB-3 : ${hors.length} valeur(s) hors écran ou trop étroites ; tableau ${m.zone.defile} px dans ${m.zone.client} px : ${hors.slice(0, 3).map((x) => `« ${x.texte.slice(0, 24)} » ${x.gauche}–${x.droite}`).join(' ; ')}`);
  c.ok(`CRB-3 valeurs visibles (${l})`, `tableau ${m.zone.defile} px dans ${m.zone.client} px, ${m.cellules.length} valeurs dans l'écran de ${m.largeurEcran} px`);
  });
  // CRU-5 (A1, D419) : le nom du carnet se dit une fois, dans le fil ; le titre dessous dit l'écran (« Comparer »)
  essai(() => {
  if (m.titreVu !== 0 || !m.retour.includes(TITRE_CHAMBRE)) throw new Error(`CRU-5 : le nom « ${TITRE_CHAMBRE} » doit être dit une fois, dans le fil (redit dessous ${m.titreVu} fois, fil « ${m.retour} »)`);
  c.ok(`CRU-5 le titre n'est dit qu'une fois (${l})`, `fil « ${m.retour} », titre « Comparer »`);
  });
  // CRU-11 : l'échelle de DESIGN, titre 18, corps 14, libellés 12 (rien d'autre)
  essai(() => {
  const permis = new Set([18, 14, 12]);
  const autres = m.tailles.filter((t) => !permis.has(t));
  if (autres.length) throw new Error(`CRU-11 : tailles hors échelle (18 / 14 / 12) : ${autres.join(', ')} ; vues : ${m.tailles.join(', ')}`);
  c.ok(`CRU-11 échelle des tailles (${l})`, `tailles vues : ${m.tailles.join(', ')}`);
  });
  if (echecs.length) throw new Error(`${echecs.length} contrôle(s) KO : ${echecs.join(' || ')}`);
  return m;
}

/** CRU-13 : sur un carnet dont le tableau déborde, l'ombre se voit tant qu'il reste une suite, et plus après le défilement complet. */
async function controleOmbre(c, l) {
  await c.demarrer(); await c.versAtelier(); await c.attendreListe();
  await c.ouvrirCarnetDeListe('ZZ TEST — Ventilation'); await ouvrirComparer(c); await c.sleep(500);
  const avant = await mesurer(c);
  await c.cap('v3-ventilation-comparer');
  if (!avant.zone || avant.zone.defile <= avant.zone.client + 2) { c.ok(`CRU-13 ombre (${l})`, `rien à défiler (${avant.zone?.defile} px dans ${avant.zone?.client} px) : aucune ombre attendue, ombre ${avant.ombre ? 'PRÉSENTE' : 'absente'}`); if (avant.ombre) throw new Error('CRU-13 : une ombre alors qu\'il n\'y a pas de suite'); return; }
  if (!avant.ombre) throw new Error(`CRU-13 : tableau ${avant.zone.defile} px dans ${avant.zone.client} px, mais aucune ombre de suite au repos`);
  await c.p.evaluate(() => { const z = document.querySelector('.cn-tableau-zone'); z.scrollLeft = z.scrollWidth; });
  await c.sleep(500); await c.cap('v3-ventilation-comparer-fin');
  const apres = await mesurer(c);
  if (apres.ombre || apres.suite) throw new Error(`CRU-13 : après le défilement complet l'ombre reste (ombre ${apres.ombre}, suite ${apres.suite})`);
  c.ok(`CRU-13 ombre seulement s'il reste une suite (${l})`, `au repos : ombre ; au bout de ${avant.zone.defile} px : plus d'ombre`);
}

export default async function (c) {
  await c.etape('V3-390 Comparer de la Chambre froide : CRB-2, CRB-3, CRB-5, CRB-13, CRB-14, CRU-5, CRU-6, CRU-11', async () => { await controlesChambre(c, '390'); });
  await c.etape('V3-390 CRU-13 ombre de défilement (Ventilation)', async () => { await controleOmbre(c, '390'); });
  await c.etape('V3-390 cave : Comparer de la Chambre froide', async () => {
    await c.demarrer(); await c.toucher('Plus : saisie'); await c.toucher('Cave', { exact: true }); await c.sleep(500);
    await c.versAtelier(); await c.attendreListe(); await c.ouvrirCarnetDeListe(TITRE_CHAMBRE); await ouvrirComparer(c); await c.sleep(500);
    await c.cap('v3-chambre-comparer-cave'); const t = await lireComparer(c);
    c.ok('V3 cave 390', `${t.lignes.length} lignes, tableau ${t.largeur}×${t.hauteur}`);
  });
  await c.ouvrirPage(1280, 800, false);
  await c.etape('V3-1280 Comparer de la Chambre froide : les mêmes contrôles', async () => { await controlesChambre(c, '1280'); });
  await c.etape('V3-1280 CRU-13 (Ventilation)', async () => { await controleOmbre(c, '1280'); });
  await c.ouvrirPage(390, 844, true);
}
