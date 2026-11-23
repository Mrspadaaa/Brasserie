REPRISE : work/missions/2026-11-21-chasse-calendrier/RESULTAT-V8.md — V8 : code et contrôles ÉCRITS, rien joué au banc, rien commité, BUGS.md non touché (agent arrêté à ~160 k).

## Code écrit dans port-carnet (tsc non relancé après la dernière retouche ; vitest vert, voir plus bas)
Script appliqué (ne pas relancer) : scratchpad `v8/appliquer.mjs`.
- `src/ui/calendrier/entete/Fenetre.tsx` : CHG-7 `etiquetteCadre` dit « S40 » pour une semaine ; `boiteTirage(texte, bord, largeur, cote)` pose la bulle à 14 px à droite du début tiré, à gauche de la fin tirée, centrée pour le corps ; `drag` porte `cote` (= `s.role`).
- `src/ui/calendrier/entete/EnTete.tsx` : CHV-4/CHD-7 `etiquetteAnnee` lit la fenêtre (`index` … `index + nombre − 1`), pas tout `semainesTot` ; deux années : « oct. 2026 – oct. 2027 ».
- `src/ui/calendrier/frise/Rangee.tsx` (l. ~597) : CHD-7, période des pastilles en mois sur deux années : « oct. 2026–oct. 2027 ». RISQUE : largeur à 390 (CHV-12) ; CH-V4 vérifie « rognée ».
- `src/components/periode/periode.ts` : CHN-1, `pas` borne aussi mois/trimestre/année (1.1.2000 à aujourd'hui + 366 j, mêmes bornes que les plages ; forme inchangée) via `pasLibre` ; nouveau `peutPasser(p, sens)`.
- `src/components/periode/PastillePeriode.tsx` : flèches `disabled={!ok || !peutPasser(p, ±1)}` (import ajouté).
- Tests : `tests/integration/calendrierEntete.test.tsx` l. 621-622 et 1787/1798 (« nov. 2026 – nov. 2027 ») ; nouveau `tests/unit/calendrierPeriodeV8.test.ts`.
- Contrôles : nouveau `scripts/parcours/chaines-calendrier-v8.mjs` (étapes CH-V4 (+D7), CH-N1, CH-G3, CH-G7) ; `scripts/parcours/chaines.mjs` : 2 lignes (import l. 24, `...etapesV8({ echec, ok, sleep })` l. 159). chaines.mjs porte AUSSI 4 lignes d'une autre voie : committer HEAD + mes 2 lignes seulement.

## Preuves
- vitest : calendrierEntete + calendrierPeriodeV8 : 114/114. Plus tôt : calendrierFrise 2 échecs (CRITIQUE-12 n° 2 « confirmé »→« prévu », Papiers en An) = V7 (607844278), pas V8 (déjà signalé dans REPRISE-PRIX-3).
- Banc : RIEN joué. Ni rouge tour8 ni vert arbre prouvé.

## Prochaine action
1. `npx tsc --noEmit -p .` (port-carnet).
2. Rouge tour8 : `node scripts/parcours/chaines.mjs <scratchpad>/v8/t8 --build <scratchpad>/build-tour8 --etape CH-V4,CH-N1,CH-G3,CH-G7` ; attendus KO : V4 (« janv. – nov. 2027 », « oct.–oct. »), N1, G3 (S49 – S50), G7 (« S40 – S40 » ou coin). Si une étape ne trouve pas son élément (sélecteurs `[data-periode-pastille] .pr-court`, `.ent-cadre`, `[data-poignee]`, `[data-cadre-tirage]`), corriger l'étape, pas le code.
3. Vert arbre : build de l'arbre (chaines.mjs sans `--build` construit) puis même commande ; ouvrir les captures CH-V4-1, CH-G7-2, CH-N1-*-bout (L12), clair et cave.
4. CH-G3 : probablement déjà corrigé par d5fae0f37 (lâcher sans bouger : rien) ; colonne commit = d5fae0f37 si vert sans mon code.
5. CH-N1 : si l'arbre reste rouge, cause probable : le Calendrier borne la fenêtre à son horizon (`fenetreDePeriode` clampe `semaines`) avant que la barre bute (aujourd'hui + 366 j). Faire dire la borne au Calendrier ou borner `pas` à l'horizon.
6. Commit par chemins, index temporaire (`../cal-24/commit.mjs`), puis BUGS.md (Brasserie) : CHG-3, CHG-7, CHV-4, CHD-7, CHN-1 « corrigé » + commit ; `node scripts/agents/controle-bugs.mjs` → OK.

## Non commencé
- CHV-18 (Rangee.tsx, `poser`) : voir RESULTAT-V7 « Reste à faire » n° 3 (le contrôle CH-V18 de chaines-v2.mjs doit d'abord retrancher la réserve du + volant).
- CFP-1 à CFP-7 (BUGS.md l. 2187-2193, tous « ouvert ») : CFP-1 et CFP-4 sont couverts par « reculer/avancer le début », « glisser le corps » de geste.mjs (aad2e248e) : KO sur tour8 (`scratchpad/prix/g-tour8.log`), OK sur l'arbre isolé (`prix/g-iso.log`, « PARCOURS GESTE OK ») ; code d5fae0f37. À rejouer sur l'arbre puis marquer. CFP-2, 3, 6, 7 : aucun contrôle encore. CFP-5 (recalage à 56 px) contredit R4 voulu par le brasseur (« l'échelle doit changer pour toujours voir les 2 bouts ») : à trancher par le pilote (caduc ?).

DÉCISION À PRENDRE : CFP-5 caduc par R4 ?
LEÇON PROPOSÉE : une voie de 13 ids (5 + CHV-18 + 7 CFP) ne tient pas dans 120 k ; la découper avant de briefer.

## Reprise 2 (Sonnet, ~100 k) — banc joué, rien commité, BUGS.md non touché
- tsc propre. Rouge tour8 prouvé : V4, N1, G3, G7 KO (`scratchpad/v8/t8.log`). Arbre : G3 et G7 OK, N1 OK (après correctif ci-dessous), V4 encore KO.
- Correctifs ajoutés : `periode.ts` `finHorizon()` (fin de la 52e semaine depuis la semaine courante, borne `pas`/`glisser` au lieu de aujourd'hui+366 j : le Calendrier clampait à son horizon, d'où barre S41–S47 / cadre S41–S45) ; `Rangee.tsx` pastille deux années en 2 chiffres (« oct. 26–oct. 27 ») ; `frise.css` `.cal-conf` sur 2 lignes en portrait (pas de coupe à 390, le saut de ligne tombe parfois « oct. 26–oct. / 27 » : à polir) ; `chaines-calendrier-v8.mjs` regex années à 2 chiffres, ‹ rejoué seulement si › a avancé.
- RESTE KO CH-V4 (arbre) : après › puis ‹, la barre est à 2025-11-17→2026-11-15 et le cadre dit « janv. – déc. 2026 » (attendu nov. 2025 – nov. 2026) : le passé du Calendrier est borné par les données, la barre le dépasse (même défaut côté passé que CHN-1). Piste : borner `pas` du côté passé à l'horizon passé du Calendrier, ou faire dire la borne ; et vérifier pourquoi ‹ part de 2026-10-26 vers 2025-11 (› a-t-il bougé ?).
- vitest : 3 échecs connus (calendrierEntete n° 11 paysage 28,8 < 30 ; calendrierFrise ×2 = V7 607844278 « confirmé »→« prévu », Papiers en An -523629) — non adaptés, non corrigés ; à vérifier si le 28,8 vient de mon CSS `.cal-conf` (probable non : mesure de courbe).
- À FAIRE : CHV-18 (Rangee `poser`), CFP-1 à CFP-7 ; commit par chemins (index temporaire), BUGS.md + controle-bugs.
