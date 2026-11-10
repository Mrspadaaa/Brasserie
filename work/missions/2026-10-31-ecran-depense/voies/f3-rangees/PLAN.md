# PLAN f3-rangees (court, puis on code) — D275, D277

Base : p3c-3 (`v3/p3c-3/etat.html`, captures repos et plateau) + D246, D248, D249, D261a, D262b, D262d, D271, D273f, D277. Plancher à enrichir.

| Zone | Ce qui change | Fichier, fonction | Contrôle |
|---|---|---|---|
| Libellé | `description` = `lireOptions(nom, variante, unité).base` (ou `nameFr` lu) ; l'imprimé complet dans `imprime` (champ facultatif du brouillon) et dans `evidence` ; l'état, le supplément, les options à part | `ExpenseSheet.applyOutcome` ; `PurchaseLineDraft.imprime?`, `.etat?` (purchaseEntry) | e2e (a)(h)(i) ; `rangees/libelle.test.ts` |
| Unité déduite | `uniteDeduite?: {unite,niveau,regle,raison}` posé par dérivation (`avecUnitesDeduites`, à chaque rendu, la même à l'enregistrement) ; `line.unit` reste l'imprimé (D213) ; `uniteEffective(line)` lue par la validation, `stockQuantityFor`, l'article neuf, le mouvement ; le prix unitaire n'est pas gardé sur une unité déduite | `src/ui/depense/rangees.ts` (neuf), `purchaseEntry.ts` (`uniteEffective`, `validatePurchase`, `savePurchase`, `articleNeufDeLigne`) | `rangees/unites.test.ts` : `repris` s'enregistre, `inconnu` refusé |
| Nouvel article d'office | ingrédient sans article relié → `stockAction:'new'` à la lecture (même règle que le choix « Créer » : même produit → relié ; plusieurs candidats → aucun, barre « choisis ») ; aucun bouton « Créer » au repos | `applyOutcome`, `construire` | e2e (k) ; test « aucun data-dp-creer » |
| Rangée | nom de base une ligne (deux au plus) ; pastille d'état `data-dp-etat` « ↳ 0,20 » trait plein à la place de la mouture (aria « concassé, supplément 0,10 par Kg compris ») ; quantité en gras avec son unité effective, `data-dp-niveau` jaune/rouge sur la valeur ; nom souligné en pointillé jaune si la famille ou l'article est à contrôler | `Ligne.tsx` | e2e (g)(h)(j)(l) |
| Barre sous la rangée | seulement rouge, ou jaune avec un geste : unité inconnue (g kg Stk), bis (⇄), plusieurs articles | `construire` (`correction`) | test |
| Points | la rangée de chips part ; Date manquante = rouge à sa place dans le bandeau ; un point sans champ (Lignes, Désaccord d'en-tête) reste au récap ; la pastille du pied dit le pire niveau restant | `ExpenseSheet`, `Recap.tsx`, `Pied.tsx` | captures |
| Bande | quantités d'une même grandeur additionnées dans l'unité la plus présente (7 Kg + 100 g → 7,1 Kg) quand c'est exact ; un « repris » rend le sous-total jaune ; jamais « ? » quand l'unité se déduit | `groupes.ts` (`quantites`), `Liste.tsx` | `rangees/bandes.test.ts` |
| Récap | « n reliés · n nouveaux · n bis · n hors stock », « n à contrôler » (jaune), « n à remplir » (rouge), « ↳ n moutures +x » ; un compte nul ne s'affiche pas | `comptesItems`, `Comptes` | test |
| Plateau | « imprimé « CARABELGE®, Kg » · MA0222 », les options en français (« concassé, +0,10 par Kg, compris ») et les restes tels qu'imprimés ; « article « CARABELGE® » · nouvel article ⇄ » ; le choix de stock garde « Aucun mouvement de stock » | `plateauEl` | captures |
| Ligne ajoutée | « + Ajouter une ligne » reste ; ses valeurs vides en rouge | `construire` | test |

Tranché ici : (1) l'unité déduite n'est jamais écrite dans `line.unit` ni sur la ligne enregistrée (D213) : elle va au mouvement et à l'article neuf ; (2) un « bis » est aussi un nouvel article d'office (nom « … bis » de `articleNeufDe`), sa barre reste (jaune avec geste) ; (3) la description enregistrée est la base ; l'imprimé reste au justificatif (Drive) et au brouillon ; aucun champ Firestore ajouté.
Risques : données existantes (rien relu autrement : ajouts au brouillon seulement), hors ligne (rien de neuf), double clic (inchangé), arrondis (centimes entiers ; supplément × quantité arrondi au centime, affiché seulement).
Hors périmètre : `optionsDuNom.ts`, `confiance.ts` (f1, f2), le banc e2e (pilote), `nameFr` de la lecture (f5).
