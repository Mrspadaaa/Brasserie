# s4 — Suggérer libre : la cible qu'on tire depuis sa levure (chaude, passe 2, 09.11)

Idée : comme le graphe de conduite (sa référence « très UX UI »), une surface à axe gradué et une poignée qu'on tire. L'axe horizontal est l'atténuation (70–95 %), les trois couloirs sont les phénols (+ fiche · non documentés · − fiche) ; chaque levure est une bande (sa plage) dans son couloir ; la mienne (Abbaye) est ambre. La poignée part de ma levure ; la tirer en bas à gauche veut dire « moins épicée, moins atténuée » : la zone visée s'encadre, les bandes hors zone s'effacent, la liste se reclasse avec l'écart dessiné (flèches) et la disponibilité.

## Ce qui vient d'où
- `refs/conduite-app-aimee.jpg` (acquis) : la poignée noire à flèches, l'axe gradué, la grille tiretée, la valeur lue sur le dessin, aucune phrase.
- q2b : la liste à ⊕, « Comparer (n) » ; r1 : la pastille de disponibilité d'abord.
- Ses mots du 09.11 : « levure d'abbaye je veux pouvoir le choisir une qui rend ma triple plus ronde et moins épicé » → cadres 1 et 2 ; « soit générique » → les couloirs se rebasculent (cadre 3 : biotransformation).
- Son choix G (radar) : l'inconnu est un couloir gris uni, jamais hachuré ; « rare en Europe » est un tireté creux.

## Cadres
1. Repos : poignée sur Abbaye (77–83, phénols + déclarés) ; T-58, M31 Tripel, 3787 dans le couloir phénols + ; WLP530 non documenté ; M47 Abbey et BE-256 sans phénols ; liste « Autour d'Abbaye » (M47, BE-256, T-58, M31, WLP530, 3787). 2. Toucher : poignée tirée en bas à gauche → zone « sans phénols · 72–80 % », M47 seule dans la cible (↓ phénols, très fruité, ← 73–77 %, floculation haute) ; à côté : BE-256 (sans phénols mais → 82–86 %, 0 g/L résiduels) et WLP530 (rare, phénols ?). 3. Cas limite : couloirs passés en « biotransformation » : aucune levure d'Europe documentée, la cible est vide et le dit ; West Abbey Ale (Escarpment, rare) seule documentée.

## Honnêteté (TROUS-COMBLES.md, catalogue)
- « Rondeur » : glycérol 0 sur 12 → l'axe est l'atténuation, dite comme telle ; les sucres résiduels Fermentis (BE-256 0 g/L, T-58 22 g/L) sont étiquetés « rés. » et « fabricant ».
- Abbaye : POF + déclaré ; tropical, épicé, banane à chaud ; 77–83 %. M47 : « fewer phenols than Belgian Ale », « exceptionally fruity », floculation haute, 73–77 %. BE-256 : esters élevés, banane, florale, POF − ; 82–86 %. T-58 : esters élevés, POF + girofle ; 72–78 %. M31 : épices, esters, phénols ; 82–92 %. WLP530 (US, liquide) : cerise, prune, poire ; phénols non documentés ; 75–80 %. 3787 (US) : esters fruités et phénoliques ; 74–78 %. West Abbey Ale : High Biotransformation, phénolique ; 74–86 %.
- Aucune intensité chiffrée de banane ou d'épicé : la position verticale est un fait de fiche (déclaré +, déclaré −, rien), pas une note.
- La fixture commune 8,0 kg · 1,066 · 45 · 12 est gardée (BRIEF) ; le mot « triple » n'est pas écrit.

## Boosters UX (boosters-ux)
- cible-poignee — ajuster et comparer ; poignée tirée sur deux axes, zone visée dessinée, bandes effacées hors zone.
- liste-ecarts — choisir ; flèches ↓ (moins de phénols), ← → (atténuation plus basse ou plus haute, rouge si à l'opposé de la direction).
- B1 OK · B2 OK (la cible domine) · B3 ECHEC mesuré (96 mots hors données, 136 en défaut) · B4 OK · B5 OK · B6 OK · B7 OK (brun = phénols +, teal = phénols −, gris uni = inconnu, violet = biotransformation) · B8 OK (direction sans donnée : cible vide, dite) · B9 s.o. (statique ; au port : la poignée suit le doigt, les bandes s'effacent en 150 ms) · B10 s.o. · B11 OK « M47 est la seule de chez nous sans phénols et moins atténuée qu'Abbaye » · B12 OK · B13 OK (poignée 40 px, ⊕ 36 px).
- Écart voulu : les mots au-dessus de 72 sont des noms de levure, descripteurs de fiche et étiquettes de couloir ; aucune phrase d'aide.

## Contrôles
PAGE OK · MOTS 96 hors données (136 en défaut) · PANEL : voir RESULTAT · aucune valeur brute anglaise.
