# pa1d — passe 4 de pa1 (froide) : p3c-3 affinée, un seul compte

Base : `plateau/v2/pa1c/`, non touchée ; ce qui en reste est décrit dans sa NOTE :
- aucun menu déroulant (D350) ;
- « au centime » seulement si le calcul ne tombe pas juste (D351) ;
- les unités au même bord droit (D352) ;
- l'onglet rouge « unité ? » qui s'ouvre sur ses cinq cases de 44 px, avec « × 6,20 = 6,20 » sur la ligne des champs ;
- le bis par défaut, dit une fois, avec ses concordances ; « Nouvel article · ≠ doublon de Citra » en rouge ;
- « extrait · Supprimer » discrets ;
- la maquette p3c-3 : rangée dans la liste groupée, segment de nature, « relié ⇄ Retirer », mouture « Rattacher », pied
  Catégorie | Papier + Confirmer.

Fichiers : sources dans `src/` ; `construire.mjs` écrit `etat.html` (préfixe `pa1d-`) ; `captures.mjs` écrit les captures.

États :
- `?etat=a` à `f` ou `repos`, et `&theme=cave` : c'est ce que lisent les contrôles du lot.
- `#a` à `#f`, suffixe `-cave` : c'est ce que pose un toucher, et le dièse prime.
- `?etat=repos` rend la liste fermée, aucune ligne ouverte (vérifié dans Chrome). Avant cette passe, pa1c ne lisait que le dièse :
  les contrôles par `?etat=` y voyaient toujours le plateau de Citra ouvert.

Captures :
- `pa1d-{repos,a,b,c,d,e,f}.png` (390 × 844, clair) ;
- `pa1d-b-sombre.png`, `pa1d-d-sombre.png` ;
- `pa1d-1280-b.png`, `pa1d-1280-repos.png`.

Ouvertes : b, c, e, d-sombre.

## Passe 4

### Un seul compte (correction du critique, comme pu4c)
- Le récap dit « 1 à contrôler » (Citra) et « 1 à remplir » (Lactose). La mouture a sa propre pastille, « ↳ 1 mouture ».
- Sous les pastilles, au récap, « 2 à régler · Suivante : Citra › ». Quand Citra est ouvert : « 1 sur 2 · Suivante : Lactose › ».
  Quand Lactose est ouvert : « 2 sur 2 · Suivante : Citra › ».

### D353, « Pas d'unité pour un objet ? Comment avec avec stk ? »
- Chaque choix d'unité offre la pièce, en un toucher, sans menu :
  - Kg | g | pièce (malts, sucres) ;
  - g | Kg | pièce (houblons) ;
  - sachet | g | pièce (levures) ;
  - pièce | L (nettoyage).
- Le Détartrant garde l'imprimé « DURGOL EXPRESS 1 Stk » ; l'unité lue est « pièce », sélectionnée (capture c).
- L'extrait de la page montre aussi « 1 Stk ».
- Pour que trois unités tiennent sur la ligne des champs, un champ prend la largeur de sa valeur (chiffres de 16 px). Mesuré dans
  Chrome : la ligne fait 32 px de haut dans les cas a à e, et aucune valeur n'est rognée.
- Je n'ai pas mis la case « … » : la pièce couvre le cas « objet », et une case qui déplie une liste frôle D350.

### D354, « on voit toujours un changement de relecture alors que en théorie on a tout accepté ? »
- Partout sauf en e, la 3e lecture est acceptée. La rangée Safale est nette, « 3 sachets × 4,90 », sans bleu ni barré, et la pastille
  « 1 corrigée » quitte le récap.
- En e seul, avant acceptation, la marque de d-lue reste. On y voit :
  - le « 3 sachets » bleu, et « 2 sachets × 4,90 » barré ;
  - le « − 3 + » bleu ;
  - « 1re lecture 2 · 3e lecture 3 » ;
  - « Revenir à 2 », qui est le geste attendu.

### D355, « Ça parle d'un autre item sur le détail d'un ? »
- Le pied du plateau ne garde que « extrait · Supprimer ». Aucune autre ligne n'est nommée dans le détail d'une ligne.
- Le compte et la suivante sont au récap, au-dessus de la liste.

### À signaler
Quand une ligne est ouverte à 390, le récap défile hors de l'écran. Pour passer à la suivante, il faut remonter. Captures : `pa1d-c.png`,
`pa1d-e.png`. Ce n'est pas le cas à 1280, où le récap reste à gauche.

## Contrôles (02.11, passe 4)
- `controle-sans-menu.mjs` : **MENU OK**, 7 états, en clair et en `--theme cave`.
- `controle-plateau-ligne.mjs` : **LIGNE OK**, 7 états, en clair et en cave (« pièce offerte, aucun barré sans geste, aucune autre ligne
  nommée »). Témoin : sur `v2/pa1c`, **LIGNE ECHEC (21)**.
- `controle-commun --profil=sans-houblons --sans-lignes` : **COMMUN OK**.
- `controle-contraste --profil=sans-houblons` : **CONTRASTE OK**, pire valeur 5,27:1.
- `verifier-page --min-images 0` : **PAGE OK**.
- `captures.mjs` : **CAPTURES OK**.
  - Dans les six cas, le plateau tient entre la rangée et le pied.
  - Aucun texte sous 12 px, aucune cible sous 24 px.
  - Aucun `type="number"`, aucune requête réseau.
