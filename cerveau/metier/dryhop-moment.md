---
name: dryhop-moment
description: Ce que la grille simulée dit du moment d'ajout d'Idaho 7 dans la stout 16D (lot 23, Dryhopper) : le dry hop actif est le meilleur compromis ; limites de la grille et des mesures.
type: metier
maj: 2026-10-23
sources: work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/profils-simules.json ; work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/comparatifs-dryhop.json ; work/missions/2026-10-22-reprise-lot21/voies/r7a-dryhopper/RESULTAT.md (et r7b, r7c, r7e, r7g, r6n2-reprise-toucher)
---

Idaho 7 à 4 g/L, US-05, dans la stout 16D, d'après la grille simulée du moteur (22.10, voies r7). Ce sont
des simulations, marquées « ~ » à l'écran ; à confronter au brasseur ou à une mesure.

**Amertume** : ébullition 60′ ≈ 161 IBU, 10′ ≈ 97, whirlpool ≈ 75. Tout ajout à chaud sort de la bande
50–70 IBU de la 16D ; seul le dry hop garde l'amertume de la recette.

**Arôme** :
- dry hop pendant la fermentation active : floral ~+22, résineux ~+14 ;
- après fermentation : floral ~+23, résineux ~+20, végétal ~+10.
L'actif répond à sa demande (« trop résineuse, je la veux plus florale ») : presque autant de floral,
six points de résineux en moins.

**Jours de contact** : le simulé sature dès 2 j (floral 22,14 à 2 j, 22,15 à 3 j) ; de 1 à 7 j, le centre
ne bouge presque pas. Un aperçu « jour après jour » construit sur la grille est plat.

**Levure** : Pomona ne change que le dry hop actif (agrumes 13,9 → 26,9) ; après fermentation, Pomona et
US-05 donnent le même centre à moins d'un vingtième de cran. Un aperçu « levure » au point « après
fermentation » est vide : le montrer au dry hop actif.

**Limites** :
- la grille n'a que 60′ et 10′ en ébullition : 55′ à 15′ sont interpolés ;
- `comparatifs-dryhop.json` n'a qu'une mesure d'Idaho 7 (E03 : au pitch, S-04, 14 j, dose non publiée) ;
  aucun chiffre ne compare whirlpool et dry hop (E09 n'existe qu'en figure) ;
- les crans « au style » changent de taille selon la bande de chaque famille : ne pas comparer deux
  familles en crans (balance, solde) sans une unité commune.

Voir [[cout-calcul-moteur]] et [[modele-brassage]].
