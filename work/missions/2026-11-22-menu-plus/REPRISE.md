# REPRISE — PLUS-MENU-COUPE et actions du + (22.11, arrêt à 150 k)

Code : worktree `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet` (branche claude/port-carnet-1711). Rien n'est commité.
Écrire ACTIONS.md et BUGS.md dans Brasserie (`work/missions/2026-11-22-menu-plus/ACTIONS.md`, `work/missions/BUGS.md`).

## Fait

1. Cause lue : `.plus-pile` (src/components/navigation/navigation.css) n'avait un `max-height` et un défilement qu'en paysage (`max-height: 520px`).
   En portrait, 14 lignes au Calendrier (8 actions de page + 5 communs + Compagnon + conversations) dépassent l'écran.
2. Contrôle écrit (nouveau, à moi) : `scripts/parcours/menu-plus.mjs` (phase `visible`, 3 tailles tactiles 390×660, 390×844, 844×340, option `--tailles`, `--theme`, `--onglets`, `--ref <tag>`, `--build <dossier>`)
   et `scripts/parcours/menu-plus-actions.mjs` (phase `actions`, écrite et vérifiée par `node --check` seulement, jamais lancée).
   Il mesure chaque `[role=menuitem]` : entière dans l'écran, ou dans la fenêtre du menu après `scrollIntoView` ; le menu dans l'écran ; le × libre ; un vrai glisser au doigt fait défiler.
3. ROUGE sur le tag `en-ligne/2026-11-22-tour9` (build gardé : `C:/Users/mrspa/AppData/Local/Temp/menuplus-build-bVhJwi`) :
   `KO VISIBLE Calendrier 390x660 clair : le menu sort de l'écran (haut -100, bas 544 sur 660) | 4 ligne(s) hors d'atteinte : Écriture, Facture, Vente, Recette`.
   Les autres onglets (Bord, Finances, Brassins) étaient justes à 660 sur le tag.
4. Correction (src/components/navigation/navigation.css, seul fichier de src touché) : `.plus-pile` reçoit
   `max-height: calc(100dvh - var(--main-navigation-height,2.5rem) - 76px - var(--plus-voile-haut,37px) - 8px)`, `overflow-y:auto`, `overscroll-behavior:contain`, barre de défilement cachée ;
   `data-sens='bas'` : `max-height: calc(100dvh - 120px)` ; 1280 : `max-height: calc(100dvh - 92px - …)` ; la règle paysage ne garde que `padding-right:2px` et les hauteurs de lignes.
   Ordre, couleurs, icônes inchangés. `column-reverse` : le défilement part du bas, la ligne contre le + reste là, le × est hors de la pile.
5. VERT sur l'arbre de travail (build gardé : `C:/Users/mrspa/AppData/Local/Temp/menuplus-build-FAAWAc`) : `ok VISIBLE Calendrier 390x660 clair : 14 lignes, menu défilant (499/619)` ; Bord, Finances, Brassins 390×660 ok aussi.

## Reste à faire (dans l'ordre)

a. Rejouer la phase `visible` complète sur le build vert, sans l'abandon : le script s'arrêtait sur « introuvable : Stocks » (le bouton de l'onglet porte une pastille « 24 »,
   le nom exact ne correspondait pas). Corrigé depuis par `prefixe: true` dans `menu-plus.mjs` et `menu-plus-actions.mjs`, pas encore relancé.
   `node scripts/parcours/menu-plus.mjs <dossier> --build C:/Users/mrspa/AppData/Local/Temp/menuplus-build-FAAWAc --phase visible --theme clair` puis `--theme cave`,
   puis `--tailles 1280x800` (liste du 1280, `forme liste`). Regarder les captures `menu-*-390x660-*.png` et `menu-calendrier-844x340-*.png` (deux-blocs : `!overflow-visible`, à vérifier de près).
   Surveiller : le voile flou `::before` est rogné par `overflow-y:auto` (juger sur capture ; si laid : le `::before` en `position: fixed`, ou une enveloppe) ;
   les ombres des pilules rognées à droite (ajouter `padding-right: 6px` si visible).
b. Lancer la phase `actions` (jamais jouée, à déboguer) : `node scripts/parcours/menu-plus.mjs <dossier> --build <build vert> --phase actions [--ligne cal-,bord-]` ; elle écrit `actions.json` et une capture par ligne.
   Les libellés des sous-onglets (`Recettes`, `Atelier`, `Volumes`, `Courses`, `Fûts`, `Matériel`, `Carnets`, `Impôt`, `Prix`) sont devinés ; la saisie « aboutit » n'existe que pour les 7 rangées du Calendrier
   (`aboutitRangee`) : à écrire pour idée, écriture (« Saisir sans justificatif », `#purchase-total`, `[aria-label="Pour quoi ?"]`, Enregistrer), facture (lecture simulée), vente (tuile 33 cl, Espèces, Encaisser),
   recette (assistant), brassin (recette puis lancer), article, fût, matériel, client, tarif (voir `chaines.mjs` pour les gestes).
   Lecture du code, à vérifier au rendu : `runPlus` (src/App.tsx l.742-790) envoie « Écriture » et « Facture » au même `setQuickAction('scan')` ; `ouvrirFeuille` pose `fenetre.du` (ou aujourd'hui) comme semaine ;
   « Noter une idée » → `ouvrirIdee(lundiPose)`. `houblon` et `article` ouvrent la même création. Rien d'écart prouvé à ce jour.
c. ACTIONS.md : tableau action → vue attendue → vue obtenue → aboutit oui/non ; chaque écart, une ligne dans `work/missions/BUGS.md` ; corriger les écarts mécaniques.
d. Captures 390 tactile et 1280, deux thèmes, ouvertes en image. `npx tsc --noEmit -p .` ; vitest des fichiers touchés (aucun test de src touché à ce jour) ;
   `scripts/parcours/calendrier.mjs` en arrière-plan sans timeout (il touche le + ? vérifier `plus`, l. 323).
e. Commit par index temporaire (`GIT_INDEX_FILE`, `read-tree HEAD`, seulement : `src/components/navigation/navigation.css`, `scripts/parcours/menu-plus.mjs`, `scripts/parcours/menu-plus-actions.mjs`),
   message terminé par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Puis `node scripts/agents/controle-bugs.mjs`.
   Ne pas toucher CalendrierTab.tsx : aucun défaut mécanique n'y est établi.
f. Ligne `PLUS-MENU-COUPE` de DEFAUTS-RECURRENTS.md : le contrôle est `menu-plus.mjs --phase visible` (rouge sur tour9 prouvé ci-dessus).

## Doutes

- La hauteur libre est calculée en CSS (écran − barre − 76 px − 37 px − 8 px) ; sur un vrai téléphone dont la barre d'adresse se replie, `100dvh` suit. Vérifier à 390×660.
- Le défilement rogne le voile flou de la pile (`::before`) ; non jugé sur capture.
