# Voie c — Finances, Dépense, Clients, Réglages, menu ⋮

Base : `48a3fee3`, branche `worktree-agent-a5accbe100e6927c6`.
Commits : `07c0eece` (B + TE-55), `341363c8` (clients, facture, réglages), `55c25391` + `0bbc024a` (réglages brasserie), `5ffcc57b` (Dépense), `6b575db2` (sens, zéro, avoir), `603e7c37` (solde, montants, période, contact), `eae00e02` (tarifs, notice, tests clients).

`node_modules` : lien vers celui du dépôt principal (absent de la copie). Aucune capture prise (pas de serveur de dev) : les corrections visuelles (TE-1, BE-75) sont jugées par calcul de spécificité CSS et par test de rendu, pas par image ; à regarder avant déploiement (L12).
Tests non chargés ici, faute de `firebase-admin` dans `functions/` : `financeDocumentHistory`, `financeDocumentMigration`, `financeAssistantContext`, et 6 fichiers de `tests/unit/depense` (serveur, learn, lecture-d, aiTask, lecture-serveur, lecture-coupee). `tests/unit/depense` : 2467 verts, ces 6 fichiers seuls en échec de chargement. `tests/integration/expense*` : seuls les échecs connus (expenseSheet 8, expenseSheetMouture 2).

Règles posées (une règle par famille) :
- `src/domain/finance/bornesFinance.ts` : vente 50 000 CHF, pièce 250 000 CHF, date de pièce de 2000 à +1 an, taux de TVA 15 % au plus ; chaque borne cite sa source ou dit « estimée ». Appliquées dans `validateFinanceTransaction` (toute écriture), donc par la vente, la dépense, l'apport, l'avoir et la modification.
- `montantChf` (virgule) pour toute phrase de montant ; `iban.ts` (mod 97) ; `clientPhone.ts` ; `categorieChangeLeSens` / `ventilationAvoir` dans `ledger.ts` ; `ChampNombre` (refus visible) gagne `maxDecimales`.

id | statut
---|---
MV-38 | corrigé (07c0eece) — vente > 50 000 CHF refusée à l'écriture ; au comptoir le champ le dit, le bouton reste éteint (`venteComptoirBornes`)
TE-61 | corrigé (07c0eece) — confirmation avant de passer à l'autre signataire (`headerSignataire`)
TE-1 | corrigé (341363c8) — `.bg-ebc-straw *` (themes.css) forçait le blanc à égalité de spécificité ; préfixe `:root` dans `clients.css` ; capture non prise
TE-2 | corrigé (341363c8) — `lireTelephone` : « abc » refusé, `tel:` propre, WhatsApp avec indicatif 41 (`clientPhone`)
TE-6 | corrigé (341363c8) — prix unitaire vide au départ, total « À compléter » (`factureClientSaisie`)
TE-8 | corrigé (341363c8) — virgule ; la copie dit « Copiée » ou « refusée » (role=status)
TE-9 | goût — créer un tarif depuis Prix et marges : place et geste à montrer au brasseur (le « + » le permet déjà)
AM-48 | corrigé (55c25391, 0bbc024a) — volume habituel ≤ capacité du fermenteur, bloque l'enregistrement ; le repère de mousse reste un avertissement (un test existant exige que le repère ne redimensionne jamais en silence)
AM-50 | corrigé (55c25391) — évaporation hors 0 à 30 L/h et absorption hors 0 à 3 L/kg exclues de la calibration, avec la raison (`reglagesBrasserieBornes`)
AM-57 | corrigé (07c0eece) — date avant 2000 ou à plus d'un an refusée à l'écriture (`bornesFinance.test`)
AM-58 | corrigé (5ffcc57b) — assujetti sans TVA lue : refus avec consigne (0 saisi en le sachant passe) (`tvaAssujetti`)
AM-59 | corrigé (341363c8) — taux de TVA des Réglages 0 à 15 % avec refus visible, plus de remplissage silencieux ; « 2,6 % Bière » remplacé par « denrées »
AM-62 | corrigé (6b575db2) — catégories rangées par sens (charge, recette, apport) ; changer de sens refusé à l'interface et dans `updateTransaction`
AM-63 | corrigé (6b575db2) — `getTransactions` ne cache plus l'écriture à 0 (`storage.test`)
AM-64 | corrigé (6b575db2) — un avoir reprend la TVA de sa facture au prorata (`ventilationAvoir`)
AM-66 | corrigé en partie (341363c8) — IBAN validé aux Réglages et n'est imprimé que valide, n° TVA exigé et imprimé pour un assujetti ; QR-facture et référence structurée : goût/produit (le service dit « pas de QR décoratif »)
AM-68 | reste (produit) — lier la vente comptoir au stock de bière est une fonction, pas une correction
AM-70 | reste (fichier d'une autre voie) — Fûts, voie d
AM-71 | corrigé (341363c8) — rattachement par mot entier, nom le plus long, ventes annulées et avoirs exclus (`clientsVentes`)
LT-6 | reste (lecture Gemini, hors périmètre)
TE-28 | reste (fichier d'une autre voie) — paliers de recette
TE-55 | corrigé (07c0eece) — « dans Drive » seulement sur preuve Drive, montant à la virgule, champ vide au départ
TE-57 | non reproduit — la vente du comptoir (description et proofNotes au nom du client) se rattache : test `clientsVentes` ; durcie par AM-71
TE-58 | corrigé (341363c8) — `getAuditLogs` classe par date écrite puis identifiant (`storage.test`)
BR-51 | reste (fichier d'une autre voie) — brassins
BR-77 | reste (fichier d'une autre voie) — assistant eau
BR-79 | reste (fichier d'une autre voie) — assistant eau
BE-1 | reste (fichier d'une autre voie) — assistant eau
BE-3 | reste (fichier d'une autre voie) — assistant eau
BE-22 | corrigé (603e7c37) — verrou synchrone et contrôle du statut : un double toucher ne crée qu'une fiche (`contactConversionUnique`)
BE-32 | reste (fichier d'une autre voie) — brassins
BE-72 | corrigé (603e7c37) — le solde saisi mais pas confirmé se montre avec son montant, sa date et la consigne (`soldeDepartVisible`)
N-NOTE-6 | non reproduit — note de couverture, aucun défaut
B2-NOTE-1 | reste — à vérifier sur la vraie pièce 372765 (lecture), pas de pièce réelle ici
B2-NOTE-2 | reste — « +1 » à rejouer à la main sur le plateau
B2-NOTE-3 | reste — cibles tactiles du plateau, à mesurer sur capture
B2-NOTE-4 | goût — bande Levures : unité imprimée ou stock, sa maquette dit « sachets »
B2-NOTE-5 | goût — « Rattacher les 5 » : à confirmer au registre des décisions
B2-NOTE-6 | reste — rechargement en cours d'édition, brouillon non observable ici
B2-NOTE-7 | reste (fichier d'une autre voie) — `lectureMorceaux.ts`
B2-NOTE-8 | reste — pastille « 2 000 g → 2 Kg » qui coupe le nom, à voir sur capture
B2-NOTE-9 | goût — mouture proposée : suivre ou non la quantité du malt
B2-NOTE-10 | corrigé (5ffcc57b) — le plafond d'un montant de Dépense est celui de l'écriture (250 000 CHF), quantité 1 000 000 et prix 100 000 inchangés (sans donnée du domaine)
B2-NOTE-11 | reste — phrase d'écart du « Détail » (lecture à bandes)
B2-NOTE-12 | reste — « Annuler » du formulaire manuel
TL-NOTE-2 | reste : non traité (lecture Gemini, relecture des 13 pièces)
TL-NOTE-6 | reste : non traité (gestes à jouer en ligne)
GE-NOTE-4 | reste — modules `zxing-wasm`, `pdfjs-dist`, `firebase-admin` absents de cette copie ; vu ici : 9 fichiers de test non chargés (liste ci-dessus)
TE-NOTE-1 | reste : non traité (à jouer)
TE-NOTE-2 | reste : non traité (apps externes)
TE-NOTE-3 | reste : non traité (PDF : accord requis)
TE-NOTE-4 | reste : non traité (sites externes)
TE-NOTE-5 | reste : non traité (lié à TE-9)
TE-NOTE-7 | reste : non traité (suppression à l'accord du brasseur)
LL-NOTE-1 | reste : non traité (limite connue, découpe)
LL-NOTE-4 | reste : non traité (découpe)
LL-NOTE-5 | reste : non traité (question au brasseur)
SU-NOTE-6 | reste : non traité
BT-NOTE-2 | reste : non traité (outils houblons)
BT-NOTE-3 | reste : non traité (Gemini)
TL-46 | reste : non traité (produit, aucune décision écrite)
TL-48 | reste : non traité (non reproduit en local d'après le registre)
TE-3 | corrigé (341363c8) — « — » quand le client n'a aucune vente
TE-4 | corrigé (341363c8) — segment « Tous » sans nombre
TE-5 | non reproduit — l'identifiant se calcule sur les clients enregistrés et rien n'est écrit à l'annulation : le suivant reste CL-006
TE-7 | corrigé en partie (341363c8) — « −1 » et « abc » refusés en le disant, produit choisi reste affiché ; le retour à « Choisir un tarif » est corrigé, pas la liste de tarifs vide
TE-11 | reste (fichier d'une autre voie) — carte de recette
AM-49 | corrigé en partie (55c25391) — évaporation bornée à 30 L/h ; capacités à 10 000 L laissées (pas de donnée du domaine)
AM-67 | corrigé (341363c8) — article à 0 CHF ou sans prix refusé, dates de facture et d'échéance bornées
AM-69 | reste — espèces à 5 centimes : demande une écriture d'arrondi côté vente (Dépense l'a déjà)
AM-72 | non reproduit — `beerTaxAnnualReductionPct` et `beerTaxReductionYear` sont lus (`ClientsTab`, `calculateSwissBeerTax`) ; les taux légaux restent codés, justes ; seule la périodicité attribuée n'alimente pas de calcul
AM-73 | goût — paiement antérieur à la pièce : refuser bloque un acompte légitime, au brasseur de dire
DP-NOTE-1 | reste : non traité (test instable)
MV-36 | corrigé (55c25391) — chauffe affichée au millième (0,433), la valeur gardée ne change qu'à la saisie
MV-39 | corrigé (341363c8) — virgule dans les messages de vente et du journal
MV-41 | corrigé (07c0eece) — dépense > 250 000 CHF refusée à l'écriture
MV-42 | corrigé (341363c8) — « Aucun litre conditionné en AAAA » et « — », plus de « 0.00 CHF »
LT-4 | reste : non traité (outil CDP probable)
LT-5 | reste : non traité (monitoring)
TE-37 | corrigé en partie (603e7c37) — « Convertir en client », « Passer dans mes recettes » ; « Réfléchir à mes projets · Avec Gemini » non touché
TE-56 | reste — texte libre pour le client d'une vente : choisir parmi les fiches est un geste à montrer (goût)
TE-59 | corrigé en partie (341363c8) — virgule dans le journal ; deux noms de l'écran et références techniques restent
TE-60 | reste : non traité (le journal n'a aucun geste d'annulation, voulu)
TE-63 | reste : non traité (lecture seule, deux noms)
TE-64 | reste : non traité (trois ratios d'eau)
RF-4 | reste : non traité (lecture)
RF-14 | reste : non traité (lecture)
RF-15 | reste : non traité (lecture)
BR-43 | reste (fichier d'une autre voie) — assistant houblons
BR-60 | reste (fichier d'une autre voie) — journal du brassin
BR-85 | reste (fichier d'une autre voie) — assistant eau
BR-93 | reste (fichier d'une autre voie) — Fûts
BE-9 | reste (fichier d'une autre voie) — assistant eau
BE-26 | corrigé en partie (603e7c37) — les montants de feuilles de finances refusent le millième ; l'atelier R&D (essais de tarifs) non touché
BE-37 | reste : non traité (brassin)
BE-41 | reste (fichier d'une autre voie) — journal du brassin
BE-61 | reste — à confirmer par le brasseur (Entrée enregistre la feuille)
BE-62 | reste : non traité (fin de feuille sous la barre, CSS à voir sur capture)
BE-63 | goût — quatre noms pour l'écran Annuel
BE-64 | corrigé (603e7c37) — « 0,004 » refusé en le disant sur les montants non signés ; le solde signé (NumberInput) non
BE-65 | corrigé en partie (603e7c37) — même correction que BE-72
BE-66 | corrigé en partie (341363c8) — TVA et total TTC de la fenêtre « Modifier l'écriture » avec virgule
BE-67 | reste : non traité (formats de date)
BE-68 | reste : non traité (fin de feuille sous la barre, CSS)
BE-69 | reste : non traité (contraste cave)
BE-70 | corrigé (603e7c37) — un mois hors 2000 à +1 an n'est pas retenu, le champ revient au mois courant
BE-71 | corrigé (603e7c37) — « −1 » et « 0,004 » refusés en le disant sur l'apport ou prélèvement
BE-73 | reste : non traité (contraste cave)
BE-74 | goût — trois noms pour l'écran Finances
BE-75 | corrigé (eae00e02) — espace entre le message et « Fermer » (capture non prise)
BE-77 | reste (fichier d'une autre voie) — Fûts
BE-98 | corrigé (eae00e02) — prix unitaire borné à 10 000 CHF, message qui dit la borne
BE-99 | reste : non traité (Enregistrer posé sur le « + » au 390, CSS à voir sur capture)

DÉCISION À PRENDRE : AM-73 et AM-69 — refuser un paiement antérieur à la pièce bloque un acompte ; arrondir les espèces à 5 centimes demande une écriture d'arrondi. Recommandation : avertir sans bloquer pour AM-73, ajouter la ligne d'arrondi à la vente pour AM-69.
DÉCISION À PRENDRE : les bornes 50 000 CHF (vente), 250 000 CHF (pièce) et 15 % (TVA) sont estimées, sans donnée du brasseur ; à confirmer ou ajuster dans `bornesFinance.ts` (un seul endroit).

LEÇON PROPOSÉE : le Bash de ce poste perd les barres inverses même dans un heredoc entre guillemets (`\d` devenu `d` dans une regex, constaté trois fois dans cette voie) : écrire tout code à regex avec Write ou Edit, jamais par un script Bash. Un correctif de comportement doit aussi rejouer les tests qui figent l'ancien texte (cinq tests d'affichage ont dû être alignés).
CONNAISSANCE : en clair, `themes.css` force `color: white` sur `.bg-ebc-straw` et ses enfants (spécificité 0,3,0) ; une règle propre à un composant qui change le fond d'un contrôle segmenté doit dépasser cette spécificité (préfixe `:root`).
