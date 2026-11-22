# Brief v2 — zq1 apaisée (15.11)

Ses mots (SPEC, 15.11) : « zq1 Le fil du temps — J'aime bien mais un peu "stressant" c'est le plus pratique mais le plus anxiogène ».
M = `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-materiel`.

## Base (règle n° 1 : sa maquette retenue, reprise telle quelle)
`M/v1/z/zq1/etat.html` (assemblée depuis `parts.html` par `M/voies/p2-z1/build.mjs`) et ses 7 captures `zq1-*.png`, NOTE.md.
On garde la structure qui l'a convaincu (« le plus pratique ») : le fil vertical du temps à sa vraie distance, le point
« aujourd'hui », les gestes à droite de chaque ligne (Réparée, Étalonner, Fait, 44 px), Achat / Déjà possédé / Projets visibles,
la fiche du pH-mètre en fil (saisie des tampons, rythme, état, dépenses), les données et dates (14.11.2026).
Tout le reste du BRIEF-AUTEUR.md §1 à §5 vaut toujours (coque de l'app identique, 60 mots, 12 px, 44 px, inconnu jamais 0, total honnête).

## Ce qu'on retire : l'anxiété. Une lecture par variante (L13 : plainte ambiguë → un axe de variantes)
- **za1 · la couleur** : le rouge réservé à la seule panne ; un retard ou un étalonnage dû en ambre doux, sans hachure ni
  pastille clignotante ; fond neutre ; le compteur « À traiter » en gris, pas en badge rouge.
- **za2 · l'ordre** : le fil part du calme : en tête « 9 appareils en ordre · prochain le 01.12 », puis l'avenir ; ce qui est dû
  est rangé dans un seul bloc « 4 gestes cette semaine », replié par défaut ou en bas, ouvert d'un toucher.
- **za3 · les mots** : plus de compteur de jours de retard (« retard 6 j », « panne 9 j ») au premier plan : une date et un verbe
  (« étalonner · prévu le 08.11 », « pompe à réparer · depuis le 05.11 ») ; ton de carnet d'atelier, pas d'alarme ; « fait » félicite
  sobrement (« ✓ à jour jusqu'au 14.12 »).
- **za4 · une chose à la fois** : un seul « prochain geste » mis en avant (le plus utile), les autres dus en lignes simples sans
  bouton fort ; le fil plus aéré ; la partie « dû » ne prend pas plus d'un tiers du premier écran.
Une variante peut emprunter un peu à une autre, mais garde sa lecture dominante, écrite dans sa NOTE.

## États (images 390, plus cave et 1280)
`repos`, `geste` (fiche du pH-mètre), `traiter` (À traiter, juste après un « Étalonné »), `ajout`, `vide`, `repos` cave, `repos` 1280.
Captures : `node M/socle/capt.mjs v2 repos,geste,traiter,ajout,vide,repos-1280 <id>`.

## Interdits
Une variante = `M/v2/<id>/etat.html` autonome, classes préfixées `<id>-` (L26), aucune ressource distante. Rien dans `src/`,
aucun serveur, aucun commit, pas de `git stash`. Fichiers par Write. Ne jamais toucher `.codex/hooks.json`, `functions/.env`.
