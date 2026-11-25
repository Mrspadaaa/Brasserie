# Critique 3 — « un carnet, pas un chat » (25.11, après la correction 2)

Juge : Opus, calibré sur PORTRAIT.md v2 (§ 7 : note = min(lisibilité, besoin), puis − 0,5).
Lu : ITERATIONS.md, DOSSIER.md, CORRECTION-1.md, CORRECTION-2.md, critique-2.md, `corrections/c2-m1..m4.md`, la fixture
`tests/fixtures/c79/zz-ecoulement-qui-fuit.json` (7 notes, titre compris ; `photos: []` ; aucun lien), DEFAUTS-RECURRENTS
§ CARNET-REPOND-AU-BESOIN.
Captures ouvertes : les 53 états distincts de `cap/` (m1 : 13, m2 : 13, m3 : 13, m4 : 14). Tailles relevées dans les
4 HTML : M1 14/16/24, M2 14/16/20, M3 14/16/24, M4 14/16/20. Pas de chasse fixe. Barré : seulement la tâche faite de M4.
Règle n° 1 : `choix/ecrans.json` n'a aucun écran Carnet choisi.

Légende : **B** = bloquant (valeur fausse, élément de sa demande absent, refus explicite rejoué, geste sans effet).
**m** = mineur. **D** = doute, non compté.

## Captures de la page

Elles sont à jour. Les alias ont la même empreinte que l'état qu'ils montrent : `m1-avant` = `m1-note`,
`m1-apres` = `m1-cherche`, `m1-annuler` = `m1-change`, `m3-avant` = `m3-note`, `m3-apres` = `m3-range`,
`m4-avant` = `m4-noter`, `m4-apres` = `m4-range`. Plus aucune v0.

## Vérifications demandées par le pilote

| | Notes ajoutées au carnet réel (« samedi », 7 à 10, photo, lien) | Dalle | Un seul plein | Résoudre |
|---|---|---|---|---|
| M1 | **Marqué à moitié.** n9 et n10 portent « (exemple) » dans le carnet (`m1-decide`, `m1-resolu`), mais la relecture les cite sans cette marque, sous « tes mots, pas réécrits » (`m1-relire`). La photo n6 et le lien n8 ne sont pas marqués. | jamais tranchée : « dalle pas trouvée · ? à vérifier » | oui, 0 ou 1 par état | `m1-resoudre` → `m1-resolu` |
| M2 | **Inventé, non marqué.** n7 « Je change le joint moi-même samedi. », n8 « Joint changé. Trois nettoyages, plus de flaque. », la photo de n1, et tout le mémo | jamais tranchée : « ? dalle pas vérifiée, pas eu besoin » | oui | `m2-resoudre` → `m2-resolu` |
| M3 | **Inventé, non marqué.** n7 « Je le change samedi. », n8 « Joint changé, 12 CHF la pièce. », n9 « Deux nettoyages, plus de flaque. », la photo, et tout l'achat (sauf n2) | jamais tranchée : « ? dalle : jamais vérifiée » | oui | `m3-resoudre` → `m3-resolu` |
| M4 | **Inventé, non marqué, et dit à lui.** n7 est citée « tes mots · note 7 » et « ta raison » ; n8 et n9 ne sont pas marquées ; la photo est légendée « ta photo · 21:26 », alors que son fil n'a aucune photo | jamais tranchée : « toujours à vérifier » | oui | `m4-resoudre` → `m4-resolu` |

La date « samedi 28 nov. » tombe juste dans les quatre (le 24 nov. 2026 est un mardi) : elle est tirée de la note,
jamais inventée. Le défaut est ailleurs : la note qui dit « samedi » n'est pas la sienne, et rien ne le signale.
Critique 2 avait laissé passer ce défaut, en citant même « de ta note n°7 : Samedi » parmi les choses à garder.

## M1 · Le carnet se range — 4 problèmes (B 0)

**Critique 2 : 9 corrigés sur 9.**
La dalle garde « pas trouvée » partout, et la relecture dit « cherchée, pas trouvée, jamais ouverte · ? à vérifier si
ça revient » (`m1-relire`). Les jetons sont collés sous la frise et restent visibles au défilement (`m1-cherche-bas`).
La bande du bas tient en une rangée, et « 7 changés » est en haut. La ligne Local est présente dans tous les états.
L'option gardée en secours est rangée « En réserve, si la flaque reste » (`m1-decide`). Les notes vont de n1 à n10
sans trou. La note 4 est marquée « n'a pas servi » (`m1-resoudre`). L'achat reprend ses 4 états (`m1-achat`), et
« Retenir » est visible au premier écran (`m1-apres`).

**Nouveaux.**
1. **m** La marque des notes ajoutées se perd en route. n9 et n10 portent « (exemple) » dans le carnet, mais la
   relecture les cite sans cette marque, sous « tes mots, pas réécrits » (`m1-relire`). La photo n6 et le lien n8
   ne sont pas dans son fil, et rien ne le dit (`m1-avant`, `m1-attente`).
   - Corriger : garder « (exemple) » dans chaque citation, et marquer la photo et le lien.
2. **m** La note 4 « Contacter l'entreprise X → si la flaque reste » est posée à l'intérieur de la carte « Changer le
   joint du siphon » (`m1-apres`, `m1-tache`, `m1-resolu`). Elle s'y lit comme une étape du joint, alors que c'est le
   plan B.
   - Corriger : la sortir de la carte, sur une ligne « Si la flaque reste : entreprise X » en pointillé, comme
     dans `m4-options`.
3. **m** « Je cherche ? » est proposé en pointillé dans la frise (`m1-apres`), mais aucun geste n'est visible pour
   l'accepter, et la proposition manque dans la feuille des 7 changements (`m1-annuler`).
   - Corriger : une case dans la frise, comme `m4-range`, et une ligne dans la feuille.
4. **m** Achat : le jeton plein bleu « Je cherche · 1 offre » répète la pastille de la frise juste au-dessus
   (`m1-achat`). L'écran montre deux aplats bleus pour la même chose.
   - Corriger : un jeton « 1 offre » en contour.
- D : la raison n° 3 de la relecture, « le sanitaire : « Estimation 150 CHF » », relie l'estimation au sanitaire.
  C'est une lecture de l'IA ; elle est en violet, donc honnête, mais M2 dit mieux « pour lui ? ».
- D : les heures. n1 est datée 21:18, l'heure du titre (le constat est de 21:26), et n7 21:30 au lieu de 21:26.
- À garder : la ligne de jetons, qui fait la meilleure vue d'ensemble des quatre (`m1-apres`) ; l'erreur avec le
  repli « Lu par l'app », où « Réessayer » remplace « Ranger » (`m1-erreur`) ; le hors-ligne complet
  (`m1-hors-ligne`) ; le chemin daté de la relecture.

**Le parcours.**

| noter vite | trouvé | pas trouvé | devis | coût | options | décider | tâche | résoudre | relire pourquoi | non-problème | sans IA | annuler |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| trouvé | trouvé | trouvé | trouvé | trouvé (+ Noter le coût) | trouvé | trouvé | trouvé (date de n9) | trouvé | trouvé | trouvé (achat) | trouvé (hors ligne et erreur) | trouvé |

**Note : lisibilité 8 (3 tailles, jetons collés, une rangée en bas, un plein), besoin 8,5 (tout le parcours, rien de
faux, invention marquée à moitié), donc 8, et 7,5 avec le retrait.**
Phrase prédite : « Vachement bien, là c'est clair, et la dalle pas trouvée c'est juste. Mais le contacter X dans la
tâche du joint c'est bizarre. »

## M2 · La fiche au-dessus — 6 problèmes (B 1)

**Critique 2 : 7 corrigés sur 8, 1 encore là en partie.**
- Corrigés : le repli sans IA a des jetons, des options lues et « Tâche ? Garder / Non » (`m2-sans-ia`) ; « 150 CHF
  estimé » ; les explications sont parties, et la fiche tient en une ligne avant le rangement (`m2-avant`) ; « devis
  attendu » ; le mémo tient en une ligne (`m2-memo`) ; « Pas servi » s'écrit en gris, sans barré (`m2-resolu`) ;
  il reste 3 tailles (14, 16, 20).
- En partie (compté ci-dessous, n° 6) : la fiche occupe encore 44 à 47 % de l'écran.

**Nouveaux.**
1. **B** Suite inventée, non marquée, dans son carnet réel. n7 « Je change le joint moi-même samedi. » et n8 « Joint
   changé. Trois nettoyages, plus de flaque. » sont posées dans « Mes notes », comme ses propres notes (`m2-tache`,
   `m2-resoudre`, `m2-relire`). La photo de n1 n'existe pas dans son fil (`m2-avant`), et le mémo entier est
   imaginé (`m2-memo`). Le brasseur lirait, dans son carnet ZZ, des phrases qu'il n'a jamais écrites.
   - Règle : DOSSIER, « sur UN vrai cas … son fil réel » ; L28 (vraies pièces) ; PORTRAIT § 3 (honnêteté).
   - Corriger : « (exemple) » à chaque note ajoutée, comme la fixture le fait déjà (« Estimation 150 CHF
     (exemple) »), et la photo marquée.
2. **m** Le coup d'œil perd « pas trouvée ». Le jeton dit seulement « ? dalle n°3 » (`m2-options`, `m2-decide`,
   `m2-tache`, `m2-resoudre`), alors que CARNET-REPOND-AU-BESOIN demande « ce qui ne l'est pas (fuite sous la dalle) ».
   `m2-sans-ia` le dit juste.
   - Corriger : « ? dalle pas trouvée · n°3 » partout.
3. **m** À l'état Décidé, la prochaine tâche a disparu (`m2-decide`) : on y voit le choix et le pourquoi, mais plus
   « Changer le joint du siphon », gardée à `m2-apres`. Elle ne revient qu'à `m2-tache`.
   - Corriger : une rangée pour la tâche sous « Retenu par toi ».
4. **m** L'erreur n'a pas de repli (`m2-erreur`) : ni jetons « lu par l'app », ni options, alors que le hors-ligne les
   a. L'écran garde aussi deux boutons d'IA, « Réessayer » plein et « Ranger » en bas.
   - Corriger : greffer le bloc « Lu par l'app » de `m2-sans-ia`, et faire comme `m1-erreur` (« Réessayer »
     prend la place de Ranger).
5. **m** Sens métier : le joint est changé le samedi 28, et le carnet est fermé le 29 nov. sur « Trois nettoyages,
   plus de flaque » (`m2-resolu`). Trois lavages de la salle en un jour, puis une fermeture dès le lendemain : c'est
   conclure trop vite.
   - Corriger : dater n8 quelques jours plus tard (M1 ferme le 3 déc.).
6. **m** (critique 2, n° 4) La fiche prend encore 46 % de l'écran (`m2-apres`), 47 % (`m2-options`, `m2-resolu`) et
   44 % (`m2-resoudre`). En `m2-resolu`, la note 8 est coupée au bas.
   - Corriger : replier la fiche en une rangée de jetons, avec l'état, dès qu'il n'y a plus de geste à faire.
- D : la tâche est gardée (`m2-apres`) avant qu'une option soit retenue (`m2-options`). C'est cohérent avec le conseil,
  mais l'ordre peut surprendre.
- D : les options lues hors ligne oublient la dalle (`m2-sans-ia`).
- À garder : « Pourquoi ? Touche tes mots », où la raison est l'une de ses notes et jamais une phrase de l'IA
  (`m2-decide`) ; « Fermé par toi · proposé par l'IA, d'après ta note n°8 », avec Rouvrir ; la relecture qui nomme
  « Retenu / En réserve / ? Pas vérifié / Résultat » (`m2-relire`).

**Le parcours.**

| noter vite | trouvé | pas trouvé | devis | coût | options | décider | tâche | résoudre | relire pourquoi | non-problème | sans IA | annuler |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| trouvé | trouvé | **partiel** (« ? dalle ») | trouvé | trouvé | trouvé | trouvé (sans la tâche) | trouvé | trouvé | trouvé | trouvé (mémo) | trouvé hors ligne, **partiel** en erreur | trouvé |

**Note : lisibilité 7,5 (3 tailles, cartes nettes, mais une fiche lourde), besoin 7,5 (tout le parcours, mais une
suite inventée non marquée, et Décidé sans sa tâche), donc 7,5, et 7 avec le retrait.**
Phrase prédite : « Pas mal, le hors ligne est bien mieux. Mais j'ai jamais écrit "je change le joint samedi" ??? Et la
fiche prend toujours la moitié. »

## M3 · Dans la marge — 6 problèmes (B 1)

**Critique 2 : 11 corrigés sur 13, 2 encore là en partie.**
- Corrigés : « devis : jamais reçu, plus utile » (`m3-resolu`) ; le repli hors ligne est complet (`m3-hors-ligne`) ;
  « Ⓑ coût estimé, / pas le devis » (`m3-options`) ; « dalle pas trouvée (3) » ; « ✓ joint du siphon usé » ; la
  relecture s'ouvre en haut, avec Résolu seul marqué (`m3-relire`) ; l'achat reprend ses 4 états, avec « largeur ? »
  sur A et B (`m3-achat`) ; il reste 3 tailles ; une seule entrée pour les changements ; les jetons sont collés.
- En partie (comptés ci-dessous) : les codes Ⓑ et Ⓒ (n° 5), la colonne serrée (n° 6).

**Nouveaux.**
1. **B** Suite inventée, non marquée, citée comme ses mots. n7 « Je le change samedi. », n8 « Joint changé, 12 CHF la
   pièce. » et n9 « Deux nettoyages, plus de flaque. » sont écrites sur sa page (`m3-tache`, `m3-resoudre`,
   `m3-resolu`), puis citées « tes mots, pas réécrits » (`m3-relire`). La photo et l'achat sont imaginés, sauf n2.
   - Règle : même règle que M2 n° 1.
   - Corriger : « (exemple) » sur chaque ajout.
2. **m** La relecture « Pourquoi « joint, toi-même » » cite n8 et n9 (`m3-relire`), écrites après le choix : le
   résultat y devient une raison de choisir.
   - Corriger : deux blocs, « Ce que tu savais alors » (2, 3, 6, 7) et « Ce qui a marché » (8, 9), comme `m4-relire`.
3. **m** Le jeton de la dalle change de mots d'un état à l'autre : « ? dalle : pas trouvée » (`m3-range`,
   `m3-options`), « ? dalle : à vérifier » (`m3-decide`, `m3-tache`, `m3-resoudre`), puis « ? dalle : jamais vérifiée »
   (`m3-resolu`).
   - Corriger : « ? dalle : pas trouvée, à vérifier » partout ; au résolu, « jamais ouverte ».
4. **m** L'erreur garde les jetons lus par l'app, mais n'a ni options ni tâche (`m3-erreur`), alors que le hors-ligne
   les a.
   - Corriger : greffer le bloc « Lu par l'app » de `m3-hors-ligne`.
5. **m** (critique 2, n° 3) Des codes restent muets dans la marge : « le sanitaire de Ⓑ et Ⓒ » (`m3-options`), et
   « coût de Ⓑ » (`m3-decide`, `m3-tache`, `m3-resoudre`, `m3-resolu`), sans nom.
   - Corriger : « coût du sanitaire, estimé ».
6. **m** (critique 2, n° 13) Ses notes restent serrées : 232 px de large, la note 1 sur 3 lignes, et « usé » seul
   sur sa ligne (`m3-note`, `m3-range`). C'est le « difficile à lire » du 16.11.
   - Corriger : réduire la marge à 120 px quand elle est vide (`m3-note`), et couper la note 2 avant « joint ».
- D : « coût de Ⓑ estimé, évité » (`m3-decide`, `m3-resolu`) relie 150 CHF au sanitaire. M2 pose la question
  (« pour lui ? »), M3 l'affirme.
- D : un fermenteur conique inox de 30 L à 289 CHF est bas, mais plausible avec son « ? ».
- À garder : le seul « coût réel : 12 CHF » du parcours ; « Rouvrir si la flaque revient » (`m3-resolu`) ; la marge
  du hors-ligne, en gris « lu par l'app », avec « Annuler l'envoi » sur la ligne en file (`m3-hors-ligne`).

**Le parcours.**

| noter vite | trouvé | pas trouvé | devis | coût | options | décider | tâche | résoudre | relire pourquoi | non-problème | sans IA | annuler |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| trouvé | trouvé | trouvé (mots variables) | trouvé | trouvé (et coût réel) | trouvé | trouvé | trouvé | trouvé | trouvé (raison mêlée au résultat) | trouvé (achat) | trouvé hors ligne, **partiel** en erreur | trouvé |

**Note : lisibilité 7 (3 tailles, mais une colonne de 232 px et des codes Ⓑ restants), besoin 8 (tout le parcours,
coût réel, mais une suite inventée non marquée), donc 7, et 6,5 avec le retrait.**
Phrase prédite : « La marge j'aime bien, le pourquoi avec mes mots. Mais c'est toujours serré à lire, et c'est quoi
coût de B ? »

## M4 · Deux vues — 4 problèmes (B 1)

**Critique 2 : 7 corrigés sur 7.**
Les explications au repos sont parties (`m4-noter`, `m4-notes-lues`). La revue se fait par cases posées à leur place,
avec « Tout garder » (`m4-range`). Les « Retenir » en réserve ont un contour normal (`m4-decide`). L'étiquette dit
« si la flaque reste ». Le chemin est daté à chaque pas (`m4-resolu`). Le repli sans IA montre jetons et réserve
(`m4-sans-ia`). « Te resservira pour » est retiré du mémo (`m4-memo`).

**Nouveaux.**
1. **B** Suite inventée, non marquée, et attribuée à lui. n7 « Je change le joint moi-même samedi, c'est quelques
   francs. » est citée « tes mots · note 7 » (`m4-relire`) et « ta raison » (`m4-decide`). n8 « Joint changé. » et n9
   « Plus de flaque après 2 nettoyages. » ne sont pas marquées (`m4-tache`, `m4-sans-ia`, `m4-resoudre`). La photo est
   légendée « ta photo · 21:26 » (`m4-noter`, `m4-notes-lues`), alors que son fil n'a aucune photo.
   - Règle : même règle que M2 n° 1.
   - Corriger : « (exemple) » sur chaque ajout, et « photo (exemple) ».
2. **m** Le coup d'œil perd « pas trouvée », une régression. La carte dit « Sous la dalle · à vérifier · note 3 »
   (`m4-range`, `m4-options`, `m4-erreur`), et le jeton « ? dalle à vérifier · note 3 » (`m4-sans-ia`,
   `m4-resoudre`). À critique 2, M4 disait « cherché, pas trouvé · 3 », le meilleur des quatre. Seule la relecture
   garde « « pas trouvée », à vérifier » (`m4-relire`).
   - Corriger : « Sous la dalle · « pas trouvée » · à vérifier · note 3 ».
3. **m** Les comptes ne concordent pas : `m4-range` annonce « 3 à garder » pour 4 cases (l'état, les options, la tâche
   et le plan B), et la feuille compte 5 changements (`m4-annuler`).
   - Corriger : un seul compte, celui des cases.
4. **m** L'erreur garde deux boutons d'IA, « Réessayer » plein en haut et « Ranger » en bas (`m4-erreur`).
   - Corriger : comme `m1-erreur`, « Réessayer » prend la place de Ranger.
- D : la tâche faite est barrée (`m4-sans-ia`, `m4-resoudre`). C'est la convention des listes, mais le barré se lit
  aussi « effacé » ; le vert seul suffirait.
- D : le chemin date « Je cherche » du 24 nov. à 21:27 (`m4-resolu`), alors que son vrai fil le pose le 25 nov.
  à 12:22, de sa main.
- D : la tâche est gardée avant qu'une option soit retenue (`m4-options`). Ce doute vient de critique 2, et il reste.
- À garder : « Pourquoi tu as pris ça / Ce que tu savais alors / Pas retenu / Si ça revient » (`m4-relire`), la
  meilleure relecture des quatre ; le conseil de `m4-tache` (« Au prochain nettoyage, regarde si la flaque revient,
  et note-le »), qui ferme la boucle ; « Ne plus attendre le devis ? » au résolu ; le hors-ligne, qui lit sa note 9
  et diffère « Résolu ? » sans rien poser.

**Le parcours.**

| noter vite | trouvé | pas trouvé | devis | coût | options | décider | tâche | résoudre | relire pourquoi | non-problème | sans IA | annuler |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| trouvé | trouvé | **partiel** (« à vérifier » seul) | trouvé | trouvé (+ Noter) | trouvé | trouvé | trouvé (date de n7, Cocher d'après n8) | trouvé | trouvé (le meilleur) | trouvé (mémo) | trouvé | trouvé |

**Note : lisibilité 8,5 (3 tailles, cartes nettes, un plein, plus d'explications), besoin 8 (tout le parcours et
les deux vues, mais une suite inventée dite « tes mots »), donc 8, et 7,5 avec le retrait.**
Phrase prédite : « Vachement bien, c'est ça les 2 vues, le pourquoi tu as pris ça très bien. Mais ta photo et ma
note 7, je les ai jamais faites ??? »

## Classement

1. **M4** (7,5) : son idée des deux vues, la relecture la plus forte et un conseil qui ferme la boucle. Il reste la
   suite inventée dite « tes mots », et « pas trouvée » perdu.
2. **M1** (7,5) : la plus nette, sans bloquant, avec la meilleure vue d'ensemble et le meilleur repli. Le plan B est
   mal placé dans la tâche.
3. **M2** (7) : le pourquoi par ses mots et un repli enfin complet, mais une fiche lourde, Décidé sans sa tâche, et
   une suite inventée.
4. **M3** (6,5) : le coût réel et une marge honnête, mais une lecture serrée, des codes Ⓑ, et une raison mêlée au
   résultat.

La passe a progressé : 37 problèmes à la critique 2 (4 B), 20 à la critique 3 (3 B). Aucun problème de critique 2
n'est rejoué en entier : 34 sont corrigés et 3 restent en partie. Les 3 B sont un seul défaut, le même dans trois
maquettes, et il se corrige sans toucher au dessin. Ce n'est pas encore satisfaisant : 3 B, et chaque phrase prédite
a encore son « mais ».

## Greffes pour la correction 3

| Idée | Origine | Reçoit |
|---|---|---|
| « (exemple) » sur toute note ajoutée au fil réel, comme la fixture | M1 (`m1-decide`) | M2, M3, M4, et la relecture de M1 |
| « dalle pas trouvée · ? à vérifier · n3 » au coup d'œil | M1 (`m1-apres`) | M2, M3, M4 |
| L'erreur garde le repli « Lu par l'app », et « Réessayer » remplace Ranger | M1 (`m1-erreur`) | M2, M3, M4 |
| « Ce que tu savais alors », séparé de « Ce qui a marché » | M4 (`m4-relire`) | M3 |
| Le plan B en ligne pointillée, hors de la carte de la tâche | M4 (`m4-options`) | M1 |
| « Au prochain nettoyage, regarde si la flaque revient » : un conseil qui ferme la boucle | M4 (`m4-tache`) | M1, M2, M3 |
| Une case pour accepter l'état proposé, dans la frise | M4 (`m4-range`) | M1 |

## Retouches communes

- Toute note, photo ou lien absent du fil réel porte « (exemple) », dans tous les états, relecture comprise.
- « pas trouvée » reste visible au coup d'œil, à côté de « ? à vérifier ».
- L'état erreur garde le même repli que l'état hors ligne.
- Un seul compte par écran : propositions, cases et feuille disent le même nombre.

LEÇON PROPOSÉE : une maquette bâtie sur son vrai fil, qu'on prolonge pour montrer le parcours (notes, photo, lien),
marque chaque ajout « (exemple) » dans tous les états, comme la fixture. Avant de juger, le critique compare les notes
affichées au fil réel (`tests/fixtures/…`). Critique 2 avait cité « de ta note n°7 : Samedi » parmi les choses à
garder, alors que n7 n'existe pas.
