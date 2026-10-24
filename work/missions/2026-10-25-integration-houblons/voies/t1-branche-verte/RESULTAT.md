OK — Houblon inconnu rend une fiche vide (plus d'exception) ; tests du prototype dans npm test ; parcours joué

## Fichiers écrits
- `prototypes/houblons-v4/parcours/src/moteur/index.ts` : `houblon()` rend, pour une clé hors des fiches, une fiche vide `connu: false` (α null, rôle sans mot, familles « non décrit » 0/0, stock null, partSansFamille null, origine null) au lieu de lever ; `connu: true` pour les autres. `lireBiere` n'a eu besoin d'aucun autre changement : `versSimule` marquait déjà l'ajout « non simulé » (raison « houblon absent des fiches du moteur : arôme non simulé »), seul `houblon(a.hopKey)` ligne 184 levait.
- `prototypes/houblons-v4/tests/houblon-inconnu.test.ts` : 4 tests neufs.
- `vitest.config.ts` : `include` gagne `prototypes/houblons-v4/tests/**/*.test.{ts,tsx}`. Aucun alias requis (les tests n'importent que des chemins relatifs ; `@app/` ne sert qu'aux écrans). Gemini jamais appelé.
- Captures : `parcours-*` de ce dossier.

## Témoin
Test écrit avant tout correctif, lancé sur HEAD (`cd prototypes/houblons-v4 && npx vitest run tests/houblon-inconnu.test.ts`) :

```
× un ajout « inconnu:hallertau » : la bière se lit, l'ajout est non simulé, aucune exception
   → Houblon inconnu du moteur : inconnu:hallertau
× une recette dont tous les houblons sont inconnus : chaque famille est lue, jamais un 0 inventé
   → Houblon inconnu du moteur : inconnu:houblon-maison
× houblon("inconnu:…") rend une fiche vide qui se dit inconnue
   → Houblon inconnu du moteur : inconnu:hallertau
× un houblon connu reste connu   → expected undefined to be true (champ `connu` absent)
Tests 4 failed (4)
```
Même exception que les 2 rouges de `conversion-recette.test.ts` (index.ts:214, via lireBiere ligne 184). Après correction : 
`npx vitest run prototypes/houblons-v4/tests` depuis la racine : 11 fichiers, 131/131 verts (dont les 2 anciens rouges de `conversion-recette.test.ts`). `tsc --noEmit -p parcours/tsconfig.json` : propre.

## Parcours wizard
App locale (`vite`, port 3417, `?dev-local`, profil Chrome neuf, aucune donnée réelle, rien écrit hors localStorage du profil de test), mobile 420×900. Capture ouverte en image à chaque étape.

**Constat n° 1 (structure) : le chemin « wizard → route hopV55 → retour » n'existe pas dans le code.** L'étape Houblons du wizard héberge l'atelier V5.5 *en ligne* (`HopV55RecipeStep`, `BrewWizard.tsx` ~2705) ; la route plein écran `hopV55` n'est ouverte que depuis l'onglet Brassins (« Atelier Houblons V5.5 »), l'onglet Stocks, `RecipePage` et `BrewDayPage` (`App.tsx` 796, 815, 948, 961) ; le `BrewWizard` ne reçoit aucun `onOpenHopV55`. Le parcours joué est donc le plus proche réel : wizard (brouillon avec un ajout) → sortie → atelier V5.5 → retour → réouverture du wizard.

Étapes jouées :
1. Créer une recette → étape 3 « Houblons » → ajout « Hallertauer Mittelfrüh », 30 g, ébullition : `work/missions/2026-10-25-integration-houblons/voies/t1-branche-verte/parcours-01-wizard-avant.png` (« Brouillon conservé sur cet appareil » ; le brouillon `laffinee_recipe_draft_v1:dev-local:new` contient `Hallertauer Mittelfrüh / 30 g / boil`).
2. Sortie du wizard (flèche d'en-tête = `route.close`), onglet Brassins, « Atelier Houblons V5.5 » : `work/missions/2026-10-25-integration-houblons/voies/t1-branche-verte/parcours-03-atelier-hopV55.png` (« Explorer sans recette » : l'atelier ne reçoit pas le brouillon).
3. Retour de l'atelier (flèche) : `work/missions/2026-10-25-integration-houblons/voies/t1-branche-verte/parcours-04-retour-hopV55.png` : on retombe sur Brassins (route `tabs`), le brouillon est toujours en localStorage, identique.
4. Créer une recette de nouveau : `work/missions/2026-10-25-integration-houblons/voies/t1-branche-verte/parcours-05-wizard-rouvert.png` : **étape 3/7 « Houblons » retrouvée, « Brouillon repris sur cet appareil », ajout Hallertauer Mittelfrüh 30 g intact, `DraftFreshnessChoice` absent**, aucune erreur de page ni de console.

**Constat n° 2 (portée) : `DraftFreshnessChoice` ne surgit pas pour une recette neuve.** `recipeDraftResumeCheck` rend `resume` quand il n'y a pas de recette enregistrée (`recipeDraft.ts:539`). Il surgirait pour l'édition d'une recette enregistrée dont le `serverBase` du brouillon est absent (`unverified`) ou différent (`changed`). Ce cas n'a pas été joué : dev-local n'a aucune recette (« Le carnet attend ta première recette »), en créer une serait une écriture. À couvrir dans la voie d'intégration (fixture avec une recette sauvée, ou test unitaire de `recipeDraftResumeCheck`).

**Constat n° 3 (pour la suite) : si l'outil s'ouvre par-dessus le wizard**, `useFullScreenRoute` garde `returnFromHopV55` (la route `wizard` en cours) et le wizard se démonte puis se remonte au retour : l'état vit dans le brouillon localStorage, qui survit (étapes 2 à 4) ; l'état en mémoire non écrit (ex. la saisie en cours, la section ouverte) est perdu, et `wizardSeed` d'`App` est conservé.

## Critères
- G1 : `node .../verifier.mjs` → BRANCHE OK (131/131 verts). G2 : `npm run build` → `✓ built in 18.92s`, code 0.

## Essais, doutes et limites
- Essais : 1 par critère. Ré-essais de script Chrome seulement (sélecteurs).
- `houblon()` d'un inconnu : le nom affiché est celui de la clé pliée par la conversion (`inconnu:hallertau-mittelfruh` → « Hallertau Mittelfruh », sans accents) ; le nom d'origine de la recette n'est pas transporté par la clé. Dans le parcours joué, le houblon était connu du catalogue de l'app (sélection de la liste) : le cas `inconnu:` lui-même n'est donc prouvé que par les tests, pas dans Chrome ; un affichage Chrome d'un inconnu viendra avec l'écran porté.
- `houblonInconnu` est mémoïsé par `memo` comme les autres fiches ; les écrans qui lisent `h.familles`, `h.alpha`, `h.role.mot` gèrent déjà `null` / « non décrit » (non rejoué sur chaque écran : Carte.tsx, Frise.tsx, Dryhopper, Substituer appellent `houblon(a.hopKey).nom`).
- Fichiers de la voie : le serveur Vite de test (port 3417) a été arrêté ; scripts Chrome dans le dossier temporaire.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : le wizard héberge l'atelier V5.5 en ligne (étape 3) ; la route `hopV55` n'est jamais ouverte depuis le wizard, donc « wizard → hopV55 → retour » est à construire, pas à réparer ; `DraftFreshnessChoice` ne concerne que l'édition d'une recette enregistrée (`recipeDraftResumeCheck`).
LEÇON PROPOSÉE : aucune
