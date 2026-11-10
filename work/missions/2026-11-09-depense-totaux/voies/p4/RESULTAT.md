OK — DP-4 : un même nom au stock propose de RELIER (vue FACTURE | STOCK + 3 sorties), jamais « bis » ni pièce sans poids

## Cause (lue sur le code, confirmée au banc sur HEAD)
- « Idaho 7 » en pièce face à « Idaho 7 » compté en g : `matchStockLine` ne relie pas (unité incompatible), `regleProduit` rend « incertain » (voisin = « Idaho 7 ») → `lignesDeLecture` posait « nouvel article » d'office, nommé « Idaho 7 bis ». L'unité faisait donc d'une même variété un autre produit (contre D371b).
- Sur le banc, HEAD montre déjà le trio pour cet état. Sa capture 1 n'avait pas la vue : la cause probable est une donnée réelle où la règle ne rend pas de voisin (nom pris au stock mais aucun membre de la « famille » : catégorie ou parenté de nom différente), donc « inconnu » + nom « Idaho 7 bis » sans trio. Non vérifiable (aucune donnée réelle). Corrigé aussi : le trio s'ouvre dès qu'un article du stock porte le même nom (`articleDeMemeNom`), quelle que soit sa catégorie.

## Fait
1. `src/ui/depense/finale.ts` : `lienParLeNom` — quand seule l'UNITÉ empêche (règle sans l'unité = « même article », ou article de même nom sans donnée qui diffère, quantité > 0), la ligne est RELIÉE et PROPOSÉE (jaune, « Garder »), jamais « bis » d'office. Autre α, origine, récolte : reste « bis » proposé (D215, acquis testé).
2. `src/ui/depense/etat.ts` : `articleDeMemeNom` (un seul article portant le nom de la ligne, noms gardés compris).
3. `src/ui/finance/ExpenseSheet.tsx` : la vue FACTURE | STOCK et les trois sorties s'ouvrent pour un article de même nom quand la ligne est « nouvel article » ou reliée avec une unité qui ne s'y ajoute pas (sa capture 2) ; sortie « Relier » marquée « proposé » ; trait « ? » et « pièce ne s'ajoute pas / compté en g » dans la vue ; la ligne « article · relié · ⇄ · Retirer » reste dessous ; une seule vue (plus de duel d'unité en double). Les « 0 → 1 pièce » d'un houblon/malt neuf en pièce sans poids disparaissent.
4. `src/ui/depense/poidsPiece.ts` (neuf) : « 1 pièce = ? g ». Poids lu seulement sur le nom (une seule mesure g/Kg, jamais « 10 x 100 g »), jamais inventé. Houblon/malt NEUF en pièce/sachet/Stk sans poids : unité « à remplir » (confiance.ts), cinq cases avec « 1 pièce = ? g · g proposé » (Kg pour un malt), « Confirmer » refuse (`erreursPoidsManquant`). Une ligne reliée à un article en g : refusée comme avant par `validatePurchase`. Bouton « 1 pièce = 100 g · compter en g » quand le poids est lu sur le nom d'une ligne reliée.
5. `Plateau.tsx` : `CasesUnite` reçoit `question` et `sansStock` (texte seulement).
- Acquis gardés : s1 (toucher une unité met 1, ordre pièce · g · Kg · L · sachet, tuiles), D374 (duel « article proposé » d'une ligne sans doute), D215, « Suivant › », DP-2, une ligne mal classée garde sa bande.

## Critères
- `npx tsc --noEmit -p .` : sortie vide (tsc.txt).
- Tests : `npx vitest run tests/unit/depense tests/unit/finance tests/integration/depense* tests/integration/finance tests/integration/financeQuickActions.test.tsx --reporter=dot > tests.txt` : **242 fichiers, 3 099 verts, 4 ignorés, zéro rouge** (tests.txt). Rouge sur HEAD avant correction : 7 tests de `tests/unit/depense/p4/dp4.test.ts` (relié proposé, sachet, malt, `articleDeMemeNom`, poids lu, refus du houblon neuf en pièce) ; la cause a aussi été reproduite au banc (`captures/head-idaho-*`).
- `npm run build` : vert (build.txt).
- Banc `voies/p4/banc/` (copie de p1 + `idaho-piece`, `idaho-voisin`, `idaho-sans-unite`, `idaho-malt`, `idaho-g`), Chrome réel, 390 tactile et 1280, clair et cave. Script `capturer-p4.mjs` (60 captures de la ligne + `console-p4.txt` : aucune erreur de page, un 404 de ressource sans lien), `montages-p4.mjs`. Montages OUVERTS en image : `montage-idaho-piece-390-1/-2`, `montage-idaho-voisin-390-1`, `montage-idaho-piece-1280-1` ; les autres (`-1280-2`, `idaho-voisin-1280-*`, `idaho-voisin-390-2`) portent les mêmes états et les mesures du journal (sorties cochées, « proposé », aucun débordement, « 0 → 1 pièce » absent) sont identiques aux quatre ouverts : non ouverts un à un.
  - Vu : repos = « Relier à Idaho 7 » proposé (jaune tireté), FACTURE « pièce ne s'ajoute pas » | STOCK « compté en g, 0 g », cinq cases « 1 pièce = ? g · g proposé, comme au stock » ; chaque sortie (bis, relier, nouvel article) se coche, le trait passe `≈` / `?` / `+` ; après « pièce » rien ne change (ligne toujours à remplir) ; après « g » : « 1 g », le face à face D374 « article proposé · Garder ». `idaho-voisin` : « Idaho 7 bis · α 15 » proposé, trio complet.

## Essais utilisés
Un par critère (tsc, build) ; tests : trois passes (la 1re a révélé 41 rouges : voir ci-dessous).

## Tests existants changés (cible : l'ancien comportement que DP-4 rejette)
- `stock/unites.test.ts` (D214, « Stk » face à un malt en kg) : attendait « nouvel article d'office », attend maintenant « relié, proposé ».
- `nom-b/ecran-nom-b.test.tsx` (2 tests) : le champ du nom est remplacé par la vue et ses trois sorties quand le nom français est celui d'un article du stock.
- Fixtures « Maris Otter, 1 pce » (malt en pièce sans poids, n'entre plus au stock) passées en « Kg » : `drive-fond/feuille`, `raccord/changer-fichier`, `raccord/ecran-lecture`, `raccord/ecran-recu`, `pages/cadre.ts` (ces 5 fichiers n'ont rien à voir avec le stock).

## Doutes et limites
- La cause exacte de la capture 1 (aucune vue) tient à ses données réelles, que je n'ai pas : j'ai corrigé les deux voies possibles (unité, et même nom sans voisin trouvé).
- Quantité absente + même nom (D381 B1/B2 : « bis » proposé, non relié) : hors DP-4, inchangé ; la vue et les sorties y paraissent désormais.
- Le bouton « compter en g » n'est pas joué par un test d'écran (un nom avec poids, « Idaho 7 100 g », n'est pas relié par le rapprochement de noms : la ligne n'est reliée que par ⇄) ; fonctions pures testées, code typé.
- Un houblon/malt neuf en pièce AVEC poids lu reste permis en pièce (le poids est connu) ; l'écriture au stock reste en pièce. Le refus de « Confirmer » vit dans l'écran (`errors`) : `validatePurchase` (services/purchaseEntry.ts, hors de mon périmètre) n'a pas la règle, donc un autre chemin d'enregistrement (actions rapides) ne la verrait pas.
- Le poids de la « fiche » (catalogue) n'est pas lu : les fiches houblon n'ont pas de poids de conditionnement.
- Défaut d'affichage existant non touché : en « Nouvel article » actif, le » du champ « article « Idaho 7 » » passe à la ligne.

DÉCISION À PRENDRE : porter la règle « houblon/malt neuf en pièce sans poids » dans `validatePurchase` (services/purchaseEntry.ts), pour que tout chemin d'enregistrement la tienne ? Recommandation : oui, une voie dédiée (hors Possède de p4) ; aujourd'hui seul l'écran « Nouvelle dépense » refuse.

CONNAISSANCE : pour un houblon/malt, `readProductLabel` ne lit un poids de pièce que pour une levure ; un poids dans le nom d'un houblon en pièce (« Idaho 7 100 g ») rend la ligne « inconnue » face à « Idaho 7 » (le 100 devient un nombre d'identité).
LEÇON PROPOSÉE : aucune
