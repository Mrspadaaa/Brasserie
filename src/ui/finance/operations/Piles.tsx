import React, { useLayoutEffect, useRef, useState } from 'react';
import type { PeriodeSynthese } from '../../../domain/finance/periodeSynthese';
import { amountOnly } from '../financeFormat';
import { GROUPES, type GroupeId } from './groupes';

/**
 * Les piles du mois (v6b) : une colonne par catégorie, la partie payée pleine, la partie à payer hachurée.
 * Tous les nombres viennent de `periodeSynthese` (voie us) : cet écran ne recalcule ni « dépensé » ni « matériel à part ».
 * Les hauteurs sont une règle de trois sur les centimes (affichage seulement), la valeur écrite est exacte.
 * Limite : le domaine ne donne pas le reste à payer du matériel : sa pile est pleine.
 */
interface Colonne { cle: string; libelle: string; cents: number; hachureCents: number; couleur: string; signe?: '+' | '−' }

const COURT: Record<string, string> = { chargesFixes: 'Fixes', divers: 'Autres', brassage: 'Brassage', nettoyage: 'Nettoyage', recettes: 'Ventes', materiel: 'Matériel', renovation: 'Travaux', apports: 'Apports' };
const ORDRE_CHARGES = ['chargesFixes', 'brassage', 'nettoyage', 'divers'];
const couleurDe = (categorie: string): string => (GROUPES[categorie as GroupeId] ?? GROUPES.divers).liseré;

/**
 * BK3-1 (k3, 20.11) : à 390, sept piles de 46 px ne portent pas sept montants de 9 signes (« +8 290,00 » : 65 px) ; l'étiquette sortait du cadre
 * et traversait le pointillé. Quand un montant écrit en entier ne tient pas dans la colonne, TOUTES les étiquettes passent au franc (« +8 290 »,
 * « 307 »), jamais seulement l'une : le même graphe garde une seule écriture. Les centimes exacts restent dans le nom accessible de la pile, la
 * légende sous le graphe et la liste. Un montant ne se tronque jamais : il s'arrondit au franc, la valeur du dessous reste celle du calcul.
 */
const PX_PAR_SIGNE = 7.2; // IBM Plex Mono, 12 px : 0,6 em par signe
const MARGE_COLONNE = 4; // le padding de la pile (2 px de chaque côté)
const formatFranc = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
/** Vrai si chaque texte écrit en entier tient dans une colonne de `largeur` px ; une largeur inconnue (0) tient : l'inconnu n'est pas un manque de place. */
export const libellesTiennent = (largeur: number, textes: readonly string[]): boolean => largeur <= 0 || Math.max(0, ...textes.map(x => x.length)) * PX_PAR_SIGNE <= largeur - MARGE_COLONNE;
/** Observe la largeur d'une colonne de pile : vrai quand les montants écrits en entier n'y tiennent plus (voir `libellesTiennent`). */
function useCourt(ref: React.RefObject<HTMLElement | null>, textes: readonly string[]): boolean {
  const [court, setCourt] = useState(false);
  const cle = textes.join('|');
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mesurer = () => setCourt(!libellesTiennent(el.querySelector<HTMLElement>('.ops-pile')?.clientWidth ?? 0, cle ? cle.split('|') : []));
    mesurer();
    if (typeof ResizeObserver === 'undefined') return;
    const o = new ResizeObserver(mesurer);
    o.observe(el);
    return () => o.disconnect();
  }, [ref, cle]);
  return court;
}
/** Le montant au franc (« +8 290 ») : la forme compacte d'une étiquette. */
const montantCourt = (c: { cents: number; signe?: string }): string => `${c.signe ?? ''}${formatFranc.format(Math.round(c.cents / 100))}`;
const montantPlein = (c: { cents: number; signe?: string }): string => `${c.signe ?? ''}${amountOnly(c.cents)}`;


/**
 * E38-2 : « Ventes » ne porte que les ventes ; une autre entrée (ni vente ni apport) a sa propre pile « Entrées », de la teinte des ventes. Le total entré reste leur somme.
 * Cette pile ne filtre pas la liste (le filtre est par catégorie, et l'autre entrée est rangée en Ventes) : elle se lit, sans bouton.
 */
export function colonnesDe(p: PeriodeSynthese): { ventes: Colonne | null; autres: Colonne | null; charges: Colonne[]; materiel: Colonne | null } {
  const centsAutres = Math.min(p.autresEntrees.cents, p.entreCents), centsVentes = p.entreCents - centsAutres;
  const aEncaisserAutres = Math.min(p.autresEntrees.aEncaisserCents, centsAutres), aEncaisserVentes = Math.max(0, Math.min(p.entreAEncaisserCents - aEncaisserAutres, centsVentes));
  const ventes = centsVentes > 0 ? { cle: 'recettes', libelle: 'Ventes', cents: centsVentes, hachureCents: aEncaisserVentes, couleur: couleurDe('recettes'), signe: '+' as const } : null;
  const autres = centsAutres > 0 ? { cle: 'autresEntrees', libelle: 'Entrées', cents: centsAutres, hachureCents: aEncaisserAutres, couleur: couleurDe('autresEntrees'), signe: '+' as const } : null;
  const rang = (c: string) => { const i = ORDRE_CHARGES.indexOf(c); return i < 0 ? ORDRE_CHARGES.length : i; };
  const charges = [...p.postes].sort((a, b) => rang(a.categorie) - rang(b.categorie) || b.cents - a.cents).map(poste => ({
    cle: poste.categorie, libelle: COURT[poste.categorie] ?? poste.categorie, cents: poste.cents, hachureCents: poste.aPayerCents, couleur: couleurDe(poste.categorie),
  }));
  const materiel = p.materielCents > 0 ? { cle: 'materiel', libelle: 'Matériel', cents: p.materielCents, hachureCents: 0, couleur: couleurDe('part') } : null;
  return { ventes, autres, charges, materiel };
}

/**
 * FIN-BARRES-MORTES (19.11, « SI je click sur les barre ici, ça n'a aucun effet... ») : avec `onChoisir`, la pile est un bouton qui filtre la liste
 * sur sa catégorie ; `choisie` la marque (aria-pressed), un second toucher rend tout. Sans `onChoisir`, la pile reste un dessin.
 */
function Pile({ c, max, choisie, onChoisir, court = false }: { c: Colonne; max: number; choisie?: boolean; onChoisir?: (cle: string) => void; court?: boolean }) {
  const ratio = max > 0 ? Math.max(c.cents / max, 0.04) : 0;
  const plein = Math.max(c.cents - c.hachureCents, 0);
  const corps = <>
    <b className="ops-m" data-signe={c.signe} {...(court ? { title: montantPlein(c) } : {})}>{court ? montantCourt(c) : <>{c.signe ?? ''}{amountOnly(c.cents)}</>}</b>
    <span className="ops-st" style={{ height: `calc(var(--ops-haut) * ${ratio.toFixed(4)})` }}>
      {c.hachureCents > 0 && <i className="ops-hach" style={{ flex: c.hachureCents }}/>}
      {plein > 0 && <i style={{ flex: plein, background: c.couleur }}/>}
    </span>
    <span className="ops-nom-pile">{c.libelle}</span>
  </>;
  if (!onChoisir) return <div className="ops-pile" data-pile={c.cle}>{corps}</div>;
  return <button type="button" className="ops-pile" data-pile={c.cle} aria-pressed={!!choisie}
    aria-label={`${c.libelle} ${c.signe ?? ''}${amountOnly(c.cents)} : ${choisie ? 'montrer toutes les opérations' : 'ne montrer que cette catégorie'}`}
    onClick={() => onChoisir(c.cle)}>{corps}</button>;
}

/** `nom` : ce que les piles couvrent (« le mois », « la période », « tout l'historique ») ; il ne sert qu'aux noms accessibles. */
export function Piles({ periode, nom = 'le mois', apports = null, frise = null, videTexte, choisie = null, onChoisir }: { periode: PeriodeSynthese; nom?: string; apports?: number | null; frise?: React.ReactNode; videTexte?: string;
  /** La pile dont la catégorie filtre la liste (`cle` de colonne), ou null. */
  choisie?: string | null;
  /** Toucher une pile : le parent pose ou retire le filtre de sa catégorie. */
  onChoisir?: (cle: string) => void }) {
  const refPiles = useRef<HTMLDivElement>(null);
  const { ventes, autres, charges, materiel } = colonnesDe(periode);
  const apport: Colonne | null = apports ? { cle: 'apports', libelle: 'Apports', cents: Math.abs(apports), hachureCents: 0, couleur: couleurDe('apports'), signe: apports > 0 ? '+' : '−' } : null;
  const presentes = [ventes, autres, ...charges, materiel, apport].filter((c): c is Colonne => !!c);
  const court = useCourt(refPiles, presentes.map(montantPlein));
  // « Pas de graph ? » (10.11) : une période sans vente ni dépense garde sa bande et le dit.
  if (!presentes.length) return <><p className="ops-vide" data-piles="">{videTexte ?? `Ni vente ni dépense sur ${nom}.`}</p>{frise}</>;
  /* FIN-DEUX-PERIODES (19.11) : filtré sur une catégorie absente de la période (« Autres frais »), les barres le disent : la sienne à 0,00, marquée,
     les autres effacées ; jamais la barre Nettoyage pleine au-dessus d'une liste vide. La période a des opérations : ce zéro est connu. */
  const fantome: Colonne | null = choisie && !presentes.some(c => c.cle === choisie) ? { cle: choisie, libelle: COURT[choisie] ?? choisie, cents: 0, hachureCents: 0, couleur: couleurDe(choisie) } : null;
  if (fantome) charges.push(fantome);
  const toutes = fantome ? [...presentes, fantome] : presentes;
  const elue = choisie ? toutes.find(c => c.cle === choisie) ?? null : null;
  const max = Math.max(1, ...toutes.map(c => c.cents));
  /* La légende suit la barre choisie (payé · à payer · total de sa catégorie) ; sans choix, la période entière. */
  const vente = elue?.cle === 'recettes';
  const leg = elue ? { paye: elue.cents - elue.hachureCents, aPayer: elue.hachureCents, total: elue.cents } : { paye: periode.payeCents, aPayer: periode.aPayerCents, total: periode.depenseCents };
  const sep = (cle: string) => <span key={cle} className="ops-sep" aria-hidden="true"/>;
  const nuancier = `linear-gradient(90deg, ${charges.map((c, i) => `${c.couleur} ${(i / Math.max(charges.length, 1)) * 100}% ${((i + 1) / Math.max(charges.length, 1)) * 100}%`).join(', ') || 'transparent 0 100%'})`;
  return <>
    <div className="ops-piles" ref={refPiles} data-choix={elue ? '' : undefined} role="group" aria-label={`${nom[0].toLocaleUpperCase('fr')}${nom.slice(1)} par catégorie`}>
      {ventes && <Pile c={ventes} max={max} court={court} choisie={choisie === ventes.cle} onChoisir={onChoisir}/>}
      {autres && <Pile c={autres} max={max} court={court}/>}
      {(ventes || autres) && (charges.length > 0 || materiel) && sep('s1')}
      {charges.map(c => <Pile key={c.cle} c={c} max={max} court={court} choisie={choisie === c.cle} onChoisir={onChoisir}/>)}
      {materiel && charges.length > 0 && sep('s2')}
      {materiel && <Pile c={materiel} max={max} court={court} choisie={choisie === materiel.cle} onChoisir={onChoisir}/>}
      {apport && (ventes || autres || charges.length > 0 || materiel) && sep('s3')}
      {apport && <Pile c={apport} max={max} court={court} choisie={choisie === apport.cle} onChoisir={onChoisir}/>}
    </div>
    {frise}
    <p className="ops-legende" aria-label={`Payé, à payer et dépensé ${nom === 'le mois' ? 'du mois' : nom.replace(/^la /, 'de la ').replace(/^tout /, 'sur tout ')}`}>
      <span><i className="ops-sw" style={{ background: elue ? elue.couleur : nuancier }}/>{vente ? 'encaissé' : 'payé'} <b className="ops-m">{amountOnly(leg.paye)}</b></span>
      <span><i className="ops-sw ops-hach"/>{vente ? 'à encaisser' : 'à payer'} <b className="ops-m">{amountOnly(leg.aPayer)}</b></span>
      <span>{vente ? 'vendu' : 'dépensé'} <b className="ops-m">{amountOnly(leg.total)}</b></span>
    </p>
  </>;
}
