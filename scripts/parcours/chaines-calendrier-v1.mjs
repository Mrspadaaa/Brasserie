// Étapes CH-D1, CH-D9, CH-D10, CH-D11 du PARCOURS CHAINES (voie V1 de la chasse Calendrier, 21.11) : « les chiffres disent l'inconnu et le vrai nom ».
// Fixture : `fixtures/calendrier.mjs` (données simulées : Jhhh ×2, neipa v3 ×3, T-ZZ-POMPE payée sans paiement) ; jamais seedData.ts, aucun Gemini.
// Rouge sur le tag en-ligne/2026-11-21-tour8, vert sur l'arbre. 390 tactile. Bloc distinct de chaines.mjs : le pilote fusionne.
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const { fixtureCalendrier } = await import(pathToFileURL(path.join(ICI, 'fixtures', 'calendrier.mjs')).href);

const calendrier = (sansPompe = false) => (aujourdhui) => {
  const e = fixtureCalendrier(aujourdhui).entrees;
  return sansPompe ? e.filter((x) => x.id !== 'T-ZZ-POMPE') : e;
};
const dit = (s) => s.p.evaluate(() => [document.body.innerText.replace(/\s+/g, ' '), ...[...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label'))].join(' | '));
/** Les aria-label qui commencent par ce nom (une barre, une rangée) : ce que dit la barre. */
const labels = (s, re) => s.p.evaluate((src) => { const r = new RegExp(src, 'i'); return [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label').replace(/\s+/g, ' ')).filter((t) => r.test(t)); }, re.source);
const versCalendrier = async (s, sleep) => { await s.onglet('Calendrier'); await sleep(1800); };

export function etapesV1({ echec, ok, sleep, pageNeuve, sortie }) {
  return [
    {
      id: 'CH-D1', titre: 'Solde pas connu (pièce payée sans paiement) : le titre du Calendrier ne chiffre pas « CHF à dépenser » ; sans la pièce, le chiffre reste (CHD-1)',
      entrees: calendrier(false),
      async joue(s) {
        await versCalendrier(s, sleep);
        await s.cap('CH-D1-1-calendrier');
        const t = await dit(s);
        const chiffre = /([−-]?\s?[\d’' ]+)\s*CHF à dépenser/.exec(t);
        if (chiffre) return echec('CH-D1', `le Calendrier chiffre « ${chiffre[0].trim()} » alors que Finances dit « solde pas connu »`);
        // contre-épreuve : la même fixture sans la pièce, la caisse est complète, le chiffre reste
        const aujourdhui = new Date().toISOString().slice(0, 10);
        const p = await pageNeuve(s.banc, calendrier(true)(aujourdhui), sortie);
        try {
          await p.demarrer(); await versCalendrier(p, sleep);
          await p.cap('CH-D1-2-sans-piece');
          if (!/CHF à dépenser/.test(await dit(p))) return echec('CH-D1', 'contre-épreuve : sans la pièce, le Calendrier ne dit plus « CHF à dépenser » (la caisse est pourtant complète)');
        } finally { await p.fermer().catch(() => {}); }
        ok('CH-D1', 'avec la pièce payée sans paiement : aucun « CHF à dépenser » chiffré ; sans elle : le chiffre reste');
      }
    },
    {
      id: 'CH-D9', titre: 'Jhhh brassé à J−40, recette de 34 j : la barre dit « J40 » ou « prête depuis 6 j », jamais « J34 / 34 » (CHD-9)',
      entrees: calendrier(false),
      async joue(s) {
        await versCalendrier(s, sleep);
        let l = await labels(s, /^Jhhh\b/);
        if (!l.some((x) => /J\d+/.test(x))) {
          // la barre de Jhhh (brassé il y a 40 j) est dans le passé : on tire la fenêtre sur 3 mois, comme le brasseur
          await s.toucher('période, liste, tri et filtre', { dans: '[aria-label$="période, liste, tri et filtre"]', contient: true }); await sleep(650);
          await s.toucher('3 mois'); await sleep(1200);
          l = await labels(s, /^Jhhh\b/);
        }
        await s.cap('CH-D9-1-jhhh');
        const duree = l.filter((x) => /J\d+/.test(x));
        if (!duree.length) return echec('CH-D9', `aucune barre « Jhhh » avec sa durée (barres lues : ${l.join(' / ').slice(0, 200) || 'aucune'})`);
        const faux = duree.find((x) => /J34 \/ 34/.test(x));
        if (faux) return echec('CH-D9', `la barre plafonne le jour à la durée : « ${faux.slice(0, 120)} »`);
        if (!duree.some((x) => /J40\b|prête depuis 6 j/.test(x))) return echec('CH-D9', `aucune barre ne dit « J40 » ni « prête depuis 6 j » : ${duree.join(' / ').slice(0, 220)}`);
        ok('CH-D9', `la barre dit le retard : ${duree.find((x) => /J40\b|prête depuis 6 j/.test(x)).slice(0, 100)}`);
      }
    },
    {
      id: 'CH-D10', titre: 'Le Bord nomme les brassins par leur nom (« neipa v3 »), jamais par leur id (« B-NEIPA-1 ») (CHD-10)',
      entrees: calendrier(false),
      async joue(s) {
        await s.onglet('Bord'); await sleep(1600);
        await s.cap('CH-D10-1-bord');
        // la phrase du Bord (« 6 cette semaine : … ») ; la carte « Brassins » du Bord garde l'id en second plan, c'est une autre chose
        const phrase = await s.p.evaluate(() => document.querySelector('#bord-cal-resume')?.innerText.replace(/\s+/g, ' ') ?? null);
        if (!phrase) return echec('CH-D10', 'le Bord n’a pas sa ligne « Cette semaine au calendrier »');
        const id = /B-NEIPA-\d/.exec(phrase);
        if (id) return echec('CH-D10', `la ligne du Bord nomme un brassin par son id : « ${phrase.slice(0, 120)} »`);
        if (!/neipa v3/.test(phrase)) return echec('CH-D10', `la ligne du Bord ne dit pas « neipa v3 » : « ${phrase.slice(0, 120)} »`);
        ok('CH-D10', `la ligne du Bord dit « ${phrase.slice(0, 90)} », aucun id de brassin`);
      }
    },
    {
      id: 'CH-D11', titre: 'Un brassin en cuve dont l\'emballage n\'est pas renseigné dit « coût à venir » au Calendrier, jamais 0 (CHD-11)',
      entrees: calendrier(false),
      async joue(s) {
        await versCalendrier(s, sleep);
        await s.cap('CH-D11-1-calendrier');
        const cuve = (await labels(s, /^(neipa v3|Milk Stout|NEIPA Test)\b/)).filter((x) => /J\d+/.test(x));
        if (!cuve.length) return echec('CH-D11', 'aucune barre de brassin en cuve (neipa v3, Milk Stout, NEIPA Test) lue');
        if (!cuve.some((x) => /coût à venir/.test(x))) return echec('CH-D11', `aucun brassin en cuve ne dit « coût à venir » : ${cuve.join(' / ').slice(0, 260)}`);
        const zero = cuve.find((x) => /(^|[^\d.,])[−+-]?0(,00)? CHF|, [−+-]?0(\s|,|$)/.test(x));
        if (zero) return echec('CH-D11', `un coût inconnu est dit 0 : « ${zero.slice(0, 120)} »`);
        ok('CH-D11', `${cuve.filter((x) => /coût à venir/.test(x)).length}/${cuve.length} brassins en cuve disent « coût à venir »`);
      }
    }
  ];
}
