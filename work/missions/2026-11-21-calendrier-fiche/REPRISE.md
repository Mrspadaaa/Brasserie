# Reprise — fiche du Calendrier, 12 mini maquettes (21.11)

Demande : voir le brief du pilote (CAL-FICHE, `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`). Le skill `maquettes` n'a pas de SKILL.md dans ce dépôt ; la méthode suivie est `docs/agents/systeme.md` § « Méthode maquettes » et `.claude/workflows/maquettes.js`.

## Fait
- `decor.mjs` : en-tête (−683 CHF à dépenser S50, ±, An, ⏱7, Trier, œil, plein écran), courbe, mois, frise et barres communes à toutes les versions (Brassins : Blonde d'automne, Jhhh, NEIPA Test ; Fêtes : Marché de Noël, vi ; Ventes, Achats, Travaux, Activités, Papiers), onglets, + volant. États statiques par `:target` : `vNN.html` = repos (NEIPA Test), `#edition`, `#limite` (Jhhh). Deux thèmes par `prefers-color-scheme`.
- `versions.mjs` : 12 fiches, classes préfixées `fvN-` : v01 frise des phases, v02 pastilles chiffrées, v03 ligne compacte (édition = frise Durée), v04 carte à volets, v05 barre loupe (début tiré dans le passé), v06 anneau, v07 ticket, v08 étagère type épicerie, v09 fil des dates, v10 bulle sur la vraie barre, v11 volet de taille fixe, v12 jauges de cuve. Édition : vi (v03, v05, v07, v10, v11), NEIPA prête 12 déc. (v01, v02, v06, v09, v12), phase garde de Jhhh (v04, v08).
- `build.mjs` (écrit vNN.html et vNN-paysage.html), `mesure.mjs` (captures JPEG ×2 dans `captures/` : vNN-repos, -edition, -limite, -repos-cave ; mesures).
- `ref/` : captures 11, 15, 16, 17, 18 copiées.

## Preuves
- `node scripts/agents/controle-base.mjs calendrier work/missions/2026-11-21-calendrier-fiche/vNN.html --dures --statique` : les 12 sortent BASE OK, DURES OK, STATIQUE OK (G5 corrigé : paysage S40 → S1).
- `node work/missions/2026-11-21-calendrier-fiche/mesure.mjs` : MESURE OK (fiche au repos 52 à 238 px de haut, ≤ 338 ; 0 à 5 mots courants ; 2 ou 3 valeurs modifiables ; aucun texte < 14 px ; pas de débordement).

## Reste à faire
1. Ouvrir les captures (pas encore regardées) : planches 4 versions par image possibles avec `scratchpad/shot.mjs` ; juger comme PORTRAIT.md, corriger une fois (`node build.mjs`, puis contrôles et mesure).
2. Écrire `choix-fiche.html` à la main : titre daté 21.11, ses mots en haut (« L'édition, detail est franchement mal fait. Pas compact, pas visuel, vraiment à revoir complète », « trop de text et pas assez de visuel », « tailles fix », « Ça, ça fonctionne bien… date dans le passé »), `#a-choisir` au premier écran, références `ref/capture-15.jpg`, `-16`, `-17`, puis par version : idée (champ `idee` de versions.mjs), 4 captures ≥ 340 px de large (rangée défilante), bouton « je prends » et note ; script `window.claude.use('db')` comme `../2026-11-21-workflows-app/choix-workflows-2.html` (doc `choix/fiche-vNN`, note générale), repli localStorage.
3. `node scripts/agents/verifier-page.mjs work/missions/2026-11-21-calendrier-fiche/choix-fiche.html --page-lot --captures <préfixe>` → PAGE OK ; ouvrir ses captures.
4. Commit par chemins : `git add -f work/missions/2026-11-21-calendrier-fiche/{*.html,*.mjs,REPRISE.md,captures,ref}`, message terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ».

## Clos (21.11, reprise)
- Captures regardées (planches 4 états par version). Corrigées une fois : v01 (bulle 12 déc. coupée, 3 sept. collé au bord), v05 (étiquette « 28 sept. · S40 » coupée à gauche), v06 (anneau absent au repos : dégradé invalide), v07 (ligne d'achat de Jhhh par-dessus le ticket), v11 (volet hors de `.app` : états ignorés, fiche en double).
- Après correction : v06 toujours sans anneau au repos → écartée (KO, jamais candidate). OK : v01 à v05, v07 à v12 (11). BASE, DURES, STATIQUE OK ; MESURE OK.
- `choix-fiche.html` écrite à la main : PAGE OK (48 images, 390 et 1280), captures ouvertes. Docs `choix/fiche-vNN` et `choix/fiche-general`, repli localStorage `choix-fiche-cal`.
- Prochaine action : montrer la page au brasseur ; port de la version choisie (CAL-FICHE, CAL-MODIFIER).
