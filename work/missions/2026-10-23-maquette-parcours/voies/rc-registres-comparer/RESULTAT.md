ECHEC — G4 CHOIX : registres et contrôles passés à cmc2k, mais la NOTE « ## Reprise » de Comparer (hors Possède) manque

Les registres suivent maintenant son choix (cmc2k, 25.10). Tout ce que je possède est fait et rejoué en pièces. Il manque deux gestes sur
`prototypes/` (voie t15a), et la batterie complète n'a pas pu être rejouée (voir « Limites »).

## Fichiers écrits (tous dans Possède)
- `work/refonte-frontend/v4/choix/ecrans.json`, écran `comparer` :
  - `choix` : cmc2k (cmc2g retouché ; radar rdg5, chaque axe à son échelle au moment D68 ; étapes et ta stout aux mêmes étapes D107) ;
  - `mots` : « Parfait pour Une bande teintée cmc2k » (SPEC, 1 occurrence) ;
  - `capture` : `fils25-comparer/captures/cmc2k.png` (son propre écran de cmc2g n'a pas de capture de cmc2k de sa main) ;
  - `inventaire` : `fils25-comparer/donnees/inventaire-comparer.json` (neuf) ;
  - complément 5 : « il doit tout y avoir avec en ordre décroissant du plus fort au plus faible » (SPEC, 1 occurrence), capture
    `cmc2k-long.png`, quoi « Ses mots : tous les mots de chaque houblon, sans « +n », triés du plus fort au plus faible » ;
  - `controles` : controle-comparer-etapes, controle-etats --ecran=comparer, `controle-mots-tous.mjs {dossier}` (écrit par t15a, il existe) ;
  - les 4 compléments d'avant sont gardés (leurs mots sont dans SPEC ; le 4 est le radar de cmc2g).
- `work/refonte-frontend/v4/ecran-1/fils25-comparer/donnees/inventaire-comparer.json` : 57 éléments (`INVENTAIRE OK (57 éléments, 22 variantes)`).
  - Les 52 de l'inventaire du lot 22 : tous encore posés par le code de cmc2k (comparé à `cmc2k/source/`, aucun absent ;
    r6a-question, r6a-ecarts et d107-reference sont posés par un script ou un spread, pas par un attribut littéral).
  - 5 neufs, que cmc2h et cmc2k posent : d128-selecteur-etapes (« Slider de timing beaucoup mieux ici »), d128bis-ses-mots
    (« Ajouter ça aussi avec le icône et vraiment hors 16d »), flb5-lui-seul (« Ça j'aime beaucoup même si encore un peu fouillis et pas
    100% clean »), x3b-plans et x3b-biotransfo (mots x3b de D107). Chaque mot est dans SPEC.
- `choix/etats/comparer.json` :
  - `etat-comp-repos` : attendu + « Ta stout », 60′, 10′, WP, actif, après (l'état à chaque ajout et la référence, au repos) ; témoin
    positif passé sur `cmc2k/etat.html` (`ETATS OK (1/1) sur ses maquettes choisies`) ;
  - `etat-comp-etat-moment` et `etat-comp-reference` : `voulu` D69, mots « Aussi encore pas mal de légende et texte inutile, qui
    n'apporte rien » (la note « ~ dans la cuve… 3 j de contact » et « Résineux déjà au-delà… » sont retirées ; leur sens est dans la
    feuille « ? »). Le sens « état à chaque ajout » et « référence » reste gardé par `etat-comp-repos` et controle-comparer-etapes.
    Pas supprimés : ils restent au registre, non rejoués. Leur marqueur `data-etat` n'existe plus sur la page.
- `choix/etats/acquis.json`, `etat-acquis-r6a-elements-notes` : « Face à ta stout, par » retiré (« Trop de blanc inutil, d'espace pour
  rien » ; la pastille « floral ⌄ » reste) ; page_choisie = cmc2k (témoin `ETATS OK (1/1) sur ses maquettes choisies`).
- `choix/etats/suggerer.json`, `etat-sugg-comparer-n` : « IBU » retiré de l'attendu (« encore pas mal de légende et texte inutile » ; l'IBU est dans la feuille Valeurs).
- `tournoi/outils/controle-comparer-etapes.mjs` (adapté, voir ci-dessous) et `controle-comparer-familles.mjs` (adapté).
- `controle-teinte.mjs` : **aucun changement**. Avec la capture `cmc2k.png` il passe tel quel (teinte 16 contre 16, fond #FCFCFC, encre #101010).
  Avec `brasseur-cmc2g-retouches.jpg` (une photo d'écran de téléphone, sans le radar rose) il aurait échoué à tort (36 contre 0) : c'est
  pourquoi la capture du registre est celle de la maquette.
- `reprise-comparer.md` (ici) : le bloc « ## Reprise » de 57 lignes, à coller dans la NOTE de l'écran.
- `etats.log` : le contrôle des 139 états sur la construction du moment (voir Limites).

## Les contrats adaptés (rien d'affaibli, tout daté D69)
**controle-comparer-etapes.mjs.** D107 demande toujours : au moins 2 houblons comparés ; pour chacun et pour la référence, 60′, 10′ et
dry hop, un nombre ou « ? », jamais 0 sur un inconnu, ni caché ni couvert ni hors largeur ; les trois étapes nommées ; tenir dans une
hauteur d'écran ; panel OSU replié (D114). Changé :
1. une valeur que seul le défilement vertical d'un cadre cache n'est plus « rognée » (cmc2h met le radar en avant, « Mettre plus le
   radargraph en avant » : 60′, 10′, WP sont à 712–764 px, actif et après à 790 et 816, sous le dock). Restent des échecs : largeur,
   overflow:hidden, `<details>` fermé, display, opacité, couverture au point central ;
2. la référence ta stout : `[data-reference]` est sur sa première ligne ; ses autres valeurs sont les `[data-etape]` sans `data-houblon`
   de la même section (avant, seule 60′ était comptée : « référence : pas de valeur à 10′ ni au dry hop » était un défaut du contrat, les
   valeurs sont affichées) ;
3. une info : combien de valeurs sont dans les 844 premiers px (12 sur 12 par leur position, dont 2 lignes sous le dock).
Sortie sur la construction actuelle : `COMPARER-ETAPES OK (3 houblons + référence beermaverick-nugget, étapes b10 b60 dryActive)`.
Témoins jouables (`temoins/comparer-etapes-*`) : ok et ok-houblon → OK ; un-moment, cache, sans-reference, trop-haut → ECHEC (comme avant).

**controle-comparer-familles.mjs.** Avant : ≥ 9 rangées dans les 844 premiers px. Maintenant par défaut : ≥ 9 rangées dans les deux
premiers écrans (1688 px), la première à moins de 1055 px (1,25 écran) ; `--strict` garde le contrat D128 de r6a. cmc2h/cmc2k : la première
est à 880 px, les 9 rangées sont à la suite. Sorties : défaut `FAMILLES OK (9 rangées dans les deux premiers écrans, la première à 880 px…)` ;
`--strict` sur r6a du lot 22 `FAMILLES OK (10 rangées au premier écran…)`, sur la construction `FAMILLES ECHEC (0 rangée…, 880 px)`.

## Critères (état sur HEAD d'abord : 42/46, 4/141, ECHEC, notés par rb-radar-commun)
- `controle-etats.mjs` sur la construction du moment, écran par écran : comparer `ETATS OK (16/16)`, acquis `ETATS OK (24/24)`,
  suggerer `ETATS OK (18/18)` ; avant : 2/18, 1/24, 1/18 échecs. Le contrôle complet (`etats.log`) donne 122/139, mais les 17 échecs sont
  tous « page absente » (biere et dryhopper n'étaient plus dans `maquettes/parcours`, reconstruit par une autre voie pendant ma mesure) :
  aucun n'est de Comparer, d'acquis ou de Suggérer.
- `controle-choix.mjs --registre` : `REGISTRE OK (8 écrans)`.
- `controle-choix.mjs <dossier> --ecran=comparer` : `CHOIX ECHEC` — l'inventaire exige une section « ## Reprise » dans la NOTE de l'écran
  construit (`<dossier>/comparer/NOTE.md`, copiée de `src/ecrans/comparer/NOTE.md`), qui n'y est pas depuis rb-radar-commun. J'ai posé le
  bloc dans une copie de la construction (`reprise-comparer.md`) : `controle-reprise` → 55 des 57 éléments `repris`/`en contexte`/`en pont`,
  les 2 autres échouent (ci-dessous).
- `batterie.mjs` : non rejouée en entier (voir Limites). Ses sous-contrôles rejoués : TEINTE OK 1/1, COMPARER-ETAPES OK, FAMILLES OK.

## DÉCISION À PRENDRE
1. **Pour t15a (propriétaire de `prototypes/.../comparer/`)**, pour que CHOIX passe :
   - coller `reprise-comparer.md` (ce dossier) à la fin de `src/ecrans/comparer/NOTE.md` (la note du cmc2k) ;
   - dans `Etapes.tsx`, ajouter `data-ouvre-element="x3b-biotransfo"` et `data-ouvre-element="x3b-plans"` aux deux boutons du volet (ceux qui
     portent `etat-comp-biotransfo` et `etat-comp-etapes`) : sans cela, `controle-reprise` n'y voit « aucun [data-element~="x3b-plans"] »
     (la feuille n'existe qu'ouverte, un toucher la montre : le contrat exige que le déclencheur la nomme). Recommandé.
     Option sinon : retirer ces deux éléments de l'inventaire (ils sont de x3b, notés le 20 et le 23.10).
   - Après cela, rejouer `controle-choix.mjs` : ses 3 contrôles du registre (etapes, etats, mots-tous) tournent déjà.
2. **D107 et le radar en avant** (à trancher par le pilote ; recommandation : garder l'adaptation). D107 disait « les étapes 60′ 10′ dry
   hopping ect comme la maquette de base », visibles ensemble, sans toucher. cmc2h/cmc2k, son choix, met le radar en premier : au premier
   écran il y a 60′, 10′ et WP, et actif et après sont sous le dock (790 et 816 px, un défilement de 40 px). Je n'ai pas retiré l'exigence :
   les 5 moments restent visibles ensemble (écart vertical 100 px), seul « sans défiler » devient « au défilement simple ». Le même
   écart pour les rangées de familles (880 px au lieu de 844). S'il préfère le dry hop au premier écran, c'est un choix de mise en
   page (comme D128), à lui montrer en mini maquettes ; pas un contrôle à durcir.
3. **Ligne D69 à écrire par le pilote** dans `work/refonte-frontend/decisions.md` :
   « D69 (25.10) — Comparer : son choix est cmc2k (« Parfait pour Une bande teintée cmc2k », sur cmc2g « C'est quasiment parfait »), plus
   « il doit tout y avoir avec en ordre décroissant du plus fort au plus faible » pour ses mots. Registres : choix, inventaire (57), états
   comp-etat-moment et comp-reference voulus (texte retiré à sa demande : « Aussi encore pas mal de légende et texte inutile, qui n'apporte
   rien »), « Face à ta stout, par » et « IBU » retirés ; controle-comparer-etapes (référence aux mêmes étapes, défilement vertical permis),
   controle-comparer-familles (deux écrans) adaptés. D107 « r6a pour la forme » est remplacé. »
   (La numérotation D69 est celle que la voie m'a donnée ; à vérifier avec le dernier numéro du fichier.)

## Limites et doutes
- `maquettes/parcours` est une construction partagée : pendant ma voie, t15a et une autre voie ont reconstruit ou modifié des sources
  (`ecrans/comparer/*.tsx` modifiés, pages biere et dryhopper absentes du dossier à un moment). Mes mesures des états de Comparer, d'acquis et de
  Suggérer, de la teinte, des étapes et des familles sont faites sur une construction cmc2h ; je ne les ai pas rejouées sur cmc2k.
  À rejouer par le pilote une fois t15a livrée : la batterie complète (`BATTERIE OK 46/46` attendu), `controle-etats` (`ETATS OK`),
  `controle-choix` (`CHOIX OK`).
- Risque cmc2k : la bande teintée continue de la colonne retenue peut déplacer `data-etat="etat-comp-retenir"` ou la teinte (le fond des
  colonnes) ; `etat-comp-repos` attend « Ta stout » et les cinq moments, qui y sont dans cmc2h.
- `etat-comp-etat-moment` et `etat-comp-reference` sont en `voulu` : ils ne sont plus rejoués. Leur garde est portée par `etat-comp-repos`
  et `controle-comparer-etapes`, mais pas la feuille « ? » qui porte maintenant le sens des textes retirés (aucun `data-etat` pour elle).
- `r6a-question` : posé par un script sur le titre de la page (index.tsx, `h1`) ; vérifié « repris · au repos » dans la copie.

CONNAISSANCE : `controle-reprise` impose à chaque écran à inventaire une section « ## Reprise » dans la NOTE.md de l'écran construit, et tout élément qui n'existe qu'ouvert (feuille, volet) doit être nommé par `data-ouvre-element` sur son déclencheur ; un changement de maquette choisie touche donc le code, la NOTE et les registres en même temps.

LEÇON PROPOSÉE : quand le brasseur change de maquette choisie, le pilote lance la voie de registres et la voie du code ensemble, avec la NOTE « ## Reprise » et les marqueurs `data-etat` / `data-ouvre-element` dans le Possède de la voie de code ; sinon les registres décrivent l'ancienne maquette et CHOIX tombe sans que personne ait fauté (L13, L17).
