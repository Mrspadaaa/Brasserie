import React, { useState } from 'react';
import { Check, Mic, Pencil, Sparkles } from 'lucide-react';
import type { Batch } from '../../../types';
import { Panneau, Pastille } from '../fiche/ui';
import { jourN } from '../fiche/ficheModel';
import { ETIQUETTE, construireFil, decalerJour, essaiDe, jourLong, vracDe, type Bulle, type JourFil, type TypeEntree } from './carnetModel';
import { LignesDryHop } from './PictosHoublons';
import { JeuPictos } from '../../hopIndex/Pictos';
import type { MorceauPropose } from './rangement';
import type { CarnetControleur } from './useCarnet';
import { HopTastingsPanel } from '../../hopIndex/HopTastingsPanel';

/** e3gb : le fil, la note en vrac posée sur aujourd'hui (rubrique Carnet d'un brassin en fermentation). */

const BULLE: Record<Exclude<TypeEntree, 'vrac'>, string> = {
  cuve: 'bg-water/15 border-water/45', degustation: 'bg-hop/15 border-hop/45',
  brassage: 'bg-area-production/12 border-area-production/45', incident: 'bg-alert/10 border-alert/45'
};
const ROND = 'relative flex h-[76px] w-[76px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-full bg-ebc-straw text-sm font-semibold text-cave-950 shadow-[0_0_0_5px_rgb(var(--ebc-straw)/0.14)] disabled:opacity-60';
const ROND_ICO = 'h-6 w-6';
/** Cible de 44 px (pseudo-élément) pour un contrôle plus petit à l'œil. */
const CIBLE = "relative after:absolute after:left-1/2 after:top-1/2 after:h-11 after:min-w-11 after:w-full after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']";
const ICONE = `${CIBLE} flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-cave-200`;

/** Les morceaux qu'on peut poser tout de suite : un jour, un autre brassin ou le prochain essai. */
const nbAcceptables = (props: MorceauPropose[]) => props.filter(p => p.type === 'prochain-essai' || !!p.brassin || p.jour !== null).length;

const libelleMorceau = (m: MorceauPropose) => m.brassin ? `Autre brassin → ${m.brassin.libelle}` : m.type === 'prochain-essai' ? 'Prochain essai · proposé' : m.jour === null ? `${ETIQUETTE[m.type]} · quel jour ?` : `${ETIQUETTE[m.type]} · proposé`;

/** Un morceau proposé : à accepter (✓) ou à corriger (✎), sur place. */
const Propose: React.FC<{ m: MorceauPropose; c: CarnetControleur; jours: { jour: string; nom: string }[] }> = ({ m, c, jours }) => {
  const [edition, setEdition] = useState(false);
  const [texte, setTexte] = useState(m.texte);
  const sansJour = m.jour === null && !m.brassin && m.type !== 'prochain-essai';
  const acceptable = !sansJour;
  return (
    <div data-propose={m.id} className="rounded-2xl border-2 border-attention/75 bg-cave-900 py-1 pl-3 pr-0.5 text-[15px] leading-snug text-cave-50">
      <div className="grid grid-cols-[1fr_44px_44px] items-center gap-0.5">
        <div className="min-w-0 py-1">
          <small className="block text-xs font-semibold text-attention">{libelleMorceau(m)}</small>
          {edition
            ? <textarea aria-label="Corriger le morceau" rows={3} autoFocus value={texte} onChange={e => setTexte(e.target.value)} className="mt-1 w-full rounded-control border border-cave-700 bg-cave-950 p-2 text-base text-cave-50" />
            : m.texte}
          {sansJour && !edition && (
            <div className="mt-1 flex gap-1.5" role="group" aria-label="Quel jour ?">
              {jours.map(j => <button key={j.jour} type="button" aria-pressed={m.jour === j.jour} onClick={() => c.choisirJour(m.id, j.jour)}
                className="relative min-h-11 rounded-full border border-cave-700 bg-cave-850 px-3 text-[15px] text-cave-50 aria-pressed:border-ebc-straw aria-pressed:font-semibold">{j.nom}</button>)}
            </div>
          )}
        </div>
        <button type="button" aria-label="Accepter" disabled={!acceptable || edition} onClick={() => c.accepter(m.id)} className={`${ICONE} bg-hop/15 text-hop disabled:opacity-40`}><Check size={20} aria-hidden="true" /></button>
        <button type="button" aria-label={edition ? 'Valider la correction' : 'Corriger'} onClick={() => { if (edition) { c.corriger(m.id, { texte: texte.trim() || m.texte }); } setEdition(!edition); }} className={ICONE}>{edition ? <Check size={18} aria-hidden="true" /> : <Pencil size={18} aria-hidden="true" />}</button>
      </div>
      {edition && sansJour === false && m.jour !== null && !m.brassin && m.type !== 'prochain-essai' && (
        <div className="mb-1 flex gap-1.5" role="group" aria-label="Changer le jour">
          {jours.map(j => <button key={j.jour} type="button" aria-pressed={m.jour === j.jour} onClick={() => c.choisirJour(m.id, j.jour)}
            className="relative min-h-11 rounded-full border border-cave-700 bg-cave-850 px-3 text-[15px] text-cave-50 aria-pressed:border-ebc-straw aria-pressed:font-semibold">{j.nom}</button>)}
        </div>
      )}
    </div>
  );
};

/** Une ligne « Visé » ou « Prochain essai » : une barre de couleur, la valeur, un crayon ; le crayon ouvre un champ sur place. */
const LigneNote: React.FC<{ barre: string; texteLabel: string; label: string; valeur: string | null; vide: string; aria: string; ecrire: (t: string) => void; champ: string }> = ({ barre, texteLabel, label, valeur, vide, aria, ecrire, champ }) => {
  const [edition, setEdition] = useState(false);
  const [texte, setTexte] = useState(valeur ?? '');
  const ouvrir = () => { setTexte(valeur ?? ''); setEdition(true); };
  return (
    <div className="space-y-1.5">
      <div className="grid min-h-11 grid-cols-[4px_auto_1fr_44px] items-center gap-2 text-[15px] text-cave-200">
        <i className={`my-1.5 self-stretch rounded ${barre}`} aria-hidden="true" />
        <b className={`font-semibold ${texteLabel}`}>{label}</b>
        <span className={valeur ? '' : 'text-cave-400'}>{valeur ?? vide}</span>
        <button type="button" aria-label={aria} onClick={ouvrir} className={ICONE}><Pencil size={18} aria-hidden="true" /></button>
      </div>
      {edition && (
        <div className="space-y-1.5 rounded-2xl border border-cave-700 bg-cave-900 p-2">
          <textarea name={champ} aria-label={label} rows={2} autoFocus value={texte} onChange={e => setTexte(e.target.value)} autoComplete="off" spellCheck={false}
            className="w-full rounded-control border border-cave-700 bg-cave-950 p-2 text-base text-cave-50" />
          <div className="flex gap-2">
            <button type="button" onClick={() => { ecrire(texte); setEdition(false); }} className="relative min-h-11 flex-1 rounded-control bg-ebc-straw px-3 text-[15px] font-semibold text-cave-950">Enregistrer</button>
            <button type="button" onClick={() => setEdition(false)} className="relative min-h-11 flex-1 rounded-control border border-cave-700 bg-cave-850 px-3 text-[15px] text-cave-50">Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
};

const Rail: React.FC<{ n: string; sous: string; auj?: boolean }> = ({ n, sous, auj }) => (
  <div className={`relative z-[1] self-start py-0.5 text-center ${auj ? 'rounded-[10px] bg-ebc-straw py-1 text-cave-950' : 'bg-cave-900'}`}>
    <b className={`block text-[15px] font-semibold ${auj ? 'text-cave-950' : 'text-cave-50'}`}>{n}</b>
    <small className={`block text-xs ${auj ? 'text-cave-950' : 'text-cave-400'}`}>{sous}</small>
  </div>
);
const Jour: React.FC<{ rail: React.ReactNode; futur?: boolean; children: React.ReactNode; data?: string }> = ({ rail, futur, children, data }) => (
  <div data-jour={data} className={`relative grid grid-cols-[44px_1fr] gap-2.5 pb-3 before:absolute before:bottom-0 before:left-[21px] before:top-0 before:w-0.5 ${futur ? 'before:bg-attention' : 'before:bg-cave-800'}`}>
    {rail}<div className="flex min-w-0 flex-col gap-1.5">{children}</div>
  </div>
);

const Vrac: React.FC<{ texte: string; heure: string | null; pasRangee: boolean }> = ({ texte, heure, pasRangee }) => {
  const [lu, setLu] = useState(false);
  return (
    <div data-vrac className="rounded-2xl border border-attention/70 bg-cave-850 px-3 py-2.5 text-[15px] leading-snug text-cave-50">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="flex gap-1.5"><Pastille ton="attention">en vrac</Pastille>{pasRangee && <Pastille>pas rangée</Pastille>}</span>
        <span className="text-xs text-cave-400">{heure ? `${heure} · écrite` : 'heure inconnue'}</span>
      </div>
      <p className={`whitespace-pre-line ${lu ? '' : 'line-clamp-6'} min-[900px]:line-clamp-none`}>{texte}</p>
      {texte.length > 150 && <button type="button" onClick={() => setLu(!lu)} className={`${CIBLE} mt-0.5 min-h-8 text-cave-50 underline underline-offset-2 min-[900px]:hidden`}>{lu ? 'réduire' : 'tout lire'}</button>}
    </div>
  );
};

const BulleNote: React.FC<{ b: Bulle }> = ({ b }) => (
  <div data-bulle={b.type} className={`whitespace-pre-line rounded-2xl border px-3 py-2 text-base leading-snug text-cave-50 ${BULLE[b.type as Exclude<TypeEntree, 'vrac'>]}`}>{b.texte}</div>
);
const Puces: React.FC<{ puces: JourFil['puces'] }> = ({ puces }) => !puces.length ? null : (
  <div className="flex flex-wrap gap-1.5">{puces.map((p, i) => <Pastille key={`${p.label}${i}`} className="!text-[13px] tabular-nums">{p.label} <b className="font-semibold">{p.valeur}</b></Pastille>)}</div>
);

export const CarnetFil: React.FC<{ batch: Batch; c: CarnetControleur; now?: number }> = ({ batch, c, now = Date.now() }) => {
  const [ecriture, setEcriture] = useState('');
  const vrac = vracDe(batch);
  const geste = !!c.propositions;
  const pending = batch.stockConsumption?.pendingItems ?? [];
  const jours = construireFil(batch, now, { vracEnPlace: !geste, enAttente: pending.length > 0, props: c.propositions ?? [] });
  const j = jourN(batch, now);
  const jourLabel = j ? `J+${j.n} · ${jourLong(c.aujourdhui)}` : jourLong(c.aujourdhui);
  const aRanger = (c.propositions ?? []);
  const sansJour = aRanger.filter(p => p.jour === null && !p.brassin && p.type !== 'prochain-essai');
  const essai = aRanger.find(p => p.type === 'prochain-essai');
  const autres = aRanger.filter(p => p.brassin);
  const choixJours = [{ jour: c.aujourdhui, nom: 'aujourd’hui' }, { jour: decalerJour(c.aujourdhui, -1), nom: 'hier' }];
  // e3gb n° 2 : tout ce qui avait un jour est rangé ; il ne reste qu'un morceau sans jour, qui se choisit sur place.
  const toutRange = !!c.fait && geste && nbAcceptables(aRanger) === 0;
  const titre = geste && !toutRange ? `${aRanger.length} morceau${aRanger.length > 1 ? 'x' : ''} à placer` : vrac.length && !toutRange ? `${vrac.length} note${vrac.length > 1 ? 's' : ''} en vrac` : 'Carnet à jour';
  const vise = batch.notesCreation?.trim() || null;
  const enRangement = !!c.fait && (!geste || toutRange);

  return (
    <div className="space-y-2" data-carnet-fil data-etat={geste && !toutRange ? 'geste' : enRangement ? 'rangement' : 'repos'}>
      <JeuPictos />
      <Panneau label="Aujourd’hui" className="grid grid-cols-[1fr_auto] items-center gap-3 p-3">
        <div className="min-w-0"><p className="text-xs text-cave-400">{jourLabel}</p><h2 className={`${geste && !toutRange ? 'text-xl' : 'text-2xl'} font-semibold leading-tight text-cave-50`}>{c.range ? 'Je range…' : titre}</h2></div>
        {geste && !toutRange ? <Pastille ton="attention">proposé</Pastille>
          : vrac.length && !toutRange ? <button type="button" aria-label="Ranger mes notes" disabled={c.range} onClick={c.ranger} className={ROND}><Sparkles className={ROND_ICO} aria-hidden="true" />Ranger</button>
          : <button type="button" aria-label="Dicter une note" disabled={c.dictee === 'indisponible'} title={c.dictee === 'indisponible' ? 'Dictée indisponible sur cet appareil : écris la note.' : undefined} onClick={c.dicter} className={ROND}><Mic className={ROND_ICO} aria-hidden="true" />{c.dictee === 'ecoute' ? 'J’écoute' : 'Dicter'}</button>}
      </Panneau>
      {c.message && <p role="status" className="text-sm text-attention">{c.message}</p>}

      <LigneNote barre="bg-area-agenda" texteLabel="text-area-agenda" label="Visé" valeur={vise} vide="pas encore écrit" aria="Modifier le profil visé" ecrire={c.ecrireVise} champ="carnet_vise" />
      {essai
        ? <Propose key={essai.id} m={essai} c={c} jours={choixJours} />
        : <LigneNote barre="bg-hop" texteLabel="text-hop" label="Prochain essai" valeur={essaiDe(batch.notesTasting)} vide="pas encore écrit" aria={essaiDe(batch.notesTasting) ? 'Modifier le prochain essai' : 'Écrire le prochain essai'} ecrire={c.ecrireEssai} champ="carnet_essai" />}

      <section className="flex flex-col" aria-label="Le fil du brassin">
        {sansJour.length > 0 && (
          <Jour data="sans-jour" rail={<Rail n="—" sous="sans jour" />}>{sansJour.map(m => <Propose key={m.id} m={m} c={c} jours={choixJours} />)}</Jour>
        )}
        {jours.map(f => (
          <Jour key={f.n} data={`J${f.n}`} futur={f.futur} rail={<Rail n={f.n === 0 ? 'J0' : `J+${f.n}`} sous={f.auj ? 'auj.' : f.date.slice(0, 5)} auj={f.auj} />}>
            {f.dryHop && (
              <div data-dry-hop className="flex items-center justify-between gap-2 rounded-2xl border border-attention/60 bg-attention/10 px-3 py-2 text-[15px] text-cave-200">
                <div className="min-w-0"><b className="font-semibold text-cave-50">Dry hop</b> <LignesDryHop batch={batch} lignes={f.dryHop.lignes} /></div>
                <span className="whitespace-nowrap font-semibold text-attention">{f.dryHop.quand}</span>
              </div>
            )}
            {f.vrac.map((v, i) => <Vrac key={i} texte={v.texte} heure={v.heure} pasRangee={c.enAttente} />)}
            {f.props.map(m => <Propose key={m.id} m={m} c={c} jours={choixJours} />)}
            {f.bulles.map((b, i) => <BulleNote key={i} b={b} />)}
            {f.auj && enRangement && <div className="flex items-center gap-1.5 text-[13px] text-cave-400"><Sparkles size={16} aria-hidden="true" />{c.fait?.note ? `rangés depuis ta note de ${c.fait.note}` : 'rangés depuis ta note en vrac'}</div>}
            <Puces puces={f.puces} />
          </Jour>
        ))}
        {autres.map(m => <div key={m.id} className="ml-[54px] mb-2"><Propose m={m} c={c} jours={choixJours} /></div>)}
      </section>
      {/* Les dégustations des houblons restent au carnet : un acquis de la fiche. */}
      <HopTastingsPanel batch={batch} />

      {c.composer && (
        <div className="space-y-1.5 rounded-2xl border border-cave-700 bg-cave-900 p-2" data-composer>
          <textarea name="carnet_note" aria-label="Écrire une note" rows={4} autoFocus value={ecriture} onChange={e => setEcriture(e.target.value)} autoComplete="off" spellCheck={false}
            placeholder="Ce que tu as vu, goûté, fait. Le rangement s’occupe du reste."
            className="w-full rounded-control border border-cave-700 bg-cave-950 p-2 text-base text-cave-50" />
          <div className="flex gap-2">
            <button type="button" disabled={!ecriture.trim()} onClick={() => { c.poser(ecriture); setEcriture(''); }} className="relative min-h-11 flex-1 rounded-control bg-ebc-straw px-3 text-[15px] font-semibold text-cave-950 disabled:opacity-40">Poser en vrac</button>
            <button type="button" onClick={() => { c.ouvrirComposer(false); setEcriture(''); }} className="relative min-h-11 flex-1 rounded-control border border-cave-700 bg-cave-850 px-3 text-[15px] text-cave-50">Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
};

/** Le pied de la rubrique Carnet : Dicter · Écrire, ou Accepter les N, ou le toast « rangés » avec Annuler. */
export const CarnetPied: React.FC<{ c: CarnetControleur }> = ({ c }) => {
  const acceptables = nbAcceptables(c.propositions ?? []);
  const base = 'relative min-h-11 flex-1 rounded-control border px-3 text-[15px] font-semibold inline-flex items-center justify-center gap-1.5';
  // Rien d'acceptable ne reste : le retour du geste (« 5 rangés · … Annuler ») prend la place du bouton grisé.
  if (c.propositions && !(c.fait && acceptables === 0)) return (
    <div className="flex gap-2">
      <button type="button" disabled={!acceptables} onClick={c.accepterTous} className={`${base} border-transparent bg-ebc-straw text-cave-950 disabled:opacity-50`}>Accepter les {acceptables}</button>
      <button type="button" onClick={c.laisserEnVrac} className={`${base} border-cave-700 bg-cave-850 text-cave-50 font-normal`}>Laisser en vrac</button>
    </div>
  );
  if (c.fait) return (
    <div role="status" className="flex min-h-11 items-center justify-between gap-2 rounded-control bg-cave-850 px-3 text-[15px] text-cave-50 shadow-lg">
      <span>{c.fait.n} rangé{c.fait.n > 1 ? 's' : ''}{c.fait.autres.length ? ` · ${c.fait.autres.length} envoyé${c.fait.autres.length > 1 ? 's' : ''} à la ${c.fait.autres[0].split(' · ')[0]}` : ''}</span>
      <button type="button" onClick={c.annuler} className={`${CIBLE} min-h-8 underline underline-offset-2`}>Annuler</button>
    </div>
  );
  return (
    <div className="flex gap-2">
      <button type="button" disabled={c.dictee === 'indisponible'} onClick={c.dicter} className={`${base} border-cave-700 bg-cave-850 text-cave-50 font-normal disabled:opacity-50`}><Mic size={18} aria-hidden="true" />{c.dictee === 'ecoute' ? 'J’écoute…' : 'Dicter'}</button>
      <button type="button" onClick={() => c.ouvrirComposer(true)} className={`${base} border-cave-700 bg-cave-850 text-cave-50 font-normal`}><Pencil size={18} aria-hidden="true" />Écrire</button>
    </div>
  );
};
