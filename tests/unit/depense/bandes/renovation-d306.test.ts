// Voie r1-renovation (D306) : la famille « Rénovation » et ses sept sous-familles. Une pièce de travaux INVENTÉE (aucune désignation d'une vraie pièce), en français,
// allemand, anglais et italien, lue `other` puis `equipment` (les deux lectures de la mesure du 02.11) : aucune ligne en « Autres » ni en « Matériel de brassage ».
import { describe, expect, it } from 'vitest';
import { NOMS_FAMILLES, ORDRE_FAMILLES, SOUS_FAMILLES_RENOVATION, familleDe, sousFamilleDe, type SousFamilleRenovation } from '../../../../src/ui/depense/familles';
import { avecUnitesDeduites } from '../../../../src/ui/depense/rangees';
import { famille } from './aide';

const PEINTURE = 'Peinture et sols', OUTILLAGE = 'Outillage', QUINCAILLERIE = 'Quincaillerie', ELECTRICITE = 'Électricité', PLOMBERIE = 'Plomberie', PROTECTION = 'Protection', DIVERS = 'Divers travaux';
/** [désignation inventée, sous-famille attendue] — le port est à part. */
const PIECE: Array<[string, SousFamilleRenovation]> = [
  ['Peinture murale blanche mate 10 L', PEINTURE], ['Vitrificateur parquet satiné 2.5 L', PEINTURE], ['Lasure bois chêne 1 L', PEINTURE], ['Enduit de lissage 5 kg', PEINTURE],
  ['Pinceau plat 50 mm', PEINTURE], ['Rouleau à peinture 18 cm', PEINTURE], ['Bac à peinture', PEINTURE], ['Ruban de masquage 50 m', PEINTURE], ['Carrelage grès 30 x 30', PEINTURE],
  ['Wandfarbe weiss 5 L', PEINTURE], ['Fliesenkleber 5 kg', PEINTURE], ['Klarlack seidenmatt', PEINTURE], ['Malerkrepp 50 m', PEINTURE],
  ['Wood varnish 1 L', PEINTURE], ['Grout grey 2 kg', PEINTURE], ['Masking tape 36 mm', PEINTURE],
  ['Vernice per parquet 2 L', PEINTURE], ['Pennello piatto 40 mm', PEINTURE], ['Sigillante bianco', PEINTURE],
  ['Ponceuse excentrique 125 mm', OUTILLAGE], ['Abrasif grain 80 (10)', OUTILLAGE], ['Papier de verre assortiment', OUTILLAGE], ['Schleifpapier K80', OUTILLAGE], ['Akkuschrauber 12 V', OUTILLAGE],
  ['Sandpaper assortment 40-120', OUTILLAGE], ['Screwdriver set', OUTILLAGE], ['Levigatrice orbitale', OUTILLAGE], ['Cacciavite a croce', OUTILLAGE],
  ['Cheville à frapper 8 mm (50)', QUINCAILLERIE], ['Vis à bois 4 x 40 (200)', QUINCAILLERIE], ['Dübel 8 mm, 50 Stück', QUINCAILLERIE], ['Holzschrauben 4 x 40', QUINCAILLERIE],
  ['Hinges 2 pcs', QUINCAILLERIE], ['Wallplug 8 mm', QUINCAILLERIE], ['Viti per legno 4 x 40', QUINCAILLERIE], ['Tasselli 8 mm', QUINCAILLERIE],
  ['Interrupteur va-et-vient blanc', ELECTRICITE], ['Prise de courant 2P+T', ELECTRICITE], ['Gaine ICTA 20 mm', ELECTRICITE], ['Steckdose Aufputz', ELECTRICITE], ['Lichtschalter weiss', ELECTRICITE],
  ['LED bulb 10 W', ELECTRICITE], ['Presa di corrente da incasso', ELECTRICITE], ['Interruttore bipolare', ELECTRICITE],
  ['Mitigeur lavabo chromé', PLOMBERIE], ['Ruban téflon', PLOMBERIE], ['Wasserhahn Küche', PLOMBERIE], ['Waschbecken weiss', PLOMBERIE], ['Plumbing sealant tape', PLOMBERIE], ['Rubinetto bagno', PLOMBERIE],
  ['Gants nitrile M', PROTECTION], ['Masque anti-poussière FFP2', PROTECTION], ['Combinaison jetable', PROTECTION], ['Schutzbrille klar', PROTECTION], ['Work gloves L', PROTECTION], ['Guanti da lavoro', PROTECTION],
  ['Étagère murale bois 80 cm', DIVERS], ['Lampenschirm', DIVERS],
  // (a) les tickets abrègent : un jeton d'au moins 6 lettres, début d'un mot de la liste, vaut ce mot (4 langues)
  ['Vitrific. parquet 2.5 L', PEINTURE], ['Carrelag. mural blanc', PEINTURE], ['Pennel. plat 50 mm', PEINTURE], ['Wandfar. weiss 5 L', PEINTURE], ['Interrupt. double', ELECTRICITE], ['Mitigeu. lavabo', PLOMBERIE],
  ['Protect. oculaire', PROTECTION], ['Protezione udito', PROTECTION], ['Abrasi. grain 120', OUTILLAGE],
  // (b) protections du corps
  ['Protège-genoux mousse', PROTECTION], ['Genouillères pro', PROTECTION], ['Knieschoner Gel', PROTECTION], ['Knee pads', PROTECTION], ['Ginocchiere da lavoro', PROTECTION],
  // (c) mélangeurs : ambigus (sous Local), à peinture : outil
  ['Mélangeur 1200 W', OUTILLAGE], ['Malaxeur 1600 W', OUTILLAGE], ['Turbine à peinture', OUTILLAGE], ['Mélangeur peinture 120 mm', OUTILLAGE], ['Rührquirl 120 mm', OUTILLAGE], ['Paint mixer', OUTILLAGE], ['Miscelatore 1200 W', OUTILLAGE],
  // (d) grattoirs ; une lame seule est ambiguë
  ['Grattoir 100 mm', OUTILLAGE], ['Racloir carbure', OUTILLAGE], ['Raclette', OUTILLAGE], ['Lame de grattage', OUTILLAGE], ['Schaber breit', OUTILLAGE], ['Spachtelklinge 100 mm', OUTILLAGE], ['Scraper 4 in', OUTILLAGE], ['Raschietto', OUTILLAGE],
];

describe('D306 — l’ordre et le nom de la famille', () => {
  it('« Rénovation » vient après Consommables et avant Services', () => {
    expect([...ORDRE_FAMILLES]).toEqual(['malt', 'houblon', 'levure', 'sucre', 'additif', 'materiel', 'emballage', 'nettoyage', 'consommable', 'renovation', 'service', 'autres']);
    expect(NOMS_FAMILLES.renovation).toBe('Rénovation');
  });
  it('sept sous-familles, dans l’ordre d’affichage de D306', () => {
    expect([...SOUS_FAMILLES_RENOVATION]).toEqual([PEINTURE, OUTILLAGE, QUINCAILLERIE, ELECTRICITE, PLOMBERIE, PROTECTION, DIVERS]);
  });
});

describe('D306 — une pièce de travaux inventée, sous « Local » (renovation) : aucune ligne en « Autres » ni en « Matériel de brassage »', () => {
  for (const kind of ['other', 'equipment', 'stock', 'unknown', 'maintenance']) {
    it(`lue « ${kind} » : chaque ligne est en Rénovation, dans la sous-famille attendue`, () => {
      const ecarts = PIECE.flatMap(([nom, sous]) => {
        const f = famille(nom, kind, '', '', undefined, 'renovation');
        const s = sousFamilleDe(f, { nom, kind, categorie: 'renovation' });
        return f === 'renovation' && s === sous ? [] : [`${nom} → ${f} / ${s} (attendu ${sous})`];
      });
      expect(ecarts).toEqual([]);
    });
  }
  it('le port reste hors de la Rénovation ; une remise aussi ; un service sans mot de service est de la Rénovation, « Analyse » reste un service', () => {
    expect(famille('Versand / Port', 'shipping', '', '', undefined, 'renovation')).toBe('autres');
    expect(famille('Rabatt', 'discount', '', '', undefined, 'renovation')).toBe('autres');
    expect(famille('Pose du carrelage', 'service', '', '', undefined, 'renovation')).toBe('renovation');
    expect(famille('Analyse Wasserprobe', 'service', '', '', undefined, 'renovation')).toBe('service');
    expect(famille('Analyse Wasserprobe', 'service')).toBe('service');
  });
  it('l’EPI lu en catégorie de stock est en Rénovation › Protection sous Local, Consommable ailleurs', () => {
    expect(famille('Gants nitrile M', 'stock', 'EPI', '', undefined, 'renovation')).toBe('renovation');
    expect(sousFamilleDe('renovation', { nom: 'Article X', stockCategory: 'EPI', categorie: 'renovation' })).toBe(PROTECTION);
    expect(famille('Gants nitrile M', 'stock', 'EPI')).toBe('consommable');
    expect(famille('Gants nitrile M', 'stock', 'EPI', '', undefined, 'brassage')).toBe('consommable');
  });
  it('sous Local, un mot PRÉCIS du brassage garde la main : cuve, fermenteur, spider, sacs + filtres, tank restent du Matériel', () => {
    for (const nom of ['Hop Spider Bag', 'Hop Filter Bag', 'Fermzilla 27 L', 'Cuve 30 L avec couvercle', 'Gärtank', 'Unitank 60 L', 'Hopfensack fein', 'Ruban de téflon pour robinet de cuve', 'Plattenkühler']) {
      for (const kind of ['equipment', 'other', 'stock']) expect(famille(nom, kind, '', '', undefined, 'renovation'), `${nom} / ${kind}`).toBe('materiel');
    }
    // … tandis que le mot ambigu seul, ou avec un mot de travaux, va en Rénovation
    for (const nom of ['Ruban de téflon pour robinet', 'Tuyau silicone 8 mm', 'Silikonschlauch 8 mm', 'Joint plat']) expect(famille(nom, 'equipment', '', '', undefined, 'renovation'), nom).toBe('renovation');
  });
  it('garde-fou : des désignations de brasserie ne deviennent jamais de la Rénovation, sous Brassage ou Matériel (abréviations comprises)', () => {
    const BRASSERIE = ['Fermzilla 27 L', 'Pilsner Malz', 'Citra T90', 'Safale US-05', 'Whirlfloc', 'Kronkorken', 'Chemipro OXI', 'Weizenmalz hell', 'Plattenkühler', 'Spundventil', 'Hopfensack fein',
      'Gärfass 30 Liter mit Deckel', 'Candi Sugar Amber 500g', 'Hopfenpellets Saaz 8%', 'Star San 946 ml', 'Silikonschlauch 8 mm', 'Tuyau silicone 8 mm', 'Thermomètre', 'Refractometer', 'Immersion chiller',
      'Bottle filler', 'Carbonation drops', 'Brewing paddle', 'Seau 12 L', 'Brosse', 'Gants nitrile', 'Robinet de cuve', 'Ruban adhésif', 'Primings sugar', 'Carapils', 'Caramunich', 'Melanoidin'];
    for (const nom of BRASSERIE) for (const categorie of [undefined, 'brassage', 'materiel']) for (const kind of ['stock', 'other', 'equipment']) expect(famille(nom, kind, '', '', undefined, categorie), `${nom} / ${kind} / ${categorie}`).not.toBe('renovation');
  });
  it('le seau et la brosse (mots ambigus) : Rénovation sous Local ; sous Brassage, la famille d’aujourd’hui', () => {
    for (const nom of ['Seau 12 L', 'Eimer 12 Liter', 'Brosse métallique', 'Bürste Stahl']) {
      for (const kind of ['other', 'equipment']) expect(famille(nom, kind, '', '', undefined, 'renovation'), `${nom} ${kind} Local`).toBe('renovation');
    }
    expect(famille('Seau 12 L', 'other', '', '', undefined, 'brassage')).toBe('autres');
    expect(famille('Eimer 12 Liter', 'equipment', '', '', undefined, 'brassage')).toBe('materiel');
    expect(famille('Brosse métallique', 'other', '', '', undefined, 'brassage')).toBe('consommable');
    expect(famille('Brosse métallique', 'equipment', '', '', undefined, 'brassage')).toBe('materiel');
    expect(famille('Brosse métallique', 'other')).toBe('consommable');
    expect(sousFamilleDe('renovation', { nom: 'Seau 12 L' })).toBe(OUTILLAGE);
    expect(sousFamilleDe('renovation', { nom: 'Brosse métallique' })).toBe(OUTILLAGE);
  });
  it('les autres mots ambigus (robinet, tuyau, joint, gant, masque, ruban) suivent la catégorie', () => {
    for (const nom of ['Robinet 1/2', 'Tuyau 10 m', 'Joint plat', 'Gants', 'Masque']) {
      expect(famille(nom, 'equipment', '', '', undefined, 'renovation'), `${nom} Local`).toBe('renovation');
      expect(famille(nom, 'equipment', '', '', undefined, 'brassage'), `${nom} Brassage`).toBe('materiel');
      expect(famille(nom, 'equipment'), `${nom} sans catégorie`).toBe('materiel');
    }
    expect(famille('Ruban adhésif', 'other', '', '', undefined, 'renovation')).toBe('renovation');
    expect(famille('Ruban adhésif', 'other', '', '', undefined, 'brassage')).toBe('consommable');
    expect(sousFamilleDe('renovation', { nom: 'Robinet 1/2' })).toBe(PLOMBERIE);
    expect(sousFamilleDe('renovation', { nom: 'Ruban adhésif' })).toBe(PEINTURE);
  });
});

describe('D306 — un mot sans équivoque des travaux va en Rénovation sous toute catégorie', () => {
  it('lu sous Brassage, sans catégorie, matériel ou autre : toujours la Rénovation', () => {
    for (const nom of ['Peinture murale blanche mate 10 L', 'Cheville à frapper 8 mm', 'Carrelage grès 30 x 30', 'Interrupteur va-et-vient', 'Vitrificateur parquet', 'Dübel 8 mm', 'Pittura murale']) {
      for (const categorie of [undefined, 'brassage', 'materiel', 'divers']) for (const kind of ['stock', 'other', 'equipment', 'unknown']) {
        expect(famille(nom, kind, '', '', undefined, categorie), `${nom} / ${kind} / ${categorie}`).toBe('renovation');
      }
    }
  });
  it('une catégorie « Consommable » lue sur la ligne cède aux travaux ; celle d’un article rattaché, jamais', () => {
    expect(famille('Peinture murale', 'stock', 'Consommable')).toBe('renovation');
    expect(famille('Peinture murale', 'stock', '', '', 'Consommable')).toBe('consommable');
  });
  it('un mot du brassage plus précis garde la main : Hop Spider Bag, le ruban de téflon d’un robinet de cuve, un tuyau en silicone', () => {
    expect(famille('Hop Spider Bag', 'stock')).toBe('materiel');
    expect(famille('Hop Spider Bag', 'equipment', '', '', undefined, 'brassage')).toBe('materiel');
    expect(famille('Ruban de téflon pour robinet de cuve', 'equipment', '', '', undefined, 'brassage')).toBe('materiel');
    expect(famille('Ruban de téflon pour robinet de cuve', 'other', '', '', undefined, 'brassage')).toBe('materiel');
    expect(famille('Tuyau silicone alimentaire 8 mm', 'equipment', '', '', undefined, 'brassage')).toBe('materiel');
    expect(famille('Silikonschlauch 8 mm', 'equipment', '', '', undefined, 'brassage')).toBe('materiel');
    expect(famille('Silikonschlauch 8 mm', 'equipment')).toBe('materiel');
  });
  it('un nettoyant garde la main même avec un mot de travaux (Fliesen Reiniger) ; un ingrédient ou un emballage lu sous Local reste lui-même', () => {
    expect(famille('Fliesen Reiniger 1 L', 'other', '', '', undefined, 'renovation')).toBe('nettoyage');
    expect(famille('Fliesen Reiniger 1 L', 'other', '', '', undefined, 'brassage')).toBe('nettoyage');
    expect(famille('Pilsner Malz, Kg', 'stock', '', '', undefined, 'renovation')).toBe('malt');
    expect(famille('Citra 12.5%', 'stock', 'hop', '', undefined, 'renovation')).toBe('houblon');
    expect(famille('Kronkorken 100 Kapseln', 'packaging', '', '', undefined, 'renovation')).toBe('emballage');
    expect(famille('Safale US-05 11,5g', 'stock', '', '', undefined, 'renovation')).toBe('levure');
  });
});

describe('D306 — détartrant, anticalcaire, déboucheur : Nettoyage, sous toute catégorie', () => {
  const NOMS = ['Durgol Swiss 500 ml', 'Kalkex 1 L', 'Antikal spray', 'Destop gel 1 L', 'Mr Muscle Déboucheur', 'Calgon 1 kg', 'Viakal', 'Cilit Bang', 'Drano', 'Rohrfrei 1 L', 'Détart. WC', 'Entkalk. Spray', 'Détartrant WC 1 L', 'Anticalcaire sanitaire', 'Déboucheur gel 1 L', 'Entkalker Spray', 'Descaler 500 ml', 'Decalcificante bagno', 'Rohrreiniger 1 L', 'Drain cleaner gel', 'Disgorgante 1 L'];
  it('lu other, equipment, stock, cleaning, sous Local, Brassage ou sans catégorie', () => {
    for (const nom of NOMS) for (const kind of ['other', 'equipment', 'stock', 'cleaning']) for (const categorie of [undefined, 'brassage', 'renovation']) {
      expect(famille(nom, kind, '', '', undefined, categorie), `${nom} / ${kind} / ${categorie}`).toBe('nettoyage');
    }
  });
  it('même lu « Consommable » en catégorie de stock', () => {
    expect(famille('Détartrant WC 1 L', 'stock', 'Consommable', '', undefined, 'renovation')).toBe('nettoyage');
  });
  it('sa sous-famille de nettoyage est celle d’aujourd’hui (Détergent)', () => {
    expect(sousFamilleDe('nettoyage', { nom: 'Détartrant WC 1 L' })).toBe('Détergent');
    expect(sousFamilleDe('nettoyage', { nom: 'Star San 946 ml' })).toBe('Désinfectant');
    // Une marque de détartrant a la sous-famille du détartrant, pas « Consommable » (pilote, sa pièce du 02.11).
    for (const nom of ['Durgol Swiss 500 ml', 'Kalkex 1 L', 'Destop gel 1 L']) expect(sousFamilleDe('nettoyage', { nom }), nom).toBe('Détergent');
  });
});

describe('D306 — sousFamilleDe pour les autres familles', () => {
  it('la catégorie de stock lue ou de l’article, sinon undefined ; Nettoyage et Consommables par categorieDeFamille', () => {
    expect(sousFamilleDe('malt', { nom: 'Pilsner Malz', stockCategory: 'malt' })).toBe('Malt');
    expect(sousFamilleDe('malt', { nom: 'Pilsner Malz' })).toBeUndefined();
    expect(sousFamilleDe('houblon', { nom: 'Citra', categorieArticle: 'Houblon' })).toBe('Houblon');
    expect(sousFamilleDe('materiel', { nom: 'Fermzilla' })).toBeUndefined();
    expect(sousFamilleDe('consommable', { nom: 'Gants', stockCategory: 'EPI' })).toBe('EPI');
    expect(sousFamilleDe('consommable', { nom: 'Chiffons' })).toBe('Consommable');
    expect(sousFamilleDe('nettoyage', { nom: 'Soude caustique' })).toBe('CIP alcalin');
  });
  it('une famille jamais touchée par D306 ne change pas : familleDe sans catégorie lit les mêmes lignes', () => {
    expect(familleDe({ nom: 'Fermzilla 27 L', kind: 'equipment' })).toBe('materiel');
    expect(familleDe({ nom: 'Gants nitrile', kind: 'cleaning' })).toBe('consommable');
    expect(familleDe({ nom: 'Divers fictif XJ-17', kind: 'other' })).toBe('autres');
  });
});

describe('D306 — l’unité déduite lit la même famille que la bande (la catégorie passe par contexteConfiance et avecUnitesDeduites)', () => {
  const brouillon = (category?: string) => ({
    vendor: 'Brico Fictif SA', amount: 25, ...(category ? { category } : {}),
    lines: [{ id: 'l1', description: 'Tuyau 10 m', kind: 'equipment' as const, amount: 25, quantity: 10, unit: '', unitPrice: 2.5, stockAction: 'none' as const, equipmentAction: 'none' as const }],
  });
  it('un tuyau lu matériel sans unité : des mètres sous Brassage (famille Matériel), pas sous Local (famille Rénovation)', () => {
    const brassage = avecUnitesDeduites(brouillon('brassage') as any, []).lines[0] as any;
    const local = avecUnitesDeduites(brouillon('renovation') as any, []).lines[0] as any;
    expect(brassage.uniteDeduite?.unite).toBe('m');
    expect(local.uniteDeduite?.unite).not.toBe('m');
  });
});
