import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, ChevronDown, ChevronRight, ChevronUp, Pencil, Plus, Tag } from 'lucide-react';
import type { CreativeItem, Recipe } from '../../types';
import { StorageService } from '../../services/storage';
import { NumberInput } from '../NumberInput';
import { estDemo } from './demo';
import {
  avecChamp, COULEURS, MOMENTS, nouvelleIdee, recetteDeLIdee, repartir, SAISONS, STYLES_RAPIDES, teinteDe,
  type CouleurId, type EtatIdee, type IdeeBiere, type MomentId, type SaisonId
} from '../../domain/atelier/ideesBieres';
import { arrondiPas, auLitre, avecPrix, formatDe, FORMATS_PRIX, nouvelleIdeePrix, pousser, titreIdee, type FormatPrixId, type IdeePrix } from '../../domain/atelier/ideesPrix';
import './atelier.css';

/**
 * kb3 (choisi le 14.11, « la ligne s'ouvre sur place ») : Carnet › Bières et Tarifs › idées de prix.
 * Aucune fenêtre : la ligne touchée s'ouvre dans la liste, bord de la teinte visée, les voisines restent visibles ; une seule ouverte.
 * Vide : la première ligne s'écrit déjà sur place. Classes `lo-` (L26). Les champs sont décrits dans domain/atelier/ideesBieres.ts et ideesPrix.ts.
 */

const fr2 = (n: number) => n.toFixed(2).replace('.', ',');
const attrsTexte = { autoComplete: 'off', autoCorrect: 'off', spellCheck: false, 'data-form-type': 'other', 'data-lpignore': 'true', 'data-1p-ignore': 'true', 'data-bwignore': 'true' } as const;

/** Un texte écrit sur place : il part au rangement à la sortie du champ (ou « Entrée »), pas à chaque lettre. */
function ChampTexte({ valeur, onValider, etiquette, placeholder, className = 'lo-val', autoFocus }: { valeur: string; onValider: (v: string) => void; etiquette: string; placeholder: string; className?: string; autoFocus?: boolean }) {
  const [t, setT] = useState(valeur);
  useEffect(() => setT(valeur), [valeur]);
  return <input type="text" className={className} aria-label={etiquette} value={t} placeholder={placeholder} autoFocus={autoFocus} {...attrsTexte}
    onChange={(e) => setT(e.target.value)} onBlur={() => { if (t.trim() !== valeur.trim()) onValider(t.trim()); }}
    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />;
}

/** Choix parmi quelques valeurs : un toucher choisit, un second toucher sur la valeur choisie la retire (« à choisir », jamais une valeur par défaut). */
function Segment<T extends string>({ nom, choix, valeur, onChoisir, large, retirable = true }: { nom: string; choix: ReadonlyArray<{ id: T; texte: string }>; valeur: T | undefined; onChoisir: (v: T | undefined) => void; large?: boolean; retirable?: boolean }) {
  return <div className={`lo-segm${large ? ' lo-full' : ''}`} role="group" aria-label={nom}>
    {choix.map((c) => <button key={c.id} type="button" aria-pressed={valeur === c.id} onClick={() => onChoisir(valeur === c.id && retirable ? undefined : c.id)}>{c.texte}</button>)}
  </div>;
}

function Pastilles({ valeur, onChoisir }: { valeur: CouleurId | undefined; onChoisir: (c: CouleurId | undefined) => void }) {
  return <div className="lo-sw" role="group" aria-label="Couleur">
    {COULEURS.map((c) => <button key={c.id} type="button" aria-label={c.nom} aria-pressed={valeur === c.id} onClick={() => onChoisir(valeur === c.id ? undefined : c.id)}><i style={{ background: c.teinte }} /></button>)}
  </div>;
}

/** L'entête d'une ligne : le titre est un titre de la liste, le bouton qui l'ouvre ou la referme couvre toute la largeur (cible 44 px). */
function Entete({ ouvert, onBascule, gauche, titre, droite }: { ouvert: boolean; onBascule: () => void; gauche: React.ReactNode; titre: string; droite?: React.ReactNode }) {
  return <h4 className="lo-h"><button type="button" className="lo-hd" aria-expanded={ouvert} onClick={onBascule}>
    {gauche}<span className="lo-t">{titre}</span>{droite}
    <span className={ouvert ? 'lo-up' : 'lo-chev'} aria-hidden="true">{ouvert ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
  </button></h4>;
}

const Pastille = ({ id, grand }: { id: CouleurId | undefined; grand?: boolean }) => {
  const teinte = teinteDe(id);
  return <i className={`lo-dot${grand ? ' lo-dot-l' : ''}${teinte ? '' : ' lo-dot-0'}`} style={teinte ? { background: teinte } : undefined} aria-hidden="true" />;
};

/* ─────────────── Bières ─────────────── */

export interface IdeesBieresProps {
  idees: readonly CreativeItem[];
  recettes: readonly Pick<Recipe, 'id' | 'name'>[];
  /** « + Noter » ouvre la ligne neuve en tête de liste. */
  ajout: boolean;
  onAjout: (v: boolean) => void;
  onCreer: (idee: CreativeItem) => void;
  onMaj: (idee: CreativeItem) => void;
  /** Le geste de l'app : ouvre l'assistant de recette prérempli du titre et de la description de l'idée. */
  onPasser: (idee: CreativeItem) => void;
  /** Absent : la recette est dite « En recette » sans bouton (la page recette s'ouvre depuis App). */
  onOuvrirRecette?: (recetteId: string) => void;
  /** La fiche complète de l'app (modifier, supprimer avec confirmation). */
  onFiche: (idee: CreativeItem) => void;
}

export function IdeesBieres({ idees, recettes, ajout, onAjout, onCreer, onMaj, onPasser, onOuvrirRecette, onFiche }: IdeesBieresProps) {
  const [filtre, setFiltre] = useState<EtatIdee>('essayer');
  const [ouvert, setOuvert] = useState<string | null>(null);
  const parEtat = useMemo(() => repartir(idees, recettes), [idees, recettes]);
  const liste = parEtat[filtre];
  const vide = idees.length === 0;
  const maj = (i: CreativeItem) => onMaj(i);
  return <div className="lo">
    <div className="lo-bar" role="group" aria-label="Idées de bière">
      <button type="button" className="lo-flt" aria-pressed={filtre === 'essayer'} onClick={() => setFiltre('essayer')}>À essayer <b className="lo-num">{parEtat.essayer.length}</b></button>
      <button type="button" className="lo-flt" aria-pressed={filtre === 'recette'} onClick={() => setFiltre('recette')}>En recette <b className="lo-num">{parEtat.recette.length}</b></button>
      {!vide && <button type="button" className="lo-new" onClick={() => { onAjout(true); setOuvert(null); setFiltre('essayer'); }}><Plus size={18} aria-hidden="true" />Noter</button>}
    </div>
    {vide && <p className="lo-first">Aucune idée de bière encore. Écris la première ici :</p>}
    {(ajout || vide) && <NouvelleBiere refermable={!vide} onFermer={() => onAjout(false)} onGarder={(i) => { onCreer(i); onAjout(false); setOuvert(i.id); }} />}
    {!vide && liste.length === 0 && <p className="lo-first">{filtre === 'essayer' ? 'Rien à essayer : toutes tes idées sont en recette.' : 'Aucune idée n’est encore passée en recette.'}</p>}
    <div className="lo-list">
      {liste.map((i) => {
        const idee = i as IdeeBiere;
        const ouv = ouvert === i.id;
        const recette = recetteDeLIdee(i, recettes);
        return <div key={i.id} className={ouv ? 'lo-open' : 'lo-row'} style={ouv ? ({ ['--c' as string]: teinteDe(idee.couleur) ?? 'var(--a-line2)' }) : undefined}>
          <Entete ouvert={ouv} onBascule={() => setOuvert(ouv ? null : i.id)} gauche={<Pastille id={idee.couleur} grand={ouv} />} titre={i.title}
            droite={!ouv && (estDemo(i.id) ? <span className="lo-pill">Démo</span> : idee.style ? <small className="lo-sty">{idee.style}</small> : null)} />
          {ouv && <>
            <div className="lo-kv">
              <span className="lo-k">Style</span><ChampTexte valeur={idee.style ?? ''} etiquette="Style" placeholder="à choisir" onValider={(v) => maj(avecChamp(i, 'style', v))} />
              <span className="lo-k">Couleur</span><Pastilles valeur={idee.couleur} onChoisir={(c) => maj(avecChamp(i, 'couleur', c ?? ''))} />
              <span className="lo-k">Quand</span><Segment<MomentId> nom="Quand" choix={MOMENTS.map((m) => ({ id: m.id, texte: m.court }))} valeur={idee.moment} onChoisir={(m) => maj(avecChamp(i, 'moment', m ?? ''))} />
              <span className="lo-k">Brasser</span><Segment<SaisonId> nom="Brasser" choix={SAISONS.map((s) => ({ id: s.id, texte: s.nom }))} valeur={idee.saison} onChoisir={(s) => maj(avecChamp(i, 'saison', s ?? ''))} />
              {i.description && <><span className="lo-k">Idée</span><p className="lo-txt">{i.description}</p></>}
              {i.notes && <><span className="lo-k">Notes</span><p className="lo-txt">{i.notes}</p></>}
            </div>
            {recette
              ? <div className="lo-linked" role="status"><Check size={18} aria-hidden="true" />En recette{onOuvrirRecette && <button type="button" onClick={() => onOuvrirRecette(recette.id)}><BookOpen size={16} aria-hidden="true" />Ouvrir la recette</button>}</div>
              : <div className="lo-act">
                  <button type="button" className="lo-sec" aria-label={`Modifier ou supprimer « ${i.title} »`} onClick={() => onFiche(i)}><Pencil size={18} aria-hidden="true" /></button>
                  <button type="button" className="lo-cta" onClick={() => onPasser(i)}><BookOpen size={18} aria-hidden="true" />Passer dans mes recettes</button>
                </div>}
          </>}
        </div>;
      })}
    </div>
  </div>;
}

/** La ligne neuve : le titre, le style (quatre à un toucher, « … » pour un autre), la couleur. Seul le titre est obligatoire. */
function NouvelleBiere({ refermable, onFermer, onGarder }: { refermable: boolean; onFermer: () => void; onGarder: (i: CreativeItem) => void }) {
  const [titre, setTitre] = useState('');
  const [style, setStyle] = useState('');
  const [autre, setAutre] = useState(false);
  const [couleur, setCouleur] = useState<CouleurId | undefined>(undefined);
  const racine = useRef<HTMLDivElement>(null);
  useEffect(() => { if (refermable) racine.current?.scrollIntoView({ block: 'nearest' }); }, [refermable]);
  const garder = () => { const i = nouvelleIdee(titre, style, couleur, `CR-${Date.now()}`); if (i) onGarder(i); };
  const rapide = (STYLES_RAPIDES as readonly string[]).includes(style) ? style : undefined;
  return <div ref={racine} className="lo-open lo-neuf" style={{ ['--c' as string]: teinteDe(couleur) ?? 'var(--a-line2)' }} role="group" aria-label="Nouvelle idée de bière">
    <div className="lo-oh">
      <input type="text" className="lo-in" aria-label="Une idée de bière" placeholder="Une idée de bière" value={titre} autoFocus={refermable} {...attrsTexte}
        onChange={(e) => setTitre(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') garder(); }} />
      {refermable && <button type="button" className="lo-up" aria-label="Refermer" onClick={onFermer}><ChevronUp size={18} aria-hidden="true" /></button>}
    </div>
    <div className="lo-kv">
      <span className="lo-k">Style</span>
      <div className="lo-segm" role="group" aria-label="Style">
        {STYLES_RAPIDES.map((s) => <button key={s} type="button" aria-pressed={rapide === s && !autre} onClick={() => { setAutre(false); setStyle(style === s ? '' : s); }}>{s}</button>)}
        <button type="button" aria-pressed={autre || (style !== '' && !rapide)} aria-label="Un autre style" onClick={() => { setAutre(true); if (rapide) setStyle(''); }}>…</button>
      </div>
      {(autre || (style !== '' && !rapide)) && <><span className="lo-k" /><input type="text" className="lo-val" aria-label="Style de la bière" placeholder="ex. Dubbel" value={style} autoFocus {...attrsTexte} onChange={(e) => setStyle(e.target.value)} /></>}
      <span className="lo-k">Couleur</span><Pastilles valeur={couleur} onChoisir={setCouleur} />
    </div>
    <div className="lo-act"><button type="button" className="lo-cta" disabled={!titre.trim()} onClick={garder}>Garder l’idée</button></div>
  </div>;
}

/* ─────────────── Tarifs : les idées de prix ─────────────── */

/** Silhouettes de la maquette kb3 (keg, case, growler, cup, bottle). */
const PICTO: Record<FormatPrixId, string[]> = {
  fut: ['M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M5 8h14M5 16h14'],
  carton: ['M5 9h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z', 'M3 13h18'],
  growler: ['M9 3h4v4l2 3v10a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V10l2-3z', 'M15 12h2a2 2 0 0 1 0 4h-2'],
  verre: ['M6 4h12l-1.5 16a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1z', 'M6.4 9h11.2'],
  '33cl': ['M10 2h4v5l2 3v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10l2-3z', 'M8 14h8']
};
function PictoFormat({ id }: { id: FormatPrixId | undefined }) {
  return <span className="lo-ti" aria-hidden="true">{id
    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{PICTO[id].map((d) => <path key={d} d={d} />)}{id === 'carton' && <><circle cx="7" cy="5.5" r="1.6" /><circle cx="12" cy="5.5" r="1.6" /><circle cx="17" cy="5.5" r="1.6" /></>}</svg>
    : <Tag size={18} />}</span>;
}

const CHOIX_FORMAT = FORMATS_PRIX.map((f) => ({ id: f.id, texte: f.court }));
const versPrix = () => {
  StorageService.setUiState('clients_subtab', 'tarifs');
  window.dispatchEvent(new CustomEvent('affinee:ouvrir-clients', { cancelable: true }));
};

export interface IdeesPrixProps {
  idees: readonly CreativeItem[];
  ajout: boolean;
  onAjout: (v: boolean) => void;
  onCreer: (idee: CreativeItem) => void;
  onMaj: (idee: CreativeItem) => void;
  onFiche: (idee: CreativeItem) => void;
  /** Sous la liste : l'assistant. */
  apres?: React.ReactNode;
}

export function IdeesPrix({ idees, ajout, onAjout, onCreer, onMaj, onFiche, apres }: IdeesPrixProps) {
  const [ouvert, setOuvert] = useState<string | null>(null);
  const vide = idees.length === 0;
  useEffect(() => { if (ajout) setOuvert(null); }, [ajout]);
  return <div className="lo lo-prix">
    {vide && <p className="lo-first">Aucune idée de prix encore. Note la première ici :</p>}
    {(ajout || vide) && <NouveauPrix refermable={!vide} onFermer={() => onAjout(false)} onGarder={(i) => { onCreer(i); onAjout(false); setOuvert(i.id); }} />}
    {!vide && <div className="lo-list" aria-label="Mes idées de prix">
      {idees.map((i) => {
        const ouv = ouvert === i.id;
        const f = formatDe(i);
        const prix = i.targetPrice;
        const litre = auLitre(prix, f);
        return <div key={i.id} className={ouv ? 'lo-open' : 'lo-row'} style={ouv ? ({ ['--c' as string]: 'var(--a-prod)' }) : undefined}>
          <Entete ouvert={ouv} onBascule={() => setOuvert(ouv ? null : i.id)} gauche={<PictoFormat id={f?.id} />} titre={titreIdee(i)}
            droite={!ouv && (prix !== undefined ? <span className="lo-pr lo-num">{fr2(prix)}</span> : <span className="lo-est">à estimer</span>)} />
          {ouv && <>
            <div className="lo-bigp">
              <button type="button" className="lo-stp" aria-label={`Moins ${f ? fr2(f.pas) : '1'}`} onClick={() => onMaj(avecPrix(i, { targetPrice: pousser(prix, f, -1) }))}>−</button>
              <div className="lo-val lo-bigv"><NumberInput value={prix} onValue={(v) => onMaj(avecPrix(i, { targetPrice: v }))} emptyValue={undefined} fractionDigits={2} className="lo-pin lo-num" aria-label="Prix visé en CHF HT" placeholder="CHF HT" />{f && <small>{f.unite}</small>}</div>
              <button type="button" className="lo-stp" aria-label={`Plus ${f ? fr2(f.pas) : '1'}`} onClick={() => onMaj(avecPrix(i, { targetPrice: pousser(prix, f, 1) }))}>+</button>
            </div>
            <p className="lo-hint lo-num" role="status">{litre !== null && f
              ? <>soit <b>{fr2(litre)}</b> le litre · pas de {fr2(f.pas).replace(/,00$/, '')}</>
              : !f ? 'Choisis le format pour voir le prix au litre.' : 'Pose un prix pour voir le litre.'}</p>
            <div className="lo-kv">
              <span className="lo-k lo-k2">Format</span>
              <Segment<FormatPrixId> nom="Format" choix={CHOIX_FORMAT} valeur={f?.id} large retirable={false} onChoisir={(v) => v && onMaj(avecPrix(i, { format: v }))} />
              <span className="lo-k">Pour qui</span><ChampTexte valeur={i.contactName ?? ''} etiquette="Pour qui" placeholder="à choisir" onValider={(v) => onMaj(avecPrix(i, { contactName: v }))} />
              <span className="lo-k">Coût</span>
              <div className="lo-val lo-cout"><NumberInput value={i.estimatedCost} onValue={(v) => onMaj(avecPrix(i, { estimatedCost: v }))} emptyValue={undefined} fractionDigits={2} className={`lo-pin lo-num${i.estimatedCost === undefined ? ' lo-pose' : ''}`} aria-label="Coût en CHF" placeholder="à poser" />
                <small>{i.estimatedCost === undefined ? '· marge sans chiffre' : 'CHF'}</small></div>
            </div>
            <div className="lo-act"><button type="button" className="lo-sec" aria-label={`Modifier ou supprimer « ${titreIdee(i)} »`} onClick={() => onFiche(i)}><Pencil size={18} aria-hidden="true" /></button>
              <button type="button" className="lo-fix" onClick={versPrix}><Tag size={18} aria-hidden="true" /><b>Fixer dans Clients › Prix</b><ChevronRight size={18} aria-hidden="true" /></button></div>
          </>}
        </div>;
      })}
    </div>}
    {apres}
  </div>;
}

/** La ligne neuve d'une idée de prix : le format, le prix visé, pour qui. Il suffit d'un format ou d'un prix. */
function NouveauPrix({ refermable, onFermer, onGarder }: { refermable: boolean; onFermer: () => void; onGarder: (i: CreativeItem) => void }) {
  const [format, setFormat] = useState<FormatPrixId | undefined>(undefined);
  const [prix, setPrix] = useState<number | undefined>(undefined);
  const [pour, setPour] = useState('');
  const racine = useRef<HTMLDivElement>(null);
  useEffect(() => { if (refermable) racine.current?.scrollIntoView({ block: 'nearest' }); }, [refermable]);
  const i = nouvelleIdeePrix(format, prix, pour, `CR-${Date.now()}`);
  const f = FORMATS_PRIX.find((x) => x.id === format);
  const litre = auLitre(prix, f);
  return <div ref={racine} className="lo-open lo-neuf" style={{ ['--c' as string]: 'var(--a-line2)' }} role="group" aria-label="Nouvelle idée de prix">
    {refermable && <div className="lo-oh lo-oh-r"><span className="lo-k">Nouvelle idée de prix</span><button type="button" className="lo-up" aria-label="Refermer" onClick={onFermer}><ChevronUp size={18} aria-hidden="true" /></button></div>}
    <div className="lo-kv">
      <span className="lo-k lo-k2">Format</span>
      <Segment<FormatPrixId> nom="Format" choix={CHOIX_FORMAT} valeur={format} large onChoisir={setFormat} />
      <span className="lo-k">Prix visé</span>
      <div className="lo-val lo-bigv lo-ink"><NumberInput value={prix} onValue={setPrix} emptyValue={undefined} fractionDigits={2} className="lo-pin lo-num" aria-label="Prix visé en CHF HT" placeholder="CHF HT" /></div>
      {litre !== null && f && <><span className="lo-k" /><p className="lo-hint lo-num">soit <b>{fr2(litre)}</b> le litre</p></>}
      <span className="lo-k">Pour qui</span><ChampTexte valeur={pour} etiquette="Pour qui" placeholder="à choisir" onValider={setPour} />
    </div>
    <div className="lo-act"><button type="button" className="lo-cta" disabled={!i} onClick={() => i && onGarder(i)}>Garder l’idée</button></div>
  </div>;
}

export type { IdeePrix };
