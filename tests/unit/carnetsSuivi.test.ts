/**
 * D451, voie domaine : le modèle du suivi, ses lecteurs tolérants et ses intentions (DOSSIER règles 1 à 6 et 13, plus tâches, catégorie, genre et
 * cartes « OK · Non »). Fixture : exemples « ZZ TEST — » (`fixtureSuivi`), aucune donnée réelle, aucun appel Gemini.
 */
import { describe, expect, it } from 'vitest';
import type { CreativeItem } from '../../src/types';
import { arbreDe, poserCategorie, rapprocherChemin } from '../../src/domain/carnets/arbre';
import { accepterPropositionSuivi, refuserPropositionSuivi } from '../../src/domain/carnets/fil';
import { fixtureSuivi, IDS_SUIVI, MAINTENANT_SUIVI, OPTIONS_MALT, OPTIONS_VAPEUR } from '../../src/domain/carnets/fixture';
import { ETATS_OPTION, ETATS_SUIVI, EVENEMENTS_MAX, lireCarnet, lireCarnets, lireMessage, type CarnetDoc, type EtatOption, type EtatSuivi } from '../../src/domain/carnets/modele';
import { appliquerEcritures, ranger, type Resultat } from '../../src/domain/carnets/operations';
import {
  assurerSuivi, changerEtat, changerOption, etatContenu, etatDe, etatOption, etiqueter, fermerParAchat, foisEcartee, genreDe, optionRetenue, poserAvantApres, poserGenre, poserVeille,
  repondreRelu, resoudre, retenirOption, retirerEtiquette, rouvrir, suiviDe
} from '../../src/domain/carnets/suivi';
import { ajouterTache, cocherTache, poserEcheance } from '../../src/domain/carnets/taches';

const LE = '2026-11-25T10:00:00.000Z';
const json = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const doc = (etat: readonly CreativeItem[], id: string): CreativeItem => etat.find(d => d.id === id)!;
const carnetDe = (etat: readonly CreativeItem[], id: string): CarnetDoc => lireCarnet(doc(etat, id))!;

/** Applique une intention qui doit réussir ; rend le nouvel état. */
function ok(etat: readonly CreativeItem[], r: Resultat): CreativeItem[] {
  expect(r.ok).toBe(true);
  if (!r.ok) throw new Error(r.raison);
  return appliquerEcritures(etat, r.ecritures);
}
/** L'inverse rend exactement l'état d'avant (document pour document). */
function inverseRend(etat: readonly CreativeItem[], r: Resultat) {
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  const apres = appliquerEcritures(etat, r.ecritures);
  expect(json(appliquerEcritures(apres, r.inverse))).toEqual(json(appliquerEcritures(etat, [])));
}
/** Un carnet de la fixture dont on force le suivi écrit. */
function avecSuivi(id: string, suivi: Record<string, unknown> | null, plus: Record<string, unknown> = {}): CreativeItem[] {
  return fixtureSuivi().map(d => {
    if (d.id !== id) return d;
    const c = json(d) as unknown as { carnet: Record<string, unknown> };
    if (suivi === null) delete c.carnet.suivi; else c.carnet.suivi = suivi;
    Object.assign(c.carnet, plus);
    return c as unknown as CreativeItem;
  });
}

describe('fixture du suivi', () => {
  it('chaque carnet porte « ZZ TEST — » et se relit ; les pièces portent « exemple »', () => {
    const etat = fixtureSuivi();
    const carnets = etat.filter(d => d.type === 'carnet');
    expect(carnets.length).toBe(14);
    for (const d of carnets) { expect(d.title.startsWith('ZZ TEST — ')).toBe(true); expect(lireCarnet(d)).not.toBeNull(); }
    for (const d of etat.filter(x => x.type === 'carnet-message')) expect(lireMessage(d)).not.toBeNull();
    const vapeur = carnetDe(etat, IDS_SUIVI.vapeur);
    expect(vapeur.carnet.facons.every(f => f.origine === 'exemple')).toBe(true);
    expect(vapeur.carnet.suivi!.evenements.every(e => e.origine === 'exemple')).toBe(true);
    expect(lireCarnets(etat).length).toBe(14);
  });
});

describe('règle 1 : passe-plat dans le suivi neuf', () => {
  it('une clé inconnue du suivi, d’une option, d’un événement, d’une tâche ou d’une étiquette survit à une intention', () => {
    const etat = fixtureSuivi().map(d => {
      const x = json(d) as unknown as { carnet?: { suivi: Record<string, unknown>; facons: Record<string, unknown>[]; taches: Record<string, unknown>[]; [k: string]: unknown }; carnetMessage?: { etiquettes?: Record<string, unknown>[]; [k: string]: unknown } };
      if (d.id === IDS_SUIVI.vapeur && x.carnet) {
        x.carnet.cleVapeur = { futur: 1 };
        x.carnet.suivi.cleSuivi = [1, 2];
        (x.carnet.suivi.evenements as Record<string, unknown>[])[0].cleEvenement = 'a';
        x.carnet.facons[0].suivi = { ...(x.carnet.facons[0].suivi as object), cleOption: true };
        x.carnet.taches[0].cleTache = 7;
      }
      if (d.id === 'ZZ-SV-M8' && x.carnetMessage?.etiquettes) { x.carnetMessage.etiquettes[0].cleEtiquette = 'e'; x.carnetMessage.cleMessage = 1; }
      return x as unknown as CreativeItem;
    });
    const apres = ok(etat, changerEtat(etat, { carnetId: IDS_SUIVI.vapeur, vers: 'cherche', le: LE }));
    const v = json(doc(apres, IDS_SUIVI.vapeur)) as unknown as { carnet: { cleVapeur: unknown; suivi: { cleSuivi: unknown; evenements: Record<string, unknown>[] }; facons: { suivi: { cleOption: unknown } }[]; taches: { cleTache: unknown }[] } };
    expect(v.carnet.cleVapeur).toEqual({ futur: 1 });
    expect(v.carnet.suivi.cleSuivi).toEqual([1, 2]);
    expect(v.carnet.suivi.evenements[0].cleEvenement).toBe('a');
    expect(v.carnet.facons[0].suivi.cleOption).toBe(true);
    expect(v.carnet.taches[0].cleTache).toBe(7);
    const apresMsg = ok(etat, etiqueter(etat, { messageId: 'ZZ-SV-M8', etiquette: { carnetId: IDS_SUIVI.vapeur, sorte: 'cout', montantCentimes: 54000, devise: 'CHF', origine: 'locale' } }));
    const m = json(doc(apresMsg, 'ZZ-SV-M8')) as unknown as { carnetMessage: Record<string, unknown> & { etiquettes: Record<string, unknown>[] } };
    expect(m.carnetMessage.cleMessage).toBe(1);
    expect(m.carnetMessage.etiquettes).toHaveLength(2);
    expect(m.carnetMessage.etiquettes[0].cleEtiquette).toBe('e');
  });
});

describe('règle 2 : dérivation sans suivi, aucune écriture', () => {
  it('archive → résolu ; choix ou option retenue → décidé ; façon ou article → je cherche ; sinon noté', () => {
    const etat = fixtureSuivi();
    expect(etatDe(carnetDe(etat, IDS_SUIVI.moisissure))).toBe('note');
    expect(etatDe(carnetDe(etat, IDS_SUIVI.photo))).toBe('note');
    expect(etatDe(carnetDe(etat, IDS_SUIVI.chambreFroide))).toBe('cherche');
    const archive = avecSuivi(IDS_SUIVI.chambreFroide, null, { archive: { le: '2026-11-10T12:00:00.000Z', raison: 'plan réalisé' } });
    expect(etatDe(carnetDe(archive, IDS_SUIVI.chambreFroide))).toBe('resolu');
    expect(suiviDe(carnetDe(archive, IDS_SUIVI.chambreFroide)).resolu).toEqual({ le: '2026-11-10T12:00:00.000Z' });
    const choix = avecSuivi(IDS_SUIVI.chambreFroide, null, { choix: { articleId: 'ZZ-SCF-A1', pourquoi: 'le plus petit', ecartes: [], le: '2026-11-12T12:00:00.000Z', remplaces: [] } });
    expect(etatDe(carnetDe(choix, IDS_SUIVI.chambreFroide))).toBe('decide');
    const retenue = avecSuivi(IDS_SUIVI.chambreFroide, null, { facons: [{ id: 'F', nom: 'Option', etat: 'retenue', origine: 'exemple' }], articles: [] });
    expect(etatDe(carnetDe(retenue, IDS_SUIVI.chambreFroide))).toBe('decide');
    const vide = avecSuivi(IDS_SUIVI.chambreFroide, null, { facons: [], articles: [] });
    expect(etatContenu(carnetDe(vide, IDS_SUIVI.chambreFroide))).toBe('note');
  });

  it('genre : article ou choix → achat, sinon idée ; le genre posé prime', () => {
    const etat = fixtureSuivi();
    expect(genreDe(carnetDe(etat, IDS_SUIVI.chambreFroide))).toBe('achat');
    expect(genreDe(carnetDe(etat, IDS_SUIVI.photo))).toBe('idee');
    expect(genreDe(carnetDe(etat, IDS_SUIVI.planning))).toBe('idee');
    expect(genreDe(carnetDe(etat, IDS_SUIVI.moisissure))).toBe('probleme');
    expect(genreDe(carnetDe(etat, IDS_SUIVI.assurance))).toBe('memo');
  });

  it('lire ne produit aucune écriture : le document, avant et après la lecture, est le même', () => {
    const etat = fixtureSuivi();
    const avant = json(etat);
    for (const d of etat) { if (d.type === 'carnet') { const c = lireCarnet(d)!; etatDe(c); genreDe(c); suiviDe(c); optionRetenue(c); } }
    expect(json(etat)).toEqual(avant);
    expect(doc(etat, IDS_SUIVI.chambreFroide).carnet).not.toHaveProperty('suivi');
    expect(lireCarnet(doc(etat, IDS_SUIVI.chambreFroide))!.carnet.suivi).toBeUndefined();
  });

  it('un geste sans effet (même état dérivé) n’écrit rien et ne crée pas de suivi', () => {
    const etat = fixtureSuivi();
    const r = changerEtat(etat, { carnetId: IDS_SUIVI.moisissure, vers: 'note', le: LE });
    expect(r.ok && r.ecritures).toEqual([]);
    const r2 = changerEtat(etat, { carnetId: IDS_SUIVI.chambreFroide, vers: 'cherche', le: LE });
    expect(r2.ok && r2.ecritures).toEqual([]);
  });
});

describe('règle 3 : changerEtat, les 16 couples', () => {
  const couples = ETATS_SUIVI.flatMap(de => ETATS_SUIVI.map(vers => [de, vers] as const));
  it.each(couples)('%s → %s', (de, vers) => {
    const etat = avecSuivi(IDS_SUIVI.fenetre, { etat: de, evenements: [], ...(de === 'resolu' ? { resolu: { le: '2026-11-20T12:00:00.000Z' } } : {}) });
    const r = changerEtat(etat, { carnetId: IDS_SUIVI.fenetre, vers, le: LE });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    if (de === vers) { expect(r.ecritures).toEqual([]); return; }
    const c = carnetDe(appliquerEcritures(etat, r.ecritures), IDS_SUIVI.fenetre);
    expect(c.carnet.suivi!.etat).toBe(vers);
    expect(c.carnet.suivi!.evenements).toHaveLength(1);
    expect(c.carnet.suivi!.evenements[0]).toMatchObject({ sorte: de === 'resolu' ? 'rouvert' : vers === 'resolu' ? 'resolu' : 'etat', de, vers, le: LE, origine: 'vous' });
    if (vers === 'resolu') expect(c.carnet.suivi!.resolu).toEqual({ le: LE });
    if (de === 'resolu') expect(c.carnet.suivi!.resolu).toBeUndefined();
    inverseRend(etat, r);
  });

  it('depuis un état dérivé : le premier geste écrit le suivi avec l’état d’avant', () => {
    const etat = fixtureSuivi();
    const apres = ok(etat, changerEtat(etat, { carnetId: IDS_SUIVI.chambreFroide, vers: 'decide', le: LE }));
    const c = carnetDe(apres, IDS_SUIVI.chambreFroide);
    expect(c.carnet.suivi).toMatchObject({ etat: 'decide' });
    expect(c.carnet.suivi!.evenements[0]).toMatchObject({ de: 'cherche', vers: 'decide' });
  });

  it('un état inconnu est refusé', () => {
    const r = changerEtat(fixtureSuivi(), { carnetId: IDS_SUIVI.fenetre, vers: 'fini' as EtatSuivi, le: LE });
    expect(r.ok).toBe(false);
  });

  it('Rouvrir un résolu : l’archive est levée, l’état revient à ce que dit le contenu ; refusé si le carnet n’est pas résolu', () => {
    const etat = avecSuivi(IDS_SUIVI.chambreFroide, null, { archive: { le: '2026-11-10T12:00:00.000Z', raison: 'plan réalisé' } });
    const r = rouvrir(etat, { carnetId: IDS_SUIVI.chambreFroide, le: LE });
    const c = carnetDe(ok(etat, r), IDS_SUIVI.chambreFroide);
    expect(c.carnet.archive).toBeUndefined();
    expect(etatDe(c)).toBe('cherche');
    expect(c.carnet.suivi!.evenements.at(-1)).toMatchObject({ sorte: 'rouvert', de: 'resolu', vers: 'cherche' });
    inverseRend(etat, r);
    expect(rouvrir(fixtureSuivi(), { carnetId: IDS_SUIVI.vapeur, le: LE }).ok).toBe(false);
    const vers = ok(etat, rouvrir(etat, { carnetId: IDS_SUIVI.chambreFroide, le: LE, vers: 'note' }));
    expect(etatDe(carnetDe(vers, IDS_SUIVI.chambreFroide))).toBe('note');
  });

  it('un résolu rouvert par la barre d’état (resolu → cherche) lève aussi l’archive', () => {
    const etat = avecSuivi(IDS_SUIVI.chambreFroide, null, { archive: { le: '2026-11-10T12:00:00.000Z', raison: 'plan réalisé' } });
    const c = carnetDe(ok(etat, changerEtat(etat, { carnetId: IDS_SUIVI.chambreFroide, vers: 'cherche', le: LE })), IDS_SUIVI.chambreFroide);
    expect(c.carnet.archive).toBeUndefined();
    expect(etatDe(c)).toBe('cherche');
  });
});

describe('règle 4 : options libres, une seule retenue, « écartée, 2e fois »', () => {
  const couples = ETATS_OPTION.flatMap(de => ETATS_OPTION.map(vers => [de, vers] as const));
  const F1 = 'ZZ-SX-F1';
  it.each(couples)('option %s → %s (libre dans tous les sens, facon.etat écrit comme avant)', (de, vers) => {
    const etat = fixtureSuivi().map(d => {
      if (d.id !== IDS_SUIVI.fete) return d;
      const c = json(d) as unknown as { carnet: { facons: { id: string; etat: string; suivi: { etat: string } }[] } };
      const f = c.carnet.facons.find(x => x.id === F1)!;
      f.etat = de === 'retenue' ? 'retenue' : de === 'ecartee' ? 'ecartee' : 'ouverte';
      f.suivi.etat = de;
      return c as unknown as CreativeItem;
    });
    const r = changerOption(etat, { carnetId: IDS_SUIVI.fete, faconId: F1, vers, le: LE, raison: vers === 'ecartee' ? 'trop cher' : undefined });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    if (de === vers) { expect(r.ecritures).toEqual([]); return; }
    const c = carnetDe(appliquerEcritures(etat, r.ecritures), IDS_SUIVI.fete);
    const f = c.carnet.facons.find(x => x.id === F1)!;
    expect(etatOption(f)).toBe(vers);
    expect(f.etat).toBe(vers === 'retenue' ? 'retenue' : vers === 'ecartee' ? 'ecartee' : 'ouverte');
    expect(f.suivi!.historique.at(-1)).toMatchObject({ etat: vers, le: LE, origine: 'vous', ...(vers === 'ecartee' ? { raison: 'trop cher' } : {}) });
    expect(c.carnet.suivi!.evenements.at(-1)).toMatchObject({ optionId: F1, de, vers, sorte: vers === 'veille' || de === 'veille' ? 'veille' : 'option' });
    inverseRend(etat, r);
  });

  it('une seule retenue à la fois : retenir A remet B en piste et le dit dans l’événement', () => {
    const etat = fixtureSuivi();
    const r = retenirOption(etat, { carnetId: IDS_SUIVI.vapeur, faconId: OPTIONS_VAPEUR.condA, le: LE });
    const apres = ok(etat, r);
    const c = carnetDe(apres, IDS_SUIVI.vapeur);
    expect(c.carnet.facons.filter(f => etatOption(f) === 'retenue').map(f => f.id)).toEqual([OPTIONS_VAPEUR.condA]);
    const b = c.carnet.facons.find(f => f.id === OPTIONS_VAPEUR.condB)!;
    expect(etatOption(b)).toBe('piste');
    expect(b.suivi!.historique.at(-1)).toMatchObject({ etat: 'piste', raison: 'remplacée par Condenseur A' });
    expect(c.carnet.suivi!.evenements.some(e => e.optionId === OPTIONS_VAPEUR.condB && e.vers === 'piste' && e.raison === 'remplacée par Condenseur A')).toBe(true);
    expect(etatDe(c)).toBe('decide');
    inverseRend(etat, r);
  });

  it('retenir une option fait passer un carnet qui cherche à Décidé (et un événement le dit)', () => {
    const etat = fixtureSuivi();
    const r = retenirOption(etat, { carnetId: IDS_SUIVI.fete, faconId: 'ZZ-SX-F2', le: LE });
    const c = carnetDe(ok(etat, r), IDS_SUIVI.fete);
    expect(etatDe(c)).toBe('decide');
    expect(c.carnet.suivi!.evenements.at(-1)).toMatchObject({ sorte: 'etat', de: 'cherche', vers: 'decide', optionId: 'ZZ-SX-F2' });
    expect(retenirOption(ok(etat, r), { carnetId: IDS_SUIVI.fete, faconId: 'ZZ-SX-F2', le: LE }).ok).toBe(true);
    const encore = retenirOption(ok(etat, r), { carnetId: IDS_SUIVI.fete, faconId: 'ZZ-SX-F2', le: LE });
    expect(encore.ok && encore.ecritures).toEqual([]);
  });

  it('« écartée, 2e fois » se compte dans l’historique : l’humidificateur de la maquette, puis une 3e fois', () => {
    const etat = fixtureSuivi();
    const humid = (e: readonly CreativeItem[]) => carnetDe(e, IDS_SUIVI.vapeur).carnet.facons.find(f => f.id === OPTIONS_VAPEUR.humid)!;
    expect(foisEcartee(humid(etat))).toBe(2);
    let e = ok(etat, changerOption(etat, { carnetId: IDS_SUIVI.vapeur, faconId: OPTIONS_VAPEUR.humid, vers: 'piste', le: LE }));
    expect(foisEcartee(humid(e))).toBe(2);
    e = ok(e, changerOption(e, { carnetId: IDS_SUIVI.vapeur, faconId: OPTIONS_VAPEUR.humid, vers: 'ecartee', le: LE, raison: 'encore non' }));
    expect(foisEcartee(humid(e))).toBe(3);
    expect(humid(e).raison).toBe('encore non');
  });

  it('une option née avant le suivi garde son état d’avant sans date inventée et se compte', () => {
    const etat = avecSuivi(IDS_SUIVI.chambreFroide, null, { facons: [{ id: 'ZZ-F', nom: 'Modèle 6 m³', etat: 'ecartee', raison: 'trop cher', origine: 'exemple' }] });
    const f0 = carnetDe(etat, IDS_SUIVI.chambreFroide).carnet.facons[0];
    expect(etatOption(f0)).toBe('ecartee');
    expect(foisEcartee(f0)).toBe(1);
    let e = ok(etat, changerOption(etat, { carnetId: IDS_SUIVI.chambreFroide, faconId: 'ZZ-F', vers: 'retenue', le: LE }));
    const f1 = carnetDe(e, IDS_SUIVI.chambreFroide).carnet.facons[0];
    expect(f1.suivi!.historique[0]).toEqual({ etat: 'ecartee', raison: 'trop cher', origine: 'exemple' });
    expect(f1.suivi!.historique[0].le).toBeUndefined();
    e = ok(e, changerOption(e, { carnetId: IDS_SUIVI.chambreFroide, faconId: 'ZZ-F', vers: 'ecartee', le: LE, raison: 'finalement non' }));
    expect(foisEcartee(carnetDe(e, IDS_SUIVI.chambreFroide).carnet.facons[0])).toBe(2);
  });

  it('un ancien client qui change facon.etat (retenue) l’emporte sur un suivi d’option resté en piste', () => {
    const etat = fixtureSuivi().map(d => {
      if (d.id !== IDS_SUIVI.fete) return d;
      const c = json(d) as unknown as { carnet: { facons: { etat: string }[] } };
      c.carnet.facons[0].etat = 'retenue';
      return c as unknown as CreativeItem;
    });
    expect(etatOption(carnetDe(etat, IDS_SUIVI.fete).carnet.facons[0])).toBe('retenue');
  });

  it('une option ou un état d’option inconnus sont refusés', () => {
    const etat = fixtureSuivi();
    expect(changerOption(etat, { carnetId: IDS_SUIVI.fete, faconId: 'nulle part', vers: 'piste', le: LE }).ok).toBe(false);
    expect(changerOption(etat, { carnetId: IDS_SUIVI.fete, faconId: 'ZZ-SX-F1', vers: 'fini' as EtatOption, le: LE }).ok).toBe(false);
  });

  it('choisir (comparatif) fait passer un carnet déjà suivi de « je cherche » à Décidé', async () => {
    const { choisir } = await import('../../src/domain/carnets/operations');
    const etat = fixtureSuivi();
    const r = choisir(etat, { carnetId: IDS_SUIVI.chambreFroide, articleId: 'ZZ-SCF-A1', pourquoi: 'exemple', le: LE });
    const apres = ok(etat, r);
    expect(carnetDe(apres, IDS_SUIVI.chambreFroide).carnet.suivi).toBeUndefined();
    const suivi = fixtureSuivi().map(d => {
      if (d.id !== IDS_SUIVI.chambreFroide) return d;
      const c = json(d) as unknown as { carnet: { suivi: unknown } };
      c.carnet.suivi = { etat: 'cherche', evenements: [] };
      return c as unknown as CreativeItem;
    });
    const apres2 = ok(suivi, choisir(suivi, { carnetId: IDS_SUIVI.chambreFroide, articleId: 'ZZ-SCF-A1', pourquoi: 'exemple', le: LE }));
    const c = carnetDe(apres2, IDS_SUIVI.chambreFroide);
    expect(c.carnet.suivi).toMatchObject({ etat: 'decide' });
    expect(c.carnet.suivi!.evenements.at(-1)).toMatchObject({ de: 'cherche', vers: 'decide' });
  });
});

describe('règle 5 : fermerParAchat', () => {
  it('résolu, fermé par l’achat ; les autres options écartées avec leur raison gardée, sinon « pas pris » ; l’inverse rend tout', () => {
    const etat = fixtureSuivi();
    const le = '2026-11-30T12:00:00.000Z';
    const r = fermerParAchat(etat, { carnetId: IDS_SUIVI.vapeur, le });
    const c = carnetDe(ok(etat, r), IDS_SUIVI.vapeur);
    expect(etatDe(c)).toBe('resolu');
    expect(c.carnet.suivi!.resolu).toEqual({ le, par: { sorte: 'achat', optionId: OPTIONS_VAPEUR.condB } });
    const f = (id: string) => c.carnet.facons.find(x => x.id === id)!;
    expect(etatOption(f(OPTIONS_VAPEUR.condB))).toBe('retenue');
    expect(etatOption(f(OPTIONS_VAPEUR.condA))).toBe('ecartee');
    expect(f(OPTIONS_VAPEUR.condA).raison).toBe('pas pris');
    expect(f(OPTIONS_VAPEUR.hotte).raison).toBe('pas pris');
    expect(f(OPTIONS_VAPEUR.humid).raison).toBe('non, en fait');
    expect(foisEcartee(f(OPTIONS_VAPEUR.humid))).toBe(2);
    expect(c.carnet.suivi!.evenements.at(-1)).toMatchObject({ sorte: 'resolu', de: 'decide', vers: 'resolu', optionId: OPTIONS_VAPEUR.condB });
    inverseRend(etat, r);
  });

  it('avec une option donnée : elle est retenue d’abord ; l’article et le plan sont gardés', () => {
    const etat = fixtureSuivi();
    const r = fermerParAchat(etat, { carnetId: IDS_SUIVI.vapeur, optionId: OPTIONS_VAPEUR.condA, articleId: 'ZZ-SV-A1', planId: 'ZZ-PLAN-X', le: LE });
    const c = carnetDe(ok(etat, r), IDS_SUIVI.vapeur);
    expect(c.carnet.suivi!.resolu!.par).toEqual({ sorte: 'achat', optionId: OPTIONS_VAPEUR.condA, articleId: 'ZZ-SV-A1', planId: 'ZZ-PLAN-X' });
    expect(c.carnet.facons.filter(f => etatOption(f) === 'retenue').map(f => f.id)).toEqual([OPTIONS_VAPEUR.condA]);
    expect(etatOption(c.carnet.facons.find(f => f.id === OPTIONS_VAPEUR.condB)!)).toBe('ecartee');
    inverseRend(etat, r);
  });

  it('refus : déjà résolu, option ou article inconnus ; sans option du tout, le carnet se ferme quand même', () => {
    const etat = fixtureSuivi();
    expect(fermerParAchat(etat, { carnetId: IDS_SUIVI.pompe, le: LE }).ok).toBe(false);
    expect(fermerParAchat(etat, { carnetId: IDS_SUIVI.vapeur, optionId: 'x', le: LE }).ok).toBe(false);
    expect(fermerParAchat(etat, { carnetId: IDS_SUIVI.vapeur, articleId: 'x', le: LE }).ok).toBe(false);
    const sans = fermerParAchat(etat, { carnetId: IDS_SUIVI.co2, le: LE });
    expect(etatDe(carnetDe(ok(etat, sans), IDS_SUIVI.co2))).toBe('resolu');
  });

  it('résolu sans achat : sa phrase à lui, jamais inventée', () => {
    const etat = fixtureSuivi();
    const r = resoudre(etat, { carnetId: IDS_SUIVI.ecoulement, le: LE, texte: 'plus de fuite' });
    const c = carnetDe(ok(etat, r), IDS_SUIVI.ecoulement);
    expect(c.carnet.suivi!.resolu).toEqual({ le: LE, par: { sorte: 'texte', texte: 'plus de fuite' } });
    const nu = carnetDe(ok(etat, resoudre(etat, { carnetId: IDS_SUIVI.ecoulement, le: LE })), IDS_SUIVI.ecoulement);
    expect(nu.carnet.suivi!.resolu).toEqual({ le: LE });
    inverseRend(etat, r);
  });
});

describe('règle 6 : la veille', () => {
  it('l’IA seule ne l’allume pas ; lui, oui', () => {
    const etat = fixtureSuivi();
    expect(poserVeille(etat, { carnetId: IDS_SUIVI.vapeur, faconId: OPTIONS_VAPEUR.hotte, active: true, le: LE, origine: 'ia' }).ok).toBe(false);
    expect(poserVeille(etat, { carnetId: IDS_SUIVI.vapeur, faconId: OPTIONS_VAPEUR.hotte, active: true, le: LE, origine: 'exemple' }).ok).toBe(false);
    expect(poserVeille(etat, { carnetId: IDS_SUIVI.vapeur, faconId: OPTIONS_VAPEUR.hotte, active: true, le: LE, origine: 'vous' }).ok).toBe(true);
  });

  it('option sans article : « veille demandée, sans lien à relever » ; aucun article touché, aucune relève écrite', () => {
    const etat = fixtureSuivi();
    const r = poserVeille(etat, { carnetId: IDS_SUIVI.vapeur, faconId: OPTIONS_VAPEUR.hotte, active: true, le: LE });
    expect(r.ok && r.avis).toContain('sans lien à relever');
    const c = carnetDe(ok(etat, r), IDS_SUIVI.vapeur);
    expect(etatOption(c.carnet.facons.find(f => f.id === OPTIONS_VAPEUR.hotte)!)).toBe('veille');
    expect(c.carnet.articles[0].veille).toBeUndefined();
    expect(c.carnet.suivi!.evenements.at(-1)).toMatchObject({ sorte: 'veille', optionId: OPTIONS_VAPEUR.hotte, vers: 'veille', raison: 'sans lien à relever' });
    inverseRend(etat, r);
  });

  it('option à article : la veille de l’article est posée (active, depuis) sans releveLe ; l’éteindre la retire', () => {
    const etat = fixtureSuivi();
    const r = poserVeille(etat, { carnetId: IDS_SUIVI.vapeur, faconId: OPTIONS_VAPEUR.condA, active: true, le: LE });
    const allumee = ok(etat, r);
    const a = carnetDe(allumee, IDS_SUIVI.vapeur).carnet.articles[0];
    expect(a.veille).toEqual({ active: true, depuis: LE });
    expect('releveLe' in (a.veille ?? {})).toBe(false);
    expect(r.ok && r.avis).toBe('✓ Veille demandée');
    inverseRend(etat, r);
    const eteinte = ok(allumee, poserVeille(allumee, { carnetId: IDS_SUIVI.vapeur, faconId: OPTIONS_VAPEUR.condA, active: false, le: LE }));
    const c = carnetDe(eteinte, IDS_SUIVI.vapeur);
    expect(c.carnet.articles[0].veille).toBeUndefined();
    expect(etatOption(c.carnet.facons.find(f => f.id === OPTIONS_VAPEUR.condA)!)).toBe('piste');
  });

  it('une veille déjà demandée n’écrit rien', () => {
    const etat = fixtureSuivi();
    const e = ok(etat, poserVeille(etat, { carnetId: IDS_SUIVI.malt, faconId: OPTIONS_MALT.attendre, active: false, le: LE }));
    expect(etatOption(carnetDe(e, IDS_SUIVI.malt).carnet.facons.find(f => f.id === OPTIONS_MALT.attendre)!)).toBe('piste');
    const encore = poserVeille(etat, { carnetId: IDS_SUIVI.malt, faconId: OPTIONS_MALT.attendre, active: true, le: LE });
    expect(encore.ok && encore.ecritures).toEqual([]);
  });
});

describe('règle 13 : plafonds', () => {
  it('200 événements : les plus anciens changements d’état consécutifs se fusionnent, rien ne se perd du compte', () => {
    let etat: CreativeItem[] = fixtureSuivi();
    const N = EVENEMENTS_MAX + 7;
    for (let i = 0; i < N; i += 1) etat = ok(etat, changerEtat(etat, { carnetId: IDS_SUIVI.fenetre, vers: i % 2 === 0 ? 'cherche' : 'note', le: `2026-11-25T${String(8 + Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00.000Z` }));
    const evs = carnetDe(etat, IDS_SUIVI.fenetre).carnet.suivi!.evenements;
    expect(evs.length).toBeLessThanOrEqual(EVENEMENTS_MAX);
    expect(evs.reduce((s, e) => s + (e.fusionnes ?? 1), 0)).toBe(N);
    expect(evs[0].fusionnes).toBeGreaterThan(1);
    expect(evs.at(-1)).toMatchObject({ sorte: 'etat', vers: 'cherche' });
    expect(evs.every(e => e.sorte === 'etat')).toBe(true);
  });

  it('12 photos au plus : la 13e est refusée, la 12e passe', () => {
    const photos = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `ZZ-PH-${i}`, jpeg: 'data:image/jpeg;base64,AAAA' }));
    const message = { id: 'ZZ-MSG-PH', texte: 'une photo', le: LE, depuis: IDS_SUIVI.fenetre, rangement: 'brut' as const };
    const douze = avecSuivi(IDS_SUIVI.fenetre, null, { photos: photos(12) });
    const r13 = ranger(douze, { message, lignes: [{ carnetId: IDS_SUIVI.fenetre, sorte: 'photo', jpeg: 'data:image/jpeg;base64,BBBB' }] });
    expect(r13).toEqual({ ok: false, raison: 'Ce carnet garde 12 photos au plus.' });
    const onze = avecSuivi(IDS_SUIVI.fenetre, null, { photos: photos(11) });
    const r12 = ranger(onze, { message, lignes: [{ carnetId: IDS_SUIVI.fenetre, sorte: 'photo', jpeg: 'data:image/jpeg;base64,BBBB' }] });
    expect(r12.ok).toBe(true);
    expect(carnetDe(ok(onze, r12), IDS_SUIVI.fenetre).carnet.photos).toHaveLength(12);
  });
});

describe('tâches : À faire, Plus tard, case cochée', () => {
  it('« À faire » date une tâche au lundi de sa semaine ; « Plus tard » la laisse sans date ; un coût absent reste absent', () => {
    const etat = fixtureSuivi();
    const datee = ok(etat, ajouterTache(etat, { carnetId: IDS_SUIVI.moisissure, texte: 'Traiter le coin moisi', le: LE, echeance: '2026-11-26' }));
    const t = carnetDe(datee, IDS_SUIVI.moisissure).carnet.taches![0];
    expect(t).toMatchObject({ texte: 'Traiter le coin moisi', echeance: '2026-11-23', precision: 'semaine', origine: 'vous', creeeLe: LE });
    expect('coutCentimes' in t).toBe(false);
    expect('devise' in t).toBe(false);
    const plusTard = ok(etat, ajouterTache(etat, { carnetId: IDS_SUIVI.moisissure, texte: 'Y repenser', le: LE, precision: 'mois' }));
    const u = carnetDe(plusTard, IDS_SUIVI.moisissure).carnet.taches![0];
    expect('echeance' in u).toBe(false);
    expect('precision' in u).toBe(false);
  });

  it('précision « mois » : le lundi de la dernière semaine du mois ; un coût (≈) garde sa devise', () => {
    const etat = fixtureSuivi();
    const r = ajouterTache(etat, { carnetId: IDS_SUIVI.moisissure, texte: 'Acheter un déshumidificateur', le: LE, echeance: '2026-11-10', precision: 'mois', coutCentimes: 8000, coutEstime: true });
    const t = carnetDe(ok(etat, r), IDS_SUIVI.moisissure).carnet.taches![0];
    expect(t).toMatchObject({ echeance: '2026-11-30', precision: 'mois', coutCentimes: 8000, devise: 'CHF', coutEstime: true });
    inverseRend(etat, r);
    const fev = ok(etat, ajouterTache(etat, { carnetId: IDS_SUIVI.moisissure, texte: 'Fin février', le: LE, echeance: '2027-02-03', precision: 'mois' }));
    expect(carnetDe(fev, IDS_SUIVI.moisissure).carnet.taches![0].echeance).toBe('2027-02-22');
  });

  it('refus : texte vide, date illisible, coût illisible, option inconnue ; un doublon ouvert n’écrit rien', () => {
    const etat = fixtureSuivi();
    expect(ajouterTache(etat, { carnetId: IDS_SUIVI.moisissure, texte: '  ', le: LE }).ok).toBe(false);
    expect(ajouterTache(etat, { carnetId: IDS_SUIVI.moisissure, texte: 'x', le: LE, echeance: '26.11.2026' }).ok).toBe(false);
    expect(ajouterTache(etat, { carnetId: IDS_SUIVI.moisissure, texte: 'x', le: LE, coutCentimes: -3 }).ok).toBe(false);
    expect(ajouterTache(etat, { carnetId: IDS_SUIVI.moisissure, texte: 'x', le: LE, optionId: 'nulle part' }).ok).toBe(false);
    const doublon = ajouterTache(etat, { carnetId: IDS_SUIVI.vapeur, texte: 'acheter LE condenseur B', le: LE });
    const meme = ajouterTache(etat, { carnetId: IDS_SUIVI.vapeur, texte: 'Acheter le condenseur B', le: LE });
    expect(meme.ok && meme.ecritures).toEqual([]);
    expect(doublon.ok).toBe(true);
  });

  it('cocher date la tâche et la décocher la rouvre ; une tâche du Planning ne se coche pas ici', () => {
    const etat = fixtureSuivi();
    const r = cocherTache(etat, { carnetId: IDS_SUIVI.vapeur, tacheId: 'ZZ-SV-T1', le: LE });
    const faite = ok(etat, r);
    const t = carnetDe(faite, IDS_SUIVI.vapeur).carnet.taches![0];
    expect(t.faiteLe).toBe(LE);
    expect(carnetDe(faite, IDS_SUIVI.vapeur).carnet.suivi!.evenements.at(-1)).toMatchObject({ sorte: 'tache', tacheId: 'ZZ-SV-T1', vers: 'faite' });
    inverseRend(etat, r);
    const rouverte = ok(faite, cocherTache(faite, { carnetId: IDS_SUIVI.vapeur, tacheId: 'ZZ-SV-T1', le: LE }));
    expect(carnetDe(rouverte, IDS_SUIVI.vapeur).carnet.taches![0].faiteLe).toBeUndefined();
    expect(cocherTache(etat, { carnetId: IDS_SUIVI.planning, tacheId: 'planning:ZZ-SPL-N1', le: LE }).ok).toBe(false);
    expect(cocherTache(etat, { carnetId: IDS_SUIVI.vapeur, tacheId: 'nulle part', le: LE }).ok).toBe(false);
  });

  it('poserEcheance date, ou remet « Un jour »', () => {
    const etat = fixtureSuivi();
    const datee = ok(etat, poserEcheance(etat, { carnetId: IDS_SUIVI.co2, tacheId: 'ZZ-SC-T1', echeance: '2026-12-02' }));
    expect(carnetDe(datee, IDS_SUIVI.co2).carnet.taches![0]).toMatchObject({ echeance: '2026-11-30', precision: 'semaine' });
    const unJour = ok(datee, poserEcheance(datee, { carnetId: IDS_SUIVI.co2, tacheId: 'ZZ-SC-T1', echeance: null }));
    expect(carnetDe(unJour, IDS_SUIVI.co2).carnet.taches![0].echeance).toBeUndefined();
    const deja = poserEcheance(unJour, { carnetId: IDS_SUIVI.co2, tacheId: 'ZZ-SC-T1', echeance: null });
    expect(deja.ok && deja.ecritures).toEqual([]);
  });
});

describe('relu, avant et après, genre, catégorie, étiquettes', () => {
  it('« Toujours le bon choix ? » : la réponse est datée et laisse un événement', () => {
    const etat = fixtureSuivi();
    const r = repondreRelu(etat, { carnetId: IDS_SUIVI.vapeur, reponse: 'pas-sur', le: LE });
    const c = carnetDe(ok(etat, r), IDS_SUIVI.vapeur);
    expect(c.carnet.suivi!.relu).toEqual({ le: LE, reponse: 'pas-sur' });
    expect(c.carnet.suivi!.evenements.at(-1)).toMatchObject({ sorte: 'relu', vers: 'pas-sur' });
    inverseRend(etat, r);
    expect(repondreRelu(etat, { carnetId: IDS_SUIVI.vapeur, reponse: 'peut-être' as never, le: LE }).ok).toBe(false);
  });

  it('avant et après : des photos du carnet ; null retire le choix', () => {
    const etat = fixtureSuivi();
    const r = poserAvantApres(etat, { carnetId: IDS_SUIVI.vapeur, avantPhotoId: 'ZZ-SV-M10-P', apresPhotoId: 'ZZ-SV-M1-P' });
    const e = ok(etat, r);
    expect(carnetDe(e, IDS_SUIVI.vapeur).carnet.suivi!.avantApres).toEqual({ avantPhotoId: 'ZZ-SV-M10-P', apresPhotoId: 'ZZ-SV-M1-P' });
    inverseRend(etat, r);
    const un = ok(e, poserAvantApres(e, { carnetId: IDS_SUIVI.vapeur, avantPhotoId: null }));
    expect(carnetDe(un, IDS_SUIVI.vapeur).carnet.suivi!.avantApres).toEqual({ apresPhotoId: 'ZZ-SV-M1-P' });
    const aucun = ok(un, poserAvantApres(un, { carnetId: IDS_SUIVI.vapeur, apresPhotoId: null }));
    expect(carnetDe(aucun, IDS_SUIVI.vapeur).carnet.suivi!.avantApres).toBeUndefined();
    expect(poserAvantApres(etat, { carnetId: IDS_SUIVI.vapeur, avantPhotoId: 'nulle part' }).ok).toBe(false);
  });

  it('genre : lui l’emporte sur l’IA ; même valeur sans effet ; genre inconnu refusé', () => {
    const etat = fixtureSuivi();
    const vous = ok(etat, poserGenre(etat, { carnetId: IDS_SUIVI.chambreFroide, genre: 'probleme', origine: 'vous' }));
    expect(carnetDe(vous, IDS_SUIVI.chambreFroide).carnet.genre).toEqual({ valeur: 'probleme', origine: 'vous' });
    expect(poserGenre(vous, { carnetId: IDS_SUIVI.chambreFroide, genre: 'achat', origine: 'ia' }).ok).toBe(false);
    const meme = poserGenre(vous, { carnetId: IDS_SUIVI.chambreFroide, genre: 'probleme', origine: 'vous' });
    expect(meme.ok && meme.ecritures).toEqual([]);
    expect(poserGenre(etat, { carnetId: IDS_SUIVI.chambreFroide, genre: 'fini' as never, origine: 'vous' }).ok).toBe(false);
    const ia = ok(etat, poserGenre(etat, { carnetId: IDS_SUIVI.chambreFroide, genre: 'achat', origine: 'ia' }));
    expect(carnetDe(ia, IDS_SUIVI.chambreFroide).carnet.genre).toEqual({ valeur: 'achat', origine: 'ia' });
  });

  it('catégorie : 1 à 2 niveaux de 30 caractères, rapprochée du vocabulaire, celle de lui prime sur l’IA', () => {
    const etat = fixtureSuivi();
    const r = poserCategorie(etat, { carnetId: IDS_SUIVI.chambreFroide, chemin: ['brassage', 'vapeurs'], origine: 'ia' });
    const c = carnetDe(ok(etat, r), IDS_SUIVI.chambreFroide);
    expect(c.carnet.categorie).toEqual({ chemin: ['Brassage', 'Vapeur'], origine: 'ia' });
    inverseRend(etat, r);
    expect(poserCategorie(etat, { carnetId: IDS_SUIVI.chambreFroide, chemin: [], origine: 'ia' }).ok).toBe(false);
    expect(poserCategorie(etat, { carnetId: IDS_SUIVI.chambreFroide, chemin: ['a', 'b', 'c'], origine: 'ia' }).ok).toBe(false);
    expect(poserCategorie(etat, { carnetId: IDS_SUIVI.chambreFroide, chemin: ['x'.repeat(31)], origine: 'ia' }).ok).toBe(false);
    const vous = ok(etat, poserCategorie(etat, { carnetId: IDS_SUIVI.chambreFroide, chemin: ['Froid'], origine: 'vous' }));
    expect(poserCategorie(vous, { carnetId: IDS_SUIVI.chambreFroide, chemin: ['Autre'], origine: 'ia' }).ok).toBe(false);
    const meme = poserCategorie(vous, { carnetId: IDS_SUIVI.chambreFroide, chemin: ['froid'], origine: 'vous' });
    expect(meme.ok && meme.ecritures).toEqual([]);
  });

  it('rapprocher un chemin : égalité pliée, deux fautes au plus et au plus le quart du mot, jamais un mot court', () => {
    const vocab = [['Électricité'], ['Électricité'], ['Eau'], ['Brassage', 'Vapeur'], ['Brassage', 'Transfert']];
    expect(rapprocherChemin(['electricite'], vocab)).toEqual(['Électricité']);
    expect(rapprocherChemin(['Electricté'], vocab)).toEqual(['Électricité']);
    expect(rapprocherChemin(['Eaux'], vocab)).toEqual(['Eau']);
    expect(rapprocherChemin(['Via'], [['Vis']])).toEqual(['Via']);
    expect(rapprocherChemin(['Brasage', 'Vapeurs'], vocab)).toEqual(['Brassage', 'Vapeur']);
    expect(rapprocherChemin(['Brassage', 'Fûts'], vocab)).toEqual(['Brassage', 'Fûts']);
    expect(rapprocherChemin(['Événements'], vocab)).toEqual(['Événements']);
    expect(rapprocherChemin([], vocab)).toEqual([]);
  });

  it('étiquettes : posées sur un message, jamais doublées, retirées d’un toucher ; une option inconnue est refusée', () => {
    const etat = fixtureSuivi();
    const e = { carnetId: IDS_SUIVI.fenetre, sorte: 'cout' as const, montantCentimes: 4500, devise: 'CHF', origine: 'locale' as const };
    const r = etiqueter(etat, { messageId: `${IDS_SUIVI.fenetre}-M1`, etiquette: e });
    const posee = ok(etat, r);
    const m = lireMessage(doc(posee, `${IDS_SUIVI.fenetre}-M1`))!;
    expect(m.carnetMessage.etiquettes).toEqual([{ carnetId: IDS_SUIVI.fenetre, sorte: 'constat', origine: 'exemple' }, e]);
    inverseRend(etat, r);
    const doublon = etiqueter(posee, { messageId: `${IDS_SUIVI.fenetre}-M1`, etiquette: e });
    expect(doublon.ok && doublon.ecritures).toEqual([]);
    const retiree = ok(posee, retirerEtiquette(posee, { messageId: `${IDS_SUIVI.fenetre}-M1`, index: 1 }));
    expect(lireMessage(doc(retiree, `${IDS_SUIVI.fenetre}-M1`))!.carnetMessage.etiquettes).toHaveLength(1);
    expect(etiqueter(etat, { messageId: `${IDS_SUIVI.fenetre}-M1`, etiquette: { ...e, optionId: 'nulle part' } }).ok).toBe(false);
    expect(etiqueter(etat, { messageId: 'nulle part', etiquette: e }).ok).toBe(false);
    expect(retirerEtiquette(etat, { messageId: `${IDS_SUIVI.fenetre}-M1`, index: 9 }).ok).toBe(false);
  });

  it('assurerSuivi : un carnet archivé garde son archive et sa date de résolution', () => {
    const etat = avecSuivi(IDS_SUIVI.chambreFroide, { etat: 'cherche', evenements: [] }, { archive: { le: '2026-11-10T12:00:00.000Z', raison: 'plan réalisé' } });
    const c = carnetDe(etat, IDS_SUIVI.chambreFroide);
    const s = assurerSuivi(c);
    expect(s.etat).toBe('resolu');
    expect(s.resolu).toEqual({ le: '2026-11-10T12:00:00.000Z' });
    expect(c.carnet.archive).toBeDefined();
  });
});

describe('propositions de l’IA : proposées, jamais écrites sans leur geste', () => {
  const message = {
    id: 'ZZ-MSG-PROP', texte: 'Raccord refait. Rappeler l’entreprise X jeudi, ça devrait finir fin du mois.', le: LE, depuis: IDS_SUIVI.ecoulement, rangement: 'simulee' as const,
    propositionsSuivi: [
      { sorte: 'tache' as const, carnetId: IDS_SUIVI.ecoulement, texte: 'Rappeler l’entreprise X', echeance: '2026-11-26', precision: 'semaine' as const, origine: 'ia' as const },
      { sorte: 'retenir' as const, carnetId: IDS_SUIVI.vapeur, optionId: OPTIONS_VAPEUR.condA, origine: 'ia' as const },
      { sorte: 'deplacer' as const, carnetId: IDS_SUIVI.ecoulement, versCarnetId: IDS_SUIVI.fusible, origine: 'ia' as const }
    ],
    rattache: { carnetId: IDS_SUIVI.ecoulement, citation: 'Rappeler l’entreprise X jeudi' }
  };

  it('ranger garde les propositions et le rattachement sur le message sans toucher au carnet', () => {
    const etat = fixtureSuivi();
    const r = ranger(etat, { message, lignes: [{ carnetId: IDS_SUIVI.ecoulement, sorte: 'idee' }] });
    const apres = ok(etat, r);
    const m = lireMessage(doc(apres, 'ZZ-MSG-PROP'))!.carnetMessage;
    expect(m.propositionsSuivi).toHaveLength(3);
    expect(m.rattache).toEqual({ carnetId: IDS_SUIVI.ecoulement, citation: 'Rappeler l’entreprise X jeudi' });
    expect(carnetDe(apres, IDS_SUIVI.ecoulement).carnet.taches).toHaveLength(2);
    expect(json(doc(apres, IDS_SUIVI.ecoulement))).toEqual(json(doc(etat, IDS_SUIVI.ecoulement)));
    expect(ranger(etat, { message: { ...message, rattache: { carnetId: IDS_SUIVI.ecoulement, citation: 'une phrase qui n’y est pas' } }, lignes: [{ carnetId: IDS_SUIVI.ecoulement, sorte: 'idee' }] }).ok).toBe(false);
  });

  it('OK : la tâche s’écrit, la carte part, une seule écriture annulable ; Non : la carte part, rien d’autre', () => {
    const etat = ok(fixtureSuivi(), ranger(fixtureSuivi(), { message, lignes: [{ carnetId: IDS_SUIVI.ecoulement, sorte: 'idee' }] }));
    const r = accepterPropositionSuivi(etat, { messageId: 'ZZ-MSG-PROP', index: 0, le: LE });
    const apres = ok(etat, r);
    const t = carnetDe(apres, IDS_SUIVI.ecoulement).carnet.taches!.at(-1)!;
    expect(t).toMatchObject({ texte: 'Rappeler l’entreprise X', echeance: '2026-11-23', origine: 'ia', messageId: 'ZZ-MSG-PROP' });
    expect(lireMessage(doc(apres, 'ZZ-MSG-PROP'))!.carnetMessage.propositionsSuivi).toHaveLength(2);
    inverseRend(etat, r);
    const non = refuserPropositionSuivi(etat, { messageId: 'ZZ-MSG-PROP', index: 0 });
    const sans = ok(etat, non);
    expect(lireMessage(doc(sans, 'ZZ-MSG-PROP'))!.carnetMessage.propositionsSuivi).toHaveLength(2);
    expect(carnetDe(sans, IDS_SUIVI.ecoulement).carnet.taches).toHaveLength(2);
  });

  it('OK sur « retenir » retient l’option de lui ; « rattacher » se fait au rangement : refusé ici ; une proposition inconnue est refusée', () => {
    const etat = ok(fixtureSuivi(), ranger(fixtureSuivi(), { message, lignes: [{ carnetId: IDS_SUIVI.ecoulement, sorte: 'idee' }] }));
    const apres = ok(etat, accepterPropositionSuivi(etat, { messageId: 'ZZ-MSG-PROP', index: 1, le: LE }));
    expect(optionRetenue(carnetDe(apres, IDS_SUIVI.vapeur))?.id).toBe(OPTIONS_VAPEUR.condA);
    expect(accepterPropositionSuivi(etat, { messageId: 'ZZ-MSG-PROP', index: 2, le: LE }).ok).toBe(false);
    expect(accepterPropositionSuivi(etat, { messageId: 'ZZ-MSG-PROP', index: 9, le: LE }).ok).toBe(false);
  });

  it('une proposition d’un carnet supprimé est refusée', () => {
    const etat = ok(fixtureSuivi(), ranger(fixtureSuivi(), { message, lignes: [{ carnetId: IDS_SUIVI.ecoulement, sorte: 'idee' }] })).filter(d => d.id !== IDS_SUIVI.ecoulement);
    expect(accepterPropositionSuivi(etat, { messageId: 'ZZ-MSG-PROP', index: 0, le: LE }).ok).toBe(false);
  });
});

describe('Firestore refuse `undefined` : aucune écriture n’en porte', () => {
  const sansUndefined = (v: unknown): boolean => (v === undefined ? false : Array.isArray(v) ? v.every(sansUndefined) : v !== null && typeof v === 'object' ? Object.values(v).every(sansUndefined) : true);
  it('chaque intention du suivi écrit des documents sans clé indéfinie', () => {
    const e = fixtureSuivi();
    const msg = { id: 'ZZ-MSG-U', texte: 'Rappeler l’entreprise X jeudi.', le: LE, depuis: IDS_SUIVI.ecoulement, rangement: 'simulee' as const, rattache: { carnetId: IDS_SUIVI.ecoulement, citation: 'Rappeler' },
      propositionsSuivi: [{ sorte: 'tache' as const, carnetId: IDS_SUIVI.ecoulement, texte: 'Rappeler', origine: 'ia' as const }], etiquettes: [{ carnetId: IDS_SUIVI.ecoulement, sorte: 'contact' as const, origine: 'locale' as const }] };
    const apresMsg = ok(e, ranger(e, { message: msg, lignes: [{ carnetId: IDS_SUIVI.ecoulement, sorte: 'idee' }] }));
    const essais: Resultat[] = [
      changerEtat(e, { carnetId: IDS_SUIVI.fenetre, vers: 'resolu', le: LE }), changerOption(e, { carnetId: IDS_SUIVI.fete, faconId: 'ZZ-SX-F1', vers: 'ecartee', le: LE }),
      retenirOption(e, { carnetId: IDS_SUIVI.fete, faconId: 'ZZ-SX-F1', le: LE }), fermerParAchat(e, { carnetId: IDS_SUIVI.vapeur, le: LE }), resoudre(e, { carnetId: IDS_SUIVI.co2, le: LE }),
      resoudre(e, { carnetId: IDS_SUIVI.co2, le: LE, sorte: 'reparation' }), poserVeille(e, { carnetId: IDS_SUIVI.vapeur, faconId: OPTIONS_VAPEUR.condA, active: true, le: LE }),
      repondreRelu(e, { carnetId: IDS_SUIVI.vapeur, reponse: 'oui', le: LE }), poserAvantApres(e, { carnetId: IDS_SUIVI.vapeur, avantPhotoId: 'ZZ-SV-M1-P' }),
      ajouterTache(e, { carnetId: IDS_SUIVI.fenetre, texte: 'Régler', le: LE }), ajouterTache(e, { carnetId: IDS_SUIVI.fenetre, texte: 'Régler avec coût', le: LE, echeance: '2026-11-26', coutCentimes: 100 }),
      cocherTache(e, { carnetId: IDS_SUIVI.co2, tacheId: 'ZZ-SC-T1', le: LE }), poserEcheance(e, { carnetId: IDS_SUIVI.co2, tacheId: 'ZZ-SC-T1', echeance: '2026-11-26' }),
      poserGenre(e, { carnetId: IDS_SUIVI.fenetre, genre: 'memo', origine: 'vous' }), poserCategorie(e, { carnetId: IDS_SUIVI.fenetre, chemin: ['Bâtiment', 'Fenêtres'], origine: 'ia' }),
      etiqueter(e, { messageId: 'ZZ-SE-M2', etiquette: { carnetId: IDS_SUIVI.ecoulement, sorte: 'contact', origine: 'locale' } }), accepterPropositionSuivi(apresMsg, { messageId: 'ZZ-MSG-U', index: 0, le: LE })
    ];
    for (const r of essais) {
      expect(r.ok).toBe(true);
      if (r.ok) for (const w of r.ecritures) if (w.op === 'put') expect(sansUndefined(w.doc)).toBe(true);
    }
    expect(sansUndefined(apresMsg)).toBe(true);
  });
});

describe('arbre : catégorie posée visible dans l’arbre', () => {
  it('poser la catégorie d’un carnet sans chemin le sort du groupe « sans sous-domaine »', () => {
    const etat = fixtureSuivi();
    const avant = arbreDe(lireCarnets(etat, { archives: true }));
    const brasserie = avant.domaines.find(d => d.domaine === 'brasserie')!;
    expect(brasserie.groupes.find(g => g.chemin === null)!.carnets.map(c => c.id)).toContain(IDS_SUIVI.chambreFroide);
    const apres = ok(etat, poserCategorie(etat, { carnetId: IDS_SUIVI.chambreFroide, chemin: ['Froid'], origine: 'vous' }));
    const nb = arbreDe(lireCarnets(apres, { archives: true })).domaines.find(d => d.domaine === 'brasserie')!;
    expect(nb.groupes.find(g => g.chemin === 'Froid')!.carnets.map(c => c.id)).toEqual([IDS_SUIVI.chambreFroide]);
    expect(MAINTENANT_SUIVI).toMatch(/^2026-11-24/);
  });
});
