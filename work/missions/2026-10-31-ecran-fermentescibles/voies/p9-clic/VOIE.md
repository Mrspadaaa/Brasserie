# Voie p9-clic — le premier appui sous les tuiles ne se perd plus

Agent : auteur (Sonnet). Plafond : 40 tours. Pilote : Opus. Date : 01.11.

## Défaut, constaté en ligne par le pilote (01.11, version 5f224fc3)
Étape Malts/sucres, s1 dans l'app. Le champ d'ajout a le focus : les tuiles sont ouvertes sur deux colonnes, sous le champ (`.fer-tuiles`).
Un clic de souris sur un bouton placé plus bas (« Ajouter un cran » du plateau de la ligne, la fiche, etc.) n'a aucun effet au premier appui.
Cause lue dans `src/ui/fermentescibles/Ajout.tsx:153` : `onBlur={() => setOuvert(false)}` replie les tuiles dès le `mousedown`. La grille
(six tuiles, trois rangées) redevient une rangée de 32 px, la page remonte sous la souris, le `mouseup` tombe sur un autre élément : pas de `click`.
Au doigt, Chrome rejoue la même suite (mousedown, mouseup et click) au moment du toucher : le risque est le même.

## À faire
1. Dans `Ajout.tsx` seulement : replier les tuiles **après** l'appui qui a pris le focus, jamais pendant. Lecture prudente :
   - au `blur`, si un bouton de souris est tenu, attendre son `pointerup`, puis replier au tour suivant (`setTimeout(…, 0)`) ;
   - sinon (doigt, clavier), replier au tour suivant ;
   - au moment de replier, ne rien faire si le champ a repris le focus entre-temps ;
   - minuteries et écouteurs nettoyés au démontage (sinon « document is not defined » après les tests, voir 8ed18168, PageShell).
   Rien d'autre ne change : ni le dessin, ni les tailles, ni l'ordre, ni Échap, ni les tuiles (elles gardent leur `preventDefault`).
2. Un test unitaire dans `tests/unit/fermentescibles/` : focus du champ, `pointerdown` souris hors du champ puis `blur` : les tuiles restent ;
   `pointerup` puis tour suivant : elles se replient. Et un `blur` clavier les replie au tour suivant.
3. Le contrôle Chrome réel : un script `work/missions/2026-10-31-ecran-fermentescibles/voies/p9-clic/controle-clic.mjs`, sur le modèle de
   `voies/p8-port/capturer-malts.mjs` (même serveur, mêmes fixtures `?dev-local…`, jamais de donnée réelle) :
   une ligne posée, son plateau ouvert, le champ d'ajout focalisé (tuiles ouvertes), puis un vrai clic de souris
   (`mouse.down`, 120 ms, `mouse.up`) au centre de « Ajouter un cran » : la masse de la ligne augmente d'un cran. Même chose au doigt
   (`touchscreen.tap`) en 390 tactile. Sortie : `CLIC OK` ou `CLIC ECHEC n` et la liste.
   **Témoin négatif** : le script échoue sur la version de HEAD (`git show HEAD:src/ui/fermentescibles/Ajout.tsx` vers `os.tmpdir()`, remis à
   la place le temps du témoin, puis ta version remise) ; noter les deux sorties dans RESULTAT.md.

## Possède
`src/ui/fermentescibles/Ajout.tsx`, `tests/unit/fermentescibles/`, `work/missions/2026-10-31-ecran-fermentescibles/voies/p9-clic/`.
Rien d'autre. Pas de commit, pas de build de production, pas de déploiement. Serveur de dev seulement dans ce dossier de travail
(jamais dans `C:/Users/mrspa/Documents/Brasserie`), par `scripts/with_server.mjs`. Ne touche jamais `.codex/hooks.json`,
`source4-portable-bundle-manifest-01.json` ni `functions/.env`.

## Critères (le pilote les rejoue)
- `npx tsc --noEmit -p . && echo TYPES OK` → TYPES OK
- `npx vitest run tests/unit/fermentescibles --maxWorkers=2 && echo TESTS MALTS OK` → TESTS MALTS OK (toute la liste de la voie, L17)
- `node scripts/audit_inputs.mjs` → INPUT PROTECTION AUDIT PASSED
- `node scripts/with_server.mjs --server "npm run dev -- --port 5616 --strictPort" --port 5616 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-10-31-ecran-fermentescibles/voies/p9-clic/controle-clic.mjs` → CLIC OK
- La série de p8 tient toujours : `node scripts/with_server.mjs --server "npm run dev -- --port 5615 --strictPort" --port 5615 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-10-31-ecran-fermentescibles/voies/p8-port/capturer-malts.mjs --sortie=<os.tmpdir()>/p9-malts` → MALTS OK
  (si MALTS ECHEC, dire lesquels, et s'ils échouaient déjà sur HEAD)

## Retour
`voies/p9-clic/RESULTAT.md` : le diff en une phrase, les sorties des critères, les deux sorties du témoin. Puis une ligne :
`P9 OK — <résumé>` ou `P9 ECHEC — <raison>`. `LEÇON PROPOSÉE : …` si une erreur de méthode apparaît.
