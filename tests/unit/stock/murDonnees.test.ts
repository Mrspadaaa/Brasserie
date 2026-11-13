import { describe, expect, it } from 'vitest';
import type { StockItem } from '../../../src/types';
import { construireMur, familleBrasseur, initialeSouche, teinteArome, cartesAutres, typeMaltParNom, TEINTES_LEGENDE, BASE_TEINTE, type SourcesMur } from '../../../src/domain/stock/murDonnees';
import { sourcesDeLApp } from '../../../src/domain/stock/murSources';
import { rayonDuMur } from '../../../src/domain/stock/murRayon';

const it0 = (o: Partial<StockItem>): StockItem => ({ id: o.ref ?? 'x', ref: 'x', name: 'x', category: 'Malt', unit: 'kg', currentStock: 1, reorder: false, ...o } as StockItem);
const src: SourcesMur = {
  houblon: (i) => ({ id: i.name.toLowerCase(), role: null, origine: i.origin ?? null, arome: null }),
  parts: (id) => (id === 'citra' ? { '21C': 0.4, '21A': 0.2 } : id === 'saaz' ? { '3B': 0.5 } : null),
  auFrais: (id) => (id === 'citra' ? 0.8 : null),
  typeMalt: (i) => (/pilsner/i.test(i.name) ? 'base' : /chocolat/i.test(i.name) ? 'torrefies' : null),
  colonneLevure: (i) => (/us-05/i.test(i.name) ? 'ipa' : null),
  attenuation: (i) => i.yeastAttenuationPct ?? null,
};

describe('mur du stock : adaptateur', () => {
  it('range les malts par type, du plus clair au plus foncé, EBC inconnu gris sans être 0', () => {
    const m = construireMur([it0({ ref: 'a', name: 'Pilsner', colorEbc: 3.5, currentStock: 120 }), it0({ ref: 'b', name: 'Malt chocolat', colorEbc: 900, currentStock: 1.5 }), it0({ ref: 'c', name: 'Mystère' })], src);
    const malts = m.rayons[0];
    expect(malts.groupes.map((g) => g.id)).toEqual(['base', 'torrefies', 'speciaux']);
    const inconnu = malts.groupes[2].marques[0];
    expect(inconnu.fill).toBe('#9a9a9a');
    expect(inconnu.titre).toContain('EBC non connu');
    expect(malts.groupes[0].marques[0].hauteur).toBeGreaterThan(malts.groupes[1].marques[0].hauteur);
  });
  it('place les houblons par style ; α inconnu = hachuré ; épuisé = marque vide', () => {
    const m = construireMur([it0({ ref: 'h1', name: 'Citra', category: 'Houblon', unit: 'g', currentStock: 500, alphaPct: 12 }), it0({ ref: 'h2', name: 'Saaz', category: 'Houblon', unit: 'g', currentStock: 0 })], src);
    const r = m.rayons[1];
    expect(r.groupes.map((g) => g.id)).toEqual(['hazy', 'lager']);
    expect(r.groupes[1].marques[0].etat).toBe('epuise');
    expect(r.groupes[1].marques[0].hachure).not.toBeNull();
    expect(r.groupes[0].marques[0].hachure).toBeNull();
    expect(r.vides.length).toBeLessThanOrEqual(3);
  });
  it('une marque en stock fait 8 px au moins (150 g de houblon, 0,3 kg de malt)', () => {
    const m = construireMur([it0({ ref: 'h1', name: 'Simcoe', category: 'Houblon', unit: 'g', currentStock: 150, alphaPct: 13 }), it0({ ref: 'a', name: 'Pilsner', colorEbc: 3.5, currentStock: 0.3 })], src);
    expect(m.rayons[1].groupes[0].marques[0].hauteur).toBeGreaterThanOrEqual(8);
    expect(m.rayons[0].groupes[0].marques[0].hauteur).toBeGreaterThanOrEqual(8);
  });
  it('compte les levures en sachets et en fioles', () => {
    const m = construireMur([it0({ ref: 'l1', name: 'SafAle US-05', category: 'Levure', unit: 'sachet', currentStock: 4, yeastAttenuationPct: 80 }), it0({ ref: 'l2', name: 'WLP002', category: 'Levure', unit: 'fiole', currentStock: 2, yeastForm: 'liquide' })], src);
    const [ipa, autres] = m.rayons[2].groupes;
    expect(ipa.sachets).toBe(4);
    expect(autres.fioles).toBe(2);
    expect(autres.marques[0].inconnue).toBe(true);
  });
  it('famille de brasseur, teinte et initiale', () => {
    expect(familleBrasseur({ id: 's', role: null, origine: 'CZ', arome: null }, 3.5, 0.2)).toBe('nobles');
    expect(familleBrasseur({ id: 'c', role: null, origine: 'US', arome: null }, 12, 0.8)).toBe('modernes');
    expect(familleBrasseur(null, null, null)).toBe('autre');
    expect(teinteArome([4, 1, 0, 0, 0, 0, 0, 0, 0])).toBe('agrumes');
    expect(teinteArome([2, 2, 0, 0, 0, 0, 0, 0, 0])).toBe('nonclasse');
    expect(teinteArome(null)).toBe('nonclasse');
    expect(initialeSouche('SafAle US-05')).toBe('U');
    expect(initialeSouche('SafAle WB-06')).toBe('B6');
    expect(initialeSouche('LalBrew Nottingham')).toBe('N');
  });
  it('autres stocks : bas, à réparer', () => {
    const c = cartesAutres([it0({ ref: 'e', name: 'Capsules', category: 'Emballage', unit: 'pièce', currentStock: 1, minStock: 5 })], [{ id: 'q', ref: 'q', name: 'Pompe', category: 'Brassage', state: 'À réparer' }], []);
    expect(c.find((x) => x.nom === 'Emballage')?.lignes[0]).toMatchObject({ n: 1, texte: 'bas' });
    expect(c.find((x) => x.nom === 'Matériel')?.lignes[0]).toMatchObject({ n: 1, texte: 'à réparer', alerte: true });
  });
  it('sources réelles : Cascade a des parts de style et un type de malt est lu', () => {
    expect(sourcesDeLApp.parts('cascade')).not.toBeNull();
    expect(sourcesDeLApp.typeMalt(it0({ name: 'Pilsner Malz' }))).toBe('base');
  });
});

// c25 (critique du 13.11) : les articles se nomment comme dans le vrai stock, pas comme le catalogue. Sources réelles, noms ordinaires.
describe('mur du stock : noms ordinaires, sources réelles (c25)', () => {
  const malts = [
    it0({ ref: 'm1', name: 'Pilsner Malz', colorEbc: 3.5, currentStock: 120 }), it0({ ref: 'm2', name: 'Munich Malz', colorEbc: 15, currentStock: 40 }),
    it0({ ref: 'm3', name: 'Caramel 120', colorEbc: 240, currentStock: 8 }), it0({ ref: 'm4', name: 'Malt chocolat', colorEbc: 900, currentStock: 2 }),
    it0({ ref: 'm5', name: 'Malt de blé', colorEbc: 4, currentStock: 25 }), it0({ ref: 'm6', name: 'Mystère', currentStock: 5 }),
  ];
  const groupeDe = (m: ReturnType<typeof construireMur>, id: string) => m.rayons[0].groupes.find((g) => g.id === id)?.marques.map((x) => x.nom).sort() ?? [];

  it('1. malts : Munich et blé en Base, Caramel 120 en Caramel, chocolat en Torréfiés ; Spéciaux ne reçoit que le reste', () => {
    const m = construireMur(malts, sourcesDeLApp);
    expect(groupeDe(m, 'base')).toEqual(['Malt de blé', 'Munich Malz', 'Pilsner Malz']);
    expect(groupeDe(m, 'caramel')).toEqual(['Caramel 120']);
    expect(groupeDe(m, 'torrefies')).toEqual(['Malt chocolat']);
    expect(groupeDe(m, 'speciaux')).toEqual(['Mystère']);
  });
  it('1. reconnaissance du type : le nom, puis l’EBC ; un inconnu reste inconnu (jamais 0)', () => {
    expect(typeMaltParNom('Carafa Special III', 1300)).toBe('torrefies');
    expect(typeMaltParNom('Carahell', 25)).toBe('caramel');
    expect(typeMaltParNom('Caramünch II', null)).toBe('caramel');
    expect(typeMaltParNom('Weizenmalz hell', null)).toBe('base');
    expect(typeMaltParNom('Vienna', 7)).toBe('base');
    expect(typeMaltParNom('Château Black', null)).toBe('torrefies');
    expect(typeMaltParNom('Flocons de blé', 4)).toBe('speciaux'); // un adjuvant cru n'est pas un malt de base
    expect(typeMaltParNom('Sauermalz', 3)).toBe('speciaux');
    expect(typeMaltParNom('Rauchmalz', 6)).toBe('speciaux');
    expect(typeMaltParNom('Mystère', null)).toBeNull(); // pas d'EBC : pas de 0 qui ferait un malt de base
    expect(typeMaltParNom('Mystère', 120)).toBeNull(); // entre les deux : rien d'assez net
    expect(typeMaltParNom('Malt maison', 6)).toBe('base');
    expect(typeMaltParNom('Malt maison', 800)).toBe('torrefies');
  });
  it('1. un malt sans EBC ni nom reconnu ne tombe pas dans une colonne qui ne le dit pas', () => {
    const m = construireMur([it0({ ref: 'x', name: 'Mystère' })], sourcesDeLApp);
    expect(m.rayons[0].groupes.map((g) => g.id)).toEqual(['speciaux']);
    expect(m.rayons[0].groupes[0].marques[0].fill).toBe('#9a9a9a');
  });

  const houblons = [
    it0({ ref: 'h1', name: 'Citra', category: 'Houblon', unit: 'g', currentStock: 500, alphaPct: 12, origin: 'US' }),
    it0({ ref: 'h2', name: 'Cascade', category: 'Houblon', unit: 'g', currentStock: 1000, alphaPct: 6, origin: 'US' }),
    it0({ ref: 'h3', name: 'Saaz', category: 'Houblon', unit: 'g', currentStock: 300, alphaPct: 3.5, origin: 'CZ' }),
    it0({ ref: 'h4', name: 'Simcoe', category: 'Houblon', unit: 'g', currentStock: 150, alphaPct: 13, origin: 'US' }),
  ];
  it('2. houblons : Citra Hazy à pointe, Simcoe W. Coast et Cascade Pale à creux, Saaz Lager à dôme', () => {
    const m = construireMur(houblons, sourcesDeLApp);
    const ou = (nom: string) => { for (const g of m.rayons[1].groupes) { const x = g.marques.find((q) => q.nom === nom); if (x) return { col: g.id, sommet: x.sommet }; } return null; };
    expect(ou('Citra')).toEqual({ col: 'hazy', sommet: 'pointe' });
    expect(ou('Simcoe')).toEqual({ col: 'westcoast', sommet: 'creux' });
    expect(ou('Cascade')).toEqual({ col: 'pale', sommet: 'creux' });
    expect(ou('Saaz')).toEqual({ col: 'lager', sommet: 'dome' });
  });
  it('2. les parts de style se lisent sous l’id du catalogue (beermaverick-…) comme sous celui de la table', () => {
    expect(sourcesDeLApp.parts('beermaverick-citra')).not.toBeNull();
    expect(sourcesDeLApp.auFrais('beermaverick-citra')).toBeGreaterThan(0.55);
    expect(sourcesDeLApp.houblon(it0({ name: 'Saaz', origin: 'CZ' }))?.id).toBe('beermaverick-saaz-cz'); // le nom seul est ambigu : l'origine de l'article tranche
    expect(sourcesDeLApp.houblon(it0({ name: 'Cascade' }))?.origine).toBe('US'); // « États-Unis » du catalogue → code
  });

  it('7. légende des teintes : les sept de fA, dans son ordre, sans « floral »', () => {
    expect(TEINTES_LEGENDE.map((t) => t.id)).toEqual(['agrumes', 'tropical', 'vinblanc', 'fruitsrouges', 'resine', 'epice', 'nonclasse']);
    expect(TEINTES_LEGENDE.map((t) => t.mot)).toEqual(['agrumes', 'tropical', 'vin blanc, groseille', 'fruits rouges', 'résine, pin', 'épicé, herbes', 'arôme non classé']);
    for (const t of TEINTES_LEGENDE) expect(BASE_TEINTE[t.id]).toBe(t.couleur);
    expect(BASE_TEINTE.floral).toBeUndefined();
  });
  it('7. Nelson Sauvin est vin blanc, groseille (L14) ; un houblon floral devient non classé', () => {
    const arome = [0, 2, 0, 4, 0, 0, 1, 0, 0]; // Beer Maverick : fruits rouges 4 (la groseille à maquereau y est rangée)
    expect(teinteArome(arome, 'beermaverick-nelson-sauvin')).toBe('vinblanc');
    expect(teinteArome(arome)).toBe('fruitsrouges');
    expect(teinteArome([0, 0, 0, 0, 4, 0, 0, 0, 0])).toBe('nonclasse');
    const m = construireMur([it0({ ref: 'n', name: 'Nelson Sauvin', category: 'Houblon', unit: 'g', currentStock: 200, alphaPct: 12 })], sourcesDeLApp);
    expect(m.rayons[1].groupes[0].marques[0].teinte).toBe('vinblanc');
  });

  it('8. pastilles vides : Malts et Houblons montrent leurs colonnes vides, Fumé et Sucres comprises', () => {
    const seul = construireMur([it0({ ref: 'a', name: 'Pilsner Malz', colorEbc: 3.5 })], sourcesDeLApp);
    expect(seul.rayons[0].vides).toEqual(['Caramel', 'Torréfiés', 'Spéciaux']);
    const plein = construireMur([...malts, it0({ ref: 'b', name: 'Biscuit', colorEbc: 50 })], sourcesDeLApp);
    expect(plein.rayons[0].vides).toEqual(['Fumé', 'Sucres']);
    const sucre = construireMur([...malts, it0({ ref: 'c', name: 'Sucre de table', category: 'Sucre', unit: 'kg', currentStock: 4 })], sourcesDeLApp);
    expect(sucre.rayons[0].vides).toEqual(['Fumé']);
    const hop = construireMur(houblons, sourcesDeLApp);
    expect(hop.rayons[1].vides).toEqual(['Belge/Blé', 'Stouts']);
  });

  it('12. le sucre est un fermentescible : dans Malts (forme creux), plus dans Additifs', () => {
    const sucre = it0({ ref: 's', name: 'Sucre de table', category: 'Sucre', unit: 'kg', currentStock: 4 });
    const m = construireMur([...malts, sucre], sourcesDeLApp);
    const x = m.rayons[0].groupes.flatMap((g) => g.marques).find((q) => q.nom === 'Sucre de table');
    expect(x?.forme).toBe('creux');
    expect(m.rayons[0].total).toBe(7);
    expect(m.autres.find((c) => c.nom === 'Additifs')).toBeUndefined();
    const sel = it0({ ref: 'z', name: 'Gypse', category: 'Sels', unit: 'kg', currentStock: 1 });
    expect(cartesAutres([sucre, sel], [], []).find((c) => c.nom === 'Additifs')?.total).toBe(1);
  });

  it('c26 n° 2. la liste suit le rayon du mur : le sucre est du rayon Malts, le sel est des Autres', () => {
    expect(rayonDuMur(it0({ category: 'Sucre', name: 'Sucre de table' }))).toBe('Malts');
    expect(rayonDuMur(it0({ category: 'Additif', name: 'Dextrose' }))).toBe('Malts');
    expect(rayonDuMur(it0({ category: 'Malt', name: 'Pilsner' }))).toBe('Malts');
    expect(rayonDuMur(it0({ category: 'Houblon', name: 'Citra' }))).toBe('Houblons');
    expect(rayonDuMur(it0({ category: 'Levure', name: 'US-05' }))).toBe('Levures');
    expect(rayonDuMur(it0({ category: 'Sels', name: 'Gypse' }))).toBeNull();
    expect(rayonDuMur(it0({ category: 'Houblon', name: 'Sugar Hop' }))).toBe('Houblons'); // un houblon au nom trompeur reste houblon
  });

  it('c26 n° 5. WLP001, WY1056, BRY-97 et « California Ale » sont la souche Chico : colonne IPA ; une lager ou une anglaise ne bascule pas', () => {
    const col = (name: string) => sourcesDeLApp.colonneLevure(it0({ category: 'Levure', name, unit: 'fiole' }));
    for (const n of ['WLP001', 'White Labs WLP001 California Ale', 'Wyeast 1056 American Ale', 'Lallemand BRY-97', 'SafAle US-05']) expect(col(n), n).toBe('ipa');
    expect(col('WLP830 German Lager')).toBe('lager');
    expect(col('SafAle S-04')).toBe('anglaise');
    expect(col('Levure inconnue')).toBeNull();
  });
});
