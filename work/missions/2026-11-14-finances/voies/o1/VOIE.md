# Voie o1 — Opérations : rangées en v6a

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Les rangées d'Opérations (en-têtes de catégorie et opérations) reprennent « Lignes serrées v6a » telle quelle, à la place de v6b : le geste (« + pièce », « ✓ Payé », « Annuler ») sous le montant, deux étages gardés, hauteurs de v6a.

## Entrées
- work/missions/2026-11-14-finances/ref/v6a/NOTE.md — hauteurs mesurées et ce qui change (marges 2/5 px, nom 16 px d'interligne, étage d'état 18 px, pastilles 16 px, « ✓ Payé » 24 px, en-tête 5/1 px)
- work/missions/2026-11-14-finances/ref/v6a/etat.html et v6a-page.png — la cible
- work/missions/2026-11-14-finances/ref/v6b/NOTE.md — ce qui est en ligne aujourd'hui (geste à gauche du montant)
- work/missions/2026-11-14-finances/analyse/cap/ops-390-clair.png — l'app au banc
- src/ui/finance/TransactionRow.tsx, src/ui/finance/operations.css — le code des rangées

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance/TransactionRow.tsx`
- `src/ui/finance/operations.css`
- `src/ui/finance/journal.css`
- `work/missions/2026-11-14-finances/voies/o1`

## Consignes
1. Écrire `work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs <port>` : sur Opérations au banc (390, clair) : pour chaque opération portant un geste, le haut du geste est sous le bas du montant (geste sous le montant) ; hauteur d'une opération sans geste 44 ± 3 px, avec geste 47 ± 3 px ; en-tête de catégorie 28 ± 3 px ; « ✓ Payé » haut d'au moins 24 px. Imprime V6A OK ou V6A ECHEC et le détail.
2. Le lancer sur le code actuel : ECHEC attendu ; copier la sortie dans `temoin-head.txt`.
3. Corriger le code, puis le contrôle passe. Tests Vitest des fichiers touchés et voisins.
4. Captures 390 et 1280, clair et cave, dans `work/missions/2026-11-14-finances/voies/o1/cap/`, plus une planche côte à côte avec la maquette ; toutes ouvertes.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : la maquette choisie est la base, reprise telle quelle ; un port retire ce qu'elle n'a pas (L03).
- Rien hors de « Possède » ; `git status --short` à la fin (L17). Ne touche ni la bande de période (`operations/Bande.tsx`, `PlageMois.tsx`) ni la Dépense, le Stock, les Brassins, le jour de brassage (autres sessions).
- Écritures, TVA, montants : aucune règle de calcul changée sans le dire dans RESULTAT.md ; aucune donnée réelle (banc `?dev-local&finance-demo=reel` seulement).
- Contrôle d'abord rouge sur le code actuel (sortie copiée dans `temoin-head.txt`), puis vert (L13). Vision d'abord (D343) : captures 390 tactile et 1280, clair (`localStorage['laffinee.theme']='clair'`) et cave (`'cave'`), côte à côte avec la maquette, toutes ouvertes.
- Pas de Fable, aucun sous-agent. Banc : serveur Vite déjà lancé sur http://localhost:3000 (ce worktree, HMR) ; sinon `PORT=3017 npx vite`.
- Puppeteer : `.claude/skills/webapp-testing/examples/_lanceur.mjs` (fonction `ouvrir`), modèle `work/missions/2026-11-14-finances/analyse/capturer2.mjs`.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil : fichiers changés, contrôle avant/après, tests, captures ouvertes, défauts restants.
- `npx vitest run src/ui/finance src/domain/finance --reporter=dot > work/missions/2026-11-14-finances/voies/o1/tests.txt`.
Réponse finale au pilote : une ligne.
