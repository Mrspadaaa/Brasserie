OK partiel — B1 n° 4, 5, 6, 8, 9, 12 corrigés (rouge sur HEAD puis vert) ; n° 7, 10, 11, 14 non corrigés (maquette ou hors périmètre, à montrer ou à décider)

Build figé de HEAD : `%TEMP%/ferm-head`. Build après correctifs : `%TEMP%/ferm-apres`. `controle-ajout.mjs` (n° 2 et 3) reste `AJOUT OK`.
Vitest `tests/unit/fermentescibles` : 50/50 verts. `tsc` : 0 erreur dans fermentescibles. Aucun commit, aucun serveur, aucun appel réseau.

## Une ligne par n°

| n° | État | Fichiers | Contrôle (HEAD → après) | Capture ouverte (`banc-critique/caps/`) |
|----|------|----------|-------------------------|------------------------------------------|
| 4 | corrigé | `modele.ts` (`chercherAilleurs`, `Candidat.famille`), `Ajout.tsx`, `EtapeFermentescibles.tsx` (`ajouterLigne(…, fam)`) | `controle-4-dext.mjs` : DEXT ECHEC (« dext » → seulement Carapils ; « dextrose » ↵ créait un grain « dextrose » à stock zéro) → DEXT OK (Dextrose proposé « 5 kg en stock · sucre », « dextrose » ↵ ajoute la ligne en famille Sucre) | `4-apres.png` |
| 5 | corrigé | `CouleurChamp.tsx`, `correctifs.css` | `controle-5-couleur.mjs` : COULEUR ECHEC (champ passé à la ligne 1, valeur disparue) → COULEUR OK (reste sur la ligne 0, `aria-invalid`, « 2000 » lisible en rouge, infobulle « de 1 à 1500 EBC » ; « 5 » ↵ passe ensuite à la suivante) | `5-apres.png` |
| 6 | corrigé | `EtapeFermentescibles.tsx` (pile `annules`), `correctifs.css` | `controle-6-retraits.mjs` : RETRAITS ECHEC (plus d'« Annuler » après le 1er) → RETRAITS OK (« Annuler » rend le dernier, puis le précédent ; ordre d'origine retrouvé) | `6-apres.png` |
| 7 | non corrigé, **à montrer** | — | `controle-7-fab.mjs` (mesure) : ECHEC sur HEAD et sur ma version (voir plus bas) | `7-head-huit-bas.png` (capture prise trop tôt, voir note) |
| 8 | corrigé | `correctifs.css` | `controle-8-contraste.mjs` : ECHEC cave « empâtage » 2,16 / 2,02, « kg » 2,16 / 2,02, part 4,33 → OK (6,34 et 5,92 ; clair inchangé, ≥ 5,1) | `8-apres.png` (cave) |
| 9 | corrigé | `correctifs.css` | `controle-9-jours.mjs` : ECHEC (J0, J7, J14 sous le cadre de focus) → OK en clair, cave et 1280 | `9-apres-cave.png`, `9-apres-clair.png`, `9-apres-1280.png` |
| 10 | non corrigé, hors périmètre | — | — | `v7/s1/p7-s1-1280.png` contre `%TEMP%/affinee-test-ferm/captures/10-repos-pc1280-clair.png` |
| 11 | non corrigé, **à montrer** | — | — | `v7/s1/p7-s1-huit-repos.png` |
| 12 | corrigé | `modele.ts` (`arrondiKg`, `graduationsPiste`, `GRADUATIONS_MAX`), `EtapeFermentescibles.tsx` (`setKg` dit le plafond), `bornes.test.ts` | `controle-12-masse.mjs` : ECHEC ×3 (0,004 gardé, bandeau « 6,504 kg », 99999 sans mot, 201 graduations) → OK (masse 0, bandeau « 6,5 kg », « Masse limitée à 10 000 kg par ligne. », 31 graduations à 15 000, un trait tous les 500 kg) | `12-apres.png` |
| 14 | pas fait | — | — | — |

## Ce que j'ai fait et pourquoi

- **n° 4.** « dext » donne bien Carapils par le nom courant « dextrin malt » (rang 0, pas une faute) : il reste en tête dans Grain, Dextrose arrive juste derrière, marqué « · sucre ». Les noms de la famille du champ passent toujours devant ; un nom trouvé à une lettre près passe derrière ceux des autres rayons. L'ajout se fait dans la famille de l'article (Dextrose en Sucre, avec ses 100 % ferm.). Le champ garde sa famille. Un article du rayon « Sucre » se range dans Sucre, sauf si son nom est celui d'une famille (Lactose → famille Lactose). `tests/unit/fermentescibles/etape.test.tsx` (« dext » en famille Sucre → Dextrose) est resté vert.
- **n° 5.** Valeur hors 1–1500 : Entrée est refusé, le champ reste. Quitter le champ (toucher ailleurs) abandonne toujours sans rien retenir. Le texte dit « 1 à 1500 EBC » en infobulle seulement (la pastille fait 36 px).
- **n° 6.** Une pile : « Annuler » rend le dernier retrait, la ligne grisée montre « … retiré · 1 de plus », un second « Annuler » rend le précédent. Les 6 s repartent à chaque geste. Pas de second composant : c'est la même ligne « retiré » de sa maquette.
- **n° 8.** Seulement la ligne choisie **qui a un voile de teinte** (couleur connue), en sombre : moment, part, « kg » prennent le blanc de la ligne. Les lignes sans voile gardent le gris de la maquette (déjà 5,4).
- **n° 9.** Le cadre de focus de toute la boîte du curseur est retiré ; le focus se lit sur le pouce (bord blanc en sombre, noir en clair). Les repères J0 J7 J14 descendent de 4 px (dans l'espace libre de la case, la hauteur ne change pas) ; 4 px d'air de plus entre « J+ 14 » et la piste.
- **n° 12.** Masse au centième de kg (10 g) : « 0,004 » devient 0, « à compléter » ; un 12,3456 devient 12,35. Le test `bornes.test.ts` a été réécrit en conséquence (il fixait 3 décimales et 200 graduations). Plafond : le message est dans la zone d'alertes de sa maquette (même `.fer-alerte`), 6 s ou jusqu'à la masse suivante. Graduations : au plus 60 intervalles, pas rond (1, 2, 5, 10…), gros trait sur une valeur ronde.
- Les styles neufs sont dans `src/ui/fermentescibles/correctifs.css` (chargé par `EtapeFermentescibles`), parce que `src/pages/recipe-wizard.css` n'est pas dans mon périmètre. Si tu préfères les fusionner dans le CSS de la maquette, c'est un copier-coller.

## À montrer ou à décider (je n'ai pas corrigé)

- **n° 7 (« + » flottant) — à montrer.** Sa maquette porte le même bouton fixe, en bas à droite (`.r4b-fab`), et `p7-s1-huit-repos.png` le montre sur le coin de la piste et à côté de « Suivant » : c'est le lanceur de la coquille, pas l'écran. Ce que j'ai vérifié : `PageShell` donne `data-floating-actions-gap="page-row"` quand la page a des actions de fin (Retour/Suivant) : la fin du contenu ne réserve alors **plus** sa hauteur, et seul « Suivant » laisse le coin (`pr-16`). Donc le bas du plateau reste sous le bouton quand la page tient presque dans l'écran. Options à lui montrer en mini maquettes : (A) garder tel quel (sa maquette) ; (B) ramener la réserve de 4,5 rem en fin de contenu pour cette étape (changement dans `PageShell.tsx` ou `BrewWizard.tsx`, hors de ma possession) ; (C) docker le bouton dans l'en-tête, comme l'atelier de l'eau (`water/workshop.css`, `body[data-has-water-sels] .floating-actions`). Ma recommandation : B, c'est la plus petite et elle ne bouge pas sa maquette. `controle-7-fab.mjs` MESURE ce que le bouton couvre en haut et en bas de page (repos, huit lignes, champ ouvert) ; il est **rouge sur HEAD et sur ma version**, c'est voulu tant que ce choix n'est pas fait. Limite : mes mesures de défilement ont varié d'un lancer à l'autre (mise en page à 807 puis 876 px de haut, `main` défile ou non selon le moment) ; la capture `7-head-huit-bas.png` est prise avant la fin de la mise en page et ne montre pas le bas de page. À refaire par un exécutant avec une attente de 2 s.
- **n° 10 (un seul nom d'écran) — hors de mes fichiers, et sa maquette tranche.** Sa maquette, à 390 comme à 1280, écrit **« Fermentescibles 2/7 »** en titre et **« Malts/sucres »** dans le fil. L'app est pareille à 390 mais, à 1280, le titre devient « Nouvelle recette » et le fil « Fermentescibles » (le fil longue forme, `label` au lieu de `shortLabel`). Le correctif touche `BrewWizard.tsx` : le `title` du `PageShell` (ligne 2220) et le choix `shortLabel` de l'étape (ligne 450) à toute largeur. « Grain 8 kg » au bandeau est dans sa maquette (« Grain 9,05 kg »). À confier à une voie qui possède `BrewWizard.tsx`.
- **n° 11 (« Lactose » comme famille) — à montrer.** Sa maquette montre elle-même une ligne « Lactose · [Lactose] » (`p7-s1-huit-repos.png`), donc ce n'est pas un écart de l'app. Option à lui montrer : appeler la famille « Sucre de lait », ou ne pas répéter l'étiquette quand elle porte le nom de la ligne. Aussi : en Sucre, la liste propose bien Dextrose, Lactose et Sucre candi sur ce stock (le « seul Lactose » de L9 est infirmé).
- **n° 14 (reprise du brouillon) — pas fait, vérifié.** La reprise existe dans `BrewWizard.tsx` : `readRecipeDraftState(draftKey)`, `writeRecipeDraft` (4 appels), l'étape est mémorisée (`restoredDraft?.step`), et l'écran « Reprendre le brouillon » (ligne 549) s'affiche quand le brouillon n'est pas celui de la recette ouverte. Ce qui manque : après rechargement l'app retombe sur le tableau de bord, donc le wizard n'est jamais rouvert, donc la reprise ne se déclenche pas. C'est la navigation d'`App.tsx` (l'écran ouvert ne survit pas à un rechargement), un chantier hors de `src/ui/fermentescibles/` et qu'on ne prouve pas sans données (le bac de test est `?dev-local`, sans clé de brouillon). DÉCISION À PRENDRE : faut-il un bandeau « Reprendre le brouillon de … » sur le tableau de bord ? Recommandation : oui, une voie à part qui possède `App.tsx` et le tableau de bord, avec un brouillon réel en local.

## Essais utilisés

Un essai par contrôle (rouge sur HEAD du premier coup, vert après correctif), sauf : n° 4, une relance après un test unitaire existant (« dext » en famille Sucre) : l'ordre des résultats a été corrigé pour que la famille du champ passe devant. n° 8 : première version du correctif trop large (toute ligne choisie), resserrée aux lignes à voile. n° 5 : 2e build pour tenir « 2000 » dans la pastille (13 px).

## Doutes et limites

- Fixture `?malts=` simulée (stock de la maquette), pas le stock réel du brasseur.
- Le contrôle 9 vérifie les boîtes (pas de chevauchement) ; l'œil a vérifié en sombre (`9-apres-cave.png`). Ouvert aussi : `12-apres.png`, `8-apres.png`, `5-apres.png`, `6-apres.png`, `4-apres.png`.
- Aucun contrôle n'a joué le clavier mobile réel.
- La fiche « Carapils 4 » du n° 4 : la pastille EBC et l'icône ↵ se touchent dans la tuile (comportement d'avant, non touché).
- `src/pages/recipe-wizard.css` n'a pas été modifié ; un correctif de style y serait plus propre, mais hors de ma possession.

DEMANDE EXECUTANT : aucune.

CONNAISSANCE : `PageShell` donne `data-floating-actions-gap="page-row"` (pas « page ») dès qu'une page a des actions de fin ; la réserve de 4,5 rem en fin de contenu n'existe alors plus. Le wizard en a (Retour/Suivant) : seul « Suivant » laisse le coin au lanceur. Une mesure de défilement dans cet écran demande 2 s d'attente après le chargement.

LEÇON PROPOSÉE : un contrôle de recouvrement par le bouton flottant doit d'abord regarder si la maquette a le même recouvrement ; sinon on « corrige » le lanceur de la coquille. Et une mesure de mise en page se prend après 2 s, pas 500 ms (l'étape se replie d'elle-même en 400 ms).
