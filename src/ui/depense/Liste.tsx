// La liste de p3c-3 : bandes teintées à en-tête collant (sous-total, quantités en gras alignées sur la colonne des lignes), ordre du papier, filtre, pied de liste.
// Présentation seulement : les `LigneP3c` arrivent construits par `ExpenseSheet` (qui tient le plateau et les gardes) ; les ids retrouvent leur ligne.
import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Bande, ChoixGroupes, QteGroupe, SousGroupe } from './groupes';
import { FILET_FAMILLE, fr2, groupeOuvert, pliable, texteQte } from './groupes';
import { POINT_GROUPE } from './Recap';
import './p3c.css';

const FOND: Record<string, string> = { malt: 'bg-ebc-gold/20', houblon: 'bg-hop/20', levure: 'bg-area-finances/20', autres: 'bg-cave-800' };

export interface FiltreListe { mot: string; ids: readonly string[] }

/**
 * M1 (critique r4) : un montant inconnu s'écrit « 410,50 + ? », plus large que la colonne de 54 px des rangées ; la colonne des quantités, qui suit le montant, glissait à
 * gauche (23 px à l'en-tête de bande, 15 px sur une ligne de sous-famille). Le montant réserve donc la largeur de son texte (en `ch` : le texte est en chasse fixe) et la
 * quantité rend d'autant sa marge : elle reste sur la colonne des rangées. Sans inconnu : rien (classes d'aujourd'hui).
 */
export function reserveInconnu(montant: string, incomplet: boolean): { qte?: React.CSSProperties; montant?: React.CSSProperties } {
  if (!incomplet) return {};
  const ch = montant.length + 4; // « + ? » : espace, plus, espace, point d'interrogation
  // `ch` se lit dans la police de l'élément : le montant est en 14 px (text-sm), la quantité en 12 px (text-xs) : la même largeur y vaut 14/12 de `ch`.
  const chQte = Math.round((ch * 14 / 12) * 1000) / 1000;
  return { montant: { minWidth: `max(54px, ${ch}ch)` }, qte: { marginRight: `calc(57px - max(0px, ${chQte}ch - 54px))` } };
}

/** D311, son choix E : le segment « Plié | Déplié » (maquette `choix-plier/e-*`), 28 px, dans l'en-tête de la feuille ; l'état allumé vient de l'état réel des groupes (`etatSegment`). Un raccourci : il ne fige rien. */
export function SegmentPlier(p: { plie: boolean; deplie: boolean; onPlier: () => void; onDeplier: () => void }) {
  return <div role="group" aria-label="Sous-groupes" data-dp-plier className="inline-flex shrink-0 overflow-hidden rounded-control border border-cave-600">
    {([['Plié', 'plie', p.plie, p.onPlier], ['Déplié', 'deplie', p.deplie, p.onDeplier]] as const).map(([mot, cle, on, agir]) =>
      <button key={cle} type="button" data-dp-plier-bouton={cle} aria-pressed={on} onClick={agir} className={`dp-p3c-seg min-h-7 px-2 text-sm ${on ? 'bg-ebc-straw text-cave-950' : 'text-cave-200'}`}>{mot}</button>)}
  </div>;
}

/** D307 : la quantité d'un sous-groupe, dans la colonne de la quantité de bande ; mêmes marques de niveau que l'en-tête (jaune pointillé : unité déduite, rouge : à remplir). */
function QteSousGroupe({ qte }: { qte: readonly QteGroupe[] }) {
  return <>{qte.map((e, i) => <React.Fragment key={i}>{i ? ' + ' : ''}{e.inconnue
    ? <i data-dp-niveau="inconnu" className="rounded-control border border-dashed border-alert bg-cave-950 px-1 font-normal not-italic text-alert" title="Unité à remplir sur une ligne">{`${e.n ? `${String(e.n).replace('.', ',')} ` : ''}?`}</i>
    : e.niveau === 'repris' ? <i data-dp-niveau="repris" className="not-italic text-attention underline decoration-dotted decoration-attention underline-offset-2" title="Unité déduite sur une ligne : à contrôler">{texteQte([e])}</i>
    : texteQte([e])}</React.Fragment>)}</>;
}

/**
 * D307, son choix D : sous l'en-tête de bande, une ligne par sous-famille (chevron, nom, nombre, quantité, montant) ; un toucher ouvre ou ferme ses rangées, qui
 * restent celles d'aujourd'hui. Un sous-groupe d'une ligne (ou sans sous-famille) montre sa rangée seule. Les rangées d'un groupe replié restent dans le DOM, cachées :
 * le plateau ouvert, la ligne visée par « y aller » ou par une erreur se retrouvent par leur id (`ExpenseSheet` ouvre alors le groupe).
 */
function CorpsBande({ b, p }: { b: Bande; p: { lignes: ReadonlyMap<string, React.ReactNode>; visibles: ReadonlySet<string> | null; choixGroupes?: ChoixGroupes; forces?: ReadonlySet<string>; onBasculeGroupe?: (bande: string, sg: SousGroupe, ouvrir: boolean) => void } }) {
  const rangees = (ids: readonly string[]) => ids.map(id => <React.Fragment key={id}>{p.lignes.get(id)}</React.Fragment>);
  if (!b.sousGroupes) return <div>{rangees(b.ids)}</div>;
  const choix: ChoixGroupes = p.choixGroupes ?? new Map();
  return <div>{b.sousGroupes.map((sg, i) => {
    if (!pliable(sg)) return <React.Fragment key={`${i}-${sg.nom}`}>{rangees(sg.ids)}</React.Fragment>;
    const ouvert = groupeOuvert(b.cle, sg, choix, p.forces), id = `dp-sg-${b.cle}-${i}`;
    const masque = p.visibles ? !sg.ids.some(x => p.visibles!.has(x)) : false;
    return <div key={`${i}-${sg.nom}`} data-dp-sg={sg.nom} data-dp-sg-bande={b.cle} hidden={masque}>
      <button type="button" id={id} data-dp-sg-ligne aria-expanded={ouvert} aria-controls={`${id}-corps`} onClick={() => p.onBasculeGroupe?.(b.cle, sg, !ouvert)}
        className={`dp-p3c-sg dp-p3c-sg-c-${b.cle} ${FILET_FAMILLE[b.cle]} flex min-h-7 w-full items-center gap-1.5 border-b border-cave-800 px-2.5 text-left text-sm`}>
        <span aria-hidden className="inline-flex w-[18px] shrink-0 justify-center text-cave-400">{ouvert ? <ChevronDown size={14} strokeWidth={2.2}/> : <ChevronRight size={14} strokeWidth={2.2}/>}</span>
        <span className={`min-w-0 truncate ${ouvert ? 'font-semibold' : ''} text-cave-50`}>{sg.nom}</span>
        <span data-dp-sg-compte className="rounded-control border border-cave-600 bg-cave-950 px-1.5 font-mono text-xs leading-[18px] text-cave-200">{sg.ids.length}</span>
        <span data-dp-sg-qte style={reserveInconnu(fr2(sg.cents), sg.incomplet).qte} className="ml-auto mr-[57px] whitespace-nowrap text-right font-mono text-xs font-semibold text-cave-200"><QteSousGroupe qte={sg.qte}/></span>
        <span data-dp-sg-montant style={reserveInconnu(fr2(sg.cents), sg.incomplet).montant} {...(sg.incomplet ? { 'data-dp-niveau': 'inconnu' } : {})} className={`min-w-[54px] shrink-0 whitespace-nowrap text-right font-mono text-sm ${sg.incomplet ? 'text-alert' : 'text-cave-50'}`}>{fr2(sg.cents)}{sg.incomplet ? ' + ?' : null}</span>
      </button>
      <div id={`${id}-corps`} data-dp-sg-corps={`${b.cle}/${sg.nom}`} hidden={!ouvert}>{rangees(sg.ids)}</div>
    </div>;
  })}</div>;
}

export function Liste(p: {
  ordre: 'cat' | 'papier'; bandes: Bande[]; papier: { ids: string[]; cents: number; incomplet: boolean; /** Le port, hors de l'ordre du papier : « 80,46 + port 12,00 » (VERDICT-f3, détail 7). */ port?: number } | null; lignes: ReadonlyMap<string, React.ReactNode>;
  filtre: FiltreListe | null; visibles: ReadonlySet<string> | null; nAffichees: number; onSansFiltre: () => void; rattacherTous: { n: number; onTous: () => void } | null;
  pied: { ajouterOff: boolean; ajouterTitre?: string; regrouper: boolean; detail: { lignes: string; total: string; ecart: boolean } | null };
  onAjouter: () => void; onRegrouper: () => void; children?: React.ReactNode;
  /** D307 : le choix du brasseur sur chaque sous-groupe, les rangées qu'on doit voir (elles ouvrent leur groupe), le geste d'un toucher sur la ligne de sous-famille. */
  choixGroupes?: ChoixGroupes; forces?: ReadonlySet<string>; onBasculeGroupe?: (bande: string, sg: SousGroupe, ouvrir: boolean) => void;
  /** D307 : « tout plier, déplier » (toutes les bandes, ou une seule) ; sa forme visible est le choix de la voie r3-plier : aucun contrôle n'est posé ici. */
  onToutPlier?: (bande?: string) => void; onToutDeplier?: (bande?: string) => void;
}) {
  const nMasquees = p.filtre ? Math.max(0, p.nAffichees - p.filtre.ids.length) : 0;
  const vide = p.nAffichees === 0;
  return <section aria-label="Lignes de la facture" className="pb-2">
    {p.filtre ? <div data-dp="filtre" className="dp-p3c-filtre flex h-9 items-center gap-1.5 bg-ebc-straw px-2 text-sm font-semibold text-cave-950">
      <span>{p.filtre.ids.length} {p.filtre.mot} · {nMasquees} masquée{nMasquees > 1 ? 's' : ''}</span>
      <button type="button" onClick={p.onSansFiltre} className="ml-auto min-h-7 rounded-control bg-cave-950 px-2.5 text-sm font-semibold text-cave-50">✕ Toutes les lignes</button></div> : null}
    <div data-dp="liste">
      {vide ? <div data-dp="aucune-ligne" className="m-2 flex min-h-20 items-center justify-center rounded-panel border border-dashed border-cave-600 text-sm text-cave-400">Aucune ligne</div> : null}
      {p.ordre === 'cat' ? p.bandes.map(b => <div key={b.cle} data-dp-bande={b.cle} hidden={p.visibles ? !b.ids.some(id => p.visibles!.has(id)) : false}>
        <div data-dp-bande-entete className={`dp-p3c-bande-entete flex items-center gap-1.5 px-2.5 text-sm dp-p3c-t-${b.cle}`}>
          <i aria-hidden className={`size-2.5 shrink-0 rounded-full ${POINT_GROUPE[b.cle]}`}/>
          <strong className="font-semibold text-cave-50">{b.nom}</strong>
          <span className="rounded-control border border-cave-600 bg-cave-950 px-1.5 font-mono text-xs leading-[18px] text-cave-200">{b.ids.length}{b.moutureIds.length ? ` +${b.moutureIds.length} ↳` : ''}</span>
          {b.cle === 'malt' && p.rattacherTous ? <button type="button" data-dp-mouture-tous onClick={p.rattacherTous.onTous} className="min-h-6 whitespace-nowrap rounded-control border border-ebc-straw bg-ebc-straw px-1.5 text-xs font-semibold text-cave-950">Rattacher les {p.rattacherTous.n}</button> : null}
          {b.eqb ? <span className="ml-auto whitespace-nowrap rounded-control bg-cave-950 px-1.5 text-xs leading-[18px] text-cave-200">{b.eqb}</span> : null}
          <span data-dp-sous-qte style={reserveInconnu(fr2(b.cents), b.incomplet).qte} className={`${b.eqb ? '' : 'ml-auto'} mr-[57px] whitespace-nowrap text-right font-mono text-xs font-semibold text-cave-200`}>{b.qte.map((e, i) => <React.Fragment key={i}>{i ? ' + ' : ''}{e.inconnue
            ? <i data-dp-niveau="inconnu" className="rounded-control border border-dashed border-alert bg-cave-950 px-1 font-normal not-italic text-alert" title="Unité à remplir sur une ligne">{`${e.n ? `${String(e.n).replace('.', ',')} ` : ''}?`}</i>
            : e.niveau === 'repris' ? <i data-dp-niveau="repris" className="not-italic text-attention underline decoration-dotted decoration-attention underline-offset-2" title="Unité déduite sur une ligne : à contrôler">{texteQte([e])}</i>
            : texteQte([e])}</React.Fragment>)}</span>
          <span data-dp-sous-montant style={reserveInconnu(fr2(b.cents), b.incomplet).montant} {...(b.incomplet ? { 'data-dp-niveau': 'inconnu' } : {})} className={`min-w-[54px] shrink-0 whitespace-nowrap text-right font-mono text-sm font-semibold ${b.incomplet ? 'text-alert' : 'text-cave-50'}`}>{fr2(b.cents)}{b.incomplet ? ' + ?' : null}</span>
        </div>
        <CorpsBande b={b} p={p}/>
      </div>) : p.papier ? <div data-dp-bande="papier">
        <div data-dp-bande-entete className="dp-p3c-bande-entete flex items-center gap-1.5 dp-p3c-t-papier px-2.5 text-sm">
          <strong className="font-semibold text-cave-50">Ordre du papier</strong>
          <span className="rounded-control border border-cave-600 bg-cave-950 px-1.5 font-mono text-xs leading-[18px] text-cave-200">{p.papier.ids.length}</span>
          <span data-dp-sous-montant {...(p.papier.incomplet ? { 'data-dp-niveau': 'inconnu' } : {})} className={`ml-auto min-w-[54px] shrink-0 whitespace-nowrap text-right font-mono text-sm font-semibold ${p.papier.incomplet ? 'text-alert' : 'text-cave-50'}`}>{fr2(p.papier.cents)}{p.papier.incomplet ? ' + ?' : null}{p.papier.port ? <span data-dp-papier-port className="font-normal text-cave-400"> + port {fr2(p.papier.port)}</span> : null}</span>
        </div>
        <div>{p.papier.ids.map(id => <React.Fragment key={id}>{p.lignes.get(id)}</React.Fragment>)}</div>
      </div> : null}
    </div>
    {p.children}
    <div data-dp="fin" className="flex flex-wrap items-center gap-1.5 px-2.5 py-2">
      <button type="button" disabled={p.pied.ajouterOff} title={p.pied.ajouterTitre} onClick={p.onAjouter} className="min-h-7 rounded-control border border-dashed border-cave-600 px-2.5 text-sm text-cave-200 disabled:opacity-40">+ Ajouter une ligne</button>
      {p.pied.regrouper ? <button type="button" onClick={p.onRegrouper} className="min-h-7 rounded-control border border-dashed border-cave-600 px-2.5 text-sm text-cave-200">Regrouper en une dépense</button> : null}
      {p.pied.detail ? <span className={`ml-auto text-xs ${p.pied.detail.ecart ? 'text-attention' : 'text-cave-400'}`}>Détail <b className="font-mono font-medium">{p.pied.detail.lignes} / {p.pied.detail.total}</b></span> : null}
    </div>
  </section>;
}
