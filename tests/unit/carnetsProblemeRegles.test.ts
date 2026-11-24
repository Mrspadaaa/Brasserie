// D451 (voie probleme) : les règles d'affichage du fil et du suivi (src/ui/carnets/filRegles.ts). Fixture du suivi (tout est exemple) et cas neufs
// (fête, assurance, chambre froide, joint torique) : aucune règle n'est taillée sur vapeur, écoulement ou condenseur (B23).
import { describe, expect, it } from 'vitest';
import { fixtureSuivi, IDS_SUIVI, MAINTENANT_SUIVI, OPTIONS_VAPEUR } from '../../src/domain/carnets/fixture';
import { lireCarnets, lireMessage, type CarnetDoc, type Etiquette, type MessageDoc } from '../../src/domain/carnets/modele';
import { appliquerEcritures } from '../../src/domain/carnets/operations';
import { fermerParAchat } from '../../src/domain/carnets/suivi';
import { filDe } from '../../src/domain/carnets/fil';
import {
  achatConstate, chercherResolus, cheminAffiche, deNom, destinationPlan, ficheResolu, heureDe, jetonDe, libelleJour, libellePlage, libelleRepli, nomsDistincts,
  optionsFermees, parCategorie, plagesDe, questionPourquoi, rangsEcart, resolusDe, resumeJetons, texteDuree, texteFermeture, texteMontant
} from '../../src/ui/carnets/filRegles';
import { semaineIso, texteGenre, versQuand } from '../../src/ui/carnets/EnTeteGenre';

const items = () => fixtureSuivi();
const carnets = (it = items()): CarnetDoc[] => lireCarnets(it);
const messages = (it = items()): MessageDoc[] => it.map(lireMessage).filter((m): m is MessageDoc => !!m);
const par = (id: string, it = items()) => carnets(it).find(c => c.id === id)!;
const resoluVapeur = () => {
  const it = items();
  const r = fermerParAchat(it, { carnetId: IDS_SUIVI.vapeur, le: '2026-11-30T09:00:00.000Z', optionId: OPTIONS_VAPEUR.condB });
  if (!r.ok) throw new Error(r.raison);
  return appliquerEcritures(it, r.ecritures);
};

describe('jours, plages et repli du fil', () => {
  it('un jour se dit « 8 nov. » ; une autre année se dit, jamais deux années confondues', () => {
    expect(libelleJour('2026-11-08', 2026)).toBe('8 nov.');
    expect(libelleJour('2025-12-21', 2026)).toBe('21 déc. 2025');
    expect(libelleJour('2025-12-21')).toBe('21 déc.');
  });
  it('plages : « 21 – 22 nov. », « 30 nov. – 2 déc. », un jour seul', () => {
    expect(libellePlage('2026-11-21', '2026-11-22', 2026)).toBe('21 – 22 nov.');
    expect(libellePlage('2026-11-30', '2026-12-02', 2026)).toBe('30 nov. – 2 déc.');
    expect(libellePlage('2026-11-08', '2026-11-08', 2026)).toBe('8 nov.');
  });
  it('deux jours séparés d\'un jour au plus se joignent ; un écart plus grand garde sa pastille', () => {
    const f = filDe(par(IDS_SUIVI.vapeur), messages());
    const plages = plagesDe(f.jours);
    const libs = plages.map(p => libellePlage(p.du, p.au, 2026));
    expect(libs).toContain('20 – 22 nov.'); /* 20, 21 et 22 se suivent : une seule plage */
    expect(libs).toContain('12 nov.');
    expect(libs).toContain('8 nov.');
    expect(plages.reduce((s, p) => s + p.entrees.length, 0)).toBe(f.jours.reduce((s, j) => s + j.entrees.length, 0));
  });
  it('repli : « ▴ 4 notes du 3 au 6 nov. », deux mois, un seul jour, un pluriel juste', () => {
    expect(libelleRepli({ n: 4, du: '2026-11-03', au: '2026-11-06', jours: [] }, 2026)).toBe('▴ 4 notes du 3 au 6 nov.');
    expect(libelleRepli({ n: 3, du: '2026-10-30', au: '2026-11-06', jours: [] })).toBe('▴ 3 notes du 30 oct. au 6 nov.');
    expect(libelleRepli({ n: 3, du: '2026-11-03', au: '2026-11-03', jours: [] }, 2026)).toBe('▴ 3 notes du 3 nov.');
  });
  it('l\'heure : seulement si l\'instant en porte une', () => {
    expect(heureDe('2026-11-08')).toBeNull();
    expect(heureDe('2026-11-08T10:42:00')).toBe('10:42');
  });
});

describe('jetons sous une bulle', () => {
  const options = new Map(par(IDS_SUIVI.vapeur).carnet.facons.map(f => [f.id, f] as const));
  const e = (x: Partial<Etiquette>): Etiquette => ({ carnetId: 'C', sorte: 'piste', origine: 'ia', ...x });
  it('« écarté, 2e fois » vient du rang dans l\'ordre du temps, jamais d\'un compteur stocké', () => {
    const m = messages();
    const rangs = rangsEcart(m, IDS_SUIVI.vapeur);
    expect([...rangs.values()].sort()).toEqual([1, 2]);
    const dernier = m.find(x => x.id === 'ZZ-SV-M10')!;
    const i = (dernier.carnetMessage.etiquettes ?? []).findIndex(x => x.sorte === 'ecart');
    const j = jetonDe(dernier.carnetMessage.etiquettes![i], options, rangs.get(`${dernier.id}:${i}`));
    expect(j.texte).toBe('Humidificateur écarté, 2e fois');
    expect(j.classe).toBe('ecart');
  });
  it('un montant écrit se dit avec sa devise et son « ≈ » ; absent : le mot, jamais 0', () => {
    expect(texteMontant({ montantCentimes: 85000, devise: 'CHF' })).toBe('850 CHF');
    expect(texteMontant({ montantCentimes: 6000, estime: true })).toBe('≈ 60 CHF');
    expect(texteMontant({ montantCentimes: 123456, devise: 'EUR' })).toBe('1 234,56 EUR');
    expect(texteMontant({})).toBeNull();
    expect(jetonDe(e({ sorte: 'devis' }), new Map()).texte).toBe('devis');
    expect(jetonDe(e({ sorte: 'cout', montantCentimes: 54000 }), new Map()).texte).toBe('540 CHF');
    expect(jetonDe(e({ sorte: 'achat', montantCentimes: 54000 }), new Map()).texte).toBe('achat 540 CHF');
  });
  it('le texte dit par l\'étiquette est gardé tel quel (contact, veille)', () => {
    expect(jetonDe(e({ sorte: 'contact', texte: 'gérance' }), new Map())).toEqual({ classe: 'contact', texte: 'gérance' });
    expect(jetonDe(e({ sorte: 'veille', texte: 'veille 3 jours' }), new Map()).texte).toBe('veille 3 jours');
    expect(jetonDe(e({ sorte: 'pas-trouve' }), new Map())).toEqual({ classe: 'pas', texte: 'pas trouvé' });
  });
});

describe('la rangée de jetons du diagnostic', () => {
  it('trouvé, pas trouvé, devis, et le total « ≈ » des coûts connus seulement', () => {
    const r = resumeJetons(messages(), IDS_SUIVI.ecoulement)!;
    expect(r.trouve).toBe(2); /* « cause » et « trouvé » */
    expect(r.pasTrouve).toBe(2);
    expect(r.devis).toEqual({ n: 1, centimes: 85000 });
    expect(r.total).toEqual({ centimes: 91000, n: 2 });
  });
  it('rien de compté : pas de rangée ; un seul montant : pas de total (il redirait le devis)', () => {
    expect(resumeJetons([], 'X')).toBeNull();
    const seul: MessageDoc = { id: 'M', type: 'carnet-message', title: 't', status: 'done', carnetMessage: { texte: 't', le: '2026-11-02T10:00:00.000Z', depuis: 'C', rangement: 'brut', effets: [], etiquettes: [{ carnetId: 'C', sorte: 'devis', montantCentimes: 12000, origine: 'ia' }] } } as never;
    const r = resumeJetons([seul], 'C')!;
    expect(r.total).toBeNull();
    expect(r.devis).toEqual({ n: 1, centimes: 12000 });
  });
  it('un montant en euros n\'entre pas dans le total en francs (rien n\'est converti en silence)', () => {
    const mk = (id: string, e: Partial<Etiquette>): MessageDoc => ({ id, type: 'carnet-message', title: 't', status: 'done', carnetMessage: { texte: 't', le: '2026-11-02T10:00:00.000Z', depuis: 'C', rangement: 'brut', effets: [], etiquettes: [{ carnetId: 'C', sorte: 'cout', origine: 'ia', ...e }] } }) as never;
    const r = resumeJetons([mk('A', { montantCentimes: 1000 }), mk('B', { montantCentimes: 2000, devise: 'EUR' }), mk('C2', { montantCentimes: 500 })], 'C')!;
    expect(r.total).toEqual({ centimes: 1500, n: 2 });
  });
  it('un devis sans montant ne devient pas « devis 0 »', () => {
    const m: MessageDoc = { id: 'M', type: 'carnet-message', title: 't', status: 'done', carnetMessage: { texte: 't', le: '2026-11-02T10:00:00.000Z', depuis: 'C', rangement: 'brut', effets: [], etiquettes: [{ carnetId: 'C', sorte: 'devis', origine: 'ia' }, { carnetId: 'C', sorte: 'devis', origine: 'ia' }] } } as never;
    const r = resumeJetons([m], 'C')!;
    expect(r.devis).toEqual({ n: 2 });
    expect(r.total).toBeNull();
  });
});

describe('noms courts, question honnête, article', () => {
  it('le préfixe commun tombe s\'il reste quelque chose ; sinon les noms entiers (cas neufs)', () => {
    expect(nomsDistincts('Condenseur B', 'Condenseur A')).toEqual(['B', 'A']);
    expect(nomsDistincts('Frigo + congélateur', 'Frigo seul')).toEqual(['+ congélateur', 'seul']);
    expect(nomsDistincts('Chambre froide', 'Frigo')).toEqual(['Chambre froide', 'Frigo']);
    expect(nomsDistincts('Cuve', 'Cuve')).toEqual(['Cuve', 'Cuve']);
  });
  it('la question « pourquoi » : seulement sans citation de ses notes ; ses mots cités sinon', () => {
    const c = par(IDS_SUIVI.vapeur);
    expect(questionPourquoi(c, messages())).toBeNull(); /* ses notes disent « je le prends fin du mois » */
    expect(questionPourquoi(c, [])?.titre).toBe('Pourquoi B plutôt que A ?');
    expect(questionPourquoi(c, [])?.amorce).toBe('Pourquoi B plutôt que A : ');
  });
  it('une seule option retenue, aucune autre : « Pourquoi La garder ? » ; aucune retenue : pas de question', () => {
    const a = par(IDS_SUIVI.assurance);
    expect(questionPourquoi(a, [])?.titre).toBe('Pourquoi La garder ?');
    expect(questionPourquoi(par(IDS_SUIVI.ecoulement), [])).toBeNull();
  });
  it('le nom d\'une option se cite entre guillemets : aucun article deviné (« de la condenseur »), ses mots jamais réécrits', () => {
    expect(deNom('Condenseur B')).toBe('de « Condenseur B »');
    expect(deNom(' Chambre froide ')).toBe('de « Chambre froide »');
    expect(deNom('Assurance RC')).toBe('de « Assurance RC »');
  });
});

describe('Résolu', () => {
  it('« en 27 jours » ; zéro : « le jour même » ; inconnu : rien, jamais « 0 jour »', () => {
    expect(texteDuree(27)).toBe('en 27 jours');
    expect(texteDuree(1)).toBe('en 1 jour');
    expect(texteDuree(0)).toBe('le jour même');
    expect(texteDuree(null)).toBeNull();
  });
  it('fermé par l\'achat : « Fermé grâce à l\'achat de « Condenseur B ». » ; les options fermées disent leur raison, en mot d\'état', () => {
    const it = resoluVapeur();
    const c = par(IDS_SUIVI.vapeur, it);
    expect(texteFermeture(c)).toBe('Fermé grâce à l\'achat de « Condenseur B ».');
    const f = optionsFermees(c, 2026);
    const dit = Object.fromEntries(f.map(o => [o.nom, o.texte]));
    expect(dit['Condenseur A']).toBe('pas pris');
    expect(dit['Hotte + extracteur']).toBe('pas pris'); /* un mot d'état, jamais accordé (comme « retenu », « écarté ») */
    expect(dit['Humidificateur']).toBe('non, 22 nov. · 2e fois');
    expect(f.find(o => o.nom === 'Condenseur B')).toBeUndefined();
  });
  it('sans cause dite, rien n\'est dit', () => {
    expect(texteFermeture(par(IDS_SUIVI.vapeur))).toBeNull();
  });
  it('« ira dans Réalisés » seulement si un plan est lié', () => {
    expect(destinationPlan([])).toBeNull();
    expect(destinationPlan(undefined)).toBeNull();
    expect(destinationPlan([{ sorte: 'a-venir', id: 'P', libelle: 'x', etat: 'present' }])).toBe('ira');
    expect(destinationPlan([{ sorte: 'realise', id: 'P', libelle: 'x', etat: 'present' }])).toBe('est');
    expect(destinationPlan([{ sorte: 'a-venir', id: 'P', libelle: 'x', etat: 'supprime' }])).toBeNull();
  });
  it('les tuiles de l\'année : du plus ancien au plus récent, le dernier marqué ; une autre année n\'y est pas', () => {
    const it = resoluVapeur();
    const { tuiles } = resolusDe(carnets(it), messages(it), 2026);
    expect(tuiles.map(t => t.id)).toEqual([IDS_SUIVI.pompe, IDS_SUIVI.joint, IDS_SUIVI.vapeur].filter(id => tuiles.some(t => t.id === id)));
    expect(tuiles[tuiles.length - 1].id).toBe(IDS_SUIVI.vapeur);
    expect(tuiles.filter(t => t.dernier)).toHaveLength(1);
    expect(resolusDe(carnets(it), messages(it), 2019).tuiles).toEqual([]);
  });
  it('une tuile sans photo n\'a pas de jpeg (le composant montre le picto de la catégorie)', () => {
    const { tuiles } = resolusDe(carnets(), messages(), 2026);
    const sans = tuiles.find(t => t.id === IDS_SUIVI.joint);
    expect(sans?.jpeg).toBeUndefined();
  });
  it('« Fermer grâce à l\'achat ? » seulement si le fil ou le plan dit l\'achat de l\'option retenue', () => {
    const c = par(IDS_SUIVI.vapeur);
    expect(achatConstate(c, messages())).toBeNull();
    expect(achatConstate(c, messages(), true)?.id).toBe(OPTIONS_VAPEUR.condB);
    const it = resoluVapeur();
    expect(achatConstate(par(IDS_SUIVI.vapeur, it), messages(it), true)).toBeNull(); /* déjà résolu */
  });
});

describe('Relecture', () => {
  it('la fiche vient de ses notes : problème, essayé, pris, pourquoi cité mot pour mot, durée', () => {
    const it = resoluVapeur();
    const f = ficheResolu(par(IDS_SUIVI.vapeur, it), messages(it));
    expect(f.probleme).toMatch(/buée au plafond/);
    expect(f.essaye.join(' ')).toMatch(/humidificateur \(non, 2 fois\)/);
    expect(f.pris?.nom).toBe('condenseur B');
    expect(f.pris?.prix).toBe('540 CHF');
    expect(f.pris?.jour).toBe('30 nov. 2026');
    expect(f.pourquoi?.length).toBeGreaterThan(0);
    for (const p of f.pourquoi ?? []) expect(messages(it).some(m => m.carnetMessage.texte.includes(p.texte))).toBe(true);
    expect(f.duree).toMatch(/^27 jours · \d+ notes? · 2 photos$/);
    expect(f.chemin).toBe('Brasserie › Brassage › Vapeur');
  });
  it('sans citation, la fiche dit que ses notes ne le disent pas (null), rien n\'est inventé', () => {
    const it = resoluVapeur();
    expect(ficheResolu(par(IDS_SUIVI.vapeur, it), []).pourquoi).toBeNull();
  });
  it('la recherche plie les accents et la casse ; plusieurs mots se cumulent ; vide : tous', () => {
    const it = resoluVapeur();
    const r = carnets(it).filter(c => [IDS_SUIVI.vapeur, IDS_SUIVI.pompe, IDS_SUIVI.joint].includes(c.id as never));
    expect(chercherResolus(r, messages(it), 'VAPEUR').map(c => c.id)).toEqual([IDS_SUIVI.vapeur]);
    expect(chercherResolus(r, messages(it), 'buee').map(c => c.id)).toEqual([IDS_SUIVI.vapeur]);
    expect(chercherResolus(r, messages(it), 'vapeur zzz')).toEqual([]);
    expect(chercherResolus(r, messages(it), '  ')).toHaveLength(r.length);
  });
  it('les autres résolus par catégorie : le chemin affiché, jamais vide', () => {
    const g = parCategorie(carnets().filter(c => [IDS_SUIVI.pompe, IDS_SUIVI.joint].includes(c.id as never)));
    expect(g.length).toBeGreaterThan(0);
    for (const x of g) { expect(x.chemin.length).toBeGreaterThan(0); expect(x.carnets.length).toBeGreaterThan(0); }
    expect(cheminAffiche(par(IDS_SUIVI.photo))).toBe('À ranger');
  });
});

describe('en-tête du genre', () => {
  it('semaine ISO et mois ; une date absente ne s\'invente pas', () => {
    expect(semaineIso('2026-03-02')).toBe(10);
    expect(semaineIso('2027-01-01')).toBe(53);
    expect(versQuand('2026-03-02', 'semaine')).toBe('vers S10');
    expect(versQuand('2026-03-02', 'mois')).toBe('vers mars');
    expect(versQuand(undefined)).toBeNull();
  });
  it('mémo : « fait le » seulement si résolu ; idée : « vers … » seulement si datée ; problème : pas de puce', () => {
    expect(texteGenre(par(IDS_SUIVI.assurance))).toBe('mémo');
    expect(texteGenre(par(IDS_SUIVI.fete))).toBe('idée');
    expect(texteGenre({ ...par(IDS_SUIVI.fete), date: '2027-03-01', precision: 'semaine' } as CarnetDoc)).toMatch(/^idée · vers S\d+$/);
    expect(texteGenre(par(IDS_SUIVI.vapeur))).toBeNull();
  });
});

describe('contexte', () => {
  it('la date du jour de la fixture est un mardi de novembre 2026', () => {
    expect(MAINTENANT_SUIVI.slice(0, 7)).toBe('2026-11');
  });
});
