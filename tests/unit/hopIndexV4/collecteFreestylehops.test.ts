// Voie c3f (#180) : lecteur Freestyle Hops sur du HTML synthétique (structure imitée, texte inventé).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { extraire, lirePageVariete, lirePlan, lireRobots } from '../../../scripts/collecte-hop/freestylehops.mjs';

const page = (titre: string, corps: string[]) =>
  `<html><head><title>${titre} - Freestyle Hops</title></head><body><nav><a>Buy Hops</a></nav><div class="typography"><p><a href="/hops/search?varietal%5B0%5D=x"> View In Webstore </a></p>${corps.map(x => `<p>${x}</p>`).join('')}</div><a>Close Menu</a><footer>Contact</footer></body></html>`;

describe('lecteur Freestyle Hops', () => {
  it('lit le titre, la marque et le corps entre « View In Webstore » et « Close Menu »', () => {
    const p = lirePageVariete(page('Freestyle Exemplum®', ['Texte A.', 'Texte B.']))!;
    expect(p.nom).toBe('Exemplum');
    expect(p.marque).toBe('®');
    expect(p.corps).toEqual(['Texte A.', 'Texte B.']);
    expect(lirePageVariete(page('Exemplum by Freestyle', ['x']))!.nom).toBe('Exemplum');
    expect(lirePageVariete('<html><body>sans titre</body></html>')).toBeNull();
  });

  it('repère les mots d’arôme du vocabulaire, écarte les mots niés et les phrases d’accord', () => {
    const p = lirePageVariete(page('Exemplum', [
      'Exemplum has bright lime and papaya aromas, with none of the pine notes of northern hemisphere hops, and a floral background.',
      'Exemplum pairs well with a hop like Faux Cross which delivers citrus-y depth.',
    ]))!;
    const { listes } = extraire(p, 'exemplum');
    expect(listes.descripteurs).toEqual(expect.arrayContaining(['lime', 'papaya', 'floral']));
    expect(listes.descripteurs).not.toContain('pine');
    expect(listes.descripteurs).not.toContain('citrus');
  });

  it('lit les accords nommés (sans la variété elle-même), les stades de récolte et les thiols', () => {
    const p = lirePageVariete(page('Rakau', [
      'Later harvest Rakau has a stone fruit aroma. Earlier/mid harvest lots are fresher.',
      'Rakau pairs well with a high free thiol hop like Nelson Sauvin or Waimea. Rakau also pairs well with Rakau.',
      'The blend holds bound 3SH and 3S4MP precursors.',
    ]))!;
    const { listes } = extraire(p, 'rakau');
    expect(listes.accords).toEqual(['Nelson Sauvin', 'Waimea']);
    expect(listes.stadesRecolte).toEqual(['early', 'mid', 'late']);
    expect(listes.thiols).toEqual(['3S4MP', '3SH']);
  });

  it('lit la composition d’un mélange, les lots d’un coffret et les valeurs de produit', () => {
    const m = extraire(lirePageVariete(page('Mix™', [
      'Our Mix blend combines Nelson Sauvin and Rakau with fruit. It is 0.45 brix (4.5g of total sugars per kg of pellets).',
      'We recommend whirlpool dosage rates from 4 g/L upwards.',
    ]))!, 'kohia-nelson');
    expect(m.listes.composition).toEqual(['Nelson Sauvin', 'Rakau']);
    expect(m.champs.sucresBrix).toMatchObject({ valeur: 0.45, unite: 'brix' });
    expect(m.champs.sucresTotaux).toMatchObject({ valeur: 4.5, unite: 'g/kg' });
    expect(m.champs.dosageWhirlpool).toMatchObject({ valeur: null, min: 4, unite: 'g/L' });
    const c = extraire(lirePageVariete(page('Coffret', ['Quatre variétés.', 'Nelson Sauvin - Late Harvest - Sweet Tropical, Pink Grapefruit, Light Cannabis', 'Riwaka - Mid Harvest - Yuzu']))!, 'singles-collection');
    expect(c.extra.lots).toHaveLength(2);
    expect(c.extra.lots[0]).toMatchObject({ variete: 'Nelson Sauvin', recolte: 'late', descripteurs: ['sweet tropical', 'pink grapefruit', 'light cannabis'] });
    expect(c.listes.composition).toEqual(['Nelson Sauvin', 'Riwaka']);
  });

  it('une valeur absente reste absente : aucun champ inventé, jamais 0', () => {
    const { champs } = extraire(lirePageVariete(page('Vide', ['Un houblon aromatique.']))!, 'vide');
    expect(champs).toEqual({});
  });

  it('robots.txt : « User-agent: * » l’emporte, les agents nommés interdits ne s’appliquent pas à lui', () => {
    const permis = lireRobots('User-agent: *\nAllow: /\n\nUser-agent: ClaudeBot\nDisallow: /\n\nUser-agent: Foo\nUser-agent: Bar\nDisallow: /\n');
    expect(permis('/hop-varieties/riwaka/')).toBe(true);
    expect(lireRobots('User-agent: *\nDisallow: /account/\n')('/account/x')).toBe(false);
  });

  it('plan du site : ne garde que les pages /hop-varieties/<x>/ et leur date', () => {
    const xml = '<urlset><url><loc>https://h/hop-varieties/riwaka/</loc><lastmod>2025-11-24T20:40:01+13:00</lastmod></url><url><loc>https://h/hops/riwaka-t90-hop-pellets-45/</loc><lastmod>2026-01-01</lastmod></url><url><loc>https://h/hop-varieties/</loc></url></urlset>';
    const { urls, modifie } = lirePlan(xml);
    expect(urls).toEqual(['https://h/hop-varieties/riwaka/']);
    expect(modifie['https://h/hop-varieties/riwaka/']).toBe('2025-11-24');
  });
});

describe('réseau Freestyle Hops', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.resetModules(); });
  it('hors ligne, une page absente du cache lève une erreur sans appeler fetch', async () => {
    vi.stubEnv('HOP_SOURCE_OFFLINE', '1');
    vi.stubEnv('HOP_SOURCE_CACHE', 'C:/chemin/inexistant/cache-freestyle-test');
    const fetchEspion = vi.spyOn(globalThis, 'fetch');
    const { lire } = await import('../../../scripts/collecte-hop/freestylehops-reseau.mjs');
    await expect(lire('https://www.freestylehops.com/hop-varieties/absente/')).rejects.toThrow(/Hors ligne/);
    expect(fetchEspion).not.toHaveBeenCalled();
  });
});
