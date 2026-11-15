OK — passe 2 : 12 mini maquettes, défauts du critique corrigés, MINIS OK

## Fichiers écrits (tous dans voies/m2)
- `build.mjs` (assemble les 12 `etat.html` sur le fond v6a, préfixe par split/join, L26) ; `capture.mjs` (puppeteer-core, 390 px, échelle 2, réseau coupé : 0 requête bloquée, 0 erreur).
- `fonts/` (Source Sans 3, IBM Plex Mono, copiées de voies/p2b : aucun appel réseau).
- Par variante `<id>/etat.html`, `<id>/<id>.png`, `<id>/NOTE.md` (≤ 10 lignes).
- `tests.txt`.

## Variantes (id, genre, image ouverte)
| id | genre | idée | image |
|---|---|---|---|
| m2fo-a | a tiède | contenu actuel en rangées v6a, « Paiements » ouvert | ouverte, revue après retouche |
| m2fo-b | b froide | montant 38 px, 3 tuiles, Modifier ; « Plus » ouvert | ouverte |
| m2fo-c | c chaude | facture en barre → stock, frise facture/payé/échéance, jauge brassin | ouverte, revue après retouche |
| m2fo-d | d libre | la facture elle-même, lignes lues surlignées, tampon PAYÉ | ouverte (tampon et carré corrigés ensuite) |
| m2pa-a | a tiède | montant, Tout, segments date et moyen ; partiel 250 → reste 150 | ouverte |
| m2pa-b | b froide | un geste « Tout payé 400,00 » ; partiel ouvert dessous | ouverte |
| m2pa-c | c chaude | barre à tirer payé/hachure + effet sur novembre (575,40 / 150,00) | ouverte |
| m2pa-d | d libre | un virement à l'Atelier, plus ancien d'abord (300 → 60 + 240, reste 160) | ouverte, revue après retouche |
| m2mo-a | a tiède | pièce en tête (Photo / Fichier), champs rangés, montant verrouillé, Drive | ouverte, revue après retouche |
| m2mo-b | b froide | « + pièce » = appareil photo ; la feuille confirme, accord 42,00 | ouverte |
| m2mo-c | c chaude | pièces de novembre 4/6 + édition sur place de la rangée | ouverte |
| m2mo-d | d libre | tournée des pièces : 4 sans pièce, viseur, déclencheur | ouverte (lectures déplacées en haut ensuite) |

## Critères
- G1 : `controle-minis.mjs … m2` → `MINIS OK (12 maquettes, 3 vues)` (tests.txt).

## Données (v6a)
Fiche : Malt et houblons · Pale Ale 186,80 = 72,50 + 38,40 + 48,90 + 27,00, payé 9 nov. Payer : Loyer 400,00 à payer le 25 nov. ; retard 60,00 (20 déc. 2025).
Modifier : Nettoyant alcalin 42,00, payé 9 nov., sans pièce. Inventés et à vérifier au port : facture 1187 du 7 nov., ticket 5521, prévision « Brassin Pale Ale » 210,00, échéance 7 déc.

## Prédiction
« m2pa-d et m2mo-d, ça c'est malin ; m2fo-c parle, mais la fiche a doit rester aussi compacte que mes lignes. »

DÉCISION À PRENDRE : aucune hors page de choix (le brasseur choisit une variante par vue).
CONNAISSANCE : le fond v6a extrait de `ref/v6a/etat.html` laisse `.v6a-app` ouvert : le refermer, sinon la feuille passe dans le fond masqué.
LEÇON PROPOSÉE : aucune

## Passe 2
- Défauts corrigés (SYNTHESE.md, lignes m2) dans build.mjs par remplacements vérifiés (38 + 4, chacun trouvé une fois), régénéré par build.mjs puis capture.mjs : 0 requête bloquée, 0 erreur.
- Genres gardés, aucune greffe. Légendes et modes d’emploi retirés : « PLUS · OUVERT » (fo-b), « surligné… touche » (fo-d), règles en pied (pa-a), « ouvert : paiement partiel » (pa-b), « Tire jusqu’à… » (pa-c), « Touche un mot souligné… » (mo-c).
- fo-a stock 44 px, sans petites capitales ; fo-b tuiles pleines ; fo-c « Achat prévu · Pale Ale · 210,00 », banque sur le point payé ; fo-d Modifier, Recette, ⋯ et la ligne Paiement ; pa-d champ clair ; mo-a Drive en mots, une ligne ; mo-b sans Retirer, total une fois ; mo-c bords pleins, catégorie une fois ; mo-d clair hors viseur.
- 12 images rouvertes après retouche (fo-b, pa-b, mo-d rouvertes une deuxième fois : tuile, trait résiduel, lectures du viseur blanches).
- Chaque NOTE.md : ligne « passe 2 : défauts corrigés » (6 à 8 lignes).
- Tests : controle-minis.mjs … m2 (12 ids) > tests.txt → MINIS OK (12 maquettes, 3 vues), code 0.
- Prédiction : « m2pa-c et m2mo-d parlent seuls maintenant ; m2fo-a est enfin tenable au doigt. »
