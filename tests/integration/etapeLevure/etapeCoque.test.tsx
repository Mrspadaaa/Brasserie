// La coque de l'étape Levure (voie u1) : Ma levure = l5b (ligne, dose en plage, effets en jauges, conduite avec « + » et ×), le segment des
// quatre vues branchées sur les PropsVue, et « rien ne se perd » (chaque fonction de l'ancienne étape a son repli).
import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { EtapeLevure } from '../../../src/ui/etapeLevure/EtapeLevure';
import { recetteApercuEtapeLevure } from '../../../src/ui/etapeLevure/apercuDev';
import type { VueLevure, PropsVue } from '../../../src/ui/etapeLevure/props';
import type { TrialRecipe } from '../../../src/domain/hopIndex/trials';
import type { Recherche } from '../../../src/ui/etapeLevure/useRechercheDonnee';
import { PLAFOND_JOUR, jourDeZurich } from '../../../src/services/enrichissementReglages';

vi.mock('../../../src/hooks/useLiveData', () => ({ useStorageValue: () => [] }));
// Les vues de la voie u2 sont jouées par leurs propres tests : ici elles ne font que prouver le branchement des PropsVue.
const vues = vi.hoisted(() => ({ derniere: {} as Record<string, unknown> }));
vi.mock('../../../src/ui/etapeLevure/Chercher', () => ({ Chercher: (p: PropsVue) => { vues.derniere.chercher = p;
  return <button type="button" onClick={() => p.onChoisir({ id: 'lalbrew-verdant-ipa', name: 'LalBrew Verdant IPA', form: 'sèche' } as never)}>choisir Verdant (test)</button>; } }));
vi.mock('../../../src/ui/etapeLevure/Comparer', () => ({ Comparer: (p: PropsVue) => { vues.derniere.comparer = p; return <p>vue Comparer</p>; } }));
vi.mock('../../../src/ui/etapeLevure/Suggerer', () => ({ Suggerer: (p: PropsVue) => { vues.derniere.suggerer = p; return <p>vue Suggérer</p>; } }));
// Le compte du jour (D378) vit dans localStorage : chaque test part de zéro, quel que soit l'ordre des fichiers du lot.
beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { cleanup(); window.localStorage.clear(); });
const cleCompte = () => `laffinee.rechercheDonnee.${jourDeZurich(Date.now())}`;
/** Une recherche dont le test tient la réponse : jamais de Gemini réel. */
function recherchePilotee() {
  let rendre: (r: Awaited<ReturnType<Recherche>>) => void = () => {};
  const lookup = vi.fn<Recherche>(() => new Promise(fin => { rendre = fin; }));
  return { lookup, rendre: (r: Awaited<ReturnType<Recherche>>) => React.act(async () => { rendre(r); await Promise.resolve(); }) };
}

const recette = () => recetteApercuEtapeLevure() as unknown as TrialRecipe;
function Banc({ depart = recette(), onChoisir = vi.fn(), changes = [] as TrialRecipe[], recherche = undefined as Recherche | undefined, onRetenir = undefined as ((f: unknown) => boolean | void) | undefined }) {
  const [recipe, setRecipe] = useState<TrialRecipe>(depart);
  const [vue, setVue] = useState<VueLevure>('ma-levure');
  const [comparees, setComparees] = useState<string[]>([]);
  return <EtapeLevure recipe={recipe} vue={vue} onVue={setVue} comparees={comparees} onComparees={setComparees}
    onChoisir={onChoisir} onChange={next => { changes.push(next); setRecipe(next); return next; }}
    stockItems={[]} onStock={vi.fn()} onRetirer={vi.fn()} yeastChange={undefined} onYeastChange={vi.fn()}
    identityEditor={<p>éditeur stock (test)</p>} factsEditor={<p>éditeur fiche (test)</p>} aiEditor={<p>recherche IA (test)</p>} quantityEditor={<p>éditeur dose (test)</p>}
    atelier={cible => <p>ancien atelier (test) {cible ?? 'sans cible'}</p>} recherche={recherche} onRetenir={onRetenir as never} />;
}

describe('Ma levure (l5b)', () => {
  it('la ligne de la levure, sa dose en plage de sachets, les effets là où la source les donne', () => {
    render(<Banc />);
    expect(screen.getByText('SafAle US-05')).toBeTruthy();
    expect(document.querySelector('[data-lv="dose"]')?.textContent).toBe('2–3sachets');           // 15–24 g de la plage fabricant, sachets de 11,5 g
    const esters = document.querySelector('[data-axe="esters"]')!;
    expect(esters.getAttribute('data-genre')).toBe('jauge');                                       // « Low » de la fiche Fermentis : un niveau publié
    expect(esters.textContent).toContain('faible');
    // Les valeurs viennent de l'API du domaine (d1) : on ne fige pas ses données, on vérifie la règle d'affichage. Ce que la source ne dit pas se touche pour chercher.
    const genres = [...document.querySelectorAll('[data-axe]')].map(e => e.getAttribute('data-genre'));
    expect(genres).toHaveLength(5);
    expect(genres.every(g => ['jauge', 'mot', 'nombre', 'inconnu'].includes(g!))).toBe(true);
    expect(screen.getAllByRole('button', { name: /non documenté : chercher la donnée/ }).length).toBeGreaterThanOrEqual(genres.filter(g => g === 'inconnu').length);
    expect(document.querySelector('[data-axe="thiols"]')!.getAttribute('data-genre')).toBe('inconnu');   // US-05 : aucun fait de biotransformation dans le dépôt
  });

  it('la conduite : un « + » par frontière (J0, chaque bascule, la fin), un × sur le palier touché', () => {
    render(<Banc />);
    expect(document.querySelectorAll('.lv-plus').length).toBe(5);                                  // 4 paliers : J0, J4, J7, J9, fin J12
    expect(document.querySelectorAll('.lv-moins').length).toBe(1);
    expect(screen.getByRole('button', { name: /Retirer le palier 1/ })).toBeTruthy();
  });

  it('× retire le palier touché (le retrait de l’app), les autres durées sont conservées', () => {
    const changes: TrialRecipe[] = [];
    render(<Banc changes={changes} />);
    fireEvent.click(document.querySelector('[data-phase-select="1"]')!);                          // touche le palier 2
    fireEvent.click(screen.getByRole('button', { name: /Retirer le palier 2/ }));
    const ecrit = changes.at(-1)!;
    expect(ecrit.fermentation!.map(p => [p.name, p.days])).toEqual([['Fermentation principale', 4], ['Fin de fermentation', 2], ['Garde froide', 3]]);
    expect(document.querySelector('.lv-cond-sous')!.textContent).toContain('3 paliers');
  });

  it('« + » ajoute un palier inconnu à cette frontière ; la recette n’est écrite que quand ses valeurs sont renseignées (jamais 0)', () => {
    const changes: TrialRecipe[] = [];
    render(<Banc changes={changes} />);
    fireEvent.click(document.querySelector('.lv-plus[data-frontiere="1"]')!);                     // entre le palier 2 et le palier 3
    expect(document.querySelector('.lv-cond-sous')!.textContent).toContain('5 paliers');
    expect(changes).toHaveLength(0);                                                               // programme incomplet : rien n'est écrit
    const champs = screen.getByRole('group', { name: /Valeurs du palier 3/ });
    fireEvent.change(within(champs).getByLabelText('Température du palier 3'), { target: { value: '21' } });
    fireEvent.change(within(champs).getByLabelText('Durée du palier 3'), { target: { value: '2' } });
    const ecrit = changes.at(-1)!;
    expect(ecrit.fermentation).toHaveLength(5);
    expect(ecrit.fermentation![2]).toMatchObject({ name: 'Garde', tempC: 21, days: 2 });
  });

  // Verdict du critique L1 et L2 : le geste est « + » entre les paliers 2 et 3, puis « + » sur la fin J12 (maquette l5b, cadre 6).
  it.each([[1, 2, 5], [3, 4, 5]])('« + » à la frontière %i : le palier neuf est une boîte « ? °C · ? j », les autres restent dessinés, rien à 0 °C, aucune explication ajoutée', (frontiere, neuf, total) => {
    render(<Banc />);
    fireEvent.click(document.querySelector(`.lv-plus[data-frontiere="${frontiere}"]`)!);
    expect(document.querySelector('.lv-cond-sous')!.textContent).toContain(`${total} paliers`);
    const boite = document.querySelector(`[data-inconnu="${neuf}"]`);
    expect(boite).toBeTruthy();
    expect(boite!.textContent).toContain('? °C');
    expect(boite!.textContent).toContain('? j');
    // Les paliers connus sont toujours tracés (ni cartes de texte, ni graphe vidé) : 19, 19, 19 et 4 °C.
    const connus = [...document.querySelectorAll('[data-step]')].map(g => g.getAttribute('data-temp'));
    expect(connus.sort()).toEqual(['19', '19', '19', '4']);
    // L'inconnu n'est jamais dessiné à 0 °C : aucun point sur l'axe pour une température inconnue.
    const bas = document.querySelector('svg[data-plot-bottom]')!.getAttribute('data-plot-bottom');
    expect([...document.querySelectorAll('[data-transition-day] circle')].filter(c => c.getAttribute('cy') === bas)).toHaveLength(0);
    // Aucun paragraphe d'explication de plus.
    const texte = document.body.textContent ?? '';
    expect(texte).not.toContain('Calendrier partiel');
    expect(texte).not.toContain('position non calculable');
    expect(texte).not.toContain('une valeur vide reste inconnue');
    expect(document.querySelector('[role="status"].lv-note')).toBeNull();
    expect(document.querySelector('svg[data-plot-bottom]')!.textContent).toContain('fin ?');
  });

  it('un seul palier : pas de ×', () => {
    const seul = recette(); seul.fermentation = [seul.fermentation![0]];
    render(<Banc depart={seul} />);
    expect(document.querySelectorAll('.lv-moins').length).toBe(0);
    expect(document.querySelectorAll('.lv-plus').length).toBe(2);
  });

  it('recette sans levure : « Levure · choisir », le champ de recherche, aucune carte', () => {
    const vide = { ...recette(), yeast: { name: '' }, fermentation: undefined } as TrialRecipe;
    render(<Banc depart={vide} />);
    expect(screen.getByText('Levure · choisir')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Chercher une levure' })).toBeTruthy();
    expect(document.querySelector('.lv-bloc')).toBeNull();
  });

  // Verdict du critique L3 : « ⌕ » LANCE la recherche (maquette l5b : « recherche… · 3/20 » dans la cellule), on reste sur la vue en cours.
  it('« ⌕ non documenté » lance la recherche de la fiche : « recherche… · 1/20 » dans la cellule, puis la valeur « à confirmer », sans quitter Ma levure', async () => {
    const { lookup, rendre } = recherchePilotee();
    render(<Banc recherche={lookup} />);
    fireEvent.click(screen.getAllByRole('button', { name: /thiols non documenté/ })[0]);
    expect(lookup).toHaveBeenCalledOnce();
    expect(lookup.mock.calls[0][0]).toMatchObject({ name: 'SafAle US-05', hopIndexId: 'fermentis-us05' });
    const cellule = document.querySelector('[data-axe="thiols"]')!;
    expect(cellule.textContent).toContain('recherche…');
    expect(cellule.querySelector('.lv-rech')).toBeTruthy();                                            // la cellule partagée retourne à la ligne (verdict 2, N1)
    expect(cellule.textContent).toContain('1/' + PLAFOND_JOUR);
    expect(window.localStorage.getItem(cleCompte())).toBe('1');
    await rendre({ ok: true, facts: { technicalFacts: [{ key: 'biotransformation', reported: 'élevée', source: 'Fiche test', origin: 'ai' } as never] } });
    expect(cellule.textContent).toContain('élevée');
    expect(cellule.textContent).toContain('à confirmer');
    expect(document.querySelector('[data-vue="ma-levure"]')).toBeTruthy();
    expect(document.querySelector('[data-repli="fiche"]')!.hasAttribute('open')).toBe(false);          // plus de repli ouvert à la place de la recherche
  });

  // Verdict final L-a et L-b : texte court dans la cellule (détail dans le title), et le nom de la donnée devant l'état.
  it('issue d’échec : « IA indisponible · OK » dans la cellule, le détail dans le title, jamais une phrase coupée', async () => {
    const { lookup, rendre } = recherchePilotee();
    render(<Banc recherche={lookup} />);
    fireEvent.click(screen.getAllByRole('button', { name: /thiols non documenté/ })[0]);
    await rendre({ ok: false, error: 'Service IA momentanément indisponible.' });
    const cellule = document.querySelector('[data-axe="thiols"] [data-recherche="erreur"]')!;
    expect(cellule.textContent).toContain('IA indisponible');
    expect(cellule.textContent).not.toContain('momentanément');
    expect(cellule.getAttribute('title')).toBe('Service IA momentanément indisponible.');
    expect(within(cellule as HTMLElement).getByRole('button', { name: 'OK' })).toBeTruthy();
  });

  it('floculation : la cellule pleine largeur dit de quelle donnée il s’agit, « floculation · recherche… 1/20 », puis « à confirmer »', async () => {
    const { lookup, rendre } = recherchePilotee();
    render(<Banc recherche={lookup} />);
    fireEvent.click(screen.getByRole('button', { name: /Floculation non documentée/i }));
    const cellule = document.querySelector('[data-cel="floculation-recherche"]')!;
    expect(cellule.textContent).toMatch(/^floculation\s*·\s*recherche…\s*1\/20/);
    await rendre({ ok: true, facts: { technicalFacts: [{ key: 'flocculation', reported: 'moyenne', origin: 'ai' } as never] } });
    expect(cellule.textContent).toMatch(/^floculation\s*·\s*moyenne/);
    expect(cellule.textContent).toContain('à confirmer');
  });

  it('« Retenir » écrit le fait dans la recette (sa levure) ; « Écarter » rend l’inconnu', async () => {
    const { lookup, rendre } = recherchePilotee();
    const onRetenir = vi.fn(() => true);
    render(<Banc recherche={lookup} onRetenir={onRetenir} />);
    fireEvent.click(screen.getAllByRole('button', { name: /thiols non documenté/ })[0]);
    await rendre({ ok: true, facts: { technicalFacts: [{ key: 'biotransformation', reported: 'élevée', origin: 'ai' } as never] } });
    fireEvent.click(within(document.querySelector('[data-axe="thiols"]')!).getByRole('button', { name: 'Retenir' }));
    expect(onRetenir).toHaveBeenCalledWith(expect.objectContaining({ key: 'biotransformation', reported: 'élevée' }));
    expect(document.querySelector('[data-axe="thiols"]')!.textContent).toContain('retenu');
  });

  it('au plafond du jour (D378), rien ne part et la cellule le dit', async () => {
    window.localStorage.setItem(cleCompte(), String(PLAFOND_JOUR));
    const { lookup } = recherchePilotee();
    render(<Banc recherche={lookup} />);
    fireEvent.click(screen.getAllByRole('button', { name: /thiols non documenté/ })[0]);
    expect(lookup).not.toHaveBeenCalled();
    expect(document.querySelector('[data-axe="thiols"]')!.textContent).toContain(PLAFOND_JOUR + '/' + PLAFOND_JOUR);
  });

  it('depuis Comparer (M4) : onChercherDonnee lance la même recherche et Comparer reste Comparer', () => {
    const { lookup } = recherchePilotee();
    render(<Banc recherche={lookup} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Comparer' }));
    const p = vues.derniere.comparer as PropsVue;
    React.act(() => p.onChercherDonnee!({ id: 'fermentis-us05', name: 'SafAle US-05', form: 'sèche' } as never, 'phenols'));
    expect(lookup).toHaveBeenCalledOnce();
    expect(screen.getByRole('tab', { name: 'Comparer' }).getAttribute('aria-selected')).toBe('true');
    expect(document.querySelector('[data-vue="comparer"]')).toBeTruthy();
  });
});

describe('le segment et les trois autres vues', () => {
  it('quatre vues, Chercher reçoit la base et les repères de la recette ; choisir revient sur Ma levure', () => {
    const onChoisir = vi.fn();
    render(<Banc onChoisir={onChoisir} />);
    expect(screen.getAllByRole('tab').map(t => t.textContent)).toEqual(['Ma levure', 'Chercher', 'Comparer', 'Suggérer']);
    fireEvent.click(screen.getByRole('tab', { name: 'Chercher' }));
    const p = vues.derniere.chercher as PropsVue;
    expect(p.base?.id).toBe('fermentis-us05');
    expect(p.reperes).toMatchObject({ temperatureC: 19, ogVisee: 1.066 });
    fireEvent.click(screen.getByText('choisir Verdant (test)'));
    expect(onChoisir).toHaveBeenCalledWith(expect.objectContaining({ id: 'lalbrew-verdant-ipa' }));
    expect(screen.getByRole('tab', { name: 'Ma levure' }).getAttribute('aria-selected')).toBe('true');
  });

  it('Comparer et Suggérer rendent leur vue ; « Comparer (n) » compte les levures posées', () => {
    render(<Banc />);
    fireEvent.click(screen.getByRole('tab', { name: 'Comparer' }));
    expect(screen.getByText('vue Comparer')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Suggérer' }));
    expect(screen.getByText('vue Suggérer')).toBeTruthy();
    const p = vues.derniere.suggerer as PropsVue;
    React.act(() => p.onComparees(['a', 'b']));
    expect(screen.getByRole('tab', { name: /Comparer\s*\(2\)/ })).toBeTruthy();
  });
});

describe('rien ne se perd : chaque fonction de l’ancienne étape a son repli', () => {
  it('stock et saisie libre, produit exact et offres, fiche, dose et starter, objectifs, sources, atelier complet', async () => {
    render(<Banc />);
    const attendus = ['stock', 'produit', 'fiche', 'dose', 'objectifs', 'sources', 'atelier'];
    expect([...document.querySelectorAll('[data-repli]')].map(d => d.getAttribute('data-repli'))).toEqual(attendus);
    const ouvre = (id: string) => { const d = document.querySelector(`[data-repli="${id}"]`) as HTMLDetailsElement; d.open = true; fireEvent(d, new Event('toggle')); };
    ouvre('stock');
    expect(await screen.findByText('éditeur stock (test)')).toBeTruthy();
    ouvre('fiche');
    expect(await screen.findByText('éditeur fiche (test)')).toBeTruthy();
    ouvre('dose');
    expect(await screen.findByText('éditeur dose (test)')).toBeTruthy();
    ouvre('atelier');
    expect(await screen.findByText(/ancien atelier \(test\) sans cible/)).toBeTruthy();                   // l'essai de conduite et le reste vivent ici, inchangés
  });
});
