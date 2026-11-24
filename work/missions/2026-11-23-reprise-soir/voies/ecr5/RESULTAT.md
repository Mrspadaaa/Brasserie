OK — E43-1 à E43-5, E41-1, E41-2 corrigés en local ; règles Firestore rejouées sur l'émulateur ; preuve en ligne au pilote

PRÊT À METTRE EN LIGNE cd9db1da8 (code) — le registre BUGS.md suit dans le commit « voie ecr5 : RESULTAT »

## Plan (cause, fichier:ligne, correctif)
| constat | cause | correctif |
|---|---|---|
| E43-1 « Missing or insufficient permissions » à Modifier › date | `EditTransactionModal.tsx` (handleSave) : `candidate = aEnregistrer(vivante)` est calculé AVANT les paiements de `executerPlan(deplacer…)`. La pièce s'écrit en entier (`put` sans merge) : elle remettait l'ancien `lastPaymentId` (et le solde) que les paiements venaient de changer, et `updatedTransactionGuard` refuse. Ce n'est PAS la date du contre-paiement (`payment.date >= original.date` : le contre reprend la date d'origine, accepté). | la pièce est relue après les paiements (`aEcrire`), puis écrite. Rejoué sur l'émulateur avec les vraies règles : copie périmée refusée 403, copie relue acceptée 200 |
| E41-5 (régression) | même cause | même correctif |
| E41-2 « De quelle pièce ? » ne montre que les ZZ | `saisie/modele.ts` `actives()` ne gardait que les dates écrites aaaa-mm-jj ; les pièces d'avant la saisie écrivent « 19.11.2026 » : écartées de « De quelle pièce ? », des habituels et des derniers noms (le correctif de ecr4 sur le registre des paiements ne pouvait rien) | `jourDe` = `isoDate(t.date)` (les deux formes) pour le filtre, le tri, la sous-ligne et `date` |
| E41-1 retrait « muet » en ligne | non reproduit seul : le domaine et la fiche (ecr4) passent sur un serveur simulé aux règles, achat à 2 paiements, remboursement lié, et état à moitié laissé par E43-1. Cause la plus probable : l'état à moitié écrit par E43-1 que le critique a retiré (« l'achat portait aussi les paiements à moitié écrits ») | rien de neuf dans le code du retrait ; les tests le gardent (4) ; à rejouer en ligne maintenant que E43-1 ne laisse plus d'état à moitié |
| E43-2 arrondi au franc dans la carte | `francsSignes` (francs entiers) dans `DetailChose.tsx:249` | `francsSignesExacts` (`domain/calendrier.ts`) : −2,50, +4,80, « 5 064 » ; les rangées et la courbe gardent les francs entiers |
| E43-3 habituels : trois prévisions prennent tout | `habituels()` remplissait les 3 places avec les prévisions | au plus `max − 1` prévisions ; sous-ligne « échéance le 22.12 · à enregistrer » (au lieu de « prévu le 22.12 · le solde ») |
| E43-4 TWINT avec l'icône banque | `Landmark` en dur (`SaisieMain.tsx`, `EditTransactionModal.tsx`) | `IconeCompte` : banque, billet (espèces), téléphone (TWINT), portefeuille (autre), dans la puce, la liste des comptes et Modifier |
| E43-5 Modifier d'un Apport ≠ saisie | étiquette « Privé » pour tout mouvement privé ; champ « Tiers » toujours posé | « Privé » seulement pour Pour moi, « Apports privés » pour l'apport ; champ Tiers seulement si la sorte en a un dans la saisie, ou si la pièce porte déjà un tiers (jamais caché) |

## Fichiers écrits
src/components/EditTransactionModal.tsx ; src/ui/saisie/modele.ts, SaisieMain.tsx, IconeCompte.tsx (neuf) ; src/domain/calendrier.ts (`francsExacts`, `francsSignesExacts`) ; src/ui/calendrier/frise/DetailChose.tsx (une ligne, la carte : fichier hors liste nommée, seul lieu du montant de la carte) ; tests/unit/ecr5Ecritures.test.tsx, ecr5ServeurSimule.ts (neufs), saisie-main.test.ts (une attente : la sous-ligne) ; tests/rules/rejouer-paiements.mjs (neuf) ; work/missions/BUGS.md (8 lignes).
Règles : `firestore.rules` NON modifié, rien déployé. Aucune règle n'avait à changer.

## Critères
- tsc : 2 erreurs connues seulement (`GanttTask`, `virtual:pwa-register`).
- Rouge avant correction : E43-1 (serveur simulé : « transactions/TX-D : Missing or insufficient permissions … date, lastPaymentId, proofNotes ») et E41-2 (« expected [ 'R3' ] to deeply equal [ 'R3', 'R1', 'R2' ] ») vus rouges, puis verts.
- tests/unit/ecr5Ecritures.test.tsx : 9 verts. Lot large (saisie, modif, ecr, ecritures, calendrier, finance, operations, choixDate, Date, retrait, frise, duree, plage, proprietes, lot6, forecast, Transaction, Edit, fiche, remb, habituel) : 110 fichiers, 1296 verts (`tests-large.log`), `tests/unit/proprietes` inclus.
- Émulateur des règles : `node tests/rules/rejouer-paiements.mjs` → `REGLES PAIEMENTS OK 10/10` (projet `demo-paiements`, rien en ligne). Dit : contre-paiement avant son original refusé ; pièce réécrite avec le dernier paiement périmé refusée ; relue acceptée ; annulation à solde non nul refusée ; retrait (contre-paiement puis annulation) accepté.
- BUGS OK : 2197 bugs, 515 ouverts.
- Pas de capture (consigne) : preuve en ligne par le pilote, 390 px : Modifier d'un achat payé, date 19.11 → 14.11 (aucun bandeau, Opérations, fiche et paiements au 14.11) ; Saisir à la main › Remboursement › chercher « masque », « 23 », « Brau » ; retirer un achat avec remboursement ; carte d'une chose au Calendrier (−2,50) ; HABITUELS avec trois récurrentes ; compte TWINT ; Modifier d'un Apport.

## Décisions et limites
- « Toutes ses écritures dans un seul lot atomique » (E43-1) n'est pas possible avec les règles telles qu'elles sont, et c'est voulu par elles : un lot n'accepte qu'UN paiement par pièce, et le solde réglé / le dernier paiement ne peuvent pas changer en même temps que la date ou un autre champ de la pièce (`hasOnly(['settlementBalanceCents','lastPaymentId'])`). Déplacer une date = deux paiements + la pièce = trois lots minimum. Ce qui est garanti : chaque lot respecte les règles (rejoué), et une erreur en cours de route dit ce qui est déjà écrit (`executerPlan`).
- Le bandeau « Enregistrement refusé : Missing or insufficient permissions. » reste en anglais pour tout autre refus du serveur : il vient de `firestoreRepo.ts` (hors de ma voie).
- E43-5 : pas de « changer » sur l'Apport, volontaire (ecr4) : un apport ne devient pas une vente ou une autre entrée (autre grand livre). La feuille est autrement la même que la saisie.
- E43-3 : « De ma poche » ne revient que si c'est le dernier mouvement réel unique ; la règle garantit une place aux mouvements réels, pas à un nom précis.
- E41-1 : si le retrait reste muet en ligne alors que E43-1 est réglé, c'est une autre cause : lire alors la console (refus du serveur) — le serveur simulé ne la montre pas.
- DÉCISION À PRENDRE : aucune.

CONNAISSANCE : une pièce écrite en entier (`put` sans merge) emporte tous ses champs, dont `settlementBalanceCents` et `lastPaymentId` que les paiements changent côté serveur ; les règles refusent la copie périmée. Après un paiement, toujours relire la pièce vivante avant de l'écrire. Les anciennes pièces écrivent leur jour « jj.mm.aaaa » : tout filtre de date passe par `isoDate`, jamais par une regex aaaa-mm-jj.

LEÇON PROPOSÉE : un test de correction qui écrit des paiements tourne contre un dépôt qui applique les règles (serveur simulé `tests/unit/ecr5ServeurSimule.ts`, puis émulateur `tests/rules/rejouer-paiements.mjs`) : le faux dépôt qui ignore `adjustNumber` a laissé passer E41-5 vert en local, refusé en ligne.
