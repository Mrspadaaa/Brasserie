ECHEC — G6 : controle-choix --url sur l'app, CHOIX ECHEC (contrôles faits pour la maquette) ; G1 à G5 verts

## Fichiers écrits (tous dans « Possède »)
- `src/pages/PageShell.tsx` : prop `endActions`, la dernière rangée du contenu. Elle garde à droite la place du « + » flottant
  (`pr-16` si le lanceur flotte, rien s'il est dans l'en-tête quand le clavier est ouvert) ; la fin du contenu ne réserve plus
  ses 72 px (`data-floating-actions-gap="page-row"`).
- `src/pages/BrewWizard.tsx` :
  - Retour et Suivant deviennent `stepActions`, passés en `endActions`. C'est la même règle pour les six étapes ; `saving` les
    désactive (avant, le fieldset le faisait) ; aucune rangée si le brouillon est en lecture seule.
  - Étape 3, drapeau allumé : la rangée du titre ne garde que « ‹ », « 3/7 » (+ annonce pour lecteur d'écran), l'import et le thème.
  - `WizardSeed.step` : l'étape d'ouverture quand aucun brouillon n'est repris.
- `src/App.tsx` : le banc local `?dev-local&etape=houblons` (`&recette=vide`), derrière `import.meta.env.DEV`, le compte
  dev-local et un seul passage.
- `src/ui/hopIndex/maBiere/apercuDev.ts` (neuf) : la recette de sa maquette (Stout 16D, 20 L, OG 1,066, EBC 70, Nugget 46 g à
  60′, α 13 %, US-05).
- `Base.tsx` :
  - `ibuIncalculable` : IBU « ? » hachuré, avec sa raison, si la densité est inconnue ou si un ajout est incalculable ;
  - OG « ? » ;
  - la bande du style reste, sans le repère de ma bière ;
  - `levureCaracterisee`.
- `Frise.tsx` : « caractérisée » seulement pour une levure caractérisée (avant : « levure ? caractérisée »).
- `Ajouter.tsx` :
  - le champ passe par `Input` de l'app (+ `py-2 leading-6`, même rendu en ligne de textarea au doigt) ;
  - ◇ en `text-cave-200`, la teinte héritée dans sa maquette.
- `index.tsx` : type du ref. `briques.tsx` : le séparateur « · » devient un point dessiné en `bg-cave-600` (un décor, pas du texte).
- `tests/unit/hopIndexV4/etapeHoublons.test.tsx` : 9 tests de plus (16/16 avec designTokens).
- Voie : `verifier.mjs`, `choix-app.mjs`, `captures/`.

## Critères (rejoués)
- G1 `verifier.mjs` → `FINITIONS OK`. 22 mesures Chrome :
  - P1 : 0 cran couvert dans les six étapes, recette vide, recette avec houblon et recette de sa maquette ; le « + » reste sur les onglets.
  - P2 : « 3/7 » à l'étape 3, « Identité 1/7 » et « Levure 4/7 » inchangés.
  - P3 : « IBU ? OG ? EBC ? », sans NaN.
  - P4 : « IBU 60 OG 1,066 EBC 70 », Nugget.
  - Tests 16/16, audit des champs vert.
- G2 `systeme.mjs echoue FINITIONS -- … --sur-head` → `ECHOUE OK (FINITIONS, code 1)`. C'est un vrai échec de mesure sur une
  copie de HEAD (git archive dans os.tmpdir()), pas un plantage. Joué à la main avant les corrections, 11 fautes : P2, P3 (×4),
  P1 (Identité, Houblons, Paliers), P4 (×2).
- G3 `vitest designTokens` → 2 passed. G4 `audit_inputs` → `INPUT PROTECTION AUDIT PASSED`. G5 `npm run build` → `built in 23.12s`.
  `check-no-dev-auth` → propre, et la fixture absente de `dist/`.
- G6 `choix-app.mjs` → **CHOIX ECHEC**. Le mode `--url` + `--gabarit` est joué de bout en bout sur l'app, mais :
  - le registre a une faute d'une autre voie : « comparer : complément 4, ses mots ne se retrouvent pas dans SPEC-BRASSEUR » ;
  - les 9 contrôles de l'étape supposent la maquette. Ses pages d'états `etat-*` et ses fixtures (Motueka et Citra cryo dans
    les ajouts rapides ; le stock de dev n'a que Saaz Late) n'existent pas dans l'app. Ses routes `#/biere` non plus : l'app
    passe par la pile. La fiche à l'appui long (A9) est T13 (#173). La reprise trouve « 0 repris » parce que `existe()` sonde
    `/<route>/etat.html` sans le gabarit.
  - Hors voie aussi : `controle-geste-etape` D111 voit des étiquettes « Finances × Tropicaux » qui se chevauchent (le menu du
    « + » ouvert par un toucher du contrôle).
- Autres tests : 23 fichiers du wizard, de PageShell, du « + » et de hopIndexV4 → 289/289. `tsc --noEmit` muet.

## Captures (390 × 844, ×2, regardées)
- `work/missions/2026-10-25-integration-houblons/voies/t12b-finitions/captures/app-repos.png` : « ‹ 3/7 », import et thème ;
  IBU 60, OG 1,066, EBC 70 ; carte Nugget. Un cadre de focus noir entoure le contenu : le wizard est ouvert sans toucher, par
  l'adresse. Une ouverture au doigt ne le montre pas.
- `…/captures/app-bas-suivant.png`, `…/captures/app-suivant-au-bord.png` : au bas de la page, « Suivant — Levure » à gauche, le
  « + » au bout de la même rangée, sans recouvrement.
- `…/captures/app-recette-vide.png` : IBU ? OG ? EBC ?, tous trois hachurés et de même taille ; « levure ? » sans « caractérisée ».
- Avant : `work/missions/2026-10-25-integration-houblons/voies/t12-ma-biere/captures/app-repos.png` (le « + » sur Suivant) et
  `…/w-webapp-testing/captures/dev-03-etape-houblons-citra.png` (OG NaN, IBU 0).

## Ce qui reste
- Bureau (≥ 640 px) : le titre de PageShell (« Modifier « … » » et le sous-titre « Houblons ») n'a pas changé ; seul le
  téléphone est traité.
- Au doigt, le champ « Ajouter — houblon… » est un textarea d'une ligne (Input). Les contrôles qui cherchent `input[...]`
  doivent viser `[placeholder*="houblon"]`.

## Prédiction
« Enfin, le + ne me cache plus Suivant et je n'ai plus de NaN ; garde-moi juste mon clair partout. »

DÉCISION À PRENDRE : G6, ses choix contrôlés sur l'app. Il faut l'une ou l'autre :
- (a) des contrôles en mode app : `existe()` suit le gabarit ; les états sont posés par l'adresse (`&etat=…`) ; les fixtures de
  sa maquette entrent au stock de dev ; la fiche est portée (T13). C'est le chantier T14/T15, hors de ma propriété
  (`work/refonte-frontend/v4/tournoi/outils/`).
- (b) en attendant, G6 joué sur la maquette (même code, `controle-choix.mjs prototypes/houblons-v4/maquettes/parcours`).
Il faut aussi corriger le complément 4 de « comparer » dans le registre (une autre voie).
CONNAISSANCE : Vite ouvert par une adresse qui monte le wizard sans geste met `:focus-visible` sur `<main>` (cadre noir) : à
savoir pour les captures du banc. Le tar de Git Bash lit « C:\… » comme un hôte distant : extraire avec un chemin relatif (cwd).
LEÇON PROPOSÉE : un critère « ses choix sur l'app » (controle-choix --url) se rejoue sur HEAD et sur une page témoin de l'app
avant d'entrer dans les GATES d'une voie d'écran. Ici il était rouge par construction (contrôles et fixtures de maquette), pas
à cause de l'écran (L13 : rejouer chaque critère sur HEAD avant la voie).
