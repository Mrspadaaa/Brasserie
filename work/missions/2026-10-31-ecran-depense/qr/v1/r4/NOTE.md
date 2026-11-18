# r4b — le total chiffre à chiffre, passe 2 (chaude ; candidate 3 du tri)

**Idée** (inchangée) : en contredit, trois témoins du total en colonnes, lu, QR et somme des lignes. La colonne fautive (04 / 40) se
voit d'un coup d'œil, et c'est deux contre un. Ailleurs, le total s'écrit une fois, son sceau QR à côté.

## Base en ligne (règle n° 1) : élément par élément
| élément de l'écran en ligne | dans r4b |
|---|---|
| en-tête « Nouvelle dépense », justificatif, × | repris tel quel |
| « Voir le justificatif » (pli) | repris tel quel |
| bandeau : fournisseur à gauche, **date en haut à droite** | repris tel quel |
| total 32 px, « CHF » | repris tel quel ; en contredit, il devient la rangée « lu » du duel (même taille, même place) |
| **chip « N lignes »** (coche ou alerte), qui ouvre la preuve | repris tel quel (`r4b-geste-preuve.png`) ; en contredit, au bout de la rangée « lu » |
| barre des lignes par lien, **récap cliquable** | repris ; un segment touché cerne sa ligne et la montre (`r4b-geste-barre-ligne.png`) |
| preuve (Somme des lignes, Quantité × prix, Lectures d'accord) | reprise au toucher de la chip, sans rangée QR (le QR a son sceau) |
| tuile 1 TVA | reprise telle quelle |
| **tuile Règlement, fermée au repos** (R1) | reprise telle quelle dans les six états : « ① Règlement · Payé le 12.10.2026 · supposée », numéro compris ; au toucher, le panneau de l'app (Déjà payé, Payé le, « C'est la date » / « Autre date ») |
| proposition du QR (R1) | en confirme et contredit seulement, un chip pointillé ambre « À payer · 30 j · 11.11 · proposé par le QR » ; rien ne change sans lui : un toucher l'adopte, et alors seulement la tuile dit « À payer · 11.11 », sa jauge et « déduite : QR, 30 jours net » (`r4b-geste-proposition-adoptee.png`, `-ouverte.png`). En sans, partiel, illisible : la base seule |
| chips numérotées des points | reprises et numérotées dans l'ordre : ① Total (contredit seulement, saute au duel et le cerne), puis Règlement, puis mouture ×1 +3,75 (`r4b-geste-point-1.png`) |
| mouture « Rattacher » sous Maris Otter (R2) | reprise de z2 et z4 : « mouture » et « Rattacher » ; au toucher, « ✓ mouture → Maris Otter » et le point mouture barré (`r4b-geste-rattacher.png`) |
| lignes : picto de lien, nom, **pastilles « +10 kg »**, quantité, montant | reprises telles quelles (`data-mots="lignes"`, D238) |
| « + Ajouter une ligne », « Regrouper en une dépense », « Détail : x / y CHF » | repris ; en contredit, le second total du Détail en attention |
| **plis** Pour quoi ? (proposé), Achat du, Fournisseur et catégorie, Lier à une dépense prévue, Référence et TVA | repris tels quels, sous les lignes à 390 et sous les tuiles à 1280, comme en ligne |
| pied « Drive prêt » et « Confirmer » | repris ; Confirmer jamais bloqué, même pendant la lecture (comme en ligne) |
| lecture : « verrouillé pendant la lecture », squelette | repris ; le QR s'y imprime d'abord |
| la phrase « Le justificatif sera rangé dans ton Drive privé… » (1280) | non reprise : une phrase d'aide au repos (brief) |

## Retouches du verdict v1 (R1, R2, facultatif)
- R1 : voir les lignes Règlement et proposition ci-dessus. La passe 2 écrivait « À payer » dans les six états, un champ changé sans lui.
- R2 : le jeu de données de z2 et z4 : 7 lignes, Maris Otter 25 kg 52,50 et sa mouture 3,75, Pilsner Malz 18,00, Carafa II 6,40
  (nouveau), Citra 12,5 % 9,80, Safale US-05 9,20, Port 10,75 (110,40) ; « 6 proposées par la lecture, à vérifier » ; compte de la
  preuve 4 reliés, 1 nouveau, 1 mouture, 1 sans stock ; Fournisseur « Malterie Fictive SA · Malts », Référence « À vérifier ».
- Facultatif pris : « Photographier le QR » dans la rangée hachurée de l'illisible (`r4b-geste-photographier.png`).
- La tuile TVA (base en ligne) est gardée ; z2 et z4 ne l'ont pas : c'est le seul écart de mise en page entre les trois.

## Défauts du tri corrigés
1. Confirme : une seule rangée (110,40 et le sceau QR dessiné ✓), la double écriture n'existe plus qu'en contredit.
2. « Garder **110,40** » (plein, le QR, avec les lignes) et « Garder **110,04** » : chaque bouton porte sa valeur.
3. « sans » dit : cercle vide en pointillé « sans QR » à la place du sceau, différent de la lecture (« 0,4 s », à comparer) et de
   l'illisible (QR barré, cases hachurées « ??? »).
4. Tailles : la rangée QR et la rangée des lignes passent à 20 px, la taille du titre de l'app : aucune taille neuve (32, 20, 16, 14, 12
   sont toutes de la base).
5. Tuile Règlement : remplacé par R1 (la base, puis la proposition à adopter). Une fois adoptée, la jauge est ambre sur un rail bordé
   de gris foncé (contraste du trait).

## Greffes
- le QR dessiné (24 px au total, 20 px en tête de rangée) à la place du mot « ✓ QR » (z2) ;
- la feuille « Ce que dit le QR » au toucher du sceau : chaque champ « = lu », « lu 110,04 » ou « pas dans le QR » ; IBAN et
  référence sur deux lignes, en mono, rien de rogné à 390 ; « Copier », puis la coche « copié » ; conditions S1 (z2 / r3) ;
- le cercle vide « sans QR » (u4) ;
- le point numéroté 1 qui saute au duel (u1 / z1) ;
- la rangée QR hachurée « ??? » en illisible (u3).

## Honnêteté (retouches communes)
Rien ne change sans lui : en contredit, le total reste 110,04 jusqu'à « Garder » ; après « Garder 110,40 », le sceau dit « pris » et
la rangée lue reste, barrée, « remplacé » ; après « Garder 110,04 », le QR reste là, « non pris », la colonne marquée. « Confirmé »
n'est dit que de ce que le QR porte : en partiel, montant, n° et date sont « pas dans le QR ». L'échéance est marquée « déduite »
avec sa règle, et le règlement ne change qu'au toucher de la proposition (R1). Confirmer n'est jamais bloqué.

## Boosters UX (boosters-ux)
- `chiffres` : comparer, colonnes de 20 px (contredit) ; `garder` : choisir, deux boutons chiffrés ; `ce-que-dit-le-qr` : lire, le
  sceau ouvre la feuille ; `copier` : déclencher ; `echeance` : suivre, jauge et panneau ; `preuve` : chip ; `barre-lignes` : segment
  vers sa ligne ; `point-total` : la chip vers le duel. Chaque geste a une capture avant et après.
- `proposition-qr` : choisir, le chip adopte le règlement du QR ; `rattacher` ; `photographier` (illisible).
- B2 OK (total ; un primary). B3 OK (78 mots hors lignes). B6 OK (aucune taille hors base). B7 OK (pire 4,73:1). B8 OK (six états,
  inconnu en points, illisible hachuré). B11 « Le QR confirme 110,40 ; en désaccord, les deux derniers chiffres sont inversés. »
  B12 OK (STANDARD OK). B13 OK (sceau 32 px, boutons 28 px).
