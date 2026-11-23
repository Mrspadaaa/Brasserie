OK — bloquants 5 à 8 prouvés en capture 390 ouverte ; n° 8 tenu dans l'app

# Tour 3 (18.11, auteur Opus) : fin du correctif

Aucun code changé ce tour : les corrections du tour 2 (359d88200) tiennent en vrai rendu, et le n° 8 n'est pas un défaut de l'app.
Rien à committer dans `port-carnet` (`git status --short` : seul `source4-portable-bundle-manifest-01.json`, interdit, pas touché).
Les captures et ce fichier vivent dans le worktree `Brasserie` : au pilote de les committer avec la mission.

## Méthode de rendu
`?preview=carnets` et `?dev-local` n'existent que si `import.meta.env.DEV` (main.tsx l. 28, App.tsx l. 140) : `npm run build` les
retire. Donc : `NODE_ENV=development npx vite build --mode development --outDir <scratchpad>/dist-carnet-dev` (variables
VITE_FIREBASE_* factices, exit 0, 1 min 3 s), puis `npx vite preview --outDir … --port 5447 --strictPort`, script `cap7.mjs`
(scratchpad) étendu d'un état `app`. Serveur arrêté (`taskkill`, port 5447 libre), build de banc effacé. Gemini jamais appelé.

## Captures 390 tactiles, ouvertes (dossier `voies/chir7/`)
- `m390-5-fiche-realise.png` : fiche Embouteillage, pastille « Réalisés · ZZ TEST — Embouteillage », ligne « Réalisé, payé le
  16 nov. », segment Réalisés 1. Aucun « Dans À venir ». Sortie : `REALISE REALISE OK A-VENIR ABSENT`. **5 tenu.**
- `m390-6-pourquoi.png` : Choisir, Pourquoi « Le plus gros débit des deux à tenir 80 °C ; en stock, Inox Broye (CH). »
  (Ventilateur écarté avec sa raison). **6 tenu.**
- `m390-7-lien-rang.png` : bandeau « ✓ Article rangé ici, à l'instant · 1er sur 5 · tient 80 °C oui · Annuler » sur la Hotte
  140 cm ; le tableau en dessous la montre devant la 120 cm (2) et la murale (3). **7 tenu.**
- `m390-8-app-carnets.png` (et `m390-8-app-accueil.png`) : app en `/?dev-local`, données vides, Stocks › Matériel › Carnets :
  en-tête « L'Affinée · Nov. · recherche · G A », segment Stocks « Articles · Courses · Fûts · Matériel · Houblons », sous-segment
  « Parc · À venir 2 · Carnets 0 · Réalisés 0 », barre du bas. Sortie : `APP ENTETE OK SEGMENT OK`. **8 tenu** : l'absence vue par
  la critique 7 venait du banc `?preview=carnets` (bandeau « Banc — données simulées »), pas de l'app.
- `AUCUNE PAGEERROR` sur les quatre parcours.

## Contrôles (tour 3)
- `npx tsc --noEmit` : exit 0, 0 erreur.
- `npx vitest run tests/unit/carnets tests/unit/port-q tests/integration/carnet` : 46 fichiers, 726 verts, 1 todo.
- `npm run build` : exit 0, trois lignes « DRAPEAUX OK ».

## Limites (tour 3)
- n° 2 (ligne unique à virgules) : décision du pilote, gênant versé au registre, non traité ici ; le `it.todo` reste.
- « À venir 2 » en données vides (capture 8) : compte venu du stockage local du navigateur de banc ou d'un exemple ; non creusé,
  à regarder par le critique s'il paraît en ligne.
- 6 : la feuille « Pourquoi › » ouverte n'est pas capturée ; la phrase est celle du champ pré-rempli de Choisir.

---

# Tours 1 et 2 (historique)

ECHEC — corrigés 3/5 (5, 6, 7) en code et tests ; captures 5 à 7, n° 8 et limite du 2 restent

# Correctif chirurgical, critique 7, suite (18.11), auteur Opus

Worktree `port-carnet`, branche `claude/port-carnet-1711`. Tour 1 : commit 3b8a319bb (bloquants 1 à 4). Tour 2 : commit
**359d88200** « Port carnet : correctif chirurgical, suite (critique 7) », par chemins. IA simulée seulement ; Gemini jamais appelé.
Serveur vite 5437 lancé puis arrêté par moi (port libre à la fin).

## Captures du tour 1, ouvertes ce tour
- `m390-3-critere-apres.png` : « Critère : 2 bacs · de votre phrase, puis assez profond pour un fût · proposé par l'IA », « ✓ Rangé
  ici, à l'instant · Annuler », la phrase rangée en critère « sans valeur à comparer ». Juste.
- `d1280-4-frigo-colonne.png` : « amb. max °C » au-dessus de 43, 38, 30 ; m³/h et CHF intacts. Juste.

## Fichiers écrits (tour 2)
- `src/domain/carnets/operations.ts` : `etatSortie` (règle `estRealise`, date de la dernière facture ; aucune date inventée).
- `src/ui/carnets/EtatIA.tsx` : `SortieV`, `texteSortie` (« Dans À venir depuis le 15 nov. » ou « Réalisé, payé le 16 nov. »).
- `src/ui/carnets/CarnetOuvert.tsx`, `ListeCarnets.tsx`, `Choisir.tsx` : les trois lignes lisent `texteSortie`. `RangeeV.rang`, passé à
  la ligne rangée d'un article.
- `src/ui/carnets/CarnetsVue.tsx` : `sortieV`, `enV`, `voirSortie` ; prop `onVoirRealises` (« Voir » d'un plan payé ouvre Réalisés).
- `src/components/tabs/StocksTab.tsx`, `src/design/CarnetsPreview.tsx` : `onVoirRealises` branché.
- `src/domain/carnets/comparer.ts` : branche du pourquoi « plusieurs tiennent le critère ».
- `tests/unit/carnetsCritique7Suite.test.tsx` (12 tests, 1 todo) ; `carnetsCritique4Decider` et `carnetsCritique6Decider` : la
  phrase fausse attendue remplacée par la vraie.

## Bloquant → cause → fait → preuve
5. **Embouteillage en trois états.** Capture 30 (390) venait du scénario par défaut, où Embouteillage est choisi sans être envoyé :
   « Choisis, pas encore dans À venir » y est juste. Le vrai défaut, en `&realise=1` : la fiche, la liste et Choisir disaient « Dans
   À venir depuis le 15 nov. » d'un plan payé. → `etatSortie` les gouverne ; « Voir » ouvre Réalisés. Test : « Réalisé, payé le
   16 nov. », jamais « À venir » ; Frigo reste « Dans À venir depuis le 16 nov. ». **Capture non prise** (voir Limites).
6. **Pourquoi faux.** La branche « critère tenu + meilleur chiffre » disait « la seule à tenir 80 °C avec le plus gros débit » même
   quand deux articles tiennent 80 °C. → « Le plus gros débit des deux à tenir 80 °C ; en stock, Inox Broye (CH). » (compte en
   lettres, le test n° 21 refuse les chiffres recopiés). Face à un extracteur qui ne tient pas : « La seule à tenir 80 °C ; … »
   (test). **Capture non prise.**
7. **Dépôt d'un lien sans rang.** `rangDuLien` calculait le rang depuis la critique 6, mais `RangeeV` n'avait pas le champ et la
   ligne rangée d'un article ne le recevait pas. → Test de rendu : « Article rangé ici, dans Hotte inox + extracteur · 2e de sa façon,
   après Hotte inox 120 cm + moteur ». **Capture non prise.**
8. **En-tête L'Affinée et segment Stocks en `/?dev-local`.** Non vérifié (plafond de contexte).
2. **Limite (ligne unique à virgules).** Constat : l'IA simulée ne met pas « Tient 80 °C » chez les levures ; elle range toute la
   ligne, levures comprises, dans un carnet neuf « Ventilation de la salle de brassage » (test vert, plus un `it.todo`). Non vérifié :
   à la création depuis la liste, l'app tient la cible du carnet créé (`CarnetsVue`, `definitif`) ; le carnet « Sachets de levure x2… »
   peut encore recevoir le critère par ce chemin. Rien n'est corrigé ici.

## Contrôles
- `npx tsc --noEmit` : aucune erreur.
- `npx vitest run tests/unit/carnets tests/unit/port-q tests/integration/carnet` : 46 fichiers, **726 tests verts, 1 todo**, au
  premier passage après correction (un essai pour le test de rendu : il manquait `// @vitest-environment jsdom`).
- `npm run build` : exit 0, « DRAPEAUX OK » (2 lignes).
- `git status --short` après le commit : seul `source4-portable-bundle-manifest-01.json` (interdit, pas touché).

## Limites
- Captures 5, 6, 7 : le script tournait encore sans image après 13 minutes. Vite signale à l'optimisation des dépendances
  « could not be resolved : @app/ui/SegmentedControl… » (importés par `prototypes/houblons-v4/parcours`). Le tour 1 avait lancé vite
  avec `--force`, pas moi. Script arrêté, serveur arrêté.
- 6 : « des deux » ne vaut que pour un groupe de 2 à 10 ; au-delà, chiffre.

## DEMANDE EXECUTANT
```
cd /c/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet
VITE_FIREBASE_API_KEY=banc-fictif VITE_FIREBASE_AUTH_DOMAIN=banc.local VITE_FIREBASE_PROJECT_ID=demo-banc \
VITE_FIREBASE_STORAGE_BUCKET=demo-banc.appspot.com VITE_FIREBASE_MESSAGING_SENDER_ID=0 VITE_FIREBASE_APP_ID=1:0:web:0 \
  npx vite --port 5437 --strictPort --force > $TEMP/vite7d.log 2>&1 &
node C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/cap7.mjs 5437 realise,pourquoi,rang
```
Fichiers attendus dans `voies/chir7/` : `m390-5-fiche-realise.png`, `m390-6-pourquoi.png`, `m390-7-lien-rang.png`.
Sorties attendues : `REALISE REALISE OK A-VENIR ABSENT` ; `POURQUOI Le plus gros débit des deux à tenir 80 °C…` ; `RANG ✓ Article
rangé ici … · 1er sur …` (ou « … de sa façon … ») ; `AUCUNE PAGEERROR`. Les trois images reviennent au pilote, ouvertes.
Puis n° 8 : `http://localhost:5437/?dev-local`, Stocks › Matériel › Carnets, capture 390 tactile : en-tête L'Affinée et sous-segment
« À venir · Carnets · Réalisés » visibles ou non. Arrêter le serveur.

## REPRISE
Partir de 359d88200. Ordre : captures 5 à 7 (demande ci-dessus), n° 8, puis la limite du 2 par le chemin de création
(`CarnetsVue`, `definitif` et `ecrireIA` : que reçoit le carnet créé « Sachets de levure x2… » quand l'IA rend un critère « Tient
80 °C » pour un `carnetNeuf` différent ?). Le `it.todo` de `carnetsCritique7Suite.test.tsx` est le test à remplir.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : une phrase « la seule à X avec le plus Y » se lit « la seule à X », même quand le calcul voulait dire « parmi celles
qui font X, le plus Y » : le compte du groupe doit être dit.
LEÇON PROPOSÉE : un champ calculé dans une vue (ici `rang`) se prouve par un test de rendu de l'écran qui l'affiche, pas par un test
de la fonction : le calcul existait depuis la critique 6, le type qui le portait l'avait perdu.

## Tour 3
DÉCISION À PRENDRE : aucune.
CONNAISSANCE : `?preview=…` et `?dev-local` disparaissent du build de production (verrou `import.meta.env.DEV`) ; pour un banc servi par `vite preview` sans le dev server, construire avec `NODE_ENV=development vite build --mode development --outDir <tmp>`.
LEÇON PROPOSÉE : une absence vue sur un banc isolé (`?preview=`) se vérifie dans l'app (`?dev-local`) avant de compter comme défaut : le n° 8 était un artefact du banc.
