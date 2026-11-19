// @vitest-environment jsdom
/**
 * Carnet tour 3, voie f11 (vision v7) :
 * PCN-110 — « lues sur la fiche du vendeur, <date> » (h01-6) jamais affichée : aucune valeur lue d'une page ne portait `luLe` ;
 * v7-1 — « Comparer sur le température mini (°C) » : l'article suit le genre de la caractéristique (avecArticle), règle générale ;
 * v7-2 — le carnet né de la note « résine pour le sol du local » : vignette réduite à la lettre « R », pas un objet dessiné ;
 * v7-3 — 390 : la citation de « Prochain brassin » coupée « Sachets de levure x2.… » (colonne serrée par « Coller un lien »).
 */
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { fixtureCarnets, ID_EVIER } from '../../src/domain/carnets/fixture';
import { lireCarnet, type CarnetDoc } from '../../src/domain/carnets/modele';
import { accepterProposition, ranger, type LigneARanger, type Resultat } from '../../src/domain/carnets/operations';
import type { CreativeItem } from '../../src/types';
import { depuisIA, libelleProposee } from '../../src/ui/carnets/CarnetsVue';
import { FicheArticle } from '../../src/ui/carnets/FicheArticle';
import { ListeCarnets } from '../../src/ui/carnets/ListeCarnets';
import { PictoObjet, pictoDe } from '../../src/ui/carnets/pictos';
import type { ArticleV, CarnetV } from '../../src/ui/carnets/EtatIA';

afterEach(cleanup);
const rien = () => undefined;
const texte = (el: Element) => (el.textContent ?? '').replace(/[  ]/g, ' ');
function appliquer(etat: readonly CreativeItem[], r: Resultat): CreativeItem[] {
  if (!r.ok) throw new Error(r.raison);
  const parId = new Map(etat.map(d => [d.id, d]));
  for (const e of r.ecritures) { if (e.op === 'put') parId.set(e.doc.id, e.doc); else parId.delete(e.id); }
  return [...parId.values()];
}
const carnets = (): CarnetV[] => fixtureCarnets().map(lireCarnet).filter((c): c is CarnetDoc => !!c) as unknown as CarnetV[];

describe('PCN-110 : les valeurs lues sur une page portent leur date, la fiche dit « lues sur la fiche du vendeur, <date> »', () => {
  const LU = Date.UTC(2026, 10, 19, 10, 30);
  const ligne = (statut: 'lue' | 'illisible', luLe: number) => ({
    sorte: 'article', texte: 'https://exemple.invalid/hotte-140', url: 'https://exemple.invalid/hotte-140', origine: 'exemple',
    page: { url: 'https://exemple.invalid/hotte-140', domaine: 'exemple.invalid', statut, luLe, nom: 'Hotte 140', valeurs: [{ nom: 'débit', valeur: '1400', unite: 'm³/h' }] }
  });
  it('depuisIA : chaque valeur d’une page lue reçoit `luLe` (date ISO de la lecture)', () => {
    const a = depuisIA(ligne('lue', LU) as never, { carnetId: 'c' } as never) as unknown as { valeurs: Record<string, { luLe?: string }> };
    expect(a.valeurs['débit'].luLe).toBe(new Date(LU).toISOString());
  });
  it('sans date de lecture (0), aucune date inventée', () => {
    const a = depuisIA(ligne('lue', 0) as never, { carnetId: 'c' } as never) as unknown as { valeurs: Record<string, { luLe?: string }> };
    expect(a.valeurs['débit'].luLe).toBeUndefined();
  });
  it('la fiche de l’article affiche « Caractéristiques lues sur la fiche du vendeur, 19 nov. »', () => {
    const a = depuisIA(ligne('lue', LU) as never, { carnetId: 'c' } as never) as unknown as { valeurs: ArticleV['valeurs']; nom: string };
    const article = { id: 'A1', url: 'https://exemple.invalid/hotte-140', nom: a.nom, valeurs: a.valeurs, lecture: 'lue', origine: 'exemple' } as unknown as ArticleV;
    const { container } = render(<FicheArticle article={article} titreCarnet="Hotte" onFermer={rien} {...({} as never)} />);
    expect(texte(container)).toMatch(/lues sur la fiche du vendeur, 19 nov/);
  });
  it('comme h01-6 : la ligne suit « Caractéristiques » sur la même ligne, en maigre et plus petite (pas en titre gras)', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../../src/ui/carnets/carnets.css'), 'utf8').replace(/\r\n/g, '\n');
    const i = css.indexOf('.cn-sous > .cn-mut {');
    expect(i).toBeGreaterThan(-1);
    const r = css.slice(i, css.indexOf('}', i));
    expect(r).toMatch(/font-weight: 400/);
    expect(r).toMatch(/font-size: 14px/);
  });
});

describe('v7-1 : « Comparer sur » accorde l’article avec la caractéristique', () => {
  const p = (nom: string, unite?: string) => libelleProposee({ texte: `Comparer sur ${nom}`, caracteristique: { nom, ...(unite ? { unite } : {}) }, origine: 'ia' });
  it('la température, le volume, le débit, l’oxygène, la cadence', () => {
    expect(p('température mini', '°C')).toBe('Comparer sur la température mini (°C)');
    expect(p('volume', 'L')).toBe('Comparer sur le volume (L)');
    expect(p('débit', 'm³/h')).toBe('Comparer sur le débit (m³/h)');
    expect(p('oxygène capté', 'ppb')).toBe('Comparer sur l’oxygène capté (ppb)');
    expect(p('cadence', 'bouteilles/h')).toBe('Comparer sur la cadence (bouteilles/h)');
    expect(p('précision')).toBe('Comparer sur la précision');
  });
  it('accepterProposition : le critère rangé est « la température mini », pas « le température mini »', () => {
    const F = fixtureCarnets();
    const lignes: LigneARanger[] = [{ carnetId: ID_EVIER, sorte: 'critere', texte: 'Comparer sur température mini', caracteristique: { nom: 'température mini', unite: '°C', sens: 'moins' }, origine: 'exemple', propose: true }];
    const apres = appliquer(F, ranger(F, { message: { id: 'M-F11', texte: 'frigo', le: '2026-11-19T10:00:00.000Z', depuis: ID_EVIER, rangement: 'locale' }, lignes }));
    const fin = appliquer(apres, accepterProposition(apres, { messageId: 'M-F11', index: 0 }));
    expect(lireCarnet(fin.find(d => d.id === ID_EVIER))!.carnet.criteres.map(k => k.texte)).toContain('la température mini');
  });
});

describe('v7-2 : un carnet né d’une note de travaux reçoit un objet dessiné, pas une initiale', () => {
  it('« Résine pour le sol du local », « Peinture époxy », « Détergent alcalin » : un pot dessiné', () => {
    for (const nom of ['Résine pour le sol du local', 'Peinture époxy du sol', 'Détergent alcalin', 'Vernis pour la cave', 'Désinfectant sans rinçage']) expect(pictoDe(nom), nom).toBe('pot');
    const { container } = render(<PictoObjet nom={pictoDe('Résine pour le sol du local')} taille={40} lettre="R" />);
    expect(container.querySelector('svg')!.getAttribute('data-picto')).toBe('pot');
    expect(container.querySelector('text')).toBeNull();
  });
  it('« Gros seau » reste sans dessin (aucun cube générique)', () => {
    expect(pictoDe('Gros seau')).toBe('objet');
  });
});

describe('v7-3 : à 390, une citation longue passe le bouton « Coller un lien » sous le texte', () => {
  const idee = (title: string, phrase: string): CarnetV => {
    const c = carnets().find(x => x.id === ID_EVIER)!;
    return { ...c, id: `ZZ-${title}`, title, carnet: { ...c.carnet, phrase, articles: [] } } as CarnetV;
  };
  it('« Prochain brassin » + « Sachets de levure x2. Prochain brassage mardi. » : cn-carnet-long', () => {
    const { container } = render(<ListeCarnets carnets={[idee('Prochain brassin', 'Sachets de levure x2. Prochain brassage mardi.')]} onOuvrir={rien} onCollerLien={rien} />);
    const carte = container.querySelector('.cn-carnet-coller')!;
    expect(carte).not.toBeNull();
    expect(carte.classList.contains('cn-carnet-long')).toBe(true);
  });
  it('« Prochain brassin » + « acheter 2 sachets de levure » (27 signes, coupée à 390 en capture) : cn-carnet-long', () => {
    const { container } = render(<ListeCarnets carnets={[idee('Prochain brassin', 'acheter 2 sachets de levure')]} onOuvrir={rien} onCollerLien={rien} />);
    expect(container.querySelector('.cn-carnet-coller')!.classList.contains('cn-carnet-long')).toBe(true);
  });
  it('« Évier inox » + « 2 bacs pour laver les fûts » (deux lignes à côté du bouton) : inchangé', () => {
    const { container } = render(<ListeCarnets carnets={[idee('Évier inox', '2 bacs pour laver les fûts')]} onOuvrir={rien} onCollerLien={rien} />);
    expect(container.querySelector('.cn-carnet-coller')!.classList.contains('cn-carnet-long')).toBe(false);
  });
});
