OK — limites 1 et 2 de b1 appliquées (payé lu au terminal si égal au total ; comptage confirmé ou non vérifié), non déployé

## Limites 1 et 2 de b1 (aiTask déployé 5efc3acd ; 09.11)
1. **Payé** : `payeEffectif(lecture)` (module) rend le reçu imprimé (`amountPaid`) s'il existe ; sinon le montant du terminal SI ET SEULEMENT SI il égale le total (à 5 centimes) sur un ticket de caisse (`documentType` `receipt` ou inconnu) ; sinon null (jamais 0). BAUHAUS : « payé 352,05 (TWINT) · lu au terminal, aucun reçu imprimé ». Sun Store (terminal 163,85 pour 14,60) et une facture : jamais le payé. Le contrôle `paiement` l'emploie ; l'écran qui veut afficher « Payé » doit appeler `payeEffectif` plutôt que lire `amountPaid` seul. La consigne n'a pas changé (le serveur range toujours le terminal à part : la règle est dans le module, rejouable sans appel).
2. **Comptage des montants** : `comptage-montants` ne lève un drapeau (`ok: false`) que s'il est confirmé par la 3.8 (champ `countedAmountsConfirmed`, posé par le vote quand la 3ᵉ lecture lit le même nombre que le nombre retenu) ou par `brut-rabais` lui aussi en échec ; sinon `ok: null`, sans écart ni geste, avec la note « Comptage non confirmé… ». Sunstore-1 (3 comptés pour 2 lignes justes, CHF concordants) : plus de faux « Ajouter 1 ligne ». Serveur : `invoiceVisionReview.ts` (vote) pose le marqueur, `normalizeInvoiceScan` le garde seulement avec un comptage ; deux lectures qui concordent sans 3.8 (ou une 3.8 qui lit autre chose) : retenu mais jamais confirmé.
- Tests (échouent avant : le module sans les deux gardes fait échouer 5 tests ; vérifié, puis restauré) : `controlesPiece.test.ts` + `controlesPiece.serveur.test.ts` : **2 fichiers, 94 tests passés** (`tests.txt`). `tsc` racine et `functions` sans erreur. Voisins (depense, banc-lecture-facture, k5, geminiScanner, invoiceReview) : 2 790 passés, 0 rouge (les 6 de l'écran Dépense sont réglés par t1/d2).
- **À câbler (voie d2, hors de ma zone)** : `geminiScanner.normalizeResult` doit aussi recopier `countedAmountsConfirmed` (booléen, clé seulement si vrai) ; l'écran passe `documentType` à `controlesPiece`. Sans cela, le comptage reste « non confirmé » à l'écran, sauf quand brut − rabais échoue (le cas utile).
- Serveur à redéployer (`firebase deploy --only functions:aiTask`, par le pilote) pour que le marqueur existe en ligne ; sans lui, rien ne casse : le comptage est alors confirmé par les CHF seulement.


## Contrat réécrit (09.11, après la passe P5 de b1) : les cinq points
1. **B1 (sunstore-1)**. Cause : le « 2 » en fin de ligne (« 5.40 2 ») est le code de TVA ; les Flash-Lite le lisaient en quantité, et sans montant de ligne la quantité 2 × prix donnait « inconnu » (somme 0,00, `somme-incomplete`). Deux gestes : (a) consigne : le code de TVA est `vatCode`, jamais la quantité (la quantité est le nombre en tête de ligne), et `amountTTC` est toujours rempli quand il est imprimé ; (b) garde déterministe dans `invoiceScanCore.ts` : `quantiteSansCodeTva` (une quantité qui est le code de la ligne ou un code du récapitulatif de TVA, quand l'extrait ne la montre qu'après le montant, n'est pas une quantité : nombre de tête de ligne, sinon null, donc montant = prix) et la règle LT-3 (« 86.95 1 ») ne reprend plus un entier qui est un code de TVA. Test simulé : la lecture de P5 rejouée contre HEAD donne `quantités [2, 2], montants [null, null], somme incomplete, point somme-incomplete` ; avec le correctif : `[null, null]`, `[5,40 ; 9,20]`, somme ok, aucun point. Les cas voisins tiennent : « 86.95 1 » (code B) reste quantité 1, une vraie quantité 2 (« 2 Vis 4.50 9.00 ») reste 2, un 2 final qui n'est pas le code de la ligne reste 2, une ligne qui n'a ni montant ni prix n'invente rien.
2. **`countedAmounts`** : la consigne dit « montants d'ARTICLES et de REMISES seulement : ni le total, ni le reçu ou payé, ni le terminal (EFT, TWINT), ni la TVA, ni une devise étrangère ». Le comptage (comme `countedEans`, `printedItemCount`, `amountPaid`, `terminalAmount`) ne vote que sur ce que deux lectures concordent ou sur la 3.8 seule : `voterChampControle` dans `invoiceVisionReview.ts`. Sans cela, le champ est absent (une Flash-Lite seule ne compte plus).
3. **EAN non vérifiés** : `cle-ean` et `comptage-ean` rendent `ok: null`, sans écart, sans ligne, sans geste, avec la note « Non vérifié… » ; ils disent seulement ce qui a été lu (« 23 codes lus, 23 invalides »). Ils ne redeviennent des drapeaux que si l'appelant passe `{ eanFiables: true }` (constante `SEUIL_EAN_LUS = 0.9`) : à faire quand le banc aura mesuré 90 % de codes justes. Le brouillon réel de BAUHAUS (chaque code faux) ne lève plus rien (test).
4. **B6 et B4 : le vote** : `amountPaid` et `terminalAmount` se votent comme le total : [352,05 ; 352,05 ; null] donne 352,05 (une 3.8 vide ne l'efface pas) ; [163,95 ; 163,85 ; 163,85] donne 163,85 ; [null ; null ; 352,05] donne la valeur de la 3.8 ; deux lectures qui divergent sans 3.8 : absent.
5. **Rabais (option b du pilote)** : `rattacherRemises(items)` (module) rend chaque article avec ses remises en sous-lignes (rangs) et son net en centimes (null quand l'article n'a pas de montant, jamais 0), plus les remises orphelines (sans article au-dessus). Sun Store 2 : articles [1, 3, 4], remises [[2], [], [5]], nets 26,00 · 50,00 · 73,25, aucune orpheline. Le nombre d'articles à comparer à `printedItemCount` est `rattacherRemises(...).articles.length` ; `brut-rabais` le dit dans sa note (« sous-lignes de leur article »). La consigne : une remise est une ligne `discount`, montant négatif, rendue immédiatement sous l'article qu'elle réduit.
- Aucun fichier de `src/ui` ni `geminiScanner.ts` touché (voie d2). Les 6 rouges des tests de l'écran Dépense (p3c, g7, qr, sm0811) sont toujours ceux de t1/d2, inchangés.
- Tests : `controlesPiece.test.ts` + `controlesPiece.serveur.test.ts` : **2 fichiers, 80 tests passés** (`tests.txt`). `tsc` racine et `functions` : sans erreur. Tests voisins (depense, banc-lecture-facture, k5, geminiScanner, invoiceReview) : 2 784 passés, mêmes 6 rouges hors zone.
- À rebancer par b1 (non mesuré : Gemini interdit ici) : sunstore-1 et les 7 pièces déjà au banc d'abord (aucune régression), puis 4 pièces × 3 tirages. La reformulation de la quantité est un geste de consigne : la garde serveur rattrape le cas B1 même si le modèle persiste, mais pas une quantité lue 1 à tort.
- Note de l'API : `ContexteControles` gagne `eanFiables?: boolean` ; `rattacherRemises` et `ArticleAvecRemises` sont exportés.


## API pour la voie t1 (à brancher dans le bloc des contrôles)
Module : `src/domain/finance/controlesPiece.ts` (pur, aucun import React, aucune écriture).
```ts
import { controlesPiece, controlesEnEchec, compterArticles, type ControlePiece } from '../../domain/finance/controlesPiece';
const liste: ControlePiece[] = controlesPiece(lecture, { depenses, prixConnus });   // contexte facultatif
// ControlePiece = { id, ok: true|false|null, attendu: string, trouve: string, ecart?: number, unite?: 'CHF'|'lignes'|'codes',
//                   sens?: 'manque'|'exces', geste: { type, libelle, lignes?: number[] }, note?: string, lignes?: number[], refs?: string[] }
```
- Toujours dix entrées, dans cet ordre fixe : `comptage-montants` · `comptage-ean` · `cle-ean` · `brut-rabais` · `tva-par-taux` · `paiement` · `doublon` · `hors-articles` · `prix-plausible` · `photo-incomplete`.
- `ok` : true = concorde ; false = ne concorde pas (c'est lui qui lève le drapeau : `controlesEnEchec(liste)`) ; null = non vérifiable (donnée absente : jamais « bon », jamais 0, à ne pas afficher en vert).
- `attendu` / `trouve` : textes prêts à afficher (« 29 montants » / « 23 lignes avec montant »). `ecart` toujours positif, `sens` dit le côté (`manque` : les lignes lues font moins ; `exces` : plus). `unite` donne l'unité de `ecart`.
- `geste.type` : `ajouter` (ligne manquante : recherche puis « Ajouter une ligne ») · `ouvrir-ligne` (avec `geste.lignes`, rangs base 1 dans `lecture.items`, à ouvrir pour modifier ou retirer) · `relire-photo` · `rechercher` · `saisir-autre` · `voir-doublon` · `rien`. `geste.libelle` est la phrase de la pastille.
- `lignes` : rangs concernés (EAN invalides, lignes hors articles, prix éloignés, ligne en trop désignée par `coupablesDeLEcart` du serveur) ; `refs` : ids de dépenses (doublon, paiement partagé) ; `note` : une phrase d'explication (paiement partagé, détail brut/rabais).
- Entrée `LectureControlee` : les champs du résultat de lecture (`vendor`, `date` JJ.MM.AAAA ou AAAA-MM-JJ, `printedTime`, `amountTTC`, `vat`, `items`, `amountPaid`, `terminalAmount`, `paymentMethod`, `printedLineCount`, `printedItemCount`, `countedAmounts`, `countedEans`, `ignoredLines`, `photoIncomplete`, `photoIncompleteNote`). Un `ScannedInvoiceResult` s'y passe tel quel une fois les champs ajoutés (voir « À câbler »). Contexte : `depenses: {id, vendor, date, heure?, total}[]` (dépenses déjà saisies), `prixConnus: {nom, reference?, ean?, prix, unite?, source:'stock'|'achat'}[]` ; sans contexte, doublon, paiement partagé et prix restent `null`, jamais « bons ».
- `compterArticles(items)` → `{articles, remises, horsArticles, rangsHors}` : le nombre d'articles « imprimés » à comparer à `printedItemCount` est `articles` (les rabais sont des remises, jamais des articles ; sur Sun Store 2 : 3 articles et 2 remises pour 5 lignes).

## À câbler (hors de ma voie, à confier)
1. `src/services/geminiScanner.ts` (`normalizeResult`, vers la ligne 184-212) reconstruit le résultat champ par champ : les neuf champs du serveur y sont **jetés** tant qu'on ne les ajoute pas (type `ScannedInvoiceResult` + une ligne de recopie par champ, même convention que `printedLineCount` : clé présente seulement si le serveur la porte). t1 lit `amountPaid` par un cast : il restera « non lu » sans cela.
2. Le contexte du contrôle (dépenses du même fournisseur et du même jour, avec heure si elle est enregistrée ; prix du stock et des achats passés) se construit à l'écran depuis le registre : non fait ici (pur, sans accès aux données).
3. Serveur : **non déployé**. Commande pour le pilote : `firebase deploy --only functions:aiTask` (depuis la racine, après le build de `functions`). Les champs sont facultatifs : un client d'avant et un serveur d'après (ou l'inverse) se comprennent.

## Fichiers écrits
- `src/domain/finance/controlesPiece.ts` (nouveau, 380 lignes environ).
- `functions/src/prompts.ts` : consigne `scanInvoice` + schéma (9 champs hors `required`).
- `functions/src/invoiceScanCore.ts` : `normalizeInvoiceScan` garde les champs (une clé n'existe que si la lecture la porte).
- `functions/src/invoiceMorceaux.ts` : `mergeDecoded` (lecture en morceaux).
- `functions/src/invoiceVisionReview.ts` : `reconcileInvoiceVision` (vote entre lectures).
- `tests/unit/finance/controlesPiece.test.ts` (54 tests), `controlesPiece.serveur.test.ts` (14), `controlesPiece.pieces.ts` (lectures simulées anonymisées).
- `tests/unit/banc-lecture-facture.test.ts` : une seule valeur, le nombre de champs du schéma de production (39 → 51), signalée plus bas (hors de « Possède » strict : c'est le test du schéma que je change).
- `work/missions/2026-11-09-depense-totaux/voies/c1/tests.txt`, ce fichier.

## Champs ajoutés au schéma de lecture (même appel, aucun appel de plus ; tous nullables ou facultatifs, hors `required`)
| champ | sens | consigne |
|---|---|---|
| `amountPaid` | payé DU TICKET (« Montant reçu / Payé ») | jamais le montant du terminal (b1 : « EFT = information ») |
| `terminalAmount` | montant du terminal (Total EFT, TWINT) | information, peut couvrir plusieurs tickets (14,60 + 149,25 = 163,85) |
| `printedItemCount` | nombre d'articles IMPRIMÉ par le document | null s'il n'est pas imprimé ; ne le compte jamais (`printedLineCount` reste le compte transcrit) |
| `countedAmounts`, `countedEans` | comptage indépendant : montants de la colonne (remises comprises), codes EAN | à faire AVANT de transcrire `items`, sans s'en servir |
| `ignoredLines[{label, amount, kind}]` | lignes qui ne sont pas des articles : `foreign_currency` (« Montant en EUR 370,92 »), `payment`, `subtotal`, `other` | au lieu de les mettre dans `items` ; une remise reste dans `items` |
| `printedTime` | heure imprimée HH:MM | pour le doublon (non demandée par le contrat : nécessaire à « même date et heure ») |
| `photoIncomplete`, `photoIncompleteNote` | zone des montants coupée, pliée, tachée, floue | drapeau lu, jamais deviné |
Déjà au schéma et inchangés : `paymentMethod`, `printedLineCount`, `vat`. Normalisation : montant négatif, comptage non entier, heure impossible, genre inconnu rejetés ; `amountPaid: 0` est un montant lu, pas un manque.

## Ce que chaque contrôle fait (et ses limites)
1. **Comptage** : `countedAmounts` contre les lignes lues avec montant (hors lignes qui n'en sont pas) ; `countedEans` contre les codes lus sur les lignes. Le défaut n° 1 du banc (`printedLineCount` = lignes transcrites : 23 pour 23) n'y est plus : un compte fait à part.
2. **Clé EAN** : formule GS1 (mod 10) sur 12, 13 ou 14 chiffres (référence, champ `ean`, ou extrait de 13 chiffres) ; l'EAN-8 seulement par un champ `ean` explicite (un numéro d'article de 8 chiffres, courant chez BAUHAUS, n'est jamais pris pour un EAN-8).
3. **Brut − rabais = total** à 5 centimes ; l'écart manque → « Ajouter » ; l'écart en trop → ligne coupable désignée (`coupablesDeLEcart`, réemployé).
4. **TVA par taux** : total × t / (100 + t), 5 centimes ; plusieurs taux : le TTC de chaque taux vient des lignes de son code, et si une ligne n'a pas de code, `null` (jamais deviné).
5. **Paiement** : payé du ticket contre total ; le terminal n'est qu'une information : expliqué par les autres dépenses du même fournisseur et du même jour (somme de sous-ensemble, 12 au plus), jamais un drapeau seul.
6. **Doublon** : fournisseur (clé du registre, forme juridique ignorée), date, heure (si les deux l'ont), total ; heure inconnue d'un côté = « probable », dit.
7. **Hors articles** : la désignation (EUR, total, sous-total, TWINT, EFT, Visa, espèces…) ; limite : un article dont le nom commence par un de ces mots entier serait pris pour une ligne hors article (« Visage crème », « Totalreiniger » passent ; testé).
8. **Prix plausible** : rapprochement par EAN, référence ou nom, même unité ; écart > ×2 (strictement), dans les deux sens.
9. **Photo incomplète** : le champ de la lecture seulement.

## Pièces (lectures simulées anonymisées ; mêmes montants que les pièces)
- Sun Store 1 : reçu 14,60 = total ; terminal 163,85 = 14,60 + 149,25 ; TVA 2,6 % : 0,37 ✓ ; aucun drapeau.
- Sun Store 2 : brut 151,83 − rabais 2,58 = 149,25 ; 3 articles et 2 remises ; terminal 163,85 = 149,25 + 14,60 ; aucun drapeau.
- BAUHAUS taché, 29 lignes : 29 = 29 ; écart 74,45 sur la pièce (« manque ») ; « Montant en EUR 370,92 » écarté ; photo tachée.
- BAUHAUS taché, la vraie lecture (b1 : 23 lignes lues) : comptage 29 contre 23, six manquent ; brut − rabais 117,65 (dont 43,20 sont sur la photo) ; photo incomplète.
- BAUHAUS copie : doublon avec le taché (02.11.2026 12:31, 352,05) ; montant 66,95 lu pour 6,95 repéré par « prix plausible » (×9,6) quand l'article est connu ; écart 155,40 lu, 215,40 vérité.
- Un EAN faux repéré à sa ligne ; la clé juste passe (vecteurs publiés GS1 testés).

## Sorties décisives des critères
- `npx vitest run tests/unit/finance/controlesPiece.test.ts tests/unit/finance/controlesPiece.serveur.test.ts --reporter=dot > …/c1/tests.txt` : **2 fichiers, 68 tests passés** (54 + 14).
- Tests écrits avant le module (L13) : sur HEAD le module n'existe pas, et `grep -c 'terminalAmount\|countedAmounts'` rend 0 pour `prompts.ts` et `invoiceScanCore.ts` à HEAD, donc les tests serveur échouent avant. Vérification de force : TOLERANCE 5 → 0 fait échouer le test d'arrondi (revenu).
- `npx tsc --noEmit -p .` : sans erreur (racine). `cd functions && npx tsc --noEmit -p .` : sans erreur.
- Tests voisins : `tests/unit/depense`, `banc-lecture-facture`, `banc-lecture-k5`, `geminiScanner`, `integration/invoiceReview` : 2 780 passés, **6 rouges, tous dans l'écran Dépense de t1** (`p3c.test.tsx`, `g7/ecran-g7.test.tsx`, `qr/ecran-qr.test.tsx`, `sm0811/pied.test.tsx` : textes « Articles lus ≠ annoncés », « Lignes … de moins » que t1 refait ; hors de ma zone). Les fixtures `lecture-372765.reconciliee.json` et `fixture-s6` restent identiques : les champs n'existent que si la lecture les porte.
- Gemini : jamais appelé (lectures = objets JSON).

## Essais et doutes
- Essais : un script de remplacement du Bash a perdu les barres inverses d'une regex (`HORS_ARTICLE`) : repéré à la relecture, réécrit avec Edit ; une chaîne de test cassée par un autre script, réparée. Aucun critère n'a dépassé trois essais.
- Aucun MISSION.md dans la mission : pas de section « État de l'art » à relire ; les décisions sont dans l'en-tête du module (formule GS1 publiée avec vecteurs de test, TVA incluse, somme de sous-ensemble sur ≤ 12 dépenses, `coupablesDeLEcart` réemployé : aucune rustine, aucun module d'algorithme écrit deux fois).
- Les consignes ne sont **pas mesurées sur Gemini** (interdit dans cette voie) : un modèle peut compter 29 montants là où 28 s'impriment, ou remplir `ignoredLines` à côté de `items` : à mesurer au banc sur les quatre pièces (b1 P5, ≈ 0,15 CHF), avant de s'y fier. Le nombre de champs de la réponse monte de 12 : coût de sortie marginal, à lire au banc.
- Le doublon par heure suppose que l'heure du ticket est enregistrée avec la dépense : sinon le doublon n'est que « probable ».
- Faux positifs possibles : un ticket dont deux achats distincts font le même total le même jour et la même minute (jamais pour des tickets différents à la minute près).

DÉCISION À PRENDRE : le brasseur compte-t-il un rabais comme une ligne ? (question de b1) — mon module ne tranche pas la forme : il garde les lignes lues, compte à part articles et remises, et `brut-rabais` reste juste dans les deux formes. Recommandation : garder les lignes négatives (somme juste) et n'afficher que « 3 articles · 2 remises » ; le rattachement du rabais à son article reste un choix de forme à montrer en mini maquettes.
DÉCISION À PRENDRE : déployer `aiTask` avec ces champs avant le banc de mesure ? Recommandation : non ; banc d'abord (b1 P5), puis déploiement, car la consigne est plus longue et non mesurée.

CONNAISSANCE : le total du terminal (EFT, TWINT) peut couvrir plusieurs tickets d'un même fournisseur le même jour (Sun Store : 14,60 + 149,25 = 163,85) : c'est une information, jamais le payé d'un ticket ; le payé se lit sur « Montant reçu / Payé ». Un numéro d'article de 8 chiffres chez BAUHAUS n'est pas un EAN-8.
LEÇON PROPOSÉE : un champ de lecture ajouté au schéma doit l'être aussi à `normalizeInvoiceScan` ET au `normalizeResult` du client : trois listes de champs (schéma, serveur, client) ; sinon il est jeté en silence. Une clé facultative n'apparaît que si la lecture la porte (convention l2), sinon des fixtures figées se périment.
