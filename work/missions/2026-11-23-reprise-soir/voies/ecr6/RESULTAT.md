OK — dates annoncées = Calendrier, retrait qui dit les avoirs, Référence sans facture, erreurs serveur en français (E44-1..3), commit 2edac9e56

# RESULTAT ecr6 (24.11)

## Plan (cause, fichier, correctif)
- E44-1 — cause : la carte de fin et l'aperçu de la saisie calculaient `echeances(date, rythme)` (24.11, 24.12 …, `src/ui/saisie/modele.ts`), alors que le Calendrier place une écriture « à payer d'ici le 24.12 » à son échéance et décale les suivantes du même délai (E38-6, `decalageDeLEcheance`, `forecast.ts`). Deux règles. Décision de date : la plus cohérente avec le reste de l'app = l'échéance (24.12, 24.01 …), le Calendrier n'est pas touché ; une écriture payée garde les dates de la pièce (aucun décalage). Correctif : `datesDesOccurrences` + `decalageEntre` dans `src/domain/finance/forecast.ts` (planOccurrences + même décalage), branchée à l'aperçu (SaisieMain.tsx:316) et à la carte de fin (:384). `decalageDeLEcheance` passe par `decalageEntre` (aucun changement de comportement du Calendrier).
- E44-2 — cause : la fiche cherchait les avoirs liés dans la liste reçue (`transactions`, la liste affichée d'Opérations, qui ne montre pas les avoirs), alors que le retrait les cherche dans le registre. Correctif : `ecrituresLieesDans` (règle unique, `retraitEcriture.ts`) pour le retrait (`retirerEcriture.ts`) et la fiche (registre complété par la liste reçue) ; le texte est `phraseDuRetrait` (même mots qu'avant). Les autres chemins de retrait : l'annulation « void » de la fiche refuse déjà avec le motif « Un avoir est lié » ; « Annuler » de la carte de fin porte sur l'écriture qu'on vient de saisir (sans avoir).
- E44-3 — cause : placeholder « N° de facture » écrit en dur (`EditTransactionModal.tsx:400`) ; la saisie avait sa propre règle. Correctif : `indicationReference(genre)` (`modele.ts`) pour la saisie et Modifier : facture (achat, charges, vente) « Référence (n° de facture) » ; apport, prélèvement privé, remboursement « Référence, facultatif » ; impôt « Période, référence ».
- Erreurs serveur — `src/domain/finance/erreurServeur.ts` (`texteErreurServeur`, `codeServeur`) ; `firestoreRepo.ts` : écriture (bandeau « Enregistrement refusé / Confirmation incertaine : <texte français> »), écoute d'une collection, synchro des finances. Le message brut reste dans `console.error` (déjà présent ; ajouté pour la synchro des finances). Les codes permission-denied, unavailable, deadline-exceeded, unauthenticated (+ resource-exhausted, failed-precondition, aborted, already-exists, not-found, cancelled) ont leur texte ; autre : « erreur du serveur (code) ». Le texte propre à permission-denied de l'écoute (« Accès refusé par les règles de sécurité… ») est gardé.

## Fichiers écrits
src/domain/finance/forecast.ts, retraitEcriture.ts, erreurServeur.ts (neuf) ; src/ui/finance/TransactionDetails.tsx, modifier/retirerEcriture.ts ; src/ui/saisie/SaisieMain.tsx, modele.ts ; src/components/EditTransactionModal.tsx ; src/services/firestoreRepo.ts (textes d'erreur) ; tests/unit/ecr6Ecritures.test.tsx (neuf, 12 tests) ; work/missions/BUGS.md (E44-1..3 « corrigé en local 2edac9e56 »). Rien dans src/domain/stock ni src/ui/stock ; rien dans firestore.rules ; aucun montant ni solde modifié.

## Critères
- tsc : 2 erreurs connues seulement (seedData GanttTask, virtual:pwa-register) — voies/ecr6/tsc.log.
- Tests touchés (ecr6, ecr4Modifier, ecr5, ecr4Ecritures, ecritures23soir, ecritures38, saisieEcritures*, calendrierEcritures, firestoreAcknowledgement) : 11 fichiers, 130 verts — voies/ecr6/tests.log.
- `npx vitest run tests/unit/proprietes` : 8 fichiers, 76 verts — voies/ecr6/proprietes.log.
- `node scripts/agents/controle-bugs.mjs` : BUGS OK : 2200 bugs, 515 ouverts, 202 sources.
- Commit par chemins : 2edac9e56 (code et test) ; registre et RESULTAT dans le commit suivant.

## Essais, doutes, limites
- Essais : 1 test rouge de ma part (mauvaise attente de mon test sur un délai en jours, corrigée, règle intacte). Rouge/vert sur le code d'avant : les tests E44-2/E44-3 et la règle des dates sont neufs et n'ont pas été rejoués sur HEAD~ (pas de copie isolée) ; `echeances` (ancienne règle) donnait 24.11 en premier, ce que le test d'identité avec le Calendrier exclut désormais.
- Pas de capture locale (consigne) : preuve en ligne par le pilote. À regarder : carte de fin d'un Salaire « à payer d'ici » (24.12 · 24.01 · 24.02 · 24.03), Loyer trimestriel (24.12 · 24.03), fiche Retirer sur l'achat à remboursement lié, Modifier d'un Apport (« Référence, facultatif »).
- Le compteur « N fois » de l'aperçu (`echeances(…, 400).length`) n'a pas changé (le décalage ne change pas le nombre).
- Le bandeau de la saisie reçoit désormais « le serveur refuse cette écriture (droits insuffisants ou pièce modifiée entre-temps) » au lieu de « Missing or insufficient permissions ».

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : une écriture qui revient « à payer d'ici » est annoncée à son échéance et décalée du même délai ; la fiche de retrait lit le registre, pas la liste affichée (qui ne montre pas les avoirs).
LEÇON PROPOSÉE : aucune.
