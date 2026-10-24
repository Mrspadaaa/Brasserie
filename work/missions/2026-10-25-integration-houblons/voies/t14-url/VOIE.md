# Voie t14-url — Les contrôles de ses choix lisent une adresse servie (#161, version minimale)

- Mission : 2026-10-25-integration-houblons
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 70 tours ; 3 essais par critère
- Dépend de : t1-branche-verte
- Décideur en cas de doute : pilote

## Objectif
Règle n° 1 dans l'app : aujourd'hui `controle-choix.mjs` et les contrôles qu'il appelle lisent tous `<dossier>/<route>/etat.html`
(fichiers construits) ; une fois les écrans portés, ils ne vérifieraient plus rien (R8). Version minimale du verdict (D65) :
un **résolveur commun** de page cible (fichier construit ou adresse servie), et `controle-choix.mjs --url=<adresse>` qui rend
CHOIX OK sur la maquette servie par HTTP, avec un témoin négatif qui échoue.

## Entrées
- `work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs` et le registre `work/refonte-frontend/v4/choix/ecrans.json`
  (les contrôles appelés par écran, avec `{dossier}`).
- `work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs` et les contrôles cités par le registre.
- `prototypes/houblons-v4/parcours/outils/construire.mjs` (`--sortie=` sous `maquettes/` seulement : voir
  ETAT-DES-LIEUX § Mesures) ; `prototypes/houblons-v4/parcours/src/coquille/pages.ts` (une page par route).
- `cerveau/decisions/2026-10-25-integration-architecture.md` § Angles morts (repères `data-*` communs à la maquette et à l'app).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/tournoi/outils/lib/` (le résolveur commun, neuf)
- `work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs` et les contrôles qu'il appelle par le registre, pour y brancher le résolveur
- `work/refonte-frontend/v4/tournoi/outils/servir.mjs` (serveur statique de test, neuf) et `work/refonte-frontend/v4/tournoi/outils/temoins/choix-url-*/`
- `prototypes/houblons-v4/maquettes/parcours-t14/` (construction de test, ignorée par git)
- `work/missions/2026-10-25-integration-houblons/voies/t14-url/`

## Consignes
1. Le résolveur rend, pour (cible, route), l'adresse à ouvrir : `file://…/<route>/etat.html` pour un dossier, `<adresse>/<route>/etat.html`
   ou l'adresse de l'état de départ pour un serveur. Les contrôles gardent leur forme actuelle par défaut (rien ne casse) ;
   `--url=<adresse>` les fait passer par HTTP.
2. `servir.mjs <dossier> [--port=0]` : un petit serveur statique (Node `http`, sans dépendance neuve) qui imprime son adresse.
3. Construis la maquette dans `prototypes/houblons-v4/maquettes/parcours-t14` (`construire.mjs --sortie=…`) ; jamais dans `maquettes/parcours` ni `parcours-legende` : une autre voie y travaille.
4. Témoin négatif : une copie servie où un de ses choix manque (par exemple la légende de l'étape retirée, ou un écran remplacé
   par une version rejetée) → `CHOIX ECHEC`. Garde ce témoin dans `temoins/choix-url-*/`.
5. Ne change rien aux contrôles hors de ce que le registre appelle. Rien dans `src/`.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Règle n° 1 : un contrôle de ses choix qui ne tourne plus est un contrôle mort (L13).
- Un critère n'imprime jamais son jeton sans condition (M10) ; aucun caractère de contrôle dans les scripts.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent. Réponse finale au pilote : une ligne.
