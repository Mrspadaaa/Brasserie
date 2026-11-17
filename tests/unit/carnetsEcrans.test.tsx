// @vitest-environment jsdom
// Carnet d'idées, lot C (port du 17.11) : écrans figés et gestes, rendus par props, IA simulée (aucun appel).
// Critères C1 (figés, signatures refusées, garde C1, inconnu jamais 0) et C6 (aides, Suppression v2, veille, G8, G9, G29,
// pastilles, G30, G32) de MISSION.md § Lot C.
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AIDES_ETEINTES, montant, valeurTexte, dateCourte, type AidesV, type ArticleV, type CarnetV, type ContenuCarnetV } from '../../src/ui/carnets/EtatIA';
import { ListeCarnets } from '../../src/ui/carnets/ListeCarnets';
import { CarnetOuvert, type LienV } from '../../src/ui/carnets/CarnetOuvert';
import { CarteArticle } from '../../src/ui/carnets/CarteArticle';
import { FicheArticle } from '../../src/ui/carnets/FicheArticle';
import { Comparer, type TableauV } from '../../src/ui/carnets/Comparer';
import { Choisir } from '../../src/ui/carnets/Choisir';
import { ChampCarnet } from '../../src/ui/carnets/ChampCarnet';
import { CadreArrivee } from '../../src/ui/carnets/CadreArrivee';
import { Bandeau } from '../../src/ui/carnets/Bandeau';
import { LigneRangee } from '../../src/ui/carnets/LigneRangee';
import { NoteEnVrac, trierLignes, resumeVrac } from '../../src/ui/carnets/NoteEnVrac';
import { FeuilleNote } from '../../src/ui/carnets/FeuilleNote';
import { RenommerCarnet } from '../../src/ui/carnets/RenommerCarnet';
import { SupprimerCarnet, cequiPart } from '../../src/ui/carnets/SupprimerCarnet';
import { Photos } from '../../src/ui/carnets/Photos';
import { dimensionsCible, poidsDataUrl } from '../../src/ui/carnets/photo';
import { fixtureCarnets, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnet, type CarnetDoc } from '../../src/domain/carnets/modele';
import { tableau as calculerTableau } from '../../src/domain/carnets/comparer';

import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { appelsSimules } from '../../src/ui/carnets/rangement';
import { aidesCarnet } from '../../src/config/carnetIA';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('IA réelle interdite en test'); }) } }));
afterEach(cleanup);

const TOUTES: AidesV = { doublon: true, noteEnCritere: true, consequence: true, regrouper: true, renommerPropose: true };
const rien = () => undefined;

// Signatures refusées, recopiées de work/refonte-frontend/v4/choix/maquettes.json › chantiers.carnet.refuses (K1 à K4) et garde C1.
const K1 = [/\bEn cours\b/, /\bChoisis\b/];
const K2 = '✓ choix';
const K3 = /↓ ?\d[\d ']* ?CHF/;
const K4 = /[ée]tape \d+ ?(\/|sur) ?\d+/iu;
const C1 = /\d+ façons? · \d+ articles?/;

function sansRefus(el: HTMLElement) {
  const t = el.textContent ?? '';
  expect(K1.every(r => r.test(t)), 'K1').toBe(false);
  expect(t.includes(K2), 'K2').toBe(false);
  expect(K3.test(t), 'K3').toBe(false);
  expect(K4.test(t), 'K4').toBe(false);
  expect(t.includes('quoi ?'), '« quoi ? »').toBe(false);
  expect(/[ÉE]tape/.test(t), '« Étape »').toBe(false);
  expect(el.querySelector('[role=dialog], [role=alertdialog], dialog'), 'aucune boîte (Q18)').toBeNull();
}
/** Aucun « 0 » isolé rendu (une valeur inconnue n'est jamais 0). */
function sansZeroInvente(el: HTMLElement) {
  const t = (el.textContent ?? '').replace(/ /g, ' ');
  expect(/(^|[^\d,.'’ ])0([^\d,.]|$)/.test(t), `zéro inventé dans « ${t.slice(0, 200)} »`).toBe(false);
}

// --- Fixture (contenus des figés, prix et vendeurs marqués « exemple ») ---
const art = (x: Partial<ArticleV> & { id: string }): ArticleV => ({ valeurs: {}, lecture: 'lue', origine: 'exemple', ...x });
const contenu = (x: Partial<ContenuCarnetV>): ContenuCarnetV => ({ creeLe: '2026-11-15', phrase: '', criteres: [], facons: [], articles: [], notes: [], photos: [], ...x });

const ventilation: CarnetV = {
  id: 'zz-ventil', title: 'Ventilation de la salle de brassage', status: 'research',
  carnet: contenu({
    phrase: 'ventilation de la salle de brassage',
    criteres: [
      { id: 'cr1', texte: 'capter la buée à la source', origine: 'ia' },
      { id: 'cr2', texte: 'débit', origine: 'ia', caracteristique: { nom: 'débit', unite: 'm³/h', sens: 'plus' } },
    ],
    facons: [
      { id: 'f1', nom: 'Hotte + extracteur', etat: 'retenue', raison: 'capte la buée', origine: 'ia' },
      { id: 'f2', nom: 'Extracteur mural', etat: 'ecartee', raison: 'ne capte pas la buée', origine: 'ia' },
    ],
    articles: [
      art({ id: 'a1', nom: 'Hotte inox 120 cm', prixCentimes: 260000, vendeur: 'Inox Riviera', pays: 'CH', faconId: 'f1', valeurs: { débit: { valeur: 1800, unite: 'm³/h', origine: 'exemple' } } }),
      art({ id: 'a2', nom: 'Hotte murale 100 cm', prixCentimes: 145000, vendeur: 'Abluft West', pays: 'DE', faconId: 'f1', veille: { active: true, depuis: '2026-11-16' }, valeurs: { débit: { valeur: 1200, unite: 'm³/h', origine: 'exemple' } } }),
      art({ id: 'a3', nom: 'Hélicoïde mural', prixCentimes: 42000, vendeur: 'Air Léman', pays: 'CH', faconId: 'f2', valeurs: {} }),
      art({ id: 'a4', domaine: 'ventil-express.ch', url: 'https://ventil-express.ch/x', lecture: 'illisible' }),
    ],
    notes: [
      { id: 'n1', texte: 'avis du ferblantier', genre: 'a-faire', le: '2026-11-16' },
      { id: 'n2', texte: 'Demander l’avis du ferblantier', genre: 'note', le: '2026-11-17' },
    ],
  }),
};
const evier: CarnetV = { id: 'zz-evier', title: 'Évier inox', status: 'idea', carnet: contenu({ phrase: '2 bacs pour laver les fûts' }) };
const embouteillage: CarnetV = {
  id: 'zz-emb', title: 'Embouteillage', status: 'validated',
  carnet: contenu({
    phrase: 'embouteillage',
    articles: [art({ id: 'e1', nom: 'Isobarique 4 becs', prixCentimes: 1170000, vendeur: 'Brassage Romandie', pays: 'CH', dispo: 'en stock' })],
    choix: { articleId: 'e1', pourquoi: 'oxygène le plus bas, SAV suisse', ecartes: [], le: '2026-11-14', remplaces: [] },
  }),
};
const frigo: CarnetV = {
  id: 'zz-frigo', title: 'Frigo de garde pour fûts', status: 'validated',
  carnet: contenu({
    articles: [art({ id: 'g1', nom: 'Chambre froide 6 fûts', prixCentimes: 490000, vendeur: 'Froid Léman' })],
    choix: { articleId: 'g1', pourquoi: 'tient 2 °C en été, 6 fûts', ecartes: [], le: '2026-10-10', remplaces: [] },
    sortie: { planId: 'plan-1', le: '2026-11-16' },
  }),
};
const TOUS = [ventilation, evier, embouteillage, frigo];

// Même forme que `tableau(carnet)` de comparer.ts (lot A) ; le cas réel est joué plus bas sur la fixture du lot A.
const v = (n: number) => ({ valeur: n, unite: 'm³/h', origine: 'exemple' as const });
const tableau: TableauV = {
  rangePar: 'tient 80 °C d’abord, puis le débit',
  colonnes: [{ nom: 'débit', unite: 'm³/h', sens: 'plus', critereId: 'cr2' }],
  lignes: [
    { articleId: 'a1', nom: 'Hotte inox 120 cm', rang: 1, cellules: { débit: v(1800) }, prixCentimes: 260000, moinsBienPartout: false },
    { articleId: 'a2', nom: 'Hotte murale 100 cm', rang: 2, cellules: { débit: v(1200) }, prixCentimes: 145000, moinsBienPartout: true },
    { articleId: 'a5', nom: 'Centrifuge en ligne', rang: 3, cellules: {}, prixCentimes: 69000, moinsBienPartout: false },
    { articleId: 'a3', nom: 'Hélicoïde mural', rang: null, cellules: { débit: v(1500) }, prixCentimes: 42000, moinsBienPartout: false, ecarte: { raison: 'ne capte pas la buée' } },
  ],
};

const ouvert = (x: Partial<React.ComponentProps<typeof CarnetOuvert>> = {}) => render(
  <CarnetOuvert carnet={ventilation} aides={TOUTES} liens={[]} tableau={tableau} onRetour={rien} onRenommer={rien} onSupprimer={rien}
    onNote={rien} onOuvrirArticle={rien} onComparer={rien} {...x} />,
);

describe('C1 · écrans figés', () => {
  it('R01 liste des carnets : groupes par état, « n façons · n articles », À venir, veille demandée sans relève', () => {
    const { container } = render(<ListeCarnets carnets={TOUS} onOuvrir={rien} onCollerLien={rien} />);
    for (const g of ['À comparer', 'Idée', 'Choisi', 'En veille']) expect(screen.getAllByText(g, { exact: false }).length).toBeGreaterThan(0);
    expect(C1.test(container.textContent ?? '')).toBe(true);
    expect(screen.getByText('Ventilation de la salle de brassage')).toBeTruthy();
    expect(container.textContent).toContain('Ensuite : avis du ferblantier');
    expect(container.textContent).toContain('« 2 bacs pour laver les fûts »');
    expect(screen.getByRole('button', { name: /Coller un lien/ })).toBeTruthy();
    expect(container.textContent).toContain('Dans À venir depuis le 16 nov.');
    expect(container.textContent).toContain('demandée · pas encore relevée');
    expect(container.textContent).not.toMatch(/baisse|relue|revu le/);
    sansRefus(container);
  });
  it('R01 : un carnet sans prix ne montre aucun prix, jamais 0', () => {
    const { container } = render(<ListeCarnets carnets={[evier]} onOuvrir={rien} />);
    expect(container.textContent).not.toContain('CHF');
    sansZeroInvente(container);
  });
  it('R02 liste vide, geste 1 : phrase d’achat, carte fantôme, puces exemples (G1), brouillon en second (G2)', () => {
    const onExemple = vi.fn();
    const { container } = render(<ListeCarnets carnets={[]} onOuvrir={rien} onExemple={onExemple} />);
    expect(container.textContent).toContain('Collez le lien d\'un objet ou notez un besoin');
    expect(container.textContent).toContain('arrive ici');
    expect(container.textContent).toContain('Aucun carnet encore.');
    expect(container.textContent).toContain('Une note en vrac marche aussi.');
    fireEvent.click(screen.getByRole('button', { name: 'Frigo de garde' }));
    expect(onExemple).toHaveBeenCalledWith('Frigo de garde');
    expect(container.textContent).not.toMatch(/Écrivez ou collez ici/);
    sansRefus(container);
  });
  it('R03 carnet ouvert : titre, Ce qui compte, façons, articles en tableau, sans tuiles « quoi ? »', () => {
    const { container } = ouvert();
    expect(screen.getByRole('heading', { name: 'Ventilation de la salle de brassage' })).toBeTruthy();
    /* P11 : deux critères, « Ce qui compte » et la provenance une fois en tête, puis une ligne courte par critère */
    expect(container.textContent).toContain("Ce qui compte, proposé par l'IA :capter la buée à la source");
    expect(container.textContent).toContain('Hotte + extracteur ou Extracteur mural ?');
    expect(container.textContent).toContain('capte la buée');
    expect(container.textContent).toContain('1 sans aperçu');
    expect(screen.getByRole('button', { name: /Comparer côte à côte/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Renommer' })).toBeTruthy();
    for (const tuile of ['Article', 'Façon', 'Critère']) expect(screen.queryByRole('button', { name: tuile })).toBeNull();
    sansRefus(container);
  });
  it('R04 carte d’article : nom, d’où il vient, prix, mesure du critère, « veille demandée »', () => {
    const { container } = render(<CarteArticle article={ventilation.carnet.articles[1]} critere={ventilation.carnet.criteres[1]} rang={2} onOuvrir={rien} />);
    expect(container.textContent).toContain('Hotte murale 100 cm');
    expect(container.textContent).toContain('Abluft West · DE');
    expect(container.textContent).toMatch(/1 450/);
    expect(container.textContent).toContain('1 200 m³/h · 2e');
    expect(container.textContent).toContain('veille demandée');
    expect(container.textContent).not.toMatch(/active/);
    expect(container.textContent?.replace('veille demandée', '')).not.toMatch(/veille/i);
  });
  it('R04 : caractéristique inconnue dite « non publié », lien illisible « page non lue », jamais 0', () => {
    const { container } = render(<><CarteArticle article={ventilation.carnet.articles[2]} critere={ventilation.carnet.criteres[1]} /><CarteArticle article={ventilation.carnet.articles[3]} /></>);
    expect(container.textContent).toContain('débit non publié');
    expect(container.textContent).toContain('ventil-express.ch · page non lue');
    expect(screen.getByRole('link', { name: /Ouvrir/ })).toBeTruthy();
    sansZeroInvente(container);
  });
  it('R05 article ouvert : nom, offre, Ouvrir ↗, caractéristiques, Choisir', () => {
    const a = art({ id: 'x', nom: 'Isobarique 4 becs pré-évacuation', url: 'https://ex.ch/a', prixCentimes: 1170000, vendeur: 'Brassage Romandie', pays: 'CH', dispo: 'en stock', valeurs: { cadence: { valeur: 400, unite: 'bt/h', origine: 'exemple' } } });
    const { container } = render(<FicheArticle article={a} titreCarnet="Embouteillage" onRetour={rien} onVeille={rien} onChoisir={rien} rang={1} sur={5} />);
    expect(container.textContent).toContain('Articles · Embouteillage');
    expect(container.textContent).toContain('1re sur 5');
    expect(container.textContent).toContain('Brassage Romandie · CH');
    expect(container.textContent).toContain('cadence');
    expect(screen.getByRole('button', { name: /Choisir · Brassage Romandie/ })).toBeTruthy();
    expect(container.textContent).toContain('Part dans À venir');
  });
  it('R06 comparer : rangé par, rangs, meilleur surligné, moins bien partout, écarté à la fin avec sa raison, inconnu vide', () => {
    const { container } = render(<Comparer titre="Ventilation" statut="research" critere={ventilation.carnet.criteres[0]} tableau={tableau} onRetour={rien} onChoisir={rien} />);
    expect(container.textContent).toContain('rangé par : tient 80 °C d’abord, puis le débit');
    expect(container.textContent).toContain('moins bien partout');
    const tetes = Array.from(container.querySelectorAll('thead th')).map(t => t.textContent);
    expect(tetes[tetes.length - 1]).toContain('Hélicoïde mural');
    expect(tetes[tetes.length - 1]).toContain('écarté');
    expect(container.textContent).toContain('ne capte pas la buée');
    expect(container.querySelectorAll('td.cn-meilleur').length).toBe(2);
    expect(screen.getAllByLabelText('inconnu').length).toBe(1);
    expect(screen.getByRole('button', { name: 'Choisir' })).toBeTruthy();
    sansZeroInvente(container);
    sansRefus(container);
  });
  it('R06 sur la fixture du lot A : `tableau()` de comparer.ts passé tel quel, carnet lu tel quel (types compatibles)', () => {
    const items = fixtureCarnets().map(lireCarnet).filter((c): c is CarnetDoc => !!c);
    const ventil = items.find(c => c.id === ID_VENTILATION)!;
    const vue: CarnetV = ventil;
    const t = calculerTableau(ventil);
    expect(t).not.toBeNull();
    const { container } = render(<Comparer titre={vue.title} statut={vue.status} critere={vue.carnet.criteres[0]} tableau={t} onRetour={rien} onChoisir={rien} exemple />);
    expect(container.querySelectorAll('thead th').length).toBe(t!.lignes.length + 1);
    if (t!.rangePar) expect(container.textContent).toContain(`rangé par : ${t!.rangePar}`);
    sansZeroInvente(container);
    sansRefus(container);
    cleanup();
    const l = render(<ListeCarnets carnets={items} onOuvrir={rien} />);
    expect(C1.test(l.container.textContent ?? '')).toBe(true);
    sansRefus(l.container);
    cleanup();
    const o = render(<CarnetOuvert carnet={ventil} aides={TOUTES} liens={[]} tableau={t} onRetour={rien} onRenommer={rien} onSupprimer={rien} onNote={rien} onOuvrirArticle={rien} onComparer={rien} />);
    expect(o.container.textContent).toContain(ventil.title);
    sansRefus(o.container);
  });
  it('R06 / G20 : à 0 ou 1 article, pas de tableau, le tableau naît au 2e', () => {
    const { container } = render(<Comparer titre="Évier" statut="idea" tableau={null} onRetour={rien} />);
    expect(container.querySelector('table')).toBeNull();
    expect(container.textContent).toContain('Le tableau naît au 2e article');
  });
  it('R07 choisir puis choisi, pourquoi, choix d’avant lisible, sortie vers À venir', () => {
    const a = embouteillage.carnet.articles[0];
    const onChoisir = vi.fn();
    const r1 = render(<Choisir etape="choisir" titre="Embouteillage" onRetour={rien} article={a} sur={5} valeurs={[{ nom: 'Cadence', texte: '400 bt/h', rang: 2 }]} autres={[]} pourquoiPropose="oxygène le plus bas" onChoisir={onChoisir} onEcarter={rien} />);
    expect(r1.container.textContent).toContain('place parmi les 5');
    fireEvent.click(screen.getByRole('button', { name: 'Choisir chez Brassage Romandie' }));
    expect(onChoisir).toHaveBeenCalledWith('oxygène le plus bas');
    sansRefus(r1.container);
    r1.unmount();
    const onEnvoyer = vi.fn();
    const r2 = render(<Choisir etape="choisi" titre="Embouteillage" onRetour={rien} choix={embouteillage.carnet.choix!} article={a} ecartes={[{ nom: 'Le monobloc', raison: '50 ppb, écart incertain' }]} remplaces={[{ nom: '2 becs de table', pourquoi: 'trop lent', le: '2026-11-10' }]} onEnvoyerAVenir={onEnvoyer} />);
    expect(r2.container.textContent).toContain('Choisi le 14 nov.');
    expect(r2.container.textContent).toContain('Pourquoi ce choix');
    expect(r2.container.textContent).toContain("Choix d'avant · 1");
    fireEvent.click(screen.getByRole('button', { name: /Envoyer dans À venir/ }));
    expect(onEnvoyer).toHaveBeenCalled();
    expect(r2.container.textContent).not.toMatch(/caisse|trésorerie/i);
    sansRefus(r2.container);
    r2.unmount();
    const r3 = render(<Choisir etape="choisi" titre="Frigo" onRetour={rien} choix={frigo.carnet.choix!} article={frigo.carnet.articles[0]} ecartes={[]} sortie={{ le: '2026-11-16' }} onEnvoyerAVenir={rien} />);
    expect(r3.container.textContent).toContain('Dans À venir depuis le 16 nov.');
    expect(screen.queryByRole('button', { name: /Envoyer dans À venir/ })).toBeNull();
  });
});

describe('Gestes : créer, ajouter, lien, note en vrac (R09 à R19)', () => {
  it('R10 créer · pendant : arrive ici, carnet proche (✻), Ce qui compte tiré de la phrase (G3), raison sinon (G4)', () => {
    const onAjouter = vi.fn();
    const r = render(<CadreArrivee cadre={{ sorte: 'creer', titre: 'Hotte au-dessus de la cuve', ceQuiCompte: '2 rouleaux réglables', proche: { titre: 'Ventilation de la salle de brassage', onAjouter } }} onAnnuler={rien} />);
    expect(r.container.textContent).toContain('Nouveau carnet · Idée');
    expect(r.container.textContent).toContain('Déjà un carnet proche : Ventilation de la salle de brassage');
    expect(r.container.textContent).toContain('Ce qui compte · 2 rouleaux réglables');
    fireEvent.click(screen.getByRole('button', { name: /Y ajouter en façon/ }));
    expect(onAjouter).toHaveBeenCalled();
    r.unmount();
    const r2 = render(<CadreArrivee cadre={{ sorte: 'creer', titre: 'Doseur', raisonNeuf: 'Aucun de vos 3 carnets n\'en parle : nouveau carnet, votre phrase en titre' }} onAnnuler={rien} />);
    expect(r2.container.textContent).toContain('Aucun de vos 3 carnets n\'en parle');
  });
  it('R11 créer · après : bandeau « Carnet créé · Annuler », votre phrase en titre ; G5, G6 ; G7 champ « Ajouter à … »', () => {
    const neuf: CarnetV = { id: 'zz-emb2', title: 'Embouteillage', status: 'idea', carnet: contenu({ phrase: 'embouteillage', creeLe: '2026-11-17' }) };
    const onAnnuler = vi.fn();
    const { container } = render(<CarnetOuvert carnet={neuf} aides={TOUTES} liens={[]} tableau={null} vientDEtreCree onRetour={rien} onRenommer={rien} onSupprimer={rien} onNote={rien} onOuvrirArticle={rien} onComparer={rien}
      bandeau={<Bandeau bandeau={{ sorte: 'cree', phrase: 'embouteillage' }} onAnnuler={onAnnuler} />} />);
    expect(container.textContent).toContain('✓ Carnet créé, en tête des Carnets');
    expect(container.textContent).toContain('« embouteillage » · votre phrase en titre');
    expect(container.textContent).toContain("Ce qui compte · rien encore : l'IA le proposera");
    expect(container.textContent).toContain("aucune : l'IA les cherche");
    expect(container.textContent).toContain('aucun : collez un lien');
    expect(container.textContent).toContain('Le champ en bas range tout ici');
    expect(container.textContent).not.toContain('Photos');
    fireEvent.click(screen.getByRole('button', { name: /Annuler/ }));
    expect(onAnnuler).toHaveBeenCalled();
    cleanup();
    render(<ChampCarnet valeur="" onChange={rien} onEnvoyer={rien} titreCarnet="Embouteillage" />);
    expect(screen.getByPlaceholderText('Ajouter à Embouteillage…')).toBeTruthy();
  });
  it('R11 : le carnet créé paraît en tête de la liste', () => {
    const { container } = render(<ListeCarnets carnets={TOUS} enTete="zz-evier" onOuvrir={rien} />);
    const titres = Array.from(container.querySelectorAll('.cn-carnet-titre')).map(t => t.textContent);
    expect(titres[0]).toBe('Évier inox');
  });
  it('R13 texte · pendant : va atterrir ici, ✕ (G10) ; G9 conséquence sous le cadre (R45), rien sans', () => {
    const onAnnuler = vi.fn();
    const r = render(<CadreArrivee cadre={{ sorte: 'texte', rubrique: 'Ce qui compte', texte: 'un fût de 30 L couché entre dans le bac', origine: 'ia', compareSur: 'la profondeur de bac' }} consequence="les articles seront rangés sur le fond de bac, 38 cm au moins" onAnnuler={onAnnuler} />);
    expect(r.container.textContent).toContain('va atterrir ici');
    expect(r.container.textContent).toContain('✻ tiré de votre phrase');
    expect(r.container.textContent).toContain('les articles seront rangés sur le fond de bac, 38 cm au moins');
    const sous = r.container.querySelector('.cn-consequence-sous')!;
    expect(sous.querySelector('[data-picto="local"]')).toBeTruthy();
    expect(sous.textContent).not.toContain('✻');
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onAnnuler).toHaveBeenCalled();
    r.unmount();
    const r2 = render(<CadreArrivee cadre={{ sorte: 'texte', rubrique: 'Notes', texte: 'x', origine: 'ia' }} onAnnuler={rien} />);
    expect(r2.container.textContent).not.toContain('seront rangés');
  });
  it('R14 texte · après : « Rangé ici · Annuler », phrase citée, G12 trois corrections', () => {
    const fns = { onAnnuler: vi.fn(), onVotreTexte: vi.fn(), onDeplacer: vi.fn(), onChangerEnNote: vi.fn() };
    const { container } = render(<LigneRangee phrase="bacs assez profonds pour laver un fût de 30 L couché" rangeSur="fond de bac, 38 cm au moins" {...fns}><b>Un fût de 30 L couché entre dans le bac</b></LigneRangee>);
    expect(container.textContent).toContain("✓ Rangé ici, à l'instant");
    expect(container.textContent).toContain('votre phrase : « bacs assez profonds pour laver un fût de 30 L couché »');
    expect(container.textContent).toContain('articles rangés sur : fond de bac, 38 cm au moins');
    for (const [nom, fn] of [['Votre texte', fns.onVotreTexte], ['Déplacer', fns.onDeplacer], ['Changer en note', fns.onChangerEnNote]] as const) {
      fireEvent.click(screen.getByRole('button', { name: nom })); expect(fn).toHaveBeenCalled();
    }
  });
  it('G13 : écrit depuis la liste, la ligne du carnet visé s’éclaire', () => {
    const { container } = render(<ListeCarnets carnets={TOUS} eclaire={{ carnetId: 'zz-evier', quoi: 'Critère ajouté', tireDe: 'fût de 30 L couché', onDeplacer: rien, onAnnuler: rien }} onOuvrir={rien} />);
    const e = container.querySelector('.cn-eclaire')!;
    expect(e.textContent).toContain('Évier inox');
    expect(e.textContent).toContain('Critère ajouté');
    expect(e.textContent).toContain('tiré de « fût de 30 L couché »');
  });
  it('R15, R16 lien : puce « Coller : … », lecture de la page, squelette, progression (G17), ce que cherche l’IA (G18), depuis la liste (G16)', () => {
    const onColler = vi.fn();
    render(<ChampCarnet valeur="" onChange={rien} onEnvoyer={rien} titreCarnet="Évier inox" coller="https://plaque-froid.ch/echangeur-30" onColler={onColler} />);
    fireEvent.click(screen.getByRole('button', { name: /Coller : plaque-froid\.ch\/echan/ }));
    expect(onColler).toHaveBeenCalled();
    cleanup();
    const { container } = render(<CadreArrivee cadre={{ sorte: 'lien', url: 'https://pompe-inox.ch/p/42', phase: 'lecture', lus: { nom: true, photo: true, prix: false, stock: false, valeurs: false }, cherche: ['nom', 'prix', 'photo', 'débit', '°C max'] }} onAnnuler={rien} />);
    expect(container.textContent).toContain('✻ lecture de la page…');
    expect(container.textContent).toContain('pompe-inox.ch/p/42');
    expect(container.textContent).toContain('nom ✓ · photo ✓ · prix · stock · valeurs');
    expect(container.textContent).toContain("l'IA cherche : nom, prix, photo, débit, °C max");
    expect(container.querySelector('.cn-squelette')).toBeTruthy();
    cleanup();
    const r = render(<CadreArrivee cadre={{ sorte: 'lien', url: 'https://x.ch', phase: 'lecture', depuisListe: true }} onAnnuler={rien} />);
    expect(r.container.textContent).toContain('Va atterrir ici · lien collé');
    expect(r.container.textContent).toContain('Ce qu\'elle ne lit pas reste vide');
  });
  it('R17 lien · après : carte complète rangée dans sa façon (G19), veille éteinte à la naissance, « tient 80 °C : oui »', () => {
    const c: CarnetV = { ...ventilation, carnet: { ...ventilation.carnet, articles: [art({ id: 'p1', nom: 'Pompe de transfert inox', domaine: 'pompe-inox.ch', pays: 'CH', prixCentimes: 69000, dispo: 'en stock', faconId: 'f1' })] } };
    const { container } = ouvert({ carnet: c, tableau: null, rangee: { cible: 'article', id: 'p1', luSurPage: ['nom', 'prix', 'photo', 'débit', '°C'], verdict: 'tient 80 °C : oui', onAnnuler: rien } });
    const rangee = container.querySelector('.cn-rangee')!;
    expect(rangee.textContent).toContain('Article rangé ici, dans Hotte + extracteur');
    expect(rangee.textContent).toContain('Veille du prix, tous les 3 jours');
    expect(rangee.textContent).toContain('tient 80 °C : oui');
    expect(within(rangee as HTMLElement).getByRole('switch').getAttribute('aria-checked')).toBe('false');
    expect(rangee.textContent).not.toContain('demandée');
  });
  it('R17 / G20 / G21 bandeaux : « <nom> rangé, 2e · Annuler » ; « Rangé dans <carnet> · Annuler », raison, Déplacer', () => {
    const { container } = render(<Bandeau bandeau={{ sorte: 'deuxieme', nom: 'Pompe magnétique', rang: 2 }} onAnnuler={rien} />);
    expect(container.textContent).toContain('Pompe magnétique rangé, 2e');
    cleanup();
    const onDeplacer = vi.fn();
    const r = render(<Bandeau bandeau={{ sorte: 'ailleurs', carnet: 'Ventilation', raison: 'la page parle d\'extraction de buée : comme Ventilation', onDeplacer }} onAnnuler={rien} />);
    expect(r.container.textContent).toContain("Rangé dans Ventilation, à l'instant");
    expect(r.container.textContent).toContain('la page parle d\'extraction de buée');
    fireEvent.click(screen.getByRole('button', { name: 'Déplacer' }));
    expect(onDeplacer).toHaveBeenCalled();
  });
  it('R18, R19 note en vrac : découpe typée, achats en tête, carnet neuf dit, puis « n lignes rangées dans n carnets », texte d’origine', () => {
    const lignes = [
      { id: 'l1', texte: 'Demander au ferblantier le diamètre d’évacuation, jeudi', genre: 'a-faire' as const, carnetId: 'zz-evier', carnetTitre: 'Évier inox' },
      { id: 'l2', texte: 'Hotte 120 cm trop large pour la salle ?', genre: 'question' as const, carnetId: 'zz-ventil', carnetTitre: 'Ventilation' },
      { id: 'l3', texte: 'Gaine alu Ø 150 mm', genre: 'a-acheter' as const, carnetId: 'zz-ventil', carnetTitre: 'Ventilation' },
    ];
    expect(trierLignes(lignes)[0].genre).toBe('a-acheter');
    expect(resumeVrac([lignes[0], { ...lignes[1], genre: 'note' }])).toBe("1 chose à faire et 1 note, pas d'achat");
    const r = render(<NoteEnVrac etat="pendant" lignes={lignes} texteOrigine="ferblantier jeudi / hotte trop large ? / gaine 150" origine="ia" onAnnuler={rien} />);
    expect(r.container.textContent).toContain("L'IA découpe votre note : 3 lignes, 2 carnets");
    expect(r.container.textContent).toContain('→ Évier inox');
    r.unmount();
    const r2 = render(<NoteEnVrac etat="pendant" lignes={[{ id: 'x', texte: 'Prochain brassin : IPA', genre: 'note', carnetTitre: 'Prochain brassin', neuf: true }]} texteOrigine="x" origine="ia" onAnnuler={rien} />);
    expect(r2.container.textContent).toContain('Prochain brassin · aucun carnet proche');
    r2.unmount();
    const onGenre = vi.fn();
    const r3 = render(<NoteEnVrac etat="apres" lignes={lignes} texteOrigine="ferblantier jeudi / hotte trop large ? / gaine 150" origine="ia" onChangerGenre={onGenre} onChangerCarnet={rien} onAnnuler={rien} />);
    expect(r3.container.textContent).toContain('✓ 3 lignes rangées dans 2 carnets');
    expect(r3.container.textContent).toContain("Texte d'origine");
    expect(r3.container.textContent).toContain('ferblantier jeudi / hotte trop large ? / gaine 150');
    fireEvent.click(screen.getByRole('button', { name: /à acheter ▾/ }));
    expect(onGenre).toHaveBeenCalledWith('l3');
  });
  it('R19 : sur la liste, les lignes ajoutées « +2 · question, à acheter »', () => {
    const { container } = render(<ListeCarnets carnets={TOUS} ajouts={{ 'zz-ventil': ['question', 'a-acheter'] }} onOuvrir={rien} />);
    expect(container.textContent).toContain('+2 · question, à acheter');
  });
});

describe('C6 · aides de l’IA (allumées puis éteintes)', () => {
  const doublon = { le: '16 nov.', onGarderAPart: rien };
  const regrouper = { avec: 'la douchette', onRegrouper: rien };
  it('G11 doublon dans le cadre', () => {
    const cadre = { sorte: 'texte' as const, rubrique: 'Notes' as const, texte: 'le ferblantier passe jeudi', origine: 'ia' as const };
    const r = render(<CadreArrivee cadre={cadre} aides={TOUTES} doublon={doublon} onAnnuler={rien} />);
    expect(r.container.textContent).toContain('Même chose que la note du 16 nov. : elles seront fusionnées');
    expect(screen.getByRole('button', { name: 'Garder à part' })).toBeTruthy();
    r.unmount();
    const r2 = render(<CadreArrivee cadre={cadre} aides={AIDES_ETEINTES} doublon={doublon} onAnnuler={rien} />);
    expect(r2.container.textContent).not.toContain('Même chose que');
    expect(screen.queryByRole('button', { name: 'Garder à part' })).toBeNull();
  });
  it('G27 regrouper dans le cadre de modification, G31 Supprimer dans le cadre', () => {
    const onSupprimer = vi.fn();
    const r = render(<CadreArrivee cadre={{ sorte: 'modifier', onSupprimer }} aides={TOUTES} regrouper={regrouper} onAnnuler={rien} />);
    expect(r.container.textContent).toContain('Se modifie ici');
    expect(r.container.textContent).toContain('✻ Même visite : la douchette');
    fireEvent.click(screen.getByRole('button', { name: /Supprimer/ }));
    expect(onSupprimer).toHaveBeenCalled();
    r.unmount();
    const r2 = render(<CadreArrivee cadre={{ sorte: 'modifier', onSupprimer }} aides={AIDES_ETEINTES} regrouper={regrouper} onAnnuler={rien} />);
    expect(r2.container.textContent).not.toContain('Même visite');
  });
  it('G25 feuille de note : « ✻ Ressemble à un critère · Passer en Ce qui compte »', () => {
    const n = ventilation.carnet.notes[0];
    const props = { note: n, ressembleCritere: true, onPasserCritere: rien, onModifier: rien, onChangerEnFacon: rien, onChangerEnCritere: rien, onSupprimer: rien, onFermer: rien };
    const r = render(<FeuilleNote {...props} aides={TOUTES} />);
    expect(r.container.textContent).toContain('✻ Ressemble à un critère · Passer en Ce qui compte');
    expect(screen.getByRole('menuitem', { name: 'Passer' })).toBeTruthy();
    for (const m of ['Modifier', 'Changer en façon', 'Changer en critère', 'Supprimer']) expect(screen.getByRole('menuitem', { name: m })).toBeTruthy();
    r.unmount();
    const r2 = render(<FeuilleNote {...props} aides={AIDES_ETEINTES} />);
    expect(r2.container.textContent).not.toContain('Ressemble à un critère');
  });
  it('G26 conséquence au bandeau, picto local, jamais le ✻', () => {
    const consequence = { texte: "l'évier Inox Riviera (60 cm) ne passerait plus", onPasserCritere: rien };
    const r = render(<Bandeau bandeau={{ sorte: 'modifiee' }} consequence={consequence} aideConsequence onAnnuler={rien} />);
    const c = r.container.querySelector('.cn-consequence')!;
    expect(c.textContent).toContain("l'évier Inox Riviera (60 cm) ne passerait plus");
    expect(c.textContent).toContain('Passer en Ce qui compte');
    expect(c.querySelector('[data-picto="local"]')).toBeTruthy();
    expect(c.textContent).not.toContain('✻');
    r.unmount();
    const r2 = render(<Bandeau bandeau={{ sorte: 'modifiee' }} consequence={consequence} aideConsequence={false} onAnnuler={rien} />);
    expect(r2.container.textContent).not.toContain('ne passerait plus');
    expect(r2.container.textContent).toContain("✓ Note modifiée, à l'instant");
  });
  it('G33 « ✻ doublon ? » sur la note, seulement si aides.doublon', () => {
    const r = ouvert({ doublons: ['n2'] });
    expect(r.container.textContent).toContain('doublon ?');
    r.unmount();
    const r2 = ouvert({ doublons: ['n2'], aides: AIDES_ETEINTES });
    expect(r2.container.textContent).not.toContain('doublon ?');
  });
});

describe('C6 · G8, G29, pastilles, G30, G32', () => {
  it('G8 bulle au focus, picto local sans ✻ ; un toucher remplit le champ ; sans suggestion, rien', () => {
    const onChange = vi.fn();
    const r = render(<ChampCarnet valeur="" onChange={onChange} onEnvoyer={rien} titreCarnet="Ventilation" suggestion={{ critere: 'plus de condensation au plafond', a: 'Hotte inox + extracteur', b: 'Extracteur mural seul' }} />);
    fireEvent.focus(screen.getByRole('textbox'));
    const bulle = screen.getByRole('button', { name: /peut trancher entre/ });
    expect(bulle.textContent).toContain('Le critère « plus de condensation au plafond » peut trancher entre Hotte inox + extracteur et Extracteur mural seul');
    expect(bulle.querySelector('[data-picto="local"]')).toBeTruthy();
    expect(bulle.textContent).not.toContain('✻');
    fireEvent.click(bulle);
    expect(onChange).toHaveBeenCalledWith('plus de condensation au plafond : ');
    r.unmount();
    render(<ChampCarnet valeur="" onChange={rien} onEnvoyer={rien} titreCarnet="Ventilation" />);
    fireEvent.focus(screen.getByRole('textbox'));
    expect(screen.queryByRole('button', { name: /peut trancher/ })).toBeNull();
  });
  it('champ : un geste envoie (Entrée ou Ajouter), ↑ sur la liste ; micro absent sans dictée ; aucune voix mise en avant', () => {
    const onEnvoyer = vi.fn();
    const r = render(<ChampCarnet valeur="hotte au-dessus de la cuve" onChange={rien} onEnvoyer={onEnvoyer} onPhoto={rien} />);
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }));
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onEnvoyer).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('button', { name: 'Dicter' })).toBeNull();
    r.unmount();
    render(<ChampCarnet valeur="un fût de 30 L" onChange={rien} onEnvoyer={rien} titreCarnet="Évier inox" vaDans={{ options: [{ id: 'c', libelle: 'Ce qui compte' }, { id: 'n', libelle: 'Note' }], choisi: 'c', onChoisir: rien }} />);
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ce qui compte' }).getAttribute('aria-pressed')).toBe('true');
  });
  it('G29 renommer : prérempli par la proposition, « ✻ proposé d’après « … » · avant : « … » » ; éteint : le titre actuel', () => {
    const onRenommer = vi.fn();
    const prop = { titre: 'Évier 2 bacs pour les fûts', phrase: '2 bacs pour laver les fûts' };
    const r = render(<RenommerCarnet titre="Évier inox" aides={TOUTES} proposition={prop} onRenommer={onRenommer} onAnnuler={rien} />);
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Évier 2 bacs pour les fûts');
    expect(r.container.textContent).toContain('✻ proposé d\'après « 2 bacs pour laver les fûts » · avant : « Évier inox »');
    fireEvent.submit(screen.getByRole('textbox').closest('form')!);
    expect(onRenommer).toHaveBeenCalledWith('Évier 2 bacs pour les fûts');
    r.unmount();
    const r2 = render(<RenommerCarnet titre="Évier inox" aides={AIDES_ETEINTES} proposition={prop} onRenommer={rien} onAnnuler={rien} />);
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Évier inox');
    expect(r2.container.textContent).not.toContain('proposé');
  });
  it('R47 pastilles « lié à » : 0 lien rien ; 4 liens, 3 pastilles et « +1 » ; supprimé ; aperçu sur place sans montant', () => {
    const r = ouvert({ liens: [] });
    expect(r.container.querySelector('.cn-liens')).toBeNull();
    r.unmount();
    const liens: LienV[] = [
      { sorte: 'a-venir', id: 'p1', libelle: 'Hotte inox 120 cm', etat: 'present', le: '2026-11-16' },
      { sorte: 'realise', id: 'p2', libelle: 'Gaine alu', etat: 'present' },
      { sorte: 'a-venir', id: 'p3', libelle: 'Ancien plan', etat: 'supprime' },
      { sorte: 'a-venir', id: 'p4', libelle: 'Quatrième', etat: 'present' },
    ];
    const onOuvrirLien = vi.fn();
    const r2 = ouvert({ liens, onOuvrirLien });
    const zone = r2.container.querySelector('.cn-liens') as HTMLElement;
    expect(zone.querySelectorAll('button.cn-pastille-lien').length).toBe(3);
    expect(zone.textContent).toContain('+1');
    expect(zone.textContent).toContain('À venir · supprimé');
    fireEvent.click(within(zone).getByRole('button', { name: /Hotte inox 120 cm/ }));
    const apercu = within(zone).getByRole('region', { name: 'Aperçu du lien' });
    expect(apercu.textContent).toContain('dans À venir · depuis le 16 nov.');
    expect(apercu.textContent).not.toMatch(/CHF|€|Fr\.|\d[  ']\d{3}/);
    fireEvent.click(within(apercu).getByRole('button', { name: 'Ouvrir dans À venir' }));
    expect(onOuvrirLien).toHaveBeenCalledWith(liens[0]);
  });
  it('G30 « ✓ Renommé · avant : <titre> · Annuler » et G32 « Note supprimée · Annuler » à la place de la note, sans boîte', () => {
    const onAnnuler = vi.fn();
    const r = render(<Bandeau bandeau={{ sorte: 'renomme', avant: 'Évier inox' }} onAnnuler={onAnnuler} />);
    expect(r.container.textContent).toMatch(/✓ Renommé · avant : Évier inox\s*Annuler/);
    sansRefus(r.container);
    r.unmount();
    const r2 = ouvert({ noteSupprimee: { id: 'nx', apres: 'n1', onAnnuler } });
    const notes = r2.container.querySelector('.cn-notes')!;
    const enfants = Array.from(notes.children).map(e => e.textContent ?? '');
    expect(enfants[1]).toMatch(/Note supprimée\s*Annuler/);
    fireEvent.click(within(notes as HTMLElement).getByRole('button', { name: 'Annuler' }));
    expect(onAnnuler).toHaveBeenCalled();
    sansRefus(r2.container);
  });
  it('G37 « Carnet supprimé · <titre> · Annuler » sur la liste, à la place du carnet', () => {
    const { container } = render(<ListeCarnets carnets={[ventilation, embouteillage]} supprime={{ titre: 'Évier inox', statut: 'idea', onAnnuler: rien }} onOuvrir={rien} />);
    const idee = container.querySelector('[aria-label="Idée"]')!;
    expect(idee.textContent).toMatch(/Carnet supprimé · Évier inox\s*Annuler/);
  });
});

describe('C6 · Suppression v2 (D-47b) et veille (R31)', () => {
  const base = { titre: 'Évier inox 2 bacs', onDetacher: vi.fn(), onArchiver: vi.fn(), onSupprimer: vi.fn(), onGarder: vi.fn() };
  const k = contenu({
    articles: [art({ id: 'a', nom: 'Évier 2 bacs sur pieds', veille: { active: true, depuis: '2026-11-16' } })],
    photos: [{ id: 'p', jpeg: 'data:image/jpeg;base64,AAAA' }],
    facons: [{ id: 'f1', nom: 'Sur pieds', etat: 'ouverte', origine: 'ia' }, { id: 'f2', nom: 'Encastré', etat: 'ouverte', origine: 'ia' }],
    notes: [{ id: 'n', texte: 'x', genre: 'note' }],
  });
  it('ce qui part, compté', () => {
    expect(cequiPart(k)).toBe('1 article, 1 photo, 2 façons et 1 note');
  });
  it('1 lien plan-a-venir : « 1 lien le retient », « Garder le plan sans ce carnet », Supprimer grisé ; puis 0 : allumé, G36', () => {
    const lien = { sorte: 'plan-a-venir' as const, planId: 'plan-1', libelle: 'Évier 2 bacs sur pieds', reglage: 'detacher' as const };
    const r = render(<SupprimerCarnet {...base} contenu={k} liens={[lien]} />);
    expect(r.container.textContent).toContain('1 lien le retient');
    expect(r.container.textContent).toContain("Il part avec 1 article, 1 photo, 2 façons et 1 note. La veille du prix, tous les 3 jours, s'arrête.");
    fireEvent.click(screen.getByRole('button', { name: 'Garder le plan sans ce carnet' }));
    expect(base.onDetacher).toHaveBeenCalledWith('plan-1');
    expect((screen.getByRole('button', { name: /Supprimer/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(r.container.textContent).not.toContain('ni dans À venir, ni en commande');
    expect(r.container.textContent).not.toMatch(/stock/i);
    r.rerender(<SupprimerCarnet {...base} contenu={k} liens={[]} />);
    const sup = screen.getByRole('button', { name: /Supprimer/ }) as HTMLButtonElement;
    expect(sup.disabled).toBe(false);
    const g36 = screen.getByText('ni dans À venir, ni en commande', { exact: false });
    expect(g36.querySelector('[data-picto="local"]')).toBeTruthy();
    expect(g36.textContent).not.toContain('✻');
    fireEvent.click(sup);
    expect(base.onSupprimer).toHaveBeenCalled();
    expect(r.container.textContent).not.toMatch(/stock/i);
    sansRefus(r.container);
  });
  it('1 lien plan-realise : « Archiver » seul, sans « Garder le plan… », Supprimer absent', () => {
    const lien = { sorte: 'plan-realise' as const, planId: 'plan-2', libelle: 'Frigo de garde', reglage: 'archiver' as const };
    const r = render(<SupprimerCarnet {...base} contenu={k} liens={[lien]} />);
    expect(screen.getByRole('button', { name: /Archiver/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Garder le plan sans ce carnet' })).toBeNull();
    const s = screen.queryByRole('button', { name: /Supprimer/ }) as HTMLButtonElement | null;
    expect(s === null || s.disabled).toBe(true);
    expect(r.container.textContent).not.toMatch(/stock/i);
  });
  it('G35 « n articles en veille : les déplacer dans <carnet> · Déplacer », picto local', () => {
    const onDeplacer = vi.fn();
    const r = render(<SupprimerCarnet {...base} contenu={k} liens={[]} proche={{ titre: 'Ventilation', onDeplacer }} />);
    const g35 = screen.getByText(/1 article en veille : les déplacer dans Ventilation/);
    expect(g35.querySelector('[data-picto="local"]')).toBeTruthy();
    expect(g35.textContent).not.toContain('✻');
    fireEvent.click(screen.getByRole('button', { name: 'Déplacer' }));
    expect(onDeplacer).toHaveBeenCalled();
    expect(r.container.textContent).not.toMatch(/stock/i);
  });
  it('veille, fiche : sans veille, bascule éteinte et aucune ligne d’état ; allumée, « demandée · pas encore relevée », aucune date ni baisse', () => {
    const a = art({ id: 'v', nom: 'Pompe de transfert inox', prixCentimes: 69000 });
    const onVeille = vi.fn();
    const r = render(<FicheArticle article={a} titreCarnet="Pompe" onRetour={rien} onVeille={onVeille} />);
    const sw = screen.getByRole('switch', { name: 'Veille du prix, tous les 3 jours' });
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(r.container.textContent).not.toContain('demandée');
    fireEvent.click(sw);
    expect(onVeille).toHaveBeenCalledWith(true);
    r.unmount();
    const r2 = render(<FicheArticle article={{ ...a, veille: { active: true, depuis: '2026-11-17' } }} titreCarnet="Pompe" onRetour={rien} onVeille={rien} />);
    const bloc = r2.container.querySelector('.cn-veille-bloc')!;
    expect(bloc.textContent).toContain('Veille du prix, tous les 3 jours');
    expect(bloc.textContent).toContain('demandée · pas encore relevée');
    expect(bloc.textContent).not.toMatch(/\d+ (janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)|relevée le|revu|baisse|CHF|\d{4}/);
    expect((bloc.textContent ?? '').replace('tous les 3 jours', '')).not.toMatch(/\d/);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
  });
  it('veille, carte : « veille demandée », jamais « veille » seul ni « active »', () => {
    const { container } = render(<CarteArticle article={art({ id: 'v', nom: 'Pompe', veille: { active: true, depuis: '2026-11-17' } })} />);
    expect(container.textContent).toContain('veille demandée');
    expect((container.textContent ?? '').replace(/veille demandée/g, '')).not.toMatch(/veille|active/i);
  });
});

describe('Photos, état de l’IA, valeurs', () => {
  it('Photos masquée vide ; vignette « photo non lue »', () => {
    const r = render(<Photos photos={[]} />);
    expect(r.container.textContent).toBe('');
    r.unmount();
    const r2 = render(<Photos photos={[{ id: 'p', jpeg: 'data:image/jpeg;base64,AAAA', le: '2026-11-17' }]} />);
    expect(r2.container.textContent).toContain('photo non lue');
  });
  it('photo.ts : 1 280 px au plus, proportions gardées, jamais agrandie ; poids d’une URL de données', () => {
    expect(dimensionsCible(4000, 3000)).toEqual({ largeur: 1280, hauteur: 960 });
    expect(dimensionsCible(800, 600)).toEqual({ largeur: 800, hauteur: 600 });
    expect(dimensionsCible(0, 10)).toEqual({ largeur: 0, hauteur: 0 });
    expect(poidsDataUrl('data:image/jpeg;base64,QUJD')).toBe(3);
    expect(poidsDataUrl('data:image/jpeg;base64,QUI=')).toBe(2);
  });
  it('valeurs inconnues : montant, valeur et date absents rendent null, jamais 0', () => {
    expect(montant(undefined)).toBeNull();
    expect(montant(NaN)).toBeNull();
    expect(montant(145000)).toBe('1 450');
    expect(montant(1990)).toBe('19.90');
    expect(valeurTexte(undefined)).toBeNull();
    expect(valeurTexte({ valeur: '', origine: 'ia' })).toBeNull();
    expect(valeurTexte({ valeur: true, origine: 'page' })).toBe('oui');
    expect(dateCourte(undefined)).toBeNull();
    expect(dateCourte('2026-11-16')).toBe('16 nov.');
  });
});

describe('Correction 1, lot L2 : lisibilité du carnet ouvert et du champ (P10 à P13)', () => {
  const avecCriteres = (criteres: CarnetV['carnet']['criteres']): CarnetV => ({ ...ventilation, carnet: { ...ventilation.carnet, criteres } });
  it('P11 : « Ce qui compte » et « tiré de votre phrase » une seule fois ; un critère en double, une ligne', () => {
    const { container } = ouvert({ carnet: avecCriteres([
      { id: 'k1', texte: 'plus de condensation au plafond', origine: 'vous' },
      { id: 'k2', texte: 'tient 80 °C', origine: 'exemple' },
      { id: 'k3', texte: 'le débit', origine: 'exemple' },
      { id: 'k4', texte: 'Plus de condensation au plafond', origine: 'locale' },
    ]) });
    const rub = within(screen.getByRole('region', { name: 'Ce qui compte' }));
    const t = rub.getByText(/Ce qui compte/).closest('section')!.textContent!;
    expect(t.match(/Ce qui compte/g)).toHaveLength(1);
    expect(t.match(/tiré de votre phrase/g)).toHaveLength(1);
    expect(t.match(/condensation au plafond/gi)).toHaveLength(1);
    expect(container.querySelectorAll('.cn-critere-court')).toHaveLength(3);
  });
  it('P11 : provenances mêlées, la tête dit la plus fréquente, la ligne d’une autre provenance le dit en court', () => {
    ouvert({ carnet: avecCriteres([
      { id: 'k1', texte: 'capter la buée à la source', origine: 'ia' },
      { id: 'k2', texte: 'le débit', origine: 'ia' },
      { id: 'k3', texte: 'tient 80 °C', origine: 'vous' },
    ]) });
    const t = screen.getByRole('region', { name: 'Ce qui compte' }).textContent!;
    expect(t).toContain("Ce qui compte, proposé par l'IA :");
    expect(t.match(/proposé par l'IA/g)).toHaveLength(1);
    expect(t).toContain('tient 80 °C · tiré de votre phrase');
  });
  it('P11 : la ligne rangée d’un critère en double s’encadre sur la ligne gardée', () => {
    ouvert({ carnet: avecCriteres([
      { id: 'k1', texte: 'plus de condensation au plafond', origine: 'vous' },
      { id: 'k4', texte: 'Plus de condensation au plafond', origine: 'vous' },
      { id: 'k2', texte: 'tient 80 °C', origine: 'vous' },
    ]), rangee: { cible: 'critere', id: 'k4', phrase: 'Plus de condensation au plafond', onAnnuler: rien } });
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeTruthy();
  });
  it('P10 : l’en-tête Articles garde le compte entier et met « Comparer côte à côte » à part, poussé à droite', () => {
    const { container } = ouvert();
    const tete = container.querySelector('.cn-tete-articles')!;
    expect(tete.querySelector('.cn-compte')!.textContent).toBe('3 lus, 1 sans aperçu');
    expect(tete.querySelector('.cn-compte')!.classList.contains('cn-sp')).toBe(false);
    expect(tete.querySelector('.cn-comparer-lien')!.textContent).toContain('Comparer côte à côte');
  });
});

describe('Correction 1, lot L2 : le champ dans le vrai conteneur (fixture, magasin mémoire, IA simulée)', () => {
  const monter = () => {
    const magasin = magasinMemoire(fixtureCarnets());
    render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode="simule" appels={appelsSimules('normal', 0)}
      aides={aidesCarnet('simule', {})} ouvrir={{ id: ID_VENTILATION, at: 1 }} ecrirePlan={rien} />);
    const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
    return { magasin, champ };
  };
  it('P13 : sur Ventilation, au focus du champ vide, la bulle G8 paraît, picto local, sans ✻', () => {
    const { champ } = monter();
    expect(screen.queryByRole('button', { name: /peut trancher/ })).toBeNull();
    fireEvent.focus(champ());
    const bulle = screen.getByRole('button', { name: /peut trancher entre/ });
    expect(bulle.textContent).toContain('Le critère « plus de condensation au plafond » peut trancher entre Hotte inox + extracteur et Extracteur mural seul');
    expect(bulle.querySelector('[data-picto="local"]')).toBeTruthy();
    expect(bulle.textContent).not.toContain('✻');
  });
  it('P12 : après un envoi accepté, le champ se vide et l’envoi disparaît', async () => {
    const { champ } = monter();
    fireEvent.change(champ(), { target: { value: 'demander un devis au ferblantier' } });
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeTruthy();
    await act(async () => { fireEvent.submit(champ().closest('form')!); });
    await act(async () => { await new Promise(r => setTimeout(r, 20)); });
    expect(champ().value).toBe('');
    expect(screen.queryByRole('button', { name: 'Ajouter' })).toBeNull();
  });
});
