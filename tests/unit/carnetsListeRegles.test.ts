/** D451, voie liste : les règles pures de la liste en arbre (listeRegles.ts) sur la fixture du suivi (« ZZ TEST — », tout est exemple). */
import { describe, expect, it } from 'vitest';
import { fixtureSuivi, IDS_SUIVI, MAINTENANT_SUIVI, ANNEE_SUIVI } from '../../src/domain/carnets/fixture';
import { lireCarnets, lireMessages, type CarnetDoc } from '../../src/domain/carnets/modele';
import { arbreDe, coupDOeil } from '../../src/domain/carnets/arbre';
import { appliquerEcritures } from '../../src/domain/carnets/operations';
import { carnetsAvecVeille, dernierPas, jaugeDe, ligneResolus, passeFiltre, rattacherContenu, resumeReplie, valeurUtile, deplacerLesLignesDuMessage } from '../../src/ui/carnets/listeRegles';

const items = fixtureSuivi();
const tous = lireCarnets(items, { archives: true });
const messages = lireMessages(items);
const maintenant = new Date(MAINTENANT_SUIVI);
const carnet = (id: string): CarnetDoc => tous.find(c => c.id === id)!;

describe('D451 liste : la jauge et le coup d’œil', () => {
  it('la jauge va de 1 (noté) à 4 (résolu)', () => {
    expect(['note', 'cherche', 'decide', 'resolu'].map(e => jaugeDe(e as never))).toEqual([1, 2, 3, 4]);
  });
  it('quatre cases, des comptes (0 est un compte)', () => {
    const c = coupDOeil(tous, ANNEE_SUIVI);
    expect(Object.keys(c).sort()).toEqual(['annee', 'cherche', 'decides', 'notes', 'resolus']);
    expect(c.cherche + c.decides + c.notes + c.resolus).toBeGreaterThan(0);
    const vide = coupDOeil([], ANNEE_SUIVI);
    expect([vide.cherche, vide.decides, vide.notes, vide.resolus]).toEqual([0, 0, 0, 0]);
  });
  it('un filtre garde un état de problème ; sans filtre, tout passe', () => {
    for (const c of tous) expect(passeFiltre(c, null)).toBe(true);
    const cherche = tous.filter(c => passeFiltre(c, 'cherche'));
    expect(cherche.length).toBe(coupDOeil(tous, ANNEE_SUIVI).cherche);
    expect(tous.filter(c => passeFiltre(c, 'resolu')).length).toBeGreaterThanOrEqual(coupDOeil(tous, ANNEE_SUIVI).resolus);
  });
});

describe('D451 liste : le dernier pas et la valeur utile', () => {
  it('décidé : l’option retenue ; je cherche : la prochaine tâche ; noté : la phrase citée', () => {
    expect(dernierPas(carnet(IDS_SUIVI.vapeur), messages, maintenant)).toMatch(/ondenseur B/);
    const eco = dernierPas(carnet(IDS_SUIVI.ecoulement), messages, maintenant);
    expect(eco).toBeTruthy();
    const note = dernierPas(carnet(IDS_SUIVI.moisissure), messages, maintenant);
    expect(note === null || /^« .+ »$/.test(note)).toBe(true);
  });
  it('un dernier pas n’est jamais inventé : un carnet sans écriture n’en dit pas', () => {
    const nu = { ...carnet(IDS_SUIVI.fete), carnet: { ...carnet(IDS_SUIVI.fete).carnet, taches: [], notes: [], facons: [], articles: [], choix: undefined } } as CarnetDoc;
    expect(dernierPas(nu, [], maintenant)).toBeNull();
  });
  it('une idée sans prix ni date : rien, jamais 0', () => {
    const idee = { ...carnet(IDS_SUIVI.fete), carnet: { ...carnet(IDS_SUIVI.fete).carnet, articles: [], facons: [], choix: undefined, sortie: undefined }, date: undefined } as CarnetDoc;
    const v = valeurUtile(idee, maintenant);
    expect(v === null || !/\b0\b/.test(v)).toBe(true);
  });
  it('un carnet d’achat dit « à comparer » ou « choisi », avec l’unité, jamais « dès »', () => {
    const achats = tous.filter(c => c.carnet.articles.length >= 2);
    for (const c of achats) { const v = valeurUtile(c, maintenant); if (v) expect(v).not.toMatch(/dès/); }
  });
});

describe('D451 liste : l’arbre, les sous-domaines repliés, les résolus', () => {
  const arbre = arbreDe(tous);
  it('un sous-domaine replié se résume en titres (deux au plus, puis +n)', () => {
    for (const n of arbre.domaines) for (const g of n.groupes) {
      const t = resumeReplie(g, maintenant);
      expect(t.length).toBeGreaterThan(0);
      if (g.carnets.length > 2) expect(t).toMatch(/\+\d+$/);
    }
  });
  it('les résolus se disent en titre et jour', () => {
    const r = arbre.resolus[0];
    expect(r).toBeTruthy();
    expect(ligneResolus(r.carnets)).toMatch(/\d/);
  });
  it('la cloche ne compte que les carnets où une veille est demandée', () => {
    for (const c of carnetsAvecVeille(tous)) expect(c.carnet.facons.some(f => f.suivi?.etat === 'veille') || c.carnet.articles.some(a => a.veille?.active)).toBe(true);
  });
  it('cas neufs : fête, assurance et photo seule ont leur place (domaine ou À ranger), aucun n’est perdu', () => {
    const vus = new Set([...arbre.domaines.flatMap(n => [...n.ouverts, ...n.groupes.flatMap(g => g.carnets)]), ...arbre.aRanger, ...arbre.resolus.flatMap(r => r.carnets)].map(c => c.id));
    for (const c of tous) expect(vus.has(c.id), c.title).toBe(true);
    expect(arbre.aRanger.some(c => c.id === IDS_SUIVI.photo)).toBe(true);
  });
});

describe('D451 liste : rattacher (un geste, un Annuler)', () => {
  it('le contenu du carnet à ranger passe dans l’autre carnet, le carnet vide part ; l’inverse rend tout', () => {
    const r = rattacherContenu(items, { depuis: IDS_SUIVI.photo, vers: IDS_SUIVI.ecoulement });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const apres = lireCarnets(appliquerEcritures(items, r.ecritures), { archives: true });
    expect(apres.some(c => c.id === IDS_SUIVI.photo)).toBe(false);
    const avant = carnet(IDS_SUIVI.ecoulement).carnet.photos.length + carnet(IDS_SUIVI.photo).carnet.photos.length;
    expect(apres.find(c => c.id === IDS_SUIVI.ecoulement)!.carnet.photos.length).toBe(avant);
    const retour = lireCarnets(appliquerEcritures(appliquerEcritures(items, r.ecritures), r.inverse), { archives: true });
    expect(retour.find(c => c.id === IDS_SUIVI.photo)?.carnet.photos.length).toBe(carnet(IDS_SUIVI.photo).carnet.photos.length);
    expect(retour.find(c => c.id === IDS_SUIVI.ecoulement)!.carnet.photos.length).toBe(carnet(IDS_SUIVI.ecoulement).carnet.photos.length);
  });
  it('refus dits, rien d’écrit : même carnet, carnet absent', () => {
    expect(rattacherContenu(items, { depuis: IDS_SUIVI.photo, vers: IDS_SUIVI.photo }).ok).toBe(false);
    expect(rattacherContenu(items, { depuis: 'absent', vers: IDS_SUIVI.photo }).ok).toBe(false);
  });
  it('« Rattacher à … ? » ne déplace que les lignes de CE message ; sans ligne, refus dit', () => {
    const m = messages.find(x => x.carnetMessage.effets.some(e => e.carnetId === IDS_SUIVI.fusible && e.cible === 'note'));
    expect(m).toBeTruthy();
    const r = deplacerLesLignesDuMessage(items, { messageId: m!.id, depuis: IDS_SUIVI.fusible, vers: IDS_SUIVI.ecoulement });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const apres = lireCarnets(appliquerEcritures(items, r.ecritures), { archives: true });
      expect(apres.find(c => c.id === IDS_SUIVI.fusible)).toBeTruthy();
      expect(apres.find(c => c.id === IDS_SUIVI.ecoulement)!.carnet.notes.length).toBeGreaterThan(carnet(IDS_SUIVI.ecoulement).carnet.notes.length);
    }
    expect(deplacerLesLignesDuMessage(items, { messageId: m!.id, depuis: IDS_SUIVI.vapeur, vers: IDS_SUIVI.ecoulement }).ok).toBe(false);
  });
});
