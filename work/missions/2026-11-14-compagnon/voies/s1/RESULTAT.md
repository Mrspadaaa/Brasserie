OK — 4 mini maquettes s1 (réponse d'abord), 4 cadres, clair et cave
Les quatre maquettes (s1a à s1d) passent les cinq critères : SERIE OK et PAGE OK ×4.

## Variantes
| id | idée | chaleur | images ouvertes | défauts vus |
|---|---|---|---|---|
| s1a | base compactée : chrome d'une rangée, mode dans le champ, verdict → geste → contrôle | froide | clair oui (1re version, puis correctifs non revus) ; cave non | padding des boutons et rangées « Reprendre » centrées (corrigés) ; accueil et erreur un peu vides en bas (erreur ancrée en bas depuis) |
| s1b | carte verdict : bandeau de niveau, geste en gros 43 g → 21 g, puce J+9 « Garder » | tiède | clair oui ; cave non | l'attente était vide en bas : le dernier verdict y a été ajouté, rendu non revu |
| s1c | Fais · Pourquoi · Ensuite, même grammaire pour l'accueil, l'attente et l'erreur | tiède | clair oui ; cave non | le titre de la page était invisible (classe `-tete` en collision, L26) : renommée, rendu non revu ; les boutons de l'erreur passent sur 2 lignes |
| s1d | la phrase qui agit : les valeurs proposées sont des pastilles cochées dans la phrase | chaude | clair oui ; cave non | « Au plus 3:40 » cassé ligne à ligne (corrigé, non revu) ; milieu de l'attente et de l'erreur assez vide |

## Fichiers écrits (tous dans voies/s1)
- `outils/commun.mjs` (jetons des deux thèmes, icônes lucide, fond estompé), `outils/s1a.mjs` à `outils/s1d.mjs`, `outils/build.mjs` (construction et captures).
- `s1a/` à `s1d/` : `etat.html`, `<id>-clair.png`, `<id>-cave.png`, `NOTE.md`, `cadres/<id>-<cadre>-<thème>.png` (16 par variante).
- `tests.txt` (contrôle de série tel quel).

## Critères
- G1 : controle-serie.mjs (corrigé par le pilote), relancé tel quel → SERIE OK (tests.txt).
- G2 à G5 : `verifier-page.mjs` → PAGE OK (4 images chargées, 390 px, sans erreur) pour s1a, s1b, s1c et s1d.
- Mesures de build : 3 tailles de texte par cadre (s1a et s1c 13/15/17, s1b 13/16/26, s1d 13/18/22) ; aucun fil ne déborde ; aucun `type="number"` ; aucun nom de modèle.
- `controle-panel` (indicatif) : PANEL ECHEC. Sur les 4 cadres « réponse » : remplissage médian 0,46 (plancher 0,55), ressemblance 0,89. Sur les 16 cadres : remplissage 0,38, ressemblance 0,92. L'outil est étalonné sur des écrans de 390 × 844 dans l'app ; un cadre de feuille a ses interlignes et sa bande de fond.

## Captures
- `work/missions/2026-11-14-compagnon/voies/s1/s1a/s1a-clair.png`, `…/s1a-cave.png`, et de même pour s1b, s1c et s1d.
- Un cadre par fichier : `work/missions/2026-11-14-compagnon/voies/s1/<id>/cadres/`.

## Prédiction
« s1b et s1d, je vois tout de suite quoi faire ; s1a, c'est l'actuel en propre ; s1c, c'est clair mais un peu formulaire. »

DÉCISION À PRENDRE : la proposition du dossier change Citra J+2 alors que le brassin est à J+4, apport déjà fait (L14). Les maquettes la rangent donc dans « la recette, prochain brassin ». À confirmer.

DEMANDE EXECUTANT :
1. `node work/missions/2026-11-14-compagnon/voies/s1/outils/build.mjs` (attendu : « rendu sans erreur » ×4, sans « fil déborde »).
2. Captures à ouvrir et à juger par le pilote, car je n'ai plus de contexte (200 k) : les 4 `<id>-cave.png` (jamais ouvertes), puis `s1a-clair.png`, `s1b-clair.png`, `s1c-clair.png` et `s1d-clair.png` après les derniers correctifs.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : un contrôle neuf se rejoue sur une page qui doit passer avant d'entrer dans les GATES (L13) ;  dans un gabarit JS devient U+0008.
