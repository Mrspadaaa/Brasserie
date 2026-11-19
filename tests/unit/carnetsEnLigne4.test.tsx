// @vitest-environment jsdom
/**
 * Test en ligne 4 du carnet (19.11), défauts PCN-183/190, 187, 188 et 189. Règle D383 : le rangement de l'IA fait foi. Gemini n'est
 * jamais appelé. Réponses rejouées :
 *  - envoi 6 (journal `en-ligne-4/journal-ia.md`) : « idée, titre Moulin à malt », sans carnet neuf ; son « texte » n'a pas été capturé,
 *    il est reconstruit (la phrase mise en forme) ; deux formes jouées : sans carnet, et avec l'id du carnet ouvert ;
 *  - envoi 3 (frigo dans Pompe) : réponse non capturée ; reconstruite sur la forme de l'envoi 6 (idée seule), puis avec un critère ;
 *  - envoi 1 (note en vrac) : la réponse réelle du test 2 au même message (`fixtures/carnets/en-ligne-2`, n° 1), et la forme que le
 *    test 4 a rangée (note « double paroi » absente, titre sans « 60 L ») : la réponse du test 2 moins ces deux éléments.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { magasinMemoire } from '../../src/services/carnetsStore';
import type { AppelsIA } from '../../src/ui/carnets/rangement';
import { aidesCarnet } from '../../src/config/carnetIA';
import { lireCarnets } from '../../src/domain/carnets/modele';
import { choisir, creerCarnet, ranger } from '../../src/domain/carnets/operations';
import { lireReponse, sansAccents } from '../../src/domain/carnets/ia';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));

type Reponse = { lignes: Record<string, unknown>[] };
const F2 = JSON.parse(readFileSync(join(__dirname, '../fixtures/carnets/en-ligne-2/reponses.json'), 'utf8')) as { envois: { n: number; texte: string; reponse: Reponse }[] };
const VRAC = F2.envois.find(e => e.n === 1)!;
const LE = '2026-11-19T06:04:19.000Z';
const FERM = 'ZZ TEST — Fermenteur conique inox';
const POMPE = 'ZZ TEST — Pompe de transfert magnétique';
const MOULIN = 'ZZ TEST — nouveau projet, à part : un moulin à malt électrique à 2 rouleaux';
const FRIGO = 'ZZ TEST — autre projet, sans rapport : un frigo de garde pour 20 fûts dans la cave';
/* envoi 6 : idée, titre « Moulin à malt » (gemini-3.8-flash, 13,1 s) ; `@ouvert` = l'id du carnet ouvert */
const IDEE_MOULIN = { sorte: 'idee', texte: 'Moulin à malt électrique à 2 rouleaux', titre: 'Moulin à malt' };
const IDEE_FRIGO = { sorte: 'idee', texte: 'Frigo de garde pour 20 fûts dans la cave', titre: 'Frigo de garde' };

function rejeu(reponse: Reponse): AppelsIA {
  return {
    async ranger(ctx) {
      return { ok: true, data: { lignes: reponse.lignes.map(l => (l.carnetId === '@ouvert' ? { ...l, carnetId: ctx.depuis } : { ...l })) } };
    },
    async lire(url) { return { url, domaine: '', statut: 'indisponible', luLe: 0 }; }
  };
}

function monter(titres: string[], reponse: Reponse, choisi = false) {
  const magasin = magasinMemoire([]);
  titres.forEach((titre, i) => {
    const r = creerCarnet(magasin.lire(), { id: `CARNET-${i}`, titre, message: { id: `MSG-${i}`, texte: titre, le: LE, depuis: 'liste', rangement: 'ia' } });
    if (!r.ok) throw new Error('semis');
    magasin.appliquer(r.ecritures);
  });
  if (choisi) {
    const r = ranger(magasin.lire(), { message: { id: 'MSG-art', texte: 'pompe 145 CHF', le: LE, depuis: 'CARNET-0', rangement: 'ia' },
      lignes: [{ carnetId: 'CARNET-0', sorte: 'article', origine: 'ia', nom: 'Pompe magnétique inox', lecture: 'lue', prixCentimes: 14500, devise: 'CHF' } as never] });
    if (!r.ok) throw new Error('article');
    magasin.appliquer(r.ecritures);
    const articleId = lireCarnets(magasin.lire())[0].carnet.articles[0].id;
    const c = choisir(magasin.lire(), { carnetId: 'CARNET-0', articleId, pourquoi: 'La moins chère', le: LE });
    if (!c.ok) throw new Error('choix');
    magasin.appliquer(c.ecritures);
  }
  render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode="production" appels={rejeu(reponse)}
    aides={aidesCarnet('production', {})} maintenant={() => new Date(LE)} ecrirePlan={() => {}} />);
  const carnet = (mot: string) => lireCarnets(magasin.lire()).find(c => sansAccents(c.title).includes(sansAccents(mot)));
  return { magasin, carnet };
}
const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
const attendre = async (ms = 40) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const envoyer = async (texte: string) => {
  fireEvent.change(champ(), { target: { value: texte } });
  await act(async () => { fireEvent.submit(champ().closest('form')!); });
  await attendre();
};
const ouvrir = async (titre: string) => {
  const b = [...document.querySelectorAll('.cn-carnet-corps')].find(x => x.textContent?.includes(titre)) as HTMLButtonElement | undefined;
  if (!b) throw new Error(`carnet « ${titre} » absent de la liste`);
  await act(async () => { fireEvent.click(b); });
};
const titreAffiche = () => document.querySelector('.cn-titre')?.textContent ?? null;
const contenu = (c: ReturnType<ReturnType<typeof monter>['carnet']>) =>
  [...c!.carnet.notes.map(n => n.texte), ...c!.carnet.criteres.map(k => k.texte), ...c!.carnet.facons.map(f => f.nom)].join(' | ');

beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('test en ligne 4 : une idée écrite dans un carnet ouvert', () => {
  it.each([
    ['sans carnet (le garde la rangeait dans l’ouvert)', IDEE_MOULIN],
    ['avec l’id du carnet ouvert', { ...IDEE_MOULIN, carnetId: '@ouvert' }]
  ])('PCN-183/190 : « idée, Moulin à malt » %s ouvre le carnet neuf ; rien ne reste dans le Fermenteur', async (_n, idee) => {
    const { carnet } = monter([FERM, POMPE], { lignes: [idee] });
    await ouvrir(FERM);
    await envoyer(MOULIN);
    expect(contenu(carnet('Fermenteur')), 'la phrase brute ne reste pas en note dans le Fermenteur').toBe('');
    const moulin = carnet('Moulin à malt');
    expect(moulin, 'carnet neuf de l’IA').toBeDefined();
    expect(moulin!.title).toBe('ZZ TEST — Moulin à malt');
    expect(titreAffiche(), 'le carnet neuf s’ouvre : on voit où la phrase est allée').toBe('ZZ TEST — Moulin à malt');
  });

  it('PCN-187 : « frigo de garde pour 20 fûts », écrit dans Pompe, n’est pas un critère de Pompe', async () => {
    const { carnet } = monter([FERM, POMPE], { lignes: [IDEE_FRIGO] });
    await ouvrir(POMPE);
    await envoyer(FRIGO);
    expect(carnet('Pompe')!.carnet.criteres, 'aucun critère dans Pompe').toHaveLength(0);
    expect(contenu(carnet('Pompe'))).toBe('');
    expect(carnet('Frigo de garde'), 'le frigo a son carnet').toBeDefined();
  });

  it('PCN-187 : le critère sans carnet qui parle du frigo suit son idée, pas la Pompe', async () => {
    const critere = { sorte: 'critere', texte: '20 fûts', caracteristique: { nom: 'capacité', unite: 'fûts', sens: 'plus' } };
    const { carnet } = monter([FERM, POMPE], { lignes: [IDEE_FRIGO, critere] });
    await ouvrir(POMPE);
    await envoyer(FRIGO);
    expect(carnet('Pompe')!.carnet.criteres).toHaveLength(0);
    expect(carnet('Frigo de garde')!.carnet.criteres.map(k => k.texte)).toEqual(['20 fûts']);
  });

  it('garde : une idée qui parle du carnet ouvert, ou un titre proposé, reste le carnet ouvert ; une ligne sans carnet hors sujet aussi', () => {
    const carnets = [{ id: 'F', titre: FERM }, { id: 'P', titre: POMPE }];
    const lire = (lignes: Record<string, unknown>[]) => lireReponse({ lignes }, { texte: MOULIN, carnets, depuis: 'F' })!;
    expect(lire([{ sorte: 'idee', texte: 'Fermenteur conique inox 60 L', titre: 'Fermenteur conique inox 60 L' }])[0].carnetId).toBe('F');
    expect(lire([{ sorte: 'idee', texte: 'x', titre: 'Moulin', carnetId: 'F', titrePropose: 'Moulin à malt' }])[0].carnetId).toBe('F');
    expect(lire([{ sorte: 'idee', texte: 'Moulin à malt', titre: 'Moulin à malt', carnetId: 'P' }])[0].carnetId).toBe('P');
    const deux = lire([IDEE_MOULIN, { sorte: 'critere', texte: 'Vanne en bas pour la levure' }]);
    expect(deux.find(l => l.sorte === 'critere')!.carnetId, 'la vanne ne parle pas du moulin : elle reste dans l’ouvert').toBe('F');
    expect(deux.find(l => l.sorte === 'idee')!.carnetNeuf).toBe('Moulin à malt');
  });
});

describe('test en ligne 4 : note en vrac', () => {
  /* la forme rangée au test 4 : la réponse du test 2, sans la note « double paroi », titre du fermenteur sans « 60 L » */
  const SANS: Reponse = { lignes: VRAC.reponse.lignes.filter(l => l.sorte !== 'note')
    .map(l => (l.carnetNeuf === 'Fermenteur conique inox 60 L' ? { ...l, carnetNeuf: 'Fermenteur conique inox', ...(l.sorte === 'idee' ? { titre: 'Fermenteur conique inox', texte: 'Fermenteur conique inox' } : {}) } : l)) };

  it('PCN-188 : la ligne « voir s’il existe avec double paroi » et « 60 L » que l’IA ne reprend pas restent dans le fermenteur', async () => {
    const { carnet } = monter([], SANS);
    await envoyer(VRAC.texte);
    const ferm = carnet('Fermenteur conique')!;
    expect(contenu(ferm)).toMatch(/double paroi/i);
    expect(`${ferm.title} ${contenu(ferm)}`).toMatch(/60 L/);
    expect(contenu(ferm)).toMatch(/Vanne en bas/);
    expect(contenu(carnet('Pompe de transfert')), 'rien du fermenteur dans la pompe').not.toMatch(/paroi|60/);
  });

  it('PCN-188 : la réponse réelle du test 2 (tout repris, reformulé) n’ajoute aucun doublon local', async () => {
    const { carnet } = monter([], VRAC.reponse);
    await envoyer(VRAC.texte);
    const ferm = carnet('Fermenteur conique')!;
    expect(ferm.title).toBe('ZZ TEST — Fermenteur conique inox 60 L');
    expect(ferm.carnet.notes.map(n => n.texte)).toEqual(['Vérifier s\'il existe avec double paroi']);
    expect(ferm.carnet.criteres.map(k => k.texte)).toEqual(['Vanne en bas pour la levure']);
    expect(contenu(carnet('Pompe de transfert'))).toBe('');
  });
});

describe('test en ligne 4 : menu d’un carnet choisi', () => {
  it('PCN-189 : sur un carnet choisi, le menu ne dit plus « Supprimer l’idée »', async () => {
    monter([POMPE], { lignes: [] }, true);
    await ouvrir(POMPE);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Plus' })); });
    const items = screen.getAllByRole('menuitem').map(b => b.textContent);
    expect(items.join()).not.toMatch(/Supprimer l.idée/);
    expect(items).toContain('Supprimer le carnet');
  });
});
