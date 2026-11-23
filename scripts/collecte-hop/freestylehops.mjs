// Voie c3f (#180) : pages variétés de Freestyle Hops (freestylehops.com, Nouvelle-Zélande), relues depuis le cache avec --offline.
// Autorisation explicite déclarée par l'utilisateur le 26.10 (voir SOURCE.autorisation). Lecture peu intrusive : voir freestylehops-reseau.mjs.
// Les pages variétés ne publient aucun nombre d'analyse (α, huile, linalol…) : seulement un texte d'arôme, quelques mélanges et quelques
// valeurs de produit. Le texte long reste dans le cache ; ici, seulement des mots courts, des noms et des valeurs.
import { fileURLToPath } from 'node:url';
import { decoder, ecrire, fiche, lignes, releveDe } from './c3c-commun.mjs';
import { lire } from './freestylehops-reseau.mjs';

export const ORIGINE = 'https://www.freestylehops.com';

export const SOURCE = {
  id: 'freestylehops',
  nom: 'Freestyle Hops Ltd',
  hote: 'www.freestylehops.com',
  type: 'producteur et fournisseur (Nouvelle-Zélande)',
  conditions: 'robots.txt : User-agent * « Allow: / », Content-Signal search=yes, ai-train=no, use=reference ; ClaudeBot, Claude-Web et anthropic-ai y sont interdits nommément ; aucune licence de réutilisation lue',
  diffusion: "usage non commercial, dans l'app seulement ; aucun entraînement d'IA ; pas de republication du texte (gardé dans le cache, hors du dépôt)",
  autorisation: {
    citation: 'Tu peux y aller, j\'ai eu leur autorisation explicite. Pour un usage non commerciales, c\'est bon, tu dois juste pas être trop intrusif',
    date: '2026-10-26',
    declaree_par: 'utilisateur',
    nature: 'déclarée par l\'utilisateur, non vérifiée par l\'agent',
    limites: 'une requête toutes les 2 s, une seule à la fois, 80 au plus ; seulement les pages variétés et leurs fiches PDF liées ; arrêt sur 401, 403, 429 ou défi',
  },
};

/** Nature de chaque page, lue sur son texte (« blend », « liquid hops », « collection »). */
const NATURE = {
  'kohia-nelson': 'mélange', 'maui-nelson-2': 'mélange', 'maui-nelson': 'produit (infusion de fruit)', 'mega-motueka': 'mélange',
  'super-sauvin': 'mélange', 'tropical-fusion': 'mélange', 'singles-collection': 'coffret', 'subzero-hop-kief': 'produit (extrait)',
};

/** Mots d'arôme publiés, repérés tels quels dans le texte (jamais traduits). Le plus long d'abord. */
const VOCABULAIRE = ['white wine', 'wine-y', 'green grape', 'grape', 'gooseberry', 'passion fruit', 'passionfruit', 'nectarine', 'peach', 'apricot', 'stone fruit',
  'red plum', 'plum', 'pink grapefruit', 'red grapefruit', 'grapefruit', 'orange zest', 'orange', 'citrus blossom', 'citrus', 'lemon-lime', 'lemon/lime', 'zesty lime',
  'lime zest', 'lime', 'lemon', 'yuzu', 'kumquat', 'tropical', 'papaya', 'lychee', 'guava', 'pineapple', 'kiwi', 'pine', 'spruce', 'resinous', 'dankness', 'dank',
  'cannabis', 'floral', 'jasmine', 'apple blossom', 'red berry', 'mango'];
const SYNONYMES = { passionfruit: 'passion fruit', dankness: 'dank' };
/** Variétés et ingrédients cités par leur nom dans le texte (pour les accords et la composition). */
const NOMS_CITES = ['Nelson Sauvin', 'Southern Cross', 'NZ Cascade', 'Rakau', 'Waimea', 'SOX', 'Motueka', 'Riwaka', 'Wakatu', 'Pacifica', 'Peacharine', 'Nectaron', 'Phantasm'];
const reEchappe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const motEntier = n => new RegExp(`(?<![A-Za-z])${reEchappe(n)}(?![A-Za-z])`, 'gi');

/** robots.txt → permis(chemin) pour « User-agent: * » (Allow / Disallow, le motif le plus long l'emporte). */
export function lireRobots(texte) {
  const regles = []; let actif = false, apresRegle = false;
  for (const brut of texte.split(/\r?\n/)) {
    const l = brut.replace(/#.*/, '').trim(); if (!l) continue;
    const m = /^([a-z-]+)\s*:\s*(.*)$/i.exec(l); if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === 'user-agent') { if (apresRegle) { actif = false; apresRegle = false; } if (v === '*') actif = true; }
    else if (k === 'allow' || k === 'disallow') { apresRegle = true; if (actif && v) regles.push({ permis: k === 'allow', motif: v }); }
  }
  return chemin => {
    let meilleur = null;
    for (const r of regles) if (chemin.startsWith(r.motif.replace(/\*.*$/, '')) && (!meilleur || r.motif.length > meilleur.motif.length)) meilleur = r;
    return !meilleur || meilleur.permis;
  };
}

/** Plan du site : { urls des variétés, modifie par url }. */
export function lirePlan(xml) {
  const modifie = {};
  for (const m of xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g)) modifie[decoder(m[1])] = m[2] ? m[2].slice(0, 10) : null;
  const urls = Object.keys(modifie).filter(u => /\/hop-varieties\/[^/]+\/$/.test(u));
  return { urls, modifie };
}

/** Page variété : nom, marque, lignes du corps (entre « View In Webstore » et « Close Menu ») ; null si le titre manque. */
export function lirePageVariete(html) {
  const t = /<title>([^<]*)<\/title>/i.exec(html);
  if (!t) return null;
  const titre = decoder(t[1]).replace(/\s*-\s*Freestyle Hops\s*$/i, '').trim();
  const l = lignes(html);
  const i = l.findIndex(x => /^View In Webstore$/i.test(x));
  let j = l.findIndex((x, k) => k > i && /^Close Menu$/i.test(x));
  if (j < 0) j = l.length;
  const corps = l.slice(i + 1, j);
  const marque = /([®™])/.exec(titre)?.[1] ?? null;
  const nom = titre.replace(/[®™]/g, '').replace(/\s+by Freestyle$/i, '').replace(/^Freestyle\s+/i, '').replace(/\.\.\.$/, '').trim();
  return { titre, nom, marque, corps };
}

const phrases = texte => texte.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map(s => s.trim()).filter(Boolean);
const STADE = { earlier: 'early', early: 'early', mid: 'mid', later: 'late', late: 'late' };

function valeur(champ, brut, v) { return { champ, brut, valeur: null, min: null, max: null, unite: null, base: null, ...v }; }

/** Mots courts, accords, composition, stades de récolte, thiols et valeurs de produit d'une page (sans recopier de prose). */
export function extraire(page, slug) {
  const nature = NATURE[slug] ?? 'variété';
  const lots = [];
  const prose = [];
  for (const x of page.corps) {
    const m = /^(.+?)\s+-\s+(Early|Mid|Late)\s+Harvest\s+-\s+(.+)$/i.exec(x);
    if (m) lots.push({ variete: m[1].trim(), recolte: m[2].toLowerCase(), descripteurs: m[3].split(/\s*,\s*/).map(s => s.trim().toLowerCase()).filter(Boolean), brut: x });
    else prose.push(x);
  }
  const texte = prose.join(' ').replace(/\s+/g, ' ');
  const sujet = page.nom.toLowerCase();
  const champs = {}, listes = {}, extra = { slug, titre: page.titre, nature };
  if (page.marque) extra.marque = { symbole: page.marque, nom: page.nom };

  const nomsDans = s => {
    const trouves = new Set();
    for (const n of [...NOMS_CITES].sort((a, b) => b.length - a.length)) if (motEntier(n).test(s) && n.toLowerCase() !== sujet) trouves.add(n);
    return [...trouves];
  };
  const composition = new Set(), accords = new Set(), ecartees = new Set();
  phrases(texte).forEach((p, i) => {
    if (/\bcombin(?:es|ed)\b|\bblend of\b|\bincludes\b|\bblended with\b/i.test(p) && nature !== 'variété') { nomsDans(p).forEach(n => composition.add(n)); ecartees.add(i); }
    else if (/\bpairs?\b|\bpartner\b/i.test(p)) { nomsDans(p).forEach(n => accords.add(n)); ecartees.add(i); }
  });
  for (const l of lots) { composition.add(l.variete); }

  // Descripteurs : seulement les pages de variétés et de mélanges, hors phrases d'accord ou de composition, sans mot nié.
  const desc = [];
  if (!/^(produit|coffret)/.test(nature)) {
    phrases(texte).forEach((p, i) => {
      if (ecartees.has(i)) return;
      let reste = p.toLowerCase();
      for (const mot of [...VOCABULAIRE].sort((a, b) => b.length - a.length)) {
        const re = new RegExp(`(?<![a-z])${reEchappe(mot)}(?![a-z])`, 'g');
        let m;
        while ((m = re.exec(reste))) {
          const avant = reste.slice(Math.max(0, m.index - 30), m.index);
          const nie = /\b(none of|little of|no|not|without|nor)\b/.test(avant);
          reste = reste.slice(0, m.index) + ' '.repeat(mot.length) + reste.slice(m.index + mot.length);
          if (!nie) desc.push(SYNONYMES[mot] ?? mot);
        }
      }
    });
  }
  listes.descripteurs = [...new Set(desc)];
  listes.accords = [...accords].sort();
  listes.composition = [...composition].sort();
  const stades = new Set();
  for (const m of texte.matchAll(/\b(earl(?:y|ier)|mid|late(?:r)?)\b(?:\s*(?:\/|to|and|-)\s*(earl(?:y|ier)|mid|late(?:r)?))?[\s-]+harvest/gi)) {
    stades.add(STADE[m[1].toLowerCase()]); if (m[2]) stades.add(STADE[m[2].toLowerCase()]);
  }
  listes.stadesRecolte = ['early', 'mid', 'late'].filter(s => stades.has(s));
  listes.thiols = [...new Set([...texte.matchAll(/\b(3S[0-9A-Z]{1,4}|3MHA?|4MMP)\b/g)].map(m => m[1]))].sort();
  listes.composesCites = ['linalool', 'geraniol'].filter(c => new RegExp(c, 'i').test(texte));

  // Valeurs de produit publiées dans le texte (aucune analyse de variété : ces pages n'en publient pas).
  let m;
  if ((m = /(\d+(?:\.\d+)?)\s*brix/i.exec(texte))) champs.sucresBrix = valeur('brix', m[0], { valeur: Number(m[1]), unite: 'brix' });
  if ((m = /(\d+(?:\.\d+)?)\s*g of total sugars per kg of pellets/i.exec(texte))) champs.sucresTotaux = valeur('total sugars', m[0], { valeur: Number(m[1]), unite: 'g/kg', base: 'de granulés' });
  if ((m = /whirlpool dosage rates from (\d+(?:\.\d+)?)\s*g\/L upwards/i.exec(texte))) champs.dosageWhirlpool = valeur('whirlpool dosage rates', m[0], { min: Number(m[1]), operateur: '>=', unite: 'g/L' });
  if ((m = /(~|approximately\s*)?(\d+(?:\.\d+)?)%\s*EtOH by weight/i.exec(texte))) champs.ethanol = valeur('EtOH', m[0], { valeur: Number(m[2]), unite: '%', base: 'en poids' });
  if ((m = /(\d+)\s*mL bottles/i.exec(texte))) champs.volumeBouteille = valeur('bottle', m[0], { valeur: Number(m[1]), unite: 'mL' });
  if ((m = /approximately\s*(\d+)\s*mL of SZHK/i.exec(texte))) champs.volumeUtile = valeur('SZHK volume', m[0], { valeur: Number(m[1]), unite: 'mL' });
  const remarques = [];
  if (/does not contain alpha acids/i.test(texte)) remarques.push('sans acides alpha (publié)');
  if (remarques.length) extra.remarques = remarques;
  if (lots.length) extra.lots = lots;
  return { champs, listes, extra };
}

async function principal() {
  const robotsTxt = await lire(`${ORIGINE}/robots.txt`);
  const permis = lireRobots(robotsTxt.content);
  const index = await lire(`${ORIGINE}/sitemap.xml`);
  const sous = [...index.content.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x => decoder(x[1]));
  const { urls, modifie } = lirePlan((await lire(sous[0])).content);
  const fiches = [], refusees = [];
  for (const url of urls) {
    if (!permis(new URL(url).pathname)) { refusees.push(url); continue; }
    const r = await lire(url); if (!r) continue;
    const page = lirePageVariete(r.content); if (!page) continue;
    const slug = /\/hop-varieties\/([^/]+)\/$/.exec(url)[1];
    const { champs, listes, extra } = extraire(page, slug);
    fiches.push(fiche({ nom: page.nom, alias: page.titre.replace(/[®™]/g, '') !== page.nom ? [page.titre] : [], url, releve: releveDe(r), publie: null, champs, listes, extra: { ...extra, modifieSitemap: modifie[url] ?? null } }));
  }
  ecrire(SOURCE, fiches);
  if (refusees.length) console.log(`Refusées par robots.txt : ${refusees.length}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await principal();
