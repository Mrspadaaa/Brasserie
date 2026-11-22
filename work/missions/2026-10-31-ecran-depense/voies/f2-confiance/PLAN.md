# PLAN — f2-confiance : trois niveaux pour chaque valeur (D277)

Portée : un module pur `src/ui/depense/confiance.ts` (aucun React, aucun réseau) qui dit, pour chaque valeur de la pièce, `sur`, `repris` ou
`inconnu`, et déduit l'unité d'une ligne qui n'en imprime pas. Rien n'est branché dans l'écran ni dans l'enregistrement (voie f3).
Le plan est écrit une fois, la voie continue sans attendre (consigne du pilote).

## Défaut visé
Sur une commande en ligne, 12 lignes sur 17 n'ont aucune unité imprimée ; l'écran écrit « 85 ? » et « unité à préciser » alors que l'unité se lit.
Et les points de lecture (« Date », « Lignes », « Désaccord ») parlent une autre langue que les marques « unité ? » et « douteuses ».

## Principe (ses 3 cas)
- `sur` : rien à montrer. Valeur lue sans point qui pèse, calcul exact, unité imprimée ou tapée, ou ambiguïté nulle (une pièce de matériel à 1).
- `repris` (jaune, jeton `attention`) : valeur remplie sans certitude ; il contrôle.
- `inconnu` (rouge, jeton `alert`) : rien de lisible, ou contradiction qu'aucune règle ne tranche ; il doit remplir ou corriger.
- Une valeur absente est `inconnu` (jamais 0), sauf « sans objet » : service, port, remise, divers ne passent pas en stock, leur unité et leur
  quantité ne comptent pas : `sur`, sans valeur, `raison` « sans objet ». Le module donne le niveau ; l'écran, la couleur.
- Aucune règle d'unité ne rend `sur` sans qu'une seconde source la confirme (nom imprimé + q × p = montant ; famille + prix dans la fourchette
  du métier) ou que l'ambiguïté soit nulle. Dans le doute, `repris`. Sans indice, `inconnu` : jamais une unité inventée.
- Une unité lisible dans `unit` (imprimée ou tapée) est `sur` et n'est jamais réécrite : pas de `shortUnit` en écriture, seulement en `valeur` d'affichage.

## Correspondance 1 : code de point → champ → niveau (tous les codes qui pèsent)
Le champ vient de `point.champs` (`items.N.<champ>`) et de `point.ligne` (rang de l'`id` `line-N`). Un point qui ne pèse pas (`pese` faux : `type-deduit`,
désaccord tranché à la majorité) ne baisse rien. Si plusieurs règles visent un champ, le pire niveau gagne.

| code | champ visé | niveau | pourquoi |
|---|---|---|---|
| ligne-montant | quantité, prix (ligne) ; montant (ligne) | q, p : `repris` ; montant : `sur` si le total corrobore (somme des lignes = total), sinon `inconnu` | trois nombres qui se contredisent : le total tranche le montant, pas lequel des deux autres est faux |
| ligne-prix-par-lot | prix (ligne) | `repris` | prix probablement par 100 g ou par kg : rien d'inventé, il contrôle |
| unite-absente | unité (ligne) | aucun niveau propre : remplacé par la déduction (§ Correspondance 2) | c'est le défaut que D277 retire |
| alpha-libelle | article (ligne) | `repris` | α lu ≠ α du libellé |
| nature-a-preciser | famille (ligne) | `repris` | une famille est donnée par les mots, la nature est à confirmer |
| ambiguite-ligne | article (ligne) | `repris` | le modèle a signalé la ligne |
| forme-rejetee | le champ rejeté (`items.N.x`, `vat`) | `inconnu` | la valeur a été écartée : rien de lisible |
| lectures-divergentes (pèse) | le champ des lectures (`items.N.unit`, `date`, `vendor`, `amountTTC`, `amountHT`/`vat` → TVA…) | `repris` si une valeur est retenue, `inconnu` sinon | deux lectures diffèrent |
| somme-ecart | total | `repris` si l'écart ≤ 5 centimes (arrondi suisse), sinon `inconnu` | lignes ≠ total imprimé |
| somme-incomplete | total ; montant de la ligne sans montant (inconnu par absence) | total : `repris` | une ligne sans montant lisible |
| total-absent | total | `inconnu` | |
| tva-incoherente, ht-tva-ttc | TVA | `repris` si l'écart ≤ 5 centimes, sinon `inconnu` | |
| taux-tva-hors-plage | TVA | `inconnu` | taux rejeté |
| date-absente | date | `inconnu` | |
| devise-non-chf | total | `repris` | montant en autre devise : à contrôler |
| lignes-perdues | lignes | `inconnu` | des lignes manquent : il doit les ajouter |
| lignes-annoncees, lignes-non-rapprochees, lecture-coupee | lignes | `repris` | la somme tombe juste, ou un vis-à-vis manque : il contrôle |
| pro-forma-non-payee, devis, document-livraison, avoir | document | `repris` | la nature de la pièce est à confirmer |
| type-deduit | — | ne pèse pas | |

Champs de l'en-tête rendus : `date`, `fournisseur`, `total`, `tva`, `numero`, plus `lignes` et `document` (les points « Lignes » et « Pro-forma »
n'ont pas d'autre champ). Une valeur tapée par lui (`tapes`) est `sur` quel que soit le point.

## Correspondance 2 : indice → unité → niveau (ordre d'essai ; le premier qui répond gagne)
| # | indice | unité | niveau | confirmation / refus |
|---|---|---|---|---|
| 0 | `unit` lisible | cette unité (`shortUnit`) | `sur` | jamais réécrite |
| 1 | kind hors stock (service, port, remise, divers, entretien) | aucune | `sur` « sans objet » | |
| 2 | quantité absente, nulle ou négative | aucune | `inconnu` | |
| 3 | unité nue après une virgule dans le nom (« …, Kg », « …, Gramm ») | cette unité | `sur` si q × p = montant au centime, ou si prix ou montant manque ; sinon `repris` | seconde source = le nom imprimé + le calcul |
| 4 | levure, poids du nom > 50 g (`SACHET_MAX_G`) | pièce | `repris` | une brique n'est pas un sachet |
| 5 | levure, quantité entière, prix 2 à 25 | sachet | `sur` (calcul exact), sinon `repris` | famille + fourchette de prix d'un sachet |
| 6 | levure, autre prix | sachet si < 2, pièce si > 25 | `repris` | |
| 7 | matériel : tuyau, Schlauch, hose (vendu au mètre) | m | `repris` | le métrage n'est pas imprimé |
| 8 | matériel, quantité entière | pièce | `sur` si q = 1 ou calcul exact, sinon `repris` | ambiguïté nulle : un fermenteur ne se vend pas au kilo |
| 9 | emballage / matériel avec un nombre de pièces dans le nom (« 100 Kapseln », « je 100 St », « 24-fach ») | pièce (le paquet) | `repris` | le paquet vaut 1 ; son contenu n'est pas la quantité |
| 10 | emballage, quantité entière | pièce | `sur` si q = 1 ou calcul exact | |
| 11 | houblon, prix ≤ 0,50 et quantité entière ≥ 5 | g | `repris` | 85 × 0,04 = 3,40 n'a de sens qu'en g ; seul le prix le dit |
| 12 | houblon, poids dans le nom (25 g) ou q ≤ 5 et prix de 2 à 40 | pièce (paquet) | `repris` | |
| 13 | mesure en fin de nom (« 250 g », « 460ml », « 0,5 Kg ») différente de 1 | pièce (le contenant) | `repris` | la mesure est la contenance, jamais l'unité |
| 14 | mesure en fin de nom = 1 kg ou 1 l (« 1 Kg ») | kg / l | `repris` | un paquet de 1 kg vaut 1 kg ; l'étiquette peut être « pièce » |
| 15 | malt / céréale, prix 0,8 à 6 | kg | `repris` | fourchette du malt de base à l'été |
| 16 | malt / céréale, prix 0,0008 à 0,008 et q ≥ 50 | g | `repris` | |
| 17 | autre famille, quantité entière, prix ≥ 0,50 | pièce | `repris` | défaut du métier : aucune autre unité ne se compte entière à ce prix |
| 18 | rien de ce qui précède, mais l'article relié est tenu en pièce / sachet et q entière | cette unité | `repris` | jamais une unité de poids tirée de l'article (erreur d'échelle ×1000) |
| 19 | rien de ce qui précède, mais ≥ 1 autre ligne de la même famille sur la pièce imprime une unité (toutes la même, prix du même ordre) | cette unité | `repris` | |
| 20 | sinon | aucune | `inconnu` | |

Ajustements après le choix : l'article relié tenu dans une unité d'une autre famille que l'unité déduite plafonne à `repris` (lactose 1 kg
tenue en kg, comptée au paquet) ; q × p ≠ montant plafonne un `sur` à `repris` ; deux lignes ou plus de la même famille qui impriment la même
unité que la déduction, à un prix du même ordre, la confirment (`repris` → `sur`).

## Tests (rouge d'abord)
`tests/unit/depense/confiance/` : le témoin avant (le module n'existe pas ; la forme doc14 de `banc-k6/piece.ts` donne 11 lignes sur 11 sans unité
exploitable aujourd'hui), puis la pièce inventée, la ligne vide, prix ≠ montant, unité tapée jamais réécrite, chaque règle d'unité, chaque code de
point, et une lecture enregistrée (`apercu/lecture-372765.reconciliee.json`).

## Risques
- Données existantes : rien n'est écrit ; le module ne lit que le brouillon et la lecture.
- Hors ligne : aucune dépendance réseau.
- Arrondis : montants comparés en centimes entiers (`toCents`) ; un prix à 4 décimales (0,0101 × 100 g) est jugé à la demi-unité de son dernier chiffre.
- Faux `sur` : défaut bloquant, la règle redescend en `repris` ; mesuré sur les 14 pièces du banc (cible 0).

## Hors périmètre
Écran (couleurs, rangées, chips) ; brouillon et validation d'enregistrement (voie f3) ; conversion pièce ↔ poids (voie f4) ; Gemini.
