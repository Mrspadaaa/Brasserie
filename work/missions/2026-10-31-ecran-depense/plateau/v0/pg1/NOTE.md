# pg1 — p3c-3 affinée (froide)

**Chaleur** : froide. **L'idée** : le plateau de p3c-3, tel quel, chaque chose dite une fois ; le geste est peint sur le champ même
(rouge sur l'unité, jaune sur l'article, bleu sur la quantité), et les gestes rares sont derrière « ⋯ », au bout de la ligne « imprimé ».

Page : `etat.html?etat=repos|a|b|c|d|e|f` (`&theme=cave`). Fixture de maquette, 8 lignes, 61,10 CHF, aucune donnée réelle.

## Ce que règle chacun des 13 problèmes
1 : en-tête de groupe collant de 28 px, la rangée ouverte défile sous lui, jamais dessous. 2 : le nom sur la rangée, l'imprimé une fois.
3 : plus de phrase technique, un message de 4 mots sous le champ. 4 : une unité = un bouton (son choix s'ouvre sous lui). 5 : montant à 2 décimales.
6 : Matériel pour le détartrant (c). 7 : l'article dit une fois. 8 et 9 : « plus » disparaît ; « ⋯ » ouvre type fin, extrait, Supprimer.
10 : chaque plateau tient entre sa rangée et le pied (défilement minimal calculé). 11 : rouge sur le champ (d). 12 : nom barré supprimé ; seule une
valeur relue est barrée, en bleu (e). 13 : pas de puce « Payé le » au pied.

## Baseline (p3c-3, B du nom, d-lue, D277)
- [x] « imprimé « … » · référence » ; [x] quantité, unité × prix = montant sur une ligne ; [x] « ✓ au centime » ; [x] segment Ingrédient · Service · Matériel
- [x] « article « … » · relié ⇄ Retirer » ; [x] mouture : « mouture, ligne 2 · 0,60 · rattachée · Détacher » (Rattacher quand détachée)
- [x] plateau sous sa rangée, bande teintée, filet de famille ; [x] pied « Catégorie | Papier » + « Confirmer »
- [x] B du nom : français sur la rangée, imprimé au plateau ; [x] d-lue : 3 en bleu, 2 barré ; [x] D277 : sûr = rien, proposé = jaune pointillé, inconnu = rouge sur le champ
- Écart : aucun.

## Les six cas
(a) rien : tout est vert, le plateau est la baseline. (b) trois choix en liste, « bis » proposé en jaune avec sa raison, « Nouvel article :
fiche remplie par l'IA, quelques ct » (à la demande), « Rien n'est créé au stock avant Confirmer ». (c) Matériel, « aucun · hors stock ».
(d) unité « ? » rouge, focus posé, g · kg · Stk · L dessous. (e) 3 bleu, 2 barré, « Revenir à 2 ». (f) « ⋯ » : type fin, extrait, Supprimer.

## Contrôles (joués le 02.11, sortie recopiée)
- `controle-commun --profil=sans-houblons --sans-lignes` : COMMUN OK (mots, couleurs, survol, blocs, contraste, standard, parlant, brutes OK ; au-style, fiche, trait, legende sautés par le profil). Sans `--sans-lignes` : MOTS ECHEC (115 mots, les lignes de facture comptées).
- `mots-premier-ecran` : 115 mots (repos, lignes comprises). `controle-contraste` : 79 textes, pire « CHF » 5,27:1, CONTRASTE OK (clair).
- `verifier-page --min-images 0` : PAGE OK (390 px, sans erreur). `type="number"` : 0. Aucune requête réseau (captures.mjs).
- `controle-panel` (un premier écran par variante, cas b) : PANEL ECHEC, ressemblance 0,92 (voir RESULTAT de la voie).

## Boosters
ligne (ouvrir) ; unite (bouton rouge, focus) ; unite-choix ; article-choix (radio, proposé) ; garder ; nature ; rares. B13 : cibles de 24 px au moins.
