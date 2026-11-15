import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronRight, ChevronUp, GripVertical, LayoutGrid, Plus, X } from 'lucide-react';
import type { CreativeItem } from '../../types';
import {
  ajouterJours, construireFil, enSuisse, joursDepuisY, jourComplet, jourMois, MARGE_HAUT, positionY, relatif
} from '../../domain/todoTimeline';
import { estDemo } from './demo';
import './atelier.css';

/**
 * « À faire » : le fil du temps à l'échelle (kd4, choisie le 15.11). Les calculs sont dans `domain/todoTimeline`.
 * La tâche sans date sort du fil (poche au-dessus du trait « aujourd'hui ») : elle ne change aucune distance.
 * Pas de champ neuf : la date se pose en glissant la perle neuve (ou en touchant le fil, ou aux flèches), même champ `date`.
 */
interface Props {
  items: CreativeItem[];
  adding: boolean;
  onAdding: (ouvert: boolean) => void;
  onCreate: (titre: string, date: string) => void;
  onToggle: (item: CreativeItem) => void;
  onEdit: (item: CreativeItem) => void;
}

const JOURS_PAR_DEFAUT = 14;

export const TodoTimeline: React.FC<Props> = ({ items, adding, onAdding, onCreate, onToggle, onEdit }) => {
  const aujourdhui = useMemo(() => new Date(), []);
  const taches = useMemo(() => items.map((i) => ({ id: i.id, title: i.title, date: i.date, status: i.status })), [items]);
  const [jours, setJours] = useState(JOURS_PAR_DEFAUT);
  const fil = useMemo(() => construireFil(taches, aujourdhui, adding ? jours : null), [taches, aujourdhui, adding, jours]);
  const parId = (id: string) => items.find((i) => i.id === id)!;
  const [faitesOuvertes, setFaitesOuvertes] = useState(false);
  const [recent, setRecent] = useState<CreativeItem | null>(null);
  const [titre, setTitre] = useState('');
  const [indiceBord, setIndiceBord] = useState(false);
  const futRef = useRef<HTMLDivElement>(null);
  const fantomeRef = useRef<HTMLButtonElement>(null);
  const glisse = useRef(false);
  const demo = items.some((i) => estDemo(i.id));

  useEffect(() => { if (!recent) return; const t = setTimeout(() => setRecent(null), 9000); return () => clearTimeout(t); }, [recent]);
  useEffect(() => { if (adding) { setJours(JOURS_PAR_DEFAUT); setTimeout(() => fantomeRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' }), 60); } }, [adding]);

  const cocher = (id: string) => {
    const item = parId(id);
    onToggle(item);
    if (item.status !== 'done') setRecent(item); else setRecent(null);
  };
  const annuler = () => { if (recent) onToggle({ ...recent, status: 'done' }); setRecent(null); };
  const fermer = () => { onAdding(false); setTitre(''); };
  const dateChoisie = ajouterJours(aujourdhui, jours);
  const poser = (avecDate: boolean) => {
    if (!titre.trim()) return;
    onCreate(titre.trim(), avecDate ? enSuisse(dateChoisie) : '');
    fermer();
  };

  const versBord = () => {
    const pris = !window.dispatchEvent(new CustomEvent('affinee:ouvrir-bord', { cancelable: true }));
    if (!pris) setIndiceBord(true);
  };
  const nbAgenda = items.filter((i) => i.status !== 'done').length;

  const surFil = (e: React.PointerEvent) => {
    const r = futRef.current?.getBoundingClientRect();
    if (!r) return;
    setJours(joursDepuisY(e.clientY - r.top - MARGE_HAUT));
  };
  const hauteur = adding ? Math.max(fil.hauteur, MARGE_HAUT + positionY(jours) + 70) : fil.hauteur;
  const fantomeY = MARGE_HAUT + positionY(jours);
  const touches = (e: React.KeyboardEvent) => {
    const pas = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : e.key === 'PageDown' ? 7 : e.key === 'PageUp' ? -7 : 0;
    if (pas) { e.preventDefault(); setJours((j) => Math.max(0, Math.min(3650, j + pas))); }
  };

  const perle = (cls: string, label: string, onClick: () => void) => (
    <button type="button" className={`tl-bead ${cls}`} aria-label={label} onClick={onClick}><i /></button>
  );

  return (
    <section className="tl" aria-label="À faire">
      <button type="button" className="tl-done" aria-expanded={faitesOuvertes} onClick={() => setFaitesOuvertes(!faitesOuvertes)} disabled={fil.faites.length === 0}>
        <span className="tl-beads">{fil.faites.slice(0, 3).map((f, i) => <span key={f.id} className={`tl-bd${recent?.id === f.id || (i === 0 && false) ? ' new' : ''}`}><Check size={12} strokeWidth={3.5} aria-hidden="true" /></span>)}</span>
        <span>Faites <b className="tl-num">{fil.faites.length}</b></span><span className="tl-sp" />
        {demo && <span className="tl-demo">démo</span>}
        {fil.faites.length > 0 && (faitesOuvertes ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />)}
      </button>
      {faitesOuvertes && fil.faites.map((f) => (
        <div key={f.id} className="tl-fait"><button type="button" className="tl-bead on" aria-label={`Remettre « ${f.titre} » à faire`} onClick={() => cocher(f.id)}><i><Check size={13} strokeWidth={3.5} aria-hidden="true" /></i></button><span>{f.titre}</span></div>
      ))}
      {recent && <div className="tl-fresh"><Check size={14} aria-hidden="true" />{recent.title} · à l’instant</div>}

      <div className="tl-fil">
        {fil.retard.map((r) => (
          <div key={r.id} className="tl-late">
            <span className="tl-dl">{r.etiquette}<small>passé</small></span>
            {perle('l', `Cocher « ${r.titre} »`, () => cocher(r.id))}
            <div className="tl-lt"><button type="button" className="tl-title" onClick={() => onEdit(parId(r.id))}>{r.titre}</button><span className="r">{r.relatif}</span></div>
          </div>
        ))}
        <div className="tl-rest">
        {fil.sansDate.length > 0 && (
          <div className="tl-pocket">
            <div className="h"><GripVertical size={14} aria-hidden="true" />sans date</div>
            {fil.sansDate.map((s) => (
              <div key={s.id} className="row">
                {perle('', `Cocher « ${s.titre} »`, () => cocher(s.id))}
                <button type="button" className="tl-title" onClick={() => onEdit(parId(s.id))}>{s.titre}{s.brut && <small> · date illisible : « {s.brut} »</small>}</button>
              </div>
            ))}
          </div>
        )}
        <div className="tl-now"><span>aujourd’hui · {jourComplet(aujourdhui)}</span></div>
        <div ref={futRef} className="tl-fut" style={{ height: hauteur }}
          onPointerDown={adding ? (e) => { glisse.current = true; (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); surFil(e); } : undefined}
          onPointerMove={adding ? (e) => { if (glisse.current) surFil(e); } : undefined}
          onPointerUp={() => { glisse.current = false; }} onPointerCancel={() => { glisse.current = false; }}>
          {fil.reperes.map((r) => <span key={`${r.jours}-${r.etiquette}`} className={`tl-tk${r.rupture ? ' rupt' : ''}`} style={{ top: r.y }}>{r.etiquette}</span>)}
          {fil.noteRupture !== null && <span className="tl-note" style={{ top: fil.noteRupture }}>échelle resserrée</span>}
          {fil.ecarts.map((g) => <span key={g.y} className="tl-gap" style={{ top: g.y }}>{g.texte}</span>)}
          {fil.futur.map((p) => (
            <div key={p.id}>
              {p.decale && <span className="tl-dot" style={{ top: p.y }} aria-hidden="true" />}
              <div className="tl-ev" style={{ top: p.yCarte }}>
                <span className="dt">{p.etiquette}<small>{p.jourSemaine}</small></span>
                {perle('e', `Cocher « ${p.titre} »`, () => cocher(p.id))}
                <button type="button" className="tl-evc" onClick={() => onEdit(parId(p.id))}><b>{p.titre}</b><span>{p.relatif}</span></button>
              </div>
            </div>
          ))}
          {adding && (
            <div className="tl-gh" style={{ top: fantomeY }}>
              <button ref={fantomeRef} type="button" role="slider" className="tl-bead n" aria-label="Date de la tâche" aria-valuemin={0} aria-valuenow={jours} aria-valuetext={`${jourComplet(dateChoisie)}, ${relatif(jours)}`} onKeyDown={touches}><i /></button>
              <span className="lab">{jourComplet(dateChoisie)}<small>{relatif(jours)}</small></span>
              <span className="grip"><GripVertical size={18} aria-hidden="true" /></span>
            </div>
          )}
          {fil.futur.length === 0 && !adding && (
            <div className="tl-free">
              <p><b>Le fil est libre.</b> Pose une tâche ou la date d’un marché&nbsp;; le Bord la montre aussi.</p>
              <button type="button" onClick={() => onAdding(true)}><Plus size={18} aria-hidden="true" />Poser</button>
            </div>
          )}
          {fil.futur.length > 0 && !adding && fil.yPoser !== null && (
            <>
              <button type="button" className="tl-endb" style={{ top: fil.yPoser }} aria-label="Poser une tâche" onClick={() => onAdding(true)}><Plus size={22} aria-hidden="true" /></button>
              <span className="tl-endl" style={{ top: fil.yPoser }}>Poser</span>
            </>
          )}
        </div>
        </div>
      </div>

      <button type="button" className="tl-go" onClick={versBord}>
        <LayoutGrid size={18} aria-hidden="true" /><span>Agenda du Bord</span><span className="tl-num tl-goc">{nbAgenda}</span><span className="tl-sp" />
        <span className="tl-gom">{indiceBord ? 'dans la barre du bas' : 'Bord'}</span><ChevronRight size={18} aria-hidden="true" />
      </button>

      {recent && (
        <div className="tl-toast" role="status"><Check size={18} aria-hidden="true" /><span>Faite · montée dans Faites</span><span className="tl-sp" /><button type="button" onClick={annuler}>Annuler</button></div>
      )}

      {adding && (
        <form className="tl-sheet" role="dialog" aria-modal="false" aria-label="Poser sur le fil" onSubmit={(e) => { e.preventDefault(); poser(true); }}
          onKeyDown={(e) => { if (e.key === 'Escape') fermer(); }}>
          <div className="tl-grab" />
          <div className="tl-sh"><h2>Nouvelle tâche</h2><button type="button" className="tl-x" aria-label="Fermer" onClick={fermer}><X size={18} aria-hidden="true" /></button></div>
          <label className="tl-lbl" htmlFor="tl-quoi">Quoi</label>
          <input id="tl-quoi" className="tl-in" type="text" autoFocus autoComplete="off" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Commander les capsules…" />
          <div className="tl-row">
            <button type="button" className="tl-sec" disabled={!titre.trim()} onClick={() => poser(false)}>Sans date</button>
            <button type="submit" className="tl-cta" disabled={!titre.trim()}><Plus size={18} aria-hidden="true" />Poser au {jourMois(dateChoisie)}</button>
          </div>
        </form>
      )}
    </section>
  );
};
