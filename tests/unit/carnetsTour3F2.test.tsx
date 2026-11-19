// @vitest-environment jsdom
// Carnet, tour 3 du 19.11, voie f2 : un test par PCN (L13 : rouge sur le code d'avant, vert après). Calcul local, aucune IA.
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VirtuosoMockContext } from 'react-virtuoso';
import { objetDe } from '../../src/domain/carnets/analyseLocale';
import * as CMP from '../../src/domain/carnets/comparer';
import { compromisDe, tableau } from '../../src/domain/carnets/comparer';
import { fixtureCarnets, fixturePlanRealise, ID_EVIER, ID_FRIGO, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnet, lireMessages, statutDe, type CarnetDoc, type DonneesCarnet, type MessageDoc } from '../../src/domain/carnets/modele';
import { supprimerCarnet } from '../../src/domain/carnets/operations';
import { texteBandeau } from '../../src/ui/carnets/Bandeau';
import { CarnetOuvert } from '../../src/ui/carnets/CarnetOuvert';
import * as VUE from '../../src/ui/carnets/CarnetsVue';
import { Comparer } from '../../src/ui/carnets/Comparer';
import { AIDES_ETEINTES } from '../../src/ui/carnets/EtatIA';
import { StocksTab } from '../../src/components/tabs/StocksTab';
import { StorageService } from '../../src/services/storage';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { seedQa } from '../qa/hop-recipe/repo';

vi.mock('../../src/services/firestoreRepo', async () => {
  const qa = await import('../qa/hop-recipe/repo');
  return { ...qa, FirestoreRepo: { ...qa.FirestoreRepo, all: (name: string) => name === 'movements' ? [] : qa.FirestoreRepo.all(name) } };
});
vi.mock('../../src/ui/hopIndex/HopIndexWorkspace', () => ({ HopIndexWorkspace: () => null }));

afterEach(cleanup);
const rien = () => undefined;
const F = fixtureCarnets();
const lire = (id: string): CarnetDoc => lireCarnet(F.find(i => i.id === id))!;
const V = lire(ID_VENTILATION);
const avec = (c: CarnetDoc, d: Partial<DonneesCarnet>): CarnetDoc => ({ ...c, carnet: { ...c.carnet, ...d } });
const css = (f: string) => fs.readFileSync(path.resolve(__dirname, `../../src/ui/carnets/${f}`), 'utf8');

describe('PCN-159 : le titre local garde la fin de la phrase', () => {
  it('« pompe de transfert magnétique pour le moût chaud » garde « moût chaud »', () => {
    expect(objetDe('pompe de transfert magnétique pour le moût chaud')).toBe('Pompe de transfert magnétique pour le moût chaud');
  });
  it('trop long : coupé sur un mot plein, jamais sur « pour le »', () => {
    const o = objetDe('pompe de transfert magnétique inox à entraînement direct pour le moût chaud et la soude');
    expect(o).not.toMatch(/\s(pour|le|la|de|du|des|à|au|et|en|avec)$/i);
  });
});

describe('PCN-164 : la mention dit d\'où viennent les valeurs', () => {
  const sansPage = V.carnet.articles.slice(0, 2).map(a => ({ ...a, url: undefined, domaine: undefined, origine: 'locale' as const, valeurs: {} }));
  it('prix écrits dans sa phrase : « écrites par vous »', () => {
    expect((CMP as Record<string, unknown>).mentionValeurs).toBeTypeOf('function');
    const m = (CMP as unknown as { mentionValeurs: (a: unknown[]) => string }).mentionValeurs;
    expect(m(sansPage)).toBe('Valeurs écrites par vous');
    expect(m(V.carnet.articles)).toBe('Valeurs annoncées par les vendeurs');
    expect(m([...sansPage, V.carnet.articles[0]])).toBe('Valeurs annoncées par les vendeurs ou écrites par vous');
  });
  it('Comparer affiche la mention reçue', () => {
    const { container } = render(<Comparer titre="T" statut="research" tableau={tableau(avec(V, { articles: sansPage }))} mention="Valeurs écrites par vous" onRetour={rien} />);
    expect(container.querySelector('.cn-annonce')!.textContent).toContain('Valeurs écrites par vous');
    expect(container.textContent).not.toContain('annoncées par les vendeurs');
  });
});

describe('PCN-167 : supprimer un carnet emporte ses messages (et Annuler les rend)', () => {
  it('les messages qui ne visent que ce carnet partent ; l\'inverse les remet', () => {
    const avant = lireMessages(F).filter(m => m.carnetMessage.effets.some(e => e.carnetId === ID_EVIER));
    expect(avant.length).toBeGreaterThan(0);
    const r = supprimerCarnet(F, { carnetId: ID_EVIER, plans: [] });
    if (!r.ok) throw new Error('refusé');
    const retires = r.ecritures.filter(w => w.op === 'remove').map(w => (w as { id: string }).id);
    for (const m of avant.filter((x: MessageDoc) => x.carnetMessage.effets.every(e => e.carnetId === ID_EVIER))) expect(retires).toContain(m.id);
    const remis = r.inverse.filter(w => w.op === 'put').map(w => (w as { doc: { id: string } }).doc.id);
    for (const m of avant) expect(remis).toContain(m.id);
  });
});

describe('PCN-100 : un dépôt depuis la liste dit sa place', () => {
  it('« Rangé dans X, à l\'instant · 2e sur 3 »', () => {
    expect(texteBandeau({ sorte: 'ailleurs', carnet: 'Ventilation', rang: '2e sur 3' } as never)).toBe('Rangé dans Ventilation, à l\'instant · 2e sur 3');
  });
});

describe('PCN-106 : le compromis dit la raison, n\'aligne pas les valeurs', () => {
  it('la 1re seule à tenir 80 °C : « la seule à tenir 80 °C », sans « tient 80 °C : oui »', () => {
    const t = tableau(avec(V, { articles: V.carnet.articles.filter(a => ['ZZ-V-A1', 'ZZ-V-A3'].includes(a.id)) }));
    const c = compromisDe(t)!;
    expect(c).toContain('la seule à tenir 80 °C');
    expect(c).toContain('de plus');
    expect(c).not.toMatch(/tient 80 °C : oui/);
  });
  it('jamais une proposition sous son minimum', () => {
    expect(compromisDe(tableau(V)) ?? '').not.toContain('Hotte murale');
    expect(compromisDe(tableau(V)) ?? '').not.toMatch(/la 2e, 1 450/);
  });
});

describe('PCN-136 : « sous votre minimum » écrit le minimum', () => {
  it('la valeur et l\'unité du seuil', () => {
    const l = tableau(V)!.lignes.find(x => x.horsSeuil)!;
    expect(Object.values(l.horsSeuil!)[0]).toMatch(/^sous votre minimum de [\d  ]+ m³\/h$/);
  });
});

describe('PCN-155 : un lien non lu ne fait pas « À comparer »', () => {
  it('statutDe : article à lire seul → Idée', () => {
    expect(statutDe({ articles: [{ id: 'a', url: 'https://x.ch/p', valeurs: {}, lecture: 'a-lire' }], choix: undefined })).toBe('idea');
    expect(statutDe({ articles: [{ id: 'a', nom: 'Pompe', valeurs: {}, lecture: 'lue' }], choix: undefined })).toBe('research');
  });
});

const FRIGO = lire(ID_FRIGO);
const ouvrir = (c: CarnetDoc, x: Partial<React.ComponentProps<typeof CarnetOuvert>> = {}) =>
  render(<CarnetOuvert carnet={c as never} aides={AIDES_ETEINTES} liens={[]} tableau={null} onRetour={rien} onRenommer={rien} onSupprimer={rien} onNote={rien} onOuvrirArticle={rien} onComparer={rien} {...x} />);

describe('PCN-151, PCN-109, PCN-154 : carnet ouvert', () => {
  it('151 : réalisé, la pastille dit « Réalisé le … », jamais « Choisi le »', () => {
    const c = avec(FRIGO, { sortie: { planId: 'P1', le: '2026-11-15', etat: 'realise', realiseLe: '2026-11-16' } as never });
    const { container } = ouvrir(c);
    expect(container.querySelector('.cn-tete .cn-pastille')!.textContent).toMatch(/^Réalisé le 16 nov\.$/);
  });
  it('109 : le lien À venir dit une fois (la pastille R47), pas aussi en ligne de sortie', () => {
    const c = avec(FRIGO, { sortie: { planId: 'P1', le: '2026-11-16' } });
    const { container } = ouvrir(c, { liens: [{ sorte: 'a-venir', id: 'P1', libelle: 'Frigo de garde', etat: 'present', le: '2026-11-16' }] });
    expect(container.querySelectorAll('.cn-pastille-lien')).toHaveLength(1);
    expect(container.textContent).not.toContain('Dans À venir depuis');
    expect((container.textContent!.match(/À venir/g) ?? []).length).toBe(1);
  });
  it('154 : le menu ··· flotte dans la tête, le titre ne bouge pas', () => {
    const { container, getByRole } = ouvrir(FRIGO);
    act(() => { getByRole('button', { name: 'Plus' }).click(); });
    const menu = container.querySelector('.cn-menu')!;
    expect(menu.parentElement!.classList.contains('cn-tete')).toBe(true);
    expect(container.querySelector('.cn-tete')!.nextElementSibling!.classList.contains('cn-titre-ligne')).toBe(true);
    expect(css('carnets.css')).toMatch(/\.cn-tete > \.cn-menu \{[^}]*position: absolute/);
  });
});

describe('PCN-118 : « Ce qui compte » cite chaque critère qui classe', () => {
  it('tient 80 °C et le débit', () => {
    const { container } = render(<Comparer titre="T" statut="research" critere={V.carnet.criteres[0] as never} tableau={tableau(V)} onRetour={rien} />);
    const tete = container.querySelector('.cn-cmp-critere')!.textContent!;
    expect(tete).toContain('tient 80 °C');
    expect(tete).toContain('débit');
  });
});

describe('PCN-133 : puces proposées, sans doublon ni empilement', () => {
  it('dédoublonnées, sans critère déjà là, 3 au plus', () => {
    const f = (VUE as Record<string, unknown>).pucesDuCarnet as ((m: MessageDoc[], c: CarnetDoc, e: Set<string>) => { ligne: { texte: string } }[]) | undefined;
    expect(f).toBeTypeOf('function');
    const prop = (texte: string, nom: string, unite?: string) => ({ carnetId: V.id, texte, origine: 'ia' as const, caracteristique: { nom, sens: 'plus' as const, ...(unite ? { unite } : {}) } });
    const msg = (id: string, p: ReturnType<typeof prop>[]) => ({ id, type: 'carnet-message', carnetMessage: { texte: 'x', le: '2026-11-18', depuis: V.id, rangement: 'ia', effets: [], propositions: p } }) as unknown as MessageDoc;
    const ms = [msg('M1', [prop('bruit', 'bruit', 'dB'), prop('débit', 'débit', 'm³/h')]), msg('M2', [prop('bruit', 'bruit', 'dB'), prop('prix', 'poids', 'kg'), prop('a', 'hauteur', 'cm'), prop('b', 'largeur', 'cm')])];
    const r = f!(ms, V, new Set());
    const noms = r.map(x => x.ligne.texte);
    expect(noms.filter(n => n === 'bruit')).toHaveLength(1);
    expect(noms).not.toContain('débit');
    expect(r.length).toBeLessThanOrEqual(3);
  });
});

describe('PCN-120, PCN-121 : liste et rangée « Va dans »', () => {
  it('120 : carte Idée, le titre prend toute la largeur au-dessus de « Coller un lien »', () => {
    expect(css('carnets.css')).toMatch(/\.cn-carnet-coller \{[^}]*grid-template-areas/);
  });
  it('121 : la rangée « Va dans » dit qu\'elle défile (fondu à droite)', () => {
    expect(css('carnets-fil.css')).toMatch(/\.cn-champ-zone \.cn-vadans \{[^}]*mask-image/);
  });
});

describe('PCN-124 : Réalisés porte la vignette (Stocks › Matériel)', () => {
  beforeEach(() => { localStorage.clear(); StorageService.clearMemoryCache(); });
  it('chaque ligne a sa vignette', async () => {
    const { items, plans, transactions, payments } = fixturePlanRealise();
    seedQa({ creativeItems: items, financialPlans: plans, transactions, financialPayments: payments });
    StorageService.setUiState('stocks_subtab', 'materiel');
    StorageService.setUiState('stocks_materiel', 'realises');
    const readStocks = () => StorageService.getStocks();
    function Catalogue() { const stocks = useStorageValue(readStocks); return <VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 54 }}><StocksTab stocks={stocks} batches={[]} /></VirtuosoMockContext.Provider>; }
    render(<Catalogue />);
    await act(async () => { await new Promise(res => setTimeout(res, 30)); });
    const items2 = document.querySelectorAll('[data-colonne-materiel] .upgrade-item');
    expect(items2.length).toBeGreaterThan(0);
    for (const it2 of items2) expect(it2.querySelector('[data-vignette-realise]')).not.toBeNull();
  });
});
