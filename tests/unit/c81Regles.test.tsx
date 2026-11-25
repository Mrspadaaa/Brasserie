// @vitest-environment jsdom
/**
 * Voie c81-tests (25.11) : les tests ROUGES des règles R116 à R121 (CARNET-COHERENT, sa plainte « Mais il se passe quoi avec ce carnet ???? »),
 * écrits AVANT tout correctif (celui qui corrige n'écrit pas le test, L17). Chaque test reproduit ce que montre SA capture (plaintes/2026-11-25-*.jpg).
 * Données : les VRAIS documents (tests/fixtures/c79/*.json : ses 12 carnets ZZ ; tests/fixtures/c75/houblons-citra.json), chargés tels quels dans le magasin et montés
 * par CarnetsVue. Aucun réseau, aucun Gemini (AiClient lève s'il est appelé).
 *
 *  - R116 : une option retenue implique l'état Décidé ; jamais « Noté » / « Je cherche » avec une option « retenu » ; ou une proposition d'un toucher, rien d'écrit seul.
 *           Le document relevé du CO2 dit déjà « decide » (relevé avant son geste du soir) : la capture montre « Noté » avec « retenu » ; le test rejoue donc aussi la donnée
 *           telle que la capture la montre : même document, SEUL l'état écrit remis à « note » ou « cherche » (SIMULÉ, dit au test). Pour tous les carnets « problème » de la fixture.
 *  - R117 : le titre n'est jamais redit en bulle (1re bulle = titre, avec ou sans « ZZ TEST — »), pour les 12 carnets.
 *  - R118 : rang « ? » du tableau d'articles : la ligne dit pourquoi (« prix à relire »), pas un « ? » seul.
 *  - R119 : aucun chiffre du Carnet en chasse fixe (police monospace). jsdom ne charge pas les CSS : le test injecte celles de src/ui/carnets/*.css et lit le style CALCULÉ
 *           (jsdom ne remonte pas l'héritage : le test le fait). La mesure en pixels (espacement réel) reste au contrôle Chrome de c80.
 *  - R120 : Comparer de Citra (document lu avant les correctifs) : « à relire » dit UNE fois pour la colonne, jamais un « ? » par case ni une case hachurée ; « fruits tropicaux »
 *           sans césure et sans « · variété » ; la note « ≈ rendu chez toi » et les noms des articles lisibles (la mise en page en pixels : Chrome, c80).
 *  - R121 : le fil non classé du CO2 : à l'ouverture, une carte propose de le ranger (analyse locale) ; rien n'est écrit avant son toucher ; après : chaque bulle étiquetée,
 *           les 3 options, le raccord gaz désigné cause, la tâche « revérifier » datée à une semaine de la phrase.
 *           POURQUOI R95 (c74b) ÉTAIT VERT : son fil de test est « brut, sans genre ni option » ; le vrai CO2 a déjà un genre, un suivi et UNE option (la phrase des pistes
 *           prise tout entière), donc `propositionFilAncien` rend `null` (`if (d.genre || d.suivi || d.facons.length …) return null`) : la vraie pièce ne passe jamais par R95 (L28).
 */
import React from 'react';
import { readFileSync, readdirSync } from 'node:fs';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aidesCarnet } from '../../src/config/carnetIA';
import { lireCarnets, lireMessages, type CarnetDoc } from '../../src/domain/carnets/modele';
import { etatDe, genreDe } from '../../src/domain/carnets/suivi';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import type { AppelsIA } from '../../src/ui/carnets/rangement';
import { poserQuantitePour } from '../../src/ui/carnets/tableauRegles';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: true, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));
beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; localStorage.clear(); sessionStorage.clear(); });
afterEach(() => { cleanup(); document.querySelectorAll('style[data-c81]').forEach(s => s.remove()); });

/* ------------------------------------------------------------------------------------------------ outils */

type Item = Parameters<typeof magasinMemoire>[0][number];
const MAINT = () => new Date('2026-11-25T12:00:00.000Z');
const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const lu = (e: Element | null | undefined): string => (e?.textContent ?? '').replace(/[\s  ]+/g, ' ').trim();
const sans = (s: string) => s.normalize('NFKC').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘ʼ]/g, "'").replace(/[\s  ]+/g, ' ').trim().toLowerCase();
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const horsLigne: AppelsIA = { async ranger() { return { ok: false, error: 'aucune IA ici' }; }, async lire() { throw new Error('aucun lien ici'); } };

interface Doc { id: string; title: string; type: string; carnet: Record<string, any> }
interface Releve { carnet: Doc; messages: Array<{ id: string; carnetMessage: Record<string, any> } & Item> }
const NOMS = [
  'zz-assurance-a-renouveler', 'zz-co2-qui-baisse-vite', 'zz-ecoulement-qui-fuit', 'zz-fete-de-la-biere', 'zz-frigo-de-garde-en', 'zz-inspection-electrique-fusible',
  'zz-levure-lente-a-demarrer', 'zz-malt-pilsner-en-rupture', 'zz-odeur-de-soufre-dans', 'zz-pompe-qui-chauffe', 'zz-ranger-la-cave', 'zz-trop-de-vapeur-au'
] as const;
/** Le document réel, tel qu'il est dans le fichier (aucune retouche). */
const releve = (nom: string): Releve => JSON.parse(readFileSync(`tests/fixtures/c79/${nom}.json`, 'utf8')) as Releve;
const citra = (): Releve => JSON.parse(readFileSync('tests/fixtures/c75/houblons-citra.json', 'utf8')) as Releve;

function monter(d: Releve) {
  poserQuantitePour(d.carnet.title, 1);
  const magasin = magasinMemoire([d.carnet, ...d.messages] as never[]);
  const r = render(
    <CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] } as never} mode={'simule' as never} appels={horsLigne} aides={aidesCarnet('simule' as never, {})}
      maintenant={MAINT} ecrirePlan={(() => {}) as never} ouvrir={{ id: d.carnet.id, at: 1 }} />
  );
  return { magasin, id: d.carnet.id, ...r };
}
type M = ReturnType<typeof monter>;
const carnetDe = (m: M): CarnetDoc => lireCarnets(m.magasin.lire() as never, { archives: true }).find(c => c.id === m.id)!;
const bouton = (re: RegExp, racine: ParentNode = document): HTMLButtonElement | undefined =>
  [...racine.querySelectorAll('button')].find(b => re.test(sans(`${b.getAttribute('aria-label') ?? ''} ${b.textContent ?? ''}`))) as HTMLButtonElement | undefined;
/** Les CSS du Carnet, injectées : jsdom n'applique aucune feuille de style de l'app. Le style calculé qu'on lit ensuite est celui que les règles du dépôt donnent. */
function poserCss() {
  const s = document.createElement('style');
  s.setAttribute('data-c81', '1');
  s.textContent = readdirSync('src/ui/carnets').filter(f => f.endsWith('.css')).map(f => readFileSync(`src/ui/carnets/${f}`, 'utf8')).join('\n');
  document.head.appendChild(s);
}
/** La police qui s'applique à un élément : sa déclaration, sinon celle du plus proche ancêtre qui en a une (jsdom ne remonte pas l'héritage). */
function police(el: Element): string {
  for (let e: Element | null = el; e; e = e.parentElement) { const f = getComputedStyle(e).fontFamily; if (f) return f; }
  return '';
}
/** Tout nombre du Carnet rendu dans une police à chasse fixe (monospace, ou la variable --c-mono qui la porte) : « ≈73,8 », « 13,6 », « 16:45 ». */
function chiffresEnChasseFixe(racine: ParentNode = document.body): string[] {
  const out: string[] = [];
  for (const el of [...racine.querySelectorAll('*')]) {
    if (['STYLE', 'SCRIPT', 'TEXTAREA'].includes(el.tagName)) continue;
    const propre = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent ?? '').join(' ').trim();
    if (!/\d/.test(propre)) continue;
    if (/mono/i.test(police(el))) out.push(`<${el.tagName.toLowerCase()} class="${el.getAttribute('class') ?? ''}"> « ${propre} » (police ${police(el)})`);
  }
  return out;
}

/* ======================================================================================================== R116 : une option retenue implique l'état Décidé */

const PROBLEMES = NOMS.filter(n => genreDe(releve(n).carnet as unknown as CarnetDoc) === 'probleme');
/** SIMULÉ (dit au test) : le même document réel, seul l'état écrit remis à `etat`, et une option « retenue » ajoutée quand le carnet n'en a aucune (c'est l'état de la capture :
 *  « Noté » à côté de « retenu »). Rien d'autre n'est touché. */
function avecRetenueEtEtat(d: Releve, etat: 'note' | 'cherche'): Releve {
  const o = clone(d);
  const k = o.carnet.carnet;
  if (!k.facons.some((f: { etat: string }) => f.etat === 'retenue')) {
    k.facons.push({ id: 'FACON-c81-sim', nom: 'Option simulée', etat: 'retenue', origine: 'vous', suivi: { etat: 'retenue', historique: [{ etat: 'retenue', le: '2026-11-25T12:00:00.000Z', origine: 'vous' }] } });
  }
  k.suivi = { etat, evenements: [] };
  delete k.archive;
  return o;
}
const etatAffiche = (): string | undefined => document.querySelector('.cnp-etat [aria-pressed="true"], .cnp-etat [aria-current="true"]')?.getAttribute('data-k') ?? undefined;
/** Un bouton qui propose de passer à Décidé, HORS de la barre d'état (la barre offre toujours ses quatre mots : ce n'est pas une proposition). */
const propositionDecide = (): HTMLButtonElement | undefined =>
  [...document.querySelectorAll('button')].find(b => !b.closest('.cnp-etat') && /decid/.test(sans(`${b.getAttribute('aria-label') ?? ''} ${b.textContent ?? ''}`)));

describe.each(PROBLEMES.map(n => [n]))('R116 · %s : une option retenue ne laisse jamais « Noté » ou « Je cherche »', nom => {
  it('le document tel qu\'il a été relevé : avec une option retenue, l\'écran dit Décidé (ou Résolu)', async () => {
    const d = releve(nom);
    const retenue = d.carnet.carnet.facons.some((f: { etat: string }) => f.etat === 'retenue');
    monter(d);
    await attendre(120);
    if (!retenue) return; // aucune option retenue dans ce document : la règle ne dit rien ici (les deux tests suivants la lui donnent)
    expect(['decide', 'resolu'], `option retenue mais l'écran dit « ${etatAffiche()} » : « ${lu(document.querySelector('.cnp-etat'))} »`).toContain(etatAffiche());
  });
  for (const etat of ['note', 'cherche'] as const) {
    it(`SIMULÉ : même document, état écrit « ${etat} » + option retenue (la capture) : l'écran dit Décidé, ou propose « Décidé » d'un toucher, sans rien écrire seul`, async () => {
      const m = monter(avecRetenueEtEtat(releve(nom), etat));
      await attendre(150);
      expect(etatDe(carnetDe(m)), 'rien n\'est écrit à l\'ouverture : l\'état écrit reste celui du document').toBe(etat);
      const dit = etatAffiche();
      if (dit === 'decide' || dit === 'resolu') return;
      const proposition = propositionDecide();
      expect(proposition, `l'écran dit « ${dit} » à côté d'une option « retenu » : aucune proposition de passer à Décidé (barre : « ${lu(document.querySelector('.cnp-etat'))} »)`).toBeTruthy();
      fireEvent.click(proposition!);
      await attendre(120);
      expect(etatDe(carnetDe(m)), 'un toucher sur la proposition écrit Décidé').toBe('decide');
    });
  }
});

/* ======================================================================================================== R117 : le titre n'est jamais redit en bulle */

const sansZZ = (t: string) => sans(t.replace(/^\s*ZZ TEST\s*[—–-]\s*/i, ''));
/** Les textes du carnet ouvert (hors son titre) qui redisent son titre : une bulle du fil, une note, une ligne. */
function titreRedit(titre: string): string[] {
  const cible = sansZZ(titre);
  return [...document.querySelectorAll('.cn-defile p, .cn-defile li, .cn-defile span, .cn-defile blockquote')]
    .filter(e => !e.closest('h2, h1, .cn-titre, .cn-tete, [aria-hidden="true"]') && sansZZ(lu(e)) === cible && lu(e).length > 0)
    .map(e => `<${e.tagName.toLowerCase()} class="${e.getAttribute('class') ?? ''}"> « ${lu(e)} »`);
}
describe.each(NOMS.map(n => [n]))('R117 · %s : le titre du carnet n\'est pas redit en bulle', nom => {
  it('aucune bulle ni ligne ne reprend le titre (ni avec « ZZ TEST — », ni sans)', async () => {
    const d = releve(nom);
    monter(d);
    await attendre(150);
    const redit = titreRedit(d.carnet.title);
    expect(redit, `le titre « ${d.carnet.title} » est redit : ${redit.join(' ; ')}`).toEqual([]);
  });
});

/* ======================================================================================================== R118 : le rang « ? » dit pourquoi */

describe('R118 · Houblons citra : le rang « ? » d\'un article dit pourquoi', () => {
  it('la ligne de l\'article sans rang dit « prix à relire », pas un « ? » seul', async () => {
    monter(citra());
    await attendre(150);
    const sansRang = [...document.querySelectorAll('.cn-tab-ligne')].filter(l => l.querySelector('.cn-rang-vide'));
    expect(sansRang.length, `une ligne sans rang dans le tableau : « ${lu(document.querySelector('.cn-tab'))} »`).toBeGreaterThan(0);
    for (const l of sansRang) {
      const rang = lu(l.querySelector('.cn-rang-vide'));
      expect(rang, `le rang de « ${lu(l)} » est « ${rang} » seul`).not.toBe('?');
      expect(sans(lu(l)), `la ligne « ${lu(l)} » ne dit pas pourquoi (prix à relire)`).toMatch(/prix a relire/);
    }
  });
});

/* ======================================================================================================== R119 : aucun chiffre en chasse fixe */

describe('R119 · aucun chiffre du Carnet en chasse fixe (police monospace)', () => {
  it('Houblons citra, le carnet : α « 10–15 », « 13,6 », CHF/kg « ≈73,8 », comptes', async () => {
    poserCss();
    monter(citra());
    await attendre(150);
    const mono = chiffresEnChasseFixe();
    expect(mono, `chiffres en chasse fixe : ${mono.join(' | ')}`).toEqual([]);
  });
  it('Houblons citra, Comparer : « ≈73,8 », « ≈3,69 », « 13,6 % »', async () => {
    poserCss();
    monter(citra());
    await attendre(150);
    fireEvent.click(bouton(/^comparer$/)!);
    await attendre(100);
    const mono = chiffresEnChasseFixe();
    expect(mono, `chiffres en chasse fixe : ${mono.join(' | ')}`).toEqual([]);
  });
  it('Houblons citra, la fiche d\'un article', async () => {
    poserCss();
    monter(citra());
    await attendre(150);
    const l = [...document.querySelectorAll('button.cn-tab-ligne')].find(x => /motler/.test(sans(lu(x)))) as HTMLElement;
    fireEvent.click(l);
    await attendre(80);
    const mono = chiffresEnChasseFixe();
    expect(mono, `chiffres en chasse fixe : ${mono.join(' | ')}`).toEqual([]);
  });
  describe.each(NOMS.map(n => [n]))('%s', nom => {
    it('le fil et la page du carnet (heures, comptes, dates)', async () => {
      poserCss();
      monter(releve(nom));
      await attendre(150);
      const mono = chiffresEnChasseFixe();
      expect(mono, `chiffres en chasse fixe : ${mono.join(' | ')}`).toEqual([]);
    });
  });
});

/* ======================================================================================================== R120 : Comparer de Citra */

async function comparerCitra() {
  poserCss();
  monter(citra());
  await attendre(150);
  fireEvent.click(bouton(/^comparer$/)!);
  await attendre(100);
  const entetes = [...document.querySelectorAll('.cn-tableau-comparer thead th')];
  const col = entetes.findIndex(th => /citra 13/.test(sans(th.querySelector('.cn-col-tete')?.getAttribute('title') ?? lu(th))));
  expect(col, `la colonne « Citra 13.6% » de Comparer : « ${entetes.map(lu).join(' | ')} »`).toBeGreaterThan(0);
  const cellules = [...document.querySelectorAll('.cn-tableau-comparer tbody tr')].map(tr => ({ ligne: lu(tr.querySelector('th')), cellule: tr.children[col] as HTMLElement }));
  return { colonne: entetes[col], cellules };
}
describe('R120 · Comparer de Citra (document lu avant les correctifs) : « à relire » une fois pour la colonne', () => {
  it('aucune case « ? » dans la colonne de l\'article à relire', async () => {
    const { cellules } = await comparerCitra();
    const inconnues = cellules.filter(c => c.cellule.querySelector('.cn-inconnu, .cn-hach') || lu(c.cellule) === '?');
    expect(inconnues.map(c => `${c.ligne} : « ${lu(c.cellule)} »`), 'cases « ? » dans la colonne Citra 13.6 % (un par ligne au lieu d\'un « à relire » pour la colonne)').toEqual([]);
  });
  it('aucune case hachurée', async () => {
    await comparerCitra();
    expect(document.querySelectorAll('.cn-hach').length, 'cases hachurées « ? »').toBe(0);
  });
  it('« à relire » est dit une fois, dans l\'en-tête de la colonne', async () => {
    const { colonne, cellules } = await comparerCitra();
    expect(sans(lu(colonne)), `l'en-tête de la colonne dit : « ${lu(colonne)} »`).toMatch(/a relire/);
    const dans = cellules.filter(c => /a relire/.test(sans(lu(c.cellule)))).length;
    expect(dans, 'et les cases de la colonne ne le redisent pas').toBe(0);
  });
  it('« fruits tropicaux » : ni « · variété » obscur, ni césure (hyphens), ni coupure du mot', async () => {
    await comparerCitra();
    const aromes = [...document.querySelectorAll('.cn-tableau-comparer tbody tr')].find(tr => /aromes/.test(sans(lu(tr.querySelector('th')))))!;
    expect(sans(lu(aromes)), `la ligne Arômes dit : « ${lu(aromes)} »`).not.toMatch(/·\s*variete/);
    for (const v of [...aromes.querySelectorAll('.cn-valeur-texte')]) {
      expect(getComputedStyle(v).getPropertyValue('hyphens') || 'manual', `césure automatique sur « ${lu(v)} » (« tro-picaux » de la capture)`).not.toBe('auto');
    }
    expect(lu(aromes)).not.toMatch(/­/);
  });
  it('les noms des articles en tête de colonne ne sont ni tronqués (line-clamp) ni coupés par la césure', async () => {
    await comparerCitra();
    for (const nom of [...document.querySelectorAll('.cn-cmp-nom')]) {
      const s = getComputedStyle(nom);
      const clamp = s.getPropertyValue('-webkit-line-clamp');
      expect(clamp && clamp !== 'none' && clamp !== 'unset' ? clamp : 'aucun', `« ${lu(nom)} » est tronqué par -webkit-line-clamp`).toBe('aucun');
    }
    for (const t of [...document.querySelectorAll('.cn-tableau-comparer .cn-col-tete')]) {
      expect(getComputedStyle(t).getPropertyValue('hyphens') || 'manual', `césure automatique dans le nom « ${lu(t)} »`).not.toBe('auto');
    }
  });
  it('la note « ≈ rendu chez toi » est dans la zone qui défile, après le tableau (sa visibilité au-dessus du champ : Chrome, c80)', async () => {
    await comparerCitra();
    const note = document.querySelector('.cn-annonce-eur') as HTMLElement | null;
    expect(note, 'la note « ≈ rendu chez toi » est à l\'écran').toBeTruthy();
    expect(note!.closest('.cn-defile'), 'la note est dans la zone qui défile (pas sous le champ)').toBeTruthy();
    expect(sans(lu(note)), 'elle dit ce qu\'elle estime').toMatch(/rendu chez toi/);
  });
});

/* ======================================================================================================== R121 : le fil non classé du CO2 */

const ID_CO2 = 'CARNET-c79-04';
const MSG = { constat: 'MSG-c79-19', pistes: 'MSG-c79-23', essai: 'MSG-c79-21', fait: 'MSG-c79-22' } as const;
/** Les étiquettes (jetons) d'une bulle du fil, lues à l'écran. */
const jetonsDe = (idMessage: string): string => sans([...document.querySelectorAll(`[data-message="${idMessage}"] .cnp-jeton, [data-message="${idMessage}"] [data-j]`)].map(lu).join(' | '));
const carteRanger = (): HTMLElement | null => (document.querySelector('[data-fil-ancien], section[aria-label*="anger"]') as HTMLElement | null)
  ?? ([...document.querySelectorAll('section, div, aside')].find(e => /ranger (ce|le) fil/.test(sans(`${e.getAttribute('aria-label') ?? ''} ${ownTexte(e)}`)) && !!bouton(/^ranger/, e)) as HTMLElement | undefined) ?? null;
function ownTexte(e: Element) { return [...e.childNodes].filter(n => n.nodeType === 3 || (n as Element).tagName === 'P').map(n => n.textContent ?? '').join(' '); }

describe('R121 · le fil du CO2, sans étiquette, se range d\'un toucher (document réel)', () => {
  it('à l\'ouverture, une carte propose de ranger le fil (analyse locale) ; rien n\'est écrit', async () => {
    const m = monter(releve('zz-co2-qui-baisse-vite'));
    const avant = JSON.stringify(m.magasin.lire());
    await attendre(200);
    expect(JSON.stringify(m.magasin.lire()), 'rien n\'est écrit à l\'ouverture').toBe(avant);
    const c = carteRanger();
    expect(c, `aucune carte « Ranger ce fil ? » à l'écran : « ${lu(document.querySelector('.cn-defile')).slice(0, 300)} »`).toBeTruthy();
    expect(bouton(/^ranger/, c!), 'un bouton « Ranger » dans la carte').toBeTruthy();
  });
  it('après « Ranger » : chaque bulle porte son étiquette (constat, pistes, essai, fait, tâche)', async () => {
    monter(releve('zz-co2-qui-baisse-vite'));
    await attendre(200);
    const c = carteRanger();
    expect(c, 'la carte « Ranger ce fil ? »').toBeTruthy();
    fireEvent.click(bouton(/^ranger/, c!)!);
    await attendre(250);
    expect(jetonsDe(MSG.constat), `bulle « Fût de blonde à 1,2 bar… » : jetons « ${jetonsDe(MSG.constat)} »`).toMatch(/constat/);
    expect(jetonsDe(MSG.pistes), `bulle « Pistes : … » : jetons « ${jetonsDe(MSG.pistes)} »`).toMatch(/piste/);
    expect(jetonsDe(MSG.essai), `bulle « Test à l'eau savonneuse… » : jetons « ${jetonsDe(MSG.essai)} »`).toMatch(/essai|cause/);
    expect(jetonsDe(MSG.fait), `bulle « Raccord gaz changé… » : jetons « ${jetonsDe(MSG.fait)} »`).toMatch(/fait/);
    expect(jetonsDe(MSG.fait), `bulle « Raccord gaz changé… » : jetons « ${jetonsDe(MSG.fait)} »`).toMatch(/tache|a faire|reverifier/);
  }, 20000);
  it('après « Ranger » : trois options (joint, raccord gaz, régulateur) ; le raccord gaz est désigné cause ; le joint n\'est plus « retenu »', async () => {
    const m = monter(releve('zz-co2-qui-baisse-vite'));
    await attendre(200);
    const c = carteRanger();
    expect(c, 'la carte « Ranger ce fil ? »').toBeTruthy();
    fireEvent.click(bouton(/^ranger/, c!)!);
    await attendre(250);
    const doc = carnetDe(m);
    const noms = doc.carnet.facons.map(f => sans(f.nom));
    expect(noms, `options : « ${doc.carnet.facons.map(f => f.nom).join(' | ')} »`).toHaveLength(3);
    expect(noms.some(n => /joint/.test(n)) && noms.some(n => /raccord gaz/.test(n)) && noms.some(n => /regulateur/.test(n)), `joint, raccord gaz et régulateur : « ${noms.join(' | ')} »`).toBe(true);
    const raccord = doc.carnet.facons.find(f => /raccord gaz/.test(sans(f.nom)))!;
    const joint = doc.carnet.facons.find(f => /joint/.test(sans(f.nom)))!;
    expect(joint.etat, 'le joint, désigné à tort, n\'est plus retenu').not.toBe('retenue');
    const causes = lireMessages(m.magasin.lire() as never).flatMap(x => x.carnetMessage.etiquettes ?? []).filter(e => e.sorte === 'cause');
    expect(raccord.etat === 'retenue' || causes.some(e => e.optionId === raccord.id), 'le raccord gaz est désigné cause (étiquette « cause » sur lui, ou retenu)').toBe(true);
  }, 20000);
  it('après « Ranger » : la tâche « revérifier » est datée une semaine après la phrase (24.11), en À faire', async () => {
    const m = monter(releve('zz-co2-qui-baisse-vite'));
    await attendre(200);
    const c = carteRanger();
    expect(c, 'la carte « Ranger ce fil ? »').toBeTruthy();
    fireEvent.click(bouton(/^ranger/, c!)!);
    await attendre(250);
    const taches = carnetDe(m).carnet.taches ?? [];
    const t = taches.find(x => /reverifier/.test(sans(x.texte)));
    expect(t, `tâches : « ${taches.map(x => x.texte).join(' | ')} »`).toBeTruthy();
    expect(t!.echeance ?? '', `échéance de « ${t!.texte} »`).toMatch(/^2026-12-0[12]/);
  }, 20000);
});
