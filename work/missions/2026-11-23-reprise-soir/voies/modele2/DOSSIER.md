# Dossier modele2

- Test par modèle (e2e/calendrier/etat-coherent.spec.ts) ROUGE sur dbd454199 (tour 39 en ligne), graine 4444, 4e suite, alors qu'il était vert sur 865efdb5b (voie modele, 200 × 3 graines). Journal : voies/fix38c/modele-200.log.
- Contre-exemple : [cadre tenu au bord -1 2514 ms, app plage -47 mois, 46 mois, poignée debut tenue au bord 3338 ms, recharger, cadre -54, durée An, poignée debut -58, app plage 57 mois, 3 mois] → I1 durée « An » ≠ cadre 21.9 sem.
- Famille de sa plainte CAL-ETAT-COHERENT (« Toujours quelque problème avec la gestion des date, timing du graph.... » : « 24 sem. » pour 4 ans) : le bouton de durée, l'étiquette et l'axe doivent dire la même chose.
- Changements entre les deux : git diff 865efdb5b dbd454199 -- src/ui/calendrier src/domain/calendrier e2e/calendrier (voie fix38c : BandeSemaines.tsx année de l'axe, plageDuDoigt pose bornée, apport ; invariant I6 ajouté).
- Playwright : copie ../lot-cal (à jour, config playwright.lotcal.config.ts) : ETAT_RUNS=200 ETAT_SEED=4444 npx playwright test e2e/calendrier/etat-coherent.spec.ts --config playwright.lotcal.config.ts --reporter=dot (≈ 40 min ; rejeu ciblé du contre-exemple d'abord).
- Règle : corriger le cœur, jamais assouplir l'invariant I1 (deux assouplissements déjà faits ce soir pour des arrondis voulus ; celui-ci est un vrai écart de 30 semaines).
