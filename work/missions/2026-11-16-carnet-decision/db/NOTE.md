OK — db : prototype cliquable, axe B, carnets en cartes classées par puce, veille par bascule

# db · Tableau de comparaison vivant (axe B)

Chaleur : tiède (la forme de l'axe B, sans gabarit propre à un besoin).
Prototype : `db/proto.html`, 101 ko, autonome. Il est bâti par `node db/build.mjs`, depuis le dossier de la mission, à partir de
`db/proto.src.html` et de `fixture.json`. La fixture est injectée telle quelle, par split/join (L26).

## L'idée
Un carnet est un **tas de cartes d'objets** : photo, nom, prix, fournisseur et lieu, disponibilité, bascule **Surveiller**.
Au-dessus, une rangée de **puces**, les caractéristiques du carnet. La puce active classe les cartes : chaque carte porte
son rang et sa valeur en pastille, et le meilleur est en tête. La rangée est donc un tableau vivant : on touche une autre
puce, l'ordre change.
- Toucher une puce ouvre **un tableau par caractéristique** : rang, vignette, barre proportionnelle à la valeur, valeur.
  Le meilleur est en vert, le dernier en rouge, une valeur inconnue s'affiche « ? ».
- On passe d'une puce à l'autre dans la feuille, au doigt (glisser de côté).
- La puce « Tout » ouvre une **matrice de rangs** : articles × caractéristiques classables, triée sur le critère.
- Le **critère qui tranche** est la première puce, pleine et brune, ciblée. Il est écrit en toutes lettres au-dessus.
- Le **choix et son pourquoi** tiennent dans une bande verte, en haut du carnet. Les cartes écartées portent leur raison
  sur une ligne.

Rien n'est propre à l'embouteillage :
- les puces viennent du carnet (fixture), ou de l'IA simulée, par catégorie ;
- le classement suit le sens de chaque puce (plus, moins, oui/non ou à lire) ;
- les marques sont calculées : « jamais mieux que X » (dominance de Pareto), ou la marque fournie par la fixture.

## Gestes par besoin
| Besoin | Geste dans le prototype | État capturé |
|---|---|---|
| B1 Partir d'une idée | + volant › « Idée ou besoin » : une ligne, « Ouvrir le carnet ». Statut *idée*, aucun champ obligatoire. | `nouveau`, `idee`, `evier` |
| B2 Noter au fil de l'eau | Champ « Coller un lien, noter une idée… » sous les puces : un texte devient une note datée, un lien devient une carte. Bouton photo. Fil « Notes » en bas, toutes à un toucher. | `carnet`, `evier` |
| B3 Façons de faire | Pastilles sous le critère : ✓ retenue (pleine), ✕ écartée (barrée) avec sa raison, ouvertes (neutres). | `carnet`, `ventil`, `frigo` |
| B4 Critère qui oriente | « Ce qui tranche : minimiser l'oxygène ». Il est la première puce et classe les cartes par défaut. Dans le tableau, « En faire ce qui tranche » change de critère. | `carnet`, `tableau`, `cadence` |
| B5 5–6 produits, plusieurs lieux | Cartes en deux colonnes : code pays en gras, fournisseur, disponibilité en pastille. | `cartes`, `ventil`, `frigo` |
| B6 Comparer les caractéristiques | Toucher une puce : un tableau par caractéristique. Puce « Tout » : la matrice des rangs. | `tableau`, `cadence`, `tout`, `frigotab` |
| B7 Dynamique et générique | « + caractéristique » : propositions de l'IA pour la catégorie, puces retirées remises (↺), ou une puce à soi (nom, « le mieux c'est » plus/moins/oui-non/à lire, unité). « Retirer » dans le tableau. Un carnet neuf reçoit les propositions en pointillé : ✓, ✕ ou « Tout garder ». | `carac`, `retiree`, `idee`, `evier` |
| B8 Garder le pourquoi | Bande « LE CHOIX · 14.11 » : choix, pourquoi en une ligne, nombre de décisions. Elle ouvre « Pourquoi ces choix » : frise datée, écartés et raisons, « à revoir si ». Une décision remplacée reste barrée et lisible. « Choisir celui-ci » : pourquoi pré-rempli d'après les puces (exemple), raisons des écartés, « à revoir si », tout facultatif. | `carnet`, `decisions`, `choisir` |
| B9 Vue sans détails | Liste dans Atelier › Matériel › À venir, une ligne par carnet : titre, statut, choix et pourquoi (ou « où j'en suis »), vignettes des objets, œil de veille. Pas de caisse. | `repos` |
| B10 L'IA au besoin | Bouton « Demander » (pourquoi ce choix, pourquoi ce fournisseur, où j'en suis, dispo de tous ; réponses tirées du carnet, dates à l'appui). « Vérifier la disponibilité maintenant » dans la fiche. « chercher » pour un « ? ». « Redonner à l'IA » sur un aperçu raté. Toutes les réponses sont marquées « exemple » ; aucun appel réel. | `pourquoi`, `article`, `rate` |
| B11 Un lien montre l'objet | Coller un lien, puis « Lecture du lien… », puis une carte NOUVEAU en tête (photo, nom, prix, fournisseur, lieu). Les valeurs non lues restent « ? ». Si l'aperçu échoue : carte « Lien seul », avec « Compléter » ou « Redonner à l'IA ». | `lien`, `evierlien`, `rate` |
| B12 Bascule de veille | Bascule « Surveiller » sur chaque carte et dans la fiche. Elle dit « tous les 3 jours : en stock ici et chez d'autres, baisse de prix », puis la date du prochain passage. L'historique a une courbe de prix et une ligne par relevé, avec les autres fournisseurs. Alerte discrète : prix barré et « −600 » sur la carte, une ligne ambre sous le carnet dans la liste, un point sur l'œil. Les passages paraissent aussi dans le Calendrier. | `article`, `veille`, `veilleliste`, `calendrier` |
| B13 Générique | Les mêmes gestes tournent sur 4 carnets et un 5ᵉ créé en direct (« étiqueteuse pour bouteilles 33 cl » : catégorie étiquetage, 5 puces). Les caractéristiques de type texte (plage de température) sont « à lire, sans classement ». | tous |

Coque :
- Atelier › Matériel › À venir : les carnets, puis « Achats prévus ». Un choix part dans À venir par « Envoyer dans À venir ».
- Le + volant porte « Sur cet écran » et « Depuis ici », sur le modèle de b1r.
- Onglet Calendrier : carnets ouverts et passages de veille, par semaine.

## Contrôles (sorties)
- `node db/build.mjs` → `PROTO OK 101 ko`. Le build refuse `type="number"` ; `grep -c 'type="number"' db/proto.html` → 0.
- `node db/capt.mjs <25 états>` → `50 images`, `CAPTURES OK` (390 × 844, DPR 2, tactile, clair et cave), sans erreur de page.
- `controle-panel.mjs` (9 captures) → `remplissage médian 0,63 · paires presque identiques 0/36 · PANEL OK`.
- `controle-commun.mjs work/missions/2026-11-16-carnet-decision db --page=proto.html --sans=mots --profil=sans-houblons`
  → `COMMUN OK`. Avant correction, il signalait 3 problèmes, tous corrigés :
  - contraste de « choisi » à 4,23:1 ;
  - rayons hors de l'échelle 10/16/24 ;
  - 2 teintes au premier écran (tuiles de catégorie colorées depuis).
- `controle-choix` : sans objet. `ecrans.json` n'a aucune entrée carnet ni besoin (le choix est ouvert, D123).

## Captures (ouvertes)
`db/cap/db-<état>-390.png` et `db-<état>-cave-390.png`, pour : repos, carnet, cartes, tableau, cadence, tout, article,
veille, veilleliste, lien, rate, ventil, carac, retiree, nouveau, idee, evier, evierlien, choisir, pourquoi, decisions,
frigo, frigotab, plus, calendrier.
- Ouvertes en clair : toutes.
- Ouvertes en cave : repos, carnet, tableau, veille, idee, rate, plus.
- Les autres captures en cave ne sont pas ouvertes.

## Limites connues
1. Le + volant couvre le bas d'une carte au repos ; il ne cache aucune action, car la carte défile.
2. Pour un carnet dont le critère est de type texte (frigo : « tenir 2 °C stable en été », sur la plage de température), les
   cartes ne sont pas classées par défaut. C'est honnête, mais le critère n'oriente rien tant qu'une puce chiffrée ne le porte pas.
3. « +3 jours » est un bouton de démonstration (exemple) : il simule un passage de veille et invente un « autre fournisseur ».
4. Les photos d'aperçu sont des dessins : la vraie viendrait de `og:image`.
5. Les gestes sont joués par des clics simulés dans Chrome sans écran, pas sur un vrai téléphone.

## Prédiction
« Là on est bon pour comparer : je touche oxygène et je vois qui est devant. » Réserve probable : il trouvera la fiche
de veille un peu longue.

DÉCISION À PRENDRE : où vit le carnet (ici dans À venir, sinon un onglet propre ou le + seul) et la forme de l'alerte
(ici une ligne ambre et un point sur l'œil, sinon un toast ou une pastille sur l'onglet). Les deux sont à montrer en
variantes (L24).
CONNAISSANCE : `controle-standard` a deux échelles de rayons : 2, 4 et 8 px pour les houblons ; 10, 16 et 24 px avec
`--profil=sans-houblons`. Une feuille n'a droit à 24 px que si elle porte `role="dialog"`.
LEÇON PROPOSÉE : aucune
