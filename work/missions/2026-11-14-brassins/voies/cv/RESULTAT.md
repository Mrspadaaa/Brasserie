OK — Tableau de couverture de l'onglet Brassins : 52 vues, 4 traitées, 10 partielles, 38 sans maquette

## Fichiers écrits
- `work/missions/2026-11-14-brassins/voies/cv/COUVERTURE.md` : légende, tableau de 52 vues (4 sous-onglets), 11 groupes « Sans maquette, groupées ».
- `work/missions/2026-11-14-brassins/voies/cv/tests.txt` : sortie des deux CHECK.
- `work/missions/2026-11-14-brassins/voies/cv/RESULTAT.md`.
Rien dans `src/`, ni commit, ni stash.

## Critères
- G1 : `COUVERTURE OK` (en-tête `OK — 52 vues, 4 traitées, 10 partielles, 38 sans maquette`, les quatre sous-onglets, `## Sans maquette, groupées`). Premier essai.
- G2 : `HORS OK` (`git status --short` ne montre que `work/missions/2026-11-14-brassins/`). Premier essai.

## Constat pour le brasseur (« tous les écrans sous ces Tabs ne sont pas traités ? »)
Il a raison. Les seules vues avec mini maquettes : la fiche d'un brassin en fermentation (P1 et P2, choix ouvert), la carte de la liste (rails de cuves), le dry hop, et le geste de la carte « Brasser » (jour de brassage, z1 choisie, autre session). Dix vues sont partielles (nouveau brassin, replanification, relevé, stock, densités, fiche en garde, fiche de recette, assistant, Matériel et sa feuille). 38 n'ont aucune maquette : tous les états de la fiche hors fermentation, Carnet, Dossier, conditionnement, clôture, retour arrière, recherche, filtres, tri, Archives, bilan, période, Recettes entier (liste, comparer, historique), Atelier R&D (Bières, Tarifs, Contacts, À faire, feuilles) et Volumes.
Aucune vue n'a de maquette « choisie » au registre `ecrans.json` (il ne porte que les outils houblons et `levure`), hormis le jour de brassage (z1, 10.11).

## Doutes et limites
- Lecture du code seule : les lignes `fichier:ligne` viennent d'un `grep -n` ou d'une lecture le 14.11 ; je n'ai pas relu chaque fichier en entier (`HopTastingsPanel`, `UpgradeSheet`, `BrewBudgetDialog`, `CreativePricing` cités par leur point d'entrée).
- « traitée » signifie qu'une page de mini maquettes dessine la vue, pas qu'il l'a choisie. J'ai ouvert deux images de P1 (`ref-liste`, `s1e2-liste`) ; les autres états sont lus dans les noms d'images et les légendes de `index.html`, non ouverts.
- Ligne « Fiche de recette » : la colonne maquette cite les écrans houblons du registre et `INVENTAIRE-ECRANS.md:59` (« en partie ») ; je n'ai pas vérifié lesquels sont montés dans cette page.
- Le groupe 11 recoupe les groupes 2 et 3 (il sert de rappel pour la variante choisie).
- Le menu « Saisie rapide » du bouton + : je n'ai pas trouvé de page dédiée ; la mission `2026-11-09-bouton-plus` n'a pas de MISSION.md à ce chemin.

DÉCISION À PRENDRE : par quel groupe commencer. Options : (a) groupes 1, 2 et 5 (la fiche hors fermentation, ses saisies, les outils de liste), qui touchent les brassins qu'il ouvre tous les jours ; (b) tout le sous-onglet Recettes ; (c) attendre son choix sur P2 puis décliner la variante choisie sur les autres états (évite de dessiner deux fois). Recommandation : (c) pour les groupes 1, 2, 4 ; en parallèle (a) pour le groupe 5 et (b), indépendants de la fiche. Atelier R&D, Volumes et coque : après, usage faible (INVENTAIRE : 2).

CONNAISSANCE : l'onglet Brassins compte 52 vues atteignables ; 4 seulement ont une mini maquette (14.11) ; le registre `ecrans.json` ne porte aucun écran de cet onglet.
LEÇON PROPOSÉE : aucune
