OK — export texte concis : 51 lignes lisibles et un seul bloc de réimport ; aller-retour intact, tests et build verts.

Plainte D184 : « Ah oui il y a beaucoup trop d'info extrait?? Wtf ». Portée : l'export texte de recette (bouton « Copier la recette en texte » / « Texte complet et fichier .txt »). Rien sous `src/ui/hopIndex/` ni `src/domain/hopIndex/`.

## Ce qui a changé

L'export est maintenant en deux parties (format `v3`) :
1. **Texte lisible** : nom, style, volume, matériel en une ligne, OG/FG/ABV/IBU, malts, houblons (moment, durée, masse, α, IBU), levure (nom, laboratoire, dose, puis atténuation, température de fermentation, floculation, chacune une fois, en plage fusionnée des sources, sans fournisseur ni URL), ajouts, paliers, fermentation, eau, notes. Aucun JSON, aucune URL.
2. **Un seul bloc final**, séparé par `— Données de réimport (ne pas modifier) —` : une ligne de JSON minifié, puis `FIN DE RECETTE`. C'est ce que l'import lit.

Dans le bloc, pas de doublon :
- plus d'`estimates` (estimations, intention de copie) : l'import ne les relisait pas déjà ;
- le scénario de levure gardait une copie complète de la levure (faits, fiche documentaire, plan d'ensemencement), des paliers, de la fermentation, des fermentescibles et des houblons (`applied`). Quand une copie est identique à la recette, elle n'est plus écrite : `applied.same` la nomme, la lecture la restitue. C'était la source des faits de levure « répétés trois fois ».

## L'ancien plan de houblons (point 3)

Il sert à l'import : `yeastRecipeDesignChanged` (`src/domain/yeastRecipeDesign.ts`, ligne 801) compare `applied.hops` à la liste réelle pour avertir « Scénario de levure ancien ». Donc :
- **dans le texte lisible, il n'apparaît jamais** (le test compte Magnum et Lotus une seule fois) ;
- **dans le bloc, il reste seulement s'il diffère** de la liste réelle, pour que l'avertissement survive à l'aller-retour (test « garde l'ancien plan de houblons pour l'import seul »). S'il est identique, il n'est pas écrit.

## Fichiers écrits

- `src/domain/recipeTransfer.ts` : `recipeReimportLines`, `readReimportBlock`, en-tête `v3` ; `readRecipeText` lit v1, v2 et v3 ; `writeRecipeText` (format complet v1/v2) inchangé, les tests d'aller-retour le gardent.
- `src/domain/recipeText.ts` : `recipeToText` avec `recipe` écrit v3 ; texte lisible tiré des champs enregistrés (jamais de la « projection » de l'assistant, sauf OG/FG/IBU/eau) ; levure fondue ; durée du dry hop ; eau condensée (alcalinité avant acide, empâtage et rinçage après acide, ratio SO₄/Cl : une seule fois, seulement s'ils diffèrent) ; « T° inconnue » / « durée inconnue » au lieu de « undefined j » ; l'inconnu n'est jamais 0.
- `tests/unit/recipeExportConcis.test.ts` (neuf, 7 tests, fixture « neipa v3 » avec 3 fournisseurs de levure et un ancien plan de houblons).
- `tests/integration/brewWizardFirstSaveSourceContract.test.tsx` : 3 assertions sur des libellés v1 (`FG cible : null`, `Référence de source : ""`) lisent maintenant le bloc (`"fgTarget":null`, `"sourceId":""`) et `readRecipeText`.
- Dossier de la voie : `parcours-export-concis.mjs`, `export-avant.txt`, `export-apres.txt`, `export-chrome-1.txt`, `export-chrome-2-apres-import.txt`, `img/02-export-texte.png`, `img/03-import-lu.png`, `img/05-reexport-apres-import.png`.

## Choix de N = 70 lignes

Mesuré : 51 lignes de texte lisible sur la fixture neipa v3 (37 sur la fixture Chrome, Stout). Chaque titre de section coûte 3 lignes (blanc, titre, soulignement). 70 laisse 35 % de marge à une recette plus fournie, et refuse un retour des blocs : le format complet v1 de la même fixture fait 148 lignes, plus de 400 avec les trois fournisseurs du brasseur.

## Critères

1. **Vitest** sur les 7 fichiers cités + `recipeExportConcis.test.ts` : verts. Rejeu large sur les 43 fichiers de test qui touchent `recipeTransfer`, `recipeText`, `recipeImport`, `RecipeImportSheet`, « Copier la recette » : `Test Files 43 passed, Tests 508 passed`.
2. **Le test neuf échoue sur HEAD** : lancé avant tout code, `6 failed | 1 passed (7)` ; le premier test (ni `{`, ni `http`, ni fait répété, < N lignes) échoue sur HEAD. Le septième test passé sur HEAD est « garde l'ancien plan pour l'import seul », vrai aussi pour HEAD.
3. **`npm run build`** : `✓ built in 22.20s`, code 0.
4. **Parcours Chrome** (`scripts/with_server.mjs`, port 5263, fixture `?dev-local&etape=houblons`, Gemini coupé), 2 passages, dernier : `OK tous les contrôles du parcours`, code 0. Export → import (« Lue localement », aucun avertissement) → ré-export : `écarts export 1 / export 2 : aucun`, houblons identiques. Captures ouvertes : 02 (le texte lisible commence par `L'AFFINÉE — RECETTE v3`, `Stout export — 16D`…) et 03 (import lu : Nugget 46 g, ébullition 60 min, 13 %, eau réseau, OG 1,066 relu du bloc).
   Le script de v1 lisait l'ancien format (`Masse (g) : 46`) : il échouerait sur le nouveau texte, d'où une copie adaptée dans mon dossier. Mêmes étapes, même fixture, même comparaison du ré-export, deux contrôles de plus (ni accolade ni URL avant le bloc ; un seul bloc).

Essais : 1 par critère, sauf le test de longueur (arbitraire « 60 % de v1 » remplacé par « présent au moins deux fois dans v1, une seule fois dans v3 » et « moins de la moitié des lignes de v1 »).

## Avant / après (fixture « neipa v3 », texte exact : `export-avant.txt`, `export-apres.txt`)

AVANT (HEAD, 148 lignes, 7 967 caractères sur la fixture ; extrait, lignes longues coupées à 150 caractères) :

```
L’AFFINÉE — RECETTE v1

Nom : "neipa v3"
Style : "NEIPA"
Scénario de levure versionné : {"modelVersion":"yeast-recipe-2","yeastId":"wyeast-3068","styleId":"hazy-ipa","goal":"clove",…,"applied":{"yeast":{…faits de levure…},"hops":[{"name":"Magnum",…}],…}}
Volume fermenteur (L) : 20
Date de brassage : "2026-09-08"
OG cible : 1.064
…
Houblons :
  -
    Nom : "Magnum"
    Masse (g) : 10
    Alpha (%) : 12
    Moment : "boil"
    Durée (min) : 60
  - … (une dizaine de lignes par houblon)
Levure :
  Nom : "Wyeast 3068"
  Souche de référence : "wyeast-3068"
  Laboratoire : "Wyeast"
  Faits de levure sourcés : [{"key":"attenuation","reported":"Atténuation apparente 74–80 %","origin":"manufacturer",…,"source":"Lallemand","sourceUrl":"https://www.lallemandbrewing.com/fr/verdant-ipa",…}, … 9 faits]
  Forme : "liquide"
…
Estimations au moment de la copie :
  Intention levure à la copie : "Hazy · NEIPA · objectif Girofle …"
  OG estimée : 1.064
  …
FIN DE RECETTE
```

APRÈS (53 lignes, 6 126 caractères ; lignes longues coupées à 150 caractères ; le bloc fait 4 314 caractères sur une ligne) :

```
L’AFFINÉE — RECETTE v3
neipa v3 — NEIPA
20 L en fermenteur · ébullition 60 min · 26.10.2026
Matériel : Cuve 30 L · 20 L visés · rendement 72 %
OG 1.064 · FG 1.014 · ABV 6.6 % · IBU 38 · EBC 8 · rendement 72 %

FERMENTESCIBLES — 5,4 KG
────────────────────────
  3,6 kg    Pilsner  (67 % · 3.5 EBC · empatage)
  1 kg      Flocons d’avoine  (19 % · 2 EBC · empatage)
  800 g     Froment  (15 % · 4 EBC · empatage)
  300 g     Lactose  (ebullition · 0 % fermentescible · lactose)

HOUBLONS
────────
  Ébullition :
    10 g    Magnum  (60 min · 12 % AA)
    25 g    Lotus  (40 min · 14 % AA)
  Whirlpool :
    60 g    Citra  (20 min à 80 °C · 12.5 % AA)
  Houblonnage à cru :
    80 g    Mosaic  (J+3 · 48 h · 11 % AA)
    60 g    Citra  (J+6 · 12.5 % AA)

LEVURE
──────
  Wyeast 3068 — 125 mL (liquide)
  fermentation 17–23 °C · atténuation 74–82 % · floculation faible
  Intention levure à la copie : Hazy · NEIPA · objectif Girofle · épices · pression de fermentation 0 bar. Scénario ancien : réglages modifiés depuis son adoptio…
  Carbonatation : 2.35 vol

AUTRES AJOUTS
─────────────
  Whirlfloc — 0.5 pastille · Ébullition · Écraser Ajouter à T−10.

EMPÂTAGE
────────
  66 °C     60 min — Saccharification
  76 °C     10 min — Mash-out

FERMENTATION
────────────
  19 °C     8 j — Primaire
  4 °C      7 j — Garde

NOTES
─────
  Note : houblons frais
  Deux lignes
    - avec indentation

— Données de réimport (ne pas modifier) —
{"format":3,"name":"neipa v3","style":"NEIPA","yeastDesign":{"modelVersion":"yeast-recipe-2","yeastId":"wyeast-3068","styleId":"hazy-ipa","goal":"clove","goalExplicit":tr…
FIN DE RECETTE
```

La fixture est petite : sur la recette du brasseur (trois pages sources par fournisseur, fiche documentaire adoptée, plan d'ensemencement), l'écart est plus grand, puisque les faits sont maintenant écrits une fois dans le bloc et jamais dans le texte lisible.

## Doutes et limites

- Le bloc contient encore les faits de levure sourcés une fois, avec leurs URL et dates : c'est la provenance de la fiche adoptée, l'import ne sait pas la retrouver. Il est sur une seule ligne, après le texte lisible. Je n'ai pas vérifié sur la recette réelle « neipa v3 » du brasseur (donnée réelle : interdite) ; la fixture reproduit sa forme (3 fournisseurs, scénario avec ancien plan de houblons).
- Le texte lisible n'est pas relu par l'import : modifier le texte lisible ne change rien à la recette importée, seul le bloc compte. Le marqueur le dit (« ne pas modifier »). Un export v3 dont le bloc est tronqué ou altéré est refusé (erreur claire), pas lu comme texte libre.
- Les anciens exports v1 et v2 (déjà collés ou enregistrés) se relisent toujours.
- Deux scripts Chrome anciens lisent encore le format v1 et échoueraient : `scripts/check-yeast-refonte-ui.mjs` (ligne 3014) et `scripts/check-yeast-workflow-ui.mjs` (ligne 101, `copied.startsWith('L’AFFINÉE — RECETTE v1')` et `Contact aromatique (h) : 48`). Je ne les ai pas rejoués ni modifiés (hors périmètre, longs).
- Le texte lisible garde l'« Intention levure à la copie » (une seule fois) parce que `yeastTransferFlow.test.ts` l'exige ; c'est la ligne la plus longue du texte.
- `FG`/`OG` lus sur la ligne des cibles sont les estimations de l'assistant ; les cibles enregistrées (qui peuvent être nulles) vivent dans le bloc. Un brasseur qui lit « FG 1.009 » lit donc l'estimation, pas la cible enregistrée (comportement inchangé, la recette enregistrée n'est pas modifiée).
- Lecture d'un bloc v3 : un scénario dont une copie `applied` est omise la retrouve dans la recette lue ; une incohérence (clé inconnue, copie sans source) lève « Données de réimport incohérentes ».

DÉCISION À PRENDRE : l'ancien plan de houblons (quand il diffère de la liste réelle) reste dans le bloc de réimport pour garder l'avertissement « Scénario de levure ancien » à l'import. Options : (a) le garder dans le bloc (fait) ; (b) ne jamais l'écrire : l'export est plus court et ne contredit plus la liste, mais un scénario dont seuls les houblons ont changé n'est plus signalé « ancien » après réimport. Recommandation : (a), car le texte lisible, seul lu par le brasseur, ne le montre plus.

CONNAISSANCE : l'export texte de recette est en deux parties depuis le 26.10 (format v3) : un texte lisible tiré des champs enregistrés, et un seul bloc JSON minifié de réimport (`recipeReimportLines` dans `src/domain/recipeTransfer.ts`) où les copies `applied` du scénario de levure identiques à la recette ne sont pas répétées. `writeRecipeText` (v1/v2) reste le format complet pour la sauvegarde et les tests.
LEÇON PROPOSÉE : aucune
