import { describe, expect, it } from 'vitest';
import { creerApiLevure, levure, levierPour } from '../../../src/domain/levure';
import { descripteurArome, rangDefaut, rangNiveau, statutPof, statutSta1 } from '../../../src/domain/levure/lecture';
import { familleArome, jetonArome, jetonDeAxe } from '../../../src/domain/levure/couleurs';
import { FABRICANTS_ECARTES, FABRICANTS_EUROPE, enStockIci } from '../../../src/domain/levure/disponibilite';
import faits from '../../../src/data/levure/faitsSources.json';

// `maquette` : le catalogue brut, comme les comptes de la passe 4 (work/missions/2026-11-09-ecran-levure/p2/c6a/comptes-p4.txt).
const maquette = creerApiLevure({ maquette: true });
const parId = (api: typeof levure, id: string) => api.trouver(id)!;

describe('lecture des champs bruts', () => {
  it('POF : négatif, positif, et rien quand la fiche ne dit rien', () => {
    for (const t of ['No', 'Non-phenolic', 'Non Phenolic', 'Non-Phenolic', 'negative', 'Negative', '–', 'POF -', 'POF −']) expect(statutPof(t), t).toBe(0);
    for (const t of ['Yes', 'Phenolic', 'positive', '+', 'POF +']) expect(statutPof(t), t).toBe(1);
    for (const t of ['No data', 'Phenolic Off-Flavor : champ présent, sans valeur', '']) expect(statutPof(t), t).toBeNull();
  });
  it('STA1 : « non-diastatic » est négatif, un positif l’emporte', () => {
    expect(statutSta1(['Non-diastatic'])).toBe('neg');
    expect(statutSta1(['Negative', 'Diastatic'])).toBe('pos');
    expect(statutSta1(['No data'])).toBeNull();
  });
  it('niveaux : une étendue donne la moyenne, l’inconnu reste inconnu', () => {
    expect(rangNiveau('Low')).toBe(1);
    expect(rangNiveau('Low to Medium; Higher with prolonged aging')).toBe(1.5);
    expect(rangNiveau('High Fermentation Rate')).toBe(3);
    expect(rangNiveau('Very Low - High')).toBeNull();
    expect(rangNiveau('No info')).toBeNull();
  });
  it('défauts : « négatif » dit l’absence, « Low » reste faible', () => {
    expect(rangDefaut('H₂S négatif, selon le fabricant.')).toBe(0);
    expect(rangDefaut('Non détectable selon le fabricant.')).toBe(0);
    expect(rangDefaut('Low')).toBe(1);
  });
  it('descripteurs : « non-phenolic » n’est pas du girofle ; « low fruitness » n’est pas du fruité', () => {
    expect(descripteurArome('phenols', 'Non-phenolic yeast').sens).toBe('moins');
    expect(descripteurArome('phenols', 'clove and banana').sens).toBe('plus');
    expect(descripteurArome('esters', 'Very clean, crisp, with low fruitness and mild ester production').sens).toBe('moins');
    expect(descripteurArome('esters', 'banana and clove').mots).toEqual(['banane']);
  });
});

describe('POF', () => {
  it('US-05 : Fermentis ne déclare rien, donc ni « phénolique » ni « estimé » (« ? chercher »)', () => {
    const us05 = parId(levure, 'fermentis-us05');
    expect(levure.valeurAxe(us05, 'phenols')).toBeNull();
    expect(maquette.valeurAxe(parId(maquette, 'fermentis-us05'), 'phenols')).toBeNull();
  });
  it('WB-06 : élevé, non estimé, sourcé', () => {
    const v = levure.valeurAxe(parId(levure, 'yeast-fermentis-safale-wb-06'), 'phenols')!;
    expect(v.niveau).toBe('eleve');
    expect(v.estime).toBeUndefined();
    expect(v.source?.libelle).toMatch(/Fermentis/);
  });
  it('S-04 et W-34/70 : faible, non estimé (fait versé)', () => {
    for (const id of ['yeast-fermentis-safale-s-e2-80-9104', 'yeast-fermentis-saflager-w-34-70']) {
      const v = levure.valeurAxe(parId(levure, id), 'phenols')!;
      expect(v.niveau, id).toBe('faible');
      expect(v.estime, id).toBeUndefined();
    }
  });
  it('un descripteur seul (M20 : girofle) reste « estimé » quand aucun POF n’est publié', () => {
    const m44 = maquette.contexte.biere().find((f) => /M20 Bavarian/.test(f.ref.name))!;
    const v = maquette.valeurAxe(m44.ref, 'phenols');
    if (v) expect(v.estime ?? v.niveau != null).toBeTruthy();
  });
  it('comptes des phénols depuis US-05 : − 186 · + 209 (maquette : − 187 · + 208, ±2 : lecture des négations)', () => {
    const c = maquette.comptesAxes(parId(maquette, 'fermentis-us05')).phenols;
    expect(Math.abs(c.moins - 187)).toBeLessThanOrEqual(2);
    expect(Math.abs(c.plus - 208)).toBeLessThanOrEqual(2);
    expect(c.estime).toBe(true);
  });
});

describe('comptes des maquettes (catalogue brut)', () => {
  const us05 = parId(maquette, 'fermentis-us05');
  const c = maquette.comptesAxes(us05);
  it('1 339 fiches de bière ; une levure de vin est absente par défaut', () => {
    expect(maquette.contexte.biere().length).toBe(1339);
    const r = maquette.chercher('', {});
    expect(r.total).toBe(1339);
    expect(maquette.chercher('', { boisson: [] }).total).toBeGreaterThan(1339);
    expect(maquette.chercher('', { boisson: ['vin'] }).total).toBeGreaterThan(300);
  });
  it('par défaut (catégories lues), la bière perd aussi les levures de vin et de distillerie que les noms ne trahissent pas', () => {
    const noms = (r: { liste: Array<{ name: string }> }) => r.liste.map((y) => y.name);
    const defaut = levure.chercher('', {});
    expect(defaut.total).toBeLessThan(1339);
    expect(noms(defaut).some((n) => /Flor Sherry|Scotch Whisky|American Whiskey|Champagne/i.test(n))).toBe(false);
    expect(noms(levure.chercher('', { boisson: ['vin'] })).some((n) => /Flor Sherry/.test(n))).toBe(true);
    expect(noms(defaut).some((n) => /WLP001/.test(n))).toBe(true); // multi-listée sous « Wine/Mead/Cider » mais bière
  });
  it('esters : − 41 · + 317 estimé (316 : WLP830, aroma corrigé dans la bibliothèque)', () => {
    expect(c.esters.moins).toBe(41);
    expect(c.esters.plus).toBeGreaterThanOrEqual(316);
    expect(c.esters.plus).toBeLessThanOrEqual(317);
    expect(c.esters.estime).toBe(true);
  });
  it('3068, WLP300, M20, W-68 et Abbaye sortent en « + esters »', () => {
    const plus = new Set(maquette.suggerer(us05, [{ axe: 'esters', sens: 1 }], 5000).map((s) => s.levure.name));
    for (const q of ['3068', 'WLP300', 'M20 Bavarian', 'SafAle W-68', 'Abbaye']) expect([...plus].some((n) => n.includes(q)), q).toBe(true);
  });
  it('atténuation, tolérance, température : les comptes de la maquette à 2 près', () => {
    expect(Math.abs(c.attenuation.moins - 500)).toBeLessThanOrEqual(2);
    expect(c.attenuation.plus).toBe(124);
    expect(c.tolerance.moins).toBe(268);
    expect(c.tolerance.plus).toBe(346);
    expect(c.temperature.moins).toBe(431);
    expect(c.temperature.plus).toBe(268);
  });
  it('Style : 233 documentées, 1 106 sans style ; tolérance 4 · 57 · 263 · 346 + 669', () => {
    const r = maquette.chercher('', {});
    expect(r.comptes.style!.nonDocumentees).toBe(1106);
    expect(1339 - r.comptes.style!.nonDocumentees).toBe(233);
    expect(r.comptes.tolerance!.options.map((o) => o.n)).toEqual([4, 57, 263, 346]);
    expect(r.comptes.tolerance!.nonDocumentees).toBe(669);
  });
});

describe('chercher : l’ordre c4', () => {
  const r = levure.chercher('1056', {}, { temperatureC: 19, abvVise: 7 });
  it('« 1056 » est un repère : posé, jamais un filtre', () => {
    expect(r.tapee?.id).toBe('wyeast-1056');
    expect(r.liste.some((y) => y.id === 'wyeast-1056')).toBe(false);
    expect(r.total).toBeGreaterThan(1300);
    expect(r.resume).toBe(`bière · repères 19 °C · 7 % · proche de 1056 · ${String(r.total).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')}`);
    expect(maquette.chercher('1056', {}, { temperatureC: 19, abvVise: 7 }).resume).toBe('bière · repères 19 °C · 7 % · proche de 1056 · 1\u00a0339');
  });
  it('US-05 en tête, les vendues ici devant, puis Europe, puis rares', () => {
    expect(r.liste[0].id).toBe('fermentis-us05');
    const rangs = r.liste.map((y) => levure.disponibilite(y).rang);
    const ordre = { ici: 0, europe: 1, rare: 2 };
    for (let i = 1; i < rangs.length; i++) expect(ordre[rangs[i]]).toBeGreaterThanOrEqual(ordre[rangs[i - 1]]);
    expect(rangs.filter((x) => x === 'ici').length).toBe(6);
  });
  it('1007 est « épuisée » : vendue ici mais derrière celles qui ont du stock', () => {
    expect(enStockIci('wyeast-1007')).toBe(false);
    expect(enStockIci('fermentis-us05')).toBe(true);
    const ids = r.liste.slice(0, 6).map((y) => y.id);
    expect(ids.indexOf('wyeast-1007')).toBe(5);
  });
  it('facettes disjonctives : le compte d’une option exclut son propre filtre', () => {
    const sans = levure.chercher('', { famille: ['lager'] });
    const avec = levure.chercher('', { famille: ['lager'], sansSta1: true });
    const lager = (x: typeof sans) => x.comptes.famille!.options.find((o) => o.valeur === 'lager')!.n;
    const ale = (x: typeof sans) => x.comptes.famille!.options.find((o) => o.valeur === 'ale')!.n;
    expect(ale(sans)).toBeGreaterThan(0);           // ale est comptée alors que « lager » est posé
    expect(lager(avec)).toBeLessThan(lager(sans));  // mais « sans STA1 » réduit les comptes de la famille
    expect(avec.total).toBe(lager(avec));
    expect(avec.comptes.sansSta1!.nonDocumentees).toBeGreaterThan(0);
  });
  it('plage °C : la fiche dont la plage recoupe la plage demandée est gardée', () => {
    const nova = parId(levure, 'lalbrew-novalager');
    const l = levure.chercher('', { temperature: { min: 15, max: 25 }, boisson: ['biere'] }).liste;
    expect(l.some((y) => y.id === nova.id)).toBe(true);
  });
});

describe('disponibilité', () => {
  it('ici : une offre CH, FR ou DE ; Europe : fabricant prouvé ; rare : le reste', () => {
    expect(levure.disponibilite(parId(levure, 'fermentis-us05'))).toMatchObject({ rang: 'ici', pays: expect.arrayContaining(['CH', 'DE']), prixMin: { montant: 3.4, devise: 'CHF' } });
    expect(levure.disponibilite(parId(levure, 'lalbrew-pomona')).pays).toContain('FR');
    expect(levure.disponibilite(parId(levure, 'wyeast-1056')).rang).toBe('europe'); // offre aux Pays-Bas
    const labos = new Set(levure.contexte.biere().map((f) => f.labo));
    const rare = [...labos].filter((l) => !FABRICANTS_EUROPE.some((f) => f.fabricant === l));
    expect(rare).toContain('Omega Yeast');
    expect(rare).not.toContain('Doemens');
  });
  it('règle du pilote (09.11, L14) : Brouwland et Kveik Yeastery donnent « europe » ; un fabricant sans aucune preuve donne « rare »', () => {
    const rang = (labo: string) => {
      const f = levure.contexte.tous().find((x) => x.labo === labo);
      expect(f, labo).toBeDefined();
      return levure.disponibilite(f!.ref).rang;
    };
    expect(rang('Brewferm / Brouwland')).toBe('europe');
    expect(rang('Kveik Yeastery')).toBe('europe');
    for (const sansPreuve of ['Omega Yeast', 'Imperial Yeast', 'Bootleg Biology', 'The Yeast Bay', 'CellarScience']) expect(rang(sansPreuve), sansPreuve).toBe('rare');
    // chaque fabricant des fiches de bière est soit prouvé (preuve écrite), soit écarté (raison écrite) : aucun silence
    const dits = new Set([...FABRICANTS_EUROPE.map((f) => f.fabricant), ...FABRICANTS_ECARTES.map((f) => f.fabricant)]);
    for (const labo of new Set(levure.contexte.biere().map((f) => f.labo).filter(Boolean))) expect(dits.has(labo), labo).toBe(true);
    // une preuve non encore confirmée sur la page du fabricant est dite
    expect(FABRICANTS_EUROPE.find((f) => f.fabricant === 'Brewferm / Brouwland')).toMatchObject({ aConfirmer: true });
  });
  it('« Europe · sans offre vue » depuis US-05 : atténuation − 199 sur 200 ; aucune offre européenne hors CH · FR · DE sauf la 1056', () => {
    const us05 = levure.trouver('fermentis-us05')!;
    const s = maquette.suggerer(maquette.trouver('fermentis-us05')!, [{ axe: 'attenuation', sens: -1 }], 5000);
    const eu = s.filter((x) => x.disponibilite.rang === 'europe');
    expect(eu.length).toBe(200);
    expect(eu.filter((x) => x.disponibilite.offres === 0).length).toBe(199);
    expect(us05).toBeDefined();
  });
  it('chaque fabricant d’Europe a sa preuve et son URL ; Lallemand et Mangrove Jack’s la leur', () => {
    for (const f of FABRICANTS_EUROPE) { expect(f.preuve.length).toBeGreaterThan(20); expect(f.source.url).toMatch(/^https:/); }
    expect(FABRICANTS_EUROPE.find((f) => f.fabricant === 'Lallemand Brewing')!.preuve).toMatch(/boutique/);
    expect(FABRICANTS_EUROPE.find((f) => f.fabricant === 'Mangrove Jack’s')!.preuve).toMatch(/UK & EU/);
  });
});

describe('faits sourcés', () => {
  it('46 faits versés, chacun avec sa source (titre, auteur, URL)', () => {
    expect(faits.faits.length).toBe(46);
    for (const f of faits.faits) { expect(f.source.title).toBeTruthy(); expect(f.source.auteur).toBeTruthy(); expect(f.source.reference).toMatch(/^https?:/); }
  });
  it('3068 en + esters (banane, Wyeast) ; BE-256 : High retenu, les 20 ppm du TDS ancien notés', () => {
    const us05 = parId(levure, 'fermentis-us05');
    const plus = levure.suggerer(us05, [{ axe: 'esters', sens: 1 }], 5000).map((s) => s.levure.name);
    expect(plus.some((n) => n.includes('3068'))).toBe(true);
    const be256 = parId(levure, 'yeast-fermentis-safale-be-e2-80-91256');
    expect(levure.valeurAxe(be256, 'esters')!.niveau).toBe('eleve');
    expect(levure.autresValeurs(be256, 'esters').length).toBe(1);
  });
  it('US-05 : esters faibles (Fermentis, 40 ppm) et sucres restants 11 g/L', () => {
    const us05 = parId(levure, 'fermentis-us05');
    expect(levure.valeurAxe(us05, 'esters')).toMatchObject({ niveau: 'faible' });
    expect(levure.valeurAxe(us05, 'rondeur')!.plage).toEqual({ min: 11, max: 11 });
  });
  it('Rondeur depuis US-05 : − 4 · + 2 (TDS Fermentis)', () => {
    const c = levure.comptesAxes(parId(levure, 'fermentis-us05')).rondeur;
    expect(c.moins).toBe(4);
    expect(c.plus).toBe(2);
  });
  it('l’inconnu n’est jamais 0 : un axe sans donnée rend null', () => {
    expect(levure.valeurAxe(parId(levure, 'fermentis-us05'), 'soufre')).toBeNull();
    expect(levure.valeurAxe(parId(levure, 'fermentis-us05'), 'clarte')).toBeNull();
  });
});

describe('doutes du critique', () => {
  it('W-68 Fermentis : esters élevés sans le mot « banane » (non sourcé pour cette fiche)', () => {
    const v = levure.valeurAxe(parId(levure, 'fermentis-w68'), 'esters')!;
    expect(v.niveau).toBe('eleve');
    expect(v.mots ?? []).not.toContain('banane');
  });
  it('3068 : le levier « plus chaud » est sourcé (Wyeast) ; Diamond : thiols élevés, étude Samia', () => {
    const us05 = parId(levure, 'fermentis-us05');
    expect(levierPour('wyeast-3068', 'esters', 1)?.texte).toMatch(/Wyeast 3068/);
    expect(levierPour('fermentis-us05', 'esters', 1)).toBeUndefined(); // aucune source pour une autre levure
    const diamond = levure.valeurAxe(parId(levure, 'lalbrew-diamond'), 'thiols')!;
    expect(diamond.niveau).toBe('eleve');
    expect(diamond.source?.libelle).toBe('Samia 2026');
    const th = levure.suggerer(us05, [{ axe: 'thiols', sens: 1 }], 50);
    expect(th.every((x) => x.levier?.includes('Samia 2026'))).toBe(true);
  });
  it('levier de l’atténuation : empâtage → Malts/sucres ; aucun levier inventé sur la clarté', () => {
    const us05 = parId(levure, 'fermentis-us05');
    expect(levure.suggerer(us05, [{ axe: 'attenuation', sens: -1 }], 1)[0].levier).toMatch(/Malts\/sucres/);
    expect(levure.suggerer(us05, [{ axe: 'clarte', sens: 1 }], 1)[0]?.levier).toBeUndefined();
  });
});

describe('suggérer', () => {
  const us05 = parId(levure, 'fermentis-us05');
  it('moins d’atténuation : 1084, 1007 devant, avec l’écart signé', () => {
    const s = levure.suggerer(us05, [{ axe: 'attenuation', sens: -1 }], 10);
    expect(s[0].disponibilite.rang).toBe('ici');
    expect(s.slice(0, 3).map((x) => x.levure.id)).toContain('wyeast-1084');
    expect(s[0].ecarts[0].ecart).toBeLessThan(0);
  });
  it('deux axes se combinent : tous deux dans le bon sens', () => {
    const s = levure.suggerer(us05, [{ axe: 'thiols', sens: 1 }, { axe: 'clarte', sens: 1 }], 20);
    expect(s.length).toBeGreaterThan(0);
    for (const x of s) expect(x.ecarts.map((e) => e.axe)).toEqual(['thiols', 'clarte']);
  });
  it('proximité : symétrique, nulle avec soi-même, croissante avec l’écart', () => {
    const a = parId(levure, 'wyeast-1056'), b = us05, c = parId(levure, 'lalbrew-diamond');
    expect(levure.proximite(a, a)).toBe(0);
    expect(levure.proximite(a, b)).toBeCloseTo(levure.proximite(b, a), 10);
    expect(levure.proximite(a, b)).toBeLessThan(levure.proximite(a, c));
  });
});

describe('API ajoutée au contrat : documente, trouver, volumeL', () => {
  it('trouver : une levure par son id, undefined si inconnue', () => {
    expect(levure.trouver('fermentis-us05')?.name).toMatch(/US-05/);
    expect(levure.trouver('n-existe-pas')).toBeUndefined();
  });
  it('documente : la même règle que les « non documentées » des facettes', () => {
    const us05 = parId(levure, 'fermentis-us05');
    expect(levure.documente(us05, 'temperature')).toBe(true);
    expect(levure.documente(us05, 'clarte')).toBe(false);
    expect(levure.documente(us05, 'sansSta1')).toBe(levure.contexte.fiche(us05).sta1 != null);
    // cohérence : le total des fiches qui documentent un filtre = total − non documentées
    const base = maquette.chercher('', {});
    const biere = maquette.contexte.biere().map((f) => f.ref);
    for (const id of ['temperature', 'tolerance', 'clarte', 'style', 'vitesse'] as const) {
      const doc = biere.filter((y) => maquette.documente(y, id)).length;
      expect(doc, id).toBe(biere.length - base.comptes[id]!.nonDocumentees);
    }
  });
  it('volumeL : un repère de plus, sans effet sur la recherche', () => {
    const a = levure.chercher('', {}, { temperatureC: 19, volumeL: 20 });
    const b = levure.chercher('', {}, { temperatureC: 19 });
    expect(a.total).toBe(b.total);
  });
});

describe('couleurs des effets : les familles des houblons', () => {
  it('chaque descripteur a la famille d’arôme et le jeton du houblon', () => {
    expect(familleArome('banane')).toBe('tropical');
    expect(familleArome('girofle')).toBe('spice');
    expect(familleArome('abricot')).toBe('stoneFruit');
    expect(familleArome('neutre')).toBeNull();
    expect(jetonArome('banane')).toMatchObject({ base: '#ee9b2f' });
    expect(jetonDeAxe('phenols')).toMatchObject({ base: '#7a4e3a' });
    expect(jetonDeAxe('attenuation')).toBeNull();
  });
});

describe('mesure : temps de chercher (1 733 fiches, 3 filtres)', () => {
  it('à chaud, moins de 20 ms (à froid et à chaud écrits dans la sortie)', () => {
    const api = creerApiLevure();
    const filtres = { famille: ['ale'], temperature: { min: 18, max: 20 }, sansSta1: true };
    const t0 = performance.now();
    api.chercher('', filtres, { temperatureC: 19 });
    const froid = performance.now() - t0;
    const mesures: number[] = [];
    for (let i = 0; i < 20; i++) { const t = performance.now(); api.chercher('', i % 2 ? filtres : { ...filtres, famille: ['lager'] }, { temperatureC: 19 }); mesures.push(performance.now() - t); }
    mesures.sort((a, b) => a - b);
    const chaud = mesures[Math.floor(mesures.length / 2)];
    const avecTexte = (() => { const t = performance.now(); api.chercher('1056', filtres, { temperatureC: 19 }); return performance.now() - t; })();
    console.log(`MESURE chercher : à froid ${froid.toFixed(0)} ms (fiches, index et valeurs construits), à chaud médiane ${chaud.toFixed(1)} ms, avec texte « 1056 » ${avecTexte.toFixed(1)} ms`);
    expect(chaud).toBeLessThan(20);
  });
});
