# Essai d'IA : re-classement des substituts (#181, voie ia1-reclassement)

Généré par `scripts/eval-hop/ia-reclassement.ts --rapport`. Invite v1, requêtes figées `requetes/requetes-opt1.json` (empreinte 8c201f044632d98f). Référence : substituts Beer Maverick (comme e1) ; le moteur et l'option 1 sont recalculés ici sur les mêmes cas.

## 0. Contrôle : le moteur seul et l'option 1, recalculés ici, contre e1

| mesure | MRR (ici / e1) | rappel@10 | rang médian | |
|---|---|---|---|---|
| moteur 60′ (217 houblons) | 0,118 / 0,118 | 9,9 % / 9,9 % | 36 / 36 | identique |
| moteur dry hop actif (217) | 0,121 / 0,121 | 10,9 % / 10,9 % | 27 / 27 | identique |
| option 1 λ = 0,25, arôme (217) | 0,202 / 0,202 | 17,5 % / 17,5 % | 14 / 14 | identique |
| rangs des substituts BM des 9 phares, deux moments | 74 / 74 rangs retrouvés | | | identique |

Le moteur et l'option 1 retrouvent à l'identique les chiffres publiés de e1 sur les 217 houblons : OUI.

## Réponses réelles : opt1-lite (ia2)

60 cas, 60 réponses valides (100,0 %) ; modèle(s) observé(s) : gemini-3.5-flash-lite. Une réponse invalide laisse le classement de départ (le repli) et pèse donc 0 dans le gain.

### Tous les cas (60′ et dry hop)

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 60 | 6,4 % | 9,3 % | 23,3 % | 37,5 | 0,086 |
| option 1 (mots, λ = 0,25), hors ligne | 60 | 6,9 % | 10,1 % | 25,0 % | 31,5 | 0,107 |
| IA (sur l'option 1) | 60 | 8,4 % | 14,5 % | 28,3 % | 31,5 | 0,206 |

Intervalles à 95 % (rééchantillonnage des cas, 2000 tirages, graine fixe) :

| système | MRR | rappel@10 | rang médian du 1er |
|---|---|---|---|
| moteur seul | 0,050 à 0,128 | 3,7 % à 15,5 % | 23,5 à 52 |
| option 1 | 0,066 à 0,155 | 4,6 % à 16,3 % | 17 à 44,5 |
| IA | 0,120 à 0,299 | 7,6 % à 21,9 % | 16 à 44,5 |

IA contre moteur : le premier substitut monte dans 26 cas, descend dans 10, reste dans 24 ; écart de MRR +0,121 (intervalle à 95 % : 0,057 à 0,196).
IA contre option 1 : le premier substitut monte dans 15 cas, descend dans 7, reste dans 38 ; écart de MRR +0,100 (intervalle à 95 % : 0,039 à 0,170).

### Échantillon (graine 181, 30 premiers) — les deux moments

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 60 | 6,4 % | 9,3 % | 23,3 % | 37,5 | 0,086 |
| option 1 (mots, λ = 0,25), hors ligne | 60 | 6,9 % | 10,1 % | 25,0 % | 31,5 | 0,107 |
| IA (sur l'option 1) | 60 | 8,4 % | 14,5 % | 28,3 % | 31,5 | 0,206 |

Intervalles à 95 % (rééchantillonnage des cas, 2000 tirages, graine fixe) :

| système | MRR | rappel@10 | rang médian du 1er |
|---|---|---|---|
| moteur seul | 0,050 à 0,128 | 3,7 % à 15,5 % | 23,5 à 52 |
| option 1 | 0,066 à 0,155 | 4,6 % à 16,3 % | 17 à 44,5 |
| IA | 0,120 à 0,299 | 7,6 % à 21,9 % | 16 à 44,5 |

IA contre moteur : le premier substitut monte dans 26 cas, descend dans 10, reste dans 24 ; écart de MRR +0,121 (intervalle à 95 % : 0,057 à 0,196).
IA contre option 1 : le premier substitut monte dans 15 cas, descend dans 7, reste dans 38 ; écart de MRR +0,100 (intervalle à 95 % : 0,039 à 0,170).

### Les 9 houblons phares — les deux moments

(aucun cas)

### Dry hop seulement (tous les cas)

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 30 | 7,3 % | 12,0 % | 26,7 % | 24 | 0,088 |
| option 1 (mots, λ = 0,25), hors ligne | 30 | 8,4 % | 13,6 % | 30,0 % | 17 | 0,130 |
| IA (sur l'option 1) | 30 | 9,5 % | 21,5 % | 36,7 % | 15 | 0,199 |

Intervalles à 95 % (rééchantillonnage des cas, 2000 tirages, graine fixe) :

| système | MRR | rappel@10 | rang médian du 1er |
|---|---|---|---|
| moteur seul | 0,051 à 0,133 | 3,5 % à 22,2 % | 14 à 40 |
| option 1 | 0,075 à 0,191 | 4,8 % à 24,2 % | 12 à 27 |
| IA | 0,099 à 0,311 | 10,9 % à 33,8 % | 9,5 à 27 |

IA contre moteur : le premier substitut monte dans 21 cas, descend dans 9, reste dans 0 ; écart de MRR +0,112 (intervalle à 95 % : 0,038 à 0,202).
IA contre option 1 : le premier substitut monte dans 10 cas, descend dans 6, reste dans 14 ; écart de MRR +0,069 (intervalle à 95 % : 0,000 à 0,149).

### 60′ seulement (tous les cas) : l'option 1 ne change rien à 60′

| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |
|---|---|---|---|---|---|---|
| moteur seul | 30 | 5,4 % | 6,5 % | 20,0 % | 49 | 0,083 |
| option 1 (mots, λ = 0,25), hors ligne | 30 | 5,4 % | 6,5 % | 20,0 % | 49 | 0,083 |
| IA (sur l'option 1) | 30 | 7,4 % | 7,4 % | 20,0 % | 49 | 0,214 |

Intervalles à 95 % (rééchantillonnage des cas, 2000 tirages, graine fixe) :

| système | MRR | rappel@10 | rang médian du 1er |
|---|---|---|---|
| moteur seul | 0,030 à 0,162 | 1,3 % à 14,0 % | 35,5 à 148 |
| option 1 | 0,030 à 0,162 | 1,3 % à 14,0 % | 35,5 à 148 |
| IA | 0,081 à 0,348 | 1,7 % à 15,2 % | 35,5 à 148 |

IA contre moteur : le premier substitut monte dans 5 cas, descend dans 1, reste dans 24 ; écart de MRR +0,130 (intervalle à 95 % : 0,043 à 0,241).
IA contre option 1 : le premier substitut monte dans 5 cas, descend dans 1, reste dans 24 ; écart de MRR +0,130 (intervalle à 95 % : 0,043 à 0,241).

**Plafond de la fenêtre** : un substitut de référence est dans les 20 candidats pour 24 cas sur 60 ; une IA parfaite qui le mettrait premier plafonne le MRR à 0,412. Ce que le modèle ne voit pas, il ne peut pas le remonter.

**Seuil pour continuer** (+0,05 de MRR ou +5 points de rappel@10 sur le moteur seul, **et** Hallertau Blanc dans les 5 premiers de Nelson Sauvin au dry hop) : gain de MRR +0,120, de rappel@10 +5,2 point(s) sur tous les cas → chiffres atteints ; Hallertau Blanc absent (moteur : –, option 1 : –) → non tenu. **Seuil : critère Hallertau Blanc non mesuré dans ce lot (Nelson Sauvin n'y est pas).** Écart de l'IA à l'option 1 : MRR +0,099, rappel@10 +4,4 point(s).

### Les 9 phares : les 10 premiers de chaque système

### Les cinq cas du brasseur (K1 à K5)

| cas | lecture | résultat |
|---|---|---|
| K1 · Stout « plus floral » | Suggérer, pas Substituer : hors du périmètre de ce banc | non applicable ici |
| K2 · résineux, stout contre lager | Suggérer (échelles de style) | non applicable ici |
| K3 · agrumes, IPA contre lager | Suggérer (échelles de style) | non applicable ici |
| K4 · Nelson Sauvin (vin blanc) | Hallertau Blanc dans les 5 premiers au dry hop | IA : rang hors des 20 candidats ; moteur : – ; option 1 : – → non tenu |
| K5 · Galaxy n'est pas Saaz | Saaz hors des 10 premiers de Galaxy et Galaxy hors des 10 premiers de Saaz, au dry hop | Saaz chez Galaxy : rang – ; Galaxy chez Saaz : rang – → tenu / tenu |

K1 à K3 portent sur Suggérer (visées de recette et échelles de style), pas sur le classement des substituts : l'IA de ce banc n'y touche pas. Ils restent à juger sur un essai de Suggérer.

### Durée, jetons, coût

- Durée par requête : médiane 1986,5 ms, p95 2171 ms, max 2734 ms ; limite de l'écran Substituer : 3 s au p95 → tenue.
- Jetons : entrée 3794 en moyenne (total 227652), sortie 524 en moyenne (total 31445), réflexion comprise.
- Coût estimé (tarifs de `geminiCosts.ts`, 1 USD = 1,25 CHF) : 0.1837 CHF pour 60 appels (60 chiffrés), soit 0.0031 CHF par usage.
