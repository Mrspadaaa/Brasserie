# pg4 — le pont facture → stock (chaude)

**Chaleur** : chaude (forme libre). **L'idée** : le mapping se dessine. À gauche la facture (papier, mono, ce qui est imprimé), à droite le stock
(ce qui entre), et le trait entre les deux dit l'état : plein et coché (relié), tireté jaune « = » (proposé), rompu rouge « ? » (à remplir),
terminé par ∅ (hors stock). Le geste se fait là où le pont casse.

Page : `etat.html?etat=repos|a|b|c|d|e|f` (`&theme=cave`).

## Les six cas
(a) trait plein, « + 6 Kg » entre au stock « Maris Otter ». (b) le stock montre trois candidats : Citra · 2024 (α 13,1 · relier), Citra · α 12,5
(bis proposé, jaune), + nouvel article (fiche par l'IA, quelques ct) ; la raison sous le pont. (c) trait vers ∅, « aucun · Matériel · Nettoyage ·
Mettre au stock ». (d) pont rompu « ? », le stock dit « + 1 ? : le stock attend l'unité », g · kg · Stk · L rouges sur le champ, focus sur g.
(e) la facture montre 2 barré et 3 en bleu, « 3e lecture : 3 × 3,40 = 10,20 imprimé », « Revenir à 2 ». (f) toucher la facture ouvre l'extrait ;
type fin et Supprimer dessous.

## Baseline
- [x] imprimé · référence (la carte facture) ; [x] mesure sur une ligne ; [x] ✓ au centime ; [x] segment ; [x] article ⇄ Retirer (dans la carte stock) ;
  [x] mouture « Détacher » ; [x] plateau dans la rangée, bande, filet, pied ; [x] B du nom ; [x] d-lue ; [x] D277 sur le champ et sur le trait.
- Écart : « imprimé « … » » devient une carte, plus une ligne de texte ; la référence y reste.

## Contrôles (02.11)
- `controle-commun --profil=sans-houblons --sans-lignes` : COMMUN OK ; sans `--sans-lignes` : MOTS ECHEC (115).
- `mots-premier-ecran` : 115. `controle-contraste` : pire « CHF » 5,27:1, CONTRASTE OK. `verifier-page --min-images 0` : PAGE OK. `type="number"` : 0.
- `controle-panel` (cas b des 4) : PANEL ECHEC, ressemblance 0,92 ; pg2-b ~ pg4-b au-dessus de 0,95.

## Retouches vues
(a) « Détacher » de la mouture passe à la ligne ; (b) la carte facture garde du vide sous elle quand le stock a trois candidats.
