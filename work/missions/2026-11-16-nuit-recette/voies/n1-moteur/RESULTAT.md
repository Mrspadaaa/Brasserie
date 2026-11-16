ECHEC — RC-9 : le correctif casse 8 tests de choix validés (décision à prendre, moteur laissé à HEAD) ; inventaires non faisables seuls ; sources de l5b et s5a perdues

## 1. RC-9 — État de l'art (L29)
- Problème type : dose d'acide pour une alcalinité résiduelle (Kolbach) ou un pH de maische cible ; méthode standard : Kolbach / Palmer / Bru'n Water (ΔAR = ΔpH × 50 × B / ratio). Le dépôt l'a déjà (`acidNeeded`, `phShiftFromRa`, B = 45 meq/kg/pH). Aucune bibliothèque à ajouter.
- Cause vérifiée (`src/domain/water/treatment.ts` l. 94-140, branche `profileRange`) : en 21A la fourchette HCO₃ est 0–60. `referenceDose` vise `min(raCeiling, raTarget)` du malt (−157 / −220, Pilsner à 3,59 L/kg), très sous la bande de couleur (−52 à 7). `boundedDose = clamp(low, high, ref)` tombe sur `high` (HCO₃ → minimum du profil, 0).
- Mesuré (test `tests/unit/waterProposition21A.test.ts`) : bande −52 à 7 ; acide 5,9 + 2,5 mL ; AR −23 → −124,1 ; HCO₃ total 6,4 ; pH estimé 5,55 (distillé 5,75).
- Hypothèse de l'essai précédent « 60 mg/L tenable à AR ≈ −27 » : FAUX ici. Le gypse (15,7 g) apporte Ca ≈ 127 mg/L (−91 d'AR). HCO₃ total ≤ 60 avec rinçage à 17 mg/L exige HCO₃ d'empâtage ≈ 79, soit AR ≈ −61 ; à −52 (bas de bande) le total est 65,7. Profil HCO₃ ≤ 60 et bande ne tiennent ensemble qu'à ≈ 70 % d'osmosée.
- Correctif candidat (`voies/n1-moteur/rc9-candidat.patch`, 20 lignes) : un souhait de pH inatteignable (`wishedDose > high`) s'arrête au bas de la bande ; seul `low` (HCO₃ ≤ max du profil, borne dure) peut aller plus loin. Résultat 21A à 50 % : acide 2,2 + 2,5 mL, AR −60,7 (encore 9 sous la bande, à cause du profil), HCO₃ 58,6, pH estimé 5,65. Ce n'est PAS « AR dans la bande ».
- **Appliqué ? Non.** `treatment.ts` est à HEAD. Avec le patch, 8 tests de choix validés cassent (rejoués : 38 fichiers verts sur 44 ; HEAD : tout vert) :
  1. `waterReactivity` RL-5 (01A, 3,3 mL) : « Le brasseur garde ce dosage (« ça dépend du style »), le calcul ne change pas ».
  2. `stoutWaterProfile` « adopts the profile… » (stout, acide manuel / Doser).
  3. Minimum d'osmosée de la démo : 45 % → 40 % (moins d'acide, le seuil de lactate cède). `minimumOsmosee` (1), `eauPrechargement` (2), `eauW1b` RC-1 (3) attendent « 45 % », valeur en ligne.
  Le moteur ne devait changer que par le test ; le brasseur a déjà validé le comportement contraire sur trois points : je ne le décide pas seul (règle n° 1).

### Livré
- `tests/unit/waterProposition21A.test.ts` (nouveau, 2 verts) : constat figé de RC-9 sur HEAD + l'attente « AR dans la bande, pH cohérent » en `it.fails` (rouge sur HEAD ; il passera au rouge, donc à retourner en `it`, le jour où le moteur change). Test rouge avant : l'assertion `raAfter ≥ band.min` échoue à −124,1 (vu).
- Rejoué à HEAD : 40 fichiers, 1148 tests verts (`tests.txt`, dot) : eau unitaires, `minimumOsmosee`, `waterProposition21A`, intégration water*, stout, brewerWaterProposal, eauPrechargement. `eauW1b` n'est pas rejoué ici : un autre fichier l'a modifié (voie n2).
- `npx tsc --noEmit -p .` : 0 erreur (`tsc.txt` vide).

## DÉCISION À PRENDRE (RC-9)
Question : en cible de style (profil HCO₃ prioritaire), l'acide peut-il aller jusqu'au HCO₃ minimum du profil (HEAD ; RL-5, stout) ou doit-il s'arrêter au bas de la bande de couleur / au HCO₃ maximal du profil ?
- A (HEAD) : RC-9 reste (pH annoncé 5,55, lactate haut sur 21A).
- B (`rc9-candidat.patch`) : 21A 5,9 → 2,2 mL ; minimum démo 45 → 40 % ; mettre à jour les 8 tests ci-dessus ; RL-5 à relire par le brasseur.
- C : B + message « le profil HCO₃ ≤ 60 ne tient avec l'AR de la bande qu'à ≈ 70 % d'osmosée ».
Recommandation : B puis C, mais le brasseur doit voir l'effet (RL-5 est une phrase à lui). La nuit ne le tranche pas seule.

## 2. Inventaires controle-choix
- Fait : 5 lignes ajoutées à `work/refonte-frontend/v4/choix/ecrans-app.json` (reprises de la branche `claude/reverent-roentgen-406505`, mots et captures inchangés) : `paliers` (r2), `recette` (r1), `eau-sels` (aujourdhui), `eau-onglet` (w1b), `recap` (m2). JSON valide ; captures présentes (v0/paliers/r2, v0/recette/r1, v3/eau-onglet/w1b, v2/recap/m2 ; eau-sels : inventaire/captures/assistant).
- `controle-choix.mjs --registre` (sur ce registre) échoue encore, pour ces 5 lignes, de deux façons, et pour d'autres lignes déjà en échec avant moi (levure, compta, etc.) :
  1. « ses mots ne se retrouvent pas dans SPEC-BRASSEUR » : les phrases du brasseur (r2, r1, w1b, sels, m2) sont dans le SPEC de la branche roentgen (vérifié) mais PAS dans celui de HEAD (tag recette3). Hors Possède : le pilote doit reporter ces lignes de `work/refonte-frontend/v4/SPEC-BRASSEUR.md`.
  2. « ni inventaire ni contrôle » : un inventaire est une liste d'éléments notés bons (`id`, `mots` retrouvés dans SPEC, capture), joués par `controle-reprise.mjs` contre `<dossier>/<route>/NOTE.md` (section « ## Reprise ») ET des marqueurs `data-element` posés dans la page. Sur l'app, ça demande des marqueurs dans `src/ui/` (paliers, recette, recap, water), hors Possède ; les inventaires les plus proches (identité r4-a) ont été faits avec la maquette. Je n'ai pas collé un contrôle bidon (controle-commun ne vérifie pas un choix).
- Le registre n'a jamais passé pour levure non plus (même message) : « comme levure l5b est contrôlé » n'existe pas.
- Prochaine action : (a) reporter les mots dans SPEC ; (b) une voie qui possède `src/ui/paliers/`, `src/ui/recette/`, `src/ui/recap/`, `src/ui/water/` pose les `data-element` et écrit les inventaires + NOTE.md de reprise.

## 3. Images l5b-cadres.png et s5a-cadres.png : non régénérables
- `work/missions/2026-11-09-ecran-levure/p2/l5b/` et `s5a/` ne contiennent que `NOTE.md`. Aucun `etat.html` ni PNG sur ce disque : ni dans les 20+ worktrees, ni dans l'historique Git (`work/missions/**` est ignoré, jamais commité). `panel-p3.html` les cite (`p2/l5b/l5b-cadres.png`).
- Je ne les reconstruis pas : refaire la maquette l5b/s5a serait la redessiner, ce que la règle n° 1 interdit (artefact choisi : https://claude.ai/artifact/XeAsjYdnSkosrRTTWR23Gz). Les images c6a/c6b existent, preuve que les deux dossiers ont perdu leurs sources.
- Options : (a) le brasseur ou le pilote ré-exporte l5b et s5a depuis l'artefact (HTML + captures) ; (b) un concepteur Opus reconstruit à partir de `NOTE.md` (décrit les cadres) et du code de l'étape Levure portée, puis le brasseur confirme. Recommandation : (a).

## Fichiers écrits
`tests/unit/waterProposition21A.test.ts` ; `work/refonte-frontend/v4/choix/ecrans-app.json` (+5 lignes) ; `voies/n1-moteur/{RESULTAT.md, rc9-candidat.patch, tests.txt, tests-21a.txt, tests-head.txt, tsc.txt}`. `src/domain/water/` inchangé (HEAD).

## Doutes
- RC-9 : la bande « −49 à 10 » du constat du brasseur diffère de −52 à 7 mesuré (épaisseur de maische 3,59 L/kg) ; même cause.
- Le pH 5,55 « annoncé » de RC-9 est cohérent avec l'AR (5,75 − 124 × 3,59 / 2250 ≈ 5,55) ; le pH ne trahit pas l'AR, c'est le choix de dose qui est contesté.

CONNAISSANCE : en 21A, le profil HCO₃ ≤ 60 et la bande de couleur du Pilsner sont incompatibles à 50 % d'osmosée avec le gypse du solveur (AR ≈ −61 pour HCO₃ 60) ; le minimum d'osmosée de la démo (45 %) repose sur un acide qui descend sous la bande.
LEÇON PROPOSÉE : un fichier de maquette cité par un registre mais sous `work/missions/**` (ignoré par Git) peut disparaître sans trace ; tout `etat.html` / PNG d'un choix du brasseur doit être commité ou archivé hors de l'ignoré.
