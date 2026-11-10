# Voie k4-harness — le banc sur ses 13 pièces, et les gestes du rapport mis à l'essai

Agent : auteur (Sonnet). Plafond : 80 tours. Pilote : Opus. Date : 01.11. Suite de k2 (`voies/k2-reglages/`, commits c06cf976 et
ae58fc2b) ; D234 (5 CHF ; le budget du banc est cumulatif : `spentInJournal(MISSION_JOURNAL)`).

## Sa demande (01.11, mot pour mot)
« Met déjà en place le système qui permet d'améliorer et compare avec les données que l'on a, j'en ai pas plus pour le moment ».
Lecture du pilote : le banc devient l'outil qui essaie chaque geste du rapport sur **toutes** ses pièces et dit lequel gagne. Rien ne
change en production (`functions/`, `src/`) : la bascule est son choix, après le banc.

## Ce qu'on sait (ne pas le refaire)
- Rapport : `reports/Lecture de factures par vision.md` (§ « Changer la forme de la réponse », lignes 40 à 46 ; § PDF, ligne 79).
- k2 hors ligne : C★v + N = 217/243 champs, 187/207 lignes, 0 faux vert (`voies/k2-reglages/HORS-LIGNE.md`). Lm, Lh et Lp reposent
  encore sur C★′ (4 faux verts possibles) : à ramener sur C★v.
- Ses nouvelles pièces : six documents (doc8 à doc13) dans `work/finalisation-tickets-2026-10-08/H13-reels/`, dont deux PDF de 3 et 4
  pages et trois documents faits de **trois captures chacun**. Leur vérité sera `H13-reels/cas-4.json` (écrite par le pilote ; elle peut
  manquer quand tu travailles). Un cas à plusieurs fichiers porte `files: [...]` (dans l'ordre) en plus de `file` (le premier) ;
  `expected.lignesInvisibles: n` dit combien de lignes ne sont visibles sur aucune capture (elles ne comptent pas comme manquées).
  **Tu ne lis aucune valeur de ces pièces** : tes tests utilisent des cas fabriqués.

## À faire
1. **Plusieurs fichiers, et le PDF.** `BenchCase.files?` ; `buildReadBody` reçoit une liste : une part `inlineData` par fichier, dans
   l'ordre. Pour un cas à plusieurs fichiers seulement, une phrase **du banc** s'ajoute à la consigne, générique : les N images sont des
   captures d'un même document qui peuvent se recouvrir ; chaque ligne imprimée ne se lit qu'une fois. Un PDF part en `application/pdf`.
   `CAS_FILES` ajoute `cas-4.json` s'il existe (`existsSync`), sans échouer sinon. La réserve de budget suit la taille réelle : par image
   et par page de PDF (compter les pages dans les octets), au lieu du forfait de 6 000 jetons, sans jamais réserver moins qu'aujourd'hui.
2. **Lm, Lh, Lp ramenées sur C★v** (`finalOfStarVote`) ; libellés et tests mis à jour.
3. **Hv, payante** : C★v dont les deux lectures Flash-Lite placent la consigne **après** les images et n'envoient plus `temperature`.
4. **Sv, payante** : Hv avec un **schéma de sortie du banc** (module neuf `scripts/banc-lecture-schema.ts`) selon le rapport, lignes 40
   à 44 : en tête, la base des prix (HT ou TTC) et les taux de TVA imprimés ; pour chaque ligne, sa recopie telle qu'imprimée avant ses
   chiffres ; une case par date (facture, début et fin de période, échéance) ; la TVA taux par taux (taux, net, TVA, brut) à la place de
   HT et TVA ; la devise dans une liste fermée. Ordre des clés imposé (`propertyOrdering`). Un convertisseur rend le format de production,
   pour le vote et le jugement (date ← date de facture ; HT et TVA ← sommes par taux ; taux ← le taux seul s'il est unique). Schéma
   compact : pas plus de champs qu'aujourd'hui + 8.
5. **Une seule 3.8 par document et par tirage.** La 3ᵉ lecture (3.8, consigne 3 de production) est la même quel que soit le groupe qui la
   demande : elle se calcule une fois par (document, tirage) et se partage entre toutes les variantes ; prêtée par la sortie k1 quand elle
   y est. C'est ce qui garde le coût bas.
6. **`--estimer`** : sans réseau ni clé, pour une commande donnée, le nombre d'appels neufs et prêtés par variante et par modèle, et le coût
   réservé maximal, puis `BANC ESTIME <x> CHF <n> appels neufs`. Le pilote choisit les variantes et les tirages d'après lui.
7. **Jugement** : par document, puis par genre de pièce (photo, capture, plusieurs captures, PDF) ; `lignesInvisibles` respecté.
8. Tests (`tests/unit/banc-lecture-facture.test.ts`, réponses fabriquées, aucun réseau) : une part par fichier, dans l'ordre ; la phrase
   multi-capture absente d'un cas à un fichier ; Hv : consigne après les images et pas de `temperature` ; Sv : le convertisseur sur deux
   taux, sur une période, sur une devise hors liste ; la 3.8 partagée (un seul appel pour deux variantes qui la demandent) ; la réserve
   d'un PDF de 4 pages ≥ celle d'une image ; A et C reçoivent exactement le corps de production (test existant gardé).
   Témoin négatif : une 3.8 appelée deux fois pour le même (document, tirage) fait échouer un test.

## Possède
`scripts/banc-lecture-facture.ts`, `scripts/banc-lecture-facture-juger.ts`, `scripts/banc-lecture-consignes-lite.ts`,
`scripts/banc-lecture-schema.ts` (neuf), `tests/unit/banc-lecture-facture.test.ts`,
`work/missions/2026-11-01-banc-lecture/voies/k4-harness/**`, `work/finalisation-tickets-2026-10-08/H13-reels/banc-k4-*/`.
Rien d'autre : ni `functions/`, ni `src/`, ni `cas-4*.json`. Clé seulement par `readLocalKey` (jamais lue, affichée ni journalisée par
toi) ; ne lis jamais `functions/.env` ni `functions/.secret.local`. **Aucun appel payé** : le pilote lance la passe. Pas de commit, pas de
déploiement, aucune installation. Ne touche jamais `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`. Chemins absolus
dans Bash (un `cd` change le dossier de travail de la session).

## Critères (le pilote les rejoue)
- `npx tsc --noEmit -p . && echo TYPES OK` → TYPES OK
- `npx vitest run tests/unit/banc-lecture-facture.test.ts tests/unit/invoiceScanTransport.test.ts tests/unit/invoiceVisionReview.test.ts --maxWorkers=2 && echo TESTS BANC OK` → TESTS BANC OK
- la simulation de toutes les variantes et son jugement (commande exacte dans RESULTAT.md) → `BANC SIMULE OK`
- `--estimer` sur la commande payante proposée → `BANC ESTIME …`
- `git diff --stat -- functions src` ne montre rien de cette voie

## Retour
`voies/k4-harness/RESULTAT.md` : ce qui a été écrit, les sorties, la commande payante proposée et son estimation par variante (sans
aucune valeur des documents). Puis une ligne : `K4 OK — …` ou `K4 ECHEC — …`. `LEÇON PROPOSÉE : …` au besoin.
