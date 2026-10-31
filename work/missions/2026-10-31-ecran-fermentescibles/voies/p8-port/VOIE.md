# Voie p8-port — porter son choix s1 (sur p6-b2) dans l'étape Malts/sucres de l'app

- Mission : 2026-10-31-ecran-fermentescibles
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (port d'un écran choisi, du code avec des choix, L18)
- Plafond : 150 tours ; 3 essais par critère
- Décideur en cas de doute : pilote. La règle est **sa maquette telle quelle** (règle n° 1) : `v7/s1/etat.html`, qui contient tout
  `v6/p6-b2` plus la recherche.

## Ses mots
- p6-b2 : « Oui ça c'est bien » (D220).
- s1 : « C'est très bien avec algo de reconnaissance pour le style et autres comme pour les houblons », puis « Non je parle de ces
  propositions » (D222).
- « Tu peux commencer l'implémentation de la vue Malte sucres choisi, et tu pourras faire les tests sur l'app réel » (D223).

Le registre : `work/refonte-frontend/v4/choix/ecrans-app.json`, écran `fermentescibles`, route `s1` de `v7/`. Il liste cinq contrôles :
masse, moment, recherche, volée, gestes.

## Objectif
L'étape Fermentables de `src/pages/BrewWizard.tsx` (vers la ligne 2440 ; aujourd'hui `IngredientPicker` et `Combobox`) devient s1,
geste par geste, état par état. Tout ce qui suit vient de la maquette :
- **le ticket** : une ligne par ingrédient ; la barre de chaque ligne porte sa masse (la part du grain pour le grain ; pour le sucre,
  le fruit et le lactose, la masse sur la plage de la piste) ; − et + ; la masse se tape ; la part et la couleur sont sur la ligne ;
  « ? » quand la teinte manque ; la croix retire, avec « Annuler » pendant 6 s ;
- **le moment** sans pilule (forme m1, D218), avec son cycle et « Annuler » ; le jour en fermentation (J+3) ;
- **le bandeau** : Grain, OG, IBU, EBC ; le plateau clair toujours visible (D212) ; les repères (rendement, OG et teinte du style) ;
- **le champ d'ajout** : la bascule de famille (Grain ⇄ Sucre ⇄ Fruit) ; « Nom (et kg), Entrée » ; « cara 0,3 » donne la masse ;
  l'ajout se fait à 0, puis le focus va sur la masse ;
- **la recherche s1** :
  - à l'ouverture, sans frappe, des tuiles sur deux colonnes : étoile si l'article est épinglé, pastille de teinte en EBC, « 12,5 kg
    en stock » ou « stock épuisé » ;
  - en tapant, la pertinence prime ; les accents sont ignorés ; une faute est tolérée ;
  - l'alias du nom courant : « Munich » donne Münchner Malz, et le champ l'annonce avant Entrée ;
  - un article déjà dans la recette dit « déjà 5,0 kg » ; Entrée ne crée pas de doublon ;
  - un nom inconnu donne « Créer « … » (stock à zéro) », comme l'app aujourd'hui ;
- **ce que proposent les tuiles de l'ouverture** : `proposerFermentables` de `src/domain/fermentables/proposition.ts` (contrat stable).
  - La voie a1 en écrit la vraie règle (le style, comme pour les houblons) en même temps que toi. Appelle la fonction, n'en recopie
    pas la règle.
  - Les alias viendront de `src/domain/fermentables/noms.ts` (voie a1). S'il n'existe pas encore quand tu en as besoin, prends une
    table locale, que tu remplaceras par l'import à la fin. Note-le.
- **le parcours au clavier** : Tab, Entrée, Échap, ↑ ↓.

Garde les **`data-role` de la maquette** (`ajout`, `resultat` + `data-nom`, `data-deja`, `creer`, `kg-ligne`, `nom`, `[data-sel]`,
`masse-plus`, `masse-moins`, `masse-curseur`…). Lis les cinq contrôles du registre : ils doivent tourner **sur l'app servie**.
- `controle-choix.mjs --url=… --gabarit=…` (#161, `work/refonte-frontend/v4/tournoi/outils/lib/cible.mjs`).
- Si un de ces contrôles ne lit qu'un fichier, étends-le pour qu'il lise aussi une adresse servie, sans toucher à ses critères, et dis-le.

**Rien ne se perd** : liste chaque fonction de l'étape actuelle. Chacune se retrouve dans s1, ou reste ailleurs avec sa raison. La liste
couvre au moins :
- les familles `KIND_DEF` (grain, sucre, fruit, extrait, lactose) et leurs rayons de stock ;
- les usages et leurs moments ;
- le PPG et la couleur ;
- le lien `stockItemRef` ;
- la création d'un article à zéro (`onCreateStockItem`) ;
- `onLearnIngredient` ;
- la recette importée ;
- le hors ligne.

Les nombres viennent du moteur de l'app (OG, EBC, IBU, part), jamais d'un calcul refait dans l'écran.

## Données de test
Une fixture locale, servie par `?dev-local`, avec la recette et le stock de la maquette :
- la recette : Pilsner Malz 5,0 kg, Weizenmalz hell 1,5, Haferflocken 1,5 ;
- le stock : Pale Ale Malz épinglé, à 12,5 kg ; Münchner Malz épuisé ; Carapils, Carahell, Caramünch II…

Les contrôles comptent sur ces valeurs. Lis `v7/s1/commun-p7.mjs` et `cerveau/agents/verification-locale.md`. Jamais de données réelles.

## Possède
- `src/pages/BrewWizard.tsx` : l'étape Fermentables seulement ; ne touche pas Identité ni les autres étapes ;
- `src/pages/recipe-wizard.css` (classes préfixées `fer-`) ;
- de nouveaux composants dans `src/ui/fermentescibles/` ;
- leurs tests dans `tests/unit/fermentescibles/` ;
- la fixture locale (dis où : elle doit rester hors du bundle de production) ;
- les contrôles du registre, seulement pour leur faire lire une adresse servie ;
- `work/missions/2026-10-31-ecran-fermentescibles/voies/p8-port/`.

Interdits :
- `src/domain/fermentables/` (voie a1) ;
- `src/ui/identite/`, `src/ui/finance/`, `src/services/purchaseEntry.ts`, `src/services/stockLineMatching.ts` ;
- `src/ui/SaltSolver.tsx`, `tests/integration/monkey.test.tsx`, `vitest.config.ts` (voie p4) ;
- `ecrans.json`, `ecrans-app.json` ;
- `functions/` ; `functions/.env` (ne pas le lire) ; `source4-portable-bundle-manifest-01.json` ; `.codex/`.

Aucun Gemini. Aucun serveur dans `C:/Users/mrspa/Documents/Brasserie` : les serveurs se lancent dans ce dossier de travail, par
`scripts/with_server.mjs`, sur le port 5615. Aucune installation. Pas de `git stash`, aucun commit. N'écris aucun code par heredoc
ni par `node -e`.

## D'abord
Écris `COMPRIS.md` dans ce dossier, avec ces parties : Objectif, Écrit dans, Fini quand, Ne fait pas, Doutes. Lance G1, puis lis la
maquette et l'étape actuelle.

## Captures (dans `captures/`, ouvertes en image, L12)
Série Chrome à 390 souris, 390 tactile et 1280, l'app et la maquette côte à côte :
- le repos ;
- la barre tirée ;
- le moment ;
- l'ouverture de la recherche ;
- « mu » ; « Munich » ; « pils » ; « Abbey Malt » ; « cara 0,3 » ;
- le sucre ;
- le fruit à J+3 ;
- le retrait annulé ;
- 8 grains.

Un `capturer-malts.mjs` imprime `MALTS OK` quand tout passe, contrôles du registre compris.

## Critères
`GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine.

## Rendre
`RESULTAT.md` :
- ligne 1 : `OK — s1 dans l'app : MALTS OK, CHOIX OK` ou `ECHEC — …` ;
- la liste **Rien ne se perd** ;
- ce qui diffère de la maquette, et pourquoi ;
- les contrôles étendus ;
- la fixture ;
- les captures ouvertes ;
- `LEÇON PROPOSÉE : …` ou `aucune`.

Puis une ligne au pilote.
