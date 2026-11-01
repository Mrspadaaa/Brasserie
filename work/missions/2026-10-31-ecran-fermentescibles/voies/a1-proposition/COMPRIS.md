# COMPRIS — voie a1-proposition

## Objectif
D222 : les tuiles que le champ d'ajout de Malts/sucres propose à l'ouverture (avant toute frappe) sont choisies selon le style visé,
« avec algo de reconnaissance pour le style et autres comme pour les houblons ». Je remplis `proposerFermentables` sans changer sa
signature. Trois pièces :
- la donnée : la part des recettes de chaque style qui contiennent ce fermentescible (Beer Analytics, graphique
  `typical-styles-relative` de chaque page `/fermentables/<catégorie>/<nom>/`, CC BY-SA 4.0), collectée poliment (une requête à la fois,
  une pause), relevés bruts dans src/data/fermentableSources/, table dérivée dans `src/data/fermentables/typicite-styles.json` ;
- les noms : une table courte stock (allemand, malterie) → Beer Analytics, et les alias de la frappe de D220, dans `src/domain/fermentables/noms.ts` ;
- la règle : un classement lexicographique (déjà dans la recette écarté ; typicité connue puis inconnue, jamais 0 ; teinte vs `ebcVise` ;
  disponible avant épuisé ; épinglé ; nom), avec `PROPOSITION_RULE` écrite.
La portée est l'ouverture seule : la forme de la tuile ne change pas, et en tapant la pertinence de la frappe prime (D221).

## Écrit dans
- `src/domain/fermentables/proposition.ts`, `src/domain/fermentables/noms.ts` (et un module d'accès à la table si besoin, même dossier)
- `src/data/fermentables/typicite-styles.json`
- le dossier src/data/fermentableSources/ du Possède (relevés bruts Beer Analytics, sans accents graves : le contrôle ne lit que le premier chemin d'une puce)
- `scripts/collecte-malt/typicite-malts.mjs`
- `tests/unit/fermentables/`
- `work/missions/2026-10-31-ecran-fermentescibles/voies/a1-proposition/COMPRIS.md` et `RESULTAT.md`
Le cache HTTP brut du script va dans le dossier temporaire du système, hors dépôt.

## Fini quand
G1 à G6 de GATES.md rendent leur jeton : `COMPRIS OK`, `TESTS PROPOSITION OK`, `TYPICITE MALTS OK`, `TYPES OK`, `NOTE OK` sur
proposition.ts (`export function proposerFermentables`, `export const PROPOSITION_RULE`, `EntreeProposition`, `typicit`), `NOTE OK` sur
RESULTAT.md (`TEMOIN AVANT`, `German Pils`, `Stout`, `CC BY-SA`, `inconnu`). Les témoins (German Pils : Pilsner Malz avant Caramünch II ;
stout : torréfié avant Carapils ; sans donnée après avec donnée et jamais écarté ; épuisé après disponible ; « Munich » → Münchner Malz,
inconnu → `null`) ont été écrits rouges contre la règle provisoire avant le code (L13), la sortie rouge est dans RESULTAT.md.

## Ne fait pas
Ne touche ni `src/pages/BrewWizard.tsx`, ni `src/ui/`, ni `src/domain/hopIndex/` (lecture seule), ni `functions/`, ni le manifeste, ni
`.codex/`. Aucun Gemini, aucun serveur dans `Documents/Brasserie`, aucune installation, pas de stash, pas de commit. Pas d'autre site que
Beer Analytics. Ne change pas la forme de la tuile ni le classement en tapant. Aucune valeur inventée : une donnée absente est inconnue,
jamais 0.

## Doutes
- Le site ne publie que les 16 styles où un fermentescible pèse le plus : un style absent n'est pas 0 mais « au plus la plus petite part
  publiée » (`p16`). Je garde l'absent inconnu, avec sa borne, comme pour les houblons.
- Les noms du stock sont allemands ou de malterie : la table de correspondance est écrite à la main et testée ; un nom hors table reste inconnu.
- Les codes BJCP 2021 de l'app sont à rattacher aux noms de styles de Beer Analytics ; ceux qui n'ont pas d'équivalent (sous-styles
  « Specialty IPA: … ») restent sans donnée.
- Où vont les épinglés : je propose la typicité d'abord, l'épinglé départage (réversible), ma raison sera dans RESULTAT.md.
- Sucre et fruit : même règle quand la donnée existe, sinon la règle provisoire ; la liste des pages à collecter couvre grain, sucre et fruit.
