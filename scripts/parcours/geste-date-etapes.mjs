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
/** Une entrée d'une collection retrouvée par un texte (son titre ZZ TEST) dans le cache que la page tient à jour. */
const trouver = (c, coll, texte) => c.p.evaluate((n, t) => { try { return (JSON.parse(localStorage.getItem('parcours-chaines:cache') ?? '[]').filter((e) => e.name === n && JSON.stringify(e.data).includes(t)).pop() ?? {}).data ?? null; } catch { return null; } }, coll, texte);
/** Le premier champ-jour d'une entrée (échéance, date…), hors création et mise à jour. */
const premierJour = (o) => { const e = Object.entries(o ?? {}).find(([k, v]) => typeof v === 'string' && /^(\d{4}-\d\d-\d\d|\d\d\.\d\d\.\d{4})/.test(v) && !/creat|updat|modif/i.test(k)); return e ? e[1] : undefined; };
async function geste(c, { id, label, jours, ouvert = false, valider, lire, coll, rid, nom, charge }) {
  /* la pastille au milieu de l'écran : ni sous l'en-tête fixe, ni sous le pied */
  if (!ouvert) { await c.p.evaluate((l) => { const e = [...document.querySelectorAll('[data-choix-date-pastille]')].find((x) => (x.getAttribute('aria-label') ?? '').startsWith(`${l} :`)); e?.scrollIntoView({ block: 'center' }); }, label); await c.sleep(300); await c.toucher('[data-choix-date-pastille]', `${label} :`); }
  await c.sleep(700);
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
  const apres = charge ? await charge() : await c.ecrit(coll, rid);
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
      await c.bouton('Brassins'); await c.sleep(900); await c.toucherTexte('ZZ TEST Ambrée'); await c.sleep(900);
      await c.bouton('Mesures'); await c.sleep(900); await c.toucher('button', '+ Relevé de densité'); await c.sleep(900); try { await c.toucherTexte('Ajouter un relevé de densité'); } catch { /* déjà ouvert par le pied */ }; await c.sleep(700); await c.cap('densite-ouvert'); await saisir(c, 'Densité du relevé', '1,020');
      await geste(c, { id: 'GD-densite', nom: 'densite', label: 'Date du relevé', jours: -3, coll: 'batches', rid: 'B-ZZ-GARDE',
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

const rapide = async (c, ligne) => { await c.toucher('button', 'Actions rapides'); await c.sleep(500); await itemMenu(c, ligne); await c.sleep(900); };
const ZZ = 'ZZ TEST geste-date';
etapes.push(
  /* « À faire » (TodoTimeline) : plus de porte depuis h1 (20.11) — AtelierPorte ne monte plus NoteCarnet ; le geste est prouvé au composant (tests/integration/todoTimelineFrise.test.tsx), pas par une entrée. */
  { id: 'ecriture', nom: 'Finances › Actions rapides › Écriture › Saisir sans justificatif › « Date de l’achat » → Enregistrer (l’écran est refait par saisie-main : seule la date écrite est vérifiée)',
    async jouer(c) { await sur(c, 'ecriture', async () => {
      await c.bouton('Finances'); await c.sleep(900); await rapide(c, 'Écriture'); await c.toucherTexte('Saisir sans justificatif'); await c.sleep(900);
      await c.p.focus('#purchase-total'); await c.p.keyboard.type('12,50');
      await c.p.focus('[placeholder^="Malt pour"]'); await c.p.keyboard.type(ZZ);
      try { await c.toucherTexte('Sans justificatif, c’est normal'); } catch { /* case absente */ }
      try { await c.toucher('summary,button', 'Date de l’achat'); } catch { /* section déjà ouverte */ } await c.sleep(600); await c.cap('ecriture-ouvert');
      await geste(c, { id: 'GD-ecriture', nom: 'ecriture', label: 'Date de l’achat', jours: -6, coll: 'transactions',
        valider: async () => { await c.bouton('Enregistrer'); },
        charge: () => trouver(c, 'transactions', ZZ), lire: (t) => t?.date });
    }); } },
  { id: 'caisse', nom: 'Caisse : « Date de la facture » (frise) → Encaisser',
    async jouer(c) { await sur(c, 'caisse', async () => {
      await c.bouton('Finances'); await c.sleep(900); await rapide(c, 'Vente'); await c.toucherTexte('33 cl'); await c.sleep(500);
      await c.toucher('button', 'Date de la facture'); await c.sleep(500);
      await geste(c, { id: 'GD-caisse', nom: 'caisse', label: 'Choisir la date', ouvert: true, jours: -10, coll: 'transactions',
        valider: async () => { await c.toucher('button', 'Espèces'); await c.sleep(400); await c.bouton('Encaisser'); }, charge: () => c.p.evaluate(() => { try { return (JSON.parse(localStorage.getItem('parcours-chaines:cache') ?? '[]').filter((e) => e.name === 'transactions' && !String(e.id).startsWith('T-ZZ')).pop() ?? {}).data ?? null; } catch { return null; } }), lire: (t) => t?.date });
    }); } },
  { id: 'solde', nom: 'Finances › Prévisions › Solde et paramètres › « Date du solde » → Enregistrer',
    async jouer(c) { await sur(c, 'solde', async () => {
      await c.bouton('Finances'); await c.sleep(900);
      /* l'entrée : le bouton « Solde et paramètres financiers » de la caisse de la Synthèse (sinon celui des Prévisions) */
      try { await c.toucher('button', 'Solde et paramètres'); } catch { await c.bouton('Prévisions'); await c.sleep(900); await c.toucher('button', 'Solde et paramètres'); }
      await c.sleep(900); await c.cap('solde-ouvert');
      await saisir(c, 'Solde de départ (CHF)', '1000');
      await geste(c, { id: 'GD-solde', nom: 'solde', label: 'Date du solde', jours: -5, coll: 'financialProfiles', rid: 'current',
        valider: () => c.bouton('Enregistrer'), lire: (p) => p?.openingCash?.date });
    }); } },
  { id: 'houblon', nom: 'Brassin en fermentation › dossier › Noter une dégustation du brassin › « Date de dégustation » → Enregistrer',
    async jouer(c) { await sur(c, 'houblon', async () => {
      await c.bouton('Brassins'); await c.sleep(900); await c.toucherTexte('ZZ TEST Ambrée'); await c.sleep(900);
      await c.bouton('Carnet'); await c.sleep(900); await c.toucherTexte('Noter une dégustation du brassin'); await c.sleep(700); await c.cap('houblon-ouvert');
      await geste(c, { id: 'GD-houblon', nom: 'houblon', label: 'Date de dégustation', jours: -2, coll: 'hopTastings',
        valider: () => c.bouton('Enregistrer la dégustation'), charge: () => trouver(c, 'hopTastings', ''), lire: (t) => t?.date });
    }); } },
);

// Levure (lot 4) : Recettes › Modifier la recette › étape Levure › produit retenu › Dose, ensemencement et starter › Planifier la préparation ›
// « Ensemencement prévu » (le jour, puis l'heure) → Planifier ; la préparation porte `targetPitchAt` (ISO, lu en jour local).
const jourLocal = (iso) => { const d = new Date(iso); return Number.isFinite(d.getTime()) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : ''; };
etapes.push(
  { id: 'levure', nom: 'Recette › étape Levure › Planifier la préparation › « Ensemencement prévu » → Planifier',
    async jouer(c) { await sur(c, 'levure', async () => {
      await c.bouton('Brassins'); await c.sleep(900); await c.bouton('Recettes'); await c.sleep(900);
      try { await c.toucher('[aria-label^="Modifier la recette ZZ TEST Levure"]'); } catch { await c.toucherTexte('ZZ TEST Levure'); await c.sleep(700); await c.toucher('button', 'Modifier'); }
      await c.sleep(1200);
      await c.toucher('nav[aria-label="Étapes"] button', 'Levure'); await c.sleep(1200);
      await c.toucher('button', 'Offres'); await c.sleep(1200);
      const choix = '.yp-products li[data-product="wyeast-1056-activator-125ml"] button.yp-choose';
      await c.p.evaluate((q) => document.querySelector(q)?.scrollIntoView({ block: 'center' }), choix); await c.sleep(400); /* au milieu de l'écran, hors du pied fixe */
      await c.toucher(choix); await c.sleep(900);
      await c.toucher('button[data-lv="dose"]'); await c.sleep(1200);
      await c.sleep(700); await c.toucher('button', 'Planifier la préparation'); await c.sleep(700); await c.cap('levure-ouvert');
      await saisir(c, 'Volume de starter retenu en litres', '1');
      await c.p.focus('[placeholder^="Ex. 1 pack"]'); await c.p.keyboard.type('1 Activator du même produit');
      await c.p.focus('[placeholder^="Ex. erlenmeyer"]'); await c.p.keyboard.type('Fiole 2 L ZZ TEST');
      const lireRecette = () => c.ecrit('recipes', 'R-ZZ-LEVURE');
      await geste(c, { id: 'GD-levure', nom: 'levure', label: 'Ensemencement prévu', jours: 9, coll: 'recipes', rid: 'R-ZZ-LEVURE',
        valider: async () => { await c.toucher('.yp-prep button', 'Planifier'); await c.sleep(900); await c.cap('levure-planifie');
          /* la préparation vit dans le brouillon de la recette : elle n'est écrite qu'à « Enregistrer la recette » (étape Récap.) */
          await c.toucher('nav[aria-label="Étapes"] button', 'Récap'); await c.sleep(1200); await c.cap('levure-recap'); await c.toucher('button', 'Enregistrer la recette'); await c.sleep(1500); },
        lire: (r) => { const p = r?.yeast?.pitching?.preparation; return p?.targetPitchAt ? jourLocal(p.targetPitchAt) : undefined; } });
    }); } },
);
