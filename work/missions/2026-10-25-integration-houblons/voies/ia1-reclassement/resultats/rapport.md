# Essai d'IA : re-classer les substituts (#181, voie ia1-reclassement) — 26.10

Détail complet, cas par cas : `2026-10-26/rapport-moteur.md` (fenêtre = 20 premiers du moteur) et `2026-10-26/rapport-opt1.md` (fenêtre = 20 premiers de l'option 1). Réponses brutes : `2026-10-26/reponses-*/`. Requêtes figées : `../requetes/requetes-{moteur,opt1}.json`. Lanceur : `scripts/eval-hop/ia-reclassement.ts`.

## 1. Ce qui a été fait

- **Passe simulée d'abord** (`resultats/simule/`, `simule-fautes/`) : fournisseur simulé, journal temporaire. Avec un fournisseur qui rend l'ordre du moteur, l'IA donne exactement les métriques du moteur ; avec des fautes injectées (JSON coupé, identifiant hors liste, doublon), l'analyse les refuse et le moteur reste la réponse.
- **Moteur et option 1 recalculés ici** contre les chiffres publiés de e1 : identiques (MRR 0,118 à 60′, 0,121 au dry hop, 0,202 pour l'option 1 ; 74 rangs de substituts des 9 phares sur 74 retrouvés). e1 n'avait pas gardé les rangs par cas ; ils sont recalculés dans le lanceur (copie de la logique de e1, sans modifier `banc-eval.ts`).
- **Appels réels : 100 sur 100, 1,098 CHF sur 5.** 87 sur `gemini-3.8-flash`, 13 sur `gemini-3.5-flash-lite`, champ `modelVersion` vérifié à chaque réponse (aucun autre modèle). 100 lignes dans la section « ia1 » de `gemini-journal.md`, compteur « 100 / 100 ». Réflexion `low`, température 0, sortie JSON à schéma. Clé jamais affichée ni écrite.
  - 78 appels sur 3.8, fenêtre du moteur : 30 houblons de l'échantillon (graine 181) et les 9 phares, aux deux moments (60′ et dry hop).
  - 9 appels sur 3.8, fenêtre de l'option 1 : les 9 phares au dry hop.
  - 9 appels sur lite, fenêtre du moteur, et 4 sur lite, fenêtre de l'option 1 : phares au dry hop.

## 2. Résultats (référence : substituts Beer Maverick, comme e1)

### 2.1 Protocole écrit : l'IA reclasse les 20 premiers du moteur (3.8, 78 cas)

| | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 78 | 5,7 % | 7,9 % | 20,5 % | 38 | 0,079 |
| option 1 hors ligne (mots, λ = 0,25) | 78 | 6,7 % | 9,6 % | 25,6 % | 28 | 0,106 |
| **IA (3.8) sur le moteur** | 78 | 7,7 % | 10,5 % | 28,2 % | 38 | **0,164** |

- IA contre moteur : le premier substitut monte dans 19 cas, descend dans 5, ne bouge pas dans 54 ; **+0,085 de MRR (intervalle à 95 % : +0,029 à +0,143)** ; +2,6 points de rappel@10.
- IA contre option 1 : +0,058 de MRR, mais l'intervalle (−0,004 à +0,121) touche zéro ; 22 cas meilleurs, 21 moins bons.
- Par sous-ensemble : échantillon (60 cas) 0,086 → 0,158 (+0,072, intervalle +0,012 à +0,141) ; phares (18 cas) 0,056 → 0,184 ; dry hop (39) 0,088 → 0,200 (+0,112, intervalle +0,044 à +0,192) ; **60′ (39) 0,070 → 0,128 (+0,058, intervalle −0,021 à +0,146 : non établi)**.
- **Plafond de la fenêtre** : un substitut de référence est parmi les 20 candidats dans 25 cas sur 78 seulement ; une IA parfaite plafonnerait le MRR à 0,333. Le rang médian ne bouge pas (38) : le modèle ne remonte que ce que le moteur lui a laissé voir.
- **Seuil du protocole : NON ATTEINT.** Les chiffres passent (+0,085 de MRR ≥ +0,05) mais **Hallertau Blanc est 155e chez le moteur, hors des 20 candidats : le modèle ne peut pas le mettre dans les 5 premiers de Nelson Sauvin.** Le protocole écrit ne pouvait pas tenir ce critère ; c'est une propriété de la fenêtre, pas du modèle.

### 2.2 Variante : l'IA reclasse les 20 premiers de l'option 1 (phares au dry hop, 9 cas, 3.8)

| | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 9 | 6,9 % | 6,9 % | 22,2 % | 32 | 0,088 |
| option 1 hors ligne | 9 | 12,5 % | 16,2 % | 55,6 % | 9 | 0,180 |
| **IA (3.8) sur l'option 1** | 9 | 28,7 % | 31,5 % | 77,8 % | 2 | **0,563** |

- IA contre option 1 : le premier substitut monte dans 6 cas, descend dans 1, ne bouge pas dans 2 ; +0,383 de MRR (intervalle +0,167 à +0,628) ; +15,3 points de rappel@10.
- **K4 : Hallertau Blanc est 1er chez Nelson Sauvin** (moteur 155e, option 1 2e). Seuil formellement atteint sur ces 9 phares. Réserve : 9 phares connus, aucun houblon de l'échantillon dans cette variante (l'enveloppe était épuisée).

### 2.3 3.5 Flash-Lite contre 3.8

- Mêmes 9 phares au dry hop, fenêtre du moteur : MRR lite 0,317 contre 3.8 0,345 (même rappel@10, 15,3 %). Mêmes 4 phares, fenêtre de l'option 1 : MRR identique (0,517), Hallertau Blanc 1er chez les deux. Sur 13 appels, **lite ne perd pas de qualité mesurable** (échantillon très petit).
- **Durée** : 3.8 médiane 6,3 s, p95 7,4 s, max 8,0 s (87 appels) → **ne tient pas la limite de 3 s** de l'écran Substituer. Lite médiane 1,9 s, p95 2,8 s, max 2,8 s (13 appels) → tient, de justesse.
- **Coût estimé** (tarifs de `geminiCosts.ts`) : 3.8 0,0121 CHF par usage (≈ 3 770 jetons en entrée, 540 en sortie) ; lite 0,0031 CHF par usage. Total de l'essai 1,098 CHF.

### 2.4 Les cinq cas du brasseur

| cas | résultat |
|---|---|
| K1, K2, K3 (Suggérer : stout « plus floral », résineux stout/lager, agrumes IPA/lager) | **non applicables** : portent sur les visées et les échelles de style de Suggérer, pas sur le classement des substituts. À juger sur un essai de Suggérer. |
| K4 · Nelson Sauvin « sauvignon blanc » | fenêtre du moteur : Hallertau Blanc absent des 20 candidats (155e) → non tenu ; fenêtre de l'option 1 : **1er** (3.8 et lite) → tenu |
| K5 · Galaxy n'est pas Saaz | tenu dans tous les cas : Saaz est 223e chez Galaxy et Galaxy 253e chez Saaz (fenêtre du moteur) ; 211e et 231e (fenêtre de l'option 1) |

## 3. Les 9 phares : les 10 premiers de chaque système

Fenêtre du moteur, 3.8, dry hop et 60′ (18 cas). Pour chaque cas : moteur, option 1 (dry hop), IA avec une phrase par choix, rang des substituts Beer Maverick.

#### Nelson Sauvin — dry hop

- Moteur : 1. Boomerang · 2. Herkules · 3. Phoenix · 4. Kazbek · 5. Marynka · 6. Pacific Jade · 7. Summit · 8. CTZ · 9. Godiva · 10. Tomahawk
- Option 1 : 1. Herkules · 2. Hallertau Blanc · 3. Godiva · 4. Sládek · 5. Admiral · 6. Cashmere · 7. Jarrylo · 8. Phoenix · 9. Triumph · 10. Galena
- IA : 1. Godiva · 2. Jarrylo · 3. Southern Cross · 4. Triumph · 5. Summit · 6. Altus · 7. Delta · 8. Pacific Jade · 9. Herkules · 10. Boomerang
  - 1. Godiva : Partage les arômes clés de vin blanc et de groseille à maquereau typiques du Nelson, malgré un volume d'huile plus modeste.
  - 2. Jarrylo : Évoque directement le profil vin blanc et fruité recherché, tout en apportant une touche de poire plus marquée.
  - 3. Southern Cross : Origine néo-zélandaise offrant une belle dimension fruitée et tropicale en fermentation active, mais plus orientée sur les zestes d'agrumes.
  - 4. Triumph : Apporte un fruité intense et doux adapté au dry hop, bien qu'il tire davantage sur la pêche que le raisin blanc.
  - 5. Summit : Sa forte teneur en thiols maximise la biotransformation fruitée, mais son profil est nettement plus dank et alliacé.
  - 6. Altus : Riche en thiols pour libérer des arômes tropicaux en fermentation, compensant un profil aromatique plus résineux et épicé.
  - 7. Delta : Offre des notes fraîches de melon et d'agrumes assez douces, mais sans l'intensité vineuse ni la puissance thiolé du Nelson.
  - 8. Pacific Jade : Terroir néo-zélandais commun avec un profil d'huiles similaire, mais dominé par le poivre et les agrumes plutôt que le raisin.
  - 9. Herkules : Propose une facette fruitée melon et agrumes intéressante, mais reste un profil amérisant allemand beaucoup moins expressif en biotransformation.
  - 10. Boomerang : Composition en huiles assez proche, mais ses notes très épicées et classiques manquent cruellement de l'éclat fruité et vineux initial.
- Beer Maverick : Hallertau Blanc (moteur 155, option 1 2, IA 155) ; Enigma (moteur 244, option 1 92, IA 244) ; Motueka (moteur 89, option 1 130, IA 89) ; Riwaka (moteur 206, option 1 204, IA 206)

#### Nelson Sauvin — 60′

- Moteur : 1. Boomerang · 2. Herkules · 3. Pacific Jade · 4. Satus · 5. Gaia · 6. Herald · 7. Yeoman · 8. Hallertau Taurus · 9. Jarrylo · 10. Tomahawk
- IA : 1. Pacific Jade · 2. Southern Cross · 3. Magnum (US) · 4. Hallertau Taurus · 5. Gaia · 6. Yeoman · 7. Boomerang · 8. Olympic · 9. Phoenix · 10. TNT Blend
  - 1. Pacific Jade : Originaire de Nouvelle-Zélande, il présente un taux d'acide alpha et un niveau de cohumulone quasi identiques pour une amertume très similaire.
  - 2. Southern Cross : Également néo-zélandais, ses acides alpha et sa faible cohumulone assurent une amertume propre et douce, idéale à 60 minutes.
  - 3. Magnum (US) : Amérisant classique avec des taux d'acide alpha comparables et une cohumulone basse, garantissant une amertume nette et sans âpreté.
  - 4. Hallertau Taurus : Sa cohumulone très basse apporte une amertume douce similaire, bien que son taux d'alpha soit légèrement plus élevé.
  - 5. Gaia : Taux d'acides alpha et de cohumulone très proches, apportant une base amère similaire malgré une fraction d'humulène bien plus faible.
  - 6. Yeoman : Ses 25 % de cohumulone et ses acides alpha équivalents procurent une qualité d'amertume très fidèle au Nelson Sauvin.
  - 7. Boomerang : Acides alpha équivalents pour un dosage facile, mais sa cohumulone légèrement plus haute donnera une amertume un peu plus tranchante.
  - 8. Olympic : Parfait alignement sur les acides alpha, mais sa cohumulone un peu plus élevée offrira un profil d'amertume légèrement plus rustique.
  - 9. Phoenix : Taux d'alpha et de cohumulone bien alignés pour l'ébullition, offrant une amertume modérée bien que le profil général soit plus boisé.
  - 10. TNT Blend : Sa teneur en acides alpha est parfaitement calibrée pour remplacer le Nelson, bien que son profil chimique détaillé reste inconnu.
- Beer Maverick : Hallertau Blanc (moteur 125, IA 125) ; Enigma (moteur 95, IA 95) ; Motueka (moteur 163, IA 163) ; Riwaka (moteur 250, IA 250)

#### Citra — dry hop

- Moteur : 1. Bitter Gold · 2. Hydra · 3. Mistral · 4. McKenzie · 5. Palisade · 6. Southern Sublime · 7. Sabro · 8. Amarillo · 9. Styrian Cardinal · 10. Taiheke
- Option 1 : 1. NZH-107 · 2. Nectaron · 3. Riwaka · 4. Sitiva Blend · 5. Taiheke · 6. Amarillo · 7. Harlequin · 8. YQH-1380 · 9. HBC 586 · 10. Mistral
- IA : 1. Nectaron · 2. Riwaka · 3. Amarillo · 4. Hydra · 5. Ariana · 6. Styrian Cardinal · 7. YQH-1380 · 8. McKenzie · 9. Zamba Blend · 10. Belma
  - 1. Nectaron : Partage l'alliance parfaite de pamplemousse, fruit de la passion et pêche, avec un profil d'huiles très proche, mais un côté ananas plus marqué.
  - 2. Riwaka : Offre cette signature intense d'agrumes et fruit de la passion avec un taux de myrcène identique, bien qu'un peu plus dank et herbacé.
  - 3. Amarillo : Apporte des notes très proches d'agrumes, melon et pêche, mais développe une facette plus florale et épicée que le Citra.
  - 4. Hydra : Combine parfaitement agrumes, citron vert et pêche dans un registre très juteux, avec toutefois une touche résineuse supplémentaire.
  - 5. Ariana : Retrouve le fruit de la passion et la groseille à maquereau avec un potentiel thiol similaire, malgré des nuances plus douces et herbacées.
  - 6. Styrian Cardinal : Rejoint le Citra sur le citron vert et la rare groseille à maquereau, tout en tirant davantage vers la goyave et le jasmin.
  - 7. YQH-1380 : Un taux de myrcène comparable portant le citron vert et la pêche, mais avec une dominante goyave-ananas plus exotique.
  - 8. McKenzie : Propose le pamplemousse, le melon et les fruits à noyau caractéristiques, enrichis toutefois de notes de résine de pin et de thym.
  - 9. Zamba Blend : Profil d'huiles quasi identique et fruité éclatant d'agrumes et fruits à noyau, mais sans les touches de groseille ou fruits de la passion.
  - 10. Belma : Partage le pamplemousse, le melon et une richesse en myrcène similaire, tout en s'orientant nettement vers la fraise et les baies.
- Beer Maverick : Simcoe (moteur 103, option 1 51, IA 103) ; Mosaic (moteur 106, option 1 65, IA 106) ; Centennial (moteur 39, option 1 22, IA 39) ; Cascade (moteur 33, option 1 14, IA 33)

#### Citra — 60′

- Moteur : 1. Trident · 2. Bravo · 3. Nectaron · 4. Caliente · 5. Loral · 6. Southern Sublime · 7. Styrian Cardinal · 8. Petoskey · 9. Styrian Wolf · 10. Yeoman
- IA : 1. Trident · 2. Bravo · 3. Yeoman · 4. Caliente · 5. Zula · 6. Marco Polo · 7. Styrian Wolf · 8. Loral · 9. Sabro · 10. Nectaron
  - 1. Trident : Taux d'acides alpha et cohumulone quasi identiques, apportant une amertume nette et propre très similaire à 60 minutes.
  - 2. Bravo : Pur amérisant américain avec une cohumulone et des alpha similaires, idéal pour générer une amertume équivalente à l'ébullition.
  - 3. Yeoman : Teneurs en alpha et cohumulone très proches assurant une amertume franche et équilibrée, sans les notes aromatiques perdues à l'ébullition.
  - 4. Caliente : Profil amérisant proche avec des alpha élevés et une cohumulone comparable, pour une amertume soutenue et efficace.
  - 5. Zula : Variété duale dont la cohumulone modérée et la plage d'alpha permettent d'obtenir une amertume nette similaire.
  - 6. Marco Polo : Alpha et cohumulone superposables au Citra pour un rendu amer franc et propre lors d'une longue ébullition.
  - 7. Styrian Wolf : Cohumulone basse assurant une amertume douce et soyeuse, avec un niveau d'alpha suffisant pour calibrer l'ébullition.
  - 8. Loral : Alpha comparables et faible taux de cohumulone offrant une base d'amertume très propre et agréable à 60 minutes.
  - 9. Sabro : Teneurs en alpha et cohumulone très adaptées, bien que son potentiel aromatique unique soit dommage à sacrifier à l'ébullition.
  - 10. Nectaron : Taux d'alpha et de cohumulone très bien alignés pour l'amertume, mais dommage de dissiper son aromatique noble.
- Beer Maverick : Simcoe (moteur 55, IA 55) ; Mosaic (moteur 37, IA 37) ; Centennial (moteur 49, IA 49) ; Cascade (moteur 163, IA 163)

#### Motueka — dry hop

- Moteur : 1. Buzz Bullets · 2. Shaddock · 3. Cascade · 4. Southern Sublime · 5. Mandarina Bavaria · 6. Pilot · 7. Multihead · 8. Taiheke · 9. Yakima Gold · 10. Herald
- Option 1 : 1. Cascade · 2. Taiheke · 3. Riwaka · 4. Mandarina Bavaria · 5. Southern Cross · 6. Triskel · 7. Bravo · 8. Atlas · 9. HORT9909 · 10. Pilot
- IA : 1. Taiheke · 2. Diamond Springs · 3. Styrian Cardinal · 4. Wurttemberg · 5. Barbe Rouge · 6. Multihead · 7. Trident · 8. Zula · 9. Mandarina Bavaria · 10. Mistral
  - 1. Taiheke : Originaire de Nouvelle-Zélande, il partage le combo parfait de citron vert, agrumes et fruits tropicaux, avec un profil d'huiles très similaire.
  - 2. Diamond Springs : Ses notes d'agrumes, de citron et de menthe reproduisent fidèlement l'effet 'mojito' si caractéristique et recherché du Motueka.
  - 3. Styrian Cardinal : Il apporte d'excellentes notes de citron vert et de fruits tropicaux, bien qu'il soit plus expressif et opulent en huiles totales.
  - 4. Wurttemberg : Il partage les notes de citron vert, d'agrumes et de fleurs, mais tend vers un fond plus résineux et boisé.
  - 5. Barbe Rouge : Présente la touche citron vert et florale du Motueka, mais se distingue nettement par une dominance de baies et fruits rouges.
  - 6. Multihead : Apporte une base aromatique d'agrumes et de fruits tropicaux très proche, sans toutefois la spécificité citron vert/mojito.
  - 7. Trident : Fournit un profil fruité tropical et agrumes très efficace en dry hop, mais manque de la nuance citron vert fraîche.
  - 8. Zula : Offre des arômes nets d'agrumes et de fruits tropicaux bien adaptés au dry hop, malgré un profil moins complexe.
  - 9. Mandarina Bavaria : Assure le côté agrumes et fruits tropicaux avec un bon niveau de thiols, mais s'oriente vers la mandarine et la résine.
  - 10. Mistral : Apporte des agrumes et un côté floral et fruité original, mais tire davantage vers le vin blanc et le melon.
- Beer Maverick : Saaz (US) (moteur 291, option 1 289, IA 291) ; Sterling (moteur 198, option 1 112, IA 198)

#### Motueka — 60′

- Moteur : 1. Vienna Gold · 2. Zula · 3. Buzz Bullets · 4. Petoskey · 5. Trident · 6. Arcadian · 7. Solero · 8. NZH-107 · 9. Samba · 10. Ariana
- IA : 1. Taiheke · 2. Melba · 3. Vienna Gold · 4. Buzz Bullets · 5. Premiant · 6. NZH-107 · 7. Tropica · 8. Zula · 9. Arcadian · 10. Samba
  - 1. Taiheke : Originaire de Nouvelle-Zélande, son profil d'acides alpha et bêta est quasiment identique, assurant une amertume très comparable malgré une cohumulone légèrement supérieure.
  - 2. Melba : Taux d'acides alpha et niveau de cohumulone parfaitement alignés avec Motueka, garantissant une amertume nette et propre à 60 minutes d'ébullition.
  - 3. Vienna Gold : Sa plage d'alpha-acides similaire permet de cibler facilement les mêmes IBU sans altérer le profil d'amertume en début d'ébullition.
  - 4. Buzz Bullets : Teneurs en alpha et bêta-acides très proches de la cible, idéales pour fournir une amertume stable et équivalente à l'ébullition.
  - 5. Premiant : Acides alpha équivalents et faible cohumulone apportant une amertume encore plus douce et neutre, parfaite pour une base de 60 minutes.
  - 6. NZH-107 : Cohumulone similaire et alpha-acides modérés assurant une transition facile pour l'amertume, avec seulement un léger ajustement de dosage nécessaire.
  - 7. Tropica : Alpha-acides légèrement supérieurs mais suffisamment proches pour un remplacement direct de l'amertume en début d'ébullition.
  - 8. Zula : Cohumulone équivalente mais potentiel en acides alpha plus élevé, nécessitant de réduire un peu la quantité pour égaler les IBU.
  - 9. Arcadian : Taux d'acides alpha modéré convenable pour l'amertume, bien qu'un peu plus élevé que le Motueka moyen.
  - 10. Samba : Cohumulone comparable garantissant une texture d'amertume similaire, bien que sa teneur en alpha-acides demande un léger recalcul.
- Beer Maverick : Saaz (US) (moteur 292, IA 292) ; Sterling (moteur 87, IA 87)

#### Mosaic — dry hop

- Moteur : 1. Styrian Fox · 2. Idaho 7 · 3. Simcoe · 4. Galena · 5. Brewer's Gold (US) · 6. Hydra · 7. Styrian Eagle · 8. Strata · 9. Falconer's Flight · 10. Nugget
- Option 1 : 1. Idaho 7 · 2. Azacca · 3. Simcoe · 4. Mandarina Bavaria · 5. Zythos · 6. Hydra · 7. Sultana (Denali) · 8. Falconer's Flight · 9. Southern Cross · 10. Styrian Fox
- IA : 1. Simcoe · 2. Idaho 7 · 3. Hydra · 4. Strata · 5. Falconer's Flight · 6. Styrian Fox · 7. Sultana (Denali) · 8. Ariana · 9. Southern Cross · 10. Taiheke
  - 1. Simcoe : Parent génétique de Mosaic, Simcoe offre la même dualité baies, agrumes et pin résineux, avec un côté chewing-gum très proche.
  - 2. Idaho 7 : Idaho 7 partage ce profil intensément fruité et tropical (papaye, agrumes), rehaussé d'une touche résineuse et terreuse idéale en dry hopping.
  - 3. Hydra : Hydra reproduit fidèlement la complexité de Mosaic avec ses notes de mandarine, fruits tropicaux, rose et baies bien présentes.
  - 4. Strata : Strata apporte ce cœur fruité entre fraise, fruit de la passion et pamplemousse, assorti d'une note dank très complémentaire.
  - 5. Falconer's Flight : Ce blend apporte le panier de fruits tropicaux, de pamplemousse et de pin typique des IPA modernes axées sur Mosaic.
  - 6. Styrian Fox : Styrian Fox offre un profil intéressant de fruits tropicaux et de cassis, rappelant la myrtille de Mosaic avec une touche herbacée.
  - 7. Sultana (Denali) : Sultana développe une intensité tropicale majeure sur l'ananas et les agrumes résineux, bien que moins axé sur les fruits rouges.
  - 8. Ariana : Ariana partage l'orientation mandarine, fruits tropicaux et baies, tout en restant un peu plus douce et florale.
  - 9. Southern Cross : Southern Cross combine fruits tropicaux, zeste d'agrumes et pin, offrant une aromatique expressive en fermentation active malgré un profil plus citronné.
  - 10. Taiheke : Taiheke apporte une belle fraîcheur d'agrumes et de fruits tropicaux, bien que son intensité aromatique globale soit légèrement plus légère.
- Beer Maverick : Citra (moteur 63, option 1 64, IA 63) ; Simcoe (moteur 3, option 1 3, IA 1)

#### Mosaic — 60′

- Moteur : 1. TNT Blend · 2. Loral · 3. Altus · 4. Trident · 5. Bravo · 6. Zenia · 7. Azacca · 8. Magnat · 9. Olympic · 10. Sticky Fingers Blend
- IA : 1. Southern Cross · 2. Yeoman · 3. Sultana (Denali) · 4. Trident · 5. Sticky Fingers Blend · 6. Magnat · 7. Olympic · 8. Zenia · 9. TNT Blend · 10. Marco Polo
  - 1. Southern Cross : Taux d'acides alpha identiques et cohumulone très proche (25-28 %), offrant une amertume nette et propre tout à fait comparable à 60 minutes.
  - 2. Yeoman : Taux d'alpha très similaire et cohumulone calquée à 25 %, assurant une amertume douce parfaitement interchangeable à l'ébullition.
  - 3. Sultana (Denali) : Cohumulone identique (22-26 %) et alpha équivalents permettant d'obtenir la même texture d'amertume, malgré un potentiel d'alpha légèrement supérieur.
  - 4. Trident : Fourchette d'acides alpha et taux de cohumulone superposables garantissant un niveau et une qualité d'amertume similaires à 60 minutes.
  - 5. Sticky Fingers Blend : Alpha parfaitement alignés (11,9 %) et cohumulone légèrement plus haute assurant une amertume très proche sans rugosité excessive.
  - 6. Magnat : Cohumulone très basse et alpha similaires produisant une amertume fine et nette, idéale pour remplacer Mosaic au boil.
  - 7. Olympic : Teneur en alpha quasi identique, bien que sa cohumulone un peu plus haute apporte une amertume légèrement plus tranchante.
  - 8. Zenia : Acides alpha équivalents (11-14 %) convenant très bien pour le bittering, bien que le profil de cohumulone ne soit pas documenté.
  - 9. TNT Blend : Alpha strictement comparables assurant le bon calcul d'IBU à 60 minutes, même si la cohumulone reste inconnue.
  - 10. Marco Polo : Taux d'alpha très proche de Mosaic (12-13 %), avec une cohumulone un peu plus élevée procurant une amertume un peu plus mordante.
- Beer Maverick : Citra (moteur 30, IA 30) ; Simcoe (moteur 22, IA 22)

#### Galaxy — dry hop

- Moteur : 1. Samba · 2. Zamba Blend · 3. Harlequin · 4. Nectaron · 5. Idaho Gem · 6. NZH-107 · 7. YQH-1380 · 8. Trident · 9. Tropica · 10. Southern Sublime
- Option 1 : 1. Harlequin · 2. Nectaron · 3. Vic Secret · 4. NZH-107 · 5. Strata · 6. Tango · 7. Sultana (Denali) · 8. Tropica · 9. Amarillo · 10. Sequoia Blend
- IA : 1. Nectaron · 2. Harlequin · 3. NZH-107 · 4. Solero · 5. Tropica · 6. Tango · 7. Trident · 8. Samba · 9. Southern Sublime · 10. Melba
  - 1. Nectaron : Copie presque conforme du profil Galaxy avec son intense mélange de fruit de la passion, pêche et agrumes, bien qu'un peu moins dank.
  - 2. Harlequin : Partage le trio aromatique majeur fruit de la passion, pêche et ananas, mais apporte une touche légèrement plus douce et moins résineuse.
  - 3. NZH-107 : Offre cette puissante dominante d'agrumes et de fruit de la passion très proche de l'hémisphère sud, sans la composante pêche marquée.
  - 4. Solero : Sa richesse en thiols restitue parfaitement la trame tropicale mangue et fruit de la passion, avec une expression toutefois plus propre et fruitée.
  - 5. Tropica : Rejoint Galaxy sur l'ananas, les fruits tropicaux et ce côté dank caractéristique, mais met davantage l'orange en avant.
  - 6. Tango : Bon profil ananas et fruit de la passion soutenu par une forte charge en huiles, complété d'une légère touche épicée absente du Galaxy.
  - 7. Trident : Excellente alternative pour un punch de fruits tropicaux et de passion en dry hop, sans toutefois atteindre la même complexité dank.
  - 8. Samba : Apporte une explosion d'ananas et de fruits tropicaux très adaptée au dry hop, mais avec une note bonbon plus sucrée.
  - 9. Southern Sublime : Partage ce mélange recherché de fruits tropicaux et de notes dank et piquantes, bien qu'axé sur la prune plutôt que la passion.
  - 10. Melba : Origine australienne et profil axé sur la passion et le pamplemousse, mais nettement plus épicé et moins lourd en fruits jaunes.
- Beer Maverick : Simcoe (moteur 43, option 1 37, IA 43) ; Citra (moteur 32, option 1 14, IA 32) ; Amarillo (moteur 66, option 1 9, IA 66)

#### Galaxy — 60′

- Moteur : 1. Eclipse · 2. HPA-016 · 3. Satus · 4. Southern Sublime · 5. Tillicum · 6. Trident · 7. El Dorado · 8. Yeoman · 9. Zula · 10. BRU-1
- IA : 1. Bitter Gold · 2. Tillicum · 3. Satus · 4. Caliente · 5. Idaho Gem · 6. Enigma · 7. Eclipse · 8. BRU-1 · 9. Jarrylo · 10. El Dorado
  - 1. Bitter Gold : Taux d'alpha similaires et profil de cohumulone élevé parfaitement équivalent, idéal pour reproduire l'amertume tranchante du Galaxy à 60 minutes.
  - 2. Tillicum : Houblon purement amérisant affichant exactement la même teneur en alpha et cohumulone, apportant un profil d'amertume très fidèle.
  - 3. Satus : Destiné à l'amertume avec une cohumulone comparable et un potentiel d'alpha identique, garantissant une amertume nette et propre.
  - 4. Caliente : Teneur en alpha et cohumulone de 35 % très proches, assurant une intensité d'amertume quasi identique à 60 minutes.
  - 5. Idaho Gem : Excellente correspondance en alpha et cohumulone élevée, reproduisant fidèlement le mordant caractéristique de l'amertume du Galaxy.
  - 6. Enigma : Origine australienne et niveau de cohumulone très semblable, bien que ses acides alpha légèrement plus élevés demandent un léger réajustement.
  - 7. Eclipse : Cohumulone similaire et même terroir australien, mais ses alpha légèrement supérieurs nécessitent de doser avec un peu plus de modération.
  - 8. BRU-1 : Taux d'acides alpha et de cohumulone très proches, garantissant une amertume comparable malgré un usage orienté arôme.
  - 9. Jarrylo : Plage de cohumulone adéquate et niveau d'alpha suffisant pour extraire une amertume similaire après 60 minutes d'ébullition.
  - 10. El Dorado : Teneur en acides alpha équivalente, fournissant une amertume d'intensité similaire malgré un niveau de cohumulone un peu plus modéré.
- Beer Maverick : Simcoe (moteur 73, IA 73) ; Citra (moteur 216, IA 216) ; Amarillo (moteur 101, IA 101)

#### Simcoe — dry hop

- Moteur : 1. Idaho 7 · 2. HBC 630 · 3. Hydra · 4. Mosaic · 5. Sabro · 6. Strata · 7. Talus · 8. XJA2/436 · 9. Zythos · 10. Newport
- Option 1 : 1. Idaho 7 · 2. Mandarina Bavaria · 3. Vic Secret · 4. Falconer's Flight 7CS · 5. Mosaic · 6. Sticklebract · 7. Zythos · 8. Falconer's Flight · 9. Palisade · 10. Hydra
- IA : 1. Mosaic · 2. Idaho 7 · 3. Vic Secret · 4. Zythos · 5. Falconer's Flight · 6. Strata · 7. Talus · 8. Hydra · 9. Galaxy · 10. Southern Cross
  - 1. Mosaic : Descendant partiel du Simcoe, il partage parfaitement son duo résine de pin et fruits tropicaux, avec des notes de myrtille en plus.
  - 2. Idaho 7 : Il restitue fidèlement l'équilibre entre pamplemousse, fruits tropicaux, abricot et résine de pin typique du Simcoe en dry hop.
  - 3. Vic Secret : Son profil marqué de fruit de la passion et de pin résineux rappelle vivement le côté percutant et fruité du Simcoe.
  - 4. Zythos : Ce mélange reproduit fidèlement la trame agrumes, pamplemousse et pin, bien qu'il soit légèrement plus floral et moins terreux.
  - 5. Falconer's Flight : Il apporte les arômes indispensables de pamplemousse, fruits tropicaux et pin, avec une touche citronnée un peu plus brillante.
  - 6. Strata : Très pertinent en biotransformation grâce au fruit de la passion et au pamplemousse, avec une facette dank plus appuyée.
  - 7. Talus : Il offre le même fond puissant de pamplemousse rose et de résine de pin, complété par des notes florales plus prononcées.
  - 8. Hydra : Son alliance de résine, d'agrumes vifs et de fruits tropicaux offre une excellente alternative fruitée et fraîche.
  - 9. Galaxy : Excellent pour pousser le fruit de la passion et les agrumes en fermentation active, mais moins boisé et résineux que le Simcoe.
  - 10. Southern Cross : Il restitue le caractère résineux et épicé avec des notes d'agrumes franches, bien qu'il manque un peu de fruits tropicaux.
- Beer Maverick : Summit (moteur 91, option 1 65, IA 91) ; Magnum (US) (moteur 216, option 1 170, IA 216) ; Amarillo (moteur 83, option 1 12, IA 83) ; Mosaic (moteur 4, option 1 5, IA 1) ; Cascade (moteur 51, option 1 38, IA 51) ; Centennial (moteur 96, option 1 77, IA 96) ; Citra (moteur 55, option 1 56, IA 55) ; Columbus (moteur 86, option 1 68, IA 86)

#### Simcoe — 60′

- Moteur : 1. Caliente · 2. Yeoman · 3. Trident · 4. Warrior · 5. Zenia · 6. Idaho 7 · 7. African Queen · 8. Hartwick · 9. Newport · 10. Sticklebract
- IA : 1. Warrior · 2. HBC 630 · 3. Magnat · 4. Yeoman · 5. Trident · 6. Altus · 7. Zenia · 8. Chinook · 9. African Queen · 10. Caliente
  - 1. Warrior : Taux d'alpha similaires et cohumulone modérée pour une amertume propre, avec un profil classique très proche bien que légèrement plus résineux.
  - 2. HBC 630 : Acides alpha et cohumulone quasi identiques au Simcoe, apportant une base amère tout aussi douce et nette à 60 minutes.
  - 3. Magnat : Plage d'alpha et taux de cohumulone très proches, garantissant une intensité et une qualité d'amertume comparables sans dureté excessive.
  - 4. Yeoman : Même force en acides alpha et niveau de cohumulone contenu, offrant une amertume franche et équilibrée équivalente en début d'ébullition.
  - 5. Trident : Teneur en alpha et cohumulone bien alignées avec le Simcoe, idéales pour structurer l'amertume sans agressivité notable en chaudière.
  - 6. Altus : Cohumulone basse assurant une amertume noble et soyeuse, même si ses acides alpha légèrement supérieurs imposent d'ajuster le dosage.
  - 7. Zenia : Même niveau d'acides alpha pour calibrer l'amertume de base, bien que son taux de cohumulone demeure inconnu.
  - 8. Chinook : Alpha comparables et usage amérisant réputé, mais sa cohumulone plus élevée donne une amertume un peu plus mordante que le Simcoe.
  - 9. African Queen : Force en alpha équivalente et cohumulone modérée, parfaite pour cibler les mêmes IBU malgré un registre aromatique initialement différent.
  - 10. Caliente : Taux d'alpha très proche facilitant la substitution amère, mais sa cohumulone plus haute apportera une amertume légèrement plus tranchante.
- Beer Maverick : Summit (moteur 46, IA 46) ; Magnum (US) (moteur 121, IA 121) ; Amarillo (moteur 144, IA 144) ; Mosaic (moteur 213, IA 213) ; Cascade (moteur 223, IA 223) ; Centennial (moteur 106, IA 106) ; Citra (moteur 216, IA 216) ; Columbus (moteur 43, IA 43)

#### Saaz — dry hop

- Moteur : 1. Pacific Crest · 2. Tettnang (US) · 3. Aurum · 4. Styrian Golding · 5. Hallertau Tradition · 6. Sussex · 7. Spalter Select · 8. Aramis · 9. Marynka · 10. Strisselspalt
- Option 1 : 1. Aurum · 2. Spalt · 3. Saaz Late · 4. Celeia · 5. Pacific Crest · 6. Tettnang (US) · 7. Wild Loyalist · 8. Styrian Golding · 9. Strisselspalt · 10. Amethyst
- IA : 1. Saaz Late · 2. Saaz (US) · 3. Spalter Select · 4. Tettnang (US) · 5. Celeia · 6. Pacific Crest · 7. Aurum · 8. Strisselspalt · 9. Styrian Golding · 10. Hallertau Tradition
  - 1. Saaz Late : Variante directe du Saaz, il offre un profil aromatique terreux, herbacé et floral identique, avec une teneur en farnésène parfaitement équivalente.
  - 2. Saaz (US) : Version américaine du Saaz partageant son profil noble et terreux, avec une touche plus épicée et un farnésène très proche.
  - 3. Spalter Select : Issu de la lignée Saaz, il reproduit son haut niveau de farnésène avec des notes épicées et herbacées très fidèles.
  - 4. Tettnang (US) : Profil noble, herbacé et épicé très proche du Saaz, complété par une présence notable de farnésène idéale pour ce dry hop.
  - 5. Celeia : Partage les descripteurs nobles, floraux, épicés et terreux du Saaz, avec une touche subtile de lavande en fermentation active.
  - 6. Pacific Crest : Apporte des arômes nobles, terreux, floraux et herbacés très similaires, malgré un taux de farnésène nettement plus bas.
  - 7. Aurum : Descendant de Saaz au profil noble, terreux, floral et doux, mais présentant une légère nuance fruitée d'agrumes en plus.
  - 8. Strisselspalt : Variété noble traditionnelle aux accents floraux, épicés et herbacés très doux, bien qu'elle manque du farnésène caractéristique du Saaz.
  - 9. Styrian Golding : Arômes nobles, terreux et doux très compatibles, bien que ses notes résineuses et épicées soient un peu plus prononcées.
  - 10. Hallertau Tradition : Fleuron noble allemand aux touches terreuses et d'herbe coupée, tirant toutefois davantage vers des arômes fruités et de nectar.
- Beer Maverick : Saaz (US) (moteur 19, option 1 14, IA 2) ; Sterling (moteur 40, option 1 17, IA 40)

#### Saaz — 60′

- Moteur : 1. Wild Loyalist · 2. Mount Hood · 3. Saaz Late · 4. Amethyst · 5. Spalt · 6. Tettnang (US) · 7. Willamette · 8. Contessa · 9. Saphir · 10. Tettnanger
- IA : 1. Saaz Late · 2. Spalt · 3. Tettnanger · 4. Lubelska · 5. Tettnang (US) · 6. Hallertau (US) · 7. Hersbrucker · 8. Mount Hood · 9. Crystal · 10. Wild Loyalist
  - 1. Saaz Late : Descendant direct du Saaz avec un taux d'acides alpha et de cohumulone quasi identiques, apportant une amertume tout aussi douce.
  - 2. Spalt : Variété noble classique offrant des alpha et un ratio de cohumulone très proches, garantissant une amertume noble et propre à l'ébullition.
  - 3. Tettnanger : Profil analytique très semblable avec un faible taux d'alpha et de cohumulone, délivrant une amertume fine typique des lagers traditionnelles.
  - 4. Lubelska : Issu de la même lignée noble, il présente des taux d'alpha et de cohumulone presque parfaits pour imiter l'amertume du Saaz.
  - 5. Tettnang (US) : Excellente alternative amérisante noble avec une teneur en acides alpha et cohumulone assurant une amertume modérée et sans astringence.
  - 6. Hallertau (US) : Teneur en alpha et cohumulone très similaire, procurant une amertume délicate parfaitement adaptée aux styles exigeant la pureté du Saaz.
  - 7. Hersbrucker : Même plage d'acides alpha très basse et cohumulone modérée pour une amertume d'une grande finesse, bien que légèrement plus ronde.
  - 8. Mount Hood : Bien que plus riche en résines, sa cohumulone basse permet d'obtenir une amertume très propre en ajustant légèrement le grammage.
  - 9. Crystal : Taux d'acides alpha et de cohumulone très comparables, idéal pour une amertume neutre et douce à 60 minutes de cuisson.
  - 10. Wild Loyalist : Teneur en acides alpha comparable au Saaz pour doser facilement l'amertume, même si le manque de données sur la cohumulone invite à la prudence.
- Beer Maverick : Saaz (US) (moteur 21, IA 21) ; Sterling (moteur 43, IA 43)

#### Cascade — dry hop

- Moteur : 1. Barbe Rouge · 2. Mandarina Bavaria · 3. Sasquatch · 4. Olympic · 5. Taiheke · 6. Buzz Bullets · 7. Herald · 8. HORT9909 · 9. Motueka · 10. Southern Cross
- Option 1 : 1. Taiheke · 2. Cluster · 3. Atlas · 4. Bravo · 5. Riwaka · 6. Brewer's Gold (US) · 7. Southern Cross · 8. Bullion · 9. Galena · 10. Zythos
- IA : 1. Taiheke · 2. Ahtanum · 3. Tahoma · 4. Zythos · 5. Herald · 6. Yakima Gold · 7. Olympic · 8. Southern Cross · 9. Mandarina Bavaria · 10. Sasquatch
  - 1. Taiheke : Sélectionné comme le Cascade néo-zélandais, il reproduit fidèlement le profil pamplemousse, floral et épicé avec une touche plus exotique.
  - 2. Ahtanum : Très proche par ses notes d'agrumes, de pamplemousse, de pin et de fleurs, avec un profil d'huiles très similaire.
  - 3. Tahoma : Descendant direct du Cascade, il offre le même équilibre agrumes, pamplemousse et pin, bien qu'un peu plus boisé.
  - 4. Zythos : Ce mélange pensé pour le style américain apporte exactement les notes de pamplemousse, mandarine, pin et floral recherchées.
  - 5. Herald : Met en avant des arômes marqués d'orange et de pamplemousse, bien que le côté floral et pin soit plus discret.
  - 6. Yakima Gold : Partage le duo citron-pamplemousse et un bon taux de farnésène, avec toutefois un caractère globalement plus doux.
  - 7. Olympic : Retrouve le classicisme américain axé sur les agrumes et les épices, malgré l'absence des nuances florales délicates.
  - 8. Southern Cross : Apporte la résine de pin et les agrumes caractéristiques, mais tire davantage vers le citron vert et les fruits tropicaux.
  - 9. Mandarina Bavaria : Partage une belle intensité thiolée et d'agrumes avec une touche résineuse, mais orientée vers la mandarine douce.
  - 10. Sasquatch : Offre une belle fraîcheur d'agrumes et de fleurs, mais se distingue par des notes nettes de mandarine et de menthe.
- Beer Maverick : Amarillo (moteur 108, option 1 48, IA 108) ; Centennial (moteur 51, option 1 14, IA 51) ; Ahtanum (moteur 17, option 1 31, IA 2) ; Summit (moteur 61, option 1 121, IA 61)

#### Cascade — 60′

- Moteur : 1. Aloha Blend · 2. Diamant · 3. Sun · 4. Agnus · 5. Buzz Bullets · 6. Sticklebract · 7. Tomahawk · 8. Zeus · 9. Arcadian · 10. Brewer's Gold (US)
- IA : 1. Mount Rainier · 2. Mandarina Bavaria · 3. Buzz Bullets · 4. Olympic · 5. Boomerang · 6. Agnus · 7. Marco Polo · 8. Sun · 9. Sticklebract · 10. Zeus
  - 1. Mount Rainier : Taux d'acides alpha et cohumulone très proches, apportant une amertume d'intensité et de finesse parfaitement comparable à 60 minutes.
  - 2. Mandarina Bavaria : Cohumulone similaire assurant une qualité d'amertume comparable, avec un taux d'alpha très proche demandant peu d'ajustement de dosage.
  - 3. Buzz Bullets : Teneur en alpha-acides très similaire permettant un remplacement direct sans recalcul complexe du profil d'amertume.
  - 4. Olympic : Cohumulone alignée garantissant une amertume nette et propre, bien que les acides alpha plus élevés imposent de réduire la dose.
  - 5. Boomerang : Niveau de cohumulone très équivalent pour une amertume similaire, malgré un potentiel amérisant en alpha légèrement supérieur.
  - 6. Agnus : Son ratio de cohumulone correspond bien à l'amertume du Cascade, mais son taux d'alpha nécessite d'ajuster le grammage.
  - 7. Marco Polo : Taux de cohumulone identique offrant un profil d'amertume semblable, bien que ses acides alpha plus forts obligent à sous-doser.
  - 8. Sun : Plage de cohumulone identique pour une amertume franche, mais une concentration en alpha bien plus élevée demandant de réduire la quantité.
  - 9. Sticklebract : Cohumulone proche pour une amertume équivalente à l'ébullition, mais demande de diviser la dose en raison d'alphas élevés.
  - 10. Zeus : Même profil de cohumulone pour une amertume comparable, nécessitant simplement de recalculer les IBU à cause d'alphas plus puissants.
- Beer Maverick : Amarillo (moteur 86, IA 86) ; Centennial (moteur 57, IA 57) ; Ahtanum (moteur 208, IA 208) ; Summit (moteur 81, IA 81)

#### Idaho 7 — dry hop

- Moteur : 1. Simcoe · 2. Mosaic · 3. Styrian Fox · 4. Hydra · 5. HBC 630 · 6. Ariana · 7. Nugget · 8. Talus · 9. Sabro · 10. Strata
- Option 1 : 1. Simcoe · 2. Falconer's Flight · 3. Mosaic · 4. Azacca · 5. Amarillo · 6. Brewer's Gold (US) · 7. Hydra · 8. Zythos · 9. Cascade · 10. Bullion
- IA : 1. Simcoe · 2. Mosaic · 3. Talus · 4. Ekuanot · 5. Hydra · 6. Falconer's Flight · 7. Zythos · 8. Styrian Fox · 9. Strata · 10. Michigan Copper
  - 1. Simcoe : Partage cette combinaison unique d'agrumes, d'abricot, de fruits tropicaux et de résine de pin, avec un profil d'huiles très proche en biotransformation.
  - 2. Mosaic : Excellente alternative pour les notes intenses de papaye, d'agrumes et de pin résineux, bien que plus orienté myrtille qu'Idaho 7.
  - 3. Talus : Offre un profil d'agrumes intenses et une résine boisée très semblable à la touche thé noir/pin, avec une nuance florale plus marquée.
  - 4. Ekuanot : Retrouve la papaye, les agrumes lourds et la composante résineuse/herbacée, mais apporte une touche d'eucalyptus inexistante chez Idaho 7.
  - 5. Hydra : Rapprochement parfait sur l'abricot, la mandarine et la résine, avec un taux de myrcène comparable idéal en fermentation active.
  - 6. Falconer's Flight : Apporte la fraîcheur du pamplemousse, des fruits tropicaux et du pin, mais reste un assemblage un peu moins complexe et terreux.
  - 7. Zythos : Copie bien les saveurs de mandarine, pamplemousse et pin typiques d'Idaho 7, tout en étant légèrement moins expressif sur le côté fruité lourd.
  - 8. Styrian Fox : Rejoint la note caractéristique de cassis, les agrumes et le pin, mais s'avère plus délicat et moins dense en huiles totales.
  - 9. Strata : Offre des fruits tropicaux et du pamplemousse soutenus par un côté résineux dank, remplaçant efficacement la composante terreuse mais avec plus de fraise.
  - 10. Michigan Copper : Partage le fruité tropical éclatant et le fond résineux, avec cependant une orientation bonbon et cerise noire plus prononcée.
- Beer Maverick : Azacca (moteur 98, option 1 4, IA 98) ; El Dorado (moteur 101, option 1 82, IA 101) ; Cashmere (moteur 154, option 1 181, IA 154) ; Citra (moteur 43, option 1 53, IA 43) ; Idaho Gem (moteur 105, option 1 250, IA 105) ; Amarillo (moteur 46, option 1 5, IA 46) ; Chinook (moteur 81, option 1 34, IA 81) ; Columbus (moteur 70, option 1 54, IA 70)

#### Idaho 7 — 60′

- Moteur : 1. Bravo · 2. Caliente · 3. Simcoe · 4. Trident · 5. Magnat · 6. Marco Polo · 7. Nugget · 8. Yeoman · 9. Zenia · 10. Styrian Cardinal
- IA : 1. Sun · 2. Caliente · 3. Herald · 4. Marco Polo · 5. Bravo · 6. Styrian Cardinal · 7. Zythos · 8. Trident · 9. Nugget · 10. Simcoe
  - 1. Sun : Taux d'acides alpha et profil de cohumulone quasi identiques, idéal pour fournir une amertume franche similaire à 60 minutes.
  - 2. Caliente : Teneur en alpha et cohumulone très proches, assurant un niveau d'amertume et une amertume perçue équivalents à l'ébullition.
  - 3. Herald : Même plage d'acides alpha et niveau de cohumulone élevé comparable, garantissant un mordant similaire sans impact aromatique résiduel.
  - 4. Marco Polo : Cohumulone et acides alpha parfaitement alignés pour restituer l'intensité d'amertume attendue de l'Idaho 7 à pleine ébullition.
  - 5. Bravo : Usage amérisant avec des taux d'alpha et de cohumulone voisins, apportant une base amère solide et propre à l'ébullition.
  - 6. Styrian Cardinal : Taux d'alpha et cohumulone équivalents, ce qui en fait un substitut très fidèle pour l'amertume malgré son profil aromatique différent.
  - 7. Zythos : Taux d'alpha similaires et cohumulone légèrement inférieure, offrant une amertume comparable bien que subtilement plus douce.
  - 8. Trident : Potentiel d'amérisation très proche en alpha, avec une cohumulone un peu plus basse donnant une amertume légèrement plus ronde.
  - 9. Nugget : Plage d'alpha très similaire mais cohumulone modérée, produisant une amertume un peu plus propre et moins tranchante.
  - 10. Simcoe : Alpha comparables garantissant l'extraction d'amertume, bien que sa cohumulone nettement plus basse apporte une amertume plus douce.
- Beer Maverick : Azacca (moteur 217, IA 217) ; El Dorado (moteur 86, IA 86) ; Cashmere (moteur 223, IA 223) ; Citra (moteur 214, IA 214) ; Idaho Gem (moteur 52, IA 52) ; Amarillo (moteur 136, IA 136) ; Chinook (moteur 47, IA 47) ; Columbus (moteur 48, IA 48)

### Fenêtre de l'option 1, 3.8, dry hop (9 cas)

#### Nelson Sauvin — dry hop

- Moteur : 1. Boomerang · 2. Herkules · 3. Phoenix · 4. Kazbek · 5. Marynka · 6. Pacific Jade · 7. Summit · 8. CTZ · 9. Godiva · 10. Tomahawk
- Option 1 : 1. Herkules · 2. Hallertau Blanc · 3. Godiva · 4. Sládek · 5. Admiral · 6. Cashmere · 7. Jarrylo · 8. Phoenix · 9. Triumph · 10. Galena
- IA : 1. Hallertau Blanc · 2. Godiva · 3. African Queen · 4. Jarrylo · 5. Galena · 6. Cashmere · 7. Sládek · 8. Triumph · 9. Cascade · 10. Southern Dawn
  - 1. Hallertau Blanc : Le clone aromatique idéal : même profil marqué de vin blanc, sauvignon et groseille à maquereau, enrichi d'une forte teneur en thiols.
  - 2. Godiva : Partage directement les notes clés de vin blanc et groseille à maquereau, bien que son taux d'huiles soit légèrement plus faible.
  - 3. African Queen : Apporte cette touche spécifique de groseille à maquereau et de fruits intenses, avec un profil d'huiles très proche mais plus dank.
  - 4. Jarrylo : Évoque directement le vin blanc avec un profil très fruité et juteux, malgré des notes de poire et banane plus prononcées.
  - 5. Galena : Offre des arômes communs de groseille à maquereau et de fruits intenses, bien qu'il tire davantage vers le cassis et les agrumes.
  - 6. Cashmere : Profil fruité complexe et moderne convenant bien au dry hop, mais orienté agrumes doux et noix de coco plutôt que vin blanc.
  - 7. Sládek : Apporte des notes fruitées intéressantes et des fruits de la passion compatibles, mais avec un fond plus noble et herbacé.
  - 8. Triumph : Partage un bel équilibre fruité en houblonnage à cru, mais reste dominé par la pêche, le pin et les agrumes classiques.
  - 9. Cascade : Riche en thiols pour la biotransformation en fermentation active, mais son profil penche nettement vers le pamplemousse floral plutôt que le sauvignon.
  - 10. Southern Dawn : Offre un profil fruité atypique et frais en fermentation, bien qu'il s'éloigne du vin blanc avec des notes herbacées et épicées.
- Beer Maverick : Hallertau Blanc (moteur 155, option 1 2, IA 1) ; Enigma (moteur 244, option 1 92, IA 92) ; Motueka (moteur 89, option 1 130, IA 130) ; Riwaka (moteur 206, option 1 204, IA 204)

#### Citra — dry hop

- Moteur : 1. Bitter Gold · 2. Hydra · 3. Mistral · 4. McKenzie · 5. Palisade · 6. Southern Sublime · 7. Sabro · 8. Amarillo · 9. Styrian Cardinal · 10. Taiheke
- Option 1 : 1. NZH-107 · 2. Nectaron · 3. Riwaka · 4. Sitiva Blend · 5. Taiheke · 6. Amarillo · 7. Harlequin · 8. YQH-1380 · 9. HBC 586 · 10. Mistral
- IA : 1. Nectaron · 2. Galaxy · 3. NZH-107 · 4. Riwaka · 5. Amarillo · 6. Styrian Cardinal · 7. Hydra · 8. Falconer's Flight · 9. YQH-1380 · 10. Astra
  - 1. Nectaron : Partage le même profil percutant de pêche, fruit de la passion et pamplemousse, avec une charge aromatique idéale en fermentation active.
  - 2. Galaxy : Apporte cette même intensité de fruit de la passion, pêche et agrumes tropicaux, bien qu'il tire davantage sur des notes dank.
  - 3. NZH-107 : Rejoint parfaitement le Citra sur le pamplemousse et le fruit de la passion avec un taux de myrcène très proche.
  - 4. Riwaka : Offre des arômes intenses de pamplemousse et fruits tropicaux très adaptés au dry hop, malgré un profil d'acides alpha plus faible.
  - 5. Amarillo : Évoque le côté agrumes, pamplemousse et pêche mûre, mais présente une facette florale et épicée un peu plus marquée.
  - 6. Styrian Cardinal : Retrouve la touche rare de groseille à maquereau et d'agrumes, avec une grande richesse en huiles totales parfaite en bio-aromatisation.
  - 7. Hydra : Combine citron vert, pêche et fruits tropicaux avec un bon niveau de myrcène, bien qu'il s'oriente plus vers la mandarine.
  - 8. Falconer's Flight : Fournit une explosion d'agrumes et de fruits tropicaux typique des IPA américaines, avec un accent résineux un peu plus soutenu.
  - 9. YQH-1380 : Partage les arômes de citron vert et de pêche, complétés d'ananas, avec un niveau de myrcène très similaire au Citra.
  - 10. Astra : Revisite les notes de pêche, melon et pamplemousse, bien qu'il glisse vers des nuances plus vineuses de sauvignon.
- Beer Maverick : Simcoe (moteur 103, option 1 51, IA 51) ; Mosaic (moteur 106, option 1 65, IA 65) ; Centennial (moteur 39, option 1 22, IA 22) ; Cascade (moteur 33, option 1 14, IA 17)

#### Motueka — dry hop

- Moteur : 1. Buzz Bullets · 2. Shaddock · 3. Cascade · 4. Southern Sublime · 5. Mandarina Bavaria · 6. Pilot · 7. Multihead · 8. Taiheke · 9. Yakima Gold · 10. Herald
- Option 1 : 1. Cascade · 2. Taiheke · 3. Riwaka · 4. Mandarina Bavaria · 5. Southern Cross · 6. Triskel · 7. Bravo · 8. Atlas · 9. HORT9909 · 10. Pilot
- IA : 1. Taiheke · 2. Meridian · 3. Southern Cross · 4. Riwaka · 5. Sitiva Blend · 6. HORT9909 · 7. Atlas · 8. Cascade · 9. Falconer's Flight · 10. Barbe Rouge
  - 1. Taiheke : Ce cousin néo-zélandais partage l'ADN aromatique du Motueka avec ses notes intenses de citron vert, d'agrumes tropicaux et son profil d'huiles très proche.
  - 2. Meridian : L'association rare d'agrumes, de citron et de menthe fraîche rappelle parfaitement le profil mojito emblématique du Motueka pour un dry hopping expressif.
  - 3. Southern Cross : Autre néo-zélandais riche en agrumes vifs et citron vert, bien qu'il apporte une touche résineuse et épicée un peu plus prononcée.
  - 4. Riwaka : Même terroir néo-zélandais offrant de puissantes notes de fruits tropicaux et d'agrumes, mais avec un côté pamplemousse et passion plus lourd.
  - 5. Sitiva Blend : Il capture l'arôme de citron vert et possède un taux élevé de farnésène similaire au Motueka, complété par de douces notes florales.
  - 6. HORT9909 : Sélection néo-zélandaise centrée sur le citron et le citron vert, toutefois plus rustique et épicée que l'aromatique vive du Motueka.
  - 7. Atlas : Sa teneur remarquable en farnésène et sa note franche de citron vert imitent bien la fraîcheur du Motueka, malgré une nuance boisée supplémentaire.
  - 8. Cascade : Classique américain offrant un équilibre agrumes et floral très efficace, mais tirant nettement sur le pamplemousse plutôt que sur la limette.
  - 9. Falconer's Flight : Ce blend délivre une belle synergie de fruits tropicaux et de citron en dry hop, bien qu'il manque l'aspect mojito herbacé.
  - 10. Barbe Rouge : Il apporte une facette citron vert intéressante au dry hop, mais orientera le profil final vers les petits fruits rouges.
- Beer Maverick : Saaz (US) (moteur 291, option 1 289, IA 289) ; Sterling (moteur 198, option 1 112, IA 112)

#### Mosaic — dry hop

- Moteur : 1. Styrian Fox · 2. Idaho 7 · 3. Simcoe · 4. Galena · 5. Brewer's Gold (US) · 6. Hydra · 7. Styrian Eagle · 8. Strata · 9. Falconer's Flight · 10. Nugget
- Option 1 : 1. Idaho 7 · 2. Azacca · 3. Simcoe · 4. Mandarina Bavaria · 5. Zythos · 6. Hydra · 7. Sultana (Denali) · 8. Falconer's Flight · 9. Southern Cross · 10. Styrian Fox
- IA : 1. Simcoe · 2. Idaho 7 · 3. Hydra · 4. Azacca · 5. Styrian Fox · 6. Falconer's Flight · 7. Zythos · 8. Topaz · 9. Sultana (Denali) · 10. Mandarina Bavaria
  - 1. Simcoe : Parent génétique de Mosaic, Simcoe reproduit idéalement le mélange complexe de baies, fruits tropicaux, chewing-gum et pin, malgré une touche plus terreuse.
  - 2. Idaho 7 : Parfait pour la biotransformation avec son côté papaye, cassis et agrumes résineux, bien qu'il tire davantage vers le thé noir et l'abricot.
  - 3. Hydra : Un profil d'huiles très proche avec des notes communes de rose, mandarine et fruits tropicaux, mais plus axé sur la pastèque.
  - 4. Azacca : Apporte la charge intense de mangue, papaye et agrumes nécessaire en fermentation active, tout en manquant des facettes myrtille et résineuse.
  - 5. Styrian Fox : Offre des arômes fruités rares avec ce cassis proche de la myrtille de Mosaic, quoiqu'un peu plus floral et épicé.
  - 6. Falconer's Flight : Ce mélange moderne restitue bien les fruits tropicaux, les agrumes et le pin, mais avec moins de profondeur sur les petits fruits.
  - 7. Zythos : Un assemblage dual très fruité qui coche mandarine, fruits tropicaux et pin, restant toutefois plus sage et agrumes que Mosaic.
  - 8. Topaz : Ses notes de fruits tropicaux et de résine fonctionnent en fermentation active, mais son profil litchi et clou de girofle s'éloigne.
  - 9. Sultana (Denali) : Une énorme charge d'huiles délivrant agrumes, pin et fruits tropicaux, tirant cependant très fort vers l'ananas pur.
  - 10. Mandarina Bavaria : Riche en thiols pour le dry hop avec de belles mandarines, mais sans la complexité de baies et de fruits tropicaux de Mosaic.
- Beer Maverick : Citra (moteur 63, option 1 64, IA 64) ; Simcoe (moteur 3, option 1 3, IA 1)

#### Galaxy — dry hop

- Moteur : 1. Samba · 2. Zamba Blend · 3. Harlequin · 4. Nectaron · 5. Idaho Gem · 6. NZH-107 · 7. YQH-1380 · 8. Trident · 9. Tropica · 10. Southern Sublime
- Option 1 : 1. Harlequin · 2. Nectaron · 3. Vic Secret · 4. NZH-107 · 5. Strata · 6. Tango · 7. Sultana (Denali) · 8. Tropica · 9. Amarillo · 10. Sequoia Blend
- IA : 1. Nectaron · 2. Vic Secret · 3. Strata · 4. Citra · 5. Harlequin · 6. NZH-107 · 7. BRU-1 · 8. Tropica · 9. YQH-1380 · 10. Azacca
  - 1. Nectaron : Partage l'intensité passion, pêche et ananas du Galaxy avec une forte teneur en myrcène, mais offre un profil plus net et moins dank.
  - 2. Vic Secret : Originaire du même terroir australien, il reproduit fidèlement les notes de fruits tropicaux et passion, bien qu'il soit plus résineux.
  - 3. Strata : Capture parfaitement la combinaison rare de fruit de la passion intense et de notes dank et cannabis propres au Galaxy.
  - 4. Citra : Excellente alternative en biotransformation pour ses notes puissantes d'agrumes, pêche et fruit de la passion, avec moins d'arômes végétaux.
  - 5. Harlequin : Revisite le trio fruité passion, pêche et ananas avec un profil d'huiles similaire, mais manque de la signature dank du Galaxy.
  - 6. NZH-107 : Offre une belle proximité sur le fruit de la passion et les agrumes, bien que son expression aromatique globale soit un peu moins explosive.
  - 7. BRU-1 : Apporte la facette ananas ultra mûr et fruitée très recherchée chez Galaxy, mais fait l'impasse sur le côté dank et passion.
  - 8. Tropica : Retrouve le mariage de fruits tropicaux, d'ananas et de nuances dank, même si le fruit de la passion n'y est pas explicite.
  - 9. YQH-1380 : Partage les descripteurs d'ananas et de pêche soutenus par un fort taux de myrcène, mais tire davantage sur le citron vert.
  - 10. Azacca : Fournit une explosion de fruits tropicaux et d'ananas idéale en fermentation active, malgré des notes épicées absentes du Galaxy.
- Beer Maverick : Simcoe (moteur 43, option 1 37, IA 37) ; Citra (moteur 32, option 1 14, IA 4) ; Amarillo (moteur 66, option 1 9, IA 13)

#### Simcoe — dry hop

- Moteur : 1. Idaho 7 · 2. HBC 630 · 3. Hydra · 4. Mosaic · 5. Sabro · 6. Strata · 7. Talus · 8. XJA2/436 · 9. Zythos · 10. Newport
- Option 1 : 1. Idaho 7 · 2. Mandarina Bavaria · 3. Vic Secret · 4. Falconer's Flight 7CS · 5. Mosaic · 6. Sticklebract · 7. Zythos · 8. Falconer's Flight · 9. Palisade · 10. Hydra
- IA : 1. Mosaic · 2. Idaho 7 · 3. Vic Secret · 4. Moutere · 5. Chinook · 6. Falconer's Flight · 7. Zythos · 8. Amarillo · 9. Hydra · 10. Ahtanum
  - 1. Mosaic : Partage l'ADN aromatique du Simcoe avec des notes marquées de pin, fruits tropicaux, terreux et chewing-gum, malgré un profil un peu plus myrtille.
  - 2. Idaho 7 : Offre un équilibre parfait entre agrumes, fruits tropicaux, abricot et résine de pin, bien qu'il présente une facette thé noir absente du Simcoe.
  - 3. Vic Secret : Rejoint très fidèlement la combinaison pin, fruit de la passion et terreux du Simcoe, mais se montre globalement plus axé sur l'ananas.
  - 4. Moutere : Combine admirablement le fruit de la passion, le pamplemousse, le pin et le côté terreux, avec une touche herbacée de foin en plus.
  - 5. Chinook : Recrée impeccablement la trame résineuse, pin et pamplemousse du Simcoe, tout en manquant de sa dimension fruitée tropicale.
  - 6. Falconer's Flight : Ce mélange moderne délivre les tonalités attendues de pin, pamplemousse et fruits tropicaux, avec un accent floral plus prononcé.
  - 7. Zythos : Apporte les marqueurs agrumes, pamplemousse et pin du Simcoe en dry hop, avec une intensité globale un soupçon plus modérée.
  - 8. Amarillo : Retrouve le pamplemousse, l'abricot et le côté dank si typiques, mais tire davantage sur l'orange douce que sur le pin résineux.
  - 9. Hydra : Excellente alternative fruitée mêlant résine, agrumes, abricot et baies, même si le profil s'avère plus doux et orienté melon-pêche.
  - 10. Ahtanum : Partage le spectre pamplemousse, pin et terreux propre au Simcoe, mais avec une intensité fruitée et tropicale nettement plus discrète.
- Beer Maverick : Summit (moteur 91, option 1 65, IA 65) ; Magnum (US) (moteur 216, option 1 170, IA 170) ; Amarillo (moteur 83, option 1 12, IA 8) ; Mosaic (moteur 4, option 1 5, IA 1) ; Cascade (moteur 51, option 1 38, IA 38) ; Centennial (moteur 96, option 1 77, IA 77) ; Citra (moteur 55, option 1 56, IA 56) ; Columbus (moteur 86, option 1 68, IA 68)

#### Saaz — dry hop

- Moteur : 1. Pacific Crest · 2. Tettnang (US) · 3. Aurum · 4. Styrian Golding · 5. Hallertau Tradition · 6. Sussex · 7. Spalter Select · 8. Aramis · 9. Marynka · 10. Strisselspalt
- Option 1 : 1. Aurum · 2. Spalt · 3. Saaz Late · 4. Celeia · 5. Pacific Crest · 6. Tettnang (US) · 7. Wild Loyalist · 8. Styrian Golding · 9. Strisselspalt · 10. Amethyst
- IA : 1. Saaz Late · 2. Saaz (US) · 3. Spalt · 4. Sterling · 5. Aurum · 6. Wild Loyalist · 7. Celeia · 8. Tettnang (US) · 9. Styrian Golding · 10. Zagrava
  - 1. Saaz Late : Dérivé direct du Saaz avec un profil aromatique terreux, herbacé et floral identique et un taux de farnésène parfaitement équivalent.
  - 2. Saaz (US) : Version américaine du Saaz, très proche sur le caractère noble et terreux, avec une fraction de farnésène bien préservée.
  - 3. Spalt : Variété noble partageant les mêmes notes terreuses, florales et herbacées, soutenue par un ratio d'huiles très similaire, notamment en farnésène.
  - 4. Sterling : Hybride issu du Saaz offrant le même profil noble, épicé et floral avec une teneur en farnésène presque identique en dry hop.
  - 5. Aurum : Profil aromatique noble, floral et terreux extrêmement fidèle au Saaz, bien qu'il apporte une touche fruitée supplémentaire.
  - 6. Wild Loyalist : Excellente correspondance aromatique sur l'herbacé, le floral et le terreux noble, malgré un manque de données précises sur les huiles.
  - 7. Celeia : Apporte la finesse noble, florale et terreuse recherchée en fermentation active, avec seulement une légère nuance de lavande.
  - 8. Tettnang (US) : Noble classique très herbe coupée et épicé qui s'intègre bien, bien que son taux de farnésène soit plus modeste.
  - 9. Styrian Golding : Partage le caractère noble, terreux et doux, mais s'avère un peu plus résineux et pauvre en farnésène.
  - 10. Zagrava : Taux de farnésène très proche et notes nobles herbacées et florales, mais plus fruité et intense en huiles totales.
- Beer Maverick : Saaz (US) (moteur 19, option 1 14, IA 2) ; Sterling (moteur 40, option 1 17, IA 4)

#### Cascade — dry hop

- Moteur : 1. Barbe Rouge · 2. Mandarina Bavaria · 3. Sasquatch · 4. Olympic · 5. Taiheke · 6. Buzz Bullets · 7. Herald · 8. HORT9909 · 9. Motueka · 10. Southern Cross
- Option 1 : 1. Taiheke · 2. Cluster · 3. Atlas · 4. Bravo · 5. Riwaka · 6. Brewer's Gold (US) · 7. Southern Cross · 8. Bullion · 9. Galena · 10. Zythos
- IA : 1. Centennial · 2. Taiheke · 3. Falconer's Flight · 4. Zythos · 5. Dana · 6. Southern Cross · 7. Styrian Dragon · 8. Riwaka · 9. Atlas · 10. Motueka
  - 1. Centennial : Considéré comme un super Cascade, il partage son profil pamplemousse, floral et pin, idéal en dry hop malgré un peu plus de puissance.
  - 2. Taiheke : Issu du Cascade néo-zélandais, il reproduit fidèlement la trame agrumes, pamplemousse et floral, enrichie d'une touche tropicale typique du terroir.
  - 3. Falconer's Flight : Cet assemblage centré sur le profil nord-américain offre exactement l'équilibre pamplemousse, pin et floral recherché pour une bière portée sur le houblon.
  - 4. Zythos : Parfait pour le dry hop, il apporte une signature agrumes, pamplemousse et pin très proche, avec une nuance de mandarine plus marquée.
  - 5. Dana : Son équilibre floral, agrumes et résineux rappelle bien le Cascade, avec une touche continentale un peu plus herbacée en biotransformation.
  - 6. Southern Cross : Il combine les notes de pin, d'agrumes et d'épices du Cascade, bien que son côté fruité soit plus exotique.
  - 7. Styrian Dragon : Il livre un profil pamplemousse et floral très aromatique, complété par des notes de baies inexistantes chez le Cascade.
  - 8. Riwaka : Centré sur le pamplemousse et les agrumes, il sera beaucoup plus exubérant et tropical que le Cascade en fin de fermentation.
  - 9. Atlas : Partage les descripteurs floral, pin et agrumes avec un bon niveau de myrcène, mais son profil reste plus discret.
  - 10. Motueka : Apporte la fraîcheur d'agrumes et le côté floral du Cascade, mais tire distinctement sur le citron vert et le mojito.
- Beer Maverick : Amarillo (moteur 108, option 1 48, IA 48) ; Centennial (moteur 51, option 1 14, IA 1) ; Ahtanum (moteur 17, option 1 31, IA 31) ; Summit (moteur 61, option 1 121, IA 121)

#### Idaho 7 — dry hop

- Moteur : 1. Simcoe · 2. Mosaic · 3. Styrian Fox · 4. Hydra · 5. HBC 630 · 6. Ariana · 7. Nugget · 8. Talus · 9. Sabro · 10. Strata
- Option 1 : 1. Simcoe · 2. Falconer's Flight · 3. Mosaic · 4. Azacca · 5. Amarillo · 6. Brewer's Gold (US) · 7. Hydra · 8. Zythos · 9. Cascade · 10. Bullion
- IA : 1. Simcoe · 2. Mosaic · 3. Ekuanot · 4. Azacca · 5. Talus · 6. Hydra · 7. Falconer's Flight · 8. Amarillo · 9. Rakau · 10. Styrian Fox
  - 1. Simcoe : Partage le duo fruits tropicaux/abricot et la note résineuse de pin caractéristique d'Idaho 7, avec un profil d'huiles très proche.
  - 2. Mosaic : Excellente alternative en biotransformation pour ses notes intenses de papaye, agrumes et pin, bien qu'il apporte une touche de myrtille inédite.
  - 3. Ekuanot : Rejoint Idaho 7 sur la papaye, les agrumes et les notes herbacées/thé noir, avec une charge aromatique puissante en houblonnage à cru.
  - 4. Azacca : Offre le même punch tropical dominé par la papaye et les agrumes, mais fait l'impasse sur le côté pin résineux.
  - 5. Talus : Reproduit parfaitement l'équilibre entre pamplemousse rose, fruits tropicaux et côté résineux de pin, tout en tirant plus sur le floral potpourri.
  - 6. Hydra : Combine habilement les agrumes vifs, l'abricot et la résine d'Idaho 7, complétés par de discrètes notes de pastèque et fruits rouges.
  - 7. Falconer's Flight : Mélange bien les agrumes, les fruits tropicaux et le pin, mais manque de la profondeur abricot et thé noir d'Idaho 7.
  - 8. Amarillo : Retrouve les facettes d'orange, abricot et pamplemousse avec un fond dank, tout en restant plus doux et moins résineux.
  - 9. Rakau : Apporte un profil très complémentaire axé sur les fruits à noyau (abricot) et la résine de pin, sans le côté agrumes tranchant.
  - 10. Styrian Fox : Offre l'arôme rare de cassis partagé avec Idaho 7 ainsi que des touches tropicales et de pin, dans un registre un peu plus herbacé.
- Beer Maverick : Azacca (moteur 98, option 1 4, IA 4) ; El Dorado (moteur 101, option 1 82, IA 82) ; Cashmere (moteur 154, option 1 181, IA 181) ; Citra (moteur 43, option 1 53, IA 53) ; Idaho Gem (moteur 105, option 1 250, IA 250) ; Amarillo (moteur 46, option 1 5, IA 8) ; Chinook (moteur 81, option 1 34, IA 34) ; Columbus (moteur 70, option 1 54, IA 54)

## 4. Doutes et limites

- **Même source que la référence** : le modèle a pu lire Beer Maverick (les mots des fiches en viennent aussi). Contre cela : le gain existe sur l'échantillon de 30 houblons moins célèbres (+0,072, intervalle > 0) et pas seulement sur les phares ; K4 vient d'un mot du brasseur, pas de Beer Maverick. Ce n'est pas une preuve d'absence de fuite.
- **Échantillons petits** : 9 phares (4 pour lite sur l'option 1). La variante « fenêtre de l'option 1 » n'a pas été essayée sur l'échantillon de 30. Un seul passage par cas, température 0 : la variance d'une répétition n'est pas mesurée.
- **Règle de lecture changée après coup, et dite** : une réponse (santiam, dry hop) rendait 11 entrées au lieu de 10 ; elle a d'abord été comptée invalide (repli sur le moteur), puis acceptée en gardant les 10 premières entrées (ce que ferait l'app). Le rapport ré-analyse le texte gardé avec la règle actuelle. 78 réponses sur 78 sont valides.
- **Pas la vérité du brasseur** : un meilleur rang veut dire « plus proche de Beer Maverick », comme en e1. Il n'a pas vu les listes de l'IA ; seules les phrases ci-dessus permettent de juger.
- **L'IA ne remonte pas ce qui est hors fenêtre** (§2.1). À 60′ le gain n'est pas établi.
- Critère « `git diff --stat -- src/domain src/ui` vide » : vide à la fin de la voie (les diffs de src vus au démarrage ont été commités entre-temps) ; cette voie n'écrit rien dans `src/`.
