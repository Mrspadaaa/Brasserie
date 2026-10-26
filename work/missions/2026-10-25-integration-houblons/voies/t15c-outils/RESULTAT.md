OK — Substituer, Dryhopper et Levure portés dans l'app (hopSubstitute, hopTiming) ; « Remplacer » écrit par la porte ; ×4 mesuré, bruyant

## Fichiers écrits
- Substituer : `src/ui/hopIndex/substituer/` : `index.tsx` (écran u4, copié de la maquette), `Radar.tsx`, `substituer.css`, `commun.ts`, `EcranApp.tsx` ; `donnees.ts` (t13) gardé.
- Dryhopper et Levure : `src/ui/hopIndex/dryhopper/` : `index.tsx`, `frise.ts`, `mesures.ts`, `dryhopper.css`, `commun.ts`, `EcranApp.tsx` (couche hopTiming : Dryhopper et Levure partagent le même brouillon d'outil) ; `src/ui/hopIndex/levure/` : `index.tsx`, `levure.css`.
- Hôte commun aux trois : `dryhopper/hote.tsx` (contexte, `PiedAnnuler`, mots de la bière), `outilApp.tsx` (brouillon d'outil, porte, pile), `CadreApp.tsx` + `cadre-outil.css` (tête à croix et titre de 18 px), `pied-annuler.css` (copie de la maquette).
- `HopToolLayer.tsx` : hopTiming (avec `step`) et hopSubstitute montent leur écran en `lazy`, drapeau hopV4 allumé seulement ; éteint, la couche provisoire reste.
- Maquette : `ecrans/substituer|dryhopper|levure/index.tsx` ne sont plus que des hôtes (`dryhopper/hote-maquette.tsx`) ; supprimés après copie : `Radar.tsx`, `substituer.css`, `dryhopper.css`, `frise.ts`, `mesures.ts`, `levure.css`. `fiche-sur-outil.tsx` reste (hôte maquette). Maquette reconstruite dans `maquettes/parcours/`.
- `tests/unit/hopIndexV4/outilsApp.test.tsx` (12 tests). Dans la voie : `banc-t15c.mjs`, `profil-t15c.mjs` (profil non abouti, voir plus bas), `captures/`.
- Rien touché dans `maBiere/`, `BrewWizard.tsx`, `MesuresWizard.tsx`, `fiche/`, `suggerer/`, `RadarBase.tsx`, `comparer/`.

## Critères
- `npx vitest run tests/unit/hopIndexV4 tests/integration` : 2283 passés, 14 en échec dans 8 fichiers, tous connus (#177) : `hopV55*` (6 fichiers), `monkey` (2), `YeastRecipeChoice` (1). Lancé avant l'ajout d'`ajoutNeuf` ; mon fichier `outilsApp` rejoué ensuite : 12/12.
- `audit_inputs.mjs` : INPUT PROTECTION AUDIT PASSED ; `designTokens.test.ts` : vert (2/2) ; `tsc` : exit 0 ; `npm run build` : vert.
- Maquette reconstruite (`construire.mjs` : CONSTRUIT OK, 9 pages) : `CHOIX OK (7 écrans ; 1 ouvert : levure)` (1re passe) ; `ETATS OK (139/139)` et `RADAR-BASE OK (9 vues)` rejoués après les derniers changements. `controle-choix` rejoué en fin de voie : CHOIX ECHEC (6 écrans conformes sur 7), la seule cause est l'étape Houblons (FONCTIONS-RAIL 36/37, rail de la voie t12d dont `rail.ts` a changé entre-temps) ; Substituer, Dryhopper et Comparer y sont conformes. À rejouer quand t12d aura rendu la main.
- `construire.mjs` signale aussi `FONCTIONS-RAIL ECHEC (36/37)` sur l'étape Houblons (rail de Ma bière) : voie t12d, hors de la mienne, je ne l'ai pas rejoué sur HEAD.

## Conception du port
- Brouillon d'outil local (comme la maquette, D120) : les gestes de moment, dose, remplaçant et levure changent une copie ; « Remplacer » et « Ajouter à ma bière » écrivent d'un coup par `versPatch` puis `applyHopV4Change` (test : patch de `hops`, et de `yeast` pour la levure) ; croix et « Annuler » ferment sans rien écrire (testé). Un refus de la porte est dit et l'outil reste ouvert.
- Dryhopper → Levure : même couche, étape locale ; `step: 'yeast'` ouvre Levure ; « Quand » revient.
- Mots de la bière : « ta stout », « Stout 16D », « Idaho 7 », « 18.10 » étaient figés dans les trois écrans (cas S1) ; ils viennent maintenant de l'hôte (nom du houblon, bière, style, date de la dégustation ou rien). La maquette garde exactement S1.
- Dryhopper s'ouvre sur ★ pour un ajout posé par « Placer » : reconnu à sa signature (dernier ajout, 4 g/L, actif 3 j).
- Comparer (n) depuis Substituer : `ouvrirCouche hopCompare` avec Nugget épinglé (`pinned`).

## Captures (390 × 844, `VITE_HOP_V4=on`, `?dev-local&etape=houblons`, ouvertes une par une)
`captures/substituer-repos.png` (u4 : tête, puce de moment, réponse, échelle, face à face, pied « Annuler · Remplacer ›  » avec « 46 g de Nugget → 42,5 g de Yeoman »), `substituer-apres-remplacer.png` (l'étape Houblons : Yeoman 42,5 g, ~59 IBU), `dryhopper-depuis-placer.png` (Idaho 7 posé par Placer, pile `tabs > wizard > hopCompare > hopTiming:a2`), `levure-souche.png`. Non ouvertes : `dryhopper-whirlpool.png`, `levure-etape.png` (prises, pas regardées). Les captures ouvertes sont celles de la 2e passe du banc ; la dernière passe a repris les mêmes fichiers après l'ajout d'`ajoutNeuf` : je n'ai pas rouvert `dryhopper-depuis-placer.png` depuis (l'étoile devrait y tenir le pouce).
Écarts vus : Levure ouverte sur a1 (Nugget à 60′) dit « rien ici » pour les autres levures et « après fermentation, rien ne change » (honnête : la levure n'agit qu'en dry hop actif) ; le tableau compare « Idaho 7 / +Nugget » parce que la base de la feuille est le premier ajout restant (logique de la maquette, S1 : Nugget seul).

## Fluidité : ouverture ×4 (dev, modules non groupés : pessimiste ; machine chargée par d'autres voies)
- À froid, chunk compris : Substituer 775 à 890 ms, Levure 150 à 340 ms.
- Sans bridage, ouvrir/fermer ×4, médianes (2 passes) : Substituer 484 et 505 ms, Dryhopper 310 et 349 ms, Levure 270 et 296 ms.
- Processeur ×4 plus lent, médianes : Substituer 996 puis 3265 ms (3880 sur une 3e passe pendant la suite vitest) ; Dryhopper 605 puis 1922 ; Levure 488 puis 1429. Écart de ×3 entre deux passes : les mesures du ×4 dépendent de la charge de la machine, je ne peux pas les donner comme fiables.
- Tas JS 97 à 99 Mo (budget 120). Erreurs de page : aucune.
- Profil (moteur ou rendu) non obtenu : `profil-t15c.mjs` a expiré à l'ouverture de la page (serveur chargé). Pour Comparer et Suggérer, T15b et T13 avaient trouvé le rendu React, pas le moteur.
- Substituer est le plus lourd (≈ 500 ms sans bridage : remplaçants du catalogue + face à face + matrices) ; pas d'échec de l'écran, mais c'est le seul qui pourrait « bloquer » à ×4.

## Doutes et limites
- **Écritures** : la consigne disait « les gestes de moment et de dose écrivent par la porte ». Je les ai gardés dans le brouillon d'outil (fidèle à la maquette et à « Annuler », et un geste de rail ne réécrit pas le wizard une trentaine de fois) ; seule l'inscription écrit. Voir DÉCISION.
- « Annuler » dans Dryhopper ouvert depuis Placer : l'ajout posé par Comparer reste (Comparer l'a déjà écrit, 4 g/L actif 3 j) ; seuls les réglages faits dans Dryhopper sont jetés.
- Fermer = un niveau (`onClose`) : Substituer ouvert depuis une fiche posée sur Comparer rend la main à Comparer, pas à l'étape Houblons. Le retour du téléphone ferme la couche, pas l'étape Levure ; la fiche posée sur Dryhopper/Levure n'a pas d'entrée d'historique (comme T13).
- Substituer vise le premier ajout du houblon (comme la maquette) : deux ajouts du même houblon (60′ et dry hop) ne se distinguent pas, la route ne porte que `hopKey`.
- La visée (« plus floral, moins résineux », ★) est la constante `DEMANDE_DEGUSTEE`, comme Ma bière et Comparer.
- « Employé en … ; stout citée » (Substituer) dit le nom du style de la recette hors S1.
- Pas de test de défilement ni de rail au doigt dans l'app (clic sur les étapes seulement) ; `controle-etats`/`controle-choix` portent sur la maquette, pas sur l'app.
- Essais : un par critère, sauf le banc (4 passes : ordre des étapes, pile de couches, charge) et `construire`/contrôles (2).

DÉCISION À PRENDRE : où écrivent les gestes de Dryhopper (moment, dose) ? Options : (a) brouillon d'outil local, écriture à « Ajouter à ma bière » (fait ; « Annuler » est vrai, le rail est fluide) ; (b) écriture à chaque geste par la porte, « Annuler » rétablit l'état d'ouverture (conforme au mot de la consigne, mais chaque cran du rail réécrit le brouillon du wizard). Recommandation : (a).

DÉCISION À PRENDRE : fluidité de Substituer (≈ 500 ms sans bridage, 1 à 3 s à ×4 en développement, mesures bruitées). Options : (a) mesurer sur un build de production, machine au repos, avant de décider ; (b) afficher d'abord la tête, la réponse et l'échelle, puis le face à face, les matrices et les huiles après le premier rendu ; (c) mettre `substitutes` au worker (T7 existe, `useCalcul` le prévoit). Recommandation : (a), puis (b) si le ×4 de production dépasse 1 s.

DÉCISION À PRENDRE : « Annuler » après « Placer » doit-il retirer l'ajout posé ? Options : (a) non, l'ajout reste (fait) ; (b) la route `hopTiming` porte un indicateur « neuf » posé par Comparer (touche `useFullScreenRoute.ts` et `comparer/EcranApp.tsx`, hors voie). Recommandation : (b) avec T14, car l'heuristique de signature (4 g/L, actif 3 j) ne vaut pas une donnée.

CONNAISSANCE : des textes figés sur le cas S1 (« ta stout », « Idaho 7 », « 18.10 ») se cachaient dans les écrans de la maquette ; un port doit chercher ces mots (grep) et les remplacer par des termes de l'hôte, sinon l'app ment sur toute recette qui n'est pas la stout.
LEÇON PROPOSÉE : aucune
