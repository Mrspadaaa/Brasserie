# Voie c — Finances, Dépense, Clients, Réglages, menu ⋮ (état en cours, tenu à jour à chaque commit)

Base : `48a3fee3`, branche `worktree-agent-a5accbe100e6927c6`. Commits : `07c0eece` (B + TE-55), `341363c8` (clients, facture, réglages).
`node_modules` : lien vers celui du dépôt principal (absent de la copie). Tests rejoués, verts : bornesFinance, iban, clientPhone, clientsVentes, clients, factureClientSaisie, venteComptoirBornes, headerSignataire, incomeProofFlows, inputProtection, storage, finance*. Non chargés ici : `financeDocumentHistory`, `financeDocumentMigration` (`firebase-admin/firestore` absent, `functions/` sans modules). Aucune capture prise (pas de serveur de dev) : les corrections visuelles (TE-1) sont jugées par calcul de spécificité CSS, pas par image.

Règles posées : `src/domain/finance/bornesFinance.ts` (montant d'une vente 50 000 CHF, d'une pièce 250 000 CHF, date de pièce de 2000 à +1 an, taux de TVA 15 % au plus), appliquées dans `validateFinanceTransaction` (toute écriture) ; `montantChf` (virgule) ; `iban.ts` ; `clientPhone.ts`.

id | statut
---|---
MV-38 | corrigé (07c0eece) — vente > 50 000 CHF refusée par `validateFinanceTransaction` ; au comptoir le champ le dit et le bouton reste éteint (`tests/integration/venteComptoirBornes`)
TE-61 | corrigé (07c0eece) — confirmation avant de changer de signataire (`tests/integration/headerSignataire`)
TE-1 | corrigé (341363c8) — `.bg-ebc-straw *` forçait le blanc à égalité de spécificité ; préfixe `:root` dans `clients.css` (capture non prise)
TE-2 | corrigé (341363c8) — `lireTelephone` : refus de « abc », `tel:` propre, WhatsApp avec indicatif 41 (`tests/unit/clientPhone`)
TE-6 | corrigé (341363c8) — prix unitaire vide au départ, total « À compléter »
TE-8 | corrigé (341363c8) — virgule décimale, copie : retour « Copiée » ou « refusée » (role=status)
TE-9 | goût — créer un tarif depuis Prix et marges : place et geste à montrer au brasseur (le « + » le permet déjà)
AM-48 | à traiter
AM-50 | à traiter
AM-57 | corrigé (07c0eece) — date de pièce avant 2000 ou à plus d'un an refusée à l'écriture (`bornesFinance.test`)
AM-58 | à traiter
AM-59 | corrigé (341363c8) — taux de TVA des Réglages 0 à 15 % avec refus visible, plus de remplissage silencieux ; libellés « 2,6 % Bière » remplacés (denrées)
AM-62 | à traiter
AM-63 | à traiter
AM-64 | à traiter
AM-66 | corrigé en partie (341363c8) — IBAN validé (mod 97) aux Réglages et à l'impression, n° TVA exigé et imprimé pour un assujetti ; QR-facture et référence structurée : goût/produit (le service dit « pas de QR décoratif »)
AM-68 | reste (produit) — vente comptoir sans quantité ni lot : lier la vente au stock de bière est une fonction, pas une correction
AM-70 | reste (fichier d'une autre voie) — Fûts, voie d
AM-71 | corrigé (341363c8) — rattachement par mot entier, nom le plus long, ventes annulées et avoirs exclus (`tests/unit/clientsVentes`)
LT-6 | reste (lecture Gemini, hors périmètre)
TE-28 | reste (fichier d'une autre voie) — paliers de recette
TE-55 | corrigé (07c0eece) — « dans Drive » seulement sur preuve Drive, montant au centime avec virgule, champ vide au départ
TE-57 | non reproduit — la vente du comptoir (description + proofNotes au nom du client) se rattache : test `clientsVentes` ; durcie par AM-71
TE-58 | corrigé (341363c8) — `getAuditLogs` classe par date écrite, puis identifiant (`storage.test`)
BR-51 | reste (fichier d'une autre voie) — brassins
BR-77 | reste (fichier d'une autre voie) — assistant eau
BR-79 | reste (fichier d'une autre voie) — assistant eau
BE-1 | reste (fichier d'une autre voie) — assistant eau
BE-3 | reste (fichier d'une autre voie) — assistant eau
BE-22 | à traiter
BE-32 | reste (fichier d'une autre voie) — brassins
BE-72 | à traiter
N-NOTE-6 | à traiter
B2-NOTE-1 | à traiter
B2-NOTE-2 | à traiter
B2-NOTE-3 | à traiter
B2-NOTE-4 | à traiter
B2-NOTE-5 | à traiter
B2-NOTE-6 | à traiter
B2-NOTE-7 | reste (fichier d'une autre voie) — `lectureMorceaux.ts`, lecture
B2-NOTE-8 | à traiter
B2-NOTE-9 | à traiter
B2-NOTE-10 | à traiter
B2-NOTE-11 | à traiter
B2-NOTE-12 | à traiter
TL-NOTE-2 | reste : non traité
TL-NOTE-6 | reste : non traité
GE-NOTE-4 | reste : non traité
TE-NOTE-1 | reste : non traité
TE-NOTE-2 | reste : non traité
TE-NOTE-3 | reste : non traité
TE-NOTE-4 | reste : non traité
TE-NOTE-5 | reste : non traité
TE-NOTE-7 | reste : non traité (suppression à l'accord du brasseur)
LL-NOTE-1 | reste : non traité
LL-NOTE-4 | reste : non traité
LL-NOTE-5 | reste : non traité
SU-NOTE-6 | reste : non traité
BT-NOTE-2 | reste : non traité
BT-NOTE-3 | reste : non traité (Gemini)
TL-46 | reste : non traité
TL-48 | reste : non traité
TE-3 | corrigé (341363c8) — « — » quand le client n'a aucune vente
TE-4 | corrigé (341363c8) — segment « Tous » sans nombre
TE-5 | à traiter
TE-7 | corrigé en partie (341363c8) — prix « abc » ou « −1 » refusé en le disant (ChampNombre), produit choisi reste affiché
TE-11 | reste : non traité
AM-49 | à traiter
AM-67 | corrigé (341363c8) — article à 0 CHF ou sans prix refusé, dates bornées (2000 à +1 an)
AM-69 | à traiter
AM-72 | à traiter
AM-73 | à traiter
DP-NOTE-1 | reste : non traité
MV-36 | à traiter
MV-39 | corrigé (341363c8) — virgule dans les messages de vente et du journal
MV-41 | corrigé (07c0eece) — dépense > 250 000 CHF refusée à l'écriture
MV-42 | corrigé (341363c8) — « Aucun litre conditionné en AAAA » et « — », plus de « 0.00 CHF »
LT-4 | reste : non traité
LT-5 | reste : non traité
TE-37 | reste : non traité
TE-56 | reste : non traité
TE-59 | corrigé en partie (341363c8) — virgule dans le journal ; les deux noms de l'écran et les références techniques restent
TE-60 | reste : non traité
TE-63 | reste : non traité
TE-64 | reste : non traité
RF-4 | reste : non traité
RF-14 | reste : non traité
RF-15 | reste : non traité
BR-43 | reste (fichier d'une autre voie) — assistant houblons
BR-60 | reste : non traité
BR-85 | reste (fichier d'une autre voie) — assistant eau
BR-93 | reste (fichier d'une autre voie) — Fûts
BE-9 | reste (fichier d'une autre voie) — assistant eau
BE-26 | reste : non traité
BE-37 | reste : non traité
BE-41 | reste : non traité
BE-61 | reste : non traité
BE-62 | reste : non traité
BE-63 | reste : non traité
BE-64 | reste : non traité
BE-65 | reste : non traité
BE-66 | corrigé en partie (341363c8) — TVA et total TTC de la fenêtre « Modifier l'écriture » avec virgule
BE-67 | reste : non traité
BE-68 | reste : non traité
BE-69 | reste : non traité
BE-70 | reste : non traité
BE-71 | reste : non traité
BE-73 | reste : non traité
BE-74 | reste : non traité
BE-75 | reste : non traité
BE-77 | reste (fichier d'une autre voie) — Fûts
BE-98 | reste : non traité
BE-99 | reste : non traité

LEÇON PROPOSÉE : le Bash de ce poste perd les barres inverses même dans un heredoc entre guillemets (`\d` devenu `d` dans une regex, constaté deux fois) : écrire tout code à regex avec Write/Edit, jamais par heredoc.
CONNAISSANCE : en clair, `themes.css` force `color: white` sur `.bg-ebc-straw` et ses enfants (spécificité 0,3,0) ; une règle propre à un composant qui change le fond d'un contrôle segmenté doit dépasser cette spécificité (préfixe `:root`).
