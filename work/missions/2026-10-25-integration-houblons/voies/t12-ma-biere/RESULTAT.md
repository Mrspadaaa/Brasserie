OK — étape 3 du wizard, drapeau hopV4 : son écran choisi, une seule copie, joué côte à côte

## Fichiers écrits
- `src/ui/hopIndex/maBiere/` (git mv depuis `prototypes/houblons-v4/parcours/src/ecrans/ma-biere/`) : `index.tsx` (scindé : `EtapeHoublonsContenu`,
  le contenu commun ; `MaBiere`, la page de la maquette sous sa coquille), `Ajouter`, `Base`, `Carte`, `Frise`, `LegendeGroupe`, `Lentille`,
  `RadarBiere`, `legende-bande`, `rail.ts`, `repere.ts`, `ma-biere.css`, `rail.css` ; `briques.tsx` et `gestesFiche.ts` (git mv depuis `ecrans/fiche/`).
  Neufs : `hote.tsx` (ce que l'écran demande à qui le monte : recette, route, aller/ouvrir, gestes, glisser, commandes d'en-tête), `commun.ts`,
  `EtapeHoublons.tsx` (l'hôte de l'app), `theme-app.css` (jetons « cave » en canaux RGB, sur le conteneur de l'étape seulement).
- `src/ui/hopIndex/parcours/` (git mv) : `adaptateur.ts` (← `moteur/index.ts`), `donnees.ts`, `mesure.ts`, `v4.ts`, `types.ts`, `visee.ts`, `quand.ts`,
  `operations.ts` ; neuf : `conditions.ts` (← `CONDITIONS` de `donnees/cas.ts`). `donnees.ts` : la dégustation par défaut est `null` ; la maquette
  y pose sa fixture S1 par `poserDegustationParDefaut` (depuis son `moteur/donnees.ts`).
- `src/ui/hopIndex/ouvrirCouche.ts` (neuf) et `devHook.ts` : la pile de l'app est posée pour les écrans montés dessous (l'étape ouvre les outils).
- `src/pages/BrewWizard.tsx` : étape 3, `hopV4Actif && <EtapeHoublonsV4 … onChange={applyHopV4Change}/>`, sinon l'atelier V5.5 inchangé ; chunk
  demandé à l'ouverture du wizard (drapeau allumé) ; la barre Grain/OG/IBU/EBC du wizard cachée à l'étape 3 drapeau allumé (son bandeau la remplace).
- Maquette : modules réexportant `@app/…` (`moteur/index.ts`, `donnees.ts`, `mesure.ts`, `v4.ts`, `etat/{types,visee,quand,operations}.ts`,
  `ecrans/fiche/{briques,gestes}.ts`) ; `integration/hoteMaBiere.tsx` (hôte de la maquette) ; `coquille/Coquille.tsx`, `donnees/cas.ts`,
  `ecrans/{biere,substituer,suggerer}` (chemins d'import).
- `tests/unit/hopIndexV4/etapeHoublons.test.tsx` (5 tests).

## Côte à côte
Chrome 390 × 844, tactile, ×2. Maquette : `prototypes/houblons-v4/maquettes/parcours/ma-biere/etat.html` (capturée AVANT tout changement ;
recapturée après le déménagement : les six PNG sont identiques octet pour octet). App : `npm run dev` avec `VITE_HOP_V4=on`, `?dev-local`, recette
de la maquette posée dans le stockage local de dev (Stout export 16D, 20 L, OG 1,066, EBC 70, Nugget 46 g à 60′, α du lot 13 %), ouverte par
Recettes › Modifier › Houblons ; un contexte neuf par état.

| État | Maquette | App |
|---|---|---|
| repos | `work/missions/2026-10-25-integration-houblons/voies/t12-ma-biere/captures/maquette-repos.png` | `work/missions/2026-10-25-integration-houblons/voies/t12-ma-biere/captures/app-repos.png` |
| dose + | `work/missions/2026-10-25-integration-houblons/voies/t12-ma-biere/captures/maquette-dose-plus.png` | `work/missions/2026-10-25-integration-houblons/voies/t12-ma-biere/captures/app-dose-plus.png` |
| retirer | `work/missions/2026-10-25-integration-houblons/voies/t12-ma-biere/captures/maquette-retirer.png` | `work/missions/2026-10-25-integration-houblons/voies/t12-ma-biere/captures/app-retirer.png` |
| champ Ajouter (« Cit ») | `work/missions/2026-10-25-integration-houblons/voies/t12-ma-biere/captures/maquette-ajouter.png` | `work/missions/2026-10-25-integration-houblons/voies/t12-ma-biere/captures/app-ajouter.png` |
| profil | `work/missions/2026-10-25-integration-houblons/voies/t12-ma-biere/captures/maquette-profil.png` | `work/missions/2026-10-25-integration-houblons/voies/t12-ma-biere/captures/app-profil.png` |
| glisser du rail (doigt tenu, 60′ → 35′) | `work/missions/2026-10-25-integration-houblons/voies/t12-ma-biere/captures/maquette-glisser.png` | `work/missions/2026-10-25-integration-houblons/voies/t12-ma-biere/captures/app-glisser.png` |

Mêmes nombres là où les données sont les mêmes : IBU 60 → 62 (+2) et 46 → 48 g au « + », pastille 60′ → 35′ au glisser, crans 45′/30′ et
graduations, 12 familles en deux colonnes, « Ouvrir l'analyse de ma bière ». Sortie du rail : 52 ms (app) et 58 ms (maquette), mesurées
touchEnd + 50 ms d'attente fixe, donc ≤ 2 ms de travail.

## Écarts
1. **Thème** : l'app est « cave » (sombre), sa maquette « clair » (D106). Le thème de toute l'app est son choix ouvert (B7, #144) : pas tranché
   ici. Conséquences visibles : fonds, « Au style » paille au lieu de noir, « + » des ajouts rapides blanc au lieu de noir, rail et cartes sombres.
2. **En-tête** : celui du wizard (« ‹ Houblons 3/7 », brouillon) au lieu de la coquille de la maquette (thème, Recommencer). Il avait dit « Text
   header inutile » sur « Houblons 3/7 » de la maquette (24.10) ; l'en-tête du wizard vaut pour les sept étapes, pas changé ici.
3. **Données** (honnêtes, pas des défauts d'écran) : sans dégustation de cette recette dans l'app, l'alerte dit « Au style » et le signal
   « floral 2/4 » au lieu de « Boisé et résineux trop marqué » et « résine 2/4 » (sa fixture S1) ; le stock de dev n'a pas de Nugget : α en plage
   variétale « 9,5–16 % » au lieu de « 13 % » (l'IBU, lui, prend l'α du lot de la recette : 60 IBU des deux côtés) ; ajouts rapides tirés du stock
   de dev (Saaz Late seul, Citra au lieu de Citra cryo).
4. **Mot du wizard** : après un geste, « Brouillon conservé sur cet appareil. · Abandonner » au-dessus du bandeau (notice du wizard, existante).
5. **Bouton flottant « + »** de l'app (coin bas droit) sur « Suivant — Levure » : chrome de l'app, existant, pas propre à l'étape.
6. **Drapeau éteint** (défaut) : joué dans Chrome, l'étape 3 reste l'atelier V5.5 et la barre Grain/OG/IBU/EBC (`work/missions/2026-10-25-integration-houblons/voies/t12-ma-biere/captures/app-drapeau-eteint.png`, hors tableau).
7. **Fiche** : l'appui long sur un nom n'ouvre rien dans l'app (la fiche n'est pas une couche de la pile ; sa feuille reste à porter, T13/T15).
   Suggérer, Substituer, Dryhopper, Levure et l'analyse s'ouvrent par la pile sur la couche provisoire (HopToolLayer).
8. **Glisser** : l'app écrit le brouillon une fois, 400 ms après le dernier cran (la maquette met son état à chaque cran) ; même rendu pendant.

## Critères
- G1 `node work/missions/2026-10-25-integration-houblons/voies/t12-ma-biere/verifier.mjs` → `MA-BIERE-APP OK` (1er essai ; tests de l'étape 5/5,
  build vert, démarrage 919 ko gzip, inchangé). L'étape est un chunk à part (`EtapeHoublons-*.js`), hors du démarrage. B1/B2 de
  check-hop-budget restent DÉPASSÉS comme avant (B2 773 ko).
- Tests hors critère : `vitest run prototypes/houblons-v4/tests tests/unit/hopIndexV4` → 24 fichiers, 270/270 (au 1er passage, 6 fichiers
  rouges : l'alias `@app` n'existe pas dans le Vitest de la racine ; les modules relais de la maquette importent désormais par chemins relatifs).
  `verifier-types.mjs` → TYPES OK ; `tsc --noEmit` de l'app sans sortie.
- Batterie sur la construction d'après le déménagement (`--sans-construire`) → `BATTERIE OK 45/45` ; maquette recapturée : 6/6 PNG identiques
  octet pour octet à ceux d'avant tout changement.
- G2 `batterie.mjs` (avec construction) → `BATTERIE OK 46/46` (1er essai).
- G3 `controle-etats.mjs prototypes/houblons-v4/maquettes/parcours` → `ETATS OK (141/141) ; 13 voulu(s) non rejoué(s)`.
- G4 `controle-choix.mjs prototypes/houblons-v4/maquettes/parcours --ecran=etape-houblons` → `CHOIX OK (1 écran(s) conforme(s) à son choix ; 0 ouvert(s))`.
- `controle-choix.mjs --url=<l'app servie>` : NON JOUÉ, impossible en l'état. Le mode --url lit `<adresse>/<route>/etat.html` (pages de la
  maquette, état posé par la page). L'app n'a aucune adresse qui ouvre le wizard à l'étape 3 sur une recette de fixture : il manque un passage
  (`?dev-local&apercu=etape-houblons` : recette posée, drapeau allumé ; dans App.tsx, hors de ma propriété) et un `--gabarit` qui y mène. Les
  repères de l'étape sont présents à l'identique dans l'app (même code) : `data-ecran="ma-biere"`, `data-element="etape-*"`, `data-role`, `data-etat`.

## Prédiction
« C'est bien mon écran, mais dans le noir : je veux mon clair » (le thème, B7).

DÉCISION À PRENDRE : (1) le thème de l'étape dans l'app : cave (fait, réversible) ou son clair (B7, #144) ; les captures ci-dessus le lui montrent.
(2) L'en-tête du wizard « ‹ Houblons 3/7 », qu'il a dit inutile sur sa maquette : à reprendre pour tout le wizard ou non.
(3) La pile est posée pour l'étape par `useHopPileDevHook` (`ouvrirCouche.ts`, seul point d'App.tsx atteignable depuis ma propriété) : à remplacer
par une prop explicite du wizard quand App.tsx sera repris.
CONNAISSANCE : un écran de la maquette passe dans l'app sans copie par un « hôte » (contexte React : recette, route, gestes, ouvrir, glisser) ;
la maquette et l'app en fournissent chacune un, l'écran ne lit rien d'autre. Ses classes lisent des jetons `rgb(var(--cave-*))` que l'app ne
définit pas : à poser sur le conteneur (theme-app.css), sinon cartes, rail et pastilles disparaissent (vu dans Chrome). Le serveur Vite recharge
toute page ouverte quand une autre voie écrit dans work/ : une capture jouée coupe son HMR. Les captures de `work/missions/**/captures/` sont
ignorées par Git (.gitignore:107).
LEÇON PROPOSÉE : aucune
