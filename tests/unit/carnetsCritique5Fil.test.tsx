// @vitest-environment jsdom
/**
 * Port du carnet, critique 5, lot D (fil, champ, gestes, banc). Un test par correction (CRITIQUE-5.md) :
 * 1 n° 3 (le cadre nomme le carnet visé ; annoncé = rangé) ; 2 n° 2 (un seul bandeau après la création) ; 3 n° 5 et 21 (bulle G8 au focus,
 * une ligne) ; 4 n° 6 et 39 (lien collé dans un carnet : article de ce carnet, aucun carnet neuf, URL une fois) ; 5 n° 7 (note en vrac :
 * pendant, après, Annuler défait tout) ; 6 n° 24 et 43 (IA en échec, hors ligne : l'avis, jamais « Rangé ici ») ; 7 n° 26 (renommer garde
 * le carnet) ; 8 n° 34 (placeholder lisible) ; 9 n° 42 (un seul habit d'envoi) ; 12 (banc : `&zero=1`, états atteignables).
 * Les corrections 10 (Garder à part) et 11 (Note supprimée) sont jouées de bout en bout dans `tests/integration/carnetsParcours.test.tsx`.
 * Fixture « ZZ TEST — … », magasin mémoire, IA simulée : aucun appel réel.
 */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AVIS_IA, CarnetsVue, destinationDans } from '../../src/ui/carnets/CarnetsVue';
import { ChampCarnet, titreCourt } from '../../src/ui/carnets/ChampCarnet';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { appelsSimules, type AppelsIA } from '../../src/ui/carnets/rangement';
import { aidesCarnet, type ModeCarnetIA } from '../../src/config/carnetIA';
import { fixtureCarnets, ID_EVIER, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnets, lireMessages } from '../../src/domain/carnets/modele';
import { departBanc, ETATS_BANC, lireParametresBanc } from '../../src/design/CarnetsPreview';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
const run = vi.fn();
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: (...a: unknown[]) => run(...a) } }));
/* La bulle G8 : CE QU'ELLE DIT vient du lot A (`critereQuiTranche`, en cours de réécriture : « la caractéristique manquante ») ; ce lot
   prouve QUAND elle paraît. Le calcul est donc fixé ici pour Ventilation, le reste de `comparer.ts` est le vrai. */
vi.mock('../../src/domain/carnets/comparer', async importOriginal => {
  const vrai = await importOriginal<typeof import('../../src/domain/carnets/comparer')>();
  return { ...vrai, critereQuiTranche: (c: { id?: string }) => (c.id === 'ZZ-CARNET-VENTILATION'
    ? { critere: { id: 'k', texte: 'débit', origine: 'vous' }, entre: ['Hotte inox + extracteur', 'Extracteur mural seul'] } : null) };
});

beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); expect(run).not.toHaveBeenCalled(); });

const enPanne = (): AppelsIA => ({
  ranger: async () => ({ ok: false, error: 'panne simulée' }),
  lire: async url => ({ url, domaine: 'exemple.invalid', statut: 'indisponible', luLe: 0 })
});

function monter(o: { delai?: number; ouvrir?: string; mode?: ModeCarnetIA; horsLigne?: boolean; appels?: AppelsIA; vide?: boolean } = {}) {
  const magasin = magasinMemoire(o.vide ? [] : fixtureCarnets());
  const vue = render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={o.mode ?? 'simule'}
    appels={o.appels ?? appelsSimules('normal', o.delai ?? 20)} aides={aidesCarnet('simule', {})} horsLigne={o.horsLigne}
    {...(o.ouvrir ? { ouvrir: { id: o.ouvrir, at: 1 } } : {})} ecrirePlan={() => {}} />);
  const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
  const carnets = () => lireCarnets(magasin.lire(), { archives: true });
  const carnet = (id: string) => carnets().find(c => c.id === id)!;
  return { magasin, vue, champ, carnets, carnet };
}
const attendre = async (ms = 30) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const taper = (champ: () => HTMLTextAreaElement, txt: string) => fireEvent.change(champ(), { target: { value: txt } });
const soumettre = async (champ: () => HTMLTextAreaElement) => { await act(async () => { fireEvent.submit(champ().closest('form')!); }); };
const texteDe = () => document.body.textContent ?? '';
const effetsDe = (magasin: ReturnType<typeof magasinMemoire>, texte: string) =>
  lireMessages(magasin.lire()).find(m => m.carnetMessage.texte === texte)?.carnetMessage.effets ?? [];

describe('1 · n° 3 : le cadre nomme le carnet où la phrase ira ; ce qui est annoncé est ce qui est fait', () => {
  const PHRASE = 'Évier inox, fond de bac 38 cm minimum';

  it('dans Ventilation, la phrase de l’évier : « ↓ va dans Évier inox », puce préchoisie, puis rangée dans Évier inox', async () => {
    const { magasin, champ, carnet } = monter({ ouvrir: ID_VENTILATION });
    const n0 = lireCarnets(magasin.lire()).length;
    const dest = destinationDans(PHRASE, carnet(ID_VENTILATION), lireCarnets(magasin.lire()));
    expect(dest.carnetId).toBe(ID_EVIER);
    taper(champ, PHRASE);
    const cadre = document.querySelector('[data-cadre="texte"] section')!;
    /* décision du pilote (critique 6) : le titre stocké, « ZZ TEST — » compris */
    expect(cadre.getAttribute('data-vers')).toBe('ZZ TEST — Évier inox');
    expect(cadre.textContent).toContain('va dans ZZ TEST — Évier inox');
    expect(cadre.textContent).not.toContain('va atterrir ici');
    const groupe = screen.getByRole('group', { name: 'Va dans le carnet' });
    expect(groupe.querySelector('[aria-pressed="true"]')?.getAttribute('aria-label')).toBe('ZZ TEST — Évier inox');
    await soumettre(champ);
    await attendre(120);
    const effets = effetsDe(magasin, PHRASE);
    expect(effets.length).toBeGreaterThan(0);
    expect(effets.every(e => e.carnetId === ID_EVIER)).toBe(true);
    expect(lireCarnets(magasin.lire()).length).toBe(n0);
    expect(texteDe()).toContain('Rangé dans ZZ TEST — Évier inox');
  });

  it('corrigé d’un toucher sur « Ici » : le cadre dit « va atterrir ici » et la phrase reste dans Ventilation', async () => {
    const { magasin, champ } = monter({ ouvrir: ID_VENTILATION });
    taper(champ, PHRASE);
    fireEvent.click(screen.getByRole('button', { name: 'Ici' }));
    expect(document.querySelector('[data-cadre="texte"] section')!.getAttribute('data-vers')).toBe('ici');
    await soumettre(champ);
    await attendre(120);
    const effets = effetsDe(magasin, PHRASE);
    expect(effets.length).toBeGreaterThan(0);
    expect(effets.every(e => e.carnetId === ID_VENTILATION)).toBe(true);
  });

  it('une phrase du carnet ouvert : « va atterrir ici », aucune puce de carnet, et rangée ici même si l’IA la verrait ailleurs', async () => {
    const { magasin, champ } = monter({ ouvrir: ID_VENTILATION });
    const p = 'la hotte doit tenir 80 °C au-dessus de la cuve';
    taper(champ, p);
    expect(document.querySelector('[data-cadre="texte"] section')!.getAttribute('data-vers')).toBe('ici');
    expect(screen.queryByRole('group', { name: 'Va dans le carnet' })).toBeNull();
    await soumettre(champ);
    await attendre(120);
    expect(effetsDe(magasin, p).every(e => e.carnetId === ID_VENTILATION)).toBe(true);
  });
});

describe('2 · n° 2 : créer · après, un seul bandeau (g5:v04-4)', () => {
  it('« Moulin à malt… » : un bandeau « Carnet créé », et la phrase entière n’est pas rangée comme critère', async () => {
    const { magasin, champ, carnets } = monter();
    const phrase = 'Moulin à malt, 2 cylindres, 150 kg/h minimum';
    const avant = new Set(carnets().map(c => c.id));
    taper(champ, phrase);
    await soumettre(champ);
    await attendre(150);
    const neuf = lireCarnets(magasin.lire()).find(c => !avant.has(c.id))!;
    expect(neuf).toBeTruthy();
    expect(neuf.carnet.criteres.some(k => k.texte.trim().toLowerCase() === phrase.toLowerCase())).toBe(false);
    const bandeaux = document.querySelectorAll('[data-carnets] .cn-bandeau');
    expect(bandeaux.length).toBe(1);
    expect(bandeaux[0].textContent).toContain('Carnet créé');
    expect(document.querySelector('.cnf-proposees')).toBeNull();
  });
});

describe('3 · n° 5 et 21 : la bulle G8 au focus seulement, sur une ligne', () => {
  const sugg = { critere: 'plus de condensation au plafond', a: 'Hotte inox + extracteur', b: 'Extracteur mural seul' };
  it('ChampCarnet : rien sans focus ; au focus, une ligne (`cnf-aides-ligne`), texte entier en title', () => {
    render(<ChampCarnet valeur="" onChange={() => {}} onEnvoyer={() => {}} titreCarnet="Ventilation" suggestion={sugg} />);
    expect(document.querySelector('.cn-bulle')).toBeNull();
    fireEvent.focus(screen.getByRole('textbox'));
    const bulle = document.querySelector('.cn-bulle')!;
    expect(bulle.closest('.cnf-aides-ligne')).not.toBeNull();
    expect(bulle.getAttribute('title')).toContain('plus de condensation au plafond');
    fireEvent.blur(screen.getByRole('textbox'));
    expect(document.querySelector('.cn-bulle')).toBeNull();
  });
  it('CarnetsVue : la bulle paraît au focus du carnet au repos, jamais sous un retour « … · Annuler »', async () => {
    const { champ } = monter({ ouvrir: ID_VENTILATION });
    fireEvent.focus(champ());
    expect(document.querySelector('.cn-bulle')).not.toBeNull();
    taper(champ, 'il faudrait au moins 1 500 m³/h');
    await soumettre(champ);
    await attendre(120);
    fireEvent.focus(champ());
    expect(document.querySelector('.cn-bandeau')).not.toBeNull();
    expect(document.querySelector('.cn-bulle')).toBeNull();
  });
});

describe('4 · n° 6 et 39 : un lien collé dans un carnet ouvert', () => {
  it('Ventilation + lien : l’article est rangé dans Ventilation, aucun carnet neuf, l’URL citée une fois au plus', async () => {
    const { champ, carnets, carnet } = monter({ ouvrir: ID_VENTILATION });
    const n0 = carnets().length;
    const a0 = carnet(ID_VENTILATION).carnet.articles.length;
    const url = 'https://exemple.invalid/hotte-140';
    taper(champ, url);
    await soumettre(champ);
    await attendre(2200);
    expect(carnets().length).toBe(n0);
    expect(carnet(ID_VENTILATION).carnet.articles.length).toBe(a0 + 1);
    expect(carnet(ID_VENTILATION).carnet.articles.some(a => a.url === url)).toBe(true);
    const zone = document.querySelector('.cn-bandeau, .cn-rangee');
    expect(zone).not.toBeNull();
    const cite = (zone!.textContent ?? '').split('exemple.invalid/hotte-140').length - 1;
    expect(cite).toBeLessThanOrEqual(1);
  });
});

describe('5 · n° 7 : la note en vrac, pendant puis après', () => {
  const NOTE = 'demander au ferblantier le diamètre d’évacuation de l’évier\nhotte 120 cm trop large pour la salle de brassage ?\nacheter une gaine alu Ø 150 mm pour la ventilation';
  it('pendant « L’IA découpe votre note : 3 lignes, 2 carnets », après « 3 lignes rangées dans 2 carnets », type ▾, carnet ▾, Texte d’origine ; Annuler défait tout', async () => {
    const { magasin, champ } = monter({ delai: 300 });
    const avant = JSON.stringify(magasin.lire().filter(i => i.type === 'carnet'));
    taper(champ, NOTE);
    expect(document.querySelector('.cn-vrac')?.textContent).toMatch(/3 lignes, 2 carnets/);
    await soumettre(champ);
    await attendre(40);
    const pendant = document.querySelector('.cn-vrac')!;
    expect(pendant.textContent).toContain('L\'IA découpe votre note : 3 lignes, 2 carnets');
    expect(document.querySelector('.cn-vrac-apres')).toBeNull();
    await attendre(500);
    const apres = document.querySelector('.cn-vrac-apres')!;
    expect(apres).not.toBeNull();
    expect(apres.textContent).toContain('3 lignes rangées dans 2 carnets');
    expect(apres.querySelectorAll('select[aria-label^="Carnet de"]').length).toBe(3);
    expect(apres.querySelectorAll('select[aria-label^="Type de"]').length).toBeGreaterThanOrEqual(1);
    /* critique 6 (g5:v01-16) : « › Texte d'origine » */
    expect(apres.querySelector('details.cn-origine summary')?.textContent).toBe('› Texte d\'origine');
    fireEvent.click(apres.querySelector('.cn-bandeau button')!);
    expect(JSON.stringify(magasin.lire().filter(i => i.type === 'carnet'))).toBe(avant);
  });
});

describe('6 · n° 24 et 43 : IA en échec ou hors ligne, l’avis et jamais « Rangé ici »', () => {
  it('ajout dans Ventilation, IA en panne : « L’IA n’a pas répondu… », sans « Rangé ici »', async () => {
    const { champ } = monter({ ouvrir: ID_VENTILATION, appels: enPanne() });
    taper(champ, 'filtre à air G4, 2 pièces');
    await soumettre(champ);
    await attendre(60);
    const b = document.querySelector('.cn-bandeau[data-avis="echec"]')!;
    expect(b).not.toBeNull();
    expect(b.textContent).toContain(AVIS_IA.echec);
    expect(texteDe()).not.toContain('Rangé ici, à l\'instant');
    expect(document.querySelector('.cn-rangee')).toBeNull();
  });
  it('ajout hors ligne : l’avis vrai (l’IA ne le reprendra pas au retour du réseau), sans « Rangé ici »', async () => {
    const { champ } = monter({ ouvrir: ID_VENTILATION, horsLigne: true });
    taper(champ, 'filtre à air G4, 2 pièces');
    await soumettre(champ);
    await attendre(60);
    /* critique 6, n° 24 : l'avis est court ; au retour du réseau, « Ranger maintenant » (carnetsCritique6Fil, 10) */
    expect(document.querySelector('.cn-bandeau[data-avis="hors-ligne"]')?.textContent).toContain('Hors ligne : rangé sur l’appareil, tel quel');
    expect(texteDe()).not.toMatch(/ne le reprendra pas/);
    expect(texteDe()).not.toMatch(/rien ne bougera/);
    expect(texteDe()).not.toContain('Rangé ici, à l\'instant');
  });
  it('création depuis la liste, IA en panne : « Carnet créé » porte l’avis', async () => {
    const { champ } = monter({ appels: enPanne() });
    taper(champ, 'doseur de sucre pour la refermentation');
    await soumettre(champ);
    await attendre(60);
    const b = document.querySelector('.cn-bandeau[data-sorte="cree"]')!;
    expect(b.getAttribute('data-avis')).toBe('echec');
    expect(b.textContent).toContain('L’IA n’a pas répondu');
  });
});

describe('7 · n° 26 : renommer garde l’en-tête et le contenu', () => {
  it('✎ : le carnet reste (en-tête, notes), « Se renomme ici » à la place du titre, le titre dans le champ du bas ; Renommer', async () => {
    const { champ, carnet } = monter({ ouvrir: ID_EVIER });
    const notes = carnet(ID_EVIER).carnet.notes;
    fireEvent.click(screen.getByRole('button', { name: 'Renommer' }));
    expect(document.querySelector('.cn-ouvert .cn-tete')).not.toBeNull();
    expect(document.querySelector('.cn-ouvert .cnf-renommer')).not.toBeNull();
    if (notes[0]) expect(texteDe()).toContain(notes[0].texte);
    expect(champ().value).toContain('Évier inox');
    taper(champ, 'Évier inox 2 bacs');
    expect(document.querySelector('.cnf-renommer-titre')?.textContent).toBe('Évier inox 2 bacs');
    expect(document.querySelector('.cnf-renommer-pied')?.textContent).toContain('Entrée = renommer');
    fireEvent.click(document.querySelector('.cn-envoi-mot')!);
    await attendre(10);
    expect(carnet(ID_EVIER).title).toBe('Évier inox 2 bacs');
    expect(document.querySelector('.cnf-renommer')).toBeNull();
    expect(document.querySelector('.cn-bandeau[data-sorte="renomme"]')).not.toBeNull();
  });
});

describe('8 et 9 · n° 34 et 42 : placeholder lisible, un seul habit d’envoi', () => {
  it('titreCourt coupe au mot, sans finir sur un petit mot', () => {
    /* critique 6, n° 26 : la coupe se dit par « … » */
    expect(titreCourt('Ventilation de la salle de brassage')).toBe('Ventilation…');
    expect(titreCourt('Frigo de garde pour fûts')).toBe('Frigo de garde…');
    expect(titreCourt('Évier inox')).toBe('Évier inox');
  });
  it('dans Ventilation, à 390 : « Ajouter à Ventilation… » ; partout le même bouton « Ajouter », jamais la flèche', () => {
    const { champ } = monter({ ouvrir: ID_VENTILATION });
    /* décision du pilote (critique 6) : le titre stocké, « ZZ TEST — » compris, est passé au placeholder */
    expect(champ().getAttribute('placeholder')).toBe('Ajouter à ZZ TEST — Ventilation…');
    taper(champ, 'une note');
    expect(screen.getByRole('button', { name: 'Ajouter' }).className).toContain('cn-envoi-mot');
    cleanup();
    render(<ChampCarnet valeur="hotte au-dessus de la cuve" onChange={() => {}} onEnvoyer={() => {}} />);
    expect(screen.getByRole('button', { name: 'Ajouter' }).className).toContain('cn-envoi-mot');
    expect(screen.queryByRole('button', { name: 'Envoyer' })).toBeNull();
  });
});

describe('12 · banc : `&zero=1` et les états atteignables', () => {
  it('`&zero=1` part de rien, aux deux tailles (le paramètre ne dépend pas de la largeur)', () => {
    const p = lireParametresBanc('?preview=carnets&zero=1&theme=clair');
    expect(p.vide).toBe(true);
    expect(departBanc(p).items).toHaveLength(0);
    const { vue } = monter({ vide: true });
    expect(vue.container.querySelectorAll('.cn-liste-ligne, .cn-carte-carnet').length).toBe(0);
  });
  it('chaque état n° 13 à 18 a une adresse ou un geste écrit dans le banc', () => {
    for (const id of ['D-35', 'D-63', 'D-131', 'D-118', 'D-120', 'D-46']) {
      const e = ETATS_BANC.find(x => x.d === id)!;
      expect(e, id).toBeTruthy();
      expect(e.adresse.startsWith('?preview=carnets')).toBe(true);
      expect(e.gestes.length).toBeGreaterThan(0);
    }
    const ouvrir = lireParametresBanc('?preview=carnets&ouvrir=evier');
    expect(ouvrir.ouvrir).toBe(ID_EVIER);
  });
});
