# sbu3 — Substituer, série u (v0)

- Chaleur : tiède
- Idée : le diff de la recette : ligne retirée (− Nugget 46 g), ligne ajoutée (+ Nelson Sauvin 62,5 g), puis le hunk « ma bière » famille par famille (~83 → ~82, hors style) ; chaque remplaçant est un autre diff.
- Ce qui tient : avant → après chiffré et simulé (~) ; dit sans détour qu’à 60′ la bière ne bouge presque pas.
- Ce qui casse : registre de développeur (@@, gouttière) : peut sembler froid ou technique au brasseur.
- Baseline : suivie (pictos au trait, épicé p-spice, couleurs des familles, α et usage en mot, au style par défaut, stock en badge, thème blanc, croix, légende derrière « ? », fiche à l’appui long). Aucun écart.
- Captures : ../captures/sbu3-premier-ecran.png, -page.png, -choix.png (un autre remplaçant), -fiche.png, -legende.png.

## Données
Moteur du parcours (, , ), extraites par  (vite-node, lancé hors dépôt) dans  : stout 16D, Nugget 46 g à 60′ (α 13 % lot), US-05, 10 remplaçants « ton stock d’abord ». Simulé marqué « ~ » ; inconnu « ? » et hachuré ; mots des fiches seulement. Le moment est en contexte (60′) : à 10′ et au whirlpool le moteur répond Target, Idaho 7, Falconer’s Flight (dans donnees.json, non montré : un seul facteur libre).

Régénérer :  ; captures : .

## Contrôles (joués une fois, 24.10)
- controle-commun --sans=mots : COMMUN OK (série entière, voir RESULTAT.md de la voie) ; mots sauté par le contrat (GATES G2), mesure indicative ci-dessous.
- mots-premier-ecran --max=70 : MOTS ECHEC (sbu1 184, sbu2 160, sbu3 186, sbu4 113, sbu5 114, sbu6 110, sbu7 136, sbu8 121).
- controle-alpha : ALPHA OK ; controle-sans-famille : SANS-FAMILLE OK (Nelson Sauvin 83 %, part « autres » dessinée).
- controle-une-question : écarts relevés (pas de [data-role=contexte] : la série n’impose pas de ligne de contexte, M14 ; sélecteurs libres non balisés data-libre ; titres sans « ? » en sbu5, sbu6, sbu8).
- controle-panel (8 premiers écrans) : PANEL OK, remplissage médian 0,57, ressemblance 0,89.
- controle-choix : sans objet (Substituer est « ouvert » au registre).
