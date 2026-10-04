import React, { useState } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YeastRecipeChoice } from '../../src/ui/YeastRecipeChoice';
import { MAX_COMPARED_ALTERNATIVES, YeastChoiceResults } from '../../src/ui/YeastChoiceComparison';
import { YeastRecipeQuantity } from '../../src/ui/YeastRecipeDossier';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { createYeastRecipeDraft, yeastRecipeCandidates } from '../../src/domain/yeastRecipeDesign';
import type { HopKnowledge, HopYeast } from '../../functions/src/hopPredictionSchema';
import { fullRecipe } from '../fixtures/fullRecipe';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import type { Recipe } from '../../src/types';

const knowledge = vi.hoisted(() => ({ rows: [] as HopKnowledge[] }));
const ai = vi.hoisted(() => ({ run: vi.fn() }));
vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: () => knowledge.rows }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: (...args: unknown[]) => ai.run(...args) } }));
afterEach(() => { cleanup(); knowledge.rows = []; ai.run.mockReset(); });
describe('Résumé documentaire fidèle aux états', () => {
  it('compare les décisions documentaires, sans compter l’enveloppe de stockage comme un changement', () => {
    const saved=yeastFlowRecipe();saved.yeast={name:'Wyeast 3068',hopIndexId:'wyeast-3068',form:'liquide',qty:125,unit:'mL',
      attenuationPct:78,attenuationBasis:'declared',technicalSource:'SOURCE_HISTORIQUE_QA'};
    const draft:Recipe={...saved,yeast:{...saved.yeast,adoptedDocumentary:{version:1,hopIndexId:'wyeast-3068',
      documentary:{form:'liquide',declaredAttenuationPct:78,technicalSource:'SOURCE_HISTORIQUE_QA'}}}};
    render(<YeastRecipeChoice recipe={draft} savedRecipe={saved} onChange={vi.fn()} />);
    const status=screen.getByLabelText('État du choix de levure');
    expect(status).toHaveTextContent('identiques à la recette enregistrée');
    expect(status).not.toHaveTextContent('adoptedDocumentary');
  });
  it('distingue une nouvelle hypothèse de la valeur documentaire conservée', () => {
    const saved=yeastFlowRecipe();saved.yeast={name:'Wyeast 3068',hopIndexId:'wyeast-3068',form:'liquide',
      attenuationPct:78,attenuationBasis:'declared',technicalSource:'SOURCE_HISTORIQUE_QA'};
    const draft:Recipe={...saved,yeast:{...saved.yeast,attenuationPct:73,attenuationBasis:'recipe',
      adoptedDocumentary:{version:1,hopIndexId:'wyeast-3068',documentary:{form:'liquide',declaredAttenuationPct:78,technicalSource:'SOURCE_HISTORIQUE_QA'}}}};
    render(<YeastRecipeChoice recipe={draft} savedRecipe={saved} onChange={vi.fn()} />);
    const status=screen.getByLabelText('État du choix de levure');
    const fold=status.querySelector('details');if(fold)fireEvent.click(fold.querySelector('summary')!);
    expect(status).toHaveTextContent(/hypothèse d’atténuation/i);expect(status).toHaveTextContent('73 %');
    expect(status).not.toHaveTextContent('adoptedDocumentary');expect(status).not.toHaveTextContent('78 % → 73 %');
  });
  it.each([null, []] as const)('ne confond pas une documentation absente avec %j', notes => {
    const saved=yeastFlowRecipe();delete saved.yeast.documentaryNotes;
    const draft={...saved,yeast:{...saved.yeast,documentaryNotes:notes===null?null:[]}};
    render(<YeastRecipeChoice recipe={draft} savedRecipe={saved} onChange={vi.fn()} />);
    const status=screen.getByLabelText('État du choix de levure');
    expect(status).not.toHaveTextContent('identiques à la recette enregistrée');
    expect(status.querySelector('[data-draft-state="saved"]')).toBeNull();
    expect(status).toHaveTextContent(notes===null?'documentation inconnue':'notes retirées');
    const transported=JSON.parse(JSON.stringify(draft));
    expect(transported.yeast.documentaryNotes).toEqual(notes);
    expect(Object.hasOwn(JSON.parse(JSON.stringify(saved)).yeast,'documentaryNotes')).toBe(false);
  });
});
beforeAll(() => {
  // jsdom has no PointerEvent: fired pointer events would otherwise lose clientX/pointerId.
  if (typeof window.PointerEvent === 'undefined') {
    class PointerEventPolyfill extends MouseEvent {
      pointerId: number; pointerType: string;
      constructor(type: string, init: PointerEventInit = {}) { super(type, init); this.pointerId = init.pointerId ?? 1; this.pointerType = init.pointerType ?? 'touch'; }
    }
    Object.defineProperty(window, 'PointerEvent', { value: PointerEventPolyfill, configurable: true, writable: true });
  }
});
const recipe = (): Recipe => ({ ...structuredClone(fullRecipe), style: 'American Pale Ale', styleRef: undefined,
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05', form: 'sèche', qty: 20, unit: 'g', pitchTempC: 19 },
  volumeL: 20, fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 10 }],
});
const makeGenericYeast = (id = 'qa-culture-r7', name = 'Culture maison R-7', productCode = 'R-7', temperature = { min: 18, max: 24 }): HopYeast => {
  const source = { author: 'Labo local', title: `Fiche QA ${productCode}`, year: 2026, kind: 'manufacturer' as const,
    reference: `https://example.invalid/${id}` };
  const reference: HopYeast = { id, kind: 'yeast', name, betaLyase: 'unknown', form: 'liquide', source,
    catalogue: { manufacturer: 'Labo local', productId: `QA-${productCode}`, productCode, aliases: [], categories: [], status: 'listed',
      facts: [{ key: 'temperature', label: 'Température de fermentation', reported: `${temperature.min}–${temperature.max} °C`, source,
        range: temperature, unit: '°C', qualifier: 'range', context: 'beer' }],
      documents: [{ title: `Fiche QA ${productCode}`, url: source.reference }],
      retrievals: [{ url: source.reference, retrievedAt: '2026-09-27T07:00:00.000Z', sha256: 'b'.repeat(64), etag: null, lastModified: null }],
      publishedAt: '2026-09-01T00:00:00.000Z', pageUpdatedAt: null, parserVersion: 'qa-fixture-1', contentSha256: 'a'.repeat(64), gaps: [] } };
  return reference;
};
const installGenericYeast = (id = 'qa-culture-r7', name = 'Culture maison R-7', productCode = 'R-7'): HopYeast => {
  const reference = makeGenericYeast(id, name, productCode);
  knowledge.rows = [reference];
  return reference;
};
const reviseGenericYeast = (reference: HopYeast, name: string, temperature: { min: number; max: number }): HopYeast => {
  if (!reference.catalogue) throw new Error('Catalogue de base manquant dans le fixture de levure.');
  const reported = `${temperature.min}–${temperature.max} °C`;
  const fact = { key: 'temperature' as const, label: 'Température de fermentation', reported, range: temperature, unit: '°C' as const, qualifier: 'range' as const, source: reference.source };
  const next: HopYeast = { ...reference, name, catalogue: { ...reference.catalogue, contentSha256: 'c'.repeat(64),
    facts: reference.catalogue.facts.map(item => item.key === 'temperature' ? fact : item) } };
  knowledge.rows = [next];
  return next;
};
const genericCandidates = () => yeastRecipeCandidates('unknown', 'balanced', yeastReferences(knowledge.rows), 20, { includeOtherStyles: true });
const sheetReply = (name: string, note: string) => ({ ok: true, data: { found: true, name, source: 'Fiche de contrôle QA',
  sourceUrl: 'https://example.invalid/yeast-sheet', retrievedAt: '2026-09-27T08:00:00.000Z', note } });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
function Host({ changed = vi.fn(), initialYeastId, initial = recipe(), editableQuantity = false, factsEditor, identityEditor, programEditor, stateControls }: {
  changed?: ReturnType<typeof vi.fn>; initialYeastId?: string; initial?: Recipe; editableQuantity?: boolean;
  factsEditor?: React.ReactNode; identityEditor?: React.ReactNode; programEditor?: React.ReactNode;
  stateControls?: (value: Recipe, setValue: React.Dispatch<React.SetStateAction<Recipe>>) => React.ReactNode;
}) {
  const [value, setValue] = useState(initial);
  return <>
    {stateControls?.(value, setValue)}
    <YeastRecipeChoice recipe={value} quantityEditor={editableQuantity
      ? <YeastRecipeQuantity yeast={value.yeast} onChange={yeast => { const next = { ...value, yeast }; changed(next); setValue(next); }} />
      : <span>Quantité de la recette : {value.yeast.qty} {value.yeast.unit}</span>}
      factsEditor={factsEditor} identityEditor={identityEditor} programEditor={programEditor} initialYeastId={initialYeastId}
      onChange={next => { changed(next); setValue(next as Recipe); return next; }} />
  </>;
}
const search = (value: string) => fireEvent.change(screen.getByRole('searchbox'), { target: { value } });
const openCatalogue = () => {
  const browse = screen.queryByRole('button', { name: 'Parcourir le catalogue' });
  if (browse) fireEvent.click(browse);
  else fireEvent.focus(screen.getByRole('searchbox'));
};
const yeastStation = () => screen.getByRole('region', { name: /^(Levure de la recette|Choisir la levure)$/ });
const resultList = () => screen.getByRole('list', { name: 'Références de levure à comparer' });
const resultRows = () => [...resultList().children].filter((item): item is HTMLElement => item.tagName === 'LI');
const rowName = (row: HTMLElement) => row.querySelector('.yc-identity strong')?.textContent ?? '';
const rowOf = (id: string) => { const row = resultRows().find(item => item.dataset.candidateId === id); expect(row, id).toBeDefined(); return row!; };
const chooseRow = (row: HTMLElement) => fireEvent.click(within(row).getByRole('button', { name: /^Choisir .* pour le brouillon$/ }));
/** Conduct trials stay explicit: compare first, then use the separate trial action in a column. */
const tryRow = (row: HTMLElement) => {
  const id = row.dataset.candidateId!;
  const checkbox = within(row).queryByRole('checkbox');
  if (checkbox && !(checkbox as HTMLInputElement).checked) fireEvent.click(checkbox);
  if (!screen.queryByRole('region', { name: 'Comparaison des levures' }))
    fireEvent.click(screen.getByRole('button', { name: /^Comparer côte à côte/ }));
  const action = document.querySelector<HTMLButtonElement>(`button[data-try="${id}"]`);
  expect(action, `Essayer la conduite avec ${rowName(row)}`).not.toBeNull();
  fireEvent.click(action!);
};
const compareFirst = (pattern: RegExp) => {
  const row = resultRows().find(item => item.dataset.current !== 'true' && pattern.test(rowName(item)));
  expect(row, String(pattern)).toBeDefined();
  const box = within(row!).getByRole('checkbox') as HTMLInputElement;
  if (!box.checked) fireEvent.click(box);
  return { id: row!.dataset.candidateId!, label: rowName(row!) };
};
const columnHeads = (table: HTMLElement) => [...table.querySelectorAll<HTMLElement>('thead th')];
const filtersSummary = () => screen.getByText(/^Filtres/, { selector: 'summary' });
const openFilters = () => { if (!filtersSummary().closest('details')!.open) fireEvent.click(filtersSummary()); };
const expectNoImplicitComparison = () => {
  expect(within(resultList()).queryAllByRole('checkbox').filter(box => (box as HTMLInputElement).checked)).toHaveLength(0);
  expect(screen.queryByRole('button', { name: /^Comparer côte à côte/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Comparaison des levures' })).not.toBeInTheDocument();
};
const consult = (name: string) => { const summary = screen.getByLabelText(`Consulter ${name}`); fireEvent.click(summary); };
const phaseField = (label: string) => within(screen.getByRole('region', { name: 'Modifier le palier sélectionné' })).getByLabelText(label);
const changeNumber = (label: string, value: string) => {
  const input = /^(Température|Durée) du palier/.test(label) ? phaseField(label) : screen.getByLabelText(label);
  expect(input).toBeVisible(); fireEvent.change(input, { target: { value } }); fireEvent.blur(input);
};
/** Opens a folded station through its visible toggle, then checks its body is really shown. */
const openStation = (fold: 'objectives' | 'conduct') => {
  const toggle = document.querySelector<HTMLButtonElement>(`[data-station-toggle="${fold}"]`);
  expect(toggle, fold).not.toBeNull(); expect(toggle).toBeVisible();
  if (toggle!.getAttribute('aria-expanded') !== 'true') fireEvent.click(toggle!);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(document.getElementById(toggle!.getAttribute('aria-controls')!)).toBeVisible();
};
const openScenario = () => { openStation('conduct'); expect(screen.getByRole('region', { name: 'Scénario de levure' })).toBeVisible(); };
const chooseGoal = (value: string) => {
  openStation('objectives');
  const select = screen.getByLabelText('Profil recherché'); expect(select).toBeVisible();
  fireEvent.change(select, { target: { value } });
};
const proposeConduct = () => {
  openStation('objectives');
  const button = screen.getByRole('button', { name: 'Proposer une conduite' }); expect(button).toBeVisible();
  fireEvent.click(button);
};
const openPitch = () => expect(screen.getByRole('group', { name: 'Quantité prévue de levure' })).toBeVisible();
const selectPhase = (index: number) => {
  openStation('conduct');
  const scenario = screen.getByRole('region', { name: 'Scénario de levure' });
  const listChoice = scenario.querySelector<HTMLButtonElement>(`.yc-programme [data-phase-choice="${index}"]`);
  const withoutWidth = scenario.querySelector<HTMLButtonElement>(`figure[aria-label="Calendrier des températures de fermentation"] [data-phase-choice="${index}"]`);
  const graphChoice = scenario.querySelector<HTMLButtonElement>(`figure[aria-label="Calendrier des températures de fermentation"] button[data-phase-select="${index}"]`);
  const choice = graphChoice ?? withoutWidth ?? listChoice;
  expect(choice).not.toBeNull(); expect(choice).toBeVisible();
  const name = listChoice?.querySelector('strong')?.textContent?.replace(/^Palier \d+ ·\s*/, '').replace(/ · modifié$/, '').trim()
    ?? choice!.getAttribute('aria-label')?.match(/palier \d+ : ([^,]+)/i)?.[1];
  expect(name).toBeTruthy();
  if (choice!.getAttribute('aria-pressed') !== 'true') fireEvent.click(choice!);
  return { temperature: `Température du palier ${index + 1} · ${name}`, duration: `Durée du palier ${index + 1} · ${name}` };
};
const openDisclosure = (label: string) => { const summary = screen.getByText(label, { selector: 'summary' }); expect(summary).toBeVisible();
  const details = summary.closest('details')!; if (!details.open) fireEvent.click(summary); expect(details).toHaveAttribute('open'); };
const openAdjustments = () => openDisclosure('Hypothèses et réglages complémentaires');
const personal = (): Recipe => ({ ...recipe(), name: 'Essai personnel', style: 'American Pale Ale', ogTarget: 1.06,
  fermentables: [], hops: [], yeast: { name: 'Culture rare — Micro labo R-125', lab: 'Micro labo', strain: 'R-125',
    form: 'liquide', qty: 125, unit: 'mL', attenuationPct: 78, attenuationBasis: 'recipe', fermTempMinC: 18, fermTempMaxC: 24 } });

describe('Choix de levure réservé à la création de recette', () => {
  it('place les faits brassicoles Wyeast 1056 et la consigne de la recette avant les estimations', () => {
    const initial = { ...recipe(), yeast: { name: 'Wyeast 1056', lab: 'Wyeast', strain: '1056',
      hopIndexId: 'wyeast-1056', form: 'liquide' as const, qty: 100, unit: 'mL' } };
    render(<Host initial={initial} />);
    const selected = yeastStation();
    openDisclosure('Profil du brouillon, estimation et sources');
    const facts = within(selected).getByRole('region', { name: 'Repères documentés de la souche' });
    expect(facts).toHaveTextContent('16–22 °C');
    expect(facts).toHaveTextContent('73–77 %');
    expect(facts).toHaveTextContent('11 % vol');
    expect(facts).toHaveTextContent('19 °C · dans la plage');
    expect(within(facts).getByRole('link', { name: /Wyeast/ })).toHaveAttribute('href', 'https://wyeastlab.com/product/american-ale/');
    expect(within(selected).getByRole('region', { name: 'Aperçu de la fermentation de cette recette' })).toHaveTextContent('Estimation');
  });

  it('guide vers la correction des données manquantes sans exposer tout le formulaire dans la lecture', () => {
    const initial = { ...recipe(), yeast: { name: 'Culture sans fiche', form: 'liquide' as const, qty: 100, unit: 'mL' } };
    render(<YeastRecipeChoice recipe={initial} onChange={vi.fn()} quantityEditor={null} factsEditor={<span>Édition témoin</span>} />);
    openDisclosure('Profil du brouillon, estimation et sources');
    const recipeSheet = () => document.querySelector<HTMLDetailsElement>('[data-sheet-scope="recipe"]');
    expect(recipeSheet()).not.toHaveAttribute('open');
    fireEvent.click(screen.getByRole('button', { name: 'Vérifier ou compléter les données' }));
    expect(recipeSheet()).toHaveAttribute('open');
    expect(screen.getByText('Compléter ou corriger la fiche', { selector: 'strong' })).toBeVisible();
    expect(document.querySelector<HTMLDetailsElement>('.yc-dossier')?.open).toBe(false);
    expect(screen.getByText('Édition témoin')).toBeVisible();
  });

  it('garde les faits immédiats et un programme modifié après fermeture puis réouverture', () => {
    render(<YeastRecipeChoice recipe={recipe()} onChange={vi.fn()} quantityEditor={null}
      programEditor={<input aria-label="Essai de programme détaillé" defaultValue="" />} />);
    expect(yeastStation()).toHaveTextContent('SafAle US-05');
    expect(screen.queryByRole('textbox', { name: 'Essai de programme détaillé' })).not.toBeInTheDocument();
    openDisclosure('Repères pratiques, sources et programme détaillé');
    const summary = screen.getByText('Programme détaillé et guides enregistrés', { selector: 'summary' });
    fireEvent.click(summary);
    const program = screen.getByRole('textbox', { name: 'Essai de programme détaillé' });
    fireEvent.change(program, { target: { value: 'essai à 19 °C' } });
    fireEvent.click(summary);
    fireEvent.click(summary);
    expect(screen.getByRole('textbox', { name: 'Essai de programme détaillé' })).toHaveValue('essai à 19 °C');
  });

  it('guide une recherche sans présenter les premières lignes du catalogue comme des recommandations', () => {
    const initial = { ...recipe(), name: 'Création libre', style: 'Style personnel inédit', yeast: { name: '' } };
    render(<Host initial={initial} />);
    expect(screen.getByText(/Parcourir les .* références/)).toBeVisible();
    expect(within(screen.getByRole('list', { name: 'Références de levure à comparer' })).queryAllByRole('listitem')).toHaveLength(0);
    search('1056');
    expect(within(screen.getByRole('list', { name: 'Références de levure à comparer' }))
      .getByRole('button', { name: 'Choisir 1056 American Ale® pour le brouillon' })).toBeVisible();
  });

  it('choisit directement une souche trouvée par nom ou code, sans essai ni sauvegarde, puis la retrouve après enregistrement', () => {
    const changed = vi.fn(); render(<Host changed={changed} />); openCatalogue();
    expectNoImplicitComparison();
    // Reported reproduction: a glued code and a shortened brand found nothing, although the draft uses it.
    search('safe us05');
    expect(screen.queryByText(/Aucune référence/)).not.toBeInTheDocument();
    const reference = resultRows().find(row => row.dataset.current === 'true');
    expect(reference).toBeDefined(); expect(reference).toHaveTextContent('référence de comparaison');
    for (const query of ['S-04', 's04', 'SAFALE-S04', 'safale s 04', 'safeale 04', 'Fermentis S04']) {
      search(query);
      const rows = resultRows(), names = rows.map(rowName);
      expect(names[0], query).toMatch(/S-?04/i); expect(rows[0], query).toHaveTextContent('Fermentis');
      // Several S-04 sheets stay separate rows, all ahead of weaker descriptive matches.
      const weaker = names.findIndex(name => !/S-?04/i.test(name));
      if (weaker >= 0) expect(names.slice(weaker).some(name => /S-?04/i.test(name)), query).toBe(false);
    }
    search('safale s04');
    const target = resultRows()[0], targetId = target.dataset.candidateId!, targetLabel = rowName(target);
    chooseRow(target);
    expect(changed).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('region', { name: 'Comparaison des levures' })).not.toBeInTheDocument();
    expect(yeastStation().querySelector('[data-yeast-source="catalogue"]')).toHaveTextContent(targetLabel);
    expect(screen.queryByText(/Essai de conduite/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Appliquer au brouillon' })).not.toBeInTheDocument();
    const saved = changed.mock.lastCall![0] as Recipe;
    expect(saved.yeast.hopIndexId).toBe(targetId); expect(saved.yeast.qty).toBeUndefined();
    expect(saved.yeast.unit).toBeUndefined(); expect(saved.yeast.pitchTempC).toBeUndefined(); expect(saved.yeast.stockItemRef).toBeUndefined();
    cleanup();
    const reopened = vi.fn(); render(<Host initial={saved} changed={reopened} />);
    expect(yeastStation()).toHaveTextContent(saved.yeast.name);
    openCatalogue(); search('safale s04');
    expect(rowOf(targetId)).toHaveAttribute('data-current', 'true');
    search('us05');
    const previous = rowOf('fermentis-us05');
    expect(previous).toHaveAttribute('data-current', 'false');
    expect(within(previous).getByRole('button', { name: /^Choisir .* pour le brouillon$/ })).toBeEnabled();
    expect(reopened).not.toHaveBeenCalled();
  });

  it('trouve par ses codes une référence hors fixtures historiques et hors style documenté, en signalant l’incertitude', () => {
    const refs = yeastReferences(), draft = createYeastRecipeDraft(recipe(), refs);
    const all = yeastRecipeCandidates(draft.styleId, draft.goal, refs, 20, { includeOtherStyles: true });
    const compact = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
    const code = (candidate: typeof all[number]) => candidate.reference.catalogue?.productCode ?? '';
    const identities = all.map(other => compact([other.label, other.reference.name, code(other), ...(other.reference.aliases ?? [])].join(' ')));
    const historical = /us-?05|s-?04|1056|3068|m20|3638|verdant|diamond|w-?34/i;
    // Chosen from the data, not by name: a printed letters+digits code carried by no other identity.
    const target = all.find(candidate => candidate.styleMatch !== 'documented' && candidate.styleMatch !== 'excluded'
      && candidate.evidence.culture !== 'bacteria' && candidate.evidence.culture !== 'other-fermentation' && /^[a-z]+[^a-z0-9]?\d+$/i.test(code(candidate))
      && !historical.test(`${candidate.label} ${code(candidate)}`)
      && identities.filter(text => text.includes(compact(code(candidate)))).length === 1);
    expect(target).toBeDefined();
    const printed = code(target!), split = /^([a-z]+)[^a-z0-9]?(\d+)$/i;
    const changed = vi.fn(); render(<Host changed={changed} />); openCatalogue();
    expect(resultRows().some(row => row.dataset.candidateId === target!.yeastId)).toBe(false);
    for (const query of [compact(printed), printed.replace(split, '$1 $2').toLowerCase(), printed.replace(split, '$1-$2').toUpperCase(), `${target!.lab} ${compact(printed)}`]) {
      search(query);
      const first = resultRows()[0];
      expect(first?.dataset.candidateId, query).toBe(target!.yeastId);
      expect(first, query).toHaveTextContent(/Usage pour .+ non documenté/);
    }
    chooseRow(resultRows()[0]);
    expect(changed).toHaveBeenCalledTimes(1);
    expect((changed.mock.lastCall![0] as Recipe).yeast.hopIndexId).toBe(target!.yeastId);
    expect(screen.queryByText(/Essai de conduite/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Appliquer au brouillon' })).not.toBeInTheDocument();
  });

  it('garde la levure du brouillon présentée comme référence quand un filtre explicite la masque', async () => {
    const user = userEvent.setup(); render(<Host />); openCatalogue(); openFilters();
    const labSelect = screen.getByLabelText('Laboratoire à comparer') as HTMLSelectElement;
    const otherLab = [...labSelect.options].map(option => option.value).find(value => value && value !== 'Fermentis');
    expect(otherLab).toBeDefined();
    await user.selectOptions(labSelect, otherLab!);
    expect(filtersSummary()).toHaveTextContent(otherLab!);
    search('us05');
    expect(screen.queryByText(/Aucune référence ne correspond/)).not.toBeInTheDocument();
    expect(screen.getByText(/est la levure du brouillon/)).toHaveTextContent('SafAle US-05');
    fireEvent.click(screen.getByRole('button', { name: 'Tout afficher' }));
    expect(rowOf('fermentis-us05')).toHaveAttribute('data-current', 'true');
  });
  it('ouvre le côte à côte seulement sur demande : brouillon en colonne de référence, alternatives ajoutées puis retirées sans écrire', () => {
    const initial = { ...recipe(), yeast: { ...recipe().yeast, stockItemRef: 'QA-ANCIEN-LOT' } };
    const changed = vi.fn(); render(<Host initial={initial} changed={changed} />);
    expect(screen.getByRole('searchbox', { name: 'Chercher une autre levure' })).toBeVisible();
    const current = yeastStation();
    openDisclosure('Profil du brouillon, estimation et sources');
    openDisclosure('Repères pratiques, sources et programme détaillé');
    const dossier = screen.getByRole('group', { name: 'Dossier de la levure' });
    expect(current).toHaveTextContent('SafAle US-05'); expect(dossier).toHaveTextContent('18–26 °C'); expect(dossier).toHaveTextContent('78–82 %');
    openCatalogue();
    expectNoImplicitComparison();
    search('S-04'); const s04 = compareFirst(/S-?04/i);
    search('1056'); const american = compareFirst(/^1056 American Ale®$/);
    expect(screen.queryByRole('region', { name: 'Comparaison des levures' })).not.toBeInTheDocument();
    const tray = screen.getByRole('group', { name: 'Levures à comparer' });
    expect(within(tray).getByRole('list', { name: 'Alternatives choisies' })).toHaveTextContent(s04.label);
    fireEvent.click(within(tray).getByRole('button', { name: 'Comparer côte à côte · 2 alternatives' }));
    const comparison = screen.getByRole('region', { name: 'Comparaison des levures' });
    const table = within(comparison).getByRole('table', { name: 'Critères comparés pour chaque levure' });
    const heads = columnHeads(table);
    expect(heads.map(head => head.dataset.role)).toEqual(['reference', 'alternative', 'alternative']);
    expect(heads[0].querySelector('strong')).toHaveTextContent('SafAle US-05'); expect(heads[0]).toHaveTextContent('Référence · brouillon');
    expect(heads.slice(1).map(head => head.dataset.candidateId)).toEqual([s04.id, american.id]);
    for (const criterion of ['Caractère documenté', 'Forme', 'Température publiée', 'Atténuation annoncée'])
      expect(within(within(table).getByRole('rowgroup', { name: criterion })).getAllByRole('cell'), criterion).toHaveLength(3);
    expect(within(table).getByRole('rowgroup', { name: 'Fiche, source et conditions' }).querySelectorAll('td[data-comparison-row="details"]')).toHaveLength(3);
    // The reference is a column, not repeated inside each criterion label.
    expect(within(table).getByRole('rowgroup', { name: 'Température publiée' }).querySelector('.yc-criterion')).not.toHaveTextContent('SafAle');
    expect(within(table).getByRole('rowgroup', { name: 'Forme' })).toHaveTextContent('Forme non publiée');
    const source = comparison.querySelector<HTMLElement>(`summary[aria-label="Voir source et conditions de ${american.label}"]`);
    expect(source).not.toBeNull(); fireEvent.click(source!);
    expect(within(comparison).getAllByRole('link', { name: /^Source : Wyeast/ }).length).toBeGreaterThan(0);
    fireEvent.click(within(heads[1]).getByRole('button', { name: /^Retirer .* de la comparaison$/ }));
    expect(columnHeads(table).map(head => head.dataset.candidateId)).toEqual([heads[0].dataset.candidateId, american.id]);
    search('aucune levure xyz'); expect(screen.getByText(/Aucune référence ne correspond/)).toBeInTheDocument();
    expect(table).toBeInTheDocument(); expect(current).toHaveTextContent('SafAle US-05'); expect(changed).not.toHaveBeenCalled();
    search('1056');
    tryRow(rowOf(american.id));
    expect(changed).not.toHaveBeenCalled();
    expect(current).toHaveTextContent('SafAle US-05');
    openAdjustments(); openDisclosure('Ensemencement, durée et pression');
    expect(screen.queryByLabelText('Masse de levure du scénario en grammes')).not.toBeInTheDocument();
    expect(screen.getByText(/Forme du nouveau produit inconnue/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    const next = changed.mock.lastCall![0] as Recipe;
    expect(changed).toHaveBeenCalledTimes(1); expect(next.yeast.hopIndexId).toBe('wyeast-1056');
    expect(next.yeast.form).toBeUndefined(); expect(next.yeast.qty).toBeUndefined(); expect(next.yeast.unit).toBeUndefined();
    expect(next.yeast.stockItemRef).toBeUndefined(); expect(next.fermentation).toEqual(initial.fermentation);
    expect(current).toHaveTextContent('1056 American Ale®'); expect(screen.getByRole('searchbox', { name: 'Chercher une autre levure' })).toBeVisible();
  });

  it('garde un essai après retour à la comparaison, sans écrire avant application', () => {
    const changed = vi.fn(); render(<Host changed={changed} />);
    openScenario();
    const primary = selectPhase(0);
    const temperature = phaseField(primary.temperature); expect(temperature).toBeVisible();
    fireEvent.change(temperature, { target: { value: '22' } }); fireEvent.blur(temperature);
    openCatalogue();
    openCatalogue();
    openScenario();
    const restoredPrimary = selectPhase(0);
    expect(phaseField(restoredPrimary.temperature)).toHaveValue('22'); expect(changed).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    expect(changed.mock.calls[0][0].fermentation[0].tempC).toBe(22);
    expect(screen.queryByText(/La recette a changé pendant/)).not.toBeInTheDocument();
  });

  it('ne consomme la suggestion initiale qu’après un choix catalogue explicite', () => {
    const changed = vi.fn(); render(<Host initialYeastId="lalbrew-verdant-ipa" changed={changed} />); openCatalogue();
    fireEvent.change(screen.getByLabelText('Filtrer les levures par style'), { target: { value: 'unknown' } });
    search('S-04');
    const result = resultRows().find(row => row.dataset.current !== 'true');
    expect(result).toBeDefined();
    expect(within(result!).getByRole('button', { name: /^Consulter / })).toHaveAttribute('aria-expanded', 'false');
    expect(changed).not.toHaveBeenCalled();
    chooseRow(result!);
    expect(changed).toHaveBeenCalledTimes(1);
    expect(yeastStation()).toHaveTextContent(rowName(result!));
    expect(yeastStation()).not.toHaveTextContent('Verdant');
    expect(screen.queryByText(/Essai de conduite/)).not.toBeInTheDocument();
  });

  it('garde les filtres et les alternatives restantes après un choix direct', async () => {
    const changed = vi.fn(), user = userEvent.setup(); render(<Host changed={changed} />); openCatalogue();
    openFilters();
    await user.selectOptions(screen.getByLabelText('Filtrer les levures par style'), 'unknown');
    await user.selectOptions(screen.getByLabelText('Laboratoire à comparer'), 'Fermentis');
    await user.selectOptions(screen.getByLabelText('Forme à comparer'), 'sèche');
    expect(filtersSummary()).toHaveTextContent('Fermentis'); expect(filtersSummary()).toHaveTextContent('sèches');
    expectNoImplicitComparison();
    const others = resultRows().filter(row => row.dataset.current !== 'true');
    expect(others.length).toBeGreaterThanOrEqual(3);
    const compared = others.slice(0, 2).map(row => ({ id: row.dataset.candidateId!, label: rowName(row) }));
    for (const item of compared) await user.click(within(rowOf(item.id)).getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Comparer côte à côte · 2 alternatives' }));
    expect(screen.queryByRole('list', { name: 'Alternatives choisies' })).not.toBeInTheDocument();
    search(compared[0].label);
    expect(within(rowOf(compared[0].id)).getByRole('button', { name: /^Consulter / })).toHaveAttribute('aria-expanded', 'false');
    chooseRow(rowOf(compared[0].id));
    expect(changed).toHaveBeenCalledTimes(1);
    expect(yeastStation()).toHaveTextContent(compared[0].label);
    expect(screen.queryByText(/Essai de conduite/)).not.toBeInTheDocument();
    openCatalogue();
    expect(screen.getByRole('searchbox', { name: 'Chercher une autre levure' })).toHaveValue('');
    expect(screen.getByLabelText('Laboratoire à comparer')).toHaveValue('Fermentis');
    expect(screen.getByLabelText('Forme à comparer')).toHaveValue('sèche');
    expect(rowOf(compared[0].id)).toHaveAttribute('data-current', 'true');
    expect(within(rowOf(compared[0].id)).getByRole('button', { name: /dans la recette$/ })).toBeDisabled();
    const table = within(screen.getByRole('region', { name: 'Comparaison des levures' })).getByRole('table');
    expect(columnHeads(table)[0]).toHaveTextContent(compared[0].label);
    expect(columnHeads(table).slice(1).map(head => head.dataset.candidateId)).toEqual([compared[1].id]);
    search(compared[1].label);
    expect(within(rowOf(compared[1].id)).getByRole('checkbox')).toBeChecked();
    expect(changed).toHaveBeenCalledTimes(1);
  });

  for (const [query, label, yeastId, form] of [
    ['M20', 'M20 · Bavarian Wheat', 'yeast-mangrove-jacks-132040951', 'sèche'],
    ['3638', '3638 · Bavarian Wheat', 'wyeast-3638', 'liquide'],
  ] as const) it(`part de 3068 vers ${query}, annule puis applique souche, objectif et deux paliers sans quantité ni stock hérités`, () => {
    const initial = yeastFlowRecipe(); initial.yeast.stockItemRef = 'QA-LOT-3068';
    const frozen = structuredClone(initial), changed = vi.fn();
    render(<Host initial={initial} changed={changed} />);
    openCatalogue(); search(query);
    const candidate = () => rowOf(yeastId);
    tryRow(candidate());
    expect(changed).not.toHaveBeenCalled();
    expect(yeastStation()).toHaveTextContent('3068');
    expect(screen.getByLabelText('Scénario de levure')).toHaveTextContent(label);
    const pitchCheck = screen.getByRole('group', { name: `Ensemencement à revalider · ${label}` });
    expect(pitchCheck.querySelector('[data-pitch-check="quantity"]')).toHaveTextContent('125 mL');
    expect(pitchCheck.querySelector('[data-pitch-check="quantity"]')).toHaveTextContent('non repris');
    expect(pitchCheck.querySelector('[data-pitch-check="temperature"]')).toHaveTextContent('18 °C');
    expect(pitchCheck.querySelector('[data-pitch-check="temperature"]')).toHaveTextContent('à renseigner');
    expect(screen.getAllByLabelText('Température d’ensemencement du scénario')).toHaveLength(1);
    expect(screen.getByLabelText('Température d’ensemencement du scénario')).toHaveValue('');
    if (form === 'sèche') {
      expect(screen.getByLabelText('Masse de levure du scénario en grammes')).toHaveValue('');
      changeNumber('Masse de levure du scénario en grammes', '14');
      expect(screen.getByLabelText('Masse de levure du scénario en grammes')).toHaveValue('14');
      changeNumber('Masse de levure du scénario en grammes', '');
      expect(screen.getByLabelText('Masse de levure du scénario en grammes')).toHaveValue('');
    } else expect(screen.queryByLabelText('Masse de levure du scénario en grammes')).not.toBeInTheDocument();
    expect(pitchCheck.compareDocumentPosition(screen.getByRole('button', { name: 'Appliquer au brouillon' })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByLabelText('Scénario de levure').querySelector('[data-pitch-temp]')).toBeNull();
    changeNumber('Température d’ensemencement du scénario', '19');
    expect(screen.getByLabelText('Scénario de levure').querySelector('[data-pitch-temp]')).toHaveAttribute('data-pitch-temp', '19');
    chooseGoal('banana');
    const first = selectPhase(0); changeNumber(first.duration, '11');
    const second = selectPhase(1); changeNumber(second.duration, '0');
    expect(document.querySelector('[data-zero-step="1"]')).toBeInTheDocument();
    changeNumber(second.duration, '');
    expect(document.querySelector('[aria-label="Scénario de levure"] figure')).toHaveAttribute('data-total-days', 'inconnu');
    expect(screen.getByRole('button', { name: 'Appliquer au brouillon' })).toBeDisabled();
    changeNumber(second.duration, '8');
    expect(document.querySelector('[aria-label="Scénario de levure"] figure')).toHaveAttribute('data-total-days', '19');
    fireEvent.click(screen.getByRole('button', { name: 'Annuler l’essai' }));
    expect(changed).not.toHaveBeenCalled();
    expect(yeastStation()).toHaveTextContent('3068');
    search(query); tryRow(candidate());
    chooseGoal('banana');
    changeNumber(selectPhase(0).duration, '11');
    changeNumber(selectPhase(1).duration, '8');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    const next = changed.mock.lastCall![0] as Recipe;
    expect(next.yeast).toMatchObject({ hopIndexId: yeastId, form });
    expect(next.yeast.qty).toBeUndefined(); expect(next.yeast.unit).toBeUndefined();
    expect(next.yeast.stockItemRef).toBeUndefined();
    expect(next.fermentation?.map(step => step.days)).toEqual([11, 8]);
    expect(next.yeastDesign).toMatchObject({ goal: 'banana', goalExplicit: true });
    expect(frozen.yeast).toMatchObject({ hopIndexId: 'wyeast-3068', qty: 125, unit: 'mL', stockItemRef: 'QA-LOT-3068' });
    expect(screen.getByLabelText('Profil recherché')).toHaveValue('banana');
  });

  it.each([
    ['M20', 'yeast-mangrove-jacks-132040951', 'sèche'],
    ['3638', 'wyeast-3638', 'liquide'],
  ] as const)('choisit directement %s depuis la recherche et conserve les autres données du brouillon', (query, yeastId, form) => {
    const initial = yeastFlowRecipe(); initial.yeast.stockItemRef = 'QA-LOT-3068';
    const before = structuredClone(initial), changed = vi.fn();
    render(<Host initial={initial} changed={changed} />);
    search(query);
    chooseRow(rowOf(yeastId));

    expect(changed).toHaveBeenCalledTimes(1);
    const next = changed.mock.lastCall![0] as Recipe;
    expect(next.yeast).toMatchObject({ hopIndexId: yeastId, form });
    expect(next.yeast.qty).toBeUndefined(); expect(next.yeast.unit).toBeUndefined();
    expect(next.yeast.pitchTempC).toBeUndefined(); expect(next.yeast.stockItemRef).toBeUndefined();
    expect(next.fermentation).toEqual(before.fermentation);
    expect(next.hops).toEqual(before.hops);
    expect(next.mash).toEqual(before.mash);
    expect(next.yeastDesign).toMatchObject({ goal: 'clove', goalExplicit: true });
    expect(yeastStation().querySelector('[data-yeast-source="catalogue"]')).toHaveTextContent(query);
    expect(screen.getByRole('button', { name: 'Annuler le changement' })).toBeVisible();
    expect(screen.getByRole('list', { name: 'À revalider pour cette levure' }).querySelector('[data-revalidate="quantity"]'))
      .toHaveTextContent('125 mL');
    expect(screen.getByRole('list', { name: 'À revalider pour cette levure' }).querySelector('[data-revalidate="stock"]'))
      .toHaveTextContent('QA-LOT-3068');
    expect(screen.queryByText(/Essai de conduite/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Appliquer au brouillon' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Comparaison des levures' })).not.toBeInTheDocument();
  });

  /**
   * Scénario décidé avant l'exécution : un produit de fermentation froide, distinct des exemples 3068/M20/3638.
   * Référence catalogue existante : LalBrew Diamond (`lalbrew-diamond`), forme sèche, 10–15 °C, atténuation 77–83 %.
   * Source fabricant exacte de la plage : https://shop-us.lallemandbrewing.com/lalbrew-diamond-yeast-11g-sachet-box-of-50-10228--77--11
   * Attendu : « Choisir » applique cette identité et cette source au brouillon une fois, sans reprendre le lot,
   * 125 mL, l'unité, le pitch ni les paliers/houblons/empâtage de Wyeast 3068.
   */
  it('choisit une lager sèche documentée hors des cas 3068/M20/3638, avec sa plage et sa source exactes', () => {
    const reference = yeastReferences().find(item => item.id === 'lalbrew-diamond')!;
    const temperature = reference.catalogue?.facts.find(fact => fact.key === 'temperature');
    expect(reference.form).toBe('sèche');
    expect(temperature).toMatchObject({ range: { min: 10, max: 15 }, unit: '°C', qualifier: 'range' });
    expect(temperature?.source.reference).toBe('https://shop-us.lallemandbrewing.com/lalbrew-diamond-yeast-11g-sachet-box-of-50-10228--77--11');

    const initial = yeastFlowRecipe(); initial.yeast.stockItemRef = 'QA-LOT-3068';
    const before = structuredClone(initial), changed = vi.fn();
    render(<Host initial={initial} changed={changed} />);
    search('Diamond'); chooseRow(rowOf('lalbrew-diamond'));
    expect(changed).toHaveBeenCalledTimes(1);
    const next = changed.mock.lastCall![0] as Recipe;
    expect(next.yeast).toMatchObject({ hopIndexId: 'lalbrew-diamond', form: 'sèche' });
    expect(next.yeast.qty).toBeUndefined(); expect(next.yeast.unit).toBeUndefined();
    expect(next.yeast.pitchTempC).toBeUndefined(); expect(next.yeast.stockItemRef).toBeUndefined();
    expect(next.fermentation).toEqual(before.fermentation); expect(next.hops).toEqual(before.hops); expect(next.mash).toEqual(before.mash);
    openDisclosure('Profil du brouillon, estimation et sources');
    const evidence = within(yeastStation()).getByRole('region', { name: 'Repères documentés de la souche' });
    expect(evidence).toHaveTextContent('10–15 °C'); expect(evidence).toHaveTextContent('77–83 %');
    expect(within(evidence).getByRole('link', { name: /LalBrew Diamond.*11g Sachet/ }))
      .toHaveAttribute('href', 'https://shop-us.lallemandbrewing.com/lalbrew-diamond-yeast-11g-sachet-box-of-50-10228--77--11');
    expect(screen.queryByText(/Essai de conduite/)).not.toBeInTheDocument();
  });

  it('garde la comparaison explicite et sépare son action de conduite du choix direct', async () => {
    const changed = vi.fn(), user = userEvent.setup(); render(<Host changed={changed} />);
    search('M20');
    expectNoImplicitComparison();
    const row = rowOf('yeast-mangrove-jacks-132040951');
    await user.click(within(row).getByRole('checkbox', { name: 'Comparer M20 · Bavarian Wheat' }));
    await user.click(screen.getByRole('button', { name: 'Comparer côte à côte · 1 alternative' }));
    const table = screen.getByRole('table', { name: 'Critères comparés pour chaque levure' });
    const choose = table.querySelector<HTMLButtonElement>('button[data-choose="yeast-mangrove-jacks-132040951"]')!;
    const tryConduct = table.querySelector<HTMLButtonElement>('button[data-try="yeast-mangrove-jacks-132040951"]')!;
    expect(choose).toHaveAccessibleName('Choisir M20 · Bavarian Wheat pour le brouillon');
    expect(tryConduct).toHaveAccessibleName('Essayer la conduite avec M20 · Bavarian Wheat, sans changer le brouillon');
    expect(changed).not.toHaveBeenCalled();

    await user.click(tryConduct);
    expect(changed).not.toHaveBeenCalled();
    expect(document.querySelector('.yc-trial-status')).toHaveTextContent('Essai de conduite M20 · Bavarian Wheat');
    expect(screen.getByRole('button', { name: 'Appliquer au brouillon' })).toBeVisible();
    await user.click(choose);
    expect(changed).toHaveBeenCalledTimes(1);
    expect((changed.mock.lastCall![0] as Recipe).yeast.hopIndexId).toBe('yeast-mangrove-jacks-132040951');
    expect(screen.queryByText(/Essai de conduite/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Appliquer au brouillon' })).not.toBeInTheDocument();
  });

  it('laisse une recette vide chercher immédiatement et garde les paliers accessibles sans choix implicite', () => {
    const initial: Recipe = { ...recipe(), yeast: { name: '' }, fermentation: [
      { name: 'Primaire', kind: 'primaire', tempC: 18, days: 10 }, { name: 'Garde', kind: 'garde', tempC: 4, days: 7 },
    ] };
    const changed = vi.fn();
    render(<Host initial={initial} changed={changed} identityEditor={<span data-testid="stock-free-entry">Lots et saisie libre</span>}
      programEditor={<input aria-label="Guide de conduite existant" />} />);
    const station = yeastStation();
    const workbench = screen.getByLabelText('Choisir la levure de la recette');
    expect(workbench).toHaveAttribute('data-yeast-state', 'empty');
    expect(screen.getByRole('searchbox', { name: 'Rechercher une levure' })).toBeVisible();
    expect(screen.getByTestId('stock-free-entry')).toBeVisible();
    expect(screen.queryByText(/Touche une levure : elle devient celle du brouillon/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Garder/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Quantité prévue de levure' })).not.toBeInTheDocument();
    expect(station.querySelector('[data-sheet-scope="recipe"]')).toBeNull();
    expect(station.querySelector('.yc-strain-reading')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Objectifs' })).not.toBeInTheDocument();
    expectNoImplicitComparison();
    search('M20');
    expect(rowOf('yeast-mangrove-jacks-132040951')).toBeVisible();
    expect(changed).not.toHaveBeenCalled();

    openStation('conduct');
    expect(screen.getByRole('region', { name: 'Scénario de levure' })).toBeVisible();
    expect(document.querySelector('[data-station-toggle="conduct"]')).toHaveTextContent('2 paliers · fin J17');
    expect(screen.queryByRole('button', { name: 'Appliquer au brouillon' })).not.toBeInTheDocument();
    const primary = selectPhase(0); changeNumber(primary.duration, '11');
    expect(screen.getByRole('button', { name: 'Appliquer au brouillon' })).toBeDisabled();
    expect(screen.getByText(/Choisis d’abord une levure/)).toBeVisible();
    expect(screen.getByRole('region', { name: 'Modifier le palier sélectionné' })).toBeVisible();
    openDisclosure('Programme détaillé et guides enregistrés');
    expect(screen.getByRole('textbox', { name: 'Guide de conduite existant' })).toBeVisible();
    expect(changed).not.toHaveBeenCalled();
    expect(initial.fermentation.map(phase => phase.days)).toEqual([10, 7]);
    expect(screen.getByRole('region', { name: 'Programme proposé' }).querySelector('li')).toHaveAttribute('data-phase-days', '11');
  });

  it('ne ressuscite pas un moût effacé après changement de souche puis Undo et Redo', async () => {
    const initial = yeastFlowRecipe();
    initial.yeast.pitching = { version: 1, wort: { volumeL: 25, sg: 1.048, basis: 'measured', volumeBasis: 'measured', sgBasis: 'measured' } };
    const changed = vi.fn(); render(<Host initial={initial} changed={changed} />);
    search('M20'); chooseRow(rowOf('yeast-mangrove-jacks-132040951'));
    const wort = screen.getByRole('region', { name: 'Moût à ensemencer' });
    fireEvent.click(within(wort).getByRole('button', { name: 'Corriger' }));
    fireEvent.click(within(wort).getByRole('button', { name: 'Effacer le moût' }));
    expect((changed.mock.lastCall![0] as Recipe).yeast.pitching?.wort).toBeUndefined();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Annuler le changement' }));
    expect((changed.mock.lastCall![0] as Recipe).yeast.pitching?.wort).toBeUndefined();
    await userEvent.setup().click(screen.getByRole('button', { name: /^Rétablir M20/ }));
    expect((changed.mock.lastCall![0] as Recipe).yeast.pitching?.wort).toBeUndefined();
    expect(initial.yeast.pitching.wort?.volumeL).toBe(25);
  });

  it('annule puis rétablit un choix direct en retirant la quantité nommée et en gardant une correction indépendante de palier', async () => {
    const initial = yeastFlowRecipe(); initial.yeast.stockItemRef = 'QA-LOT-3068';
    const before = structuredClone(initial), changed = vi.fn();
    const parentControls = (_value: Recipe, setValue: React.Dispatch<React.SetStateAction<Recipe>>) => <button type="button"
      onClick={() => setValue(current => {
        const next = { ...current, fermentation: (current.fermentation ?? []).map((phase, index) => index === 0 ? { ...phase, days: 11 } : phase) };
        changed(next); return next;
      })}>Modifier un palier dans le brouillon</button>;
    render(<Host initial={initial} changed={changed} editableQuantity stateControls={parentControls} />);
    search('M20'); chooseRow(rowOf('yeast-mangrove-jacks-132040951'));
    expect(changed).toHaveBeenCalledTimes(1);

    const quantity = screen.getByRole('group', { name: 'Quantité prévue de levure' });
    await userEvent.setup().selectOptions(within(quantity).getByLabelText('Unité de la quantité de levure'), 'g');
    const amount = within(quantity).getByRole('textbox', { name: 'Quantité de levure, en g' });
    fireEvent.change(amount, { target: { value: '11,5' } }); fireEvent.blur(amount);
    expect(screen.getByRole('group', { name: 'Dernier changement de levure' }).querySelector('[data-undo-later]'))
      .toHaveTextContent(/Annuler retire aussi : quantité 11,5 g/);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Modifier un palier dans le brouillon' }));
    openScenario();
    expect(screen.getByRole('region', { name: 'Programme proposé' }).querySelector('li'))
      .toHaveAttribute('data-phase-days', '11');
    const callsBeforeUndo = changed.mock.calls.length;
    await userEvent.setup().click(screen.getByRole('button', { name: 'Annuler le changement' }));
    expect(changed).toHaveBeenCalledTimes(callsBeforeUndo + 1);
    const restored = changed.mock.lastCall![0] as Recipe;
    expect(restored.yeast).toEqual(before.yeast);
    expect(restored.yeastDesign).toEqual(before.yeastDesign);
    expect(restored.fermentation?.map(phase => phase.days)).toEqual([11, 7]);
    expect(restored.hops).toEqual(before.hops); expect(restored.mash).toEqual(before.mash);
    expect(screen.getByRole('button', { name: /^Rétablir M20/ })).toBeVisible();

    await userEvent.setup().click(screen.getByRole('button', { name: /^Rétablir M20/ }));
    const redone = changed.mock.lastCall![0] as Recipe;
    expect(redone.yeast).toMatchObject({ hopIndexId: 'yeast-mangrove-jacks-132040951', qty: 11.5, unit: 'g' });
    expect(redone.yeast.stockItemRef).toBeUndefined();
    expect(redone.fermentation?.map(phase => phase.days)).toEqual([11, 7]);
  });

  it('conserve les deux paliers manuels et l’objectif en changeant de candidat, mais revalide la dose et le pitch', () => {
    const initial = yeastFlowRecipe(); initial.yeast.stockItemRef = 'QA-LOT-3068';
    const changed = vi.fn(); render(<Host initial={initial} changed={changed} />);
    openCatalogue(); search('M20');
    tryRow(rowOf('yeast-mangrove-jacks-132040951'));
    chooseGoal('banana');
    changeNumber(selectPhase(0).duration, '11');
    changeNumber(selectPhase(1).duration, '8');
    changeNumber('Masse de levure du scénario en grammes', '14');
    changeNumber('Température d’ensemencement du scénario', '19');
    openCatalogue(); search('3638');
    tryRow(rowOf('wyeast-3638'));
    expect(changed).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Profil recherché')).toHaveValue('banana');
    expect(screen.getByRole('region', { name: 'Programme proposé' })).toHaveTextContent('10 → 11 j');
    expect(screen.getByRole('region', { name: 'Programme proposé' })).toHaveTextContent('7 → 8 j');
    expect(screen.getByLabelText('Température d’ensemencement du scénario')).toHaveValue('');
    expect(screen.queryByLabelText('Masse de levure du scénario en grammes')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    const next = changed.mock.lastCall![0] as Recipe;
    expect(next.yeast).toMatchObject({ hopIndexId: 'wyeast-3638', form: 'liquide' });
    expect(next.yeast.qty).toBeUndefined(); expect(next.yeast.stockItemRef).toBeUndefined(); expect(next.yeast.pitchTempC).toBeUndefined();
    expect(next.fermentation?.map(step => step.days)).toEqual([11, 8]);
    expect(next.yeastDesign).toMatchObject({ goal: 'banana', goalExplicit: true });
  });

  it('conserve la consigne et la durée principale des réglages complémentaires en changeant de candidat', () => {
    const changed = vi.fn(); render(<Host initial={yeastFlowRecipe()} changed={changed} />);
    openCatalogue(); search('M20');
    tryRow(rowOf('yeast-mangrove-jacks-132040951'));
    changeNumber(selectPhase(1).duration, '8');
    openAdjustments();
    changeNumber('Température principale du scénario', '21');
    openDisclosure('Ensemencement, durée et pression');
    changeNumber('Durée principale du scénario en jours', '12');
    expect(screen.getByRole('region', { name: 'Programme proposé' })).toHaveTextContent('21 °C · 10 → 12 j');
    openCatalogue(); search('3638');
    tryRow(rowOf('wyeast-3638'));
    const primary = selectPhase(0);
    expect(phaseField(primary.temperature)).toHaveValue('21');
    expect(phaseField(primary.duration)).toHaveValue('12');
    expect(phaseField(selectPhase(1).duration)).toHaveValue('8');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    const next = changed.mock.lastCall![0] as Recipe;
    expect(next.yeast.hopIndexId).toBe('wyeast-3638');
    expect(next.fermentation?.map(phase => [phase.tempC, phase.days])).toEqual([[21, 12], [4, 8]]);
  });

  it('crée la primaire par la règle métier puis la conserve au changement de candidat si la recette n’a aucun palier', () => {
    const initial = yeastFlowRecipe(); initial.fermentation = []; initial.yeastDesign = undefined;
    const changed = vi.fn(); render(<Host initial={initial} changed={changed} />);
    openCatalogue(); search('M20');
    tryRow(rowOf('yeast-mangrove-jacks-132040951'));
    openAdjustments();
    changeNumber('Température principale du scénario', '21');
    openDisclosure('Ensemencement, durée et pression');
    changeNumber('Durée principale du scénario en jours', '12');
    expect(screen.getByRole('region', { name: 'Programme proposé' })).toHaveTextContent('Fermentation principale');
    openCatalogue(); search('3638');
    tryRow(rowOf('wyeast-3638'));
    const primary = selectPhase(0);
    expect(phaseField(primary.temperature)).toHaveValue('21');
    expect(phaseField(primary.duration)).toHaveValue('12');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    expect(changed.mock.lastCall![0].fermentation).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'primaire', tempC: 21, days: 12 })]));
  });

  it('emporte vers un autre candidat une durée vidée restée inconnue, sans valeur inventée ni application possible', () => {
    const changed = vi.fn(); render(<Host initial={yeastFlowRecipe()} changed={changed} />);
    openCatalogue(); search('M20');
    tryRow(rowOf('yeast-mangrove-jacks-132040951'));
    changeNumber(selectPhase(1).duration, '');
    expect(screen.getByRole('button', { name: 'Appliquer au brouillon' })).toBeDisabled();
    openCatalogue(); search('3638');
    tryRow(rowOf('wyeast-3638'));
    expect(screen.getByLabelText('Scénario de levure')).toHaveTextContent('3638');
    const garde = selectPhase(1);
    expect(phaseField(garde.duration)).toHaveValue('');
    expect(phaseField(garde.duration)).toHaveAttribute('aria-invalid', 'true');
    expect(document.querySelector('.yc-programme li:nth-child(2)')).toHaveAttribute('data-phase-days', '');
    expect(document.querySelector('[data-programme-incomplete]')).toHaveTextContent('Palier 2 · Garde : Renseigner une durée positive ou nulle.');
    expect(screen.getByRole('button', { name: 'Appliquer au brouillon' })).toBeDisabled();
    changeNumber(garde.duration, '8');
    expect(screen.getByRole('button', { name: 'Appliquer au brouillon' })).toBeEnabled();
    expect(changed).not.toHaveBeenCalled();
  });

  it('retient seulement l’objectif sans créer ou déplacer de palier et le dit, sans variation de densité ni d’alcool', () => {
    const initial = yeastFlowRecipe(), changed = vi.fn();
    render(<Host initial={initial} changed={changed} />);
    expect(screen.getByLabelText('Profil recherché')).toHaveValue('clove');
    chooseGoal('banana');
    expect(changed).not.toHaveBeenCalled();
    expect(document.querySelector('[data-station-toggle="objectives"]')).toHaveTextContent('Profil : Banane');
    openScenario();
    const decision = screen.getByRole('region', { name: 'Décider des changements de l’essai' });
    expect(decision).toHaveTextContent('Profil recherché');
    expect(decision).not.toHaveTextContent('Primaire · 18 °C · 10 j →');
    expect(decision.querySelector('[data-intent-only]')).toBeVisible();
    expect(decision.querySelector('[data-projection-unchanged]')).not.toBeInTheDocument();
    expect(decision.querySelector('.yc-unknown-projection')).toHaveTextContent('à renseigner pour le brouillon et l’essai');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    const next = changed.mock.lastCall![0] as Recipe;
    expect(next.yeast.hopIndexId).toBe('wyeast-3068');
    expect(next.fermentation).toEqual(initial.fermentation);
    expect(next.yeastDesign).toMatchObject({ goal: 'banana', goalExplicit: true });
  });

  it('garde l’objectif explicite entre deux candidats, mais l’annulation revient à celui du brouillon', () => {
    const initial = yeastFlowRecipe(), changed = vi.fn(); render(<Host initial={initial} changed={changed} />);
    chooseGoal('banana');
    openCatalogue(); search('M20');
    tryRow(rowOf('yeast-mangrove-jacks-132040951'));
    expect(screen.getByLabelText('Profil recherché')).toHaveValue('banana');
    expect(changed).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Annuler l’essai' }));
    expect(screen.getByLabelText('Profil recherché')).toHaveValue('clove');
    expect(changed).not.toHaveBeenCalled();

    chooseGoal('banana');
    search('M20');
    tryRow(rowOf('yeast-mangrove-jacks-132040951'));
    fireEvent.click(screen.getByRole('button', { name: 'Comparer les souches pour ce profil' }));
    search('3638');
    tryRow(rowOf('wyeast-3638'));
    expect(screen.getByLabelText('Profil recherché')).toHaveValue('banana');
    expect(changed).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    const next = changed.mock.lastCall![0] as Recipe;
    expect(next.yeast.hopIndexId).toBe('wyeast-3638');
    expect(next.yeastDesign).toMatchObject({ goal: 'banana', goalExplicit: true });
    cleanup(); render(<Host initial={next} />);
    expect(screen.getByLabelText('Profil recherché')).toHaveValue('banana');
  });

  const lager42 = (): Recipe => ({ ...recipe(), style: 'Lager', yeast: { name: 'Laboratoire confidentiel L-42', form: 'liquide',
    technicalFacts: [{ key: 'temperature', reported: '10–15 °C', range: { min: 10, max: 15 }, qualifier: 'range', unit: '°C', origin: 'personal', source: 'Fiche de test L-42' }] },
    fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 12, days: 14 }, { name: 'Garde', kind: 'garde', tempC: 4, days: 5 }] });

  it('L-42 : sans usage lager documenté, le style seul ne crée aucun programme ; la proposition le dit et reste réversible', () => {
    const changed = vi.fn(); render(<Host initial={lager42()} changed={changed} />);
    chooseGoal('low-sulfur'); proposeConduct();
    const proposal = screen.getByRole('region', { name: 'Proposition de conduite' });
    expect(proposal).toBeVisible();
    expect(proposal).toHaveAttribute('data-outcome', 'insufficient-data');
    expect(proposal).toHaveTextContent('Données insuffisantes');
    expect(proposal).toHaveTextContent('Aucune valeur modifiée');
    expect(within(proposal).getByRole('list', { name: 'Motifs de la proposition' })).toHaveTextContent(/lager/i);
    expect(within(proposal).queryByRole('list', { name: 'Changements proposés' })).not.toBeInTheDocument();
    const programme = screen.getByRole('region', { name: 'Programme proposé' });
    expect(programme.querySelectorAll('ol > li')).toHaveLength(2);
    expect(programme).not.toHaveTextContent('Repos');
    expect(changed).not.toHaveBeenCalled();
    fireEvent.click(within(proposal).getByRole('button', { name: 'Rétablir l’essai avant proposition' }));
    expect(screen.queryByRole('region', { name: 'Proposition de conduite' })).not.toBeInTheDocument();
    expect(programme.querySelectorAll('ol > li')).toHaveLength(2);
    expect(screen.getByLabelText('Profil recherché')).toHaveValue('low-sulfur');
    expect(changed).not.toHaveBeenCalled();
  });

  it('L-42 : un repos ajouté à la main reste à compléter et ne reprend jamais les valeurs de la garde', () => {
    const changed = vi.fn(); render(<Host initial={lager42()} changed={changed} />);
    selectPhase(0);
    const kind = screen.getByRole('combobox', { name: 'Type du palier à ajouter' }); expect(kind).toBeVisible();
    fireEvent.change(kind, { target: { value: 'reposDiacetyle' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un palier après le palier 1' }));
    const programme = screen.getByRole('region', { name: 'Programme proposé' });
    expect(programme.querySelectorAll('ol > li')).toHaveLength(3);
    const repos = selectPhase(1);
    expect(phaseField(repos.temperature)).toHaveValue('');
    expect(phaseField(repos.duration)).toHaveValue('');
    expect(screen.getByText(/Palier ajouté dans l’essai/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Appliquer au brouillon' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Retirer ce palier ajouté' }));
    expect(programme.querySelectorAll('ol > li')).toHaveLength(2);
    const garde = selectPhase(1);
    changeNumber(garde.duration, '9');
    expect(screen.getByText(/Dans le brouillon : 4 °C · 5 j/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Rétablir ce palier' }));
    expect(phaseField(garde.temperature)).toHaveValue('4');
    expect(phaseField(garde.duration)).toHaveValue('5');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    const applied = changed.mock.lastCall![0] as Recipe;
    expect(applied.fermentation.map(phase => [phase.kind, phase.tempC, phase.days])).toEqual([['primaire', 12, 14], ['garde', 4, 5]]);
  });

  it('montre une proposition concrète près du graphe : valeurs modifiées, raisons, effets, puis application retrouvée', () => {
    const initial: Recipe = { ...yeastFlowRecipe(), yeastDesign: undefined, yeast: { ...yeastFlowRecipe().yeast, pitchTempC: 20 },
      fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 20, days: 10 }, { name: 'Garde', kind: 'garde', tempC: 4, days: 7 }],
      mash: { steps: [{ name: 'Saccharification', tempC: 66, durationMin: 60 }] } };
    const changed = vi.fn(); render(<Host initial={initial} changed={changed} />);
    chooseGoal('clove'); proposeConduct();
    const proposal = screen.getByRole('region', { name: 'Proposition de conduite' });
    expect(proposal).toHaveAttribute('data-outcome', 'proposed');
    const rows = within(proposal).getByRole('list', { name: 'Changements proposés' });
    expect(rows).toHaveTextContent('Primaire');
    expect(rows).toHaveTextContent('20 °C → 18 °C');
    expect(rows).toHaveTextContent('Repos férulique 44 °C · 15 min');
    expect(within(proposal).getByRole('region', { name: 'Effets attendus de la stratégie' })).toBeVisible();
    // The proposal sits before the chart it changed, in the open conduct.
    const chart = screen.getByRole('region', { name: 'Scénario de levure' }).querySelector('figure')!;
    expect(proposal.compareDocumentPosition(chart) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Programme proposé' }).querySelector('li')).toHaveAttribute('data-phase-temp', '18');
    expect(changed).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    const next = changed.mock.lastCall![0] as Recipe;
    expect(next.fermentation.map(phase => [phase.tempC, phase.days])).toEqual([[18, 10], [4, 7]]);
    expect(next.mash.steps[0]).toMatchObject({ tempC: 44, durationMin: 15 });
  });

  it('explique une proposition sans valeur modifiée pour une culture hors catalogue, sans fabriquer de variation', () => {
    const changed = vi.fn(); render(<Host initial={personal()} changed={changed} />);
    chooseGoal('balanced'); proposeConduct();
    const proposal = screen.getByRole('region', { name: 'Proposition de conduite' });
    expect(proposal.querySelector('[data-no-proposed-change]')).toHaveTextContent('Conservé : Primaire 19 °C · 10 j');
    expect(proposal.querySelectorAll('[data-proposal-row="value"]')).toHaveLength(0);
    expect(within(proposal).getByRole('list', { name: 'Motifs de la proposition' }).children.length).toBeGreaterThan(0);
    expect(screen.getByRole('region', { name: 'Programme proposé' }).querySelector('li')).toHaveAttribute('data-phase-days', '10');
    expect(screen.getByRole('region', { name: 'Décider des changements de l’essai' }).querySelector('[data-projection-unchanged]')).toBeVisible();
    expect(changed).not.toHaveBeenCalled();
  });

  it('permet un premier choix sur une recette de seigle hors catalogue de styles sans souche initiale', () => {
    const initial: Recipe = { ...recipe(), name: 'Seigle maison', style: 'Style seigle personnel', yeast: { name: '' } };
    const changed = vi.fn(); render(<Host initial={initial} changed={changed} />);
    search('M20');
    chooseRow(rowOf('yeast-mangrove-jacks-132040951'));
    expect(changed).toHaveBeenCalledTimes(1);
    expect((changed.mock.lastCall![0] as Recipe).yeast).toMatchObject({ hopIndexId: 'yeast-mangrove-jacks-132040951', form: 'sèche' });
    expect((changed.mock.lastCall![0] as Recipe).yeastDesign.goalExplicit).toBe(false);
    expect(screen.queryByText(/Essai de conduite/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Appliquer au brouillon' })).not.toBeInTheDocument();
  });

  it('autorise une forme inconnue et conserve les trous documentaires sans inventer une dose', async () => {
    const base = yeastRecipeCandidates('clean-ale', 'balanced', yeastReferences().filter(r => r.id === 'fermentis-us05'), 20)[0];
    const unknown = { ...base, yeastId: 'unknown', label: 'Culture sans fiche', temperature: undefined, attenuation: undefined, doseG: undefined, form: undefined,
      reference: { ...base.reference, id: 'unknown', form: undefined } };
    const choose = vi.fn(); const user = userEvent.setup();
    render(<div className="yeast-choice"><YeastChoiceResults candidates={[unknown]} shown={[unknown]} selectedId="" onChoose={choose} /></div>);
    expect(screen.getAllByText('Inconnu').length).toBeGreaterThan(0);
    expect(screen.queryByText('Dose sèche au volume prévu')).not.toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Choisir Culture sans fiche pour le brouillon' }); expect(button).toBeEnabled();
    // Neither a form field nor a comparison appears before the brewer asks for it.
    expect(screen.queryByLabelText('Forme du produit pour ce choix')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Comparaison des levures' })).not.toBeInTheDocument();
    await user.click(button); expect(choose).toHaveBeenCalledExactlyOnceWith('unknown', undefined);
  });

  it('affiche les avertissements métier de dose en dehors des détails repliés', () => {
    const value = recipe(); value.yeast.qty = 1;
    render(<YeastRecipeChoice recipe={value} quantityEditor={null} onChange={vi.fn()} />);
    expect(within(screen.getByRole('list', { name: 'Points à vérifier pour la levure choisie' })).getByText(/Quantité prévue hors du repère/i)).toBeVisible();
  });

  it('garde la quantité invalide accessible à la correction même pendant la consultation du catalogue', () => {
    const value = recipe(); value.yeast.qty = NaN;
    const view = render(<YeastRecipeChoice recipe={value} quantityEditor={<input aria-label="Quantité à corriger" />} onChange={vi.fn()} />);
    openCatalogue();
    expect(screen.getByRole('textbox', { name: 'Quantité à corriger' })).toBeVisible();
    view.rerender(<YeastRecipeChoice recipe={{ ...value, yeast: { ...value.yeast, qty: 14 } }} quantityEditor={<input aria-label="Quantité à corriger" />} onChange={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: 'Quantité à corriger' })).toBeVisible();
  });

  it.each([
    [undefined, 'quantité à renseigner'], [0, '0 g · zéro à corriger'], [-2, '-2 g · négative'], [12.5, '12,5 g'],
  ])('distingue la quantité enregistrée %s sans déduire de dose', (qty, text) => {
    const value = recipe(); value.yeast.qty = qty;
    render(<YeastRecipeChoice recipe={value} quantityEditor={<input aria-label="Quantité à saisir" defaultValue={qty ?? ''} />} onChange={vi.fn()} />);
    expect(screen.getByLabelText('État du choix de levure')).toHaveTextContent('Recette pas encore enregistrée');
    expect(screen.getByLabelText('État du choix de levure')).not.toHaveTextContent(text);
    expect(yeastStation().querySelector('.yc-identity-card')).toHaveTextContent('SafAle US-05');
    expect(yeastStation().querySelector('.yc-identity-card')).toHaveTextContent('Catalogue');
    const quantity = screen.getByRole('group', { name: 'Quantité prévue de levure' });
    const quantitySection = quantity.closest('section')!;
    const pitchStation = screen.getByRole('region', { name: 'Ensemencement et préparation' });
    if (qty == null) expect(quantitySection).toHaveTextContent('non renseignée · g');
    else if (qty === 0 || qty < 0) expect(quantitySection).toHaveTextContent(text);
    else expect(within(quantity).getByRole('textbox', { name: 'Quantité à saisir' })).toHaveValue('12.5');
    expect(quantitySection).toHaveAttribute('data-planned', qty == null ? 'missing' : qty <= 0 ? 'invalid' : 'unknown');
    expect(pitchStation).toContainElement(quantity);
    expect(pitchStation).toContainElement(quantitySection.querySelector('[data-quantity-reading]'));
    expect(quantity.closest('details')).toBeNull();
    expect(within(quantity).getByRole('textbox', { name: 'Quantité à saisir' })).toBeVisible();
    expect(value.yeast.qty).toBe(qty);
  });

  it('choisit depuis le comparatif une forme inconnue sans imposer un détour ni une valeur fictive', async () => {
    const base = yeastRecipeCandidates('clean-ale', 'balanced', yeastReferences().filter(r => r.id === 'fermentis-us05'), 20)[0];
    const documented = { ...base, yeastId: 'documented', label: 'Culture documentée', form: 'sèche' as const,
      reference: { ...base.reference, id: 'documented', name: 'Culture documentée', form: 'sèche' as const } };
    const unknown = { ...base, yeastId: 'unknown', label: 'Culture sans fiche', temperature: undefined, attenuation: undefined, doseG: undefined, form: undefined,
      reference: { ...base.reference, id: 'unknown', name: 'Culture sans fiche', form: undefined } };
    const choose = vi.fn(); const user = userEvent.setup();
    render(<YeastChoiceResults candidates={[base, documented, unknown]} shown={[base, documented, unknown]} selectedId={base.yeastId} onChoose={choose} />);
    expect(screen.queryByRole('region', { name: 'Comparaison des levures' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Comparer Culture documentée' }));
    await user.click(screen.getByRole('checkbox', { name: 'Comparer Culture sans fiche' }));
    await user.click(screen.getByRole('button', { name: 'Comparer côte à côte · 2 alternatives' }));
    const comparison = screen.getByRole('region', { name: 'Comparaison des levures' });
    const table = within(comparison).getByRole('table', { name: 'Critères comparés pour chaque levure' });
    const form = within(table).getByRole('rowgroup', { name: 'Forme' });
    const unknownForm = form.querySelector<HTMLElement>('td[data-candidate-id="unknown"]')!;
    expect(unknownForm).toHaveTextContent('Forme non publiée');
    expect(unknownForm.querySelector('.yc-delta')).toBeNull();
    expect(form.querySelector('td[data-candidate-id="documented"]')).toHaveTextContent('= référence');
    const temperature = within(table).getByRole('rowgroup', { name: 'Température publiée' });
    const unknownTemperature = temperature.querySelector<HTMLElement>('td[data-candidate-id="unknown"]')!;
    expect(unknownTemperature).toHaveTextContent('Plage non publiée');
    expect(unknownTemperature.querySelector('.yc-delta')).toBeNull();
    expect(choose).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole('list', { name: 'Références de levure à comparer' })).getByRole('button', { name: 'Choisir Culture sans fiche pour le brouillon' }));
    expect(choose).toHaveBeenCalledExactlyOnceWith('unknown', undefined);
  });

  it('consulte une fiche et permet une précision volontaire de forme avant le choix', async () => {
    const base = yeastRecipeCandidates('clean-ale', 'balanced', yeastReferences().filter(r => r.id === 'fermentis-us05'), 20)[0];
    const unknown = { ...base, yeastId: 'unknown', label: 'Culture sans fiche', form: undefined,
      reference: { ...base.reference, id: 'unknown', form: undefined } };
    const choose = vi.fn(), user = userEvent.setup();
    render(<YeastChoiceResults candidates={[base, unknown]} shown={[base, unknown]} selectedId="" onChoose={choose} />);
    consult('Culture sans fiche');
    const results = screen.getByRole('list', { name: 'Références de levure à comparer' });
    const form = within(results).getByLabelText('Forme du produit pour ce choix'); expect(form).toBeVisible();
    await user.selectOptions(form, 'liquide'); expect(choose).not.toHaveBeenCalled();
    await user.click(within(results).getByRole('button', { name: 'Choisir Culture sans fiche pour le brouillon' }));
    expect(choose).toHaveBeenCalledExactlyOnceWith('unknown', 'liquide');
    choose.mockClear();
    await user.click(within(results).getByRole('button', { name: 'Choisir Culture sans fiche pour le brouillon' }));
    expect(choose).toHaveBeenCalledExactlyOnceWith('unknown', 'liquide');
  });

  it('projette une souche personnelle liquide ou de forme inconnue avec une atténuation explicite', () => {
    const original = personal(), onChange = vi.fn();
    const view = render(<YeastRecipeChoice recipe={original} onChange={onChange} quantityEditor={null} />);
    const projection = screen.getByRole('region', { name: 'Aperçu de la fermentation de cette recette' });
    expect(projection).toHaveTextContent('1,013'); expect(projection).toHaveTextContent('6,1');
    expect(projection).toHaveTextContent('hypothèse de recette');
    view.rerender(<YeastRecipeChoice recipe={{ ...original, yeast: { ...original.yeast, form: undefined } }} onChange={onChange} quantityEditor={null} />);
    expect(projection).toHaveTextContent('1,013'); expect(projection).toHaveTextContent('6,1');
    expect(yeastStation()).toHaveTextContent('forme à préciser');
    openScenario();
    const primary = selectPhase(0);
    expect(phaseField(primary.temperature)).toBeVisible();
    expect(phaseField(primary.temperature)).toHaveValue('19');
    expect(screen.queryByRole('button', { name: 'Appliquer au brouillon' })).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('montre l’effet d’une hypothèse sans toucher la recette et annule complètement cet essai', () => {
    const changed = vi.fn(); render(<Host initial={personal()} changed={changed} />);
    openScenario(); openAdjustments(); changeNumber('Atténuation retenue pour le scénario', '85');
    const comparison = screen.getByRole('figure', { name: 'Densité finale' });
    expect(comparison).toHaveTextContent('1,013 SG'); expect(comparison).toHaveTextContent('1,009 SG');
    expect(screen.getByRole('figure', { name: 'Alcool estimé' })).toHaveTextContent('6,7 % vol');
    expect(changed).not.toHaveBeenCalled();
    expect(screen.getByRole('region', { name: 'Aperçu de la fermentation de cette recette' })).toHaveTextContent('1,013');
    fireEvent.click(screen.getByRole('button', { name: 'Annuler l’essai' }));
    expect(screen.getByText('Essai annulé. Le brouillon reste inchangé.')).toBeVisible();
    openScenario(); openAdjustments(); expect(screen.getByLabelText('Atténuation retenue pour le scénario')).toHaveValue('78');
    expect(changed).not.toHaveBeenCalled();
  });

  it('oublie le profil annulé avant de choisir une autre souche', async () => {
    const initial: Recipe = { ...personal(), style: 'Munich Helles',
      yeast: { name: 'SafLager W-34/70', hopIndexId: 'yeast-fermentis-saflager-w-34-70', form: 'sèche', qty: 20, unit: 'g' },
      fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 12, days: 10 }] };
    const changed = vi.fn(), user = userEvent.setup(); render(<Host initial={initial} changed={changed} />);
    expect(screen.getByLabelText('Profil recherché')).toHaveValue('');
    openStation('objectives');
    await user.selectOptions(screen.getByLabelText('Profil recherché'), 'low-sulfur');
    openScenario();
    expect(screen.getByRole('region', { name: 'Programme proposé' })).toHaveTextContent('12 °C · 10 j');
    expect(changed).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Proposer une conduite' }));
    expect(screen.getByRole('region', { name: 'Proposition de conduite' })).toHaveAttribute('data-outcome', 'proposed');
    expect(screen.getByRole('region', { name: 'Programme proposé' })).toBeVisible();
    const secondPhase = selectPhase(1);
    expect(phaseField(secondPhase.temperature)).toHaveValue('14');
    await user.click(screen.getByRole('button', { name: 'Annuler l’essai' }));
    expect(screen.getByLabelText('Profil recherché')).toHaveValue('');
    expect(changed).not.toHaveBeenCalled();
    openCatalogue(); search('Diamond');
    chooseRow(rowOf('lalbrew-diamond'));
    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed.mock.lastCall![0].yeastDesign).toMatchObject({ yeastId: 'lalbrew-diamond', goal: 'clean' });
    expect(changed.mock.lastCall![0].yeastDesign.programme).toBeUndefined();
    expect(changed.mock.lastCall![0].fermentation).toEqual(initial.fermentation);
    expect(screen.getByLabelText('Profil recherché')).toHaveValue('');
    expect(screen.queryByText(/Essai de conduite/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Appliquer au brouillon' })).not.toBeInTheDocument();
  });

  it('refuse un essai périmé après enrichissement de la fiche puis reprend les nouvelles données', () => {
    const original = personal(), onChange = vi.fn();
    const view = render(<YeastRecipeChoice recipe={original} onChange={onChange} quantityEditor={null} />);
    openScenario(); openAdjustments(); changeNumber('Atténuation retenue pour le scénario', '85');
    view.rerender(<YeastRecipeChoice recipe={{ ...original, yeast: { ...original.yeast, attenuationPct: 80,
      technicalSource: 'Nouvelle fiche acceptée' } }} onChange={onChange} quantityEditor={null} />);
    expect(screen.getByRole('alert')).toHaveTextContent('La recette ou la fiche de la souche a changé');
    expect(screen.getByRole('button', { name: 'Appliquer au brouillon' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre les données actuelles' }));
    expect(screen.getByLabelText('Atténuation retenue pour le scénario')).toHaveValue('80');
    expect(screen.queryByRole('button', { name: 'Appliquer au brouillon' })).not.toBeInTheDocument();
    changeNumber('Atténuation retenue pour le scénario', '81');
    expect(screen.getByRole('button', { name: 'Appliquer au brouillon' })).toBeEnabled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('réexamine aussi un essai quand la DI retenue change sans modification des ingrédients', () => {
    const original = personal(), onChange = vi.fn();
    const view = render(<YeastRecipeChoice recipe={original} onChange={onChange} quantityEditor={null} />);
    openScenario(); openAdjustments(); changeNumber('Atténuation retenue pour le scénario', '85');
    view.rerender(<YeastRecipeChoice recipe={{ ...original, ogTarget: 1.07 }} onChange={onChange} quantityEditor={null} />);
    expect(screen.getByRole('alert')).toHaveTextContent('La recette ou la fiche de la souche a changé');
    expect(screen.getByRole('button', { name: 'Appliquer au brouillon' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre les données actuelles' }));
    expect(screen.getByLabelText('Atténuation retenue pour le scénario')).toHaveValue('78');
    expect(screen.getByRole('region', { name: 'Aperçu de la fermentation de cette recette' })).toHaveTextContent('1,015');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('convertit les unités physiques, conserve la quantité lors du changement de forme et refuse une conversion de conditionnement', () => {
    const changed = vi.fn(); render(<Host initial={personal()} changed={changed} editableQuantity />);
    openPitch();
    fireEvent.change(screen.getByLabelText('Unité de la quantité de levure'), { target: { value: 'L' } });
    expect(screen.getByLabelText('Quantité de levure, en L')).toHaveValue('0,125');
    expect(changed.mock.lastCall![0].yeast).toMatchObject({ qty: 0.125, unit: 'L', form: 'liquide' });
    fireEvent.change(screen.getByLabelText('Forme de la levure'), { target: { value: 'levain' } });
    expect(changed.mock.lastCall![0].yeast).toMatchObject({ qty: 0.125, unit: 'L', form: 'levain' });
    fireEvent.change(screen.getByLabelText('Unité de la quantité de levure'), { target: { value: 'flacon' } });
    expect(screen.getByLabelText('Quantité de levure, en flacon')).toHaveValue('');
    expect(changed.mock.lastCall![0].yeast.qty).toBeUndefined();
    expect(screen.getByText(/aucune conversion depuis L/)).toBeVisible();
    changeNumber('Quantité de levure, en flacon', '2');
    expect(changed.mock.lastCall![0].yeast).toMatchObject({ qty: 2, unit: 'flacon' });
    expect(screen.queryByText(/Quantité à ressaisir/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Unité de la quantité de levure'), { target: { value: 'sachet' } });
    changeNumber('Quantité de levure, en sachet', '2');
    fireEvent.change(screen.getByLabelText('Unité de la quantité de levure'), { target: { value: 'g' } });
    expect(screen.getByLabelText('Quantité de levure, en g')).toHaveValue('');
    expect(changed.mock.lastCall![0].yeast.qty).toBeUndefined();
    expect(screen.getByText(/aucune conversion depuis sachet/)).toBeVisible();
  });

  it('qualifie la quantité saisie avant le premier choix d’unité sans l’effacer ni inventer une conversion', () => {
    const changed = vi.fn();
    const initial = { ...personal(), yeast: { ...personal().yeast, qty: undefined, unit: undefined } };
    render(<Host initial={initial} changed={changed} editableQuantity />);
    openPitch();
    changeNumber('Quantité de levure', '0,2');
    expect(changed.mock.lastCall![0].yeast.qty).toBe(0.2);
    fireEvent.change(screen.getByLabelText('Unité de la quantité de levure'), { target: { value: 'L' } });
    expect(screen.getByLabelText('Quantité de levure, en L')).toHaveValue('0,2');
    expect(changed.mock.lastCall![0].yeast).toMatchObject({ qty: 0.2, unit: 'L' });
    expect(screen.queryByText(/Quantité à ressaisir/)).not.toBeInTheDocument();
  });

  it('signale une consigne hors fenêtre fabricant, borne la saisie invalide et applique la correction', () => {
    const changed = vi.fn(); render(<Host initial={personal()} changed={changed} />);
    openScenario(); const primary = selectPhase(0); changeNumber(primary.temperature, '30');
    const warnings = screen.getByRole('list', { name: 'Points à vérifier dans le scénario' });
    expect(warnings).toHaveTextContent(/hors (de la )?(fenêtre|plage)/);
    expect(warnings).toBeVisible(); expect(warnings.closest('details')).toBeNull();
    expect(screen.getByRole('button', { name: 'Appliquer au brouillon' })).toBeEnabled();
    expect(changed).not.toHaveBeenCalled();
    changeNumber(primary.temperature, '61');
    expect(phaseField(primary.temperature)).toHaveValue('60');
    expect(screen.getByRole('button', { name: 'Appliquer au brouillon' })).toBeEnabled();
    changeNumber(primary.temperature, '22,5');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    expect(changed.mock.lastCall![0].fermentation[0].tempC).toBe(22.5);
  });

  it('laisse corriger un palier effacé sans rétablir silencieusement son ancienne durée', () => {
    const changed = vi.fn(); render(<Host initial={personal()} changed={changed} />); openScenario();
    const primary = selectPhase(0); changeNumber(primary.duration, '');
    expect(phaseField(primary.duration)).toHaveValue('');
    expect(screen.getAllByRole('alert').some(alert => /durée|renseigne/i.test(alert.textContent ?? ''))).toBe(true);
    expect(screen.getByRole('button', { name: 'Appliquer au brouillon' })).toBeDisabled();
    expect(changed).not.toHaveBeenCalled();
    changeNumber(primary.duration, '14');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    expect(changed.mock.lastCall![0].fermentation).toEqual([{ ...personal().fermentation[0], days: 14 }]);
  });

  it('édite chaque rampe primaire indépendamment sans écraser les autres températures et durées', () => {
    const initial: Recipe = { ...personal(), fermentation: [personal().fermentation[0],
      { name: 'Deuxième rampe', kind: 'primaire', tempC: 21, days: 2 }, { name: 'Garde', kind: 'garde', tempC: 4, days: 7 }] };
    const changed = vi.fn(); render(<Host initial={initial} changed={changed} />); openScenario();
    const first = selectPhase(0); expect(phaseField(first.temperature)).toHaveValue('19');
    const second = selectPhase(1);
    expect(phaseField(second.temperature)).toHaveValue('21');
    expect(phaseField(second.duration)).toHaveValue('2');
    changeNumber(second.temperature, '22'); changeNumber(second.duration, '3');
    const firstAgain = selectPhase(0);
    expect(phaseField(firstAgain.temperature)).toHaveValue('19');
    expect(phaseField(firstAgain.duration)).toHaveValue('10');
    expect(changed).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    expect(changed.mock.lastCall![0].fermentation).toEqual([initial.fermentation[0],
      { ...initial.fermentation[1], tempC: 22, days: 3 }, initial.fermentation[2]]);
  });

  it('conserve les consignes des houblons par défaut et ne les aligne qu’après choix explicite', () => {
    const initial = { ...personal(), style: 'NEIPA', hops: [
      { name: 'Citra', weightG: 100, alpha: 12, stage: 'dryHop' as const, aromaTiming: 'fermentation' as const, aromaTemperatureC: 19, aromaContactHours: 48 },
      { name: 'Mosaic', weightG: 50, alpha: 11, stage: 'dryHop' as const, aromaTiming: 'postFermentation' as const, aromaTemperatureC: 14, aromaContactHours: 24 }
    ] };
    const changed = vi.fn(); render(<Host initial={initial} changed={changed} />);
    openScenario(); const primary = selectPhase(0); changeNumber(primary.temperature, '23');
    const align = screen.getByRole('checkbox', { name: /Aligner les ajouts en fermentation active/ });
    expect(align).not.toBeChecked();
    expect(screen.getByRole('list', { name: 'Points à vérifier dans le scénario' })).toHaveTextContent('Température de contact distincte');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    expect(changed.mock.lastCall![0].hops.map(hop => hop.aromaTemperatureC)).toEqual([19, 14]);
    openScenario(); fireEvent.click(screen.getByRole('checkbox', { name: /Aligner les ajouts en fermentation active/ }));
    expect(changed).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    expect(changed.mock.lastCall![0].hops.map(hop => hop.aromaTemperatureC)).toEqual([23, 14]);
    expect(changed.mock.lastCall![0].yeastDesign.applied.hops.map(hop => hop.aromaTemperatureC)).toEqual([23, 14]);
  });

  it('garde la DF conditionnelle d’une Sour et ne chiffre l’alcool qu’après choix du procédé adapté', () => {
    const changed = vi.fn(); render(<Host initial={{ ...personal(), style: 'Sour' }} changed={changed} />);
    const current = screen.getByRole('region', { name: 'Aperçu de la fermentation de cette recette' });
    expect(current).toHaveTextContent('1,013'); expect(current).toHaveTextContent('À préciser');
    expect(current).toHaveTextContent('Procédé acidulé non précisé');
    openScenario(); fireEvent.change(screen.getByLabelText('Procédé de fermentation'), { target: { value: 'preacidified' } });
    expect(screen.getByRole('figure', { name: 'Alcool estimé' })).toHaveTextContent('6,1 % vol');
    expect(changed).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Procédé de fermentation'), { target: { value: 'acidifying-yeast' } });
    expect(within(screen.getByRole('figure', { name: 'Alcool estimé' })).getAllByText('À renseigner')).toHaveLength(2);
    expect(screen.getByRole('list', { name: 'Points à vérifier dans le scénario' })).toHaveTextContent('pH, durée et stabilité finale non simulés');
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter une culture' }));
    const name = screen.getByLabelText('Culture 1'); fireEvent.change(name, { target: { value: 'Culture acidifiante R-125' } }); fireEvent.blur(name);
    fireEvent.change(screen.getByLabelText('Rôle de la culture 1'), { target: { value: 'acidifying' } });
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    expect(changed.mock.lastCall![0].yeastDesign).toMatchObject({ process: 'acidifying-yeast', cultureRoles: [{ name: 'Culture acidifiante R-125', role: 'acidifying' }] });
    expect(screen.getByRole('region', { name: 'Aperçu de la fermentation de cette recette' })).toHaveTextContent('répartition alcool/acides');
  });

  it('montre une masse de houblon inconnue comme inconnue dans les contacts prévus', () => {
    const initial: Recipe = { ...personal(), style: 'NEIPA', hops: [{ name: 'Citra sans masse', weightG: undefined as unknown as number,
      alpha: 12, stage: 'dryHop', aromaTiming: 'fermentation', aromaTemperatureC: 19, aromaContactHours: 48 }] };
    render(<Host initial={initial} />); openScenario(); openDisclosure('Contacts, calcul et sources');
    const contacts = screen.getByRole('region', { name: 'Conduite et contacts des houblons' });
    const active = within(contacts).getAllByRole('listitem').find(item => item.textContent?.startsWith('Fermentation'))!;
    expect(active).toBeVisible(); expect(active).toHaveTextContent('— g à cru'); expect(active).not.toHaveTextContent('0 g à cru');
    expect(within(contacts).getByRole('row', { name: /Citra sans masse/ })).toHaveTextContent('— g/L');
    expect(screen.getByRole('list', { name: 'Points à vérifier dans le scénario' })).toHaveTextContent('Masse de houblon à cru manquante');
  });

  it('garde l’alerte de tolérance visible sans plafonner artificiellement la projection', () => {
    const high = { ...personal(), style: 'Barleywine', ogTarget: 1.13,
      yeast: { ...personal().yeast, attenuationPct: 78, alcoholTolerancePct: 11 } };
    render(<Host initial={high} />);
    expect(screen.getByRole('region', { name: 'Aperçu de la fermentation de cette recette' })).toHaveTextContent('13,3');
    const alerts = screen.getByRole('list', { name: 'Points à vérifier pour la levure choisie' });
    expect(alerts).toHaveTextContent('au-delà de la tolérance annoncée (11 % vol)'); expect(alerts).toBeVisible();
    expect(alerts.closest('details')).toBeNull();
  });

  it('à l’entrée, garde levure et quantité visibles, replie objectifs et conduite avec un état court et des portées distinctes', () => {
    render(<Host initial={yeastFlowRecipe()} />);
    expect(screen.getByRole('group', { name: 'Quantité prévue de levure' })).toBeVisible();
    for (const fold of ['objectives', 'conduct']) {
      const toggle = document.querySelector(`[data-station-toggle="${fold}"]`)!;
      expect(toggle).toBeVisible(); expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(document.getElementById(toggle.getAttribute('aria-controls')!)).not.toBeVisible();
    }
    expect(document.querySelector('[data-station-toggle="objectives"]')).toHaveTextContent('Profil : Girofle');
    expect(document.querySelector('[data-station-toggle="objectives"]')).toHaveTextContent('Cible : non fixée');
    expect(document.querySelector('[data-station-toggle="conduct"]')).toHaveTextContent('2 paliers · fin J17');
    expect(screen.queryByRole('button', { name: 'Proposer une conduite' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Décider des changements de l’essai' })).not.toBeInTheDocument();
    openStation('objectives');
    expect(screen.getByRole('group', { name: 'Profil de fermentation' })).toHaveTextContent('Ne change ni malts, ni houblons, ni atténuation');
    expect(screen.getByRole('region', { name: 'Cible de la bière' })).toHaveTextContent('peut ajuster malts, houblons à chaud et hypothèse d’atténuation');
    expect(screen.getByRole('button', { name: 'Proposer une conduite' })).toBeVisible();
  });

  it('n’annonce l’égalité avec la recette enregistrée qu’après comparaison, et montre sinon les seuls écarts exacts', () => {
    const saved = yeastFlowRecipe();
    const renderDraft = (draft: Recipe) => <YeastRecipeChoice recipe={draft} savedRecipe={saved}
      quantityEditor={<span>{draft.yeast.qty} {draft.yeast.unit}</span>} onChange={vi.fn()} />;
    const view = render(renderDraft(structuredClone(saved)));
    const state = () => screen.getByLabelText('État du choix de levure');
    expect(state().querySelector('[data-draft-state="saved"]')).toHaveTextContent('Levure, quantité et conduite identiques à la recette enregistrée');
    expect(state()).not.toHaveTextContent('Wyeast 3068');
    expect(state()).not.toHaveTextContent('125 mL');
    expect(yeastStation().querySelector('.yc-identity-card')).toHaveTextContent('Wyeast 3068');
    expect(yeastStation().querySelector('.yc-identity-card')).toHaveTextContent('Wyeast · liquide');
    expect(screen.getByRole('group', { name: 'Quantité prévue de levure' })).toHaveTextContent('125 mL');
    expect(within(state()).queryByRole('list')).not.toBeInTheDocument();
    // Same strain and quantity, different pitch temperature: equality is no longer claimed.
    view.rerender(renderDraft({ ...structuredClone(saved), yeast: { ...saved.yeast, pitchTempC: 20 } }));
    expect(state()).not.toHaveTextContent('identiques');
    const rows = within(state()).getByRole('list', { name: 'Écarts du brouillon avec la recette enregistrée' });
    expect(rows.querySelectorAll('li')).toHaveLength(1);
    expect(rows.querySelector('[data-difference="pitch"]')).toHaveTextContent('18 °C → 20 °C');
    view.rerender(renderDraft({ ...structuredClone(saved), fermentation: [saved.fermentation[0], { ...saved.fermentation[1], days: 8 }] }));
    const programme = state().querySelector<HTMLElement>('[data-difference="programme"]')!;
    expect(programme).toHaveTextContent('Garde 7 j → 8 j · fin J17 → fin J18');
    expect(state().querySelectorAll('[data-difference]')).toHaveLength(1);
    fireEvent.click(within(programme).getByRole('button', { name: 'Voir la conduite' }));
    expect(document.querySelector('[data-station-toggle="conduct"]')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: 'Programme proposé' })).toBeVisible();
  });

  it('distingue les références sous un même nom et montre une correction documentaire avec ses valeurs et sources', () => {
    const saved = yeastFlowRecipe();
    saved.yeast.stockItemRef = 'lot-R7-01';
    const changed = structuredClone(saved);
    changed.yeast.stockItemRef = 'lot-R7-02';
    changed.yeast.hopIndexId = 'wyeast-3638';
    changed.yeast.attenuationPct = 82;
    changed.yeast.technicalFacts = [{ key: 'attenuation', reported: '>90 %', qualifier: 'greaterThan', range: { min: 90, max: 90 }, unit: '%',
      origin: 'personal', source: 'Fiche corrigée', sourceUrl: 'https://example.invalid/corrected', context: 'Bière' }];
    render(<YeastRecipeChoice recipe={changed} savedRecipe={saved} quantityEditor={null} onChange={vi.fn()} />);
    const state = screen.getByLabelText('État du choix de levure');
    expect(state.querySelector('[data-difference="stockItemRef"]')).toHaveTextContent('lot-R7-01 → lot-R7-02');
    expect(state.querySelector('[data-difference="hopIndexId"]')).toHaveTextContent('wyeast-3068 → wyeast-3638');
    const documentary = state.querySelector<HTMLDetailsElement>('.yc-state-documentary')!;
    expect(documentary.open).toBe(false);
    fireEvent.click(documentary.querySelector('summary')!); documentary.open = true;
    expect(state.querySelector('[data-difference="sheet-attenuationPct"]')).toHaveTextContent('82 %');
    expect(state.querySelector('[data-difference="sheet-attenuationPct"]')).toBeVisible();
    const observationDiff = state.querySelector('[data-difference="sheet-technicalFacts"]')! as HTMLElement;
    expect(observationDiff).toHaveTextContent(/>\s*90 %.*borne/);
    expect(within(observationDiff).getByRole('link', { name: 'Fiche corrigée' })).toHaveAttribute('href', 'https://example.invalid/corrected');
    expect(observationDiff).not.toHaveTextContent('https://example.invalid/corrected');
    expect(state).not.toHaveTextContent('autre fiche, lot ou stock');
  });

  it('garde le nom réel de la référence stock/libre et nomme séparément sa fiche catalogue reliée', async () => {
    const r7 = installGenericYeast(), r8 = makeGenericYeast('qa-culture-r8', 'Culture maison R-8', 'R-8');
    knowledge.rows = [r7, r8];
    const candidates = genericCandidates(), reference = candidates.find(candidate => candidate.yeastId === r7.id)!;
    const alternative = candidates.find(candidate => candidate.yeastId === r8.id)!;
    const onChoose = vi.fn(), user = userEvent.setup();
    render(<div className="yeast-choice"><YeastChoiceResults candidates={candidates} shown={candidates} selectedId={r7.id} onChoose={onChoose}
      draftReference={{ label: 'Levure maison R-7 · bocal B', lab: 'Labo local', form: 'levain' }}
      referenceYeast={{ name: 'Levure maison R-7 · bocal B', lab: 'Labo local', hopIndexId: r7.id, stockItemRef: 'LOT-R7-B', form: 'levain' }} /></div>);
    await user.click(within(rowOf(alternative.yeastId)).getByRole('checkbox', { name: 'Comparer Culture maison R-8' }));
    await user.click(screen.getByRole('button', { name: 'Comparer côte à côte · 1 alternative' }));
    const table = screen.getByRole('table', { name: 'Critères comparés pour chaque levure' });
    const referenceHead = table.querySelector<HTMLElement>('th[data-role="reference"]')!;
    expect(referenceHead).toHaveTextContent('Levure maison R-7 · bocal B');
    expect(referenceHead.querySelector('[data-reference-catalogue]')).toHaveTextContent('Catalogue : Culture maison R-7');
    expect(referenceHead).not.toHaveTextContent('forme publiée liquide');
    expect(referenceHead).not.toHaveTextContent('LOT-R7-B');
    const stockRow = table.querySelector<HTMLTableSectionElement>('tbody[data-criterion="stock"]')!;
    expect(stockRow.querySelector('[data-reference-stock]')).toHaveTextContent('Lot LOT-R7-B');
    expect(stockRow.querySelector(`td[data-candidate-id="${alternative.yeastId}"]`)).toHaveTextContent('Non consulté ici');
    expect(table.querySelector('[data-comparison-row="form"][data-role="reference"]')).toHaveTextContent('levain');
    expect(table.querySelector('[data-comparison-row="form"][data-role="reference"]')).toHaveTextContent('Fiche catalogue : liquide');
    expect(onChoose).not.toHaveBeenCalled();
  });

  it('corrige séparément la référence réelle et le candidat pendant son essai côte à côte', async () => {
    installGenericYeast();
    const changed = vi.fn(), user = userEvent.setup();
    render(<Host changed={changed} factsEditor={<p data-testid="reference-facts">Données du brouillon actuel</p>} />);
    openCatalogue(); search('R-7'); tryRow(rowOf('qa-culture-r7'));
    await user.click(screen.getByRole('button', { name: 'Comparer avec SafAle US-05' }));
    const table = await screen.findByRole('table', { name: 'Critères comparés pour chaque levure' });
    await user.click(within(table).getByRole('button', { name: 'Corriger la fiche de SafAle US-05, levure du brouillon' }));
    const referenceSheet = document.querySelector<HTMLDetailsElement>('[data-sheet-scope="recipe"]')!;
    const candidateSheet = document.querySelector<HTMLDetailsElement>('[data-sheet-scope="candidate"]')!;
    expect(referenceSheet.open).toBe(true); expect(screen.getByTestId('reference-facts')).toBeVisible();
    expect(candidateSheet.open).toBe(false); expect(document.querySelector('.yc-trial-status')).toHaveTextContent('Essai de conduite Culture maison R-7');
    await user.click(within(candidateSheet).getByText('Compléter ou corriger la fiche de Culture maison R-7'));
    expect(referenceSheet.open).toBe(true); expect(candidateSheet.open).toBe(true);
    expect(changed).not.toHaveBeenCalled();
  });

  it('périme la réponse de recherche A après une correction manuelle de la fiche A', async () => {
    const source = installGenericYeast(), changed = vi.fn(), pending = deferred<ReturnType<typeof sheetReply>>();
    ai.run.mockImplementationOnce(() => pending.promise);
    render(<Host changed={changed} />);
    openCatalogue(); search('R-7'); tryRow(rowOf(source.id));
    const candidateSheet = document.querySelector<HTMLDetailsElement>('[data-sheet-scope="candidate"]')!;
    const sheetRevision = () => candidateSheet.querySelector<HTMLElement>('[data-sheet-revision]')!;
    await userEvent.setup().click(within(candidateSheet).getByText('Compléter ou corriger la fiche de Culture maison R-7'));
    await userEvent.setup().click(within(candidateSheet).getByRole('button', { name: 'Rechercher la fiche avec l’IA' }));
    await waitFor(() => expect(ai.run).toHaveBeenCalledTimes(1));
    fireEvent.change(within(candidateSheet).getByRole('textbox', { name: 'Nouvelle note documentaire' }), { target: { value: 'Correction manuelle A' } });
    await userEvent.setup().click(within(candidateSheet).getByRole('button', { name: 'Ajouter la note' }));
    expect(sheetRevision()).toHaveAttribute('data-sheet-revision', '1');
    pending.resolve(sheetReply(source.name, 'Réponse arrivée avant la correction manuelle'));
    await waitFor(() => expect(within(candidateSheet).getByText(/proposition périmée/)).toBeVisible());
    expect(sheetRevision()).toHaveAttribute('data-sheet-revision', '1');
    expect(within(candidateSheet).getByText('Correction manuelle A')).toBeVisible();
    expect(within(candidateSheet).queryByText('Réponse arrivée avant la correction manuelle')).not.toBeInTheDocument();
    expect(changed).not.toHaveBeenCalled();
  });

  it('rafraîchit plan et comparaison depuis le candidat courant quand le catalogue change sous le même hopIndexId', async () => {
    const initial = recipe(), source = installGenericYeast(), changed = vi.fn();
    const view = render(<Host initial={initial} changed={changed} />);
    openCatalogue(); search('R-7'); tryRow(rowOf(source.id));
    expect(document.querySelector('.yc-trial-status')).toHaveTextContent('Culture maison R-7');
    openScenario();
    const before = screen.getByRole('region', { name: 'Scénario de levure' })
      .querySelector<HTMLElement>('figure[aria-label="Calendrier des températures de fermentation"]')!;
    const beforeMax = Number(before.dataset.tempMax);
    const updated = reviseGenericYeast(source, 'Culture maison R-7 · révision 2', { min: 30, max: 40 });
    view.rerender(<Host initial={initial} changed={changed} />);
    expect(document.querySelector('.yc-trial-status')).toHaveTextContent(updated.name);
    const after = screen.getByRole('region', { name: 'Scénario de levure' })
      .querySelector<HTMLElement>('figure[aria-label="Calendrier des températures de fermentation"]')!;
    expect(Number(after.dataset.tempMax)).toBeGreaterThan(beforeMax);
    expect(Number(after.dataset.tempMax)).toBeGreaterThanOrEqual(40);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Comparer avec SafAle US-05' }));
    const table = await screen.findByRole('table', { name: 'Critères comparés pour chaque levure' });
    const candidateHead = table.querySelector<HTMLElement>(`th[data-candidate-id="${source.id}"]`)!;
    expect(candidateHead).toHaveTextContent(updated.name);
    expect(table.querySelector(`td[data-candidate-id="${source.id}"][data-comparison-row="temperature"]`)).toHaveTextContent('30–40 °C');
    expect(changed).not.toHaveBeenCalled();
  });

  it('rejette à réception et avant validation une réponse de fiche fondée sur une base catalogue périmée', async () => {
    const source = installGenericYeast(), changed = vi.fn(), pending = deferred<ReturnType<typeof sheetReply>>();
    ai.run.mockImplementationOnce(() => pending.promise);
    const view = render(<Host changed={changed} />);
    openCatalogue(); search('R-7'); tryRow(rowOf(source.id));
    const candidateSheet = document.querySelector<HTMLDetailsElement>('[data-sheet-scope="candidate"]')!;
    const sheetRevision = () => candidateSheet.querySelector<HTMLElement>('[data-sheet-revision]')!;
    await userEvent.setup().click(within(candidateSheet).getByText('Compléter ou corriger la fiche de Culture maison R-7'));
    await userEvent.setup().click(within(candidateSheet).getByRole('button', { name: 'Rechercher la fiche avec l’IA' }));
    await waitFor(() => expect(ai.run).toHaveBeenCalledTimes(1));
    const updated = reviseGenericYeast(source, 'Culture maison R-7 · révision 2', { min: 30, max: 40 });
    view.rerender(<Host changed={changed} />);
    pending.resolve(sheetReply(source.name, 'Réponse arrivée sur la base précédente'));
    await waitFor(() => expect(within(candidateSheet).getByText(/proposition périmée/)).toBeVisible());
    expect(sheetRevision()).toHaveAttribute('data-sheet-revision', '0');
    expect(changed).not.toHaveBeenCalled();

    ai.run.mockResolvedValueOnce(sheetReply(updated.name, 'Réponse de la base actuelle'));
    await userEvent.setup().click(within(candidateSheet).getByRole('button', { name: 'Relancer la recherche' }));
    const apply = await within(candidateSheet).findByRole('button', { name: 'Tout valider' });
    // Simulate a catalogue refresh between the ready panel render and the apply event.
    const liveReference = yeastReferences(knowledge.rows).find(reference => reference.id === source.id)!;
    const nextBase = reviseGenericYeast(liveReference, 'Culture maison R-7 · révision 3', { min: 32, max: 42 });
    Object.assign(liveReference, nextBase);
    knowledge.rows = [nextBase];
    await userEvent.setup().click(apply);
    await waitFor(() => expect(within(candidateSheet).getByText(/proposition périmée/)).toBeVisible());
    expect(sheetRevision()).toHaveAttribute('data-sheet-revision', '0');
    expect(within(candidateSheet).queryByText('Réponse de la base actuelle')).not.toBeInTheDocument();
    expect(changed).not.toHaveBeenCalled();
  });

  it('ne prétend pas comparer un candidat non ajouté quand les six places sont occupées', async () => {
    const reference = installGenericYeast(), alternatives = Array.from({ length: MAX_COMPARED_ALTERNATIVES + 1 }, (_, index) =>
      makeGenericYeast(`qa-alt-${index + 1}`, `Culture alternative ${index + 1}`, `A-${index + 1}`));
    const all = [reference, ...alternatives], candidates = yeastRecipeCandidates('unknown', 'balanced', all, 20, { includeOtherStyles: true });
    const selectedId = reference.id, requested = alternatives.at(-1)!, candidateRows = candidates.filter(candidate => candidate.yeastId !== requested.id);
    const user = userEvent.setup(), choose = vi.fn();
    const view = render(<div className="yeast-choice"><YeastChoiceResults candidates={candidates} shown={candidateRows} selectedId={selectedId} onChoose={choose} /></div>);
    for (const candidate of alternatives.slice(0, MAX_COMPARED_ALTERNATIVES))
      await user.click(within(rowOf(candidate.id)).getByRole('checkbox'));
    expect(screen.getByRole('group', { name: 'Levures à comparer' })).toHaveAttribute('data-count', String(MAX_COMPARED_ALTERNATIVES));
    view.rerender(<div className="yeast-choice"><YeastChoiceResults candidates={candidates} shown={candidateRows} selectedId={selectedId} onChoose={choose}
      compareRequest={{ id: requested.id, nonce: 1 }} /></div>);
    const notice = await screen.findByText(/Comparaison pleine/);
    expect(notice).toHaveTextContent('Culture alternative 7 n’a pas été ajouté');
    expect(screen.queryByRole('region', { name: 'Comparaison des levures' })).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Levures à comparer' })).toHaveAttribute('data-count', String(MAX_COMPARED_ALTERNATIVES));
    expect(choose).not.toHaveBeenCalled();
  });

  it('règle au doigt un programme générique 4/2/7 j, ajoute puis retire un palier, applique et retrouve les mêmes jours à la réouverture', () => {
    const initial: Recipe = { ...personal(), fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 19, days: 4 },
      { name: 'Repos', kind: 'reposDiacetyle', tempC: 21, days: 2 }, { name: 'Garde', kind: 'garde', tempC: 3, days: 7 }] };
    const changed = vi.fn(); render(<Host initial={initial} changed={changed} />);
    openScenario();
    selectPhase(0);
    const handle = screen.getByRole('slider', { name: 'Durée du palier 1 · Primaire, poignée de fin' });
    expect(handle).toBeVisible();
    const scenario = screen.getByRole('region', { name: 'Scénario de levure' });
    const figure = scenario.querySelector<HTMLElement>('figure[aria-label="Calendrier des températures de fermentation"]')!;
    const surface = figure.querySelector<HTMLElement>('.yc-chart-surface')!;
    const svg = figure.querySelector<SVGSVGElement>('svg[data-plot-left]')!;
    const makeRect = (width: number, height: number) => ({ x: 0, y: 0, left: 0, top: 0, right: width, bottom: height, width, height, toJSON: () => ({}) } as DOMRect);
    // jsdom has no layout; give the moved handle and chart realistic bounds so the gesture stays inside the graph.
    vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue(makeRect(400, 500));
    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue(makeRect(400, Number(svg.getAttribute('height'))));
    const read = (name: string) => Number(svg.getAttribute(`data-${name}`));
    const perDay = (read('plot-right') - read('plot-left')) / read('scale-end-day');
    fireEvent.pointerDown(handle, { pointerId: 2, button: 0, clientX: 150, clientY: 90 });
    fireEvent.pointerMove(handle, { pointerId: 2, clientX: 150 + 2 * perDay, clientY: 90 });
    fireEvent.pointerUp(handle, { pointerId: 2, clientX: 150 + 2 * perDay, clientY: 90 });
    const rows = () => [...screen.getByRole('region', { name: 'Programme proposé' }).querySelectorAll<HTMLElement>('ol > li')];
    const chart = () => screen.getByRole('region', { name: 'Scénario de levure' }).querySelector('figure');
    expect(rows().map(row => [row.dataset.phaseStart, row.dataset.phaseDays])).toEqual([['0', '6'], ['6', '2'], ['8', '7']]);
    expect(chart()).toHaveAttribute('data-total-days', '15');
    expect(phaseField('Durée du palier 1 · Primaire')).toHaveValue('6');
    const kind = screen.getByRole('combobox', { name: 'Type du palier à ajouter' }); expect(kind).toBeVisible();
    fireEvent.change(kind, { target: { value: 'garde' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un palier après le palier 1' }));
    expect(rows()).toHaveLength(4);
    expect(rows()[1]).toHaveAttribute('data-phase-days', '');
    expect(rows()[2]).toHaveAttribute('data-phase-start', '');
    expect(screen.getByRole('button', { name: 'Appliquer au brouillon' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer le palier 2 · Garde' }));
    expect(rows().map(row => row.dataset.phaseDays)).toEqual(['6', '2', '7']);
    expect(changed).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    const next = changed.mock.lastCall![0] as Recipe;
    expect(next.fermentation.map(phase => [phase.name, phase.tempC, phase.days])).toEqual([['Primaire', 19, 6], ['Repos', 21, 2], ['Garde', 3, 7]]);
    cleanup(); render(<Host initial={next} />);
    openScenario();
    expect(rows().map(row => [row.dataset.phaseStart, row.dataset.phaseDays])).toEqual([['0', '6'], ['6', '2'], ['8', '7']]);
    expect(chart()).toHaveAttribute('data-total-days', '15');
  });
});
