// @vitest-environment jsdom
// Carnet d'idées, correction 4, lot B : écrans figés liste, carnet ouvert, articles (CRITIQUE-4 : 1, 2, 3, 5, 6, 8, 11, 12, 13, 21, 27,
// 38, 40, 43). Rendus par props sur la fixture du lot A (« ZZ TEST — … », prix « exemple »), IA jamais appelée.
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AIDES_ETEINTES, type ArticleV, type CarnetV, type ContenuCarnetV } from '../../src/ui/carnets/EtatIA';
import { ListeCarnets, prixDe, texteAjouts, ajoutsDuMessage } from '../../src/ui/carnets/ListeCarnets';
import { CarnetOuvert, nier, nomCourt, separationDe } from '../../src/ui/carnets/CarnetOuvert';
import { CarteArticle } from '../../src/ui/carnets/CarteArticle';
import { FicheArticle } from '../../src/ui/carnets/FicheArticle';
import { Photos } from '../../src/ui/carnets/Photos';
import { pictoDe, VignetteObjet } from '../../src/ui/carnets/pictos';
import { fixtureCarnets, ID_EMBOUTEILLAGE, ID_EVIER, ID_FRIGO, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnet, type CarnetDoc } from '../../src/domain/carnets/modele';
import { tableau as calculerTableau } from '../../src/domain/carnets/comparer';

afterEach(cleanup);
const rien = () => undefined;

const carnets = (): CarnetV[] => fixtureCarnets().map(lireCarnet).filter((c): c is CarnetDoc => !!c) as unknown as CarnetV[];
const carnet = (id: string): CarnetV => carnets().find(c => c.id === id)!;
const texte = (el: Element) => (el.textContent ?? '').replace(/[  ]/g, ' ');

describe('P1 · pictos par objet (R01, R04, D-25, D-78)', () => {
  it('Ventilation, Évier, Frigo, Embouteillage : quatre pictos différents ; le générique en dernier recours', () => {
    const p = [pictoDe('Ventilation de la salle de brassage'), pictoDe('Évier inox'), pictoDe('Frigo de garde pour fûts'), pictoDe('Embouteillage')];
    expect(p).toEqual(['hotte', 'evier', 'frigo', 'embouteillage']);
    expect(new Set(p).size).toBe(4);
    expect(pictoDe('Pompe de transfert inox')).toBe('pompe');
    expect(pictoDe('Moulin à malt 2 cylindres')).toBe('moulin');
    expect(pictoDe('Tireuse 2 becs')).toBe('tireuse');
    expect(pictoDe('Extracteur mural hélicoïde')).toBe('ventilateur');
    expect(pictoDe('Évier pour les fûts')).toBe('evier');
    expect(pictoDe('Gros seau', undefined, '')).toBe('objet');
    /* le nom d'abord, puis la façon, puis le carnet */
    expect(pictoDe('Modèle X-200', 'Chambre froide en kit', 'Frigo')).toBe('frigo');
  });
  it('la liste montre un picto par carnet, jamais le même partout ; une photo prime', () => {
    const { container } = render(<ListeCarnets carnets={carnets()} onOuvrir={rien} />);
    const pictos = [...container.querySelectorAll('.cn-carnet [data-picto]')].map(e => e.getAttribute('data-picto'));
    expect(pictos.length).toBeGreaterThanOrEqual(4);
    expect(new Set(pictos).size).toBeGreaterThanOrEqual(4);
    expect(pictos).not.toContain('objet');
    cleanup();
    const r = render(<VignetteObjet photo="data:image/jpeg;base64,AAAA" mots={['Évier']} />);
    expect(r.container.querySelector('img')).toBeTruthy();
    expect(r.container.querySelector('[data-picto]')).toBeNull();
  });
});

describe('P2 · liste vide = p2:i02-2', () => {
  it('cadre pointillé, « Un carnet garde » et ses trois lignes, bulle verte vers le champ ; puces G1 touchables, G2', () => {
    const onExemple = vi.fn();
    const { container } = render(<ListeCarnets carnets={[]} onOuvrir={rien} onExemple={onExemple} />);
    const t = texte(container);
    expect(container.querySelector('.cn-premier')!.textContent).toMatch(/Votre premier carnet\s*s'affichera ici/);
    expect(t).toContain('Nouveau carnet · Idée');
    const garde = within(screen.getByRole('region', { name: 'Un carnet garde' }));
    expect(garde.getAllByRole('listitem').map(li => li.textContent)).toEqual([
      "Les objets : un lien collé montre l'objet, une photo aussi", 'Le prix, surveillé tous les 3 jours', 'Le choix, qui part dans À venir'
    ]);
    const bulle = screen.getByRole('note');
    expect(bulle.textContent).toContain('Écrivez ici un besoin : un frigo, une ventilation, un évier…');
    expect(bulle.textContent).toContain('Entrée crée le carnet.');
    expect(bulle.textContent).toContain('Une note en vrac marche aussi.');
    fireEvent.click(within(bulle).getByRole('button', { name: 'Ventilation de la salle' }));
    expect(onExemple).toHaveBeenCalledWith('Ventilation de la salle');
    expect(t).not.toContain('Aucun carnet encore. Par exemple');
  });
  it('pendant la frappe, le cadre du geste prend la place du cadre pointillé et la bulle se retire', () => {
    render(<ListeCarnets carnets={[]} onOuvrir={rien} enHaut={<><div>cadre du geste</div>{null}</>} />);
    expect(screen.getByText('cadre du geste')).toBeTruthy();
    expect(screen.queryByRole('note')).toBeNull();
    cleanup();
    render(<ListeCarnets carnets={[]} onOuvrir={rien} enHaut={<>{null}{false}</>} />);
    expect(screen.getByRole('note')).toBeTruthy();
  });
});

describe('P3, P43, P11 · cartes de la liste (g05-1)', () => {
  it('« dès » = le plus bas prix en lice : Ventilation dit « dès 420 CHF », pas 180 (ventilateur de la façon écartée)', () => {
    const v = carnet(ID_VENTILATION);
    expect(prixDe(v)).toEqual({ des: true, texte: '420', devise: 'CHF' });
    const { container } = render(<ListeCarnets carnets={carnets()} onOuvrir={rien} />);
    const carte = [...container.querySelectorAll('.cn-carnet')].find(e => e.textContent?.includes('Ventilation'))!;
    expect(texte(carte.querySelector('.cn-carnet-prix')!)).toBe('dès420CHF');
    expect(texte(carte)).not.toContain('180');
  });
  it('un écarté au choix n’entre pas dans « dès » non plus', () => {
    const v = carnet(ID_VENTILATION);
    const k: ContenuCarnetV = { ...v.carnet, choix: { articleId: 'x', pourquoi: '', le: '2026-11-17', remplaces: [], ecartes: [{ articleId: 'ZZ-V-A3', raison: 'trop bruyant' }] } };
    expect(prixDe({ ...v, carnet: k })?.texte).toBe('690');
  });
  it('« 3 façons · 6 articles · 1 en veille » sur une ligne ; « 0 façon » jamais écrit ; pastille de groupe verte', () => {
    const pompe: CarnetV = { id: 'p', title: 'Pompe pour le moût', status: 'research', carnet: { creeLe: '2026-11-17', phrase: 'pompe', criteres: [], facons: [], notes: [], photos: [],
      articles: [{ id: 'a', nom: 'Pompe de transfert inox', prixCentimes: 69000, valeurs: {}, lecture: 'lue' }] } };
    const { container } = render(<ListeCarnets carnets={[...carnets(), pompe]} onOuvrir={rien} />);
    const t = texte(container);
    expect(t).not.toMatch(/\b0 façon/);
    expect(t).toContain('1 article');
    const ligne = [...container.querySelectorAll('.cn-compte-ligne')].find(e => e.textContent?.includes('en veille'))!;
    expect(texte(ligne)).toMatch(/^\d+ façons · \d+ articles · \d+ en veille$/);
    expect(ligne.classList.contains('cn-compte-ligne')).toBe(true);
    expect(container.querySelector('.cn-groupe.cn-statut-research')).toBeTruthy();
  });
  it('P40 : tout prix de la liste porte CHF (en veille compris)', () => {
    const { container } = render(<ListeCarnets carnets={carnets()} onOuvrir={rien} />);
    for (const r of container.querySelectorAll('.cn-veille-rangee')) if (/\d/.test(r.textContent ?? '')) expect(r.textContent).toContain('CHF');
  });
  it('P11 : la carte dit « +2 · question, à acheter » d’après le genre des notes nées du message', () => {
    expect(texteAjouts(['a-acheter', 'question'])).toBe('+2 · question, à acheter');
    const v = carnet(ID_VENTILATION);
    const k = { ...v.carnet, notes: [...v.carnet.notes, { id: 'n8', texte: 'gaine alu 150', genre: 'a-acheter' as const, messageId: 'M9' }, { id: 'n9', texte: 'hotte trop large ?', genre: 'question' as const, messageId: 'M9' }] };
    const avec = [{ ...v, carnet: k }];
    expect(ajoutsDuMessage(avec, 'M9')).toEqual({ [ID_VENTILATION]: ['a-acheter', 'question'] });
    const { container } = render(<ListeCarnets carnets={avec} messageRecent="M9" onOuvrir={rien} />);
    expect(container.textContent).toContain('+2 · question, à acheter');
  });
});

describe('P5, P6, P38 · tableau du carnet ouvert (h05-3)', () => {
  const ouvrir = (x: Partial<React.ComponentProps<typeof CarnetOuvert>> = {}) => {
    const v = carnet(ID_VENTILATION);
    return render(<CarnetOuvert carnet={v} aides={AIDES_ETEINTES} liens={[]} tableau={calculerTableau(v as never)} onRetour={rien} onRenommer={rien}
      onSupprimer={rien} onNote={rien} onOuvrirArticle={rien} onComparer={rien} {...x} />);
  };
  it('les façons dans le tableau, avec leurs prix et leur pastille « tient / ne tient pas » ; plus de cartes de façons au-dessus', () => {
    const { container } = ouvrir();
    const facons = [...container.querySelectorAll('.cn-tab-facon')].map(texte);
    expect(facons[0]).toMatch(/^Hotte inox \+ extracteur1 450 à 2 600 CHFtient 80 °C$/);
    expect(facons[1]).toMatch(/^Extracteur mural seul420 à 690 CHFne tient pas 80 °C$/);
    expect(container.querySelector('.cn-facons')).toBeNull();
  });
  it('chaque ligne : rang, vignette (picto), nom, origine et délai, œil de veille ; en-têtes courts avec unité', () => {
    const { container } = ouvrir();
    const cols = [...container.querySelectorAll('.cn-tab-cols [role=columnheader]')].map(e => e.textContent);
    expect(cols).toEqual(['rang · article', 'm³/h', 'CHF']);
    const lignes = [...container.querySelectorAll('button.cn-tab-ligne')];
    const hotte = lignes.find(l => l.textContent?.includes('Hotte inox 120'))!;
    expect(hotte.querySelector('.cn-rang-1')).toBeTruthy();
    expect(hotte.querySelector('[data-picto="hotte"]')).toBeTruthy();
    expect(texte(hotte)).toContain('CH · en stock');
    const murale = lignes.find(l => l.textContent?.includes('Hotte murale'))!;
    expect(murale.textContent).toContain('veille demandée');
    expect(murale.querySelector('svg.lucide-eye, svg')).toBeTruthy();
    expect(container.querySelector('.cn-tab-ligne [data-picto="ventilateur"]')).toBeTruthy();
  });
  it('P6 : le lien non lu n’est jamais classé : « ? Lien sans aperçu · … · à relire · Ouvrir ↗ » sous le tableau', () => {
    const { container } = ouvrir();
    const relire = container.querySelector('.cn-tab-relire')!;
    expect(relire).toBeTruthy();
    expect(texte(relire)).toMatch(/^\?Lien sans aperçuexemple\.invalid\/v5 · à relireOuvrir/);
    expect(within(relire as HTMLElement).getByRole('link', { name: /Ouvrir/ })).toBeTruthy();
    const classees = [...container.querySelectorAll('button.cn-tab-ligne')];
    expect(classees.some(l => /exemple\.invalid/.test(l.textContent ?? ''))).toBe(false);
    const rangs = classees.map(l => l.querySelector('.cn-rang')?.textContent).filter(r => r && r !== '–');
    expect(rangs).toEqual(['1', '2', '3', '4']);
  });
  it('conclusion calculée sur place (passe()) : « Le critère sépare les deux façons : seule la hotte tient 80 °C » · Retenir la hotte, picto local', () => {
    const onRetenirFacon = vi.fn();
    const { container } = ouvrir({ onRetenirFacon });
    const sep = container.querySelector('.cn-separe')!;
    expect(texte(sep)).toContain('Le critère sépare les deux façons : seule la hotte tient 80 °C.');
    expect(sep.querySelector('[data-picto="local"]')).toBeTruthy();
    expect(sep.textContent).not.toContain('✻');
    fireEvent.click(within(sep as HTMLElement).getByRole('button', { name: 'Retenir la hotte' }));
    expect(onRetenirFacon).toHaveBeenCalledWith('ZZ-V-F1');
  });
  it('le texte de l’IA prime quand il existe (✻)', () => {
    const { container } = ouvrir({ separe: { texte: 'seule la hotte capte la buée', retenir: 'la hotte', onRetenir: rien } });
    expect(container.querySelector('.cn-separe')!.textContent).toContain('✻');
  });
  it('mots justes : « la hotte », « l’extracteur » ; négation d’un critère oui-non', () => {
    expect(nomCourt('Hotte inox + extracteur').texte).toBe('la hotte');
    expect(nomCourt('Extracteur mural seul').texte).toBe("l'extracteur");
    expect(nier('tient 80 °C')).toBe('ne tient pas 80 °C');
    expect(nier('aspire au-dessus de la cuve')).toBe("n'aspire pas au-dessus de la cuve");
    const v = carnet(ID_VENTILATION);
    expect(separationDe(v.carnet)?.retenue.nom).toBe('Hotte inox + extracteur');
  });
  it('P12 (h03-5) : toucher « Articles » ouvre les cartes : photo ou picto, valeur du critère en gros, réglette, « Veiller »', () => {
    const onVeille = vi.fn();
    const { container } = ouvrir({ onVeille });
    fireEvent.click(screen.getByRole('button', { name: /Articles/ }));
    const feuille = screen.getByRole('dialog');
    expect(feuille.textContent).toContain('Classés par ce qui compte');
    const cartes = feuille.querySelectorAll('.cn-classee:not(.cn-classee-relire)');
    expect(cartes.length).toBeGreaterThanOrEqual(5);
    expect(texte(cartes[0].querySelector('.cn-classee-gros')!)).toBe('1 800');
    expect(cartes[0].querySelector('.cn-reglette-rond')).toBeTruthy();
    expect(cartes[0].querySelector('[data-picto]')).toBeTruthy();
    fireEvent.click(within(cartes[0] as HTMLElement).getByRole('switch'));
    expect(onVeille).toHaveBeenCalledWith('ZZ-V-A1', true);
    expect(texte(feuille)).toContain('à relire');
    fireEvent.click(within(feuille).getByRole('button', { name: /Fermer/ }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(container).toBeTruthy();
  });
  it('P11 : chaque note porte son genre et son picto', () => {
    const v = carnet(ID_VENTILATION);
    const k = { ...v.carnet, notes: [{ id: 'a', texte: 'gaine alu', genre: 'a-acheter' as const }, { id: 'b', texte: 'trop large ?', genre: 'question' as const }, { id: 'c', texte: 'demander au ferblantier', genre: 'a-faire' as const }, { id: 'd', texte: 'inox 304 suffit', genre: 'conseil' as const }] };
    const { container } = render(<CarnetOuvert carnet={{ ...v, carnet: k }} aides={AIDES_ETEINTES} liens={[]} tableau={null} onRetour={rien} onRenommer={rien} onSupprimer={rien} onNote={rien} onOuvrirArticle={rien} onComparer={rien} />);
    const notes = [...container.querySelectorAll('.cn-note')];
    expect(notes.map(n => n.getAttribute('data-genre'))).toEqual(['a-acheter', 'question', 'a-faire', 'conseil']);
    expect(notes.map(n => n.querySelector('.cn-genre-mot')?.textContent)).toEqual(['à acheter', 'question', 'à faire', 'conseil']);
  });
});

describe('P27 · en-tête du carnet créé (g5:v04-4), Photos', () => {
  const neuf: CarnetV = { id: 'n', title: 'Embouteillage', status: 'idea', carnet: { creeLe: '2026-11-17T08:00:00.000Z', phrase: 'embouteillage', criteres: [], facons: [], articles: [], notes: [], photos: [] } };
  const monter = (vient: boolean) => render(<CarnetOuvert carnet={neuf} aides={AIDES_ETEINTES} liens={[]} tableau={null} vientDEtreCree={vient} onRetour={rien} onRenommer={rien} onSupprimer={rien} onNote={rien} onOuvrirArticle={rien} onComparer={rien} />);
  it('tout juste créé : « Idée · 17 nov. / Ensuite : l’IA cherche les façons » en entier ; « Photos · aucune »', () => {
    const { container } = monter(true);
    expect(texte(container.querySelector('.cn-encadre-idee')!)).toBe("Idée · 17 nov.Ensuite : l'IA cherche les façons");
    expect(texte(container)).toContain('Photos · aucune');
  });
  it('ailleurs, la rubrique Photos vide reste masquée (MISSION « Rangé derrière »)', () => {
    const { container } = monter(false);
    expect(container.querySelector('.cn-encadre-idee')).toBeNull();
    expect(container.textContent).not.toContain('Photos');
  });
  it('P21 : une photo rangée montre sa vignette et « non lue »', () => {
    render(<Photos photos={[{ id: 'p', jpeg: 'data:image/jpeg;base64,AAAA', le: '2026-11-18' }]} />);
    expect(screen.getByRole('button', { name: 'Photo du 18 nov., non lue' }).querySelector('img')).toBeTruthy();
  });
});

describe('P8, P40 · carte après lien (g5:v06-10)', () => {
  const pompe: ArticleV = { id: 'p', nom: 'Pompe de transfert inox', domaine: 'pompe-inox.ch', pays: 'CH', url: 'https://pompe-inox.ch/x', prixCentimes: 69000, devise: 'CHF', dispo: 'en stock', lecture: 'lue', origine: 'exemple',
    valeurs: { débit: { valeur: 40, unite: 'L/min', origine: 'exemple' }, 'température max': { valeur: 90, unite: '°C', origine: 'exemple' }, 'tient 80 °C': { valeur: true, origine: 'exemple' } } };
  it('photo ou picto, valeurs lues chiffrées, « 690 CHF », marque « exemple », « tient 80 °C : oui » une seule fois', () => {
    const { container } = render(<CarteArticle article={pompe} variante="complete" luSurPage={['nom', 'prix', 'débit', 'température max', 'tient 80 °C']} verdict="tient 80 °C : oui" />);
    const t = texte(container);
    expect(container.querySelector('[data-picto="pompe"]')).toBeTruthy();
    expect(t).toContain('40 L/min · 90 °C');
    expect(t).toContain('690 CHF');
    expect(t).toContain('exemple');
    expect(t).toContain('pompe-inox.ch · CH');
    expect(t.split('tient 80 °C').length - 1).toBe(1);
    expect(t).toContain('lu sur la page : nom, prix, débit, température max · tient 80 °C : oui');
  });
  it('la carte de liste dit aussi la devise', () => {
    const { container } = render(<CarteArticle article={pompe} />);
    expect(texte(container)).toContain('690 CHF');
  });
});

describe('P13 · article ouvert (h01-6)', () => {
  it('héros du critère « la plus haute des 4 » (débit), caractéristiques avec rang, offre avec CHF, Choisir vert', () => {
    const v = carnet(ID_VENTILATION);
    const a = v.carnet.articles.find(x => x.id === 'ZZ-V-A1')!;
    const { container } = render(<FicheArticle article={a} carnet={v.carnet} titreCarnet="Ventilation" facon={v.carnet.facons[0]} onRetour={rien} onVeille={rien} onChoisir={rien} />);
    const heros = container.querySelector('.cn-heros')!;
    expect(texte(heros)).toMatch(/1 800\s*m³\/h/);
    expect(texte(heros)).toContain('la plus haute des 4');
    expect(container.querySelector('.cn-pastille')!.textContent).toBe('1re sur 4');
    expect(container.querySelector('.cn-fiche-picto [data-picto="hotte"]')).toBeTruthy();
    expect(texte(container.querySelector('.cn-offres')!)).toContain('2 600 CHF');
    const choisir = screen.getByRole('button', { name: /Choisir · Inox Broye/ });
    expect(choisir.classList.contains('cn-action-vert')).toBe(true);
  });
  it('deux offres de la même machine ; caractéristique classée « 2e » ; veille R31 inchangée', () => {
    const b = carnet(ID_EMBOUTEILLAGE);
    const a = b.carnet.articles.find(x => x.id === 'ZZ-B-A5')!; /* A4, même machine, est écarté au choix : il ne se classe pas */
    /* un 2e critère chiffré (cadence, plus) : la caractéristique se classe ; sans sens connu, aucun rang n'est inventé */
    const k = { ...b.carnet, criteres: [...b.carnet.criteres, { id: 'k2', texte: 'cadence', caracteristique: { nom: 'cadence', unite: 'bt/h', sens: 'plus' as const }, origine: 'vous' as const }] };
    const { container } = render(<FicheArticle article={{ ...a, veille: { active: true, depuis: '2026-11-05' } }} carnet={k} titreCarnet="Embouteillage" onRetour={rien} onVeille={rien} />);
    const t = texte(container);
    expect(t).toMatch(/2 offres\s*même machine/);
    expect(t).toContain('11 200 CHF');
    expect(t).toContain('11 700 CHF');
    expect(t).toContain('demandée · pas encore relevée');
    expect(t).not.toMatch(/baisse|revu le|relevée le/);
    expect(container.querySelector('.cn-carac-rang')).toBeTruthy();
  });
});

describe('R30 · aucun gabarit par objet', () => {
  it('le picto ne change aucun champ : mêmes rubriques pour Évier et Frigo', () => {
    const e = render(<CarnetOuvert carnet={carnet(ID_EVIER)} aides={AIDES_ETEINTES} liens={[]} tableau={null} onRetour={rien} onRenommer={rien} onSupprimer={rien} onNote={rien} onOuvrirArticle={rien} onComparer={rien} />);
    const rubE = [...e.container.querySelectorAll('section.cn-rubrique')].map(s => s.getAttribute('aria-label'));
    cleanup();
    const f = carnet(ID_FRIGO);
    const r = render(<CarnetOuvert carnet={{ ...f, status: 'idea', carnet: { ...f.carnet, choix: undefined, articles: [], facons: [], notes: [] } }} aides={AIDES_ETEINTES} liens={[]} tableau={null} onRetour={rien} onRenommer={rien} onSupprimer={rien} onNote={rien} onOuvrirArticle={rien} onComparer={rien} />);
    expect([...r.container.querySelectorAll('section.cn-rubrique')].map(s => s.getAttribute('aria-label'))).toEqual(rubE);
  });
});
