# Voie qr-ecart — l'état « écart » du sceau QR se règle par un choix (D246, D252)

Agent `auteur` (Sonnet), 40 tours au plus. Décideur : pilote ; le critique rejuge ensuite. Écris RESULTAT.md section par section (L18).

## Le défaut (critique, `voies/qr-critique/VERDICT.md`, rubrique « écart, rejugé »)
Dans l'état « écart » (la page lit 13.10.2026, le QR dit 12.10.2026, total d'accord), toucher la chip « ① Date » ouvre la feuille
« Ce que dit le QR », surligne la rangée Date, **puis règle la chip et efface la marque ambre du bandeau sans que rien n'ait été
choisi**. Sa phrase prédite : « Je clique et c'est réglé alors que c'est toujours 13.10 ??? Je prends quoi ? »

## Ce qui est attendu (la mécanique existe déjà pour « ① Total » en contredit : la reprendre, ne pas l'inventer)
1. Dans la rangée Date de la feuille, deux touches : « 12.10.2026 · QR » et « 13.10.2026 · lu » (le duel du total, sans tuiles).
2. La chip ne se règle, et la marque du bandeau ne s'efface, **qu'à ce choix**. Ouvrir la feuille ou toucher la chip ne règle rien.
3. « Prendre le QR » écrit 12.10.2026 dans la date de la dépense (et ce qui en dépend : la tuile Règlement « Payé le … » suit la date
   comme elle la suit aujourd'hui). « Garder » laisse 13.10.2026, et le sceau dit « lu gardé », comme en contredit.
4. Même chose pour Créancier et Devise (même composant, même règle). « Facture » (n°, aucun champ au bandeau) peut se régler à
   l'ouverture, comme aujourd'hui.
5. Aucun champ ne change sans geste ; « Confirmer » n'est jamais bloqué par le QR ; rien n'est écrit dans Firestore.

## Où
- Code : `src/ui/finance/ExpenseSheet.tsx`, `src/ui/finance/InvoiceScanReview.tsx`, `src/ui/depense/Qr.tsx`, `src/ui/depense/qrVue.ts`,
  `src/ui/depense/Verdict.tsx`, `src/ui/depense/etat.ts`. Lis d'abord comment « ① Total » se règle par le duel (`DuelTotal`) en contredit,
  et comment l'état « écart » a été ajouté (`voies/qr-app/RESULTAT.md`, « Suite 3 »).
- Tests : `tests/unit/depense/qr/ecran-qr.test.tsx` (ajoute les cas : chip touchée sans choix → non réglée ; « prendre le QR » → date
  12.10 et chip réglée ; « garder » → 13.10, « lu gardé » ; même chose pour la devise). Écris-les d'abord : ils échouent sur le code
  d'aujourd'hui.
- Copie isolée : `%TEMP%/qr-app-copie` (`npm ci` réel). Resynchronise avec
  `bash work/missions/2026-11-01-bascule-lecture/voies/qr-app/outils/synchro.sh` (copie aussi `docs/research`). Tests, `tsc`, build et
  Chrome se jouent **là**, jamais dans `C:/Users/mrspa/Documents/Brasserie` ni via les jonctions `node_modules` du dépôt.

## Contrôles
- Dans la copie : `npx vitest run --maxWorkers=2 tests/unit/depense tests/integration/expenseSheet.test.tsx tests/integration/expenseSheetMouture.test.tsx tests/integration/jus0Journey.test.tsx`
  (0 rouge), `npx tsc --noEmit` (aucune sortie), `npm run build` (code 0), `node scripts/check-no-dev-auth.mjs` (propre).
- Chrome : serveur Vite de la copie sur le port 3457, puis
  `node work/missions/2026-11-01-bascule-lecture/voies/qr-app/outils/parcours.mjs --url=http://localhost:3457 --sortie=work/missions/2026-11-01-bascule-lecture/voies/qr-ecart/captures`
  (sortie **explicite**, jamais `qr-app/captures`). Captures à ouvrir : l'état écart fermé, la feuille ouverte par la chip (rangée Date
  avec ses deux touches, chip encore ouverte), après « prendre le QR », après « garder ». Ajoute au parcours ce qu'il faut pour ces
  gestes, dans ta voie si possible. Arrête le serveur à la fin.

## Possède
`src/ui/finance/ExpenseSheet.tsx`, `src/ui/finance/InvoiceScanReview.tsx`, `src/ui/depense/**`, `tests/unit/depense/qr/**`,
`work/missions/2026-11-01-bascule-lecture/voies/qr-ecart/**`, `work/missions/2026-11-01-bascule-lecture/voies/qr-app/outils/parcours.mjs`
(seulement pour y ajouter les gestes de l'écart), la copie isolée. Rien d'autre. Aucun commit, aucune installation dans la jonction,
pas de `git stash`, aucun déploiement, aucun appel Gemini. Ne touche jamais `firebase.json`, `.firebaserc`, `firestore.rules`,
`firestore.indexes.json`, `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`, `functions/`. Chemins absolus dans Bash ;
aucun code écrit par heredoc ni `node -e`.

## Retour
`voies/qr-ecart/RESULTAT.md` : fichiers changés, tests (échouaient avant), contrôles, captures ouvertes. Puis une ligne :
`QR-ECART OK — …` ou `QR-ECART ECHEC — <raison>`.
