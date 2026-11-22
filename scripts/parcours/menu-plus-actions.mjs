// MENU DU + — phase ACTIONS (22.11) : chaque ligne du menu, depuis chaque écran où le + existe, ouvre SA vue et aboutit.
// Appelé par menu-plus.mjs (--phase actions). Une page neuve par ligne (fixture « ZZ TEST ») ; 390×844 tactile ; rien ne sort de localhost.
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

export async function jouerActions({ banc, ouvrirPage, sortie, entrees, echec, ok, sleep, themes, opt }) {
  const { lecturesChaines } = await import(pathToFileURL(path.join(ICI, 'fixtures', 'lectures.mjs')).href);
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const lecture = lecturesChaines(aujourdhui).facture;
  const seul = opt('ligne') ? opt('ligne').split(',') : null;
  const ZZ = (m) => `ZZ TEST plus ${m}`;
  /** Une ligne = { id, ecran, ligne:{page|libelle}, attendu:{couche|texte|onglet|focus : regex}, vueAttendue (mots), aboutit?:(s,hint)=>… } */
  const L = [];
  for (const [id, nom] of Object.entries(RANGEES)) {
    L.push({ id: `cal-${id}`, ecran: 'calendrier', ligne: { page: id }, attendu: { couche: new RegExp(`^feuille:${nom}$`) }, vueAttendue: `feuille d'ajout, rangée ${nom}, semaine du menu`, semaineMenu: true,
      aboutit: (s) => aboutitRangee(s, nom, ZZ(id)) });
  }
  L.push({ id: 'cal-idee', ecran: 'calendrier', ligne: { page: 'idee' }, attendu: { texte: /id[ée]e/i }, vueAttendue: 'feuille d’idée du carnet, semaine du menu', semaineMenu: true });
  L.push({ id: 'cal-ecriture', ecran: 'calendrier', ligne: { libelle: 'Écriture' }, attendu: { texte: /justificatif|Photographier|facture|écriture/i }, vueAttendue: 'entrée d’une dépense (document, photo, ou sans justificatif)' });
  L.push({ id: 'cal-facture', ecran: 'calendrier', ligne: { libelle: 'Facture' }, attendu: { texte: /Photographier|PDF|justificatif/i }, vueAttendue: 'lecture d’une facture (photo ou PDF)' });
  L.push({ id: 'cal-vente', ecran: 'calendrier', ligne: { libelle: 'Vente' }, attendu: { texte: /Encaisser|33 cl|Vendre/ }, vueAttendue: 'la caisse (vente)' });
  L.push({ id: 'cal-recette', ecran: 'calendrier', ligne: { libelle: 'Recette' }, attendu: { texte: /recette/i }, vueAttendue: 'l’assistant de recette' });
  L.push({ id: 'cal-brassin', ecran: 'calendrier', ligne: { libelle: 'Brassin' }, attendu: { texte: /brass/i }, vueAttendue: 'lancer un brassin (choix de la recette)' });
  L.push({ id: 'cal-compagnon', ecran: 'calendrier', ligne: { libelle: 'Compagnon' }, attendu: { texte: /Compagnon|brasseur/i }, vueAttendue: 'le compagnon' });
  L.push({ id: 'cal-conversations', ecran: 'calendrier', ligne: { libelle: 'Mes conversations' }, attendu: { texte: /conversation/i }, vueAttendue: 'la boîte des conversations' });
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
    const s = await ouvrirPage(banc, '390x844', themes[0], entrees, { lecture });
    const rangee = { id: l.id, ecran: l.ecran, ligne: l.ligne.page ?? l.ligne.libelle, attendu: l.vueAttendue, obtenu: null, vue: null, aboutit: null, detail: '' };
    try {
      await aller(s, l.ecran);
      const hint = await toucherLigne(s, l.ligne);
      await sleep(600);
      const v = await vue(s);
      rangee.vue = v; rangee.obtenu = `${v.onglet || '?'} › ${v.couche ?? 'écran'} « ${v.texte.slice(0, 90)} »`;
      await s.cap(`action-${l.id}`);
      const pb = [];
      for (const [champ, re] of Object.entries(l.attendu)) if (!re.test(v[champ] ?? '')) pb.push(`${champ} « ${String(v[champ]).slice(0, 80)} » ≠ ${re}`);
      if (l.semaineMenu) {
        const sm = semaineDit(hint), sf = semaineDit(v.semaine) ?? semaineDit(v.texte);
        if (!sm || !sf || sm !== sf) pb.push(`semaine du menu S${sm} ≠ semaine de la feuille S${sf}`);
        rangee.detail += `semaine menu S${sm}, feuille S${sf}. `;
      }
      rangee.vueOk = pb.length === 0; rangee.ecarts = pb;
      if (l.aboutit && pb.length === 0) { const r = await l.aboutit(s); rangee.aboutit = r.oui; rangee.detail += r.detail; await s.cap(`action-${l.id}-fin`); }
      if (s.erreurs.length) rangee.detail += ` erreurs page : ${s.erreurs.slice(0, 2).join(' | ')}`;
      (pb.length || rangee.aboutit === false) ? echec(C, `${pb.join(' ; ')}${rangee.aboutit === false ? ` | n'aboutit pas : ${rangee.detail}` : ''}`) : ok(C, `${rangee.obtenu.slice(0, 110)}${rangee.aboutit ? ' | aboutit' : ''}`);
    } catch (e) { rangee.vueOk = false; rangee.ecarts = [String(e.message ?? e).slice(0, 200)]; echec(C, rangee.ecarts[0]); }
    finally { sortieJson.push(rangee); await s.fermer(); }
  }
  fs.writeFileSync(path.join(sortie, 'actions.json'), JSON.stringify(sortieJson, null, 1));
}
