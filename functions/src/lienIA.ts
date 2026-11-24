import { load } from 'cheerio/slim';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import type { PageLue } from './carnetIA.js';
import { couper, montantsDe, positionsMontant } from './lienProduit.js';
import { bruitDeBoutique } from './lienPlateforme.js';

/**
 * Dernière marche de la cascade (D446) : l'IA lit le TEXTE nettoyé de la page, jamais la page brute ni son adresse (décision du 23.11 :
 * url_context plafonnait à 81 % sur le prix, ne rendait aucune photo, et une page de 111 000 jetons a coûté 0,21 CHF à elle seule).
 *
 * État de l'art : la conversion HTML → Markdown est le prétraitement standard avant un modèle de langue (Jina Reader, Firecrawl,
 * Readability + turndown). `node-html-markdown` (htmlparser rapide, maintenu, sans DOM complet) garde titres, listes et tableaux, là où
 * les caractéristiques vivent ; Readability, faite pour les articles, retire justement ces listes « de boilerplate ». Le nettoyage
 * (scripts, styles, navigation, pied de page, formulaires) se fait avant, avec cheerio ; le texte part du titre du produit et est tronqué
 * (12 000 caractères, ~3 500 jetons) : le coût est connu et réservé avant l'envoi.
 *
 * Garde (rien n'est inventé) : chaque valeur rendue doit être écrite dans le texte envoyé ; un prix absent du texte, une caractéristique
 * dont un nombre n'y figure pas, sont retirés et l'étape dit `douteux`. L'IA ne remplace jamais une valeur des données structurées :
 * elle complète ce qui manque ; un désaccord sur le prix se signale (`controle` douteux), le prix schema.org reste.
 */

export const TEXTE_IA_MAX = 12_000;

/** Le texte de la page en Markdown, à partir du titre du produit, sans navigation ni scripts. */
export function markdownProduit(html: string, titre?: string): string {
  const $ = load(html);
  /* Le `form` n'est pas retiré : sur nombre de boutiques il enveloppe tout le bloc d'achat et la description (sios.ch, bier-brauen.at). */
  $('script, style, noscript, template, svg, iframe, header, footer, aside, input, select, textarea, button, [id*="cookie" i], [class*="cookie" i]').remove();
  /* Une navigation est faite de liens ; un `nav` qui porte surtout du texte n'en est pas une : sios.ch place la description du produit (Malzmenge,
     matière, volume) dans un <nav class="tab-navigation"> (1 081 signes, 3 % de liens), que l'IA ne lisait donc jamais (n° 26 du banc, D449). */
  $('nav, [role="navigation"]').each((_, e) => {
    const el = $(e), t = el.text().replace(/\s+/g, ' ').trim().length, liens = el.find('a').text().replace(/\s+/g, ' ').trim().length;
    if (t < 400 || liens / t > 0.4) el.remove();
  });
  const racine = $('main').first().html() ?? $('body').html() ?? $.html();
  const md = NodeHtmlMarkdown.translate(racine, { keepDataImages: false, ignore: ['img', 'picture', 'video'] })
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\n{3,}/g, '\n\n').trim();
  const t = titre ? md.toLowerCase().indexOf(titre.toLowerCase().slice(0, 40)) : -1;
  const debut = t > 0 ? Math.max(0, t - 300) : 0;
  return md.slice(debut, debut + TEXTE_IA_MAX);
}

export const LIEN_IA_SCHEMA = {
  type: 'OBJECT',
  properties: {
    nom: { type: 'STRING', nullable: true },
    prix: { type: 'NUMBER', nullable: true },
    devise: { type: 'STRING', nullable: true },
    taxe: { type: 'STRING', enum: ['ht', 'ttc'], nullable: true },
    prixDes: { type: 'BOOLEAN', nullable: true },
    portSuisse: { type: 'NUMBER', nullable: true },
    portGratuit: { type: 'BOOLEAN', nullable: true },
    caracteristiques: { type: 'ARRAY', items: { type: 'OBJECT', properties: { nom: { type: 'STRING' }, valeur: { type: 'STRING' } }, required: ['nom', 'valeur'], propertyOrdering: ['nom', 'valeur'] } }
  },
  required: ['caracteristiques'],
  propertyOrdering: ['nom', 'prix', 'devise', 'taxe', 'prixDes', 'portSuisse', 'portGratuit', 'caracteristiques']
} as const;

export const LIEN_IA_CONSIGNE = [
  'Tu lis le texte d\'une page produit d\'une boutique en ligne. Rends UNIQUEMENT ce qui est écrit dans ce texte, copié tel quel.',
  '- nom : le nom du produit, marque comprise si elle est écrite.',
  '- prix : le prix de vente du produit principal pour 1 pièce (pas un prix barré, pas un accessoire, pas un prix au kg, pas une mensualité) ; devise : code ISO (CHF, EUR, GBP, USD, AUD).',
  '- taxe : « ht » si la page dit hors taxe / exkl. MwSt / zzgl. MwSt pour ce prix, « ttc » si elle dit taxe comprise / inkl. MwSt ; sinon null.',
  '- prixDes : true si le prix est « dès / ab / from » (plusieurs tailles ou variantes).',
  '- portSuisse : frais de livraison vers la Suisse seulement s\'ils sont écrits ; portGratuit : true si la livraison gratuite est écrite.',
  '- caracteristiques : au plus 12 caractéristiques techniques écrites (volume, dimensions, puissance, poids, matière, capacité…), la valeur avec son unité, recopiée du texte ; le nom court, écrit en français (« Largeur », « Volume », « Puissance ») même si la page est en allemand ou en anglais. Une longueur de câble est « Longueur du câble », jamais « Longueur ».',
  'Un champ absent du texte est null (ou une liste vide). N\'invente rien, ne convertis rien, ne calcule rien.'
].join('\n');

export interface ReponseIA { nom?: string | null; prix?: number | null; devise?: string | null; taxe?: 'ht' | 'ttc' | null; prixDes?: boolean | null; portSuisse?: number | null; portGratuit?: boolean | null; caracteristiques?: Array<{ nom: string; valeur: string }> }
/** L'appel au modèle, injecté : `aiTask` le lie à Gemini (budget, journal) ; les tests et le banc le simulent. */
export type ModeleIA = 'lite' | 'fort' | 'neon';
/**
 * `lite` : Flash-Lite, première lecture ; `fort` : Hydrogen, relecture automatique quand un champ manque encore ; `neon` : Neon, le bouton
 * « Escalader » (D449, 24.11). Le texte vu par le brasseur ne nomme jamais un modèle (T30-11).
 */
export type AppelIA = (modele: ModeleIA, consigne: string, texte: string) => Promise<ReponseIA | null>;

const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[\s  ]+/g, ' ').trim();
const nombres = (t: string) => (norm(t).replace(/(\d)['’.](?=\d{3}\b)/g, '$1').match(/\d+(?:[.,]\d+)?/g) ?? []).map((x) => x.replace(',', '.').replace(/\.0+$/, ''));

/**
 * T28-8 : une dimension (largeur, hauteur, profondeur, longueur…) dont le nombre n'est écrit nulle part avec une unité de longueur, ni dans une
 * suite « 180 × 160 × 60 », n'est pas lue : « Largeur 61 cm · Longueur 162 cm · Hauteur 6 cm » sur une page qui dit « 180 × 160 × 60 cm »
 * passait la garde parce que 61, 162 et 6 figuraient ailleurs dans le texte (un numéro de filiale, un nombre de clients).
 */
const DIMENSION = /^(?:largeur|hauteur|profondeur|longueur|diametre|epaisseur|breite|hohe|tiefe|lange|durchmesser|width|height|depth|length|diameter)\b/;
function nombreAvecUnite(texte: string, n: string): boolean {
  // « 2010 » s'écrit aussi « 2.010 », « 2 010 » ou « 2'010 » : le séparateur de milliers est facultatif
  const e = n.includes('.') ? n.replace(/\./g, '[.,]') : n.replace(/\B(?=(\d{3})+(?!\d))/g, '[.\' \\u00a0]?');
  return new RegExp(`(?<![\\d.,])${e}(?:[.,]0+)?\\s*(?:cm|mm|dm|m)(?![a-z])|(?<![\\d.,])${e}\\s*[x×]\\s*\\d|\\d\\s*[x×]\\s*${e}(?![\\d.,])`).test(texte);
}

/**
 * D449 : des frais de port « écrits » ne sont pas des frais VERS LA SUISSE. « Versandkostenfreie Lieferung nach Österreich » ne dit rien du port
 * suisse, et la relecture par un modèle plus fort l'a lu comme gratuit au banc (n° 47, bier-brauen.at). Un passage compte seulement s'il nomme la Suisse
 * (ou un montant en CHF), ou s'il ne nomme aucun autre pays.
 */
const MOT_SUISSE = /schweiz|suisse|svizzera|switzerland|\bCHF\b|\bFr\.\s?\d/i;
const AUTRE_PAYS = /österreich|oesterreich|austria|autriche|deutschland|germany|allemagne|frankreich|france|italien|italy|italie|belgi|niederlande|netherlands|pays-bas|europa|europe|ausland|international/i;
const pourLaSuisse = (passage: string) => MOT_SUISSE.test(passage) || !(AUTRE_PAYS.test(passage) || /\b(?:EU|DE|AT|FR|IT|NL|BE|ES|UK|GB|DK)\b/.test(passage)); // les codes pays, en majuscules (« Lieferung nach DE AT »)
const gratuitEcrit = /gratuit|kostenlos|versandkostenfrei|gratis|\bfree\b/gi;
function gratuitPourLaSuisse(texte: string): boolean {
  for (const m of texte.matchAll(gratuitEcrit)) { const i = m.index ?? 0; if (pourLaSuisse(texte.slice(Math.max(0, i - 80), i + 100))) return true; }
  return false;
}

/** La garde : ne garde que ce qui est écrit dans le texte envoyé. Rend aussi ce qui a été retiré (pour le statut `douteux`). */
export interface Gardee { nom?: string; prix?: number; devise?: string; taxe?: 'ht' | 'ttc'; prixDes?: true; portSuisse?: number; portGratuit?: true; caracteristiques: Array<{ nom: string; valeur: string }> }
export function garder(r: ReponseIA, texte: string): { gardee: Gardee; retire: string[] } {
  const retire: string[] = [];
  const nt = norm(texte), nb = new Set(nombres(texte));
  const g: Gardee = { caracteristiques: [] };
  if (r.nom && nt.includes(norm(r.nom).slice(0, 30))) g.nom = couper(r.nom, 180); else if (r.nom) retire.push('nom');
  if (typeof r.prix === 'number' && r.prix > 0) {
    if (positionsMontant(texte, r.prix).length) {
      g.prix = r.prix;
      const dev = (r.devise ?? '').toUpperCase();
      const ecrites = new Set(montantsDe(texte).filter((m) => Math.abs(m.montant - r.prix!) < 0.011).map((m) => m.devise));
      if (/^[A-Z]{3}$/.test(dev) && (ecrites.has(dev) || !ecrites.size)) g.devise = dev; else if (ecrites.size === 1) g.devise = [...ecrites][0];
      if (r.taxe) g.taxe = r.taxe;
      if (r.prixDes) g.prixDes = true;
    } else retire.push('prix');
  }
  if (typeof r.portSuisse === 'number' && r.portSuisse >= 0) { if (positionsMontant(texte, r.portSuisse).some((i) => pourLaSuisse(texte.slice(Math.max(0, i - 100), i + 100)))) g.portSuisse = r.portSuisse; else retire.push('port'); }
  if (r.portGratuit === true) { if (gratuitPourLaSuisse(texte)) g.portGratuit = true; else retire.push('port'); }
  for (const c of (r.caracteristiques ?? []).slice(0, 12)) {
    if (!c?.nom || !c?.valeur) continue;
    /* T25-7 : « non publié », « k. A. » ou un argument de vente n'est pas une valeur : la ligne n'existe pas (l'inconnu n'est jamais écrit) */
    if (bruitDeBoutique(c.nom, c.valeur)) continue;
    const ns = nombres(c.valeur);
    const ecrit = (ns.length ? ns.every((n) => nb.has(n)) : nt.includes(norm(c.valeur))) && (!DIMENSION.test(norm(c.nom)) || ns.every((n) => nombreAvecUnite(nt, n)));
    if (ecrit) g.caracteristiques.push({ nom: couper(c.nom, 60), valeur: couper(c.valeur, 100) }); else retire.push(`caract ${c.nom}`);
  }
  return { gardee: g, retire };
}

/** Faut-il l'IA ? Seulement sur une page lue, quand le nom ou le prix manque ou est douteux, ou que les caractéristiques manquent. */
export function iaUtile(p: PageLue): boolean {
  if (p.statut !== 'lue') return false;
  const prixDouteux = p.etapes?.some((e) => e.nom === 'prix' && e.statut === 'douteux');
  return p.nom === undefined || p.prix === undefined || !!prixDouteux || caracteristiquesTechniques(p) < CARACT_SUFFISANTES;
}

/** Sous ce nombre de mesures lues sur la page, l'IA complète (elle ne coûte que ~0,001 CHF sur Flash-Lite) : poids et dimensions seuls laissent souvent le volume ou la puissance. */
export const CARACT_SUFFISANTES = 4;
const IDENTIFIANT = /artikel|sku|\bean\b|gtin|mpn|bestell|nummer|numéro|référence|reference|kategorie|catégorie|marke|brand|hersteller|lagerbestand|verfügbar|disponib|versandgewicht|shipping/i;
const MESURE = /\d\s*(?:mm|cm|dm|m|km|kg|g|mg|l|ml|cl|w|kw|v|a|bar|°c?|%|ebc|ibu|ph|min|h|s|ppm|zoll|"|×|x)(?![a-zà-ÿ])|\d\s*[x×]\s*\d/i;
/** Combien de mesures distinctes (nombre + unité, ou « 180 × 160 ») le texte écrit. */
const MESURE_ECRITE = /\d+(?:[.,]\d+)?\s*(?:mm|cm|dm|m|km|kg|g|mg|l|ml|cl|w|kw|v|a|bar|°c?|%|ebc|ibu|ph|min|h|s|ppm|zoll|"|×|x)(?![a-zà-ÿ])|\d+\s*[x×]\s*\d+/gi;
export function mesuresEcrites(texte: string): number {
  return new Set((texte.match(MESURE_ECRITE) ?? []).map((m) => m.toLowerCase().replace(/\s+/g, ''))).size;
}
/** Les caractéristiques qui disent quelque chose du produit : une mesure chiffrée avec son unité, pas un numéro d'article ni un en-tête de tableau. */
export function caracteristiquesTechniques(p: PageLue): number {
  return (p.valeurs ?? []).filter((v) => !IDENTIFIANT.test(v.nom) && MESURE.test(`${v.valeur} ${v.unite ?? ''}`)).length;
}

/**
 * Les frais de livraison sont-ils écrits dans le texte ? Un mot de livraison suivi, tout près, d'un montant avec sa devise ou de « gratuit ».
 * (D449 : l'IA forte ne se lance pour les frais que si la page en parle ; sinon elle ne trouverait rien et coûterait pour rien.)
 */
const MOT_LIVRAISON = /versand(?:kosten)?|liefer(?:ung|kosten)|livraison|frais de port|shipping|delivery|porto/gi;
export function fraisEcrits(texte: string, prixProduit: number[] = []): boolean {
  for (const m of texte.matchAll(MOT_LIVRAISON)) {
    /* la fenêtre s'arrête à la fin de la phrase : « Livraison rapide. Prix : CHF 289 » ne dit pas de frais ; le prix du produit n'est pas un port */
    const fenetre = texte.slice(m.index ?? 0, (m.index ?? 0) + 100).split(/\n|[.!?]\s+(?=[A-ZÀ-Ý])/)[0];
    if (!pourLaSuisse(fenetre)) continue;
    if (montantsDe(fenetre).some((x) => !prixProduit.some((q) => Math.abs(q - x.montant) < 0.011)) || /gratuit|kostenlos|versandkostenfrei|gratis|\bfree\b/i.test(fenetre)) return true;
  }
  return false;
}

/**
 * Ce qui manque encore à la fiche, page et IA mises ensemble (D449) : prix, nom, caractéristiques sous le seuil, devise du prix, frais de port
 * si la page en parle. La photo n'en fait pas partie : elle ne vient pas de l'IA, l'escalade ne la trouverait jamais.
 */
export function champsManquants(p: PageLue, g: Gardee, texte: string): string[] {
  const manque: string[] = [];
  const prix = p.prix ?? g.prix;
  if (prix === undefined) manque.push('prix');
  else if (!(p.prix !== undefined ? p.devise : g.devise)) manque.push('devise');
  if (!p.nom && !g.nom) manque.push('nom');
  const valeurs = [...(p.valeurs ?? []), ...g.caracteristiques.map((c) => ({ nom: c.nom, valeur: c.valeur }))];
  /* Sous le seuil, ET le texte écrit plus de mesures que celles déjà lues : sinon la relecture n'a rien de plus à trouver (une page qui n'écrit
     qu'une mesure ne donnera pas la quatrième) et elle coûterait pour rien. */
  const trouvees = caracteristiquesTechniques({ ...p, valeurs });
  if (trouvees < CARACT_SUFFISANTES && mesuresEcrites(texte) > trouvees) manque.push('caracteristiques');
  if (!p.livraison && g.portSuisse === undefined && !g.portGratuit && fraisEcrits(texte, [p.prix, g.prix].filter((x): x is number => x !== undefined))) manque.push('frais');
  return manque;
}

/** `base` l'emporte ; `plus` ne fait que compléter. Le prix (avec sa devise, sa taxe) et le port vont chacun d'un bloc, jamais mêlés. */
function fusion(base: Gardee, plus: Gardee): Gardee {
  const out: Gardee = { caracteristiques: [] };
  const nom = base.nom ?? plus.nom; if (nom) out.nom = nom;
  const prix = base.prix !== undefined ? base : plus;
  if (prix.prix !== undefined) { out.prix = prix.prix; if (prix.devise) out.devise = prix.devise; if (prix.taxe) out.taxe = prix.taxe; if (prix.prixDes) out.prixDes = true; }
  const port = base.portSuisse !== undefined || base.portGratuit ? base : plus;
  if (port.portSuisse !== undefined) out.portSuisse = port.portSuisse;
  if (port.portGratuit) out.portGratuit = true;
  const noms = new Set(base.caracteristiques.map((c) => norm(c.nom)));
  out.caracteristiques = [...base.caracteristiques, ...plus.caracteristiques.filter((c) => !noms.has(norm(c.nom)))].slice(0, 12);
  return out;
}

/**
 * Complète la page lue par l'IA (D449, 24.11) : Flash-Lite d'abord ; le modèle fort (Hydrogen) dès qu'un champ de la fiche reste vide après
 * Flash-Lite (`champsManquants`) ou que le prix est retiré par la garde ou contredit le prix publié. L'option `escalade` (le bouton du
 * brasseur) va directement à Neon, sans Flash-Lite. Les données structurées restent prioritaires ; un champ déjà trouvé n'est jamais
 * remplacé par la relecture ; chaque ajout est gardé contre le texte (rien n'est inventé). `regleAvant` : la règle du 23.11 (Hydrogen
 * seulement pour le prix, escalade directe sur Hydrogen), gardée pour que le banc (scripts/banc-liens.ts) mesure l'avant et l'après.
 */
export async function completerParIA(p: PageLue, html: string, appel: AppelIA, options: { escalade?: boolean; regleAvant?: boolean } = {}): Promise<PageLue> {
  const texte = markdownProduit(html, p.nom);
  if (texte.length < 200) return p;
  const etapes = [...(p.etapes ?? [])];
  let panne: string | undefined;
  const demander = (m: ModeleIA) => appel(m, LIEN_IA_CONSIGNE, texte).catch((e: unknown) => { panne = String((e as { message?: unknown })?.message ?? e).slice(0, 120); return null; });
  /* `escalade` (lecture refaite à la demande du brasseur) : directement Neon, sans Flash-Lite ; une panne ne se rejoue pas. */
  const direct = options.escalade === true;
  let r = await demander(direct ? (options.regleAvant ? 'fort' : 'neon') : 'lite');
  let { gardee, retire } = r ? garder(r, texte) : { gardee: { caracteristiques: [] } as Gardee, retire: [] as string[] };
  /* T30-11 : ce que l'étape dit est pour le brasseur : jamais « lite », « fort » ni un nom de modèle */
  const modeles: string[] = [direct ? 'IA plus forte' : ''];
  const contredit = p.prix !== undefined && gardee.prix !== undefined && Math.abs(gardee.prix - p.prix) > 0.011 && gardee.prix !== p.prixTTC;
  const prixEnDoute = (p.prix === undefined && gardee.prix === undefined) || contredit || retire.includes('prix');
  /* Relecture automatique : un champ qui compte reste absent ou douteux après Flash-Lite. Une panne (budget, délai) ne s'escalade pas :
     elle se répéterait et coûterait. */
  if (!direct && !panne && (options.regleAvant ? prixEnDoute : prixEnDoute || champsManquants(p, gardee, texte).length > 0)) {
    const fort = await demander('fort');
    modeles.push('relu par une IA plus forte');
    if (fort) {
      const g2 = garder(fort, texte);
      /* le prix en doute : celui du modèle fort, s'il en lit un, prend la place ; sinon ce qui est trouvé reste, la relecture complète seulement */
      const g2Prime = (g2.gardee.prix !== undefined && prixEnDoute) || !r;
      if (g2Prime || !options.regleAvant) {
        const avant = gardee;
        gardee = g2Prime ? fusion(g2.gardee, avant) : fusion(avant, g2.gardee);
        const reste = retire.filter((x) => (x === 'prix' && gardee.prix === undefined) || (x === 'port' && gardee.portSuisse === undefined && !gardee.portGratuit));
        retire = [...new Set([...reste, ...g2.retire])];
        if (g2Prime) r = fort;
      }
    }
  }
  // Un nom que l'IA écrit autrement ne gêne pas quand la page a déjà le sien (il ne remplace jamais) : ce n'est pas un doute.
  if (p.nom) retire = retire.filter((x) => x !== 'nom');
  if (!r && panne) {
    etapes.push({ nom: 'ia', statut: 'absent', detail: `IA indisponible (${panne})` });
    return { ...p, etapes };
  }
  const out: PageLue = { ...p };
  const ajouts: string[] = [];
  if (!out.nom && gardee.nom) { out.nom = gardee.nom; ajouts.push('nom'); }
  if (out.prix === undefined && gardee.prix !== undefined && gardee.devise) {
    out.prix = gardee.prix; out.devise = gardee.devise; ajouts.push('prix');
    if (gardee.prixDes) out.prixDes = true;
    if (gardee.taxe && !out.taxe) out.taxe = gardee.taxe;
  }
  if (!out.livraison && (gardee.portGratuit || gardee.portSuisse !== undefined)) {
    out.livraison = gardee.portGratuit ? { gratuite: true } : { prix: gardee.portSuisse, devise: out.devise ?? gardee.devise ?? 'CHF' };
    ajouts.push('port');
  }
  const deja = new Set((out.valeurs ?? []).map((v) => norm(v.nom)));
  const nouvelles = (gardee.caracteristiques ?? []).filter((c) => !deja.has(norm(c.nom)));
  if (nouvelles.length) { out.valeurs = [...(out.valeurs ?? []), ...nouvelles].slice(0, 24); ajouts.push(`${nouvelles.length} caract.`); }
  const contreditFinal = p.prix !== undefined && gardee.prix !== undefined && Math.abs(gardee.prix - p.prix) > 0.011 && gardee.prix !== p.prixTTC;
  etapes.push({ nom: 'ia', statut: retire.length || contreditFinal ? 'douteux' : ajouts.length ? 'trouve' : 'absent', detail: [modeles.filter(Boolean).join(' puis '), ajouts.length ? `ajouté : ${ajouts.join(', ')}` : 'rien de plus à lire', retire.length ? `retiré (absent du texte) : ${retire.join(', ')}` : '', contreditFinal ? `l'IA lit ${gardee.prix} ${gardee.devise ?? ''}, la page publie ${p.prix} ${p.devise ?? ''}` : ''].filter(Boolean).join(' ; ') });
  if (contreditFinal) {
    const i = etapes.findIndex((e) => e.nom === 'controle');
    const d = `prix : l'IA lit ${gardee.prix}, les données ${p.prix}`;
    if (i >= 0) etapes[i] = { nom: 'controle', statut: 'douteux', detail: [etapes[i].statut === 'douteux' ? etapes[i].detail : '', d].filter(Boolean).join(' ; ') };
  }
  out.etapes = etapes;
  if (out.photos?.length) out.photo = out.photos[0];
  return out;
}
