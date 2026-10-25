# Lot « Comparer, depuis la maquette jouable » (25.10)

## Sa demande, mot pour mot (25.10, sur la planche r6a++ qui partait de r6a)
« Mais elle a rien que j'ai demandé. Je veux partir de la version de base, celle sur la maquette jouable et il faut l'améliorer avec
mes commentaires. Notamment le fait que les style hors 16d soit bien montré. Mais surtout pouvoir choisir quand comparé. 60' 10'
dryhopping... L'ajout des huiles aussi est bien. Mais ça couvre pas tout. Il y a aussi un peu trop de text inutile... Refait une série
avec ça et mes commentaires sur toutes les maquettes comparé et mes commentaires sur la maquette de base sur cette vue »

## La base : l'écran Comparer de la maquette jouable, tel qu'il se joue
- La page : `prototypes/houblons-v4/maquettes/parcours-cmp-base/comparer/etat.html` (construite le 25.10, figée pour ce lot ; ne la
  reconstruis pas). Son code : `prototypes/houblons-v4/parcours/src/ecrans/comparer/` (lecture).
- Ses captures : `captures/base-jouable.png` (premier écran) et `captures/base-jouable-long.png` (toute la page). **Ouvre-les.**
- **Sa capture, mot pour mot « C'est celle là la base de reprise »** (25.10, la maquette publiée sur son téléphone, Comparer (2) : Motueka
  face à Nelson Sauvin, le bas de page : « ses mots », Biotransformation, Enchaîner, Panel OSU, « Motueka devant Nelson Sauvin », Placer,
  la barre Défi · Égaler · Valeurs · Preuve · Frise · Souche) : `captures/brasseur-base-reprise.jpg`. Cet état (deux houblons, Motueka et
  Nelson Sauvin) est aussi à montrer pour chaque variante (`captures/<id>-nelson.png`).
- Ce qu'elle a et qui reste (règle n° 1, plancher à enrichir, L07) : les trois colonnes Cascade · Idaho 7 · Galaxy avec α et rôle,
  « Ta stout » trop / plus et la référence en pointillé (Nugget), le radar r2 « Au style | Absolu », les rangées des familles, les
  étapes 60′ · 10′ · dry hop d'une famille (« Face à ta stout, par floral »), ⇄ remplacer et × retirer sous chaque tête, ＋ ajouter
  avec recherche (D137), « lui seul » hors 16D en tête de colonne (D130), « ~ simulé », « Placer Idaho 7 › ».

## Ce qu'il demande, et rien ne s'en retire
1. **Surtout : choisir quand comparer** : 60′, 10′, whirlpool, dry hop (actif, après…). Un toucher sur un moment change ce que
   montrent les colonnes, les rangées des familles et le radar ; le moment choisi se lit d'un coup d'œil. Ses mots d'avant :
   « il manque juste la partie de pouvoir choisir quand comparé » (sur r6a) ; « je voulais comparé au moins : les étapes 60' 10'
   dryhopping ect comme la maquette de base. Et aussi le houblon de base ou bière de base » (D107).
2. **Les styles hors 16D bien montrés** : ce que chaque houblon dit en plus de ses familles (« lui seul »), et le mot précis dans une
   famille (D130, D131 ter) : « Les type spéciaux des houblons hors 16d ! C'est très important surtout dans la comparaison !!!! ».
3. **Les huiles** : « L'ajout des huiles aussi est bien » (rpz2 de r6a++ : l'huile totale mesurée, Galaxy cinq fois Saaz ; « un moyen
   de différencier un houblon hyper aromatique type Galaxy d'un houblons plus "fade" type saaz » ; « il faut aussi que on voit comme il
   faut les différence ! », D131).
4. **Moins de texte inutile** : la base a 114 mots au premier écran ; **100 au plus**. « Ses mots » : « Vue à revoir mais ce texte là
   est inutile » ; le panel OSU : « Beaucoup trop mis en avant ».
5. **Tous ses commentaires sur Comparer** : relis-les dans `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (`grep -n -i compar` : lignes 24
   à 580 environ ; notamment le radar r2 « À revoir, on va en parler » et « très compliqué à voir les différence avec les cileur sur le
   spider graph », Beer Maverick « il faut faire mieux, pas moins bien », la frise de y1b et les trois plans de w2 « vraiment très
   intéressant », la cuve de x3b « ma bière de base -> 1 dry hop, 2 dry hop: levure », « ~ simulé », retirer, remplacer, chercher).
   La planche r6a++ (`ecran-1/fils24-r6a-plus/`, verdicts dans `critique/VERDICTS.md`) a de bonnes greffes (rpb1 le moment choisi,
   rpz4 l'écart chiffré, rpb3 la frise, rpz2 les huiles), mais **elle partait de r6a** : reprends ses idées sur la base jouable.

## Obligatoire, et rien d'autre
- La base jouable au premier plan, ses fonctions comprises (⇄ × ＋ recherche, étapes, référence, radar, « lui seul ») ; chaque greffe
  nommée sur l'élément ajouté (`data-greffe="<nom>"`).
- Le moment se choisit : un élément `[data-role="quand-comparer"]` qui porte les moments (au moins 60′, 10′ et un dry hop) ; toucher un
  autre moment change les valeurs comparées (contrôle `controle-quand-comparer.mjs`, écrit en parallèle par la voie cm-quand).
- La baseline (pictos au trait des 12 familles, couleurs, thème clair D106) ; vraies valeurs du moteur de la maquette, l'inconnu en
  « ? », jamais 0 ; téléphone 390 × 844 ; ≤ 100 mots au premier écran.

## Chaque variante rend
`<id>/etat.html` (une page jouable : le toucher sur un moment, ⇄, × et ＋ marchent) ; `<id>/NOTE.md` (chaleur, greffes, ce qui tient,
ce qui casse) ; `captures/<id>.png` (390 × 844), `captures/<id>-moment.png` (un autre moment choisi) et `captures/<id>-long.png` (toute la
page). Ouvre tes captures (L12). Une idée par variante (M14). Classes préfixées par ton id, script dans une fonction immédiate (L26).
