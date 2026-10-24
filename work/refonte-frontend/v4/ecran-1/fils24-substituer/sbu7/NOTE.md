# sbu7 — Substituer, série u (v0)

- Chaleur : chaude
- Idée : le nuancier : chaque houblon un échantillon de peinture (bande de ses familles, marqué double, « autres » en gris), avec le liseré de Nugget sur chacun, en éventail.
- Ce qui tient : couleur osée, densité maximale (remplissage 0,77), Nelson « autres 83 % » assumé.
- Ce qui casse : la légère rotation de l’éventail gêne la lecture fine ; les noms longs se tassent.
- Baseline : suivie (pictos au trait, épicé p-spice, couleurs des familles, α et usage en mot, au style par défaut, stock en badge, thème blanc, croix, légende derrière « ? », fiche à l’appui long). Aucun écart.
- Captures : ../captures/sbu7-premier-ecran.png, -page.png, -choix.png (un autre remplaçant), -fiche.png, -legende.png.


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
