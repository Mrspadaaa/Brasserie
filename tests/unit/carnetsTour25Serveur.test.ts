// @vitest-environment node
/*
 * Tour 25 (23.11, work/missions/2026-11-23-carnet-en-ligne/tour25/RAPPORT.md) : les défauts de lecture trouvés sur l'app en ligne, rejoués
 * sur les VRAIES pages capturées (tests/fixtures/carnets/tour25/*.html.gz, lues par le serveur le 23.11). Aucun réseau, aucun Gemini.
 *   T25-1 hopfenmarkt : le prix est celui de la variante que la page affiche (100 g, 7,25 CHF), pas la moins chère du JSON-LD (50 g)
 *   T25-3 hopfenmarkt : le nom est le titre de la page, « Mosaic Hopfenpellets »
 *   T25-2 brewtools   : une fiche redirigée vers la recherche est « introuvable », même quand robots.txt interdit la recherche
 *   T25-4 gastro-held : ni texte marketing, ni phrase d'en-tête, ni doublon dans les caractéristiques
 *   T25-8 galaxus     : la longueur du câble (groupe « Verpackungsdimensionen ») n'est pas une dimension ; « KS240L » n'est pas 240 L
 *   T25-9 sios        : « TTC » lu
 */
import { gunzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { lirePage, lireLien } from '../../functions/src/lireLien';

const fixture = (f: string) => gunzipSync(readFileSync(new URL(`../fixtures/carnets/tour25/${f}.html.gz`, import.meta.url))).toString('utf8');
const noms = (p: { valeurs?: Array<{ nom: string }> }) => (p.valeurs ?? []).map((v) => v.nom);

describe('T25-1, T25-3 : hopfenmarkt Mosaic', () => {
  const p = lirePage(fixture('hopfenmarkt-mosaic'), new URL('https://hopfenmarkt.ch/produkt/hopfen/mosaic'), 1);
  it('le prix est celui de la variante affichée par la page (100 g), sans « dès »', () => {
    expect(p.prix).toBe(7.25);
    expect(p.devise).toBe('CHF');
    expect(p.prixDes).toBeUndefined();
    expect(p.taxe).toBe('ttc');
  });
  it('le port est celui de cette offre, et les variantes sont dites (1 kg épuisé)', () => {
    expect(p.livraison).toEqual({ prix: 4.9, devise: 'CHF' });
    const v = (p.valeurs ?? []).find((x) => x.nom === 'Variantes');
    expect(v?.valeur).toMatch(/50 g/);
    expect(v?.valeur).toMatch(/100 g \(affichée\)/);
    expect(v?.valeur).toMatch(/1 kg \(épuisé\)/);
  });
  it('le nom est le titre de la page, sans le sous-titre en caractéristique', () => {
    expect(p.nom).toBe('Mosaic Hopfenpellets');
    expect(noms(p).some((n) => /aus den USA/.test(n))).toBe(false);
  });
  it('le millésime reste « 2025 » dans la valeur lue', () => {
    expect((p.valeurs ?? []).find((v) => v.nom === 'Erntejahr')?.valeur).toBe('2025');
  });
});

describe('T25-9 : sios, taxe comprise', () => {
  it('la page dit TTC', () => {
    const p = lirePage(fixture('sios-citra'), new URL('https://www.sios.ch/Citra-USA-1-kg-Hopfenpellets-Typ-90'), 1);
    expect(p.prix).toBe(72.5);
    expect(p.taxe).toBe('ttc');
  });
});

describe('T25-2 : un lien mort est « introuvable », même si robots.txt interdit la page de recherche', () => {
  const LIEN = 'https://www.brewtools.com/brewing-system-accessories/7712213/steam-hat-b40pro-with-silicone-plug-and-seal';
  /* les réponses réelles du 23.11 (capture du banc, n° 9) ; le robots.txt réel de brewtools.com interdit « /search » */
  const ROBOTS = 'User-agent: *\nDisallow: /bin/\nDisallow: /search\nDisallow: /*?*Filter=\nAllow: /\n';
  const redirige = (vers: string) => new Response(null, { status: 301, headers: { location: vers } });
  const appels: string[] = [];
  const reseau = (async (input: string | URL | Request) => {
    const u = String(input instanceof Request ? input.url : input);
    appels.push(u);
    if (u.endsWith('/robots.txt')) return new Response(ROBOTS, { status: 200, headers: { 'content-type': 'text/plain' } });
    if (u === LIEN) return redirige('https://www.brewtools.com/Search.aspx?q=brewing+system+accessories');
    if (u.startsWith('https://www.brewtools.com/Search.aspx')) return redirige('/search.aspx?q=brewing+system+accessories');
    if (u.includes('/search.aspx')) return redirige('/search?q=brewing+system+accessories');
    return new Response('<html><title>Search</title></html>', { status: 200, headers: { 'content-type': 'text/html' } });
  }) as typeof fetch;
  it('statut introuvable, jamais « robots »', async () => {
    const r = await lireLien(LIEN, { fetchPage: reseau, maintenant: 1, cours: null });
    expect(r.statut).toBe('introuvable');
  });
  it('la page de recherche n\'est jamais demandée', async () => {
    appels.length = 0;
    await lireLien(LIEN, { fetchPage: reseau, maintenant: 1, cours: null });
    expect(appels.filter((u) => /search/i.test(new URL(u).pathname) && !u.endsWith('/robots.txt'))).toEqual([]);
  });
});

describe('T25-4 : gastro-held ECO 400, des caractéristiques sans bruit', () => {
  const p = lirePage(fixture('gastro-held-eco400'), new URL('https://www.gastro-held.ch/fr/products/armoire-refrigeree-professionnelle-eco-400-gn-11-snackh400tn'), 1);
  it('aucun texte marketing ni phrase d\'en-tête', () => {
    const n = noms(p);
    expect(n.filter((x) => /prix comp[ée]titifs|sans risque/i.test(x))).toEqual([]);
    expect(n.filter((x) => /^Armoire r[ée]frig[ée]r[ée]e pro/i.test(x))).toEqual([]);
  });
  it('un seul volume de 429 l, une seule plage de température', () => {
    expect((p.valeurs ?? []).filter((v) => /429/.test(v.valeur)).length).toBe(1);
    expect(noms(p).filter((x) => /^plage de temp[ée]rature/i.test(x)).length).toBe(1);
  });
  it('les mesures utiles restent (dimensions, classe énergie, tension)', () => {
    const t = (p.valeurs ?? []).map((v) => `${v.nom} ${v.valeur}`).join(' | ');
    expect(t).toMatch(/Largeur en mm 680/);
    expect(t).toMatch(/Classe d'efficacit[ée] [ée]nerg[ée]tique D/);
    expect(t).toMatch(/230 V/);
  });
});

describe('T25-8 : galaxus KS240L', () => {
  const p = lirePage(fixture('galaxus-ks240l'), new URL('https://www.galaxus.ch/de/s2/product/kibernetik-ks240l-242-l-kuehlschrank-freistehend-49548562'), 1);
  it('la longueur du câble (emballage) n\'est pas une dimension de l\'appareil', () => {
    expect((p.valeurs ?? []).filter((v) => /^L[äa]nge$/i.test(v.nom)).length).toBe(0);
  });
  it('« KS240L » est un modèle, pas un volume de 240 L : un seul volume, 242 l', () => {
    expect((p.valeurs ?? []).filter((v) => /^Volume$/i.test(v.nom)).length).toBe(0);
    expect((p.valeurs ?? []).filter((v) => /242/.test(v.valeur)).length).toBe(1);
  });
  it('les libellés restent ceux du vendeur (les critères du carnet s\'y rattachent par le nom)', () => {
    expect(noms(p)).toContain('Höhe');
    expect(noms(p)).toContain('Nutzvolumen Gesamt');
  });
});

describe('T25-7 : l\'IA ne range pas « non publié » comme une valeur', () => {
  it('la garde retire les valeurs absentes et les arguments de vente, garde les mesures', async () => {
    const { garder } = await import('../../functions/src/lienIA');
    const texte = 'Braumeister 20 Liter. Malzmenge: non publié. Max. Malzmenge 6 kg. Stromanschluss 230 V. Volume 20 Liter.';
    const { gardee } = garder({ caracteristiques: [
      { nom: 'Malzmenge', valeur: 'non publié' }, { nom: 'Max. Malzmenge', valeur: '6 kg' }, { nom: 'Stromanschluss', valeur: '230 V' },
      { nom: 'Volume', valeur: '20 Liter' }, { nom: 'Sans risque', valeur: 'service de retour de 14 jour' }, { nom: 'Prix compétitifs', valeur: 'Plus de 9 500 articles' }
    ] }, texte);
    expect(gardee.caracteristiques.map((c) => c.nom)).toEqual(['Max. Malzmenge', 'Stromanschluss', 'Volume']);
  });
  it('les noms légitimes ne sont pas pris pour du bruit', async () => {
    const { bruitDeBoutique } = await import('../../functions/src/lienPlateforme');
    for (const [n, v] of [['Dimensions (L, P, H)', '60 x 50 x 80 cm'], ['Max. Tragkraft pro Regalboden', '250 kg'], ['Garantie', '2 ans'], ['Puissance', '3000 W'], ['Hauteur', '2.010 mm']] as const) expect(bruitDeBoutique(n, v), n).toBe(false);
    for (const [n, v] of [['Malzmenge', 'non publié'], ['Gewicht', 'k. A.'], ['Livraison', 'gratuite dès 100 CHF']] as const) expect(bruitDeBoutique(n, v), n).toBe(true);
  });
});
