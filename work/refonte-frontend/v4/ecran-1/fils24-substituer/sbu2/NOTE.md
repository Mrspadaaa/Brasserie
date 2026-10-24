# sbu2 — Substituer, série u (v0)

- Chaleur : froide
- Idée : la carte de l’étape Houblons (base v4.10, son choix) : Nugget barré dans SA carte, « par » le remplaçant dans la même anatomie, les autres en cartes d’ajout rapide, puis le panneau des 12 familles de l’étape.
- Ce qui tient : son vocabulaire exact (bande des 12, pilule ébullition, résine 2/4, IBU) ; la réponse se lit dans la carte qu’il connaît.
- Ce qui casse : la bande des 12 cases distingue mal cité et marqué à petite taille ; panneau des familles sous le pli.
- Baseline : suivie (pictos au trait, épicé p-spice, couleurs des familles, α et usage en mot, au style par défaut, stock en badge, thème blanc, croix, légende derrière « ? », fiche à l’appui long). Aucun écart.
- Captures : ../captures/sbu2-premier-ecran.png, -page.png, -choix.png (un autre remplaçant), -fiche.png, -legende.png.


## Données
Moteur du parcours (`remplacants`, `lireBiere`, `houblon`), extraites par `../sbu1/serie/extraire.ts` (vite-node, lancé hors dépôt) dans `../sbu1/serie/donnees.json` : stout 16D, Nugget 46 g à 60′ (α 13 % lot), US-05, 10 remplaçants « ton stock d’abord ». Simulé marqué « ~ » ; inconnu « ? » et hachuré ; mots des fiches seulement. Le moment reste en contexte (60′) : à 10′ et au whirlpool le moteur répond Target, Idaho 7, Falconer’s Flight (dans donnees.json, non montré : un seul facteur libre).

Régénérer : `node ../sbu1/serie/generer.mjs <id>` ; captures : `node ../sbu1/serie/capturer.mjs <id>`.

## Contrôles (joués une fois, 24.10)
- controle-commun --sans=mots : COMMUN OK sur la série (sortie dans RESULTAT.md de la voie) ; « mots » sauté par le contrat (G2), mesure indicative ci-dessous.
- mots-premier-ecran --max=70 : MOTS ECHEC (sbu1 184, sbu2 160, sbu3 186, sbu4 113, sbu5 114, sbu6 110, sbu7 136, sbu8 121).
- controle-alpha : ALPHA OK ; controle-sans-famille : SANS-FAMILLE OK (Nelson Sauvin 83 %, part « autres » dessinée).
- controle-une-question : écarts (pas de [data-role=contexte] : la série n’impose pas de ligne de contexte, M14 ; sélecteurs non balisés data-libre ; titres sans « ? » en sbu5, sbu6, sbu8).
- controle-panel (8 premiers écrans) : PANEL OK, remplissage médian 0,57, ressemblance 0,89.
- controle-choix : sans objet (Substituer est « ouvert » au registre).
