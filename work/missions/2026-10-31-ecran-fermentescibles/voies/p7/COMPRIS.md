# COMPRIS — voie p7

## Objectif
D220, sur la barre de Pilsner tirée à 7,0 kg (p6-b2) : « Oui ça c'est bien, et maintenant la recherche, comment elle s'affiche ?
Dans la liste ? ». Trois variantes copiées de `v6/p6-b2/etat.html`, qui gardent tout et ne changent que l'affichage de la recherche
du champ « Nom (et kg), Entrée » :
- `v7/s1/etat.html` — sous le champ : les puces d'aujourd'hui, mieux faites pour choisir (la teinte en EBC qui sépare deux malts
  proches, le stock seulement en icône), dans l'ordre utile ;
- `v7/s2/etat.html` — dans la liste : les résultats sont des lignes fantômes du ticket, à la place où la ligne viendra ; un toucher
  en fait une vraie ligne ; un nom déjà là éclaire sa ligne existante ; « Créer » est la dernière ligne fantôme ;
- `v7/s3/etat.html` — menu ancré : une liste courte collée au champ (au-dessus si le clavier couvre le dessous), une rangée par malt.
Dans les trois : un alias trouve le malt par son nom courant (« Munich » → Münchner Malz, « Pils » → Pilsner Malz, « Pale » → Pale
Ale Malz, « Weizen » / « Wheat » → Weizenmalz hell, « Cara » → Carapils), Entrée prend le premier résultat et l'aperçu du champ le
dit avant ; « cara 0,3 » donne la masse ; rien trouvé → « Créer » ; la bascule des familles reste. Rôles : `data-role="resultat"`
+ `data-nom`, `data-deja` (texte avec la masse), `data-role="creer"`.

## Écrit dans
- `work/missions/2026-10-31-ecran-fermentescibles/v7/s1/` (etat.html, NOTE.md, capturer.mjs, captures)
- `work/missions/2026-10-31-ecran-fermentescibles/v7/s2/` (idem)
- `work/missions/2026-10-31-ecran-fermentescibles/v7/s3/` (idem)
- `work/missions/2026-10-31-ecran-fermentescibles/voies/p7/COMPRIS.md`
- `work/missions/2026-10-31-ecran-fermentescibles/voies/p7/RESULTAT.md`

## Fini quand
G1 à G35 de GATES.md rendent leur jeton : pour chacune des trois, RECHERCHE OK, MASSE OK, MOMENT OK, VOLEE OK, GESTES OK, PAGE OK,
MOTS OK (80 au plus), COMMUN OK, CONTRASTE OK, HAUTEUR OK, CAPTURES OK ; puis NOTE OK sur RESULTAT.md. Captures ouvertes et jugées
(390 : repos ; « mu », « Munich », « pils », « Abbey Malt » pendant, page entière et recadrée ; après le toucher sur Münchner Malz ;
1280 : « mu » pendant), chacune à côté de `p6-b2-repos.png` pour le repos.

## Ne fait pas
Ne touche ni `v3/` à `v6/`, ni aucun contrôle, ni `ecrans.json`, `ecrans-app.json`, `src/`, `functions/`, `.codex/`, le manifeste ;
pas de serveur dans `Documents/Brasserie`, pas de stash, pas de commit. Ne change rien d'autre que la recherche : barre-masse (D219),
moment m1 (D218), part et couleur sur la ligne (D211), plateau toujours visible (D212), en-tête, fil, bandeau, pied, + flottant,
ajout à 0 puis focus sur la masse, Tab/Entrée/Échap restent tels quels. Aucun texte ajouté au repos, aucune phrase d'aide.

## Doutes
- Le stock de la base n'a que des noms. Pour « ce qui distingue deux malts proches », je lui donne une teinte (valeurs typiques de
  fiche malterie) et un niveau de sac, et j'ajoute deux malts proches (Carahell, Caramünch II) pour que la teinte serve vraiment.
  Les lignes déjà dans la recette restent « ? » comme dans la base ; un malt ajouté depuis le stock prend sa teinte. Dit en NOTE.
- Le sac des puces au repos prend la teinte du stock (même forme, mêmes mots) : seul écart visible au repos, dit en NOTE.
- s2 : le contrôle compte les lignes par `[data-sel]` ; les lignes fantômes n'en ont pas. Le champ ne doit pas sauter pendant la
  frappe : la page compense le défilement pour qu'il reste sous le doigt.
- s2, « déjà là » : l'élément `data-deja` doit dire « 5,0 » en texte ; la masse de la ligne est un champ (sa valeur n'est pas du
  texte). Une étiquette « déjà 5,0 kg » vient donc sur la ligne éclairée, à la place de la part, le temps de la recherche.
