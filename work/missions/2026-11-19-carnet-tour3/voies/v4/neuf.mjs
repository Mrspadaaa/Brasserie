// Voie v4 : états de f4c, Choisir, carnet ouvert entier, cadre d'arrivée. Usage : node neuf.mjs [etats] [390,1280] [clair,sombre]
import { lancer, page, toucher, trouver, taper, texte, haut, capture, captureSansBlur, log, ecrireJournal, attendre, boutons } from './outil.mjs';
const T = async (p, nom) => log(`texte ${nom} : ${(await texte(p)).slice(0, 1100).replace(/\n+/g, ' ¦ ')}`);
async function supprimer(p) {
  if (!(await toucher(p, 'Plus', { label: true, sel: 'button' }))) if (!(await toucher(p, '···', { sel: 'button' }))) log('BOUTONS ' + JSON.stringify((await boutons(p)).slice(0, 40)));
  await captureSansBlur(p, '_menu-tmp');
  return toucher(p, 'Supprimer', { sel: '[role="menuitem"], button' });
}
const S = {
  /* PCN-22 : IA éteinte, Frigo, une chose à acheter */
  p22: async (nav, L, th) => { const p = await page(nav, `&theme=${th}&ia=eteint&ouvrir=frigo`, L); await taper(p, 'filtre à air G4, 2 pièces', { attente: 3000 }); await T(p, `p22-${L}`); await capture(p, `p22-${L}-${th}`);
    if (await toucher(p, 'Rangé', { sel: 'button' })) { await T(p, `p22-detail-${L}`); await captureSansBlur(p, `p22-${L}-${th}-detail`); } await p.close(); },
  /* v1-neuf 1 : moulin depuis la liste */
  moulin: async (nav, L, th) => { const p = await page(nav, `&theme=${th}`, L); await taper(p, 'Moulin à malt 2 cylindres, 150 kg/h', { attente: 4000 }); await haut(p); await T(p, `moulin-${L}`); await capture(p, `moulin-${L}-${th}`); await p.close(); },
  /* PCN-126 (+ PCN-100 bandeau) : autre projet tapé dans Ventilation */
  p126: async (nav, L, th) => { const p = await page(nav, `&theme=${th}&ouvrir=ventilation&ia=lent`, L);
    await taper(p, 'autre projet, sans rapport : un frigo de garde pour 20 fûts', { envoyer: false }); await attendre(1500); await T(p, `p126-avant-${L}`); await captureSansBlur(p, `p126-${L}-${th}-a-frappe`);
    await p.keyboard.press('Enter'); await attendre(1200); await captureSansBlur(p, `p126-${L}-${th}-b-pendant`); await attendre(5000); await T(p, `p126-apres-${L}`); await capture(p, `p126-${L}-${th}-c-apres`); await p.close(); },
  /* PCN-20 : g35, supprimer Ventilation */
  p20: async (nav, L, th) => { const p = await page(nav, `&theme=${th}&g35=1&ouvrir=ventilation`, L); await supprimer(p); await attendre(600); await T(p, `p20-${L}`); await captureSansBlur(p, `p20-${L}-${th}`); await p.close(); },
  /* PCN-42 : Frigo lié à À venir, supprimer */
  p42: async (nav, L, th) => { const p = await page(nav, `&theme=${th}&lien-retient=a-venir`, L); await supprimer(p); await attendre(600); await T(p, `p42-${L}`); await captureSansBlur(p, `p42-${L}-${th}`); await p.close(); },
  /* PCN-61 : liste, frappe sans envoi */
  p61: async (nav, L, th) => { const p = await page(nav, `&theme=${th}`, L); await taper(p, 'Ventilation de la salle', { envoyer: false }); await attendre(1500); await T(p, `p61-${L}`); await captureSansBlur(p, `p61-${L}-${th}`); await p.close(); },
  /* PCN-71 : Comparer › Choisir, puis « Pourquoi ce choix » */
  choisir: async (nav, L, th) => { const p = await page(nav, `&theme=${th}&ouvrir=ventilation`, L); await toucher(p, 'Comparer', { sel: 'button, a, [role="button"]' });
    const b = await trouver(p, 'Choisir', { sel: 'button' }); if (!b) { log('Choisir introuvable ' + JSON.stringify((await boutons(p)).slice(0, 40))); await p.close(); return; }
    await b.evaluate((e) => e.scrollIntoView({ block: 'center' })); await captureSansBlur(p, `choisir-${L}-${th}-a`); try { await b.tap(); } catch { await b.click(); } await attendre(1500);
    await T(p, `choisir-${L}`); await capture(p, `choisir-${L}-${th}-b`);
    for (const t of ['Confirmer', 'Choisir celle-ci', 'Oui, choisir']) if (await toucher(p, t, { sel: 'button' })) { await attendre(1200); break; }
    const e = await trouver(p, 'Pourquoi', { sel: 'h2,h3,h4,p,div' }); if (e) { await e.evaluate((x) => x.scrollIntoView({ block: 'start' })); await attendre(500); }
    await T(p, `choisir-c-${L}`); await capture(p, `choisir-${L}-${th}-c-pourquoi`); await p.close(); },
  /* PCN-116 : carnet Ventilation entier */
  ventil: async (nav, L, th) => { const p = await page(nav, `&theme=${th}&ouvrir=ventilation`, L); await capture(p, `ventil-${L}-${th}`, { plein: true }); await p.close(); },
  /* liste, À venir, Réalisés : ensemble */
  ecrans: async (nav, L, th) => { const p = await page(nav, `&theme=${th}`, L); await capture(p, `ens-liste-${L}-${th}`, { plein: true });
    await toucher(p, 'À venir', { sel: 'button, [role="tab"]' }); await attendre(900); await T(p, `avenir-${L}`); await capture(p, `ens-avenir-${L}-${th}`, { plein: true });
    if (!(await toucher(p, 'Réalisés', { sel: 'button, [role="tab"]' }))) log('Réalisés introuvable'); await attendre(900); await T(p, `realises-${L}`); await capture(p, `ens-realises-${L}-${th}`, { plein: true }); await p.close(); }
};
const [choix, larg, them] = process.argv.slice(2);
const noms = choix ? choix.split(',') : Object.keys(S);
const tailles = larg ? larg.split(',').map(Number) : [390, 1280];
const themes = them ? them.split(',') : ['clair', 'sombre'];
const nav = await lancer();
try { for (const n of noms) for (const L of tailles) for (const th of themes) { log(`=== ${n} ${L} ${th}`); try { await S[n](nav, L, th); } catch (e) { log(`ERREUR ${n} ${L} ${th} : ${e.message.slice(0, 160)}`); } } }
finally { await nav.close(); ecrireJournal(`journal-neuf-${(choix ?? 'tout').replace(/,/g, '+').slice(0, 40)}`); }
