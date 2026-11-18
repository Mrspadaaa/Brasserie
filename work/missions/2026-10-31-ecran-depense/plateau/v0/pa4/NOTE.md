# pa4 — chaude : la phrase à trous

**L'idée.** La ligne se relit en une phrase : « 100 g de [Citra bis ?] à 0,098/g = 9,80 ✓ en Ingrédient › Houblons. » Chaque
mot souligné se touche pour se changer ; le mot en doute porte sa couleur (D277) et ouvre, juste dessous, une bulle avec ses
réponses et ce qui concorde ou diffère (✓ variété, ≠ α 13,1, ? récolte). Les gestes rares sont dans le menu ⋯ de la ligne
(extrait, type d'achat, supprimer). Le plateau prend la teinte de sa famille.

Page : `etat.html#a` … `#f`, `#repos`, `-cave`. Captures : `pa4-<cas>.png`, `pa4-b-sombre.png`, `pa4-d-sombre.png`, `pa4-1280-b.png`.

## Baseline (p3c-3 et ses voisins)
- [x] « imprimé « … » », en pied du plateau, avec ⋯
- [~] quantité, unité, × prix = montant sur une ligne : **écart**, la même ligne devient une phrase, chaque valeur reste un mot
  à toucher. Raison : c'est l'idée ; le brasseur lit la ligne comme il la dirait.
- [x] « ✓ au centime » : la coche après le montant (sans le mot : écart de forme)
- [~] segment Ingrédient · Service · Matériel : derrière le mot « Ingrédient » (écart, il s'ouvre au toucher)
- [x] article relié ou proposé : le mot de la phrase ; [x] mouture « Rattacher » : « + mouture 0,60 ? » en bout de phrase (a)
- [x] plateau dans la rangée, bande, filet, pied · [x] B du nom · [x] d-lue (mot bleu, « 2 » barré, Garder / Revenir) · [x] D277

## Honnêteté
La bulle dit « je propose une fiche à part » et pourquoi ; « Nouvel article » dit « doublon de Citra » ; « Relire la ligne par
l'IA · ≈ 1 ct » (d). Rien de créé avant Confirmer.

## Contrôles (joués une fois, 02.11)
- `controle-commun --profil=sans-houblons --sans=mots` : **COMMUN OK** (premier essai : CONTRASTE 2,2:1 mesuré sur le paragraphe
  entier, qui passait sur les mots en pastille ; mots de liaison mis dans leur propre span, puis OK)
- `mots-premier-ecran --profil=sans-houblons` : 128 mots (cas b)
- `controle-contraste` : CONTRASTE OK, pire 4,63:1 (« /g » sur la teinte houblon) · `verifier-page --min-images 0` : PAGE OK
- `captures.mjs` : six cas « tient=oui », rien < 12 px ni < 24 px (mots de 24 px au moins), 0 `type="number"`, 0 requête
- `controle-panel` (un cas b par concept) : PANEL OK · `controle-choix` : sans objet

## Boosters
- `phrase` : lire et ajuster ; chaque mot se touche · `mapping` : comparer puis choisir ; concordances en pastilles · `menu` :
  déclencher ; ⋯ ouvre extrait, type fin, suppression (f).
