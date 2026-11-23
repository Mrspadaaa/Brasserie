# REPRISE — chaîne PRODUIRE (21.11)

**Objectif.** Jouer au doigt la chaîne PRODUIRE, puis rendre ANALYSE-produire.md et BUGS-produire.md, avec le contrat GAIN.md. La chaîne va de l'idée à la recette, puis à la date, au brassin, au jour de brassage, à la fermentation et à ses mesures, au conditionnement, au stock produit, au Calendrier, et enfin au coût dans Finances.

## Fait

- Le maillon C1 à C3 a été joué : de l'idée à la recette, puis à « préparer le brassin ».
- Huit bugs, WFR-1 à WFR-8, dont un bloquant (WFR-1 : une recette neuve ne se lance pas).
- Cinq propositions : P1 et P4 chiffrées, P2, P3 et P5 en attente de mesure.
- Fichiers : ANALYSE-produire.md (partiel) et BUGS-produire.md.

## Alerte données (pour le pilote)

Le banc du 20.11 (`2026-11-20-moins-de-gestes/MESURES.md`) et mon début de banc chargeaient `C:/Users/mrspa/Documents/Brasserie/src/data/seedData.ts`. D'après l'en-tête de `seedData.example.ts`, ce fichier contient la **comptabilité réelle**, les clients et l'identité.

J'ai arrêté ce banc. Les captures 01 à 19 de `%TEMP%/wf-produire/cap/` montrent ces données : elles ne sont pas commitées, et sont à supprimer par l'utilisateur ou le pilote. Les builds `%TEMP%/wf-produire/dist*` ont été refaits sans ce seed.

## Banc à utiliser : fixture simulée et persistante

1. **Build de test** depuis port-carnet :
   ```
   PARCOURS_RACINE=<port-carnet> npx vite build --config scripts/parcours/vite.parcours.config.mjs --outDir %TEMP%/wf-produire/distf --emptyOutDir
   ```
   Ce build a `DEV` vrai et du React de production. La fixture se lit dans localStorage, et le magasin se recopie dans `<jeu>:cache` : un rechargement garde donc l'état.
2. **Servir** `distf`. On peut reprendre le serveur http de `acheter/banc.mjs`, qui reprend aussi `toucher`, `calme` et la coupure du réseau externe.
   - URL : `/?dev-local&finance-demo=parcours-carnet`. Les jeux admis sont `parcours-calendrier` et `parcours-carnet` (`scripts/parcours/fixtures/entree-app.mjs`), et un jeu se choisit avec sa clé.
   - Avant le chargement, poser `localStorage['parcours-carnet:fixture'] = JSON.stringify(entrees)`, au format `[{ name, id, data }]`.
3. **Fixture « ZZ TEST » à écrire** dans `work/missions/2026-11-21-workflows-app/produire/fixture-produire.mjs`, sur le modèle de `acheter/fixture-achat.mjs`. Contenu :
   - stockItems avec prix :
     - Malt pilsner 25 kg à 1,6 ;
     - Munich 10 kg à 1,9 ;
     - Caramünch 5 kg à 2,8 ;
     - Citra 500 g à 0,09 ;
     - Saaz 300 g ;
     - US-05, 4 sachets à 4,5 ;
     - bouteilles 33 cl × 200 à 0,35 ;
     - capsules × 300 ;
     - sucre 3 kg ;
   - une recette déjà figée, avec `brewhouse` ;
   - un brassin en fermentation depuis 14 jours (primaire 12 j), avec un relevé de densité, pour jouer C6 et C7 sans attendre ;
   - des fûts vides : chercher la collection des fûts, `grep -n "keg" src/types/index.ts`, puis le parc dans StocksTab ;
   - le profil financier, sur le modèle de `fixtureAchat`.
4. **Aides de jeu.** Elles sont dans `%TEMP%/wf-produire/h.mjs` et `run.mjs` (l'import de puppeteer passe par `port-carnet/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js`) :
   - `b(regex)` touche le premier élément visible et rend le temps jusqu'au DOM calme ;
   - `plus(item)` passe par le menu + ;
   - `d3(titre)` vide le texte, les boutons et les champs ;
   - `attendre(regex)` ;
   - `st()` donne les clics, les saisies et les tâches longues.

   **Pièges :**
   - ne pas utiliser Vite de dev : l'optimisation des dépendances recharge la page et perd l'état ;
   - écrire les scripts avec Write, pas en heredoc (le contrôle de sécurité du shell les refuse) ;
   - « Enregistrer et préparer » sur une recette neuve bute sur WFR-1 : il faut donc une recette **figée** dans la fixture.

## Prochaine action, dans l'ordre

1. Rejouer WFR-1 à WFR-8 sur la fixture. Pour WFR-1, regarder si la recette neuve reçoit `brewhouse` (BrewWizard.tsx l.640 et l.1770).
2. Jouer C4 : feuille Brasser → date → Calendrier. Compter les gestes du jour, et regarder si la fermentation, la garde et la fin apparaissent au calendrier. Mesurer alors les gestes « avant » de P2 et le chronométrage de P5.
3. Jouer C5 : compagnon « Brasser » → commencer → paliers → OG. Comparer Stocks avant et après (déstockage), et vérifier que l'OG suit sur la fiche et au calendrier.
4. Jouer C6 : saisir une densité de fermentation. Où se saisit-elle ? Combien de gestes ? La fin prévue bouge-t-elle ?
5. Jouer C7 : conditionner en bouteilles et en fût. Vérifier le stock produit, la consommation des bouteilles et capsules, le fût marqué plein et le calendrier.
6. Jouer C8 : coût du brassin dans Finances (`CoutBrassinFlux`, `BrewBudgetSheet`). La donnée suit-elle sans saisie ?
7. Pour chaque maillon, prendre les quatre regards et une capture regardée, puis compléter la table, les propositions GAIN et l'annexe.
8. Commit par chemins.
