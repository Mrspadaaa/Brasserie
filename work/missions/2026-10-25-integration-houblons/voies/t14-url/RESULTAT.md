OK — controle-choix.mjs --url=<adresse> rend CHOIX OK sur la maquette servie ; témoin servi en CHOIX ECHEC

## Fichiers écrits
- `work/refonte-frontend/v4/tournoi/outils/lib/cible.mjs` (résolveur commun, neuf) : `cibleDe`, `environnement`, `adresseDePage`, `versUrl`, `existe`, `lire`, `liste`.
- `.../lib/sonde.mjs` (sonde HTTP synchrone, HEAD/GET, pour `existe` et `lire`).
- `.../servir.mjs` (serveur statique Node `http`, sans dépendance ; GET/HEAD ; `superposition.json` = fichiers d'une base complétés par le dossier).
- `.../controle-choix.mjs` : option `--url=<adresse>` (+ `--gabarit='{adresse}/#/{route}'` pour une app dont la route n'est pas `<adresse>/<route>/etat.html`). Sans `--url`, forme d'avant.
- Les 16 contrôles que le registre appelle (`controle-reprise`, `-stepper`, `-geste-etape`, `-appui`, `-legende`, `-legende-v2a`, `-profil-ouvre`, `-etats`, `-fonctions-rail`, `-visee`, `-traits`, `-comparer-etapes`, `-fiche`, `-fiche-baseline`, `-fiche-radar`, `-annuler`) : `pathToFileURL`→`versUrl`, `fs.existsSync`→`existe`, `readdirSync`→`liste`, et `lire` pour NOTE.md. Sans l'environnement de la cible, ces fonctions retombent sur `fs` / `file://` : comportement identique. Un seul changement de fond : `controle-appui.mjs --etape` lisait le `touch-callout` des feuilles de style seulement en `file:` ; il lit aussi celles de la page servie (fetch dans la page).
- Témoin : `.../temoins/choix-url-legende-retiree/` (`superposition.json`, `ma-biere/etat.html` avec un `<style>` qui masque `[data-role="legende-bande"]` et `[data-role="bande-ouverte"]`, `LISEZ-MOI.md`).
- Construction de test : `prototypes/houblons-v4/maquettes/parcours-t14/` (ignorée par git). Rien dans `src/`, rien dans `maquettes/parcours` ni `parcours-legende`.

## Fonctionnement
En mode adresse, `controle-choix.mjs` donne à chaque contrôle un « dossier virtuel » (chemin inexistant sous `os.tmpdir()`) et l'adresse par l'environnement (`AFFINEE_CIBLE_URL`, `AFFINEE_CIBLE_RACINE`, `AFFINEE_CIBLE_GABARIT`). Les contrôles gardent leurs `path.join(dossier, route, 'etat.html')` ; le résolveur les traduit en `http://…/<route>/etat.html` (ou en gabarit). Les fichiers de référence du dépôt (v2a.html, inventaires, SPEC) restent lus en local.

## Critères
- G1 `node work/missions/2026-10-25-integration-houblons/voies/t14-url/verifier.mjs` → `URL OK` (code 0). Détail : maquette servie `CHOIX OK (7 écran(s) conforme(s) à son choix ; 1 ouvert(s) : levure …)` ; témoin `CHOIX ECHEC` sur l'étape Houblons (controle-legende : « la légende ne nomme pas 12 icône(s) sur 12 » ; controle-legende-v2a : lignes ◇ et fiches vides). Le témoin échoue donc pour la légende retirée, pas pour une page absente. Durée : environ 13 min (6 min par passage complet).
- G2 `node …/controle-choix.mjs --registre` → `REGISTRE OK (8 écrans)`.
- Mode fichier après modifications : `controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-t14` → `CHOIX OK (7 écran(s) … 1 ouvert(s)…)`, code 0 (même résultat qu'avant mes modifications sur la même construction).
- Essais : 1 par critère. Deux corrections en cours de route : (1) `controle-choix.mjs` lui-même n'avait pas les variables dans son propre `process.env` (« page absente » à tort) ; (2) la lecture des feuilles de style de `controle-appui --etape` (témoin : faux A9 « touch-callout absent »).

## Doutes et limites
- Seule la forme « dossier de pages `etat.html` servi » est prouvée de bout en bout. `--gabarit` (app à une page) est écrit et lu par le résolveur mais n'a pas été joué sur l'app : il faudra les repères `data-*` communs (cerveau/decisions/2026-10-25-integration-architecture.md) et une route de l'app qui rend l'état de départ.
- Un contrôle appelé directement avec une adresse (`controle-appui.mjs http://…`) n'est pas prévu : on passe par `controle-choix.mjs --url`.
- `existe` fait une requête HEAD via un sous-processus Node (mémorisée) : ~50 ms par page, sans effet sensible sur la durée.
- Une autre voie jouait `controle-choix.mjs` sur `maquettes/parcours` en même temps (CPU partagé) ; mes passages sont verts malgré cela.
- Non faits : `systeme.mjs appels controle-appui.mjs --rejouer` (rappel du hook) n'a pas été lancé ; le pilote peut le rejouer. `controle-legende-v2a.mjs` était déjà non suivi par git (`??`) : je l'ai modifié comme les autres.
- Aucun caractère de contrôle dans les scripts écrits (grep sur lib/, servir.mjs et controle-*.mjs).

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : un contrôle de maquette qui lit une feuille de style en `file:` ne voit rien sur une page servie ; tout accès disque d'un contrôle (CSS, NOTE.md, listing de dossier) doit passer par `lib/cible.mjs` pour que la règle n° 1 tienne sur l'app.
LEÇON PROPOSÉE : aucune
