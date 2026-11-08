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
/** D377 : le total d'une bande dont un montant de ligne est rouge : le même tireté rouge que la rangée. */
const MONTANT_DOUTE = 'rounded-control border border-dashed border-alert px-1 text-cave-50';
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
    /* D378 : la bande entière (sans sous-familles) : pas de ligne de sous-groupe, son en-tête porte le chevron (`EnteteBande`). */
    if (sg.bande) return <div key={`${i}-${sg.nom}`} id={`dp-bande-${b.cle}-corps`} data-dp-sg={sg.nom} data-dp-sg-bande={b.cle} data-dp-sg-corps={`${b.cle}/${sg.nom}`} hidden={!ouvert}>{rangees(sg.ids)}</div>;
    const masque = p.visibles ? !sg.ids.some(x => p.visibles!.has(x)) : false;
    return <div key={`${i}-${sg.nom}`} data-dp-sg={sg.nom} data-dp-sg-bande={b.cle} hidden={masque}>
      <button type="button" id={id} data-dp-sg-ligne aria-expanded={ouvert} aria-controls={`${id}-corps`} onClick={() => p.onBasculeGroupe?.(b.cle, sg, !ouvert)}
        className={`dp-p3c-sg dp-p3c-sg-c-${b.cle} ${FILET_FAMILLE[b.cle]} flex min-h-7 w-full items-center gap-1.5 border-b border-cave-800 px-2.5 text-left text-sm`}>
        <span aria-hidden className="inline-flex w-[18px] shrink-0 justify-center text-cave-400">{ouvert ? <ChevronDown size={14} strokeWidth={2.2}/> : <ChevronRight size={14} strokeWidth={2.2}/>}</span>
        <span className={`min-w-0 truncate ${ouvert ? 'font-semibold' : ''} text-cave-50`}>{sg.nom}</span>
        <span data-dp-sg-compte className="rounded-control border border-cave-600 bg-cave-950 px-1.5 font-mono text-xs leading-[18px] text-cave-200">{p.visibles ? `${sg.ids.filter(x => p.visibles!.has(x)).length}/${sg.ids.length}` : sg.ids.length}</span>
        <span data-dp-sg-qte style={reserveInconnu(fr2(sg.cents), sg.incomplet).qte} className="ml-auto mr-[57px] whitespace-nowrap text-right font-mono text-xs font-semibold text-cave-200"><QteSousGroupe qte={sg.qte}/></span>
        <span data-dp-sg-montant style={reserveInconnu(fr2(sg.cents), sg.incomplet).montant} {...(sg.incomplet || sg.montantDoute ? { 'data-dp-niveau': 'inconnu' } : {})} className={`min-w-[54px] shrink-0 whitespace-nowrap text-right font-mono text-sm ${sg.incomplet ? 'text-alert' : sg.montantDoute ? MONTANT_DOUTE : 'text-cave-50'}`}>{fr2(sg.cents)}{sg.incomplet ? ' + ?' : null}</span>
      </button>
      <div id={`${id}-corps`} data-dp-sg-corps={`${b.cle}/${sg.nom}`} hidden={!ouvert}>{rangees(sg.ids)}</div>
    </div>;
  })}</div>;
}

export function Liste(p: {
  ordre: 'cat' | 'papier'; bandes: Bande[]; papier: { ids: string[]; cents: number; incomplet: boolean; /** Le port, hors de l'ordre du papier : « 80,46 + port 12,00 » (VERDICT-f3, détail 7). */ port?: number } | null; lignes: ReadonlyMap<string, React.ReactNode>;
  filtre: FiltreListe | null; visibles: ReadonlySet<string> | null; nAffichees: number; onSansFiltre: () => void; rattacherTous: { n: number; onTous: () => void } | null;
  pied: { /** B2 n° 11 : « ↶ Annuler « nom » » rend la dernière ligne retirée d'un toucher. */ annuler?: { nom: string; n: number; onAnnuler: () => void } | null; ajouterOff: boolean; ajouterTitre?: string; regrouper: boolean; /** D358 : l'arrondi suisse à 5 centimes, sa ligne neutre à la fin des lignes (« −0,01 ») ; le détail l'inclut. */ arrondi?: { texte: string } | null; /** D332 : après « Regrouper », le geste « ↶ Rétablir les N lignes » prend sa place jusqu'à « Confirmer ». */ retablir?: { n: number; onRetablir: () => void } | null; detail: { lignes: string; total: string; /** SM : la phrase du pied (`phraseDuPied`) : « Lignes = total 51,80 », « Lignes 56,80 = total 51,80 + 5,00 ajouté (Idaho7) », « Lignes 56,80 · total 51,80 · 5,00 de plus ». */ texte: string; /** Vrai seulement pour un écart que rien n'explique (ton d'attention). */ ecart: boolean; /** A4 : « Lecture déjà disponible · aucun nouvel appel IA », au survol du Détail. */ cache?: boolean } | null };
  onAjouter: () => void; onRegrouper: () => void; children?: React.ReactNode;
  /** D307 : le choix du brasseur sur chaque sous-groupe, les rangées qu'on doit voir (elles ouvrent leur groupe), le geste d'un toucher sur la ligne de sous-famille. */
  choixGroupes?: ChoixGroupes; forces?: ReadonlySet<string>; onBasculeGroupe?: (bande: string, sg: SousGroupe, ouvrir: boolean) => void;
  /** D307 : « tout plier, déplier » (toutes les bandes, ou une seule) ; sa forme visible est le choix de la voie r3-plier : aucun contrôle n'est posé ici. */
  onToutPlier?: (bande?: string) => void; onToutDeplier?: (bande?: string) => void;
  /** Lenteur D, son choix 2 D : les rangées barrées des lignes pas retrouvées, par bande (`GroupeCle`) ; en fin de bande, hors des sommes et du compte. Sans bande à elle (toutes ses lignes sont pas retrouvées), la rangée vient en fin de liste. */
  perdues?: ReadonlyMap<string, React.ReactNode>;
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
        <div data-dp-bande-entete className={`dp-p3c-bande-entete flex items-center gap-1 px-2.5 text-sm dp-p3c-t-${b.cle}`}>
          {(() => { const sg = b.sousGroupes?.length === 1 && b.sousGroupes[0].bande && pliable(b.sousGroupes[0]) ? b.sousGroupes[0] : undefined; if (!sg) return <span aria-hidden className="-ml-1 w-5 shrink-0"/>; /* B2 n° 9 : sans chevron (bande à sous-familles), la place reste : tous les points de couleur sont alignés */
            const ouvert = groupeOuvert(b.cle, sg, p.choixGroupes ?? new Map(), p.forces);
            return <button type="button" data-dp-bande-pli aria-expanded={ouvert} aria-controls={`dp-bande-${b.cle}-corps`} aria-label={`${ouvert ? 'Plier' : 'Déplier'} ${b.nom}`} onClick={() => p.onBasculeGroupe?.(b.cle, sg, !ouvert)} className="-ml-1 inline-flex min-h-7 w-5 shrink-0 items-center justify-center text-cave-400">{ouvert ? <ChevronDown size={14} strokeWidth={2.2}/> : <ChevronRight size={14} strokeWidth={2.2}/>}</button>; })()}
          <i aria-hidden className={`size-2.5 shrink-0 rounded-full ${POINT_GROUPE[b.cle]}`}/>
          <strong className="font-semibold text-cave-50">{b.nom}</strong>
          <span data-dp-bande-compte className={`shrink-0 whitespace-nowrap rounded-control border border-cave-600 bg-cave-950 ${b.moutureIds.length && !p.visibles ? 'px-1' : 'px-1.5'} font-mono text-xs leading-[18px] text-cave-200`}>{p.visibles ? `${b.ids.filter(id => p.visibles!.has(id)).length}/${b.ids.length}` : b.ids.length}{!p.visibles && b.moutureIds.length ? ` +${b.moutureIds.length} ↳` : ''}</span>
          {b.cle === 'malt' && p.rattacherTous ? <button type="button" data-dp-mouture-tous title={`Rattacher les ${p.rattacherTous.n} moutures`} onClick={p.rattacherTous.onTous} className="min-h-6 min-w-0 truncate rounded-control border border-ebc-straw bg-ebc-straw px-1 text-xs font-semibold text-cave-950">Rattacher les {p.rattacherTous.n}</button> : null}
          {b.eqb ? <span className="ml-auto whitespace-nowrap rounded-control bg-cave-950 px-1.5 text-xs leading-[18px] text-cave-200">{b.eqb}</span> : null}
          <span data-dp-sous-qte style={reserveInconnu(fr2(b.cents), b.incomplet).qte} className={`${b.eqb ? '' : 'ml-auto'} mr-[57px] whitespace-nowrap text-right font-mono text-xs font-semibold text-cave-200`}>{b.qte.map((e, i) => <React.Fragment key={i}>{i ? ' + ' : ''}{e.inconnue
            ? <i data-dp-niveau="inconnu" className="rounded-control border border-dashed border-alert bg-cave-950 px-1 font-normal not-italic text-alert" title="Unité à remplir sur une ligne">{`${e.n ? `${String(e.n).replace('.', ',')} ` : ''}?`}</i>
            : e.niveau === 'repris' ? <i data-dp-niveau="repris" className="not-italic text-attention underline decoration-dotted decoration-attention underline-offset-2" title="Unité déduite sur une ligne : à contrôler">{texteQte([e])}</i>
            : texteQte([e])}</React.Fragment>)}</span>
          <span data-dp-sous-montant style={reserveInconnu(fr2(b.cents), b.incomplet).montant} {...(b.incomplet || b.montantDoute ? { 'data-dp-niveau': 'inconnu' } : {})} className={`min-w-[54px] shrink-0 whitespace-nowrap text-right font-mono text-sm font-semibold ${b.incomplet ? 'text-alert' : b.montantDoute ? MONTANT_DOUTE : 'text-cave-50'}`}>{fr2(b.cents)}{b.incomplet ? ' + ?' : null}</span>
        </div>
        <CorpsBande b={b} p={p}/>
        {p.perdues?.get(b.cle)}
      </div>) : p.papier ? <div data-dp-bande="papier">
        <div data-dp-bande-entete className="dp-p3c-bande-entete flex items-center gap-1.5 dp-p3c-t-papier px-2.5 text-sm">
          <strong className="font-semibold text-cave-50">Ordre du papier</strong>
          <span className="rounded-control border border-cave-600 bg-cave-950 px-1.5 font-mono text-xs leading-[18px] text-cave-200">{p.papier.ids.length}</span>
          <span data-dp-sous-montant {...(p.papier.incomplet ? { 'data-dp-niveau': 'inconnu' } : {})} className={`ml-auto min-w-[54px] shrink-0 whitespace-nowrap text-right font-mono text-sm font-semibold ${p.papier.incomplet ? 'text-alert' : 'text-cave-50'}`}>{fr2(p.papier.cents)}{p.papier.incomplet ? ' + ?' : null}{p.papier.port ? <span data-dp-papier-port className="font-normal text-cave-400"> + port {fr2(p.papier.port)}</span> : null}</span>
        </div>
        <div>{p.papier.ids.map(id => <React.Fragment key={id}>{p.lignes.get(id)}</React.Fragment>)}</div>
        {p.perdues ? [...p.perdues.values()].map((x, i) => <React.Fragment key={i}>{x}</React.Fragment>) : null}
      </div> : null}
      {p.ordre === 'cat' && p.perdues ? [...p.perdues].filter(([cle]) => !p.bandes.some(b => b.cle === cle)).map(([cle, x]) => <div key={cle} data-dp-bande-perdues={cle}>{x}</div>) : null}
    </div>
    {p.pied.arrondi && !p.filtre ? <div data-dp-arrondi className="flex min-h-6 items-center gap-1.5 border-b border-cave-800 px-2.5 text-xs text-cave-400"><span>Arrondi à 5 centimes</span><span className="ml-auto min-w-[54px] whitespace-nowrap text-right font-mono">{p.pied.arrondi.texte}</span></div> : null}
    {p.children}
    <div data-dp="fin" className="flex flex-wrap items-center gap-1.5 px-2.5 py-2">
      <button type="button" disabled={p.pied.ajouterOff} title={p.pied.ajouterTitre} onClick={p.onAjouter} className="min-h-7 rounded-control border border-dashed border-cave-600 px-2.5 text-sm text-cave-200 disabled:opacity-40">+ Ajouter une ligne</button>
      {p.pied.annuler ? <button type="button" data-dp-annuler onClick={p.pied.annuler.onAnnuler} title={`Annuler le retrait de « ${p.pied.annuler.nom} »${p.pied.annuler.n > 1 ? ` (${p.pied.annuler.n} retraits)` : ''}`} className="min-h-7 max-w-full truncate rounded-control border border-dashed border-cave-600 px-2.5 text-sm text-cave-200">↶ Annuler « {p.pied.annuler.nom.length > 22 ? `${p.pied.annuler.nom.slice(0, 21)}…` : p.pied.annuler.nom} »</button> : null}
      {p.pied.retablir ? <button type="button" data-dp-retablir onClick={p.pied.retablir.onRetablir} className="min-h-7 rounded-control border border-dashed border-cave-600 px-2.5 text-sm text-cave-200">↶ Rétablir les {p.pied.retablir.n} lignes</button> : null}
      {/* D357 : « Regrouper en une dépense » n'est plus un bouton cadré à côté de « + Ajouter une ligne » : un lien discret au bout de la ligne « Détail » (texte secondaire, sans cadre, 12 px, cible de 24 px). Le retour, « ↶ Rétablir », reste (D332). */}
      {p.pied.detail || (p.pied.regrouper && !p.pied.retablir) ? <span className="ml-auto flex flex-wrap items-center justify-end gap-x-2 text-xs">
        {p.pied.detail ? <span title={p.pied.detail.cache ? 'Lecture déjà disponible · aucun nouvel appel IA' : undefined} className={p.pied.detail.ecart ? 'text-attention' : 'text-cave-400'}>{p.pied.detail.texte}</span> : null}
        {p.pied.detail && p.pied.regrouper && !p.pied.retablir ? <span aria-hidden className="text-cave-400">·</span> : null}
        {p.pied.regrouper && !p.pied.retablir ? <button type="button" data-dp-regrouper onClick={p.onRegrouper} className="min-h-6 text-xs text-cave-400 underline decoration-dotted underline-offset-2">Regrouper en une dépense</button> : null}</span> : null}
    </div>
  </section>;
}
