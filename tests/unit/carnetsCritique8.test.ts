/**
 * Critique 8 (18.11), correctif chirurgical : bloquants 1 à 4, chacun prouvé seul sur sa règle. IA simulée seulement.
 */
import { describe, expect, it } from 'vitest';
import { fixtureCarnets, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnets, lireMessages, type CarnetDoc } from '../../src/domain/carnets/modele';
import { appliquerEcritures, ranger } from '../../src/domain/carnets/operations';
import { tableau } from '../../src/domain/carnets/comparer';

const carnet = (items: ReturnType<typeof fixtureCarnets>, id: string): CarnetDoc => lireCarnets(items, { archives: true }).find(c => c.id === id)!;
const message = (texte: string, depuis: string) => ({ id: `ZZ-MSG-T-${texte.length}`, texte, le: '2026-11-18T10:00:00.000Z', depuis, rangement: 'simulee' as const });

describe('critique 8, n° 2 : un seuil s’ajoute au critère débit sans effacer les valeurs', () => {
  const PHRASE = 'hotte murale à 1 200 m³/h au moins';
  const apres = () => {
    const items = fixtureCarnets();
    const r = ranger(items, { message: message(PHRASE, ID_VENTILATION), lignes: [{
      carnetId: ID_VENTILATION, sorte: 'critere', texte: 'Hotte murale 1 200 m³/h au moins',
      caracteristique: { nom: 'hotte murale', unite: 'm³/h', sens: 'plus' }, origine: 'exemple', source: 'phrase'
    }] });
    expect(r.ok).toBe(true);
    return carnet(appliquerEcritures(items, (r as { ecritures: never[] }).ecritures), ID_VENTILATION);
  };
  it('avant : la colonne débit lit 1 800, 1 200, 1 500, 1 100', () => {
    const t = tableau(carnet(fixtureCarnets(), ID_VENTILATION))!;
    expect(t.lignes.map(l => l.cellules['débit']?.valeur).filter(v => v !== undefined).sort()).toEqual([1100, 1200, 1500, 1800]);
  });
  it('après : les valeurs restent, le critère garde le débit, le rang se recalcule sur elles', () => {
    const c = apres();
    const t = tableau(c)!;
    const debits = t.lignes.map(l => l.cellules['débit']?.valeur).filter(v => v !== undefined);
    expect(debits.sort()).toEqual([1100, 1200, 1500, 1800]);
    expect(t.rangeParNoms.join(' ')).toMatch(/débit/);
    expect(c.carnet.criteres.some(k => k.caracteristique?.nom === 'débit' && k.caracteristique.unite === 'm³/h')).toBe(true);
    expect(c.carnet.criteres.some(k => k.caracteristique?.nom === 'hotte murale')).toBe(false);
    /* la 120 cm (1 800 m³/h) n'est jamais « moins bien sur tout » que la 100 cm (1 200 m³/h) */
    const l120 = t.lignes.find(l => l.articleId === 'ZZ-V-A1')!;
    expect(l120.moinsBienPartout).toBe(false);
    const enLice = t.lignes.filter(l => l.rang !== null);
    expect(enLice[0].articleId).toBe('ZZ-V-A1');
    /* le seuil est lu : 1 100 m³/h est sous le minimum écrit, 1 500 et 1 800 ne le sont pas */
    expect(t.lignes.find(l => l.articleId === 'ZZ-V-A4')?.horsSeuil?.['débit']).toMatch(/^sous votre minimum de 1\s?200 m³\/h$/); /* tour 3, PCN-136 */
    expect(t.lignes.find(l => l.articleId === 'ZZ-V-A3')?.horsSeuil?.['débit']).toBeUndefined();
  });
});

describe('critique 8, n° 4 : après « Garder le plan sans ce carnet », À venir n’est plus contradictoire', () => {
  it('le plan du Frigo est « détaché », et le Frigo n’attend plus dans « Choisis, pas encore planifiés »', async () => {
    const { detacherPlan, lienDuPlan, choisisEnAttente } = await import('../../src/domain/carnets/operations');
    const { fixturePlans, ID_FRIGO } = await import('../../src/domain/carnets/fixture');
    const items = fixtureCarnets();
    const plans = fixturePlans();
    const plan = plans.find(p => p.upgrade?.sourceCarnetId === ID_FRIGO)!;
    expect(plan).toBeTruthy();
    const presents = () => new Set(lireCarnets(etat, { archives: true }).map(c => c.id));
    let etat = items;
    expect(lienDuPlan(plan, presents(), lireCarnets(etat, { archives: true }))).toBe('lie');
    const r = detacherPlan(etat, { carnetId: ID_FRIGO, plans });
    expect(r.ok).toBe(true);
    etat = appliquerEcritures(etat, (r as { ecritures: never[] }).ecritures);
    const docs = lireCarnets(etat, { archives: true });
    expect(lienDuPlan(plan, presents(), docs)).toBe('detache');
    expect(choisisEnAttente(docs, plans).map(c => c.id)).not.toContain(ID_FRIGO);
    /* l'ancienne règle de la liste le comptait encore : la contradiction vue en 49c */
    expect(docs.filter(c => c.carnet.choix && !c.carnet.sortie && !c.carnet.archive).map(c => c.id)).toContain(ID_FRIGO);
    /* supprimé : le carnet n'est plus là */
    expect(lienDuPlan(plan, new Set(), docs)).toBe('supprime');
  });
});

describe('critique 8, n° 1 : une phrase sur un autre objet ne devient jamais un critère du carnet ouvert', () => {
  it('règle locale : tuyau dans la Ventilation, évier dans le Frigo → carnet neuf titré par l’objet', async () => {
    const { destinationDans, autreObjet, CARNET_NEUF } = await import('../../src/ui/carnets/CarnetsVue');
    const { ID_FRIGO } = await import('../../src/domain/carnets/fixture');
    const cs = lireCarnets(fixtureCarnets());
    const v = cs.find(c => c.id === ID_VENTILATION)!, f = cs.find(c => c.id === ID_FRIGO)!;
    expect(destinationDans('tuyau silicone 8 mm, 5 m', v, cs)).toEqual({ carnetId: CARNET_NEUF, titre: 'Tuyau silicone' });
    const evier = destinationDans('évier 2 bacs pour laver les fûts', f, cs.filter(c => !/Évier/.test(c.title)));
    expect(evier.carnetId).toBe(CARNET_NEUF);
    expect(evier.titre).toMatch(/^Évier/);
    /* un carnet proche existe : le calcul brut le prend ; C65-1 (R47) : l'envoi ne l'écrit plus chez lui, il le propose (`propose`), le message reste ici */
    expect(destinationDans('évier 2 bacs pour laver les fûts', f, cs, { resterIci: false }).titre).toMatch(/Évier/);
    expect(destinationDans('évier 2 bacs pour laver les fûts', f, cs)).toMatchObject({ carnetId: f.id, propose: { titre: expect.stringMatching(/Évier/) } });
    /* les critères restent ici */
    for (const t of ['doit tenir 80 °C', '1 200 m³/h au moins', 'hotte murale à 1 200 m³/h au moins', 'Appeler le ferblantier'])
      expect(autreObjet(t, v)).toBeNull();
    expect(autreObjet('sol du local : résine qui tient la soude chaude', v)).toBe('Sol du local');
  });
});

describe('critique 8, n° 3 : un critère n’est jamais rangé en note', () => {
  it('règle locale : 80 °C, 1 200 m³/h au moins, fût de 30 L couché sont des critères', async () => {
    const { analyserLigne } = await import('../../src/domain/carnets/analyseLocale');
    for (const t of ['doit tenir 80 °C', '1 200 m³/h au moins', 'fût de 30 L couché']) expect(analyserLigne(t).sorte).toBe('critere');
  });
  it('note en vrac : une ligne annoncée critère que l’IA rend en note reste un critère', async () => {
    const { typerVrac } = await import('../../src/ui/carnets/CarnetsVue');
    expect(typerVrac({ sorte: 'note', genre: 'note', texte: 'Doit tenir 80 °C' }, 'critere', 'note').sorte).toBe('critere');
    expect(typerVrac({ sorte: 'note', genre: 'note', texte: '2 sachets' }, 'note', 'a-acheter').genre).toBe('a-acheter');
  });
  it('la consigne de la vraie IA le dit (Gemini jamais appelé)', async () => {
    const { RANGER_CARNET } = await import('../../functions/src/carnetIA');
    expect(RANGER_CARNET.system).toMatch(/doit tenir <température>/);
    expect(RANGER_CARNET.system).toMatch(/<débit> au\s+moins/);
    expect(RANGER_CARNET.system).toMatch(/AUTRE objet/);
    expect(RANGER_CARNET.system).toMatch(/Un objet d'une autre phrase n'est jamais un\s+critère du carnet ouvert/);
    /* décision du pilote (b) : des formes génériques, aucun nom d'objet (C2 de carnetsIAServeur) */
    expect(RANGER_CARNET.system).not.toMatch(/frigo|évier|hotte|tuyau|résine/i);
  });
});

describe('reprise chir8 : une pièce de l’appareil reste dans son carnet ; la note 390 range ses 3 lignes', () => {
  it('compresseur, filtre à air dans le Frigo, système isobarique dans l’Embouteillage : pas un autre objet', async () => {
    const { autreObjet } = await import('../../src/ui/carnets/CarnetsVue');
    const { ID_FRIGO, ID_EMBOUTEILLAGE } = await import('../../src/domain/carnets/fixture');
    const cs = lireCarnets(fixtureCarnets());
    const f = cs.find(c => c.id === ID_FRIGO)!, e = cs.find(c => c.id === ID_EMBOUTEILLAGE)!;
    for (const t of ['compresseur silencieux', 'filtre à air G4, 2 pièces', 'ZZ TEST — compresseur silencieux']) expect(autreObjet(t, f)).toBeNull();
    for (const t of ['système isobarique', 'système par gravité']) expect(autreObjet(t, e)).toBeNull();
    /* un équipement entier, lui, part : la pompe dans le Frigo */
    expect(autreObjet('pompe de transfert 1 800 L/h', f)).toBe('Pompe de transfert');
  });
  it('un critère déjà là (même texte) est un renvoi : il compte comme rangé, Annuler et remplacerRangement ne le retirent pas', async () => {
    const { remplacerRangement } = await import('../../src/domain/carnets/operations');
    const items = fixtureCarnets();
    const m = message('Pour la hotte : tient 80 °C', 'liste');
    const r = ranger(items, { message: m, lignes: [{ carnetId: ID_VENTILATION, sorte: 'critere', texte: 'tient 80 °C', origine: 'exemple' }] });
    expect(r.ok).toBe(true);
    const etat = appliquerEcritures(items, (r as { ecritures: never[] }).ecritures);
    const effets = lireMessages(etat).find(x => x.id === m.id)!.carnetMessage.effets;
    expect(effets).toEqual([{ carnetId: ID_VENTILATION, cible: 'critere', id: 'ZZ-V-K2', fusion: { texte: 'tient 80 °C', origine: 'ia' } }]);
    expect(carnet(etat, ID_VENTILATION).carnet.criteres.filter(k => k.texte === 'tient 80 °C')).toHaveLength(1);
    const r2 = remplacerRangement(etat, { messageId: m.id, lignes: [], rangement: 'simulee' });
    expect(r2.ok).toBe(true);
    const k2 = carnet(appliquerEcritures(etat, (r2 as { ecritures: never[] }).ecritures), ID_VENTILATION).carnet.criteres.find(k => k.id === 'ZZ-V-K2')!;
    expect(k2).toMatchObject({ texte: 'tient 80 °C', origine: 'ia' });
  });
  it('pendant : « tient 80 °C » s’annonce critère (pas « 3 notes ») ; le résumé compte les critères', async () => {
    const { resumeVrac } = await import('../../src/ui/carnets/NoteEnVrac');
    expect(resumeVrac([
      { id: '0', texte: 'tient 80 °C', genre: 'critere', carnetTitre: 'Ventilation' },
      { id: '1', texte: '1 800 m³/h', genre: 'critere', carnetTitre: 'Pompe', neuf: true },
      { id: '2', texte: '2 bacs de lavage', genre: 'note', carnetTitre: 'Évier' }
    ])).toBe('2 critères et 1 note, pas d\'achat');
  });
});
