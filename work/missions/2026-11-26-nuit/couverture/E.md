# Couverture tranche E (27.11, passe 2) — banc local seulement, 390 × 844 tactile, `bloquerExterne: true`, aucun fichier de src/ ni tests/ touché

Dossier : `C:\Users\mrspa\AppData\Local\Temp\claude\b544ff255d45c8a5\b8d55cb5-6273-4076-b363-d67bfb7c3518\scratchpad\couverture-E\`
Scripts : `lib2.mjs` (aides : toucher, feuille, journal), `e1` à `e9.mjs`. Captures PNG dans le même dossier.
Plafond de tours atteint : la tranche est INCOMPLÈTE. Voir « DEMANDE EXECUTANT » pour la suite.

## 1) Tableau

| écran (id) | banc | gestes joués | constats | statut |
|---|---|---|---|---|
| page-recette | local `?preview=brew&view=recette` | Exporter (feuille, Copier → « Recette copiée », « Texte complet et fichier .txt » déplié : texte de 6 lignes + Télécharger .txt), Échap sur la feuille, ouverture des 9 sections (Houblons, Vermont IPA, Grain, Empâtage, Ébullition, Eau, Fermentation, Déroulé, Brassins) au toucher, défilé au bout avec tout ouvert (chevauchements et éditions : rien), Dupliquer et Modifier (le banc les remplace par un journal et par l'assistant) | aucun nouveau | partiel : le Dupliquer réel (`App.tsx` l. 1191 : ouvre l'assistant avec « (copie) ») n'est pas joué, le banc ne fait que journaliser « Duplication » ; Supprimer non joué |
| page-brassin-du-jour | local `?preview=brew&view=brassage` | curseur « Eau d'empâtage » au glisser (50 → 90 %, 90 → 0 %, 0 → 50 %), −0,1 / +0,1, Enregistrer (63,8 °C) ; onglets Journal et Recette (captures `j4-*`, texte lu) ; feuille « Mesurer » ouverte et listée | 1, (2 doute) | partiel : onglets pH et Volume de la feuille Mesurer, minuteurs −5/+5, « Terminer et continuer », clôture et relevés finaux, clavier (`&keyboard=300`) non conclus (voir doutes) |
| feuille-brassin | — | non joué | — | non joué : demande une fixture dans l'app (`?dev-local` + `semer`) |
| brassins-liste | — | non joué | — | non joué : idem |
| brassins-recettes | — | non joué | — | non joué : idem |
| brassins-volumes | — | non joué | — | non joué : idem |
| atelier-houblons-v55 | — | non joué | — | non joué |

## 2) Constats (prouvés : capture ouverte et mesure)

1. **Brassin du jour · étape « Eau et sels » · curseur « Eau d'empâtage » glissé jusqu'à 63,8 °C, puis Enregistrer** · observé : la carte devient verte « ✓ Eau d'empâtage relevée à 2 h 58 », « 63,8 °C », « Enregistré · rien d'autre à relever sur cette étape », alors que la visée de la même carte, avant l'enregistrement, était 73 °C (9,2 °C d'écart) ; l'échelle du curseur affichait « 10 73 100 » avant, « 10 55 100 » après (la visée disparaît, 55 est le milieu de l'échelle) · attendu : un écart hors de la bande de visée se signale (ocre), comme à l'empâtage ; ne pas déclarer « dans la cible » une température sans verdict · capture : `j2-apres-enreg.png` (ouverte) · source probable : `src/domain/brewDay.ts` (verdict de température), `src/ui/BrewDayMeasurements.tsx` (carte relevée). Classe c, grave. Confirme et étend le constat 1 de la passe 1 (90 °C et 65,5 °C) : même défaut avec une valeur au curseur, sans saisie au clavier.

## 3) Doutes et non joué

- Feuille « Mesurer · Eau et sels » : le curseur « Température, curseur » mesure 392 px de large pour 390 de fenêtre, bord gauche à −1 px (mesure `e9`, ligne `S0`) : débord de 2 px, mineur, non vu sur une capture ouverte (`j6-sheet0.png` prise, non ouverte) : doute.
- Onglets « pH » et « Volume » de cette feuille : au toucher, le contenu est resté celui de « Température » (texte « Température (°C) », curseur à 0 px de large, donc caché) dans mon script `e9`. Je ne peux pas dire si c'est le geste (mon sélecteur) ou l'app : les captures `j6-ph.png`, `j6-ph-droite.png`, `j6-vol-droite.png` ne sont pas ouvertes. Dans une exécution précédente (`e7`), la feuille s'était ouverte directement sur l'onglet Volume (« ? L », curseur « Volume, curseur » à 18,5, 392 px) : le comportement dépend peut-être de l'étape courante. À rejouer par l'exécutant avec capture ouverte.
- « Terminer et continuer » : 40 appuis successifs dans `e9` n'ont pas changé l'étape affichée (« 1 Eau et sels » reste en tête), sans message lu. Cause non établie (confirmation non captée ? étape bloquée tant qu'un relevé manque ? mon appui touche-t-il le bouton du pied ?). Non constat.
- `m.dlg()` de `lib2.mjs` lit la dernière feuille du DOM : ce peut être la feuille « Note » cachée ; les textes de feuille de `e6` à `e8` sont à ignorer, ceux de `e9` (feuille repérée par « Fermer la saisie ») sont fiables.
- Page recette : aucun chevauchement, aucune édition coupée, ni `type=number`, aucun « NaN » ni « ? » (outils `chevauchements` et `editions`, repos et fin, tout ouvert). Captures ouvertes : `r1-exporter.png`, `r2-fin.png`, `r4-tout-ouvert-fin.png`, `r4-export-detail.png`, `r5-export-texte.png`. La feuille d'export est un pied de page de 336 px de haut ; « Télécharger .txt » finit à 8 px du bas de l'écran (fenêtre 844 px).
- Non joué : minuteurs −5/+5, clôture du brassage, relevés finaux, `&keyboard=300`, brassins (liste, recettes, volumes, feuille : densité, Budget, Dossier), atelier V5.5 (gestes de décision).

## 4) DEMANDE EXECUTANT (série mécanique, à confier à Haiku puis me renvoyer le résultat)

Racine : `C:\Users\mrspa\Documents\Brasserie\.claude\worktrees\eau-sels-1911-f5e6d2`. Serveur local déjà lancé (`http://localhost:3131`) ; ne pas le lancer ni l'arrêter. Chrome 9222 seulement via `work/missions/2026-11-26-nuit/outils/lib.mjs` (`ouvrir({ bloquerExterne: true })`, `fermer()` ; jamais `browser.close()`). Aucun fichier de `src/` ni `tests/` modifié ; sorties dans `couverture-E/`.

1. Brassage, onglets pH et Volume : `?preview=brew&view=brassage`, toucher « Mesurer » (pied), puis l'onglet « pH », capturer ; glisser le curseur à droite et à gauche (touchStart/touchMove/touchEnd), relever la valeur et l'affichage ; idem « Volume », puis « Taper la valeur », saisir `19,2` + Entrée, Enregistrer. Attendu : l'onglet change le contenu, valeur relue avec son unité (pH sans unité, volume en L), aucune valeur « ? » après saisie valide. Captures à ouvrir : une par onglet.
2. Minuteurs et « Terminer et continuer » : même banc, toucher « Empâter » dans la frise, chercher les boutons −5 / +5 (aria `moins 5`, `plus 5` ou texte), les toucher, relever la durée avant/après ; puis « Terminer et continuer » une fois par étape, noter ce qui change (étape, frise, message, boîte de confirmation) ; jusqu'à la clôture ; relever le bilan final (valeurs et unités, sommes). Banc clavier : refaire la phase « Préparer » avec `&keyboard=300`. Captures à ouvrir : une par phase, la clôture, le bilan.
3. Brassins en dev-local avec fixtures : `ouvrir({ bloquerExterne: true })`, `page.goto('http://localhost:3131/?dev-local')`, attendre 5 s, `import { semer } from 'file:///C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/eau-sels-1911-f5e6d2/work/missions/2026-11-21-workflows-app/principes/commun.mjs'` puis `await semer(page)` (pose ZZ TEST recette, 3 brassins, stock en mémoire). Ouvrir Brassins ; jouer : Brassins (filtres, recherche « ZZ », étoile, ouverture de la feuille : saisie d'une densité 1,030 puis 1,0300 puis 1,3 et lecture des messages, Budget, Dossier), Recettes (menu ⋯ de chaque entrée : chaque action, comparaison), Volumes (crayon du volume cible : 30 puis 0 puis vide, curseur, autre recette) avec avant/après de chaque valeur. Attendu : aucune valeur fausse, somme cohérente, `chevauchements()` et `editions()` vides. Captures à ouvrir : chaque feuille ouverte et chaque état d'erreur.
4. Page recette réelle : dans l'app `?dev-local`, ouvrir la recette semée, toucher Dupliquer : attendu l'assistant avec le nom « … (copie) » ; Annuler/Échap : rien d'écrit.
5. Atelier V5.5 (`?preview=hop-v55`) : jouer chaque geste de décision (boutons de l'onglet Décider) avec capture avant/après.

Sorties attendues : une ligne par geste « geste · avant · après · OK/KO », les captures ouvertes, `chevauchements`/`editions` à chaque état.
