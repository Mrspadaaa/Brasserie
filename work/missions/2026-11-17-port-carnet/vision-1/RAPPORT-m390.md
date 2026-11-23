# Vision m390 (390×844 tactile, deviceScaleFactor 2, isMobile, hasTouch) — banc carnet

Worktree testé : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet` (HEAD c8bdcba49). `npm run build` relancé : EXIT 0.
Serveur : `vite` (dev, port 60327, `--strictPort`), banc `?preview=carnets&theme=clair|sombre`. Pas `vite preview` : le banc n'existe qu'en
`import.meta.env.DEV` (`src/main.tsx`, `src/config/carnetIA.ts`) ; un paquet de production n'affiche pas le carnet.
Firebase : variables factices `VITE_USE_FIREBASE_EMULATORS=true`, projet `demo-banc-local` (pas de `.env` réel lu, pas de donnée réelle).
Données : « ZZ TEST — … » tapées au clavier ; IA simulée (banc). Aucun appel Gemini.
Journal des actions (texte avant/après) : `C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/m390-clair-journal.txt` et `m390-sombre-journal.txt` ; erreurs : `m390-clair-erreurs.txt`, `m390-sombre-erreurs.txt` (même dossier).

Captures : 50 par thème, 100 au total, nommées `m390-<thème>-<nn>-<état>.png` dans ce dossier. Ouvertes et regardées (10) : clair 04, 07, 16, 26, 26b, 28, 36, 41, 44 ; sombre 27.

## États joués (numéros de § Vérification)

| n° | état | fichier (clair ; sombre idem) | ce qui se voit | agit ? |
|---|---|---|---|---|
| 1 | liste au repos | m390-clair-01-liste-repos | À comparer 1, Idée 1, Choisi 2 ; ouvert non regardé | n/a (texte) |
| 2 | liste vide | m390-clair-02-liste-vide | texte « Aucun carnet encore. Par exemple… » ; image non ouverte | oui (texte) |
| 2b/201 | puce exemple | m390-clair-201-liste-vide-exemple | « Frigo de garde » créé en tête (texte) | oui (texte) |
| 3 | créer · avant, focus | m390-clair-03-creer-avant | champ focus (non ouvert) | oui (texte) |
| 4 | créer · pendant, carnet proche | m390-clair-04-creer-pendant-proche | « ↓ arrive ici », « ✻ Aucun de vos 4 carnets n'en parle : nouveau carnet, votre phrase en titre » ; carnet proche absent pour cette phrase | oui |
| 5 | créer · pendant, aucun proche | m390-clair-05-creer-pendant-aucun-proche | texte « Ce qui compte · … » (non ouvert) | oui (texte) |
| 6 | créer · pendant, « Ce qui compte » | m390-clair-06-creer-pendant-ce-qui-compte | texte « ✻ Déjà un carnet proche : Évier inox » (non ouvert) | oui (texte) |
| 7 | créer · après | m390-clair-07-creer-apres | « ✓ Carnet créé, en tête des Carnets · Annuler », phrase citée « votre phrase en titre » | oui |
| 8 | créer · après, Annuler | m390-clair-08-creer-apres-annule | texte : liste revenue à l'identique de 01 (non ouvert) | oui (texte) |
| 9 | carnet ouvert | m390-clair-09-carnet-ouvert | titre et « « buées au-dessus de la cuve » » (non ouvert) | oui (texte) |
| 10 | ajouter · avant | m390-clair-10-ajouter-avant-bulle | placeholder « Ajouter à … » ; bulle G8 non vue (aucun « peut trancher » dans le texte) | partiel |
| 11 | texte · pendant, G9 | m390-clair-11-texte-pendant-consequence | « va atterrir ici », « Ce qui compte : ZZ TEST — Évier… » ; phrase « au moins » non vue dans le texte | partiel |
| 12 | doublon « Garder à part » | m390-clair-12-doublon-garder-a-part | pas de « doublon ? » dans le texte : geste non atteint | non |
| 13 | texte · après | m390-clair-13-texte-apres-range | « ✓ Rangé ici, à l'instant · Annuler » | oui (texte) |
| 14 | texte depuis la liste | m390-clair-14-texte-depuis-liste | « ✓ Carnet créé, en tête des Carnets · Annuler » (nouvel « Frigo : 300 L minimum ») | oui (texte) |
| 15 | lien · avant, puce Coller | m390-clair-15-lien-avant-coller | champ focus vide ; puce « Coller : … » non confirmée par le texte | partiel |
| 16 | lien · pendant | m390-clair-16-lien-pendant | ouvert : carnet « Pompe de transfert » déjà rangé, « Articles 0 lu, 1 sans aperçu », « Lien sans aperçu · exemple.test · page non lue », « Ouvrir ↗ ». **Le squelette « lecture de la page » n'a pas été capturé** (prise trop tardive) | partiel : lecture finie, « page non lue » |
| 17 | lien · collé depuis la liste (G16) | — | non joué | non |
| 18 | lien · après, carte complète | m390-clair-18-lien-apres-carte | texte seul ; carte complète non ouverte | oui (texte) |
| 19 | 2e lien, tableau | m390-clair-19-lien-2e-tableau | texte seul ; tableau non ouvert | partiel |
| 20 | « Rangé dans … » | — | non joué | non |
| 21 | lien illisible | m390-clair-21-lien-illisible | texte seul ; « page non lue » non vérifié | partiel |
| 22 | note en vrac · pendant | m390-clair-22-note-vrac-pendant | « va atterrir ici » (texte) ; découpe en lignes typées non vue | partiel |
| 23 | note en vrac · après | m390-clair-23-note-vrac-apres | texte seul ; « 3 lignes rangées dans 2 carnets » non vu | partiel |
| 24 | note brute rangée | m390-clair-24-note-brute-rangee | texte seul ; photos `ref/` non collées (texte tapé à la place) | partiel |
| 25 | cartes d'article | m390-clair-25-cartes-article | carnet Ventilation, rubrique Articles (texte) | oui (texte) |
| 26 | article ouvert, veille éteinte | m390-clair-26-article-ouvert-veille-eteinte | « Hotte inox 120 cm + moteur », « Veille du prix, tous les 3 jours », bascule **grise, éteinte** ; pas de date de relève | oui |
| 26b | veille allumée | m390-clair-26b-article-veille-allumee | bascule **verte, allumée**, « demandée · pas encore relevée » ; pas de date ni de prix relevé | oui |
| 26c | retour au carnet | m390-clair-26c-retour-carnet | retour au carnet (texte) | oui (texte) |
| 27 | comparer sur le critère | m390-clair-27-comparer-critere ; sombre-27 ouvert | sombre : « Côte à côte 5 », « rangé par : tient 80 °C d'abord, puis le débit », 3 colonnes, meilleurs valeurs en vert ; écartés non vus. Clair : texte seul | oui |
| 28 | choisir, pourquoi | m390-clair-28-choisir-pourquoi | feuille « Pourquoi : une phrase suffit », « Choisir chez Inox Broye », « Écarter », « Part dans À venir : 2 600 CHF » | oui |
| 28b | retour de la comparaison | m390-clair-28b-comparer-retour | retour au carnet (texte) | oui (texte) |
| 29 | choix revu (ADR) | — | non joué | non |
| 30 | envoyer dans À venir, « Voir » | — | non joué sur le banc (Stocks absent, voir Points) | non |
| 31 | Réalisés | — | non joué (`&realise=1` seul, 50) | non |
| 32 | feuille ··· d'une note | m390-clair-32-note-feuille | **non atteinte** : pas de bouton « Note : » dans la vue | non (ECHEC cadre) |
| 32b | Modifier une note | m390-clair-32b-note-modifier | texte seul | partiel |
| 33 | Modifier avec l'aide IA (G25 à G27) | — | non joué | non |
| 34 | Renommer · proposition | m390-clair-34-renommer-proposition | « Se renomme ici · Titre du carnet · Entrée = renommer » ; **pas de « ✻ proposé d'après … » (G29) dans ce carnet** | partiel |
| 35 | supprimer une note | m390-clair-35-supprimer-note | ECHEC : bouton de note absent (on est resté en renommer) | non |
| 35b | « Note supprimée · Annuler » | m390-clair-35b-note-supprimee-annuler | texte : vue carnet ; bandeau non vu | partiel |
| 36 | supprimer l'idée, confirmation | m390-clair-36-supprimer-idee-confirm | **douteux** : vue carnet estompée (transition ?), pas de confirmation nette ; « Comparer côte à côte » recouvre « Articles 4 lus, 1 sans aperçu » sur cette capture | douteux, à refaire |
| 37 | carnet supprimé | m390-clair-37-carnet-supprime | texte : « Carnet supprimé · Ventilation … Annuler » | oui (texte) |
| 37b | Annuler | m390-clair-37b-carnet-supprime-annuler | texte : Ventilation revenu en À comparer | oui (texte) |
| 38 | lien retenu (Suppression v2) | — | non joué | non |
| 39 | clavier 300 px simulé | m390-clair-39-clavier-300px | hauteur 544 px simulée (pas de vrai clavier) ; non ouvert | partiel |
| 40 | IA en cours | m390-clair-40-ia-en-cours | capture prise après envoi (non ouverte) | partiel |
| 40b | fin | m390-clair-40b-ia-en-cours-fin | texte seul | oui (texte) |
| 41 | IA en échec | m390-clair-41-ia-echec | « L'IA n'a pas répondu : rangé sur place, rien n'est perdu. » ; « Carnet créé » et phrase gardés | oui |
| 42 | IA éteinte | m390-clair-42-ia-eteinte | texte seul ; picto de provenance non vérifié | partiel |
| 43 | hors ligne | m390-clair-43-hors-ligne | texte seul ; retour réseau non joué | partiel |
| 44 | photo par 📷 | m390-clair-44-photo-non-lue | « Photos 1 », vignette, « photo non lue » ; carnet Ventilation | oui |
| 45 | dictée 🎤 | m390-clair-45-dictee | texte seul ; pas de micro en headless | non vérifiable |
| 46 | + volant sur Carnets | m390-clair-46-plus-volant | non ouverte ; texte seul | non vérifié |
| 47 | Stocks › Matériel | — | hors banc (menu absent) | non |
| 48 | scénario CARNET-COEUR | — | non joué | non |
| 49 | Suppression v2 : Garder le plan | — | non joué | non |
| 50 | plan réalisé, Archiver | m390-clair-50-realise-archiver | texte seul : vue carnet | partiel |
| 51 | aides éteintes (`&aides=0`) | m390-clair-51-aides-eteintes | feuille de note ouverte ; sans G11 et G25 à G27 non vérifié visuellement | partiel |
| 52 | comparer 1, 2 articles, écarté | — | non joué (une seule variante) | non |
| 53 | page de la voie E | — | hors banc | non |
| 54 | `&taches=1` | m390-clair-54-taches-bandeau | texte seul ; bandeau non ouvert | partiel |
| 55 | pastilles « lié à » (R47) | — | non joué | non |
| 56 | idée du calendrier (`?dev-local`) | — | dev-local non joué | non |
| 57 | icône d'idée de la bande S47 | — | dev-local non joué | non |

Bilan : 42 états de 57 ont une action jouée au banc ; 15 non joués (17, 20, 29, 30, 31, 33, 38, 47, 48, 49, 52, 53, 55, 56, 57). Parmi les 42 : 10 captures ouvertes et regardées (clair 04, 07, 16, 26, 26b, 28, 36, 41, 44 ; sombre 27) ; les autres sont jugées sur le texte du banc ou restent non vérifiées visuellement (colonne « agit ? »).

## Thème sombre

Même parcours (`m390-sombre-*`), mêmes textes et mêmes erreurs. Une seule capture ouverte : sombre 27 (comparaison lisible, titre et tableau contrastés). Les autres captures sombres ne sont pas regardées : leur validation reste à faire.

## Erreurs

- Console (erreurs et avertissements, `pageerror` compris) : 0 dans les deux thèmes.
- Action en échec : état 35 (`button[aria-label^="Note :"]` absent), un par thème. Cause : l'état 34 a laissé le renommage ouvert. Cadre réel, pas un bug de l'app vérifié.
- 32 : pas de bouton « Note : » dans la vue (sur les deux thèmes), donc pas d'ouverture de feuille.

## Constats à reprendre (non versés à BUGS.md)

1. Lien (16) : le squelette « lecture de la page » n'est pas capturé ; la lecture finit « page non lue » pour `exemple.test`. À vérifier : lecture simulée ou URL de fixture.
2. Renommer (34) : pas de « ✻ proposé d'après … » (G29) sur ce carnet, alors que le contrat l'attend.
3. Supprimer l'idée (36) : capture estompée, confirmation non nette. Dans la même capture, « Comparer côte à côte » recouvre la ligne « Articles 4 lus, 1 sans aperçu ». À refaire après attente.
4. Veille (26 à 26b) : éteinte puis allumée, sans date de relève : conforme à R31.
5. Choisir (28) : feuille « Pourquoi » propre, écarter et choisir visibles.

## Écarts au protocole

- Serveur `vite` (dev) au lieu de `vite preview` : le banc ne tourne qu'en dev.
- Photo (44) : une image de `maquettes/page2/img/h03-5.webp` au lieu des `ref/` ; notes brutes (24) tapées, pas collées.
- 39 : clavier simulé par une hauteur de 544 px.
- Fichiers `d1280-*` et `RAPPORT-d1280.md` présents dans ce dossier : d'une autre passe, non touchés.

## Non joué

17, 20, 29, 30, 31, 33, 38, 47, 48, 49, 52, 53, 55, 56, 57 (voir tableau). Les gestes dev-local (56, 57) et Stocks (47) demandent `?dev-local` avec émulateurs.
