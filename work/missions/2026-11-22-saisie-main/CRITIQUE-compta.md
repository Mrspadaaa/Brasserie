OK — classement compta : v01, v04, v05, v02, v03, v08, v06, v07 ; 1 bloquant commun (apport compté dans Mon mois), 3 bloquants de nature (Remboursement en recette, v07 devinée, v08 genre et sens contradictoires)

# Saisie à la main : regard de fiduciaire (22.11)

Persona : fiduciaire d'une micro-entreprise suisse.
Légende : **B** bloquant (erreur comptable, ou valeur fausse au regard du modèle) ; **m** mineur ; **d** doute, non compté.

Captures regardées :
- les 7 planches en clair (v01 à v07) ;
- v08 au repos et en (a) ;
- la plainte `00-plainte.jpg`.

Code relu dans `port-carnet/src` :
- `ledger.ts` (`transactionKind`, `transactionDirection`, `refundLinkIssue`) ;
- `periodeSynthese.ts:155` et `effetPiece.ts` ;
- `forecast.ts` (`planOccurrences`, l. 182 à 200) ;
- `venteSuites.ts` (`planSoldeParDepense`) ;
- `types.ts` (`FinancialPlan`) et `types/index.ts` (`FinanceCategory`, `isTvaRegistered`).

## Constats vérifiés dans le code, communs aux 8 versions

1. **B — Apport et prélèvement : la valeur de Mon mois est fausse.**
   - Les 8 versions montrent « Mon mois +2 000,00 » en vert pour l'apport (b).
   - Or `periodeSynthese.ts:155` saute `contribution` et `withdrawal`. L'onglet Mon mois calculera donc un écart de 0 et non +2 000.
   - C'est aussi juste en comptabilité : un apport de l'exploitant n'est ni une recette ni un produit, il touche les fonds propres.
   - L'afficher comme une vente gonfle le chiffre d'affaires lu (seuil TVA, impôt).
   - Correction : pastille neutre « Caisse +2 000,00 · hors résultat », ou rien dans Mon mois. Même règle pour Prélèvement (−300).
2. **B — « Remboursement » est écrit comme une recette.**
   - Dans le HTML, le genre vaut `s:'in', c:'div'`. Le remboursement d'un achat deviendrait donc une recette « divers » : chiffre d'affaires et charges gonflés en brut tous les deux.
   - Dans le modèle, `refund` est un avoir. Il exige `refundOfId` vers une facture active (`refundLinkIssue`). Son sens est déduit de cette facture : remboursement d'un fournisseur = entrée, remboursement à un client = sortie.
   - Correction, sans champ neuf : la tuile ouvre « De quelle pièce ? » (liste des achats et ventes récents), et le sens suit.
   - Sans pièce d'origine, ce n'est pas un remboursement. C'est un prêt, des frais avancés (un apport) ou du divers, et il faut le dire en sous-texte.
   - La tuile est visible dans v01, v03 et v05. La liste des genres est partagée par toutes les versions.
3. **m — La date d'ancrage du rythme est figée sur le jour de saisie (« le 22 »).**
   - Un loyer dû le 1er mais saisi le 22 placerait toutes les échéances du Calendrier le 22 : la courbe de caisse aurait 3 semaines d'écart (`planOccurrences` ancre sur `plan.date`).
   - Le jour d'échéance doit se toucher. Seule v03 le montre (« dès le [22.11] »).
   - Le choix de date passe par la frise partagée (GESTE-DATE-PARTOUT, 22.11), pour la fin comme pour le début.
4. **m — Le genre du plan est perdu.**
   - `FinancialPlan` n'a pas de `subcategory`. « Loyer », « Abonnement » et « Salaire » partent tous en `chargesFixes`, et seul le titre les distingue.
   - Les occurrences réglées plus tard ne sauront plus si c'est un loyer.
   - C'est le seul champ neuf que je juge utile : `FinancialPlan.subcategory` (ou `genre`). Voir plus bas.
5. **m — « À payer » combiné à « chaque mois » n'est montré nulle part.**
   - C'est le cas courant : le bail démarre le 1.12 et rien n'est encore payé.
   - Attendu : un plan seul, aucune transaction, une échéance 1.12 sans ✓ au Calendrier, et dans Mon mois « prévu », pas « dépensé ».
6. **m — « Salaire » est ambigu pour une raison individuelle.**
   - L'exploitant ne se verse pas de salaire : ce qu'il se verse est un prélèvement.
   - Libellé attendu : « Salaire (employé) », avec un rappel que les charges sociales (AVS/AI/APG, caisse de compensation) se saisissent à part, en « Trimestre ».
7. **m — Aucun genre pour « Impôts, TVA, AFC ».**
   - Un décompte TVA payé tomberait dans « Autre », donc dans `divers`, comme une charge, ce qui est faux si l'entreprise est assujettie.
   - Le modèle a déjà `source:'tax'` pour les plans. Si `isTvaRegistered` est faux, ce genre se cache.
8. **m — Le justificatif a disparu.**
   - La case « Sans justificatif, c'est normal » de l'écran actuel n'est plus dans aucune version.
   - L'icône document en haut à droite suffit pour joindre. Il manque l'état « pièce manquante », à signaler doucement dans Opérations et non à imposer ici.
   - Pour un loyer, le bail joint à la première occurrence vaut pour toutes : aucun champ neuf.
9. **m — La TVA n'apparaît que dans v01 (pli « Fournisseur, TVA, référence »).**
   - Règle attendue : si `fiscal.isTvaRegistered` est faux, aucun champ TVA (déjà écrit dans le type).
   - Si l'entreprise est assujettie, un taux pré-rempli par genre :
     - loyer à 0 % (exonéré, art. 21 LTVA, sauf option) ;
     - abonnement à 8,1 % ;
     - vente de bière à 8,1 % (les boissons alcooliques sont exclues du taux réduit de 2,6 %).
10. **m — Vente à la main.**
    - Elle contourne la Caisse : le stock de bouteilles n'est pas décrémenté et il n'y a pas de client.
    - Le libellé doit le dire (« Vente sans articles »), ou la tuile propose « Ouvrir la Caisse ».
11. **m — Achat sans catégorie visible.**
    - Le genre pose `brassage` par défaut. Une cuve de 3 000 CHF saisie à la main deviendrait une charge au lieu d'un matériel (immobilisation).
    - Il faut une puce de catégorie (Brassage · Matériel · Nettoyage · Rénovation) sous l'achat, déjà dans `FinanceCategory`.
- **d** — Pour la récurrence « Payé aujourd'hui », l'enregistrement doit écrire le plan et une transaction liée `planId` + `occurrenceId`. Sinon le Calendrier compte deux fois −400 le 22.11. `forecast.ts:182-189` le gère si le lien est posté ; c'est à prouver au banc.
- **d** — Pour l'apport une fois, « Calendrier 22.11 ✓ une fois » : la courbe de caisse lit les plans actifs. Un apport sans plan y paraît-il ? À vérifier.
- **d** — Modifier une occurrence (loyer à 420 dès janvier, un mois sauté) n'est montré nulle part. C'est normal pour une saisie. La confirmation pourrait offrir « Modifier la suite », qui clôt le plan (`endDate`) et en ouvre un neuf : aucun champ neuf.

## Champs neufs de NOTES.md : utiles ou évitables

| Champ | Verdict |
|---|---|
| Catégorie « Salaires » ou « Abonnements » | évitable : `subcategory` de `chargesFixes`. Mais **`FinancialPlan.subcategory` est utile** (point 4) |
| Moyen « Carte » | évitable : une carte de débit vaut `bank` ; une carte de crédit est rare (`other`) |
| Remboursement sans facture | à **refuser** : sans pièce d'origine, ce n'est pas un avoir (point 2) |
| Apport récurrent | porté : plan `in`/`apports`. `transactionKind` retombe sur `contribution` par la catégorie ; à vérifier si `finance.kind` est forcé ailleurs |
| v04 : épingler ou masquer un habituel | évitable au premier lot |
| v06 : rôle typé de la contrepartie | évitable : déduit du genre |
| v07 : mois à la carte | évitable : deux plans annuels, ou « Trimestre » |

## Par version

### v01 — Le genre d'abord (1er)
1. B — Point 2 : Remboursement est rangé sous « Ça rentre » ; ce sens est faux pour un avoir client.
2. B — Point 1 : « Mon mois +2 000,00 » pour l'apport.
3. m — « Autre » n'est que sous « Ça rentre » : une sortie diverse n'a pas de tuile (v05 l'a des deux côtés).
4. m — Prélèvement et Achat ont la même bordure ambre. Le prélèvement mérite le sous-texte « hors résultat » (comme la pastille « Apports privés »).
5. m — « le 22 » n'est pas touchable (point 3).
- d — Le pli « Fournisseur, TVA, référence » est bien placé. Il se cache si l'entreprise n'est pas assujettie.

C'est la meilleure base comptable : nature explicite rangée par sens, « Payé aujourd'hui / À payer / Banque », fin « sans fin · une date · 12 fois », TVA repliée.

### v04 — Habituels en un toucher (2e)
1. B — Point 1 : apport dans Mon mois.
2. m — « solde l'échéance du 22.11 » : `planSoldeParDepense` **exclut les plans récurrents** (`!p.recurrence`) et ne prend que `source manual|equipment`.
   - Le lien à une occurrence de loyer existe dans le modèle (`occurrenceId`, `forecast.ts:189`), mais aucun appariement automatique ne le pose.
   - C'est du code à écrire, pas un champ neuf. NOTES.md affirme le contraire.
3. m — Un habituel déjà au plan ne doit pas recréer de plan. La ligne « Logiciel de compta · Nouveau » doit le dire avant Enregistrer.
4. m — Les tuiles de genre défilent (« Appo… » coupé), donc on ne voit pas Prélèvement ni Remboursement.

C'est la meilleure pour le rapprochement : on solde une échéance prévue au lieu d'en créer une seconde.

### v05 — Deux côtés (3e)
1. B — Point 2 : Remboursement est seulement « Ça rentre ».
2. B — Point 1.
3. m — Pas de « À payer » ni de moyen de paiement.
4. m — « → oct. 2027 » est affiché, mais aucun réglage de fin n'est visible.

Le sens est impossible à confondre (côté vert et côté ambre), et « Autre » existe des deux côtés.

### v02 — ± sur le montant (4e)
1. B — Point 1.
2. m — Bascule ± et puce de genre indépendantes : choisir Apport puis « − » donne quoi ? Il faut lier les deux (Apport + − devient Prélèvement, annoncé à l'écran) ou désactiver.
3. m — Ni « À payer », ni moyen, ni TVA.
4. m — Les puces de genre ne sont pas groupées par sens ; seul un point de couleur les distingue.

### v03 — Phrase à trous (5e)
1. B — Points 1 et 2.
2. m — « Je paie » en (c) contre « J'ai payé » en (a). Le temps du verbe porte le statut de règlement sans le dire. Il faut le rendre explicite : « J'ai payé » = payé, « Je dois payer » = à payer.
3. m — Ni moyen, ni TVA, ni fournisseur.

C'est la seule où la date de départ est un trou touchable (« dès le 22.11 ») : c'est la bonne réponse au point 3.

### v08 — Pavé de caisse (6e)
1. B — Genre et touche de sens peuvent se contredire.
   - Avec Loyer choisi, « + Reçu » reste vif.
   - Loyer reçu (sous-location : une recette) ou Achat reçu (un avoir ?) : la nature comptable n'est pas définie.
   - Correction : la touche contraire se grise, ou se renomme selon le genre (Apport : « + Reçu » / « − Retiré », c'est-à-dire prélèvement).
2. B — Point 1.
3. m — Pas de « À payer » : la touche dit « Payé ».

### v06 — Qui paie qui ? (7e)
1. B — Point 1.
2. m — Aucun employé dans le schéma : Salaire est absent.
3. m — Le remboursement d'un fournisseur (flèche inversée) n'est pas montré.
4. m — Lent pour un achat : contrepartie, puis montant, puis motif.
- d — C'est le seul schéma qui pourrait dire « Toi → Fournisseur pour L'Affinée », c'est-à-dire des frais payés de sa poche (voir Greffes).

### v07 — Quand ça tombe ? (8e)
1. B — La nature est **devinée** à partir du texte « Pour quoi ? ».
   - « + 2 000 » avec « Versement Paul » : recette ou apport ? Seul le badge le dit, et l'utilisateur ne l'a pas choisi.
   - C'est l'erreur même de sa plainte (« dire si c'est une vente ou un achat… un apport »).
   - Correction : des puces de genre sous le ±.
2. B — Point 1.
3. m — Pas de moyen, pas de TVA.

Le calcul Σ 12 mois est juste : 12 × 29,90 = 358,80 et 12 × 400 = 4 800.

## Classement
1. **v01** : nature et sens explicites ; payé, à payer et banque ; fin de récurrence complète.
2. **v04** : rapproche une échéance existante ; il faut un appariement des plans récurrents.
3. **v05** : sens impossible à confondre ; il manque « à payer » et le moyen.
4. **v02** : rapide, mais ± et genre peuvent se contredire.
5. **v03** : date de départ éditable ; statut porté par le seul temps du verbe.
6. **v08** : un genre et un sens contradictoires sont possibles.
7. **v06** : bonne lecture privé contre entreprise ; lent, salaire absent.
8. **v07** : nature devinée.

## Greffes
| Idée | Origine | Reçue par |
|---|---|---|
| Jour d'échéance touchable « dès le [1.12] », par la frise partagée | v03 | v01, v04 |
| Solder une échéance prévue (`occurrenceId`) au lieu de créer une transaction libre | v04 | v01 |
| « Autre » des deux côtés | v05 | v01 |
| Σ 12 mois sous la récurrence (charge annuelle d'un loyer ou d'un abonnement) | v07 | v01, v04 |
| « Payé de ma poche » comme moyen : écrit la dépense + l'apport lié, au lieu d'un faux remboursement plus tard | v06 (« Toi ») | v01, v04 (moyen à côté de « Banque ») |
| Pastille « hors résultat » pour Apport et Prélèvement, à la place de Mon mois | — (point 1) | toutes |
| Remboursement : « De quelle pièce ? », sens déduit | — (point 2) | toutes |
| Taux TVA pré-rempli par genre, caché si non assujetti | v01 (pli) | v04, v05 |
| Statut écrit dans la phrase de confirmation : « payé » / « à payer le 1.12 » | v03 | toutes |
