# Critique 4, jugement final : « un carnet, pas un chat » (25.11, après la correction 3)

Juge : Opus, calibré sur PORTRAIT.md v2 (§ 7 : note = min(lisibilité, besoin), puis − 0,5).
Lu : ITERATIONS.md (« Fin »), CORRECTION-3.md, critique-3.md, `corrections/c3-m1..m4.md`, la fixture
`tests/fixtures/c79/zz-ecoulement-qui-fuit.json` (titre et 6 notes, toutes le 24 nov. à 21:26 ; `photos: []` ; aucun lien ;
« Je cherche » posé par lui le 25 nov. à 12:22 UTC, soit 13:22 à l'heure suisse ; aucune décision).
Captures ouvertes : les 53 états distincts de `cap/` (m1 : 13, m2 : 13, m3 : 13, m4 : 14). Les alias ont l'empreinte de
leur état : `m1-avant` = `m1-note`, `m1-apres` = `m1-cherche`, `m1-annuler` = `m1-change`, `m3-avant` = `m3-note`,
`m3-apres` = `m3-range`, `m4-avant` = `m4-noter`, `m4-apres` = `m4-range`. Les tailles de texte (M1 et M3 : 14, 16 et 24 ;
M2 et M4 : 14, 16 et 20) et les cibles de 44 px sont celles que les concepteurs ont mesurées. Je ne les ai pas remesurées ;
les captures ne les contredisent pas.
Règle n° 1 : aucun écran Carnet n'est choisi dans `choix/ecrans.json`.

Légende : **B** = bloquant (valeur fausse, élément de sa demande absent, refus explicite rejoué, geste sans effet).
**m** = mineur. **D** = doute, non compté.

## M1 · Le carnet se range : 2 problèmes (B 0)

**Critique 3 : 4 corrigés sur 4.**
1. Les ajouts sont marqués par un n° en pointillé jaune (7 à 10), et un bandeau couvre chaque état. La relecture ne dit
   plus « tes mots » pour n9 et n10 : elle les cite comme « la note du choix, citée telle quelle » (`m1-relire`). La photo
   et le lien sont marqués.
2. La note 4 est sortie de la carte de la tâche, dans un cadre pointillé « Si la flaque reste » (`m1-cherche-bas`,
   `m1-decide`).
3. « Je cherche ? » a sa case dans la frise (`m1-apres`) et sa ligne sous « Proposé, pas posé » dans la feuille
   (`m1-annuler`).
4. Le jeton « 1 offre » de l'achat est en contour (`m1-achat`).

S'y ajoutent les corrections reçues des personas. Le hors-ligne est daté « vue de l'IA · 24 nov. 21:31 », avec la note 9
« pas encore lue » et « rien à marquer » (`m1-hors-ligne`). En erreur, le repli se réduit à « n3 · pas trouvée » et
« n6 · 150 CHF » (`m1-erreur`). La feuille « Par l'IA · 7 » égale la puce « 7 par l'IA » (`m1-annuler`). Le chemin suit le
carnet réel : « Je cherche 25 nov., par toi » (`m1-relire`).

**Nouveaux.**
1. **m** Valeur mal rangée : l'estimation reste sous « Coût » au-dessus de la tâche choisie. À `m1-tache`, `m1-resoudre`
   et `m1-resolu`, on lit « 6 Estimation 150 CHF (exemple). · estimé » juste au-dessus de « Coût réel : pas noté ». Or
   l'option retenue est ① (« une pièce : quelques francs »), et l'estimation porte sur ② (« n6, pour lui ? », `m1-apres`).
   D'un coup d'œil, on croit que le joint était estimé à 150 CHF.
   - Corriger : dès Décidé, ranger n6 sous ② en réserve, ou la marquer « estimé, pour le sanitaire ? ». Au résolu, écrire
     « plus utile », comme M3.
2. **m** La ligne du plan B est cassée. Le lien `entreprise-x.ch · 8`, posé dans la phrase, rejette « sanitaire. » sur une
   ligne de 64 px de haut, avec un grand blanc (`m1-cherche-bas`, `m1-decide`, `m1-tache`).
   - Corriger : poser le lien sous la note, sur sa propre ligne, comme en `m1-attente`.
- D : un n° en pointillé ne dit pas « imaginée » à côté de la note. Il faut lire le bandeau pour comprendre ⑨ en
  `m1-decide`, alors que M2, M3 et M4 écrivent le mot (voir Écarts).
- D : en `m1-decide` et en `m1-resoudre`, les propositions de l'IA sont cochées d'avance ; M4 les laisse vides.
- D : le hors-ligne perd le jeton « 150 CHF estimé » de la vue de l'IA (`m1-hors-ligne`).
- D : « L'IA lit tes 8 notes » compte la photo et le lien imaginés parmi « tes » notes (`m1-attente`).

**Le parcours.**

| noter vite | trouvé | pas trouvé | devis | coût | options | décider | tâche | résoudre | relire pourquoi | non-problème | sans IA | annuler |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| trouvé | trouvé | trouvé | trouvé | trouvé (estimation mal rangée) | trouvé | trouvé | trouvé (+ conseil qui ferme la boucle) | trouvé | trouvé (savais alors / a marché, chemin réel) | trouvé (achat) | trouvé (hors ligne et erreur, honnêtes) | trouvé |

**Note : lisibilité 8,5 (3 tailles, jetons collés, un seul plein noir, plan B sorti de la tâche), besoin 9 (tout le
parcours, honnête hors ligne, chemin réel, une estimation mal rangée), donc 8,5, et 8 avec le retrait.**
Phrase prédite : « Là c'est clair, tout est rangé, et la dalle pas trouvée c'est juste. Le 150 CHF sous le coût du
joint, par contre, c'est pas ça. »
**Verdict pour la page :** meilleure vue d'ensemble (jetons collés) et repli honnête ; reste : l'estimation 150 CHF rangée sous le coût du joint.

## M2 · La fiche au-dessus : 3 problèmes (B 0)

**Critique 3 : 6 corrigés sur 6.**
1. B levé. Un bandeau jaune « Suite imaginée pour la maquette : notes 7 et 8 » coiffe les états concernés. Un filet
   « imaginé pour la maquette » les sépare dans Mes notes, avec « note imaginée · 25 nov. / 3 déc. » (`m2-tache`,
   `m2-resolu`, `m2-relire`). La photo est retirée, le lien porte « lien imaginé » (`m2-apres`), et le mémo est marqué
   (`m2-memo`).
2. Le jeton dit « ? dalle pas trouvée · à vérifier n°3 » dans tous les états.
3. Décidé garde sa tâche (`m2-decide`).
4. L'erreur a le même repli que le hors-ligne, et « Réessayer » est le seul plein (`m2-erreur`).
5. n8 est datée du 3 déc., et le carnet est fermé le 3 déc. (`m2-resolu`).
6. La fiche est repliée au résolu, à 31 % de l'écran (`m2-resolu`). Elle reste à environ 40 % dans les états du milieu
   (`m2-apres`, `m2-options`), mais ses notes sont toutes visibles.

**Nouveaux.**
1. **m** La décision imaginée n'est pas marquée. `m2-decide` montre « Décidé · toi, 25 nov. », « Retenu » et « Ta raison
   … n°2, touchée par toi », sans bandeau ; le bandeau n'apparaît qu'avec la note 7 (`m2-tache`). Son carnet réel
   s'arrête à « Je cherche ». M1 (« tout après le 25 nov. »), M3 (« la décision ») et M4 marquent cet état.
   - Règle : CORRECTION-3, commun 1 (« tout ce qui n'y est pas … porte une marque visible »).
   - Corriger : « Suite imaginée pour la maquette : la décision » sur `m2-decide`, et « la décision » ajoutée aux
     bandeaux suivants.
2. **m** Le conseil qui ferme la boucle est devenu télégraphique : « prochain nettoyage · flaque revenue ? entreprise X
   n°4 » (`m2-tache`), une pastille et des mots sans verbe. M1, M3 et M4 l'écrivent en une phrase.
   - Corriger : « Au prochain nettoyage, regarde si la flaque revient ; sinon, l'entreprise X n°4. »
3. **m** En `m2-decide`, la liste « Mes notes » se décale. Les numéros sont centrés en hauteur (n1 entre ses deux
   lignes), et les rangées n3 à n6 ont des blancs inégaux. Les autres états n'ont pas ce défaut.
   - Corriger : reprendre la rangée de `m2-options`, numéro en haut.
- D : « Je cherche » et la tâche sont proposés et cochés d'avance au rangement, avant qu'une option soit retenue
  (`m2-apres`). Ce doute vient des critiques 2 et 3.
- D : la relecture n'a pas de chemin daté (Noté → Je cherche → Décidé → Résolu), seulement « Retenu 25 nov. » et
  « fermé le 3 déc. » (`m2-relire`).
- D : le texte d'attente du champ est coupé, « Une mini … » (`m2-erreur`).

**Le parcours.**

| noter vite | trouvé | pas trouvé | devis | coût | options | décider | tâche | résoudre | relire pourquoi | non-problème | sans IA | annuler |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| trouvé | trouvé | trouvé | trouvé | trouvé (+ Noter) | trouvé | trouvé (non marqué imaginé) | trouvé | trouvé | trouvé (sans chemin daté) | trouvé (mémo) | trouvé (hors ligne et erreur, honnêtes) | trouvé (lignes verrouillées si le retour est faux) |

**Note : lisibilité 8 (3 tailles, cartes nettes, fiche plus légère mais encore à 40 % au milieu), besoin 8,5 (tout le
parcours, feuille sans retour faux, décision imaginée non marquée), donc 8, et 7,5 avec le retrait.**
Phrase prédite : « Mes notes restent comme je les ai écrites, ça j'aime bien. Mais la fiche prend encore pas mal de
place. »
**Verdict pour la page :** ses notes intactes, la raison touchée parmi elles ; reste : une fiche encore lourde et une décision imaginée non marquée.

## M3 · Dans la marge : 3 problèmes (B 0)

**Critique 3 : 5 corrigés sur 6, 1 encore là en partie.**
- Corrigés :
  1. B levé : bandeau sarcelle et étiquette « imaginée » sur chaque ajout ; la relecture ne dit plus « tes mots »
     (`m3-relire`).
  2. La raison est séparée du résultat : « tu savais alors » (n3, n6), puis « ce qui a marché » (n8, n9) (`m3-relire`).
  3. La dalle dit « ? dalle pas trouvée, à vérifier », puis « jamais ouverte » au résolu.
  4. L'erreur a un repli honnête (`m3-erreur`).
  5. La marge nomme chaque lettre : « B joint, sanitaire », « une estimation, pour le sanitaire ? » (`m3-options`).
- En partie (compté ci-dessous, n° 3) : la colonne serrée.

**Nouveaux.**
1. **m** L'erreur appelle « coût » une estimation. On y lit « coût 150 CHF · n°6 » en jeton et en marge (`m3-erreur`),
   alors que la note dit « Estimation » et que la lecture locale ne sait poser qu'un montant. M1, M2 et M4 écrivent
   « 150 CHF ». C'est la lecture en coût ferme que M2 verrouille dans sa feuille.
   - Corriger : « 150 CHF · n°6 ».
2. **m** La relecture est ouverte par « siphon », mais le mot n'est pas surligné dans la n2 (`m3-relire`). La greffe est
   faite en M1, M2 et M4.
   - Corriger : surligner « siphon ».
3. **m** (critique 3, n° 6) La lecture est encore longue. La note 1 tient sur 3 lignes et « Pistes : » reste seul sur sa
   ligne. Avec les lignes réglées de 28 px, ses 6 notes occupent 13 lignes (`m3-note`, `m3-range`, `m3-relire`,
   `m3-erreur`). Le pourquoi de la relecture se lit en zigzag dans la marge (« ✓ ta raison / A joint, toi-même / tu savais
   alors / B … / C … »). Le jeton du haut le dit en 3 secondes ; la marge, non.
   - Corriger : « Pistes : joint du siphon trouvé usé » sur une ligne de 252 px, où il tient. En relecture, un renvoi
     « pourquoi » d'une ligne sous les jetons.
- D : le bandeau du hors-ligne dit « notes 7 et 8 » et oublie la décision, qu'il marquait en `m3-decide`
  (`m3-hors-ligne`).
- D : la feuille ne dit pas ce que devient la ligne « 150 CHF : une estimation » une fois décochée (`m3-annuler`). M1 dit
  « défait : tes mots seuls ».
- D : la frise n'a aucune date, et la relecture n'a pas de chemin daté (`m3-relire`).

**Le parcours.**

| noter vite | trouvé | pas trouvé | devis | coût | options | décider | tâche | résoudre | relire pourquoi | non-problème | sans IA | annuler |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| trouvé | trouvé | trouvé | trouvé | trouvé (et coût réel 12 CHF) | trouvé | trouvé | trouvé (+ conseil) | trouvé | trouvé (dans la marge, en zigzag) | trouvé (achat) | trouvé (« coût » en trop en erreur) | trouvé |

**Note : lisibilité 7,5 (3 tailles, marge nommée, mais une lecture longue et une marge à déchiffrer), besoin 8,5 (tout le
parcours, le seul coût réel, hors ligne honnête), donc 7,5, et 7 avec le retrait.**
Phrase prédite : « La marge avec le coût réel j'aime bien. Mais c'est long à lire, faut aller chercher le pourquoi dans
la colonne. »
**Verdict pour la page :** seule à noter le coût réel, pourquoi lu en face de ses lignes ; reste : lecture longue, marge à déchiffrer.

## M4 · Deux vues : 1 problème (B 0)

**Critique 3 : 4 corrigés sur 4.**
1. B levé : photo retirée, « lien imaginé », étiquette « imaginée » sur n7 à n9, bandeau sur chaque état qui en dépend ;
   plus aucun « tes mots » ni « ta raison » sur un ajout (`m4-decide`, `m4-relire`).
2. « Sous la dalle · « pas trouvée » · à vérifier · note 3 » (`m4-range`, `m4-options`).
3. Un seul compte : « 2 à garder », 2 cases vides, « Garder 1 sur 2 » (`m4-range`, `m4-annuler`).
4. « Réessayer » prend la place de Ranger (`m4-erreur`).

En plus, le chemin suit le carnet réel : « 25 nov. 13:22 · Je cherche, par toi », puis les pas imaginés en pointillé
(`m4-options`, `m4-resolu`). Le barré a disparu. Le hors-ligne garde la dernière vue datée de l'IA (`m4-sans-ia`).

**Nouveaux.**
1. **m** La marque « imaginée » manque sur trois citations, alors que M4 la pose partout ailleurs : « « samedi » note 7 »
   (`m4-tache`), « cochée le 28 nov. · note 8 » (`m4-sans-ia`, `m4-resoudre`), « pas eu besoin : plus de flaque · note 9 »
   (`m4-relire`). Le bandeau les couvre, mais la règle que M4 s'est donnée (une étiquette par citation) n'est pas tenue.
   - Corriger : l'étiquette « imaginée » sur ces trois renvois.
- D : il ferme le 30 nov. à 09:13, après « 2 nettoyages » depuis le samedi 28 (`m4-resolu`). C'est possible sur un
  week-end de brassage, mais court ; M1 et M2 ferment le 3 déc.
- D : « Pourquoi tu as pris ça » cite n7, qui dit ce qu'il fera et non pourquoi ; la vraie raison (n2) est rangée sous
  « Ce que tu savais alors » (`m4-relire`).
- D : « Oui » (Ne plus attendre le devis) est en contour violet, la couleur de l'IA, alors que c'est son geste
  (`m4-resolu`).

**Le parcours.**

| noter vite | trouvé | pas trouvé | devis | coût | options | décider | tâche | résoudre | relire pourquoi | non-problème | sans IA | annuler |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| trouvé | trouvé | trouvé | trouvé (+ Ne plus attendre ?) | trouvé (+ Noter) | trouvé | trouvé | trouvé (+ conseil) | trouvé | trouvé (le meilleur, chemin daté) | trouvé (mémo) | trouvé (erreur et hors ligne) | trouvé |

**Note : lisibilité 8,5 (3 tailles, cartes nettes, un plein, deux vues sans mélange), besoin 9 (tout le parcours, fidèle
au carnet réel jusqu'à l'heure, honnête sans IA), donc 8,5, et 8 avec le retrait.**
Phrase prédite : « Vachement bien, c'est ça les 2 vues, et le chemin avec les dates c'est top. »
**Verdict pour la page :** deux vues, chemin daté fidèle au carnet, meilleure relecture ; reste : la marque « imaginée » manque sur trois citations.

## Écarts de règle entre maquettes

| Règle | M1 | M2 | M3 | M4 |
|---|---|---|---|---|
| Couleur du bouton plein | noir `#222` | encre noire | noir | noir `rgb(20,20,20)` |
| Place du bouton plein | à gauche, « Non » à droite | à gauche | à gauche | **à droite** (Garder, Cocher, Résolu, Relier) |
| Cases des propositions | cochées d'avance | cochées d'avance | pas de case (boutons) | vides |
| Marque « imaginé » : forme | n° en pointillé **jaune**, sans le mot ; bandeau jaune | bandeau **jaune**, filet, « note imaginée · date » | étiquette « imaginée » **sarcelle** en pointillé ; bandeau sarcelle | étiquette « imaginée » **gris ardoise** en pointillé ; bandeau gris |
| Marque « imaginé » : portée | notes, photo, lien, et « tout après le 25 nov. » (états compris) | notes, lien, mémo ; **pas la décision** | notes, photo, lien, décision (sauf hors ligne) | notes, lien, photo du mémo, pas du chemin ; **3 citations sans étiquette** |
| Compteur des changements | cumulé « N par l'IA » (7, 9, 12) | par passe « revoir · N » (6, 1, 1, 2) | cumulé « Changé · N » (5 à 10) | sans nombre, « Changements » |
| Pointillé veut dire | proposé (violet), imaginé (jaune), plan B et « Lu par l'app » (gris) | proposé, seulement | proposé (violet), imaginé (sarcelle), lu par l'app (gris) | proposé (violet), imaginé (gris), « Si ça revient », reste à proposer |
| Lecture locale de n6 | « n6 · 150 CHF » | « 150 CHF » | « **coût** 150 CHF » | « 150 CHF » |
| Dalle au coup d'œil | « pas trouvée » et « ? à vérifier » | idem | idem | idem |

Le plein est noir partout : la règle de la correction 3 est tenue. Sa place, elle, n'est pas réglée, M4 le mettant à
droite. La marque « imaginé » est appliquée par les quatre, mais selon quatre systèmes : quatre couleurs, avec ou sans le
mot, et des portées différentes. Pour une seule règle à porter dans l'app : une étiquette « imaginée » au mot près de
chaque citation, d'une seule couleur, plus un bandeau qui nomme tout ce qui est imaginé (notes, photo, lien, décision,
états).

## Classement final

1. **M4** (8) : les deux vues, la relecture la plus forte et le seul chemin fidèle à l'heure près. Il ne reste qu'une
   marque oubliée sur trois renvois.
2. **M1** (8) : la meilleure vue d'ensemble et le repli le plus complet. L'estimation est rangée sous le coût de la
   tâche choisie.
3. **M2** (7,5) : ses notes jamais touchées, la raison touchée parmi elles, et une feuille sans retour faux. La fiche
   reste lourde au milieu, et la décision n'est pas marquée.
4. **M3** (7) : le seul coût réel et une marge honnête. Elle reste longue à lire, et le pourquoi est à déchiffrer.

La passe a progressé : 37 problèmes (4 B) à la critique 2, 20 (3 B) à la critique 3, et 9 (0 B) à la critique 4. Les 20
problèmes de la critique 3 sont corrigés, sauf un, en partie (M3, colonne serrée). C'est satisfaisant au sens de
l'entonnoir : aucun B, et une phrase prédite positive pour chaque maquette. M2 et M3 gardent un « mais » de lisibilité.

## Retouches communes, si une passe 5 a lieu

- Une seule marque « imaginée », une couleur, le mot à chaque citation, et un bandeau qui nomme aussi la décision et les
  états.
- La place du bouton plein (à gauche ou à droite) fixée pour toutes, et aucune proposition cochée d'avance (M4).
- Un seul compteur : celui de la dernière passe (M2), égal au nombre de lignes de la feuille.
- La lecture locale n'écrit que le montant (« 150 CHF »), jamais « coût ».

LEÇON PROPOSÉE : une règle commune à plusieurs maquettes fixe sa forme exacte (mot, couleur, place, portée), pas
seulement son intention. Le commun « marque visible et distincte » de la correction 3 a donné quatre marques « imaginé »,
trois compteurs et deux places du bouton plein.
