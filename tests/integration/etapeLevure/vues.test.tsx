// Les gestes des maquettes c6b (Chercher), s5a (Comparer) et s7a (Suggérer) jouées sur l'API SIMULÉE (voie u2, vues-simule.ts) :
// aucune donnée réelle. Les vraies valeurs (US-05 en tête après « 1056 », esters + 317…) sont celles des tests de d1.
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chercher } from '../../../src/ui/etapeLevure/Chercher';
import { Comparer } from '../../../src/ui/etapeLevure/Comparer';
import { Suggerer } from '../../../src/ui/etapeLevure/Suggerer';
import type { PropsVue } from '../../../src/ui/etapeLevure/props';
import { apiSimulee, levureDe, reperes } from './vues-simule';

afterEach(cleanup);
const US05 = levureDe('us05');

function Hote({ vue, base: baseProp, init = [] as string[], spy = {} as Partial<PropsVue> }: { vue: 'chercher' | 'comparer' | 'suggerer'; base?: typeof US05 | 'aucune'; init?: string[]; spy?: Partial<PropsVue> }) {
  const base = baseProp === 'aucune' ? undefined : (baseProp ?? US05);
  const [comparees, setComparees] = useState<string[]>(init);
  const p: PropsVue & { api: typeof apiSimulee } = {
    base, reperes, comparees, api: apiSimulee,
    onChoisir: spy.onChoisir ?? vi.fn(), onComparees: (ids) => { spy.onComparees?.(ids); setComparees(ids); }, onVue: spy.onVue ?? vi.fn(), onChercherDonnee: spy.onChercherDonnee,
  };
  return vue === 'chercher' ? <Chercher {...p} /> : vue === 'comparer' ? <Comparer {...p} /> : <Suggerer {...p} />;
}

describe('Chercher (c6b)', () => {
  it('au repos : la ligne de résumé de l’API, les puces, la liste en trois rayons dans l’ordre CH · FR · DE, Europe, rare', () => {
    render(<Hote vue="chercher" />);
    const res = screen.getByRole('button', { name: /Filtres : bière/ });
    expect(res).toHaveTextContent('bière');
    expect(res).toHaveTextContent('repères 19 °C');
    expect(res).toHaveTextContent('9');
    const titres = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent ?? '');
    expect(titres[0]).toMatch(/^Vendue CH · FR · DE/);
    expect(titres[1]).toMatch(/^Fabricant présent en Europe/);
    expect(titres[2]).toMatch(/^Rare en Europe/);
  });

  it('« 1056 » tapé : la carte de la levure tapée, puis la liste ; « proche de 1056 » dans le résumé', async () => {
    const u = userEvent.setup();
    render(<Hote vue="chercher" />);
    await u.type(screen.getByLabelText('Nom, fabricant ou code'), '1056');
    expect(screen.getByRole('region', { name: /Levure tapée : Wyeast 1056 American Ale/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /proche de 1056/ })).toBeInTheDocument();
  });

  it('poser trois filtres donne le compte, retirer un filtre rend la liste', async () => {
    const u = userEvent.setup();
    render(<Hote vue="chercher" />);
    await u.click(screen.getByRole('button', { name: /^Tolérance/ }));
    const feuille = await screen.findByRole('dialog');
    // 1) tolérance ≥ 12 : la colonne « ≥12 »
    await u.click(within(feuille).getByRole('button', { name: /^≥12 : / }));
    // 2) famille : ale US
    await u.click(within(feuille).getByRole('button', { name: /^Famille/ }));
    await u.click(within(feuille).getByRole('checkbox', { name: /ale US/ }));
    // 3) sans STA1 (bascule, « Plus de filtres »)
    await u.click(within(feuille).getByRole('button', { name: /^Sans STA1/ }));
    await u.click(within(feuille).getByRole('switch'));
    await u.click(within(feuille).getByRole('button', { name: /^Voir/ }));
    const phrase = document.querySelector('[data-booster="phrase-filtres"]') as HTMLElement;
    expect(phrase).toBeTruthy();
    expect(within(phrase).getByText('ale US')).toBeInTheDocument();
    expect(within(phrase).getByText('≥ 12 % vol')).toBeInTheDocument();
    expect(within(phrase).getByText('sans STA1')).toBeInTheDocument();
    expect(within(phrase).getByText('1')).toBeInTheDocument(); // WLP001 seule : une fiche muette ne passe pas
    // Verdant tient ale US et ≥ 12 % mais sa fiche ne dit rien de STA1 : en pâle, « ⌕ STA1 ? », hors du compte
    expect(screen.getByRole('button', { name: 'STA1 ? : chercher' })).toBeInTheDocument();
    expect(screen.getByText(/STA1 non documentée/)).toHaveTextContent('dont 1 vendues ici');
    // retirer le filtre « sans STA1 » : la liste revient
    await u.click(within(phrase).getByRole('button', { name: 'Retirer sans STA1' }));
    expect(screen.getAllByText('Verdant IPA').length).toBeGreaterThan(0);
    await u.click(within(phrase).getByRole('button', { name: 'Retirer ale US' }));
    await u.click(within(phrase).getByRole('button', { name: /^Retirer ≥ 12/ }));
    expect(document.querySelector('[data-booster="phrase-filtres"]')).toBeNull();
    expect(screen.getByText('Nottingham')).toBeInTheDocument();
  });

  it('« ⌕ » appelle onChercherDonnee et ne lance rien d’autre ; une ligne pâle dit la donnée qui manque', async () => {
    const u = userEvent.setup();
    const onChercherDonnee = vi.fn(), onChoisir = vi.fn(), onComparees = vi.fn();
    render(<Hote vue="chercher" spy={{ onChercherDonnee, onChoisir, onComparees }} />);
    await u.click(screen.getByRole('button', { name: /^Sans STA1/ }));
    const feuille = await screen.findByRole('dialog');
    await u.click(within(feuille).getByRole('switch'));
    await u.click(within(feuille).getByRole('button', { name: /^Voir/ }));
    const chercher = screen.getAllByRole('button', { name: /STA1 \? : chercher/ });
    expect(chercher.length).toBeGreaterThan(0);
    await u.click(chercher[0]);
    expect(onChercherDonnee).toHaveBeenCalledTimes(1);
    expect(onChercherDonnee.mock.calls[0][1]).toBe('sansSta1');
    expect(onChoisir).not.toHaveBeenCalled();
    expect(onComparees).not.toHaveBeenCalled();
  });

  it('toucher une ligne la déroule : choisir pour la recette, poser dans Comparer', async () => {
    const u = userEvent.setup();
    const onChoisir = vi.fn(), onComparees = vi.fn();
    render(<Hote vue="chercher" spy={{ onChoisir, onComparees }} />);
    await u.click(screen.getByRole('button', { name: /Verdant IPA/ }));
    await u.click(screen.getByRole('button', { name: 'Comparer' }));
    expect(onComparees).toHaveBeenLastCalledWith(['verdant']);
    await u.click(screen.getByRole('button', { name: 'Choisir pour ma recette' }));
    expect(onChoisir).toHaveBeenCalledWith(expect.objectContaining({ id: 'verdant' }));
  });
});

describe('Comparer (s5a)', () => {
  it('colonnes : la référence (la levure de la recette) puis les posées ; les effets de fermentation avant la fiche', () => {
    render(<Hote vue="comparer" init={['verdant', 'pomona']} />);
    const tete = screen.getAllByRole('columnheader').map((c) => c.textContent);
    expect(tete[0]).toMatch(/US-05réf\./);
    expect(tete[1]).toMatch(/Verdant IPA/);
    const lignes = [...document.querySelectorAll('[data-ligne]')].map((l) => l.getAttribute('data-ligne'));
    expect(lignes.indexOf('esters')).toBeLessThan(lignes.indexOf('attenuation'));
    expect(lignes.slice(0, 4)).toEqual(['esters', 'phenols', 'houblon', 'sucres']);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('US-05, Verdant IPA ou Pomona pour ma bière ?');
  });

  it('⊕ ajoute une colonne, × la retire', async () => {
    const u = userEvent.setup();
    const onComparees = vi.fn();
    render(<Hote vue="comparer" init={['verdant']} spy={{ onComparees }} />);
    await u.click(screen.getByRole('button', { name: 'Ajouter une levure à comparer' }));
    const feuille = await screen.findByRole('dialog');
    await u.click(within(feuille).getByRole('button', { name: /Pomona/ }));
    expect(onComparees).toHaveBeenLastCalledWith(['verdant', 'pomona']);
    expect(screen.getAllByRole('columnheader').map((c) => c.textContent).join('|')).toMatch(/Pomona/);
    await u.click(screen.getByRole('button', { name: 'Retirer Verdant IPA' }));
    expect(onComparees).toHaveBeenLastCalledWith(['pomona']);
    expect(screen.getAllByRole('columnheader').map((c) => c.textContent).join('|')).not.toMatch(/Verdant/);
  });

  it('une donnée absente est une cellule « ⌕ » : un toucher appelle onChercherDonnee, et l’inconnu n’est jamais 0', async () => {
    const u = userEvent.setup();
    const onChercherDonnee = vi.fn();
    render(<Hote vue="comparer" init={['verdant']} spy={{ onChercherDonnee }} />);
    const cellule = screen.getByRole('button', { name: 'non déclarés : US-05, chercher' });
    await u.click(cellule);
    expect(onChercherDonnee).toHaveBeenCalledTimes(1);
    expect(onChercherDonnee.mock.calls[0][0]).toMatchObject({ id: 'us05' });
    expect(onChercherDonnee.mock.calls[0][1]).toBe('phenols');
    expect(cellule).toHaveClass('lvv-touche');
    expect(screen.queryByText(/^0 g\/L/)).toBeNull();
  });

  it('la visée sort de la plage : « 19 hors » en alerte (cas limite du cadre 3)', () => {
    render(<Hote vue="comparer" init={['nova']} />);
    expect(screen.getByText('19 hors')).toBeInTheDocument();
  });

  it('sans levure posée : le chemin vers Chercher', async () => {
    const u = userEvent.setup();
    const onVue = vi.fn();
    render(<Hote vue="comparer" base="aucune" spy={{ onVue }} />);
    await u.click(screen.getByRole('button', { name: /Chercher une levure/ }));
    expect(onVue).toHaveBeenCalledWith('chercher');
  });
});

describe('Suggérer (s7a)', () => {
  it('12 axes en cartes − / +, groupés Arômes · Corps · Conduite, aucun but nommé', () => {
    render(<Hote vue="suggerer" />);
    const cartes = [...document.querySelectorAll('[data-axe]')];
    expect(cartes.map((c) => c.getAttribute('data-axe')).sort()).toEqual(
      ['attenuation', 'clarte', 'esters', 'nutriments', 'phenols', 'rondeur', 'soufre', 'temperature', 'terpenes', 'thiols', 'tolerance', 'vitesse'].sort());
    expect([...document.querySelectorAll('.lvv-gl')].map((g) => g.textContent)).toEqual(['Arômes · estimé', 'Corps', 'Conduite']);
    expect(screen.queryByText(/banane|girofle|houblon en avant/i)).toBeNull();
    // une carte à 0 des deux côtés est repliée en une ligne « sans donnée »
    const vide = document.querySelector('[data-sans-donnee="1"]') as HTMLElement;
    expect(vide).toHaveTextContent('sans donnée');
    // au repos : les pistes °C et % sous chaque levure
    expect(document.querySelectorAll('.lvv-bars').length).toBeGreaterThan(0);
  });

  it('« − » sur Atténuation reclasse la liste, les vendues ici d’abord, avec le levier de l’API', async () => {
    const u = userEvent.setup();
    render(<Hote vue="suggerer" />);
    const compte = (document.querySelector('[data-axe="attenuation"] .lvv-pm-b') as HTMLElement).textContent;
    await u.click(screen.getByRole('button', { name: /^Moins de atténuation|^Moins de atténuation : / }));
    const carte = document.querySelector('[data-axe="attenuation"]') as HTMLElement;
    expect(carte).toHaveClass('lvv-grand');
    expect(carte).toHaveTextContent('levier : empâtage → Malts/sucres');
    expect(carte).toHaveTextContent(compte ?? '');
    expect(screen.getByText('Moins d\'atténuation')).toBeInTheDocument();
    const titres = [...document.querySelectorAll('.lvv-gh')].map((g) => g.textContent ?? '');
    expect(titres[0]).toMatch(/^Vendue CH · FR · DE/);
    expect(document.querySelectorAll('.lvv-ecart').length).toBeGreaterThan(0);
    // les deux autres groupes se replient en puces
    expect(document.querySelector('[data-groupe="aromes"]')).toBeNull();
    expect(screen.getByRole('button', { name: /^Arômes 4/ })).toBeInTheDocument();
  });

  it('deux axes se combinent : « Plus de thiols · plus clair », les autres groupes en puces, les jauges des deux axes par ligne', async () => {
    const u = userEvent.setup();
    render(<Hote vue="suggerer" />);
    await u.click(screen.getByRole('button', { name: /^Plus de thiols/ }));
    await u.click(screen.getByRole('button', { name: '+ un 2ᵉ axe' }));
    await u.click(screen.getByRole('button', { name: /^Plus de clarté/ }));
    expect(screen.getByText('Plus de thiols · plus clair')).toBeInTheDocument();
    expect(document.querySelectorAll('.lvv-grand').length).toBe(2);
    expect(screen.getByRole('button', { name: /^Corps 3/ })).toBeInTheDocument();
    expect(document.querySelector('.lvv-jg')).not.toBeNull();
    // un troisième axe remplace le plus ancien : jamais plus de deux
    await u.click(screen.getByRole('button', { name: /^Corps 3/ }));
    await u.click(screen.getByRole('button', { name: /^Plus de tolérance/ }));
    expect(document.querySelectorAll('.lvv-grand').length).toBe(2);
  });

  it('⊕ pose la levure dans Comparer ; toucher le ⌕ de la base appelle onChercherDonnee seul', async () => {
    const u = userEvent.setup();
    const onComparees = vi.fn(), onChercherDonnee = vi.fn(), onChoisir = vi.fn();
    render(<Hote vue="suggerer" spy={{ onComparees, onChercherDonnee, onChoisir }} />);
    await u.click(screen.getByRole('button', { name: /Moins de atténuation : / }));
    await u.click(screen.getAllByRole('button', { name: /^Ajouter .* à Comparer$/ })[0]);
    expect(onComparees).toHaveBeenCalledTimes(1);
    await u.click(document.querySelector('[data-axe="attenuation"]') ? screen.getByRole('button', { name: /Plus de atténuation : / }) : document.body);
    expect(onChoisir).not.toHaveBeenCalled();
    await u.click(screen.getByRole('button', { name: 'Effacer' }));
    await u.click(screen.getAllByRole('button', { name: /\? chercher : chercher/ })[0]);
    expect(onChercherDonnee).toHaveBeenCalledTimes(1);
    expect(onChoisir).not.toHaveBeenCalled();
  });

  it('sans levure de base : le chemin vers Chercher', async () => {
    const u = userEvent.setup();
    const onVue = vi.fn();
    render(<Hote vue="suggerer" base="aucune" spy={{ onVue }} />);
    await u.click(screen.getByRole('button', { name: /Chercher une levure/ }));
    expect(onVue).toHaveBeenCalledWith('chercher');
  });
});
