# Essai d'IA : re-classement des substituts (#181, voie ia1-reclassement) — PASSE SIMULÉE (aucun appel réel)

Généré par `scripts/eval-hop/ia-reclassement.ts --rapport`. Invite v1, requêtes figées `requetes/requetes-moteur.json` (empreinte 0dfecaf4cfa656bb). Référence : substituts Beer Maverick (comme e1) ; le moteur et l'option 1 sont recalculés ici sur les mêmes cas.

## 0. Contrôle : le moteur seul et l'option 1, recalculés ici, contre e1

| mesure | MRR (ici / e1) | rappel@10 | rang médian | |
|---|---|---|---|---|
| moteur 60′ (217 houblons) | 0,118 / 0,118 | 9,9 % / 9,9 % | 36 / 36 | identique |
| moteur dry hop actif (217) | 0,121 / 0,121 | 10,9 % / 10,9 % | 27 / 27 | identique |
| option 1 λ = 0,25, arôme (217) | 0,202 / 0,202 | 17,5 % / 17,5 % | 14 / 14 | identique |
| rangs des substituts BM des 9 phares, deux moments | 74 / 74 rangs retrouvés | | | identique |

Le moteur et l'option 1 retrouvent à l'identique les chiffres publiés de e1 sur les 217 houblons : OUI.

## Passe simulée (identite)

78 cas, 78 réponses valides (100,0 %) ; modèle(s) observé(s) : gemini-3.8-flash. Une réponse invalide laisse le classement de départ (le repli) et pèse donc 0 dans le gain.

### Tous les cas (60′ et dry hop)

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 78 | 5,7 % | 7,9 % | 20,5 % | 38 | 0,079 |
| option 1 (mots, λ = 0,25), hors ligne | 78 | 6,7 % | 9,6 % | 25,6 % | 28 | 0,106 |
| IA (sur le moteur) | 78 | 5,7 % | 7,9 % | 20,5 % | 38 | 0,079 |

### Échantillon (graine 181, 30 premiers) — les deux moments

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 60 | 6,4 % | 9,3 % | 23,3 % | 37,5 | 0,086 |
| option 1 (mots, λ = 0,25), hors ligne | 60 | 6,9 % | 10,1 % | 25,0 % | 31,5 | 0,107 |
| IA (sur le moteur) | 60 | 6,4 % | 9,3 % | 23,3 % | 37,5 | 0,086 |

### Les 9 houblons phares — les deux moments

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 18 | 3,5 % | 3,5 % | 11,1 % | 40 | 0,056 |
| option 1 (mots, λ = 0,25), hors ligne | 18 | 6,3 % | 8,1 % | 27,8 % | 21,5 | 0,102 |
| IA (sur le moteur) | 18 | 3,5 % | 3,5 % | 11,1 % | 40 | 0,056 |

### Dry hop seulement (tous les cas)

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 39 | 7,2 % | 10,8 % | 25,6 % | 26 | 0,088 |
| option 1 (mots, λ = 0,25), hors ligne | 39 | 9,3 % | 14,2 % | 35,9 % | 14 | 0,141 |
| IA (sur le moteur) | 39 | 7,2 % | 10,8 % | 25,6 % | 26 | 0,088 |

### 60′ seulement (tous les cas) : l'option 1 ne change rien à 60′

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 39 | 4,1 % | 5,0 % | 15,4 % | 47 | 0,070 |
| option 1 (mots, λ = 0,25), hors ligne | 39 | 4,1 % | 5,0 % | 15,4 % | 47 | 0,070 |
| IA (sur le moteur) | 39 | 4,1 % | 5,0 % | 15,4 % | 47 | 0,070 |

**Plafond de la fenêtre** : un substitut de référence est dans les 20 candidats pour 25 cas sur 78 ; une IA parfaite qui le mettrait premier plafonne le MRR à 0,333. Ce que le modèle ne voit pas, il ne peut pas le remonter.

**Seuil pour continuer** (+0,05 de MRR ou +5 points de rappel@10 sur le moteur seul, **et** Hallertau Blanc dans les 5 premiers de Nelson Sauvin au dry hop) : gain de MRR +0,000, de rappel@10 +0,0 point(s) sur tous les cas → chiffres non atteints ; Hallertau Blanc au rang 155 chez l'IA (moteur : 155, option 1 : 2) → non tenu. **Seuil : NON ATTEINT.** Écart de l'IA à l'option 1 : MRR -0,027, rappel@10 -1,7 point(s).

### Les 9 phares : les 10 premiers de chaque système

#### Nelson Sauvin — dry hop

- Moteur : 1. Boomerang · 2. Herkules · 3. Phoenix · 4. Kazbek · 5. Marynka · 6. Pacific Jade · 7. Summit · 8. CTZ · 9. Godiva · 10. Tomahawk
- Option 1 : 1. Herkules · 2. Hallertau Blanc · 3. Godiva · 4. Sládek · 5. Admiral · 6. Cashmere · 7. Jarrylo · 8. Phoenix · 9. Triumph · 10. Galena
- IA : 1. Boomerang · 2. Herkules · 3. Phoenix · 4. Kazbek · 5. Marynka · 6. Pacific Jade · 7. Summit · 8. CTZ · 9. Godiva · 10. Tomahawk
  - 1. Boomerang : Simulé : ordre du moteur.
  - 2. Herkules : Simulé : ordre du moteur.
  - 3. Phoenix : Simulé : ordre du moteur.
  - 4. Kazbek : Simulé : ordre du moteur.
  - 5. Marynka : Simulé : ordre du moteur.
  - 6. Pacific Jade : Simulé : ordre du moteur.
  - 7. Summit : Simulé : ordre du moteur.
  - 8. CTZ : Simulé : ordre du moteur.
  - 9. Godiva : Simulé : ordre du moteur.
  - 10. Tomahawk : Simulé : ordre du moteur.
- Beer Maverick : Hallertau Blanc (moteur 155, option 1 2, IA 155) ; Enigma (moteur 244, option 1 92, IA 244) ; Motueka (moteur 89, option 1 130, IA 89) ; Riwaka (moteur 206, option 1 204, IA 206)

#### Nelson Sauvin — 60′

- Moteur : 1. Boomerang · 2. Herkules · 3. Pacific Jade · 4. Satus · 5. Gaia · 6. Herald · 7. Yeoman · 8. Hallertau Taurus · 9. Jarrylo · 10. Tomahawk
- IA : 1. Boomerang · 2. Herkules · 3. Pacific Jade · 4. Satus · 5. Gaia · 6. Herald · 7. Yeoman · 8. Hallertau Taurus · 9. Jarrylo · 10. Tomahawk
  - 1. Boomerang : Simulé : ordre du moteur.
  - 2. Herkules : Simulé : ordre du moteur.
  - 3. Pacific Jade : Simulé : ordre du moteur.
  - 4. Satus : Simulé : ordre du moteur.
  - 5. Gaia : Simulé : ordre du moteur.
  - 6. Herald : Simulé : ordre du moteur.
  - 7. Yeoman : Simulé : ordre du moteur.
  - 8. Hallertau Taurus : Simulé : ordre du moteur.
  - 9. Jarrylo : Simulé : ordre du moteur.
  - 10. Tomahawk : Simulé : ordre du moteur.
- Beer Maverick : Hallertau Blanc (moteur 125, IA 125) ; Enigma (moteur 95, IA 95) ; Motueka (moteur 163, IA 163) ; Riwaka (moteur 250, IA 250)

#### Citra — dry hop

- Moteur : 1. Bitter Gold · 2. Hydra · 3. Mistral · 4. McKenzie · 5. Palisade · 6. Southern Sublime · 7. Sabro · 8. Amarillo · 9. Styrian Cardinal · 10. Taiheke
- Option 1 : 1. NZH-107 · 2. Nectaron · 3. Riwaka · 4. Sitiva Blend · 5. Taiheke · 6. Amarillo · 7. Harlequin · 8. YQH-1380 · 9. HBC 586 · 10. Mistral
- IA : 1. Bitter Gold · 2. Hydra · 3. Mistral · 4. McKenzie · 5. Palisade · 6. Southern Sublime · 7. Sabro · 8. Amarillo · 9. Styrian Cardinal · 10. Taiheke
  - 1. Bitter Gold : Simulé : ordre du moteur.
  - 2. Hydra : Simulé : ordre du moteur.
  - 3. Mistral : Simulé : ordre du moteur.
  - 4. McKenzie : Simulé : ordre du moteur.
  - 5. Palisade : Simulé : ordre du moteur.
  - 6. Southern Sublime : Simulé : ordre du moteur.
  - 7. Sabro : Simulé : ordre du moteur.
  - 8. Amarillo : Simulé : ordre du moteur.
  - 9. Styrian Cardinal : Simulé : ordre du moteur.
  - 10. Taiheke : Simulé : ordre du moteur.
- Beer Maverick : Simcoe (moteur 103, option 1 51, IA 103) ; Mosaic (moteur 106, option 1 65, IA 106) ; Centennial (moteur 39, option 1 22, IA 39) ; Cascade (moteur 33, option 1 14, IA 33)

#### Citra — 60′

- Moteur : 1. Trident · 2. Bravo · 3. Nectaron · 4. Caliente · 5. Loral · 6. Southern Sublime · 7. Styrian Cardinal · 8. Petoskey · 9. Styrian Wolf · 10. Yeoman
- IA : 1. Trident · 2. Bravo · 3. Nectaron · 4. Caliente · 5. Loral · 6. Southern Sublime · 7. Styrian Cardinal · 8. Petoskey · 9. Styrian Wolf · 10. Yeoman
  - 1. Trident : Simulé : ordre du moteur.
  - 2. Bravo : Simulé : ordre du moteur.
  - 3. Nectaron : Simulé : ordre du moteur.
  - 4. Caliente : Simulé : ordre du moteur.
  - 5. Loral : Simulé : ordre du moteur.
  - 6. Southern Sublime : Simulé : ordre du moteur.
  - 7. Styrian Cardinal : Simulé : ordre du moteur.
  - 8. Petoskey : Simulé : ordre du moteur.
  - 9. Styrian Wolf : Simulé : ordre du moteur.
  - 10. Yeoman : Simulé : ordre du moteur.
- Beer Maverick : Simcoe (moteur 55, IA 55) ; Mosaic (moteur 37, IA 37) ; Centennial (moteur 49, IA 49) ; Cascade (moteur 163, IA 163)

#### Motueka — dry hop

- Moteur : 1. Buzz Bullets · 2. Shaddock · 3. Cascade · 4. Southern Sublime · 5. Mandarina Bavaria · 6. Pilot · 7. Multihead · 8. Taiheke · 9. Yakima Gold · 10. Herald
- Option 1 : 1. Cascade · 2. Taiheke · 3. Riwaka · 4. Mandarina Bavaria · 5. Southern Cross · 6. Triskel · 7. Bravo · 8. Atlas · 9. HORT9909 · 10. Pilot
- IA : 1. Buzz Bullets · 2. Shaddock · 3. Cascade · 4. Southern Sublime · 5. Mandarina Bavaria · 6. Pilot · 7. Multihead · 8. Taiheke · 9. Yakima Gold · 10. Herald
  - 1. Buzz Bullets : Simulé : ordre du moteur.
  - 2. Shaddock : Simulé : ordre du moteur.
  - 3. Cascade : Simulé : ordre du moteur.
  - 4. Southern Sublime : Simulé : ordre du moteur.
  - 5. Mandarina Bavaria : Simulé : ordre du moteur.
  - 6. Pilot : Simulé : ordre du moteur.
  - 7. Multihead : Simulé : ordre du moteur.
  - 8. Taiheke : Simulé : ordre du moteur.
  - 9. Yakima Gold : Simulé : ordre du moteur.
  - 10. Herald : Simulé : ordre du moteur.
- Beer Maverick : Saaz (US) (moteur 291, option 1 289, IA 291) ; Sterling (moteur 198, option 1 112, IA 198)

#### Motueka — 60′

- Moteur : 1. Vienna Gold · 2. Zula · 3. Buzz Bullets · 4. Petoskey · 5. Trident · 6. Arcadian · 7. Solero · 8. NZH-107 · 9. Samba · 10. Ariana
- IA : 1. Vienna Gold · 2. Zula · 3. Buzz Bullets · 4. Petoskey · 5. Trident · 6. Arcadian · 7. Solero · 8. NZH-107 · 9. Samba · 10. Ariana
  - 1. Vienna Gold : Simulé : ordre du moteur.
  - 2. Zula : Simulé : ordre du moteur.
  - 3. Buzz Bullets : Simulé : ordre du moteur.
  - 4. Petoskey : Simulé : ordre du moteur.
  - 5. Trident : Simulé : ordre du moteur.
  - 6. Arcadian : Simulé : ordre du moteur.
  - 7. Solero : Simulé : ordre du moteur.
  - 8. NZH-107 : Simulé : ordre du moteur.
  - 9. Samba : Simulé : ordre du moteur.
  - 10. Ariana : Simulé : ordre du moteur.
- Beer Maverick : Saaz (US) (moteur 292, IA 292) ; Sterling (moteur 87, IA 87)

#### Mosaic — dry hop

- Moteur : 1. Styrian Fox · 2. Idaho 7 · 3. Simcoe · 4. Galena · 5. Brewer's Gold (US) · 6. Hydra · 7. Styrian Eagle · 8. Strata · 9. Falconer's Flight · 10. Nugget
- Option 1 : 1. Idaho 7 · 2. Azacca · 3. Simcoe · 4. Mandarina Bavaria · 5. Zythos · 6. Hydra · 7. Sultana (Denali) · 8. Falconer's Flight · 9. Southern Cross · 10. Styrian Fox
- IA : 1. Styrian Fox · 2. Idaho 7 · 3. Simcoe · 4. Galena · 5. Brewer's Gold (US) · 6. Hydra · 7. Styrian Eagle · 8. Strata · 9. Falconer's Flight · 10. Nugget
  - 1. Styrian Fox : Simulé : ordre du moteur.
  - 2. Idaho 7 : Simulé : ordre du moteur.
  - 3. Simcoe : Simulé : ordre du moteur.
  - 4. Galena : Simulé : ordre du moteur.
  - 5. Brewer's Gold (US) : Simulé : ordre du moteur.
  - 6. Hydra : Simulé : ordre du moteur.
  - 7. Styrian Eagle : Simulé : ordre du moteur.
  - 8. Strata : Simulé : ordre du moteur.
  - 9. Falconer's Flight : Simulé : ordre du moteur.
  - 10. Nugget : Simulé : ordre du moteur.
- Beer Maverick : Citra (moteur 63, option 1 64, IA 63) ; Simcoe (moteur 3, option 1 3, IA 3)

#### Mosaic — 60′

- Moteur : 1. TNT Blend · 2. Loral · 3. Altus · 4. Trident · 5. Bravo · 6. Zenia · 7. Azacca · 8. Magnat · 9. Olympic · 10. Sticky Fingers Blend
- IA : 1. TNT Blend · 2. Loral · 3. Altus · 4. Trident · 5. Bravo · 6. Zenia · 7. Azacca · 8. Magnat · 9. Olympic · 10. Sticky Fingers Blend
  - 1. TNT Blend : Simulé : ordre du moteur.
  - 2. Loral : Simulé : ordre du moteur.
  - 3. Altus : Simulé : ordre du moteur.
  - 4. Trident : Simulé : ordre du moteur.
  - 5. Bravo : Simulé : ordre du moteur.
  - 6. Zenia : Simulé : ordre du moteur.
  - 7. Azacca : Simulé : ordre du moteur.
  - 8. Magnat : Simulé : ordre du moteur.
  - 9. Olympic : Simulé : ordre du moteur.
  - 10. Sticky Fingers Blend : Simulé : ordre du moteur.
- Beer Maverick : Citra (moteur 30, IA 30) ; Simcoe (moteur 22, IA 22)

#### Galaxy — dry hop

- Moteur : 1. Samba · 2. Zamba Blend · 3. Harlequin · 4. Nectaron · 5. Idaho Gem · 6. NZH-107 · 7. YQH-1380 · 8. Trident · 9. Tropica · 10. Southern Sublime
- Option 1 : 1. Harlequin · 2. Nectaron · 3. Vic Secret · 4. NZH-107 · 5. Strata · 6. Tango · 7. Sultana (Denali) · 8. Tropica · 9. Amarillo · 10. Sequoia Blend
- IA : 1. Samba · 2. Zamba Blend · 3. Harlequin · 4. Nectaron · 5. Idaho Gem · 6. NZH-107 · 7. YQH-1380 · 8. Trident · 9. Tropica · 10. Southern Sublime
  - 1. Samba : Simulé : ordre du moteur.
  - 2. Zamba Blend : Simulé : ordre du moteur.
  - 3. Harlequin : Simulé : ordre du moteur.
  - 4. Nectaron : Simulé : ordre du moteur.
  - 5. Idaho Gem : Simulé : ordre du moteur.
  - 6. NZH-107 : Simulé : ordre du moteur.
  - 7. YQH-1380 : Simulé : ordre du moteur.
  - 8. Trident : Simulé : ordre du moteur.
  - 9. Tropica : Simulé : ordre du moteur.
  - 10. Southern Sublime : Simulé : ordre du moteur.
- Beer Maverick : Simcoe (moteur 43, option 1 37, IA 43) ; Citra (moteur 32, option 1 14, IA 32) ; Amarillo (moteur 66, option 1 9, IA 66)

#### Galaxy — 60′

- Moteur : 1. Eclipse · 2. HPA-016 · 3. Satus · 4. Southern Sublime · 5. Tillicum · 6. Trident · 7. El Dorado · 8. Yeoman · 9. Zula · 10. BRU-1
- IA : 1. Eclipse · 2. HPA-016 · 3. Satus · 4. Southern Sublime · 5. Tillicum · 6. Trident · 7. El Dorado · 8. Yeoman · 9. Zula · 10. BRU-1
  - 1. Eclipse : Simulé : ordre du moteur.
  - 2. HPA-016 : Simulé : ordre du moteur.
  - 3. Satus : Simulé : ordre du moteur.
  - 4. Southern Sublime : Simulé : ordre du moteur.
  - 5. Tillicum : Simulé : ordre du moteur.
  - 6. Trident : Simulé : ordre du moteur.
  - 7. El Dorado : Simulé : ordre du moteur.
  - 8. Yeoman : Simulé : ordre du moteur.
  - 9. Zula : Simulé : ordre du moteur.
  - 10. BRU-1 : Simulé : ordre du moteur.
- Beer Maverick : Simcoe (moteur 73, IA 73) ; Citra (moteur 216, IA 216) ; Amarillo (moteur 101, IA 101)

#### Simcoe — dry hop

- Moteur : 1. Idaho 7 · 2. HBC 630 · 3. Hydra · 4. Mosaic · 5. Sabro · 6. Strata · 7. Talus · 8. XJA2/436 · 9. Zythos · 10. Newport
- Option 1 : 1. Idaho 7 · 2. Mandarina Bavaria · 3. Vic Secret · 4. Falconer's Flight 7CS · 5. Mosaic · 6. Sticklebract · 7. Zythos · 8. Falconer's Flight · 9. Palisade · 10. Hydra
- IA : 1. Idaho 7 · 2. HBC 630 · 3. Hydra · 4. Mosaic · 5. Sabro · 6. Strata · 7. Talus · 8. XJA2/436 · 9. Zythos · 10. Newport
  - 1. Idaho 7 : Simulé : ordre du moteur.
  - 2. HBC 630 : Simulé : ordre du moteur.
  - 3. Hydra : Simulé : ordre du moteur.
  - 4. Mosaic : Simulé : ordre du moteur.
  - 5. Sabro : Simulé : ordre du moteur.
  - 6. Strata : Simulé : ordre du moteur.
  - 7. Talus : Simulé : ordre du moteur.
  - 8. XJA2/436 : Simulé : ordre du moteur.
  - 9. Zythos : Simulé : ordre du moteur.
  - 10. Newport : Simulé : ordre du moteur.
- Beer Maverick : Summit (moteur 91, option 1 65, IA 91) ; Magnum (US) (moteur 216, option 1 170, IA 216) ; Amarillo (moteur 83, option 1 12, IA 83) ; Mosaic (moteur 4, option 1 5, IA 4) ; Cascade (moteur 51, option 1 38, IA 51) ; Centennial (moteur 96, option 1 77, IA 96) ; Citra (moteur 55, option 1 56, IA 55) ; Columbus (moteur 86, option 1 68, IA 86)

#### Simcoe — 60′

- Moteur : 1. Caliente · 2. Yeoman · 3. Trident · 4. Warrior · 5. Zenia · 6. Idaho 7 · 7. African Queen · 8. Hartwick · 9. Newport · 10. Sticklebract
- IA : 1. Caliente · 2. Yeoman · 3. Trident · 4. Warrior · 5. Zenia · 6. Idaho 7 · 7. African Queen · 8. Hartwick · 9. Newport · 10. Sticklebract
  - 1. Caliente : Simulé : ordre du moteur.
  - 2. Yeoman : Simulé : ordre du moteur.
  - 3. Trident : Simulé : ordre du moteur.
  - 4. Warrior : Simulé : ordre du moteur.
  - 5. Zenia : Simulé : ordre du moteur.
  - 6. Idaho 7 : Simulé : ordre du moteur.
  - 7. African Queen : Simulé : ordre du moteur.
  - 8. Hartwick : Simulé : ordre du moteur.
  - 9. Newport : Simulé : ordre du moteur.
  - 10. Sticklebract : Simulé : ordre du moteur.
- Beer Maverick : Summit (moteur 46, IA 46) ; Magnum (US) (moteur 121, IA 121) ; Amarillo (moteur 144, IA 144) ; Mosaic (moteur 213, IA 213) ; Cascade (moteur 223, IA 223) ; Centennial (moteur 106, IA 106) ; Citra (moteur 216, IA 216) ; Columbus (moteur 43, IA 43)

#### Saaz — dry hop

- Moteur : 1. Pacific Crest · 2. Tettnang (US) · 3. Aurum · 4. Styrian Golding · 5. Hallertau Tradition · 6. Sussex · 7. Spalter Select · 8. Aramis · 9. Marynka · 10. Strisselspalt
- Option 1 : 1. Aurum · 2. Spalt · 3. Saaz Late · 4. Celeia · 5. Pacific Crest · 6. Tettnang (US) · 7. Wild Loyalist · 8. Styrian Golding · 9. Strisselspalt · 10. Amethyst
- IA : 1. Pacific Crest · 2. Tettnang (US) · 3. Aurum · 4. Styrian Golding · 5. Hallertau Tradition · 6. Sussex · 7. Spalter Select · 8. Aramis · 9. Marynka · 10. Strisselspalt
  - 1. Pacific Crest : Simulé : ordre du moteur.
  - 2. Tettnang (US) : Simulé : ordre du moteur.
  - 3. Aurum : Simulé : ordre du moteur.
  - 4. Styrian Golding : Simulé : ordre du moteur.
  - 5. Hallertau Tradition : Simulé : ordre du moteur.
  - 6. Sussex : Simulé : ordre du moteur.
  - 7. Spalter Select : Simulé : ordre du moteur.
  - 8. Aramis : Simulé : ordre du moteur.
  - 9. Marynka : Simulé : ordre du moteur.
  - 10. Strisselspalt : Simulé : ordre du moteur.
- Beer Maverick : Saaz (US) (moteur 19, option 1 14, IA 19) ; Sterling (moteur 40, option 1 17, IA 40)

#### Saaz — 60′

- Moteur : 1. Wild Loyalist · 2. Mount Hood · 3. Saaz Late · 4. Amethyst · 5. Spalt · 6. Tettnang (US) · 7. Willamette · 8. Contessa · 9. Saphir · 10. Tettnanger
- IA : 1. Wild Loyalist · 2. Mount Hood · 3. Saaz Late · 4. Amethyst · 5. Spalt · 6. Tettnang (US) · 7. Willamette · 8. Contessa · 9. Saphir · 10. Tettnanger
  - 1. Wild Loyalist : Simulé : ordre du moteur.
  - 2. Mount Hood : Simulé : ordre du moteur.
  - 3. Saaz Late : Simulé : ordre du moteur.
  - 4. Amethyst : Simulé : ordre du moteur.
  - 5. Spalt : Simulé : ordre du moteur.
  - 6. Tettnang (US) : Simulé : ordre du moteur.
  - 7. Willamette : Simulé : ordre du moteur.
  - 8. Contessa : Simulé : ordre du moteur.
  - 9. Saphir : Simulé : ordre du moteur.
  - 10. Tettnanger : Simulé : ordre du moteur.
- Beer Maverick : Saaz (US) (moteur 21, IA 21) ; Sterling (moteur 43, IA 43)

#### Cascade — dry hop

- Moteur : 1. Barbe Rouge · 2. Mandarina Bavaria · 3. Sasquatch · 4. Olympic · 5. Taiheke · 6. Buzz Bullets · 7. Herald · 8. HORT9909 · 9. Motueka · 10. Southern Cross
- Option 1 : 1. Taiheke · 2. Cluster · 3. Atlas · 4. Bravo · 5. Riwaka · 6. Brewer's Gold (US) · 7. Southern Cross · 8. Bullion · 9. Galena · 10. Zythos
- IA : 1. Barbe Rouge · 2. Mandarina Bavaria · 3. Sasquatch · 4. Olympic · 5. Taiheke · 6. Buzz Bullets · 7. Herald · 8. HORT9909 · 9. Motueka · 10. Southern Cross
  - 1. Barbe Rouge : Simulé : ordre du moteur.
  - 2. Mandarina Bavaria : Simulé : ordre du moteur.
  - 3. Sasquatch : Simulé : ordre du moteur.
  - 4. Olympic : Simulé : ordre du moteur.
  - 5. Taiheke : Simulé : ordre du moteur.
  - 6. Buzz Bullets : Simulé : ordre du moteur.
  - 7. Herald : Simulé : ordre du moteur.
  - 8. HORT9909 : Simulé : ordre du moteur.
  - 9. Motueka : Simulé : ordre du moteur.
  - 10. Southern Cross : Simulé : ordre du moteur.
- Beer Maverick : Amarillo (moteur 108, option 1 48, IA 108) ; Centennial (moteur 51, option 1 14, IA 51) ; Ahtanum (moteur 17, option 1 31, IA 17) ; Summit (moteur 61, option 1 121, IA 61)

#### Cascade — 60′

- Moteur : 1. Aloha Blend · 2. Diamant · 3. Sun · 4. Agnus · 5. Buzz Bullets · 6. Sticklebract · 7. Tomahawk · 8. Zeus · 9. Arcadian · 10. Brewer's Gold (US)
- IA : 1. Aloha Blend · 2. Diamant · 3. Sun · 4. Agnus · 5. Buzz Bullets · 6. Sticklebract · 7. Tomahawk · 8. Zeus · 9. Arcadian · 10. Brewer's Gold (US)
  - 1. Aloha Blend : Simulé : ordre du moteur.
  - 2. Diamant : Simulé : ordre du moteur.
  - 3. Sun : Simulé : ordre du moteur.
  - 4. Agnus : Simulé : ordre du moteur.
  - 5. Buzz Bullets : Simulé : ordre du moteur.
  - 6. Sticklebract : Simulé : ordre du moteur.
  - 7. Tomahawk : Simulé : ordre du moteur.
  - 8. Zeus : Simulé : ordre du moteur.
  - 9. Arcadian : Simulé : ordre du moteur.
  - 10. Brewer's Gold (US) : Simulé : ordre du moteur.
- Beer Maverick : Amarillo (moteur 86, IA 86) ; Centennial (moteur 57, IA 57) ; Ahtanum (moteur 208, IA 208) ; Summit (moteur 81, IA 81)

#### Idaho 7 — dry hop

- Moteur : 1. Simcoe · 2. Mosaic · 3. Styrian Fox · 4. Hydra · 5. HBC 630 · 6. Ariana · 7. Nugget · 8. Talus · 9. Sabro · 10. Strata
- Option 1 : 1. Simcoe · 2. Falconer's Flight · 3. Mosaic · 4. Azacca · 5. Amarillo · 6. Brewer's Gold (US) · 7. Hydra · 8. Zythos · 9. Cascade · 10. Bullion
- IA : 1. Simcoe · 2. Mosaic · 3. Styrian Fox · 4. Hydra · 5. HBC 630 · 6. Ariana · 7. Nugget · 8. Talus · 9. Sabro · 10. Strata
  - 1. Simcoe : Simulé : ordre du moteur.
  - 2. Mosaic : Simulé : ordre du moteur.
  - 3. Styrian Fox : Simulé : ordre du moteur.
  - 4. Hydra : Simulé : ordre du moteur.
  - 5. HBC 630 : Simulé : ordre du moteur.
  - 6. Ariana : Simulé : ordre du moteur.
  - 7. Nugget : Simulé : ordre du moteur.
  - 8. Talus : Simulé : ordre du moteur.
  - 9. Sabro : Simulé : ordre du moteur.
  - 10. Strata : Simulé : ordre du moteur.
- Beer Maverick : Azacca (moteur 98, option 1 4, IA 98) ; El Dorado (moteur 101, option 1 82, IA 101) ; Cashmere (moteur 154, option 1 181, IA 154) ; Citra (moteur 43, option 1 53, IA 43) ; Idaho Gem (moteur 105, option 1 250, IA 105) ; Amarillo (moteur 46, option 1 5, IA 46) ; Chinook (moteur 81, option 1 34, IA 81) ; Columbus (moteur 70, option 1 54, IA 70)

#### Idaho 7 — 60′

- Moteur : 1. Bravo · 2. Caliente · 3. Simcoe · 4. Trident · 5. Magnat · 6. Marco Polo · 7. Nugget · 8. Yeoman · 9. Zenia · 10. Styrian Cardinal
- IA : 1. Bravo · 2. Caliente · 3. Simcoe · 4. Trident · 5. Magnat · 6. Marco Polo · 7. Nugget · 8. Yeoman · 9. Zenia · 10. Styrian Cardinal
  - 1. Bravo : Simulé : ordre du moteur.
  - 2. Caliente : Simulé : ordre du moteur.
  - 3. Simcoe : Simulé : ordre du moteur.
  - 4. Trident : Simulé : ordre du moteur.
  - 5. Magnat : Simulé : ordre du moteur.
  - 6. Marco Polo : Simulé : ordre du moteur.
  - 7. Nugget : Simulé : ordre du moteur.
  - 8. Yeoman : Simulé : ordre du moteur.
  - 9. Zenia : Simulé : ordre du moteur.
  - 10. Styrian Cardinal : Simulé : ordre du moteur.
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

- Durée par requête : médiane 0 ms, p95 0 ms, max 2 ms ; limite de l'écran Substituer : 3 s au p95 → tenue.
- Jetons : entrée 2232 en moyenne (total 174097), sortie 148 en moyenne (total 11544), réflexion comprise.
- Coût estimé (tarifs de `geminiCosts.ts`, 1 USD = 1,25 CHF) : 0.4347 CHF pour 78 appels (78 chiffrés), soit 0.0056 CHF par usage.
