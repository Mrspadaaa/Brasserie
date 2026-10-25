# Voie t12c-app-reel — l'étape Houblons qui marche sur ses vraies recettes, et un haut d'écran commun aux 7 étapes

Agent : auteur (Sonnet). Mission : `work/missions/2026-10-25-integration-houblons/MISSION.md`.

## Ses mots, en jouant avec l'app déployée (25.10, soir)
- « Pas grand chose de fonctionnement pour cette v0, les ibu et tout se mettent pas à jour. »
- « Aussi le header, bouger ces info sur le haut. » Sur `captures/brasseur-entete.jpg`, « Brouillon repris sur cet appareil » est barré
  et une flèche monte « Abandonner » dans l'en-tête, à côté de l'import et du thème.
- « Et mettre le header et info en haut comme pour les hautes seul houblons a une variation.... Changé ça »
- « Tout cette partie là » : sur `captures/brasseur-haut-houblons.jpg`, tout le haut de l'étape Houblons est entouré (en-tête « ‹ 3/7 »,
  onglets, « Brouillon repris… / Abandonner », bandeau IBU · OG · EBC).

Ouvre les trois captures de `captures/` avant de commencer.

## À faire
1. **L'IBU et le reste se calculent et se mettent à jour (D152).** Sa recette réelle donne IBU « ? », EBC « ? » et « ? IBU » par
   ajout. La recette : Saaz (US) 8 g à 120′ (α 3–4,5 %), Saaz (CZ) 22 g à 10′ (α 2–5 %), 5 kg de grain (Flocons d'avoine 1 kg,
   Maris Otter 4 kg), OG 1,047, EBC 7,9 à l'étape 2. Le volume est celui de sa recette.
   - Trouve la cause, sans rien supposer : `src/ui/hopIndex/maBiere/Base.tsx` `ibuIncalculable`, la conversion
     `src/domain/hopIndex/v4/recipeConversion.ts`, le pont du brouillon. Pistes : un α en plage traité comme inconnu, l'EBC non lu
     des grains, le volume absent.
   - L'IBU se calcule avec un α en plage (une plage d'IBU, ou une valeur « ~ » au milieu, comme ailleurs dans l'app), l'EBC vient
     des grains, et les valeurs suivent chaque geste (grammes, moment, ajout, retrait).
   - L'inconnu reste « ? » seulement quand une donnée manque vraiment. Jamais 0 inventé, jamais « ? » pour une donnée qu'on a.
   - Écris d'abord un test d'intégration sur une recette fixture qui reproduit la sienne. Il doit échouer sur HEAD, puis passer.
     Aucune donnée réelle : la fixture est écrite à la main d'après sa capture.
2. **Un haut d'écran commun aux 7 étapes du wizard.** C'est sa règle : « seul houblons a une variation.... Changé ça ».
   - L'étape Houblons reprend l'en-tête des autres, « ‹ Houblons 3/7 » comme « ‹ Fermentescibles 2/7 », avec les onglets.
     Ça annule la réduction « ‹ 3/7 » de T12b, qu'il refuse maintenant.
   - Elle reprend aussi le même bandeau d'informations que les autres étapes (Grain · OG · IBU · EBC). Le grand bandeau
     IBU · OG · EBC propre à l'étape disparaît.
   - Dans les 7 étapes, la ligne « Brouillon repris sur cet appareil. » disparaît. « Abandonner » monte dans l'en-tête, à droite,
     à côté de l'import et du thème, compact (DESIGN.md, docs/ui-compacte.md).
3. Le drapeau éteint et les autres écrans ne changent pas, hors ces deux points.

## Règles
- Frontend : lis `.claude/rules/affinee-frontend.md` (la densité utile, le compact), PRODUCT.md et DESIGN.md pour ce point.
- Pas de `git mv`. Fichiers de travail dans `os.tmpdir()`.
- Une autre voie (t13-fiche-suggerer) touche en ce moment `src/ui/hopIndex/maBiere/` pour l'appui long et l'entrée Comparer, ainsi
  que `HopToolLayer.tsx`. Ne touche pas à ces gestes ni à `HopToolLayer.tsx`. Si tu dois modifier un fichier de `maBiere/` autre
  que `Base.tsx`, dis lequel dans RESULTAT.md.

## Critères
- Le nouveau test d'intégration : rouge sur HEAD, vert après.
- `npx vitest run tests/unit/hopIndexV4 tests/integration` : vert, hors des échecs connus de #177.
- `npm run build` vert.
- Captures dans Chrome (`scripts/with_server.mjs`, `VITE_HOP_V4=on`, `?dev-local`), en 390 × 844, à ouvrir :
  - l'étape 2 et l'étape 3 côte à côte (même haut d'écran) ;
  - l'étape 3 avec une recette comme la sienne (IBU calculé) ;
  - l'étape 3 après +5 g sur un houblon (IBU mis à jour).

## Possède
`src/ui/hopIndex/maBiere/Base.tsx`, `src/domain/hopIndex/v4/recipeConversion.ts` et le pont du brouillon s'il est ailleurs (dis
lequel), `src/pages/BrewWizard.tsx`, `src/pages/PageShell.tsx`, `tests/unit/`, `tests/integration/`, `tests/fixtures/` (fixture écrite
à la main), `work/missions/2026-10-25-integration-houblons/voies/t12c-app-reel/`.

Retour en une ligne ; RESULTAT.md avec la cause trouvée, les preuves et les captures ouvertes.
