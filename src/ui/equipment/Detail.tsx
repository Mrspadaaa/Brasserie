import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Boxes, Check, MoreHorizontal, ShoppingCart, Wrench, X } from 'lucide-react';
import type { EquipmentItem, EquipmentReading } from '../../types';
import type { FinanceTransaction } from '../../domain/finance/types';
import {
  calibrationPreset, dateCourte, equipmentStatus, markBroken, markRepaired, nextDueAfter, readingDelta, readingOk,
  recordDone, relatedExpenses, retire,
} from '../../domain/equipment';
import { ConfirmSheet } from '../Sheet';
import { EquipmentPicto } from './ListPictos';
import { EquipmentEditSheet } from './DetailEdit';
import {
  ETATS, RYTHMES, chf, decimalesLecture, etapesDe, filPanneau, filtrerSaisie, fmt, fmtEcart, historique, lireNombre,
  etiquetteTampon, prochain, rythmeActif, sousTitre, titreEtat,
} from './DetailModel';
import './detail.css';

/**
 * Fiche d'un appareil (za3, port 15.11 ; son choix, règle n° 1). Interface fixée dans PORT.md.
 *   layout 'sheet' : dans la feuille (390) : titre, état, fil de l'appareil, rythme et état, dépenses reliées, pied collé en bas ;
 *   layout 'pane'  : panneau à 1280 : le fil de l'appareil (même échelle que la liste) à gauche, la fiche à droite.
 *   onChange(item, toast?) : l'appareil modifié ; `toast` = la phrase du bandeau (« Étalonné · à jour jusqu'au 14.12 »), à montrer avec Annuler,
 *   l'appelant gardant l'appareil d'avant. Sans `toast`, rien à annoncer (une pastille de rythme, une correction).
 * Les gestes (Étalonné, Fait, Réparée, Vendu, Réformé) sont les fonctions pures du domaine ; rien n'est écrit ici.
 */
export interface EquipmentDetailProps {
  item: EquipmentItem;
  batches: { brewDate?: string }[];
  transactions: FinanceTransaction[];
  /** AAAA-MM-JJ */
  today: string;
  layout: 'sheet' | 'pane';
  onChange: (item: EquipmentItem, toast?: string) => void;
  onClose: () => void;
  onPayMaintenance: (item: EquipmentItem) => void;
  onDelete: (item: EquipmentItem) => void;
}

/** Les flacons de tampon (pH 7 jaune, pH 4 rouge, pH 10 bleu) ; l'eau pure en bleu clair. */
const couleurFlacon = (label: string): string => {
  if (/(^|\D)7(?!\d)/.test(label)) return '#E8C640';
  if (/(^|\D)4(?!\d)/.test(label)) return '#D9534F';
  if (/(^|\D)10(?!\d)/.test(label)) return '#4F7EC9';
  return '#8DB8D8';
};

const Flacon: React.FC<{ couleur: string }> = ({ couleur }) => (
  <svg viewBox="0 0 16 28" width="16" height="28" aria-hidden="true" focusable="false">
    <rect x="5" y="1" width="6" height="4" rx="1" fill={couleur} />
    <path d="M5.5 5h5v3l3.5 3v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V11l3.5-3z" className="eqd-flacon-verre" strokeWidth="1.2" />
    <path d="M3 15h10v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" fill={couleur} />
  </svg>
);

/** « pH 7,00 » : le texte, puis le nombre en chiffres à chasse fixe. */
const EtiquetteMesure: React.FC<{ label: string }> = ({ label }) => {
  const m = /^(.*?)(\d+[.,]\d+.*)$/.exec(label);
  return m ? <>{m[1]}<span className="eqd-m">{m[2]}</span></> : <>{label}</>;
};

export const EquipmentDetail: React.FC<EquipmentDetailProps> = ({
  item, batches, transactions, today, layout, onChange, onClose, onPayMaintenance, onDelete,
}) => {
  const ctx = useMemo(() => ({ today, batches }), [today, batches]);
  const status = equipmentStatus(item, ctx);
  const preset = calibrationPreset(item);
  const enPanne = status.kind === 'panne';
  const calibre = !!preset && !enPanne && !item.retired;
  const etalonnable = !!preset;
  // Décimales : celles de la tolérance, des lectures gardées et du pH (centième) ; les écarts y ajoutent celles de la saisie en cours.
  const lusGardes = useMemo(() => (item.history ?? []).flatMap(e => (e.readings ?? []).map(r => r.read)), [item.history]);
  const decBase = decimalesLecture(preset ?? { tolerance: 0.01 }, lusGardes);
  const titre = titreEtat(status, item.retired);
  const brassins = sousTitre(item, batches);
  const histo = useMemo(() => historique(item, decBase), [item, decBase]);
  const suite = prochain(item, today, etalonnable);
  const depenses = useMemo(() => relatedExpenses(item, transactions), [item, transactions]);

  // Saisie en cours : valeurs lues (texte tel que tapé) et étapes cochées à la main. Remises à zéro quand on change d'appareil.
  const [lectures, setLectures] = useState<string[]>([]);
  const [cochees, setCochees] = useState<string[]>([]);
  const [menu, setMenu] = useState(false);
  const [encore, setEncore] = useState(false);
  const [edition, setEdition] = useState(false);
  const [suppression, setSuppression] = useState(false);
  useEffect(() => { setLectures([]); setCochees([]); setMenu(false); setEncore(false); }, [item.ref]);
  // Un appareil à jour (juste étalonné, ou fait) ne redemande pas son geste : formulaire et action principale sont repliés sous « … quand même ».
  const aJour = status.kind === 'avenir' && !item.retired;
  const ouvert = !aJour || encore;
  useEffect(() => { setEncore(false); }, [status.kind]);

  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const ouvertAuClavier = useRef(false);
  useEffect(() => {
    if (!menu) return;
    // Le focus va au premier choix seulement si le menu s'est ouvert au clavier ; au toucher ou à la souris, au conteneur : pas d'anneau (N4).
    if (ouvertAuClavier.current) menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    else menuRef.current?.focus({ preventScroll: true });
    const dehors = (e: PointerEvent) => {
      const cible = e.target as Node;
      if (!menuRef.current?.contains(cible) && !(cible as HTMLElement).closest?.('[data-eqd-menu-bouton]')) setMenu(false);
    };
    document.addEventListener('pointerdown', dehors);
    return () => document.removeEventListener('pointerdown', dehors);
  }, [menu]);

  const valeur = (i: number): number | null => lireNombre(lectures[i] ?? '');
  const decimales = decimalesLecture(preset ?? { tolerance: 0.01 }, [...lusGardes, ...lectures.map(t => lireNombre(t ?? '')).filter((n): n is number => n !== null)]);
  const lisibles: EquipmentReading[] = calibre && preset
    ? preset.points.flatMap((p, i) => { const read = valeur(i); return read === null ? [] : [{ label: p.label, expected: p.expected, read }]; })
    : [];

  const finir = () => { if (layout === 'sheet') onClose(); };
  const faire = () => {
    if (enPanne) {
      onChange(markRepaired(item, { date: today }), 'Réparée');
      return finir();
    }
    const fait = recordDone(item, { date: today, readings: lisibles.length ? lisibles : undefined });
    const jusqu = nextDueAfter(fait, today);
    const mot = calibre ? 'Étalonné' : 'Fait';
    onChange(fait, jusqu ? `${mot} · à jour jusqu'au ${dateCourte(jusqu)}` : mot);
    setLectures([]); setCochees([]);
    finir();
  };

  const choisirEtat = (etat: string) => {
    if (etat === item.state) return;
    if (etat === 'À réparer') return onChange(item.brokenSince ? { ...item, state: etat } : markBroken(item, { date: today }));
    const repare = item.brokenSince ? markRepaired(item, { date: today }) : item;
    onChange({ ...repare, state: etat });
  };
  const choisirRythme = (id: string) => {
    const choix = RYTHMES.find(c => c.id === id);
    if (!choix || rythmeActif(item) === id) return;
    onChange({ ...item, rhythm: { every: choix.every, unit: choix.unit } });
  };
  const sortir = (reason: 'vendu' | 'réformé') => {
    setMenu(false);
    onChange(retire(item, { date: today, reason }), `${item.name} · ${reason}`);
    onClose();
  };

  const tol = preset?.tolerance ?? 0;
  const etapes = preset ? etapesDe(preset.points) : [];
  const etapeFaite = (e: { key: string; pointIndex: number | null }) => cochees.includes(e.key) || (e.pointIndex !== null && valeur(e.pointIndex) !== null);
  const basculer = (e: { key: string; pointIndex: number | null }) => {
    if (e.pointIndex !== null && valeur(e.pointIndex) !== null) return;
    setCochees(c => c.includes(e.key) ? c.filter(k => k !== e.key) : [...c, e.key]);
  };

  const principal = enPanne ? 'Réparée' : calibre ? 'Étalonné' : 'Fait';
  const PrincipalIcone = enPanne ? Wrench : Check;

  const gestion = (
    <div className="eqd-gestion">
        <button type="button" className="eqd-rd" data-eqd-menu-bouton aria-label="Gestion du matériel : modifier, vendu, réformé, supprimer"
          aria-haspopup="menu" aria-expanded={menu} aria-controls={menu ? menuId : undefined} onClick={(e) => { ouvertAuClavier.current = e.detail === 0; setMenu(o => !o); }}>
          <MoreHorizontal size={20} aria-hidden="true" />
        </button>
        {menu && (
          <div id={menuId} ref={menuRef} role="menu" aria-label="Gestion du matériel" className="eqd-menu" tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { e.stopPropagation(); setMenu(false); return; }
              const items = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]')];
              const i = items.indexOf(document.activeElement as HTMLElement);
              if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length]?.focus(); }
              if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length]?.focus(); }
            }}>
            <button type="button" role="menuitem" onClick={() => { setMenu(false); setEdition(true); }}>Modifier</button>
            <button type="button" role="menuitem" onClick={() => sortir('vendu')}>Vendu</button>
            <button type="button" role="menuitem" onClick={() => sortir('réformé')}>Réformé</button>
            <button type="button" role="menuitem" className="eqd-danger" onClick={() => { setMenu(false); setSuppression(true); }}>Supprimer</button>
          </div>
        )}
    </div>
  );
  const entete = (
    <>
    {layout === 'sheet' && (
      <div className="eqd-barre">
        <button type="button" className="eqd-retour" aria-label="Retour à Stocks · Matériel" onClick={onClose}><ArrowLeft size={20} aria-hidden="true" /><Boxes size={20} className="eqd-houblon" aria-hidden="true" />Stocks · Matériel</button>
        <span className="eqd-sp" />
        {gestion}
      </div>
    )}
    <div className="eqd-titre">
      <span className="eqd-gpic"><EquipmentPicto name={item.name} /></span>
      <div className="eqd-nom">
        <h1>{item.name}</h1>
        <div className="eqd-sous">
          {brassins.categorie}{brassins.brassins > 0 && <> · utilisé dans <span className="eqd-m">{brassins.brassins}</span> {brassins.brassins > 1 ? 'brassins' : 'brassin'}</>}
        </div>
      </div>
      {layout === 'pane' && <><span className="eqd-sp" />{gestion}</>}
    </div>
    </>
  );

  const etat = (
    <div className="eqd-etat">
      <b>{titre.fort}</b>
      {titre.doux && <span>{/\d\d\.\d\d/.test(titre.doux)
        ? titre.doux.split(/(\d\d\.\d\d)/).map((part, i) => /^\d\d\.\d\d$/.test(part) ? <span key={i} className="eqd-m">{part}</span> : part)
        : titre.doux}</span>}
    </div>
  );

  const etapesEtSaisie = calibre && ouvert && preset && (
    <>
      <div className="eqd-etapes" role="group" aria-label="Étapes de l'étalonnage">
        {etapes.map((e, i) => {
          const faite = etapeFaite(e);
          return (
            <React.Fragment key={e.key}>
              {i > 0 && <i className="eqd-lien" aria-hidden="true" />}
              <button type="button" className={`eqd-et${faite ? '' : ' eqd-afaire'}`} aria-pressed={faite} onClick={() => basculer(e)}>
                {faite && <Check size={15} strokeWidth={2.4} aria-hidden="true" />}{e.label}
              </button>
            </React.Fragment>
          );
        })}
      </div>
      <div className="eqd-form">
        {preset.points.map((p, i) => {
          const lu = valeur(i);
          const delta = readingDelta(p, lu);
          const bon = readingOk(p, lu, tol);
          return (
            <div className="eqd-fl" key={p.label}>
              <span className="eqd-tamp"><Flacon couleur={couleurFlacon(p.label)} /><span><EtiquetteMesure label={etiquetteTampon(p, preset.unit)} /></span></span>
              <label className="eqd-champ">
                <input
                  aria-label={`Valeur lue pour ${etiquetteTampon(p, preset.unit)}`}
                  type="text" inputMode="decimal" autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="next"
                  placeholder="—" value={lectures[i] ?? ''} aria-invalid={lu !== null && !bon}
                  onChange={(e) => { const v = filtrerSaisie(e.target.value); setLectures(l => { const n = [...l]; n[i] = v; return n; }); }}
                />
                <small>{preset.unit && preset.unit !== 'pH' ? preset.unit : 'lu'}</small>
              </label>
              <span className={`eqd-ecart${lu !== null && !bon ? ' eqd-hors' : ''}`}
                aria-label={delta === null ? undefined : `écart ${fmtEcart(delta, decimales)}, ${bon ? 'dans' : 'hors de'} la tolérance`}>
                {delta !== null && <>{fmtEcart(delta, decimales)}{bon ? <Check size={15} strokeWidth={2.4} aria-hidden="true" /> : <X size={15} strokeWidth={2.4} aria-hidden="true" />}</>}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );

  const rythmeEtat = (
    <div className="eqd-regl">
      <div className="eqd-rg"><span className="eqd-lab2" id={`${menuId}-r`}>Rythme</span>
        <div className="eqd-seg" role="radiogroup" aria-labelledby={`${menuId}-r`}>
          {RYTHMES.map(c => (
            <button key={c.id} type="button" role="radio" aria-checked={rythmeActif(item) === c.id} onClick={() => choisirRythme(c.id)}><span>{c.label}</span></button>
          ))}
        </div></div>
      <div className="eqd-rg"><span className="eqd-lab2" id={`${menuId}-e`}>État</span>
        <div className="eqd-seg" role="radiogroup" aria-labelledby={`${menuId}-e`}>
          {ETATS.map(s => (
            <button key={s} type="button" role="radio" aria-checked={item.state === s} onClick={() => choisirEtat(s)}><span>{s}</span></button>
          ))}
        </div></div>
    </div>
  );

  const deps = (
    <div className="eqd-deps">
      <div className="eqd-dt">Dépenses reliées
        <small>{depenses.known > 0 ? `${chf(depenses.totalCents)} · ${depenses.known} prix connu${depenses.known > 1 ? 's' : ''}` : 'aucun prix connu'}</small>
      </div>
      {depenses.lines.map((l, i) => (
        <div className="eqd-dep" key={`${l.txId ?? 'achat'}-${l.lineId ?? i}`}>
          <span className="eqd-d">{l.date ? dateCourte(l.date) : '—'}</span>
          <span className="eqd-dlib">{l.label}</span>
          {l.amountCents !== null
            ? <span className="eqd-v eqd-montant">{chf(l.amountCents)}</span>
            : <span className="eqd-v eqd-inconnu">{l.date ? 'prix inconnu' : 'date et prix inconnus'}</span>}
        </div>
      ))}
    </div>
  );

  const pied = (
    <div className="eqd-pied">
      <button type="button" className="eqd-btn eqd-sec" onClick={() => onPayMaintenance(item)}><ShoppingCart size={20} aria-hidden="true" />Payer un entretien</button>
      {aJour && !encore
        ? <button type="button" className="eqd-btn eqd-sec" onClick={() => setEncore(true)}>{calibre ? 'Étalonner quand même' : 'Faire quand même'}</button>
        : <button type="button" className="eqd-btn eqd-pri" onClick={faire}><PrincipalIcone size={20} strokeWidth={2} aria-hidden="true" />{principal}</button>}
    </div>
  );

  const verbeAujourdhui = enPanne ? 'Réparer' : calibre ? 'Étalonner' : status.verb.charAt(0).toLocaleUpperCase('fr') + status.verb.slice(1);

  const modales = (
    <>
      {edition && <EquipmentEditSheet item={item} onClose={() => setEdition(false)} onSave={(modifie) => onChange(modifie)} />}
      <ConfirmSheet
        open={suppression}
        onClose={() => setSuppression(false)}
        title="Supprimer ce matériel ?"
        what={`${item.name} — ${item.category}`}
        consequence="Il quitte l’inventaire. La suppression est journalisée."
        confirmLabel="Supprimer"
        onConfirm={() => { setSuppression(false); onDelete(item); onClose(); }}
      />
    </>
  );

  if (layout === 'pane') {
    const fil = filPanneau(item, status, today, decBase, etalonnable);
    return (
      <div className="eqd eqd-pane" data-layout="pane">
        <section className="eqd-dfil" aria-label="Le fil de l'appareil">
          <div className="eqd-bande" style={{ top: fil.bande.top, height: fil.bande.height }}><span>30 j</span></div>
          <div className="eqd-daxe" style={{ bottom: 120 }} />
          {fil.reperes.map(r => <React.Fragment key={r.label + r.y}><span className="eqd-tick" style={{ top: r.y }} /><span className="eqd-mo" style={{ top: r.y }}>{r.label}</span></React.Fragment>)}
          {fil.points.map(p => (
            <div className="eqd-de" style={{ top: p.y }} key={p.id}>
              <span className="eqd-pt2"><i className={`eqd-pn eqd-${p.style}`} /></span>
              <div className="eqd-t"><b>{dateCourte(p.date)}</b><span>{p.texte}</span></div>
            </div>
          ))}
          {fil.coupure && <span className="eqd-coupure" style={{ top: 440 }} aria-hidden="true" />}
          <div className="eqd-daujl" style={{ top: fil.aujourdhui }} />
          <div className="eqd-dnoeud" style={{ top: fil.aujourdhui - 9 }} />
        </section>
        <div className="eqd-col">
          {entete}
          {etat}
          {deps}
          {calibre && ouvert && (
            <div className="eqd-bloc">
              <div className="eqd-evl"><b>{verbeAujourdhui}</b><span className="eqd-v eqd-tol">tolérance ±{fmt(tol, decBase)}</span></div>
              {etapesEtSaisie}
            </div>
          )}
          {rythmeEtat}
          {pied}
        </div>
        {modales}
      </div>
    );
  }

  return (
    <div className="eqd eqd-sheet" data-layout="sheet">
      {entete}
      {etat}
      <div className="eqd-ffil" aria-label="Le fil de l'appareil">
        {suite && (
          <div className="eqd-ev">
            <span className="eqd-pt eqd-prochain" />
            <div className="eqd-evl"><span className="eqd-d">{suite.date ? dateCourte(suite.date) : '—'}</span><span className="eqd-doux">{suite.texte}</span></div>
          </div>
        )}
        <div className="eqd-ev">
          <span className="eqd-pt eqd-mnt" />
          <div className="eqd-evl"><span className="eqd-d">{dateCourte(today)}</span>{status.kind === 'avenir' ? <span className="eqd-doux">à jour</span> : <b>{verbeAujourdhui}</b>}
            {calibre && ouvert && <span className="eqd-v eqd-tol">tolérance ±{fmt(tol, decBase)}</span>}
          </div>
          {etapesEtSaisie}
        </div>
        {enPanne && item.brokenSince && !histo.some(h => h.kind === 'panne' && h.date === item.brokenSince) && (
          <div className="eqd-ev">
            <span className="eqd-pt eqd-panne" />
            <div className="eqd-evl"><span className="eqd-d">{dateCourte(item.brokenSince)}</span>En panne</div>
          </div>
        )}
        {histo.map((h, i) => (
          <div className="eqd-ev" key={`${h.date}-${h.kind}-${i}`}>
            <span className={`eqd-pt ${h.kind === 'panne' ? 'eqd-panne' : h.kind === 'sortie' ? '' : 'eqd-ok'}`} />
            <div className="eqd-evl"><span className="eqd-d">{dateCourte(h.date)}</span>{h.label}{h.valeur && !(h.kind === 'panne' && h.valeur === item.brokenNote) && <span className="eqd-v">{h.valeur}</span>}</div>
          </div>
        ))}
      </div>
      {rythmeEtat}
      {deps}
      {pied}
      {modales}
    </div>
  );
};
