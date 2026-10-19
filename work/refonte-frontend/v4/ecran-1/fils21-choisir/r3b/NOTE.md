r3b · Jusqu'où : la dose limite par houblon d'abord, la carte ensuite (r3 reste intacte)

- **Ce qui tient** :
  - **Premier plan : la liste « jusqu'où »**. Une ligne par houblon (Citra, Galaxy, Idaho 7, Cascade), rangée par dose limite : un classement par critère, pas un « meilleur ».
    - Chaque ligne donne la dose où le houblon sort de ma 16D : « ~ jusqu'à ≈2,4 g/L », simulé, ≈ interpolé entre les doses de la grille 1, 2, 4, 8 g/L.
    - Elle dit la famille qui le fait sortir (« sort par tropicaux ») et la confiance du moteur.
    - Elle reprend les acquis de la baseline : couleur du houblon et son nom, α du lot (≠ pour Galaxy), usage en mot, stock en icône grise. L'appui long sur le nom ouvre la fiche.
  - **La barre de dose est un quantile dotplot**, de 0 à 8 g/L :
    - en pâle « 16D », hachuré « hors » ;
    - un trait orangé à la dose limite ;
    - les 20 brassins simulés, chacun posé à sa propre dose limite, à la couleur du houblon ;
    - le trait noir de la dose réglée, et le compte « ~8 sur 20 restent à 2 g/L ».
  - L'incertitude se compte et se voit, sans flèche par famille : une seule mention « haut partiel » en tête de liste.
  - **À quel moment** : le houblon touché déplie sa dose limite à chaque moment. Citra : 60′ > 8 g/L, 10′ ≈4,1, whirlpool ≈3,9, en fermentation ≈2,4, après ≈2,3 g/L.
  - **Le geste au premier écran**, prouvé dans `geste-r3b.json` (Chrome, 390 × 844, doigt) :
    - avant, 2 g/L : Citra ~8 sur 20, Cascade ~12, trait de dose x = 83 ;
    - pendant, doigt gardé à 6 g/L, « simulé à 4 » : Citra ~4, trait x = 160 ;
    - après, levé à 8 g/L : Citra et Galaxy ~1 sur 20, trait x = 314 ;
    - « après » touché : Idaho 7 passe de ≈7,4 à ≈6,7 g/L, Galaxy de ≈2,7 à ≈2,2 ;
    - Pomona en fermentation : Idaho 7 ≈5,3, Cascade ≈6,1, et ils sortent par les agrumes. La biotransformation se voit dans la liste et en une ligne sourcée.
  - **Retouches communes appliquées** :
    1. départ en dry hop en fermentation avec US-05, « après » à un toucher ; « Verdant, Diamond : pas encore simulées » dit une fois, sans bouton barré ;
    2. une ligne de réponse (« ~ En fermentation, US-05 : Citra ≈2,4 g/L, Idaho 7 ≈7,4 g/L. »), les explications dans la légende ;
    3. les réglages au premier écran (moment, levure, ensemble, dose) ;
    4. le résineux de ma dégustation une seule fois, hors de la liste ;
    5. aucun code sans mot (« 16D », « hors », « > 8 » dans la barre ; « brassin » accordé) ;
    6. une marque de borne partielle ;
    7. Lafontaine et Shellhammer 2018, lecture H, « vérifié (K) », dans « Pourquoi si large ? » (les agrumes plafonnent à 7,0, l'herbacé monte à 10,4) ;
    8. `profils-simules.json` à 4,75 % vol. (Citra à 10′ ≈4,1 g/L, plus hors du style à 4 g/L en agrumes) ;
    9. le stock en icône, sans blocage ;
    10. les acquis de la baseline ;
    11. la dose aimantée à la dose simulée la plus proche, et dite (« 6 g/L · simulé à 4 ») ;
    12. des tirages fixes à réglages fixes.
  - **Retouches propres à r3** :
    - Motueka et Nelson Sauvin sont hors classement, sur fond hachuré, « inconnu : composés non publiés » ;
    - une couleur par houblon, pour les chemins comme pour les points ;
    - les 20 points de la carte ne s'affichent que pour le houblon touché.
  - **L'ajout cumulé** : « Ensemble » Citra + Cascade, + Galaxy ou + Idaho 7 ajoute une ligne en tête (« ~ déborde à 2 + 2 g/L · ~6 sur 20 · dose limite non simulée (une seule dose) »).
  - **À un toucher** :
    - la carte des chemins de dose ;
    - « Pourquoi si large ? », le bloc de r3 gardé : rapports au seuil en log avec leur largeur, calculé contre mesuré, 29 lots de Cascade, E06, les trous.
  - **Honnêteté de la dose limite** : dans 10 des 20 tirages, ma bière dépasse déjà la 16D sur une famille, à cause de sa propre plage (bornes non publiées pour Nugget). Pour chaque brassin, l'ajout est jugé sur les familles que ma bière ne dépasse pas encore, et c'est écrit : « ma bière incertaine sur 10 ».
  - **Corrigé pendant le geste** : le curseur rétrécissait sous le doigt, parce que l'étiquette de dose s'allongeait. Sa largeur est maintenant fixe.
- **Ce qui casse** :
  - **Troisième passe** : « sort par · restent sur 20 à 2 g/L · confiance » est écrit une fois en tête de colonnes ; chaque ligne ne garde que le picto et la famille de sortie, le compte et le mot de confiance. Les « : » et « · » isolés sont retirés, ainsi que « déjà » et « Id. » ; « 16D » et « hors » sont nommés une fois, sur la première barre qui a la place. Premier écran : 61 mots hors données.
  - La dose limite est interpolée entre 1, 2, 4 et 8 g/L : le moteur ne simule rien entre ces doses (≈ et aimant le disent).
  - La levure ne compte que US-05 et Pomona (grille du moteur).
  - L'ajout cumulé n'a qu'une dose (2 + 2 g/L, 3 j), donc pas de dose limite.
  - La carte reste chargée près de ma bière. Elle n'est plus au premier plan.
  - Les lignes sont des boutons qui contiennent des valeurs touchables (source au toucher) : des commandes imbriquées, à revoir pour le clavier.
- **Contrôles** (sur `etat.html`) :
  - COMMUN OK avec `--sans=mots` : COULEURS, AU-STYLE, SURVOL, BLOCS, CONTRASTE, FICHE, STANDARD, TRAIT, LEGENDE et PARLANT ;
  - MOTS `--sans-donnees --max=70` : « r3b 61 mots (hors données) », MOTS OK ;
  - LISIBLE OK ;
  - SIMULATION OK ;
  - CUMUL OK ;
  - ALPHA OK (5 voies sur 5) ;
  - FICHE-BASELINE OK (fiche de Nugget, 12 familles nommées, 19 pictos, 0 faute) ;
  - D14 OK sur 12 états (aucun null, undefined ni NaN).
- **Pire contraste** : 5,69:1, « Absolu ». 109 textes mesurés ; 6 sur fond hachuré, non mesurables.
- Générée par `generateur-r3b.mjs` avec `../r1/socle-r.mjs`. Preuve du geste : `jouer-r3b.mjs` → `geste-r3b.json`.
- Captures : `captures/r3b-390.png` (page), `r3b-haut`, `r3b-geste-avant`, `-pendant`, `-apres`, `r3b-ensemble-pomona`, `r3b-carte`, `r3b-pourquoi`.
- États par l'URL : `?d=8`, `?m=dryPost`, `?l=Pomona`, `?p=Citra,Cascade`, `?carte&h=Cascade`, `?pq&h=Citra`, `?abs`.
