# Mesures des 7 parcours, app locale 390 × 844 tactile (15.11, Haiku)

Périmètre : `http://localhost:3017/?dev-local`, serveur Vite de dev (non prod), données en mémoire (seed), rien en ligne, pas de Gemini. Serveur arrêté après l'essai. Captures : `C:/Users/mrspa/AppData/Local/Temp/mesures-simplicite/` (ouvertes et lues une à une). Traces : `parcours-brut.txt`, `parcours-brut2.txt`, `parcours-brut3.txt` (même dossier).

Mesure de l'erreur : la saisie a été faite par un remplissage automatique de « Test mesure » ou « 1.040 » dans les champs vides, ce qui pollue certains champs (voir P1). Les touchers comptent les clics réels.

## Tableau

| Parcours | Touchers | Champs saisis | Champs exigés | Écrans traversés | Confirmations | Bloquant |
|---|---|---|---|---|---|---|
| P1 Nouvelle dépense (banc) | 3 | 1 (artefact : champ de recherche de lignes) | Aucun grisé avant saisie (« Confirmer » actif) | Actions rapides → Nouvelle dépense (relecture de facture 23 lignes) | Non atteinte : « Confirmer » mène à « Terminé », non joué | Non, mais l'écran de relecture n'est pas une saisie courte : 23 lignes, TVA à 2 taux à vérifier |
| P2 Besoin de matériel | 2 (Stocks, Matériel en échec) | 0 | n.d. | Non atteint | n.d. | Oui : « Matériel » (Stocks) et « Atelier R&D » (Brassins) introuvables, 3 essais |
| P3 Brassin depuis recette | 3 | 0 (volume pré-rempli 30 L) | « Créer » reste actif mais refuse | Actions rapides → Préparer un brassin | Refusé | Oui : « Le matériel de cette recette n'est pas figé » ; il faut quitter pour « Modifier la recette » |
| P4 Densité, Milk Stout | 3 | 3 (remplissage automatique) | « Ajouter le relevé » grisé avant saisie (3 champs) | Brassins → fiche brassin → relevé | « Relevé ajouté au suivi », courbe à 5 mesures | Non |
| P5 Fût F-001 (laver) | 3 | 0 | n.d. | Stocks → Fûts → fiche F-001 | Non joué : « Marquer propre » non cliqué | Remplir et livrer non atteints (« Gestion du fût » replié) ; Fûts cliqué en échec une fois sur trois |
| P6 Corriger le stock (soude) | 3 | 0 | n.d. | Stocks → Articles | n.d. | Oui : fiche soude non ouverte en 3 essais, clic sans effet visible |
| P7 Note sur un brassin | 1 | 0 | n.d. | Brassins | n.d. | Oui : « Milk Stout » introuvable en 2 essais sur 3 après « Brassins » ; cause non tranchée |

Chargement : 2,9 à 5,8 s pour l'accueil au premier chargement, mesuré sur `networkidle0` ; ce n'est pas une mesure de production.

## Freins par parcours (capture de référence)

- **P1** : l'écran de relecture (23 lignes, « TVA recalculée 2 taux 1,11 », « Lectures 2/2 · 1 désaccord ») demande de lire avant de confirmer. Capture `P1-depense-apres.png` ; l'état vu avant saisie est `p1-01-depense-banc.png`.
- **P2** : aucun écran de besoin atteint. Captures `p2-01-materiel.png` et `p2-03-atelier-rd.png`, non ouvertes après l'échec, à reprendre.
- **P3** : le bouton « Créer le brassin à brasser » (Milk Stout, 30 L) affiche le message « Le matériel de cette recette n'est pas figé… » et « Adapter à 27 L ». Capture `P3-brassin-apres.png`, ouverte : le brassin ne se crée pas en un toucher.
- **P4** : pas de frein ; la courbe passe à FG 1,040 et « Relevé ajouté au suivi ». Capture `P4-densite-apres.png`. Réserve : les trois champs requis ont été remplis automatiquement, la saisie réelle n'est pas mesurée.
- **P5** : la fiche F-001 montre « Revenu vide, à nettoyer avant remplissage » avec « Marquer propre » (1 toucher). Capture `p5-02-futF001.png`, ouverte. Remplir et livrer sont dans « Gestion du fût », non déployé.
- **P6** : la liste Articles montre « Malt » en premier ; la soude est plus bas, le clic n'a pas ouvert sa fiche. Capture `p6-04-soude.png`, ouverte : liste seulement.
- **P7** : « Milk Stout » n'apparaît pas après « Brassins » dans deux essais sur trois (ouvert une fois en P4). Capture `p7-01-brassins.png`, non ouverte.

## Ce qui reste douteux

- Sélecteurs par texte : « Stocks › Matériel » et « Brassins › Atelier R&D » sont introuvables de façon intermittente ; l'échec n'est pas démontré comme un défaut de l'app.
- Une seule accueil avec des fixtures locales : les chiffres ne disent rien de la prod ni de données réelles.
- Le toast « Base initialisée avec 177 enregistrements » couvre le haut de l'accueil au premier chargement (capture `00-accueil.png`).

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
