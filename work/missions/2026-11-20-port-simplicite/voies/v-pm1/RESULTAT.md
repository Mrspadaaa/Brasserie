OK — la carte du palier appelle température et pH au curseur, Relever / Plus tard

Reprise par v-pm1-suite. Tout est joué au banc (4 thèmes/largeurs), 18 captures ouvertes. 4 vieux tests de l'ancienne carte « Maintenant » sont rouges (voir DÉCISION).

## Fichiers écrits
- `src/domain/appelMesure.ts`, `src/ui/brassage/AppelMesure.tsx`, `src/pages/BrewDayPage.tsx` (zone du palier ; + deux heures du pH passées à `PH_APRES_MIN`, l. 951 et 1557), `src/ui/BrewThermalControl.tsx`
- Frise 15′ (décision pilote) : `src/domain/brewMeasures.ts` (`phDes`) ET `src/domain/brewDayBilan.ts` (`des`, la vraie source de la frise « Relevés » et de la tuile Empâtage ; elle portait aussi un `10 * MIN` : même constante seule). Les deux lisent `PH_APRES_MIN` de `appelMesure.ts`.
- Tests mis à jour pour 10 → 15 : `tests/unit/brewMeasuresAttendues.test.ts`, `tests/unit/brewDayBilan.test.ts` (l. 110, 250). Nouveaux : `appelMesure.test.ts` (15), `appelMesureVue.test.tsx` (10).
- Banc : `outils/banc.mjs` (correction : la clé du thème est `laffinee.theme` / `cave`, pas `theme` / `dark` ; avant, les captures « cave » étaient en clair, refaites).

## Critères
- G1 : `tests.txt` (47 fichiers liés à la page, à brewMeasures et à brewDayBilan) : 411 passés, 6 rouges (voir ci-dessous). Les 25 tests de la voie sont verts.
  Rouge avant le code : `rouge.txt` (« Failed to resolve import … appelMesure »).
- G2 : cette note contient « Inventaire » et « écarts ».
- G3 : 18 captures dans `captures/` (390 et 1280, clair et cave) : RESULTAT OK / CAPTURES OK.
- `npx tsc --noEmit` : aucune erreur sur les fichiers touchés. Serveur 3116 arrêté.

## Tests rouges (hors Possède, non modifiés)
- Causés par ma voie (la carte « Maintenant » d'une seule mesure est remplacée par l'appel au palier, décision actée) : `brewOrdreM2` (« Relevés du jour » avant Grains), `brewPageI1b` (2 tests : carte « Maintenant · relevé dû », Enregistrer attend la pose), `brewPageK2` (« Enregistrer » dans la carte Maintenant). À réécrire sur la carte d'appel.
- Pas de lien avec ma voie (étape « ensemencement », aucun palier d'empâtage) : `yeastPitchingExecution` (2 tests : « Levure · » introuvable). Non rejoués contre HEAD (pas de checkout permis) : sans doute le travail non commité d'autres voies. `batchScheduling` était rouge au premier passage puis verte (instable).
- `brewAssist.ts` (hors Possède) garde `now - startedAt >= 10 * 60000` pour le conseil pH (fenêtre « 10 à 15 min » de `raisonMesure`) : laissé tel quel.

## Écarts par capture (contre `maquette/captures/pm1-clair.png` et `pm1-sombre.png`)
Ouvertes une à une. Communs à toutes : mêmes éléments, même ordre, mêmes mots (« Température du palier · à relever », 67 °C, « proposé, à confirmer », « pH d'empâtage · à 15′ », « cible 5,2 à 5,5 », Relever plein, Plus tard contour), couleurs de rôle respectées.
- écarts 390-clair-appel / 390-cave-appel : (1) pH 5,4 et bande 5,2–5,5 viennent des données (pH visé de la recette, `cibleMesure`), la maquette dessine 5,3 et 5,2–5,4 (valeurs de dessin) ; (2) zone tactile du curseur 40 px, rail 6 px ; (3) repère vert dépasse de 4 px du pouce ; (4) boutons 44 px (maquette ~38) ; (5) en cave, Relever est crème plein comme dans pm1-sombre ; warn ambre, rail ambre, repère vert lisibles, aucun débordement.
- écarts 390-clair-touche / 390-cave-touche : état que la maquette ne montre pas : après un geste, « proposé, à confirmer » cède la place à l'écart (« +0,5 au-dessus » ambre, « dans la cible » vert) ; le repère vert se voit à la cible, pouce déplacé. Lisible dans les deux thèmes.
- écarts 390-clair-ph-du / 390-cave-ph-du : état ajouté exigé (pH dû) : la carte pH passe warn, « pH d'empâtage · à relever » ; la maquette n'a que l'état « à 15′ ». Frise : « pH · … · à relever ».
- écarts 390-clair-replie / 390-cave-replie : état ajouté exigé par « Plus tard laisse à relever » : une ligne warn « Température du palier · à relever » + Relever ; la maquette ne la montre pas. Rien n'a été écrit.
- écarts 390-clair-fait / 390-cave-fait, 390-*-releve, 390-*-tout : ligne verte « ✓ Relevé palier 68,5 °C pH 5,34 » (état ajouté) ; frise « pH ✓ » ; contraste vert sur fond sombre correct.
- écarts 1280-clair-appel / 1280-cave-appel : la carte occupe la colonne gauche (~590 px) à côté des tuiles de relevés de la conduite ; pas d'étirement ; même dessin qu'au 390. Frise : « pH · … · dans 15 min » aligné sur « à 15′ ».
- écarts 1280-clair-releve / 1280-cave-releve : température relevée (« relevé 15 h 34 · dans la cible », fond vert), pH reste « à relever » warn, « Relever » grisé (rien à écrire tant que le curseur de pH n'est pas posé), Plus tard actif.
- Après rejeu final : frise et carte disent la même heure (390-clair-appel : début 15 h 21, pH 15 h 36, « dans 15 min »).

## DÉCISION À PRENDRE
1. Réécrire les 4 tests rouges de l'ancienne carte « Maintenant » (brewOrdreM2, brewPageI1b ×2, brewPageK2) sur la carte d'appel : hors Possède ; recommandation : un auteur dédié, sans toucher le comportement.
2. Aligner aussi le conseil de `brewAssist.ts` (10 min) sur 15 ? Recommandation : non, c'est une alerte « à faire dès » dans la fenêtre 10–15 min.

## Inventaire (figure pm1) et où il est dans l'app
Source : `maquette/index.html`, figure `pm1`.

| # | Élément / état de la figure | Rôle | Où dans l'app |
|---|---|---|---|
| 1 | En-tête « Saccharification · 59:36 » | — | déjà dans l'app (horloge du palier, non touchée) |
| 2 | Carte « Température du palier · à relever », fond/bord warn | warn | `AppelMesure.tsx` `Carte` (CARTE_WARN), temperature |
| 3 | Rail + remplissage acc, repère vert à la cible, pouce sur la cible | acc / ok / texte fort | `AppelMesure.tsx` `Curseur` (`--bz-ph2`, `--bz-hop`, `--bz-t0`) |
| 4 | Valeur « 67 °C » à gauche | texte fort | `Carte` (gauche, classe bz-m) |
| 5 | « proposé, à confirmer » à droite | muet | `Carte` (droite, MUET) |
| 6 | Carte « pH d'empâtage · à 15′ », fond neutre | neutre | `Carte` (CARTE) ; « à relever » warn dès 15 min (domaine `due`) |
| 7 | Rail, repère, pouce du pH | acc / ok | `Curseur` |
| 8 | « 5,4 » (donnée) ; « cible 5,2 à 5,5 » | fort / muet | `Carte`, `texteCible` |
| 9 | Bouton Relever (plein) | sel | `AppelMesure` (bas) ; écrit via `releverParAppel` (BrewDayPage) → `ecrireReleves` |
| 10 | Bouton Plus tard (contour) | gh | `AppelMesure` (bas) ; n'écrit rien |
| 11 | Ordre : température, pH, paire de boutons | — | `AppelMesure` |
| 12 | Deux thèmes | — | jetons --bz-* ; captures `*-cave-*` |
| E1 | Curseur touché → écart à la cible | ajout exigé | `ecartTexte` |
| E2 | pH dû → carte warn | ajout exigé | `appelPalier` `due` |
| E3 | Plus tard → ligne repliée | ajout exigé | `AppelMesure` mode `replie` |
| E4 | Relevé écrit → « relevé 15 h 22 » vert, ligne « ✓ Relevé … » | ajout exigé | `Carte` `data-fait` ; mode `fait` |
| E5 | Cible inconnue → « — », « cible inconnue », pouce en pointillé | ajout exigé | `Carte`/`Curseur` `vide` ; test vue « cible inconnue » |
| E6 | Mashout → température seule | règle existante | `appelPalier` (ph: null si tempC ≥ 75) |

Règles validées par le pilote et tenues : température confirmée par « Relever » ; pH écrit seulement si le curseur a été touché ; « Relever » inactif s'il n'y a rien à écrire ; états replié et « ✓ Relevé » gardés. Le palier doit être lancé pour que la carte apparaisse ; l'écriture reproduit `enregistrerMaintenant` (température medium « wort », pH roomTemp faux).

CONNAISSANCE : aucune.
LEÇON PROPOSÉE : un banc qui dit « cave » doit lire le thème posé sur <html> et échouer s'il ne correspond pas (ici 8 captures « cave » étaient en clair, clé de stockage fausse) ; et le banc d'un worktree partagé neutralise le WebSocket de Vite.
