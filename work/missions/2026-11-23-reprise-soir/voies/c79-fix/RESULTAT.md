OK — c79Regles 32/32 : R110, EXA-2 à EXA-8, EXA-10 corrigés en local (8bb33eeb6, f23237fd9) ; porte verte, LISTE OK

# RESULTAT c79-fix (25.11, reprise)

FIX 32/32 ; porte 101 fichiers verts / 0 rouge (2479 tests, 8 skipped) ; tsc OK (2 erreurs connues : seedData GanttTask, virtual:pwa-register) ; functions tsc exit 0 ; BUGS OK ; LISTE OK 89 % / 15 lignes.

## Ce que la reprise a fait (par règle, chaque endroit)
- EXA-6 + EXA-2 : TOUTE bulle du fil a son ⋯.
  - `src/domain/carnets/bulle.ts` (neuf) : `lignesDeLaBulle` (ce que le message a rangé ICI : note, critère, façon, article), `carnetsAilleursDe`, clé de feuille (`msg:<id>` quand la bulle n'a pas UNE note, sinon l'id de la note), `cleDeLaNote`.
  - `operations.ts` : `supprimerBulle` (retire les lignes d'ici ; un message qui a rangé aussi chez un autre carnet n'est pas retiré, il quitte seulement ce fil : `depuis` passe à « liste », ses effets d'ici partent ; annulable).
  - `FilCarnet.tsx` : le ⋯ est posé sur toute bulle (clé = note unique ou `msg:`), `entourer` aussi.
  - `FeuilleBulle.tsx` (neuf, mêmes classes que `FeuilleNote`) : Modifier (une note), Changer en note (un critère, une façon), Supprimer, Fermer ; elle dit « Reste dans « Chambre froide » : seul ce fil perd la bulle » quand le message a rangé ailleurs.
  - `ecransCarnet.tsx` (feuille de bulle, Modifier branché sur l'édition existante), `CarnetOuvert.tsx` (le bandeau « Note supprimée · Annuler » suit la clé de la première note).
- EXA-4 : `reclasser.ts` `critereNeDUnConstat` : une phrase peut porter un début de plus que le critère (« La prochaine fois : … ») et une caractéristique devinée en local ne le protège plus ; la carte dit la phrase d'origine et la note la garde. `CarteReclasser.tsx` : le titre et ses lignes dans un même bloc (css `cnp-propose-corps`).
- EXA-3 : `propositionReclasser` : un carnet d'avant le suivi (ni genre, ni suivi, ni tâche, hors fil `brut` de R95) reçoit « Idée devient Problème » (piste, fait ou fin), « Résolu » quand le DERNIER message dit « Commandé … » (la note reste, c'est un fait), et ses phrases « à + infinitif » en tâches, seulement quand l'erreur de rangement est déjà signée (article né d'une phrase ou fin « Commandé »). `reclasser()` pose genre, tâches (`ajouterTache`), résolu.
- EXA-8 : `ChampCarnet.tsx` : le brouillon part au geste d'envoi. Cause : « Ajouter » sous « Déjà un carnet proche » ouvre l'autre carnet, le champ de la liste est démonté avant d'avoir vu son texte se vider (l'effet de nettoyage ne passait jamais) ; le brouillon revenait dans la liste et dans le champ du carnet suivant.

## Fichiers écrits
src/domain/carnets/{bulle,operations,reclasser}.ts ; src/ui/carnets/{FeuilleBulle,FilCarnet,CarnetOuvert,ecransCarnet,CarteReclasser,ChampCarnet}.tsx, carnets-fil.css ; work/missions/BUGS.md (EXA-2..11 sauf EXA-1) ; ce dossier.

## Sortie des critères
- `npx vitest run tests/unit/c79Regles.test.tsx` : 32 passed.
- Rejeu complet (carnets*, c48..c79Regles, noteRegles, c70RangementIA, c68Realises, lot3CarnetOuvert, horizons*, pxPrix*, virgule-transversale, proprietes, stocksMaterielUneRangee) : 101 files, 2479 passed, 8 skipped (regress.log).
- Deux régressions trouvées puis corrigées en cours de route : c74bRegles (R95, deux cartes pour un même fil brut) et c75Regles R98 (« Semble difficile à obtenir » lu comme tâche) : tâches limitées aux carnets déjà signés par l'erreur de rangement.
- `controle-bugs.mjs` : BUGS OK : 2455 bugs, 631 ouverts. `controle-liste-compacte.mjs` : LISTE OK sans-filtre 89 % de 651 px, 15 lignes ; filtre-cherche 90 %, 14 lignes (liste.txt).

## Essais
EXA-6/2 : 1 (vert au premier rejeu). EXA-4 : 2 (la carte était là, mais le test lit le parent du titre : lignes mises dans le même bloc). EXA-3 : 3 (regex perdue par le Bash dans le premier script : `\b` devenu une touche arrière ; corrigée par un script qui écrit les barres inverses par code, `node --check` + tsc). EXA-8 : 1.

## Doutes et limites
- Aucune capture : pas de rendu local (consigne VOIE) ; la feuille de bulle, la carte Reclasser à deux blocs et le bandeau « Annuler » d'une bulle supprimée sont à voir en ligne à 390 px par le pilote et le critique (EXA-1, la position de la feuille sous l'en-tête, reste ouvert : jsdom ne la mesure pas).
- « Supprimer » d'une bulle sans ligne ici (frigo) retire le message de ce fil ; le message reste dans le carnet où il a rangé. Annuler rend tout (`inverse` du Brouillon).
- Modifier d'une façon ou d'un critère n'existe pas dans la feuille de bulle : « Changer en note » d'abord, puis Modifier (le champ du bas ne sait éditer qu'une note).
- Heuristique de tâche : « à + infinitif » ; faux positifs possibles sur un carnet déjà signé par l'erreur (la carte montre chaque tâche, « Laisser » la retire).
- BUGS : EXA-5, 7, 9, 10, 11 portent f23237fd9 ; EXA-2, 3, 4, 6, 8 portent 8bb33eeb6. « reste à rejouer en ligne » : aucune ligne n'est fermée.

DÉCISION À PRENDRE : aucune
CONNAISSANCE : une bulle du fil se désigne par la note quand elle n'en a qu'une, sinon par le message (`msg:<id>`) ; supprimer une bulle ne touche que le carnet où l'on est (`supprimerBulle`).
LEÇON PROPOSÉE : le Bash de ce poste perd aussi les barres inverses dans une chaîne de gabarit JS écrite par heredoc (`\b` devient une touche arrière, `\s` un `s`) : un script de remplacement de code s'écrit avec Write et `String.fromCharCode(92)`, jamais en heredoc ; deux fois dans cette voie.
