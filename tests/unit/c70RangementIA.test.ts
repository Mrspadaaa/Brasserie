/**
 * Voie c70-ia (C70-3, 4e retour : C67-2, C68-1, C69-1) : le rangement d'une phrase tapée sur la liste, rejoué sur les réponses RÉELLES du
 * banc `scripts/banc-rangement.ts` (Gemini 3.8 Flash, 25.11, phrases et carnets fictifs « ZZ », `tests/fixtures/c70-ia/`). Aucun appel ici.
 * Ce qui est SIMULÉ est marqué comme tel (le budget du banc n'a pas permis la passe après sur le « sujet »).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { RANGER_CARNET, RANGER_CARNET_SCHEMA, SUJET_SCHEMA, assainirRangerCarnet, sujetAssaini } from '../../functions/src/carnetIA';
import { lireReponse, sujetLu } from '../../src/domain/carnets/ia';
import { CARNETS_ZZ, PHRASES, SAISIE, lireEtJuger } from '../../scripts/banc-rangement';

type Passe = { reponses: Record<string, { brut: unknown }> };
const passe = (nom: string): Passe => JSON.parse(readFileSync(path.join(__dirname, '../fixtures/c70-ia', `${nom}.json`), 'utf8'));
const phrase = (id: string) => PHRASES.find((p) => p.id === id)!;
const avant = passe('avant'), apres = passe('apres');

describe('C70-3 : réponses réelles rejouées (genre, chemin, titre)', () => {
  it.each(['r1', 'r2', 'r5'])('%s : sans carnet du même sujet, la phrase naît avec son genre, son chemin sous le domaine et un titre court', (id) => {
    const v = lireEtJuger(phrase(id), avant.reponses[id].brut);
    expect(v.fautes, JSON.stringify(v.vu)).toEqual([]);
    expect(v.vu.chemin!.length).toBeGreaterThanOrEqual(1);
    expect(v.vu.titre!.split(/\s+/).length).toBeLessThanOrEqual(6);
  });

  it('r1 : « la pompe claque… » est un nouveau problème, Brasserie › Brassage › Pompe', () => {
    const v = lireEtJuger(phrase('r1'), avant.reponses.r1.brut);
    expect(v.vu).toMatchObject({ genre: 'probleme', domaine: 'brasserie', chemin: ['Brassage', 'Pompe'] });
  });

  it.each([['avant', avant], ['apres (consigne seule, sans « sujet »)', apres]] as const)('r4 %s : le défaut C70-3 reproduit : un carnet du même sujet désigné, ni genre ni chemin ni titre', (_n, p) => {
    const v = lireEtJuger(phrase('r4'), p.reponses.r4.brut);
    expect(v.vu.rattache).toBe('zz-densimetres');
    expect(v.vu.genreDit).toBe(false);
    expect(v.vu.chemin).toBeUndefined();
    expect(v.vu.titre).toBeUndefined();
    expect(v.juste).toBe(false);
  });
});

/* Les réponses de la passe « sujet » (`--fixtures`, une par phrase : `r1.json` … `t8.json`) : la lecture actuelle redonne, champ par champ, ce
   que le banc a relevé (genre, domaine, chemin, titre, tâche, carnet désigné). Absentes tant que la passe n'est pas faite (budget, RESULTAT.md). */
const dossier = path.join(__dirname, '../fixtures/c70-ia');
const relevees = readdirSync(dossier).filter((f) => /^[rt]\d\.json$/.test(f)).map((f) => JSON.parse(readFileSync(path.join(dossier, f), 'utf8')) as { id: string; brut: unknown; vu: unknown; juste: boolean });
describe.skipIf(relevees.length === 0)('C70-3 : passe « sujet » rejouée', () => {
  it.each(relevees.map((r) => [r.id, r] as const))('%s : même lecture que le banc', (_id, r) => {
    const v = lireEtJuger(phrase(r.id), r.brut);
    expect(JSON.parse(JSON.stringify(v.vu))).toEqual(r.vu);
    expect(v.juste).toBe(r.juste);
  });
});

describe('C70-3 : le « sujet » obligatoire de la réponse', () => {
  it('le schéma le demande en tête, requis, ses champs requis et énumérés', () => {
    expect(RANGER_CARNET_SCHEMA.required).toEqual(['sujet', 'lignes']);
    expect(RANGER_CARNET_SCHEMA.propertyOrdering[0]).toBe('sujet');
    expect(SUJET_SCHEMA.required).toEqual(['titre', 'domaine', 'genreCarnet', 'chemin']);
    expect((SUJET_SCHEMA.properties.genreCarnet as { enum: string[] }).enum).toEqual(['probleme', 'memo', 'recolte', 'idee', 'achat']);
    expect(RANGER_CARNET.system).toContain('« sujet » (en tête de la réponse)');
    expect(RANGER_CARNET.system).toContain('MÊME quand une ligne va dans un carnet de « carnets »');
  });

  it('la garde serveur le garde quand il est entier, le retire sinon', () => {
    const lignes = [{ sorte: 'note', texte: 'x' }];
    expect(assainirRangerCarnet({ sujet: { titre: ' Densimètre cassé ', domaine: 'outils', genreCarnet: 'achat', chemin: ['Mesure', 'Densimètre', 'trop'] }, lignes }).sujet)
      .toEqual({ titre: 'Densimètre cassé', domaine: 'outils', genreCarnet: 'achat', chemin: ['Mesure', 'Densimètre'] });
    expect(assainirRangerCarnet({ sujet: null, lignes })).toEqual({ lignes: [{ sorte: 'note', texte: 'x' }] });
    expect(sujetAssaini({ titre: 'A', domaine: 'cave', genreCarnet: 'achat', chemin: ['Mesure'] })).toBeUndefined();
    expect(sujetAssaini({ titre: 'A', domaine: 'outils', genreCarnet: 'tache', chemin: ['Mesure'] })).toBeUndefined();
    expect(sujetAssaini({ titre: 'A', domaine: 'outils', genreCarnet: 'achat', chemin: [] })).toBeUndefined();
  });

  /* SIMULÉ : les lignes sont la réponse RÉELLE r4 (avant) ; le « sujet » est écrit à la main, faute de budget pour la passe après (RESULTAT.md). */
  const r4AvecSujet = { sujet: { titre: 'Deuxième densimètre', domaine: 'outils', genreCarnet: 'achat', chemin: ['Mesure', 'Densimètre'], etatPropose: 'note' }, ...(avant.reponses.r4.brut as object) };

  it('r4 + sujet (SIMULÉ) : le carnet désigné reste une suggestion, et la phrase porte genre, domaine, chemin et titre', () => {
    const v = lireEtJuger(phrase('r4'), r4AvecSujet);
    expect(v.vu).toMatchObject({ genre: 'achat', genreDit: true, domaine: 'outils', chemin: ['Mesure', 'Densimètre'], titre: 'Deuxième densimètre', rattache: 'zz-densimetres' });
    expect(v.fautes).toEqual([]);
  });

  it('ce que la ligne dit elle-même prime sur le sujet ; une ligne versée dans un carnet existant n\'est pas touchée', () => {
    const texte = 'ZZ TEST — ' + phrase('r1').texte;
    const brut = { sujet: { titre: 'Pompe qui claque', domaine: 'brasserie', genreCarnet: 'idee', chemin: ['Autre'] }, ...(avant.reponses.r1.brut as object) };
    const lignes = lireReponse(brut, { texte, carnets: CARNETS_ZZ, depuis: null, maintenant: SAISIE })!;
    expect(lignes[0]).toMatchObject({ genreCarnet: 'probleme', chemin: ['Brassage', 'Pompe'], domaine: 'brasserie' });
    const memo = lireReponse({ sujet: r4AvecSujet.sujet, lignes: [{ sorte: 'note', genre: 'note', texte: 'Le densimètre est réparé', carnetId: 'zz-densimetres' }] },
      { texte: 'ZZ TEST — le densimètre est réparé, ça marche', carnets: CARNETS_ZZ, depuis: null, maintenant: SAISIE })!;
    expect(memo[0].carnetId).toBe('zz-densimetres');
    expect(memo[0].genreCarnet).toBeUndefined();
  });

  it('rien depuis un carnet ouvert ; un titre qui recopie la phrase ou dépasse 6 mots n\'est pas un titre', () => {
    const ctx = { texte: 'ZZ TEST — il nous faut un deuxième densimètre, le premier est cassé', carnets: CARNETS_ZZ };
    expect(sujetLu(r4AvecSujet, { ...ctx, depuis: 'zz-densimetres' })).toBeUndefined();
    expect(sujetLu({ sujet: { ...r4AvecSujet.sujet, titre: 'il nous faut un deuxième densimètre, le premier est cassé' } }, { ...ctx, depuis: null })?.titre).toBeUndefined();
    expect(sujetLu({ sujet: { ...r4AvecSujet.sujet, titre: 'ZZ TEST — Deuxième densimètre' } }, { ...ctx, depuis: null })).toMatchObject({ titre: 'Deuxième densimètre', genre: 'achat', chemin: ['Mesure', 'Densimètre'] });
  });
});
