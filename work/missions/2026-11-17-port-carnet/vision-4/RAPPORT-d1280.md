# Vision d1280, 4e passe — carnet porté (1280 × 800, clair et sombre)

Banc : worktree `port-carnet`, HEAD `e0073224e` (« correction tour 3 »). `dist` plus vieux que HEAD (02:35:05 contre 02:35:29) : `npm run build` relancé, exit 0, drapeaux OK (`scratchpad/build.log`).
Serveurs : `vite` dev (comme MISSION § Bancs ; `vite preview` ne sert pas le banc) via `vision-4/lancer.sh` : banc sur 60425, dev-local sur 60426 + émulateurs 8080. Fixture « ZZ TEST — … », IA simulée, requêtes Google coupées (18 clair banc, 8 sombre banc, 4 et 2 en dev-local).
Scripts : `vision-4/rejeu-banc.cjs` (banc) et `vision-4/rejeu-devlocal.cjs` (dev-local). Journaux : `journal-d1280-{clair,sombre}{,-devlocal}.txt`, `erreurs-d1280-…txt`, `lancer.log`.

Avertissement de provenance : pendant le passage, une seconde exécution de `lancer.sh` (même dossier, mêmes ports, même émulateur) a réécrit `lancer.log` et `vite-*.log` (02:42 à 02:46) et a produit des captures `m390-*` (180 fichiers) ; l'émulateur a été vidé par elle. Les passes dev-local clair sont donc suspectes (16 ECHEC de script). Les captures `d1280-*` datées 02:39 à 02:55 ont été lues, mais leur provenance exacte n'est pas garantie. Les `m390-*` ne sont pas dans ce rapport.

CRITIQUE-3 : `work/missions/2026-11-17-port-carnet/CRITIQUE-3.md` est absent (comme CRITIQUE-2 en vision-3). Le seul `CRITIQUE-3.md` du dépôt est celui du port du calendrier, non retenu ici. Les problèmes suivis sont donc ceux de `vision-3/RAPPORT-d1280.md` (constats 1 à 7).

Ouvert = image ouverte et regardée. « non ouvert » = fichier produit, aucune lecture à l'image.

## États (n° du § Vérification) → fichier → ce qui se voit → agit

| État | Fichier (clair ; sombre) | Ce qui se voit | Agit | Ouvert |
|---|---|---|---|---|
| 1 liste au repos | `d1280-sombre-01-liste-repos.png` (clair non ouvert) | Onglets À venir 1, Carnets 5 (ambre en sombre), Réalisés 0 ; À comparer 1, Idée 1, Choisi 3 ; champ en bas | n/a | sombre oui, clair non |
| 2 liste vide | `…-02-liste-vide.png`, `…-02b-…` | non ouvert | n/a | non |
| 3 créer · avant | `…-03-creer-avant.png` | non ouvert | n/a | non |
| 4 créer · pendant, proche | `d1280-clair-04-…`, `d1280-sombre-04-…` | Cadre « Nouveau carnet · Idée », titre « ZZ TEST — évier : 2 bacs pour laver les fûts » dans le champ, « Déjà un carnet proche : Évier inox », « Y ajouter en façon », « arrive ici » | oui (le cadre apparaît à la frappe) | oui, deux thèmes |
| 5 pendant, aucun proche | `…-05-…` | non ouvert | non vérifié | non |
| 6 pendant, « Ce qui compte » | `…-06-…` | non ouvert | non vérifié | non |
| 7 créer · après | `…-07-…` | non ouvert (constat 1 de vision-3 : bandeau visible, à voir) | non vérifié | non |
| 8 créer · après, annulé | `…-08-…` | non ouvert | non vérifié | non |
| 9 carnet ouvert | `…-09-…` | non ouvert | n/a | non |
| 10 ajouter · bulle G8 | `…-10-…` | non ouvert | non vérifié | non |
| 11 texte · pendant, « Va dans » | `…-11-texte-pendant-g9.png` | non ouvert | non vérifié | non |
| 12 doublon · pendant | `d1280-clair-12-doublon-pendant.png` | Bandeau « va atterrir ici », « Notes : attendre l'avis du ferblantier sur la hotte » ; champ tapé ; puces « Va dans : Ce qui compte · Note · Façon ». Pas de cadre doublon, pas de « Garder à part » | NON : état G11 absent. ECHEC de script (attente 5 s) | oui, clair |
| 12b doublon · garder à part | `d1280-clair-12b-…` (sombre pareil) | Même image que 12 : pas de « Garder à part ». ECHEC (bouton introuvable) | NON | oui, clair |
| 12c doublon · fusion | `…-12c-…` | non ouvert | non vérifié | non |
| 13 texte · après | `…-13-texte-apres-range.png` | non ouvert | non vérifié | non |
| 14 texte depuis la liste | `…-14-…` | non ouvert | non vérifié | non |
| 15 lien · avant | `…-15-…` | non ouvert | non vérifié | non |
| 16 lien · pendant | `d1280-clair-16-lien-pendant.png` | Bandeau « Arrive ici, dans Articles » ; « exemple.invalid/hotte-140 » ; « lecture de la page… » en squelette ; « rien d'affiché avant d'être lu » ; titre = nom du carnet (pas l'URL brute) | oui (la lecture s'affiche) | oui, clair |
| 17 lien collé depuis la liste | `…-17-…`, `…-17b-…` | non ouvert | non vérifié | non |
| 18 lien · après, carte | `…-18-…` | non ouvert (lecture > 5 s en vision-3, à reprendre) | non vérifié | non |
| 19 2e tableau | `…-19-…` | non ouvert | non vérifié | non |
| 20 « Rangé dans … » | `…-20-…` | non ouvert | non vérifié | non |
| 21 lien illisible | `…-21-lien-illisible.png` | Non relevé au script (NON). Non ouvert | non vérifié | non |
| 22 note en vrac · pendant | `…-22-…` | non ouvert | non vérifié | non |
| 23 note en vrac · après | `…-23-…` | non ouvert | non vérifié | non |
| 24 notes ref/ | `…-24-…` | non ouvert | non vérifié | non |
| 25 cartes d'article | `…-25-…` | non ouvert | non vérifié | non |
| 26 article · veille éteinte | `…-26-…`, `…-26a-…` | non ouvert | non vérifié | non |
| 26b article · veille allumée | `d1280-clair-26b-article-veille-allumee.png` | Interrupteur « Veille du prix, tous les 3 jours » vert ; « demandée · pas encore relevée », sans date de relève ; « Choisir · Inox Broye » | oui (interrupteur allumé, texte R31 visible) | oui, clair |
| 26c retour carnet | `…-26c-…` | non ouvert | non vérifié | non |
| 27 comparer · critère | `…-27-…`, `…-27b-…` | non ouvert | non vérifié | non |
| 28 à 29 choisir, choisi, choix revu | `…-28-…`, `…-28b-…`, `…-29-…`, `…-29b-…` | non ouvert | non vérifié | non |
| 30 à 30c envoyer dans À venir | `…-30-…`, `…-30b-…`, `…-30c-…` | non ouvert (dev-local 30 à 30d : ECHEC en clair) | non vérifié | non |
| 31 Réalisés | `…-31b-realises-banc.png`, dev-local `…-31-realises.png` | non ouvert | non vérifié | non |
| 32 à 32c note, feuille ··· | `…-32-…`, `…-32b-…`, `…-32c-…` | non ouvert | non vérifié | non |
| 33 aide IA note | `…-33-…` | non ouvert (NON au script) | non vérifié | non |
| 34 à 34d renommer | `…-34-…`, `…-34b-…`, `…-34c-…`, `…-34d-…` | non ouvert | non vérifié | non |
| 35 à 35c supprimer une note | `…-35-…`, `…-35b-…`, `…-35c-…` | ECHEC : « Note supprimée » toujours là (script) | NON, à refaire | non |
| 36 supprimer idée, confirmation | `…-36-supprimer-idee-confirm.png` | non ouvert | non vérifié | non |
| 36b articles en veille « Déplacer » | `d1280-clair-36b-supprimer-idee-veille-deplacer.png` | Dialogue « Supprimer le carnet Ventilation… ? », « 6 articles, 3 façons et 2 notes », « La veille du prix… s'arrête », « ni dans À venir, ni en commande », Supprimer (contour rouge) et Garder noir. « Déplacer » absent | NON pour « Déplacer » (G35) ; le dialogue lui-même agit | oui, clair (partiel) |
| 37 carnet supprimé | `…-37-…`, `…-37b-…` | non ouvert | non vérifié | non |
| 38 idée liée à À venir | `d1280-clair-38-supprimer-idee-liee.png` | Dialogue « Supprimer le carnet Frigo de garde pour fûts ? », « 1 lien le retient », « À venir · ZZ TEST — Frigo… », bouton « Garder le plan sans ce carnet » ; Supprimer grisé ; Garder noir | oui (compteur, réglage et Supprimer grisé visibles ; contraste de Supprimer faible) | oui, clair |
| 39 clavier ouvert 300 px | non joué au banc (CARNET-CLAV) | non joué | non | non |
| 40 IA en cours | `d1280-clair-40-ia-en-cours.png`, `…-40b-…` | non ouvert | non vérifié | non |
| 41 IA en échec | `…-41-ia-echec.png` | non ouvert | non vérifié | non |
| 42 IA éteinte | `…-42-…` | non ouvert | non vérifié | non |
| 43 hors ligne | `…-43-…` | non ouvert | non vérifié | non |
| 44 photo « non lue » | `…-44-…`, `…-44b-…` | 44b : ECHEC, la vignette « non lue » est absente après envoi | NON | non |
| 45 dictée | `…-45-dictee.png` | ECHEC : bouton « Dicter » introuvable | NON | non |
| 46 + volant · action | dev-local `…-46-plus-volant.png`, `…-46b-…` | non ouvert ; dev-local clair en ECHEC (« Nouvelle idée » introuvable) | non vérifié | non |
| 47 segment Stocks › Matériel | dev-local `…-47-…`, `…-47b-…` | non ouvert ; dev-local clair en ECHEC (radio « Matériel » introuvable) | non vérifié | non |
| 48 CARNET-COEUR (frigo, ventilation, évier) | dev-local `…-48-coeur-frigo.png` à `…-48f-…` | non ouvert ; ECHEC clair (« rigo » non trouvé) | non vérifié | non |
| 49 suppression v2, « Garder le plan » | `d1280-clair-49-garder-plan-sans-carnet.png` | Dialogue « Supprimer le carnet Frigo de garde pour fûts ? », « 4 articles, 2 façons et 1 note », « ni dans À venir, ni en commande ». Pas de « 1 lien le retient », pas de « Garder le plan sans ce carnet ». Ce n'est pas le cas lié | NON : l'état attendu n'est pas montré. À refaire, cas avec lien à venir | oui, clair |
| 49b, 49c, 49d | `…-49b-…`, `…-49c-…`, dev-local `…-49-…` | non ouverts | non vérifié | non |
| 50 plan réalisé, archiver | `…-50-realise-archiver.png`, `…-50b-…` | non ouvert | non vérifié | non |
| 51 aides éteintes | `…-51-…`, `…-51b-…`, `…-51c-…` | non ouverts | non vérifié | non |
| 52 comparer · 1 article | `…-52-comparer-1-article.png`, `…-52b-…`, `…-52c-…` | non ouverts | non vérifié | non |
| 52d comparer · écarté avec raison | `d1280-clair-52d-ecarter-raison.png` | Tableau 5 colonnes, « rangé par : tient 80 °C d'abord, puis le débit » ; 4e « moins bien partout » ; 5e « Lien sans aperçu · exemple.invalid · page non lue » (domaine seul, constat 5 de vision-3 toujours là) ; « Écartés · 1 : Ventilateur de plafond 130 cm » avec sa raison ; « écartée » (accord à vérifier) | oui (écartés et raison visibles). Le script l'a noté NON : à juger en pleine taille | oui, clair |
| 53 page de choix voie E | `…-53-page-voie-E-pleine.png`, `…-53-page-voie-E.png` | non ouvert | non vérifié | non |
| 54 bandeau de tâches | `…-54-taches-bandeau.png`, `…-54b-…` | non ouvert | non vérifié | non |
| 55 pastille « lié à » | `…-55-pastille-lie-a.png`, `…-55b-…`, `…-55c-sans-lien-sans-pastille.png` ; dev-local `…-55-…` | non ouverts | non vérifié | non |
| 56 idée du calendrier | dev-local `…-56-calendrier-plus.png`, `…-56b-…` à `…-56f-…` | `d1280-clair-devlocal-56e-carnets-idee-calendrier.png` : Matériel › Carnets (1), « Idée 1 », « ZZ TEST — idée du calendrier S47 », « Coller un lien ». Segments Parc · À venir 2 · Carnets 1 · Réalisés 0 | oui (l'idée arrive dans Carnets). Dev-local clair suspect (concurrence) | oui, clair (dev-local) |
| 57 icône de la bande, appui long | dev-local `…-57-bande-icone.png`, `…-57a-…` à `…-57e-…` | `d1280-clair-devlocal-57b-icone-touchee.png` : le carnet s'ouvre, « Idée · 18 nov. », « Ce qui compte : rien encore », « Façons : aucune », « Articles : aucun : collez un lien », « Notes : aucune », champ « Ajouter à idée du calendrier » | oui (toucher ouvre le carnet). Appui long et annulation non ouverts | oui, clair (57b seulement) |
| 99 retrait ZZ TEST | dev-local `…-99-retrait-zz-test.png` | non ouvert | non vérifié | non |

Résumé des états :
- Vus OK à l'œil et agissant : 1 (sombre), 4 (deux thèmes), 16, 26b, 38, 52d, 56e, 57b. Soit 8 états sur 57.
- Échec ou état non montré : 12, 12b, 35c, 36b (« Déplacer »), 44b, 45, 49. Ils sont à refaire ; 12 et 12b : le cadre doublon (G11) n'apparaît pas au banc, ce n'est pas une faute du rejeu seul.
- Non ouverts, donc non jugés : les autres états, y compris les 6 dev-local des passes clair (ECHEC en série, passe suspecte).

Gestes et constats de vision-3 :
1. Créer · après (7) : non ouvert, à reprendre.
2. Lien · après (18) : non ouvert, à reprendre.
3. Lien · pendant (16) : titre = nom du carnet. Corrigé à l'image.
4. Texte · pendant (11/12) : puces « Va dans » visibles. Corrigé à l'image.
5. Comparer (52d) : écarté et raison visibles. Reste : 5e affiche « exemple.invalid » en domaine seul.
6. Supprimer (36b, 38) : 38 vu avec « 1 lien le retient » et Supprimer grisé. 36b vu, « Déplacer » absent.
7. Non regardé : 46 des 60 fichiers de vision-3, toujours.

## Ce qui reste douteux

- Concurrence de deux `lancer.sh` : passes dev-local clair et captures datées 02:42 à 02:46 à relire après un passage propre.
- 49 : la capture ne montre pas le cas lié ; le script l'a jugé OK. À refaire avec un plan lié à À venir.
- 12 / 12b : le cadre doublon ne s'affiche pas avec la note de la fixture. Est-ce le rejeu ou le produit ? À juger par le pilote sur une vraie frappe.
- « écartée » en 52d : accord à vérifier, le mot est lu à l'échelle de la capture.
- Le contraste de « Supprimer » (36, 38) reste faible à l'image.
- Captures non ouvertes : une capture non regardée ne valide pas l'interface.
- Non refait ici : états ECHEC et non ouverts (voir tableau). Pas de nouveau passage, faute de temps dans ce tour.

## Erreurs console (1280)

- Clair banc : 0 `pageerror`, 18 `consoleError` (« Failed to load resource: net::ERR_FAILED », requêtes coupées). Journal : `erreurs-d1280-clair.txt`.
- Sombre banc : 0 `pageerror`, 11 `consoleError` (même cause). `erreurs-d1280-sombre.txt`.
- Clair dev-local : 0 `pageerror`, 4 `consoleError` (dont « [47] » et « [-] », ERR_FAILED). `erreurs-d1280-clair-devlocal.txt`.
- Sombre dev-local : 0 `pageerror`, 2 `consoleError` (ERR_FAILED, requêtes coupées). `erreurs-d1280-sombre-devlocal.txt`.
- Les ERR_FAILED sont les requêtes Google Fonts coupées par le rejeu, pas des erreurs de l'app. Aucun appel Gemini réel.

## Captures

- 1280 clair : 123 fichiers (89 banc, 34 dev-local). 1280 sombre : 99 fichiers (65 banc, 34 dev-local). Total 222 `d1280-*`.
- Ouvertes par ce passage : 13 (clair 04, 12, 12b, 16, 26b, 36b, 38, 49, 52d, dev-local 56e, 57b ; sombre 01, 04).
