# Écran houblons — les cas de figure (18.10.2026)

Le brasseur : « Maintenant que on a une version vers quoi on veut aller, faire plusieurs
écran pour les cas de figure ». Chaque cas est un jeu de données du pack (`scenarios.*`),
calculé par le moteur, jamais inventé dans une page.

| Cas | Situation | Ce que l'écran doit réussir | Données |
|---|---|---|---|
| K1 | **Stout export, Nugget à 60′, dégustée « trop résineuse »** | le cas de référence : ma bière face à la cible, suggestions, comparaison | S1 (existe) |
| K2 | **Recette sans houblon** (nouvelle stout) | l'étape vide n'est pas vide : IBU 0 face à 50–70, ajouts rapides en tête, « + N IBU » | S4 (à créer) |
| K3 | **Recette chargée** : amérisant à 60′, ajout à 10′, whirlpool, houblonnage à froid à J+3 | chaque ajout avec type, moment, dose, IBU ; total IBU ; profil prévu par le modèle | S5 (à créer) |
| K4 | **Lager tchèque premium (3B)**, sans dégustation | style étroit : un petit écart pèse ; « ≈ » quand les houblons ne se départagent pas | S2 (existe) |
| K5 | **IPA américaine (21A)** | style large : beaucoup de houblons du stock conviennent ; vue d'ensemble | S3 (existe) |
| K6 | **Aucune voie / voies faibles** | dire clairement que l'outil ne peut pas, et proposer les pistes hors houblon | S1 « moins résineux » (existe) |
| K7 | **Stock insuffisant ou épuisé : le cas normal** (« je fais une recette puis ensuite j'achète les ingrédients, souvent pas présent ») | le stock informe sans limiter ; « manque 12 g », « à acheter » ; **liste d'achats** de la recette | S1 voies, S5, EKG et Fuggle ; `achats` (à créer) |
| K10 | **Levure et biotransformation** : houblonnage à froid en fermentation active (Citra cryo J+3, S5), levure caractérisée (US-05) contre inconnue (LalBrew Diamond, S2) | la levure visible sur l'étape ; signaux de biotransformation et de hop creep sur l'ajout à froid ; levier levure dans les suggestions | S5, S2 ; signaux et leviers (à créer) |
| K9 | **Mes goûts** : un houblon que je n'aime pas (goûté dans une autre bière) | le noter en un geste là où il apparaît ; les suggestions et les ajouts proposés l'écartent ou le marquent | `gouts` (à créer, vide par défaut) |
| K8 | **Comparaison manuelle de 4 houblons**, dont un sans fiche pour une famille | 4 silhouettes lisibles, « non décrit » visible, jamais 0 | `profilFiches` (en cours) |

## Comment on s'en sert

- **Lot 3** (variantes de p3) : chaque variante montre K1 dans ses 7 vues, plus l'étape
  (`index`) de **K2** et **K3** (`cas-k2.html`, `cas-k3.html`), parce que ce sont les cas qui
  cassent le plus souvent une étape. Le jury juge la variante sur les trois.
- **Base choisie** : elle est déclinée sur les 8 cas avant la tranche verticale haute fidélité.
