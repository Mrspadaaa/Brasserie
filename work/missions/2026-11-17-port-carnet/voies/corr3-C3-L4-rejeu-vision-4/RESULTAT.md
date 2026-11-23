ECHEC — rejeu final non joué (port-carnet bouge : HMR 24 et 38) ; outillage vision-4 prêt, DEMANDE EXECUTANT

Lot C3-L4-rejeu-vision-4, auteur Opus, 18.11. Code de l'app au moment des essais : HEAD `a5ca204b1`, plus 22 fichiers modifiés par les
lots L1 à L3 en cours (`git status` de port-carnet). La consigne place ce rejeu « après L1, L2, L3 ». Pendant mes essais, vite a rechargé
la page 38 fois (essai 1, 390 clair) puis 24 fois (essai 3, 1280 sombre). Un rapport écrit sur ce code serait un faux vert (L11). J'ai donc
corrigé et éprouvé l'outillage par trois essais. Je n'ai pas écrit `vision-4/RAPPORT-m390.md` ni `RAPPORT-d1280.md` : le rejeu final et
ces deux rapports reviennent à l'exécutant Haiku, puis le jugement des captures au critique Opus (R50).

## Fichiers écrits (tous dans `work/missions/2026-11-17-port-carnet/vision-4/`)
Rien n'est écrit dans `src/`, ni dans vision-3, ni dans port-carnet. Aucun build n'a été lancé : `dist` n'est pas touché. Aucun commit.
- `outils.cjs` (repris de vision-3) :
  - `chercher` / `appuyer(role, nom)` : équivalent de `getByRole`. Rôle explicite ou implicite, nom accessible (aria-label,
    labelledby, label, sinon texte visible sans les icônes `aria-hidden`), visible et non désactivé.
  - Le nœud est cherché à nouveau juste avant chaque toucher : aucun handle n'est gardé d'un geste à l'autre. Le point touché est
    vérifié avec `elementFromPoint`. S'il est couvert, le script fait un clic DOM avec focus et l'écrit au journal.
  - `attendreTexte` et `attendreSel` attendent un état au lieu d'un délai.
  - `ouvrirMenu` lit `aria-expanded` avant de toucher. En vision-3, `button[aria-expanded]` index 0 visait « Plus » et refermait le
    menu : d'où les échecs 38 et 49.
  - `champ` vérifie le focus.
  - `vider` passe par Ctrl+A puis Retour arrière, pour que React voie l'événement : c'était la cause de 05 en 390.
  - Toute requête hors de 127.0.0.1 ou localhost est coupée.
  - SpeechRecognition factice injecté : la dictée « entend » « ZZ TEST — deux bacs de rinçage ».
  - Chaque état écrit ses textes attendus sous la forme `présent « … » : oui/NON`.
- `rejeu-banc.cjs` : les adresses de la fixture viennent de l'en-tête de `CarnetsPreview.tsx` :
  - liens `exemple.invalid` ;
  - `&adr=1` pour 29 ; `&lien-retient=a-venir` pour 55, 38 et 49 ; `&lien-retient=realise` pour 50 ; `&realise=1` pour 31b et 50b ;
    `&articles=1` et `&articles=2` pour 52.

  Un 5e argument facultatif restreint le rejeu à une liste d'états.
- `reprise.cjs` : il lance rejeu-banc pour une liste d'états. `lancer.sh` (ports 60425 et 60426, garde de 60 s, compte HMR) accepte
  `ETATS=…`.
- `rejeu-devlocal.cjs` : il joue 47, 46, 48, **39** (390 seulement), 30, 55, **31**, 49, 56 et 57, puis le retrait des données.
- `emu/` : copie de vision-3 (règles ouvertes, émulateur seul).
- `essai-auteur/` : les trois essais (`essai1`, `essai2`, `essai3`) et `test-regex.cjs`. Ce n'est pas vision-4 : le code bougeait.

## Problème → fait → preuve
1. **d1280, 10 gestes en ECHEC** (12b, 28, 29, 35b, 35c, 49, 49b, 50, 52d, 55c) → **8 sur 10 sont réparés.**
   - Réparés : 28, 29, 35b, 49, 49b, 50, 52d, 55c.
     - 28 : la zone de saisie de `.cn-choisir-cadre` ; « Pourquoi ce choix » est une section de la vue Choisi.
     - 29 : la ligne « Choisi : … Pourquoi › », puis `<details>` « Choix d'avant ».
     - 49 et 50 : par leurs fixtures, avec le menu ouvert sans bascule.
     - 52d : « Écarter » se trouve dans Choisir, pas dans Comparer.
   - Restent 2, et le défaut est dans l'app, pas dans le script :
     - **12b** : `CadreArrivee` rend « Garder à part » si on lui passe `doublon`, mais aucun appelant ne le passe (grep `onGarderAPart` :
       CadreArrivee seul). G11 est donc injoignable.
     - **35c** : après « Annuler », la note revient, mais « Note supprimée · Annuler » reste affiché après 5 s. Capture **ouverte** :
       `essai-auteur/essai3/m390-sombre-reprise-35c-note-supprimee-annulee.png`.
   - Preuve : `essai3/erreurs-m390-sombre-reprise.txt` ne contient que 12, 12b et 35c.
2. **m390 non atteints** (05, 12b, 20, 30b, 33, 35b, 38, 40b, 49, 50) → **tous sont atteints, sauf 12b (app).**
   - Au journal de l'essai 3 :
     - 20 : « Rangé dans » présent ;
     - 38 : « 1 lien le retient » présent ;
     - 40b : ✕ « Arrêter l'IA » ;
     - 30b : segment « À venir » lu avec son compte (regex testée par `test-regex.cjs` : REGEX OK).
   - **33** : la feuille s'ouvre. Mais aucune note de Ventilation ne ressemble à un critère, donc G25 ne paraît pas : il manque une
     fixture (voir DÉCISION).
   - Captures **ouvertes** : `essai2/m390-clair-reprise-29-choix-revu.png` (avant le correctif) et
     `essai1/m390-clair-35-supprimer-note-menu.png`.
3. **11b mal nommé** → l'état s'appelle maintenant `13b-texte-apres-range-g9` (13 sur Évier).
4. **18 capturé avant la fin de la lecture** → le script attend le départ de « lecture de la page », puis la carte « Hotte inox 140 »,
   et la centre.
5. **40 capturé trop tard** → capture à 300 ms en `&ia=lent`. Capture **ouverte** : `essai1/m390-clair-40-ia-en-cours.png`, avec
   « ✻ L'IA range… », ••• et ✕.
6. **États dev-local non joués** (31, 46, 47, 48, 56, 57, et 39) → joués en 390 clair : **0 ECHEC, HMR 0, 0 port resté ouvert**
   (`essai3/essai3-devlocal.out`).
   - 46 : « Nouvelle idée » présent.
   - 56 : « Noter une idée en S47 » présent.
   - 57b : le carnet « ZZ TEST — idée du calendrier S47 » s'ouvre.
   - 39 : champ visible. Capture **ouverte** : `essai3/m390-clair-devlocal-39-clavier-300px.png`.
7. **53 hors banc** → page de la voie E capturée deux fois : en vue, et en pleine page (`essai1/m390-clair-53-page-voie-E*.png`, non
   ouvertes).
8. **Captures sombres presque jamais ouvertes ; 26 et 46 non ouvertes** → **non fait** : cela demande le rejeu final. J'ai ouvert 2
   captures sombres d'essai.
   - 35c (point 1).
   - `essai3/m390-sombre-reprise-26b-article-veille-allumee.png` : bascule allumée, « demandée · pas encore relevée », aucune date.
     Le script choisit maintenant un article à veille éteinte, et 26a montre celui que la fixture a déjà allumé.
9. **`vite preview` ne sert pas le banc** → c'est dit ici et en tête de `lancer.sh` : le banc est DEV seulement, il se joue sur
   `vite` dev.

Ajouts trouvés en route :
- 44 : la photo est d'abord « jointe » au champ, puis « Ajouter » la range. 44 montre la photo jointe, 44b la vignette « Photo, non
  lue ».
- 45 : la dictée factice est démarrée 1 fois et sa phrase est posée dans le champ.
- 17, 17b, 20, 19 : la fixture n'a aucun carnet de pompe. Le 1er lien crée le carnet, le 2e y est rangé (G21), puis le tableau naît.
- 1280 : en 05 et 13, le toucher ne donnait pas le focus au champ (point couvert). Le focus est maintenant vérifié et posé.

## Sorties décisives
- `node --check` : les 4 scripts sont OK. `node essai-auteur/test-regex.cjs` → `REGEX OK`.
- Essai 3, banc 390 sombre : 66 captures, 3 ECHEC (12, 12b, 35c), HMR 0.
- Essai 3, banc 1280 sombre : 6 ECHEC, **HMR 24**. 13, 44b et 45 sont tombés pendant les rechargements : ils sont à rejuger au rejeu
  final.
- Dev-local 390 clair : 35 captures, 0 ECHEC, HMR 0, `PORTS OUVERTS : 0`.
- Essais utilisés : 3.

## DEMANDE EXECUTANT
À lancer quand les lots L1 à L3 sont fusionnés et que port-carnet ne bouge plus. Git Bash, depuis
`work/missions/2026-11-17-port-carnet/vision-4/` :
1. `bash lancer.sh tout`. C'est la garde de 60 s, puis le banc (390 et 1280, clair et sombre), puis dev-local (mêmes 4 passes).
   - Attendu : `GARDE OK`, chaque `HMR … : 0`, `PORTS OUVERTS (60425, 60426, 8080) : 0`, `FIN`.
   - Si la garde échoue : attendre, puis relancer une fois. Ne jamais forcer `SANS_GARDE`.
2. Résultats JSON attendus :
   - banc : `echecsAction` ≤ 3 par passe (12 et 12b tant que G11 n'est pas branché ; 35c tant que le bandeau reste) ;
   - dev-local : `echecsAction` 0 ;
   - 1280 dev-local : pas de 39 (390 seulement).
3. Un état en ECHEC hors de cette liste : `ETATS=<n,…> bash lancer.sh banc`, une seule fois. Puis écrire l'échec tel quel.
4. Écrire `RAPPORT-m390.md` et `RAPPORT-d1280.md` au format de `vision-3/RAPPORT-d1280.md`, avec ces colonnes : état (n° du §
   Vérification) → fichier clair (sombre) → ce qui se voit → agit → ouvert (clair oui/non, sombre oui/non).
   - Chaque capture citée comme conforme est **ouverte**, dans les deux thèmes.
   - Pour chaque état, recopier du journal les lignes `présent … : NON`, `absent attendu … : NON` et `ECHEC`.
   - Les fichiers dev-local s'appellent `<m390|d1280>-<thème>-devlocal-*`.
5. Ne pas juger : la liste « combien et quels problèmes ? » revient au critique Opus.

## DÉCISION À PRENDRE
- **G11 « Garder à part » (12, 12b) n'est pas branché.**
  - Options : (a) L1 passe `doublon` au cadre depuis CarnetsVue (`notesEnDouble`) ; (b) retirer G11 des états attendus.
  - Recommandation : (a). C'est une aide retenue, et le libellé existe déjà.
- **G25 (33) n'apparaît sur aucune note de la fixture.**
  - Options : (a) ajouter à Ventilation une note qui ressemble à un critère ; (b) la créer pendant le rejeu.
  - Recommandation : (a), par L1 (fixture).
- **35c : le bandeau « Note supprimée · Annuler » reste après Annuler**, alors que la note est revenue. C'est à confirmer par le
  critique, puis à corriger par L1 ou L2.
- **36b : « Déplacer » (G35) n'apparaît pas sur Ventilation** : il demande un carnet proche (`p.proche`). Sans fixture qui en a un,
  l'état n'est pas montrable.

CONNAISSANCE : au banc du carnet, le libellé « Pourquoi ce choix » est une section de la vue Choisi : la saisie est
`.cn-choisir-cadre textarea`. « Choix d'avant » est un `<details>` de la vue Choisi. Les segments ont pour nom « À venir2 » (texte
collé, sans espace) : il faut les viser par `^nom ?\d*$`.

LEÇON PROPOSÉE : un rejeu par script vise par rôle et nom, lit `aria-expanded` avant de toucher un menu, et vérifie qu'un état attendu
existe dans le code (grep de son appelant) avant de compter un ECHEC comme défaut du script. En vision-3, 12b passait pour un sélecteur
raté ; c'était un geste non branché.
