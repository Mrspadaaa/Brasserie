# Critique calibrée — r2-radar-lisible (26.10)

ECHEC — rejeté : Comparer en Absolu rejoue D180 dans l'autre sens (cinq tiretés en rayons du contour bas jusqu'au bord, et trois cordes encore à 27–30 % du centre) ; Substituer, la fiche et Ma bière sont bons et déployables.

Captures ouvertes en image, avant et après : Substituer, Comparer Au style, Comparer Absolu, Ma bière, fiche ;
sa capture `brasseur-radar-tirets-lotus.jpg` ; sa maquette choisie `fils25-comparer/captures/cmc2k.png` ; `bilan-avant.json`
et `bilan-apres.json` (diff lu : les cordes `line` deviennent des `path`, points 6 → 9,2 px, 8 → 10 px).

## 1. Les plaintes sont-elles corrigées ?

- **« si les traits haché traversent graph, ça enlève de la visibilité »** (D180)
  - Substituer (sa capture) : **oui**. La corde baies → noyau qui coupait le radar en deux est partie ; les trois tiretés
    longent le bord hachuré, chacun à son liseré. L'intérieur est dégagé. Sa phrase : « ok là c'est bon, on voit le graph ».
  - Fiche : **oui**. Le tireté suit le bord du secteur « sans donnée » au lieu de barrer le contour.
  - Ma bière : **oui**. Le tireté résineux → végétal contourne les secteurs « pas goûté » hachurés : il reste collé à de
    l'inconnu, ce qui se lit bien.
  - Comparer Au style : **à moitié**. Le bas est propre (plus de corde pépins → noyau, plus de diagonale melon → tropicaux
    à travers le centre). Mais en haut à gauche, quatre ou cinq cordes droites (melon → floral, melon → herbacé, baies →
    floral, à 65–87 % du rayon selon le bilan) traversent encore le quart supérieur et se croisent. Elles étaient déjà là
    avant ; le contrôle à 30 % les laisse passer. Sa phrase : « c'est mieux mais là en haut il y en a encore qui traversent ».
    Mitigé, pas rejet : ce sont les inconnus isolés de D147 (sa cmc2k les avait pareils).
  - Comparer Absolu : **non, régression**. Avant : un petit contour serré au centre (valeurs 2 à 5 sur 12,5), trois courtes
    cordes à 20–27 %, des « ? » au bord. Après : cinq tiretés partent du contour bas (25–42 % du rayon), montent en rayon
    jusqu'au bord, font le tour, redescendent (floral, herbacé, melon ×2, baies), plus un anneau de trois tiretés
    parallèles tout autour, et il reste trois cordes `line` à 27–30 % du centre (l'exception « 85 % du point bas »). La
    vue est couverte de traits hachés dans les deux sens. Sa phrase : « Non là c'est pire, il y a des traits haché partout ??? ».
    C'est la branche `bas` (cordes basses hors secteur regroupé, option (a) de la DÉCISION) qui produit ces rayons.

- **« Les points bleu sont difficile à voir »** (D181) : **oui**. Points de série à 9,2–10 px avec liseré blanc sur toutes les
  séries ; sur Substituer après, les points bleus de Calypso se détachent du voile vert et du trait noir. Contraste mesuré
  ≥ 3,1:1 sur l'aire des autres séries (bilan). Les anneaux creux de l'original sont inchangés.

## 2. Un acquis est-il perdu ?

- D147 (traits tiretés là où le contour enjambe un inconnu) : **tenu**. Les tiretés existent toujours, ils changent de chemin.
  Trait plein entre voisins connus, pastille « ? » au bord, jamais de point sur l'inconnu : inchangés.
- rdg1/rdg5 + cmc2k (grammaire Beer Maverick, 12 axes, secteur « sans donnée » regroupé, échelle au moment, Absolu à un
  toucher) : **tenu**. Le premier écran de Comparer est celui de cmc2k, seul le dessin du tireté change.
- Rien d'autre ne bouge (voiles, couleurs, anneaux, légende de Substituer).

## 3. Défauts bloquants ?

- Chevauchement : au bord de Comparer Au style, l'anneau de trois tiretés passe sous les pastilles « ? » de pépins et de
  noyau ; les pastilles sont dessinées par-dessus, ça reste lisible. Non bloquant.
- Texte trop petit : aucun texte ajouté.
- Cockpit : non.
- Marque illisible : non.
- **Bloquant** : Comparer Absolu, D180 (« si les traits haché traversent graph, ça enlève de la visibilité », DEFAUTS-RECURRENTS
  l. 236). Vérifiable sur `img/comparer-absolu-apres.png` et dans `bilan-apres.json` (`comparer-absolu` : 5 `path` à
  25–42 % + 3 `line` à 27–30 %).

## 4. Déployable ?

- Substituer, fiche, Ma bière, Comparer Au style : **oui**, c'est un gain net sur sa capture, et aucun choix n'est perdu.
- Comparer Absolu : **non en l'état**. Correction attendue, au choix du pilote :
  - (b) retirer la branche `bas` de `RadarBase.tsx` (3 lignes, l. 246–249) : Absolu redevient l'avant (cordes courtes au
    centre) et seul le secteur regroupé est longé. Coût : Ma bière retrouve sa corde à 16 % à travers le centre, et le contrôle
    « aucun tireté à moins de 30 % » ne tient plus sur Ma bière et Absolu.
  - **Recommandé** : garder la branche `bas` mais changer son chemin. Une corde basse hors secteur regroupé ne monte pas au bord :
    elle suit l'anneau au rayon du plus bas des deux points (arc à r = min(rA, rB), sans l'aller-retour radial). Sur Absolu, le
    contour reste compact autour du centre ; sur Ma bière, l'arc contourne les secteurs hachurés sans toucher le bord. Le
    contrôle à 30 % reste valable tel quel (le seuil « 85 % du point bas » garde son sens). `cheminAutour` a déjà l'arc au
    même rayon : il suffit de ne pas aller au bord quand `tourSecteur` est faux.
  - Dans les deux cas, rejouer `controle-radar-lisible.mjs` et rouvrir `comparer-absolu-apres.png` et `ma-biere-apres.png`.
- Signal (non bloquant) : sur Comparer Au style, les cordes droites de 65 à 87 % en haut à gauche restent un endroit qu'il
  pointera. Piste pour une passe suivante : même arc d'anneau pour une corde qui enjambe deux axes inconnus ou plus.

## Verdict par écran

- **substituer** (Lotus contre Solero et Calypso) — ACCEPTÉ. « ok là c'est bon, on voit le graph ».
- **fiche** — ACCEPTÉ. « très bien ».
- **ma-biere** — ACCEPTÉ. « pas mal ».
- **comparer-style** — ACCEPTÉ, mitigé. « c'est mieux mais là en haut il y en a encore qui traversent ».
- **comparer-absolu** — REJET : D180 rejoué en rayons (5 tiretés du contour au bord) et 3 cordes encore à 27–30 % du centre.
  « Non là c'est pire, il y a des traits haché partout ??? ». Correction : arc d'anneau pour les cordes basses hors secteur
  regroupé, ou retrait de la branche `bas` (option b).

LEÇON PROPOSÉE : un contrôle « aucun trait à moins de 30 % du centre » ne dit rien d'un trait qui part vers le bord ; une
correction de lisibilité se juge sur toutes les vues du composant, l'Absolu compris, avant de choisir entre (a) et (b).
