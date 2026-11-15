import { describe, expect, it } from 'vitest';
import type { CreativeItem, PricingItem } from '../../src/types';
import { apresAnnuler, contexteModele, ecrire, envoi, lireReponse, nbCochees, prixDevine, proposer, statutEnvoi, type ItemCarnet } from '../../src/domain/rangerNote';
import { modeDe } from '../../src/config/rangerNoteIA';
import { reponseSimulee } from '../../src/ui/atelier/rangerNoteSimule';
import { RANGER_NOTE, assainirRangerNote, contexteRangerNote } from '../../functions/src/rangerNote';

// Données fictives (maquette ks4) ; la saisie : sam. 14 nov. 2026. Le modèle est simulé : aucun appel réseau ici.
const SAISIE = new Date(2026, 10, 14, 9);
const NOTE = '2 fûts de 20 L pour le Carnotzet, à livrer avant le 12 déc.';
const CARNOTZET: CreativeItem = { id: 'DEMO-CT-1', type: 'prospect', title: 'Le Carnotzet Gourmand', status: 'quote', contactName: 'Stéphane', contactPhone: '+41 79 345 67 89' };
const TARIFS: PricingItem[] = [
  { product: 'NEIPA fût 20 L', biere: 'NEIPA', format: { id: 'fut', volumeL: 20 }, priceHT: 140 },
  { product: 'Pils fût 20 L', biere: 'Pils', format: { id: 'fut', volumeL: 20 }, priceHT: 140 },
  { product: 'NEIPA 33 cl', biere: 'NEIPA', format: { id: '33cl', volumeL: 0.33 }, priceHT: 3.5 }
];
const CTX = { saisie: SAISIE, contacts: [CARNOTZET], tarifs: TARIFS, bieres: ['NEIPA', 'Pils'] };
const NOTE_ITEM: ItemCarnet = { id: 'CR-1794646800000', type: 'note', title: NOTE, status: 'idea' };
const reponse = () => reponseSimulee(NOTE, SAISIE, ['Le Carnotzet Gourmand']);

describe('rangerNote : réponse du modèle → propositions', () => {
  it('une réponse valide donne une case par chose ; le client est proposé, décoché', () => {
    const effets = lireReponse(reponse(), NOTE, SAISIE);
    expect(effets).not.toBeNull();
    expect(effets![0]).toMatchObject({ sorte: 'tache', titre: 'Livrer 2 fûts de 20 L', date: '12.12.2026', nombre: 2, contenanceL: 20 });
    const props = proposer(effets!, CTX);
    expect(props.map((p) => p.sorte)).toEqual(['tache', 'lier', 'client']);
    expect(props.find((p) => p.sorte === 'client')!.coche).toBe(false);
    expect(nbCochees(props)).toBe(2);
  });

  it('réponse invalide → note brute (null)', () => {
    for (const brut of [null, 'texte', {}, { effets: 'x' }, { effets: [{ sorte: 'commande', titre: 'x' }] }, { effets: [{ sorte: 'tache', titre: '' }] }])
      expect(lireReponse(brut, NOTE, SAISIE)).toBeNull();
  });

  it('date incohérente → note brute : jour de semaine faux, date passée, date absente de la note, date impossible', () => {
    const avec = (date: string, jour?: string) => ({ effets: [{ sorte: 'tache', titre: 'Livrer', date, jour }] });
    expect(lireReponse(avec('2026-12-12', 'dim.'), NOTE, SAISIE)).toBeNull(); // le 12.12.2026 est un samedi
    expect(lireReponse(avec('2026-11-10'), NOTE, SAISIE)).toBeNull(); // passée
    expect(lireReponse(avec('2026-12-19', 'sam.'), NOTE, SAISIE)).toBeNull(); // « 19 » n'est pas dans la note
    expect(lireReponse(avec('2026-02-30'), NOTE, SAISIE)).toBeNull();
    expect(lireReponse(avec('2026-12-12', 'sam.'), NOTE, SAISIE)![0].date).toBe('12.12.2026');
    // un mot de date fonde la date sans chiffre
    expect(lireReponse(avec('2026-11-15', 'dim.'), 'Appeler le Carnotzet demain', SAISIE)![0].date).toBe('15.11.2026');
  });

  it('un nombre absent de la note est refusé (aucun chiffre inventé)', () => {
    expect(lireReponse({ effets: [{ sorte: 'tache', titre: 'Livrer', nombre: 3, contenanceL: 20 }] }, NOTE, SAISIE)).toBeNull();
  });

  it('un contact ou une bière inconnus ne sont pas liés', () => {
    const effets = lireReponse({ effets: [{ sorte: 'contact', titre: 'Chez Toto', contact: 'Chez Toto' }, { sorte: 'tache', titre: 'Livrer', biere: 'Stout imaginaire' }] }, 'Chez Toto veut une stout', SAISIE)!;
    const props = proposer(effets, CTX);
    expect(props[0]).toMatchObject({ sorte: 'noter-contact', lieu: 'Chez Toto' });
    expect(props[1]).toMatchObject({ sorte: 'tache' });
    expect((props[1] as { biere?: string }).biere).toBeUndefined();
  });

  it('« fin d\'ébu » reste un texte : une idée de bière, jamais un moment ni une durée', () => {
    const note = "Pils d'été · Nelson Sauvin en fin d'ébu";
    const props = proposer(lireReponse(reponseSimulee(note, SAISIE, []), note, SAISIE)!, CTX);
    const e = ecrire({ ...NOTE_ITEM, title: note }, props, CTX, 1)!;
    expect(e.creer).toHaveLength(1);
    expect(e.creer[0]).toMatchObject({ type: 'recipe-idea', description: note });
    expect(Object.keys(e.creer[0]).sort()).toEqual(['description', 'id', 'noteId', 'status', 'title', 'type']);
  });
});

describe('rangerNote : écritures', () => {
  it('seules les cases cochées écrivent ; prix deviné depuis Tarifs ; la tâche porte le contact lié', () => {
    const props = proposer(lireReponse(reponse(), NOTE, SAISIE)!, CTX);
    const e = ecrire(NOTE_ITEM, props, CTX, 1000)!;
    expect(e.creer).toHaveLength(1);
    expect(e.creer[0]).toMatchObject({ type: 'event', status: 'todo', title: 'Livrer 2 fûts de 20 L', date: '12.12.2026', targetPrice: 280, contactName: 'Le Carnotzet Gourmand', noteId: NOTE_ITEM.id });
    expect(e.convertir).toBeUndefined();
    expect(e.note.status).toBe('done');
    expect(e.reste).toEqual(['Bière']);
  });

  it('décocher le lien : la tâche ne porte aucun contact ; tout décocher : rien n\'est écrit', () => {
    const props = proposer(lireReponse(reponse(), NOTE, SAISIE)!, CTX).map((p) => (p.sorte === 'lier' ? { ...p, coche: false } : p));
    expect(ecrire(NOTE_ITEM, props, CTX, 1)!.creer[0].contactName).toBeUndefined();
    expect(ecrire(NOTE_ITEM, props.map((p) => ({ ...p, coche: false })) as typeof props, CTX, 1)).toBeNull();
  });

  it('Convertir en client coché : le contact lié part par le chemin de kc1', () => {
    const props = proposer(lireReponse(reponse(), NOTE, SAISIE)!, CTX).map((p) => (p.sorte === 'client' ? { ...p, coche: true } : p));
    expect(ecrire(NOTE_ITEM, props, CTX, 1)!.convertir).toBe('DEMO-CT-1');
  });

  it('Convertir coché compte dans les choses rangées : trois cases cochées, « 3 choses »', () => {
    const props = proposer(lireReponse(reponse(), NOTE, SAISIE)!, CTX).map((p) => (p.sorte === 'client' ? { ...p, coche: true } : p));
    expect(nbCochees(props)).toBe(3);
    const e = ecrire(NOTE_ITEM, props, CTX, 1)!;
    expect(e.convertir).toBe('DEMO-CT-1');
    expect(e.creer).toHaveLength(1);
  });
  it('Annuler rend la proposition corrigée (date, bière) ; une conversion faite ne revient pas', () => {
    const corrigees = proposer(lireReponse(reponse(), NOTE, SAISIE)!, CTX).map((p) => (p.sorte === 'tache' ? { ...p, date: '11.12.2026', biere: 'NEIPA' } : p.sorte === 'client' ? { ...p, coche: true } : p));
    const sans = apresAnnuler(corrigees, false);
    expect(sans).toEqual(corrigees);
    expect(sans[0]).not.toBe(corrigees[0]);
    const avecClient = apresAnnuler(corrigees, true);
    expect(avecClient.map((p) => p.sorte)).toEqual(['tache', 'lier']);
    expect(avecClient[0]).toMatchObject({ date: '11.12.2026', biere: 'NEIPA' });
  });
  it('un contact déjà client ne propose pas la conversion', () => {
    const props = proposer(lireReponse(reponse(), NOTE, SAISIE)!, { ...CTX, contacts: [{ ...CARNOTZET, status: 'validated' }] });
    expect(props.some((p) => p.sorte === 'client')).toBe(false);
  });

  it('prix : la bière choisie prend son tarif ; des prix différents sans bière → rien deviné', () => {
    const tarifs = [...TARIFS, { product: 'Stout fût 20 L', biere: 'Stout', format: { id: 'fut' as const, volumeL: 20 }, priceHT: 160 }];
    expect(prixDevine(2, 20, undefined, TARIFS)).toBe(280);
    expect(prixDevine(2, 20, undefined, tarifs)).toBeUndefined();
    expect(prixDevine(2, 20, 'Stout', tarifs)).toBe(320);
    expect(prixDevine(2, 30, undefined, TARIFS)).toBeUndefined();
    expect(prixDevine(undefined, 20, undefined, TARIFS)).toBeUndefined();
  });
});

describe('rangerNote : envoi et drapeau', () => {
  it('hors ligne → en attente ; IA éteinte → brute', () => {
    expect(envoi('simule', false)).toBe('attente');
    expect(statutEnvoi(envoi('production', false))).toBe('todo');
    expect(envoi('production', true)).toBe('ia');
    expect(envoi('eteint', true)).toBe('brute');
    expect(envoi('eteint', false)).toBe('brute');
  });
  it('production éteinte par défaut ; simulé seulement en développement au banc', () => {
    expect(modeDe(undefined, false, true)).toBe('eteint');
    expect(modeDe(undefined, true, false)).toBe('eteint');
    expect(modeDe(undefined, true, true)).toBe('simule');
    expect(modeDe('production', false, false)).toBe('production');
    expect(modeDe(undefined, true, true, 'eteint')).toBe('eteint');
    expect(modeDe(undefined, false, true, 'eteint')).toBe('eteint');
    expect(modeDe('production', false, false, 'eteint')).toBe('production');
  });
  it('le modèle reçoit la date de saisie et son jour', () => {
    expect(contexteModele(NOTE, CTX)).toMatchObject({ saisie: '2026-11-14', jourSaisie: 'sam.', contacts: ['Le Carnotzet Gourmand'] });
  });
});

describe('tâche serveur rangerNote (modèle simulé)', () => {
  it('schéma strict, tier rapide, sans pièce jointe ; la consigne interdit les prix', () => {
    expect(RANGER_NOTE.tier).toBe('fast');
    expect(RANGER_NOTE.acceptsFile).toBe(false);
    expect(JSON.stringify(RANGER_NOTE.schema)).toContain('"enum":["tache","contact","client","idee-biere"]');
    expect(RANGER_NOTE.system).toMatch(/Aucun prix/);
  });
  it('la sortie simulée du modèle passe le garde serveur puis celui de l\'app', () => {
    const modele = { effets: [...(reponse() as { effets: object[] }).effets, { sorte: 'inconnue', titre: 'x' }, { sorte: 'tache', titre: '  ', nombre: -1 }] };
    const propre = assainirRangerNote(modele);
    expect(propre.effets).toHaveLength(3);
    expect(lireReponse(propre, NOTE, SAISIE)).toHaveLength(3);
    expect(assainirRangerNote('pas du json')).toEqual({ effets: [] });
  });
  it('le contexte exige une note et une date de saisie', () => {
    expect(contexteRangerNote({ note: NOTE, saisie: '2026-11-14' })).toEqual({ note: NOTE, saisie: '2026-11-14' });
    expect(contexteRangerNote({ note: '', saisie: '2026-11-14' })).toBeNull();
    expect(contexteRangerNote({ note: NOTE })).toBeNull();
  });
});
