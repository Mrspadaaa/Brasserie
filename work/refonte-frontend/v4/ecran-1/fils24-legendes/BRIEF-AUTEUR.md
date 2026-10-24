# Lot « les légendes sous les pastilles » (24.10, soir)

## Ses mots, mot pour mot (commentaires sur la maquette publiée)
Sur la légende d'une carte du rail (« Bande : les 12 familles d'arômes de Nugget, d'après ses fiches ; vive, marquée ; pâle,
citée ; grise, non décrite. ») : « Bien mais mettre la légende juste en dessous des pastilles. Fait moi des mini maquettes de ça
dans un artefacts » ; « Plus utilisé les icône... ». Sur la légende « Ajouts proposés » : « Pareil ici, mini maquettes de
légende ». Sur Motueka dans « Ajouter un houblon » : « Plus utilisé les icône hors 16d ».

## La question
Où et comment se lit la légende des pastilles (la bande des 12 familles d'une carte de houblon : vive, marquée ; pâle, citée ;
grise, non décrite ; et le ◇ des mots hors des 12) : **juste sous les pastilles**, avec **plus d'icônes** (les pictos des
familles, au trait de la baseline) que de mots. Deux endroits : la carte d'un houblon du rail (Nugget à 60′) et une ligne
d'« Ajouter un houblon » (Motueka, « ◇ mojito »).

## Le point de départ (à reprendre tel quel, sauf la légende)
La maquette de ce soir : `prototypes/houblons-v4/maquettes/parcours-sortie/ma-biere/etat.html` (construction de travail) ; le code
des deux légendes : `prototypes/houblons-v4/parcours/src/ecrans/ma-biere/Carte.tsx` (PanneauLegende, « Bande ») et `Ajouter.tsx`
(« Ajouts proposés »). Les pictos et couleurs des 12 familles : `work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html`.

## Obligatoire, et rien d'autre
- La légende juste sous les pastilles, liée à elles d'un coup d'œil ; au repos ou à un toucher (le « ? » existe), à toi de
  proposer, mais rien qui pousse le premier écran plus que nécessaire (« pas de cockpit », mots modérés D41).
- Plus d'icônes que de mots : les pictos au trait des 12 familles, leurs couleurs ; vive / pâle / grise montrées, pas décrites ;
  le ◇ des mots hors des 12 (D130). Aucun symbole neuf pour une famille (`cerveau/produit/pictos-familles.md`).
- Le vrai cas : Nugget (ses familles réelles) et Motueka (« ◇ mojito »), données de `prototypes/houblons-v4/data/pack-fiches.json`.
- Téléphone 390 × 844, thème clair (D106).

## Chaque variante rend
`<id>/etat.html` (la carte de Nugget et la ligne de Motueka avec leur légende ; la légende porte `data-role="legende"`, chaque
picto `data-famille="<famille>"`) ; `<id>/NOTE.md` (chaleur, idée, ce qui tient, ce qui casse) ; `captures/<id>.png` (390 × 844).
Ouvre ta capture (L12).
