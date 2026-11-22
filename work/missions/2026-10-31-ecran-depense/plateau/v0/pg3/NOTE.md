# pg3 — le dock du pouce (chaude)

**Chaleur** : chaude (forme libre). **L'idée** : la rangée ouverte ne garde que son relevé (imprimé, mesure, nature, article, cerclée) ; le geste
descend dans un dock posé sur le pied, à la portée du pouce, avec « 1 sur 2 à régler ‹ › » pour passer à la ligne suivante sans la chercher.

Page : `etat.html?etat=repos|a|b|c|d|e|f` (`&theme=cave`). Ligne ouverte au téléphone : le récap se plie en une ligne (« Malzhaus Nord · 61,10 CHF »).

## Les six cas
Repos : dock fin « 2 À RÉGLER · Citra, Lactose · 1 corrigée · Commencer › ». (a) RIEN, « Suivante : Citra › ». (b) CHOISIR : trois rangées de
44 px, bis proposé en jaune, la raison, « Rien n'est créé au stock avant Confirmer ». (c) RIEN · Matériel · hors stock. (d) REMPLIR : quatre
touches de 48 px, focus sur g, et l'extrait de la facture à côté (la case illisible marquée), pour lire avant de choisir. (e) GARDER : bascule
« 2 lu d'abord | 3 3e lecture », 3 en bleu, gardé d'office. (f) PLUS : trois grandes tuiles Extrait / Type d'achat / Supprimer, et les types fins.

## Baseline
- [x] imprimé · référence, [x] mesure sur une ligne (valeurs touchables), [x] ✓ au centime, [x] segment (petit), [x] article « … » · relié en pastille,
  [x] mouture « rattachée » en pastille ; ⇄ et Retirer passent au dock. [x] Pied inchangé, [x] B du nom, [x] d-lue, [x] D277 sur le champ.
- Écart voulu : le plateau est partagé entre la rangée (le relevé) et le dock (le geste). Raison : le geste au pouce, en bas de l'écran ; la rangée
  reste dans la liste groupée, sous sa bande et son filet. À 1280, le dock s'aligne sous la liste (`pg3-1280-b.png`).

## Contrôles (02.11)
- `controle-commun --profil=sans-houblons --sans-lignes` : COMMUN OK ; sans `--sans-lignes` : MOTS ECHEC (117).
- `mots-premier-ecran` : 117. `controle-contraste` : pire « CHF » 5,27:1, CONTRASTE OK. `verifier-page --min-images 0` : PAGE OK. `type="number"` : 0.
- `controle-panel` (cas b des 4) : PANEL ECHEC, ressemblance 0,92.

## Retouches vues
Le titre du dock est rogné (« Lactose : l'un… ») : le raccourcir ou passer la position sous lui.
