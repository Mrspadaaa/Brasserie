# Juge produit, tour 1 : trois regards (UX mobile compacte, IA, nouveau venu)

Matière : les 96 captures ont été ouvertes une à une (`cap/` : 24 captures, repos et geste sur 2 cas ; `cap12/` : 72 captures au repos sur 12 cas).
Contrôles durs appliqués : ORGANISE-TROP-TEXTUEL, FRISE-GENERIQUE et ENTETE-PEU-UTILE.

Les trois regards :
- **UX** : densité, hiérarchie, pouce, 390 px.
- **IA** : l'IA aide-t-elle ? La voit-on ? Peut-on l'annuler ? Que se passe-t-il si elle se trompe ou n'est pas là ?
- **Nouveau** : un nouveau venu comprend-il sans explication ?

B = bloquant, m = mineur. Une capture se cite `cap/<v>-<cas>-<état>` ou `cap12/<v>-<cas>`.

## Constats communs aux 6 variantes, qui ne sont pas retirés de leur note

- **IA-1 (B)** : le mot « IA » n'apparaît nulle part. Le seul signe est le pointillé violet, une convention que personne n'a apprise. Le ★ violet (« conseillé » par l'IA, voir `reponses/ecoulement.json`, `conseille: true`) ressemble au ☆ « Retenir » du brasseur (`cap/v3-citra-repos`, `cap12/v5-bouteilles`). On ne sait donc pas qui a choisi quoi.
- **IA-2 (B)** : une option proposée par l'IA perd son titre. « Changer le joint » devient « 🔧 ? CHF » (`cap12/v1-ecoulement`, `v2-ecoulement`, `v6-ecoulement`), et « Infuser à froid » devient « ❄️ ? » (`cap12/*-sureau`). L'IA propose une chose qu'on ne peut pas lire.
- **IA-3 (B)** : au repos, aucune proposition de l'IA ne porte de ✕. On ne peut la refuser que dans Aide (v2, v4, v6). Dans la bulle de ligne (`cap/v1-ecoulement-geste`, `v3-ecoulement-geste`, `v5-ecoulement-geste`), on peut lire la source, mais on ne peut ni dire « faux » ni retirer.
- **IA-4 (m)** : aucune capture ne montre l'état « IA absente » (hors ligne, échec ou rangement pas encore fait). On ne sait pas ce que le carnet affiche alors.
- **N-1 (B)** : un nouveau venu ne sait pas ce que veut dire un « ? » seul (`cap12/v2-pilsner`, `v3-sureau`, `v5-chaudiere`). Ce peut être un coût inconnu, une question ou une chose à vérifier.
- **N-2 (B)** : il croit que le pilsner (réglé) est un problème ouvert, dans toutes les variantes. Aucune variante n'a d'état « réglé ».

---

## v1 : carte mentale

**UX.**
- Ce qui marche : le cœur ✓1 ?2 avec son anneau vert et jaune se lit en une seconde (`cap/v1-ecoulement-repos`).
- Ce qui ne marche pas : l'écran entier sert à 5 ou 8 nœuds, avec de grands vides entre les branches. Au-delà de 8 branches, les étiquettes se chevauchent (`cap12/v1-fete`, `v1-bouteilles`).
- La tâche, c'est-à-dire la chose à faire, n'est qu'un nœud parmi d'autres, sans priorité.
- Les nœuds du haut (y ≈ 60 à 150 px) sont loin du pouce.

**IA.**
- Ce qui marche : les branches en pointillé violet se distinguent bien (`cap/v1-ecoulement-repos` : « Seule cause ? »).
- Ce qui ne marche pas : une branche de l'IA pèse autant qu'un fait trouvé. Quand l'IA a mal rangé, l'erreur a la même taille que le vrai.

**Nouveau.**
- Il ne comprend pas « ✓1 ?2 ». Il ne voit pas pourquoi un nœud est rond et un autre carré : la forme code la sorte (piste, option, tâche) sans légende.
- Il voit un joli dessin, mais il ne sait pas quoi faire.

Problèmes :
1. **B** : des étiquettes se chevauchent : « 10 fûts » et « Gobelets consignés », « Réserver le stand » sous un nœud (`cap12/v1-fete`) ; Verallia et Fournisseur B (`cap12/v1-bouteilles`).
2. **B** : « Chiffre d'affaires 2026 » est coupé au bord gauche (`cap12/v1-assurance`).
3. **B** : le pilsner réglé s'affiche « ✓0 ?0 » avec un anneau gris, et « 📅 ? » et « 🔄 ? » ne disent rien (`cap12/v1-pilsner`).
4. **B** : la prochaine action n'est pas mise en avant. « Appeler le technicien » est une branche parmi 8 (`cap12/v1-chaudiere`).
5. **m** : le citra générique est fait de « ? » et le centre n'est qu'un mot (`cap12/v1-citra`).
6. **m** : les grands vides au centre de la liste (`cap12/v1-cave`, `v1-sureau`) font un écran peu dense.
7. **m** : la date de la tâche est perdue : « lundi » (`cap12/v1-bar`), « samedi 6 déc. » (`cap12/v1-cave`).

À greffer : l'**anneau trouvé / à vérifier** (✓n ?n) comme pastille de statut d'un carnet de type problème, et le **⚖️ comparé au cœur** pour un achat.

Notes : UX 5, IA 5, Nouveau 4,5, soit **5/10**.

---

## v2 : grosses tuiles

**UX.**
- Ce qui marche : les gros chiffres (150 CHF, 1,2 → 0,4 bar, 31 déc.) se lisent sans lire. La carte de la tâche est large et à portée du pouce.
- Ce qui ne marche pas : les tuiles sont carrées quel que soit le contenu, donc une tuile de 180 × 195 px ne contient qu'un « ? » (`cap12/v2-pilsner`, `v2-sureau`).
- Le texte déborde ou est coupé : « +4 CHF/sac » (`cap12/v2-pilsner`), « 3e générat » (`cap12/v2-levure`).
- « 2 fûts par mois » s'étale sur 3 lignes géantes (`cap12/v2-bar`).
- Les bouteilles ont 53 mots et la page défile (`cap12/v2-bouteilles`).

**IA.**
- Ce qui marche : Aide en feuille, avec ✓ ☐ 💡, puis ✕ et ＋ sur chaque ligne. C'est la meilleure façon d'accepter ou de refuser l'IA (`cap/v2-ecoulement-geste`, `cap/v2-citra-geste`).
- Ce qui ne marche pas : la tuile « ? » avec une barre bleue pleine fait croire à une jauge remplie, et donc à une certitude, pour une option de l'IA au coût inconnu (`cap12/v2-co2`, `v2-chaudiere`).

**Nouveau.**
- Il ne comprend pas « 1/2 Joint » : un sur deux de quoi ? Le mot affiché est celui de la piste trouvée, pas le sujet (`cap/v2-ecoulement-repos`).
- Il ne comprend pas « 👑 0 / 👑 0 » (`cap12/v2-citra`).
- Les gros chiffres, en revanche, il les comprend.

Problèmes :
1. **B** : le texte déborde ou est coupé : « +4 CHF/sac » (`cap12/v2-pilsner`), « 3e générat » (`cap12/v2-levure`).
2. **B** : les bouteilles ont 53 mots, au-delà des 30 permis. Les libellés « Verallia 0.42/bt · Fournisseur B 0.55/bt » sont du texte (`cap12/v2-bouteilles`).
3. **B** : le pilsner réglé s'affiche en tuiles « ? » et le mot « Commandé » est petit, en bas (`cap12/v2-pilsner`).
4. **B** : sur la fête, la liste de tâches passe sous l'écran, sans compte à rebours (`cap12/v2-fete`).
5. **m** : la barre bleue pleine sous un « ? » (`cap12/v2-sureau`) dit le contraire de « inconnu ».
6. **m** : la tâche urgente « Appeler le technicien » est en bas et coupée (`cap12/v2-chaudiere`).
7. **m** : les tuiles vides gaspillent la hauteur : une tuile seule sur une demi-largeur (`cap12/v2-assurance`, `v2-bar`).

À greffer :
- le **gros chiffre clé**, plafonné à une ligne ;
- la **feuille Aide** ✓ ☐ 💡 avec ✕ et ＋ ;
- le **hachuré violet pour un coût inconnu** (`cap/v2-ecoulement-repos`).

Notes : UX 5, IA 5,5, Nouveau 5, soit **5,2/10**.

---

## v3 : chemin vertical

**UX.**
- Ce qui marche : des pastilles icône et mot, alignées et lisibles, et une tâche en grande carte au milieu, à portée du pouce. Le tableau de comparaison du citra dessiné à la main (`cap/v3-citra-repos`) est le meilleur comparateur des 6.
- Ce qui ne marche pas : les stations restent espacées même quand elles sont vides. Il y a 200 à 300 px de noir entre 🔎 et 📞 (`cap12/v3-pilsner`, `v3-sureau`, `v3-bar`).
- La grille du duel est faite pour 2 articles et casse à 3 : en-têtes et valeurs sont décalés, « 0.5 » et « 120 » sont coupés (`cap12/v3-bouteilles`).

**IA.**
- Ce qui marche : la **bulle de ligne sur place**, sous l'élément, avec le n° de ligne, les mots surlignés et 📝↩ (`cap/v3-ecoulement-geste`, `cap/v3-citra-geste`). On voit d'où l'IA a tiré l'élément sans quitter l'écran.
- Ce qui ne marche pas : la bulle n'offre ni « faux » ni « retirer ».

**Nouveau.**
- Il ne comprend pas les stations 🔎, 📞 et 🛠️.
- Le 📞 désigne « maintenant », même quand la tâche est d'écrire (✉️, `cap12/v3-assurance`) ou de ranger (🧹, `cap12/v3-cave`). L'icône lui ment.

Problèmes :
1. **B** : le 3e article décale le tableau : valeurs sous la mauvaise colonne, « 0.5 » et « 120 » tronqués (`cap12/v3-bouteilles`).
2. **B** : « 3 déc. » est dans la station « maintenant », avec un halo, alors que le pilsner est réglé (`cap12/v3-pilsner`).
3. **B** : l'icône 📞 de la station est fixe et ne correspond pas à la tâche (`cap12/v3-assurance`, `v3-cave`, `v3-levure`).
4. **m** : de grands vides entre les stations (`cap12/v3-sureau` : à peine 3 éléments sur toute la hauteur).
5. **m** : un chemin de problème (🔎 → 📞 → 🛠️) est imposé à un événement et à une liste (`cap12/v3-fete`, `v3-cave`). C'est une frise générique déguisée, à la limite de FRISE-GENERIQUE.
6. **m** : le titre de la tâche est centré dans sa carte, loin de sa case ☐ (`cap12/v3-assurance` : « Demander une offre »).

À greffer :
- le **tableau qui gagne quoi**, avec une ligne par critère, une icône à gauche et la case gagnante en vert (`cap/v3-citra-repos`), à condition de le rendre souple à N articles ;
- la **bulle de ligne sur place**.

Notes : UX 5,5, IA 6,5, Nouveau 5,5, soit **5,8/10**.

---

## v4 : feu tricolore et jauge

**UX.**
- Ce qui marche : Aide s'ouvre en éventail au-dessus du bouton 💡, à portée du pouce (`cap/v4-ecoulement-geste`).
- Ce qui ne marche pas :
  - les lampes sont fixes et ne suivent pas les rangées, donc la couleur ment dans 9 cas sur 12 ;
  - la jauge de coût prend 160 px pour un seul « ? » (`cap12/v4-co2`, `v4-chaudiere`) ;
  - sous le bloc, la moitié de l'écran reste noire (`cap12/v4-assurance`, `v4-cave`, `v4-levure`).

**IA.**
- Ce qui marche : l'inconnu est hachuré et jamais posé à zéro, ce qui est honnête.
- Ce qui ne marche pas : la proposition de l'IA « Seule cause ? » est peinte en rouge, en face de la lampe « manque » (`cap/v4-ecoulement-repos`). Une question de l'IA se lit comme une alarme.
- Le repère « 🏭 0 » (`cap12/v4-bouteilles`) fait dire 0 à Verallia : l'outil affirme une valeur fausse.

**Nouveau.**
- Il comprend tout de suite un feu tricolore, et c'est précisément le danger : il croit ce que le feu dit. Le vert « ✓ » est en face de tâches orange (`cap12/v4-assurance`, `v4-cave`), et la tâche orange est en face du rouge (`cap12/v4-ecoulement`, `v4-levure`).

Problèmes :
1. **B** : la couleur de la lampe ne correspond pas à la rangée (`cap12/v4-ecoulement`, `v4-assurance`, `v4-cave`, `v4-fete`, `v4-levure`, `v4-sureau`, `v4-citra`).
2. **B** : des repères de la jauge se chevauchent et Verallia est lu « 0 » (`cap12/v4-bouteilles`).
3. **B** : la jauge de coût est appliquée à des façons d'infuser (`cap12/v4-sureau`) et à un fournisseur dont le délai est inconnu (`cap12/v4-pilsner`).
4. **B** : une suggestion de l'IA est en rouge, de la couleur de « manque » (`cap/v4-ecoulement-repos`, `cap/v4-citra-repos`).
5. **m** : 👷 et 📅 se chevauchent dans le hachuré (`cap12/v4-chaudiere`).
6. **m** : la moitié de l'écran est vide sous le feu (`cap12/v4-cave`, `v4-levure`).

À greffer :
- l'**éventail Aide** au-dessus du pouce ;
- le **hachuré de l'inconnu** sur une barre.

Note : la métaphore du feu est à abandonner.

Notes : UX 3,5, IA 3,5, Nouveau 3,5, soit **3,5/10**.

---

## v5 : kanban à 3 colonnes

**UX.**
- À 390 px, chaque colonne fait environ 120 px. Les mots passent à la ligne (« Seule cause ? », « Joint du couvercle ») et les cartes font 125 px de haut pour une icône et deux mots.
- Deux colonnes sur trois sont vides pour une liste, un événement ou une échéance (`cap12/v5-cave`, `v5-fete`, `v5-assurance`, `v5-bar`). Les deux tiers de l'écran restent sombres.
- La fête et l'assurance sont coupées en bas.

**IA.**
- Les options de l'IA (« 🔧 ? ») sont rangées en « À faire », comme si c'étaient des tâches (`cap12/v5-ecoulement`, `v5-sureau`). L'IA paraît donner des ordres.
- Le retournement de carte sur la ligne (`cap/v5-ecoulement-geste`) est bien vu, mais il remplace la carte dans une colonne étroite : 4 lignes pour 6 mots.

**Nouveau.**
- Les en-têtes « À vérifier / À faire / Fait » sont les seuls libellés que tout le monde comprend sans explication. C'est le meilleur point de la v5 pour lui.
- Mais il voit le pilsner réglé avec « Fait » vide et tout en « À faire » (`cap12/v5-pilsner`). Il se trompe.

Problèmes :
1. **B** : le pilsner réglé n'a rien en Fait (`cap12/v5-pilsner`).
2. **B** : deux colonnes vides sur trois pour la liste, l'échéance, l'événement et le bar (`cap12/v5-cave`, `v5-assurance`, `v5-fete`, `v5-bar`).
3. **B** : les bouteilles, un duel à 3, sont rendues en texte en haut (« Verallia 👑0 Fournisseur B… »), sans barre ni prix (`cap12/v5-bouteilles`).
4. **B** : les chiffres sont perdus : 1,2 → 0,4 bar (`cap12/v5-co2`), budget 1 500 CHF (`cap12/v5-fete`), 3e génération et 12 jours (`cap12/v5-levure`).
5. **m** : « Raccord changé », qui est fait, est rangé dans À faire (`cap12/v5-co2`).
6. **m** : le duel citra « 👑1 ▬▬ 👑2 » est écrasé par les noms dans le générique (`cap12/v5-citra`).

À greffer : les **mots de colonne** « à vérifier », « à faire » et « fait », réduits à un repère d'une ligne pour le nouveau venu.

Notes : UX 3,5, IA 4, Nouveau 5,5, soit **4,3/10**.

---

## v6 : une seule chose maintenant

**UX.**
- Ce qui marche : la hiérarchie est la plus nette des 6, avec une dominante, le gros ✓ vert (environ 80 px) au milieu, sous le pouce, et ⏭.
- Le reste est rangé par rangées à repère : 🔎 pistes, 💰 coûts, ⏳ échéance, 🔢 chiffres. C'est dense et lisible à 390 px.
- 7 cas sur 12 sont justes (`cap12/v6-co2`, `v6-chaudiere`, `v6-levure`, `v6-assurance`…).
- Ce qui ne marche pas : le héros occupe environ 350 px sur 844, soit 41 % de l'écran, dont une icône de 95 px.
- Les bouteilles passent sous l'écran (`cap12/v6-bouteilles`).

**IA.**
- Ce qui marche : Aide en **pile de cartes 1/3**, une chose à la fois, avec ✕ et ＋ (`cap/v6-ecoulement-geste`). On peut refuser l'IA en un geste.
- Le « 📝 4 ↩ » du héros renvoie à la ligne source.
- Ce qui ne marche pas : quand la prochaine chose est une question de l'IA, le héros violet « ✓ Maintenant » la met en très grand : « Prix/g Brau ? » (`cap/v6-citra-repos`) ou « Livraison ? » (`cap12/v6-bouteilles`). L'IA dicte la priorité, et le vrai choix (quelle offre, avant le 15) passe derrière.

**Nouveau.**
- « Maintenant », une grosse action et un gros ✓ se comprennent sans explication.
- Les repères de rangée (🔎 💰 ⚠️ 🔢 et le ☐ seul) et « 4 ↩ » restent à deviner.
- Il ne sait pas ce que fait ⏭ : plus tard ou suivante ?

Problèmes :
1. **B** : sur le pilsner réglé, le héros dit « Autre fournisseur, maintenant » pour une chose déjà commandée (`cap12/v6-pilsner`).
2. **B** : une question de l'IA est en héros, devant le vrai choix (`cap12/v6-bouteilles` : « Livraison ? » ; `cap12/v6-citra` : « Prix ? »).
3. **B** : la date de la tâche n'est pas dans le héros : « samedi 6 déc. au matin » (`cap12/v6-cave`), « lundi » (`cap12/v6-bar`). L'échéance et l'événement n'ont pas de compte à rebours (`cap12/v6-assurance` : « 31 déc. » en pastille au lieu de « J-36 » ; `cap12/v6-fete` : « avant mars »). Cela va contre FRISE-GENERIQUE.
4. **m** : le héros prend 41 % de la hauteur ; une icône de 95 px pourrait passer à 48 px.
5. **m** : les bouteilles débordent sous le champ « Ajouter » (`cap12/v6-bouteilles`).
6. **m** : la rangée 🔢 « chiffres » est fourre-tout et répète le 150 CHF de l'option (`cap12/v6-ecoulement`).
7. **m** : la liste de la fête est en 4 pastilles ☐ serrées, avec un ☐ seul comme repère de rangée qui se lit comme une case à cocher (`cap12/v6-fete`, `v6-cave`).

À greffer :
- le **héros** « une chose » avec ✓ et ⏭ ;
- les **rangées à repère** ;
- la **pile Aide 1/3** ;
- le **coin d'avancement** ⚖️›✋›📦 propre à l'achat (`cap/v6-citra-repos`).

Notes : UX 7, IA 6, Nouveau 7, soit **6,7/10**.

---

## Classement

1. **v6 (6,7)** : la seule qui réponde à « quoi faire maintenant » en 2 secondes sur 12 cas. Ses défauts se corrigent par des règles : héros jamais pour l'IA, état réglé, date et compte à rebours. Rien n'est à redessiner.
2. **v3 (5,8)** : le meilleur comparateur (sur le dessin à la main) et la meilleure bulle de ligne. Le chemin lui-même coûte de la place et ment par ses icônes.
3. **v2 (5,2)** : le gros chiffre et la feuille Aide sont excellents. La grille carrée gaspille et déborde.
4. **v1 (5)** : un beau dessin et un anneau de statut utile, mais pas de prochaine action, et ça casse au-delà de 8 éléments.
5. **v5 (4,3)** : des mots clairs pour le nouveau venu, mais 3 colonnes à 390 px, c'est 2/3 de vide.
6. **v4 (3,5)** : le feu ment dans 9 cas sur 12. Pire, il ment avec autorité.

## À écarter (sous 6 chez moi)

- **v4 et v5 : à écarter.** Le genre lui-même est en cause (lampes fixes, colonnes à 120 px) ; une correction ne le sauve pas.
- **v1, v2 et v3** sont aussi sous 6. Je les garde comme **donneuses de greffes** pour ce tour (anneau, gros chiffre, tableau, bulle). Si aucune ne passe 6 au tour 2, la règle les écarte.

## Recette de la meilleure combinaison (mécanisme → source)

| Mécanisme | Source | Règle de greffe |
|---|---|---|
| Héros « une chose maintenant », avec ✓ (80 px, sous le pouce) et ⏭ | v6 | Le héros est toujours **une tâche du brasseur**, jamais une question de l'IA. Icône de 48 px au lieu de 95 px, et 30 % de hauteur au plus. ⏭ porte « plus tard » en infobulle |
| État **Réglé** | aucune (nouveau) | Si le carnet est résolu, le héros devient « ✓ Réglé » en vert, avec la chose faite (« 2 sacs commandés ») ; le reste est replié |
| Date de la tâche et compte à rebours | aucune (nouveau), avancement de v6 | Une puce dans le héros : « sam. 6 déc. », « lundi », « J-36 » (échéance), « dans 97 j » (événement). Pas de pastille ⏳ isolée |
| Rangées à repère (🔎 pistes, 💰 options, 🔢 chiffres) | v6 | Un mot discret par repère au premier usage, pour le nouveau venu (« à vérifier », « à faire », « fait », mots repris de v5). Pas de ☐ seul comme repère |
| Anneau ✓n ?n (trouvé / à vérifier) | v1 | En petite pastille, dans le coin du héros, pour un carnet de type problème |
| Coin d'avancement propre au genre | v6 (achat ⚖️›✋›📦) | Achat : comparé › choisi › commandé ; problème : l'anneau ; mémo : rien |
| Tableau « qui gagne quoi » | v3 (`cap/v3-citra-repos`) | Rendu souple à N articles (colonnes, ou cartes en défilement horizontal au-delà de 3), case gagnante en vert et 👑 par critère |
| Gros chiffre clé | v2 | Plafonné à une ligne et à 32 px. Jamais de mot coupé |
| Inconnu hachuré | v2 et v4 | Hachuré violet, jamais de barre pleine sous un « ? » |
| Option qui garde son titre | aucune (nouveau) | « Changer le joint ? », et pas « 🔧 ? ». Le coût est une puce optionnelle |
| Bulle de ligne sur place | v3 | Ajouter, pour une proposition de l'IA : **✕ Retirer** et **＋ Garder**, et le mot « proposé par l'IA » ✨ |
| Aide une chose à la fois, avec ✕ et ＋ | v6 (pile 1/3) et v2 (feuille) | Pile au repos, feuille en option |
| Marque de l'IA | v1 et v3 (pointillé violet) | Ajouter ✨ sur chaque élément de l'IA. ★ IA (conseillé) et ☆ brasseur (retenu) en deux formes distinctes |
| IA absente | aucune (nouveau) | La vue se rend depuis ses notes seules. Le bouton Aide grisé avec ⟳ suffit ; pas d'écran vide |
| En-tête d'une ligne avec ⓘ | toutes | À garder tel quel |
