OK — 4 problèmes, 0 bloquant

Version : bb209d6ab5b8af29731fd579ddfa9e5cd26d6e9f
Maquette choisie : `v0/f2d/` (f2d-haut, f2d-ferme, f2d-etat, f2d-sombre, f2d-1280), « sans son titre » (10.11). Chaque capture ci-dessous ouverte en image, côte à côte avec la sienne. Les `-1280-sombre` datent d'avant la dernière passe : non jugées.

## Table

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| depense-ferme-390-clair | clair | 390 | fermé, « Mon mois +58,40 », Règlement « Payé le 10.11.2026 · par défaut » | 0 | 0 |
| depense-ferme-390-sombre | sombre | 390 | idem | 0 | 0 |
| depense-ferme-1280-clair | clair | 1280 | idem, bouton à gauche, Enregistrer à droite | 0 | 0 |
| depense-ouvert-paye-390-clair | clair | 390 | carte ouverte, Payé coché, payé 355,20 +58,40, dépensé 755,20 +58,40, Brassage 245,20 segment plein cerné | 1, 3 | 0 |
| depense-ouvert-paye-390-sombre | sombre | 390 | idem | 1 | 0 |
| depense-ouvert-paye-1280-clair | clair | 1280 | carte en bas à droite comme f2d-1280 | 1, 3 | 0 |
| depense-ouvert-apayer-390-clair | clair | 390 | À payer coché ; Règlement derrière = « À payer » (plus de « par défaut ») ; à payer 458,40 +58,40 cernée ; segment Brassage hachuré cerné | 1, 3 | 0 |
| depense-ouvert-apayer-390-sombre | sombre | 390 | idem | 1 | 0 |
| depense-ouvert-apayer-1280-clair | clair | 1280 | idem | 1, 3 | 0 |
| caisse-ouverte-encaisse-390-clair | clair | 390 | ✓ Encaissé ; encaissé 774,00 +54,00 ; Ventes +774,00 segment plein ; reçu « Quittance · payé ici » | 1, 2, 3 | 0 |
| caisse-ouverte-encaisse-390-sombre | sombre | 390 | idem | 1, 2 | 0 |
| caisse-ouverte-encaisse-1280-clair | clair | 1280 | idem, carte à gauche de la rangée, sur les bières ; « réglé en TWINT / Espèces » visible, rien de coché | 1, 2, 3 | 0 |
| caisse-ouverte-qr-390-clair | clair | 390 | Facture QR ; à encaisser 54,00 +54,00 cernée verte ; Ventes hachurée ; « Facturer 54,00 CHF » ; annexe Facture | 1, 3, 4 | 0 |
| caisse-ouverte-qr-390-sombre | sombre | 390 | idem | 1, 4 | 0 |
| caisse-ouverte-qr-1280-clair | clair | 1280 | idem, facture QR dans l'annexe | 1, 3, 4 | 0 |

Vérifié et juste partout : forme de f2d reprise (bascule 32 px, trois tuiles, piles avec Matériel à part, bouton 44 px avec mini-piles et pastille), aucun titre, seul « novembre » ;
la bascule est le règlement réel (champ Règlement derrière passe de « Payé le 10.11.2026 · par défaut » à « À payer » ; Caisse : reçu « Quittance · payé ici » contre « Facture n° FAC-2026-0001 · payable au 10 déc. ») ;
écarts au centime : 296,80 + 58,40 = 355,20 ; 400,00 + 58,40 = 458,40 ; 696,80 + 58,40 = 755,20 ; 186,80 + 58,40 = 245,20 ; 468,00 + 245,20 + 42,00 = 755,20 (28,60 de matériel à part, comme f2d) ; 720,00 + 54,00 = 774,00 ; 400 + 68 = 468 (Fixes : hachure et violet) ;
cibles : bouton 44, bascule 32, tuiles ≥ 44 (CSS `om-`) ; deux thèmes lisibles ; rien de coupé à 390 ni à 1280 ; sens métier plausible (malt Pilsner 25 kg à 58,40, 12 verres à 4,50).

## Problèmes

1. **Le pied passe sous le voile quand la carte est ouverte** (toutes les captures « ouvert », deux thèmes, 390 et 1280). Le voile est `position: fixed; z-index: 30` et le pied (`<footer class="relative">`, `om-bas z-index: 5`) n'a pas de z-index au-dessus : « Enregistrer » et « Encaisser / Facturer » sont grisés et un toucher dessus ferme la carte au lieu d'enregistrer ; en sombre, le bouton « Mon mois » qui vient d'ouvrir la carte a l'air désactivé (gris). Dans f2d-haut et f2d-sombre, le pied reste net et touchable sous la carte. En brasseur : « je choisis Payé puis je tape Enregistrer, et ça ferme juste la carte ». Correction : le pied (ou ses deux boutons) au-dessus du voile (z-index > 30), voile qui ne couvre que la saisie, comme la maquette. Non bloquant (le deuxième toucher enregistre).
2. **Caisse, après « ✓ Encaissé » : « Encaisser 54,00 CHF » reste gris sans raison visible** (caisse-ouverte-encaisse, 390 et 1280, deux thèmes). Cause : `peutPrimaire` exige un moyen (TWINT ou Espèces) en mode payé ; la bascule écrit le mode mais pas le moyen, et à 390 la carte cache la rangée « réglé en ». Dans f2d-etat, « Encaisser 54,00 » est noir. En brasseur : « j'ai dit Encaissé, pourquoi je peux pas encaisser ? ». Correction : à la bascule « Encaissé », garder le dernier moyen ou le demander dans la carte (deux pastilles TWINT / Espèces sous la bascule), ou au moins un mot sous le bouton gris. Non bloquant (règle déjà dans la Caisse avant le port).
3. **Piles ternes en clair, pas les couleurs de f2d** (toutes les captures clair ouvertes) : vert olive, brun et bleu acier au lieu du vert menthe, de l'or et du cyan de f2d-haut ; le thème sombre, lui, a exactement les couleurs de f2d. Le même écran change de palette entre les deux thèmes. En brasseur : « en clair c'est éteint, c'est pas ce que j'ai choisi ». Correction : les couleurs des piles de f2d dans les deux thèmes (jetons d'aire fixes, pas `--area-*-texte` du thème). Non bloquant (D106 vise les fonds et l'encre ; ici ce sont des aplats de données).
4. **Caisse, « à encaisser » hachuré en ambre** (caisse-ouverte-qr, 390 et 1280, deux thèmes) : le segment de la pile Ventes et le picto de la tuile « à encaisser » portent la hachure ambre des dépenses à payer ; dans f2d-etat (NOTE : « QR : Ventes hachurée verte »), la hachure est verte, celle de l'argent qui entre. En brasseur : « une vente à encaisser, c'est pas une facture à payer ». Correction : hachure et picto verts (`--om-hach-a` = vert entrées) quand `sens = 'in'`. Non bloquant.

## Doutes (non comptés)

- Carte ouverte, le curseur reste dans « 58,40 » (caret visible sur toutes les captures Dépense ouvertes) : sur un téléphone, le clavier resterait levé et couvrirait le bas de la carte. À vérifier sur l'appareil ; sinon, retirer le focus du champ à l'ouverture.
- Caisse 1280 : la carte se pose à gauche de la rangée, sur les tuiles 33 cl / fût 20 L, loin du bouton « Mon mois » ; f2d n'a pas de vue Caisse à 1280. Le brasseur pourrait la vouloir au-dessus du bouton. À lui montrer plutôt qu'à corriger.
- Chiffres « payé » 296,80 / 355,20 au lieu de 325,40 / 383,80 dans f2d : l'app est juste (296,80 + 400,00 = 696,80 = dépensé avant), la maquette comptait le matériel 28,60 dans « payé » sans le compter dans « dépensé ». Aucune correction.
- Caisse, bouton « Mon mois » à l'état fermé : pas de capture (non demandée). Caisse 1280 sombre et Dépense 1280 sombre : captures périmées, non jugées. DEMANDE EXECUTANT si le pilote veut la version complète avant déploiement : rejouer `captures/capturer.mjs` pour `caisse-ferme-390-{clair,sombre}` et toutes les `-1280-sombre`, puis me les renvoyer.
