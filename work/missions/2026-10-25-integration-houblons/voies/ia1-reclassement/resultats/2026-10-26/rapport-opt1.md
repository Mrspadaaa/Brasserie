# Essai d'IA : re-classement des substituts (#181, voie ia1-reclassement)

Généré par `scripts/eval-hop/ia-reclassement.ts --rapport`. Invite v1, requêtes figées `requetes/requetes-opt1.json` (empreinte 0838c7a7abb3fcfa). Référence : substituts Beer Maverick (comme e1) ; le moteur et l'option 1 sont recalculés ici sur les mêmes cas.

## 0. Contrôle : le moteur seul et l'option 1, recalculés ici, contre e1

| mesure | MRR (ici / e1) | rappel@10 | rang médian | |
|---|---|---|---|---|
| moteur 60′ (217 houblons) | 0,118 / 0,118 | 9,9 % / 9,9 % | 36 / 36 | identique |
| moteur dry hop actif (217) | 0,121 / 0,121 | 10,9 % / 10,9 % | 27 / 27 | identique |
| option 1 λ = 0,25, arôme (217) | 0,202 / 0,202 | 17,5 % / 17,5 % | 14 / 14 | identique |
| rangs des substituts BM des 9 phares, deux moments | 74 / 74 rangs retrouvés | | | identique |

Le moteur et l'option 1 retrouvent à l'identique les chiffres publiés de e1 sur les 217 houblons : OUI.

## Réponses réelles : opt1-3.8 (2026-10-26)

9 cas, 9 réponses valides (100,0 %) ; modèle(s) observé(s) : gemini-3.8-flash. Une réponse invalide laisse le classement de départ (le repli) et pèse donc 0 dans le gain.

### Tous les cas (60′ et dry hop)

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 9 | 6,9 % | 6,9 % | 22,2 % | 32 | 0,088 |
| option 1 (mots, λ = 0,25), hors ligne | 9 | 12,5 % | 16,2 % | 55,6 % | 9 | 0,180 |
| IA (sur l'option 1) | 9 | 28,7 % | 31,5 % | 77,8 % | 2 | 0,563 |

IA contre moteur : le premier substitut monte dans 9 cas, descend dans 0, reste dans 0 ; écart de MRR +0,475 (intervalle à 95 % : 0,257 à 0,720).
IA contre option 1 : le premier substitut monte dans 6 cas, descend dans 1, reste dans 2 ; écart de MRR +0,383 (intervalle à 95 % : 0,167 à 0,628).

### Échantillon (graine 181, 30 premiers) — les deux moments

(aucun cas)

### Les 9 houblons phares — les deux moments

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 9 | 6,9 % | 6,9 % | 22,2 % | 32 | 0,088 |
| option 1 (mots, λ = 0,25), hors ligne | 9 | 12,5 % | 16,2 % | 55,6 % | 9 | 0,180 |
| IA (sur l'option 1) | 9 | 28,7 % | 31,5 % | 77,8 % | 2 | 0,563 |

IA contre moteur : le premier substitut monte dans 9 cas, descend dans 0, reste dans 0 ; écart de MRR +0,475 (intervalle à 95 % : 0,257 à 0,720).
IA contre option 1 : le premier substitut monte dans 6 cas, descend dans 1, reste dans 2 ; écart de MRR +0,383 (intervalle à 95 % : 0,167 à 0,628).

### Dry hop seulement (tous les cas)

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 9 | 6,9 % | 6,9 % | 22,2 % | 32 | 0,088 |
| option 1 (mots, λ = 0,25), hors ligne | 9 | 12,5 % | 16,2 % | 55,6 % | 9 | 0,180 |
| IA (sur l'option 1) | 9 | 28,7 % | 31,5 % | 77,8 % | 2 | 0,563 |

IA contre moteur : le premier substitut monte dans 9 cas, descend dans 0, reste dans 0 ; écart de MRR +0,475 (intervalle à 95 % : 0,257 à 0,720).
IA contre option 1 : le premier substitut monte dans 6 cas, descend dans 1, reste dans 2 ; écart de MRR +0,383 (intervalle à 95 % : 0,167 à 0,628).

### 60′ seulement (tous les cas) : l'option 1 ne change rien à 60′

(aucun cas)

**Plafond de la fenêtre** : un substitut de référence est dans les 20 candidats pour 8 cas sur 9 ; une IA parfaite qui le mettrait premier plafonne le MRR à 0,889. Ce que le modèle ne voit pas, il ne peut pas le remonter.

**Seuil pour continuer** (+0,05 de MRR ou +5 points de rappel@10 sur le moteur seul, **et** Hallertau Blanc dans les 5 premiers de Nelson Sauvin au dry hop) : gain de MRR +0,475, de rappel@10 +24,6 point(s) sur tous les cas → chiffres atteints ; Hallertau Blanc au rang 1 chez l'IA (moteur : 155, option 1 : 2) → tenu. **Seuil : ATTEINT.** Écart de l'IA à l'option 1 : MRR +0,383, rappel@10 +15,3 point(s).

### Les 9 phares : les 10 premiers de chaque système

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

### Les cinq cas du brasseur (K1 à K5)

| cas | lecture | résultat |
|---|---|---|
| K1 · Stout « plus floral » | Suggérer, pas Substituer : hors du périmètre de ce banc | non applicable ici |
| K2 · résineux, stout contre lager | Suggérer (échelles de style) | non applicable ici |
| K3 · agrumes, IPA contre lager | Suggérer (échelles de style) | non applicable ici |
| K4 · Nelson Sauvin (vin blanc) | Hallertau Blanc dans les 5 premiers au dry hop | IA : rang 1 ; moteur : 155 ; option 1 : 2 → tenu |
| K5 · Galaxy n'est pas Saaz | Saaz hors des 10 premiers de Galaxy et Galaxy hors des 10 premiers de Saaz, au dry hop | Saaz chez Galaxy : rang 211 ; Galaxy chez Saaz : rang 231 → tenu / tenu |

K1 à K3 portent sur Suggérer (visées de recette et échelles de style), pas sur le classement des substituts : l'IA de ce banc n'y touche pas. Ils restent à juger sur un essai de Suggérer.

### Durée, jetons, coût

- Durée par requête : médiane 6535 ms, p95 7440 ms, max 7440 ms ; limite de l'écran Substituer : 3 s au p95 → NON tenue.
- Jetons : entrée 3946 en moyenne (total 35510), sortie 554 en moyenne (total 4982), réflexion comprise.
- Coût estimé (tarifs de `geminiCosts.ts`, 1 USD = 1,25 CHF) : 0.1133 CHF pour 9 appels (9 chiffrés), soit 0.0126 CHF par usage.

## Réponses réelles : opt1-lite (2026-10-26)

4 cas, 4 réponses valides (100,0 %) ; modèle(s) observé(s) : gemini-3.5-flash-lite. Une réponse invalide laisse le classement de départ (le repli) et pèse donc 0 dans le gain.

### Tous les cas (60′ et dry hop)

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 4 | 12,5 % | 12,5 % | 25,0 % | 61 | 0,095 |
| option 1 (mots, λ = 0,25), hors ligne | 4 | 18,8 % | 18,8 % | 50,0 % | 8,5 | 0,228 |
| IA (sur l'option 1) | 4 | 18,8 % | 18,8 % | 50,0 % | 9 | 0,517 |

IA contre moteur : le premier substitut monte dans 4 cas, descend dans 0, reste dans 0 ; écart de MRR +0,422 (intervalle à 95 % : 0,016 à 0,828).
IA contre option 1 : le premier substitut monte dans 2 cas, descend dans 1, reste dans 1 ; écart de MRR +0,289 (intervalle à 95 % : -0,006 à 0,583).

### Échantillon (graine 181, 30 premiers) — les deux moments

(aucun cas)

### Les 9 houblons phares — les deux moments

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 4 | 12,5 % | 12,5 % | 25,0 % | 61 | 0,095 |
| option 1 (mots, λ = 0,25), hors ligne | 4 | 18,8 % | 18,8 % | 50,0 % | 8,5 | 0,228 |
| IA (sur l'option 1) | 4 | 18,8 % | 18,8 % | 50,0 % | 9 | 0,517 |

IA contre moteur : le premier substitut monte dans 4 cas, descend dans 0, reste dans 0 ; écart de MRR +0,422 (intervalle à 95 % : 0,016 à 0,828).
IA contre option 1 : le premier substitut monte dans 2 cas, descend dans 1, reste dans 1 ; écart de MRR +0,289 (intervalle à 95 % : -0,006 à 0,583).

### Dry hop seulement (tous les cas)

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 4 | 12,5 % | 12,5 % | 25,0 % | 61 | 0,095 |
| option 1 (mots, λ = 0,25), hors ligne | 4 | 18,8 % | 18,8 % | 50,0 % | 8,5 | 0,228 |
| IA (sur l'option 1) | 4 | 18,8 % | 18,8 % | 50,0 % | 9 | 0,517 |

IA contre moteur : le premier substitut monte dans 4 cas, descend dans 0, reste dans 0 ; écart de MRR +0,422 (intervalle à 95 % : 0,016 à 0,828).
IA contre option 1 : le premier substitut monte dans 2 cas, descend dans 1, reste dans 1 ; écart de MRR +0,289 (intervalle à 95 % : -0,006 à 0,583).

### 60′ seulement (tous les cas) : l'option 1 ne change rien à 60′

(aucun cas)

**Plafond de la fenêtre** : un substitut de référence est dans les 20 candidats pour 3 cas sur 4 ; une IA parfaite qui le mettrait premier plafonne le MRR à 0,751. Ce que le modèle ne voit pas, il ne peut pas le remonter.

**Seuil pour continuer** (+0,05 de MRR ou +5 points de rappel@10 sur le moteur seul, **et** Hallertau Blanc dans les 5 premiers de Nelson Sauvin au dry hop) : gain de MRR +0,422, de rappel@10 +6,3 point(s) sur tous les cas → chiffres atteints ; Hallertau Blanc au rang 1 chez l'IA (moteur : 155, option 1 : 2) → tenu. **Seuil : ATTEINT.** Écart de l'IA à l'option 1 : MRR +0,289, rappel@10 +0,0 point(s).

### Les 9 phares : les 10 premiers de chaque système

#### Nelson Sauvin — dry hop

- Moteur : 1. Boomerang · 2. Herkules · 3. Phoenix · 4. Kazbek · 5. Marynka · 6. Pacific Jade · 7. Summit · 8. CTZ · 9. Godiva · 10. Tomahawk
- Option 1 : 1. Herkules · 2. Hallertau Blanc · 3. Godiva · 4. Sládek · 5. Admiral · 6. Cashmere · 7. Jarrylo · 8. Phoenix · 9. Triumph · 10. Galena
- IA : 1. Hallertau Blanc · 2. African Queen · 3. Godiva · 4. Galena · 5. Jarrylo · 6. Cashmere · 7. Summit · 8. Cascade · 9. Sládek · 10. Hallertau Taurus
  - 1. Hallertau Blanc : Hallertau Blanc partage la groseille et le vin blanc, mais son profil myrcène est plus haut et l'humulène absent.
  - 2. African Queen : African Queen offre la groseille et une classe thiol forte, mais ajoute des notes dank et épicées plus marquées.
  - 3. Godiva : Godiva évoque le vin blanc et la groseille, mais ses acides alpha sont plus faibles et les huiles peu documentées.
  - 4. Galena : Galena possède la groseille à maquereau recherchée, mais son usage aroma cache un profil de cohumulone nettement plus élevé.
  - 5. Jarrylo : Jarrylo intègre des notes de vin blanc, mais son dosage en huiles totales est bien plus lourd et fruité.
  - 6. Cashmere : Cashmere apporte une complexité fruitée et noix de coco, mais s'éloigne du profil typique de raisin du Nelson.
  - 7. Summit : Summit possède une classe thiol forte, mais ses arômes orientés agrumes et oignon s'éloignent du vin blanc.
  - 8. Cascade : Cascade affiche une classe thiol forte et un linalol proche, mais ses notes de pamplemousse dominent le raisin.
  - 9. Sládek : Sládek offre un profil fruité intéressant pour un usage aroma, mais manque de la finesse thiolée du sauvignon.
  - 10. Hallertau Taurus : Hallertau Taurus présente un fort taux de linalol, mais ses arômes de chocolat et curry s'opposent au Nelson.
- Beer Maverick : Hallertau Blanc (moteur 155, option 1 2, IA 1) ; Enigma (moteur 244, option 1 92, IA 92) ; Motueka (moteur 89, option 1 130, IA 130) ; Riwaka (moteur 206, option 1 204, IA 204)

#### Citra — dry hop

- Moteur : 1. Bitter Gold · 2. Hydra · 3. Mistral · 4. McKenzie · 5. Palisade · 6. Southern Sublime · 7. Sabro · 8. Amarillo · 9. Styrian Cardinal · 10. Taiheke
- Option 1 : 1. NZH-107 · 2. Nectaron · 3. Riwaka · 4. Sitiva Blend · 5. Taiheke · 6. Amarillo · 7. Harlequin · 8. YQH-1380 · 9. HBC 586 · 10. Mistral
- IA : 1. Nectaron · 2. Galaxy · 3. NZH-107 · 4. Amarillo · 5. Hydra · 6. Riwaka · 7. Styrian Cardinal · 8. HBC 586 · 9. Falconer's Flight · 10. Mistral
  - 1. Nectaron : Nectaron partage les notes de pêche, agrumes et fruits tropicaux du Citra avec un profil aromatique très proche.
  - 2. Galaxy : Galaxy offre une intensité de fruit de la passion et d'agrumes similaire au Citra pour le dry hop.
  - 3. NZH-107 : NZH-107 s'approche du Citra par ses notes d'agrumes et de fruit de la passion avec des huiles comparables.
  - 4. Amarillo : Amarillo complète bien le profil agrumes et pêche du Citra malgré un humulène un peu plus élevé.
  - 5. Hydra : Hydra apporte des touches de mandarine, pêche et agrumes qui rappellent la complexité aromatique du Citra.
  - 6. Riwaka : Riwaka possède des arômes de pamplemousse et fruits tropicaux proches, mais avec un alpha inférieur.
  - 7. Styrian Cardinal : Styrian Cardinal intègre groseille à maquereau et agrumes, rejoignant les notes spécifiques du Citra.
  - 8. HBC 586 : HBC 586 se rapproche par la mangue et les agrumes, mais son alpha est nettement plus puissant.
  - 9. Falconer's Flight : Falconer's Flight combine pamplemousse et fruits tropicaux, s'alignant bien sur l'esprit aromatique du Citra.
  - 10. Mistral : Mistral propose melon et agrumes, offrant une alternative originale mais légèrement éloignée du Citra pur.
- Beer Maverick : Simcoe (moteur 103, option 1 51, IA 51) ; Mosaic (moteur 106, option 1 65, IA 65) ; Centennial (moteur 39, option 1 22, IA 22) ; Cascade (moteur 33, option 1 14, IA 17)

#### Motueka — dry hop

- Moteur : 1. Buzz Bullets · 2. Shaddock · 3. Cascade · 4. Southern Sublime · 5. Mandarina Bavaria · 6. Pilot · 7. Multihead · 8. Taiheke · 9. Yakima Gold · 10. Herald
- Option 1 : 1. Cascade · 2. Taiheke · 3. Riwaka · 4. Mandarina Bavaria · 5. Southern Cross · 6. Triskel · 7. Bravo · 8. Atlas · 9. HORT9909 · 10. Pilot
- IA : 1. Taiheke · 2. Riwaka · 3. Cascade · 4. Mandarina Bavaria · 5. Southern Cross · 6. Barbe Rouge · 7. Atlas · 8. HORT9909 · 9. Meridian · 10. Falconer's Flight
  - 1. Taiheke : Taiheke partage les origines neozelandaises et le profil citron vert du Motueka, mais offre plus de pamplemousse.
  - 2. Riwaka : Riwaka apporte une touche tropicale intense proche du Motueka, bien que moins axee sur le mojito.
  - 3. Cascade : Cascade imite bien les agrumes du Motueka grace au myrcene, mais vire davantage vers le pin.
  - 4. Mandarina Bavaria : Mandarina Bavaria offre des notes citriques similaires au Motueka, mais marque une derive vers la mandarine.
  - 5. Southern Cross : Southern Cross possede le citron vert du Motueka avec un alpha eleve, mais ajoute des notes de pin.
  - 6. Barbe Rouge : Barbe Rouge propose des agrumes et du citron vert proches du Motueka, mais avec des baies en plus.
  - 7. Atlas : Atlas reprend le citron vert et le cote floral du Motueka, mais integre une composante pineuse.
  - 8. HORT9909 : HORT9909 partage les notes de citron vert et d'agrumes du Motueka, mais se montre plus epice.
  - 9. Meridian : Meridian possede des agrumes et du citron rappelant le Motueka, avec une pointe de menthe verte.
  - 10. Falconer's Flight : Falconer's Flight livre des fruits tropicaux et du citron proches du Motueka, mais avec du pin.
- Beer Maverick : Saaz (US) (moteur 291, option 1 289, IA 289) ; Sterling (moteur 198, option 1 112, IA 112)

#### Mosaic — dry hop

- Moteur : 1. Styrian Fox · 2. Idaho 7 · 3. Simcoe · 4. Galena · 5. Brewer's Gold (US) · 6. Hydra · 7. Styrian Eagle · 8. Strata · 9. Falconer's Flight · 10. Nugget
- Option 1 : 1. Idaho 7 · 2. Azacca · 3. Simcoe · 4. Mandarina Bavaria · 5. Zythos · 6. Hydra · 7. Sultana (Denali) · 8. Falconer's Flight · 9. Southern Cross · 10. Styrian Fox
- IA : 1. Simcoe · 2. Idaho 7 · 3. Azacca · 4. Zythos · 5. Falconer's Flight · 6. Hydra · 7. Sultana (Denali) · 8. Mackinac · 9. Centennial · 10. Mandarina Bavaria
  - 1. Simcoe : Simcoe partage le profil fruité et pin, s'en éloignant par moins de fruits tropicaux.
  - 2. Idaho 7 : Idaho 7 apporte des fruits tropicaux proches de Mosaic, mais avec plus de résine.
  - 3. Azacca : Azacca offre mangue et papaye comme Mosaic, mais avec une touche citronnée plus marquée.
  - 4. Zythos : Zythos combine agrumes et fruits tropicaux, s'éloignant par son côté floral prononcé.
  - 5. Falconer's Flight : Falconer's Flight imite le pamplemousse et les fruits tropicaux, avec moins de nuances terreuses.
  - 6. Hydra : Hydra brille par ses agrumes et fruits tropicaux, différant par des notes de pêche.
  - 7. Sultana (Denali) : Sultana partage l'ananas et les fruits tropicaux, mais avec une intensité d'huile supérieure.
  - 8. Mackinac : Mackinac propose fruits tropicaux et papaye, s'écartant par son poivre noir distinctif.
  - 9. Centennial : Centennial offre pin et agrumes proches, mais manque de complexité tropicale.
  - 10. Mandarina Bavaria : Mandarina Bavaria partage les agrumes, mais se focalise trop sur la mandarine.
- Beer Maverick : Citra (moteur 63, option 1 64, IA 64) ; Simcoe (moteur 3, option 1 3, IA 1)

### Les cinq cas du brasseur (K1 à K5)

| cas | lecture | résultat |
|---|---|---|
| K1 · Stout « plus floral » | Suggérer, pas Substituer : hors du périmètre de ce banc | non applicable ici |
| K2 · résineux, stout contre lager | Suggérer (échelles de style) | non applicable ici |
| K3 · agrumes, IPA contre lager | Suggérer (échelles de style) | non applicable ici |
| K4 · Nelson Sauvin (vin blanc) | Hallertau Blanc dans les 5 premiers au dry hop | IA : rang 1 ; moteur : 155 ; option 1 : 2 → tenu |
| K5 · Galaxy n'est pas Saaz | Saaz hors des 10 premiers de Galaxy et Galaxy hors des 10 premiers de Saaz, au dry hop | Saaz chez Galaxy : rang – ; Galaxy chez Saaz : rang – → tenu / tenu |

K1 à K3 portent sur Suggérer (visées de recette et échelles de style), pas sur le classement des substituts : l'IA de ce banc n'y touche pas. Ils restent à juger sur un essai de Suggérer.

### Durée, jetons, coût

- Durée par requête : médiane 1746 ms, p95 2453 ms, max 2453 ms ; limite de l'écran Substituer : 3 s au p95 → tenue.
- Jetons : entrée 3977 en moyenne (total 15909), sortie 485 en moyenne (total 1941), réflexion comprise.
- Coût estimé (tarifs de `geminiCosts.ts`, 1 USD = 1,25 CHF) : 0.0120 CHF pour 4 appels (4 chiffrés), soit 0.0030 CHF par usage.

## Comparaison sur les 4 cas communs : Réponses réelles : opt1-3.8 (2026-10-26) contre Réponses réelles : opt1-lite (2026-10-26)

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 4 | 12,5 % | 12,5 % | 25,0 % | 61 | 0,095 |
| option 1, hors ligne | 4 | 18,8 % | 18,8 % | 50,0 % | 8,5 | 0,228 |
| Réponses réelles : opt1-3.8 (2026-10-26) | 4 | 18,8 % | 18,8 % | 50,0 % | 9 | 0,517 |
| Réponses réelles : opt1-lite (2026-10-26) | 4 | 18,8 % | 18,8 % | 50,0 % | 9 | 0,517 |

Hallertau Blanc chez Nelson Sauvin (dry hop) : 1 contre 1.
