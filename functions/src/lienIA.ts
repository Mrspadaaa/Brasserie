import { load } from 'cheerio/slim';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import type { EtapeLien, PageLue } from './carnetIA.js';
import { couper, montantsDe, positionsMontant } from './lienProduit.js';
import { bruitDeBoutique } from './lienPlateforme.js';
import { retenir } from './lienLibelles.js';
import { lireConditionnements, parTaille, prixParBase, uniteDeBase, type UniteQuantite } from './lienConditionnement.js';

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
 * dont un nombre n'y figure pas, sont retirés et l'étape dit `douteux`. D450 : l'IA lit toujours la page entière, en plus des données
 * structurées ; deux lectures qui s'accordent (`accordPrix`) valent, un désaccord de prix est dit (`controle` douteux, Escalader) : aucune des
 * deux ne gagne en silence. Les données structurées gardent le prix retenu tant que le brasseur ne tranche pas.
 */

/**
 * D450 (24.11) : l'IA lit la page ENTIÈRE (plus de coupe à 12 000 caractères avant les prix : les paliers et les variantes vivent en bas de page) ; au-delà du plafond, le
 * texte garde le bloc produit (il part du titre) puis le reste jusqu'au plafond.
 */
export const TEXTE_IA_MAX = 30_000;
const UNITES: readonly string[] = ['g', 'kg', 'ml', 'cl', 'dl', 'l'];
const nombreFr = (n: number) => String(n).replace('.', ',');
/** Les conditionnements publiés dans le CODE de la page (JSON des variantes, lignes de variantes) : absents du texte visible, l'IA ne les voyait pas (cause racine, 24.11). */
function blocConditionnements(html: string): string {
  const c = lireConditionnements(html, load(html));
  if (!c.offres.length && !c.parUnite) return '';
  const dev = c.devise ? ` ${c.devise}` : '';
  return [
    'Conditionnements publiés par la page (lus dans son code) :',
    ...c.offres.map((o) => `- ${nombreFr(o.valeur)} ${o.unite} : ${nombreFr(o.prix)}${dev}`),
    ...(c.parUnite ? [`- prix à l'unité : ${nombreFr(c.parUnite.prix)}${dev} par ${c.parUnite.unite}`, ...(c.parUnite.paliers ?? []).map((p) => `- dès ${nombreFr(p.des)} ${c.parUnite!.unite} : ${nombreFr(p.prix)}${dev} par ${c.parUnite!.unite}`)] : []),
    '', ''
  ].join('\n');
}

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
  const bloc = blocConditionnements(html);
  return bloc + md.slice(debut, debut + TEXTE_IA_MAX - bloc.length);
}

export const LIEN_IA_SCHEMA = {
  type: 'OBJECT',
  properties: {
    nom: { type: 'STRING', nullable: true },
    prix: { type: 'NUMBER', nullable: true },
    devise: { type: 'STRING', nullable: true },
    taxe: { type: 'STRING', enum: ['ht', 'ttc'], nullable: true },
    prixDes: { type: 'BOOLEAN', nullable: true },
    quantite: { type: 'NUMBER', nullable: true },
    unite: { type: 'STRING', enum: ['g', 'kg', 'ml', 'cl', 'dl', 'l'], nullable: true },
    parUnite: { type: 'BOOLEAN', nullable: true },
    portSuisse: { type: 'NUMBER', nullable: true },
    portGratuit: { type: 'BOOLEAN', nullable: true },
    caracteristiques: { type: 'ARRAY', items: { type: 'OBJECT', properties: { nom: { type: 'STRING' }, valeur: { type: 'STRING' } }, required: ['nom', 'valeur'], propertyOrdering: ['nom', 'valeur'] } }
  },
  required: ['caracteristiques'],
  propertyOrdering: ['nom', 'prix', 'devise', 'taxe', 'prixDes', 'quantite', 'unite', 'parUnite', 'portSuisse', 'portGratuit', 'caracteristiques']
} as const;

export const LIEN_IA_CONSIGNE = [
  'Tu lis le texte d\'une page produit d\'une boutique en ligne. Rends UNIQUEMENT ce qui est écrit dans ce texte, copié tel quel.',
  '- nom : le nom du produit, marque comprise si elle est écrite.',
  '- prix : le prix de vente du produit principal (pas un prix barré, pas un accessoire, pas une mensualité), pour la plus petite quantité vendue, tel qu\'il est écrit ; devise : code ISO (CHF, EUR, GBP, USD, AUD).',
  '- quantite et unite (g, kg, ml, cl, dl, l) : la quantité à laquelle ce prix se rapporte, telle qu\'elle est écrite (« 50 g », « 5kg »). parUnite : true si le prix est donné pour UNE unité (« Preis/Gramm 0.1044 » : prix 0.1044, quantite 1, unite g, parUnite true). Aucune quantité écrite : null, jamais devinée.',
  '- taxe : « ht » si la page dit hors taxe / exkl. MwSt / zzgl. MwSt pour ce prix, « ttc » si elle dit taxe comprise / inkl. MwSt ; sinon null.',
  '- prixDes : true si le prix est « dès / ab / from » (plusieurs tailles ou variantes).',
  '- portSuisse : frais de livraison vers la Suisse seulement s\'ils sont écrits ; portGratuit : true si la livraison gratuite est écrite.',
  '- caracteristiques : au plus 12 caractéristiques techniques écrites, en commençant par ce qui décide d\'un achat (température, volume, matière, énergie, tension, fluide, refroidissement) puis volume, dimensions, puissance, poids, capacité…, la valeur avec son unité, recopiée du texte ; le nom court, écrit en français (« Largeur », « Volume », « Puissance ») même si la page est en allemand ou en anglais. Une longueur de câble est « Longueur du câble », jamais « Longueur ».',
  'Un champ absent du texte est null (ou une liste vide). N\'invente rien, ne convertis rien, ne calcule rien. Une liste « Conditionnements publiés par la page » en tête du texte dit les quantités et leurs prix.'
].join('\n');

export interface ReponseIA { nom?: string | null; prix?: number | null; devise?: string | null; taxe?: 'ht' | 'ttc' | null; prixDes?: boolean | null; quantite?: number | null; unite?: string | null; parUnite?: boolean | null; portSuisse?: number | null; portGratuit?: boolean | null; caracteristiques?: Array<{ nom: string; valeur: string }> }
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
export interface Gardee { nom?: string; prix?: number; devise?: string; taxe?: 'ht' | 'ttc'; prixDes?: true; /** PX : la quantité de ce prix, écrite dans le texte ; `parUnite` : le prix est celui d'UNE unité */ quantite?: { valeur: number; unite: UniteQuantite }; parUnite?: true; portSuisse?: number; portGratuit?: true; caracteristiques: Array<{ nom: string; valeur: string }> }
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
      const u = typeof r.unite === 'string' ? r.unite.toLowerCase() : '';
      if (typeof r.quantite === 'number' && r.quantite > 0 && UNITES.includes(u)) {
        const unite = u as UniteQuantite;
        const ecrite = new RegExp(`(?<![\\d.,])${String(r.quantite).replace('.', '[.,]')}\\s?${unite}(?![a-zà-ÿ0-9])`, 'i').test(texte);
        if (ecrite || (r.parUnite === true && r.quantite === 1)) { g.quantite = { valeur: r.quantite, unite }; if (r.parUnite === true) g.parUnite = true; } else retire.push('quantité');
      }
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

/**
 * Faut-il l'IA ? D450 (24.11, « ils doivent s'accorder ») : TOUJOURS, sur une page lue. Chaque lien est lu par les données structurées ET par l'IA sur la page
 * entière ; deux lectures qui s'accordent valent ; qui se contredisent : « douteux », dit (jamais une valeur gagnante en silence).
 */
export function iaUtile(p: PageLue): boolean {
  return p.statut === 'lue';
}

const petit = (a: number, b: number) => Math.abs(a - b) <= Math.max(0.011, Math.abs(b) * 0.0005);
/**
 * PX (D450) : la lecture de l'IA s'accorde-t-elle avec celle de la page ? Avec une quantité : le même couple (quantité, prix) existe sur la page (le conditionnement retenu, un des
 * conditionnements publiés ou le prix à l'unité) ; sans quantité : le même prix que le prix retenu (ou son TTC). `true` si l'IA ne lit pas de prix ou la page n'en a pas.
 */
export function accordPrix(p: PageLue, g: Gardee): boolean {
  if (p.prix === undefined || g.prix === undefined) return true;
  const base = (valeur: number, unite: UniteQuantite) => valeur * ({ g: 0.001, kg: 1, ml: 0.001, cl: 0.01, dl: 0.1, l: 1 } as const)[unite];
  /* La page ne dit aucune quantité (ni conditionnement, ni offres, ni prix à l'unité) : une quantité que l'IA lit (« 60 l », la capacité d'une cuve) n'a rien à contredire ; seul le prix se compare. */
  const pageSansQuantite = !p.conditionnement && !p.offres?.length && !p.prixUnite;
  /* « dès 7,29 » sans quantité (prix dégressif par palier) et l'IA lit 8 € pour 100 g, écrits dans la page : le « dès » est le plus bas de tous les prix, 8 € le contient ; ce n'est pas un désaccord. */
  if (precisePrixDes(p, g)) return true;
  if (g.quantite && !pageSansQuantite) {
    const couples: Array<{ valeur: number; unite: UniteQuantite; prix: number }> = [
      ...(p.conditionnement ? [{ ...p.conditionnement, prix: p.prix }] : []),
      ...(p.offres ?? []),
      ...(p.prixUnite ? [{ valeur: 1, unite: p.prixUnite.unite, prix: p.prixUnite.prix }, ...(p.prixUnite.paliers ?? []).map((x) => ({ valeur: x.des, unite: p.prixUnite!.unite, prix: x.prix * x.des }))] : [])
    ];
    const unitaire = g.parUnite === true ? g.quantite : undefined;
    if (couples.some((c) => uniteDeBase(c.unite) === uniteDeBase(g.quantite!.unite) && petit(base(c.valeur, c.unite), base(g.quantite!.valeur, g.quantite!.unite)) && petit(c.prix, g.prix!))) return true;
    /* un prix par unité de la page, lu pour une autre unité (0,1044 par g, la page dit au kg) : le même prix au kilo */
    if (unitaire && p.conditionnement && petit(prixParBase(g.prix!, unitaire.unite), p.prix)) return true;
    return false;
  }
  return petit(g.prix, p.prix) || (p.prixTTC !== undefined && petit(g.prix, p.prixTTC)) || memePrixAvecTaxe(g.prix, p.prix);
}

/**
 * R39, R41 : la page publie un prix « dès » SANS quantité (le plus bas de paliers dégressifs : 7,29 € dès 1 000 g) et l'IA lit, sur la page entière, un prix AVEC sa quantité
 * (8 € pour 100 g, le plus petit conditionnement) au moins égal à ce « dès », dans la même devise : l'IA précise le « dès », elle ne le contredit pas. La quantité est gardée
 * contre le texte (`garder`), le prix aussi.
 */
export function precisePrixDes(p: PageLue, g: Gardee): boolean {
  return p.prix !== undefined && p.prixDes === true && !p.conditionnement && !p.offres?.length && !p.prixUnite
    && g.prix !== undefined && g.quantite !== undefined && g.prix >= p.prix - 0.011 && (!g.devise || !p.devise || g.devise === p.devise);
}

/** Taux de TVA courants (CH 8,1 / 7,7 / 2,6 %, DE/AT 19 / 20 %, FR/IT 20 / 22 %, NL/BE 21 %). */
const TAUX_TVA = [0.081, 0.077, 0.026, 0.19, 0.2, 0.21, 0.22, 0.07, 0.08, 0.1];
/**
 * L'un des prix est l'autre avec une TVA courante, au centime près (3 249,99 HT et 3 867,49 TTC = ×1,19) : la page et l'IA lisent le même prix, l'une HT, l'autre TTC.
 * Une coïncidence au centime avec un taux courant est trop rare pour cacher un vrai désaccord.
 */
export function memePrixAvecTaxe(a: number, b: number): boolean {
  return TAUX_TVA.some((t) => Math.abs(a * (1 + t) - b) <= 0.011 || Math.abs(b * (1 + t) - a) <= 0.011);
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
  if (prix.prix !== undefined) { out.prix = prix.prix; if (prix.devise) out.devise = prix.devise; if (prix.taxe) out.taxe = prix.taxe; if (prix.prixDes) out.prixDes = true; if (prix.quantite) out.quantite = prix.quantite; if (prix.parUnite) out.parUnite = true; }
  const port = base.portSuisse !== undefined || base.portGratuit ? base : plus;
  if (port.portSuisse !== undefined) out.portSuisse = port.portSuisse;
  if (port.portGratuit) out.portGratuit = true;
  const noms = new Set(base.caracteristiques.map((c) => norm(c.nom)));
  /* C48-5 : l'essentiel d'abord avant le plafond ; une relecture qui trouve la température ne la perd pas derrière 12 lignes secondaires */
  out.caracteristiques = retenir([...base.caracteristiques, ...plus.caracteristiques.filter((c) => !noms.has(norm(c.nom)))], 12);
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
  const contredit = !accordPrix(p, gardee);
  const prixEnDoute = (p.prix === undefined && gardee.prix === undefined) || contredit || retire.includes('prix');
  /* Relecture automatique : un champ qui compte reste absent ou douteux après Flash-Lite. Une panne (budget, délai) ne s'escalade pas :
     elle se répéterait et coûterait. */
  if (!direct && !panne && (options.regleAvant ? prixEnDoute : prixEnDoute || champsManquants(p, gardee, texte).length > 0)) {
    const fort = await demander('fort');
    if (fort) {
      modeles.push('relu par une IA plus forte'); /* dit seulement si la relecture a eu lieu : une panne (budget, délai) ne se déguise pas en relecture */
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
  /* C48-5 : le plafond (24) se prend après le tri de l'essentiel : une température trouvée par l'IA ne tombe pas derrière 24 lignes de la page */
  if (nouvelles.length) {
    out.valeurs = retenir([...(out.valeurs ?? []), ...nouvelles], 24); ajouts.push(`${nouvelles.length} caract.`);
    /* R50 (C64-5, 24.11) : l'étape « Caractéristiques » dit ce qui a été lu, IA comprise : elle restait « absent [Compléter] » à côté d'une carte qui montrait Alpha, Arômes et la fiche 7 lignes */
    const total = out.valeurs.length;
    const k = etapes.findIndex((e) => e.nom === 'caract');
    const dite: EtapeLien = { nom: 'caract', statut: 'trouve', detail: `${total} caractéristique${total > 1 ? 's' : ''} : ${total - nouvelles.length ? `${total - nouvelles.length} de la page, ` : ''}${nouvelles.length} lue${nouvelles.length > 1 ? 's' : ''} par l'IA` };
    if (k >= 0) etapes[k] = dite; else etapes.push(dite);
  }
  const contreditFinal = !accordPrix(p, gardee);
  /* PX : la page n'avait pas de prix, l'IA en lit un avec sa quantité : le prix à l'unité devient le prix du kilo (R40), sinon le prix garde sa quantité (R39) */
  if (out.prix === gardee.prix && gardee.quantite && !out.conditionnement) {
    if (gardee.parUnite && gardee.quantite.valeur === 1) { out.prixUnite = { prix: gardee.prix!, unite: gardee.quantite.unite }; out.prix = prixParBase(gardee.prix!, gardee.quantite.unite); out.conditionnement = { valeur: 1, unite: uniteDeBase(gardee.quantite.unite) }; }
    else out.conditionnement = { ...gardee.quantite };
    delete out.prixDes;
  }
  /* R41 : le « dès » sans quantité de la page devient le prix du plus petit conditionnement que l'IA lit avec sa quantité (écrite dans la page) ; le « dès » plus bas est dit dans l'étape. */
  if (precisePrixDes(p, gardee) && gardee.prix !== undefined && gardee.quantite) {
    const des = p.prix;
    out.prix = gardee.prix; delete out.prixDes; delete out.prixTTC;
    if (gardee.parUnite && gardee.quantite.valeur === 1) { out.prixUnite = { prix: gardee.prix, unite: gardee.quantite.unite }; out.prix = prixParBase(gardee.prix, gardee.quantite.unite); out.conditionnement = { valeur: 1, unite: uniteDeBase(gardee.quantite.unite) }; }
    else out.conditionnement = { ...gardee.quantite };
    ajouts.push(`prix du plus petit conditionnement (${gardee.quantite.valeur} ${gardee.quantite.unite}) ; la page dit « dès ${des} »`);
  }
  etapes.push({ nom: 'ia', statut: retire.length || contreditFinal ? 'douteux' : ajouts.length || gardee.prix !== undefined ? 'trouve' : 'absent', detail: [modeles.filter(Boolean).join(' puis '), ajouts.length ? `ajouté : ${ajouts.join(', ')}` : gardee.prix !== undefined && !contreditFinal ? 'prix confirmé par la lecture de la page entière' : 'rien de plus à lire', retire.length ? `retiré (absent du texte) : ${retire.join(', ')}` : '', contreditFinal ? `l'IA lit ${gardee.prix} ${gardee.devise ?? ''}, la page publie ${p.prix} ${p.devise ?? ''}` : ''].filter(Boolean).join(' ; ') });
  if (contreditFinal) {
    const i = etapes.findIndex((e) => e.nom === 'controle');
    const d = `prix : la lecture de la page entière dit ${gardee.prix}${gardee.quantite ? ` pour ${gardee.quantite.valeur} ${gardee.quantite.unite}` : ' (sans quantité)'}, les données ${p.prix}${p.conditionnement ? ` pour ${p.conditionnement.valeur} ${p.conditionnement.unite}` : ''}`;
    if (i >= 0) etapes[i] = { nom: 'controle', statut: 'douteux', detail: [etapes[i].statut === 'douteux' ? etapes[i].detail : '', d].filter(Boolean).join(' ; ') };
  }
  out.etapes = etapes;
  if (out.photos?.length) out.photo = out.photos[0];
  return out;
}
