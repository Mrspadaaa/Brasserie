# Voie ia4-ia-ex-aequo — l'IA de Suggérer sans surapprentissage, et le banc à l'aveugle

Agent : auteur (Sonnet). Le callable, le client de Suggérer et un banc. La voie s'arrête au code, aux tests, au banc et à son rapport. Rien
n'est déployé ; l'IA reste éteinte dans l'app (`VITE_IA_SUGGERER`). **Économise les tours** : c'est la dernière voie avant le seuil du
quota. Écris RESULTAT.md tôt.

## Ses mots
Sur la capture réelle d'ia3 (Mandarina 1re avec « notes intenses de mandarine », Calypso 3e) :
« Ça semble overfit mes paramètres et de loins... » (D192, `voies/brasseur-ia3-overfit.jpg`). Ouvre-la.

Lis D126 dans `work/refonte-frontend/decisions.md` (les trois causes) et la ligne D192 de `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`,
puis `voies/ia3-ia-suggerer/RESULTAT.md`.

## Ce qui est demandé
1. **L'IA ne reclasse que les ex æquo du moteur.** Sa maquette m6 posait la puce sur le groupe au même effet. Le pool envoyé à l'IA est le
   groupe « même effet » du moteur : ses rangées et leurs suivantes au même effet et à la même dose, jamais un houblon pris plus bas.
   - La taille du pool vient d'une règle de coût et de latence, écrite et chiffrée ; jamais d'un exemple.
   - Retire de `functions/src/hopReclassCore.ts` et de `src/ui/hopIndex/suggerer/ia.ts` tout commentaire ou réglage qui cite ses six.
2. **La phrase s'appuie sur la fiche montrée.** Elle dit ce que portent les mots et les huiles du candidat. Si l'IA s'appuie sur la
   réputation du houblon et non sur sa fiche, la phrase commence par « Réputation : ». Ajoute un contrôle au serveur : une phrase qui nomme
   un arôme absent des mots de la fiche, sans « Réputation : », est retirée (l'ordre reste). L'invite devient `suggerer-v2` ; `v1` de
   Substituer ne bouge pas.
3. **Le banc à l'aveugle (accord D100 ; budget restant : 0,43 CHF).**
   - Cas : au moins 16 couples (style, demande, moment) qu'il n'a **jamais** nommés. Exclus : 22A, sa neipa v3, le stout S1, la 21C « Hazy du
     jeudi » et ses six houblons comme critère. Prends les styles de `pharesParStyle` (voir `scripts/eval-hop/a4-general.ts`), avec des
     recettes de fixture ; seulement les cas qui ont un groupe d'au moins 3 ex æquo.
   - Référence indépendante, écrite **avant** tout appel : pour chaque rangée montrée, ses sources hors Beer Maverick et hors Beer
     Analytics (`src/data/hopSources/` : BarthHaas, YCH, BSG, Hopsteiner… ; regarde `scripts/eval-hop/banc-justesse.ts`) citent-elles la
     famille demandée ?
   - Mesure : la part des rangées montrées (4) que la référence confirme, pour l'ordre du moteur et pour l'ordre de l'IA, cas par cas. Mesure
     aussi le nombre de phrases « Réputation : » et de phrases retirées.
   - Les appels réels passent par le banc d'ia3 (`scripts/eval-hop/ia3-emulateur.ts`, `--mode=reel --confirm-paid-ai`) ou par une variante
     `ia4-banc.ts`, par `guardLiveFetch`. Journal : section « ia4 » de `work/finalisation-tickets-2026-10-08/gemini-journal.md`.
     Arrête-toi à 0,4 CHF ou à la première erreur répétée.
   - **Règle de décision écrite avant le banc** : l'IA mérite d'être allumée si, sur l'ensemble des cas, la part confirmée par la référence
     monte d'au moins 10 points sans baisser de plus de 25 points dans aucun cas ; sinon elle reste éteinte. Tu rapportes, le pilote décide.
4. Ses six et sa neipa v3 : **un seul passage, à la fin**, en rapport, jamais en réglage.

## Critères
- `npx vitest run tests/unit/hopIndexV4 --maxWorkers=2` : vert. Le test d'identité de l'invite `v1` (Substituer) est vert, et de nouveaux
  tests couvrent :
  - le pool limité aux ex æquo (un houblon pris plus bas n'y entre jamais) ;
  - le retrait d'une phrase qui sort de la fiche ;
  - « Réputation : ».
- `npx tsc --noEmit` et `npx tsc --noEmit -p functions` : sans sortie.
- `grep` : aucune mention de ses six (El Dorado, Mosaic, Mandarina, Calypso, Pacific Jade, Idaho 7) dans `functions/src/hopReclassCore.ts`,
  `functions/src/hopReclasserIA.ts`, `src/ui/hopIndex/suggerer/ia.ts`.
- Le banc : `IA4-BANC-OK` (imprimé seulement si tous les cas ont été joués et le journal écrit), un tableau cas par cas, la règle de décision
  appliquée, le total en CHF (0,4 au plus).

## Possède
- `functions/src/hopReclassCore.ts`, `functions/src/hopReclasserIA.ts`.
- `src/ui/hopIndex/suggerer/ia.ts`, `src/ui/hopIndex/suggerer/index.tsx` (le pool seulement), `src/ui/hopIndex/parcours/adaptateur.ts`
  (`poolSuggerer` seulement).
- `tests/unit/hopIndexV4/hopReclasserIA.test.ts`, `suggererIA.test.tsx`.
- `scripts/eval-hop/ia4-*` (neufs), `scripts/eval-hop/ia3-emulateur.ts`.
- La section « ia4 » de `gemini-journal.md`.
- `work/missions/2026-10-25-integration-houblons/voies/ia4-ia-ex-aequo/`.

Rien dans `src/domain/`. Ne lis jamais `functions/.env`. Ne touche ni à `.codex/`, ni à `source4-portable-bundle-manifest-01.json`. Pas de
déploiement. N'écris aucun code par heredoc ni par `node -e`. Pas de `git stash`, aucun commit. Rends une ligne.
