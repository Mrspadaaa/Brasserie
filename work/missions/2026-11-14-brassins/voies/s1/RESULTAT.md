OK — Carnet de recettes r2a porté (carnet, feuille, filtre, archives, vide) ; geste c2a laissé à la feuille actuelle.

G1 TSC OK · G2 TESTS OK (20/20 ; intégration productionCatalog + recipeList 21/21) · G3 CAPTURES OK (27 captures, rejouées le 15.11 à 21:47, ouvertes) · G4 HORS OK.

## Fichiers écrits
- `src/ui/production/recettes/recettesModel.ts`, `recettes.css`, `CarnetRecettes.tsx` (écran r2a complet).
- `src/components/tabs/ProductionTab.tsx` : sous-onglet Recettes = `<CarnetRecettes>`. `ProductionCatalog.tsx`, `fabActions.ts` non touchés.
- `tests/unit/port-s1-recettes.test.tsx` (13 tests) ; `tests/integration/productionCatalog.test.tsx` et `recipeList.test.tsx` adaptés (maquette gagne, intention gardée).
- Dans la voie : `banc.mjs`, `INVENTAIRE.md`, `tests.txt`, `captures/` (27), `journal.json` (gestes sans effet, erreurs de page, console : tous vides).

## Écarts relevés sur les captures (390 clair, cave, 1280), numérotés
1. Points du métro noirs, puis gris : CORRIGÉ (traduction de la bande EBC en aplat ; les fixtures du banc n'avaient pas de `colorEbc`, ajouté). Recapturé, ouvert : jaune, doré, ambre, brun, présents des deux thèmes.
2. Cave : point plein stout presque invisible : CORRIGÉ (filet `[data-theme='cave'] .rcp-st[data-der]`), recapturé, ouvert.
3. Capture « filtre » prise sur un état de recherche vide (banc) : CORRIGÉ (filtre joué avant la recherche), recapturé, ouvert.
4. « Fermenteur libre » absent : voulu (ACCORD 2).
5. « stock réservé » de la Pale Ale absent : voulu (ACCORD 5). « dernière : 18.07.2026 » au lieu de « dernière en août » : l'app dit la date complète.
6. « Aux besoins » → « Planifier » ; « Modifier en v4 » → « Modifier » : voulus (ACCORD 1, 4).
7. Compteurs 3 / 11 sur la barre des sous-onglets : absents de r2a, présents par le choix e11a : gardés.
8. Feuille d'une recette : une ligne par ingrédient avec « libres », la maquette regroupe les maltes sur une ligne : écart voulu (plus précis), pas de défaut.
9. Le + du bas dit « + Recette » (la maquette : « + » seul) : libellé de la barre de l'app, hors de cette voie.
10. 1280 : « 11 recettes » paraît bleuté sur la capture ; c'est l'antialiasing du petit texte gris (couleur calculée = celle de `rcp-total`), pas un lien. Non corrigé.
11. Focus visible (anneau) sur le × de la feuille à l'ouverture : accessibilité, laissé.
Aucun défaut bloquant restant dans mes vues. Cible tactile : toute la ligne et chaque verbe ≥ 44 px.

## Essais : 1 sur 3 par critère (G1 à G4 verts au premier passage de ce tour).

## DEMANDE EXECUTANT : aucune (faite par l'auteur).

## ACCORD (à lever par le pilote, sans bloquer)
1. « Aux besoins » / « Annuler » (r2a) : aucune liste de besoins dans le modèle, aucun champ neuf permis ; le port dit « Planifier » (le manque entre dans « À commander » du Stock). Un vrai « mettre aux besoins » demande un champ de stock.
2. « Fermenteur libre : F3… » : aucune donnée de cuve libre. Ligne retirée.
3. Photo / Lien / Texte du vide : les trois ouvrent l'assistant de recette.
4. « Modifier en v4 » : « Modifier ».
5. « stock réservé » : un brassin planifié ne réserve pas le stock ici.
6. « pas brassées depuis un an » (Archives) : l'archive est un rangement manuel ; le port dit « n lignées aux Archives ».
7. La lignée montre sa dernière version et ses compteurs ; la feuille d'une lignée à plusieurs versions modifie la dernière.

## DÉCISION À PRENDRE
1. Geste c2a (« Créer d'un toucher, chaque effet annulable », ↶, Tout défaire, Date à définir) et son repos : NON portés, car la consigne de la voie réserve la feuille « Brasser » et son choix de date à une revue (15.11). Option : une voie suivante porte c2a une fois la feuille de date choisie. Recommandation : oui, après ce choix. Son choix « Créer : c2a » reste donc non honoré dans l'app à ce jour : à relever par le pilote (règle n° 1).
2. Où loger Comparer deux recettes et le bilan des recettes, retirés de l'écran Recettes : à lui montrer en mini maquettes (L24). Recommandation : menu « … » de la feuille recette.

## Doutes
- Sur de vraies données, un malt ou un houblon sans article reste « À vérifier » : voulu. Un adjuvant n'y entre jamais.
- Build non lancé (consigne) : le pilote le fait.

CONNAISSANCE : `entry.swatch` est une classe Tailwind (« bg-ebc-gold »), pas une couleur CSS ; la paille d'app (`--ebc-straw`) est noire en clair : pour un point de couleur de bière, utiliser des aplats (paille r2a : #D9B414). Une fixture de banc sans `colorEbc` donne des points gris : elle doit le porter.
LEÇON PROPOSÉE : aucune

## Corrections ks1 (VERDICT.md de ks1 : 13 problèmes, 2 bloquants)

Recaptures du banc (21:46 à 21:48) ouvertes : recette-prete, recette 390 clair et cave, recette 1280, recherche, recherche-vide, filtre, repos 1280. G1 à G4 rejoués verts.

1. [B] COCHÉ. Source lue (L14) : la feuille affiche l'IBU calculé de la fiche (`ibuListe`, décision du 07.11 n° 3 dans `productionCatalog.recipeEntries`), pas une cible mélangée. La donnée du banc était fausse : Saaz à α 12 %. Fixture corrigée (Saaz α 3,5 %, `voies/s1/banc.mjs`) : la Blonde affiche 21 IBU (capture). Tests : Saaz 3,5 % donne 15 à 30 IBU, 12 % donne 60 à 80 (le code calcule bien), la feuille de la blonde dit 15 à 30. Code non changé : le port affiche déjà l'IBU de la fiche.
2. [B] COCHÉ. La phrase de la tête se calcule sur `grouper(toutes)` (lignées courantes, sans filtre) ; sous le champ, « 5 sur 6 lignées » (`role=status`) ; « Aucune recette ne correspond. Effacer » reste dans la liste. Test : « zzzzzz » et « neipa » laissent « 1 prête à brasser / 1 à un achat près », jamais « Rien de prêt », et « 1 sur 2 lignées ».
3. COCHÉ. `lier()` : mesure collée (« Citra 250 g »), pièce détachée par une virgule (« ZZ Levure Belle Saison, 1 sachet ») ; en gras le nom seul pour une pièce, nom et quantité pour une mesure, comme r2a. Test.
4. COCHÉ. « 2 sachets libres », « 3 sachets libres » (pluriel accordé dans `dire`). Test.
5. COCHÉ. « Depuis la v2 » ne préfixe plus « levure » quand le nom contient déjà le mot. Test.
6. COCHÉ. Un malt en kg reste en kg à la virgule : « ZZ Malt Munich 0,6 kg ». Test.
7. COCHÉ. Le bouton « Planifier le brassin » de l'encart est retiré ; l'information reste ; un seul verbe au pied (« Brasser quand même »). Test adapté. Pas de lien « À commander » : le Stock n'a pas de cible de navigation dans ma voie (aucun lien inventé).
8. ÉCARTÉ. La feuille « Préparer un brassin » appartient à la voie d1 (« à porter dans la feuille que d1 redessine », dit par ks1) ; hors de mon OWNS. À reprendre par d1 : redire « il manque … » quand elle s'ouvre depuis une recette incomplète.
9. COCHÉ. Les prêtes sans brassin planifié passent avant celles qui en ont un (capture : Blonde puis Pale Ale ZZ-020). Test.
10. COCHÉ. Le focus d'ouverture va au contenu (`tabIndex -1`, sans anneau) au lieu du ×, pour les feuilles recette et Filtrer ; captures 390 clair, cave, 1280 : plus d'anneau. Le focus clavier des boutons reste franc.
11. COCHÉ. Les deux feuilles prennent `lg:max-w-xl lg:mx-auto` comme les autres feuilles : fenêtre centrée à 1280 (capture).
12. ÉCARTÉ. Les pastilles « Brassins 0 / Recettes 0 » viennent du choix e11a (barre des sous-onglets, hors de s1) : à signaler à la voie de la liste des brassins.
13. ÉCARTÉ. La réservation (`stockConsumption.pendingItems`) ne porte ni le moment (dry hop) ni la date : `{ stockItemRef, quantity, unit }`. Les dire demanderait un champ neuf ou une donnée inventée (interdits). La phrase courte « tous réservés au ZZ-019 » reste.

Doutes de ks1 : « 11 recettes » bleu à 1280 (non vérifié à l'échelle 2 ; le CSS ne donne qu'une couleur de texte grise à `.rcp-total`, antialiasing probable ; pas touché) ; icône cubes des Archives et hauteur du lien « Retour au carnet » : non traités, non comptés par ks1.
Essais : 1 sur 3 par critère. Piège rencontré : le Bash du poste a perdu des barres inverses dans deux scripts (regex `\s`, `\d`) ; corrigés par Write/Edit, `node --check` et un test qui exerce la regex.
CONNAISSANCE : aucune. LEÇON PROPOSÉE : aucune.
