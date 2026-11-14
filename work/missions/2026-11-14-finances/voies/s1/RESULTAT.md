OK — 4 mini maquettes v6a + filtre « du … au » (feuille, pilule étirée, rangée, bascule)

## Variantes (une ligne chacune)
| id | idée | chaleur | images ouvertes | défauts vus |
|---|---|---|---|---|
| s1a | toucher « novembre » (petit calendrier) ouvre une feuille : deux dates natives 44 px, effet lu avant de valider ; après « 1 → 15 nov. » × | froide | oui (repos, geste, après) | un écran de plus ; ‹ › masquées en plage |
| s1b | la pilule s'étire en « ‹ 1 — 15 nov. › » ; bornes touchables, flèches qui font glisser les 15 jours ; × | froide | oui (repos, geste, après) | rangée du haut pleine ; bornes 26 px (pas 44) ; une ligne de 12 px pour dire où mènent les flèches |
| s1c | chevron ⌄ qui déplie une rangée « du … au » dans la carte ; reste visible et teintée une fois posée ; × | tiède | oui (repos, geste, après) | carte +40 px en plage ; deux signes proches au repos |
| s1d | bascule « Mois \| Plage » : la pilule v6a est le segment Mois ; Plage = deux feuillets datés (jour en grand) et la durée « 15 j » | tiède | oui (repos, après) | rangée du haut pleine au repos ; carte +50 px en plage |

Après (toutes) : du 1er au 15 nov., le loyer du 25 nov. sort : Fixes 68,00 ; payé 325,40 · à payer 0,00 · dépensé 296,80 (68 + 186,80 + 42 ;
matériel à part comme v6a) ; retard 2025 gardé ; une pastille hachurée « hors plage : loyer de l'atelier · 25 nov. · 400,00 » dit ce qui sort.
Aucune plage à cheval montrée : v6a n'a aucune donnée d'octobre, rien d'inventé.

## Fichiers écrits (tous sous `work/missions/2026-11-14-finances/voies/s1`)
- `s1a|s1b|s1c|s1d/etat.html`, `NOTE.md`, `<id>-repos.png`, `<id>-apres.png`, `<id>-geste.png` (s1a, s1b, s1c)
- `build.mjs` (construit les 4 pages depuis v6a, classes préfixées par split/join), `capturer.mjs` (390 px, échelle 2, `--lang=fr-CH`),
  `planche.mjs` (planches de contrôle, sorties en dossier temporaire), `fonts/` (Source Sans 3 et IBM Plex Mono en local : le contrôle de série
  interdit l'appel réseau de Google Fonts que v6a faisait), `tests.txt`

## Critères (rejoués depuis la racine)
- G1 `controle-serie.mjs … s1a,s1b,s1c,s1d` → `SERIE OK` (aussi dans `tests.txt`)
- G2 à G5 `verifier-page.mjs <id>/etat.html` → `PAGE OK (1 images chargées, 390 px, sans erreur)` ×4. Le vérificateur exige 1 image :
  chaque page montre en tête la capture de v6a (`ref/v6a/v6a-haut.png`) comme base ; v6a elle-même sort `PAGE ECHEC 0 images`.
- Autres contrôles, joués une fois : `controle-commun --page=etat.html` : survol, blocs, contraste, parlant, brutes OK ; standard ECHEC S3
  « rayons hors échelle 10px, 16px » = ceux de v6a (témoin `ref/v6a` : même ECHEC), gardés (règle n° 1) ; fiche, au-style, couleurs, trait,
  légende : contrôles des lots houblons, sans objet. `controle-panel` → PANEL ECHEC (ressemblance 0,93, paires presque identiques 14 %) :
  attendu, les quatre sont v6a telle quelle où seul le filtre change (contrat). `controle-choix --registre` : échecs sur `finances-analyse`
  seulement (registre, hors de cette voie).

## Captures
`work/missions/2026-11-14-finances/voies/s1/s1a/s1a-repos.png`, `s1a-geste.png`, `s1a-apres.png` ; idem `s1b/`, `s1c/` ; `s1d/s1d-repos.png`, `s1d/s1d-apres.png`.

## Prédiction
Il comprend s1a et s1d en trois secondes (« 1 → 15 nov. », « du 1 au 15 ») ; s1b lui plaira pour la vitesse, mais le signe |↔| au repos ne se devine pas seul.

DÉCISION À PRENDRE : aucune hors de la page de choix (forme du filtre, au brasseur). Conflit signalé : la méthode v0 demande PANEL OK, le contrat
impose v6a telle quelle ; le panel ne peut que ressembler.
CONNAISSANCE : `verifier-page.mjs` sans `--min-images 0` refuse une maquette sans `<img>` (v6a de référence comprise) ; et `controle-serie`
refuse Google Fonts : polices à copier en local.
LEÇON PROPOSÉE : aucune
