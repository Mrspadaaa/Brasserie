# M1 — La feuille « au style » (lot 3, après le constat du brasseur)

Le brasseur, sur les 23 premières maquettes : « il y a toujours énormément d'information
pour rien, beaucoup de text inutile qui ne devrait pas être là en premier plan. Une UI ux
toujours pas très moderne dans les normes et bon usage actuelle. » Mesure : de 166 à 383
mots visibles au premier écran à 390 px. Ce lot corrige la cause : on décide d'abord ce
qui est au premier plan, et tout le reste attend un toucher.

## La tâche, en une question

Gaëtan ouvre sa recette sur son téléphone. **En 5 secondes : ma bière est-elle au style,
et que puis-je faire ?** Ses mots : « ma stout est trop résineuses, je la veux plus
floral » ; « Les échelles doivent être revu en fonction du style ».

## Premier plan (visible sans toucher, à 390 × 844)

Seulement ceci, et rien d'autre :

1. **La bière** : nom, style (code et nom court), et l'amertume en un chiffre avec sa
   petite jauge contre la plage du style (l'IBU reste sur son échelle à part).
2. **La réponse en une ligne** : un verdict d'ensemble court (par exemple « Au style ·
   le modèle ne situe pas 9 familles »). Une ligne, pas un paragraphe.
3. **Les familles qui comptent, dessinées** : celles que le style attend (floral, herbacé,
   terreux pour la stout) et celles qui portent une demande (résine). Pour chacune : la
   bande du style et la plage de la bière **dessinées**, un mot de verdict. Le dessin dit
   la position ; les chiffres attendent un toucher.
4. **Les autres familles, regroupées** en un seul élément qui dit combien elles sont et
   pourquoi en quatre mots au plus (« 8 non situées »), et qui se déplie.
5. **Une action principale** : demander une direction (« plus floral », « moins
   résineux »). Un seul bouton ou geste principal sur l'écran.
6. **Un badge « hypothèse »** sur les échelles, d'un mot, qui ouvre l'explication
   (« échelles au style : hypothèse BJCP, à valider » + source).
7. **La bascule de bière** (stout / lager tchèque) en contrôle segmenté.

## Second plan (à un toucher : feuille de détail, dépliage, info)

Tout le reste : chiffres des bandes et des plages, crans, seuils, repères centraux,
explication du flou du modèle, raison du refus sur la résine (au premier plan, un seul
mot ou signe suffit : « aucune voie »), sources BJCP et fiches, comparaison des trois
houblons de la lager, démonstration « même écart, deux styles ».

## Interdits au premier plan

- paragraphe, phrase de plus d'une ligne, note de bas de page, légende ;
- sources, version du moteur, citation du brasseur ;
- un chiffre que le dessin dit déjà ;
- plus de **60 mots visibles** dans le premier écran à 390 × 844 (mesuré, éliminatoire) ;
- texte anglais, « (s) », point décimal.

## Normes actuelles (ce que « moderne » veut dire ici)

Les conventions des apps mobiles d'aujourd'hui (Apple Human Interface Guidelines,
Material 3), dans le monde visuel de DESIGN.md :

- hiérarchie typographique nette : un titre, une ligne de réponse, des libellés courts ;
- détail à la demande : feuille qui monte du bas (bottom sheet), dépliage, bouton
  d'information ; jamais de mode d'emploi à l'écran ;
- un seul appel à l'action principal, les autres actions en retrait ;
- contrôle segmenté pour les bascules, puces pour les filtres, listes à disclosure ;
- rythme d'espacement régulier (grille de 4 ou 8 px), alignements nets, regroupement en
  cartes ou sections ; la densité vient de l'économie, pas de l'entassement ;
- état et retour immédiats (toucher, glisser, transition courte), mouvement réduit
  respecté ;
- les petites tailles de DESIGN.md restent (12 à 13 px pour les commandes), avec une zone
  tactile suffisante autour.

## Vérité des données (inchangée, éliminatoire)

Aucun chiffre inventé ; une inconnue reste « inconnu », jamais 0 ; pas d'écart plus fin
que les plages ; IBU jamais mêlé aux intensités. **L'honnêteté passe par le dessin** (une
plage floue, un groupe « non situées », un signe) **et par le second plan**, pas par du
texte au premier plan. Une précaution écrite au premier plan coûte des points, elle n'en
rapporte pas.

## Données

`prototypes/houblons-v4/data/pack-mini-protos.json` : S1 (stout 16D) par défaut, S2
(lager 3B) à la bascule. Le modèle situe mal la stout : 9 familles neutres sur 12 ont une
plage large sans repère net. La résine ne peut pas baisser (aucune fiche ne cite Nugget
comme résineux). En S2, les trois houblons sont « ≈ » partout.

## Sortie

`work/refonte-frontend/v4/tournoi/M1/pNN/index.html` et `NOTE.md` (5 lignes au plus).
Contrôles, une fois chacun, avant de t'arrêter :

- `node work/refonte-frontend/v4/tournoi/outils/capture.mjs work/refonte-frontend/v4/tournoi/M1 pNN [pMM]`
- `node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/tournoi/M1 pNN [pMM] --max=60` doit imprimer `MOTS OK`.

Regarde tes captures `M1/captures/pNN-390.png` et `pNN-1280.png`, corrige, puis arrête-toi.
