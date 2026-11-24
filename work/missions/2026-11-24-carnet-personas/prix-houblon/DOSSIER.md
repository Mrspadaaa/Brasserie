# Dossier prix-houblon

Ses mots (24.11, après le relevé) : « https://www.brauundrauchshop.ch/citra-136-2 Mais ce genre de lien doit être lue correctement, et surtout on doit comparé les bonnes données ». « Ce genre » = toute page à prix au gramme ou à paliers de quantité, pas seulement celle-ci : la règle se teste sur au moins 2 autres pages du banc de même genre si elles existent, et la comparaison au même étalon (CHF/kg, CHF/L) vaut partout où Comparer classe.

Ses mots : « Et le prix... » (16:46, Citra « dès 0,10 » contre « ≈4 · 3,72 € ») ; puis après Relire (19:17, capture work/missions/2026-11-23-reprise-soir/plaintes/2026-11-24-relire-citra.jpg : « Page relue », prix « ? », en-tête « prix EUR ») : « Ça fonctionne même plus, si il faut modifier iatask c'est pas un problème... » (accord : modifier aiTask).

Relevé sur les vraies pages par le persona brasseur (work/missions/2026-11-24-carnet-personas/brasseur/RESULTAT.md, lignes 18-20, 55-70 : lis ce tableau) :
- Brau- und Rauchshop Citra 13.6 % : prix AU GRAMME (0,1044 CHF/g ; 0,08 CHF/g dès 1 000 g ; paliers par quantité) → l'app a lu « dès 0,10 » sans unité et l'a classé 1er.
- MotlerHops CITRA® (US) : 50 g 3,72 € (solde, au lieu de 4,38), 250 g 14,06 €, 500 g …, 1 kg ≈ 40,69 € ; l'app a montré « ≈4 · 3,72 € » sans dire 50 g, et ≈3 / ≈4 selon l'écran (corrigé depuis par R37 : un seul « ≈ »).

Règles :
- R39 : un prix lu porte TOUJOURS sa quantité (conditionnement « 50 g · 3,72 € ») ou son unité (« 0,10 CHF/g ») ; jamais un nombre nu.
- R40 : pour classer et comparer des articles vendus au poids ou au volume, l'app compare au même étalon (CHF/kg, CHF/L), dit comme tel ; un prix au gramme se convertit, il n'est jamais comparé à un prix de sachet.
- R41 : le prix montré est celui du conditionnement choisi (Q-1 A : le choix fait le prix) ; sans choix, le plus petit conditionnement avec sa quantité, et une ligne « au kilo » dans Comparer.
- R42 : « Relire » d'un article à prix sans quantité retrouve un prix selon R39 ou dit « prix au gramme seulement : … CHF/g ».

## Ajouts du pilote (24.11, regroupés)
- Ses mots : « https://www.brauundrauchshop.ch/citra-136-2 Mais ce genre de lien doit être lue correctement, et surtout on doit comparé les bonnes données » : toute page à prix au gramme ou par paliers ; comparaison au même étalon (CHF/kg, CHF/L) partout où Comparer classe ; tester sur d'autres pages du même genre au banc.
- Ses mots : « Et pourquoi il y a pas de bouton pour escaler la lecture ? » : ESCALADER-SUR-MANQUE (DEFAUTS-RECURRENTS.md) : un champ attendu manquant (prix « ? », nom, caractéristiques sous le seuil) montre « Escalader » (Neon) sur la fiche et dans Comparer ; ligne PX-3.
- Ses mots : « En plus on utilise des IA plutôt capables et qui sont faites pour la lecture de page web. Il doit y avoir un problème quelques part... » : CAUSE RACINE d'abord, prouvée ou réfutée dans RESULTAT.md, en montrant le texte et la réponse réellement envoyés à l'IA pour les 2 pages. Hypothèses : (1) schema.org de Brau donne 0,1044 (au gramme) → iaUtile juge le prix présent, l'IA n'est jamais appelée ; (2) « l'IA ne remplace jamais un champ trouvé » empêche Flash-Lite, Hydrogen, Neon de corriger un prix structuré sans unité ; (3) texte tronqué (12 000 car.) avant le tableau des paliers.
