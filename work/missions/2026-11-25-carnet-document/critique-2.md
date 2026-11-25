# Critique 2 — « un carnet, pas un chat » (25.11, après la correction 1)

Juge : Opus, calibré sur PORTRAIT.md v2 (§ 7 : note = min(lisibilité, besoin), puis − 0,5).
Lu : ITERATIONS.md, DOSSIER.md, CORRECTION-1.md, RESULTAT.md, critique-1.md, la fixture
`tests/fixtures/c79/zz-ecoulement-qui-fuit.json`, DEFAUTS-RECURRENTS § CARNET-REPOND-AU-BESOIN, CARNET-COHERENT,
CARNET-LISTE-COMPACTE, CHAMP-CARNET-REPLIE, NOTE-PAS-ARTICLE.
Captures ouvertes : les 45 de `cap/m1..m4-*.png` (m1 : 13, m2 : 9, m3 : 11, m4 : 13). Tailles de police relevées dans
les 4 HTML (`font-size`), chasse fixe cherchée (`monospace`, `Courier`, `Plex Mono` : aucune).
Règle n° 1 : `choix/ecrans.json` n'a aucun écran Carnet choisi. Références : ses paroles (champ toujours visible,
v01 passe 3 : jetons, options, tâche proposée) et ses 4 états du coup d'œil (D451).

Légende : **B** = bloquant (valeur fausse, élément de sa demande absent, refus explicite rejoué, geste sans effet).
**m** = mineur. **D** = doute, non compté.

## Captures périmées (à dire avant tout)

- `m1-avant`, `m1-apres`, `m1-annuler` : copies exactes (même empreinte) de `m1-note`, `m1-cherche`, `m1-change`.
  Elles correspondent au HTML.
- `m2-avant`, `m2-apres`, `m2-annuler` : refaites à 17:42, conformes au HTML.
- **`m3-avant`, `m3-apres`, `m4-avant`, `m4-apres` : v0 de 17:11, ne correspondent plus au HTML.** On y voit encore
  « À venir ven. », « devis ? », le champ sur deux rangées (M3), les horodatages en Courier, « 150 CHF » en chasse fixe,
  le titre redit en 1re note, la barre noire « Estimé » et Organisé sans champ (M4).
- **B (page, hors compte des maquettes)** : `page.html` cite ces quatre captures. Le brasseur verrait sur la page de
  choix des refus déjà corrigés (CARNET-COHERENT : chasse fixe, titre redit). Corriger à l'assemblage :
  `m3-avant` ← `m3-note`, `m3-apres` ← `m3-range`, `m4-avant` ← `m4-noter`, `m4-apres` ← `m4-options`.

## M1 · Le carnet se range — 9 problèmes (B 1)

**Critique 1 : 10 corrigés sur 10.**
Options avec Retenir (`m1-cherche`) ; la tâche « Changer le joint du siphon » suit le conseil, et X devient « seulement
si la flaque reste » ; tout le parcours est là ; plus de chasse fixe (14/16/24 px, chiffres tabulaires) ; ses lignes
sont déplacées, jamais réécrites ; la feuille case par case (`m1-change`) ; « < Carnets » est revenu ; un seul mot
pour le devis ; numéros de note ; la photo est au constat, le lien sur la tâche.

**Nouveaux.**
1. **B** La dalle perd son « pas trouvé ». Sa note 3 dit « fuite sous la dalle, pas trouvée » : il a cherché, il n'a
   pas trouvé. L'IA en fait « ? à situer » et ne propose que « Écartée » ou « Pas encore cherchée » (`m1-cherche`,
   `m1-cherche-bas`). La suite affiche « pas cherchée » (`m1-decide`), et la relecture « La dalle, jamais cherchée »
   (`m1-relire`). Le repli montre même « ? dalle pas trouvée » (`m1-hors-ligne`). Ses mots sont contredits ; c'est
   aussi le jeton « pas trouvé » que CARNET-REPOND-AU-BESOIN attend (« ce qui ne l'est pas (fuite sous la dalle) »).
   - Corriger : jeton « ✗ pas trouvé · n3 » hachuré, sans question, comme `m4-options` (« cherché, pas trouvé · 3 »).
     Relecture : « la dalle : cherchée, pas trouvée, jamais ouverte ».
2. **m** Ni jetons en tête ni coût visible au premier écran : trouvé et « à situer » sont épars sur les lignes, et Coût
   et Devis tombent sous le pli (`m1-cherche` → `m1-cherche-bas`). La vue d'ensemble en 3 secondes manque.
   - Corriger : une ligne de jetons sous la frise, greffée de M2 ou M3.
3. **m** La bande du bas a deux rangées en permanence : « Rangé à 21:31 · 7 changements | Voir, défaire » au-dessus du
   champ, soit environ 100 px CSS (`m1-cherche`, `m1-decide`, `m1-relire`, `m1-achat`). CHAMP-CARNET-REPLIE et
   CARNET-COHERENT veulent une seule ligne collée en bas.
   - Corriger : « Changements » en haut, sous le titre, comme M4.
4. **m** La ligne « Local · Problème · 24 nov. » disparaît dès Je cherche (`m1-cherche`, `m1-decide`, `m1-resolu`).
   - Corriger : la garder dans tous les états.
5. **m** « Options écartées : Sanitaire pour la dalle · si la flaque reste » (`m1-decide`) : une option en réserve est
   rangée dans les écartées.
   - Corriger : « En réserve, si la flaque reste ».
6. **m** La photo du constat disparaît en Décidé (`m1-decide`), et les numéros sautent de n8 à n10 : n9 n'existe nulle
   part, alors que la relecture dit « Mes 11 notes » (`m1-relire`).
   - Corriger : garder la photo au constat, et numéroter sans trou.
7. **m** « Retirer « Contacter l'entreprise X » (n4) » (`m1-resolu`) : on ne sait pas s'il faut retirer sa note ou la
   tâche. Ses mots ne s'effacent jamais.
   - Corriger : « n4 : n'a pas servi ».
8. **m** Achat : la frise devient « Noté / Je compare / Choisi / Reçu » (`m1-achat`). Ses 4 états du coup d'œil (je
   cherche, décidés, notés, résolus) sont son choix (D451, CARNET-LISTE-COMPACTE « Garder ses choix ») ; avec d'autres
   mots, la liste ne sait plus où ranger ce carnet.
   - Corriger : ses 4 états, avec le mot d'achat en sous-titre (« Je cherche · 1 offre »).
9. **m** `m1-cherche` : la carte « Garder la tâche » est coupée par la bande du bas, et le geste principal est sous le
   pli au premier écran. Le n° 3 le corrige.
- D : en Achat, « 349 CHF · lu sur la page » et « robinet : pas dit sur la page » sont très honnêtes. À garder.
- À garder : le repli hors ligne le plus complet des quatre (`m1-hors-ligne` : jetons, options lues, « Tâche ? Garder /
  Non », 2 notes en file). La relecture « Le problème / Ce qui a marché / Pourquoi / Écarté / Coût réel : pas noté /
  Chemin daté » (`m1-relire`).

**Le parcours.**

| noter vite | trouvé | pas trouvé | devis | coût | options | décider | tâche | résoudre | relire pourquoi | non-problème | sans IA | annuler |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| trouvé (clavier, Coller) | trouvé | **faux** (« jamais cherchée ») | trouvé (sous le pli) | trouvé | trouvé | trouvé | trouvé | trouvé (proposé) | trouvé | trouvé (achat) | trouvé (le meilleur) | trouvé |

**Note : lisibilité 7,5 (3 tailles, 14 px au moins, mais bande double et coût sous le pli), besoin 7,5 (tout le
parcours, une valeur fausse), donc 7,5, et 7 avec le retrait.**
Phrase prédite : « Vachement mieux, les options et la tâche c'est ça. Mais la dalle j'ai écrit pas trouvée, pas jamais
cherchée ??? »

## M2 · La fiche au-dessus — 8 problèmes (B 1)

**Critique 1 : 9 corrigés sur 10, 1 en partie.**
- Corrigés : options (`m2-options`) ; conseil et tâche cohérents, X « si la flaque revient » (`m2-apres`) ; parcours
  entier ; titre plus redit ; plus de chasse fixe ; champ d'une ligne, Coller en puce dans le champ ; devis dit une
  fois ; plus de « nouveau » ; photo et lien posés (`m2-decide`).
- En partie : la fiche prend encore 47 % de l'écran (`m2-apres`), 53 % (`m2-options`) et 51 % (`m2-decide`). Ses notes
  restent visibles, mais seulement parce que le cas est court (voir n° 4).

**Nouveaux.**
1. **B** Le repli sans IA ne répond pas au besoin (`m2-sans-ia`) : « Pistes : joint · dalle » mêle trouvé et pas
   trouvé, sans option ni prochaine tâche, et l'écran le dit (« sans conseil ni option »). CARNET-REPOND-AU-BESOIN exige,
   lus par l'app, les jetons trouvé / pas trouvé / devis / coût, les options et la prochaine tâche.
   - Corriger : greffer le repli de M1 (`m1-hors-ligne`) : ✓ joint · n°2, ✗ dalle · n°3, options lues dans ses notes,
     « Tâche ? Changer le joint du siphon », Garder / Non.
2. **m** « Coût 150 CHF » dans le repli (`m2-sans-ia`), alors que son mot est « Estimation » : l'inconnu se présente en
   coût (PORTRAIT § 3, honnêteté).
   - Corriger : « 150 CHF estimé ».
3. **m** Texte explicatif au repos : « Pas encore rangée. Touche Ranger : l'IA tire de tes notes… » (`m2-avant`),
   « Retenir passe à Décidé et propose sa tâche. Rien n'est posé sans toi. » (`m2-options`), et le paragraphe gris
   de `m2-sans-ia`. C'est le refus § 4 (« énormément d'information pour rien »).
   - Corriger : retirer ces phrases. Avant le rangement, une fiche repliée en une ligne « ✦ 5 notes à ranger ».
4. **m** La fiche occupe la moitié haute à chaque état (`m2-apres`, `m2-options`, `m2-decide`) : sur un carnet de 20
   notes, ses mots passeraient sous le pli. C'est le n° 7 de critique 1, encore là en partie.
   - Corriger : la replier en jetons dès qu'un choix est fait, comme le haut de `m2-options`.
5. **m** Le jeton « sans devis » (`m2-options`, `m2-decide`) se lit « pas besoin de devis » ; ailleurs, la même chose
   s'appelle « Devis pas encore reçu ».
   - Corriger : « devis attendu ».
6. **m** Mémo (`m2-memo`) : pour une note de 6 mots, deux tuiles la redisent (« À retenir : L'époxy a tenu », « Où : Sol
   de la salle ») ; la fiche est plus grande que la note.
   - Corriger : une ligne « Mémo · sol de la salle », puis la proposition Lier, qui est bonne.
7. **m** « N'a pas servi » en jetons barrés (`m2-resolu`) : le barré se lit « effacé ».
   - Corriger : du gris sans barré, comme « Écarté » de `m4-relire`.
8. **m** 4 tailles de corps (14, 15, 16 et 18 px), au-delà de 3 (PORTRAIT § 7).
   - Corriger : 14 / 16 / 20.
- D : « dalle : pas en cause » (`m2-resolu`) affirme plus que ses notes ; « pas eu besoin » serait plus juste.
- À garder : « Proposé · date, de ta note n°7 : Samedi » (`m2-decide`). La date vient de ses mots, pas de l'IA : la
  meilleure réponse à « aucune date inventée ». La relecture « Pourquoi ce choix », avec 4 puces liées aux notes
  (`m2-relire`). Le lien proposé entre le mémo et le carnet écoulement.

**Le parcours.**

| noter vite | trouvé | pas trouvé | devis | coût | options | décider | tâche | résoudre | relire pourquoi | non-problème | sans IA | annuler |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| trouvé | trouvé | trouvé (hachuré) | trouvé | trouvé | trouvé | trouvé | trouvé (date de sa note) | trouvé (proposé) | trouvé | trouvé (mémo maigre) | **partiel** (ni options ni tâche) | trouvé |

**Note : lisibilité 7 (fiche lourde, 4 tailles, explications au repos), besoin 8, donc 7, et 6,5 avec le retrait.**
Phrase prédite : « Pas mal, le pourquoi ce choix très bien. Mais la fiche prend toujours la moitié, et hors ligne il y a
plus rien ? »

## M3 · Dans la marge — 13 problèmes (B 2)

**Critique 1 : 9 corrigés sur 11, 2 encore là en partie.**
- Corrigés : options A, B et C (`m3-options`) ; « Tâche proposée, comme le conseil » ; parcours entier ; champ d'une
  ligne au repos (`m3-range`) ; « devis : pas encore reçu » et « si la flaque revient » ; plus de « ven. » inventé
  (« Quand ? ») ; la gomme remplacée par la feuille (`m3-annuler`) ; réglure régulière ; photo et lien posés.
- En partie (comptés ci-dessous) : la vue d'ensemble (n° 12) et la colonne serrée (n° 13).

**Nouveaux.**
1. **B** « devis : jamais demandé » (`m3-resolu`), alors que sa note 5 dit « Devis attendu. » : il l'a demandé. La
   relecture des mois plus tard mentirait (valeur fausse).
   - Corriger : « devis : jamais reçu, plus utile ».
2. **B** Le repli sans IA (`m3-hors-ligne`) n'a ni options ni prochaine tâche (CARNET-REPOND-AU-BESOIN). Il remet
   « à acheter » sur « Devis attendu » (le contresens de NOTE-PAS-ARTICLE, que la correction de l'IA venait d'ôter) et
   affiche « coût : 150 CHF » sans « estimé ».
   - Corriger : greffer le repli de M1, avec « devis attendu » et « 150 CHF estimé ».
3. **m** Les lettres A, B et C restent dans la marge sans leur liste : « Ⓒ en réserve », « Ⓑ en réserve », « coût de
   B, pas de A » (`m3-decide`), « Ⓒ pas eu besoin » (`m3-resolu`). Dès que le bloc Options se replie, ce sont des
   codes muets (§ 4).
   - Corriger : un nom court à côté de la lettre (« Ⓑ sanitaire »).
4. **m** La phrase de marge est cassée par la mise en page : « coût estimé de / Ⓑ pas le devis » (`m3-options`).
   - Corriger : « Ⓑ coût estimé, pas le devis ».
5. **m** « rien sous la dalle (3) » (`m3-decide`) : sa note dit « pas trouvée », pas « rien ».
   - Corriger : « dalle pas trouvée (3) ». `m3-relire` le dit juste (« rien d'autre trouvé »).
6. **m** Le jeton dit « cause : joint du siphon » et la marge « cause probable » (`m3-range`) : le jeton affirme plus.
   - Corriger : « ✓ joint du siphon usé ».
7. **m** La relecture s'ouvre à n2 : le constat n1 est hors écran. La frise marque deux états à la fois, Décidé
   encadré et Résolu noir (`m3-relire`).
   - Corriger : ouvrir en haut (jetons et constat), un seul état marqué.
8. **m** Achat : frise « Idée / Comparé / Acheté / Reçu » (`m3-achat`), alors que ses 4 états sont son choix (D451).
   - Corriger : comme M1 n° 8.
9. **m** Achat : la tâche « Mesurer la largeur de A et B avant d'acheter » est impossible, car il ne les a pas. Le
   tableau marque « largeur ? » sur A seulement, alors qu'elle manque aussi pour B (`m3-achat`).
   - Corriger : « Trouver la largeur de A et B sur leur page », et « largeur ? » sur les deux.
10. **m** 6 tailles (12, 13, 14, 15, 18 et 24 px) ; 12 et 13 px sont sous le plancher de 14 (PORTRAIT § 7).
    - Corriger : 14 / 16 / 24.
11. **m** Deux entrées pour les changements, « ↶ Changé » en haut et « Annoté à 21:27 · 7 changements · Revoir » en bas,
    et la bande du bas sur deux rangées (`m3-range`).
    - Corriger : garder seulement celle du haut.
12. **m** (critique 1, n° 5) Les jetons sous le titre partent avec le défilement : ils manquent dans `m3-options`,
    `m3-decide`, `m3-resolu` et `m3-relire`. La vue d'ensemble ne tient qu'en haut de page.
    - Corriger : des jetons collés sous la frise.
13. **m** (critique 1, n° 8) Ses notes tiennent dans environ 200 px : la note 1 prend 3 lignes et la note 4 en prend
    3 (`m3-note`, `m3-range`). C'est encore « difficile à lire ».
    - Corriger : marge à 140 px, sans gras, et corps de ses notes en 16 px sur 240 px.
- À garder : la relecture la plus forte des quatre (`m3-relire` : « raison 1, 2, 3 » en marge, puis « Pourquoi A, le
  25 nov. », ses mots cités entre guillemets, « tes mots, pas réécrits »). Le seul « coût réel : 12 CHF » du parcours
  (`m3-resolu`), plausible pour un joint de siphon. Le comparatif d'achat honnête (« largeur : dans aucune note »).

**Le parcours.**

| noter vite | trouvé | pas trouvé | devis | coût | options | décider | tâche | résoudre | relire pourquoi | non-problème | sans IA | annuler |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| trouvé | trouvé | trouvé | trouvé, puis **faux** au résolu | trouvé (et coût réel) | trouvé | trouvé | trouvé | trouvé | trouvé (le meilleur) | trouvé (achat) | **partiel** | trouvé |

**Note : lisibilité 6,5 (6 tailles dont 12 px, colonne serrée, codes A, B et C), besoin 8, donc 6,5, et 6 avec le
retrait.**
Phrase prédite : « La marge j'aime bien, le pourquoi avec mes mots très bien. Mais c'est quoi ces A B C ? Et c'est
toujours difficile à lire. »

## M4 · Deux vues — 7 problèmes (B 0)

**Critique 1 : 10 corrigés sur 10.**
Options avec Retenir (`m4-options`) ; tâche « Changer le joint du siphon », X « si la flaque reste » ; Résolu, relecture
et mémo ; plus de chasse fixe (14/16/20 px) ; le titre n'est plus redit (« ta 1re note a fait le titre ») ; le champ
est dans Organisé, et une note tapée là va dans Mes notes (« 21:40 · tapée dans Organisé ») ; la barre « Estimé »
est retirée ; trait violet et étiquette sur les notes lues (`m4-notes-lues`) ; le bas est rempli ; photo et lien sont
posés. Seules les captures `m4-avant` et `m4-apres` sont périmées (voir en tête).

**Nouveaux.**
1. **m** Explications au repos : la carte « Pas encore rangé » en 3 étapes numérotées (`m4-noter`), la légende « Trait
   violet : note lue par l'IA… » (`m4-notes-lues`), la méta « ta 1re note a fait le titre » (`m4-noter`,
   `m4-notes-lues`). Refus § 4.
   - Corriger : tout retirer ; le badge « 6 à ranger » suffit.
2. **m** `m4-range` : 4 propositions avec 2 boutons chacune, soit 8 boutons et « Tout garder », sans frise ni options
   à l'écran. C'est un écran de validation, pas son carnet.
   - Corriger : poser chaque proposition à sa place, en pointillé, avec Garder d'un toucher : l'état sur la frise, la
     tâche dans Ensuite, comme `m4-options`.
3. **m** `m4-decide` : les « Retenir » des options en réserve sont gris pâle et semblent morts.
   - Corriger : un contour normal, ou « Changer d'avis ».
4. **m** L'étiquette « si flaque » est abrégée (`m4-notes-lues`).
   - Corriger : « si la flaque reste ».
5. **m** « Le chemin » (`m4-resolu`) : Je cherche et Décidé n'ont pas de date ; seuls le 24 et le 28 nov. sont dits.
   - Corriger : dater chaque pas, comme le Chemin de `m1-relire`.
6. **m** Le repli sans IA, à l'état Décidé (`m4-sans-ia`), ne montre ni les options en réserve ni trouvé / pas trouvé
   (CARNET-REPOND-AU-BESOIN, en partie). Il propose bien « Cocher » et « Résolu ? » d'après sa note 8.
   - Corriger : garder sous la tâche la ligne de jetons et « En réserve : sanitaire, dalle ».
7. **m** Mémo : les jetons « Te resservira pour : refaire un sol, choisir un revêtement, la soude » (`m4-memo`) sont
   inventés, et on ne sait pas ce qu'ils font au toucher (« Ça c'est inutile »).
   - Corriger : les retirer, ou les remplacer par de vrais liens vers des carnets.
- D : dans `m4-options`, la tâche est déjà « gardée par toi » avant qu'une option soit retenue. C'est cohérent avec
  le conseil, mais l'ordre peut surprendre.
- À garder : « Sous la dalle : cherché, pas trouvé · 3 » (le seul juste avec M2) ; « Pourquoi tu as pris ça / Ce que
  tu savais alors / Si ça revient : la dalle n'a jamais été ouverte » (`m4-relire`) ; « trouvé par « siphon » » en
  tête de relecture ; « Coût du joint : pas noté · + Noter » (`m4-resolu`) ; la feuille avec « note n › »
  (`m4-annuler`) ; le mémo à 3 notes, avec Point faible et Relier (`m4-memo`).

**Le parcours.**

| noter vite | trouvé | pas trouvé | devis | coût | options | décider | tâche | résoudre | relire pourquoi | non-problème | sans IA | annuler |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| trouvé (badge « 6 à ranger ») | trouvé | trouvé | trouvé | trouvé | trouvé | trouvé (sa raison, note 7) | trouvé | trouvé (proposé, sa note 8) | trouvé | trouvé (mémo) | trouvé (à Décidé) | trouvé |

**Note : lisibilité 8 (3 tailles, 14 px au moins, cartes nettes ; explications au repos), besoin 8,5 (tout le
parcours, les deux vues, rien de faux), donc 8, et 7,5 avec le retrait.**
Phrase prédite : « Vachement bien, c'est ça l'idée, les 2 vues. Mais trop de boutons Garder Non, et les explications
on s'en fout. »

## Classement

1. **M4** (7,5) : sa propre idée, tout le parcours, aucune valeur fausse, et la meilleure relecture visuelle.
2. **M1** (7) : la plus nette, avec le meilleur repli hors ligne, mais elle contredit sa note sur la dalle.
3. **M2** (6,5) : la date tirée de sa note et le pourquoi lié aux notes, mais une fiche lourde et un repli vide.
4. **M3** (6) : la meilleure relecture en ses mots et le coût réel, mais des codes A, B et C et une lecture serrée.

La passe a progressé : 41 problèmes à la critique 1 (20 B), 37 à la critique 2 (4 B), et aucun refus de critique 1
rejoué. Pas encore satisfaisant : 4 B, et des phrases prédites encore en « mais ».

## Greffes pour la correction 2

| Idée | Origine | Reçoit |
|---|---|---|
| Repli hors ligne complet : jetons, options lues, « Tâche ? Garder / Non », notes en file | M1 (`m1-hors-ligne`) | M2, M3, M4 |
| « cherché, pas trouvé · 3 », hachuré, sans question | M4 / M2 | M1 |
| Date proposée tirée de sa note (« de ta note n°7 : Samedi ») | M2 | M1, M3, M4 (à la place du seul « Quand ? ») |
| Ses mots cités, « tes mots, pas réécrits », raisons numérotées | M3 (`m3-relire`) | M1, M2 |
| Coût réel au résolu (noté, ou « pas noté + Noter ») | M3 et M4 | M2 |
| « Changements » en haut, sous le titre ou la bascule ; bande du bas d'une ligne | M4 | M1, M3 |
| Jetons collés sous la frise, visibles au défilement | M2 (haut de `m2-options`) | M1, M3 |
| « trouvé par « siphon » » en tête de relecture | M4 | M1, M2, M3 |

## Retouches communes

- Aucune valeur qui contredit ses notes : « pas trouvée » reste « pas trouvé », « Devis attendu » veut dire qu'il est
  demandé, « Estimation » reste « estimé ».
- Le repli sans IA garde jetons, options et tâche.
- Plus de phrase d'explication au repos.
- 3 tailles au plus, 14 px au moins.
- Ses 4 états sur tout carnet, achat compris.
- À l'assemblage, remplacer dans `page.html` les quatre captures v0 de M3 et M4.

LEÇON PROPOSÉE : une capture de page (`mN-avant` ou `mN-apres`) qui n'est pas régénérée avec sa maquette garde à
l'écran des refus déjà corrigés. Chaque correction régénère toutes les captures que cite `page.html`, ou les remplace
par des copies d'états neufs, et en contrôle l'empreinte et l'heure.
