# r3 · c4 — son scénario, joué de zéro (CARNET-COEUR) ; le champ « Pourquoi ce fournisseur ? » n'est plus sous « Garder ce choix »

Base : `r3/c4/proto.src.html` (da → ra → c1 → c2 → c3, visuel accepté), reprise telle quelle. Retouches marquées `r3 · c4` (et `r3 · c3` avant) dans
`proto.src.html` ; `node build.mjs` produit `proto.html`. Rien de da n'est retiré (`gestes-ra.mjs` : GESTES OK).

## Partir de zéro
- `proto.html?vide=1` : aucun carnet, aucune donnée de la fixture. `&clavier=300` simule le clavier.
- Depuis la liste normale : « Démo : repartir d'un carnet vide » (`[data-zero]`).
- Les liens collés pointent vers un Web simulé (`web.js`, 15 pages fictives, marquées « exemple ») ; ce n'est pas la fixture.
  Un lien inconnu donne « Lien sans aperçu ».
- IA simulée et marquée « exemple » : caractéristiques par catégorie (`IA_CARAC` : embouteillage, froid, ventilation, évier,
  étiquetage, repli générique), façons types (`FACONS_IA`), lecture de page, disponibilité, « Chercher les ? ».

## Jeu automatique
`node work/missions/2026-11-16-carnet-decision/r3/c4/scenario.mjs` → une ligne `ETAPE n OK|ECHEC` par étape, puis `COEUR OK`.
Écrit `captures/c4-E*.png` (390 × 844 tactile, DPR 2), `captures/planche-NN.png` (4 par planche), `scenario.log`.
`SEUL=19` rejoue seulement le frigo, la ventilation et l'évier. Témoin : `PROTO=../c3/proto.html CAP=<dossier temporaire>` rejoue le même jeu sur c3 (échoue en E16, E19.9, E20.9, comme le dernier jeu).

## Étapes, gestes et sélecteurs
Le champ du bas est `#ra-dock` ; il reste au-dessus du clavier, avec le dernier dépôt et la réponse de l'IA.

| Étape | Geste | Sélecteurs | Attendu |
|---|---|---|---|
| E0 | ouvrir `?vide=1` | `[data-vide]` | « Aucun carnet encore. » |
| E1 | écrire « embouteillage », Entrée | `#ra-dock form[data-form=neuf] #da-neuf` | carnet créé, 8 caractéristiques proposées |
| E2 | « gravité, vu chez un collègue, pas mal » | `form[data-form=note] #da-note` | « rangé : façon Gravité » |
| E3 | « isobarique : plus cher, mais capte moins d'oxygène » | `#da-note` | « rangé : façon Isobarique » |
| E4 | « il faut minimiser l'oxygène », « Oui, critère » | `#da-note`, `#ra-dock [data-act=crit]` | `.da-crit`, relié à Oxygène capté |
| E5 | « Retenir Isobarique », pourquoi, Entrée | `[data-act=retenir][data-f]`, `#da-pz` | Isobarique retenue, Gravité écartée, décision datée |
| E6 | note de recherche libre | `#da-note` | note rangée |
| E7-E12 | coller 6 liens | `#da-note` | 6 aperçus ; 5 fournisseurs, 4 pays (CH, DE, IT, FR) |
| E13 | Comparer ; × Formats ; Tout garder ; Ajouter « Pièces d'usure en Suisse » ; Chercher les « ? » | `[data-act=comparer]`, `.da-sug[data-s=carac] .x`, `[data-act=toutgarder]`, `[data-act=ajcarac]`, `#da-k`, `[data-act=iaval]` | 7 gardées, la sienne « à vous » |
| E14 | puce Oxygène, puis Prix | `[data-act=kfocus][data-k]`, `[data-table]`, `.da-k.foc` | tableau classé en tête, rien de coupé, texte ≥ 14 px |
| E15 | une ligne, « Vérifier la disponibilité » | `.ra-r[data-act=article]`, `.da-sheet [data-act=dispo]` | `.da-q` « sur commande… Aussi : Abfülltechnik West (DE) » |
| E16 | Choisir ; Garder à vide (refusé) ; proposition ; fournisseur ; Garder | `[data-act=choisir]`, `[data-act=valchoix]`, `#da-pq-err`, `[data-act=prop][data-in=da-pq]`, `[data-in=da-pf]` | « Pourquoi : oxygène capté le plus bas », 5 écartés avec raison |
| E16 piège | clavier ouvert : compléter le pourquoi au clavier (2 lignes, 65 px), puis **le doigt pressé** touche le centre de ce qui se voit de « Pourquoi ce fournisseur ? », sans défiler ; Entrée ; puis dans « Pourquoi », Entrée = Suivant | `.da-sheet #da-pq`, `#da-pf`, `.da-sheet .ra-keep` | champ fournisseur entier visible (46/46 px), 0 px sous `.ra-keep` (passée `static` clavier ouvert), le toucher donne le focus à `#da-pf`, feuille ouverte, aucun « Choix gardé » ; Entrée dans `#da-pq` → focus `#da-pf` |
| E17 | liste, carnet, bandeau, « Pourquoi cette façon ? » | `[data-act=liste]`, `[data-act=ouvrir]`, `.da-choix[data-act=decisions]`, `[data-act=qq]` | Isobarique, « …O2… », Gravité écartée |
| E18 | « Pourquoi ce fournisseur ? » | `[data-act=qq]` | Revendeur Brassage Romandie (CH), même machine en DE |
| E19-E21 | version courte, voir ci-dessous | | |

### Version courte (E19 frigo, E20 ventilation, E21 évier), sous-étapes `.1` à `.10`
| Sous-étape | Geste | Sélecteurs | Attendu |
|---|---|---|---|
| .1 | créer l'idée | `#da-neuf` | catégorie froid / ventilation / évier ; caractéristiques proposées |
| .2 | deux façons : notes (frigo), feuille Façons (ventil), « Chercher les façons » (évier) | `#da-note` ; `[data-act=facons]`, `#da-nf` ; `[data-act=iafacons]` | Chambre froide + Vitrine (aucun Évier) ; Hotte + Extracteur mural ; sur pieds + à poser |
| .3 | critère, façon retenue avec pourquoi | `#ra-dock [data-act=crit]`, `[data-act=retenir]` ou `[data-act=fetat][data-e=retenue]`, `#da-pz` | critère, une façon écartée (`.da-fc.out`) |
| .4 | note libre | `#da-note` | note visible |
| .5 | 3 liens collés | `#da-note` | 3 aperçus |
| .6 | Tout garder ; une à soi ; (frigo) « bruit » en double | `[data-act=toutgarder]`, `#da-k`, `[data-dup]` | « à vous » ; doublon refusé ; **aucune façon en caractéristique** (`[data-table]` sans Hotte, Vitrine…) |
| .7 | classer par le critère, puis par Prix | `[data-act=kfocus]` | **classé par prix, la 1re ligne n'est jamais un article d'une façon écartée** (écartés en bas, en gris, sans vert) |
| .7b | **piège** : toucher l'article de la façon écartée (vitrine, extracteur mural, évier à poser) | `.da-k.foc .ra-r[data-act=article]`, `.da-sheet [data-garde=facon]` | « Façon écartée le … : Frigo vitrine pro — « pourquoi » » ; **pas de « Choisir celui-ci »**, à la place « Revoir les façons » (`[data-act=facons]`) |
| .8 | disponibilité | `.da-sheet [data-act=dispo]` | réponse « exemple » |
| .9 | Choisir ; pourquoi contredit (« le plus de fûts », « le moins cher ») ; Garder → **refusé** ; vrai pourquoi ; Garder | `#da-pq`, `[data-act=valchoix]`, `#da-pq-faux[data-faux]` | « Vos tableaux disent l'inverse : Fûts de 20 L 30 ici, 38 chez … » ; feuille ouverte ; propositions fournisseur **sans le titre du carnet** (ventilation) ; puis « Choix gardé » |
| .9 piège | clavier ouvert, pourquoi tapé (2 lignes), puis le doigt pressé sur « Pourquoi ce fournisseur ? » sans défiler, et frappe | `#da-pq`, `#da-pf`, `.da-sheet .ra-keep` | comme E16 : champ entier, rien dessus, focus au champ, la frappe y arrive (E18/.10 rendent le pourquoi du fournisseur) |
| .10 | « Pourquoi cette façon ? », « Pourquoi ce fournisseur ? », puis question libre « pourquoi chambre froide ? » / « pourquoi la hotte ? » / « pourquoi sur pieds ? », puis « pourquoi pas la vitrine ? » / « …l'extracteur mural ? » / « …à poser ? » | `[data-act=qq]`, `form[data-form=question] #da-qq`, `.da-q` | **la façon nommée répond par la façon** (« vous avez retenu Chambre froide… », « vous avez écarté Frigo vitrine pro : « 8 fûts… » ») ; aucun fournisseur cité |

## Ce qui a changé dans c3 (r3 · c4), défauts du dernier jeu (E16, E19, E20)
1. Clavier ouvert dans une feuille, « Garder ce choix » n'est plus collé en bas (`html.kb .da-sheet .ra-keep{position:static}`) : il reprend sa place en fin de feuille. Rien de fixe ne recouvre plus le champ visé ; clavier fermé, la barre revient en bas.
2. Un champ de feuille qui prend le clavier monte en haut de la partie visible, libellé compris (`placerChamp`) ; en tapant, il ne descend jamais sous le bord. Le champ suivant reste entier dessous.
3. Entrée dans « Pourquoi, en une ligne » = Suivant (`enterkeyhint=next`) : le curseur passe à « Pourquoi ce fournisseur ? » sans viser ; Entrée y ferme le clavier.
4. Pourquoi contredit : le superlatif se rapporte à la caractéristique nommée **le plus près** (« oxygène capté le plus bas, même à 30 bouteilles par heure » parlait du CO2 par bouteille et était refusé à tort).

## Ce qui avait changé dans c2 (r3 · c3), défauts du dernier jeu
1. Article d'une façon écartée : sa fiche dit « Façon écartée le … : <façon> » et son pourquoi, en rouge ; « Choisir celui-ci » est
   remplacé par « Revoir les façons ». La feuille Choisir refuse aussi (`data-garde=facon`). Le carnet ne peut plus garder une façon
   retenue et un produit de la façon écartée.
2. Comparer : les articles d'une façon écartée descendent sous les autres dans chaque tableau ; le vert va au meilleur des non-écartés.
   « Classé par prix » commence par un article choisissable.
3. Pourquoi contredit par les tableaux : « le plus de fûts », « plus gros débit », « le moins cher »… sont relus contre les valeurs
   du carnet. Si un autre article fait mieux, « Garder ce choix » est refusé et la raison est dite sous le champ, valeurs à l'appui
   (`#da-pq-faux`). La corriger efface le message. Ni confirmation, ni « garder quand même ».
4. Question libre qui nomme une façon (« pourquoi chambre froide ? », « pourquoi la hotte ? ») : réponse par la façon, retenue ou
   écartée, avec son pourquoi et sa date ; jamais par le fournisseur du produit. Les mots du titre du carnet ne nomment rien.
5. Pourquoi ce fournisseur : les notes se citent sur un mot entier proche du nom du fournisseur (« romand » / Romandie), jamais sur
   un mot plus long qui le contient (« ventil » ≠ « ventilation »), ni sur un mot du titre, ni la note qui a créé le carnet.
6. Ventilation : « Hotte inox » n'est plus une caractéristique (c'est une façon) ; l'IA propose « Pression disponible » (Pa).
