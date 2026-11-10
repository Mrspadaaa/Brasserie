# Verdict e-t6 — port de p3c-3 (avec z2) dans l'app

**À RETOUCHER** — l'écran est bien sa maquette (bandes teintées, quantités en gras et alignées, sceau z2 à l'identique, pied, plein écran
à 390), mais deux écarts qu'il ne reconnaîtrait pas (colonne gauche perdue au défilement à 1280, tête moins compacte qu'en maquette) et un
défaut visible (chip du pied étiré sur toute la largeur à 1280) sont à corriger avant de lui montrer ; six retouches de finition ensuite.

Juge : critique calibré (portrait v2), agent neuf, 01.11. Ouvertes en image, côte à côte (app à gauche, maquette à droite) : `repos` ×3,
`defile` (tactile 390, 1280), `regle` (souris 390), `tous` (tactile 390), `geste-tva` (tactile 390, 1280), `qr-confirme` (souris 390,
1280), `qr-ecart` (souris 390, tactile 390, 1280), `qr-contredit` (souris 390), `port` ×3, `erreur` ×3, `lecture` (souris 390),
`enregistre` (souris 390) ; maquette `p3c-3-repos/-defile/-geste-tva/-lecture/-echec/-1280-repos`, z2 `confirme/contredit/confirme-ouvert`.
Zooms ×3 et ×4 sur la colonne des quantités (390 app, 390 maquette, 1280 app). Pas de rejet de goût : chaque point cite ses mots ou DEFAUTS.

## Ses mots, point par point

« p3c-3 le mieux but mettre plus en avant la quantité, juste mettre en gras, et bien alignées les champs » (D248) — **tenu**.
- Zoom 390 (app) : « 6 », « 1 », « 5 », « 2 » en gras, « × 2,30 » gris fin ; « 18 Kg » de la bande en gras, son « Kg » sur la colonne
  des « Kg » des lignes. Identique au zoom de la maquette. Zoom 1280 (app) : même chose. Houblons : « 270 g + 30 ? » sur la colonne des
  « 40 g / 20 g / 100 g » ; Levures : « 7 Stk » sur « 2 Stk / 1 Stk ». Montants sur le bord droit dans les trois bandes.
« Les bandes teintées … quasiment rien ne doit être changé … un peu plus compact » (D245) — **bandes tenues, compacité en recul** (écart 2).
« Le sceau QR z2 parfait comme telle » (D246) — **tenu**. Tuile verte « QR ✓ » à droite du total, même taille, même place ; en
contredit, tuile sombre « 110,40 », duel « lu sur la page 110,04 | QR-facture 110,40 », témoin « Somme des lignes 110,40 · deux contre
un » : ce sont les éléments de z2 au pixel près (souris390-qr-contredit). La feuille « Ce que dit le QR » (Montant, Facture, Date,
Créancier « = lu », IBAN et référence en mono avec Copier) est celle de z2-confirme-ouvert.
« que cette écran prenne vraiment toute la place de l'app » (D235) — **tenu** à 390 (aucun cadre de feuille, pied collé en bas) et à 1280.
« Non non aussi quand imprimé article » (D249) — **tenu** : « dont port 10,75 » sous le total, la ligne de port hors des bandes.

## Les écarts annoncés (RESULTAT § « ce qui diffère »), jugés

| Écart | Verdict | Pourquoi |
|---|---|---|
| Bande « Autres » (Carafa II) | acceptable | rien ne se perd ; bande grise, même ossature ; il ne l'a pas dans sa fixture mais comprend en une seconde |
| « dont port » touchable, tiroir de port | acceptable sur le fond (D249) | **mais** la phrase du tiroir est un refus explicite (retouche 5) |
| Bande collante « ①② points revus » retirée | acceptable | p3c-3 ne la dessine pas ; les en-têtes de bande restent collants comme en maquette (`tactile390-defile` : « Houblons » épinglé) |
| Colonne gauche non collante à 1280 | **trahison** | la maquette l'a (`etat.html` l.257 `.p3a3-gauche{position:sticky}`) ; voir écart 1 |
| Bloc « lecture » à l'ancien squelette | écart qu'il verrait | voir écart 4 |
| Picto d'en-tête avec panneau, rubrique « Date de l'achat », règlement dans la tuile ② | acceptables | gestes non dessinés ; mêmes champs |
| Deux colonnes dès 1024 (maquette 900) | acceptable | invisible à 390 et 1280 |

## Les écarts à corriger avant de lui montrer

1. **1280, le récap disparaît au défilement** (`pc1280-defile`, `pc1280-port` : à gauche, « Brau- und Rauchshop 86,50 » et la barre ne
   sont plus là, la colonne commence à « Lectures ») ; la maquette, même geste (`p3c-3-1280-repos`, côté droit de `pc1280-defile`), garde
   total, barre, comptes et tuiles ①② sous les yeux. Il avait entouré ce récap : « un récap en haut comme sur le screen est top, avec la
   possibilité de clicker et avoir des renvois » (D235). Règle : n° 1 (D105, sa maquette telle quelle) et D235. Correction : la colonne de
   gauche `position:sticky; top:0; align-self:start; max-height:calc(100vh - pied); overflow:auto`, comme `.p3a3-gauche`.
2. **390, la tête est 64 px plus haute qu'en maquette** (`tactile390-repos` : bande Malts à y=400 dans l'app, y=336 en maquette ; à
   l'écran, deux lignes de produits de moins). Causes visibles, zone par zone : « Somme = imprimé » passe sur deux lignes (une en
   maquette) ; « · Lectures 2 lectures » prend une rangée seule (maquette : « Lectures 2/2 | Page 2 coupée » sur une rangée) ; chips
   « 0 nouveau » et « 2 sans stock » affichées (la maquette n'affiche pas un compte à zéro) ; tuile ② « Règlement / Payé le / 27.04.2026
   supposée » sur trois lignes (maquette : « Payé / même jour supposée », deux) ; ligne « 14 proposées par la lecture, à vérifier » ajoutée
   au-dessus des bandes. Ses mots : « Il faudrait juste le rendre un peu plus compact » (D245) : l'app recule là où la maquette avait
   déjà gagné. Règle : D245, DEFAUTS « trop d'espace pour rien ». Correction : reprendre la grille de la maquette (deux colonnes, deux
   rangées, 14 px), masquer les chips à zéro, « Payé le 27.04 supposée » sur une ligne, la ligne « 14 proposées » dans la pastille
   « 23 lignes » ou retirée.
3. **1280, le chip « ① TVA » du pied s'étire d'un bord à l'autre** (`pc1280-port`, `pc1280-defile` : un pointillé de 990 px, vide, entre
   « Papier » et « Confirmer »). À 390 c'est un chip de 100 px, correct. Il dirait : « c'est quoi cette grande case vide ??? ». Règle :
   DEFAUTS « ce qui sort de nulle part » / vide pour rien. Correction : `flex:none` (ou `width:max-content`) sur le chip du point courant.

## Retouches de finition (il les relèverait, sans refuser l'écran)

4. **Lecture en cours à l'ancien squelette** (`souris390-lecture` : spinner « Lecture et vérification… », deux tuiles grises
   « verrouillé pendant la lecture », barres grises, pied « Enregistrer » grisé). La maquette (`p3c-3-lecture`) : carte du fichier avec
   la frise « envoi ✓ · lecture · vérification », cadre « Les lignes arrivent ici », « Pour quoi ? à taper », « Règlement Déjà payé ·
   À payer ». Il dirait : « ça c'est pas la maquette ». Écart annoncé par l'auteur (P19 non fait). Correction : la carte-frise de la
   maquette, pied « Confirmer » désactivé (le texte « pourquoi » existe déjà, rapport l. lecture).
5. **Tiroir de port : une phrase d'explication au premier plan** (`souris390-port`, `pc1280-port` : « Port (non compté dans les bandes) : le
   montant se corrige ici ; le type d'achat remet la ligne dans sa bande. », `ExpenseSheet.tsx:729`). Règle : DEFAUTS « énormément
   d'information pour rien », légende écrite au repos. Correction : un en-tête de bande grise « Port · hors bandes · 8,50 », sans phrase ;
   l'explication, s'il la faut, derrière le picto ⓘ.
6. **L'α en double dans le nom** (`tactile390-defile`, `pc1280-repos` : « Nelson Sauvin 9.6% α 9,6 », « Sabro 13.4% α 13,4 », « Motueka
   8.1% α 8,1 » ; maquette : « Nelson Sauvin α 9,6 »). Règle : C084 « pas d'info surplus en doublon ». Correction : retirer le pourcentage
   du nom imprimé quand l'α est posé (le nom imprimé entier reste au plateau).
7. **Levures sur deux lignes, et « 2 Stk = 2 sachet »** (`tactile390-defile` : la pastille passe sous le nom, rangée de 42 px au lieu de
   29 ; singulier). Maquette : « LALLEMAND Windsor ≡ 2 sachets » sur une ligne, le nom qui se coupe plutôt que la pastille. Règle : D245
   (compact). Correction : pastille inline « = 2 sachets », pluriel, `white-space:nowrap`.
8. **Le point ① du QR flotte seul au-dessus des tuiles** (`souris390-qr-contredit` « ① Total », `tactile390-qr-ecart` « ① Date » : un chip
   isolé entre les comptes et la tuile TVA grisée). z2 le pose en tuile « ① Total » dans la rangée des tuiles. Correction : tuile dans la
   rangée (TVA grisée passe après), même pointillé ambre. Le libellé du sceau « écart » (état absent de z2) est acceptable, mais « écart »
   seul ne dit pas sur quoi : « date ≠ » tiendrait dans la tuile.
9. **Deux petites pertes dans les bandes** : le chip pointillé « 30 ? » de la bande Houblons (renvoi au point de Sabro) est devenu du texte
   nu « + 30 ? » ; les prix au gramme passent à deux décimales (« × 0,04 », « × 0,08 ») sauf « × 0,045 » : la colonne n'est plus
   homogène (maquette : 0,040 / 0,0800 / 0,045). Correction : le chip, et trois décimales pour les prix < 0,10.

## Non jugé ici
Le panneau TVA ouvert (trois tuiles « colonne MWST · lu / N + R / proposé · HT vide ») n'est capturé qu'après le choix (`geste-tva`) : le
rapport dit ses colonnes, je ne l'ai pas vu. L'état « lecture impossible » (`erreur` ×3) n'a pas de maquette p3c-3 (`p3c-3-echec` est
l'échec Drive dans Finances) : plein écran tenu, champs saisissables ; pied « Enregistrer » à aligner sur « Confirmer ».

## La phrase qu'il dirait
« Ouais c'est bien ça, les bandes, le gras, le QR c'est nickel. Mais sur PC quand je descends je perds le total en haut ??? Et c'est quoi
cette grande case vide en bas ? Et en haut sur le tel ça prend plus de place que sur la maquette, j'avais dit plus compact. »
Classe : mitigé-haut (« pas trop mal mais ») ; RETENU dès que 1 à 3 sont faites et re-capturées.

## Suite demandée
Retouches 1 à 3 (bloquantes), 4 à 9 dans la même passe si le coût est faible ; re-capturer `repos`, `defile`, `port` aux trois modes et
`lecture` à 390, puis me les rendre côte à côte.
