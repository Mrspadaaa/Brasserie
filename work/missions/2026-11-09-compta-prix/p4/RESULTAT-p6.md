OK — passe 6 Prévisions : p6a–p6f, six greffes sur p5a (socle, remontée, déjà/encore, avant/après, mois, ventes) ; MOTS OK, PANEL et contraste à lire

## Fichiers écrits (tous dans `work/missions/2026-11-09-compta-prix/p4/`)
- `p6a/` à `p6f/` : `etat.html` (statique, classes préfixées, sans script), `NOTE.md`, `<id>-haut.png`, `<id>-page.png` (premier écran + annexe), `<id>-1280.png`.
- `p6a/capturer-1280.mjs` (copie du script de p5a, ids p6*).
- `p4/RESULTAT-p6.md`. Rien d'autre (les fichiers modifiés du worktree hors p6* ne sont pas de cette voie).

## Les problèmes que p5a ne résout pas encore (écrits avant de dessiner)
1. **Deux courbes superposées** (plein + pointillé) : son reproche à p4a, « dure à lire » ; l'œil compare encore deux chemins.
2. **Arrondis sur le graphe** (−57, −7) contre 57,42 et 6,84 dans la liste (SYNTHESE-P4, incohérence 1 ; D94 « je veux aussi des vrais valeurs »).
3. **« Quand puis-je acheter le frigo ? » sans réponse** : p5a dit seulement qu'au 15.11 on passe sous zéro ; aucun mois proposé (brief passe 3 § 2 : « le meilleur mois pour l'acheter »).
4. **Le manque n'est pas une aire** : −892,66 se lit dans un coin, pas comme un creux (p5g le dessine).
5. **Ventes absentes** (« Entrées : aucune ») : le plan est faux par pessimisme ; p5g les montre (+1 125 → +232,34).
6. **Le coût du prochain brassin éclaté** en deux lignes (57,42 + 6,84) : 64,26 ne se lit pas en 3 s.
7. **La liste double le graphe** (même info deux fois, 230 px, 60 mots pile).
8. **Pas de réserve** : le seul seuil est zéro, alors que METIER § 7 fixe 3 mois de charges (1 404,00) que p5s et p5q dessinent.
9. **Coin haut gauche chargé** (aujourd'hui, atelier, frigo empilés).
10. **1280 = planche de deux 390** (incohérence 2, toujours là dans cette passe aussi).

## Les six, et ce que chacune règle
| Id | Chaleur | Greffes sur p5a | Règle |
|---|---|---|---|
| p6a le socle | froide | p5g (socle, un chemin), p4a (fiche) | 1, 2, 4 |
| p6b la remontée | tiède | p5s (marches de 300, réserve, curseur) | 1, 3, 8 |
| p6c déjà / encore | tiède | p5s (pile), p4a (fiche) | 1, 2, 3, 6, 8 |
| p6d maintenant ou avril | tiède | p5q (plan derrière, rouge, Et si), p5s (réserve) | 3, 8 |
| p6e les mois où ça passe | tiède | p5s (bande des mois), p4a (frigo en marche) | 2, 3, 6 |
| p6f les ventes remontent | chaude | p5g (ventes), p5s (marches qui montent), p4a | 2, 4, 5, 7 |
Non réglé : 9 (partout, atténué), 10 (1280 = deux 390, comme les passes précédentes).

## Sorties décisives
- `verifier-page.mjs … --min-images 0` : **PAGE OK × 6**.
- `p6a/capturer-1280.mjs p6a…p6f` : **CAPTURES 1280 OK** (débord 0, erreurs 0).
- `mots-premier-ecran.mjs p4 p6a…p6f --page=etat.html --profil=sans-houblons --sans-donnees --max=60` : **MOTS OK** — p6a 60 · p6b 60 · p6c 60 · p6d 60 · p6e 58 · p6f 58.
- `controle-commun.mjs … --sans=mots` : couleurs, survol, blocs, standard, parlant, brutes **OK** ; **contraste ECHEC (13 textes « sur le fond peint »)** : p6b 3 (« Je dégage… », et, dans l'annexe, « janv., juste sur la rése… », « il reste 1 404,00 »), p6c 1 (annexe « avril 232,40 »), p6e 1 (annexe « 1 471,60 », mesuré 1:1), p6f 5 (étiquettes sur les hachures : « → 664,18 », « +720,00 marché », « −6,84 impôt », « → 977,34 », « −400,00 loyer, 25.01 »). La mesure lit le pixel au centre du texte : des ratios de 1:1 ou 1.11:1 sont la couleur du texte lui-même ([[pieges-controles-maquette]]). Halo blanc 6 px posé sous toutes les étiquettes, rect blanc sous celles de p6b ; p6a et p6d passent. À finir en passe 2 sur les candidates retenues (étiquettes hors des hachures). S3 corrigé en route (rayons 8 et 7 → 10).
- `controle-panel.mjs` (6 `-haut.png`) : remplissage médian 0,68, 0 sous 0,50, 0 paire ≥ 0,95 ; **ressemblance moyenne 0,93 ≥ 0,90 : PANEL ECHEC**. Cause : les six partent de p5a par son choix (même en-tête, cartes, graphe, liste) ; la connaissance de RESULTAT-p (« six écrans clairs d'un même onglet plafonnent vers 0,94 ») se confirme ; les fonds teintés de p6c, p6d, p6f n'ont rien changé. Pas de « diversification » contre sa base (règle n° 1).
- Transversales : 7,51 → 8,01 sur le frigo (fiches p6a, p6c ; lignes Frigo) ; 5,00 marqué exemple ; payé ≠ à payer ≠ prévu ≠ dégagé nommés (légende) ; hors fixture = exemple (300, 716,20, panne 800, ventes) ; glossaire (« à payer », « usure », « réserve », « il manque », « dégagé ») ; aucune rangée de fournisseurs ; couleurs nommées (réserve violette : « Réserve 1 404,00 » dessus ; hachures : « ventes, exemple »).
- Statique, aucun script ; chaque annexe dessinée dans un second cadre. `controle-choix.mjs` non lancé : Prévisions n'a pas d'entrée choisie dans `ecrans.json` (p5a = « le mieux mais »).
- Non fait : skills `impeccable`, `boosters-ux` non chargés (budget) ; thème cave ; B5 et B9 non mesurés.

## Captures (ouvertes, L12)
`p4/p6a/p6a-haut.png` · `p6b/p6b-haut.png` · `p6c/p6c-haut.png`, `p6c-page.png` · `p6d/p6d-haut.png` · `p6e/p6e-haut.png` · `p6f/p6f-haut.png`, `p6f-page.png`. Non rouvertes : les `-1280.png` (débord 0 mesuré ; planche de deux 390 comme en p5), `p6a-page`, `p6b-page`, `p6d-page`, `p6e-page` (annexes dessinées, chiffres vérifiés à la main, pas regardées).

## Prédiction
Il gardera p6a (« le socle, là je vois ce qui manque ») ou p6e (« p5a avec la réponse en dessous ») comme écran, prendra la bande des mois de p6e et la pile de p6c comme greffes, dira de p6d « deux courbes encore » et de p6f « les ventes, oui, mais le graphe est chargé » ; p6b : « c'est p5s, bien, mais je perds les loyers ».

DÉCISION À PRENDRE : deux modèles cohabitent (90 jours sans vente, fixture ; 12 mois à 300 dégagés par mois, METIER § 7) : p6c et p6e les posent côte à côte sur un même écran, étiquetés exemple ; si l'une est retenue, dire au port laquelle des deux lectures fait foi quand il bascule d'horizon. Et le PANEL : accepter 0,93 pour une passe « variantes d'une base choisie », ou retirer ce critère des passes ≥ 2.
CONNAISSANCE : la règle plan2 (METIER § 7) et le 90 jours prolongé à +300 par mois depuis 2 107,34 donnent le même mois (avril) mais pas le même solde après (1 471,60 contre 7,34) : le mois est robuste, le solde dépend du modèle.
LEÇON PROPOSÉE : `controle-contraste` en profil sans-houblons lit le pixel au centre du texte et rend 1:1 sur un chiffre mono dense ; un brief de maquettes à étiquettes sur graphe devrait dire « étiquettes hors des aires hachurées ou sur un rect blanc », sinon chaque voie le redécouvre en fin de course.

## DEMANDE EXECUTANT
Pour la passe 2 (après son choix), rejouer sur la ou les candidates retenues :
1. `node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/missions/2026-11-09-compta-prix/p4 <id> --page=etat.html --profil=sans-houblons --sans=mots` → attendu : `COMMUN OK` (après déplacement des étiquettes flaguées hors des hachures, par le concepteur).
2. `node scripts/agents/verifier-page.mjs work/missions/2026-11-09-compta-prix/p4/<id>/etat.html --captures work/missions/2026-11-09-compta-prix/p4/<id>/<id> --min-images 0` → `PAGE OK` ; `node work/missions/2026-11-09-compta-prix/p4/p6a/capturer-1280.mjs <id>` → `CAPTURES 1280 OK`.
3. Ouvrir `<id>-haut.png`, `<id>-page.png`, `<id>-1280.png`.
