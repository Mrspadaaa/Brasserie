# pa3 — chaude : la facture traduite

**L'idée.** Le plateau est une traduction : à gauche, sur fond papier, ce qui est imprimé (une seule fois, en mono) ; à droite,
ce que l'app en a compris ; entre les deux, la marque de confiance (✓ sûr, → proposé, ? à remplir, bleu corrigé). Sous la table,
la réponse au seul point ouvert : pour le Citra, un duel facture | stock (α 12,5 contre 13,1, récolte ? contre 2024) et trois
issues. L'en-tête « Facture » ouvre l'extrait du document, ligne surlignée ; la case Nature ouvre le segment, le type fin et
« Supprimer la ligne ». Ligne ouverte, le récap se replie (bande d'une ligne) ; à 1280 il reste à gauche.

Page : `etat.html#a` … `#f`, `#repos`, `-cave`. Captures : `pa3-<cas>.png`, `pa3-b-sombre.png`, `pa3-d-sombre.png`, `pa3-1280-b.png`.

## Baseline (p3c-3 et ses voisins)
- [x] « imprimé » : toute la colonne de gauche (le nom n'est plus dit quatre fois : une fois imprimé, une fois compris)
- [~] quantité, unité, × prix = montant : **écart**, en colonne (une rangée par valeur) et non sur une ligne. Raison : c'est la
  forme même de l'idée, chaque valeur face à son imprimé.
- [x] « ✓ au centime » sur la rangée du montant
- [x] segment Ingrédient · Service · Matériel, derrière la case Nature (f)
- [x] article relié / proposé, sur la rangée du libellé ; [x] mouture « Rattacher » (a)
- [x] plateau dans la rangée, bande, filet, pied · [x] B du nom · [x] d-lue (« 2 » barré à gauche, « 3 sachets » bleu) · [x] D277

## Honnêteté
L'extrait ne montre que des lignes de la même fixture (Lactose, Durgol, total 63,90). « Citra bis » proposé avec sa raison ;
« Nouveau » dit « doublon ». Aucun chiffre inventé (le prix du lactose dit « / ? »).

## Contrôles (joués une fois, 02.11)
- `controle-commun --profil=sans-houblons --sans=mots` : **COMMUN OK**
- `mots-premier-ecran --profil=sans-houblons` : 124 mots (cas b)
- `controle-contraste` : CONTRASTE OK, pire 5,24:1 · `verifier-page --min-images 0` : PAGE OK
- `captures.mjs` : six cas « tient=oui », rien < 12 px ni < 24 px, 0 `type="number"`, 0 requête
- `controle-panel` (un cas b par concept) : PANEL OK · `controle-choix` : sans objet

## Boosters
- `traduction` : lire ; imprimé et compris face à face · `mapping` : comparer puis choisir ; duel et trois issues ·
  extrait : l'en-tête Facture montre la ligne surlignée sur le document (f).
