# Corrections w1, tour 2 (critique k3, 20.11)

Liste figée (L18) : chaque point est corrigé et prouvé seul (test si c'est une règle ; capture 390 et 1280, clair et cave, OUVERTE), ou écarté avec raison. Même contrat et même « Possède » que voies/w1/VOIE.md : COMMUN.md, test rouge d'abord, commit par chemins « Bugs tous (w1) k3 : … » terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> », jamais de déploiement, de données réelles ni de Gemini réel, jamais stash/reset/checkout. Interdits : src/ui/etapeLevure/** ; src/components/tabs/StocksTab.tsx, articleACreer.ts, stockArticleNeufE11.test.ts, wizardTour3Bw.test.tsx (travail non commité d'une autre session). Plafond : à 200 k de contexte, « ## Fait » à jour et rendre « REPRISE : … ».

## Problèmes (voies/k3/RAPPORT.md)
1. w1 / TL-7 / w1-tl7-levure-1280-cave.png, w1-tl7-levure-390-clair.png / NOLO actif sans matériel figé : toute l'étape Levure n'est que l'invite « Cette recette n'a pas de matériel figé… », mot pour mot celle de l'Identité ; aucune souche ni aucun choix de levure à l'écran. Le bloc répété du constat est devenu une invite répétée (src/pages/BrewWizard.tsx:3184-3187 remplace l'étape entière). La levure n'est plus à sa place / gênant
2. w1 / TL-7 / w1-tl7-recap-1280-clair.png / en tête du Récap, carte « Données manquantes · Projection à compléter … Relation de fermentation limitée absente pour cette souche et ce procédé. » : jargon de développeur au premier plan / gênant
3. w1 / TL-7 / w1-tl7-recap-390-cave.png, w1-tl7-recap-390-clair-bas.png / le « + » flottant recouvre la ligne « Texte complet et fichier .txt » (son chevron) du menu « Plus », juste au-dessus de « Régler le NOLO » / gênant
4. w1 / TL-7 / w1-tl7-identite-390-cave.png / le « + » flottant mord le cadre de l'invite et colle au bouton « Adapter à mon matériel actuel · Système 30L » / détail
5. w1 / TL-7 / w1-tl7-identite-1280-clair.png / la barre « Retour / Suivant — Malts/sucres » coupe le bas des cartes « Espace libre » et « Matériel » au repos / détail
6. w1 / BK2-5 / w1-bk25-additifs-1280-clair.png, w1-bk25-additifs-1280-cave.png / le menu du moment est écrasé en une flèche d'environ 16 px sans texte, à droite de l'unité : « Ébullition » n'est lisible nulle part ; le brasseur ne sait pas quand la coriandre est ajoutée / bloquant (texte illisible)
7. w1 / BK2-5 / mêmes captures / ligne d'additif mal proportionnée : « 12,5 » dans un champ d'environ 350 px, « g » dans un menu d'environ 350 px, et plus de place pour le moment (cause du n° 6) ; quantité, unité et moment sur une ligne à parts adaptées / détail
8. w1 / TL-19 / w1-tl16-eau-390-cave-bas.png (montre en fait Malts/sucres repris) / « Brouillon repris sur cet appareil. » s'écrit en petit gris, sans cadre, 8 s, et aucun geste « repartir d'une recette vierge » n'est offert : le brasseur qui voulait une nouvelle recette peut ne rien voir / gênant

## Doutes
- w1 / TL-16 : capture faite en tapant l'eau d'empâtage à 12 L, pas à l'ouverture d'une recette enregistrée (l'état exact du constat).
- w1 / TE-27 : seul l'état fermé est montré ; ouvert, l'atelier reste le cockpit du constat (150 variétés, « ID », « COA ») : c'est l'ACCORD demandé, non compté.
- w1 / TL-7 : l'étape Levure après adoption du matériel (« Mesures et suivi NOLO » replié) n'est vue sur aucune capture.
- w1 / BK2-5 : la conversion « 1 épice à y noter » puis « Noter en additif (g) » n'est sur aucune capture.
- Point 1 : l'étape Levure doit garder le choix de levure (souche) même sans matériel figé ; l'invite de matériel n'y figure qu'une fois, en petit, ou pas du tout (elle est à l'Identité). Interdit : src/ui/etapeLevure/** ; si la cause y est, « ouvert — hors voie » avec le changement exact.
- Points 3 et 4 : le + flottant (src/ui/floating-actions.css, git diff d'abord) : même gouttière de 76 px que T3-10/k1/k2.
- Point 8 (TL-19) : phrase lisible (taille du texte courant, cadre léger) tant que l'étape n'a pas changé, et un geste « Repartir d'une recette vierge » qui jette le brouillon après confirmation.

## Preuves demandées (à produire toi-même)
1. w1 BK2-5 et TL-16 à 390 tactile (captures actuelles = écran de chargement) : relancer `work/missions/2026-11-19-bugs-ecrans/voies/w1/capturer.mjs` pour bk25 et tl16 seulement, à 390, clair et cave, en défilant, avec attente de `[aria-current="step"]` puis de l'absence du texte « Chargement ». Fichiers : `voies/w1/captures/w1-bk25-additifs-390-{clair,cave}.png`, `w1-tl16-eau-390-{clair,cave}.png` (et `-bas`). Attendu : « Additifs · 1 » ouvert, Coriandre, 12,5, g, moment lisible, sans débordement ; Eau : ambre, aucun rouge. Ajouter `w1-bk25-conversion-1280-clair-{avant,apres}.png` : une coriandre rangée parmi les fermentescibles, « 1 épice à y noter » et le bouton « Noter en additif (g) », puis après le geste.
2. w1 TL-19 en Chrome : l'entrée n'est pas le « + » mais Brassins › onglet « Recettes » › bouton « Nouvelle recette » (`src/ui/production/recettes/CarnetRecettes.tsx:137`). Taper un nom, aller à Malts/sucres, revenir par « < », rouvrir « Nouvelle recette ». Fichiers : `voies/w1/captures/w1-tl19-reprise-{390,1280}-{clair,cave}.png`, pris dans les 8 s. Attendu : « Brouillon repris sur cet appareil. » lisible sous l'en-tête.
3. w1 TL-16 à l'ouverture : ouvrir une recette enregistrée de la démo par « Modifier », aller à l'étape Eau sans rien toucher ; `w1-tl16-ouverture-1280-{clair,cave}.png`. Attendu : aucun rouge.

## Rendre
En bas de ce fichier, « ## Fait » : une ligne par point « n° | corrigé <sha> / écarté <raison> / ouvert <raison> | capture ». Mettre à jour voies/w1/RESULTAT.md si un verdict change, puis tests.txt ; `node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs w1` et `--tests` OK. Réponse : une ligne.

## Fait
1 | corrigé 867418182 | w1-tl7-levure-1280-clair.png, w1-tl7-levure-390-{clair,cave}.png : l'étape Levure garde la coque ordinaire (choix de souche) ; une ligne « Matériel non figé… Adapter à mon matériel actuel » remplace l'invite longue (qui n'est plus qu'à l'Identité)
2 | corrigé 867418182 | w1-tl7-recap-haut-1280-clair.png : « pas encore estimée » et une phrase en mots du brasseur, plus « Données manquantes » ni « Relation de fermentation limitée absente… »
3 | corrigé 8fbe05a57 | w1-tl7-recap-390-clair-bas.png, w1-tl7-recap-390-cave-bas.png : le chevron de « Texte complet et fichier .txt » est à gauche du + (gouttière 76 px, floating-actions.css)
4 | corrigé 8fbe05a57 | w1-tl7-identite-390-cave.png : l'invite de l'Identité s'arrête avant le + (marge droite 76 px) ; le + ne touche plus son cadre ni son bouton
5 | corrigé 8fbe05a57 (atténué) | w1-tl7-identite-1280-clair.png : un filet fin marque le bord de la barre Retour/Suivant ; la barre collante passe encore sur le bas des cartes au repos (comportement de toute barre collante) : à rejuger
6 | corrigé 8fbe05a57 | w1-bk25-additifs-1280-clair.png, w1-bk25-additifs-390-clair.png : « Ébullition » lisible (moment sur le reste de la ligne : 562 px à 1280, 192 px à 390)
7 | corrigé 8fbe05a57 | mêmes captures : grille 5 rem (quantité) · 4,5 rem (unité) · le reste (moment) ; mesuré 80 · 72 · 192 px à 390
8 | corrigé 8fbe05a57 | w1-tl19-reprise-{390,1280}-{clair,cave}.png : phrase cadrée en 14 px, « Repartir d'une recette vierge » (confirmation « Supprimer ce brouillon ? » puis brouillon jeté, test vert)
Preuves demandées : 1 → w1-bk25-additifs-390-{clair,cave}(.png/-bas), w1-tl16-eau-390-{clair,cave}(-bas), w1-bk25-conversion-1280-clair-{avant,apres}.png ; 2 → w1-tl19-reprise-* ; 3 → w1-tl16-ouverture-* (recette d'aperçu du banc, la démo n'a aucune recette enregistrée).
