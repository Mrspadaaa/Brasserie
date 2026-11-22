# pa2 — tiède : la file des propositions, le sûr en pastilles

**L'idée.** Le plateau ne montre en grand que ce qui demande son geste : une carte par proposition (article, unité, quantité
corrigée, mouture), avec sa valeur, sa raison et « Accepter » ; ce qui est sûr tombe en pastilles cochées (« ✓ Unité g »,
« ✓ Nature Ingrédient › Houblons »), chacune se rouvre au toucher. La barre noire de p3c-3 compte la file (« 4 à régler · 2/4 »)
et ‹ › passe au point suivant, sur sa rangée même. Le calcul tient en une barre de quatre cases.

Page : `etat.html#a` … `#f`, `#repos`, `-cave`. Captures : `pa2-<cas>.png`, `pa2-b-sombre.png`, `pa2-d-sombre.png`, `pa2-1280-b.png`.

## Baseline (p3c-3 et ses voisins)
- [x] « imprimé » : la ligne de tête du plateau (« « Citra 12.5% » »), avec extrait et corbeille en icônes
- [x] quantité, unité, × prix = montant sur une ligne : une barre de quatre cases au lieu de quatre champs (écart de forme, même
  ligne : moins de bords, la case fautive se colore seule)
- [x] « ✓ au centime » au bout de la barre
- [~] segment Ingrédient · Service · Matériel : **écart**, replié dans la pastille Nature (sûr) ; il s'ouvre avec le type fin (f).
  Raison : la nature est presque toujours sûre ; la garder en grand rejoue « une chose de plus à lire ».
- [x] article « relié » (pastille) ; ⇄ et Retirer passent par le toucher de la pastille (écart de forme)
- [x] mouture « Rattacher » : une proposition de la file (a)
- [x] plateau dans la rangée, bande, filet, pied · [x] B du nom · [x] d-lue (carte bleue, « Garder » / « Revenir à 2 ») · [x] D277
- La barre noire est celle du filtre de p3c-3 ; elle porte ici la file et la porte vers la ligne fautive (« jamais sur l'item »).

## Honnêteté
« Citra bis » proposé, raison « même variété, autre α : 13,1 au stock (récolte 2024) » ; « Nouvel article · doublon » en rouge
pointillé ; « Relire la ligne par l'IA · ≈ 1 ct » dit son coût (d). Rien de créé avant Confirmer.

## Contrôles (joués une fois, 02.11)
- `controle-commun --profil=sans-houblons --sans=mots` : **COMMUN OK**
- `mots-premier-ecran --profil=sans-houblons` : 141 mots (cas b, au-dessus de 98)
- `controle-contraste` : CONTRASTE OK, pire 5,24:1 · `verifier-page --min-images 0` : PAGE OK
- `captures.mjs` : six cas « tient=oui », rien < 12 px ni < 24 px, 0 `type="number"`, 0 requête
- `controle-panel` (un cas b par concept) : PANEL OK · `controle-choix` : sans objet (pas d'écran Dépense au registre)

## Boosters
- `file` / `suivante` : suivre ; la barre compte, ‹ › ouvre le point suivant · `mapping` : choisir ; Accepter ou une issue ·
  `calcul` : ajuster ; la case touchée devient un champ · `surs` : lire ; le sûr en pastilles.
