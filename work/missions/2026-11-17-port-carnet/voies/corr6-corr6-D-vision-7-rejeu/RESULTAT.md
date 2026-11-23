ECHEC — rejeu non joué : lots A, B, C non intégrés, banc instable ; script prêt, DEMANDE EXECUTANT

# Lot corr6-D-vision-7-rejeu (18.11) — auteur Opus

## Problème → fait → preuve

| Problème | Fait | Preuve |
|---|---|---|
| Le lot passe après l'intégration de A, B et C | Aucun RESULTAT de `voies/corr6-corr6-A…`, `-B…` ou `-C…` n'existe. Le worktree reste à `b3bb2d0fd` (tour 5), et des lots écrivent encore dans src (`ListeCarnets.tsx`, `SupprimerCarnet.tsx`, `comptes.ts` neuf). | `git status --short` du worktree, lu deux fois |
| DEMANDE EXECUTANT de CRITIQUE-6, étapes 1 à 11, plus n° 25 | Script `vision-7/captures.mjs` écrit, copié de corr5-B puis adapté : 13 étapes `e01` à `e13`, noms `<m390\|d1280>-<thème>-<nn>[b]-<état>.png`, empreinte sha256 de chaque capture, journal VU, ABSENT, INTROUVABLE, PAGEERROR, RECHARGEMENT-INVALIDE | `node --check` : OK |
| D-63 (n° 10, bloquant) | Premier essai à 390 en clair, `e10`, deux passages. Ils sont **invalides** : vite a rechargé la page en plein scénario, puisque d'autres lots écrivaient dans src. Le magasin mémoire est reparti de zéro (« Carnets 1 » après deux créations), et 48c montre « Chargement de la brasserie… ». | Captures 48, 48b, 48c et 38 ouvertes. Elles ont été effacées, car invalides. |
| Contrôle trop faible (essai 1) | Le premier essai a donné un faux VU. « Frigo », « Ventilation » et « Évier » étaient lus dans les puces d'exemple de la liste vide. Une empreinte « 38 ≠ 02 » passait donc sur le seul compteur. Corrigé : 38 cherche maintenant les noms tapés, refuse « votre premier carnet » et lit le segment (attendu : « Carnets 3 »). Tout rechargement est désormais signalé. | journal du 2e passage : ABSENT ×3, PRESENT-A-TORT, `SEGMENT « Carnets1 »` |
| n° 25 (le fil, Comparer deux idées) | Aucun code. L'étape `e13` constate seulement R25 : messages cités sur place, « › Texte d'origine », lien en clair. Le fil visible et Comparer deux idées restent au lot E (mini maquettes), puis au lot F après son choix (D123). | à jouer (`e13`) |
| Serveur, worktree | vite lancé sur 5431 puis arrêté : 0 écoute. Je n'ai rien écrit dans src ni dans tests. | `netstat … :5431 LISTEN` → 0 |

Fichiers écrits : `work/missions/2026-11-17-port-carnet/vision-7/captures.mjs` et ce RESULTAT. Les captures de l'essai ont été effacées : invalides.
Essais : 2 sur `e10` (390 en clair), tous deux invalidés par le rechargement de vite.

## DEMANDE EXECUTANT
Pré-requis : le pilote a intégré A, B et C dans `port-carnet`. Plus aucun lot n'écrit dans src (`git status --short` stable sur deux lectures,
à 1 min d'écart). Sinon, vite recharge la page et le passage est INVALIDE.
Les DEMANDES EXECUTANT des lots A, B et C n'existaient pas à l'écriture de ce rapport. Le pilote les ajoute à la fin, en étape 12, dans leur ordre.

Commandes, en Bash, une session par passe :
```
cd /c/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet
export VITE_FIREBASE_API_KEY=fictif VITE_FIREBASE_AUTH_DOMAIN=fictif.invalid VITE_FIREBASE_PROJECT_ID=fictif VITE_FIREBASE_STORAGE_BUCKET=fictif.invalid VITE_FIREBASE_MESSAGING_SENDER_ID=0 VITE_FIREBASE_APP_ID=fictif
npx vite --port 5431 --strictPort > $TMP/vite7.log 2>&1 & VP=$!
V=/c/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-17-port-carnet/vision-7
node $V/captures.mjs 5431 e10 390,1280 clair,sombre     # D-63 d'abord (bloquant)
node $V/captures.mjs 5431 e01,e02,e04,e05,e07,e13 390 clair,sombre
node $V/captures.mjs 5431 e03,e08,e11 1280 clair,sombre
node $V/captures.mjs 5431 e03b,e06,e09 390,1280 clair,sombre
kill $VP; for pid in $(netstat -ano | grep ':5431 .*LISTEN' | awk '{print $5}' | sort -u); do taskkill //PID $pid //F //T; done
netstat -ano | grep -c ':5431 .*LISTEN'    # attendu 0
git status --short                          # attendu : identique à avant le rejeu
```
Sorties attendues :
- dans chaque `journal-*.txt`, aucune ligne `PAGEERROR` et aucune `RECHARGEMENT-INVALIDE`. Sinon, relancer l'étape une fois, puis la noter ;
- pour `e10`, `EMPREINTE … différente de 02 (OK)`, `SEGMENT … « Carnets 3 »`, VU sur les 3 noms tapés et BIEN-ABSENT « votre premier carnet » ;
- une ligne par capture, « PAGE OK » ou le problème vu, après avoir **ouvert l'image**. Les lignes `INTROUVABLE` se recopient telles quelles :
  elles disent un geste absent ou renommé ;
- pour `e08`, les lignes `TEXTE [...]` servent à décrire 12, 24, 28, 32, 33, 36, 37, 39 et 40 ;
- `VEILLE OFF→ON` dit l'état après le clic : attendu `true`.

Captures à ouvrir, avec leur maquette de référence (préfixe `m390-` ou `d1280-`, puis `clair-` ou `sombre-`) :

| Étape | Captures | Référence |
|---|---|---|
| 1 | `27b-comparer-haut`, `27c-comparer-defile` (390) | p2:g01-8 : une colonne par article, « Compromis », « classées par… », écartés à la fin |
| 2 | `28b-pourquoi-frigo`, `28c-retenir-hotte` (390) | g05-11 : réglettes valeur et prix, critère, façon, fournisseur, écarté et sa raison |
| 3 | `14b-lien-pendant`, `15b-lien-apres-carte` (1280) ; `19-lien-depuis-liste-apres`, `19b-2e-lien-tableau` (deux tailles) | g5:v06-10 (« tient 80 °C : oui », photo, prix) ; g5:v06-11, le tableau naît (G20) |
| 4 | `04b-creer-pendant-arrive-ici`, `05b-creer-pendant-proche`, `22b-note-vrac-pendant`, `23-note-vrac-apres`, `40b-ia-en-cours-annuler` (390, `&ia=lent`) | D-131 ; g5:v01-15 (« ✻ L'IA découpe votre note : 3 lignes, 2 carnets ») ; g5:v01-16 (« ✓ 3 lignes rangées dans 2 carnets · Annuler », « › Texte d'origine ») ; ✕ |
| 5 | `12b-doublon-garder-a-part`, `12c-doublon-retire` (390) | G11, D-134/D-135 |
| 6 | `32b-note-menu` (390) ou `26b-note-actions-defilee` (1280), `33-modifier-se-modifie-ici`, `33b-note-modifiee`, `35b-note-supprimee`, `35c-note-revenue` | D-118 (« ✎ Se modifie ici », « ✓ Note modifiée ») ; D-120 (le bandeau disparaît après Annuler) |
| 7 | `44-photo`, `45-dicter` (390) | 📷 et 🎤 trouvés par aria-label |
| 8 | `12-…`, `24-menu-plus`, `28-supprimer-idee-sans-lien`, `32-ia-echec`, `33-ia-eteint`, `36-taches`, `37-aides-0`, `39-carnet-frigo-ouvert`, `40-liste-sans-prefixe`, `01b-liste-en-veille`, `01c-veille-off-vers-on` (1280) | mêmes états que vision-6 d1280 ; veille D-42, D-68, D-74 |
| 9 | `d35a-proposes`, `d35b-accepte` (deux tailles) | p2:i06-4, g5:v08-3 (D-35) |
| 10 | `02-zero-liste-vide`, `48-zero-frigo`, `48b-zero-ventilation`, `48c-zero-evier`, `38-zero-trois-carnets` (deux tailles) | CARNET-COEUR, D-63 : 38 ≠ 02, trois carnets nés de ses gestes |
| 11 | `11-app-stocks-materiel-carnets` (1280, `?dev-local`) | en-tête L'Affinée et sous-segment g05-1 ; R29, D-80, D-85 ; sans « Banc — données simulées » |
| 13 | `25-fil-cite-sur-place` (390, pleine page) | R25 : constat seul ; D-142 reste aux lots E puis F (D123) |

Le jugement « combien et quels problèmes ? » revient ensuite au critique Opus, puis au pilote. Tout constat va à BUGS.md, versé par le pilote.

## Doutes et limites
- Les sélecteurs suivent le texte de b3bb2d0fd (« Comparer côte à côte », « Pourquoi ›… », « ··· », aria-label photo et dicter). Après A, B et C, un
  libellé renommé donne `INTROUVABLE` : c'est un constat à relire, pas forcément un défaut.
- La note en vrac du script est plausible (hotte à 80 °C, sol en résine, 1 200 m³/h). Elle n'est pas celle de la maquette v01-15. Le critique
  juge la découpe, pas le texte.
- vite n'a pas d'option pour couper le HMR en ligne de commande. Le script ne l'empêche donc pas, il le détecte.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : un banc vite en mémoire (`?preview=carnets`) se réinitialise à chaque rechargement à chaud. Un scénario en plusieurs gestes
(D-63) ne se rejoue donc pas pendant que d'autres voies écrivent dans src du même worktree.
LEÇON PROPOSÉE : un contrôle par texte cherche ce que l'utilisateur a tapé, jamais un mot que l'écran vide affiche déjà. Au premier essai,
« Frigo », « Ventilation » et « Évier » des puces d'exemple ont donné trois faux VU. C'est la même famille que « 38 identique à 02 ».
