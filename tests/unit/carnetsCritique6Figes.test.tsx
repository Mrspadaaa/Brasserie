// @vitest-environment jsdom
/**
 * Critique 6, lot corr6-C (figés carnet ouvert h05-3, liste g05-1, article h01-6) : un test par point du brief.
 * Fixture « ZZ TEST — … », IA simulée ; rien n'est écrit ailleurs.
 */
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AIDES_ETEINTES, type CarnetV, type ContenuCarnetV } from '../../src/ui/carnets/EtatIA';
import { ListeCarnets } from '../../src/ui/carnets/ListeCarnets';
import { CarnetOuvert, provenanceCritere } from '../../src/ui/carnets/CarnetOuvert';
import { FicheArticle, filArianeCourt } from '../../src/ui/carnets/FicheArticle';
import { SupprimerCarnet, cequiPart } from '../../src/ui/carnets/SupprimerCarnet';
import { comptesCarnet, pluriel, accord, texteComptes } from '../../src/domain/carnets/comptes';
import { fixtureCarnets, ID_VENTILATION, NOTE_EN_VRAC_BANC, PHOTO_BANC_HOTTE } from '../../src/domain/carnets/fixture';
import { lireCarnet, type CarnetDoc } from '../../src/domain/carnets/modele';
import { tableau as calculerTableau } from '../../src/domain/carnets/comparer';
import { lireLienSimule } from '../../src/domain/carnets/iaSimulee';
import { ETATS_BANC, lireParametresBanc } from '../../src/design/CarnetsPreview';

afterEach(cleanup);
const rien = () => undefined;
const texte = (el: Element) => (el.textContent ?? '').replace(/[  ]/g, ' ');
const carnets = (): CarnetV[] => fixtureCarnets().map(lireCarnet).filter((c): c is CarnetDoc => !!c) as unknown as CarnetV[];
const carnet = (id: string): CarnetV => carnets().find(c => c.id === id)!;
const ouvrir = (c: CarnetV, x: Partial<React.ComponentProps<typeof CarnetOuvert>> = {}) => render(
  <CarnetOuvert carnet={c} aides={AIDES_ETEINTES} liens={[]} tableau={calculerTableau(c.carnet as never) as never} onRetour={rien} onRenommer={rien}
    onSupprimer={rien} onNote={rien} onOuvrirArticle={rien} onComparer={rien} {...x} />);
const neuf = (x: Partial<ContenuCarnetV> = {}, titre = 'ZZ TEST — Évier inox'): CarnetV => ({ id: 'n', title: titre, status: 'idea',
  carnet: { creeLe: '2026-11-15T08:00:00.000Z', phrase: '2 bacs pour laver les fûts', criteres: [], facons: [], articles: [], notes: [], photos: [], ...x } });

describe('critique 6 · figés carnet ouvert, liste, article (lot C)', () => {
  it('1 · n° 8 (h05-3) : une ligne « Articles 6 ⌄ · Comparer › » ; le lien sans aperçu dans le tableau, avant la conclusion ; noms sur 2 lignes au plus', () => {
    const { container } = ouvrir(carnet(ID_VENTILATION));
    const tete = container.querySelector('.cn-tete-articles')!;
    expect(texte(tete).replace(/\s+/g, '')).toBe('Articles6·Comparer');
    expect(screen.getByRole('button', { name: /Comparer/ })).toBeTruthy();
    expect(texte(container)).not.toContain('Comparer côte à côte');
    expect(texte(container)).not.toMatch(/lus, \d+ sans aperçu/);
    const relire = container.querySelector('.cn-tab .cn-tab-bloc .cn-tab-relire-ligne')!;
    expect(texte(relire)).toMatch(/Lien sans aperçu.*Ouvrir/);
    const sep = container.querySelector('.cn-separe')!;
    expect(relire.compareDocumentPosition(sep) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    for (const nom of container.querySelectorAll('button.cn-tab-ligne .cn-tab-nom > span:first-child')) expect(nom.classList.contains('cn-nom-entier')).toBe(true); /* f5c n° 9 : noms entiers, plus coupés par « … » */
  });

  it('2 · n° 14 (g5:v03-8) : un critère tout juste rangé n’est écrit qu’une fois ; sa phrase n’est pas recitée quand elle est le critère', () => {
    const c = neuf({ criteres: [
      { id: 'k1', texte: '2 bacs', origine: 'vous' },
      { id: 'k2', texte: 'assez profond pour un fût', origine: 'ia' },
      { id: 'k3', texte: 'Fond de bac 38 cm minimum', origine: 'vous' }] });
    const { container } = ouvrir(c, { tableau: null, rangee: { cible: 'critere', id: 'k3', phrase: 'fond de bac 38 cm minimum', onAnnuler: rien } });
    const region = screen.getByRole('region', { name: 'Ce qui compte' });
    expect(texte(region).match(/fond de bac 38 cm minimum/gi)).toHaveLength(1);
    expect(texte(region)).not.toContain('votre phrase : « fond de bac');
    expect(container.querySelector('[aria-label="Tous les critères"]')).toBeNull();
    expect(texte(region).match(/2 bacs/g)).toHaveLength(1);
    /* une autre phrase que le critère : citée une fois, dans la ligne rangée */
    cleanup();
    ouvrir(c, { tableau: null, rangee: { cible: 'critere', id: 'k3', phrase: 'il faut 38 cm de fond', onAnnuler: rien } });
    expect(texte(screen.getByRole('region', { name: 'Ce qui compte' })).match(/38 cm de fond/g)).toHaveLength(1);
  });

  it('3 · n° 15 : une seule fonction de comptes ; la liste, le carnet ouvert et la suppression disent les mêmes chiffres sur la fixture', () => {
    const v = carnet(ID_VENTILATION);
    const n = comptesCarnet(v.carnet);
    expect(n).toMatchObject({ facons: 2, ecartees: 1, articles: 6, lus: 5, sansApercu: 1 });
    expect(texteComptes(n)).toEqual(['2 façons', '6 articles']);
    const liste = render(<ListeCarnets carnets={carnets()} onOuvrir={rien} />);
    const carte = [...liste.container.querySelectorAll('.cn-carnet')].find(e => e.textContent?.includes('Ventilation'))!;
    expect(texte(carte.querySelector('.cn-compte-ligne')!)).toMatch(/^2 façons · 6 articles ·/);
    cleanup();
    const ouvert = ouvrir(v);
    expect(texte(ouvert.container.querySelector('.cn-ligne-etat')!)).toMatch(/^2 façons à comparer/);
    expect(texte(ouvert.container.querySelector('.cn-tete-articles .cn-compte')!)).toBe('6');
    cleanup();
    expect(cequiPart(v.carnet)).toBe('3 critères, 6 articles, 2 façons, 1 façon écartée et 3 notes'); // paquet 1, PCN-165 : les critères partent aussi
    const supp = render(<SupprimerCarnet titre={v.title} contenu={v.carnet} liens={[]} onDetacher={rien} onArchiver={rien} onSupprimer={rien} onGarder={rien} />);
    expect(texte(supp.container)).toContain('6 articles, 2 façons, 1 façon écartée');
  });

  it('4 · n° 16 (R11, g5:v04-4) : créé · après, le bandeau du lot A seul ; ni encadré beige « Idée · Ensuite… » ni points ●○○○', () => {
    const { container } = ouvrir(neuf({}, 'ZZ TEST — Embouteillage'), { tableau: null, vientDEtreCree: true, bandeau: <div className="cn-bandeau">✓ Carnet créé · Annuler</div> });
    expect(container.querySelector('.cn-encadre-idee')).toBeNull();
    expect(container.querySelector('.cn-etapes')).toBeNull();
    expect(texte(container)).not.toContain('Ensuite :');
    expect(texte(container)).toContain('✓ Carnet créé');
  });

  it('5 · n° 32 : l’état n’a qu’une forme, la pastille (g05-1) ; « 2 façons à comparer » la remplace sur h05-3', () => {
    const a = ouvrir(neuf(), { tableau: null, vientDEtreCree: true });
    expect([...a.container.querySelectorAll('.cn-tete .cn-pastille')].map(texte)).toEqual(['Idée · 15 nov.']);
    cleanup();
    const b = ouvrir(neuf(), { tableau: null });
    expect([...b.container.querySelectorAll('.cn-tete .cn-pastille')].map(texte)).toEqual(['Idée · 15 nov.']);
    cleanup();
    const v = ouvrir(carnet(ID_VENTILATION));
    expect(v.container.querySelector('.cn-tete .cn-pastille')).toBeNull();
    expect(v.container.querySelector('.cn-etapes')).toBeNull();
  });

  it('6 · n° 20 (R05, D-78) : la fixture porte une photo de banc simulée, locale ; l’article ouvert la montre, dite « exemple » ; le picto reste le repli', () => {
    expect(PHOTO_BANC_HOTTE.startsWith('data:image/svg+xml')).toBe(true);
    expect(PHOTO_BANC_HOTTE).not.toMatch(/https?%3A%2F%2F(?!www\.w3\.org)/i);
    const v = carnet(ID_VENTILATION);
    const avec = v.carnet.articles.find(a => a.photo === PHOTO_BANC_HOTTE)!;
    expect(avec).toBeTruthy();
    expect(Object.values(avec.valeurs).every(x => x.origine === 'exemple')).toBe(true);
    const { container } = render(<FicheArticle article={avec} carnet={v.carnet} titreCarnet={v.title} facon={v.carnet.facons[0]} onRetour={rien} onVeille={rien} onChoisir={rien} />);
    const fig = container.querySelector('[data-cadre="photo"]')!;
    expect(fig.querySelector('img')!.getAttribute('src')).toBe(PHOTO_BANC_HOTTE);
    expect(texte(fig)).toContain('photo de la page collée');
    expect(texte(fig)).toContain('exemple');
    cleanup();
    const sans = v.carnet.articles.find(a => a.id === 'ZZ-V-A1')!;
    const r = render(<FicheArticle article={sans} carnet={v.carnet} titreCarnet={v.title} onRetour={rien} onVeille={rien} />);
    expect(r.container.querySelector('[data-cadre="picto"] [data-picto]')).toBeTruthy();
  });

  it('7 · n° 33 : le fil d’Ariane de l’article, coupé sur un mot, sur une ligne à 390 ; le titre entier reste lu', () => {
    const t = 'ZZ TEST — Ventilation de la salle de brassage';
    const court = filArianeCourt(t);
    expect(court).toBe('ZZ TEST — Ventilation…');
    expect(t.startsWith(court.slice(0, -1))).toBe(true);
    expect(filArianeCourt('Embouteillage')).toBe('Embouteillage');
    expect(filArianeCourt('Hotte de la cuve au-dessus')).toBe('Hotte de la cuve…');
    const v = carnet(ID_VENTILATION);
    const a = v.carnet.articles[0];
    const { container } = render(<FicheArticle article={a} carnet={v.carnet} titreCarnet={t} onRetour={rien} onVeille={rien} />);
    expect(texte(container.querySelector('.cn-fil-court')!)).toBe('Articles · ZZ TEST — Ventilation…');
    expect(screen.getByRole('button', { name: `Articles · ${t}` })).toBeTruthy();
  });

  it('8 · n° 22 (R21) : choisir Renommer ferme le menu « Renommer / Supprimer l’idée » (menu, ✎, Échap)', () => {
    const onRenommer = vi.fn();
    ouvrir(carnet(ID_VENTILATION), { onRenommer });
    fireEvent.click(screen.getByRole('button', { name: 'Plus' }));
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: /Renommer/ }));
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Plus' }));
    fireEvent.click(screen.getByRole('button', { name: 'Renommer' }));
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Plus' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Plus' }));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(onRenommer).toHaveBeenCalledTimes(2);
  });

  it('9 · n° 28 : « 1 façon », jamais « 1 façons » (une fonction pluriel)', () => {
    expect(pluriel(1, 'façon')).toBe('1 façon');
    expect(pluriel(0, 'façon')).toBe('0 façon');
    expect(pluriel(2, 'façon')).toBe('2 façons');
    expect(accord(1, 'le', 'les')).toBe('le');
    const { container } = ouvrir(neuf({ facons: [{ id: 'f', nom: 'Sur pieds', etat: 'ouverte', origine: 'ia' }] }), { tableau: null });
    /* f5c n° 5 : une seule façon, sa carte est juste dessous : pas de compte (ni « 1 façon » ni « 1 façons ») */
    expect(texte(container)).not.toMatch(/\b1 façons?\b/);
    cleanup();
    const deux = ouvrir(neuf({ facons: [{ id: 'f', nom: 'Sur pieds', etat: 'ouverte', origine: 'ia' }, { id: 'g', nom: 'Murale', etat: 'ouverte', origine: 'ia' }] }), { tableau: null });
    expect(texte(deux.container)).toContain('2 façons');
  });

  it('10 · n° 30 (R25) : la phrase citée dit « votre phrase : « … » », jamais des guillemets seuls', () => {
    const { container } = ouvrir(neuf(), { tableau: null });
    const cites = [...container.querySelectorAll('.cn-cite')].map(texte);
    expect(cites).toContain('votre phrase : « 2 bacs pour laver les fûts »');
    expect(cites.every(t => !t.startsWith('«'))).toBe(true);
    cleanup();
    const v = ouvrir(carnet(ID_VENTILATION));
    expect([...v.container.querySelectorAll('.cn-cite')].map(texte).every(t => !t.startsWith('«'))).toBe(true);
  });

  it('11 · n° 31 : SupprimerCarnet accorde « 1 article en veille : le déplacer », « 2 articles… les déplacer »', () => {
    const v = carnet(ID_VENTILATION);
    const un = render(<SupprimerCarnet titre="t" contenu={v.carnet} liens={[]} proche={{ titre: 'Ventilation', onDeplacer: rien }} onDetacher={rien} onArchiver={rien} onSupprimer={rien} onGarder={rien} />);
    expect(texte(un.container)).toContain('1 article en veille : le déplacer dans Ventilation');
    cleanup();
    const deux = { ...v.carnet, articles: v.carnet.articles.map(a => ({ ...a, veille: { active: true, depuis: '2026-11-04T09:00:00.000Z' } })).slice(0, 2) };
    const d = render(<SupprimerCarnet titre="t" contenu={deux} liens={[]} proche={{ titre: 'Ventilation', onDeplacer: rien }} onDetacher={rien} onArchiver={rien} onSupprimer={rien} onGarder={rien} />);
    expect(texte(d.container)).toContain('2 articles en veille : les déplacer dans Ventilation');
    expect(cequiPart({ ...v.carnet, articles: v.carnet.articles.slice(0, 1), criteres: [], facons: [], notes: [], photos: [] })).toBe('1 article');
  });

  it('12 · n° 34 : « 1 critère sans valeur à comparer ⌄ », clair, et qui ne bouge pas pendant que l’IA range', () => {
    const v = carnet(ID_VENTILATION);
    const r = ouvrir(v);
    expect(screen.getByRole('button', { name: /^1 critère sans valeur à comparer$/ })).toBeTruthy();
    expect(texte(r.container)).not.toMatch(/\+\d sans valeur/);
    /* l'IA range (un cadre est posé) et un critère sans valeur arrive : le compte reste 1 */
    const plus = { ...v, carnet: { ...v.carnet, criteres: [...v.carnet.criteres, { id: 'kz', texte: 'pas trop de bruit', origine: 'locale' as const }] } };
    const cadre = <div className="cn-cadre">↓ va atterrir ici</div>;
    r.rerender(<CarnetOuvert carnet={plus} aides={AIDES_ETEINTES} liens={[]} tableau={calculerTableau(plus.carnet as never) as never} cadre={cadre} onRetour={rien} onRenommer={rien} onSupprimer={rien} onNote={rien} onOuvrirArticle={rien} onComparer={rien} />);
    expect(screen.getByRole('button', { name: /^1 critère sans valeur à comparer$/ })).toBeTruthy();
    /* rangé (plus de cadre) : le compte se met à jour une fois */
    r.rerender(<CarnetOuvert carnet={plus} aides={AIDES_ETEINTES} liens={[]} tableau={calculerTableau(plus.carnet as never) as never} onRetour={rien} onRenommer={rien} onSupprimer={rien} onNote={rien} onOuvrirArticle={rien} onComparer={rien} />);
    expect(screen.getByRole('button', { name: /^2 critères sans valeur à comparer$/ })).toBeTruthy();
  });

  it('13 · provenance lue par `sourceDuCritere` (lot A) ; le titre stocké rendu tel quel, « ZZ TEST — » compris', () => {
    expect(provenanceCritere({ origine: 'ia', source: 'phrase' })).toBe('de votre phrase');
    expect(provenanceCritere({ origine: 'ia' })).toBe("proposé par l'IA");
    expect(provenanceCritere({ origine: 'vous' })).toBe('de votre phrase');
    expect(provenanceCritere({ origine: 'locale' })).toBe('calculé sur place');
    expect(provenanceCritere({ origine: 'page' })).toBe('lu sur la page');
    expect(provenanceCritere({ origine: 'exemple' })).toBe("proposé par l'IA");
    ouvrir(carnet(ID_VENTILATION));
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('ZZ TEST — Ventilation de la salle de brassage');
  });

  it('14 · doute : la note du banc donne une pompe plausible (2 à 5 m³/h)', () => {
    const m = /pompe[^\d]*(\d+(?:[.,]\d+)?)\s*m³\/h/i.exec(NOTE_EN_VRAC_BANC);
    expect(m).toBeTruthy();
    const debit = Number(m![1].replace(',', '.'));
    expect(debit).toBeGreaterThanOrEqual(2);
    expect(debit).toBeLessThanOrEqual(5);
    expect(ETATS_BANC.some(e => e.gestes.some(g => g.includes('Pour la pompe : 3 m³/h')))).toBe(true);
  });

  it('15 · banc : une adresse connue de la lecture simulée pour 14b et 15b ; `&zero=1` part sans fixture (D-63)', async () => {
    const page = await lireLienSimule('https://exemple.invalid/hotte-140', { delaiMs: 0 });
    expect(page.nom).toBe('Hotte inox 140 cm + extracteur');
    expect(ETATS_BANC.some(e => e.capture.includes('14b') && e.gestes.some(g => g.includes('exemple.invalid/hotte-140')))).toBe(true);
    expect(ETATS_BANC.some(e => e.capture.includes('19b') && e.gestes.some(g => g.includes('pompe-magnetique')))).toBe(true);
    expect(lireParametresBanc('?preview=carnets&zero=1').vide).toBe(true);
    expect(lireParametresBanc('?preview=carnets').vide).toBe(false);
  });
});
