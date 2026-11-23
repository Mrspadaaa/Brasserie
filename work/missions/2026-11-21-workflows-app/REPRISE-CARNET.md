# REPRISE — Carnet, défauts CRN-1 à CRN-21 (3e arrêt, ~175 k de contexte, 21.11)

Worktree `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`, branche `claude/port-carnet-1711`.
Défauts, texte entier : `Brasserie/work/missions/2026-11-19-carnet-tour3/voies/CRITIQUE-CARNET.md`. Captures du défaut : `…/voies/k2/final-head/` ;
maquette côte à côte (ra + p5f) : `…/voies/k1c/captures/*-cote.png`.
Scratch `S=C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/carnet-crn/`.
PIÈGES : antislashs mangés dans Bash → scripts écrits par Write (`$S/*.cjs`) ; fichiers en CRLF → `$S/rep.cjs` (rep(f, a, b), fin de ligne
respectée). Commit : `sh $S/commit2.sh "<msg>" <chemins>` (patch arbre contre index partagé, index temporaire, puis même patch sur
l'index partagé ; Co-Authored-By ajouté). Hunks de 2 défauts dans un fichier : défaire l'un par rep, commiter, le refaire.
Montage côte à côte : `node $S/montage.cjs $S/cote "nom=img1,img2,…"` (puppeteer, hauteur 900).

## Commits (tous par commit2.sh)
- `16c640590` CRN-1, `d7db6f6fb` CRN-3, `b62bd5d61` CRN-2, 4, 5, 6, 7, 8, 16.
- `7035c4889` CRN-9 : lien Matériel en une ligne « Dans À venir depuis le 16 nov. · Voir › » (CarnetOuvert, carnets.css `.cn-lien-ligne`),
  étapes 20/21 (`lienMateriel` : 1 ligne, titre non redit, ≤ 60 px, Voir → Matériel).
- `01cd598c9` CRN-10 : « Atelier » partout (modele.ts ⌘K « Carnet · Atelier » + synonyme « atelier r&d », plusEcran « Brassins › Atelier »,
  ProductionTab label, PagePlus « Atelier · N carnets » via `nbCarnets` = lireCarnets(creativeItems) dans App). `4f5071b07` son étape
  (+ versAtelier et porte 03 touchent « Atelier » exact / `[data-t="atelier"]`).
- `d5ca259f7` CRN-12 : aide « avant » seulement ≤ 4 carnets et exemples non déjà en carnet (`exemplesNeufs`, motCle) ; test critique4Fil.
- `92c9b8453` CRN-15 : `.cn-aide-clavier` masqué en (hover:none, pointer:coarse).
- `2febbe25d` CRN-14 : `majusculeFr(txt)` à la modification d'une note.
- `333c481bb` CRN-17 : valeursLues, texte « oui » sans unité → le nom seul ; « non » → « pas : nom ».
- `568af66f4` étape CRN-10 suite : versAtelier se rabat sur `[data-t=atelier]` (30 et 40 échouaient sur l'arbre).
- `a5032f1f7` CRN-13 : h2 « Atelier R&D » de CreativeLabTab retiré à 1280 ; étape CRN-13 (1280, après 40).
- TRANSVERSE-RESTE.md (Brasserie) : section CRN-11 et CRN-20 écrite pour la voie Calendrier (non commitée, worktree Brasserie).

## Preuves
- Étape 1 faite : arbre `PARCOURS CARNET OK` (CRN-4 vert, `$S/arbre2.log`).
- Étape 2 faite : montages `$S/cote/m1..m7.png` ouverts (390 clair/cave, 1280 clair/cave, côte à côte k1c) : CRN-1..8, 16 conformes.
- Runs lancés après CRN-15 (avant 14/17) : `$S/tour7b.log` (tag en-ligne/2026-11-21-tour7, doit être KO sur CRN-9, 10, 12, 15) et
  `$S/arbre3.log` (doit être OK). Résultat : tour7 ECHEC (22), rouge sur CRN-9 (x2), 10, 12, 15 ; arbre ECHEC (2) = 30 et 40, versAtelier (corrigé par 568af66f4, à rejouer), CRN-9/10/12/15 verts.
- vitest carnets (`tests/unit/carnet* tests/integration/carnet*`) : 58 fichiers, 803 verts, 1 todo (après CRN-17).

## Reste
1. Rejouer tour7 et arbre (CRN-13, 14, 17 jamais joués ; 30 et 40 à revoir verts) : `node scripts/parcours/carnet.mjs $S/tour7 --ref en-ligne/2026-11-21-tour7` et `… $S/arbre` en parallèle, ~8 min.
2. CRN-18 : `CarnetOuvert.tsx` l. ~759 `a?.veille?.active && …veille` : ne pas l'afficher si réalisé (`c.carnet.sortie?.etat === 'realise'`
   ou archivé) ; aussi CarteArticle l. 197 si utilisée là. Étape : Embouteillage ouvert, aucune « veille » hors `.cn-supprimer`.
4. CRN-19 : point orange x 8 y 797 à 390 (au-dessus de « Bord ») : situer par `document.elementFromPoint` dans un run, puis retirer ou
   justifier. Étape : aucun élément visible < 12 px de côté coloré en bas à gauche.
5. CRN-21 : après ajout d'une note (11b, 16b), la note rangée doit être au-dessus du champ du bas (scroll-margin comme `.cn-bandeau`
   carnets.css l. 306 : ajouter la note neuve / `.cn-note` neuve + scrollIntoView). Étape : bas de la note ≤ haut de `.cn-champ-zone`.
6. Fin : carnet.mjs OK ; vitest carnets ; `VITE_HOP_V4=on VITE_CARNET_IA=production npm run build` ; BUGS.md (worktree Brasserie)
   CRN-1..10, 12..17 (+ suivants) corrigés ; `node scripts/agents/controle-bugs.mjs` OK. `controle-choix.mjs` : ignorer (registre).

## Clos (4e session, 21.11)
- Tour7 (`$S/tour7d.log`) : ECHEC 25, rouge sur CRN-1..10, 12..19 ; 30 et 40 verts. CRN-21 vert sur tour7 (défaut venu après).
- Commits : `8dfb18cea` CRN-18, `e4dc48a80` CRN-19 (pastille dev-local en sr-only), `62f57f822` CRN-13 suite (h2 d'AtelierPorte),
  `be28359e1` CRN-21 ; Brasserie `032ea8d8e` TRANSVERSE-RESTE.md.
- Arbre (`$S/arbre7.log`) : PARCOURS CARNET OK ; vitest carnets 61 fichiers, 815 verts ; build HOP_V4 + CARNET_IA production vert ;
  BUGS.md CRN-1..21 corrigés (non commité) ; controle-bugs : BUGS OK.
