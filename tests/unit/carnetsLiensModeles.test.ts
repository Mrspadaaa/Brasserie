// @vitest-environment node
/*
 * Voie liens-modeles (24.11, D449) : « escalader devrait utiliser Neon plutôt que Hydrogen, et Hydrogen est dans le workflow automatique :
 * Flash-Lite ne trouve pas toutes les informations. »
 *   - le bouton Escalader (option `escalade`) va directement à Neon ;
 *   - l'automatique : Flash-Lite, puis Hydrogen dès qu'un champ de la fiche manque encore (prix, nom, caractéristiques sous le seuil,
 *     devise, frais écrits dans la page) ; jamais pour la photo ; un champ déjà trouvé n'est jamais remplacé ; 0 invention ;
 *   - le tarif de Neon : 3 / 15 USD le million, et le modèle est sur la liste blanche du serveur.
 * Aucun réseau, aucun Gemini : une IA simulée.
 */
import { describe, expect, it } from 'vitest';
import { champsManquants, completerParIA, fraisEcrits, garder, iaUtile, markdownProduit, mesuresEcrites, type AppelIA, type ModeleIA, type ReponseIA } from '../../functions/src/lienIA';
import { GEMINI_COST_POLICY, observedGeminiCost, quoteGeminiCost } from '../../functions/src/geminiCosts';
import { GEMINI_MODELS, LIEN_NEON_MODEL, assertGeminiModel } from '../../functions/src/models';
import type { PageLue } from '../../functions/src/carnetIA';

const TEXTE_BASE = 'Cuve de fermentation inox 60 l. Cuve de fermentation en acier inoxydable pour la brasserie, avec couvercle bombé, vanne de vidange et thermomètre intégré. Prix : CHF 289.00. Volume 60 l. Hauteur 85 cm. Diamètre 40 cm. Poids 12 kg. Épaisseur 2 mm.';
const html = (texte: string, titre = 'Cuve de fermentation inox 60 l') => `<!doctype html><html><head><title>${titre}</title></head><body><main><h1>${titre}</h1><p>${texte}</p></main></body></html>`;
const MESURES = [{ nom: 'Volume', valeur: '60 l' }, { nom: 'Hauteur', valeur: '85 cm' }, { nom: 'Poids', valeur: '12 kg' }, { nom: 'Épaisseur', valeur: '2 mm' }];
const page = (sur: Partial<PageLue> = {}): PageLue => ({
  url: 'https://boutique-exemple.ch/cuve', domaine: 'boutique-exemple.ch', statut: 'lue', nom: 'Cuve de fermentation inox 60 l', prix: 289, devise: 'CHF',
  photo: 'https://boutique-exemple.ch/cuve.jpg', photos: ['https://boutique-exemple.ch/cuve.jpg'], valeurs: MESURES, livraison: { gratuite: true }, etapes: [{ nom: 'page', statut: 'trouve' }], luLe: 0, ...sur
});
/** Une IA simulée : une réponse par modèle ; la liste des modèles appelés, dans l'ordre. */
function ia(reponses: Partial<Record<ModeleIA, ReponseIA | Error>>) {
  const appels: ModeleIA[] = [];
  const appel: AppelIA = async (m) => { appels.push(m); const r = reponses[m]; if (r instanceof Error) throw r; return r ?? { caracteristiques: [] }; };
  return { appels, appel };
}

describe('Escalader : directement Neon, jamais Flash-Lite ni Hydrogen', () => {
  it('un seul appel, au modèle « neon » ; l\'étape dit « IA plus forte », sans nom de modèle', async () => {
    const { appels, appel } = ia({ neon: { caracteristiques: [{ nom: 'Diamètre', valeur: '40 cm' }] } });
    const p = await completerParIA(page({ valeurs: [{ nom: 'Volume', valeur: '60 l' }] }), html(TEXTE_BASE), appel, { escalade: true });
    expect(appels).toEqual(['neon']);
    const e = p.etapes?.find((x) => x.nom === 'ia');
    expect(e?.detail).toMatch(/IA plus forte/);
    expect(e?.detail).not.toMatch(/neon|hydrogen|lite|fort\b|modèle/i);
    expect(p.valeurs?.some((v) => v.nom === 'Diamètre')).toBe(true);
  });
  it('même quand la fiche est complète (le brasseur l\'a demandé) : un seul appel, Neon', async () => {
    const { appels, appel } = ia({});
    await completerParIA(page(), html(TEXTE_BASE), appel, { escalade: true });
    expect(appels).toEqual(['neon']);
  });
  it('une panne de Neon ne se rejoue pas : aucun second appel, l\'étape dit « IA indisponible »', async () => {
    const { appels, appel } = ia({ neon: new Error('budget atteint') });
    const p = await completerParIA(page(), html(TEXTE_BASE), appel, { escalade: true });
    expect(appels).toEqual(['neon']);
    expect(p.etapes?.find((x) => x.nom === 'ia')).toMatchObject({ statut: 'absent', detail: expect.stringContaining('IA indisponible') });
  });
  it('la règle d\'avant (pour le banc) : escalade directe sur Hydrogen', async () => {
    const { appels, appel } = ia({});
    await completerParIA(page(), html(TEXTE_BASE), appel, { escalade: true, regleAvant: true });
    expect(appels).toEqual(['fort']);
  });
});

describe('Automatique : Flash-Lite, puis Hydrogen dès qu\'un champ manque encore', () => {
  it('fiche complète après Flash-Lite : un seul appel', async () => {
    const { appels, appel } = ia({ lite: { prix: 289, devise: 'CHF', caracteristiques: [] } });
    await completerParIA(page(), html(TEXTE_BASE), appel);
    expect(appels).toEqual(['lite']);
  });

  it('caractéristiques sous le seuil après Flash-Lite : Hydrogen complète, sans rien remplacer', async () => {
    const lite: ReponseIA = { caracteristiques: [{ nom: 'Volume', valeur: '60 l' }] };
    const fort: ReponseIA = { prix: 250, devise: 'CHF', caracteristiques: [{ nom: 'Volume', valeur: '45 l' }, { nom: 'Hauteur', valeur: '85 cm' }, { nom: 'Diamètre', valeur: '40 cm' }, { nom: 'Poids', valeur: '12 kg' }] };
    const { appels, appel } = ia({ lite, fort });
    const p = await completerParIA(page({ valeurs: [{ nom: 'Poids', valeur: '12 kg' }] }), html(TEXTE_BASE), appel);
    expect(appels).toEqual(['lite', 'fort']);
    expect(p.valeurs?.find((v) => v.nom === 'Volume')?.valeur).toBe('60 l'); // celui de Flash-Lite, écrit dans le texte ; « 45 l » n'y est pas
    expect(p.valeurs?.map((v) => v.nom)).toEqual(expect.arrayContaining(['Poids', 'Volume', 'Hauteur', 'Diamètre']));
    expect(p.prix).toBe(289); // la page publie 289 : un prix de la relecture ne remplace jamais le prix publié
    expect(p.etapes?.find((x) => x.nom === 'ia')?.detail).toMatch(/relu par une IA plus forte/);
  });

  it('un prix que la page ne publie pas, absent de l\'IA légère : Hydrogen le lit (comme avant)', async () => {
    const { appels, appel } = ia({ lite: { caracteristiques: [] }, fort: { prix: 289, devise: 'CHF', caracteristiques: [] } });
    const p = await completerParIA(page({ prix: undefined, devise: undefined }), html(TEXTE_BASE), appel);
    expect(appels).toEqual(['lite', 'fort']);
    expect(p.prix).toBe(289);
    expect(p.devise).toBe('CHF');
  });

  it('un nom absent de la page : Hydrogen le lit s\'il est écrit dans le texte', async () => {
    const { appels, appel } = ia({ lite: { caracteristiques: [] }, fort: { nom: 'Cuve de fermentation inox 60 l', caracteristiques: [] } });
    const p = await completerParIA(page({ nom: undefined }), html(TEXTE_BASE), appel);
    expect(appels).toEqual(['lite', 'fort']);
    expect(p.nom).toBe('Cuve de fermentation inox 60 l');
  });

  it('des frais de port écrits que Flash-Lite n\'a pas lus : Hydrogen les lit', async () => {
    const texte = `${TEXTE_BASE} Livraison en Suisse : CHF 9.90 pour une commande.`;
    const { appels, appel } = ia({ lite: { caracteristiques: [] }, fort: { portSuisse: 9.9, caracteristiques: [] } });
    const p = await completerParIA(page({ livraison: undefined }), html(texte), appel);
    expect(appels).toEqual(['lite', 'fort']);
    expect(p.livraison).toEqual({ prix: 9.9, devise: 'CHF' });
  });

  it('la page ne parle pas de frais : pas d\'Hydrogen pour eux', async () => {
    const { appels, appel } = ia({});
    await completerParIA(page({ livraison: undefined }), html(TEXTE_BASE), appel);
    expect(appels).toEqual(['lite']);
  });

  it('un texte qui n\'écrit pas plus de mesures que celles déjà lues : pas d\'Hydrogen (il n\'aurait rien à trouver)', async () => {
    const texte = 'Pompe de transfert en acier inoxydable pour le brassage, moteur silencieux, raccords Tri-Clamp, adaptée aux moûts et aux bières finies. Prix : CHF 189.00. Débit 20 l/min, poids 3.2 kg.';
    const { appels, appel } = ia({ lite: { caracteristiques: [{ nom: 'Débit', valeur: '20 l/min' }] } });
    await completerParIA(page({ nom: 'Pompe de transfert', prix: 189, valeurs: [{ nom: 'Poids', valeur: '3.2 kg' }] }), html(texte, 'Pompe de transfert'), appel);
    expect(appels).toEqual(['lite']); // 2 mesures lues, 2 écrites : rien de plus à lire
    expect(mesuresEcrites(texte)).toBe(2);
  });

  it('la photo manquante ne déclenche jamais Hydrogen (elle ne vient pas de l\'IA)', async () => {
    const { appels, appel } = ia({});
    await completerParIA(page({ photo: undefined, photos: undefined }), html(TEXTE_BASE), appel);
    expect(appels).toEqual(['lite']);
  });

  it('0 invention : une valeur d\'Hydrogen absente du texte est retirée, l\'étape dit « douteux »', async () => {
    const { appels, appel } = ia({ lite: { caracteristiques: [] }, fort: { caracteristiques: [{ nom: 'Puissance', valeur: '3000 W' }, { nom: 'Diamètre', valeur: '40 cm' }] } });
    const p = await completerParIA(page({ valeurs: [{ nom: 'Poids', valeur: '12 kg' }] }), html(TEXTE_BASE), appel);
    expect(appels).toEqual(['lite', 'fort']);
    expect(p.valeurs?.some((v) => v.nom === 'Puissance')).toBe(false);
    expect(p.valeurs?.some((v) => v.nom === 'Diamètre')).toBe(true);
    expect(p.etapes?.find((x) => x.nom === 'ia')).toMatchObject({ statut: 'douteux', detail: expect.stringContaining('Puissance') });
  });

  it('0 invention : une livraison gratuite écrite pour l\'Autriche n\'est pas la livraison vers la Suisse (n° 47 du banc)', async () => {
    const texte = `${TEXTE_BASE} Versandkostenfreie Lieferung nach Österreich ab 100 EUR. Versand ins Ausland auf Anfrage.`;
    const { appel } = ia({ lite: { portGratuit: true, caracteristiques: [] }, fort: { portGratuit: true, portSuisse: 100, caracteristiques: [] } });
    const p = await completerParIA(page({ livraison: undefined }), html(texte), appel);
    expect(p.livraison).toBeUndefined();
    expect(p.etapes?.find((x) => x.nom === 'ia')?.detail).toMatch(/retiré.*port/);
    expect(fraisEcrits(texte)).toBe(false); // et l'IA plus forte ne se lance pas pour des frais qui ne sont pas les nôtres
  });
  it('les codes pays valent des noms de pays : « Lieferung nach DE AT » n\'est pas la Suisse (n° 47 du banc)', () => {
    expect(garder({ portGratuit: true, caracteristiques: [] }, 'inkl. 20% USt. , Versandkostenfreie Lieferung nach DE AT. Versand ').gardee.portGratuit).toBeUndefined();
  });
  it('un port nommé pour la Suisse, ou sans autre pays, est gardé', () => {
    expect(garder({ portSuisse: 9.9, caracteristiques: [] }, 'Livraison en Suisse : CHF 9.90').gardee.portSuisse).toBe(9.9);
    expect(garder({ portGratuit: true, caracteristiques: [] }, 'Livraison gratuite dès CHF 100.').gardee.portGratuit).toBe(true);  });

  it('une panne de Flash-Lite ne s\'escalade pas (elle se répéterait) ; une panne d\'Hydrogen garde ce que Flash-Lite a lu', async () => {
    const a = ia({ lite: new Error('budget atteint') });
    await completerParIA(page({ valeurs: [] }), html(TEXTE_BASE), a.appel);
    expect(a.appels).toEqual(['lite']);
    const b = ia({ lite: { caracteristiques: [{ nom: 'Volume', valeur: '60 l' }] }, fort: new Error('délai') });
    const p = await completerParIA(page({ valeurs: [] }), html(TEXTE_BASE), b.appel);
    expect(b.appels).toEqual(['lite', 'fort']);
    expect(p.valeurs?.some((v) => v.nom === 'Volume')).toBe(true);
  });

  it('la règle d\'avant (pour le banc) : Hydrogen seulement pour le prix', async () => {
    const { appels, appel } = ia({});
    await completerParIA(page({ valeurs: [] }), html(TEXTE_BASE), appel, { regleAvant: true });
    expect(appels).toEqual(['lite']);
  });
});

describe('champsManquants, fraisEcrits, iaUtile', () => {
  it('liste ce qui manque, page et IA ensemble', () => {
    const g = garder({ caracteristiques: [{ nom: 'Volume', valeur: '60 l' }] }, TEXTE_BASE).gardee;
    expect(champsManquants(page(), g, TEXTE_BASE)).toEqual([]);
    expect(champsManquants(page({ prix: undefined, devise: undefined, nom: undefined, valeurs: [] }), { caracteristiques: [] }, TEXTE_BASE)).toEqual(['prix', 'nom', 'caracteristiques']);
    expect(champsManquants(page({ devise: undefined }), g, TEXTE_BASE)).toEqual(['devise']);
  });
  it('les frais sont « écrits » quand un mot de livraison est suivi d\'un montant ou de « gratuit »', () => {
    expect(fraisEcrits('Livraison en Suisse : CHF 9.90')).toBe(true);
    expect(fraisEcrits('Versandkosten: 12,50 EUR')).toBe(true);
    expect(fraisEcrits('Livraison gratuite dès 100 francs')).toBe(true);
    expect(fraisEcrits('Livraison rapide. Prix : CHF 289.00 ; nous livrons partout')).toBe(false);
    expect(fraisEcrits(TEXTE_BASE)).toBe(false);
    expect(fraisEcrits('Livraison offerte au prix de CHF 289.00', [289])).toBe(false); // le prix du produit n'est pas un port
  });
  it('l\'IA est utile aussi quand le nom manque', () => {
    expect(iaUtile(page({ valeurs: [...MESURES] }))).toBe(true); // D450 (24.11) : une page lue, même complète, est toujours relue par l'IA, pour s'accorder avec les données
    expect(iaUtile(page({ nom: undefined }))).toBe(true);
  });
});

describe('markdownProduit : un `nav` qui porte la description reste lu (n° 26 du banc, sios.ch)', () => {
  const description = 'Beschreibung. Jetzt noch neuer: wie das Original, nur besser. Der Braumeister PLUS 20 Liter braut bis zu 20 Liter Bier. Maximale Malzmenge 6 kg, Gehäuse aus Edelstahl, Heizleistung 2000 W, Umwälzpumpe, Steuerung mit Rastplänen, Zubehör im Lieferumfang enthalten, Maischen und Kochen in einem Gerät. Die Anlage ist für Hobbybrauer und kleine Brauereien gedacht, einfach zu reinigen, robust verarbeitet und mit allen nötigen Anschlüssen für den Betrieb an der Steckdose ausgestattet, inklusive Anleitung und Rezeptbuch.';
  const page = (nav: string) => `<!doctype html><html><body><main><h1>Braumeister PLUS 20 Liter</h1><p>Preis 2190 CHF.</p><nav>${nav}</nav></main></body></html>`;
  it('une navigation de liens est retirée ; un onglet de texte est gardé', () => {
    const liens = Array.from({ length: 30 }, (_, i) => `<a href="/c${i}">Rubrique numéro ${i} de la boutique</a>`).join(' ');
    expect(markdownProduit(page(liens), 'Braumeister PLUS')).not.toMatch(/Rubrique numéro/);
    const t = markdownProduit(page(`<ul class="tab-navigation"><li><a href="#d">Beschreibung</a></li><li><a href="#q">Frage zum Artikel</a></li></ul><div>${description}</div>`), 'Braumeister PLUS');
    expect(t).toMatch(/Malzmenge 6 kg/);
    expect(t).toMatch(/Edelstahl/);
  });
});

describe('Neon : tarif et liste blanche', () => {
  const corps = { contents: [{ role: 'user', parts: [{ text: 'x'.repeat(2000) }] }], generationConfig: { maxOutputTokens: 1500 } };
  it('le modèle est autorisé par le serveur', () => {
    expect(LIEN_NEON_MODEL).toBe('gemini-4-neon');
    expect((GEMINI_MODELS as readonly string[]).includes(LIEN_NEON_MODEL)).toBe(true);
    expect(() => assertGeminiModel(LIEN_NEON_MODEL)).not.toThrow();
  });
  it('3 / 15 USD le million : exactement le double d\'Hydrogen (1,5 / 7,5), au devis comme au règlement', () => {
    const at = Date.parse('2026-11-24T10:00:00+01:00');
    const n = quoteGeminiCost(LIEN_NEON_MODEL, corps, at), h = quoteGeminiCost('gemini-4-hydrogen', corps, at);
    expect(Math.abs(n.reservedMicroChf - h.reservedMicroChf * 2)).toBeLessThanOrEqual(1); // chaque devis arrondi au micro-franc supérieur
    const usage = { usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 100, thoughtsTokenCount: 200, totalTokenCount: 1300 } };
    // (1000 × 3 + 300 × 15) USD par million = 0,0075 USD ; × 1,25 CHF/USD = 0,009375 CHF
    expect(observedGeminiCost(n, usage)).toBe(Math.ceil(0.0075 * GEMINI_COST_POLICY.chfPerUsd * 1e6));
    expect(observedGeminiCost(h, usage)).toBe(Math.ceil(0.00375 * GEMINI_COST_POLICY.chfPerUsd * 1e6));
  });
});
