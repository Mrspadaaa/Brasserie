OK — relance 2 : IDENTITE OK (99 contrôles, 390 et 1280) ; BASELINE : 4 écarts préexistants prouvés hors port (identiques avant le port)

## 1. La baseline des autres étapes
- **Cause** : la commande de la relance 1 n'avait pas `--env VITE_HOP_V4=on`. Sans lui, `src/App.tsx` l. 258 (`hopV4Enabled`) ne monte pas l'étape Houblons de la maquette : le DOM de `?dev-local&etape=houblons` montre le journal d'observation, aucun `[data-ecran]`, aucune erreur de page (diagnostic dans le rendu, Chrome). **Aucun lien avec le port d'Identité.**
- Commande qui marche : `node scripts/with_server.mjs --server "npm run dev -- --port 5611 --strictPort" --port 5611 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake -- node scripts/agents/baseline-visuelle.mjs --comparer --copie=<ce worktree>` (en-tête de `baseline-visuelle.mjs`). Sortie : 24 états `OK`, **4 `ECHEC`** : `suggerer/bannie-tropicaux` 2,4590 %, `fiche/repos` 2,7491 %, `fiche/bas` 10,2958 %, `substituer/dry-hop` 0,3163 %.
- **Preuve que les 4 ne viennent pas du port** : même rejeu sur une copie de `859409d6~1` (le commit d'avant le port, sans `src/ui/identite/`), les trois écrans concernés : **`BASELINE ECHEC 4`, mêmes quatre états, mêmes pourcentages au chiffre près** (`captures/r2/baseline-avant-port.txt`). Diffs ouverts (`_ecarts/fiche/repos.diff.png`, `_ecarts/substituer/dry-hop.diff.png`) : des lignes de variétés et de familles qui changent (Nectaron, Barbe Rouge…), donc des données du moteur de houblons plus récentes que les références, pas une mise en page. À décider par le pilote : reprendre ces 4 références (`--prendre`) après vérification, ou chercher le commit de données.
- Journaux : `captures/r2/baseline-journal.txt` (avec le port), `baseline-avant-port.txt`, `baseline-final.txt` (rejeu complet après la dernière retouche CSS : 24 `OK`, `BASELINE ECHEC 4`, les mêmes quatre états aux mêmes pourcentages). Les 24 autres états (étape Houblons, Ma bière, Comparer, fiche sauf 2, Dryhopper, substituer sauf 1) sont à 0 px ou sous la tolérance : le port ne les change pas.
- Reste de la copie temporaire : `git worktree remove` a supprimé le dossier, mais le répertoire d'administration `.git/worktrees/p1-head` (dépôt principal) n'a pas pu être effacé (accès refusé) ; `git worktree prune` le fera depuis le dépôt principal.

## 2. La fixture d'Identité
- `src/ui/identite/apercuDev.ts` (nouveau) : « Stout export », style **Foreign Extra Stout** (le code seul « 16D » n'est pas un alias : sans résolution, aucune plage, ce que la relance 1 avait vu comme « marqueur absent »), 20 L, OG 1,066, trois grains (4,6 kg Pale Ale, 1,0 kg Munich, 0,5 kg orge torréfiée : valeurs de démonstration, **simulées**). Ouverte par `?dev-local&etape=houblons&recette=identite`. La fixture « Stout export » des Houblons (`maBiere/apercuDev.ts`) n'est pas touchée. Test : `tests/unit/identite/apercuDev.test.ts`.
- **Fichier hors Possède, une modification** : `src/App.tsx`, 4 lignes dans le `useEffect` qui lit `recette=` (une branche `recette === 'identite'` à côté de `vide`, derrière `import.meta.env.DEV` et `?dev-local`, jamais dans `dist/`).
- `capturer-identite.mjs` joue cette fixture (`recette=identite`) ; la recette vide reste jouée à part (`app-vide`). Le repos comparé à la maquette s'ouvre dans un Chrome neuf (le brouillon de la page persistait : `app-repos-bis` montrait 55 L).

## 3. Les défauts du port (série finale : `IDENTITE OK`, 99 lignes OK, aucune ECHEC)
Commande : `node scripts/with_server.mjs --server "npm run dev -- --port 5612 --strictPort" --port 5612 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-10-31-ecran-identite/voies/p1-port/capturer-identite.mjs --sortie=work/missions/2026-10-31-ecran-identite/voies/p1-port/captures/r2` (sorties : `captures/r2/serie-sortie.txt`, `identite-journal.txt`).
- **Espace libre et Matériel fermés, côte à côte** : cause = l'effet qui ouvrait Matériel quand l'installation est « à adopter » (la fixture est une recette existante : `installationNeedsAdoption`). Supprimé. L'alerte au premier plan dit « Adopte ton installation avant de lancer ce brassin. » suivie d'un lien « Ouvrir Matériel » (le geste n'est pas perdu). Mesuré : `tuiles` 390 : espace `top 691 left 8 w 184`, matériel `top 691 left 198 w 184`, fermés ; 1280 : `w 369` chacune, même `top`.
- **Pied Retour/Suivant sans défiler à 390** : `pied {"bas":793,"haut":844}` (bas 1212 avant), grâce aux tuiles fermées.
- **Le « + » trouvé, sans texte dessous** : le script cherchait `position: fixed` sur le bouton lui-même, alors que c'est son conteneur qui est fixe (faute du script, pas de l'app). Corrigé : il remonte les ancêtres. `le + ne recouvre aucun texte au repos` : OK à 390 et 1280. Sur la capture `app-repos-390` le + est sous Suivant, à droite, sur du blanc.
- **Pastille du style** : `teinte "140 90 220"` (violet des stouts), fond `rgba(140, 90, 220, 0.2)`. Cause : « 16D » ne dit rien à `familleDuStyle` ; la teinte se lit maintenant sur le nom saisi, puis sur le nom du style résolu. Pastille élargie (13,5 rem, 62 %) : « Foreign Extra Stout » n'est plus tronqué à 390. Chevron : marge droite du champ 30 px pour un chevron de 28 (`paddingDroit 30, chevron 28`), le texte n'est plus recouvert (capture `app-repos-390`).
- **`r4a-plages` et `r4a-reperes`** : `PlagesStyle.tsx` ne rend rien sans style résolu (`if (!style) return …`) ; la fixture des Houblons porte « 16D », non résolu. Avec « Foreign Extra Stout » : pastilles « OG 1,056–1,075 », « IBU 50–70 » (ambre « sous ↓ » : la recette est à 1,025), « Repères ⌄ » ouvre FG, Alcool, EBC « 59–79 sous ↓ », « 16D · BJCP 2021 », « Lire la source », « Proposer l'empâtage / la conduite ». `captures/r2/app-reperes-ouverts-390.png`.
- **Cuve qui dit son dépassement** : sur la fixture, 55 L dans 60 L, 240 min : `avant ébullition ~71,2 L`, le bloc « Volumes et matériel » dit `71,2 / 35 L` (un seul nombre) ; la barre dit « ~71,2 L avant ébullition · **+36,2 L de trop** » en rouge, zone rouge hachurée, trait de la cuve utile (35 L). Le bloc « Espace libre » : « +25 L de trop », sans valeur négative. Le cas de D205 (55 L, fermenteur 60 L, 240 min, cuve de 45 L → ~67 L, **« +22 L de trop »**) est couvert par le test unitaire `barreCuve(67, 12, 45)` ; sur la fixture, la cuve du profil de démonstration est de 35 L utiles, donc 36,2.

## Captures ouvertes (dossier `captures/r2/`, toutes ouvertes en image)
- 390 : `cote-a-cote-390` (maquette et app au repos : mêmes blocs, mêmes pointillés, « › » aux deux règles, tuiles du bas fermées côte à côte, Suivant et + en bas ; différences : style plus long, une ligne d'alerte d'adoption, grain/OG/IBU de la fixture) ; `app-repos-390`, `app-repos-cave-390` (thème sombre lisible : hachures, pastille violette, pointillés, Suivant ambre) ; `app-vide-390` (import dans le corps, pas de plages, « — avant ébullition · sans malts », « 0 L libre, plein ») ; `app-reperes-ouverts-390` ; `app-cuve-deborde-390` (240 min tapé, règle 0–270, +25 L de trop, +36,2 L de trop) ; `app-fermenteur-60-390` (Matériel ouvert seul sur toute la largeur, fermenteur 60, « ↺ profil », deux boutons d'adaptation, bloc « Volumes et matériel ») ; `app-clavier-saisie-en-cours-390` (180 tapé, curseur dans le champ).
- 1280 : `cote-a-cote-1280` (même mise en page que 390, large) ; `app-cuve-deborde-1280` (cuve en rouge, tuiles côte à côte, Matériel ouvert dessous, + en bas à droite).
- Non ouvertes une à une : `app-ebullition-240-*`, `app-fermenteur-ouvert-*`, `app-profil-rendu-*`, `app-clavier-apres-*`, `maquette-repos-*`, `app-repos-1280`, `app-repos-cave-1280`, `app-vide-1280`, `app-reperes-ouverts-1280` : produites par la même série, validées par ses mesures, non regardées par moi.
- Vus et laissés : le + flottant recouvre un coin de règle quand on défile (état hors repos, comportement commun de l'app) ; sous « 240 » et « 270 › » les graduations de l'ébullition se touchent presque (graduation de la maquette, reprise telle quelle).

## Fichiers écrits
`src/ui/identite/apercuDev.ts`, `src/ui/identite/identite.css` (pastille, lien), `src/pages/BrewWizard.tsx` (étape Identité : effet d'ouverture supprimé, lien « Ouvrir Matériel », teinte du style résolu), `src/App.tsx` (4 lignes, hors Possède), `tests/unit/identite/apercuDev.test.ts`, `voies/p1-port/capturer-identite.mjs`, `voies/p1-port/captures/r2/`, ce fichier. Les anciennes captures (`captures/`, `captures/neuve/`) sont intactes.

## Rien ne se perd — ce que devient chaque fonction de l'ancien bloc (inchangé depuis la relance 1)
| Fonction actuelle | Dans l'écran r4-a |
|---|---|
| Bouton « Coller une recette trouvée » | Dans le corps seulement quand la recette est vide (`app-vide-390`) ; ensuite l'icône « Coller une recette » de l'en-tête. |
| Nom de la bière | Champ pointillé 20 px, `id="wz-title"`, même erreur `role=alert` |
| Style (Combobox, création, « Nouveau style ») | Même Combobox en pastille teintée + code du style |
| « Préciser le référentiel du style » | Inchangé, sous la rangée nom/style |
| Repères du style | Pastilles OG et IBU ; FG, alcool, EBC, source et édition derrière « Repères ⌄ » ; plage manquée en ambre « sous ↓ » / « au-dessus ↑ » |
| « Proposer l'empâtage », « Proposer la conduite », note NOLO | Dans « Repères ⌄ », mêmes effets |
| Volume (`wz-volume`) | Grande lecture 48 px, champ sur place, curseur, règle qui s'étend |
| Durée d'ébullition (`wz-boil`) | Idem, par 5′ |
| Phrase des litres évaporés | Bulle « ~N L évaporés » ; repli signalé quand le profil n'a pas de débit |
| Objectif NOLO | Interrupteur + `NoloPanel` dessous |
| « Choix pour ce brassin » | Tuile « Espace libre » (le composant tel quel) |
| « Matériel du plan », « Adapter la recette à N L », « Adapter à mon matériel actuel », bloc « Volumes et matériel » | Tuile « Matériel » ; **ouverte à un toucher** (puce « fermenteur N L », ou lien « Ouvrir Matériel » de l'alerte d'adoption) |
| Alertes d'installation, notice d'adaptation | Lignes `role=status` au premier plan sous la barre de la cuve ; la notice en bas |
| Entrée = champ suivant | Gardée pour le nom ; dans un nombre, Entrée valide et reste |

## Critères (sorties)
- G1 `npm run build` : `✓ built in 23.24s`. `npx tsc --noEmit` : aucune sortie.
- G2 `npx vitest run tests/unit/identite --maxWorkers=2` : `Test Files 5 passed (5)`, `Tests 64 passed (64)`.
- G3 `node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs --registre --registre=work/refonte-frontend/v4/choix/ecrans-app.json` : `REGISTRE OK (1 écrans)`.
- G4 : ce fichier.
- `node scripts/agents/systeme.mjs cablage` : `CABLAGE OK`.
- `npm run lint:design` : `EXTRA OK`, `LINT DESIGN OK (avertissements de format mis à part)`.
- Série Chrome : `IDENTITE OK`. Baseline : voir § 1.
- Essais : série Chrome 3 passages (le 1er : 4 ECHEC dont 2 fautes du script, le 2e : OK).

## DEMANDE EXECUTANT :
Rien à rejouer pour la relance 2 : la série et la baseline ont été lancées dans ce worktree. Si le pilote veut un rejeu :
`node scripts/with_server.mjs --server "npm run dev -- --port 5612 --strictPort" --port 5612 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-10-31-ecran-identite/voies/p1-port/capturer-identite.mjs --sortie=work/missions/2026-10-31-ecran-identite/voies/p1-port/captures/r3` → `IDENTITE OK` ; puis la baseline de § 1 → 24 `OK` et 4 `ECHEC` préexistants ; ouvrir les captures listées ci-dessus, dont les « non ouvertes une à une ».

## Écarts restants avec r4-a
Le style long tient sur une pastille plus large que dans la maquette ; une ligne d'alerte d'adoption et jusqu'à trois alertes d'installation (vraies, du moteur) s'ajoutent au premier plan ; le + flottant est celui de l'app ; en-tête de l'assistant (« Modifier « … » », « Abandonner » sous le titre à 1280) commun aux sept étapes, hors périmètre.

DÉCISION À PRENDRE : (1) les 4 références de baseline (`suggerer/bannie-tropicaux`, `fiche/repos`, `fiche/bas`, `substituer/dry-hop`) sont plus anciennes que les données du moteur de houblons : les reprendre après regard (`--prendre --forcer`) ou chercher le commit de données ; ma recommandation : les ouvrir, puis les reprendre. (2) `src/App.tsx`, 4 lignes hors Possède, à valider et commiter par chemin (`src/ui/BrewEquipmentSummary.tsx` de la relance 1 est déjà au commit 3a6d5f61). (3) Restes de la relance 1 : le bouton « Coller une recette trouvée » (deux tests `yeastTransferUi`), l'étiquette « cuve utile » contre capacité totale, `scripts/check-nolo-ui.mjs`.

CONNAISSANCE : `?dev-local&etape=houblons` ne monte la maquette des Houblons (`[data-ecran='ma-biere']`) qu'avec `VITE_HOP_V4=on` ; une recette de démonstration de l'assistant doit porter le NOM d'un style résolu (un code BJCP seul comme « 16D » n'est pas un alias : aucune plage, aucune teinte).
LEÇON PROPOSÉE : une commande de série Chrome se recopie de l'en-tête du script qu'elle lance (`--env` compris) ; la relance 1 avait perdu `VITE_HOP_V4=on` et pris un état de configuration pour un défaut du port.
