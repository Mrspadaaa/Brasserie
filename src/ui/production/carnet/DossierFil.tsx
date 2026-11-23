import React, { useState } from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import type { Batch } from '../../../types';
import { BATCH_STATUS } from '../../../domain/batchStatus';
import type { StatusOption } from '../../../domain/batchTransitions';
import { nombreFr } from '../../../domain/nombreAffiche';
import { formatDecimal, parseDecimal } from '../../numericInput';
import { Panneau } from '../fiche/ui';
import { fgBande, jourN, marcheActuelle, palierStable } from '../fiche/ficheModel';
import { dryHopsAttendus, libelleDryHop } from './carnetModel';
import { famillesDuHoublon } from './PictosHoublons';
import { JeuPictos, Picto } from '../../hopIndex/Pictos';

/** e3gb : le dossier d'un brassin en fermentation (ticket de la recette figée, plan, gestes d'étape). */

const BTN = "relative min-h-11 rounded-control border border-cave-700 bg-cave-850 px-3 text-[15px] text-cave-50 inline-flex items-center justify-center gap-1.5 after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-['']";
const ETAPES = ['Brassé', 'Ferment.', 'Garde', 'Cond.', 'Terminé'];
const FLECHE_DEBUT = 'polygon(0 0,calc(100% - 8px) 0,100% 50%,calc(100% - 8px) 100%,0 100%)';
const FLECHE = 'polygon(0 0,calc(100% - 8px) 0,100% 50%,calc(100% - 8px) 100%,0 100%,8px 50%)';

const sg3 = (v: number) => v.toFixed(3).replace('.', ',');
const jn = (n: number) => (n <= 0 ? 'J0' : `J+${n}`);

interface Ligne { cle: string; nom: string; detail?: string; quantite: string; etat: 'sorti' | 'reserve' | 'attend'; }

/** Le plan de fermentation de la recette figée : périodes en J0 → J+n, la garde « dès J+n ». */
export function lignesPlan(batch: Batch): { cle: string; label: string; valeur: string }[] {
  const out: { cle: string; label: string; valeur: string }[] = [];
  let jour = 0;
  (batch.recipeSnapshot?.fermentation ?? []).forEach((s, i) => {
    if (s.kind === 'ajout' || !Number.isFinite(s.tempC)) return;
    const nom = s.kind === 'primaire' ? 'Fermentation' : s.kind === 'reposDiacetyle' ? 'Repos' : s.kind === 'garde' ? 'Garde' : s.kind === 'refermentation' ? 'Refermentation' : s.name;
    const jours = Math.max(1, Math.round(s.days || 1));
    const periode = s.kind === 'garde' ? `dès ${jn(jour)}` : jours === 1 ? jn(jour) : `${jn(jour)} → ${jn(jour + jours - 1)}`;
    out.push({ cle: `p${i}`, label: `${nom} · ${periode}`, valeur: `${nombreFr(s.tempC, 1)} °C` });
    jour += jours;
  });
  return out;
}

/** La recette figée du brassin : jamais le catalogue d'aujourd'hui. Coché = sorti du stock ; carré ambre = réservé (dry hop). */
export function lignesTicket(batch: Batch): Ligne[] {
  const r = batch.recipeSnapshot;
  if (!r) return [];
  const sorti = !!batch.stockConsumption?.appliedAt;
  const enAttente = (batch.stockConsumption?.pendingItems ?? []).length > 0;
  const etat = (): Ligne['etat'] => (sorti ? 'sorti' : 'attend');
  const lignes: Ligne[] = [];
  (r.fermentables ?? []).forEach((f, i) => lignes.push({ cle: `f${i}`, nom: f.name, quantite: `${nombreFr(f.weightKg, 2)} kg`, etat: etat() }));
  (r.adjuncts ?? []).forEach((a, i) => lignes.push({ cle: `a${i}`, nom: a.name, detail: a.step ? a.step.toLowerCase() : undefined, quantite: `${nombreFr(a.amount, 2)} ${a.unit}`, etat: etat() }));
  if (r.yeast?.name) lignes.push({ cle: 'y', nom: r.yeast.name, quantite: r.yeast.qty ? `${nombreFr(r.yeast.qty, 2)} ${r.yeast.unit ?? ''}`.trim() : 'dose non saisie', etat: etat() });
  (r.hops ?? []).forEach((h, i) => {
    const alpha = h.alpha > 0 ? `α ${nombreFr(h.alpha, 1)} %` : 'α non saisi';
    const moment = h.stage === 'dryHop' ? (typeof h.dayOffset === 'number' ? jn(h.dayOffset) : 'à cru')
      : h.stage === 'whirlpool' ? 'whirlpool' : h.stage === 'firstWort' ? 'premier moût' : (typeof h.timeMin === 'number' ? `${nombreFr(h.timeMin, 0)}′` : 'ébullition');
    lignes.push({ cle: `h${i}`, nom: h.name, detail: `${alpha} · ${moment}`, quantite: `${formatDecimal(h.weightG, 0)} g`,
      etat: h.stage === 'dryHop' && enAttente ? 'reserve' : etat() });
  });
  return lignes;
}

/** Le titre-réponse : la question « qu'est-ce qui est encore au stock ? ». */
export function titreStock(batch: Batch): string {
  if (batch.stockAccountingVersion !== 1) return 'Le stock de ce brassin est à confirmer.';
  if (!batch.stockConsumption?.appliedAt) return 'Le stock du brassage n’est pas encore sorti.';
  const reserve = (batch.stockConsumption.pendingItems ?? []).length > 0;
  if (!reserve) return 'Tout est sorti du stock.';
  return (batch.recipeSnapshot?.hops ?? []).some(h => h.stage === 'dryHop') ? 'Tout est sorti du stock, sauf le dry hop.' : 'Tout est sorti du stock, sauf les ajouts de fermentation.';
}

/** Le rappel du pied : le prochain dry hop réservé ; au jour J (ou en retard), le geste qui le confirme. `null` sans réservation. */
export function rappelDryHop(batch: Batch, now: number): { texte: string; jour: boolean } | null {
  const attendus = dryHopsAttendus(batch, (batch.stockConsumption?.pendingItems ?? []).length > 0);
  if (!attendus.length) return null;
  const n = jourN(batch, now)?.n ?? null;
  const avecJour = attendus.filter(h => typeof h.dayOffset === 'number');
  const prochain = avecJour.length ? Math.min(...avecJour.map(h => h.dayOffset as number)) : null;
  const lot = prochain === null ? attendus : attendus.filter(h => h.dayOffset === prochain);
  const noms = new Map<string, number>();
  lot.forEach(h => noms.set(h.name, (noms.get(h.name) ?? 0) + h.weightG));
  const libelle = libelleDryHop([...noms].map(([nom, g]) => ({ nom, g })));
  if (prochain === null || n === null) return { texte: `Dry hop ${libelle} · réservés`, jour: false };
  const ecart = prochain - n;
  if (ecart > 1) return { texte: `${jn(prochain)} · dry hop ${libelle} · réservés`, jour: false };
  if (ecart === 1) return { texte: `Demain · dry hop ${libelle} · réservés`, jour: false };
  return { texte: `${ecart < 0 ? 'En retard · ' : ''}Dry hop ajouté · ${libelle}`, jour: true };
}

const Rang: React.FC<{ label: React.ReactNode; valeur?: string; fin?: React.ReactNode; fond?: boolean }> = ({ label, valeur, fin, fond }) => (
  <div className={`grid min-h-[34px] grid-cols-[1fr_auto_22px] items-center gap-2 px-3 text-[15px] text-cave-200 ${fond ? 'bg-attention/12' : ''}`}>
    <span>{label}</span><span className="text-right tabular-nums text-cave-50">{valeur}</span><span className="flex justify-center">{fin}</span>
  </div>
);

export interface DossierProps {
  batch: Batch;
  now: number;
  suivant: Batch['status'] | null;
  options: StatusOption[];
  blocage: string | null;
  onStatut: (s: Batch['status']) => void;
  onSupprimer: () => void;
  /** Le bouton Budget et le compagnon sont ceux de la feuille (dialogue, chat) : donnés tels quels. */
  budget: (cls: string) => React.ReactNode;
  compagnon: React.ReactNode;
}

/** Corps de la rubrique Dossier d'un brassin en fermentation. */
export const DossierFil: React.FC<DossierProps> = ({ batch, now, suivant, options, blocage, onStatut, onSupprimer, budget, compagnon }) => {
  const [retour, setRetour] = useState(false);
  const [chat, setChat] = useState(false);
  const lignes = lignesTicket(batch);
  const plan = lignesPlan(batch);
  const j0 = jourN(batch, now)?.date ?? batch.brewDate ?? null;
  const bande = fgBande(batch);
  const og = parseDecimal(batch.og || '') ?? batch.recipeSnapshot?.ogTarget ?? null;
  const ogMesuree = parseDecimal(batch.og || '') !== null;
  const palier = palierStable(batch, now);
  const pasStable = !palier || !palier.egaux;
  const empatage = (batch.recipeSnapshot?.mash?.steps ?? []).filter(s => Number.isFinite(s.tempC));
  const courant = marcheActuelle(batch) + 1;
  const dehors = options.filter(o => o.kind === 'back' || o.kind === 'cancel');
  return (
    <div className="space-y-2.5" data-dossier>
      <h3 className="text-[19px] font-semibold leading-snug text-cave-50">{titreStock(batch)}</h3>
      <div className="flex gap-0.5" role="list" aria-label="Étapes du brassin">
        {ETAPES.map((t, i) => (
          <span key={t} role="listitem" aria-current={i === courant ? 'step' : undefined}
            style={{ clipPath: i === 0 ? FLECHE_DEBUT : FLECHE }}
            className={`flex min-h-[30px] flex-1 items-center justify-center text-[13px] ${i < courant ? 'bg-hop/20 font-semibold text-hop' : i === courant ? 'bg-ebc-straw font-semibold text-cave-950' : 'bg-cave-850 text-cave-400'}`}>{t}</span>
        ))}
      </div>
      <Panneau label="Recette figée" className="overflow-hidden !p-0">
        <h4 className="flex items-baseline justify-between border-b border-cave-700 px-3 py-2.5 text-lg font-semibold text-cave-50">
          <span>Recette figée</span>
          <small className="text-[13px] font-normal text-cave-400">{[j0, batch.volumeL ? `${nombreFr(batch.volumeL, 1)} L` : null].filter(Boolean).join(' · ')}</small>
        </h4>
        {!batch.recipeSnapshot && <p className="px-3 py-2 text-[15px] text-cave-400">Recette figée absente de ce brassin.</p>}
        {lignes.map(l => (
          <Rang key={l.cle} fond={l.etat === 'reserve'} valeur={l.quantite}
            label={<>{l.nom}{l.detail && <small className="ml-1.5 text-[13px] text-cave-400">{l.detail}</small>}</>}
            fin={l.etat === 'sorti' ? <Check size={16} className="text-hop" aria-label="Sorti du stock" />
              : l.etat === 'reserve' ? <i role="img" aria-label="Réservé, pas encore sorti du stock" className="block h-4 w-4 rounded border-2 border-attention" />
              : <i role="img" aria-label="Pas encore sorti du stock" className="block h-4 w-4 rounded border-2 border-cave-600" />} />
        ))}
        <div className="mx-3 my-1 h-px bg-cave-800" />
        <Rang label={ogMesuree ? 'OG' : 'OG visée'} valeur={og !== null ? sg3(og) : 'non mesurée'} />
        {empatage.length > 0 && <Rang label="Empâtage" valeur={empatage.map(s => `${nombreFr(s.tempC, 1)} °C`).join(' · ')} />}
        {plan.map(p => <Rang key={p.cle} label={p.label} valeur={p.valeur} />)}
        <Rang label="FG visée" valeur={bande ? `${sg3(bande[0])} à ${sg3(bande[1])}` : 'non renseignée'} />
      </Panneau>
      <div className="grid grid-cols-2 gap-2">
        {suivant
          ? <button type="button" onClick={() => onStatut(suivant)} className={BTN}>Passer en {BATCH_STATUS[suivant].label.toLowerCase()}{pasStable && <small className="ml-1.5 text-xs font-semibold text-attention">pas stable</small>}</button>
          : <span />}
        <button type="button" aria-expanded={retour} onClick={() => setRetour(v => !v)} className={BTN}>Revenir · abandon <ChevronDown size={16} aria-hidden="true" /></button>
        {retour && <div className="col-span-2 grid gap-2" role="group" aria-label="Revenir ou abandonner">
          {dehors.map(o => <button key={o.status} type="button" onClick={() => onStatut(o.status)} className={`${BTN} ${o.kind === 'cancel' ? 'text-alert' : ''}`}>
            {o.kind === 'back' ? `Revenir à « ${BATCH_STATUS[o.status].label} »` : 'Annulé (abandon)'}</button>)}
        </div>}
        {budget(BTN)}
        <button type="button" aria-expanded={chat} onClick={() => setChat(v => !v)} className={BTN}>Compagnon <ChevronRight size={16} aria-hidden="true" className={chat ? 'rotate-90' : ''} /></button>
      </div>
      {blocage && <p className="text-2xs leading-snug text-cave-400">{blocage}</p>}
      {chat && compagnon}
      <button type="button" onClick={onSupprimer} className="relative min-h-11 w-full rounded-control border border-alert/50 px-3 text-[15px] font-semibold text-alert">Supprimer le brassin</button>
    </div>
  );
};

/** Le pied de la rubrique Dossier : le rappel du dry hop réservé ; au jour J, le geste « Dry hop ajouté » (confirmation des ajouts). */
export const DossierPied: React.FC<{ batch: Batch; now: number; ajoute: () => void }> = ({ batch, now, ajoute }) => {
  const r = rappelDryHop(batch, now);
  if (!r) return null;
  const cls = 'flex min-h-12 w-full items-center gap-2 rounded-2xl bg-cave-850 px-3 text-left text-sm text-cave-50 shadow-lg';
  const pastille = <i className="h-2.5 w-2.5 shrink-0 rounded-full bg-attention" aria-hidden="true" />;
  // e3gb n° 1 : les pictos des familles des houblons attendus, devant le texte du rappel.
  const pictos = [...new Set(dryHopsAttendus(batch, true).flatMap(h => famillesDuHoublon(batch, h.name)))].slice(0, 3)
    .map(f => <Picto key={f} famille={f} taille={16} />);
  return r.jour
    ? <button type="button" onClick={ajoute} className={cls}>{pastille}{pictos.length > 0 && <JeuPictos />}{pictos}<span>{r.texte}</span></button>
    : <div role="status" className={cls}>{pastille}{pictos.length > 0 && <JeuPictos />}{pictos}<span>{r.texte}</span></div>;
};
