# flb3 — série b (la signature, puis le reste)

- **Chaleur** : tiède
- **Idée** : La signature dite en une phrase faite de ses seuls mots, en très grand, comme une note de dégustation : « Vin blanc, raisin, groseille à maquereau. » — « ses 2 fiches le disent toutes · vin blanc d'abord, chez les deux ». Puis ce qu'une fiche ajoute (« puis sauvignon blanc 1/2 »), puis en petit « le radar dit aussi » (familles).
- **Ce qui tient** : Se comprend en trois secondes ; Motueka devient « Citron vert, mojito. », pas « ultra fruité ».
- **Ce qui casse** : Phrase assemblée : risque de la lire comme une description écrite (elle ne l'est pas, la légende le dit) ; peu de chiffres.
- **Baseline** : Baseline suivie, sans écart : pictos au trait (épicé : p-spice, cannelle et clou croisés), couleurs des familles, α des fiches en gros avec le lot et sa jauge (le lot hors plage en orangé), usage en mot (« double usage »), stock en badge, lentille au style par défaut (les secteurs du radar que la stout 16D attend, en pointillé de leur couleur ; l'absolu à un toucher), légende derrière « ? », croix ronde, thème blanc, appui long ou survol long → fiche courte (D25).
- **Honnêteté** : Honnêteté : chaque mot vient de pack-fiches.json, traduit (D97 : white wine → vin blanc, gooseberry → groseille à maquereau, grape → raisin, black currant → cassis, Fresh lime → citron vert) ; « chez N » est compté sur les 318 variétés de proto-data.json (tags et descripteurs, hors lignes « Familles déclarées ») ; une famille que Hopsteiner déclare sans mot est dite « catégorie », jamais un mot ; l'inconnu est « ? » hachuré, jamais 0. La règle « signe » (fiches qui le citent, place dans la fiche, rareté ≤ 12 sur 318, ni mot générique ni nom de famille) est une règle de maquette, à valider.
- **Geste** : un toucher sur un des cinq houblons (Nugget, Nelson Sauvin, Citra cryo, Motueka, Cascade) change la fiche ; un appui long (500 ms) ou un survol long (750 ms) ouvre la fiche courte (capture `captures/flb3-fiche-courte.png`). États : `captures/flb3-legende.png`, `captures/flb3-motueka.png`.
- **Fichiers** : `etat.html`, écrit par `generer.mjs` (vocabulaire commun : `../flb1/socle-flb.mjs` ; données : `../flb1/donnees-flb.mjs` ; captures : `../flb1/capturer.mjs`).

## Sorties des contrôles (24.10)

- controle-commun --page=etat.html --sans=mots (les huit) : couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes OK → COMMUN OK (24.10).
- controle-panel (8 premiers écrans de la série) : remplissage médian 0,64, 1 sous 0,50, ressemblance moyenne 0,89, 0/28 paires presque identiques → PANEL OK.
- controle-une-question (indicatif) : ECHEC, 3 fautes : titre sans « ? » (le titre est le nom du houblon : c'est une fiche), aucun [data-libre], pas de ligne [data-role="contexte"]. Le facteur libre (la façon de dire ses arômes) est la page elle-même ; le sélecteur des cinq houblons est une navigation de maquette (nav), pas un réglage.
- controle-sans-famille (indicatif) : ECHEC, Nelson Sauvin 83 % : pas de forme neutre balisée [data-role="autres"] (convention D100) ; ses mots hors familles sont pourtant au premier plan, en mots (voir l'idée). À greffer en passe 2 si on garde la convention.
- mots-premier-ecran --max=80 --sans-donnees (indicatif) : 66 mots hors données → MOTS OK.
