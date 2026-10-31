OK — Identité de l'app reprend r4-a (nombres tapés, règles qui s'étendent, cuve) ; rendu Chrome à jouer par l'exécutant

Code, tests, build et registre : verts. **Le rendu n'est pas encore vu** (aucune capture prise par moi : le serveur et Chrome passent par l'exécutant, voir
« DEMANDE EXECUTANT »). Tant que ces captures ne sont pas ouvertes et jugées, l'écran n'est pas validé (L12).

## Fichiers écrits
- `src/pages/BrewWizard.tsx` : l'étape Identité seulement (bloc `step === 'identite'`, et, juste au-dessus, ce qui l'alimente : évaporation, moût avant
  ébullition, capacité du fermenteur, tuile Matériel ouverte). Imports ajoutés. `evaporationHint` (texte de l'ancienne phrase) est remplacé.
- `src/ui/identite/` (nouveau) : `regles.ts` (fonctions pures), `plages.ts`, `teinteStyle.ts`, `ChampNombre.tsx`, `Regle.tsx`, `CarteVolume.tsx`,
  `CarteEbullition.tsx`, `PlagesStyle.tsx`, `TuilesMateriel.tsx`, `InterrupteurNolo.tsx`, `identite.css` (couleurs lues sur les jetons de thème : clair et « cave »).
- `tests/unit/identite/` : `regles.test.ts`, `plages.test.ts`, `cartes.test.tsx` (60 tests).
- `work/refonte-frontend/v4/choix/ecrans-app.json` (D206, écran `identite`, route `r4-a`).
- `work/missions/2026-10-31-ecran-identite/v1/r4-a/` : `inventaire-r4a.json` (24 éléments), 23 marqueurs `data-element` dans `etat.html`, section
  « ## Reprise » ajoutée à `NOTE.md` (sans elle, `controle-choix.mjs <dossier>` ne lit pas la page).
- `voies/p1-port/capturer-identite.mjs` : la série Chrome de la demande ci-dessous (assertions + captures + côte à côte).

## Rien ne se perd — ce que devient chaque fonction de l'ancien bloc
| Fonction actuelle | Dans l'écran r4-a |
|---|---|
| Bouton « Coller une recette trouvée » | Reste dans le corps **seulement quand la recette est vide** (r4-a, retouche commune) ; l'icône « Coller une recette » de l'en-tête (déjà dans l'assistant) sert ensuite. Voir DÉCISION n° 1 |
| Nom de la bière (Field + erreur) | Champ pointillé 20 px, `id="wz-title"`, même libellé, même erreur `role=alert` |
| Style (Combobox, création d'un style, « Nouveau style ») | Même Combobox, habillé en pastille teintée de la famille (BeerStyleTag) + code du style |
| « Préciser le référentiel du style » (plusieurs styles) | Inchangé, sous la rangée nom/style |
| Repères du style (OG, FG, alcool, IBU, SRM, source, édition) | Pastilles OG et IBU sous le style ; FG, alcool, EBC, `code · édition` et la source (HopSourceLink) derrière « Repères ⌄ ». SRM → EBC (×1,97). Une plage que la recette manque passe en ambre avec « sous ↓ » ou « au-dessus ↑ » |
| Propositions « Proposer l'empâtage », « Proposer la conduite », note NOLO sur les plages | Dans « Repères ⌄ », mêmes boutons et mêmes effets |
| Volume (InlineNum `wz-volume`, min 1) | Grande lecture 48 px : champ sur place, même `id`, même nom accessible « Volume en fermenteur », même effacement = « à renseigner » |
| Durée d'ébullition (InlineNum `wz-boil`, min 0, entier) | Idem, arrondie à 5′ |
| Phrase « N L évaporés — autant d'eau à prévoir… » | Bulle « ~N L évaporés » ; en repli (pas de débit au profil), note « repli 10 %/h, estimé » |
| Objectif NOLO (case + panneau) | Interrupteur NOLO ≤ 0,5 % ; le panneau `NoloPanel` s'ouvre dessous quand il est allumé ; l'invite d'adoption du matériel NOLO est conservée |
| « Choix pour ce brassin » (RecipeInstallationChoice : réserve, rinçage, exception) | Tuile « Espace libre ~20 % repère » ; elle contient le composant tel quel et s'ouvre toute seule quand une alerte d'installation existe |
| « Matériel du plan : <nom> » | Dans la tuile Matériel dépliée |
| « Adapter la recette à N L », « Adapter à mon matériel actuel » | Dans la tuile Matériel dépliée, mêmes handlers ; la tuile s'ouvre seule si le matériel est à adopter ou après une adaptation |
| Bloc « Volumes et matériel » (BrewEquipmentSummary) | Dans la tuile Matériel dépliée (inchangé). Son alerte reste au premier plan, sous la barre de la cuve (voir ci-dessous) |
| Alertes d'installation (`recipeInstallationIssues`) et notice d'adaptation | Lignes `role=status` au premier plan, juste sous la barre de la cuve ; la notice en bas |
| Entrée = champ suivant (FormNav) | Gardée pour le nom ; dans un nombre, Entrée valide et reste |

Ajouts de r4-a : puce « fermenteur N L » (ouvre le matériel), conseil, zones libre/trop, barre de la cuve, règles qui s'ouvrent, pointillés, « › ».

## Message du pilote (cuve) — pris en compte
La barre de la cuve se mesure contre la **limite utile** (`equipment.kettleWorkingL`, 36 L dans le cas vu en ligne), pas contre la capacité totale 45 L,
et son étiquette dit « cuve utile 36 L ». Le moût d'avant ébullition est `recipe.preBoilHotL` (le nombre de « Volumes et matériel », tiré du plan d'eau du
moteur) ; sans plan d'eau (aucun grain), le même moteur (`BrewingMath.waterVolumes`, avec 1 kg de grain : ce volume n'en dépend pas) le calcule,
sans addition refaite. L'alerte « La collecte avant ébullition dépasse la limite utile de la cuve » vient de `recipeInstallationIssues` (même calcul que
le bloc) et reste au premier plan ; le détail du bloc et les deux boutons d'adaptation sont à un toucher derrière la tuile Matériel.
Exemple D205 : 55 L, fermenteur 60 L, 240 min → moût ~67 L et plus ; contre une cuve de 45 L, **« +22 L de trop »** en rouge avec zone rouge (testé :
`barreCuve(67, 12, 45)`) ; contre la limite utile de 36 L du cas vu en ligne, le dépassement est plus grand ; l'écran affiche l'écart calculé, pas ce chiffre.

## Où est rangée la capacité du fermenteur (rien de créé)
`BrewhouseProfile.equipment.fermenterCapacityL` existe déjà (profil d'équipement). Pour un brassin, l'app fige une copie du profil dans
`details.brewhouse` (`snapshotBrewhouse`, déjà utilisé par « Adapter à mon matériel actuel »). La puce écrit **cette copie** (`setCapaciteFermenteur`) ;
« ↺ profil » remet la valeur de `configuredBrewhouse.equipment.fermenterCapacityL`. Le profil d'équipement lui-même n'est jamais modifié. Effet connu :
dès que la capacité s'écarte du profil, le bouton existant « Adapter à mon matériel actuel » apparaît (la recette diffère du profil) : c'est le
comportement de l'app. Aucun champ nouveau.

## Critères (sorties)
- G1 `npm run build` : `✓ built in 22.65s`.
- G2 `npx vitest run tests/unit/identite --maxWorkers=2` : `Test Files 3 passed (3) · Tests 60 passed (60)`.
- `npx tsc --noEmit` : aucune sortie (code 0).
- G3 : `node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs --registre --registre=work/refonte-frontend/v4/choix/ecrans-app.json` →
  `REGISTRE OK (1 écrans)`. **La commande écrite dans GATES.md (`--registre=…` seul) n'imprime que l'usage** : l'outil veut le drapeau nu `--registre`
  en plus (mode registre seul, `controle-choix.mjs` l. 38). Voir DÉCISION n° 3. Aussi :
  `controle-choix.mjs work/missions/2026-10-31-ecran-identite/v1 --registre=work/refonte-frontend/v4/choix/ecrans-app.json` → `CHOIX OK (1 écran(s) conforme(s) à son choix ; 0 ouvert(s))`
  (la maquette, 24 éléments, rendue dans Chrome) ; `controle-reprise.mjs --inventaire …/inventaire-r4a.json` → `INVENTAIRE OK (24 éléments, 1 variantes)`.
- G4 : ce fichier (voir la ligne du pilote ci-dessous).
- `npm run lint:design` : `OUTIL GOOGLE : 0 erreur(s), 18 avertissement(s), 1 info(s)` · `EXTRA OK` · `LINT DESIGN OK (avertissements de format mis à part)`
  (mêmes avertissements qu'avant ; `button-danger` 4,09:1 est antérieur à ce travail).
- Tests d'intégration de l'assistant (30 fichiers qui montent `BrewWizard`) : 331 passés, 2 échecs, tous dans `tests/integration/yeastTransferUi.test.tsx`
  (`getByRole('button', { name: 'Coller une recette trouvée' })` sur une recette **pleine**) : conséquence directe de r4-a (import dans le corps seulement
  si la recette est vide). Les 9 fichiers qui touchent le volume, l'ébullition, le matériel et le NOLO passent (74 tests), y compris
  `Matériel du plan : Royal Catering · cuve 45 L` et `textbox « Volume en fermenteur »`.
- Essais utilisés : 1 par critère (un bogue de `lireNombre` — « 1 2 » lu 12 — attrapé par mon test et corrigé avant tout autre essai).

## DEMANDE EXECUTANT :
But : jouer l'étape Identité sur l'app servie en local avec les fixtures, ouvrir toutes les captures, rapporter l'écart avec la maquette. Aucune donnée réelle
(`?dev-local`, toute requête hors localhost est coupée par le lanceur).

1. Serveur (dans CE worktree ou une copie, **pas** dans `C:/Users/mrspa/Documents/Brasserie`) puis la série. Si `.env` ou `src/data/seedData.ts` manquent dans la copie :
   voir `cerveau/agents/verification-locale.md`, ou reprendre les `--env` de l'en-tête de `scripts/agents/baseline-visuelle.mjs`.
   ```
   node scripts/with_server.mjs --server "npm run dev -- --port 5611 --strictPort" --port 5611 -- node work/missions/2026-10-31-ecran-identite/voies/p1-port/capturer-identite.mjs --sortie=work/missions/2026-10-31-ecran-identite/voies/p1-port/captures
   ```
   Sortie attendue : `IDENTITE OK` (sinon `IDENTITE ECHEC n` et la liste ; rapporter chaque ligne `ECHEC` telle quelle, sans corriger le code). La série joue, à 390 puis 1280 px :
   le repos ; l'ébullition tapée à 240 (règle 0–270) ; la puce du fermenteur, 60 L tapés, « ↺ profil » ; 55 L dans 60 L (la cuve dit son dépassement) ;
   le parcours au clavier (Tab depuis le nom, ↑ ↓, Échap, Entrée, 180 tapé) ; la maquette r4-a au même format ; le côte à côte.
2. Captures à produire (dans `voies/p1-port/captures/`, suffixe `-390` et `-1280`) : `app-repos`, `app-ebullition-240`, `app-fermenteur-ouvert`, `app-fermenteur-60`,
   `app-cuve-deborde`, `app-profil-rendu`, `app-clavier-saisie-en-cours`, `app-clavier-apres`, `maquette-repos`, `cote-a-cote` ; et `identite-journal.txt` (la ligne
   `INFO … : Tab depuis le nom → …` donne l'ordre réel des Tab).
3. À OUVRIR en image, une par une, et décrire en deux phrases chacune : les 8 `cote-a-cote-*`/`app-*` ci-dessus à 390 d'abord, puis 1280. Regarder en particulier :
   le pointillé sous 24 et 60, le « › » au bout des deux règles, la pastille du style (lisible ? le champ du style ne déborde pas), les pastilles OG/IBU, la barre de la
   cuve (bleu/or, trait de la cuve utile, zone rouge et « +N L de trop »), les deux demi-tuiles du bas, la hauteur totale (tient-il en un écran à 390 avec le pied ?),
   le thème « cave » (bouton thème de l'en-tête) sur `app-repos`.
4. Les autres étapes de l'assistant ne doivent pas changer :
   ```
   node scripts/with_server.mjs --server "npm run dev -- --port 5611 --strictPort" --port 5611 -- node scripts/agents/baseline-visuelle.mjs --comparer
   ```
   Sortie attendue : `BASELINE OK` (les écarts vont dans `work/refonte-frontend/v4/choix/baselines/_ecarts/` : les ouvrir). Si `--comparer` refuse la copie, noter pourquoi.
5. Rendre : la sortie de chaque commande, la liste des captures ouvertes avec une phrase chacune, et tout débordement, texte coupé ou chevauchement vu.

## Doutes et limites
- **Rendu jamais vu par moi.** Les couleurs (pastille du style via `color-mix`, hachures en `rgb(var(--alert) / …)`) et la hauteur totale sont à juger sur capture.
  Les sélecteurs CSS ont dû être renforcés (`:not([type=…])`) pour passer devant la règle `.recipe-wizard input` (16 px, 32 px de haut) : à vérifier sur la capture
  (le 48 px doit être du 48 px).
- Les marqueurs `data-element` 1, 2, 3 et 23 (en-tête, fil, bandeau, pied) sont posés dans la maquette seulement : dans l'app ils sont communs aux 7 étapes et hors
  de « l'étape Identité seulement ». Le marqueur 24 (« états ») est sur le bouton « Coller une recette trouvée » (recette vide).
- `scripts/check-nolo-ui.mjs` (l. 41 : clic sur `[aria-label="Objectif NOLO"] input[type=checkbox]` dans l'étape Identité) et les scripts qui ouvrent `details 'Objectif NOLO'`
  supposent l'ancienne case à cocher : l'interrupteur (`role=switch`, nom « Objectif NOLO · ≤ 0,5 % ») la remplace. À réadapter par le pilote.
- Le titre de section « Identité » (l'ancien `Section`) est retiré : l'en-tête dit déjà « Identité 1/7 », la maquette n'en a pas. `FormNav` reste autour du bloc : Entrée dans un
  nombre valide sans passer au champ suivant ; Entrée sur le curseur garde le comportement du formulaire. Le panneau NOLO allumé n'a pas été vu.
- Le champ du style reste un Combobox (création d'un style inclus) habillé en pastille ; la liste s'ouvre sous elle. Une pastille « bouton + liste maison » n'a pas été recréée.
- Plafonds de saisie ajoutés (non demandés, anti-faute de frappe) : volume 2000 L, ébullition 1440 min, capacité 2000 L ; au-delà, la valeur d'avant revient.
- `kettleWorkingL` « provisoire » (`workingVolumeConfirmed: false`) : la barre de la cuve mesure donc une limite que le brasseur n'a pas encore confirmée ; le bloc dit déjà
  « Limite utile de cuve provisoire » dans ses repères.

DÉCISION À PRENDRE : (1) Le bouton « Coller une recette trouvée » du corps ne reste que sur une recette vide (r4-a). Deux tests d'intégration
(`yeastTransferUi`) le cherchent sur une recette pleine. Options : a) les adapter à l'icône de l'en-tête « Coller une recette » (fidèle à r4-a, ma recommandation) ;
b) garder le bouton dans le corps en permanence (déroge à sa maquette). (2) Barre de la cuve : limite utile (`kettleWorkingL`, ce que dit le bloc « Volumes et matériel »,
votre consigne) ou capacité totale 45 L (D205 écrit) : j'ai pris la limite utile, avec l'étiquette « cuve utile N L » ; le choix du libellé revient à vous.
(3) GATES.md G3 : écrire `--registre --registre=work/refonte-frontend/v4/choix/ecrans-app.json` (ou rendre `--registre=<chemin>` seul suffisant dans `controle-choix.mjs`).

CONNAISSANCE : la capacité d'un fermenteur pour un brassin n'a pas de champ propre : elle vit dans la copie figée du profil (`details.brewhouse.equipment.fermenterCapacityL`),
et « Adapter à mon matériel actuel » reste le geste qui la rend au profil. Le moût d'avant ébullition de l'app est `recipe.preBoilHotL` (plan d'eau), comparé à `kettleWorkingL`
(limite utile), pas à `kettleCapacityL`.
LEÇON PROPOSÉE : un critère qui cite un outil existant doit être rejoué tel quel sur HEAD avant la voie (r14) : `controle-choix.mjs --registre=<chemin>` seul n'imprime que l'usage ; G3 ne pouvait pas donner REGISTRE OK.
