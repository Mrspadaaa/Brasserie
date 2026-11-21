// Les chaînes jouées au doigt, 390 tactile. node chaines.mjs <throttle>
import fs from 'node:fs'; import path from 'node:path';
import { ouvrir, sleep, SP } from './banc.mjs';
const TH = Number(process.argv[2] ?? 1);
const b = await ouvrir({ throttle: TH }); const { p } = b;
const res = {}; const pre = `t${TH}-`;
const D = { dans: '[role=dialog] button,[role=dialog] [role=button],[role=dialog] input,[role=dialog] textarea' };
const labels = (re) => p.evaluate((s) => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((l) => new RegExp(s).test(l)), re);
const entete = () => p.evaluate(() => (document.querySelector('[data-calendrier-entete]')?.innerText ?? '').replace(/\s+/g, ' ').slice(0, 220));
const toast = () => p.evaluate(() => [...document.querySelectorAll('[role=status],[role=alert],[aria-live]')].map((e) => e.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean).join(' / ').slice(0, 300));
async function chaine(nom, f) {
  const t = Date.now(); b.raz(); const notes = [`période au départ : ${(await b.boutons()).find((x) => /^Période :/.test(x))?.slice(0, 40)}`];
  try { await f(notes); } catch (e) { notes.push('ERREUR ' + e.message.slice(0, 200)); await b.cap(`${pre}${nom}-erreur`).catch(() => {}); }
  res[nom] = { gestes: b.gestes, murMs: Date.now() - t, journal: b.journal.map((j) => `${j.geste} ${j.ms}ms lt${j.lt}/${j.ltMax}${j.cible ? ' ' + j.cible : ''}`), notes };
  console.log(`\n### ${nom} — ${b.gestes} gestes\n  ${res[nom].journal.join('\n  ')}\n  NOTES: ${notes.join('\n         ')}`);
  await b.recharger();
}
const t0 = Date.now(); await p.goto(b.url, { waitUntil: 'load' }); await b.versCalendrier(); res.demarrage = Date.now() - t0;
console.log('démarrage → Calendrier ms', res.demarrage);
// mesure de l'ouverture de l'onglet Calendrier depuis Bord
b.raz(); await b.versOnglet('Bord'); await b.toucher('Calendrier', { dans: 'nav button' }); console.log('Bord→Calendrier', b.journal.at(-1)); await b.recharger();

await chaine('C1-planifier-brassin', async (n) => {
  const avant = (await labels('^Fruty,')).length;
  await b.toucher('Actions rapides'); await b.toucher('Poser un brassin', { prefixe: true });
  await b.toucher('Fruty', D); await b.toucher('S50, 7 déc.', { prefixe: true, ...D }); await b.cap(`${pre}C1-feuille`);
  await b.toucher('Ajouter en', { prefixe: true }); await b.cap(`${pre}C1-apres`);
  n.push(`Fruty à l'écran : ${avant} → ${(await labels('^Fruty,')).length} ; toast « ${await toast()} »`);
  n.push(`labels Fruty : ${(await labels('^Fruty,')).join(' | ').slice(0, 300)}`);
  await b.versOnglet('Brassins'); const tb = await b.texte(); n.push(`Brassins : ${/À brasser \d+/.exec(tb)?.[0]} ; Tous ${/Tous \d+/.exec(tb)?.[0]}`);
  await b.versOnglet('Finances'); const tf = await b.texte(); n.push(`Finances mentionne Fruty : ${/Fruty/.test(tf)}`);
});

await chaine('C2-deplacer-passe-futur', async (n) => {
  const col = await p.evaluate(() => { const b = [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')]; return b.length > 1 ? b[1].getBoundingClientRect().x - b[0].getBoundingClientRect().x : 61; });
  const avant = (await labels('^Blonde d’automne,'))[0]; let c = await b.trouver('Blonde d’automne,', { prefixe: true });
  await b.glisser([c.x - Math.min(c.w / 2 - 6, 10), c.y], [c.x - Math.min(c.w / 2 - 6, 10) - 2 * col, c.y], { nom: 'glisser −2 sem.' });
  const passe = (await labels('^Blonde d’automne,'))[0]; n.push(`passé : « ${avant?.slice(0, 60)} » → « ${passe?.slice(0, 80)} » ; toast « ${await toast()} »`); await b.cap(`${pre}C2-passe`);
  c = await b.trouver('Blonde d’automne,', { prefixe: true });
  await b.glisser([c.x - Math.min(c.w / 2 - 6, 10), c.y], [c.x - Math.min(c.w / 2 - 6, 10) + 4 * col, c.y], { nom: 'glisser +4 sem.' });
  const futur = (await labels('^Blonde d’automne,'))[0]; n.push(`futur : « ${futur?.slice(0, 80)} » ; toast « ${await toast()} »`); await b.cap(`${pre}C2-futur`);
  // un achat (icône 28 px) d'une semaine
  const a0 = (await labels('^Commande de malt,'))[0]; c = await b.trouver('Commande de malt,', { prefixe: true });
  await b.glisser([c.x, c.y], [c.x + col, c.y], { nom: 'glisser achat +1 sem.' });
  const a1 = (await labels('^Commande de malt,'))[0]; n.push(`achat : « ${a0} » → « ${a1} » ; en-tête « ${(await entete()).slice(0, 90)} »`); await b.cap(`${pre}C2-achat`);
  await b.versOnglet('Finances'); const tf = await b.texte(); n.push(`Finances : ${(/Commande de malt[^A-Z]{0,60}/.exec(tf) ?? ['absent'])[0]}`);
});

await chaine('C3-dater-projet-carnet', async (n) => {
  await b.versOnglet('Brassins'); await b.toucher('Atelier', { prefixe: true }); await b.toucher('Carnet', { dans: 'button' });
  await b.toucher('Sol — matières', { prefixe: true });
  const pill = await b.trouver('Idée ·', { prefixe: true, dans: 'button,[role=button],span,div' });
  n.push(`pastille de date : ${pill ? `${pill.w}×${pill.h}` : 'absente'}`);
  if (await b.peutToucher('Idée ·', { prefixe: true })) { await b.cap(`${pre}C3-pastille`); n.push(`après pastille : ${(await b.dialogue()) ?? 'rien'}`); n.push('boutons : ' + (await b.boutons('[role=dialog]').catch(() => [])).slice(0, 20).join(' | ')); await b.fermer(); }
  else n.push('la pastille « Idée · 21 nov. » ne se touche pas');
  if (await b.peutToucher('Plus', { dans: 'button' })) { await b.cap(`${pre}C3-plus`); n.push(`menu ⋯ : ${(await b.dialogue()) ?? (await b.boutons()).filter((x) => /alend|date|Dater|budget|prix/i.test(x)).join(' | ')}`); await b.p.keyboard.press('Escape'); }
  const tout = await b.texte(); n.push(`mots « calendrier/dater/prix » dans le projet : ${(tout.match(/(Calendrier|calendrier|Dater|dater|Prix|prix|estim)[^ ]*/g) ?? []).join(', ')}`);
  await b.toucher('Calendrier', { dans: 'nav button' });
  n.push(`au Calendrier, « Sol — » : ${(await labels('^Sol')).join(' | ').slice(0, 200) || 'absent'}`);
});

await chaine('C3b-idee-depuis-calendrier', async (n) => {
  await b.toucher('Actions rapides'); await b.toucher('Noter une idée', { prefixe: true });
  const sel = await p.evaluate(() => { const e = [...document.querySelectorAll('[role=dialog] button')].find((x) => /^S47/.test(x.innerText.trim())); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), visible: r.x >= 0 && r.right <= innerWidth, pressed: e.getAttribute('aria-pressed') }; });
  n.push(`puce de la semaine choisie (S47) : ${JSON.stringify(sel)}`);
  await b.toucher('textarea', { dans: '[role=dialog] textarea', prefixe: true }).catch(async () => { const c = await b.trouver('', { dans: '[role=dialog] textarea', prefixe: true }); await b.taperXY(c.x, c.y, 'champ'); });
  await b.ecrire('Bière de Noël épicée');
  await b.cap(`${pre}C3b-feuille`);
  await b.toucher('Noter', D); await b.cap(`${pre}C3b-apres`);
  n.push(`toast « ${await toast()} » ; au Calendrier « Bière de Noël » : ${(await labels('Bière de Noël')).join(' | ').slice(0, 150) || 'absent'}`);
  await b.versOnglet('Brassins'); await b.toucher('Atelier', { prefixe: true }); await b.toucher('Carnet', { dans: 'button' });
  n.push(`au Carnet : ${/Bière de Noël[^]{0,60}/.exec(await b.texte())?.[0] ?? 'absent'}`); await b.cap(`${pre}C3b-carnet`);
});

await chaine('C4-solde-semaine', async (n) => {
  n.push(`en-tête au repos : « ${await entete()} »`);
  const courbe = await p.evaluate(() => { const e = document.querySelector('[aria-label^="La courbe libre"],[aria-label^="Libre et caisse"],[aria-label^="La courbe zoomée"]'); const r = e?.getBoundingClientRect(); return r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null; });
  if (courbe) { await b.taperXY(courbe.x + courbe.w * 0.8, courbe.y + courbe.h / 2, 'courbe (S48–49)'); await b.cap(`${pre}C4-toucher-courbe`); n.push(`après toucher courbe : « ${await entete()} »`);
    await b.glisser([courbe.x + courbe.w * 0.3, courbe.y + courbe.h / 2], [courbe.x + courbe.w * 0.85, courbe.y + courbe.h / 2], { nom: 'glisser sur la courbe' }); await b.cap(`${pre}C4-glisser-courbe`); n.push(`après glisser : « ${await entete()} »`); }
  await b.toucher('S49, 30', { prefixe: true }); await b.cap(`${pre}C4-semaine`); n.push(`après toucher S49 : « ${await entete()} » ; dialogue « ${await b.dialogue()} »`); await b.toucher('S49 30', { prefixe: true, contient: true }).catch(()=>{}); await b.toucher('±'); await b.cap(`${pre}C4-plusmoins`); n.push(`après ± : « ${await entete()} »`);
  n.push('semaines : ' + (await labels('^S4[89],|^S50,')).slice(0, 4).join(' | '));
});

await chaine('C5-ajouter-depense', async (n) => {
  const e0 = await entete();
  await b.toucher('Ajouter dans Achats'); { const c = await p.evaluate(() => { const l = [...document.querySelectorAll('[role=dialog] label')].find((x) => /Autre nom|^Nom/.test(x.innerText)); const i = l?.querySelector('input'); if (!i) return null; i.scrollIntoView({ block: 'center' }); const r = i.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }); if (!c) throw new Error('champ Autre nom introuvable'); await b.taperXY(c.x, c.y, 'champ Autre nom'); } await b.ecrire('Joints de fût');
  await b.toucher('Montant en CHF', D); await b.ecrire('85');
  await b.toucher('S49, 30 nov.', { prefixe: true, ...D }); await b.cap(`${pre}C5-feuille`);
  await b.toucher('Ajouter en', { prefixe: true }); await b.cap(`${pre}C5-apres`);
  n.push(`en-tête : « ${e0.slice(0, 60)} » → « ${(await entete()).slice(0, 60)} » ; toast « ${await toast()} »`);
  n.push(`au Calendrier : ${(await labels('^Joints')).join(' | ') || 'absent'}`);
  await b.versOnglet('Finances'); const tf = await b.texte(); n.push(`Finances : ${/Joints[^]{0,50}/.exec(tf)?.[0] ?? 'absent (vue Synthèse)'}`);
  if (await b.peutToucher('Prévisions')) n.push(`Finances › Prévisions : ${/Joints[^]{0,50}/.exec(await b.texte())?.[0] ?? 'absent'}`);
  await b.cap(`${pre}C5-finances`);
});

await chaine('C6-recette-noel-date', async (n) => {
  await b.toucher('Actions rapides'); await b.toucher('Recette', { dans: 'button' }); await sleep(600); await b.cap(`${pre}C6-recette`);
  const t = await b.texte(); n.push(`premier écran : ${t.slice(0, 300)}`);
  n.push(`mots de date au premier écran : ${(t.match(/(date|Date|quand|Quand|mois|Noël|prévu)[^ ]*/g) ?? []).join(', ') || 'aucun'}`);
  n.push('champs : ' + (await p.evaluate(() => [...document.querySelectorAll('input,select,textarea')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => `${e.type}:${e.getAttribute('aria-label') ?? e.placeholder ?? e.name}`).join(' | '))));
});
await chaine('C6b-recette-vers-date', async (n) => {
  await b.versOnglet('Brassins'); await b.toucher('Recettes', { prefixe: true }); await sleep(500);
  const cartes = await b.boutons(); n.push('recettes : ' + cartes.filter((x) => /Fruty|Ttt|Hefe|Blonde/.test(x)).slice(0, 4).join(' | '));
  await b.toucher('Fruty', { prefixe: true, contient: true }).catch((e) => n.push(e.message)); await sleep(500); await b.cap(`${pre}C6b-fiche`);
  const bs = (await b.boutons()).filter((x) => /Brasser|Planifier|date|alendrier/i.test(x)); n.push('actions de date : ' + bs.join(' | '));
  if (bs.length) { const m = /@(\d+),(\d+)\]/.exec(bs.filter((x) => /^Brasser/.test(x)).at(-1)); const w = /\[(\d+)×(\d+)/.exec(bs.filter((x) => /^Brasser/.test(x)).at(-1)); await b.taperXY(+m[1] + w[1] / 2, +m[2] + w[2] / 2, 'Brasser (fiche)'); await b.cap(`${pre}C6b-brasser`); n.push(`feuille : ${(await b.dialogue())?.slice(0, 300)}`); n.push('champs : ' + (await p.evaluate(() => [...document.querySelectorAll('[role=dialog] input')].map((e) => e.type).join(',')))); }
});

await chaine('C7-cacher-montrer', async (n) => {
  const y0 = (await b.trouver('Masquer Achats'))?.top;
  await b.toucher('Masquer Fêtes'); const y1 = (await b.trouver('Masquer Achats'))?.top; await b.cap(`${pre}C7-cachee`);
  await b.toucher('Afficher Fêtes', { prefixe: true }); const y2 = (await b.trouver('Masquer Achats'))?.top;
  n.push(`rangée Achats y : ${y0} → ${y1} (Fêtes cachée) → ${y2} (montrée)`);
  await b.toucher('Masquer Brassins'); await b.cap(`${pre}C7-brassins-caches`); await b.recharger();
  n.push(`après rechargement, Brassins : ${(await b.trouver('Afficher Brassins', { prefixe: true })) ? 'toujours cachée' : 'remontrée'}`);
  if (await b.trouver('Afficher Brassins', { prefixe: true })) await b.toucher('Afficher Brassins', { prefixe: true });
});

await chaine('C8-retrouver', async (n) => {
  await b.toucher('Rechercher (⌘K)'); await b.ecrire('Hotte'); await b.cap(`${pre}C8-recherche`);
  const r = await b.boutons(); n.push('résultats : ' + r.filter((x) => /Hotte/.test(x)).join(' | '));
  n.push('liste de la recherche : ' + (await b.boutons()).filter((x) => !/^(Sd|Ajouter|Masquer|Bord|Finances|Brassins|Stocks|Clients)/.test(x)).slice(0, 14).join(' | ')); const hit = r.find((x) => /Hotte/.test(x) && !/^Hotte, /.test(x));
  if (hit) { await b.toucher(hit.split(' [')[0]); await b.cap(`${pre}C8-resultat`); n.push(`après choix : écran ${await p.evaluate(() => !!document.querySelector('[data-calendrier]'))} ; dialogue « ${(await b.dialogue())?.slice(0, 160)} »`); }
  else n.push('la recherche ne trouve pas la Hotte (travaux du calendrier)');
  await b.recharger(); b.journal.push({ geste: '--- voie 2 : Liste', ms: 0, lt: 0, ltMax: 0 });
  { const c = await p.evaluate(() => { const e = document.querySelector('[aria-label$="période, liste, tri et filtre"]'); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }); await b.taperXY(c.x, c.y, 'menu de période'); } await b.toucher('Liste'); await b.cap(`${pre}C8-liste`);
  const tl = await b.texte(); n.push(`Liste contient Hotte : ${/Hotte/.test(tl)} ; début : ${tl.slice(100, 400)}`);
});

console.log('\nERREURS PAGE', b.erreurs.slice(0, 8));
fs.writeFileSync(path.join(SP, `res-t${TH}.json`), JSON.stringify(res, null, 1));
await b.fin();
