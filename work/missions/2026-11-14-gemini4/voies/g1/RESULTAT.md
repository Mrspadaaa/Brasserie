ECHEC — critère « jugement sur la moitié paire » : grille impaire mesurée (4,03 CHF), puis HTTP 429 (plafond de dépense mensuel du projet Google) ; Argon@low prometteur, non jugé

## Mesures (14.11, exécutant)
Cumul réel journalisé : **4,027 CHF** sur 10 (sonde 0,052 ; P0 témoin 0,681 ; 12 cellules impaires jusqu'à 4,027 ; P2 : 0 CHF, refusé). Journal : `work/missions/2026-11-14-gemini4/journal-gemini.md`. Aucune commande relancée. La sonde Argon@low a été acceptée par `generateContent` (pas de 400) ; doc21 n'a pas de 3ᵉ lecture, la sonde a donc été refaite sur doc1 (Argon@low 22,9 s, 0,0346 CHF).

**Arrêt** : à `gemini-4-hydrogen@xhigh` (8 pièces sur 9), puis `argon@high` et `carbon@high` (6 pièces), puis P2 (`argon@low` pair, 5 pièces), Google répond HTTP 429 « Your project is temporarily rate-limited to prevent exceeding its monthly spending cap ». Ce plafond est celui du projet Google, pas celui de la mission (cumul 4,03 < 9,5). Les lignes de 3ᵉ lecture en échec (0,2 à 0,3 s) ne sont pas des mesures : les cellules xhigh, argon@high, carbon@high et le P2 sont **inutilisables**. Il faut relever le plafond côté Google (accord du brasseur, geste de compte) avant de continuer.

### Moitié impaire (réglage, 9 pièces ; 5 3ᵉ lectures par cellule ; témoin 3.8@low = production)
Source : `voies/g1/tableau-impairs.md`. Lignes perdues : 0 partout ; inventées : 1 partout (la même) ; total TTC juste et faux verts : sans écart (9/9, 0).
| cellule | lignes justes /108 | champs /105 | 3ᵉ p50 / p90 | coût par pièce CHF | total CHF (au 1.12) |
|---|---|---|---|---|---|
| 3.8@low (témoin) | 78 | 101 | 14,0 / 20,5 s | 0,0305 | 0,274 |
| 3.8@medium | 97 | 103 | 45,8 / 69,6 s | 0,0558 | 0,502 |
| 3.8@high | 99 (3 coupées) | 101 | 75,1 / 84,4 s | 0,0721 | 0,649 |
| hydrogen@low | 93 | 103 | 19,8 / 23,4 s | 0,0455 | 0,409 |
| hydrogen@medium | 92 | 103 | 26,2 / 30,7 s | 0,0567 | 0,510 |
| hydrogen@high | 92 (1 coupée) | 101 | 34,7 / 45,1 s | 0,0652 | 0,586 |
| argon@low | **108** | 103 | 39,2 / 47,2 s | 0,0450 | 0,405 (0,660) |
| argon@medium | 107 | 103 | 32,2 / 45,2 s | 0,0454 | 0,409 (0,667) |
| carbon@low | 91 | 103 | 35,0 / 41,7 s | 0,0455 | 0,410 (0,669) |
| carbon@medium | 107 | 103 | 38,8 / 86,1 s | 0,0455 | 0,410 (0,669) |
| hydrogen@xhigh, argon@high, carbon@high | non mesurées (429) | | | | |

### Moitié paire (jugement) : non faite
`voies/g1/tableau-pairs.md` : seul le témoin (8 pièces : lignes 129/152, 3ᵉ p50 16,1 s, 0,0443 CHF par pièce) est complet ; Argon@low n'a que 5 pièces et ses 3 3ᵉ lectures ont reçu 429 : aucune comparaison permise.

### Recommandation chiffrée (provisoire : réglage sur les impairs seulement, un tirage, 5 3ᵉ lectures par cellule)
- Meilleure case : **Argon@low** : 108/108 lignes justes contre 78/108 pour le témoin 3.8@low (+30 lignes, +28 points ; 3.8@medium n'en rend que 97). Coût par pièce +48 % (0,0450 contre 0,0305 CHF ; +63 % au 1.12.2026 : 0,074 contre 0,0305). Temps de la 3ᵉ lecture p50 39 s contre 14 s (+25 s), p90 47 s contre 20 s ; parcours p90 54,8 s contre 27,5 s.
- Repli moins cher et plus rapide : Hydrogen@low : 93/108 (+15 lignes), 3ᵉ p50 19,8 s (+6 s), +49 % de coût, prix stable. Réfléchir davantage n'aide pas les 3.8 ni Hydrogen (medium 92, high 92).
- Carbon@medium (107) n'apporte rien sur Argon@low et son p90 monte à 86 s ; Carbon@low (91) est perdant. Argon@medium (107) ne bat pas @low.
- Écart Argon contre les autres : porté par 5 3ᵉ lectures seulement ; un tirage ne mesure pas le bruit. Non confirmé sur les paires : ne pas basculer `aiTask` avant le jugement. Aucun diff de déploiement proposé. Aucun document en recul n'a été relevé dans le tableau (lignes perdues 0), mais le détail par pièce n'a pas été lu.
- Reprise suggérée (≈ 1 CHF, après relèvement du plafond Google) : Argon@low, Argon@medium, Hydrogen@low sur les paires, puis un second tirage de la gagnante.

CONNAISSANCE : le projet Google a un plafond de dépense mensuel propre qui renvoie HTTP 429 « monthly spending cap » avant celui de la mission (atteint à ≈ 4 CHF de passes du 14.11) ; `generateContent` accepte les modèles 4 (sonde Argon@low OK).
LEÇON PROPOSÉE : aucune.

(Ci-dessous : état de l'auteur précédent, avant les passes.)

Dépense Gemini à ce jour : 0 CHF (journal `work/missions/2026-11-14-gemini4/journal-gemini.md` pas encore créé ; il naît à la première passe). Aucun appel réseau, aucune clé lue.

## 1. Faits officiels (lus le 14.11.2026, pages publiques, sans clé)
- Identifiants : `gemini-4-hydrogen`, `gemini-4-argon`, `gemini-4-carbon` — https://ai.google.dev/gemini-api/docs/models (contexte 1M, sortie 64K, image + PDF).
- Prix par million de jetons (entrée / sortie, réflexion comprise) — https://ai.google.dev/gemini-api/docs/pricing :
  Hydrogen 1,50 $ / 7,50 $ (gratuit en offre gratuite, mais « utilisé pour améliorer les produits : oui » : jamais de factures réelles en offre gratuite) ;
  Argon et Carbon 2,00 $ / 10,00 $ jusqu'au 30.11.2026, puis 4,00 $ / 20,00 $ dès le 1.12.2026 ; ni l'un ni l'autre n'existe en offre gratuite : la clé payante est requise.
  La 3.8 (témoin) : 1,50 $ / 7,50 $.
- Réflexion — https://ai.google.dev/gemini-api/docs/thinking : niveaux `thinking_level` : Hydrogen low, medium, high (défaut), **xhigh** ; Argon et Carbon low, medium (défaut), high ; 3.8 low, medium (défaut), high. « minimal » n'existe ni sur la 3.8 ni sur les modèles 4. Google prévient que xhigh peut épuiser `max_output_tokens` sur une extraction JSON simple.
- Piège à sonder : la doc des modèles 4 présente l'API Interactions ; le banc appelle `generateContent` avec `thinkingConfig.thinkingLevel`. Non vérifié en vrai : la sonde d'un pixel (≈ 0,005 CHF) est la première commande payante. Si `generateContent` refuse un modèle 4 (HTTP 400, non facturé), la voie est à reprendre avec l'API Interactions : DÉCISION À PRENDRE ci-dessous.

## 2. Livré (rien dans `src/` ni `functions/` ; aucun déploiement)
- `scripts/banc-lecture-modeles.ts` (neuf) : liste des 3 modèles, tarifs d'aujourd'hui et du 1.12, niveaux permis par modèle, devis/coût/réserve d'un modèle 4 (le garde-fou de la production ne les connaît pas : gabarit 3.8 pour le devis, tarif propre pour le coût), état `--fort`.
- `scripts/banc-lecture-facture.ts` (options, sans effet quand elles sont absentes) : `--fort <modèle>@<niveau>` (remplace modèle et réflexion de tout appel parti en 3.8 : la 3ᵉ lecture ; plafond de sortie relevé à 12 000, délai 90 s, car la réflexion compte dans la sortie), `--journal <fichier>` et `--plafond-cumul <CHF>` (journal et cumul de la mission), `--preter-lite` (prête les deux Flash-Lite d'une sortie précédente : les cellules se comparent sur les mêmes lectures Flash-Lite, donc les mêmes désaccords, et ne paient que la 3ᵉ lecture) ; avec `--fort`, jamais une 3.8 prêtée ; le journal écrit `modèle@niveau`. `--estimer` suit les mêmes options. (Note : l'estimation étiquette encore « gemini-3.8-flash » la ligne de la 3ᵉ lecture, par cosmétique ; les chiffres sont ceux du modèle choisi.)
- `scripts/banc-lecture-gemini4-comparer.ts` (neuf) : tableau par cellule — champs, lignes justes, lignes perdues et inventées (comptes de lignes), total TTC juste, faux verts, 3ᵉ lectures et coupées, 3ᵉ p50/p90, parcours p50/p90, coût par pièce, par 3ᵉ lecture, total au tarif d'aujourd'hui et au 1.12 ; `--docs=` pour une moitié.
- `tests/unit/banc-lecture-modeles.test.ts` (neuf, 5 tests, Gemini simulé).
- `work/missions/2026-11-14-gemini4/voies/g1/outils/` : trois scripts d'édition à usage unique (CRLF) et le réducteur de page HTML ; sans autre usage.

## 3. Critères
- Tests : `npx vitest run tests/unit/banc-lecture* tests/unit/invoice*` → 16 fichiers, 464 tests verts (`tests.txt`).
- `npx tsc --noEmit -p .` racine : 0 erreur ; `functions/` : 0 erreur.
- `--simuler` (17 pièces, `--fort gemini-4-argon@high`) : `BANC SIMULE OK — 52/52 fausses réponses fabriquées retrouvées` (`simulation.log`).
- `--estimer` : sur 17 pièces avec les deux Flash-Lite prêtées, 3ᵉ lecture en Carbon@high : réserve au pire 2,84 CHF (17 lectures, sortie au plafond de 12 000), dépense probable ≈ 0,5 CHF ; témoin 3.8@low : réserve 0,45 CHF, probable ≈ 0,14 CHF (3 lectures neuves ; 12 prêtées d'un vieux banc : à ne pas utiliser, voir P0). Le banc tire 12 3ᵉ lectures sur 17 pièces en production : le rôle de la 3.8 est sollicité sur ≈ 70 % des pièces, donc mesurable.
- Journal de coût : non commencé (0 CHF).

## DEMANDE EXECUTANT
Pièces : les 17 pièces à vérité (`cas.json` à `cas-6.json`, dans `H13-reels`, hors Git). Moitié « réglage » (positions impaires, 9) : doc1,doc3,doc5,doc7,doc9,doc11,doc13,doc15,doc21. Moitié « jugement » (paires, 8) : doc2,doc4,doc6,doc8,doc10,doc12,doc14,doc16. Depuis la racine du worktree, en Git Bash :

```
R=work/finalisation-tickets-2026-10-08/H13-reels ; G=work/missions/2026-11-14-gemini4
CAS=cas.json,cas-2.json,cas-3.json,cas-4.json,cas-5.json,cas-6.json
ODD=doc1,doc3,doc5,doc7,doc9,doc11,doc13,doc15,doc21 ; EVEN=doc2,doc4,doc6,doc8,doc10,doc12,doc14,doc16
RUN="npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts --"
COMMON="--payant --confirm-paid-ai --repeat 1 --variantes Csv8 --normaliser --cas $CAS --journal $G/journal-gemini.md --budget-chf 9.5 --plafond-cumul 9.5"
```
Chaque commande est lancée une fois ; un échec ne se relance pas (le dire). Après chacune : recopier la dernière ligne du banc, `Dépense réelle`, et le dernier « cumul CHF » du journal. Arrêt si le cumul dépasse 5,0 CHF avant P2, ou si une sonde est refusée.

1. Sonde (≈ 0,005 CHF) : une 3ᵉ lecture en Argon@low sur une pièce : `$RUN $COMMON --docs doc21 --fort gemini-4-argon@low --plafond-passe 0.3 --out $R/banc-g1-sonde`. Attendu : une ligne de journal « gemini-4-argon@low », état STOP, ou une 3ᵉ lecture non demandée si les Flash-Lite concordent (alors prendre doc1). HTTP 400 : s'arrêter et rendre le motif (ligne « Gemini HTTP 400 (modèle) : … » du banc).
2. P0, témoin (3.8@low = production, Flash-Lite payées une fois, toutes les pièces) : `$RUN $COMMON --plafond-passe 1.6 --out $R/banc-g1-base` (≈ 0,5 à 0,7 CHF). Pas de `--reprendre`.
3. P1a, réglage court (moitié impaire ; ≈ 2 CHF en tout), chacune avec `--docs $ODD --reprendre $R/banc-g1-base --preter-lite --plafond-passe 0.8 --fort <cellule> --out $R/banc-g1-odd-<cellule avec @ remplacé par ->` pour les cellules : `gemini-3.8-flash@medium`, `gemini-4-hydrogen@low`, `gemini-4-hydrogen@medium`, `gemini-4-argon@low`, `gemini-4-argon@medium`, `gemini-4-carbon@low`, `gemini-4-carbon@medium`.
4. P1b (même forme) : `gemini-3.8-flash@high`, `gemini-4-hydrogen@high`, `gemini-4-hydrogen@xhigh`, `gemini-4-argon@high`, `gemini-4-carbon@high`.
5. Le tableau de la moitié impaire (le témoin P0 y est filtré par `--docs=`) :
`npx vite-node --config vitest.config.ts scripts/banc-lecture-gemini4-comparer.ts -- --docs=$ODD "--cellule=3.8@low::$R/banc-g1-base" "--cellule=<cellule>::$R/banc-g1-odd-<cellule>" … > $G/voies/g1/tableau-impairs.md`. Fichiers produits : les dossiers `banc-g1-*`, `journal-gemini.md`, `tableau-impairs.md`. Rendre à l'auteur : le tableau, le cumul, les échecs. Ouvrir aucune capture (aucune n'est produite).
6. P2 (jugement) : après lecture du tableau par l'auteur, qui nommera 2 ou 3 finalistes ; mêmes commandes sur `--docs $EVEN`, puis tableau `--docs=$EVEN` avec le témoin.

## Doutes et limites
- La mesure compare des **arbitres** sur les mêmes lectures Flash-Lite (même désaccord) : c'est le rôle de la 3.8 en production (`aiTask`, 3ᵉ lecture) ; 12 3ᵉ lectures sur 17 pièces, donc peu de données par cellule : un indice, pas une preuve (banc, § données). Une cellule à 8 192 jetons de la production n'est pas comparée à 12 000 : le témoin 3.8@low garde 8 192 (production) ; les cellules « fort » ont 12 000, ce que le rapport devra dire.
- Un seul tirage : le bruit d'une même cellule n'est pas mesuré ; confirmer le gagnant sur un second tirage de la moitié jugée si le budget le permet (≈ 0,3 CHF).
- Vitesse : le temps d'un parcours inclut la durée des Flash-Lite prêtées (identique d'une cellule à l'autre) ; la différence est dans « 3ᵉ p50 / p90 ».
- Argon et Carbon doublent le 1.12 : le tableau donne le coût des deux tarifs.

DÉCISION À PRENDRE : si la sonde montre que `generateContent` refuse les modèles 4 (HTTP 400, non facturé), faut-il porter le banc sur l'API Interactions (nouvelle voie : le corps, la lecture de la réponse, les jetons) ou arrêter là ? Recommandation : porter le banc seulement si Hydrogen/Argon promettent un gain ; sinon rester en 3.8 et noter la raison. `aiTask` suit `generateContent` : une bascule en production demanderait la même migration.

CONNAISSANCE : Gemini 4 (hydrogen, argon, carbon), tarifs et niveaux de réflexion du 14.11.2026 (section 1) ; Argon et Carbon doublent le 1.12.2026 ; offre gratuite d'Hydrogen = données utilisées par Google.
LEÇON PROPOSÉE : un auteur qui doit lancer une série payante de 15 commandes ne doit pas d'abord lire 3 000 lignes de banc : ses deux cartes (options, estimation) suffisaient ; lire d'abord `--estimer` et `parseArgs`, puis seulement le chemin d'un appel (contexte épuisé à 190 k avant la première passe).
