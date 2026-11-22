# Voie c-decoupe — la découpe d'une longue pièce dans l'app (D380, D381)

Agent : auteur (Sonnet), maxTurns 60. Pilote : Opus. Lis d'abord `../../PLAN.md` (§ architecture, déclencheurs) et
`functions/src/invoiceMorceaux.ts`, `functions/src/invoiceAssemblage.ts` (serveur, écrit par le pilote, déjà testé).

## Ses mots (exigence transversale)
« Ça reste un processus de facturation, c'est ultra critique. On peut pas se permettre de perdre ou "gagner" de l'information. »
« Si la facture est pas blanche ? Si la tâche fait toute la facture ? Si la photo est un peu floue ? »
« Pas besoin de toujours découper » : une pièce ordinaire garde EXACTEMENT la lecture d'aujourd'hui (même appel, même temps).

## OWNS (n'écris rien d'autre)
- `src/services/decoupe.ts` (neuf), `src/services/lectureMorceaux.ts` (neuf)
- `src/services/geminiScanner.ts` : seulement le branchement dans `scanDocument` et la phrase « (4 pages) » (ligne ~118 : retirer « (4 pages) »)
- `tests/unit/depense/d381/client-*.test.ts` (neufs)
Lecture seule : `functions/src/*` (le pilote les possède), `src/services/qrLecture.ts` (réutilise son chargement de pdf.js, ne le copie pas).

## Contrat serveur (déployé par le pilote)
- `AiClient.run({ task:'scanInvoice', tier:'fast', file:{data,mimeType:'image/jpeg'}, morceau:{k,n} })` → `data` = lecture normalisée,
  chaque article porte `zone` ('avant' | 'dedans' | 'apres').
- `AiClient.run({ task:'assemblerLecture', tier:'fast', context:{ parties:[{ ...data_k, morceau:{k,n}, coupeForcee:boolean }] } })` → `data` = la
  lecture finale, même format que `scanInvoice` (+ `morceaux: n`). `morceau` et `assemblerLecture` : ajoute-les au type `AiRequest` si besoin
  (`src/services/aiClient.ts` : tu peux y ajouter ces deux champs de type, rien d'autre).

## À faire
1. `decoupe.ts`, partie PURE (sur `Bitmap` = gris Uint8Array, testable sous Node, sans canvas) :
   - `encreLocale(bitmap)` → part d'encre par rangée, par CONTRASTE LOCAL : fond local = maximum glissant (filtre séparable, fenêtre ≈ 2 pas de
     ligne) puis encre = fond − pixel au-delà d'un seuil adaptatif (Otsu sur le contraste, plancher 25). Un papier gris, une ombre, une tache lisse,
     des rangées grisées une sur deux ne sont PAS de l'encre ; un texte sur la tache l'est.
   - `analyser(bitmap)` → `{ crop:{x,y,w,h}, angle, morceaux }` : papier détecté sur un fond sombre (photo sur une table : plus grande région
     claire, sa boîte + marge) ; redressement : angle dans [−5°, 5°] par pas de 0,25° qui maximise la variance du profil d'encre des rangées (image
     réduite) ; puis `planMorceaux(encreLocale(normalisé), w, { maxLines: BAND_MAX_LINES })` importé de `functions/src/invoiceMorceaux.ts`.
   - `normaliser(canal: Uint8Array, w, h, analyse, { plusProche?: boolean })` → recadré + tourné (rotation autour du centre du recadrage,
     convention écrite en commentaire). Le pilote l'appliquera aux MASQUES des pièges (plus proche voisin, canal par canal).
2. `decoupe.ts`, partie navigateur : `decouperPiece(file, { force?: boolean }) → Promise<Partie[] | null>`.
   - Déclencheurs AVANT (sans force) : image dont h/w > 3 après recadrage du papier ; PDF de plus de 4 pages OU de plus de 90 rangées de texte au
     total (`getTextContent`, y distincts). Sinon `null` (lecture d'aujourd'hui).
   - `force` (déclencheur APRÈS) : découpe si `planMorceaux` rend au moins 2 morceaux, sinon `null`.
   - PDF : pages rendues à l'échelle 2, `analyser` par page (sans redressement), morceaux numérotés à la suite sur toutes les pages, aucun voisin
     d'une page à l'autre.
   - Chaque morceau : la vue [viewTop, viewBottom) du canvas normalisé (même transformation que `normaliser`), rangées hors de [top, bottom)
     teintées (`rgba(255,190,0,0.18)`), trait rouge de 2 px en haut si viewTop < top, en bas si viewBottom > bottom, posé dans le blanc ; largeur
     ≤ 1 600 px ; JPEG 0,85. `Partie = { file:{data,mimeType}, morceau:{k,n}, coupeForcee }`.
3. `lectureMorceaux.ts` : `lireEnMorceaux(parties, run = AiClient.run)` : 5 à la fois ; chaque morceau réessayé UNE fois ; un morceau encore en
   échec → `throw new Error('Lecture en morceaux incomplète : la partie k sur n n'a pas été lue. Réessaie.')` et AUCUN assemblage (jamais une
   lecture partielle) ; puis l'appel `assemblerLecture` avec les parties dans l'ordre.
4. `scanDocument` : déclencheur avant → `lireEnMorceaux` ; sinon la lecture d'aujourd'hui, puis déclencheur après : point `lecture-coupee` dans
   `data.points`, ou `data.printedLineCount > data.items.length + 2` → `decouperPiece(file, { force:true })` → `lireEnMorceaux`. Le résultat passe par
   la même conversion en ScanOutcome qu'aujourd'hui.
5. Tests (vitest, sans canvas) : `encreLocale` sur bitmaps fabriqués — papier gris (fond 180), dégradé + tache sur toute la page, rangées grisées
   une sur deux, flou (boîte rayon 2) : les blancs entre lignes restent trouvés, aucune coupe de `planMorceaux` dans une ligne ; TÉMOIN : `inkRows`
   (fond global, `invoiceMorceaux`) échoue sur la tache ou le dégradé. Redressement : lignes penchées de ±2° → angle à 0,5° près. Orchestration
   (run simulé) : 12 parties → 12 lectures avec `morceau`, jamais plus de 5 en même temps, un échec réessayé, un double échec lève sans assembler,
   l'assemblage reçoit les parties dans l'ordre avec `morceau` et `coupeForcee`. Pièce ordinaire : un seul appel, identique à aujourd'hui.

## Critères (le pilote les rejoue)
- `npx vitest run tests/unit/depense/d381` → tout vert
- `npx tsc --noEmit -p tsconfig.app.json` → aucune erreur nouvelle (compare avec `git stash`-free : lance-le aussi sur tes seuls fichiers si besoin)
- `npm run build` → vert
- `git status --short` → seulement les fichiers OWNS (plus ce qui était déjà modifié avant toi)
Interdits : déployer, appel IA réel, données réelles, `functions/`, `.codex/`, fichiers `.env`. Retour : une ligne, puis `LEÇON PROPOSÉE : …` s'il y a lieu.
