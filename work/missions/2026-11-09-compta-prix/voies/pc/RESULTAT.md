OK — Prix › « À compléter » : une ligne par donnée manquante, avec son effet et un renvoi vers l'endroit où la saisir

## Fichiers écrits
- `src/ui/prix/donneesPrix.ts` : `manquesPrix(...)` (calcul pur, ordre du calcul) + types `ManquePrix`, `FormatManque`.
- `src/ui/prix/PrixEcran.tsx` : bloc `section.prx-manque` (« Données à compléter ») : phrase d'effet, lignes-tâches `button.prx-tache` (titre, effet dessous, ›), explication des anciens tarifs puis leurs puces inchangées (`role=group` « Tarifs à compléter »). Renvois : fiche du brassin sur Mesures (`BatchDetailSheet` lazy), coût du brassin (`BrewBudgetDialog`), `TarifSheet` (format présélectionné, ou tarif existant pour l'emballage), `ProfileSheet` (lazy) pour le volume annuel. `prx-aide` supprimé (devenu ligne « Emballage du X »). Import de `finance.css` (sans lui la feuille Solde s'ouvrait sans style depuis Clients).
- `src/ui/prix/prix.css` : styles des lignes (pointillé du haut = inconnu, hairline entre lignes, › à droite, 12 px sous le titre).
- `tests/integration/prixACompleter.test.tsx` (neuf, 12 tests).
- `voies/pc/capturer.mjs`, `voies/pc/captures/` (36 PNG), `tests-rouge.txt`, `tests.txt`.

## Les lignes (seulement les manques réels, ordre du calcul)
1. Litres conditionnés de « X » (`litres` null ou « litres nets » dans `notions.manque`) → fiche Mesures. Brassin planifié : « les litres se notent après la mise en bouteille ».
2. Coût du brassin jamais chiffré (`notions` null) → coût du brassin. (Ajout hors liste : c'est le vrai trou de l'état `finance-demo=reel`.) Ou « Prix de N ingrédients : noms » (autres noms de `manque`) → coût du brassin.
3. Densité de « X » (°P inconnu, `impotUnite` null) → fiche Mesures.
4. Prix du 33 cl / 75 cl / fût (tuile « prix ? ») → `TarifSheet` « Fixer le prix » sur ce format. Un format que le brassin n'a pas le dit (« seulement si tu en vends »). Plusieurs tarifs, ou ancien tarif sans format : pas de ligne (la puce ou « 2 prix » le dit déjà).
5. Emballage du X (tarif avec prix, sans emballage) → ouvre ce tarif.
6. Volume annuel → `ProfileSheet`, la ligne dit où : « Paramètres des prévisions et des brassins ».
7. Anciens tarifs sans format : une explication d'une ligne, puces gardées (test existant `Amber Ale 50 cl · ?`, `title`, `Tarifs à compléter` verts).

## Critères
- Rouge sur HEAD : `tests-rouge.txt` → 11 échecs sur 12 (le 12e, « tout connu : aucun bloc », passe sur HEAD, normal).
- Vert : `tests.txt` → 7 fichiers, 57 tests (prixACompleter, prixEcran, f2ReelPrix, prixCorrectionsFz, compactClients, f2ReelArgent, f2ReelCout).
- `npx tsc --noEmit` hors modules exclus : aucune erreur. `npx vite build --outDir $TEMP/pc-build` : OK (16 s).
- Captures (390 et 1280, clair et cave, `?dev-local&finance-demo=reel`) : repos haut/bas + toucher de chaque ligne (litres, coût, prix 33 cl, prix fût, emballage 75 cl, volume annuel, ancien tarif). Ouvertes : 390 clair/cave repos, 1280 clair repos, fiche des litres, tarif fût, tarif 75 cl, coût, volume annuel (390 clair, après import de finance.css), tarif 33 cl (1280 cave). Serveur 3001 arrêté.
- Essais : tests 3 passes (une fixture corrigée : les litres venaient du `netVolumeL` du snapshot) ; captures 2 passes de plus (clic « Prix » trop tôt, rechargement HMR en pleine capture).

## Combien et quels problèmes ? (liste, 5)
1. 1280 : la colonne de droite est étroite (~240 px) ; les lignes passent sur 3 à 5 lignes (titre + effet). Lisible, mais le bloc est long sous le graphe vide. Pré-existant : la grille c7c ; non touchée (règle n° 1).
2. Volume annuel : le champ est dans un volet fermé (« Paramètres des prévisions et des brassins ») de la feuille Solde ; il faut un toucher de plus. `FinanceForms.tsx` n'est pas à moi (et une autre voie y écrit) : à rendre ouvert par défaut ou à y poser `initialOpen`.
3. Litres d'un brassin planifié : la fiche s'ouvre mais « Saisir le volume conditionné » n'existe qu'après le brassage ; la ligne l'explique, sans action possible.
4. Fiche des litres sur un brassin conditionné : le bouton « Saisir le volume conditionné » est plus bas dans Mesures (pas de focus direct, la fiche n'a pas de prop pour ça).
5. 6 lignes dans l'état démo : plus lourd que « premier plan léger » ; tout est un vrai manque, mais une version repliable (« 6 données à compléter ›») est possible si le brasseur la préfère.

## Doutes et limites
- Pas de renvoi depuis la tête (« coût du litre à compléter ») : facultatif, non fait.
- « Compagnon hors connexion » (toast du dev-local) chevauche le bas des captures 390 : hors voie.
- Capture « ancien tarif » : le tarif s'ouvre (vu en test, capture prise, non rouverte une à une pour les quatre configs).

DÉCISION À PRENDRE : volume annuel, ouvrir le volet « Paramètres des prévisions » par défaut quand la feuille vient de Prix ? Options : (a) oui, via une prop de `ProfileSheet` (voie Finances) ; (b) non. Recommandation : (a).
CONNAISSANCE : `FinanceService.snapshot().profile` existe toujours (défaut) ; `ProfileSheet` et `BatchDetailSheet` s'ouvrent depuis Clients, mais `finance.css` doit être importé.
LEÇON PROPOSÉE : aucune
