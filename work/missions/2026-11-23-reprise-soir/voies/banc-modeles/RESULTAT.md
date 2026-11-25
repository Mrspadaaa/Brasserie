OK — BANC lite 5/8, flash38 7/8, hydrogen 6/8 (tenues) ; recommandé gemini-3.8-flash, inchangé

## Ligne rendue
BANC lite 5/8, flash38 7/8, hydrogen 6/8 (tenues, contexte sans ; avec un carnet du même sujet : 4/8, 5/8, 5/8) ; coût total 0,4561 CHF ; recommandé flash38 (gemini-3.8-flash, le modèle de production actuel) <hash>

## Fichiers écrits
- `scripts/banc-rangement.ts` : options `--modele lite|flash38|hydrogen`, `--contexte sans|avec`, `--jeu tenue|reglage` et `--tableau` (sans appel). Les noms des modèles viennent de `functions/src/models.ts` (`GEMINI_LITE_MODEL` = gemini-3.5-flash-lite, `GEMINI_MODEL` = gemini-3.8-flash, `INVOICE_STRONG_MODEL` = gemini-4-hydrogen), les mêmes que `lienIA` et `aiTask`. Les trois modèles reçoivent la même consigne et le même schéma (`RANGER_CARNET`), la même température 0 et la même réflexion basse. `MEME_SUJET` ajoute un carnet ZZ fictif du même sujet pour chacune des 16 phrases ; r4 et t8 reprennent ceux de c70-ia. Sans `--modele`, le comportement de c70-ia ne change pas (modèle `geminiAttempts`, dossier c70-ia).
- `functions/src/carnetIA.ts` : **non touché**. Le banc choisit le modèle lui-même, donc la production n'a reçu aucun paramètre.
- `tests/fixtures/banc-modeles/flash38-sans/t1..t8.json` et `flash38-avec/t1..t8.json` : les réponses réelles du modèle recommandé, toutes sur des phrases et des carnets fictifs « ZZ ».
- Dans ce dossier : `passe-<modèle>-<contexte>.json` (6 passes, réponses brutes, coût, temps, jetons), leurs `.log`, `estimation.log`, `tableau.txt` (tableau et détail par phrase), `tests.log`.

## Déroulé et coût
- Estimation faite sur les 2 premiers appels de chaque modèle (t1 et t2, contexte sans ; `estimation.log`). Coût par appel : lite 0,0020 CHF, 3.8 0,0094 CHF, Hydrogen 0,0167 CHF. Le plan complet (16 phrases × 2 contextes × 3 modèles) aurait coûté environ 0,90 CHF, au-dessus du plafond de 0,50. J'ai donc **réduit aux 8 tenues à part**, comme le prévoit DOSSIER : 48 appels, aucune phrase de réglage.
- Journal `work/missions/2026-11-23-carnet-en-ligne/ia-journal.jsonl`, voie `banc-modeles` : 48 lignes, **0,4561 CHF**. Détail : lite 16 appels pour 0,0313 ; 3.8 16 appels pour 0,1573 ; Hydrogen 16 appels pour 0,2675. Aucun appel en échec, aucun arrêt au budget, aucune passe relancée.
- Aucune donnée réelle n'a été envoyée : les phrases sont inventées et les carnets sont « ZZ ».

## Tableau (tenues à part, `tableau.txt`)
| modèle | contexte | tenues justes (écran) | sujet du modèle juste | fautes (genre / chemin / titre / carnet / tâche) | CHF par appel | ms par appel (médiane) |
|---|---|---|---|---|---|---|
| lite (gemini-3.5-flash-lite) | sans | 5/8 | 5/8 | 0 / 2 / 0 / 0 / 2 | 0,0020 | 1 155 |
| lite | avec | 4/8 | 5/8 | 2 / 3 / 3 / 0 / 1 | 0,0019 | 1 021 |
| flash38 (gemini-3.8-flash) | sans | **7/8** | 7/8 | 0 / 1 / 0 / 0 / 1 | 0,0101 | 8 217 |
| flash38 | avec | **5/8** | 6/8 | 1 / 2 / 0 / 0 / 2 | 0,0096 | 5 283 |
| hydrogen (gemini-4-hydrogen) | sans | 6/8 | 6/8 | 0 / 0 / 0 / 0 / 2 | 0,0169 | 5 243 |
| hydrogen | avec | 5/8 | 6/8 | 1 / 2 / 1 / 0 / 2 | 0,0166 | 4 940 |

Sur les 16 cas (sans et avec) : lite 9, 3.8 **12**, Hydrogen 11.
- La colonne « écran » juge ce que l'écran tire de la réponse, avec le juge de c70-ia inchangé, et ses attendus ont été écrits avant les passes. La colonne « sujet » juge le `sujet` rendu par le modèle seul : elle sépare la faute du modèle de celle de la lecture côté client.

## Recommandation
Règle : on garde le moins cher qui range aussi juste (à ±1 phrase près) que le meilleur sur les tenues.
- Le meilleur est la 3.8 : 7/8 sans carnet du même sujet, 5/8 avec.
- Lite fait 5/8 sans, soit 2 de moins : elle n'est pas dans les ±1. Sur 16 cas, elle fait 9 contre 12. Elle omet aussi le `sujet` requis : à t1 avec, la réponse n'a aucun sujet, et elle donne 3 titres vides dans le contexte avec. Ses fautes sont muettes (un chemin faux, comme « papiers › Assurances » pour une amende de douane). Une cascade lite puis 3.8 ne saurait donc pas quand reprendre.
- Hydrogen est dans les ±1 (6/8 et 5/8), mais coûte 1,7 fois la 3.8.
- **Recommandé : flash38, gemini-3.8-flash, le modèle de production actuel.** Rien n'est à changer, et je n'ai rien changé.

## Critères
- `npx vitest run tests/unit/c70RangementIA.test.ts --reporter=dot` : 11 passed (`tests.log`). Je n'ai pas touché `tests/unit/noteRegles.test.tsx`.
- Rejeu sans appel : `npx tsx scripts/banc-rangement.ts --tableau` redonne le tableau ci-dessus.

## Doutes et limites
- L'échantillon est petit : 8 phrases, une passe par modèle, à température 0. Un écart d'une phrase reste dans le bruit. Seul l'écart de la lite (−2 sans, −3 sur 16) dépasse ce bruit.
- Les phrases de réglage n'ont pas été mesurées, faute de budget, comme prévu par DOSSIER. Le score se lit sur les tenues à part.
- Fautes communes aux trois modèles, qui viennent de la consigne ou de la lecture et non du choix du modèle :
  1. **t6 avec** (« la douane réclame une amende… », à côté du carnet mémo « ZZ Déclarations à la douane ») : la 3.8 et Hydrogen rendent un `sujet` juste (problème, papiers › Douane). Elles versent pourtant la ligne par `carnetId` dans le carnet mémo, et `lireReponse` ne complète pas cette ligne avec le sujet (R67 : un mémo va dans son carnet). L'écran voit donc genre ∅ et chemin ∅. Si le brasseur choisit « Garder à part », le carnet neuf n'a ni genre ni chemin. C'est le reste de C70-3 du côté du client (`src/domain/carnets/ia.ts` et `rangementCarnets.ts`), hors de mon périmètre.
  2. **Tâche non proposée** pour « commander 25 kg de malt… » (t4) et « besoin d'une clé à sangle » (t7), chez les trois modèles. La consigne ne pousse pas à proposer une tâche d'achat.
  3. **t7 : chemin « Outils › Filtration »** sous le domaine outils : le premier niveau répète le nom du domaine. Le juge le compte faux, selon l'attendu écrit avant les passes, que je n'ai pas modifié.
- Sur ce banc, la 3.8 ne montre aucun jeton de réflexion (`thoughtsTokenCount` absent) et rend environ 240 jetons. Hydrogen réfléchit environ 520 jetons et compte environ 5 190 jetons en entrée pour le même texte (contre 3 810 pour la 3.8) : sa tokenisation est plus lourde.
- Latence : la 3.8 met 5 à 8 s par rangement, contre 1 s pour la lite. Je n'ai pas cherché à corriger cette lenteur, mais il faut la garder en tête pour l'écran : l'attente se voit.
- Le journal est suivi par Git mais partagé avec d'autres voies : comme c70-ia, je ne l'ai pas commité.

DÉCISION À PRENDRE : la faute de t6 avec, côté client. Une ligne versée par `carnetId` dans un carnet mémo du même sujet perd le genre et le chemin du `sujet`. Options : (A) appliquer à cette ligne le sujet comme une suggestion « Rattacher ? » (carnetSuggere + neuf), pour que « Garder à part » le porte ; (B) garder le versement direct dans le carnet mémo, en jugeant qu'une amende liée aux déclarations y a sa place. Recommandation : A, car la phrase dit un problème neuf et non un fait accompli. Le choix revient à la voie de correction de C70 (pilote).

CONNAISSANCE : rangement du Carnet, banc D453 du 25.11 (8 tenues, contexte sans et avec un carnet du même sujet). Gemini-3.5-flash-lite : 0,0020 CHF et 1 s par appel, 9/16, et elle omet parfois un champ requis du schéma (`sujet`). Gemini-3.8-flash : 0,0094 à 0,0101 CHF et 5 à 8 s par appel, 12/16. Gemini-4-hydrogen : 0,0167 CHF et 5 s par appel, 11/16, avec environ 36 % de jetons d'entrée en plus pour le même texte. La 3.8 reste le bon choix pour `rangerCarnet`.

LEÇON PROPOSÉE : un banc comparatif de modèles juge aussi la sortie du modèle seule (ici le `sujet`), à côté de ce que l'écran en tire. Sans cette seconde mesure, une faute de lecture côté client (t6) passe pour une faute du modèle, et pèse pareil sur les trois.
