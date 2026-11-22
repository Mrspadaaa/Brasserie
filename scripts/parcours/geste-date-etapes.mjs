// Les écrans du parcours GESTE-DATE-PARTOUT (22.11) : un par écran porté. Chaque étape : { id, nom, jouer(c) }, `c` = le contexte de geste-date.mjs.
// Une étape va à l'écran PAR SON ENTRÉE, vérifie que la frise partagée est là (et plus de champ natif ni de réglette maison), glisse le repère de
// quelques jours, valide par le geste propre de l'écran, puis lit la date ÉCRITE dans le magasin et la compare à celle de départ + les jours tirés.

const swissVersIso = (s) => { const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s ?? ''); return m ? `${m[3]}-${m[2]}-${m[1]}` : ''; };
const plusJours = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

export const etapes = [
  {
    id: 'brassin-fiche', nom: 'Feuille d\'un brassin planifié : Reporter → frise → Enregistrer',
    async jouer(c) {
      await c.bouton('Brassins'); await c.sleep(900);
      await c.toucherTexte('ZZ TEST Cryo Pale'); await c.sleep(900);
      const avant = await c.ecrit('batches', 'B-ZZ-CRYO');
      const depart = swissVersIso(avant?.plannedBrewDate);
      c.controle('GD-brassin-0 départ lu', !!depart, `date prévue de départ ${avant?.plannedBrewDate}`);
      await c.bouton('Reporter');
      await c.cap('brassin-reporter');
      const t0 = await c.texte();
      c.controle('GD-brassin-1 « Était prévue le » conservé', /Était prévue le \d\d\.\d\d/.test(t0), (t0.match(/Était prévue le \d\d\.\d\d/) ?? ['absent'])[0]);
      const natif = await c.p.evaluate(() => ({
        frise: !!document.querySelector('[data-choix-date-frise] [data-date-point]'),
        natif: !!document.querySelector('[data-curseur-jours] input[type=range], [data-curseur-jours] input[type=date]'),
        chevrons: !!document.querySelector('[data-curseur-jours] [aria-label^="Un jour plus"]')
      }));
      c.controle('GD-brassin-2 frise partagée au jour, sans réglette maison', natif.frise && !natif.natif && !natif.chevrons, JSON.stringify(natif));
      const g = await c.glisserFrise(9);
      await c.cap('brassin-glisse');
      const attendu = plusJours(depart, Math.round(g.px / g.pxJour));
      const t1 = await c.texte();
      const m = /Enregistrer\s+\S+\s+(\d\d)\.(\d\d)/.exec(t1);
      c.controle('GD-brassin-3 le bouton Enregistrer dit le jour tiré', !!m && attendu.slice(8) === m[1] && attendu.slice(5, 7) === m[2], `attendu ${attendu}, bouton « ${m?.[0] ?? 'absent'} »`);
      await c.bouton('Enregistrer');
      await c.sleep(700);
      const apres = await c.ecrit('batches', 'B-ZZ-CRYO');
      c.controle('GD-brassin-4 la date est écrite', swissVersIso(apres?.plannedBrewDate) === attendu, `écrit ${apres?.plannedBrewDate}, attendu ${attendu} (${g.px} px à ${g.pxJour} px par jour)`);
      await c.cap('brassin-apres');
    }
  }
];

// ── GESTE-DATE-PARTOUT, lot 4 : un écran par étape, même geste (22.11) ──────────────────────────────────────────────────────────────────────
// `geste` : la pastille « <label> : … » s'ouvre (sauf frise `ouvert`), la frise partagée est là, sans champ natif ni réglette maison ; on glisse le
// repère de `jours` jours ; la date du brouillon (data-valeur) a bougé de ce nombre de jours ; le geste propre de l'écran la valide ; le magasin
// la porte telle quelle (`lire(donnée)` rend un jour AAAA-MM-JJ ou une date suisse).
const versIso = (s) => (/^\d{4}-\d{2}-\d{2}/.test(s ?? '') ? String(s).slice(0, 10) : swissVersIso(s));
const valeurZone = (c, label) => c.p.evaluate((l) => (document.querySelector(`[data-choix-date][data-choix-date-label="${l}"]`)?.dataset.valeur ?? null), label);
const boutonsVisibles = (c) => c.p.evaluate(() => [...document.querySelectorAll('button,[role=menuitem],[role=tab],summary')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => (e.getAttribute('aria-label') || e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 28)).filter(Boolean).slice(0, 40).join(' | '));
async function geste(c, { id, label, jours, ouvert = false, valider, lire, coll, rid, nom }) {
  if (!ouvert) await c.toucher('[data-choix-date-pastille]', `${label} :`);
  const e = await c.p.evaluate(() => ({ frise: !!document.querySelector('[data-choix-date-frise] [data-date-point]'), natif: document.querySelectorAll('input[type=date],input[type=datetime-local]').length, chevrons: !!document.querySelector('[aria-label^="Un jour plus"]') }));
  c.controle(`${id}-1 frise partagée, sans champ natif ni réglette maison`, e.frise && !e.natif && !e.chevrons, JSON.stringify(e));
  const d0 = await valeurZone(c, label);
  const g = await c.glisserFrise(jours);
  await c.cap(`${nom}-glisse`);
  const d1 = await valeurZone(c, label);
  const attendu = d0 ? plusJours(d0, Math.round(g.px / g.pxJour)) : null;
  c.controle(`${id}-2 le repère tire la date`, !!d1 && d1 !== d0 && (!attendu || d1 === attendu), `avant ${d0}, après ${d1}, attendu ${attendu} (${g.px} px à ${g.pxJour} px/jour)`);
  await valider();
  await c.sleep(2500);
  const apres = await c.ecrit(coll, rid);
  const ecrite = versIso(lire(apres));
  c.controle(`${id}-3 la date est écrite telle que tirée`, !!ecrite && ecrite === d1, `écrit ${ecrite || 'rien'} (${JSON.stringify(lire(apres))}), tiré ${d1}`);
  await c.cap(`${nom}-apres`);
}
const sur = async (c, quoi, fn) => { try { await fn(); } catch (err) { throw new Error(`${err.message ?? err} — boutons visibles : ${await boutonsVisibles(c).catch(() => '?')}`); } };
const itemMenu = (c, t) => c.toucher('[role=menuitem],button', t);
const saisir = async (c, aria, valeur) => { await c.p.focus(`[aria-label="${aria}"]`); await c.p.keyboard.type(valeur); };

etapes.push(
  { id: 'densite', nom: 'Brassin en fermentation : relevé de densité → « Date du relevé » → Ajouter le relevé',
    async jouer(c) { await sur(c, 'densite', async () => {
      await c.bouton('Brassins'); await c.sleep(900); await c.toucherTexte('ZZ TEST Blonde'); await c.sleep(900);
      await c.bouton('Mesurer'); await c.sleep(700); await c.cap('densite-ouvert'); await saisir(c, 'Densité du relevé', '1,020');
      await geste(c, { id: 'GD-densite', nom: 'densite', label: 'Date du relevé', jours: -3, coll: 'batches', rid: 'B-ZZ-FERM',
        valider: () => c.bouton('Ajouter le relevé'), lire: (b) => (b?.gravityLog ?? []).filter((x) => x.sg === 1.02 || x.gravity === 1.02 || x.value === 1.02).map((x) => x.date ?? x.at).pop() ?? (b?.gravityLog ?? []).slice(-1)[0]?.date });
    }); } },
  { id: 'materiel', nom: 'Fiche matériel : ⋯ › Modifier › Achat › « Date d’achat » → Enregistrer',
    async jouer(c) { await sur(c, 'materiel', async () => {
      await c.bouton('Stocks'); await c.sleep(800); await c.bouton('Matériel'); await c.sleep(800); await c.toucherTexte('ZZ TEST Fermenteur 120 L'); await c.sleep(900);
      await c.toucher('button', 'Gestion du matériel'); await itemMenu(c, 'Modifier'); await c.sleep(500);
      await c.toucher('summary', 'Achat'); await c.cap('materiel-ouvert');
      await geste(c, { id: 'GD-materiel', nom: 'materiel', label: 'Date d’achat', jours: -4, coll: 'equipment', rid: 'E-ZZ-FERM',
        valider: () => c.bouton('Enregistrer'), lire: (e) => e?.purchaseDate });
    }); } },
);
