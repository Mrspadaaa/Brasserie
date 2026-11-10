OK — 1 problème, 0 bloquant (les 7 du VERDICT-2 sont corrigés ; reste un mineur, existant, hors de la mission)

Version : b36170bb (« DP-1 : les 7 problèmes du VERDICT-2 »)
Banc : `voies/d2/banc`, 5 pièces (Sun Store 1, Sun Store 2, BAUHAUS tachée, BAUHAUS copie, `bauhaus-eur`), Vite :5199, Chrome réel. Captures : 72 planches du script d3 (`voies/d3/captures/`, états 1-lectures, 2-ligne-en-trop, 3-recherche, 4-qte, 5-rabais-ouvert, par pièce × 390/1280 × clair/cave), 28 captures de gestes à moi (`critique/captures-3/`, `critique/gestes-3.mjs`, page fraîche pour chaque pastille), 6 captures « Voir le désaccord » (`critique/desaccord-3.mjs`), recherches rejouées (`critique/recherches.mjs`). Toutes les consoles sans `ERREUR PAGE`. Ouvertes en image : les 20 planches des 3 bloquants (tache 1-lectures ×4, eur 2-ligne-en-trop ×4, eur 3-recherche ×4, sun2 4-qte ×4, sun2 5-rabais ×4), copie 1-lectures ×4, eur et sun1 1-lectures 390 clair, tache et copie 3-recherche 390 clair, G3-eur somme, B4 photo cave, L1/L2 ; les autres planches (états déjà vus aux passes 1 et 2, mêmes écrans défilés) vérifiées par la console du script (valeurs identiques aux quatre combinaisons).

## Les 7 points du VERDICT-2, rejoués
| n° | point | verdict | preuve |
|---|---|---|---|
| 1 | « Lectures 3/3 d'accord » contre la barre « désaccord » | **corrigé** | tache « ! Lectures 3/3 · 45 désaccords · Voir le désaccord › », copie « 25 désaccords », Sun Store 2 « 3 désaccords » ; drapeau « À vérifier · … · Lectures » ; `bauhaus-eur` et Sun Store 1 « 3/3 d'accord » sans barre (aucun désaccord au banc : vrai). 390 et 1280, clair et cave. « Voir le désaccord › » ouvre la ligne en désaccord (T01, Vaccin grippe, C01) et défile vers elle ; « Voir » de la barre ouvre la même ligne. |
| 2 | « Voir la ligne en trop › » muet | **corrigé** | `bauhaus-eur`, page fraîche, pastilles Articles et Somme : la ligne « Montant en EUR 370,92 » s'ouvre avec « supprimer », défilée en vue, aux quatre combinaisons (script d3 : `line-30` ; mon script : ligne ouverte sur articles ET somme). |
| 3 | sous-total « 0,00 » en recherche | **corrigé** | `bauhaus-eur` « peinture » : « Rénovation 29/30 · 29 pièces · 277,60 », « Peinture et sols 29/29 · 29 pièces · 277,60 » ; tache « 23/23 · 234,40 », copie « 22/22 · 196,65 ». |
| 4 | « Qté × prix 2/5 » | corrigé | Sun Store 2 « · Qté × prix 2/2 · 1 sans prix unitaire » (gris, pas vert) ; « 2/2 justes », « 23/23 justes », « 22/22 justes », « 30/30 justes » ailleurs. |
| 5 | fiche du rabais | corrigé | « Rabais −0,68 » ouvert : « imprimé « NoVatTax - 0% » », le seul champ « −0,68 », « extrait · supprimer ». Plus de quantité, unité, +1 +2, nature. |
| 6 | champ 370,92 à la ligne | corrigé | « 1 pièce L × 370,92 = 370,92 » sur une ligne à 390. |
| 7 | barre tronquée | corrigé | « nom : lectures divergentes (ligne 1) · désaccord · Garder · Voir » entier à 390 (deux lignes) et à 1280. |

## Table
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| bauhaus-tache 1-lectures ×4, 3-recherche, B4 photo, L1/L2 | clair, cave | 390, 1280 | bloc avec « Lectures 3/3 · 45 désaccords », drapeau ; « Voir le désaccord » → T01 ouverte ; recherche « peinture » 23/23 ; « Photo » → « Voir l'original · Changer » | 1 | — |
| bauhaus-eur 2-ligne-en-trop ×4, 3-recherche ×4, 1-lectures, G3 somme | clair, cave | 390, 1280 | ligne EUR ouverte depuis Articles et Somme ; « peinture » → sous-groupe 29/29 · 277,60 | — | — |
| sunstore2 4-qte ×4, 5-rabais-ouvert ×4, L1 | clair, cave | 390, 1280 | « 2/2 · 1 sans prix unitaire » ; fiche du rabais réduite au montant ; « 3 désaccords » ; « Voir le désaccord » → Vaccin grippe ouverte | 1 | — |
| bauhaus-copie 1-lectures ×4, 3-recherche, L2 | clair, cave | 390, 1280 | « 25 désaccords » ; Prix connus et Somme → C01 ; « peinture » 22/22 | 1 | — |
| sunstore1 1-lectures | clair | 390 | tout vert, « 2/2 justes », « 3/3 d'accord », pas de barre | — | — |
| recherches (tache « 14,90 » absent, « 8,85 » 2/23, « 14.90 » absent, « T1 » 10/23, « 86 » 1/23 ; copie « 66,95 » 1/22 ; sun2 « rabais » 2/5 ; Échap vide) | clair | 390 | — | — | — |

## Combien et quels problèmes ? 1, 0 bloquant

Mineur
1. « Voir le désaccord › » (et « Voir » de la barre) ouvre la ligne en désaccord, mais la fiche ouverte ne dit pas en quoi les lectures divergent : on voit « imprimé « Peinture fictive T01 » · 7612301000004 » et les champs, pas l'autre nom lu. Le brasseur arrive sur la bonne ligne et doit deviner le désaccord. Existant (D329, hors de cette mission) : à noter pour la file des désaccords, pas pour ce déploiement.

## Ce qui tient (vu, passe 3)
- Bloc : deux valeurs, écart signé, un geste par rangée en écart ; chaque geste ouvre quelque chose sur page fraîche (recherche + bande ; ligne au prix douteux ; ligne hors articles ; ligne en trop ; ligne en désaccord). Drapeau levé sur les deux Bauhaus et `bauhaus-eur` (CHF) et sur Sun Store 2 (lectures seulement) ; Sun Store 1 sans drapeau.
- Payé : 14,60 (reçu), 352,05 (terminal = total), « montant non lu » sur Sun Store 2 avec la note du terminal : juste sur les quatre.
- Rabais : sous-ligne, 4 pièces, hors « Qté × prix », fiche réduite au montant.
- Recherche : nom, montant partiel, phrase d'absence, sous-groupes justes, Échap.
- Lisible en clair et en cave, rien de coupé ni chevauché à 390 ni à 1280.

## Doutes (non comptés)
- Sun Store 2 lève « À vérifier · Lectures » pour trois noms divergents alors que tous ses CHF concordent : fidèle aux lectures réelles (b1 : 3 désaccords), mais c'est un drapeau de lecture, pas de totaux ; le titre le dit (« · Lectures »). À voir sur l'app en ligne si le brasseur le trouve bruyant.
- Image du justificatif cassée au banc (« Voir l'original » + icône brisée) : `proofDataUrl` vide dans `banc.tsx`, pas l'app ; à confirmer en ligne.
- Chip « 2 » sur la tuile Règlement des Bauhaus (« 1 » ailleurs) : non expliqué à l'écran.
- La tache rejouée reste la lecture d'avant c1 (23/29) ; `bauhaus-eur` est une pièce construite. Après déploiement d'`aiTask`, rejouer les quatre vraies pièces en ligne (L28).
