// Étapes CH-V5, CH-N10, CH-D8, CH-MSG du PARCOURS CHAINES (voie V9 de la chasse Calendrier, 21.11) : « plein écran et horizon de la caisse ».
// Fixture : `fixtures/calendrier.mjs` (données simulées : Jhhh ×2, neipa v3 ×3, T-ZZ-POMPE payée sans paiement) ; jamais seedData.ts, aucun Gemini.
// Rouge sur le tag en-ligne/2026-11-21-tour8, vert sur l'arbre. 390 tactile. Bloc distinct de chaines.mjs : le pilote fusionne.
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const { fixtureCalendrier } = await import(pathToFileURL(path.join(ICI, 'fixtures', 'calendrier.mjs')).href);

/** `sansPompe` : la même fixture sans la pièce payée sans paiement : la caisse est complète, le point bas existe (Bord, Finances, Calendrier). */
const calendrier = (sansPompe) => (aujourdhui) => {
  const e = fixtureCalendrier(aujourdhui).entrees;
  return sansPompe ? e.filter((x) => x.id !== 'T-ZZ-POMPE') : e;
};
const dit = (s) => s.p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
const versCalendrier = async (s, sleep) => { await s.onglet('Calendrier'); await sleep(1800); };
const HORIZON = /horizon|\b\d+ ?(j|jours|sem\.|semaines|mois)\b|12 mois/i;

export function etapesV9({ echec, ok, sleep }) {
  return [
    {
      id: 'CH-V5', titre: 'À l’arrivée, la pastille du Calendrier dit ce que la frise montre (« 6 sem. », S44–S49), pas « Nov. » seul (CHV-5)',
      entrees: calendrier(true),
      async joue(s) {
        await versCalendrier(s, sleep);
        await s.cap('CH-V5-1-arrivee');
        const l = await s.p.evaluate(() => ({
          pastille: document.querySelector('[data-ent-periode]')?.textContent?.trim() ?? '',
          cadre: document.querySelector('.ent-cadre')?.getAttribute('aria-label')?.replace(/^Fenêtre : /, '') ?? '',
        }));
        const m = /^S(\d+)(?: – S(\d+))?/.exec(l.cadre);
        if (!l.pastille || !m) return echec('CH-V5', `pastille « ${l.pastille} » ou cadre « ${l.cadre} » illisible`);
        const n = Number(m[2] ?? m[1]) - Number(m[1]) + 1;
        const dite = new RegExp(`\\b${n} sem\\.|${l.cadre.replace(/[–]/g, '[–-]')}`).test(l.pastille) || (n === 13 && /3 mois|T\d/.test(l.pastille)) || (n === 26 && /6 mois/.test(l.pastille));
        if (!dite) return echec('CH-V5', `la frise montre ${n} semaines (« ${l.cadre} »), la pastille dit « ${l.pastille} »`);
        ok('CH-V5', `pastille « ${l.pastille} » ; cadre « ${l.cadre} » (${n} sem.)`);
      }
    },
    {
      id: 'CH-N10', titre: 'Plein écran en portrait : ‹ › et la loupe restent atteignables ; « Tourne le téléphone » ne couvre aucune ligne (CHN-10)',
      entrees: calendrier(true),
      async joue(s) {
        await versCalendrier(s, sleep);
        const ouvert = await s.p.evaluate(() => { const b = document.querySelector('.ent-pl'); if (!b) return false; b.click(); return true; });
        if (!ouvert) return echec('CH-N10', 'pas de bouton plein écran');
        await sleep(1500);
        await s.p.waitForFunction(() => /Tourne le téléphone/.test(document.body.innerText), { timeout: 7000 }).catch(() => {}); // verrou d'orientation, puis 1 s d'attente de rotation : l'invitation vient après
        await sleep(500);
        const r = await s.p.evaluate(() => {
          const vu = (e) => { if (!e) return false; const b = e.getBoundingClientRect(); return b.width > 4 && b.height > 4 && b.bottom > 0 && b.top < innerHeight && b.right > 0 && b.left < innerWidth && getComputedStyle(e).visibility !== 'hidden'; };
          const nom = (n) => document.querySelector(`button[aria-label="${n}"]`);
          // le bandeau, où qu'il soit rendu (message flottant de l'onglet sur tour8, dans l'en-tête ensuite) : le plus petit élément qui porte la phrase
          let bandeau = [...document.querySelectorAll('body *')].filter((e) => /Tourne le téléphone/.test(e.textContent ?? '') && ![...e.children].some((c) => /Tourne le téléphone/.test(c.textContent ?? '')) && e.getBoundingClientRect().width > 60).pop() ?? null; // pas la copie sr-only
          // la pastille : le premier ancêtre qui a un fond (le texte seul est plus étroit que ce qu'il cache)
          const chaine = []; // la montée est bornée à une pastille : jamais un conteneur de presque toute la largeur (il exclurait tout le texte)
          while (bandeau && bandeau.parentElement && /rgba\(0, 0, 0, 0\)|transparent/.test(getComputedStyle(bandeau).backgroundColor) && bandeau.parentElement.getBoundingClientRect().width < innerWidth * 0.9) { chaine.push(bandeau.tagName); bandeau = bandeau.parentElement; }
          const rb = bandeau?.getBoundingClientRect();
          const couvert = []; let testes = 0;
          if (rb) {
            // chaque morceau de texte de la page (même mêlé à un autre élément : « Commande de malt −600 ») contre le rectangle du bandeau
            const marche = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            for (let n = marche.nextNode(); n; n = marche.nextNode()) {
              const e = n.parentElement;
              if (!e || !n.textContent.trim() || bandeau.contains(e) || ['SCRIPT', 'STYLE'].includes(e.tagName) || getComputedStyle(e).visibility === 'hidden') continue;
              testes++; const g = document.createRange(); g.selectNodeContents(n);
              for (const x of g.getClientRects()) {
                if (x.width < 2 || x.height < 2) continue;
                if (Math.min(x.right, rb.right) - Math.max(x.left, rb.left) > 1 && Math.min(x.bottom, rb.bottom) - Math.max(x.top, rb.top) > 1) { couvert.push(n.textContent.trim().slice(0, 30)); break; }
              }
            }
          }
          const sous = [];
          if (rb) for (const fx of [0.1, 0.3, 0.5, 0.7, 0.9]) for (const fy of [0.25, 0.75]) {
            const pile = document.elementsFromPoint(rb.x + rb.width * fx, rb.y + rb.height * fy);
            const i = pile.findIndex((e) => bandeau.contains(e));
            for (const e of pile.slice(i + 1)) {
              if (e.contains(bandeau) || e === document.documentElement || e === document.body) continue;
              const t = (e.innerText ?? e.textContent ?? '').replace(/s+/g, ' ').trim();
              if (t && t.length < 90) { sous.push(t.slice(0, 40)); break; }
            }
          }
          return { plein: !!document.fullscreenElement, prec: vu(nom('Période précédente')), suiv: vu(nom('Période suivante')), loupe: vu(document.querySelector('button[aria-label^="Rechercher"]')), bandeau: bandeau?.textContent?.trim() ?? null, couvert: [...new Set(couvert)].slice(0, 4), testes, sous: [...new Set(sous)].slice(0, 4), montee: chaine.join('>'), rb: rb ? [rb.x, rb.y, rb.width, rb.height].map(Math.round) : null };
        });
        await s.cap('CH-N10-1-plein'); // lu AVANT la capture : la capture en plein écran redimensionne la page
        if (!r.plein) return echec('CH-N10', 'le plein écran ne s’est pas ouvert (banc)');
        const fautes = [];
        if (!r.prec || !r.suiv) fautes.push('‹ › introuvables en plein écran');
        if (!r.loupe) fautes.push('la loupe est introuvable en plein écran');
        const couvre = [...r.couvert, ...r.sous];
        if (couvre.length) fautes.push(`le bandeau « ${r.bandeau} » [${r.rb}] couvre : ${[...new Set(couvre)].join(' / ')} (${r.testes} textes testés, montée ${r.montee || 'aucune'})`);
        else if (!r.bandeau) fautes.push('aucun bandeau « Tourne le téléphone » : le contrôle ne prouve rien');
        await s.p.evaluate(() => document.exitFullscreen?.()).catch(() => {});
        if (fautes.length) return echec('CH-N10', fautes.join(' ; '));
        ok('CH-N10', `plein écran : ‹ › et la loupe visibles ; bandeau ${r.bandeau ? `« ${r.bandeau} » sans rien couvrir` : 'absent'}`);
      }
    },
    {
      id: 'CH-D8', titre: 'Le Bord, Finances › Prévisions et le Calendrier écrivent chacun l’horizon de leur point bas (CHD-8)',
      entrees: calendrier(true),
      async joue(s) {
        const lus = {};
        await s.onglet('Bord'); await sleep(1600);
        lus.Bord = await s.p.evaluate(() => document.querySelector('[data-point-bas]')?.innerText.replace(/\s+/g, ' ') ?? null);
        await s.cap('CH-D8-1-bord');
        await s.onglet('Finances'); await sleep(1500);
        await s.toucher('Prévisions', { att: 1500 }).catch(() => {});
        lus.Prévisions = await s.p.evaluate(() => { const e = document.querySelector('.prv'); return e ? `${e.getAttribute('aria-label') ?? ''} ${e.innerText.replace(/\s+/g, ' ')}`.slice(0, 600) : null; });
        await s.cap('CH-D8-2-previsions');
        await versCalendrier(s, sleep);
        const cle = await s.p.evaluate(() => document.querySelector('[data-ent-cle]')?.getAttribute('aria-label') ?? null);
        await s.p.evaluate(() => document.querySelector('[data-ent-cle]')?.click()); await sleep(700);
        const detail = await s.p.evaluate(() => document.querySelector('.ent-creux [data-horizon]')?.textContent ?? null);
        await s.cap('CH-D8-3-calendrier');
        lus.Calendrier = `${cle ?? ''} ${detail ?? ''}`;
        const manque = Object.entries(lus).filter(([, t]) => !t || !HORIZON.test(t)).map(([k, t]) => `${k} : « ${(t ?? 'point bas introuvable').slice(0, 90)} »`);
        if (!/horizon/i.test(lus.Calendrier)) manque.push('Calendrier : ni le chiffre clé ni son détail ne disent « horizon »');
        if (!/horizon/i.test(lus.Bord ?? '')) manque.push('Bord : le mot « horizon » manque');
        if (manque.length) return echec('CH-D8', `horizon non écrit : ${manque.join(' ; ')}`);
        ok('CH-D8', `Bord « ${lus.Bord} » ; Calendrier « ${detail} »`);
      }
    },
    {
      id: 'CH-MSG', titre: 'Solde confirmé mais pièce payée sans paiement : l’en-tête ne dit pas « Solde de départ inconnu », il dit la pièce sans paiement (EnTete.tsx:756)',
      entrees: calendrier(false),
      async joue(s) {
        await versCalendrier(s, sleep);
        const t = await s.p.evaluate(() => document.querySelector('.ent-inconnu')?.innerText.replace(/\s+/g, ' ') ?? null);
        await s.cap('CH-MSG-1-calendrier');
        if (!t) return echec('CH-MSG', 'aucun message de caisse inconnue dans l’en-tête');
        if (/Solde de départ inconnu/.test(t) || !/paiement/i.test(t)) return echec('CH-MSG', `le message dit « ${t} » : la cause est une pièce payée sans paiement`);
        ok('CH-MSG', `« ${t} »`);
      }
    },
  ];
}
