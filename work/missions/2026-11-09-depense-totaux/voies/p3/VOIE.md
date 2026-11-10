# Voie p3 — les 4 bloquants du jeu en ligne 5 (mission 2026-11-09-depense-totaux)

- Agent : auteur · Modèle : sonnet · Plafond : 150 tours · Décideur : pilote
- Lis :
  - `CLAUDE.md`, `cerveau/LECONS.md` (L11, L13, L14, L20, L28, L29) ; `.claude/rules/affinee-frontend.md`, `DESIGN.md` ;
  - la fin de `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (09.11) ; DP-1, DP-2 de `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` ;
  - `../../critique/VERDICT-EN-LIGNE-5.md` (et le 4) avec leurs captures, toutes à ouvrir ;
  - `../p2/RESULTAT.md` (ce que p2 a fait : `retirees`, banc `../p2/banc/`, `../p2/capturer-p2.mjs`) ;
  - `.claude/skills/banc-lecture/SKILL.md` (le banc de lecture réel et ses règles).

Contexte : l'hébergement est revenu à c76481aa (avant p2) parce que p2 vide la dépense au rejeu du cache. aiTask porte p2 (champ
`retirees`, additif). Le code de HEAD (46c7a569) est ta base.

## Objectif
Un test qui échoue sur HEAD avant chaque correction (L13). Corriger à la cause, pas par rustine (L29).

1. **Bloquant 1 — le rejeu du cache vide la dépense.** Deux photos servies du cache → fournisseur, total, lignes perdus (« Ligne sans
   libellé », « Total non imprimé · 0,00 »). Cause probable : `finLecture` rejoue la fusion (`provisoireDeRetirees`) sur un final du cache
   qui porte `retirees`. Un final du cache s'affiche comme le final d'une lecture neuve, `retirees` en plus. Test sur un final du cache.
2. **Bloquant 2 — « 7 lignes retirées · 348,50 CHF » qui n'existent pas.** Les lignes retirées comptent un sous-total (« Total brut CHF »),
   le rabais total, une quantité fausse. Une ligne retirée qui est un total, un sous-total, un règlement ou un rabais global n'est jamais
   proposée comme article ni comptée ; « Les garder » ne ramène que des articles, et le chemin de réparation tient : sur le cas Sun Store,
   après « Les garder » et « Remettre 163,85 », on obtient les 7 lignes, 163,85 et « Payé = imprimé ». Si la donnée ne permet pas de trier
   sûrement, la rangée dit le fait sans proposer de restaurer en bloc.
3. **Bloquant 3 — le payé recopié du total.** « Payé = imprimé · TWINT 14,60 » vert sous un terminal à 163,85 : le payé est le montant du
   terminal ou du règlement lu, jamais une copie du total (changé ou non). Cherche où `amountPaid` suit `amountTTC` (client, normalisation,
   ou serveur) et corrige là.
4. **Bloquant 4 — BAUHAUS : lecture en échec (240 s), puis 23 lignes et corrections décalées** (« GANTS DE TRAVAIL » posé sur « METRE
   AUGA », etc.). Distinguer par preuve ce qui vient de p2 (aucun, a priori : `retireesParLaTroisieme` est additif) de ce qui préexiste :
   rapprochement provisoire / final (`rangsProvisoires`, `alignerLignes`) qui décale les corrections. Corrige le décalage s'il est
   prouvé sur un test (lectures réelles anonymisées du banc). Échec à 240 s : cherche la cause dans le code (délai, quota) ; sans preuve,
   écris-le comme ouvert.
5. **La 3.8 rend la page 2 seule** (deux tickets d'un même règlement en deux pages) : avec le banc de lecture réel (skill banc-lecture,
   pièces `../../pieces/sunstore-1.jpg` et `-2.jpg` en deux pages), 10 lectures Gemini au plus, journalisées comme le skill le dit :
   trouve la cause (consigne, images envoyées à la 3.8) et corrige si elle est sûre et mesurée contre la production (L20). Sinon, écris-le.

Hors contrat (laisser, lister) : mots bruts « lectures divergentes (other / equipment) », deux rangées pour un même fait, pied
« pas retrouvée » à 390.

## Contrôles
- `npx tsc --noEmit -p .` ; `functions/` : `npx tsc --noEmit -p .` et ses tests de lecture.
- `npx vitest run tests/unit/depense tests/unit/finance tests/integration/depense* tests/integration/finance tests/integration/financeQuickActions.test.tsx tests/unit/invoiceScan* --reporter=dot > work/missions/2026-11-09-depense-totaux/voies/p3/tests.txt` ; ligne « Tests » dans RESULTAT.md, zéro rouge.
- `npm run build` vert.
- Banc d'écran (copie de `../p2/banc/` dans `voies/p3/banc/`) avec les cas rejoués des jeux 4 et 5 (anonymisés) : Sun Store neuf, Sun
  Store du cache, BAUHAUS 23 lignes corrigées. Captures Chrome réel 390 tactile et 1280, clair et cave, repos et après chaque geste,
  toutes ouvertes, dans `voies/p3/captures/`.

## Possède
- `src/ui/finance/**`, `src/ui/depense/**`, `src/domain/finance/**`, `src/services/geminiScanner.ts` ;
- `functions/src/invoice*.ts`, `functions/src/prompts.ts`, leurs tests ; le banc de lecture selon son skill ;
- `tests/unit/depense/**`, `tests/unit/finance/**`, `tests/unit/invoiceScan*`, `tests/integration/depense*`, `tests/integration/finance/**`, `tests/integration/financeQuickActions.test.tsx` ;
- `work/missions/2026-11-09-depense-totaux/voies/p3/**`.

Jamais lire `functions/.env` ni `functions/.secret.local`. Gemini réel : banc seulement, 10 lectures au plus, journalisées ; jamais dans
`npm test`. Aucun déploiement. Ni commit ni stash. Aucune donnée réelle dans Git (photos et réponses brutes hors Git, anonymisées avant).

## Exigences transversales et acquis
- La maquette choisie de la Dépense reste la base ; DP-2 (rouge des totaux, renvois utiles) ; D382 (un bouton « Documents »).
- Inconnu ≠ 0. Peu de texte au premier plan. Jamais `type="number"`. Une ligne mal classée garde sa bande (5 tests D306).

## Rendre (exigé par `.claude/hooks/garde-jetons.mjs`, L18)
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments : une limite de tours ne perd rien.
- La ligne « Tests » écrite dans un fichier (`--reporter=dot > …/p3/tests.txt`).
- Les captures 390 tactile et 1280, clair et cave, toutes ouvertes.

Réponse finale au pilote : une ligne.

## Relance 1 (pilote, 10.11) — VERDICT-EN-LIGNE-6
Même contrôles, mêmes possessions, mêmes interdits (aucun appel Gemini). Un test qui échoue d'abord.
1. **Bloquant 1** : BAUHAUS neuf, la 3.8 rend des noms décalés d'un rang sur les montants (« OPSHGE CHANTIER » à 8,50 posé sur
   « CRATONS DE CHARPENTTER · 3,10 »…), 26 corrigées sous « Qté × prix 28/28 justes ». Sur les lectures réelles déjà au banc (aucun
   appel), prouve si c'est la 3.8 ou le rapprochement. Si la 3.8 : détecte le décalage (noms des deux Flash-Lite retrouvés au rang
   voisin, montants d'accord entre elles) et ne laisse pas la 3.8 l'emporter en silence : garde l'accord des deux, ou rangée en écart
   « lecture décalée » avec son geste. Mesure sur toutes les lectures réelles du banc (pas de recul sur les pièces qui marchaient).
2. **Bloquant 2** : 16 outils BAUHAUS en « Matériel de brassage » avec icône de stock (lecture « equipment »). Une ligne d'un ticket de
   bricolage ou rénovation ne devient pas du matériel de brassage par la seule nature lue ; aucune icône de stock hors brassage (s1).
   Trouve la règle de famille et corrige à la cause.
3. Non bloquant 4 : plus de mots bruts (« lectures divergentes (service / other) », « code tva … (absent / 0) ») : des mots du brasseur.
Captures du banc, 390 et 1280, clair et cave, ouvertes. RESULTAT.md à jour.
