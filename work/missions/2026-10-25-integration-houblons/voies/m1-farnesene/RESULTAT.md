OK — page de choix : A actuel, B + farnésène, C + cohumulone, D les deux (PAGE OK)

## Fichiers écrits (tous dans la voie, rien dans src/)
- `page.html` : la page de choix (titre daté 26.10, `#a-choisir` en tête, 4 vignettes côte à côte, A en référence ; chacune
  s'ouvre en grand à côté de A).
- `img/a-actuel.png`, `img/b-farnesene.png`, `img/c-cohumulone.png`, `img/d-les-deux.png` : 780 × 2080 (390 × 1040, ×2).
- `capturer.mjs` : le script qui les prend (à rejouer depuis la racine, commande en tête du fichier).
- Fichiers de travail dans `%TEMP%/m1/` (repérage, captures du vérificateur).

## Comment
- Les quatre vues sont prises dans la vraie app (`?dev-local&etape=houblons`, fixtures, drapeau `VITE_HOP_V4=on`), Comparer
  sur Nelson Sauvin, Citra et Mosaic, feuille Valeurs, cadrée sur la ligne des noms. Même cadre pour les quatre (390 × 1040 :
  plus haut que 844 pour montrer α, β et toute la composition en une image).
- A : capture sans retouche.
- B, C, D : lignes ajoutées dans la page rendue, en clonant les vrais nœuds. Mêmes classes de `comparer.css`, CSS non modifié.
  - B clone le groupe Caryophyllène : « Farnésène » et « frais, vert, floral », placé entre Caryophyllène et Autres.
  - C clone la ligne β : « cohumulone » et « % des α », placée sous β. Elle reprend le calcul de `LigneValeurs` (échelle =
    plus haut × 1,08 ; le plus haut milieu, Citra, prend sa couleur).
  - Les nœuds ajoutés portent la classe `m1f-ajout` (L26) et sont retirés après chaque capture.

## Valeurs utilisées (`src/data/hopV4/proto-data.json`, Beer Maverick)
| | farnésène (`oils.farnesene`) | cohumulone (`cohumulone`) | Autres (`oils.others`, inchangé) |
|---|---|---|---|
| Nelson Sauvin | 0–1 % | 20–25 % | 6–49 % |
| Citra | 0–1 % | 20–35 % | 8–28 % |
| Mosaic | 0–1 % | 24–26 % | 20–40 % |
Aucun inconnu sur ces trois houblons : pas de hachures à montrer.

## Critères
- `node scripts/agents/verifier-page.mjs .../m1-farnesene/page.html --page-lot --captures %TEMP%/m1/m1` →
  `PAGE OK (4 images chargées, lisible à 390 et 1280 px, sans erreur)`.
- Capture : `aucune erreur de page`. Le bas de la composition reste au-dessus du rail : Autres finit à 804 px (A), 881 (B),
  855 (C) et 932 (D), pour une vue de 1040.
- Visionneuse testée à 1280 : un toucher sur D ouvre « D · les deux | A · l'actuel ».
- `git status` : seuls des fichiers de la voie sont ajoutés. Les `src/` modifiés de l'arbre l'étaient déjà avant la voie.

## Captures ouvertes et regardées
- `img/a-actuel.png` et `img/d-les-deux.png` en plein format. B et C, dans les vignettes de la page à 390 et à 1280 px.
- `%TEMP%/m1/m1-haut.png`, `m1-ordinateur.png` et `vis.png` (la visionneuse).
- À 1280, les quatre colonnes se lisent sans ouvrir.
- La ligne cohumulone tient sur une ligne (nom et unité) et ne déborde pas. Le farnésène se lit, mais ses barres sont trois
  traits fins.

## Prédiction
« Le farnésène à 0–1 % partout, ça ne m'apprend rien sur ces trois-là ; la cohumulone sous β, oui, je la veux » : C (ou D, s'il
pense aux houblons nobles).

DÉCISION À PRENDRE : aucune pour la voie. Pour lui : sur Nelson Sauvin, Citra et Mosaic, la ligne B est une ligne de zéros.
Elle ne parle que face à un houblon noble ou allemand (Saaz 14–20 %, Spalter Select 15–22 %, Sylva 22–28 %). Si le pilote
veut que B se juge sur un cas où elle compte, il faut un jeu avec Saaz dans la page. Je ne l'ai pas fait : le contrat fixe
les trois houblons.

CONNAISSANCE : dans le catalogue, 249 houblons sur 318 ont le farnésène. 94 seulement dépassent 1 %, surtout les nobles et les
allemands (Sylva, Styrian Kolibri, Spalter Select, Saaz) ; les houblons modernes aromatiques sont à 0–1 %.

LEÇON PROPOSÉE : une mini maquette de « ligne en plus » se prend dans la vraie app, en clonant le nœud voisin dans la page
rendue (classe préfixée, retirée après la capture). C'est le DOM et le CSS réels, sans rien changer dans src/, et plus fidèle
qu'une page statique recopiée.
