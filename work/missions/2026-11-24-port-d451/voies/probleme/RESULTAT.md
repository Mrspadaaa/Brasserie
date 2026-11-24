OK — carnet ouvert recomposé : barre d'état, options, fil, Résolu, Relecture, genres ; 64 tests, existants verts, captures à finir.

## Inventaire (maquette → composant)
Base maquettes3/v01, greffe 1 maquettes2/v01 (genres), greffe 2 v05 (avant/après, tuiles), greffe 3 v03 (question « pourquoi », « Toujours le bon choix ? »).

| Écran / élément de la maquette | Composant | État |
|---|---|---|
| Barre de titre : ‹ titre · pastille de catégorie ▾ · ⋯ | `CarnetOuvert` (barre `cnp-tete`), `PastilleCategorie` (EnTeteGenre.tsx) | fait ; un toucher sur la pastille ouvre les 5 domaines (D437) |
| Je cherche · Décidé : barre d'état (jauge 4 pastilles, 4 mots, l'actif coloré) | `BarreEtat.tsx` | fait ; les 4 mots se touchent dans les deux sens, l'état est écrit à côté (K4) |
| Jetons « trouvé n · pas trouvé n · devis · ≈ total » sur une rangée | `RangeeJetons` (OptionsProbleme.tsx) + `resumeJetons` | fait (seulement Noté / Je cherche) ; total seulement si ≥ 2 montants en francs |
| Options en 2 colonnes (photo ou picto, nom entier, jeton d'état) | `OptionsProbleme.tsx` | fait (VERDICT : 50 %, libellés entiers) ; gestes d'une case : piste, veille, retenir, écarter + raison |
| Fil : jour en pastille, plages « 21 – 22 nov. », bulles à droite, jetons, repli « ▴ 4 notes du 3 au 6 nov. » | `FilCarnet.tsx` (`FilCarnetVue`) + `filRegles.ts` | fait |
| Bulle de l'IA à gauche (veille, cartes) | `FilCarnetVue` | fait : veille = « demandée · pas encore relevée » (honnête) |
| Carte « tâche proposée · À faire · Plus tard » | `CartePropositionIA` | fait + Non d'un toucher ; Retenir / Dater / Résoudre / Veiller / « Rattacher à … ? » : « OK · Non » |
| « B retenu · 30 nov. · dans À venir », « humidif. écarté, 2e fois » | jetons (`jetonDe`, `rangsEcart`) | fait ; le « 2e fois » se compte, jamais stocké |
| Question « Pourquoi B plutôt que A ? Tes notes ne le disent pas. · Ajouter » (v03) | `QuestionPourquoi.tsx` | fait ; seulement si `pourquoiDe` rend `null` |
| « Fermer grâce à l'achat ? Oui · Annuler » | `CarteFermerParAchat` | fait ; seulement si le plan est payé ou un jeton « achat » dit l'achat |
| Résolu : avant / après (v05), tampon « Résolu en 27 jours », « Fermé grâce à l'achat… », options fermées avec leur raison, « Rangé : … » | `ResoluProbleme.tsx` | fait ; « Changer » la photo d'avant ou d'après |
| Tuiles « Résolus en 2026 · 5 · le dernier en vert » (photo, sinon picto de la catégorie) | `ResoluProbleme.tsx`, `resolusDe` | fait |
| « ira dans Réalisés » (si plan lié), Rouvrir | `ResoluProbleme.tsx`, `destinationPlan` | fait |
| Relecture : recherche, fiche problème / essayé / pris / pourquoi / durée, avant → après, « Le fil ▸ », « Toujours le bon choix ? », autres résolus par catégorie | `RelectureResolus.tsx`, `QuestionRelu` | fait ; la route est à brancher (voir BRANCHEMENT) |
| Genres (greffe 1) : « mémo · fait le … », « récolte », « idée · vers S10 » | `ChipGenre`, `texteGenre`, `versQuand` | fait (l'en-tête seulement, comme demandé) |
| Champ « Ajouter à <court> … » ancré en bas | ChampCarnet (voie liste, inchangé) | non touché |
| Idée : cartes liées « Houblons citra · à comparer · ≈41 CHF/kg » | — | NON porté : aucun lien entre carnets dans le modèle (voir DÉCISION 3) |

## Ce qui disparaît (PLAN n° 4, 5, 6, 8)
- n° 4 : « Articles · collez un lien » ne paraît que s'il sert (article, choix, genre achat, carnet tout juste créé) ; « Quand » pas pour un problème, un mémo ou une récolte sans date ; « Notes n » en cartes devient le fil (le tout juste créé garde sa maquette g5:v04-4, règle n° 1).
- n° 5 : « votre lien : « https://… » » (CarnetOuvert). Une phrase reste citée « votre phrase : « … » » (R25).
- n° 6 : crayon du titre retiré, « Renommer » reste au menu ⋯ (testé). « Archivé le … » : la pastille dit « Résolu · 20 nov. » (ouvertCalculs.etiquetteStatut).
- n° 8 : la note du Planning est une bulle du fil (`data-planning`), plus une carte (testé : aucun `.cn-note`).
- Assertions d'anciens tests modifiées : 3, dans tests/unit/lot3CarnetOuvert.test.tsx (L-21), chacune avec `// D451 disparaît n° 4` : la région « Notes » devient le fil (« Fil du carnet » / région « Fil »).

## Fichiers écrits
src/ui/carnets : CarnetOuvert.tsx, carnetOuvertTypes.ts, ouvertCalculs.ts, carnets-fil.css (modifiés) ; neufs EnTeteGenre.tsx, FilCarnet.tsx, BarreEtat.tsx, OptionsProbleme.tsx, ResoluProbleme.tsx, RelectureResolus.tsx, QuestionPourquoi.tsx, filRegles.ts. Tests : neufs tests/unit/carnetsProblemeRegles.test.ts (30), carnetsProblemeEcran.test.tsx (34) ; modifié lot3CarnetOuvert.test.tsx. Dossier de voie : banc/ (Vite port 3061, fixture du suivi, gestes sur les intentions du domaine), cap/, logs. RubriqueQuand, CriteresCarnet, FeuilleNote, RenommerCarnet, Photos, histoireCarnet, photo.ts : relus, inchangés (rien à y changer).

## Critères
- tsc : 2 erreurs connues seulement (seedData GanttTask, virtual:pwa-register).
- tests/unit/carnetsProbleme*.test.ts : 2 fichiers, 64 tests verts.
- Rejeu large (carnets*, c48 à c6*, lot3CarnetOuvert, lot11Carnet, virgule-transversale, planning-vers-carnet, port-q4-carnet) : 73 fichiers, 1 706 verts, 3 ignorés (déjà ignorés), après correction de mes deux tests. Avant mon travail, les 13 fichiers qui montent CarnetOuvert : 319 verts.
- `npm run build` : NON rejoué (vite-plugin-pwa absent de node_modules sur ce poste, déjà dit par greffe-p2).
- Banc : `?preview=carnets` (CarnetsPreview, hors Possède) monte CarnetsVue, qui ne passe ni messages ni rappels : il ne montre donc pas le fil. J'ai monté les écrans de la voie sur un banc propre (banc/banc.tsx) : même composants, fixture du suivi, gestes branchés sur le domaine.
- `git status --short` : rien hors Possède de mon fait (les fichiers non suivis de src/asset, src/fermenter, etc. et work/ étaient là avant).

## Captures (ouvertes : a-vapeur, b-resolu, b-ecoulement, c-relecture si présente ; les autres prises, NON ouvertes)
Défauts vus et corrigés : jetons à × permanents (bruit : maintenant deux touchers « Retirer »), fil dans une carte à filets (classe `cn-notes` retirée), ⋯ qui passait à la ligne (pris en coin), total « ≈ 910 CHF » à la ligne à 390 (resserré, à revérifier). Défaut non corrigé : à 390 le titre « ZZ TEST — … » de la fixture passe sur deux lignes (le préfixe est de la fixture).

DEMANDE EXECUTANT :
1. Serveur (si absent) : `npx vite --config work/missions/2026-11-24-port-d451/voies/probleme/banc/vite.banc.config.mjs` depuis la racine (port 3061 ; le premier chargement dure 1 à 3 min).
2. `cd work/missions/2026-11-24-port-d451/voies/probleme/banc` puis `node capturer.mjs f 390 clair` (14 écrans), `node capturer.mjs g 390 sombre resolu,vapeur,ecoulement,relecture`, `node capturer.mjs h 1280 clair vapeur,ecoulement,resolu,relecture`, `node capturer.mjs i 844 clair resolu` (844 × 340 : régler `hauteur` à 340 dans le script).
3. Sorties attendues : une ligne « cap <clé> » par écran, aucune ligne PAGEERROR.
4. Captures à ouvrir : cap/f-fermer, f-co2, f-malt, f-fete, f-assurance, f-recolte, f-ancien, f-planning, f-photo, f-joint (jamais regardées), puis g-* et h-* ; comparer côte à côte avec maquettes3/cap/v01-{vapeur,fuite,resolu,relecture,co2,malt}.png et maquettes2/cap/v01-{memo,recolte,idee}.png.

## BRANCHEMENT (voie liste : CarnetsVue, ecransCarnet, actionsCarnet, useDonneesCarnets)
Props neuves de `CarnetOuvert`, toutes facultatives (absentes : l'écran se lit seulement, aucun bouton mort) :
- `messages: MessageDoc[]` (les messages du magasin), `carnetsDocs: CarnetDoc[]` (tous les carnets, pour les tuiles), `onRelecture: () => void`, `carnetsVers` (déjà là : sert aux titres des cartes « Rattacher à … ? »).
- `rappels: RappelsSuivi` (carnetOuvertTypes.ts) : `onEtat(vers)` → `changerEtat` ; `onRouvrir` → `rouvrir` ; `onOption(faconId, vers, raison?)` → `retenirOption` si `retenue`, sinon `changerOption` ; `onFermerParAchat(optionId)` → `fermerParAchat` ; `onRelu` → `repondreRelu` ; `onAvantApres(avant?, apres?)` → `poserAvantApres` (`undefined` = inchangé, `null` = retirer) ; `onProposition(messageId, index, 'ok' | 'non' | 'plus-tard')` → `accepterPropositionSuivi` / `refuserPropositionSuivi` ; `onEcrire(amorce)` → poser le texte dans le champ et le focaliser (le message reste dans ce carnet) ; `onGenre` → `poserGenre(… origine 'vous')` ; `onRetirerEtiquette(messageId, index)` → `retirerEtiquette` ; `onCocherTache` → `cocherTache`. Chaque geste passe par `appliquer(...)` : son inverse nourrit le Annuler du bandeau.
- `RelectureResolus` : props `carnets`, `messages`, `rappels={{ onRelu(carnetId, reponse) }}`, `onOuvrir(carnetId)`, `requete?` ; route `relecture` à poser dans `useNavigationCarnet` (carnetsTypes `Vue`), avec le champ « Chercher dans les résolus… » en bas. L'écran a sa propre recherche en haut (maquette).
- Le carnet ne prend l'en-tête du genre que si `carnet.genre` est posé (par l'IA ou le menu ⋯) et ≠ achat ; un carnet ancien garde son en-tête (la pastille « Domaine ▾ » reste) : à la liste d'ajouter le geste qui pose le genre sur un ancien carnet (menu ⋯, `onGenre`).
- Carte « Rattacher à … ? » : `onProposition(..., 'ok')` pour `deplacer` : le domaine refuse (`accepterPropositionSuivi`) ; à la liste de déplacer les lignes du message vers `versCarnetId` (`deplacer` d'operations.ts) puis de retirer la carte.

## Essais, doutes, limites
- Aucun critère n'a demandé plus de 3 essais. Tests réécrits : mes deux premiers rouges venaient de mes attentes (plage « 20 – 22 nov. » : trois jours de suite font une plage ; espace fine dans « 1 234,56 »).
- NON joué : aucun geste en navigateur (état, option, Rouvrir, photo, hors ligne, mode avion) ; les gestes sont prouvés par les rappels dans les tests, et par le domaine (voie domaine). À jouer par le pilote en ligne (ZZ TEST) une fois la voie liste branchée. Idem : « écrire dans le champ → le message reste dans ce carnet » (champ et envoi sont de la voie liste ; ma part : `onEcrire` amorce).
- Densité (B5, 70 %) non mesurée sur vraies pièces.
- Clair seulement vu ; le sombre (variables `--p-*` sous `[data-theme='cave']`) est capturé à confirmer (DEMANDE EXECUTANT).
- La jauge peut se lire « étape n sur m » (doute du critique, K4) : l'état reste écrit à côté et c'est lui qu'on touche.
- Les heures des bulles s'affichent seulement quand un jour porte 2 messages ou plus.

DÉCISION À PRENDRE :
1. « Plus tard » d'une tâche proposée : le domaine n'a pas d'option « sans échéance » dans `accepterPropositionSuivi`. Banc : `ajouterTache` sans échéance puis `refuserPropositionSuivi` (deux écritures, un seul Annuler à regrouper). Recommandation : un argument `sansDate?: true` dans `accepterPropositionSuivi` (voie domaine, 3 lignes).
2. « Fermé grâce à l'achat de « Condenseur B » » à la place de « … du condenseur B » (maquette) : le genre d'un nom ne se devine pas, et `avecArticle` (comparer.ts) se trompe (« de la condenseur », « le chambre froide » : son filtre -eur oublie « nseur », FEMININS n'a pas « bre »). Options : garder les guillemets (choisi, sans risque) ou corriger `avecArticle` (autre voie). Recommandation : garder, et corriger comparer.ts pour les autres phrases (« le critère sépare… »).
3. Les cartes liées de l'écran « idée » (maquettes2/v01, « Houblons citra · à comparer ») : le modèle n'a aucun lien carnet à carnet. Options : (A) ne pas porter (choisi) ; (B) un champ `liens: carnetId[]` posé par l'IA ou lui. Recommandation : A tant que le brasseur n'a pas dit qu'il le veut ; si B, une voie domaine.
4. Les options d'un mémo ou d'une idée prennent la grille de jetons (piste, retenu…) : à confirmer sur l'écran « assurance » (non ouvert).

CONNAISSANCE : `comparer.ts` `FEMININS`/`MASCULINS_EN_EUR` lit « condenseur », « chambre froide » au mauvais genre ; un nom d'option ne s'accorde pas, il se cite. `.cn-ouvert :is(span, p, b, …) { font-size: 14px !important }` écrase toute taille : une taille au-dessus de 14 px passe par `.cn-ouvert .cnp-… { … !important }`.
LEÇON PROPOSÉE : aucune.
