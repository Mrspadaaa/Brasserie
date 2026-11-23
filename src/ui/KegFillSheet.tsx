import React, { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import type { Batch, KegItem } from '../types';
import { Sheet } from './Sheet';
import { Button } from '../components/ui/Button';
import { Combobox } from './Combobox';
import { Field, FormNav } from './FormNav';
import { SegmentedControl } from './SegmentedControl';
import { DateField, swissToday } from './DateField';
import { StorageService } from '../services/storage';
import { EffetsGeste } from '../services/effetsGeste';
import { gesteIdDe, type Geste } from '../domain/consommation/gestes';
import { isCurrent } from '../domain/catalogOrganization';
import { nombreFr } from '../domain/nombreAffiche';
import { brassinsAFuter, litresDansLesAutresFuts, volumeProduit } from '../domain/stock/futs';
import { barreLitres, couleurPastille, futsARetablir, futsQuiTiennent, marquerPropre, phraseALaver, phraseLitres, problemeRemplissageMultiple, remplirFut, statutLot } from '../domain/stock/futsFiche';
import './equipment-compact.css';
import './keg-fiche.css';

interface Props {
  kegs: KegItem[];
  batches: Batch[];
  /** `JJ.MM.AAAA` : « Aujourd'hui » de la feuille (injecté pour les bancs). */
  today: string;
  /** Le fût dont la fiche a ouvert la feuille : il arrive coché. */
  initialKegId?: string;
  onClose: () => void;
  onFill: (filled: KegItem[], batch: Batch) => void;
  /** K7 : « 2 à laver · marquer propres » lave les fûts à laver qu'il faut pour tenir le volume. */
  onMarquerPropres?: (laves: KegItem[]) => void;
}

type Quand = 'auj' | 'hier' | 'autre';

/** Jour d'hier à partir de « aujourd'hui » injecté (les bancs figent la date). */
function veille(today: string): string {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(today);
  if (!m) return swissToday(-1);
  const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1] - 1));
  return [String(d.getUTCDate()).padStart(2, '0'), String(d.getUTCMonth() + 1).padStart(2, '0'), d.getUTCFullYear()].join('.');
}

/**
 * L9 : laver des fûts use ce que la table du geste « lavage-fut » contient (PBW, désinfectant…), une dose par fût lavé.
 * Partagé par la page des fûts et la feuille « Conditionner » du brassin (K7). Rend l'identifiant du geste.
 */
export function enregistrerLavage(futs: KegItem[]): string | null {
  if (!futs.length) return null;
  const lavages = StorageService.getMouvementsGestes().filter(m => m.geste === 'lavage-fut');
  const geste: Geste = futs.length === 1
    ? { type: 'lavage-fut', objet: futs[0].id, cycle: new Set(lavages.filter(m => m.objet === futs[0].id).map(m => m.gesteId)).size + 1, libelle: `Fût ${futs[0].id} lavé`, quantites: { unites: 1 } }
    : { type: 'lavage-fut', objet: `lot-${Date.now()}`, cycle: 1, libelle: `${futs.length} fûts lavés`, quantites: { unites: futs.length } };
  StorageService.enregistrerGeste(geste);
  return gesteIdDe(geste);
}

/** Un geste, un seul Annuler (L9) : il rend le stock ET remet ces fûts à laver ; refus entier si l'un a bougé depuis. */
export function accrocherDefaireLavage(gesteId: string | null, avant: KegItem[], apres: KegItem[], courants: () => KegItem[], ecrireFut: (k: KegItem) => void) {
  if (!gesteId) return;
  EffetsGeste.surAnnulation(gesteId, {
    dit: avant.length > 1 ? 'les fûts sont remis à laver' : 'le fût est remis à laver',
    refus: () => futsARetablir(avant, apres, courants()).length === avant.length ? null : 'Annulation impossible : un fût a bougé depuis, rien n’est rendu.',
    defaire: () => futsARetablir(avant, apres, courants()).forEach(k => ecrireFut(k))
  });
}

/** K7 : les litres du lot qui restent à mettre en fût (produits moins ceux déjà dans ses fûts). */
const aFuter = (lot: Batch, kegs: KegItem[]) => {
  const v = volumeProduit(lot);
  return v === undefined ? undefined : Math.max(0, v - litresDansLesAutresFuts(lot.id, kegs, ''));
};

/**
 * R1 « Le lot d'abord » (15.11) : on choisit le lot, une barre montre les litres produits et choisis, puis on coche les fûts propres.
 * Même règle de contenance que la fiche d'un fût, généralisée à plusieurs fûts (`problemeRemplissageMultiple`).
 */
export const KegFillSheet: React.FC<Props> = ({ kegs: parc, batches, today, initialKegId, onClose, onFill, onMarquerPropres }) => {
  /** Les fûts lavés dans cette feuille sont propres tout de suite, même si le parc n'est pas encore relu. */
  const [laves, setLaves] = useState<KegItem[]>([]);
  const kegs = useMemo(() => parc.map((k) => laves.find((l) => l.id === k.id && k.state === 'lavage') ?? k), [parc, laves]);
  const lots = useMemo(() => brassinsAFuter(batches.filter(isCurrent)), [batches]);
  const [lotId, setLotId] = useState('');
  const [coches, setCoches] = useState<string[]>(initialKegId ? [initialKegId] : []);
  const [quand, setQuand] = useState<Quand>('auj');
  const [autre, setAutre] = useState(today);

  const lot = lots.find((b) => b.id === lotId);
  const proposition = lot ? futsQuiTiennent(aFuter(lot, kegs), kegs) : undefined;
  const aLaver = proposition?.aLaver ?? [];
  /** K7 : un toucher prend les fûts qui tiennent le volume ; ceux à laver sont marqués propres au passage. */
  const aCocher = (proposition?.futs ?? []).filter((k) => !coches.includes(k.id));
  const prendre = () => {
    const propres = aLaver.map((k) => marquerPropre(k, today));
    if (propres.length) { setLaves((l) => [...l, ...propres]); onMarquerPropres?.(propres); }
    setCoches((c) => [...c, ...(proposition?.futs ?? []).map((k) => k.id).filter((id) => !c.includes(id))]);
  };
  const propres = kegs.filter((k) => k.state === 'propre');
  const choisis = propres.filter((k) => coches.includes(k.id));
  const barre = lot ? barreLitres(lot, kegs, choisis) : undefined;
  const probleme = lot ? problemeRemplissageMultiple(lot, choisis, kegs) : undefined;
  const date = quand === 'auj' ? today : quand === 'hier' ? veille(today) : autre;
  const pret = Boolean(lot) && choisis.length > 0 && !probleme && /^\d{2}\.\d{2}\.\d{4}$/.test(date);
  const dot = couleurPastille(lot?.style);
  const dotStyle = dot ? ({ '--keg-dot': dot } as React.CSSProperties) : undefined;
  const pct = (n: number) => (barre?.produits ? Math.min(100, (n / barre.produits) * 100) : 0);

  const basculer = (id: string) => setCoches((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const valider = () => { if (pret && lot) { onFill(choisis.map((k) => remplirFut(k, lot, date)), lot); onClose(); } };

  return (
    <Sheet open onClose={onClose} title="Remplir depuis un lot" subtitle="Choisis le lot, puis les fûts propres" className="equipment-sheet lg:max-w-xl lg:mx-auto"
      footer={<div className="equipment-footer keg-footer"><Button intent="secondary" onClick={onClose}>Annuler</Button>
        <Button intent="primary" disabled={!pret} onClick={valider}>{choisis.length > 1 ? `Remplir ${choisis.length} fûts` : choisis.length === 1 ? 'Remplir 1 fût' : 'Remplir'}</Button></div>}>
      <FormNav className="equipment-form" onSubmit={valider}>
        <Field label="Lot" htmlFor="keg-fill-lot">
          {lots.length
            ? <div className="keg-lot" data-dot={Boolean(dot && lot)} style={dotStyle}>
                {dot && lot && <span className="keg-dot" aria-hidden="true"/>}
                <Combobox id="keg-fill-lot" ariaLabel="Lot" value={lotId} onChange={setLotId}
                  options={lots.map((b) => ({ value: b.id, label: `${b.name} · ${b.id} · ${statutLot(b.status)}`, detail: b.style }))}
                  placeholder="Choisir un lot…"/>
              </div>
            : <p className="equipment-help">Aucun lot à mettre en fût. Un lot doit être au moins en fermentation.</p>}
        </Field>

        {barre && (
          <div className="grid gap-1" style={dotStyle}>
            <div className="keg-lbar" role="img" aria-label={phraseLitres(barre)}>
              <i style={{ width: `${pct(barre.dejaEnFut)}%`, opacity: .45 }}/>
              <i style={{ width: `${pct(barre.choisis)}%` }}/>
            </div>
            <span className="equipment-help" aria-live="polite">{phraseLitres(barre)}</span>
            {probleme && <p role="alert" className="text-xs text-alert-strong">{probleme}</p>}
          </div>
        )}

        <Field label={`Fûts propres · ${propres.length}`}>
          {propres.length
            ? <div className="keg-chips" role="group" aria-label="Fûts propres à remplir">
                {propres.map((k) => {
                  const on = coches.includes(k.id);
                  return (
                    <button key={k.id} type="button" role="checkbox" aria-checked={on} className="keg-chip" onClick={() => basculer(k.id)}>
                      <span className="keg-cbox" aria-hidden="true">{on && <Check size={9} strokeWidth={4}/>}</span>
                      {k.id} · {nombreFr(k.capacityL, 1)} L
                    </button>
                  );
                })}
              </div>
            : !aLaver.length && <p className="equipment-help">Aucun fût propre. Marque un fût propre depuis sa fiche.</p>}
          {aCocher.length > 0 && (
            <button type="button" className="mt-1.5 flex min-h-11 w-full flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-control border border-dashed border-cave-600 px-2.5 py-1.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-ebc-straw" onClick={prendre}>
              <span className="text-sm font-semibold text-cave-50 underline underline-offset-2">{aLaver.length ? phraseALaver(aLaver.length) : `Prendre ${aCocher.length > 1 ? `les ${aCocher.length} fûts` : 'le fût'} qui tiennent le volume`}</span>
              <span className="font-mono text-xs text-cave-400">{(aLaver.length ? aLaver : aCocher).map((k) => `${k.id} · ${nombreFr(k.capacityL, 1)} L`).join(', ')}{proposition && proposition.manque > 0 ? ` · ${nombreFr(proposition.manque, 1)} L sans fût` : ''}</span>
            </button>
          )}
        </Field>

        <Field label="Rempli">
          <SegmentedControl label="Date du remplissage" className="equipment-choice keg-choice" value={quand} onChange={setQuand}
            options={[{ value: 'auj', label: 'Aujourd’hui' }, { value: 'hier', label: 'Hier' }, { value: 'autre', label: 'Autre date' }]}/>
        </Field>
        {quand === 'autre' && <div className="equipment-date"><DateField label="Date du remplissage" value={autre} onChange={setAutre} shortcuts={[]}/></div>}
      </FormNav>
    </Sheet>
  );
};
