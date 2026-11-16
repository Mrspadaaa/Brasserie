# Voie p2 — les 3 bloquants et le problème 4 du jeu en ligne 4 (mission 2026-11-09-depense-totaux)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote
- Lis :
  - `CLAUDE.md`, `cerveau/LECONS.md` (L11, L12, L13, L14, L17, L28) ; `.claude/rules/affinee-frontend.md`, `DESIGN.md` ;
  - la fin de `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (09.11) ; DP-1 et DP-2 de `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` ;
  - `../../critique/VERDICT-EN-LIGNE-4.md` et ses captures (dossier `../../critique/en-ligne-4/` ou celui qu'il nomme), toutes à ouvrir ;
  - `../p1/RESULTAT.md` (état de l'écran, banc `../p1/banc/`, script `../p1/capturer-p1.mjs`).

## Objectif
Un test qui échoue sur HEAD (c76481aa) avant chaque correction (L13).

1. **Bloquant 1 — données retirées sous des coches vertes.** Deux tickets Sun Store lus comme deux pages d'une dépense (« Total EFT
   163,85 » imprimé sur les deux) : la vérification « corrige » 8 valeurs, barre les deux lignes de la page 1 (« pas retrouvée · 1/6 »),
   ramène le total à 149,25 et la TVA à 0,00, et tous les contrôles restent verts.
   a. Côté écran (`src/ui/finance/**`, `src/ui/depense/**`) : tant qu'une ligne ou une valeur retirée par la vérification attend sa
      décision (Garder / Retirer), les contrôles ne sont pas verts : rangée en écart (ambre ou rouge selon DP-2 si elle touche un total)
      qui dit ce qui a été retiré (« 2 lignes lues puis retirées · 14,60 ») et mène au geste (« Les garder »). Jamais de « Somme =
      imprimé » vert sur un total que la vérification a changé sans décision.
   b. Côté lecture (`functions/src/` : vérification/relecture des pages, `invoiceVisionReview`, `invoiceScanVote`, `invoiceScanCore`) :
      trouve pourquoi la vérification d'une dépense à plusieurs pages perd la page 1 (relecture d'une seule page ? total d'une page pris
      pour le total ?). Corrige si la cause est sûre et testée (Gemini toujours simulé dans les tests) ; un total « Total EFT »
      imprimé sur toutes les pages est le total de la dépense. Écris la cause dans RESULTAT.md avec la preuve (code, test).
2. **Bloquant 2 — payé ≠ total sans rouge.** « Payé · TWINT montant non lu » en gris alors que la note dit « Le terminal affiche 163,85,
   plus que le total » : un montant de terminal lu qui diffère du total est un « Payé ≠ imprimé » en écart, rouge (DP-2), écart signé,
   drapeau, geste « Comparer à la photo ». Voir `payeEffectif` (`src/domain/finance/controlesPiece.ts`) et `notePaiement` : ne casse pas
   le cas d'un paiement partagé expliqué (garde ses tests) ; si le partage est la cause sûre, la rangée le dit, sinon rouge.
3. **Bloquant 3 — total coupé à 390** (« 149,; ») quand une valeur barrée et la pastille « N lignes » se serrent à côté : le total
   s'affiche toujours entier ; la valeur barrée passe à la ligne ou en note. Mesure : aucune troncature (scrollWidth ≤ clientWidth) à 390.
4. **Icônes de stock** sur les lignes barrées d'une dépense hors brassage (s1 : aucune icône de stock hors brassage, lignes barrées
   comprises).

Hors contrat (laisser) : pied « pas retrouvée » sur 4 lignes (D277), photo à 1280. Les lister dans RESULTAT.md si tu vois une piste.

## Contrôles
- `npx tsc --noEmit -p .` ; dans `functions/` : `npx tsc --noEmit -p .` et ses tests de lecture concernés (`npx vitest run <fichiers>`).
- `npx vitest run tests/unit/depense tests/unit/finance tests/integration/depense* tests/integration/finance tests/integration/financeQuickActions.test.tsx --reporter=dot > work/missions/2026-11-09-depense-totaux/voies/p2/tests.txt` ; ligne « Tests » dans RESULTAT.md, zéro rouge.
- `npm run build` vert.
- Banc : copie le banc de p1 dans `voies/p2/banc/` ; ajoute `sunstore-pages-retirees` (deux pages, total corrigé 163,85 → 149,25, deux
  lignes barrées en attente, terminal 163,85). Captures Chrome réel, 390 tactile et 1280, clair et cave : repos, après chaque pastille.
  Toutes ouvertes, dans `voies/p2/captures/`.

## Possède
- `src/ui/finance/**`, `src/ui/depense/**`, `src/domain/finance/**`, `src/services/geminiScanner.ts` ;
- `functions/src/invoice*.ts`, `functions/src/prompts.ts` et leurs tests dans `functions/` ;
- `tests/unit/depense/**`, `tests/unit/finance/**`, `tests/integration/depense*`, `tests/integration/finance/**`, `tests/integration/financeQuickActions.test.tsx` ;
- `work/missions/2026-11-09-depense-totaux/voies/p2/**`.

Jamais lire `functions/.env` ni `functions/.secret.local`. Aucun appel Gemini réel. Aucun déploiement. Ni commit ni stash.

## Exigences transversales et acquis
- La maquette choisie de la Dépense reste la base ; DP-2 (rouge des totaux, renvois utiles) ; D382 (un bouton « Documents »).
- Inconnu ≠ 0. Peu de texte au premier plan. Jamais `type="number"`. Une ligne mal classée garde sa bande (5 tests D306).
- Aucune donnée réelle dans Git (banc anonymisé).

## Rendre (exigé par `.claude/hooks/garde-jetons.mjs`, L18)
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments : une limite de tours ne perd rien.
- La ligne « Tests » écrite dans un fichier (`--reporter=dot > …/p2/tests.txt`).
- Les captures 390 tactile et 1280, clair et cave, toutes ouvertes.

Réponse finale au pilote : une ligne.
