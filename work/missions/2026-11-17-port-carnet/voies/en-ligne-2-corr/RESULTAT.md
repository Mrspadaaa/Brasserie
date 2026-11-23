OK — 8 bloquants corrigés selon D383, 6 anciens tests réécrits, 757 tests verts, build vert, commit bf91d78e1, 18 captures 390

## Reprise du 18.11 (Sonnet) : tout est fait
- Commit `bf91d78e1` (branche claude/port-carnet-1711, worktree port-carnet), 10 fichiers : CarnetsVue, CarteArticle, Comparer, rangement, fixture en-ligne-2, carnetsEnLigne2 et les 4 tests réécrits. Pas de push.
- Tests réécrits sans en sauter un, tous selon D383 (l'IA fait foi ; l'aperçu local est l'attente ou le repli hors ligne ; un toucher du brasseur reste son choix) :
  - `carnetsCorrection3Fil` P8 : Annuler pendant la lecture (aperçu local) ; après l'IA, l'article va dans Ventilation, bandeau « ailleurs », Annuler défait tout ; cas ajouté « IA en panne : l'aperçu local reste ».
  - `carnetsParcours` « Frigo » : pas de carnet neuf, « Rangé dans … Frigo », Annuler rend le Frigo ; ajouts : même phrase hors ligne = carnet neuf ; corr2-L1 : « Carnet créé » pendant l'attente, « ailleurs » après, Annuler rend la liste ; cas hors ligne ajouté.
  - `carnetsOrigineTitre` : l'IA simulée range le critère dans Ventilation, plus de carnet neuf, bandeau sans titre cité ; ajoutés : hors ligne (IA en panne), `horsLigne` déclaré (aucun appel IA), et « corrigé d'un toucher sur Ici : son choix reste ».
  - `carnetsCritique6Fil` n° 1 : attendu lu sur `reponseSimulee` (Prochain brassin neuf, Évier existant) ; n° 2 : genres de `reponseSimulee` ; ajoutés : note en vrac hors ligne, types annoncés hors ligne.
- Un neuvième défaut trouvé en regardant la capture 390 du Comparer : la colonne « 1re » disait « Lien sans aperçu · page non lue » alors que l'article est nommé « Hotte inox 1500 m³/h ». `sansApercu` (Comparer.tsx) renvoie maintenant null pour un article nommé. Capture refaite et ouverte : « Hotte inox 1500 m³/h ».
- Preuves : `npx tsc --noEmit` = 0 ; `vitest run tests/unit/carnets tests/integration/carnets tests/unit/port-q` (+ carnetEnvoiIA, carnetNoteBrute) : 49 fichiers, 757 verts, 1 todo ; `npm run build` = 0 avec `VITE_CARNET_IA=production` (sans lui, check-build-flags dit « VITE_CARNET_IA absent » : le worktree n'a pas de .env ; ce n'est pas un défaut du code).
- Captures : `captures/` à côté de ce fichier, 390 tactile (puppeteer, mobile, touch), clair et sombre : c1 note en vrac, c2 « 80 °C » dans Pompe, c3 « 80 °C » depuis la liste, c4 tuyau silicone dans Pompe, c5 hotte 2 articles et prix, c6 articles nommés, c7 Comparer, c8 champ actif puis carnet ouvert. Ouvertes en image : c7 (avant et après la correction), c5, c1, c3, c4, c8 champ actif, c2 sombre.
- Méthode : banc de capture temporaire (le vrai CarnetsVue, magasin mémoire, appels injectés depuis tests/fixtures/carnets/en-ligne-2 ; clés Firebase factices au build), construit et servi par `vite preview` sur 4179, puis supprimé ; serveur arrêté. L'aperçu `?preview=carnets` n'existe qu'en mode dev et utilise l'IA simulée de l'app, pas la fixture : d'où ce banc. Il n'est pas versé.
- Limites : le repli de 300 ms du cadre Créer reste prouvé par le test et par c8 (cadre encore là après le toucher d'ouverture) ; la réponse de la fixture reste une reconstitution du journal ; hors ligne, la note en vrac affiche « 2 lignes rangées dans 1 carnet » alors que 3 lignes sont annoncées avant (la ligne devenue critère n'est pas comptée dans le bandeau) : défaut d'affichage à verser aux BUGS, non lié à D383.
- DÉCISION À PRENDRE (ci-dessous) : tranchée par D383, option A.

(Ancien état, avant reprise) REPRISE : ce fichier. Agent arrêté vers 175 k jetons de contexte (hook à 200 k).

## Fait (worktree port-carnet, branche claude/port-carnet-1711, rien n'est commité)
Fichiers écrits :
- `tests/fixtures/carnets/en-ligne-2/reponses.json` : les réponses de Gemini du journal, remises dans le schéma de rangerCarnet et lireLien. Le JSON brut n'a pas été journalisé : seuls les champs que le journal nomme y sont. Les ids sont en « @mot », et le raisonnement du modèle dans le champ vendeur est remplacé. Une seule hypothèse, marquée : l'adresse finale galaxus après redirection.
- `tests/unit/carnetsEnLigne2.test.tsx` : 9 cas qui rejouent la fixture. Les appels sont injectés et AiClient est simulé : il lève une erreur si on l'appelle, donc Gemini n'est jamais appelé.
- `src/ui/carnets/CarnetsVue.tsx`, dans `ecrireIA` :
  - Le carnet, la sorte et le critère rendus par l'IA font foi dans les branches cree, vrac et ici.
  - L'annonce locale ne sert que si l'IA ne rend aucun carnet.
  - Les carnets neufs que nomme l'IA prennent le préfixe « ZZ TEST — » quand le message le porte.
  - Un carnet corrigé d'un toucher (`choisi`) prime sur l'IA.
  - Après l'IA, le bandeau suit le rangement final.
  - On revient au carnet ouvert quand le carnet créé pendant l'attente disparaît.
  - Un lien qui n'a pas de page lue après l'IA passe à `illisible` et non plus `a-lire`.
  - Le cadre Créer se replie 300 ms après la perte du focus.
- `src/ui/carnets/rangement.ts` :
  - `prixEcrits` : le prix écrit dans le message est gardé quand l'IA ne le rend pas.
  - `pagesDesLiens` : la page est rattachée à l'adresse collée, car lireLien rend l'adresse finale.
- `src/ui/carnets/CarteArticle.tsx` : un article nommé garde son nom et sa carte normale, même si sa page n'est pas lue.
- `src/ui/carnets/Comparer.tsx` : la liste ARelire affiche le nom de l'article quand il en a un.

## Preuves
- AVANT : carnetsEnLigne2 lancé sur les sources de HEAD (aucune source modifiée à ce moment) : 8 échecs, un par bloquant, avec le défaut vu en ligne.
  - n° 1 : « carnet Fermenteur de l'IA: expected undefined » ;
  - n° 2 et n° 3 : « expected [] to include 'Doit tenir 80 °C au moins' » ;
  - n° 4 : « la note est perdue » ;
  - n° 5 : « [[undefined, undefined], …] to deeply equal [[48900,'CHF'],[32000,'CHF']] » ;
  - n° 6 : « ['a-lire','illisible'] to not include 'a-lire' » ;
  - n° 7 : « not to match /Le tableau naît au 2e article/ » ;
  - n° 8 : « le cadre se replie avant le clic ».
- APRÈS : carnetsEnLigne2 9/9 verts ; `tsc --noEmit` donne 0.
- Suite du carnet (`vitest run tests/unit/carnets tests/integration/carnet`) : 6 échecs, journal dans `$TMP/carnets-vitest2.log`. Tous encodent l'ancienne règle « annoncé = fait », où l'IA simulée range ailleurs que l'annonce locale :
  1. `carnetsCorrection3Fil` P8 « phrase avec lien et prix… Annuler après la fin de l'IA » : l'IA simulée range dans Ventilation, donc aucun carnet neuf et un bandeau « ailleurs ». Le sélecteur `[data-sorte="cree"]` ne trouve plus Annuler.
  2. `carnetsParcours` « une phrase depuis la liste que l'IA rangerait dans le Frigo… c'est un carnet neuf » : c'est exactement l'inverse de la nouvelle règle. La réécrire : elle va dans le Frigo, sans carnet neuf, avec un bandeau ≠ cree.
  3. `carnetsParcours` corr2-L1 « IA lente… Carnet créé tout de suite et après l'IA » : « Carnet créé » reste vrai pendant l'attente ; après l'IA, il faut attendre « ailleurs », n carnets, puis vérifier qu'Annuler rend la liste d'avant.
  4. `carnetsOrigineTitre` « tuyau silicone » dans Ventilation : la nouvelle règle le garde dans Ventilation (c'est le bloquant n° 4), et non plus dans un carnet « Tuyau silicone ».
  5. `carnetsCritique6Fil` n° 1, note en vrac de bout en bout (« Prochain brassin », « Sol local ») : les titres et carnets viennent maintenant de `reponseSimulee`. Il faut les attendre d'après `reponseSimulee(contexteModele(NOTE_1280, …, carnets))`.
  6. `carnetsCritique6Fil` n° 2, « le type annoncé pendant est celui qui s'applique » (D-124) : il est contredit par la règle « la sorte de l'IA fait foi ». Il faut attendre les genres de `reponseSimulee`.

## Reste à faire, dans l'ordre
1. Aligner les 6 tests ci-dessus sur la règle, sans les sauter. Chacun garde son intention (Annuler défait tout, rien n'est perdu, Texte d'origine).
2. Relancer la suite du carnet jusqu'au vert, puis `npm run build`.
3. Captures 390 : `npm run build`, puis `vite preview`, avec l'IA simulée par ces fixtures. Voir la décision ci-dessous.
4. Commit par chemins avec le message « Carnet : le rangement de l'IA fait foi (test en ligne 2) », une ligne vide, puis « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ». Chemins : les 5 sources et les 2 fichiers de test ci-dessus, plus les 6 tests alignés.

## Doutes et limites
- Les réponses sont reconstituées depuis le résumé du journal, pas depuis le JSON brut. Le prochain test en ligne doit journaliser la réponse brute (`window.__ai`) dans un fichier.
- Envoi 10 : avec la page maintenant rattachée, l'article s'appelle « Darlac Ciseaux ». C'est le nom de la page réellement lue : l'id galaxus avait été inventé par le critique.
- Le repli différé de 300 ms est une mesure de temps, pas une preuve tactile. Il faut le revoir à 390 tactile dans Chrome.

DÉCISION À PRENDRE : les anciennes règles « ce que le cadre pendant annonce est ce qui arrive après » (R18, R19, D-124, critique 6 n° 2, critique 7 n° 3) sont remplacées par « le rangement de l'IA fait foi ». Seule exception : un carnet ou une rubrique corrigés d'un toucher restent le choix du brasseur.
- Options : (A) inscrire le remplacement dans REMPLACES et decisions.md, puis aligner les 6 tests ; (B) garder « annoncé = fait » pour l'IA simulée du banc seulement.
- Recommandation : A. Le brief du pilote pose cette règle, et B montrerait au banc un comportement différent de la production.

DEMANDE EXECUTANT (après l'étape 1) :
- Commandes : `npm run build` ; `npx vite preview --port 4179` dans le worktree port-carnet, en mode banc avec les fixtures en-ligne-2.
- Captures 390 tactile, thème clair puis sombre :
  - liste après la note en vrac (2 carnets de l'IA) ;
  - Pompe après « doit tenir 80 °C » et après « tuyau silicone 8 mm, 5 m » ;
  - Hotte avec 2 articles à 489 et 320 CHF, puis son Comparer ;
  - la liste juste après un toucher sur un carnet, champ actif.
- Sortie attendue : chaque capture ouverte, aucun « Lien sans aperçu » ni « lecture… » sur un article nommé.

CONNAISSANCE : `lireLien` rend l'adresse finale après redirection. Galaxus redirige un numéro d'article vers son adresse propre : il faut rattacher la page à l'adresse demandée (`pagesDesLiens`).
LEÇON PROPOSÉE : un test en ligne avec la vraie IA journalise la réponse brute dans un fichier, pas seulement son résumé ; sinon la fixture de rejeu est une reconstitution (L28).
