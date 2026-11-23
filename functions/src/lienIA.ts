import { load } from 'cheerio/slim';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import type { PageLue } from './carnetIA.js';
import { couper, montantsDe, positionsMontant } from './lienProduit.js';

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
  $('script, style, noscript, template, svg, iframe, nav, header, footer, form, aside, [role="navigation"], [id*="cookie" i], [class*="cookie" i]').remove();
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
  '- caracteristiques : au plus 12 caractéristiques techniques écrites (volume, dimensions, puissance, poids, matière, capacité…), nom court et valeur avec son unité, recopiés du texte.',
  'Un champ absent du texte est null (ou une liste vide). N\'invente rien, ne convertis rien, ne calcule rien.'
].join('\n');

export interface ReponseIA { nom?: string | null; prix?: number | null; devise?: string | null; taxe?: 'ht' | 'ttc' | null; prixDes?: boolean | null; portSuisse?: number | null; portGratuit?: boolean | null; caracteristiques?: Array<{ nom: string; valeur: string }> }
/** L'appel au modèle, injecté : `aiTask` le lie à Gemini (budget, journal) ; les tests et le banc le simulent. */
export type AppelIA = (modele: 'lite' | 'fort', consigne: string, texte: string) => Promise<ReponseIA | null>;

const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[\s  ]+/g, ' ').trim();
const nombres = (t: string) => (norm(t).replace(/(\d)['’.](?=\d{3}\b)/g, '$1').match(/\d+(?:[.,]\d+)?/g) ?? []).map((x) => x.replace(',', '.').replace(/\.0+$/, ''));

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
  if (typeof r.portSuisse === 'number' && r.portSuisse >= 0) { if (positionsMontant(texte, r.portSuisse).length) g.portSuisse = r.portSuisse; else retire.push('port'); }
  if (r.portGratuit === true && /gratuit|kostenlos|versandkostenfrei|gratis|free/i.test(texte)) g.portGratuit = true;
  for (const c of (r.caracteristiques ?? []).slice(0, 12)) {
    if (!c?.nom || !c?.valeur) continue;
    const ns = nombres(c.valeur);
    const ecrit = ns.length ? ns.every((n) => nb.has(n)) : nt.includes(norm(c.valeur));
    if (ecrit) g.caracteristiques.push({ nom: couper(c.nom, 60), valeur: couper(c.valeur, 100) }); else retire.push(`caract ${c.nom}`);
  }
  return { gardee: g, retire };
}

/** Faut-il l'IA ? Seulement sur une page lue, quand le prix manque ou est douteux, ou que les caractéristiques manquent. */
export function iaUtile(p: PageLue): boolean {
  if (p.statut !== 'lue') return false;
  const prixDouteux = p.etapes?.some((e) => e.nom === 'prix' && e.statut === 'douteux');
  return p.prix === undefined || !!prixDouteux || (p.valeurs?.length ?? 0) < 2;
}

/**
 * Complète la page lue par l'IA : Flash-Lite d'abord ; escalade vers le modèle fort (Hydrogen) seulement si le prix manque encore ou
 * si Flash-Lite contredit le prix publié. Les données structurées restent prioritaires ; chaque ajout est gardé contre le texte.
 */
export async function completerParIA(p: PageLue, html: string, appel: AppelIA): Promise<PageLue> {
  const texte = markdownProduit(html, p.nom);
  if (texte.length < 200) return p;
  const etapes = [...(p.etapes ?? [])];
  let r = await appel('lite', LIEN_IA_CONSIGNE, texte).catch(() => null);
  let { gardee, retire } = r ? garder(r, texte) : { gardee: { caracteristiques: [] } as Gardee, retire: ['réponse'] };
  const contredit = p.prix !== undefined && gardee.prix !== undefined && Math.abs(gardee.prix - p.prix) > 0.011 && gardee.prix !== p.prixTTC;
  if ((p.prix === undefined && gardee.prix === undefined) || contredit || retire.includes('prix')) {
    const fort = await appel('fort', LIEN_IA_CONSIGNE, texte).catch(() => null);
    if (fort) { const g2 = garder(fort, texte); if (g2.gardee.prix !== undefined || !r) { r = fort; gardee = { ...g2.gardee, caracteristiques: g2.gardee.caracteristiques.length ? g2.gardee.caracteristiques : gardee.caracteristiques }; retire = g2.retire; } }
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
  etapes.push({ nom: 'ia', statut: retire.length || contreditFinal ? 'douteux' : ajouts.length ? 'trouve' : 'absent', detail: [ajouts.length ? `ajouté : ${ajouts.join(', ')}` : 'rien de plus', retire.length ? `retiré (absent du texte) : ${retire.join(', ')}` : '', contreditFinal ? `l'IA lit ${gardee.prix} ${gardee.devise ?? ''}, la page publie ${p.prix} ${p.devise ?? ''}` : ''].filter(Boolean).join(' ; ') });
  if (contreditFinal) {
    const i = etapes.findIndex((e) => e.nom === 'controle');
    const d = `prix : l'IA lit ${gardee.prix}, les données ${p.prix}`;
    if (i >= 0) etapes[i] = { nom: 'controle', statut: 'douteux', detail: [etapes[i].statut === 'douteux' ? etapes[i].detail : '', d].filter(Boolean).join(' ; ') };
  }
  out.etapes = etapes;
  if (out.photos?.length) out.photo = out.photos[0];
  return out;
}
