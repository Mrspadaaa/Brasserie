// @vitest-environment node
/*
 * Reprise du 23.11 soir, voie « liens » (T25-8, T26-1, T26-3 et l'option `escalade`), la part du serveur :
 *   - les libellés de caractéristiques en français ; le volume « Nutzvolumen Gesamt 242 l » repris sous « Volume » ;
 *   - la longueur du câble ou du colis jamais présentée comme dimension ;
 *   - une page bloquée lue par Google : « photo non lue » dit à l'étape `photos` ;
 *   - `escalade` : l'IA va directement au modèle fort.
 * Aucun réseau, aucun Gemini : un faux fetch, une IA simulée. Pages : fixtures tirées des vraies pages galaxus.ch du banc (63 liens).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { lireLien } from '../../functions/src/lireLien';
import { cleTechnique, libelleFrancais, traduireValeurs } from '../../functions/src/lienLibelles';
import { LIEN_IA_CONSIGNE, type AppelIA, type ReponseIA } from '../../functions/src/lienIA';
import { lireLienTache, type DocLecture, type MagasinLecture } from '../../functions/src/lecturesLiens';
import { pageLueParGoogle } from '../../functions/src/lienBloquee';
import type { PageLue } from '../../functions/src/carnetIA';

const fixture = (nom: string) => readFileSync(new URL(`../fixtures/carnets/${nom}`, import.meta.url), 'utf8');
const SANS_IA = { cours: null } as const;

/** Un faux réseau : robots.txt absent (permis), la page à son adresse. */
function reseau(adresse: string, corps: string): typeof fetch {
  return (async (entree: RequestInfo | URL) => {
    const u = new URL(String(entree));
    if (u.pathname === '/robots.txt') return new Response('', { status: 404 });
    if (u.href === adresse) return new Response(corps, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
    throw new Error(`réseau interdit dans les tests : ${u.href}`);
  }) as typeof fetch;
}
const GALAXUS_DE = 'https://www.galaxus.ch/de/s2/product/kibernetik-ks240l-242-l-kuehlschrank-freistehend-49548562';
const GALAXUS_FR = 'https://www.galaxus.ch/fr/s2/product/kibernetik-ks240l-242-l-kuehlschrank-freistehend-49548562';

describe('T25-8 / T26-1 : Galaxus KS240L, libellés en français, volume 242 l repris', () => {
  for (const [langue, adresse, fichier] of [['allemand', GALAXUS_DE, 'galaxus-ks240l-de.html'], ['français', GALAXUS_FR, 'galaxus-ks240l-fr.html']] as const) {
    it(`la page en ${langue} : « Volume 242 l », aucun libellé allemand, rien du colis ni du câble`, async () => {
      const page = await lireLien(adresse, { fetchPage: reseau(adresse, fixture(fichier)), ...SANS_IA });
      expect(page.statut).toBe('lue');
      const valeurs = page.valeurs ?? [];
      const volume = valeurs.find((v) => v.nom === 'Volume');
      expect(volume?.valeur).toBe('242 l');
      // aucun nom en allemand (la lecture donnait « Kühlschranktyp », « Höhe », « Nutzvolumen Gesamt »)
      for (const v of valeurs) expect(v.nom, v.nom).not.toMatch(/[äöüß]|Nutz|Kühl|Breite|Höhe|Gewicht|Klima|Geräusch|Merkmale|typ$/i);
      expect(valeurs.map((v) => v.nom)).toEqual(expect.arrayContaining(['Largeur', 'Hauteur', 'Poids']));
      // la longueur de 140 cm est celle du colis, et le câble n'est jamais une « Longueur » : aucune dimension de ce nom
      expect(valeurs.some((v) => /140/.test(v.valeur))).toBe(false);
      expect(valeurs.some((v) => /^(?:Longueur|Länge)$/i.test(v.nom))).toBe(false);
      // chaque nom est unique (la fiche et la liste rangent par nom)
      expect(new Set(valeurs.map((v) => v.nom.toLowerCase())).size).toBe(valeurs.length);
    });
  }
});

describe('la table des libellés', () => {
  it('traduit les clés connues, avec l\'unité du nom', () => {
    expect(libelleFrancais('Nutzvolumen Gesamt')).toBe('Volume');
    expect(libelleFrancais('Volume utile total')).toBe('Volume');
    expect(libelleFrancais('Kühlschranktyp')).toBe('Type de réfrigérateur');
    expect(libelleFrancais('Höhe')).toBe('Hauteur');
    expect(libelleFrancais('Breite in mm')).toBe('Largeur en mm');
    expect(libelleFrancais('Anschluss in Volt')).toBe('Raccordement en volt');
    expect(libelleFrancais('Kühlvolumen [Liter]')).toBe('Volume de réfrigération [Litres]');
    expect(libelleFrancais('Geräuschpegel (max.)')).toBe('Niveau sonore (max.)');
    expect(libelleFrancais('Depth')).toBe('Profondeur');
    expect(libelleFrancais('Erntejahr')).toBe('Récolte');
  });
  it('une longueur de câble garde son nom entier, jamais « Longueur »', () => {
    expect(libelleFrancais('Kabellänge')).toBe('Longueur du câble');
    expect(libelleFrancais('Länge')).toBe('Longueur');
    expect(libelleFrancais('Longueur du câble')).toBe('Longueur du câble');
  });
  it('un nom ou un mot inconnu reste tel que la page l\'écrit (rien d\'inventé) ; le nombre s\'écrit à la suisse (T28-13), jamais autrement', () => {
    expect(libelleFrancais('Zilla Labs')).toBe('Zilla Labs');
    const sortie = traduireValeurs([{ nom: 'Höhe', valeur: '143.50 cm' }, { nom: 'Zilla Labs', valeur: 'x' }]);
    expect(sortie).toEqual([{ nom: 'Hauteur', valeur: '143,5 cm' }, { nom: 'Zilla Labs', valeur: 'x' }]);
  });
  it('idempotent : repasser sur du français ne change rien', () => {
    const v = [{ nom: 'Volume', valeur: '242 l' }, { nom: 'Largeur', valeur: '54 cm' }, { nom: 'Poids', valeur: '38 kg' }];
    expect(traduireValeurs(v)).toEqual(v);
    expect(traduireValeurs(traduireValeurs([{ nom: 'Nutzvolumen Gesamt', valeur: '242 l' }]))).toEqual([{ nom: 'Volume', valeur: '242 l' }]);
  });
  it('deux noms qui deviennent le même : la même valeur ne se répète pas, une valeur différente garde son nom d\'origine', () => {
    expect(traduireValeurs([{ nom: 'Volumen', valeur: '60 l' }, { nom: 'Volume', valeur: '60 L' }])).toEqual([{ nom: 'Volume', valeur: '60 l' }]);
    const deux = traduireValeurs([{ nom: 'Nutzvolumen', valeur: '242 l' }, { nom: 'Volumen', valeur: '200 l' }])!;
    expect(deux.map((v) => v.nom)).toEqual(['Volume', 'Volumen']);
  });
  it('une clé technique de la page n\'est pas un libellé', () => {
    expect(cleTechnique('account_menu.signed_out_state.sheet_title')).toBe(true);
    expect(cleTechnique('openai_export')).toBe(true);
    expect(cleTechnique('Höhe')).toBe(false);
    expect(traduireValeurs([{ nom: 'account_menu.aria_labels.close_menu', valeur: 'Fermer' }, { nom: 'Höhe', valeur: '10 cm' }])).toEqual([{ nom: 'Hauteur', valeur: '10 cm' }]);
  });
  it('la consigne de l\'IA demande des noms français', () => {
    expect(LIEN_IA_CONSIGNE).toMatch(/écrit en français/);
    expect(LIEN_IA_CONSIGNE).toMatch(/Longueur du câble/);
  });
  it('le nom que l\'IA écrit en allemand est rendu en français, le doublon de la page ne revient pas', async () => {
    const adresse = 'https://boutique-exemple.ch/produit/cuve';
    const html = pageAvecTexte({ mesures: 1 });
    const ia: AppelIA = async () => ({ caracteristiques: [{ nom: 'Nutzvolumen Gesamt', valeur: '242 l' }, { nom: 'Höhe', valeur: '143.50 cm' }] });
    const page = await lireLien(adresse, { fetchPage: reseau(adresse, html), ia, ...SANS_IA });
    const noms = (page.valeurs ?? []).map((v) => v.nom);
    expect(noms).toContain('Volume');
    expect(noms).toContain('Hauteur');
    expect(noms.some((n) => /Nutz|Höhe/.test(n))).toBe(false);
  });
});

/** Une page produit dont le texte dépasse 200 caractères (l'IA lit le texte) ; `mesures` : combien de mesures publiées en données. */
function pageAvecTexte({ mesures }: { mesures: number }): string {
  const props = [['Breite', '54 cm'], ['Tiefe', '55 cm'], ['Gewicht', '38 kg'], ['Spannung', '230 V']].slice(0, mesures)
    .map(([name, value]) => ({ '@type': 'PropertyValue', name, value }));
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: 'Cuve de test KS240L', offers: { '@type': 'Offer', price: '302', priceCurrency: 'CHF', availability: 'https://schema.org/InStock' }, ...(props.length ? { additionalProperty: props } : {}) };
  const texte = 'Cuve de test KS240L. Réfrigérateur à boissons pour la cave, avec une grande porte, des clayettes réglables et un éclairage intérieur. Nutzvolumen Gesamt 242 l. Höhe 143.50 cm. Breite 54 cm. Tiefe 55 cm. Gewicht 38 kg. Spannung 230 V. Livraison en Suisse sous cinq jours ouvrables.';
  return `<!doctype html><html><head><meta charset="utf-8"><title>Cuve de test KS240L</title><script type="application/ld+json">${JSON.stringify(ld)}</script></head><body><main><h1>Cuve de test KS240L</h1><p>${texte}</p></main></body></html>`;
}

describe('option `escalade` : l\'étape IA va directement au modèle fort', () => {
  const adresse = 'https://boutique-exemple.ch/produit/cuve';
  const reponse: ReponseIA = { caracteristiques: [{ nom: 'Hauteur', valeur: '143.50 cm' }] };

  it('sans escalade : Flash-Lite d\'abord, rien ne change', async () => {
    const appels: string[] = [];
    const ia: AppelIA = async (modele) => { appels.push(modele); return reponse; };
    const page = await lireLien(adresse, { fetchPage: reseau(adresse, pageAvecTexte({ mesures: 1 })), ia, ...SANS_IA });
    expect(appels).toEqual(['lite']);
    /* T30-11 : l'étape dit ce qu'elle a fait, jamais un nom de modèle */
    expect(page.etapes?.find((e) => e.nom === 'ia')?.detail).not.toMatch(/lite|fort|modèle/i);
  });

  it('avec escalade : un seul appel, au modèle fort, et l\'étape le dit', async () => {
    const appels: string[] = [];
    const ia: AppelIA = async (modele) => { appels.push(modele); return reponse; };
    const page = await lireLien(adresse, { fetchPage: reseau(adresse, pageAvecTexte({ mesures: 1 })), ia, escalade: true, ...SANS_IA });
    expect(appels).toEqual(['fort']);
    const etape = page.etapes?.find((e) => e.nom === 'ia');
    expect(etape?.detail).toMatch(/IA plus forte/);
    expect(etape?.detail).not.toMatch(/lite/);
    expect(page.valeurs?.some((v) => v.nom === 'Hauteur')).toBe(true);
  });

  it('avec escalade, l\'IA passe même quand la page paraît complète (le brasseur a demandé une lecture plus fine)', async () => {
    const appels: string[] = [];
    const ia: AppelIA = async (modele) => { appels.push(modele); return reponse; };
    await lireLien(adresse, { fetchPage: reseau(adresse, pageAvecTexte({ mesures: 4 })), ia, escalade: true, ...SANS_IA });
    expect(appels).toEqual(['fort']);
    appels.length = 0;
    await lireLien(adresse, { fetchPage: reseau(adresse, pageAvecTexte({ mesures: 4 })), ia, ...SANS_IA });
    expect(appels).toEqual([]);
  });

  it('une panne du modèle fort ne se rejoue pas (aucun second appel)', async () => {
    const appels: string[] = [];
    const ia: AppelIA = async (modele) => { appels.push(modele); throw new Error('budget atteint'); };
    const page = await lireLien(adresse, { fetchPage: reseau(adresse, pageAvecTexte({ mesures: 1 })), ia, escalade: true, ...SANS_IA });
    expect(appels).toEqual(['fort']);
    expect(page.etapes?.find((e) => e.nom === 'ia')).toMatchObject({ statut: 'absent', detail: expect.stringContaining('IA indisponible') });
  });

  it('sans IA (clé absente), escalade n\'appelle rien', async () => {
    const page = await lireLien(adresse, { fetchPage: reseau(adresse, pageAvecTexte({ mesures: 1 })), escalade: true, ...SANS_IA });
    expect(page.etapes?.some((e) => e.nom === 'ia')).toBe(false);
  });
});

describe('`aiTask` lireLien avec `context.escalade`', () => {
  const JETON = 'jeton-escalade-0123456789';
  const URL_PAGE = 'https://boutique-exemple.ch/produit/cuve';
  const PAGE: PageLue = { url: URL_PAGE, domaine: 'boutique-exemple.ch', statut: 'lue', nom: 'Cuve', luLe: 1 };
  function magasinFini() {
    const docs = new Map<string, DocLecture>([[JETON, { uid: 'u1', url: URL_PAGE, statut: 'fini', etapes: [], page: PAGE, creeLe: 1, majLe: 1 }]]);
    const magasin: MagasinLecture = { lire: async (j) => docs.get(j), ecrire: async (j, d) => { docs.set(j, structuredClone(d)); } };
    return magasin;
  }
  it('sans escalade, un jeton fini rend la page gardée sans rien relire', async () => {
    const lire = vi.fn(async () => PAGE);
    await lireLienTache({ uid: 'u1', context: { url: URL_PAGE, jeton: JETON }, magasin: magasinFini(), lire });
    expect(lire).not.toHaveBeenCalled();
  });
  it('avec escalade, la lecture est neuve (jamais la page gardée) et reçoit `escalade: true`', async () => {
    const lire = vi.fn(async (_u: string, _o: Parameters<typeof lireLien>[1]) => PAGE);
    await lireLienTache({ uid: 'u1', context: { url: URL_PAGE, jeton: JETON, escalade: true }, magasin: magasinFini(), lire });
    expect(lire).toHaveBeenCalledTimes(1);
    expect(lire.mock.calls[0][1]).toMatchObject({ escalade: true });
  });
  it('sans escalade dans le contexte, l\'option n\'est pas posée', async () => {
    const lire = vi.fn(async (_u: string, _o: Parameters<typeof lireLien>[1]) => PAGE);
    await lireLienTache({ uid: 'u1', context: { url: URL_PAGE }, magasin: magasinFini(), lire });
    expect(lire.mock.calls[0][1]).not.toHaveProperty('escalade');
  });
});

describe('T26-3 : une page bloquée lue par Google dit que sa photo n\'est pas lue', () => {
  it('l\'étape `photos` est absente et dit « photo non lue »', () => {
    const url = new URL('https://brouwland.com/en/fermentation-vessels/660-brew-monk-stainless-steel-fermenter-30-l.html');
    const { page } = pageLueParGoogle(url, {
      reponse: { type: 'fiche', nom: 'Brew Monk stainless steel fermenter 30 L', prix: 159.99, devise: 'EUR', taxe: 'ttc', caracteristiques: [{ nom: 'Volume', valeur: '30 L' }] },
      lectures: [{ adresse: url.href, statut: 'URL_RETRIEVAL_STATUS_SUCCESS' }], jetonsPage: 4000
    }, 1);
    const photos = page?.etapes?.find((e) => e.nom === 'photos');
    expect(photos?.statut).toBe('absent');
    expect(photos?.detail).toMatch(/photo non lue/);
    expect(page?.photo).toBeUndefined();
  });
});
