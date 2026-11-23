# Saisie à la main — 8 versions (22.11)

Fichier : `choix-saisie.html` (planche ; `?v=v03&s=a&t=cave` = un téléphone seul ; `&duo=1` = les 5 états).
Sa plainte : `00-plainte.jpg`, SPEC-BRASSEUR (fin), défaut SAISIE-SENS-RECURRENT.
Chaque version montre 5 états à 390 : repos, (a) loyer payé chaque mois, (b) apport reçu une fois,
(c) abonnement mensuel jusqu'en oct. 2027, puis la confirmation après Enregistrer (a).
Les montants sont des exemples (400,00 ; 2 000,00 ; 29,90). Aucun solde n'est inventé : seul l'effet du mouvement est montré.

## Base gardée (règle n° 1)
- p3c-3 (D248, D284) : c'est l'écran avec document. La saisie à la main en est le cas sans document. On garde :
  - la carte d'en-tête : nom, date en mono, grand montant en CHF ;
  - la pastille de règlement (« Payé aujourd'hui ») ;
  - l'icône document en haut à droite, qui bascule vers la lecture ;
  - le bouton noir ✓ (jaune en cave).
- Écran actuel (sa capture) : le pied « Mon mois −200,00 » + « Enregistrer » est gardé tel quel par v01, v02, v04, v06 et v07.
  - v05 le pose en colonne dans le côté choisi ;
  - v03 et v08 s'en écartent, raisons ci-dessous ;
  - « Fournisseur, TVA, référence » devient une ligne repliée (v01).
- Le choix de la saisie n'est pas au registre `ecrans.json` : rien à y comparer.
  `controle-choix` et `controle-panel` n'ont pas été joués, parce que le format de lot diffère.
- Couleurs :
  - sortie en ambre, comme la pastille actuelle de Mon mois ;
  - entrée en vert houblon ;
  - catégories aux couleurs de Finances (DESIGN.md) ;
  - rythme en bleu Finances.

## Ce que le modèle porte déjà (port-carnet/src), commun à toutes
- **Sens** : `TransactionFinance.kind` (`expense | income | contribution | withdrawal | refund`) et `FinancialPlan.direction` (`in | out`).
- **Genres** (correspondance `kind`, catégorie, sous-catégorie) :
  - Loyer, Abonnement, Salaire : `expense`, `chargesFixes`, `subcategory` « Loyer », « Abonnement » ou « Salaire » ;
  - Achat : `expense`, `brassage` (ou ses lignes) ;
  - Vente : `income`, `recettes` ;
  - Apport et Prélèvement : `contribution` ou `withdrawal`, `apports` (comme MovementSheet) ;
  - Autre : `divers`.
- **Récurrence** : `FinancialPlan` `source:'recurring'`, `recurrence:{frequency:'monthly'|'quarterly'|'yearly', endDate}`.
  - `planOccurrences` (forecast.ts) déroule les deux sens, ancrés sur `plan.date` (« le 22 ») ;
  - « 12 fois » donne une `endDate` calculée.
- **Payé aujourd'hui, puis chaque mois** : la transaction du jour est liée à son occurrence par `planId` et `occurrenceId`.
  ExpenseSheet le fait déjà (« Lier à une dépense prévue », `planSoldeParDepense`).
- **Payé ou à payer** : `paymentStatus`, `dueDate`. Moyen : `FinancialPayment.method` (`bank | cash | twint | other`).
- **Où ça apparaît** : Mon mois lit la transaction. Le Calendrier (`courbeCaisse`) lit les plans actifs.
  L'aperçu « Calendrier 22.11 ✓ 22.12 22.01 … » de chaque version ne fait que dérouler `planOccurrences`.

## Champs neufs possibles (accord de l'utilisateur, non bloquants pour la maquette)
- Une catégorie propre « Salaires » ou « Abonnements » : l'enum `FinanceCategory` ne les a pas. Sans elle, c'est la `subcategory` de `chargesFixes`.
- Le moyen « Carte » : absent de `method`. Les maquettes montrent « Banque ».
- Un remboursement sans facture d'origine : `refund` attend `refundOfId`. Sans original, il faut une règle neuve. À vérifier.
- Un apport récurrent : le plan `in`/`apports` le porte. Que son règlement passe bien en `contribution` est à vérifier dans le code.

## Par version
| v | Chaleur | Idée | Le modèle porte | Champ neuf |
|---|---|---|---|---|
| v01 Le genre d'abord | froide | 9 tuiles en tête, rangées « Ça sort » et « Ça rentre » ; le genre pose sens, catégorie, rythme ; puis la carte de p3c-3 et « Revient ? » en segments | tout | aucun |
| v02 ± sur le montant | froide | bascule − sort / + rentre collée au montant ; « Pour quoi » devine le genre par puces ; interrupteur « Revient » ; repos clavier ouvert, Entrée valide | tout | aucun |
| v03 Phrase à trous | tiède | « J'ai [payé] [400,00 CHF] pour [Loyer] [chaque mois] dès le [22.11] » ; chaque trou ouvre ses choix dans le plateau du bas | tout (phrase = vue) | aucun |
| v04 Habituels en un toucher | tiède | tes mouvements habituels en liste ; un toucher ouvre la ligne sur place, montant prérempli ; le loyer « solde l'échéance du 22.11 » ; un genre neuf part des tuiles | habituels tirés des transactions et des plans actifs ; lien par `planSoldeParDepense` | épingler ou masquer un habituel (option) |
| v05 Deux côtés | tiède | écran coupé vert/ambre ; le côté touché s'ouvre, l'autre devient une bande pour changer d'avis ; rythme en liste verticale | tout | aucun |
| v06 Qui paie qui ? | chaude | schéma : L'Affinée au centre, Toi, Bailleur, Fournisseur, Client, Service autour ; la flèche dit le sens (⇄), le montant est dessus, flèche en rafale = chaque mois | contrepartie = `vendor` ou `clientId` ; « Toi » = apport ou prélèvement | rôle typé de contrepartie, si on veut le garder (sinon déduit du genre) |
| v07 Quand ça tombe ? | chaude | 12 mois en tuiles, chaque échéance en barre ; fin par poignée (comme la frise des opérations) ; Σ 12 mois | rythmes réguliers + `endDate` | des mois choisis à la carte (ex. juin + déc.) : liste de dates, ou plusieurs plans |
| v08 Pavé de caisse | chaude | pavé intégré ; la touche de validation dit le sens : « − Payé » ou « + Reçu » ; Entrée = la touche du sens du genre | `NumPad` existe (saisie-mobile) | aucun |

Écarts à la base, avec leur raison :
- **v03** : le bouton passe en pleine largeur sous le plateau. La phrase occupe l'écran, et la pastille Mon mois la suit.
- **v08** : le bouton noir « Enregistrer » est remplacé par les deux touches de sens. C'est l'idée même : le sens ne peut plus être oublié.

## Contrôle SAISIE-SENS (3 touchers au plus après le montant, cas a)
| Version | Touchers pour (a) |
|---|---|
| v01 | Loyer, Mois, Enregistrer |
| v02 | Loyer, Revient, Enregistrer |
| v03 | Loyer, Mois, Enregistrer |
| v04 | la ligne, Enregistrer |
| v05 | Loyer (côté Sort), Chaque mois, Enregistrer |
| v06 | Bailleur, Mois, Enregistrer |
| v07 | −, Mois, Enregistrer |
| v08 | Loyer, Mois, − Payé |

Dans les huit, (b) et (c) tiennent aussi en 3 touchers.

## Contrôles joués (script `outils/cap.mjs`, Chrome sans tête)
- 40 téléphones rendus, 0 `input[type=number]`. Les montants sont en `inputmode="decimal"` ; v08 utilise un pavé en `inputmode="none"`.
- 0 débordement horizontal, hors des rangées défilantes voulues (v04, v08). 0 erreur console.
- Entrée valide : un écouteur `keydown` actionne le bouton du téléphone.
- Captures ouvertes et jugées : toutes les planches en clair ; v01, v03, v05, v06 et v08 en cave.
  Défauts corrigés après la première vue :
  - « Saisir un autre » était invisible ;
  - « Remboursement » était coupé ;
  - le montant de v07 débordait ;
  - le bouton de v05 était tronqué ;
  - l'icône chope se lisait « café » ;
  - les écrans avaient des vides : un aperçu Calendrier a été ajouté partout.

## Captures
- `captures/vNN-repos-{clair,cave}.png` et `captures/vNN-a-{clair,cave}.png` : 390 × 844 @2x, 32 fichiers.
- `captures/planche/vNN-{clair,cave}.png` : les 5 états côte à côte.

Prédiction : il comprend v01, v02 et v08 en 3 secondes (le sens se voit en couleur avant le montant). v04 le séduit pour le loyer et l'abonnement. v06 l'amuse mais il le trouvera lent pour un achat.

## Passe 2 (22.11) — après les trois critiques
v0 gardée : `scratchpad` (copie hors dépôt) ; la page passe 2 remplace `choix-saisie.html`. Chaque version porte une ligne « Corrigé : … » sous son titre.
Six états à 390 désormais : repos, (a), (b), (c), ✓ (a), et ✓ (b) qui montre l'apport **en caisse** (Caisse +2 000,00 ; Mon mois « inchangé »).

### Commun (toutes)
- Apport et Pour moi : jamais dans Mon mois (pastille « inchangé ») ; la confirmation montre « Caisse +2 000,00 · un apport n'est ni une vente ni une recette » (`periodeSynthese.ts:155`).
- Remboursement : plus jamais rangé en « Ça rentre » ; tuile neutre (pointillés) « d'une pièce · le sens suit » (`refundOfId`).
- « Prélèvement » devient « Pour moi » (sous-titre « prélèvement privé »). Salaire : icône mallette, sous-titre « employé ».
- Payé aujourd'hui / À payer / Banque dans toutes ; « dès le 22.11.26 » touchable ; fins préréglées « sans fin · 6 mois · 1 an · 12 fois · date ».
- Date de fin : la **frise partagée** du Calendrier (cadre bleu, deux poignées, pastille de période), montrée dans chaque état (c) ; en v07 aussi en (a).
- Aperçu Calendrier en 13 px noir ; Σ 12 mois (−4 800,00 ; −358,80) ; confirmation : Annuler · Saisir un autre · **Fermer** (primaire).
- Bouton qui dit le sens (« Payé −400,00 », « Reçu +2 000,00 ») en v01, v02, v04, v06, v07 ; v08 par ses touches.
- Cave : abandonnée (règle du brasseur, 22.11 : un seul thème, clair, téléphone d'abord). `cap.mjs` ne capture plus que le clair ; les anciennes captures `*-cave.png` sont périmées.

### Par version : voir la ligne « Corrigé » dans la page (même texte).

### Contrôles (outils/cap.mjs)
- 48 téléphones, 0 `input[type=number]`, 0 débordement horizontal, 0 action coupée en bas (Enregistrer, Mon mois, touches), 0 texte rogné, 0 erreur console.
- Captures : `captures/vNN-{repos,a,b,c,ok,okb}-{clair,cave}.png` (96) et `captures/planche/vNN-{clair,cave}.png` (16, 3 × 2).
- Ouvertes et jugées : les 8 planches claires (v01 à v08), puis chaque version touchée rouverte après correction.

### Passe 2 bis (22.11) — planches claires relues, 6 problèmes vus et corrigés
1. v02 repos : touches « − » et « + » du pavé en signes gris de 14 px, illisibles → « − sort » et « + rentre », fond et texte du sens.
2. v03 (a) : une ligne commençait par « , puis » → ponctuation collée au trou qui la précède (`.v03-nb`).
3. v03 (a) et (c) : l'anneau du trou actif touchait « dès le » et « jusqu'en » → marge de 7 px.
4. v04 (b) : « Reçu +2 000,00 » collé au bord droit de la carte → marges internes de Mon mois et du bouton réduites.
5. v04 et v08 : tuile « Abonnement » bord à bord → sa colonne est élargie (1,3 fr).
6. v06 repos : « Fournisseur achat » et « Client vente » collés au bas du schéma → remontés de 14 px.
- Régression évitée : la classe `.sg` des touches v02 heurtait `.sg` de v05 (L26) ; renommée `v02-sg`.
- Rien vu à corriger : v01, v05, v07 (états d'origine), v08 hors tuile.
- États ajoutés (groupes 3, 4, 5) : v01 (d) et v04 (d) achat avec puce de catégorie (Brassage · Matériel · Nettoyage · Rénovation, `FinanceCategory`) et « Articles · 1 » (stock +25 kg) ; v04 « première fois » (liste vide, un exemple dit en mots) ; v07 (e) bail « À payer » chaque mois dès le 1.12 : aucun paiement, novembre vide, échéances en pointillés, frise dès 01.12.26, Mon mois « prévu », bouton « À payer −400,00 ».
- Bloquants de la passe 2 vérifiés intacts sur les captures : apport hors Mon mois (« inchangé », Caisse dans la confirmation), Remboursement neutre, « Pour moi », frise partagée en v07 (a), Salaire (Employé) en v06, touches sens/genre en v08.
- Contrôles (`node outils/cap.mjs`) : 52 téléphones, 0 `type=number`, 0 débordement, 0 action coupée, 0 rognage, 0 erreur console.

### Restants (non corrigés)
1. États erreur (montant 0, sens absent, fin avant début), hors ligne, échec d'écriture : non dessinés (UX commun 2).
2. Captures 390 × 660 clavier ouvert (UX commun 4) : non faites.
3. v04 « première fois » : dessiné (passe 2 bis). Reste ~350 px vides sous la carte vide (rien d'honnête à y mettre sans habituel).
4. Achat : puce de catégorie et « Articles · n » dessinés en v01 et v04 seulement ; les six autres : au port.
5. « À payer » + « chaque mois » : dessiné en v07 (e) seulement ; les autres : au port.
6. Justificatif « pièce manquante » : non montré (compta 8). TVA par genre : seulement le pli.
Groupes 1, 2, 6, 7 et 8 : laissés au port (consigne du pilote, 22.11).
7. v02 : puces touchées clavier ouvert (preventDefault) et v08 : clavier texte sur le pavé : à régler au port, pas en maquette.
8. v06 : lent pour un achat (l'idée même) ; remboursement fournisseur par « inverser » non montré.

### Champs neufs restants
- `FinancialPlan.subcategory` (ou `genre`) : seul champ jugé utile (compta 4).
- Appariement automatique d'un paiement à l'occurrence d'un plan récurrent (`occurrenceId`) : code à écrire, pas un champ (v04 « solde l'échéance »).
- Abandonnés : catégorie Salaires/Abonnements, moyen Carte, remboursement sans pièce, rôle de contrepartie (v06), mois à la carte (v07).

## v01s — v01 simplifiée (22.11, après D426), passe 2
Section en tête de `choix-saisie.html` (`?v=v01s&s=<état>`, `&duo=1` planche, `&h=660` téléphone court). Classes `v1s-` (et celles de v01, reprises telles quelles), fonctions `v01s`, `v1s*` (L26). Critiques de la passe 1 : `CRITIQUE-v01s-brasseur.md` (16), `CRITIQUE-v01s-ux.md` (20), `CRITIQUE-v01s-compta.md` (11).
Base : v01 telle quelle. **Le repos est celui de v01** : habituels en tête (avec « prévu le 22.12 · le solde »), tuiles « Ça sort / Ça rentre » sur fond teinté, Remboursement en pointillés, carte « Pour quoi ? · 22.11.26 · 0,00 », Mon mois + Enregistrer. Après le genre : bande « Ça sort [genre] changer », puis la carte de p3c-3, puis « Revient ? » en 4 segments, comme v01.

### Touchers / frappes (clavier ouvert ; toucher = tuile, champ, puce, défiler, fermer le clavier, valider ; frappe = chiffre ou virgule)
Clavier dessiné à **300 px** (Gboard numérique, **estimé** ; à mesurer : `visualViewport.height` clavier ouvert sur son téléphone).

| Cas | v01 Android | v01 iPhone | v01s 390 × 844 | v01s 390 × 660 |
|---|---|---|---|---|
| 1. Achat 40 | 3 / 2 | 4 / 2 | 2 / 2 | 2 / 2 |
| 2. Vente 250 | 3 / 3 | 4 / 3 | 2 / 3 | 2 / 3 |
| 3. Loyer chaque mois | 3 / 3 | 4 / 3 | 2 / 3 | 2 / 3 |
| 4. Apport | 3 / 4 | 4 / 4 | 2 / 4 | 2 / 4 |
| 5. Abonnement → oct. 2027 | 5 / 5 | 5 / 5 | 3 / 5 | **4** / 5 (défiler : « jusqu’à » sous le clavier) |
| 6. Remboursement 18,40 | 4 / 5 | 5 / 5 | 3 / 5 | 3 / 5 |
| **Total** | **21** | **26** | **14** | **15** |
| Loyer le mois suivant (habituel, en tête) | non dessiné | — | 2 / 0 | 2 / 0 |
| Nommer (facultatif) | +1 et les lettres | idem | +1 / 0 (une puce) | +1 / 0 |

- Le gain vient d’un geste : **toucher le genre ouvre le clavier sur le montant** (focus synchrone dans le geste). Le genre se choisit donc clavier fermé : à 660, habituels, « Ça sort », « Ça rentre » et Remboursement sont tous visibles (`v01s-repos-660`).
- Le pied (Mon mois + « Payé −40,00 ») reste au-dessus du clavier : jamais le fermer.

### Corrigé (38 sur 47 ; les 4 bloquants)
- **B nom** (brasseur 1) : le genre ne pose plus « Achat ». Nom facultatif, gris par défaut et utile (« Achat du 22.11 », « Vente du 22.11 », « De ma poche », « TVA du 22.11 ») ; sous la carte, une rangée de puces des derniers noms, un toucher (Chez Malterie · Quincaillerie ; Client Bar du Port · Marché de Noël ; Service Logiciel de compta · Téléphone ; Bailleur Régie du Lac). Le remboursement prend le nom de sa pièce, l’habituel le sien (« Loyer de l’atelier »). Toute la ligne du nom est la cible, 32 px (UX 19).
- **B habituels** (brasseur 2, UX 3) : retour en tête, liste de v01 avec ce que chacun solde ; « De ma poche » revient. Visibles à 660.
- **B Impôts** (compta 1) : `FinanceCategory` (port-carnet `src/types/index.ts:4`) n’a pas de catégorie impôt ; `FinancialPlan.source` connaît `'tax'` (`src/domain/finance/types.ts:107`, rangée « papiers » du Calendrier). Tuile « Impôts » (libellé court, brasseur 8) → « Quel impôt ? » : Impôt sur la bière = `divers` (charge, existant) ; Impôts privés → Pour moi (`apports`, prélèvement, existant) ; **TVA à l’AFC = champ neuf (accord)**, badge « TVA · neuf », Mon mois « inchangé » : jamais comptée en charge. État `impot`.
- **B clavier** (UX 1) : clavier dessiné à 300 px (estimé), touches `,` et `.` (UX 16) ; le genre se choisit clavier fermé (ci-dessus).
- Brasseur : 3 « Revient ? » en 4 segments ; 4 frise sur place sous « jusqu’à », plus de plateau ni de bouton OK (UX 10) ; 5 Achat : « Catégorie » titrée + « Articles · aucun · Ajouter, pour le stock » ; 6 écarts listés un par un (planche et ci-dessous) ; 8 repos identique à 844 et 660 ; 9 pas de rythme pour le remboursement (UX 7, compta 7) ; 10 pli par genre (UX 6, compta 5) ; 11 pièces de la plus récente à la plus ancienne ; 12 plateau des pièces : voile, poignée, ✕, pied masqué (UX 9) ; 13 habituel : « Chaque mois · solde le loyer de décembre, prévu le 22.12 », date de la carte 22.12 (compta 8) ; 14 « Pour quoi ? » seul ; 15 vides : le clavier réel occupe 300 px ; 16 phrases d’explication retirées (rpiece, apport, fin).
- UX : 5 la date reste en puce dans la carte (compta 6) ; 8 « Calendrier 22.11 ✓ une fois » retiré des mouvements uniques ; 12 « Malterie 14.11 · 186,40 → net 168,00 » dans la colonne des valeurs ; 15 vides ; 18 port : Safari ignore `interactive-widget`, seul `visualViewport` tient le pied ; 19 cible du nom.
- Compta : 2 sous-titres Salaire « employé », Pour moi « ta paie » (Vente : non) ; 3 état `prel` (Pour moi −300,00, badge « Privé », Mon mois inchangé, bouton « Retiré ») ; 4 pas de rythme pour Apport ni Pour moi ; 7 « reste : 186,40 » au lieu de « tout » ; 9 état `apayer` (facture Malterie, « À payer » + « d’ici le 22.12 », Mon mois « −186,40 » en pointillé, bouton « À payer −186,40 ») ; 10 confirmation de l’apport : « Banque +2 000,00 · argent dispo » ; 11 Autre (rentre) « pas un prêt ».

### Écarts à v01 (tous)
1. Toucher un genre ouvre le clavier sur le montant. 2. Pied épinglé au-dessus du clavier ; Entrée = le bouton. 3. Nom facultatif (gris par défaut) + puces des derniers noms ; puce de date gardée dans la carte. 4. Une fois : pas de ligne Calendrier ; Apport, Pour moi, Remboursement : pas de « Revient ? ». 5. Pli qui suit le genre ; Achat : Catégorie + ligne Articles. 6. Remboursement : plateau « De quelle pièce ? », puis le montant. 7. « Impôts » au lieu de « Impôts, TVA », puis « Quel impôt ? ». 8. Trois sous-titres de tuile.

### Restant (9)
- Brasseur 7 / UX 11 : à 660 avec le clavier, « jusqu’à », Σ et la fin passent sous le clavier ; le contenu défile (ombre au-dessus du pied) ; l’abonnement coûte +1 (défiler).
- UX 2 : clavier ouvert au toucher du genre et focus gardé (tuiles et puces en `pointerdown` + `preventDefault` ; iPhone : focus synchrone dans le geste) : à prouver sur son téléphone, au port.
- UX 4 : montant tapé avant le genre (toucher la carte au repos) non dessiné ; règle : le bouton grisé dit « Ça sort ou ça rentre ? », Entrée fait pulser les deux panneaux.
- UX 13 et 14 : « Brassage » en badge et en puce, choix en noir comme l’action : base p3c-3 et v01, gardés (à lui montrer avant de changer).
- UX 17 : « 1 an · 4 fois » en trimestriel, non dessiné. UX 20 : remboursement d’une vente (sort), non dessiné.
- Compta 8 : code ; un paiement de loyer écrit `occurrenceId` (sinon `forecast.ts:182` lève une note), et `planSoldeParDepense` exclut les plans récurrents.

### Ce que le modèle porte
- Genre → `kind`, `category`, `FinancialPlan` (`recurrence.frequency`, `endDate` pour « 12 fois ») ; fournisseur ou client choisi → `vendor` / `clientId` et nom ; nom par défaut écrit à l’enregistrement si le champ reste vide.
- Remboursement : `kind:'refund'`, `refundOfId`, sens inverse de la pièce ; « reste » = montant de la pièce moins ses avoirs (à plafonner : `refundLinkIssue` ne plafonne pas).
- Apport : `contribution` ; Pour moi : prélèvement, `apports` ; tous deux hors Mon mois (`periodeSynthese.ts:155`).

### Champs neufs (accord)
- **TVA à l’AFC** : une nature hors charges (catégorie `impots`, ou un `kind` exclu de Mon mois), montrée seulement si `fiscal.isTvaRegistered`. Rien d’autre de neuf.
- Utile, non obligatoire : `FinancialPlan.subcategory` (Loyer, Abonnement, Salaire tous en `chargesFixes`).

### Contrôles (`node outils/cap-v01s.mjs`, clair seul)
- 16 téléphones, 0 `type=number`, 0 débordement, 0 action coupée, 0 rognage, 0 erreur console ; « caché » = contenu sous le clavier (achat, loyer, abo), atteint en défilant.
- Captures : `captures/v01s/v01s-<état>.png` (16, 390 × 844 @2x), `v01s-{repos,achat,loyer,abo,hab}-660.png`, `planche-v01s.png`, `tableau.png`.
- Ouvertes : repos-660, achat, vente, abo-660, loyer-660, hab-660, okr, et la planche par rangées (loyer, apport, abo, rpiece, rembt, hab, fin, prel, impot, apayer, ok, okb, okr). Corrigé après la vue : badge « Apports privés » sur Pour moi → « Privé » ; ombre au-dessus du pied (contenu qui défile sous le clavier).
