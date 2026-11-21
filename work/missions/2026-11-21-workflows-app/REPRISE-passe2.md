# REPRISE — passe 2 des workflows (21.11)

Agent arrêté par le hook à 204 k. **Rien n'est commité.** Aucun code de l'app touché ; jamais seedData.ts ; aucun Gemini.

## Fait (fichiers écrits, dans `work/missions/2026-11-21-workflows-app/`)
- `ANALYSE-passe2.md` : 13 chaînes jouées (table gestes, temps, INP ×4), son classement Moins de gestes mesuré et fusionné (§ 2),
  propositions N1 à N7 au filtre GAIN (§ 3), repêchages, quatre regards, non joué.
- `BUGS-passe2.md` : WF2-1 à WF2-9 (WF2-1 bloquant : compagnon « Écran indisponible » au 1er « Terminer et continuer » ; WF2-5 hors ligne ; WF2-8 coût non chiffré).
- `passe2/` : `fixture-base.mjs` (copie de la fixture chaînes de port-carnet HEAD aaecde10f), `fixture-passe2.mjs` (ZZ TEST), `pas2.mjs`
  (rejeu au doigt, CPU ×4, INP par geste), `pas/*.txt` (pas joués), `captures/r*-*/` (dont `r6-j/01-compagnon.png`, ouverte).
- Build de test : `%TEMP%/wf2-dist` (depuis `git archive HEAD` de port-carnet dans `%TEMP%/wf2-src`, node_modules en jonction).

## Reste à faire, dans l'ordre
1. **Ajouter à `SYNTHESE.md`** la section ci-dessous (l'ajout a été coupé par le hook), telle quelle, à la fin du fichier.
2. Commit par chemins : `git add -f work/missions/2026-11-21-workflows-app/ANALYSE-passe2.md work/missions/2026-11-21-workflows-app/BUGS-passe2.md work/missions/2026-11-21-workflows-app/REPRISE-passe2.md work/missions/2026-11-21-workflows-app/SYNTHESE.md work/missions/2026-11-21-workflows-app/passe2`
   puis `git commit -m "Workflows passe 2 : 13 chaînes jouées, Moins de gestes mesuré et fusionné (N1 à N7), bugs WF2-1 à 9" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"` (vérifier `git status --short` : rien d'autre).
3. Chaînes non jouées (agent neuf, même banc : `node work/missions/2026-11-21-workflows-app/passe2/pas2.mjs <pas> <nom>`, **un Chrome à la fois** pour des temps justes) :
   jour de brassage après le 1er pas (lire l'erreur console complète de WF2-1 : `pas/jour.txt`, la 4e erreur est coupée par `slice(0, 3)`) ;
   eau et sels dans l'assistant (v06) ; étapes houblons et levure de l'assistant sur la fixture (v03, v05 : confirmer les comptes du 20.11) ;
   clôture étapes 2 à 9 ; « copier » du menu Plus de l'assistant (nouvelle recette depuis une ancienne) ; hors ligne en lecture seule sur l'app déployée (WF2-5).
4. Boucle « jusqu'à épuisement » : deux tours sans apport non encore faits. Chaînes réelles jamais jouées repérées : impôt sur la bière (onglet Clients › Impôt bière, déclaration OFDF) ; nettoyage et soude avant brassin (soude sous seuil au Bord) ; dry hop au jour J+3 (WF2-2).
5. Axes de goût ouverts, **à dessiner** (L24, pas de page faite) : N5 (curseur de densité partant de la prévision ou de la dernière valeur, marqué « prévu ») ; N7 (✓ « comme en stock » par ligne ou « tout le rayon comme en stock »). Page `choix-workflows-2.html` en fil de fer seulement si le pilote les retient, vérifiée par `verifier-page.mjs --page-lot`.

## Section à ajouter à SYNTHESE.md

## 7. Passe 2 (21.11) : « Mais ça semble un peu maigre ?? »

Sources : `ANALYSE-passe2.md`, `BUGS-passe2.md` (WF2-1 à 9). Choix reçus : **A2** (appui long 6 · 12 · 24), **B1** (reste sur la carte du
brassin), **C1** (horizons au glisser), **D2** (prix = dernier achat semblable). Treize chaînes jouées en plus ; filtre élargi aux chaînes
rares (gain sur la durée ou le risque) ; son classement Moins de gestes mesuré et fusionné.

**Bugs qui cassent une chaîne, ajoutés** : B12 = WF2-1 (compagnon tombé au 1er pas : jour de brassage coupé) ; B13 = WF2-8 (coût du brassin
non chiffré alors que le stock a ses prix : marge impossible) ; B14 = WF2-5 (hors ligne : écran non chargé, aucun précache ; à confirmer
en production). Lenteurs WF2-3, WF2-4 : à profiler seules.

| Rang | Candidate | Origine | Avant → après | Fréquence | Décision |
|---|---|---|---|---|---|
| 1 | K3 + N6 : le brassin pose ses suites, son coût chiffré au prix du stock et sa marge lisible | K3, N6, K8 (prix) | « ? CHF/L » en 4 gestes (joué) → coût estimé posé seul | chaque brassin ; caisse hebdo | seule (D2 donne le prix) |
| 2 | K5 quantité à l'appui long | passe 1 | 10 → 5 gestes | hebdo | A2 choisi |
| 3 | K4 une seule caisse | passe 1 | 3 chiffres → 1 | hebdo | seule |
| 4 | K6 reste à vendre | passe 1 | impossible → 1 regard | chaque vente | B1 choisi |
| 5 | N1 : l'ingrédient proposé se pose juste d'un toucher (houblon, malt, levure, sels ; α du lot) | v03 (son rang 1), v02, v04, v05, v06, K8 | ≈ 34 → ≈ 14 par recette (estimé) | chaque recette | seule ; K8 y entre |
| 6 | N5 : le relevé de densité part de la prévision du jour | neuve | 12 → ≈ 4 (avant joué) | hebdo en fermentation | seule ; forme à dessiner |
| 7 | K1 horizons et prix estimé | passe 1 | 3 à 7 → 1 | plusieurs fois par mois | C1, D2 choisis |
| 8 | K2 + v14 : la chose datée arrive au Calendrier ; le brassin posé propose sa suite | K2, v14 | impossible → 0 ; ≈ 4 + 1 par étape → 1 | mensuel | seule ; sa vue gardée |
| 9 | K7 + v10 : mettre en fûts propose les fûts qui tiennent le volume, lavage compris | K7, v10 | 6 pour 2 fûts (joué) → 3 | chaque brassin | seule |
| 10 | N4 : les fûts reviennent depuis le client | v11, P5 vendre (repêchée) | 3 par fût → 3 pour tous | mensuel | seule |
| 11 | N3 : rebrasser relie au stock, dose à l'α du lot | v07 | 12 → 2 (compté 20.11) | mensuel | seule |
| 12 | N2 : le jour J pose ce qu'il sait | v09 | 4 + ≈ 3 par densité → 3 | chaque brassin | après B12 |
| 13 | N7 : l'inventaire confirme d'un toucher ce qui est juste | neuve, chaîne rare | ≈ 38 → ≈ 20 (compté) | annuel | seule ; forme à dessiner |

Restent écartées : v01, v04 (hors la quantité), v08, v12, v13, et les 19 gimmicks sauf P5 vendre (repêchée en N4). Non joué : `REPRISE-passe2.md`.
