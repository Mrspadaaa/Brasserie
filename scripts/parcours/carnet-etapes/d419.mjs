// D419 / D421 (22.11) : le port du Carnet. Un contrôle par id : D419-A1 (Comparer, maquette A1), D419-B1 (prix de la liste des articles,
// B1 : rien d'inventé), D419-PLACER (Choisir crée l'achat prévu, puis « Placer » ouvre le Calendrier). Rouge sur `--ref en-ligne/2026-11-22-tour9`.
import { TITRE_CHAMBRE, ouvrirChambre, ouvrirComparer } from './_chambre.mjs';
import { PRIX_EUR } from '../fixtures/carnet.mjs';

const TITRE_VENT = 'ZZ TEST — Ventilation';
const ouvrirCarnet = async (c, titre) => { await c.demarrer(); await c.versAtelier(); await c.attendreListe(); await c.ouvrirCarnetDeListe(titre); };

const lireComparerA1 = (c) => c.p.evaluate(() => {
  const n = (x) => String(x ?? '').replace(/\s+/g, ' ').trim();
  const page = document.querySelector('.cn-comparer');
  const ligne1 = [...document.querySelectorAll('.cn-comparer tbody tr')][0];
  const cellulesPrix = ligne1 ? [...ligne1.querySelectorAll('td')].map((td) => ({ texte: n(td.innerText), pointille: [...td.querySelectorAll('*')].some((e) => getComputedStyle(e).borderTopStyle === 'dashed') })) : [];
  return {
    fil: n(page?.querySelector('.cn-retour')?.innerText), titre: n(page?.querySelector('h2')?.innerText), texte: n(page?.innerText),
    libellePrix: n(ligne1?.querySelector('th')?.innerText), cellulesPrix,
    epingle: !!page?.querySelector('tbody tr.cn-ligne-epinglee')
  };
});

export default async function (c) {
  await c.etape('D419-A1 Comparer : fil, titre, chaîne « Classé par », prix en case hachurée, ligne épinglée', async () => {
    await ouvrirChambre(c); await ouvrirComparer(c); await c.sleep(500); await c.cap('d419-a1-chambre');
    const m = await lireComparerA1(c);
    const echecs = [];
    if (!m.fil.includes(TITRE_CHAMBRE)) echecs.push(`le fil dit « ${m.fil} », attendu « ‹ ${TITRE_CHAMBRE} »`);
    if (m.titre !== 'Comparer') echecs.push(`le titre est « ${m.titre} », attendu « Comparer »`);
    if (!/Classé par/.test(m.texte)) echecs.push('aucune chaîne « Classé par »');
    if (!m.cellulesPrix.length || !m.cellulesPrix.every((x) => x.texte === '?' && x.pointille)) echecs.push(`prix inconnu : attendu une case hachurée « ? » : ${JSON.stringify(m.cellulesPrix)}`);
    if (!m.epingle) echecs.push('aucune ligne épinglée (tr.cn-ligne-epinglee)');
    if (echecs.length) throw new Error(echecs.join(' || '));
    c.ok('D419-A1 chambre', `fil « ${m.fil} », titre « ${m.titre} », ${m.cellulesPrix.length} cases « ? » hachurées`);
    // le prix en euros, « dès », inconnu : sur « Prix en euros » (sans taux posé : l'euro est dit en euros, le taux « ? »)
    await ouvrirCarnet(c, PRIX_EUR.titre); await ouvrirComparer(c); await c.sleep(500); await c.cap('d419-a1-prix');
    const e = await lireComparerA1(c);
    const t = e.cellulesPrix.map((x) => x.texte);
    const fautes = [];
    if (!/2\s?513\s?€/.test(t[0] ?? '')) fautes.push(`1re cellule « ${t[0]} » : attendu 2 513 €`);
    if (!/dès/.test(t[1] ?? '') || !/3\s?350/.test(t[1] ?? '')) fautes.push(`2e cellule « ${t[1]} » : attendu « dès 3 350 »`);
    if ((t[2] ?? '') !== '?') fautes.push(`3e cellule « ${t[2]} » : attendu « ? »`);
    if (/\b60\b/.test(e.texte) || /0,94/.test(e.texte)) fautes.push('un chiffre inventé (60 ou 0,94) sans taux posé');
    if (fautes.length) throw new Error(fautes.join(' || '));
    c.ok('D419-A1 prix', `${t.join(' | ')}`);
  });

  await c.etape('D419-B1 liste des articles : pastille de prix, rendu estimé sans chiffre inventé', async () => {
    await ouvrirCarnet(c, PRIX_EUR.titre); await c.toucher('Articles'); await c.sleep(600); await c.cap('d419-b1-liste');
    const lire = () => c.p.evaluate(() => {
      const n = (x) => String(x ?? '').replace(/\s+/g, ' ').trim();
      return { pastilles: [...document.querySelectorAll('.cn-pastille-prix')].map((e) => ({ texte: n(e.innerText), pointille: getComputedStyle(e).borderTopStyle === 'dashed', eur: e.hasAttribute('data-eur') })) };
    });
    let m = await lire(); const fautes = [];
    const t = m.pastilles.map((x) => x.texte);
    if (m.pastilles.length !== 3) fautes.push(`${m.pastilles.length} pastille(s) de prix, attendu 3 : ${JSON.stringify(t)}`);
    const eur = m.pastilles.find((x) => x.eur); const des = m.pastilles.find((x) => /dès/.test(x.texte)); const inc = m.pastilles.find((x) => /\?/.test(x.texte) && !x.eur);
    if (!eur || !/2\s?513\s?€/.test(eur.texte) || !/taux\s*\?/.test(eur.texte)) fautes.push(`pastille euro sans taux : attendu « 2 513 € » et « taux ? », lu « ${eur?.texte} »`);
    if (!des || !/3\s?350/.test(des.texte)) fautes.push(`pastille « dès 3 350 » absente : ${JSON.stringify(t)}`);
    if (!inc || !inc.pointille || !/CHF\s*\?/.test(inc.texte)) fautes.push(`pastille inconnue pointillée « CHF ? » absente : ${JSON.stringify(m.pastilles)}`);
    if (fautes.length) throw new Error(fautes.join(' || '));
    // poser le taux une fois : le rendu se calcule, port et frais restent « ? » (jamais 60), la TVA est de 8,1 %
    await c.toucherSel('.cn-pastille-prix[data-eur]'); await c.sleep(400);
    await c.toucherSel('input[aria-label="Taux EUR vers CHF"]'); await c.taper('0,94'); await c.toucher('Poser le taux'); await c.sleep(500);
    await c.cap('d419-b1-rendu');
    m = await lire();
    const eur2 = m.pastilles.find((x) => x.eur);
    const detail = await c.p.evaluate(() => String(document.querySelector('.cn-rendu')?.innerText ?? '').replace(/\s+/g, ' ').trim());
    const f2 = [];
    if (!eur2 || !/≈\s?2\s?55\d/.test(eur2.texte)) f2.push(`rendu attendu ≈ 2 55x (2 513 € à 0,94, TVA 8,1 %), lu « ${eur2?.texte} »`);
    if (!/port\s*\?/.test(detail) || !/frais\s*\?/.test(detail)) f2.push(`port et frais devraient dire « ? » : « ${detail} »`);
    if (!/TVA/.test(detail) || !/8,1\s?%/.test(detail) || /\b60\b/.test(detail)) f2.push(`TVA 8,1 % attendue, aucun 60 : « ${detail} »`);
    if (!/estimé/.test(`${eur2?.texte} ${detail}`)) f2.push('le mot « estimé » manque');
    if (f2.length) throw new Error(f2.join(' || '));
    c.ok('D419-B1', `pastille « ${eur2.texte} », détail « ${detail.slice(0, 120)} »`);
  });

  await c.etape('D419-PLACER Choisir crée l\'achat prévu puis propose « Placer » (Calendrier)', async () => {
    await ouvrirCarnet(c, TITRE_VENT); await ouvrirComparer(c); await c.sleep(400);
    await c.toucher('Choisir', { exact: true }); await c.sleep(600);
    await c.toucher('Choisir chez'); await c.sleep(1500); await c.cap('d419-placer-choisi');
    const t = await c.texte();
    const fautes = [];
    if (!/Dans À venir/.test(t)) fautes.push('Choisir ne crée pas l\'achat prévu : aucun « Dans À venir » sans geste de plus');
    if (/Envoyer dans À venir/.test(t)) fautes.push('« Envoyer dans À venir » reste proposé alors que l\'achat prévu existe');
    if (!(await c.present('Placer', { exact: true }))) fautes.push('aucun bouton « Placer »');
    if (fautes.length) throw new Error(fautes.join(' || '));
    await c.toucher('Placer', { exact: true }); await c.sleep(1500); await c.cap('d419-placer-calendrier');
    const apres = await c.p.evaluate(() => ({ choisi: !!document.querySelector('.cn-choisi'), texte: document.body.innerText.replace(/\s+/g, ' ') }));
    /* le plan est un brouillon (hors prévision) : le Calendrier ne le dessine pas encore ; il s'ouvre centré sur sa date */
    if (apres.choisi || !/Brassins/.test(apres.texte) || !/Achats/.test(apres.texte)) throw new Error(`« Placer » n'ouvre pas le Calendrier (écran Choisi encore là : ${apres.choisi}, rangées du Calendrier vues : ${/Achats/.test(apres.texte)})`);
    c.ok('D419-PLACER', 'Choisir → Dans À venir → Placer → Calendrier');
  });
}
