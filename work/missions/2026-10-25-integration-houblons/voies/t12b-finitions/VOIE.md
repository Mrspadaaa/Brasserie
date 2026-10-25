# Voie t12b-finitions — l'étape Houblons de l'app, ses écarts réglés (#170)

Mission : `work/missions/2026-10-25-integration-houblons/MISSION.md`. Agent : concepteur (Opus), car c'est ce qu'il voit.
Plancher à enrichir : l'étape 3 du wizard, drapeau `hopV4` allumé, est déjà sa maquette choisie (t12-ma-biere, accepté par le
critique). On n'en change pas le dessin ; on règle ce qui reste, listé dans `voies/t12-ma-biere/RESULTAT.md` § Écarts et dans #170.

## À faire
1. **Le « + » flottant de l'app sur « Suivant — Levure »** (écart 5) : dans le wizard, le bouton flottant de l'app ne couvre plus
   « Suivant ». Il se cache dans l'étape, ou se décale au-dessus de la barre du bas. Une seule règle pour les 7 étapes, sans rien
   casser ailleurs.
2. **L'en-tête « ‹ Houblons 3/7 »** (écart 2). Il a dit « Text header inutile » (24.10) sur la maquette. Dans l'étape 3 drapeau allumé,
   l'en-tête se réduit au retour et au repère d'étape compact (par exemple « ‹ 3/7 »), comme la coquille de sa maquette. Les autres
   étapes ne changent pas.
3. **L'inconnu jamais à 0** : sur une recette vide ou sans données, l'étape n'affiche ni « OG NaN » ni « IBU 0 ». Elle écrit « ? »
   (PRODUCT.md : « refuse d'inventer un chiffre » ; D14).
4. **Une URL qui ouvre l'étape 3** pour les contrôles de ses choix (`controle-choix.mjs --url`, T14), en `?dev-local` sur fixtures,
   jamais sur des données réelles. Par exemple `?dev-local&etape=houblons`.
5. **Les deux rouges hérités** : `tests/unit/designTokens.test.ts` (`Ajouter.tsx:155` `text-cave-300`, `briques.tsx:35`
   `text-cave-600`) et `scripts/audit_inputs.mjs` (l'`<input>` brut d'`Ajouter.tsx:114`). Les teintes passent par les jetons du
   thème (`src/theme/themes.css`), et le champ par `Input` ou `NumberInput` de l'app, même rendu.
6. Hors voie, à ne pas faire ici : l'appui long vers la fiche (écart 7, T13 #173), les écarts de données (écart 3, honnêtes).

## Règles transversales (à tenir)
- Règle n° 1 : sa maquette choisie, telle quelle (`work/refonte-frontend/v4/choix/ecrans.json`, `controle-choix.mjs`).
- Thème : clair par défaut, cave au bouton (#144, fait). Jamais `type="number"` (`cerveau/produit/saisie-mobile.md`).
- Normalisation D68 : en « Au style », lecture au style et échelle au moment ; en « Absolu », aucune normalisation.
- Drapeau éteint : rien ne change (l'atelier V5.5 reste).
- Pas de données réelles, pas de Gemini, pas de déploiement.

## Possède
`src/ui/hopIndex/`, `src/pages/BrewWizard.tsx`, `src/pages/PageShell.tsx`, `src/components/`, `src/App.tsx`,
`tests/unit/`, `tests/integration/`, `work/missions/2026-10-25-integration-houblons/voies/t12b-finitions/`.
Fichiers de travail dans `os.tmpdir()`. `git status --short` à la fin.

## Méthode
`choix-app.mjs` (à écrire) sert l'app (`scripts/with_server.mjs`, `?dev-local`, `VITE_HOP_V4=on`) et lance
`controle-choix.mjs --url=<adresse de l'étape 3> --ecran=etape-houblons` ; il imprime la dernière ligne du contrôle.

Écrire d'abord `verifier.mjs` dans ce dossier. Il joue l'app dans Chrome (`scripts/with_server.mjs`, `?dev-local`,
`VITE_HOP_V4=on`, comme t12-ma-biere), mesure les points 1 à 4 et lance les tests ciblés. Il doit échouer sur HEAD (L13).
Puis corriger, rejouer, capturer (390 × 844 : repos, recette vide, bas de l'étape avec « Suivant ») et ouvrir les captures.
Retour en une ligne ; RESULTAT.md avec preuves, captures regardées et ce qui reste.
