// @vitest-environment jsdom
// Carnet d'idées, correction 5, lot B : figés liste, carnet ouvert, articles (CRITIQUE-5 : 1, 2, 6, 8, 11, 19, 20, 24, 28, 29, 30,
// 32, 36, 37, 40). Un test par correction du brief (1 à 10), rendu par props sur la fixture du lot A (« ZZ TEST — … », valeurs
// « exemple »). L'IA n'est jamais appelée.
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AIDES_ETEINTES, type ArticleV, type CarnetV } from '../../src/ui/carnets/EtatIA';
import { ListeCarnets, offresEnVeille, prixOffres } from '../../src/ui/carnets/ListeCarnets';
import { CarnetOuvert, provenanceCritere, texteMoinsBien } from '../../src/ui/carnets/CarnetOuvert';
import { CarteArticle } from '../../src/ui/carnets/CarteArticle';
import { FicheArticle } from '../../src/ui/carnets/FicheArticle';
import { moinsBienQueDe } from '../../src/ui/carnets/Comparer';
import { pictoDe, VignetteObjet } from '../../src/ui/carnets/pictos';
import { fixtureCarnets, ID_EMBOUTEILLAGE, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnet, type CarnetDoc } from '../../src/domain/carnets/modele';
import * as comparer from '../../src/domain/carnets/comparer';
import { tableau as calculerTableau } from '../../src/domain/carnets/comparer';

afterEach(cleanup);
const rien = () => undefined;
const carnets = (): CarnetV[] => fixtureCarnets().map(lireCarnet).filter((c): c is CarnetDoc => !!c) as unknown as CarnetV[];
const carnet = (id: string): CarnetV => carnets().find(c => c.id === id)!;
const texte = (el: Element) => (el.textContent ?? '').replace(/[  ]/g, ' ');
/** a est-il avant b dans le document ? */
const avant = (a: Element, b: Element) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

const ouvrir = (c: CarnetV, x: Partial<React.ComponentProps<typeof CarnetOuvert>> = {}) =>
  render(<CarnetOuvert carnet={c} aides={AIDES_ETEINTES} liens={[]} tableau={calculerTableau(c as never)} onRetour={rien} onRenommer={rien}
    onSupprimer={rien} onNote={rien} onOuvrirArticle={rien} onComparer={rien} {...x} />);

const neuf = (criteres: CarnetV['carnet']['criteres'] = []): CarnetV => ({ id: 'n', title: 'Moulin à malt', status: 'idea',
  carnet: { creeLe: '2026-11-17T08:00:00.000Z', phrase: 'Moulin à malt : 2 cylindres, 150 kg/h', criteres, facons: [], articles: [], notes: [], photos: [] } });

describe('1 · carnet ouvert = h05-3 : ligne d’état, une ligne Critère, le tableau juste dessous, la conclusion collée (n° 1, 19, 20, 22)', () => {
  it('une ligne « Critère : … · proposé par l’IA », jamais l’encadré « tiré de votre phrase »', () => {
    const { container } = ouvrir(carnet(ID_VENTILATION));
    const lignes = container.querySelectorAll('.cn-critere-une');
    expect(lignes).toHaveLength(1);
    /* critique 6, n° 34 : la mention sans valeur est claire, sur sa ligne : « 1 critère sans valeur à comparer ⌄ » */
    expect(texte(lignes[0].querySelector('.cn-critere-tx')!)).toBe("Critère : tient 80 °C, puis le débit · proposé par l'IA");
    expect(texte(lignes[0])).toBe("Critère : tient 80 °C, puis le débit · proposé par l'IA · 1 critère sans valeur à comparer ");
    expect(container.querySelector('.cn-encart-critere')).toBeNull();
    expect(texte(container)).not.toContain('tiré de votre phrase');
    /* son critère à lui (sans valeur) est rangé derrière, un toucher le montre, avec sa vraie provenance */
    fireEvent.click(screen.getByRole('button', { name: /^1 critère sans valeur à comparer$/ }));
    /* critique 6, n° 14 : la liste ne redit que les critères absents de la ligne Critère */
    const tous = within(screen.getByRole('list', { name: 'Critères sans valeur à comparer' })).getAllByRole('listitem').map(texte);
    expect(tous).toHaveLength(1);
    expect(tous[0]).toMatch(/de votre phrase/);
    expect(provenanceCritere({ origine: 'vous' })).toBe('de votre phrase');
    expect(provenanceCritere({ origine: 'locale' })).toBe('calculé sur place');
  });
  it('n° 19 : sous le titre, « 2 façons à comparer · attendre l’avis du ferblantier », puis la ligne Critère, puis le tableau', () => {
    const { container } = ouvrir(carnet(ID_VENTILATION));
    const etat = container.querySelector('.cn-ligne-etat')!;
    expect(texte(etat)).toBe('2 façons à comparer · attendre l’avis du ferblantier');
    const titre = container.querySelector('.cn-titre')!, critere = container.querySelector('.cn-critere-une')!, tab = container.querySelector('.cn-tab')!;
    expect(avant(titre, etat) && avant(etat, critere) && avant(critere, tab)).toBe(true);
    /* rien entre la ligne Critère et le tableau que l’en-tête « Articles » : la phrase citée descend sous le tableau */
    const cite = container.querySelector('.cn-cite');
    if (cite) expect(avant(tab, cite)).toBe(true);
  });
  it('n° 20 : « Le critère sépare … · Retenir la hotte » colle aux façons en lice, avant l’écartée et le lien à relire', () => {
    const { container } = ouvrir(carnet(ID_VENTILATION));
    const separe = container.querySelector('.cn-separe')!;
    expect(texte(separe)).toMatch(/Le critère sépare les deux façons : seule la hotte tient 80 °C\..*Retenir la hotte/);
    const blocs = [...container.querySelectorAll('.cn-tab > .cn-tab-bloc')];
    const enLice = blocs.filter(b => !b.classList.contains('cn-tab-ecartee') && !b.classList.contains('cn-tab-relire'));
    expect(avant(enLice[enLice.length - 1], separe)).toBe(true);
    expect(separe.previousElementSibling).toBe(enLice[enLice.length - 1]);
    for (const b of blocs.filter(x => x.classList.contains('cn-tab-ecartee') || x.classList.contains('cn-tab-relire'))) expect(avant(separe, b)).toBe(true);
  });
});

describe('2 · tout juste créé = g5:v04-4 : un bandeau, puis des rubriques à filet (n° 2)', () => {
  it('sans critère : « Ce qui compte · rien encore : l’IA le proposera » en rubrique à filet ; le bandeau du lot D une fois', () => {
    const { container } = render(<CarnetOuvert carnet={neuf()} aides={AIDES_ETEINTES} liens={[]} tableau={null} vientDEtreCree
      bandeau={<div className="cn-bandeau-test">✓ Carnet créé</div>} onRetour={rien} onRenommer={rien} onSupprimer={rien} onNote={rien} onOuvrirArticle={rien} onComparer={rien} />);
    expect(container.querySelectorAll('.cn-bandeau-test')).toHaveLength(1);
    const cqc = container.querySelector('.cn-rubrique-ligne[aria-label="Ce qui compte"]')!;
    expect(texte(cqc).trim()).toBe("Ce qui compte · rien encore : l'IA le proposera");
    expect(container.querySelectorAll('.cn-rubrique-ligne').length).toBeGreaterThanOrEqual(5);
    expect(container.querySelector('.cn-encart-critere')).toBeNull();
  });
  it('avec le critère tiré de sa phrase : une ligne à filet « Ce qui compte · 150 kg/h · de votre phrase », pas un encadré', () => {
    const { container } = render(<CarnetOuvert carnet={neuf([{ id: 'k', texte: '150 kg/h', caracteristique: { nom: 'débit', unite: 'kg/h', sens: 'plus' }, origine: 'vous' }])}
      aides={AIDES_ETEINTES} liens={[]} tableau={null} vientDEtreCree onRetour={rien} onRenommer={rien} onSupprimer={rien} onNote={rien} onOuvrirArticle={rien} onComparer={rien} />);
    const cqc = container.querySelector('.cn-rubrique-ligne[aria-label="Ce qui compte"]')!;
    expect(texte(cqc).trim()).toBe('Ce qui compte · 150 kg/h · de votre phrase');
    expect(container.querySelector('.cn-encart-critere, .cn-critere-une')).toBeNull();
  });
});

describe('3 · IA indisponible : aucun « Ensuite : l’IA … » (n° 24)', () => {
  const monter = (iaIndisponible: 'echec' | 'hors-ligne' | 'eteinte' | null) => render(<CarnetOuvert carnet={neuf()} aides={AIDES_ETEINTES} liens={[]} tableau={null}
    vientDEtreCree iaIndisponible={iaIndisponible} onRetour={rien} onRenommer={rien} onSupprimer={rien} onNote={rien} onOuvrirArticle={rien} onComparer={rien} />);
  it.each(['echec', 'hors-ligne', 'eteinte'] as const)('%s : ni « Ensuite : l’IA », ni « l’IA le proposera », ni « l’IA les cherche »', sorte => {
    const t = texte(monter(sorte).container);
    expect(t).not.toMatch(/Ensuite : l'IA/);
    expect(t).not.toContain("l'IA le proposera");
    expect(t).not.toContain("l'IA les cherche");
    /* critique 6, n° 16 : plus d'encadré « Ensuite… » ; les rubriques disent qui agit, sans promesse de l'IA */
    expect(t).toContain('Façons · aucune');
  });
  it('IA disponible : chaque rubrique dit qui agit (v04-4), sans encadré « Ensuite »', () => {
    const t = texte(monter(null).container);
    expect(t).toContain("Façons · aucune : l'IA les cherche");
    expect(t).not.toContain('Ensuite :');
  });
});

describe('4 · carte d’article : caractéristiques lues et « lu sur la page » (n° 6, g5:v06-10)', () => {
  const pompe: ArticleV = { id: 'p', nom: 'Pompe de transfert inox', domaine: 'pompe-inox.ch', pays: 'CH', url: 'https://pompe-inox.ch/x', prixCentimes: 69000, devise: 'CHF', dispo: 'en stock', lecture: 'lue', origine: 'exemple',
    valeurs: { débit: { valeur: 40, unite: 'L/min', origine: 'exemple' }, 'jusqu’à': { valeur: 90, unite: '°C', origine: 'exemple' }, 'tient 80 °C': { valeur: true, origine: 'exemple' } } };
  const critere = { id: 'k', texte: 'tient 80 °C', caracteristique: { nom: 'tient 80 °C', sens: 'oui-non' as const }, origine: 'ia' as const };
  it('complète, sans rien passer par le geste : valeurs avec unité, « lu sur la page : nom, prix, débit, … · tient 80 °C : oui »', () => {
    const t = texte(render(<CarteArticle article={pompe} critere={critere} variante="complete" />).container);
    expect(t).toContain('40 L/min · 90 °C');
    expect(t).toContain('lu sur la page : nom, prix, débit, jusqu’à · tient 80 °C : oui');
    expect(t.split('tient 80 °C').length - 1).toBe(1);
  });
  it('la carte de liste porte aussi les valeurs lues avec leur unité', () => {
    const t = texte(render(<CarteArticle article={pompe} critere={critere} />).container);
    expect(t).toContain('40 L/min · 90 °C');
  });
  it('dans le carnet, un seul article lu se montre en carte complète', () => {
    const c: CarnetV = { ...neuf([critere]), status: 'research', carnet: { ...neuf().carnet, criteres: [critere], articles: [pompe] } };
    const { container } = render(<CarnetOuvert carnet={c} aides={AIDES_ETEINTES} liens={[]} tableau={null} onRetour={rien} onRenommer={rien} onSupprimer={rien} onNote={rien} onOuvrirArticle={rien} onComparer={rien} />);
    const carte = container.querySelector('.cn-carte-complete')!;
    expect(texte(carte)).toContain('lu sur la page : nom, prix, débit');
    expect(texte(carte)).toContain('40 L/min');
  });
});

describe('5 · article ouvert = h01-6 (n° 8, 28, 36, 37)', () => {
  const v = carnet(ID_VENTILATION);
  /* une fiche plus riche que la fixture (h01-6 a 4 valeurs) : bruit (moins), puissance (plus), sur les 4 articles en lice */
  const riche = { ...v.carnet, criteres: [...v.carnet.criteres, { id: 'kb', texte: 'peu de bruit', caracteristique: { nom: 'bruit', unite: 'dB', sens: 'moins' as const }, origine: 'ia' as const },
    { id: 'kp', texte: 'puissance', caracteristique: { nom: 'puissance', unite: 'W', sens: 'plus' as const }, origine: 'ia' as const }], articles: v.carnet.articles.map((a, i) => (a.faconId === 'ZZ-V-F3' || !a.nom ? a : { ...a, valeurs: { ...a.valeurs,
    bruit: { valeur: [52, 49, 58, 61][i], unite: 'dB', origine: 'exemple' as const }, puissance: { valeur: [370, 250, 180, 300][i], unite: 'W', origine: 'exemple' as const } } })) };
  const fiche = (id: string, k = riche) => render(<FicheArticle article={k.articles.find(x => x.id === id)!} carnet={k} titreCarnet="Ventilation" facon={k.facons[0]} onRetour={rien} onVeille={rien} onChoisir={rien} />);
  it('sans photo : le cadre photo garde l’objet dessiné en grand (pas un trait fin)', () => {
    const { container } = fiche('ZZ-V-A1');
    const cadre = container.querySelector('[data-cadre="picto"]')!;
    expect(cadre.querySelector('[data-picto="hotte"] svg, svg[data-picto="hotte"]')!.getAttribute('width')).toBe('132');
  });
  it('avec la photo de la page : la photo et « photo de la page collée »', () => {
    const k = { ...riche, articles: riche.articles.map(a => (a.id === 'ZZ-V-A1' ? { ...a, photo: 'data:image/jpeg;base64,AAAA' } : a)) };
    const { container } = fiche('ZZ-V-A1', k);
    expect(container.querySelector('[data-cadre="photo"] img')).toBeTruthy();
    expect(texte(container)).toContain('photo de la page collée');
  });
  it('grille de 4 caractéristiques, chaque valeur qui classe avec son rang', () => {
    const { container } = fiche('ZZ-V-A1');
    const cases = [...container.querySelectorAll('.cn-carac > div')].map(texte);
    expect(cases.length).toBeGreaterThanOrEqual(4);
    expect(cases).toEqual(expect.arrayContaining([expect.stringMatching(/^bruit52 dB\s*2e/), expect.stringMatching(/^puissance370 W\s*1re/), expect.stringMatching(/^tient 80 °Coui/)]));
  });
  it('réglette bornée des deux côtés : « 1 800 la plus haute des 4 » à gauche, « 1 100 » à droite', () => {
    const { container } = fiche('ZZ-V-A2');
    const bornes = [...container.querySelectorAll('.cn-piste-borne')].map(texte);
    expect(bornes).toEqual(['1 800 la plus haute des 4', '1 100']);
    expect(texte(container.querySelector('.cn-heros')!)).toContain('3e sur 4');
  });
  it('prix « 1 450 CHF », avec l’espace de groupe, dans l’offre et dans « Part dans À venir »', () => {
    const { container } = fiche('ZZ-V-A2');
    expect(texte(container.querySelector('.cn-offres')!)).toContain('1 450 CHF');
    expect(texte(container)).toMatch(/Part dans À venir : Hotte murale 100 cm, Gastro Lüftung, 1 450 CHF/);
    expect(texte(container)).not.toMatch(/1450/);
  });
});

describe('6 · pictos : objets dessinés distincts, jamais le cube (n° 29, 30)', () => {
  it('chaque objet a son dessin', () => {
    const objets = ['Hotte inox 120 cm', 'Extracteur mural hélicoïde', 'Extracteur centrifuge en ligne', 'Évier inox, 2 bacs', 'Frigo de garde', 'Densimètre numérique',
      'Remplisseuse isobarique', 'Tuyau silicone 8 mm, 5 m', 'Chauffe-eau électrique', 'Pompe magnétique 12 V', 'Moulin à malt', 'Fût de 30 L', 'Cuve de fermentation',
      'Balance de pesée', 'Thermomètre à sonde', 'Bouteille de CO2', 'Refroidisseur à plaques', 'Filtre à cartouche', 'Étagère inox', 'Diable'];
    const p = objets.map(o => pictoDe(o));
    expect(p).not.toContain('objet');
    expect(new Set(p).size).toBe(objets.length);
  });
  it('le dessin est fait de surfaces pleines (métal, moteur, bouteilles), lisible à 40 px', () => {
    const { container } = render(<VignetteObjet mots={['Pompe de transfert']} />);
    const svg = container.querySelector('svg[data-picto="pompe"]')!;
    expect(svg.getAttribute('width')).toBe('40');
    expect(svg.querySelectorAll('.m, .m2, .b').length).toBeGreaterThanOrEqual(3);
  });
  it('un objet sans dessin porte son initiale, jamais le cube', () => {
    const { container } = render(<VignetteObjet mots={['ZZ TEST — Gros seau gradué']} />);
    const svg = container.querySelector('svg[data-picto="objet"]')!;
    expect(svg.textContent).toBe('G');
    expect(svg.querySelector('path')).toBeNull();
  });
});

describe('7 · liste vide = i06-2, sans flèche ni bulle (n° 11, D-108)', () => {
  it('titre, phrase, carte exemple « ↓ arrive ici », « Par exemple : » et ses puces, « Une note en vrac marche aussi. »', () => {
    const onExemple = vi.fn();
    const { container } = render(<ListeCarnets carnets={[]} onOuvrir={rien} onExemple={onExemple} />);
    const t = texte(container);
    expect(container.querySelector('h2')!.textContent).toBe('Carnets');
    expect(t).toContain("Collez le lien d'un objet ou notez un besoin : on garde sa photo et son prix, pour comparer.");
    const ex = container.querySelector('.cn-exemple-carte')!;
    expect(texte(ex)).toMatch(/Évier inox, 2 bacs.*exemple.*votre premier carnet.*arrive ici/);
    expect(ex.querySelector('[data-picto="evier"]')).toBeTruthy();
    expect(t).toContain('Par exemple :');
    fireEvent.click(screen.getByRole('button', { name: 'Frigo de garde' }));
    expect(onExemple).toHaveBeenCalledWith('Frigo de garde');
    expect(t).toContain('Une note en vrac marche aussi.');
    expect(container.querySelector('.cn-bulle-champ, .cn-premier')).toBeNull();
    expect(t).not.toMatch(/Écrivez|s'affichera ici/);
  });
});

describe('8 · En veille : deux offres de la même machine sur une ligne (n° 32)', () => {
  it('« Isobarique 4 becs pré-évacuation · 2 offres · 11 200 à 11 700 CHF », une seule fois', () => {
    const { container } = render(<ListeCarnets carnets={carnets()} onOuvrir={rien} />);
    const veille = screen.getByRole('region', { name: 'En veille' });
    const lignes = [...veille.querySelectorAll('.cn-veille-rangee')].map(texte).filter(t => t.includes('Isobarique 4 becs pré-évacuation'));
    expect(lignes).toHaveLength(1);
    expect(lignes[0]).toContain('2 offres');
    expect(lignes[0]).toContain('11 200 à 11 700 CHF');
    const b = offresEnVeille([carnet(ID_EMBOUTEILLAGE)]);
    expect(b).toHaveLength(1);
    expect(prixOffres(b[0].offres)).toEqual({ nombres: '11 200 à 11 700', devise: 'CHF' });
    expect(container).toBeTruthy();
  });
});

describe('9 · un carnet Idée tout juste créé se range dans le groupe Idée (n° 30) ; titre stocké partout (n° 40)', () => {
  it('en tête du groupe « Idée », ce groupe en tête de liste, jamais flottant au-dessus', () => {
    const cree: CarnetV = { ...neuf(), id: 'ZZ-NEUF', title: 'ZZ TEST — Tuyau silicone 8 mm, 5 m' };
    const { container } = render(<ListeCarnets carnets={[...carnets(), cree]} enTete="ZZ-NEUF" onOuvrir={rien} />);
    expect(screen.queryByRole('region', { name: 'Carnet créé' })).toBeNull();
    const groupes = [...container.querySelectorAll('section.cn-groupe-bloc')];
    expect(groupes[0].getAttribute('aria-label')).toBe('Idée');
    expect(texte(groupes[0].querySelector('.cn-carnet-titre')!)).toBe('ZZ TEST — Tuyau silicone 8 mm, 5 m');
    expect(groupes[0].querySelector('.cn-carnet [data-picto="tuyau"]')).toBeTruthy();
  });
  it('le titre tel qu’il est stocké, « ZZ TEST — » compris, dans le carnet ouvert et dans En veille', () => {
    const { container } = ouvrir(carnet(ID_VENTILATION));
    expect(container.querySelector('.cn-titre')!.textContent).toBe('ZZ TEST — Ventilation de la salle de brassage');
    cleanup();
    render(<ListeCarnets carnets={carnets()} onOuvrir={rien} />);
    expect(texte(screen.getByRole('region', { name: 'En veille' }))).toContain('ZZ TEST — Ventilation');
  });
});

describe('10 · « moins bien … » vient de la fonction du lot A (n° 23), même texte que Comparer', () => {
  it('chaque ligne du tableau du carnet dit le texte de moinsBienQue (ou, sans elle, l’ancien drapeau)', () => {
    const c = carnet(ID_VENTILATION);
    const t = calculerTableau(c as never)!;
    const attendu = t.lignes.map(l => (l.ecarte ? null : texteMoinsBien(t as never, l as never))).filter((x): x is string => !!x);
    /* le texte est celui de comparer.ts (lot A), sur le rang que Comparer calcule ; jamais « moins bien partout » */
    for (const l of t.lignes) {
      const par = l.ecarte ? null : moinsBienQueDe(t as never, l as never);
      expect(texteMoinsBien(t as never, l as never)).toBe(par === null ? null : comparer.texteMoinsBienQue(par));
    }
    expect(attendu.length).toBeGreaterThan(0);
    expect(attendu.every(x => /^moins bien que la \d+(re|e) sur tout$/.test(x))).toBe(true);
    const { container } = ouvrir(c);
    const vus = [...container.querySelectorAll('.cn-tab-ligne .cn-att')].map(texte).map(x => x.replace(/^ · /, ''));
    expect(vus).toEqual(attendu);
  });
});
