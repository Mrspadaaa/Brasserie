# Juge passe 4, tour 2 (p4b) : deux regards (25.11, nuit)

Juge : Opus, lecture seule. Matière : `p4b/p4b-1..3.html` (recette en tête), `p4b/RESULTAT.md`, `p4b/cap/mesures.json`.
Images ouvertes avec Read : les 3 planches `cap/planche-p4b-{1,2,3}.png` (elles contiennent les 30 captures d'écran), plus
`cap/p4b-{1,2,3}-organise.png` à pleine taille. Les autres captures n'ont été vues que dans leur planche, à demi-taille.

- **T = regard TDAH visuel** : se perd dans le texte ; veut couleur, forme, position ; une seule chose à la fois.
- **B = regard brasseur en action** : gants, cuve qui chauffe ; 5 s pour voir quoi faire ; un pouce, en bas d'écran.

Codes : **B** = bloquant, **m** = mineur. Les mots comptés viennent de `mesures.json` (script). Les autres tailles sont
estimées à l'œil.

Valeurs vérifiées dans `tests/fixtures/c79` et `c75` : 1,2 → 0,4 bar, 6,3 A, 2 500 CHF, J+5, 1 500 CHF, « Devis à comparer »,
« mi-déc. ». Toutes y sont. Je n'ai trouvé aucune valeur inventée. Le calendrier du mémo de p4b-3 est juste : le 25.11.2026
tombe un mercredi, le 31.12 un jeudi.

## Tour 1 → tour 2 : ce qui est réglé, ce qui reste

| Constat du tour 1 | Tour 2 |
|---|---|
| G-B1 : Organisé à 80-120 mots | **Réglé** : 26 / 24 / 25 mots (script). Chaque bloc porte une icône, une couleur ou une forme. |
| G-B2 : frise fixe (5 sur 6) | **Réglé** : aucune frise. Seul l'achat de p4b-1 a « comparé › choisi › commandé », propre à l'achat. |
| G-B3 : bascule Mes notes / Organisé en haut | **Réglé** dans les trois. Elle est en bas. p4b-2 la met en pleine largeur, la meilleure prise au gant. |
| Prochaine action ni en haut ni en gros bouton | **Réglé** : gros bouton blanc sous le pouce (Contacter, Relire Brau, Réessayer, Relire avec l'IA). |
| ENTETE-PEU-UTILE | **Réglé** : première info utile à 38-48 px. |
| G-B4 : ranger exige un glisser | **Reste ouvert**. Aucun écran de rangement dans p4b, donc pas de « Ranger dans… » en un toucher. |
| G-m1 : liens de 11-14 px (« ta ligne 3 », « ligne 2 ↩ ») | **Reste** dans les trois (Décider, Mémo, Erreur). |
| Valeurs fausses (« 150 CHF ? » sur un devis reçu) | Réglé dans p4b-1, où il est marqué « estimé ». **Le défaut s'inverse** dans p4b-3 : le 150 CHF estimé a l'air d'un prix ferme (voir Organisé). |

---

## 1. Liste

**T** : les trois se lisent sans lire. p4b-1 met une pastille de couleur par état et un mot de piste, avec une mini-barre
480 / 1 200 sur le frigo. p4b-3 donne le chiffre clé de chaque carnet en couleur à droite (1,2 → 0,4 bar, 6,3 A, +4 CHF / sac),
plus une mini-barre d'états par domaine : c'est l'image la plus dense en info utile. p4b-2 a un liseré coloré à gauche et un
mot coloré, sans pastille : c'est plus calme, mais l'état se lit moins vite.
**B** : chez p4b-2, les compteurs sont gros, en bas, à côté du « + » : ce sont les cibles les plus sûres. Chez p4b-1, ils sont
justes au-dessus du champ, en 4 cases de taille correcte. Chez p4b-3, la barre proportionnelle est fine (≈ 26 px de haut) et
cache la dernière ligne.

- m1 : p4b-3, la dernière ligne (« Fête de la bière ») passe sous la barre des compteurs (`planche-p4b-3`, liste).
- m2 : p4b-2 n'a que 11 lignes (71 %). La règle est tenue, mais de justesse.

Meilleurs : chiffre clé à droite (p4b-3) ; pastille d'état et mini-barre 480 | 1 200 (p4b-1) ; compteurs gros au pouce (p4b-2).

| | p4b-1 | p4b-2 | p4b-3 |
|---|---|---|---|
| T | 8 | 7 | 8 |
| B | 7 | 8 | 6 |

## 2. Organisé : un problème (écoulement)

**T** : p4b-3 est la plus lisible sans lire. Elle montre 3 jetons ronds (joint ✓ vert, dalle ? ambre, devis X ⏳ bleu), un face à
face « toi | sanitaire X » en cases hachurées, puis « prix du joint ? · Noter » en jaune : ce qui manque est dit et se règle d'un
toucher. p4b-1, le métro, fait une belle image, avec une couleur et un bout (✓ / ? / ⏳) par piste. p4b-2 pose 4 tuiles 2 × 2 en
couleur, puis « 🔧 ou 👷 ? » : c'est clair aussi.
**B** : en 5 s, p4b-1 et p4b-3 n'ont qu'une action, le gros « Contacter l'entreprise X » sous le pouce. p4b-2 montre trois
boutons blancs de même poids (Retenir, Retenir, Contacter) : on ne sait pas lequel toucher.

- B1 (B) : p4b-2 met deux « Retenir » au même rang que la prochaine action, et propose de retenir le sanitaire sur une estimation,
  avant le devis (`p4b-2-organise.png`). Il faut une seule action pleine ; les Retenir viennent quand le devis est là.
- m1 : p4b-3, le « 150 CHF » a un cadre plein, comme un prix sûr. Sa ligne dit « Estimation 150 CHF (exemple) » : il faut le
  pointillé et « estimé » de p4b-1 (`p4b-3-organise.png`). p4b-2 a le pointillé, mais pas le mot.
- m2 : p4b-1, la longueur des lignes de métro (pleine, à moitié, aux trois quarts) ne vient d'aucune donnée. Le regard T la lit
  comme un avancement (`p4b-1-organise.png`).
- m3 : p4b-1, le bloc coût n'a pour en-tête qu'un 💰 et un 💡 isolés ; le 💡 ne dit pas ce qu'il ouvre (`p4b-1-organise.png`).
- m4 : p4b-3, la bascule tient en deux petites tuiles de ≈ 58 px de large, avec des libellés de 12 px. Au gant, c'est limite.

Meilleurs : jetons ronds et « prix du joint ? · Noter » (p4b-3) ; métro (p4b-1) en greffe pour un problème à 3 pistes ou plus ;
« estimé » en pointillé (p4b-1) ; bascule pleine largeur (p4b-2).

| | p4b-1 | p4b-2 | p4b-3 |
|---|---|---|---|
| T | 8 | 7 | 9 |
| B | 8 | 6 | 8 |

## 3. Toucher un élément → sa ligne

Mêmes notes dans les trois, avec la ligne surlignée de la couleur de la piste : le lien se voit. **B** : le retour de p4b-2,
« ← Revenir à 🔧 Joint usé », en pleine largeur au-dessus du champ, est le meilleur au pouce. Chez p4b-1, la pilule est centrée
et correcte. Chez p4b-3, elle est petite, à droite.

- m1 : p4b-3, retour en petite pilule de ≈ 40 px de haut (`planche-p4b-3`, organise-ligne).

| | p4b-1 | p4b-2 | p4b-3 |
|---|---|---|---|
| T | 7 | 7 | 7 |
| B | 7 | 8 | 6 |

## 4. Aide ouverte

**T** : p4b-1 et p4b-3 donnent 3 grosses tuiles (✓, ☐, 💡) et une phrase ✦. p4b-2 donne 3 rangées avec une sous-ligne concrète
(« Contacter l'entreprise X · ta ligne 3 ») : c'est plus utile, mais plus de texte. **B** : p4b-3 est la seule à mettre
« Garder | Non merci » sous le pouce. Ailleurs, il faut toucher la phrase.

- m1 : p4b-1 n'a pas de bouton pour garder la suggestion, et une ligne d'aide de 11 px (« Rien n'est posé sans ton toucher »).

Meilleurs : Garder / Non merci (p4b-3) ; sous-ligne concrète de la tâche (p4b-2).

| | p4b-1 | p4b-2 | p4b-3 |
|---|---|---|---|
| T | 7 | 6 | 8 |
| B | 6 | 7 | 9 |

## 5. Organisé : un achat (Houblons citra)

**T** : p4b-1 pose deux grandes tuiles de boutique, puis α, prix et stock en barres, et ses arômes en fruits : c'est une image.
p4b-3 met des couronnes sur la case qui gagne et une barre « lu 7 · manque 3 » : on voit qui gagne quoi et ce qui manque. p4b-2
empile deux cartes classées 1 et 2 : il y a plus à lire. **B** : les trois ont « Relire Brau » sous le pouce. p4b-2 a « ✕ Écarter »
en bouton, ce qui est bien au gant, mais la cible est petite.

- m1 : p4b-2 classe Brau 1er sur le seul critère « α précis » (petite puce en haut), alors que son prix est « à relire »
  (`planche-p4b-2`, achat).
- m2 : p4b-1, l'avancement « comparé › choisi › commandé » est écrit en 12 px. Il est bien à sa place (propre à l'achat), mais
  peu visible.

Meilleurs : tuiles de boutique et barres (p4b-1) ; couronnes et « lu 7 · manque 3 » (p4b-3) ; Écarter en bouton (p4b-2) ;
« dur à obtenir » face à « en stock ⚠ » (les trois).

| | p4b-1 | p4b-2 | p4b-3 |
|---|---|---|---|
| T | 8 | 6 | 8 |
| B | 8 | 7 | 8 |

## 6. Décider (frigo : 480 ou 1 200 CHF)

**T** : p4b-2 l'emporte nettement. Deux colonnes dont la hauteur dit le prix (480 courte et verte, 1 200 haute et bleue), et
« −720 CHF » : on comprend en une seconde. p4b-3 a une règle 480 ——— 1 200 avec « 720 CHF d'écart ». p4b-1 a deux tuiles
avec barres, plus la citation, « Pourquoi », « Ensuite » et « Garder » : 70 mots.
**B** : chez p4b-2, « Retenir 🔧 | Retenir ❄ » sont en bas, sous le pouce. Chez p4b-1 et p4b-3, ils sont au milieu de l'écran.

- m1 : p4b-1, 70 mots et 4 blocs sous la décision : trop pour un TDAH (`planche-p4b-1`, decider).
- m2 : p4b-1, « −720 CHF » sous la Réparation se lit comme une perte plutôt qu'une économie ; « 720 CHF d'écart » (p4b-3) est
  plus juste.

Meilleurs : colonnes proportionnelles et Retenir au pouce (p4b-2) ; « 720 CHF d'écart » (p4b-3) ; « Pourquoi l'un plutôt que
l'autre ? · Ajouter » (p4b-1, p4b-3).

| | p4b-1 | p4b-2 | p4b-3 |
|---|---|---|---|
| T | 6 | 9 | 7 |
| B | 6 | 9 | 7 |

## 7. À faire (tous les carnets)

**T** : p4b-3 a la meilleure trouvaille du tour : une frise du temps avec les icônes des tâches posées sur leur date (auj. →
31 déc.). Le TDAH voit où ça se tasse. Ce n'est pas une frise d'états : c'est le calendrier de ses notes. p4b-2 range par
« Cette semaine / Bientôt / Sans date », avec des cercles colorés par état. p4b-1 dépasse 100 mots (105, script).
**B** : p4b-2 permet de trancher « 480 | 1 200 » d'un toucher, dans la carte « Une décision t'attend ». C'est le geste le plus
court.

- m1 : p4b-2, trancher depuis une liste sans retour visible est risqué au gant : il faut un toast « Annuler ».
- m2 : p4b-3, une couronne sur 480 CHF dans « Réparer ou frigo neuf ? » se lit comme une recommandation, sans critère dit.
- m3 : p4b-1, 105 mots, deux cartes de décision avant la liste (`planche-p4b-1`, afaire).

Meilleurs : frise du temps à icônes (p4b-3) ; décision tranchée d'un toucher et sections par délai (p4b-2) ; icône du carnet
sous chaque tâche (p4b-1).

| | p4b-1 | p4b-2 | p4b-3 |
|---|---|---|---|
| T | 6 | 7 | 9 |
| B | 7 | 8 | 7 |

## 8. Relecture (malt, des mois plus tard)

**T** : p4b-2 montre le mot cherché surligné et trois tuiles en icônes (rupture, brassin, en stock), puis « Si ça revient :
l'autre fournisseur ». p4b-3 met « Tu savais / Tu as fait » en deux colonnes, avec « Le prix du sac : tes notes ne le disent
pas » : c'est honnête et visuel. p4b-1 est une liste datée, juste mais plus textuelle.
**B** : chez p4b-2, « Oui | Pas sûr » sont au pouce. Chez p4b-1 et p4b-3, ils sont au milieu, avec ≈ 200 px vides en dessous.

- m1 : p4b-3, Oui / Pas sûr flottent au milieu, sous lesquels l'écran est vide (`planche-p4b-3`, relecture).

Meilleurs : recherche surlignée, tuiles et « Si ça revient » (p4b-2) ; « Tu savais / Tu as fait » et « tes notes ne le disent
pas » (p4b-3).

| | p4b-1 | p4b-2 | p4b-3 |
|---|---|---|---|
| T | 7 | 8 | 7 |
| B | 7 | 8 | 6 |

## 9. IA en erreur / hors ligne

Les trois sont honnêtes : seuls « pas trouvé · ligne 2 » et « 150 CHF · ligne 5 » sont montrés, comme le lit
`etiquettesLocales`. **T** : p4b-3 dessine les 4 cases que l'app sait lire, en disant « rien lu » pour contacté et piste. On voit
ce qui manque sans lire. p4b-2 pose deux grosses rangées colorées. p4b-1 a des puces et deux cases pointillées « pistes · IA »,
« tâche · IA ». **B** : p4b-1 (« Relire avec l'IA ») et p4b-3 (« Réessayer ») ont un vrai geste sous le pouce.

- m1 : p4b-2 met sous le pouce un bouton gris mort, « En attente du réseau ». Il occuperait mieux la place avec « Noter »
  ou rien (`planche-p4b-2`, erreur).

Meilleurs : 4 cases lu / rien lu (p4b-3) ; « Mes notes ① en file » (p4b-2) ; Réessayer au pouce (p4b-3).

| | p4b-1 | p4b-2 | p4b-3 |
|---|---|---|---|
| T | 7 | 8 | 8 |
| B | 8 | 6 | 8 |

## 10. Mémo (assurance, 31 déc.)

**T** : p4b-2 met « 36 j » en gros et une barre de jours jusqu'au 31 déc. : simple et visuel. p4b-1 dessine un anneau avec 36 j.
p4b-3 montre un vrai calendrier jusqu'au 31 en rouge : une image claire, mais ≈ 280 px pour un seul chiffre.
**B** : p4b-2 met « Demander l'offre au 2e assureur » en gros bouton sous le pouce, et des cases à cocher larges. p4b-3 n'a
aucune action en bas, et ses pièces sont des puces sans case : le « 0/3 » est perdu.

- m1 (B) : p4b-3 laisse sous le pouce la seule bascule, alors qu'une tâche existe (« Demander une offre à un 2e assureur ») ;
  « rien à suivre » est faux (`planche-p4b-3`, memo).
- m2 : p4b-1, la tâche « Demander une offre » est au milieu, en carte, pas sous le pouce.

Meilleurs : barre de jours et action au pouce (p4b-2) ; calendrier jusqu'à l'échéance (p4b-3), en plus petit ; rappel « quand tu
noteras « assurance » » en interrupteur (les trois).

| | p4b-1 | p4b-2 | p4b-3 |
|---|---|---|---|
| T | 7 | 8 | 7 |
| B | 6 | 9 | 5 |

---

## Notes d'ensemble (moyenne des 10 écrans)

| | p4b-1 « métro » | p4b-2 « sous le pouce » | p4b-3 « qui gagne quoi » |
|---|---|---|---|
| T (TDAH visuel) | 7,1 | 7,3 | **7,8** |
| B (en action) | 7,0 | **7,6** | 7,0 |
| **Moyenne** | **7,1** | **7,5** | **7,4** |

Lecture : p4b-3 parle le mieux à l'œil (jetons ronds, face à face, frise du temps, 4 cases lu / rien lu). p4b-2 parle le mieux
à la main (bascule pleine largeur, Retenir et Oui au pouce, décision d'un toucher), mais rate l'action unique d'Organisé.
p4b-1 est la plus régulière, mais la plus textuelle hors d'Organisé (Décider 70 mots, À faire 105).

## Probant ?

**Oui, pour bâtir le jouable ; non, pour une version prise telle quelle.**

- Les quatre règles dures sont tenues par les trois (≤ 26 mots, 0 frise, info utile ≤ 48 px, ≥ 11 lignes), ainsi que l'action
  sous le pouce et l'absence de valeur inventée. Au tour 1, aucune ne tenait.
- Chaque version a un écran faible qui la fait tomber seule : Organisé à trois boutons égaux (p4b-2), mémo sans action et
  150 CHF en cadre ferme (p4b-3), Décider et À faire trop textuels (p4b-1).
- Reste ouvert : « Ranger dans… » en un toucher (G-B4), non dessiné ; liens de 11-14 px (« ta ligne 3 ») ; toast Annuler
  sur toute décision prise d'un toucher.

## Recette de greffe pour le jouable

| Écran | Greffe |
|---|---|
| Liste | Lignes et pastilles d'état de p4b-1, avec le **chiffre clé** de p4b-3 à droite à la place du mot de piste quand il existe ; mini-barre d'états par domaine de p4b-3 ; **compteurs gros au pouce** à côté du « + » de p4b-2 (sans cacher la dernière ligne). |
| Organisé (problème) | **Jetons ronds** et face à face « toi \| sanitaire X » de p4b-3, avec « prix du joint ? · Noter » ; l'estimation en **pointillé + « estimé »** de p4b-1 ; métro de p4b-1 seulement au-delà de 3 pistes, et sans longueur inventée ; **une seule** action pleine (Contacter), les Retenir après le devis ; **bascule pleine largeur** de p4b-2. |
| Sa ligne | Surlignage à la couleur de la piste (les trois) ; « ← Revenir à 🔧 Joint usé » pleine largeur de p4b-2. |
| Aide | Tuiles ✓ / ☐ / 💡 de p4b-3, avec la sous-ligne concrète de p4b-2 sous Tâche ; **Garder \| Non merci** au pouce (p4b-3). |
| Organisé (achat) | Tuiles de boutique et barres de p4b-1 ; **couronnes** et « lu 7 · manque 3 » de p4b-3 ; « ✕ Écarter » en bouton de p4b-2, en plus gros ; avancement comparé › choisi › commandé de p4b-1 en plus visible ; Relire Brau au pouce. |
| Décider | **Colonnes proportionnelles** et Retenir 🔧 / ❄ au pouce de p4b-2 ; « 720 CHF d'écart » de p4b-3 ; « Pourquoi l'un plutôt que l'autre ? · Ajouter » replié sous un toucher. |
| À faire | **Frise du temps à icônes** de p4b-3 en tête ; « Une décision t'attend » tranchée d'un toucher de p4b-2, avec toast Annuler et sans couronne ; sections Cette semaine / Bientôt / Sans date de p4b-2 ; icône du carnet sous chaque tâche. |
| Relecture | Recherche surlignée, tuiles en icônes et « Si ça revient » de p4b-2 ; « Tu savais / Tu as fait » et « tes notes ne le disent pas » de p4b-3 ; Oui / Pas sûr au pouce. |
| IA en erreur / hors ligne | **4 cases lu / rien lu** de p4b-3 ; « Mes notes ① en file » de p4b-2 ; Réessayer au pouce, jamais un bouton mort. |
| Mémo | « 36 j » et barre de jours de p4b-2, ou mini-calendrier de p4b-3 réduit à 2 rangées ; pièces en **cases à cocher** (0/3) ; « Demander l'offre au 2e assureur » au pouce (p4b-2) ; rappel par mot en interrupteur. |
| À dessiner | « Ranger dans… » en un toucher (sans glisser) ; liens « ta ligne N » à 16 px et 44 px de cible. |
