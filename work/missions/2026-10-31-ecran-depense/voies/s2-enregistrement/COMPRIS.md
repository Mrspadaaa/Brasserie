# Compris : voie s2-enregistrement

## Objectif
Faire passer la dépense du brouillon lu à l'écriture, avec chaque champ juste ou marqué : pas de date de paiement recopiée de la facture
sans le dire, le prix unitaire lu gardé sur la ligne, la mouture ajoutée au prix du malt, une commande facturée deux fois signalée avant
enregistrement. Le justificatif reçoit un nom lisible dans Drive, et la preuve Drive (dossier, nom, taille, empreinte vérifiée, lien
`webViewLink`) revient à l'appelant, sans que l'écran soit refait ici.

## Écrit dans
- `src/services/purchaseEntry.ts`
- `src/services/purchasePrefill.ts`
- `src/services/financeDocuments.ts`
- `src/services/driveFileStore.ts`
- `src/domain/finance/brewBudget.ts` (seulement `latestBrewPrices` et ce qui calcule le prix d'un article)
- `tests/unit/purchaseEntry.test.ts`
- `tests/unit/purchasePrefill.test.ts`
- `tests/unit/financeDocuments.test.ts`
- `tests/integration/driveFileStore.test.ts`
- `tests/unit/depense/enregistrement/`
- `work/missions/2026-10-31-ecran-depense/voies/s2-enregistrement/`

## Fini quand
- G1 : `npm run build` affiche `built in`.
- G2 : les cinq fichiers de test (unit et intégration) et `tests/unit/depense/enregistrement` passent, et la commande affiche `TESTS ENREGISTREMENT OK`.
- G3 : `node scripts/agents/systeme.mjs revue` sur `REVUE-PLAN.md` rend `REVUE OK`, c'est-à-dire deux regards neufs, sans bloquant laissé sans sort.
- G4 : `RESULTAT.md` contient les mots `TEMOIN AVANT`, `Zuschlag Schrotung`, `webViewLink` et `Rien ne se perd` (contrôle `note`, qui rend `NOTE OK`).
- Par défaut (COMMUN) : chaque défaut visé (A7, A11, A12, S5, S7, S8, DR1, DR4 message, DR5) a son test, lancé d'abord sur le code actuel
  avec sa sortie dans `RESULTAT.md` sous « TEMOIN AVANT : », puis corrigé et vert. Les montants restent en centimes entiers, rien n'est
  inventé, une valeur tapée n'est jamais écrasée. Une dépense déjà enregistrée reste lisible, et aucun champ n'est retiré d'un document Firestore.
- Plan d'abord : `PLAN.md` dans la voie, puis arrêt avec `PLAN PRÊT — <n> défauts` avant de coder.

## Ne fait pas
- Pas d'appel Gemini (lecture simulée seulement, `diagnostic/d1/lecture-simulee-372765.json`), pas de Drive réel, pas de déploiement,
  pas d'appel hors localhost, pas de donnée réelle.
- Ne lit pas `functions/.env`, ni `.codex/`, ni `source4-portable-bundle-manifest-01.json`, ni `work/refonte-frontend/v4/choix/`, ni
  `work/missions/2026-10-31-ecran-depense/brasseur/` : rien de la facture du brasseur (nom, adresse) n'est copié dans une fixture.
- Pas de `git stash`, pas de commit, pas de push, pas d'installation, pas de serveur dans `C:/Users/mrspa/Documents/Brasserie`.
- Aucun code écrit par heredoc, par `sed` ni par `node -e`.
- Ne refait pas l'écran : l'affichage de la preuve Drive et le choix d'écran reviennent à une autre voie ou au brasseur ; l'appariement
  et l'identité d'un produit (s1), la création d'un article et sa catégorie, l'envoi Drive anticipé pendant la relecture sont hors périmètre.
- Ne modifie ni `VOIE.md` ni `GATES.md`.

## Doutes
- A7 : le texte laisse le choix entre « vide » et « déduit avec sa règle » au plan ; je ne sais pas lequel est retenu, ni la forme de la règle.
- S8 : l'écart de jours entre deux factures « à peu de jours près » n'est pas chiffré ici ; le plan doit le fixer et le justifier.
- DR5 : je ne sais pas comment nettoyer le nom du fournisseur et le numéro pour un nom de fichier Drive, ni le format exact de `AAAA-MM-JJ`.
- DR4 : le message n'a pas de fichier désigné dans « Possède » ; je ne sais pas où il vit (probablement `driveFileStore.ts` ou `financeDocuments.ts`).
- Périmètre de `brewBudget.ts` : « ce qui calcule le prix d'un article » est large ; je ne vois pas les bornes sans lire le code.
- `tests/unit/depense/enregistrement/` peut ne pas exister ; je ne sais pas si je le crée.
- Qui lance les deux relecteurs de `REVUE-PLAN.md` (l'agent ou le pilote) n'est pas écrit dans la voie.
- Je n'ai lu ni les diagnostics d1 et d2 ni le code cité : tout ce qui précède vient de VOIE.md, GATES.md et COMMUN.md.
