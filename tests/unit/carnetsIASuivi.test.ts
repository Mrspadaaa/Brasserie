/**
 * D451, voie ia : l'IA de rangement range un problème, étiquette le fil, propose sans écrire ailleurs. Gardes du client (`lireReponse`), schéma et contexte
 * du serveur, repli local, règle MESSAGE-RESTE-DANS-SON-CARNET et écriture annulable du suivi (`poserSuiviIA`). IA simulée seulement : aucun appel Gemini,
 * aucun appel réseau (l'espion de la passerelle le vérifie). Cas neufs (B23) : fête, assurance, joint, siphon, chambre froide, « truc à voir ».
 */
import { afterAll, describe, expect, it, vi } from 'vitest';

const passerelle = vi.hoisted(() => ({ call: vi.fn() }));
vi.mock('firebase/functions', () => ({ httpsCallable: () => passerelle.call }));
vi.mock('../../src/services/firebase', () => ({ functions: {} }));
import { AiClient } from '../../src/services/aiClient';
import type { CreativeItem } from '../../src/types';
import {
  CARNETS_MAX, CHEMIN_CAR_MAX, ETATS_OPTION_IA, ETATS_SUIVI_IA, ETIQUETTES_CARNET, GENRES_SUIVI, QUAND_TACHE, RANGER_CARNET, RANGER_CARNET_SCHEMA,
  assainirRangerCarnet, cheminLu, contexteRangerCarnet
} from '../../functions/src/carnetIA';
import { contexteModele, lireReponse, pourIASuivi, suiviDesLignes, type CarnetPourIA, type ContexteGarde, type LigneCarnet } from '../../src/domain/carnets/ia';
import { reponseSimulee } from '../../src/domain/carnets/iaSimulee';
import { etiquettesLocales } from '../../src/domain/carnets/analyseLocale';
import { fixtureCarnets, fixtureSuivi, IDS_SUIVI, OPTIONS_MALT, OPTIONS_VAPEUR } from '../../src/domain/carnets/fixture';
import { ETATS_OPTION, ETATS_SUIVI, GENRES_CARNET, SORTES_ETIQUETTE, lireCarnet, lireCarnets, lireMessages, type CarnetDoc } from '../../src/domain/carnets/modele';
import { appliquerEcritures, ranger, type Resultat } from '../../src/domain/carnets/operations';
import { etatOption, poserGenre } from '../../src/domain/carnets/suivi';
import { poserCategorie } from '../../src/domain/carnets/arbre';
import { CARNET_NEUF, destinationDans } from '../../src/ui/carnets/envoiRegles';
import { etiquettesDuRepli, poserSuiviIA } from '../../src/ui/carnets/rangementCarnets';

const espion = vi.spyOn(AiClient, 'run');
afterAll(() => { expect(espion).toHaveBeenCalledTimes(0); expect(passerelle.call).toHaveBeenCalledTimes(0); });

const LE = '2026-11-25T10:00:00.000Z';
const MAINTENANT = new Date(2026, 10, 25, 12, 0, 0); // mercredi 25.11.2026
const ETAT = fixtureSuivi();
const json = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const carnetDe = (etat: readonly CreativeItem[], id: string): CarnetDoc => lireCarnet(etat.find(d => d.id === id))!;
const messageDe = (etat: readonly CreativeItem[], id: string) => lireMessages(etat).find(m => m.id === id)!;
const pourIAdeEtat = (etat: readonly CreativeItem[]): CarnetPourIA[] => lireCarnets(etat).map(c => ({
  id: c.id, titre: c.title, facons: c.carnet.facons, notes: c.carnet.notes.map(n => ({ id: n.id, texte: n.texte })),
  ...(c.carnet.categorie ? { chemin: c.carnet.categorie.chemin } : {})
}));
const ok = (r: Resultat) => { if (!r.ok) throw new Error(r.raison); return r; };
function sansUndefined(v: unknown, chemin = ''): string[] {
  if (v === undefined) return [chemin];
  if (Array.isArray(v)) return v.flatMap((x, i) => sansUndefined(x, `${chemin}[${i}]`));
  if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => sansUndefined(x, `${chemin}.${k}`));
  return [];
}

/** Un message déjà rangé (comme `ecrireLocal` le fait) : la base des écritures de l'IA. */
function avecMessage(etat: readonly CreativeItem[], o: { id: string; texte: string; depuis: string; lignes: Parameters<typeof ranger>[1]['lignes'] }): CreativeItem[] {
  const r = ok(ranger(etat, { message: { id: o.id, texte: o.texte, le: LE, depuis: o.depuis, rangement: 'locale' }, lignes: o.lignes }));
  return appliquerEcritures(etat, r.ecritures);
}

const EVIER: CarnetPourIA = { id: 'c-evier', titre: 'ZZ TEST — Évier inox', notes: [{ id: 'n-1', texte: 'Le ferblantier passe jeudi' }], chemin: ['Local', 'Électricité'] };
const VENT: CarnetPourIA = { id: 'c-vent', titre: 'ZZ TEST — Ventilation de la salle', notes: [], chemin: ['Local', 'Air'] };
const CARNETS = [EVIER, VENT];
const garde = (brut: unknown, texte: string, extra: Partial<ContexteGarde> = {}) => lireReponse(brut, { texte, carnets: CARNETS, maintenant: MAINTENANT, ...extra });
const une = (r: LigneCarnet[] | null): LigneCarnet => { expect(r).not.toBeNull(); return r![0]; };

describe('contrat serveur et client : une seule écriture des listes', () => {
  it('les énumérations du serveur sont celles du modèle (étiquettes, genres, états, états d’option)', () => {
    expect([...ETIQUETTES_CARNET]).toEqual([...SORTES_ETIQUETTE]);
    expect([...GENRES_SUIVI]).toEqual([...GENRES_CARNET]);
    expect([...ETATS_SUIVI_IA]).toEqual([...ETATS_SUIVI]);
    expect([...ETATS_OPTION_IA]).toEqual([...ETATS_OPTION]);
    expect([...QUAND_TACHE]).toEqual(['semaine', 'mois', 'un-jour']);
  });

  it('le schéma porte les champs neufs, nullables, avant les champs libres (propertyOrdering)', () => {
    const ligne = (RANGER_CARNET_SCHEMA.properties.lignes as { items: { properties: Record<string, { nullable?: boolean; enum?: string[] }>; propertyOrdering: string[]; required: string[] } }).items;
    for (const k of ['etiquette', 'option', 'genreCarnet', 'chemin', 'etatPropose', 'tachePropose', 'citation']) {
      expect(ligne.properties[k], k).toBeDefined();
      expect(ligne.properties[k].nullable, `${k} nullable`).toBe(true);
      expect(ligne.required).not.toContain(k);
      expect(ligne.propertyOrdering.indexOf(k), `${k} avant url`).toBeLessThan(ligne.propertyOrdering.indexOf('url'));
    }
    expect(ligne.properties.etiquette.enum).toEqual([...ETIQUETTES_CARNET]);
    expect(ligne.propertyOrdering).toEqual(Object.keys(ligne.properties));
    expect(ligne.properties.tachePropose).toMatchObject({ type: 'OBJECT', nullable: true, required: ['quand'] });
  });

  it('la consigne dit le suivi, en général : aucun objet de ses exemples (B23)', () => {
    const s = RANGER_CARNET.system;
    for (const mot of ['etiquette', 'citation', 'genreCarnet', 'chemin', 'etatPropose', 'tachePropose']) expect(s).toContain(mot);
    expect(s).toMatch(/jamais seuls|ne s'écrivent jamais/);
    expect(s).not.toMatch(/vapeur|écoulement|ecoulement|fusible|citra|condenseur|buée|humidificateur/i);
    expect(RANGER_CARNET.maxOutputTokens).toBe(4000);
  });

  it('assainirRangerCarnet : énumérations, chemin, citation, tâche ; l’ancienne forme passe telle quelle', () => {
    const r = assainirRangerCarnet({ lignes: [
      { sorte: 'note', texte: 'a', etiquette: 'devis', option: ' Hotte ', genreCarnet: 'probleme', etatPropose: 'cherche', chemin: ['Local', 'Air', 'Gaines'], citation: ' goutte encore ', tachePropose: { texte: 'Appeler', quand: 'mois', prix: 40 } },
      { sorte: 'note', texte: 'b', etiquette: 'bidon', genreCarnet: 'bidon', etatPropose: 'fini', tachePropose: { texte: 'x', quand: 'demain' }, chemin: ['x'.repeat(31)] },
      { sorte: 'note', texte: 'c' }
    ] }).lignes;
    expect(r[0]).toMatchObject({ etiquette: 'devis', option: 'Hotte', genreCarnet: 'probleme', etatPropose: 'cherche', chemin: ['Local', 'Air'], citation: 'goutte encore', tachePropose: { texte: 'Appeler', quand: 'mois', prix: 40 } });
    expect(r[1]).toEqual({ sorte: 'note', texte: 'b' });
    expect(r[2]).toEqual({ sorte: 'note', texte: 'c' });
    expect(cheminLu(['a', ' b ', 'c'])).toEqual(['a', 'b']);
    expect(cheminLu(['y'.repeat(CHEMIN_CAR_MAX)])).toHaveLength(1);
    expect(cheminLu(['y'.repeat(CHEMIN_CAR_MAX + 1)])).toBeUndefined();
    expect(cheminLu([])).toBeUndefined();
  });
});

describe('gardes de lireReponse (DOSSIER 1 à 4)', () => {
  const TEXTE = 'Le robinet de la cave goutte encore, voir le plombier';

  it('1. citation : absente du message, retirée ; présente, gardée telle quelle (casse comprise)', () => {
    const l = (citation: string) => une(garde({ lignes: [{ sorte: 'note', texte: 'Robinet qui goutte', carnetId: 'c-evier', citation }] }, TEXTE));
    expect(l('robinet de la cave goutte').citation).toBe('robinet de la cave goutte');
    expect(l('robinet de la cuisine').citation).toBeUndefined();
    expect(l('Robinet de la cave').citation, 'la casse compte : sous-chaîne exacte').toBeUndefined();
    expect(l('goutte  encore').citation, 'les espaces aussi').toBeUndefined();
    expect(l('ok').citation, 'trop court pour prouver quoi que ce soit').toBeUndefined();
    expect(une(garde({ lignes: [{ sorte: 'note', texte: 'x', citation: null }] }, TEXTE)).citation).toBeUndefined();
  });

  it('2. montant d’étiquette : seulement s’il est écrit ; « ≈ » et « environ » gardent l’estimation', () => {
    const t = 'Devis reçu de la menuiserie, environ 480 CHF';
    const e = une(garde({ lignes: [{ sorte: 'note', texte: 'Devis reçu', etiquette: 'devis', prix: 480, devise: 'CHF' }] }, t, { depuis: 'c-vent' }));
    expect(e).toMatchObject({ etiquette: 'devis', prixCentimes: 48000, prixSource: 'texte', devise: 'CHF', estime: true });
    const inv = une(garde({ lignes: [{ sorte: 'note', texte: 'Devis reçu', etiquette: 'devis', prix: 520, devise: 'CHF' }] }, t, { depuis: 'c-vent' }));
    expect(inv.prixCentimes, 'un montant non écrit n’existe pas').toBeUndefined();
    expect(inv.etiquette, 'le jeton reste, sans montant').toBe('devis');
    expect(inv.estime).toBeUndefined();
    const ferme = une(garde({ lignes: [{ sorte: 'note', texte: 'Devis', etiquette: 'devis', prix: 480 }] }, 'Devis menuiserie : 480 CHF, pose environ 3 h', { depuis: 'c-vent' }));
    expect(ferme.prixCentimes).toBe(48000);
    expect(ferme.estime, '« environ » ne porte pas sur ce montant').toBeUndefined();
    for (const marque of ['≈ 480 CHF', '~480 CHF', 'autour de 480 CHF', 'à peu près 480 CHF'])
      expect(une(garde({ lignes: [{ sorte: 'note', texte: 'Coût', etiquette: 'cout', prix: 480 }] }, `Coût de la pose ${marque}`, { depuis: 'c-vent' })).estime, marque).toBe(true);
  });

  it('2b. tâche proposée : lundi de la semaine ou du mois ; prix seulement écrit, devise seulement lue', () => {
    const t = 'Appeler le serrurier cette semaine, 150 CHF la visite';
    const sem = une(garde({ lignes: [{ sorte: 'note', texte: 'Appeler le serrurier', tachePropose: { texte: 'Appeler le serrurier', quand: 'semaine', prix: 150 } }] }, t, { depuis: 'c-vent' })).tachePropose;
    expect(sem).toEqual({ texte: 'Appeler le serrurier', echeance: '2026-11-23', precision: 'semaine', coutCentimes: 15000, devise: 'CHF' });
    const mois = une(garde({ lignes: [{ sorte: 'note', texte: 'x', tachePropose: { texte: 'Renouveler', quand: 'mois' } }] }, 'Renouveler fin du mois', { depuis: 'c-vent' })).tachePropose;
    expect(mois).toEqual({ texte: 'Renouveler', echeance: '2026-11-30', precision: 'mois' });
    const jour = une(garde({ lignes: [{ sorte: 'note', texte: 'x', tachePropose: { texte: 'Y penser', quand: 'un-jour' } }] }, 'Y penser un jour', { depuis: 'c-vent' })).tachePropose;
    expect(jour, 'un jour : ni échéance ni précision').toEqual({ texte: 'Y penser' });
    const faux = une(garde({ lignes: [{ sorte: 'note', texte: 'x', tachePropose: { texte: 'Appeler', quand: 'semaine', prix: 200 } }] }, t, { depuis: 'c-vent' })).tachePropose!;
    expect(faux.coutCentimes, 'prix non écrit').toBeUndefined();
    expect(faux.devise).toBeUndefined();
    const nu = une(garde({ lignes: [{ sorte: 'note', texte: 'x', tachePropose: { texte: 'Appeler', quand: 'semaine', prix: 150 } }] }, 'Appeler la cave, 150', { depuis: 'c-vent' })).tachePropose!;
    expect(nu.coutCentimes).toBe(15000);
    expect(nu.devise, 'une devise non écrite reste inconnue').toBeUndefined();
    expect(une(garde({ lignes: [{ sorte: 'note', texte: 'x', tachePropose: { quand: 'semaine' } }] }, 'x', { depuis: 'c-vent' })).tachePropose, 'ni texte ni option : rien').toBeUndefined();
    expect(une(garde({ lignes: [{ sorte: 'note', texte: 'x', option: 'Hotte', tachePropose: { quand: 'mois' } }] }, 'x', { depuis: 'c-vent' })).tachePropose, 'la date d’une option : sans texte').toEqual({ echeance: '2026-11-30', precision: 'mois' });
  });

  it('3. chemin : plus de 2 niveaux tronqué, plus de 30 caractères refusé, rapproché du vocabulaire', () => {
    const ch = (chemin: unknown) => une(garde({ lignes: [{ sorte: 'idee', texte: 'Un sujet', titre: 'Un sujet', chemin }] }, 'Un sujet')).chemin;
    expect(ch(['local', 'electricite', 'prises', 'extra']), 'repris tel qu’employé, 2 niveaux').toEqual(['Local', 'Électricité']);
    expect(ch(['Locale', 'Electricte']), 'à une faute près').toEqual(['Local', 'Électricité']);
    expect(ch(['Chambre froide', 'Compresseur']), 'un mot neuf reste neuf').toEqual(['Chambre froide', 'Compresseur']);
    expect(ch(['x'.repeat(31)]), '31 caractères : refusé').toBeUndefined();
    expect(ch(['Local', 'y'.repeat(31)]), 'un niveau trop long refuse tout le chemin').toBeUndefined();
    expect(ch('Local')).toBeUndefined();
    expect(ch([])).toBeUndefined();
    expect(ch(['Une catégorie nouvelle'])).toEqual(['Une catégorie nouvelle']);
  });

  it('4. étiquette, état, genre, quand hors énumération : ignorés, la ligne reste', () => {
    const l = une(garde({ lignes: [{ sorte: 'note', texte: 'Un message', etiquette: 'urgent', etatPropose: 'termine', genreCarnet: 'tache', tachePropose: { texte: 'x', quand: 'demain' } }] }, 'Un message'));
    expect(l).toEqual({ sorte: 'note', texte: 'Un message', origine: 'ia' });
    const bon = une(garde({ lignes: [{ sorte: 'idee', texte: 'Sujet', titre: 'Sujet', etiquette: 'cause', etatPropose: 'decide', genreCarnet: 'memo' }] }, 'Sujet'));
    expect(bon).toMatchObject({ etiquette: 'cause', etatPropose: 'decide', genreCarnet: 'memo' });
  });
});

describe('MESSAGE-RESTE-DANS-SON-CARNET et cartes « OK · Non » (DOSSIER 5 et 6)', () => {
  const entree = (o: Partial<Parameters<typeof suiviDesLignes>[1]> = {}): Parameters<typeof suiviDesLignes>[1] => ({
    texte: 'x', depuis: null, crees: new Set(), cibleDe: l => l.carnetId, optionDe: () => undefined, etatDe: () => 'cherche', ...o
  });

  it('5. depuis un carnet ouvert, une ligne qui vise un autre carnet reste ici et devient « Rattacher à … ? »', () => {
    const lignes = garde({ lignes: [{ sorte: 'note', texte: 'Siphon à changer', carnetId: 'c-evier' }] }, 'Siphon à changer', { depuis: 'c-vent' })!;
    expect(lignes[0]).toMatchObject({ carnetId: 'c-vent', carnetSuggere: 'c-evier' });
    const s = suiviDesLignes(lignes, entree({ depuis: 'c-vent' }));
    expect(s.propositions).toEqual([{ sorte: 'deplacer', carnetId: 'c-vent', versCarnetId: 'c-evier', origine: 'ia' }]);
    expect(s.etiquettes).toEqual([]);
    expect(s.rattache).toBeUndefined();
  });

  it('5. depuis la liste : le rattachement cite ses mots (la citation exacte), aucune carte « déplacer »', () => {
    const texte = 'Le ferblantier passe jeudi\nsiphon à changer';
    const lignes = garde({ lignes: [{ sorte: 'note', texte: 'Siphon à changer', carnetId: 'c-evier', citation: 'siphon à changer' }] }, texte)!;
    expect(lignes[0].carnetId).toBe('c-evier');
    const s = suiviDesLignes(lignes, entree({ depuis: null, texte }));
    expect(s.rattache).toEqual({ carnetId: 'c-evier', citation: 'siphon à changer' });
    expect(s.propositions.filter(p => p.sorte === 'deplacer')).toEqual([]);
    const sans = suiviDesLignes(garde({ lignes: [{ sorte: 'note', texte: 'Siphon à changer', carnetId: 'c-evier', citation: 'jamais écrit' }] }, texte)!, entree({ depuis: null, texte }));
    expect(sans.rattache, 'une citation absente du message ne rattache rien').toBeUndefined();
  });

  it('6. retenir, dater, résoudre, veiller, tâche : des propositions, aucune écriture d’état, de choix, de date ni de tâche', () => {
    const carnets = pourIAdeEtat(ETAT);
    const malt = carnetDe(ETAT, IDS_SUIVI.malt);
    const nom = (id: string) => malt.carnet.facons.find(f => f.id === id)!.nom;
    const texte = 'Je prends le pâle, la veille sur le décalage, commande ce mois, tout est réglé';
    const brut = { lignes: [
      { sorte: 'note', texte: 'Je prends le pâle', carnetId: malt.id, option: nom(OPTIONS_MALT.pale), etiquette: 'retenu' },
      { sorte: 'note', texte: 'Veille sur le décalage', carnetId: malt.id, option: nom(OPTIONS_MALT.decaler), etiquette: 'veille' },
      { sorte: 'note', texte: 'Commander', carnetId: malt.id, tachePropose: { texte: 'Commander', quand: 'mois' } },
      { sorte: 'note', texte: 'Date du pâle', carnetId: malt.id, option: nom(OPTIONS_MALT.pale), tachePropose: { quand: 'semaine' } },
      { sorte: 'note', texte: 'Tout est réglé', carnetId: malt.id, etatPropose: 'resolu' }
    ] };
    const lignes = lireReponse(brut, { texte, carnets, depuis: malt.id, maintenant: MAINTENANT })!;
    const etat = avecMessage(ETAT, { id: 'ZZ-IA-M-PROP', texte, depuis: malt.id, lignes: [{ carnetId: malt.id, sorte: 'note', texte }] });
    const r = poserSuiviIA(etat, { messageId: 'ZZ-IA-M-PROP', lignes, depuis: malt.id, le: LE, cibleDe: l => l.carnetId })!;
    expect(r).not.toBeNull();
    const apres = appliquerEcritures(etat, r.ecritures);
    const sortes = (messageDe(apres, 'ZZ-IA-M-PROP').carnetMessage.propositionsSuivi ?? []).map(p => p.sorte).sort();
    expect(sortes).toEqual(['dater', 'resoudre', 'retenir', 'tache', 'veiller']);
    expect(JSON.stringify(carnetDe(apres, malt.id)), 'le carnet n’est pas touché').toBe(JSON.stringify(carnetDe(etat, malt.id)));
    expect(r.ecritures.every(e => e.op === 'put' && e.doc.type === 'carnet-message'), 'seul le message est écrit').toBe(true);
    const retenir = messageDe(apres, 'ZZ-IA-M-PROP').carnetMessage.propositionsSuivi!.find(p => p.sorte === 'retenir')!;
    expect(retenir.optionId).toBe(OPTIONS_MALT.pale);
    expect(etatOption(carnetDe(apres, malt.id).carnet.facons.find(f => f.id === OPTIONS_MALT.pale)!)).toBe(etatOption(malt.carnet.facons.find(f => f.id === OPTIONS_MALT.pale)!));
    expect(sansUndefined(r.ecritures)).toEqual([]);
  });

  it('6. un carnet déjà résolu ne se voit pas proposer « Résoudre » ; une option inconnue ne propose rien', () => {
    const lignes = garde({ lignes: [{ sorte: 'note', texte: 'Fini', carnetId: 'c-vent', etatPropose: 'resolu', option: 'Inexistante', etiquette: 'retenu' }] }, 'Fini', { depuis: 'c-vent' })!;
    expect(suiviDesLignes(lignes, { texte: 'Fini', depuis: 'c-vent', crees: new Set(), cibleDe: l => l.carnetId, optionDe: () => undefined, etatDe: () => 'resolu' }).propositions).toEqual([]);
    const s = suiviDesLignes(lignes, { texte: 'Fini', depuis: 'c-vent', crees: new Set(), cibleDe: l => l.carnetId, optionDe: () => undefined, etatDe: () => 'cherche' });
    expect(s.propositions.map(p => p.sorte)).toEqual(['resoudre']);
    expect(s.etiquettes[0], 'le jeton garde le nom de l’option inconnue, sans l’inventer').toMatchObject({ sorte: 'retenu', texte: 'Inexistante' });
    expect(s.etiquettes[0].optionId).toBeUndefined();
  });

  it('6. un coût « à peu près » n’est pas porté par une proposition ; le plafond des cartes est de 6', () => {
    const l = une(garde({ lignes: [{ sorte: 'note', texte: 'Commander', carnetId: 'c-vent', tachePropose: { texte: 'Commander', quand: 'semaine', prix: 300 } }] }, 'Commander cette semaine, environ 300 CHF', { depuis: 'c-vent' }));
    expect(l.tachePropose).toMatchObject({ coutCentimes: 30000, coutEstime: true });
    const p = suiviDesLignes([l], { texte: 'x', depuis: 'c-vent', crees: new Set(), cibleDe: x => x.carnetId, optionDe: () => undefined, etatDe: () => 'cherche' }).propositions[0];
    expect(p).toMatchObject({ sorte: 'tache', texte: 'Commander' });
    expect(p.coutCentimes).toBeUndefined();
    const dix = Array.from({ length: 10 }, (_, i) => ({ sorte: 'note', texte: `t${i}`, origine: 'ia', carnetId: 'c-vent', tachePropose: { texte: `Tâche ${i}` } })) as LigneCarnet[];
    expect(suiviDesLignes(dix, { texte: 'x', depuis: 'c-vent', crees: new Set(), cibleDe: x => x.carnetId, optionDe: () => undefined, etatDe: () => 'cherche' }).propositions).toHaveLength(6);
  });
});

describe('repli local sans IA (DOSSIER 7)', () => {
  it('coût ou devis sur un montant écrit, « pas trouvé », « contacté » ; rien d’autre', () => {
    expect(etiquettesLocales('Devis du menuisier : 480 CHF')).toEqual([{ sorte: 'devis', montantCentimes: 48000, devise: 'CHF' }]);
    expect(etiquettesLocales('La pose revient à 120 CHF')).toEqual([{ sorte: 'cout', montantCentimes: 12000, devise: 'CHF' }]);
    expect(etiquettesLocales('Offre reçue : ≈ 90 €')).toEqual([{ sorte: 'devis', montantCentimes: 9000, devise: 'EUR', estime: true }]);
    expect(etiquettesLocales('Joint adapté : pas trouvé chez le premier')).toEqual([{ sorte: 'pas-trouve' }]);
    expect(etiquettesLocales('Fournisseur contacté ce matin')).toEqual([{ sorte: 'contact' }]);
    for (const rien of ['truc à voir', 'Vérifier le niveau avant jeudi', 'Penser à la fête de juin', 'Le compresseur fait du bruit', 'Il faut 2 personnes pour 3 fûts', '']) expect(etiquettesLocales(rien), rien).toEqual([]);
  });

  it('un lien porte son prix sur son article : aucun montant de fil pour un message à lien', () => {
    expect(etiquettesLocales('https://exemple.invalid/joint 12 CHF')).toEqual([]);
    expect(etiquettesLocales('Joint pas trouvé, voir https://exemple.invalid/joint 12 CHF')).toEqual([{ sorte: 'pas-trouve' }]);
  });

  it('les jetons du repli : carnet, origine « locale », aucune clé vide ; le message n’est jamais modifié', () => {
    const e = etiquettesDuRepli('Devis 480 CHF, fournisseur contacté', 'c-vent');
    expect(e).toEqual([
      { carnetId: 'c-vent', sorte: 'devis', montantCentimes: 48000, devise: 'CHF', origine: 'locale' },
      { carnetId: 'c-vent', sorte: 'contact', origine: 'locale' }
    ]);
    expect(sansUndefined(e)).toEqual([]);
  });

  it('un montant nul n’est jamais posé (l’inconnu n’est pas 0)', () => {
    expect(etiquettesLocales('Aucun prix, 0 CHF')).toEqual([]);
  });
});

describe('cas neufs (B23) : la réponse simulée passe par le même garde', () => {
  const base = pourIAdeEtat(fixtureCarnets());
  const ranger1 = (texte: string, depuis: string | null = null) => {
    const ctx = contexteModele(texte, MAINTENANT, depuis, base);
    const brut = reponseSimulee(ctx);
    return { brut, lignes: brut ? lireReponse(brut, { texte, carnets: base, depuis, maintenant: MAINTENANT, origine: 'exemple' }) : null };
  };

  it('un message sans rapport avec aucun carnet n’est jamais rattaché à tort : ni carnetId, ni carte', () => {
    for (const texte of ['Assurance RC à renouveler', 'truc à voir', 'Prévoir les vacances en août']) {
      const { lignes } = ranger1(texte);
      expect(lignes, texte).not.toBeNull();
      for (const l of lignes!) { expect(l.carnetId, `${texte} : carnetId`).toBeUndefined(); expect(l.carnetSuggere, `${texte} : suggestion`).toBeUndefined(); expect(l.origine).toBe('exemple'); }
      const s = suiviDesLignes(lignes!, { texte, depuis: null, crees: new Set(), cibleDe: l => l.carnetId, optionDe: () => undefined, etatDe: () => undefined });
      expect(s.rattache).toBeUndefined();
      expect(s.propositions).toEqual([]);
    }
  });

  it('« fête de la brasserie en juin, il faut une tireuse » depuis la liste : une phrase seule ne se verse jamais dans un carnet existant sans confirmation', () => {
    const { lignes } = ranger1('Fête de la brasserie en juin, il faut une tireuse');
    expect(lignes).not.toBeNull();
    for (const l of lignes!) expect(l.carnetId).toBeUndefined();
  });

  it('simulé : « pas trouvé » et un geste daté deviennent un jeton et une tâche proposée, marqués « exemple »', () => {
    const texte = 'Joint adapté pas trouvé\nAppeler le fournisseur cette semaine';
    const { lignes } = ranger1(texte, 'c-vent');
    expect(lignes!.some(l => l.etiquette === 'pas-trouve')).toBe(true);
    const tache = lignes!.find(l => l.tachePropose)?.tachePropose;
    expect(tache).toMatchObject({ precision: 'semaine', echeance: '2026-11-23' });
    expect(lignes!.every(l => l.origine === 'exemple')).toBe(true);
  });

  it('simulé : un souci dit en mots devient un problème noté ; un message sans souci ne change pas', () => {
    const souci = ranger1('La vanne du chauffe-eau fuit').lignes!;
    expect(souci.find(l => l.genreCarnet), JSON.stringify(souci)).toMatchObject({ genreCarnet: 'probleme', etatPropose: 'note' });
    const calme = ranger1('Assurance RC à renouveler').lignes!;
    expect(calme.some(l => l.genreCarnet || l.etiquette || l.tachePropose || l.citation)).toBe(false);
  });
});

describe('contexte compact (DOSSIER 9) : borné, sans photo', () => {
  const lourd = (i: number): CarnetPourIA => ({
    id: `c${i}`, titre: `t${i}`, majLe: 1000 - i,
    genre: 'probleme', etat: 'cherche', domaine: 'local', chemin: ['Local', 'Eau'],
    options: Array.from({ length: 15 }, (_, k) => ({ nom: `option ${k}`, etat: 'veille' as const })),
    taches: Array.from({ length: 12 }, (_, k) => `tâche ${k}`),
    derniers: Array.from({ length: 5 }, (_, k) => `message ${k} ${'z'.repeat(300)}`)
  });
  const beaucoup = Array.from({ length: 40 }, (_, i) => lourd(i));

  it('30 carnets, 3 messages par carnet, 160 caractères, 12 options, 8 tâches ; les chemins sans doublon', () => {
    const ctx = contexteModele('x', MAINTENANT, 'c39', beaucoup);
    expect(ctx.carnets).toHaveLength(CARNETS_MAX);
    for (const c of ctx.carnets) {
      expect(c.derniers).toHaveLength(3);
      expect(Math.max(...c.derniers!.map(d => d.length))).toBeLessThanOrEqual(160);
      expect(c.options).toHaveLength(12);
      expect(c.taches).toHaveLength(8);
    }
    expect(ctx.chemins).toEqual([['Local', 'Eau']]);
    expect(JSON.stringify(ctx)).not.toMatch(/jpeg|photo|data:image/);
  });

  it('le serveur reprend le même contexte, aussi borné ; un contexte d’ancien client passe', () => {
    const ctx = contexteModele('x', MAINTENANT, null, beaucoup);
    const serveur = contexteRangerCarnet(json(ctx))!;
    expect(serveur.carnets).toHaveLength(CARNETS_MAX);
    expect(serveur.carnets[0]).toMatchObject({ genre: 'probleme', etat: 'cherche', domaine: 'local', chemin: ['Local', 'Eau'] });
    expect(serveur.carnets[0].derniers).toHaveLength(3);
    expect(serveur.chemins).toEqual([['Local', 'Eau']]);
    const ancien = contexteRangerCarnet({ texte: 'x', saisie: '2026-11-24', depuis: null, carnets: [{ id: 'a', titre: 'A', criteres: [], facons: [], articles: [], notes: [] }] })!;
    expect(Object.keys(ancien.carnets[0]).sort()).toEqual(['articles', 'criteres', 'facons', 'id', 'notes', 'titre']);
    expect(ancien.chemins).toBeUndefined();
  });

  it('sans suivi, le contexte du client est celui d’avant (aucune clé neuve)', () => {
    const ctx = contexteModele('x', MAINTENANT, null, CARNETS.map(c => ({ id: c.id, titre: c.titre, notes: c.notes })));
    expect(Object.keys(ctx.carnets[0]).sort()).toEqual(['articles', 'criteres', 'facons', 'id', 'notes', 'titre']);
    expect(ctx.chemins).toBeUndefined();
  });

  it('pourIASuivi lit le suivi d’un vrai carnet : état, options hors pistes, tâches ouvertes, 3 derniers messages', () => {
    const plus = pourIASuivi(lireCarnets(ETAT), lireMessages(ETAT));
    const vapeur = plus.get(IDS_SUIVI.vapeur)!;
    expect(vapeur.genre).toBeDefined();
    expect(vapeur.etat).toBe('decide');
    expect(vapeur.options!.every(o => o.etat !== 'piste')).toBe(true);
    expect(vapeur.options!.some(o => o.etat === 'retenue')).toBe(true);
    expect(vapeur.derniers!.length).toBeLessThanOrEqual(3);
    expect(vapeur.derniers![0]).toMatch(/Photo du plafond après la pose provisoire/);
    expect(Math.max(...vapeur.derniers!.map(d => d.length))).toBeLessThanOrEqual(160);
    for (const [, v] of plus) expect(sansUndefined(v)).toEqual([]);
  });
});

describe('compatibilité : client neuf et réponse ancienne, serveur ancien', () => {
  it('une réponse sans les champs du suivi passe comme avant : aucune clé neuve, aucune erreur', () => {
    const r = garde({ lignes: [{ sorte: 'critere', texte: 'Silencieux', carnetId: 'c-vent', etiquette: null, option: null, genreCarnet: null, chemin: null, etatPropose: null, tachePropose: null, citation: null }] }, 'Silencieux', { depuis: 'c-vent' })!;
    expect(r).toEqual([{ sorte: 'critere', texte: 'Silencieux', carnetId: 'c-vent', source: 'phrase', origine: 'ia' }]);
    const s = suiviDesLignes(r, { texte: 'Silencieux', depuis: null, crees: new Set(), cibleDe: l => l.carnetId, optionDe: () => undefined, etatDe: () => 'note' });
    expect(s).toEqual({ etiquettes: [], propositions: [], neufs: [] });
  });

  it('poserSuiviIA sans suivi à écrire : rien (null), aucune écriture parasite', () => {
    const etat = avecMessage(ETAT, { id: 'ZZ-IA-M-VIDE', texte: 'Silencieux', depuis: IDS_SUIVI.malt, lignes: [{ carnetId: IDS_SUIVI.malt, sorte: 'note', texte: 'Silencieux' }] });
    const lignes = garde({ lignes: [{ sorte: 'note', texte: 'Silencieux', carnetId: IDS_SUIVI.malt }] }, 'Silencieux', { carnets: pourIAdeEtat(etat), depuis: IDS_SUIVI.malt })!;
    expect(poserSuiviIA(etat, { messageId: 'ZZ-IA-M-VIDE', lignes, depuis: IDS_SUIVI.malt, le: LE, cibleDe: l => l.carnetId })).toBeNull();
    expect(poserSuiviIA(etat, { messageId: 'inconnu', lignes, depuis: null, le: LE, cibleDe: l => l.carnetId })).toBeNull();
  });
});

describe('écriture du suivi : annulable, jamais sur ce qu’il a posé', () => {
  const TEXTE = 'Le joint de la porte ne ferme plus, ça fuit à chaque lavage';
  const NEUF = 'ZZ-IA-NEUF-JOINT';
  const etatNeuf = () => avecMessage(ETAT, { id: 'ZZ-IA-M-NEUF', texte: TEXTE, depuis: 'liste', lignes: [{ sorte: 'idee', carnetNeuf: { id: NEUF, titre: 'ZZ TEST — Joint de porte' } }] });
  const lignesNeuf = (extra: Record<string, unknown> = {}) => garde({ lignes: [{
    sorte: 'idee', texte: 'Joint de porte', titre: 'Joint de porte', genreCarnet: 'probleme', chemin: ['Local', 'Portes'], etatPropose: 'cherche', etiquette: 'constat',
    tachePropose: { texte: 'Mesurer le joint', quand: 'semaine' }, ...extra
  }] }, TEXTE, { carnets: pourIAdeEtat(ETAT) })!;

  it('un carnet qui naît reçoit son genre, sa catégorie et l’état d’un problème neuf ; la tâche reste une carte', () => {
    const etat = etatNeuf();
    const r = poserSuiviIA(etat, { messageId: 'ZZ-IA-M-NEUF', lignes: lignesNeuf(), depuis: null, le: LE, cibleDe: () => NEUF })!;
    const apres = appliquerEcritures(etat, r.ecritures);
    const c = carnetDe(apres, NEUF).carnet;
    expect(c.genre).toEqual({ valeur: 'probleme', origine: 'ia' });
    expect(c.categorie).toEqual({ chemin: ['Local', 'Portes'], origine: 'ia' });
    expect(c.suivi?.etat).toBe('cherche');
    expect(c.suivi?.evenements.at(-1)).toMatchObject({ sorte: 'etat', vers: 'cherche', origine: 'ia' });
    expect(c.taches ?? [], 'aucune tâche écrite').toEqual([]);
    const m = messageDe(apres, 'ZZ-IA-M-NEUF').carnetMessage;
    expect(m.etiquettes).toEqual([{ carnetId: NEUF, sorte: 'constat', origine: 'ia' }]);
    expect(m.propositionsSuivi).toMatchObject([{ sorte: 'tache', carnetId: NEUF, texte: 'Mesurer le joint', echeance: '2026-11-23', precision: 'semaine' }]);
    expect(sansUndefined(r.ecritures)).toEqual([]);
  });

  it('Annuler rend exactement l’état d’avant, document pour document', () => {
    const etat = etatNeuf();
    const r = poserSuiviIA(etat, { messageId: 'ZZ-IA-M-NEUF', lignes: lignesNeuf(), depuis: null, le: LE, cibleDe: () => NEUF })!;
    const apres = appliquerEcritures(etat, r.ecritures);
    const rendu = appliquerEcritures(apres, r.inverse);
    const trie = (e: readonly CreativeItem[]) => json([...e].sort((a, b) => a.id.localeCompare(b.id)));
    expect(trie(rendu)).toEqual(trie(etat));
  });

  it('résolu n’est jamais posé par l’IA à la naissance d’un carnet ; un souci qui n’est pas un problème n’a pas d’état', () => {
    const etat = etatNeuf();
    const r1 = poserSuiviIA(etat, { messageId: 'ZZ-IA-M-NEUF', lignes: lignesNeuf({ etatPropose: 'resolu' }), depuis: null, le: LE, cibleDe: () => NEUF })!;
    expect(carnetDe(appliquerEcritures(etat, r1.ecritures), NEUF).carnet.suivi).toBeUndefined();
    const r2 = poserSuiviIA(etat, { messageId: 'ZZ-IA-M-NEUF', lignes: lignesNeuf({ genreCarnet: 'memo' }), depuis: null, le: LE, cibleDe: () => NEUF })!;
    const c2 = carnetDe(appliquerEcritures(etat, r2.ecritures), NEUF).carnet;
    expect(c2.genre?.valeur).toBe('memo');
    expect(c2.suivi).toBeUndefined();
  });

  it('le genre et la catégorie qu’il a posés ne se laissent pas écraser ; l’état suit le genre posé', () => {
    let etat = etatNeuf();
    etat = appliquerEcritures(etat, ok(poserGenre(etat, { carnetId: NEUF, genre: 'memo', origine: 'vous' })).ecritures);
    etat = appliquerEcritures(etat, ok(poserCategorie(etat, { carnetId: NEUF, chemin: ['Papiers', 'Contrats'], origine: 'vous' })).ecritures);
    const r = poserSuiviIA(etat, { messageId: 'ZZ-IA-M-NEUF', lignes: lignesNeuf(), depuis: null, le: LE, cibleDe: () => NEUF })!;
    const c = carnetDe(appliquerEcritures(etat, r.ecritures), NEUF).carnet;
    expect(c.genre).toEqual({ valeur: 'memo', origine: 'vous' });
    expect(c.categorie).toEqual({ chemin: ['Papiers', 'Contrats'], origine: 'vous' });
    expect(c.suivi, 'un mémo n’a pas d’état de problème posé par l’IA').toBeUndefined();
  });

  it('une étiquette de devis porte son montant écrit et son option reconnue ; une option inconnue reste un mot', () => {
    const vapeur = carnetDe(ETAT, IDS_SUIVI.vapeur);
    const hotte = vapeur.carnet.facons.find(f => f.id === OPTIONS_VAPEUR.hotte)!;
    const texte = 'Devis du ferblantier pour la hotte : 1 200 CHF';
    const etat = avecMessage(ETAT, { id: 'ZZ-IA-M-DEVIS', texte, depuis: vapeur.id, lignes: [{ carnetId: vapeur.id, sorte: 'note', texte }] });
    const l = garde({ lignes: [
      { sorte: 'note', texte: 'Devis', carnetId: vapeur.id, option: hotte.nom.toUpperCase(), etiquette: 'devis', prix: 1200, devise: 'CHF' },
      { sorte: 'note', texte: 'Autre', carnetId: vapeur.id, option: 'Une option jamais vue', etiquette: 'piste' }
    ] }, texte, { carnets: pourIAdeEtat(etat), depuis: vapeur.id })!;
    const r = poserSuiviIA(etat, { messageId: 'ZZ-IA-M-DEVIS', lignes: l, depuis: vapeur.id, le: LE, cibleDe: x => x.carnetId })!;
    const et = messageDe(appliquerEcritures(etat, r.ecritures), 'ZZ-IA-M-DEVIS').carnetMessage.etiquettes!;
    expect(et[0]).toEqual({ carnetId: vapeur.id, sorte: 'devis', montantCentimes: 120000, devise: 'CHF', optionId: OPTIONS_VAPEUR.hotte, origine: 'ia' });
    expect(et[1]).toEqual({ carnetId: vapeur.id, sorte: 'piste', texte: 'Une option jamais vue', origine: 'ia' });
  });

  it('un jeton déjà posé par le repli local n’est pas redoublé par l’IA', () => {
    const texte = 'Devis menuiserie 480 CHF';
    const vapeur = IDS_SUIVI.vapeur;
    const local = etiquettesDuRepli(texte, vapeur);
    const r0 = ok(ranger(ETAT, { message: { id: 'ZZ-IA-M-LOC', texte, le: LE, depuis: vapeur, rangement: 'locale', etiquettes: local }, lignes: [{ carnetId: vapeur, sorte: 'note', texte }] }));
    const etat = appliquerEcritures(ETAT, r0.ecritures);
    const l = garde({ lignes: [{ sorte: 'note', texte: 'Devis', carnetId: vapeur, etiquette: 'devis', prix: 480 }, { sorte: 'note', texte: 'Cause', carnetId: vapeur, etiquette: 'cause' }] }, texte, { carnets: pourIAdeEtat(etat), depuis: vapeur })!;
    const r = poserSuiviIA(etat, { messageId: 'ZZ-IA-M-LOC', lignes: l, depuis: vapeur, le: LE, cibleDe: x => x.carnetId })!;
    const et = messageDe(appliquerEcritures(etat, r.ecritures), 'ZZ-IA-M-LOC').carnetMessage.etiquettes!;
    expect(et.map(e => e.sorte)).toEqual(['devis', 'cause']);
  });

  it('C64-8 jusqu’au bout : écrit dans un carnet, un autre carnet visé reste intact et devient une carte « Rattacher à … ? »', () => {
    const texte = 'Siphon à changer avant jeudi';
    const ici = IDS_SUIVI.vapeur, ailleurs = IDS_SUIVI.ecoulement;
    const etat = avecMessage(ETAT, { id: 'ZZ-IA-M-RAT', texte, depuis: ici, lignes: [{ carnetId: ici, sorte: 'note', texte }] });
    const lignes = garde({ lignes: [{ sorte: 'note', texte: 'Siphon à changer', carnetId: ailleurs, genre: 'a-faire' }] }, texte, { carnets: pourIAdeEtat(etat), depuis: ici })!;
    expect(lignes[0]).toMatchObject({ carnetId: ici, carnetSuggere: ailleurs });
    const r = poserSuiviIA(etat, { messageId: 'ZZ-IA-M-RAT', lignes, depuis: ici, le: LE, cibleDe: l => l.carnetId })!;
    const apres = appliquerEcritures(etat, r.ecritures);
    expect(JSON.stringify(carnetDe(apres, ailleurs)), 'l’autre carnet n’est pas touché').toBe(JSON.stringify(carnetDe(etat, ailleurs)));
    expect(messageDe(apres, 'ZZ-IA-M-RAT').carnetMessage.propositionsSuivi).toEqual([{ sorte: 'deplacer', carnetId: ici, versCarnetId: ailleurs, origine: 'ia' }]);
    expect(messageDe(apres, 'ZZ-IA-M-RAT').carnetMessage.rattache, 'un message tapé dans un carnet n’est pas « rattaché »').toBeUndefined();
  });

  it('depuis la liste : la citation s’écrit sur le message (« rattaché : « … » »), une citation fausse jamais', () => {
    const texte = 'Le ferblantier passe jeudi\nsiphon à changer';
    const cible = IDS_SUIVI.ecoulement;
    const etat = avecMessage(ETAT, { id: 'ZZ-IA-M-LISTE', texte, depuis: 'liste', lignes: [{ carnetId: cible, sorte: 'note', texte }] });
    const lignes = garde({ lignes: [{ sorte: 'note', texte: 'Siphon à changer', carnetId: cible, citation: 'siphon à changer' }] }, texte, { carnets: pourIAdeEtat(etat), depuis: null })!;
    const r = poserSuiviIA(etat, { messageId: 'ZZ-IA-M-LISTE', lignes, depuis: null, le: LE, cibleDe: l => l.carnetId })!;
    expect(messageDe(appliquerEcritures(etat, r.ecritures), 'ZZ-IA-M-LISTE').carnetMessage.rattache).toEqual({ carnetId: cible, citation: 'siphon à changer' });
    const forge = ranger(etat, { message: { id: 'ZZ-IA-M-FORGE', texte, le: LE, depuis: 'liste', rangement: 'locale', rattache: { carnetId: cible, citation: 'une citation inventée' } }, lignes: [] });
    expect(forge.ok, 'le domaine refuse une citation hors du message').toBe(false);
  });
});

describe('MESSAGE-RESTE-DANS-SON-CARNET dans destinationDans (envoiRegles)', () => {
  const cs = lireCarnets(fixtureCarnets());
  const nomme = (t: string) => cs.find(c => c.title.includes(t))!;

  it('avec { resterIci }, la phrase reste dans l’ouvert et le carnet qu’elle nomme est proposé ; sans l’option, l’ancien calcul', () => {
    const frigo = nomme('Frigo'), evier = nomme('Évier');
    const t = 'évier 2 bacs pour laver les fûts';
    const avant = destinationDans(t, frigo, cs);
    const apres = destinationDans(t, frigo, cs, { resterIci: true });
    expect(avant.carnetId, 'l’ancien calcul annonce l’autre carnet').not.toBe(frigo.id);
    expect(apres).toEqual({ carnetId: frigo.id, titre: frigo.title, propose: { carnetId: evier.id, titre: evier.title } });
  });

  it('un objet sans carnet proche reste ici et ne propose rien (aucune carte « nouveau carnet »)', () => {
    const v = nomme('Ventilation');
    const t = 'tuyau silicone 8 mm, 5 m';
    expect(destinationDans(t, v, cs).carnetId).toBe(CARNET_NEUF);
    expect(destinationDans(t, v, cs, { resterIci: true })).toEqual({ carnetId: v.id, titre: v.title });
  });

  it('une phrase qui parle du carnet ouvert reste ici sans proposition', () => {
    const v = nomme('Ventilation');
    expect(destinationDans('Ventilation de la salle : un extracteur de plus', v, cs, { resterIci: true })).toEqual({ carnetId: v.id, titre: v.title });
  });
});

describe('mesure (L20) : longueur du contexte et de la sortie sur 5 messages simulés', () => {
  it('journal : taille du contexte, de la réponse simulée ; estimation du coût (estimé, jamais mesuré ici)', () => {
    const carnets = pourIAdeEtat(ETAT).map(c => ({ ...c }));
    const plus = pourIASuivi(lireCarnets(ETAT), lireMessages(ETAT));
    const riches = carnets.map(c => ({ ...c, ...plus.get(c.id) }));
    const messages = [
      'Le joint de la chambre froide fuit',
      'Devis du menuisier : 480 CHF, fournisseur contacté\nJoint adapté pas trouvé\nAppeler le fournisseur cette semaine',
      'Fête de la brasserie en juin, il faut une tireuse',
      'Assurance RC à renouveler',
      'truc à voir'
    ];
    const lignes: string[] = [];
    for (const texte of messages) {
      const ctx = contexteModele(texte, MAINTENANT, null, riches);
      const avec = JSON.stringify(ctx).length;
      const sans = JSON.stringify(contexteModele(texte, MAINTENANT, null, carnets)).length;
      const brut = reponseSimulee(ctx)!;
      const sortie = JSON.stringify(brut.lignes).length;
      lignes.push(`${JSON.stringify(texte.slice(0, 40))} contexte ${sans} -> ${avec} car. (+${avec - sans}), sortie simulée ${sortie} car., ${brut.lignes.length} ligne(s)`);
      expect(avec).toBeLessThan(sans + 30 * 3000);
      expect(brut.lignes.length).toBeLessThanOrEqual(12);
    }
    console.log(`MESURE-IA-SUIVI\n${lignes.join('\n')}`);
  });
});
