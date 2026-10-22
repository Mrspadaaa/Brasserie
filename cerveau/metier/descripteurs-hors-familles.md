---
name: descripteurs-hors-familles
description: Pourquoi l'outil houblons fait paraître Nelson Sauvin ordinaire et Motueka ultra fruité : 83 % des mots de Nelson Sauvin tombent hors des 12 familles. Cause chiffrée, preuves, trois corrections.
type: metier
maj: 2026-10-22
sources: work/refonte-frontend/v4/SPEC-BRASSEUR.md (lot 21, 20.10) ; work/refonte-frontend/registre.md (retour du lot 21, point 5) ; prototypes/houblons-v4/data/pack-fiches.json ; prototypes/houblons-v4/data/correspondance-familles.json ; prototypes/houblons-v4/src/engine/hops.ts ; prototypes/houblons-v4/src/engine/fiches.ts ; prototypes/houblons-v4/src/engine/profil-simule.ts ; functions/src/hopExtrapolationCore.ts ; src/data/hopExtrapolationBootstrap.json ; work/refonte-frontend/v4/ecran-1/fils18-baseline/captures/l8g-fiche-390.png ; mesures et scripts : work/missions/2026-10-22-essai-voies/voies/b-nelson-sauvin/ANNEXE.md
---
Retour du brasseur sur l5f : « nelson sauvin est un houbon ordinaire alors que c'est un un houbon incroyable » ; « motueka est ultra fruité ». Leçon L14. Carte des outils : [[outils-houblons]]. À garder : [[acquis-valides]].

**Constat**
- Nelson Sauvin : 12 mots, 2 rattachés à une famille, 10 sans famille (83 %). La fiche montre Agrumes 1/2, Épicé 1/2 et « 10 non décrites » (capture l8g-fiche-390.png). C'est le rang 1 sur 180 houblons de 6 mots ou plus ; le catalogue moyen est à 22 %.
- Ses 9 vrais descripteurs (5 idées : vin blanc, fruité, groseille à maquereau, raisin, sauvignon blanc ; 4 citées par les 2 fiches) ne sont rattachés à rien. Les 2 mots rattachés sont des noms de catégories de Hopsteiner (« Familles déclarées : Fruité, Agrumes, Épicé »).
- Motueka : 12 mots, 9 rattachés (75 %), Agrumes 2/2 (7 mots), Tropicaux 1/2, Floral 1/2. Sa barre d'agrumes est deux fois plus haute que toute barre de Nelson Sauvin.

**Cause** (le mot→famille n'est pas dans correspondance-familles.json, qui porte composé→famille, poids de forme 1 / 0,5 / 0 et λ = 0,5)
1. Lexique fermé : hops.ts:10 lit les 12 listes `axes[].terms` de hopExtrapolationBootstrap.json. `hopDescriptorEvidence` (hopExtrapolationCore.ts:49-59) cherche le mot entier, sans synonyme ni pluriel, dans le texte anglais d'origine (hops.ts:77). gooseberry (la liste dit groseille), grape, wine, sauvignon blanc, fruity : dans aucune liste.
2. Les orphelins sortent du dessin : hops.ts:81 les range dans sansFamille, fiches.ts:54 les passe à la fiche, qui les écrit en petit, 3 mots puis « +6 » (fils18-baseline/l8g/noyau.mjs:324 et 382). Ni barre, ni radar, ni niveau (hops.ts:38), ni profil simulé ne les lisent.
3. Il reste la ligne catégorie de Hopsteiner (build-data.mjs:46) : Agrumes et Épicé, que la ligne fine de la même fiche (« White wine, fruity, grape, gooseberry ») ne cite pas. Son « Fruité », cité en tête, n'a pas de famille.
4. Le profil simulé répartit la force sur les familles reconnues (profil-simule.ts:283) : les mots perdus ne baissent pas la force, ils la reversent à 50/50 sur Agrumes et Épicé. Dry hop après fermentation, 4 g/L : Nelson Sauvin Agrumes +14,3, Épicé +14,2 ; Citra Tropicaux +38,8, Agrumes +35,2. Les thiols de Nelson Sauvin n'ont aucune valeur au dépôt, seulement la classe Hopsteiner « forte », que seul yeast.ts:84 lit.
5. Motueka gonflé : son vocabulaire est celui des listes (citron vert, citron, zeste, tropical, floral). Agrumes est cité par les 2 fiches, donc « marqué », barre à 20 px. Le niveau vient du nombre de fiches qui citent la famille (ou de sa place en tête), pas d'une intensité : l'outil récompense le vocabulaire connu, pas la puissance. Motueka reste fidèle à ses sources ; Nelson Sauvin est sous-décrit.

**Preuves** (tableaux, scripts et sorties : ANNEXE.md ; moteur réel, rien n'est écrit dans le dépôt)
- Captures relues : l8g-fiche-390.png (Nelson Sauvin) et l5f-fiche-390.png (Motueka) montrent exactement les sorties du moteur mesurées ici.
- Mots / rattachés / sans famille : Nelson Sauvin 12 / 2 / 10 ; Motueka 12 / 9 / 3 (25 %) ; Citra 9 / 8 / 1 (11 %) ; Saaz (CZ) 8 / 6 / 2 ; Galaxy 7 / 5 / 2.
- Familles montrées : Citra 5, Saaz 6, Galaxy 3, Motueka 3, Nelson Sauvin 2. Moteur V5.5 : toutes les plages font 0–100, centre 51 (citée) contre 40 (non décrite) : seul le vocabulaire départage.
- Catalogue : 2105 mots, 472 sans famille ; « fruité » générique dans 77 variétés, noble 27, dank 18, gooseberry 12, white wine 7 (Hallertau Blanc, 2e à 67 %).
- Réputation : vin blanc et groseille confirmés par 2 fiches chacun ; le fruit de la passion n'est dans aucune fiche de Nelson Sauvin du dépôt (autres sources non lues : « tropical » seulement).

**Options** (recommandé : A puis B ; C seulement avec B)
- A. Rattacher gooseberry et « groseille à maquereau » aux Petits fruits, par une table complémentaire du prototype (jamais le moteur de l'app).
  - Effet : Nelson Sauvin gagne Petits fruits 2/2, sa barre la plus haute (20 px), et la part d'Épicé passe de 50 à 25 %. Motueka, Saaz, Galaxy inchangés ; Citra gagne Petits fruits 1/1 ; 7 variétés changent de niveau (Hallertau Blanc 1→2, Marco Polo 0→2…).
  - Pour : c'est un Ribes, comme le cassis et la groseille déjà rangés là. Risque : sa note vive et verte n'est pas celle de la framboise ; ne règle ni vin blanc, ni raisin, ni sauvignon blanc. Effort : environ 1 h.
  - Au brasseur : gooseberry = Petits fruits ?
- B. Montrer la part « autres », plafonnée : barre neutre, ni hachurée (le hachuré veut déjà dire « inconnu ») ni aux couleurs d'arôme (acquis : le code couleur), radar inchangé à 12 axes, et concepts dédoublonnés (français et anglais) à la place de la ligne « sans famille », hors mots génériques (fruité, noble, mild, sweet).
  - Effet : Nelson Sauvin 4 concepts (3 avec A) ; Motueka 1 (mojito) ; Citra 1 (0 avec A) ; Saaz 0 ; Galaxy 2 (cannabis, dank). Texte remplacé sur la fiche ; sur la carte, une marque en plus au-delà d'un seuil.
  - Risque : sans liste de mots génériques, « fruité » (77 houblons) l'allume partout. Effort : ½ à 1 jour.
  - Au brasseur : la liste des mots génériques, le seuil, le plafond.
- C. Partager la force avec « autres » (profil-simule.ts:283) : poids 0,5 par concept, plafonné à 1.
  - Effet : parts de Nelson Sauvin Agrumes 25, Épicé 25, autres 50 % (avec A : Petits fruits 33, Agrumes 17, Épicé 17, autres 33) ; Motueka Agrumes 40, Tropicaux 20, Floral 20, autres 20. Corrige « Épicé = Agrumes ».
  - Risque : baisse les points des 12 familles (non mesurés ici) : sans B, Nelson Sauvin paraît plus faible. Effort : 2 à 3 h, plus régénérer profils-simules.json et les pages du lot 21.
  - Au conseil : convention du moteur.
- Écartée en premier : lire les 2 fiches communautaires déjà au dépôt (kasperg3/HopDatabase, hops-json). Nelson Sauvin passerait à 6 familles sur 4 fiches, mais Motueka à Agrumes 4/4 et Tropicaux 3/4 (plus fruité encore) ; les n/N changent pour tous les houblons concernés, sources sans année.
