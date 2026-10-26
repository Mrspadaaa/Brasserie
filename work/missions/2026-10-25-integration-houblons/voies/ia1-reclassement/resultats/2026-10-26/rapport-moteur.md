# Essai d'IA : re-classement des substituts (#181, voie ia1-reclassement)

Généré par `scripts/eval-hop/ia-reclassement.ts --rapport`. Invite v1, requêtes figées `requetes/requetes-moteur.json` (empreinte 0dfecaf4cfa656bb). Référence : substituts Beer Maverick (comme e1) ; le moteur et l'option 1 sont recalculés ici sur les mêmes cas.

## 0. Contrôle : le moteur seul et l'option 1, recalculés ici, contre e1

| mesure | MRR (ici / e1) | rappel@10 | rang médian | |
|---|---|---|---|---|
| moteur 60′ (217 houblons) | 0,118 / 0,118 | 9,9 % / 9,9 % | 36 / 36 | identique |
| moteur dry hop actif (217) | 0,121 / 0,121 | 10,9 % / 10,9 % | 27 / 27 | identique |
| option 1 λ = 0,25, arôme (217) | 0,202 / 0,202 | 17,5 % / 17,5 % | 14 / 14 | identique |
| rangs des substituts BM des 9 phares, deux moments | 74 / 74 rangs retrouvés | | | identique |

Le moteur et l'option 1 retrouvent à l'identique les chiffres publiés de e1 sur les 217 houblons : OUI.

## Réponses réelles : moteur-3.8 (2026-10-26)

78 cas, 78 réponses valides (100,0 %) ; modèle(s) observé(s) : gemini-3.8-flash. Une réponse invalide laisse le classement de départ (le repli) et pèse donc 0 dans le gain.

### Tous les cas (60′ et dry hop)

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 78 | 5,7 % | 7,9 % | 20,5 % | 38 | 0,079 |
| option 1 (mots, λ = 0,25), hors ligne | 78 | 6,7 % | 9,6 % | 25,6 % | 28 | 0,106 |
| IA (sur le moteur) | 78 | 7,7 % | 10,5 % | 28,2 % | 38 | 0,164 |

IA contre moteur : le premier substitut monte dans 19 cas, descend dans 5, reste dans 54 ; écart de MRR +0,085 (intervalle à 95 % : 0,029 à 0,143).
IA contre option 1 : le premier substitut monte dans 22 cas, descend dans 21, reste dans 35 ; écart de MRR +0,058 (intervalle à 95 % : -0,004 à 0,121).

### Échantillon (graine 181, 30 premiers) — les deux moments

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 60 | 6,4 % | 9,3 % | 23,3 % | 37,5 | 0,086 |
| option 1 (mots, λ = 0,25), hors ligne | 60 | 6,9 % | 10,1 % | 25,0 % | 31,5 | 0,107 |
| IA (sur le moteur) | 60 | 7,8 % | 11,3 % | 30,0 % | 37,5 | 0,158 |

IA contre moteur : le premier substitut monte dans 15 cas, descend dans 5, reste dans 40 ; écart de MRR +0,072 (intervalle à 95 % : 0,012 à 0,141).
IA contre option 1 : le premier substitut monte dans 18 cas, descend dans 16, reste dans 26 ; écart de MRR +0,051 (intervalle à 95 % : -0,014 à 0,124).

### Les 9 houblons phares — les deux moments

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 18 | 3,5 % | 3,5 % | 11,1 % | 40 | 0,056 |
| option 1 (mots, λ = 0,25), hors ligne | 18 | 6,3 % | 8,1 % | 27,8 % | 21,5 | 0,102 |
| IA (sur le moteur) | 18 | 7,6 % | 7,6 % | 22,2 % | 40 | 0,184 |

IA contre moteur : le premier substitut monte dans 4 cas, descend dans 0, reste dans 14 ; écart de MRR +0,128 (intervalle à 95 % : 0,025 à 0,261).
IA contre option 1 : le premier substitut monte dans 4 cas, descend dans 5, reste dans 9 ; écart de MRR +0,082 (intervalle à 95 % : -0,056 à 0,236).

### Dry hop seulement (tous les cas)

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 39 | 7,2 % | 10,8 % | 25,6 % | 26 | 0,088 |
| option 1 (mots, λ = 0,25), hors ligne | 39 | 9,3 % | 14,2 % | 35,9 % | 14 | 0,141 |
| IA (sur le moteur) | 39 | 10,5 % | 15,3 % | 41,0 % | 26 | 0,200 |

IA contre moteur : le premier substitut monte dans 14 cas, descend dans 3, reste dans 22 ; écart de MRR +0,112 (intervalle à 95 % : 0,044 à 0,192).
IA contre option 1 : le premier substitut monte dans 17 cas, descend dans 19, reste dans 3 ; écart de MRR +0,059 (intervalle à 95 % : -0,026 à 0,154).

### 60′ seulement (tous les cas) : l'option 1 ne change rien à 60′

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 39 | 4,1 % | 5,0 % | 15,4 % | 47 | 0,070 |
| option 1 (mots, λ = 0,25), hors ligne | 39 | 4,1 % | 5,0 % | 15,4 % | 47 | 0,070 |
| IA (sur le moteur) | 39 | 5,0 % | 5,7 % | 15,4 % | 47 | 0,128 |

IA contre moteur : le premier substitut monte dans 5 cas, descend dans 2, reste dans 32 ; écart de MRR +0,058 (intervalle à 95 % : -0,021 à 0,146).
IA contre option 1 : le premier substitut monte dans 5 cas, descend dans 2, reste dans 32 ; écart de MRR +0,058 (intervalle à 95 % : -0,021 à 0,146).

**Plafond de la fenêtre** : un substitut de référence est dans les 20 candidats pour 25 cas sur 78 ; une IA parfaite qui le mettrait premier plafonne le MRR à 0,333. Ce que le modèle ne voit pas, il ne peut pas le remonter.

**Seuil pour continuer** (+0,05 de MRR ou +5 points de rappel@10 sur le moteur seul, **et** Hallertau Blanc dans les 5 premiers de Nelson Sauvin au dry hop) : gain de MRR +0,085, de rappel@10 +2,6 point(s) sur tous les cas → chiffres atteints ; Hallertau Blanc au rang 155 chez l'IA (moteur : 155, option 1 : 2) → non tenu. **Seuil : NON ATTEINT.** Écart de l'IA à l'option 1 : MRR +0,058, rappel@10 +0,9 point(s).

### Les 9 phares : les 10 premiers de chaque système

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

### Les cinq cas du brasseur (K1 à K5)

| cas | lecture | résultat |
|---|---|---|
| K1 · Stout « plus floral » | Suggérer, pas Substituer : hors du périmètre de ce banc | non applicable ici |
| K2 · résineux, stout contre lager | Suggérer (échelles de style) | non applicable ici |
| K3 · agrumes, IPA contre lager | Suggérer (échelles de style) | non applicable ici |
| K4 · Nelson Sauvin (vin blanc) | Hallertau Blanc dans les 5 premiers au dry hop | IA : rang 155 ; moteur : 155 ; option 1 : 2 → non tenu |
| K5 · Galaxy n'est pas Saaz | Saaz hors des 10 premiers de Galaxy et Galaxy hors des 10 premiers de Saaz, au dry hop | Saaz chez Galaxy : rang 223 ; Galaxy chez Saaz : rang 253 → tenu / tenu |

K1 à K3 portent sur Suggérer (visées de recette et échelles de style), pas sur le classement des substituts : l'IA de ce banc n'y touche pas. Ils restent à juger sur un essai de Suggérer.

### Durée, jetons, coût

- Durée par requête : médiane 6278,5 ms, p95 7403 ms, max 8024 ms ; limite de l'écran Substituer : 3 s au p95 → NON tenue.
- Jetons : entrée 3769 en moyenne (total 294009), sortie 538 en moyenne (total 41943), réflexion comprise.
- Coût estimé (tarifs de `geminiCosts.ts`, 1 USD = 1,25 CHF) : 0.9445 CHF pour 78 appels (78 chiffrés), soit 0.0121 CHF par usage.

## Réponses réelles : moteur-lite (2026-10-26)

9 cas, 9 réponses valides (100,0 %) ; modèle(s) observé(s) : gemini-3.5-flash-lite. Une réponse invalide laisse le classement de départ (le repli) et pèse donc 0 dans le gain.

### Tous les cas (60′ et dry hop)

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 9 | 6,9 % | 6,9 % | 22,2 % | 32 | 0,088 |
| option 1 (mots, λ = 0,25), hors ligne | 9 | 12,5 % | 16,2 % | 55,6 % | 9 | 0,180 |
| IA (sur le moteur) | 9 | 15,3 % | 15,3 % | 44,4 % | 32 | 0,317 |

IA contre moteur : le premier substitut monte dans 3 cas, descend dans 0, reste dans 6 ; écart de MRR +0,228 (intervalle à 95 % : 0,050 à 0,462).
IA contre option 1 : le premier substitut monte dans 4 cas, descend dans 5, reste dans 0 ; écart de MRR +0,137 (intervalle à 95 % : -0,124 à 0,424).

### Échantillon (graine 181, 30 premiers) — les deux moments

(aucun cas)

### Les 9 houblons phares — les deux moments

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 9 | 6,9 % | 6,9 % | 22,2 % | 32 | 0,088 |
| option 1 (mots, λ = 0,25), hors ligne | 9 | 12,5 % | 16,2 % | 55,6 % | 9 | 0,180 |
| IA (sur le moteur) | 9 | 15,3 % | 15,3 % | 44,4 % | 32 | 0,317 |

IA contre moteur : le premier substitut monte dans 3 cas, descend dans 0, reste dans 6 ; écart de MRR +0,228 (intervalle à 95 % : 0,050 à 0,462).
IA contre option 1 : le premier substitut monte dans 4 cas, descend dans 5, reste dans 0 ; écart de MRR +0,137 (intervalle à 95 % : -0,124 à 0,424).

### Dry hop seulement (tous les cas)

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 9 | 6,9 % | 6,9 % | 22,2 % | 32 | 0,088 |
| option 1 (mots, λ = 0,25), hors ligne | 9 | 12,5 % | 16,2 % | 55,6 % | 9 | 0,180 |
| IA (sur le moteur) | 9 | 15,3 % | 15,3 % | 44,4 % | 32 | 0,317 |

IA contre moteur : le premier substitut monte dans 3 cas, descend dans 0, reste dans 6 ; écart de MRR +0,228 (intervalle à 95 % : 0,050 à 0,462).
IA contre option 1 : le premier substitut monte dans 4 cas, descend dans 5, reste dans 0 ; écart de MRR +0,137 (intervalle à 95 % : -0,124 à 0,424).

### 60′ seulement (tous les cas) : l'option 1 ne change rien à 60′

(aucun cas)

**Plafond de la fenêtre** : un substitut de référence est dans les 20 candidats pour 4 cas sur 9 ; une IA parfaite qui le mettrait premier plafonne le MRR à 0,456. Ce que le modèle ne voit pas, il ne peut pas le remonter.

**Seuil pour continuer** (+0,05 de MRR ou +5 points de rappel@10 sur le moteur seul, **et** Hallertau Blanc dans les 5 premiers de Nelson Sauvin au dry hop) : gain de MRR +0,229, de rappel@10 +8,4 point(s) sur tous les cas → chiffres atteints ; Hallertau Blanc au rang 155 chez l'IA (moteur : 155, option 1 : 2) → non tenu. **Seuil : NON ATTEINT.** Écart de l'IA à l'option 1 : MRR +0,137, rappel@10 -0,9 point(s).

### Les 9 phares : les 10 premiers de chaque système

#### Nelson Sauvin — dry hop

- Moteur : 1. Boomerang · 2. Herkules · 3. Phoenix · 4. Kazbek · 5. Marynka · 6. Pacific Jade · 7. Summit · 8. CTZ · 9. Godiva · 10. Tomahawk
- Option 1 : 1. Herkules · 2. Hallertau Blanc · 3. Godiva · 4. Sládek · 5. Admiral · 6. Cashmere · 7. Jarrylo · 8. Phoenix · 9. Triumph · 10. Galena
- IA : 1. Godiva · 2. Jarrylo · 3. Altus · 4. Southern Cross · 5. Summit · 6. Triumph · 7. Pacific Jade · 8. Kazbek · 9. Delta · 10. Boomerang
  - 1. Godiva : Godiva partage les notes uniques de vin blanc et groseille à maquereau du Nelson Sauvin, mais son huile totale est plus faible.
  - 2. Jarrylo : Jarrylo évoque le vin blanc et le fruit comme le Nelson Sauvin, mais son profil penche plus vers les agrumes et la banane.
  - 3. Altus : Altus possède une classe de thiols forte similaire au Nelson Sauvin, mais se distingue par un profil plus résineux et mandarine.
  - 4. Southern Cross : Southern Cross vient de Nouvelle-Zélande et offre des notes de citron et fruits tropicaux proches, malgré une composante épicée plus marquée.
  - 5. Summit : Summit affiche une classe forte de thiols comme le Nelson Sauvin, mais apporte des notes terreuses et d'agrumes beaucoup plus envahissantes.
  - 6. Triumph : Triumph propose un beau fruité et des agrumes adaptés au dry hop, mais manque la signature caractéristique de raisin blanc du substitué.
  - 7. Pacific Jade : Pacific Jade est néo-zélandais et offre un usage dual intéressant, mais ses arômes tournent autour du poivre et de l'herbacé.
  - 8. Kazbek : Kazbek est un houblon d'arôme avec un alpha modéré, mais ses notes citronnées et épicées s'éloignent du profil vineux original.
  - 9. Delta : Delta présente un bon taux de linalol pour le dry hop, mais ses arômes de melon et d'agrumes diffèrent du raisin de Nelson.
  - 10. Boomerang : Boomerang offre un bon potentiel aromatique en dry hop, mais ses notes épicées et d'agrumes n'égalent pas la complexité du vin blanc.
- Beer Maverick : Hallertau Blanc (moteur 155, option 1 2, IA 155) ; Enigma (moteur 244, option 1 92, IA 244) ; Motueka (moteur 89, option 1 130, IA 89) ; Riwaka (moteur 206, option 1 204, IA 206)

#### Citra — dry hop

- Moteur : 1. Bitter Gold · 2. Hydra · 3. Mistral · 4. McKenzie · 5. Palisade · 6. Southern Sublime · 7. Sabro · 8. Amarillo · 9. Styrian Cardinal · 10. Taiheke
- Option 1 : 1. NZH-107 · 2. Nectaron · 3. Riwaka · 4. Sitiva Blend · 5. Taiheke · 6. Amarillo · 7. Harlequin · 8. YQH-1380 · 9. HBC 586 · 10. Mistral
- IA : 1. Nectaron · 2. Amarillo · 3. McKenzie · 4. Styrian Cardinal · 5. Ariana · 6. Hydra · 7. Taiheke · 8. Riwaka · 9. Mistral · 10. Belma
  - 1. Nectaron : Nectaron partage le profil tropical, la pêche et le fruit de la passion du Citra, bien que son profil penche plus vers la stone fruit.
  - 2. Amarillo : Amarillo offre des notes d'agrumes et d'orange proches du Citra, mais avec un caractère floral et épicé plus marqué et moins de fruits tropicaux.
  - 3. McKenzie : McKenzie évoque le pamplemousse et le citron du Citra, mais s'en éloigne par des touches résineuses et herbacées de thym.
  - 4. Styrian Cardinal : Styrian Cardinal s'aligne sur les agrumes et la groseille à maquereau du Citra, tout en introduisant des notes florales de jasmin.
  - 5. Ariana : Ariana rejoint le Citra par ses arômes d'agrumes et de fruit de la passion, mais possède un taux de cohumulone nettement plus élevé.
  - 6. Hydra : Hydra reproduit le citron vert et la pêche du Citra, mais se distingue par une présence marquée de résine et de baies.
  - 7. Taiheke : Taiheke propose un pamplemousse et des agrumes dignes du Citra, mais intègre une composante épicée plus prononcée.
  - 8. Riwaka : Riwaka capture le fruit de la passion et les agrumes du Citra, mais avec une intensité globale plus faible due à un alpha plus bas.
  - 9. Mistral : Mistral partage la touche de fruit de la passion du Citra, mais diverge nettement avec des arômes de raisin et de vin blanc.
  - 10. Belma : Belma évoque le pamplemousse et les agrumes du Citra, mais se sépare de lui par des notes prononcées de fraise et de melon.
- Beer Maverick : Simcoe (moteur 103, option 1 51, IA 103) ; Mosaic (moteur 106, option 1 65, IA 106) ; Centennial (moteur 39, option 1 22, IA 39) ; Cascade (moteur 33, option 1 14, IA 33)

#### Motueka — dry hop

- Moteur : 1. Buzz Bullets · 2. Shaddock · 3. Cascade · 4. Southern Sublime · 5. Mandarina Bavaria · 6. Pilot · 7. Multihead · 8. Taiheke · 9. Yakima Gold · 10. Herald
- Option 1 : 1. Cascade · 2. Taiheke · 3. Riwaka · 4. Mandarina Bavaria · 5. Southern Cross · 6. Triskel · 7. Bravo · 8. Atlas · 9. HORT9909 · 10. Pilot
- IA : 1. Taiheke · 2. Mandarina Bavaria · 3. Styrian Cardinal · 4. Barbe Rouge · 5. Cascade · 6. Mistral · 7. Diamond Springs · 8. Wurttemberg · 9. Shaddock · 10. Multihead
  - 1. Taiheke : Taiheke partage les profils agrumes et citron vert du Motueka, avec un myrcène proche, mais possède un profil herbacé plus prononcé.
  - 2. Mandarina Bavaria : Mandarina Bavaria offre des notes de citron et fruits tropicaux proches du Motueka, mais diverge par sa dominance nette de mandarine.
  - 3. Styrian Cardinal : Styrian Cardinal s'accorde par ses notes de citron vert et fruits tropicaux, s'en séparant par des huiles totales plus abondantes.
  - 4. Barbe Rouge : Barbe Rouge apporte des agrumes et du citron vert rappelant le Motueka, mais se distingue par des notes marquées de baies rouges.
  - 5. Cascade : Cascade évoque le profil agrumes du Motueka avec un myrcène similaire, mais s'en éloigne par des notes résineuses et épicées plus intenses.
  - 6. Mistral : Mistral propose des fruits de la passion et des agrumes adaptés au dry hop, bien que ses notes vineuses l'éloignent du Motueka.
  - 7. Diamond Springs : Diamond Springs possède les notes de citron et agrumes du Motueka, mais ajoute une touche de menthe absente chez l'original.
  - 8. Wurttemberg : Wurttemberg partage les notes de citron vert et d'agrumes, mais se sépare du Motueka par des accents boisés et d'origan.
  - 9. Shaddock : Shaddock rappelle le citron vert du Motueka pour le dry hop, mais introduit des notes indésirables d'oignon et d'ail.
  - 10. Multihead : Multihead offre des fruits tropicaux et agrumes adaptés, mais son taux de cohumulone est plus élevé que celui du Motueka.
- Beer Maverick : Saaz (US) (moteur 291, option 1 289, IA 291) ; Sterling (moteur 198, option 1 112, IA 198)

#### Mosaic — dry hop

- Moteur : 1. Styrian Fox · 2. Idaho 7 · 3. Simcoe · 4. Galena · 5. Brewer's Gold (US) · 6. Hydra · 7. Styrian Eagle · 8. Strata · 9. Falconer's Flight · 10. Nugget
- Option 1 : 1. Idaho 7 · 2. Azacca · 3. Simcoe · 4. Mandarina Bavaria · 5. Zythos · 6. Hydra · 7. Sultana (Denali) · 8. Falconer's Flight · 9. Southern Cross · 10. Styrian Fox
- IA : 1. Simcoe · 2. Idaho 7 · 3. Hydra · 4. Strata · 5. Falconer's Flight · 6. Sultana (Denali) · 7. Taiheke · 8. Styrian Fox · 9. Southern Cross · 10. Ariana
  - 1. Simcoe : Simcoe partage le profil résineux, fruité et les notes de baies et agrumes du Mosaic, avec un alpha proche.
  - 2. Idaho 7 : Idaho 7 offre des notes tropicales et d'agrumes proches du Mosaic, bien que plus résineuses et moins florales.
  - 3. Hydra : Hydra apporte mandarine et fruits tropicaux comme le Mosaic, mais avec une charge d'huiles totales plus modérée.
  - 4. Strata : Strata combine fruits de la passion et pamplemousse rappelant le Mosaic, mais avec un profil herbacé plus marqué.
  - 5. Falconer's Flight : Falconer's Flight imite les fruits tropicaux et le pamplemousse du Mosaic, mais manque de sa complexité florale.
  - 6. Sultana (Denali) : Sultana propose ananas et agrumes dans l'esprit du Mosaic, avec une intensité aromatique plus puissante.
  - 7. Taiheke : Taiheke rappelle le profil agrumes et fruits tropicaux du Mosaic, mais avec des acides alpha plus faibles.
  - 8. Styrian Fox : Styrian Fox évoque fruits tropicaux et pin comme le Mosaic, mais présente un profil d'amertume plus herbacé.
  - 9. Southern Cross : Southern Cross partage agrumes et notes tropicales avec le Mosaic, mais s'en sépare par un profil résineux plus discret.
  - 10. Ariana : Ariana offre agrumes et fruits de la passion proches du Mosaic, mais sa cohumulone est nettement plus élevée.
- Beer Maverick : Citra (moteur 63, option 1 64, IA 63) ; Simcoe (moteur 3, option 1 3, IA 1)

#### Galaxy — dry hop

- Moteur : 1. Samba · 2. Zamba Blend · 3. Harlequin · 4. Nectaron · 5. Idaho Gem · 6. NZH-107 · 7. YQH-1380 · 8. Trident · 9. Tropica · 10. Southern Sublime
- Option 1 : 1. Harlequin · 2. Nectaron · 3. Vic Secret · 4. NZH-107 · 5. Strata · 6. Tango · 7. Sultana (Denali) · 8. Tropica · 9. Amarillo · 10. Sequoia Blend
- IA : 1. Nectaron · 2. Harlequin · 3. Solero · 4. NZH-107 · 5. Samba · 6. Zamba Blend · 7. YQH-1380 · 8. Tango · 9. Melba · 10. Trident
  - 1. Nectaron : Nectaron partage les profils fruit de la passion et ananas du Galaxy avec un myrcène proche, mais offre un côté pierreux plus net.
  - 2. Harlequin : Harlequin imite bien le fruit de la passion et la pêche du Galaxy, mais avec une teneur en farnésène nettement plus élevée.
  - 3. Solero : Solero apporte les notes tropicales et de fruit de la passion recherchées grâce à ses thiols puissants, malgré des alpha-acides plus modérés.
  - 4. NZH-107 : NZH-107 s'accorde sur le fruit de la passion et les agrumes du Galaxy avec un myrcène similaire, bien que l'ananas soit absent.
  - 5. Samba : Samba convient pour ses fruits tropicaux et son ananas proches du Galaxy, mais son profil penche plus vers la mangue.
  - 6. Zamba Blend : Zamba Blend évoque le Galaxy par ses fruits tropicaux, mais se distingue par une dominance marquée d'orange et de mangue.
  - 7. YQH-1380 : YQH-1380 reprend l'ananas et la pêche du Galaxy avec un myrcène élevé, mais ajoute une touche prononcée de citron vert.
  - 8. Tango : Tango offre une belle alternative fruit de la passion et ananas comme le Galaxy, mais possède des bêta-acides bien plus élevés.
  - 9. Melba : Melba rappelle le Galaxy par son fruit de la passion et ses agrumes, mais son usage purement aromatique est plus doux.
  - 10. Trident : Trident partage la palette fruit de la passion et agrumes du Galaxy, mais son profil aromatique global reste plus confus.
- Beer Maverick : Simcoe (moteur 43, option 1 37, IA 43) ; Citra (moteur 32, option 1 14, IA 32) ; Amarillo (moteur 66, option 1 9, IA 66)

#### Simcoe — dry hop

- Moteur : 1. Idaho 7 · 2. HBC 630 · 3. Hydra · 4. Mosaic · 5. Sabro · 6. Strata · 7. Talus · 8. XJA2/436 · 9. Zythos · 10. Newport
- Option 1 : 1. Idaho 7 · 2. Mandarina Bavaria · 3. Vic Secret · 4. Falconer's Flight 7CS · 5. Mosaic · 6. Sticklebract · 7. Zythos · 8. Falconer's Flight · 9. Palisade · 10. Hydra
- IA : 1. Zythos · 2. Falconer's Flight · 3. Idaho 7 · 4. Mosaic · 5. Strata · 6. Southern Cross · 7. Hydra · 8. Talus · 9. Vic Secret · 10. Galaxy
  - 1. Zythos : Zythos partage le profil agrumes et pin du Simcoe mais manque de complexité terreuse et de notes d'abricot.
  - 2. Falconer's Flight : Falconer's Flight imite bien le pamplemousse et le pin du Simcoe avec une intensité fruitée légèrement plus tropicale.
  - 3. Idaho 7 : Idaho 7 offre des notes résineuses et d'agrumes proches du Simcoe, mais avec plus de fruits tropicaux et de cassis.
  - 4. Mosaic : Mosaic se rapproche du Simcoe par son pin et ses agrumes, bien qu'il apporte des notes distinctes de myrtille.
  - 5. Strata : Strata combine le pamplemousse du Simcoe avec des touches herbacées, mais se sépare par un profil très dank.
  - 6. Southern Cross : Southern Cross évoque le pin et les agrumes du Simcoe mais se distingue par des notes plus nettes de citron.
  - 7. Hydra : Hydra présente des agrumes et une résine proches du Simcoe, tout en variant vers la pastèque et la pêche.
  - 8. Talus : Talus garde le pamplemousse et le pin du Simcoe mais introduit des notes florales et de crème inhabituelles.
  - 9. Vic Secret : Vic Secret partage le pin du Simcoe mais s'oriente fortement vers l'ananas et le fruit de la passion.
  - 10. Galaxy : Galaxy offre la puissance aromatique recherchée mais remplace le pin du Simcoe par une explosion de fruits de la passion.
- Beer Maverick : Summit (moteur 91, option 1 65, IA 91) ; Magnum (US) (moteur 216, option 1 170, IA 216) ; Amarillo (moteur 83, option 1 12, IA 83) ; Mosaic (moteur 4, option 1 5, IA 4) ; Cascade (moteur 51, option 1 38, IA 51) ; Centennial (moteur 96, option 1 77, IA 96) ; Citra (moteur 55, option 1 56, IA 55) ; Columbus (moteur 86, option 1 68, IA 86)

#### Saaz — dry hop

- Moteur : 1. Pacific Crest · 2. Tettnang (US) · 3. Aurum · 4. Styrian Golding · 5. Hallertau Tradition · 6. Sussex · 7. Spalter Select · 8. Aramis · 9. Marynka · 10. Strisselspalt
- Option 1 : 1. Aurum · 2. Spalt · 3. Saaz Late · 4. Celeia · 5. Pacific Crest · 6. Tettnang (US) · 7. Wild Loyalist · 8. Styrian Golding · 9. Strisselspalt · 10. Amethyst
- IA : 1. Saaz Late · 2. Saaz (US) · 3. Tettnang (US) · 4. Styrian Golding · 5. Celeia · 6. Spalter Select · 7. Hallertau Tradition · 8. Strisselspalt · 9. Aurum · 10. Pacific Crest
  - 1. Saaz Late : Saaz Late partage le profil terreux, herbacé et floral exact du Saaz, avec un taux de farnésène similaire garantissant un arôme noble identique.
  - 2. Saaz (US) : La version américaine du Saaz conserve l'esprit noble et terreux, bien que le farnésène soit légèrement inférieur et le myrcène plus direct.
  - 3. Tettnang (US) : Tettnang offre le même profil noble et épicé avec des notes d'herbe coupée, s'en rapprochant grandement malgré un farnésène un peu plus bas.
  - 4. Styrian Golding : Styrian Golding procure des notes terreuses, épicées et douces comparables, mais l'humulène est nettement plus élevé au détriment du farnésène.
  - 5. Celeia : Celeia se rapproche par son caractère noble, floral et épicé, tout en affichant un taux de farnésène très honorable et proche du modèle.
  - 6. Spalter Select : Spalter Select intègre beaucoup de farnésène et des notes herbacées proches, mais s'oriente plus nettement vers l'épicé et l'herbe coupée.
  - 7. Hallertau Tradition : Hallertau Tradition présente un profil noble et terreux avec un fort taux d'humulène, bien que le farnésène soit quasi absent.
  - 8. Strisselspalt : Strisselspalt possède des alpha bas et un profil floral et épicé séduisant, mais manque cruellement de farnésène par rapport au Saaz.
  - 9. Aurum : Aurum propose des notes florales, douces et herbacées congruentes, mais introduit des nuances fruitées et d'agrumes absentes chez le Saaz.
  - 10. Pacific Crest : Pacific Crest rappelle le caractère noble, terreux et floral, mais s'en éloigne par une dominante de myrcène plus haute et l'absence de farnésène.
- Beer Maverick : Saaz (US) (moteur 19, option 1 14, IA 2) ; Sterling (moteur 40, option 1 17, IA 40)

#### Cascade — dry hop

- Moteur : 1. Barbe Rouge · 2. Mandarina Bavaria · 3. Sasquatch · 4. Olympic · 5. Taiheke · 6. Buzz Bullets · 7. Herald · 8. HORT9909 · 9. Motueka · 10. Southern Cross
- Option 1 : 1. Taiheke · 2. Cluster · 3. Atlas · 4. Bravo · 5. Riwaka · 6. Brewer's Gold (US) · 7. Southern Cross · 8. Bullion · 9. Galena · 10. Zythos
- IA : 1. Ahtanum · 2. Tahoma · 3. Taiheke · 4. Zythos · 5. Mandarina Bavaria · 6. Herald · 7. Southern Cross · 8. Motueka · 9. Yakima Gold · 10. Sasquatch
  - 1. Ahtanum : Ahtanum partage le profil agrumes, pamplemousse et pin du Cascade, avec des notes florales proches mais un alpha un peu plus faible.
  - 2. Tahoma : Tahoma offre un profil très proche en dry hop avec des notes de citron, pamplemousse et pin, mais un myrcène plus élevé.
  - 3. Taiheke : Taiheke apporte les notes d'agrumes et de pamplemousse du Cascade, tout en ajoutant des nuances tropicales absentes chez l'original.
  - 4. Zythos : Zythos combine pamplemousse, agrumes et pin comme le Cascade, mais avec un alpha plus haut et un profil plus tropical.
  - 5. Mandarina Bavaria : Mandarina Bavaria partage le caractère agrumes du Cascade, mais se focalise sur la mandarine plutôt que sur le pamplemousse.
  - 6. Herald : Herald propose des notes d'orange et de pamplemousse proches du Cascade, mais avec une intensité d'huile un peu différente.
  - 7. Southern Cross : Southern Cross conserve les notes de pin et de citron du Cascade, mais avec une puissance aromatique et un alpha supérieurs.
  - 8. Motueka : Motueka apporte agrumes et citron vert avec des thiols intéressants, s'éloignant toutefois du pamplemousse classique du Cascade.
  - 9. Yakima Gold : Yakima Gold intègre pamplemousse et citron comme le Cascade, mais avec une huile totale plus faible et un usage plus doux.
  - 10. Sasquatch : Sasquatch évoque le citron et l'orange du Cascade, mais se distingue par des notes nettes de menthe en dry hop.
- Beer Maverick : Amarillo (moteur 108, option 1 48, IA 108) ; Centennial (moteur 51, option 1 14, IA 51) ; Ahtanum (moteur 17, option 1 31, IA 1) ; Summit (moteur 61, option 1 121, IA 61)

#### Idaho 7 — dry hop

- Moteur : 1. Simcoe · 2. Mosaic · 3. Styrian Fox · 4. Hydra · 5. HBC 630 · 6. Ariana · 7. Nugget · 8. Talus · 9. Sabro · 10. Strata
- Option 1 : 1. Simcoe · 2. Falconer's Flight · 3. Mosaic · 4. Azacca · 5. Amarillo · 6. Brewer's Gold (US) · 7. Hydra · 8. Zythos · 9. Cascade · 10. Bullion
- IA : 1. Mosaic · 2. Simcoe · 3. Ekuanot · 4. Zythos · 5. Hydra · 6. Falconer's Flight · 7. Talus · 8. Strata · 9. Bitter Gold · 10. HBC 630
  - 1. Mosaic : Mosaic partage les fruits tropicaux et les agrumes de l'Idaho 7, mais apporte des notes de myrtille absentes de l'original.
  - 2. Simcoe : Simcoe offre une résine et des agrumes proches de l'Idaho 7, tout en étant un peu plus terreux et moins fruité.
  - 3. Ekuanot : Ekuanot combine les agrumes et fruits tropicaux de l'Idaho 7, mais se distingue par des touches prononcées d'eucalyptus et de melon.
  - 4. Zythos : Zythos imite bien le profil agrumes et fruits tropicaux de l'Idaho 7 grâce à son assemblage, mais manque de complexité résineuse.
  - 5. Hydra : Hydra présente des notes d'agrumes et de fruits tropicaux similaires à l'Idaho 7, avec une charge fruitée plus axée sur la pêche.
  - 6. Falconer's Flight : Falconer's Flight reprend les notes de pamplemousse et fruits tropicaux de l'Idaho 7, mais s'avère plus floral et moins résineux.
  - 7. Talus : Talus partage le pamplemousse et les agrumes de l'Idaho 7, mais se démarque nettement par des notes florales et de crème.
  - 8. Strata : Strata apporte des fruits de la passion et des agrumes proches, mais son côté cannabis et dank s'éloigne du profil résineux.
  - 9. Bitter Gold : Bitter Gold offre des fruits tropicaux et des agrumes adaptés au dry hop, mais introduit des notes de poire inédites.
  - 10. HBC 630 : HBC 630 partage les fruits tropicaux de l'Idaho 7, mais penche vers des arômes de cerise et de bonbon très distincts.
- Beer Maverick : Azacca (moteur 98, option 1 4, IA 98) ; El Dorado (moteur 101, option 1 82, IA 101) ; Cashmere (moteur 154, option 1 181, IA 154) ; Citra (moteur 43, option 1 53, IA 43) ; Idaho Gem (moteur 105, option 1 250, IA 105) ; Amarillo (moteur 46, option 1 5, IA 46) ; Chinook (moteur 81, option 1 34, IA 81) ; Columbus (moteur 70, option 1 54, IA 70)

### Les cinq cas du brasseur (K1 à K5)

| cas | lecture | résultat |
|---|---|---|
| K1 · Stout « plus floral » | Suggérer, pas Substituer : hors du périmètre de ce banc | non applicable ici |
| K2 · résineux, stout contre lager | Suggérer (échelles de style) | non applicable ici |
| K3 · agrumes, IPA contre lager | Suggérer (échelles de style) | non applicable ici |
| K4 · Nelson Sauvin (vin blanc) | Hallertau Blanc dans les 5 premiers au dry hop | IA : rang 155 ; moteur : 155 ; option 1 : 2 → non tenu |
| K5 · Galaxy n'est pas Saaz | Saaz hors des 10 premiers de Galaxy et Galaxy hors des 10 premiers de Saaz, au dry hop | Saaz chez Galaxy : rang 223 ; Galaxy chez Saaz : rang 253 → tenu / tenu |

K1 à K3 portent sur Suggérer (visées de recette et échelles de style), pas sur le classement des substituts : l'IA de ce banc n'y touche pas. Ils restent à juger sur un essai de Suggérer.

### Durée, jetons, coût

- Durée par requête : médiane 1985 ms, p95 2827 ms, max 2827 ms ; limite de l'écran Substituer : 3 s au p95 → tenue.
- Jetons : entrée 3860 en moyenne (total 34743), sortie 548 en moyenne (total 4929), réflexion comprise.
- Coût estimé (tarifs de `geminiCosts.ts`, 1 USD = 1,25 CHF) : 0.0284 CHF pour 9 appels (9 chiffrés), soit 0.0032 CHF par usage.

## Comparaison sur les 9 cas communs : Réponses réelles : moteur-3.8 (2026-10-26) contre Réponses réelles : moteur-lite (2026-10-26)

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 9 | 6,9 % | 6,9 % | 22,2 % | 32 | 0,088 |
| option 1, hors ligne | 9 | 12,5 % | 16,2 % | 55,6 % | 9 | 0,180 |
| Réponses réelles : moteur-3.8 (2026-10-26) | 9 | 15,3 % | 15,3 % | 44,4 % | 32 | 0,345 |
| Réponses réelles : moteur-lite (2026-10-26) | 9 | 15,3 % | 15,3 % | 44,4 % | 32 | 0,317 |

Hallertau Blanc chez Nelson Sauvin (dry hop) : 155 contre 155.
