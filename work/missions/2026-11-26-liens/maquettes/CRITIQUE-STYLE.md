# Critique — mini maquettes « style adulte » du Carnet (26.11)

Critique en Opus (Fable interdit), calibré sur `ecran-1/fils21-choisir/critique/PORTRAIT.md` (§ 7 : sa note ≤ la plus basse de
lisibilité et de besoin, − 0,5 sur toute note prêtée). 30 captures 390 × 844 ouvertes. Données recoupées sur les fixtures c79
et `cas-fictifs.json`. Mode tri : rien n'est écarté, le brasseur voit les six.

Juges : **C** critique · **P1** le brasseur TDAH visuel · **P2** brasseur pro pressé, téléphone en main dans la salle de brassage ·
**P3** gérante qui suit achats et échéances.

## Constats communs (comptés dans chaque variante concernée)

- **Choix orienté sur les 600 bouteilles** (5 variantes sur 6). A1 et A3 posent « Retenir Fournisseur B » comme prochaine
  action, avec le bouton principal. A2 fait pareil, trie la colonne B en premier et la teinte. B3 met le « Choisir » de B en
  bouton principal et l'en-tête « gagne 2 ». Aucun n'est marqué ✦ alors que c'est une recommandation de l'IA. B2 affiche
  un verdict ✦ (« 600 pile, le moins cher ») : il est honnête, mais il oriente. **Seule B1 reste neutre** (« ✦ Choisir une offre »).
- **Sens métier sur les bouteilles.** « Le plus bas / moins cher : B, 410 » compare 410 CHF pour 600 bt à 504 CHF pour 1200 bt.
  Ramené à la bouteille livrée, B coûte 0,68 CHF contre 0,42 chez Verallia. Pour une brasserie, la bouteille est un
  consommable : 600 bt d'avance ne sont pas perdues. Aucune variante ne montre ce prix par bouteille. Le brasseur le verra en 2 s.
- **« pas trouvée » lu comme « écartée ».** Sa note dit « fuite sous la dalle, pas trouvée » : la piste reste ouverte.
  B1, B2 et B3 écrivent « écartée » sans ✦. A3 marque l'inférence ✦ (« écartée pour l'instant »). A1 et A2 restent fidèles.
- **« Cause : joint du siphon usé » affirmée** sans ✦ dans A1 et A2 (avec ✓ vert dans A2). A3 écrit « Cause probable »,
  la bonne formulation.
- **150 CHF perdus dans A.** « Estimation 150 CHF (exemple). » est bien une de ses notes (MSG-c79-44, devenue un article de la
  fixture écoulement). RESULTAT-A dit qu'elle n'y est pas : c'est faux. Les trois variantes A affichent donc « coût : devis
  attendu » et perdent le seul chiffre du carnet. B l'affiche.
- **Date passée présentée comme à venir.** La tâche de l'IA « Sentir à nouveau » a pour échéance le 23.11 (origine ia). Or sa
  note dit « dans 2 semaines », soit vers le 8.12. B1, B2 et B3 l'affichent « 23 nov. » en ambre, comme une date à venir, sans
  ✦ ni « en retard ». Les variantes A évitent le piège avec le repère « lot 14 ».
- **Heures en UTC.** B1 et B2 affichent 20:26 et 20:31 ; l'heure suisse est 21:26 et 21:31. A les a converties.
- **Rappel ✦ « fin novembre » absent de B.** La tâche de l'IA (30.11, précision « mois ») est remplacée par « av. 31 déc. ✦ ».
  Les variantes A le montrent.
- **Aucun harcèlement** : pas de question au pouce, pas de rouge sans raison. **Aucune n'est enfantine.** Le champ texte et le ✦
  à côté du « + » sont présents dans les six.

## A1 — Fiche technique (filets, tables clé / valeur, notes en pied)

- **C** : la plus nette des A : un vrai registre technique, la colonne État en mots colorés se lit d'un coup. Mais l'appareil de
  notes (n2, n3…) et la section Sources recopient tout ; le problème se lit trois fois. Pro, oui ; TDAH, non.
- **P1** : « Ça fait formulaire d'assurance. Les n2 n3 je les lis pas, et devis attendu je l'ai vu trois fois. »
- **P2** : « La barre "Prochain : Contacter l'entreprise X · Fait" en bas, parfait au pouce. La liste se lit bien, état en couleur. »
- **P3** : « Tableau des offres propre, totaux, délai. Mais le 150 CHF a disparu et il manque la note n4 sur l'assurance. »
- Notes : **C 6,5 · P1 5,5 · P2 6,5 · P3 7**
Problèmes (10) :
1. Achat : « Retenir Fournisseur B » posé en prochaine action, bouton principal, sans ✦ : le choix est orienté.
2. Achat : « le plus bas » sur 410 compare 600 et 1200 bt ; pas de prix par bouteille livrée ; « +600 en trop » en **vert** (couleur du bon).
3. Problème : « CAUSE : Joint du siphon usé · trouvée » est une inférence, non marquée ✦.
4. Problème : l'estimation de 150 CHF manque (Options : « coût : devis attendu »).
5. Problème : redites. « Devis attendu » apparaît 3 fois, Entreprise X 3 fois. Les Sources recopient les 5 notes. Trop textuel.
6. ✦ ouvert : Démarches passe de 0/2 à 0/3 en comptant une suggestion non gardée. La colonne « ✦ Toi : changer le joint » double la ligne « option : changer le joint toi-même ».
7. Échéance : « Sources · 4 notes », mais seules n1 à n3 sont listées ; n4, citée par « Renouveler », manque.
8. Échéance : le tableau Offres (Actuelle / 2e assureur) n'a que des « — » : une structure vide qui prend la place.
9. Liste : le seul carnet urgent est tronqué (« Chaudière en panne jour de … »). Le chasse fixe et le texte proportionnel se mêlent dans la colonne Repère (« 0,4 bar » à côté de « 2 sacs »).
10. Problème au repos : Options n'a qu'une colonne, la moitié droite est vide.
À greffer ailleurs : la colonne **État en mots colorés** de la liste, et le **bandeau de compte par état** (« 1 urgent · 5 en recherche… »).

## A2 — Tableau de bord façon Linear (glyphes d'état, cartes, barre d'action)

- **C** : le plus « outil pro » des A. La liste est dense (17 carnets, la chaudière marquée d'une barre rouge) et la barre d'action
  en bas est la meilleure des six : deux gestes réels, « Contacter l'entreprise X » et « Devis reçu ». La règle des dates de l'échéance est
  juste et chiffrée. Le risque : des glyphes d'état muets et une rangée `/tâche` de développeur.
- **P1** : « Les petits ronds à moitié pleins, je fais pas la différence. Sinon c'est clean, ça fait vraie app. »
- **P2** : « Le gros bouton en bas avec la case, c'est exactement ce que je veux les mains mouillées. Le /prix je comprends pas. »
- **P3** : « Onglet Échéances, rappel sur la règle des dates, comparaison triée : je m'y retrouve. »
- Notes : **C 7 · P1 6,5 · P2 7,5 · P3 7,5**
Problèmes (10) :
1. Achat : la colonne B est triée en premier et teintée, avec « Retenir Fournisseur B 410 CHF » en bouton principal. Le choix est orienté deux fois, sans ✦.
2. Achat : même biais sur le « plus bas » (410 pour 600 contre 504 pour 1200) ; pas de prix par bouteille livrée.
3. Liste : glyphes d'état sans légende au repos. « Demi » et « trois quarts » se confondent à 16 px, et les filtres n'ont qu'un glyphe et un chiffre. Icônes muettes (« Les icône sont pas parlant du tout »).
4. Liste : la rangée `/tâche /prix /date @carnet` est du jargon de développeur, sans rien derrière ; une ligne de plus au-dessus du champ.
5. Liste : chiffres en chasse fixe au milieu des mots (« demain 7 h », « sam. 6 déc. ») : la ligne sautille.
6. Problème : « Cause ✓ Joint du siphon usé » affirmée avec une coche verte, sans ✦.
7. Problème : l'estimation de 150 CHF manque.
8. Problème : l'en-tête dit « Notes 6 », mais 4 lignes sont listées.
9. ✦ ouvert : le compteur « ✦ 2 » est sur Démarches, alors qu'une des deux suggestions est dans Options.
10. Échéance : le tableau Offres n'a que des « — », et le dernier tiers de l'écran est vide.
À greffer ailleurs : la **barre d'action du bas** (case et action réelle, plus un 2e geste), la **règle des dates de l'échéance avec le rappel ✦**,
la **barre rouge** de l'urgent, et les onglets Organisé / Échéances.

## A3 — Carnet de labo (feuille réglée, marges, calcul posé)

- **C** : le plus de caractère, et la meilleure honnêteté : « Cause probable », l'inférence « écartée » marquée ✦, le calcul
  posé `0,55 × 600 + 80 = 410` et la marge « palette : 600 en trop, livraison ? ». Mais la réglure casse le texte, la ligne
  pointillée traverse les titres et le tampon penché fait décor. Un « joli carnet » plutôt qu'un outil.
- **P1** : « C'est joli mais ça fait cahier d'école, les lignes partout ça me perd. Les petits ? et → je sais pas ce que c'est. »
- **P2** : « Trop d'air entre les lignes, je scrolle pour rien. La barre Prochain en bas, ok. »
- **P3** : « Le calcul écrit, j'adore pour vérifier. Le reste est lent à parcourir. »
- Notes : **C 5,5 · P1 5 · P2 5 · P3 6**
Problèmes (11) :
1. Liste : la ligne verticale pointillée de la marge traverse les titres (« Chaudière en panne… »). Réglure, points de conduite et marge s'additionnent : trop de texture.
2. Liste : état en un caractère de marge (« ? », « → », « · ») : illisible en 3 s sans la légende.
3. Le texte qui passe à la ligne se cale sur la réglure et prend un double interligne (« joint, flaque… », « livraison 80 / CHF », « sanitaire. ») : la page a l'air cassée.
4. Les annotations ✦ de la marge, à 12–14 px dans une colonne étroite, passent sur 2 à 3 lignes et chevauchent la réglure.
5. Achat : « Retenir Fournisseur B » en prochaine action et l'encadré vert sur B : le choix est orienté.
6. Achat : pas de prix par bouteille livrée (la marge dit le surplus, mais n'en tire pas le coût).
7. Problème : l'estimation de 150 CHF manque.
8. Une section Sources recopie chaque note sur 3 écrans : trop textuel.
9. Échéance : le tampon penché « 31.12 J−35 » est un effet de décor (risque « enfantin », « joli carnet »).
10. Les 6 à 8 dernières lignes réglées sont vides sur chaque écran.
11. Les titres en italique soulignés (« Observation », « Suite ») font cahier d'écolier, pas outil.
À greffer ailleurs : le **calcul posé visible** sous le total, les **annotations ✦ qui disent l'incertitude** (« palette : 600 en trop,
livraison ? »), « Cause probable » et l'heure de la note.

## B1 — Things 3 (listes calmes, prochaines actions en tête)

- **C** : la seule à mettre ses **prochaines actions réelles en tête de liste**, et la seule à garder le choix des bouteilles
  neutre, avec « Qui gagne quoi » en haut : son idée du « C'était vraiment bien ». Calme et adulte. Mais l'état des carnets a
  presque disparu (des anneaux vides partout), et les écrans courts ont un bas vide : risque « simpliste ».
- **P1** : « Qui gagne quoi direct en haut, ça c'est bien. Mais la liste c'est des ronds vides, je vois pas ce qui brûle. »
- **P2** : « Les 3 actions en haut, je sais quoi faire en ouvrant. Les boutons "Fait" sont petits. »
- **P3** : « Comparaison avec le gagnant par ligne, très clair. Le rappel de fin novembre a disparu. »
- Notes : **C 7 · P1 6,5 · P2 7 · P3 7**
Problèmes (9) :
1. Prochaines actions et liste : « Sentir à nouveau — 23 nov. » est en ambre, comme à venir, alors que la date est passée. C'est une date de l'IA, qui contredit « dans 2 semaines » et n'est pas marquée ✦.
2. « Appeler le technicien » reformule « Technicien ? numéro sur l'autocollant » sans ✦.
3. Liste : l'état ne se voit plus (même anneau vide partout, sauf rouge et ambre) ; on perd « cherche » et « décidé ».
4. Liste : « Échéances et listes » range aussi « Bar du Centre » (une vente) et « Levure récoltée » (un essai) ; le classement est flou.
5. Problème : « 1 écartée » pour la dalle, alors que sa note dit seulement « pas trouvée ».
6. Heures en UTC (20:26 et 20:31 au lieu de 21:26 et 21:31).
7. Échéance : le rappel ✦ de fin novembre manque.
8. Achat : pas de prix par bouteille livrée (0,68 contre 0,42).
9. Problème et échéance : 35 à 40 % de l'écran est vide en bas, et les boutons « Fait » et « Devis » font environ 36 px, petits au pouce.
À greffer ailleurs : **« Prochaines actions » en tête de liste**, **« Qui gagne quoi » au-dessus du tableau avec le gagnant
encadré par ligne**, **« ✦ Choisir une offre » neutre**, et « Tes notes » avec leur destination (→ Pistes, → À faire).

## B2 — Cockpit de brassage (instruments, grands chiffres, journal)

- **C** : le coup d'œil de la liste est fort (Urgent, À vérifier, Ouverts), et l'**échelle de prix par bouteille** est le
  meilleur visuel de comparaison des six. Mais « attendu » en 40 px ambre est un mot crié, les majuscules et les cadres font
  tableau de bord, et la liste n'est plus un arbre. « Un peu cockpit », comme prévu.
- **P1** : « Les gros chiffres et la règle des prix, je comprends tout de suite. Le "ATTENDU" en énorme, c'est bizarre. »
- **P2** : « Urgent en haut à gauche, bien. Mais c'est des cadres partout, et le FAIT est petit. »
- **P3** : « La jauge de l'assurance part du jour où j'ai ouvert le carnet, ça veut rien dire. Pas de rappel. »
- Notes : **C 6,5 · P1 7 · P2 6,5 · P3 6**
Problèmes (11) :
1. Liste : l'instrument « À vérifier : Soufre, prévu le 23 nov. » présente une date passée comme à venir, sans ✦. Les lignes se coupent au milieu (« 23 / nov. », « demain / 7h »).
2. Liste : ce n'est plus un arbre (liste à plat par groupe, sans retrait ni traits) ; sa demande « vue en arbre » est mal tenue.
3. Liste : pas d'icône par ligne, l'état est un mot gris, l'urgent n'a qu'un filet de 3 px.
4. Problème : « attendu » en 40 px ambre, plus le badge « ON CHERCHE » : un mot traité comme un chiffre, une lecture cockpit ([[pas-de-cockpit]]).
5. Problème : « 1 écartée » pour la dalle, au lieu de « pas trouvée ».
6. Journal en UTC (20:18 et 20:26).
7. ✦ ouvert : les suggestions sont regroupées dans un bloc à part, pas à leur place, sans × pour refuser ; « — CHF » est étrange.
8. Achat : le prix par bouteille apparaît deux fois (tuiles et tableau). Le bandeau ✦ « le moins cher : B » compare 600 et 1200 bt.
9. Échéance : la jauge part de « ouvert le 24.11 » (« 2 j écoulés sur 37 ») : un départ arbitraire, une jauge générique. Le rappel de fin novembre manque.
10. La numérotation 01, 02 sert à la fois pour les Pièces, la Check-list et le Journal : les renvois se confondent.
11. Les libellés en majuscules partout (PISTES, CHECK-LIST, JOURNAL) alourdissent l'écran.
À greffer ailleurs : l'**échelle des prix par bouteille** (0 → 0,60, avec un repère par offre), les **trois instruments en tête de liste**
(sur deux, comme B3), et le **J−35 en grand**.

## B3 — Cartes de décision (questions, options côte à côte)

- **C** : la seule qui **pense comme lui** : chaque section est sa question (« D'où vient la fuite ? », « Comment
  réparer ? », « Quelle offre ? », « Renouveler chez qui ? »). La suggestion ✦ remplit la case vide de l'option manquante, à sa
  place. La liste est classée par ce qui attend, et ses repères sont riches et vrais. Visuel **et** adulte. Le défaut majeur : le
  « Choisir » de B pré-marqué.
- **P1** : « Là je comprends ce que c'est. Les questions, les deux cartes trouvé / pas trouvé, très bien. Mais pourquoi le Choisir de B est déjà blanc ? »
- **P2** : « Urgent : appeler le technicien, demain 7h, en haut. Parfait. L'action est au milieu, pas au pouce. »
- **P3** : « Renouveler chez qui, avec les deux assureurs et Demander : exactement mon suivi. Il manque juste le rappel. »
- Notes : **C 7,5 · P1 8 · P2 7 · P3 7,5**
Problèmes (8) :
1. Achat : le « Choisir » de Fourn. B est en bouton principal, avec l'en-tête vert « gagne 2 » : le choix est pré-marqué (aveu du RESULTAT-B).
2. Achat : « Total le plus bas : Fournisseur B 410 » compare 600 et 1200 bt ; pas de prix par bouteille livrée.
3. Liste : « Odeur de soufre — sentir · 23 nov. » : date passée, date de l'IA non marquée ✦.
4. Liste : la carte Urgent dit « Appeler le technicien », une reformulation sans ✦. Le tri (À décider / À trouver / À faire) est posé par l'IA sans le dire.
5. Problème : « Sous la dalle — écartée », alors que sa note dit « pas trouvée ».
6. Échéance : le rappel ✦ de fin novembre manque. Les deux cartes « — CHF » occupent beaucoup de place pour rien encore.
7. Échéance : les pièces sont en 3 tuiles aux mots coupés (« Inventaire du / matériel ») : une liste à cocher se lit moins vite en tuiles.
8. Achat : l'en-tête dit « Tes notes · 4 lignes », mais 3 sont listées. La prochaine action reste au milieu de l'écran, pas au pouce.
À greffer ailleurs : les **questions en titres de section**, la **suggestion ✦ qui remplit la case de l'option manquante**,
la liste **classée par ce qui attend** et ses **deux cartes de tête** (Urgent et À décider, avec les prix), et « Renouveler chez qui ? ».

## Classement proposé (une proposition : le brasseur voit les six)

| Rang | Variante | C | P1 | P2 | P3 | Problèmes | Raison |
|---|---|---|---|---|---|---|---|
| 1 | B3 cartes de décision | 7,5 | 8 | 7 | 7,5 | 8 | pense en questions, ✦ à sa place, visuel et adulte |
| 2 | A2 façon Linear | 7 | 6,5 | 7,5 | 7,5 | 10 | le plus « outil pro », la meilleure action au pouce ; glyphes muets |
| 3 | B1 Things 3 | 7 | 6,5 | 7 | 7 | 9 | « Qui gagne quoi » en tête, seul choix neutre ; état effacé, risque simpliste |
| 4 | B2 cockpit | 6,5 | 7 | 6,5 | 6 | 11 | le meilleur visuel de prix ; cockpit et liste à plat |
| 5 | A1 fiche technique | 6,5 | 5,5 | 6,5 | 7 | 10 | la plus nette, mais trop textuelle (Sources, n2) |
| 6 | A3 carnet de labo | 5,5 | 5 | 5 | 6 | 11 | la plus honnête, mais décor et réglure qui casse le texte |

Phrase prédite, B3 : « Là c'est vachement mieux, je comprends ce que c'est. Mais le Choisir est déjà choisi ?? »
A3 : « joli mais ça fait cahier d'école ».

## Greffes « meilleur de chaque »

1. **B3 + A2 + B1, la recette de tête.** Squelette B3 (questions en titres, ✦ dans la case vide, liste par ce qui attend, deux cartes de tête) ; barre d'action du bas d'A2 ; « Qui gagne quoi » de B1 au-dessus du tableau, « ✦ Choisir une offre » neutre et trois « Choisir » égaux ; règle des dates d'A2 avec le rappel ✦ fin novembre.
2. **A2 + B3 + B2, l'outil pro rendu parlant.** Liste A2 sous les deux cartes de tête de B3 ; état en mots colorés (A1) au lieu des glyphes muets, rangée `/tâche` retirée ; titres-questions de B3 ; échelle des prix par bouteille de B2 au-dessus du tableau.
3. **Corrections communes à toute greffe** : prix par bouteille livrée (B 0,68, Verallia 0,42 hors livraison, occasion 0,20 à laver) ; « pas trouvée » gardé, ou « écartée » marqué ✦ ; « Cause probable » (A3) ; 150 CHF affichés ; heure suisse ; date de l'IA passée montrée « en retard » et ✦ ; calcul posé sous le total (A3).

## Données inventées ou orientées (signalement demandé)

- **« Choisir » ou « Retenir » pré-marqué** : A1, A2 (plus le tri de la colonne B en premier), A3, B3. Verdict ✦ orientant : B2. Neutre : B1.
- **Inférences non marquées ✦** : « Cause : joint usé » (A1, A2) ; « écartée » (B1, B2, B3) ; « Appeler le technicien » (B1, B3) ; date de l'IA « 23 nov. » montrée comme la sienne (B1, B2, B3) ; tri en domaines (Ventes) ou en groupes, posé par le concepteur (A, B3), signalé dans RESULTAT-A.
- **Aucune valeur chiffrée inventée** : chaque prix, chaque quantité et le 150 CHF sont dans ses notes ; les totaux sont marqués ✦.
- **Omissions** : 150 CHF (A1, A2, A3), sur la foi d'une affirmation fausse de RESULTAT-A ; n4 (A1) ; le rappel ✦ (B1, B2, B3).

LEÇON PROPOSÉE : avant d'écrire « absent de la fixture », chercher aussi dans ses messages (MSG-…), pas seulement dans
`carnet.notes` : le « 150 CHF » de l'écoulement est un message devenu article, et les trois variantes A l'ont perdu.
