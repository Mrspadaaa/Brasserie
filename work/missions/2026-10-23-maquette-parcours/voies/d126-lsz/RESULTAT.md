OK — série lsz : quatre concepts du levier levure sur Suggérer q2b, lsz2 retouchée, COMMUN OK, PANEL OK

## Les concepts (chaleur, idée, ce qui tient, ce qui casse)
- lsz1 — chaleur tiède — les fantômes de levure sur ses trois cartes d'objectif (piste en tirets sous la piste houblon :
  « ? » hachuré pour résineux et floral, repères V et P sur agrumes, Pomona en orangé hors style ; bulle au toucher,
  « Étape Levure › »). Tient : réponse lisible sans geste, zéro mot de plus, écran intact. Casse : V et P sans nom au
  repos ; cartes plus hautes de 24 px ; la bulle couvre le premier groupe.
- lsz2 — chaleur chaude — retouchée après le REJET du critique : au repos q2b en Barres, une bande à l'encre sous les
  cartes (mini radar, « Levure seule, en silhouette sur le radar », puce « Radar · estimé › ») ; la puce bascule sur
  son Radar avec une seule silhouette, Verdant (trait plein, trois familles établies, polygone ouvert, « ? » sur les neuf
  autres axes, valeurs aux sommets), Pomona au toucher de sa puce ; ligne de lecture et pont. Tient : son écran au repos,
  une silhouette comparée d'un coup d'œil à la bière et au houblon, inconnu visible. Casse : deux écrans pour lire ;
  bande de 68 px et 59 mots ; « ? » serrés au centre.
- lsz3 — chaleur chaude — l'onglet de bord « LEVURE · US-05 » collé à droite au-dessus du dock, qui tire un volet
  reprenant ses trois cartes d'objectif en miniature par souche (« ? », « ? », « ~+2,8 hors style »), effets en plus,
  pont. Tient : écran intact, toujours sous le pouce, réponse dans ses mots. Casse : recouvre 8 px des « + » ; le
  volet cache deux tiers de l'écran ; forme inédite dans l'app.
- lsz4 — chaleur chaude — un curseur à trois crans (US-05, Verdant ~, Pomona ~) sous les cartes : ce sont ses cartes
  qui répondent en aperçu (« ? », « ? », « Dépasse ~ »), ligne de détail, retour sur US-05. Tient : le slider qu'il
  réclame, la réponse dans ses grands mots, liste jamais touchée. Casse : ses verdicts houblon disparaissent pendant
  l'aperçu ; un curseur peut se lire comme un second facteur ; pas de position intermédiaire.

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/lsz{1,2,3,4}/etat.html` et `NOTE.md`
- `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/captures/lsz{1,2,3,4}-{repos,toucher}.png` (390 × 844)
- ce RESULTAT.md ; scripts de travail dans `%TEMP%/d126-lsz/` (capturer.mjs, copies pour controle-choix)
Les pages chargent le bundle rendu de Suggérer copié par le jeu court (`../../fils24-levure-suggerer/assets/`), rien
de `prototypes/` ni de `src/` ; classes et rôles préfixés `lszN-` ; données `levures-moteur.json` du moteur en direct.

## Critères
- G1 : `SERIE-BIEN-4`.
- G2 : `COMMUN OK` (lsz1 lsz2 lsz3 lsz4, `--page=etat.html --sans=mots`). Premier essai : lsz2 en échec sur couleurs,
  au-style, fiche, trait, parce que la page basculait d'elle-même en Radar au chargement ; la bascule est rendue à son
  doigt (capture jouée après « Radar »), l'écran au repos reste q2b en Barres.
- G3 : `NOTE OK` (lsz1, lsz2, lsz3, lsz4, chaleur).
- En plus : `controle-choix.mjs <copie> --ecran=suggerer` : CHOIX OK ×4 à midi ; rejoué le soir après la retouche de
  lsz2 : CHOIX ECHEC sur toute copie, base nue comprise (`etat-sugg-gr5-cran`, `etat-sugg-gr5-crans-comptes` : deux
  états ajoutés au registre à 17 h 30, absents du bundle Suggérer rendu par r4 ; ETATS 2/17), rien des variantes ;
  `controle-panel.mjs` sur les 8 captures, rejoué : PANEL OK (remplissage médian 0,81, 0 sous 0,50, ressemblance 0,83,
  0 double ; un premier essai de la retouche donnait PANEL ECHEC, lsz2-repos ~ lsz4-repos à 0,95, levé par la bande à
  l'encre) ; `mots-premier-ecran.mjs --max=80 --sans-donnees` : 38 à 59 mots, MOTS OK ; `controle-une-question.mjs` : ECHEC indicatif, identique à la base q2b
  rendue (aucun titre, pas de ligne de contexte balisée), recopié dans chaque NOTE.

## Captures (ouvertes, à côté de q2b-b-390.png et du radar de q2b ; lsz2-repos = q2b en Barres, sans défilement)
`work/refonte-frontend/v4/ecran-1/fils24-petits-choix/captures/lsz1-repos.png`, `lsz1-toucher.png`, `lsz2-repos.png`,
`lsz2-toucher.png`, `lsz3-repos.png`, `lsz3-toucher.png`, `lsz4-repos.png`, `lsz4-toucher.png`.

## Prédiction
« lsz4 pas mal, le slider c'est ce que je demandais, mais je veux garder mes verdicts houblon à côté ; lsz1 on voit
direct que la levure sert à rien pour le floral ; l'onglet de lsz3 bizarre mais le volet est bien ; le radar de lsz2 à
garder comme option dans la vue radar. »

DÉCISION À PRENDRE : le registre des états (gr5, crans comptés, 17 h 30) devance le bundle Suggérer rendu par r4 :
CHOIX ECHEC sur la base elle-même tant que r4 n'est pas reconstruit ; lsz4 remplace les verdicts houblon des cartes pendant l'aperçu ; les garder en petit (passe 2) ou
superposer, c'est au pilote ou au brasseur.
CONNAISSANCE : la vue Radar de q2b rendue (bascule « Radar ») ne porte ni picto de famille, ni zone du style, ni fiche à
l'appui long : `controle-commun` échoue sur toute page qui l'ouvre au chargement ; un concept qui vit dans cette vue se
capture après la bascule et se contrôle en Barres.
LEÇON PROPOSÉE : aucune.
