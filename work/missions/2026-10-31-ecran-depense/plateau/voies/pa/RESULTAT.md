OK — 4 variantes pa (proposition d'abord), six cas chacune, 390, sombre et 1280

pa1 champ proposé sur place · pa2 file de propositions · pa3 facture traduite face-à-face · pa4 phrase à trous.

## Fichiers écrits (tous dans « Possède »)
- `plateau/v0/pa1` à `pa4/` : `etat.html`, `NOTE.md`, et 10 captures chacune : `paN-{repos,a,b,c,d,e,f}.png` (390 × 844,
  clair), `paN-b-sombre.png`, `paN-d-sombre.png`, `paN-1280-b.png`.
- `plateau/voies/pa/` : `construire.mjs` (socle + plateau, préfixe `paN-` par split/join, L26), `captures.mjs` (captures et
  mesures par cas), `src/` (socle commun de la liste p3c-3, puis CSS et JS propres à chaque plateau), `sorties/` (sorties brutes).
- États : `etat.html#a` … `#f`, `#repos`, suffixe `-cave` pour le sombre. Sans dièse, c'est le cas b.

## Critères
1. Quatre `etat.html` avec les six cas, captures à 390 (clair, plus d et b en sombre) et à 1280 : `captures.mjs` →
   **CAPTURES OK** (40 captures). Les six cas « tient=oui » dans chaque variante : le plateau tient entre la rangée et le pied.
   Aucun texte sous 12 px, aucune cible sous 24 px, aucune erreur de script, pas de défilement horizontal. J'ai ouvert
   pa1-b, d, e ; pa2-b, d-sombre, e ; pa3-b, d, f, 1280-b ; pa4-b, f.
   Deux défauts vus sur les captures et corrigés :
   - pa3 à 1280 : la colonne de gauche était vide ;
   - pa1 (e) : les champs passaient à la ligne avec « sachets ».
2. Chaque NOTE donne sa chaleur, son idée, la baseline cochée (écarts nommés, avec leur raison) et les sorties des contrôles :
   - `controle-commun --profil=sans-houblons --sans=mots` : **COMMUN OK** ×4 ;
   - `controle-contraste` : **CONTRASTE OK** ×4, pire 4,63:1 ;
   - `verifier-page --min-images 0` : **PAGE OK** ×4 ;
   - 0 `type="number"`, 0 requête réseau ;
   - `controle-panel` sur un cas b par concept : **PANEL OK** (ressemblance 0,90, remplissage 0,61).
3. `git status --short` : rien de nouveau hors de `plateau/v0/pa*` et `plateau/voies/pa`. Les fichiers non suivis `choix-*/img`,
   `tva/v1`, `voies/pg` et `voies/pu` ne viennent pas de cette voie.

Écarts que je signale :
- `mots-premier-ecran` compte 124 à 141 mots (cas b ouvert, récap compris), au-dessus de 98. C'est hors des obligations de la v0,
  écarté par `--sans=mots`.
- `controle-panel` sur les 24 captures de cas donne **PANEL ECHEC**, ressemblance 0,90 au seuil. Les six cas d'un même concept
  se ressemblent, et le socle de liste est imposé par la baseline. Pour l'écarter, j'ai donné à chaque variante sa composition :
  - pa2 : la barre de file noire ;
  - pa3 : le récap replié ;
  - pa4 : le plateau teinté de sa famille.
- `controle-choix` : sans objet, `ecrans.json` n'a pas d'écran Dépense.
- Polices : sans réseau, la page retombe sur Segoe UI et Consolas.

## Prédiction
« pa3, le face-à-face facture / compris, c'est vachement bien pour voir si c'est juste ; le duel du Citra, je garde. Mais la
nature cachée, ça me dérange un peu », et pa1 sera vu comme « on est bon », sans surprise.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : `controle-panel` ne dit pas quelles captures passer. Sur tous les cas d'une série, il échoue par construction,
parce que les cas d'un même concept se ressemblent ; sur une capture par concept, il juge la diversité. Préciser dans
l'entonnoir : une capture représentative par concept.
