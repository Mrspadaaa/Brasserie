import { describe, expect, it } from 'vitest';
import { fixtureCarnets, ID_EMBOUTEILLAGE, ID_EVIER, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnet, lireMessage, type CarnetDoc } from '../../src/domain/carnets/modele';
import {
  basculerVeille, changerGenre, changerSorte, choisir, creerCarnet, deplacer, deplacerArticles, fusionnerNotes, garderAPart, modifierLigne, modifierNote,
  noteEnCritere, poserSortie, ranger, regrouperNotes, remplacerRangement, renommer, revoirChoix, supprimerLigne, supprimerNote, planDepuisChoix,
  type Etat, type Resultat
} from '../../src/domain/carnets/operations';
import { magasinMemoire } from '../../src/services/carnetsStore';
import type { CreativeItem } from '../../src/types';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const LE = '2026-11-17T10:00:00.000Z';
const ok = (r: Resultat) => { if (!r.ok) throw new Error(`refusé : ${r.raison}`); return r; };

/** A2 : appliquer puis appliquer l'inverse redonne le magasin identique. Rend l'état après l'intention. */
function allerRetour(etat: Etat, r: Resultat): CreativeItem[] {
  const res = ok(r);
  expect(res.ecritures.length).toBeGreaterThan(0);
  const m = magasinMemoire(etat);
  const avant = m.lire();
  m.appliquer(res.ecritures);
  const apres = m.lire();
  expect(apres).not.toEqual(avant);
  m.appliquer(res.inverse);
  expect(m.lire()).toEqual(avant);
  return apres;
}
const carnet = (items: CreativeItem[], id: string): CarnetDoc => lireCarnet(items.find(i => i.id === id))!;

describe('opérations : chaque intention a son inverse (A2)', () => {
  const F = fixtureCarnets();

  it('créer une idée d’une phrase : carnet neuf, message gardé tel quel, statut Idée', () => {
    const r = creerCarnet(F, { id: 'C-NEUF', message: { id: 'M-NEUF', texte: 'ZZ TEST — doseur de sucre', le: LE, depuis: 'liste', rangement: 'locale' } });
    const apres = allerRetour(F, r);
    const c = carnet(apres, 'C-NEUF');
    expect(c).toMatchObject({ title: 'ZZ TEST — doseur de sucre', status: 'idea', carnet: { phrase: 'ZZ TEST — doseur de sucre', articles: [] } });
    const m = lireMessage(apres.find(i => i.id === 'M-NEUF'))!;
    expect(m.title).toBe('ZZ TEST — doseur de sucre');
    expect(m.carnetMessage.effets).toEqual([{ carnetId: 'C-NEUF', cible: 'carnet', id: 'C-NEUF' }]);
    expect(ok(r).avis).toBe('✓ Carnet créé');
  });

  it('ajouter des lignes (note en vrac) : 3 lignes dans 2 carnets, un carnet neuf ; l’article naît sans veille (R31)', () => {
    const r = ranger(F, {
      message: { id: 'M-VRAC', texte: 'douchette 45.50 CHF\nattendre le ferblantier\nprochain brassage : levures', le: LE, depuis: 'liste', rangement: 'simulee' },
      lignes: [
        { sorte: 'article', carnetId: ID_EVIER, nom: 'douchette', prixCentimes: 4550, devise: 'CHF', origine: 'exemple' },
        { sorte: 'note', carnetId: ID_VENTILATION, texte: 'attendre le ferblantier', genre: 'a-faire' },
        { sorte: 'note', carnetNeuf: { id: 'C-BRASSAGE', titre: 'Prochain brassage' }, texte: 'levures', genre: 'a-acheter' }
      ]
    });
    const apres = allerRetour(F, r);
    expect(ok(r).avis).toBe('✓ 3 lignes rangées dans 3 carnets');
    const evier = carnet(apres, ID_EVIER);
    expect(evier.status).toBe('research');
    expect(evier.carnet.articles[0]).not.toHaveProperty('veille');
    expect(evier.carnet.articles[0].messageId).toBe('M-VRAC');
    expect(carnet(apres, 'C-BRASSAGE').carnet.notes[0]).toMatchObject({ texte: 'levures', genre: 'a-acheter', messageId: 'M-VRAC' });
  });

  it('un lien (IA simulée) : l’article naît sans veille, même lu sur la page', () => {
    const r = ranger(F, { message: { id: 'M-LIEN', texte: 'https://exemple.invalid/v6', le: LE, depuis: ID_VENTILATION, rangement: 'simulee' },
      lignes: [{ sorte: 'article', carnetId: ID_VENTILATION, url: 'https://exemple.invalid/v6', domaine: 'exemple.invalid', nom: 'Extracteur 2', prixCentimes: 50000, lecture: 'lue', valeurs: { 'débit': { valeur: 1300, unite: 'm³/h', origine: 'page' } }, origine: 'page' }] });
    const apres = allerRetour(F, r);
    const a = carnet(apres, ID_VENTILATION).carnet.articles.find(x => x.url === 'https://exemple.invalid/v6')!;
    expect(a.veille).toBeUndefined();
  });

  it('refuse un carnet inconnu, un message vide, un message déjà rangé', () => {
    expect(ranger(F, { message: { id: 'M-X', texte: 'x', le: LE, depuis: 'liste', rangement: 'locale' }, lignes: [{ sorte: 'note', carnetId: 'INCONNU', texte: 'x' }] }).ok).toBe(false);
    expect(ranger(F, { message: { id: 'M-Y', texte: '  ', le: LE, depuis: 'liste', rangement: 'locale' }, lignes: [] }).ok).toBe(false);
    expect(ranger(F, { message: { id: 'ZZ-MSG-V1', texte: 'x', le: LE, depuis: 'liste', rangement: 'locale' }, lignes: [] }).ok).toBe(false);
  });

  it('remplacer le rangement local par celui de l’IA, en une écriture annulable ; un carnet créé vide part', () => {
    const r1 = ok(ranger(F, { message: { id: 'M-R', texte: 'hotte plus silencieuse', le: LE, depuis: 'liste', rangement: 'locale' },
      lignes: [{ sorte: 'note', carnetNeuf: { id: 'C-LOCAL', titre: 'hotte plus silencieuse' }, texte: 'hotte plus silencieuse' }] }));
    const m = magasinMemoire(F);
    m.appliquer(r1.ecritures);
    const etat = m.lire();
    const r2 = remplacerRangement(etat, { messageId: 'M-R', rangement: 'ia', lignes: [{ sorte: 'critere', carnetId: ID_VENTILATION, texte: 'hotte plus silencieuse', origine: 'ia' }] });
    const apres = allerRetour(etat, r2);
    expect(apres.find(i => i.id === 'C-LOCAL')).toBeUndefined();
    expect(lireMessage(apres.find(i => i.id === 'M-R'))!.carnetMessage).toMatchObject({ rangement: 'ia', effets: [{ carnetId: ID_VENTILATION, cible: 'critere' }] });
  });

  it('déplacer une note : elle change de carnet, l’effet du message suit', () => {
    const apres = allerRetour(F, deplacer(F, { cible: 'note', id: 'ZZ-V-N1', depuis: ID_VENTILATION, vers: ID_EVIER }));
    expect(carnet(apres, ID_EVIER).carnet.notes.map(n => n.id)).toContain('ZZ-V-N1');
    expect(lireMessage(apres.find(i => i.id === 'ZZ-MSG-V2'))!.carnetMessage.effets[0].carnetId).toBe(ID_EVIER);
  });

  it('changer de genre, changer de sorte (note → façon, critère → note)', () => {
    expect(carnet(allerRetour(F, changerGenre(F, { carnetId: ID_VENTILATION, noteId: 'ZZ-V-N1', genre: 'question' })), ID_VENTILATION).carnet.notes[0].genre).toBe('question');
    const a = allerRetour(F, changerSorte(F, { carnetId: ID_VENTILATION, cible: 'note', id: 'ZZ-V-N1', vers: 'facon' }));
    expect(carnet(a, ID_VENTILATION).carnet.facons.at(-1)).toMatchObject({ id: 'ZZ-V-N1', nom: 'attendre l’avis du ferblantier', etat: 'ouverte' });
    const b = allerRetour(F, changerSorte(F, { carnetId: ID_VENTILATION, cible: 'critere', id: 'ZZ-V-K1', vers: 'note' }));
    expect(carnet(b, ID_VENTILATION).carnet.notes.at(-1)).toMatchObject({ id: 'ZZ-V-K1', texte: 'plus de condensation au plafond', messageId: 'ZZ-MSG-V1' });
  });

  it('modifier une note (modifieeLe), un critère ; supprimer une note : le message reste', () => {
    const a = allerRetour(F, modifierNote(F, { carnetId: ID_VENTILATION, noteId: 'ZZ-V-N1', texte: 'avis du ferblantier lundi', le: LE }));
    expect(carnet(a, ID_VENTILATION).carnet.notes[0]).toMatchObject({ texte: 'avis du ferblantier lundi', modifieeLe: LE });
    expect(modifierNote(F, { carnetId: ID_VENTILATION, noteId: 'ZZ-V-N1', texte: ' ', le: LE }).ok).toBe(false);
    allerRetour(F, modifierLigne(F, { carnetId: ID_EVIER, cible: 'critere', id: 'ZZ-E-K2', texte: 'fond de bac 38 cm', le: LE }));
    const s = supprimerNote(F, { carnetId: ID_VENTILATION, noteId: 'ZZ-V-N1' });
    const b = allerRetour(F, s);
    expect(ok(s).avis).toBe('Note supprimée');
    expect(carnet(b, ID_VENTILATION).carnet.notes).toEqual([]);
    expect(b.find(i => i.id === 'ZZ-MSG-V2')).toBeDefined();
    allerRetour(F, supprimerLigne(F, { carnetId: ID_VENTILATION, cible: 'facon', id: 'ZZ-V-F2' }));
  });

  it('renommer garde l’avant (G30) et marque la proposition appliquée (G29, R46)', () => {
    const r = renommer(F, { carnetId: ID_EVIER, titre: 'ZZ TEST — Évier 2 bacs pour les fûts' });
    const a = allerRetour(F, r);
    expect(ok(r).avant).toBe('ZZ TEST — Évier inox');
    expect(ok(r).avis).toBe('✓ Renommé · avant : ZZ TEST — Évier inox');
    expect(carnet(a, ID_EVIER).title).toBe('ZZ TEST — Évier 2 bacs pour les fûts');
    const avecProp = F.map(i => (i.id === 'ZZ-MSG-E1' ? { ...i, carnetMessage: { ...i.carnetMessage!, titrePropose: { carnetId: ID_EVIER, titre: 'Évier 2 bacs' } } } : i));
    const b = allerRetour(avecProp, renommer(avecProp, { carnetId: ID_EVIER, titre: 'Évier 2 bacs', messageId: 'ZZ-MSG-E1' }));
    expect(lireMessage(b.find(i => i.id === 'ZZ-MSG-E1'))!.carnetMessage.titrePropose).toEqual({ carnetId: ID_EVIER, titre: 'Évier 2 bacs', applique: true });
    expect(renommer(F, { carnetId: ID_EVIER, titre: '' }).ok).toBe(false);
  });

  it('veille (R31) : allumée = { active, depuis } sans releveLe ; éteinte = retirée', () => {
    const a = allerRetour(F, basculerVeille(F, { carnetId: ID_VENTILATION, articleId: 'ZZ-V-A1', le: LE }));
    expect(carnet(a, ID_VENTILATION).carnet.articles[0].veille).toEqual({ active: true, depuis: LE });
    const b = allerRetour(F, basculerVeille(F, { carnetId: ID_VENTILATION, articleId: 'ZZ-V-A2', le: LE }));
    expect(carnet(b, ID_VENTILATION).carnet.articles[1].veille).toBeUndefined();
  });

  it('veille : aucune écriture de releveLe dans src/domain/carnets (type et lecture seulement)', () => {
    const dossier = join(process.cwd(), 'src/domain/carnets');
    const lignes = readdirSync(dossier).filter(f => f.endsWith('.ts')).flatMap(f => readFileSync(join(dossier, f), 'utf8').split('\n').filter(l => l.includes('releveLe')).map(l => `${f}: ${l.trim()}`));
    for (const l of lignes) expect(l).not.toMatch(/releveLe\s*[:=](?!\s*optTexte)|\.releveLe\s*=/);
  });

  it('choisir puis revoir le choix : l’ancien reste lisible (ADR, D-20) ; statut Choisi', () => {
    const r = choisir(F, { carnetId: ID_VENTILATION, articleId: 'ZZ-V-A1', pourquoi: 'débit le plus fort', ecartes: [{ articleId: 'ZZ-V-A3', raison: 'ne tient pas 80 °C' }], le: LE });
    const a = allerRetour(F, r);
    const c = carnet(a, ID_VENTILATION);
    expect(c.status).toBe('validated');
    expect(c.carnet.choix).toMatchObject({ articleId: 'ZZ-V-A1', faconId: 'ZZ-V-F1', pourquoi: 'débit le plus fort', remplaces: [] });
    expect(c.carnet.facons[0].etat).toBe('retenue');
    expect(revoirChoix(F, { carnetId: ID_VENTILATION, articleId: 'ZZ-V-A1', pourquoi: 'x', le: LE }).ok).toBe(false);
    const r2 = revoirChoix(F, { carnetId: ID_EMBOUTEILLAGE, articleId: 'ZZ-B-A3', pourquoi: 'moins cher, assez bon', le: LE });
    const b = allerRetour(F, r2);
    const ch = carnet(b, ID_EMBOUTEILLAGE).carnet.choix!;
    expect(ch.articleId).toBe('ZZ-B-A3');
    expect(ch.remplaces).toHaveLength(1);
    expect(ch.remplaces[0]).toMatchObject({ articleId: 'ZZ-B-A5', pourquoi: 'oxygène le plus bas, SAV suisse' });
  });

  it('planDepuisChoix : un plan idempotent, sans caisse dans le carnet ; poserSortie idempotent', () => {
    const c = carnet(F, ID_EMBOUTEILLAGE);
    const p = planDepuisChoix(c, { le: LE })!;
    expect(p).toMatchObject({ id: `PLAN-CARNET-${ID_EMBOUTEILLAGE}`, amountCents: 1170000, vendor: 'Brassage Romandie', upgrade: { sourceCarnetId: ID_EMBOUTEILLAGE, sourceCarnetTitre: 'ZZ TEST — Embouteillage', budgetKnown: true } });
    expect(planDepuisChoix(c, { le: '2027-01-01' })!.id).toBe(p.id);
    expect(planDepuisChoix(carnet(F, ID_VENTILATION), { le: LE })).toBeNull();
    const a = allerRetour(F, poserSortie(F, { carnetId: ID_EMBOUTEILLAGE, planId: p.id, le: LE }));
    expect(carnet(a, ID_EMBOUTEILLAGE).carnet.sortie).toEqual({ planId: p.id, le: LE });
    const deux = poserSortie(a, { carnetId: ID_EMBOUTEILLAGE, planId: p.id, le: '2027-01-01' });
    expect(ok(deux).ecritures).toEqual([]);
  });
});

describe('opérations des aides (A11, R40)', () => {
  const F = fixtureCarnets();
  const avecDoublon = ok(ranger(F, { message: { id: 'M-D', texte: 'demander l’avis au ferblantier', le: LE, depuis: ID_VENTILATION, rangement: 'simulee' },
    lignes: [{ sorte: 'note', carnetId: ID_VENTILATION, id: 'N-D', texte: 'demander l’avis au ferblantier', genre: 'a-faire' }] }));
  const E = magasinMemoire(F); E.appliquer(avecDoublon.ecritures);
  const etat = E.lire();

  it('fusionnerNotes garde les deux textes (fusionDe), rien n’est perdu ; l’effet suit la note gardée', () => {
    const a = allerRetour(etat, fusionnerNotes(etat, { carnetId: ID_VENTILATION, garderId: 'ZZ-V-N1', fusionnerId: 'N-D', le: LE }));
    const notes = carnet(a, ID_VENTILATION).carnet.notes;
    expect(notes).toHaveLength(1);
    expect(notes[0].fusionDe).toEqual(['attendre l’avis du ferblantier', 'demander l’avis au ferblantier']);
    expect(lireMessage(a.find(i => i.id === 'M-D'))!.carnetMessage.effets[0].id).toBe('ZZ-V-N1');
  });

  it('garderAPart n’écrit que le message', () => {
    const r = ok(garderAPart(etat, { messageId: 'M-D' }));
    expect(r.ecritures.map(w => (w.op === 'put' ? w.doc.id : w.id))).toEqual(['M-D']);
    allerRetour(etat, r);
  });

  it('noteEnCritere retire la note et crée un critère au même texte et au même messageId', () => {
    const a = allerRetour(etat, noteEnCritere(etat, { carnetId: ID_VENTILATION, noteId: 'N-D' }));
    const c = carnet(a, ID_VENTILATION).carnet;
    expect(c.notes.find(n => n.id === 'N-D')).toBeUndefined();
    expect(c.criteres.at(-1)).toMatchObject({ texte: 'demander l’avis au ferblantier', messageId: 'M-D' });
  });

  it('regrouperNotes pose un même groupe', () => {
    const a = allerRetour(etat, regrouperNotes(etat, { carnetId: ID_VENTILATION, noteIds: ['ZZ-V-N1', 'N-D'], libelle: 'Ferblantier', groupeId: 'G1' }));
    expect(carnet(a, ID_VENTILATION).carnet.notes.map(n => n.groupe)).toEqual([{ id: 'G1', libelle: 'Ferblantier' }, { id: 'G1', libelle: 'Ferblantier' }]);
    expect(regrouperNotes(etat, { carnetId: ID_VENTILATION, noteIds: ['N-D'], libelle: 'x' }).ok).toBe(false);
  });

  it('deplacerArticles garde veille.depuis (G35)', () => {
    const a = allerRetour(F, deplacerArticles(F, { depuis: ID_EMBOUTEILLAGE, vers: ID_VENTILATION, articleIds: ['ZZ-B-A4', 'ZZ-B-A5'] }));
    const arr = carnet(a, ID_VENTILATION).carnet.articles.filter(x => x.id.startsWith('ZZ-B'));
    expect(arr.map(x => x.veille)).toEqual([{ active: true, depuis: '2026-11-05T09:00:00.000Z' }, { active: true, depuis: '2026-11-08T09:00:00.000Z' }]);
    expect(arr.every(x => x.faconId === undefined)).toBe(true);
  });
});
