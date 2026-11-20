# Voie g1 : tests Gemini réels (20.11), seconde reprise — OK en code ; captures et relectures payantes restent (DEMANDE EXECUTANT)

Dépensé : **0,6831 CHF** au total (cumul du journal, inchangé : aucun appel réel dans cette reprise ; reste 6,1169 CHF sous le plafond de 6,80). Plafond de contexte atteint : REPRISE : voir « DEMANDE EXECUTANT » et les lignes ouvertes.

Décision LR3-1 (pilote) appliquée. Mots vérifiés : SPEC-BRASSEUR ne contient pas de LT-3 mot pour mot ; le contrat vit dans le code et son test : `functions/src/prompts.ts` l. 183 (« Ne transforme jamais une quantité absente en 1 »), `invoiceScanCore.ts` (« jamais une quantité qui n'est pas imprimée »), `banc-k6/lt3-ticket-quantite.test.ts` (« rien n'est inventé »). Ils l'interdisent : la déduction « quantité 1 » est retirée (29177f4b3). Nuance : SPEC-BRASSEUR l. 1036 (01.11, unités) accepte une déduction « sûre ou probable, marquée jaune » pour l'UNITÉ, pas pour la quantité.

## Verdicts
- M9-2 | écarté | — | non reproduit en lecture réelle (20.11) : doc7 et doc14 n'impriment aucune date ; « date lue : rien » est juste
- BT-NOTE-3 | écarté | — | joué en réel sur 8 pièces : montants de lignes, total et TVA justes
- LR2-2 | écarté | — | non reproduit en réel (doc23) : H21 lu « qté 2, montant 50,00 », prix déduit 25,00 et dit
- LR2-NOTE-1 | écarté | — | non reproduit en réel (doc24, 3 tirages : jamais de 30e ligne)
- SU-NOTE-6 | corrigé | 9c2966ba1 | la 3.8 a 60 s (45 s aux Flash-Lite), total 100 s inchangé ; test bugs-g1-SU-NOTE-6
- LR3-1 | écarté | — | conforme au contrat LT-3 : quantité non imprimée laissée vide (déduction « 1 » de fc0d78b32 retirée par 29177f4b3 ; test bugs-g1-LR3-1 garde « quantité null, prix null, aucune marque déduit » sur doc25 réel)
- LR1-8 | ouvert | — | accord requis : le 4,25 perdu et le 9,95 en trop ne venaient pas seulement de la quantité : sans la déduction ils reviennent (test bugs-g1-LR1-8 sauté). Cause vue en rejouant doc25 : les deux lectures rattachent l'EAN (référence) à la mauvaise ligne et `alignLines` (tier 2, référence seule) rapproche AFFRET 4,25 de « AFFRET / DEBOUCREOR » 7,50, puis tout se décale d'un rang ; les ancres par les chiffres échouent (kind divergent). Une rustine de plus sur ce module est refusée (L29) : état de l'art à faire : alignement de deux séquences de lignes (Needleman-Wunsch, ressemblance des noms)
- LR2-9 | ouvert | — | accord requis : même cause que LR1-8 (alignement) ; en plus VITRIFIC lu 69,95 pour 6,95 par les deux Flash-Lite : lecture du modèle (la 3.8 lit 6,95 quand elle a le temps)
- LR2-4 | corrigé | 8c2394af7 | la rangée Articles ne compte plus le port (`nLusAff`) : « 16 lignes · dont port » et « Articles 16 lus » ne se contredisent plus ; test bugs-g1-LR2-4 (4 verts, 2 échecs avant), lt3-ticket-quantite vert (contrat intact), controlesPiece.serveur remis à l'état committé
- LR2-6 | corrigé | cacacd120 | `rangMontantDeduit` (invoiceScanCore.ts) : une seule ligne sans montant, les autres ont le leur, leur somme = total imprimé, aucune ligne perdue : 0,00 marqué `montantDeduit` ; sinon rien. Branché : geminiScanner, finale.ts, `ligneConfianceDe`, confiance.ts (niveau « repris » jaune, raison « montant déduit : les autres lignes font déjà le total », levé dès qu'un autre montant est tapé) ; état dev-local `montant-deduit` (SIMULÉ). Tests bugs-g1-LR2-6 (3, doc2 réel rejoué : chaque lecture et le final) et bugs-g1-LR2-6-ecran (2) : échouaient avant. Limite : captures pas encore ouvertes (voir DEMANDE EXECUTANT)
- LR1-NOTE-1 | ouvert | — | accord requis : non joué (noms FR : `scripts/banc-noms-fr.ts` sur doc15, doc24, doc25, quelques centimes) ; contexte de l'agent épuisé, budget disponible
- LR1-NOTE-2 | ouvert | — | accord requis : non joué, même relecture que LR1-NOTE-1
- LR1-NOTE-3 | ouvert | — | accord requis : non joué, même relecture que LR1-NOTE-1
- LR1-NOTE-4 | ouvert | — | accord requis : pas un défaut de lecture, sens du ⟳ bleu (affichage, voie f1) ; à trancher avec le brasseur
- LL-8 | ouvert | — | accord requis : relecture des pièces restantes non jouée (~0,7 CHF estimé), 8 pièces déjà relues en réel (durées 3 à 52 s)
- TL-NOTE-2 | ouvert | — | accord requis : même relecture que LL-8

(Le brief parlait de 18 ids ; la première reprise n'en listait que 16 : BUGS-VOIE.md liste ces 16 ; deux ids ne m'ont pas été donnés.)

Tests : `npx vitest run tests/unit/finance tests/unit/depense tests/unit/bugs-g1 tests/unit/cxMaterielPropose.test.ts tests/unit/purchase functions` → 3 122 passés, 0 échoué, 6 sautés (dont LR1-8 : 2) ; `npx tsc --noEmit` sans erreur (tests.txt).
Captures : NON PRISES (contexte épuisé) : script prêt `voies/g1/capturer.mjs`.

## DEMANDE EXECUTANT :
1. `node scripts/with_server.mjs --server "npx vite --port 3109 --strictPort" --port 3109 -- node work/missions/2026-11-19-bugs-ecrans/voies/g1/capturer.mjs`
2. Produit : `voies/g1/captures/{montant-deduit,port}-{390,1280}-{clair,cave}.png` (8 PNG). Sortie attendue : 8 lignes « erreurs 0 » ; pour `montant-deduit` : « Sédation true » et « à remplir false ». Si l'écran ne s'ouvre pas avec `?dev-local&depense=<état>` (QuickActionModal l. 126), dire l'URL qui marche, ne rien inventer.
3. Ouvrir chaque PNG : `montant-deduit` doit montrer « Sédation » à 0,00 en jaune (repris), sans « à remplir » rouge ni « + ? » ; `port` : la rangée Articles ne compte pas le port.
4. Puis : `node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs g1` (VERDICTS OK attendu) et `... g1 --tests` (TESTS OK).
5. Facultatif, dans le budget : LL-8, TL-NOTE-2, LR1-NOTE-1 à 3 : `G1_MODE=estimer` d'abord, puis `G1_DOCS=... G1_MODE=payant G1_BUDGET=6.8 npx vite-node --config vitest.config.ts work/missions/2026-11-19-bugs-ecrans/voies/g1/lancer.ts -- --confirm-paid-ai`, chaque appel journalisé dans journal-gemini.md.

## Fichiers écrits
Commits : 29177f4b3 (retrait de la déduction : LR3-1, LR1-8, LR2-9), 8c2394af7 (LR2-4), cacacd120 (LR2-6). Fichiers : `functions/src/invoiceScanCore.ts`, `src/services/{geminiScanner,purchaseEntry}.ts`, `src/ui/depense/{finale,rangees,confiance,apercuDev}.ts`, `src/ui/finance/controlesCroises.ts`, tests `bugs-g1-{LR3-1,LR1-8,LR2-4,LR2-6,LR2-6-ecran}`, `voies/g1/{RESULTAT.md,BUGS-VOIE.md,tests.txt,capturer.mjs}`.

DÉCISION À PRENDRE : LR1-8 / LR2-9 — instruire l'alignement des lignes (« état de l'art », L29) puis le coder ; recommandation : oui (Needleman-Wunsch sur la ressemblance des noms, la référence ne comptant qu'à titre de preuve). Sinon laisser ouvert : « somme ≠ total » le dit déjà au brasseur.
CONNAISSANCE : la quantité déduite n'était pas la cause entière du décalage de fusion de doc25 : les références (EAN) mal rattachées par les deux lectures décalent `alignLines` (tier 2).
LEÇON PROPOSÉE : une rustine qui touche un contrat écrit du brasseur (ici LT-3) se rejoue d'abord contre ses tests de contrat, avant le commit ; fc0d78b32 a été commité avec un test de contrat rouge.
