OK — r6b, r2b, r5b, s1b, s3b corrigées ; ENTETE OK, PLUS OK, CONTROLE OK

# Corrections du critique, passe b (16.11 soir)

Les v0 (r1 à r6, s1 à s4) n'ont pas été touchées. Les versions corrigées sont des fichiers neufs, posés à côté :

| | portrait | paysage |
|---|---|---|
| Pages | `en2/r6b.html`, `r2b.html`, `r5b.html` | `en2/s1b.html`, `s3b.html` |
| Construction | `en2/build-rb.mjs` | `en2/s/build-b.mjs` (head + body + `variants-b.mjs`) |
| Contrôles et captures | `en2/cap-rb.mjs` | `en2/s/cap-b.mjs` |

## Ce qui change partout

- **Hachure en cave** : l'opacité passe de 0,5 à 0,9, et elle se voit sur fond sombre (problème 3).
- **Les deux frigo sont distingués** (problème 2) :
  - la légende de la hachure dit « ▧ 1 140 mis de côté » ;
  - l'achat s'écrit « Frigo −1 800 » ;
  - au toucher, la carte du creux dit « Mis de côté pour le frigo 1 140 ».
- **Portrait : repère « dès S47 »** sous la fenêtre, au début de l'axe (problème 1). Il prend la place de « déc. », que la fenêtre recouvrait. L'axe garde mars, juin et sept.
- **Le placement est fait à la main.** Le placeur automatique perdait des noms (500 à 900 essais). Les places ont été mesurées à la géométrie (`c.X`, `c.Y`). Les fils sont verticaux et ne partent que si l'étiquette couvre la colonne du saut.

## Version par version

### r6b (bord à bord)
1. **Les mouvements sont nommés** :
   - Fête de village +2 140 et Six fûts inox −1 080 sont sur une rive sous le zéro ;
   - Festival +2 450, en deux lignes, est collé à gauche de son pic ;
   - Mariage +1 100 et Frigo −1 800 sont sous la courbe, à droite.

   Seul Marché de printemps reste une marque, sans nom (absent de la liste du critique).
2. **Les deux frigo sont distingués**, comme partout.
3. **« dès S47 »** est ajouté.
4. **La teinte du creux** part de y 32 : elle ne monte plus derrière le titre.
5. **La carte du creux** s'ouvre au toucher (greffe de r3).

**Coût** : la courbe passe de 101 à 87 px, pour faire place à la rive.

### r2b (rive basse)
1. **La bande montre le mouvement seul, en couleur**, sur une ligne de 23 px (l'option r5 proposée par le critique). Le libre vient au toucher.
   - La forme « 4 032 −148 » sur une ligne ne tient pas : il faut environ 72 px pour une colonne de 61.
2. **Fête de village +2 140 est nommée en entier**, mais sur la rive, pas au-dessus de la courbe : ses deux côtés sont pris par le pic du Marché et par les mois.
   - Marché de printemps reste « +910 » au-dessus de son pic : au-dessus, il n'y a que 13 px avant les mois.
   - Mariage reste « +1 100 ».
3. **Les deux frigo sont distingués.**
4. **« dès S47 »** est sur la rive. La carte du creux s'ouvre au toucher.

### r5b (loupe)
1. **Le solde revient** : la bande est sur deux lignes, solde puis mouvement, en 35 px. Une seule ligne ne tient pas.
2. **L'accolade est remplacée par « loupe ×2,4 »**, en rouge, dans l'axe entre mars et juin. Les graduations fines restent.
3. **Fête de village +2 140** est en trois lignes dans le ciel du creux. **Frigo −1 800** est en deux lignes sous la courbe.
   - Mariage et Marché restent des marques.
   - « 1 140 mis de côté » ne tient pas au repos : il est dans la carte du creux, au toucher (ajoutée).
4. **« dès S47 »** est ajouté.

### s1b (Rives)
1. **Tous les fils sont verticaux et courts.** Chaque nom est posé sur sa colonne :
   - Fête de village est en rangée B, Mariage en rangée A, avant le pic du festival ;
   - Six fûts inox, Embouteilleuse et Frigo sont sur la rangée basse ;
   - Hotte est sous le libre : la rangée basse ne peut pas porter quatre noms sur leurs colonnes.

   Festival garde un fil court, de 30 px.
2. **« ▧ 1 140 mis de côté »**, avec sa hachure, est à gauche de la rangée basse.
3. **Les mois sont à 4 px du bord haut.** La fenêtre passe de 112 à 104 px pour dégager la rangée.
4. **La hachure est éclaircie en cave.**
5. **La greffe de la phrase « Creux de S24 » n'est pas faite** : la hauteur ne le permet pas, faute d'une ligne de plus sous l'en-tête de 165 px.

### s3b (le creux raconté)
1. **Les entrées sont nommées en entier, comme dans s1b** : Marché de printemps +910, Fête de village +2 140, Mariage +1 100 et Festival +2 450.
   - Pour cela, la zone du creux est teintée, sans traits verticaux, et soulignée en bas.
   - Le pointillé S24 ne commence que sous la rangée B.
2. **Le chariot est décollé du −460**, avec un écart de 4 px.
3. **La phrase « Creux de S24 : … » est gardée.**

## Sorties des contrôles

```
node scripts/agents/controle-entete-cal.mjs en2/r6b.html en2/r2b.html en2/r5b.html
ok r6b : courbe 87 px, bande 35 px, en-tête 190 · ok r2b : courbe 92, bande 23, en-tête 189 · ok r5b : courbe 96, bande 35, en-tête 190 → ENTETE OK
node scripts/agents/controle-entete-cal.mjs --paysage en2/s1b.html en2/s3b.html
ok s1b : courbe 92 px, bande 17, en-tête 195 · ok s3b : courbe 92, bande 18, en-tête 195 → ENTETE OK
node scripts/agents/controle-plus-rangees.mjs en2/r6b.html en2/r2b.html en2/r5b.html → 7 rangées, écart 0 px (×3), PLUS OK
node en2/cap-rb.mjs → r6b, r2b, r5b : petits 0 · hors 0 · chevauchés 0 · sur trait 0 · dans la fenêtre 0 (cap/controle-rb.txt)
node en2/s/cap-b.mjs → s1b, s3b : aucun défaut ; frise, + et code de frise identiques à l5 ; témoin ÉCHOUE comme attendu → CONTROLE OK (cap/s-controle-b.txt)
```

- `controle-plus-rangees` ne s'applique pas au paysage (il mesure le portrait). L'identité de la frise est vérifiée par `cap-b.mjs`.
- `controle-choix` ne s'applique pas : il vise l'app construite, et le calendrier n'est pas au registre.

## Captures (ouvertes)

Dans `en2/cap/` :
- portrait, clair et cave : `r6b.png`, `r6b-cave.png`, `r2b.png`, `r2b-cave.png`, `r5b.png`, `r5b-cave.png` ;
- portrait, au toucher (carte du creux) : `r6b-toucher.png`, `r2b-toucher.png`, `r5b-toucher.png` ;
- planches : `planche-b-clair.png`, `planche-b-cave.png`, `planche-b-toucher.png` ;
- paysage : `s1b.png`, `s1b-cave.png`, `s3b.png`, `s3b-cave.png`.

## Prédiction

r6b et s1b : « là je vois qui fait bouger l'argent ». Risque sur r6b : « le graph a un peu rétréci » (101 → 87 px).

## Écarts et décisions

DÉCISION À PRENDRE : r6b nomme tous les grands mouvements, mais sa courbe passe de 101 à 87 px. Faut-il garder les noms, ou la courbe la plus grande ? Les deux se montrent côte à côte (r6 contre r6b).

CONNAISSANCE : en portrait (366 à 390 px), le creux S13 → S24 est profond et étroit. Neuf noms entiers n'y tiennent pas sur une ligne chacun sans rive sous le zéro. Chaque version a dû choisir : rive (r6b, r2b), lignes multiples (r5b) ou toucher.

LEÇON PROPOSÉE : aucune.
