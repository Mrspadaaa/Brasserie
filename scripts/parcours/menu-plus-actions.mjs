// MENU DU + — phase ACTIONS (22.11) : chaque ligne du menu, depuis chaque écran où le + existe, ouvre SA vue et aboutit.
// Appelé par menu-plus.mjs (--phase actions). Une page neuve par ligne (fixture « ZZ TEST ») ; 390×660 tactile ; rien ne sort de localhost.
// Sortie : `actions.json` dans le dossier des captures (écran, ligne, vue attendue, vue obtenue, aboutit).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const norm = (t) => String(t ?? '').replace(/\s+/g, ' ').trim();

/** Ce que l'écran montre : l'onglet actif, la couche du dessus (feuille, page), son texte, le champ qui a le focus. */
const vue = (s) => s.p.evaluate(() => {
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const n = (t) => String(t ?? '').replace(/\s+/g, ' ').trim();
  const tab = [...document.querySelectorAll('nav button')].find((b) => b.getAttribute('aria-current') === 'page' || b.getAttribute('aria-selected') === 'true' || b.getAttribute('aria-pressed') === 'true');
  const couches = [...document.querySelectorAll('[data-feuille-rangee],[role=dialog],[data-vaul-drawer],[data-page-shell]')].filter(vis);
  const top = couches.at(-1);
  const a = document.activeElement;
  return {
    onglet: n(tab?.innerText),
    couche: top ? (top.getAttribute('data-feuille-rangee') ? `feuille:${top.getAttribute('data-feuille-rangee')}` : `${top.tagName.toLowerCase()}:${n(top.getAttribute('aria-label') || top.getAttribute('data-page-shell') || '')}`) : null,
    texte: n((top ?? document.querySelector('main') ?? document.body).innerText).slice(0, 380),
    focus: n(a?.getAttribute?.('aria-label') || a?.getAttribute?.('placeholder') || (a && a !== document.body ? a.tagName : '')),
    menuOuvert: !!document.querySelector('[role=menu][aria-label="Actions rapides"]'),
    semaine: n(document.querySelector('[data-feuille-semaine]')?.innerText).slice(0, 40)
  };
});

/** Les noms des collections du magasin dev-local où une chaîne apparaît (la donnée « ZZ TEST » a bien été écrite). */
const dansMagasin = (s, nom) => s.p.evaluate((x) => JSON.parse(localStorage.getItem('parcours-chaines:cache') || '[]').filter((e) => JSON.stringify(e.data).includes(x)).map((e) => e.name), nom);
const compteMagasin = (s, col) => s.p.evaluate((c) => JSON.parse(localStorage.getItem('parcours-chaines:cache') || '[]').filter((e) => e.name === c).length, col);

async function toucherSel(s, sel, att = 800) {
  const c = await s.p.evaluate((q) => { const e = [...document.querySelectorAll(q)].find((x) => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0; }); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, sel);
  if (!c) throw new Error(`introuvable : ${sel}`);
  await new Promise((r) => setTimeout(r, 120));
  await s.p.touchscreen.tap(c[0], c[1]);
  await new Promise((r) => setTimeout(r, att));
}

/** Les écrans : comment y aller (onglet, puis sous-onglet). */
const SOUS = { recettes: ['Brassins', 'Recettes'], atelier: ['Brassins', 'Atelier'], volumes: ['Brassins', 'Volumes'], courses: ['Stocks', 'Courses'], futs: ['Stocks', 'Fûts'], materiel: ['Stocks', 'Matériel'], impot: ['Clients', 'Impôt'], tarifs: ['Clients', 'Prix'] };
const ONGLET = { bord: 'Bord', finances: 'Finances', calendrier: 'Calendrier', brassins: 'Brassins', stock: 'Stocks', clients: 'Clients' };
async function aller(s, ecran) {
  if (ONGLET[ecran]) { await s.toucher(ONGLET[ecran], { dans: 'nav button', prefixe: true }); await new Promise((r) => setTimeout(r, 1000)); return; }
  if (ecran === 'carnets') { await aller(s, 'materiel'); await s.toucher('Carnets', { prefixe: true }); await new Promise((r) => setTimeout(r, 800)); return; }
  const [o, sub] = SOUS[ecran];
  await s.toucher(o, { dans: 'nav button', prefixe: true }); await new Promise((r) => setTimeout(r, 900));
  await s.toucher(sub, { prefixe: true, dans: 'button,[role=tab],[role=button]' });
  await new Promise((r) => setTimeout(r, 900));
}

/** Ouvre le menu du + et touche une ligne : `page` (data-page-action) ou `libelle` (début du nom accessible, dans le menu). */
async function toucherLigne(s, l) {
  await s.toucher('Actions rapides', { dans: 'button[aria-label^="Actions rapides"]', prefixe: true });
  await new Promise((r) => setTimeout(r, 600));
  if (l.page) { const hint = await s.p.evaluate((id) => document.querySelector(`[data-page-action="${id}"]`)?.innerText ?? null, l.page); await toucherSel(s, `[data-page-action="${l.page}"]`, 1200); return hint; }
  const ok = await s.p.evaluate((t) => [...document.querySelectorAll('[role=menu] [role=menuitem]')].some((e) => (e.getAttribute('aria-label') || e.innerText || '').replace(/\s+/g, ' ').trim().startsWith(t)), l.libelle);
  if (!ok) throw new Error(`la ligne « ${l.libelle} » n'est pas dans le menu`);
  await s.toucher(l.libelle, { dans: '[role=menu] [role=menuitem]', prefixe: true, att: 1400 });
  return null;
}

// ───────────── ce que chaque ligne doit ouvrir, et jusqu'où elle doit aller ─────────────
const RANGEES = { fete: 'fetes', vente: 'ventes', achat: 'achats', travaux: 'travaux', activite: 'activites', papier: 'papiers', brassin: 'brassins' };

/** « S47 · prête le … » / « en S47, dans le carnet » : la semaine du menu est celle où la feuille s'ouvre. */
const semaineDit = (t) => (/S(\d+)/.exec(t ?? '') ?? [])[1] ?? null;

async function aboutitRangee(s, rangee, nom) {
  const avant = { plans: await compteMagasin(s, 'plans'), batches: await compteMagasin(s, 'batches'), events: await compteMagasin(s, 'events') };
  if (rangee === 'brassins') { await toucherSel(s, '[data-feuille-puces] [data-puce]', 500); }
  else {
    await s.ecrire('[data-feuille-nom]', nom);
    if (['achats', 'ventes', 'travaux', 'papiers'].includes(rangee) && await s.p.$('[aria-label="Montant en CHF"]')) await s.ecrire('[aria-label="Montant en CHF"]', '120').catch(() => {});
  }
  await toucherSel(s, '[data-ajouter]', 1800);
  const refus = await s.p.evaluate(() => document.querySelector('[data-refus]')?.innerText ?? null);
  const apres = { plans: await compteMagasin(s, 'plans'), batches: await compteMagasin(s, 'batches'), events: await compteMagasin(s, 'events') };
  const cols = rangee === 'brassins' ? [] : await dansMagasin(s, nom);
  const sheetFermee = !(await s.p.evaluate(() => [...document.querySelectorAll('[data-feuille-rangee]')].some((e) => e.getBoundingClientRect().width > 0)));
  const nouveau = Object.keys(avant).filter((k) => apres[k] > avant[k]);
  const surEcran = rangee === 'brassins' ? null : await s.p.evaluate((x) => [...document.querySelectorAll('[aria-label]')].some((e) => e.getAttribute('aria-label').startsWith(x) && e.getBoundingClientRect().width > 0), nom);
  const bon = !refus && sheetFermee && (rangee === 'brassins' ? nouveau.includes('batches') : cols.length > 0);
  return { oui: bon, detail: `${refus ? `refus « ${refus} » ; ` : ''}feuille ${sheetFermee ? 'fermée' : 'encore ouverte'} ; écrit : ${rangee === 'brassins' ? (nouveau.join('+') || 'rien') : (cols.join('+') || 'rien')} ; ${surEcran === null ? '' : `visible au Calendrier : ${surEcran ? 'oui' : 'non'}`}` };
}

// ───────────── « aboutit » : le geste de bout en bout sur la fixture, la donnée « ZZ TEST plus … » écrite ─────────────
/** Les collections du magasin dev-local, avec leur nombre d'entrées. */
const comptes = (s) => s.p.evaluate(() => { const o = {}; for (const e of JSON.parse(localStorage.getItem('parcours-chaines:cache') || '[]')) o[e.name] = (o[e.name] ?? 0) + 1; return o; });
const crues = (avant, apres) => Object.keys(apres).filter((k) => apres[k] > (avant[k] ?? 0));
const refusLu = (s) => s.p.evaluate(() => [...document.querySelectorAll('[data-refus],[role=alert]')].map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim()).filter((x) => x && !/connexion Google/.test(x)).join(' / ') || null);
// (l'avis « La connexion Google ne peut pas être préparée » de Finances — DriveConnection, réseau coupé du banc — n'est pas un refus du geste)
const fermerAccuses = async (s) => { for (const f of ['OK', 'Fermer']) { if (await s.visible(f, {})) await s.toucher(f, { i: -1, att: 900 }); } };

/** Écrit dans le premier champ texte visible de la couche du dessus (la feuille ouverte). */
async function ecrirePremierChamp(s, texte, { dansFeuille = true } = {}) {
  const ok = await s.p.evaluate((feuille) => {
    document.querySelectorAll('[data-mp]').forEach((e) => e.removeAttribute('data-mp'));
    const couches = [...document.querySelectorAll('[role=dialog],[data-feuille-rangee],[data-page-shell],[data-vaul-drawer]')].filter((e) => e.getBoundingClientRect().width > 0);
    const racine = feuille && couches.length ? couches.at(-1) : document;
    const e = [...racine.querySelectorAll('input:not([type=number]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=hidden]):not([type=search]),textarea')]
      .find((x) => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !x.disabled && !x.readOnly; });
    if (!e) return false; e.setAttribute('data-mp', '1'); return true;
  }, dansFeuille);
  if (!ok) throw new Error('aucun champ texte visible dans la feuille');
  await s.ecrire('[data-mp]', texte);
}
/** Touche le premier bouton visible dont le nom commence par l'un des mots (du bas de la feuille). */
async function toucherBouton(s, re, att = 1800) {
  const c = await s.p.evaluate((src) => {
    const re = new RegExp(src, 'i');
    const couches = [...document.querySelectorAll('[role=dialog],[data-feuille-rangee],[data-page-shell],[data-vaul-drawer]')].filter((e) => e.getBoundingClientRect().width > 0);
    const racine = couches.length ? couches.at(-1) : document;
    const b = [...racine.querySelectorAll('button')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.disabled && re.test((e.innerText || e.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim()); }).at(-1);
    if (!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2];
  }, re.source);
  if (!c) throw new Error(`aucun bouton ${re}`);
  await new Promise((r) => setTimeout(r, 120)); await s.p.touchscreen.tap(c[0], c[1]); await new Promise((r) => setTimeout(r, att));
}
const bilan = async (s, avant, nom, { exigerNom = true } = {}) => {
  const apres = await comptes(s); const cr = crues(avant, apres); const cols = nom ? await dansMagasin(s, nom) : [];
  const refus = await refusLu(s);
  return { oui: !refus && cr.length > 0 && (!exigerNom || cols.length > 0), detail: `${refus ? `refus « ${refus.slice(0, 120)} » ; ` : ''}collections qui grandissent : ${cr.join('+') || 'aucune'}${nom ? ` ; « ${nom} » dans : ${cols.join('+') || 'nulle part'}` : ''}` };
};
const txt = (s) => s.p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));

/** Chaque geste de bout en bout. `nom` : la chaîne « ZZ TEST plus … » à retrouver dans le magasin. */
const ABOUTIT = {
  async ecriture(s, nom) { // « Saisir sans justificatif » (la page « Nouvelle dépense » : refaite par la mission saisie-main, constat seul)
    const avant = await comptes(s);
    await s.toucher('Saisir sans justificatif'); await new Promise((r) => setTimeout(r, 1000));
    await s.ecrire('[aria-label="Pour quoi ?"]', nom); await s.ecrire('#purchase-total', '33.5');
    await toucherBouton(s, /^Enregistrer/, 3500); await fermerAccuses(s);
    return bilan(s, avant, nom);
  },
  async facture(s) { // lecture simulée : la pièce de l'étape (aucun Gemini), puis Confirmer
    const avant = await comptes(s);
    await s.piece('Photographier', { prefixe: true }); await new Promise((r) => setTimeout(r, 1500));
    await s.cap('facture-lue');
    // « Confirmer » est la barre collée en bas de la feuille : le doigt la touche là où elle est, sans la faire défiler (le banc la recentrait et touchait « Relire » à Finances).
    const c = await s.p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && /^Confirmer/.test((e.innerText || '').trim()); }); if (!b) return null; const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
    if (!c) throw new Error('bouton Confirmer absent');
    await s.p.touchscreen.tap(c[0], c[1]); await new Promise((r) => setTimeout(r, 3500)); await s.cap('facture-apres-confirmer'); await fermerAccuses(s);
    return bilan(s, avant, null, { exigerNom: false });
  },
  async vente(s) {
    const avant = await comptes(s);
    await s.toucher('33 cl', { dans: '.cs-tiles button', contient: true, att: 300 });
    await s.toucher('Espèces', { att: 500 }); await s.toucher('^Encaisser', { regex: true, att: 3000 }); await fermerAccuses(s);
    return bilan(s, avant, null, { exigerNom: false });
  },
  async brassin(s) { // choisir une recette prévue : la page du jour de brassage s'ouvre (le même geste que B2 de chaines)
    await s.toucher('Brasser B-ZZ-PLAN', { prefixe: true, att: 2200 });
    const t = await txt(s); const oui = /Commencer le brassage|Conduite/.test(t) && /B-ZZ-PLAN/.test(t);
    return { oui, detail: oui ? 'la fiche de B-ZZ-PLAN s’ouvre sur le brassage (Préparer, « Commencer le brassage »)' : `la page du jour ne s'ouvre pas : ${t.slice(0, 100)}` };
  },
  async recette(s) { // vue seule : l'assistant est celui des Brassins (openWizard) ; son aboutissement est joué par chaines B1/D394
    const t = await txt(s); return { oui: null, detail: `vue seule ; aboutissement de l'assistant joué par chaines B1/D394 (${/étape 1 sur 7/.test(t) ? 'étape 1 sur 7 ouverte' : 'étape 1 non lue'})` };
  },
  async estimer(s) {
    await s.toucher('B-ZZ-PLAN', { contient: true, att: 1800 });
    const t = await txt(s); const oui = /coût du litre|Coût du litre|par litre/i.test(t);
    return { oui, detail: oui ? 'l’estimation du brassin prévu affiche le coût du litre' : `pas de coût du litre : ${t.slice(0, 140)}` };
  },
  async densite(s) { const t = await txt(s); const oui = /Mesure|Densité|densité/.test(t); return { oui, detail: oui ? 'fiche de B-ZZ-FERM, section Mesures lue' : `pas de Mesures : ${t.slice(0, 120)}` }; },
  async courses(s) { const t = await txt(s); const oui = /Copier/.test(t) && /ZZ TEST/.test(t); return { oui, detail: oui ? 'la liste de courses (Copier, articles ZZ TEST) est affichée' : `liste non lue : ${t.slice(0, 120)}` }; },
  async creation(s, nom) { // article, matériel, client : un nom, puis le bouton de la feuille
    const avant = await comptes(s);
    await ecrirePremierChamp(s, nom); await toucherBouton(s, /^(Créer|Ajouter|Enregistrer|Valider)/, 2500); await fermerAccuses(s);
    return bilan(s, avant, nom);
  },
  async materiel(s, nom) { // la feuille « Acheter du matériel » : un achat à enregistrer (total, pour quoi)
    const avant = await comptes(s);
    await s.ecrire('#purchase-total', '45.5'); await s.ecrire('[aria-label="Pour quoi ?"]', nom);
    await toucherBouton(s, /^Enregistrer/, 3500); await fermerAccuses(s);
    return bilan(s, avant, nom);
  },
  async fut(s) { const avant = await comptes(s); await toucherBouton(s, /^(Créer|Ajouter|Enregistrer|Valider)/, 2500); await fermerAccuses(s); return bilan(s, avant, null, { exigerNom: false }); },
  async tarif(s) {
    const avant = await comptes(s);
    const avant427 = (await dansMagasin(s, '4.27')).length;
    await s.ecrire('#tf-priceHT', '4.27'); // le champ « Prix de vente HT (CHF) » de TarifSheet
    await toucherBouton(s, /^Enregistrer/, 2500); await fermerAccuses(s);
    const b = await bilan(s, avant, null, { exigerNom: false }); const ecrit = (await dansMagasin(s, '4.27')).length > avant427;
    return { oui: !b.detail.startsWith('refus') && ecrit, detail: `${b.detail} ; prix 4.27 écrit : ${ecrit ? 'oui' : 'non'}` };
  },
  async idee(s, nom) { // la feuille d'idée (Calendrier) ou le champ du bas (Atelier › Carnet, Carnets) : écrire, valider
    const avant = await comptes(s);
    const foc = await s.p.evaluate(() => { const a = document.activeElement; return a && /INPUT|TEXTAREA/.test(a.tagName) ? 'focus' : null; });
    if (foc) await s.p.keyboard.type(nom, { delay: 20 }); else await ecrirePremierChamp(s, nom, { dansFeuille: false });
    await new Promise((r) => setTimeout(r, 400));
    const bouton = await s.p.evaluate(() => [...document.querySelectorAll('button')].some((e) => e.getBoundingClientRect().width > 0 && /^(Noter|Ajouter|Enregistrer|Envoyer|Poser)/i.test((e.innerText || e.getAttribute('aria-label') || '').trim())));
    if (bouton) await toucherBouton(s, /^(Noter|Ajouter|Enregistrer|Envoyer|Poser)/, 2000); else { await s.p.keyboard.press('Enter'); await new Promise((r) => setTimeout(r, 2000)); }
    const b = await bilan(s, avant, nom); b.detail = `${foc ? 'le champ avait déjà le focus ; ' : ''}${b.detail}`; return b;
  }
};
/** Le geste d'une ligne selon son nom. */
const KIND = { 'Écriture': 'ecriture', 'Nouvelle écriture': 'ecriture', 'Facture': 'facture', 'Entrer une facture': 'facture', 'Vente': 'vente', 'Encaisser une vente': 'vente',
  'Brassin': 'brassin', 'Nouveau brassin': 'brassin', 'Lancer un brassin': 'brassin', 'Recette': 'recette', 'Créer une recette': 'recette', 'Estimer un brassin': 'estimer',
  'Saisir une densité': 'densite', 'Courses': 'courses', 'Nouvel article': 'creation', 'Nouveau matériel': 'materiel', 'Nouveau client': 'creation', 'Nouveau fût': 'fut',
  'Nouveau tarif': 'tarif', 'Nouvelle idée': 'idee' };

export async function jouerActions({ banc, ouvrirPage, sortie, entrees, echec, ok, sleep, themes, opt }) {
  const { lecturesChaines } = await import(pathToFileURL(path.join(ICI, 'fixtures', 'lectures.mjs')).href);
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const lecture = lecturesChaines(aujourdhui).facture;
  const seul = opt('ligne') ? opt('ligne').split(',') : null;
  const ZZ = (m) => `ZZ TEST plus ${m}`;
  /** Une ligne = { id, ecran, ligne:{page|libelle}, attendu:{couche|texte|onglet|focus : regex}, vueAttendue (mots), aboutit?:(s,hint)=>… } */
  const L = [];
  for (const [id, nom] of Object.entries(RANGEES)) {
    L.push({ id: `cal-${id}`, ecran: 'calendrier', ligne: { page: id }, attendu: { couche: new RegExp(`^feuille:${nom}$`) }, vueAttendue: `feuille d'ajout, rangée ${nom}`, semaineMenu: id === 'brassin',
      aboutit: (s) => aboutitRangee(s, nom, ZZ(id)) });
  }
  L.push({ id: 'cal-idee', ecran: 'calendrier', ligne: { page: 'idee' }, attendu: { texte: /id[ée]e/i }, vueAttendue: 'feuille d’idée du carnet, semaine du menu', semaineMenu: true });
  L.push({ id: 'cal-partout-ecriture', ecran: 'calendrier', ligne: { libelle: 'Écriture' }, attendu: { texte: /justificatif|Photographier|facture|écriture/i }, vueAttendue: 'entrée d’une dépense (document, photo, ou sans justificatif)' });
  L.push({ id: 'cal-partout-facture', ecran: 'calendrier', ligne: { libelle: 'Facture' }, attendu: { texte: /Photographier|PDF|justificatif/i }, vueAttendue: 'lecture d’une facture (photo ou PDF)' });
  L.push({ id: 'cal-partout-vente', ecran: 'calendrier', ligne: { libelle: 'Vente' }, attendu: { texte: /Encaisser|33 cl|Vendre/ }, vueAttendue: 'la caisse (vente)' });
  L.push({ id: 'cal-partout-recette', ecran: 'calendrier', ligne: { libelle: 'Recette' }, attendu: { texte: /recette/i }, vueAttendue: 'l’assistant de recette' });
  L.push({ id: 'cal-partout-brassin', ecran: 'calendrier', ligne: { libelle: 'Brassin' }, attendu: { texte: /brass/i }, vueAttendue: 'lancer un brassin (choix de la recette)' });
  L.push({ id: 'cal-compagnon', ecran: 'calendrier', ligne: { libelle: 'Compagnon' }, attendu: {}, nonJouable: 'dev-local : BrewerActivity en localOnly, l’écouteur brewer-companion-open n’est pas posé (la pastille dit « hors connexion »)', vueAttendue: 'le compagnon' });
  L.push({ id: 'cal-conversations', ecran: 'calendrier', ligne: { libelle: 'Mes conversations' }, attendu: {}, nonJouable: 'la ligne n’existe qu’avec au moins une conversation (compagnon.conversations > 0) ; aucune en fixture', vueAttendue: 'la boîte des conversations' });
  // les autres écrans : l'action de l'écran (pleine) et ses autres lignes
  const A = (ecran, libelle, texte, vueAttendue, extra = {}) => L.push({ id: `${ecran}-${libelle.toLowerCase().replace(/[^a-zé]+/g, '-')}`, ecran, ligne: { libelle }, attendu: texte, vueAttendue, ...extra });
  A('bord', 'Nouvelle écriture', { texte: /justificatif|Photographier|facture|écriture/i }, 'entrée d’une dépense');
  A('bord', 'Courses', { onglet: /Stocks/, texte: /Courses|à commander/i }, 'Stocks › Courses');
  A('finances', 'Estimer un brassin', { texte: /estim|coût du litre/i }, 'l’estimation d’un brassin (coût du litre)');
  A('finances', 'Entrer une facture', { texte: /Photographier|PDF|justificatif/i }, 'lecture d’une facture');
  A('finances', 'Encaisser une vente', { texte: /Encaisser|33 cl|Vendre/ }, 'la caisse');
  A('brassins', 'Nouveau brassin', { texte: /brass/i }, 'lancer un brassin');
  A('brassins', 'Saisir une densité', { texte: /densit|Mesure/i }, 'fiche du brassin en fermentation, section Mesures');
  A('brassins', 'Créer une recette', { texte: /recette/i }, 'l’assistant de recette');
  A('recettes', 'Lancer un brassin', { texte: /brass/i }, 'lancer un brassin');
  A('atelier', 'Nouvelle idée', { onglet: /Brassins/, texte: /id[ée]e|Carnet/i }, 'Atelier › Carnet, champ d’idée au focus');
  A('volumes', 'Lancer un brassin', { texte: /brass/i }, 'lancer un brassin');
  A('volumes', 'Courses', { onglet: /Stocks/, texte: /Courses|à commander/i }, 'Stocks › Courses');
  A('stock', 'Nouvel article', { texte: /article|Nom/i }, 'feuille de création d’un article');
  A('stock', 'Courses', { texte: /Courses|à commander/i }, 'Stocks › Courses');
  A('courses', 'Nouvel article', { texte: /article|Nom/i }, 'feuille de création d’un article');
  A('futs', 'Nouveau fût', { texte: /fût|F-\d+/i }, 'feuille de création d’un fût');
  A('futs', 'Encaisser une vente', { texte: /Encaisser|33 cl|Vendre/ }, 'la caisse');
  A('materiel', 'Nouveau matériel', { texte: /matériel|Nom/i }, 'feuille de création d’un matériel');
  A('carnets', 'Nouvelle idée', { texte: /id[ée]e|Carnet/i, focus: /id[ée]e|Noter|Écrire|textarea|input/i }, 'le champ du bas au focus (Carnets)');
  A('clients', 'Nouveau client', { texte: /client|Nom/i }, 'feuille de création d’un client');
  A('clients', 'Encaisser une vente', { texte: /Encaisser|33 cl|Vendre/ }, 'la caisse');
  A('clients', 'Nouveau tarif', { texte: /tarif|prix/i }, 'feuille de création d’un tarif');
  A('tarifs', 'Nouveau tarif', { texte: /tarif|prix/i }, 'feuille de création d’un tarif');
  A('tarifs', 'Nouveau client', { texte: /client|Nom/i }, 'feuille de création d’un client');
  // les gestes communs depuis chaque écran sans sa propre ligne : le même résultat qu'au Calendrier
  for (const ecran of ['bord', 'finances', 'brassins', 'stock', 'clients']) {
    for (const [lib, re, quoi] of [['Écriture', /justificatif|Photographier|facture|écriture/i, 'entrée d’une dépense'], ['Facture', /Photographier|PDF|justificatif/i, 'lecture d’une facture'], ['Vente', /Encaisser|33 cl|Vendre/, 'la caisse'], ['Recette', /recette/i, 'l’assistant de recette'], ['Brassin', /brass/i, 'lancer un brassin']]) {
      if (L.some((x) => x.ecran === ecran && x.ligne.libelle === lib)) continue;
      L.push({ id: `${ecran}-partout-${lib.toLowerCase()}`, ecran, ligne: { libelle: lib }, attendu: { texte: re }, vueAttendue: quoi });
    }
  }
  const lignes = seul ? L.filter((x) => seul.some((q) => x.id.startsWith(q))) : L;
  const sortieJson = [];
  for (const l of lignes) {
    const C = `ACTION ${l.id}`;
    const s = await ouvrirPage(banc, '390x660', themes[0], entrees, { lecture });
    const rangee = { id: l.id, ecran: l.ecran, ligne: l.ligne.page ?? l.ligne.libelle, attendu: l.vueAttendue, obtenu: null, vue: null, aboutit: null, detail: '' };
    try {
      await aller(s, l.ecran);
      let hint = null;
      try { hint = await toucherLigne(s, l.ligne); } catch (e) { if (!l.nonJouable) throw e; rangee.vueOk = null; rangee.obtenu = 'ligne absente du menu'; rangee.detail = `non jouable en fixture : ${l.nonJouable}`; ok(C, rangee.detail); continue; }
      await sleep(600);
      const v = await vue(s);
      rangee.vue = v; rangee.obtenu = `${v.onglet || '?'} › ${v.couche ?? 'écran'} « ${v.texte.slice(0, 90)} »`;
      await s.cap(`action-${l.id}`);
      if (l.nonJouable) { rangee.vueOk = null; rangee.detail = `non jouable en fixture : ${l.nonJouable} ; le geste ne fait rien de visible`; ok(C, rangee.detail); continue; }
      const pb = [];
      for (const [champ, re] of Object.entries(l.attendu)) if (!re.test(v[champ] ?? '')) pb.push(`${champ} « ${String(v[champ]).slice(0, 80)} » ≠ ${re}`);
      if (l.semaineMenu) {
        const sm = semaineDit(hint), sf = semaineDit(v.semaine) ?? semaineDit(v.texte);
        if (!sm || !sf || sm !== sf) pb.push(`semaine du menu S${sm} ≠ semaine de la feuille S${sf}`);
        rangee.detail += `semaine menu S${sm}, feuille S${sf}. `;
      }
      rangee.vueOk = pb.length === 0; rangee.ecarts = pb;
      const geste = l.aboutit ? (() => l.aboutit(s)) : (ABOUTIT[l.kind ?? KIND[l.ligne.libelle] ?? (l.ligne.page === 'idee' ? 'idee' : '')] ? (() => ABOUTIT[l.kind ?? KIND[l.ligne.libelle] ?? 'idee'](s, ZZ(l.id))) : null);
      if (geste && pb.length === 0) { try { const r = await geste(); rangee.aboutit = r.oui; rangee.detail += r.detail; } catch (e) { rangee.aboutit = false; rangee.detail += `geste interrompu : ${String(e.message ?? e).slice(0, 160)}`; } await s.cap(`action-${l.id}-fin`); }
      const vraies = s.erreurs.filter((x) => !/Failed to read the 'localStorage' property/.test(x));
      if (vraies.length) rangee.detail += ` erreurs page : ${vraies.slice(0, 2).join(' | ')}`;
      (pb.length || rangee.aboutit === false) ? echec(C, `${pb.join(' ; ')}${rangee.aboutit === false ? ` | n'aboutit pas : ${rangee.detail}` : ''}`) : ok(C, `${rangee.obtenu.slice(0, 110)}${rangee.aboutit ? ' | aboutit' : ''}`);
    } catch (e) { rangee.vueOk = false; rangee.ecarts = [String(e.message ?? e).slice(0, 200)]; echec(C, rangee.ecarts[0]); }
    finally { sortieJson.push(rangee); await s.fermer(); }
  }
  fs.writeFileSync(path.join(sortie, 'actions.json'), JSON.stringify(sortieJson, null, 1));
}
