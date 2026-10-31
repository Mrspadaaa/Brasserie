# Voie p7 — la recherche du champ d'ajout : sous le champ, dans la liste, ou en menu

- Mission : 2026-10-31-ecran-fermentescibles
- Agent : concepteur
- Modèle : opus
- Niveau : interface (ce que le brasseur verra)
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : son choix **p6-b2** (`v6/p6-b2/etat.html`, D220) ; contrôle `controle-recherche.mjs`
- Décideur en cas de doute : pilote ; la règle est `v6/p6-b2/etat.html` telle quelle, plus ce qui est écrit ici

## Ses mots
Sur la capture de p6-b2 (la barre de Pilsner tirée à 7,0 kg) : « Oui ça c'est bien, et maintenant la recherche, comment elle s'affiche ?
Dans la liste ? » (D220). Aujourd'hui, taper dans « Nom (et kg), Entrée » filtre des puces sous le champ (5 au plus) ; un nom déjà dans la
recette dit « déjà 5,0 kg » ; rien trouvé → « Créer « … » ». Jamais dans la liste. Et « Munich », le nom courant du malt, ne trouve pas
Münchner Malz : Entrée crée une ligne « Munich » (le doublon que le port devait éviter). Captures : `choix-v6/img/recherche-{pils,mu,munich}.png`.

## Objectif
Trois variantes copiées de `v6/p6-b2/etat.html`, qui gardent tout et ne changent que l'affichage de la recherche :
- **`v7/s1/etat.html` — sous le champ** : les puces d'aujourd'hui, mieux faites pour choisir (ce qui distingue deux malts proches, par
  exemple la teinte en EBC ; le stock seulement en icône, L04), dans l'ordre utile ;
- **`v7/s2/etat.html` — dans la liste** : en tapant, les résultats apparaissent dans le ticket lui-même, à la place où la ligne viendra
  (lignes fantômes, à peine marquées) ; un toucher en fait une vraie ligne ; un nom déjà dans la recette éclaire sa ligne existante au lieu
  d'en proposer une seconde ; « Créer » est la dernière ligne fantôme ;
- **`v7/s3/etat.html` — menu ancré** : une liste courte collée au champ (au-dessus si le clavier couvre le dessous), une rangée par malt.

Dans les trois : un **alias** trouve le malt par son nom courant (« Munich » → Münchner Malz, « Pils » → Pilsner Malz, « Pale » → Pale Ale
Malz, « Weizen » / « Wheat » → Weizenmalz hell, « Cara » → Carapils ; table courte et dite dans NOTE.md) ; Entrée prend le premier résultat,
et l'aperçu du champ le dit avant ; « cara 0,3 » donne la masse ; rien trouvé → « Créer ». La bascule des familles (Grain ⇄) reste.
Rôles : chaque résultat `data-role="resultat"` avec `data-nom` (le nom exact de la ligne qu'il ajoute) ; déjà là : `data-deja` et la masse
dans son texte ; créer : `data-role="creer"`. Lire `controle-recherche.mjs` avant de construire.

## Précisions
- Le clavier du téléphone couvre environ 300 px du bas : un résultat utile se voit au-dessus (le contrôle le mesure). À 1280, pas de clavier.
- Le premier plan au repos ne change pas : rien de la recherche ne se voit tant qu'on n'a rien tapé, sauf les sacs habituels d'aujourd'hui
  (s1 et s3 peuvent les garder ; s2 peut les montrer en lignes fantômes au toucher du champ, à toi de juger).
- Assemble par split/join ou par indices, classes préfixées `p7s1-`, `p7s2-`, `p7s3-`, script dans une fonction immédiate (L26).
- `capturer.mjs` : copie `v6/p6-b2/capturer.mjs` et adapte-le.

## À garder (règle n° 1, acquis)
Tout `v6/p6-b2/etat.html` : la barre de chaque ligne qui porte la masse (D219, D220), le moment sans pilule (forme m1, D218) et son cycle
avec « Annuler », la part et la couleur sur la ligne (D211), le plateau clair toujours visible (D212), en-tête, fil, bandeau, pied,
+ flottant, sucre en ligne du ticket, teinte en dégradé, OG en piste, la famille figée sur la ligne, la masse à zéro à l'ajout puis le
focus sur la masse, le parcours au clavier (Tab, Entrée, Échap) ; jamais `type="number"` ; aucun texte sous 12 px ; cibles de 24 px au moins
sans chevauchement ; 80 mots au plus au premier écran, 1,05 écran au plus avec 8 grains ; pas de cockpit, aucune phrase d'aide au repos.
Plancher à enrichir (L07).

## Entrées (lire seulement ça)
- `work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b2/etat.html` (ta base), `capturer.mjs`, `p6-b2-barre-pendant.png`.
- `work/missions/2026-10-31-ecran-fermentescibles/choix-v6/img/recherche-pils.png`, `recherche-mu.png`, `recherche-munich.png`.
- `work/missions/2026-10-31-ecran-fermentescibles/controle-recherche.mjs`, `controle-masse-ligne.mjs`, `controle-moment-ligne.mjs`.
- `work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs`, `controle-gestes-ligne.mjs` (les rôles qu'ils lisent).
- `DESIGN.md` (rayons, tailles), `docs/ui-compacte.md`.

## Possède (seuls chemins où écrire, un par ligne)
- `work/missions/2026-10-31-ecran-fermentescibles/v7/s1/`
- `work/missions/2026-10-31-ecran-fermentescibles/v7/s2/`
- `work/missions/2026-10-31-ecran-fermentescibles/v7/s3/`
- `work/missions/2026-10-31-ecran-fermentescibles/voies/p7/COMPRIS.md`
- `work/missions/2026-10-31-ecran-fermentescibles/voies/p7/RESULTAT.md`

Interdits : `v3/` à `v6/` (sa maquette choisie reste telle quelle), les contrôles (`controle-*.mjs` de la mission et de `tournoi/outils/`),
`ecrans.json`, `ecrans-app.json`, `src/`, `functions/`, `.codex/`, le manifeste. Pas de serveur dans `C:/Users/mrspa/Documents/Brasserie`,
pas de `git stash`, aucun commit. Un contrôle qui te paraît faux : ne le contourne pas, écris `CONTRÔLE ? <ce qui cloche>` dans RESULTAT.md.

## D'abord
Écris `voies/p7/COMPRIS.md` (parties : Objectif, Écrit dans, Fini quand, Ne fait pas, Doutes), puis lance G1. Ensuite seulement, construis.

## Captures (dans chaque dossier, à ouvrir en image, L12)
À 390 : repos ; « mu » pendant ; « Munich » pendant ; « pils » pendant ; « Abbey Malt » pendant ; après le toucher sur Münchner Malz ;
à 1280 : « mu » pendant. Pour « pendant », une capture de la page entière et une recadrée sur le champ et ses résultats. Un `capturer.mjs`
par variante, qui imprime `CAPTURES OK`.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` : ligne 1 `OK — s1, s2, s3 : RECHERCHE OK, MASSE OK, VOLEE OK` ou `ECHEC — …` ; par variante, la forme et ses captures
ouvertes ; la table d'alias ; ce que tu jugerais, en brasseur, entre les trois ; « D220 », « Munich » et « Dans la liste » cités ;
`LEÇON PROPOSÉE : …` ou `aucune`. Une ligne au pilote.
