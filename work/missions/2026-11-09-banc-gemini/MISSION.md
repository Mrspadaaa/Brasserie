# Mission 2026-11-09 — La lecture des factures par Gemini : bugs ouverts au banc

Accord du brasseur (09.11) : mission « lecture des factures par Gemini », appels réels payants permis au banc, plafonnés et journalisés.
Skill suivi : `banc-lecture`. Pilote : session lancée par la session parente (branche `claude/gifted-babbage-2b7411`) ; la parente intègre et déploie.

## Objectif

Traiter dix lignes ouvertes de `work/missions/BUGS.md` : LO-4, LO-5, LL-NOTE-1, LL-NOTE-4, LL-NOTE-5, LT-4, LT-5, LT-6, TL-NOTE-2, TL-NOTE-6.
Pour chacune : rejouée sur la vraie pièce au banc (par le code de l'app, pas une copie), un contrôle qui échoue d'abord, puis la correction
mesurée contre la production sur tout le banc (17 pièces, temps compris), ou l'écart prouvé. Fini : chaque ligne corrigée ou écartée avec
sa preuve, banc rejoué sans régression, `npx tsc --noEmit` et tests verts, BUGS.md à jour, commande de déploiement prête pour le pilote.

## Constats

Constat d'abord (hors ligne, sans appel), sur les réponses déjà payées (`H13-reels/banc-k6-AC`, `banc-k7-prod`, `banc-k8-prod`) recalculées par le
code de HEAD (`banc-m9-avant-*`) :

| bug | cause mesurée | décision |
|---|---|---|
| LO-4 | Les trois lectures de doc5 rendent 26 articles dont 1 port (k7, k8). L'écran de lecture (`Recap`) compte les lignes sans le port (25, D249) ; « Déjà enregistré » (`PieceDejaSaisie`) compte toutes les lignes enregistrées, port compris (26). Ce n'est pas la lecture. | Un seul critère, celui de `groupes.ts` (`lignesDePort`) : « Ses 25 lignes et le port ». |
| LO-5 | Le QR de doc5 est vu (version 12, 65 modules) à **5 px par module** (le registre GESTES disait 2,5 : faux), barré par le tampon rouge imprimé sur la pièce (« bereits dankend »). zxing : ChecksumError (Reed-Solomon dépassé) ; recadrage, agrandissement ×1 à ×6, canal rouge, min, max, deux binariseurs, `tryDenoise`, comblement du rouge par diffusion (3 seuils) : 0 lecture sur 164 essais. Une nouvelle photo ne changera rien. | Dans l'état « illisible » de sa maquette z2 (pas un état neuf) : ne plus proposer « Photographier le QR » quand le QR vu est assez grand (≥ 4 px par module) ; la fiche dit « vu, barré ou abîmé : rien décodé ». Sous 4 px, le geste reste. |
| LT-5 | doc21 : deux lectures rendent le même bloc TVA (8,1 %, base 51,80, TVA 3,88) ; seul le libellé du code diffère (« N » / « %-TVA1 »). La clé de comparaison du bloc compte le code : désaccord, statut `disputed`. | Comparer le bloc par taux, base et montant (en centimes) ; le code n'est qu'un libellé, il ne fait pas voter. |
| LT-6 | doc1 (capture d'une facture écran) n'imprime aucune date de facture : seules la date de la galerie et des périodes de service (« from … to … », « on … »). Sur k6, les trois lectures rendent la même date : **faux vert** que le code de HEAD garde (`banc-m9-avant-k6-AC` : FV 1). Sur k7 et k8, une lecture la laisse vide : signalé par chance du tirage. | Consigne de lecture : une date de période, d'échéance ou de livraison n'est pas la date du document ; sans date de document imprimée, date vide et un `fieldWarning` date. Mesure payante (ci-dessous). |
| LT-4, LL-NOTE-1, LL-NOTE-4, LL-NOTE-5, TL-NOTE-2, TL-NOTE-6 | voir « Suites » à la fin, une ligne par bug, mise à jour au fil | — |

## Décisions

- Les corrections suivent la colonne « décision » des constats ; décideur : pilote (règle n° 1 : l'état « illisible » est celui de sa maquette z2, rien de neuf n'est dessiné).
- **Budget annoncé avant toute passe payante** : 2,5 CHF au plus pour cette mission (plafond de passe 3 CHF, D242 ; cumul du journal au 09.11 : 10,57 CHF
sur 24,5 au plafond du code). Prévu : la production modifiée sur les 17 pièces, 2 tirages (≈ 1,3 CHF estimés à `--estimer`), plus doc1 seul en 3 tirages
(≈ 0,1 CHF). Journal : `work/missions/2026-11-01-banc-lecture/journal-gemini.md`.

## Voies

| voie | niveau | modele | plafond | decideur | controles | possede | depend de |
|---|---|---|---|---|---|---|---|
| m9-code | jugement | opus | 120 | pilote | `npx tsc --noEmit` ; `npx vitest run tests/unit/depense/m9 tests/unit/invoiceScanVote.test.ts` ; banc hors ligne `banc-m9-apres-*` contre `banc-m9-avant-*` ; passe payante `banc-m9-payant` | src/ui/finance/PieceDejaSaisie.tsx, src/services/qrLecture.ts, src/services/qr.worker.ts, src/services/qrOptions.ts, src/ui/depense/qrVue.ts, functions/src/invoiceVisionReview.ts, functions/src/prompts.ts, tests/unit/depense/m9/, work/missions/2026-11-09-banc-gemini/ | — |
| m9-gestes | mécanique | haiku | 40 | pilote | gestes joués en local (`?dev-local`, lecture simulée, aucune écriture Firestore), captures ouvertes, RESULTAT.md au fil | work/missions/2026-11-09-banc-gemini/voies/m9-gestes/ | m9-code |

## État de l'art

- Problème type : (1) lecture d'un QR code abîmé (symbole vu, Reed-Solomon dépassé) ; (2) consensus de plusieurs extractions d'un même document par LLM (vote, « self-consistency »), avec comparaison sur une forme canonique ; (3) extraction d'un champ absent : abstention plutôt que valeur voisine (une date de période prise pour la date du document).
- Examiné : (1) zxing-cpp (zxing-wasm 3.1.5, déjà dans l'app) avec ses options `tryHarder`, `tryRotate`, `tryInvert`, `tryDownscale`, `tryDenoise`, binariseurs LocalAverage et GlobalHistogram ; recadrage et agrandissement ; masque du rouge et comblement (inpainting par diffusion, l'idée de `cv.inpaint` d'OpenCV) ; le détecteur WeChat d'OpenCV contrib (super-résolution par réseau) ne sert qu'aux QR trop petits, or celui-ci fait 5 px par module ; un décodeur avec effacements (Reed-Solomon à erasures) n'existe dans aucune bibliothèque maintenue pour le web (il faudrait l'écrire : non, L29) ; (2) le vote de l'app (`invoiceVisionReview.ts`, majorité par clé canonique) ; la pratique standard de la liaison d'enregistrements : normaliser avant de comparer, comparer les champs porteurs de sens (taux, base, montant) et non les libellés libres ; (3) SimpleQA (OpenAI, 2024 : « non tenté » préférable à l'incorrect), la consigne existante (« la date vient du document imprimé, jamais de l'horloge, de la galerie »), et le banc maison pour mesurer une consigne contre la production.
- Décision : (1) pas de nouveau décodeur : la pièce est barrée par son propre tampon, aucune méthode standard ne la relit (164 essais mesurés) ; on ne propose plus un geste inutile, le pas du module (position et taille du symbole rendus par zxing) dit si une photo peut aider ; (2) comparer le bloc TVA sur sa forme canonique (taux, base, montant), sans dépendance ; (3) une phrase de consigne pour l'abstention sur la date, mesurée au banc maison (production contre production modifiée, toutes les pièces, temps compris), aucune bibliothèque d'évaluation ajoutée.

## Boucle de retour

Chaque correction : contrôle qui échoue sur HEAD (Vitest sur la règle, ou banc hors ligne sur les réponses payées), puis vert ; le banc hors ligne
rejoue les 17 pièces sur k6, k7 et k8 avant et après (champs, lignes, faux verts, alertes inutiles, statuts) ; la consigne de date se juge en passe payante
(un indice sous 40 pièces, pas une preuve). Les sorties restent dans `H13-reels/` (hors Git) ; ici, des comptes et des noms de champs seulement.

## Sources

- `work/missions/BUGS.md` (lignes LO, LT, LL-NOTE, TL-NOTE) ; le rapport du rejeu en ligne du 08.11 (copie de travail du pilote, hors de cette branche) ;
  `work/missions/2026-11-03-lecture-longue/PLAN.md` et `work/missions/2026-11-03-lecture-longue/voies/s-stock/RESULTAT.md` (cas B et C) ;
  `work/missions/2026-11-01-banc-lecture/GESTES.md`, `journal-gemini.md` ; skill `banc-lecture`.

## Mesures (09.11)

Sorties hors Git dans `H13-reels/` : `banc-m9-avant-*` (code de HEAD sur les réponses payées k6, k7, k8), `banc-m9-apres2-*` (code corrigé, mêmes réponses),
`banc-m9-payant` et `banc-m9-payant-r` (passe payante, consigne de date, 17 pièces, 1 tirage, 0,76 CHF), `banc-m9-payant-t2` (second tirage, 0,83 CHF).
Dépense de la mission : 1,59 CHF (journal : 10,57 → 12,16 CHF), sous les 2,5 annoncés. Moins de 40 pièces : des indices, pas des preuves.
Toutes les colonnes sont jugées avec la même vérité (doc6 corrigée, voir LT-6) et le banc corrigé (LT-2).

| | k8 HEAD | k8 corrigé | k7 HEAD | k7 corrigé | k6 HEAD | k6 corrigé | m9 tirage 1 | m9 tirage 2 |
|---|---|---|---|---|---|---|---|---|
| champs justes / 201 (k6 : / 165) | 191 | 192 | 189 | 189 | 154 | 154 | 194 | 193 |
| lignes justes / 260 (k6 : / 224) | 239 | 239 | 240 | 240 | 218 | 218 | 250 | 238 |
| faux verts | 0 | 0 | 0 | 0 | 1 (doc1, date) | 1 (mêmes réponses) | 0 | 0 |
| faux « corrigés » | 0 | 0 | 0 | 1 (doc1, date) | 0 | 0 | 0 | 0 |
| alertes inutiles | 6 | 5 | 6 | 5 | 5 | 5 | 9 | 6 |
| durée médiane | 11,1 s | = | 9,8 s | = | 17,6 s | = | 17,5 s | 24,2 s |

« HEAD » et « corrigé » sur k6, k7, k8 rejouent les MÊMES réponses déjà payées (ancienne consigne) : seul le code serveur change (LT-5). m9 : nouvelles réponses,
nouvelle consigne. doc1 sur m9 : tirage 1, 3 lectures sur 3 sans date ; tirage 2, 2 sur 3, la troisième avec un avertissement date ; résultat final vide et signalé
les deux fois (avant : k6 0 sur 3, k7 1, k8 2). La date n'a déclenché la 3.8 qu'une fois par passe (k7, k8, m9 tirage 2) ou jamais (m9 tirage 1).

- LT-5 seul démasque LT-6 : sur k7, doc1 n'était en désaccord que par le libellé du code TVA ; sans lui, la date inventée (2 lectures sur 3) passait en « corrigé ».
  La consigne de date règle la cause : m9, doc1, 3 lectures sur 3 laissent la date vide avec un avertissement (k6 : 0 sur 3, k7 : 1, k8 : 2).
- Aucune date imprimée perdue par la consigne (17 pièces, chaque lecture comparée à la vérité) ; doc7 et doc14 n'étaient déjà jamais lues (M9-2).
- Banc : il rejouait C★v sans la règle LT-2 de la production (doc21 : faux « corrigé » 07.11.2025 que la production ne fait pas). Corrigé par une seule
  fonction partagée (`dateDuVoteEtoile`), test qui échoue sur l'ancien banc.
- Temps : médiane 17,5 et 24,2 s (k8 de nuit : 11,1 s ; k7 : 9,8 s). Chaque appel est plus lent par jeton l'après-midi (Flash-Lite 2,77 et 2,23 ms contre
  2,07 ; 3.8 7,34 et 7,90 ms contre 5,98), l'entrée ne gagne que 73 jetons (≈ 3 %), la sortie est plus courte, et les 3.8 de plus (14 et 16 parcours contre 11
  à 12) sont déclenchées par des écarts de nom et de nature des lignes, jamais par la date : le temps ne vient pas de la phrase ajoutée. Indice, pas preuve :
  aucune passe de contrôle de l'ancienne consigne n'a été faite à la même heure.
- Alertes inutiles 9 et 6 contre 5 : doc1 (date absente à remplir, voulu) et des écarts de catégorie ou de nature selon le tirage.

## Suites (une ligne par bug)

- LO-4 : corrigé (« Ses 25 lignes et le port »), test qui échoue sur HEAD (26).
- LO-5 : corrigé (plus de « Photographier le QR » pour un QR vu net) ; chaîne de l'app rejouée sur la vraie pièce avec zxing-wasm 3.1.5 en Node. Dans
  Chrome local, le QR ne tourne pas sur ce poste : `node_modules/zxing-wasm` y est un lien vers `%TEMP%/deploy-hosting-qr`, hors de `server.fs.allow` de Vite.
- LT-5 : corrigé (serveur) ; écran : « 3 à contrôler » et le bandeau TVA sur HEAD, 0 et rien avec la correction (jsdom, lectures fictives à la forme de doc21).
- LT-6 : date de doc1 sous « vérifié » corrigée par la consigne ; ajouts non signalés restants sur m9 : doc3 (ligne par bulletin, vérité à 0 ligne alors que
  l'écran voulu, LO-1, en montre une par bulletin), doc11 (HT selon le tirage) ; doc6 : vérité trop stricte, corrigée (TVA 3,00 = somme du bloc imprimé).
- LT-4 : écarté, outil : allègement de doc15 (8,3 → 3,9 Mo) 362 ms, une tâche longue de 306 ms sur PC ; découpe et QR déjà hors du fil (LO-2).
- LL-NOTE-1 : écarté : doc21 lu entier juste (k7, k8, m9 : 2/2 lignes, champs justes).
- LL-NOTE-4 : écarté : `DEPLOIEMENT.md` corrigé le 08.11 (ligne 7) ; la garantie de D381 tient (0 ligne perdue, 0 rognée sur 200 pièces neuves) ; une coupe
  silencieuse est relue par sa bande de contrôle.
- LL-NOTE-5 : tranchée sans le bloquer (CLAUDE.md) : B1 et B2 restent tels quels (le refus dit quoi faire, « Relier à … » est proposé ; prudent et
  réversible) ; C0 et C3 (ligne ingrédient enregistrée hors stock sans alerte) deviennent M9-1.
- TL-NOTE-2 : joué en local (Plié/Déplié, Garder 14 → 13 proposés, Retirer la ligne 3 et Annuler, Confirmer) ; en ligne : reste au pilote (ZZ TEST).
- TL-NOTE-6 (volet Dépense) : la croix n'enregistre jamais (« Abandonner cette saisie ? Rien n'est enregistré ») ; Détail ≠ Total refusé à « Confirmer »
  (« Le détail des lignes doit correspondre exactement au total TTC. ») ; unité changée : tests jsdom `rejeu-ff0f-depense/unite-deduite` ; Recettes et Stocks : hors mission.

## Constats neufs (versés à BUGS.md)

- M9-1 : Dépense, stock (cas C0 et C3 de `s-stock`) : une ligne ingrédient restée « hors stock » (plusieurs articles proches, ou type changé en Ingrédient
  sans « Suivre au stock ») s'enregistre sans stock et sans alerte à « Confirmer ».
- M9-2 : Lecture (doc7, doc14) : une date imprimée n'est lue par aucune lecture (k7, k8, m9 : 0 sur 8).
- M9-3 : Dépense : après « Retirer la ligne 3 », la carte garde « ✓ Somme = imprimé 86,50 » alors que le pied dit « Lignes 84,10 · total 86,50 · 2,40 de moins ».
- M9-4 : Banc : C★v rejoué sans la règle LT-2 (corrigé ici).

## État de reprise (09.11, fin)

- Fait : commits 6c17266f (code, tests), fb2dfba0 (BUGS, mesures), 81ddc5b9 (journal du témoin), 053f0c78 (montants fictifs des tests) ; PR #200 vers claude/refonte-houblons-v4 ; aiTask déployée depuis 81ddc5b9 (sans functions/.env, aucun refus aux journaux ; aucun appel réel encore passé).
- Reste au pilote : hébergement (LO-4, LO-5) après le contrôle D342 ; TL-NOTE-2 et TL-NOTE-6 en ligne (ZZ TEST) ; LT-6 ajouts non signalés selon le tirage (doc3, doc11) ; M9-1 à M9-3.
- Environnement du worktree : jonctions node_modules, functions/node_modules, H13-reels ; .env, .env.local, seedData.ts copiés (ignorés). Témoin m9-temoin retiré.

## Lenteur : mesure appariée (09.11, 17 h, à sa demande « regarde pour cette lenteur en détail »)

Ancienne consigne (copie détachée de f04e2119) et nouvelle, lancées EN MÊME TEMPS sur 8 pièces (doc1, doc2, doc5, doc8, doc10, doc12, doc15, doc21), 1 tirage,
0,38 + 0,29 CHF (mission : 2,26 CHF au total). Sorties : `banc-m9-ab-ancienne`, `banc-m9-ab-nouvelle` (bloc-notes de la session, hors Git).

| | ancienne | nouvelle |
|---|---|---|
| Flash-Lite, ms par jeton de sortie (médiane) | 2,31 | 2,35 |
| 3.8, ms par jeton de sortie (médiane) | 7,00 | 6,95 |
| entrée par lecture | — | +73 jetons |
| pièces où la 3.8 est appelée | 7 sur 8 | 5 sur 8 |
| parcours, médiane | ≈ 18,5 s | ≈ 12 s |

Lectures Flash-Lite appariées (même pièce, même n° de lecture) : durées égales à ±1 s, sauf doc10 lecture 1 (8,3 s → 19,0 s pour une sortie identique,
4 462 → 4 524 jetons) : variance du service. Conclusion : la lenteur des passes de l'après-midi vient de l'API (latence par jeton et 3.8 appelée selon
les écarts des lignes), pas de la phrase de consigne. Indice sur 8 pièces, cohérent avec les deux passes complètes.
