OK — 11 problèmes, 3 bloquants

# Test d'écran — Finances, port des choix du 15.11 (Payer m5pa-d, Apport m5ap-a, Fiche m5fo-a, Modifier m5mo-c)

Version : 8151bee7 (arbre propre). Banc local `?dev-local&finance-demo`, profil Chrome neuf à chaque passe (rien d'écrit hors du
banc local). 390 tactile (Puppeteer mobile) et 1280 ; clair et sombre (`cave`). Captures comparées côte à côte avec
`work/missions/2026-11-14-finances/voies/m5/<id>/<id>.png`. Aucune erreur de page sur les quatre passes.

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| ops-390-clair.png | clair | 390 | Opérations au repos | 0 | 0 |
| fiche-apayer-390-sombre.png | sombre | 390 | fiche du loyer à payer | 0 | 0 |
| payer-ouvert-390-clair.png | clair | 390 | fiche › Noter un paiement, 2 pièces de l'Atelier | 2 | 0 |
| payer-ouvert-1280-clair.png | clair | 1280 | Payer ouvert | 2 | 0 |
| payer-autre-390-clair.png | clair | 390 | virement 300,00, « autre » date, autres moyens | 2 | 0 |
| payer-trop-390-clair.png | clair | 390 | virement 700 (au-delà de 460) | 2 | 1 |
| payer-apres-390-clair.png | clair | 390 | après ✓ Payer 300,00 | 1 | 0 |
| fiche-payee-1280-sombre.png | sombre | 1280 | fiche d'une pièce payée | 0 | 0 |
| modif-30-390-clair.png | clair | 390 | Modifier 42,00 → 30,00, « Reste à payer » | 2 | 1 |
| modif-4550-1280-sombre.png | sombre | 1280 | Modifier 186,80 → 45,50, « Le paiement suit » | 1 | 1 |
| apport-ouvert-390-sombre.png | sombre | 390 | Apport ouvert | 2 | 1 |
| apport-500-390-clair.png | clair | 390 | apport 500,00 | 3 | 1 |

Bloquants : 3

Gestes vus et justes : fiche du loyer › « Noter un paiement » ouvre Payer avec les deux pièces de l'Atelier, la plus ancienne
d'abord ; virement 300,00 → retard 60,00 soldé, loyer 240,00 « sur 400,00 · reste 160,00 », barre hachurée « reste 160,00 » ;
✓ Payer 300,00 → Opérations : « en retard 60,00 » disparaît, Loyer « Reste 160,00 CHF à payer », payé 536,80, à payer 160,00 ;
Modifier 42,00 → 45,50 : « Le paiement suit · payé 45,50 » / « Reste à payer · payé 42,00 · reste 3,50 », aperçu avant / après
comme m5mo-c ; Apport : 500 sur la flèche, Caisse +500,00, « Dans l'autre sens » passe en « De la brasserie à ta poche »,
Caisse −500,00, bouton « Enregistrer le prélèvement ».

## Problèmes

1. Bloquant — valeur fausse : Modifier, baisse sous le montant déjà payé avec « Reste à payer ». Nettoyant alcalin payé 42,00,
   montant mis à 30,00 : le choix dit « payé 0,00 · reste 30,00 » et la rangée après dit « à payer · 25 nov. · dans 10 j »
   (modif-30-390-clair). Même chose sur Malt et houblons 186,80 → 45,50 : « Reste à payer · payé 0,00 · reste 45,50 »
   (modif-4550-1280-sombre). Les 42,00 (ou 186,80) sont sortis de la banque ; le plan les annule par contre-paiement et les fait
   disparaître, puis invente une échéance au 25 nov. pour un achat payé. En brasseur : « j'ai payé 42, pourquoi il dit que j'ai
   rien payé ? ». Sur une baisse, « Reste à payer » n'a pas de sens : montrer « trop payé 12,00 » (avoir à recevoir) ou ne
   proposer que « Le paiement suit ».
2. Bloquant — valeur fausse : Payer, virement tapé au-delà du total. Le champ garde « 700 » en rouge, le message dit « au plus
   460. La valeur précédente (460,00) est conservée », mais la barre et le bouton prennent 70,00 (« loyer 10,00 · reste 390,00 »,
   « ✓ Payer 70,00 ») (payer-trop-390-clair). Trois montants différents à l'écran ; un toucher sur Payer paierait 70,00.
3. Payer, même état : le message d'erreur s'écrit en colonne de six lignes à droite du champ et rétrécit le champ au milieu de
   la ligne ; illisible et pas à sa place (sous le champ, sur une ligne) (payer-trop-390-clair).
4. Bloquant — valeur fausse et écart à sa maquette : Apport, « Ventes − dépenses −5,40 ». Avec ces mêmes pièces, sa maquette
   m5ap-a montre +23,20, et Opérations juste derrière dit +720,00 et « dépensé 696,80 » (Matériel à part). L'écran compte ici le
   matériel à amortir (28,60) comme dépense, Opérations non : deux résultats pour le même mois (apport-ouvert-390-sombre,
   apport-500-390-clair).
5. Payer à 1280 : le contenu s'arrête vers 850 px alors que la feuille et le pied vont jusqu'à 1000 px ; bande vide à droite,
   boutons plus larges que le corps (payer-ouvert-1280-clair). Pas net à côté de la fiche, centrée et pleine.
6. Écart à sa maquette, 390 : les valeurs des champs sont collées en haut de cases hautes au lieu d'être centrées. « 460,00 » /
   « 300,00 » de Ton virement (payer-ouvert-390-clair, payer-autre-390-clair) ; Nom, Date et Montant de Modifier, où « 30 » est
   en haut à droite et « sans TVA » en dessous au lieu d'être sur la même ligne comme dans m5mo-c (modif-30-390-clair) ;
   Motif de l'Apport (apport-500-390-clair). À 1280, les mêmes champs sont centrés.
7. Pas pratique : Payer avec « autre » date : le bouton « ✓ Payer 300,00 » devient gris, sans un mot ; la cause (date vide
   « jj.mm.aaaa ») n'est dite nulle part, et le toucher ne fait rien (payer-autre-390-clair).
8. Écart à sa maquette : titre « Payer Atelier » au lieu de « Payer l'Atelier » (m5pa-d) ; « Atelier » seul se lit mal
   (payer-ouvert-390-clair, payer-ouvert-1280-clair).
9. Pas pratique : Payer, virement 300,00, décocher le loyer : le montant reste à 300,00, « Le virement dépasse ce qui reste à
   payer (60,00 CHF) », bouton « ✓ Payer — » ; il faut retaper 60 à la main (vu au texte de l'écran, état payer-une).
10. Illisible : Opérations après le paiement partiel, la pastille « Reste 160,00 CHF à payer · 25 nov. … » est coupée à 390 ;
    « dans 10 j » disparaît (payer-apres-390-clair).
11. Écart à sa maquette : Apport, les choix non pris (« autre date… », « Espèces », « TWINT », « Autre ») n'ont plus de bord et se
    lisent comme du texte, pas comme des boutons ; « ⇄ Dans l'autre sens : je reprends » est en noir, pas en lien bleu comme
    m5ap-a (apport-ouvert-390-sombre, apport-500-390-clair).

## Doutes (non comptés)

- Fiche payée : la pièce du banc « Malt et houblons · Pale Ale » n'a qu'une ligne, « Pilsner · 25 kg » à 186,80 (7,47 CHF/kg, aucun
  houblon) ; donnée du banc, pas de l'écran, mais le brasseur la lirait comme fausse. Pas de lien « Recette · Pale Ale » comme
  m5fo-a : sans doute faute de recette reliée dans le banc.
- Apport, montant 0 puis Enregistrer : aucun message vu dans le texte de la feuille ; capture apport-erreur non jugée.
- Les captures `fiche-payee-390-*` et `fiche-payee-bas-*` montrent encore la feuille Payer (état non atteint par la passe) :
  à ignorer ; la fiche payée est jugée sur fiche-payee-1280-sombre.
