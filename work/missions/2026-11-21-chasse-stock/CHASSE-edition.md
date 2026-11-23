# CHASSE — regard « édition » (STM), 21.11

Fiche d'un article et sa modification. Version jugée : `en-ligne/2026-11-21-tour8` (build de test, fixture « ZZ TEST » de `scripts/parcours/fixtures/chaines.mjs` option `rayons`, plus 4 articles ajoutés : CIP alcalin, Désinfectant, Gants, Mousse d'Irlande ; aucun Gemini, aucune donnée réelle).
Joué au doigt (tap tactile) : 390 clair pour les quatre articles (houblon Citra, malt pilsner, levure US-05, autre stock CIP alcalin) ; cave 390 et 1280 cave seulement sur Citra. Captures dans `C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/cap/` (noms cités ci-dessous). Deux tours de gestes ; aucun défaut neuf au second (arrêt). Hauteurs mesurées sur la zone qui défile de la fiche (`.sfp-defile`).

Gravité : 0 bloquant, 9 gênants, 7 mineurs. Aucun n'est déjà en DEFAUTS/BUGS (STOCK-ESPACE et WX2-2 ne couvrent pas la fiche).

## Hauteurs mesurées (390, fiche ouverte, zone utile 731 px)
Citra 1083 px, malt 1098, levure ~1131, CIP alcalin ~950 ; « Modifier la fiche » ouvert : 1323 / 1339 / 1371 / 1189. Soit 1,5 à 1,9 écran. Carte « Corriger » 248 px ouverte (76 replié), « Seuil + Fiche » 258, « Modifier » 74 replié puis ~305.

## Défauts

| id | gravité | geste exact | attendu | constaté | mesure |
|---|---|---|---|---|---|
| STM-1 | gênant | fiche Citra, Corriger +10, toucher « Commander » | Commander garde ma saisie ou la dit perdue ; mène à la commande de CET article | la fiche se ferme, la correction +10 est perdue sans mot (stock reste 500), on tombe sur Courses ; pour malt, levure et CIP (rien à commander) Courses montre seulement Citra : l'article touché n'y est pas | 1 geste, 0 confirmation ; texte Courses : « 1 manque ZZ TEST Copier ZZ TEST Citra » |
| STM-2 | gênant | Corriger +10 (ou seuil tapé), flèche retour | « abandonner ? » ou brouillon gardé | fiche fermée, saisie perdue sans confirmation (4 articles) | 0 confirmation ; stock inchangé |
| STM-3 | gênant | ouvrir la fiche, lire | un fournisseur cité une fois | Citra : « Houblon · ZZ TEST > » (en-tête), « Fournisseur ZZ TEST > · changer » (carte Fiche), champ « Fournisseur » (Modifier) = 3 fois ; capture 02 : s'y ajoutent « Entrée 27.04 · Brau- und Rauchshop GmbH » et deux « Achat · Brau- und Rauchshop GmbH » dans « Ce qui a bougé » = 6 fois. Trois liens (en-tête, nom, « changer ») ouvrent le même formulaire. « Besoin » aussi redit : « besoin 650 g » sous la barre, « 650 g · 2 sources », « Manque 150 g », pastille « manque 150 g » | 3 à 6 occurrences |
| STM-4 | mineur | replier « Corriger le stock » | carte réduite au titre | reste 76 px, ~35 px vides sous le titre (la bande vide de la capture 02) | 248 → 76 px ; `corr-replie.png` |
| STM-5 | mineur | ouvrir une fiche sans rien changer | Enregistrer grisé tant que rien n'a changé | Enregistrer et Commander toujours actifs ; Enregistrer ferme la fiche sans rien écrire | pied « Commander\|Enregistrer » sans (off) |
| STM-6 | gênant | taper un seuil (7) puis Entrée ; idem dans « Il en reste » | Entrée valide ou ferme le clavier | rien : minStock inchangé (malt : reste 10), clavier ouvert ; il faut défiler jusqu'à Enregistrer | 0 effet, 4 articles |
| STM-7 | gênant | Modifier la fiche, changer le nom, Entrée | Entrée enregistre (ou passe discrètement au champ suivant) | passe à Catégorie et OUVRE sa liste plein écran (Additif, CIP alcalin, Désinfectant, EPI…) ; encore Entrée sur Catégorie, Unité, Fournisseur ; ne sauve jamais | focus `stock-category`, nom non écrit ; `Citra-mod-entree.png` |
| STM-8 | gênant | Modifier la fiche | rangée pleine | « Fournisseur » seul en demi-largeur, moitié droite vide ; long nom coupé (capture 02 : « Brau- und Rauchshop G… ») | champ ~170 px sur 370 ; `Citra-mod1.png` |
| STM-9 | mineur | capture 02 : Seuil | champ vide « aucun » sans seuil | « 0 » à côté de « sans seuil : aucune alerte inventée » (contradiction) ; cause : saisir 0 enregistre 0 (pas « aucun »), reorder passe à false | minStock = 0 après Enregistrer |
| STM-10 | gênant (à confirmer sur vraies recettes) | Citra : nom « ZZ TEST CitraX », Enregistrer | besoin et manque suivent l'article | la liste passe de « manque 1 » à « manque 0 » : le manque de 150 g disparaît au renommage (fixture : recettes liées par nom) | chiffre faux possible ; sans effet si les vraies recettes sont liées par `stockItemRef` |
| STM-11 | gênant | 1280, fiche Citra | colonnes équilibrées | colonne gauche (Besoin, Ce qui a bougé) finit à y≈480, la droite va à y≈835 : trou ~250 px sur 364 de large ; Seuil, Fiche, Modifier tout en bas à droite | gauche 392 px, droite 600 px ; `g-fiche-cave.png` |
| STM-12 | mineur | cave, 390 et 1280 | champ lisible | « 500 » et « aucun » ont un pavé gris sombre de fond dans la carte, lu comme du texte sélectionné | `p-fiche-cave.png`, `g-fiche-cave.png` |
| STM-13 | mineur | Corriger +10 puis « Perte » | message court près du bouton grisé | Enregistrer grisé, le refus est 2 cartes plus haut ; cite « Inventaire physique » ou « Erreur de saisie » alors que les boutons sont Compté, Perte, Autre | `Citra-corr-enreg.png` |
| STM-14 | gênant | + > Nouvel article | nom par défaut, ou raison dite quand « Créer » est grisé | nom vide (placeholder « Malt Pale Ale, Houblon Citra… »), catégorie vide, unité « kg » préremplie quelle que soit la famille ; « Créer l'article » grisé sans dire pourquoi ; Entrée à vide : rien. Le nom porte enterkeyhint « done » (bien) | `cre-form.png` |
| STM-15 | mineur | Enregistrer après seuil ou renommage | un signe que c'est écrit | fiche fermée, liste au même défilement (bien), aucun retour : seul le toast de correction existe (« ZZ TEST Citra : -100 g — Perte ou péremption. ») | 0 toast pour seuil et renommage |
| STM-16 | mineur (lu au code, non joué) | fiche d'une levure | une seule DDM | « DDM ? » en pastille d'en-tête, ligne « DDM » dans Fiche, champ DDM dans Caractéristiques : 3 fois | `src/ui/StockDetailSheet.tsx` ~l. 320, 401, 440 |

## Vérifié bon (à ne pas casser)
Corriger −100 + Perte + Enregistrer : stock 500 → 400, mouvement « Correction · perte ou péremption 500 → 400 g » visible en rouvrant, toast clair. Seuil 999999 : refus lisible, Enregistrer grisé. Nom vidé : « Indiquez le nom de l'article » et Enregistrer grisé. Retour ramène la liste au même défilement. Supprimer grisé avec sa raison (brassins et recettes qui l'utilisent), mais le texte long vit dans le menu ⋯. « changer » ouvre Modifier la fiche et défile dessus.

## Non joué
1280 clair, 1280 des malt, levure et autre ; cave du formulaire de création ; Entrée sur le dernier champ (Fournisseur) ; « Compléter avec l'IA » (aucun Gemini) ; annulation d'un renommage par Retour (seule la perte de correction est prouvée).
