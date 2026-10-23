OK — mode --parcours de controle-usage-intensite.mjs (U1 usage, I1 intensité), 11 témoins, joué : 1 défaut sur Ma bière

## Fichiers écrits
- `work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs` : en-tête documenté, branche `--parcours` avant le lancement du mode actuel (non modifié), fonctions `lireParcours` (dans la page) et `jouerParcours`, à la fin du fichier.
- `work/refonte-frontend/v4/tournoi/outils/temoins/usage-parcours-{ok,ok-suggerer,ok-comparer,usage-faux,ligne-sans-usage,source-longue,sans-intensite,ecart,route-inconnue,sans-famille-qui-bouge,vide}/etat.html`.
- `work/missions/2026-10-23-controles-parcours/voies/c2-intensite/NOTE.md` (table des routes, hors-contrôle) et ce fichier.
- Rien d'autre : sondes jetées, générateur des témoins dans le dossier temporaire de la session. `git status` ne montre que mes fichiers dans mon périmètre (les autres entrées non suivies viennent de la session de la maquette).

## Critères
- G1 : `USAGE-INTENSITE OK` (q2b, `--page=etat-b.html`, 17 voies).
- G2 : `USAGE-INTENSITE OK` (usage-parcours-ok, 1 voie, 1 usage, 1 intensité comparée).
- G3 : `ECHOUE OK (U1 usage, code 1)` ; G4 : `ECHOUE OK (U1 source, code 1)` ; G5 : `ECHOUE OK (I1 absente, code 1)` ; G6 : `ECHOUE OK (I1 écart, code 1)`. Chaque témoin négatif ne rend que son jeton (sortie lue un à un, 1 problème chacun).
- G7 : verdict rendu, ordre ma-biere, suggerer, comparer :
  ```
  ma-biere · 1 voie(s), 1 usage(s), 5 intensité(s) comparée(s)
  suggerer · 9 voie(s), 9 usage(s), 44 intensité(s) comparée(s)
  comparer · 0 voie(s), 3 usage(s), 0 intensité(s) comparée(s)
  USAGE-INTENSITE ECHEC 1 problème(s)
  VERDICT ECHEC (...)
  ```
  (Essais : le premier triait les routes par ordre alphabétique, le deuxième aussi car `.sort()` triait `only` en place ; corrigé par une copie. L'ordre de la ligne de commande est maintenant gardé, comme G7 le demande. 3 essais pour G7.)
- G8 : NOTE contient ma-biere, suggerer, comparer, hopRole, cransOf. G9 : section « Défauts du parcours » ci-dessous.
- G10 : `CABLAGE OK`.

## Essais utilisés
G1 à G6, G8 à G10 : 1 essai. G7 : 3 (tri des routes, puis tri en place de `only`). Aucun critère n'a épuisé ses 3 essais.

## Défauts du parcours
Un seul échec sur 3 routes, 49 intensités comparées au moteur en direct (5 Ma bière, 44 Suggérer) sans écart, et tous les usages justes.

### D80-U1 source — Ma bière (`ma-biere/etat.html`, ligne a1, Nugget)
- Défaut : `data-source` de l'usage vaut la forme longue de `hopRole`.
- Mesure : `ma-biere · U1 source : beermaverick-nugget data-source « règle : règle rôle-α v1 (prototype, à valider) » : D80 veut « fournisseur » ou « règle »`. L'usage lui-même est juste (`double`, mot « mixte »).
- Ce que l'écran doit changer : `data-source` = `fournisseur` ou `règle` (`/^fournisseur/.test(r.source) ? 'fournisseur' : 'règle'`, comme Suggérer et Comparer). La phrase longue peut rester dans `title`. L'origine est `src/ecrans/fiche/briques.tsx`, composant `Usage` (`data-source={r.source}`) : la Fiche a la même forme, la corriger là corrige Ma bière, et la Fiche au passage.

### Pas un échec, à régler pour la suite
- Comparer rattache l'usage à la colonne par `data-col="<clé>"`, et son `data-houblon` porte le nom affiché (« Cascade »), alors que Ma bière et Suggérer y mettent la clé du moteur. Le contrôle accepte `data-col` ; l'écran devrait aligner `data-houblon` sur la clé (ou ARCHITECTURE.md nommer `data-col`).
- Comparer n'a pas de `data-crans` (barres) : I1 n'y est pas joué, par choix de la maquette.

## Doutes et limites
- I1 est joué sur l'état de départ des pages ; le `jeu.mjs` de chaque écran le rejoue après des gestes, pas ce contrôle.
- La table I1 a deux entrées (ma-biere, suggerer) ; Suggérer est figé sur la visée `floral`. Substituer, Fiche, Dryhopper, Levure ne sont pas jouées (non demandées) ; une route à voies sans entrée échoue par `I1 table` plutôt que de passer.
- Pas de mutation de la vraie page : la preuve que I1 détecte vient des témoins (sa table fait ses calculs sur un moteur à la main, pas sur le vrai). Les 49 comparaisons réelles passent donc parce que les écrans sont justes, avec un moteur dont le contrôle lit les valeurs.
- `node scripts/agents/systeme.mjs appels controle-usage-intensite.mjs --rejouer` rend APPELS ECHEC uniquement pour G7 : `rejouerAppels` lit l'EXPECT comme une sous-chaîne, pas comme une regex `/…/`. Les autres appels (dont un GATES de l'essai-voies et le lot 15) restent tenus. Le contrôle n'est pas en cause.

DÉCISION À PRENDRE : `rejouerAppels` (scripts/agents/systeme.mjs) doit-il lire un EXPECT entouré de `/…/` comme une regex ? Options : oui (3 lignes, `systeme.mjs` est au pilote) ; non, et G7 s'écrit avec une sous-chaîne (`VERDICT`). Recommandation : oui, G7 de c1-rail aura le même souci.

CONNAISSANCE : `window.__parcours.regles.hopRole(clé).source` est une phrase longue (« règle : règle rôle-α v1 (prototype, à valider) ») ; la forme courte D80 (`fournisseur` ou `règle`) se déduit par `/^fournisseur/`. Sur Ma bière, `data-crans` est une position au style ; sur Suggérer, un gain en crans (écart ÷ cran du style).

LEÇON PROPOSÉE : aucune
