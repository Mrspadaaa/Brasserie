OK — 16 problèmes, 2 bloquants

# v01s contre v01 : critique Persona brasseur (22.11)

Version : maquette `choix-saisie.html?v=v01s` (captures `captures/v01s/`, NOTES.md § v01s). Base : `captures/planche/v01-clair.png`.
Thème clair seul (la cave est abandonnée, règle du 22.11). Écrans à 390 × 844 et 390 × 660. Pas de 1280 : c'est une maquette téléphone.

Captures ouvertes à pleine taille : repos, achat, vente, loyer, apport, abo, fin, rpiece, rembt, okr, hab, repos-660, loyer-660, abo-660 et tableau.
`ok` et `okb` ont été lues sur `planche-v01s.png` seulement : leur texte est lisible, et elles sont identiques aux confirmations de v01.

## Ce qui tient de v01 (règle n° 1)
Sont repris tels quels :
- les tuiles « Ça sort » et « Ça rentre » sur fond teinté, à 844 ;
- la tuile Remboursement en pointillés ;
- la carte de p3c-3 (nom, grand montant, catégorie, Payé aujourd'hui, À payer, Banque) ;
- la bande « Ça sort [genre] changer » ;
- le pied « Mon mois » avec le bouton qui dit le sens ;
- les trois confirmations ;
- l'apport hors Mon mois.

L'écart annoncé (la carte au-dessus des tuiles) se reconnaît. Le gain est réel : le clavier est ouvert dès l'entrée, et il n'y a jamais à le fermer, ce qui fait 7 touchers de moins sur les 6 cas.

## Problèmes (B = bloquant, m = moyen, d = détail)

1. **B. Le nom générique posé par le genre est une valeur fausse** (achat, vente, apport, abo, abo-660).
   - Dans v01, la carte portait le vrai nom : « Malt Pilsner », « Logiciel de compta », « De ma poche », « Loyer de l'atelier ». Dans v01s, elle dit « Achat », « Vente », « Apport », « Abonnement ».
   - La maquette se contredit elle-même. « De quelle pièce ? » et les habituels montrent Malterie, Quincaillerie et Malt Pilsner, des noms que ce parcours ne produit plus. Après un mois, on aura dix lignes « Achat », et « Chercher un nom » ne trouvera rien.
   - Pour nommer, il faut toucher le crayon et ouvrir le clavier texte. Ce geste n'est compté nulle part.
   - Correction : sous la carte, une fois le genre choisi, une rangée de puces avec les derniers noms de ce genre (Malterie · Quincaillerie · …), un toucher chacune. Le genre reste en gris comme texte indicatif. Loyer et Salaire gardent le nom de leur plan.
2. **B. Les habituels sont relégués, et c'est un écart non annoncé à sa maquette** (repos, repos-660).
   - Dans v01, ils sont en tête : une liste qui dit ce que chacun solde (« prévu le 22.12 · le solde », « dernier le 03.10 »).
   - Dans v01s, ce sont trois puces en bas, sans ce sous-titre, et « De ma poche » est devenu « Apport ».
   - À 390 × 660, son vrai téléphone (19.11), ils sont sous le pli. Le chemin le plus court (2 touchers) devient le moins visible. Cela enfreint la règle n° 1 (D105, L03).
   - Correction : une rangée défilante d'habituels juste sous la carte, avant « Ça sort ». Chaque puce montre le nom, le montant et « 22.12 · solde ». Elle doit rester visible à 660, avec des tuiles en ligne de 40 px pour garder « Ça rentre ».
3. **m. « Revient ? » n'est plus en segments** (achat, vente, apport, rembt).
   - v01 montrait quatre segments, 1× · Mois · Trim. · Année. v01s les remplace par une puce déroulante « Une fois ⌄ ».
   - Le choix est caché, et un achat qui revient demande un toucher de plus. C'est un écart non annoncé.
   - Correction : remettre les 4 segments, qui tiennent sur une ligne.
4. **m. La frise de fin est cachée derrière « date »** (fin).
   - Dans v01, elle apparaissait sur place dès « 1 an · 12 fois ». Dans v01s, il faut ouvrir un plateau.
   - Deux boutons noirs sont alors visibles ensemble, « Payé −29,90 » et « OK » : lequel toucher ?
   - Correction : masquer le pied tant que le plateau est ouvert, ou montrer la frise sur place sous « jusqu'à » comme v01.
5. **m. L'achat a perdu son lien au stock** (achat).
   - Dans v01 (d), on voyait « Catégorie », son explication, et « Articles · 1 : Malt Pilsner · 25 kg, stock +25 kg ». Dans v01s, tout est replié dans « Articles, fournisseur, TVA · facultatif », et les puces de catégorie n'ont plus de titre.
   - Correction : garder visible une ligne « Articles · n » quand le genre est Achat.
6. **m. « Seul écart à v01 » est faux** (tableau, NOTES).
   - Il y a au moins quatre autres écarts : les habituels, le rythme en puce, la frise derrière « date », la catégorie et les articles repliés, et les tuiles en ligne à 660.
   - Côte à côte, il le verra. Correction : lister chaque écart, ou le défaire.
7. **m. Du texte est coupé à 660** (loyer-660, abo-660).
   - « … sans fin » et « … 22.10.27 · 12 fois » sont coupés à mi-hauteur par le pied, et « Σ 12 mois » est caché. Les NOTES annoncent pourtant « 0 rognage ».
   - Correction : à 660, une seule ligne Calendrier, avec la fin et Σ dessus, au-dessus du pied.
8. **m. L'écran de repos change à 660** (repos-660).
   - Les tuiles changent de forme : icône à gauche au lieu d'icône au-dessus. « Impôts, TVA » passe sur deux lignes. Remboursement est caché.
   - Correction : un libellé court (« Impôts ») et des tuiles plus basses pour garder Remboursement visible.
9. **m. Un remboursement qui revient n'existe pas** (rembt).
   - La puce « Revient · Une fois ⌄ » y est quand même proposée. Correction : retirer le bloc rythme pour Remboursement.
10. **m. Le pli dit « Fournisseur » sur une vente et sur un apport** (vente, apport).
    - Une vente n'a pas de fournisseur, et un apport n'a pas de TVA.
    - Correction : « Client, TVA, référence » pour une vente, « Référence » pour un apport.
11. **m. « De quelle pièce ? · les dernières » n'est pas dans l'ordre** (rpiece).
    - L'ordre affiché est 14.11, 03.11, 22.10, 08.11, 25.10, 31.10. Correction : trier par date décroissante.
12. **m. Le pied flotte au milieu de l'écran** (rpiece).
    - « Mon mois — » et « Enregistrer » grisé restent entre la carte et le plateau des pièces, ce qui fait deux étages.
    - Correction : masquer le pied tant que le plateau est ouvert.
13. **m. L'habituel Loyer parle comme un développeur** (hab).
    - « pas de second plan » et « déjà au plan, rien à refaire » sont des mots de développeur. La puce « Chaque mois ⌄ » reste noire et touchable, mais n'a aucun effet.
    - Correction : « loyer de décembre · prévu le 22.12 », et le rythme en texte simple plutôt qu'en puce.
14. **d. « Pour quoi ? le genre le pose » ne se comprend pas en 3 s** (repos). Correction : « Pour quoi ? » seul, comme v01.
15. **d. Il reste de grands vides à 844** : environ 160 px au loyer, 330 px à la vente et à l'achat, 440 px à l'habituel.
16. **d. Des phrases d'explication ont été ajoutées** (rpiece, apport, fin) : « Le sens suit la pièce : une facture payée… », « Entre en caisse, sur Banque… », « glisse la poignée de droite ». C'est trop de texte (DEFAUTS). La confirmation le dit déjà.

## Doutes (non comptés)
- Deux comportements ne sont pas prouvés : le bouton épinglé au-dessus du vrai clavier iOS (`visualViewport`), et une tuile touchée sans perdre le focus du montant. Ils se jugeront au port.
- Le loyer est ancré au 22, la date du jour. Un bail tombe souvent le 1er. « dès le » est touchable, donc on peut le corriger.
- L'habituel Loyer payé le 22.11 solde l'échéance du 22.12, alors que l'échéance du 22.11 vient d'être payée. Mon mois de novembre afficherait alors −800 de loyer. Un paiement d'avance est plausible, mais c'est à vérifier.
- Une fois le genre choisi, la puce de date quitte la carte (comme dans v01). Pour un achat d'hier, « Calendrier 22.11 ✓ » est-il touchable ?
- Rien n'est dessiné pour Entrée avec un montant mais sans genre.

## Ce qui trahit v01
- Les points 2, 3, 4, 5 et 8 sont des écarts de forme. Seul l'écart de la carte était annoncé, et le point 6 le cache.
- Le point 1 retire le vrai nom que portaient les cartes de v01.

## Ce qui reste lent ou confus
- Nommer : le crayon, puis le clavier texte.
- La fin d'un abonnement : « date », puis un plateau avec deux boutons noirs.
- À 660 : Remboursement et les habituels demandent de faire défiler.
- Un achat qui revient : une puce, puis une liste.
- L'habituel Loyer : « 22.12 » affiché sous « Payé aujourd'hui ».

## Table
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| v01s-repos | clair | 390×844 | repos, clavier ouvert | 2, 14 | 1 |
| v01s-achat | clair | 390×844 | achat 40 | 1, 3, 5, 15 | 1 |
| v01s-vente | clair | 390×844 | vente 250 | 1, 3, 10, 15 | 1 |
| v01s-loyer | clair | 390×844 | loyer chaque mois | 15 | 0 |
| v01s-apport | clair | 390×844 | apport 2 000 | 1, 3, 10, 16 | 1 |
| v01s-abo | clair | 390×844 | abonnement 1 an | 1 | 1 |
| v01s-fin | clair | 390×844 | fin par date | 4, 16 | 0 |
| v01s-rpiece | clair | 390×844 | de quelle pièce | 11, 12, 16 | 0 |
| v01s-rembt | clair | 390×844 | remboursement 18,40 | 3, 9 | 0 |
| v01s-ok | clair | 390×844 | ✓ loyer | — | 0 |
| v01s-okb | clair | 390×844 | ✓ apport | — | 0 |
| v01s-okr | clair | 390×844 | ✓ remboursement | — | 0 |
| v01s-hab | clair | 390×844 | habituel loyer | 13, 15 | 0 |
| v01s-repos-660 | clair | 390×660 | repos | 2, 8 | 1 |
| v01s-loyer-660 | clair | 390×660 | loyer | 7 | 0 |
| v01s-abo-660 | clair | 390×660 | abonnement | 1, 7 | 1 |
| tableau | clair | — | décompte | 6 | 0 |

## Phrase prédite du brasseur
« Le clavier direct, c'est bien, ça va plus vite. Mais "Achat" comme nom, ça me sert à rien : je veux voir que c'est la malterie. Et remets mes habituels en haut, comme avant. »

Verdict : la passe progresse, avec 14 touchers au lieu de 21 et la base v01 reconnaissable. Elle n'est pas encore satisfaisante : il reste 2 bloquants, les points 1 et 2.

LEÇON PROPOSÉE : une simplification qui annonce « un seul écart » liste ses écarts en comparant capture par capture avec la maquette choisie, avant de l'écrire. Ici, 5 écarts de forme n'étaient pas annoncés (L03, D105).
