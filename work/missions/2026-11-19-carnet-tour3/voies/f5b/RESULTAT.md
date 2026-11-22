OK — n° 3, 12, 13 corrigés ; n° 10 corrigé au domaine, DEMANDE f5c (Comparer.tsx) ; n° 11 DEMANDE f5c

Code : port-carnet, commit 7160b51e8 (7 chemins : comparer.ts, rattacher.ts, CadreArrivee.tsx, CarnetsVue.tsx, ChampCarnet.tsx,
tests/unit/carnetsTour3F5b.test.tsx, tests/integration/carnetsParcours.test.tsx ; `git show --stat HEAD` vérifié).

| n° | verdict | commit | test | rouge→vert | état à capturer |
|---|---|---|---|---|---|
| 3 | corrige : `nommeLeCarnet` (rattacher.ts) ; tous les mots tapés sont dans le titre du carnet proche → puce « → Ouvrir ce carnet » (CadreArrivee), qui ouvre le carnet et vide le champ. Une autre phrase garde « Y ajouter en façon » (R10, g5:v08-3) | 7160b51e8 | carnetsTour3F5b « n° 3 » | 1 rouge → vert (+2 gardes vertes) | Liste, champ pris, taper « Ventilation de la salle » sans envoyer (390 clair/sombre, 1280 sombre), puis toucher « Ouvrir ce carnet » |
| 10 | corrige au domaine : `domine` (comparer.ts) refuse « sur tout » quand une colonne sans sens (débit lu, 40 contre 25 L/min) a deux valeurs différentes ; `tableau()` ne pose plus `moinsBienQue` ni `moinsBienPartout` sur la pompe inox. **Reste à l'écran tant que la DEMANDE 1 n'est pas faite** (repli de `moinsBienQueDe`) | 7160b51e8 | carnetsTour3F5b « n° 10 » | 2 rouges → verts | Pompe, 2 liens collés (pompe-magnetique, pompe-inox) : ligne 2 du tableau et Comparer sans « moins bien que la 1re sur tout » (390, 1280) — après DEMANDE 1 |
| 11 | DEMANDE 2 (LigneRangee.tsx, CarnetOuvert.tsx : fichiers f5c) ; rien retiré : l'URL est le seul nom de l'article rangé (L27) | — | — | — | Pompe, lien collé : « votre lien : « https://exemple.invalid/pompe-magnetique » » sous « Article rangé ici » |
| 12 | corrige : un lien seul collé depuis la liste avec un carnet proche → cadre lien « ↓ va dans ZZ TEST — Ventilation… · Articles », lien en clair, « Nom, prix et photo se lisent à l'envoi » ; l'envoi le range dans ce carnet (annonce `ici`, l'IA garde le dernier mot si elle rend un carnet), aucun carnet « exemple.invalid », aucune façon | 7160b51e8 | carnetsTour3F5b « n° 12 » ; carnetsParcours (l. 214 : attendait le carnet titré « brewshop.invalid » en attente, le défaut même : remplacée par « aucun carnet titré du domaine ») | 1 rouge → vert | Liste, puce « Coller : exemple.invalid/hotte-1… » touchée (390, 1280 clair), puis Ajouter : bandeau « Rangé dans ZZ TEST — Ventilation… » |
| 13 | corrige : sans bulle G8, la puce « Coller » est dans `.cnf-aides` (sa ligne, sans le plafond de 55 %) ; à côté de la bulle, son lien se coupe par « … » visible (style du span) | 7160b51e8 | carnetsTour3F5b « n° 13 » | 1 rouge → vert | Liste, champ pris, presse-papier = https://exemple.invalid/hotte-140 : puce entière à 390 ; dans Ventilation avec bulle G8 (`&g8=1`) : lien coupé par « … » |

Preuves (dans ce dossier) : `tests-rouge.txt` (5 failed / 2 passed sur HEAD des 4 fichiers de code, copies restaurées, `cmp` OK),
`tests-vert.txt` (F5b, carnetsParcours, carnetsComparer verts ; carnetsEcrans 2 rouges « classées par … » = n° 6 de f5c en cours dans Comparer.tsx, non commité),
`tests-final.txt` (46 fichiers, 9 rouges, aucun à f5b : carnetsTour3F5c ×5 et carnetsCritique6Figes ×2 = f5c en cours ; carnetsTour3F4b line-clamp = f5 n° 2 de 1f243127a ; carnetsParcours = corrigé ensuite, vert dans tests-vert), `tsc.txt` : tsc sans erreur.
Captures : non prises (VOIE : voie v5).

## DEMANDE (à f5c, ou au pilote après f5c)
1. n° 10, `src/ui/carnets/Comparer.tsx`, `moinsBienQueDe` : le repli recalcule sur les seules colonnes de critère quand `tableau()` n'a pas posé
   `moinsBienQue` (donc toujours quand le domaine dit « personne ne le domine ») et ressort « moins bien que la 1re sur tout ». Patch : après
   `if (typeof duLotA === 'number') return duLotA;`, ajouter `if (typeof (l as { moinsBienPartout?: boolean }).moinsBienPartout === 'boolean') return null;`
   (ligne venue de `tableau()` : le domaine fait foi). Test : `texteMoinsBien(tableau(c), ligne inox)` = null avec le carnet du test « n° 10 » de carnetsTour3F5b.
2. n° 11, `src/ui/carnets/LigneRangee.tsx` l. 42 et `CarnetOuvert.tsx` l. 316 : `{estLienSeul(p.phrase) ? 'votre lien' : 'votre phrase'} : « … »`
   (`estLienSeul` de domain/carnets/modele). Test : LigneRangee avec phrase « https://exemple.invalid/pompe-magnetique » ne contient pas « votre phrase ».

Prédiction : « Ventilation de la salle » qui ouvre le carnet et la hotte qui va dans Ventilation, il ne le remarquera même pas : c'est ce qu'il attendait.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : `moinsBienQueDe` (Comparer.tsx) recalcule quand le domaine n'a rien posé : une correction de `domine` seule ne change pas l'écran.
LEÇON PROPOSÉE : un constat dont le texte est calculé au domaine mais dit par un repli de l'UI se donne avec les deux fichiers à la même voie.
