# lva — froide : le groupe « Changer de levure » de q2b, tel quel, en bas, marqué « autre levier »

Jeu court jc-levure (D35 : le groupe levure de q2b ne revient pas tel quel dans Suggérer, il se montre en variantes).
Page : copie de Suggérer rendue par la reprise r4 (`prototypes/houblons-v4/maquettes/parcours-suggerer/suggerer/etat.html`,
bundle copié dans `../assets/`). Rien d'autre ne change dans l'écran.

## Ce qui est montré
- Après « Dry hop · actif », sur l'axe : un trait en tirets et la puce « autre levier » (icône levure), puis l'en-tête
  de q2b : « Changer de levure », la pastille « levure », « estimé ».
- Deux lignes comme q2b (capture `choix/etats/captures/etat-sugg-levure-choisie.png`, regardée côte à côte) :
  LalBrew Verdant IPA, LalBrew Pomona ; les cases (floral et résineux hachurés, non établis ; agrumes cerclé avec ses
  traits ; puis tropical et noyau), le « + » de comparaison, et la barre l5b de chaque souche : barre blanche bordée
  (sans fiche), pointe orangée si hors style (Pomona), hachures pour floral et résineux.
- Toucher la puce « autre levier » : une bulle à l'encre. « Toute la bière change de souche. Ce n'est pas un ajout de
  houblon. » Houblons et IBU 59,7 inchangés, fermentation à revoir, stock de levure non suivi, et « Étape Levure › »
  (copie de l'étape rendue, `levure.html`).

## Données (honnêteté)
Moteur en direct, `proposeVoies(…, { leviersLevure: true })` sur le cas de Suggérer (Stout 16D, US-05, + floral,
+ agrumes, − résineux) : `outils/levures-moteur.ts` → `donnees/levures-moteur.json`. Verdant : agrumes ~+1,3 cran,
tropical ~+2,2, noyau ~+4,4 hors style. Pomona : agrumes ~+2,8 hors style, tropical ~+3,1 hors style, noyau ~+4,3
hors style. Floral et résineux : `null` dans le moteur, donc hachurés, jamais 0. IBU 59,7 → 59,7. Mêmes nombres que
q2b (c1.json du 19.10) : le moteur n'a pas changé sur ce point.

## Chaleur : froide
Les idées retenues : q2b tel quel ; la seule retouche est la marque « autre levier », qui sépare le levier levure des
voies houblon (L10 : Suggérer ne fait varier que le houblon ; la levure est dite « autre » et renvoie à son étape).

## Ce qui tient
- C'est sa maquette : même ordre, mêmes cases, mêmes barres que q2b ; rien au-dessus du pli ne bouge.
- La bulle dit en une phrase pourquoi ce n'est pas une voie comme les autres.

## Ce qui casse
- Le « + » met une levure dans Comparer, qui compare des houblons (r6a) : un second facteur entre par là. Gardé parce
  que q2b l'avait ; à trancher par lui.
- Les traits « hors style » des cases s'affichent noirs, comme dans toute la page rendue (ordre des feuilles de style
  de r4) ; la barre, elle, porte la pointe orangée.
- La puce visible fait 32 px ; sa cible au doigt est portée à 44 px par une zone invisible.

## Contrôles
- `controle-commun.mjs … lva lvb lvc --page=etat.html --sans=mots` : COMMUN OK (couleurs, au-style, survol, blocs,
  contraste, fiche, standard, trait, legende, parlant, brutes). `--sans=mots` : prescrit par GATES (jeu court, liste
  défilée). Premier essai : STANDARD ECHEC (S4, icône levure à 1,6 px) ; l'icône est redessinée à 1,2 px.
- `controle-choix.mjs <copie>/ --ecran=suggerer` (page en `suggerer/etat.html`, NOTE r4 à côté) : CHOIX OK, de même
  pour lvb et lvc.
- Captures : `captures/lva-repos.png`, `captures/lva-toucher.png` (390 × 844), ouvertes.
