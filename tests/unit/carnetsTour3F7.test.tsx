// @vitest-environment jsdom
/**
 * Carnet tour 3, voie f7 (critique tour 2, v5a) : un test par constat, rouge sur le code d'avant.
 * n° 1 (bloquant) : à 390, dans Ventilation avec la bulle G8 et un lien au presse-papier, la puce disait « Coller : e… » (une lettre) et la
 *   bulle tenait sur 7 lignes : la ligne bornait la puce (55 %, rétrécissable à rien). Attendu : la ligne passe à la ligne, la puce garde sa largeur.
 * n° 2 : « Ventilation de la salle » tapé dans la liste : « Nouveau carnet · Idée … arrive ici » restait annoncé au-dessus de « Ouvrir ce
 *   carnet », et Ajouter créait un doublon. Attendu : une seule annonce, le carnet existant ; Ajouter l'ouvre, aucun carnet neuf.
 * n° 3 : à 390, cadre d'arrivée, « Va dans [ZZ TEST — Frigo de garde…] » coupé et « Façon » coupée au bord : les rangs « Va dans » laissaient
 *   au + sa colonne (278 px) et gardaient le fondu même sans débord. Attendu : les rangs prennent la colonne du + (342 px), le fondu ne vient
 *   qu'au débord réel.
 * Fixture « ZZ TEST — … », magasin mémoire, IA rejouée : aucun appel réel.
 */
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { ChampCarnet } from '../../src/ui/carnets/ChampCarnet';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { type AppelsIA } from '../../src/ui/carnets/rangement';
import { aidesCarnet } from '../../src/config/carnetIA';
import { fixtureCarnets, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnet, lireCarnets, type CarnetDoc } from '../../src/domain/carnets/modele';
import { rangDuLien } from '../../src/ui/carnets/CarnetsVue';
import { Bandeau } from '../../src/ui/carnets/Bandeau';
import { CadreArrivee } from '../../src/ui/carnets/CadreArrivee';
import { CarnetOuvert } from '../../src/ui/carnets/CarnetOuvert';
import { AIDES_ETEINTES, type CarnetV } from '../../src/ui/carnets/EtatIA';
import { placesDe, tableau } from '../../src/domain/carnets/comparer';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));

const FIL = fs.readFileSync(path.resolve(__dirname, '../../src/ui/carnets/carnets-fil.css'), 'utf8').replace(/\r\n/g, '\n');
const regle = (sel: string) => { const i = FIL.indexOf(`${sel} {`); return i < 0 ? '' : FIL.slice(i, FIL.indexOf('}', i)); };

beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const attendre = async (ms = 40) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
const iaMuette: AppelsIA = {
  async ranger() { return { ok: true, data: { lignes: [] } }; },
  async lire(url) { return { url, domaine: '', statut: 'indisponible', luLe: 0 }; }
};
function monter() {
  const magasin = magasinMemoire(fixtureCarnets());
  render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode="simule" appels={iaMuette}
    aides={aidesCarnet('simule', {})} ecrirePlan={() => {}} />);
  return magasin;
}
const rien = () => {};

describe('f7 n° 1 : bulle G8 et puce « Coller » à 390, le lien reste lisible', () => {
  it('la ligne des aides passe à la ligne ; la puce n’est ni bornée à 55 % ni rétrécie avant de passer à la ligne', () => {
    expect(regle('.cnf-aides-ligne')).toMatch(/flex-wrap:\s*wrap/);
    const puce = regle('.cnf-aides-ligne > .cn-coller');
    expect(puce).not.toMatch(/max-width:\s*55%/);
    expect(puce).toMatch(/max-width:\s*100%/);
    /* la bulle a une base (elle cède la ligne à la puce) au lieu de tout prendre */
    expect(regle('.cnf-aides-ligne > .cn-bulle')).toMatch(/flex:\s*1 1 1[0-9]rem/);
  });
  it('bulle et puce sont rendues ensemble, la puce dit le lien', async () => {
    render(<ChampCarnet valeur="" onChange={rien} onEnvoyer={rien} coller="https://exemple.invalid/hotte-140" onColler={rien}
      suggestion={{ critere: 'pas trop de bruit', a: 'Hotte inox + extracteur', b: 'Extracteur mural seul' }} />);
    await act(async () => { fireEvent.focus(champ()); });
    const ligne = document.querySelector('.cnf-aides-ligne')!;
    expect(ligne.querySelector('.cn-bulle')).toBeTruthy();
    expect(ligne.querySelector('.cn-coller')?.textContent).toContain('exemple.invalid/hotte');
  });
});

describe('f7 n° 2 : le titre d’un carnet existant tapé dans la liste, une seule annonce', () => {
  it('le cadre n’annonce plus « Nouveau carnet · arrive ici », seulement le carnet existant et « Ouvrir ce carnet »', async () => {
    monter(); await attendre();
    fireEvent.focus(champ());
    fireEvent.change(champ(), { target: { value: 'Ventilation de la salle' } });
    await attendre(10);
    const cadre = document.querySelector('.cn-cadre')?.textContent ?? '';
    expect(cadre).toContain('ZZ TEST — Ventilation de la salle de brassage');
    expect(cadre).toContain('Ouvrir ce carnet');
    expect(cadre).not.toContain('Nouveau carnet');
    expect(cadre).not.toContain('arrive ici');
  });
  it('Ajouter ouvre le carnet existant, aucun doublon', async () => {
    const magasin = monter(); await attendre();
    const avant = lireCarnets(magasin.lire()).length;
    fireEvent.focus(champ());
    fireEvent.change(champ(), { target: { value: 'Ventilation de la salle' } });
    await attendre(10);
    fireEvent.keyDown(champ(), { key: 'Enter' });
    await attendre(300);
    expect(lireCarnets(magasin.lire()).length).toBe(avant);
    expect(champ().value).toBe('');
    expect(champ().getAttribute('placeholder') ?? '').toMatch(/^Ajouter à /);
    expect(lireCarnets(magasin.lire()).some(c => c.id === ID_VENTILATION)).toBe(true);
  });
});

describe('f7 n° 3 : les rangs « Va dans » à 390, nom entier et dernière puce visible', () => {
  it('sous 900 px, les rangs prennent la colonne du + (marge négative de 64 px) ; le champ garde 6 px de plus sous eux', () => {
    expect(FIL).toMatch(/@media \(max-width: 899px\) \{[^}]*\.cn-champ-zone > \.cn-vadans \{ margin-right: -64px; \}/);
    expect(FIL).toMatch(/\.cn-champ-zone > \.cn-vadans \+ \.cn-champ \{ margin-top: 6px; \}/);
  });
  it('le fondu et sa marge ne viennent qu’au débord réel (`data-deborde`)', () => {
    expect(regle('.cn-champ-zone .cn-vadans')).not.toMatch(/mask-image/);
    expect(regle('.cn-champ-zone .cn-vadans[data-deborde]')).toMatch(/mask-image/);
  });
  it('le champ pose `data-deborde` sur un rang dont la dernière puce dépasse, et pas sur l’autre', async () => {
    const vrai = Element.prototype.getBoundingClientRect;
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const r = (right: number) => ({ left: 24, right, top: 0, bottom: 44, width: right - 24, height: 44, x: 24, y: 0, toJSON: () => ({}) }) as DOMRect;
      if (this.classList.contains('cn-vadans')) return r(366);
      if (this.classList.contains('cn-puce') && !this.nextElementSibling) return r(this.textContent === 'Façon' ? 341 : 400);
      return vrai.call(this);
    });
    render(<ChampCarnet valeur="un frigo" onChange={rien} onEnvoyer={rien}
      vaDansCarnet={{ options: [{ id: 'a', libelle: 'ZZ TEST — Frigo de garde pour fûts' }, { id: 'b', libelle: 'Très long' }], choisi: 'a', onChoisir: rien }}
      vaDans={{ options: [{ id: 'cqc', libelle: 'Ce qui compte' }, { id: 'n', libelle: 'Note' }, { id: 'f', libelle: 'Façon' }], choisi: 'n', onChoisir: rien }} />);
    await attendre();
    const [carnet, rubrique] = [...document.querySelectorAll('.cn-vadans')];
    expect(carnet.hasAttribute('data-deborde')).toBe(true);
    expect(rubrique.hasAttribute('data-deborde')).toBe(false);
  });
});

const doc = (id: string): CarnetDoc => lireCarnet(fixtureCarnets().find(d => d.id === id)!)!;

describe('f7 n° 4 : bandeau d’un lien collé depuis la liste', () => {
  it('un lien seul se cite « votre lien », une phrase « votre message »', () => {
    const { container, rerender } = render(<Bandeau bandeau={{ sorte: 'ailleurs', carnet: 'ZZ TEST — Ventilation de la salle de brassage', cite: 'https://exemple.invalid/hotte-140' } as never} onAnnuler={rien} />);
    expect(container.querySelector('.cn-cite')?.textContent).toMatch(/^votre lien : /);
    rerender(<Bandeau bandeau={{ sorte: 'ailleurs', carnet: 'ZZ TEST — Ventilation', cite: 'une hotte pour la cuve' } as never} onAnnuler={rien} />);
    expect(container.querySelector('.cn-cite')?.textContent).toMatch(/^votre message : /);
  });
  it('le rang d’un 1er sur un critère oui/non dit le critère sans « oui » isolé', () => {
    const v = doc(ID_VENTILATION); const t = tableau(v)!;
    const premiers = t.lignes.filter(l => l.rang !== null).map(l => l.articleId)
      .filter(id => placesDe(t, id).some(p => p.rang === 1 && p.texte === 'oui'));
    expect(premiers.length).toBeGreaterThan(0);
    for (const id of premiers) {
      const r = rangDuLien(t, id, v.carnet.articles) ?? '';
      expect(r).not.toMatch(/ oui$/);
    }
  });
});

describe('f7 n° 5 : dans l’onglet À venir, la section des choisis ne contredit pas l’onglet', () => {
  it('le titre ne dit plus « pas encore dans À venir »', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../../src/ui/finance/UpgradeWorkspace.tsx'), 'utf8');
    expect(src).not.toContain('pas encore dans À venir');
    expect(src).toContain('Choisis, pas encore planifiés');
  });
});

describe('f7 n° 6 : autre projet tapé dans un carnet, destination et genre dits une fois', () => {
  it('quand les puces « Va dans [carnet] · en [genre] » sont là, le cadre ne redit pas « Notes : » ; sa tête « ↓ va dans … » (maquette G4) reste', () => {
    const { container } = render(<CadreArrivee cadre={{ sorte: 'texte', rubrique: 'Notes', texte: 'un frigo de garde pour 20 fûts', origine: 'locale', vers: 'ZZ TEST — Frigo de garde pour fûts', rangeeGenre: true } as never} onAnnuler={rien} />);
    const t = container.querySelector('.cn-cadre')!.textContent!;
    expect(t).toContain('un frigo de garde pour 20 fûts');
    expect(t).toContain('va dans ZZ TEST — Frigo de garde pour fûts');
    expect(t).not.toContain('Notes :');
    /* sans les puces (cas ordinaire), le cadre dit tout, comme avant */
    cleanup();
    const sans = render(<CadreArrivee cadre={{ sorte: 'texte', rubrique: 'Notes', texte: 'x', origine: 'locale', vers: 'ZZ TEST — Frigo' }} onAnnuler={rien} />);
    expect(sans.container.textContent).toContain('va dans');
    expect(sans.container.textContent).toContain('Notes : x');
  });
});

describe('f7 n° 7 : façon écartée « Ventilateur de plafond », la raison dite une fois', () => {
  it('la pastille de la façon porte la raison ; son article écarté pour la même raison dit « écarté » seul', () => {
    const v = doc(ID_VENTILATION); const t = tableau(v)!;
    const { container } = render(<CarnetOuvert carnet={v as unknown as CarnetV} aides={AIDES_ETEINTES} liens={[]} tableau={t as never}
      onRetour={rien} onRenommer={rien} onSupprimer={rien} onNote={rien} onOuvrirArticle={rien} onComparer={rien} />);
    const texte = container.textContent ?? '';
    expect(texte).toContain('Ventilateur de plafond');
    expect(texte.split('brasse la buée sans la sortir').length - 1).toBe(1);
  });
});
