# Critique c1 : filtre « du … au … » dans Opérations v6a (12 mini maquettes)

Critique en Opus, sans Fable (14.11). Tri : aucun REJET, le brasseur voit les 12. Les skills `boosters-ux`, `impeccable` et `ui-design-system`
n'ont pas pu être chargés (l'outil Skill est absent de cette session). J'ai donc jugé avec le vocabulaire de v6a, DOSSIER.md et le portrait v2.

## 0. D'abord : baseline et niveau du panel

- **Mesure du panel** (`tests.txt`) : ressemblance 0,93 et 15 % de paires presque identiques, donc PANEL ECHEC sur la diversité. C'est
  attendu, puisque le repos doit être v6a (règle n° 1). La diversité se lit dans les états « après » et les états intermédiaires, et elle y
  est réelle : six approches (feuille, sur place, rangée, frise ou règle, phrase, loupe). **Pas de relance.**
- **Images ouvertes (32, dont les 24 repos et après)** :
  - la référence `ref/v6a/v6a-page.png` ;
  - s1 : `s1a-repos`, `s1a-geste`, `s1a-apres`, `s1b-repos`, `s1b-geste`, `s1b-apres`, `s1c-repos`, `s1c-geste`, `s1c-apres`,
    `s1d-repos`, `s1d-apres` ;
  - s2 : `s2a-repos`, `s2a-apres`, `s2b-repos`, `s2b-feuille`, `s2b-apres`, `s2c-repos`, `s2c-zoom`, `s2c-apres`, `s2d-repos`,
    `s2d-apres` ;
  - s3 : `s3a-repos`, `s3a-apres`, `s3b-repos`, `s3b-ouvert`, `s3b-apres`, `s3c-repos`, `s3c-ouvert`, `s3c-apres`, `s3d-repos`,
    `s3d-apres`.
- **Écarts à la baseline au repos**, signalés en premier (règle n° 1 : « v6a intacte au repos » ; DOSSIER : « ne pas l'alourdir au repos ») :
  - **s1d** change la pilule v6a elle-même : elle est enchâssée dans un segment gris « Mois | Plage ». C'est le seul écart à la forme.
  - **s2a, s2c, s2d, s3a, s3b, s3d** ajoutent une rangée permanente au repos (+30 à +62 px).
  - **s1a, s1b, s1c, s2b et s3c** gardent v6a et n'ajoutent qu'un signe (icône, chevron, bouton ou puce).
  - Les captures des séries s2 et s3 s'arrêtent au pli (844 px) : la rangée du bas (IA, Par date, Filtres, Doublons, Apport, Archives) n'est
    pas visible. Je n'ai pas pu la vérifier ; c'est un doute, pas un défaut.
- **Montants après le geste** (données v6a : tout le 9 nov., loyer de 400,00 à payer le 25 nov., retard de 60,00 de déc. 2025) : **justes
  partout**.
  - Les plages dessinées sont 1–15 nov. (s1, s2a, s2b, s3a, s3b, s3d), 9–15 nov. (s2d), 3–17 nov. (s3c) et 15 oct.–10 nov. (s2c). Toutes
    contiennent le 9 et excluent le 25.
  - Le résultat attendu est donc : Fixes 68,00, payé 325,40 (68 + 186,80 + 42 + 28,60), à payer 0,00, dépensé 296,80 (sans le matériel,
    comme dans v6a). Le retard de 60,00 reste à part, comme dans v6a.
  - Les jours de la semaine sont justes : le 1er nov. 2026 est un dimanche, le 3 un mardi, le 9 un lundi, le 10 un mardi, le 30 un lundi.
  - Les durées sont justes : 15 j, et 27 j pour le 15 oct.–10 nov.
  - Les « 5 opérations » de s3b et s3c sont justes.
- **Saisie** : aucun `type="number"` dans les 12 pages.

## 1. Tableau par variante : combien et quels problèmes ?

| id | verdict | défauts (vus sur l'image) | correctif précis |
|---|---|---|---|
| **s2b** calendrier en feuille | **garder** | 1. `s2b-apres` : ‹ › disparaissent pendant la plage ; il faut × avant de changer de mois (10.11 : « Pourquoi je peux pas changer de mois ? Je veux !! »). 2. `s2b-feuille` : la feuille cache les piles, et seul « le loyer du 25 reste dehors » dit l'effet ; à payer et dépensé n'y sont pas. 3. `s2b-apres` : la pilule noire pleine pèse plus que tout le bandeau ; c'est l'élément le plus foncé après « ✓ Payé ». | 1. Garder ‹ › dans la pilule de plage, qui font glisser la plage de sa durée (greffe s1b). 2. Ajouter en pied de feuille « à payer 0,00 · dépensé 296,80 » à droite du résumé (greffe s1a). 3. Pilule de plage teintée bleu clair, comme celle de s1a, pas noire. |
| **s1b** pilule étirée | **garder** | 1. `s1b-apres` : la borne « 1 » n'a pas de mois (« 1 — 15 nov. ») et se lit mal seule. 2. Les bornes font 26 px : c'est sous les 44 px du geste principal. 3. La pastille « hors plage : loyer… » est tout en bas, sous « En retard », loin de Charges fixes. 4. `s1b-repos` : le signe |↔| à côté de « novembre » ne dit pas qu'on peut le toucher (doute : picto composé). 5. La rangée du haut est pleine à 338 px ; une plage à cheval (« 15 oct. — 10 nov. ») ne tient pas. | 1. Écrire « 1er — 15 nov. ». 2. Bornes à 32 px dans une pilule de 36 px, avec une zone de toucher de 44 px (::after). 3. Mettre la ligne « hors plage » sous Charges fixes, en gris, 400,00 sans le mettre à 0 (greffe s2a). 4. Garder l'icône et ajouter la bulle « du … au » au premier toucher. 5. À cheval, passer la pastille « en retard » à la ligne des flèches. |
| **s2a** frise à poignées | **garder** | 1. `s2a-repos` : +62 px au repos, la frise est toujours là (DOSSIER : ne pas alourdir le repos). 2. Les poignées ‖ ressemblent à un bouton pause. 3. Une plage à cheval sur deux mois est impossible dans la frise d'un seul mois. 4. Doute : la barre du 9 (325,40) et celle du 25 (400,00) paraissent de même hauteur. | 1. Au repos, la frise est repliée ; toucher « novembre » ou une icône de 14 px la déplie (comme s1a). 2. Poignées rondes à bord épais (greffe s3d), avec la bulle « 1er → 15 nov. » pendant le glisser. 3. Quand on pousse une poignée contre le bord, la frise défile vers le mois voisin (idée de s3d). 4. Mettre les barres à l'échelle du plus haut jour. |
| **s3d** règle du mois | corriger | 1. `s3d-apres` : les jours hors plage sont hachurés, alors que dans v6a la hachure veut dire « à payer » (loyer, pastille, légende) : deux sens pour un même motif. 2. Le loyer disparaît sans trace (aucune ligne « hors plage »). 3. `s3d-repos` : +60 px au repos ; les marques de flux (vert et noir au 9, or au 25) font 4 à 6 px et ne se lisent pas ; le trait noir du 9 n'a pas de sens dit. 4. La pilule grisée garde ‹ ›, et on ne sait pas ce qu'elles font en plage. | 1. Hors plage : piste grise unie et estompée, sans hachure. 2. Ajouter la ligne « hors plage » sous Charges fixes. 3. Règle repliée au repos ; marques à l'échelle, au moins 12 px. 4. ‹ › font glisser la plage (greffe s1b). |
| **s1a** feuille aux dates natives | corriger | 1. `s1a-apres` : ‹ › disparaissent en plage (plainte du 10.11). 2. La pastille « hors plage » est en bas de liste, loin de Charges fixes. 3. `s1a-geste` : « dim. 1 nov. » et « Voir du 1 au 15 nov. » au lieu de « 1er ». 4. Il faut 6 touchers pour poser une plage (feuille, du, date, au, date, Voir). | 1. ‹ › gardés autour de « 1 → 15 nov. ». 2. Ligne « hors plage » sous sa catégorie. 3. « 1er ». 4. Raccourcis dans la feuille : « 1–15 · 16–fin · mois passé » (D262b). |
| **s3b** phrase aux dates touchables | corriger | 1. `s3b-repos` : la phrase « du 1er nov. au 30 nov. » redit « novembre » au repos : +30 px de texte au premier plan. 2. `s3b-apres` : le loyer disparaît sans trace. 3. La pilule grisée garde ‹ ›, dont l'effet est inconnu, à côté de « ↺ novembre » : deux façons de revenir. 4. Les deux bornes n'ont pas le même style (« 1er nov. » souligné gris, « 15 nov. » bleu plein). 5. `s3b-ouvert` : le 9 n'a qu'un point noir, sans couleurs de catégories. | 1. Au repos, ne montrer qu'une puce « du … au » ; la phrase n'apparaît qu'une fois la plage posée. 2. Ligne « hors plage ». 3. ‹ › font glisser la plage, et « ↺ novembre » est retiré au profit d'un × sur la phrase. 4. Même style pour les deux bornes. 5. Points aux couleurs des catégories (greffe s2b). |
| **s3c** la loupe comprend une période | corriger | 1. `s3c-repos` : la rangée du mois est pleine (354 sur 354 px), la pastille « en retard » est poussée au bord. 2. L'état « toucher la puce du … au » n'est pas montré : on ne sait pas ce qu'elle ouvre. 3. `s3c-apres` : « 1 après le 17 » est sibyllin (c'est le loyer). 4. `s3c-ouvert` : taper « 3-17 nov. » au clavier du téléphone va contre « posée au toucher » ; c'est un chemin bis, pas le principal. 5. « Compris aussi : … » ajoute 4 puces de texte. | 1. Puce réduite à l'icône calendrier (32 px). 2. Montrer son état : calendrier à plage (s2b). 3. « 5 opérations · loyer du 25 hors plage ». 4. Garder la loupe en raccourci et donner le calendrier à la puce. 5. « Compris aussi » au toucher seulement. |
| **s2d** brush sur l'histogramme | corriger | 1. `s2d-apres` : l'étiquette « 68,00 » est posée en haut du fantôme pointillé de 468, si bien que la pile Fixes se lit à 468 : **valeur trompeuse**. 2. `s2d-repos` : +62 px et le texte « glisser sur les jours » au repos. 3. Doute : un glisser horizontal sur la page qui défile entre en conflit avec le défilement. 4. Le × est dans une étiquette noire qui couvre l'histogramme. | 1. Étiquette au sommet de la part pleine (68,00), et le fantôme sans chiffre ou avec « mois 468,00 » en gris. 2. Histogramme replié au repos. 3. Appui de 300 ms avant le glisser, ou poignées (s2a). 4. Étiquette au-dessus de la carte, sans recouvrement. |
| **s1c** rangée dépliée par chevron | corriger | 1. `s1c-repos` : le chevron ⌄ seul ne dit pas « dates » ; deux chevrons voisins (⌄ et ›). 2. `s1c-apres` : la pilule grisée « novembre » garde ‹ ›, en même temps que la rangée « du 1er au 15 » : deux périodes affichées. 3. Elle dit « dim. 1 nov. » et non « 1er ». 4. +40 px dans la carte, sans durée affichée. | 1. Icône calendrier au lieu de ⌄. 2. Pilule remplacée par la plage, et ‹ › qui glissent la plage. 3. « 1er ». 4. « 15 j » à droite (greffe s1d). |
| **s3a** préréglages | corriger | 1. `s3a-repos` : 5 puces au premier plan (7 j, 30 j, ce mois, trimestre, du … au), et « ce mois » répète la pilule : trop de texte (D2, D3). 2. `s3a-apres` : 3 étages (pilule, puces, champs), soit +110 px. 3. Le loyer disparaît sans trace. 4. 7 j et 30 j débordent sur octobre sans dire « inconnu ». | 1. Préréglages déplacés dans la feuille ou le calendrier (s2b), au plus 3. 2. Après, garder la pilule « ‹ 1er – 15 nov. › » et replier puces et champs. 3. Ligne « hors plage ». 4. « octobre : aucune donnée saisie ». |
| **s1d** bascule Mois \| Plage | corriger | 1. `s1d-repos` : la pilule v6a est changée au repos (segment gris), **écart à sa maquette** (règle n° 1). 2. `s1d-apres` : le mois disparaît entièrement, « Mois » ne dit pas lequel. 3. Les feuillets se lisent « 1 nov. dim. » (mois et jour empilés à l'envers). 4. +50 px. | 1. Pilule v6a telle quelle, « Plage » en icône à côté. 2. « Mois » devient « nov. ». 3. « dim. 1er nov. » sur une ligne. 4. Garder le « 15 j » entre les bornes, à greffer. |
| **s2c** frise des 12 mois | corriger (dernier) | 1. `s2c-apres` : la pilule dit toujours « novembre » en noir à côté de « 15 oct. → 10 nov. » : **deux périodes contradictoires**. 2. Le cadre bleu ne couvre qu'octobre ; on ne voit pas qu'il entre en novembre. 3. `s2c-zoom` : un jour fait 5,8 px, donc pas de jour précis au doigt (contre « une intervalle de temps précis »). 4. `s2c-repos` : +56 px, dont 10 mois sur 12 vides en pointillé ; la frise double ‹ ›. 5. « aucune opération » pour octobre affirme un zéro, alors que la maquette n'a pas ces données (inconnu ≠ 0, doute). | 1. Pilule grisée ou remplacée. 2. Cadre qui couvre O et N. 3. Le zoom pose le jour au toucher, avec des cases d'au moins 24 px. 4. Frise des mois au toucher seulement. 5. « aucune opération saisie ». |

## Classement
1. **s2b** : calendrier à plage standard (react-day-picker), repos quasi v6a, à cheval possible, effet dit, hors plage à sa place.
2. **s1b** : repos v6a, ‹ › gardés et étendus (la plage glisse de sa durée) ; c'est le geste premier respecté.
3. **s2a** : frise informative (on voit quand l'argent bouge), poignées, hors plage à sa place ; le repos est alourdi.
4. **s3d** : règle à poignées lisible et vivante, mais sa hachure contredit « à payer » et le loyer disparaît.
5. **s1a** : le meilleur aperçu de l'effet avant de valider, mais ‹ › perdus et 6 touchers.
6. **s3b** : phrase et calendrier ancré, compte d'opérations juste ; le repos redit le mois.
7. **s3c** : idée bonus (la loupe lit une période) ; la rangée est pleine et la puce n'est pas montrée.
8. **s2d** : fantôme mois contre plage intéressant, mais l'étiquette est trompeuse et l'invite est textuelle.
9. **s1c** : sobre, mais affiche deux périodes et un chevron muet.
10. **s3a** : préréglages utiles, mais cockpit au repos et 3 étages après.
11. **s1d** : touche à la pilule v6a au repos, et le mois disparaît.
12. **s2c** : périodes contradictoires, jour imprécis, mois vides au repos ; c'est la seule plage à cheval, et une bonne greffe.

## Candidates
Une par approche, trois chaleurs (froide s1b ; tiède s2b et s2a ; chaude s3b et s3c).
- **s2b** (feuille calendrier, tiède) :
  1. Pilule de plage teintée, avec ‹ › qui glissent la plage.
  2. Pied de feuille « 15 jours · 5 opérations · à payer 0,00 · dépensé 296,80 ».
  3. Raccourcis « 1–15 · 16–fin · mois passé » en tête de feuille (D262b : « Aujourd'hui / Mois passé / Mois suivant »).
- **s1b** (sur place, froide) :
  1. « 1er — 15 nov. » et bornes de 32 px (zone de 44 px).
  2. Ligne « hors plage » sous Charges fixes.
  3. Durée « 15 j » sous la pilule à la place de la ligne des flèches, dont l'aperçu passe à l'appui.
- **s2a** (frise, tiède) :
  1. Frise repliée au repos, dépliée par un toucher sur « novembre ».
  2. Poignées rondes et bulle de lecture (s3d).
  3. Défilement vers le mois voisin au bord, et barres à l'échelle.
- **s3b** (phrase, chaude) :
  1. Puce « du … au » seule au repos.
  2. Points aux couleurs des catégories et ligne « hors plage ».
  3. ‹ › glissent la plage ; un seul retour (×).
- **s3c** (loupe, chaude) :
  1. Puce en icône de 32 px qui ouvre le calendrier de s2b.
  2. « 5 opérations · loyer du 25 hors plage ».
  3. « Compris aussi » au toucher.

## Greffes
| idée | origine | reçue par |
|---|---|---|
| ‹ › font glisser la plage de sa durée, avec aperçu « ‹ 17 → 31 oct. · 16 → 30 nov. › » | s1b | s2b, s2a, s3b, s3c |
| aperçu de l'effet avant de valider (jours, opérations, à payer, dépensé, ce qui sort) | s1a | s2b, s3b |
| ligne « hors plage » à sa place sous sa catégorie, 400,00 gris et non mis à 0 | s2a / s2b / s2d | s1b, s3b, s3c |
| points aux couleurs des catégories sur les jours, hachure « à payer » le 25 | s2b | s3b, s3c |
| bulle « 1er → 15 nov. » au-dessus de la poignée ; toucher un jour pose la poignée la plus proche | s3d | s2a |
| pousser une poignée contre le bord fait défiler le mois voisin (plage à cheval) | s3d | s2a |
| bandeau « du 15 au 31 oct. · aucune opération saisie » pour la part sans données d'une plage à cheval | s2c | toutes |
| durée « 15 j » entre les deux bornes | s1d | s1b, s1c |
| piles fantômes : le mois en pointillé derrière la plage, étiquette au bon niveau | s2d | s2a (option) |
| repères des lundis (semaines) sur la frise | s2d | s2a |
| la loupe comprend « 3-17 nov. » et pose la plage en pastille | s3c | s2b (chemin bis) |
| raccourcis de durée (trois au plus) | s3a | s2b, s1a |

## Retouches communes, relances, fusions
- **Communes** :
  - « 1er » pour le premier du mois partout (s1a, s1c, s1d).
  - ‹ › jamais retirés en plage (10.11).
  - Une trace « hors plage » pour le loyer dans toutes les variantes (s3a, s3b, s3c et s3d n'en ont pas).
  - Une suggestion IA qui suit la plage (« le brassage », puisque Fixes tombe à 68) ; à voir en bas des pages s2 et s3.
  - La hachure réservée à « à payer ».
- **Fusions proposées** : s2a + s3d (une règle à poignées rondes, barres empilées par catégorie, repliée au repos) ; s2b + s1a (calendrier et
  pied d'aperçu des montants) ; s1b + s1d (bornes sur place et durée « 15 j »).
- **Relance ciblée** : aucune pour le niveau. Pour le port, une capture pleine page de s2b, s2a, s3b et s3c (la rangée du bas, non vue).

## Phrase prédite du brasseur
- s2b : « Le calendrier, c'est clair, je pose du 1 au 15 en deux touches. »
- s1b : « Bien, je garde mes flèches, et elles avancent de 15 jours. »
- s2a : « J'aime voir quand l'argent bouge, mais pas toujours affiché. »
- s3d : « Le slider est cool, mais pourquoi c'est hachuré comme un truc à payer ? »
- s2c : « Il dit novembre et octobre en même temps ?? »
