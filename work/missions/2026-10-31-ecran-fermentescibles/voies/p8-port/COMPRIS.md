# COMPRIS — voie p8-port

## Objectif
Porter son choix s1 (D222, sur p6-b2, D220) dans l'étape Fermentables de l'app, `v7/s1/etat.html` pour modèle, geste par geste et état par
état : le ticket (barre qui porte la masse, − et +, masse tapée, part et teinte, « ? », croix et « Annuler » 6 s), le moment sans pilule (m1,
cycle, « Annuler », J+3), le bandeau et les repères (rendement, OG et teinte du style), le champ d'ajout (bascule de famille, « Nom (et kg),
Entrée », « cara 0,3 », ajout à 0 puis focus sur la masse) et la recherche s1 (tuiles à l'ouverture, pertinence, accents, faute, alias
« Munich », « déjà 5,0 kg », « Créer … (stock à zéro) »). Les tuiles de l'ouverture viennent de `proposerFermentables` (voie a1, importée, jamais
recopiée). Les nombres (OG, EBC, IBU, part) viennent du moteur de l'app. Les `data-role` de la maquette sont gardés. Les cinq contrôles du
registre (masse, moment, recherche, volée, gestes) tournent sur l'app servie.
La règle est la règle n° 1 : sa maquette telle quelle. Ce qui n'y est pas (fiche technique PPG et assistant, famille extrait, raccord au
stock) est listé dans « Rien ne se perd », avec l'endroit où cela reste.

## Écrit dans
- `src/pages/BrewWizard.tsx` (l'étape Fermentables seulement, plus l'accroche du banc local)
- `src/pages/recipe-wizard.css` (classes préfixées fer-)
- src/ui/fermentescibles/ (composants, modèle de la recherche, fixture apercuDev.ts chargée en développement seulement)
- tests/unit/fermentescibles/
- les cinq contrôles du registre, pour leur faire lire une adresse servie : controle-masse-ligne.mjs, controle-moment-ligne.mjs et controle-recherche.mjs (dossier de la mission), controle-volee.mjs et controle-gestes-ligne.mjs (dossier tournoi/outils)
- le dossier de la voie : COMPRIS.md, RESULTAT.md, capturer-malts.mjs, captures/

## Fini quand
G1 à G8 de GATES.md rendent leur jeton : `COMPRIS OK`, `built in`, `TYPES OK`, `TESTS MALTS OK`, `INPUT PROTECTION AUDIT PASSED`,
`REGISTRE OK`, `MALTS OK` (la série Chrome sur l'app servie à 390 souris, 390 tactile et 1280, l'app et la maquette côte à côte, chaque
capture ouverte en image, les cinq contrôles du registre joués sur l'adresse servie), `NOTE OK` sur RESULTAT.md. RESULTAT.md porte la liste
« Rien ne se perd » (KIND_DEF, usages et moments, PPG et couleur, `stockItemRef`, `onCreateStockItem`, `onLearnIngredient`, recette importée,
hors ligne), l'appel de `proposerFermentables`, ce qui diffère de la maquette, la fixture, les contrôles étendus.

## Ne fait pas
Ne touche ni `src/domain/fermentables/` (voie a1, lecture et import seuls), ni Identité et les autres étapes de `BrewWizard.tsx`, ni
`src/ui/identite/`, `src/ui/finance/`, `purchaseEntry.ts`, `stockLineMatching.ts`, `SaltSolver.tsx`, `monkey.test.tsx`, `vitest.config.ts`,
`ecrans.json`, `ecrans-app.json`, `functions/` (ni `functions/.env`), le manifeste, `.codex/`. Aucun Gemini, aucun serveur dans
`Documents/Brasserie` (port 5615, dossier de travail), aucune installation, pas de stash, aucun commit. Aucune donnée réelle : la fixture est
simulée et marquée. Aucun calcul d'OG, d'EBC ou d'IBU refait dans l'écran. Pas de `type="number"`.

## Doutes
- `App.tsx` n'est pas dans mon périmètre : le banc local s'ouvre par `?dev-local&etape=houblons&recette=vide`, puis un crochet de développement dans
  l'étape (derrière `import.meta.env.DEV`, `?dev-local` et `malts=maquette`) pose la fixture et passe à l'étape Fermentables.
- Les contrôles de la maquette lisent `file://…/etat.html#état` : je les étends à une adresse servie (`lib/cible.mjs`) sans toucher à leurs critères ;
  l'état (`#sucre`, `#fruit`, `#huit`…) se lit dans le hash par le crochet de développement.
- `GESTES ECHEC 2` signalé au pilote par la voie p7 : le contrôle des gestes attend qu'Entrée sur « Munich » crée une ligne « Munich », le défaut
  que R2 interdit ; si je le retrouve sur l'app, je le dis sans changer ses critères.
- La fiche technique (PPG, assistant IA) n'a pas de place dans la maquette : je la garde repliée sous le plateau et je le signale (décision à prendre).
- `proposition.ts` compare `stockItemRef` à `article.id` alors que l'app lie par `ref` : j'appelle la fonction telle quelle ; le nom sert de repli.
