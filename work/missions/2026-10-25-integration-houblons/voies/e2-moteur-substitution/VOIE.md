# Voie e2-moteur-substitution — revoir le moteur de Substituer (#181, D80)

Agent : auteur (Sonnet), pour du code avec des choix mesurés. La direction est fixée ci-dessous par le pilote. Tu mesures, puis tu
implémentes si la mesure le justifie. L'écran Substituer, son choix u4, ne change pas : seul le classement change.

## Ses mots (26.10)
- « D c + IA semble quand même plus probant, non ? À quelle point sont les écart avec ou sans ? »
- « non D, C + IA mais je pense que le moteur doit être revue » (D80 : il choisit D, et veut d'abord une revue du moteur).
- « nelson sauvin est un houbon ordinaire alors que c'est un un houbon incroyable » ; « motueka est ultra fruité » (lot 21).

## À lire d'abord
- `cerveau/metier/substitution-moteur.md` : le moteur actuel, le banc e1, l'essai d'IA, et la **méthode de Beer Maverick**
  (corrélation de Pearson sur 70 nombres, deux jeux de poids).
- `src/domain/hopIndex/v4/substitution.ts` : poids par contexte (amertume, arôme), `aromaSim`, `bitterSim`, huiles, couverture,
  classement.
- `voies/e1-banc-eval/` (le banc, `suite-mots.ts`, `listes-lambda.json`) et `voies/ia1-reclassement/resultats/cote-a-cote.json`.
- Les données : `src/data/hopV4/proto-data.json` (catalogue, `bm`, `cohumulone`, `oils.farnesene`) et `src/data/hopV4/complements.json`
  avec son chargeur (`src/domain/hopIndex/v4/complements.ts`).

## La direction (pilote)
Garder ce que Beer Maverick fait de juste :
- utiliser toutes les données ;
- avoir des poids par usage.

Sans ses défauts :
- pas de Pearson sur des unités mêlées ;
- pas de codes arbitraires lus comme des nombres ;
- pas de zéro pour un inconnu.

1. **Une ressemblance par variable**, chacune entre 0 et 1, puis une moyenne pondérée des variables connues des deux houblons
   (poids renormalisés, comme aujourd'hui). Un inconnu n'est jamais 0 : il sort du calcul, et la couverture le dit.
2. **Les variables** :
   - amertume : α (plus haut est permis à l'amertume, comme aujourd'hui), β, cohumulone (% des α), usage ;
   - huile : huile totale (mL/100 g) ; composition : myrcène, humulène, caryophyllène, farnésène, linalol, géraniol. Les valeurs
     viennent du catalogue et de `complements.json` (enveloppes valides) ;
   - arôme : les 12 familles (actuel), les mots fins (le réglage C de e1 : λ et garde de 2 mots), et le radar Beer Maverick
     (`bm.arome`) quand les deux houblons l'ont, à faible poids (c'est la donnée de la référence : risque de fuite).
3. **Trois moments, trois jeux de poids**, au lieu de deux :
   - amertume (premier moût, 60′, 30′, 15′) ;
   - arôme chaud (10′, whirlpool) ;
   - à froid (dry hop). L'huile totale, le linalol, le géraniol et les mots y pèsent plus.

   Aujourd'hui, 10′, whirlpool et dry hop rendent le même classement.
4. **Choisir les poids sur une moitié, les juger sur l'autre** (parité de l'id, comme e1 ; L20).
   - Deux références :
     - (a) les substituts Beer Maverick ;
     - (b) **son jugement** : les premiers de la liste D qu'il a trouvée « plus probante ». Pour les 8 phares, les 3 premiers de D,
       par exemple Centennial pour Cascade, Mosaic pour Simcoe, Galaxy pour Citra, Saaz Late et Saaz (US) pour Saaz, Hallertau Blanc
       pour Nelson Sauvin.
   - La référence (a) ressemble à la formule de Beer Maverick (fuite) : la (b) départage.
   - Une variante qui gagne sur (a) mais perd sur (b) ne passe pas.

## À faire
1. **Phase 1, hors ligne** : `scripts/eval-hop/moteur-v2.ts`.
   - Calcule la formule ci-dessus et règle ses poids sur la moitié d'apprentissage.
   - Rapporte MRR, rappel@10 et rang médian, avec l'intervalle à 95 %, sur la moitié de contrôle, pour A (actuel), C et v2.
   - Rapporte, pour les deux références, les 3 moments et les 8 phares : les 10 premiers de v2, et le rang des houblons de (b).
   - Ajoute un tableau : ce que chaque variable ajoute (v2 sans elle).
2. **Phase 2, seulement si v2 bat C sur la moitié de contrôle pour (a) ET tient (b)** :
   - implémente v2 dans `src/domain/hopIndex/v4/substitution.ts`, à l'identique de la phase 1 (un test compare les deux sur
     30 houblons) ;
   - `moteurInchange.test.ts` change d'empreinte pour Substituer, et seulement pour lui : mets-le à jour avec la preuve ; les
     autres empreintes (profil, Suggérer…) restent ;
   - l'écran Substituer de l'app ne change pas. Ses textes doivent rester vrais : « sans inconnue » seulement si aucune variable ne
     manque ;
   - temps : `substitutes()` sur tout le catalogue dans les budgets de `npm run check:hop-perf`. Sinon, propose un compromis mesuré.
3. Si la phase 2 ne passe pas : dis pourquoi, ce que v2 apporte, et ce qu'il faudrait (données, poids). Rien dans `src/domain`.

## Critères
- `npx vite-node scripts/eval-hop/moteur-v2.ts` : déterministe (deux passes, même sha256), rapport `voies/e2-moteur-substitution/rapport.md`.
- Si phase 2 : `npx vitest run tests/unit/hopIndexV4` vert ; prototype `npx vitest run --root prototypes/houblons-v4` vert, ou
  écarts justifiés ; `npm run build` vert ; `npm run check:hop-perf` ; `node scripts/audit_inputs.mjs`.
- Captures dans l'app, en 390 × 844, de Substituer au dry hop pour Nelson Sauvin et pour Cascade, avant et après, ouvertes et
  regardées. L'écran est le même, seuls l'ordre et les scores changent.

## Possède
- `scripts/eval-hop/moteur-v2.ts` (et ses fichiers à côté).
- `src/domain/hopIndex/v4/substitution.ts` (phase 2 seulement).
- `tests/unit/hopIndexV4/`.
- `prototypes/houblons-v4/tests/` (empreintes de Substituer, avec preuve).
- `work/missions/2026-10-25-integration-houblons/voies/e2-moteur-substitution/`.

Rien dans `src/ui/`. N'écris aucun code par heredoc ni par `node -e` : Write ou Edit seulement. Pas de `git mv`, pas de `git stash`.
Fichiers de travail dans `os.tmpdir()`.

Écris RESULTAT.md tôt et complète-le. Retour en une ligne.
