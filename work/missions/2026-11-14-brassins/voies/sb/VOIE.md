# Voie sb — Port de la feuille « Brasser » d1b, avec « Créer un brassin » c2a

- Mission : 2026-11-14-brassins · Agent : auteur · Modèle : sonnet · Niveau : code · Plafond : 60 tours · Dépend de : s1 · Décideur : pilote

## Objectif
Ses choix (15.11, SPEC) : « Créer : c2a · Recettes : r2a — Mais bien revoir cette écran notamment pour la sélection de date », puis « Feuille Brasser : d1b ».
Règle n° 1 : « C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. » Porter 1:1 dans l'app, en plancher à enrichir (L07) :
1. **d1b, la feuille « Brasser »**
   - Elle remplace la feuille « Préparer un brassin » (QuickActionModal, action `brew-batch`) quand on brasse une recette connue, depuis le carnet r2a (`src/ui/production/recettes/CarnetRecettes.tsx`, `onBrew`) ou depuis c2a.
   - Contenu, dans l'ordre :
     - l'en-tête « Brasser <recette> · v<n> » ;
     - la ligne volume · cuve ;
     - le stock replié « Tout est en stock · … ⌄ », ou le manque ;
     - le damier de trois semaines : chaque jour dit l'état de la cuve (pleine, libre) et ce qui se passe à la cave (dry hop, mise en bouteille, garde), avec une légende ;
     - le jour choisi, redit avec sa raison ;
     - le pied « Annuler » et « Planifier <jour> ».
   - Tous les états de la maquette :
     - repos ;
     - geste : un jour touché ;
     - loin : un jour au-delà de la semaine, sans autre écran ;
     - conflit : jour où la cuve est pleine ou où tombe le dry hop ; il est dit, et aucun choix n'est fait en silence.
2. **c2a, « Créer un brassin »**
   - L'entrée « Nouveau brassin » (bouton + de l'onglet Brassins, `fabActions.ts` / QuickActionModal) ouvre la liste c2a des recettes :
     - titre « n prêtes / n à compléter », tri « Prêtes d'abord » ;
     - une carte par recette : deux chiffres, levure · dernier lot, pastille à trois traits et un mot ;
     - son vide : trois entrées en icône.
   - Sur une carte, « Brasser » ouvre la feuille d1b. Lecture du pilote : le dernier choix, d1b, règle la date ; c2a créait « date à définir » sans rien demander.
   - Un brassin déjà prévu porte « Brasser LOT-xxx » et ouvre ce brassin.
3. **Après « Planifier »**
   - Le brassin est créé au jour choisi, par le chemin de création actuel, sans champ neuf.
   - On montre l'état « après » de c2a : la liste des brassins e6a avec le lot neuf en tête, et ses effets en rangées, chacun avec ↶, dans la mesure où le modèle les porte (réservation, achats).
   - « Défaire » annule la création par le chemin existant : la suppression du brassin créé, que l'app sait faire.
   - Un effet que le modèle ne porte pas est dit en ACCORD, jamais inventé.
4. **Garder ce qui marche** : une recette inconnue, ou « Nouvelle recette », ouvre toujours l'assistant actuel.

## Entrées
- **Maquettes :**
  - `voies/d1/d1b/` : etat.html, NOTE.md, PNG repos, geste, loin, conflit et cave ; corrigées en gd1 (`voies/gd1/RESULTAT.md`) ;
  - `voies/c2/c2a/` : etat.html, NOTE.md, PNG repos, geste, après, vide, 1280 et cave ;
  - `voies/d1/RESULTAT.md` : lecture de la demande, données réelles et fictives.
- **Le port r2a déjà fait :** `voies/s1/RESULTAT.md` (modèle `recettesModel.ts`, ACCORD 1 à 6, banc `voies/s1/banc.mjs` et ses fixtures ZZ).
- **Ports déjà faits, à réutiliser sans les refaire :**
  - `src/ui/production/fermentation/cuve.ts` : occupation des cuves, de gfc ;
  - `src/ui/production/liste/` : e6a ;
  - `src/ui/production/fiche/` : e1a ;
  - `src/ui/production/volumes/phrase.ts`.
- **Code :** `src/components/QuickActionModal.tsx`, `src/App.tsx` (`onRebrewRecipe`, `brewRecipeId`), `src/domain/fabActions.ts`, `src/components/tabs/ProductionTab.tsx`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/production/brasser/` et `src/ui/production/creer/` (neufs).
- `src/components/QuickActionModal.tsx`, `src/domain/fabActions.ts`, `src/components/tabs/ProductionTab.tsx`.
- `src/App.tsx` et `src/ui/production/recettes/` : câblage seulement (`onBrew` pour le carnet).
- `tests/unit/port-sb-*`, et les tests d'intégration existants qu'il faut adapter : leur intention est gardée, la maquette gagne.
- `work/missions/2026-11-14-brassins/voies/sb/`.

## Consignes
- **Inventaire d'abord.** Avant le code, écris `INVENTAIRE.md` : pour d1b et c2a, chaque élément et chaque geste de chaque état, marqué existe / à créer / à retirer, avec la source de donnée de chaque chiffre.
- **Données.**
  - L'occupation d'une cuve se calcule depuis les brassins : `equipmentRefs.fermenter`, statut, dates, plan de fermentation (`cuve.ts`).
  - Une date que le modèle n'a pas, comme une mise en bouteille non datée, se dit en mots (« F3 libre quand la Pils est en bouteille ») ; jamais inventée (L14).
  - **Aucun champ Firestore neuf** : un besoin de donnée devient un ACCORD dans RESULTAT.md.
- **Saisie et affichage.** Jamais `type="number"` ; cibles ≥ 44 px ; deux thèmes ; 390 tactile et 1280 ; identité de l'app (jetons, `IdTrousse`).
- **Tests** `tests/unit/port-sb-*.test.tsx` :
  - jours libres et pleins, depuis des brassins fixtures ;
  - conflit du dry hop ;
  - date au-delà de la semaine ;
  - « Planifier » appelle la création avec la date choisie ;
  - « Défaire » ;
  - tri « Prêtes d'abord » de c2a, et la pastille ;
  - le vide.
  Rejoue aussi les tests existants des fichiers touchés : `grep -rl` des noms de composant dans `tests/`.
- **Banc.**
  1. Copie `voies/s1/banc.mjs` en `voies/sb/banc.mjs`, avec les fixtures ZZ ; ajoute les brassins qui occupent F1, F2 et F3, et un dry hop daté.
  2. Serveur : `node scripts/with_server.mjs --server "npm run dev -- --port 3122 --strictPort" --port 3122 -- node work/missions/2026-11-14-brassins/voies/sb/banc.mjs`.
  3. Captures dans `voies/sb/captures/` :
     - `d1b-repos-app-390-clair.png`, `d1b-geste-app-390-clair.png`, `d1b-loin-app-390-clair.png`, `d1b-conflit-app-390-clair.png` ;
     - `d1b-repos-app-390-cave.png`, `d1b-repos-app-1280-clair.png` ;
     - `c2a-repos-app-390-clair.png`, `c2a-geste-app-390-clair.png`, `c2a-apres-app-390-clair.png`, `c2a-vide-app-390-clair.png` ;
     - `c2a-repos-app-1280-clair.png`.
  4. Ouvre chaque capture à côté de la maquette du même état, fais la liste numérotée des écarts, corrige.
- **Contexte.** Vers 150 k, arrête-toi : réécris RESULTAT.md avec « REPRISE : … » en ligne 1, puis ce qui est fait et ce qui reste, dans l'ordre.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Saisie au curseur ; l'inconnu dit en mots, jamais 0 ; chiffres à la virgule ; cibles ≥ 44 px ; deux thèmes ; 390 et 1280 ; identité de l'app. Gemini jamais réel. Fable interdit.
- Ce que la maquette n'a pas, le port le retire ; ce que le modèle n'a pas, le port le dit (ACCORD) sans l'inventer.

## Critères
`work/missions/2026-11-14-brassins/voies/sb/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil ; ligne 1 `OK — …`, `ECHEC — …` ou `REPRISE : …`.
- La ligne « Tests » : `npx vitest run port-sb --reporter=dot > work/missions/2026-11-14-brassins/voies/sb/tests.txt`.
- Voie d'écran : les captures, toutes ouvertes.

Réponse finale au pilote : une ligne.
