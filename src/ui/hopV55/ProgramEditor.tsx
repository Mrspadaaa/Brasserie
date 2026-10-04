import React, { useEffect, useState } from 'react';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { BrewingScenarioBranchRequest } from '../../domain/brewingScenario';
import type { HopDecisionProgram, HopProgramChange, HopUse } from '../../domain/hopDecision/types';
import { deriveHopProgramDraft } from '../../domain/hopDecision/programs';
import { programDelta } from '../../services/hopV55/programOverlay';
import { HopV55ExactInput } from './ExactInput';
import { Input } from '../Input';

export const hopV55Uses: Array<{ value: HopUse; label: string }> = [
  { value: 'firstWort', label: 'Premier moût' }, { value: 'boil', label: 'Ébullition' },
  { value: 'whirlpool', label: 'Whirlpool' }, { value: 'fermentation', label: 'Fermentation active' },
  { value: 'postFermentation', label: 'À froid après fermentation' },
];
const formNames = { pelletT90: 'pellets T90', pelletT45: 'pellets T45', cryo: 'lupuline concentrée', cone: 'cônes', extract: 'extrait', unknown: 'forme inconnue' };

export interface HopV55ProgramPrefill { id: string; kind: 'replace' | 'append' | 'remove'; additionId?: string; materialId?: string; use?: HopUse; label: string }
export function HopV55ProgramEditor({ prepared, referenceProgram, editableProgram, prefill, onCommit }: {
  prepared: PreparedBrewingScenarioContext; referenceProgram?: HopDecisionProgram; editableProgram?: HopDecisionProgram; prefill?: HopV55ProgramPrefill; onCommit(branch: BrewingScenarioBranchRequest): void;
}) {
  const program = editableProgram ?? prepared.runtime.current?.program ?? referenceProgram;
  const [stagedProgram, setStagedProgram] = useState<HopDecisionProgram>();
  const workingProgram = stagedProgram ?? program;
  const future = workingProgram?.additions.filter(row => row.status === 'planned') ?? [];
  const [kind, setKind] = useState<'replace' | 'append' | 'remove'>('replace');
  const [additionId, setAdditionId] = useState(future[0]?.id ?? '');
  const source = future.find(row => row.id === additionId);
  const [materialId, setMaterialId] = useState(source?.materialId ?? '');
  const [grams, setGrams] = useState<number | undefined>(source?.grams ?? undefined);
  const [use, setUse] = useState<HopUse | ''>(source?.use ?? '');
  const [minutes, setMinutes] = useState<number | undefined>(source?.boilMinutes ?? undefined);
  const [hours, setHours] = useState<number | undefined>(source?.contactHours ?? undefined);
  const [temperature, setTemperature] = useState<number | undefined>(source?.temperatureC ?? undefined);
  const [day, setDay] = useState<number | undefined>(source?.dayOffset ?? undefined);
  const [label, setLabel] = useState('Mon réglage');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!prefill) return;
    const row = future.find(item => item.id === prefill.additionId);
    setKind(prefill.kind); setAdditionId(row?.id ?? ''); setMaterialId(prefill.materialId ?? row?.materialId ?? '');
    setUse(prefill.use ?? row?.use ?? ''); setGrams(row?.grams ?? undefined);
    setMinutes(row?.boilMinutes ?? undefined); setHours(row?.contactHours ?? undefined);
    setTemperature(row?.temperatureC ?? undefined); setDay(row?.dayOffset ?? undefined); setLabel(prefill.label); setError('');
  }, [prefill?.id]);
  const material = prepared.runtime.materials.find(row => row.id === materialId);
  if (!program) return <p>Le programme n’est pas encore lié. Explorer reste disponible ; une référence hypothétique peut être déclarée séparément.</p>;
  function selectAddition(id: string) {
    setAdditionId(id);
    const row = future.find(item => item.id === id);
    setMaterialId(row?.materialId ?? ''); setGrams(row?.grams ?? undefined); setUse(row?.use ?? '');
    setMinutes(row?.boilMinutes ?? undefined); setHours(row?.contactHours ?? undefined);
    setTemperature(row?.temperatureC ?? undefined); setDay(row?.dayOffset ?? undefined);
  }
  function prepareGesture() {
    if (!label.trim()) throw Error('Nomme le scénario pour pouvoir le retrouver.');
    if (kind !== 'append' && !source) throw Error('Choisis un ajout encore prévu.');
    if (kind !== 'remove' && (!material || grams === undefined || !use)) throw Error('La matière, la masse et l’emploi doivent être précisés.');
    const id = kind === 'append' ? `scenario-hop:${crypto.randomUUID()}` : additionId;
    const addition = { ...(source ?? {}), id, materialId, grams: grams ?? null, use: use as HopUse,
      status: 'planned' as const, boilMinutes: use === 'boil' ? minutes ?? null : undefined,
      contactHours: use !== 'boil' ? hours ?? null : undefined, temperatureC: temperature ?? null, dayOffset: day,
      alphaForModel: source?.materialId === materialId ? source?.alphaForModel : undefined };
    const change: HopProgramChange = kind === 'remove' ? { kind: 'remove', additionId }
      : kind === 'append' ? { kind: 'append', addition } : { kind: 'replace', additionId, additions: [addition] };
    return deriveHopProgramDraft(workingProgram!, [change]);
  }
  function compare(next: HopDecisionProgram) {
    onCommit({ id: `branch:${crypto.randomUUID()}`, label: label.trim(), programChanges: programDelta(program!, next), assumptions: [] });
  }
  function commit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    try { compare(prepareGesture()); } catch (err) { setError((err as Error).message); }
  }
  function stageGesture() {
    setError('');
    try { setStagedProgram(prepareGesture()); } catch (err) { setError((err as Error).message); }
  }
  return <form autoComplete="off" onSubmit={commit} className="hv-editor">
    <div className="hv-fields"><label className="hv-field"><span>Geste</span><select aria-label="Geste" value={kind} onChange={e => setKind(e.target.value as typeof kind)}>
      <option value="replace">Régler, déplacer ou remplacer</option><option value="append">Ajouter</option><option value="remove">Retirer</option>
    </select></label>
    {kind !== 'append' ? <label className="hv-field"><span>Ajout prévu</span><select aria-label="Ajout prévu" value={additionId} onChange={e => selectAddition(e.target.value)}>
      <option value="">Choisir un ajout</option>{future.map(row => <option key={row.id} value={row.id}>{prepared.runtime.materials.find(m => m.id === row.materialId)?.name ?? row.materialId} · {row.grams ?? '?'} g</option>)}
    </select></label> : null}
    <label className="hv-field"><span>Nom du scénario</span><Input aria-label="Nom du scénario" value={label} onChange={e => setLabel(e.target.value)} /></label></div>
    {kind !== 'remove' ? <div className="hv-fields"><label className="hv-field hv-wide"><span>Matière et forme</span><select aria-label="Matière du réglage" value={materialId} onChange={e => setMaterialId(e.target.value)}>
      <option value="">Choisir une matière</option>{prepared.runtime.materials.map(row => <option key={row.id} value={row.id}>{row.name} · {formNames[row.form]} · {row.lot ? 'lot identifié' : row.product ? row.product.manufacturer : row.id.startsWith('variety:') ? 'fiche variété' : 'matière du programme'} {row.availableGrams === 0 ? '· indisponible' : ''}</option>)}
    </select></label>
    <HopV55ExactInput label="Masse du réglage" unit="g" value={grams} onValue={setGrams} min={0} required />
    <label className="hv-field"><span>Emploi</span><select aria-label="Emploi du réglage" value={use} onChange={e => setUse(e.target.value as HopUse)}><option value="">À préciser</option>{hopV55Uses.map(row => <option key={row.value} value={row.value}>{row.label}</option>)}</select></label>
    {use === 'boil' ? <HopV55ExactInput label="Temps d’ébullition restant" unit="min" min={0} value={minutes} onValue={setMinutes} /> : <HopV55ExactInput label="Contact du réglage" unit="h" min={0} value={hours} onValue={setHours} />}
    <HopV55ExactInput label="Température du réglage" unit="°C" min={-273.15} value={temperature} onValue={setTemperature} />
    <HopV55ExactInput label="Jour de l’ajout" unit="jour" value={day} onValue={setDay} min={0} />
    </div> : null}
    {error ? <p className="hv-error" role="alert">{error}</p> : null}
    {stagedProgram ? <div className="hv-wide"><strong>Programme préparé · plusieurs gestes possibles</strong><ul>{stagedProgram.additions.map(row => <li key={row.id}>{prepared.runtime.materials.find(item => item.id === row.materialId)?.name ?? row.materialId} · {row.grams == null ? 'Masse inconnue' : `${row.grams.toLocaleString('fr-CH')} g physiques`} · {hopV55Uses.find(item => item.value === row.use)?.label ?? row.use} · {row.status === 'performed' ? 'Effectué, inchangé' : 'Prévu'}</li>)}</ul><div className="hv-actions"><button type="button" onClick={() => { setError(''); try { compare(stagedProgram); } catch (err) { setError((err as Error).message); } }}>Comparer les gestes préparés</button><button type="button" onClick={() => { setStagedProgram(undefined); setError(''); }}>Annuler la préparation des gestes</button></div></div> : null}
    <p className="hv-muted">Les masses sont physiques. Les opérations effectuées restent dans la référence. Chaque geste prépare une comparaison.</p>
    <div className="hv-actions"><button className="hv-primary" type="submit">Comparer ce réglage</button><button type="button" onClick={stageGesture}>Garder ce geste et en régler un autre</button></div>
  </form>;
}
