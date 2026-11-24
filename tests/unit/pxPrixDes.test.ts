/**
 * Voie prix-houblon2 (24.11) : « ce genre de lien » = une page à prix par paliers de quantité (n° 45 du banc, braupartner.de, Citra pellets : 8,00 € les 100 g, 7,65 dès 500 g,
 * 7,29 dès 1 000 g). Le schema.org ne publie que le plus bas (« dès 7,29 », sans quantité) ; la page entière lue par l'IA dit « 8 € pour 100 g ». Avant : « dès 7,29 »
 * sans quantité (un nombre nu, R39) + un faux désaccord « douteux ». Après : le prix du plus petit conditionnement, avec sa quantité (R41), sans doute.
 * Page RÉELLE du banc (pages/45.html.gz) ; la réponse du modèle est simulée avec les valeurs que Flash-Lite et Hydrogen ont réellement rendues au banc (24.11) : 8 EUR, 100 g.
 * Aucun réseau, aucun Gemini.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { accordPrix, completerParIA, precisePrixDes, type Gardee } from '../../functions/src/lienIA';
import { lirePage } from '../../functions/src/lireLien';

const PAGES = path.resolve('work/missions/2026-11-23-carnet-en-ligne/banc-liens/pages');
const html = zlib.gunzipSync(fs.readFileSync(path.join(PAGES, '45.html.gz'))).toString('utf8');
const URL45 = 'https://www.braupartner.de/citra-r-hopfenpellets';
const lue = () => ({ ...(lirePage(html, new URL(URL45), 0) as any), statut: 'lue', luLe: 0 });
const appel = (r: Record<string, unknown>) => async () => ({ nom: null, taxe: null, prixDes: null, portSuisse: null, portGratuit: null, caracteristiques: [], ...r }) as any;

describe('un « dès » sans quantité est précisé par la quantité que la page entière écrit', () => {
  it('avant l\'IA : la page publie « dès 7,29 » sans conditionnement (le constat)', () => {
    const p = lue();
    expect(p.prix).toBe(7.29);
    expect(p.prixDes).toBe(true);
    expect(p.conditionnement).toBeUndefined();
  });
  it('l\'IA lit 8 € pour 100 g : le prix devient 8 € les 100 g, sans « dès » ni doute', async () => {
    const r: any = await completerParIA(lue(), html, appel({ prix: 8, devise: 'EUR', quantite: 100, unite: 'g', parUnite: false }) as any);
    expect(r.prix).toBe(8);
    expect(r.conditionnement).toEqual({ valeur: 100, unite: 'g' });
    expect(r.prixDes).toBeUndefined();
    const ia = r.etapes.find((e: any) => e.nom === 'ia');
    expect(ia.statut, ia.detail).not.toBe('douteux');
    expect(ia.detail).toContain('dès 7.29');
    expect(r.etapes.find((e: any) => e.nom === 'controle')?.statut).not.toBe('douteux');
  });
  it('l\'IA ne lit pas de quantité : le « dès » reste tel quel, et le prix nu n\'est pas remplacé', async () => {
    const r: any = await completerParIA(lue(), html, appel({ prix: 8, devise: 'EUR' }) as any);
    expect(r.prix).toBe(7.29);
    expect(r.prixDes).toBe(true);
    expect(r.conditionnement).toBeUndefined();
  });
  it('un prix de l\'IA PLUS BAS que le « dès » ne le précise pas (c\'est un vrai désaccord)', () => {
    const g: Gardee = { prix: 5, devise: 'EUR', quantite: { valeur: 100, unite: 'g' }, caracteristiques: [] };
    expect(precisePrixDes(lue(), g)).toBe(false);
    expect(accordPrix(lue(), g)).toBe(false);
  });
  it('une autre devise ne le précise pas', () => {
    expect(precisePrixDes(lue(), { prix: 8, devise: 'CHF', quantite: { valeur: 100, unite: 'g' }, caracteristiques: [] })).toBe(false);
  });
  it('un prix déjà dit avec sa quantité par la page n\'est jamais remplacé par la lecture de l\'IA', async () => {
    const p = { ...lue(), prixDes: undefined, conditionnement: { valeur: 50, unite: 'g' } };
    const r: any = await completerParIA(p, html, appel({ prix: 8, devise: 'EUR', quantite: 100, unite: 'g' }) as any);
    expect(r.prix).toBe(7.29);
    expect(r.conditionnement).toEqual({ valeur: 50, unite: 'g' });
  });
});
