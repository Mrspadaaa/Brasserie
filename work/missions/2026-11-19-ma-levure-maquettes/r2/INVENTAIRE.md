# Ma levure, r2 : inventaire pour les greffes (19.11)

Sources retenues : `v01.html` (sa parole : « v01 c'est bien mais le rest.... C'était surtout pas du tout ce que j'ai demandé,
on voit même pas en une vue, le nombre que j'ai choisi ECT... »). Base : la carte en ligne (`base/en-ligne-1911.png`) et le bas
de l'étape en ligne (`base/volets-en-ligne-1911.jpg`, « Toute cette partie là » : refusé en tant que forme, R1, mais tout son
contenu garde une place). Composant réel du bas : `src/ui/etapeLevure/EtapeLevure.tsx` (en-tête « RIEN NE SE PERD »).

Captures prises et ouvertes, 390 × 844, thème clair : `r2/cap/v01-repos-390.png`, `r2/cap/v01-entier-390.png`,
`r2/cap/v01-planche-390.png`.

## Constat à 390

- v01 au repos : la carte occupe y 90 → 548, « Changer de levure » 562 → 672, le pied commence à 724. Il reste **52 px** :
  la conduite, la dose choisie et les objectifs n'ont pas de place. C'est la cause de « on voit même pas en une vue ».
- Le seul nombre de dose visible est « ≥ 15 g » : un minimum conseillé, pas **le nombre qu'il a choisi** (la quantité prévue vit
  dans le volet « Dose, ensemencement et starter »). G6 demande le nombre choisi, en grand, sans rien ouvrir.
- La conduite en ligne n'est lisible que repliée : « 2 paliers · fin J15 », sans températures ni jours. Sa capture du 19.11 :
  19 °C puis 4 °C. La case « fiche · conduite » de v01 ne montre qu'un seul point (19 °C), pas les paliers.
- Huit volets à chevron, tous de même poids : l'usage fréquent (dose, conduite, objectifs) et le rare (offres, repères, atelier)
  ont la même forme. C'est R1.

## Meilleure réalisation par écran du parcours

| Écran | Meilleure source | Pourquoi |
|---|---|---|
| En-tête Levure 4/7, étapes | v01 (= base) | identique à l'app, épuré, 14 px tenus |
| Carte du haut : nom, marque, ×, pastille | v01 | retenu tel quel (« v01 c'est bien ») |
| Dose dans la carte | v01, emplacement ; valeur à corriger | la place en haut à droite est la bonne, mais « ≥ 15 g » n'est pas le nombre choisi |
| FG et degré | v01 | jauge hachurée et échelle 1,000–1,030, lisible en 1 s |
| Plage fiche et conduite, Caler | v01 | dégradé froid → chaud, cadre de la fiche, trait rouge hors plage, « Caler à 11 °C » en bouton (G3) |
| Floculation | v01 | trois barrettes, rien à lire |
| Effets (esters… sucres restants) | v01 | crans colorés et source par ligne ; 5 × 40 px, c'est ce qui coûte la place |
| Geste IA au repos | v01 | un seul bouton « Compléter la fiche », compteur « IA · 2 vides, 3 simulés » (G5) ; remplace les cinq ⌕ de la base |
| Geste IA pendant | v01 | barre « Lecture fiche · 2/5 », Arrêter, lignes en attente marquées « IA estimé » |
| Geste IA après | v01 | « 4 à confirmer · 1 écarté », « Tout retenir (4) », × ou ↺ par ligne, étiquettes fiche / IA estimé |
| Changer de levure | v01 (= base) | champ en pointillé, puces Pomona, Verdant IPA (stock), Hors catalogue (G4) |
| Annuler le changement | base en ligne | barre « ↶ Annuler le changement » sous les étapes, seule source |
| Conduite repliée | base, volet Conduite | mini profil en marches (▬▬ ▁), « 2 paliers · fin J15 », « Brouillon », « 1 point à vérifier » en or |
| Régler la conduite | base, app (Conduite.tsx, maquette l5b, acquise) | graphe °C × jours, poignées ↕ ↔, plage de la levure en bande derrière les paliers, + sur chaque frontière, × sur le palier touché |
| Régler la dose | base, volet Dose (YeastPitchingPanel) | seule source : Quantité prévue, Moût à ensemencer (volume, densité), Inoculum M/mL/°P, Préparation avant J0 (starter, facultatif), Conseil et ses conditions |
| Objectifs | base, volet Objectifs (YeastBeerTargetPanel) | seule source : Ma cible, Finale recherchée, Accent recherché, Effervescence, Atténuation sur ce moût |
| Mon stock ou saisie libre | v01 (puces) + base (volet) | les puces couvrent le fréquent ; la saisie libre passe par « Hors catalogue » |
| Produit exact et offres | base, volet | seule source : offre retenue, prix, livraison CH, lot associé, « Corriger la fiche produit » |
| Fiche : compléter, corriger, IA | v01 | absorbé par le geste « Compléter la fiche » ; « Corriger » reste un lien |
| Repères et sources | base, volet | seule source : ce que dit la fiche du catalogue, liens |
| Atelier complet | base, volet | seule source : essai de conduite, profil, comparaison des offres, fiche partagée |
| Pied, + volant, onglets | v01 | Retour / Suivant — Paliers, + à droite juste au-dessus des onglets, six onglets |

## Meilleures idées isolées

- Un seul geste IA pour toute la fiche, avec son compteur de vides et de simulés — v01.
- Trois temps du geste IA en mini écrans côte à côte (repos, pendant, après) — v01.
- « Tout retenir (N) » et un × / ↺ par ligne au lieu de Retenir / Écarter partout — v01.
- Étiquette de source sur chaque valeur : « fiche » (trait plein) ou « IA estimé » (pointillé or) — v01.
- Crans à trois segments colorés par effet — v01.
- Plage de la fiche en cadre noir sur un dégradé froid → chaud, conduite en trait rouge si hors plage — v01.
- Bouton « Caler à 11 °C » sous la plage — v01 (base : « → 11 °C »).
- FG en jauge hachurée avec ses bornes chiffrées — v01.
- Signe « ≥ » souligné : le minimum conseillé, distinct du nombre choisi — base en ligne.
- Mini profil en marches à côté du résumé « 2 paliers · fin J15 » — base, volet Conduite.
- Pastilles « Brouillon » (gris) et « 1 point à vérifier » (contour or) — base, volet Conduite.
- Graphe °C × jours éditable : poignées, + entre deux paliers, × sur un palier — base, app (l5b).
- Bande de la plage levure derrière les paliers du graphe — base, app (l4b).
- Barre « ↶ Annuler le changement » — base en ligne.
- Inoculum en M/mL/°P et « Estimer depuis la recette » — base, volet Dose.
- Starter « facultatif » sous « Préparation avant J0 » — base, volet Dose.
- « Atténuation sur ce moût » et « Finale recherchée » comme cible — base, volet Objectifs.
- Lien « Corriger la fiche produit » — base, volet Produit exact et offres.

## Données d'exemple communes (toutes marquées « exemple »)

Munich Lager Yeast, White Labs, vendue par Lallemand ; moût 20 L à 1,026 (sa capture : OG 1,026) ; dose choisie 23 g
(2 sachets de 11,5 g), minimum conseillé ≥ 15 g ; inoculum 1,5 M/mL/°P ; conduite 19 °C · 7 j puis 4 °C · 8 j, fin J15,
plage de la fiche 9–11 °C ; FG 1,018–1,021, ≈ 6,0–6,4 % vol (valeurs de la base, inchangées) ; objectifs : finale sèche,
accent lager propre ; offre : Pomona, 1 offre relevée.
