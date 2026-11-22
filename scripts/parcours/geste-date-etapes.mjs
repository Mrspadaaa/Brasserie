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
