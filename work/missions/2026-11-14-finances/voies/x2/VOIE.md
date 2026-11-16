# Voie x2 — Constats FN-30, 31, 32, 34, 36, 38, 39, 40 du jeu ZZ TEST du 16.11

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : dfe9189e (FN-33, FN-35, FN-37 corrigés par le pilote)
- Décideur en cas de doute : pilote

## Objectif
Corriger les huit constats moyens et bas restants du jeu en ligne ZZ TEST du 16.11, chacun avec un test qui échoue d'abord.

## Entrées
- Constats : `work/missions/BUGS.md` lignes FN-30 à FN-40 ; récit du jeu, gestes et nombres : `work/missions/2026-11-14-finances/voies/z3/JEU-EN-LIGNE.md` (§ 1 à 3).
- Pistes du pilote (à vérifier, pas à croire) :
  - FN-30 « Autre montant » ouvre la fiche : `src/ui/finance/TransactionRow.tsx` (`autreMontant`, avis `ops-avis`), `src/components/tabs/FinancesTab.tsx:127` (`onPay`), `src/ui/finance/payer/PayerVirement.tsx`. Rejouer au banc : ✓ Payé, attendre 1 s (garde FN-33 de 0,8 s), « Autre montant » ; trouver pourquoi la fiche s'ouvre (clic qui tombe sur `ops-main` après un déplacement de la ligne ? autre chemin ?).
  - FN-31 ordre FIFO à même date : `src/domain/finance/repartition.ts` `ordreDImputation` départage par `id` (aléatoire) ; départager par l'heure de saisie (`finance.recordedAt`) avant l'id.
  - FN-32 étiquette « zz 12,00 » quand une seule pièce est touchée : `PayerVirement.tsx` ~l. 141 calcule `etiquettesPieces` sur les seules pièces touchées ; les calculer sur toutes les pièces de la feuille.
  - FN-34 Échap dans le champ fournisseur, fournisseur perdu en section repliée : `src/ui/finance/ExpenseSheet.tsx` (ou la feuille de saisie réelle) : Échap dans un champ ne ferme pas la feuille (il ferme d'abord la liste de suggestions, ou ne fait rien) ; une valeur tapée reste visible ou signalée quand sa section est repliée.
  - FN-36 aperçu « après » de « J'ai bien payé » : `src/components/EditTransactionModal.tsx` (`apres`, `simulerPlan`) : montrer le trop-payé « 2,00 à récupérer » dans l'aperçu.
  - FN-38 créance montrée sur le doublon : `src/ui/finance/TransactionDetails.tsx:54` relie la créance par la description ; la relier à la pièce d'origine sans ambiguïté (ex. champ existant de `TransactionFinance`, sinon la plus ancienne pièce payée de ce nom ayant un trop-payé) ; aucun identifiant brut montré au brasseur.
  - FN-39 « Doublons » désactivé sans raison : dire pourquoi (nom accessible et texte court, ex. « aucun doublon ») ; ne pas changer la garde de saisie.
  - FN-40 bandeau « Opération mise à jour. Fermer » qui reste : il s'efface seul après quelques secondes et au changement de vue (Archives).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance`
- `src/domain/finance/repartition.ts`
- `src/components/EditTransactionModal.tsx`
- `src/components/tabs/FinancesTab.tsx`
- `tests`
- `work/missions/2026-11-14-finances/voies/x2`

## Consignes
Pour chaque constat : d'abord le test qui échoue sur dfe9189e (le dire dans RESULTAT.md, avec la ligne d'échec), puis la correction, puis le test vert. Jouer d'abord le chemin du testeur au banc `http://localhost:3000/?dev-local&finance-demo` (déjà lancé, ne pas relancer ; données « ZZ TEST — … » seulement dans le navigateur de test). Un constat qui se révèle voulu par une maquette choisie : ne pas le changer, l'écrire dans RESULTAT.md (« voulu : … »).
Captures 390 et 1280, clair et cave, de chaque point visible, dans `work/missions/2026-11-14-finances/voies/x2/cap/`, ouvertes avant de rendre.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : maquettes choisies telles quelles (m5pa-d Payer, m5mo-c Modifier, m5fo-a fiche, v6a Opérations, s2ap2 frise) ; `node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` V6A OK, `node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000` FRISE OK.
- Ne pas défaire FN-33 (garde de 0,8 s de l'avis), FN-35, FN-37 (`estCreanceTropPaye`, hors dépensé et hors Annuel).
- Un test se change seulement s'il décrit ce que ses choix remplacent. Écritures : services existants, un lot par étape, règles Firestore en lecture seule. Le payé ne disparaît jamais ; inconnu ≠ 0 ; jamais `type="number"` ; cibles 44 px ; aucun identifiant brut à l'écran.
- Pas de Fable, aucun sous-agent, aucune donnée réelle. `git status --short` à la fin. Ne commite pas.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil, une ligne par constat (test rouge, correction, test vert, capture).
- `node work/missions/2026-11-14-finances/voies/q5/emulateur.mjs > work/missions/2026-11-14-finances/voies/x2/emulateur.txt`.
- La ligne « Tests » : `npx vitest run tests/integration/operationsPeriode.test.tsx tests/integration/modifierMontant.test.tsx tests/integration/payerVirement.test.tsx tests/unit/repartitionVirement.test.ts tests/integration/expenseSheet.test.tsx tests/integration/doublonsPaire.test.tsx tests/integration/fnJeuEnLigne.test.tsx --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/x2/tests.txt` (ajouter les fichiers de test créés).
Réponse finale au pilote : une ligne.
