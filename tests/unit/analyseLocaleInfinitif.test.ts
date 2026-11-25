import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { estInfinitif, genreLocal, mettreEnForme } from '../../src/domain/carnets/analyseLocale';

/*
 * Défaut du 25.11 : la lecture locale prenait pour une tâche tout premier mot en -er/-ir/-re une fois l'accent retiré
 * (« Chaudière » → chaudiere, « Rencontré » → rencontre). La terminaison se teste sur le mot accentué ; les noms du métier
 * en -er/-re sont écartés par une courte liste. Sortie de CORRECTION-2-FAIT.md, lignes 55 à 90.
 */

describe('infinitif : les quatre phrases du défaut ne donnent plus de tâche', () => {
  it.each([
    ['Chaudière s’arrête toute seule après dix minutes'],
    ['Levure récoltée sur le brassin de jeudi'],
    ['Pilsner 25 kg, il en reste peu'],
    ['Rencontré le gérant du bar, il prend 6 fûts'],
  ])('« %s » : une note, jamais « à faire »', ligne => {
    expect(genreLocal(ligne)).not.toBe('a-faire');
  });
});

describe('infinitif : de vrais gestes restent des tâches', () => {
  it.each([
    ['Changer le joint'],
    ['Rappeler lundi'],
    ['Faire un starter'],
    ['Vérifier si on a assez de fûts'],
    ['Refaire le joint de la pompe'],
    ['Prendre rendez-vous avec le gérant'],
    ['Remplir le fût de 30 L'],
    ['Mettre la levure au frais'],
    ['Écrire à Marc'],
    ['Réhydrater la levure'],
    ['Ouvrir la vanne du bas'],
    ['ZZ TEST — Nettoyer la cuve'],
    ['- Contrôler la hotte'],
  ])('« %s » : à faire', ligne => {
    expect(genreLocal(ligne)).toBe('a-faire');
  });
});

describe('infinitif : noms et formes conjuguées du métier ne sont pas des infinitifs', () => {
  it.each([
    'chaudière', 'bière', 'levure', 'pilsner', 'lager', 'porter', 'starter', 'boiler', 'cuve', 'rencontré', 'récolté', 'récoltée',
    'mesure', 'facture', 'salaire', 'inventaire', 'histoire', 'cellier', 'litre', 'fer', 'hiver', 'sucre', 'ordre', 'lettre', 'livre',
  ])('« %s »', mot => {
    expect(estInfinitif(mot)).toBe(false);
  });
  it.each([
    'changer', 'rappeler', 'faire', 'vérifier', 'refaire', 'prendre', 'attendre', 'mettre', 'écrire', 'dire', 'lire', 'cuire', 'produire',
    'suivre', 'boire', 'finir', 'remplir', 'choisir', 'ouvrir', 'réhydrater', 'rompre', 'connaître', 'résoudre',
  ])('« %s » est un infinitif', mot => {
    expect(estInfinitif(mot)).toBe(true);
  });
  it('un mot suivi d’un pronom réfléchi ou d’une négation est un sujet : « Cuver s’arrête »', () => {
    expect(genreLocal('Fermenter s’arrête après deux jours')).not.toBe('a-faire');
    expect(genreLocal('Pomper ne démarre plus')).not.toBe('a-faire');
  });
});

describe('mettreEnForme : l’annonce du geste ne retire que devant un vrai infinitif', () => {
  it('« il faut appeler Marc » → « Appeler Marc »', () => {
    expect(mettreEnForme('il faut appeler Marc')).toBe('Appeler Marc');
  });
  it('« il faut levure fraîche » reste telle quelle (levure n’est pas un verbe)', () => {
    expect(mettreEnForme('il faut levure fraîche')).toBe('il faut levure fraîche');
  });
});

describe('les 12 carnets c79 : aucune tâche posée sur un nom', () => {
  const dossier = join(__dirname, '..', 'fixtures', 'c79');
  const fichiers = readdirSync(dossier).filter(f => f.endsWith('.json'));

  const lignesDe = (j: any): string[] => {
    const sortie: string[] = [];
    const ajoute = (t: unknown) => { if (typeof t === 'string') sortie.push(...t.split('\n').map(l => l.trim()).filter(Boolean)); };
    ajoute(j.carnet?.carnet?.phrase);
    for (const n of j.carnet?.carnet?.notes ?? []) ajoute(n.texte);
    for (const f of j.carnet?.carnet?.facons ?? []) ajoute(f.nom);
    for (const c of j.carnet?.carnet?.criteres ?? []) ajoute(c.texte);
    for (const m of j.messages ?? []) ajoute(m.carnetMessage?.texte);
    for (const a of j.articles ?? []) ajoute(a.nom ?? a.texte);
    for (const t of j.taches ?? []) ajoute(t.texte ?? t.titre);
    return sortie;
  };

  /* Les seuls premiers mots que ces carnets ont le droit de lire en tâche : de vrais infinitifs (relevés sur les 12 fichiers). */
  const VERBES = new Set([
    'rappeler', 'changer', 'faire', 'verifier', 'controler', 'appeler', 'commander', 'acheter', 'demander', 'ranger', 'regler', 'nettoyer',
    'reserver', 'renouveler', 'prevoir', 'brancher', 'remplacer', 'reduire', 'rehydrater', 'ensemencer', 'purger', 'tester', 'mesurer',
    'envoyer', 'relancer', 'reparer', 'decider', 'noter', 'comparer', 'prendre', 'mettre', 'preparer', 'organiser', 'contacter', 'poser', 'sentir', 'trier', 'monter', 'jeter',
  ]);

  it('il y a bien 12 carnets', () => expect(fichiers).toHaveLength(12));

  it.each(fichiers)('%s', f => {
    const j = JSON.parse(readFileSync(join(dossier, f), 'utf8'));
    const lignes = lignesDe(j);
    expect(lignes.length).toBeGreaterThan(0);
    for (const l of lignes) {
      if (genreLocal(l) !== 'a-faire') continue;
      if (/^À faire\s*:/i.test(l)) continue; /* l'étiquette dite, non un mot lu */
      const premier = l.replace(/^ZZ TEST\s*[—–-]\s*/i, '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().match(/\p{L}+/u)?.[0] ?? '';
      expect(VERBES.has(premier), `« ${l} » lu en tâche sur « ${premier} »`).toBe(true);
    }
  });
});
