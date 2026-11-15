# e9a — L'atelier remis d'aplomb

- Chaleur : **froide** (l'écran actuel, mêmes sections et mêmes gestes, remis d'aplomb).
- Idée : **Atelier remis d'aplomb** — chaque idée porte son avancement en piste à toucher.

## Ce qui change face à l'écran actuel (`CreativeLabTab.tsx` l. 209-396)
- Phrase-réponse en tête : « Bière d'hiver : prête à devenir recette » (l'idée validée), « 1 idée validée sur 4 ».
- Le statut caché (idée → recherche → devis → validé, touché en boucle aveugle par `handleToggleStatus`) devient une **piste de 4 cases
  à toucher** (`data-booster="avancement"`), case courante cerclée.
- « Passer dans mes recettes » : un seul bouton noir, sur l'idée validée seulement (le dégradé jaune sur chaque carte disparaît).
- Le bouton pointillé « + Noter une idée de bière / style décalé » devient un bouton plein en bas de liste.
- Matériel sort de la barre de sections : pastille « Matériel ↗ » vers Rénovation (autre session).
- « Réfléchir à mes projets » (Gemini) : bouton rond noir en tête (✦), plus de grande rangée en bas.
- Tarifs : `CreativePricing` gardé (prix TTC, coût du format, marge), mais **deux curseurs** au lieu de deux champs, format en
  segment (33 cl, carton 24, fût 20 L), marge en gros et barre coût / marge ; « Garder ce tarif » ; les tarifs gardés en lignes.

## Fonctions gardées ou déplacées
- Gardées : sections Bières, Tarifs, Contacts, À faire ; noter ; modifier (crayon → fiche `CreativeItemSheet`, qui porte la
  suppression) ; avancer le statut ; passer en recette ; essai de prix ; garder un tarif ; Gemini.
- Déplacées : Matériel (lien vers Rénovation) ; Gemini (en tête).
- Non dessinées ici (inchangées) : Contacts (Appeler, Convertir en client), À faire (cocher), feuille « nouvelle note ».

## Causes c3 évitées
- Squelette propre (segment + cartes), différent de e9b à e9d. Phrase-réponse en gros. Couleur pleine (ocre en cours, vert validé, noir).
- Boosters : piste d'avancement, curseurs de prix, barre empilée. Aucune phrase grise d'aide au repos.

## Écarts assumés
- Les cases de la piste mesurent 44 px de haut (exigence de la voie) : plus lourd que la densité compacte de DESIGN.md.

## Données fictives
- Les 5 idées (Bière d'hiver épicée, NEIPA au Nelson Sauvin, Saison à l'épeautre, Pils fumée, Lager au miel de la Gruyère), les styles
  en pastille, les prix (5,50 ; 150,00 ; 120,00 ; 6,00) et le coût de revient 2,10 sont **fictifs**. Seuls LOT-019 et LOT-012
  viennent du brief. TVA : non assujetti supposé (« sans TVA · tes réglages »). Aucun α, IBU ni arôme.

## Captures
- `e9a-repos-390-clair.png`, `e9a-geste-390-clair.png` (Lager au miel notée, toast « Annuler »), `e9a-tarifs-390-clair.png`.

## Rhabillage à l’identité de l’app (re9, 15.11)
- Trousse chargée (`identite.css`, `chrome.js`) : en-tête, sous-onglets (Atelier actif), barre du bas et + de l’app ; jetons des deux thèmes, Source Sans 3 / IBM Plex Mono, échelle ≤ 28 px, graisse ≤ 700, rayons 10 / 16 / 24.
- Idée, composition, textes et chiffres inchangés. Couleurs de données : sémantique (hop, attention, alert, water), rubriques `--area-*`, bière EBC (pastilles et bouteille, indicatives selon le style), pastilles de style `id-style`.
