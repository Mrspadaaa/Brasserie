# Juge passe 4 du Carnet : deux regards (25.11, nuit)

Juge : Opus, lecture seule. Matière : les 188 images de `page/img/` (24 rangées de `page/index.html`), toutes ouvertes,
4 par planche à 390 px de large chacune, à leur taille (planches de travail dans le scratchpad, hors dépôt).

- **T = regard TDAH visuel** : se perd dans le texte ; veut couleur, forme, position ; une seule chose à la fois.
- **B = regard brasseur en action** : gants, cuve qui chauffe ; 5 s pour voir quoi faire ; un pouce, en bas d'écran.

Codes : **B** = bloquant, **m** = mineur. Images citées par leur nom dans `page/img/`.
Les nombres de mots sont **estimés à l'œil sur la capture**, pas comptés dans le DOM.

## Constats valables pour toutes les rangées

- **G-B1 ORGANISE-TROP-TEXTUEL** : aucun « Organisé » ne tient 30 mots au premier écran. Estimé : 80 à 120 mots
  (`v01-09`, `v02-12`, `v03-07`, `v04-11`, `v05-10`, `v06-09`). La seule en-tête de `v06-09` dépasse déjà 40 mots.
- **G-B2 FRISE-GENERIQUE** : frise fixe Noté → Résolu, au centre, dans v02, v03 et v05 (`v02-12`, `v03-07`, `v05-10`).
  v01 et v04 posent la même frise en 4 boutons segmentés (`v01-09`, `v04-11`). Seule v06 la remplace par 4 points
  dans la ligne d'état (`v06-09`). La règle n'est donc tenue que par 1 version sur 6.
- **G-B3 (B)** : la bascule Mes notes / Organisé et « Changements » restent en haut, hors de portée du pouce.
  v06 les met dans le coin haut droit (`v06-07`, `v06-09`) : c'est le pire endroit pour une main gantée.
- **G-B4 (B)** : aucune version ne dessine une autre façon de ranger que l'appui long suivi d'un glisser. Avec des
  gants, ce geste rate. Il manque un « Ranger dans… » en un toucher.
- **G-m1** : beaucoup de liens de 13 à 14 px (« ta ligne › », « note 3 › », « Le fil ▾ ») : trop petits pour un gant.
- **G-m2** : 6 rangées sur 24 sont des copies presque exactes de M4 (Changé par l'IA, Décider, Tâche, Résoudre,
  Mémo, Hors ligne). Elles ne font pas de vraie exploration : le choix se fait sur les 18 autres. La note uniforme
  de 6,5/10 du critique pour les 6 versions confirme ce manque de différence.
- **Acquis** : la barre d'onglets et le « + » noir, collé à droite sur la ligne du champ, sont présents partout.
  Le micro est dans le champ partout, ce qui est bon pour les gants.

---

## 1. Liste des carnets, au repos

**T** : v04 et v01 se lisent sans lire. v04 met l'état à droite, toujours au même endroit, et la piste en un mot
coloré. v01 donne d'abord la rangée de compteurs, puis l'arbre. v02 ajoute des barres de couleur par ligne : jolies,
mais les numéros 1 à 5 font du bruit. v05 replie tout : calme, mais on ne voit plus rien. v03 et v06 gaspillent une
en-tête de sous-domaine pour un seul carnet.
**B** : en 5 s, v04 répond : 11 lignes, l'état en pastille, « B retenu ». v01 suit de près. v05 demande un toucher par
sous-domaine avant de voir quoi que ce soit.

- B1 CARNET-LISTE-COMPACTE : 4 carnets visibles seulement dans v03 (`v03-01`) et v06 (`v06-01`), 1 seul dans v05 (`v05-01`).
- m1 : les numéros de rang de v02 (`v02-01`) se lisent comme des quantités.
- m2 : v04 aplatit la liste ; l'Arbre n'est qu'une option (`v04-01`).
- m3 : v06 garde l'ancienne en-tête « Stocks › Matériel » et des onglets (`v06-01`), ce qui recule la liste.

Meilleurs mécanismes et visuels :
- v04 : pastille d'état à droite et piste en un mot coloré sous le nom (« 3 pistes », « B retenu ») (`v04-01`).
- v01 : coup d'œil en rangée basse (5 compteurs, dont « à faire ») et en-têtes ▸ repliables (`v01-01`).
- v02 : mini-barre d'options par ligne (retenue verte, pistes bleues, écartée grise) (`v02-01`).
- v04 : Mémos et Résolus 2026 en pied, repliés (`v04-01`).

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 7 | 7 | 4 | 7 | 5 | 4 |
| B | 7 | 6 | 4 | 8 | 4 | 4 |

## 2. Filtrer, glisser pour ranger (D455)

**T** : v05 est la plus claire. Une grande zone verte en pointillé dit « Lâche ici : la catégorie devient
Ingrédients », et le badge « 1er » montre la priorité (`v05-02`, `v05-03`). v01 montre la destination sur la ligne
soulevée (« → Air », `v01-02`). v03 et v06 l'expliquent par du texte (`v03-02`, `v06-02`).
**B** : l'appui long avec des gants marche mal partout (G-B4). Le toast « Annuler » est bon dans toutes. La zone de
dépôt de v05 est la plus grande cible.

- B1 (B) : aucun moyen de ranger sans glisser (toutes).
- m1 : le bloc d'aide de v03 (« Lâcher ici… / Entre deux lignes… ») est du texte à lire en plein geste (`v03-02`).
- m2 : en v06, une phrase de 2 lignes explique le filtre en bas (`v06-02`).
- m3 : v04 met « Appui long : glisse la ligne… » en bandeau permanent (`v04-03`).

Meilleurs mécanismes et visuels :
- v05 : zone de dépôt qui annonce le résultat et badge « 1er » (`v05-02`, `v05-03`).
- v01 : pastille de destination « → Air » sur la ligne soulevée (`v01-02`).
- v02 : « Les décidés attendent un achat ou une tâche : À faire 5 › » sous un filtre (`v02-02`).
- v04 : toast « catégorie changée · Problème » (`v04-04`).

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 7 | 7 | 5 | 6 | 8 | 5 |
| B | 5 | 5 | 5 | 5 | 6 | 5 |

## 3. Noter vite

**T** : la même ligne partout ; rien ne distrait. v04 dit « copié il y a 2 min » : on sait d'où vient le lien.
**B** : photo et micro dans le champ, envoi en gros bouton : bon. v03 n'a pas « Coller le lien » au-dessus du clavier.

- B1 : pas de « Coller » du presse-papiers dans v03 (`v03-03`).
- m1 : v06 met « Coller » au-dessus du champ, pas du clavier, avec une phrase d'aide en plus (`v06-04`).
- m2 : v06 dessine un clavier AZERTY, alors que les autres versions ont le QWERTZ suisse (`v06-04`).

Meilleurs mécanismes et visuels :
- v04 : « Coller entreprise-x.ch · copié il y a 2 min » (`v04-05`).
- v03 : la case à cocher (« c'est une tâche ») dans la rangée d'outils (`v03-03`). Elle va dans le sens de son « + »
  qui propose check, tâche ou suggestion.

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 7 | 7 | 6 | 8 | 7 | 6 |
| B | 8 | 8 | 6 | 8 | 8 | 7 |

## 4. Note rangée par l'IA

**T** : le meilleur écran de la passe : pastilles avant → après, une par ligne, en couleur (`p3-v03-saisie`), repris
tel quel par v01, v02 et v05. v03 et v04 ajoutent une mini ligne de métro (avant / aujourd'hui / suite ?) qui situe
la note dans le temps (`v03-04`, `v04-06`).
**B** : « Tout accepter » vert, grand, en bas : un pouce suffit. v04 propose 3 sorties (OK, Autre ligne…, Juste la
note) : c'est complet.

- m1 : les 3 boutons de v06 sont serrés, et une phrase en pied explique « Retenu veut dire Décidé » (`v06-06`).
- m2 : v01, v02 et v05 sont des copies, sans apport (`v01-05`, `v02-07`, `v05-05`).

Meilleurs mécanismes et visuels :
- p3 v03 / v01 : pastilles avant → après par état (`v01-05`).
- v04 : mini-métro de la ligne et sortie « Autre ligne… » (`v04-06`).
- v03 : « suite ? Acheter le testeur ≈ 35 CHF · l'IA » (`v03-04`).

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 8 | 8 | 7 | 8 | 8 | 7 |
| B | 8 | 8 | 7 | 8 | 8 | 7 |

## 5. Nouveau carnet

**T** : v01 dit pourquoi le carnet est nouveau (« aucun carnet ouvert sur la tireuse ») et où il se range
(« à côté de CO2 qui baisse ») : le carnet a une place. v06 crée un sous-domaine (« Cuves (nouveau) ») mais ajoute
un paragraphe.
**B** : OK vert en bas pour toutes.

- m1 : la tâche proposée et la note « Aucun prix inventé » de v06 font environ 50 mots dans la feuille (`v06-05`).
- m2 : v03 n'a pas cet écran.

Meilleurs mécanismes et visuels :
- v01 : la raison du nouveau carnet et son voisin (`v01-06`).
- v06 : le sous-domaine naît avec la mention « (nouveau) » (`v06-05`).
- p3 v04 / v04 : « auj. → suite ? » en métro (`v04-07`).

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 8 | 7 | — | 7 | 7 | 6 |
| B | 8 | 7 | — | 7 | 7 | 7 |

## 6. Mes notes, on écrit

**T** : c'est une vraie note dans toutes les versions. v03 met « Ranger » en noir, en premier : on sait quoi faire.
v06 réduit Ranger à une icône sans mot.
**B** : la rangée d'outils au-dessus du clavier se tient au pouce. v02 a deux « Coller » à l'écran.

- B1 : « Coller le lien » apparaît deux fois en v02, dans la rangée d'outils et au-dessus du clavier (`v02-10`).
- m1 : en v06, Ranger n'est qu'une icône et la bascule est en haut à droite (`v06-07`).
- m2 : les mots soulignés pendant l'écriture (v04, v05, v06) font bouger le regard (`v04-08`).

Meilleurs mécanismes et visuels :
- v03 : Ranger, bouton noir premier, et pastille « 5 à ranger » sur Organisé (`v03-05`).
- v01 : « Demander » à côté de Ranger (`v01-07`).

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 7 | 6 | 8 | 7 | 7 | 5 |
| B | 7 | 6 | 8 | 7 | 7 | 5 |

## 7. Mes notes, sa ligne retrouvée

**T** : v03 met un fil d'Ariane avec la pastille verte « trouvé » : on voit d'où l'on vient, par la couleur. Les
autres l'écrivent (« ouvert depuis « Trouvé » dans Organisé »).
**B** : la ligne surlignée en beige se voit vite partout. La case de tâche dans le texte (v04, v06) est utile ; sa
cible est petite.

- m1 : « ‹ depuis Organisé » se touche mal avec un gant (13 px, `v02-13`, `v06-08`).
- m2 : v05 n'a qu'une phrase, sans retour (`v05-08`).

Meilleurs mécanismes et visuels :
- v03 : fil d'Ariane avec la pastille de couleur du bloc (`v03-08`).
- v04 et v06 : case à cocher de tâche dans la note (`v04-09`, `v06-08`).
- v04 : carte du lien avec ce qu'il montre (« Sanitaire · dépannage ») (`v04-09`).

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 6 | 7 | 8 | 7 | 6 | 7 |
| B | 6 | 6 | 7 | 7 | 6 | 6 |

## 8. L'IA lit

**T** : v03 ajoute une barre de progression : on voit que ça avance sans rien lire. v06 met 3 points animés sur
l'onglet Organisé.
**B** : « Arrêter » est grand partout.

- m1 : le bouton « Rangement… » ambre en bas (`v02-11`, `v03-06`, `v06-24`) ressemble à un bouton actif.

Meilleurs mécanismes et visuels :
- v03 : barre de progression sous « L'IA lit tes 5 lignes » (`v03-06`).
- v06 : pastille animée sur l'onglet (`v06-24`).
- v04 : « Ton texte ne bouge pas. » (`v04-10`).

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 6 | 6 | 8 | 7 | 6 | 7 |
| B | 7 | 7 | 8 | 7 | 7 | 7 |

## 9. Organisé : un problème ouvert (écoulement)

**T** : c'est l'écran qui compte, et aucun ne passe (G-B1, G-B2). v04 a la meilleure image : « Le chemin », une
couleur par piste, avec une coche, un « ? » ou un pointillé au bout. On comprend sans lire. v03 donne des jetons
ronds (✓ vert, ? ambre) et des chips « lu par l'app ». v02 et v05 posent des barres coût / temps par façon. v06
ouvre sur la question et des jetons de couleur, sans frise. v01 empile 4 cases, le sélecteur d'état, puis 3 options
toutes marquées « piste », impossibles à distinguer.
**B** : en 5 s, il faut voir « que faire ». v01 et v04 l'écrivent en pied (« Prochaine : relancer l'entreprise X ? ·
À faire »), hors du pouce et sous le pli. v03 donne trois gros boutons noirs « Retenir », la meilleure prise.
Chez v05, la « Prochaine » est cachée sous le champ.

- B1 : G-B1 dans toutes (`v01-09` à `v06-09`).
- B2 : G-B2 dans v01 à v05.
- B3 (B) : la prochaine action n'est ni en haut ni en gros bouton : v01, v04 la mettent en pied, v05 la coupe
  (`v05-10`), v06 ne l'a qu'en texte (« Ensuite : toi ou le sanitaire ? », `v06-09`).
- B4 (T) : « Je cherche » répété deux fois en v01 et v04, dans « dernier pas » et dans le sélecteur (`v01-09`).
- m1 : ENTETE-PEU-UTILE, la première info utile arrive vers 160 px en v02 et 185 px en v03 (`v02-12`, `v03-07`).

Meilleurs mécanismes et visuels :
- v04 : chemin en lignes de métro, une couleur par piste, avec date et bout (✓ / ? / pointillé) (`v04-11`).
- v02 et v05 : barres coût et mon temps par façon (`v02-12`, `v05-10`) ; v05 a aussi l'estimation empilée
  « joint 150 | dalle : devis ? » hachurée.
- v03 : jetons ronds ✓ / ? et gros « Retenir » noir par façon (`v03-07`).
- v06 : en-tête « question + jetons de couleur » (trouvé, pas trouvé, devis, ≈ 150 CHF) et état en 4 points sans
  frise (`v06-09`).
- Greffe venue de la rangée 14 : « Une décision t'attend : toi ou le sanitaire ? 10 ou 150 CHF » (`v02-18`).

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 5 | 6 | 6 | 7 | 6 | 6 |
| B | 6 | 6 | 7 | 6 | 5 | 6 |

## 10. Feuille « Changé par l'IA »

**T** : les interrupteurs violets disent oui ou non par la forme. v05 passe à 6 lignes avec des cases et des cadenas :
plus de texte.
**B** : les interrupteurs et « Garder 2 sur 3 » noir en bas se prennent au pouce. Les cases de v05 sont plus petites.

- m1 : 6 lignes et un paragraphe d'aide en v05 (`v05-11`).
- m2 : 5 versions sur 6 sont des copies de M4 (`v01-22`, `v02-14`, `v03-09`, `v04-12`, `v06-10`).

Meilleurs mécanismes et visuels :
- M4 / v03 : interrupteur par proposition, « Garder N sur M » (`v03-09`).
- v05 : cadenas sur une erreur de lecture corrigée : « elle reste » (`v05-11`).

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 7 | 7 | 7 | 7 | 5 | 7 |
| B | 8 | 8 | 8 | 8 | 6 | 8 |

## 11. Options et Comparer

**T** : v06 refait Comparer de la base : des barres classées par critère, et le critère proposé par l'IA en tête
(Garder / Autre). On voit qui gagne. v02 met des barres sous chaque option (adapté, coût, dispo). Dans toutes, la
retenue est en vert et l'écartée est barrée.
**B** : glisser pour « Écarter » avec des gants rate (v01, v04, v05). La pastille « 30 nov. · dans À venir » de v01
dit la suite sans ouvrir.

- B1 (B) : « Écarter » s'obtient seulement en glissant (`v01-10`, `v04-13`, `v05-12`).
- m1 : v05 ajoute la liste des 13 notes sous les options (`v05-12`).
- m2 : v03 n'a pas cet écran.

Meilleurs mécanismes et visuels :
- v06 : Comparer en barres classées et critère proposé « Garder / Autre » (`v06-19`).
- v02 : barres adapté / coût / dispo par option, historique de l'écartée (« écarté 6 nov., repris 21, écarté 22 ») (`v02-15`).
- v01 : photo par option et pastille de date « dans À venir » sur la retenue (`v01-10`).

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 7 | 8 | — | 7 | 6 | 8 |
| B | 6 | 6 | — | 6 | 6 | 7 |

## 12. Décider (devis reçu)

**T** : v01 pose deux tuiles face à face, « Devis 185 CHF » contre « Moi-même 9 CHF », la gagnante en vert. C'est
« qui gagne quoi » sans une phrase. v03 répète l'état deux fois (chips, frise) puis « Retenu » : c'est long.
**B** : « Garder » noir sur la tâche datée et « Retenir » sur les réserves : bon partout.

- m1 : v03 empile chips, frise, jetons, retenu, ensuite et réserve, plus de 2 écrans (`v03-10`).
- m2 : v02, v04 et v05 copient M4 (`v02-16`, `v04-14`, `v05-13`).

Meilleurs mécanismes et visuels :
- v01 : tuiles face à face devis contre moi-même (`v01-11`).
- v06 : la photo du devis remplit le coût (« devis X reçu · 180 CHF ») ; « En réserve · pas écartées » (`v06-11`).

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 8 | 6 | 5 | 7 | 7 | 7 |
| B | 8 | 7 | 7 | 8 | 8 | 7 |

## 13. La tâche du carnet

**T** : la case, la citation « Joint changé. » et le conseil violet se lisent en blocs. v05 enlève « Cocher la
tâche ? » : il ne reste qu'une case vide.
**B** : « Cocher » noir et gros est le geste parfait (v01, v02, v03, v06). En v04, la case seule attend le toucher.

- B1 (B) : pas de bouton « Cocher » en v05, seulement une case de 24 px (`v05-14`).
- m1 : en v04, « la case ci-dessus attend ton toucher » explique au lieu d'offrir le bouton (`v04-15`).

Meilleurs mécanismes et visuels :
- M4 / v02 : « Cocher la tâche ? » avec sa citation et un gros Cocher (`v02-17`).
- v03 : la carte du lien de l'entreprise, gardée pour « si la flaque revient » (`v03-11`).

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 7 | 7 | 7 | 6 | 5 | 7 |
| B | 8 | 8 | 8 | 5 | 4 | 8 |

## 14. À faire : les tâches de tous les carnets

**T** : v02 et v06 ouvrent sur « Une décision t'attend », une carte par carnet avec sa question et sa fourchette
(« 150 ou 10 CHF », « 420 à 2 600 CHF »). C'est une chose à la fois. v01 colore les cercles par état (bleu je
cherche, brun achat daté). v04 met des cercles pointillés identiques à chaque ligne : tout se ressemble.
**B** : les interrupteurs de veille (v02, v04, v06) se prennent au pouce. Les prix sont à droite partout.

- m1 : v04, 10 lignes de même forme, sans regroupement (`v04-16`).
- m2 : v03 répète les compteurs de la liste en haut (`v03-12`).

Meilleurs mécanismes et visuels :
- v02 et v06 : « Une décision t'attend », question et fourchette par carnet (`v02-18`, `v06-13`).
- v01 : cercles colorés par état, Achats datés « aussi dans À venir », Fait cette semaine barré (`v01-13`).
- v04 et v06 : veille en interrupteur dans la liste (`v04-16`, `v06-13`).

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 7 | 8 | 6 | 6 | 7 | 8 |
| B | 7 | 8 | 6 | 7 | 7 | 8 |

## 15. Résoudre sur preuve

**T** : le cadre violet pointillé, deux citations, puis « Pas encore » et « Résolu » : clair partout. v01 ajoute
« Coût : 9 CHF le joint, au lieu de 185 CHF de devis » : le gain se voit.
**B** : les deux gros boutons sont à mi-écran dans toutes les versions. En v06, l'en-tête les pousse plus bas.

- m1 : v03 empile chips, frise et jetons avant le cadre (`v03-13`).
- m2 : en v06, les 3 jetons et le critère précèdent le cadre (`v06-14`).

Meilleurs mécanismes et visuels :
- v01 : « Classer le devis : pas pris ? Non / Oui » et le gain chiffré (`v01-14`).
- M4 et v01 à v05 : l'étape suivante en pointillé, « Résolu ? », dans la ligne d'état (`v02-19`).
- v02 : « Coût réel du joint : pas noté · Noter » (`v02-19`).

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 8 | 7 | 6 | 7 | 7 | 6 |
| B | 8 | 8 | 8 | 8 | 8 | 7 |

## 16. Résolu : fermé grâce à l'achat

**T** : v04 montre avant → après en deux images (buée, puis cuve nette) : c'est le seul écran où l'on comprend sans
lire. La rangée d'icônes « Résolus en 2026 », dont la dernière est entourée (v02, v03, v05), est un bon repère. v06
la remplace par des jetons de texte.
**B** : « Rouvrir » est grand partout.

- m1 : en v03, le chemin vertical daté fait 5 lignes de texte (`v03-14`).
- m2 : en v06, « Résolus en 2026 » est fait de 5 jetons de mots (`v06-15`).
- m3 : v02 garde la frise et une grande image du ticket (`v02-20`).

Meilleurs mécanismes et visuels :
- v04 : avant → après en photos (`v04-18`).
- p3 v01 / v02 : rangée d'icônes des résolus de l'année, la dernière entourée (`v02-20`).
- v05 : « Si ça revient · gardé ici » (`v05-17`) ; v06 : option « en réserve » au lieu de « fermé » (`v06-15`).
- v03 : « Arrêter la veille du condenseur B ? Non / Oui » (`v03-15`).

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 7 | 6 | 6 | 9 | 7 | 6 |
| B | 7 | 6 | 7 | 8 | 7 | 7 |

## 17. Relecture des mois plus tard

**T** : la fiche en tableau (problème, essayé, pris, pourquoi) est du texte. v03 la remplace par « Ce que tu savais
alors » : une icône par option (✓ vert, ≈ bleu, – gris, ? ambre) et une date. Le mot cherché est surligné
(« trouvé par « condenseur » »).
**B** : on relit au bureau, pas en brassant. « Voir dans Mes notes » est un gros bouton en v03.

- m1 : v05 aligne 7 lignes de tableau et 4 icônes, plus d'un écran (`v05-18`).
- m2 : v01, v02, v04 et v06 reprennent le tableau de la passe 3 (`v01-16`).

Meilleurs mécanismes et visuels :
- v03 : « Ce que tu savais alors » en icônes datées et mot cherché surligné (`v03-16`).
- v02 : « Toujours le bon choix ? Oui / Pas sûr » (`v02-21`).
- v04 : « pourquoi : tes notes ne le disent pas · Ajouter » (`v04-19`).
- p3 v01 et toutes : avant → après en photos dans la fiche.

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 6 | 6 | 8 | 6 | 6 | 6 |
| B | 6 | 7 | 7 | 6 | 5 | 6 |

## 18. Un achat (ventilation)

**T** : la feuille du lien collé de v06 montre une grande image de l'objet, le prix, « en stock » et la veille.
L'objet se reconnaît sans lire. v04 compare les articles en barres dans la page, avec l'écarté barré et sa raison.
**B** : l'interrupteur de veille est grand partout. v01 empile 4 cases, le sélecteur, le critère, le lien, les
façons, Comparer et les Décisions : on n'y voit rien en 5 s.

- m1 : v01 est dense (`v01-17`).
- m2 : en v05, « Lu : prix, délai… Manque : bruit, conso. » est une phrase à lire (`v05-19`).

Meilleurs mécanismes et visuels :
- v06 : feuille du lien collé avec image, « à lire » sur la donnée manquante et « rangé dans … · Changer » (`v06-18`).
- v04 : Comparer en barres dans la page, écarté et raison (`v04-20`).
- v01 : la fourchette « 420 à 2 600 CHF » comme coût d'un achat ouvert (`v01-17`).

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 6 | 7 | 7 | 8 | 6 | 8 |
| B | 6 | 7 | 7 | 7 | 6 | 8 |

## 19. Un mémo, rien à faire

**T** : c'est honnête : photo, ✓ et !, une seule question « Relier ? ». v03 ajoute « je le ressortirai quand tu
noteras « sol » ou « époxy » » : le mémo sert plus tard.
**B** : « Relier » noir, grand : bon partout.

- m1 : 5 versions sur 6 copient M4 (`v01-18`, `v02-23`, `v04-21`, `v05-20`, `v06-20`).

Meilleurs mécanismes et visuels :
- v03 : le mémo qui revient au bon moment (`v03-18`).
- v06 : jetons en tête « tient · 2 ans » vert et « point faible » rouge (`v06-20`).

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 7 | 7 | 8 | 7 | 7 | 7 |
| B | 7 | 7 | 7 | 7 | 7 | 7 |

## 20. CO2 qui baisse dans un fût

**T** : v03 met deux gros jetons ronds, ✓ vert « Le détendeur » et ✗ rouge « Raccords, tête du fût » : la forme dit
tout. Le reste est la forme de l'écoulement, comme voulu.
**B** : « Retenir » noir en v03. « 7 kg perdus » parle au brasseur.

- m1 : en v01, la liste des notes sous les options sert peu (`v01-19`).

Meilleurs mécanismes et visuels :
- v03 : jetons ronds trouvé / pas trouvé et conseil « En attendant, ferme la bouteille le soir » (`v03-19`).
- v06 : critère « le fût tient sa pression », barres et « ≈ 7 kg perdus » (`v06-21`).

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 6 | 7 | 8 | 6 | 7 | 7 |
| B | 6 | 6 | 7 | 6 | 6 | 6 |

## 21. Malt en rupture

**T** : v01 donne un picto différent par option (camion, sablier, sac, calendrier). Ailleurs, le même sac revient
4 fois. v03 met l'interrupteur de veille sur l'option « Attendre le retour » et calcule « S49 : 4 sacs × 4 CHF =
+16 CHF ».
**B** : l'interrupteur de v03 est une action directe. « Écarter » par glisser pose encore problème (v01, v04).

- m1 : le même picto répété en v02, v04, v05 et v06 (`v02-25`).
- m2 : « Écarter » par glisser seulement (`v01-20`, `v04-23`).

Meilleurs mécanismes et visuels :
- v01 : un picto par option (`v01-20`).
- v03 : veille en interrupteur sur l'option, calcul de l'app, pastille « 26 nov. · dans À venir » (`v03-20`).
- v06 : « délai inconnu » plutôt qu'une barre inventée (`v06-22`).

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 8 | 7 | 7 | 6 | 7 | 7 |
| B | 7 | 6 | 8 | 6 | 6 | 6 |

## 22. Cas d'épreuve

**T** : v05 met « À ranger » en tête et replie le reste : une seule chose. La photo seule avec « On dirait un tuyau
qui goutte. Rattacher ? » marche partout.
**B** : « Oui » noir et premier (v03, v06) se prend sans viser. Ailleurs, les 3 boutons sont blancs et égaux.

- m1 : les 3 boutons égaux et blancs en v01, v02, v04 et v05 (`v01-21`).

Meilleurs mécanismes et visuels :
- v05 : À ranger en tête et le reste replié (`v05-23`).
- v03 et v06 : Oui noir, premier (`v03-21`, `v06-23`).

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 7 | 7 | 7 | 7 | 8 | 7 |
| B | 7 | 7 | 8 | 7 | 8 | 8 |

## 23. Hors ligne

**T** : un bandeau ambre, un cadre pointillé « Pas encore lue », puis l'état gardé : clair. v06 est la plus courte.
En v01, le bandeau arrive sous les 4 cases.
**B** : « Annuler l'envoi » est grand partout.

- m1 : en v01, le bandeau hors ligne est sous les 4 cases et le sélecteur (`v01-24`).

Meilleurs mécanismes et visuels :
- v06 : version courte avec « 1 ligne en file » et une horloge (`v06-25`).
- v03 : pastille « 1 en file » sur l'onglet Organisé (`v03-23`).

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 5 | 6 | 7 | 7 | 7 | 8 |
| B | 6 | 6 | 7 | 7 | 7 | 7 |

## 24. L'IA n'a pas pu lire

**T** : v06 lit seule 6 choses, en colonne de jetons de couleur (trouvé, pas trouvé, devis, coût, options, tâche),
et propose « Garder » sur la tâche. C'est le repli le plus utile. v03 garde la photo (« l'IA la lira aussi »).
**B** : « Réessayer » noir en haut, « Continuer dans Mes notes » large.

- m1 : v04 ne lit que 2 choses (`v04-26`).

Meilleurs mécanismes et visuels :
- v06 : colonne de jetons de couleur de ce que l'app lit seule (`v06-26`).
- v03 : photo gardée (`v03-22`).

| | v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|---|
| T | 6 | 6 | 7 | 6 | 7 | 8 |
| B | 6 | 7 | 7 | 7 | 7 | 7 |

---

## Probant ?

**Non, pas comme vue à prendre telle quelle. Oui, comme réserve de mécanismes.**

- L'écran clé, Organisé, viole encore ses deux règles de ce soir dans les 6 versions. Il dépasse 30 mots partout
  (G-B1). La frise fixe est présente en 5 versions sur 6, sous forme de frise ou de boutons segmentés (G-B2).
- Pour le brasseur en action, trois manques sont communs à toutes : la prochaine action n'est pas un gros bouton
  en bas d'Organisé, ranger exige un glisser, et la bascule Mes notes / Organisé est hors du pouce.
- 6 rangées sur 24 sont des copies de M4 : on n'y voit pas de différence entre les versions.
- La réserve de mécanismes est réelle et variée : métro par piste, barres coût et temps, face-à-face devis contre
  moi-même, avant → après en photos, « Une décision t'attend », jetons de couleur de ce que l'app lit, pictos par
  option, feuille du lien collé avec image. Un jouable greffé peut être probant s'il retire la frise et met le
  premier écran d'Organisé sous 30 mots.

## Recette de greffe pour un jouable

| Écran | Greffe |
|---|---|
| Liste | Lignes de v04 (état à droite, piste en un mot) groupées comme v01 (en-têtes ▸) ; rangée basse de compteurs de v01 ; mini-barre d'options de v02 à la place du mot de piste quand il y a 2 options ou plus. |
| Glisser | Zone de dépôt de v05 qui annonce le résultat, badge « 1er » de v05, pastille « → Air » de v01, toast Annuler. **À ajouter** : « Ranger dans… » en un toucher, sans glisser, pour les gants. |
| Noter vite | Champ d'une ligne de v04 avec « copié il y a 2 min » ; case « tâche » de v03 dans les outils. |
| Note rangée | Pastilles avant → après de p3 v03 / v01 ; sorties OK / Autre ligne… / Juste la note de v04. |
| Nouveau carnet | Raison et voisin de v01 ; sous-domaine « (nouveau) » de v06. |
| Mes notes | Ranger noir et premier de v03 ; une seule entrée « Coller ». **À ajouter** : bascule Mes notes / Organisé à portée de pouce (en bas). |
| Sa ligne | Fil d'Ariane avec pastille de couleur de v03 ; case de tâche dans la note de v04. |
| L'IA lit | Barre de progression de v03 ; pastille animée sur l'onglet de v06. |
| Organisé | En-tête de v06 (question et jetons de couleur, état en 4 points, **sans frise**) ; « Le chemin » en métro de v04 à la place de la frise et des 4 cases ; façons en barres coût / temps de v02, avec le « Retenir » noir de v03 ; **la prochaine action en gros bouton en bas** (« Une décision t'attend » de v02-18). Plafond : 30 mots au premier écran, le reste derrière un toucher. |
| Changé par l'IA | Interrupteurs de M4 / v03 ; cadenas de v05 pour une erreur de lecture corrigée. |
| Options / Comparer | Comparer en barres classées de v06, critère proposé « Garder / Autre » ; photo et pastille « dans À venir » de v01 ; Écarter en bouton, pas en glisser. |
| Décider | Tuiles face à face devis contre moi-même de v01 ; Retenu, Ensuite et Garder de M4. |
| Tâche | Cocher noir de M4 / v02 ; carte du lien gardée de v03. |
| À faire | « Une décision t'attend » de v02 / v06 ; cercles colorés par état de v01 ; veille en interrupteur. |
| Résoudre | Cadre de M4 ; gain chiffré et « pas pris ? » de v01 ; « Résolu ? » pointillé. |
| Résolu | Avant → après de v04 ; rangée d'icônes de l'année de p3 v01 ; « en réserve, si ça revient » de v05 / v06. |
| Relecture | « Ce que tu savais alors » en icônes de v03, mot cherché surligné ; « Toujours le bon choix ? » de v02. |
| Achat | Feuille du lien collé de v06 ; barres de Comparer dans la page de v04. |
| Mémo | M4 ; « je le ressortirai quand tu noteras… » de v03. |
| CO2 | Jetons ronds de v03 ; « ≈ 7 kg perdus » de v06. |
| Malt | Pictos par option de v01 ; veille en interrupteur et calcul de l'app de v03. |
| Épreuve | « À ranger » en tête de v05 ; Oui noir premier de v03 / v06. |
| Hors ligne | Version courte de v06 ; pastille « 1 en file » de v03. |
| Erreur | Colonne de jetons de ce que l'app lit seule de v06 ; photo gardée de v03. |
