# Prototype de l'étape Houblons

Phase 8 de la mission #119, 18.10.2026. Page autonome, **hors de l'app** : rien n'est
intégré avant l'accord du brasseur (porte B). Comportement décrit par
[la spec](../../docs/specs/houblons.md) ; fils de fer d'origine :
[fils-de-fer-houblons.html](../../docs/besoins/fils-de-fer-houblons.html) (direction A).

Page privée : https://claude.ai/artifact/UrdkDumB4m95s1iHr4ye27

## Construire

```text
node prototypes/houblons/build-data.mjs
```

Le script lit les données du dépôt, écrit `data.json`, puis assemble `index.html` à
partir de `app.html` (données intégrées, une seule page).

| Donnée | Source | Remarque |
|---|---|---|
| 318 variétés (alpha, bêta, huiles, descripteurs) | `src/data/hopBeerMaverickBootstrap.json` | Tags relus dans le texte « Tags documentaires », rangés en 17 familles d'arômes |
| Usages par style | `src/data/hopStyleUsageBootstrap.json` | IPA seulement : pour les autres styles, l'écran dit « non documenté » |
| Stock | `tests/fixtures/production/houblons-2026-10-17.json` | Stock réel de production (lecture seule, 17.10), relié aux variétés par le nom |
| Direction des styles | Guide BJCP 2021, 11 styles (15B, 16A, 16D, 20B, 20C, 21A, 21C, 3B, 5D, 24A, 25B) | Descripteurs houblon cités par le guide, relevés le 18.10 |
| Produits | `src/domain/hopDecision/products.ts` | Cryo 40–50 % du poids T-90 ; HyperBoost 0,8–1 % en dry hop |
| IBU | `src/services/brewingMath.ts` (`hopIbu`) | Même formule : Tinseth, 1er moût × 1,1, whirlpool atténué par la température |

Taille : 43 ko compressés (budget de démarrage B1 : 350 ko).

## Contrôles

| Contrôle | Commande | Résultat du 18.10.2026 |
|---|---|---|
| Un toucher, sans défiler | `node scripts/check-hop-one-tap.mjs --adapter scripts/hop-one-tap/prototype.mjs` | 9 houblons du stock visibles avec quantité, 0 toucher |
| Règles d'utilisabilité, 390 et 1280 | `node scripts/check-hop-ux-rules.mjs --adapter scripts/hop-one-tap/prototype.mjs [--width 1280 --height 800]` | aucune règle en échec |
| Budgets B3 et B4 | `node scripts/check-hop-budget.mjs --adapter scripts/hop-one-tap/prototype.mjs` | classement en 31–33 ms (processeur × 4), 2 Mo de tas |
| Gestes complets | `node scripts/check-hop-prototype.mjs` | choisir 1 toucher ; simuler 7–10 ms ; comparer 2 en 2 touchers, les 4 premiers en 1 ; remplacer en 2 ; 30 questions, 9 « non documentées » |

## Où chaque question trouve sa réponse

Le bouton « ? » ouvre « Mes questions » : chaque question renvoie à l'endroit qui
répond (« Y aller »), ou dit « Non documenté » et ce qui manque.

| Question | Où | Visible par défaut |
|---|---|---|
| Q01, Q03, Q21, Q23 | Liste « Mes houblons » ; style dans l'en-tête | nom, quantité, « manque X g » ou classe de style ; rang chiffré seulement si le style a des usages documentés, sinon des groupes et « classement estimé » |
| Q02, Q16 | Cases à cocher, « Comparer les 4 premiers », ⓘ | colonnes, seulement les écarts ; « Tout afficher » à la demande |
| Q04 | « Mes questions » → comparaison Nugget | descripteurs de Nugget et direction du style ; intensité en bière torréfiée : non documentée |
| Q05, Q06, Q18 | « Remplacer » sur une ligne d'ajout | dose au même IBU, gagné, perdu, stock |
| Q09, Q10, Q12, Q22 | Changement de style, puis liste et bandeau | classement et IBU visé du style |
| Q14 | « Mes questions » et ligne d'un ajout Cryo | règles fabricant (Cryo, HyperBoost) |
| Q15, Q17, Q20, Q24, Q25, Q29 | Lignes d'ajout et bandeau IBU | IBU par ligne et total, arôme dominant, stock et manque, alpha et sa source |
| Q07, Q08, Q11, Q13, Q19, Q26, Q27, Q28, Q30 | « Mes questions » | **non documenté**, avec la donnée manquante |

## Critique indépendante

Verdict à l'aveugle d'une session Fable 5.1 (`work/refonte-frontend/phase7/ux-verdict-fable.md`, dossier de travail local, 18.10) : 5 bloquants, tous corrigés. Le principal : un rang chiffré tiré des seuls descripteurs n'était pas crédible pour la stout. L'écran regroupe désormais : en amertume, assez en stock puis alpha ; en arôme, typique (origine citée par le guide BJCP), compatible, hors style.

## Limites connues

- Le classement de la stout repose sur la direction BJCP et les descripteurs : aucune
  base du dépôt ne documente l'usage des houblons pour la stout (ticket #127).
- Les descripteurs viennent de Beer Maverick (agrégat de fournisseurs) ; leur intensité
  dans une bière n'est pas connue.
- La ressemblance des remplaçants compare des familles de descripteurs : aucune note de
  substitution n'est importée (première version).
- L'amertume à cru vaut 0 dans le calcul de Tinseth ; le modèle à froid n'est pas repris ici.
- Rien n'est enregistré : recharger la page remet l'écran à zéro.
