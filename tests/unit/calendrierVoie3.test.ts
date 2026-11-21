import { describe, expect, it } from 'vitest';
import type { Batch } from '../../src/types';
import { choseBrassin } from '../../src/domain/calendrier';
import { courbeCaisse, courbeDecalee, effetCaisse, type CourbeCaisse } from '../../src/domain/calendrierCaisse';
import { courbeDuGlisse, deplacer, deplacerJours, raisonNommee, texteEffetCreux, type ContexteGestes } from '../../src/domain/calendrierGestes';
import { separerEffet } from '../../src/ui/calendrier/frise/Message';

/* Voie 3 (20.11) : PC-145 aperçu = résultat, PC-155 le message nomme la chose */
const AUJOURDHUI = '2026-11-16';
const etapes = [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 14 }, { kind: 'garde', name: 'Garde', tempC: 4, days: 14 }];
/* la Saison du banc : planifiée le 10 nov. (passée, affichée en S47), ses sorties : courses et emballage, chacune à SA date */
const saison = { id: 'LOT-S', name: 'Saison de ferme', style: 'Saison', volumeL: 50, brewDate: '', plannedBrewDate: '10.11.2026', status: 'planifie', recipeSnapshot: { fermentation: etapes } } as unknown as Batch;
const chose = choseBrassin(saison, AUJOURDHUI)!;
const courbe = courbeCaisse({
  depart: 506400, lundi0: AUJOURDHUI,
  mouvements: [['achats', '2026-11-16', -9200], ['emballage', '2026-12-07', -4500]].map(([poste, jour, centimes]) => ({ id: `brew:LOT-S:${poste}`, jour: jour as string, centimes: centimes as number, nom: chose.titre, choseId: chose.id }))
})!;
const ctx = (c: CourbeCaisse | null = courbe): ContexteGestes => ({ aujourdhui: AUJOURDHUI, batches: [saison], plans: [], courbe: c });
const libres = (c: CourbeCaisse) => c.semaines.map(s => s.libre);

describe('PC-145 : l’aperçu d’un glissé montre la courbe que le geste écrira', () => {
  it('la Saison glissée de 4 colonnes : l’aperçu et le résultat donnent les mêmes semaines (le décalage en bloc, lui, en diffère)', () => {
    const res = deplacer(chose, 4, ctx());
    expect(res.ok).toBe(true);
    const apercu = courbeDuGlisse(chose, 4, ctx(), false)!;
    expect(apercu).not.toBeNull();
    expect(libres(apercu)).toEqual(libres((res as { courbeApres: CourbeCaisse }).courbeApres));
    /* la cause de PC-145 : l'ancien aperçu décalait toutes les sorties de 28 jours, les écrites replacent chacune à sa date */
    expect(libres(courbeDecalee(courbe, chose.id, 28))).not.toEqual(libres(apercu));
    expect(effetCaisse(courbe, apercu)?.texte).toBe((res as { effet: { texte: string } }).effet.texte);
  });
  it('au jour (vue Jour, mois) : même règle, même courbe', () => {
    const res = deplacerJours(chose, 10, ctx());
    expect(res.ok).toBe(true);
    expect(libres(courbeDuGlisse(chose, 10, ctx(), true)!)).toEqual(libres((res as { courbeApres: CourbeCaisse }).courbeApres));
  });
  /* CAL-PASSE (décision du pilote, 20.11) : le passé est modifiable. Un glissé vers le passé n'est plus refusé : il écrit la date et l'annonce
     (il se taisait « refusé » avant). Seuls restent muets : sans courbe, ou sans écart. */
  it('un geste au passé annonce sa date ; sans courbe ou sans écart, rien', () => {
    const res = deplacer(chose, -3, ctx());
    expect(res.ok).toBe(true);
    expect(res.ok && res.message.texte).toMatch(/Saison de ferme/);
    expect(res.ok && res.message.texte).toMatch(/S\d+ → S\d+/);
    expect(courbeDuGlisse(chose, -3, ctx(), false)).not.toBeNull();
    expect(courbeDuGlisse(chose, 4, ctx(null), false)).toBeNull();
    expect(courbeDuGlisse(chose, 0, ctx(), false)).toBeNull();
  });
});

describe('PC-155 : le message d’un glissé nomme la chose', () => {
  it('le nom passe en tête, l’effet chiffré reste entier à part (le nom cède le premier)', () => {
    const res = deplacer(chose, 4, ctx());
    /* D395 et D397 : posée à sa date (10 nov., S46), +4 colonnes = 8 déc. (S50) ; l'emballage, une semaine avant « prête » au plus tôt
       (max(8 déc., aujourd'hui) + 28 j = 5 janv.), tombe le 29 déc. : S53 (2026 a 53 semaines ISO) */
    expect(res.ok && res.message.texte).toBe('Saison de ferme · À dépenser 4 927 : creux S50 → S53');
    const avant = { semaines: [-66000, -65000, -65000, -66000].map((libre, index) => ({ index, lundi: `2026-12-${String(1 + 7 * index).padStart(2, '0')}`, numero: 47 + index, caisse: libre, libre, reserve: 0, variation: 0, mouvements: [], tendance: 0 })) } as unknown as CourbeCaisse;
    const apres = { semaines: avant.semaines.map((s, i) => (i === 3 ? { ...s, libre: -65900 } : s)) } as unknown as CourbeCaisse;
    const t = texteEffetCreux(avant, apres, effetCaisse(avant, apres), 'Hotte')!;
    expect(t).toBe('Hotte · S50 : −660 → −659');
    expect(separerEffet(t)).toEqual({ nom: 'Hotte', effet: 'S50 : −660 → −659' });
    expect(texteEffetCreux(avant, apres, effetCaisse(avant, apres))).toBe('S50 : −660 → −659 · à dépenser reste −660');
  });
  it('le refus d’un jalon dit de quel brassin il parle', () => {
    expect(raisonNommee('Blonde d’automne', 'Le dry hop suit la recette du brassin')).toBe('Blonde d’automne : le dry hop suit la recette du brassin');
    expect(raisonNommee('Blonde d’automne', 'Blonde d’automne : déjà nommée')).toBe('Blonde d’automne : déjà nommée');
    const avecJalons = { ...chose, jalons: [{ id: 'dry-hop', libelle: 'Dry hop', jour: '2026-11-21', ecart: 5, glissable: false as const, raison: 'Le dry hop suit la recette du brassin' }] };
    const res = deplacer(avecJalons, 1, ctx(), 'dry-hop');
    expect(!res.ok && res.raison).toBe('Saison de ferme : le dry hop suit la recette du brassin');
  });
});
