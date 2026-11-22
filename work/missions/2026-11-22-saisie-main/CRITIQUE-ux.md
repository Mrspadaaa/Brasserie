OK — tri UX : v08, v02, v04, v01, v03 (v02 et v08 à 12 touchers pour les 4 cas ; v04 à 2 pour un loyer déjà connu)

# Saisie à la main — critique UX mobile (22.11)

Regard : expert UX mobile (pouce, une main, clavier du téléphone). J'ai ouvert les 16 planches, clair et cave, et la plainte `00-plainte.jpg`.
Ses mots (SPEC, 22.11) : « très ostere, peu intuitif, mal fait… je peux même pas dire si c'est une vente ou un achat… un versement de loyer et dire que c'est reçurent. Pareil pour un apport ou un abonnement. »
Au tri, aucun rejet : le classement ordonne, le brasseur voit les huit (L27). Légende : **B** bloquant (valeur fausse, geste sans effet, sens ambigu, plainte rejouée), **m** moyen, **d** détail.

## Hypothèses de comptage
- Le vrai téléphone est un Android (Chrome, Gboard ; voir la plainte) de **390 × 660** utiles (L12), et non de 390 × 844 comme les captures.
  - Le clavier numérique système prend environ 300 px. Avec le clavier ouvert, on ne voit donc que la bande 0 à 360 px.
- **Touchers** : tout toucher hors chiffres, y compris la mise au point du champ, la fermeture du clavier quand il cache la cible, Entrée et Enregistrer.
  **Frappes** : chiffres du montant (400 = 3, 2000 = 4, 29,9 = 4, 40 = 2).
- Le libellé du genre suffit comme nom : on ne tape pas « Loyer de l'atelier ». Si on le tape, il faut compter environ 15 lettres de plus et passer au clavier texte.
- Une date de fin choisie dans un sélecteur coûte 2 touchers (ouvrir, choisir). Le sélecteur n'est dessiné nulle part.
- (a) loyer payé chaque mois, sans fin ; (b) apport reçu une fois ; (c) abonnement mensuel jusqu'en oct. 2027 ; (d) achat ponctuel de 40 CHF.

## Problèmes communs (comptés une fois, pas dans chaque version)
1. **B** — « Prélèvement » est ambigu dans v01, v02, v03, v05 et v08.
   - Un brasseur suisse lit « prélèvement » comme débit direct (LSV) : son loyer prélevé finirait en `withdrawal` / apports, une valeur fausse.
   - v04 dit « Pour moi » : c'est juste. Renommer partout « Pour moi », avec « prélèvement privé » en sous-titre.
2. **m** — États manquants dans les huit versions : erreur (montant à 0, aucun sens choisi, date de fin avant le début), hors ligne (« gardé sur le téléphone, envoyé au retour du réseau ») et échec d'écriture.
   - Seul « montant vide » existe, réduit à un Enregistrer grisé (v01, v03, v06, v07), sans dire ce qui manque.
3. **m** — Aucun choix de date n'est dessiné : « une date », « date », « 22.11 ⌄ », « ∞ sans fin ⌄ ».
   - Chacun doit ouvrir la frise au doigt partagée. Sa plainte du 22.11 : « Pas le bon geste au doigt… porté PARTOUT ».
4. **m** — Captures à 390 × 844, et seulement v02 et v08 montrent un clavier.
   - Pour v01, v03, v04, v05 et v06, la place du clavier système sur 390 × 660 n'est pas prouvée. Le comptage ci-dessous suppose qu'il cache le rythme et le pied.
5. **m** — La confirmation met « Saisir un autre » en primaire sans montrer « Fermer ».
   - Le geste le plus fréquent après un loyer est de sortir. Mettre « Fermer » à droite et « Saisir un autre » en secondaire, ou fermer seul après 4 s.
6. **m** — Le genre ne pose pas le rythme. Loyer, Abonnement et Salaire devraient mettre « Mois » d'office (NOTES : « le genre pose sens, catégorie, rythme »).
   - Pourtant le compte des NOTES ajoute « Mois » à chaque cas (a) : chaque version paie un toucher inutile.
7. **d** — En cave, l'ambre de sortie et le jaune du bouton d'action sont presque la même teinte (v01, v02, v06, v07). Le sens et l'action se confondent.
8. **d** — « Remboursement » n'existe qu'en « Ça rentre ». Rembourser un client est une sortie, et `refund` attend `refundOfId` (NOTES).

## Tableau des touchers (touchers / frappes)
| v | (a) loyer mensuel | (b) apport | (c) abonnement → oct. 27 | (d) achat 40 | Total touchers | Le clavier cache… |
|---|---|---|---|---|---|---|
| v01 | 5 / 3 | 3 / 4 | 7 / 4 | 3 / 2 | **18** | « Revient ? » et Enregistrer (montant à y 340) |
| v02 | 3 / 3 | 2 / 4 | 5 / 4 | 2 / 2 | **12** | rien d'utile : montant et genres au-dessus ; le Revient tombe au bord à 660 |
| v03 | 5 / 3 | 3 / 4 | 7 / 4 | 3 / 2 | **18** | le plateau des choix (la phrase reste visible) |
| v04 | **2 / 0** | 3 / 4 (+ effacer 1 500) | 7 / 4 | 3 / 2 | **15** (le mois suivant, (c) = 2) | le bas de la carte quand la ligne est basse (Bouteilles) |
| v05 | 5 / 3 | 3 / 4 | 7 / 4 | 3 / 2 | **18** | les 4 rythmes et le pied |
| v06 | 5 / 3 | 3 / 4 | 7 / 4 | 3 / 2 | **18** | rythme, règlement et pied |
| v07 | 5 / 3 + 5 lettres | 4 / 4 + 6 lettres | 6 / 4 + ~10 lettres | 3 / 2 (sans catégorie) | **18** + texte | la grille des mois (sans gravité : on la voit avant) |
| v08 | 3 / 3 | 2 / 4 | 5 / 4 | 2 / 2 (1 sans genre) | **12** | pas de clavier système : pavé intégré |

## Par version : combien et quels problèmes ?

### v08 Pavé de caisse — 6 problèmes (0 B, 4 m, 2 d)
1. **m** — Le rythme (1× / Mois / Trimestre / Année) est en pastilles de 24 px de haut, tout en haut, hors de portée du pouce. Or c'est la moitié de sa plainte (« dire que c'est récurrent »).
2. **m** — La date « 22.11 ⌄ » et la fin « ∞ sans fin ⌄ » font 11 px, avec des cibles d'environ 60 × 20.
3. **m** — La bande de genres défile et sort de l'écran : l'icône étiquette est rognée à droite. Vente, Salaire, Remboursement et Prélèvement sont cachés au repos.
4. **m** — Toucher « Pour quoi ? » ouvre le clavier texte par-dessus le pavé : deux claviers. Cet état n'est pas dessiné.
5. **d** — Plus de bouton noir ✓ : c'est un écart à la base p3c-3. Les NOTES le justifient, mais il faut le lui montrer comme écart.
6. **d** — Une bande vide d'environ 90 px sépare la carte du pavé, alors que le rythme y tiendrait en grand.
- Le brasseur : « Là je vois direct si ça sort ou ça rentre, et c'est rapide. »

### v02 ± sur le montant — 6 problèmes (0 B, 4 m, 2 d)
1. **m** — Le sens des puces de genre n'est dit que par un point de 5 px. La bascule « sort / rentre » a des étiquettes de 10 px.
2. **m** — « Revient » est un interrupteur à part, même pour Loyer ou Abonnement : un toucher de trop à chaque saisie récurrente (commun 6).
3. **m** — Les puces se touchent clavier ouvert. Sur Android, le champ perd la main et le clavier se ferme : la page saute sous le doigt. Il faut `preventDefault` au pointerdown, ou fermer le clavier exprès.
4. **m** — « jusqu'à ∞ / date » : le ∞ est cryptique et la pastille « date » fait 28 px.
5. **d** — Le pavé dessiné au repos, avec ses touches « − », « + » et « Entrée », n'est pas le Gboard réel. Sur iPhone, `inputmode=decimal` n'a ni signe ni Entrée (doute, son téléphone est un Android).
6. **d** — Cinq tailles de texte se côtoient dans la carte montant : 40, 13, 11 et 10 px.
- Le brasseur : « Ok, je tape et je dis loyer, c'est simple. »

### v04 Habituels en un toucher — 7 problèmes (0 B, 6 m, 1 d)
1. **m** — Pour un genre neuf, le sens n'est dit que par un point de 5 px sur la tuile. C'est la plainte « vente ou achat » rejouée à moitié (le mot reste lisible).
2. **m** — Les tuiles défilent et l'étiquette « Appo… » est coupée : Apport, un de ses trois exemples, est hors écran au repos.
3. **m** — Le montant prérempli (+1 500) diffère du vrai (2 000). Si le champ ne sélectionne pas tout à la mise au point, on enregistre l'ancien montant par habitude : valeur fausse possible.
4. **m** — La première fois, la liste est vide. Cet état n'est pas dessiné, et l'écran se réduit à une recherche et une bande.
5. **m** — La carte s'ouvre sur place : pour une ligne basse, le clavier cache la carte et son Enregistrer.
6. **m** — Les rythmes de la carte neuve (« 1× Mois Trim. An ») font 24 px de haut.
7. **d** — On ne sait pas ce que fait la recherche « Pour quoi ? ou un montant » quand on y tape 40.
- Le brasseur : « Le loyer en un toucher, top. Mais un nouvel apport, je le cherche. »

### v01 Le genre d'abord — 7 problèmes (0 B, 5 m, 2 d)
1. **m** — L'ordre genre → montant → rythme fait que le clavier cache « Revient ? » et Enregistrer : il faut le fermer (+1 toucher en a et c).
2. **m** — Le premier choix (9 tuiles) est tout en haut, la zone la plus loin du pouce.
3. **m** — Choisir une tuile ternit les autres à 40 % : elles ont l'air désactivées, on ne pense pas pouvoir changer.
4. **m** — La tuile choisie passe en violet de catégorie : la couleur de sens (ambre ou vert) disparaît au moment du choix.
5. **m** — La date « 22.11.2026 » en haut à droite de la carte est une cible de 11 px.
6. **d** — « Une seule fois. » répète le segment 1× : texte de trop.
7. **d** — « Remboursement » et « Prélèvement » remplissent toute la tuile en 11 px.
- Le brasseur : « Là je comprends tout de suite, ça sort / ça rentre. Un peu long. »

### v03 Phrase à trous — 7 problèmes (0 B, 5 m, 2 d)
1. **m** — Tous les trous sont entre 80 et 320 px de haut : à une main, chaque correction demande d'étirer le pouce.
2. **m** — La phrase se recompose quand une valeur change de longueur (« une fois » / « chaque mois ») : les trous bougent sous le doigt.
3. **m** — Le trou violet est à la fois le genre et le nom (« Loyer de l'atelier ») : où tape-t-on le nom ?
4. **m** — Au repos, les trous gris en pointillé sont pâles, surtout en cave, et il faut lire « Commence par le genre, le sens suit ». Pas compris en 3 s.
5. **m** — En (c), « Je paie… jusqu'en oct. 2027 » ne dit pas si le 22.11 est payé, alors que le Calendrier le coche.
6. **d** — « J'ai reçu 2 000,00 CHF : De ma poche » : le deux-points sonne faux.
7. **d** — Le bouton passe en pleine largeur et la pastille Mon mois change de place : écart à la base, justifié dans les NOTES.
- Le brasseur : « Marrant, mais je dois tout lire. »

### v05 Deux côtés — 7 problèmes (0 B, 6 m, 1 d)
1. **m** — Pour changer d'avis, il faut viser une bande de 40 px au texte vertical (« ÇA RENTRE »), illisible d'un coup d'œil.
2. **m** — Les fonds pleins vert et ambre sur tout l'écran donnent en cave un brun et un olive boueux. Les cartes s'y détachent mal : ça fait lourd, pas moderne.
3. **m** — Au repos, le montant « 0,00 » est en haut ; après le choix, il passe dans la carte. Deux places pour la même donnée.
4. **m** — Clavier ouvert, les 4 rythmes et le pied sont cachés : il faut fermer le clavier.
5. **m** — La fin (« sans fin », « → oct. 2027 ») est en 10 px au bout d'une ligne radio : cible minuscule.
6. **m** — Le lien « changer » souligné fait 11 px.
7. **d** — Le nom (« Loyer de l'atelier ») est une barre blanche sans crayon ni libellé : on ne voit pas qu'on peut le modifier.
- Le brasseur : « Clair, mais ça prend tout l'écran pour rien. »

### v06 Qui paie qui ? — 6 problèmes (1 B, 4 m, 1 d)
1. **B** — Salaire n'a pas de nœud, et « Toi » mêle apport, prélèvement et salaire du brasseur ; seul un ⇄ de 32 px tranche. Un salaire risque d'être compté en prélèvement : valeur fausse.
2. **m** — Le schéma prend 290 px (35 % de l'écran). Le montant tombe à 20 px, sous le schéma : la hiérarchie est inversée.
3. **m** — Il faut penser « Bailleur / Service / Fournisseur » au lieu de « Loyer / Abonnement / Achat » : un détour. Pour un abonnement, Service ou Fournisseur ?
4. **m** — Le schéma est en haut, loin du pouce, avec des libellés de 11 à 12 px sous les nœuds.
5. **m** — La puce « chaque mois · sans fin » double les pastilles de rythme, et la flèche « ›››› » le redit encore : trois fois la même info.
6. **d** — « Touche avec qui l'argent passe » est une consigne en texte.
- Le brasseur : « Joli, mais pour un achat de 40 balles c'est trop. »

### v07 Quand ça tombe ? — 6 problèmes (1 B, 4 m, 1 d)
1. **B** — La fin se règle par une « poignée » maison sur la grille des mois, et non par la frise au doigt choisie. C'est sa plainte du 22.11 (« Pas le bon geste au doigt… porté PARTOUT ») rejouée.
2. **m** — La poignée ne se voit pas : la barre noire de 6 × 40 à droite d'oct. se lit comme une barre de défilement.
3. **m** — Les 12 tuiles de mois (330 px) restent vides et inutiles pour (b) et (d), deux cas sur quatre.
4. **m** — Il n'y a pas de genre : la catégorie se devine du texte « Pour quoi ». Il faut des lettres pour chaque saisie, sinon on tombe en Divers, une valeur fausse discrète.
5. **m** — La bascule ± fait 80 × 40, en haut à gauche, le coin le plus loin du pouce droit.
6. **d** — La hauteur des barres change d'échelle d'une saisie à l'autre (400 haut, 29,90 plat), sans repère.
- Le brasseur : « Le Σ sur 12 mois c'est bien, mais ça a pas le bon geste. »

## Classement
1. **v08** — 12 touchers, sens impossible à oublier, pas de clavier système ; reste à remonter et grossir le rythme.
2. **v02** — 12 touchers, montant d'abord au clavier, base p3c-3 gardée ; le sens des genres est trop discret.
3. **v04** — imbattable pour ce qui revient (2 touchers) ; faible la première fois ; c'est plus une greffe qu'un écran seul.
4. **v01** — le plus clair en 3 s (« Ça sort / Ça rentre ») ; trop long, le clavier cache le rythme.
5. **v03** — lisible et original, plateau dans la zone du pouce ; trous mobiles en haut.
6. **v05** — sens limpide ; lourd, cave boueuse, bande verticale.
7. **v06** — ludique ; Salaire absent, schéma trop grand.
8. **v07** — geste de date maison, grille vide pour 2 cas sur 4.

## Candidates et retouches
- **v08**
  1. Rythme en segments de 44 px juste au-dessus du pavé.
  2. Genres en deux rangées fixes « ↑ sort / ↓ rentre », sans défilement (greffe de v01).
  3. Fin par des puces « sans fin · 6 mois · 1 an » (v03), puis la frise.
- **v02**
  1. Le genre pose le sens, Revient et Mois d'office.
  2. Bascule de sens à étiquettes de 13 px et icône flèche.
  3. Ajouter Entrée = « − Payé » ou « + Reçu » selon le genre (v08).
- **v04**
  1. Combiner : habituels en tête de v08 ou de v02, et non comme écran seul.
  2. Sélection complète du montant prérempli à la mise au point.
  3. Dessiner l'état vide, première fois.
- **v01**
  1. Montant d'abord, avec clavier ouvert au repos (v02).
  2. Tuiles non choisies à 100 %, la choisie gardant sa bordure de sens.
  3. Rythme posé par le genre.
- **v03**
  1. Phrase figée en hauteur (trous à largeur fixe).
  2. Un trou « nom » distinct du genre.
  3. « J'ai payé aujourd'hui, puis chaque mois » pour lever le doute du (c).

## Greffes
| Idée | Origine | Reçoit |
|---|---|---|
| Habituels : une ligne = un toucher, montant prérempli, « solde l'échéance du 22.11 » | v04 | v08, v02 |
| Confirmation sur place « payé · suivant 22.12 · Annuler » dans la ligne | v04 | toutes |
| Σ 12 mois (−4 800,00 ; −358,80) à côté du rythme | v07 | v08, v02, v01 |
| Fins préréglées « sans fin · 6 mois · 1 an (12 fois) » | v03 | toutes |
| Deux rangées « ↑ ÇA SORT / ↓ ÇA RENTRE » à bordure de sens | v01 | v08, v02 |
| Touche de validation qui dit le sens (« − Payé » / « + Reçu ») | v08 | v02 |
| Choix dans le plateau du bas, zone du pouce | v03 | v01, v06 |
| « Pour moi » au lieu de « Prélèvement » | v04 | toutes (commun 1) |
| Flèche qui dit qui paie qui, en petit, dans la confirmation | v06 | v08 |

## Relances ciblées
- Refaire les captures à 390 × 660 avec le clavier système ouvert sur le champ montant, pour v01, v03, v04, v05 et v06. Sans cela, la colonne « Le clavier cache… » reste une estimation.
- Dessiner, pour les 3 premières du classement, les états erreur, montant vide et hors ligne, et l'ouverture de la frise pour la date de fin.

LEÇON PROPOSÉE : un comptage de touchers sur maquette compte aussi la mise au point du champ et la fermeture du clavier quand il cache la cible, mesurés sur 390 × 660 : les NOTES annonçaient 3 touchers partout, le vrai compte va de 2 à 7.
