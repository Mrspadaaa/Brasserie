# Journal des appels Gemini réels

Autorisation humaine du 12.10 à 19:01 (mission, section « Gemini réel pour les tests d'intégration » ; décision 42) :
- modèle : `gemini-3.8-flash` uniquement, forcé par le test spécial et vérifié dans la réponse ;
- volume : au plus 3 appels par lancement et **10 au total** ;
- usage : tests spéciaux dédiés seulement, jamais dans `npm test` ;
- données : fixtures ou émulateurs seulement ;
- clé : jamais affichée.

Une ligne par appel, avec une seconde ligne dans `registre.md`.

**Compteur : 9 / 40** (enveloppe portée de 10 à 40 appels, 5 par lancement, 15 CHF estimés : décision humaine du 16.10 vers 12:30, décision 63)

Historique avant l'autorisation : 0 génération. Une requête GET sans clé est partie vers
`europe-west1-aiplatform.googleapis.com` le 08.10 vers 20:58 (incident I1, réponse 404, aucun coût). Elle ne compte
pas comme un appel.

Note sur l'appel 2 (13.10, 00:24) : HTTP 200 et modèle 3.8 observé, mais **échec fonctionnel** : réponse JSON coupée à la
position 460 (4 486 tokens de sortie sur un plafond de 4 500 partagé avec la réflexion `high`), lecture du COA en échec. Corrigé
par `functions/src/ai.ts:171`, `:205` (sortie au moins 12 000 tokens en réflexion haute) ; l'appel 3 le prouve (lecture complète).
La ligne 2 du tableau n'est pas réécrite.

Note sur les appels 4 et 5 (16.10, D100, #100) : le coût estimé comprend la **provision de recherche de 0,35 CHF**
(20 requêtes) : 3.8 n'a renvoyé aucune `groundingMetadata` sur ces appels ancrés avec schéma, donc aucune requête n'est
prouvée et la provision entière est imputée (`geminiCosts.ts`, règle #100.5). Coût des seuls jetons : 0,0162 CHF
(appel 4) et 0,0097 CHF (appel 5). Lancements : `D100/logs/live-reel-levure.log`, `D100/logs/live-reel-import.log`.

Note sur les appels 6 à 9 (16.10, IA-B, #91, décision 68 : liste blanche serveur de deux modèles, `gemini-3.8-flash` et
`gemini-3.5-flash-lite`, choisis par le serveur ; plafond codé relevé à 5 / 40) : routage de production, sans modèle forcé,
sur l'émulateur `demo-iab`. Appels 6-8 : 3.5 Flash-Lite servi et observé (COA `minimal`, diagnostic `low`, recherche de
référence du compagnon `minimal`). Appel 9 : nouvelle tentative réelle sur 3.8 `low` après une réponse Flash-Lite coupée
**simulée localement** (aucun appel lite parti ni compté). Total 0,0317 CHF. Lignes ajoutées en fin de fichier, à la suite
des appels 4 et 5. Lancements : `IA-B/logs/live-reel-{coa,diagnostic,recherche,repli}.log`, registre `IA-B/registre-appels.md`.

| # | Heure | Issue | Test | Modèle observé | Tokens entrée / sortie | Coût estimé | Résultat |
|---|---|---|---|---|---|---|---|
| 1 | 12.10 23:32 | #22 (G38) | gemini-38-live.ts · readHopCoa (Rapide) | gemini-3.8-flash | 1390 / 718 | 0.0093 CHF | HTTP 200, 6216 ms |
| 2 | 13.10 00:24 | #22 (G38) | gemini-38-live.ts · readHopCoa (Max, réflexion high) | gemini-3.8-flash | 1390 / 4486 | 0.0447 CHF | HTTP 200, 34435 ms, réflexion high |
| 3 | 13.10 00:28 | #22 (G38) | gemini-38-live.ts · readHopCoa (Max, réflexion high) | gemini-3.8-flash | 1390 / 4813 | 0.0477 CHF | HTTP 200, 36244 ms, réflexion high |

## Banc réel des usages complexes (H12, AI07-C, décisions 68 et 69) — enveloppe séparée

- Modèles : `gemini-3.8-flash` (60, porté à 95 par la décision 70), à 100 (décision 82) puis à 111 (décision 83), `gemini-3.5-flash-lite` (60) et le modèle d'essai Argon de la décision 69 (30,
  identifiant vérifié par la liste des modèles de l'API), champ `model` vérifié à chaque réponse ; Argon n'entre pas
  dans l'app. Bornes : **25 appels par lancement, 15 CHF estimés (22 CHF depuis la décision 70, 16.10 ~16:58 ; 40 CHF depuis la décision humaine du 16.10 ~22:09, décision 87)** (`geminiCosts.ts` ; Argon : tarif lu à la source,
  sinon estimé), échéance 31.10 ; garde `scripts/gemini-usage-bench-guard.mjs` réglée par la ligne `H12-AUTORISATION`
  de `decisions-humaines.md`. Section placée avant #91 : les lignes ajoutées en fin de fichier par
  `scripts/gemini38LiveCore.ts` n'y tombent pas.
- Données : fixtures synthétiques (`tests/fixtures/gemini-usage-bench/`), sauf les lancements H13R du 16.10 21:11 (4 vrais documents de l'humain, décision humaine ~21:00) et H13R-2 du 17.10 01:08 (2 vrais documents, `doc5` et `doc6`, décision 83 ; 10 appels, lignes 162 à 171), rangés dans `H13-reels/`, ignoré par Git ; aucune valeur ici ; jamais dans `npm test`. Borne 3.8 portée à 100 (décision 82) puis à 111 (décision 83) : total 201.

**Compteur H12 : 171 / 201 · 9.9399 CHF / 40** (gemini-3.8-flash 109 / 111 ; gemini-3.5-flash-lite 54 / 60 ; gemini-4-argon 8 / 30)

| # | Heure | Lancement | Usage · cas | Architecture | Modèle observé | Réflexion | Tokens entrée / sortie | Latence | Coût estimé | Résultat |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 16.10 16:34 | C1 | compagnon-complet · cc-puissance | gemini-3.8-flash · low · analysis1 | gemini-3.8-flash | low | 10750 / 35 | 2010 ms | 0.0205 CHF | HTTP 200 |
| 2 | 16.10 16:34 | C1 | compagnon-complet · cc-puissance | gemini-3.8-flash · low · analysis2 | gemini-3.8-flash | low | 10961 / 208 | 5932 ms | 0.0225 CHF | HTTP 200 |
| 3 | 16.10 16:34 | C1 | compagnon-complet · cc-puissance | gemini-3.8-flash · low · review1 | gemini-3.8-flash | low | 4172 / 24 | 1822 ms | 0.0080 CHF | HTTP 200 |
| 4 | 16.10 16:34 | C1 | compagnon-complet · cc-alpha | gemini-3.8-flash · low · analysis1 | gemini-3.8-flash | low | 16730 / 91 | 2108 ms | 0.0322 CHF | HTTP 200 |
| 5 | 16.10 16:34 | C1 | compagnon-complet · cc-alpha | gemini-3.8-flash · low · analysis2 | gemini-3.8-flash | low | 19982 / 200 | 5356 ms | 0.0393 CHF | HTTP 200 |
| 6 | 16.10 16:35 | C1 | compagnon-complet · cc-alpha | gemini-3.8-flash · low · review1 | gemini-3.8-flash | low | 7056 / 24 | 1723 ms | 0.0135 CHF | HTTP 200 |
| 7 | 16.10 16:35 | C1 | compagnon-complet · cc-alpha | gemini-3.8-flash · low · review2 | gemini-3.8-flash | low | 7350 / 24 | 2039 ms | 0.0140 CHF | HTTP 200 |
| 8 | 16.10 16:35 | C1 | compagnon-complet · cc-injection | gemini-3.8-flash · low · analysis1 | gemini-3.8-flash | low | 10745 / 174 | 2906 ms | 0.0218 CHF | HTTP 200 |
| 9 | 16.10 16:35 | C1 | compagnon-complet · cc-injection | gemini-3.8-flash · low · analysis2 | gemini-3.8-flash | low | 10939 / 32 | 1771 ms | 0.0208 CHF | HTTP 200 |
| 10 | 16.10 16:35 | C1 | compagnon-complet · cc-injection | gemini-3.8-flash · low · analysis3 | gemini-3.8-flash | low | 11062 / 163 | 3565 ms | 0.0223 CHF | HTTP 200 |
| 11 | 16.10 16:35 | C1 | compagnon-complet · cc-injection | gemini-3.8-flash · low · review1 | gemini-3.8-flash | low | 4036 / 24 | 2248 ms | 0.0078 CHF | HTTP 200 |
| 12 | 16.10 16:35 | C1 | compagnon-complet · cc-eau-houblon | gemini-3.8-flash · low · analysis1 | gemini-3.8-flash | low | 16836 / 28 | 2112 ms | 0.0318 CHF | HTTP 200 |
| 13 | 16.10 16:35 | C1 | compagnon-complet · cc-eau-houblon | gemini-3.8-flash · low · analysis2 | gemini-3.8-flash | low | 20822 / 121 | 1966 ms | 0.0402 CHF | HTTP 200 |
| 14 | 16.10 16:35 | C1 | compagnon-complet · cc-eau-houblon | gemini-3.8-flash · low · analysis3 | gemini-3.8-flash | low | 24458 / 241 | 2836 ms | 0.0481 CHF | HTTP 200 |
| 15 | 16.10 16:35 | C1 | compagnon-complet · cc-eau-houblon | gemini-3.8-flash · low · review1 | gemini-3.8-flash | low | 11524 / 24 | 1822 ms | 0.0218 CHF | HTTP 200 |
| 16 | 16.10 16:35 | C1 | compagnon-complet · cc-eau-houblon | gemini-3.8-flash · low · review2 | gemini-3.8-flash | low | 11818 / 24 | 1924 ms | 0.0224 CHF | HTTP 200 |
| 17 | 16.10 16:36 | C2 | compagnon-complet · cc-puissance | gemini-3.5-flash-lite · low · analysis1 | gemini-3.5-flash-lite | low | 10750 / 233 | 1820 ms | 0.0048 CHF | HTTP 200 |
| 18 | 16.10 16:36 | C2 | compagnon-complet · cc-puissance | gemini-3.5-flash-lite · low · analysis2 | gemini-3.5-flash-lite | low | 11159 / 381 | 1800 ms | 0.0054 CHF | HTTP 200 |
| 19 | 16.10 16:36 | C2 | compagnon-complet · cc-puissance | gemini-3.5-flash-lite · low · review1 | gemini-3.5-flash-lite | low | 4148 / 24 | 1270 ms | 0.0016 CHF | HTTP 200 |
| 20 | 16.10 16:36 | C2 | compagnon-complet · cc-alpha | gemini-3.5-flash-lite · low · analysis1 | gemini-3.5-flash-lite | low | 16730 / 83 | 1123 ms | 0.0065 CHF | HTTP 200 |
| 21 | 16.10 16:36 | C2 | compagnon-complet · cc-alpha | gemini-3.5-flash-lite · low · analysis2 | gemini-3.5-flash-lite | low | 19961 / 194 | 1170 ms | 0.0081 CHF | HTTP 200 |
| 22 | 16.10 16:36 | C2 | compagnon-complet · cc-alpha | gemini-3.5-flash-lite · low · analysis3 | gemini-3.5-flash-lite | low | 20175 / 199 | 1279 ms | 0.0082 CHF | HTTP 200 |
| 23 | 16.10 16:36 | C2 | compagnon-complet · cc-alpha | gemini-3.5-flash-lite · low · analysis4 | gemini-3.5-flash-lite | low | 20394 / 195 | 1134 ms | 0.0083 CHF | HTTP 200 |
| 24 | 16.10 16:36 | C2 | compagnon-complet · cc-alpha | gemini-3.5-flash-lite · low · analysis5 | gemini-3.5-flash-lite | low | 20609 / 190 | 1029 ms | 0.0083 CHF | HTTP 200 |
| 25 | 16.10 16:36 | C2 | compagnon-complet · cc-alpha | gemini-3.5-flash-lite · low · review1 | gemini-3.5-flash-lite | low | 7027 / 24 | 1032 ms | 0.0027 CHF | HTTP 200 |
| 26 | 16.10 16:36 | C2 | compagnon-complet · cc-alpha | gemini-3.5-flash-lite · low · review2 | gemini-3.5-flash-lite | low | 7321 / 24 | 1266 ms | 0.0028 CHF | HTTP 200 |
| 27 | 16.10 16:36 | C2 | compagnon-complet · cc-injection | gemini-3.5-flash-lite · low · analysis1 | gemini-3.5-flash-lite | low | 10745 / 596 | 2709 ms | 0.0059 CHF | HTTP 200 |
| 28 | 16.10 16:36 | C2 | compagnon-complet · cc-injection | gemini-3.5-flash-lite · low · review1 | gemini-3.5-flash-lite | low | 3933 / 52 | 1561 ms | 0.0016 CHF | HTTP 200 |
| 29 | 16.10 16:36 | C2 | compagnon-complet · cc-injection | gemini-3.5-flash-lite · low · analysis2 | gemini-3.5-flash-lite | low | 11086 / 160 | 1173 ms | 0.0047 CHF | HTTP 200 |
| 30 | 16.10 16:36 | C2 | compagnon-complet · cc-injection | gemini-3.5-flash-lite · low · analysis3 | gemini-3.5-flash-lite | low | 11266 / 151 | 980 ms | 0.0047 CHF | HTTP 200 |
| 31 | 16.10 16:36 | C2 | compagnon-complet · cc-injection | gemini-3.5-flash-lite · low · review2 | gemini-3.5-flash-lite | low | 3953 / 24 | 1003 ms | 0.0016 CHF | HTTP 200 |
| 32 | 16.10 16:36 | C2 | compagnon-complet · cc-eau-houblon | gemini-3.5-flash-lite · low · analysis1 | gemini-3.5-flash-lite | low | 16836 / 308 | 2104 ms | 0.0073 CHF | HTTP 200 |
| 33 | 16.10 16:36 | C2 | compagnon-complet · cc-eau-houblon | gemini-3.5-flash-lite · low · analysis2 | gemini-3.5-flash-lite | low | 17866 / 819 | 3245 ms | 0.0093 CHF | HTTP 200 |
| 34 | 16.10 16:36 | C2 | compagnon-complet · cc-eau-houblon | gemini-3.5-flash-lite · low · analysis3 | gemini-3.5-flash-lite | low | 22573 / 255 | 1815 ms | 0.0093 CHF | HTTP 200 |
| 36 | 16.10 16:36 | C2 | compagnon-complet · cc-eau-houblon | gemini-3.5-flash-lite · low · review2 | gemini-3.5-flash-lite | low | 9396 / 24 | 745 ms | 0.0036 CHF | HTTP 200 |
| 35 | 16.10 16:36 | C2 | compagnon-complet · cc-eau-houblon | gemini-3.5-flash-lite · low · review1 | gemini-3.5-flash-lite | low | 9102 / 24 | 810 ms | 0.0035 CHF | HTTP 200 |
| 37 | 16.10 16:37 | C3 | compagnon-complet · cc-alpha | gemini-3.8-flash · high · approfondi · analysis1 | gemini-3.8-flash | high | 16735 / 530 | 5288 ms | 0.0363 CHF | HTTP 200 |
| 38 | 16.10 16:37 | C3 | compagnon-complet · cc-alpha | gemini-3.8-flash · high · approfondi · analysis2 | gemini-3.8-flash | medium | 20503 / 156 | 3052 ms | 0.0399 CHF | HTTP 200 |
| 39 | 16.10 16:37 | C3 | compagnon-complet · cc-alpha | gemini-3.8-flash · high · approfondi · analysis3 | gemini-3.8-flash | medium | 23817 / 556 | 5728 ms | 0.0499 CHF | HTTP 200 |
| 40 | 16.10 16:38 | C3 | compagnon-complet · cc-alpha | gemini-3.8-flash · high · approfondi · review1 | gemini-3.8-flash | medium | 10091 / 377 | 4444 ms | 0.0225 CHF | HTTP 200 |
| 41 | 16.10 16:38 | C3 | compagnon-complet · cc-eau-houblon | gemini-3.8-flash · high · approfondi · analysis1 | gemini-3.8-flash | high | 16841 / 927 | 8901 ms | 0.0403 CHF | HTTP 200 |
| 42 | 16.10 16:38 | C3 | compagnon-complet · cc-eau-houblon | gemini-3.8-flash · high · approfondi · analysis2 | gemini-3.8-flash | medium | 18490 / 694 | 5948 ms | 0.0412 CHF | HTTP 200 |
| 43 | 16.10 16:38 | C3 | compagnon-complet · cc-eau-houblon | gemini-3.8-flash · high · approfondi · analysis3 | gemini-3.8-flash | medium | 22702 / 859 | 7959 ms | 0.0506 CHF | HTTP 200 |
| 44 | 16.10 16:38 | C3 | compagnon-complet · cc-eau-houblon | gemini-3.8-flash · high · approfondi · review1 | gemini-3.8-flash | medium | 8535 / 725 | 5931 ms | 0.0228 CHF | HTTP 200 |
| 45 | 16.10 16:38 | C3 | compagnon-complet · cc-alpha | gemini-4-argon · high · approfondi · analysis1 | gemini-4-argon | high | 16688 / 431 | 9081 ms | 0.0942 CHF | HTTP 200 |
| 46 | 16.10 16:38 | C3 | compagnon-complet · cc-alpha | gemini-4-argon · high · approfondi · analysis2 | gemini-4-argon | medium | 23476 / 523 | 22009 ms | 0.1305 CHF | HTTP 200 |
| 47 | 16.10 16:39 | C3 | compagnon-complet · cc-alpha | gemini-4-argon · high · approfondi · review1 | gemini-4-argon | medium | 10343 / 29 | 6579 ms | 0.0524 CHF | HTTP 200 |
| 48 | 16.10 16:39 | C3 | compagnon-complet · cc-eau-houblon | gemini-4-argon · high · approfondi · analysis1 | gemini-4-argon | high | 16795 / 1411 | 26813 ms | 0.1192 CHF | HTTP 200 |
| 49 | 16.10 16:39 | C3 | compagnon-complet · cc-eau-houblon | gemini-4-argon · high · approfondi · analysis2 | gemini-4-argon | medium | 22440 / 1100 | 17697 ms | 0.1397 CHF | HTTP 200 |
| 50 | 16.10 16:40 | C3 | compagnon-complet · cc-eau-houblon | gemini-4-argon · high · approfondi · review1 | gemini-4-argon | medium | 8959 / 29 | 4228 ms | 0.0455 CHF | HTTP 200 |
| 51 | 16.10 16:41 | C4 | levure-choix · cl-levure-propre | gemini-3.8-flash · low · analysis1 | gemini-3.8-flash | low | 16748 / 23 | 1921 ms | 0.0316 CHF | HTTP 200 |
| 52 | 16.10 16:41 | C4 | levure-choix · cl-levure-propre | gemini-3.8-flash · low · analysis2 | gemini-3.8-flash | low | 20729 / 33 | 2472 ms | 0.0392 CHF | HTTP 200 |
| 53 | 16.10 16:41 | C4 | levure-choix · cl-levure-propre | gemini-3.8-flash · low · research1 | gemini-3.5-flash-lite | minimal | 80 / 332 | 3454 ms | 0.0361 CHF | HTTP 200 |
| 54 | 16.10 16:41 | C4 | levure-choix · cl-levure-propre | gemini-3.8-flash · low · analysis3 | gemini-3.8-flash | low | 22741 / 366 | 4298 ms | 0.0461 CHF | HTTP 200 |
| 55 | 16.10 16:41 | C4 | levure-choix · cl-levure-propre | gemini-3.8-flash · low · analysis4 | gemini-3.8-flash | low | 25354 / 267 | 3981 ms | 0.0500 CHF | HTTP 200 |
| 56 | 16.10 16:42 | C4 | levure-choix · cl-levure-propre | gemini-3.8-flash · low · review1 | gemini-3.8-flash | low | 41429 / 24 | 1898 ms | 0.0779 CHF | HTTP 200 |
| 57 | 16.10 16:42 | C4 | levure-choix · cl-levure-propre | gemini-3.8-flash · low · review2 | gemini-3.8-flash | low | 41723 / 24 | 2347 ms | 0.0785 CHF | HTTP 200 |
| 58 | 16.10 16:42 | C4 | levure-choix · cl-saison-seche | gemini-3.8-flash · low · analysis1 | gemini-3.8-flash | low | 16445 / 43 | 1832 ms | 0.0312 CHF | HTTP 200 |
| 59 | 16.10 16:42 | C4 | levure-choix · cl-saison-seche | gemini-3.8-flash · low · analysis2 | gemini-3.8-flash | low | 38510 / 44 | 2374 ms | 0.0726 CHF | HTTP 200 |
| 60 | 16.10 16:42 | C4 | levure-choix · cl-saison-seche | gemini-3.8-flash · low · analysis3 | gemini-3.8-flash | low | 54826 / 20 | 2252 ms | 0.1030 CHF | HTTP 200 |
| 61 | 16.10 16:42 | C4 | levure-choix · cl-saison-seche | gemini-3.8-flash · low · analysis4 | gemini-3.8-flash | low | 73930 / 23 | 1854 ms | 0.1388 CHF | HTTP 200 |
| 62 | 16.10 16:42 | C4 | levure-choix · cl-saison-seche | gemini-3.8-flash · low · analysis5 | gemini-3.8-flash | low | 87644 / 33 | 2298 ms | 0.1646 CHF | HTTP 200 |
| 63 | 16.10 16:42 | C4 | levure-choix · cl-saison-seche | gemini-3.8-flash · low · research1 | gemini-3.5-flash-lite | minimal | 80 / 308 | 2567 ms | 0.0185 CHF | HTTP 200 |
| 64 | 16.10 16:42 | C4 | levure-choix · cl-saison-seche | gemini-3.8-flash · low · analysis6 | gemini-3.8-flash | low | 90178 / 21 | 2873 ms | 0.1693 CHF | HTTP 200 |
| 65 | 16.10 16:42 | C4 | levure-choix · cl-saison-seche | gemini-3.8-flash · low · analysis7 | gemini-3.8-flash | low | 95862 / 24 | 1911 ms | 0.1800 CHF | HTTP 200 |
| 66 | 16.10 16:42 | C4 | levure-choix · cl-saison-seche | gemini-3.8-flash · low · analysis8 | gemini-3.8-flash | low | 97544 / 363 | 4596 ms | 0.1863 CHF | HTTP 200 |
| 67 | 16.10 16:42 | C4 | levure-choix · cl-saison-seche | gemini-3.8-flash · low · analysis9 | gemini-3.8-flash | low | 104430 / 352 | 4595 ms | 0.1991 CHF | HTTP 200 |
| 68 | 16.10 16:43 | C4b | levure-choix · cl-levure-propre | gemini-3.5-flash-lite · low · analysis1 | gemini-3.5-flash-lite | low | 16748 / 23 | 1194 ms | 0.0064 CHF | HTTP 200 |
| 69 | 16.10 16:43 | C4b | levure-choix · cl-levure-propre | gemini-3.5-flash-lite · low · analysis2 | gemini-3.5-flash-lite | low | 20729 / 218 | 1267 ms | 0.0085 CHF | HTTP 200 |
| 70 | 16.10 16:43 | C4b | levure-choix · cl-levure-propre | gemini-3.5-flash-lite · low · analysis3 | gemini-3.5-flash-lite | low | 26542 / 252 | 1359 ms | 0.0107 CHF | HTTP 200 |
| 71 | 16.10 16:43 | C4b | levure-choix · cl-levure-propre | gemini-3.5-flash-lite · low · analysis4 | gemini-3.5-flash-lite | low | 26832 / 201 | 1385 ms | 0.0107 CHF | HTTP 200 |
| 72 | 16.10 16:43 | C4b | levure-choix · cl-levure-propre | gemini-3.5-flash-lite · low · review1 | gemini-3.5-flash-lite | low | 42295 / 24 | 1319 ms | 0.0159 CHF | HTTP 200 |
| 73 | 16.10 16:43 | C4b | levure-choix · cl-levure-propre | gemini-3.5-flash-lite · low · review2 | gemini-3.5-flash-lite | low | 42589 / 24 | 1396 ms | 0.0160 CHF | HTTP 200 |
| 74 | 16.10 16:43 | C4b | levure-choix · cl-saison-seche | gemini-3.5-flash-lite · low · analysis1 | gemini-3.5-flash-lite | low | 16445 / 335 | 2247 ms | 0.0072 CHF | HTTP 200 |
| 75 | 16.10 16:44 | C4b | levure-choix · cl-saison-seche | gemini-3.5-flash-lite · low · analysis2 | gemini-3.5-flash-lite | low | 29519 / 321 | 2045 ms | 0.0121 CHF | HTTP 200 |
| 76 | 16.10 16:44 | C4b | levure-choix · cl-saison-seche | gemini-3.5-flash-lite · low · analysis3 | gemini-3.5-flash-lite | low | 35363 / 1064 | 3669 ms | 0.0166 CHF | HTTP 200 |
| 77 | 16.10 16:44 | C4b | levure-choix · cl-saison-seche | gemini-3.5-flash-lite · low · analysis4 | gemini-3.5-flash-lite | low | 36453 / 508 | 2374 ms | 0.0153 CHF | HTTP 200 |
| 78 | 16.10 16:44 | C4b | levure-choix · cl-saison-seche | gemini-3.5-flash-lite · low · analysis5 | gemini-3.5-flash-lite | low | 42152 / 485 | 2907 ms | 0.0173 CHF | HTTP 200 |
| 79 | 16.10 16:44 | C4b | levure-choix · cl-saison-seche | gemini-3.5-flash-lite · low · review1 | gemini-3.5-flash-lite | low | 54823 / 24 | 1277 ms | 0.0206 CHF | HTTP 200 |
| 80 | 16.10 16:44 | C4b | levure-choix · cl-saison-seche | gemini-3.5-flash-lite · low · review2 | gemini-3.5-flash-lite | low | 55117 / 13 | 1793 ms | 0.0207 CHF | HTTP 200 |
| 81 | 16.10 16:44 | C4c | levure-choix · cl-saison-seche | gemini-3.8-flash · low · analysis1 | gemini-3.8-flash | low | 16445 / 94 | 2772 ms | 0.0317 CHF | HTTP 200 |
| 82 | 16.10 16:44 | C4c | levure-choix · cl-saison-seche | gemini-3.8-flash · low · analysis2 | gemini-3.8-flash | low | 74172 / 54 | 3023 ms | 0.1396 CHF | HTTP 200 |
| 83 | 16.10 16:44 | C4c | levure-choix · cl-saison-seche | gemini-3.8-flash · low · research1 | gemini-3.5-flash-lite | minimal | 79 / 416 | 4068 ms | 0.0188 CHF | HTTP 200 |
| 84 | 16.10 16:44 | C4c | levure-choix · cl-saison-seche | gemini-3.8-flash · low · analysis3 | gemini-3.8-flash | low | 89258 / 25 | 2645 ms | 0.1676 CHF | HTTP 200 |
| 85 | 16.10 16:44 | C4c | levure-choix · cl-saison-seche | gemini-3.8-flash · low · analysis4 | gemini-3.8-flash | low | 91866 / 24 | 2819 ms | 0.1725 CHF | HTTP 200 |
| 86 | 16.10 16:44 | C4c | levure-choix · cl-saison-seche | gemini-3.8-flash · low · analysis5 | gemini-3.8-flash | low | 93782 / 20 | 2256 ms | 0.1760 CHF | HTTP 200 |
| 87 | 16.10 16:45 | C4c | levure-choix · cl-saison-seche | gemini-3.8-flash · low · analysis6 | gemini-3.8-flash | low | 97435 / 231 | 3448 ms | 0.1849 CHF | HTTP 200 |
| 88 | 16.10 16:45 | C4c | levure-choix · cl-saison-seche | gemini-3.8-flash · low · analysis7 | gemini-3.8-flash | low | 104177 / 253 | 3679 ms | 0.1977 CHF | HTTP 200 |
| 89 | 16.10 16:45 | C4c | levure-choix · cl-saison-seche | gemini-3.8-flash · low · review1 | gemini-3.8-flash | low | 113320 / 24 | 3303 ms | 0.2127 CHF | HTTP 200 |
| 90 | 16.10 16:45 | C4c | levure-choix · cl-saison-seche | gemini-3.8-flash · low · review2 | gemini-3.8-flash | low | 113614 / 24 | 9471 ms | 0.2133 CHF | HTTP 200 |
| 91 | 16.10 16:46 | C5a | conseil-houblons · hh-lecture | gemini-3.5-flash-lite · low · analysis1 | non fourni | low | inconnus | 814 ms | inconnu | HTTP 400 |
| 92 | 16.10 16:46 | C5a | conseil-houblons · hh-biotransformation | gemini-3.5-flash-lite · low · analysis1 | non fourni | low | inconnus | 734 ms | inconnu | HTTP 400 |
| 93 | 16.10 16:47 | C5b | conseil-houblons · hh-lecture | gemini-3.8-flash · low · analysis1 | non fourni | low | inconnus | 1149 ms | inconnu | HTTP 400 : Request contains an invalid argument. |
| 94 | 16.10 16:47 | C5b | conseil-houblons · hh-biotransformation | gemini-3.8-flash · low · analysis1 | non fourni | low | inconnus | 1335 ms | inconnu | HTTP 400 : Request contains an invalid argument. |
| 95 | 16.10 16:49 | D1 | diagnostic · finish V6 tel quel | gemini-3.8-flash · low · finish V6 seul | gemini-3.8-flash | low | 2721 / 58 | 1806 ms | 0.0056 CHF | HTTP 200 |
| 96 | 16.10 16:49 | D1 | diagnostic · sans anyOf/null | gemini-3.8-flash · low · finish V6 seul | gemini-3.8-flash | low | 2691 / 1 | 1666 ms | 0.0051 CHF | HTTP 200 |
| 97 | 16.10 16:49 | D1 | diagnostic · sans additionalProperties | gemini-3.8-flash · low · finish V6 seul | gemini-3.8-flash | low | 2721 / 1 | 1649 ms | 0.0051 CHF | HTTP 200 |
| 98 | 16.10 16:50 | D2 | diagnostic · corps réel complet (ANY) | gemini-3.8-flash · low · conseil houblons V6, 1er tour | non fourni | low | inconnus | 1471 ms | 0.0000 CHF | HTTP 400 (refusé avant génération) |
| 99 | 16.10 16:50 | D2 | diagnostic · sans le finish V6 | gemini-3.8-flash · low · conseil houblons V6, 1er tour | gemini-3.8-flash | low | 6427 / 53 | 2274 ms | 0.0125 CHF | HTTP 200 |
| 100 | 16.10 16:50 | D2 | diagnostic · finish V6 seul, consigne et contexte réels | gemini-3.8-flash · low · conseil houblons V6, 1er tour | non fourni | low | inconnus | 1149 ms | 0.0000 CHF | HTTP 400 (refusé avant génération) |
| 101 | 16.10 16:50 | D2 | diagnostic · corps réel complet en AUTO | gemini-3.8-flash · low · conseil houblons V6, 1er tour | gemini-3.8-flash | low | 9131 / 50 | 1650 ms | 0.0176 CHF | HTTP 200 |
| 102 | 16.10 16:50 | D3 | diagnostic · finish V6 tel quel | gemini-3.8-flash · low · finish V6 seul, ANY | non fourni | low | inconnus | 1856 ms | 0.0000 CHF | HTTP 400 (refusé avant génération) |
| 103 | 16.10 16:50 | D3 | diagnostic · sans anyOf/null | gemini-3.8-flash · low · finish V6 seul, ANY | non fourni | low | inconnus | 1548 ms | 0.0000 CHF | HTTP 400 (refusé avant génération) |
| 104 | 16.10 16:50 | D3 | diagnostic · sans additionalProperties | gemini-3.8-flash · low · finish V6 seul, ANY | non fourni | low | inconnus | 1228 ms | 0.0000 CHF | HTTP 400 (refusé avant génération) |
| 105 | 16.10 16:50 | D3 | diagnostic · sans anyOf/null ni additionalProperties | gemini-3.8-flash · low · finish V6 seul, ANY | non fourni | low | inconnus | 1209 ms | 0.0000 CHF | HTTP 400 (refusé avant génération) |
| 106 | 16.10 16:51 | C5c | conseil-houblons · hh-lecture | gemini-3.8-flash · low · appel-auto · analysis1 | gemini-3.8-flash | low | 9131 / 43 | 1836 ms | 0.0175 CHF | HTTP 200 |
| 107 | 16.10 16:51 | C5c | conseil-houblons · hh-lecture | gemini-3.8-flash · low · appel-auto · analysis2 | gemini-3.8-flash | low | 38899 / 21 | 1780 ms | 0.0731 CHF | HTTP 200 |
| 108 | 16.10 16:51 | C5c | conseil-houblons · hh-lecture | gemini-3.8-flash · low · appel-auto · analysis3 | gemini-3.8-flash | low | 40874 / 2211 | 18650 ms | 0.0974 CHF | HTTP 200 |
| 109 | 16.10 16:51 | C5c | conseil-houblons · hh-lecture | gemini-3.8-flash · low · appel-auto · analysis4 | gemini-3.8-flash | low | 43081 / 2038 | 15685 ms | 0.0999 CHF | HTTP 200 |
| 110 | 16.10 16:52 | C5c | conseil-houblons · hh-lecture | gemini-3.8-flash · low · appel-auto · analysis5 | gemini-3.8-flash | low | 45149 / 2023 | 11936 ms | 0.1036 CHF | HTTP 200 |
| 111 | 16.10 16:52 | C5c | conseil-houblons · hh-lecture | gemini-3.8-flash · low · appel-auto · analysis6 | gemini-3.8-flash | low | 47216 / 2033 | 12924 ms | 0.1076 CHF | HTTP 200 |
| 112 | 16.10 16:52 | C5c | conseil-houblons · hh-lecture | gemini-3.8-flash · low · appel-auto · analysis7 | gemini-3.8-flash | low | 49292 / 2045 | 11502 ms | 0.1116 CHF | HTTP 200 |
| 113 | 16.10 16:52 | C5c | conseil-houblons · hh-lecture | gemini-3.8-flash · low · appel-auto · analysis8 | gemini-3.8-flash | low | 51415 / 2053 | 11795 ms | 0.1157 CHF | HTTP 200 |
| 114 | 16.10 16:53 | C5c | conseil-houblons · hh-lecture | gemini-3.8-flash · low · appel-auto · analysis9 | gemini-3.8-flash | low | 53539 / 2029 | 13711 ms | 0.1194 CHF | HTTP 200 |
| 115 | 16.10 16:53 | C5c | conseil-houblons · hh-lecture | gemini-3.8-flash · low · appel-auto · analysis10 | gemini-3.8-flash | low | 53457 / 1918 | 11988 ms | 0.1182 CHF | HTTP 200 |
| 116 | 16.10 20:04 | C6 | fiche · fiche-levure-s04 | gemini-3.8-flash · low · appel | gemini-3.8-flash | low | 1392 / 1670 | 14452 ms | 0.3683 CHF | HTTP 200 |
| 117 | 16.10 20:04 | C6 | fiche · fiche-levure-m20 | gemini-3.8-flash · low · appel | gemini-3.8-flash | low | 1396 / 1196 | 10049 ms | 0.3638 CHF | HTTP 200 |
| 118 | 16.10 20:04 | C6 | fiche · fiche-levure-s04 | gemini-3.5-flash-lite · minimal · appel | gemini-3.5-flash-lite | minimal | 1392 / 1006 | 3809 ms | 0.3537 CHF | HTTP 200 |
| 119 | 16.10 20:04 | C6 | fiche · fiche-levure-m20 | gemini-3.5-flash-lite · minimal · appel | gemini-3.5-flash-lite | minimal | 1396 / 923 | 4304 ms | 0.3534 CHF | HTTP 200 |
| 120 | 16.10 20:05 | C6b | fiche · fiche-levure-s04 | gemini-3.5-flash-lite · low · appel | gemini-3.5-flash-lite | low | 1392 / 798 | 4027 ms | 0.3530 CHF | HTTP 200 |
| 121 | 16.10 20:05 | C6b | fiche · fiche-levure-m20 | gemini-3.5-flash-lite · low · appel | gemini-3.5-flash-lite | low | 1396 / 863 | 3411 ms | 0.3532 CHF | HTTP 200 |
| 122 | 16.10 20:06 | C6c | fiche · fiche-levure-s04 | gemini-3.8-flash · low · appel | gemini-3.8-flash | low | 1392 / 1631 | 12677 ms | 0.3679 CHF | HTTP 200 |
| 123 | 16.10 20:06 | C6c | fiche · fiche-levure-m20 | gemini-3.8-flash · low · appel | gemini-3.8-flash | low | 1396 / 1147 | 15557 ms | 0.3634 CHF | HTTP 200 |
| 124 | 16.10 20:06 | C6c | fiche · fiche-levure-s04 | gemini-3.5-flash-lite · low · appel | gemini-3.5-flash-lite | low | 1392 / 792 | 4434 ms | 0.3530 CHF | HTTP 200 |
| 125 | 16.10 20:07 | C6c | fiche · fiche-levure-m20 | gemini-3.5-flash-lite · low · appel | gemini-3.5-flash-lite | low | 1396 / 763 | 3152 ms | 0.3529 CHF | HTTP 200 |
| 126 | 16.10 20:07 | C7 | facture · ticket-sombre-pli | gemini-3.5-flash-lite · low · lecture · read0 | gemini-3.5-flash-lite | low | 1976 / 644 | 2814 ms | 0.0028 CHF | HTTP 200 |
| 127 | 16.10 20:07 | C7 | facture · ticket-long-tva | gemini-3.5-flash-lite · low · lecture · read0 | gemini-3.5-flash-lite | low | 1926 / 2485 | 5854 ms | 0.0085 CHF | HTTP 200 |
| 128 | 16.10 20:07 | C7 | facture · ticket-etranger | gemini-3.5-flash-lite · low · lecture · read0 | gemini-3.5-flash-lite | low | 1946 / 875 | 4044 ms | 0.0035 CHF | HTTP 200 |
| 129 | 16.10 20:07 | C7 | facture · deux-documents | gemini-3.5-flash-lite · low · lecture · read0 | gemini-3.5-flash-lite | low | 1941 / 530 | 2306 ms | 0.0024 CHF | HTTP 200 |
| 130 | 16.10 20:07 | C7 | facture · ticket-thermique-pali | gemini-3.5-flash-lite · low · lecture · read0 | gemini-3.5-flash-lite | low | 1958 / 719 | 2478 ms | 0.0030 CHF | HTTP 200 |
| 131 | 16.10 20:07 | C7 | facture · ticket-froisse-ombre | gemini-3.5-flash-lite · low · lecture · read0 | gemini-3.5-flash-lite | low | 1958 / 779 | 3892 ms | 0.0032 CHF | HTTP 200 |
| 132 | 16.10 20:08 | C7 | facture · ticket-coupe | gemini-3.5-flash-lite · low · lecture · read0 | gemini-3.5-flash-lite | low | 1955 / 825 | 2892 ms | 0.0033 CHF | HTTP 200 |
| 133 | 16.10 20:08 | C7 | facture · ticket-italien-eur | gemini-3.5-flash-lite · low · lecture · read0 | gemini-3.5-flash-lite | low | 1946 / 509 | 2359 ms | 0.0023 CHF | HTTP 200 |
| 134 | 16.10 20:08 | C7 | facture · facture-a4-photo | gemini-3.5-flash-lite · low · lecture · read0 | gemini-3.5-flash-lite | low | 1946 / 756 | 2953 ms | 0.0031 CHF | HTTP 200 |
| 135 | 16.10 20:08 | C7 | facture · quittance-manuscrite | gemini-3.5-flash-lite · low · lecture · read0 | gemini-3.5-flash-lite | low | 1946 / 370 | 2460 ms | 0.0019 CHF | HTTP 200 |
| 136 | 16.10 20:08 | C7 | facture · ticket-thermique-pali | gemini-3.8-flash · low · lecture · read0 | gemini-3.8-flash | low | 1958 / 544 | 4342 ms | 0.0088 CHF | HTTP 200 |
| 137 | 16.10 20:08 | C7 | facture · ticket-froisse-ombre | gemini-3.8-flash · low · lecture · read0 | gemini-3.8-flash | low | 1958 / 548 | 4473 ms | 0.0088 CHF | HTTP 200 |
| 138 | 16.10 20:08 | C7 | facture · ticket-coupe | gemini-3.8-flash · low · lecture · read0 | gemini-3.8-flash | low | 1955 / 486 | 4098 ms | 0.0082 CHF | HTTP 200 |
| 139 | 16.10 20:08 | C7 | facture · ticket-italien-eur | gemini-3.8-flash · low · lecture · read0 | gemini-3.8-flash | low | 1946 / 550 | 4441 ms | 0.0088 CHF | HTTP 200 |
| 140 | 16.10 20:08 | C7 | facture · facture-a4-photo | gemini-3.8-flash · low · lecture · read0 | gemini-3.8-flash | low | 1946 / 542 | 4222 ms | 0.0087 CHF | HTTP 200 |
| 141 | 16.10 20:08 | C7 | facture · quittance-manuscrite | gemini-3.8-flash · low · lecture · read0 | gemini-3.8-flash | low | 1946 / 362 | 3950 ms | 0.0070 CHF | HTTP 200 |
| 142 | 16.10 20:08 | C7 | facture · facture-a4-photo | gemini-3.8-flash · low · read0 | gemini-3.8-flash | low | 1946 / 816 | 7298 ms | 0.0113 CHF | HTTP 200 |
| 143 | 16.10 20:08 | C7 | facture · facture-a4-photo | gemini-3.8-flash · low · read1 | gemini-3.8-flash | low | 1967 / 802 | 7507 ms | 0.0112 CHF | HTTP 200 |
| 144 | 16.10 20:08 | C7 | facture · facture-a4-photo | gemini-3.8-flash · low · read2 | gemini-3.8-flash | low | 1982 / 844 | 7748 ms | 0.0116 CHF | HTTP 200 |
| 145 | 16.10 20:09 | C8 | levure-choix · cl-levure-propre | gemini-4-argon · low · analysis1 | gemini-4-argon | low | 16698 / 43 | 21055 ms | 0.0846 CHF | HTTP 200 |
| 146 | 16.10 20:10 | C8 | levure-choix · cl-levure-propre | gemini-4-argon · low · analysis2 | non fourni | low | inconnus | 0 ms | inconnu | TimeoutError |
| 148 | 16.10 21:11 | H13R | facture · doc1 | gemini-3.8-flash · low · read1 | gemini-3.8-flash | low | 1965 / 1092 | 9916 ms | 0.0139 CHF | HTTP 200 |
| 147 | 16.10 21:11 | H13R | facture · doc1 | gemini-3.8-flash · low · read0 | gemini-3.8-flash | low | 1944 / 1340 | 10158 ms | 0.0162 CHF | HTTP 200 |
| 149 | 16.10 21:11 | H13R | facture · doc1 | gemini-3.8-flash · low · read2 | gemini-3.8-flash | low | 1980 / 1227 | 9895 ms | 0.0152 CHF | HTTP 200 |
| 151 | 16.10 21:11 | H13R | facture · doc2 | gemini-3.8-flash · low · read1 | gemini-3.8-flash | low | 1965 / 1066 | 8891 ms | 0.0137 CHF | HTTP 200 |
| 150 | 16.10 21:11 | H13R | facture · doc2 | gemini-3.8-flash · low · read0 | gemini-3.8-flash | low | 1944 / 1076 | 9139 ms | 0.0137 CHF | HTTP 200 |
| 152 | 16.10 21:12 | H13R | facture · doc2 | gemini-3.8-flash · low · read2 | gemini-3.8-flash | low | 1980 / 655 | 6202 ms | 0.0099 CHF | HTTP 200 |
| 153 | 16.10 21:12 | H13R | facture · doc3 | gemini-3.8-flash · low · read0 | gemini-3.8-flash | low | 1944 / 685 | 7332 ms | 0.0101 CHF | HTTP 200 |
| 154 | 16.10 21:12 | H13R | facture · doc3 | gemini-3.8-flash · low · read1 | gemini-3.8-flash | low | 1965 / 481 | 7896 ms | 0.0082 CHF | HTTP 200 |
| 155 | 16.10 21:12 | H13R | facture · doc3 | gemini-3.8-flash · low · read2 | gemini-3.8-flash | low | 1980 / 686 | 6462 ms | 0.0101 CHF | HTTP 200 |
| 156 | 16.10 21:12 | H13R | facture · doc4 | gemini-3.8-flash · low · read0 | gemini-3.8-flash | low | 1944 / 433 | 5471 ms | 0.0077 CHF | HTTP 200 |
| 157 | 16.10 21:12 | H13R | facture · doc4 | gemini-3.8-flash · low · read1 | gemini-3.8-flash | low | 1965 / 647 | 6665 ms | 0.0097 CHF | HTTP 200 |
| 158 | 16.10 21:12 | H13R | facture · doc1 | gemini-3.8-flash · low · lecture · read0 | gemini-3.8-flash | low | 1944 / 1301 | 10241 ms | 0.0158 CHF | HTTP 200 |
| 159 | 16.10 21:12 | H13R | facture · doc2 | gemini-3.8-flash · low · lecture · read0 | gemini-3.8-flash | low | 1944 / 1019 | 8125 ms | 0.0132 CHF | HTTP 200 |
| 160 | 16.10 21:12 | H13R | facture · doc3 | gemini-3.8-flash · low · lecture · read0 | gemini-3.8-flash | low | 1944 / 747 | 7476 ms | 0.0106 CHF | HTTP 200 |
| 161 | 16.10 21:12 | H13R | facture · doc4 | gemini-3.8-flash · low · lecture · read0 | gemini-3.8-flash | low | 1944 / 442 | 69119 ms | 0.0078 CHF | HTTP 200 |
| 162 | 17.10 01:08 | H13R-2 | facture · doc5 | gemini-3.8-flash · low · read0 | gemini-3.8-flash | low | 1938 / 2678 | 14034 ms | 0.0287 CHF | HTTP 200 |
| 163 | 17.10 01:08 | H13R-2 | facture · doc5 | gemini-3.8-flash · low · read1 | gemini-3.8-flash | low | 1959 / 4011 | 19661 ms | 0.0413 CHF | HTTP 200 |
| 164 | 17.10 01:08 | H13R-2 | facture · doc5 | gemini-3.8-flash · low · read2 | gemini-3.8-flash | low | 1974 / 2605 | 13434 ms | 0.0281 CHF | HTTP 200 |
| 166 | 17.10 01:09 | H13R-2 | facture · doc6 | gemini-3.8-flash · low · read1 | gemini-3.8-flash | low | 1965 / 2221 | 11896 ms | 0.0245 CHF | HTTP 200 |
| 165 | 17.10 01:09 | H13R-2 | facture · doc6 | gemini-3.8-flash · low · read0 | gemini-3.8-flash | low | 1944 / 2201 | 12299 ms | 0.0243 CHF | HTTP 200 |
| 167 | 17.10 01:09 | H13R-2 | facture · doc6 | gemini-3.8-flash · low · read2 | gemini-3.8-flash | low | 1980 / 2124 | 10734 ms | 0.0236 CHF | HTTP 200 |
| 168 | 17.10 01:09 | H13R-2 | facture · doc5 | gemini-3.8-flash · low · lecture · read0 | gemini-3.8-flash | low | 1938 / 2534 | 13185 ms | 0.0274 CHF | HTTP 200 |
| 169 | 17.10 01:09 | H13R-2 | facture · doc6 | gemini-3.8-flash · low · lecture · read0 | gemini-3.8-flash | low | 1944 / 2139 | 11774 ms | 0.0237 CHF | HTTP 200 |
| 170 | 17.10 01:09 | H13R-2 | facture · doc5 | gemini-3.8-flash · low · lecture · read0 | gemini-3.8-flash | low | 1938 / 2543 | 14142 ms | 0.0275 CHF | HTTP 200 |
| 171 | 17.10 01:10 | H13R-2 | facture · doc6 | gemini-3.8-flash · low · lecture · read0 | gemini-3.8-flash | low | 1944 / 2138 | 10871 ms | 0.0237 CHF | HTTP 200 |

## Banc réel #91 (H9, décision humaine du 13.10 à 07:19) — enveloppe séparée de G38

- Modèles : `gemini-3.5-flash-lite` et `gemini-3.8-flash` seulement, champ `model` vérifié à chaque réponse ; verrou de
  production « 3.8 seul » intact (le banc passe par un chemin de test dédié, opt-in `requirePaidAiTestOptIn`).
- Bornes : **100 appels au plus, 25 par lancement, 5 CHF estimés** (`functions/src/geminiCosts.ts`) ; garde
  `scripts/gemini-usage-bench-guard.mjs` réglée par la ligne `H9-AUTORISATION` de `decisions-humaines.md` (50 + 50).
- Données : fixtures synthétiques seulement (`tests/fixtures/gemini-usage-bench/`) ; jamais dans `npm test`.

**Compteur #91 : 96 / 100 · 1.0115 CHF / 5** (gemini-3.8-flash 49 / 50 ; gemini-3.5-flash-lite 47 / 50)

| # | Heure | Lancement | Usage · cas | Architecture | Modèle observé | Réflexion | Tokens entrée / sortie | Latence | Coût estimé | Résultat |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 13.10 09:48 | R1 | coa · coa-simple | gemini-3.8-flash · low · appel | gemini-3.8-flash | low | 1390 / 454 | 5082 ms | 0.0069 CHF | HTTP 200 |
| 2 | 13.10 09:48 | R1 | coa · coa-piege | gemini-3.8-flash · low · appel | gemini-3.8-flash | low | 1922 / 960 | 6514 ms | 0.0126 CHF | HTTP 200 |
| 3 | 13.10 09:49 | R1 | coa · coa-photo-lecteur | gemini-3.8-flash · low · appel | gemini-3.8-flash | low | 1950 / 462 | 4164 ms | 0.0080 CHF | HTTP 200 |
| 4 | 13.10 09:49 | R1 | coa · coa-simple | gemini-3.5-flash-lite · minimal · appel | gemini-3.5-flash-lite | minimal | 1390 / 694 | 2154 ms | 0.0027 CHF | HTTP 200 |
| 5 | 13.10 09:49 | R1 | coa · coa-piege | gemini-3.5-flash-lite · minimal · appel | gemini-3.5-flash-lite | minimal | 1922 / 890 | 2339 ms | 0.0035 CHF | HTTP 200 |
| 6 | 13.10 09:49 | R1 | coa · coa-photo-lecteur | gemini-3.5-flash-lite · minimal · appel | gemini-3.5-flash-lite | minimal | 1950 / 682 | 1944 ms | 0.0029 CHF | HTTP 200 |
| 7 | 13.10 09:49 | R1 | diagnostic · diag-bloquee | gemini-3.8-flash · low · appel | gemini-3.8-flash | low | 518 / 432 | 4597 ms | 0.0050 CHF | HTTP 200 |
| 8 | 13.10 09:49 | R1 | diagnostic · diag-normale | gemini-3.8-flash · low · appel | gemini-3.8-flash | low | 485 / 277 | 4120 ms | 0.0035 CHF | HTTP 200 |
| 9 | 13.10 09:49 | R1 | diagnostic · diag-bloquee | gemini-3.5-flash-lite · low · appel | gemini-3.5-flash-lite | low | 518 / 337 | 1570 ms | 0.0012 CHF | HTTP 200 |
| 10 | 13.10 09:49 | R1 | diagnostic · diag-normale | gemini-3.5-flash-lite · low · appel | gemini-3.5-flash-lite | low | 485 / 203 | 1177 ms | 0.0008 CHF | HTTP 200 |
| 11 | 13.10 09:49 | R1 | relecture · relecture-defauts | gemini-3.8-flash · high · appel | gemini-3.8-flash | high | 1025 / 2865 | 21707 ms | 0.0288 CHF | HTTP 200 |
| 12 | 13.10 09:49 | R1 | relecture · relecture-saine | gemini-3.8-flash · high · appel | gemini-3.8-flash | high | 1053 / 4485 | 33246 ms | 0.0440 CHF | HTTP 200 |
| 13 | 13.10 09:50 | R1 | relecture · relecture-defauts | gemini-3.5-flash-lite · low · appel | gemini-3.5-flash-lite | low | 1025 / 311 | 1366 ms | 0.0014 CHF | HTTP 200 |
| 14 | 13.10 09:50 | R1 | relecture · relecture-saine | gemini-3.5-flash-lite · low · appel | gemini-3.5-flash-lite | low | 1053 / 145 | 1053 ms | 0.0008 CHF | HTTP 200 |
| 15 | 13.10 09:50 | R1 | import · import-brown-ale | gemini-3.8-flash · high · appel | non fourni | high | inconnus | 0 ms | inconnu | TimeoutError |
| 16 | 13.10 09:52 | R1 | import · import-photo-metrique | gemini-3.8-flash · high · appel | non fourni | high | inconnus | 0 ms | inconnu | TimeoutError |
| 17 | 13.10 09:53 | R1 | import · import-brown-ale | gemini-3.5-flash-lite · minimal · appel | gemini-3.5-flash-lite | minimal | 2805 / 669 | 2585 ms | inconnu | HTTP 200 |
| 18 | 13.10 09:53 | R1 | import · import-photo-metrique | gemini-3.5-flash-lite · minimal · appel | gemini-3.5-flash-lite | minimal | 3358 / 310 | 3636 ms | inconnu | HTTP 200 |
| 19 | 13.10 09:55 | R2 | fiche · fiche-variete-fictive | gemini-3.8-flash · low · appel | gemini-3.8-flash | low | 870 / 53 | 6941 ms | 0.0021 CHF | HTTP 200 |
| 20 | 13.10 09:55 | R2 | fiche · fiche-levure-s04 | gemini-3.8-flash · low · appel | gemini-3.8-flash | low | 1329 / 11993 | 68597 ms | 0.1149 CHF | HTTP 200 |
| 21 | 13.10 09:57 | R2 | fiche · fiche-variete-fictive | gemini-3.5-flash-lite · minimal · appel | gemini-3.5-flash-lite | minimal | 870 / 53 | 3587 ms | 0.0005 CHF | HTTP 200 |
| 22 | 13.10 09:57 | R2 | fiche · fiche-levure-s04 | gemini-3.5-flash-lite · minimal · appel | gemini-3.5-flash-lite | minimal | 1329 / 11993 | 23207 ms | 0.0380 CHF | HTTP 200 |
| 23 | 13.10 09:57 | R2 | compagnon · compagnon-puissance | gemini-3.8-flash · low · appel | gemini-3.8-flash | low | 10750 / 35 | 3825 ms | 0.0205 CHF | HTTP 200 |
| 24 | 13.10 09:57 | R2 | compagnon · compagnon-injection | gemini-3.8-flash · low · appel | gemini-3.8-flash | low | 10745 / 220 | 4429 ms | 0.0222 CHF | HTTP 200 |
| 25 | 13.10 09:57 | R2 | compagnon · compagnon-puissance | gemini-3.5-flash-lite · low · appel | gemini-3.5-flash-lite | low | 10750 / 35 | 938 ms | 0.0041 CHF | HTTP 200 |
| 26 | 13.10 09:57 | R2 | compagnon · compagnon-injection | gemini-3.5-flash-lite · low · appel | gemini-3.5-flash-lite | low | 10745 / 511 | 2721 ms | 0.0056 CHF | HTTP 200 |
| 27 | 13.10 09:57 | R2 | recherche · recherche-levure | gemini-3.8-flash · low · appel | gemini-3.8-flash | low | 91 / 382 | 7192 ms | 0.0213 CHF | HTTP 200 |
| 28 | 13.10 09:57 | R2 | recherche · recherche-style | gemini-3.8-flash · low · appel | gemini-3.8-flash | low | 94 / 263 | 7599 ms | 0.0201 CHF | HTTP 200 |
| 29 | 13.10 09:57 | R2 | recherche · recherche-levure | gemini-3.5-flash-lite · minimal · appel | gemini-3.5-flash-lite | minimal | 91 / 269 | 2480 ms | 0.0184 CHF | HTTP 200 |
| 30 | 13.10 09:58 | R2 | recherche · recherche-style | gemini-3.5-flash-lite · minimal · appel | gemini-3.5-flash-lite | minimal | 94 / 218 | 3493 ms | 0.0182 CHF | HTTP 200 |
| 31 | 13.10 09:58 | R3 | facture · facture-image | chaîne triage-lite>3.8 · minimal · triage | gemini-3.5-flash-lite | minimal | 736 / 71 | 1320 ms | 0.0005 CHF | HTTP 200 |
| 32 | 13.10 09:58 | R3 | facture · facture-image | chaîne triage-lite>3.8 · minimal · read0 | gemini-3.8-flash | low | 1954 / 700 | 6469 ms | 0.0102 CHF | HTTP 200 |
| 33 | 13.10 09:58 | R3 | facture · ticket-net | chaîne triage-lite>3.8 · minimal · triage | gemini-3.5-flash-lite | minimal | 754 / 67 | 935 ms | 0.0005 CHF | HTTP 200 |
| 34 | 13.10 09:58 | R3 | facture · ticket-net | chaîne triage-lite>3.8 · minimal · read0 | gemini-3.8-flash | low | 1939 / 421 | 4860 ms | 0.0076 CHF | HTTP 200 |
| 35 | 13.10 09:59 | R3 | facture · ticket-sombre-pli | chaîne triage-lite>3.8 · minimal · triage | gemini-3.5-flash-lite | minimal | 754 / 74 | 1116 ms | 0.0005 CHF | HTTP 200 |
| 36 | 13.10 09:59 | R3 | facture · ticket-sombre-pli | chaîne triage-lite>3.8 · minimal · read0 | gemini-3.8-flash | low | 1976 / 703 | 6736 ms | 0.0103 CHF | HTTP 200 |
| 37 | 13.10 09:59 | R3 | facture · ticket-long-tva | chaîne triage-lite>3.8 · minimal · triage | gemini-3.5-flash-lite | minimal | 726 / 71 | 1150 ms | 0.0005 CHF | HTTP 200 |
| 38 | 13.10 09:59 | R3 | facture · ticket-long-tva | chaîne triage-lite>3.8 · minimal · read0 | gemini-3.8-flash | low | 1926 / 1799 | 12701 ms | 0.0205 CHF | HTTP 200 |
| 39 | 13.10 09:59 | R3 | facture · ticket-etranger | chaîne triage-lite>3.8 · minimal · triage | gemini-3.5-flash-lite | minimal | 740 / 76 | 1055 ms | 0.0005 CHF | HTTP 200 |
| 40 | 13.10 09:59 | R3 | facture · ticket-etranger | chaîne triage-lite>3.8 · minimal · read0 | gemini-3.8-flash | low | 1946 / 990 | 7512 ms | 0.0129 CHF | HTTP 200 |
| 41 | 13.10 09:59 | R3 | facture · deux-documents | chaîne triage-lite>3.8 · minimal · triage | gemini-3.5-flash-lite | minimal | 748 / 46 | 1003 ms | 0.0004 CHF | HTTP 200 |
| 42 | 13.10 09:59 | R3 | facture · deux-documents | chaîne triage-lite>3.8 · minimal · read0 | gemini-3.8-flash | low | 1941 / 584 | 5851 ms | 0.0091 CHF | HTTP 200 |
| 43 | 13.10 09:59 | R3 | facture · bulletin-photo | chaîne triage-lite>3.8 · minimal · triage | gemini-3.5-flash-lite | minimal | 748 / 66 | 1280 ms | 0.0005 CHF | HTTP 200 |
| 44 | 13.10 09:59 | R3 | facture · bulletin-photo | chaîne triage-lite>3.8 · minimal · read0 | gemini-3.8-flash | low | 1968 / 371 | 4616 ms | 0.0072 CHF | HTTP 200 |
| 45 | 13.10 09:59 | R3 | facture · coa-photo | chaîne triage-lite>3.8 · minimal · triage | gemini-3.5-flash-lite | minimal | 740 / 61 | 1365 ms | 0.0005 CHF | HTTP 200 |
| 46 | 13.10 09:59 | R3 | facture · coa-photo | chaîne triage-lite>3.8 · minimal · read0 | gemini-3.8-flash | low | 1958 / 241 | 3895 ms | 0.0059 CHF | HTTP 200 |
| 47 | 13.10 09:59 | R3 | facture · illisible | chaîne triage-lite>3.8 · minimal · triage | gemini-3.5-flash-lite | minimal | 736 / 63 | 1252 ms | 0.0005 CHF | HTTP 200 |
| 48 | 13.10 09:59 | R3 | facture · illisible | chaîne triage-lite>3.8 · minimal · read0 | gemini-3.8-flash | low | 1951 / 111 | 3023 ms | 0.0047 CHF | HTTP 200 |
| 49 | 13.10 09:59 | R3 | facture · hors-sujet | chaîne triage-lite>3.8 · minimal · triage | gemini-3.5-flash-lite | minimal | 754 / 64 | 1150 ms | 0.0005 CHF | HTTP 200 |
| 50 | 13.10 09:59 | R3 | facture · hors-sujet | chaîne triage-lite>3.8 · minimal · read0 | gemini-3.8-flash | low | 1939 / 274 | 3875 ms | 0.0062 CHF | HTTP 200 |
| 51 | 13.10 10:00 | R4 | facture · ticket-sombre-pli | chaîne lite>controle-3.8 · minimal · read0 | gemini-3.5-flash-lite | minimal | 1976 / 638 | 2167 ms | 0.0027 CHF | HTTP 200 |
| 52 | 13.10 10:00 | R4 | facture · ticket-sombre-pli | chaîne lite>controle-3.8 · minimal · control | gemini-3.8-flash | low | 2384 / 492 | 5042 ms | 0.0091 CHF | HTTP 200 |
| 53 | 13.10 10:00 | R4 | facture · ticket-long-tva | chaîne lite>controle-3.8 · minimal · read0 | gemini-3.5-flash-lite | minimal | 1926 / 2543 | 5424 ms | 0.0087 CHF | HTTP 200 |
| 54 | 13.10 10:00 | R4 | facture · ticket-long-tva | chaîne lite>controle-3.8 · minimal · control | gemini-3.8-flash | low | 3421 / 1718 | 11434 ms | 0.0225 CHF | HTTP 200 |
| 55 | 13.10 10:00 | R4 | facture · ticket-etranger | chaîne lite>controle-3.8 · minimal · read0 | gemini-3.5-flash-lite | minimal | 1946 / 920 | 2562 ms | 0.0036 CHF | HTTP 200 |
| 56 | 13.10 10:00 | R4 | facture · ticket-etranger | chaîne lite>controle-3.8 · minimal · control | gemini-3.8-flash | low | 2539 / 965 | 7664 ms | 0.0138 CHF | HTTP 200 |
| 57 | 13.10 10:00 | R4 | facture · deux-documents | chaîne lite>controle-3.8 · minimal · read0 | gemini-3.5-flash-lite | minimal | 1941 / 506 | 1765 ms | 0.0023 CHF | HTTP 200 |
| 58 | 13.10 10:00 | R4 | facture · deux-documents | chaîne lite>controle-3.8 · minimal · control | gemini-3.8-flash | low | 2272 / 362 | 3797 ms | 0.0077 CHF | HTTP 200 |
| 59 | 13.10 10:00 | R4 | facture · facture-image | gemini-3.5-flash-lite · minimal · lecture · read0 | gemini-3.5-flash-lite | minimal | 1954 / 612 | 2042 ms | 0.0026 CHF | HTTP 200 |
| 60 | 13.10 10:01 | R4 | facture · ticket-net | gemini-3.5-flash-lite · minimal · lecture · read0 | gemini-3.5-flash-lite | minimal | 1939 / 610 | 2727 ms | 0.0026 CHF | HTTP 200 |
| 61 | 13.10 10:01 | R4 | facture · bulletin-photo | gemini-3.5-flash-lite · minimal · lecture · read0 | gemini-3.5-flash-lite | minimal | 1968 / 630 | 1978 ms | 0.0027 CHF | HTTP 200 |
| 62 | 13.10 10:01 | R4 | facture · coa-photo | gemini-3.5-flash-lite · minimal · lecture · read0 | gemini-3.5-flash-lite | minimal | 1958 / 267 | 1372 ms | 0.0016 CHF | HTTP 200 |
| 63 | 13.10 10:01 | R4 | facture · illisible | gemini-3.5-flash-lite · minimal · lecture · read0 | gemini-3.5-flash-lite | minimal | 1951 / 309 | 1343 ms | 0.0017 CHF | HTTP 200 |
| 64 | 13.10 10:01 | R4 | facture · hors-sujet | gemini-3.5-flash-lite · minimal · lecture · read0 | gemini-3.5-flash-lite | minimal | 1939 / 416 | 1721 ms | 0.0020 CHF | HTTP 200 |
| 65 | 13.10 10:01 | R5 | facture · ticket-sombre-pli | gemini-3.8-flash · low · read0 | gemini-3.8-flash | low | 1976 / 791 | 6735 ms | 0.0111 CHF | HTTP 200 |
| 66 | 13.10 10:01 | R5 | facture · ticket-sombre-pli | gemini-3.8-flash · low · read1 | gemini-3.8-flash | low | 1997 / 745 | 6840 ms | 0.0107 CHF | HTTP 200 |
| 67 | 13.10 10:01 | R5 | facture · ticket-sombre-pli | gemini-3.8-flash · low · read2 | gemini-3.8-flash | low | 2012 / 803 | 6771 ms | 0.0113 CHF | HTTP 200 |
| 68 | 13.10 10:01 | R5 | facture · ticket-long-tva | gemini-3.8-flash · low · read0 | gemini-3.8-flash | low | 1926 / 1640 | 10786 ms | 0.0190 CHF | HTTP 200 |
| 69 | 13.10 10:01 | R5 | facture · ticket-long-tva | gemini-3.8-flash · low · read1 | gemini-3.8-flash | low | 1947 / 2842 | 17009 ms | 0.0303 CHF | HTTP 200 |
| 70 | 13.10 10:02 | R5 | facture · ticket-long-tva | gemini-3.8-flash · low · read2 | gemini-3.8-flash | low | 1962 / 2715 | 16695 ms | 0.0291 CHF | HTTP 200 |
| 72 | 13.10 10:02 | R5 | facture · ticket-sombre-pli | chaîne lecteurs-lite+controle-3.8 · minimal · read1 | gemini-3.5-flash-lite | minimal | 1997 / 648 | 1977 ms | 0.0028 CHF | HTTP 200 |
| 71 | 13.10 10:02 | R5 | facture · ticket-sombre-pli | chaîne lecteurs-lite+controle-3.8 · minimal · read0 | gemini-3.5-flash-lite | minimal | 1976 / 666 | 2050 ms | 0.0028 CHF | HTTP 200 |
| 73 | 13.10 10:02 | R5 | facture · ticket-sombre-pli | chaîne lecteurs-lite+controle-3.8 · minimal · read2 | gemini-3.8-flash | low | 2012 / 778 | 6425 ms | 0.0111 CHF | HTTP 200 |
| 74 | 13.10 10:02 | R5 | facture · ticket-long-tva | chaîne lecteurs-lite+controle-3.8 · minimal · read0 | gemini-3.5-flash-lite | minimal | 1926 / 2539 | 5289 ms | 0.0087 CHF | HTTP 200 |
| 75 | 13.10 10:02 | R5 | facture · ticket-long-tva | chaîne lecteurs-lite+controle-3.8 · minimal · read1 | gemini-3.5-flash-lite | minimal | 1947 / 2515 | 5414 ms | 0.0086 CHF | HTTP 200 |
| 76 | 13.10 10:02 | R5 | facture · ticket-long-tva | chaîne lecteurs-lite+controle-3.8 · minimal · read2 | gemini-3.8-flash | low | 1962 / 1670 | 11550 ms | 0.0193 CHF | HTTP 200 |
| 77 | 13.10 10:02 | R5 | facture · ticket-long-tva | gemini-3.8-flash · medium · lecture · read0 | gemini-3.8-flash | medium | 1926 / 4235 | 26858 ms | 0.0433 CHF | HTTP 200 |
| 78 | 13.10 10:03 | R5 | facture · ticket-etranger | gemini-3.8-flash · medium · lecture · read0 | gemini-3.8-flash | medium | 1946 / 1805 | 12851 ms | 0.0206 CHF | HTTP 200 |
| 79 | 13.10 10:03 | R5 | facture · ticket-long-tva | gemini-3.5-flash-lite · low · lecture · read0 | gemini-3.5-flash-lite | low | 1926 / 2519 | 5286 ms | 0.0086 CHF | HTTP 200 |
| 80 | 13.10 10:03 | R5 | facture · ticket-etranger | gemini-3.5-flash-lite · low · lecture · read0 | gemini-3.5-flash-lite | low | 1946 / 871 | 2386 ms | 0.0035 CHF | HTTP 200 |
| 81 | 13.10 10:03 | R6 | relecture · relecture-defauts | gemini-3.8-flash · low · appel | gemini-3.8-flash | low | 1025 / 518 | 6522 ms | 0.0068 CHF | HTTP 200 |
| 82 | 13.10 10:04 | R6 | relecture · relecture-saine | gemini-3.8-flash · low · appel | gemini-3.8-flash | low | 1053 / 216 | 3261 ms | 0.0040 CHF | HTTP 200 |
| 83 | 13.10 10:04 | R6 | import · import-brown-ale | gemini-3.8-flash · low · appel | gemini-3.8-flash | low | 2805 / 750 | 10117 ms | 0.0123 CHF | HTTP 200 |
| 84 | 13.10 10:04 | R6 | import · import-photo-metrique | gemini-3.8-flash · low · appel | gemini-3.8-flash | low | 3358 / 796 | 8621 ms | 0.0138 CHF | HTTP 200 |
| 85 | 13.10 10:04 | R6 | relecture · relecture-defauts | gemini-3.8-flash · medium · appel | gemini-3.8-flash | medium | 1025 / 1100 | 13083 ms | 0.0122 CHF | HTTP 200 |
| 86 | 13.10 10:04 | R6 | import · import-brown-ale | gemini-3.8-flash · medium · appel | gemini-3.8-flash | medium | 2805 / 1545 | 12793 ms | 0.0197 CHF | HTTP 200 |
| 87 | 13.10 10:04 | R6 | diagnostic · diag-bloquee | gemini-3.8-flash · high · appel | gemini-3.8-flash | high | 518 / 2001 | 16644 ms | 0.0197 CHF | HTTP 200 |
| 88 | 13.10 10:05 | R6 | coa · coa-piege | gemini-3.5-flash-lite · low · appel | gemini-3.5-flash-lite | low | 1922 / 912 | 2561 ms | 0.0036 CHF | HTTP 200 |
| 89 | 13.10 10:05 | R6 | import · import-brown-ale | gemini-3.5-flash-lite · low · appel | gemini-3.5-flash-lite | low | 2805 / 436 | 1933 ms | 0.0024 CHF | HTTP 200 |
| 90 | 13.10 10:05 | R6 | relecture · relecture-defauts | gemini-3.5-flash-lite · high · appel | gemini-3.5-flash-lite | high | 1025 / 2962 | 8246 ms | 0.0096 CHF | HTTP 200 |
| 91 | 13.10 10:05 | R6 | diagnostic · diag-bloquee | gemini-3.5-flash-lite · high · appel | gemini-3.5-flash-lite | high | 518 / 1924 | 5403 ms | 0.0062 CHF | HTTP 200 |
| 92 | 13.10 10:05 | R6 | relecture · relecture-saine | gemini-3.8-flash · high · appel | non fourni | high | inconnus | 72415 ms | inconnu | modèle observé refusé |
| 93 | 13.10 10:07 | R7 | import · import-photo-metrique | gemini-3.8-flash · high · appel | non fourni | high | inconnus | 0 ms | inconnu | TimeoutError |
| 94 | 13.10 10:09 | R7 | relecture · relecture-saine | gemini-3.8-flash · high · appel | gemini-3.8-flash | high | 1053 / 6657 | 52948 ms | 0.0644 CHF | HTTP 200 |
| 95 | 13.10 10:09 | R7 | facture · ticket-sombre-pli | gemini-3.5-flash-lite · low · lecture · read0 | gemini-3.5-flash-lite | low | 1976 / 643 | 1964 ms | 0.0028 CHF | HTTP 200 |
| 96 | 13.10 10:10 | R7 | facture · deux-documents | gemini-3.5-flash-lite · low · lecture · read0 | gemini-3.5-flash-lite | low | 1941 / 451 | 1632 ms | 0.0021 CHF | HTTP 200 |
| 4 | 16.10 11:22 | #100 (D100) | d100-gemini-live.ts · fiche levure SafAle S-04 (Rapide) | gemini-3.8-flash | 1392 / 1451 | 0.3662 CHF | HTTP 200, 12127 ms, réflexion low, fin STOP |
| 5 | 16.10 11:22 | #100 (D100) | d100-gemini-live.ts · import PDF brown ale (Max demandé, Rapide imposé) | gemini-3.8-flash | 2805 / 476 | 0.3597 CHF | HTTP 200, 8292 ms, réflexion low, fin STOP |
| 6 | 16.10 16:51 | #91 (IA-B) | ia-b-gemini-live.ts · readHopCoa (Rapide) | gemini-3.5-flash-lite | 1390 / 707 | 0.0027 CHF | HTTP 200, 3061 ms, demandé gemini-3.5-flash-lite, réflexion minimal, fin STOP |
| 7 | 16.10 16:51 | #91 (IA-B) | ia-b-gemini-live.ts · diagnoseBatch (Rapide) | gemini-3.5-flash-lite | 518 / 270 | 0.0010 CHF | HTTP 200, 1831 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 8 | 16.10 16:51 | #91 (IA-B) | ia-b-gemini-live.ts · lookup_brewing_reference (compagnon) | gemini-3.5-flash-lite | 91 / 284 | 0.0184 CHF | HTTP 200, 3205 ms, demandé gemini-3.5-flash-lite, réflexion minimal, fin STOP |
| 9 | 16.10 16:51 | #91 (IA-B) | ia-b-gemini-live.ts · readHopCoa, Flash-Lite coupé simulé → 3.8 réel | gemini-3.8-flash | 1390 / 747 | 0.0096 CHF | HTTP 200, 5115 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |

## Essai IA de re-classement des substituts (ia1, #181) — enveloppe séparée

- Accord du brasseur (26.10, matin) : « Je donne mon accord pour les deux. » ; enveloppe fixée par le pilote : **100 appels au plus, 5 CHF estimés** (`geminiCosts.ts`).
- Modèles : `gemini-3.8-flash` ; `gemini-3.5-flash-lite` permis s'il est mesuré aussi bon et plus rapide ; champ `modelVersion` vérifié à chaque réponse.
- Données : fiches du catalogue (Beer Maverick, Hopsteiner), aucune donnée du brasseur. Clé jamais journalisée. Jamais dans `npm test`.
- Lanceur : `scripts/eval-hop/ia-reclassement.ts` (garde-fous de `scripts/gemini38LiveCore.ts`) ; entrées et sorties : `work/missions/2026-10-25-integration-houblons/voies/ia1-reclassement/resultats/<date>/`.
- Compteur propre à cette section : ne pas le confondre avec les autres. Une ligne par appel parti, réservée avant l'envoi.

**Compteur ia1 : 100 / 100 · 1.0980 CHF / 5**

| # | Heure | Issue | Test | Modèle observé | Tokens entrée / sortie | Coût estimé | Résultat |
|---|---|---|---|---|---|---|---|
| 1 | 26.10 07:35 | #181 (ia1) | ia-reclassement.ts · nelson-sauvin@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3897 / 542 | 0.0124 CHF | HTTP 200, 6333 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 2 | 26.10 07:35 | #181 (ia1) | ia-reclassement.ts · nelson-sauvin@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3872 / 561 | 0.0125 CHF | HTTP 200, 6185 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 3 | 26.10 07:36 | #181 (ia1) | ia-reclassement.ts · citra@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3852 / 563 | 0.0125 CHF | HTTP 200, 6771 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 4 | 26.10 07:36 | #181 (ia1) | ia-reclassement.ts · citra@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3724 / 552 | 0.0122 CHF | HTTP 200, 6802 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 5 | 26.10 07:36 | #181 (ia1) | ia-reclassement.ts · motueka@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3584 / 537 | 0.0118 CHF | HTTP 200, 6269 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 6 | 26.10 07:36 | #181 (ia1) | ia-reclassement.ts · motueka@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3480 / 577 | 0.0119 CHF | HTTP 200, 6793 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 7 | 26.10 07:36 | #181 (ia1) | ia-reclassement.ts · mosaic@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 4009 / 469 | 0.0119 CHF | HTTP 200, 6412 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 8 | 26.10 07:36 | #181 (ia1) | ia-reclassement.ts · mosaic@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3821 / 497 | 0.0118 CHF | HTTP 200, 5855 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 9 | 26.10 07:36 | #181 (ia1) | ia-reclassement.ts · galaxy@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3617 / 539 | 0.0118 CHF | HTTP 200, 6338 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 10 | 26.10 07:36 | #181 (ia1) | ia-reclassement.ts · galaxy@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3738 / 566 | 0.0123 CHF | HTTP 200, 5719 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 11 | 26.10 07:36 | #181 (ia1) | ia-reclassement.ts · simcoe@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 4036 / 538 | 0.0126 CHF | HTTP 200, 6046 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 12 | 26.10 07:36 | #181 (ia1) | ia-reclassement.ts · simcoe@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3784 / 490 | 0.0117 CHF | HTTP 200, 6492 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 13 | 26.10 07:37 | #181 (ia1) | ia-reclassement.ts · saaz-cz@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3866 / 551 | 0.0124 CHF | HTTP 200, 5238 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 14 | 26.10 07:37 | #181 (ia1) | ia-reclassement.ts · saaz-cz@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3744 / 577 | 0.0124 CHF | HTTP 200, 5946 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 15 | 26.10 07:37 | #181 (ia1) | ia-reclassement.ts · cascade@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3793 / 536 | 0.0121 CHF | HTTP 200, 6009 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 16 | 26.10 07:37 | #181 (ia1) | ia-reclassement.ts · cascade@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3653 / 549 | 0.0120 CHF | HTTP 200, 6000 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 17 | 26.10 07:37 | #181 (ia1) | ia-reclassement.ts · idaho-7@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 4089 / 588 | 0.0132 CHF | HTTP 200, 7236 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 18 | 26.10 07:37 | #181 (ia1) | ia-reclassement.ts · idaho-7@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3727 / 564 | 0.0123 CHF | HTTP 200, 5921 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 19 | 26.10 07:37 | #181 (ia1) | ia-reclassement.ts · hallertau-taurus@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3777 / 555 | 0.0123 CHF | HTTP 200, 7858 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 20 | 26.10 07:37 | #181 (ia1) | ia-reclassement.ts · hallertau-taurus@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3852 / 584 | 0.0127 CHF | HTTP 200, 6589 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 21 | 26.10 07:37 | #181 (ia1) | ia-reclassement.ts · brewers-gold@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3831 / 551 | 0.0123 CHF | HTTP 200, 5767 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 22 | 26.10 07:38 | #181 (ia1) | ia-reclassement.ts · brewers-gold@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3644 / 550 | 0.0120 CHF | HTTP 200, 6427 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 23 | 26.10 07:38 | #181 (ia1) | ia-reclassement.ts · brewers-gold-us@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3884 / 538 | 0.0123 CHF | HTTP 200, 6070 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 24 | 26.10 07:38 | #181 (ia1) | ia-reclassement.ts · brewers-gold-us@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3835 / 577 | 0.0126 CHF | HTTP 200, 5842 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 25 | 26.10 07:38 | #181 (ia1) | ia-reclassement.ts · triplepearl@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3870 / 522 | 0.0121 CHF | HTTP 200, 5901 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 26 | 26.10 07:38 | #181 (ia1) | ia-reclassement.ts · triplepearl@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3700 / 557 | 0.0122 CHF | HTTP 200, 8024 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 27 | 26.10 07:38 | #181 (ia1) | ia-reclassement.ts · sonnet@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3818 / 527 | 0.0121 CHF | HTTP 200, 6464 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 28 | 26.10 07:38 | #181 (ia1) | ia-reclassement.ts · sonnet@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3681 / 552 | 0.0121 CHF | HTTP 200, 6260 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 29 | 26.10 07:38 | #181 (ia1) | ia-reclassement.ts · whitbread-golding-variety-wgv@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3717 / 584 | 0.0124 CHF | HTTP 200, 6475 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 30 | 26.10 07:38 | #181 (ia1) | ia-reclassement.ts · whitbread-golding-variety-wgv@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3665 / 490 | 0.0115 CHF | HTTP 200, 6173 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 31 | 26.10 07:38 | #181 (ia1) | ia-reclassement.ts · marynka@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3904 / 564 | 0.0126 CHF | HTTP 200, 6248 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 32 | 26.10 07:39 | #181 (ia1) | ia-reclassement.ts · marynka@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3655 / 484 | 0.0114 CHF | HTTP 200, 6335 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 33 | 26.10 07:39 | #181 (ia1) | ia-reclassement.ts · idaho-gem@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3752 / 528 | 0.0120 CHF | HTTP 200, 6817 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 34 | 26.10 07:39 | #181 (ia1) | ia-reclassement.ts · idaho-gem@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3750 / 434 | 0.0111 CHF | HTTP 200, 4514 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 35 | 26.10 07:39 | #181 (ia1) | ia-reclassement.ts · sticklebract@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3819 / 543 | 0.0123 CHF | HTTP 200, 5804 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 36 | 26.10 07:39 | #181 (ia1) | ia-reclassement.ts · sticklebract@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3845 / 527 | 0.0121 CHF | HTTP 200, 5831 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 37 | 26.10 07:39 | #181 (ia1) | ia-reclassement.ts · magnum-us@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3770 / 556 | 0.0123 CHF | HTTP 200, 5444 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 38 | 26.10 07:39 | #181 (ia1) | ia-reclassement.ts · magnum-us@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3767 / 542 | 0.0121 CHF | HTTP 200, 6100 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 39 | 26.10 07:39 | #181 (ia1) | ia-reclassement.ts · tsingdao-flower@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3637 / 550 | 0.0120 CHF | HTTP 200, 6593 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 40 | 26.10 07:39 | #181 (ia1) | ia-reclassement.ts · tsingdao-flower@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3704 / 556 | 0.0122 CHF | HTTP 200, 6283 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 41 | 26.10 07:39 | #181 (ia1) | ia-reclassement.ts · calypso@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3996 / 530 | 0.0125 CHF | HTTP 200, 7063 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 42 | 26.10 07:40 | #181 (ia1) | ia-reclassement.ts · calypso@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3831 / 548 | 0.0123 CHF | HTTP 200, 5820 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 43 | 26.10 07:40 | #181 (ia1) | ia-reclassement.ts · herald@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3640 / 566 | 0.0121 CHF | HTTP 200, 6279 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 44 | 26.10 07:40 | #181 (ia1) | ia-reclassement.ts · herald@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3746 / 481 | 0.0115 CHF | HTTP 200, 6305 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 45 | 26.10 07:40 | #181 (ia1) | ia-reclassement.ts · callista@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3736 / 560 | 0.0123 CHF | HTTP 200, 7384 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 46 | 26.10 07:40 | #181 (ia1) | ia-reclassement.ts · callista@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3671 / 457 | 0.0112 CHF | HTTP 200, 5625 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 47 | 26.10 07:40 | #181 (ia1) | ia-reclassement.ts · green-bullet@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3778 / 520 | 0.0120 CHF | HTTP 200, 5624 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 48 | 26.10 07:40 | #181 (ia1) | ia-reclassement.ts · green-bullet@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3718 / 475 | 0.0114 CHF | HTTP 200, 6518 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 49 | 26.10 07:40 | #181 (ia1) | ia-reclassement.ts · santiam@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3800 / 515 | 0.0120 CHF | HTTP 200, 6067 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 50 | 26.10 07:40 | #181 (ia1) | ia-reclassement.ts · santiam@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3642 / 541 | 0.0119 CHF | HTTP 200, 7073 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 51 | 26.10 07:41 | #181 (ia1) | ia-reclassement.ts · agnus@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3764 / 544 | 0.0122 CHF | HTTP 200, 6226 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 52 | 26.10 07:41 | #181 (ia1) | ia-reclassement.ts · agnus@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3837 / 591 | 0.0127 CHF | HTTP 200, 6906 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 53 | 26.10 07:41 | #181 (ia1) | ia-reclassement.ts · progress@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3847 / 526 | 0.0121 CHF | HTTP 200, 6299 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 54 | 26.10 07:41 | #181 (ia1) | ia-reclassement.ts · progress@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3634 / 543 | 0.0119 CHF | HTTP 200, 6751 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 55 | 26.10 07:41 | #181 (ia1) | ia-reclassement.ts · stirling@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3770 / 560 | 0.0123 CHF | HTTP 200, 5393 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 56 | 26.10 07:41 | #181 (ia1) | ia-reclassement.ts · stirling@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3721 / 553 | 0.0122 CHF | HTTP 200, 6124 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 57 | 26.10 07:41 | #181 (ia1) | ia-reclassement.ts · opal@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3768 / 570 | 0.0124 CHF | HTTP 200, 6600 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 58 | 26.10 07:41 | #181 (ia1) | ia-reclassement.ts · opal@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3613 / 477 | 0.0112 CHF | HTTP 200, 7129 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 59 | 26.10 07:41 | #181 (ia1) | ia-reclassement.ts · spalter-select@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3826 / 571 | 0.0125 CHF | HTTP 200, 6208 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 60 | 26.10 07:42 | #181 (ia1) | ia-reclassement.ts · spalter-select@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3774 / 561 | 0.0123 CHF | HTTP 200, 6344 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 61 | 26.10 07:42 | #181 (ia1) | ia-reclassement.ts · kohatu@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3611 / 536 | 0.0118 CHF | HTTP 200, 6722 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 62 | 26.10 07:42 | #181 (ia1) | ia-reclassement.ts · kohatu@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3577 / 553 | 0.0119 CHF | HTTP 200, 6326 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 63 | 26.10 07:42 | #181 (ia1) | ia-reclassement.ts · xja2-436@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3879 / 552 | 0.0124 CHF | HTTP 200, 6003 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 64 | 26.10 07:42 | #181 (ia1) | ia-reclassement.ts · xja2-436@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3847 / 577 | 0.0126 CHF | HTTP 200, 7499 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 65 | 26.10 07:42 | #181 (ia1) | ia-reclassement.ts · relax@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3817 / 509 | 0.0119 CHF | HTTP 200, 6106 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 66 | 26.10 07:42 | #181 (ia1) | ia-reclassement.ts · relax@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3524 / 530 | 0.0116 CHF | HTTP 200, 6098 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 67 | 26.10 07:42 | #181 (ia1) | ia-reclassement.ts · multihead@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3698 / 564 | 0.0122 CHF | HTTP 200, 6433 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 68 | 26.10 07:42 | #181 (ia1) | ia-reclassement.ts · multihead@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3599 / 480 | 0.0112 CHF | HTTP 200, 5959 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 69 | 26.10 07:42 | #181 (ia1) | ia-reclassement.ts · cashmere@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3904 / 517 | 0.0122 CHF | HTTP 200, 6603 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 70 | 26.10 07:43 | #181 (ia1) | ia-reclassement.ts · cashmere@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3662 / 590 | 0.0124 CHF | HTTP 200, 7403 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 71 | 26.10 07:43 | #181 (ia1) | ia-reclassement.ts · el-dorado@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3842 / 502 | 0.0119 CHF | HTTP 200, 5862 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 72 | 26.10 07:43 | #181 (ia1) | ia-reclassement.ts · el-dorado@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3806 / 568 | 0.0125 CHF | HTTP 200, 5993 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 73 | 26.10 07:43 | #181 (ia1) | ia-reclassement.ts · flyer@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3917 / 574 | 0.0127 CHF | HTTP 200, 7159 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 74 | 26.10 07:43 | #181 (ia1) | ia-reclassement.ts · flyer@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3724 / 459 | 0.0113 CHF | HTTP 200, 6325 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 75 | 26.10 07:43 | #181 (ia1) | ia-reclassement.ts · super-pride@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3719 / 526 | 0.0119 CHF | HTTP 200, 6278 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 76 | 26.10 07:43 | #181 (ia1) | ia-reclassement.ts · super-pride@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3804 / 455 | 0.0114 CHF | HTTP 200, 7059 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 77 | 26.10 07:43 | #181 (ia1) | ia-reclassement.ts · pilgrim@dry · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3964 / 541 | 0.0125 CHF | HTTP 200, 5876 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 78 | 26.10 07:43 | #181 (ia1) | ia-reclassement.ts · pilgrim@60 · pool moteur · 3.8 · invite v1 | gemini-3.8-flash | 3840 / 554 | 0.0124 CHF | HTTP 200, 6220 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 79 | 26.10 07:47 | #181 (ia1) | ia-reclassement.ts · nelson-sauvin@dry · pool opt1 · 3.8 · invite v1 | gemini-3.8-flash | 4025 / 552 | 0.0127 CHF | HTTP 200, 7337 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 80 | 26.10 07:47 | #181 (ia1) | ia-reclassement.ts · citra@dry · pool opt1 · 3.8 · invite v1 | gemini-3.8-flash | 3959 / 555 | 0.0126 CHF | HTTP 200, 6357 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 81 | 26.10 07:47 | #181 (ia1) | ia-reclassement.ts · motueka@dry · pool opt1 · 3.8 · invite v1 | gemini-3.8-flash | 3889 / 585 | 0.0128 CHF | HTTP 200, 7244 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 82 | 26.10 07:47 | #181 (ia1) | ia-reclassement.ts · mosaic@dry · pool opt1 · 3.8 · invite v1 | gemini-3.8-flash | 4036 / 558 | 0.0128 CHF | HTTP 200, 6812 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 83 | 26.10 07:47 | #181 (ia1) | ia-reclassement.ts · galaxy@dry · pool opt1 · 3.8 · invite v1 | gemini-3.8-flash | 3823 / 540 | 0.0122 CHF | HTTP 200, 6535 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 84 | 26.10 07:47 | #181 (ia1) | ia-reclassement.ts · simcoe@dry · pool opt1 · 3.8 · invite v1 | gemini-3.8-flash | 4041 / 587 | 0.0131 CHF | HTTP 200, 7440 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 85 | 26.10 07:48 | #181 (ia1) | ia-reclassement.ts · saaz-cz@dry · pool opt1 · 3.8 · invite v1 | gemini-3.8-flash | 3763 / 538 | 0.0121 CHF | HTTP 200, 5535 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 86 | 26.10 07:48 | #181 (ia1) | ia-reclassement.ts · cascade@dry · pool opt1 · 3.8 · invite v1 | gemini-3.8-flash | 3914 / 480 | 0.0118 CHF | HTTP 200, 5549 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 87 | 26.10 07:48 | #181 (ia1) | ia-reclassement.ts · idaho-7@dry · pool opt1 · 3.8 · invite v1 | gemini-3.8-flash | 4060 / 587 | 0.0131 CHF | HTTP 200, 6262 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 88 | 26.10 07:49 | #181 (ia1) | ia-reclassement.ts · nelson-sauvin@dry · pool moteur · lite · invite v1 | gemini-3.5-flash-lite | 3897 / 553 | 0.0032 CHF | HTTP 200, 2827 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 89 | 26.10 07:49 | #181 (ia1) | ia-reclassement.ts · citra@dry · pool moteur · lite · invite v1 | gemini-3.5-flash-lite | 3852 / 569 | 0.0032 CHF | HTTP 200, 1985 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 90 | 26.10 07:49 | #181 (ia1) | ia-reclassement.ts · motueka@dry · pool moteur · lite · invite v1 | gemini-3.5-flash-lite | 3584 / 560 | 0.0031 CHF | HTTP 200, 2145 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 91 | 26.10 07:49 | #181 (ia1) | ia-reclassement.ts · mosaic@dry · pool moteur · lite · invite v1 | gemini-3.5-flash-lite | 4009 / 503 | 0.0031 CHF | HTTP 200, 1851 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 92 | 26.10 07:49 | #181 (ia1) | ia-reclassement.ts · galaxy@dry · pool moteur · lite · invite v1 | gemini-3.5-flash-lite | 3617 / 540 | 0.0030 CHF | HTTP 200, 2082 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 93 | 26.10 07:49 | #181 (ia1) | ia-reclassement.ts · simcoe@dry · pool moteur · lite · invite v1 | gemini-3.5-flash-lite | 4036 / 511 | 0.0031 CHF | HTTP 200, 1900 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 94 | 26.10 07:49 | #181 (ia1) | ia-reclassement.ts · saaz-cz@dry · pool moteur · lite · invite v1 | gemini-3.5-flash-lite | 3866 / 593 | 0.0033 CHF | HTTP 200, 2190 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 95 | 26.10 07:49 | #181 (ia1) | ia-reclassement.ts · cascade@dry · pool moteur · lite · invite v1 | gemini-3.5-flash-lite | 3793 / 532 | 0.0031 CHF | HTTP 200, 1921 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 96 | 26.10 07:49 | #181 (ia1) | ia-reclassement.ts · idaho-7@dry · pool moteur · lite · invite v1 | gemini-3.5-flash-lite | 4089 / 568 | 0.0033 CHF | HTTP 200, 1877 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 97 | 26.10 07:51 | #181 (ia1) | ia-reclassement.ts · nelson-sauvin@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 4025 / 505 | 0.0031 CHF | HTTP 200, 2453 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 98 | 26.10 07:51 | #181 (ia1) | ia-reclassement.ts · citra@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3959 / 498 | 0.0030 CHF | HTTP 200, 1721 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 99 | 26.10 07:51 | #181 (ia1) | ia-reclassement.ts · motueka@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3889 / 490 | 0.0030 CHF | HTTP 200, 1717 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 100 | 26.10 07:51 | #181 (ia1) | ia-reclassement.ts · mosaic@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 4036 / 448 | 0.0029 CHF | HTTP 200, 1771 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |

## Suite de l'essai IA de re-classement des substituts (ia2, #181) — enveloppe séparée

- Accord de l'utilisateur pour l'essai d'IA (suite d'ia1) relayé par le pilote le 26.10 ; enveloppe : **70 appels au plus, 1 CHF estimé**, `gemini-3.5-flash-lite` seul (l'invite n'en admet pas d'autre dans cette suite).
- Modèles : `gemini-3.8-flash` (ia1 seulement) et `gemini-3.5-flash-lite` ; champ `modelVersion` vérifié à chaque réponse.
- Données : fiches du catalogue (Beer Maverick, Hopsteiner), aucune donnée du brasseur. Clé jamais journalisée. Jamais dans `npm test`.
- Lanceur : `scripts/eval-hop/ia-reclassement.ts` (garde-fous de `scripts/gemini38LiveCore.ts`) ; entrées et sorties : `work/missions/2026-10-25-integration-houblons/voies/ia1-reclassement/resultats/<date>/`.
- Compteur propre à cette section : ne pas le confondre avec les autres. Une ligne par appel parti, réservée avant l'envoi.

**Compteur ia2 : 60 / 70 · 0.1835 CHF / 1**

| # | Heure | Issue | Test | Modèle observé | Tokens entrée / sortie | Coût estimé | Résultat |
|---|---|---|---|---|---|---|---|
| 1 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · hallertau-taurus@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3863 / 561 | 0.0032 CHF | HTTP 200, 2734 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 2 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · hallertau-taurus@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3852 / 563 | 0.0032 CHF | HTTP 200, 2058 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 3 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · brewers-gold@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3821 / 479 | 0.0029 CHF | HTTP 200, 1718 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 4 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · brewers-gold@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3644 / 520 | 0.0030 CHF | HTTP 200, 1751 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 5 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · brewers-gold-us@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3813 / 550 | 0.0031 CHF | HTTP 200, 1981 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 6 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · brewers-gold-us@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3835 / 540 | 0.0031 CHF | HTTP 200, 2111 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 7 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · triplepearl@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 4023 / 430 | 0.0029 CHF | HTTP 200, 1812 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 8 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · triplepearl@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3700 / 517 | 0.0030 CHF | HTTP 200, 1730 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 9 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · sonnet@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3805 / 540 | 0.0031 CHF | HTTP 200, 1938 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 10 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · sonnet@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3681 / 487 | 0.0029 CHF | HTTP 200, 1892 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 11 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · whitbread-golding-variety-wgv@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3760 / 522 | 0.0030 CHF | HTTP 200, 2090 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 12 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · whitbread-golding-variety-wgv@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3665 / 514 | 0.0030 CHF | HTTP 200, 1900 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 13 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · marynka@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 4016 / 555 | 0.0032 CHF | HTTP 200, 2110 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 14 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · marynka@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3655 / 480 | 0.0029 CHF | HTTP 200, 1797 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 15 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · idaho-gem@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3876 / 543 | 0.0032 CHF | HTTP 200, 1885 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 16 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · idaho-gem@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3750 / 540 | 0.0031 CHF | HTTP 200, 2004 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 17 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · sticklebract@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3735 / 520 | 0.0030 CHF | HTTP 200, 1962 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 18 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · sticklebract@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3845 / 518 | 0.0031 CHF | HTTP 200, 1993 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 19 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · magnum-us@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3830 / 515 | 0.0030 CHF | HTTP 200, 1925 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 20 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · magnum-us@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3767 / 555 | 0.0031 CHF | HTTP 200, 2076 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 21 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · tsingdao-flower@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3688 / 519 | 0.0030 CHF | HTTP 200, 2018 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 22 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · tsingdao-flower@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3704 / 536 | 0.0031 CHF | HTTP 200, 2057 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 23 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · calypso@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 4006 / 579 | 0.0033 CHF | HTTP 200, 1910 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 24 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · calypso@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3831 / 558 | 0.0032 CHF | HTTP 200, 2063 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 25 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · herald@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3880 / 551 | 0.0032 CHF | HTTP 200, 1923 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 26 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · herald@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3746 / 591 | 0.0033 CHF | HTTP 200, 2207 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 27 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · callista@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3714 / 480 | 0.0029 CHF | HTTP 200, 1966 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 28 | 26.10 08:06 | #181 (ia2) | ia-reclassement.ts · callista@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3671 / 527 | 0.0030 CHF | HTTP 200, 2000 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 29 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · green-bullet@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3846 / 565 | 0.0032 CHF | HTTP 200, 2083 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 30 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · green-bullet@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3718 / 550 | 0.0031 CHF | HTTP 200, 2264 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 31 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · santiam@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3833 / 556 | 0.0032 CHF | HTTP 200, 2048 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 32 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · santiam@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3642 / 529 | 0.0030 CHF | HTTP 200, 1871 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 33 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · agnus@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3778 / 539 | 0.0031 CHF | HTTP 200, 1878 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 34 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · agnus@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3837 / 508 | 0.0030 CHF | HTTP 200, 1994 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 35 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · progress@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3930 / 544 | 0.0032 CHF | HTTP 200, 1905 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 36 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · progress@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3634 / 530 | 0.0030 CHF | HTTP 200, 2083 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 37 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · stirling@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3793 / 560 | 0.0032 CHF | HTTP 200, 1947 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 38 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · stirling@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3721 / 533 | 0.0031 CHF | HTTP 200, 1864 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 39 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · opal@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3895 / 542 | 0.0032 CHF | HTTP 200, 2042 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 40 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · opal@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3613 / 531 | 0.0030 CHF | HTTP 200, 1943 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 41 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · spalter-select@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3808 / 365 | 0.0026 CHF | HTTP 200, 1567 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 42 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · spalter-select@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3774 / 529 | 0.0031 CHF | HTTP 200, 1801 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 43 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · kohatu@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3797 / 536 | 0.0031 CHF | HTTP 200, 2046 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 44 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · kohatu@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3577 / 477 | 0.0028 CHF | HTTP 200, 1887 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 45 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · xja2-436@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 4058 / 532 | 0.0032 CHF | HTTP 200, 2076 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 46 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · xja2-436@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3847 / 572 | 0.0032 CHF | HTTP 200, 2171 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 47 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · relax@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3912 / 505 | 0.0030 CHF | HTTP 200, 2037 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 48 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · relax@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3524 / 550 | 0.0030 CHF | HTTP 200, 2168 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 49 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · multihead@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3775 / 530 | 0.0031 CHF | HTTP 200, 2013 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 50 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · multihead@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3599 / 500 | 0.0029 CHF | HTTP 200, 1950 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 51 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · cashmere@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3967 / 524 | 0.0031 CHF | HTTP 200, 1960 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 52 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · cashmere@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3662 / 533 | 0.0030 CHF | HTTP 200, 2044 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 53 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · el-dorado@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3960 / 373 | 0.0027 CHF | HTTP 200, 1584 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 54 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · el-dorado@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3806 / 540 | 0.0031 CHF | HTTP 200, 2129 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 55 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · flyer@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3927 / 462 | 0.0029 CHF | HTTP 200, 1743 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 56 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · flyer@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3724 / 560 | 0.0031 CHF | HTTP 200, 1949 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 57 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · super-pride@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3868 / 487 | 0.0030 CHF | HTTP 200, 1827 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 58 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · super-pride@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3804 / 514 | 0.0030 CHF | HTTP 200, 2100 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 59 | 26.10 08:07 | #181 (ia2) | ia-reclassement.ts · pilgrim@dry · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 4007 / 547 | 0.0032 CHF | HTTP 200, 1996 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 60 | 26.10 08:08 | #181 (ia2) | ia-reclassement.ts · pilgrim@60 · pool opt1 · lite · invite v1 | gemini-3.5-flash-lite | 3840 / 532 | 0.0031 CHF | HTTP 200, 1992 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |

## Essai de bout en bout du callable hopReclasserIA sur l'émulateur (i2, #181) — enveloppe séparée

- Accord du brasseur (D80, 26.10) : Gemini facturé en production pour l'IA de Substituer, environ 0,003 CHF par recherche, Flash-Lite. Enveloppe de cet essai : **3 appels au plus, 0.05 CHF estimés**.
- Chemin : app (?dev-local) → callable `hopReclasserIA` (émulateur des fonctions) → fournisseur local → garde-fous de `scripts/gemini38LiveCore.ts` → Gemini. Données : fiches du catalogue, aucune donnée du brasseur. Clé jamais journalisée. Jamais dans `npm test`.
- Lanceur : `work/missions/2026-10-25-integration-houblons/voies/i2-ia-substituer/emulateur/emulateur.ts`.

**Compteur i2 : 2 / 3 · 0.0061 CHF / 0.05**

| # | Heure | Issue | Test | Modèle observé | Tokens entrée / sortie | Coût estimé | Résultat |
|---|---|---|---|---|---|---|---|
| 1 | 26.10 12:30 | #181 (i2) | emulateur.ts · app → callable → fournisseur local → Gemini · invite v1 | gemini-3.5-flash-lite | 3892 / 505 | 0.0030 CHF | HTTP 200, 2098 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 2 | 26.10 12:30 | #181 (i2) | emulateur.ts · app → callable → fournisseur local → Gemini · invite v1 | gemini-3.5-flash-lite | 3955 / 505 | 0.0031 CHF | HTTP 200, 2217 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |

## Essai de bout en bout du callable hopReclasserIA, mode suggérer, sur l'émulateur (ia3) — enveloppe séparée

- Accord de l'utilisateur (D100) : essai réel de la voie ia3, l'IA dans Suggérer (Flash-Lite, invite `suggerer-v1`, 30 candidats par appel). Enveloppe : **30 appels au plus, 0.5 CHF estimés**. Arrêt au premier dépassement ou à la première erreur répétée.
- Chemin : app (?dev-local) → callable `hopReclasserIA` (émulateur des fonctions) → fournisseur local → garde-fous de `scripts/gemini38LiveCore.ts` → Gemini. Données : fiches du catalogue et recettes d'essai, aucune donnée réelle du brasseur. Clé jamais journalisée. Jamais dans `npm test`.
- Lanceur : `scripts/eval-hop/ia3-emulateur.ts`.

**Compteur ia3 : 13 / 30 · 0.0664 CHF / 0.5**

| # | Heure | Issue | Test | Modèle observé | Tokens entrée / sortie | Coût estimé | Résultat |
|---|---|---|---|---|---|---|---|
| 1 | 27.10 12:09 | #ia3 | ia3-emulateur.ts · app → callable → fournisseur local → Gemini · suggerer-v1 · neipa v3 · chauffe de la fonction (visée à part) | gemini-3.5-flash-lite | 5448 / 1232 | 0.0059 CHF | HTTP 200, 4195 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 2 | 27.10 12:09 | #ia3 | ia3-emulateur.ts · app → callable → fournisseur local → Gemini · suggerer-v1 · neipa v3 · agrumes · dry hop actif | gemini-3.5-flash-lite | 5498 / 1232 | 0.0059 CHF | HTTP 200, 3906 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 3 | 27.10 12:09 | #ia3 | ia3-emulateur.ts · app → callable → fournisseur local → Gemini · suggerer-v1 · stout S1 · plus floral | gemini-3.5-flash-lite | 5403 / 1150 | 0.0056 CHF | HTTP 200, 3468 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 4 | 27.10 12:09 | #ia3 | ia3-emulateur.ts · app → callable → fournisseur local → Gemini · suggerer-v1 · 21C Hazy du jeudi · plus d’agrumes | gemini-3.5-flash-lite | 5498 / 1264 | 0.0060 CHF | HTTP 200, 4669 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 5 | 27.10 12:12 | #ia3 | ia3-emulateur.ts · app → callable → fournisseur local → Gemini · suggerer-v1 · neipa v3 · chauffe de la fonction (visée à part) | gemini-3.5-flash-lite | 5471 / 878 | 0.0048 CHF | HTTP 200, 2666 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 6 | 27.10 12:12 | #ia3 | ia3-emulateur.ts · app → callable → fournisseur local → Gemini · suggerer-v1 · neipa v3 · agrumes · dry hop actif | gemini-3.5-flash-lite | 5521 / 910 | 0.0049 CHF | HTTP 200, 2650 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 7 | 27.10 12:12 | #ia3 | ia3-emulateur.ts · app → callable → fournisseur local → Gemini · suggerer-v1 · stout S1 · plus floral | gemini-3.5-flash-lite | 5426 / 873 | 0.0048 CHF | HTTP 200, 2696 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 8 | 27.10 12:12 | #ia3 | ia3-emulateur.ts · app → callable → fournisseur local → Gemini · suggerer-v1 · 21C Hazy du jeudi · plus d’agrumes | gemini-3.5-flash-lite | 5521 / 868 | 0.0048 CHF | HTTP 200, 2655 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 9 | 27.10 12:23 | #ia3 | ia3-emulateur.ts · app → callable → fournisseur local → Gemini · suggerer-v1 · neipa v3 · chauffe de la fonction (visée à part) | gemini-3.5-flash-lite | 5471 / 863 | 0.0047 CHF | HTTP 200, 2543 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 10 | 27.10 12:23 | #ia3 | ia3-emulateur.ts · app → callable → fournisseur local → Gemini · suggerer-v1 · neipa v3 · agrumes · dry hop actif | gemini-3.5-flash-lite | 5521 / 879 | 0.0048 CHF | HTTP 200, 3196 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 11 | 27.10 12:25 | #ia3 | ia3-emulateur.ts · app → callable → fournisseur local → Gemini · suggerer-v1 · neipa v3 · chauffe de la fonction (visée à part) | gemini-3.5-flash-lite | 5471 / 848 | 0.0047 CHF | HTTP 200, 2837 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 12 | 27.10 12:25 | #ia3 | ia3-emulateur.ts · app → callable → fournisseur local → Gemini · suggerer-v1 · neipa v3 · agrumes · dry hop actif | gemini-3.5-flash-lite | 5521 / 856 | 0.0047 CHF | HTTP 200, 2596 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |
| 13 | 27.10 12:25 | #ia3 | ia3-emulateur.ts · app → callable → fournisseur local → Gemini · suggerer-v1 · stout S1 · plus floral | gemini-3.5-flash-lite | 5625 / 859 | 0.0048 CHF | HTTP 200, 3261 ms, demandé gemini-3.5-flash-lite, réflexion low, fin STOP |

## Essai à l’aveugle de l’IA de Suggérer sur les ex æquo du moteur (ia4) — enveloppe séparée

- Accord de l'utilisateur (D100) : essai réel de la voie ia4 (Flash-Lite, invite `suggerer-v2`, 3 à 12 candidats par appel, les ex æquo du moteur). Enveloppe : **70 appels au plus, 0.4 CHF**. Arrêt au premier dépassement ou à la deuxième erreur de suite.
- Chemin : `scripts/eval-hop/ia4-banc.ts` → garde-fous de `scripts/gemini38LiveCore.ts` → Gemini (le module de l'invite est celui du callable). Données : fiches du catalogue et recettes de fixture, aucune donnée réelle. Clé jamais journalisée. Jamais dans `npm test`.

**Compteur ia4 : 31 / 70 · 0.0710 CHF / 0.4**

| # | Heure | Issue | Test | Modèle observé | Tokens entrée / sortie | Coût estimé | Résultat |
|---|---|---|---|---|---|---|---|
| 1 | 27.10 13:54 | #ia4 | ia4-banc.ts · suggerer-v2 · 15B · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.5-flash-lite | 2849 / 400 | 0.0023 CHF | HTTP 200, 1721 ms, fin STOP |
| 2 | 27.10 13:54 | #ia4 | ia4-banc.ts · suggerer-v2 · 15B · plus floral · 10′ · 12 ex æquo | gemini-3.5-flash-lite | 2788 / 396 | 0.0023 CHF | HTTP 200, 1649 ms, fin STOP |
| 3 | 27.10 13:54 | #ia4 | ia4-banc.ts · suggerer-v2 · 15C · plus floral · dry hop actif · 12 ex æquo | gemini-3.5-flash-lite | 2772 / 366 | 0.0022 CHF | HTTP 200, 1662 ms, fin STOP |
| 4 | 27.10 13:54 | #ia4 | ia4-banc.ts · suggerer-v2 · 16A · plus floral · dry hop actif · 12 ex æquo | gemini-3.5-flash-lite | 2767 / 368 | 0.0022 CHF | HTTP 200, 1536 ms, fin STOP |
| 5 | 27.10 13:54 | #ia4 | ia4-banc.ts · suggerer-v2 · 16B · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.5-flash-lite | 2844 / 409 | 0.0023 CHF | HTTP 200, 1769 ms, fin STOP |
| 6 | 27.10 13:54 | #ia4 | ia4-banc.ts · suggerer-v2 · 16C · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.5-flash-lite | 2865 / 391 | 0.0023 CHF | HTTP 200, 1919 ms, fin STOP |
| 7 | 27.10 13:54 | #ia4 | ia4-banc.ts · suggerer-v2 · 20B · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.5-flash-lite | 2851 / 397 | 0.0023 CHF | HTTP 200, 1586 ms, fin STOP |
| 8 | 27.10 13:54 | #ia4 | ia4-banc.ts · suggerer-v2 · 20C · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.5-flash-lite | 2851 / 391 | 0.0023 CHF | HTTP 200, 1595 ms, fin STOP |
| 9 | 27.10 13:54 | #ia4 | ia4-banc.ts · suggerer-v2 · 20C · plus floral · 10′ · 12 ex æquo | gemini-3.5-flash-lite | 2789 / 385 | 0.0022 CHF | HTTP 200, 1658 ms, fin STOP |
| 10 | 27.10 13:55 | #ia4 | ia4-banc.ts · suggerer-v2 · 20A · plus floral · 10′ · 12 ex æquo | gemini-3.5-flash-lite | 2768 / 358 | 0.0022 CHF | HTTP 200, 1466 ms, fin STOP |
| 11 | 27.10 13:55 | #ia4 | ia4-banc.ts · suggerer-v2 · 13C · plus floral · dry hop actif · 12 ex æquo | gemini-3.5-flash-lite | 2753 / 356 | 0.0021 CHF | HTTP 200, 1401 ms, fin STOP |
| 12 | 27.10 13:55 | #ia4 | ia4-banc.ts · suggerer-v2 · 9C · plus floral · dry hop actif · 12 ex æquo | gemini-3.5-flash-lite | 2754 / 393 | 0.0023 CHF | HTTP 200, 1625 ms, fin STOP |
| 13 | 27.10 13:55 | #ia4 | ia4-banc.ts · suggerer-v2 · 1A · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.5-flash-lite | 2766 / 418 | 0.0023 CHF | HTTP 200, 1829 ms, fin STOP |
| 14 | 27.10 13:55 | #ia4 | ia4-banc.ts · suggerer-v2 · 3A · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.5-flash-lite | 2767 / 422 | 0.0024 CHF | HTTP 200, 1614 ms, fin STOP |
| 15 | 27.10 13:55 | #ia4 | ia4-banc.ts · suggerer-v2 · 3B · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.5-flash-lite | 2774 / 407 | 0.0023 CHF | HTTP 200, 1438 ms, fin STOP |
| 16 | 27.10 13:55 | #ia4 | ia4-banc.ts · suggerer-v2 · 4A · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.5-flash-lite | 2804 / 411 | 0.0023 CHF | HTTP 200, 1428 ms, fin STOP |
| 17 | 27.10 13:55 | #ia4 | ia4-banc.ts · suggerer-v2 · 4A · plus floral · 10′ · 12 ex æquo | gemini-3.5-flash-lite | 2726 / 405 | 0.0023 CHF | HTTP 200, 1555 ms, fin STOP |
| 18 | 27.10 13:55 | #ia4 | ia4-banc.ts · suggerer-v2 · 5B · plus floral · dry hop actif · 12 ex æquo | gemini-3.5-flash-lite | 2738 / 442 | 0.0024 CHF | HTTP 200, 1501 ms, fin STOP |
| 19 | 27.10 13:55 | #ia4 | ia4-banc.ts · suggerer-v2 · 5D · plus floral · dry hop actif · 12 ex æquo | gemini-3.5-flash-lite | 2740 / 427 | 0.0024 CHF | HTTP 200, 1693 ms, fin STOP |
| 20 | 27.10 13:55 | #ia4 | ia4-banc.ts · suggerer-v2 · 7B · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.5-flash-lite | 2790 / 406 | 0.0023 CHF | HTTP 200, 1565 ms, fin STOP |
| 21 | 27.10 13:55 | #ia4 | ia4-banc.ts · suggerer-v2 · 10A · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.5-flash-lite | 2767 / 379 | 0.0022 CHF | HTTP 200, 1855 ms, fin STOP |
| 22 | 27.10 13:55 | #ia4 | ia4-banc.ts · suggerer-v2 · 24A · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.5-flash-lite | 2817 / 418 | 0.0024 CHF | HTTP 200, 1560 ms, fin STOP |
| 23 | 27.10 13:55 | #ia4 | ia4-banc.ts · suggerer-v2 · 21A · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.5-flash-lite | 2819 / 403 | 0.0023 CHF | HTTP 200, 1598 ms, fin STOP |
| 24 | 27.10 13:55 | #ia4 | ia4-banc.ts · suggerer-v2 · 21A · plus floral · 10′ · 12 ex æquo | gemini-3.5-flash-lite | 2820 / 385 | 0.0023 CHF | HTTP 200, 2117 ms, fin STOP |
| 25 | 27.10 13:55 | #ia4 | ia4-banc.ts · suggerer-v2 · 12C · plus floral · 10′ · 12 ex æquo | gemini-3.5-flash-lite | 2748 / 365 | 0.0022 CHF | HTTP 200, 1523 ms, fin STOP |
| 26 | 27.10 13:55 | #ia4 | ia4-banc.ts · suggerer-v2 · 18B · plus floral · dry hop actif · 12 ex æquo | gemini-3.5-flash-lite | 2820 / 375 | 0.0022 CHF | HTTP 200, 1529 ms, fin STOP |
| 27 | 27.10 13:55 | #ia4 | ia4-banc.ts · suggerer-v2 · 11B · plus floral · dry hop actif · 12 ex æquo | gemini-3.5-flash-lite | 2754 / 430 | 0.0024 CHF | HTTP 200, 1617 ms, fin STOP |
| 28 | 27.10 13:55 | #ia4 | ia4-banc.ts · suggerer-v2 · 25B · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.5-flash-lite | 2784 / 408 | 0.0023 CHF | HTTP 200, 1652 ms, fin STOP |
| 29 | 27.10 13:55 | #ia4 | ia4-banc.ts · suggerer-v2 · 26C · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.5-flash-lite | 2784 / 395 | 0.0023 CHF | HTTP 200, 1754 ms, fin STOP |
| 30 | 27.10 13:55 | #ia4 | ia4-banc.ts · suggerer-v2 · 25A · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.5-flash-lite | 2793 / 432 | 0.0024 CHF | HTTP 200, 1487 ms, fin STOP |
| 31 | 27.10 13:55 | #ia4 | ia4-banc.ts · suggerer-v2 · neipa v3 · plus d’agrumes · dry hop actif · 12 ex æquo (rapport final) | gemini-3.5-flash-lite | 2817 / 400 | 0.0023 CHF | HTTP 200, 1646 ms, fin STOP |

## Essai à l’aveugle de l’IA de Suggérer sur les ex æquo du moteur (ia4 gemini-3.8-flash low) — enveloppe séparée

- Accord de l'utilisateur (D130 (« J'autorise un budget de 10ch pour testé les deux ») : gemini-3.8-flash, réflexion low) : essai réel de la voie ia4 (invite `suggerer-v2`, 3 à 12 candidats par appel, les ex æquo du moteur). Enveloppe : **40 appels au plus, 4.5 CHF**. Arrêt au premier dépassement ou à la deuxième erreur de suite.
- Chemin : `scripts/eval-hop/ia4-banc.ts` → garde-fous de `scripts/gemini38LiveCore.ts` → Gemini (le module de l'invite est celui du callable). Données : fiches du catalogue et recettes de fixture, aucune donnée réelle. Clé jamais journalisée. Jamais dans `npm test`.

**Compteur ia4 gemini-3.8-flash low : 31 / 40 · 0.2645 CHF / 4.5**

| # | Heure | Issue | Test | Modèle observé | Tokens entrée / sortie | Coût estimé | Résultat |
|---|---|---|---|---|---|---|---|
| 1 | 27.10 14:56 | #ia4 | ia4-banc.ts · suggerer-v2 · 15B · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2849 / 422 | 0.0093 CHF | HTTP 200, 4755 ms, fin STOP |
| 2 | 27.10 14:56 | #ia4 | ia4-banc.ts · suggerer-v2 · 15B · plus floral · 10′ · 12 ex æquo | gemini-3.8-flash | 2788 / 295 | 0.0080 CHF | HTTP 200, 4110 ms, fin STOP |
| 3 | 27.10 14:56 | #ia4 | ia4-banc.ts · suggerer-v2 · 15C · plus floral · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2772 / 316 | 0.0082 CHF | HTTP 200, 5212 ms, fin STOP |
| 4 | 27.10 14:56 | #ia4 | ia4-banc.ts · suggerer-v2 · 16A · plus floral · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2767 / 398 | 0.0089 CHF | HTTP 200, 5091 ms, fin STOP |
| 5 | 27.10 14:56 | #ia4 | ia4-banc.ts · suggerer-v2 · 16B · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.8-flash | 2844 / 331 | 0.0084 CHF | HTTP 200, 3718 ms, fin STOP |
| 6 | 27.10 14:56 | #ia4 | ia4-banc.ts · suggerer-v2 · 16C · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.8-flash | 2865 / 340 | 0.0086 CHF | HTTP 200, 4752 ms, fin STOP |
| 7 | 27.10 14:56 | #ia4 | ia4-banc.ts · suggerer-v2 · 20B · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2851 / 321 | 0.0084 CHF | HTTP 200, 4617 ms, fin STOP |
| 8 | 27.10 14:56 | #ia4 | ia4-banc.ts · suggerer-v2 · 20C · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2851 / 329 | 0.0084 CHF | HTTP 200, 4875 ms, fin STOP |
| 9 | 27.10 14:56 | #ia4 | ia4-banc.ts · suggerer-v2 · 20C · plus floral · 10′ · 12 ex æquo | gemini-3.8-flash | 2789 / 332 | 0.0083 CHF | HTTP 200, 4267 ms, fin STOP |
| 10 | 27.10 14:56 | #ia4 | ia4-banc.ts · suggerer-v2 · 20A · plus floral · 10′ · 12 ex æquo | gemini-3.8-flash | 2768 / 333 | 0.0083 CHF | HTTP 200, 4641 ms, fin STOP |
| 11 | 27.10 14:56 | #ia4 | ia4-banc.ts · suggerer-v2 · 13C · plus floral · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2753 / 336 | 0.0083 CHF | HTTP 200, 5119 ms, fin STOP |
| 12 | 27.10 14:57 | #ia4 | ia4-banc.ts · suggerer-v2 · 9C · plus floral · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2754 / 307 | 0.0080 CHF | HTTP 200, 4001 ms, fin STOP |
| 13 | 27.10 14:57 | #ia4 | ia4-banc.ts · suggerer-v2 · 1A · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.8-flash | 2766 / 436 | 0.0093 CHF | HTTP 200, 4182 ms, fin STOP |
| 14 | 27.10 14:57 | #ia4 | ia4-banc.ts · suggerer-v2 · 3A · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.8-flash | 2767 / 358 | 0.0085 CHF | HTTP 200, 4262 ms, fin STOP |
| 15 | 27.10 14:57 | #ia4 | ia4-banc.ts · suggerer-v2 · 3B · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2774 / 439 | 0.0093 CHF | HTTP 200, 4923 ms, fin STOP |
| 16 | 27.10 14:57 | #ia4 | ia4-banc.ts · suggerer-v2 · 4A · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2804 / 425 | 0.0092 CHF | HTTP 200, 4726 ms, fin STOP |
| 17 | 27.10 14:57 | #ia4 | ia4-banc.ts · suggerer-v2 · 4A · plus floral · 10′ · 12 ex æquo | gemini-3.8-flash | 2726 / 324 | 0.0081 CHF | HTTP 200, 4659 ms, fin STOP |
| 18 | 27.10 14:57 | #ia4 | ia4-banc.ts · suggerer-v2 · 5B · plus floral · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2738 / 331 | 0.0082 CHF | HTTP 200, 4560 ms, fin STOP |
| 19 | 27.10 14:57 | #ia4 | ia4-banc.ts · suggerer-v2 · 5D · plus floral · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2740 / 321 | 0.0081 CHF | HTTP 200, 4094 ms, fin STOP |
| 20 | 27.10 14:57 | #ia4 | ia4-banc.ts · suggerer-v2 · 7B · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.8-flash | 2790 / 357 | 0.0086 CHF | HTTP 200, 4566 ms, fin STOP |
| 21 | 27.10 14:57 | #ia4 | ia4-banc.ts · suggerer-v2 · 10A · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.8-flash | 2767 / 339 | 0.0084 CHF | HTTP 200, 4848 ms, fin STOP |
| 22 | 27.10 14:57 | #ia4 | ia4-banc.ts · suggerer-v2 · 24A · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2817 / 431 | 0.0093 CHF | HTTP 200, 5518 ms, fin STOP |
| 23 | 27.10 14:57 | #ia4 | ia4-banc.ts · suggerer-v2 · 21A · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2819 / 350 | 0.0086 CHF | HTTP 200, 5175 ms, fin STOP |
| 24 | 27.10 14:57 | #ia4 | ia4-banc.ts · suggerer-v2 · 21A · plus floral · 10′ · 12 ex æquo | gemini-3.8-flash | 2820 / 321 | 0.0083 CHF | HTTP 200, 4582 ms, fin STOP |
| 25 | 27.10 14:58 | #ia4 | ia4-banc.ts · suggerer-v2 · 12C · plus floral · 10′ · 12 ex æquo | gemini-3.8-flash | 2748 / 327 | 0.0082 CHF | HTTP 200, 4595 ms, fin STOP |
| 26 | 27.10 14:58 | #ia4 | ia4-banc.ts · suggerer-v2 · 18B · plus floral · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2820 / 324 | 0.0083 CHF | HTTP 200, 3351 ms, fin STOP |
| 27 | 27.10 14:58 | #ia4 | ia4-banc.ts · suggerer-v2 · 11B · plus floral · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2754 / 324 | 0.0082 CHF | HTTP 200, 4883 ms, fin STOP |
| 28 | 27.10 14:58 | #ia4 | ia4-banc.ts · suggerer-v2 · 25B · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.8-flash | 2784 / 341 | 0.0084 CHF | HTTP 200, 4155 ms, fin STOP |
| 29 | 27.10 14:58 | #ia4 | ia4-banc.ts · suggerer-v2 · 26C · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.8-flash | 2784 / 435 | 0.0093 CHF | HTTP 200, 5174 ms, fin STOP |
| 30 | 27.10 14:58 | #ia4 | ia4-banc.ts · suggerer-v2 · 25A · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2793 / 361 | 0.0086 CHF | HTTP 200, 5597 ms, fin STOP |
| 31 | 27.10 14:58 | #ia4 | ia4-banc.ts · suggerer-v2 · neipa v3 · plus d’agrumes · dry hop actif · 12 ex æquo (rapport final) | gemini-3.8-flash | 2817 / 344 | 0.0085 CHF | HTTP 200, 3611 ms, fin STOP |

## Essai à l’aveugle de l’IA de Suggérer sur les ex æquo du moteur (ia4 gemini-3.8-flash high) — enveloppe séparée

- Accord de l'utilisateur (D130 (« J'autorise un budget de 10ch pour testé les deux ») : gemini-3.8-flash, réflexion high) : essai réel de la voie ia4 (invite `suggerer-v2`, 3 à 12 candidats par appel, les ex æquo du moteur). Enveloppe : **40 appels au plus, 4.5 CHF**. Arrêt au premier dépassement ou à la deuxième erreur de suite.
- Chemin : `scripts/eval-hop/ia4-banc.ts` → garde-fous de `scripts/gemini38LiveCore.ts` → Gemini (le module de l'invite est celui du callable). Données : fiches du catalogue et recettes de fixture, aucune donnée réelle. Clé jamais journalisée. Jamais dans `npm test`.

**Compteur ia4 gemini-3.8-flash high : 31 / 40 · 3.4674 CHF / 4.5**

| # | Heure | Issue | Test | Modèle observé | Tokens entrée / sortie | Coût estimé | Résultat |
|---|---|---|---|---|---|---|---|
| 1 | 27.10 15:00 | #ia4 | ia4-banc.ts · suggerer-v2 · 15B · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2849 / 11950 | 0.1174 CHF | HTTP 200, 91676 ms, fin STOP |
| 2 | 27.10 15:01 | #ia4 | ia4-banc.ts · suggerer-v2 · 15B · plus floral · 10′ · 12 ex æquo | gemini-3.8-flash | 2788 / 11936 | 0.1171 CHF | HTTP 200, 90341 ms, fin STOP |
| 3 | 27.10 15:03 | #ia4 | ia4-banc.ts · suggerer-v2 · 15C · plus floral · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2772 / 11831 | 0.1161 CHF | HTTP 200, 96618 ms, fin STOP |
| 4 | 27.10 15:05 | #ia4 | ia4-banc.ts · suggerer-v2 · 16A · plus floral · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2767 / 11843 | 0.1162 CHF | HTTP 200, 95726 ms, fin STOP |
| 5 | 27.10 15:06 | #ia4 | ia4-banc.ts · suggerer-v2 · 16B · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.8-flash | 2844 / 11876 | 0.1167 CHF | HTTP 200, 89945 ms, fin STOP |
| 6 | 27.10 15:08 | #ia4 | ia4-banc.ts · suggerer-v2 · 16C · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.8-flash | 2865 / 11967 | 0.1176 CHF | HTTP 200, 73503 ms, fin STOP |
| 7 | 27.10 15:09 | #ia4 | ia4-banc.ts · suggerer-v2 · 20B · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2851 / 11944 | 0.1173 CHF | HTTP 200, 80633 ms, fin STOP |
| 8 | 27.10 15:10 | #ia4 | ia4-banc.ts · suggerer-v2 · 20C · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2851 / 11851 | 0.1164 CHF | HTTP 200, 93645 ms, fin STOP |
| 9 | 27.10 15:12 | #ia4 | ia4-banc.ts · suggerer-v2 · 20C · plus floral · 10′ · 12 ex æquo | gemini-3.8-flash | 2789 / 9867 | 0.0977 CHF | HTTP 200, 73979 ms, fin STOP |
| 10 | 27.10 15:13 | #ia4 | ia4-banc.ts · suggerer-v2 · 20A · plus floral · 10′ · 12 ex æquo | gemini-3.8-flash | 2768 / 11940 | 0.1171 CHF | HTTP 200, 93642 ms, fin STOP |
| 11 | 27.10 15:15 | #ia4 | ia4-banc.ts · suggerer-v2 · 13C · plus floral · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2753 / 11956 | 0.1172 CHF | HTTP 200, 93260 ms, fin STOP |
| 12 | 27.10 15:16 | #ia4 | ia4-banc.ts · suggerer-v2 · 9C · plus floral · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2754 / 11946 | 0.1172 CHF | HTTP 200, 92379 ms, fin STOP |
| 13 | 27.10 15:18 | #ia4 | ia4-banc.ts · suggerer-v2 · 1A · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.8-flash | 2766 / 11959 | 0.1173 CHF | HTTP 200, 87845 ms, fin STOP |
| 14 | 27.10 15:19 | #ia4 | ia4-banc.ts · suggerer-v2 · 3A · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.8-flash | 2767 / 11805 | 0.1159 CHF | HTTP 200, 80075 ms, fin STOP |
| 15 | 27.10 15:20 | #ia4 | ia4-banc.ts · suggerer-v2 · 3B · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2774 / 11857 | 0.1164 CHF | HTTP 200, 91671 ms, fin STOP |
| 16 | 27.10 15:22 | #ia4 | ia4-banc.ts · suggerer-v2 · 4A · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2804 / 11985 | 0.1176 CHF | HTTP 200, 93356 ms, fin MAX_TOKENS |
| 17 | 27.10 15:24 | #ia4 | ia4-banc.ts · suggerer-v2 · 4A · plus floral · 10′ · 12 ex æquo | gemini-3.8-flash | 2726 / 11822 | 0.1159 CHF | HTTP 200, 92620 ms, fin STOP |
| 18 | 27.10 15:25 | #ia4 | ia4-banc.ts · suggerer-v2 · 5B · plus floral · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2738 / 11916 | 0.1168 CHF | HTTP 200, 91445 ms, fin STOP |
| 19 | 27.10 15:27 | #ia4 | ia4-banc.ts · suggerer-v2 · 5D · plus floral · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2740 / 11872 | 0.1164 CHF | HTTP 200, 94052 ms, fin STOP |
| 20 | 27.10 15:28 | #ia4 | ia4-banc.ts · suggerer-v2 · 7B · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.8-flash | 2790 / 11979 | 0.1175 CHF | HTTP 200, 86711 ms, fin MAX_TOKENS |
| 21 | 27.10 15:30 | #ia4 | ia4-banc.ts · suggerer-v2 · 10A · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.8-flash | 2767 / 11974 | 0.1174 CHF | HTTP 200, 85906 ms, fin STOP |
| 22 | 27.10 15:31 | #ia4 | ia4-banc.ts · suggerer-v2 · 24A · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2817 / 11950 | 0.1173 CHF | HTTP 200, 92807 ms, fin STOP |
| 23 | 27.10 15:33 | #ia4 | ia4-banc.ts · suggerer-v2 · 21A · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2819 / 11974 | 0.1175 CHF | HTTP 200, 88301 ms, fin STOP |
| 24 | 27.10 15:34 | #ia4 | ia4-banc.ts · suggerer-v2 · 21A · plus floral · 10′ · 12 ex æquo | gemini-3.8-flash | 2820 / 11843 | 0.1163 CHF | HTTP 200, 86721 ms, fin STOP |
| 25 | 27.10 15:35 | #ia4 | ia4-banc.ts · suggerer-v2 · 12C · plus floral · 10′ · 12 ex æquo | gemini-3.8-flash | 2748 / 11837 | 0.1161 CHF | HTTP 200, 90277 ms, fin STOP |
| 26 | 27.10 15:37 | #ia4 | ia4-banc.ts · suggerer-v2 · 18B · plus floral · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2820 / 8456 | 0.0846 CHF | HTTP 200, 67407 ms, fin STOP |
| 27 | 27.10 15:38 | #ia4 | ia4-banc.ts · suggerer-v2 · 11B · plus floral · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2754 / 11842 | 0.1162 CHF | HTTP 200, 87549 ms, fin STOP |
| 28 | 27.10 15:40 | #ia4 | ia4-banc.ts · suggerer-v2 · 25B · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.8-flash | 2784 / 7352 | 0.0741 CHF | HTTP 200, 53667 ms, fin STOP |
| 29 | 27.10 15:40 | #ia4 | ia4-banc.ts · suggerer-v2 · 26C · plus d’agrumes · 10′ · 12 ex æquo | gemini-3.8-flash | 2784 / 11421 | 0.1123 CHF | HTTP 200, 84725 ms, fin STOP |
| 30 | 27.10 15:42 | #ia4 | ia4-banc.ts · suggerer-v2 · 25A · plus d’agrumes · dry hop actif · 12 ex æquo | gemini-3.8-flash | 2793 / 5866 | 0.0602 CHF | HTTP 200, 46152 ms, fin STOP |
| 31 | 27.10 15:43 | #ia4 | ia4-banc.ts · suggerer-v2 · neipa v3 · plus d’agrumes · dry hop actif · 12 ex æquo (rapport final) | gemini-3.8-flash | 2817 / 11966 | 0.1175 CHF | HTTP 200, 70367 ms, fin STOP |

## Petit essai réel du callable hopReclasserIA, mode suggérer, Gemini 3.8 Flash à la demande, sur l'émulateur (ia5) — enveloppe D130

- Accord de l'utilisateur (D130, il restait 6,27 CHF) : petit essai réel de la voie ia5, l'IA de Suggérer à la demande (gemini-3.8-flash, réflexion basse, invite `suggerer-v2`, 3 à 12 candidats par appel). Enveloppe : **3 appels au plus, 0.3 CHF estimés**. Arrêt au premier dépassement ou à la première erreur répétée.
- Chemin : app (?dev-local) → toucher sur la puce → callable `hopReclasserIA` (émulateur des fonctions) → fournisseur local → garde-fous de `scripts/gemini38LiveCore.ts` → Gemini. Données : fiches du catalogue et recettes d'essai, aucune donnée réelle du brasseur. Clé jamais journalisée. Jamais dans `npm test`.
- Lanceur : `scripts/eval-hop/ia3-emulateur.ts` (mis à jour par ia5).

**Compteur ia5 : 2 / 3 · 0.0165 CHF / 0.3**

| # | Heure | Issue | Test | Modèle observé | Tokens entrée / sortie | Coût estimé | Résultat |
|---|---|---|---|---|---|---|---|
| 1 | 27.10 16:01 | #ia5 | ia3-emulateur.ts · ia5 · toucher → callable → fournisseur local → Gemini · suggerer-v2 · neipa v3 · agrumes · dry hop actif | gemini-3.8-flash | 2789 / 319 | 0.0082 CHF | HTTP 200, 4382 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
| 2 | 27.10 16:01 | #ia5 | ia3-emulateur.ts · ia5 · toucher → callable → fournisseur local → Gemini · suggerer-v2 · neipa v3 · tropicaux · dry hop actif | gemini-3.8-flash | 2819 / 326 | 0.0083 CHF | HTTP 200, 5111 ms, demandé gemini-3.8-flash, réflexion low, fin STOP |
