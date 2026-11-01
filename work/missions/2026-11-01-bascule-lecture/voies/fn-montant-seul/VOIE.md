# Voie fn-montant-seul — une ligne à un seul montant garde ce montant en `amountTTC`

Agent `auteur` (Sonnet), 40 tours au plus. Décideur : pilote. Écris `RESULTAT.md` **section par section, dès le début** (L18) : une
section par étape faite, pour qu'un arrêt au plafond laisse un rapport.

## Le défaut (vu en ligne le 01.11 vers 15 h 33, lecture 3 de `work/missions/2026-10-31-ecran-depense/journal-gemini.md`)
Pièce fictive `src/ui/depense/apercu/qr/facture-qr.pdf` (générée par `voies/qr-app/fixtures/generer.mjs`) : 7 lignes, chacune un libellé
et **un seul montant**, sans en-tête de colonne (52,50 ; 3,75 ; 18,00 ; 6,40 ; 9,80 ; 9,20 ; 10,75 ; total 110,40). En production
(C★v8, révision aitask-00042-tet), les deux Flash-Lite divergent, la 3.8 tranche, et son résultat range chaque montant en `price` avec
`quantity: null` et `amountTTC: null`. Réponse lue dans le navigateur :
`controls.lines = { checked: 0, skipped: 7 }`, `controls.sum.statut = "incomplet"`. L'écran montre « TTC (CHF) — » sur chaque ligne,
« Quantité × prix 0/7 », « Somme des lignes non vérifiée ». Les montants sont pourtant justes : leur somme = 110,40 = le total imprimé.

## Ce qui est attendu (lecture étroite, L01)
1. À la normalisation d'**une** lecture (`normalizeInvoiceScan`, `functions/src/invoiceScanCore.ts`, appliquée à chaque lecture avant le
   vote), une ligne dont `amountTTC` est vide, `price` est un nombre fini, et `quantity` est vide **ou** vaut 1 reçoit `amountTTC = price`.
2. Rien d'autre ne change : `quantity` reste vide (aucun stock automatique), `price` reste ; une ligne à quantité > 1 sans `amountTTC`
   reste telle quelle (pas de multiplication) ; une ligne qui a déjà `amountTTC` n'est jamais touchée ; aucune valeur inventée.
3. Les contrôles existants font le reste : la somme des lignes se vérifie contre le total imprimé et signale tout écart, comme aujourd'hui.
4. Si la règle doit vivre ailleurs que dans `normalizeInvoiceScan` pour atteindre aussi la 3.8 qui tranche (`finirUneLecture`,
   `invoiceVisionReview.ts`), dis pourquoi dans RESULTAT.md ; un seul endroit, appliqué à toutes les lectures.

## Mesure au banc (avant tout déploiement ; skill `banc-lecture`, `.claude/skills/banc-lecture/SKILL.md`)
- Le banc (`scripts/banc-lecture-facture.ts`) est l'oracle. Trouve comment il normalise (importe-t-il `normalizeInvoiceScan` de
  `functions/src`, ou une copie ?) et son **rejeu hors ligne** des lectures enregistrées (`offline`, `results.json`) : **aucun appel Gemini**.
- Rejoue C★v8 (variante `Csv8`) sur les lectures enregistrées, avant et après la règle. Rapporte : combien de lignes réelles la règle
  touche ; pour chacune, la vérité du banc ; les scores avant/après (montants de ligne, total, statut, appels à la 3.8). **Aucune pièce ne
  doit perdre un point.** Une ligne réelle où la règle donne un montant faux contre la vérité : `FN-MONTANT-SEUL ECHEC`, avec les chiffres.
- Si le banc a sa propre copie de la normalisation, porte la règle à l'identique dans le banc (seule modification permise dans
  `scripts/banc-lecture-facture.ts`) pour que la parité reste vraie.
- Les vérités et pièces réelles du brasseur restent où elles sont : n'en copie aucune, n'écris aucun de leurs contenus dans RESULTAT.md
  (identifiants de pièce, nombres de lignes et scores seulement).

## Tests (Gemini toujours simulé ; jamais d'appel réel)
- D'abord les tests qui **échouent sur le code d'aujourd'hui** (L13) : une lecture à 7 lignes `price` seul → `amountTTC` = `price`, somme
  vérifiée = 110,40 ; quantité 1 → idem ; quantité 3 sans `amountTTC` → inchangée ; `amountTTC` déjà lu → inchangé ; et le chemin complet
  `lireCsv8` simulé : deux Flash-Lite qui lisent `amountTTC`, une 3.8 qui lit `price` seul → résultat final avec les sept `amountTTC` et
  `controls.sum` vérifiée.
- Garde verts les tests de la lecture (`grep -rln "scanInvoiceSafely\|normalizeInvoiceScan\|invoiceScanVote" tests functions`) et le test
  de parité (`tests/unit/invoiceScanVote.test.ts`). Commandes : celles de `voies/fn-csv8/RESULTAT.md`.
- `npm --prefix functions run build` vert.

## Possède
`functions/src/invoiceScanCore.ts`, `functions/src/invoiceVisionReview.ts`, les tests de la lecture de facture,
`work/missions/2026-11-01-bascule-lecture/voies/fn-montant-seul/**` ; `scripts/banc-lecture-facture.ts` seulement pour y porter la même
règle si le banc a sa propre copie. Rien d'autre. Aucun déploiement, aucune installation, aucun commit, pas de `git stash`, aucun appel
Gemini. Ne touche jamais `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`, `.codex/hooks.json`,
`source4-portable-bundle-manifest-01.json`, `functions/.env` ; ne lis ni `functions/.env` ni `functions/.secret.local`. Chemins absolus
dans Bash, pas de `cd` hors d'un sous-shell ; aucun code écrit par heredoc ni `node -e`.

## Retour
`voies/fn-montant-seul/RESULTAT.md` : fichiers changés, tests ajoutés (et qu'ils échouaient avant), sorties des tests et du build, rejeu
du banc (avant/après), ce qui reste à surveiller. Puis une ligne : `FN-MONTANT-SEUL OK — …` ou `FN-MONTANT-SEUL ECHEC — <raison>`.
`LEÇON PROPOSÉE : …` au besoin.
