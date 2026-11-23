OK — créer, note en vrac et lien tiennent l'annonce du cadre ; préfixe ZZ TEST gardé

Lot corr2-L1-fil-rangement, correction 2 du port du carnet (18.11). Worktree `port-carnet`, branche `claude/port-carnet-1711`, sans commit.
CRITIQUE-2.md absent : les numéros viennent de vision-2 (d1280-n, m390-n) et de corr1-L4 (L4-n).
Règle appliquée, tirée du brief : **ce que le cadre « pendant » annonce est ce qui arrive après**. L'IA met en forme. Elle ne range
ailleurs que si le cadre l'a dit (lien seul : « dans le carnet qui en parle, sinon dans un nouveau »).

## Fichiers écrits (tous dans « Possède »)
- `src/ui/carnets/rangement.ts` : deux fonctions pures.
  - `planVrac` : la découpe annoncée d'une note en vrac. Une ligne avec un carnet proche y va. Les lignes sans carnet proche vont
    ensemble dans UN carnet neuf (g5:v02-19), titré par la première. `carnets` compte les carnets distincts.
  - `versLignesAnnoncees` : relie chaque ligne de l'IA à une ligne annoncée. À nombre égal, une à une. Sinon par les mots communs,
    puis par la place.
- `src/ui/carnets/CarnetsVue.tsx` :
  - une annonce par envoi (`cree`, `vrac`), tenue jusqu'à `ecrireIA` ;
  - un retour montré tout de suite quand la cible est tenue ;
  - le retour en réserve paraît aussi quand l'IA réussit ;
  - `annulerRetour` coupe l'IA en cours avant de tout défaire ;
  - la note en vrac « après » est branchée (`NoteEnVrac etat="apres"`, g5:v01-16) ;
  - un lien seul qui ouvre un carnet prend le nom lu sur la page.
- `src/ui/carnets/NoteEnVrac.tsx` :
  - `libelleCarnet` : le carnet n'est dit qu'une fois (« Nouveau carnet ») ;
  - `carnetsDistincts` et la prop `nbCarnets` : le même compteur pendant et après.
- `src/domain/carnets/iaSimulee.ts` :
  - le préfixe « ZZ TEST — » reste dans `carnetNeuf`, le titre d'idée et `titrePropose` ;
  - une note de plusieurs lignes n'est plus prise par G29 ; chaque ligne est rangée seule depuis la liste ;
  - G21 donne sa raison (« la page parle de « hotte » : comme Ventilation… ») ;
  - un lien seul ouvre un carnet au nom lu ;
  - les critères viennent de ce que la phrase dit.
- Tests :
  - `tests/unit/carnetsRangement.test.ts` : +2 ;
  - `tests/unit/carnetsIA.test.ts` : +3 ;
  - `tests/integration/carnetsParcours.test.tsx` : +5, et l'ancien test P2 réécrit (voir Doutes).
- Captures : `captures/` (36 PNG, 4 journaux, `capturer.cjs`).
- Non touchés : `rattacher.ts`, `modele.ts`, `Bandeau.tsx`, `LigneRangee.tsx`, `carnets.css`.

## Problème → fait → preuve

**d1280-1 et m390-1 (Créer · après, R11, D-132)**
- Avant :
  - l'IA simulée rangeait la phrase dans le Frigo, que la bulle ne nommait pas, et le bandeau disait « Rangé dans » ;
  - en IA lente, rien ne paraissait avant la fin.
- Fait :
  - depuis la liste, une phrase (pas un lien seul) crée SON carnet. Le carnet proche ne la prend que par « Y ajouter en façon » ;
  - l'IA met en forme dans ce carnet, sans le retitrer : son titre devient un titre proposé (G29) ;
  - « ✓ Carnet créé, en tête des Carnets · ↺ Annuler » et « « phrase » · votre phrase en titre » paraissent dès l'envoi, carnet
    ouvert, et restent après l'IA ;
  - Annuler pendant l'IA la coupe d'abord.
- Preuve, tests verts :
  - « liste + phrase sans carnet proche + IA simulée OK » : un seul carnet neuf, les 4 autres identiques (JSON) ;
  - « IA lente… » (`appelsSimules('lent')`, la phrase de m390-1) : `cree` pendant et après, puis Annuler rend la liste d'avant ;
  - « Annuler pendant que l'IA tourne » ;
  - P2 réécrit : « chambre froide… » donne un carnet neuf, Frigo inchangé.
- Captures ouvertes (banc `&ia=lent`) :
  - `m390-clair-04` : bulle « Déjà un carnet proche : Ventilation… » ;
  - `m390-clair-07`, `m390-sombre-07`, `d1280-clair-07` : « Carnet créé · Annuler », phrase en titre, Ce qui compte « Plus de
    condensation au plafond » ;
  - `m390-clair-08` et `d1280-sombre-08` : liste d'avant, Carnets 4 ;
  - les autres (07a, 1280) sont relus au journal.

**m390-2 (Note en vrac, R18, R19, D-139, D-140)**
- Avant : G29 prenait la note entière, et l'IA rangeait les 3 lignes dans Évier ; une ligne répétait son titre.
- Fait :
  - l'envoi applique la découpe annoncée (même `planVrac` pour le cadre et pour l'écriture) ;
  - l'IA type et met en forme chaque ligne, sans changer sa cible ;
  - les lignes sans carnet proche ouvrent un carnet neuf commun ;
  - le compteur compte les carnets distincts, le carnet neuf compris ;
  - après : « ✓ 3 lignes rangées dans 3 carnets · Annuler », chaque ligne et son carnet, « › Texte d'origine » ;
  - Annuler défait les m carnets.
- Preuve :
  - test « note en vrac de 3 lignes… » : cibles pendant = cibles après, effets dans le magasin = m, aucune ligne ne répète son
    titre, Annuler rend l'état d'origine ;
  - tests unitaires de `planVrac` et `versLignesAnnoncees` ;
  - captures ouvertes : `m390-clair-22`, `m390-clair-23`, `m390-sombre-23`, `d1280-clair-22`, `d1280-sombre-23`. On y lit « 3 lignes,
    3 carnets » puis « 3 lignes rangées dans 3 carnets », avec les mêmes cibles : Évier inox, Nouveau carnet, Ventilation.

**L4-7 (préfixe perdu)**
- Fait : `reponseSimulee` garde « ZZ TEST — » dans tout titre proposé, sans le doubler. Pour créer, le titre est de toute façon sa
  phrase.
- Preuve :
  - test « L4-7… » : « ZZ TEST — Frigo pour les fûts », G29 « ZZ TEST — Évier inox 2 bacs », rien d'ajouté sans le préfixe ;
  - en parcours, le titre du carnet neuf vaut la phrase préfixée.

**d1280-3 (titre d'un lien)**
- Déjà juste (corr1) : pendant, le domaine en titre et le lien en clair dans le cadre (g5:v03-10).
- Fait : après lecture, le nom lu (client et simulée). Page illisible : le domaine.
- Preuve :
  - test « d1280-3… » : « exemple.invalid » pendant, « Échangeur à plaques 30 plaques » après ; « inconnu.invalid » pour une page
    illisible ;
  - captures ouvertes : `m390-sombre-16` (domaine et lien en clair, « lecture de la page… »), `m390-clair-18` et `d1280-clair-18`
    (nom lu en titre, « le nom lu sur la page en titre »).

Déjà juste avant ce lot :
- `Bandeau` : le texte de R11 et l'origine du titre ;
- le composant `NoteEnVrac` « après », qui n'était pas branché ;
- le cadre de lecture d'un lien.

## Critères
- `npx vitest run tests/unit/carnets*.test.ts tests/integration/carnet*.test.tsx` : 17 fichiers, 248 tests verts. Le fichier IA a été
  rejoué seul après le dernier ajout : 31 verts.
- `npx tsc --noEmit -p .` : sortie 0. Un essai intermédiaire a échoué sur `ChampCarnet.tsx`, un fichier d'un autre lot ; c'était
  corrigé au passage suivant.
- Build : `npm run build` n'a pas été lancé, car il écrase `dist` (interdit par le brief). J'ai rejoué ses étapes vers un dossier
  temporaire : `tsc` 0, `vite build --outDir <scratchpad>/dist-corr2-l1` 0, `check-private-research` 0, `check-build-flags` sur ce
  dossier : « DRAPEAUX OK ».
- Banc : vite dev sur le port 60523, variables Firebase factices, deux passages de 4 jeux (390 tactile et 1280, clair et sombre). Le
  2e passage a suivi la correction du critère simulé. Serveur arrêté : « ecoute restante: 0 ». Aucun Gemini.
- Essais : tests 3 (P2 à réécrire ; capture pendant trop tôt ; URL tronquée par le cadre), captures 2.

## Doutes et limites
- Le test P2 de corr1 (« chambre froide… » donne « Rangé dans Frigo ») contredisait la règle du brief. Il est réécrit : c'est un
  carnet neuf, Frigo inchangé.
- La ligne « ZZ TEST — prochain brassage jeudi » est annoncée vers Ventilation, puis rangée là. Le seul lien est le mot « brassage »
  du titre : `rattacher` (lot A, seuil réglé en A5) est faible ici. Annoncé et appliqué concordent, mais le brasseur jugerait le
  choix faux (L14).
- Le carnet neuf d'une note en vrac garde comme `phrase` le message entier : `rangerDans` appelle `donneesVides(message.texte)`
  dans `operations.ts`, hors de mes fichiers. Sa carte sur la liste cite donc les 3 lignes.
- Écran 18 : `CarnetOuvert` (hors de mes fichiers) cite le lien sous le titre, et le bandeau le cite aussi : deux citations.
- Les puces ▾ de correction de la note « après » (g5:v01-16) ne sont pas branchées : aucune opération « changer de type ou de
  carnet » n'est passée. Les lignes sont affichées sans ▾.
- `versLignesAnnoncees`, quand l'IA rend un autre nombre de lignes, est une approximation par mots. Le compteur « après » est
  toujours compté sur les effets réels.
- « Y ajouter en façon » ouvre toujours le carnet proche, avec la phrase dans le champ : 2 gestes. Ce lot n'y touche pas.

DÉCISION À PRENDRE : `rattacher` range « prochain brassage jeudi » dans Ventilation sur le seul mot « brassage ».
- Options : (a) rejouer A5 avec ce cas dans le jeu (lot A), en exigeant deux mots communs ou plus quand le seul mot vient du titre ;
  (b) laisser tel quel.
- Recommandation : (a), avec la méthode L20 (moitié pour régler, moitié pour juger).

DÉCISION À PRENDRE : la `phrase` d'un carnet neuf né d'une note en vrac.
- Options : (a) la ligne qui l'a créé (champ `phrase` de `carnetNeuf` dans `operations.ts`, lot A) ; (b) le message entier.
- Recommandation : (a). Le message entier reste lisible dans « › Texte d'origine ».

CONNAISSANCE : depuis la liste, l'annonce du cadre fixe la cible. Créer, ou une note en vrac, donnent une cible tenue, et le retour
paraît dès l'envoi. Un lien seul laisse l'IA choisir, et le retour attend sa fin.

LEÇON PROPOSÉE : quand l'écran annonce une cible avant l'envoi, la même fonction calcule l'annonce et l'écriture (ici `planVrac`).
Un test compare le texte « pendant » et le texte « après » au DOM.
